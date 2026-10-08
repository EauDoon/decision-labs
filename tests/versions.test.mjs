import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { APPS } from '../scripts/apps.mjs';
import { checkVersions, syncVersions } from '../scripts/versions.mjs';

const repo = fileURLToPath(new URL('../', import.meta.url));
const script = fileURLToPath(new URL('../scripts/versions.mjs', import.meta.url));
const SURFACE_FILES = ['index.html', '404.html', 'README.md'];

// A temporary copy of every file the version contract reads.
function fixture(t) {
  const root = mkdtempSync(join(tmpdir(), 'decision-labs-versions-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const files = [...SURFACE_FILES, ...APPS.map(({ id }) => `apps/${id}/package.json`)];
  for (const file of files) {
    mkdirSync(dirname(join(root, file)), { recursive: true });
    cpSync(join(repo, file), join(root, file));
  }
  return root;
}

function read(root, file) {
  return readFileSync(join(root, file), 'utf8');
}

function edit(root, file, change) {
  writeFileSync(join(root, file), change(read(root, file)));
}

function setVersion(root, id, version) {
  edit(root, `apps/${id}/package.json`, (text) => text.replace(/"version": "[^"]+"/, `"version": "${version}"`));
}

function run(root, ...args) {
  return spawnSync(process.execPath, [script, ...args, '--root', root], { encoding: 'utf8' });
}

test('the real tree already matches its package versions', (t) => {
  assert.deepEqual(checkVersions(repo), []);
  const root = fixture(t);
  assert.deepEqual(syncVersions(root), [], 'sync on a copy of the real tree changes nothing');
  for (const file of SURFACE_FILES) assert.equal(read(root, file), read(repo, file));
});

test('sync writes a bumped version to every surface and check then passes', (t) => {
  const root = fixture(t);
  setVersion(root, 'common-cart', '9.8.7');
  const problems = checkVersions(root);
  assert.equal(problems.length, 5, problems.join('\n'));
  assert.deepEqual(syncVersions(root).sort(), ['404.html', 'README.md', 'index.html']);
  assert.deepEqual(checkVersions(root), []);
  const html = read(root, 'index.html');
  assert.match(html, /<li data-app="common-cart">9\.8\.7<\/li>/);
  assert.match(html, /<span data-app-version="common-cart">9\.8\.7<\/span>/);
  assert.match(html, /class="version-line">Partnership Breakpoint [^,]+, Common Cart 9\.8\.7, [^<]*\. Each workbench versions itself\.<\/p>/);
  assert.match(read(root, '404.html'), /Current catalog: [^<]*Common Cart 9\.8\.7, [^<]*\.<\/p>/);
  assert.match(read(root, 'README.md'), /\| \[Common Cart\]\(apps\/common-cart\/\) \| 9\.8\.7 \|/);
  const result = run(root, 'check');
  assert.equal(result.status, 0, result.stderr);
});

test('check names each drifted surface', (t) => {
  const cases = [
    ['index.html', /<li data-app="weekend-gap">[^<]*</, '<li data-app="weekend-gap">0.0.1<', /index\.html: the weekend-gap version list entry says "0\.0\.1"/],
    ['index.html', /<span data-app-version="weekend-gap">[^<]*</, '<span data-app-version="weekend-gap">0.0.1<', /index\.html: the weekend-gap catalog card says "0\.0\.1"/],
    ['index.html', /Weekend Gap \d+\.\d+\.\d+\. Each/, 'Weekend Gap 0.0.1. Each', /index\.html: the footer version line says ".*Weekend Gap 0\.0\.1"/],
    ['404.html', /Weekend Gap \d+\.\d+\.\d+\.<\/p>/, 'Weekend Gap 0.0.1.</p>', /404\.html: the current catalog line says ".*Weekend Gap 0\.0\.1"/],
    ['README.md', /(\| \[Weekend Gap\]\(apps\/weekend-gap\/\) \| )[^ |]+/, '$10.0.1', /README\.md: the weekend-gap table row says "0\.0\.1"/],
    ['index.html', /<span data-app-version="weekend-gap">[^<]*<\/span>/, '', /index\.html: the weekend-gap catalog card is missing\./],
  ];
  for (const [file, pattern, replacement, message] of cases) {
    const root = fixture(t);
    edit(root, file, (text) => {
      const next = text.replace(pattern, replacement);
      assert.notEqual(next, text, `${file} fixture edit did not apply`);
      return next;
    });
    const problems = checkVersions(root);
    assert.equal(problems.length, 1, problems.join('\n'));
    assert.match(problems[0], message);
    const result = run(root, 'check');
    assert.equal(result.status, 1);
    assert.match(result.stderr, message);
    assert.match(result.stderr, /npm run versions:sync/);
  }
});

test('the versions command rejects unknown commands and options', (t) => {
  const root = fixture(t);
  for (const args of [['publish'], ['check', 'extra'], ['check', '--force']]) {
    const result = run(root, ...args);
    assert.equal(result.status, 1, args.join(' '));
    assert.equal(result.stdout, '');
    assert.notEqual(result.stderr, '');
  }
});
