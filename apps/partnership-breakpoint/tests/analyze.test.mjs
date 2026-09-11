import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { clonePreset } from '../src/model.js';

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
