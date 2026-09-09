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
  assert.match(html, /href="#shortcuts" id="skip-shortcuts">Skip to keyboard shortcuts/);
  assert.match(html, /id="catalog-heading" tabindex="-1"/);
  assert.match(html, /<header class="shell hero">/);
  assert.match(html, /<nav class="shell site-nav" aria-label="On this page">/);
  assert.match(html, /<main class="shell" id="main">/);
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
  assert.match(html, /Share-to-hold in Partnership Breakpoint/);
  assert.match(html, /Residual coverage in Common Cart/);
  assert.match(html, /Veto groups in The Smallest Agreement/);
  assert.match(html, /Gate Gantt in Weekend Gap/);
  assert.match(html, /CSV roster, capacity, and notes in Partnership Breakpoint 1\.4\.1/);
  assert.match(html, /Leftover fill and overlap counts in Common Cart 1\.3\.1/);
  assert.match(html, /Package pin, locks, and notes in The Smallest Agreement 1\.4\.1/);
  assert.match(html, /Queue-clear hours and Gantt compare in Weekend Gap 1\.4\.1/);
  assert.match(html, /Queue CSV, peak jump, and long-weekend preset in Weekend Gap 1\.4\.2/);
  assert.match(html, /do not call a live partnership, merchant, vote, or bank/);
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
  assert.match(readme, /leftover\/tertiary fill/);
  assert.match(readme, /package pin, locks, and notes/);
  assert.match(readme, /queue-clear hours and Gantt compare/);
  assert.match(readme, /queue CSV export, peak-queue jump/);
  assert.match(readme, /not hosted APIs/);
  assert.match(readme, /does not serve those\s+markdown files/);
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

test('h focuses the catalog heading when focus is not in an input', () => {
  assert.match(html, /id="catalog-heading" tabindex="-1"/);
  assert.match(html, /event\.key === 'h'/);
  assert.match(html, /getElementById\('catalog-heading'\)\?\.focus\(\)/);
  assert.match(html, /<kbd>h<\/kbd><\/dt><dd>Focus the catalog heading/);
  assert.match(html, /inEditable\(event\.target\)/);
});
