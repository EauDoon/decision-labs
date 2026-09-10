import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import { PUBLIC_PATHS, CONTENT_SECURITY_POLICY, notFoundPage } from '../scripts/serve.mjs';

const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const serve = readFileSync(new URL('../scripts/serve.mjs', import.meta.url), 'utf8');

test('root package is a catalog with no npm dependencies', () => {
  assert.equal(pkg.name, 'decision-labs');
  assert.equal(pkg.private, true);
  assert.match(pkg.description, /local catalog of four independent, offline decision workbenches/i);
  assert.equal(pkg.dependencies, undefined);
  assert.equal(pkg.devDependencies, undefined);
  assert.equal(pkg.optionalDependencies, undefined);
  assert.match(pkg.scripts.check, /scripts\/check-hub\.mjs/);
  assert.match(pkg.scripts.test, /tests\/hub-page\.test\.mjs/);
  assert.match(pkg.scripts.test, /tests\/launcher\.test\.mjs/);
  assert.match(pkg.scripts.test, /tests\/hub-invariants\.test\.mjs/);
  assert.match(pkg.scripts.test, /tests\/hub-versions\.test\.mjs/);
  assert.equal(pkg.engines.node, '>=20');
});

test('catalog keys minus equals quote stay distinct from copy-how and copy-first-trust', () => {
  assert.match(html, /event\.key === '-'/);
  assert.match(html, /event\.key === '='/);
  assert.match(html, /event\.key === '"'/);
  assert.match(html, /event\.key === 'u'/);
  assert.match(html, /event\.key === 'd'/);
  assert.match(html, /event\.key === 'k'/);
  assert.match(html, /event\.key === ':'/);
  assert.match(html, /inEditable\(event\.target\)/);
  assert.match(html, /id="copy-first-how"/);
  assert.match(html, />Copy first How it works item</);
  assert.match(html, /id="copy-how"/);
  assert.match(html, />Copy How it works</);
  assert.match(html, /id="copy-last-trust"/);
  assert.match(html, />Copy last Trust item</);
  assert.match(html, /id="copy-first-trust"/);
  assert.match(html, />Copy first Trust item</);
  assert.notEqual(html.match(/id="copy-first-how"/)?.[0], html.match(/id="copy-first-trust"/)?.[0]);
  assert.match(html, /firstHowBtn\?\.click\(\)/);
  assert.match(html, /howBtn\?\.click\(\)/);
  assert.match(html, /lastTrustBtn\?\.click\(\)/);
  assert.match(html, /firstTrustBtn\?\.click\(\)/);
});

test('print CSS hides the new copy tools like other copy tools', () => {
  const print = html.match(/@media print \{([\s\S]*)\}\s*<\/style>/)?.[1] ?? '';
  assert.match(print, /\.copy-first-how-tools, \.copy-first-how-fallback \{ display: none !important; \}/);
  assert.match(print, /\.copy-last-how-tools, \.copy-last-how-fallback \{ display: none !important; \}/);
  assert.match(print, /\.copy-last-trust-tools, \.copy-last-trust-fallback \{ display: none !important; \}/);
  assert.match(print, /\.copy-first-trust-tools, \.copy-first-trust-fallback \{ display: none !important; \}/);
  assert.match(print, /\.copy-how-tools, \.copy-how-fallback/);
  assert.match(print, /#how-it-works, \.guide \{ display: block !important; \}/);
});

test('catalog keys less-than greater-than underscore stay distinct from copy-how, copy-first-how, copy-last-trust', () => {
  assert.match(html, /event\.key === '<'/);
  assert.match(html, /event\.key === '>'/);
  assert.match(html, /event\.key === '_'/);
  assert.match(html, /event\.key === '-'/);
  assert.match(html, /event\.key === '='/);
  assert.match(html, /event\.key === '"'/);
  assert.match(html, /event\.key === 'u'/);
  assert.match(html, /event\.key === 'd'/);
  assert.match(html, /inEditable\(event\.target\)/);
  assert.match(html, /id="copy-last-how"/);
  assert.match(html, />Copy last How it works item</);
  assert.match(html, /id="copy-first-how"/);
  assert.match(html, />Copy first How it works item</);
  assert.match(html, /id="copy-how"/);
  assert.match(html, />Copy How it works</);
  assert.match(html, /id="copy-last-trust"/);
  assert.match(html, />Copy last Trust item</);
  assert.notEqual(html.match(/id="copy-last-how"/)?.[0], html.match(/id="copy-first-how"/)?.[0]);
  assert.notEqual(html.match(/id="copy-last-how"/)?.[0], html.match(/id="copy-last-trust"/)?.[0]);
  assert.match(html, /lastHowBtn\?\.click\(\)/);
  assert.match(html, /firstHowBtn\?\.click\(\)/);
  assert.match(html, /howBtn\?\.click\(\)/);
  assert.match(html, /lastTrustBtn\?\.click\(\)/);
});

test('404 Copy last How it works item does not expand PUBLIC_PATHS or connect-src', () => {
  assert.equal(PUBLIC_PATHS.length, 6);
  assert.deepEqual([...PUBLIC_PATHS], [
    '/',
    '/index.html',
    '/apps/partnership-breakpoint/standalone.html',
    '/apps/common-cart/standalone.html',
    '/apps/smallest-agreement/standalone.html',
    '/apps/weekend-gap/standalone.html',
  ]);
  assert.match(CONTENT_SECURITY_POLICY, /connect-src 'none'/);
  assert.match(serve, /request\.method !== 'GET' && request\.method !== 'HEAD'/);
  const page = notFoundPage();
  assert.match(page, /id="copy-last-how"/);
  assert.match(page, />Copy last How it works item</);
  assert.match(page, /lastHowMarkdown/);
  assert.match(page, /id="copy-first-how"/);
  assert.match(page, />Copy first How it works item</);
  assert.match(page, /id="copy-how"/);
  assert.match(page, />Copy How it works</);
  assert.match(page, /id="copy-first-trust"/);
  assert.doesNotMatch(page, /id="copy-last-trust"/);
  assert.doesNotMatch(page, /\bfetch\s*\(/);
  assert.doesNotMatch(serve, /hosted API/i);
});


test('404 Copy first How it works item does not expand PUBLIC_PATHS or connect-src', () => {
  assert.equal(PUBLIC_PATHS.length, 6);
  assert.deepEqual([...PUBLIC_PATHS], [
    '/',
    '/index.html',
    '/apps/partnership-breakpoint/standalone.html',
    '/apps/common-cart/standalone.html',
    '/apps/smallest-agreement/standalone.html',
    '/apps/weekend-gap/standalone.html',
  ]);
  assert.match(CONTENT_SECURITY_POLICY, /connect-src 'none'/);
  assert.match(serve, /request\.method !== 'GET' && request\.method !== 'HEAD'/);
  const page = notFoundPage();
  assert.match(page, /id="copy-first-how"/);
  assert.match(page, />Copy first How it works item</);
  assert.match(page, /firstHowMarkdown/);
  assert.match(page, /id="copy-how"/);
  assert.match(page, />Copy How it works</);
  assert.match(page, /id="copy-first-trust"/);
  assert.doesNotMatch(page, /id="copy-last-trust"/);
  assert.doesNotMatch(page, /\bfetch\s*\(/);
  assert.doesNotMatch(serve, /hosted API/i);
});
