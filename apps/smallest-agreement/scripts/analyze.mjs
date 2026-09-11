import { createReadStream } from 'node:fs';
import { findSmallestAgreement, proposalFromWorkshopDocument, evaluatePackage, stressPackage, compareScenarioInputs } from '../src/model.js';

const usage = `Usage: node scripts/analyze.mjs <command> <input.json|-> [arguments]
  solve
  evaluate <option IDs separated by commas, in clause order>
  stress <option IDs> <support drops separated by commas>
  compare <second workshop.json>`;

async function readText(path, limit = 262144) {
  const stream = path === '-' ? process.stdin : createReadStream(path);
  const chunks = [];
  let bytes = 0;
  try {
    for await (const chunk of stream) {
      bytes += chunk.length;
      if (bytes > limit) throw new TypeError(`Input exceeds ${limit / 1024} KiB.`);
      chunks.push(chunk);
    }
  } catch (error) {
    if (error instanceof TypeError) throw error;
    throw new TypeError('Cannot read input file or stream.');
  }
  try { return new TextDecoder('utf-8', { fatal: true }).decode(Buffer.concat(chunks)); }
  catch { throw new TypeError('Input must be UTF-8.'); }
}

function parseJson(text) {
  try { return JSON.parse(text); }
  catch { throw new TypeError('Input must contain valid JSON.'); }
}

function checked(value) {
  if (value.status === 'invalid') throw new TypeError(value.errors.map(error => error.message ?? error).join(' '));
  return value;
}

function proposalFrom(raw) { return checked(proposalFromWorkshopDocument(raw)).proposal; }
function solve(proposal) { return findSmallestAgreement(proposal, { alternativesLimit: 5 }); }

function levels(text, maximum) {
  const parts = text.split(',');
  if (parts.length > 20 || parts.some(part => !part.trim() || !Number.isFinite(Number(part)) || Number(part) < 0 || Number(part) > maximum)) {
    throw new TypeError(`Supply 1 to 20 numeric levels from 0 to ${maximum}.`);
  }
  return parts.map(Number);
}

try {
  const [command, path, ...args] = process.argv.slice(2);
  if (command === '--help' && path === undefined) {
    process.stdout.write(usage + '\n');
  } else {
    const arity = { solve: 0, evaluate: 1, stress: 2, compare: 1 };
    if (!Object.hasOwn(arity, command) || !path || args.length !== arity[command]) throw new TypeError(usage);
    if (command === 'compare' && path === '-' && args[0] === '-') throw new TypeError('Only one comparison input may use stdin.');
    const inputText = await readText(path);
    const proposal = proposalFrom(parseJson(inputText));
    let output;
    switch (command) {
      case 'solve': output = solve(proposal); break;
      case 'evaluate': output = checked(evaluatePackage(proposal, args[0].split(','))); break;
      case 'stress': output = {
        method: 'Fixed package, all support scores reduced and clamped at zero; no reoptimization or probabilities.',
        rows: levels(args[1], 100).map(drop => checked(stressPackage(proposal, args[0].split(','), drop))),
      }; break;
      case 'compare': {
        const rightText = await readText(args[0]);
        const right = proposalFrom(parseJson(rightText));
        output = { inputs: compareScenarioInputs(proposal, right), before: solve(proposal), after: solve(right) };
        break;
      }
    }
    process.stdout.write(JSON.stringify(output, null, 2) + '\n');
  }
} catch (error) {
  process.stderr.write(JSON.stringify({ status: 'error', error: error.message }) + '\n');
  process.exitCode = 2;
}
