import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const readme = readFileSync(new URL('../README.md', import.meta.url), 'utf8');

test('catalog keeps the accessible shell and visible focus contract', () => {
  assert.match(html, /<html lang="en">/);
  assert.match(html, /<header class="shell hero">/);
  assert.match(html, /<nav class="shell site-nav" aria-label="On this page">/);
  assert.match(html, /<main class="shell" id="main" tabindex="-1">/);
  assert.match(html, /<footer class="shell site-footer">/);
  assert.match(html, /<nav class="skip-links" aria-label="Skip links">/);
  for (const id of ['main', 'workbenches', 'how-it-works', 'trust', 'version-line']) {
    assert.match(html, new RegExp(`href="#${id}"`));
  }
  assert.match(html, /:focus-visible/);
  assert.match(html, /prefers-reduced-motion: reduce/);
  for (const id of ['catalog-heading', 'workbenches', 'how-it-works', 'trust', 'version-line']) {
    assert.match(html, new RegExp(`id="${id}"[^>]*tabindex="-1"`));
  }
});

test('catalog presents four app entrypoints with jobs, samples, review prompts, and actions', () => {
  const cards = [...html.matchAll(/<article class="workbench"[^>]*data-workbench="([1-4])"[\s\S]*?<h3>([^<]+)<\/h3>[\s\S]*?<p class="job">([^<]+)<\/p>[\s\S]*?<p class="sample">([\s\S]*?)<\/p>[\s\S]*?<a class="open" href="([^"]+)">Open workbench<\/a>/g)];
  assert.equal(cards.length, 4);
  assert.deepEqual(cards.map(([, number, name, job, sample, href]) => [number, name, job, href]), [
    ['1', 'Partnership Breakpoint', 'Find which participant in a revenue split reaches an exit threshold first when volume, fees, or costs move.', 'apps/partnership-breakpoint/standalone.html'],
    ['2', 'Common Cart', 'Pool buyer constraints and compare conditional merchant offers without exposing individual buyer records to the merchant view.', 'apps/common-cart/standalone.html'],
    ['3', 'The Smallest Agreement', 'Find the lowest-cost set of clause changes that still crosses an approval threshold while respecting support floors, locks, and a change budget.', 'apps/smallest-agreement/standalone.html'],
    ['4', 'Weekend Gap', 'Follow synthetic AUD redemption demand from Friday to Monday and see how reserves and settlement windows change the queue when banking is closed.', 'apps/weekend-gap/standalone.html'],
  ]);
  assert.equal([...html.matchAll(/class="open"[^>]*>Open workbench<\/a>/g)].length, 4);
  assert.equal([...html.matchAll(/class="how" href="#how-it-works">How it works<\/a>/g)].length, 4);
  assert.match(html, /<strong>Balanced<\/strong>/);
  assert.match(html, /synthetic <strong>coffee<\/strong>/);
  assert.match(html, /<strong>Neighbourhood Plan<\/strong>/);
  assert.match(html, /<strong>Normal Friday<\/strong>/);
  assert.match(html, /class="review-path"><strong>/);
});

test('catalog keeps the worked case and concise operating guidance', () => {
  assert.ok(readFileSync(new URL('../docs/CASE_STUDY.md', import.meta.url), 'utf8').trim().length > 0);
  assert.match(html, /href="https:\/\/github\.com\/EauDoon\/decision-labs\/blob\/main\/docs\/CASE_STUDY\.md">Read the worked case in repository documentation<\/a>/);
  assert.match(html, /href="https:\/\/github\.com\/EauDoon\/decision-labs\/blob\/main\/README\.md">Repository README documentation<\/a>/);
  assert.match(html, /standalone\.html/);
  assert.match(html, /Export JSON/);
  assert.match(html, /id="how-it-works"/);
  assert.match(html, /id="trust"/);
  assert.match(html, /Do not share drafts/);
  assert.match(html, /Deterministic models/);
  assert.match(html, /Not a decision maker|Decision aid/);
});

test('README keeps direct links to each source model document', () => {
  for (const app of ['partnership-breakpoint', 'common-cart', 'smallest-agreement', 'weekend-gap']) {
    assert.match(readme, new RegExp(`\\]\\(apps/${app}\\/MODEL\\.md\\)`));
  }
});

test('catalog leaves normal browser navigation keys alone', () => {
  assert.doesNotMatch(html, /<script\b/i);
  assert.doesNotMatch(html, /keydown|keyup|keypress|preventDefault|stopPropagation/);
  assert.doesNotMatch(html, /aria-keyshortcuts/);
  assert.doesNotMatch(html, /class="copy-[^"]+"|id="copy-[^"]+"/);
  assert.doesNotMatch(html, /Keyboard shortcuts|What's new/);
});

test('catalog and README stay concise and avoid placeholder or dash drift', () => {
  assert.ok(html.split(/\r?\n/).length < 350, 'catalog should remain a small static page');
  assert.ok(readme.split(/\r?\n/).length < 140, 'README should remain a short orientation document');
  for (const [name, source] of [['index.html', html], ['README.md', readme]]) {
    assert.equal(source.includes('\u2014'), false, `${name} contains an em dash`);
    assert.equal(source.includes('\u2013'), false, `${name} contains an en dash`);
    assert.equal(/lorem ipsum/i.test(source), false, `${name} contains placeholder text`);
  }
});
