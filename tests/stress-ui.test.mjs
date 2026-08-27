import assert from 'node:assert/strict';
import test from 'node:test';
import vm from 'node:vm';
import { buildStandalone } from '../scripts/build-standalone.mjs';
import { clonePreset } from '../src/model.js';

async function workbench() {
  const html = await buildStandalone();
  const script = html.match(/<script type="module">([\s\S]*?)<\/script>/)[1];
  const events = new Map();
  const storage = new Map();
  const notice = { textContent: '' };
  const app = { innerHTML: '', querySelectorAll: () => [],
    addEventListener: (name, callback) => {
      assert.equal(events.has(name), false, `duplicate ${name} handler`);
      events.set(name, callback);
    } };
  class Input { constructor(dataset, value) { this.dataset = dataset; this.value = value; } }
  class Reader { readAsText(file) { this.result = file.contents; this.onload(); } }
  const context = vm.createContext({ console, HTMLInputElement: Input, FileReader: Reader, TextEncoder,
    window: { location: { protocol: 'file:', hash: '' }, addEventListener() {} },
    document: { activeElement: null, querySelector: (selector) => selector === '#workbench' ? app : selector === '#notice' ? notice : null },
    localStorage: { getItem: (key) => storage.get(key) ?? null, setItem: (key, value) => storage.set(key, value) },
  });
  new vm.Script(script).runInContext(context, { timeout: 2000 });
  return {
    markup: () => app.innerHTML,
    notice: () => notice.textContent,
    saved: () => JSON.parse(storage.get('partnership-breakpoint.v1')),
    edit: (path, value) => events.get('change')({ target: new Input({ path }, value) }),
    click: (action) => events.get('click')({ target: { closest: () => ({ dataset: { action } }) } }),
    import: (config) => {
      const input = new Input({ action: 'import' }, '');
      input.files = [{ size: 100, contents: JSON.stringify(config) }];
      events.get('change')({ target: input });
    },
  };
}

test('standalone displays the complete compound grid with accessible controls and case evidence', async () => {
  const app = await workbench();
  assert.match(app.markup(), /1 of 27 tested cases hold/);
  assert.match(app.markup(), /aria-labelledby="stress-inputs-title"/);
  assert.match(app.markup(), /data-path="stress.volumeDropPct"/);
  assert.match(app.markup(), /<summary>Inspect all 27 compound cases<\/summary>/);
  assert.match(app.markup(), /tabindex="0" role="region" aria-label="Compound case evidence/);
  assert.match(app.markup(), /data-action="apply-stress-proposal" disabled/);
});

test('invalid stress values retain editable controls and recover without stale results', async () => {
  const app = await workbench();
  app.edit('stress.volumeDropPct', '101');
  assert.match(app.markup(), /Resolve these inputs/);
  assert.match(app.markup(), /data-path="stress.volumeDropPct"/);
  assert.doesNotMatch(app.markup(), /tested cases hold/);
  assert.match(app.notice(), /Invalid inputs are not saved/);
  app.edit('stress.volumeDropPct', '10');
  assert.doesNotMatch(app.markup(), /Resolve these inputs/);
  assert.match(app.markup(), /tested cases hold/);
  assert.equal(app.saved().stress.volumeDropPct, 10);
});

test('apply is explicit, rechecks the proposal, and persists only the resulting share edits', async () => {
  const app = await workbench();
  const config = clonePreset('balanced');
  config.stress = { volumeDropPct: 5, volumeGrowthPct: 0, feeDropPct: 0, variableCostRisePct: 0 };
  app.import(config);
  const before = app.saved();
  assert.deepEqual(before.participants, config.participants);
  assert.match(app.markup(), /data-action="apply-stress-proposal" >/);
  app.click('apply-stress-proposal');
  const after = app.saved();
  assert.deepEqual(after.deal, before.deal);
  assert.deepEqual(after.stress, before.stress);
  assert.notDeepEqual(after.participants.map((participant) => participant.revenueShare), before.participants.map((participant) => participant.revenueShare));
  assert.match(app.markup(), /2 of 2 tested cases hold/);
  assert.match(app.notice(), /Every selected compound case was rechecked/);
});

test('legacy imports gain default stress settings, hostile names escape, and invalid imports preserve the case', async () => {
  const app = await workbench();
  const config = clonePreset('balanced');
  config.participants[0].name = '<img src=x onerror=alert(1)>';
  app.import(config);
  assert.equal(app.saved().stress.volumeDropPct, 20);
  assert.match(app.markup(), /&lt;img src=x onerror=alert\(1\)&gt;/);
  assert.doesNotMatch(app.markup(), /<img src=x/);
  const previous = app.saved();
  app.import({ ...config, stress: { volumeDropPct: 20 } });
  assert.match(app.notice(), /Import rejected/);
  assert.deepEqual(app.saved(), previous);
});
