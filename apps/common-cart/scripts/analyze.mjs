#!/usr/bin/env node
import { open, unlink } from 'node:fs/promises';
import { constants } from 'node:fs';
import { parseArgs } from 'node:util';
import { evaluateMarket, evaluateOffer, groupExclusionReasons, unitsToNextTier, capacityBar } from '../src/model.js';
import { createMerchantReport, createMerchantResidualReport } from '../src/model.js';
import { CART_REVIEW_TOOLS, analyzeCartReview } from '../src/model.js';
import { createCartReviewPacket, replayCartReviewPacket } from '../src/model.js';
import { compareScenarios, compareRoomsByOfferIdentity } from '../src/model.js';
import { validateScenario } from '../src/model.js';

const LIMIT = 1048576;
const help = `Common Cart offline analyst (Node 20+)
Usage: node scripts/analyze.mjs market --input scenario.json [--output result.json]
       node scripts/analyze.mjs offer --input scenario.json --offer O01
       node scripts/analyze.mjs merchant --input scenario.json
       node scripts/analyze.mjs tools
       node scripts/analyze.mjs review --input scenario.json --tool withdrawal
       node scripts/analyze.mjs packet --input scenario.json --tool coverage --output packet.json
       node scripts/analyze.mjs replay --input packet.json
       node scripts/analyze.mjs compare --input before.json --against after.json
       node scripts/analyze.mjs sweep --input scenario.json --offer O01 --field capacity --values '[10,20,30]'
Use --input - for piped UTF-8 JSON. Output defaults to stdout.
Inputs are limited to 1 MiB. Output files must not exist.
Results are organizer-private, synthetic planning aids, never orders.
`;

function localPath(path) {
  if (!path || /^\\\\|^\/\//.test(path) || path.split(/[\\/]/).some(part => /^(con|prn|aux|nul|com[0-9]|lpt[0-9])(?:\.|$)/i.test(part)) || /:/.test(path.replace(/^[A-Za-z]:[\\/]/, ''))) {
    throw new Error('Use an ordinary local file path, not a device, stream, or network path.');
  }
  return path;
}

async function readText(path) {
  let bytes;
  if (path === '-') {
    if (process.stdin.isTTY) throw new Error('Pipe input to stdin or supply a file.');
    const chunks = [];
    let size = 0;
    for await (const chunk of process.stdin) {
      size += chunk.length;
      if (size > LIMIT) throw new Error('Input exceeds 1 MiB.');
      chunks.push(chunk);
    }
    bytes = Buffer.concat(chunks);
  } else {
    const file = await open(localPath(path), constants.O_RDONLY | constants.O_NONBLOCK);
    try {
      const stat = await file.stat();
      if (!stat.isFile()) throw new Error('Input must be a regular file.');
      if (stat.size > LIMIT) throw new Error('Input exceeds 1 MiB.');
      bytes = Buffer.alloc(LIMIT + 1);
      let size = 0;
      while (size < bytes.length) {
        const { bytesRead } = await file.read(bytes, size, bytes.length - size, null);
        if (!bytesRead) break;
        size += bytesRead;
      }
      if (size > LIMIT) throw new Error('Input exceeds 1 MiB.');
      bytes = bytes.subarray(0, size);
    } finally { await file.close(); }
  }
  try { return new TextDecoder('utf-8', { fatal: true }).decode(bytes); }
  catch { throw new Error('Input must be valid UTF-8.'); }
}

function json(text) {
  try { return JSON.parse(text); }
  catch { throw new Error('Input must contain valid JSON.'); }
}

async function writeResult(value, path) {
  const text = JSON.stringify(value, null, 2) + '\n';
  if (!path || path === '-') {
    await new Promise((resolve, reject) => process.stdout.write(text, error => error ? reject(error) : resolve()));
    return;
  }
  const file = await open(localPath(path), 'wx', 0o600);
  try { await file.writeFile(text); }
  catch (error) { await file.close(); await unlink(path); throw error; }
  await file.close();
}

