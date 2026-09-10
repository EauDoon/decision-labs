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

test('catalog keys close-brace plus pipe stay distinct from first-job jobs last-How and equals', () => {
  assert.match(html, /event\.key === '}'/);
  assert.match(html, /event\.key === '\+'/);
  assert.equal(html.includes("event.key === '|'"), true);
  assert.match(html, /event\.key === ';'/);
  assert.match(html, /event\.key === 'j'/);
  assert.match(html, /event\.key === '>'/);
  assert.match(html, /event\.key === '_'/);
  assert.match(html, /event\.key === '<'/);
  assert.match(html, /event\.key === '='/);
  assert.match(html, /inEditable\(event\.target\)/);
  assert.match(html, /id="copy-last-job"/);
  assert.match(html, />Copy last job</);
  assert.match(html, /id="copy-first-job"/);
  assert.match(html, />Copy first job</);
  assert.match(html, /id="copy-jobs"/);
  assert.match(html, />Copy jobs</);
  assert.match(html, /id="copy-last-how"/);
  assert.match(html, />Copy last How it works item</);
  assert.notEqual(html.match(/id="copy-last-job"/)?.[0], html.match(/id="copy-first-job"/)?.[0]);
  assert.notEqual(html.match(/id="copy-last-job"/)?.[0], html.match(/id="copy-jobs"/)?.[0]);
  assert.notEqual(html.match(/id="copy-last-job"/)?.[0], html.match(/id="copy-last"/)?.[0]);
  assert.match(html, /lastJobBtn\?\.click\(\)/);
  assert.match(html, /firstJobBtn\?\.click\(\)/);
  assert.match(html, /jobsBtn\?\.click\(\)/);
  assert.match(html, /lastHowBtn\?\.click\(\)/);
});

