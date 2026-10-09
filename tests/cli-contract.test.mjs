import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { APPS } from '../scripts/apps.mjs';
import { clonePreset } from '../apps/partnership-breakpoint/src/model.js';

// Each analyst CLI prints its help differently, so each app names the pattern
// that finds the commands its --help lists, and the document that explains them.
const CLI = {
  'partnership-breakpoint': { doc: 'CLI.md', commands: /^ {2}([a-z][a-z-]*) /gm },
  'common-cart': { doc: 'CLI.md', commands: /node scripts\/analyze\.mjs ([a-z][a-z-]*)/g },
  'smallest-agreement': { doc: 'ANALYST.md', commands: /^ {2}([a-z][a-z-]*)\b/gm },
  'weekend-gap': { doc: 'CLI.md', commands: /^ {2}([a-z][a-z-]*) [A-Z]/gm },
};

function analyze(id, args, input) {
  const script = fileURLToPath(new URL(`../apps/${id}/scripts/analyze.mjs`, import.meta.url));
  return spawnSync(process.execPath, [script, ...args], { encoding: 'utf8', input, timeout: 15000 });
}

function read(path) {
  return readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
}

test('every workbench has a documented analyst CLI entry', () => {
  assert.deepEqual(Object.keys(CLI).sort(), APPS.map(({ id }) => id).sort());
});

for (const { id } of APPS) {
  test(`${id}: --version prints the package name and version and nothing else`, () => {
    const { name, version } = JSON.parse(read(`apps/${id}/package.json`));
    const result = analyze(id, ['--version']);
    assert.ifError(result.error);
    assert.equal(result.status, 0, result.stderr);
    assert.equal(result.stdout, `${name} ${version}\n`);
    assert.equal(result.stderr, '');
    const extra = analyze(id, ['--version', 'extra']);
    assert.notEqual(extra.status, 0, 'an extra argument is rejected');
    assert.equal(extra.stdout, '');
  });

  test(`${id}: every command in --help is documented`, () => {
    const help = analyze(id, ['--help']);
    assert.equal(help.status, 0, help.stderr);
    assert.match(help.stdout, /--version/, '--help mentions --version');
    const commands = [...new Set([...help.stdout.matchAll(CLI[id].commands)].map(([, command]) => command))];
    assert.ok(commands.length >= 8, `found only ${commands.join(', ')}`);
    const doc = read(`apps/${id}/${CLI[id].doc}`);
    assert.match(doc, /analyze\.mjs --version/, `${CLI[id].doc} documents --version`);
    for (const command of commands) {
      const documented = new RegExp(`analyze\\.mjs ${command}\\b|\`${command}[\` ]`).test(doc);
      assert.ok(documented, `${CLI[id].doc} does not document the ${command} command`);
    }
  });
}

test('the worked case study reproduces its published numbers', () => {
  const study = read('docs/CASE_STUDY.md');
  assert.match(study, /node scripts\/analyze\.mjs case - case-4 \| node scripts\/analyze\.mjs summary -/);
  const balanced = JSON.stringify(clonePreset('balanced'));

  const baselineRun = analyze('partnership-breakpoint', ['summary', '-'], balanced);
  assert.equal(baselineRun.status, 0, baselineRun.stderr);
  const baseline = JSON.parse(baselineRun.stdout);
  assert.equal(baseline.totalProfit, 3100);
  assert.equal(baseline.viable, true);
  assert.match(study, /Total monthly profit: `3100`/);

  const caseRun = analyze('partnership-breakpoint', ['case', '-', 'case-4'], balanced);
  assert.equal(caseRun.status, 0, caseRun.stderr);
  const summaryRun = analyze('partnership-breakpoint', ['summary', '-'], caseRun.stdout);
  assert.equal(summaryRun.status, 0, summaryRun.stderr);
  const stressed = JSON.parse(summaryRun.stdout);
  assert.equal(stressed.deal.feePerTransaction, 0.19);
  assert.equal(stressed.totalProfit, 2100);
  assert.equal(stressed.viable, false);
  const liquidity = stressed.participants.find(({ name }) => name === 'Liquidity Partner');
  assert.equal(liquidity.monthlyProfit, 50);
  assert.equal(liquidity.viable, false);
  assert.ok(stressed.participants.filter(({ viable }) => viable).length === 2, 'Platform and Distributor still hold');
  assert.match(study, /Total monthly profit: `2100`/);
  assert.match(study, /Liquidity Partner profit: `50`, floor `100`, fails/);
});
