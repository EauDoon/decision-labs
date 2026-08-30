import assert from 'node:assert/strict';
import test from 'node:test';
import vm from 'node:vm';
import { buildStandalone } from '../scripts/build-standalone.mjs';
import { clonePreset } from '../src/model.js';

async function workbench(protocol = 'file:', options = {}) {
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
    window: { location: { protocol, hash: options.hash ?? '', pathname: '/', search: '' }, addEventListener: (name, callback) => windowEvents.set(name, callback) },
    document: { activeElement: null, querySelector: (selector) => selector === '#workbench' ? app : selector === '#notice' ? notice : null },
    localStorage: { getItem: (key) => storage.get(key) ?? null, setItem: (key, value) => storage.set(key, value) },
  });
  new vm.Script(script).runInContext(context, { timeout: 2000 });
  return {
    markup: () => app.innerHTML,
    notice: () => notice.textContent,
    saved: () => JSON.parse(storage.get('partnership-breakpoint.v1')),
    edit: (path, value, extra = {}) => events.get('change')({ target: new Input({ path, ...extra }, value) }),
    click: (action) => events.get('click')({ target: { closest: () => ({ dataset: { action } }) } }),
    navigate: (config) => {
      context.window.location.hash = `#deal=${Buffer.from(JSON.stringify(config)).toString('base64url')}`;
      windowEvents.get('hashchange')?.();
    },
    navigateHash: (hash) => {
      context.window.location.hash = hash;
      windowEvents.get('hashchange')?.();
    },
    import: (config, pending, error = false, file = {}) => {
      const contents = Object.hasOwn(file, 'contents') ? file.contents : JSON.stringify(config);
      const input = new Input({ action: 'import' }, '');
      input.files = [{ size: file.size ?? String(contents).length, contents, pending, error }];
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
  assert.match(app.markup(), /boundary at 101,000 txn/);
});

test('invalid stress values retain editable controls and recover without stale results', async () => {
  const app = await workbench();
  app.edit('stress.volumeDropPct', '101');
  assert.match(app.markup(), /Resolve these inputs/);
  assert.match(app.markup(), /data-path="stress.volumeDropPct"/);
  assert.doesNotMatch(app.markup(), /tested cases hold/);
  assert.match(app.notice(), /Invalid inputs are not saved. Stress volumeDropPct/);
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
  assert.match(app.notice(), /Import rejected: Stress volumeGrowthPct.*\(2 more\)/);
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

test('form help and native bounds cover empty fields, volume shock, and blank versus zero capacity', async () => {
  const app = await workbench();
  assert.match(app.markup(), /Volume shock % is the only baseline volume reduction, 0 through 100/);
  assert.match(app.markup(), /data-path="deal.volumeShockPct"[^>]*max="100"/);
  assert.match(app.markup(), /data-path="participants.0.revenueShare"[^>]*max="1"/);
  assert.match(app.markup(), /Leave capacity blank for no limit; a capacity of zero forbids any volume/);
  assert.match(app.markup(), /Import a JSON case exported by this workbench. Files must be 250 KB or smaller/);
  app.edit('deal.monthlyVolume', '');
  assert.match(app.markup(), /Resolve these inputs/);
  assert.match(app.notice(), /Invalid inputs are not saved. Deal monthly volume/);
  assert.doesNotMatch(app.markup(), /tested cases hold/);
});

test('empty and whitespace imports are rejected without changing the case', async () => {
  const app = await workbench();
  app.import(clonePreset('balanced'));
  const previous = app.saved();
  app.import({}, undefined, false, { contents: '', size: 0 });
  assert.match(app.notice(), /the file is empty/);
  assert.deepEqual(app.saved(), previous);
  app.import({}, undefined, false, { contents: ' \n\t ', size: 4 });
  assert.match(app.notice(), /the file is empty/);
  assert.deepEqual(app.saved(), previous);
});

test('a UTF-8 BOM on an exported case is ignored during import', async () => {
  const app = await workbench();
  const config = clonePreset('balanced');
  config.deal.monthlyVolume = 88_000;
  app.import({}, undefined, false, { contents: `\uFEFF${JSON.stringify(config)}` });
  assert.equal(app.saved().deal.monthlyVolume, 88_000);
  assert.match(app.notice(), /JSON imported/);
});

test('an invalid share hash keeps the current case and reports the failure', async () => {
  const app = await workbench('http:');
  const shared = clonePreset('thinMargin');
  shared.deal.monthlyVolume = 76_543;
  app.navigate(shared);
  const previous = app.saved();
  app.navigateHash('#deal=not-a-valid-case');
  assert.match(app.notice(), /Share link could not be loaded. The current case is unchanged/);
  assert.equal(app.saved().deal.monthlyVolume, 76_543);
  assert.deepEqual(app.saved(), previous);
});

test('an invalid opening share hash falls back to Balanced with a visible notice', async () => {
  const app = await workbench('http:', { hash: '#deal=%%%' });
  assert.match(app.notice(), /Share link could not be loaded. Showing the Balanced starting point/);
  assert.match(app.markup(), /data-path="deal.monthlyVolume"[^>]*value="100000"/);
});

test('participant names are trimmed before they are stored', async () => {
  const app = await workbench();
  app.edit('participants.0.name', '  Platform  ', { type: 'text' });
  assert.equal(app.saved().participants[0].name, 'Platform');
});

test('malformed JSON imports name the parse cause and preserve the case', async () => {
  const app = await workbench();
  app.import(clonePreset('balanced'));
  const previous = app.saved();
  app.import({}, undefined, false, { contents: '{not-json' });
  assert.match(app.notice(), /Import rejected: the file is not valid JSON \(/);
  assert.deepEqual(app.saved(), previous);
});

test('an invalid share hash that fails validation names the field', async () => {
  const app = await workbench('http:');
  const shared = clonePreset('thinMargin');
  shared.deal.monthlyVolume = 76_543;
  app.navigate(shared);
  const invalid = clonePreset('balanced');
  invalid.deal.monthlyVolume = -1;
  app.navigate(invalid);
  assert.match(app.notice(), /Share link could not be loaded. The current case is unchanged. The share link failed validation: Deal monthly volume/);
  assert.equal(app.saved().deal.monthlyVolume, 76_543);
});

test('an oversized share hash names the length limit', async () => {
  const app = await workbench('http:');
  const shared = clonePreset('thinMargin');
  shared.deal.monthlyVolume = 76_543;
  app.navigate(shared);
  app.navigateHash(`#deal=${'a'.repeat(60_000)}`);
  assert.match(app.notice(), /Share link could not be loaded. The current case is unchanged. The share link is longer than 60,000 characters/);
  assert.equal(app.saved().deal.monthlyVolume, 76_543);
});

test('export of invalid inputs names the failing field', async () => {
  const app = await workbench();
  app.edit('deal.monthlyVolume', '');
  app.click('export');
  assert.match(app.notice(), /Resolve invalid inputs before exporting. Deal monthly volume/);
});

test('applying a missing proposal names the rejected action', async () => {
  const app = await workbench();
  app.click('apply-stress-proposal');
  assert.match(app.notice(), /Apply tested revenue split rejected: No verified fixed-share proposal/);
});
