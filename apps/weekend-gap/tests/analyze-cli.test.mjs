import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { fixture, oracle } from './review-fixture.mjs';

const cli = fileURLToPath(new URL('../scripts/analyze.mjs', import.meta.url));
function run(args, input = fixture()) {
  return spawnSync(process.execPath, [cli, ...args], { input: typeof input === 'string' ? input : JSON.stringify(input), encoding: 'utf8', timeout: 10000, maxBuffer: 2 ** 22 });
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
