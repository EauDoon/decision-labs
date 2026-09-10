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
  if (options.storage) Object.entries(options.storage).forEach(([key, value]) => storage.set(key, value));
  const notice = { textContent: '' };
  const downloads = [];
  let downloadBlob;
  let prints = 0;
  const printSnapshots = [];
  const copied = [];
  const focused = [];
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
  const locationState = { protocol, hash: options.hash ?? '', pathname: '/', search: '' };
  Object.defineProperty(locationState, 'href', {
    configurable: true,
    enumerable: true,
    get() {
      const host = this.protocol === 'file:' ? '' : '//127.0.0.1';
      return `${this.protocol}${host}${this.pathname}${this.search}${this.hash}`;
    },
  });
  const sandbox = { console, Blob, setTimeout: (callback) => callback(), URL: { createObjectURL: (blob) => { downloadBlob = blob; return 'blob:test'; }, revokeObjectURL() {} }, HTMLInputElement: Input, FileReader: Reader, TextEncoder, atob, btoa,
    history: { replaceState(_state, _title, url) {
      if (typeof url === 'string' && url.includes('#')) locationState.hash = url.slice(url.indexOf('#'));
    } },
    window: { print: () => { prints += 1; printSnapshots.push(app.innerHTML); }, location: locationState, addEventListener: (name, callback) => windowEvents.set(name, callback) },
    document: { activeElement: null, createElement: () => ({ click() { downloads.push({ filename: this.download, blob: downloadBlob }); } }), querySelector: (selector) => {
      if (selector === '#workbench') return app;
      if (selector === '#notice') return notice;
      const focusIds = new Set([
        'brief-copy-text', 'results-jump', 'results-start', 'add-participant',
        'share-hold-jump', 'share-hold-title', 'csv-copy-text', 'imported-compare-title',
        'comparison-title', 'three-compare-title', 'breakpoint-copy-text', 'share-hold-copy-text',
        'notes-copy-text', 'first-breakpoint-title', 'waterfall-copy-text', 'waterfall-title',
        'viability-copy-text', 'viability-heading', 'utilization-copy-text', 'participant-ledger-title',
        'tornado-title', 'tornado-copy-text', 'deal-inputs-title', 'operating-copy-text',
        'operating-region-title',
        'compound-title', 'inspect-cases-title', 'split-copy-text',
        'least-headroom-participant', 'participant-inputs-title',
        'field-deal-notes', 'viability-card', 'allocation-copy-text',
        'breakpoint-snapshot-copy-text', 'equal-split', 'normalize-shares',
        'title-copy-text', 'over-capacity-participant', 'copy-deal-title',
        'breakpoint-label-copy-text', 'copy-first-breakpoint-label',
        'viability-label-copy-text', 'copy-viability-label',
        'print-report', 'print-one-pager-title',
        'remaining-copy-text', 'copy-first-breakpoint-remaining',
        'volume-copy-text', 'copy-first-breakpoint-volume',
      ]);
      const id = typeof selector === 'string' && selector.startsWith('#') ? selector.slice(1) : '';
      if (focusIds.has(id) && app.innerHTML.includes(`id="${id}"`)) {
        return {
          focus() { focused.push(selector); },
          scrollIntoView() { focused.push(`scroll:${selector}`); },
        };
      }
      if (selector === '[data-action="hide-spare-capacity-participants"]' && app.innerHTML.includes('data-action="hide-spare-capacity-participants"')) {
        return {
          focus() { focused.push(selector); },
          scrollIntoView() { focused.push(`scroll:${selector}`); },
        };
      }
      if (selector === '[data-action="hide-least-headroom-participants"]' && app.innerHTML.includes('data-action="hide-least-headroom-participants"')) {
        return {
          focus() { focused.push(selector); },
          scrollIntoView() { focused.push(`scroll:${selector}`); },
        };
      }
      return null;
    } },
    localStorage: { getItem: (key) => storage.get(key) ?? null, setItem: (key, value) => { if (options.blockStorage) throw new Error('Blocked'); storage.set(key, value); } },
  };
  if (options.clipboard === 'ok') {
    sandbox.navigator = { clipboard: { writeText: (text) => { copied.push(text); } } };
  } else if (options.clipboard === 'fail') {
    sandbox.navigator = { clipboard: { writeText: () => { throw new Error('denied'); } } };
  }
  const context = vm.createContext(sandbox);
  // Windows Node 22 can spend more than 2s compiling the inlined standalone.
  new vm.Script(script).runInContext(context, { timeout: 15000 });
  return {
    markup: () => app.innerHTML,
    downloads: () => downloads,
    copied: () => copied,
    focused: () => focused,
    prints: () => prints,
    lastPrint: () => printSnapshots.at(-1) ?? '',
    notice: () => notice.textContent,
    saved: () => JSON.parse(storage.get('partnership-breakpoint.v1')),
    edit: (path, value, extra = {}) => events.get('change')({ target: new Input({ path, ...extra }, value) }),
    click: (action, extra = {}) => events.get('click')({ target: { closest: () => ({ dataset: { action, ...extra } }) } }),
    nameCase: (value) => events.get('change')({ target: new Input({ action: 'case-name' }, value) }),
    library: () => JSON.parse(storage.get('partnership-breakpoint.cases.v1') ?? '[]'),
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
    importParticipantsCsv: (csv, pending, error = false, file = {}) => {
      const contents = Object.hasOwn(file, 'contents') ? file.contents : csv;
      const input = new Input({ action: 'import-participants-csv' }, '');
      input.files = [{ size: file.size ?? String(contents).length, contents, pending, error }];
      events.get('change')({ target: input });
    },
    compareImport: (config, pending, error = false, file = {}) => {
      const contents = Object.hasOwn(file, 'contents') ? file.contents : JSON.stringify(config);
      const input = new Input({ action: 'compare-import' }, '');
      input.files = [{ size: file.size ?? String(contents).length, contents, pending, error, name: file.name ?? 'imported.json' }];
      events.get('change')({ target: input });
    },
    pasteRoster: (value) => events.get('change')({ target: new Input({ action: 'roster-paste' }, value) }),
    keydown: (key, extra = {}) => {
      let prevented = false;
      windowEvents.get('keydown')?.({
        key,
        shiftKey: Boolean(extra.shiftKey),
        target: extra.target ?? { tagName: extra.tagName ?? 'BODY' },
        preventDefault() { prevented = true; },
      });
      return prevented;
    },
    stored: (key) => storage.get(key) ?? null,
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
  assert.match(app.markup(), /<summary id="inspect-cases-title" tabindex="-1">Inspect all 27 compound cases<\/summary>/);
  assert.match(app.markup(), /tabindex="0" role="region" aria-label="Compound case evidence/);
  assert.match(app.markup(), /data-action="apply-stress-proposal" disabled/);
});

