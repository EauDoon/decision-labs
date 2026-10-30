import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  canonicalProposal,
  formatClauseOptionsCsv,
  formatParticipantGroupsCsv,
  formatSupportMatrixCsv,
  formatWorkspaceJson,
  parseWorkspaceJson,
} from '../src/model.js';

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
const tables = {
  support: formatSupportMatrixCsv,
  groups: formatParticipantGroupsCsv,
  options: (value) => formatClauseOptionsCsv(value).csv,
};

function run(args, input = '') {
  const result = spawnSync(process.execPath, [script, ...args], { input, encoding: 'utf8', timeout: 10000 });
  assert.ifError(result.error);
  return result;
}
function ok(args, input) {
  const result = run(args, input);
  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.stderr, '');
  return JSON.parse(result.stdout);
}
function fails(args, input) {
  const result = run(args, input);
  assert.equal(result.status, 2, result.stdout);
  assert.equal(result.stdout, '');
  return JSON.parse(result.stderr);
}
function withFiles(files, fn) {
  const directory = mkdtempSync(join(tmpdir(), 'smallest-agreement-import-'));
  try {
    const paths = Object.fromEntries(Object.entries(files).map(([name, text]) => {
      const path = join(directory, name);
      writeFileSync(path, text);
      return [name, path];
    }));
    return fn(paths);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
}

test('each exported table imports back to the same proposal through the CLI', () => {
  withFiles({ 'proposal.json': JSON.stringify(proposal) }, (paths) => {
    for (const kind of Object.keys(tables)) {
      const exported = run(['export', paths['proposal.json'], kind]);
      assert.equal(exported.status, 0, exported.stderr);
      assert.equal(exported.stdout, tables[kind](proposal));
      assert.deepStrictEqual(ok(['import', paths['proposal.json'], kind, '-'], exported.stdout), canonicalProposal(proposal), kind);
    }
  });
});

test('edited tables change the proposal and the solver sees the edit', () => {
  withFiles({ 'proposal.json': JSON.stringify(proposal) }, (paths) => {
    const support = tables.support(proposal).replace(/"balanced","60","80"/u, '"balanced","50","80"');
    assert.notEqual(support, tables.support(proposal));
    const scored = ok(['import', paths['proposal.json'], 'support', '-'], support);
    assert.equal(scored.clauses[0].options[1].support.a, 50);

    const groups = tables.groups(proposal).replace('"Group A","3"', '"Group A","1"');
    const weighted = ok(['import', paths['proposal.json'], 'groups', '-'], groups);
    assert.equal(weighted.groups[0].weight, 1);

    const options = tables.options(proposal).replace(/"Balanced","no","2"/u, '"Balanced","no","4"');
    assert.notEqual(options, tables.options(proposal));
    const costed = ok(['import', paths['proposal.json'], 'options', '-'], options);
    assert.equal(costed.clauses[0].options[1].changeCost, 4);
    const solved = ok(['solve', '-'], JSON.stringify(costed));
    assert.equal(solved.agreement.changeCost, 4);
  });
});

test('a workspace input keeps its rounds and preferences and only replaces the proposal', () => {
  const workspace = formatWorkspaceJson(proposal, { clauseDensity: 'compact', vetoGroupsOnly: true }, [{ id: 'r1', name: 'First round', notes: 'Synthetic note', proposal }]);
  assert.equal(workspace.status, 'ok');
  const support = tables.support(proposal).replace(/"maximum","90","100"/u, '"maximum","85","100"');
  withFiles({ 'workspace.json': workspace.json, 'support.csv': support }, (paths) => {
    const output = run(['import', paths['workspace.json'], 'support', paths['support.csv']]);
    assert.equal(output.status, 0, output.stderr);
    const parsed = JSON.parse(output.stdout);
    const original = JSON.parse(workspace.json);
    assert.deepEqual(Object.keys(parsed), Object.keys(original));
    for (const key of Object.keys(original)) {
      if (key !== 'proposal') assert.deepStrictEqual(parsed[key], original[key], key);
    }
    assert.equal(parsed.proposal.clauses[0].options[2].support.a, 85);
    assert.equal(parseWorkspaceJson(output.stdout).status, 'ok');
    const before = ok(['rounds', paths['workspace.json']]);
    assert.deepStrictEqual(ok(['rounds', '-'], output.stdout), before);
    assert.equal(readFileSync(paths['workspace.json'], 'utf8'), workspace.json);
    assert.equal(readFileSync(paths['support.csv'], 'utf8'), support);
  });
});

test('an invalid table exits 2 with no output and named errors with their rows', () => {
  withFiles({ 'proposal.json': JSON.stringify(proposal) }, (paths) => {
    const bad = 'name,weight,min_support,veto,id,hours:original,hours:balanced,hours:maximum\nGroup A,heavy,,no,a,20,60,90\nGroup B,1,,maybe,b,40,80,100\n';
    const error = fails(['import', paths['proposal.json'], 'groups', '-'], bad);
    assert.equal(error.status, 'error');
    assert.deepEqual(error.errors.map((item) => [item.code, item.row]), [['invalid_weight', 2], ['invalid_veto', 3]]);
    assert.match(error.error, /row 2 weight/u);
    for (const item of error.errors) assert.deepEqual(Object.keys(item).filter((key) => !['code', 'message', 'row', 'column'].includes(key)), []);
    const unknown = fails(['import', paths['proposal.json'], 'support', '-'], 'clause_id,option_id,a,b,zz\nhours,original,1,2,3\n');
    assert.ok(unknown.errors.some((item) => item.code === 'unknown_group_column'));
    const extra = fails(['import', paths['proposal.json'], 'groups', '-'], 'name,weight,zz,hours:original,hours:balanced,hours:maximum\nGroup A,3,x,20,60,90\n');
    assert.ok(extra.errors.some((item) => item.code === 'unknown_column' && item.column === 'zz'));
    assert.equal(readFileSync(paths['proposal.json'], 'utf8'), JSON.stringify(proposal));
  });
});

test('import rejects two stdin inputs, an unknown table kind and missing arguments', () => {
  withFiles({ 'proposal.json': JSON.stringify(proposal), 'support.csv': tables.support(proposal) }, (paths) => {
    assert.match(fails(['import', '-', 'support', '-'], JSON.stringify(proposal)).error, /Only one import input may use stdin/u);
    assert.match(fails(['import', paths['proposal.json'], 'brief', paths['support.csv']]).error, /Unknown import table[\s\S]*Usage:/u);
    assert.match(fails(['import', paths['proposal.json'], 'support']).error, /Usage:/u);
    assert.equal(ok(['import', '-', 'support', paths['support.csv']], JSON.stringify(proposal)).title, proposal.title);
  });
});

test('a TSV table is accepted', () => {
  const tsv = tables.groups(proposal).split(/\r?\n/u).map((line) => line.replaceAll('"', '').replaceAll(',', '\t')).join('\n');
  withFiles({ 'proposal.json': JSON.stringify(proposal), 'groups.tsv': tsv }, (paths) => {
    assert.deepStrictEqual(ok(['import', paths['proposal.json'], 'groups', paths['groups.tsv']]), canonicalProposal(proposal));
  });
});

test("a group named 's-Hertogenbosch survives CLI export and import", () => {
  const named = { ...proposal, groups: [{ id: 'a', name: "'s-Hertogenbosch", weight: 3 }, proposal.groups[1]] };
  withFiles({ 'proposal.json': JSON.stringify(named) }, (paths) => {
    const exported = run(['export', paths['proposal.json'], 'groups']);
    assert.equal(exported.status, 0, exported.stderr);
    const back = ok(['import', paths['proposal.json'], 'groups', '-'], exported.stdout);
    assert.equal(back.groups[0].name, "'s-Hertogenbosch");
    assert.deepStrictEqual(back, canonicalProposal(named));
  });
});

test('--help lists the import command', () => {
  const help = run(['--help']);
  assert.equal(help.status, 0);
  assert.match(help.stdout, /import <support\|groups\|options> <table\.csv\|table\.tsv\|->/u);
});
