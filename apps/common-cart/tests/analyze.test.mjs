import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, writeFileSync, rmSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { clonePreset, CART_REVIEW_TOOLS, analyzeCartReview } from '../src/model.js';

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

test('offer drill-down explains capacity, shipping and exclusion reasons', () => {
  const result = ok(['offer', '--input', '-', '--offer', 'O1']);
  assert.equal(result.evaluation.allocations[0].totalCost, 13);
  assert.equal(result.capacity.filledUnits, 2);
  assert.equal(result.nextTier.nextMinimum, null);
  const scenario = fixture(); scenario.buyers[0].latestDeliveryDays = 1;
  const blocked = ok(['offer', '--input', '-', '--offer', 'O1'], scenario);
  assert.ok(blocked.exclusions.some(group => group.code === 'delivery' && group.count === 1));
  fails(['offer', '--input', '-', '--offer', 'missing'], fixture());
  fails(['offer', '--input', '-'], fixture(), /required/);
  fails(['market', '--input', '-', '--offer', 'O1'], fixture(), /not supported/);
});

test('merchant export uses aggregate allowlists without private buyer records', () => {
  const input = fixture(); input.title = 'PRIVATE ROOM'; input.buyers[0].maxOrderTotal = 1234567;
  const result = ok(['merchant', '--input', '-'], input);
  assert.equal(result.market.requestedUnits, 2);
  assert.equal(result.market.offers[0].landedTotal, 13);
  assert.equal(result.residual.primary.fulfilledUnits, 2);
  const text = JSON.stringify(result);
  for (const value of ['private-id', 'Private label', 'PRIVATE ROOM', '1234567', 'buyerId', 'selectedBuyerIds', 'maxOrderTotal', 'maxUnitPrice']) assert.equal(text.includes(value), false, value);
  input.offers = [];
  assert.equal(ok(['merchant', '--input', '-'], input).residual.primary, null);
});

test('review discovery and every supported tool preserve model report semantics', () => {
  assert.deepEqual(ok(['tools']), CART_REVIEW_TOOLS);
  for (const { id } of CART_REVIEW_TOOLS) {
    const input = clonePreset('neighbourhood');
    assert.deepEqual(ok(['review', '--input', '-', '--tool', id], input), analyzeCartReview(input, id));
  }
  const shipping = ok(['review', '--input', '-', '--tool', 'shipping']);
  assert.equal(shipping.rows[0][2], 1);
  assert.equal(shipping.rows[0][3], 13);
  fails(['review', '--input', '-', '--tool', 'bogus'], fixture());
  fails(['review', '--input', '-'], fixture(), /--tool/);
  fails(['tools', '--input', '-'], fixture(), /does not accept/);
});

test('review packets replay independently and reject tampered snapshots and results', () => {
  const packet = ok(['packet', '--input', '-', '--tool', 'coverage']);
  assert.equal(packet.format, 'common-cart-review');
  assert.deepEqual(ok(['replay', '--input', '-'], packet), packet);
  const changed = structuredClone(packet); changed.review.rows[0][1] = 999;
  fails(['replay', '--input', '-'], changed, /does not match/);
  const changedInput = structuredClone(packet); changedInput.scenario.buyers[0].quantity = 3;
  fails(['replay', '--input', '-'], changedInput, /snapshot changed/);
  fails(['replay', '--input', '-'], { ...packet, extra: 'field' }, /Unsupported/);
  fails(['packet', '--input', '-'], fixture(), /--tool/);
});

test('comparison preserves identity and suppresses cross-currency cost comparisons', () => temporary(dir => {
  const afterPath = join(dir, 'after.json');
  const after = fixture(); after.offers[0].unitPrice = 5;
  writeFileSync(afterPath, JSON.stringify(after));
  const result = ok(['compare', '--input', '-', '--against', afterPath]);
  assert.equal(result.summary.baseline.cost, 13);
  assert.equal(result.summary.current.cost, 11);
  assert.equal(result.summary.sameDemand, true);
  assert.equal(result.offers.shared[0].offerId, 'O1');
  after.currency = 'USD'; after.buyers[0].quantity = 1; after.offers[0].id = 'O2';
  writeFileSync(afterPath, JSON.stringify(after));
  const different = ok(['compare', '--input', '-', '--against', afterPath]);
  assert.equal(different.summary.sameDemand, false);
  assert.equal(different.summary.sameCurrency, false);
  assert.equal(different.summary.baseline.cost, null);
  assert.equal(different.summary.current.cost, null);
  assert.deepEqual(different.offers.missingFromRight, ['O1']);
  assert.deepEqual(different.offers.missingFromLeft, ['O2']);
  fails(['compare', '--input', '-', '--against', '-'], fixture(), /Only one/);
  fails(['compare', '--input', '-'], fixture(), /--against/);
}));

test('bounded sensitivity sweep rematches whole orders and never mutates source', () => temporary(dir => {
  const path = join(dir, 'scenario.json'); const original = JSON.stringify(fixture()); writeFileSync(path, original);
  const args = ['sweep', '--input', path, '--offer', 'O1', '--field', 'capacity', '--values', '[1,2,3]'];
  const result = ok(args);
  assert.deepEqual(result.rows.map(row => row.fulfilledUnits), [0, 2, 2]);
  assert.deepEqual(result.rows.map(row => row.totalCost), [null, 13, 13]);
  assert.equal(readFileSync(path, 'utf8'), original);
  fails([...args.slice(0, -1), '[2,1.5]'], fixture(), /integer/);
  fails([...args.slice(0, -1), JSON.stringify(Array(26).fill(2))], fixture(), /1 to 25/);
  fails(['sweep', '--input', '-', '--offer', 'O1', '--field', '__proto__', '--values', '[1]'], fixture(), /supported numeric/);
  fails(['sweep', '--input', '-', '--offer', 'missing', '--field', 'capacity', '--values', '[1]'], fixture(), /existing offer/);
}));

