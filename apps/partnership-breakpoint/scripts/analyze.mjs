import { readFileSync } from 'node:fs';
import { assertValidConfiguration, calculatePartnership } from '../src/model.js';

const HELP = `Offline Partnership Breakpoint analysis (Node.js 20+)
Usage: node scripts/analyze.mjs COMMAND INPUT [ARGUMENTS]
  summary INPUT                 Validate and calculate a saved scenario
INPUT is a JSON file or - for standard input. Output is JSON on stdout.
Errors are JSON on stderr, exit 1. Success is exit 0.
Results describe declared inputs, not probabilities or financial advice.
Nonfinite calculated numbers are serialized as null, never as zero.
`;

function readText(path) {
  try { return readFileSync(path === '-' ? 0 : path, 'utf8').replace(/^\uFEFF/, ''); }
  catch { throw new Error('Cannot read input. Check the file path and permissions.'); }
}

function readJSON(path) {
  try { return JSON.parse(readText(path)); }
  catch (error) {
    if (error instanceof SyntaxError) throw new Error('Invalid JSON. Supply a saved scenario as UTF-8 JSON.');
    throw error;
  }
}

function arity(args, minimum, maximum = minimum) {
  if (args.length < minimum || args.length > maximum) throw new Error('Wrong arguments. Run with --help for usage.');
}

function run(command, args) {
  switch (command) {
    case 'summary':
      arity(args, 1);
      return calculatePartnership(assertValidConfiguration(readJSON(args[0])));
    default: throw new Error('Unknown command. Run with --help for usage.');
  }
}

try {
  const [command, ...args] = process.argv.slice(2);
  if (command === '--help' && args.length === 0) process.stdout.write(HELP);
  else {
    const result = run(command, args);
    process.stdout.write(`${typeof result === 'string' ? result : JSON.stringify(result, null, 2)}\n`);
  }
} catch (error) {
  process.stderr.write(`${JSON.stringify({ error: error.errors?.join(' ') ?? error.message })}\n`);
  process.exitCode = 1;
}
