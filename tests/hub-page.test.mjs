import vm from 'node:vm';
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const readme = readFileSync(new URL('../README.md', import.meta.url), 'utf8');
const scriptSource = html.match(/<script>([\s\S]*)<\/script>/)[1];

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
  assert.match(scriptSource, /const keys = \{ 1: 0, 2: 1, 3: 2, 4: 3 \}/);
  assert.match(scriptSource, /input, textarea, select, \[contenteditable="true"\]/);
});

test('catalog keyboard set is small, documented, and does not hijack browser keys', () => {
  const bound = [...scriptSource.matchAll(/(?:event\.key === '([^']+)'|\bkey === '([a-z])')/g)].map((m) => m[1] || m[2]).filter(Boolean).filter((k) => k !== '?');
  const listed = [...html.matchAll(/<dt><kbd>([^<]+)<\/kbd><\/dt>/g)].map((m) => m[1]);
  // Every listed shortcut is handled; every handled key is listed or is Escape (help close).
  for (const key of bound) {
    if (['Escape', '?', '/'].includes(key)) continue; // Escape closes help; Shift+/ is ?.

    assert.equal(listed.includes(key), true, `handled key ${key} missing from shortcut list`);
  }
  const banned = ['PageUp', 'PageDown', 'Insert', 'Delete', 'Home', 'End', 'F2', 'F3', 'F7', 'F12', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Backspace', '~', '!', '(', ')', '*', '$', '{', '5', '6', '7', '8', '9', '0', ';', '}', '<', '>', '_', '=', '-', '|', '@', '#', '%', '`', '&', '^', '"', ':', '.', ',', "'"];
  for (const key of banned) {
    assert.equal(bound.includes(key), false, `banned key ${key} is bound again`);
  }
  assert.match(scriptSource, /event\.metaKey \|\| event\.ctrlKey \|\| event\.altKey/);
  assert.match(scriptSource, /const LAST_WORKBENCH_KEY = 'decision-labs\.last-workbench'/);
});

test('catalog keeps one copy tool per printed list and a visible fallback', () => {
  const copyButtons = [...html.matchAll(/<button[^>]*id="copy-([a-z-]+)"/g)].map((m) => m[1]);
  assert.deepEqual([...new Set(copyButtons)].sort(), ['catalog-url', 'how', 'jobs', 'lede', 'trust', 'versions']);
  for (const id of ['copy-lede', 'copy-versions', 'copy-jobs', 'copy-how', 'copy-trust']) {
    assert.match(html, new RegExp(`id="${id}-fallback"`));
  }
  assert.doesNotMatch(html, /fetch\(/);
});

test('copy buttons list aria-keyshortcuts only for keys the script handles', () => {
  const keys = [...html.matchAll(/aria-keyshortcuts="([^"]+)"/g)].map((m) => m[1]);
  for (const key of keys) {
    const handled = scriptSource.includes(`key === '${key}'`) || scriptSource.includes(`${key}: `);
    assert.equal(handled, true, `aria-keyshortcuts ${key} has no handler`);
  }
});

test('in-page shortcut list matches the handled keys', () => {
  const listed = [...html.matchAll(/<dt><kbd>([^<]+)<\/kbd><\/dt>/g)].map((m) => m[1]);
  assert.deepEqual(listed, ['1', '2', '3', '4', 'h', 'm', 'n', 'w', 'k', 't', 'l', 'o', 'x', 'p', 'c', 'e', 'v', 'j']);
});

test('catalog script parses as browser JavaScript', () => {
  const parsed = new vm.Script(scriptSource, { filename: 'index.html script' });
  assert.ok(parsed);
});

test('README names the catalog contract without accreted key walls', () => {
  assert.match(readme, /Keys `1` to `4` open the four workbenches/);
  assert.match(readme, /Key `?` on the catalog|Press `?` on the catalog|catalog page\s+for the in-page shortcut list/);
  assert.doesNotMatch(readme, /Key `(?:PageUp|Insert|F10|Shift\+F7)`/);
  assert.match(readme, /Each\s+workbench keeps its own source, tests, generated single-file build, MIT license,/);
});

test('README quick start and check commands stay accurate', () => {
  assert.match(readme, /npm start/);
  assert.match(readme, /127\.0\.0\.1:4170/);
  assert.match(readme, /npm test/);
  assert.match(readme, /npm run check/);
  assert.match(readme, /npm run build:standalone/);
  assert.match(readme, /loopback only/);
  assert.match(readme, /returns HTTP 404/);
  assert.match(readme, /PORT/);
});

test('standalone build links resolve to real files and launcher does not serve sources', async () => {
  const paths = [...html.matchAll(/class="open" href="(apps\/[a-z-]+\/standalone\.html)"/g)].map((m) => m[1]);
  assert.equal(paths.length, 4);
  for (const path of paths) {
    assert.doesNotThrow(() => readFileSync(new URL(`../${path}`, import.meta.url)));
  }
  const serve = readFileSync(new URL('../scripts/serve.mjs', import.meta.url), 'utf8');
  for (const path of paths) {
    assert.match(serve, new RegExp(path.replace(/\//g, '\\/')));
  }
});

test('workbench cards keep versions, recency notes, review paths, and samples', () => {
  const cards = [...html.matchAll(/<article class="workbench"[\s\S]*?<\/article>/g)].map((m) => m[0]);
  assert.equal(cards.length, 4);
  for (const card of cards) {
    assert.match(card, /data-app-version="/);
    assert.match(card, /data-last-workbench="\d"/);
    assert.match(card, /class="review-path" tabindex="-1"/);
    assert.match(card, /class="sample">You will see/);
    assert.match(card, /aria-keyshortcuts="[1-4]"/);
  }
});

test('what&#39;s new is a short, real list and mentions this release', () => {
  const entries = [...html.matchAll(/<h3 tabindex="-1">([^<]+)<\/h3>/g)].map((m) => m[1]);
  assert.ok(entries.length >= 4, 'What&#39;s new lost its real entries');
  assert.ok(entries.length <= 6, `What&#39;s new re-accreted: ${entries.length} entries`);
  assert.match(entries[0], /Weekend Gap 1\.6\.0/);
});

test('catalog intro and lede stay plain and assert the local boundary', () => {
  assert.match(html, /Make the assumptions visible\./);
  assert.match(html, /There is no shared account, no hosted service, and no model that claims to decide for you\./);
});

test('trust section keeps the honest non-goals list', () => {
  assert.match(html, /Local-first\./);
  assert.match(html, /No account\./);
  assert.match(html, /Deterministic math\./);
  assert.match(html, /Not a decision maker\./);
  assert.match(html, /Model notes live in each workbench\./);
});

test('CI workflow runs the root suite', () => {
  const workflow = readFileSync(new URL('../.github/workflows/decision-labs.yml', import.meta.url), 'utf8');
  assert.match(workflow, /npm test/);
});