test('JSONL batch preserves order and atomically rejects a late invalid row', () => temporary(dir => {
  const first = fixture(), second = fixture(); second.offers = [];
  const input = [first, second].map(value => JSON.stringify(value)).join('\r\n') + '\r\n';
  const response = run(['batch', '--input', '-'], input);
  assert.equal(response.status, 0, response.stderr);
  const rows = response.stdout.trim().split('\n').map(line => JSON.parse(line));
  assert.deepEqual(rows.map(row => row.line), [1, 2]);
  assert.equal(rows[0].market.winner.totalCost, 13);
  assert.equal(rows[1].market.winner, null);
  const output = join(dir, 'batch.jsonl');
  fails(['batch', '--input', '-', '--output', output], input + '{', /Line 3/);
  assert.equal(existsSync(output), false);
  assert.equal(run(['batch', '--input', '-', '--output', output], input).status, 0);
  fails(['batch', '--input', '-'], JSON.stringify(first) + '\n\n', /Line 2/);
  fails(['batch', '--input', '-'], '', /1 to 25/);
  fails(['batch', '--input', '-'], Array(26).fill(JSON.stringify(first)).join('\n'), /1 to 25/);
}));

test('CSV import replaces only requested records and produces an evaluable scenario', () => temporary(dir => {
  const csvPath = join(dir, 'records.csv');
  writeFileSync(csvPath, 'label,category,quantity,max unit price,latest delivery days,variants,max order total\r\n"New, buyer",Coffee,2,10,4,Dark,15\r\n');
  const buyerImport = ok(['import', '--input', '-', '--kind', 'buyers', '--csv', csvPath]);
  assert.equal(buyerImport.buyers.length, 1);
  assert.equal(buyerImport.buyers[0].label, 'New, buyer');
  assert.equal(buyerImport.buyers[0].maxOrderTotal, 15);
  assert.equal(buyerImport.offers[0].id, 'O1');
  assert.equal(ok(['market', '--input', '-'], buyerImport).winner.totalCost, 13);
  writeFileSync(csvPath, 'name,capacity,unit price,shipping,fulfillment,variants,minimum,delivery\nNew supplier,5,5,90,pickup,Dark,2,3\n');
  const offerImport = ok(['import', '--input', '-', '--kind', 'offers', '--csv', csvPath]);
  assert.equal(offerImport.buyers[0].id, 'private-id');
  assert.equal(offerImport.offers[0].merchant, 'New supplier');
  assert.equal(ok(['market', '--input', '-'], offerImport).winner.totalCost, 10);
  writeFileSync(csvPath, 'not,a,valid,header\n1,2,3,4\n');
  const output = join(dir, 'never.json');
  fails(['import', '--input', '-', '--kind', 'buyers', '--csv', csvPath, '--output', output], fixture());
  assert.equal(existsSync(output), false);
  fails(['import', '--input', '-', '--kind', 'buyers', '--csv', '-'], fixture(), /Only one/);
  fails(['import', '--input', '-', '--kind', 'wrong', '--csv', csvPath], fixture(), /requires/);
}));

test('workspace selection validates all rooms and preserves display-only filter semantics', () => temporary(dir => {
  const first = fixture(), second = fixture(); second.title = 'Second room'; second.offers[0].unitPrice = 4;
  const workspace = { version: 1, rooms: [first, second], hideExcludedBuyers: true, fulfillmentFilter: 'pickup' };
  const path = join(dir, 'workspace.json'); writeFileSync(path, JSON.stringify(workspace));
  const rooms = ok(['rooms', '--input', '-'], workspace);
  assert.deepEqual(rooms.map(room => room.index), [1, 2]);
  assert.equal(rooms[1].title, 'Second room');
  assert.equal(ok(['market', '--input', '-', '--room', '2'], workspace).winner.totalCost, 9);
  const compare = ok(['compare', '--input', path, '--room', '1', '--against', path, '--against-room', '2']);
  assert.equal(compare.summary.current.cost, 9);
  assert.equal(compare.summary.baseline.cost, 13);
  fails(['market', '--input', '-'], workspace, /unexpected field/);
  for (const index of ['0', '1.5', '-1', '3']) fails(['market', '--input', '-', '--room', index], workspace);
  const invalid = structuredClone(workspace); invalid.rooms[1].buyers[0].quantity = 0;
  fails(['market', '--input', '-', '--room', '1'], invalid, /quantity/);
  fails(['replay', '--input', '-', '--room', '1'], workspace, /not supported/);
  assert.deepEqual(ok(['rooms', '--input', '-'], { version: 1, rooms: [] }), []);
  fails(['market', '--input', '-', '--room', '1'], { version: 1, rooms: [] }, /outside/);
}));

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
test('safe IO rejects Windows device aliases and mixed-separator network paths before opening', () => {
  for (const path of ['NUL ', 'NUL .json', 'COM¹', 'LPT².txt', '\\/server/share/file.json', '/\\server/share/file.json', 'file.json:stream']) {
    fails(['market', '--input', path], fixture(), /ordinary local/);
    fails(['market', '--input', '-', '--output', path], fixture(), /ordinary local/);
  }
  fails(['market', '--input', '-', '--output', ''], fixture(), /must not be empty/);
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
