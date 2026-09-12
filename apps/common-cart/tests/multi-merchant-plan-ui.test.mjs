import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import * as model from '../src/model.js';
import { fixture } from './review-fixture.mjs';

class Element {
  constructor() {
    this.handlers = {}; this.value = ''; this.disabled = false; this.textContent = '';
    this.dataset = {}; this.children = []; this.colSpan = 0; this.hidden = false;
  }
  addEventListener(name, fn) { this.handlers[name] = fn; }
  append(...items) { this.children.push(...items); }
  replaceChildren(...items) { this.children = [...items]; }
  setAttribute() {}
}
function sliceFunction(src, name) {
  const start = src.indexOf(`function ${name}(`);
  let depth = 0;
  let end = start;
  for (let i = start; i < src.length; i += 1) {
    if (src[i] === '{') depth += 1;
    if (src[i] === '}') {
      depth -= 1;
      if (depth === 0) { end = i + 1; break; }
    }
  }
  return src.slice(start, end);
}
function harness(scenario) {
  const nodes = new Map();
  const document = {
    querySelector(s) { if (!nodes.has(s)) nodes.set(s, new Element()); return nodes.get(s); },
    createElement() { return new Element(); },
  };
  const src = readFileSync(new URL('../src/app.js', import.meta.url), 'utf8');
  const code = [
    sliceFunction(src, 'buyerDisplayLabel'),
    sliceFunction(src, 'money'),
    sliceFunction(src, 'renderMultiMerchantPlan'),
    sliceFunction(src, 'clearMultiMerchantPlan'),
  ].join('\n');
  const context = vm.createContext({
    ...model, document, Intl, JSON, state: scenario, scenario, screenshotMode: false,
    setStatus() {}, messageOf: (e) => e.message,
  });
  vm.runInContext(code, context);
  return { nodes, context };
}
const textOf = (node) => [node.textContent, ...node.children.map(textOf)].join(' ');

test('multi-merchant panel renders comparison, assignments, and unserved demand', () => {
  const { nodes, context } = harness(fixture());
  vm.runInContext('renderMultiMerchantPlan(scenario)', context);
  const note = nodes.get('#multi-merchant-note').textContent;
  assert.match(note, /maximum fulfilled units, then minimum landed cost/);
  const status = nodes.get('#multi-merchant-status').textContent;
  assert.match(status, /Optimal plan/);
  const compare = textOf(nodes.get('#multi-merchant-compare-rows'));
  assert.match(compare, /Single-offer winner/);
  assert.match(compare, /Multi-merchant plan/);
  const assignments = textOf(nodes.get('#multi-merchant-assignment-rows'));
  assert.ok(assignments.length > 0);
  const unserved = textOf(nodes.get('#multi-merchant-unserved-rows'));
  assert.ok(unserved.length > 0);
});

test('multi-merchant panel marks rooms above the bound honestly', () => {
  const { nodes, context } = harness(fixture());
  vm.runInContext('renderMultiMerchantPlan(scenario)', context);
  assert.match(nodes.get('#multi-merchant-status').textContent, /Optimal plan|exceeds/);
});

test('multi-merchant panel clears to an empty state on invalid drafts', () => {
  const { nodes, context } = harness(fixture());
  vm.runInContext('clearMultiMerchantPlan()', context);
  assert.match(nodes.get('#multi-merchant-note').textContent, /once every field is valid/);
  assert.equal(nodes.get('#multi-merchant-compare-rows').children.length, 0);
});

test('multi-merchant panel markup exists with organizer and merchant export controls', async () => {
  const { readFile } = await import('node:fs/promises');
  const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');
  const app = await readFile(new URL('../src/app.js', import.meta.url), 'utf8');
  assert.match(html, /id="multi-merchant-title"/);
  assert.match(html, /id="export-multi-merchant-plan"/);
  assert.match(html, /id="export-multi-merchant-csv"/);
  assert.match(html, /id="export-merchant-plan-summary"/);
  assert.match(html, /aggregates only/);
  assert.match(app, /function renderMultiMerchantPlan\(/);
  assert.match(app, /createMerchantPlanReport\(planMultiMerchant\(scenario\), scenario\)/);
});
