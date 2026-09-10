import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import { catalogVersionLine, notFoundPage, catalogJobs, catalogLastWhatsNewHeading } from '../scripts/serve.mjs';

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
  assert.match(page, /id="copy-version-line"/);
  assert.match(page, />Copy version line</);
  assert.match(page, /querySelector\('\.version-line'\)/);
  assert.match(page, /versionLineMarkdown/);
  assert.match(page, /id="copy-trust"/);
  assert.match(page, />Copy Trust and limits</);
  assert.match(page, /id="trust"/);
  assert.match(page, /Not a live policy feed/);
  assert.match(page, /id="copy-how"/);
  assert.match(page, />Copy How it works</);
  assert.match(page, /id="how-it-works"/);
  assert.match(page, /id="copy-jobs"/);
  assert.match(page, />Copy jobs</);
  assert.match(page, /id="catalog-jobs"/);
  assert.match(page, /Not a live product feed/);
  assert.match(page, /id="copy-lede"/);
  assert.match(page, />Copy catalog intro</);
  assert.doesNotMatch(page, /\bfetch\s*\(/);
  assert.doesNotMatch(page, /XMLHttpRequest/);
  assert.match(page, /id="copy-first-trust"/);
  assert.match(page, />Copy first Trust item</);
  assert.match(page, /firstTrustMarkdown/);
  assert.match(page, /id="copy-first-how"/);
  assert.match(page, />Copy first How it works item</);
  assert.match(page, /firstHowMarkdown/);
  assert.match(page, /id="copy-last-how"/);
  assert.match(page, />Copy last How it works item</);
  assert.match(page, /lastHowMarkdown/);
  assert.match(page, /id="copy-last-job"/);
  assert.match(page, />Copy last job</);
  assert.match(page, /lastJobMarkdown/);
  assert.match(page, /id="copy-last-whats-new"/);
  assert.match(page, />Copy last What's new heading</);
  assert.match(page, /lastWhatsNewMarkdown/);
});

test('404 catalog jobs match the four catalog cards', () => {
  const jobs = catalogJobs();
  assert.equal(jobs.length, 4);
  assert.equal(jobs[0].name, 'Partnership Breakpoint');
  assert.equal(jobs[1].name, 'Common Cart');
  assert.equal(jobs[2].name, 'The Smallest Agreement');
  assert.equal(jobs[3].name, 'Weekend Gap');
  for (const { name, job } of jobs) {
    assert.match(job, /\S/);
    assert.equal(html.includes(`<h3>${name}</h3>`), true, `${name} heading missing from catalog`);
    assert.equal(html.includes(`<p class="job">${job}</p>`), true, `${name} job missing from catalog`);
  }
  const page = notFoundPage();
  for (const { name, job } of jobs) {
    assert.equal(page.includes(`${name}: ${job}`), true, `${name} job missing from 404 page`);
  }
});

test('404 last What\'s new heading matches the last catalog What\'s new heading', () => {
  const heading = catalogLastWhatsNewHeading();
  assert.match(heading, /\S/);
  assert.equal(html.includes(`>${heading}</h3>`), true, 'last What\'s new heading missing from catalog');
  const page = notFoundPage();
  assert.equal(page.includes(heading), true, 'last What\'s new heading missing from 404 page');
  assert.match(page, /id="copy-last-whats-new"/);
  assert.match(page, />Copy last What's new heading</);
});

test('catalog versions stay Partnership Breakpoint 1.5.11, Common Cart 1.4.11, The Smallest Agreement 1.5.11, Weekend Gap 1.5.11', () => {
  assert.match(html, /data-app="partnership-breakpoint">\s*1\.5\.11\s*</);
  assert.match(html, /data-app="common-cart">\s*1\.4\.11\s*</);
  assert.match(html, /data-app="smallest-agreement">\s*1\.5\.11\s*</);
  assert.match(html, /data-app="weekend-gap">\s*1\.5\.11\s*</);
  assert.match(html, /data-app-version="partnership-breakpoint">\s*1\.5\.11\s*</);
  assert.match(html, /data-app-version="common-cart">\s*1\.4\.11\s*</);
  assert.match(html, /data-app-version="smallest-agreement">\s*1\.5\.11\s*</);
  assert.match(html, /data-app-version="weekend-gap">\s*1\.5\.11\s*</);
  assert.match(html, /Partnership Breakpoint 1\.5\.11, Common Cart 1\.4\.11, The Smallest Agreement 1\.5\.11, Weekend Gap 1\.5\.11/);
  assert.match(readme, /\[Partnership Breakpoint\]\(apps\/partnership-breakpoint\/\) \| 1\.5\.11 \|/);
  assert.match(readme, /\[Common Cart\]\(apps\/common-cart\/\) \| 1\.4\.11 \|/);
  assert.match(readme, /\[The Smallest Agreement\]\(apps\/smallest-agreement\/\) \| 1\.5\.11 \|/);
  assert.match(readme, /\[Weekend Gap\]\(apps\/weekend-gap\/\) \| 1\.5\.11 \|/);
});
