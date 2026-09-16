import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import { catalogVersionLine, notFoundPage } from '../scripts/serve.mjs';

const root = new URL('../', import.meta.url);
const html = readFileSync(new URL('index.html', root), 'utf8');
const readme = readFileSync(new URL('README.md', root), 'utf8');
const notFound = readFileSync(new URL('404.html', root), 'utf8');
const apps = [
  ['partnership-breakpoint', 'Partnership Breakpoint'],
  ['common-cart', 'Common Cart'],
  ['smallest-agreement', 'The Smallest Agreement'],
  ['weekend-gap', 'Weekend Gap'],
];

test('catalog cards, version list, footer, and README stay synchronized with package versions', () => {
  const versionLine = html.match(/class="version-line">([^<]+)</)?.[1] ?? '';
  for (const [id, label] of apps) {
    const version = JSON.parse(readFileSync(new URL(`apps/${id}/package.json`, root), 'utf8')).version;
    const escaped = version.replaceAll('.', '\\.');
    assert.match(html, new RegExp(`data-app="${id}">\\s*${escaped}\\s*<`));
    assert.match(html, new RegExp(`data-app-version="${id}">\\s*${escaped}\\s*<`));
    assert.match(versionLine, new RegExp(`${label} ${escaped}`));
    assert.match(readme, new RegExp(`\\[${label.replaceAll(' ', '\\s+')}\\]\\(apps/${id}/\\) \\| ${escaped} \\|`));
  }
});

test('catalogVersionLine reads each current package version and the 404 repeats it', () => {
  const line = catalogVersionLine();
  for (const [, label] of apps) assert.match(line, new RegExp(label));
  assert.equal(notFound.includes(line), true);
  assert.equal(notFoundPage(), notFound);
});

test('versioned workbench links are exactly four and remain standalone entrypoints', () => {
  const links = [...html.matchAll(/<a class="open" href="([^"]+)">Open workbench<\/a>/g)].map(([, href]) => href);
  assert.deepEqual(links, apps.map(([id]) => `apps/${id}/standalone.html`));
  assert.equal(new Set(links).size, 4);
});
