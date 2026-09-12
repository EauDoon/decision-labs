import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import * as model from '../src/model.js';
import { fixture } from './review-fixture.mjs';

class Element {
  constructor() { this.handlers = {}; this.value = ''; this.disabled = false; this.textContent = ''; this.dataset = {}; }
  addEventListener(name, fn) { this.handlers[name] = fn; }
  append() {} replaceChildren() {} setAttribute() {}
}
function sliceLines(src, fromMarker, toMarker) {
  const start = src.indexOf(fromMarker);
  const end = src.indexOf(toMarker, start);
  return src.slice(start, end);
}
function harness(state) {
  const nodes = new Map();
  const document = {
    querySelector(s) { if (!nodes.has(s)) nodes.set(s, new Element()); return nodes.get(s); },
    createElement() { return new Element(); },
  };
  const calls = { checkpoints: 0, notices: [], downloads: [] };
  const src = readFileSync(new URL('../src/app.js', import.meta.url), 'utf8');
  const helpers = sliceLines(src, 'function inputValue(value) {', 'function formatVolume(value) {');
  const sections = sliceLines(src, 'function defaultPlanFromCase() {', 'function participantTable(result) {');
  const actions = sliceLines(src, 'function createCommercialPlan() {', 'function exportStressCsv(visibleOnly = false) {');
  const context = vm.createContext({
    ...model, document, Intl, JSON, state,
    activePreset: '',
    undoHistory: [],
    checkpoint() { calls.checkpoints += 1; },
    refresh() {},
    setNotice(message) { calls.notices.push(message); },
    downloadText(contents, type, filename) { calls.downloads.push({ contents, type, filename }); },
    summarizeErrors: (errors) => errors.join(' '),
    caseExportTitle: () => 'case',
    numberFromInput: (value) => Number(value),
  });
  vm.runInContext(helpers + sections + actions, context);
  return { nodes, context, calls };
}
function stateWithPlan() {
  const state = fixture();
  state.plan = {
    startingCash: 0,
    periods: [
      { volume: 100000, feePerTransaction: 0.2, addressableVolume: 140000, setupExpense: 5000 },
      { volume: 110000, feePerTransaction: 0.2, addressableVolume: 140000 },
    ],
  };
  return state;
}

test('commercial plan panel offers creation when no plan exists', () => {
  const { context } = harness(fixture());
  const html = vm.runInContext('commercialPlanSection()', context);
  assert.match(html, /Create commercial plan from current case/);
  assert.match(html, /data-action="plan-create"/);
  assert.doesNotMatch(html, /Period profitability/);
});

test('commercial plan panel renders editor, results, recovery, and cash', () => {
  const { context } = harness(stateWithPlan());
  const html = vm.runInContext('commercialPlanSection()', context);
  assert.match(html, /data-path="plan\.periods\.0\.volume"/);
  assert.match(html, /data-action="plan-add-period"/);
  assert.match(html, /data-action="plan-export-brief"/);
  assert.match(html, /data-action="plan-export-csv"/);
  assert.match(html, /Period profitability/);
  assert.match(html, /Recovery:/);
  assert.match(html, /Cash schedule/);
  assert.match(html, /Receivables after horizon/);
  assert.match(html, /print-only print-keep/);
});

test('commercial plan create, add-period, and remove actions checkpoint for undo', () => {
  const { context, calls } = harness(fixture());
  assert.equal(vm.runInContext('typeof state.plan', context), 'undefined');
  vm.runInContext('createCommercialPlan()', context);
  assert.equal(vm.runInContext('state.plan.periods.length', context), 2);
  assert.ok(calls.checkpoints > 0);
  vm.runInContext('addCommercialPlanPeriod()', context);
  assert.equal(vm.runInContext('state.plan.periods.length', context), 3);
  vm.runInContext('removeCommercialPlan()', context);
  assert.equal(vm.runInContext('typeof state.plan', context), 'undefined');
});

test('commercial plan override inputs inherit blank fields from the base case', () => {
  const { context } = harness(stateWithPlan());
  const html = vm.runInContext('commercialPlanSection()', context);
  assert.match(html, /data-plan-override="fixedMonthlyCost"/);
  assert.match(html, /Blank inherits the base case/);
});

test('commercial plan brief and CSV exports download the evaluated plan', () => {
  const { context, calls } = harness(stateWithPlan());
  vm.runInContext('exportCommercialPlanBrief()', context);
  vm.runInContext('exportCommercialPlanCsv()', context);
  assert.equal(calls.downloads.length, 2);
  const brief = JSON.parse(calls.downloads[0].contents);
  assert.equal(brief.format, 'partnership-commercial-brief');
  assert.match(calls.downloads[1].contents, /"period-profit"/);
});
