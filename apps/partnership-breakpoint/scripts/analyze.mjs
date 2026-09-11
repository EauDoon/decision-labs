import { readFileSync } from 'node:fs';
import { assertValidConfiguration, calculatePartnership, evaluateStressGrid, stressGridCsv } from '../src/model.js';
import { solveFeeForAllHold, solveMinimumShareToHold, solveMinimumVolumeToHold } from '../src/model.js';
import { compareImportedCase, compareThreeSnapshots } from '../src/model.js';
import { PARTNERSHIP_REVIEW_TOOLS, createPartnershipReviewPacket, replayPartnershipReviewPacket } from '../src/model.js';
import { materializeStressCase, applyStressProposal } from '../src/model.js';
import { participantsFromRosterText, participantsToCsv } from '../src/model.js';

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
Review tools: ${PARTNERSHIP_REVIEW_TOOLS.map(tool => tool.id).join(', ')}
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
