import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { clonePreset, parseCsv, calculatePartnership } from '../src/model.js';

const cli = fileURLToPath(new URL('../scripts/analyze.mjs', import.meta.url));
const run = (args, value) => spawnSync(process.execPath, [cli, ...args], {
  input: typeof value === 'string' ? value : JSON.stringify(value), encoding: 'utf8', timeout: 10000,
});
const output = (result, status = 0) => {
  assert.equal(result.status, status, result.stderr);
  if (status === 0) assert.equal(result.stderr, '');
  return JSON.parse(status === 1 ? result.stderr : result.stdout);
};
function files(t, values) {
  const directory = mkdtempSync(join(tmpdir(), 'partnership-cli-'));
  t.after(() => rmSync(directory, { recursive: true, force: true }));
  return values.map((value, index) => {
    const path = join(directory, `${index}.json`);
    writeFileSync(path, typeof value === 'string' ? value : JSON.stringify(value));
    return path;
  });
}

test('summary accepts file and BOM stdin; ledger matches independent arithmetic', (t) => {
  const config = clonePreset('balanced');
  const [path] = files(t, [config]);
  const result = output(run(['summary', path]));
  assert.deepEqual(output(run(['summary', '-'], '\uFEFF' + JSON.stringify(config))), result);
  const volume = Math.min(config.deal.monthlyVolume * (1 - (config.deal.volumeShockPct ?? 0) / 100), config.deal.addressableVolume);
  assert.equal(result.totalRevenue, volume * config.deal.feePerTransaction);
  config.participants.forEach((p, i) => {
    const expected = volume * config.deal.feePerTransaction * p.revenueShare - volume * p.variableCostPerTransaction - p.fixedMonthlyCost - p.riskCost;
    assert.ok(Math.abs(result.participants[i].monthlyProfit - expected) < 1e-7);
  });
});

test('summary rejects bad input and arguments, then recovers with valid JSON', () => {
  for (const [args, value, message] of [
    [['summary', '-'], '{', /Invalid JSON/],
    [['summary', '-'], {}, /Deal|deal/],
    [['summary', 'absent-scenario.json'], undefined, /Cannot read input/],
    [['summary'], undefined, /Wrong arguments/],
    [['summary', '-', 'extra'], {}, /Wrong arguments/],
    [['unknown', '-'], {}, /Unknown command/],
  ]) {
    const result = run(args, value);
    assert.equal(result.stdout, '');
    assert.match(output(result, 1).error, message);
  }
  assert.equal(output(run(['summary', '-'], clonePreset('balanced'))).viable, true);
  assert.match(run(['--help']).stdout, /summary INPUT/);
});

test('stress exports complete and failing compound cases without changing grid counts', () => {
  const config = clonePreset('balanced');
  config.participants[0].name = '=SUM(1,2)';
  const grid = output(run(['stress', '-'], config));
  assert.equal(grid.caseCount, 27);
  assert.equal(grid.selectedCaseCount, 27);
  const failed = output(run(['stress', '-', '--failed-only'], config));
  assert.equal(failed.caseCount, grid.caseCount);
  assert.equal(failed.passCount, grid.passCount);
  assert.equal(failed.selectedCaseCount, grid.caseCount - grid.passCount);
  assert.ok(failed.scenarios.every(scenario => !scenario.viable));
  const csv = run(['stress', '-', '--csv', '--failed-only'], config);
  assert.equal(csv.status, 0, csv.stderr);
  const rows = parseCsv(csv.stdout.trim());
  assert.equal(rows.length, 1 + failed.selectedCaseCount * config.participants.length);
  assert.ok(rows.slice(1).filter(row => row[6] === config.participants[0].id).every(row => row[7].startsWith("'=")));
  const first = grid.scenarios[0];
  assert.equal(first.totalProfit, output(run(['summary', '-'], config)).totalProfit);
  for (const flags of [['--typo'], ['--csv', '--csv']]) assert.match(output(run(['stress', '-', ...flags], config), 1).error, /only/);
  config.stress = { volumeDropPct: 0, volumeGrowthPct: 0, feeDropPct: 0, variableCostRisePct: 0 };
  const empty = output(run(['stress', '-', '--failed-only'], config));
  assert.equal(empty.selectedCaseCount, 0);
  assert.equal(empty.caseCount, 1);
});

test('solvers expose independently calculated fee, share and volume boundaries', () => {
  const config = clonePreset('balanced');
  const p = config.participants[0];
  const fee = output(run(['solve', '-', 'fee'], config));
  const expectedFee = Math.max(...config.participants.map(item =>
    (item.variableCostPerTransaction + (item.fixedMonthlyCost + item.riskCost + item.minimumAcceptableProfit) / 100000) / item.revenueShare));
  assert.equal(fee.status, 'possible');
  assert.equal(fee.fee, expectedFee);
  const share = output(run(['solve', '-', 'share', p.id], config));
  const shareFloor = (100000 * p.variableCostPerTransaction + p.fixedMonthlyCost + p.riskCost + p.minimumAcceptableProfit) / (100000 * config.deal.feePerTransaction);
  assert.ok(Math.abs(share.share - shareFloor) < 1e-9);
  assert.equal(calculatePartnership({ ...config, participants: share.proposal }).participants[0].viable, true);
  const volume = output(run(['solve', '-', 'volume', p.id], config));
  const expectedVolume = Math.max(p.minimumCommitment ?? 0, (p.fixedMonthlyCost + p.riskCost + p.minimumAcceptableProfit) / (p.revenueShare * config.deal.feePerTransaction - p.variableCostPerTransaction));
  assert.ok(Math.abs(volume.monthlyVolume - expectedVolume) < 1e-6);
  assert.match(output(run(['solve', '-', 'share', 'missing'], config), 1).error, /participant/);
  assert.match(output(run(['solve', '-', 'fee', p.id], config), 1).error, /Wrong arguments/);
  p.capacity = 1;
  assert.equal(output(run(['solve', '-', 'fee'], config)).status, 'impossible');
  assert.equal(output(run(['solve', '-', 'share', p.id], config)).status, 'impossible');
});
