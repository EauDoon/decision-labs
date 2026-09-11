import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { mkdtempSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const script = fileURLToPath(new URL('../scripts/analyze.mjs', import.meta.url));
const proposal = {
  title: 'Synthetic one-clause agreement', threshold: 60,
  groups: [{ id: 'a', name: 'Group A', weight: 3 }, { id: 'b', name: 'Group B', weight: 1 }],
  clauses: [{ id: 'hours', title: 'Hours', options: [
    { id: 'original', label: 'Original', original: true, changeCost: 0, support: { a: 20, b: 40 } },
    { id: 'balanced', label: 'Balanced', changeCost: 2, support: { a: 60, b: 80 } },
    { id: 'maximum', label: 'Maximum', changeCost: 5, support: { a: 90, b: 100 } },
  ] }],
};
function run(args, input = proposal) {
  const result = spawnSync(process.execPath, [script, ...args], {
    input: typeof input === 'string' ? input : JSON.stringify(input), encoding: 'utf8', timeout: 10000,
  });
  assert.ifError(result.error);
  return result;
}
function result(args, input = proposal) {
  const processResult = run(args, input);
  assert.equal(processResult.status, 0, processResult.stderr);
  assert.equal(processResult.stderr, '');
  return JSON.parse(processResult.stdout);
}
function invalid(args, input = proposal, pattern = /./) {
  const processResult = run(args, input);
  assert.equal(processResult.status, 2);
  assert.equal(processResult.stdout, '');
  assert.match(JSON.parse(processResult.stderr).error, pattern);
}

test('solve matches hand-calculated weighted support and cheapest passing cost', () => {
  const solved = result(['solve', '-']);
  assert.equal(solved.status, 'found');
  assert.equal(solved.baseline.approval, 25);
  assert.equal(solved.agreement.approval, 65);
  assert.equal(solved.agreement.changeCost, 2);
  assert.equal(solved.agreement.options[0].id, 'balanced');
  assert.equal(solved.checkedCombinations, 3);
  assert.equal(solved.alternatives.length, 2);
});

test('solve reads BOM files and workspace exports without changing inputs', () => {
  const directory = mkdtempSync(join(tmpdir(), 'agreement-analyst-'));
  try {
    const file = join(directory, 'draft.json');
    const text = '\uFEFF' + JSON.stringify({ format: 'smallest-agreement-workspace', version: 1, proposal });
    writeFileSync(file, text);
    assert.equal(result(['solve', file]).agreement.changeCost, 2);
    assert.equal(readFileSync(file, 'utf8'), text);
  } finally { rmSync(directory, { recursive: true }); }
});

test('invalid input and usage fail without reflecting source bytes, then recover', () => {
  invalid(['solve', '-'], '{private-marker', /valid JSON/);
  invalid(['solve', '-'], {}, /title/);
  invalid(['solve', '-', 'extra'], proposal, /Usage/);
  invalid(['unknown', '-'], proposal, /Usage/);
  invalid(['solve', '-'], ' '.repeat(262145), /256 KiB/);
  assert.equal(result(['solve', '-']).status, 'found');
});

test('solve preserves infeasible and search-cap statuses', () => {
  assert.equal(result(['solve', '-'], { ...proposal, maxChangeCost: 0 }).status, 'infeasible');
  const large = { ...proposal, clauses: Array.from({ length: 10 }, (_, index) => ({ ...proposal.clauses[0], id: 'c' + index })) };
  assert.equal(result(['solve', '-'], large).status, 'too_large');
});

test('evaluate inspects supplied option IDs and preserves numerical constraint failures', () => {
  const custom = result(['evaluate', '-', 'maximum']);
  assert.equal(custom.summary.approval, 92.5);
  assert.equal(custom.summary.changeCost, 5);
  assert.equal(custom.summary.constraints.met, true);
  const constrained = { ...proposal, maxChangeCost: 1, groups: proposal.groups.map(group => ({ ...group, minSupport: 90 })) };
  assert.equal(result(['evaluate', '-', 'balanced'], constrained).summary.constraints.met, false);
  invalid(['evaluate', '-', 'invented'], proposal, /belong/);
  invalid(['evaluate', '-', 'balanced,maximum'], proposal, /exactly one/);
  assert.equal(result(['evaluate', '-', 'balanced']).summary.approval, 65);
});

test('stress holds the package fixed, clamps support, and crosses the known margin', () => {
  const stressed = result(['stress', '-', 'balanced', '0,5,6,100']);
  assert.deepEqual(stressed.rows.map(row => row.summary.approval), [65, 60, 59, 0]);
  assert.deepEqual(stressed.rows.map(row => row.status), ['passing', 'passing', 'not_passing', 'not_passing']);
  assert.ok(stressed.rows.every(row => row.summary.changeCost === 2));
  for (const bad of ['', '1,,2', '-1', '101', 'NaN', '1,'.repeat(20) + '1']) invalid(['stress', '-', 'balanced', bad], proposal, /numeric levels/);
  invalid(['stress', '-', 'unknown', '5'], proposal, /belong/);
});

test('compare reports changed inputs before independently recomputed results', () => {
  const directory = mkdtempSync(join(tmpdir(), 'agreement-compare-'));
  try {
    const file = join(directory, 'after.json');
    const after = { ...proposal, threshold: 70 };
    writeFileSync(file, JSON.stringify(after));
    const compared = result(['compare', '-', file]);
    assert.deepEqual(compared.inputs, [{ field: 'Approval threshold', before: 60, after: 70 }]);
    assert.equal(compared.before.agreement.changeCost, 2);
    assert.equal(compared.after.agreement.changeCost, 5);
    assert.match(JSON.stringify(compared.inputs), /threshold/);
    assert.deepEqual(result(['compare', file, '-'], after).before, result(['solve', '-'], after));
    writeFileSync(file, '{malformed');
    invalid(['compare', '-', file], proposal, /valid JSON/);
    invalid(['compare', '-', '-'], proposal, /Only one/);
  } finally { rmSync(directory, { recursive: true }); }
});

test('review creates browser-compatible packets with declared input snapshots', () => {
  const packet = result(['review', '-', 'margin']);
  assert.equal(packet.format, 'agreement-review');
  assert.equal(packet.version, 1);
  assert.equal(packet.tool, 'margin');
  assert.deepEqual(JSON.parse(packet.inputJSON), packet.scenario);
  assert.deepEqual(packet.review.rows[0].slice(1, 5), [65, 60, 5, 2]);
  assert.match(packet.review.note, /declared inputs/);
  for (const tool of ['floors', 'dominance', 'substitutions', 'rollback', 'thresholds', 'budgets', 'locks', 'uncertainty']) {
    assert.equal(result(['review', '-', tool]).review.tool, tool);
  }
  invalid(['review', '-', 'not-a-tool'], proposal, /Unknown agreement review/);
});

test('replay recomputes packets, rejects changed inputs/results/fields, and recovers', () => {
  const packet = result(['review', '-', 'margin']);
  assert.deepEqual(result(['replay', '-'], packet), packet);
  for (const mutate of [
    changed => { changed.review.rows[0][1] = 99; },
    changed => { changed.scenario.threshold = 99; },
    changed => { changed.extra = 'untrusted'; },
    changed => { changed.review.note = 'A binding decision'; },
    changed => { changed.version = 2; },
  ]) {
    const changed = structuredClone(packet);
    mutate(changed);
    invalid(['replay', '-'], changed);
  }
  invalid(['replay', '-'], ' '.repeat(1048577), /1024 KiB/);
  assert.deepEqual(result(['replay', '-'], packet), packet);
});

test('batch isolates malformed records and preserves physical line numbers and later recovery', () => {
  const processResult = run(['batch', '-'], [JSON.stringify(proposal), '', '{private-marker', JSON.stringify({ ...proposal, threshold: 70 })].join('\r\n'));
  assert.equal(processResult.status, 1);
  assert.equal(processResult.stderr, '');
  const rows = processResult.stdout.trim().split('\n').map(line => JSON.parse(line));
  assert.deepEqual(rows.map(row => row.line), [1, 3, 4]);
  assert.deepEqual(rows.map(row => row.status), ['ok', 'error', 'ok']);
  assert.equal(rows[0].result.agreement.changeCost, 2);
  assert.equal(rows[2].result.agreement.changeCost, 5);
  assert.doesNotMatch(processResult.stdout, /private-marker/);
  invalid(['batch', '-'], '\n', /1 to 20/);
  invalid(['batch', '-'], Array(21).fill('{}').join('\n'), /1 to 20/);
  const large = { ...proposal, clauses: Array.from({ length: 8 }, (_, index) => ({ ...proposal.clauses[0], id: 'c' + index })) };
  assert.equal(result(['batch', '-'], large).result.status, 'too_large');
  assert.equal(result(['batch', '-']).result.agreement.changeCost, 2);
});

test('sweep exposes discrete threshold and budget transitions with bounded searches', () => {
  const thresholds = result(['sweep', '-', 'threshold', '0,60,70,100']);
  assert.equal(thresholds.maxCombinationsPerRow, 12500);
  assert.deepEqual(thresholds.rows.map(row => row.result.agreement?.changeCost ?? null), [0, 2, 5, null]);
  assert.deepEqual(result(['sweep', '-', 'maxChangeCost', '0,1,2,5']).rows.map(row => row.result.status), ['infeasible', 'infeasible', 'found', 'found']);
  const veto = { ...proposal, groups: proposal.groups.map(group => ({ ...group, veto: true })) };
  assert.deepEqual(result(['sweep', '-', 'threshold', '60,65'], veto).rows.map(row => row.result.agreement.changeCost), [2, 5]);
  invalid(['sweep', '-', 'weight', '1']);
  invalid(['sweep', '-', 'maxChangeCost', '20000000001']);
  invalid(['sweep', '-', 'threshold', '60,']);
});

test('lock preview forces one option while preserving other constraints and source inputs', () => {
  const preview = result(['lock', '-', 'hours', 'maximum']);
  assert.equal(preview.status, 'preview');
  assert.equal(preview.proposal.clauses[0].lockedOptionId, 'maximum');
  assert.equal(preview.result.agreement.changeCost, 5);
  assert.equal(preview.result.checkedCombinations, 1);
  assert.equal(result(['lock', '-', 'hours', 'original']).result.status, 'infeasible');
  assert.equal(result(['lock', '-', 'hours', 'maximum'], { ...proposal, maxChangeCost: 2 }).result.status, 'infeasible');
  const previouslyLocked = structuredClone(proposal);
  previouslyLocked.clauses[0].lockedOptionId = 'original';
  assert.equal(result(['lock', '-', 'hours', 'balanced'], previouslyLocked).result.agreement.changeCost, 2);
  invalid(['lock', '-', 'missing', 'balanced'], proposal, /Unknown clause/);
  invalid(['lock', '-', 'hours', 'missing'], proposal, /Unknown option/);
  assert.equal(result(['solve', '-']).agreement.changeCost, 2);
});

test('exports produce usable Markdown and spreadsheet-safe model CSV without JSON wrapping', () => {
  const brief = run(['export', '-', 'brief']);
  assert.equal(brief.status, 0, brief.stderr);
  assert.match(brief.stdout, /^# The Smallest Agreement/);
  assert.match(brief.stdout, /Recommended approval: 65\.0%/);
  assert.match(brief.stdout, /Total change cost: 2\.0/);
  for (const format of ['evidence', 'support', 'groups', 'options', 'worksheet']) {
    const exported = run(['export', '-', format]);
    assert.equal(exported.status, 0, exported.stderr);
    assert.match(exported.stdout, /,/);
    assert.ok(exported.stdout.split('\n').length > 2);
  }
  const maliciousLabel = { ...proposal, title: '=SUM(1,2)' };
  const csv = run(['export', '-', 'evidence'], maliciousLabel);
  assert.match(csv.stdout, /'=SUM\(1,2\)/);
  assert.match(run(['export', '-', 'brief'], { ...proposal, maxChangeCost: 0 }).stdout, /No permitted combination/);
  invalid(['export', '-', 'constructor'], proposal, /Unknown export format/);
  invalid(['export', '-', 'brief'], '{bad', /valid JSON/);
});

test('file read errors and invalid UTF-8 emit safe errors and recover', () => {
  const directory = mkdtempSync(join(tmpdir(), 'agreement-input-'));
  try {
    const file = join(directory, 'input.json');
    invalid(['export', file, 'brief'], proposal, /Cannot read/);
    writeFileSync(file, Buffer.from([0xff, 0xfe, 0x00]));
    invalid(['export', file, 'brief'], proposal, /UTF-8/);
    writeFileSync(file, JSON.stringify(proposal));
    assert.equal(run(['export', file, 'brief']).status, 0);
    assert.equal(JSON.parse(readFileSync(file, 'utf8')).threshold, 60);
  } finally { rmSync(directory, { recursive: true }); }
});

test('duplicate JSON members, including escaped-equivalent names, fail before analysis or replay', () => {
  const json = JSON.stringify(proposal);
  const ambiguous = json.replace('"threshold":60', '"threshold":0,"thres\\u0068old":60');
  invalid(['solve', '-'], ambiguous, /duplicate JSON member/);
  invalid(['export', '-', 'brief'], json.replace('"changeCost":2', '"changeCost":999,"changeCost":2'), /duplicate JSON member/);
  invalid(['solve', '-'], json.replace('"a":60', '"a":0,"\\u0061":60'), /duplicate JSON member/);
  const packet = run(['review', '-', 'margin']).stdout;
  invalid(['replay', '-'], packet.replace('"version":1', '"version":2,"version":1'), /duplicate JSON member/);
  const batch = run(['batch', '-'], ambiguous + '\n' + json);
  assert.equal(batch.status, 1);
  const rows = batch.stdout.trim().split('\n').map(line => JSON.parse(line));
  assert.equal(rows[0].status, 'error');
  assert.equal(rows[1].result.agreement.changeCost, 2);
  const text = { ...proposal, title: 'Repeated "words", {braces}, [arrays]: remain text' };
  assert.equal(result(['solve', '-'], text).agreement.changeCost, 2);
});

test('file inputs reject device and network aliases before opening and recover with regular files', () => {
  for (const path of ['NUL', 'nul.txt', 'CON', 'COM1', 'LPT¹.txt', '\\\\server\\share\\draft.json', '//server/share/draft.json', '\\\\.\\NUL', 'draft.json:extra']) {
    invalid(['solve', path], proposal, /ordinary local file/);
  }
  invalid(['solve', fileURLToPath(new URL('../scripts/', import.meta.url))], proposal, /regular file/);
  assert.equal(result(['solve', '-']).agreement.changeCost, 2);
});

test('POSIX FIFO inputs fail without waiting for a writer', { skip: process.platform === 'win32' }, () => {
  const directory = mkdtempSync(join(tmpdir(), 'agreement-fifo-'));
  try {
    const file = join(directory, 'input');
    assert.equal(spawnSync('mkfifo', [file]).status, 0);
    invalid(['solve', file], proposal, /regular file/);
  } finally { rmSync(directory, { recursive: true }); }
});