async function main() {
  const { values, positionals, tokens } = parseArgs({ allowPositionals: true, tokens: true, options: {
    input: { type: 'string' }, output: { type: 'string' }, help: { type: 'boolean' }, offer: { type: 'string' },
    tool: { type: 'string' },
    against: { type: 'string' },
    field: { type: 'string' }, values: { type: 'string' },
  } });
  const names = tokens.filter(token => token.kind === 'option').map(token => token.name);
  if (new Set(names).size !== names.length) throw new Error('Duplicate options are not allowed.');
  if (values.help) { process.stdout.write(help); return; }
  const [command] = positionals;
  const allowed = { market: [], offer: ['offer'], merchant: [], tools: [], review: ['tool'], packet: ['tool'], replay: [], compare: ['against'], sweep: ['offer', 'field', 'values'] };
  if (positionals.length !== 1 || !Object.hasOwn(allowed, command)) throw new Error('Choose a supported command. Use --help for usage.');
  for (const name of names) if (!['input', 'output'].includes(name) && !allowed[command].includes(name)) throw new Error(`--${name} is not supported by ${command}.`);
  if (command === 'tools') {
    if (values.input) throw new Error('tools does not accept --input.');
    await writeResult(CART_REVIEW_TOOLS, values.output); return;
  }
  if (!values.input) throw new Error('--input is required.');
  if (values.input === '-' && values.against === '-') throw new Error('Only one input may use stdin.');
  const scenario = json(await readText(values.input));
  let result;
  if (command === 'market') result = evaluateMarket(scenario);
  if (command === 'review' || command === 'packet') {
    if (!values.tool) throw new Error('--tool is required. Use tools to list reviews.');
    result = command === 'packet' ? createCartReviewPacket(scenario, values.tool) : analyzeCartReview(scenario, values.tool);
  }
  if (command === 'replay') result = replayCartReviewPacket(scenario);
  if (command === 'compare') {
    if (!values.against) throw new Error('--against is required.');
    const other = json(await readText(values.against));
    result = { summary: compareScenarios(scenario, other), offers: compareRoomsByOfferIdentity(scenario, other) };
  }
  if (command === 'sweep') {
    if (!['capacity', 'minimumUnits', 'unitPrice', 'shippingPerBuyer', 'deliveryDays'].includes(values.field)) throw new Error('--field must name a supported numeric offer field.');
    const baseline = validateScenario(scenario);
    if (!baseline.offers.some(offer => offer.id === values.offer)) throw new Error('--offer must identify an existing offer.');
    const points = json(values.values);
    if (!Array.isArray(points) || points.length < 1 || points.length > 25 || points.some(value => typeof value !== 'number' || !Number.isFinite(value))) throw new Error('--values must contain 1 to 25 finite JSON numbers.');
    const candidates = points.map(value => validateScenario({ ...baseline, offers: baseline.offers.map(offer => offer.id === values.offer ? { ...offer, [values.field]: value } : offer) }));
    result = { currency: baseline.currency, offerId: values.offer, field: values.field,
      note: 'Independent counterfactuals with all other terms fixed; no capacity, price or merchant commitment is verified.',
      rows: candidates.map((candidate, index) => {
        const market = evaluateMarket(candidate);
        const offer = market.results.find(entry => entry.offer.id === values.offer);
        return { value: points[index], winnerOfferId: market.winner?.offer.id ?? null, fulfilledUnits: market.winner?.fulfilledUnits ?? 0, totalCost: market.winner?.totalCost ?? null,
          offer: { qualifies: offer.qualifies, fulfilledUnits: offer.fulfilledUnits, totalCost: offer.qualifies ? offer.totalCost : null, activeTierIndex: offer.activeTierIndex } };
      }) };
  }
  if (command === 'merchant') result = { market: createMerchantReport(scenario), residual: createMerchantResidualReport(scenario) };
  if (command === 'offer') {
    if (!values.offer) throw new Error('--offer is required.');
    result = { evaluation: evaluateOffer(scenario, values.offer), exclusions: groupExclusionReasons(scenario, values.offer), nextTier: unitsToNextTier(scenario, values.offer), capacity: capacityBar(scenario, values.offer) };
  }
  await writeResult(result, values.output);
}

process.stdout.on('error', error => {
  process.stderr.write(error.code === 'EPIPE' ? 'Output pipe closed.\n' : 'Output failed.\n');
  process.exitCode = 1;
});
main().catch(error => {
  process.stderr.write(`Common Cart: ${String(error.message).replace(/[\x00-\x1f\x7f-\x9f]/g, ' ')}\n`);
  process.exitCode = 1;
});
