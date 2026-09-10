import vm from 'node:vm';
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const readme = readFileSync(new URL('../README.md', import.meta.url), 'utf8');

test('catalog page keeps language, landmarks, skip, and focus contract', () => {
  assert.match(html, /<html lang="en">/);
  assert.match(html, /class="skip" href="#whats-new">Skip to what's new/);
  assert.match(html, /class="skip" href="#workbenches">Skip to workbenches/);
  assert.match(html, /class="skip" href="#how-it-works">Skip to How it works/);
  assert.match(html, /href="#shortcuts" id="skip-shortcuts">Skip to keyboard shortcuts/);
  assert.match(html, /class="skip" href="#trust">Skip to Trust and limits/);
  assert.match(html, /class="skip" href="#version-line">Skip to catalog versions/);
  assert.match(html, /id="how-it-works" tabindex="-1"/);
  assert.match(html, /id="catalog-heading" tabindex="-1"/);
  assert.match(html, /<header class="shell hero">/);
  assert.match(html, /<nav class="shell site-nav" aria-label="On this page">/);
  assert.match(html, /<main class="shell" id="main" tabindex="-1">/);
  assert.match(html, /<footer class="shell site-footer">/);
  assert.match(html, /a:focus-visible, button:focus-visible/);
  assert.match(html, /prefers-reduced-motion: reduce/);
  assert.match(html, /id="workbenches" tabindex="-1"/);
  assert.match(html, /id="whats-new" tabindex="-1"/);
});

test('catalog names jobs, samples, trust, and both actions', () => {
  assert.match(html, /Find which participant in a revenue split/);
  assert.match(html, /Pool buyer constraints and compare conditional merchant offers/);
  assert.match(html, /lowest-cost set of clause changes/);
  assert.match(html, /synthetic AUD redemption demand from Friday to Monday/);
  assert.match(html, /<strong>Balanced<\/strong>/);
  assert.match(html, /built-in synthetic <strong>coffee<\/strong> scenario/);
  assert.match(html, /<strong>Neighbourhood Plan<\/strong>/);
  assert.match(html, /<strong>Normal Friday<\/strong>/);
  assert.match(html, /id="how-it-works"/);
  assert.match(html, /standalone.html/);
  assert.match(html, /Export JSON/);
  assert.match(html, /do not share drafts/);
  assert.match(html, /id="trust"/);
  assert.match(html, /Not a decision maker/);
  assert.match(html, /This launcher does not serve those files/);
  assert.equal([...html.matchAll(/class="open"[^>]*>Open workbench<\/a>/g)].length, 4);
  assert.equal([...html.matchAll(/class="how" href="#how-it-works">How it works<\/a>/g)].length, 4);
  assert.match(html, /each ship their own version and changelog/);
});

test('keys 1-4 map to the four standalone workbenches and ignore inputs', () => {
  const opens = [...html.matchAll(/class="open" href="([^"]+)" aria-keyshortcuts="([1-4])"/g)];
  assert.deepEqual(opens.map((match) => [match[2], match[1]]), [
    ['1', 'apps/partnership-breakpoint/standalone.html'],
    ['2', 'apps/common-cart/standalone.html'],
    ['3', 'apps/smallest-agreement/standalone.html'],
    ['4', 'apps/weekend-gap/standalone.html'],
  ]);
  assert.match(html, /const keys = \{ 1: 0, 2: 1, 3: 2, 4: 3 \}/);
  assert.match(html, /input, textarea, select, \[contenteditable="true"\]/);
  assert.match(html, /window\.location\.assign\(link\.href\)/);
});

test('hub copy has no em dash and no placeholder text', () => {
  for (const [name, text] of [['index.html', html], ['README.md', readme]]) {
    assert.equal(text.includes('\u2014'), false, `${name} contains an em dash`);
    assert.equal(text.includes('\u2013'), false, `${name} contains an en dash`);
    assert.equal(/lorem ipsum/i.test(text), false, `${name} contains lorem`);
  }
});

test('inline catalog script parses as classic browser JavaScript', () => {
  const scripts = [...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/g)];
  assert.equal(scripts.length, 1);
  const [, attributes, source] = scripts[0];
  assert.equal(attributes.trim(), '');
  const result = spawnSync(process.execPath, ['--check'], {
    input: source,
    encoding: 'utf8',
  });
  assert.equal(result.status, 0, result.stderr || result.error?.message);
});

