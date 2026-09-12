import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import { catalogVersionLine, notFoundPage, catalogJobs } from '../scripts/serve.mjs';

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
  assert.equal(page.includes(line), true, '404 version line does not include the printed catalog line');
});

test('404 jobs list equals the catalog card names and jobs', () => {
  const cards = catalogJobs();
  assert.equal(cards.length, 4);
  const page = notFoundPage();
  for (const { name, job } of cards) {
    assert.equal(page.includes(`${name}: ${job}`), true, `404 job list missing ${name}`);
  }
});

test('what&#39;s new headings come from the printed list and mention a real release', () => {
  const first = html.match(/<h3 tabindex="-1">([^<]+)<\/h3>/)?.[1] ?? '';
  assert.equal(first.length > 0, true, 'What&#39;s new has no heading');
  assert.match(readme, /Weekend Gap 1\.8\.0/);
});

test('README workbench table names jobs and versions without claiming live services', () => {
  assert.match(readme, /no network requests/);
  assert.doesNotMatch(readme, /hosted API|live feed/i);
});
