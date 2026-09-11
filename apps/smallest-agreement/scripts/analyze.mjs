import { createReadStream } from 'node:fs';
import { findSmallestAgreement, proposalFromWorkshopDocument } from '../src/model.js';

const usage = 'Usage: node scripts/analyze.mjs solve <proposal.json|->';

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

try {
  const [command, path, ...args] = process.argv.slice(2);
  if (command === '--help' && path === undefined) {
    process.stdout.write(usage + '\n');
  } else {
    if (command !== 'solve' || !path || args.length) throw new TypeError(usage);
    const proposal = proposalFrom(parseJson(await readText(path)));
    process.stdout.write(JSON.stringify(solve(proposal), null, 2) + '\n');
  }
} catch (error) {
  process.stderr.write(JSON.stringify({ status: 'error', error: error.message }) + '\n');
  process.exitCode = 2;
}
