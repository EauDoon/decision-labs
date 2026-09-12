import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import * as model from '../src/model.js';
import { fixture } from './review-fixture.mjs';

class Element {
  constructor() {
    this.innerHTML = '';
    this.textContent = '';
    this.handlers = {};
    this.value = '';
  }
  addEventListener(name, fn) { this.handlers[name] = fn; }
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
function harness(proposal) {
  const nodes = new Map();
  const document = {
    querySelector(s) { if (!nodes.has(s)) nodes.set(s, new Element()); return nodes.get(s); },
    createElement() { return new Element(); },
  };
  const src = readFileSync(new URL('../src/app.js', import.meta.url), 'utf8');
  const code = [
    sliceFunction(src, 'renderRelationships'),
    sliceFunction(src, 'firstOptionOutside'),
  ].join('\n');
  const escapeHtml = (value) => String(value ?? '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const context = vm.createContext({
    ...model, document, Intl, JSON, escapeHtml,
    $: (s) => document.querySelector(s),
    state: { proposal },
    currentResult: () => model.findSmallestAgreement(proposal),
  });
  vm.runInContext(code, context);
  return { nodes, context };
}

test('relationships editor explains the empty state without rules', () => {
  const { nodes, context } = harness(fixture());
  vm.runInContext('renderRelationships()', context);
  assert.match(nodes.get('#relationships-editor').innerHTML, /No relationships/);
});

test('relationships editor lists each rule with its kind and a remove control', () => {
  const proposal = {
    ...fixture(),
    clauses: [
      { ...fixture().clauses[0] },
      { ...fixture().clauses[1] },
    ],
  };
  proposal.relationships = [
    { id: 'r1', kind: 'requires', option: proposal.clauses[1].options[1].id, requires: proposal.clauses[0].options[1].id },
    { id: 'r2', kind: 'excludes', options: [proposal.clauses[0].options[2].id, proposal.clauses[1].options[2].id] },
  ];
  const { nodes, context } = harness(proposal);
  vm.runInContext('renderRelationships()', context);
  const html = nodes.get('#relationships-editor').innerHTML;
  assert.match(html, /Prerequisite/);
  assert.match(html, /Incompatible pair/);
  assert.match(html, /data-action="remove-relationship"/);
  assert.match(html, /requires/);
});

test('relationships section markup wires the three add actions', async () => {
  const { readFile } = await import('node:fs/promises');
  const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');
  const app = await readFile(new URL('../src/app.js', import.meta.url), 'utf8');
  assert.match(html, /id="relationships-heading"/);
  assert.match(html, /data-action="add-requires"/);
  assert.match(html, /data-action="add-excludes"/);
  assert.match(html, /data-action="add-linked"/);
  assert.match(html, /id="relationships-editor"/);
  assert.match(app, /function renderRelationships\(/);
  assert.match(app, /renderRelationships\(\);/);
});
