import assert from 'node:assert/strict';
import test from 'node:test';
import vm from 'node:vm';
import { readFile } from 'node:fs/promises';

import { buildStandalone } from '../scripts/build-standalone.mjs';

// The workbench renders its whole panel tree in JavaScript, so the only honest
// way to check heading structure is to run the real app module and inspect the
// markup it produces. This is a copy of the shared harness in
// tests/stress-ui.test.mjs, trimmed to what a heading check needs.
async function renderedMarkup() {
  const html = await buildStandalone();
  const script = html.match(/<script type="module">([\s\S]*?)<\/script>/)[1];
  const app = { innerHTML: '', querySelectorAll: () => [], addEventListener() {} };
  class Input { constructor(dataset, value) { this.dataset = dataset; this.value = value; } }
  class Reader { readAsText() { this.onload(); } }
  const locationState = { protocol: 'file:', hash: '', pathname: '/', search: '' };
  Object.defineProperty(locationState, 'href', { configurable: true, enumerable: true, get() { return `${this.protocol}${this.pathname}${this.search}${this.hash}`; } });
  const sandbox = {
    console, Blob, setTimeout: (callback) => callback(),
    URL: { createObjectURL: () => 'blob:test', revokeObjectURL() {} },
    HTMLInputElement: Input, FileReader: Reader, TextEncoder, atob, btoa,
    history: { replaceState(_state, _title, url) { if (typeof url === 'string' && url.includes('#')) locationState.hash = url.slice(url.indexOf('#')); } },
    window: { print() {}, location: locationState, addEventListener() {} },
    document: {
      activeElement: null, createElement: () => ({ click() {} }),
      querySelector: (selector) => (selector === '#workbench' ? app : (selector === '#notice' ? { textContent: '' } : null)),
      querySelectorAll: () => [],
    },
  };
  sandbox.globalThis = sandbox;
  const context = vm.createContext(sandbox);
  new vm.Script(script).runInContext(context, { timeout: 15000 });
  return app.innerHTML;
}

test('the workbench exposes exactly one h1, the page title', async () => {
  const markup = await renderedMarkup();
  assert.ok(markup.length > 0, 'the app must render something');

  const headings = [...markup.matchAll(/<(h[1-6])\b[^>]*>([\s\S]*?)<\/\1>/g)]
    .map((match) => ({ level: Number(match[1][1]), tag: match[1], text: match[2].replace(/<[^>]*>/g, '').trim() }));

  const h1s = headings.filter((heading) => heading.level === 1);
  assert.equal(h1s.length, 1, `expected one h1, found ${h1s.length}: ${JSON.stringify(h1s)}`);
  assert.equal(h1s[0].text, 'Deal ledger');
});

test('the viability status is a heading that follows its section heading', async () => {
  const markup = await renderedMarkup();
  // The status line is the largest text in the viability card. It must sit
  // after the card's own heading, not before it, and must not be an h1.
  const card = markup.match(/<section class="status-card[\s\S]*?<\/section>/);
  assert.ok(card, 'viability card must render');
  const order = [...card[0].matchAll(/<h([1-6])\b[^>]*class="([^"]*)"/g)].map((m) => ({ level: Number(m[1]), cls: m[2] }));
  assert.ok(order.length >= 2, `expected the card to carry an eyebrow and a status line, got ${JSON.stringify(order)}`);
  assert.equal(order[0].level, 2);
  assert.equal(order[0].cls, 'eyebrow');
  assert.equal(order[1].level, 2, 'the status line must not outrank the card heading');
  assert.ok(order[1].cls.includes('status-line'));
});

test('heading levels never skip a level going down', async () => {
  const markup = await renderedMarkup();
  const levels = [...markup.matchAll(/<h([1-6])\b/g)].map((match) => Number(match[1]));
  assert.ok(levels.length > 5, `expected a populated heading tree, found ${levels.length}`);
  let previous = levels[0];
  for (const level of levels.slice(1)) {
    assert.ok(level <= previous + 1, `heading level jumped from h${previous} to h${level}`);
    previous = level;
  }
});

test('the status line keeps the size the h1 used to get', async () => {
  // The fix demotes the element, so the stylesheet must still size it.
  const css = await readFile(new URL('../styles.css', import.meta.url), 'utf8');
  assert.match(css, /\.status-card h2\.status-line\s*\{[^}]*font-size:\s*clamp\(/);
  assert.doesNotMatch(css, /\.status-card h1\s*\{/, 'the replaced h1 rule must be gone');
});
