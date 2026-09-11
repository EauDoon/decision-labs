import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { fixture, oracle } from './review-fixture.mjs';
import { WEEKEND_REVIEW_TOOLS, replayWeekendReviewPacket } from '../src/model.js';

const cli = fileURLToPath(new URL('../scripts/analyze.mjs', import.meta.url));
function run(args, input = fixture()) {
  return spawnSync(process.execPath, [cli, ...args], { input: typeof input === 'string' || Buffer.isBuffer(input) ? input : JSON.stringify(input), encoding: 'utf8', timeout: 10000, maxBuffer: 2 ** 22 });
}
function result(args, input) {
  const runResult = run(args, input);
  assert.equal(runResult.status, 0, runResult.stderr);
  assert.equal(runResult.stderr, '');
  return JSON.parse(runResult.stdout);
}
function fails(args, input) {
  const output = run(args, input);
  assert.equal(output.status, 1);
  assert.equal(output.stdout, '');
  assert.match(output.stderr, /Weekend Gap:/);
}

test('comparison preserves signed deltas and rejects two stdin sources', () => {
  const dir = mkdtempSync(join(tmpdir(), 'weekend-cli-'));
  try {
    const baseline = join(dir, 'baseline.json');
    writeFileSync(baseline, JSON.stringify({ ...fixture(), reserveCashAud: 0 }));
    const output = result(['compare', baseline, '-']);
    assert.equal(output.deltas.totalSettledAud, 72);
    assert.equal(output.deltas.finalQueuedAud, -72);
    assert.equal(output.deltas.hoursToFirstSettlement, null);
    assert.deepEqual(output.changes, [{ field: 'reserveCashAud', baseline: 0, candidate: 72 }]);
    assert.equal(output.sameDemand, true);
    assert.equal(result(['compare', baseline, '-'], { ...fixture(), redemptionDemandAud: 144 }).sameDemand, false);
    fails(['compare', '-', '-']);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('reserve planner exposes reachable cents and unreachable early deadlines', () => {
  const plan = result(['reserve', '-', '50', '72']).plan;
  assert.equal(plan.status, 'reachable');
  assert.equal(plan.minimumReserveAud, 36);
  assert.ok(oracle({ ...fixture(), reserveCashAud: 35.99 }).at(-1).settled < 36);
  const early = result(['reserve', '-', '100', '1']).plan;
  assert.equal(early.status, 'unreachable');
  assert.equal(early.minimumReserveAud, null);
  assert.equal(result(['reserve', '-', '0', '72']).plan.minimumReserveAud, 0);
  for (const [target, deadline] of [['101', '72'], ['50', '0'], ['50', '1.5'], ['', '72'], ['0x10', '72'], ['NaN', '72']]) fails(['reserve', '-', target, deadline]);
});

test('hourly JSON and CSV retain interval versus checkpoint semantics', () => {
  const expected = oracle(fixture());
  const output = result(['timeline', '-']);
  assert.equal(output.rows.length, 72);
  output.rows.forEach((row, index) => {
    assert.equal(row.hour, index);
    assert.equal(row.endHour, index + 1);
    assert.equal(row.queuedAud, expected[index].queue);
    assert.equal(row.settledAud, expected[index].paid);
  });
  assert.equal(output.queueAudHours, expected.reduce((sum, row) => sum + row.queue, 0));
  const csv = run(['timeline', '-', '--format', 'csv']);
  assert.equal(csv.status, 0);
  const lines = csv.stdout.trim().split(/\r?\n/);
  assert.equal(lines.length, 74);
  assert.match(lines[0], /^checkpoint_hour,local_time,interval_start_hour/);
  assert.equal(lines[1].split(',')[2], '');
  assert.equal(Number(lines.at(-1).split(',')[6]), expected.at(-1).queue);
  fails(['timeline', '-', '--format', 'html']);
});

test('sensitivity retains effective caps and independently checked reserve effects', () => {
  const output = result(['sensitivity', '-', 'reserveCashAud']);
  assert.deepEqual(output.rows.map(row => row.multiplier), [.5, .75, 1, 1.25, 1.5]);
  for (const row of output.rows) assert.equal(row.summary.totalSettledAud, oracle({ ...fixture(), reserveCashAud: row.effectiveValue }).at(-1).settled);
  const capped = result(['sensitivity', '-', 'reserveCashAud'], { ...fixture(), reserveCashAud: 10000 });
  assert.equal(capped.rows.at(-1).requestedValue, 15000);
  assert.equal(capped.rows.at(-1).effectiveValue, 10000);
  assert.equal(capped.rows.at(-1).adjusted, true);
  for (const field of ['redemptionDemandAud', 'issuerThroughputAudPerHour', 'fxDepthAudPerHour', 'payoutThroughputAudPerHour']) assert.equal(result(['sensitivity', '-', field]).rows.length, 5);
  fails(['sensitivity', '-', 'bankOpenStartHour']);
});

test('window preview shows applied bounds and the independently computed settlement change', () => {
  const output = result(['shift', '-', 'bank', '8', '-7']);
  assert.equal(output.applied.bankOpenStartHour, 8);
  assert.equal(output.applied.bankOpenEndHour, 17);
  assert.equal(output.candidate.totalSettledAud, oracle({ ...fixture(), bankOpenStartHour: 8, bankOpenEndHour: 17 }).at(-1).settled);
  assert.equal(output.scenario.bankOpenStartHour, 0);
  const capped = result(['shift', '-', 'payout', '-10', '10']);
  assert.equal(capped.candidate.startHour, 0);
  assert.equal(capped.candidate.endHour, 24);
  assert.equal(capped.deltas.totalSettledAud, 0);
  fails(['shift', '-', 'fx', '1', '1']);
  fails(['shift', '-', 'bank', '.5', '1']);
});

test('arrival-profile comparison holds demand fixed and retains no-settlement nulls', () => {
  const output = result(['profiles', '-']);
  assert.equal(output.totalDemandAud, 72);
  assert.deepEqual(output.rows.map(row => row.demandProfile), ['flat', 'fridayBurst', 'mondayRush']);
  assert.equal(output.rows[0].totalSettledAud, oracle(fixture()).at(-1).settled);
  for (const row of output.rows) assert.ok(Math.abs(row.totalSettledAud + row.finalQueuedAud - 72) < 1e-8);
  const empty = result(['profiles', '-'], { ...fixture(), reserveCashAud: 0 });
  for (const row of empty.rows) {
    assert.equal(row.totalSettledAud, 0);
    assert.equal(row.hoursToFirstSettlement, null);
    assert.ok(Math.abs(row.finalQueuedAud - 72) < 1e-8);
  }
  fails(['profiles', '-', 'extra']);
});

test('library batch validates atomically and preserves ordered duplicate names', () => {
  const input = { format: 'weekend-gap-library', version: 1, scenarios: [fixture(), { ...fixture(), reserveCashAud: 0 }] };
  const rows = result(['batch', '-'], input).rows;
  assert.deepEqual(rows.map(row => row.index), [1, 2]);
  assert.equal(rows[0].scenario.name, rows[1].scenario.name);
  assert.equal(rows[0].summary.totalSettledAud, 72);
  assert.equal(rows[1].summary.finalQueuedAud, 72);
  assert.equal(result(['batch', '-'], { ...input, scenarios: Array.from({ length: 12 }, fixture) }).rows.length, 12);
  for (const bad of [{ ...input, scenarios: [] }, { ...input, version: 2 }, { ...input, extra: true }, { ...input, scenarios: [...input.scenarios, { ...fixture(), typo: 1 }] }, { ...input, scenarios: Array.from({ length: 13 }, fixture) }]) fails(['batch', '-'], bad);
  assert.equal(result(['batch', '-'], input).rows.length, 2);
});

test('CLI creates native replayable packets for every timing review', () => {
  for (const { id } of WEEKEND_REVIEW_TOOLS) {
    const packet = result(['review', '-', id]);
    assert.deepEqual(replayWeekendReviewPacket(packet), packet);
    assert.equal(packet.tool, id);
    assert.deepEqual(packet.scenario, fixture());
  }
  const days = result(['review', '-', 'days']).review.rows;
  assert.deepEqual(days.map(row => row[1]), [9, 24, 24, 15]);
  assert.equal(days.reduce((sum, row) => sum + row[3], 0), oracle(fixture()).at(-1).settled);
  fails(['review', '-', 'unknown']);
  fails(['review', '-', 'days'], { ...fixture(), reserveCashAud: -1 });
  assert.match(run(['--help']).stdout, /reserve-hours/);
  const malformed = run(['batch', '-'], '{"SYNTHETIC_PRIVATE_INPUT":');
  assert.equal(malformed.status, 1);
  assert.doesNotMatch(malformed.stderr, /SYNTHETIC_PRIVATE_INPUT/);
});

test('packet replay recomputes results and fails closed on tampering then recovers', () => {
  const packet = result(['review', '-', 'days']);
  assert.deepEqual(result(['replay', '-'], packet), packet);
  for (const change of [
    p => { p.review.rows[0][3]++; },
    p => { p.scenario.reserveCashAud++; },
    p => { p.inputJSON += ' '; },
    p => { p.extra = true; },
    p => { p.version = 2; },
    p => { p.review.note = 'Guaranteed payout'; },
    p => { p.tool = 'unknown'; },
  ]) {
    const bad = structuredClone(packet);
    change(bad);
    fails(['replay', '-'], bad);
  }
  fails(['replay', '-'], ' '.repeat(1048577));
  fails(['replay', '-'], fixture());
  const dir = mkdtempSync(join(tmpdir(), 'weekend-cli-'));
  try {
    const path = join(dir, 'review.json');
    writeFileSync(path, JSON.stringify(packet));
    assert.deepEqual(result(['replay', path]), packet);
    const oversize = join(dir, 'oversize.json');
    writeFileSync(oversize, ' '.repeat(1048577));
    fails(['replay', oversize]);
    fails(['simulate', dir]);
  } finally { rmSync(dir, { recursive: true, force: true }); }
  assert.deepEqual(result(['replay', '-'], packet), packet);
});

test('CLI simulation matches a separate 1 AUD/hour ledger and reads files or stdin', () => {
  const expected = oracle(fixture()).at(-1);
  const output = result(['simulate', '-']);
  assert.equal(output.summary.totalSettledAud, expected.settled);
  assert.equal(output.summary.finalQueuedAud, expected.queue);
  assert.equal(output.summary.totalSettledAud + output.summary.finalQueuedAud, 72);
  const dir = mkdtempSync(join(tmpdir(), 'weekend-cli-'));
  try {
    const path = join(dir, 'scenario with spaces.json');
    writeFileSync(path, '\uFEFF' + JSON.stringify({ format: 'weekend-gap-scenario', version: 1, scenario: fixture() }));
    assert.deepEqual(result(['simulate', path]), output);
    assert.match(run(['simulate', path, '--format', 'markdown']).stdout, /Synthetic/);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('CLI fails closed on malformed inputs and recovers on the next valid run', () => {
  for (const input of ['{', 'null', '[]', { ...fixture(), reserveCashAud: '1' }, { ...fixture(), reserveCashAud: -1 }, { ...fixture(), typo: 1 }, ' '.repeat(250001)]) fails(['simulate', '-'], input);
  for (const args of [[], ['bogus'], ['simulate'], ['simulate', '-', '--format', 'yaml'], ['simulate', '-', 'extra'], ['simulate', 'missing-scenario.json']]) fails(args);
  assert.equal(run(['--help']).status, 0);
  assert.equal(result(['simulate', '-']).summary.totalDemandAud, 72);
});

test('all JSON inputs reject duplicate decoded keys and invalid UTF-8', () => {
  const text = JSON.stringify(fixture());
  for (const duplicate of [text.replace('"reserveCashAud":72', '"reserveCashAud":0,"reserveCashAud":72'),
    text.replace('"reserveCashAud":72', '"reserveCashAud":0,"reserveCashA\\u0075d":72')]) {
    fails(['simulate', '-'], duplicate);
    fails(['review', '-', 'days'], duplicate);
    fails(['batch', '-'], '{"format":"weekend-gap-library","version":1,"scenarios":[' + duplicate + ']}');
  }
  const packet = result(['review', '-', 'days']);
  fails(['replay', '-'], JSON.stringify(packet).replace('"version":1', '"version":2,"version":1'));
  const invalid = Buffer.from(text);
  invalid[invalid.indexOf('Synthetic')] = 255;
  fails(['simulate', '-'], invalid);
  fails(['review', '-', 'days'], invalid);
  const directory = mkdtempSync(join(tmpdir(), 'weekend-cli-'));
  try {
    const file = join(directory, 'invalid.json');
    writeFileSync(file, invalid);
    fails(['simulate', file]);
  } finally { rmSync(directory, { recursive: true, force: true }); }
  const withSyntaxInText = { ...fixture(), name: 'String { "key": 1, "key": 2 }' };
  assert.equal(result(['simulate', '-'], withSyntaxInText).scenario.name, withSyntaxInText.name);
  assert.equal(result(['batch', '-'], { format: 'weekend-gap-library', version: 1, scenarios: [fixture(), fixture()] }).rows.length, 2);
});

test('local-file boundary rejects URI and Windows device or stream inputs', () => {
  const uri = run(['simulate', 'file://scenario.json']);
  assert.equal(uri.status, 1);
  assert.match(uri.stderr, /local file/);
  if (process.platform === 'win32') {
    for (const path of ['NUL', 'con.txt', 'COM1', 'CONIN$', 'scenario.json:stream']) {
      const rejected = run(['simulate', path]);
      assert.equal(rejected.status, 1);
      assert.equal(rejected.stdout, '');
      assert.match(rejected.stderr, /local file/);
    }
  }
  assert.equal(result(['simulate', '-']).summary.totalDemandAud, 72);
});
