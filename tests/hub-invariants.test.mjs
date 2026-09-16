import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const root = new URL('../', import.meta.url);
const html = readFileSync(new URL('index.html', root), 'utf8');
const notFound = readFileSync(new URL('404.html', root), 'utf8');
const serve = readFileSync(new URL('scripts/serve.mjs', root), 'utf8');
const packageJson = JSON.parse(readFileSync(new URL('package.json', root), 'utf8'));

test('root package remains a private dependency-free catalog', () => {
  assert.equal(packageJson.private, true);
  assert.equal(packageJson.type, 'module');
  assert.equal(packageJson.dependencies, undefined);
  assert.equal(packageJson.devDependencies, undefined);
  assert.match(packageJson.engines.node, />=20/);
});

test('catalog IDs are unique and all local hrefs stay in the intended surface', () => {
  const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(([, id]) => id);
  assert.equal(new Set(ids).size, ids.length);
  const hrefs = [...html.matchAll(/\bhref="([^"]+)"/g)].map(([, href]) => href);
  const repositoryCaseStudy = 'https://github.com/EauDoon/decision-labs/blob/main/docs/CASE_STUDY.md';
  const repositoryReadme = 'https://github.com/EauDoon/decision-labs/blob/main/README.md';
  const repositoryDocs = new Set([repositoryCaseStudy, repositoryReadme]);
  const localRoutes = new Set([
    'apps/partnership-breakpoint/standalone.html',
    'apps/common-cart/standalone.html',
    'apps/smallest-agreement/standalone.html',
    'apps/weekend-gap/standalone.html',
  ]);
  assert.equal(hrefs.filter((href) => href === repositoryCaseStudy).length, 2);
  assert.equal(hrefs.filter((href) => href === repositoryReadme).length, 1);
  for (const href of hrefs) {
    if (href.startsWith('#')) continue;
    if (repositoryDocs.has(href)) continue;
    assert.ok(localRoutes.has(href), `unsupported nonfragment href: ${href}`);
  }
  for (const entry of localRoutes) assert.ok(hrefs.includes(entry), `${entry} missing from catalog`);
});

test('catalog and 404 keep local-only, model, and privacy boundaries visible', () => {
  for (const source of [html, notFound]) {
    assert.doesNotMatch(source, /\bfetch\s*\(|XMLHttpRequest|WebSocket|navigator\.sendBeacon/);
    assert.match(source, /browser|locally|local/i);
    assert.match(source, /decision|model/i);
  }
  assert.match(html, /There is no shared account/);
  assert.match(html, /Do not share drafts/);
  assert.match(notFound, /do not call remote APIs/i);
});

test('404 is a small static navigation page and remains outside the public allowlist', () => {
  assert.ok(notFound.split(/\r?\n/).length < 120);
  assert.match(notFound, /href="\/"/);
  assert.match(notFound, /That page is not in the catalog/);
  assert.doesNotMatch(notFound, /<script\b|keydown|preventDefault|copy-|Keyboard shortcuts|What's new/i);
  for (const entry of [
    '/apps/partnership-breakpoint/standalone.html',
    '/apps/common-cart/standalone.html',
    '/apps/smallest-agreement/standalone.html',
    '/apps/weekend-gap/standalone.html',
  ]) assert.match(notFound, new RegExp(`href="${entry.replaceAll('/', '\\/')}"`));
  assert.match(serve, /PUBLIC_PATHS = Object\.freeze\(\[/);
  assert.doesNotMatch(serve, /['"]\/404\.html['"]/);
});

test('launcher source retains the loopback, method, path, and CSP guards', () => {
  assert.match(serve, /request\.method !== 'GET' && request\.method !== 'HEAD'/);
  assert.match(serve, /server\.listen\(port, '127\.0\.0\.1'/);
  assert.match(serve, /!\/\^\(127\\\.0\\\.0\\\.1\|localhost\)/);
  assert.match(serve, /connect-src 'none'/);
  assert.match(serve, /X-Content-Type-Options/);
  assert.match(serve, /X-Frame-Options/);
  assert.match(serve, /Referrer-Policy/);
});
