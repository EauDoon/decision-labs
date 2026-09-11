import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import { catalogVersionLine, notFoundPage, catalogJobs, catalogLastWhatsNewHeading, catalogFirstWhatsNewHeading, catalogFirstWorkbenchHeading, catalogLastWorkbenchHeading, catalogLastReviewPath, catalogFirstReviewPath, catalogFirstOpenHref, catalogLastOpenHref, catalogFirstSkipHref } from '../scripts/serve.mjs';

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
  assert.match(page, /id="copy-first-whats-new"/);
  assert.match(page, />Copy first What's new heading</);
  assert.match(page, /firstWhatsNewMarkdown/);
  assert.match(page, /id="copy-first-workbench"/);
  assert.match(page, />Copy first workbench heading</);
  assert.match(page, /firstWorkbenchMarkdown/);
  assert.match(page, /id="copy-last-workbench"/);
  assert.match(page, />Copy last workbench heading</);
  assert.match(page, /lastWorkbenchMarkdown/);
  assert.match(page, /id="copy-last-review"/);
  assert.match(page, />Copy last review path</);
  assert.match(page, /lastReviewMarkdown/);
  assert.match(page, /id="copy-first-review"/);
  assert.match(page, />Copy first review path</);
  assert.match(page, /firstReviewMarkdown/);
  assert.match(page, /id="copy-first-open"/);
  assert.match(page, />Copy first Open href</);
  assert.match(page, /firstOpenMarkdown/);
  assert.match(page, /id="copy-last-open"/);
  assert.match(page, />Copy last Open href</);
  assert.match(page, /lastOpenMarkdown/);
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

test('404 first What\'s new heading matches the first catalog What\'s new heading', () => {
  const heading = catalogFirstWhatsNewHeading();
  assert.match(heading, /\S/);
  assert.equal(html.includes(`>${heading}</h3>`), true, 'first What\'s new heading missing from catalog');
  const page = notFoundPage();
  assert.equal(page.includes(heading), true, 'first What\'s new heading missing from 404 page');
  assert.match(page, /id="copy-first-whats-new"/);
  assert.match(page, />Copy first What's new heading</);
  assert.match(page, /id="copy-last-whats-new"/);
  assert.match(page, />Copy last What's new heading</);
});

test('404 first workbench heading matches the first catalog workbench card heading', () => {
  const heading = catalogFirstWorkbenchHeading();
  assert.equal(heading, 'Partnership Breakpoint');
  assert.equal(html.includes(`<h3>${heading}</h3>`), true, 'first workbench heading missing from catalog');
  const page = notFoundPage();
  assert.equal(page.includes(heading), true, 'first workbench heading missing from 404 page');
  assert.match(page, /id="copy-first-workbench"/);
  assert.match(page, />Copy first workbench heading</);
  assert.match(page, /querySelector\('#workbenches article\.workbench h3'\)/);
  assert.match(page, /id="workbenches"/);
});


test('404 last workbench heading matches the last catalog workbench card heading', () => {
  const heading = catalogLastWorkbenchHeading();
  assert.equal(heading, 'Weekend Gap');
  assert.equal(html.includes(`<h3>${heading}</h3>`), true, 'last workbench heading missing from catalog');
  const first = catalogFirstWorkbenchHeading();
  assert.equal(first, 'Partnership Breakpoint');
  assert.notEqual(heading, first);
  const page = notFoundPage();
  assert.equal(page.includes(heading), true, 'last workbench heading missing from 404 page');
  assert.equal(page.includes(first), true, 'first workbench heading missing from 404 page');
  assert.match(page, /id="copy-last-workbench"/);
  assert.match(page, />Copy last workbench heading</);
  assert.match(page, /querySelectorAll\('#workbenches article\.workbench h3'\)/);
  assert.match(page, /id="workbenches"/);
  assert.match(page, /id="copy-first-workbench"/);
  assert.match(page, />Copy first workbench heading</);
});

test('404 last Open href matches the last catalog Open workbench href', () => {
  const href = catalogLastOpenHref();
  assert.equal(href, 'apps/weekend-gap/standalone.html');
  assert.equal(html.includes(`href="${href}"`), true, 'last Open href missing from catalog');
  assert.notEqual(href, catalogFirstOpenHref());
  assert.notEqual(href, catalogLastReviewPath());
  assert.notEqual(href, catalogLastWorkbenchHeading());
  const page = notFoundPage();
  assert.equal(page.includes(href), true, 'last Open href missing from 404 page');
  assert.match(page, /id="copy-last-open"/);
  assert.match(page, />Copy last Open href</);
  assert.match(page, /querySelectorAll\('#workbenches a\.open'\)/);
  assert.match(page, /id="workbenches"/);
  assert.match(page, /id="copy-first-open"/);
  assert.match(page, />Copy first Open href</);
});

test('404 first skip href matches the first catalog skip-link href', () => {
  const href = catalogFirstSkipHref();
  assert.equal(href, '#whats-new');
  assert.equal(html.includes(`href="${href}"`), true, 'first skip href missing from catalog');
  assert.notEqual(href, catalogFirstOpenHref());
  assert.notEqual(href, catalogLastOpenHref());
  const page = notFoundPage();
  assert.equal(page.includes(href), true, 'first skip href missing from 404 page');
  assert.match(page, /id="copy-first-skip"/);
  assert.match(page, />Copy first skip href</);
  assert.match(page, /querySelector\('#skips a\.skip'\)/);
  assert.match(page, /id="skips"/);
  assert.match(page, /id="copy-last-open"/);
  assert.match(page, />Copy last Open href</);
});

test('404 first Open href matches the first catalog Open workbench href', () => {
  const href = catalogFirstOpenHref();
  assert.equal(href, 'apps/partnership-breakpoint/standalone.html');
  assert.equal(html.includes(`href="${href}"`), true, 'first Open href missing from catalog');
  assert.notEqual(href, catalogFirstReviewPath());
  assert.notEqual(href, catalogFirstWorkbenchHeading());
  const page = notFoundPage();
  assert.equal(page.includes(href), true, 'first Open href missing from 404 page');
  assert.match(page, /id="copy-first-open"/);
  assert.match(page, />Copy first Open href</);
  assert.match(page, /querySelector\('#workbenches a\.open'\)/);
  assert.match(page, /id="workbenches"/);
  assert.match(page, /id="copy-first-review"/);
  assert.match(page, />Copy first review path</);
});

test('404 first review path matches the first catalog workbench review path', () => {
  const path = catalogFirstReviewPath();
  assert.match(path, /Review constraints and negotiation room/);
  assert.equal(html.includes('Review constraints and negotiation room'), true, 'first review path missing from catalog');
  assert.notEqual(path, catalogFirstWorkbenchHeading());
  assert.notEqual(path, catalogLastReviewPath());
  const page = notFoundPage();
  assert.equal(page.includes(path), true, 'first review path missing from 404 page');
  assert.match(page, /id="copy-first-review"/);
  assert.match(page, />Copy first review path</);
  assert.match(page, /querySelector\('#workbenches article\.workbench \.review-path'\)/);
  assert.match(page, /id="workbenches"/);
  assert.match(page, /id="copy-last-review"/);
  assert.match(page, />Copy last review path</);
});

test('404 last review path matches the last catalog workbench review path', () => {
  const path = catalogLastReviewPath();
  assert.match(path, /Review the timing behind the queue/);
  assert.equal(html.includes('Review the timing behind the queue'), true, 'last review path missing from catalog');
  assert.notEqual(path, catalogLastWorkbenchHeading());
  const page = notFoundPage();
  assert.equal(page.includes(path), true, 'last review path missing from 404 page');
  assert.match(page, /id="copy-last-review"/);
  assert.match(page, />Copy last review path</);
  assert.match(page, /querySelectorAll\('#workbenches article\.workbench \.review-path'\)/);
  assert.match(page, /id="workbenches"/);
  assert.match(page, /id="copy-last-workbench"/);
  assert.match(page, />Copy last workbench heading</);
});


test('catalog versions stay Partnership Breakpoint 1.5.19, Common Cart 1.4.19, The Smallest Agreement 1.5.19, Weekend Gap 1.5.19', () => {
  assert.match(html, /data-app="partnership-breakpoint">\s*1\.5\.19\s*</);
  assert.match(html, /data-app="common-cart">\s*1\.4\.19\s*</);
  assert.match(html, /data-app="smallest-agreement">\s*1\.5\.19\s*</);
  assert.match(html, /data-app="weekend-gap">\s*1\.5\.19\s*</);
  assert.match(html, /data-app-version="partnership-breakpoint">\s*1\.5\.19\s*</);
  assert.match(html, /data-app-version="common-cart">\s*1\.4\.19\s*</);
  assert.match(html, /data-app-version="smallest-agreement">\s*1\.5\.19\s*</);
  assert.match(html, /data-app-version="weekend-gap">\s*1\.5\.19\s*</);
  assert.match(html, /Partnership Breakpoint 1\.5\.19, Common Cart 1\.4\.19, The Smallest Agreement 1\.5\.19, Weekend Gap 1\.5\.19/);
  assert.match(readme, /\[Partnership Breakpoint\]\(apps\/partnership-breakpoint\/\) \| 1\.5\.19 \|/);
  assert.match(readme, /\[Common Cart\]\(apps\/common-cart\/\) \| 1\.4\.19 \|/);
  assert.match(readme, /\[The Smallest Agreement\]\(apps\/smallest-agreement\/\) \| 1\.5\.19 \|/);
  assert.match(readme, /\[Weekend Gap\]\(apps\/weekend-gap\/\) \| 1\.5\.19 \|/);
});