test('catalog names current workbench tools without live services', () => {
  assert.match(html, /id="whats-new"/);
  assert.match(html, /What's new/);
  assert.match(html, /Skip-link copy, last-card focus, and 404 Copy jobs/);
  assert.match(html, /Share-to-hold in Partnership Breakpoint/);
  assert.match(html, /Residual coverage in Common Cart/);
  assert.match(html, /Veto groups in The Smallest Agreement/);
  assert.match(html, /Gate Gantt in Weekend Gap/);
  assert.match(html, /CSV roster, capacity, and notes in Partnership Breakpoint 1\.4\.1/);
  assert.match(html, /Volume-to-hold, stress CSV, and studio preset in Partnership Breakpoint 1\.4\.2/);
  assert.match(html, /Roster export, file compare, and marketplace preset in Partnership Breakpoint 1\.4\.3/);
  assert.match(html, /Waterfall SVG, compare jump, and licensor preset in Partnership Breakpoint 1\.5\.1/);
  assert.match(html, /Waterfall copy, agency preset, and ledger filter in Partnership Breakpoint 1\.5\.2/);
  assert.match(html, /Tornado copy, JV preset, and stress jump in Partnership Breakpoint 1\.5\.3/);
  assert.match(html, /Least-headroom jump, podcast preset, and allocation copy in Partnership Breakpoint 1\.5\.4/);
  assert.match(html, /Leftover fill and overlap counts in Common Cart 1\.3\.1/);
  assert.match(html, /Offer CSV, sort, and leftover headroom in Common Cart 1\.3\.2/);
  assert.match(html, /Offer export, variant filter, and empty-offer recovery in Common Cart 1\.3\.3/);
  assert.match(html, /Buyer CSV, leftover jump, and garden preset in Common Cart 1\.4\.1/);
  assert.match(html, /Leftover copy, school fete, and overlap Markdown in Common Cart 1\.4\.2/);
  assert.match(html, /Leftover counts, fruit-box preset, and review jump in Common Cart 1\.4\.3/);
  assert.match(html, /Library paper preset, leftover headroom copy, and uncovered jump in Common Cart 1\.4\.4/);
  assert.match(html, /Package pin, locks, and notes in The Smallest Agreement 1\.4\.1/);
  assert.match(html, /Facilitator pack and group CSV in The Smallest Agreement 1\.4\.2/);
  assert.match(html, /Clause CSV, veto filter, and quiet-hours preset in The Smallest Agreement 1\.4\.3/);
  assert.match(html, /Locked-clause filter, fixture-night preset, and package copy in The Smallest Agreement 1\.5\.1/);
  assert.match(html, /Stall-hours preset, lock copy, and clause filters in The Smallest Agreement 1\.5\.2/);
  assert.match(html, /Bike-shed preset, package copy, and budget filter in The Smallest Agreement 1\.5\.3/);
  assert.match(html, /Stall lighting, remaining-budget copy, and floor jump in The Smallest Agreement 1\.5\.4/);
  assert.match(html, /Queue-clear hours and Gantt compare in Weekend Gap 1\.4\.1/);
  assert.match(html, /Queue CSV, peak jump, and long-weekend preset in Weekend Gap 1\.4\.2/);
  assert.match(html, /Dashboard copy, file compare, and compressed Friday in Weekend Gap 1\.4\.3/);
  assert.match(html, /Gantt hour copy, payday burst, and dashboard CSV in Weekend Gap 1\.5\.1/);
  assert.match(html, /Peak-hour copy, holiday Monday, and gate filter in Weekend Gap 1\.5\.2/);
  assert.match(html, /Hours-to-clear copy, Saturday market, and hour persist in Weekend Gap 1\.5\.3/);
  assert.match(html, /Sunday stall close, reserve copy, and weekend Gantt filter in Weekend Gap 1\.5\.4/);
  assert.match(html, /do not call a live partnership, merchant, vote, or bank/);
  assert.match(html, /Catalog cards list each workbench version next to its job/);
  assert.match(html, /not checkout, inventory, or a second live order/);
  assert.match(html, /not a legal right/);
  assert.match(html, /does not connect to a bank or a live redemption queue/);
  assert.match(html, /do not sync a live roster or quote capacity from a partner system/);
  assert.match(html, /not checkout or live inventory/);
  assert.match(html, /not a recorded vote or a legal hold/);
  assert.match(html, /href="#whats-new">What's new/);
  assert.doesNotMatch(html, /hosted API/i);
  assert.doesNotMatch(html, /live service/i);
  assert.match(readme, /What's new/);
  assert.match(readme, /share-to-hold,\s+residual\s+coverage, veto groups, and the gate Gantt/);
  assert.match(readme, /CSV roster, capacity, and notes/);
  assert.match(readme, /volume-to-hold, stress-grid CSV/);
  assert.match(readme, /roster export, imported-JSON compare/);
  assert.match(readme, /leftover\/tertiary fill/);
  assert.match(readme, /offer CSV import, buyer\s+sort/);
  assert.match(readme, /offer CSV export, variant\s+filter/);
  assert.match(readme, /organizer buyer\s+CSV, leftover jump/);
  assert.match(readme, /organizer leftover copy, school fete catering/);
  assert.match(readme, /uncovered leftover counts, the Office fruit box start/);
  assert.match(readme, /leftover headroom copy, the Library photocopy paper start/);
  assert.match(readme, /waterfall SVG download, compare and print keys/);
  assert.match(readme, /waterfall\s+Markdown copy, the Talent, agent, and platform start/);
  assert.match(readme, /tornado Markdown copy, the\s+Three-party joint venture start/);
  assert.match(readme, /allocation-balance\s+Markdown copy, the Podcast host and network start/);
  assert.match(readme, /package pin, locks, and notes/);
  assert.match(readme, /facilitator pack, group CSV/);
  assert.match(readme, /clause CSV\s+import, veto-only filter/);
  assert.match(readme, /locked-clause filter, Sports Fixture Night/);
  assert.match(readme, /Market stall hours start, lock Markdown copy/);
  assert.match(readme, /Shared bike shed start,\s+recommended-package Markdown copy/);
  assert.match(readme, /Street stall lighting start,\s+remaining change-budget copy/);
  assert.match(readme, /queue-clear hours and Gantt compare/);
  assert.match(readme, /queue CSV export, peak-queue jump/);
  assert.match(readme, /dashboard Markdown copy, two-file compare/);
  assert.match(readme, /Gantt hour Markdown copy,\s+Payday Friday burst/);
  assert.match(readme, /peak-queue hour copy, Public-holiday Monday/);
  assert.match(readme, /hours-to-clear Markdown copy, Saturday market\s+burst/);
  assert.match(readme, /remaining\s+reserve copy, Sunday stall close/);
  assert.match(readme, /skip-link copy, last-card focus, and 404 Copy jobs/);
  assert.match(readme, /does not change workbench versions/);
  assert.match(readme, /not hosted APIs/);
  assert.match(readme, /does not serve those\s+markdown files/);
  assert.match(readme, /Catalog keys `w`, `k`, `n`, and `c`/);
  assert.match(readme, /Copy versions on that 404 page copies/);
  assert.match(readme, /Copy Trust and limits on that 404 page copies/);
  assert.match(readme, /Copy How it works on that 404 page copies/);
  assert.match(readme, /Copy jobs on that 404 page copies/);
  assert.match(readme, /does not fetch a\s+policy file or add another public path/);
  assert.match(readme, /Key `m` focuses the main catalog content/);
  assert.match(readme, /Key `s` focuses the first Open\s+workbench link without opening it/);
  assert.match(readme, /Key `a` focuses the first workbench article/);
  assert.match(readme, /Key `f` focuses the footer version line/);
  assert.match(readme, /Key `p` prints this catalog page/);
  assert.match(readme, /not a live product\s+sheet/);
  assert.match(readme, /Key `i` copies Trust and limits from this page as Markdown/);
  assert.match(readme, /Key `u` copies How it works from this page as Markdown/);
  assert.match(readme, /Key `y`\s+copies the last-launched workbench name/);
  assert.match(readme, /not a\s+live policy feed/);
  assert.match(readme, /Key `x` clears that last-launched marker in this browser/);
  assert.match(readme, /this-browser storage, not a cloud recency/);
  assert.match(readme, /Keys `v` and `j` copy the printed version list/);
  assert.match(readme, /Keys `l` and `o` focus or open the last-launched workbench/);
  assert.match(readme, /Key `o` assigns a location like keys 1 to 4/);
  assert.match(readme, /does not claim a\s+copy succeeded on a file URL/);
  assert.match(readme, /Press `w` to focus the\s+workbenches/);
  assert.match(readme, /Press `k` to focus How it works/);
  assert.match(readme, /Press `n` to focus What's\s+new/);
  assert.match(readme, /Press `c` to copy the catalog address/);
  assert.match(readme, /Copy versions copies the four/);
  assert.match(readme, /not a live product version/);
  assert.match(html, /Copy versions/);
  assert.match(html, /not a live product version/);
  assert.match(html, /not a cloud recency/);
  assert.doesNotMatch(html, /hosted API/i);
  assert.doesNotMatch(html, /live service/i);
});

test('question-mark shortcut toggles an in-page panel and skips inputs', () => {
  assert.match(html, /id="shortcuts"/);
  assert.match(html, /aria-labelledby="shortcuts-title"/);
  assert.match(html, /event\.key === '\?'/);
  assert.match(html, /aria-controls="shortcuts"/);
  assert.match(html, /input, textarea, select, \[contenteditable="true"\]/);
  assert.match(html, /@media print[\s\S]*\.shortcuts/);
  assert.match(html, /@media print[\s\S]*\.whats-new/);
  assert.match(html, /@media print[\s\S]*\.version-line/);
  assert.match(html, /\.skip, \.skips, \.keys-note, \.how, \.site-nav, \.shortcuts/);
  assert.match(html, /@media print[\s\S]*\.shortcuts, \.shortcuts-open \{ display: none !important; \}/);
});

test('skip link reaches catalog versions without a public path', () => {
  assert.match(html, /class="skip" href="#version-line">Skip to catalog versions/);
  assert.match(html, /id="version-line" tabindex="-1"/);
  assert.match(html, /\.version-line:focus-visible/);
  assert.match(html, /href="#version-line">Versions/);
  assert.match(html, /const hashTargets = \['#whats-new', '#workbenches', '#how-it-works', '#trust', '#shortcuts', '#version-line'\]/);
  assert.match(readme, /catalog versions/);
});

test('skip link reaches How it works and the section can take focus', () => {
  assert.match(html, /class="skip" href="#how-it-works">Skip to How it works/);
  assert.match(html, /id="how-it-works" tabindex="-1"/);
  assert.match(html, /#how-it-works:focus-visible/);
  assert.match(html, /href="#how-it-works">How it works/);
});

test('h focuses the catalog heading when focus is not in an input', () => {
  assert.match(html, /id="catalog-heading" tabindex="-1"/);
  assert.match(html, /event\.key === 'h'/);
  assert.match(html, /getElementById\('catalog-heading'\)\?\.focus\(\)/);
  assert.match(html, /<kbd>h<\/kbd><\/dt><dd>Focus the catalog heading/);
  assert.match(html, /inEditable\(event\.target\)/);
});

test('m focuses the main catalog when focus is not in an input', () => {
  assert.match(html, /id="main" tabindex="-1"/);
  assert.match(html, /<main class="shell" id="main" tabindex="-1">/);
  assert.match(html, /event\.key === 'm'/);
  assert.match(html, /getElementById\('main'\)\?\.focus\(\)/);
  assert.match(html, /<kbd>m<\/kbd><\/dt><dd>Focus the main catalog content/);
  assert.match(html, /Press <kbd>m<\/kbd> to focus the main catalog/);
  assert.match(html, /inEditable\(event\.target\)/);
  assert.match(html, /#main:focus-visible/);
  assert.match(readme, /Press `m` to focus the\s+main catalog content/);
});

test('w focuses the workbenches when focus is not in an input', () => {
  assert.match(html, /id="workbenches" tabindex="-1"/);
  assert.match(html, /event\.key === 'w'/);
  assert.match(html, /getElementById\('workbenches'\)\?\.focus\(\)/);
  assert.match(html, /<kbd>w<\/kbd><\/dt><dd>Focus the workbenches/);
  assert.match(html, /Press <kbd>w<\/kbd> to focus the workbenches/);
  assert.match(html, /inEditable\(event\.target\)/);
  assert.match(html, /input, textarea, select, \[contenteditable="true"\]/);
  assert.match(readme, /Press `w` to focus the\s+workbenches/);
});

test('k focuses How it works when focus is not in an input', () => {
  assert.match(html, /id="how-it-works" tabindex="-1"/);
  assert.match(html, /event\.key === 'k'/);
  assert.match(html, /getElementById\('how-it-works'\)\?\.focus\(\)/);
  assert.match(html, /<kbd>k<\/kbd><\/dt><dd>Focus How it works/);
  assert.match(html, /Press <kbd>k<\/kbd> to focus How it works/);
  assert.match(html, /inEditable\(event\.target\)/);
  assert.match(readme, /Press `k` to focus How it works/);
});

test('n focuses What\'s new when focus is not in an input', () => {
  assert.match(html, /id="whats-new" tabindex="-1"/);
  assert.match(html, /event\.key === 'n'/);
  assert.match(html, /getElementById\('whats-new'\)\?\.focus\(\)/);
  assert.match(html, /<kbd>n<\/kbd><\/dt><dd>Focus What's new/);
  assert.match(html, /Press <kbd>n<\/kbd> to focus What's new/);
  assert.match(html, /inEditable\(event\.target\)/);
  assert.match(readme, /Press `n` to focus What's\s+new/);
});

test('t focuses Trust and limits when focus is not in an input', () => {
  assert.match(html, /id="trust" tabindex="-1"/);
  assert.match(html, /event\.key === 't'/);
  assert.match(html, /getElementById\('trust'\)\?\.focus\(\)/);
  assert.match(html, /<kbd>t<\/kbd><\/dt><dd>Focus Trust and limits/);
  assert.match(html, /Press <kbd>t<\/kbd> to focus Trust and limits/);
  assert.match(html, /inEditable\(event\.target\)/);
  assert.match(html, /#trust:focus-visible/);
  assert.match(html, /@media print[\s\S]*\.trust \{ display: block !important; \}/);
  assert.match(readme, /Press `t` to focus Trust and\s+limits/);
  assert.match(readme, /Skip links jump to What's new, workbenches, How it works,\s+keyboard shortcuts, Trust and limits, and catalog versions/);
});

test('g focuses the first What\'s new heading when focus is not in an input', () => {
  assert.match(html, /event\.key === 'g'/);
  assert.match(html, /querySelector\('#whats-new h3'\)/);
  assert.match(html, /getElementById\('whats-new-title'\)/);
  assert.match(html, /id="whats-new-title" tabindex="-1"/);
  assert.match(html, /#whats-new h3:focus-visible/);
  assert.match(html, /<kbd>g<\/kbd><\/dt><dd>Focus the first What's new heading/);
  assert.match(html, /Press <kbd>g<\/kbd> to focus the first What's new heading/);
  assert.match(html, /This key does not open a workbench/);
  assert.match(html, /inEditable\(event\.target\)/);
  assert.match(readme, /Press `g` to focus the first What's new heading/);
  assert.match(readme, /does not open a workbench/);
  const focused = [];
  const assigned = [];
  let keydown = null;
  const firstNews = { focus() { focused.push('h3'); } };
  const title = { focus() { focused.push('title'); } };
  const section = { focus() { focused.push('whats-new'); } };
  const document = {
    getElementById(id) {
      if (id === 'whats-new-title') return title;
      if (id === 'whats-new') return section;
      if (id === 'shortcuts') return { hidden: true };
      if (id === 'shortcuts-open') return { setAttribute() {}, addEventListener() {} };
      if (id === 'shortcuts-close') return { addEventListener() {} };
      if (id === 'skip-shortcuts') return { addEventListener() {} };
      return null;
    },
    querySelector(selector) {
      return selector === '#whats-new h3' ? firstNews : null;
    },
    querySelectorAll: () => [],
    addEventListener(name, handler) {
      if (name === 'keydown') keydown = handler;
    },
  };
  const source = html.match(/<script>([\s\S]*?)<\/script>/)[1];
  vm.runInNewContext(source, {
    document,
    location: { protocol: 'file:', hash: '' },
    localStorage: { getItem: () => null, setItem() {} },
    window: { location: { assign(href) { assigned.push(href); } } },
  });
  const fire = (key, target) => {
    keydown({
      key,
      target,
      defaultPrevented: false,
      altKey: false,
      ctrlKey: false,
      metaKey: false,
      shiftKey: false,
      preventDefault() {},
    });
  };
  const input = { tagName: 'INPUT', closest() { return input; } };
  const body = { tagName: 'BODY', closest() { return null; } };
  fire('g', input);
  assert.deepEqual(focused, []);
  assert.deepEqual(assigned, []);
  fire('g', body);
  assert.deepEqual(focused, ['h3']);
  assert.deepEqual(assigned, []);
});

test('g focuses the What\'s new heading when no item heading exists', () => {
  const focused = [];
  let keydown = null;
  const title = { focus() { focused.push('title'); } };
  const document = {
    getElementById(id) {
      if (id === 'whats-new-title') return title;
      if (id === 'whats-new') return { focus() { focused.push('whats-new'); } };
      if (id === 'shortcuts') return { hidden: true };
      if (id === 'shortcuts-open') return { setAttribute() {}, addEventListener() {} };
      if (id === 'shortcuts-close') return { addEventListener() {} };
      if (id === 'skip-shortcuts') return { addEventListener() {} };
      return null;
    },
    querySelector() { return null; },
    querySelectorAll: () => [],
    addEventListener(name, handler) {
      if (name === 'keydown') keydown = handler;
    },
  };
  const source = html.match(/<script>([\s\S]*?)<\/script>/)[1];
  vm.runInNewContext(source, {
    document,
    location: { protocol: 'file:', hash: '' },
    localStorage: { getItem: () => null, setItem() {} },
  });
  keydown({
    key: 'g',
    target: { tagName: 'BODY', closest() { return null; } },
    defaultPrevented: false,
    altKey: false,
    ctrlKey: false,
    metaKey: false,
    shiftKey: false,
    preventDefault() {},
  });
  assert.deepEqual(focused, ['title']);
});

test('r focuses the first review path when focus is not in an input', () => {
  assert.match(html, /event\.key === 'r'/);
  assert.match(html, /querySelector\('#workbench-1 \.review-path'\)\?\.focus\(\)/);
  assert.match(html, /class="review-path" tabindex="-1"/);
  assert.match(html, /\.review-path:focus-visible/);
  assert.match(html, /<kbd>r<\/kbd><\/dt><dd>Focus the first review path on the first workbench card/);
  assert.match(html, /Press <kbd>r<\/kbd> to focus the first review path/);
  assert.match(html, /This key moves focus; it does not open the workbench/);
  assert.match(html, /inEditable\(event\.target\)/);
  assert.match(readme, /Press `r` to focus the first review/);
  assert.match(readme, /does not open the workbench/);
  const focused = [];
  const assigned = [];
  let keydown = null;
  const review = { focus() { focused.push('review-path'); } };
  const document = {
    getElementById(id) {
      if (id === 'shortcuts') return { hidden: true };
      if (id === 'shortcuts-open') return { setAttribute() {}, addEventListener() {} };
      if (id === 'shortcuts-close') return { addEventListener() {} };
      if (id === 'skip-shortcuts') return { addEventListener() {} };
      return null;
    },
    querySelector(selector) {
      return selector === '#workbench-1 .review-path' ? review : null;
    },
    querySelectorAll: () => [],
    addEventListener(name, handler) {
      if (name === 'keydown') keydown = handler;
    },
  };
  const source = html.match(/<script>([\s\S]*?)<\/script>/)[1];
  vm.runInNewContext(source, {
    document,
    location: { protocol: 'file:', hash: '' },
    localStorage: { getItem: () => null, setItem() {} },
    window: { location: { assign(href) { assigned.push(href); } } },
  });
  const fire = (key, target) => {
    keydown({
      key,
      target,
      defaultPrevented: false,
      altKey: false,
      ctrlKey: false,
      metaKey: false,
      shiftKey: false,
      preventDefault() {},
    });
  };
  const input = { tagName: 'INPUT', closest() { return input; } };
  const textarea = { tagName: 'TEXTAREA', closest() { return textarea; } };
  const body = { tagName: 'BODY', closest() { return null; } };
  fire('r', input);
  fire('r', textarea);
  assert.deepEqual(focused, []);
  assert.deepEqual(assigned, []);
  fire('r', body);
  assert.deepEqual(focused, ['review-path']);
  assert.deepEqual(assigned, []);
});

test('b focuses the last workbench card when focus is not in an input', () => {
  assert.match(html, /event\.key === 'b'/);
  assert.match(html, /getElementById\('workbench-4'\)\?\.focus\(\)/);
  assert.match(html, /id="workbench-4" tabindex="-1"/);
  assert.match(html, /<kbd>b<\/kbd><\/dt><dd>Focus the last workbench card/);
  assert.match(html, /Press <kbd>b<\/kbd> to focus the last workbench card/);
  assert.match(html, /inEditable\(event\.target\)/);
  assert.match(html, /This key moves focus; it does not open the workbench/);
  assert.match(readme, /Press `b` to focus the last workbench card without opening/);
  assert.match(readme, /does not open the workbench/);
  const focused = [];
  const assigned = [];
  let keydown = null;
  const article = { focus() { focused.push('workbench-4'); } };
  const document = {
    getElementById(id) {
      if (id === 'workbench-4') return article;
      if (id === 'shortcuts') return { hidden: true };
      if (id === 'shortcuts-open') return { setAttribute() {}, addEventListener() {} };
      if (id === 'shortcuts-close') return { addEventListener() {} };
      if (id === 'skip-shortcuts') return { addEventListener() {} };
      return null;
    },
    querySelector: () => null,
    querySelectorAll: () => [],
    addEventListener(name, handler) {
      if (name === 'keydown') keydown = handler;
    },
  };
  const source = html.match(/<script>([\s\S]*?)<\/script>/)[1];
  vm.runInNewContext(source, {
    document,
    location: { protocol: 'file:', hash: '' },
    localStorage: { getItem: () => null, setItem() {} },
    window: { location: { assign(href) { assigned.push(href); } } },
  });
  const fire = (key, target) => {
    keydown({
      key,
      target,
      defaultPrevented: false,
      altKey: false,
      ctrlKey: false,
      metaKey: false,
      shiftKey: false,
      preventDefault() {},
    });
  };
  const input = { tagName: 'INPUT', closest() { return input; } };
  const body = { tagName: 'BODY', closest() { return null; } };
  fire('b', input);
  assert.deepEqual(focused, []);
  assert.deepEqual(assigned, []);
  fire('b', body);
  assert.deepEqual(focused, ['workbench-4']);
  assert.deepEqual(assigned, []);
});

test('a focuses the first workbench article when focus is not in an input', () => {
  assert.match(html, /event\.key === 'a'/);
  assert.match(html, /getElementById\('workbench-1'\)\?\.focus\(\)/);
  assert.match(html, /id="workbench-1" tabindex="-1"/);
  assert.match(html, /<kbd>a<\/kbd><\/dt><dd>Focus the first workbench article/);
  assert.match(html, /Press <kbd>a<\/kbd> to focus the first workbench article/);
  assert.match(html, /inEditable\(event\.target\)/);
  assert.match(html, /event\.key === 's'/);
  assert.match(html, /querySelector\('#workbenches a\.open'\)\?\.focus\(\)/);
  assert.match(readme, /Press `a` to focus the first workbench article without opening/);
  assert.match(readme, /distinct from `s`/);
  const focused = [];
  const assigned = [];
  let keydown = null;
  const article = { focus() { focused.push('workbench-1'); } };
  const firstOpen = { focus() { focused.push('open'); } };
  const document = {
    getElementById(id) {
      if (id === 'workbench-1') return article;
      if (id === 'shortcuts') return { hidden: true };
      if (id === 'shortcuts-open') return { setAttribute() {}, addEventListener() {} };
      if (id === 'shortcuts-close') return { addEventListener() {} };
      if (id === 'skip-shortcuts') return { addEventListener() {} };
      return null;
    },
    querySelector(selector) {
      return selector === '#workbenches a.open' ? firstOpen : null;
    },
    querySelectorAll: () => [],
    addEventListener(name, handler) {
      if (name === 'keydown') keydown = handler;
    },
  };
  const source = html.match(/<script>([\s\S]*?)<\/script>/)[1];
  vm.runInNewContext(source, {
    document,
    location: { protocol: 'file:', hash: '' },
    localStorage: { getItem: () => null, setItem() {} },
    window: { location: { assign(href) { assigned.push(href); } } },
  });
  const fire = (key, target) => {
    keydown({
      key,
      target,
      defaultPrevented: false,
      altKey: false,
      ctrlKey: false,
      metaKey: false,
      shiftKey: false,
      preventDefault() {},
    });
  };
  const input = { tagName: 'INPUT', closest() { return input; } };
  const body = { tagName: 'BODY', closest() { return null; } };
  fire('a', input);
  assert.deepEqual(focused, []);
  assert.deepEqual(assigned, []);
  fire('a', body);
  assert.deepEqual(focused, ['workbench-1']);
  assert.deepEqual(assigned, []);
  fire('s', body);
  assert.deepEqual(focused, ['workbench-1', 'open']);
  assert.deepEqual(assigned, []);
});

test('p prints this catalog page when focus is not in an input', () => {
  assert.match(html, /event\.key === 'p'/);
  assert.match(html, /printBtn\?\.click\(\)/);
  assert.match(html, /window\.print\(\)/);
  assert.match(html, /id="print-catalog"/);
  assert.match(html, /aria-keyshortcuts="p"/);
  assert.match(html, />Print this catalog</);
  assert.match(html, /<kbd>p<\/kbd><\/dt><dd>Print this catalog page. This prints the page in the browser, not a live product sheet./);
  assert.match(html, /Press <kbd>p<\/kbd> to print this catalog/);
  assert.match(html, /not a live product sheet/);
  assert.match(html, /inEditable\(event\.target\)/);
  assert.match(readme, /Press `p` to print this catalog/);
  assert.match(readme, /not a live product sheet/);
  const prints = [];
  const clicks = { print: 0 };
  let keydown = null;
  const win = { print() { prints.push('print'); } };
  const document = {
    getElementById(id) {
      if (id === 'print-catalog') {
        return {
          click() {
            clicks.print += 1;
            win.print();
          },
          addEventListener() {},
        };
      }
      if (id === 'shortcuts') return { hidden: true };
      if (id === 'shortcuts-open') return { setAttribute() {}, addEventListener() {} };
      if (id === 'shortcuts-close') return { addEventListener() {} };
      if (id === 'skip-shortcuts') return { addEventListener() {} };
      return null;
    },
    querySelector: () => null,
    querySelectorAll: () => [],
    addEventListener(name, handler) {
      if (name === 'keydown') keydown = handler;
    },
  };
  const source = html.match(/<script>([\s\S]*?)<\/script>/)[1];
  vm.runInNewContext(source, {
    document,
    location: { protocol: 'file:', hash: '' },
    localStorage: { getItem: () => null, setItem() {} },
    window: win,
  });
  const fire = (key, target) => {
    keydown({
      key,
      target,
      defaultPrevented: false,
      altKey: false,
      ctrlKey: false,
      metaKey: false,
      shiftKey: false,
      preventDefault() {},
    });
  };
  const input = { tagName: 'INPUT', closest() { return input; } };
  const body = { tagName: 'BODY', closest() { return null; } };
  fire('p', input);
  assert.deepEqual(prints, []);
  assert.equal(clicks.print, 0);
  fire('p', body);
  assert.deepEqual(prints, ['print']);
  assert.equal(clicks.print, 1);
});

test('f focuses the footer version line when focus is not in an input', () => {
  assert.match(html, /event\.key === 'f'/);
  assert.match(html, /querySelector\('\.version-line'\)\?\.focus\(\)/);
  assert.match(html, /id="version-line" tabindex="-1" class="version-line"/);
  assert.match(html, /<kbd>f<\/kbd><\/dt><dd>Focus the footer version line/);
  assert.match(html, /Press <kbd>f<\/kbd> to focus the footer version line/);
  assert.match(html, /inEditable\(event\.target\)/);
  assert.match(html, /\.version-line:focus-visible/);
  assert.match(readme, /Press `f` to focus the footer version line/);
  const focused = [];
  let keydown = null;
  const versionLine = { focus() { focused.push('version-line'); } };
  const document = {
    getElementById: () => null,
    querySelector(selector) {
      return selector === '.version-line' ? versionLine : null;
    },
    querySelectorAll: () => [],
    addEventListener(name, handler) {
      if (name === 'keydown') keydown = handler;
    },
  };
  const source = html.match(/<script>([\s\S]*?)<\/script>/)[1];
  vm.runInNewContext(source, {
    document,
    location: { protocol: 'file:', hash: '' },
    localStorage: { getItem: () => null, setItem() {} },
  });
  const fire = (key, target) => {
    keydown({
      key,
      target,
      defaultPrevented: false,
      altKey: false,
      ctrlKey: false,
      metaKey: false,
      shiftKey: false,
      preventDefault() {},
    });
  };
  const input = { tagName: 'INPUT', closest() { return input; } };
  const body = { tagName: 'BODY', closest() { return null; } };
  fire('f', input);
  assert.deepEqual(focused, []);
  fire('f', body);
  assert.deepEqual(focused, ['version-line']);
});

test('s focuses the first Open workbench link when focus is not in an input', () => {
  assert.match(html, /event\.key === 's'/);
  assert.match(html, /querySelector\('#workbenches a\.open'\)\?\.focus\(\)/);
  assert.match(html, /<kbd>s<\/kbd><\/dt><dd>Focus the first Open workbench link/);
  assert.match(html, /Press <kbd>s<\/kbd> to focus the first Open workbench link/);
  assert.match(html, /inEditable\(event\.target\)/);
  assert.match(readme, /Press `s` to focus the first Open\s+workbench link/);
  const focused = [];
  let keydown = null;
  const firstOpen = { focus() { focused.push('open'); } };
  const document = {
    getElementById: () => null,
    querySelector(selector) {
      return selector === '#workbenches a.open' ? firstOpen : null;
    },
    querySelectorAll: () => [],
    addEventListener(name, handler) {
      if (name === 'keydown') keydown = handler;
    },
  };
  const source = html.match(/<script>([\s\S]*?)<\/script>/)[1];
  vm.runInNewContext(source, {
    document,
    location: { protocol: 'file:', hash: '' },
    localStorage: { getItem: () => null, setItem() {} },
  });
  const fire = (key, target) => {
    keydown({
      key,
      target,
      defaultPrevented: false,
      altKey: false,
      ctrlKey: false,
      metaKey: false,
      shiftKey: false,
      preventDefault() {},
    });
  };
  const input = { tagName: 'INPUT', closest() { return input; } };
  const body = { tagName: 'BODY', closest() { return null; } };
  fire('s', input);
  assert.deepEqual(focused, []);
  fire('s', body);
  assert.deepEqual(focused, ['open']);
});

test('catalog does not use CSS animation', () => {
  const style = html.match(/<style>([\s\S]*?)<\/style>/)?.[1] ?? '';
  assert.doesNotMatch(style, /@keyframes/);
  assert.doesNotMatch(style, /animation\s*:/);
  assert.match(style, /prefers-reduced-motion:\s*reduce[\s\S]*transition:\s*none/);
});

test('copy catalog address control exists and stays hidden off http', () => {
  assert.match(html, /id="catalog-url-tools" hidden/);
  assert.match(html, /id="copy-catalog-url"/);
  assert.match(html, /Copy catalog address/);
  assert.match(html, /\/\^https\?:\$\/\.test\(location\.protocol\)/);
  assert.match(html, /urlTools\.hidden = false/);
  assert.match(html, /navigator\.clipboard\?\.writeText/);
  assert.match(html, /\.copy-catalog-url:focus-visible/);
  assert.match(html, /@media print[\s\S]*\.catalog-url-tools[\s\S]*display: none !important;/);
  assert.match(html, /The control stays hidden if you open the page from a file/);
});

test('print CSS hides copy how tools like copy trust and keeps How it works', () => {
  const print = html.match(/@media print \{([\s\S]*)\}\s*<\/style>/)?.[1] ?? '';
  assert.match(print, /\.copy-how-tools, \.copy-how-fallback, \.copy-last-tools, \.copy-last-fallback \{ display: none !important; \}/);
  assert.match(print, /\.copy-trust-tools, \.copy-trust-fallback \{ display: none !important; \}/);
  assert.match(print, /#how-it-works, \.guide \{ display: block !important; \}/);
  assert.match(print, /\.version-line/);
  assert.match(print, /\.whats-new, \.workbench \.version, \.version-line, \.trust \{ display: block !important; \}/);
  assert.match(html, /id="copy-how"/);
  assert.match(html, /id="copy-how-fallback"/);
});

test('print CSS hides copy jobs tools and keeps How it works and versions', () => {
  const print = html.match(/@media print \{([\s\S]*)\}\s*<\/style>/)?.[1] ?? '';
  assert.match(print, /\.copy-jobs-tools, \.copy-jobs-fallback, \.copy-trust-tools, \.copy-trust-fallback \{ display: none !important; \}/);
  assert.match(print, /\.copy-versions-tools, \.copy-versions-fallback, \.copy-jobs-tools, \.copy-jobs-fallback, \.copy-trust-tools, \.copy-trust-fallback \{ display: none !important; \}/);
  assert.match(print, /#how-it-works, \.guide \{ display: block !important; \}/);
  assert.match(print, /\.version-line/);
  assert.match(print, /\.whats-new, \.workbench \.version, \.version-line, \.trust \{ display: block !important; \}/);
});

test('print CSS hides copy trust tools like copy versions and copy jobs', () => {
  const print = html.match(/@media print \{([\s\S]*)\}\s*<\/style>/)?.[1] ?? '';
  assert.match(print, /\.copy-trust-tools, \.copy-trust-fallback \{ display: none !important; \}/);
  assert.match(print, /\.copy-versions-tools, \.copy-versions-fallback, \.copy-jobs-tools, \.copy-jobs-fallback, \.copy-trust-tools, \.copy-trust-fallback \{ display: none !important; \}/);
  assert.match(print, /\.trust \{ display: block !important; \}/);
  assert.match(html, /id="copy-trust"/);
  assert.match(html, /id="copy-trust-fallback"/);
});

test('print CSS keeps How it works and hides skip links', () => {
  const print = html.match(/@media print \{([\s\S]*)\}\s*<\/style>/)?.[1] ?? '';
  assert.match(print, /#how-it-works, \.guide \{ display: block !important; \}/);
  assert.match(print, /\.skips[\s\S]*display: none !important/);
  assert.match(print, /\.skip, \.skips, \.keys-note, \.how, \.site-nav, \.shortcuts, \.shortcuts-open \{ display: none !important; \}/);
  assert.match(html, /id="how-it-works"/);
});

test('invalid last-launched storage stays silent and shows no recency note', () => {
  const notes = Object.fromEntries(['1', '2', '3', '4'].map((key) => [key, { hidden: true }]));
  const document = {
    getElementById: () => null,
    querySelector(selector) {
      const match = String(selector).match(/data-last-workbench="([1-4])"/);
      return match ? notes[match[1]] : null;
    },
    querySelectorAll: () => [],
    addEventListener() {},
  };
  const source = html.match(/<script>([\s\S]*?)<\/script>/)[1];
  vm.runInNewContext(source, {
    document,
    location: { protocol: 'file:', hash: '' },
    localStorage: {
      getItem() { return 'not-a-workbench'; },
      setItem() {},
    },
  });
  for (const key of ['1', '2', '3', '4']) {
    assert.equal(notes[key].hidden, true, `workbench ${key} recency note should stay hidden`);
  }
});

test('unreadable last-launched storage stays silent and shows no recency note', () => {
  assert.match(html, /Last-launched storage that is missing or unreadable is silent/);
  assert.match(html, /the catalog shows no recency note/);
  assert.match(html, /not a cloud recency/);
  const notes = Object.fromEntries(['1', '2', '3', '4'].map((key) => [key, { hidden: true }]));
  const document = {
    getElementById: () => null,
    querySelector(selector) {
      const match = String(selector).match(/data-last-workbench="([1-4])"/);
      return match ? notes[match[1]] : null;
    },
    querySelectorAll: () => [],
    addEventListener() {},
  };
  const source = html.match(/<script>([\s\S]*?)<\/script>/)[1];
  vm.runInNewContext(source, {
    document,
    location: { protocol: 'file:', hash: '' },
    localStorage: {
      getItem() { throw new Error('Storage unreadable'); },
      setItem() { throw new Error('Storage unreadable'); },
    },
  });
  for (const key of ['1', '2', '3', '4']) {
    assert.equal(notes[key].hidden, true, `workbench ${key} recency note should stay hidden`);
  }
});

test('keys 1-4 remember last launched workbench in this browser', () => {
  assert.match(html, /decision-labs\.last-workbench/);
  assert.match(html, /localStorage\.setItem\(LAST_WORKBENCH_KEY, event\.key\)/);
  assert.match(html, /localStorage\.getItem\(LAST_WORKBENCH_KEY\)/);
  assert.match(html, /lastWorkbench === '1' \|\| lastWorkbench === '2' \|\| lastWorkbench === '3' \|\| lastWorkbench === '4'/);
  assert.match(html, /Last launched in this browser/);
  assert.match(html, /not a cloud recency/);
  assert.match(html, /Last-launched storage that is missing or unreadable is silent/);
  assert.equal([...html.matchAll(/class="last-launched" data-last-workbench="[1-4]" hidden/g)].length, 4);
  assert.match(html, /window\.location\.assign\(link\.href\)/);
});

test('load focuses skip-link hash targets', () => {
  assert.match(html, /const hashTargets = \['#whats-new', '#workbenches', '#how-it-works', '#trust', '#shortcuts', '#version-line'\]/);
  assert.match(html, /hashTargets\.includes\(location\.hash\)/);
  assert.match(html, /location\.hash\.slice\(1\)/);
  assert.match(html, /if \(id === 'shortcuts'\) setOpen\(true, \{ focus: false \}\)/);
  assert.match(html, /getElementById\(id\)\?\.focus\(\)/);
  assert.match(html, /id="whats-new" tabindex="-1"/);
  assert.match(html, /id="workbenches" tabindex="-1"/);
  assert.match(html, /id="how-it-works" tabindex="-1"/);
  assert.match(html, /id="trust" tabindex="-1"/);
  assert.match(html, /id="shortcuts"[^>]*tabindex="-1"/);
  assert.match(html, /id="version-line" tabindex="-1"/);
});

test('copy catalog intro copies heading and lede as Markdown with a visible fallback', () => {
  assert.match(html, /id="copy-lede"/);
  assert.match(html, />Copy catalog intro</);
  assert.match(html, /aria-keyshortcuts="e"/);
  assert.match(html, /id="copy-lede-fallback"/);
  assert.match(html, /class="copy-lede-fallback"/);
  assert.match(html, /textarea id="copy-lede-fallback"/);
  assert.match(html, /ledeMarkdown/);
  assert.match(html, /querySelector\('h1'\)/);
  assert.match(html, /querySelector\('p\.lede'\)/);
  assert.match(html, /navigator\.clipboard\?\.writeText/);
  assert.match(html, /ledeFallback\.hidden = false/);
  assert.match(html, /ledeFallback\.select\(\)/);
  assert.match(html, /Not a live product feed/);
  assert.match(html, /It is not a live product feed/);
  assert.doesNotMatch(html, /hosted API/i);
  assert.match(readme, /Copy catalog intro copies the catalog heading/);
  assert.match(readme, /not a live product feed/);
});

test('keyboard e copies catalog heading and lede through the same control', () => {
  assert.match(html, /event\.key === 'e'/);
  assert.match(html, /ledeBtn\?\.click\(\)/);
  assert.match(html, /inEditable\(event\.target\)/);
  assert.match(html, /aria-keyshortcuts="e"/);
  assert.match(html, /<kbd>e<\/kbd><\/dt><dd>Copy the catalog heading and lede as Markdown from this catalog page, not a live product feed/);
  assert.match(html, /Press <kbd>e<\/kbd> to copy the catalog heading and lede/);
  assert.match(html, /If those nodes are missing, this copies an empty string/);
  assert.match(readme, /Press `e` to copy the catalog heading and lede/);
  assert.match(readme, /copies an empty string/);
  const clicks = { lede: 0 };
  let keydown = null;
  const document = {
    getElementById(id) {
      if (id === 'copy-lede') return { click() { clicks.lede += 1; }, addEventListener() {} };
      if (id === 'shortcuts') return { hidden: true };
      if (id === 'shortcuts-open') return { setAttribute() {}, addEventListener() {} };
      if (id === 'shortcuts-close') return { addEventListener() {} };
      if (id === 'skip-shortcuts') return { addEventListener() {} };
      return null;
    },
    querySelector: () => null,
    querySelectorAll: () => [],
    addEventListener(name, handler) {
      if (name === 'keydown') keydown = handler;
    },
  };
  const source = html.match(/<script>([\s\S]*?)<\/script>/)[1];
  vm.runInNewContext(source, {
    document,
    location: { protocol: 'file:', hash: '' },
    localStorage: { getItem: () => null, setItem() {} },
  });
  const fire = (key, target) => {
    keydown({
      key,
      target,
      defaultPrevented: false,
      altKey: false,
      ctrlKey: false,
      metaKey: false,
      shiftKey: false,
      preventDefault() {},
    });
  };
  const input = { tagName: 'INPUT', closest() { return input; } };
  const textarea = { tagName: 'TEXTAREA', closest() { return textarea; } };
  const body = { tagName: 'BODY', closest() { return null; } };
  fire('e', input);
  fire('e', textarea);
  assert.equal(clicks.lede, 0);
  fire('e', body);
  assert.equal(clicks.lede, 1);
});

test('copy catalog intro markdown is heading plus lede, or empty if nodes are missing', async () => {
  let copied = '';
  let clickLede = null;
  const heading = { textContent: 'Decision Labs' };
  const lede = { textContent: 'Make the assumptions visible.' };
  const document = {
    getElementById(id) {
      if (id === 'copy-lede') return { addEventListener(name, handler) { if (name === 'click') clickLede = handler; } };
      if (id === 'copy-lede-status') return { textContent: '' };
      if (id === 'copy-lede-fallback') return { hidden: true, value: '', focus() {}, select() {} };
      return null;
    },
    querySelector(selector) {
      if (selector === 'h1') return heading;
      if (selector === 'p.lede') return lede;
      return null;
    },
    querySelectorAll: () => [],
    addEventListener() {},
  };
  const source = html.match(/<script>([\s\S]*?)<\/script>/)[1];
  vm.runInNewContext(source, {
    document,
    location: { protocol: 'file:', hash: '' },
    localStorage: { getItem: () => null, setItem() {} },
    navigator: { clipboard: { writeText: async (text) => { copied = text; } } },
  });
  await clickLede();
  assert.equal(copied, '# Decision Labs\n\nMake the assumptions visible.');
  heading.textContent = '';
  lede.textContent = '';
  copied = 'stale';
  await clickLede();
  assert.equal(copied, '');
});

test('copy catalog intro shows a visible textarea when clipboard is unavailable', async () => {
  let clickLede = null;
  const fallback = { hidden: true, value: '', focused: false, selected: false, focus() { this.focused = true; }, select() { this.selected = true; } };
  const status = { textContent: '' };
  const document = {
    getElementById(id) {
      if (id === 'copy-lede') return { addEventListener(name, handler) { if (name === 'click') clickLede = handler; } };
      if (id === 'copy-lede-status') return status;
      if (id === 'copy-lede-fallback') return fallback;
      return null;
    },
    querySelector(selector) {
      if (selector === 'h1') return { textContent: 'Decision Labs' };
      if (selector === 'p.lede') return { textContent: 'Make the assumptions visible.' };
      return null;
    },
    querySelectorAll: () => [],
    addEventListener() {},
  };
  const source = html.match(/<script>([\s\S]*?)<\/script>/)[1];
  vm.runInNewContext(source, {
    document,
    location: { protocol: 'file:', hash: '' },
    localStorage: { getItem: () => null, setItem() {} },
    navigator: {},
  });
  await clickLede();
  assert.equal(fallback.hidden, false);
  assert.equal(fallback.focused, true);
  assert.equal(fallback.selected, true);
  assert.equal(fallback.value, '# Decision Labs\n\nMake the assumptions visible.');
  assert.match(status.textContent, /Clipboard unavailable/);
  assert.match(status.textContent, /not a live product feed/);
});

test('print CSS hides copy lede tools and keeps How it works and versions', () => {
  const print = html.match(/@media print \{([\s\S]*)\}\s*<\/style>/)?.[1] ?? '';
  assert.match(print, /\.copy-lede-tools, \.copy-lede-fallback \{ display: none !important; \}/);
  assert.match(print, /#how-it-works, \.guide \{ display: block !important; \}/);
  assert.match(print, /\.whats-new, \.workbench \.version, \.version-line, \.trust \{ display: block !important; \}/);
});

test('copy skip links copies skip-link text and hash hrefs as Markdown with a visible fallback', () => {
  assert.match(html, /id="copy-skips"/);
  assert.match(html, />Copy skip links</);
  assert.match(html, /aria-keyshortcuts="z"/);
  assert.match(html, /id="copy-skips-fallback"/);
  assert.match(html, /class="copy-skips-fallback"/);
  assert.match(html, /textarea id="copy-skips-fallback"/);
  assert.match(html, /skipsMarkdown/);
  assert.match(html, /querySelectorAll\('\.skips a\.skip'\)/);
  assert.match(html, /navigator\.clipboard\?\.writeText/);
  assert.match(html, /skipsFallback\.hidden = false/);
  assert.match(html, /skipsFallback\.select\(\)/);
  assert.match(html, /not a sitemap API/);
  assert.match(html, /in-page navigation copy/);
  assert.doesNotMatch(html, /hosted API/i);
  assert.match(readme, /Copy skip links copies the six skip-link labels/);
  assert.match(readme, /not a sitemap API/);
});

test('keyboard z copies skip-link targets through the same control', () => {
  assert.match(html, /event\.key === 'z'/);
  assert.match(html, /skipsBtn\?\.click\(\)/);
  assert.match(html, /inEditable\(event\.target\)/);
  assert.match(html, /aria-keyshortcuts="z"/);
  assert.match(html, /<kbd>z<\/kbd><\/dt><dd>Copy the six skip-link targets as a Markdown list of skip-link text and hash hrefs/);
  assert.match(html, /This is in-page navigation copy, not a sitemap API/);
  assert.match(html, /Press <kbd>z<\/kbd> to copy skip-link targets/);
  assert.match(readme, /Press `z` to copy skip-link targets/);
  assert.match(readme, /not a sitemap API/);
  const clicks = { skips: 0 };
  let keydown = null;
  const document = {
    getElementById(id) {
      if (id === 'copy-skips') return { click() { clicks.skips += 1; }, addEventListener() {} };
      if (id === 'shortcuts') return { hidden: true };
      if (id === 'shortcuts-open') return { setAttribute() {}, addEventListener() {} };
      if (id === 'shortcuts-close') return { addEventListener() {} };
      if (id === 'skip-shortcuts') return { addEventListener() {} };
      return null;
    },
    querySelector: () => null,
    querySelectorAll: () => [],
    addEventListener(name, handler) {
      if (name === 'keydown') keydown = handler;
    },
  };
  const source = html.match(/<script>([\s\S]*?)<\/script>/)[1];
  vm.runInNewContext(source, {
    document,
    location: { protocol: 'file:', hash: '' },
    localStorage: { getItem: () => null, setItem() {} },
  });
  const fire = (key, target) => {
    keydown({
      key,
      target,
      defaultPrevented: false,
      altKey: false,
      ctrlKey: false,
      metaKey: false,
      shiftKey: false,
      preventDefault() {},
    });
  };
  const input = { tagName: 'INPUT', closest() { return input; } };
  const textarea = { tagName: 'TEXTAREA', closest() { return textarea; } };
  const body = { tagName: 'BODY', closest() { return null; } };
  fire('z', input);
  fire('z', textarea);
  assert.equal(clicks.skips, 0);
  fire('z', body);
  assert.equal(clicks.skips, 1);
});

test('copy skip links markdown is heading text plus hash hrefs from the skip links', async () => {
  let copied = '';
  let clickSkips = null;
  const links = [
    { textContent: 'Skip to what\'s new', getAttribute() { return '#whats-new'; } },
    { textContent: 'Skip to workbenches', getAttribute() { return '#workbenches'; } },
    { textContent: 'Skip to How it works', getAttribute() { return '#how-it-works'; } },
    { textContent: 'Skip to keyboard shortcuts', getAttribute() { return '#shortcuts'; } },
    { textContent: 'Skip to Trust and limits', getAttribute() { return '#trust'; } },
    { textContent: 'Skip to catalog versions', getAttribute() { return '#version-line'; } },
  ];
  const document = {
    getElementById(id) {
      if (id === 'copy-skips') return { addEventListener(name, handler) { if (name === 'click') clickSkips = handler; } };
      if (id === 'copy-skips-status') return { textContent: '' };
      if (id === 'copy-skips-fallback') return { hidden: true, value: '', focus() {}, select() {} };
      return null;
    },
    querySelector: () => null,
    querySelectorAll(selector) {
      return selector === '.skips a.skip' ? links : [];
    },
    addEventListener() {},
  };
  const source = html.match(/<script>([\s\S]*?)<\/script>/)[1];
  vm.runInNewContext(source, {
    document,
    location: { protocol: 'file:', hash: '' },
    localStorage: { getItem: () => null, setItem() {} },
    navigator: { clipboard: { writeText: async (text) => { copied = text; } } },
  });
  await clickSkips();
  assert.equal(
    copied,
    "- Skip to what's new (#whats-new)\n- Skip to workbenches (#workbenches)\n- Skip to How it works (#how-it-works)\n- Skip to keyboard shortcuts (#shortcuts)\n- Skip to Trust and limits (#trust)\n- Skip to catalog versions (#version-line)",
  );
  assert.doesNotMatch(copied, /sitemap API/);
});

test('copy skip links shows a visible textarea when clipboard is unavailable', async () => {
  let clickSkips = null;
  const fallback = { hidden: true, value: '', focused: false, selected: false, focus() { this.focused = true; }, select() { this.selected = true; } };
  const status = { textContent: '' };
  const links = [
    { textContent: 'Skip to what\'s new', getAttribute() { return '#whats-new'; } },
  ];
  const document = {
    getElementById(id) {
      if (id === 'copy-skips') return { addEventListener(name, handler) { if (name === 'click') clickSkips = handler; } };
      if (id === 'copy-skips-status') return status;
      if (id === 'copy-skips-fallback') return fallback;
      return null;
    },
    querySelector: () => null,
    querySelectorAll(selector) {
      return selector === '.skips a.skip' ? links : [];
    },
    addEventListener() {},
  };
  const source = html.match(/<script>([\s\S]*?)<\/script>/)[1];
  vm.runInNewContext(source, {
    document,
    location: { protocol: 'file:', hash: '' },
    localStorage: { getItem: () => null, setItem() {} },
    navigator: {},
  });
  await clickSkips();
  assert.equal(fallback.hidden, false);
  assert.equal(fallback.focused, true);
  assert.equal(fallback.selected, true);
  assert.equal(fallback.value, "- Skip to what's new (#whats-new)");
  assert.match(status.textContent, /Clipboard unavailable/);
  assert.match(status.textContent, /not a sitemap API/);
});

test('print CSS hides copy skip tools and keeps How it works and versions', () => {
  const print = html.match(/@media print \{([\s\S]*)\}\s*<\/style>/)?.[1] ?? '';
  assert.match(print, /\.copy-skips-tools, \.copy-skips-fallback \{ display: none !important; \}/);
  assert.match(print, /\.copy-lede-tools, \.copy-lede-fallback \{ display: none !important; \}/);
  assert.match(print, /#how-it-works, \.guide \{ display: block !important; \}/);
  assert.match(print, /\.whats-new, \.workbench \.version, \.version-line, \.trust \{ display: block !important; \}/);
});

test('copy jobs copies catalog names and jobs as Markdown with a visible fallback', () => {
  assert.match(html, /id="copy-jobs"/);
  assert.match(html, />Copy jobs</);
  assert.match(html, /aria-keyshortcuts="j"/);
  assert.match(html, /id="copy-jobs-fallback"/);
  assert.match(html, /class="copy-jobs-fallback"/);
  assert.match(html, /textarea id="copy-jobs-fallback"/);
  assert.match(html, /jobsMarkdown/);
  assert.match(html, /querySelectorAll\('article\.workbench'\)/);
  assert.match(html, /querySelector\('p\.job'\)/);
  assert.match(html, /navigator\.clipboard\?\.writeText/);
  assert.match(html, /jobsFallback\.hidden = false/);
  assert.match(html, /jobsFallback\.select\(\)/);
  assert.match(html, /Not a live product feed/);
  assert.match(html, /It is not a live product feed/);
  assert.equal([...html.matchAll(/class="job">/g)].length, 4);
  assert.doesNotMatch(html, /hosted API/i);
  assert.match(readme, /Copy jobs copies the four workbench names/);
  assert.match(readme, /not a live product feed/);
});

test('copy How it works copies the printed heading and list as Markdown with a visible fallback', () => {
  assert.match(html, /id="copy-how"/);
  assert.match(html, />Copy How it works</);
  assert.match(html, /aria-keyshortcuts="u"/);
  assert.match(html, /id="copy-how-fallback"/);
  assert.match(html, /class="copy-how-fallback"/);
  assert.match(html, /textarea id="copy-how-fallback"/);
  assert.match(html, /howMarkdown/);
  assert.match(html, /getElementById\('how-it-works'\)/);
  assert.match(html, /querySelectorAll\('ul li'\)/);
  assert.match(html, /navigator\.clipboard\?\.writeText/);
  assert.match(html, /howFallback\.hidden = false/);
  assert.match(html, /howFallback\.select\(\)/);
  assert.match(html, /Not a live policy feed/);
  assert.match(html, /id="how-it-works"/);
  assert.match(html, /id="how-title"/);
  assert.doesNotMatch(html, /hosted API/i);
  assert.match(readme, /Copy How it works copies the How it works heading/);
  assert.match(readme, /not a live policy feed/);
});

test('copy Trust copies the printed heading and list as Markdown with a visible fallback', () => {
  assert.match(html, /id="copy-trust"/);
  assert.match(html, />Copy Trust and limits</);
  assert.match(html, /id="copy-trust-fallback"/);
  assert.match(html, /class="copy-trust-fallback"/);
  assert.match(html, /textarea id="copy-trust-fallback"/);
  assert.match(html, /trustMarkdown/);
  assert.match(html, /getElementById\('trust'\)/);
  assert.match(html, /querySelectorAll\('ul li'\)/);
  assert.match(html, /navigator\.clipboard\?\.writeText/);
  assert.match(html, /trustFallback\.hidden = false/);
  assert.match(html, /trustFallback\.select\(\)/);
  assert.match(html, /Not a live policy feed/);
  assert.match(html, /It is not a live policy feed/);
  assert.match(html, /id="trust"/);
  assert.match(html, /id="trust-title"/);
  assert.doesNotMatch(html, /hosted API/i);
  assert.match(readme, /Copy Trust and limits copies the Trust and limits heading/);
  assert.match(readme, /not a live policy feed/);
});

test('copy versions copies catalog names as Markdown with a visible fallback', () => {
  assert.match(html, /id="copy-versions"/);
  assert.match(html, />Copy versions</);
  assert.match(html, /aria-keyshortcuts="v"/);
  assert.match(html, /id="copy-versions-fallback"/);
  assert.match(html, /class="copy-versions-fallback"/);
  assert.match(html, /textarea id="copy-versions-fallback"/);
  assert.match(html, /versionsMarkdown/);
  assert.match(html, /querySelector\('\.version-line'\)/);
  assert.match(html, /#workbench-versions \[data-app\]/);
  assert.match(html, /navigator\.clipboard\?\.writeText/);
  assert.match(html, /versionsFallback\.hidden = false/);
  assert.match(html, /versionsFallback\.select\(\)/);
  assert.match(html, /Not a live product version/);
  assert.match(html, /It is not a live product version and it does not call a registry/);
  assert.match(html, /@media print[\s\S]*\.copy-versions-tools/);
  assert.doesNotMatch(html, /hosted API/i);
});

test('shortcuts panel lists b e g q r z with honest limits', () => {
  assert.match(html, /<kbd>b<\/kbd><\/dt><dd>Focus the last workbench card. This key moves focus; it does not open the workbench./);
  assert.match(html, /<kbd>e<\/kbd><\/dt><dd>Copy the catalog heading and lede as Markdown from this catalog page, not a live product feed/);
  assert.match(html, /<kbd>g<\/kbd><\/dt><dd>Focus the first What's new heading. This key does not open a workbench./);
  assert.match(html, /<kbd>q<\/kbd><\/dt><dd>Copy workbench names and one-sentence jobs as Markdown from this catalog page, not a live product feed. This key uses the same Copy jobs control as <kbd>j<\/kbd>. It does not fork that Markdown./);
  assert.match(html, /<kbd>r<\/kbd><\/dt><dd>Focus the first review path on the first workbench card. This key moves focus; it does not open the workbench./);
  assert.match(html, /<kbd>z<\/kbd><\/dt><dd>Copy the six skip-link targets as a Markdown list of skip-link text and hash hrefs from the skip links on this page. This is in-page navigation copy, not a sitemap API./);
  assert.match(html, /Shortcuts are ignored while focus is in an input, textarea, or select/);
  assert.match(html, /not a live product feed/);
  assert.match(html, /not a sitemap API/);
  assert.match(html, /id="copy-lede"/);
  assert.match(html, /id="copy-skips"/);
  assert.match(html, /id="copy-jobs"/);
});

test('shortcuts panel lists v l o j with honest limits', () => {
  assert.match(html, /<kbd>v<\/kbd><\/dt><dd>Copy workbench names and versions as Markdown from this catalog page, not a live product version/);
  assert.match(html, /<kbd>j<\/kbd><\/dt><dd>Copy workbench names and one-sentence jobs as Markdown from this catalog page, not a live product feed/);
  assert.match(html, /<kbd>l<\/kbd><\/dt><dd>Focus the last-launched workbench card, or the workbenches heading if none is stored/);
  assert.match(html, /not a cloud recency/);
  assert.match(html, /<kbd>o<\/kbd><\/dt><dd>Open the last-launched workbench, the same as keys 1 to 4/);
  assert.match(html, /This key assigns a location; it does not copy/);
  assert.match(html, /It does not claim a copy succeeded on a file URL/);
  assert.match(readme, /Keys `v` and `j` copy the printed version list/);
  assert.match(readme, /Keys `l` and `o` focus or open the last-launched workbench/);
  assert.match(readme, /Key `o` assigns a location like keys 1 to 4/);
  assert.match(readme, /It does not claim a\s+copy succeeded on a file URL/);
});

test('shortcuts panel lists f p a u y with honest limits', () => {
  assert.match(html, /<kbd>f<\/kbd><\/dt><dd>Focus the footer version line. This key does not open a workbench./);
  assert.match(html, /<kbd>p<\/kbd><\/dt><dd>Print this catalog page. This prints the page in the browser, not a live product sheet./);
  assert.match(html, /<kbd>a<\/kbd><\/dt><dd>Focus the first workbench article. This key moves focus to the card; it does not open the workbench./);
  assert.match(html, /<kbd>u<\/kbd><\/dt><dd>Copy How it works as Markdown from this catalog page, not a live policy feed. Clipboard write uses the visible text box when the clipboard API is unavailable./);
  assert.match(html, /<kbd>y<\/kbd><\/dt><dd>Copy the last-launched workbench name and one-sentence job as Markdown from this-browser storage, or an empty line if none is stored. This is not a cloud recency. Clipboard write uses the visible text box when the clipboard API is unavailable./);
  assert.match(html, /id="print-catalog"/);
  assert.match(html, /id="copy-how"/);
  assert.match(html, /id="copy-last"/);
  assert.match(html, /Shortcuts are ignored while focus is in an input, textarea, or select/);
  assert.match(html, /not a live product sheet/);
  assert.match(html, /not a live policy feed/);
  assert.match(html, /not a cloud recency/);
});

test('shortcuts panel lists m x i s with honest limits', () => {
  assert.match(html, /<kbd>m<\/kbd><\/dt><dd>Focus the main catalog content. This key does not open a workbench./);
  assert.match(html, /<kbd>x<\/kbd><\/dt><dd>Clear last-launched storage in this browser and hide the recency notes. This is this-browser storage, not a cloud recency. A storage write failure stays silent and does not clear drafts./);
  assert.match(html, /<kbd>i<\/kbd><\/dt><dd>Copy Trust and limits as Markdown from this catalog page, not a live policy feed. Clipboard write uses the visible text box when the clipboard API is unavailable./);
  assert.match(html, /<kbd>s<\/kbd><\/dt><dd>Focus the first Open workbench link. This key moves focus; it does not open the workbench./);
  assert.match(html, /Shortcuts are ignored while focus is in an input, textarea, or select/);
  assert.match(html, /not a live policy feed/);
  assert.match(html, /not a cloud recency/);
});

test('keyboard o opens the last-launched workbench like keys 1 to 4', () => {
  assert.match(html, /event\.key === 'o'/);
  assert.match(html, /inEditable\(event\.target\)/);
  assert.match(html, /window\.location\.assign\(link\.href\)/);
  assert.match(html, /localStorage\.setItem\(LAST_WORKBENCH_KEY, stored\)/);
  assert.match(html, /querySelectorAll\('#workbenches a\.open'\)\[index\]/);
  assert.match(html, /<kbd>o<\/kbd><\/dt><dd>Open the last-launched workbench, the same as keys 1 to 4/);
  assert.match(html, /This key assigns a location; it does not copy/);
  assert.match(html, /Press <kbd>o<\/kbd> to open it/);
  assert.match(readme, /Press `o` to\s+open that last-launched workbench/);
  assert.match(readme, /It does not copy, including\s+on a file URL/);
  assert.match(html, /This key assigns a location; it does not copy/);
});

test('keyboard x clears last-launched storage in this browser', () => {
  assert.match(html, /event\.key === 'x'/);
  assert.match(html, /inEditable\(event\.target\)/);
  assert.match(html, /localStorage\.removeItem\(LAST_WORKBENCH_KEY\)/);
  assert.match(html, /querySelectorAll\('\.last-launched'\)/);
  assert.match(html, /note\.hidden = true/);
  assert.match(html, /<kbd>x<\/kbd><\/dt><dd>Clear last-launched storage in this browser and hide the recency notes/);
  assert.match(html, /This is this-browser storage, not a cloud recency/);
  assert.match(html, /Press <kbd>x<\/kbd> to clear last-launched in this browser/);
  assert.match(html, /not a cloud recency/);
  assert.match(readme, /Press `x` to clear last-launched storage in this browser/);
  assert.match(readme, /not a cloud recency/);
  const notes = Object.fromEntries(['1', '2', '3', '4'].map((key) => [key, { hidden: false }]));
  const stored = { value: '2' };
  let keydown = null;
  const document = {
    getElementById: () => null,
    querySelector: () => null,
    querySelectorAll(selector) {
      if (selector === '.last-launched') return Object.values(notes);
      return [];
    },
    addEventListener(name, handler) {
      if (name === 'keydown') keydown = handler;
    },
  };
  const source = html.match(/<script>([\s\S]*?)<\/script>/)[1];
  vm.runInNewContext(source, {
    document,
    location: { protocol: 'file:', hash: '' },
    localStorage: {
      getItem() { return stored.value; },
      setItem(key, value) { stored.value = value; },
      removeItem() { stored.value = null; },
    },
  });
  keydown({
    key: 'x',
    target: { tagName: 'BODY', closest() { return null; } },
    defaultPrevented: false,
    altKey: false,
    ctrlKey: false,
    metaKey: false,
    shiftKey: false,
    preventDefault() {},
  });
  assert.equal(stored.value, null);
  for (const key of ['1', '2', '3', '4']) {
    assert.equal(notes[key].hidden, true, `workbench ${key} recency note should hide`);
  }
});

test('keyboard l focuses the last-launched workbench card in this browser', () => {
  assert.match(html, /event\.key === 'l'/);
  assert.match(html, /inEditable\(event\.target\)/);
  assert.match(html, /data-workbench="1"/);
  assert.match(html, /data-workbench="4"/);
  assert.match(html, /querySelector\('\.workbench\[data-workbench="' \+ stored \+ '"\]'\)/);
  assert.match(html, /card\.focus\(\)/);
  assert.match(html, /getElementById\('workbenches'\)\?\.focus\(\)/);
  assert.match(html, /<kbd>l<\/kbd><\/dt><dd>Focus the last-launched workbench card, or the workbenches heading if none is stored/);
  assert.match(html, /Press <kbd>l<\/kbd> to focus the last-launched workbench/);
  assert.match(html, /not a cloud recency/);
  assert.match(readme, /Press `l` to focus the workbench card/);
  assert.match(readme, /not a cloud recency/);
});

test('keyboard q copies catalog jobs through the same Copy jobs control', () => {
  assert.match(html, /event\.key === 'q'/);
  assert.match(html, /jobsBtn\?\.click\(\)/);
  assert.match(html, /inEditable\(event\.target\)/);
  assert.match(html, /<kbd>q<\/kbd><\/dt><dd>Copy workbench names and one-sentence jobs as Markdown from this catalog page, not a live product feed/);
  assert.match(html, /This key uses the same Copy jobs control as <kbd>j<\/kbd>/);
  assert.match(html, /It does not fork that Markdown/);
  assert.match(html, /Press <kbd>q<\/kbd> to copy catalog jobs through the same control/);
  assert.match(readme, /Press `q` to copy catalog jobs through that same Copy jobs control/);
  assert.match(readme, /does not fork that Markdown/);
  const clicks = { jobs: 0 };
  let keydown = null;
  const document = {
    getElementById(id) {
      if (id === 'copy-jobs') return { click() { clicks.jobs += 1; }, addEventListener() {} };
      if (id === 'shortcuts') return { hidden: true };
      if (id === 'shortcuts-open') return { setAttribute() {}, addEventListener() {} };
      if (id === 'shortcuts-close') return { addEventListener() {} };
      if (id === 'skip-shortcuts') return { addEventListener() {} };
      return null;
    },
    querySelector: () => null,
    querySelectorAll: () => [],
    addEventListener(name, handler) {
      if (name === 'keydown') keydown = handler;
    },
  };
  const source = html.match(/<script>([\s\S]*?)<\/script>/)[1];
  vm.runInNewContext(source, {
    document,
    location: { protocol: 'file:', hash: '' },
    localStorage: { getItem: () => null, setItem() {} },
  });
  const fire = (key, target) => {
    keydown({
      key,
      target,
      defaultPrevented: false,
      altKey: false,
      ctrlKey: false,
      metaKey: false,
      shiftKey: false,
      preventDefault() {},
    });
  };
  const input = { tagName: 'INPUT', closest() { return input; } };
  const textarea = { tagName: 'TEXTAREA', closest() { return textarea; } };
  const select = { tagName: 'SELECT', closest() { return select; } };
  const body = { tagName: 'BODY', closest() { return null; } };
  fire('q', input);
  fire('q', textarea);
  fire('q', select);
  assert.equal(clicks.jobs, 0);
  fire('q', body);
  assert.equal(clicks.jobs, 1);
  fire('j', body);
  assert.equal(clicks.jobs, 2);
});

test('keyboard j copies catalog jobs through the same control', () => {
  assert.match(html, /event\.key === 'j'/);
  assert.match(html, /jobsBtn\?\.click\(\)/);
  assert.match(html, /inEditable\(event\.target\)/);
  assert.match(html, /<kbd>j<\/kbd><\/dt><dd>Copy workbench names and one-sentence jobs as Markdown/);
  assert.match(html, /Press <kbd>j<\/kbd> to copy catalog jobs/);
  assert.match(readme, /Press `j` to copy catalog jobs/);
  assert.match(html, /jobsMarkdown/);
  assert.match(html, /jobsFallback\.hidden = false/);
});

test('keyboard y copies the last-launched job from this-browser storage', () => {
  assert.match(html, /event\.key === 'y'/);
  assert.match(html, /lastBtn\?\.click\(\)/);
  assert.match(html, /inEditable\(event\.target\)/);
  assert.match(html, /aria-keyshortcuts="y"/);
  assert.match(html, /id="copy-last"/);
  assert.match(html, />Copy last launched</);
  assert.match(html, /id="copy-last-fallback"/);
  assert.match(html, /lastLaunchedMarkdown/);
  assert.match(html, /return '\\n'/);
  assert.match(html, /<kbd>y<\/kbd><\/dt><dd>Copy the last-launched workbench name and one-sentence job as Markdown from this-browser storage, or an empty line if none is stored. This is not a cloud recency./);
  assert.match(html, /Press <kbd>y<\/kbd> to copy the last-launched job/);
  assert.match(html, /not a cloud recency/);
  assert.match(readme, /Press `y` to copy the last-launched workbench name/);
  assert.match(readme, /copies an empty line/);
  const clicks = { last: 0 };
  let keydown = null;
  const document = {
    getElementById(id) {
      if (id === 'copy-last') return { click() { clicks.last += 1; }, addEventListener() {} };
      if (id === 'shortcuts') return { hidden: true };
      if (id === 'shortcuts-open') return { setAttribute() {}, addEventListener() {} };
      if (id === 'shortcuts-close') return { addEventListener() {} };
      if (id === 'skip-shortcuts') return { addEventListener() {} };
      return null;
    },
    querySelector: () => null,
    querySelectorAll: () => [],
    addEventListener(name, handler) {
      if (name === 'keydown') keydown = handler;
    },
  };
  const source = html.match(/<script>([\s\S]*?)<\/script>/)[1];
  vm.runInNewContext(source, {
    document,
    location: { protocol: 'file:', hash: '' },
    localStorage: { getItem: () => null, setItem() {} },
  });
  const fire = (key, target) => {
    keydown({
      key,
      target,
      defaultPrevented: false,
      altKey: false,
      ctrlKey: false,
      metaKey: false,
      shiftKey: false,
      preventDefault() {},
    });
  };
  const input = { tagName: 'INPUT', closest() { return input; } };
  const body = { tagName: 'BODY', closest() { return null; } };
  fire('y', input);
  assert.equal(clicks.last, 0);
  fire('y', body);
  assert.equal(clicks.last, 1);
});

test('copy last launched markdown is the stored name and job or an empty line', async () => {
  let copied = '';
  let clickLast = null;
  const card = {
    querySelector(sel) {
      if (sel === 'h3') return { textContent: 'Common Cart' };
      if (sel === 'p.job') return { textContent: 'Pool buyer constraints.' };
      return null;
    },
  };
  const stored = { value: '2' };
  const document = {
    getElementById(id) {
      if (id === 'copy-last') return { addEventListener(name, handler) { if (name === 'click') clickLast = handler; } };
      if (id === 'copy-last-status') return { textContent: '' };
      if (id === 'copy-last-fallback') return { hidden: true, value: '', focus() {}, select() {} };
      return null;
    },
    querySelector(selector) {
      return String(selector).includes('data-workbench="2"') ? card : null;
    },
    querySelectorAll: () => [],
    addEventListener() {},
  };
  const source = html.match(/<script>([\s\S]*?)<\/script>/)[1];
  vm.runInNewContext(source, {
    document,
    location: { protocol: 'file:', hash: '' },
    localStorage: {
      getItem() { return stored.value; },
      setItem() {},
    },
    navigator: { clipboard: { writeText: async (text) => { copied = text; } } },
  });
  await clickLast();
  assert.equal(copied, '- Common Cart: Pool buyer constraints.');
  stored.value = null;
  copied = 'stale';
  await clickLast();
  assert.equal(copied, '\n');
});

test('keyboard u copies How it works through the same control', () => {
  assert.match(html, /event\.key === 'u'/);
  assert.match(html, /howBtn\?\.click\(\)/);
  assert.match(html, /inEditable\(event\.target\)/);
  assert.match(html, /aria-keyshortcuts="u"/);
  assert.match(html, /<kbd>u<\/kbd><\/dt><dd>Copy How it works as Markdown from this catalog page, not a live policy feed/);
  assert.match(html, /Press <kbd>u<\/kbd> to copy How it works/);
  assert.match(readme, /Press `u` to copy How it works/);
  assert.match(html, /howMarkdown/);
  assert.match(html, /howFallback\.hidden = false/);
});

test('keyboard i copies Trust and limits through the same control', () => {
  assert.match(html, /event\.key === 'i'/);
  assert.match(html, /trustBtn\?\.click\(\)/);
  assert.match(html, /inEditable\(event\.target\)/);
  assert.match(html, /aria-keyshortcuts="i"/);
  assert.match(html, /<kbd>i<\/kbd><\/dt><dd>Copy Trust and limits as Markdown from this catalog page, not a live policy feed/);
  assert.match(html, /Press <kbd>i<\/kbd> to copy Trust and limits/);
  assert.match(readme, /Press `i` to copy Trust and limits/);
  assert.match(html, /trustMarkdown/);
  assert.match(html, /trustFallback\.hidden = false/);
});

test('keyboard v copies catalog versions through the same control', () => {
  assert.match(html, /event\.key === 'v'/);
  assert.match(html, /versionsBtn\?\.click\(\)/);
  assert.match(html, /inEditable\(event\.target\)/);
  assert.match(html, /<kbd>v<\/kbd><\/dt><dd>Copy workbench names and versions as Markdown/);
  assert.match(html, /Press <kbd>v<\/kbd> to copy catalog versions/);
  assert.match(readme, /Press `v` to copy catalog versions/);
  assert.match(html, /versionsMarkdown/);
  assert.match(html, /versionsFallback\.hidden = false/);
});

test('keyboard c copies the catalog address on http through the same control', () => {
  assert.match(html, /event\.key === 'c'/);
  assert.match(html, /if \(catalogIsHttp\(\)\) copyBtn\?\.click\(\)/);
  assert.match(html, /const catalogIsHttp = \(\) => \/\^https\?:\$\/\.test\(location\.protocol\)/);
  assert.match(html, /if \(!catalogIsHttp\(\)\) \{/);
  assert.match(html, /copyStatus\.textContent = ''/);
  assert.doesNotMatch(html, /Copied the catalog address[\s\S]*file:/);
  assert.match(html, /<kbd>c<\/kbd><\/dt><dd>Copy catalog address when this page is served over http/);
  assert.match(html, /Press <kbd>c<\/kbd> to copy the catalog address on http/);
  assert.match(html, /inEditable\(event\.target\)/);
  assert.match(readme, /Press `c` to copy the catalog address/);
  assert.match(readme, /On a file URL that key does not claim a\s+copy succeeded/);
});

test('mouse launch records the selected workbench and storage failure does not prevent navigation', () => {
 const handlers=new Map(), values=new Map();let blocked=false;
 const links=['1','2','3','4','invalid'].map(key=>({getAttribute:()=>key,addEventListener:(name,handler)=>handlers.set(key,handler)}));
 const document={getElementById:()=>null,querySelector:()=>null,querySelectorAll:selector=>selector==='.open[aria-keyshortcuts]'?links:[],addEventListener(){}};
 const source=html.match(/<script>([\s\S]*?)<\/script>/)[1];
 vm.runInNewContext(source,{document,location:{protocol:'file:',hash:''},localStorage:{getItem:key=>values.get(key)??null,setItem(key,value){if(blocked)throw new Error('Storage unavailable');values.set(key,value);}}});
 for(const key of ['1','2','3','4']){handlers.get(key)({defaultPrevented:false});assert.equal(values.get('decision-labs.last-workbench'),key);}
 handlers.get('1')({defaultPrevented:true});assert.equal(values.get('decision-labs.last-workbench'),'4');
 handlers.get('invalid')({defaultPrevented:false});assert.equal(values.get('decision-labs.last-workbench'),'4');
 blocked=true;assert.doesNotThrow(()=>handlers.get('1')({defaultPrevented:false}));
});

test('keyboard x stays silent when last-launched storage throws', () => {
  assert.match(html, /localStorage\.removeItem\(LAST_WORKBENCH_KEY\)/);
  assert.match(html, /A write failure stays silent/);
  const notes = [{ hidden: false }, { hidden: false }];
  let keydown = null;
  const document = {
    getElementById: () => null,
    querySelector: () => null,
    querySelectorAll(selector) {
      return selector === '.last-launched' ? notes : [];
    },
    addEventListener(name, handler) {
      if (name === 'keydown') keydown = handler;
    },
  };
  const source = html.match(/<script>([\s\S]*?)<\/script>/)[1];
  vm.runInNewContext(source, {
    document,
    location: { protocol: 'file:', hash: '' },
    localStorage: {
      getItem() { throw new Error('Storage unreadable'); },
      setItem() { throw new Error('Storage unreadable'); },
      removeItem() { throw new Error('Storage unreadable'); },
    },
  });
  assert.doesNotThrow(() => {
    keydown({
      key: 'x',
      target: { tagName: 'BODY', closest() { return null; } },
      defaultPrevented: false,
      altKey: false,
      ctrlKey: false,
      metaKey: false,
      shiftKey: false,
      preventDefault() {},
    });
  });
  assert.equal(notes[0].hidden, true);
  assert.equal(notes[1].hidden, true);
});

test('hash trust still focuses Trust and limits after copy trust tools', () => {
  assert.match(html, /const hashTargets = \['#whats-new', '#workbenches', '#how-it-works', '#trust', '#shortcuts', '#version-line'\]/);
  assert.match(html, /id="trust" tabindex="-1"/);
  assert.match(html, /getElementById\('trust'\)\?\.focus\(\)/);
  assert.match(html, /event\.key === 't'/);
  assert.match(html, /id="copy-trust"/);
  const focused = [];
  const trust = { id: 'trust', tabindex: '-1', focus() { focused.push('trust'); } };
  const document = {
    getElementById(id) {
      if (id === 'trust') return trust;
      if (id === 'shortcuts') return { hidden: true };
      if (id === 'shortcuts-open') return { setAttribute() {}, addEventListener() {} };
      if (id === 'shortcuts-close') return { addEventListener() {} };
      if (id === 'skip-shortcuts') return { addEventListener() {} };
      return null;
    },
    querySelector: () => null,
    querySelectorAll: () => [],
    addEventListener() {},
  };
  const source = html.match(/<script>([\s\S]*?)<\/script>/)[1];
  vm.runInNewContext(source, {
    document,
    location: { protocol: 'file:', hash: '#trust' },
    localStorage: { getItem: () => null, setItem() {} },
  });
  assert.deepEqual(focused, ['trust']);
});

test('hash shortcuts still focuses the shortcuts panel', () => {
  assert.match(html, /const hashTargets = \['#whats-new', '#workbenches', '#how-it-works', '#trust', '#shortcuts', '#version-line'\]/);
  assert.match(html, /if \(id === 'shortcuts'\) setOpen\(true, \{ focus: false \}\)/);
  const focused = [];
  const shortcuts = { hidden: true, tabindex: '-1', focus() { focused.push('shortcuts'); } };
  const openBtn = { setAttribute() {}, addEventListener() {}, focus() {} };
  const document = {
    getElementById(id) {
      if (id === 'shortcuts') return shortcuts;
      if (id === 'shortcuts-open') return openBtn;
      if (id === 'shortcuts-close') return { addEventListener() {}, focus() {} };
      if (id === 'skip-shortcuts') return { addEventListener() {} };
      return null;
    },
    querySelector: () => null,
    querySelectorAll: () => [],
    addEventListener() {},
  };
  const source = html.match(/<script>([\s\S]*?)<\/script>/)[1];
  vm.runInNewContext(source, {
    document,
    location: { protocol: 'file:', hash: '#shortcuts' },
    localStorage: { getItem: () => null, setItem() {} },
  });
  assert.equal(shortcuts.hidden, false);
  assert.deepEqual(focused, ['shortcuts']);
});

test('keyboard b e g q r z are ignored in inputs using the same inEditable helper as c', () => {
  assert.match(html, /const inEditable = \(node\) =>/);
  assert.match(html, /if \(inEditable\(event\.target\)\) return;/);
  assert.match(html, /event\.key === 'c'/);
  assert.match(html, /event\.key === 'b'/);
  assert.match(html, /event\.key === 'e'/);
  assert.match(html, /event\.key === 'g'/);
  assert.match(html, /event\.key === 'q'/);
  assert.match(html, /event\.key === 'r'/);
  assert.match(html, /event\.key === 'z'/);
  const clicks = { lede: 0, jobs: 0, skips: 0 };
  const focused = [];
  const assigned = [];
  let keydown = null;
  const lastCard = { focus() { focused.push('workbench-4'); } };
  const firstNews = { focus() { focused.push('h3'); } };
  const review = { focus() { focused.push('review-path'); } };
  const document = {
    getElementById(id) {
      if (id === 'workbench-4') return lastCard;
      if (id === 'copy-lede') return { click() { clicks.lede += 1; }, addEventListener() {} };
      if (id === 'copy-jobs') return { click() { clicks.jobs += 1; }, addEventListener() {} };
      if (id === 'copy-skips') return { click() { clicks.skips += 1; }, addEventListener() {} };
      if (id === 'shortcuts') return { hidden: true };
      if (id === 'shortcuts-open') return { setAttribute() {}, addEventListener() {} };
      if (id === 'shortcuts-close') return { addEventListener() {} };
      if (id === 'skip-shortcuts') return { addEventListener() {} };
      return null;
    },
    querySelector(selector) {
      if (selector === '#whats-new h3') return firstNews;
      if (selector === '#workbench-1 .review-path') return review;
      return null;
    },
    querySelectorAll: () => [],
    addEventListener(name, handler) {
      if (name === 'keydown') keydown = handler;
    },
  };
  const source = html.match(/<script>([\s\S]*?)<\/script>/)[1];
  vm.runInNewContext(source, {
    document,
    location: { protocol: 'file:', hash: '' },
    localStorage: { getItem: () => null, setItem() {} },
    window: { location: { assign(href) { assigned.push(href); } } },
  });
  const fire = (key, target) => {
    keydown({
      key,
      target,
      defaultPrevented: false,
      altKey: false,
      ctrlKey: false,
      metaKey: false,
      shiftKey: false,
      preventDefault() {},
    });
  };
  const input = { tagName: 'INPUT', closest() { return input; } };
  const textarea = { tagName: 'TEXTAREA', closest() { return textarea; } };
  const select = { tagName: 'SELECT', closest() { return select; } };
  const body = { tagName: 'BODY', closest() { return null; } };
  for (const target of [input, textarea, select]) {
    fire('b', target);
    fire('e', target);
    fire('g', target);
    fire('q', target);
    fire('r', target);
    fire('z', target);
    fire('c', target);
  }
  assert.deepEqual(focused, []);
  assert.equal(clicks.lede, 0);
  assert.equal(clicks.jobs, 0);
  assert.equal(clicks.skips, 0);
  assert.deepEqual(assigned, []);
  fire('b', body);
  fire('g', body);
  fire('r', body);
  fire('e', body);
  fire('q', body);
  fire('z', body);
  assert.deepEqual(focused, ['workbench-4', 'h3', 'review-path']);
  assert.equal(clicks.lede, 1);
  assert.equal(clicks.jobs, 1);
  assert.equal(clicks.skips, 1);
  assert.deepEqual(assigned, []);
});

test('keyboard v and j are ignored in inputs using the same inEditable helper as c', () => {
  assert.match(html, /const inEditable = \(node\) =>/);
  assert.match(html, /input, textarea, select, \[contenteditable="true"\]/);
  assert.match(html, /if \(inEditable\(event\.target\)\) return;/);
  assert.match(html, /event\.key === 'c'/);
  assert.match(html, /event\.key === 'v'/);
  assert.match(html, /event\.key === 'j'/);
  const clicks = { versions: 0, jobs: 0 };
  let keydown = null;
  const document = {
    getElementById(id) {
      if (id === 'copy-versions') return { click() { clicks.versions += 1; }, addEventListener() {} };
      if (id === 'copy-jobs') return { click() { clicks.jobs += 1; }, addEventListener() {} };
      if (id === 'shortcuts') return { hidden: true };
      if (id === 'shortcuts-open') return { setAttribute() {}, addEventListener() {} };
      if (id === 'shortcuts-close') return { addEventListener() {} };
      if (id === 'skip-shortcuts') return { addEventListener() {} };
      return null;
    },
    querySelector: () => null,
    querySelectorAll: () => [],
    addEventListener(name, handler) {
      if (name === 'keydown') keydown = handler;
    },
  };
  const source = html.match(/<script>([\s\S]*?)<\/script>/)[1];
  vm.runInNewContext(source, {
    document,
    location: { protocol: 'http:', hash: '', href: 'http://127.0.0.1:4170/' },
    localStorage: { getItem: () => null, setItem() {} },
    navigator: { clipboard: { writeText: async () => {} } },
  });
  const fire = (key, target) => {
    keydown({
      key,
      target,
      defaultPrevented: false,
      altKey: false,
      ctrlKey: false,
      metaKey: false,
      shiftKey: false,
      preventDefault() {},
    });
  };
  const input = { tagName: 'INPUT', closest() { return input; } };
  const textarea = { tagName: 'TEXTAREA', closest() { return textarea; } };
  const body = { tagName: 'BODY', closest() { return null; } };
  fire('v', input);
  fire('j', input);
  fire('v', textarea);
  fire('j', textarea);
  fire('c', input);
  assert.equal(clicks.versions, 0);
  assert.equal(clicks.jobs, 0);
  fire('v', body);
  fire('j', body);
  assert.equal(clicks.versions, 1);
  assert.equal(clicks.jobs, 1);
});

test('keyboard f p a u y are ignored in inputs using the same inEditable helper as c', () => {
  assert.match(html, /const inEditable = \(node\) =>/);
  assert.match(html, /if \(inEditable\(event\.target\)\) return;/);
  assert.match(html, /event\.key === 'c'/);
  assert.match(html, /event\.key === 'f'/);
  assert.match(html, /event\.key === 'p'/);
  assert.match(html, /event\.key === 'a'/);
  assert.match(html, /event\.key === 'u'/);
  assert.match(html, /event\.key === 'y'/);
  const clicks = { print: 0, how: 0, last: 0 };
  const focused = [];
  const prints = [];
  let keydown = null;
  const versionLine = { focus() { focused.push('version-line'); } };
  const article = { focus() { focused.push('workbench-1'); } };
  const document = {
    getElementById(id) {
      if (id === 'print-catalog') return { click() { clicks.print += 1; }, addEventListener() {} };
      if (id === 'copy-how') return { click() { clicks.how += 1; }, addEventListener() {} };
      if (id === 'copy-last') return { click() { clicks.last += 1; }, addEventListener() {} };
      if (id === 'workbench-1') return article;
      if (id === 'shortcuts') return { hidden: true };
      if (id === 'shortcuts-open') return { setAttribute() {}, addEventListener() {} };
      if (id === 'shortcuts-close') return { addEventListener() {} };
      if (id === 'skip-shortcuts') return { addEventListener() {} };
      return null;
    },
    querySelector(selector) {
      return selector === '.version-line' ? versionLine : null;
    },
    querySelectorAll: () => [],
    addEventListener(name, handler) {
      if (name === 'keydown') keydown = handler;
    },
  };
  const source = html.match(/<script>([\s\S]*?)<\/script>/)[1];
  vm.runInNewContext(source, {
    document,
    location: { protocol: 'file:', hash: '' },
    localStorage: { getItem: () => null, setItem() {} },
    window: { print() { prints.push('print'); } },
  });
  const fire = (key, target) => {
    keydown({
      key,
      target,
      defaultPrevented: false,
      altKey: false,
      ctrlKey: false,
      metaKey: false,
      shiftKey: false,
      preventDefault() {},
    });
  };
  const input = { tagName: 'INPUT', closest() { return input; } };
  const textarea = { tagName: 'TEXTAREA', closest() { return textarea; } };
  const select = { tagName: 'SELECT', closest() { return select; } };
  const body = { tagName: 'BODY', closest() { return null; } };
  for (const target of [input, textarea, select]) {
    fire('f', target);
    fire('p', target);
    fire('a', target);
    fire('u', target);
    fire('y', target);
    fire('c', target);
  }
  assert.deepEqual(focused, []);
  assert.equal(clicks.print, 0);
  assert.equal(clicks.how, 0);
  assert.equal(clicks.last, 0);
  assert.deepEqual(prints, []);
  fire('f', body);
  fire('a', body);
  fire('p', body);
  fire('u', body);
  fire('y', body);
  assert.deepEqual(focused, ['version-line', 'workbench-1']);
  assert.equal(clicks.print, 1);
  assert.equal(clicks.how, 1);
  assert.equal(clicks.last, 1);
});

test('keyboard m x i s are ignored in inputs using the same inEditable helper as c', () => {
  assert.match(html, /const inEditable = \(node\) =>/);
  assert.match(html, /if \(inEditable\(event\.target\)\) return;/);
  assert.match(html, /event\.key === 'c'/);
  assert.match(html, /event\.key === 'm'/);
  assert.match(html, /event\.key === 'x'/);
  assert.match(html, /event\.key === 'i'/);
  assert.match(html, /event\.key === 's'/);
  const clicks = { trust: 0 };
  const focused = [];
  const notes = [{ hidden: false }];
  let removed = 0;
  let keydown = null;
  const main = { focus() { focused.push('main'); } };
  const firstOpen = { focus() { focused.push('open'); } };
  const document = {
    getElementById(id) {
      if (id === 'main') return main;
      if (id === 'copy-trust') return { click() { clicks.trust += 1; }, addEventListener() {} };
      if (id === 'shortcuts') return { hidden: true };
      if (id === 'shortcuts-open') return { setAttribute() {}, addEventListener() {} };
      if (id === 'shortcuts-close') return { addEventListener() {} };
      if (id === 'skip-shortcuts') return { addEventListener() {} };
      return null;
    },
    querySelector(selector) {
      return selector === '#workbenches a.open' ? firstOpen : null;
    },
    querySelectorAll(selector) {
      return selector === '.last-launched' ? notes : [];
    },
    addEventListener(name, handler) {
      if (name === 'keydown') keydown = handler;
    },
  };
  const source = html.match(/<script>([\s\S]*?)<\/script>/)[1];
  vm.runInNewContext(source, {
    document,
    location: { protocol: 'file:', hash: '' },
    localStorage: {
      getItem: () => null,
      setItem() {},
      removeItem() { removed += 1; },
    },
  });
  const fire = (key, target) => {
    keydown({
      key,
      target,
      defaultPrevented: false,
      altKey: false,
      ctrlKey: false,
      metaKey: false,
      shiftKey: false,
      preventDefault() {},
    });
  };
  const input = { tagName: 'INPUT', closest() { return input; } };
  const textarea = { tagName: 'TEXTAREA', closest() { return textarea; } };
  const select = { tagName: 'SELECT', closest() { return select; } };
  const body = { tagName: 'BODY', closest() { return null; } };
  for (const target of [input, textarea, select]) {
    fire('m', target);
    fire('x', target);
    fire('i', target);
    fire('s', target);
    fire('c', target);
  }
  assert.deepEqual(focused, []);
  assert.equal(clicks.trust, 0);
  assert.equal(removed, 0);
  assert.equal(notes[0].hidden, false);
  fire('m', body);
  fire('s', body);
  fire('i', body);
  fire('x', body);
  assert.deepEqual(focused, ['main', 'open']);
  assert.equal(clicks.trust, 1);
  assert.equal(removed, 1);
  assert.equal(notes[0].hidden, true);
});

test('keyboard l and o use stored last-launched recency in this browser', () => {
  const focused = [];
  const assigned = [];
  const stored = { value: '2' };
  const cards = {
    1: { focus() { focused.push('1'); } },
    2: { focus() { focused.push('2'); } },
    3: { focus() { focused.push('3'); } },
    4: { focus() { focused.push('4'); } },
  };
  const workbenches = { focus() { focused.push('workbenches'); } };
  const opens = [
    { href: 'apps/partnership-breakpoint/standalone.html' },
    { href: 'apps/common-cart/standalone.html' },
    { href: 'apps/smallest-agreement/standalone.html' },
    { href: 'apps/weekend-gap/standalone.html' },
  ];
  let keydown = null;
  const document = {
    getElementById(id) {
      if (id === 'workbenches') return workbenches;
      if (id === 'shortcuts') return { hidden: true };
      if (id === 'shortcuts-open') return { setAttribute() {}, addEventListener() {} };
      if (id === 'shortcuts-close') return { addEventListener() {} };
      if (id === 'skip-shortcuts') return { addEventListener() {} };
      return null;
    },
    querySelector(selector) {
      const match = String(selector).match(/data-workbench="([1-4])"/);
      return match ? cards[match[1]] : null;
    },
    querySelectorAll(selector) {
      return selector === '#workbenches a.open' ? opens : [];
    },
    addEventListener(name, handler) {
      if (name === 'keydown') keydown = handler;
    },
  };
  const source = html.match(/<script>([\s\S]*?)<\/script>/)[1];
  vm.runInNewContext(source, {
    document,
    location: { protocol: 'file:', hash: '' },
    window: { location: { assign(href) { assigned.push(href); } } },
    localStorage: {
      getItem() { return stored.value; },
      setItem(key, value) { stored.value = value; },
    },
  });
  const fire = (key, target = { tagName: 'BODY', closest() { return null; } }) => {
    let prevented = false;
    keydown({
      key,
      target,
      defaultPrevented: false,
      altKey: false,
      ctrlKey: false,
      metaKey: false,
      shiftKey: false,
      preventDefault() { prevented = true; },
    });
    return prevented;
  };
  assert.equal(fire('l'), true);
  assert.deepEqual(focused, ['2']);
  assert.deepEqual(assigned, []);
  assert.equal(fire('o'), true);
  assert.deepEqual(assigned, ['apps/common-cart/standalone.html']);
  assert.equal(stored.value, '2');
  stored.value = null;
  focused.length = 0;
  assigned.length = 0;
  assert.equal(fire('l'), true);
  assert.deepEqual(focused, ['workbenches']);
  assert.equal(fire('o'), true);
  assert.deepEqual(focused, ['workbenches', 'workbenches']);
  assert.deepEqual(assigned, []);
  const input = { tagName: 'INPUT', closest() { return input; } };
  focused.length = 0;
  stored.value = '4';
  fire('l', input);
  fire('o', input);
  assert.deepEqual(focused, []);
  assert.deepEqual(assigned, []);
});

test('copy jobs markdown is the four catalog card names and jobs', async () => {
  let copied = '';
  let clickJobs = null;
  const cards = [
    { querySelector(sel) { return sel === 'h3' ? { textContent: 'Partnership Breakpoint' } : sel === 'p.job' ? { textContent: 'Find which participant in a revenue split.' } : null; } },
    { querySelector(sel) { return sel === 'h3' ? { textContent: 'Common Cart' } : sel === 'p.job' ? { textContent: 'Pool buyer constraints.' } : null; } },
    { querySelector(sel) { return sel === 'h3' ? { textContent: 'The Smallest Agreement' } : sel === 'p.job' ? { textContent: 'Find the lowest-cost set of clause changes.' } : null; } },
    { querySelector(sel) { return sel === 'h3' ? { textContent: 'Weekend Gap' } : sel === 'p.job' ? { textContent: 'Follow synthetic AUD redemption demand.' } : null; } },
  ];
  const document = {
    getElementById(id) {
      if (id === 'copy-jobs') return { addEventListener(name, handler) { if (name === 'click') clickJobs = handler; } };
      if (id === 'copy-jobs-status') return { textContent: '' };
      if (id === 'copy-jobs-fallback') return { hidden: true, value: '', focus() {}, select() {} };
      return null;
    },
    querySelector: () => null,
    querySelectorAll(selector) {
      return selector === 'article.workbench' ? cards : [];
    },
    addEventListener() {},
  };
  const source = html.match(/<script>([\s\S]*?)<\/script>/)[1];
  vm.runInNewContext(source, {
    document,
    location: { protocol: 'file:', hash: '' },
    localStorage: { getItem: () => null, setItem() {} },
    navigator: { clipboard: { writeText: async (text) => { copied = text; } } },
  });
  await clickJobs();
  assert.equal(
    copied,
    '- Partnership Breakpoint: Find which participant in a revenue split.\n- Common Cart: Pool buyer constraints.\n- The Smallest Agreement: Find the lowest-cost set of clause changes.\n- Weekend Gap: Follow synthetic AUD redemption demand.',
  );
});

test('copy jobs shows a visible textarea when clipboard is unavailable', async () => {
  let clickJobs = null;
  const fallback = { hidden: true, value: '', focused: false, selected: false, focus() { this.focused = true; }, select() { this.selected = true; } };
  const status = { textContent: '' };
  const cards = [
    { querySelector(sel) { return sel === 'h3' ? { textContent: 'Partnership Breakpoint' } : sel === 'p.job' ? { textContent: 'Find which participant in a revenue split.' } : null; } },
  ];
  const document = {
    getElementById(id) {
      if (id === 'copy-jobs') return { addEventListener(name, handler) { if (name === 'click') clickJobs = handler; } };
      if (id === 'copy-jobs-status') return status;
      if (id === 'copy-jobs-fallback') return fallback;
      return null;
    },
    querySelector: () => null,
    querySelectorAll(selector) {
      return selector === 'article.workbench' ? cards : [];
    },
    addEventListener() {},
  };
  const source = html.match(/<script>([\s\S]*?)<\/script>/)[1];
  vm.runInNewContext(source, {
    document,
    location: { protocol: 'file:', hash: '' },
    localStorage: { getItem: () => null, setItem() {} },
    navigator: {},
  });
  await clickJobs();
  assert.equal(fallback.hidden, false);
  assert.equal(fallback.focused, true);
  assert.equal(fallback.selected, true);
  assert.equal(fallback.value, '- Partnership Breakpoint: Find which participant in a revenue split.');
  assert.match(status.textContent, /Clipboard unavailable/);
  assert.match(status.textContent, /not a live product feed/);
});

test('copy Trust markdown is the printed heading and list items', async () => {
  let copied = '';
  let clickTrust = null;
  const heading = { textContent: 'Trust and limits' };
  const items = [
    { textContent: 'Local-first. Pages run in your browser.' },
    { textContent: 'No account. There is no sign-in.' },
    { textContent: 'Deterministic math. The same valid inputs produce the same outputs.' },
    { textContent: 'Not a decision maker. People keep judgment.' },
    { textContent: 'Model notes live in each workbench. Open the workbench for conventions.' },
  ];
  const section = {
    querySelector(selector) {
      return selector === 'h2' ? heading : null;
    },
    querySelectorAll(selector) {
      return selector === 'ul li' ? items : [];
    },
  };
  const document = {
    getElementById(id) {
      if (id === 'copy-trust') return { addEventListener(name, handler) { if (name === 'click') clickTrust = handler; } };
      if (id === 'copy-trust-status') return { textContent: '' };
      if (id === 'copy-trust-fallback') return { hidden: true, value: '', focus() {}, select() {} };
      if (id === 'trust') return section;
      return null;
    },
    querySelector: () => null,
    querySelectorAll: () => [],
    addEventListener() {},
  };
  const source = html.match(/<script>([\s\S]*?)<\/script>/)[1];
  vm.runInNewContext(source, {
    document,
    location: { protocol: 'file:', hash: '' },
    localStorage: { getItem: () => null, setItem() {} },
    navigator: { clipboard: { writeText: async (text) => { copied = text; } } },
  });
  await clickTrust();
  assert.equal(
    copied,
    '## Trust and limits\n- Local-first. Pages run in your browser.\n- No account. There is no sign-in.\n- Deterministic math. The same valid inputs produce the same outputs.\n- Not a decision maker. People keep judgment.\n- Model notes live in each workbench. Open the workbench for conventions.',
  );
  assert.doesNotMatch(copied, /live policy feed/);
});

test('copy Trust shows a visible textarea when clipboard is unavailable', async () => {
  let clickTrust = null;
  const fallback = { hidden: true, value: '', focused: false, selected: false, focus() { this.focused = true; }, select() { this.selected = true; } };
  const status = { textContent: '' };
  const heading = { textContent: 'Trust and limits' };
  const items = [{ textContent: 'Local-first. Pages run in your browser.' }];
  const section = {
    querySelector(selector) {
      return selector === 'h2' ? heading : null;
    },
    querySelectorAll(selector) {
      return selector === 'ul li' ? items : [];
    },
  };
  const document = {
    getElementById(id) {
      if (id === 'copy-trust') return { addEventListener(name, handler) { if (name === 'click') clickTrust = handler; } };
      if (id === 'copy-trust-status') return status;
      if (id === 'copy-trust-fallback') return fallback;
      if (id === 'trust') return section;
      return null;
    },
    querySelector: () => null,
    querySelectorAll: () => [],
    addEventListener() {},
  };
  const source = html.match(/<script>([\s\S]*?)<\/script>/)[1];
  vm.runInNewContext(source, {
    document,
    location: { protocol: 'file:', hash: '' },
    localStorage: { getItem: () => null, setItem() {} },
    navigator: {},
  });
  await clickTrust();
  assert.equal(fallback.hidden, false);
  assert.equal(fallback.focused, true);
  assert.equal(fallback.selected, true);
  assert.equal(fallback.value, '## Trust and limits\n- Local-first. Pages run in your browser.');
  assert.match(status.textContent, /Clipboard unavailable/);
  assert.match(status.textContent, /not a live policy feed/);
});

test('copy How it works markdown is the printed heading and list items', async () => {
  let copied = '';
  let clickHow = null;
  const heading = { textContent: 'How it works' };
  const items = [
    { textContent: 'Standalone files. Every workbench ships standalone.html.' },
    { textContent: 'Loopback catalog address. The control stays hidden on a file.' },
    { textContent: 'Independent workbenches. The four tools do not share drafts.' },
  ];
  const section = {
    querySelector(selector) {
      return selector === 'h2' ? heading : null;
    },
    querySelectorAll(selector) {
      return selector === 'ul li' ? items : [];
    },
  };
  const document = {
    getElementById(id) {
      if (id === 'copy-how') return { addEventListener(name, handler) { if (name === 'click') clickHow = handler; } };
      if (id === 'copy-how-status') return { textContent: '' };
      if (id === 'copy-how-fallback') return { hidden: true, value: '', focus() {}, select() {} };
      if (id === 'how-it-works') return section;
      return null;
    },
    querySelector: () => null,
    querySelectorAll: () => [],
    addEventListener() {},
  };
  const source = html.match(/<script>([\s\S]*?)<\/script>/)[1];
  vm.runInNewContext(source, {
    document,
    location: { protocol: 'file:', hash: '' },
    localStorage: { getItem: () => null, setItem() {} },
    navigator: { clipboard: { writeText: async (text) => { copied = text; } } },
  });
  await clickHow();
  assert.equal(
    copied,
    '## How it works\n- Standalone files. Every workbench ships standalone.html.\n- Loopback catalog address. The control stays hidden on a file.\n- Independent workbenches. The four tools do not share drafts.',
  );
  assert.doesNotMatch(copied, /live policy feed/);
});

test('copy How it works shows a visible textarea when clipboard is unavailable', async () => {
  let clickHow = null;
  const fallback = { hidden: true, value: '', focused: false, selected: false, focus() { this.focused = true; }, select() { this.selected = true; } };
  const status = { textContent: '' };
  const heading = { textContent: 'How it works' };
  const items = [{ textContent: 'Standalone files. Every workbench ships standalone.html.' }];
  const section = {
    querySelector(selector) {
      return selector === 'h2' ? heading : null;
    },
    querySelectorAll(selector) {
      return selector === 'ul li' ? items : [];
    },
  };
  const document = {
    getElementById(id) {
      if (id === 'copy-how') return { addEventListener(name, handler) { if (name === 'click') clickHow = handler; } };
      if (id === 'copy-how-status') return status;
      if (id === 'copy-how-fallback') return fallback;
      if (id === 'how-it-works') return section;
      return null;
    },
    querySelector: () => null,
    querySelectorAll: () => [],
    addEventListener() {},
  };
  const source = html.match(/<script>([\s\S]*?)<\/script>/)[1];
  vm.runInNewContext(source, {
    document,
    location: { protocol: 'file:', hash: '' },
    localStorage: { getItem: () => null, setItem() {} },
    navigator: {},
  });
  await clickHow();
  assert.equal(fallback.hidden, false);
  assert.equal(fallback.focused, true);
  assert.equal(fallback.selected, true);
  assert.equal(fallback.value, '## How it works\n- Standalone files. Every workbench ships standalone.html.');
  assert.match(status.textContent, /Clipboard unavailable/);
  assert.match(status.textContent, /not a live policy feed/);
});

