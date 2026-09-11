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
