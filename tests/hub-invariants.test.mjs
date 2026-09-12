import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import { notFoundPage, catalogVersionLine, catalogJobs, catalogFirstWhatsNewHeading, catalogLastWhatsNewHeading, catalogFirstWorkbenchHeading, catalogFirstOpenHref, catalogSkipLinks, PUBLIC_PATHS, CONTENT_SECURITY_POLICY, publicFile } from '../scripts/serve.mjs';

const serve = readFileSync(new URL('../scripts/serve.mjs', import.meta.url), 'utf8');
const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');

test('launcher public path set is exact and closed', () => {
  assert.equal(PUBLIC_PATHS.length, 6);
  assert.deepEqual([...PUBLIC_PATHS], [
    '/',
    '/index.html',
    '/apps/partnership-breakpoint/standalone.html',
    '/apps/common-cart/standalone.html',
    '/apps/smallest-agreement/standalone.html',
    '/apps/weekend-gap/standalone.html',
  ]);
  assert.equal(publicFile('/'), 'index.html');
  assert.equal(publicFile('/apps/weekend-gap/standalone.html'), 'apps/weekend-gap/standalone.html');
  assert.equal(publicFile('/src/model.js'), null);
  assert.equal(publicFile('/apps/weekend-gap/src/model.js'), null);
  assert.equal(publicFile('/MODEL.md'), null);
  assert.equal(publicFile('/../package.json'), null);
});

test('CSP keeps the launcher isolated from the network', () => {
  assert.match(CONTENT_SECURITY_POLICY, /connect-src 'none'/);
  assert.match(serve, /request\.method !== 'GET' && request\.method !== 'HEAD'/);
  assert.match(serve, /127\\.0\\.0\\.1\|localhost/);
  assert.match(serve, /no-store/);
});

test('404 page names the catalog, lists versions, and links back by name', () => {
  const page = notFoundPage();
  assert.match(page, /This path is not in the catalog/);
  assert.match(page, /Decision Labs/);
  assert.match(page, /Partnership Breakpoint/);
  assert.match(page, /Common Cart/);
  assert.match(page, /The Smallest Agreement/);
  assert.match(page, /Weekend Gap/);
  assert.match(page, /Current catalog:/);
  const line = catalogVersionLine();
  assert.equal(page.includes(line), true);
});

test('404 page keeps one copy tool per printed list', () => {
  const page = notFoundPage();
  const buttons = [...page.matchAll(/<button[^>]*id="copy-([a-z-]+)"/g)].map((m) => m[1]);
  assert.deepEqual([...new Set(buttons)].sort(), ['how', 'jobs', 'lede', 'trust', 'versions']);
  for (const id of ['copy-lede', 'copy-versions', 'copy-jobs', 'copy-how', 'copy-trust']) {
    assert.match(page, new RegExp(`id="${id}-fallback"`));
  }
  assert.doesNotMatch(page, /fetch\(/);
  assert.doesNotMatch(page, /aria-keyshortcuts="(PageUp|Insert|F7|Shift\+F10)"/);
});

test('404 copy markdown derives from the printed page content only', () => {
  const page = notFoundPage();
  const jobs = catalogJobs();
  assert.equal(jobs.length, 4);
  for (const { name, job } of jobs) {
    assert.equal(page.includes(`${name}: ${job}`), true, `404 job list missing ${name}`);
  }
  assert.equal(page.includes(catalogFirstWhatsNewHeading()), true);
  assert.equal(page.includes(catalogLastWhatsNewHeading()), true);
  assert.equal(page.includes(catalogFirstWorkbenchHeading()), true);
  assert.equal(page.includes(catalogFirstOpenHref()), true);
  for (const { href } of catalogSkipLinks()) {
    assert.equal(page.includes(`href="${href}"`), true);
  }
});

test('404 page stays script-light and keeps the trust boundary', () => {
  const page = notFoundPage();
  const script = page.match(/<script>([\s\S]*)<\/script>/)?.[1] ?? '';
  assert.doesNotMatch(script, /\bfetch\s*\(/);
  assert.doesNotMatch(script, /XMLHttpRequest|WebSocket|EventSource/);
  assert.doesNotMatch(serve, /hosted API/i);
});
