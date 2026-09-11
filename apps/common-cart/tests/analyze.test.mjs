import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, writeFileSync, rmSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { clonePreset } from '../src/model.js';

const script = fileURLToPath(new URL('../scripts/analyze.mjs', import.meta.url));
const fixture = () => ({ title: 'Synthetic oracle', currency: 'AUD', buyers: [
  { id: 'private-id', label: 'Private label', category: 'Coffee', quantity: 2, maxUnitPrice: 10, latestDeliveryDays: 4, allowedVariants: ['Dark'] },
], offers: [{ id: 'O1', merchant: 'Synthetic supplier', category: 'Coffee', variant: 'Dark', unitPrice: 6, minimumUnits: 2, deliveryDays: 3, capacity: 2, shippingPerBuyer: 1 }] });
function run(args, input = fixture()) {
  return spawnSync(process.execPath, [script, ...args], { input: typeof input === 'string' || Buffer.isBuffer(input) ? input : JSON.stringify(input), encoding: 'utf8', timeout: 30000, maxBuffer: 8 * 1048576 });
}
function ok(args, input) {
  const result = run(args, input);
  assert.equal(result.status, 0, result.stderr);
  return JSON.parse(result.stdout);
}
function fails(args, input, pattern) {
  const result = run(args, input);
  assert.equal(result.status, 1, result.stderr);
  assert.equal(result.stdout, '');
  if (pattern) assert.match(result.stderr, pattern);
}
function temporary(fn) {
  const dir = mkdtempSync(join(tmpdir(), 'common-cart-cli-'));
  try { fn(dir); } finally { rmSync(dir, { recursive: true, force: true }); }
}

test('market CLI has independent shipping, allocation, and no-winner oracles', () => {
  const result = ok(['market', '--input', '-']);
  assert.equal(result.winner.fulfilledUnits, 2);
  assert.equal(result.winner.totalCost, 13);
  assert.equal(result.winner.savings, 7);
  const blocked = fixture(); blocked.offers[0].minimumUnits = 3;
  assert.equal(ok(['market', '--input', '-'], blocked).winner, null);
});
test('strict CLI rejects malformed input, options, oversize and invalid UTF-8', () => {
  fails(['market', '--input', '-'], '{', /valid JSON/);
  fails(['market', '--input', '-', '--typo'], fixture());
  fails(['market', '--input', '-', '--input', '-'], fixture(), /Duplicate/);
  fails(['market', '--input', '-'], ' '.repeat(1048577), /1 MiB/);
  fails(['market', '--input', '-'], Buffer.from([0xff]), /UTF-8/);
  fails(['market', '--input', '-'], { ...fixture(), extra: true }, /unexpected field/);
  assert.match(run(['--help']).stdout, /organizer-private/);
});
test('file input and exclusive output preserve existing input and recover after errors', () => temporary(dir => {
  const input = join(dir, 'input.json'), output = join(dir, 'result.json');
  const bytes = '\uFEFF' + JSON.stringify(fixture()); writeFileSync(input, bytes);
  const result = run(['market', '--input', input, '--output', output]);
  assert.equal(result.status, 0, result.stderr); assert.equal(result.stdout, '');
  assert.equal(JSON.parse(readFileSync(output, 'utf8')).winner.totalCost, 13);
  fails(['market', '--input', input, '--output', input], fixture(), /EEXIST/);
  assert.equal(readFileSync(input, 'utf8'), bytes);
  const absent = join(dir, 'absent.json');
  fails(['market', '--input', '-', '--output', absent], '{');
  assert.equal(existsSync(absent), false);
  assert.equal(run(['market', '--input', input, '--output', absent]).status, 0);
  fails(['market', '--input', dir], fixture(), /regular file|EISDIR/);
  fails(['market', '--input', 'NUL'], fixture(), /ordinary local/);
}));
