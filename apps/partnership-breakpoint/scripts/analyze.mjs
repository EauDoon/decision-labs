import { openSync, readSync, closeSync } from 'node:fs';
import { assertValidConfiguration, calculatePartnership, evaluateStressGrid, stressGridCsv } from '../src/model.js';
import { solveFeeForAllHold, solveMinimumShareToHold, solveMinimumVolumeToHold } from '../src/model.js';
import { compareImportedCase, compareThreeSnapshots } from '../src/model.js';
import { PARTNERSHIP_REVIEW_TOOLS, createPartnershipReviewPacket, replayPartnershipReviewPacket } from '../src/model.js';
import { materializeStressCase, applyStressProposal } from '../src/model.js';
import { participantsFromRosterText, participantsToCsv } from '../src/model.js';
import { redactConfiguration } from '../src/model.js';

const HELP = `Offline Partnership Breakpoint analysis (Node.js 20+)
Usage: node scripts/analyze.mjs COMMAND INPUT [ARGUMENTS]
  summary INPUT                 Validate and calculate a saved scenario
  stress INPUT [--csv] [--failed-only]  Inspect compound cases or export CSV
  solve INPUT fee                Find the common fee floor
  solve INPUT share|volume ID    Find a participant's holding boundary
  compare CURRENT FIRST [SECOND]  Align two or three scenarios by participant ID
  review INPUT TOOL             Create a replayable constraint review packet
  replay INPUT                  Verify an existing review packet
  case INPUT CASE_ID            Export a compound case as new baseline inputs
  proposal INPUT                Export a rechecked fixed-share scenario
  roster INPUT [ROSTER_FILE]     Export CSV, or replace roster from CSV/TSV
  redact INPUT                  Remove labels and remap IDs in a portable scenario
  batch [--require-hold] INPUT...  Analyze all inputs; optional current-hold gate
Review tools: ${PARTNERSHIP_REVIEW_TOOLS.map(tool => tool.id).join(', ')}
INPUT is a JSON file or - for standard input. Output is JSON or requested CSV.
Errors are JSON on stderr, exit 1. Success is exit 0.
Batch includes per-input errors on stdout (exit 1), or unmet hold gates (exit 2).
Results describe declared inputs, not probabilities or financial advice.
Nonfinite calculated numbers are serialized as null, never as zero.
`;

function readText(path) {
  const limit = 1048576;
  const buffer = Buffer.alloc(limit + 1);
  let descriptor, length = 0;
  try {
    descriptor = path === '-' ? 0 : openSync(path, 'r');
    while (length <= limit) {
      const count = readSync(descriptor, buffer, length, buffer.length - length, null);
      if (count === 0) break;
      length += count;
    }
  }
  catch { throw new Error('Cannot read input. Check the file path and permissions.'); }
  finally { if (descriptor !== undefined && descriptor !== 0) closeSync(descriptor); }
  if (length > limit) throw new Error('Input exceeds 1 MiB. Supply one bounded scenario, packet, or roster.');
  try { return new TextDecoder('utf-8', { fatal: true }).decode(buffer.subarray(0, length)); }
  catch { throw new Error('Input must contain valid UTF-8 text.'); }
}

function readJSON(path) {
  try {
    const text = readText(path);
    const value = JSON.parse(text);
    // Syntax is already valid. Walk object scopes and quoted tokens only;
    // decoded keys catch equivalent escapes without reimplementing JSON grammar.
    const objects = [];
    for (let i = 0; i < text.length; i += 1) {
      if (text[i] === '{') objects.push(new Set());
      else if (text[i] === '}') objects.pop();
      else if (text[i] === '"') {
        const start = i;
        while (++i < text.length) {
          if (text[i] === '\\') i += 1;
          else if (text[i] === '"') break;
        }
        let next = i + 1;
        while (next < text.length && /\s/.test(text[next])) next += 1;
        if (text[next] === ':') {
          const key = JSON.parse(text.slice(start, i + 1));
          const keys = objects.at(-1);
          if (keys.has(key)) throw new Error('Duplicate JSON object member. Remove repeated keys before analysis.');
          keys.add(key);
        }
      }
    }
    return value;
  }
  catch (error) {
    if (error instanceof SyntaxError) throw new Error('Invalid JSON. Supply a saved scenario as UTF-8 JSON.');
    throw error;
  }
}

function arity(args, minimum, maximum = minimum) {
  if (args.length < minimum || args.length > maximum) throw new Error('Wrong arguments. Run with --help for usage.');
}

const errorMessage = error => error.errors?.join(' ') ?? error.message;

