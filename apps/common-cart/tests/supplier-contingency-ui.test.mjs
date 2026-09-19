import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import * as model from '../src/model.js';
import { fixture } from './review-fixture.mjs';

class Element {
  constructor() {
    this.handlers = {}; this.value = ''; this.disabled = false; this.textContent = '';
    this.dataset = {}; this.children = []; this.options = []; this.hidden = false;
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
    createElement(tag) {
      const element = new Element();
      if (tag === 'option') {
        Object.defineProperty(element, 'textContent', {
          get() { return this._text ?? ''; },
          set(value) { this._text = value; },
        });
      }
      return element;
    },
  };
  const src = readFileSync(new URL('../src/app.js', import.meta.url), 'utf8');
  const code = [
    sliceFunction(src, 'buyerDisplayLabel'),
    sliceFunction(src, 'money'),
    sliceFunction(src, 'contingencyExperimentFromBuilder'),
    sliceFunction(src, 'renderContingencyOffers'),
    sliceFunction(src, 'renderContingencyResults'),
    sliceFunction(src, 'clearContingencyResults'),
  ].join('\n');
  const statuses = [];
  const context = vm.createContext({
    ...model, document, Intl, JSON, state: scenario, scenario, screenshotMode: false,
    contingencyRuns: [],
    setStatus(message) { statuses.push(message); },
    messageOf: (e) => e.message,
  });
  vm.runInContext(code, context);
  return { nodes, context, statuses };
}
const textOf = (node) => [node.textContent, ...node.children.map(textOf)].join(' ');

test('contingency builder populates offers and explains the value field', () => {
  const { nodes, context } = harness(fixture());
  vm.runInContext('renderContingencyOffers()', context);
  const select = nodes.get('#contingency-offer');
  assert.ok(select.children.length > 0);
  assert.match(nodes.get('#contingency-value-hint').textContent, /Withdrawal ignores|capacity|multiplier|days/);
});

test('contingency results render experiments with lost and newly feasible orders', () => {
  const { nodes, context } = harness(fixture());
  vm.runInContext('contingencyRuns = standardContingencySet(scenario).flatMap(({ experiments }) => experiments.map((experiment) => planContingency(scenario, experiment)))', context);
  vm.runInContext('renderContingencyResults()', context);
  assert.match(nodes.get('#contingency-status').textContent, /experiment/);
  assert.ok(textOf(nodes.get('#contingency-result-rows')).length > 0);
  assert.ok(textOf(nodes.get('#contingency-order-rows')).length > 0);
});

test('contingency panel clears to an empty state on invalid drafts', () => {
  const { nodes, context } = harness(fixture());
  vm.runInContext('clearContingencyResults()', context);
  assert.match(nodes.get('#contingency-status').textContent, /once every field is valid/);
  assert.equal(nodes.get('#contingency-result-rows').children.length, 0);
});

test('contingency panel markup exists with builder and export controls', async () => {
  const { readFile } = await import('node:fs/promises');
  const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');
  const app = await readFile(new URL('../src/app.js', import.meta.url), 'utf8');
  assert.match(html, /id="contingency-title"/);
  assert.match(html, /id="contingency-type"/);
  assert.match(html, /id="contingency-offer"/);
  assert.match(html, /id="run-contingency"/);
  assert.match(html, /id="run-standard-contingencies"/);
  assert.match(html, /id="export-contingency-plan"/);
  assert.match(html, /id="export-merchant-contingency-summary"/);
  assert.match(html, /aggregates only/);
  assert.match(app, /function renderContingencyResults\(/);
  assert.match(app, /createMerchantContingencyReport\(scenario, result\.experiment\)/);
});
