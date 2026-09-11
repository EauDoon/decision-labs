import { open } from 'node:fs/promises';
import {
  DEFAULT_SCENARIO, scenarioFromJSON, runSimulation, dashboardToMarkdown,
  compareScenarios,
  planReserve,
  timelineToCSV, analyzeTimeline,
  runSensitivity,
  previewWindowShift,
  compareDemandProfiles,
  libraryFromJSON,
  WEEKEND_REVIEW_TOOLS, createWeekendReviewPacket,
  replayWeekendReviewPacket,
} from '../src/model.js';

const usage = `Weekend Gap offline analysis (synthetic AUD only)
  simulate SCENARIO [--format json|markdown]
  compare BASELINE CANDIDATE
  reserve SCENARIO TARGET_PERCENT DEADLINE_HOUR
  timeline SCENARIO [--format json|csv]
  sensitivity SCENARIO FIELD
  shift SCENARIO GATE START_DELTA_HOURS END_DELTA_HOURS
  profiles SCENARIO
  batch LIBRARY
  review SCENARIO TOOL
  replay PACKET
Review tools: ${WEEKEND_REVIEW_TOOLS.map(tool => tool.id).join(', ')}
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

function parseJSON(text) {
  try { return JSON.parse(text); } catch { throw new Error('Invalid JSON.'); }
}

function parseScenario(text) {
  const parsed = parseJSON(text);
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

function number(value) {
  if (!/^-?(?:\d+(?:\.\d*)?|\.\d+)$/.test(value) || !Number.isFinite(Number(value))) {
    throw new Error('Expected a finite decimal number.');
  }
  return Number(value);
}

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
    case 'replay': {
      const { args: [path] } = argumentsFor(rest, 1);
      return replayWeekendReviewPacket(parseJSON(await readText(path, 1048576)));
    }
    case 'review': {
      const { args: [path, tool] } = argumentsFor(rest, 2);
      return createWeekendReviewPacket(await scenario(path), tool);
    }
    case 'batch': {
      const { args: [path] } = argumentsFor(rest, 1);
      const text = await readText(path);
      const raw = parseJSON(text);
      const library = libraryFromJSON(text);
      if (!library.scenarios || library.errors.length) throw new Error(library.errors.join(' '));
      if (!raw.scenarios.length || Object.keys(raw).some(key => !['format', 'version', 'scenarios'].includes(key))) {
        throw new Error('Library requires 1 to 12 scenarios and only format, version, scenarios fields.');
      }
      const inputs = raw.scenarios.map((value, index) => {
        try { return parseScenario(JSON.stringify(value)); }
        catch (error) { throw new Error(`Library entry ${index + 1}: ${error.message}`); }
      });
      return { rows: inputs.map((input, index) => {
        const simulation = runSimulation(input);
        return { index: index + 1, scenario: input, summary: simulation.summary };
      }), note: 'Input order is preserved, including duplicate names. Compare demand and arrival profiles before interpreting outcomes. No scenario is ranked.' };
    }
    case 'profiles': {
      const { args: [path] } = argumentsFor(rest, 1);
      const input = await scenario(path);
      return { scenario: input, totalDemandAud: input.redemptionDemandAud, rows: compareDemandProfiles(input),
        note: 'The same total demand is redistributed across three synthetic arrival profiles. All other assumptions stay fixed.' };
    }
    case 'shift': {
      const { args: [path, gate, start, end] } = argumentsFor(rest, 4);
      const input = await scenario(path);
      return { scenario: input, ...previewWindowShift(input, gate, number(start), number(end)),
        note: 'Requested shifts are clamped to valid model windows. Inspect applied assumptions. No operating schedule is changed.' };
    }
    case 'sensitivity': {
      const { args: [path, field] } = argumentsFor(rest, 2);
      const input = await scenario(path);
      return { scenario: input, field, rows: runSensitivity(input, field),
        note: 'Five one-factor synthetic experiments. Requested values can hit model caps; inspect effectiveValue and adjusted. This is not optimization.' };
    }
    case 'timeline': {
      const { args: [path], format } = argumentsFor(rest, 1, ['json', 'csv']);
      const input = await scenario(path);
      return format === 'csv' ? timelineToCSV(input) : { scenario: input, ...analyzeTimeline(input) };
    }
    case 'reserve': {
      const { args: [path, target, deadline] } = argumentsFor(rest, 3);
      const input = await scenario(path);
      return { scenario: input, plan: planReserve(input, number(target), number(deadline)) };
    }
    case 'compare': {
      const { args: [left, right] } = argumentsFor(rest, 2);
      const comparison = compareScenarios(await scenario(left), await scenario(right));
      return { baseline: comparison.baseline.scenario, candidate: comparison.candidate.scenario,
        baselineSummary: comparison.baseline.summary, candidateSummary: comparison.candidate.summary,
        changes: comparison.changes, deltas: comparison.deltas,
        sameDemand: comparison.baseline.scenario.redemptionDemandAud === comparison.candidate.scenario.redemptionDemandAud
          && comparison.baseline.scenario.demandProfile === comparison.candidate.scenario.demandProfile,
        note: 'Deltas are candidate minus baseline. Different demand can explain reduced queues; this is not a strategy ranking.' };
    }
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