function run(command, args) {
  switch (command) {
    case 'summary':
      arity(args, 1);
      return calculatePartnership(assertValidConfiguration(readJSON(args[0])));
    case 'stress': {
      arity(args, 1, 3);
      const flags = args.slice(1);
      if (new Set(flags).size !== flags.length || flags.some(flag => !['--csv', '--failed-only'].includes(flag))) {
        throw new Error('Stress accepts only --csv and --failed-only, once each.');
      }
      const config = assertValidConfiguration(readJSON(args[0]));
      const grid = evaluateStressGrid(config);
      const scenarios = flags.includes('--failed-only') ? grid.scenarios.filter(scenario => !scenario.viable) : grid.scenarios;
      return flags.includes('--csv') ? stressGridCsv(config, { scenarioIds: scenarios.map(scenario => scenario.id) })
        : { ...grid, scenarios, selectedCaseCount: scenarios.length };
    }
    case 'solve': {
      arity(args, 2, 3);
      const [input, axis, id] = args;
      if (!['fee', 'share', 'volume'].includes(axis)) throw new Error('Solve axis must be fee, share, or volume.');
      arity(args, axis === 'fee' ? 2 : 3);
      const config = assertValidConfiguration(readJSON(input));
      return axis === 'fee' ? solveFeeForAllHold(config)
        : axis === 'share' ? solveMinimumShareToHold(config, id) : solveMinimumVolumeToHold(config, id);
    }
    case 'compare': {
      arity(args, 2, 3);
      if (args.filter(path => path === '-').length > 1) throw new Error('Standard input can supply only one comparison scenario.');
      const configs = args.map(path => assertValidConfiguration(readJSON(path)));
      const currency = configs[0].deal.currency ?? '';
      if (configs.some(config => (config.deal.currency ?? '') !== currency)) throw new Error('Comparison requires matching currency labels; no currency conversion is performed.');
      return configs.length === 2 ? compareImportedCase(...configs) : compareThreeSnapshots(...configs);
    }
    case 'review':
      arity(args, 2);
      return createPartnershipReviewPacket(readJSON(args[0]), args[1]);
    case 'replay':
      arity(args, 1);
      return replayPartnershipReviewPacket(readJSON(args[0]));
    case 'case':
      arity(args, 2);
      return materializeStressCase(readJSON(args[0]), args[1]);
    case 'proposal':
      arity(args, 1);
      return applyStressProposal(readJSON(args[0]));
    case 'roster': {
      arity(args, 1, 2);
      if (args.filter(path => path === '-').length > 1) throw new Error('Standard input can supply only one roster input.');
      const config = assertValidConfiguration(readJSON(args[0]));
      if (args.length === 1) return participantsToCsv(config);
      const participants = participantsFromRosterText(readText(args[1]));
      return assertValidConfiguration({ ...config, participants });
    }
    case 'redact': {
      arity(args, 1);
      const config = redactConfiguration(readJSON(args[0]));
      config.participants.forEach((participant, index) => { participant.id = `participant-${index + 1}`; });
      return assertValidConfiguration(config);
    }
    case 'batch': {
      const requireHold = args[0] === '--require-hold';
      const inputs = requireHold ? args.slice(1) : args;
      if (!inputs.length || inputs.some(path => path.startsWith('--'))) throw new Error('Batch requires input files after the optional --require-hold flag.');
      if (inputs.filter(path => path === '-').length > 1) throw new Error('Standard input can supply only one batch scenario.');
      const results = inputs.map((path, index) => {
        try {
          const result = calculatePartnership(readJSON(path));
          return { inputIndex: index + 1, status: 'analyzed', viable: result.viable,
            effectiveVolume: result.effectiveVolume, totalRevenue: result.totalRevenue,
            totalProfit: result.totalProfit, firstBreakpoint: result.firstBreakpoint };
        } catch (error) { return { inputIndex: index + 1, status: 'invalid', error: errorMessage(error) }; }
      });
      const invalidCount = results.filter(result => result.status === 'invalid').length;
      const holdingCount = results.filter(result => result.viable === true).length;
      process.exitCode = invalidCount ? 1 : requireHold && holdingCount !== inputs.length ? 2 : 0;
      return { inputCount: inputs.length, analyzedCount: inputs.length - invalidCount, invalidCount, holdingCount,
        requireHold, gatePassed: requireHold ? invalidCount === 0 && holdingCount === inputs.length : null, results };
    }
    default: throw new Error('Unknown command. Run with --help for usage.');
  }
}

try {
  const [command, ...args] = process.argv.slice(2);
  if (command === '--help' && args.length === 0) process.stdout.write(HELP);
  else {
    const result = run(command, args);
    process.stdout.write(typeof result === 'string' ? result : `${JSON.stringify(result, null, 2)}\n`);
  }
} catch (error) {
  process.stderr.write(`${JSON.stringify({ error: errorMessage(error) })}\n`);
  process.exitCode = 1;
}