test('catalog keys tilde exclamation open-paren stay distinct from g n last-job and last-How', () => {
  assert.match(html, /event\.key === '~'/);
  assert.match(html, /event\.key === '!'/);
  assert.match(html, /event\.key === '\('/);
  assert.match(html, /event\.key === 'g'/);
  assert.match(html, /event\.key === 'n'/);
  assert.match(html, /event\.key === '}'/);
  assert.match(html, /event\.key === '<'/);
  assert.match(html, /inEditable\(event\.target\)/);
  assert.match(html, /id="copy-last-whats-new"/);
  assert.match(html, />Copy last What's new heading</);
  assert.match(html, /id="copy-first-whats-new"/);
  assert.match(html, />Copy first What's new heading</);
  assert.match(html, /id="copy-last-job"/);
  assert.match(html, />Copy last job</);
  assert.match(html, /id="copy-last-how"/);
  assert.match(html, />Copy last How it works item</);
  assert.notEqual(html.match(/id="copy-last-whats-new"/)?.[0], html.match(/id="copy-first-whats-new"/)?.[0]);
  assert.notEqual(html.match(/id="copy-last-whats-new"/)?.[0], html.match(/id="copy-last-job"/)?.[0]);
  assert.notEqual(html.match(/id="copy-last-whats-new"/)?.[0], html.match(/id="copy-last-how"/)?.[0]);
  assert.match(html, /lastWhatsNewBtn\?\.click\(\)/);
  assert.match(html, /lastJobBtn\?\.click\(\)/);
  assert.match(html, /lastHowBtn\?\.click\(\)/);
});

test('catalog keys close-paren stay distinct from tilde open-paren g and n', () => {
  assert.match(html, /event\.key === '\)'/);
  assert.match(html, /event\.key === '~'/);
  assert.match(html, /event\.key === '\('/);
  assert.match(html, /event\.key === 'g'/);
  assert.match(html, /event\.key === 'n'/);
  assert.match(html, /inEditable\(event\.target\)/);
  assert.match(html, /aria-keyshortcuts="\)"/);
  assert.match(html, /id="copy-first-whats-new"/);
  assert.match(html, />Copy first What's new heading</);
  assert.match(html, /id="copy-last-whats-new"/);
  assert.match(html, />Copy last What's new heading</);
  assert.notEqual(html.match(/event\.key === '\)'/)?.[0], html.match(/event\.key === '~'/)?.[0]);
  assert.notEqual(html.match(/event\.key === '\)'/)?.[0], html.match(/event\.key === '\('/)?.[0]);
  assert.notEqual(html.match(/event\.key === '\)'/)?.[0], html.match(/event\.key === 'g'/)?.[0]);
  assert.match(html, /firstWhatsNewBtn\?\.click\(\)/);
  assert.match(html, /lastWhatsNewBtn\?\.click\(\)/);
});

test('catalog keys at stay distinct from e and close-paren', () => {
  assert.match(html, /event\.key === '@'/);
  assert.match(html, /event\.key === 'e'/);
  assert.match(html, /event\.key === '\)'/);
  assert.match(html, /inEditable\(event\.target\)/);
  assert.match(html, /id="copy-lede"/);
  assert.match(html, />Copy catalog intro</);
  assert.match(html, /id="catalog-heading"/);
  assert.notEqual(html.match(/event\.key === '@'/)?.[0], html.match(/event\.key === 'e'/)?.[0]);
  assert.match(html, /ledeBtn\?\.click\(\)/);
  assert.match(html, /getElementById\('copy-lede'\) \|\| document\.getElementById\('catalog-heading'\)/);
});

test('catalog keys hash stay distinct from z and at', () => {
  assert.match(html, /event\.key === '#'/);
  assert.match(html, /event\.key === 'z'/);
  assert.match(html, /event\.key === '@'/);
  assert.match(html, /inEditable\(event\.target\)/);
  assert.match(html, /id="copy-skips"/);
  assert.match(html, />Copy skip links</);
  assert.match(html, /id="skips"/);
  assert.notEqual(html.match(/event\.key === '#'/)?.[0], html.match(/event\.key === 'z'/)?.[0]);
  assert.match(html, /skipsBtn\?\.click\(\)/);
  assert.match(html, /getElementById\('copy-skips'\) \|\| document\.getElementById\('skips'\) \|\| document\.getElementById\('catalog-heading'\)/);
});

test('catalog keys close-paren at and hash stay distinct from tilde open-paren e z g n', () => {
  assert.match(html, /event\.key === '\)'/);
  assert.match(html, /event\.key === '@'/);
  assert.match(html, /event\.key === '#'/);
  assert.match(html, /event\.key === '~'/);
  assert.match(html, /event\.key === '\('/);
  assert.match(html, /event\.key === 'e'/);
  assert.match(html, /event\.key === 'z'/);
  assert.match(html, /event\.key === 'g'/);
  assert.match(html, /event\.key === 'n'/);
  assert.match(html, /inEditable\(event\.target\)/);
  assert.notEqual(html.match(/event\.key === '\)'/)?.[0], html.match(/event\.key === '~'/)?.[0]);
  assert.notEqual(html.match(/event\.key === '\)'/)?.[0], html.match(/event\.key === '\('/)?.[0]);
  assert.notEqual(html.match(/event\.key === '@'/)?.[0], html.match(/event\.key === 'e'/)?.[0]);
  assert.notEqual(html.match(/event\.key === '#'/)?.[0], html.match(/event\.key === 'z'/)?.[0]);
  assert.match(html, /firstWhatsNewBtn\?\.click\(\)/);
  assert.match(html, /lastWhatsNewBtn\?\.click\(\)/);
  assert.match(html, /ledeBtn\?\.click\(\)/);
  assert.match(html, /skipsBtn\?\.click\(\)/);
  assert.match(html, /getElementById\('copy-lede'\) \|\| document\.getElementById\('catalog-heading'\)/);
  assert.match(html, /getElementById\('copy-skips'\) \|\| document\.getElementById\('skips'\) \|\| document\.getElementById\('catalog-heading'\)/);
});

test('print CSS hides copy last job tools like other copy tools', () => {
  const print = html.match(/@media print \{([\s\S]*)\}\s*<\/style>/)?.[1] ?? '';
  assert.match(print, /\.copy-last-job-tools, \.copy-last-job-fallback \{ display: none !important; \}/);
  assert.match(print, /\.copy-first-job-tools, \.copy-first-job-fallback \{ display: none !important; \}/);
  assert.match(print, /\.copy-last-how-tools, \.copy-last-how-fallback \{ display: none !important; \}/);
  assert.match(print, /#how-it-works, \.guide \{ display: block !important; \}/);
});

test('print CSS hides copy last What\'s new heading tools like other copy tools', () => {
  const print = html.match(/@media print \{([\s\S]*)\}\s*<\/style>/)?.[1] ?? '';
  assert.match(print, /\.copy-last-whats-new-tools, \.copy-last-whats-new-fallback \{ display: none !important; \}/);
  assert.match(print, /\.copy-first-whats-new-tools, \.copy-first-whats-new-fallback \{ display: none !important; \}/);
  assert.match(print, /\.copy-last-job-tools, \.copy-last-job-fallback \{ display: none !important; \}/);
  assert.match(print, /#how-it-works, \.guide \{ display: block !important; \}/);
});

test('404 Copy last job does not expand PUBLIC_PATHS or connect-src', () => {
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
  assert.match(page, /id="copy-last-job"/);
  assert.match(page, />Copy last job</);
  assert.match(page, /lastJobMarkdown/);
  assert.match(page, /id="copy-jobs"/);
  assert.match(page, />Copy jobs</);
  assert.match(page, /id="catalog-jobs"/);
  assert.doesNotMatch(page, /id="copy-first-job"/);
  assert.doesNotMatch(page, /\bfetch\s*\(/);
  assert.doesNotMatch(serve, /hosted API/i);
});

test('404 Copy last What\'s new heading does not expand PUBLIC_PATHS or connect-src', () => {
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
  assert.match(page, /id="copy-last-whats-new"/);
  assert.match(page, />Copy last What's new heading</);
  assert.match(page, /lastWhatsNewMarkdown/);
  assert.match(page, /id="whats-new"/);
  assert.match(page, /id="copy-last-job"/);
  assert.match(page, />Copy last job</);
  assert.match(page, /id="copy-first-whats-new"/);
  assert.doesNotMatch(page, /\bfetch\s*\(/);
  assert.doesNotMatch(serve, /hosted API/i);
});

test('404 Copy first What\'s new heading does not expand PUBLIC_PATHS or connect-src', () => {
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
  assert.match(page, /id="copy-first-whats-new"/);
  assert.match(page, />Copy first What's new heading</);
  assert.match(page, /firstWhatsNewMarkdown/);
  assert.match(page, /id="whats-new"/);
  assert.match(page, /id="copy-last-whats-new"/);
  assert.match(page, />Copy last What's new heading</);
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

test('catalog keys asterisk ampersand and percent stay distinct from close-paren tilde colon and slash', () => {
  assert.match(html, /event\.key === '\*'/);
  assert.match(html, /event\.key === '&'/);
  assert.match(html, /event\.key === '%'/);
  assert.match(html, /event\.key === '\)'/);
  assert.match(html, /event\.key === '~'/);
  assert.match(html, /event\.key === ':'/);
  assert.match(html, /event\.key === '\/'/);
  assert.match(html, /inEditable\(event\.target\)/);
  assert.match(html, /aria-keyshortcuts="\*"/);
  assert.match(html, /id="copy-first-workbench"/);
  assert.match(html, />Copy first workbench heading</);
  assert.match(html, /id="copy-first-trust"/);
  assert.match(html, />Copy first Trust item</);
  assert.notEqual(html.match(/event\.key === '\*'/)?.[0], html.match(/event\.key === '\)'/)?.[0]);
  assert.notEqual(html.match(/event\.key === '&'/)?.[0], html.match(/event\.key === 'e'/)?.[0]);
  assert.notEqual(html.match(/event\.key === '%'/)?.[0], html.match(/event\.key === ':'/)?.[0]);
  assert.match(html, /firstWorkbenchBtn\?\.click\(\)/);
  assert.match(html, /firstTrustBtn\?\.click\(\)/);
  assert.match(html, /getElementById\('copy-first-workbench'\) \|\| document\.getElementById\('workbenches-title'\)/);
  assert.match(html, /getElementById\('copy-first-trust'\) \|\| document\.getElementById\('trust-title'\)/);
});

test('print CSS hides copy first workbench heading tools like other copy tools', () => {
  const print = html.match(/@media print \{([\s\S]*)\}\s*<\/style>/)?.[1] ?? '';
  assert.match(print, /\.copy-first-workbench-tools, \.copy-first-workbench-fallback \{ display: none !important; \}/);
  assert.match(print, /\.copy-first-whats-new-tools, \.copy-first-whats-new-fallback \{ display: none !important; \}/);
  assert.match(print, /#how-it-works, \.guide \{ display: block !important; \}/);
});

test('404 Copy first workbench heading does not expand PUBLIC_PATHS or connect-src', () => {
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
  assert.match(page, /id="copy-first-workbench"/);
  assert.match(page, />Copy first workbench heading</);
  assert.match(page, /firstWorkbenchMarkdown/);
  assert.match(page, /id="workbenches"/);
  assert.match(page, /id="copy-first-whats-new"/);
  assert.match(page, />Copy first What's new heading</);
  assert.doesNotMatch(page, /\bfetch\s*\(/);
  assert.doesNotMatch(serve, /hosted API/i);
});
