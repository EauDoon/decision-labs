import assert from 'node:assert/strict';
import test from 'node:test';
import vm from 'node:vm';
import { buildStandalone } from '../scripts/build-standalone.mjs';
import { clonePreset } from '../src/model.js';

async function workbench(protocol = 'file:') {
  const html = await buildStandalone();
  const script = html.match(/<script type="module">([\s\S]*?)<\/script>/)[1];
  const events = new Map();
  const windowEvents = new Map();
  const storage = new Map();
  const notice = { textContent: '' };
  const app = { innerHTML: '', querySelectorAll: () => [],
    addEventListener: (name, callback) => {
      assert.equal(events.has(name), false, `duplicate ${name} handler`);
      events.set(name, callback);
    } };
  class Input { constructor(dataset, value) { this.dataset = dataset; this.value = value; } }
  class Reader {
    readAsText(file) {
      if (file.error) return this.onerror();
      this.result = file.contents;
      if (file.pending) file.pending.push(() => this.onload());
      else this.onload();
    }
  }
  const context = vm.createContext({ console, HTMLInputElement: Input, FileReader: Reader, TextEncoder, atob, btoa,
    history: { replaceState() {} },
    window: { location: { protocol, hash: '', pathname: '/', search: '' }, addEventListener: (name, callback) => windowEvents.set(name, callback) },
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
    navigate: (config) => {
      context.window.location.hash = `#deal=${Buffer.from(JSON.stringify(config)).toString('base64url')}`;
      windowEvents.get('hashchange')?.();
    },
    import: (config, pending, error = false) => {
      const input = new Input({ action: 'import' }, '');
      input.files = [{ size: 100, contents: JSON.stringify(config), pending, error }];
      events.get('change')({ target: input });
    },
  };
}

test('hash navigation loads a shared case without requiring a page reload', async () => {
  const app = await workbench('http:');
  const shared = clonePreset('thinMargin');
  shared.deal.monthlyVolume = 76_543;
  app.navigate(shared);
  assert.match(app.markup(), /data-path="deal.monthlyVolume"[^>]*value="76543"/);
  assert.equal(app.saved().deal.monthlyVolume, 76_543);
});

test('hash navigation supersedes a pending file import', async () => {
  const app = await workbench('http:');
  const pending = [];
  const imported = clonePreset('balanced');
  imported.deal.monthlyVolume = 90_000;
  const shared = clonePreset('thinMargin');
  shared.deal.monthlyVolume = 76_543;

  app.import(imported, pending);
  app.navigate(shared);
  pending[0]();

  assert.equal(app.saved().deal.monthlyVolume, 76_543);
});

test('standalone displays the complete compound grid with accessible controls and case evidence', async () => {
  const app = await workbench();
  assert.match(app.markup(), /1 of 27 tested cases hold/);
  assert.match(app.markup(), /aria-labelledby="stress-inputs-title"/);
  assert.match(app.markup(), /data-path="stress.volumeDropPct"/);
  assert.match(app.markup(), /<summary>Inspect all 27 compound cases<\/summary>/);
  assert.match(app.markup(), /tabindex="0" role="region" aria-label="Compound case evidence/);
  assert.match(app.markup(), /data-action="apply-stress-proposal" disabled/);
});

test('first breakpoint card reports capacity-limited volume growth', async () => {
  const app = await workbench();
  const config = clonePreset('balanced');
  config.participants[0].capacity = 101_000;
  config.participants[1].capacity = 140_000;
  config.participants[2].capacity = 140_000;
  app.import(config);
  assert.match(app.markup(), /Protect Platform first/);
  assert.match(app.markup(), /volume increase/);
  assert.match(app.markup(), /1,000 txn, 1.0%/);
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

test('an older file read cannot overwrite the latest import selection', async () => {
  const app = await workbench();
  const pending = [];
  const older = clonePreset('balanced');
  older.deal.monthlyVolume = 90_000;
  const latest = clonePreset('balanced');
  latest.deal.monthlyVolume = 80_000;

  app.import(older, pending);
  app.import(latest, pending);
  pending[1]();
  pending[0]();

  assert.equal(app.saved().deal.monthlyVolume, 80_000);
});

test('an unreadable import reports the failure and preserves the case', async () => {
  const app = await workbench();
  app.import(clonePreset('balanced'));
  const previous = app.saved();
  app.import(null, undefined, true);
  assert.match(app.notice(), /could not be read/);
  assert.deepEqual(app.saved(), previous);
});

test('participant controls stop at the model capacity without invalidating the saved case', async () => {
  const app = await workbench();
  app.click('add-participant');
  assert.equal(app.saved().participants.at(-1).id, 'participant-1');
  for (let index = 3; index < 24; index += 1) app.click('add-participant');
  assert.equal(app.saved().participants.length, 24);
  assert.match(app.markup(), /data-action="add-participant" disabled title="Participant limit reached"/);
  app.click('add-participant');
  assert.equal(app.saved().participants.length, 24);
  assert.doesNotMatch(app.markup(), /Resolve these inputs/);
});