test('results jump nav is sticky, labeled, and keyboard-focusable via in-page links', async () => {
  const app = await workbench();
  const html = await buildStandalone();
  assert.match(app.markup(), /<nav class="results-jump" aria-label="Jump in results" id="results-jump" tabindex="-1">/);
  assert.match(app.markup(), /href="#viability-heading">Viability<\/a>/);
  assert.match(app.markup(), /href="#first-breakpoint">First breakpoint<\/a>/);
  assert.match(app.markup(), /href="#fee-guidance-title">Fee guide<\/a>/);
  assert.match(app.markup(), /href="#charts-title">Charts<\/a>/);
  assert.match(app.markup(), /href="#tornado-title">Tornado<\/a>/);
  assert.match(app.markup(), /href="#waterfall-title">Waterfall<\/a>/);
  assert.match(app.markup(), /href="#compound-title">Compound stress<\/a>/);
  assert.match(app.markup(), /href="#participant-ledger">Participant ledger<\/a>/);
  assert.match(html, /\.results-jump \{[\s\S]*position: sticky;/);
  assert.match(html, /\.results-jump a:focus-visible/);
  assert.match(app.markup(), /id="viability-heading"/);
  assert.match(app.markup(), /id="first-breakpoint"/);
  assert.match(app.markup(), /id="waterfall-title"/);
  assert.match(app.markup(), /id="participant-ledger"/);
  assert.match(app.markup(), /id="results-start"/);
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

test('undo restores edits and invalid drafts; redo restores the edit and resets clear redo', async () => {
  const app = await workbench();
  app.edit('deal.monthlyVolume', '80000');
  app.edit('deal.monthlyVolume', '');
  app.click('undo');
  assert.equal(app.saved().deal.monthlyVolume, 80000);
  app.click('undo');
  assert.equal(app.saved().deal.monthlyVolume, 100000);
  app.click('redo');
  assert.equal(app.saved().deal.monthlyVolume, 80000);
  app.click('reset');
  assert.match(app.markup(), /data-action="redo" disabled/);
  app.click('undo');
  assert.equal(app.saved().deal.monthlyVolume, 80000);
});

test('local saving failures are visible and do not claim persistence', async () => {
  const app = await workbench('file:', { blockStorage: true });
  app.edit('deal.monthlyVolume', '80000');
  assert.match(app.notice(), /Local saving is unavailable/);
  assert.doesNotMatch(app.notice(), /Saved locally/);
  assert.match(app.markup(), /value="80000"/);
});
test('edits and resets supersede a pending import', async () => {
  for (const action of ['edit', 'reset']) {
    const app = await workbench();
    const pending = [];
    const imported = clonePreset('thinMargin');
    app.import(imported, pending);
    if (action === 'edit') app.edit('deal.monthlyVolume', '70000'); else app.click('reset');
    pending[0]();
    assert.equal(app.saved().deal.monthlyVolume, action === 'edit' ? 70000 : 100000);
    assert.equal(app.saved().deal.feePerTransaction, 0.2);
  }
});

test('duplicate current case saves an independent snapshot with a unique title suffix', async () => {
  const app = await workbench();
  app.edit('deal.title', 'Harbor JV', { type: 'text' });
  app.edit('deal.monthlyVolume', '88000');
  app.click('duplicate-case');
  assert.equal(app.library().length, 1);
  assert.equal(app.library()[0].name, 'Harbor JV copy');
  assert.equal(app.library()[0].config.deal.title, 'Harbor JV copy');
  assert.equal(app.library()[0].config.deal.monthlyVolume, 88000);
  assert.equal(app.saved().deal.monthlyVolume, 88000);
  assert.equal(app.saved().deal.title, 'Harbor JV');
  app.edit('deal.monthlyVolume', '50000');
  assert.equal(app.library()[0].config.deal.monthlyVolume, 88000);
  app.click('duplicate-case');
  assert.equal(app.library()[1].name, 'Harbor JV copy 2');
  app.edit('deal.monthlyVolume', '');
  app.click('duplicate-case');
  assert.equal(app.library().length, 2);
  assert.match(app.notice(), /Resolve invalid inputs before duplicating/);
});

test('named snapshots are separate, escaped, reloadable and removable with recovery', async () => {
  const app = await workbench();
  app.nameCase('<b>Baseline</b>'); app.click('save-case');
  assert.equal(app.library().length, 1);
  assert.match(app.markup(), /&lt;b&gt;Baseline&lt;\/b&gt;/);
  app.edit('deal.monthlyVolume', '80000');
  assert.equal(app.library()[0].config.deal.monthlyVolume, 100000);
  app.click('load-case', { caseId: 'case-1' });
  assert.equal(app.saved().deal.monthlyVolume, 100000);
  app.click('undo'); assert.equal(app.saved().deal.monthlyVolume, 80000);
  app.click('remove-case', { caseId: 'case-1' }); assert.equal(app.library().length, 0);
  app.click('restore-case'); assert.equal(app.library().length, 1);
});
test('library refuses invalid unnamed snapshots and reports blocked persistence', async () => {
  const app = await workbench(); app.click('save-case');
  assert.match(app.notice(), /Enter a snapshot name/);
  const blocked = await workbench('file:', { blockStorage: true });
  blocked.nameCase('A'); blocked.click('save-case');
  assert.match(blocked.notice(), /could not be saved/);
  assert.equal(blocked.library().length, 0);
});

test('snapshot comparison reports participant deltas without mutating the current case', async () => {
  const app = await workbench(); app.nameCase('Baseline'); app.click('save-case');
  app.edit('participants.0.fixedMonthlyCost', '1900');
  const current = app.saved();
  app.click('compare-case', { caseId: 'case-1' });
  assert.match(app.markup(), /Compare with Baseline/);
  assert.match(app.markup(), /-100.00 units/);
  assert.match(app.markup(), /class="diff-down"/);
  assert.match(app.markup(), /Highlighted profit cells changed/);
  assert.match(app.markup(), /matched by stable identifier/);
  assert.deepEqual(app.saved(), current);
  app.click('clear-comparison'); assert.doesNotMatch(app.markup(), /Compare with Baseline/);
});

test('three-snapshot compare pins two library cases and flags roster mismatches', async () => {
  const app = await workbench();
  app.nameCase('Baseline');
  app.click('save-case');
  app.click('preset', { preset: 'thinMargin' });
  app.nameCase('Thin');
  app.click('save-case');
  app.click('pin-first', { caseId: 'case-1' });
  assert.match(app.markup(), /First pin is empty|Second pin is empty|Pin two saved snapshots/);
  app.click('pin-second', { caseId: 'case-2' });
  assert.match(app.markup(), /id="three-compare-title"/);
  assert.match(app.markup(), /All three cases share the same participant identifiers/);
  assert.match(app.markup(), /Baseline profit/);
  assert.match(app.markup(), /Thin profit/);
  assert.match(app.markup(), /Current profit/);
  assert.match(app.markup(), /Holds/);
  app.click('preset', { preset: 'creatorTakeRate' });
  assert.match(app.markup(), /Participant sets differ/);
  assert.match(app.markup(), /Not in this roster/);
  assert.match(app.markup(), /roster mismatch/);
  app.click('clear-three-compare');
  assert.doesNotMatch(app.markup(), /id="three-compare-title"/);
});

test('imported JSON compare keeps the current case and labels different identifiers', async () => {
  const app = await workbench();
  app.click('dismiss-coach');
  app.click('reset');
  const before = app.saved();
  const other = clonePreset('balanced');
  other.participants[0].fixedMonthlyCost = 1900;
  app.compareImport(other, undefined, false, { name: 'alt.json' });
  assert.match(app.markup(), /id="imported-compare-title"/);
  assert.match(app.markup(), /alt.json/);
  assert.match(app.markup(), /The current case was not replaced/);
  assert.match(app.markup(), /class="diff-up"/);
  assert.match(app.markup(), /100.00 units/);
  assert.match(app.markup(), /Missing identifiers are labeled, not zero-filled/);
  assert.deepEqual(app.saved(), before);
  const creator = clonePreset('creatorTakeRate');
  app.compareImport(creator, undefined, false, { name: 'creator.json' });
  assert.match(app.markup(), /Not in this roster/);
  assert.match(app.markup(), /roster mismatch/);
  assert.match(app.markup(), /n\/a/);
  assert.deepEqual(app.saved(), before);
  const unknown = clonePreset('balanced');
  unknown.unexpected = true;
  app.compareImport(unknown);
  assert.match(app.notice(), /unknown field/);
  assert.deepEqual(app.saved(), before);
  app.click('clear-imported-compare');
  assert.doesNotMatch(app.markup(), /id="imported-compare-title"/);
});

test('decision report exports reproducible inputs, outcomes, and safe participant prose', async () => {
  const app = await workbench();
  app.edit('participants.0.name', '<img src=x>|Bad', { type: 'text' });
  app.click('export-report');
  const file = app.downloads()[0]; assert.equal(file.filename, 'partnership-breakpoint-report.md');
  const text = await file.blob.text();
  assert.match(text, /Counts are not probabilities/);
  assert.match(text, /&lt;img src=x&gt;/);
  const config = JSON.parse(text.split('\x60\x60\x60json\n')[1].split('\n\x60\x60\x60')[0]);
  assert.deepEqual(config, app.saved());
  app.edit('deal.monthlyVolume', ''); app.click('export-report');
  assert.equal(app.downloads().length, 1);
});

test('stress CSV exports every participant case and neutralizes formula names', async () => {
  const app = await workbench();
  app.edit('participants.0.name', '=HYPERLINK("bad")', { type: 'text' });
  app.click('export-csv');
  const file = app.downloads()[0]; const csv = await file.blob.text();
  assert.equal(file.filename, 'partnership-breakpoint-stress.csv');
  assert.equal(csv.trim().split('\r\n').length, 82);
  assert.ok(csv.includes("\"'=HYPERLINK(\"\"bad\"\")\""));
  assert.match(csv, /Profit gap/);
  app.edit('deal.monthlyVolume', ''); app.click('export-csv');
  assert.equal(app.downloads().length, 1);
});

test('visible stress CSV follows the collapsed case filter and keeps all-case export unchanged', async () => {
  const app = await workbench();
  app.click('dismiss-coach');
  app.click('export-visible-csv');
  const allVisible = app.downloads()[0];
  assert.equal(allVisible.filename, 'partnership-breakpoint-stress-visible.csv');
  assert.equal((await allVisible.blob.text()).trim().split('\r\n').length, 82);
  assert.match(app.notice(), /27 of 27 tested cases included/);
  assert.match(app.notice(), /not probabilities/);
  app.click('collapse-all-hold-cases');
  app.click('export-visible-csv');
  const collapsed = app.downloads()[1];
  const collapsedText = await collapsed.blob.text();
  assert.equal(collapsed.filename, 'partnership-breakpoint-stress-visible.csv');
  assert.equal(collapsedText.trim().split('\r\n').length, 79);
  assert.doesNotMatch(collapsedText, /"case-1"/);
  assert.match(collapsedText, /"case-2"/);
  assert.match(app.notice(), /26 of 27 tested cases included/);
  app.click('export-csv');
  assert.equal(app.downloads()[2].filename, 'partnership-breakpoint-stress.csv');
  assert.equal((await app.downloads()[2].blob.text()).trim().split('\r\n').length, 82);
  app.edit('deal.title', 'Harbor JV', { type: 'text' });
  app.click('export-visible-csv');
  assert.equal(app.downloads()[3].filename, 'partnership-breakpoint-harbor-jv-stress-visible.csv');
  app.edit('deal.monthlyVolume', '');
  app.click('export-visible-csv');
  assert.equal(app.downloads().length, 4);
  assert.match(app.notice(), /Resolve invalid inputs before exporting CSV/);
});

test('copy visible stress CSV uses a second control and does not download', async () => {
  const fallback = await workbench();
  fallback.click('dismiss-coach');
  assert.match(fallback.markup(), /data-action="copy-visible-csv"/);
  assert.match(fallback.markup(), /Copy visible stress CSV/);
  assert.match(fallback.markup(), /Copy visible cases CSV/);
  assert.match(fallback.markup(), /data-action="export-visible-csv"/);
  fallback.click('copy-visible-csv');
  assert.equal(fallback.downloads().length, 0);
  assert.match(fallback.markup(), /id="csv-copy-text"/);
  assert.match(fallback.markup(), /currently visible stress grid/);
  assert.match(fallback.markup(), /&quot;case-1&quot;/);
  assert.match(fallback.notice(), /Copy the visible stress CSV from the text area/);
  fallback.click('close-csv-copy');
  assert.doesNotMatch(fallback.markup(), /id="csv-copy-text"/);

  fallback.click('collapse-all-hold-cases');
  fallback.click('copy-visible-csv');
  assert.equal(fallback.downloads().length, 0);
  assert.match(fallback.markup(), /id="csv-copy-text"/);
  assert.doesNotMatch(fallback.markup(), /&quot;case-1&quot;/);
  assert.match(fallback.markup(), /&quot;case-2&quot;/);
  fallback.click('close-csv-copy');

  fallback.edit('deal.monthlyVolume', '');
  fallback.click('copy-visible-csv');
  assert.equal(fallback.downloads().length, 0);
  assert.doesNotMatch(fallback.markup(), /id="csv-copy-text"/);
  assert.match(fallback.notice(), /Resolve invalid inputs before copying visible stress CSV/);

  const withClipboard = await workbench('file:', { clipboard: 'ok' });
  withClipboard.click('copy-visible-csv');
  assert.equal(withClipboard.downloads().length, 0);
  assert.equal(withClipboard.copied().length, 1);
  assert.equal(withClipboard.copied()[0].trim().split('\r\n').length, 82);
  assert.match(withClipboard.notice(), /27 of 27 tested cases included/);
  assert.match(withClipboard.notice(), /not probabilities/);
  assert.doesNotMatch(withClipboard.markup(), /id="csv-copy-text"/);
  withClipboard.click('collapse-all-hold-cases');
  withClipboard.click('copy-visible-csv');
  assert.equal(withClipboard.copied().length, 2);
  assert.equal(withClipboard.copied()[1].trim().split('\r\n').length, 79);
  assert.doesNotMatch(withClipboard.copied()[1], /"case-1"/);
  assert.match(withClipboard.copied()[1], /"case-2"/);
  assert.match(withClipboard.notice(), /26 of 27 tested cases included/);
  assert.equal(withClipboard.downloads().length, 0);

  const denied = await workbench('file:', { clipboard: 'fail' });
  denied.click('copy-visible-csv');
  assert.equal(denied.downloads().length, 0);
  assert.match(denied.markup(), /id="csv-copy-text"/);
  assert.match(denied.notice(), /Clipboard unavailable/);
});

test('share reconciliation repairs overallocations and preserves participant costs', async () => {
  const app = await workbench();
  app.edit('participants.0.revenueShare', '0.8');
  assert.match(app.markup(), /is overallocated/);
  app.click('normalize-shares');
  const normalized = app.saved();
  assert.ok(Math.abs(normalized.participants.reduce((sum, p) => sum + p.revenueShare, 0) - 1) < 1e-9);
  assert.ok(Math.abs(normalized.participants[0].revenueShare / normalized.participants[1].revenueShare - 0.8 / 0.35) < 1e-9);
  assert.equal(normalized.participants[0].fixedMonthlyCost, 1800);
  app.click('equal-shares');
  assert.ok(app.saved().participants.every((p) => Math.abs(p.revenueShare - 1 / 3) < 1e-9));
  app.click('undo'); assert.deepEqual(app.saved(), normalized);
});
test('normalization refuses missing shares and equal split recovers them explicitly', async () => {
 const app = await workbench(); app.edit('participants.0.revenueShare', '');
 app.click('normalize-shares'); assert.match(app.notice(), /Normalize requires/);
 app.click('equal-shares'); assert.doesNotMatch(app.markup(), /Resolve these inputs/);
});

test('compound case inspection requires explicit application and supports undo', async () => {
  const app = await workbench(); app.click('reset'); const original = app.saved();
  app.click('inspect-stress', { scenarioId: 'case-27' });
  assert.match(app.markup(), /Inspect case-27 as a new baseline/);
  assert.deepEqual(app.saved(), original);
  app.click('apply-stress-case');
  assert.equal(app.saved().deal.monthlyVolume, 120000);
  assert.equal(app.saved().deal.feePerTransaction, 0.2 * 0.9);
  app.click('undo'); assert.deepEqual(app.saved(), original);
});

test('print one-pager keeps tornado, waterfall, ledger, notes, least headroom, allocation balance, deal title, currency code, first-breakpoint participant, and remaining-to-hold', async () => {
  const app = await workbench();
  const html = await buildStandalone();
  app.click('dismiss-coach');
  app.click('reset');
  assert.match(app.markup(), /class="panel print-keep"[^>]*id="participant-ledger"|id="participant-ledger"[^>]*class="panel print-keep"/);
  assert.match(app.markup(), /class="panel print-keep"/);
  assert.match(app.markup(), /Adverse-shock tornado/);
  assert.match(app.markup(), /Contribution waterfall/);
  assert.match(app.markup(), /class="print-only print-keep"/);
  assert.match(app.markup(), /<h2>Deal title<\/h2><p>No deal title was entered\.<\/p>/);
  assert.match(app.markup(), /<h2>Currency code<\/h2><p>No currency code was entered\.<\/p>/);
  assert.match(app.markup(), /<h2>Deal notes<\/h2>/);
  assert.match(app.markup(), /<h2>Least headroom<\/h2><p>Liquidity Partner has the least volume headroom to its minimum acceptable profit limit\.<\/p>/);
  assert.match(app.markup(), /<h2>Least-headroom participant<\/h2><p>Least-headroom participant: Liquidity Partner\. Volume-headroom ranking, not a forecast\.<\/p>/);
  assert.match(app.markup(), /<h2>First-breakpoint participant<\/h2><p>First-breakpoint participant: Liquidity Partner\. Synthetic ranking, not a forecast\.<\/p>/);
  assert.match(app.markup(), /<h2>First-breakpoint remaining-to-hold<\/h2><p>First-breakpoint remaining-to-hold: 0\.0% share for Liquidity Partner\. Synthetic ranking, not a forecast\.<\/p>/);
  assert.match(app.markup(), /<h2>Allocation balance<\/h2><p>Allocated: 100\.0%\. Shares reconcile to 100%\.<\/p>/);
  const before = JSON.stringify(app.saved());
  app.click('print-report');
  assert.equal(app.prints(), 1);
  assert.equal(JSON.stringify(app.saved()), before);
  assert.match(app.lastPrint(), /<h2>Deal title<\/h2><p>No deal title was entered\.<\/p>/);
  assert.match(app.lastPrint(), /<h2>Currency code<\/h2><p>No currency code was entered\.<\/p>/);
  assert.match(app.lastPrint(), /<h2>Least-headroom participant<\/h2><p>Least-headroom participant: Liquidity Partner\. Volume-headroom ranking, not a forecast\.<\/p>/);
  assert.match(app.lastPrint(), /<h2>First-breakpoint participant<\/h2><p>First-breakpoint participant: Liquidity Partner\. Synthetic ranking, not a forecast\.<\/p>/);
  assert.match(app.lastPrint(), /<h2>First-breakpoint remaining-to-hold<\/h2><p>First-breakpoint remaining-to-hold: 0\.0% share for Liquidity Partner\. Synthetic ranking, not a forecast\.<\/p>/);
  assert.match(app.lastPrint(), /<h2>Allocation balance<\/h2><p>Allocated: 100\.0%\. Shares reconcile to 100%\.<\/p>/);
  app.edit('deal.title', 'Harbor JV', { type: 'text' });
  app.edit('deal.currency', 'USD', { type: 'text' });
  const titled = JSON.stringify(app.saved());
  app.click('print-report');
  assert.equal(app.prints(), 2);
  assert.equal(JSON.stringify(app.saved()), titled);
  assert.match(app.lastPrint(), /<h2>Deal title<\/h2><p>Harbor JV<\/p>/);
  assert.match(app.lastPrint(), /<h2>Currency code<\/h2><p>USD<\/p>/);
  assert.match(html, /@media print/);
  assert.match(html, /\.skip-link, \.site-header, \.site-footer/);
  assert.match(html, /\.panel:not\(\.print-keep\)/);
  assert.match(html, /@page \{ size: portrait;/);
  assert.match(html, /\.coach-overlay, \.help-overlay/);
});

test('redacted print uses Participant 1 through N in the print path and stylesheet', async () => {
  const app = await workbench();
  const html = await buildStandalone();
  app.click('print-redacted');
  assert.equal(app.prints(), 1);
  const snapshot = app.lastPrint();
  assert.match(snapshot, /class="app-grid print-redacted"/);
  assert.match(snapshot, /Participant 1/);
  assert.match(snapshot, /class="participant-redacted-name">Participant 1</);
  assert.doesNotMatch(snapshot, /class="participant-live-name">Platform</);
  assert.match(snapshot, /Participant 3 has the least volume headroom to its minimum acceptable profit limit/);
  assert.match(snapshot, /<h2>Least-headroom participant<\/h2><p>Least-headroom participant: Participant 3\. Volume-headroom ranking, not a forecast\.<\/p>/);
  assert.match(snapshot, /<h2>First-breakpoint participant<\/h2><p>First-breakpoint participant: Participant 3\. Synthetic ranking, not a forecast\.<\/p>/);
  assert.match(snapshot, /<h2>First-breakpoint remaining-to-hold<\/h2><p>First-breakpoint remaining-to-hold: 0\.0% share for Participant 3\. Synthetic ranking, not a forecast\.<\/p>/);
  assert.match(snapshot, /<h2>Allocation balance<\/h2><p>Allocated: 100\.0%\. Shares reconcile to 100%\.<\/p>/);
  assert.doesNotMatch(snapshot, /Liquidity Partner has the least volume headroom/);
  assert.doesNotMatch(snapshot, /Least-headroom participant: Liquidity Partner/);
  assert.doesNotMatch(snapshot, /First-breakpoint participant: Liquidity Partner/);
  assert.doesNotMatch(snapshot, /First-breakpoint remaining-to-hold: 0\.0% share for Liquidity Partner/);
  assert.match(html, /\.print-redacted \.participant-live-name/);
  assert.match(html, /\.print-redacted \.participant-redacted-name/);
  assert.match(app.markup(), /class="participant-live-name">Platform</);
  assert.doesNotMatch(app.markup(), /class="app-grid print-redacted"/);
  app.edit('deal.monthlyVolume', '');
  app.click('print-redacted');
  assert.equal(app.prints(), 1);
  assert.match(app.notice(), /Resolve invalid inputs before printing a redacted report/);
});

test('invalid fields expose accessible state and printing requires a valid case', async () => {
 const app = await workbench();
 const html = await buildStandalone();
 app.click('print-report'); assert.equal(app.prints(), 1);
 app.edit('deal.monthlyVolume', '');
 assert.match(app.markup(), /id="field-deal-monthlyVolume" aria-invalid="true"/);
 assert.match(app.markup(), /class="invalid-summary"/);
 assert.match(app.markup(), /aria-live="polite">1 field needs attention\./);
 assert.match(app.markup(), /Go to first invalid field/);
 assert.match(app.markup(), /[0-9]+ field[s]? need/);
 assert.match(app.markup(), /<details class="participant-details"[^>]* open/);
 assert.match(html, /\.invalid-summary \{[\s\S]*position: sticky;/);
 app.click('print-report'); assert.equal(app.prints(), 1);
 app.click('undo'); app.click('print-report'); assert.equal(app.prints(), 2);
 assert.doesNotMatch(app.markup(), /class="invalid-summary"/);
 assert.match(app.markup(), /Case assumptions/);
});

test('deal title and currency persist, display as a prefix, and reject illegal codes', async () => {
  const app = await workbench();
  assert.match(app.markup(), /data-path="deal.title"/);
  assert.match(app.markup(), /data-path="deal.currency"/);
  app.edit('deal.title', '  Harbor JV  ', { type: 'text' });
  app.edit('deal.currency', 'USD', { type: 'text' });
  assert.equal(app.saved().deal.title, 'Harbor JV');
  assert.equal(app.saved().deal.currency, 'USD');
  assert.match(app.markup(), /Harbor JV/);
  assert.match(app.markup(), /USD 20,000\.00/);
  assert.doesNotMatch(app.markup(), /20,000\.00 units/);
  app.edit('deal.currency', 'usd', { type: 'text' });
  assert.match(app.markup(), /Resolve these inputs/);
  assert.match(app.notice(), /Deal currency/);
  assert.equal(app.saved().deal.currency, 'USD');
  app.edit('deal.currency', '', { type: 'text', optional: 'true' });
  assert.equal(Object.hasOwn(app.saved().deal, 'currency'), false);
  assert.match(app.markup(), /20,000\.00 units/);
});

test('deal notes persist, print, and export, and reject overlong or unknown values', async () => {
  const app = await workbench();
  assert.match(app.markup(), /<textarea[^>]*data-path="deal.notes"/);
  app.edit('deal.notes', '  Review the capacity clause.  ', { type: 'text', optional: 'true' });
  assert.equal(app.saved().deal.notes, 'Review the capacity clause.');
  assert.match(app.markup(), /<h2>Deal notes<\/h2><p>Review the capacity clause\.<\/p>/);
  app.click('export-report');
  const report = await app.downloads()[0].blob.text();
  assert.match(report, /Notes: Review the capacity clause\./);
  app.click('copy-brief');
  assert.match(app.markup(), /id="brief-copy-text"/);
  assert.match(app.markup(), /Notes: Review the capacity clause\./);
  app.edit('deal.notes', 'x'.repeat(501), { type: 'text', optional: 'true' });
  assert.match(app.markup(), /Resolve these inputs/);
  assert.match(app.notice(), /Deal notes/);
  assert.equal(app.saved().deal.notes, 'Review the capacity clause.');
  app.edit('deal.notes', '', { type: 'text', optional: 'true' });
  assert.equal(Object.hasOwn(app.saved().deal, 'notes'), false);
});

test('duplicate display names warn without blocking edits', async () => {
  const app = await workbench();
  app.click('dismiss-coach');
  assert.doesNotMatch(app.markup(), /duplicate-name-warning/);
  app.edit('participants.1.name', 'Platform', { type: 'text' });
  assert.match(app.markup(), /class="duplicate-name-warning"/);
  assert.match(app.markup(), /2 participants share the name Platform/);
  assert.match(app.markup(), /does not claim they are the same party/);
  assert.match(app.markup(), /does not block editing/);
  assert.match(app.markup(), /tested cases hold/);
  app.edit('participants.1.name', 'Distributor', { type: 'text' });
  assert.doesNotMatch(app.markup(), /duplicate-name-warning/);
});

test('roster highlights the first listed participant who fails the current baseline', async () => {
  const app = await workbench();
  assert.doesNotMatch(app.markup(), /first-fail-label/);
  const failing = clonePreset('balanced');
  failing.participants[0].minimumAcceptableProfit = 1_000_000;
  failing.participants[1].minimumAcceptableProfit = 1_000_000;
  app.import(failing);
  assert.match(app.markup(), /class="participant-form first-fail"/);
  assert.match(app.markup(), /First listed participant who fails an exit test in this baseline/);
  assert.doesNotMatch(app.markup(), /who will act with a chance/);
  const firstForm = app.markup().match(/<section class="participant-form first-fail"[\s\S]*?<summary id="participant-0-title">([\s\S]*?)<\/summary>/)[1];
  assert.match(firstForm, /Platform/);
  app.click('move-participant-down', { index: '0' });
  const moved = app.markup().match(/<section class="participant-form first-fail"[\s\S]*?<summary id="participant-0-title">([\s\S]*?)<\/summary>/)[1];
  assert.match(moved, /Distributor/);
});

test('participant roster toolbar stays outside the disclosure and defaults to open', async () => {
  const app = await workbench();
  const html = await buildStandalone();
  const form = app.markup().match(/<section class="participant-form"[\s\S]*?<\/section>/)[0];
  const toolbarAt = form.indexOf('class="participant-toolbar"');
  const detailsAt = form.indexOf('class="participant-details"');
  assert.ok(toolbarAt >= 0 && detailsAt > toolbarAt);
  assert.match(form, /data-action="duplicate-participant"/);
  assert.match(form, /data-action="move-participant-up"/);
  assert.match(form, /data-action="move-participant-down"/);
  assert.match(form, /data-action="swap-participant-next"/);
  assert.match(form, /data-action="remove-participant"/);
  assert.match(app.markup(), /<details class="participant-details"[^>]* open/);
  assert.match(html, /@media \(max-width: 390px\)/);
  assert.match(html, /\.participant-toolbar \.button-row/);
});

test('duplicate and move roster controls keep unique ids and the original share sum', async () => {
  const app = await workbench();
  app.click('duplicate-participant', { index: '0' });
  const duplicated = app.saved();
  assert.equal(duplicated.participants.length, 4);
  assert.equal(new Set(duplicated.participants.map((item) => item.id)).size, 4);
  assert.equal(duplicated.participants[1].name, 'Platform copy');
  assert.equal(duplicated.participants[1].revenueShare, 0);
  assert.equal(duplicated.participants.reduce((sum, item) => sum + item.revenueShare, 0), 1);
  app.click('move-participant-down', { index: '0' });
  assert.equal(app.saved().participants[0].id, 'participant-1');
  assert.equal(app.saved().participants[1].id, 'platform');
  app.click('move-participant-up', { index: '1' });
  assert.deepEqual(app.saved().participants.map((item) => item.id), duplicated.participants.map((item) => item.id));
  assert.equal(app.saved().participants.reduce((sum, item) => sum + item.revenueShare, 0), 1);
});

test('swap with next reorders adjacent participants and can be undone', async () => {
  const app = await workbench();
  app.click('dismiss-coach');
  app.click('reset');
  const original = ['platform', 'distributor', 'liquidity-partner'];
  assert.deepEqual(app.saved().participants.map((item) => item.id), original);
  const originalShares = app.saved().participants.map((item) => item.revenueShare);
  app.click('swap-participant-next', { index: '0' });
  assert.deepEqual(app.saved().participants.map((item) => item.id), ['distributor', 'platform', 'liquidity-partner']);
  assert.equal(app.saved().participants[0].revenueShare, originalShares[1]);
  assert.equal(app.saved().participants[1].revenueShare, originalShares[0]);
  assert.match(app.notice(), /Adjacent participants swapped/);
  app.click('undo');
  assert.deepEqual(app.saved().participants.map((item) => item.id), original);
  app.click('swap-participant-next', { index: '2' });
  assert.deepEqual(app.saved().participants.map((item) => item.id), original);
});

test('removing a participant reallocates their share and blocks dropping the last two', async () => {
  const app = await workbench();
  app.click('remove-participant', { index: '0' });
  const remaining = app.saved().participants;
  assert.equal(remaining.length, 2);
  assert.equal(remaining.reduce((sum, item) => sum + item.revenueShare, 0), 1);
  assert.match(app.notice(), /reallocated/);
  assert.match(app.markup(), /data-action="remove-participant"[^>]*disabled/);
  app.click('remove-participant', { index: '0' });
  assert.equal(app.saved().participants.length, 2);
});

test('share-to-hold previews a split and requires an explicit apply', async () => {
  const app = await workbench();
  app.click('solve-share-hold', { participantId: 'liquidity-partner' });
  assert.match(app.markup(), /Share-to-hold preview/);
  assert.match(app.markup(), /Apply minimum hold share/);
  const originalShares = [0.4, 0.35, 0.25];
  app.click('close-share-hold');
  assert.doesNotMatch(app.markup(), /Share-to-hold preview/);
  app.click('solve-share-hold', { participantId: 'liquidity-partner' });
  app.click('apply-share-hold');
  const applied = app.saved();
  assert.ok(Math.abs(applied.participants.find((item) => item.id === 'liquidity-partner').revenueShare - 0.24) < 1e-8);
  assert.equal(applied.participants.reduce((sum, item) => sum + item.revenueShare, 0), 1);
  assert.notDeepEqual(applied.participants.map((item) => item.revenueShare), originalShares);
  app.click('undo');
  assert.deepEqual(app.saved().participants.map((item) => item.revenueShare), originalShares);
});

test('copy share-to-hold preview uses Markdown and a clipboard fallback', async () => {
  const fallback = await workbench();
  fallback.click('dismiss-coach');
  fallback.click('copy-share-hold');
  assert.match(fallback.notice(), /Open a share-to-hold preview before copying it/);
  assert.doesNotMatch(fallback.markup(), /id="share-hold-copy-text"/);
  fallback.click('solve-share-hold', { participantId: 'liquidity-partner' });
  assert.match(fallback.markup(), /data-action="copy-share-hold"/);
  fallback.click('copy-share-hold');
  assert.equal(fallback.downloads().length, 0);
  assert.match(fallback.markup(), /id="share-hold-copy-text"/);
  assert.match(fallback.markup(), /Participant: Liquidity Partner/);
  assert.match(fallback.markup(), /Status: possible/);
  assert.match(fallback.markup(), /Minimum revenue share: 24\.0%/);
  assert.match(fallback.markup(), /not a probability that the participant will stay/);
  fallback.click('close-share-hold-copy');
  assert.doesNotMatch(fallback.markup(), /id="share-hold-copy-text"/);

  const withClipboard = await workbench('file:', { clipboard: 'ok' });
  withClipboard.click('solve-share-hold', { participantId: 'liquidity-partner' });
  withClipboard.click('copy-share-hold');
  assert.equal(withClipboard.copied().length, 1);
  assert.match(withClipboard.copied()[0], /Participant: Liquidity Partner/);
  assert.match(withClipboard.copied()[0], /Minimum revenue share: 24\.0%/);
  assert.match(withClipboard.notice(), /copied as Markdown/);
  assert.doesNotMatch(withClipboard.markup(), /id="share-hold-copy-text"/);

  const denied = await workbench('file:', { clipboard: 'fail' });
  denied.click('solve-share-hold', { participantId: 'liquidity-partner' });
  denied.click('copy-share-hold');
  assert.match(denied.markup(), /id="share-hold-copy-text"/);
  assert.match(denied.notice(), /Clipboard unavailable/);
});

test('volume-to-hold previews a floor and requires an explicit apply', async () => {
  const app = await workbench();
  assert.match(app.markup(), /data-action="solve-volume-hold" data-participant-id="liquidity-partner"/);
  app.click('solve-volume-hold', { participantId: 'liquidity-partner' });
  assert.match(app.markup(), /Volume-to-hold preview/);
  assert.match(app.markup(), /Apply hold volume/);
  const originalVolume = 100000;
  const originalFee = 0.2;
  const originalShares = [0.4, 0.35, 0.25];
  app.click('close-volume-hold');
  assert.doesNotMatch(app.markup(), /Volume-to-hold preview/);
  app.click('solve-volume-hold', { participantId: 'liquidity-partner' });
  app.click('apply-volume-hold');
  assert.ok(app.saved().deal.monthlyVolume < originalVolume);
  assert.ok(Math.abs(app.saved().deal.monthlyVolume - 90000) < 1e-4);
  assert.equal(app.saved().deal.feePerTransaction, originalFee);
  assert.deepEqual(app.saved().participants.map((item) => item.revenueShare), originalShares);
  app.click('undo');
  assert.equal(app.saved().deal.monthlyVolume, originalVolume);

  const blocked = clonePreset('balanced');
  blocked.participants[2].minimumAcceptableProfit = 1_000_000;
  app.import(blocked);
  app.click('solve-volume-hold', { participantId: 'liquidity-partner' });
  assert.match(app.markup(), /No monthly volume/);
  assert.doesNotMatch(app.markup(), /data-action="apply-volume-hold"/);
  app.edit('deal.monthlyVolume', '');
  app.click('solve-volume-hold', { participantId: 'liquidity-partner' });
  assert.match(app.notice(), /Resolve invalid inputs before solving a hold volume/);
});

test('participant ledger shows capacity utilization as a meter plus text, or unbounded', async () => {
  const app = await workbench();
  assert.match(app.markup(), /<th>Capacity use<\/th>/);
  assert.match(app.markup(), /class="capacity-meter"/);
  assert.match(app.markup(), /aria-label="76.9% of capacity"/);
  assert.match(app.markup(), /76\.9% of capacity/);
  const jv = clonePreset('threePartyJv');
  app.import(jv);
  assert.match(app.markup(), />Unbounded</);
  const over = clonePreset('balanced');
  over.participants[0].capacity = 0;
  app.import(over);
  assert.match(app.markup(), /Exceeds zero capacity/);
});

test('tornado chart includes an SVG and a text-equivalent table', async () => {
  const app = await workbench();
  assert.match(app.markup(), /Adverse-shock tornado/);
  assert.match(app.markup(), /<svg class="chart-svg"[^>]*aria-label="Tornado chart/);
  assert.match(app.markup(), /<caption>Text equivalent of the tornado chart<\/caption>/);
  assert.match(app.markup(), /Volume down/);
  assert.match(app.markup(), /Fee down/);
  assert.match(app.markup(), /data-action="export-tornado-svg"/);
});

test('tornado SVG download writes a namespaced file and refuses invalid cases', async () => {
  const app = await workbench();
  app.click('dismiss-coach');
  app.click('export-tornado-svg');
  const file = app.downloads()[0];
  assert.equal(file.filename, 'partnership-breakpoint-tornado.svg');
  const text = await file.blob.text();
  assert.match(text, /^<\?xml version="1.0" encoding="UTF-8"\?>/);
  assert.match(text, /xmlns="http:\/\/www.w3.org\/2000\/svg"/);
  assert.match(text, /<svg /);
  assert.doesNotMatch(text, /probab/i);
  app.edit('deal.title', 'Harbor JV', { type: 'text' });
  app.click('export-tornado-svg');
  assert.equal(app.downloads()[1].filename, 'partnership-breakpoint-harbor-jv-tornado.svg');
  app.edit('deal.monthlyVolume', '');
  app.click('export-tornado-svg');
  assert.equal(app.downloads().length, 2);
  assert.match(app.notice(), /Resolve invalid inputs before downloading the tornado SVG/);
});

test('contribution waterfall includes an SVG and a text fallback for each participant', async () => {
  const app = await workbench();
  assert.match(app.markup(), /Contribution waterfall/);
  assert.match(app.markup(), /aria-label="Contribution waterfall for Platform/);
  assert.match(app.markup(), /<caption>Text equivalent for Platform<\/caption>/);
  assert.match(app.markup(), /Minimum acceptable profit/);
  assert.match(app.markup(), /data-action="export-waterfall-svg"/);
  const tornadoAt = app.markup().indexOf('Adverse-shock tornado');
  const waterfallAt = app.markup().indexOf('Contribution waterfall');
  const stressAt = app.markup().indexOf('Compound stress and negotiation');
  assert.equal(tornadoAt > 0 && waterfallAt > tornadoAt && stressAt > waterfallAt, true);
});

test('waterfall SVG download writes a namespaced file and refuses invalid cases', async () => {
  const app = await workbench();
  app.click('dismiss-coach');
  app.click('export-waterfall-svg');
  const file = app.downloads()[0];
  assert.equal(file.filename, 'partnership-breakpoint-waterfall.svg');
  const text = await file.blob.text();
  assert.match(text, /^<\?xml version="1.0" encoding="UTF-8"\?>/);
  assert.match(text, /xmlns="http:\/\/www.w3.org\/2000\/svg"/);
  assert.match(text, /<svg /);
  assert.match(text, /Platform/);
  assert.match(text, /Revenue/);
  assert.doesNotMatch(text, /probab/i);
  app.edit('deal.title', 'Harbor JV', { type: 'text' });
  app.click('export-waterfall-svg');
  assert.equal(app.downloads()[1].filename, 'partnership-breakpoint-harbor-jv-waterfall.svg');
  app.edit('deal.monthlyVolume', '');
  app.click('export-waterfall-svg');
  assert.equal(app.downloads().length, 2);
  assert.match(app.notice(), /Resolve invalid inputs before downloading the waterfall SVG/);
});

test('two-party 50/50 studio preset loads from the starting-point buttons', async () => {
  const app = await workbench();
  assert.match(app.markup(), /data-preset="twoPartyStudio"/);
  assert.match(app.markup(), /Two-party 50\/50 studio/);
  app.click('preset', { preset: 'twoPartyStudio' });
  assert.equal(app.saved().participants.length, 2);
  assert.equal(app.saved().participants[0].revenueShare, 0.5);
  assert.equal(app.saved().participants[1].revenueShare, 0.5);
  assert.equal(app.saved().deal.feePerTransaction, 18);
  assert.match(app.notice(), /Two-party 50\/50 studio loaded/);
});

test('four-party marketplace preset loads from the starting-point buttons', async () => {
  const app = await workbench();
  assert.match(app.markup(), /data-preset="fourPartyMarketplace"/);
  assert.match(app.markup(), /Four-party marketplace/);
  app.click('preset', { preset: 'fourPartyMarketplace' });
  assert.equal(app.saved().participants.length, 4);
  assert.deepEqual(app.saved().participants.map((item) => item.id), ['marketplace', 'seller', 'logistics', 'payments']);
  assert.equal(app.saved().deal.feePerTransaction, 1.2);
  assert.equal(app.saved().deal.monthlyVolume, 25000);
  assert.match(app.notice(), /Four-party marketplace loaded/);
});

test('three-party joint venture preset loads from the starting-point buttons', async () => {
  const app = await workbench();
  assert.match(app.markup(), /data-preset="threePartyJointVenture"/);
  assert.match(app.markup(), /Three-party joint venture/);
  app.click('preset', { preset: 'threePartyJointVenture' });
  assert.equal(app.saved().participants.length, 3);
  assert.deepEqual(app.saved().participants.map((item) => item.id), ['synthetic-operator', 'capital-partner', 'operator-talent']);
  assert.deepEqual(app.saved().participants.map((item) => item.name), ['Synthetic operator', 'Capital partner', 'Operator-talent']);
  assert.equal(app.saved().deal.feePerTransaction, 55);
  assert.equal(app.saved().deal.monthlyVolume, 8000);
  assert.equal(app.saved().participants[1].capacity, null);
  assert.match(app.notice(), /Three-party joint venture loaded/);
  assert.match(app.markup(), /Operating region holds/);
  assert.notEqual(app.saved().participants.map((item) => item.id).join(','), 'talent,booking-agent,booking-platform');
  assert.notEqual(app.saved().participants.map((item) => item.id).join(','), 'operator,capital,ip-owner');
});

test('podcast host and network preset loads from the starting-point buttons', async () => {
  const app = await workbench();
  assert.match(app.markup(), /data-preset="podcastHostNetwork"/);
  assert.match(app.markup(), /Podcast host and network/);
  app.click('preset', { preset: 'podcastHostNetwork' });
  assert.equal(app.saved().participants.length, 2);
  assert.deepEqual(app.saved().participants.map((item) => item.id), ['podcast-host', 'podcast-network']);
  assert.deepEqual(app.saved().participants.map((item) => item.name), ['Podcast host', 'Podcast network']);
  assert.equal(app.saved().deal.feePerTransaction, 14);
  assert.equal(app.saved().deal.monthlyVolume, 3500);
  assert.equal(app.saved().participants[0].capacity, null);
  assert.notEqual(app.saved().participants[0].variableCostPerTransaction, app.saved().participants[1].variableCostPerTransaction);
  assert.match(app.notice(), /Podcast host and network loaded/);
  assert.match(app.markup(), /Operating region holds/);
  assert.notEqual(app.saved().participants.map((item) => item.id).join(','), 'production-studio,distribution-studio');
  assert.notEqual(app.saved().participants.map((item) => item.id).join(','), 'ip-licensor,territory-distributor');
  assert.notEqual(app.saved().participants.map((item) => item.id).join(','), 'creator,platform');
});

test('community hall split preset loads from the starting-point buttons', async () => {
  const app = await workbench();
  assert.match(app.markup(), /data-preset="communityHallSplit"/);
  assert.match(app.markup(), /Community hall split/);
  app.click('preset', { preset: 'communityHallSplit' });
  assert.equal(app.saved().participants.length, 3);
  assert.deepEqual(app.saved().participants.map((item) => item.id), ['venue', 'promoter', 'sound']);
  assert.deepEqual(app.saved().participants.map((item) => item.name), ['Venue', 'Promoter', 'Sound']);
  assert.equal(app.saved().deal.feePerTransaction, 28);
  assert.equal(app.saved().deal.monthlyVolume, 2000);
  assert.notEqual(app.saved().participants[0].variableCostPerTransaction, app.saved().participants[1].variableCostPerTransaction);
  assert.notEqual(app.saved().participants[1].variableCostPerTransaction, app.saved().participants[2].variableCostPerTransaction);
  assert.match(app.notice(), /Community hall split loaded/);
  assert.match(app.markup(), /Operating region holds/);
  assert.notEqual(app.saved().participants.map((item) => item.id).join(','), 'platform,distributor,liquidity-partner');
  assert.notEqual(app.saved().participants.map((item) => item.id).join(','), 'production-studio,distribution-studio');
  assert.notEqual(app.saved().participants.map((item) => item.id).join(','), 'marketplace,seller,logistics,payments');
  assert.notEqual(app.saved().participants.map((item) => item.id).join(','), 'ip-licensor,territory-distributor');
  assert.notEqual(app.saved().participants.map((item) => item.id).join(','), 'talent,booking-agent,booking-platform');
  assert.notEqual(app.saved().participants.map((item) => item.id).join(','), 'synthetic-operator,capital-partner,operator-talent');
  assert.notEqual(app.saved().participants.map((item) => item.id).join(','), 'podcast-host,podcast-network');
  assert.notEqual(app.saved().participants.map((item) => item.id).join(','), 'creator,platform');
  assert.notEqual(app.saved().participants.map((item) => item.id).join(','), 'operator,capital,ip-owner');
  assert.notEqual(app.saved().participants.map((item) => item.id).join(','), 'stallholder,site-manager,ticket-office');
  assert.notEqual(app.saved().participants.map((item) => item.id).join(','), 'cinema-venue,projectionist,ticket-desk');
});

test('festival stall split preset loads from the starting-point buttons', async () => {
  const app = await workbench();
  assert.match(app.markup(), /data-preset="festivalStallSplit"/);
  assert.match(app.markup(), /Festival stall split/);
  app.click('preset', { preset: 'festivalStallSplit' });
  assert.equal(app.saved().participants.length, 3);
  assert.deepEqual(app.saved().participants.map((item) => item.id), ['stallholder', 'site-manager', 'ticket-office']);
  assert.deepEqual(app.saved().participants.map((item) => item.name), ['Stallholder', 'Site manager', 'Ticket office']);
  assert.equal(app.saved().deal.feePerTransaction, 18);
  assert.equal(app.saved().deal.monthlyVolume, 2400);
  assert.notEqual(app.saved().participants[0].variableCostPerTransaction, app.saved().participants[1].variableCostPerTransaction);
  assert.notEqual(app.saved().participants[1].variableCostPerTransaction, app.saved().participants[2].variableCostPerTransaction);
  assert.match(app.notice(), /Festival stall split loaded/);
  assert.match(app.markup(), /Operating region holds/);
  assert.notEqual(app.saved().participants.map((item) => item.id).join(','), 'platform,distributor,liquidity-partner');
  assert.notEqual(app.saved().participants.map((item) => item.id).join(','), 'production-studio,distribution-studio');
  assert.notEqual(app.saved().participants.map((item) => item.id).join(','), 'marketplace,seller,logistics,payments');
  assert.notEqual(app.saved().participants.map((item) => item.id).join(','), 'ip-licensor,territory-distributor');
  assert.notEqual(app.saved().participants.map((item) => item.id).join(','), 'talent,booking-agent,booking-platform');
  assert.notEqual(app.saved().participants.map((item) => item.id).join(','), 'synthetic-operator,capital-partner,operator-talent');
  assert.notEqual(app.saved().participants.map((item) => item.id).join(','), 'podcast-host,podcast-network');
  assert.notEqual(app.saved().participants.map((item) => item.id).join(','), 'venue,promoter,sound');
  assert.notEqual(app.saved().participants.map((item) => item.id).join(','), 'creator,platform');
  assert.notEqual(app.saved().participants.map((item) => item.id).join(','), 'operator,capital,ip-owner');
  assert.notEqual(app.saved().participants.map((item) => item.id).join(','), 'cinema-venue,projectionist,ticket-desk');
  assert.notEqual(app.saved().participants.map((item) => item.id).join(','), 'concert-venue,pta,ticketing');
});

test('pop-up cinema split preset loads from the starting-point buttons', async () => {
  const app = await workbench();
  assert.match(app.markup(), /data-preset="popupCinemaSplit"/);
  assert.match(app.markup(), /Pop-up cinema split/);
  app.click('preset', { preset: 'popupCinemaSplit' });
  assert.equal(app.saved().participants.length, 3);
  assert.deepEqual(app.saved().participants.map((item) => item.id), ['cinema-venue', 'projectionist', 'ticket-desk']);
  assert.deepEqual(app.saved().participants.map((item) => item.name), ['Cinema venue', 'Projectionist', 'Ticket desk']);
  assert.equal(app.saved().deal.feePerTransaction, 24);
  assert.equal(app.saved().deal.monthlyVolume, 1600);
  assert.notEqual(app.saved().participants[0].variableCostPerTransaction, app.saved().participants[1].variableCostPerTransaction);
  assert.notEqual(app.saved().participants[1].variableCostPerTransaction, app.saved().participants[2].variableCostPerTransaction);
  assert.match(app.notice(), /Pop-up cinema split loaded/);
  assert.match(app.markup(), /Operating region holds/);
  assert.notEqual(app.saved().participants.map((item) => item.id).join(','), 'platform,distributor,liquidity-partner');
  assert.notEqual(app.saved().participants.map((item) => item.id).join(','), 'production-studio,distribution-studio');
  assert.notEqual(app.saved().participants.map((item) => item.id).join(','), 'marketplace,seller,logistics,payments');
  assert.notEqual(app.saved().participants.map((item) => item.id).join(','), 'ip-licensor,territory-distributor');
  assert.notEqual(app.saved().participants.map((item) => item.id).join(','), 'talent,booking-agent,booking-platform');
  assert.notEqual(app.saved().participants.map((item) => item.id).join(','), 'synthetic-operator,capital-partner,operator-talent');
  assert.notEqual(app.saved().participants.map((item) => item.id).join(','), 'podcast-host,podcast-network');
  assert.notEqual(app.saved().participants.map((item) => item.id).join(','), 'venue,promoter,sound');
  assert.notEqual(app.saved().participants.map((item) => item.id).join(','), 'stallholder,site-manager,ticket-office');
  assert.notEqual(app.saved().participants.map((item) => item.id).join(','), 'presenter,station,underwriter');
  assert.notEqual(app.saved().participants.map((item) => item.id).join(','), 'concert-venue,pta,ticketing');
  assert.notEqual(app.saved().participants.map((item) => item.id).join(','), 'creator,platform');
  assert.notEqual(app.saved().participants.map((item) => item.id).join(','), 'operator,capital,ip-owner');
});

test('community radio split preset loads from the starting-point buttons', async () => {
  const app = await workbench();
  assert.match(app.markup(), /data-preset="communityRadioSplit"/);
  assert.match(app.markup(), /Community radio split/);
  app.click('preset', { preset: 'communityRadioSplit' });
  assert.equal(app.saved().participants.length, 3);
  assert.deepEqual(app.saved().participants.map((item) => item.id), ['presenter', 'station', 'underwriter']);
  assert.deepEqual(app.saved().participants.map((item) => item.name), ['Presenter', 'Station', 'Underwriter']);
  assert.equal(app.saved().deal.feePerTransaction, 11);
  assert.equal(app.saved().deal.monthlyVolume, 3200);
  assert.notEqual(app.saved().participants[0].variableCostPerTransaction, app.saved().participants[1].variableCostPerTransaction);
  assert.notEqual(app.saved().participants[1].variableCostPerTransaction, app.saved().participants[2].variableCostPerTransaction);
  assert.match(app.notice(), /Community radio split loaded/);
  assert.match(app.markup(), /Operating region holds/);
  assert.notEqual(app.saved().participants.map((item) => item.id).join(','), 'platform,distributor,liquidity-partner');
  assert.notEqual(app.saved().participants.map((item) => item.id).join(','), 'production-studio,distribution-studio');
  assert.notEqual(app.saved().participants.map((item) => item.id).join(','), 'marketplace,seller,logistics,payments');
  assert.notEqual(app.saved().participants.map((item) => item.id).join(','), 'ip-licensor,territory-distributor');
  assert.notEqual(app.saved().participants.map((item) => item.id).join(','), 'talent,booking-agent,booking-platform');
  assert.notEqual(app.saved().participants.map((item) => item.id).join(','), 'synthetic-operator,capital-partner,operator-talent');
  assert.notEqual(app.saved().participants.map((item) => item.id).join(','), 'podcast-host,podcast-network');
  assert.notEqual(app.saved().participants.map((item) => item.id).join(','), 'venue,promoter,sound');
  assert.notEqual(app.saved().participants.map((item) => item.id).join(','), 'stallholder,site-manager,ticket-office');
  assert.notEqual(app.saved().participants.map((item) => item.id).join(','), 'cinema-venue,projectionist,ticket-desk');
  assert.notEqual(app.saved().participants.map((item) => item.id).join(','), 'concert-venue,pta,ticketing');
  assert.notEqual(app.saved().participants.map((item) => item.id).join(','), 'creator,platform');
  assert.notEqual(app.saved().participants.map((item) => item.id).join(','), 'operator,capital,ip-owner');
});

test('school concert split preset loads from the starting-point buttons', async () => {
  const app = await workbench();
  assert.match(app.markup(), /data-preset="schoolConcertSplit"/);
  assert.match(app.markup(), /School concert split/);
  app.click('preset', { preset: 'schoolConcertSplit' });
  assert.equal(app.saved().participants.length, 3);
  assert.deepEqual(app.saved().participants.map((item) => item.id), ['concert-venue', 'pta', 'ticketing']);
  assert.deepEqual(app.saved().participants.map((item) => item.name), ['Concert venue', 'PTA', 'Ticketing']);
  assert.equal(app.saved().deal.feePerTransaction, 12);
  assert.equal(app.saved().deal.monthlyVolume, 1800);
  assert.notEqual(app.saved().participants[0].variableCostPerTransaction, app.saved().participants[1].variableCostPerTransaction);
  assert.notEqual(app.saved().participants[1].variableCostPerTransaction, app.saved().participants[2].variableCostPerTransaction);
  assert.match(app.notice(), /School concert split loaded/);
  assert.match(app.markup(), /Operating region holds/);
  assert.notEqual(app.saved().participants.map((item) => item.id).join(','), 'platform,distributor,liquidity-partner');
  assert.notEqual(app.saved().participants.map((item) => item.id).join(','), 'production-studio,distribution-studio');
  assert.notEqual(app.saved().participants.map((item) => item.id).join(','), 'marketplace,seller,logistics,payments');
  assert.notEqual(app.saved().participants.map((item) => item.id).join(','), 'ip-licensor,territory-distributor');
  assert.notEqual(app.saved().participants.map((item) => item.id).join(','), 'talent,booking-agent,booking-platform');
  assert.notEqual(app.saved().participants.map((item) => item.id).join(','), 'synthetic-operator,capital-partner,operator-talent');
  assert.notEqual(app.saved().participants.map((item) => item.id).join(','), 'podcast-host,podcast-network');
  assert.notEqual(app.saved().participants.map((item) => item.id).join(','), 'venue,promoter,sound');
  assert.notEqual(app.saved().participants.map((item) => item.id).join(','), 'stallholder,site-manager,ticket-office');
  assert.notEqual(app.saved().participants.map((item) => item.id).join(','), 'cinema-venue,projectionist,ticket-desk');
  assert.notEqual(app.saved().participants.map((item) => item.id).join(','), 'presenter,station,underwriter');
  assert.notEqual(app.saved().participants.map((item) => item.id).join(','), 'creator,platform');
  assert.notEqual(app.saved().participants.map((item) => item.id).join(','), 'operator,capital,ip-owner');
});

test('talent, agent, and platform preset loads from the starting-point buttons', async () => {
  const app = await workbench();
  assert.match(app.markup(), /data-preset="talentAgentPlatform"/);
  assert.match(app.markup(), /Talent, agent, and platform/);
  app.click('preset', { preset: 'talentAgentPlatform' });
  assert.equal(app.saved().participants.length, 3);
  assert.deepEqual(app.saved().participants.map((item) => item.id), ['talent', 'booking-agent', 'booking-platform']);
  assert.deepEqual(app.saved().participants.map((item) => item.name), ['Talent', 'Booking agent', 'Platform']);
  assert.equal(app.saved().deal.feePerTransaction, 24);
  assert.equal(app.saved().deal.monthlyVolume, 7500);
  assert.equal(app.saved().participants[0].capacity, null);
  assert.match(app.notice(), /Talent, agent, and platform loaded/);
  assert.match(app.markup(), /Operating region holds/);
});

test('licensor and distributor preset loads from the starting-point buttons', async () => {
  const app = await workbench();
  assert.match(app.markup(), /data-preset="licensorDistributor"/);
  assert.match(app.markup(), /Licensor and distributor/);
  app.click('preset', { preset: 'licensorDistributor' });
  assert.equal(app.saved().participants.length, 2);
  assert.deepEqual(app.saved().participants.map((item) => item.id), ['ip-licensor', 'territory-distributor']);
  assert.equal(app.saved().deal.feePerTransaction, 22);
  assert.equal(app.saved().participants[0].variableCostPerTransaction, 0.25);
  assert.equal(app.saved().participants[1].variableCostPerTransaction, 6.5);
  assert.match(app.notice(), /Licensor and distributor loaded/);
  assert.match(app.markup(), /Operating region holds/);
});

test('visible tour and shortcut buttons reopen coach and help', async () => {
  const app = await workbench();
  app.click('dismiss-coach');
  assert.doesNotMatch(app.markup(), /Three steps to a first read/);
  app.click('show-coach');
  assert.match(app.markup(), /Three steps to a first read/);
  app.click('dismiss-coach');
  app.click('open-help');
  assert.match(app.markup(), /id="help-title">Keyboard shortcuts/);
});

test('coach and help dialogs trap Tab, expose modal markup, and restore on close', async () => {
  const app = await workbench();
  assert.match(app.markup(), /data-focus-trap="dialog"/);
  assert.match(app.markup(), /role="dialog" aria-modal="true"/);
  assert.match(app.markup(), /class="coach-card" tabindex="-1"/);
  assert.equal(app.keydown('Tab'), true);
  app.click('dismiss-coach');
  assert.equal(app.keydown('Tab'), false);
  app.click('open-help');
  assert.match(app.markup(), /help-overlay"[^>]*data-focus-trap="dialog"/);
  assert.match(app.markup(), /tabindex="-1"/);
  assert.match(app.markup(), /data-action="close-help"/);
  assert.equal(app.keydown('Tab'), true);
  assert.equal(app.keydown('Tab', { shiftKey: true }), true);
  app.click('close-help');
  assert.doesNotMatch(app.markup(), /id="help-title"/);
  assert.equal(app.keydown('Tab'), false);
});

test('first-run coach explains the three-step flow, dismisses to localStorage, and skips share links', async () => {
  const fresh = await workbench();
  assert.match(fresh.markup(), /Three steps to a first read/);
  assert.match(fresh.markup(), /role="dialog"/);
  fresh.click('dismiss-coach');
  assert.doesNotMatch(fresh.markup(), /Three steps to a first read/);
  assert.equal(fresh.stored('partnership-breakpoint.coach.v1'), 'dismissed');
  const dismissed = await workbench('file:', { storage: { 'partnership-breakpoint.coach.v1': 'dismissed' } });
  assert.doesNotMatch(dismissed.markup(), /Three steps to a first read/);
  const shared = clonePreset('balanced');
  shared.deal.monthlyVolume = 88_000;
  const encoded = Buffer.from(JSON.stringify(shared)).toString('base64url');
  const linked = await workbench('http:', { hash: `#deal=${encoded}` });
  assert.doesNotMatch(linked.markup(), /Three steps to a first read/);
  assert.match(linked.markup(), /value="88000"/);
  const escapeApp = await workbench();
  escapeApp.keydown('Escape');
  assert.doesNotMatch(escapeApp.markup(), /Three steps to a first read/);
});

test('keyboard shortcuts open help, undo, redo, and export without stealing from inputs', async () => {
  const app = await workbench();
  app.click('dismiss-coach');
  app.keydown('?');
  assert.match(app.markup(), /id="help-title">Keyboard shortcuts/);
  assert.match(app.markup(), /<kbd>u<\/kbd> Undo/);
  assert.match(app.markup(), /<kbd>g<\/kbd> Jump to the results nav/);
  assert.match(app.markup(), /<kbd>n<\/kbd> Focus Add participant/);
  assert.match(app.markup(), /<kbd>s<\/kbd> Jump to share-to-hold/);
  assert.match(app.markup(), /<kbd>c<\/kbd> Jump to snapshot or imported JSON compare/);
  assert.match(app.markup(), /<kbd>p<\/kbd> Print the one-pager/);
  assert.match(app.markup(), /<kbd>f<\/kbd> Jump to the First breakpoint heading/);
  assert.match(app.markup(), /<kbd>w<\/kbd> Jump to the Contribution waterfall heading/);
  assert.match(app.markup(), /<kbd>l<\/kbd> Jump to the Participant ledger heading/);
  assert.match(app.markup(), /<kbd>b<\/kbd> Jump to the viability and binding-limit card heading/);
  assert.match(app.markup(), /<kbd>t<\/kbd> Jump to the tornado chart heading/);
  assert.match(app.markup(), /<kbd>d<\/kbd> Jump to the Shared deal heading/);
  assert.match(app.markup(), /<kbd>k<\/kbd> Jump to the Compound stress heading/);
  assert.match(app.markup(), /<kbd>h<\/kbd> Jump to the least-headroom participant card, or the Participants heading if none/);
  assert.match(app.markup(), /<kbd>a<\/kbd> Jump to Add participant/);
  assert.match(app.markup(), /<kbd>m<\/kbd> Jump to deal notes/);
  assert.match(app.markup(), /<kbd>v<\/kbd> Jump to the viability card/);
  assert.match(app.markup(), /<kbd>i<\/kbd> Jump to the inspect or compare cases heading/);
  assert.match(app.markup(), /<kbd>o<\/kbd> Jump to the Operating region heading/);
  assert.match(app.markup(), /<kbd>j<\/kbd> Copy capacity utilization as Markdown/);
  assert.match(app.markup(), /<kbd>q<\/kbd> Jump to Equal split or Normalize current shares/);
  assert.match(app.markup(), /<kbd>x<\/kbd> Jump to the first roster row over listed capacity, or the Participants heading if none/);
  assert.match(app.markup(), /<kbd>y<\/kbd> Copy deal notes as one-line Markdown/);
  assert.match(app.markup(), /<kbd>z<\/kbd> Jump to Copy deal title and currency, or the Shared deal heading if missing/);
  assert.match(app.markup(), /<kbd>,<\/kbd> Copy the first-breakpoint participant label as Markdown/);
  assert.match(app.markup(), /<kbd>\.<\/kbd> Jump to Copy first-breakpoint participant label, or the First breakpoint heading if missing/);
  assert.match(app.markup(), /<kbd>\/<\/kbd> Jump to Copy deal title and currency, or the Shared deal heading if missing/);
  assert.match(app.markup(), /<kbd>;<\/kbd> Copy the least-headroom participant label as Markdown/);
  assert.match(app.markup(), /<kbd>\[<\/kbd> Jump to Copy least-headroom participant label, or the First breakpoint or results heading if missing/);
  assert.match(app.markup(), /<kbd>\]<\/kbd> Jump to Print one-pager, or the print \/ one-pager heading if missing/);
  assert.match(app.markup(), /<kbd>'<\/kbd> Copy first-breakpoint remaining-to-hold as Markdown/);
  assert.match(app.markup(), /<kbd>:<\/kbd> Copy first-breakpoint volume-to-hold as Markdown/);
  assert.match(app.markup(), /<kbd>&lt;<\/kbd> Jump to Copy first-breakpoint remaining-to-hold, or the First breakpoint heading if missing/);
  assert.match(app.markup(), /<kbd>&gt;<\/kbd> Jump to Hide participants with unused listed capacity, or the Participants heading if missing/);
  assert.match(app.markup(), /ignored while a text or number field is focused/);
  app.keydown('Escape');
  assert.doesNotMatch(app.markup(), /id="help-title">Keyboard shortcuts/);
  app.edit('deal.monthlyVolume', '80000');
  app.keydown('u');
  assert.equal(app.saved().deal.monthlyVolume, 100000);
  app.keydown('r');
  assert.equal(app.saved().deal.monthlyVolume, 80000);
  app.keydown('e');
  assert.equal(app.downloads()[0].filename, 'partnership-breakpoint.json');
  app.edit('deal.monthlyVolume', '70000');
  app.keydown('u', { tagName: 'INPUT' });
  assert.equal(app.saved().deal.monthlyVolume, 70000);
});

test('keyboard g jumps to the results nav unless a field is focused', async () => {
  const app = await workbench();
  app.click('dismiss-coach');
  app.keydown('g');
  assert.ok(app.focused().includes('#results-jump'));
  assert.ok(app.focused().includes('scroll:#results-jump'));
  const before = app.focused().length;
  app.keydown('g', { tagName: 'INPUT' });
  assert.equal(app.focused().length, before);
  app.edit('deal.monthlyVolume', '');
  app.keydown('g');
  assert.ok(app.focused().includes('#results-start'));
  assert.doesNotMatch(app.markup(), /id="results-jump"/);
});

test('keyboard a jumps to Add participant unless a field is focused', async () => {
  const app = await workbench();
  app.click('dismiss-coach');
  assert.match(app.markup(), /id="add-participant"/);
  const forms = () => app.markup().match(/class="participant-form/g)?.length ?? 0;
  const beforeCount = forms();
  app.keydown('a');
  assert.ok(app.focused().includes('#add-participant'));
  assert.ok(app.focused().includes('scroll:#add-participant'));
  assert.equal(forms(), beforeCount);
  const before = app.focused().length;
  app.keydown('a', { tagName: 'INPUT' });
  assert.equal(app.focused().length, before);
  assert.equal(forms(), beforeCount);
  app.keydown('a', { tagName: 'TEXTAREA' });
  assert.equal(app.focused().length, before);
  assert.equal(forms(), beforeCount);
});

test('keyboard n focuses Add participant and ignores focused inputs', async () => {
  const app = await workbench();
  app.click('dismiss-coach');
  assert.match(app.markup(), /id="add-participant"/);
  const forms = () => app.markup().match(/class="participant-form/g)?.length ?? 0;
  const beforeCount = forms();
  app.keydown('n');
  assert.ok(app.focused().includes('#add-participant'));
  assert.ok(app.focused().includes('scroll:#add-participant'));
  assert.equal(forms(), beforeCount);
  const before = app.focused().length;
  app.keydown('n', { tagName: 'INPUT' });
  assert.equal(app.focused().length, before);
  assert.equal(forms(), beforeCount);
  app.keydown('n', { tagName: 'TEXTAREA' });
  assert.equal(app.focused().length, before);
});

test('keyboard s jumps to share-to-hold and ignores focused inputs', async () => {
  const app = await workbench();
  app.click('dismiss-coach');
  assert.match(app.markup(), /id="share-hold-jump"/);
  app.keydown('s');
  assert.ok(app.focused().includes('#share-hold-jump'));
  assert.ok(app.focused().includes('scroll:#share-hold-jump'));
  const before = app.focused().length;
  app.keydown('s', { tagName: 'INPUT' });
  assert.equal(app.focused().length, before);
  app.keydown('s', { tagName: 'TEXTAREA' });
  assert.equal(app.focused().length, before);
  app.click('solve-share-hold', { participantId: 'liquidity-partner' });
  app.keydown('s');
  assert.ok(app.focused().includes('#share-hold-title'));
});

test('keyboard c jumps to snapshot or imported compare unless a field is focused', async () => {
  const app = await workbench();
  app.click('dismiss-coach');
  const idle = app.focused().length;
  app.keydown('c');
  assert.equal(app.focused().length, idle);
  app.nameCase('Baseline');
  app.click('save-case');
  app.click('compare-case', { caseId: 'case-1' });
  app.keydown('c');
  assert.ok(app.focused().includes('#comparison-title'));
  assert.ok(app.focused().includes('scroll:#comparison-title'));
  const afterSnapshot = app.focused().length;
  app.keydown('c', { tagName: 'INPUT' });
  assert.equal(app.focused().length, afterSnapshot);
  app.keydown('c', { tagName: 'TEXTAREA' });
  assert.equal(app.focused().length, afterSnapshot);
  const other = clonePreset('balanced');
  other.participants[0].fixedMonthlyCost = 1900;
  app.compareImport(other, undefined, false, { name: 'alt.json' });
  app.keydown('c');
  assert.ok(app.focused().includes('#imported-compare-title'));
  assert.ok(app.focused().includes('scroll:#imported-compare-title'));
});

test('keyboard p prints the one-pager when valid and ignores focused inputs', async () => {
  const app = await workbench();
  app.click('dismiss-coach');
  assert.equal(app.prints(), 0);
  app.keydown('p');
  assert.equal(app.prints(), 1);
  const before = app.prints();
  app.keydown('p', { tagName: 'INPUT' });
  assert.equal(app.prints(), before);
  app.keydown('p', { tagName: 'TEXTAREA' });
  assert.equal(app.prints(), before);
  app.edit('deal.monthlyVolume', '');
  app.keydown('p');
  assert.equal(app.prints(), before);
  assert.match(app.notice(), /Resolve invalid inputs before printing/);
  app.click('undo');
  app.keydown('p');
  assert.equal(app.prints(), before + 1);
});

test('redacted export replaces names, clears the title, and keeps identifiers', async () => {
  const app = await workbench();
  app.edit('deal.title', 'Secret Alliance', { type: 'text' });
  app.click('export-redacted');
  const file = app.downloads()[0];
  assert.equal(file.filename, 'partnership-breakpoint-secret-alliance-redacted.json');
  const parsed = JSON.parse(await file.blob.text());
  assert.equal(Object.hasOwn(parsed.deal, 'title'), false);
  assert.deepEqual(parsed.participants.map((item) => item.name), ['Participant 1', 'Participant 2', 'Participant 3']);
  assert.deepEqual(parsed.participants.map((item) => item.id), ['platform', 'distributor', 'liquidity-partner']);
  assert.match(app.markup(), /Export redacted JSON \(names replaced, title cleared\)/);
  app.edit('deal.monthlyVolume', '');
  app.click('export-redacted');
  assert.equal(app.downloads().length, 1);
});

test('keyboard f jumps to the First breakpoint heading unless a field is focused', async () => {
  const app = await workbench();
  app.click('dismiss-coach');
  assert.match(app.markup(), /id="first-breakpoint-title" tabindex="-1"/);
  app.keydown('f');
  assert.ok(app.focused().includes('#first-breakpoint-title'));
  assert.ok(app.focused().includes('scroll:#first-breakpoint-title'));
  const before = app.focused().length;
  app.keydown('f', { tagName: 'INPUT' });
  assert.equal(app.focused().length, before);
  app.keydown('f', { tagName: 'TEXTAREA' });
  assert.equal(app.focused().length, before);
  app.edit('deal.monthlyVolume', '');
  app.keydown('f');
  assert.equal(app.focused().length, before);
  assert.doesNotMatch(app.markup(), /id="first-breakpoint-title"/);
});

test('keyboard v jumps to the viability card unless a field is focused', async () => {
  const app = await workbench();
  app.click('dismiss-coach');
  assert.match(app.markup(), /id="viability-card" tabindex="-1"/);
  app.keydown('v');
  assert.ok(app.focused().includes('#viability-card'));
  assert.ok(app.focused().includes('scroll:#viability-card'));
  const before = app.focused().length;
  app.keydown('v', { tagName: 'INPUT' });
  assert.equal(app.focused().length, before);
  app.keydown('v', { tagName: 'TEXTAREA' });
  assert.equal(app.focused().length, before);
  app.edit('deal.monthlyVolume', '');
  app.keydown('v');
  assert.equal(app.focused().length, before);
  assert.doesNotMatch(app.markup(), /id="viability-card"/);
});

test('keyboard b jumps to the viability card heading unless a field is focused', async () => {
  const app = await workbench();
  app.click('dismiss-coach');
  assert.match(app.markup(), /id="viability-heading" tabindex="-1"/);
  app.keydown('b');
  assert.ok(app.focused().includes('#viability-heading'));
  assert.ok(app.focused().includes('scroll:#viability-heading'));
  const before = app.focused().length;
  app.keydown('b', { tagName: 'INPUT' });
  assert.equal(app.focused().length, before);
  app.keydown('b', { tagName: 'TEXTAREA' });
  assert.equal(app.focused().length, before);
  app.edit('deal.monthlyVolume', '');
  app.keydown('b');
  assert.equal(app.focused().length, before);
  assert.doesNotMatch(app.markup(), /id="viability-heading"/);
});

test('keyboard l jumps to the Participant ledger heading unless a field is focused', async () => {
  const app = await workbench();
  app.click('dismiss-coach');
  assert.match(app.markup(), /id="participant-ledger-title" tabindex="-1"/);
  app.keydown('l');
  assert.ok(app.focused().includes('#participant-ledger-title'));
  assert.ok(app.focused().includes('scroll:#participant-ledger-title'));
  const before = app.focused().length;
  app.keydown('l', { tagName: 'INPUT' });
  assert.equal(app.focused().length, before);
  app.keydown('l', { tagName: 'TEXTAREA' });
  assert.equal(app.focused().length, before);
  app.edit('deal.monthlyVolume', '');
  app.keydown('l');
  assert.equal(app.focused().length, before);
  assert.doesNotMatch(app.markup(), /id="participant-ledger-title"/);
});

test('keyboard k jumps to Compound stress unless a field is focused', async () => {
  const app = await workbench();
  app.click('dismiss-coach');
  assert.match(app.markup(), /id="compound-title" tabindex="-1"/);
  assert.match(app.markup(), /id="inspect-cases-title"/);
  app.keydown('k');
  assert.ok(app.focused().includes('#compound-title'));
  assert.ok(app.focused().includes('scroll:#compound-title'));
  const before = app.focused().length;
  app.keydown('k', { tagName: 'INPUT' });
  assert.equal(app.focused().length, before);
  app.keydown('k', { tagName: 'TEXTAREA' });
  assert.equal(app.focused().length, before);
  app.edit('deal.monthlyVolume', '');
  app.keydown('k');
  assert.equal(app.focused().length, before);
  assert.doesNotMatch(app.markup(), /id="compound-title"/);
});

test('keyboard m jumps to deal notes unless a field is focused', async () => {
  const app = await workbench();
  app.click('dismiss-coach');
  assert.match(app.markup(), /id="field-deal-notes"/);
  app.keydown('m');
  assert.ok(app.focused().includes('#field-deal-notes'));
  assert.ok(app.focused().includes('scroll:#field-deal-notes'));
  const before = app.focused().length;
  app.keydown('m', { tagName: 'INPUT' });
  assert.equal(app.focused().length, before);
  app.keydown('m', { tagName: 'TEXTAREA' });
  assert.equal(app.focused().length, before);
});

test('keyboard d jumps to the Shared deal heading unless a field is focused', async () => {
  const app = await workbench();
  app.click('dismiss-coach');
  assert.match(app.markup(), /id="deal-inputs-title" tabindex="-1"/);
  assert.match(app.markup(), /<h2 id="deal-inputs-title" tabindex="-1">Shared deal<\/h2>/);
  assert.match(app.markup(), /Deal notes/);
  app.keydown('d');
  assert.ok(app.focused().includes('#deal-inputs-title'));
  assert.ok(app.focused().includes('scroll:#deal-inputs-title'));
  const before = app.focused().length;
  app.keydown('d', { tagName: 'INPUT' });
  assert.equal(app.focused().length, before);
  app.keydown('d', { tagName: 'TEXTAREA' });
  assert.equal(app.focused().length, before);
  app.edit('deal.monthlyVolume', '');
  app.keydown('d');
  assert.ok(app.focused().includes('#deal-inputs-title'));
});

test('keyboard t jumps to the tornado chart heading unless a field is focused', async () => {
  const app = await workbench();
  app.click('dismiss-coach');
  assert.match(app.markup(), /id="tornado-title" tabindex="-1"/);
  app.keydown('t');
  assert.ok(app.focused().includes('#tornado-title'));
  assert.ok(app.focused().includes('scroll:#tornado-title'));
  const before = app.focused().length;
  app.keydown('t', { tagName: 'INPUT' });
  assert.equal(app.focused().length, before);
  app.keydown('t', { tagName: 'TEXTAREA' });
  assert.equal(app.focused().length, before);
  app.edit('deal.monthlyVolume', '');
  app.keydown('t');
  assert.equal(app.focused().length, before);
  assert.doesNotMatch(app.markup(), /id="tornado-title"/);
});

test('keyboard h jumps to the least-headroom participant card unless a field is focused', async () => {
  const app = await workbench();
  app.click('dismiss-coach');
  assert.match(app.markup(), /id="least-headroom-participant" tabindex="-1"/);
  assert.match(app.markup(), /id="participant-inputs-title" tabindex="-1"/);
  app.keydown('h');
  assert.ok(app.focused().includes('#least-headroom-participant'));
  assert.ok(app.focused().includes('scroll:#least-headroom-participant'));
  const before = app.focused().length;
  app.keydown('h', { tagName: 'INPUT' });
  assert.equal(app.focused().length, before);
  app.keydown('h', { tagName: 'TEXTAREA' });
  assert.equal(app.focused().length, before);
  app.edit('deal.monthlyVolume', '');
  app.keydown('h');
  assert.ok(app.focused().includes('#participant-inputs-title'));
  assert.ok(app.focused().includes('scroll:#participant-inputs-title'));
  assert.doesNotMatch(app.markup(), /id="least-headroom-participant"/);
});

test('keyboard q jumps to Equal split or Normalize unless a field is focused', async () => {
  const app = await workbench();
  app.click('dismiss-coach');
  assert.match(app.markup(), /id="equal-split"/);
  assert.match(app.markup(), /id="normalize-shares"/);
  app.keydown('q');
  assert.ok(app.focused().includes('#equal-split'));
  assert.ok(app.focused().includes('scroll:#equal-split'));
  const before = app.focused().length;
  app.keydown('q', { tagName: 'INPUT' });
  assert.equal(app.focused().length, before);
  app.keydown('q', { tagName: 'TEXTAREA' });
  assert.equal(app.focused().length, before);
  app.edit('deal.monthlyVolume', '');
  app.keydown('q');
  assert.ok(app.focused().includes('#equal-split'));
  assert.ok(app.focused().includes('scroll:#equal-split'));
});

test('keyboard j copies capacity utilization as Markdown and ignores focused inputs', async () => {
  const fallback = await workbench();
  fallback.click('dismiss-coach');
  fallback.keydown('j');
  assert.equal(fallback.downloads().length, 0);
  assert.match(fallback.markup(), /id="utilization-copy-text"/);
  assert.match(fallback.markup(), /# Capacity utilization/);
  assert.match(fallback.markup(), /Platform \| 100,000 \/ 130,000 \(76\.9% of capacity\)/);
  assert.match(fallback.markup(), /not a probability/);
  assert.match(fallback.markup(), /not a forecast/);
  assert.match(fallback.notice(), /Copy the Markdown from the text area/);
  fallback.click('close-utilization-copy');
  assert.doesNotMatch(fallback.markup(), /id="utilization-copy-text"/);
  const before = fallback.markup();
  fallback.keydown('j', { tagName: 'INPUT' });
  assert.equal(fallback.markup(), before);
  fallback.keydown('j', { tagName: 'TEXTAREA' });
  assert.equal(fallback.markup(), before);
  fallback.edit('deal.monthlyVolume', '');
  fallback.keydown('j');
  assert.doesNotMatch(fallback.markup(), /id="utilization-copy-text"/);
  assert.match(fallback.notice(), /Resolve invalid inputs before copying capacity utilization/);

  const withClipboard = await workbench('file:', { clipboard: 'ok' });
  withClipboard.keydown('j');
  assert.equal(withClipboard.copied().length, 1);
  assert.match(withClipboard.copied()[0], /# Capacity utilization/);
  assert.match(withClipboard.copied()[0], /not a probability/);
  assert.match(withClipboard.copied()[0], /not a forecast/);
  assert.doesNotMatch(withClipboard.copied()[0], /forecast of/);
  assert.match(withClipboard.notice(), /copied as Markdown/);
  assert.match(withClipboard.notice(), /not a forecast/);
  const copied = withClipboard.copied().length;
  withClipboard.keydown('j', { tagName: 'INPUT' });
  assert.equal(withClipboard.copied().length, copied);
});

test('keyboard o jumps to the Operating region heading unless a field is focused', async () => {
  const app = await workbench();
  app.click('dismiss-coach');
  assert.match(app.markup(), /id="operating-region-title" tabindex="-1"/);
  app.keydown('o');
  assert.ok(app.focused().includes('#operating-region-title'));
  assert.ok(app.focused().includes('scroll:#operating-region-title'));
  const before = app.focused().length;
  app.keydown('o', { tagName: 'INPUT' });
  assert.equal(app.focused().length, before);
  app.keydown('o', { tagName: 'TEXTAREA' });
  assert.equal(app.focused().length, before);
  app.edit('deal.monthlyVolume', '');
  app.keydown('o');
  assert.equal(app.focused().length, before);
  assert.doesNotMatch(app.markup(), /id="operating-region-title"/);
});

test('keyboard x jumps to the first over-capacity roster row unless a field is focused', async () => {
  const app = await workbench();
  app.click('dismiss-coach');
  assert.match(app.markup(), /id="participant-inputs-title" tabindex="-1"/);
  assert.doesNotMatch(app.markup(), /id="over-capacity-participant"/);
  app.keydown('x');
  assert.ok(app.focused().includes('#participant-inputs-title'));
  assert.ok(app.focused().includes('scroll:#participant-inputs-title'));
  const before = app.focused().length;
  app.keydown('x', { tagName: 'INPUT' });
  assert.equal(app.focused().length, before);
  app.keydown('x', { tagName: 'TEXTAREA' });
  assert.equal(app.focused().length, before);
  app.edit('deal.monthlyVolume', '116000');
  assert.match(app.markup(), /id="over-capacity-participant" tabindex="-1"/);
  assert.match(app.markup(), /Participant 3: Liquidity Partner/);
  app.keydown('x');
  assert.ok(app.focused().includes('#over-capacity-participant'));
  assert.ok(app.focused().includes('scroll:#over-capacity-participant'));
  app.edit('deal.monthlyVolume', '');
  app.keydown('x');
  assert.ok(app.focused().includes('#participant-inputs-title'));
  assert.doesNotMatch(app.markup(), /id="over-capacity-participant"/);
});

test('keyboard y copies deal notes as one-line Markdown and ignores focused inputs', async () => {
  const fallback = await workbench();
  fallback.click('dismiss-coach');
  fallback.keydown('y');
  assert.equal(fallback.downloads().length, 0);
  assert.match(fallback.markup(), /id="notes-copy-text"/);
  assert.match(fallback.markup(), /Deal notes: none entered\./);
  assert.doesNotMatch(fallback.markup(), /# Deal notes/);
  assert.match(fallback.markup(), /not a forecast/);
  assert.match(fallback.notice(), /Copy the Markdown from the text area/);
  fallback.click('close-notes-copy');
  assert.doesNotMatch(fallback.markup(), /id="notes-copy-text"/);
  const before = fallback.markup();
  fallback.keydown('y', { tagName: 'INPUT' });
  assert.equal(fallback.markup(), before);
  fallback.keydown('y', { tagName: 'TEXTAREA' });
  assert.equal(fallback.markup(), before);
  fallback.edit('deal.notes', '  Review the capacity clause.  ', { type: 'text', optional: 'true' });
  fallback.keydown('y');
  assert.match(fallback.markup(), /Deal notes: Review the capacity clause\./);
  assert.doesNotMatch(fallback.markup(), /Deal notes: none entered\./);
  assert.doesNotMatch(fallback.markup(), /# Deal notes/);
  fallback.click('close-notes-copy');

  const withClipboard = await workbench('file:', { clipboard: 'ok' });
  withClipboard.keydown('y');
  assert.equal(withClipboard.copied().length, 1);
  assert.equal(withClipboard.copied()[0].split('\n').length, 1);
  assert.equal(withClipboard.copied()[0], 'Deal notes: none entered.');
  assert.match(withClipboard.notice(), /one-line Markdown/);
  assert.match(withClipboard.notice(), /not a forecast/);
  withClipboard.edit('deal.notes', 'Harbor counterparty wants a 90-day review.', { type: 'text', optional: 'true' });
  withClipboard.keydown('y');
  assert.equal(withClipboard.copied()[1], 'Deal notes: Harbor counterparty wants a 90-day review.');
  const copied = withClipboard.copied().length;
  withClipboard.keydown('y', { tagName: 'INPUT' });
  assert.equal(withClipboard.copied().length, copied);

  const denied = await workbench('file:', { clipboard: 'fail' });
  denied.edit('deal.notes', 'Keep the fee floor in view.', { type: 'text', optional: 'true' });
  denied.keydown('y');
  assert.match(denied.markup(), /id="notes-copy-text"/);
  assert.match(denied.markup(), /Deal notes: Keep the fee floor in view\./);
  assert.match(denied.notice(), /Clipboard unavailable/);
});

test('keyboard comma copies the first-breakpoint participant label through the same control', async () => {
  const fallback = await workbench();
  fallback.click('dismiss-coach');
  fallback.keydown(',');
  assert.equal(fallback.downloads().length, 0);
  assert.match(fallback.markup(), /id="breakpoint-label-copy-text"/);
  assert.match(fallback.markup(), /First-breakpoint participant: Liquidity Partner\. Synthetic ranking, not a forecast\./);
  assert.match(fallback.markup(), /id="breakpoint-label-copy-title">First-breakpoint participant label Markdown/);
  assert.doesNotMatch(fallback.markup(), /id="utilization-copy-text"/);
  assert.doesNotMatch(fallback.markup(), /id="allocation-copy-text"/);
  assert.match(fallback.notice(), /Copy the Markdown from the text area/);
  fallback.click('close-breakpoint-label-copy');
  assert.doesNotMatch(fallback.markup(), /id="breakpoint-label-copy-text"/);
  const before = fallback.markup();
  fallback.keydown(',', { tagName: 'INPUT' });
  assert.equal(fallback.markup(), before);
  fallback.keydown(',', { tagName: 'TEXTAREA' });
  assert.equal(fallback.markup(), before);
  fallback.edit('deal.monthlyVolume', '');
  fallback.keydown(',');
  assert.doesNotMatch(fallback.markup(), /id="breakpoint-label-copy-text"/);
  assert.match(fallback.notice(), /Resolve invalid inputs before copying the first-breakpoint participant label/);

  const withClipboard = await workbench('file:', { clipboard: 'ok' });
  withClipboard.keydown(',');
  assert.equal(withClipboard.copied().length, 1);
  assert.equal(withClipboard.copied()[0].split('\n').length, 1);
  assert.equal(withClipboard.copied()[0], 'First-breakpoint participant: Liquidity Partner. Synthetic ranking, not a forecast.');
  assert.doesNotMatch(withClipboard.copied()[0], /probab/i);
  assert.match(withClipboard.notice(), /copied as Markdown/);
  assert.match(withClipboard.notice(), /not a forecast/);
  const copied = withClipboard.copied().length;
  withClipboard.keydown(',', { tagName: 'INPUT' });
  assert.equal(withClipboard.copied().length, copied);

  const denied = await workbench('file:', { clipboard: 'fail' });
  denied.keydown(',');
  assert.match(denied.markup(), /id="breakpoint-label-copy-text"/);
  assert.match(denied.notice(), /Clipboard unavailable/);
});

test('keyboard period jumps to Copy first-breakpoint participant label unless a field is focused', async () => {
  const app = await workbench();
  app.click('dismiss-coach');
  assert.match(app.markup(), /id="copy-first-breakpoint-label"/);
  assert.match(app.markup(), /id="first-breakpoint-title" tabindex="-1"/);
  app.keydown('.');
  assert.ok(app.focused().includes('#copy-first-breakpoint-label'));
  assert.ok(app.focused().includes('scroll:#copy-first-breakpoint-label'));
  const before = app.focused().length;
  app.keydown('.', { tagName: 'INPUT' });
  assert.equal(app.focused().length, before);
  app.keydown('.', { tagName: 'TEXTAREA' });
  assert.equal(app.focused().length, before);
  app.edit('deal.monthlyVolume', '');
  app.keydown('.');
  assert.equal(app.focused().length, before);
  assert.doesNotMatch(app.markup(), /id="copy-first-breakpoint-label"/);
  assert.doesNotMatch(app.markup(), /id="first-breakpoint-title"/);
});

test('keyboard slash jumps to Copy deal title and currency while Shift+/ stays help', async () => {
  const app = await workbench();
  app.click('dismiss-coach');
  assert.match(app.markup(), /id="copy-deal-title"/);
  assert.match(app.markup(), /id="deal-inputs-title" tabindex="-1"/);
  app.keydown('/');
  assert.ok(app.focused().includes('#copy-deal-title'));
  assert.ok(app.focused().includes('scroll:#copy-deal-title'));
  const before = app.focused().length;
  app.keydown('/', { tagName: 'INPUT' });
  assert.equal(app.focused().length, before);
  app.keydown('/', { tagName: 'TEXTAREA' });
  assert.equal(app.focused().length, before);
  app.edit('deal.monthlyVolume', '');
  app.keydown('/');
  assert.ok(app.focused().includes('#copy-deal-title'));
  assert.ok(app.focused().includes('scroll:#copy-deal-title'));
  app.keydown('/', { shiftKey: true });
  assert.match(app.markup(), /id="help-title">Keyboard shortcuts/);
  app.keydown('Escape');
  assert.doesNotMatch(app.markup(), /id="help-title">Keyboard shortcuts/);
  app.keydown('?');
  assert.match(app.markup(), /id="help-title">Keyboard shortcuts/);
});

test('keyboard semicolon copies the least-headroom participant label through the same control', async () => {
  const fallback = await workbench();
  fallback.click('dismiss-coach');
  fallback.keydown(';');
  assert.equal(fallback.downloads().length, 0);
  assert.match(fallback.markup(), /id="viability-label-copy-text"/);
  assert.match(fallback.markup(), /Least-headroom participant: Liquidity Partner\. Volume-headroom ranking, not a forecast\./);
  assert.match(fallback.markup(), /id="viability-label-copy-title">Least-headroom participant label Markdown/);
  assert.doesNotMatch(fallback.markup(), /id="breakpoint-label-copy-text"/);
  assert.match(fallback.notice(), /Copy the Markdown from the text area/);
  fallback.click('close-viability-label-copy');
  assert.doesNotMatch(fallback.markup(), /id="viability-label-copy-text"/);
  const before = fallback.markup();
  fallback.keydown(';', { tagName: 'INPUT' });
  assert.equal(fallback.markup(), before);
  fallback.keydown(';', { tagName: 'TEXTAREA' });
  assert.equal(fallback.markup(), before);
  fallback.edit('deal.monthlyVolume', '');
  fallback.keydown(';');
  assert.match(fallback.markup(), /id="viability-label-copy-text"/);
  assert.match(fallback.markup(), />Least-headroom participant: none entered\.</);

  const withClipboard = await workbench('file:', { clipboard: 'ok' });
  withClipboard.keydown(';');
  assert.equal(withClipboard.copied().length, 1);
  assert.equal(withClipboard.copied()[0].split('\n').length, 1);
  assert.equal(withClipboard.copied()[0], 'Least-headroom participant: Liquidity Partner. Volume-headroom ranking, not a forecast.');
  assert.doesNotMatch(withClipboard.copied()[0], /First-breakpoint participant/);
  assert.doesNotMatch(withClipboard.copied()[0], /probab/i);
  assert.match(withClipboard.notice(), /copied as Markdown/);
  assert.match(withClipboard.notice(), /not a forecast/);
  const copied = withClipboard.copied().length;
  withClipboard.keydown(';', { tagName: 'INPUT' });
  assert.equal(withClipboard.copied().length, copied);

  const denied = await workbench('file:', { clipboard: 'fail' });
  denied.keydown(';');
  assert.match(denied.markup(), /id="viability-label-copy-text"/);
  assert.match(denied.notice(), /Clipboard unavailable/);
});

test('keyboard [ jumps to Copy least-headroom participant label unless a field is focused', async () => {
  const app = await workbench();
  app.click('dismiss-coach');
  assert.match(app.markup(), /id="copy-viability-label"/);
  assert.match(app.markup(), /id="first-breakpoint-title" tabindex="-1"/);
  app.keydown('[');
  assert.ok(app.focused().includes('#copy-viability-label'));
  assert.ok(app.focused().includes('scroll:#copy-viability-label'));
  const before = app.focused().length;
  app.keydown('[', { tagName: 'INPUT' });
  assert.equal(app.focused().length, before);
  app.keydown('[', { tagName: 'TEXTAREA' });
  assert.equal(app.focused().length, before);
  app.edit('deal.monthlyVolume', '');
  app.keydown('[');
  assert.ok(app.focused().includes('#results-start'));
  assert.ok(app.focused().includes('scroll:#results-start'));
  assert.doesNotMatch(app.markup(), /id="copy-viability-label"/);
  assert.doesNotMatch(app.markup(), /id="first-breakpoint-title"/);
});

test('keyboard ] jumps to Print one-pager unless a field is focused', async () => {
  const app = await workbench();
  app.click('dismiss-coach');
  assert.match(app.markup(), /id="print-report"/);
  assert.match(app.markup(), /id="print-one-pager-title" tabindex="-1"/);
  app.keydown(']');
  assert.ok(app.focused().includes('#print-report'));
  assert.ok(app.focused().includes('scroll:#print-report'));
  const before = app.focused().length;
  app.keydown(']', { tagName: 'INPUT' });
  assert.equal(app.focused().length, before);
  app.keydown(']', { tagName: 'TEXTAREA' });
  assert.equal(app.focused().length, before);
  app.edit('deal.monthlyVolume', '');
  app.keydown(']');
  assert.ok(app.focused().includes('#print-report'));
  assert.ok(app.focused().includes('scroll:#print-report'));
});

test('keyboard apostrophe copies first-breakpoint remaining-to-hold through the same control', async () => {
  const fallback = await workbench();
  fallback.click('dismiss-coach');
  fallback.keydown("'");
  assert.equal(fallback.downloads().length, 0);
  assert.match(fallback.markup(), /id="remaining-copy-text"/);
  assert.match(fallback.markup(), /First-breakpoint remaining-to-hold: 0\.0% share for Liquidity Partner\. Synthetic ranking, not a forecast\./);
  assert.match(fallback.markup(), /id="remaining-copy-title">First-breakpoint remaining-to-hold Markdown/);
  assert.doesNotMatch(fallback.markup(), /id="breakpoint-label-copy-text"/);
  assert.doesNotMatch(fallback.markup(), /id="viability-label-copy-text"/);
  assert.match(fallback.notice(), /Copy the Markdown from the text area/);
  fallback.click('close-remaining-copy');
  assert.doesNotMatch(fallback.markup(), /id="remaining-copy-text"/);
  const before = fallback.markup();
  fallback.keydown("'", { tagName: 'INPUT' });
  assert.equal(fallback.markup(), before);
  fallback.keydown("'", { tagName: 'TEXTAREA' });
  assert.equal(fallback.markup(), before);
  fallback.edit('deal.monthlyVolume', '');
  fallback.keydown("'");
  assert.match(fallback.markup(), /id="remaining-copy-text"/);
  assert.match(fallback.markup(), />First-breakpoint remaining-to-hold: none entered\.</);

  const withClipboard = await workbench('file:', { clipboard: 'ok' });
  withClipboard.keydown("'");
  assert.equal(withClipboard.copied().length, 1);
  assert.equal(withClipboard.copied()[0].split('\n').length, 1);
  assert.equal(withClipboard.copied()[0], 'First-breakpoint remaining-to-hold: 0.0% share for Liquidity Partner. Synthetic ranking, not a forecast.');
  assert.doesNotMatch(withClipboard.copied()[0], /First-breakpoint participant: Liquidity Partner/);
  assert.doesNotMatch(withClipboard.copied()[0], /Least-headroom participant/);
  assert.doesNotMatch(withClipboard.copied()[0], /probab/i);
  assert.match(withClipboard.notice(), /copied as Markdown/);
  assert.match(withClipboard.notice(), /not a forecast/);
  const copied = withClipboard.copied().length;
  withClipboard.keydown("'", { tagName: 'INPUT' });
  assert.equal(withClipboard.copied().length, copied);

  const denied = await workbench('file:', { clipboard: 'fail' });
  denied.keydown("'");
  assert.match(denied.markup(), /id="remaining-copy-text"/);
  assert.match(denied.notice(), /Clipboard unavailable/);
});

test('keyboard colon copies first-breakpoint volume-to-hold through the same control', async () => {
  const fallback = await workbench();
  fallback.click('dismiss-coach');
  fallback.keydown(':');
  assert.equal(fallback.downloads().length, 0);
  assert.match(fallback.markup(), /id="volume-copy-text"/);
  assert.match(fallback.markup(), /First-breakpoint volume-to-hold: 90,000 txn for Liquidity Partner\. Synthetic ranking, not a forecast\./);
  assert.match(fallback.markup(), /id="volume-copy-title">First-breakpoint volume-to-hold Markdown/);
  assert.doesNotMatch(fallback.markup(), /id="remaining-copy-text"/);
  assert.doesNotMatch(fallback.markup(), /id="breakpoint-label-copy-text"/);
  assert.doesNotMatch(fallback.markup(), /id="viability-label-copy-text"/);
  assert.match(fallback.notice(), /Copy the Markdown from the text area/);
  fallback.click('close-volume-copy');
  assert.doesNotMatch(fallback.markup(), /id="volume-copy-text"/);
  const before = fallback.markup();
  fallback.keydown(':', { tagName: 'INPUT' });
  assert.equal(fallback.markup(), before);
  fallback.keydown(':', { tagName: 'TEXTAREA' });
  assert.equal(fallback.markup(), before);
  fallback.edit('deal.monthlyVolume', '');
  fallback.keydown(':');
  assert.match(fallback.markup(), /id="volume-copy-text"/);
  assert.match(fallback.markup(), />First-breakpoint volume-to-hold: none entered\.</);

  const withClipboard = await workbench('file:', { clipboard: 'ok' });
  withClipboard.keydown(':');
  assert.equal(withClipboard.copied().length, 1);
  assert.equal(withClipboard.copied()[0].split('\n').length, 1);
  assert.equal(withClipboard.copied()[0], 'First-breakpoint volume-to-hold: 90,000 txn for Liquidity Partner. Synthetic ranking, not a forecast.');
  assert.doesNotMatch(withClipboard.copied()[0], /First-breakpoint remaining-to-hold/);
  assert.doesNotMatch(withClipboard.copied()[0], /First-breakpoint participant: Liquidity Partner/);
  assert.doesNotMatch(withClipboard.copied()[0], /Least-headroom participant/);
  assert.doesNotMatch(withClipboard.copied()[0], /probab/i);
  assert.match(withClipboard.notice(), /copied as Markdown/);
  assert.match(withClipboard.notice(), /not a forecast/);
  const copied = withClipboard.copied().length;
  withClipboard.keydown(':', { tagName: 'INPUT' });
  assert.equal(withClipboard.copied().length, copied);

  const denied = await workbench('file:', { clipboard: 'fail' });
  denied.keydown(':');
  assert.match(denied.markup(), /id="volume-copy-text"/);
  assert.match(denied.notice(), /Clipboard unavailable/);
});

test('keyboard < jumps to Copy first-breakpoint remaining-to-hold unless a field is focused', async () => {
  const app = await workbench();
  app.click('dismiss-coach');
  assert.match(app.markup(), /id="copy-first-breakpoint-remaining"/);
  assert.match(app.markup(), /id="first-breakpoint-title" tabindex="-1"/);
  app.keydown('<');
  assert.ok(app.focused().includes('#copy-first-breakpoint-remaining'));
  assert.ok(app.focused().includes('scroll:#copy-first-breakpoint-remaining'));
  const before = app.focused().length;
  app.keydown('<', { tagName: 'INPUT' });
  assert.equal(app.focused().length, before);
  app.keydown('<', { tagName: 'TEXTAREA' });
  assert.equal(app.focused().length, before);
  app.edit('deal.monthlyVolume', '');
  app.keydown('<');
  assert.equal(app.focused().length, before);
  assert.doesNotMatch(app.markup(), /id="copy-first-breakpoint-remaining"/);
  assert.doesNotMatch(app.markup(), /id="first-breakpoint-title"/);
});

test('keyboard > jumps to Hide unused listed capacity unless a field is focused', async () => {
  const app = await workbench();
  app.click('dismiss-coach');
  assert.match(app.markup(), /data-action="hide-spare-capacity-participants"/);
  assert.match(app.markup(), /id="participant-inputs-title" tabindex="-1"/);
  app.keydown('>');
  assert.ok(app.focused().includes('[data-action="hide-spare-capacity-participants"]'));
  assert.ok(app.focused().includes('scroll:[data-action="hide-spare-capacity-participants"]'));
  const before = app.focused().length;
  app.keydown('>', { tagName: 'INPUT' });
  assert.equal(app.focused().length, before);
  app.keydown('>', { tagName: 'TEXTAREA' });
  assert.equal(app.focused().length, before);
  app.edit('deal.monthlyVolume', '');
  app.keydown('>');
  assert.ok(app.focused().includes('[data-action="hide-spare-capacity-participants"]'));
  assert.ok(app.focused().includes('scroll:[data-action="hide-spare-capacity-participants"]'));
});

test('keyboard - jumps to Copy first-breakpoint volume-to-hold unless a field is focused', async () => {
  const app = await workbench();
  app.click('dismiss-coach');
  assert.match(app.markup(), /id="copy-first-breakpoint-volume"/);
  assert.match(app.markup(), /id="first-breakpoint-title" tabindex="-1"/);
  app.keydown('-');
  assert.ok(app.focused().includes('#copy-first-breakpoint-volume'));
  assert.ok(app.focused().includes('scroll:#copy-first-breakpoint-volume'));
  const before = app.focused().length;
  app.keydown('-', { tagName: 'INPUT' });
  assert.equal(app.focused().length, before);
  app.keydown('-', { tagName: 'TEXTAREA' });
  assert.equal(app.focused().length, before);
  app.edit('deal.monthlyVolume', '');
  app.keydown('-');
  assert.equal(app.focused().length, before);
  assert.doesNotMatch(app.markup(), /id="copy-first-breakpoint-volume"/);
  assert.doesNotMatch(app.markup(), /id="first-breakpoint-title"/);
});

test('keyboard = jumps to Hide the least-headroom participant unless a field is focused', async () => {
  const app = await workbench();
  app.click('dismiss-coach');
  assert.match(app.markup(), /data-action="hide-least-headroom-participants"/);
  assert.match(app.markup(), /id="participant-inputs-title" tabindex="-1"/);
  app.keydown('=');
  assert.ok(app.focused().includes('[data-action="hide-least-headroom-participants"]'));
  assert.ok(app.focused().includes('scroll:[data-action="hide-least-headroom-participants"]'));
  const before = app.focused().length;
  app.keydown('=', { tagName: 'INPUT' });
  assert.equal(app.focused().length, before);
  app.keydown('=', { tagName: 'TEXTAREA' });
  assert.equal(app.focused().length, before);
  app.edit('deal.monthlyVolume', '');
  app.keydown('=');
  assert.ok(app.focused().includes('[data-action="hide-least-headroom-participants"]'));
  assert.ok(app.focused().includes('scroll:[data-action="hide-least-headroom-participants"]'));
});

test('keyboard z jumps to Copy deal title and currency unless a field is focused', async () => {
  const app = await workbench();
  app.click('dismiss-coach');
  assert.match(app.markup(), /id="copy-deal-title"/);
  assert.match(app.markup(), /id="deal-inputs-title" tabindex="-1"/);
  app.keydown('z');
  assert.ok(app.focused().includes('#copy-deal-title'));
  assert.ok(app.focused().includes('scroll:#copy-deal-title'));
  const before = app.focused().length;
  app.keydown('z', { tagName: 'INPUT' });
  assert.equal(app.focused().length, before);
  app.keydown('z', { tagName: 'TEXTAREA' });
  assert.equal(app.focused().length, before);
  app.edit('deal.monthlyVolume', '');
  app.keydown('z');
  assert.ok(app.focused().includes('#copy-deal-title'));
  assert.ok(app.focused().includes('scroll:#copy-deal-title'));
});

test('keyboard i jumps to inspect or compare cases unless a field is focused', async () => {
  const app = await workbench();
  app.click('dismiss-coach');
  assert.match(app.markup(), /id="inspect-cases-title" tabindex="-1"/);
  app.keydown('i');
  assert.ok(app.focused().includes('#inspect-cases-title'));
  assert.ok(app.focused().includes('scroll:#inspect-cases-title'));
  const before = app.focused().length;
  app.keydown('i', { tagName: 'INPUT' });
  assert.equal(app.focused().length, before);
  app.keydown('i', { tagName: 'TEXTAREA' });
  assert.equal(app.focused().length, before);
  app.edit('deal.monthlyVolume', '');
  app.keydown('i');
  assert.equal(app.focused().length, before);
  assert.doesNotMatch(app.markup(), /id="inspect-cases-title"/);
  const other = clonePreset('balanced');
  other.participants[0].fixedMonthlyCost = 1900;
  app.compareImport(other, undefined, false, { name: 'alt.json' });
  app.keydown('i');
  assert.ok(app.focused().includes('#imported-compare-title'));
  assert.ok(app.focused().includes('scroll:#imported-compare-title'));
});

test('keyboard w jumps to the Contribution waterfall heading unless a field is focused', async () => {
  const app = await workbench();
  app.click('dismiss-coach');
  assert.match(app.markup(), /id="waterfall-title" tabindex="-1"/);
  app.keydown('w');
  assert.ok(app.focused().includes('#waterfall-title'));
  assert.ok(app.focused().includes('scroll:#waterfall-title'));
  const before = app.focused().length;
  app.keydown('w', { tagName: 'INPUT' });
  assert.equal(app.focused().length, before);
  app.keydown('w', { tagName: 'TEXTAREA' });
  assert.equal(app.focused().length, before);
  app.edit('deal.monthlyVolume', '');
  app.keydown('w');
  assert.equal(app.focused().length, before);
  assert.doesNotMatch(app.markup(), /id="waterfall-title"/);
});

test('copy capacity utilization uses volume over capacity Markdown or Unbounded', async () => {
  const fallback = await workbench();
  fallback.click('dismiss-coach');
  assert.match(fallback.markup(), /data-action="copy-utilization"/);
  fallback.click('copy-utilization');
  assert.equal(fallback.downloads().length, 0);
  assert.match(fallback.markup(), /id="utilization-copy-text"/);
  assert.match(fallback.markup(), /Participant \| Capacity use/);
  assert.match(fallback.markup(), /Platform \| 100,000 \/ 130,000 \(76\.9% of capacity\)/);
  assert.match(fallback.markup(), /Distributor \| 100,000 \/ 120,000 \(83\.3% of capacity\)/);
  assert.match(fallback.markup(), /Liquidity Partner \| 100,000 \/ 115,000 \(87\.0% of capacity\)/);
  assert.match(fallback.markup(), /not a probability/);
  assert.match(fallback.notice(), /Copy the Markdown from the text area/);
  fallback.click('close-utilization-copy');
  assert.doesNotMatch(fallback.markup(), /id="utilization-copy-text"/);
  fallback.edit('deal.monthlyVolume', '');
  fallback.click('copy-utilization');
  assert.doesNotMatch(fallback.markup(), /id="utilization-copy-text"/);
  assert.match(fallback.notice(), /Resolve invalid inputs before copying capacity utilization/);

  const withClipboard = await workbench('file:', { clipboard: 'ok' });
  withClipboard.click('copy-utilization');
  assert.equal(withClipboard.copied().length, 1);
  assert.match(withClipboard.copied()[0], /# Capacity utilization/);
  assert.match(withClipboard.copied()[0], /Platform \| 100,000 \/ 130,000 \(76\.9% of capacity\)/);
  assert.match(withClipboard.copied()[0], /not a probability/);
  assert.doesNotMatch(withClipboard.copied()[0], /forecast of/);
  assert.match(withClipboard.notice(), /copied as Markdown/);
  assert.doesNotMatch(withClipboard.markup(), /id="utilization-copy-text"/);

  const unbounded = await workbench('file:', { clipboard: 'ok' });
  unbounded.click('preset', { preset: 'talentAgentPlatform' });
  unbounded.click('copy-utilization');
  assert.match(unbounded.copied()[1] ?? unbounded.copied()[0], /Talent \| Unbounded/);
  assert.match(unbounded.copied().at(-1), /Booking agent \| 7,500 \/ 10,000/);
  assert.match(unbounded.copied().at(-1), /Platform \| 7,500 \/ 12,000/);

  const denied = await workbench('file:', { clipboard: 'fail' });
  denied.click('copy-utilization');
  assert.match(denied.markup(), /id="utilization-copy-text"/);
  assert.match(denied.notice(), /Clipboard unavailable/);
});

test('copy viability card uses participant, headroom, and binding limit Markdown', async () => {
  const fallback = await workbench();
  fallback.click('dismiss-coach');
  assert.match(fallback.markup(), /data-action="copy-viability"/);
  fallback.click('copy-viability');
  assert.equal(fallback.downloads().length, 0);
  assert.match(fallback.markup(), /id="viability-copy-text"/);
  assert.match(fallback.markup(), /Participant: Liquidity Partner/);
  assert.match(fallback.markup(), /Headroom: 10,000 txn/);
  assert.match(fallback.markup(), /Binding limit: minimum acceptable profit/);
  assert.match(fallback.markup(), /Counts are counts/);
  assert.match(fallback.markup(), /not a probability/);
  assert.match(fallback.notice(), /Copy the Markdown from the text area/);
  fallback.click('close-viability-copy');
  assert.doesNotMatch(fallback.markup(), /id="viability-copy-text"/);
  fallback.edit('deal.monthlyVolume', '');
  fallback.click('copy-viability');
  assert.doesNotMatch(fallback.markup(), /id="viability-copy-text"/);
  assert.match(fallback.notice(), /Resolve invalid inputs before copying the viability card/);

  const withClipboard = await workbench('file:', { clipboard: 'ok' });
  withClipboard.click('copy-viability');
  assert.equal(withClipboard.copied().length, 1);
  assert.match(withClipboard.copied()[0], /# Viability and binding limit/);
  assert.match(withClipboard.copied()[0], /Participant: Liquidity Partner/);
  assert.match(withClipboard.copied()[0], /Headroom: 10,000 txn/);
  assert.match(withClipboard.copied()[0], /Binding limit: minimum acceptable profit/);
  assert.match(withClipboard.copied()[0], /Counts are counts/);
  assert.match(withClipboard.copied()[0], /not a probability/);
  assert.match(withClipboard.notice(), /copied as Markdown/);
  assert.doesNotMatch(withClipboard.markup(), /id="viability-copy-text"/);

  const denied = await workbench('file:', { clipboard: 'fail' });
  denied.click('copy-viability');
  assert.match(denied.markup(), /id="viability-copy-text"/);
  assert.match(denied.notice(), /Clipboard unavailable/);
});

test('copy tested split copies hold counts and whether a fixed split is available', async () => {
  const fallback = await workbench();
  fallback.click('dismiss-coach');
  assert.match(fallback.markup(), /data-action="copy-tested-split"/);
  fallback.click('copy-tested-split');
  assert.equal(fallback.downloads().length, 0);
  assert.match(fallback.markup(), /id="split-copy-text"/);
  assert.match(fallback.markup(), /# Tested split/);
  assert.match(fallback.markup(), /Cases held: 1 of 27/);
  assert.match(fallback.markup(), /Fixed split available: no/);
  assert.match(fallback.markup(), /Platform \| 11 \/ 27/);
  assert.match(fallback.markup(), /Distributor \| 6 \/ 27/);
  assert.match(fallback.markup(), /Liquidity Partner \| 1 \/ 27/);
  assert.match(fallback.markup(), /Counts are counts/);
  assert.match(fallback.markup(), /not a probability/);
  assert.match(fallback.notice(), /Copy the Markdown from the text area/);
  fallback.click('close-split-copy');
  assert.doesNotMatch(fallback.markup(), /id="split-copy-text"/);
  fallback.edit('deal.monthlyVolume', '');
  fallback.click('copy-tested-split');
  assert.doesNotMatch(fallback.markup(), /id="split-copy-text"/);
  assert.match(fallback.notice(), /Resolve invalid inputs before copying the tested split/);

  const withClipboard = await workbench('file:', { clipboard: 'ok' });
  withClipboard.click('copy-tested-split');
  assert.equal(withClipboard.copied().length, 1);
  assert.match(withClipboard.copied()[0], /# Tested split/);
  assert.match(withClipboard.copied()[0], /Cases held: 1 of 27/);
  assert.match(withClipboard.copied()[0], /Fixed split available: no/);
  assert.match(withClipboard.copied()[0], /Counts are counts/);
  assert.match(withClipboard.copied()[0], /not a probability/);
  assert.doesNotMatch(withClipboard.copied()[0], /likelihood/i);
  assert.match(withClipboard.notice(), /copied as Markdown/);
  assert.doesNotMatch(withClipboard.markup(), /id="split-copy-text"/);

  const denied = await workbench('file:', { clipboard: 'fail' });
  denied.click('copy-tested-split');
  assert.match(denied.markup(), /id="split-copy-text"/);
  assert.match(denied.notice(), /Clipboard unavailable/);

  const feasible = await workbench();
  feasible.click('dismiss-coach');
  feasible.edit('stress.volumeDropPct', '5');
  feasible.edit('stress.volumeGrowthPct', '0');
  feasible.edit('stress.feeDropPct', '0');
  feasible.edit('stress.variableCostRisePct', '0');
  feasible.click('copy-tested-split');
  assert.match(feasible.markup(), /Cases held: 2 of 2/);
  assert.match(feasible.markup(), /Fixed split available: yes/);
});

test('copy operating region copies the fee and volume sensitivity grid as Markdown', async () => {
  const fallback = await workbench();
  fallback.click('dismiss-coach');
  assert.match(fallback.markup(), /data-action="copy-operating-region"/);
  fallback.click('copy-operating-region');
  assert.equal(fallback.downloads().length, 0);
  assert.match(fallback.markup(), /id="operating-copy-text"/);
  assert.match(fallback.markup(), /# Operating region/);
  assert.match(fallback.markup(), /Fee and volume sensitivity\. Display only\./);
  assert.match(fallback.markup(), /Holds cells: [0-9]+ of 49/);
  assert.match(fallback.markup(), /Exit cells: [0-9]+ of 49/);
  assert.match(fallback.markup(), /Fee \/ volume/);
  assert.match(fallback.markup(), /Holds/);
  assert.match(fallback.markup(), /Exit/);
  assert.match(fallback.markup(), /not a forecast/);
  assert.match(fallback.notice(), /Copy the Markdown from the text area/);
  fallback.click('close-operating-copy');
  assert.doesNotMatch(fallback.markup(), /id="operating-copy-text"/);
  fallback.edit('deal.monthlyVolume', '');
  fallback.click('copy-operating-region');
  assert.doesNotMatch(fallback.markup(), /id="operating-copy-text"/);
  assert.match(fallback.notice(), /Resolve invalid inputs before copying the operating region/);

  const withClipboard = await workbench('file:', { clipboard: 'ok' });
  withClipboard.click('copy-operating-region');
  assert.equal(withClipboard.copied().length, 1);
  assert.match(withClipboard.copied()[0], /# Operating region/);
  assert.match(withClipboard.copied()[0], /Display only/);
  assert.match(withClipboard.copied()[0], /Holds cells:/);
  assert.doesNotMatch(withClipboard.copied()[0], /probab/i);
  assert.match(withClipboard.notice(), /copied as Markdown/);
  assert.match(withClipboard.notice(), /Display only/);
  assert.doesNotMatch(withClipboard.markup(), /id="operating-copy-text"/);

  const denied = await workbench('file:', { clipboard: 'fail' });
  denied.click('copy-operating-region');
  assert.match(denied.markup(), /id="operating-copy-text"/);
  assert.match(denied.notice(), /Clipboard unavailable/);
});

test('hiding unbounded tornado shocks is display-only and restore shows all', async () => {
  const app = await workbench();
  app.click('dismiss-coach');
  assert.match(app.markup(), /data-action="hide-unbounded-tornado"/);
  assert.match(app.markup(), /1 of 27 tested cases hold/);
  app.click('preset', { preset: 'talentAgentPlatform' });
  const before = app.markup();
  assert.match(before, /Talent \/ Volume up/);
  assert.match(before, /No bounded shock/);
  assert.match(before, /27 of 27 tested cases hold/);
  const shockSection = before.slice(before.indexOf('Smallest adverse shock by participant'));
  assert.match(shockSection, /Volume increase/);
  app.click('hide-unbounded-tornado');
  const filtered = app.markup();
  const tornadoAt = filtered.indexOf('id="tornado-title"');
  const tornadoEnd = filtered.indexOf('Smallest adverse shock by participant');
  const tornado = filtered.slice(tornadoAt, tornadoEnd);
  assert.doesNotMatch(tornado, /Talent \/ Volume up/);
  assert.doesNotMatch(tornado, /No bounded shock/);
  assert.match(filtered, /unbounded or impossible shocks are hidden from this tornado display/);
  assert.match(filtered, /Model math is unchanged/);
  assert.match(filtered, /27 of 27 tested cases hold/);
  const shockAfter = filtered.slice(filtered.indexOf('Smallest adverse shock by participant'));
  assert.match(shockAfter, /Volume increase/);
  app.click('copy-tornado');
  assert.doesNotMatch(app.markup(), /Talent \| volume increase \| Unbounded/);
  app.click('close-tornado-copy');
  app.click('show-unbounded-tornado');
  assert.match(app.markup(), /Talent \/ Volume up/);
  assert.match(app.markup(), /No bounded shock/);
  app.edit('deal.monthlyVolume', '');
  app.click('hide-unbounded-tornado');
  assert.match(app.notice(), /Resolve invalid inputs before hiding unbounded tornado shocks/);
});

test('copy tornado uses participant, shock axis, and bounded percentage Markdown', async () => {
  const fallback = await workbench();
  fallback.click('dismiss-coach');
  assert.match(fallback.markup(), /data-action="copy-tornado"/);
  fallback.click('copy-tornado');
  assert.equal(fallback.downloads().length, 0);
  assert.match(fallback.markup(), /id="tornado-copy-text"/);
  assert.match(fallback.markup(), /Participant \| Shock axis \| Bounded percentage/);
  assert.match(fallback.markup(), /Platform \| volume decrease \| 17\.5%/);
  assert.match(fallback.markup(), /Platform \| volume increase \| 30\.0%/);
  assert.match(fallback.markup(), /Liquidity Partner \| fee decrease \| 4\.0%/);
  assert.match(fallback.markup(), /not a forecast/);
  assert.match(fallback.notice(), /Copy the Markdown from the text area/);
  fallback.click('close-tornado-copy');
  assert.doesNotMatch(fallback.markup(), /id="tornado-copy-text"/);
  fallback.edit('deal.monthlyVolume', '');
  fallback.click('copy-tornado');
  assert.doesNotMatch(fallback.markup(), /id="tornado-copy-text"/);
  assert.match(fallback.notice(), /Resolve invalid inputs before copying the tornado chart/);

  const withClipboard = await workbench('file:', { clipboard: 'ok' });
  withClipboard.click('copy-tornado');
  assert.equal(withClipboard.copied().length, 1);
  assert.match(withClipboard.copied()[0], /# Adverse-shock tornado/);
  assert.match(withClipboard.copied()[0], /Platform \| volume decrease \| 17\.5%/);
  assert.match(withClipboard.copied()[0], /Distributor \| volume increase \| 20\.0%/);
  assert.match(withClipboard.copied()[0], /not a forecast/);
  assert.doesNotMatch(withClipboard.copied()[0], /probab/i);
  assert.match(withClipboard.notice(), /copied as Markdown/);
  assert.match(withClipboard.notice(), /not a forecast/);
  assert.doesNotMatch(withClipboard.markup(), /id="tornado-copy-text"/);

  const denied = await workbench('file:', { clipboard: 'fail' });
  denied.click('copy-tornado');
  assert.match(denied.markup(), /id="tornado-copy-text"/);
  assert.match(denied.notice(), /Clipboard unavailable/);

  const unbounded = await workbench();
  unbounded.click('dismiss-coach');
  unbounded.click('preset', { preset: 'talentAgentPlatform' });
  unbounded.click('copy-tornado');
  assert.match(unbounded.markup(), /Talent \| volume increase \| Unbounded/);
});

test('copy contribution waterfall uses Markdown and a clipboard fallback', async () => {
  const fallback = await workbench();
  fallback.click('dismiss-coach');
  assert.match(fallback.markup(), /data-action="copy-waterfall"/);
  fallback.click('copy-waterfall');
  assert.equal(fallback.downloads().length, 0);
  assert.match(fallback.markup(), /id="waterfall-copy-text"/);
  assert.match(fallback.markup(), /Participant \| Contribution \| Share/);
  assert.match(fallback.markup(), /Platform \| 0\.0400 units \/ txn \| 40\.0%/);
  assert.match(fallback.markup(), /Distributor \| 0\.0150 units \/ txn \| 35\.0%/);
  assert.match(fallback.markup(), /Liquidity Partner \| 0\.0200 units \/ txn \| 25\.0%/);
  assert.match(fallback.markup(), /not a forecast/);
  assert.match(fallback.notice(), /Copy the Markdown from the text area/);
  fallback.click('close-waterfall-copy');
  assert.doesNotMatch(fallback.markup(), /id="waterfall-copy-text"/);
  fallback.edit('deal.monthlyVolume', '');
  fallback.click('copy-waterfall');
  assert.doesNotMatch(fallback.markup(), /id="waterfall-copy-text"/);
  assert.match(fallback.notice(), /Resolve invalid inputs before copying the contribution waterfall/);

  const withClipboard = await workbench('file:', { clipboard: 'ok' });
  withClipboard.click('copy-waterfall');
  assert.equal(withClipboard.copied().length, 1);
  assert.match(withClipboard.copied()[0], /# Contribution waterfall/);
  assert.match(withClipboard.copied()[0], /Platform \| 0\.0400 units \/ txn \| 40\.0%/);
  assert.match(withClipboard.copied()[0], /not a forecast/);
  assert.doesNotMatch(withClipboard.copied()[0], /probab/i);
  assert.match(withClipboard.notice(), /copied as Markdown/);
  assert.match(withClipboard.notice(), /not a forecast/);
  assert.doesNotMatch(withClipboard.markup(), /id="waterfall-copy-text"/);

  const denied = await workbench('file:', { clipboard: 'fail' });
  denied.click('copy-waterfall');
  assert.match(denied.markup(), /id="waterfall-copy-text"/);
  assert.match(denied.notice(), /Clipboard unavailable/);
});

test('copy first breakpoint uses displayed labels and a clipboard fallback', async () => {
  const fallback = await workbench();
  fallback.click('dismiss-coach');
  assert.match(fallback.markup(), /data-action="copy-first-breakpoint"/);
  fallback.click('copy-first-breakpoint');
  assert.equal(fallback.downloads().length, 0);
  assert.match(fallback.markup(), /id="breakpoint-copy-text"/);
  assert.match(fallback.markup(), /Participant: Liquidity Partner/);
  assert.match(fallback.markup(), /Shock axis: fee decrease/);
  assert.match(fallback.markup(), /Magnitude: 0\.0080 units \/ txn, 4\.0%/);
  assert.match(fallback.markup(), /not a probability forecast/);
  assert.match(fallback.notice(), /Copy the Markdown from the text area/);
  fallback.click('close-breakpoint-copy');
  assert.doesNotMatch(fallback.markup(), /id="breakpoint-copy-text"/);
  fallback.edit('deal.monthlyVolume', '');
  fallback.click('copy-first-breakpoint');
  assert.doesNotMatch(fallback.markup(), /id="breakpoint-copy-text"/);
  assert.match(fallback.notice(), /Resolve invalid inputs before copying the first breakpoint/);

  const withClipboard = await workbench('file:', { clipboard: 'ok' });
  withClipboard.click('copy-first-breakpoint');
  assert.equal(withClipboard.copied().length, 1);
  assert.match(withClipboard.copied()[0], /Participant: Liquidity Partner/);
  assert.match(withClipboard.copied()[0], /Shock axis: fee decrease/);
  assert.match(withClipboard.copied()[0], /Magnitude: 0\.0080 units \/ txn, 4\.0%/);
  assert.match(withClipboard.copied()[0], /not a probability forecast/);
  assert.match(withClipboard.notice(), /copied as Markdown/);
  assert.match(withClipboard.notice(), /not a forecast/);
  assert.doesNotMatch(withClipboard.markup(), /id="breakpoint-copy-text"/);

  const denied = await workbench('file:', { clipboard: 'fail' });
  denied.click('copy-first-breakpoint');
  assert.match(denied.markup(), /id="breakpoint-copy-text"/);
  assert.match(denied.notice(), /Clipboard unavailable/);

  const failing = clonePreset('balanced');
  failing.participants[2].minimumAcceptableProfit = 10000;
  const already = await workbench();
  already.import(failing);
  already.click('copy-first-breakpoint');
  assert.match(already.markup(), /Participant: Liquidity Partner/);
  assert.match(already.markup(), /Magnitude: Already failing/);
});

test('copy first-breakpoint snapshot is one Markdown line and not a forecast', async () => {
  const fallback = await workbench();
  fallback.click('dismiss-coach');
  assert.match(fallback.markup(), /data-action="copy-first-breakpoint-snapshot"/);
  fallback.click('copy-first-breakpoint-snapshot');
  assert.equal(fallback.downloads().length, 0);
  assert.match(fallback.markup(), /id="breakpoint-snapshot-copy-text"/);
  assert.match(fallback.markup(), /First-breakpoint snapshot: Liquidity Partner; fee decrease; 0\.0080 units \/ txn, 4\.0%\. Synthetic ranking, not a forecast\./);
  assert.match(fallback.markup(), /id="breakpoint-snapshot-copy-title">First-breakpoint snapshot Markdown/);
  assert.doesNotMatch(fallback.markup(), /id="tornado-copy-text"/);
  assert.doesNotMatch(fallback.markup(), /id="waterfall-copy-text"/);
  assert.doesNotMatch(fallback.markup(), /id="operating-copy-text"/);
  assert.doesNotMatch(fallback.markup(), /id="allocation-copy-text"/);
  assert.match(fallback.notice(), /Copy the Markdown from the text area/);
  fallback.click('close-breakpoint-snapshot-copy');
  assert.doesNotMatch(fallback.markup(), /id="breakpoint-snapshot-copy-text"/);
  fallback.edit('deal.monthlyVolume', '');
  fallback.click('copy-first-breakpoint-snapshot');
  assert.doesNotMatch(fallback.markup(), /id="breakpoint-snapshot-copy-text"/);
  assert.match(fallback.notice(), /Resolve invalid inputs before copying the first-breakpoint snapshot/);

  const withClipboard = await workbench('file:', { clipboard: 'ok' });
  withClipboard.click('copy-first-breakpoint-snapshot');
  assert.equal(withClipboard.copied().length, 1);
  const text = withClipboard.copied()[0];
  assert.equal(text.split('\n').length, 1);
  assert.match(text, /^First-breakpoint snapshot: Liquidity Partner; fee decrease; 0\.0080 units \/ txn, 4\.0%\. Synthetic ranking, not a forecast\.$/);
  assert.doesNotMatch(text, /# Adverse-shock tornado|# Contribution waterfall|# Operating region|# Allocation balance/);
  assert.doesNotMatch(text, /probab/i);
  assert.match(withClipboard.notice(), /copied as Markdown/);
  assert.match(withClipboard.notice(), /not a forecast/);
  assert.doesNotMatch(withClipboard.markup(), /id="breakpoint-snapshot-copy-text"/);

  const denied = await workbench('file:', { clipboard: 'fail' });
  denied.click('copy-first-breakpoint-snapshot');
  assert.match(denied.markup(), /id="breakpoint-snapshot-copy-text"/);
  assert.match(denied.notice(), /Clipboard unavailable/);

  const failing = clonePreset('balanced');
  failing.participants[2].minimumAcceptableProfit = 10000;
  const already = await workbench('file:', { clipboard: 'ok' });
  already.import(failing);
  already.click('copy-first-breakpoint-snapshot');
  assert.match(already.copied().at(-1), /^First-breakpoint snapshot: Liquidity Partner is already failing an exit criterion\. Synthetic ranking, not a forecast\.$/);
});

test('copy first-breakpoint participant label is one Markdown line and not a forecast', async () => {
  const fallback = await workbench();
  fallback.click('dismiss-coach');
  assert.match(fallback.markup(), /data-action="copy-first-breakpoint-label"/);
  fallback.click('copy-first-breakpoint-label');
  assert.equal(fallback.downloads().length, 0);
  assert.match(fallback.markup(), /id="breakpoint-label-copy-text"/);
  assert.match(fallback.markup(), /First-breakpoint participant: Liquidity Partner\. Synthetic ranking, not a forecast\./);
  assert.match(fallback.markup(), /id="breakpoint-label-copy-title">First-breakpoint participant label Markdown/);
  assert.doesNotMatch(fallback.markup(), /id="utilization-copy-text"/);
  assert.doesNotMatch(fallback.markup(), /id="allocation-copy-text"/);
  assert.doesNotMatch(fallback.markup(), /# Capacity utilization|# Allocation balance/);
  assert.match(fallback.notice(), /Copy the Markdown from the text area/);
  fallback.click('close-breakpoint-label-copy');
  assert.doesNotMatch(fallback.markup(), /id="breakpoint-label-copy-text"/);
  fallback.edit('deal.monthlyVolume', '');
  fallback.click('copy-first-breakpoint-label');
  assert.doesNotMatch(fallback.markup(), /id="breakpoint-label-copy-text"/);
  assert.match(fallback.notice(), /Resolve invalid inputs before copying the first-breakpoint participant label/);

  const withClipboard = await workbench('file:', { clipboard: 'ok' });
  withClipboard.click('copy-first-breakpoint-label');
  assert.equal(withClipboard.copied().length, 1);
  const text = withClipboard.copied()[0];
  assert.equal(text.split('\n').length, 1);
  assert.equal(text, 'First-breakpoint participant: Liquidity Partner. Synthetic ranking, not a forecast.');
  assert.doesNotMatch(text, /# Capacity utilization|# Allocation balance|Capacity use|Allocated:/);
  assert.doesNotMatch(text, /probab/i);
  assert.match(withClipboard.notice(), /copied as Markdown/);
  assert.match(withClipboard.notice(), /not a forecast/);
  assert.doesNotMatch(withClipboard.markup(), /id="breakpoint-label-copy-text"/);

  const denied = await workbench('file:', { clipboard: 'fail' });
  denied.click('copy-first-breakpoint-label');
  assert.match(denied.markup(), /id="breakpoint-label-copy-text"/);
  assert.match(denied.notice(), /Clipboard unavailable/);

  const failing = clonePreset('balanced');
  failing.participants[2].minimumAcceptableProfit = 10000;
  const already = await workbench('file:', { clipboard: 'ok' });
  already.import(failing);
  already.click('copy-first-breakpoint-label');
  assert.equal(already.copied().at(-1), 'First-breakpoint participant: Liquidity Partner. Synthetic ranking, not a forecast.');
});

test('copy least-headroom participant label is one Markdown line with an honest empty', async () => {
  const fallback = await workbench();
  fallback.click('dismiss-coach');
  assert.match(fallback.markup(), /data-action="copy-viability-label"/);
  fallback.click('copy-viability-label');
  assert.equal(fallback.downloads().length, 0);
  assert.match(fallback.markup(), /id="viability-label-copy-text"/);
  assert.match(fallback.markup(), /Least-headroom participant: Liquidity Partner\. Volume-headroom ranking, not a forecast\./);
  assert.match(fallback.markup(), /id="viability-label-copy-title">Least-headroom participant label Markdown/);
  assert.doesNotMatch(fallback.markup(), /id="breakpoint-label-copy-text"/);
  assert.doesNotMatch(fallback.markup(), /# Viability and binding limit/);
  assert.match(fallback.notice(), /Copy the Markdown from the text area/);
  fallback.click('close-viability-label-copy');
  assert.doesNotMatch(fallback.markup(), /id="viability-label-copy-text"/);
  fallback.edit('deal.monthlyVolume', '');
  fallback.click('copy-viability-label');
  assert.match(fallback.markup(), /id="viability-label-copy-text"/);
  assert.match(fallback.markup(), />Least-headroom participant: none entered\.</);
  assert.doesNotMatch(fallback.markup(), /id="breakpoint-label-copy-text"/);

  const withClipboard = await workbench('file:', { clipboard: 'ok' });
  withClipboard.click('copy-viability-label');
  assert.equal(withClipboard.copied().length, 1);
  const text = withClipboard.copied()[0];
  assert.equal(text.split('\n').length, 1);
  assert.equal(text, 'Least-headroom participant: Liquidity Partner. Volume-headroom ranking, not a forecast.');
  assert.doesNotMatch(text, /First-breakpoint participant/);
  assert.doesNotMatch(text, /probab/i);
  assert.match(withClipboard.notice(), /copied as Markdown/);
  assert.match(withClipboard.notice(), /not a forecast/);
  assert.doesNotMatch(withClipboard.markup(), /id="viability-label-copy-text"/);
  withClipboard.edit('deal.monthlyVolume', '');
  withClipboard.click('copy-viability-label');
  assert.equal(withClipboard.copied()[1], 'Least-headroom participant: none entered.');

  const denied = await workbench('file:', { clipboard: 'fail' });
  denied.click('copy-viability-label');
  assert.match(denied.markup(), /id="viability-label-copy-text"/);
  assert.match(denied.notice(), /Clipboard unavailable/);
});

test('copy first-breakpoint remaining-to-hold is one Markdown line with an honest empty', async () => {
  const fallback = await workbench();
  fallback.click('dismiss-coach');
  assert.match(fallback.markup(), /data-action="copy-first-breakpoint-remaining"/);
  fallback.click('copy-first-breakpoint-remaining');
  assert.equal(fallback.downloads().length, 0);
  assert.match(fallback.markup(), /id="remaining-copy-text"/);
  assert.match(fallback.markup(), /First-breakpoint remaining-to-hold: 0\.0% share for Liquidity Partner\. Synthetic ranking, not a forecast\./);
  assert.match(fallback.markup(), /id="remaining-copy-title">First-breakpoint remaining-to-hold Markdown/);
  assert.doesNotMatch(fallback.markup(), /id="breakpoint-label-copy-text"/);
  assert.doesNotMatch(fallback.markup(), /id="viability-label-copy-text"/);
  assert.match(fallback.notice(), /Copy the Markdown from the text area/);
  fallback.click('close-remaining-copy');
  assert.doesNotMatch(fallback.markup(), /id="remaining-copy-text"/);
  fallback.edit('deal.monthlyVolume', '');
  fallback.click('copy-first-breakpoint-remaining');
  assert.match(fallback.markup(), /id="remaining-copy-text"/);
  assert.match(fallback.markup(), />First-breakpoint remaining-to-hold: none entered\.</);
  assert.doesNotMatch(fallback.markup(), /id="breakpoint-label-copy-text"/);
  assert.doesNotMatch(fallback.markup(), /id="viability-label-copy-text"/);

  const withClipboard = await workbench('file:', { clipboard: 'ok' });
  withClipboard.click('copy-first-breakpoint-remaining');
  assert.equal(withClipboard.copied().length, 1);
  const text = withClipboard.copied()[0];
  assert.equal(text.split('\n').length, 1);
  assert.equal(text, 'First-breakpoint remaining-to-hold: 0.0% share for Liquidity Partner. Synthetic ranking, not a forecast.');
  assert.doesNotMatch(text, /First-breakpoint participant: Liquidity Partner/);
  assert.doesNotMatch(text, /Least-headroom participant/);
  assert.doesNotMatch(text, /probab/i);
  assert.match(withClipboard.notice(), /copied as Markdown/);
  assert.match(withClipboard.notice(), /not a forecast/);
  assert.doesNotMatch(withClipboard.markup(), /id="remaining-copy-text"/);
  withClipboard.edit('deal.monthlyVolume', '');
  withClipboard.click('copy-first-breakpoint-remaining');
  assert.equal(withClipboard.copied()[1], 'First-breakpoint remaining-to-hold: none entered.');

  const denied = await workbench('file:', { clipboard: 'fail' });
  denied.click('copy-first-breakpoint-remaining');
  assert.match(denied.markup(), /id="remaining-copy-text"/);
  assert.match(denied.notice(), /Clipboard unavailable/);

  const failing = clonePreset('balanced');
  failing.participants[2].minimumAcceptableProfit = 10000;
  const already = await workbench('file:', { clipboard: 'ok' });
  already.import(failing);
  already.click('copy-first-breakpoint-remaining');
  assert.equal(already.copied().at(-1), 'First-breakpoint remaining-to-hold: 485,000 txn for Liquidity Partner. Synthetic ranking, not a forecast.');
});

test('copy first-breakpoint volume-to-hold is one Markdown line with an honest empty', async () => {
  const fallback = await workbench();
  fallback.click('dismiss-coach');
  assert.match(fallback.markup(), /data-action="copy-first-breakpoint-volume"/);
  fallback.click('copy-first-breakpoint-volume');
  assert.equal(fallback.downloads().length, 0);
  assert.match(fallback.markup(), /id="volume-copy-text"/);
  assert.match(fallback.markup(), /First-breakpoint volume-to-hold: 90,000 txn for Liquidity Partner\. Synthetic ranking, not a forecast\./);
  assert.match(fallback.markup(), /id="volume-copy-title">First-breakpoint volume-to-hold Markdown/);
  assert.doesNotMatch(fallback.markup(), /id="remaining-copy-text"/);
  assert.doesNotMatch(fallback.markup(), /id="breakpoint-label-copy-text"/);
  assert.doesNotMatch(fallback.markup(), /id="viability-label-copy-text"/);
  assert.match(fallback.notice(), /Copy the Markdown from the text area/);
  fallback.click('close-volume-copy');
  assert.doesNotMatch(fallback.markup(), /id="volume-copy-text"/);
  fallback.edit('deal.monthlyVolume', '');
  fallback.click('copy-first-breakpoint-volume');
  assert.match(fallback.markup(), /id="volume-copy-text"/);
  assert.match(fallback.markup(), />First-breakpoint volume-to-hold: none entered\.</);
  assert.doesNotMatch(fallback.markup(), /id="remaining-copy-text"/);
  assert.doesNotMatch(fallback.markup(), /id="breakpoint-label-copy-text"/);

  const withClipboard = await workbench('file:', { clipboard: 'ok' });
  withClipboard.click('copy-first-breakpoint-volume');
  assert.equal(withClipboard.copied().length, 1);
  const text = withClipboard.copied()[0];
  assert.equal(text.split('\n').length, 1);
  assert.equal(text, 'First-breakpoint volume-to-hold: 90,000 txn for Liquidity Partner. Synthetic ranking, not a forecast.');
  assert.doesNotMatch(text, /First-breakpoint remaining-to-hold/);
  assert.doesNotMatch(text, /First-breakpoint participant: Liquidity Partner/);
  assert.doesNotMatch(text, /Least-headroom participant/);
  assert.doesNotMatch(text, /probab/i);
  assert.match(withClipboard.notice(), /copied as Markdown/);
  assert.match(withClipboard.notice(), /not a forecast/);
  assert.doesNotMatch(withClipboard.markup(), /id="volume-copy-text"/);
  withClipboard.edit('deal.monthlyVolume', '');
  withClipboard.click('copy-first-breakpoint-volume');
  assert.equal(withClipboard.copied()[1], 'First-breakpoint volume-to-hold: none entered.');

  const denied = await workbench('file:', { clipboard: 'fail' });
  denied.click('copy-first-breakpoint-volume');
  assert.match(denied.markup(), /id="volume-copy-text"/);
  assert.match(denied.notice(), /Clipboard unavailable/);

  const failing = clonePreset('balanced');
  failing.participants[2].minimumAcceptableProfit = 10000;
  const already = await workbench('file:', { clipboard: 'ok' });
  already.import(failing);
  already.click('copy-first-breakpoint-volume');
  assert.equal(already.copied().at(-1), 'First-breakpoint volume-to-hold: 585,000 txn for Liquidity Partner. Synthetic ranking, not a forecast.');
});

test('negotiation brief copies Markdown or keeps a visible textarea fallback', async () => {
  const fallback = await workbench();
  fallback.click('copy-brief');
  assert.equal(fallback.downloads().length, 0);
  assert.match(fallback.markup(), /id="brief-copy-text"/);
  assert.match(fallback.markup(), /Markdown negotiation brief/);
  assert.match(fallback.markup(), /Weakest participant/);
  assert.match(fallback.markup(), /First breakpoint/);
  assert.match(fallback.markup(), /Counts are not probabilities/);
  assert.match(fallback.notice(), /Copy the Markdown from the text area/);
  fallback.click('close-brief-copy');
  assert.doesNotMatch(fallback.markup(), /id="brief-copy-text"/);
  fallback.edit('deal.monthlyVolume', '');
  fallback.click('copy-brief');
  assert.doesNotMatch(fallback.markup(), /id="brief-copy-text"/);

  const withClipboard = await workbench('file:', { clipboard: 'ok' });
  withClipboard.click('copy-brief');
  assert.equal(withClipboard.copied().length, 1);
  assert.match(withClipboard.copied()[0], /negotiation brief/);
  assert.match(withClipboard.notice(), /copied as Markdown/);
  assert.doesNotMatch(withClipboard.markup(), /id="brief-copy-text"/);

  const denied = await workbench('file:', { clipboard: 'fail' });
  denied.click('copy-brief');
  assert.match(denied.markup(), /id="brief-copy-text"/);
  assert.match(denied.notice(), /Clipboard unavailable/);
});

test('copy deal title and currency is one Markdown line with an honest empty', async () => {
  const fallback = await workbench();
  fallback.click('dismiss-coach');
  assert.match(fallback.markup(), /data-action="copy-deal-title"/);
  fallback.click('copy-deal-title');
  assert.equal(fallback.downloads().length, 0);
  assert.match(fallback.markup(), /id="title-copy-text"/);
  assert.match(fallback.markup(), /Deal title and currency: none entered\./);
  assert.match(fallback.markup(), /not a forecast/);
  assert.match(fallback.notice(), /Copy the Markdown from the text area/);
  fallback.click('close-title-copy');
  assert.doesNotMatch(fallback.markup(), /id="title-copy-text"/);

  fallback.edit('deal.title', '  Harbor JV  ', { type: 'text' });
  fallback.click('copy-deal-title');
  assert.match(fallback.markup(), /Deal title: Harbor JV\. Currency: none\./);
  assert.doesNotMatch(fallback.markup(), /Deal title and currency: none entered\./);
  fallback.click('close-title-copy');
  fallback.edit('deal.currency', 'USD', { type: 'text' });
  fallback.click('copy-deal-title');
  assert.match(fallback.markup(), /Deal title: Harbor JV\. Currency: USD\./);
  fallback.click('close-title-copy');
  fallback.edit('deal.title', '', { type: 'text', optional: 'true' });
  fallback.click('copy-deal-title');
  assert.match(fallback.markup(), /Deal title: none\. Currency: USD\./);
  fallback.click('close-title-copy');
  fallback.edit('deal.monthlyVolume', '');
  fallback.click('copy-deal-title');
  assert.match(fallback.markup(), /id="title-copy-text"/);
  assert.match(fallback.markup(), /Deal title: none\. Currency: USD\./);

  const withClipboard = await workbench('file:', { clipboard: 'ok' });
  withClipboard.click('copy-deal-title');
  assert.equal(withClipboard.copied().length, 1);
  assert.equal(withClipboard.copied()[0].split('\n').length, 1);
  assert.equal(withClipboard.copied()[0], 'Deal title and currency: none entered.');
  assert.match(withClipboard.notice(), /copied as Markdown/);
  assert.match(withClipboard.notice(), /not a forecast/);
  assert.doesNotMatch(withClipboard.markup(), /id="title-copy-text"/);
  withClipboard.edit('deal.title', 'Harbor JV', { type: 'text' });
  withClipboard.edit('deal.currency', 'USD', { type: 'text' });
  withClipboard.click('copy-deal-title');
  assert.equal(withClipboard.copied()[1], 'Deal title: Harbor JV. Currency: USD.');

  const denied = await workbench('file:', { clipboard: 'fail' });
  denied.edit('deal.title', 'North Hall', { type: 'text' });
  denied.click('copy-deal-title');
  assert.match(denied.markup(), /id="title-copy-text"/);
  assert.match(denied.markup(), /Deal title: North Hall\. Currency: none\./);
  assert.match(denied.notice(), /Clipboard unavailable/);
});

test('copy deal notes uses Markdown and a clipboard fallback', async () => {
  const fallback = await workbench();
  fallback.click('dismiss-coach');
  assert.match(fallback.markup(), /data-action="copy-deal-notes"/);
  fallback.click('copy-deal-notes');
  assert.equal(fallback.downloads().length, 0);
  assert.match(fallback.markup(), /id="notes-copy-text"/);
  assert.match(fallback.markup(), /# Deal notes/);
  assert.match(fallback.markup(), /No deal notes were entered\./);
  assert.match(fallback.markup(), /not a probability or forecast/);
  assert.match(fallback.notice(), /Copy the Markdown from the text area/);
  fallback.click('close-notes-copy');
  assert.doesNotMatch(fallback.markup(), /id="notes-copy-text"/);

  fallback.edit('deal.notes', '  Review the capacity clause.  ', { type: 'text', optional: 'true' });
  fallback.click('copy-deal-notes');
  assert.match(fallback.markup(), /id="notes-copy-text"/);
  assert.match(fallback.markup(), /Review the capacity clause\./);
  assert.doesNotMatch(fallback.markup(), /No deal notes were entered\./);
  fallback.click('close-notes-copy');

  fallback.edit('deal.monthlyVolume', '');
  fallback.click('copy-deal-notes');
  assert.match(fallback.markup(), /id="notes-copy-text"/);
  assert.match(fallback.markup(), /Review the capacity clause\./);
  fallback.click('close-notes-copy');
  fallback.click('undo');

  const withClipboard = await workbench('file:', { clipboard: 'ok' });
  withClipboard.click('copy-deal-notes');
  assert.equal(withClipboard.copied().length, 1);
  assert.match(withClipboard.copied()[0], /# Deal notes/);
  assert.match(withClipboard.copied()[0], /No deal notes were entered\./);
  assert.match(withClipboard.copied()[0], /not a probability or forecast/);
  assert.match(withClipboard.notice(), /copied as Markdown/);
  assert.match(withClipboard.notice(), /not a forecast/);
  assert.doesNotMatch(withClipboard.markup(), /id="notes-copy-text"/);
  withClipboard.edit('deal.notes', 'Harbor counterparty wants a 90-day review.', { type: 'text', optional: 'true' });
  withClipboard.click('copy-deal-notes');
  assert.equal(withClipboard.copied().length, 2);
  assert.match(withClipboard.copied()[1], /Harbor counterparty wants a 90-day review\./);
  assert.doesNotMatch(withClipboard.copied()[1], /No deal notes were entered\./);

  const denied = await workbench('file:', { clipboard: 'fail' });
  denied.edit('deal.notes', 'Keep the fee floor in view.', { type: 'text', optional: 'true' });
  denied.click('copy-deal-notes');
  assert.match(denied.markup(), /id="notes-copy-text"/);
  assert.match(denied.markup(), /Keep the fee floor in view\./);
  assert.match(denied.notice(), /Clipboard unavailable/);
});

test('fee-to-hold previews the floor and requires an explicit apply', async () => {
  const app = await workbench();
  app.click('solve-fee-hold');
  assert.match(app.markup(), /Fee-to-hold preview/);
  assert.match(app.markup(), /Apply hold fee/);
  const original = 0.2;
  app.click('close-fee-hold');
  assert.doesNotMatch(app.markup(), /Fee-to-hold preview/);
  app.click('solve-fee-hold');
  app.click('apply-fee-hold');
  assert.ok(app.saved().deal.feePerTransaction < original);
  assert.equal(app.saved().participants[0].revenueShare, 0.4);
  app.click('undo');
  assert.equal(app.saved().deal.feePerTransaction, original);
});

test('export filenames include a sanitized deal title and fall back without one', async () => {
  const app = await workbench();
  app.click('dismiss-coach');
  app.click('export');
  assert.equal(app.downloads()[0].filename, 'partnership-breakpoint.json');
  app.edit('deal.title', 'Harbor JV', { type: 'text' });
  app.click('export');
  assert.equal(app.downloads()[1].filename, 'partnership-breakpoint-harbor-jv.json');
  app.click('export-redacted');
  assert.equal(app.downloads()[2].filename, 'partnership-breakpoint-harbor-jv-redacted.json');
  app.click('export-report');
  assert.equal(app.downloads()[3].filename, 'partnership-breakpoint-harbor-jv-report.md');
  app.click('export-csv');
  assert.equal(app.downloads()[4].filename, 'partnership-breakpoint-harbor-jv-stress.csv');
  app.click('export-participants-csv');
  assert.equal(app.downloads()[5].filename, 'partnership-breakpoint-harbor-jv-participants.csv');
  app.click('copy-brief');
  assert.equal(app.downloads().length, 6);
  assert.match(app.markup(), /id="brief-copy-text"/);
});

test('participant CSV replaces the roster only after validation and leaves the deal unchanged', async () => {
  const app = await workbench();
  app.click('dismiss-coach');
  app.click('reset');
  assert.match(app.markup(), /data-action="import-participants-csv"/);
  const before = app.saved();
  app.importParticipantsCsv('name,share\nA,0.5\nB,0.5\n');
  assert.match(app.notice(), /missing required column: variable cost/);
  assert.deepEqual(app.saved().participants, before.participants);
  assert.equal(app.saved().deal.monthlyVolume, before.deal.monthlyVolume);

  const csv = [
    'name,revenue share,variable cost,fixed cost,min profit,capacity,commitment,risk',
    'Alpha,0.55,0.01,100,50,90000,,10',
    'Beta,0.45,0.02,80,40,,1000,5',
  ].join('\n');
  app.importParticipantsCsv(csv);
  const after = app.saved();
  assert.deepEqual(after.participants.map((item) => item.name), ['Alpha', 'Beta']);
  assert.equal(after.participants[0].revenueShare, 0.55);
  assert.equal(after.participants[1].minimumCommitment, 1000);
  assert.equal(after.deal.monthlyVolume, before.deal.monthlyVolume);
  assert.equal(after.deal.feePerTransaction, before.deal.feePerTransaction);
  assert.match(app.notice(), /Deal terms are unchanged/);
  app.click('undo');
  assert.deepEqual(app.saved().participants.map((item) => item.id), before.participants.map((item) => item.id));
});

test('pasted TSV roster reuses CSV validation and leaves the deal unchanged', async () => {
  const app = await workbench();
  app.click('dismiss-coach');
  app.click('reset');
  const before = app.saved();
  assert.match(app.markup(), /id="roster-paste"/);
  const tsv = [
    'name\trevenue share\tvariable cost\tfixed cost\tmin profit\tcapacity\tcommitment\trisk',
    'Alpha\t0.55\t0.01\t100\t50\t90000\t\t10',
    'Beta\t0.45\t0.02\t80\t40\t\t1000\t5',
  ].join('\n');
  app.pasteRoster(tsv);
  app.click('import-roster-paste');
  const after = app.saved();
  assert.deepEqual(after.participants.map((item) => item.name), ['Alpha', 'Beta']);
  assert.equal(after.deal.monthlyVolume, before.deal.monthlyVolume);
  assert.match(app.notice(), /pasted CSV or TSV/);
  app.pasteRoster('name\tshare\nA\t0.5\nB\t0.5\n');
  app.click('import-roster-paste');
  assert.match(app.notice(), /Pasted roster rejected/);
  assert.deepEqual(app.saved().participants.map((item) => item.name), ['Alpha', 'Beta']);
});

test('participant CSV export uses import columns and formula-safe names', async () => {
  const app = await workbench();
  app.click('dismiss-coach');
  app.click('export-participants-csv');
  const file = app.downloads()[0];
  assert.equal(file.filename, 'partnership-breakpoint-participants.csv');
  const text = await file.blob.text();
  assert.match(text, /^"name","revenue share","variable cost","fixed cost","min profit","capacity","commitment","risk"/);
  assert.match(text, /"Platform"/);
  assert.doesNotMatch(text, /probab/i);
  app.edit('participants.0.name', '=HYPERLINK("bad")', { type: 'text' });
  app.click('export-participants-csv');
  const formula = await app.downloads()[1].blob.text();
  assert.match(formula, /"'=HYPERLINK\(""bad""\)"/);
  app.edit('deal.monthlyVolume', '');
  app.click('export-participants-csv');
  assert.equal(app.downloads().length, 2);
  assert.match(app.notice(), /Resolve invalid inputs before exporting participant CSV/);
});

test('stress grid hide-in-table is display-only and does not change case counts', async () => {
  const app = await workbench();
  assert.match(app.markup(), /1 of 27 tested cases hold/);
  assert.match(app.markup(), /data-action="mute-stress-row" data-participant-id="platform"/);
  app.click('mute-stress-row', { participantId: 'platform' });
  assert.match(app.markup(), /Hidden from this table only/);
  assert.match(app.markup(), /1 of 27 tested cases hold/);
  assert.match(app.markup(), /data-action="unmute-stress-row" data-participant-id="platform"/);
  app.click('unmute-stress-row', { participantId: 'platform' });
  assert.doesNotMatch(app.markup(), /Hidden from this table only/);
  assert.match(app.markup(), /data-action="mute-stress-row" data-participant-id="platform"/);
});

test('hiding ledger participants who hold every compound case is display-only', async () => {
  const app = await workbench();
  app.click('dismiss-coach');
  assert.match(app.markup(), /data-action="hide-all-hold-ledger"/);
  assert.match(app.markup(), /1 of 27 tested cases hold/);
  assert.match(app.markup(), /participant-live-name">Platform/);
  assert.match(app.markup(), /participant-live-name">Distributor/);
  assert.match(app.markup(), /participant-live-name">Liquidity Partner/);
  app.click('hide-all-hold-ledger');
  assert.match(app.markup(), /1 of 27 tested cases hold/);
  assert.match(app.markup(), /0 participants who hold in every tested compound case are hidden from this ledger display/);
  assert.match(app.markup(), /Grid counts are unchanged/);
  assert.match(app.markup(), /participant-live-name">Platform/);
  assert.match(app.markup(), /participant-live-name">Distributor/);
  assert.match(app.markup(), /participant-live-name">Liquidity Partner/);
  app.edit('stress.volumeDropPct', '0');
  app.edit('stress.volumeGrowthPct', '20');
  app.edit('stress.feeDropPct', '0');
  app.edit('stress.variableCostRisePct', '0');
  assert.match(app.markup(), /1 of 2 tested cases hold/);
  app.click('hide-all-hold-ledger');
  assert.match(app.markup(), /1 of 2 tested cases hold/);
  assert.match(app.markup(), /2 participants who hold in every tested compound case are hidden from this ledger display/);
  const ledger = app.markup().slice(app.markup().indexOf('id="participant-ledger"'));
  assert.doesNotMatch(ledger.slice(0, ledger.indexOf('</table>')), /participant-live-name">Platform/);
  assert.doesNotMatch(ledger.slice(0, ledger.indexOf('</table>')), /participant-live-name">Distributor/);
  assert.match(ledger.slice(0, ledger.indexOf('</table>')), /participant-live-name">Liquidity Partner/);
  assert.match(app.markup(), /data-action="mute-stress-row" data-participant-id="platform"/);
  assert.match(app.markup(), /data-action="mute-stress-row" data-participant-id="distributor"/);
  app.click('show-all-hold-ledger');
  assert.match(app.markup(), /1 of 2 tested cases hold/);
  assert.match(app.markup(), /participant-live-name">Platform/);
  assert.match(app.markup(), /participant-live-name">Distributor/);
  assert.match(app.markup(), /participant-live-name">Liquidity Partner/);
  app.edit('stress.volumeGrowthPct', '0');
  app.click('hide-all-hold-ledger');
  assert.match(app.markup(), /1 of 1 tested cases hold/);
  assert.match(app.markup(), /Every displayed participant holds in every tested compound case/);
  assert.match(app.markup(), /Counts are unchanged/);
  app.click('show-all-hold-ledger');
  assert.match(app.markup(), /1 of 1 tested cases hold/);
  app.edit('deal.monthlyVolume', '');
  app.click('hide-all-hold-ledger');
  assert.match(app.notice(), /Resolve invalid inputs before hiding participants who hold in every tested compound case/);
});

test('hiding participants who currently hold is display-only and expand restores the roster', async () => {
  const app = await workbench();
  app.click('dismiss-coach');
  const forms = () => app.markup().match(/class="participant-form/g)?.length ?? 0;
  assert.equal(forms(), 3);
  assert.match(app.markup(), /1 of 27 tested cases hold/);
  assert.match(app.markup(), /data-action="hide-holding-participants"/);
  app.click('hide-holding-participants');
  assert.equal(forms(), 0);
  assert.match(app.markup(), /3 participants who currently hold are hidden from this roster display/);
  assert.match(app.markup(), /Tested-case and model counts are unchanged/);
  assert.match(app.markup(), /1 of 27 tested cases hold/);
  assert.match(app.markup(), /Every displayed participant currently holds/);
  assert.match(app.markup(), /participant-live-name">Platform/);
  assert.match(app.markup(), /participant-live-name">Distributor/);
  assert.match(app.markup(), /participant-live-name">Liquidity Partner/);
  app.click('export');
  assert.equal(JSON.parse(await app.downloads()[0].blob.text()).participants.length, 3);
  app.click('show-holding-participants');
  assert.equal(forms(), 3);
  assert.match(app.markup(), /1 of 27 tested cases hold/);
  const failing = clonePreset('balanced');
  failing.participants[2].minimumAcceptableProfit = 10000;
  app.import(failing);
  assert.equal(forms(), 3);
  app.click('hide-holding-participants');
  assert.equal(forms(), 1);
  assert.match(app.markup(), /Liquidity Partner/);
  assert.match(app.markup(), /2 participants who currently hold are hidden from this roster display/);
  assert.match(app.markup(), /class="participant-form first-fail"/);
  app.click('show-holding-participants');
  assert.equal(forms(), 3);
  app.edit('deal.monthlyVolume', '');
  app.click('hide-holding-participants');
  assert.match(app.notice(), /Resolve invalid inputs before hiding participants who currently hold/);
  assert.equal(forms(), 3);
});

test('collapsing all-hold stress cases is display-only and expand restores the rows', async () => {
  const app = await workbench();
  assert.match(app.markup(), /1 of 27 tested cases hold/);
  assert.match(app.markup(), /data-action="inspect-stress" data-scenario-id="case-1"/);
  assert.match(app.markup(), /Inspect all 27 compound cases/);
  app.click('collapse-all-hold-cases');
  assert.match(app.markup(), /1 of 27 tested cases hold/);
  assert.match(app.markup(), /1 all-hold case is hidden from this table/);
  assert.match(app.markup(), /Counts are unchanged/);
  assert.match(app.markup(), /26 of 27 rows are visible/);
  assert.doesNotMatch(app.markup(), /data-action="inspect-stress" data-scenario-id="case-1"/);
  assert.match(app.markup(), /data-action="inspect-stress" data-scenario-id="case-2"/);
  assert.match(app.markup(), /Inspect all 27 compound cases/);
  const collapseNote = app.markup().match(/[0-9]+ all-hold case is hidden from this table[^.]*\./)[0];
  assert.doesNotMatch(collapseNote, /probab/i);
  app.click('expand-all-hold-cases');
  assert.match(app.markup(), /1 of 27 tested cases hold/);
  assert.match(app.markup(), /data-action="inspect-stress" data-scenario-id="case-1"/);
  assert.match(app.markup(), /27 of 27 rows are visible/);
});

test('ledger all-hold preference round-trips on saved JSON and defaults to shown', async () => {
  const app = await workbench();
  app.click('dismiss-coach');
  app.click('reset');
  assert.equal(Object.hasOwn(app.saved(), 'hideAllHoldLedger'), false);
  app.edit('stress.volumeDropPct', '0');
  app.edit('stress.volumeGrowthPct', '20');
  app.edit('stress.feeDropPct', '0');
  app.edit('stress.variableCostRisePct', '0');
  assert.match(app.markup(), /1 of 2 tested cases hold/);
  app.click('hide-all-hold-ledger');
  assert.equal(app.saved().hideAllHoldLedger, true);
  assert.match(app.markup(), /2 participants who hold in every tested compound case are hidden from this ledger display/);
  app.click('export');
  const hidden = JSON.parse(await app.downloads()[0].blob.text());
  assert.equal(hidden.hideAllHoldLedger, true);
  assert.equal(hidden.participants.length, 3);
  assert.match(app.markup(), /1 of 2 tested cases hold/);
  app.click('show-all-hold-ledger');
  assert.equal(Object.hasOwn(app.saved(), 'hideAllHoldLedger'), false);
  app.click('export');
  const shownFile = JSON.parse(await app.downloads()[1].blob.text());
  assert.equal(Object.hasOwn(shownFile, 'hideAllHoldLedger'), false);

  const imported = clonePreset('balanced');
  imported.stress = { volumeDropPct: 0, volumeGrowthPct: 20, feeDropPct: 0, variableCostRisePct: 0 };
  imported.hideAllHoldLedger = true;
  app.import(imported);
  assert.equal(app.saved().hideAllHoldLedger, true);
  assert.match(app.markup(), /2 participants who hold in every tested compound case are hidden from this ledger display/);
  assert.match(app.markup(), /1 of 2 tested cases hold/);

  const omitted = clonePreset('balanced');
  app.import(omitted);
  assert.equal(Object.hasOwn(app.saved(), 'hideAllHoldLedger'), false);
  assert.match(app.markup(), /participant-live-name">Platform/);

  const invalid = clonePreset('balanced');
  invalid.hideAllHoldLedger = 'true';
  app.import(invalid);
  assert.match(app.notice(), /boolean/);

  const unknown = clonePreset('balanced');
  unknown.hideAllHoldLedger = true;
  unknown.unexpected = true;
  app.import(unknown);
  assert.match(app.notice(), /unknown field: unexpected/);
});

test('hide-holding preference round-trips on saved JSON and defaults to shown', async () => {
  const app = await workbench();
  app.click('dismiss-coach');
  app.click('reset');
  assert.equal(Object.hasOwn(app.saved(), 'hideHoldingParticipants'), false);
  const forms = () => app.markup().match(/class="participant-form/g)?.length ?? 0;
  app.click('hide-holding-participants');
  assert.equal(app.saved().hideHoldingParticipants, true);
  assert.equal(forms(), 0);
  app.click('export');
  const hidden = JSON.parse(await app.downloads()[0].blob.text());
  assert.equal(hidden.hideHoldingParticipants, true);
  assert.equal(hidden.participants.length, 3);
  app.click('show-holding-participants');
  assert.equal(Object.hasOwn(app.saved(), 'hideHoldingParticipants'), false);
  app.click('export');
  const shownFile = JSON.parse(await app.downloads()[1].blob.text());
  assert.equal(Object.hasOwn(shownFile, 'hideHoldingParticipants'), false);
  assert.equal(forms(), 3);

  const imported = clonePreset('balanced');
  imported.hideHoldingParticipants = true;
  app.import(imported);
  assert.equal(app.saved().hideHoldingParticipants, true);
  assert.equal(forms(), 0);
  assert.match(app.markup(), /1 of 27 tested cases hold/);

  const omitted = clonePreset('balanced');
  app.import(omitted);
  assert.equal(Object.hasOwn(app.saved(), 'hideHoldingParticipants'), false);
  assert.equal(forms(), 3);

  const invalid = clonePreset('balanced');
  invalid.hideHoldingParticipants = 'true';
  app.import(invalid);
  assert.match(app.notice(), /boolean/);
  assert.equal(forms(), 3);

  const unknown = clonePreset('balanced');
  unknown.hideHoldingParticipants = true;
  unknown.unexpected = true;
  app.import(unknown);
  assert.match(app.notice(), /unknown field: unexpected/);
});

test('hiding zero-share participants is display-only and expand restores the roster', async () => {
  const app = await workbench();
  app.click('dismiss-coach');
  const forms = () => app.markup().match(/class="participant-form/g)?.length ?? 0;
  const holdCount = () => app.markup().match(/([0-9]+) of 27 tested cases hold/)?.[1];
  assert.equal(forms(), 3);
  assert.match(app.markup(), /1 of 27 tested cases hold/);
  assert.match(app.markup(), /data-action="hide-zero-share-participants"/);
  app.click('hide-zero-share-participants');
  assert.equal(forms(), 3);
  assert.match(app.markup(), /0 participants with zero revenue share are hidden from this roster display/);
  assert.match(app.markup(), /1 of 27 tested cases hold/);
  app.click('show-zero-share-participants');
  app.edit('participants.2.revenueShare', '0');
  app.edit('participants.0.revenueShare', '0.5');
  app.edit('participants.1.revenueShare', '0.5');
  assert.equal(forms(), 3);
  const beforeHide = holdCount();
  assert.ok(beforeHide);
  app.click('hide-zero-share-participants');
  assert.equal(forms(), 2);
  assert.match(app.markup(), /1 participant with zero revenue share is hidden from this roster display/);
  assert.match(app.markup(), /Tested-case and model counts are unchanged/);
  assert.doesNotMatch(app.markup(), /Participant 3: Liquidity Partner/);
  assert.match(app.markup(), /participant-live-name">Liquidity Partner/);
  assert.equal(holdCount(), beforeHide);
  app.click('export');
  const exported = JSON.parse(await app.downloads()[0].blob.text());
  assert.equal(exported.participants.length, 3);
  assert.equal(exported.participants[2].revenueShare, 0);
  assert.equal(exported.hideZeroShareParticipants, true);
  app.click('show-zero-share-participants');
  assert.equal(forms(), 3);
  assert.match(app.markup(), /Liquidity Partner/);
  assert.equal(holdCount(), beforeHide);
});

test('hide-zero-share preference round-trips on saved JSON and defaults to shown', async () => {
  const app = await workbench();
  app.click('dismiss-coach');
  app.click('reset');
  assert.equal(Object.hasOwn(app.saved(), 'hideZeroShareParticipants'), false);
  assert.equal(Object.hasOwn(app.saved(), 'hideHoldingParticipants'), false);
  assert.equal(Object.hasOwn(app.saved(), 'hideAllHoldLedger'), false);
  assert.equal(Object.hasOwn(app.saved(), 'hideParticipantsOverCapacity'), false);
  const forms = () => app.markup().match(/class="participant-form/g)?.length ?? 0;
  app.click('hide-zero-share-participants');
  assert.equal(app.saved().hideZeroShareParticipants, true);
  assert.equal(Object.hasOwn(app.saved(), 'hideHoldingParticipants'), false);
  assert.equal(Object.hasOwn(app.saved(), 'hideAllHoldLedger'), false);
  assert.equal(Object.hasOwn(app.saved(), 'hideParticipantsOverCapacity'), false);
  assert.equal(forms(), 3);
  app.click('export');
  const hidden = JSON.parse(await app.downloads()[0].blob.text());
  assert.equal(hidden.hideZeroShareParticipants, true);
  assert.equal(hidden.participants.length, 3);
  assert.equal(Object.hasOwn(hidden, 'hideHoldingParticipants'), false);
  assert.equal(Object.hasOwn(hidden, 'hideAllHoldLedger'), false);
  app.click('show-zero-share-participants');
  assert.equal(Object.hasOwn(app.saved(), 'hideZeroShareParticipants'), false);
  app.click('export');
  const shownFile = JSON.parse(await app.downloads()[1].blob.text());
  assert.equal(Object.hasOwn(shownFile, 'hideZeroShareParticipants'), false);
  assert.equal(forms(), 3);

  const imported = clonePreset('balanced');
  imported.hideZeroShareParticipants = true;
  app.import(imported);
  assert.equal(app.saved().hideZeroShareParticipants, true);
  assert.equal(forms(), 3);
  assert.match(app.markup(), /1 of 27 tested cases hold/);

  const omitted = clonePreset('balanced');
  app.import(omitted);
  assert.equal(Object.hasOwn(app.saved(), 'hideZeroShareParticipants'), false);
  assert.equal(forms(), 3);

  const invalid = clonePreset('balanced');
  invalid.hideZeroShareParticipants = 'true';
  app.import(invalid);
  assert.match(app.notice(), /boolean/);
  assert.equal(forms(), 3);

  const unknown = clonePreset('balanced');
  unknown.hideZeroShareParticipants = true;
  unknown.unexpected = true;
  app.import(unknown);
  assert.match(app.notice(), /unknown field: unexpected/);
});

test('hiding participants over listed capacity is display-only and expand restores the roster', async () => {
  const app = await workbench();
  app.click('dismiss-coach');
  const forms = () => app.markup().match(/class="participant-form/g)?.length ?? 0;
  const holdCount = () => app.markup().match(/([0-9]+) of 27 tested cases hold/)?.[1];
  assert.equal(forms(), 3);
  assert.match(app.markup(), /1 of 27 tested cases hold/);
  assert.match(app.markup(), /data-action="hide-over-capacity-participants"/);
  app.click('hide-over-capacity-participants');
  assert.equal(forms(), 3);
  assert.match(app.markup(), /0 participants whose volume is above listed capacity are hidden from this roster display/);
  assert.match(app.markup(), /1 of 27 tested cases hold/);
  app.click('show-over-capacity-participants');
  app.edit('deal.monthlyVolume', '116000');
  assert.equal(forms(), 3);
  const beforeHide = holdCount();
  assert.ok(beforeHide);
  app.click('hide-over-capacity-participants');
  assert.equal(forms(), 2);
  assert.match(app.markup(), /1 participant whose volume is above listed capacity is hidden from this roster display/);
  assert.match(app.markup(), /Tested-case and model counts are unchanged/);
  assert.doesNotMatch(app.markup(), /Participant 3: Liquidity Partner/);
  assert.match(app.markup(), /participant-live-name">Liquidity Partner/);
  assert.equal(holdCount(), beforeHide);
  app.click('export');
  const exported = JSON.parse(await app.downloads()[0].blob.text());
  assert.equal(exported.participants.length, 3);
  assert.equal(exported.deal.monthlyVolume, 116000);
  assert.equal(exported.hideParticipantsOverCapacity, true);
  assert.equal(Object.hasOwn(exported, 'hideHoldingParticipants'), false);
  assert.equal(Object.hasOwn(exported, 'hideZeroShareParticipants'), false);
  assert.equal(Object.hasOwn(exported, 'hideAllHoldLedger'), false);
  app.click('show-over-capacity-participants');
  assert.equal(forms(), 3);
  assert.match(app.markup(), /Liquidity Partner/);
  assert.equal(holdCount(), beforeHide);
  app.edit('deal.monthlyVolume', '');
  app.click('hide-over-capacity-participants');
  assert.match(app.notice(), /Resolve invalid inputs before hiding participants whose volume is above listed capacity/);
});

test('hide-over-capacity preference round-trips on saved JSON and defaults to shown', async () => {
  const app = await workbench();
  app.click('dismiss-coach');
  app.click('reset');
  assert.equal(Object.hasOwn(app.saved(), 'hideParticipantsOverCapacity'), false);
  assert.equal(Object.hasOwn(app.saved(), 'hideHoldingParticipants'), false);
  assert.equal(Object.hasOwn(app.saved(), 'hideAllHoldLedger'), false);
  assert.equal(Object.hasOwn(app.saved(), 'hideZeroShareParticipants'), false);
  const forms = () => app.markup().match(/class="participant-form/g)?.length ?? 0;
  app.click('hide-over-capacity-participants');
  assert.equal(app.saved().hideParticipantsOverCapacity, true);
  assert.equal(Object.hasOwn(app.saved(), 'hideHoldingParticipants'), false);
  assert.equal(Object.hasOwn(app.saved(), 'hideAllHoldLedger'), false);
  assert.equal(Object.hasOwn(app.saved(), 'hideZeroShareParticipants'), false);
  assert.equal(forms(), 3);
  app.click('export');
  const hidden = JSON.parse(await app.downloads()[0].blob.text());
  assert.equal(hidden.hideParticipantsOverCapacity, true);
  assert.equal(hidden.participants.length, 3);
  assert.equal(Object.hasOwn(hidden, 'hideHoldingParticipants'), false);
  assert.equal(Object.hasOwn(hidden, 'hideAllHoldLedger'), false);
  assert.equal(Object.hasOwn(hidden, 'hideZeroShareParticipants'), false);
  app.click('show-over-capacity-participants');
  assert.equal(Object.hasOwn(app.saved(), 'hideParticipantsOverCapacity'), false);
  app.click('export');
  const shownFile = JSON.parse(await app.downloads()[1].blob.text());
  assert.equal(Object.hasOwn(shownFile, 'hideParticipantsOverCapacity'), false);
  assert.equal(forms(), 3);

  const imported = clonePreset('balanced');
  imported.hideParticipantsOverCapacity = true;
  app.import(imported);
  assert.equal(app.saved().hideParticipantsOverCapacity, true);
  assert.equal(forms(), 3);
  assert.match(app.markup(), /1 of 27 tested cases hold/);

  const omitted = clonePreset('balanced');
  app.import(omitted);
  assert.equal(Object.hasOwn(app.saved(), 'hideParticipantsOverCapacity'), false);
  assert.equal(forms(), 3);

  const invalid = clonePreset('balanced');
  invalid.hideParticipantsOverCapacity = 'true';
  app.import(invalid);
  assert.match(app.notice(), /boolean/);
  assert.equal(forms(), 3);

  const unknown = clonePreset('balanced');
  unknown.hideParticipantsOverCapacity = true;
  unknown.unexpected = true;
  app.import(unknown);
  assert.match(app.notice(), /unknown field: unexpected/);
});

test('hiding participants at hold with no capacity breach is display-only and expand restores the roster', async () => {
  const app = await workbench();
  app.click('dismiss-coach');
  const forms = () => app.markup().match(/class="participant-form/g)?.length ?? 0;
  const holdCount = () => app.markup().match(/([0-9]+) of 27 tested cases hold/)?.[1];
  assert.equal(forms(), 3);
  assert.match(app.markup(), /1 of 27 tested cases hold/);
  assert.match(app.markup(), /data-action="hide-at-hold-participants"/);
  assert.match(app.markup(), /data-action="hide-holding-participants"/);
  assert.match(app.markup(), /data-action="hide-over-capacity-participants"/);
  app.click('hide-at-hold-participants');
  assert.equal(forms(), 0);
  assert.match(app.markup(), /3 participants whose volume headroom is at or above a hold with no listed capacity breach are hidden from this roster display/);
  assert.match(app.markup(), /Every displayed participant has volume headroom at or above a hold with no listed capacity breach/);
  assert.match(app.markup(), /1 of 27 tested cases hold/);
  assert.equal(Object.hasOwn(app.saved(), 'hideHoldingParticipants'), false);
  assert.equal(Object.hasOwn(app.saved(), 'hideParticipantsOverCapacity'), false);
  assert.equal(app.saved().hideParticipantsAtHold, true);
  app.click('show-at-hold-participants');
  assert.equal(forms(), 3);
  app.edit('deal.monthlyVolume', '116000');
  assert.equal(forms(), 3);
  const beforeHide = holdCount();
  assert.ok(beforeHide);
  app.click('hide-at-hold-participants');
  assert.equal(forms(), 1);
  assert.match(app.markup(), /2 participants whose volume headroom is at or above a hold with no listed capacity breach are hidden from this roster display/);
  assert.match(app.markup(), /Tested-case and model counts are unchanged/);
  assert.match(app.markup(), /Participant 3: Liquidity Partner/);
  assert.doesNotMatch(app.markup(), /Participant 1: Platform/);
  assert.match(app.markup(), /participant-live-name">Platform/);
  assert.equal(holdCount(), beforeHide);
  app.click('export');
  const exported = JSON.parse(await app.downloads()[0].blob.text());
  assert.equal(exported.participants.length, 3);
  assert.equal(exported.deal.monthlyVolume, 116000);
  assert.equal(exported.hideParticipantsAtHold, true);
  assert.equal(Object.hasOwn(exported, 'hideHoldingParticipants'), false);
  assert.equal(Object.hasOwn(exported, 'hideZeroShareParticipants'), false);
  assert.equal(Object.hasOwn(exported, 'hideAllHoldLedger'), false);
  assert.equal(Object.hasOwn(exported, 'hideParticipantsOverCapacity'), false);
  app.click('show-at-hold-participants');
  assert.equal(forms(), 3);
  assert.match(app.markup(), /Platform/);
  assert.equal(holdCount(), beforeHide);
  app.edit('deal.monthlyVolume', '');
  app.click('hide-at-hold-participants');
  assert.match(app.notice(), /Resolve invalid inputs before hiding participants at hold with no listed capacity breach/);
});

test('hide-at-hold preference round-trips on saved JSON and defaults to shown', async () => {
  const app = await workbench();
  app.click('dismiss-coach');
  app.click('reset');
  assert.equal(Object.hasOwn(app.saved(), 'hideParticipantsAtHold'), false);
  assert.equal(Object.hasOwn(app.saved(), 'hideHoldingParticipants'), false);
  assert.equal(Object.hasOwn(app.saved(), 'hideAllHoldLedger'), false);
  assert.equal(Object.hasOwn(app.saved(), 'hideZeroShareParticipants'), false);
  assert.equal(Object.hasOwn(app.saved(), 'hideParticipantsOverCapacity'), false);
  const forms = () => app.markup().match(/class="participant-form/g)?.length ?? 0;
  app.click('hide-at-hold-participants');
  assert.equal(app.saved().hideParticipantsAtHold, true);
  assert.equal(Object.hasOwn(app.saved(), 'hideHoldingParticipants'), false);
  assert.equal(Object.hasOwn(app.saved(), 'hideAllHoldLedger'), false);
  assert.equal(Object.hasOwn(app.saved(), 'hideZeroShareParticipants'), false);
  assert.equal(Object.hasOwn(app.saved(), 'hideParticipantsOverCapacity'), false);
  assert.equal(forms(), 0);
  app.click('export');
  const hidden = JSON.parse(await app.downloads()[0].blob.text());
  assert.equal(hidden.hideParticipantsAtHold, true);
  assert.equal(hidden.participants.length, 3);
  assert.equal(Object.hasOwn(hidden, 'hideHoldingParticipants'), false);
  assert.equal(Object.hasOwn(hidden, 'hideAllHoldLedger'), false);
  assert.equal(Object.hasOwn(hidden, 'hideZeroShareParticipants'), false);
  assert.equal(Object.hasOwn(hidden, 'hideParticipantsOverCapacity'), false);
  app.click('show-at-hold-participants');
  assert.equal(Object.hasOwn(app.saved(), 'hideParticipantsAtHold'), false);
  app.click('export');
  const shownFile = JSON.parse(await app.downloads()[1].blob.text());
  assert.equal(Object.hasOwn(shownFile, 'hideParticipantsAtHold'), false);
  assert.equal(forms(), 3);

  const imported = clonePreset('balanced');
  imported.hideParticipantsAtHold = true;
  app.import(imported);
  assert.equal(app.saved().hideParticipantsAtHold, true);
  assert.equal(forms(), 0);
  assert.match(app.markup(), /1 of 27 tested cases hold/);

  const omitted = clonePreset('balanced');
  app.import(omitted);
  assert.equal(Object.hasOwn(app.saved(), 'hideParticipantsAtHold'), false);
  assert.equal(forms(), 3);

  const invalid = clonePreset('balanced');
  invalid.hideParticipantsAtHold = 'true';
  app.import(invalid);
  assert.match(app.notice(), /boolean/);
  assert.equal(forms(), 3);

  const unknown = clonePreset('balanced');
  unknown.hideParticipantsAtHold = true;
  unknown.unexpected = true;
  app.import(unknown);
  assert.match(app.notice(), /unknown field: unexpected/);
});

test('hiding participants without listed capacity is display-only and expand restores the roster', async () => {
  const app = await workbench();
  app.click('dismiss-coach');
  const forms = () => app.markup().match(/class="participant-form/g)?.length ?? 0;
  const holdCount = () => app.markup().match(/([0-9]+) of 27 tested cases hold/)?.[1];
  assert.equal(forms(), 3);
  assert.match(app.markup(), /1 of 27 tested cases hold/);
  assert.match(app.markup(), /data-action="hide-without-capacity-participants"/);
  assert.match(app.markup(), /data-action="hide-at-hold-participants"/);
  assert.match(app.markup(), /data-action="hide-over-capacity-participants"/);
  assert.match(app.markup(), /data-action="hide-zero-share-participants"/);
  app.click('hide-without-capacity-participants');
  assert.equal(forms(), 3);
  assert.match(app.markup(), /0 participants whose capacity is unbounded or omitted are hidden from this roster display/);
  assert.match(app.markup(), /1 of 27 tested cases hold/);
  assert.equal(Object.hasOwn(app.saved(), 'hideParticipantsAtHold'), false);
  assert.equal(Object.hasOwn(app.saved(), 'hideParticipantsOverCapacity'), false);
  assert.equal(Object.hasOwn(app.saved(), 'hideZeroShareParticipants'), false);
  assert.equal(app.saved().hideParticipantsWithoutCapacity, true);
  app.click('show-without-capacity-participants');
  assert.equal(forms(), 3);
  app.edit('participants.0.capacity', '', { optional: 'true' });
  assert.equal(forms(), 3);
  const beforeHide = holdCount();
  assert.ok(beforeHide);
  app.click('hide-without-capacity-participants');
  assert.equal(forms(), 2);
  assert.match(app.markup(), /1 participant whose capacity is unbounded or omitted is hidden from this roster display/);
  assert.match(app.markup(), /Tested-case and model counts are unchanged/);
  assert.doesNotMatch(app.markup(), /Participant 1: Platform/);
  assert.match(app.markup(), /participant-live-name">Platform/);
  assert.equal(holdCount(), beforeHide);
  app.click('export');
  const exported = JSON.parse(await app.downloads()[0].blob.text());
  assert.equal(exported.participants.length, 3);
  assert.equal(exported.participants[0].capacity, null);
  assert.equal(exported.hideParticipantsWithoutCapacity, true);
  assert.equal(Object.hasOwn(exported, 'hideHoldingParticipants'), false);
  assert.equal(Object.hasOwn(exported, 'hideZeroShareParticipants'), false);
  assert.equal(Object.hasOwn(exported, 'hideAllHoldLedger'), false);
  assert.equal(Object.hasOwn(exported, 'hideParticipantsOverCapacity'), false);
  assert.equal(Object.hasOwn(exported, 'hideParticipantsAtHold'), false);
  app.click('show-without-capacity-participants');
  assert.equal(forms(), 3);
  assert.match(app.markup(), /Platform/);
  assert.equal(holdCount(), beforeHide);
  app.click('preset', { preset: 'podcastHostNetwork' });
  app.click('hide-without-capacity-participants');
  assert.equal(forms(), 1);
  assert.match(app.markup(), /1 participant whose capacity is unbounded or omitted is hidden from this roster display/);
  assert.doesNotMatch(app.markup(), /Participant 1: Podcast host/);
  assert.match(app.markup(), /Participant 2: Podcast network/);
});

test('hide-without-capacity preference round-trips on saved JSON and defaults to shown', async () => {
  const app = await workbench();
  app.click('dismiss-coach');
  app.click('reset');
  assert.equal(Object.hasOwn(app.saved(), 'hideParticipantsWithoutCapacity'), false);
  assert.equal(Object.hasOwn(app.saved(), 'hideHoldingParticipants'), false);
  assert.equal(Object.hasOwn(app.saved(), 'hideAllHoldLedger'), false);
  assert.equal(Object.hasOwn(app.saved(), 'hideZeroShareParticipants'), false);
  assert.equal(Object.hasOwn(app.saved(), 'hideParticipantsOverCapacity'), false);
  assert.equal(Object.hasOwn(app.saved(), 'hideParticipantsAtHold'), false);
  const forms = () => app.markup().match(/class="participant-form/g)?.length ?? 0;
  app.click('hide-without-capacity-participants');
  assert.equal(app.saved().hideParticipantsWithoutCapacity, true);
  assert.equal(Object.hasOwn(app.saved(), 'hideHoldingParticipants'), false);
  assert.equal(Object.hasOwn(app.saved(), 'hideAllHoldLedger'), false);
  assert.equal(Object.hasOwn(app.saved(), 'hideZeroShareParticipants'), false);
  assert.equal(Object.hasOwn(app.saved(), 'hideParticipantsOverCapacity'), false);
  assert.equal(Object.hasOwn(app.saved(), 'hideParticipantsAtHold'), false);
  assert.equal(forms(), 3);
  app.click('export');
  const hidden = JSON.parse(await app.downloads()[0].blob.text());
  assert.equal(hidden.hideParticipantsWithoutCapacity, true);
  assert.equal(hidden.participants.length, 3);
  assert.equal(Object.hasOwn(hidden, 'hideHoldingParticipants'), false);
  assert.equal(Object.hasOwn(hidden, 'hideAllHoldLedger'), false);
  assert.equal(Object.hasOwn(hidden, 'hideZeroShareParticipants'), false);
  assert.equal(Object.hasOwn(hidden, 'hideParticipantsOverCapacity'), false);
  assert.equal(Object.hasOwn(hidden, 'hideParticipantsAtHold'), false);
  app.click('show-without-capacity-participants');
  assert.equal(Object.hasOwn(app.saved(), 'hideParticipantsWithoutCapacity'), false);
  app.click('export');
  const shownFile = JSON.parse(await app.downloads()[1].blob.text());
  assert.equal(Object.hasOwn(shownFile, 'hideParticipantsWithoutCapacity'), false);
  assert.equal(forms(), 3);

  const imported = clonePreset('balanced');
  imported.hideParticipantsWithoutCapacity = true;
  app.import(imported);
  assert.equal(app.saved().hideParticipantsWithoutCapacity, true);
  assert.equal(forms(), 3);
  assert.match(app.markup(), /1 of 27 tested cases hold/);

  const omitted = clonePreset('balanced');
  app.import(omitted);
  assert.equal(Object.hasOwn(app.saved(), 'hideParticipantsWithoutCapacity'), false);
  assert.equal(forms(), 3);

  const invalid = clonePreset('balanced');
  invalid.hideParticipantsWithoutCapacity = 'true';
  app.import(invalid);
  assert.match(app.notice(), /boolean/);
  assert.equal(forms(), 3);

  const unknown = clonePreset('balanced');
  unknown.hideParticipantsWithoutCapacity = true;
  unknown.unexpected = true;
  app.import(unknown);
  assert.match(app.notice(), /unknown field: unexpected/);
});

test('hiding participants with unused listed capacity is display-only and expand restores the roster', async () => {
  const app = await workbench();
  app.click('dismiss-coach');
  const forms = () => app.markup().match(/class="participant-form/g)?.length ?? 0;
  const holdCount = () => app.markup().match(/([0-9]+) of 27 tested cases hold/)?.[1];
  assert.equal(forms(), 3);
  assert.match(app.markup(), /1 of 27 tested cases hold/);
  assert.match(app.markup(), /data-action="hide-spare-capacity-participants"/);
  assert.match(app.markup(), /data-action="hide-without-capacity-participants"/);
  assert.match(app.markup(), /data-action="hide-at-hold-participants"/);
  assert.match(app.markup(), /data-action="hide-over-capacity-participants"/);
  const beforeHide = holdCount();
  assert.ok(beforeHide);
  app.click('hide-spare-capacity-participants');
  assert.equal(forms(), 0);
  assert.match(app.markup(), /3 participants with unused listed capacity are hidden from this roster display/);
  assert.match(app.markup(), /Every displayed participant has unused listed capacity/);
  assert.match(app.markup(), /1 of 27 tested cases hold/);
  assert.equal(holdCount(), beforeHide);
  assert.equal(Object.hasOwn(app.saved(), 'hideParticipantsWithoutCapacity'), false);
  assert.equal(Object.hasOwn(app.saved(), 'hideParticipantsAtHold'), false);
  assert.equal(Object.hasOwn(app.saved(), 'hideParticipantsOverCapacity'), false);
  assert.equal(Object.hasOwn(app.saved(), 'hideZeroShareParticipants'), false);
  assert.equal(app.saved().hideParticipantsWithSpareCapacity, true);
  app.click('show-spare-capacity-participants');
  assert.equal(forms(), 3);
  app.edit('participants.0.capacity', '100000');
  assert.equal(forms(), 3);
  app.click('hide-spare-capacity-participants');
  assert.equal(forms(), 1);
  assert.match(app.markup(), /2 participants with unused listed capacity are hidden from this roster display/);
  assert.match(app.markup(), /Tested-case and model counts are unchanged/);
  assert.match(app.markup(), /Participant 1: Platform/);
  assert.doesNotMatch(app.markup(), /Participant 2: Distributor/);
  assert.match(app.markup(), /participant-live-name">Distributor/);
  assert.equal(holdCount(), beforeHide);
  app.click('export');
  const exported = JSON.parse(await app.downloads()[0].blob.text());
  assert.equal(exported.participants.length, 3);
  assert.equal(exported.participants[0].capacity, 100000);
  assert.equal(exported.hideParticipantsWithSpareCapacity, true);
  assert.equal(Object.hasOwn(exported, 'hideHoldingParticipants'), false);
  assert.equal(Object.hasOwn(exported, 'hideZeroShareParticipants'), false);
  assert.equal(Object.hasOwn(exported, 'hideAllHoldLedger'), false);
  assert.equal(Object.hasOwn(exported, 'hideParticipantsOverCapacity'), false);
  assert.equal(Object.hasOwn(exported, 'hideParticipantsAtHold'), false);
  assert.equal(Object.hasOwn(exported, 'hideParticipantsWithoutCapacity'), false);
  app.click('show-spare-capacity-participants');
  assert.equal(forms(), 3);
  assert.match(app.markup(), /Distributor/);
  assert.equal(holdCount(), beforeHide);
  app.edit('participants.0.capacity', '', { optional: 'true' });
  app.click('hide-spare-capacity-participants');
  assert.equal(forms(), 1);
  assert.match(app.markup(), /Participant 1: Platform/);
  assert.doesNotMatch(app.markup(), /Participant 2: Distributor/);
  app.edit('deal.monthlyVolume', '');
  app.click('hide-spare-capacity-participants');
  assert.match(app.notice(), /Resolve invalid inputs before hiding participants with unused listed capacity/);
});

test('hide-spare-capacity preference round-trips on saved JSON and defaults to shown', async () => {
  const app = await workbench();
  app.click('dismiss-coach');
  app.click('reset');
  assert.equal(Object.hasOwn(app.saved(), 'hideParticipantsWithSpareCapacity'), false);
  assert.equal(Object.hasOwn(app.saved(), 'hideHoldingParticipants'), false);
  assert.equal(Object.hasOwn(app.saved(), 'hideAllHoldLedger'), false);
  assert.equal(Object.hasOwn(app.saved(), 'hideZeroShareParticipants'), false);
  assert.equal(Object.hasOwn(app.saved(), 'hideParticipantsOverCapacity'), false);
  assert.equal(Object.hasOwn(app.saved(), 'hideParticipantsAtHold'), false);
  assert.equal(Object.hasOwn(app.saved(), 'hideParticipantsWithoutCapacity'), false);
  const forms = () => app.markup().match(/class="participant-form/g)?.length ?? 0;
  app.click('hide-spare-capacity-participants');
  assert.equal(app.saved().hideParticipantsWithSpareCapacity, true);
  assert.equal(Object.hasOwn(app.saved(), 'hideHoldingParticipants'), false);
  assert.equal(Object.hasOwn(app.saved(), 'hideAllHoldLedger'), false);
  assert.equal(Object.hasOwn(app.saved(), 'hideZeroShareParticipants'), false);
  assert.equal(Object.hasOwn(app.saved(), 'hideParticipantsOverCapacity'), false);
  assert.equal(Object.hasOwn(app.saved(), 'hideParticipantsAtHold'), false);
  assert.equal(Object.hasOwn(app.saved(), 'hideParticipantsWithoutCapacity'), false);
  assert.equal(forms(), 0);
  app.click('export');
  const hidden = JSON.parse(await app.downloads()[0].blob.text());
  assert.equal(hidden.hideParticipantsWithSpareCapacity, true);
  assert.equal(hidden.participants.length, 3);
  assert.equal(Object.hasOwn(hidden, 'hideHoldingParticipants'), false);
  assert.equal(Object.hasOwn(hidden, 'hideAllHoldLedger'), false);
  assert.equal(Object.hasOwn(hidden, 'hideZeroShareParticipants'), false);
  assert.equal(Object.hasOwn(hidden, 'hideParticipantsOverCapacity'), false);
  assert.equal(Object.hasOwn(hidden, 'hideParticipantsAtHold'), false);
  assert.equal(Object.hasOwn(hidden, 'hideParticipantsWithoutCapacity'), false);
  app.click('show-spare-capacity-participants');
  assert.equal(Object.hasOwn(app.saved(), 'hideParticipantsWithSpareCapacity'), false);
  app.click('export');
  const shownFile = JSON.parse(await app.downloads()[1].blob.text());
  assert.equal(Object.hasOwn(shownFile, 'hideParticipantsWithSpareCapacity'), false);
  assert.equal(forms(), 3);

  const imported = clonePreset('balanced');
  imported.hideParticipantsWithSpareCapacity = true;
  app.import(imported);
  assert.equal(app.saved().hideParticipantsWithSpareCapacity, true);
  assert.equal(forms(), 0);
  assert.match(app.markup(), /1 of 27 tested cases hold/);

  const omitted = clonePreset('balanced');
  app.import(omitted);
  assert.equal(Object.hasOwn(app.saved(), 'hideParticipantsWithSpareCapacity'), false);
  assert.equal(forms(), 3);

  const invalid = clonePreset('balanced');
  invalid.hideParticipantsWithSpareCapacity = 'true';
  app.import(invalid);
  assert.match(app.notice(), /boolean/);
  assert.equal(forms(), 3);

  const unknown = clonePreset('balanced');
  unknown.hideParticipantsWithSpareCapacity = true;
  unknown.unexpected = true;
  app.import(unknown);
  assert.match(app.notice(), /unknown field: unexpected/);
});

test('hiding the least-headroom participant is display-only and expand restores the roster', async () => {
  const app = await workbench();
  app.click('dismiss-coach');
  const forms = () => app.markup().match(/class="participant-form/g)?.length ?? 0;
  const holdCount = () => app.markup().match(/([0-9]+) of 27 tested cases hold/)?.[1];
  assert.equal(forms(), 3);
  assert.match(app.markup(), /1 of 27 tested cases hold/);
  assert.match(app.markup(), /data-action="hide-least-headroom-participants"/);
  assert.match(app.markup(), /data-action="hide-spare-capacity-participants"/);
  const beforeHide = holdCount();
  assert.ok(beforeHide);
  app.click('hide-least-headroom-participants');
  assert.equal(forms(), 2);
  assert.match(app.markup(), /1 least-headroom participant is hidden from this roster display/);
  assert.match(app.markup(), /1 of 27 tested cases hold/);
  assert.equal(holdCount(), beforeHide);
  assert.doesNotMatch(app.markup(), /id="least-headroom-participant"/);
  assert.match(app.markup(), /Participant 1: Platform/);
  assert.match(app.markup(), /Participant 2: Distributor/);
  assert.doesNotMatch(app.markup(), /Participant 3: Liquidity Partner/);
  assert.match(app.markup(), /participant-live-name">Liquidity Partner/);
  assert.equal(Object.hasOwn(app.saved(), 'hideParticipantsWithSpareCapacity'), false);
  assert.equal(Object.hasOwn(app.saved(), 'hideHoldingParticipants'), false);
  assert.equal(Object.hasOwn(app.saved(), 'hideZeroShareParticipants'), false);
  assert.equal(app.saved().hideParticipantsAtLeastHeadroom, true);
  app.click('show-least-headroom-participants');
  assert.equal(forms(), 3);
  assert.match(app.markup(), /id="least-headroom-participant"/);
  app.click('hide-least-headroom-participants');
  app.click('export');
  const exported = JSON.parse(await app.downloads()[0].blob.text());
  assert.equal(exported.participants.length, 3);
  assert.equal(exported.hideParticipantsAtLeastHeadroom, true);
  assert.equal(Object.hasOwn(exported, 'hideHoldingParticipants'), false);
  assert.equal(Object.hasOwn(exported, 'hideZeroShareParticipants'), false);
  assert.equal(Object.hasOwn(exported, 'hideAllHoldLedger'), false);
  assert.equal(Object.hasOwn(exported, 'hideParticipantsOverCapacity'), false);
  assert.equal(Object.hasOwn(exported, 'hideParticipantsAtHold'), false);
  assert.equal(Object.hasOwn(exported, 'hideParticipantsWithoutCapacity'), false);
  assert.equal(Object.hasOwn(exported, 'hideParticipantsWithSpareCapacity'), false);
  app.click('show-least-headroom-participants');
  assert.equal(forms(), 3);
  assert.match(app.markup(), /Liquidity Partner/);
  assert.equal(holdCount(), beforeHide);
  app.edit('deal.monthlyVolume', '');
  app.click('hide-least-headroom-participants');
  assert.match(app.notice(), /Resolve invalid inputs before hiding the least-headroom participant/);
});

test('hide-least-headroom preference round-trips on saved JSON and defaults to shown', async () => {
  const app = await workbench();
  app.click('dismiss-coach');
  app.click('reset');
  assert.equal(Object.hasOwn(app.saved(), 'hideParticipantsAtLeastHeadroom'), false);
  assert.equal(Object.hasOwn(app.saved(), 'hideParticipantsWithSpareCapacity'), false);
  assert.equal(Object.hasOwn(app.saved(), 'hideHoldingParticipants'), false);
  assert.equal(Object.hasOwn(app.saved(), 'hideAllHoldLedger'), false);
  assert.equal(Object.hasOwn(app.saved(), 'hideZeroShareParticipants'), false);
  assert.equal(Object.hasOwn(app.saved(), 'hideParticipantsOverCapacity'), false);
  assert.equal(Object.hasOwn(app.saved(), 'hideParticipantsAtHold'), false);
  assert.equal(Object.hasOwn(app.saved(), 'hideParticipantsWithoutCapacity'), false);
  const forms = () => app.markup().match(/class="participant-form/g)?.length ?? 0;
  app.click('hide-least-headroom-participants');
  assert.equal(app.saved().hideParticipantsAtLeastHeadroom, true);
  assert.equal(Object.hasOwn(app.saved(), 'hideParticipantsWithSpareCapacity'), false);
  assert.equal(Object.hasOwn(app.saved(), 'hideHoldingParticipants'), false);
  assert.equal(Object.hasOwn(app.saved(), 'hideAllHoldLedger'), false);
  assert.equal(Object.hasOwn(app.saved(), 'hideZeroShareParticipants'), false);
  assert.equal(Object.hasOwn(app.saved(), 'hideParticipantsOverCapacity'), false);
  assert.equal(Object.hasOwn(app.saved(), 'hideParticipantsAtHold'), false);
  assert.equal(Object.hasOwn(app.saved(), 'hideParticipantsWithoutCapacity'), false);
  assert.equal(forms(), 2);
  app.click('export');
  const hidden = JSON.parse(await app.downloads()[0].blob.text());
  assert.equal(hidden.hideParticipantsAtLeastHeadroom, true);
  assert.equal(hidden.participants.length, 3);
  assert.equal(Object.hasOwn(hidden, 'hideParticipantsWithSpareCapacity'), false);
  assert.equal(Object.hasOwn(hidden, 'hideHoldingParticipants'), false);
  assert.equal(Object.hasOwn(hidden, 'hideAllHoldLedger'), false);
  assert.equal(Object.hasOwn(hidden, 'hideZeroShareParticipants'), false);
  assert.equal(Object.hasOwn(hidden, 'hideParticipantsOverCapacity'), false);
  assert.equal(Object.hasOwn(hidden, 'hideParticipantsAtHold'), false);
  assert.equal(Object.hasOwn(hidden, 'hideParticipantsWithoutCapacity'), false);
  app.click('show-least-headroom-participants');
  assert.equal(Object.hasOwn(app.saved(), 'hideParticipantsAtLeastHeadroom'), false);
  app.click('export');
  const shownFile = JSON.parse(await app.downloads()[1].blob.text());
  assert.equal(Object.hasOwn(shownFile, 'hideParticipantsAtLeastHeadroom'), false);
  assert.equal(forms(), 3);

  const imported = clonePreset('balanced');
  imported.hideParticipantsAtLeastHeadroom = true;
  app.import(imported);
  assert.equal(app.saved().hideParticipantsAtLeastHeadroom, true);
  assert.equal(forms(), 2);
  assert.match(app.markup(), /1 of 27 tested cases hold/);

  const omitted = clonePreset('balanced');
  app.import(omitted);
  assert.equal(Object.hasOwn(app.saved(), 'hideParticipantsAtLeastHeadroom'), false);
  assert.equal(forms(), 3);

  const invalid = clonePreset('balanced');
  invalid.hideParticipantsAtLeastHeadroom = 'true';
  app.import(invalid);
  assert.match(app.notice(), /boolean/);
  assert.equal(forms(), 3);

  const unknown = clonePreset('balanced');
  unknown.hideParticipantsAtLeastHeadroom = true;
  unknown.unexpected = true;
  app.import(unknown);
  assert.match(app.notice(), /unknown field: unexpected/);
});

test('collapse all-hold preference round-trips on saved JSON and defaults to expanded', async () => {
  const app = await workbench();
  app.click('dismiss-coach');
  app.click('reset');
  assert.equal(Object.hasOwn(app.saved(), 'collapseAllHoldCases'), false);
  app.click('collapse-all-hold-cases');
  assert.equal(app.saved().collapseAllHoldCases, true);
  assert.doesNotMatch(app.markup(), /data-action="inspect-stress" data-scenario-id="case-1"/);
  app.click('export');
  const collapsed = JSON.parse(await app.downloads()[0].blob.text());
  assert.equal(collapsed.collapseAllHoldCases, true);
  app.click('expand-all-hold-cases');
  assert.equal(Object.hasOwn(app.saved(), 'collapseAllHoldCases'), false);
  app.click('export');
  const expandedFile = JSON.parse(await app.downloads()[1].blob.text());
  assert.equal(Object.hasOwn(expandedFile, 'collapseAllHoldCases'), false);
  assert.match(app.markup(), /data-action="inspect-stress" data-scenario-id="case-1"/);

  const imported = clonePreset('balanced');
  imported.collapseAllHoldCases = true;
  app.import(imported);
  assert.equal(app.saved().collapseAllHoldCases, true);
  assert.doesNotMatch(app.markup(), /data-action="inspect-stress" data-scenario-id="case-1"/);
  assert.match(app.markup(), /1 of 27 tested cases hold/);

  const omitted = clonePreset('balanced');
  app.import(omitted);
  assert.equal(Object.hasOwn(app.saved(), 'collapseAllHoldCases'), false);
  assert.match(app.markup(), /data-action="inspect-stress" data-scenario-id="case-1"/);

  const invalid = clonePreset('balanced');
  invalid.collapseAllHoldCases = 'true';
  app.import(invalid);
  assert.match(app.notice(), /boolean/);
});

test('copy allocation balance names missing or excess share and stays honest when empty', async () => {
  const fallback = await workbench();
  fallback.click('dismiss-coach');
  assert.match(fallback.markup(), /data-action="copy-allocation-balance"/);
  fallback.click('copy-allocation-balance');
  assert.equal(fallback.downloads().length, 0);
  assert.match(fallback.markup(), /id="allocation-copy-text"/);
  assert.match(fallback.markup(), /# Allocation balance/);
  assert.match(fallback.markup(), /Allocated: 100\.0%\. Shares reconcile to 100%\./);
  assert.match(fallback.markup(), /not a negotiated allocation/);
  assert.match(fallback.notice(), /Copy the Markdown from the text area/);
  fallback.click('close-allocation-copy');
  assert.doesNotMatch(fallback.markup(), /id="allocation-copy-text"/);

  fallback.edit('participants.0.revenueShare', '0.2');
  fallback.click('copy-allocation-balance');
  assert.match(fallback.markup(), /Allocated: 80\.0%\./);
  assert.match(fallback.markup(), /20\.0% remains unallocated/);
  fallback.click('close-allocation-copy');
  fallback.edit('participants.0.revenueShare', '0.6');
  fallback.click('copy-allocation-balance');
  assert.match(fallback.markup(), /Allocated: 120\.0%\./);
  assert.match(fallback.markup(), /20\.0% is overallocated/);
  fallback.click('close-allocation-copy');
  fallback.edit('participants.0.revenueShare', '');
  fallback.click('copy-allocation-balance');
  assert.match(fallback.markup(), /Enter each revenue share to calculate the allocation balance\./);
  assert.match(fallback.markup(), /not a negotiated allocation/);

  const withClipboard = await workbench('file:', { clipboard: 'ok' });
  withClipboard.click('copy-allocation-balance');
  assert.equal(withClipboard.copied().length, 1);
  assert.match(withClipboard.copied()[0], /# Allocation balance/);
  assert.match(withClipboard.copied()[0], /Allocated: 100\.0%\. Shares reconcile to 100%\./);
  assert.match(withClipboard.copied()[0], /not a negotiated allocation/);
  assert.doesNotMatch(withClipboard.copied()[0], /probab/i);
  assert.match(withClipboard.notice(), /copied as Markdown/);
  assert.doesNotMatch(withClipboard.markup(), /id="allocation-copy-text"/);

  const denied = await workbench('file:', { clipboard: 'fail' });
  denied.click('copy-allocation-balance');
  assert.match(denied.markup(), /id="allocation-copy-text"/);
  assert.match(denied.notice(), /Clipboard unavailable/);
});

test('copy share URL is http-only and names clipboard failure without a network request', async () => {
  const fileApp = await workbench('file:');
  assert.doesNotMatch(fileApp.markup(), /data-action="copy-share-url"/);
  const httpApp = await workbench('http:');
  httpApp.click('dismiss-coach');
  assert.match(httpApp.markup(), /data-action="copy-share-url"/);
  httpApp.click('copy-share-url');
  assert.match(httpApp.notice(), /Share URL/);
  assert.match(httpApp.notice(), /#deal=/);
  httpApp.edit('deal.monthlyVolume', '');
  httpApp.click('copy-share-url');
  assert.match(httpApp.notice(), /Resolve invalid inputs before copying a share URL/);
});

