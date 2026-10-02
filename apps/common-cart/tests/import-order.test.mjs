import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';
import * as model from '../src/model.js';

const source = readFileSync(new URL('../src/app.js', import.meta.url), 'utf8');
const handlers = source.slice(source.indexOf('async function importScenario('), source.indexOf('function pasteBuyersTable('));

function harness() {
  const context = vm.createContext({
    ...model, scenario: model.validateScenario(model.clonePreset()), importSequence: 0, scenarioRevision: 0,
    inspectedOfferId: '', buyerSortPreviewIds: null, offerSortPreviewIds: null,
    status: '', renderEditor() {}, allowReplaceDraft: () => true,
    window: { confirm: () => true }, appJsonSyntaxHint: () => '', messageOf: error => error.message,
    setStatus(message) { context.status = message; },
    refresh() { context.scenarioRevision += 1; },
  });
  vm.runInContext(handlers, context);
  return context;
}

function event(text) {
  return { target: { value: 'chosen.csv', files: [{ size: 100, text }] } };
}

for (const [handler, encode, rows] of [
  ['importOffersCsv', model.createOfferCsv, 'offers'],
  ['importBuyersCsv', model.createOrganizerBuyerCsv, 'buyers'],
]) {
  test(`${handler}: delayed success and failure cannot replace newer edits, rooms or imports`, async () => {
    for (const action of ['edit', 'reset', 'new-import', 'json-import']) {
      for (const rejected of [false, true]) {
        const context = harness();
        let settle;
        const pending = context[handler](event(() => new Promise((resolve, reject) => { settle = rejected ? reject : resolve; })));
        const newer = model.clonePreset();
        newer.title = 'Newer room';
        newer.buyers[0].quantity += 1;
        newer.offers[0].unitPrice += 1;
        if (action === 'new-import') await context[handler](event(async () => encode(newer)));
        else if (action === 'json-import') await context.importScenario(event(async () => JSON.stringify(newer)));
        else { context.scenario = newer; context.refresh(); context.status = `${action} completed`; }
        const expected = JSON.stringify(context.scenario);
        const expectedStatus = context.status;
        settle(rejected ? new Error('Stale read failed') : encode(model.clonePreset()));
        await pending;
        assert.equal(JSON.stringify(context.scenario), expected, action);
        assert.equal(context.status, expectedStatus, action);
      }
    }
  });

  test(`${handler}: current import updates only its intended rows`, async () => {
    const context = harness();
    const original = JSON.stringify(context.scenario[rows === 'buyers' ? 'offers' : 'buyers']);
    const imported = model.clonePreset();
    imported.buyers[0].quantity += 1;
    imported.offers[0].unitPrice += 1;
    await context[handler](event(async () => encode(imported)));
    assert.equal(JSON.stringify(context.scenario[rows === 'buyers' ? 'offers' : 'buyers']), original);
    assert.equal(context.scenario[rows][0][rows === 'buyers' ? 'quantity' : 'unitPrice'], imported[rows][0][rows === 'buyers' ? 'quantity' : 'unitPrice']);
    assert.match(context.status, /Imported/);
  });
}

test('every room refresh invalidates pending CSV imports before validating the draft', () => {
  assert.ok(/function refresh\(\) \{\s+scenarioRevision \+= 1;/.test(source));
});
