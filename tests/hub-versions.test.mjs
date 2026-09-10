import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import { catalogVersionLine, notFoundPage } from '../scripts/serve.mjs';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const readme = readFileSync(new URL('../README.md', import.meta.url), 'utf8');
const apps = [
  ['partnership-breakpoint', 'Partnership Breakpoint'],
  ['common-cart', 'Common Cart'],
  ['smallest-agreement', 'The Smallest Agreement'],
  ['weekend-gap', 'Weekend Gap'],
];

test('catalog version list and cards match each app package.json', () => {
  assert.match(html, /id="workbench-versions"/);
  const versionLine = html.match(/class="version-line">([^<]+)</)?.[1] ?? '';
  for (const [id, label] of apps) {
    const version = JSON.parse(readFileSync(new URL(`../apps/${id}/package.json`, import.meta.url), 'utf8')).version;
    const escaped = version.replaceAll('.', '\\.');
    assert.match(html, new RegExp(`data-app="${id}">\\s*${escaped}\\s*<`));
    assert.match(html, new RegExp(`data-app-version="${id}">\\s*${escaped}\\s*<`));
    assert.equal(versionLine.includes(`${label} ${version}`), true, `${label} ${version} missing from version line`);
    assert.equal(
      readme.includes(`[${label}](apps/${id}/) | ${version} |`),
      true,
      `${label} ${version} missing from README table`,
    );
  }
});

test('404 catalog version line matches each app package.json', () => {
  const line = catalogVersionLine();
  for (const [id, label] of apps) {
    const version = JSON.parse(readFileSync(new URL(`../apps/${id}/package.json`, import.meta.url), 'utf8')).version;
    assert.equal(line.includes(`${label} ${version}`), true, `${label} ${version} missing from 404 version line`);
  }
  const page = notFoundPage();
  assert.match(page, /Current catalog:/);
  assert.equal(page.includes(line), true, '404 page should include the catalog version line');
  assert.match(page, /id="copy-versions"/);
  assert.match(page, />Copy versions</);
  assert.match(page, /querySelector\('\.version-line'\)/);
  assert.match(page, /id="copy-trust"/);
  assert.match(page, />Copy Trust and limits</);
  assert.match(page, /id="trust"/);
  assert.match(page, /Not a live policy feed/);
  assert.doesNotMatch(page, /\bfetch\s*\(/);
  assert.doesNotMatch(page, /XMLHttpRequest/);
});
