import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { clonePreset, parseCsv, calculatePartnership, PARTNERSHIP_REVIEW_TOOLS } from '../src/model.js';

const cli = fileURLToPath(new URL('../scripts/analyze.mjs', import.meta.url));
const run = (args, value) => spawnSync(process.execPath, [cli, ...args], {
  input: typeof value === 'string' || Buffer.isBuffer(value) ? value : JSON.stringify(value), encoding: 'utf8', timeout: 10000,
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
  assert.ok(csv.stdout.endsWith('\r\n') && !csv.stdout.endsWith('\r\n\n'));
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

test('compare aligns missing IDs, three snapshots and rejects mixed currency labels', (t) => {
  const current = clonePreset('balanced');
  const first = structuredClone(current);
  first.participants.reverse();
  first.deal.feePerTransaction *= 2;
  const second = structuredClone(current);
  second.participants[0].id = 'replacement';
  const mixed = structuredClone(current);
  mixed.deal.currency = 'USD';
  const [a, b, c, d] = files(t, [current, first, second, mixed]);
  const pair = output(run(['compare', a, b]));
  assert.equal(pair.sameRoster, true);
  for (const row of pair.rows) {
    const p = current.participants.find(p => p.id === row.id);
    assert.ok(Math.abs(row.imported.monthlyProfit - row.current.monthlyProfit - 100000 * current.deal.feePerTransaction * p.revenueShare) < 1e-7);
  }
  const triple = output(run(['compare', '-', b, c], current));
  assert.equal(triple.sameRoster, false);
  const replacement = triple.rows.find(row => row.id === 'replacement');
  assert.equal(replacement.current, null);
  assert.equal(replacement.first, null);
  assert.ok(replacement.second);
  assert.match(output(run(['compare', a, d]), 1).error, /currency/);
  assert.match(output(run(['compare', '-', '-'], current), 1).error, /only one/);
});

test('review creates every supported packet and replay detects tampered evidence', () => {
  const config = clonePreset('balanced');
  for (const { id } of PARTNERSHIP_REVIEW_TOOLS) {
    const packet = output(run(['review', '-', id], config));
    assert.equal(packet.tool, id);
    assert.deepEqual(packet.scenario, config);
    assert.deepEqual(output(run(['replay', '-'], packet)), packet);
  }
  const packet = output(run(['review', '-', 'zero'], config));
  assert.equal(packet.review.rows[0][1], config.participants[0].fixedMonthlyCost + config.participants[0].riskCost);
  packet.review.rows[0][1] += 1;
  assert.match(output(run(['replay', '-'], packet), 1).error, /does not match/);
  const original = output(run(['review', '-', 'zero'], config));
  original.scenario.deal.monthlyVolume += 1;
  assert.match(output(run(['replay', '-'], original), 1).error, /snapshot changed/);
  assert.match(output(run(['review', '-', 'unknown'], config), 1).error, /Unknown partnership review/);
  assert.match(output(run(['replay', '-'], config), 1).error, /Unsupported/);
});

test('case extraction reproduces selected stress economics without a second shock', (t) => {
  const config = clonePreset('balanced');
  config.deal.volumeShockPct = 12;
  const [path] = files(t, [config]);
  const original = output(run(['summary', path]));
  const grid = output(run(['stress', path]));
  const selected = grid.scenarios.find(scenario => scenario.volumeChangePct < 0 && scenario.feeDropPct > 0 && scenario.variableCostRisePct > 0);
  const candidate = output(run(['case', path, selected.id]));
  assert.equal(candidate.deal.volumeShockPct, 0);
  assert.equal(candidate.deal.monthlyVolume, selected.volume);
  assert.equal(candidate.deal.feePerTransaction, selected.fee);
  const replayed = output(run(['summary', '-'], candidate));
  assert.equal(replayed.effectiveVolume, selected.volume);
  assert.equal(replayed.totalProfit, selected.totalProfit);
  assert.equal(replayed.viable, selected.viable);
  assert.deepEqual(output(run(['summary', path])), original);
  assert.match(output(run(['case', path, 'case-999']), 1).error, /current compound case/);
});

test('proposal emits a verified holding split and refuses unfundable or operational cases', (t) => {
  const config = clonePreset('balanced');
  config.stress = { volumeDropPct: 5, volumeGrowthPct: 0, feeDropPct: 0, variableCostRisePct: 0 };
  const [path] = files(t, [config]);
  const candidate = output(run(['proposal', path]));
  assert.deepEqual(candidate.deal, config.deal);
  assert.deepEqual(candidate.stress, config.stress);
  assert.notDeepEqual(candidate.participants.map(p => p.revenueShare), config.participants.map(p => p.revenueShare));
  assert.ok(Math.abs(candidate.participants.reduce((sum, p) => sum + p.revenueShare, 0) - 1) < 1e-12);
  const checked = output(run(['stress', '-'], candidate));
  assert.equal(checked.passCount, checked.caseCount);
  for (const volume of [95000, 100000]) for (const p of candidate.participants) {
    const profit = volume * (candidate.deal.feePerTransaction * p.revenueShare - p.variableCostPerTransaction) - p.fixedMonthlyCost - p.riskCost;
    assert.ok(profit >= p.minimumAcceptableProfit - 1e-9);
    assert.ok(volume >= (p.minimumCommitment ?? 0) && volume <= (p.capacity ?? Infinity));
  }
  assert.deepEqual(output(run(['summary', path])), calculatePartnership(config));
  for (const invalid of [clonePreset('balanced'), { ...config, deal: { ...config.deal, feePerTransaction: 0 } }]) {
    const failed = run(['proposal', '-'], invalid);
    assert.equal(failed.stdout, '');
    assert.match(output(failed, 1).error, /No verified fixed-share proposal/);
  }
});

test('roster exports spreadsheet-safe CSV and validates CSV/TSV replacement atomically', (t) => {
  const config = clonePreset('balanced');
  config.participants[0].name = '+Synthetic';
  const exported = run(['roster', '-'], config);
  assert.equal(exported.status, 0);
  const rows = parseCsv(exported.stdout.trim());
  assert.equal(rows[1][0], "'+Synthetic");
  const [path, csv, tsv, invalid] = files(t, [config, exported.stdout, rows.map(row => row.join('\t')).join('\n'), 'name,share\nBroken,1']);
  for (const roster of [csv, tsv]) {
    const result = output(run(['roster', path, roster]));
    assert.deepEqual(result.deal, config.deal);
    assert.equal(result.participants[0].name, '+Synthetic');
    assert.equal(output(run(['summary', '-'], result)).totalProfit, calculatePartnership(config).totalProfit);
  }
  const failed = run(['roster', path, invalid]);
  assert.equal(failed.stdout, '');
  assert.equal(failed.status, 1);
  assert.match(output(run(['roster', '-', '-'], config), 1).error, /only one/);
  assert.deepEqual(output(run(['summary', path])), calculatePartnership(config));
});

test('redact removes free text and custom IDs while preserving scenario economics', (t) => {
  const config = clonePreset('balanced');
  config.deal.title = 'Synthetic sensitive deal';
  config.deal.notes = 'Synthetic sensitive notes';
  config.deal.currency = 'USD';
  config.participants[0].id = 'synthetic-sensitive-id';
  config.participants[0].name = 'Synthetic sensitive participant';
  config.stress = { volumeDropPct: 7, volumeGrowthPct: 0, feeDropPct: 0, variableCostRisePct: 0 };
  const [path] = files(t, [config]);
  const result = run(['redact', path]);
  const redacted = output(result);
  assert.doesNotMatch(result.stdout, /sensitive/i);
  assert.equal(redacted.deal.currency, 'USD');
  assert.deepEqual(redacted.stress, config.stress);
  assert.deepEqual(redacted.participants.map(p => p.id), config.participants.map((_, i) => `participant-${i + 1}`));
  const before = output(run(['summary', path]));
  const after = output(run(['summary', '-'], redacted));
  assert.equal(before.totalRevenue, after.totalRevenue);
  assert.equal(before.totalProfit, after.totalProfit);
  assert.equal(before.viable, after.viable);
  assert.deepEqual(before.participants.map(p => p.monthlyProfit), after.participants.map(p => p.monthlyProfit));
  assert.deepEqual(output(run(['summary', path])), before);
  const packet = output(run(['review', '-', 'slack'], redacted));
  assert.doesNotMatch(JSON.stringify(packet), /sensitive/i);
});

test('batch preserves partial results, distinguishes input errors from hold gates, and recovers', (t) => {
  const config = clonePreset('balanced');
  const failing = structuredClone(config);
  failing.deal.feePerTransaction = 0;
  const [good, bad, broken] = files(t, [config, failing, '{']);
  const ungated = output(run(['batch', good, bad]));
  assert.equal(ungated.analyzedCount, 2);
  assert.equal(ungated.holdingCount, 1);
  assert.equal(ungated.gatePassed, null);
  const gated = output(run(['batch', '--require-hold', good, bad]), 2);
  assert.equal(gated.gatePassed, false);
  assert.deepEqual(gated.results.map(result => result.inputIndex), [1, 2]);
  const partial = run(['batch', '--require-hold', good, broken, bad]);
  assert.equal(partial.status, 1);
  assert.equal(partial.stderr, '');
  const report = JSON.parse(partial.stdout);
  assert.equal(report.invalidCount, 1);
  assert.equal(report.analyzedCount, 2);
  assert.equal(report.results[1].status, 'invalid');
  assert.match(report.results[1].error, /Invalid JSON/);
  assert.equal(report.results[2].totalRevenue, 0);
  assert.equal(output(run(['batch', '--require-hold', good, '-'], config)).gatePassed, true);
  for (const args of [['batch'], ['batch', '--typo', good], ['batch', '-', '-']]) {
    assert.equal(run(args, config).status, 1);
    assert.equal(run(args, config).stdout, '');
  }
  const [oversized] = files(t, [' '.repeat(1048577)]);
  assert.match(output(run(['summary', oversized]), 1).error, /exceeds 1 MiB/);
  const bounded = run(['batch', oversized, good]);
  assert.equal(bounded.status, 1);
  assert.equal(JSON.parse(bounded.stdout).analyzedCount, 1);
});

test('JSON boundary rejects duplicate decoded keys and invalid UTF-8 before analysis or replay', (t) => {
  const config = clonePreset('balanced');
  const text = JSON.stringify(config);
  const duplicate = text.replace('"monthlyVolume":', '"monthlyVolume":1,"monthlyVolume":');
  const escaped = text.replace('"monthlyVolume":', '"monthlyVolume":1,"monthly\\u0056olume":');
  const nested = text.replace('"revenueShare":', '"revenueShare":0,"revenueShare":');
  for (const value of [duplicate, escaped, nested]) {
    const result = run(['summary', '-'], value);
    assert.equal(result.stdout, '');
    assert.match(output(result, 1).error, /Duplicate JSON object member/);
  }
  const packet = output(run(['review', '-', 'zero'], config));
  const tampered = JSON.stringify(packet).replace('"version":1', '"version":2,"version":1');
  assert.match(output(run(['replay', '-'], tampered), 1).error, /Duplicate JSON object member/);
  config.deal.notes = 'Quoted "keys": { } [ ] and escapes \\ stay text.';
  assert.equal(output(run(['summary', '-'], config)).totalProfit, calculatePartnership(config).totalProfit);
  const [invalidPath, validPath] = files(t, ['', config]);
  const invalidBytes = Buffer.concat([Buffer.from(text.slice(0, -1) + ',"dealTitle":"'), Buffer.from([0xff]), Buffer.from('"}')]);
  writeFileSync(invalidPath, invalidBytes);
  assert.match(output(run(['summary', invalidPath]), 1).error, /UTF-8/);
  assert.match(output(run(['summary', '-'], invalidBytes), 1).error, /UTF-8/);
  const batch = run(['batch', invalidPath, validPath]);
  assert.equal(batch.status, 1);
  assert.equal(JSON.parse(batch.stdout).analyzedCount, 1);
});

test('local file boundary rejects devices and preserves batch recovery', (t) => {
  const [valid] = files(t, [clonePreset('balanced')]);
  for (const path of ['NUL', 'nul.txt', 'NUL .txt', 'CONIN$', 'CONOUT$', './com1.json', 'lpt¹.txt',
    '//synthetic-server/share/case.json', '\\\\synthetic-server\\share\\case.json', '\\\\.\\pipe\\synthetic-pipe',
    '\\\\?\\C:\\case.json', 'case.json:stream', 'C:case.json']) {
    const rejected = run(['summary', path]);
    assert.equal(rejected.stdout, '');
    assert.match(output(rejected, 1).error, /ordinary local file path/);
  }
  assert.match(output(run(['summary', dirname(valid)]), 1).error, /regular file|Cannot read input/);
  assert.match(output(run(['roster', valid, 'NUL']), 1).error, /ordinary local file path/);
  const batch = run(['batch', 'NUL', valid]);
  assert.equal(batch.status, 1);
  assert.equal(JSON.parse(batch.stdout).analyzedCount, 1);
  assert.equal(output(run(['summary', valid])).viable, true);
});

test('POSIX special files reject without waiting for a FIFO writer', { skip: process.platform === 'win32' }, (t) => {
  const [valid] = files(t, [clonePreset('balanced')]);
  const fifo = join(dirname(valid), 'input.fifo');
  const created = spawnSync('mkfifo', [fifo], { encoding: 'utf8', timeout: 5000 });
  assert.equal(created.status, 0, created.stderr);
  for (const path of [fifo, '/dev/zero']) {
    assert.match(output(run(['summary', path]), 1).error, /regular file/);
  }
  assert.equal(output(run(['summary', valid])).viable, true);
});

test('closed stdout returns a safe JSON error without a runtime stack', { timeout: 10000 }, async (t) => {
  const child = spawn(process.execPath, [cli, 'summary', '-'], { stdio: ['pipe', 'pipe', 'pipe'] });
  t.after(() => child.kill());
  let stderr = '';
  child.stderr.setEncoding('utf8');
  child.stderr.on('data', chunk => { stderr += chunk; });
  child.stdout.destroy();
  const code = await new Promise((resolve, reject) => {
    child.once('error', reject);
    child.once('close', resolve);
    child.stdin.end(JSON.stringify(clonePreset('balanced')));
  });
  assert.equal(code, 1);
  assert.deepEqual(JSON.parse(stderr), { error: 'Cannot write output. Check the receiving process.' });
});
