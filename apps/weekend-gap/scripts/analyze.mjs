import { open } from 'node:fs/promises';
import {
  DEFAULT_SCENARIO, scenarioFromJSON, runSimulation, dashboardToMarkdown,
} from '../src/model.js';

const usage = `Weekend Gap offline analysis (synthetic AUD only)
  simulate SCENARIO [--format json|markdown]
Use - instead of a file to read stdin. JSON goes to stdout; errors to stderr.
Scenario files may be partial raw objects or supported scenario envelopes.
Omitted fields use model defaults; invalid or adjusted values are rejected.
`;

async function readText(path, limit = 250000) {
  if (path === '-') {
    const chunks = [];
    let size = 0;
    for await (const chunk of process.stdin) {
      size += chunk.length;
      if (size > limit) throw new Error(`Input exceeds ${limit} bytes.`);
      chunks.push(chunk);
    }
    return Buffer.concat(chunks).toString('utf8').replace(/^\uFEFF/, '');
  }
  const file = await open(path, 'r');
  try {
    if (!(await file.stat()).isFile()) throw new Error('Input must be a regular file.');
    const buffer = Buffer.alloc(limit + 1);
    let size = 0;
    while (size < buffer.length) {
      const { bytesRead } = await file.read(buffer, size, buffer.length - size, null);
      if (!bytesRead) break;
      size += bytesRead;
    }
    if (size > limit) throw new Error(`Input exceeds ${limit} bytes.`);
    return buffer.subarray(0, size).toString('utf8').replace(/^\uFEFF/, '');
  } finally { await file.close(); }
}

function parseScenario(text) {
  let parsed;
  try { parsed = JSON.parse(text); } catch { throw new Error('Invalid JSON.'); }
  const result = scenarioFromJSON(text);
  if (!result.scenario || result.errors.length) throw new Error(result.errors.join(' '));
  const raw = Object.hasOwn(parsed, 'scenario') ? parsed.scenario : parsed;
  if (raw !== parsed && Object.keys(parsed).some(key => !['format', 'version', 'scenario'].includes(key))) {
    throw new Error('Unknown scenario envelope field.');
  }
  if (Object.keys(raw).some(key => !Object.hasOwn(DEFAULT_SCENARIO, key) || typeof raw[key] !== typeof DEFAULT_SCENARIO[key])) {
    throw new Error('Unknown scenario field or incorrect field type.');
  }
  return result.scenario;
}

async function scenario(path) { return parseScenario(await readText(path)); }

function argumentsFor(args, count, formats = ['json']) {
  let format = formats[0];
  if (args.length === count + 2 && args[count] === '--format') {
    format = args[count + 1];
    args = args.slice(0, count);
  }
  if (args.length !== count || !formats.includes(format)) throw new Error('Invalid arguments or format. Run with --help.');
  if (args.filter(value => value === '-').length > 1) throw new Error('Stdin can be read only once.');
  return { args, format };
}

async function main([command, ...rest]) {
  if (command === '--help' && !rest.length) return usage;
  switch (command) {
    case 'simulate': {
      const { args: [path], format } = argumentsFor(rest, 1, ['json', 'markdown']);
      const input = await scenario(path);
      const result = runSimulation(input);
      return format === 'markdown' ? dashboardToMarkdown(input) : { scenario: result.scenario, summary: result.summary };
    }
    default: throw new Error('Unknown command. Run with --help.');
  }
}

try {
  const result = await main(process.argv.slice(2));
  process.stdout.write(typeof result === 'string' ? result : JSON.stringify(result, null, 2) + '\n');
} catch (error) {
  // Filesystem errors include local paths; keep diagnostics actionable without echoing inputs.
  process.stderr.write(`Weekend Gap: ${error.code ? `Cannot read input (${error.code}).` : error.message}\n`);
  process.exitCode = 1;
}
