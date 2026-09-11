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
  assert.match(html, /How-it-works jump, version-line copy, and skip-link focus/);
  assert.match(html, /Skip-link copy, last-card focus, and 404 Copy jobs/);
  assert.match(html, /Trust-item jump, first-job copy, and 404 Copy version line/);
  assert.match(html, /Version-line jump, last-open jump, and 404 Copy first Trust item/);
  assert.match(html, /First How-it-works copy, How copy jump, and last Trust copy/);
  assert.match(html, /Last How copy, last-How jump, and first-How jump/);
  assert.match(html, /Last-job copy, last-job jump, and first-job jump/);
  assert.match(html, /Last What's new copy, last-news jump, and first-news jump/);
  assert.match(html, /First What's new copy, intro jump, and skip-link jump/);
  assert.match(html, /First-workbench copy, first-card jump, and first-trust jump/);
  assert.match(html, /Last-workbench copy, last-card jump, and last-trust jump/);
  assert.match(html, /Last-review copy, last-review jump, and last-path jump/);
  assert.match(html, /First-open copy, first-open jump, and first-open-link jump/);
  assert.match(html, /Last-open copy, last-open jump, and last-open-link jump/);
  assert.match(html, /First-skip copy, first-skip jump, and first-skip-link jump/);
  assert.match(html, /Last-skip copy, last-skip jump, and last-skip-link jump/);
  assert.match(html, /First-skip-text copy, first-skip-text jump, and skip-nav jump/);
  assert.match(html, /Last-skip-text copy, last-skip-text jump, and last-skip-target jump/);
  assert.match(html, /First-review copy, first-review jump, and first-path jump/);
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
  assert.match(html, /Hall split preset, capacity copy, and inspect jump in Partnership Breakpoint 1\.5\.5/);
  assert.match(html, /Festival stall, notes copy, and over-capacity jump in Partnership Breakpoint 1\.5\.6/);
  assert.match(html, /Cinema split, headroom copy, and breakpoint jump in Partnership Breakpoint 1\.5\.7/);
  assert.match(html, /Community radio, least-headroom copy, and print jump in Partnership Breakpoint 1\.5\.8/);
  assert.match(html, /School concert, remaining-to-hold copy, and least-headroom hide in Partnership Breakpoint 1\.5\.9/);
  assert.match(html, /Sports carnival, volume-to-hold copy, and within-capacity hide in Partnership Breakpoint 1\.5\.10/);
  assert.match(html, /Netball carnival, over-capacity copy, and first-breakpoint hide in Partnership Breakpoint 1\.5\.11/);
  assert.match(html, /Swimming carnival, over-capacity label copy, and first-over-capacity hide in Partnership Breakpoint 1\.5\.12/);
  assert.match(html, /Athletics carnival, remaining-capacity copy, and last-over-capacity hide in Partnership Breakpoint 1\.5\.13/);
  assert.match(html, /Cricket carnival, last-over-capacity copy, and last-breakpoint hide in Partnership Breakpoint 1\.5\.14/);
  assert.match(html, /Tennis carnival, last-over-capacity remaining copy, and last-within-capacity hide in Partnership Breakpoint 1\.5\.15/);
  assert.match(html, /Basketball carnival, first-within remaining copy, and first-within hide in Partnership Breakpoint 1\.5\.16/);
  assert.match(html, /Volleyball carnival, last-within remaining copy, and last-spare hide in Partnership Breakpoint 1\.5\.17/);
  assert.match(html, /Rugby carnival, last-spare remaining copy, and first-spare hide in Partnership Breakpoint 1\.5\.18/);
  assert.match(html, /Hockey carnival, first-spare remaining copy, and last-unbounded hide in Partnership Breakpoint 1\.5\.19/);
  assert.match(html, /Baseball carnival, last-unbounded remaining copy, and first-unbounded hide in Partnership Breakpoint 1\.5\.20/);
  assert.match(html, /Softball carnival, first-unbounded remaining copy, and last-at-hold hide in Partnership Breakpoint 1\.5\.21/);
  assert.match(html, /Lacrosse carnival, last-at-hold remaining copy, and first-at-hold hide in Partnership Breakpoint 1\.5\.22/);
  assert.match(html, /Leftover fill and overlap counts in Common Cart 1\.3\.1/);
  assert.match(html, /Offer CSV, sort, and leftover headroom in Common Cart 1\.3\.2/);
  assert.match(html, /Offer export, variant filter, and empty-offer recovery in Common Cart 1\.3\.3/);
  assert.match(html, /Buyer CSV, leftover jump, and garden preset in Common Cart 1\.4\.1/);
  assert.match(html, /Leftover copy, school fete, and overlap Markdown in Common Cart 1\.4\.2/);
  assert.match(html, /Leftover counts, fruit-box preset, and review jump in Common Cart 1\.4\.3/);
  assert.match(html, /Library paper preset, leftover headroom copy, and uncovered jump in Common Cart 1\.4\.4/);
  assert.match(html, /Leftover fill copy, sports kit, and remaining capacity in Common Cart 1\.4\.5/);
  assert.match(html, /Surf club kit, remaining-capacity jump, and leftover-fill copy in Common Cart 1\.4\.6/);
  assert.match(html, /Theatre wardrobe, leftover-fill units, and print jump in Common Cart 1\.4\.7/);
  assert.match(html, /Choir folders, leftover-units copy, and leftover hide in Common Cart 1\.4\.8/);
  assert.match(html, /Scout camp, leftover-units copy, and remaining-capacity hide in Common Cart 1\.4\.9/);
  assert.match(html, /School excursion, leftover-merchant copy, and unserved hide in Common Cart 1\.4\.10/);
  assert.match(html, /Netball canteen, leftover-remaining copy, and leftover-only hide in Common Cart 1\.4\.11/);
  assert.match(html, /Swimming carnival lunch, leftover-fulfillment copy, and winner-allocated hide in Common Cart 1\.4\.12/);
  assert.match(html, /Athletics carnival lunch, leftover-delivery copy, and leftover-fill hide in Common Cart 1\.4\.13/);
  assert.match(html, /Cricket carnival lunch, leftover-pickup copy, and last leftover-fill hide in Common Cart 1\.4\.14/);
  assert.match(html, /Tennis carnival lunch, leftover-label copy, and first leftover-fill hide in Common Cart 1\.4\.15/);
  assert.match(html, /Basketball carnival lunch, leftover-minimum copy, and first tertiary-fill hide in Common Cart 1\.4\.16/);
  assert.match(html, /Volleyball carnival lunch, leftover-maximum copy, and last tertiary-fill hide in Common Cart 1\.4\.17/);
  assert.match(html, /Soccer carnival lunch, tertiary-remaining copy, and last unserved hide in Common Cart 1\.4\.18/);
  assert.match(html, /Rugby carnival lunch, tertiary-maximum copy, and first unserved hide in Common Cart 1\.4\.19/);
  assert.match(html, /Hockey carnival lunch, leftover-uncovered remaining copy, and last leftover-only hide in Common Cart 1\.4\.20/);
  assert.match(html, /Baseball carnival lunch, leftover-uncovered maximum copy, and first leftover-only hide in Common Cart 1\.4\.21/);
  assert.match(html, /Softball carnival lunch, leftover-uncovered minimum copy, and last winner-allocated hide in Common Cart 1\.4\.22/);
  assert.match(html, /Package pin, locks, and notes in The Smallest Agreement 1\.4\.1/);
  assert.match(html, /Facilitator pack and group CSV in The Smallest Agreement 1\.4\.2/);
  assert.match(html, /Clause CSV, veto filter, and quiet-hours preset in The Smallest Agreement 1\.4\.3/);
  assert.match(html, /Locked-clause filter, fixture-night preset, and package copy in The Smallest Agreement 1\.5\.1/);
  assert.match(html, /Stall-hours preset, lock copy, and clause filters in The Smallest Agreement 1\.5\.2/);
  assert.match(html, /Bike-shed preset, package copy, and budget filter in The Smallest Agreement 1\.5\.3/);
  assert.match(html, /Stall lighting, remaining-budget copy, and floor jump in The Smallest Agreement 1\.5\.4/);
  assert.match(html, /Hall hire preset, threshold copy, and veto jump in The Smallest Agreement 1\.5\.5/);
  assert.match(html, /Garden watering, lock-count copy, and threshold jump in The Smallest Agreement 1\.5\.6/);
  assert.match(html, /Laundry hours, lock-count jump, and locked-clause hide in The Smallest Agreement 1\.5\.7/);
  assert.match(html, /BBQ hours, first-lock copy, and threshold-group hide in The Smallest Agreement 1\.5\.8/);
  assert.match(html, /School disco, below-floor copy, and below-threshold hide in The Smallest Agreement 1\.5\.9/);
  assert.match(html, /Sports day, below-floor copy, and veto hide in The Smallest Agreement 1\.5\.10/);
  assert.match(html, /Netball training, threshold-count copy, and non-veto hide in The Smallest Agreement 1\.5\.11/);
  assert.match(html, /Swimming club hours, first-veto copy, and first-veto hide in The Smallest Agreement 1\.5\.12/);
  assert.match(html, /Athletics club hours, veto-count copy, and last-veto hide in The Smallest Agreement 1\.5\.13/);
  assert.match(html, /Cricket club hours, first-non-veto copy, and first-non-veto hide in The Smallest Agreement 1\.5\.14/);
  assert.match(html, /Tennis club hours, last-veto copy, and last-non-veto hide in The Smallest Agreement 1\.5\.15/);
  assert.match(html, /Basketball club hours, last-non-veto copy, and last-below-threshold hide in The Smallest Agreement 1\.5\.16/);
  assert.match(html, /Volleyball club hours, last-below-threshold copy, and first-below-threshold hide in The Smallest Agreement 1\.5\.17/);
  assert.match(html, /Soccer club hours, first-below-threshold copy, and last-at-or-above hide in The Smallest Agreement 1\.5\.18/);
  assert.match(html, /Hockey club hours, last-at-or-above copy, and first-at-or-above hide in The Smallest Agreement 1\.5\.19/);
  assert.match(html, /Rugby club hours, first-at-or-above copy, and last-at-floor hide in The Smallest Agreement 1\.5\.20/);
  assert.match(html, /Softball club hours, last-at-floor copy, and first-at-floor hide in The Smallest Agreement 1\.5\.21/);
  assert.match(html, /Lacrosse club hours, last-below-floor copy, and first-below-floor hide in The Smallest Agreement 1\.5\.22/);
  assert.match(html, /Queue-clear hours and Gantt compare in Weekend Gap 1\.4\.1/);
  assert.match(html, /Queue CSV, peak jump, and long-weekend preset in Weekend Gap 1\.4\.2/);
  assert.match(html, /Dashboard copy, file compare, and compressed Friday in Weekend Gap 1\.4\.3/);
  assert.match(html, /Gantt hour copy, payday burst, and dashboard CSV in Weekend Gap 1\.5\.1/);
  assert.match(html, /Peak-hour copy, holiday Monday, and gate filter in Weekend Gap 1\.5\.2/);
  assert.match(html, /Hours-to-clear copy, Saturday market, and hour persist in Weekend Gap 1\.5\.3/);
  assert.match(html, /Sunday stall close, reserve copy, and weekend Gantt filter in Weekend Gap 1\.5\.4/);
  assert.match(html, /Thin Saturday FX, settlement copy, and issuer jump in Weekend Gap 1\.5\.5/);
  assert.match(html, /Early Monday bank, settlement jump, and weekend Gantt hide in Weekend Gap 1\.5\.6/);
  assert.match(html, /Late FX close, settlement copy, and closed Gantt hide in Weekend Gap 1\.5\.7/);
  assert.match(html, /Late issuer, hours-to-clear copy, and zero-queue hide in Weekend Gap 1\.5\.8/);
  assert.match(html, /Early Saturday FX, bank-hour copy, and bank-closed hide in Weekend Gap 1\.5\.9/);
  assert.match(html, /Sunday late bank, issuer-hour copy, and issuer-closed hide in Weekend Gap 1\.5\.10/);
  assert.match(html, /Sunday late payout, payout-hour copy, and payout-closed hide in Weekend Gap 1\.5\.11/);
  assert.match(html, /Saturday early payout, closed-FX copy, and FX-closed hide in Weekend Gap 1\.5\.12/);
  assert.match(html, /Friday early payout, open-payout copy, and payout-open hide in Weekend Gap 1\.5\.13/);
  assert.match(html, /Saturday late payout, open-FX copy, and FX-open hide in Weekend Gap 1\.5\.14/);
  assert.match(html, /Sunday early payout, open-bank copy, and bank-open hide in Weekend Gap 1\.5\.15/);
  assert.match(html, /Sunday late issuer close, issuer-open copy, and issuer-open hide in Weekend Gap 1\.5\.16/);
  assert.match(html, /Sunday early issuer open, last-open-issuer copy, and weekend-issuer-open hide in Weekend Gap 1\.5\.17/);
  assert.match(html, /Saturday early issuer open, last-closed-issuer copy, and weekend-issuer-closed hide in Weekend Gap 1\.5\.18/);
  assert.match(html, /Friday early issuer open, last-closed-bank copy, and weekend-bank-closed hide in Weekend Gap 1\.5\.19/);
  assert.match(html, /Saturday early bank open, last-open-bank copy, and weekend-bank-open hide in Weekend Gap 1\.5\.20/);
  assert.match(html, /Friday early bank open, last-open-payout copy, and weekend-payout-open hide in Weekend Gap 1\.5\.21/);
  assert.match(html, /Saturday late bank open, last-open-FX copy, and weekend-FX-open hide in Weekend Gap 1\.5\.22/);
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
  assert.match(readme, /leftover fill copy, the Sports club match-day kit start/);
  assert.match(readme, /remaining-capacity jump, the Surf club first-aid kit start/);
  assert.match(readme, /leftover-fill unit-count copy, the Theatre wardrobe kit start/);
  assert.match(readme, /leftover-fill unit-count copy shortcut, the Community choir folders start/);
  assert.match(readme, /uncovered leftover unit-count copy shortcut, the Scout camp kit start/);
  assert.match(readme, /leftover-fill merchant copy shortcut, the School excursion lunch start/);
  assert.match(readme, /leftover-fill remaining copy shortcut, the Netball canteen start/);
  assert.match(readme, /leftover-fill fulfillment copy shortcut, the Swimming carnival lunch start/);
  assert.match(readme, /leftover-fill delivery copy shortcut, the Athletics carnival lunch start/);
  assert.match(readme, /leftover-fill pickup copy shortcut, the Cricket carnival lunch start/);
  assert.match(readme, /leftover-fill label copy shortcut, the Tennis carnival lunch start/);
  assert.match(readme, /leftover-fill minimum copy shortcut, the Basketball carnival lunch start/);
  assert.match(readme, /leftover-fill maximum copy shortcut, the Volleyball carnival lunch start/);
  assert.match(readme, /tertiary-fill remaining copy shortcut, the Soccer carnival lunch start/);
  assert.match(readme, /tertiary-fill maximum copy shortcut, the Rugby carnival lunch start/);
  assert.match(readme, /leftover uncovered remaining copy shortcut, the Hockey carnival lunch start/);
  assert.match(readme, /leftover uncovered maximum copy shortcut, the Baseball carnival lunch start/);
  assert.match(readme, /leftover uncovered minimum copy shortcut, the Softball carnival lunch start/);
  assert.match(readme, /waterfall SVG download, compare and print keys/);
  assert.match(readme, /waterfall\s+Markdown copy, the Talent, agent, and platform start/);
  assert.match(readme, /tornado Markdown copy, the\s+Three-party joint venture start/);
  assert.match(readme, /allocation-balance\s+Markdown copy, the Podcast host and network start/);
  assert.match(readme, /capacity-utilization Markdown copy, the Community hall split start/);
  assert.match(readme, /first-breakpoint participant copy, the Festival stall split start/);
  assert.match(readme, /least-headroom participant copy, the Pop-up cinema split start/);
  assert.match(readme, /least-headroom copy shortcut, the Community radio split start/);
  assert.match(readme, /remaining-to-hold copy shortcut, the School concert split start/);
  assert.match(readme, /volume-to-hold copy shortcut, the Sports carnival split start/);
  assert.match(readme, /over-capacity count copy shortcut, the Netball carnival split start/);
  assert.match(readme, /over-capacity label copy shortcut, the Swimming carnival split start/);
  assert.match(readme, /remaining-capacity copy shortcut, the Athletics carnival split start/);
  assert.match(readme, /last-over-capacity copy shortcut, the Cricket carnival split start/);
  assert.match(readme, /last-over-capacity remaining copy shortcut, the Tennis carnival split start/);
  assert.match(readme, /first-within-capacity remaining copy shortcut, the Basketball carnival split start/);
  assert.match(readme, /last-within-capacity remaining copy shortcut, the Volleyball carnival split start/);
  assert.match(readme, /last-spare-capacity remaining copy shortcut, the Rugby carnival split start/);
  assert.match(readme, /first-spare-capacity remaining copy shortcut, the Hockey carnival split start/);
  assert.match(readme, /last-unbounded remaining-to-hold copy shortcut, the Baseball carnival split start/);
  assert.match(readme, /first-unbounded remaining-to-hold copy shortcut, the Softball carnival split start/);
  assert.match(readme, /last-at-hold remaining-to-hold copy shortcut, the Lacrosse carnival split start/);
  assert.match(readme, /package pin, locks, and notes/);
  assert.match(readme, /facilitator pack, group CSV/);
  assert.match(readme, /clause CSV\s+import, veto-only filter/);
  assert.match(readme, /locked-clause filter, Sports Fixture Night/);
  assert.match(readme, /Market stall hours start, lock Markdown copy/);
  assert.match(readme, /Shared bike shed start,\s+recommended-package Markdown copy/);
  assert.match(readme, /Street stall lighting start,\s+remaining change-budget copy/);
  assert.match(readme, /Hall hire hours start,\s+numeric approval-threshold copy/);
  assert.match(readme, /Community garden watering start,\s+lock-count copy/);
  assert.match(readme, /Shared laundry hours start,\s+first-locked-option copy/);
  assert.match(readme, /Rooftop BBQ hours start,\s+first-locked-option copy shortcut/);
  assert.match(readme, /School disco hours start, below-floor count copy shortcut/);
  assert.match(readme, /Sports day hours start, first below-floor group copy shortcut/);
  assert.match(readme, /Netball training hours start, threshold-group count copy shortcut/);
  assert.match(readme, /Swimming club hours start, first-veto-group copy shortcut/);
  assert.match(readme, /Athletics club hours start, veto-group count copy shortcut/);
  assert.match(readme, /Cricket club hours start, first-non-veto-group copy shortcut/);
  assert.match(readme, /Tennis club hours start, last-veto-group copy shortcut/);
  assert.match(readme, /Basketball club hours start, last-non-veto-group copy shortcut/);
  assert.match(readme, /Volleyball club hours start, last-below-threshold group copy shortcut/);
  assert.match(readme, /Soccer club hours start, first-below-threshold group copy shortcut/);
  assert.match(readme, /Hockey club hours start, last-at-or-above-threshold group copy shortcut/);
  assert.match(readme, /Rugby club hours start, first-at-or-above-threshold group copy shortcut/);
  assert.match(readme, /Softball club hours start, last-at-floor group copy shortcut/);
  assert.match(readme, /Lacrosse club hours start, last-below-floor group copy shortcut/);
  assert.match(readme, /queue-clear hours and Gantt compare/);
  assert.match(readme, /queue CSV export, peak-queue jump/);
  assert.match(readme, /dashboard Markdown copy, two-file compare/);
  assert.match(readme, /Gantt hour Markdown copy,\s+Payday Friday burst/);
  assert.match(readme, /peak-queue hour copy, Public-holiday Monday/);
  assert.match(readme, /hours-to-clear Markdown copy, Saturday market\s+burst/);
  assert.match(readme, /remaining\s+reserve copy, Sunday stall close/);
  assert.match(readme, /hours-to-first-settlement Markdown copy, Thin Saturday FX/);
  assert.match(readme, /first-settlement jump, Early Monday bank open/);
  assert.match(readme, /first-settlement copy shortcut, Friday late FX close/);
  assert.match(readme, /hours-to-clear copy shortcut, Monday late issuer open/);
  assert.match(readme, /first-closed-bank copy shortcut, Saturday early FX open/);
  assert.match(readme, /first-closed-issuer copy shortcut, Sunday late bank close/);
  assert.match(readme, /first-closed-payout copy shortcut, Sunday late payout close/);
  assert.match(readme, /first-closed-FX copy shortcut, Saturday early payout open/);
  assert.match(readme, /first-open-payout copy shortcut, Friday early payout open/);
  assert.match(readme, /first-open-FX copy shortcut, Saturday late payout open/);
  assert.match(readme, /first-open-bank copy shortcut, Sunday early payout open/);
  assert.match(readme, /first-open-issuer copy shortcut, Sunday late issuer close/);
  assert.match(readme, /last-open-issuer copy shortcut, Sunday early issuer open/);
  assert.match(readme, /last-closed-issuer copy shortcut, Saturday early issuer open/);
  assert.match(readme, /last-closed-bank copy shortcut, Friday early issuer open/);
  assert.match(readme, /last-open-bank copy shortcut, Saturday early bank open/);
  assert.match(readme, /last-open-payout copy shortcut, Friday early bank open/);
  assert.match(readme, /last-open-FX copy shortcut, Saturday late bank open/);
  assert.match(readme, /how-it-works jump, version-line copy, and skip-link focus/);
  assert.match(readme, /skip-link copy, last-card focus, and 404 Copy jobs/);
  assert.match(readme, /trust-item jump, first-job copy, and 404 Copy version line/);
  assert.match(readme, /version-line jump, last-open jump, and 404 Copy first Trust item/);
  assert.match(readme, /first How-it-works copy, How copy jump, and last Trust copy/);
  assert.match(readme, /last How-it-works copy, last-How jump, and first-How jump/);
  assert.match(readme, /last-job copy, last-job jump, and first-job jump/);
  assert.match(readme, /last What's new copy, last-news jump, and first-news jump/);
  assert.match(readme, /first What's new copy, intro jump, and skip-link jump/);
  assert.match(readme, /first-workbench copy, first-card jump, and first-trust jump/);
  assert.match(readme, /last-workbench copy, last-card jump, and last-trust jump/);
  assert.match(readme, /last-review copy, last-review jump, and last-path jump/);
  assert.match(readme, /first-open copy, first-open jump, and first-open-link jump/);
  assert.match(readme, /last-open copy, last-open jump, and last-open-link jump/);
  assert.match(readme, /first-skip copy, first-skip jump, and first-skip-link jump/);
  assert.match(readme, /last-skip copy, last-skip jump, and last-skip-link jump/);
  assert.match(readme, /first-skip-text copy, first-skip-text jump, and skip-nav jump/);
  assert.match(readme, /last-skip-text copy, last-skip-text jump, and last-skip-target jump/);
  assert.match(readme, /does not change workbench versions/);
  assert.match(readme, /not hosted APIs/);
  assert.match(readme, /does not serve those\s+markdown files/);
  assert.match(readme, /Catalog keys `w`, `k`, `n`, and `c`/);
  assert.match(readme, /Copy versions on that 404 page copies/);
  assert.match(readme, /Copy Trust and limits on that 404 page copies/);
  assert.match(readme, /Copy How it works on that 404 page copies/);
  assert.match(readme, /Copy jobs on that 404 page copies/);
  assert.match(readme, /Copy catalog intro on that 404 page copies/);
  assert.match(readme, /Copy version line on that 404 page copies/);
  assert.match(readme, /Copy first Trust item on that 404 page copies/);
  assert.match(readme, /Copy first How it works item on\s+that 404 page copies/);
  assert.match(readme, /Copy last How it works item on\s+that 404 page copies/);
  assert.match(readme, /Copy last job on\s+that 404 page copies/);
  assert.match(readme, /Copy last What's new heading on\s+that 404 page copies/);
  assert.match(readme, /Copy first What's new heading on\s+that 404 page copies/);
  assert.match(readme, /Copy first workbench heading on\s+that 404 page copies/);
  assert.match(readme, /Copy last workbench heading on\s+that 404 page copies/);
  assert.match(readme, /Copy last review path on\s+that 404 page copies/);
  assert.match(readme, /Copy first Open href on\s+that 404 page copies/);
  assert.match(readme, /Copy last Open href on\s+that 404 page copies/);
  assert.match(readme, /Copy first skip href on\s+that 404 page copies/);
  assert.match(readme, /Copy last skip href on\s+that 404 page copies/);
  assert.match(readme, /Copy first skip text on\s+that 404 page copies/);
  assert.match(readme, /does not fetch a\s+policy file or add another public path/);
  assert.match(readme, /Key `m` focuses the main catalog content/);
  assert.match(readme, /Key `s` focuses the first Open\s+workbench link without opening it/);
  assert.match(readme, /Key `a` focuses the first workbench article/);
  assert.match(readme, /Key `f` focuses the footer version line/);
  assert.match(readme, /Key `g` focuses the first What's new heading/);
  assert.match(readme, /Key `d` focuses the/);
  assert.match(readme, /first How it works list item/);
  assert.match(readme, /Key `\/` focuses the first Trust and/);
  assert.match(readme, /Key `;` copies the first workbench name/);
  assert.match(readme, /Key `,` copies the footer version line/);
  assert.match(readme, /Key `.` focuses Skip to catalog versions/);
  assert.match(readme, /Key `'` focuses Skip to Trust and limits/);
  assert.match(readme, /Key `p` prints this catalog page/);
  assert.match(readme, /Key `\$` copies the last workbench heading/);
  assert.match(readme, /Key `\^` focuses the Copy last workbench heading control/);
  assert.match(readme, /Key `` ` `` focuses the Copy last Trust item control/);
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
  assert.match(readme, /Press `d` to focus the first How it works list item/);
  assert.match(readme, /Press `n` to focus What's\s+new/);
  assert.match(readme, /Press `c` to copy the catalog address/);
  assert.match(readme, /Press `,` to copy the footer version line/);
  assert.match(readme, /Press `.` to focus Skip to catalog versions/);
  assert.match(readme, /Press `\/` to focus the first Trust and limits list item/);
  assert.match(readme, /Press `;` to copy the first workbench name/);
  assert.match(readme, /Press `'` to focus Skip to Trust and limits/);
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

test('period focuses Skip to catalog versions when focus is not in an input', () => {
  assert.match(html, /event\.key === '\.'/);
  assert.match(html, /querySelector\('a\.skip\[href="#version-line"\]'\)\?\.focus\(\)/);
  assert.match(html, /class="skip" href="#version-line">Skip to catalog versions/);
  assert.match(html, /<kbd>\.<\/kbd><\/dt><dd>Focus Skip to catalog versions/);
  assert.match(html, /Press <kbd>\.<\/kbd> to focus Skip to catalog versions/);
  assert.match(html, /This key moves focus; it does not open a workbench/);
  assert.match(html, /inEditable\(event\.target\)/);
  assert.match(readme, /Press `.` to focus Skip to catalog versions/);
  const focused = [];
  const assigned = [];
  let keydown = null;
  const skipVersions = { focus() { focused.push('skip-versions'); } };
  const document = {
    getElementById(id) {
      if (id === 'shortcuts') return { hidden: true };
      if (id === 'shortcuts-open') return { setAttribute() {}, addEventListener() {} };
      if (id === 'shortcuts-close') return { addEventListener() {} };
      if (id === 'skip-shortcuts') return { addEventListener() {} };
      return null;
    },
    querySelector(selector) {
      return selector === 'a.skip[href="#version-line"]' ? skipVersions : null;
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
  fire('.', input);
  fire('.', textarea);
  assert.deepEqual(focused, []);
  assert.deepEqual(assigned, []);
  fire('.', body);
  assert.deepEqual(focused, ['skip-versions']);
  assert.deepEqual(assigned, []);
});

test('apostrophe focuses Skip to Trust and limits when focus is not in an input', () => {
  assert.match(html, /event\.key === "'"/);
  assert.match(html, /querySelector\('a\.skip\[href="#trust"\]'\)\?\.focus\(\)/);
  assert.match(html, /class="skip" href="#trust">Skip to Trust and limits/);
  assert.match(html, /<kbd>'<\/kbd><\/dt><dd>Focus Skip to Trust and limits/);
  assert.match(html, /Press <kbd>'<\/kbd> to focus Skip to Trust and limits/);
  assert.match(html, /This key moves focus; it does not open a workbench/);
  assert.match(html, /inEditable\(event\.target\)/);
  assert.match(readme, /Press `'` to focus Skip to Trust and limits/);
  const focused = [];
  const assigned = [];
  let keydown = null;
  const skipTrust = { focus() { focused.push('skip-trust'); } };
  const document = {
    getElementById(id) {
      if (id === 'shortcuts') return { hidden: true };
      if (id === 'shortcuts-open') return { setAttribute() {}, addEventListener() {} };
      if (id === 'shortcuts-close') return { addEventListener() {} };
      if (id === 'skip-shortcuts') return { addEventListener() {} };
      return null;
    },
    querySelector(selector) {
      return selector === 'a.skip[href="#trust"]' ? skipTrust : null;
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
  fire("'", input);
  fire("'", textarea);
  assert.deepEqual(focused, []);
  assert.deepEqual(assigned, []);
  fire("'", body);
  assert.deepEqual(focused, ['skip-trust']);
  assert.deepEqual(assigned, []);
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

test('d focuses the first How it works list item when focus is not in an input', () => {
  assert.match(html, /event\.key === 'd'/);
  assert.match(html, /querySelector\('#how-it-works li'\)/);
  assert.match(html, /getElementById\('how-title'\)/);
  assert.match(html, /id="how-title" tabindex="-1"/);
  assert.match(html, /<li tabindex="-1"><strong>Standalone files/);
  assert.match(html, /#how-it-works li:focus-visible/);
  assert.match(html, /<kbd>d<\/kbd><\/dt><dd>Focus the first How it works list item/);
  assert.match(html, /Press <kbd>d<\/kbd> to focus the first How it works list item/);
  assert.match(html, /This key moves focus; it does not open a workbench/);
  assert.match(html, /inEditable\(event\.target\)/);
  assert.match(readme, /Press `d` to focus the first How it works list item/);
  assert.match(readme, /does not open a workbench/);
  const focused = [];
  const assigned = [];
  let keydown = null;
  const firstHow = { focus() { focused.push('li'); } };
  const title = { focus() { focused.push('title'); } };
  const section = { focus() { focused.push('how-it-works'); } };
  const document = {
    getElementById(id) {
      if (id === 'how-title') return title;
      if (id === 'how-it-works') return section;
      if (id === 'shortcuts') return { hidden: true };
      if (id === 'shortcuts-open') return { setAttribute() {}, addEventListener() {} };
      if (id === 'shortcuts-close') return { addEventListener() {} };
      if (id === 'skip-shortcuts') return { addEventListener() {} };
      return null;
    },
    querySelector(selector) {
      return selector === '#how-it-works li' ? firstHow : null;
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
  fire('d', input);
  assert.deepEqual(focused, []);
  assert.deepEqual(assigned, []);
  fire('d', body);
  assert.deepEqual(focused, ['li']);
  assert.deepEqual(assigned, []);
});

test('d focuses the How it works heading when no list item exists', () => {
  const focused = [];
  const assigned = [];
  let keydown = null;
  const title = { focus() { focused.push('title'); } };
  const document = {
    getElementById(id) {
      if (id === 'how-title') return title;
      if (id === 'how-it-works') return { focus() { focused.push('how-it-works'); } };
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
    window: { location: { assign(href) { assigned.push(href); } } },
  });
  keydown({
    key: 'd',
    target: { tagName: 'BODY', closest() { return null; } },
    defaultPrevented: false,
    altKey: false,
    ctrlKey: false,
    metaKey: false,
    shiftKey: false,
    preventDefault() {},
  });
  assert.deepEqual(focused, ['title']);
  assert.deepEqual(assigned, []);
});

test('slash focuses the first Trust list item when focus is not in an input', () => {
  assert.match(html, /event\.key === '\/'/);
  assert.match(html, /querySelector\('#trust li'\)/);
  assert.match(html, /getElementById\('trust-title'\)/);
  assert.match(html, /id="trust-title" tabindex="-1"/);
  assert.match(html, /<li tabindex="-1"><strong>Local-first/);
  assert.match(html, /#trust li:focus-visible/);
  assert.match(html, /<kbd>\/<\/kbd><\/dt><dd>Focus the first Trust and limits list item/);
  assert.match(html, /Press <kbd>\/<\/kbd> to focus the first Trust and limits list item/);
  assert.match(html, /This key moves focus; it does not open a workbench/);
  assert.match(html, /Shift\+\/ stays <kbd>\?<\/kbd>/);
  assert.match(html, /event\.key === '\?'/);
  assert.match(html, /inEditable\(event\.target\)/);
  assert.match(readme, /Press `\/` to focus the first Trust and limits list item/);
  const focused = [];
  const assigned = [];
  let keydown = null;
  const firstTrust = { focus() { focused.push('li'); } };
  const title = { focus() { focused.push('title'); } };
  const section = { focus() { focused.push('trust'); } };
  const document = {
    getElementById(id) {
      if (id === 'trust-title') return title;
      if (id === 'trust') return section;
      if (id === 'shortcuts') return { hidden: true };
      if (id === 'shortcuts-open') return { setAttribute() {}, addEventListener() {} };
      if (id === 'shortcuts-close') return { addEventListener() {} };
      if (id === 'skip-shortcuts') return { addEventListener() {} };
      return null;
    },
    querySelector(selector) {
      return selector === '#trust li' ? firstTrust : null;
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
  const fire = (key, target, extra = {}) => {
    keydown({
      key,
      target,
      defaultPrevented: false,
      altKey: false,
      ctrlKey: false,
      metaKey: false,
      shiftKey: false,
      preventDefault() {},
      ...extra,
    });
  };
  const input = { tagName: 'INPUT', closest() { return input; } };
  const body = { tagName: 'BODY', closest() { return null; } };
  fire('/', input);
  assert.deepEqual(focused, []);
  assert.deepEqual(assigned, []);
  fire('/', body);
  assert.deepEqual(focused, ['li']);
  assert.deepEqual(assigned, []);
});

test('slash focuses the Trust heading when no list item exists', () => {
  const focused = [];
  const assigned = [];
  let keydown = null;
  const title = { focus() { focused.push('title'); } };
  const document = {
    getElementById(id) {
      if (id === 'trust-title') return title;
      if (id === 'trust') return { focus() { focused.push('trust'); } };
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
    window: { location: { assign(href) { assigned.push(href); } } },
  });
  keydown({
    key: '/',
    target: { tagName: 'BODY', closest() { return null; } },
    defaultPrevented: false,
    altKey: false,
    ctrlKey: false,
    metaKey: false,
    shiftKey: false,
    preventDefault() {},
  });
  assert.deepEqual(focused, ['title']);
  assert.deepEqual(assigned, []);
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

test('right bracket focuses the last Open workbench link when focus is not in an input', () => {
  assert.match(html, /event\.key === '\]'/);
  assert.match(html, /querySelectorAll\('#workbenches a\.open'\)/);
  assert.match(html, /opens\[opens\.length - 1\]/);
  assert.match(html, /getElementById\('workbenches-title'\)/);
  assert.match(html, /id="workbenches-title"/);
  assert.match(html, /<kbd>\]<\/kbd><\/dt><dd>Focus the last Open workbench link, or the workbenches heading if none. This key moves focus; it does not open the workbench./);
  assert.match(html, /Press <kbd>\]<\/kbd> to focus the last Open workbench link/);
  assert.match(html, /This key moves focus; it does not open the workbench/);
  assert.match(html, /inEditable\(event\.target\)/);
  assert.match(readme, /Key `\]` focuses the last Open workbench/);
  assert.match(readme, /Press `\]` to focus the last Open workbench link/);
  const focused = [];
  const assigned = [];
  let keydown = null;
  const lastOpen = { focus() { focused.push('last-open'); } };
  const heading = { focus() { focused.push('workbenches-title'); } };
  const section = { focus() { focused.push('workbenches'); } };
  const document = {
    getElementById(id) {
      if (id === 'workbenches-title') return heading;
      if (id === 'workbenches') return section;
      if (id === 'shortcuts') return { hidden: true };
      if (id === 'shortcuts-open') return { setAttribute() {}, addEventListener() {} };
      if (id === 'shortcuts-close') return { addEventListener() {} };
      if (id === 'skip-shortcuts') return { addEventListener() {} };
      return null;
    },
    querySelector: () => null,
    querySelectorAll(selector) {
      return selector === '#workbenches a.open'
        ? [{ focus() { focused.push('first-open'); } }, lastOpen]
        : [];
    },
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
  fire(']', input);
  fire(']', textarea);
  assert.deepEqual(focused, []);
  assert.deepEqual(assigned, []);
  fire(']', body);
  assert.deepEqual(focused, ['last-open']);
  assert.deepEqual(assigned, []);
});

test('right bracket focuses the workbenches heading when no Open workbench link exists', () => {
  const focused = [];
  const assigned = [];
  let keydown = null;
  const heading = { focus() { focused.push('workbenches-title'); } };
  const document = {
    getElementById(id) {
      if (id === 'workbenches-title') return heading;
      if (id === 'workbenches') return { focus() { focused.push('workbenches'); } };
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
  keydown({
    key: ']',
    target: { tagName: 'BODY', closest() { return null; } },
    defaultPrevented: false,
    altKey: false,
    ctrlKey: false,
    metaKey: false,
    shiftKey: false,
    preventDefault() {},
  });
  assert.deepEqual(focused, ['workbenches-title']);
  assert.deepEqual(assigned, []);
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

test('at focuses Copy catalog intro when focus is not in an input', () => {
  assert.match(html, /event\.key === '@'/);
  assert.match(html, /getElementById\('copy-lede'\) \|\| document\.getElementById\('catalog-heading'\)/);
  assert.match(html, /id="copy-lede"/);
  assert.match(html, /id="catalog-heading"/);
  assert.match(html, /<kbd>@<\/kbd><\/dt><dd>Focus the Copy catalog intro control, or the catalog heading if that control is missing. This key moves focus; it does not open a workbench. It does not copy./);
  assert.match(html, /Press <kbd>@<\/kbd> to focus Copy catalog intro/);
  assert.match(html, /This is distinct from <kbd>e<\/kbd>, which copies the catalog heading and lede/);
  assert.match(html, /inEditable\(event\.target\)/);
  assert.match(readme, /Key `@` focuses the Copy catalog intro control/);
  assert.match(readme, /Press `@` to focus the Copy catalog intro control/);
  const focused = [];
  const clicks = { lede: 0 };
  const assigned = [];
  let keydown = null;
  const copyLede = { focus() { focused.push('copy-lede'); }, click() { clicks.lede += 1; }, addEventListener() {} };
  const heading = { focus() { focused.push('catalog-heading'); } };
  const document = {
    getElementById(id) {
      if (id === 'copy-lede') return copyLede;
      if (id === 'catalog-heading') return heading;
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
  const fire = (key, target, shiftKey = false) => {
    keydown({
      key,
      target,
      defaultPrevented: false,
      altKey: false,
      ctrlKey: false,
      metaKey: false,
      shiftKey,
      preventDefault() {},
    });
  };
  const input = { tagName: 'INPUT', closest() { return input; } };
  const textarea = { tagName: 'TEXTAREA', closest() { return textarea; } };
  const select = { tagName: 'SELECT', closest() { return select; } };
  const body = { tagName: 'BODY', closest() { return null; } };
  fire('@', input, true);
  fire('@', textarea, true);
  fire('@', select, true);
  assert.deepEqual(focused, []);
  assert.equal(clicks.lede, 0);
  assert.deepEqual(assigned, []);
  fire('@', body, true);
  assert.deepEqual(focused, ['copy-lede']);
  assert.equal(clicks.lede, 0);
  assert.deepEqual(assigned, []);
  fire('e', body, false);
  assert.equal(clicks.lede, 1);
  assert.deepEqual(focused, ['copy-lede']);
  assert.deepEqual(assigned, []);
});

test('at focuses the catalog heading when Copy catalog intro is missing', () => {
  const focused = [];
  const clicks = { lede: 0 };
  const assigned = [];
  let keydown = null;
  const heading = { focus() { focused.push('catalog-heading'); } };
  const document = {
    getElementById(id) {
      if (id === 'copy-lede') return null;
      if (id === 'catalog-heading') return heading;
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
  keydown({
    key: '@',
    target: { tagName: 'BODY', closest() { return null; } },
    defaultPrevented: false,
    altKey: false,
    ctrlKey: false,
    metaKey: false,
    shiftKey: true,
    preventDefault() {},
  });
  assert.deepEqual(focused, ['catalog-heading']);
  assert.equal(clicks.lede, 0);
  assert.deepEqual(assigned, []);
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

test('hash focuses Copy skip links when focus is not in an input', () => {
  assert.match(html, /event\.key === '#'/);
  assert.match(html, /getElementById\('copy-skips'\) \|\| document\.getElementById\('skips'\) \|\| document\.getElementById\('catalog-heading'\)/);
  assert.match(html, /id="copy-skips"/);
  assert.match(html, /id="skips"/);
  assert.match(html, /nav class="skips" id="skips" tabindex="-1"/);
  assert.match(html, /<kbd>#<\/kbd><\/dt><dd>Focus the Copy skip links control, or the skip-link row or catalog heading if that control is missing. This key moves focus; it does not open a workbench. It does not copy./);
  assert.match(html, /Press <kbd>#<\/kbd> to focus Copy skip links/);
  assert.match(html, /This is distinct from <kbd>z<\/kbd>, which copies skip-link targets/);
  assert.match(html, /inEditable\(event\.target\)/);
  assert.match(readme, /Key `#` focuses the Copy skip links control/);
  assert.match(readme, /Press `#` to focus the Copy skip links control/);
  const focused = [];
  const clicks = { skips: 0 };
  const assigned = [];
  let keydown = null;
  const copySkips = { focus() { focused.push('copy-skips'); }, click() { clicks.skips += 1; }, addEventListener() {} };
  const skipRow = { focus() { focused.push('skips'); } };
  const heading = { focus() { focused.push('catalog-heading'); } };
  const document = {
    getElementById(id) {
      if (id === 'copy-skips') return copySkips;
      if (id === 'skips') return skipRow;
      if (id === 'catalog-heading') return heading;
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
  const fire = (key, target, shiftKey = false) => {
    keydown({
      key,
      target,
      defaultPrevented: false,
      altKey: false,
      ctrlKey: false,
      metaKey: false,
      shiftKey,
      preventDefault() {},
    });
  };
  const input = { tagName: 'INPUT', closest() { return input; } };
  const textarea = { tagName: 'TEXTAREA', closest() { return textarea; } };
  const select = { tagName: 'SELECT', closest() { return select; } };
  const body = { tagName: 'BODY', closest() { return null; } };
  fire('#', input, true);
  fire('#', textarea, true);
  fire('#', select, true);
  assert.deepEqual(focused, []);
  assert.equal(clicks.skips, 0);
  assert.deepEqual(assigned, []);
  fire('#', body, true);
  assert.deepEqual(focused, ['copy-skips']);
  assert.equal(clicks.skips, 0);
  assert.deepEqual(assigned, []);
  fire('z', body, false);
  assert.equal(clicks.skips, 1);
  assert.deepEqual(focused, ['copy-skips']);
  assert.deepEqual(assigned, []);
});

test('hash focuses the skip-link row when Copy skip links is missing', () => {
  const focused = [];
  const clicks = { skips: 0 };
  const assigned = [];
  let keydown = null;
  const skipRow = { focus() { focused.push('skips'); } };
  const heading = { focus() { focused.push('catalog-heading'); } };
  const document = {
    getElementById(id) {
      if (id === 'copy-skips') return null;
      if (id === 'skips') return skipRow;
      if (id === 'catalog-heading') return heading;
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
  keydown({
    key: '#',
    target: { tagName: 'BODY', closest() { return null; } },
    defaultPrevented: false,
    altKey: false,
    ctrlKey: false,
    metaKey: false,
    shiftKey: true,
    preventDefault() {},
  });
  assert.deepEqual(focused, ['skips']);
  assert.equal(clicks.skips, 0);
  assert.deepEqual(assigned, []);
});

test('hash focuses the catalog heading when Copy skip links and the skip-link row are missing', () => {
  const focused = [];
  const assigned = [];
  let keydown = null;
  const heading = { focus() { focused.push('catalog-heading'); } };
  const document = {
    getElementById(id) {
      if (id === 'copy-skips') return null;
      if (id === 'skips') return null;
      if (id === 'catalog-heading') return heading;
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
  keydown({
    key: '#',
    target: { tagName: 'BODY', closest() { return null; } },
    defaultPrevented: false,
    altKey: false,
    ctrlKey: false,
    metaKey: false,
    shiftKey: true,
    preventDefault() {},
  });
  assert.deepEqual(focused, ['catalog-heading']);
  assert.deepEqual(assigned, []);
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

test('copy first job copies the first card as one Markdown line with a visible fallback', () => {
  assert.match(html, /id="copy-first-job"/);
  assert.match(html, />Copy first job</);
  assert.match(html, /aria-keyshortcuts=";"/);
  assert.match(html, /id="copy-first-job-fallback"/);
  assert.match(html, /class="copy-first-job-fallback"/);
  assert.match(html, /textarea id="copy-first-job-fallback"/);
  assert.match(html, /firstJobMarkdown/);
  assert.match(html, /querySelector\('article\.workbench'\)/);
  assert.match(html, /navigator\.clipboard\?\.writeText/);
  assert.match(html, /firstJobFallback\.hidden = false/);
  assert.match(html, /firstJobFallback\.select\(\)/);
  assert.match(html, /Not a live product feed/);
  assert.match(html, /This is the first catalog job, not a live product feed/);
  assert.match(html, /Copied an empty string/);
  assert.match(html, /This is distinct from <kbd>j<\/kbd> and <kbd>q<\/kbd>/);
  assert.match(html, /from <kbd>y<\/kbd>, which copies the last-launched job/);
  assert.match(html, /@media print[\s\S]*\.copy-first-job-tools/);
  assert.match(html, /@media print[\s\S]*\.copy-first-job-fallback \{ display: none !important; \}/);
  assert.doesNotMatch(html, /hosted API/i);
  assert.match(readme, /Copy first job copies the first workbench name/);
  assert.match(readme, /Press `;` to copy the first workbench name/);
});

test('copy first Trust item copies the first Trust list item as one Markdown line with a visible fallback', () => {
  assert.match(html, /id="copy-first-trust"/);
  assert.match(html, />Copy first Trust item</);
  assert.match(html, /aria-keyshortcuts=":"/);
  assert.match(html, /id="copy-first-trust-fallback"/);
  assert.match(html, /class="copy-first-trust-fallback"/);
  assert.match(html, /textarea id="copy-first-trust-fallback"/);
  assert.match(html, /firstTrustMarkdown/);
  assert.match(html, /querySelector\('#trust li'\)/);
  assert.match(html, /navigator\.clipboard\?\.writeText/);
  assert.match(html, /firstTrustFallback\.hidden = false/);
  assert.match(html, /firstTrustFallback\.select\(\)/);
  assert.match(html, /Not a live policy feed/);
  assert.match(html, /This is the first Trust and limits item, not a live policy feed/);
  assert.match(html, /Copied an empty string/);
  assert.match(html, /This is distinct from <kbd>i<\/kbd>, which copies the full Trust and limits list/);
  assert.match(html, /from <kbd>;<\/kbd>, which copies the first workbench job/);
  assert.match(html, /@media print[\s\S]*\.copy-first-trust-tools/);
  assert.match(html, /@media print[\s\S]*\.copy-first-trust-fallback \{ display: none !important; \}/);
  assert.doesNotMatch(html, /hosted API/i);
  assert.match(readme, /Copy first Trust item copies the first Trust and limits list item/);
  assert.match(readme, /Press `:` to copy the first Trust and limits list item/);
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

test('copy version line copies footer text as one Markdown line with a visible fallback', () => {
  assert.match(html, /id="copy-version-line"/);
  assert.match(html, />Copy version line</);
  assert.match(html, /aria-keyshortcuts=","/);
  assert.match(html, /id="copy-version-line-fallback"/);
  assert.match(html, /class="copy-version-line-fallback"/);
  assert.match(html, /textarea id="copy-version-line-fallback"/);
  assert.match(html, /versionLineMarkdown/);
  assert.match(html, /querySelector\('\.version-line'\)\?\.textContent/);
  assert.match(html, /navigator\.clipboard\?\.writeText/);
  assert.match(html, /versionLineFallback\.hidden = false/);
  assert.match(html, /versionLineFallback\.select\(\)/);
  assert.match(html, /Not a live product version/);
  assert.match(html, /This is the catalog version line, not a live product version/);
  assert.match(html, /@media print[\s\S]*\.copy-version-line-tools/);
  assert.match(html, /@media print[\s\S]*\.copy-version-line-fallback \{ display: none !important; \}/);
  assert.doesNotMatch(html, /hosted API/i);
});

test('keyboard comma copies the footer version line through the same control', () => {
  assert.match(html, /event\.key === ','/);
  assert.match(html, /versionLineBtn\?\.click\(\)/);
  assert.match(html, /inEditable\(event\.target\)/);
  assert.match(html, /aria-keyshortcuts=","/);
  assert.match(html, /<kbd>,<\/kbd><\/dt><dd>Copy the footer version line as one Markdown line from this catalog page, not a live product version/);
  assert.match(html, /Press <kbd>,<\/kbd> to copy the footer version line/);
  assert.match(readme, /Press `,` to copy the footer version line/);
  assert.match(readme, /not a live product version/);
  const clicks = { versionLine: 0 };
  let keydown = null;
  const document = {
    getElementById(id) {
      if (id === 'copy-version-line') return { click() { clicks.versionLine += 1; }, addEventListener() {} };
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
  fire(',', input);
  fire(',', textarea);
  assert.equal(clicks.versionLine, 0);
  fire(',', body);
  assert.equal(clicks.versionLine, 1);
});

test('left bracket focuses Copy version line when focus is not in an input', () => {
  assert.match(html, /event\.key === '\['/);
  assert.match(html, /getElementById\('copy-version-line'\) \|\| document\.getElementById\('version-line'\)/);
  assert.match(html, /id="copy-version-line"/);
  assert.match(html, /id="version-line" tabindex="-1"/);
  assert.match(html, /<kbd>\[<\/kbd><\/dt><dd>Focus the Copy version line control, or the footer version line if that control is missing. This key moves focus; it does not open a workbench. It does not copy./);
  assert.match(html, /Press <kbd>\[<\/kbd> to focus Copy version line/);
  assert.match(html, /This key moves focus; it does not open a workbench/);
  assert.match(html, /inEditable\(event\.target\)/);
  assert.match(readme, /Key `\[` focuses the Copy version line control/);
  assert.match(readme, /Press `\[` to focus the Copy\s+version line control/);
  const focused = [];
  const clicks = { versionLine: 0 };
  const assigned = [];
  let keydown = null;
  const copyControl = { focus() { focused.push('copy-version-line'); }, click() { clicks.versionLine += 1; }, addEventListener() {} };
  const versionLine = { focus() { focused.push('version-line'); } };
  const document = {
    getElementById(id) {
      if (id === 'copy-version-line') return copyControl;
      if (id === 'version-line') return versionLine;
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
  const textarea = { tagName: 'TEXTAREA', closest() { return textarea; } };
  const body = { tagName: 'BODY', closest() { return null; } };
  fire('[', input);
  fire('[', textarea);
  assert.deepEqual(focused, []);
  assert.equal(clicks.versionLine, 0);
  assert.deepEqual(assigned, []);
  fire('[', body);
  assert.deepEqual(focused, ['copy-version-line']);
  assert.equal(clicks.versionLine, 0);
  assert.deepEqual(assigned, []);
});

test('left bracket focuses the footer version line when Copy version line is missing', () => {
  const focused = [];
  const assigned = [];
  let keydown = null;
  const versionLine = { focus() { focused.push('version-line'); } };
  const document = {
    getElementById(id) {
      if (id === 'copy-version-line') return null;
      if (id === 'version-line') return versionLine;
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
  keydown({
    key: '[',
    target: { tagName: 'BODY', closest() { return null; } },
    defaultPrevented: false,
    altKey: false,
    ctrlKey: false,
    metaKey: false,
    shiftKey: false,
    preventDefault() {},
  });
  assert.deepEqual(focused, ['version-line']);
  assert.deepEqual(assigned, []);
});

test('copy version line markdown is the footer text, or empty if missing', async () => {
  let copied = '';
  let clickLine = null;
  const versionLine = { textContent: 'Partnership Breakpoint 1.5.5, Common Cart 1.4.5, The Smallest Agreement 1.5.5, Weekend Gap 1.5.5. Each workbench versions itself.' };
  const document = {
    getElementById(id) {
      if (id === 'copy-version-line') return { addEventListener(name, handler) { if (name === 'click') clickLine = handler; } };
      if (id === 'copy-version-line-status') return { textContent: '' };
      if (id === 'copy-version-line-fallback') return { hidden: true, value: '', focus() {}, select() {} };
      return null;
    },
    querySelector(selector) {
      return selector === '.version-line' ? versionLine : null;
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
  await clickLine();
  assert.equal(copied, versionLine.textContent);
  assert.doesNotMatch(copied, /\n/);
  versionLine.textContent = '   ';
  copied = 'stale';
  await clickLine();
  assert.equal(copied, '');
});

test('copy version line shows a visible textarea when clipboard is unavailable', async () => {
  let clickLine = null;
  const fallback = { hidden: true, value: '', focused: false, selected: false, focus() { this.focused = true; }, select() { this.selected = true; } };
  const status = { textContent: '' };
  const document = {
    getElementById(id) {
      if (id === 'copy-version-line') return { addEventListener(name, handler) { if (name === 'click') clickLine = handler; } };
      if (id === 'copy-version-line-status') return status;
      if (id === 'copy-version-line-fallback') return fallback;
      return null;
    },
    querySelector(selector) {
      return selector === '.version-line' ? { textContent: 'Partnership Breakpoint 1.5.5, Common Cart 1.4.5.' } : null;
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
  await clickLine();
  assert.equal(fallback.hidden, false);
  assert.equal(fallback.focused, true);
  assert.equal(fallback.selected, true);
  assert.equal(fallback.value, 'Partnership Breakpoint 1.5.5, Common Cart 1.4.5.');
  assert.match(status.textContent, /Clipboard unavailable/);
  assert.match(status.textContent, /not a live product version/);
});

test('print CSS hides copy version line tools like other copy tools', () => {
  const print = html.match(/@media print \{([\s\S]*)\}\s*<\/style>/)?.[1] ?? '';
  assert.match(print, /\.copy-version-line-tools, \.copy-version-line-fallback \{ display: none !important; \}/);
  assert.match(print, /\.copy-versions-tools, \.copy-versions-fallback/);
  assert.match(print, /#how-it-works, \.guide \{ display: block !important; \}/);
  assert.match(print, /\.whats-new, \.workbench \.version, \.version-line, \.trust \{ display: block !important; \}/);
});

test('print CSS hides copy first job tools and keeps How it works and versions', () => {
  const print = html.match(/@media print \{([\s\S]*)\}\s*<\/style>/)?.[1] ?? '';
  assert.match(print, /\.copy-first-job-tools, \.copy-first-job-fallback \{ display: none !important; \}/);
  assert.match(print, /#how-it-works, \.guide \{ display: block !important; \}/);
  assert.match(print, /\.whats-new, \.workbench \.version, \.version-line, \.trust \{ display: block !important; \}/);
});

test('shortcuts panel lists d comma period with honest limits', () => {
  assert.match(html, /<kbd>d<\/kbd><\/dt><dd>Focus the first How it works list item, or the How it works heading if none. This key moves focus; it does not open a workbench./);
  assert.match(html, /<kbd>,<\/kbd><\/dt><dd>Copy the footer version line as one Markdown line from this catalog page, not a live product version. Clipboard write uses the visible text box when the clipboard API is unavailable./);
  assert.match(html, /<kbd>\.<\/kbd><\/dt><dd>Focus Skip to catalog versions. This key moves focus; it does not open a workbench./);
  assert.match(html, /Shortcuts are ignored while focus is in an input, textarea, or select/);
  assert.match(html, /not a live product version/);
  assert.match(html, /id="copy-version-line"/);
  assert.match(html, /id="how-title" tabindex="-1"/);
  assert.match(html, /class="skip" href="#version-line">Skip to catalog versions/);
  assert.match(readme, /Press `d` to focus the first How it works list item/);
  assert.match(readme, /Press `,` to copy the footer version line/);
  assert.match(readme, /Press `.` to focus Skip to catalog versions/);
});

test('What\'s new and README name this hub-only wave without changing workbench versions', () => {
  assert.match(html, /First How-it-works copy, How copy jump, and last Trust copy/);
  assert.match(html, /They do not change workbench versions and they do not call a live product feed/);
  assert.match(html, /without adding a public path/);
  assert.match(readme, /first How-it-works copy, How copy jump, and last Trust copy/);
  assert.match(readme, /That What's new entry is hub-only. It does not change workbench versions/);
  assert.match(readme, /Copy first How it works item on\s+that 404 page copies/);
  assert.doesNotMatch(html, /hosted API/i);
  assert.doesNotMatch(html, /live service/i);
});

test('What\'s new and README name last How copy and jumps without changing workbench versions', () => {
  assert.match(html, /Last How copy, last-How jump, and first-How jump/);
  assert.match(html, /Copy last How it works item through less-than as Markdown/);
  assert.match(html, /jump with keyboard greater-than/);
  assert.match(html, /jump to Copy first How it works item with keyboard underscore/);
  assert.match(html, /They do not change workbench versions and they do not call a live product feed/);
  assert.match(html, /without adding a public path/);
  assert.match(readme, /last How-it-works copy, last-How jump, and first-How jump/);
  assert.match(readme, /That What's new entry is hub-only. It does not change workbench versions/);
  assert.match(readme, /Copy last How it works item on\s+that 404 page copies/);
  assert.match(readme, /Copy last How it works item copies the last How it works list item/);
  assert.doesNotMatch(html, /hosted API/i);
  assert.doesNotMatch(html, /live service/i);
});

test('shortcuts panel lists less-than greater-than underscore with honest limits', () => {
  assert.match(html, /<kbd>&lt;<\/kbd><\/dt><dd>Copy the last How it works list item as one Markdown line from this catalog page, not a live policy feed/);
  assert.match(html, /<kbd>&gt;<\/kbd><\/dt><dd>Focus the Copy last How it works item control, or the How it works heading if that control is missing. This key moves focus; it does not open a workbench. It does not copy./);
  assert.match(html, /<kbd>_<\/kbd><\/dt><dd>Focus the Copy first How it works item control, or the How it works heading if that control is missing. This key moves focus; it does not open a workbench. It does not copy./);
  assert.match(html, /Shortcuts are ignored while focus is in an input, textarea, or select/);
  assert.match(html, /not a live policy feed/);
  assert.match(html, /id="copy-last-how"/);
  assert.match(html, /id="copy-first-how"/);
  assert.match(html, /id="copy-how"/);
  assert.match(html, /Press <kbd>&lt;<\/kbd> to copy the last How it works list item/);
  assert.match(html, /Press <kbd>&gt;<\/kbd> to focus Copy last How it works item/);
  assert.match(html, /Press <kbd>_<\/kbd> to focus Copy first How it works item/);
  assert.match(readme, /Press `<` to copy the last How it works list item/);
  assert.match(readme, /Press `>` to focus the Copy last How it works item control/);
  assert.match(readme, /Press `_` to focus the Copy first How it works item control/);
});

test('shortcuts panel lists slash semicolon apostrophe with honest limits', () => {
  assert.match(html, /<kbd>\/<\/kbd><\/dt><dd>Focus the first Trust and limits list item, or the Trust and limits heading if none. This key moves focus; it does not open a workbench. Shift\+\/ stays <kbd>\?<\/kbd>./);
  assert.match(html, /<kbd>;<\/kbd><\/dt><dd>Copy the first workbench name and one-sentence job as one Markdown line from this catalog page, not a live product feed/);
  assert.match(html, /<kbd>'<\/kbd><\/dt><dd>Focus Skip to Trust and limits. This key moves focus; it does not open a workbench./);
  assert.match(html, /Shortcuts are ignored while focus is in an input, textarea, or select/);
  assert.match(html, /not a live product feed/);
  assert.match(html, /id="copy-first-job"/);
  assert.match(html, /id="trust-title" tabindex="-1"/);
  assert.match(html, /class="skip" href="#trust">Skip to Trust and limits/);
  assert.match(readme, /Press `\/` to focus the first Trust and limits list item/);
  assert.match(readme, /Press `;` to copy the first workbench name/);
  assert.match(readme, /Press `'` to focus Skip to Trust and limits/);
});

test('shortcuts panel lists brackets and colon with honest limits', () => {
  assert.match(html, /<kbd>\[<\/kbd><\/dt><dd>Focus the Copy version line control, or the footer version line if that control is missing. This key moves focus; it does not open a workbench. It does not copy./);
  assert.match(html, /<kbd>\]<\/kbd><\/dt><dd>Focus the last Open workbench link, or the workbenches heading if none. This key moves focus; it does not open the workbench./);
  assert.match(html, /<kbd>:<\/kbd><\/dt><dd>Copy the first Trust and limits list item as one Markdown line from this catalog page, not a live policy feed/);
  assert.match(html, /Shortcuts are ignored while focus is in an input, textarea, or select/);
  assert.match(html, /not a live policy feed/);
  assert.match(html, /id="copy-version-line"/);
  assert.match(html, /id="copy-first-trust"/);
  assert.match(html, /id="workbenches-title"/);
  assert.match(html, /Press <kbd>\[<\/kbd> to focus Copy version line/);
  assert.match(html, /Press <kbd>\]<\/kbd> to focus the last Open workbench link/);
  assert.match(html, /Press <kbd>:<\/kbd> to copy the first Trust and limits list item/);
  assert.match(readme, /Press `\[` to focus the Copy\s+version line control/);
  assert.match(readme, /Press `\]` to focus the last Open workbench link/);
  assert.match(readme, /Press `:` to copy the first Trust and limits list item/);
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

test('keyboard semicolon copies the first workbench job through its own control', () => {
  assert.match(html, /event\.key === ';'/);
  assert.match(html, /firstJobBtn\?\.click\(\)/);
  assert.match(html, /inEditable\(event\.target\)/);
  assert.match(html, /aria-keyshortcuts=";"/);
  assert.match(html, /<kbd>;<\/kbd><\/dt><dd>Copy the first workbench name and one-sentence job as one Markdown line from this catalog page, not a live product feed/);
  assert.match(html, /Press <kbd>;<\/kbd> to copy the first workbench job/);
  assert.match(html, /If that card is missing, this copies an empty string/);
  assert.match(html, /This is distinct from <kbd>j<\/kbd> and <kbd>q<\/kbd>/);
  assert.match(html, /from <kbd>y<\/kbd>, which copies the last-launched job/);
  assert.match(readme, /Press `;` to copy the first workbench name/);
  const clicks = { firstJob: 0, jobs: 0, last: 0 };
  let keydown = null;
  const document = {
    getElementById(id) {
      if (id === 'copy-first-job') return { click() { clicks.firstJob += 1; }, addEventListener() {} };
      if (id === 'copy-jobs') return { click() { clicks.jobs += 1; }, addEventListener() {} };
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
  const textarea = { tagName: 'TEXTAREA', closest() { return textarea; } };
  const body = { tagName: 'BODY', closest() { return null; } };
  fire(';', input);
  fire(';', textarea);
  assert.equal(clicks.firstJob, 0);
  assert.equal(clicks.jobs, 0);
  assert.equal(clicks.last, 0);
  fire(';', body);
  assert.equal(clicks.firstJob, 1);
  assert.equal(clicks.jobs, 0);
  assert.equal(clicks.last, 0);
});

test('keyboard colon copies the first Trust item through its own control', () => {
  assert.match(html, /event\.key === ':'/);
  assert.match(html, /firstTrustBtn\?\.click\(\)/);
  assert.match(html, /inEditable\(event\.target\)/);
  assert.match(html, /aria-keyshortcuts=":"/);
  assert.match(html, /<kbd>:<\/kbd><\/dt><dd>Copy the first Trust and limits list item as one Markdown line from this catalog page, not a live policy feed/);
  assert.match(html, /Press <kbd>:<\/kbd> to copy the first Trust and limits list item/);
  assert.match(html, /If that item is missing, this copies an empty string/);
  assert.match(html, /This is distinct from <kbd>i<\/kbd>, which copies the full Trust and limits list/);
  assert.match(html, /from <kbd>;<\/kbd>, which copies the first workbench job/);
  assert.match(readme, /Press `:` to copy the first Trust and limits list item/);
  const clicks = { firstTrust: 0, trust: 0, firstJob: 0 };
  let keydown = null;
  const document = {
    getElementById(id) {
      if (id === 'copy-first-trust') return { click() { clicks.firstTrust += 1; }, addEventListener() {} };
      if (id === 'copy-trust') return { click() { clicks.trust += 1; }, addEventListener() {} };
      if (id === 'copy-first-job') return { click() { clicks.firstJob += 1; }, addEventListener() {} };
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
  const fire = (key, target, shiftKey = false) => {
    keydown({
      key,
      target,
      defaultPrevented: false,
      altKey: false,
      ctrlKey: false,
      metaKey: false,
      shiftKey,
      preventDefault() {},
    });
  };
  const input = { tagName: 'INPUT', closest() { return input; } };
  const textarea = { tagName: 'TEXTAREA', closest() { return textarea; } };
  const body = { tagName: 'BODY', closest() { return null; } };
  fire(':', input, true);
  fire(':', textarea, true);
  assert.equal(clicks.firstTrust, 0);
  assert.equal(clicks.trust, 0);
  assert.equal(clicks.firstJob, 0);
  fire(':', body, true);
  assert.equal(clicks.firstTrust, 1);
  assert.equal(clicks.trust, 0);
  assert.equal(clicks.firstJob, 0);
  fire(';', body, false);
  assert.equal(clicks.firstJob, 1);
  assert.equal(clicks.firstTrust, 1);
});

test('colon does not steal semicolon first-job copy or apostrophe Skip to Trust', () => {
  assert.match(html, /event\.key === ';'/);
  assert.match(html, /event\.key === ':'/);
  assert.match(html, /event\.key === "'"/);
  assert.match(html, /firstJobBtn\?\.click\(\)/);
  assert.match(html, /firstTrustBtn\?\.click\(\)/);
  assert.match(html, /querySelector\('a\.skip\[href="#trust"\]'\)\?\.focus\(\)/);
  const clicks = { firstJob: 0, firstTrust: 0 };
  const focused = [];
  let keydown = null;
  const skipTrust = { focus() { focused.push('skip-trust'); } };
  const document = {
    getElementById(id) {
      if (id === 'copy-first-job') return { click() { clicks.firstJob += 1; }, addEventListener() {} };
      if (id === 'copy-first-trust') return { click() { clicks.firstTrust += 1; }, addEventListener() {} };
      if (id === 'shortcuts') return { hidden: true };
      if (id === 'shortcuts-open') return { setAttribute() {}, addEventListener() {} };
      if (id === 'shortcuts-close') return { addEventListener() {} };
      if (id === 'skip-shortcuts') return { addEventListener() {} };
      return null;
    },
    querySelector(selector) {
      return selector === 'a.skip[href="#trust"]' ? skipTrust : null;
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
  const fire = (key, shiftKey = false) => {
    keydown({
      key,
      target: { tagName: 'BODY', closest() { return null; } },
      defaultPrevented: false,
      altKey: false,
      ctrlKey: false,
      metaKey: false,
      shiftKey,
      preventDefault() {},
    });
  };
  fire(';', false);
  fire("'", false);
  fire(':', true);
  assert.equal(clicks.firstJob, 1);
  assert.equal(clicks.firstTrust, 1);
  assert.deepEqual(focused, ['skip-trust']);
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

test('keyboard d comma period are ignored in inputs using the same inEditable helper as c', () => {
  assert.match(html, /const inEditable = \(node\) =>/);
  assert.match(html, /if \(inEditable\(event\.target\)\) return;/);
  assert.match(html, /event\.key === 'c'/);
  assert.match(html, /event\.key === 'd'/);
  assert.match(html, /event\.key === ','/);
  assert.match(html, /event\.key === '\.'/);
  const clicks = { versionLine: 0 };
  const focused = [];
  const assigned = [];
  let keydown = null;
  const firstHow = { focus() { focused.push('li'); } };
  const skipVersions = { focus() { focused.push('skip-versions'); } };
  const document = {
    getElementById(id) {
      if (id === 'copy-version-line') return { click() { clicks.versionLine += 1; }, addEventListener() {} };
      if (id === 'how-title') return { focus() { focused.push('title'); } };
      if (id === 'shortcuts') return { hidden: true };
      if (id === 'shortcuts-open') return { setAttribute() {}, addEventListener() {} };
      if (id === 'shortcuts-close') return { addEventListener() {} };
      if (id === 'skip-shortcuts') return { addEventListener() {} };
      return null;
    },
    querySelector(selector) {
      if (selector === '#how-it-works li') return firstHow;
      if (selector === 'a.skip[href="#version-line"]') return skipVersions;
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
    fire('d', target);
    fire(',', target);
    fire('.', target);
    fire('c', target);
  }
  assert.deepEqual(focused, []);
  assert.equal(clicks.versionLine, 0);
  assert.deepEqual(assigned, []);
  fire('d', body);
  fire(',', body);
  fire('.', body);
  assert.deepEqual(focused, ['li', 'skip-versions']);
  assert.equal(clicks.versionLine, 1);
  assert.deepEqual(assigned, []);
});

test('keyboard slash semicolon apostrophe are ignored in inputs using the same inEditable helper as c', () => {
  assert.match(html, /const inEditable = \(node\) =>/);
  assert.match(html, /if \(inEditable\(event\.target\)\) return;/);
  assert.match(html, /event\.key === 'c'/);
  assert.match(html, /event\.key === '\/'/);
  assert.match(html, /event\.key === ';'/);
  assert.match(html, /event\.key === "'"/);
  const clicks = { firstJob: 0 };
  const focused = [];
  const assigned = [];
  let keydown = null;
  const firstTrust = { focus() { focused.push('trust-li'); } };
  const skipTrust = { focus() { focused.push('skip-trust'); } };
  const document = {
    getElementById(id) {
      if (id === 'copy-first-job') return { click() { clicks.firstJob += 1; }, addEventListener() {} };
      if (id === 'trust-title') return { focus() { focused.push('title'); } };
      if (id === 'shortcuts') return { hidden: true };
      if (id === 'shortcuts-open') return { setAttribute() {}, addEventListener() {} };
      if (id === 'shortcuts-close') return { addEventListener() {} };
      if (id === 'skip-shortcuts') return { addEventListener() {} };
      return null;
    },
    querySelector(selector) {
      if (selector === '#trust li') return firstTrust;
      if (selector === 'a.skip[href="#trust"]') return skipTrust;
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
    fire('/', target);
    fire(';', target);
    fire("'", target);
    fire('c', target);
  }
  assert.deepEqual(focused, []);
  assert.equal(clicks.firstJob, 0);
  assert.deepEqual(assigned, []);
  fire('/', body);
  fire(';', body);
  fire("'", body);
  assert.deepEqual(focused, ['trust-li', 'skip-trust']);
  assert.equal(clicks.firstJob, 1);
  assert.deepEqual(assigned, []);
});

test('keyboard brackets and colon are ignored in inputs using the same inEditable helper as c', () => {
  assert.match(html, /const inEditable = \(node\) =>/);
  assert.match(html, /if \(inEditable\(event\.target\)\) return;/);
  assert.match(html, /event\.key === 'c'/);
  assert.match(html, /event\.key === '\['/);
  assert.match(html, /event\.key === '\]'/);
  assert.match(html, /event\.key === ':'/);
  const clicks = { firstTrust: 0 };
  const focused = [];
  const assigned = [];
  let keydown = null;
  const copyControl = { focus() { focused.push('copy-version-line'); }, addEventListener() {} };
  const lastOpen = { focus() { focused.push('last-open'); } };
  const document = {
    getElementById(id) {
      if (id === 'copy-version-line') return copyControl;
      if (id === 'copy-first-trust') return { click() { clicks.firstTrust += 1; }, addEventListener() {} };
      if (id === 'workbenches-title') return { focus() { focused.push('workbenches-title'); } };
      if (id === 'shortcuts') return { hidden: true };
      if (id === 'shortcuts-open') return { setAttribute() {}, addEventListener() {} };
      if (id === 'shortcuts-close') return { addEventListener() {} };
      if (id === 'skip-shortcuts') return { addEventListener() {} };
      return null;
    },
    querySelector: () => null,
    querySelectorAll(selector) {
      return selector === '#workbenches a.open' ? [lastOpen] : [];
    },
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
  const fire = (key, target, shiftKey = false) => {
    keydown({
      key,
      target,
      defaultPrevented: false,
      altKey: false,
      ctrlKey: false,
      metaKey: false,
      shiftKey,
      preventDefault() {},
    });
  };
  const input = { tagName: 'INPUT', closest() { return input; } };
  const textarea = { tagName: 'TEXTAREA', closest() { return textarea; } };
  const select = { tagName: 'SELECT', closest() { return select; } };
  const body = { tagName: 'BODY', closest() { return null; } };
  for (const target of [input, textarea, select]) {
    fire('[', target);
    fire(']', target);
    fire(':', target, true);
    fire('c', target);
  }
  assert.deepEqual(focused, []);
  assert.equal(clicks.firstTrust, 0);
  assert.deepEqual(assigned, []);
  fire('[', body);
  fire(']', body);
  fire(':', body, true);
  assert.deepEqual(focused, ['copy-version-line', 'last-open']);
  assert.equal(clicks.firstTrust, 1);
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

test('copy first job markdown is the first catalog card, or empty if missing', async () => {
  let copied = '';
  let clickFirst = null;
  const firstCard = {
    querySelector(sel) {
      if (sel === 'h3') return { textContent: 'Partnership Breakpoint' };
      if (sel === 'p.job') return { textContent: 'Find which participant in a revenue split.' };
      return null;
    },
  };
  let card = firstCard;
  const document = {
    getElementById(id) {
      if (id === 'copy-first-job') return { addEventListener(name, handler) { if (name === 'click') clickFirst = handler; } };
      if (id === 'copy-first-job-status') return { textContent: '' };
      if (id === 'copy-first-job-fallback') return { hidden: true, value: '', focus() {}, select() {} };
      return null;
    },
    querySelector(selector) {
      return selector === 'article.workbench' ? card : null;
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
  await clickFirst();
  assert.equal(copied, '- Partnership Breakpoint: Find which participant in a revenue split.');
  assert.doesNotMatch(copied, /\n/);
  assert.doesNotMatch(copied, /Common Cart/);
  assert.doesNotMatch(copied, /live product feed/);
  card = null;
  copied = 'stale';
  await clickFirst();
  assert.equal(copied, '');
});

test('copy first job shows a visible textarea when clipboard is unavailable', async () => {
  let clickFirst = null;
  const fallback = { hidden: true, value: '', focused: false, selected: false, focus() { this.focused = true; }, select() { this.selected = true; } };
  const status = { textContent: '' };
  const document = {
    getElementById(id) {
      if (id === 'copy-first-job') return { addEventListener(name, handler) { if (name === 'click') clickFirst = handler; } };
      if (id === 'copy-first-job-status') return status;
      if (id === 'copy-first-job-fallback') return fallback;
      return null;
    },
    querySelector(selector) {
      if (selector === 'article.workbench') {
        return {
          querySelector(sel) {
            if (sel === 'h3') return { textContent: 'Partnership Breakpoint' };
            if (sel === 'p.job') return { textContent: 'Find which participant in a revenue split.' };
            return null;
          },
        };
      }
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
  await clickFirst();
  assert.equal(fallback.hidden, false);
  assert.equal(fallback.focused, true);
  assert.equal(fallback.selected, true);
  assert.equal(fallback.value, '- Partnership Breakpoint: Find which participant in a revenue split.');
  assert.match(status.textContent, /Clipboard unavailable/);
  assert.match(status.textContent, /not a live product feed/);
});

test('copy first Trust item markdown is the first Trust list item, or empty if missing', async () => {
  let copied = '';
  let clickFirst = null;
  const firstItem = { textContent: 'Local-first. Pages run in your browser.' };
  let item = firstItem;
  const document = {
    getElementById(id) {
      if (id === 'copy-first-trust') return { addEventListener(name, handler) { if (name === 'click') clickFirst = handler; } };
      if (id === 'copy-first-trust-status') return { textContent: '' };
      if (id === 'copy-first-trust-fallback') return { hidden: true, value: '', focus() {}, select() {} };
      return null;
    },
    querySelector(selector) {
      return selector === '#trust li' ? item : null;
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
  await clickFirst();
  assert.equal(copied, '- Local-first. Pages run in your browser.');
  assert.doesNotMatch(copied, /\n/);
  assert.doesNotMatch(copied, /## Trust and limits/);
  assert.doesNotMatch(copied, /live policy feed/);
  item = null;
  copied = 'stale';
  await clickFirst();
  assert.equal(copied, '');
});

test('copy first Trust item shows a visible textarea when clipboard is unavailable', async () => {
  let clickFirst = null;
  const fallback = { hidden: true, value: '', focused: false, selected: false, focus() { this.focused = true; }, select() { this.selected = true; } };
  const status = { textContent: '' };
  const document = {
    getElementById(id) {
      if (id === 'copy-first-trust') return { addEventListener(name, handler) { if (name === 'click') clickFirst = handler; } };
      if (id === 'copy-first-trust-status') return status;
      if (id === 'copy-first-trust-fallback') return fallback;
      return null;
    },
    querySelector(selector) {
      return selector === '#trust li' ? { textContent: 'Local-first. Pages run in your browser.' } : null;
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
  await clickFirst();
  assert.equal(fallback.hidden, false);
  assert.equal(fallback.focused, true);
  assert.equal(fallback.selected, true);
  assert.equal(fallback.value, '- Local-first. Pages run in your browser.');
  assert.match(status.textContent, /Clipboard unavailable/);
  assert.match(status.textContent, /not a live policy feed/);
});

test('print CSS hides copy first Trust tools and keeps How it works and versions', () => {
  const print = html.match(/@media print \{([\s\S]*)\}\s*<\/style>/)?.[1] ?? '';
  assert.match(print, /\.copy-first-trust-tools, \.copy-first-trust-fallback \{ display: none !important; \}/);
  assert.match(print, /\.copy-first-job-tools, \.copy-first-job-fallback \{ display: none !important; \}/);
  assert.match(print, /#how-it-works, \.guide \{ display: block !important; \}/);
  assert.match(print, /\.whats-new, \.workbench \.version, \.version-line, \.trust \{ display: block !important; \}/);
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

test('copy first How it works item copies the first How list item as one Markdown line with a visible fallback', () => {
  assert.match(html, /id="copy-first-how"/);
  assert.match(html, />Copy first How it works item</);
  assert.match(html, /aria-keyshortcuts="-"/);
  assert.match(html, /id="copy-first-how-fallback"/);
  assert.match(html, /class="copy-first-how-fallback"/);
  assert.match(html, /textarea id="copy-first-how-fallback"/);
  assert.match(html, /firstHowMarkdown/);
  assert.match(html, /querySelector\('#how-it-works li'\)/);
  assert.match(html, /navigator\.clipboard\?\.writeText/);
  assert.match(html, /firstHowFallback\.hidden = false/);
  assert.match(html, /firstHowFallback\.select\(\)/);
  assert.match(html, /Not a live policy feed/);
  assert.match(html, /This is the first How it works item, not a live policy feed/);
  assert.match(html, /Copied an empty string/);
  assert.match(html, /This is distinct from <kbd>u<\/kbd>, which copies the full How it works list/);
  assert.match(html, /from <kbd>d<\/kbd>, which focuses the first How it works list item/);
  assert.match(html, /@media print[\s\S]*\.copy-first-how-tools/);
  assert.match(html, /@media print[\s\S]*\.copy-first-how-fallback \{ display: none !important; \}/);
  assert.doesNotMatch(html, /hosted API/i);
  assert.match(readme, /Copy first How it works item copies the first How it works list item/);
  assert.match(readme, /Press `-` to copy the first How it works list item/);
});

test('keyboard minus copies the first How it works item through its own control', () => {
  assert.match(html, /event\.key === '-'/);
  assert.match(html, /firstHowBtn\?\.click\(\)/);
  assert.match(html, /inEditable\(event\.target\)/);
  assert.match(html, /aria-keyshortcuts="-"/);
  assert.match(html, /<kbd>-<\/kbd><\/dt><dd>Copy the first How it works list item as one Markdown line from this catalog page, not a live policy feed/);
  assert.match(html, /Press <kbd>-<\/kbd> to copy the first How it works list item/);
  assert.match(html, /If that item is missing, this copies an empty string/);
  assert.match(html, /This is distinct from <kbd>u<\/kbd>, which copies the full How it works list/);
  assert.match(html, /from <kbd>d<\/kbd>, which focuses the first How it works list item/);
  assert.match(readme, /Press `-` to copy the first How it works list item/);
  const clicks = { firstHow: 0, how: 0 };
  const focused = [];
  let keydown = null;
  const document = {
    getElementById(id) {
      if (id === 'copy-first-how') return { click() { clicks.firstHow += 1; }, addEventListener() {} };
      if (id === 'copy-how') return { click() { clicks.how += 1; }, addEventListener() {}, focus() { focused.push('copy-how'); } };
      if (id === 'how-title') return { focus() { focused.push('how-title'); } };
      if (id === 'how-it-works') return { focus() { focused.push('how-it-works'); } };
      if (id === 'shortcuts') return { hidden: true };
      if (id === 'shortcuts-open') return { setAttribute() {}, addEventListener() {} };
      if (id === 'shortcuts-close') return { addEventListener() {} };
      if (id === 'skip-shortcuts') return { addEventListener() {} };
      return null;
    },
    querySelector(selector) {
      return selector === '#how-it-works li' ? { focus() { focused.push('how-li'); } } : null;
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
  const textarea = { tagName: 'TEXTAREA', closest() { return textarea; } };
  const body = { tagName: 'BODY', closest() { return null; } };
  fire('-', input);
  fire('-', textarea);
  assert.equal(clicks.firstHow, 0);
  assert.equal(clicks.how, 0);
  assert.deepEqual(focused, []);
  fire('-', body);
  assert.equal(clicks.firstHow, 1);
  assert.equal(clicks.how, 0);
  assert.deepEqual(focused, []);
  fire('u', body);
  assert.equal(clicks.how, 1);
  assert.equal(clicks.firstHow, 1);
});

test('copy first How it works item markdown is the first How list item, or empty if missing', async () => {
  let copied = '';
  let clickFirst = null;
  const firstItem = { textContent: 'How copy jump. Key equals focuses Copy How it works.' };
  let item = firstItem;
  const document = {
    getElementById(id) {
      if (id === 'copy-first-how') return { addEventListener(name, handler) { if (name === 'click') clickFirst = handler; } };
      if (id === 'copy-first-how-status') return { textContent: '' };
      if (id === 'copy-first-how-fallback') return { hidden: true, value: '', focus() {}, select() {} };
      return null;
    },
    querySelector(selector) {
      return selector === '#how-it-works li' ? item : null;
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
  await clickFirst();
  assert.equal(copied, '- How copy jump. Key equals focuses Copy How it works.');
  assert.doesNotMatch(copied, /\n/);
  assert.doesNotMatch(copied, /## How it works/);
  assert.doesNotMatch(copied, /live policy feed/);
  item = null;
  copied = 'stale';
  await clickFirst();
  assert.equal(copied, '');
});

test('copy first How it works item shows a visible textarea when clipboard is unavailable', async () => {
  let clickFirst = null;
  const fallback = { hidden: true, value: '', focused: false, selected: false, focus() { this.focused = true; }, select() { this.selected = true; } };
  const status = { textContent: '' };
  const document = {
    getElementById(id) {
      if (id === 'copy-first-how') return { addEventListener(name, handler) { if (name === 'click') clickFirst = handler; } };
      if (id === 'copy-first-how-status') return status;
      if (id === 'copy-first-how-fallback') return fallback;
      return null;
    },
    querySelector(selector) {
      return selector === '#how-it-works li' ? { textContent: 'How copy jump. Key equals focuses Copy How it works.' } : null;
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
  await clickFirst();
  assert.equal(fallback.hidden, false);
  assert.equal(fallback.focused, true);
  assert.equal(fallback.selected, true);
  assert.equal(fallback.value, '- How copy jump. Key equals focuses Copy How it works.');
  assert.match(status.textContent, /Clipboard unavailable/);
  assert.match(status.textContent, /not a live policy feed/);
});

test('print CSS hides copy first How tools and keeps How it works and versions', () => {
  const print = html.match(/@media print \{([\s\S]*)\}\s*<\/style>/)?.[1] ?? '';
  assert.match(print, /\.copy-first-how-tools, \.copy-first-how-fallback \{ display: none !important; \}/);
  assert.match(print, /\.copy-first-trust-tools, \.copy-first-trust-fallback \{ display: none !important; \}/);
  assert.match(print, /#how-it-works, \.guide \{ display: block !important; \}/);
  assert.match(print, /\.whats-new, \.workbench \.version, \.version-line, \.trust \{ display: block !important; \}/);
});

test('equals focuses Copy How it works when focus is not in an input', () => {
  assert.match(html, /event\.key === '='/);
  assert.match(html, /getElementById\('copy-how'\) \|\| document\.getElementById\('how-title'\) \|\| document\.getElementById\('how-it-works'\)/);
  assert.match(html, /id="copy-how"/);
  assert.match(html, /id="how-title" tabindex="-1"/);
  assert.match(html, /<kbd>=<\/kbd><\/dt><dd>Focus the Copy How it works control, or the How it works heading if that control is missing. This key moves focus; it does not open a workbench. It does not copy./);
  assert.match(html, /Press <kbd>=<\/kbd> to focus Copy How it works/);
  assert.match(html, /This key moves focus; it does not open a workbench/);
  assert.match(html, /inEditable\(event\.target\)/);
  assert.match(readme, /Key `=` focuses the Copy\s+How it works control/);
  assert.match(readme, /Press `=` to focus the Copy How it works control/);
  const focused = [];
  const clicks = { how: 0 };
  const assigned = [];
  let keydown = null;
  const copyControl = { focus() { focused.push('copy-how'); }, click() { clicks.how += 1; }, addEventListener() {} };
  const heading = { focus() { focused.push('how-title'); } };
  const document = {
    getElementById(id) {
      if (id === 'copy-how') return copyControl;
      if (id === 'how-title') return heading;
      if (id === 'how-it-works') return { focus() { focused.push('how-it-works'); } };
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
  const textarea = { tagName: 'TEXTAREA', closest() { return textarea; } };
  const body = { tagName: 'BODY', closest() { return null; } };
  fire('=', input);
  fire('=', textarea);
  assert.deepEqual(focused, []);
  assert.equal(clicks.how, 0);
  assert.deepEqual(assigned, []);
  fire('=', body);
  assert.deepEqual(focused, ['copy-how']);
  assert.equal(clicks.how, 0);
  assert.deepEqual(assigned, []);
  fire('u', body);
  assert.equal(clicks.how, 1);
  fire('k', body);
  assert.deepEqual(focused, ['copy-how', 'how-it-works']);
});

test('equals focuses the How it works heading when Copy How it works is missing', () => {
  const focused = [];
  const assigned = [];
  let keydown = null;
  const heading = { focus() { focused.push('how-title'); } };
  const document = {
    getElementById(id) {
      if (id === 'copy-how') return null;
      if (id === 'how-title') return heading;
      if (id === 'how-it-works') return { focus() { focused.push('how-it-works'); } };
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
  keydown({
    key: '=',
    target: { tagName: 'BODY', closest() { return null; } },
    defaultPrevented: false,
    altKey: false,
    ctrlKey: false,
    metaKey: false,
    shiftKey: false,
    preventDefault() {},
  });
  assert.deepEqual(focused, ['how-title']);
  assert.deepEqual(assigned, []);
});

test('copy last Trust item copies the last Trust list item as one Markdown line with a visible fallback', () => {
  assert.match(html, /id="copy-last-trust"/);
  assert.match(html, />Copy last Trust item</);
  assert.match(html, /aria-keyshortcuts='"'/);
  assert.match(html, /id="copy-last-trust-fallback"/);
  assert.match(html, /class="copy-last-trust-fallback"/);
  assert.match(html, /textarea id="copy-last-trust-fallback"/);
  assert.match(html, /lastTrustMarkdown/);
  assert.match(html, /querySelectorAll\('#trust li'\)/);
  assert.match(html, /items\[items\.length - 1\]/);
  assert.match(html, /navigator\.clipboard\?\.writeText/);
  assert.match(html, /lastTrustFallback\.hidden = false/);
  assert.match(html, /lastTrustFallback\.select\(\)/);
  assert.match(html, /Not a live policy feed/);
  assert.match(html, /This is the last Trust and limits item, not a live policy feed/);
  assert.match(html, /Copied an empty string/);
  assert.match(html, /This is distinct from <kbd>:<\/kbd>, which copies the first Trust and limits list item/);
  assert.match(html, /from <kbd>i<\/kbd>, which copies the full Trust and limits list/);
  assert.match(html, /@media print[\s\S]*\.copy-last-trust-tools/);
  assert.match(html, /@media print[\s\S]*\.copy-last-trust-fallback \{ display: none !important; \}/);
  assert.doesNotMatch(html, /hosted API/i);
  assert.match(readme, /Copy last Trust item copies the last Trust and limits list item/);
  assert.match(readme, /Press `"` to copy the last Trust and limits list item/);
});

test('keyboard quote copies the last Trust item through its own control', () => {
  assert.match(html, /event\.key === '"'/);
  assert.match(html, /lastTrustBtn\?\.click\(\)/);
  assert.match(html, /inEditable\(event\.target\)/);
  assert.match(html, /aria-keyshortcuts='"'/);
  assert.match(html, /<kbd>"<\/kbd><\/dt><dd>Copy the last Trust and limits list item as one Markdown line from this catalog page, not a live policy feed/);
  assert.match(html, /Press <kbd>"<\/kbd> to copy the last Trust and limits list item/);
  assert.match(html, /If that item is missing, this copies an empty string/);
  assert.match(html, /This is distinct from <kbd>:<\/kbd>, which copies the first Trust and limits list item/);
  assert.match(html, /from <kbd>i<\/kbd>, which copies the full Trust and limits list/);
  assert.match(readme, /Press `"` to copy the last Trust and limits list item/);
  const clicks = { lastTrust: 0, firstTrust: 0, trust: 0 };
  const focused = [];
  let keydown = null;
  const document = {
    getElementById(id) {
      if (id === 'copy-last-trust') return { click() { clicks.lastTrust += 1; }, addEventListener() {} };
      if (id === 'copy-first-trust') return { click() { clicks.firstTrust += 1; }, addEventListener() {} };
      if (id === 'copy-trust') return { click() { clicks.trust += 1; }, addEventListener() {} };
      if (id === 'shortcuts') return { hidden: true };
      if (id === 'shortcuts-open') return { setAttribute() {}, addEventListener() {} };
      if (id === 'shortcuts-close') return { addEventListener() {} };
      if (id === 'skip-shortcuts') return { addEventListener() {} };
      return null;
    },
    querySelector(selector) {
      return selector === 'a.skip[href="#trust"]' ? { focus() { focused.push('skip-trust'); } } : null;
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
  const fire = (key, target, shiftKey = false) => {
    keydown({
      key,
      target,
      defaultPrevented: false,
      altKey: false,
      ctrlKey: false,
      metaKey: false,
      shiftKey,
      preventDefault() {},
    });
  };
  const input = { tagName: 'INPUT', closest() { return input; } };
  const textarea = { tagName: 'TEXTAREA', closest() { return textarea; } };
  const body = { tagName: 'BODY', closest() { return null; } };
  fire('"', input, true);
  fire('"', textarea, true);
  assert.equal(clicks.lastTrust, 0);
  assert.equal(clicks.firstTrust, 0);
  assert.equal(clicks.trust, 0);
  fire('"', body, true);
  assert.equal(clicks.lastTrust, 1);
  assert.equal(clicks.firstTrust, 0);
  assert.equal(clicks.trust, 0);
  fire(':', body, true);
  assert.equal(clicks.firstTrust, 1);
  fire('i', body);
  assert.equal(clicks.trust, 1);
  fire("'", body);
  assert.deepEqual(focused, ['skip-trust']);
  assert.equal(clicks.lastTrust, 1);
});

test('copy last Trust item markdown is the last Trust list item, or empty if missing', async () => {
  let copied = '';
  let clickLast = null;
  let items = [
    { textContent: 'Local-first. Pages run in your browser.' },
    { textContent: 'Model notes live in each workbench. Open the workbench for conventions.' },
  ];
  const document = {
    getElementById(id) {
      if (id === 'copy-last-trust') return { addEventListener(name, handler) { if (name === 'click') clickLast = handler; } };
      if (id === 'copy-last-trust-status') return { textContent: '' };
      if (id === 'copy-last-trust-fallback') return { hidden: true, value: '', focus() {}, select() {} };
      return null;
    },
    querySelector: () => null,
    querySelectorAll(selector) {
      return selector === '#trust li' ? items : [];
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
  await clickLast();
  assert.equal(copied, '- Model notes live in each workbench. Open the workbench for conventions.');
  assert.doesNotMatch(copied, /\n/);
  assert.doesNotMatch(copied, /## Trust and limits/);
  assert.doesNotMatch(copied, /Local-first/);
  assert.doesNotMatch(copied, /live policy feed/);
  items = [];
  copied = 'stale';
  await clickLast();
  assert.equal(copied, '');
});

test('copy last Trust item shows a visible textarea when clipboard is unavailable', async () => {
  let clickLast = null;
  const fallback = { hidden: true, value: '', focused: false, selected: false, focus() { this.focused = true; }, select() { this.selected = true; } };
  const status = { textContent: '' };
  const document = {
    getElementById(id) {
      if (id === 'copy-last-trust') return { addEventListener(name, handler) { if (name === 'click') clickLast = handler; } };
      if (id === 'copy-last-trust-status') return status;
      if (id === 'copy-last-trust-fallback') return fallback;
      return null;
    },
    querySelector: () => null,
    querySelectorAll(selector) {
      return selector === '#trust li' ? [{ textContent: 'Model notes live in each workbench.' }] : [];
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
  await clickLast();
  assert.equal(fallback.hidden, false);
  assert.equal(fallback.focused, true);
  assert.equal(fallback.selected, true);
  assert.equal(fallback.value, '- Model notes live in each workbench.');
  assert.match(status.textContent, /Clipboard unavailable/);
  assert.match(status.textContent, /not a live policy feed/);
});

test('print CSS hides copy last Trust tools and keeps How it works and versions', () => {
  const print = html.match(/@media print \{([\s\S]*)\}\s*<\/style>/)?.[1] ?? '';
  assert.match(print, /\.copy-last-trust-tools, \.copy-last-trust-fallback \{ display: none !important; \}/);
  assert.match(print, /\.copy-first-trust-tools, \.copy-first-trust-fallback \{ display: none !important; \}/);
  assert.match(print, /#how-it-works, \.guide \{ display: block !important; \}/);
  assert.match(print, /\.whats-new, \.workbench \.version, \.version-line, \.trust \{ display: block !important; \}/);
});

test('shortcuts panel lists minus equals quote with honest limits', () => {
  assert.match(html, /<kbd>-<\/kbd><\/dt><dd>Copy the first How it works list item as one Markdown line from this catalog page, not a live policy feed/);
  assert.match(html, /<kbd>=<\/kbd><\/dt><dd>Focus the Copy How it works control, or the How it works heading if that control is missing. This key moves focus; it does not open a workbench. It does not copy./);
  assert.match(html, /<kbd>"<\/kbd><\/dt><dd>Copy the last Trust and limits list item as one Markdown line from this catalog page, not a live policy feed/);
  assert.match(html, /Shortcuts are ignored while focus is in an input, textarea, or select/);
  assert.match(html, /not a live policy feed/);
  assert.match(html, /id="copy-first-how"/);
  assert.match(html, /id="copy-how"/);
  assert.match(html, /id="copy-last-trust"/);
  assert.match(html, /Press <kbd>-<\/kbd> to copy the first How it works list item/);
  assert.match(html, /Press <kbd>=<\/kbd> to focus Copy How it works/);
  assert.match(html, /Press <kbd>"<\/kbd> to copy the last Trust and limits list item/);
  assert.match(readme, /Press `-` to copy the first How it works list item/);
  assert.match(readme, /Press `=` to focus the Copy How it works control/);
  assert.match(readme, /Press `"` to copy the last Trust and limits list item/);
});

test('keyboard minus equals quote are ignored in inputs using the same inEditable helper as c', () => {
  assert.match(html, /const inEditable = \(node\) =>/);
  assert.match(html, /if \(inEditable\(event\.target\)\) return;/);
  assert.match(html, /event\.key === 'c'/);
  assert.match(html, /event\.key === '-'/);
  assert.match(html, /event\.key === '='/);
  assert.match(html, /event\.key === '"'/);
  const clicks = { firstHow: 0, lastTrust: 0, how: 0 };
  const focused = [];
  const assigned = [];
  let keydown = null;
  const copyHow = { focus() { focused.push('copy-how'); }, click() { clicks.how += 1; }, addEventListener() {} };
  const document = {
    getElementById(id) {
      if (id === 'copy-first-how') return { click() { clicks.firstHow += 1; }, addEventListener() {} };
      if (id === 'copy-last-trust') return { click() { clicks.lastTrust += 1; }, addEventListener() {} };
      if (id === 'copy-how') return copyHow;
      if (id === 'how-title') return { focus() { focused.push('how-title'); } };
      if (id === 'how-it-works') return { focus() { focused.push('how-it-works'); } };
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
  const fire = (key, target, shiftKey = false) => {
    keydown({
      key,
      target,
      defaultPrevented: false,
      altKey: false,
      ctrlKey: false,
      metaKey: false,
      shiftKey,
      preventDefault() {},
    });
  };
  const input = { tagName: 'INPUT', closest() { return input; } };
  const textarea = { tagName: 'TEXTAREA', closest() { return textarea; } };
  const select = { tagName: 'SELECT', closest() { return select; } };
  const body = { tagName: 'BODY', closest() { return null; } };
  for (const target of [input, textarea, select]) {
    fire('-', target);
    fire('=', target);
    fire('"', target, true);
    fire('c', target);
  }
  assert.deepEqual(focused, []);
  assert.equal(clicks.firstHow, 0);
  assert.equal(clicks.lastTrust, 0);
  assert.equal(clicks.how, 0);
  assert.deepEqual(assigned, []);
  fire('-', body);
  fire('=', body);
  fire('"', body, true);
  assert.deepEqual(focused, ['copy-how']);
  assert.equal(clicks.firstHow, 1);
  assert.equal(clicks.lastTrust, 1);
  assert.equal(clicks.how, 0);
  assert.deepEqual(assigned, []);
});

test('minus equals quote do not steal How copy, How jump, or first Trust copy', () => {
  assert.match(html, /event\.key === '-'/);
  assert.match(html, /event\.key === '='/);
  assert.match(html, /event\.key === '"'/);
  assert.match(html, /event\.key === 'u'/);
  assert.match(html, /event\.key === 'd'/);
  assert.match(html, /event\.key === 'k'/);
  assert.match(html, /event\.key === ':'/);
  assert.match(html, /firstHowBtn\?\.click\(\)/);
  assert.match(html, /howBtn\?\.click\(\)/);
  assert.match(html, /lastTrustBtn\?\.click\(\)/);
  assert.match(html, /firstTrustBtn\?\.click\(\)/);
  const clicks = { firstHow: 0, how: 0, lastTrust: 0, firstTrust: 0 };
  const focused = [];
  let keydown = null;
  const document = {
    getElementById(id) {
      if (id === 'copy-first-how') return { click() { clicks.firstHow += 1; }, addEventListener() {} };
      if (id === 'copy-how') return { click() { clicks.how += 1; }, addEventListener() {}, focus() { focused.push('copy-how'); } };
      if (id === 'copy-last-trust') return { click() { clicks.lastTrust += 1; }, addEventListener() {} };
      if (id === 'copy-first-trust') return { click() { clicks.firstTrust += 1; }, addEventListener() {} };
      if (id === 'how-title') return { focus() { focused.push('how-title'); } };
      if (id === 'how-it-works') return { focus() { focused.push('how-it-works'); } };
      if (id === 'shortcuts') return { hidden: true };
      if (id === 'shortcuts-open') return { setAttribute() {}, addEventListener() {} };
      if (id === 'shortcuts-close') return { addEventListener() {} };
      if (id === 'skip-shortcuts') return { addEventListener() {} };
      return null;
    },
    querySelector(selector) {
      return selector === '#how-it-works li' ? { focus() { focused.push('how-li'); } } : null;
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
  const fire = (key, shiftKey = false) => {
    keydown({
      key,
      target: { tagName: 'BODY', closest() { return null; } },
      defaultPrevented: false,
      altKey: false,
      ctrlKey: false,
      metaKey: false,
      shiftKey,
      preventDefault() {},
    });
  };
  fire('u');
  fire('d');
  fire('k');
  fire(':', true);
  fire('-');
  fire('=');
  fire('"', true);
  assert.equal(clicks.how, 1);
  assert.equal(clicks.firstHow, 1);
  assert.equal(clicks.lastTrust, 1);
  assert.equal(clicks.firstTrust, 1);
  assert.deepEqual(focused, ['how-li', 'how-it-works', 'copy-how']);
});

test('copy last How it works item control is distinct from Copy How it works and Copy first How it works item', () => {
  assert.match(html, /id="copy-last-how"/);
  assert.match(html, />Copy last How it works item</);
  assert.match(html, /aria-keyshortcuts="<"/);
  assert.match(html, /id="copy-last-how-fallback"/);
  assert.match(html, /class="copy-last-how-fallback"/);
  assert.match(html, /textarea id="copy-last-how-fallback"/);
  assert.match(html, /id="copy-first-how"/);
  assert.match(html, />Copy first How it works item</);
  assert.match(html, /id="copy-how"/);
  assert.match(html, />Copy How it works</);
  assert.notEqual(html.match(/id="copy-last-how"/)?.[0], html.match(/id="copy-first-how"/)?.[0]);
  assert.notEqual(html.match(/id="copy-last-how"/)?.[0], html.match(/id="copy-how"/)?.[0]);
  assert.match(html, /@media print[\s\S]*\.copy-last-how-tools/);
  assert.match(html, /@media print[\s\S]*\.copy-last-how-fallback \{ display: none !important; \}/);
  assert.doesNotMatch(html, /hosted API/i);
});

test('copy last How it works item markdown is the last How list item, or empty if missing', async () => {
  assert.match(html, /lastHowMarkdown/);
  assert.match(html, /querySelectorAll\('#how-it-works li'\)/);
  assert.match(html, /items\[items\.length - 1\]/);
  assert.match(html, /navigator\.clipboard\?\.writeText/);
  assert.match(html, /lastHowFallback\.hidden = false/);
  assert.match(html, /lastHowFallback\.select\(\)/);
  assert.match(html, /Not a live policy feed/);
  assert.match(html, /This is the last How it works item, not a live policy feed/);
  assert.match(html, /Copied an empty string/);
  let copied = '';
  let clickLast = null;
  let items = [
    { textContent: 'First How it works item. Copy first How it works item copies the first list item.' },
    { textContent: 'How copy jump. Key equals focuses Copy How it works.' },
    { textContent: 'Last How it works item. Copy last How it works item copies the last list item.' },
  ];
  const document = {
    getElementById(id) {
      if (id === 'copy-last-how') return { addEventListener(name, handler) { if (name === 'click') clickLast = handler; } };
      if (id === 'copy-last-how-status') return { textContent: '' };
      if (id === 'copy-last-how-fallback') return { hidden: true, value: '', focus() {}, select() {} };
      return null;
    },
    querySelector: () => null,
    querySelectorAll(selector) {
      return selector === '#how-it-works li' ? items : [];
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
  await clickLast();
  assert.equal(copied, '- Last How it works item. Copy last How it works item copies the last list item.');
  assert.doesNotMatch(copied, /\n/);
  assert.doesNotMatch(copied, /## How it works/);
  assert.doesNotMatch(copied, /First How it works item/);
  assert.doesNotMatch(copied, /live policy feed/);
  items = [];
  copied = 'stale';
  await clickLast();
  assert.equal(copied, '');
});

test('copy last How it works item shows a visible textarea when clipboard is unavailable', async () => {
  let clickLast = null;
  const fallback = { hidden: true, value: '', focused: false, selected: false, focus() { this.focused = true; }, select() { this.selected = true; } };
  const status = { textContent: '' };
  const document = {
    getElementById(id) {
      if (id === 'copy-last-how') return { addEventListener(name, handler) { if (name === 'click') clickLast = handler; } };
      if (id === 'copy-last-how-status') return status;
      if (id === 'copy-last-how-fallback') return fallback;
      return null;
    },
    querySelector: () => null,
    querySelectorAll(selector) {
      return selector === '#how-it-works li' ? [{ textContent: 'Last How it works item. Copy last How it works item copies the last list item.' }] : [];
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
  await clickLast();
  assert.equal(fallback.hidden, false);
  assert.equal(fallback.focused, true);
  assert.equal(fallback.selected, true);
  assert.equal(fallback.value, '- Last How it works item. Copy last How it works item copies the last list item.');
  assert.match(status.textContent, /Clipboard unavailable/);
  assert.match(status.textContent, /not a live policy feed/);
});

test('print CSS hides copy last How tools and keeps How it works and versions', () => {
  const print = html.match(/@media print \{([\s\S]*)\}\s*<\/style>/)?.[1] ?? '';
  assert.match(print, /\.copy-last-how-tools, \.copy-last-how-fallback \{ display: none !important; \}/);
  assert.match(print, /\.copy-first-how-tools, \.copy-first-how-fallback \{ display: none !important; \}/);
  assert.match(print, /#how-it-works, \.guide \{ display: block !important; \}/);
  assert.match(print, /\.whats-new, \.workbench \.version, \.version-line, \.trust \{ display: block !important; \}/);
});

test('keyboard less-than copies the last How it works item through its own control', () => {
  assert.match(html, /event\.key === '<'/);
  assert.match(html, /lastHowBtn\?\.click\(\)/);
  assert.match(html, /inEditable\(event\.target\)/);
  assert.match(html, /aria-keyshortcuts="<"/);
  assert.match(html, /<kbd>&lt;<\/kbd><\/dt><dd>Copy the last How it works list item as one Markdown line from this catalog page, not a live policy feed/);
  assert.match(html, /Press <kbd>&lt;<\/kbd> to copy the last How it works list item/);
  assert.match(html, /If that item is missing, this copies an empty string/);
  assert.match(html, /This is distinct from <kbd>-<\/kbd>, which copies the first How it works list item/);
  assert.match(html, /from <kbd>u<\/kbd>, which copies the full How it works list/);
  assert.match(readme, /Press `<` to copy the last How it works list item/);
  const clicks = { lastHow: 0, firstHow: 0, how: 0 };
  const focused = [];
  let keydown = null;
  const document = {
    getElementById(id) {
      if (id === 'copy-last-how') return { click() { clicks.lastHow += 1; }, addEventListener() {} };
      if (id === 'copy-first-how') return { click() { clicks.firstHow += 1; }, addEventListener() {} };
      if (id === 'copy-how') return { click() { clicks.how += 1; }, addEventListener() {}, focus() { focused.push('copy-how'); } };
      if (id === 'how-title') return { focus() { focused.push('how-title'); } };
      if (id === 'how-it-works') return { focus() { focused.push('how-it-works'); } };
      if (id === 'shortcuts') return { hidden: true };
      if (id === 'shortcuts-open') return { setAttribute() {}, addEventListener() {} };
      if (id === 'shortcuts-close') return { addEventListener() {} };
      if (id === 'skip-shortcuts') return { addEventListener() {} };
      return null;
    },
    querySelector(selector) {
      return selector === '#how-it-works li' ? { focus() { focused.push('how-li'); } } : null;
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
  const textarea = { tagName: 'TEXTAREA', closest() { return textarea; } };
  const body = { tagName: 'BODY', closest() { return null; } };
  fire('<', input);
  fire('<', textarea);
  assert.equal(clicks.lastHow, 0);
  assert.equal(clicks.firstHow, 0);
  assert.equal(clicks.how, 0);
  assert.deepEqual(focused, []);
  fire('<', body);
  assert.equal(clicks.lastHow, 1);
  assert.equal(clicks.firstHow, 0);
  assert.equal(clicks.how, 0);
  assert.deepEqual(focused, []);
  fire('-', body);
  assert.equal(clicks.firstHow, 1);
  assert.equal(clicks.lastHow, 1);
  fire('u', body);
  assert.equal(clicks.how, 1);
  assert.equal(clicks.lastHow, 1);
});

test('greater-than focuses Copy last How it works item when focus is not in an input', () => {
  assert.match(html, /event\.key === '>'/);
  assert.match(html, /getElementById\('copy-last-how'\) \|\| document\.getElementById\('how-title'\) \|\| document\.getElementById\('how-it-works'\)/);
  assert.match(html, /id="copy-last-how"/);
  assert.match(html, /id="how-title" tabindex="-1"/);
  assert.match(html, /<kbd>&gt;<\/kbd><\/dt><dd>Focus the Copy last How it works item control, or the How it works heading if that control is missing. This key moves focus; it does not open a workbench. It does not copy./);
  assert.match(html, /Press <kbd>&gt;<\/kbd> to focus Copy last How it works item/);
  assert.match(html, /This key moves focus; it does not open a workbench/);
  assert.match(html, /inEditable\(event\.target\)/);
  assert.match(readme, /Key `>` focuses the Copy\s+last How it works item control/);
  assert.match(readme, /Press `>` to focus the Copy last How it works item control/);
  const focused = [];
  const clicks = { lastHow: 0, how: 0 };
  const assigned = [];
  let keydown = null;
  const copyLastHow = { focus() { focused.push('copy-last-how'); }, click() { clicks.lastHow += 1; }, addEventListener() {} };
  const heading = { focus() { focused.push('how-title'); } };
  const document = {
    getElementById(id) {
      if (id === 'copy-last-how') return copyLastHow;
      if (id === 'copy-how') return { focus() { focused.push('copy-how'); }, click() { clicks.how += 1; }, addEventListener() {} };
      if (id === 'how-title') return heading;
      if (id === 'how-it-works') return { focus() { focused.push('how-it-works'); } };
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
  const textarea = { tagName: 'TEXTAREA', closest() { return textarea; } };
  const body = { tagName: 'BODY', closest() { return null; } };
  fire('>', input);
  fire('>', textarea);
  assert.deepEqual(focused, []);
  assert.equal(clicks.lastHow, 0);
  assert.equal(clicks.how, 0);
  assert.deepEqual(assigned, []);
  fire('>', body);
  assert.deepEqual(focused, ['copy-last-how']);
  assert.equal(clicks.lastHow, 0);
  assert.deepEqual(assigned, []);
  fire('=', body);
  assert.deepEqual(focused, ['copy-last-how', 'copy-how']);
  assert.equal(clicks.how, 0);
  fire('k', body);
  assert.deepEqual(focused, ['copy-last-how', 'copy-how', 'how-it-works']);
});

test('greater-than focuses the How it works heading when Copy last How it works item is missing', () => {
  const focused = [];
  const assigned = [];
  let keydown = null;
  const heading = { focus() { focused.push('how-title'); } };
  const document = {
    getElementById(id) {
      if (id === 'copy-last-how') return null;
      if (id === 'how-title') return heading;
      if (id === 'how-it-works') return { focus() { focused.push('how-it-works'); } };
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
  keydown({
    key: '>',
    target: { tagName: 'BODY', closest() { return null; } },
    defaultPrevented: false,
    altKey: false,
    ctrlKey: false,
    metaKey: false,
    shiftKey: false,
    preventDefault() {},
  });
  assert.deepEqual(focused, ['how-title']);
  assert.deepEqual(assigned, []);
});


test('underscore focuses Copy first How it works item when focus is not in an input', () => {
  assert.match(html, /event\.key === '_'/);
  assert.match(html, /getElementById\('copy-first-how'\) \|\| document\.getElementById\('how-title'\) \|\| document\.getElementById\('how-it-works'\)/);
  assert.match(html, /id="copy-first-how"/);
  assert.match(html, /id="how-title" tabindex="-1"/);
  assert.match(html, /<kbd>_<\/kbd><\/dt><dd>Focus the Copy first How it works item control, or the How it works heading if that control is missing. This key moves focus; it does not open a workbench. It does not copy./);
  assert.match(html, /Press <kbd>_<\/kbd> to focus Copy first How it works item/);
  assert.match(html, /This key moves focus; it does not open a workbench/);
  assert.match(html, /inEditable\(event\.target\)/);
  assert.match(readme, /Key `_` focuses the Copy\s+first How it works item control/);
  assert.match(readme, /Press `_` to focus the Copy first How it works item control/);
  const focused = [];
  const clicks = { firstHow: 0, lastHow: 0 };
  const assigned = [];
  let keydown = null;
  const copyFirstHow = { focus() { focused.push('copy-first-how'); }, click() { clicks.firstHow += 1; }, addEventListener() {} };
  const heading = { focus() { focused.push('how-title'); } };
  const document = {
    getElementById(id) {
      if (id === 'copy-first-how') return copyFirstHow;
      if (id === 'copy-last-how') return { focus() { focused.push('copy-last-how'); }, click() { clicks.lastHow += 1; }, addEventListener() {} };
      if (id === 'how-title') return heading;
      if (id === 'how-it-works') return { focus() { focused.push('how-it-works'); } };
      if (id === 'shortcuts') return { hidden: true };
      if (id === 'shortcuts-open') return { setAttribute() {}, addEventListener() {} };
      if (id === 'shortcuts-close') return { addEventListener() {} };
      if (id === 'skip-shortcuts') return { addEventListener() {} };
      return null;
    },
    querySelector(selector) {
      return selector === '#how-it-works li' ? { focus() { focused.push('how-li'); } } : null;
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
  fire('_', input);
  fire('_', textarea);
  assert.deepEqual(focused, []);
  assert.equal(clicks.firstHow, 0);
  assert.equal(clicks.lastHow, 0);
  assert.deepEqual(assigned, []);
  fire('_', body);
  assert.deepEqual(focused, ['copy-first-how']);
  assert.equal(clicks.firstHow, 0);
  assert.deepEqual(assigned, []);
  fire('-', body);
  assert.equal(clicks.firstHow, 1);
  fire('d', body);
  assert.deepEqual(focused, ['copy-first-how', 'how-li']);
  fire('>', body);
  assert.deepEqual(focused, ['copy-first-how', 'how-li', 'copy-last-how']);
  assert.equal(clicks.lastHow, 0);
});

test('underscore focuses the How it works heading when Copy first How it works item is missing', () => {
  const focused = [];
  const assigned = [];
  let keydown = null;
  const heading = { focus() { focused.push('how-title'); } };
  const document = {
    getElementById(id) {
      if (id === 'copy-first-how') return null;
      if (id === 'how-title') return heading;
      if (id === 'how-it-works') return { focus() { focused.push('how-it-works'); } };
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
  keydown({
    key: '_',
    target: { tagName: 'BODY', closest() { return null; } },
    defaultPrevented: false,
    altKey: false,
    ctrlKey: false,
    metaKey: false,
    shiftKey: false,
    preventDefault() {},
  });
  assert.deepEqual(focused, ['how-title']);
  assert.deepEqual(assigned, []);
});

test('keyboard less-than greater-than underscore are ignored in inputs using the same inEditable helper as c', () => {
  assert.match(html, /const inEditable = \(node\) =>/);
  assert.match(html, /if \(inEditable\(event\.target\)\) return;/);
  assert.match(html, /event\.key === 'c'/);
  assert.match(html, /event\.key === '<'/);
  assert.match(html, /event\.key === '>'/);
  assert.match(html, /event\.key === '_'/);
  const clicks = { lastHow: 0, firstHow: 0 };
  const focused = [];
  const assigned = [];
  let keydown = null;
  const document = {
    getElementById(id) {
      if (id === 'copy-last-how') return { click() { clicks.lastHow += 1; }, addEventListener() {}, focus() { focused.push('copy-last-how'); } };
      if (id === 'copy-first-how') return { click() { clicks.firstHow += 1; }, addEventListener() {}, focus() { focused.push('copy-first-how'); } };
      if (id === 'how-title') return { focus() { focused.push('how-title'); } };
      if (id === 'how-it-works') return { focus() { focused.push('how-it-works'); } };
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
  const textarea = { tagName: 'TEXTAREA', closest() { return textarea; } };
  const select = { tagName: 'SELECT', closest() { return select; } };
  const body = { tagName: 'BODY', closest() { return null; } };
  for (const target of [input, textarea, select]) {
    fire('<', target);
    fire('>', target);
    fire('_', target);
    fire('c', target);
  }
  assert.deepEqual(focused, []);
  assert.equal(clicks.lastHow, 0);
  assert.equal(clicks.firstHow, 0);
  assert.deepEqual(assigned, []);
  fire('<', body);
  fire('>', body);
  fire('_', body);
  assert.deepEqual(focused, ['copy-last-how', 'copy-first-how']);
  assert.equal(clicks.lastHow, 1);
  assert.equal(clicks.firstHow, 0);
  assert.deepEqual(assigned, []);
});

test('less-than greater-than underscore do not steal How copy, How jump, or first How copy', () => {
  assert.match(html, /event\.key === '<'/);
  assert.match(html, /event\.key === '>'/);
  assert.match(html, /event\.key === '_'/);
  assert.match(html, /event\.key === 'u'/);
  assert.match(html, /event\.key === 'd'/);
  assert.match(html, /event\.key === 'k'/);
  assert.match(html, /event\.key === '-'/);
  assert.match(html, /event\.key === '='/);
  assert.match(html, /lastHowBtn\?\.click\(\)/);
  assert.match(html, /firstHowBtn\?\.click\(\)/);
  assert.match(html, /howBtn\?\.click\(\)/);
  const clicks = { lastHow: 0, firstHow: 0, how: 0 };
  const focused = [];
  let keydown = null;
  const document = {
    getElementById(id) {
      if (id === 'copy-last-how') return { click() { clicks.lastHow += 1; }, addEventListener() {}, focus() { focused.push('copy-last-how'); } };
      if (id === 'copy-first-how') return { click() { clicks.firstHow += 1; }, addEventListener() {}, focus() { focused.push('copy-first-how'); } };
      if (id === 'copy-how') return { click() { clicks.how += 1; }, addEventListener() {}, focus() { focused.push('copy-how'); } };
      if (id === 'how-title') return { focus() { focused.push('how-title'); } };
      if (id === 'how-it-works') return { focus() { focused.push('how-it-works'); } };
      if (id === 'shortcuts') return { hidden: true };
      if (id === 'shortcuts-open') return { setAttribute() {}, addEventListener() {} };
      if (id === 'shortcuts-close') return { addEventListener() {} };
      if (id === 'skip-shortcuts') return { addEventListener() {} };
      return null;
    },
    querySelector(selector) {
      return selector === '#how-it-works li' ? { focus() { focused.push('how-li'); } } : null;
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
  const fire = (key) => {
    keydown({
      key,
      target: { tagName: 'BODY', closest() { return null; } },
      defaultPrevented: false,
      altKey: false,
      ctrlKey: false,
      metaKey: false,
      shiftKey: false,
      preventDefault() {},
    });
  };
  fire('u');
  fire('d');
  fire('k');
  fire('-');
  fire('=');
  fire('<');
  fire('>');
  fire('_');
  assert.equal(clicks.how, 1);
  assert.equal(clicks.firstHow, 1);
  assert.equal(clicks.lastHow, 1);
  assert.deepEqual(focused, ['how-li', 'how-it-works', 'copy-how', 'copy-last-how', 'copy-first-how']);
});

test('What\'s new and README name last-job copy and jumps without changing workbench versions', () => {
  assert.match(html, /Last-job copy, last-job jump, and first-job jump/);
  assert.match(html, /Copy last job through \} as Markdown/);
  assert.match(html, /jump with keyboard \+/);
  assert.match(html, /jump to Copy first job with keyboard \|/);
  assert.match(html, /They do not change workbench versions and they do not call a live product feed/);
  assert.match(html, /without adding a public path/);
  assert.match(readme, /last-job copy, last-job jump, and first-job jump/);
  assert.match(readme, /That What's new entry is hub-only. It does not change workbench versions/);
  assert.match(readme, /Copy last job on\s+that 404 page copies/);
  assert.match(readme, /Copy last job copies the last workbench name/);
  assert.doesNotMatch(html, /hosted API/i);
  assert.doesNotMatch(html, /live service/i);
});

test('What\'s new and README name last What\'s new copy and jumps without changing workbench versions', () => {
  assert.match(html, /Last What's new copy, last-news jump, and first-news jump/);
  assert.match(html, /Copy last What's new heading through tilde as Markdown/);
  assert.match(html, /jump with keyboard exclamation/);
  assert.match(html, /jump to Copy first What's new heading with keyboard open-paren/);
  assert.match(html, /They do not change workbench versions and they do not call a live product feed/);
  assert.match(html, /without adding a public path/);
  assert.match(html, /Last-job copy, last-job jump, and first-job jump/);
  assert.match(html, /Sunday late payout, payout-hour copy, and payout-closed hide in Weekend Gap 1.5.11/);
  assert.match(html, /Saturday early payout, closed-FX copy, and FX-closed hide in Weekend Gap 1.5.12/);
  assert.match(html, /Friday early payout, open-payout copy, and payout-open hide in Weekend Gap 1.5.13/);
  assert.match(html, /Saturday late payout, open-FX copy, and FX-open hide in Weekend Gap 1.5.14/);
  assert.match(html, /Sunday early payout, open-bank copy, and bank-open hide in Weekend Gap 1.5.15/);
  assert.match(html, /Sunday late issuer close, issuer-open copy, and issuer-open hide in Weekend Gap 1.5.16/);
  assert.match(html, /Sunday early issuer open, last-open-issuer copy, and weekend-issuer-open hide in Weekend Gap 1.5.17/);
  assert.match(html, /Saturday early issuer open, last-closed-issuer copy, and weekend-issuer-closed hide in Weekend Gap 1.5.18/);
  assert.match(html, /Friday early issuer open, last-closed-bank copy, and weekend-bank-closed hide in Weekend Gap 1.5.19/);
  assert.match(html, /Saturday early bank open, last-open-bank copy, and weekend-bank-open hide in Weekend Gap 1.5.20/);
  assert.match(html, /Friday early bank open, last-open-payout copy, and weekend-payout-open hide in Weekend Gap 1.5.21/);
  assert.match(readme, /last What's new copy, last-news jump, and first-news jump/);
  assert.match(readme, /That What's new entry is hub-only. It does not change workbench versions/);
  assert.match(readme, /Copy last What's new heading on\s+that 404 page copies/);
  assert.match(readme, /Copy last What's new heading copies the last What's new heading/);
  assert.match(readme, /Copy first What's new heading copies the first What's new heading/);
  assert.match(readme, /Press `~` to copy the last What's new heading/);
  assert.match(readme, /Press `!` to focus the Copy last What's new heading control/);
  assert.match(readme, /Press `\(` to focus the Copy first What's new heading control/);
  assert.match(readme, /Key `~` copies the last What's new heading/);
  assert.match(readme, /Key `!` focuses the Copy last What's new heading control/);
  assert.match(readme, /Key `\(` focuses the Copy first What's new heading control/);
  assert.doesNotMatch(html, /hosted API/i);
  assert.doesNotMatch(html, /live service/i);
});

test('What\'s new and README name first What\'s new copy, intro jump, and skip-link jump without changing workbench versions', () => {
  const news = html.slice(html.indexOf('id="whats-new"'), html.indexOf('id="workbenches"'));
  const headings = [...news.matchAll(/<h3[^>]*>([^<]+)<\/h3>/g)].map((match) => match[1]);
  assert.equal(headings.includes("First What's new copy, intro jump, and skip-link jump"), true);
  assert.equal(headings.includes('Last-skip-text copy, last-skip-text jump, and last-skip-target jump'), true);
  assert.equal(headings.includes('First-skip-text copy, first-skip-text jump, and skip-nav jump'), true);
  assert.equal(headings.includes('Last-skip copy, last-skip jump, and last-skip-link jump'), true);
  assert.equal(headings.includes('First-skip copy, first-skip jump, and first-skip-link jump'), true);
  assert.equal(headings.includes('Last-open copy, last-open jump, and last-open-link jump'), true);
  assert.equal(headings[headings.length - 1], 'Saturday late bank open, last-open-FX copy, and weekend-FX-open hide in Weekend Gap 1.5.22');
  assert.equal(headings.includes('Saturday early payout, closed-FX copy, and FX-closed hide in Weekend Gap 1.5.12'), true);
  assert.equal(headings.includes('Friday early payout, open-payout copy, and payout-open hide in Weekend Gap 1.5.13'), true);
  assert.equal(headings.includes('Saturday late payout, open-FX copy, and FX-open hide in Weekend Gap 1.5.14'), true);
  assert.equal(headings.includes('Sunday early payout, open-bank copy, and bank-open hide in Weekend Gap 1.5.15'), true);
  assert.equal(headings.includes('Sunday late issuer close, issuer-open copy, and issuer-open hide in Weekend Gap 1.5.16'), true);
  assert.equal(headings.includes('Sunday early issuer open, last-open-issuer copy, and weekend-issuer-open hide in Weekend Gap 1.5.17'), true);
  assert.equal(headings.includes('Saturday early issuer open, last-closed-issuer copy, and weekend-issuer-closed hide in Weekend Gap 1.5.18'), true);
  assert.equal(headings.includes('Friday early issuer open, last-closed-bank copy, and weekend-bank-closed hide in Weekend Gap 1.5.19'), true);
  assert.equal(headings.includes('Saturday early bank open, last-open-bank copy, and weekend-bank-open hide in Weekend Gap 1.5.20'), true);
  assert.equal(headings.includes('Friday early bank open, last-open-payout copy, and weekend-payout-open hide in Weekend Gap 1.5.21'), true);
  assert.equal(headings.includes('Saturday late bank open, last-open-FX copy, and weekend-FX-open hide in Weekend Gap 1.5.22'), true);
  assert.equal(headings.includes("Last What's new copy, last-news jump, and first-news jump"), true);
  assert.equal(headings.includes('Last-job copy, last-job jump, and first-job jump'), true);
  assert.equal(headings.includes('Swimming carnival, over-capacity label copy, and first-over-capacity hide in Partnership Breakpoint 1.5.12'), true);
  assert.equal(headings.includes('Athletics carnival, remaining-capacity copy, and last-over-capacity hide in Partnership Breakpoint 1.5.13'), true);
  assert.equal(headings.includes('Cricket carnival, last-over-capacity copy, and last-breakpoint hide in Partnership Breakpoint 1.5.14'), true);
  assert.equal(headings.includes('Tennis carnival, last-over-capacity remaining copy, and last-within-capacity hide in Partnership Breakpoint 1.5.15'), true);
  assert.equal(headings.includes('Basketball carnival, first-within remaining copy, and first-within hide in Partnership Breakpoint 1.5.16'), true);
  assert.equal(headings.includes('Volleyball carnival, last-within remaining copy, and last-spare hide in Partnership Breakpoint 1.5.17'), true);
  assert.equal(headings.includes('Rugby carnival, last-spare remaining copy, and first-spare hide in Partnership Breakpoint 1.5.18'), true);
  assert.equal(headings.includes('Hockey carnival, first-spare remaining copy, and last-unbounded hide in Partnership Breakpoint 1.5.19'), true);
  assert.equal(headings.includes('Baseball carnival, last-unbounded remaining copy, and first-unbounded hide in Partnership Breakpoint 1.5.20'), true);
  assert.equal(headings.includes('Softball carnival, first-unbounded remaining copy, and last-at-hold hide in Partnership Breakpoint 1.5.21'), true);
  assert.equal(headings.includes('Lacrosse carnival, last-at-hold remaining copy, and first-at-hold hide in Partnership Breakpoint 1.5.22'), true);
  assert.equal(headings.includes('Swimming carnival lunch, leftover-fulfillment copy, and winner-allocated hide in Common Cart 1.4.12'), true);
  assert.equal(headings.includes('Athletics carnival lunch, leftover-delivery copy, and leftover-fill hide in Common Cart 1.4.13'), true);
  assert.equal(headings.includes('Cricket carnival lunch, leftover-pickup copy, and last leftover-fill hide in Common Cart 1.4.14'), true);
  assert.equal(headings.includes('Tennis carnival lunch, leftover-label copy, and first leftover-fill hide in Common Cart 1.4.15'), true);
  assert.equal(headings.includes('Basketball carnival lunch, leftover-minimum copy, and first tertiary-fill hide in Common Cart 1.4.16'), true);
  assert.equal(headings.includes('Volleyball carnival lunch, leftover-maximum copy, and last tertiary-fill hide in Common Cart 1.4.17'), true);
  assert.equal(headings.includes('Soccer carnival lunch, tertiary-remaining copy, and last unserved hide in Common Cart 1.4.18'), true);
  assert.equal(headings.includes('Rugby carnival lunch, tertiary-maximum copy, and first unserved hide in Common Cart 1.4.19'), true);
  assert.equal(headings.includes('Hockey carnival lunch, leftover-uncovered remaining copy, and last leftover-only hide in Common Cart 1.4.20'), true);
  assert.equal(headings.includes('Baseball carnival lunch, leftover-uncovered maximum copy, and first leftover-only hide in Common Cart 1.4.21'), true);
  assert.equal(headings.includes('Softball carnival lunch, leftover-uncovered minimum copy, and last winner-allocated hide in Common Cart 1.4.22'), true);
  assert.equal(headings.includes('Swimming club hours, first-veto copy, and first-veto hide in The Smallest Agreement 1.5.12'), true);
  assert.equal(headings.includes('Athletics club hours, veto-count copy, and last-veto hide in The Smallest Agreement 1.5.13'), true);
  assert.equal(headings.includes('Cricket club hours, first-non-veto copy, and first-non-veto hide in The Smallest Agreement 1.5.14'), true);
  assert.equal(headings.includes('Tennis club hours, last-veto copy, and last-non-veto hide in The Smallest Agreement 1.5.15'), true);
  assert.equal(headings.includes('Basketball club hours, last-non-veto copy, and last-below-threshold hide in The Smallest Agreement 1.5.16'), true);
  assert.equal(headings.includes('Volleyball club hours, last-below-threshold copy, and first-below-threshold hide in The Smallest Agreement 1.5.17'), true);
  assert.equal(headings.includes('Soccer club hours, first-below-threshold copy, and last-at-or-above hide in The Smallest Agreement 1.5.18'), true);
  assert.equal(headings.includes('Hockey club hours, last-at-or-above copy, and first-at-or-above hide in The Smallest Agreement 1.5.19'), true);
  assert.equal(headings.includes('Rugby club hours, first-at-or-above copy, and last-at-floor hide in The Smallest Agreement 1.5.20'), true);
  assert.equal(headings.includes('Softball club hours, last-at-floor copy, and first-at-floor hide in The Smallest Agreement 1.5.21'), true);
  assert.equal(headings.includes('Lacrosse club hours, last-below-floor copy, and first-below-floor hide in The Smallest Agreement 1.5.22'), true);
  assert.match(html, /Copy first What's new heading through close-paren as Markdown/);
  assert.match(html, /jump to Copy catalog intro with keyboard at/);
  assert.match(html, /jump to Copy skip links with keyboard hash/);
  assert.match(html, /They do not change workbench versions and they do not call a live product feed/);
  assert.match(html, /without adding a public path/);
  assert.match(html, /These are in-page catalog tools/);
  assert.match(readme, /first What's new copy, intro jump, and skip-link jump/);
  assert.match(readme, /That What's new entry is hub-only. It does not change workbench versions/);
  assert.match(readme, /Copy first What's new heading on\s+that 404 page copies/);
  assert.match(readme, /Copy first What's new heading copies the first What's new heading/);
  assert.match(readme, /Press `\)` to copy the first What's new heading/);
  assert.match(readme, /Press `@` to focus the Copy catalog intro control/);
  assert.match(readme, /Press `#` to focus the Copy skip links control/);
  assert.match(readme, /Key `\)` copies the first What's new heading/);
  assert.match(readme, /Key `@` focuses the Copy catalog intro control/);
  assert.match(readme, /Key `#` focuses the Copy skip links control/);
  assert.doesNotMatch(html, /hosted API/i);
  assert.doesNotMatch(html, /live service/i);
});

test('What\'s new and README name first-workbench copy, first-card jump, and first-trust jump without changing workbench versions', () => {
  const news = html.slice(html.indexOf('id="whats-new"'), html.indexOf('id="workbenches"'));
  const headings = [...news.matchAll(/<h3[^>]*>([^<]+)<\/h3>/g)].map((match) => match[1]);
  assert.equal(headings[0], 'Last-skip-text copy, last-skip-text jump, and last-skip-target jump');
  assert.equal(headings.includes('First-skip-text copy, first-skip-text jump, and skip-nav jump'), true);
  assert.equal(headings.includes('Last-skip copy, last-skip jump, and last-skip-link jump'), true);
  assert.equal(headings.includes('First-skip copy, first-skip jump, and first-skip-link jump'), true);
  assert.equal(headings.includes('Last-open copy, last-open jump, and last-open-link jump'), true);
  assert.equal(headings.includes('First-open copy, first-open jump, and first-open-link jump'), true);
  assert.equal(headings.includes('Last-review copy, last-review jump, and last-path jump'), true);
  assert.equal(headings.includes('Last-workbench copy, last-card jump, and last-trust jump'), true);
  assert.equal(headings.includes('First-workbench copy, first-card jump, and first-trust jump'), true);
  assert.equal(headings[headings.length - 1], 'Saturday late bank open, last-open-FX copy, and weekend-FX-open hide in Weekend Gap 1.5.22');
  assert.equal(headings.includes("First What's new copy, intro jump, and skip-link jump"), true);
  assert.equal(headings.includes("Last What's new copy, last-news jump, and first-news jump"), true);
  assert.equal(headings.includes('Last-job copy, last-job jump, and first-job jump'), true);
  assert.equal(headings.includes('Saturday early payout, closed-FX copy, and FX-closed hide in Weekend Gap 1.5.12'), true);
  assert.equal(headings.includes('Friday early payout, open-payout copy, and payout-open hide in Weekend Gap 1.5.13'), true);
  assert.equal(headings.includes('Saturday late payout, open-FX copy, and FX-open hide in Weekend Gap 1.5.14'), true);
  assert.equal(headings.includes('Sunday early payout, open-bank copy, and bank-open hide in Weekend Gap 1.5.15'), true);
  assert.equal(headings.includes('Sunday late issuer close, issuer-open copy, and issuer-open hide in Weekend Gap 1.5.16'), true);
  assert.equal(headings.includes('Sunday early issuer open, last-open-issuer copy, and weekend-issuer-open hide in Weekend Gap 1.5.17'), true);
  assert.equal(headings.includes('Saturday early issuer open, last-closed-issuer copy, and weekend-issuer-closed hide in Weekend Gap 1.5.18'), true);
  assert.equal(headings.includes('Friday early issuer open, last-closed-bank copy, and weekend-bank-closed hide in Weekend Gap 1.5.19'), true);
  assert.equal(headings.includes('Saturday early bank open, last-open-bank copy, and weekend-bank-open hide in Weekend Gap 1.5.20'), true);
  assert.equal(headings.includes('Friday early bank open, last-open-payout copy, and weekend-payout-open hide in Weekend Gap 1.5.21'), true);
  assert.equal(headings.includes('Saturday late bank open, last-open-FX copy, and weekend-FX-open hide in Weekend Gap 1.5.22'), true);
  assert.equal(headings.includes('Athletics carnival, remaining-capacity copy, and last-over-capacity hide in Partnership Breakpoint 1.5.13'), true);
  assert.equal(headings.includes('Cricket carnival, last-over-capacity copy, and last-breakpoint hide in Partnership Breakpoint 1.5.14'), true);
  assert.equal(headings.includes('Tennis carnival, last-over-capacity remaining copy, and last-within-capacity hide in Partnership Breakpoint 1.5.15'), true);
  assert.equal(headings.includes('Basketball carnival, first-within remaining copy, and first-within hide in Partnership Breakpoint 1.5.16'), true);
  assert.equal(headings.includes('Volleyball carnival, last-within remaining copy, and last-spare hide in Partnership Breakpoint 1.5.17'), true);
  assert.equal(headings.includes('Rugby carnival, last-spare remaining copy, and first-spare hide in Partnership Breakpoint 1.5.18'), true);
  assert.equal(headings.includes('Hockey carnival, first-spare remaining copy, and last-unbounded hide in Partnership Breakpoint 1.5.19'), true);
  assert.equal(headings.includes('Baseball carnival, last-unbounded remaining copy, and first-unbounded hide in Partnership Breakpoint 1.5.20'), true);
  assert.equal(headings.includes('Softball carnival, first-unbounded remaining copy, and last-at-hold hide in Partnership Breakpoint 1.5.21'), true);
  assert.equal(headings.includes('Lacrosse carnival, last-at-hold remaining copy, and first-at-hold hide in Partnership Breakpoint 1.5.22'), true);
  assert.equal(headings.includes('Athletics carnival lunch, leftover-delivery copy, and leftover-fill hide in Common Cart 1.4.13'), true);
  assert.equal(headings.includes('Cricket carnival lunch, leftover-pickup copy, and last leftover-fill hide in Common Cart 1.4.14'), true);
  assert.equal(headings.includes('Tennis carnival lunch, leftover-label copy, and first leftover-fill hide in Common Cart 1.4.15'), true);
  assert.equal(headings.includes('Basketball carnival lunch, leftover-minimum copy, and first tertiary-fill hide in Common Cart 1.4.16'), true);
  assert.equal(headings.includes('Volleyball carnival lunch, leftover-maximum copy, and last tertiary-fill hide in Common Cart 1.4.17'), true);
  assert.equal(headings.includes('Soccer carnival lunch, tertiary-remaining copy, and last unserved hide in Common Cart 1.4.18'), true);
  assert.equal(headings.includes('Rugby carnival lunch, tertiary-maximum copy, and first unserved hide in Common Cart 1.4.19'), true);
  assert.equal(headings.includes('Hockey carnival lunch, leftover-uncovered remaining copy, and last leftover-only hide in Common Cart 1.4.20'), true);
  assert.equal(headings.includes('Baseball carnival lunch, leftover-uncovered maximum copy, and first leftover-only hide in Common Cart 1.4.21'), true);
  assert.equal(headings.includes('Softball carnival lunch, leftover-uncovered minimum copy, and last winner-allocated hide in Common Cart 1.4.22'), true);
  assert.equal(headings.includes('Athletics club hours, veto-count copy, and last-veto hide in The Smallest Agreement 1.5.13'), true);
  assert.equal(headings.includes('Cricket club hours, first-non-veto copy, and first-non-veto hide in The Smallest Agreement 1.5.14'), true);
  assert.equal(headings.includes('Tennis club hours, last-veto copy, and last-non-veto hide in The Smallest Agreement 1.5.15'), true);
  assert.equal(headings.includes('Basketball club hours, last-non-veto copy, and last-below-threshold hide in The Smallest Agreement 1.5.16'), true);
  assert.equal(headings.includes('Volleyball club hours, last-below-threshold copy, and first-below-threshold hide in The Smallest Agreement 1.5.17'), true);
  assert.equal(headings.includes('Soccer club hours, first-below-threshold copy, and last-at-or-above hide in The Smallest Agreement 1.5.18'), true);
  assert.equal(headings.includes('Hockey club hours, last-at-or-above copy, and first-at-or-above hide in The Smallest Agreement 1.5.19'), true);
  assert.equal(headings.includes('Rugby club hours, first-at-or-above copy, and last-at-floor hide in The Smallest Agreement 1.5.20'), true);
  assert.equal(headings.includes('Softball club hours, last-at-floor copy, and first-at-floor hide in The Smallest Agreement 1.5.21'), true);
  assert.equal(headings.includes('Lacrosse club hours, last-below-floor copy, and first-below-floor hide in The Smallest Agreement 1.5.22'), true);
  assert.match(html, /Copy first workbench heading through asterisk as Markdown/);
  assert.match(html, /jump to that control with keyboard ampersand/);
  assert.match(html, /jump to Copy first Trust item with keyboard percent/);
  assert.match(html, /They do not change workbench versions and they do not call a live product feed/);
  assert.match(html, /without adding a public path/);
  assert.match(html, /These are in-page catalog tools/);
  assert.match(readme, /first-workbench copy, first-card jump, and first-trust jump/);
  assert.match(readme, /That What's new entry is hub-only. It does not change workbench versions/);
  assert.match(readme, /Copy first workbench heading on\s+that 404 page copies/);
  assert.match(readme, /Copy first workbench heading copies the first workbench card heading/);
  assert.match(readme, /Press `\*` to copy the first workbench heading/);
  assert.match(readme, /Press `&` to focus the Copy first workbench heading control/);
  assert.match(readme, /Press `%` to focus the Copy first Trust item control/);
  assert.match(readme, /Key `\*` copies the first workbench heading/);
  assert.match(readme, /Key `&` focuses the Copy first workbench heading control/);
  assert.match(readme, /Key `%` focuses the Copy first Trust item control/);
  assert.doesNotMatch(html, /hosted API/i);
  assert.doesNotMatch(html, /live service/i);
});

test('What\'s new and README name last-workbench copy, last-card jump, and last-trust jump without changing workbench versions', () => {
  const news = html.slice(html.indexOf('id="whats-new"'), html.indexOf('id="workbenches"'));
  const headings = [...news.matchAll(/<h3[^>]*>([^<]+)<\/h3>/g)].map((match) => match[1]);
  assert.equal(headings[0], 'Last-skip-text copy, last-skip-text jump, and last-skip-target jump');
  assert.equal(headings.includes('First-skip-text copy, first-skip-text jump, and skip-nav jump'), true);
  assert.equal(headings.includes('Last-skip copy, last-skip jump, and last-skip-link jump'), true);
  assert.equal(headings.includes('First-skip copy, first-skip jump, and first-skip-link jump'), true);
  assert.equal(headings.includes('Last-open copy, last-open jump, and last-open-link jump'), true);
  assert.equal(headings.includes('First-open copy, first-open jump, and first-open-link jump'), true);
  assert.equal(headings.includes('Last-review copy, last-review jump, and last-path jump'), true);
  assert.equal(headings.includes('Last-workbench copy, last-card jump, and last-trust jump'), true);
  assert.equal(headings.includes('First-workbench copy, first-card jump, and first-trust jump'), true);
  assert.equal(headings[headings.length - 1], 'Saturday late bank open, last-open-FX copy, and weekend-FX-open hide in Weekend Gap 1.5.22');
  assert.equal(headings.includes("First What's new copy, intro jump, and skip-link jump"), true);
  assert.equal(headings.includes("Last What's new copy, last-news jump, and first-news jump"), true);
  assert.equal(headings.includes('Last-job copy, last-job jump, and first-job jump'), true);
  assert.equal(headings.includes('Saturday late payout, open-FX copy, and FX-open hide in Weekend Gap 1.5.14'), true);
  assert.equal(headings.includes('Sunday early payout, open-bank copy, and bank-open hide in Weekend Gap 1.5.15'), true);
  assert.equal(headings.includes('Sunday late issuer close, issuer-open copy, and issuer-open hide in Weekend Gap 1.5.16'), true);
  assert.equal(headings.includes('Sunday early issuer open, last-open-issuer copy, and weekend-issuer-open hide in Weekend Gap 1.5.17'), true);
  assert.equal(headings.includes('Saturday early issuer open, last-closed-issuer copy, and weekend-issuer-closed hide in Weekend Gap 1.5.18'), true);
  assert.equal(headings.includes('Friday early issuer open, last-closed-bank copy, and weekend-bank-closed hide in Weekend Gap 1.5.19'), true);
  assert.equal(headings.includes('Saturday early bank open, last-open-bank copy, and weekend-bank-open hide in Weekend Gap 1.5.20'), true);
  assert.equal(headings.includes('Friday early bank open, last-open-payout copy, and weekend-payout-open hide in Weekend Gap 1.5.21'), true);
  assert.equal(headings.includes('Saturday late bank open, last-open-FX copy, and weekend-FX-open hide in Weekend Gap 1.5.22'), true);
  assert.match(html, /Copy last workbench heading through dollar as Markdown/);
  assert.match(html, /jump to that control with keyboard caret/);
  assert.match(html, /jump to Copy last Trust item with keyboard backtick/);
  assert.match(html, /They do not change workbench versions and they do not call a live product feed/);
  assert.match(html, /without adding a public path/);
  assert.match(html, /These are in-page catalog tools/);
  assert.match(readme, /last-workbench copy, last-card jump, and last-trust jump/);
  assert.match(readme, /That What's new entry is hub-only. It does not change workbench versions/);
  assert.match(readme, /Copy last workbench heading on\s+that 404 page copies/);
  assert.match(readme, /Copy last workbench heading copies the last workbench card heading/);
  assert.match(readme, /Press `\$` to copy the last workbench heading/);
  assert.match(readme, /Press `\^` to focus the Copy last workbench heading control/);
  assert.match(readme, /Press `` ` `` to focus the Copy last Trust item control/);
  assert.match(readme, /Key `\$` copies the last workbench heading/);
  assert.match(readme, /Key `\^` focuses the Copy last workbench heading control/);
  assert.match(readme, /Key `` ` `` focuses the Copy last Trust item control/);
  assert.doesNotMatch(html, /hosted API/i);
  assert.doesNotMatch(html, /live service/i);
});

test('copy last job control is distinct from Copy first job and Copy jobs', () => {
  assert.match(html, /id="copy-last-job"/);
  assert.match(html, />Copy last job</);
  assert.match(html, /aria-keyshortcuts="}"/);
  assert.match(html, /id="copy-last-job-fallback"/);
  assert.match(html, /class="copy-last-job-fallback"/);
  assert.match(html, /textarea id="copy-last-job-fallback"/);
  assert.match(html, /id="copy-first-job"/);
  assert.match(html, />Copy first job</);
  assert.match(html, /id="copy-jobs"/);
  assert.match(html, />Copy jobs</);
  assert.notEqual(html.match(/id="copy-last-job"/)?.[0], html.match(/id="copy-first-job"/)?.[0]);
  assert.notEqual(html.match(/id="copy-last-job"/)?.[0], html.match(/id="copy-jobs"/)?.[0]);
  assert.notEqual(html.match(/id="copy-last-job"/)?.[0], html.match(/id="copy-last"/)?.[0]);
  assert.match(html, /@media print[\s\S]*\.copy-last-job-tools/);
  assert.match(html, /@media print[\s\S]*\.copy-last-job-fallback \{ display: none !important; \}/);
  assert.doesNotMatch(html, /hosted API/i);
});

test('copy last job markdown is the last catalog card, or empty if missing', async () => {
  assert.match(html, /lastJobMarkdown/);
  assert.match(html, /querySelectorAll\('article\.workbench'\)/);
  assert.match(html, /cards\[cards\.length - 1\]/);
  assert.match(html, /navigator\.clipboard\?\.writeText/);
  assert.match(html, /lastJobFallback\.hidden = false/);
  assert.match(html, /lastJobFallback\.select\(\)/);
  assert.match(html, /Not a live product feed/);
  assert.match(html, /This is the last catalog job, not a live product feed/);
  assert.match(html, /Copied an empty string/);
  let copied = '';
  let clickLast = null;
  let cards = [
    {
      querySelector(sel) {
        if (sel === 'h3') return { textContent: 'Partnership Breakpoint' };
        if (sel === 'p.job') return { textContent: 'Find which participant in a revenue split.' };
        return null;
      },
    },
    {
      querySelector(sel) {
        if (sel === 'h3') return { textContent: 'Weekend Gap' };
        if (sel === 'p.job') return { textContent: 'Follow synthetic AUD redemption demand.' };
        return null;
      },
    },
  ];
  const document = {
    getElementById(id) {
      if (id === 'copy-last-job') return { addEventListener(name, handler) { if (name === 'click') clickLast = handler; } };
      if (id === 'copy-last-job-status') return { textContent: '' };
      if (id === 'copy-last-job-fallback') return { hidden: true, value: '', focus() {}, select() {} };
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
  await clickLast();
  assert.equal(copied, '- Weekend Gap: Follow synthetic AUD redemption demand.');
  assert.doesNotMatch(copied, /\n/);
  assert.doesNotMatch(copied, /Partnership Breakpoint/);
  assert.doesNotMatch(copied, /live product feed/);
  cards = [];
  copied = 'stale';
  await clickLast();
  assert.equal(copied, '');
});

test('copy last job shows a visible textarea when clipboard is unavailable', async () => {
  let clickLast = null;
  const fallback = { hidden: true, value: '', focused: false, selected: false, focus() { this.focused = true; }, select() { this.selected = true; } };
  const status = { textContent: '' };
  const document = {
    getElementById(id) {
      if (id === 'copy-last-job') return { addEventListener(name, handler) { if (name === 'click') clickLast = handler; } };
      if (id === 'copy-last-job-status') return status;
      if (id === 'copy-last-job-fallback') return fallback;
      return null;
    },
    querySelector: () => null,
    querySelectorAll(selector) {
      return selector === 'article.workbench' ? [{
        querySelector(sel) {
          if (sel === 'h3') return { textContent: 'Weekend Gap' };
          if (sel === 'p.job') return { textContent: 'Follow synthetic AUD redemption demand.' };
          return null;
        },
      }] : [];
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
  await clickLast();
  assert.equal(fallback.hidden, false);
  assert.equal(fallback.focused, true);
  assert.equal(fallback.selected, true);
  assert.equal(fallback.value, '- Weekend Gap: Follow synthetic AUD redemption demand.');
  assert.match(status.textContent, /Clipboard unavailable/);
  assert.match(status.textContent, /not a live product feed/);
});

test('print CSS hides copy last job tools and keeps How it works and versions', () => {
  const print = html.match(/@media print \{([\s\S]*)\}\s*<\/style>/)?.[1] ?? '';
  assert.match(print, /\.copy-last-job-tools, \.copy-last-job-fallback \{ display: none !important; \}/);
  assert.match(print, /\.copy-first-job-tools, \.copy-first-job-fallback \{ display: none !important; \}/);
  assert.match(print, /#how-it-works, \.guide \{ display: block !important; \}/);
  assert.match(print, /\.whats-new, \.workbench \.version, \.version-line, \.trust \{ display: block !important; \}/);
});

test('shortcuts panel lists close-brace plus pipe with honest limits', () => {
  assert.match(html, /<kbd>\}<\/kbd><\/dt><dd>Copy the last workbench name and one-sentence job as one Markdown line from this catalog page, not a live product feed/);
  assert.match(html, /<kbd>\+<\/kbd><\/dt><dd>Focus the Copy last job control, or the workbenches heading if that control is missing. This key moves focus; it does not open a workbench. It does not copy./);
  assert.match(html, /<kbd>\|<\/kbd><\/dt><dd>Focus the Copy first job control, or the workbenches heading if that control is missing. This key moves focus; it does not open a workbench. It does not copy./);
  assert.match(html, /Shortcuts are ignored while focus is in an input, textarea, or select/);
  assert.match(html, /not a live product feed/);
  assert.match(html, /id="copy-last-job"/);
  assert.match(html, /id="copy-first-job"/);
  assert.match(html, /id="copy-jobs"/);
  assert.match(html, /Press <kbd>\}<\/kbd> to copy the last workbench job/);
  assert.match(html, /Press <kbd>\+<\/kbd> to focus Copy last job/);
  assert.match(html, /Press <kbd>\|<\/kbd> to focus Copy first job/);
  assert.match(readme, /Press `\}` to copy the last workbench name/);
  assert.match(readme, /Press `\+` to focus the Copy last job control/);
  assert.match(readme, /Press `\|` to focus the Copy first job control/);
});

test('keyboard close-brace copies the last workbench job through its own control', () => {
  assert.match(html, /event\.key === '}'/);
  assert.match(html, /lastJobBtn\?\.click\(\)/);
  assert.match(html, /inEditable\(event\.target\)/);
  assert.match(html, /aria-keyshortcuts="}"/);
  assert.match(html, /<kbd>\}<\/kbd><\/dt><dd>Copy the last workbench name and one-sentence job as one Markdown line from this catalog page, not a live product feed/);
  assert.match(html, /Press <kbd>\}<\/kbd> to copy the last workbench job/);
  assert.match(html, /If that card is missing, this copies an empty string/);
  assert.match(html, /This is distinct from <kbd>;<\/kbd>, which copies the first workbench job/);
  assert.match(html, /from <kbd>j<\/kbd> and <kbd>q<\/kbd>, which copy all four jobs/);
  assert.match(readme, /Press `\}` to copy the last workbench name/);
  const clicks = { lastJob: 0, firstJob: 0, jobs: 0 };
  const focused = [];
  let keydown = null;
  const document = {
    getElementById(id) {
      if (id === 'copy-last-job') return { click() { clicks.lastJob += 1; }, addEventListener() {}, focus() { focused.push('copy-last-job'); } };
      if (id === 'copy-first-job') return { click() { clicks.firstJob += 1; }, addEventListener() {}, focus() { focused.push('copy-first-job'); } };
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
  const fire = (key, target, shiftKey = false) => {
    keydown({
      key,
      target,
      defaultPrevented: false,
      altKey: false,
      ctrlKey: false,
      metaKey: false,
      shiftKey,
      preventDefault() {},
    });
  };
  const input = { tagName: 'INPUT', closest() { return input; } };
  const textarea = { tagName: 'TEXTAREA', closest() { return textarea; } };
  const body = { tagName: 'BODY', closest() { return null; } };
  fire('}', input, true);
  fire('}', textarea, true);
  assert.equal(clicks.lastJob, 0);
  assert.equal(clicks.firstJob, 0);
  assert.equal(clicks.jobs, 0);
  assert.deepEqual(focused, []);
  fire('}', body, true);
  assert.equal(clicks.lastJob, 1);
  assert.equal(clicks.firstJob, 0);
  assert.equal(clicks.jobs, 0);
  assert.deepEqual(focused, []);
  fire(';', body, false);
  assert.equal(clicks.firstJob, 1);
  assert.equal(clicks.lastJob, 1);
  fire('j', body, false);
  assert.equal(clicks.jobs, 1);
  assert.equal(clicks.lastJob, 1);
});

test('plus focuses Copy last job when focus is not in an input', () => {
  assert.match(html, /event\.key === '\+'/);
  assert.match(html, /getElementById\('copy-last-job'\) \|\| document\.getElementById\('workbenches-title'\) \|\| document\.getElementById\('workbenches'\)/);
  assert.match(html, /id="copy-last-job"/);
  assert.match(html, /id="workbenches-title"/);
  assert.match(html, /<kbd>\+<\/kbd><\/dt><dd>Focus the Copy last job control, or the workbenches heading if that control is missing. This key moves focus; it does not open a workbench. It does not copy./);
  assert.match(html, /Press <kbd>\+<\/kbd> to focus Copy last job/);
  assert.match(html, /This key moves focus; it does not open a workbench/);
  assert.match(html, /inEditable\(event\.target\)/);
  assert.match(readme, /Key `\+` focuses the Copy last job control/);
  assert.match(readme, /Press `\+` to focus the Copy last job control/);
  const focused = [];
  const clicks = { lastJob: 0, firstJob: 0, jobs: 0, how: 0 };
  const assigned = [];
  let keydown = null;
  const copyLastJob = { focus() { focused.push('copy-last-job'); }, click() { clicks.lastJob += 1; }, addEventListener() {} };
  const heading = { focus() { focused.push('workbenches-title'); } };
  const document = {
    getElementById(id) {
      if (id === 'copy-last-job') return copyLastJob;
      if (id === 'copy-first-job') return { focus() { focused.push('copy-first-job'); }, click() { clicks.firstJob += 1; }, addEventListener() {} };
      if (id === 'copy-jobs') return { click() { clicks.jobs += 1; }, addEventListener() {} };
      if (id === 'copy-how') return { focus() { focused.push('copy-how'); }, click() { clicks.how += 1; }, addEventListener() {} };
      if (id === 'workbenches-title') return heading;
      if (id === 'workbenches') return { focus() { focused.push('workbenches'); } };
      if (id === 'shortcuts') return { hidden: true };
      if (id === 'shortcuts-open') return { setAttribute() {}, addEventListener() {} };
      if (id === 'shortcuts-close') return { addEventListener() {} };
      if (id === 'skip-shortcuts') return { addEventListener() {} };
      return null;
    },
    querySelector(selector) {
      return selector === '#workbenches a.open' ? { focus() { focused.push('first-open'); } } : null;
    },
    querySelectorAll(selector) {
      return selector === '#workbenches a.open' ? [{ focus() { focused.push('last-open'); } }] : [];
    },
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
  const fire = (key, target, shiftKey = false) => {
    keydown({
      key,
      target,
      defaultPrevented: false,
      altKey: false,
      ctrlKey: false,
      metaKey: false,
      shiftKey,
      preventDefault() {},
    });
  };
  const input = { tagName: 'INPUT', closest() { return input; } };
  const textarea = { tagName: 'TEXTAREA', closest() { return textarea; } };
  const body = { tagName: 'BODY', closest() { return null; } };
  fire('+', input, true);
  fire('+', textarea, true);
  assert.deepEqual(focused, []);
  assert.equal(clicks.lastJob, 0);
  assert.equal(clicks.how, 0);
  assert.deepEqual(assigned, []);
  fire('+', body, true);
  assert.deepEqual(focused, ['copy-last-job']);
  assert.equal(clicks.lastJob, 0);
  assert.deepEqual(assigned, []);
  fire('s', body, false);
  assert.deepEqual(focused, ['copy-last-job', 'first-open']);
  fire(']', body, false);
  assert.deepEqual(focused, ['copy-last-job', 'first-open', 'last-open']);
  fire('=', body, false);
  assert.deepEqual(focused, ['copy-last-job', 'first-open', 'last-open', 'copy-how']);
  assert.equal(clicks.how, 0);
  assert.equal(clicks.lastJob, 0);
});

test('plus focuses the workbenches heading when Copy last job is missing', () => {
  const focused = [];
  const assigned = [];
  let keydown = null;
  const heading = { focus() { focused.push('workbenches-title'); } };
  const document = {
    getElementById(id) {
      if (id === 'copy-last-job') return null;
      if (id === 'workbenches-title') return heading;
      if (id === 'workbenches') return { focus() { focused.push('workbenches'); } };
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
  keydown({
    key: '+',
    target: { tagName: 'BODY', closest() { return null; } },
    defaultPrevented: false,
    altKey: false,
    ctrlKey: false,
    metaKey: false,
    shiftKey: true,
    preventDefault() {},
  });
  assert.deepEqual(focused, ['workbenches-title']);
  assert.deepEqual(assigned, []);
});

test('pipe focuses Copy first job when focus is not in an input', () => {
  assert.equal(html.includes("event.key === '|'"), true);
  assert.match(html, /getElementById\('copy-first-job'\) \|\| document\.getElementById\('workbenches-title'\) \|\| document\.getElementById\('workbenches'\)/);
  assert.match(html, /id="copy-first-job"/);
  assert.match(html, /id="workbenches-title"/);
  assert.match(html, /<kbd>\|<\/kbd><\/dt><dd>Focus the Copy first job control, or the workbenches heading if that control is missing. This key moves focus; it does not open a workbench. It does not copy./);
  assert.match(html, /Press <kbd>\|<\/kbd> to focus Copy first job/);
  assert.match(html, /This key moves focus; it does not open a workbench/);
  assert.match(html, /inEditable\(event\.target\)/);
  assert.match(readme, /Key `\|` focuses the Copy first job control/);
  assert.match(readme, /Press `\|` to focus the Copy first job control/);
  const focused = [];
  const clicks = { firstJob: 0, lastJob: 0 };
  const assigned = [];
  let keydown = null;
  const copyFirstJob = { focus() { focused.push('copy-first-job'); }, click() { clicks.firstJob += 1; }, addEventListener() {} };
  const heading = { focus() { focused.push('workbenches-title'); } };
  const document = {
    getElementById(id) {
      if (id === 'copy-first-job') return copyFirstJob;
      if (id === 'copy-last-job') return { focus() { focused.push('copy-last-job'); }, click() { clicks.lastJob += 1; }, addEventListener() {} };
      if (id === 'workbenches-title') return heading;
      if (id === 'workbenches') return { focus() { focused.push('workbenches'); } };
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
  const fire = (key, target, shiftKey = false) => {
    keydown({
      key,
      target,
      defaultPrevented: false,
      altKey: false,
      ctrlKey: false,
      metaKey: false,
      shiftKey,
      preventDefault() {},
    });
  };
  const input = { tagName: 'INPUT', closest() { return input; } };
  const textarea = { tagName: 'TEXTAREA', closest() { return textarea; } };
  const body = { tagName: 'BODY', closest() { return null; } };
  fire('|', input, true);
  fire('|', textarea, true);
  assert.deepEqual(focused, []);
  assert.equal(clicks.firstJob, 0);
  assert.equal(clicks.lastJob, 0);
  assert.deepEqual(assigned, []);
  fire('|', body, true);
  assert.deepEqual(focused, ['copy-first-job']);
  assert.equal(clicks.firstJob, 0);
  assert.deepEqual(assigned, []);
  fire(';', body, false);
  assert.equal(clicks.firstJob, 1);
  fire('}', body, true);
  assert.equal(clicks.lastJob, 1);
  assert.equal(clicks.firstJob, 1);
  assert.deepEqual(focused, ['copy-first-job']);
});

test('pipe focuses the workbenches heading when Copy first job is missing', () => {
  const focused = [];
  const assigned = [];
  let keydown = null;
  const heading = { focus() { focused.push('workbenches-title'); } };
  const document = {
    getElementById(id) {
      if (id === 'copy-first-job') return null;
      if (id === 'workbenches-title') return heading;
      if (id === 'workbenches') return { focus() { focused.push('workbenches'); } };
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
  keydown({
    key: '|',
    target: { tagName: 'BODY', closest() { return null; } },
    defaultPrevented: false,
    altKey: false,
    ctrlKey: false,
    metaKey: false,
    shiftKey: true,
    preventDefault() {},
  });
  assert.deepEqual(focused, ['workbenches-title']);
  assert.deepEqual(assigned, []);
});

test('keyboard close-brace plus pipe are ignored in inputs using the same inEditable helper as c', () => {
  assert.match(html, /const inEditable = \(node\) =>/);
  assert.match(html, /if \(inEditable\(event\.target\)\) return;/);
  assert.match(html, /event\.key === 'c'/);
  assert.match(html, /event\.key === '}'/);
  assert.match(html, /event\.key === '\+'/);
  assert.equal(html.includes("event.key === '|'"), true);
  const clicks = { lastJob: 0, firstJob: 0 };
  const focused = [];
  const assigned = [];
  let keydown = null;
  const document = {
    getElementById(id) {
      if (id === 'copy-last-job') return { click() { clicks.lastJob += 1; }, addEventListener() {}, focus() { focused.push('copy-last-job'); } };
      if (id === 'copy-first-job') return { click() { clicks.firstJob += 1; }, addEventListener() {}, focus() { focused.push('copy-first-job'); } };
      if (id === 'workbenches-title') return { focus() { focused.push('workbenches-title'); } };
      if (id === 'workbenches') return { focus() { focused.push('workbenches'); } };
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
  const fire = (key, target, shiftKey = false) => {
    keydown({
      key,
      target,
      defaultPrevented: false,
      altKey: false,
      ctrlKey: false,
      metaKey: false,
      shiftKey,
      preventDefault() {},
    });
  };
  const input = { tagName: 'INPUT', closest() { return input; } };
  const textarea = { tagName: 'TEXTAREA', closest() { return textarea; } };
  const select = { tagName: 'SELECT', closest() { return select; } };
  const body = { tagName: 'BODY', closest() { return null; } };
  for (const target of [input, textarea, select]) {
    fire('}', target, true);
    fire('+', target, true);
    fire('|', target, true);
    fire('c', target, false);
  }
  assert.deepEqual(focused, []);
  assert.equal(clicks.lastJob, 0);
  assert.equal(clicks.firstJob, 0);
  assert.deepEqual(assigned, []);
  fire('}', body, true);
  fire('+', body, true);
  fire('|', body, true);
  assert.deepEqual(focused, ['copy-last-job', 'copy-first-job']);
  assert.equal(clicks.lastJob, 1);
  assert.equal(clicks.firstJob, 0);
  assert.deepEqual(assigned, []);
});

test('close-brace plus pipe do not steal semicolon jobs last-How first-How or equals', () => {
  assert.match(html, /event\.key === '}'/);
  assert.match(html, /event\.key === '\+'/);
  assert.equal(html.includes("event.key === '|'"), true);
  assert.match(html, /event\.key === ';'/);
  assert.match(html, /event\.key === 'j'/);
  assert.match(html, /event\.key === '>'/);
  assert.match(html, /event\.key === '_'/);
  assert.match(html, /event\.key === '<'/);
  assert.match(html, /event\.key === '='/);
  assert.match(html, /event\.key === '-'/);
  assert.match(html, /lastJobBtn\?\.click\(\)/);
  assert.match(html, /firstJobBtn\?\.click\(\)/);
  assert.match(html, /jobsBtn\?\.click\(\)/);
  assert.match(html, /lastHowBtn\?\.click\(\)/);
  assert.match(html, /firstHowBtn\?\.click\(\)/);
  const clicks = { lastJob: 0, firstJob: 0, jobs: 0, lastHow: 0, firstHow: 0 };
  const focused = [];
  let keydown = null;
  const document = {
    getElementById(id) {
      if (id === 'copy-last-job') return { click() { clicks.lastJob += 1; }, addEventListener() {}, focus() { focused.push('copy-last-job'); } };
      if (id === 'copy-first-job') return { click() { clicks.firstJob += 1; }, addEventListener() {}, focus() { focused.push('copy-first-job'); } };
      if (id === 'copy-jobs') return { click() { clicks.jobs += 1; }, addEventListener() {} };
      if (id === 'copy-last-how') return { click() { clicks.lastHow += 1; }, addEventListener() {}, focus() { focused.push('copy-last-how'); } };
      if (id === 'copy-first-how') return { click() { clicks.firstHow += 1; }, addEventListener() {}, focus() { focused.push('copy-first-how'); } };
      if (id === 'copy-how') return { focus() { focused.push('copy-how'); }, addEventListener() {} };
      if (id === 'workbenches-title') return { focus() { focused.push('workbenches-title'); } };
      if (id === 'workbenches') return { focus() { focused.push('workbenches'); } };
      if (id === 'how-title') return { focus() { focused.push('how-title'); } };
      if (id === 'how-it-works') return { focus() { focused.push('how-it-works'); } };
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
  const fire = (key, shiftKey = false) => {
    keydown({
      key,
      target: { tagName: 'BODY', closest() { return null; } },
      defaultPrevented: false,
      altKey: false,
      ctrlKey: false,
      metaKey: false,
      shiftKey,
      preventDefault() {},
    });
  };
  fire(';');
  fire('j');
  fire('>');
  fire('_');
  fire('<');
  fire('=');
  fire('-');
  fire('}', true);
  fire('+', true);
  fire('|', true);
  assert.equal(clicks.firstJob, 1);
  assert.equal(clicks.jobs, 1);
  assert.equal(clicks.lastHow, 1);
  assert.equal(clicks.firstHow, 1);
  assert.equal(clicks.lastJob, 1);
  assert.deepEqual(focused, ['copy-last-how', 'copy-first-how', 'copy-how', 'copy-last-job', 'copy-first-job']);
});

test('copy last What\'s new heading control is distinct from Copy last job and Copy last How it works item', () => {
  assert.match(html, /id="copy-last-whats-new"/);
  assert.match(html, />Copy last What's new heading</);
  assert.match(html, /aria-keyshortcuts="~"/);
  assert.match(html, /id="copy-last-whats-new-fallback"/);
  assert.match(html, /class="copy-last-whats-new-fallback"/);
  assert.match(html, /textarea id="copy-last-whats-new-fallback"/);
  assert.match(html, /id="copy-last-job"/);
  assert.match(html, />Copy last job</);
  assert.match(html, /id="copy-last-how"/);
  assert.match(html, />Copy last How it works item</);
  assert.notEqual(html.match(/id="copy-last-whats-new"/)?.[0], html.match(/id="copy-last-job"/)?.[0]);
  assert.notEqual(html.match(/id="copy-last-whats-new"/)?.[0], html.match(/id="copy-last-how"/)?.[0]);
  assert.notEqual(html.match(/id="copy-last-whats-new"/)?.[0], html.match(/id="copy-last"/)?.[0]);
  assert.match(html, /@media print[\s\S]*\.copy-last-whats-new-tools/);
  assert.match(html, /@media print[\s\S]*\.copy-last-whats-new-fallback \{ display: none !important; \}/);
  assert.doesNotMatch(html, /hosted API/i);
});

test('copy last What\'s new heading markdown is the last #whats-new h3, or empty if missing', async () => {
  assert.match(html, /lastWhatsNewMarkdown/);
  assert.match(html, /querySelectorAll\('#whats-new h3'\)/);
  assert.match(html, /headings\[headings\.length - 1\]/);
  assert.match(html, /navigator\.clipboard\?\.writeText/);
  assert.match(html, /lastWhatsNewFallback\.hidden = false/);
  assert.match(html, /lastWhatsNewFallback\.select\(\)/);
  assert.match(html, /Not a live product feed/);
  assert.match(html, /This is the last What\\'s new heading, not a live product feed/);
  assert.match(html, /Copied an empty string/);
  let copied = '';
  let clickLast = null;
  let headings = [
    { textContent: 'Last-job copy, last-job jump, and first-job jump' },
    { textContent: 'Sunday late payout, payout-hour copy, and payout-closed hide in Weekend Gap 1.5.11' },
  ];
  const document = {
    getElementById(id) {
      if (id === 'copy-last-whats-new') return { addEventListener(name, handler) { if (name === 'click') clickLast = handler; } };
      if (id === 'copy-last-whats-new-status') return { textContent: '' };
      if (id === 'copy-last-whats-new-fallback') return { hidden: true, value: '', focus() {}, select() {} };
      return null;
    },
    querySelector: () => null,
    querySelectorAll(selector) {
      return selector === '#whats-new h3' ? headings : [];
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
  await clickLast();
  assert.equal(copied, '- Sunday late payout, payout-hour copy, and payout-closed hide in Weekend Gap 1.5.11');
  assert.doesNotMatch(copied, /\n/);
  assert.doesNotMatch(copied, /Last-job copy/);
  assert.doesNotMatch(copied, /live product feed/);
  headings = [];
  copied = 'stale';
  await clickLast();
  assert.equal(copied, '');
});

test('copy last What\'s new heading shows a visible textarea when clipboard is unavailable', async () => {
  let clickLast = null;
  const fallback = { hidden: true, value: '', focused: false, selected: false, focus() { this.focused = true; }, select() { this.selected = true; } };
  const status = { textContent: '' };
  const document = {
    getElementById(id) {
      if (id === 'copy-last-whats-new') return { addEventListener(name, handler) { if (name === 'click') clickLast = handler; } };
      if (id === 'copy-last-whats-new-status') return status;
      if (id === 'copy-last-whats-new-fallback') return fallback;
      return null;
    },
    querySelector: () => null,
    querySelectorAll(selector) {
      return selector === '#whats-new h3' ? [{ textContent: 'Sunday late payout, payout-hour copy, and payout-closed hide in Weekend Gap 1.5.11' }] : [];
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
  await clickLast();
  assert.equal(fallback.hidden, false);
  assert.equal(fallback.focused, true);
  assert.equal(fallback.selected, true);
  assert.equal(fallback.value, '- Sunday late payout, payout-hour copy, and payout-closed hide in Weekend Gap 1.5.11');
  assert.match(status.textContent, /Clipboard unavailable/);
  assert.match(status.textContent, /not a live product feed/);
});

test('print CSS hides copy last What\'s new heading tools and keeps How it works and versions', () => {
  const print = html.match(/@media print \{([\s\S]*)\}\s*<\/style>/)?.[1] ?? '';
  assert.match(print, /\.copy-last-whats-new-tools, \.copy-last-whats-new-fallback \{ display: none !important; \}/);
  assert.match(print, /\.copy-last-job-tools, \.copy-last-job-fallback \{ display: none !important; \}/);
  assert.match(print, /#how-it-works, \.guide \{ display: block !important; \}/);
  assert.match(print, /\.whats-new, \.workbench \.version, \.version-line, \.trust \{ display: block !important; \}/);
});

test('keyboard tilde copies the last What\'s new heading through its own control', () => {
  assert.match(html, /event\.key === '~'/);
  assert.match(html, /lastWhatsNewBtn\?\.click\(\)/);
  assert.match(html, /inEditable\(event\.target\)/);
  assert.match(html, /aria-keyshortcuts="~"/);
  assert.match(html, /<kbd>~<\/kbd><\/dt><dd>Copy the last What's new heading as one Markdown line from this catalog page, not a live product feed/);
  assert.match(html, /Press <kbd>~<\/kbd> to copy the last What's new heading/);
  assert.match(html, /If that heading is missing, this copies an empty string/);
  assert.match(html, /This is distinct from <kbd>g<\/kbd>, which focuses the first What's new heading/);
  assert.match(html, /from <kbd>n<\/kbd>, which focuses What's new/);
  assert.match(readme, /Press `~` to copy the last What's new heading/);
  assert.match(readme, /Key `~` copies the last What's new heading/);
  const clicks = { lastNews: 0, lastJob: 0, lastHow: 0 };
  const focused = [];
  const assigned = [];
  let keydown = null;
  const document = {
    getElementById(id) {
      if (id === 'copy-last-whats-new') return { click() { clicks.lastNews += 1; }, addEventListener() {}, focus() { focused.push('copy-last-whats-new'); } };
      if (id === 'copy-last-job') return { click() { clicks.lastJob += 1; }, addEventListener() {}, focus() { focused.push('copy-last-job'); } };
      if (id === 'copy-last-how') return { click() { clicks.lastHow += 1; }, addEventListener() {}, focus() { focused.push('copy-last-how'); } };
      if (id === 'whats-new') return { focus() { focused.push('whats-new'); } };
      if (id === 'whats-new-title') return { focus() { focused.push('whats-new-title'); } };
      if (id === 'shortcuts') return { hidden: true };
      if (id === 'shortcuts-open') return { setAttribute() {}, addEventListener() {} };
      if (id === 'shortcuts-close') return { addEventListener() {} };
      if (id === 'skip-shortcuts') return { addEventListener() {} };
      return null;
    },
    querySelector(selector) {
      return selector === '#whats-new h3' ? { focus() { focused.push('first-news-h3'); } } : null;
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
  const fire = (key, target, shiftKey = false) => {
    keydown({
      key,
      target,
      defaultPrevented: false,
      altKey: false,
      ctrlKey: false,
      metaKey: false,
      shiftKey,
      preventDefault() {},
    });
  };
  const input = { tagName: 'INPUT', closest() { return input; } };
  const textarea = { tagName: 'TEXTAREA', closest() { return textarea; } };
  const body = { tagName: 'BODY', closest() { return null; } };
  fire('~', input, true);
  fire('~', textarea, true);
  assert.equal(clicks.lastNews, 0);
  assert.equal(clicks.lastJob, 0);
  assert.equal(clicks.lastHow, 0);
  assert.deepEqual(focused, []);
  assert.deepEqual(assigned, []);
  fire('~', body, true);
  assert.equal(clicks.lastNews, 1);
  assert.equal(clicks.lastJob, 0);
  assert.equal(clicks.lastHow, 0);
  assert.deepEqual(focused, []);
  assert.deepEqual(assigned, []);
  fire('g', body, false);
  assert.deepEqual(focused, ['first-news-h3']);
  assert.equal(clicks.lastNews, 1);
  fire('n', body, false);
  assert.deepEqual(focused, ['first-news-h3', 'whats-new']);
  assert.equal(clicks.lastNews, 1);
  assert.deepEqual(assigned, []);
});

test('exclamation focuses Copy last What\'s new heading when focus is not in an input', () => {
  assert.match(html, /event\.key === '!'/);
  assert.match(html, /getElementById\('copy-last-whats-new'\) \|\| document\.getElementById\('whats-new-title'\) \|\| document\.getElementById\('whats-new'\)/);
  assert.match(html, /id="copy-last-whats-new"/);
  assert.match(html, /id="whats-new-title"/);
  assert.match(html, /<kbd>!<\/kbd><\/dt><dd>Focus the Copy last What's new heading control, or the What's new heading if that control is missing. This key moves focus; it does not open a workbench. It does not copy./);
  assert.match(html, /Press <kbd>!<\/kbd> to focus Copy last What's new heading/);
  assert.match(html, /This key moves focus; it does not open a workbench/);
  assert.match(html, /inEditable\(event\.target\)/);
  assert.match(readme, /Key `!` focuses the Copy last What's new heading control/);
  assert.match(readme, /Press `!` to focus the Copy last What's new heading control/);
  const focused = [];
  const clicks = { lastNews: 0 };
  const assigned = [];
  let keydown = null;
  const copyLastNews = { focus() { focused.push('copy-last-whats-new'); }, click() { clicks.lastNews += 1; }, addEventListener() {} };
  const heading = { focus() { focused.push('whats-new-title'); } };
  const document = {
    getElementById(id) {
      if (id === 'copy-last-whats-new') return copyLastNews;
      if (id === 'whats-new-title') return heading;
      if (id === 'whats-new') return { focus() { focused.push('whats-new'); } };
      if (id === 'shortcuts') return { hidden: true };
      if (id === 'shortcuts-open') return { setAttribute() {}, addEventListener() {} };
      if (id === 'shortcuts-close') return { addEventListener() {} };
      if (id === 'skip-shortcuts') return { addEventListener() {} };
      return null;
    },
    querySelector(selector) {
      return selector === '#whats-new h3' ? { focus() { focused.push('first-news-h3'); } } : null;
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
  const fire = (key, target, shiftKey = false) => {
    keydown({
      key,
      target,
      defaultPrevented: false,
      altKey: false,
      ctrlKey: false,
      metaKey: false,
      shiftKey,
      preventDefault() {},
    });
  };
  const input = { tagName: 'INPUT', closest() { return input; } };
  const textarea = { tagName: 'TEXTAREA', closest() { return textarea; } };
  const body = { tagName: 'BODY', closest() { return null; } };
  fire('!', input, true);
  fire('!', textarea, true);
  assert.deepEqual(focused, []);
  assert.equal(clicks.lastNews, 0);
  assert.deepEqual(assigned, []);
  fire('!', body, true);
  assert.deepEqual(focused, ['copy-last-whats-new']);
  assert.equal(clicks.lastNews, 0);
  assert.deepEqual(assigned, []);
  fire('g', body, false);
  assert.deepEqual(focused, ['copy-last-whats-new', 'first-news-h3']);
  fire('n', body, false);
  assert.deepEqual(focused, ['copy-last-whats-new', 'first-news-h3', 'whats-new']);
  fire('~', body, true);
  assert.equal(clicks.lastNews, 1);
  assert.deepEqual(focused, ['copy-last-whats-new', 'first-news-h3', 'whats-new']);
  assert.deepEqual(assigned, []);
});

test('exclamation focuses the What\'s new heading when Copy last What\'s new heading is missing', () => {
  const focused = [];
  const assigned = [];
  let keydown = null;
  const heading = { focus() { focused.push('whats-new-title'); } };
  const document = {
    getElementById(id) {
      if (id === 'copy-last-whats-new') return null;
      if (id === 'whats-new-title') return heading;
      if (id === 'whats-new') return { focus() { focused.push('whats-new'); } };
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
  keydown({
    key: '!',
    target: { tagName: 'BODY', closest() { return null; } },
    defaultPrevented: false,
    altKey: false,
    ctrlKey: false,
    metaKey: false,
    shiftKey: true,
    preventDefault() {},
  });
  assert.deepEqual(focused, ['whats-new-title']);
  assert.deepEqual(assigned, []);
});

test('copy first What\'s new heading control is distinct from Copy last What\'s new heading and from g', () => {
  assert.match(html, /id="copy-first-whats-new"/);
  assert.match(html, />Copy first What's new heading</);
  assert.match(html, /id="copy-first-whats-new-fallback"/);
  assert.match(html, /class="copy-first-whats-new-fallback"/);
  assert.match(html, /textarea id="copy-first-whats-new-fallback"/);
  assert.match(html, /id="copy-last-whats-new"/);
  assert.match(html, />Copy last What's new heading</);
  assert.match(html, /event\.key === 'g'/);
  assert.match(html, /querySelector\('#whats-new h3'\)/);
  assert.notEqual(html.match(/id="copy-first-whats-new"/)?.[0], html.match(/id="copy-last-whats-new"/)?.[0]);
  assert.notEqual(html.match(/id="copy-first-whats-new"/)?.[0], html.match(/id="copy-first-job"/)?.[0]);
  assert.match(html, /@media print[\s\S]*\.copy-first-whats-new-tools/);
  assert.match(html, /@media print[\s\S]*\.copy-first-whats-new-fallback \{ display: none !important; \}/);
  assert.doesNotMatch(html, /hosted API/i);
});

test('copy first What\'s new heading markdown is the first #whats-new h3, or empty if missing', async () => {
  assert.match(html, /firstWhatsNewMarkdown/);
  assert.match(html, /querySelector\('#whats-new h3'\)/);
  assert.match(html, /firstWhatsNewFallback\.hidden = false/);
  assert.match(html, /firstWhatsNewFallback\.select\(\)/);
  assert.match(html, /This is the first What\\'s new heading, not a live product feed/);
  assert.match(html, /Copied an empty string/);
  let copied = '';
  let clickFirst = null;
  let firstHeading = { textContent: 'Last-job copy, last-job jump, and first-job jump' };
  const document = {
    getElementById(id) {
      if (id === 'copy-first-whats-new') return { addEventListener(name, handler) { if (name === 'click') clickFirst = handler; } };
      if (id === 'copy-first-whats-new-status') return { textContent: '' };
      if (id === 'copy-first-whats-new-fallback') return { hidden: true, value: '', focus() {}, select() {} };
      return null;
    },
    querySelector(selector) {
      return selector === '#whats-new h3' ? firstHeading : null;
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
  await clickFirst();
  assert.equal(copied, '- Last-job copy, last-job jump, and first-job jump');
  assert.doesNotMatch(copied, /\n/);
  assert.doesNotMatch(copied, /Sunday late payout/);
  assert.doesNotMatch(copied, /live product feed/);
  firstHeading = null;
  copied = 'stale';
  await clickFirst();
  assert.equal(copied, '');
});

test('copy first What\'s new heading shows a visible textarea when clipboard is unavailable', async () => {
  let clickFirst = null;
  const fallback = { hidden: true, value: '', focused: false, selected: false, focus() { this.focused = true; }, select() { this.selected = true; } };
  const status = { textContent: '' };
  const document = {
    getElementById(id) {
      if (id === 'copy-first-whats-new') return { addEventListener(name, handler) { if (name === 'click') clickFirst = handler; } };
      if (id === 'copy-first-whats-new-status') return status;
      if (id === 'copy-first-whats-new-fallback') return fallback;
      return null;
    },
    querySelector(selector) {
      return selector === '#whats-new h3' ? { textContent: 'Last-job copy, last-job jump, and first-job jump' } : null;
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
  await clickFirst();
  assert.equal(fallback.hidden, false);
  assert.equal(fallback.focused, true);
  assert.equal(fallback.selected, true);
  assert.equal(fallback.value, '- Last-job copy, last-job jump, and first-job jump');
  assert.match(status.textContent, /Clipboard unavailable/);
  assert.match(status.textContent, /not a live product feed/);
});

test('open-paren focuses Copy first What\'s new heading when focus is not in an input', () => {
  assert.match(html, /event\.key === '\('/);
  assert.match(html, /getElementById\('copy-first-whats-new'\) \|\| document\.getElementById\('whats-new-title'\) \|\| document\.getElementById\('whats-new'\)/);
  assert.match(html, /id="copy-first-whats-new"/);
  assert.match(html, /id="whats-new-title"/);
  assert.match(html, /<kbd>\(<\/kbd><\/dt><dd>Focus the Copy first What's new heading control, or the What's new heading if that control is missing. This key moves focus; it does not open a workbench. It does not copy./);
  assert.match(html, /Press <kbd>\(<\/kbd> to focus Copy first What's new heading/);
  assert.match(html, /This is distinct from <kbd>g<\/kbd>, which focuses the first What's new heading itself/);
  assert.match(html, /inEditable\(event\.target\)/);
  assert.match(readme, /Key `\(` focuses the Copy first What's new heading control/);
  assert.match(readme, /Press `\(` to focus the Copy first What's new heading control/);
  const focused = [];
  const clicks = { firstNews: 0, lastNews: 0 };
  const assigned = [];
  let keydown = null;
  const copyFirstNews = { focus() { focused.push('copy-first-whats-new'); }, click() { clicks.firstNews += 1; }, addEventListener() {} };
  const heading = { focus() { focused.push('whats-new-title'); } };
  const document = {
    getElementById(id) {
      if (id === 'copy-first-whats-new') return copyFirstNews;
      if (id === 'copy-last-whats-new') return { focus() { focused.push('copy-last-whats-new'); }, click() { clicks.lastNews += 1; }, addEventListener() {} };
      if (id === 'whats-new-title') return heading;
      if (id === 'whats-new') return { focus() { focused.push('whats-new'); } };
      if (id === 'shortcuts') return { hidden: true };
      if (id === 'shortcuts-open') return { setAttribute() {}, addEventListener() {} };
      if (id === 'shortcuts-close') return { addEventListener() {} };
      if (id === 'skip-shortcuts') return { addEventListener() {} };
      return null;
    },
    querySelector(selector) {
      return selector === '#whats-new h3' ? { focus() { focused.push('first-news-h3'); } } : null;
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
  const fire = (key, target, shiftKey = false) => {
    keydown({
      key,
      target,
      defaultPrevented: false,
      altKey: false,
      ctrlKey: false,
      metaKey: false,
      shiftKey,
      preventDefault() {},
    });
  };
  const input = { tagName: 'INPUT', closest() { return input; } };
  const textarea = { tagName: 'TEXTAREA', closest() { return textarea; } };
  const body = { tagName: 'BODY', closest() { return null; } };
  fire('(', input, true);
  fire('(', textarea, true);
  assert.deepEqual(focused, []);
  assert.equal(clicks.firstNews, 0);
  assert.deepEqual(assigned, []);
  fire('(', body, true);
  assert.deepEqual(focused, ['copy-first-whats-new']);
  assert.equal(clicks.firstNews, 0);
  assert.deepEqual(assigned, []);
  fire('g', body, false);
  assert.deepEqual(focused, ['copy-first-whats-new', 'first-news-h3']);
  assert.equal(clicks.firstNews, 0);
  fire('~', body, true);
  assert.equal(clicks.lastNews, 1);
  assert.equal(clicks.firstNews, 0);
  assert.deepEqual(focused, ['copy-first-whats-new', 'first-news-h3']);
  assert.deepEqual(assigned, []);
});

test('open-paren focuses the What\'s new heading when Copy first What\'s new heading is missing', () => {
  const focused = [];
  const assigned = [];
  let keydown = null;
  const heading = { focus() { focused.push('whats-new-title'); } };
  const document = {
    getElementById(id) {
      if (id === 'copy-first-whats-new') return null;
      if (id === 'whats-new-title') return heading;
      if (id === 'whats-new') return { focus() { focused.push('whats-new'); } };
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
  keydown({
    key: '(',
    target: { tagName: 'BODY', closest() { return null; } },
    defaultPrevented: false,
    altKey: false,
    ctrlKey: false,
    metaKey: false,
    shiftKey: true,
    preventDefault() {},
  });
  assert.deepEqual(focused, ['whats-new-title']);
  assert.deepEqual(assigned, []);
});

test('tilde exclamation and open-paren do not steal g n close-brace or last-How', () => {
  assert.match(html, /event\.key === '~'/);
  assert.match(html, /event\.key === '!'/);
  assert.match(html, /event\.key === '\('/);
  assert.match(html, /event\.key === 'g'/);
  assert.match(html, /event\.key === 'n'/);
  assert.match(html, /event\.key === '}'/);
  assert.match(html, /event\.key === '<'/);
  assert.match(html, /lastWhatsNewBtn\?\.click\(\)/);
  assert.match(html, /lastJobBtn\?\.click\(\)/);
  assert.match(html, /lastHowBtn\?\.click\(\)/);
  const clicks = { lastNews: 0, firstNews: 0, lastJob: 0, lastHow: 0 };
  const focused = [];
  const assigned = [];
  let keydown = null;
  const document = {
    getElementById(id) {
      if (id === 'copy-last-whats-new') return { click() { clicks.lastNews += 1; }, addEventListener() {}, focus() { focused.push('copy-last-whats-new'); } };
      if (id === 'copy-first-whats-new') return { click() { clicks.firstNews += 1; }, addEventListener() {}, focus() { focused.push('copy-first-whats-new'); } };
      if (id === 'copy-last-job') return { click() { clicks.lastJob += 1; }, addEventListener() {}, focus() { focused.push('copy-last-job'); } };
      if (id === 'copy-last-how') return { click() { clicks.lastHow += 1; }, addEventListener() {}, focus() { focused.push('copy-last-how'); } };
      if (id === 'whats-new') return { focus() { focused.push('whats-new'); } };
      if (id === 'whats-new-title') return { focus() { focused.push('whats-new-title'); } };
      if (id === 'shortcuts') return { hidden: true };
      if (id === 'shortcuts-open') return { setAttribute() {}, addEventListener() {} };
      if (id === 'shortcuts-close') return { addEventListener() {} };
      if (id === 'skip-shortcuts') return { addEventListener() {} };
      return null;
    },
    querySelector(selector) {
      return selector === '#whats-new h3' ? { focus() { focused.push('first-news-h3'); } } : null;
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
  const fire = (key, shiftKey = false) => {
    keydown({
      key,
      target: { tagName: 'BODY', closest() { return null; } },
      defaultPrevented: false,
      altKey: false,
      ctrlKey: false,
      metaKey: false,
      shiftKey,
      preventDefault() {},
    });
  };
  fire('g');
  fire('n');
  fire('}', true);
  fire('<');
  fire('~', true);
  fire('!', true);
  fire('(', true);
  assert.equal(clicks.lastJob, 1);
  assert.equal(clicks.lastHow, 1);
  assert.equal(clicks.lastNews, 1);
  assert.equal(clicks.firstNews, 0);
  assert.deepEqual(focused, ['first-news-h3', 'whats-new', 'copy-last-whats-new', 'copy-first-whats-new']);
  assert.deepEqual(assigned, []);
});

test('keyboard close-paren copies the first What\'s new heading through its own control', () => {
  assert.match(html, /event\.key === '\)'/);
  assert.match(html, /firstWhatsNewBtn\?\.click\(\)/);
  assert.match(html, /inEditable\(event\.target\)/);
  assert.match(html, /aria-keyshortcuts="\)"/);
  assert.match(html, /<kbd>\)<\/kbd><\/dt><dd>Copy the first What's new heading as one Markdown line from this catalog page, not a live product feed/);
  assert.match(html, /Press <kbd>\)<\/kbd> to copy the first What's new heading/);
  assert.match(html, /If that heading is missing, this copies an empty string/);
  assert.match(html, /This is distinct from <kbd>~<\/kbd>, which copies the last What's new heading/);
  assert.match(html, /from <kbd>g<\/kbd>, which focuses the first What's new heading/);
  assert.match(html, /from <kbd>\(<\/kbd>, which focuses Copy first What's new heading/);
  assert.match(readme, /Press `\)` to copy the first What's new heading/);
  assert.match(readme, /Key `\)` copies the first What's new heading/);
  const clicks = { firstNews: 0, lastNews: 0 };
  const focused = [];
  const assigned = [];
  let keydown = null;
  const document = {
    getElementById(id) {
      if (id === 'copy-first-whats-new') return { click() { clicks.firstNews += 1; }, addEventListener() {}, focus() { focused.push('copy-first-whats-new'); } };
      if (id === 'copy-last-whats-new') return { click() { clicks.lastNews += 1; }, addEventListener() {}, focus() { focused.push('copy-last-whats-new'); } };
      if (id === 'whats-new') return { focus() { focused.push('whats-new'); } };
      if (id === 'whats-new-title') return { focus() { focused.push('whats-new-title'); } };
      if (id === 'shortcuts') return { hidden: true };
      if (id === 'shortcuts-open') return { setAttribute() {}, addEventListener() {} };
      if (id === 'shortcuts-close') return { addEventListener() {} };
      if (id === 'skip-shortcuts') return { addEventListener() {} };
      return null;
    },
    querySelector(selector) {
      return selector === '#whats-new h3' ? { focus() { focused.push('first-news-h3'); } } : null;
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
  const fire = (key, target, shiftKey = false) => {
    keydown({
      key,
      target,
      defaultPrevented: false,
      altKey: false,
      ctrlKey: false,
      metaKey: false,
      shiftKey,
      preventDefault() {},
    });
  };
  const input = { tagName: 'INPUT', closest() { return input; } };
  const textarea = { tagName: 'TEXTAREA', closest() { return textarea; } };
  const select = { tagName: 'SELECT', closest() { return select; } };
  const body = { tagName: 'BODY', closest() { return null; } };
  fire(')', input, true);
  fire(')', textarea, true);
  fire(')', select, true);
  assert.equal(clicks.firstNews, 0);
  assert.equal(clicks.lastNews, 0);
  assert.deepEqual(focused, []);
  assert.deepEqual(assigned, []);
  fire(')', body, true);
  assert.equal(clicks.firstNews, 1);
  assert.equal(clicks.lastNews, 0);
  assert.deepEqual(focused, []);
  assert.deepEqual(assigned, []);
  fire('~', body, true);
  assert.equal(clicks.lastNews, 1);
  assert.equal(clicks.firstNews, 1);
  fire('g', body, false);
  assert.deepEqual(focused, ['first-news-h3']);
  assert.equal(clicks.firstNews, 1);
  fire('(', body, true);
  assert.deepEqual(focused, ['first-news-h3', 'copy-first-whats-new']);
  assert.equal(clicks.firstNews, 1);
  assert.equal(clicks.lastNews, 1);
  assert.deepEqual(assigned, []);
});

test('close-paren at and hash stay distinct from tilde open-paren e z g n', () => {
  assert.match(html, /event\.key === '\)'/);
  assert.match(html, /event\.key === '@'/);
  assert.match(html, /event\.key === '#'/);
  assert.match(html, /event\.key === '~'/);
  assert.match(html, /event\.key === '\('/);
  assert.match(html, /event\.key === 'e'/);
  assert.match(html, /event\.key === 'z'/);
  assert.match(html, /event\.key === 'g'/);
  assert.match(html, /event\.key === 'n'/);
  assert.match(html, /firstWhatsNewBtn\?\.click\(\)/);
  assert.match(html, /lastWhatsNewBtn\?\.click\(\)/);
  assert.match(html, /ledeBtn\?\.click\(\)/);
  assert.match(html, /skipsBtn\?\.click\(\)/);
  const clicks = { firstNews: 0, lastNews: 0, lede: 0, skips: 0 };
  const focused = [];
  const assigned = [];
  let keydown = null;
  const document = {
    getElementById(id) {
      if (id === 'copy-first-whats-new') return { click() { clicks.firstNews += 1; }, addEventListener() {}, focus() { focused.push('copy-first-whats-new'); } };
      if (id === 'copy-last-whats-new') return { click() { clicks.lastNews += 1; }, addEventListener() {}, focus() { focused.push('copy-last-whats-new'); } };
      if (id === 'copy-lede') return { click() { clicks.lede += 1; }, addEventListener() {}, focus() { focused.push('copy-lede'); } };
      if (id === 'copy-skips') return { click() { clicks.skips += 1; }, addEventListener() {}, focus() { focused.push('copy-skips'); } };
      if (id === 'whats-new') return { focus() { focused.push('whats-new'); } };
      if (id === 'whats-new-title') return { focus() { focused.push('whats-new-title'); } };
      if (id === 'catalog-heading') return { focus() { focused.push('catalog-heading'); } };
      if (id === 'skips') return { focus() { focused.push('skips'); } };
      if (id === 'shortcuts') return { hidden: true };
      if (id === 'shortcuts-open') return { setAttribute() {}, addEventListener() {} };
      if (id === 'shortcuts-close') return { addEventListener() {} };
      if (id === 'skip-shortcuts') return { addEventListener() {} };
      return null;
    },
    querySelector(selector) {
      return selector === '#whats-new h3' ? { focus() { focused.push('first-news-h3'); } } : null;
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
  const fire = (key, shiftKey = false) => {
    keydown({
      key,
      target: { tagName: 'BODY', closest() { return null; } },
      defaultPrevented: false,
      altKey: false,
      ctrlKey: false,
      metaKey: false,
      shiftKey,
      preventDefault() {},
    });
  };
  fire(')', true);
  fire('@', true);
  fire('#', true);
  fire('~', true);
  fire('(', true);
  fire('e');
  fire('z');
  fire('g');
  fire('n');
  assert.equal(clicks.firstNews, 1);
  assert.equal(clicks.lastNews, 1);
  assert.equal(clicks.lede, 1);
  assert.equal(clicks.skips, 1);
  assert.deepEqual(focused, ['copy-lede', 'copy-skips', 'copy-first-whats-new', 'first-news-h3', 'whats-new']);
  assert.deepEqual(assigned, []);
});

test('copy first workbench heading control is distinct from Copy first job and Copy first What\'s new heading', () => {
  assert.match(html, /id="copy-first-workbench"/);
  assert.match(html, />Copy first workbench heading</);
  assert.match(html, /id="copy-first-workbench-fallback"/);
  assert.match(html, /class="copy-first-workbench-fallback"/);
  assert.match(html, /textarea id="copy-first-workbench-fallback"/);
  assert.match(html, /id="copy-first-job"/);
  assert.match(html, />Copy first job</);
  assert.match(html, /id="copy-first-whats-new"/);
  assert.match(html, />Copy first What's new heading</);
  assert.match(html, /querySelector\('#workbenches article\.workbench h3'\)/);
  assert.notEqual(html.match(/id="copy-first-workbench"/)?.[0], html.match(/id="copy-first-job"/)?.[0]);
  assert.notEqual(html.match(/id="copy-first-workbench"/)?.[0], html.match(/id="copy-first-whats-new"/)?.[0]);
  assert.match(html, /@media print[\s\S]*\.copy-first-workbench-tools/);
  assert.match(html, /@media print[\s\S]*\.copy-first-workbench-fallback \{ display: none !important; \}/);
  assert.doesNotMatch(html, /hosted API/i);
});

test('copy first workbench heading markdown is the first #workbenches article.workbench h3, or empty if missing', async () => {
  assert.match(html, /firstWorkbenchMarkdown/);
  assert.match(html, /querySelector\('#workbenches article\.workbench h3'\)/);
  assert.match(html, /firstWorkbenchFallback\.hidden = false/);
  assert.match(html, /firstWorkbenchFallback\.select\(\)/);
  assert.match(html, /This is the first workbench heading, not a live product feed/);
  assert.match(html, /Copied an empty string/);
  let copied = '';
  let clickFirst = null;
  let firstHeading = { textContent: 'Partnership Breakpoint' };
  const document = {
    getElementById(id) {
      if (id === 'copy-first-workbench') return { addEventListener(name, handler) { if (name === 'click') clickFirst = handler; } };
      if (id === 'copy-first-workbench-status') return { textContent: '' };
      if (id === 'copy-first-workbench-fallback') return { hidden: true, value: '', focus() {}, select() {} };
      return null;
    },
    querySelector(selector) {
      return selector === '#workbenches article.workbench h3' ? firstHeading : null;
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
  await clickFirst();
  assert.equal(copied, '- Partnership Breakpoint');
  assert.doesNotMatch(copied, /\n/);
  assert.doesNotMatch(copied, /Common Cart/);
  assert.doesNotMatch(copied, /live product feed/);
  firstHeading = null;
  copied = 'stale';
  await clickFirst();
  assert.equal(copied, '');
});

test('copy first workbench heading shows a visible textarea when clipboard is unavailable', async () => {
  let clickFirst = null;
  const fallback = { hidden: true, value: '', focused: false, selected: false, focus() { this.focused = true; }, select() { this.selected = true; } };
  const status = { textContent: '' };
  const document = {
    getElementById(id) {
      if (id === 'copy-first-workbench') return { addEventListener(name, handler) { if (name === 'click') clickFirst = handler; } };
      if (id === 'copy-first-workbench-status') return status;
      if (id === 'copy-first-workbench-fallback') return fallback;
      return null;
    },
    querySelector(selector) {
      return selector === '#workbenches article.workbench h3' ? { textContent: 'Partnership Breakpoint' } : null;
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
  await clickFirst();
  assert.equal(fallback.hidden, false);
  assert.equal(fallback.focused, true);
  assert.equal(fallback.selected, true);
  assert.equal(fallback.value, '- Partnership Breakpoint');
  assert.match(status.textContent, /Clipboard unavailable/);
  assert.match(status.textContent, /not a live product feed/);
});

test('keyboard asterisk copies the first workbench heading through its own control', () => {
  assert.match(html, /event\.key === '\*'/);
  assert.match(html, /firstWorkbenchBtn\?\.click\(\)/);
  assert.match(html, /inEditable\(event\.target\)/);
  assert.match(html, /aria-keyshortcuts="\*"/);
  assert.match(html, /<kbd>\*<\/kbd><\/dt><dd>Copy the first workbench heading as one Markdown line from this catalog page, not a live product feed/);
  assert.match(html, /Press <kbd>\*<\/kbd> to copy the first workbench heading/);
  assert.match(html, /If that heading is missing, this copies an empty string/);
  assert.match(html, /This is distinct from <kbd>~<\/kbd>, which copies the last What's new heading/);
  assert.match(html, /from <kbd>\)<\/kbd>, which copies the first What's new heading/);
  assert.match(html, /from <kbd>e<\/kbd>, which copies the catalog heading and lede/);
  assert.match(html, /from <kbd>j<\/kbd>, which copies catalog jobs/);
  const clicks = { firstWorkbench: 0, firstNews: 0, lastNews: 0, lede: 0, jobs: 0 };
  const focused = [];
  const assigned = [];
  let keydown = null;
  const document = {
    getElementById(id) {
      if (id === 'copy-first-workbench') return { click() { clicks.firstWorkbench += 1; }, addEventListener() {}, focus() { focused.push('copy-first-workbench'); } };
      if (id === 'copy-first-whats-new') return { click() { clicks.firstNews += 1; }, addEventListener() {}, focus() { focused.push('copy-first-whats-new'); } };
      if (id === 'copy-last-whats-new') return { click() { clicks.lastNews += 1; }, addEventListener() {}, focus() { focused.push('copy-last-whats-new'); } };
      if (id === 'copy-lede') return { click() { clicks.lede += 1; }, addEventListener() {}, focus() { focused.push('copy-lede'); } };
      if (id === 'copy-jobs') return { click() { clicks.jobs += 1; }, addEventListener() {}, focus() { focused.push('copy-jobs'); } };
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
  const fire = (key, target, shiftKey = false) => {
    keydown({
      key,
      target,
      defaultPrevented: false,
      altKey: false,
      ctrlKey: false,
      metaKey: false,
      shiftKey,
      preventDefault() {},
    });
  };
  const input = { tagName: 'INPUT', closest() { return input; } };
  const textarea = { tagName: 'TEXTAREA', closest() { return textarea; } };
  const select = { tagName: 'SELECT', closest() { return select; } };
  const body = { tagName: 'BODY', closest() { return null; } };
  fire('*', input, true);
  fire('*', textarea, true);
  fire('*', select, true);
  assert.equal(clicks.firstWorkbench, 0);
  assert.equal(clicks.firstNews, 0);
  assert.deepEqual(focused, []);
  assert.deepEqual(assigned, []);
  fire('*', body, true);
  assert.equal(clicks.firstWorkbench, 1);
  assert.equal(clicks.firstNews, 0);
  assert.equal(clicks.lastNews, 0);
  assert.equal(clicks.lede, 0);
  assert.equal(clicks.jobs, 0);
  assert.deepEqual(focused, []);
  assert.deepEqual(assigned, []);
  fire(')', body, true);
  fire('~', body, true);
  fire('e', body, false);
  fire('j', body, false);
  assert.equal(clicks.firstNews, 1);
  assert.equal(clicks.lastNews, 1);
  assert.equal(clicks.lede, 1);
  assert.equal(clicks.jobs, 1);
  assert.equal(clicks.firstWorkbench, 1);
  assert.deepEqual(assigned, []);
});

test('ampersand focuses Copy first workbench heading when focus is not in an input', () => {
  assert.match(html, /event\.key === '&'/);
  assert.match(html, /getElementById\('copy-first-workbench'\) \|\| document\.getElementById\('workbenches-title'\) \|\| document\.getElementById\('workbenches'\)/);
  assert.match(html, /id="copy-first-workbench"/);
  assert.match(html, /id="workbenches-title"/);
  assert.match(html, /<kbd>&amp;<\/kbd><\/dt><dd>Focus the Copy first workbench heading control, or the workbenches heading if that control is missing. This key moves focus; it does not open a workbench. It does not copy./);
  assert.match(html, /Press <kbd>&amp;<\/kbd> to focus Copy first workbench heading/);
  assert.match(html, /This is distinct from <kbd>\*<\/kbd>, which copies the first workbench heading/);
  assert.match(html, /from <kbd>e<\/kbd>, which copies the catalog heading and lede/);
  assert.match(html, /from <kbd>a<\/kbd>, which focuses the first workbench article/);
  assert.match(html, /inEditable\(event\.target\)/);
  const focused = [];
  const clicks = { firstWorkbench: 0, lede: 0 };
  const assigned = [];
  let keydown = null;
  const copyFirstWorkbench = { focus() { focused.push('copy-first-workbench'); }, click() { clicks.firstWorkbench += 1; }, addEventListener() {} };
  const heading = { focus() { focused.push('workbenches-title'); } };
  const document = {
    getElementById(id) {
      if (id === 'copy-first-workbench') return copyFirstWorkbench;
      if (id === 'workbenches-title') return heading;
      if (id === 'workbenches') return { focus() { focused.push('workbenches'); } };
      if (id === 'copy-lede') return { click() { clicks.lede += 1; }, addEventListener() {}, focus() { focused.push('copy-lede'); } };
      if (id === 'workbench-1') return { focus() { focused.push('workbench-1'); } };
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
  const fire = (key, target, shiftKey = false) => {
    keydown({
      key,
      target,
      defaultPrevented: false,
      altKey: false,
      ctrlKey: false,
      metaKey: false,
      shiftKey,
      preventDefault() {},
    });
  };
  const input = { tagName: 'INPUT', closest() { return input; } };
  const textarea = { tagName: 'TEXTAREA', closest() { return textarea; } };
  const body = { tagName: 'BODY', closest() { return null; } };
  fire('&', input, true);
  fire('&', textarea, true);
  assert.deepEqual(focused, []);
  assert.equal(clicks.firstWorkbench, 0);
  assert.deepEqual(assigned, []);
  fire('&', body, true);
  assert.deepEqual(focused, ['copy-first-workbench']);
  assert.equal(clicks.firstWorkbench, 0);
  assert.deepEqual(assigned, []);
  fire('e', body, false);
  assert.equal(clicks.lede, 1);
  fire('a', body, false);
  assert.deepEqual(focused, ['copy-first-workbench', 'workbench-1']);
  assert.equal(clicks.firstWorkbench, 0);
  assert.deepEqual(assigned, []);
});

test('ampersand focuses the workbenches heading when Copy first workbench heading is missing', () => {
  const focused = [];
  const assigned = [];
  let keydown = null;
  const heading = { focus() { focused.push('workbenches-title'); } };
  const document = {
    getElementById(id) {
      if (id === 'copy-first-workbench') return null;
      if (id === 'workbenches-title') return heading;
      if (id === 'workbenches') return { focus() { focused.push('workbenches'); } };
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
  keydown({
    key: '&',
    target: { tagName: 'BODY', closest() { return null; } },
    defaultPrevented: false,
    altKey: false,
    ctrlKey: false,
    metaKey: false,
    shiftKey: true,
    preventDefault() {},
  });
  assert.deepEqual(focused, ['workbenches-title']);
  assert.deepEqual(assigned, []);
});

test('percent focuses Copy first Trust item when focus is not in an input', () => {
  assert.match(html, /event\.key === '%'/);
  assert.match(html, /getElementById\('copy-first-trust'\) \|\| document\.getElementById\('trust-title'\) \|\| document\.getElementById\('trust'\)/);
  assert.match(html, /id="copy-first-trust"/);
  assert.match(html, /id="trust-title"/);
  assert.match(html, /<kbd>%<\/kbd><\/dt><dd>Focus the Copy first Trust item control, or the Trust and limits heading if that control is missing. This key moves focus; it does not open a workbench. It does not copy./);
  assert.match(html, /Press <kbd>%<\/kbd> to focus Copy first Trust item/);
  assert.match(html, /This is distinct from <kbd>:<\/kbd>, which copies the first Trust and limits list item/);
  assert.match(html, /from <kbd>\/<\/kbd>, which focuses the first Trust and limits list item/);
  assert.match(html, /inEditable\(event\.target\)/);
  const focused = [];
  const clicks = { firstTrust: 0 };
  const assigned = [];
  let keydown = null;
  const copyFirstTrust = { focus() { focused.push('copy-first-trust'); }, click() { clicks.firstTrust += 1; }, addEventListener() {} };
  const heading = { focus() { focused.push('trust-title'); } };
  const firstTrustItem = { focus() { focused.push('first-trust-li'); } };
  const document = {
    getElementById(id) {
      if (id === 'copy-first-trust') return copyFirstTrust;
      if (id === 'trust-title') return heading;
      if (id === 'trust') return { focus() { focused.push('trust'); } };
      if (id === 'shortcuts') return { hidden: true };
      if (id === 'shortcuts-open') return { setAttribute() {}, addEventListener() {} };
      if (id === 'shortcuts-close') return { addEventListener() {} };
      if (id === 'skip-shortcuts') return { addEventListener() {} };
      return null;
    },
    querySelector(selector) {
      return selector === '#trust li' ? firstTrustItem : null;
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
  const fire = (key, target, shiftKey = false) => {
    keydown({
      key,
      target,
      defaultPrevented: false,
      altKey: false,
      ctrlKey: false,
      metaKey: false,
      shiftKey,
      preventDefault() {},
    });
  };
  const input = { tagName: 'INPUT', closest() { return input; } };
  const textarea = { tagName: 'TEXTAREA', closest() { return textarea; } };
  const body = { tagName: 'BODY', closest() { return null; } };
  fire('%', input, true);
  fire('%', textarea, true);
  assert.deepEqual(focused, []);
  assert.equal(clicks.firstTrust, 0);
  assert.deepEqual(assigned, []);
  fire('%', body, true);
  assert.deepEqual(focused, ['copy-first-trust']);
  assert.equal(clicks.firstTrust, 0);
  assert.deepEqual(assigned, []);
  fire(':', body, true);
  assert.equal(clicks.firstTrust, 1);
  fire('/', body, false);
  assert.deepEqual(focused, ['copy-first-trust', 'first-trust-li']);
  assert.equal(clicks.firstTrust, 1);
  assert.deepEqual(assigned, []);
});

test('percent focuses the Trust heading when Copy first Trust item is missing', () => {
  const focused = [];
  const assigned = [];
  let keydown = null;
  const heading = { focus() { focused.push('trust-title'); } };
  const document = {
    getElementById(id) {
      if (id === 'copy-first-trust') return null;
      if (id === 'trust-title') return heading;
      if (id === 'trust') return { focus() { focused.push('trust'); } };
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
  keydown({
    key: '%',
    target: { tagName: 'BODY', closest() { return null; } },
    defaultPrevented: false,
    altKey: false,
    ctrlKey: false,
    metaKey: false,
    shiftKey: true,
    preventDefault() {},
  });
  assert.deepEqual(focused, ['trust-title']);
  assert.deepEqual(assigned, []);
});

test('asterisk ampersand and percent stay distinct from close-paren tilde e a colon and slash', () => {
  assert.match(html, /event\.key === '\*'/);
  assert.match(html, /event\.key === '&'/);
  assert.match(html, /event\.key === '%'/);
  assert.match(html, /event\.key === '\)'/);
  assert.match(html, /event\.key === '~'/);
  assert.match(html, /event\.key === 'e'/);
  assert.match(html, /event\.key === 'a'/);
  assert.match(html, /event\.key === ':'/);
  assert.match(html, /event\.key === '\/'/);
  assert.match(html, /firstWorkbenchBtn\?\.click\(\)/);
  assert.match(html, /firstWhatsNewBtn\?\.click\(\)/);
  assert.match(html, /lastWhatsNewBtn\?\.click\(\)/);
  assert.match(html, /ledeBtn\?\.click\(\)/);
  assert.match(html, /firstTrustBtn\?\.click\(\)/);
  assert.match(readme, /Press `\*` to copy the first workbench heading/);
  assert.match(readme, /Press `&` to focus the Copy first workbench heading control/);
  assert.match(readme, /Press `%` to focus the Copy first Trust item control/);
  const clicks = { firstWorkbench: 0, firstNews: 0, lastNews: 0, lede: 0, firstTrust: 0 };
  const focused = [];
  const assigned = [];
  let keydown = null;
  const firstTrustItem = { focus() { focused.push('first-trust-li'); } };
  const document = {
    getElementById(id) {
      if (id === 'copy-first-workbench') return { click() { clicks.firstWorkbench += 1; }, addEventListener() {}, focus() { focused.push('copy-first-workbench'); } };
      if (id === 'copy-first-whats-new') return { click() { clicks.firstNews += 1; }, addEventListener() {}, focus() { focused.push('copy-first-whats-new'); } };
      if (id === 'copy-last-whats-new') return { click() { clicks.lastNews += 1; }, addEventListener() {}, focus() { focused.push('copy-last-whats-new'); } };
      if (id === 'copy-lede') return { click() { clicks.lede += 1; }, addEventListener() {}, focus() { focused.push('copy-lede'); } };
      if (id === 'copy-first-trust') return { click() { clicks.firstTrust += 1; }, addEventListener() {}, focus() { focused.push('copy-first-trust'); } };
      if (id === 'workbench-1') return { focus() { focused.push('workbench-1'); } };
      if (id === 'trust-title') return { focus() { focused.push('trust-title'); } };
      if (id === 'trust') return { focus() { focused.push('trust'); } };
      if (id === 'shortcuts') return { hidden: true };
      if (id === 'shortcuts-open') return { setAttribute() {}, addEventListener() {} };
      if (id === 'shortcuts-close') return { addEventListener() {} };
      if (id === 'skip-shortcuts') return { addEventListener() {} };
      return null;
    },
    querySelector(selector) {
      return selector === '#trust li' ? firstTrustItem : null;
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
  const fire = (key, shiftKey = false) => {
    keydown({
      key,
      target: { tagName: 'BODY', closest() { return null; } },
      defaultPrevented: false,
      altKey: false,
      ctrlKey: false,
      metaKey: false,
      shiftKey,
      preventDefault() {},
    });
  };
  fire('*', true);
  fire('&', true);
  fire('%', true);
  fire(')', true);
  fire('~', true);
  fire('e');
  fire('a');
  fire(':', true);
  fire('/');
  assert.equal(clicks.firstWorkbench, 1);
  assert.equal(clicks.firstNews, 1);
  assert.equal(clicks.lastNews, 1);
  assert.equal(clicks.lede, 1);
  assert.equal(clicks.firstTrust, 1);
  assert.deepEqual(focused, ['copy-first-workbench', 'copy-first-trust', 'workbench-1', 'first-trust-li']);
  assert.deepEqual(assigned, []);
});

test('copy last workbench heading control is distinct from Copy first workbench heading and Copy last job', () => {
  assert.match(html, /id="copy-last-workbench"/);
  assert.match(html, />Copy last workbench heading</);
  assert.match(html, /aria-keyshortcuts="\$"/);
  assert.match(html, /id="copy-last-workbench-fallback"/);
  assert.match(html, /class="copy-last-workbench-fallback"/);
  assert.match(html, /textarea id="copy-last-workbench-fallback"/);
  assert.match(html, /id="copy-first-workbench"/);
  assert.match(html, />Copy first workbench heading</);
  assert.match(html, /id="copy-last-job"/);
  assert.match(html, />Copy last job</);
  assert.match(html, /querySelectorAll\('#workbenches article\.workbench h3'\)/);
  assert.notEqual(html.match(/id="copy-last-workbench"/)?.[0], html.match(/id="copy-first-workbench"/)?.[0]);
  assert.notEqual(html.match(/id="copy-last-workbench"/)?.[0], html.match(/id="copy-last-job"/)?.[0]);
  assert.match(html, /@media print[\s\S]*\.copy-last-workbench-tools/);
  assert.match(html, /@media print[\s\S]*\.copy-last-workbench-fallback \{ display: none !important; \}/);
  assert.doesNotMatch(html, /hosted API/i);
});

test('copy last workbench heading markdown is the last #workbenches article.workbench h3, or empty if missing', async () => {
  assert.match(html, /lastWorkbenchMarkdown/);
  assert.match(html, /querySelectorAll\('#workbenches article\.workbench h3'\)/);
  assert.match(html, /lastWorkbenchFallback\.hidden = false/);
  assert.match(html, /lastWorkbenchFallback\.select\(\)/);
  assert.match(html, /This is the last workbench heading, not a live product feed/);
  assert.match(html, /Copied an empty string/);
  let copied = '';
  let clickLast = null;
  let headings = [
    { textContent: 'Partnership Breakpoint' },
    { textContent: 'Weekend Gap' },
  ];
  const document = {
    getElementById(id) {
      if (id === 'copy-last-workbench') return { addEventListener(name, handler) { if (name === 'click') clickLast = handler; } };
      if (id === 'copy-last-workbench-status') return { textContent: '' };
      if (id === 'copy-last-workbench-fallback') return { hidden: true, value: '', focus() {}, select() {} };
      return null;
    },
    querySelector: () => null,
    querySelectorAll(selector) {
      return selector === '#workbenches article.workbench h3' ? headings : [];
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
  await clickLast();
  assert.equal(copied, '- Weekend Gap');
  assert.doesNotMatch(copied, /\n/);
  assert.doesNotMatch(copied, /Partnership Breakpoint/);
  assert.doesNotMatch(copied, /live product feed/);
  headings = [];
  copied = 'stale';
  await clickLast();
  assert.equal(copied, '');
});

test('copy last workbench heading shows a visible textarea when clipboard is unavailable', async () => {
  let clickLast = null;
  const fallback = { hidden: true, value: '', focused: false, selected: false, focus() { this.focused = true; }, select() { this.selected = true; } };
  const status = { textContent: '' };
  const document = {
    getElementById(id) {
      if (id === 'copy-last-workbench') return { addEventListener(name, handler) { if (name === 'click') clickLast = handler; } };
      if (id === 'copy-last-workbench-status') return status;
      if (id === 'copy-last-workbench-fallback') return fallback;
      return null;
    },
    querySelector: () => null,
    querySelectorAll(selector) {
      return selector === '#workbenches article.workbench h3' ? [{ textContent: 'Weekend Gap' }] : [];
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
  await clickLast();
  assert.equal(fallback.hidden, false);
  assert.equal(fallback.focused, true);
  assert.equal(fallback.selected, true);
  assert.equal(fallback.value, '- Weekend Gap');
  assert.match(status.textContent, /Clipboard unavailable/);
  assert.match(status.textContent, /not a live product feed/);
});

test('keyboard dollar copies the last workbench heading through its own control', () => {
  assert.match(html, /event\.key === '\$'/);
  assert.match(html, /lastWorkbenchBtn\?\.click\(\)/);
  assert.match(html, /inEditable\(event\.target\)/);
  assert.match(html, /aria-keyshortcuts="\$"/);
  assert.match(html, /<kbd>\$<\/kbd><\/dt><dd>Copy the last workbench heading as one Markdown line from this catalog page, not a live product feed/);
  assert.match(html, /Press <kbd>\$<\/kbd> to copy the last workbench heading/);
  assert.match(html, /If that heading is missing, this copies an empty string/);
  assert.match(html, /This is distinct from <kbd>\*<\/kbd>, which copies the first workbench heading/);
  assert.match(html, /from <kbd>}<\/kbd>, which copies the last workbench job/);
  assert.match(html, /from <kbd>"<\/kbd>, which copies the last Trust and limits list item/);
  assert.match(html, /<strong>Last workbench heading\.<\/strong>/);
  const clicks = { lastWorkbench: 0, firstWorkbench: 0, lastJob: 0, lastTrust: 0 };
  const focused = [];
  const assigned = [];
  let keydown = null;
  const document = {
    getElementById(id) {
      if (id === 'copy-last-workbench') return { click() { clicks.lastWorkbench += 1; }, addEventListener() {}, focus() { focused.push('copy-last-workbench'); } };
      if (id === 'copy-first-workbench') return { click() { clicks.firstWorkbench += 1; }, addEventListener() {}, focus() { focused.push('copy-first-workbench'); } };
      if (id === 'copy-last-job') return { click() { clicks.lastJob += 1; }, addEventListener() {}, focus() { focused.push('copy-last-job'); } };
      if (id === 'copy-last-trust') return { click() { clicks.lastTrust += 1; }, addEventListener() {}, focus() { focused.push('copy-last-trust'); } };
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
  const fire = (key, target, shiftKey = false) => {
    keydown({
      key,
      target,
      defaultPrevented: false,
      altKey: false,
      ctrlKey: false,
      metaKey: false,
      shiftKey,
      preventDefault() {},
    });
  };
  const input = { tagName: 'INPUT', closest() { return input; } };
  const textarea = { tagName: 'TEXTAREA', closest() { return textarea; } };
  const select = { tagName: 'SELECT', closest() { return select; } };
  const body = { tagName: 'BODY', closest() { return null; } };
  fire('$', input, true);
  fire('$', textarea, true);
  fire('$', select, true);
  assert.equal(clicks.lastWorkbench, 0);
  assert.equal(clicks.firstWorkbench, 0);
  assert.deepEqual(focused, []);
  assert.deepEqual(assigned, []);
  fire('$', body, true);
  assert.equal(clicks.lastWorkbench, 1);
  assert.equal(clicks.firstWorkbench, 0);
  assert.equal(clicks.lastJob, 0);
  assert.equal(clicks.lastTrust, 0);
  assert.deepEqual(focused, []);
  assert.deepEqual(assigned, []);
  fire('*', body, true);
  fire('}', body, true);
  fire('"', body, true);
  assert.equal(clicks.firstWorkbench, 1);
  assert.equal(clicks.lastJob, 1);
  assert.equal(clicks.lastTrust, 1);
  assert.equal(clicks.lastWorkbench, 1);
  assert.deepEqual(assigned, []);
});

test('caret focuses Copy last workbench heading when focus is not in an input', () => {
  assert.match(html, /event\.key === '\^'/);
  assert.match(html, /getElementById\('copy-last-workbench'\) \|\| document\.getElementById\('workbenches-title'\) \|\| document\.getElementById\('workbenches'\)/);
  assert.match(html, /id="copy-last-workbench"/);
  assert.match(html, /id="workbenches-title"/);
  assert.match(html, /<kbd>\^<\/kbd><\/dt><dd>Focus the Copy last workbench heading control, or the workbenches heading if that control is missing. This key moves focus; it does not open a workbench. It does not copy./);
  assert.match(html, /Press <kbd>\^<\/kbd> to focus Copy last workbench heading/);
  assert.match(html, /This is distinct from <kbd>\$<\/kbd>, which copies the last workbench heading/);
  assert.match(html, /from <kbd>\*<\/kbd>, which copies the first workbench heading/);
  assert.match(html, /from <kbd>&amp;<\/kbd>, which focuses Copy first workbench heading/);
  assert.match(html, /<strong>Last-card jump\.<\/strong>/);
  assert.match(html, /inEditable\(event\.target\)/);
  const focused = [];
  const clicks = { lastWorkbench: 0, firstWorkbench: 0 };
  const assigned = [];
  let keydown = null;
  const copyLastWorkbench = { focus() { focused.push('copy-last-workbench'); }, click() { clicks.lastWorkbench += 1; }, addEventListener() {} };
  const heading = { focus() { focused.push('workbenches-title'); } };
  const document = {
    getElementById(id) {
      if (id === 'copy-last-workbench') return copyLastWorkbench;
      if (id === 'copy-first-workbench') return { click() { clicks.firstWorkbench += 1; }, addEventListener() {}, focus() { focused.push('copy-first-workbench'); } };
      if (id === 'workbenches-title') return heading;
      if (id === 'workbenches') return { focus() { focused.push('workbenches'); } };
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
  const fire = (key, target, shiftKey = false) => {
    keydown({
      key,
      target,
      defaultPrevented: false,
      altKey: false,
      ctrlKey: false,
      metaKey: false,
      shiftKey,
      preventDefault() {},
    });
  };
  const input = { tagName: 'INPUT', closest() { return input; } };
  const textarea = { tagName: 'TEXTAREA', closest() { return textarea; } };
  const body = { tagName: 'BODY', closest() { return null; } };
  fire('^', input, true);
  fire('^', textarea, true);
  assert.deepEqual(focused, []);
  assert.equal(clicks.lastWorkbench, 0);
  assert.deepEqual(assigned, []);
  fire('^', body, true);
  assert.deepEqual(focused, ['copy-last-workbench']);
  assert.equal(clicks.lastWorkbench, 0);
  assert.deepEqual(assigned, []);
  fire('$', body, true);
  assert.equal(clicks.lastWorkbench, 1);
  fire('&', body, true);
  assert.deepEqual(focused, ['copy-last-workbench', 'copy-first-workbench']);
  assert.equal(clicks.lastWorkbench, 1);
  assert.deepEqual(assigned, []);
});

test('caret focuses the workbenches heading when Copy last workbench heading is missing', () => {
  const focused = [];
  const assigned = [];
  let keydown = null;
  const heading = { focus() { focused.push('workbenches-title'); } };
  const document = {
    getElementById(id) {
      if (id === 'copy-last-workbench') return null;
      if (id === 'workbenches-title') return heading;
      if (id === 'workbenches') return { focus() { focused.push('workbenches'); } };
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
  keydown({
    key: '^',
    target: { tagName: 'BODY', closest() { return null; } },
    defaultPrevented: false,
    altKey: false,
    ctrlKey: false,
    metaKey: false,
    shiftKey: true,
    preventDefault() {},
  });
  assert.deepEqual(focused, ['workbenches-title']);
  assert.deepEqual(assigned, []);
});

test('backtick focuses Copy last Trust item when focus is not in an input', () => {
  assert.equal(html.includes("event.key === '`'"), true);
  assert.match(html, /getElementById\('copy-last-trust'\) \|\| document\.getElementById\('trust-title'\) \|\| document\.getElementById\('trust'\)/);
  assert.match(html, /id="copy-last-trust"/);
  assert.match(html, /id="trust-title"/);
  assert.match(html, /<kbd>`<\/kbd><\/dt><dd>Focus the Copy last Trust item control, or the Trust and limits heading if that control is missing. This key moves focus; it does not open a workbench. It does not copy./);
  assert.match(html, /Press <kbd>`<\/kbd> to focus Copy last Trust item/);
  assert.match(html, /This is distinct from <kbd>"<\/kbd>, which copies the last Trust and limits list item/);
  assert.match(html, /from <kbd>%<\/kbd>, which focuses Copy first Trust item/);
  assert.match(html, /from <kbd>:<\/kbd>, which copies the first Trust and limits list item/);
  assert.match(html, /<strong>Last-trust jump\.<\/strong>/);
  assert.match(html, /inEditable\(event\.target\)/);
  const focused = [];
  const clicks = { lastTrust: 0, firstTrust: 0 };
  const assigned = [];
  let keydown = null;
  const copyLastTrust = { focus() { focused.push('copy-last-trust'); }, click() { clicks.lastTrust += 1; }, addEventListener() {} };
  const heading = { focus() { focused.push('trust-title'); } };
  const document = {
    getElementById(id) {
      if (id === 'copy-last-trust') return copyLastTrust;
      if (id === 'copy-first-trust') return { click() { clicks.firstTrust += 1; }, addEventListener() {}, focus() { focused.push('copy-first-trust'); } };
      if (id === 'trust-title') return heading;
      if (id === 'trust') return { focus() { focused.push('trust'); } };
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
  const fire = (key, target, shiftKey = false) => {
    keydown({
      key,
      target,
      defaultPrevented: false,
      altKey: false,
      ctrlKey: false,
      metaKey: false,
      shiftKey,
      preventDefault() {},
    });
  };
  const input = { tagName: 'INPUT', closest() { return input; } };
  const textarea = { tagName: 'TEXTAREA', closest() { return textarea; } };
  const body = { tagName: 'BODY', closest() { return null; } };
  fire('`', input, false);
  fire('`', textarea, false);
  assert.deepEqual(focused, []);
  assert.equal(clicks.lastTrust, 0);
  assert.deepEqual(assigned, []);
  fire('`', body, false);
  assert.deepEqual(focused, ['copy-last-trust']);
  assert.equal(clicks.lastTrust, 0);
  assert.deepEqual(assigned, []);
  fire('"', body, true);
  assert.equal(clicks.lastTrust, 1);
  fire('%', body, true);
  assert.deepEqual(focused, ['copy-last-trust', 'copy-first-trust']);
  assert.equal(clicks.lastTrust, 1);
  assert.deepEqual(assigned, []);
});

test('backtick focuses the Trust heading when Copy last Trust item is missing', () => {
  const focused = [];
  const assigned = [];
  let keydown = null;
  const heading = { focus() { focused.push('trust-title'); } };
  const document = {
    getElementById(id) {
      if (id === 'copy-last-trust') return null;
      if (id === 'trust-title') return heading;
      if (id === 'trust') return { focus() { focused.push('trust'); } };
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
  keydown({
    key: '`',
    target: { tagName: 'BODY', closest() { return null; } },
    defaultPrevented: false,
    altKey: false,
    ctrlKey: false,
    metaKey: false,
    shiftKey: false,
    preventDefault() {},
  });
  assert.deepEqual(focused, ['trust-title']);
  assert.deepEqual(assigned, []);
});

test('dollar caret and backtick stay distinct from asterisk ampersand percent and quote', () => {
  assert.match(html, /event\.key === '\$'/);
  assert.match(html, /event\.key === '\^'/);
  assert.equal(html.includes("event.key === '`'"), true);
  assert.match(html, /event\.key === '\*'/);
  assert.match(html, /event\.key === '&'/);
  assert.match(html, /event\.key === '%'/);
  assert.match(html, /event\.key === '"'/);
  assert.match(html, /event\.key === ':'/);
  assert.match(html, /lastWorkbenchBtn\?\.click\(\)/);
  assert.match(html, /firstWorkbenchBtn\?\.click\(\)/);
  assert.match(html, /lastTrustBtn\?\.click\(\)/);
  assert.match(html, /firstTrustBtn\?\.click\(\)/);
  assert.match(readme, /Press `\$` to copy the last workbench heading/);
  assert.match(readme, /Press `\^` to focus the Copy last workbench heading control/);
  assert.match(readme, /Press `` ` `` to focus the Copy last Trust item control/);
  const clicks = { lastWorkbench: 0, firstWorkbench: 0, lastTrust: 0, firstTrust: 0 };
  const focused = [];
  const assigned = [];
  let keydown = null;
  const document = {
    getElementById(id) {
      if (id === 'copy-last-workbench') return { click() { clicks.lastWorkbench += 1; }, addEventListener() {}, focus() { focused.push('copy-last-workbench'); } };
      if (id === 'copy-first-workbench') return { click() { clicks.firstWorkbench += 1; }, addEventListener() {}, focus() { focused.push('copy-first-workbench'); } };
      if (id === 'copy-last-trust') return { click() { clicks.lastTrust += 1; }, addEventListener() {}, focus() { focused.push('copy-last-trust'); } };
      if (id === 'copy-first-trust') return { click() { clicks.firstTrust += 1; }, addEventListener() {}, focus() { focused.push('copy-first-trust'); } };
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
  const fire = (key, shiftKey = false) => {
    keydown({
      key,
      target: { tagName: 'BODY', closest() { return null; } },
      defaultPrevented: false,
      altKey: false,
      ctrlKey: false,
      metaKey: false,
      shiftKey,
      preventDefault() {},
    });
  };
  fire('$', true);
  fire('^', true);
  fire('`');
  fire('*', true);
  fire('&', true);
  fire('%', true);
  fire('"', true);
  fire(':', true);
  assert.equal(clicks.lastWorkbench, 1);
  assert.equal(clicks.firstWorkbench, 1);
  assert.equal(clicks.lastTrust, 1);
  assert.equal(clicks.firstTrust, 1);
  assert.deepEqual(focused, ['copy-last-workbench', 'copy-last-trust', 'copy-first-workbench', 'copy-first-trust']);
  assert.deepEqual(assigned, []);
});

test('What\'s new and README name first-open copy, first-open jump, and first-open-link jump without changing workbench versions', () => {
  const news = html.slice(html.indexOf('id="whats-new"'), html.indexOf('id="workbenches"'));
  const headings = [...news.matchAll(/<h3[^>]*>([^<]+)<\/h3>/g)].map((match) => match[1]);
  assert.equal(headings[0], 'Last-skip-text copy, last-skip-text jump, and last-skip-target jump');
  assert.equal(headings.includes('First-skip-text copy, first-skip-text jump, and skip-nav jump'), true);
  assert.equal(headings.includes('Last-skip copy, last-skip jump, and last-skip-link jump'), true);
  assert.equal(headings.includes('First-skip copy, first-skip jump, and first-skip-link jump'), true);
  assert.equal(headings.includes('Last-open copy, last-open jump, and last-open-link jump'), true);
  assert.equal(headings.includes('First-open copy, first-open jump, and first-open-link jump'), true);
  assert.equal(headings.includes('Last-review copy, last-review jump, and last-path jump'), true);
  assert.equal(headings.includes('Last-workbench copy, last-card jump, and last-trust jump'), true);
  assert.equal(headings[headings.length - 1], 'Saturday late bank open, last-open-FX copy, and weekend-FX-open hide in Weekend Gap 1.5.22');
  assert.equal(headings.includes("First What's new copy, intro jump, and skip-link jump"), true);
  assert.equal(headings.includes("Last What's new copy, last-news jump, and first-news jump"), true);
  assert.equal(headings.includes('Last-job copy, last-job jump, and first-job jump'), true);
  assert.equal(headings.includes('Saturday late payout, open-FX copy, and FX-open hide in Weekend Gap 1.5.14'), true);
  assert.equal(headings.includes('Sunday early payout, open-bank copy, and bank-open hide in Weekend Gap 1.5.15'), true);
  assert.equal(headings.includes('Sunday late issuer close, issuer-open copy, and issuer-open hide in Weekend Gap 1.5.16'), true);
  assert.equal(headings.includes('Sunday early issuer open, last-open-issuer copy, and weekend-issuer-open hide in Weekend Gap 1.5.17'), true);
  assert.equal(headings.includes('Saturday early issuer open, last-closed-issuer copy, and weekend-issuer-closed hide in Weekend Gap 1.5.18'), true);
  assert.equal(headings.includes('Friday early issuer open, last-closed-bank copy, and weekend-bank-closed hide in Weekend Gap 1.5.19'), true);
  assert.equal(headings.includes('Saturday early bank open, last-open-bank copy, and weekend-bank-open hide in Weekend Gap 1.5.20'), true);
  assert.equal(headings.includes('Friday early bank open, last-open-payout copy, and weekend-payout-open hide in Weekend Gap 1.5.21'), true);
  assert.equal(headings.includes('Saturday late bank open, last-open-FX copy, and weekend-FX-open hide in Weekend Gap 1.5.22'), true);
  assert.match(html, /Copy first Open href through 0 as Markdown/);
  assert.match(html, /jump to that control with keyboard backslash/);
  assert.match(html, /jump to the first Open workbench link with keyboard s/);
  assert.match(html, /The branded 404 page can copy the first Open workbench href without adding a public path/);
  assert.match(html, /They do not change workbench versions and they do not call a live product feed/);
  assert.match(html, /These are in-page catalog tools/);
  assert.match(readme, /first-open copy, first-open jump, and first-open-link jump/);
  assert.match(readme, /That What's new entry is hub-only. It does not change workbench versions/);
  assert.match(readme, /Copy first Open href on\s+that 404 page copies/);
  assert.match(readme, /Copy first Open href copies the first Open workbench href/);
  assert.match(readme, /Press `0` to copy the first Open workbench href/);
  assert.match(readme, /Press `\\` to focus the Copy first Open href control/);
  assert.match(readme, /Press `s` to focus the first Open\s+workbench link/);
  assert.match(readme, /Key `0` copies the first Open workbench href/);
  assert.match(readme, /Key `\\` focuses the Copy first Open href control/);
  assert.match(readme, /Key `s` focuses the first Open\s+workbench link/);
  assert.doesNotMatch(html, /hosted API/i);
  assert.doesNotMatch(html, /live service/i);
});

test('What\'s new and README name first-review copy, first-review jump, and first-path jump without changing workbench versions', () => {
  const news = html.slice(html.indexOf('id="whats-new"'), html.indexOf('id="workbenches"'));
  const headings = [...news.matchAll(/<h3[^>]*>([^<]+)<\/h3>/g)].map((match) => match[1]);
  assert.equal(headings[0], 'Last-skip-text copy, last-skip-text jump, and last-skip-target jump');
  assert.equal(headings.includes('First-skip-text copy, first-skip-text jump, and skip-nav jump'), true);
  assert.equal(headings.includes('Last-skip copy, last-skip jump, and last-skip-link jump'), true);
  assert.equal(headings.includes('First-skip copy, first-skip jump, and first-skip-link jump'), true);
  assert.equal(headings.includes('Last-open copy, last-open jump, and last-open-link jump'), true);
  assert.equal(headings.includes('First-open copy, first-open jump, and first-open-link jump'), true);
  assert.equal(headings.includes('Last-review copy, last-review jump, and last-path jump'), true);
  assert.equal(headings.includes('Last-workbench copy, last-card jump, and last-trust jump'), true);
  assert.equal(headings[headings.length - 1], 'Saturday late bank open, last-open-FX copy, and weekend-FX-open hide in Weekend Gap 1.5.22');
  assert.equal(headings.includes("First What's new copy, intro jump, and skip-link jump"), true);
  assert.equal(headings.includes("Last What's new copy, last-news jump, and first-news jump"), true);
  assert.equal(headings.includes('Last-job copy, last-job jump, and first-job jump'), true);
  assert.equal(headings.includes('Saturday late payout, open-FX copy, and FX-open hide in Weekend Gap 1.5.14'), true);
  assert.equal(headings.includes('Sunday early payout, open-bank copy, and bank-open hide in Weekend Gap 1.5.15'), true);
  assert.equal(headings.includes('Sunday late issuer close, issuer-open copy, and issuer-open hide in Weekend Gap 1.5.16'), true);
  assert.equal(headings.includes('Sunday early issuer open, last-open-issuer copy, and weekend-issuer-open hide in Weekend Gap 1.5.17'), true);
  assert.equal(headings.includes('Saturday early issuer open, last-closed-issuer copy, and weekend-issuer-closed hide in Weekend Gap 1.5.18'), true);
  assert.equal(headings.includes('Friday early issuer open, last-closed-bank copy, and weekend-bank-closed hide in Weekend Gap 1.5.19'), true);
  assert.equal(headings.includes('Saturday early bank open, last-open-bank copy, and weekend-bank-open hide in Weekend Gap 1.5.20'), true);
  assert.equal(headings.includes('Friday early bank open, last-open-payout copy, and weekend-payout-open hide in Weekend Gap 1.5.21'), true);
  assert.equal(headings.includes('Saturday late bank open, last-open-FX copy, and weekend-FX-open hide in Weekend Gap 1.5.22'), true);
  assert.match(html, /Copy first review path through 7 as Markdown/);
  assert.match(html, /jump to that control with keyboard 8/);
  assert.match(html, /jump to the first review path with keyboard 9/);
  assert.match(html, /They do not change workbench versions and they do not call a live product feed/);
  assert.match(html, /without adding a public path/);
  assert.match(html, /These are in-page catalog tools/);
  assert.match(readme, /first-review copy, first-review jump, and first-path jump/);
  assert.match(readme, /That What's new entry is hub-only. It does not change workbench versions/);
  assert.match(readme, /Copy first review path on\s+that 404 page copies/);
  assert.match(readme, /Copy first review path copies the first workbench card review path/);
  assert.match(readme, /Press `7` to copy the first review path/);
  assert.match(readme, /Press `8` to focus the Copy first review path control/);
  assert.match(readme, /Press `9` to focus the first review path/);
  assert.match(readme, /Key `7` copies the first review path/);
  assert.match(readme, /Key `8` focuses the Copy first review path control/);
  assert.match(readme, /Key `9` focuses the first review path/);
  assert.doesNotMatch(html, /hosted API/i);
  assert.doesNotMatch(html, /live service/i);
});

test('What\'s new and README name last-review copy, last-review jump, and last-path jump without changing workbench versions', () => {
  const news = html.slice(html.indexOf('id="whats-new"'), html.indexOf('id="workbenches"'));
  const headings = [...news.matchAll(/<h3[^>]*>([^<]+)<\/h3>/g)].map((match) => match[1]);
  assert.equal(headings[0], 'Last-skip-text copy, last-skip-text jump, and last-skip-target jump');
  assert.equal(headings.includes('First-skip-text copy, first-skip-text jump, and skip-nav jump'), true);
  assert.equal(headings.includes('Last-skip copy, last-skip jump, and last-skip-link jump'), true);
  assert.equal(headings.includes('First-skip copy, first-skip jump, and first-skip-link jump'), true);
  assert.equal(headings.includes('Last-open copy, last-open jump, and last-open-link jump'), true);
  assert.equal(headings.includes('First-open copy, first-open jump, and first-open-link jump'), true);
  assert.equal(headings.includes('Last-review copy, last-review jump, and last-path jump'), true);
  assert.equal(headings.includes('Last-workbench copy, last-card jump, and last-trust jump'), true);
  assert.equal(headings[headings.length - 1], 'Saturday late bank open, last-open-FX copy, and weekend-FX-open hide in Weekend Gap 1.5.22');
  assert.equal(headings.includes("First What's new copy, intro jump, and skip-link jump"), true);
  assert.equal(headings.includes("Last What's new copy, last-news jump, and first-news jump"), true);
  assert.equal(headings.includes('Last-job copy, last-job jump, and first-job jump'), true);
  assert.equal(headings.includes('Saturday late payout, open-FX copy, and FX-open hide in Weekend Gap 1.5.14'), true);
  assert.equal(headings.includes('Sunday early payout, open-bank copy, and bank-open hide in Weekend Gap 1.5.15'), true);
  assert.equal(headings.includes('Sunday late issuer close, issuer-open copy, and issuer-open hide in Weekend Gap 1.5.16'), true);
  assert.equal(headings.includes('Sunday early issuer open, last-open-issuer copy, and weekend-issuer-open hide in Weekend Gap 1.5.17'), true);
  assert.equal(headings.includes('Saturday early issuer open, last-closed-issuer copy, and weekend-issuer-closed hide in Weekend Gap 1.5.18'), true);
  assert.equal(headings.includes('Friday early issuer open, last-closed-bank copy, and weekend-bank-closed hide in Weekend Gap 1.5.19'), true);
  assert.equal(headings.includes('Saturday early bank open, last-open-bank copy, and weekend-bank-open hide in Weekend Gap 1.5.20'), true);
  assert.equal(headings.includes('Friday early bank open, last-open-payout copy, and weekend-payout-open hide in Weekend Gap 1.5.21'), true);
  assert.equal(headings.includes('Saturday late bank open, last-open-FX copy, and weekend-FX-open hide in Weekend Gap 1.5.22'), true);
  assert.match(html, /Copy last review path through open-brace as Markdown/);
  assert.match(html, /jump to that control with keyboard 5/);
  assert.match(html, /jump to the last review path with keyboard 6/);
  assert.match(html, /They do not change workbench versions and they do not call a live product feed/);
  assert.match(html, /without adding a public path/);
  assert.match(html, /These are in-page catalog tools/);
  assert.match(readme, /last-review copy, last-review jump, and last-path jump/);
  assert.match(readme, /That What's new entry is hub-only. It does not change workbench versions/);
  assert.match(readme, /Copy last review path on\s+that 404 page copies/);
  assert.match(readme, /Copy last review path copies the last workbench card review path/);
  assert.match(readme, /Press `\{` to copy the last review path/);
  assert.match(readme, /Press `5` to focus the Copy last review path control/);
  assert.match(readme, /Press `6` to focus the last review path/);
  assert.match(readme, /Key `\{` copies the last review path/);
  assert.match(readme, /Key `5` focuses the Copy last review path control/);
  assert.match(readme, /Key `6` focuses the last review path/);
  assert.doesNotMatch(html, /hosted API/i);
  assert.doesNotMatch(html, /live service/i);
});

test('copy last review path control is distinct from Copy last workbench heading and Copy last job', () => {
  assert.match(html, /id="copy-last-review"/);
  assert.match(html, />Copy last review path</);
  assert.match(html, /aria-keyshortcuts="\{"/);
  assert.match(html, /id="copy-last-review-fallback"/);
  assert.match(html, /class="copy-last-review-fallback"/);
  assert.match(html, /textarea id="copy-last-review-fallback"/);
  assert.match(html, /id="copy-last-workbench"/);
  assert.match(html, />Copy last workbench heading</);
  assert.match(html, /id="copy-last-job"/);
  assert.match(html, />Copy last job</);
  assert.match(html, /querySelectorAll\('#workbenches article\.workbench \.review-path'\)/);
  assert.notEqual(html.match(/id="copy-last-review"/)?.[0], html.match(/id="copy-last-workbench"/)?.[0]);
  assert.notEqual(html.match(/id="copy-last-review"/)?.[0], html.match(/id="copy-last-job"/)?.[0]);
  assert.match(html, /@media print[\s\S]*\.copy-last-review-tools/);
  assert.match(html, /@media print[\s\S]*\.copy-last-review-fallback \{ display: none !important; \}/);
  assert.doesNotMatch(html, /hosted API/i);
});

test('copy last review path markdown is the last #workbenches article.workbench .review-path, or empty if missing', async () => {
  assert.match(html, /lastReviewMarkdown/);
  assert.match(html, /querySelectorAll\('#workbenches article\.workbench \.review-path'\)/);
  assert.match(html, /lastReviewFallback\.hidden = false/);
  assert.match(html, /lastReviewFallback\.select\(\)/);
  assert.match(html, /This is the last review path, not a live product feed/);
  assert.match(html, /Copied an empty string/);
  let copied = '';
  let clickLast = null;
  let paths = [
    { textContent: 'Review constraints and negotiation room. First card.' },
    { textContent: 'Review the timing behind the queue. Inspect arrival cohorts, closed intervals and reserve or throughput scenarios.' },
  ];
  const document = {
    getElementById(id) {
      if (id === 'copy-last-review') return { addEventListener(name, handler) { if (name === 'click') clickLast = handler; } };
      if (id === 'copy-last-review-status') return { textContent: '' };
      if (id === 'copy-last-review-fallback') return { hidden: true, value: '', focus() {}, select() {} };
      return null;
    },
    querySelector: () => null,
    querySelectorAll(selector) {
      return selector === '#workbenches article.workbench .review-path' ? paths : [];
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
  await clickLast();
  assert.equal(copied, '- Review the timing behind the queue. Inspect arrival cohorts, closed intervals and reserve or throughput scenarios.');
  assert.doesNotMatch(copied, /\n/);
  assert.doesNotMatch(copied, /Review constraints and negotiation room/);
  assert.doesNotMatch(copied, /live product feed/);
  paths = [];
  copied = 'stale';
  await clickLast();
  assert.equal(copied, '');
});

test('copy last review path shows a visible textarea when clipboard is unavailable', async () => {
  let clickLast = null;
  const fallback = { hidden: true, value: '', focused: false, selected: false, focus() { this.focused = true; }, select() { this.selected = true; } };
  const status = { textContent: '' };
  const document = {
    getElementById(id) {
      if (id === 'copy-last-review') return { addEventListener(name, handler) { if (name === 'click') clickLast = handler; } };
      if (id === 'copy-last-review-status') return status;
      if (id === 'copy-last-review-fallback') return fallback;
      return null;
    },
    querySelector: () => null,
    querySelectorAll(selector) {
      return selector === '#workbenches article.workbench .review-path' ? [{ textContent: 'Review the timing behind the queue. Inspect arrival cohorts, closed intervals and reserve or throughput scenarios.' }] : [];
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
  await clickLast();
  assert.equal(fallback.hidden, false);
  assert.equal(fallback.focused, true);
  assert.equal(fallback.selected, true);
  assert.equal(fallback.value, '- Review the timing behind the queue. Inspect arrival cohorts, closed intervals and reserve or throughput scenarios.');
  assert.match(status.textContent, /Clipboard unavailable/);
  assert.match(status.textContent, /not a live product feed/);
});

test('keyboard open-brace copies the last review path through its own control', () => {
  assert.match(html, /event\.key === '\{'/);
  assert.match(html, /lastReviewBtn\?\.click\(\)/);
  assert.match(html, /inEditable\(event\.target\)/);
  assert.match(html, /aria-keyshortcuts="\{"/);
  assert.match(html, /<kbd>\{\<\/kbd><\/dt><dd>Copy the last review path as one Markdown line from this catalog page, not a live product feed/);
  assert.match(html, /Press <kbd>\{\<\/kbd> to copy the last review path/);
  assert.match(html, /If that path is missing, this copies an empty string/);
  assert.match(html, /This is distinct from <kbd>\$<\/kbd>, which copies the last workbench heading/);
  assert.match(html, /from <kbd>r<\/kbd>, which focuses the first review path/);
  assert.match(html, /from <kbd>5<\/kbd>, which focuses Copy last review path/);
  assert.match(html, /<strong>Last review path\.<\/strong>/);
  const clicks = { lastReview: 0, lastWorkbench: 0 };
  const focused = [];
  const assigned = [];
  let keydown = null;
  const document = {
    getElementById(id) {
      if (id === 'copy-last-review') return { click() { clicks.lastReview += 1; }, addEventListener() {}, focus() { focused.push('copy-last-review'); } };
      if (id === 'copy-last-workbench') return { click() { clicks.lastWorkbench += 1; }, addEventListener() {}, focus() { focused.push('copy-last-workbench'); } };
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
  const fire = (key, target, shiftKey = false) => {
    keydown({
      key,
      target,
      defaultPrevented: false,
      altKey: false,
      ctrlKey: false,
      metaKey: false,
      shiftKey,
      preventDefault() {},
    });
  };
  const input = { tagName: 'INPUT', closest() { return input; } };
  const textarea = { tagName: 'TEXTAREA', closest() { return textarea; } };
  const select = { tagName: 'SELECT', closest() { return select; } };
  const body = { tagName: 'BODY', closest() { return null; } };
  fire('{', input, true);
  fire('{', textarea, true);
  fire('{', select, true);
  assert.equal(clicks.lastReview, 0);
  assert.equal(clicks.lastWorkbench, 0);
  assert.deepEqual(focused, []);
  assert.deepEqual(assigned, []);
  fire('{', body, true);
  assert.equal(clicks.lastReview, 1);
  assert.equal(clicks.lastWorkbench, 0);
  assert.deepEqual(focused, []);
  assert.deepEqual(assigned, []);
  fire('$', body, true);
  assert.equal(clicks.lastWorkbench, 1);
  assert.equal(clicks.lastReview, 1);
  assert.deepEqual(assigned, []);
});

test('keyboard 5 focuses Copy last review path when focus is not in an input', () => {
  assert.match(html, /event\.key === '5'/);
  assert.match(html, /getElementById\('copy-last-review'\) \|\| document\.getElementById\('workbenches-title'\) \|\| document\.getElementById\('workbenches'\)/);
  assert.match(html, /id="copy-last-review"/);
  assert.match(html, /id="workbenches-title"/);
  assert.match(html, /<kbd>5<\/kbd><\/dt><dd>Focus the Copy last review path control, or the workbenches heading if that control is missing. This key moves focus; it does not open a workbench. It does not copy./);
  assert.match(html, /Press <kbd>5<\/kbd> to focus Copy last review path/);
  assert.match(html, /This is distinct from <kbd>\{\<\/kbd>, which copies the last review path/);
  assert.match(html, /from <kbd>r<\/kbd>, which focuses the first review path/);
  assert.match(html, /from <kbd>6<\/kbd>, which focuses the last review path/);
  assert.match(html, /<strong>Last-review jump\.<\/strong>/);
  assert.match(html, /inEditable\(event\.target\)/);
  assert.match(html, /const keys = \{ 1: 0, 2: 1, 3: 2, 4: 3 \}/);
  assert.doesNotMatch(html, /const keys = \{ 1: 0, 2: 1, 3: 2, 4: 3, 5:/);
  const focused = [];
  const clicks = { lastReview: 0 };
  const assigned = [];
  let keydown = null;
  const copyLastReview = { focus() { focused.push('copy-last-review'); }, click() { clicks.lastReview += 1; }, addEventListener() {} };
  const heading = { focus() { focused.push('workbenches-title'); } };
  const document = {
    getElementById(id) {
      if (id === 'copy-last-review') return copyLastReview;
      if (id === 'workbenches-title') return heading;
      if (id === 'workbenches') return { focus() { focused.push('workbenches'); } };
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
  const fire = (key, target, shiftKey = false) => {
    keydown({
      key,
      target,
      defaultPrevented: false,
      altKey: false,
      ctrlKey: false,
      metaKey: false,
      shiftKey,
      preventDefault() {},
    });
  };
  const input = { tagName: 'INPUT', closest() { return input; } };
  const textarea = { tagName: 'TEXTAREA', closest() { return textarea; } };
  const body = { tagName: 'BODY', closest() { return null; } };
  fire('5', input, false);
  fire('5', textarea, false);
  assert.deepEqual(focused, []);
  assert.equal(clicks.lastReview, 0);
  assert.deepEqual(assigned, []);
  fire('5', body, true);
  assert.deepEqual(focused, ['copy-last-review']);
  assert.equal(clicks.lastReview, 0);
  assert.deepEqual(assigned, []);
  fire('{', body, true);
  assert.equal(clicks.lastReview, 1);
  assert.deepEqual(focused, ['copy-last-review']);
  assert.deepEqual(assigned, []);
});

test('keyboard 5 focuses the workbenches heading when Copy last review path is missing', () => {
  const focused = [];
  const assigned = [];
  let keydown = null;
  const heading = { focus() { focused.push('workbenches-title'); } };
  const document = {
    getElementById(id) {
      if (id === 'copy-last-review') return null;
      if (id === 'workbenches-title') return heading;
      if (id === 'workbenches') return { focus() { focused.push('workbenches'); } };
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
  keydown({
    key: '5',
    target: { tagName: 'BODY', closest() { return null; } },
    defaultPrevented: false,
    altKey: false,
    ctrlKey: false,
    metaKey: false,
    shiftKey: true,
    preventDefault() {},
  });
  assert.deepEqual(focused, ['workbenches-title']);
  assert.deepEqual(assigned, []);
});

test('keyboard 6 focuses the last review path when focus is not in an input', () => {
  assert.match(html, /event\.key === '6'/);
  assert.match(html, /querySelector\('#workbenches article\.workbench:last-of-type \.review-path'\)/);
  assert.match(html, /querySelector\('#workbench-4 \.review-path'\)/);
  assert.match(html, /<kbd>6<\/kbd><\/dt><dd>Focus the last review path on the last workbench card, or the workbenches heading if that path is missing. This key moves focus; it does not open a workbench. It does not copy./);
  assert.match(html, /Press <kbd>6<\/kbd> to focus the last review path/);
  assert.match(html, /This is distinct from <kbd>r<\/kbd>, which focuses the first review path on the first workbench card/);
  assert.match(html, /from <kbd>5<\/kbd>, which focuses Copy last review path/);
  assert.match(html, /<strong>Last-path jump\.<\/strong>/);
  assert.match(html, /inEditable\(event\.target\)/);
  assert.match(html, /const keys = \{ 1: 0, 2: 1, 3: 2, 4: 3 \}/);
  assert.doesNotMatch(html, /const keys = \{ 1: 0, 2: 1, 3: 2, 4: 3, 5:/);
  const focused = [];
  const clicks = { lastReview: 0 };
  const assigned = [];
  let keydown = null;
  const lastReview = { focus() { focused.push('last-review-path'); } };
  const firstReview = { focus() { focused.push('first-review-path'); } };
  const document = {
    getElementById(id) {
      if (id === 'copy-last-review') return { click() { clicks.lastReview += 1; }, addEventListener() {}, focus() { focused.push('copy-last-review'); } };
      if (id === 'workbenches-title') return { focus() { focused.push('workbenches-title'); } };
      if (id === 'workbenches') return { focus() { focused.push('workbenches'); } };
      if (id === 'shortcuts') return { hidden: true };
      if (id === 'shortcuts-open') return { setAttribute() {}, addEventListener() {} };
      if (id === 'shortcuts-close') return { addEventListener() {} };
      if (id === 'skip-shortcuts') return { addEventListener() {} };
      return null;
    },
    querySelector(selector) {
      if (selector === '#workbenches article.workbench:last-of-type .review-path') return lastReview;
      if (selector === '#workbench-4 .review-path') return lastReview;
      if (selector === '#workbench-1 .review-path') return firstReview;
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
  const fire = (key, target, shiftKey = false) => {
    keydown({
      key,
      target,
      defaultPrevented: false,
      altKey: false,
      ctrlKey: false,
      metaKey: false,
      shiftKey,
      preventDefault() {},
    });
  };
  const input = { tagName: 'INPUT', closest() { return input; } };
  const textarea = { tagName: 'TEXTAREA', closest() { return textarea; } };
  const body = { tagName: 'BODY', closest() { return null; } };
  fire('6', input, false);
  fire('6', textarea, false);
  assert.deepEqual(focused, []);
  assert.equal(clicks.lastReview, 0);
  assert.deepEqual(assigned, []);
  fire('6', body, true);
  assert.deepEqual(focused, ['last-review-path']);
  assert.equal(clicks.lastReview, 0);
  assert.deepEqual(assigned, []);
  fire('r', body, false);
  assert.deepEqual(focused, ['last-review-path', 'first-review-path']);
  assert.equal(clicks.lastReview, 0);
  assert.deepEqual(assigned, []);
});

test('keyboard 6 focuses the workbenches heading when the last review path is missing', () => {
  const focused = [];
  const assigned = [];
  let keydown = null;
  const heading = { focus() { focused.push('workbenches-title'); } };
  const document = {
    getElementById(id) {
      if (id === 'copy-last-review') return { focus() { focused.push('copy-last-review'); }, click() {}, addEventListener() {} };
      if (id === 'workbenches-title') return heading;
      if (id === 'workbenches') return { focus() { focused.push('workbenches'); } };
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
  keydown({
    key: '6',
    target: { tagName: 'BODY', closest() { return null; } },
    defaultPrevented: false,
    altKey: false,
    ctrlKey: false,
    metaKey: false,
    shiftKey: true,
    preventDefault() {},
  });
  assert.deepEqual(focused, ['workbenches-title']);
  assert.deepEqual(assigned, []);
});

test('open-brace, 5, and 6 stay distinct from dollar, r, and the 1-4 opener map', () => {
  assert.match(html, /event\.key === '\{'/);
  assert.match(html, /event\.key === '5'/);
  assert.match(html, /event\.key === '6'/);
  assert.match(html, /event\.key === '\$'/);
  assert.match(html, /event\.key === 'r'/);
  assert.match(html, /event\.key === '\['/);
  assert.match(html, /lastReviewBtn\?\.click\(\)/);
  assert.match(html, /lastWorkbenchBtn\?\.click\(\)/);
  assert.match(html, /getElementById\('copy-last-review'\) \|\| document\.getElementById\('workbenches-title'\)/);
  assert.match(html, /querySelector\('#workbench-1 \.review-path'\)\?\.focus\(\)/);
  assert.match(html, /const keys = \{ 1: 0, 2: 1, 3: 2, 4: 3 \}/);
  assert.doesNotMatch(html, /const keys = \{ 1: 0, 2: 1, 3: 2, 4: 3, 5:/);
  assert.match(readme, /Press `\{` to copy the last review path/);
  assert.match(readme, /Press `5` to focus the Copy last review path control/);
  assert.match(readme, /Press `6` to focus the last review path/);
  const clicks = { lastReview: 0, lastWorkbench: 0 };
  const focused = [];
  const assigned = [];
  let keydown = null;
  const lastReview = { focus() { focused.push('last-review-path'); } };
  const firstReview = { focus() { focused.push('first-review-path'); } };
  const document = {
    getElementById(id) {
      if (id === 'copy-last-review') return { click() { clicks.lastReview += 1; }, addEventListener() {}, focus() { focused.push('copy-last-review'); } };
      if (id === 'copy-last-workbench') return { click() { clicks.lastWorkbench += 1; }, addEventListener() {}, focus() { focused.push('copy-last-workbench'); } };
      if (id === 'copy-version-line') return { click() {}, addEventListener() {}, focus() { focused.push('copy-version-line'); } };
      if (id === 'shortcuts') return { hidden: true };
      if (id === 'shortcuts-open') return { setAttribute() {}, addEventListener() {} };
      if (id === 'shortcuts-close') return { addEventListener() {} };
      if (id === 'skip-shortcuts') return { addEventListener() {} };
      return null;
    },
    querySelector(selector) {
      if (selector === '#workbenches article.workbench:last-of-type .review-path') return lastReview;
      if (selector === '#workbench-4 .review-path') return lastReview;
      if (selector === '#workbench-1 .review-path') return firstReview;
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
  const fire = (key, shiftKey = false) => {
    keydown({
      key,
      target: { tagName: 'BODY', closest() { return null; } },
      defaultPrevented: false,
      altKey: false,
      ctrlKey: false,
      metaKey: false,
      shiftKey,
      preventDefault() {},
    });
  };
  fire('{', true);
  fire('5', true);
  fire('6', true);
  fire('$', true);
  fire('r');
  fire('[', false);
  assert.equal(clicks.lastReview, 1);
  assert.equal(clicks.lastWorkbench, 1);
  assert.deepEqual(focused, ['copy-last-review', 'last-review-path', 'first-review-path', 'copy-version-line']);
  assert.deepEqual(assigned, []);
});

test('copy first review path control is distinct from Copy last review path and Copy first workbench heading', () => {
  assert.match(html, /id="copy-first-review"/);
  assert.match(html, />Copy first review path</);
  assert.match(html, /aria-keyshortcuts="7"/);
  assert.match(html, /id="copy-first-review-fallback"/);
  assert.match(html, /class="copy-first-review-fallback"/);
  assert.match(html, /textarea id="copy-first-review-fallback"/);
  assert.match(html, /id="copy-last-review"/);
  assert.match(html, />Copy last review path</);
  assert.match(html, /id="copy-first-workbench"/);
  assert.match(html, />Copy first workbench heading</);
  assert.match(html, /querySelector\('#workbenches article\.workbench \.review-path'\)/);
  assert.notEqual(html.match(/id="copy-first-review"/)?.[0], html.match(/id="copy-last-review"/)?.[0]);
  assert.notEqual(html.match(/id="copy-first-review"/)?.[0], html.match(/id="copy-first-workbench"/)?.[0]);
  assert.equal(html.indexOf('id="copy-first-review"') < html.indexOf('id="copy-last-review"'), true);
  assert.match(html, /@media print[\s\S]*\.copy-first-review-tools/);
  assert.match(html, /@media print[\s\S]*\.copy-first-review-fallback \{ display: none !important; \}/);
  assert.doesNotMatch(html, /hosted API/i);
});

test('copy first review path markdown is the first #workbenches article.workbench .review-path, or empty if missing', async () => {
  assert.match(html, /firstReviewMarkdown/);
  assert.match(html, /querySelector\('#workbenches article\.workbench \.review-path'\)/);
  assert.match(html, /firstReviewFallback\.hidden = false/);
  assert.match(html, /firstReviewFallback\.select\(\)/);
  assert.match(html, /This is the first review path, not a live product feed/);
  assert.match(html, /Copied an empty string/);
  let copied = '';
  let clickFirst = null;
  let firstPath = { textContent: 'Review constraints and negotiation room. Check cost allowances, feasible volume and operational conflicts before exporting a review packet.' };
  const document = {
    getElementById(id) {
      if (id === 'copy-first-review') return { addEventListener(name, handler) { if (name === 'click') clickFirst = handler; } };
      if (id === 'copy-first-review-status') return { textContent: '' };
      if (id === 'copy-first-review-fallback') return { hidden: true, value: '', focus() {}, select() {} };
      return null;
    },
    querySelector(selector) {
      return selector === '#workbenches article.workbench .review-path' ? firstPath : null;
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
  await clickFirst();
  assert.equal(copied, '- Review constraints and negotiation room. Check cost allowances, feasible volume and operational conflicts before exporting a review packet.');
  assert.doesNotMatch(copied, /\n/);
  assert.doesNotMatch(copied, /Review the timing behind the queue/);
  assert.doesNotMatch(copied, /live product feed/);
  firstPath = null;
  copied = 'stale';
  await clickFirst();
  assert.equal(copied, '');
});

test('copy first review path shows a visible textarea when clipboard is unavailable', async () => {
  let clickFirst = null;
  const fallback = { hidden: true, value: '', focused: false, selected: false, focus() { this.focused = true; }, select() { this.selected = true; } };
  const status = { textContent: '' };
  const document = {
    getElementById(id) {
      if (id === 'copy-first-review') return { addEventListener(name, handler) { if (name === 'click') clickFirst = handler; } };
      if (id === 'copy-first-review-status') return status;
      if (id === 'copy-first-review-fallback') return fallback;
      return null;
    },
    querySelector(selector) {
      return selector === '#workbenches article.workbench .review-path' ? { textContent: 'Review constraints and negotiation room. Check cost allowances, feasible volume and operational conflicts before exporting a review packet.' } : null;
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
  await clickFirst();
  assert.equal(fallback.hidden, false);
  assert.equal(fallback.focused, true);
  assert.equal(fallback.selected, true);
  assert.equal(fallback.value, '- Review constraints and negotiation room. Check cost allowances, feasible volume and operational conflicts before exporting a review packet.');
  assert.match(status.textContent, /Clipboard unavailable/);
  assert.match(status.textContent, /not a live product feed/);
});

test('keyboard 7 copies the first review path through its own control', () => {
  assert.match(html, /event\.key === '7'/);
  assert.match(html, /firstReviewBtn\?\.click\(\)/);
  assert.match(html, /inEditable\(event\.target\)/);
  assert.match(html, /aria-keyshortcuts="7"/);
  assert.match(html, /<kbd>7<\/kbd><\/dt><dd>Copy the first review path as one Markdown line from this catalog page, not a live product feed/);
  assert.match(html, /Press <kbd>7<\/kbd> to copy the first review path/);
  assert.match(html, /If that path is missing, this copies an empty string/);
  assert.match(html, /This is distinct from <kbd>\{\<\/kbd>, which copies the last review path/);
  assert.match(html, /from <kbd>r<\/kbd>, which focuses the first review path/);
  assert.match(html, /from <kbd>8<\/kbd>, which focuses Copy first review path/);
  assert.match(html, /<strong>First review path\.<\/strong>/);
  const clicks = { firstReview: 0, lastReview: 0 };
  const focused = [];
  const assigned = [];
  let keydown = null;
  const document = {
    getElementById(id) {
      if (id === 'copy-first-review') return { click() { clicks.firstReview += 1; }, addEventListener() {}, focus() { focused.push('copy-first-review'); } };
      if (id === 'copy-last-review') return { click() { clicks.lastReview += 1; }, addEventListener() {}, focus() { focused.push('copy-last-review'); } };
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
  const fire = (key, target, shiftKey = false) => {
    keydown({
      key,
      target,
      defaultPrevented: false,
      altKey: false,
      ctrlKey: false,
      metaKey: false,
      shiftKey,
      preventDefault() {},
    });
  };
  const input = { tagName: 'INPUT', closest() { return input; } };
  const textarea = { tagName: 'TEXTAREA', closest() { return textarea; } };
  const select = { tagName: 'SELECT', closest() { return select; } };
  const body = { tagName: 'BODY', closest() { return null; } };
  fire('7', input, true);
  fire('7', textarea, true);
  fire('7', select, true);
  assert.equal(clicks.firstReview, 0);
  assert.equal(clicks.lastReview, 0);
  assert.deepEqual(focused, []);
  assert.deepEqual(assigned, []);
  fire('7', body, true);
  assert.equal(clicks.firstReview, 1);
  assert.equal(clicks.lastReview, 0);
  assert.deepEqual(focused, []);
  assert.deepEqual(assigned, []);
  fire('{', body, true);
  assert.equal(clicks.lastReview, 1);
  assert.equal(clicks.firstReview, 1);
  assert.deepEqual(assigned, []);
});

test('keyboard 8 focuses Copy first review path when focus is not in an input', () => {
  assert.match(html, /event\.key === '8'/);
  assert.match(html, /getElementById\('copy-first-review'\) \|\| document\.getElementById\('workbenches-title'\) \|\| document\.getElementById\('workbenches'\)/);
  assert.match(html, /id="copy-first-review"/);
  assert.match(html, /id="workbenches-title"/);
  assert.match(html, /<kbd>8<\/kbd><\/dt><dd>Focus the Copy first review path control, or the workbenches heading if that control is missing. This key moves focus; it does not open a workbench. It does not copy./);
  assert.match(html, /Press <kbd>8<\/kbd> to focus Copy first review path/);
  assert.match(html, /This is distinct from <kbd>7<\/kbd>, which copies the first review path/);
  assert.match(html, /from <kbd>5<\/kbd>, which focuses Copy last review path/);
  assert.match(html, /from <kbd>9<\/kbd>, which focuses the first review path/);
  assert.match(html, /<strong>First-review jump\.<\/strong>/);
  assert.match(html, /inEditable\(event\.target\)/);
  assert.match(html, /const keys = \{ 1: 0, 2: 1, 3: 2, 4: 3 \}/);
  assert.doesNotMatch(html, /const keys = \{ 1: 0, 2: 1, 3: 2, 4: 3, 5:/);
  assert.doesNotMatch(html, /const keys = \{ 1: 0, 2: 1, 3: 2, 4: 3, 7:/);
  assert.doesNotMatch(html, /const keys = \{ 1: 0, 2: 1, 3: 2, 4: 3, 8:/);
  assert.doesNotMatch(html, /const keys = \{ 1: 0, 2: 1, 3: 2, 4: 3, 9:/);
  const focused = [];
  const clicks = { firstReview: 0, lastReview: 0 };
  const assigned = [];
  let keydown = null;
  const copyFirstReview = { focus() { focused.push('copy-first-review'); }, click() { clicks.firstReview += 1; }, addEventListener() {} };
  const heading = { focus() { focused.push('workbenches-title'); } };
  const document = {
    getElementById(id) {
      if (id === 'copy-first-review') return copyFirstReview;
      if (id === 'copy-last-review') return { click() { clicks.lastReview += 1; }, addEventListener() {}, focus() { focused.push('copy-last-review'); } };
      if (id === 'workbenches-title') return heading;
      if (id === 'workbenches') return { focus() { focused.push('workbenches'); } };
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
  const fire = (key, target, shiftKey = false) => {
    keydown({
      key,
      target,
      defaultPrevented: false,
      altKey: false,
      ctrlKey: false,
      metaKey: false,
      shiftKey,
      preventDefault() {},
    });
  };
  const input = { tagName: 'INPUT', closest() { return input; } };
  const textarea = { tagName: 'TEXTAREA', closest() { return textarea; } };
  const body = { tagName: 'BODY', closest() { return null; } };
  fire('8', input, false);
  fire('8', textarea, false);
  assert.deepEqual(focused, []);
  assert.equal(clicks.firstReview, 0);
  assert.deepEqual(assigned, []);
  fire('8', body, true);
  assert.deepEqual(focused, ['copy-first-review']);
  assert.equal(clicks.firstReview, 0);
  assert.equal(clicks.lastReview, 0);
  assert.deepEqual(assigned, []);
  fire('7', body, true);
  assert.equal(clicks.firstReview, 1);
  assert.deepEqual(focused, ['copy-first-review']);
  assert.deepEqual(assigned, []);
  fire('5', body, true);
  assert.deepEqual(focused, ['copy-first-review', 'copy-last-review']);
  assert.equal(clicks.lastReview, 0);
  assert.deepEqual(assigned, []);
});

test('keyboard 8 focuses the workbenches heading when Copy first review path is missing', () => {
  const focused = [];
  const assigned = [];
  let keydown = null;
  const heading = { focus() { focused.push('workbenches-title'); } };
  const document = {
    getElementById(id) {
      if (id === 'copy-first-review') return null;
      if (id === 'workbenches-title') return heading;
      if (id === 'workbenches') return { focus() { focused.push('workbenches'); } };
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
  keydown({
    key: '8',
    target: { tagName: 'BODY', closest() { return null; } },
    defaultPrevented: false,
    altKey: false,
    ctrlKey: false,
    metaKey: false,
    shiftKey: true,
    preventDefault() {},
  });
  assert.deepEqual(focused, ['workbenches-title']);
  assert.deepEqual(assigned, []);
});

test('keyboard 9 focuses the first review path when focus is not in an input', () => {
  assert.match(html, /event\.key === '9'/);
  assert.match(html, /querySelector\('#workbenches article\.workbench:first-of-type \.review-path'\)/);
  assert.match(html, /querySelector\('#workbench-1 \.review-path'\)/);
  assert.match(html, /<kbd>9<\/kbd><\/dt><dd>Focus the first review path on the first workbench card, or the workbenches heading if that path is missing. This key moves focus; it does not open a workbench. It does not copy./);
  assert.match(html, /Press <kbd>9<\/kbd> to focus the first review path/);
  assert.match(html, /This is distinct from <kbd>6<\/kbd>, which focuses the last review path on the last workbench card/);
  assert.match(html, /from <kbd>r<\/kbd>, which also focuses the first review path/);
  assert.match(html, /from <kbd>8<\/kbd>, which focuses Copy first review path/);
  assert.match(html, /<strong>First-path jump\.<\/strong>/);
  assert.match(html, /inEditable\(event\.target\)/);
  assert.match(html, /const keys = \{ 1: 0, 2: 1, 3: 2, 4: 3 \}/);
  assert.doesNotMatch(html, /const keys = \{ 1: 0, 2: 1, 3: 2, 4: 3, 9:/);
  assert.doesNotMatch(html, /const launchKeys = \{ 1: 0, 2: 1, 3: 2, 4: 3, 9:/);
  const focused = [];
  const clicks = { firstReview: 0, lastReview: 0 };
  const assigned = [];
  let keydown = null;
  const firstOfType = { focus() { focused.push('first-of-type-review-path'); } };
  const workbench1 = { focus() { focused.push('workbench-1-review-path'); } };
  const lastReview = { focus() { focused.push('last-review-path'); } };
  const document = {
    getElementById(id) {
      if (id === 'copy-first-review') return { click() { clicks.firstReview += 1; }, addEventListener() {}, focus() { focused.push('copy-first-review'); } };
      if (id === 'copy-last-review') return { click() { clicks.lastReview += 1; }, addEventListener() {}, focus() { focused.push('copy-last-review'); } };
      if (id === 'workbenches-title') return { focus() { focused.push('workbenches-title'); } };
      if (id === 'workbenches') return { focus() { focused.push('workbenches'); } };
      if (id === 'shortcuts') return { hidden: true };
      if (id === 'shortcuts-open') return { setAttribute() {}, addEventListener() {} };
      if (id === 'shortcuts-close') return { addEventListener() {} };
      if (id === 'skip-shortcuts') return { addEventListener() {} };
      return null;
    },
    querySelector(selector) {
      if (selector === '#workbenches article.workbench:first-of-type .review-path') return firstOfType;
      if (selector === '#workbench-1 .review-path') return workbench1;
      if (selector === '#workbenches article.workbench:last-of-type .review-path') return lastReview;
      if (selector === '#workbench-4 .review-path') return lastReview;
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
  const fire = (key, target, shiftKey = false) => {
    keydown({
      key,
      target,
      defaultPrevented: false,
      altKey: false,
      ctrlKey: false,
      metaKey: false,
      shiftKey,
      preventDefault() {},
    });
  };
  const input = { tagName: 'INPUT', closest() { return input; } };
  const textarea = { tagName: 'TEXTAREA', closest() { return textarea; } };
  const body = { tagName: 'BODY', closest() { return null; } };
  fire('9', input, false);
  fire('9', textarea, false);
  assert.deepEqual(focused, []);
  assert.equal(clicks.firstReview, 0);
  assert.deepEqual(assigned, []);
  fire('9', body, true);
  assert.deepEqual(focused, ['first-of-type-review-path']);
  assert.equal(clicks.firstReview, 0);
  assert.equal(clicks.lastReview, 0);
  assert.deepEqual(assigned, []);
  fire('r', body, false);
  assert.deepEqual(focused, ['first-of-type-review-path', 'workbench-1-review-path']);
  assert.equal(clicks.firstReview, 0);
  assert.deepEqual(assigned, []);
  fire('6', body, true);
  assert.deepEqual(focused, ['first-of-type-review-path', 'workbench-1-review-path', 'last-review-path']);
  assert.equal(clicks.lastReview, 0);
  assert.deepEqual(assigned, []);
});

test('keyboard 9 focuses the workbenches heading when the first review path is missing', () => {
  const focused = [];
  const assigned = [];
  let keydown = null;
  const heading = { focus() { focused.push('workbenches-title'); } };
  const document = {
    getElementById(id) {
      if (id === 'copy-first-review') return { focus() { focused.push('copy-first-review'); }, click() {}, addEventListener() {} };
      if (id === 'workbenches-title') return heading;
      if (id === 'workbenches') return { focus() { focused.push('workbenches'); } };
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
  keydown({
    key: '9',
    target: { tagName: 'BODY', closest() { return null; } },
    defaultPrevented: false,
    altKey: false,
    ctrlKey: false,
    metaKey: false,
    shiftKey: true,
    preventDefault() {},
  });
  assert.deepEqual(focused, ['workbenches-title']);
  assert.deepEqual(assigned, []);
});

test('7, 8, and 9 stay distinct from open-brace, 5, 6, r, and the 1-4 opener map', () => {
  assert.match(html, /event\.key === '7'/);
  assert.match(html, /event\.key === '8'/);
  assert.match(html, /event\.key === '9'/);
  assert.match(html, /event\.key === '\{'/);
  assert.match(html, /event\.key === '5'/);
  assert.match(html, /event\.key === '6'/);
  assert.match(html, /event\.key === 'r'/);
  assert.match(html, /firstReviewBtn\?\.click\(\)/);
  assert.match(html, /lastReviewBtn\?\.click\(\)/);
  assert.match(html, /getElementById\('copy-first-review'\) \|\| document\.getElementById\('workbenches-title'\)/);
  assert.match(html, /getElementById\('copy-last-review'\) \|\| document\.getElementById\('workbenches-title'\)/);
  assert.match(html, /querySelector\('#workbenches article\.workbench:first-of-type \.review-path'\)/);
  assert.match(html, /querySelector\('#workbench-1 \.review-path'\)\?\.focus\(\)/);
  assert.match(html, /const keys = \{ 1: 0, 2: 1, 3: 2, 4: 3 \}/);
  assert.match(html, /const launchKeys = \{ 1: 0, 2: 1, 3: 2, 4: 3 \}/);
  assert.doesNotMatch(html, /const keys = \{ 1: 0, 2: 1, 3: 2, 4: 3, 5:/);
  assert.doesNotMatch(html, /const keys = \{ 1: 0, 2: 1, 3: 2, 4: 3, 7:/);
  assert.doesNotMatch(html, /const keys = \{ 1: 0, 2: 1, 3: 2, 4: 3, 8:/);
  assert.doesNotMatch(html, /const keys = \{ 1: 0, 2: 1, 3: 2, 4: 3, 9:/);
  assert.doesNotMatch(html, /const launchKeys = \{ 1: 0, 2: 1, 3: 2, 4: 3, 7:/);
  assert.match(readme, /Press `7` to copy the first review path/);
  assert.match(readme, /Press `8` to focus the Copy first review path control/);
  assert.match(readme, /Press `9` to focus the first review path/);
  const clicks = { firstReview: 0, lastReview: 0 };
  const focused = [];
  const assigned = [];
  let keydown = null;
  const firstOfType = { focus() { focused.push('first-of-type-review-path'); } };
  const workbench1 = { focus() { focused.push('workbench-1-review-path'); } };
  const lastReview = { focus() { focused.push('last-review-path'); } };
  const opens = [
    { href: 'apps/partnership-breakpoint/standalone.html' },
    { href: 'apps/common-cart/standalone.html' },
    { href: 'apps/smallest-agreement/standalone.html' },
    { href: 'apps/weekend-gap/standalone.html' },
  ];
  const document = {
    getElementById(id) {
      if (id === 'copy-first-review') return { click() { clicks.firstReview += 1; }, addEventListener() {}, focus() { focused.push('copy-first-review'); } };
      if (id === 'copy-last-review') return { click() { clicks.lastReview += 1; }, addEventListener() {}, focus() { focused.push('copy-last-review'); } };
      if (id === 'shortcuts') return { hidden: true };
      if (id === 'shortcuts-open') return { setAttribute() {}, addEventListener() {} };
      if (id === 'shortcuts-close') return { addEventListener() {} };
      if (id === 'skip-shortcuts') return { addEventListener() {} };
      return null;
    },
    querySelector(selector) {
      if (selector === '#workbenches article.workbench:first-of-type .review-path') return firstOfType;
      if (selector === '#workbench-1 .review-path') return workbench1;
      if (selector === '#workbenches article.workbench:last-of-type .review-path') return lastReview;
      if (selector === '#workbench-4 .review-path') return lastReview;
      return null;
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
    localStorage: { getItem: () => null, setItem() {} },
    window: { location: { assign(href) { assigned.push(href); } } },
  });
  const fire = (key, shiftKey = false) => {
    keydown({
      key,
      target: { tagName: 'BODY', closest() { return null; } },
      defaultPrevented: false,
      altKey: false,
      ctrlKey: false,
      metaKey: false,
      shiftKey,
      preventDefault() {},
    });
  };
  fire('7', true);
  fire('8', true);
  fire('9', true);
  fire('{', true);
  fire('5', true);
  fire('6', true);
  fire('r');
  assert.equal(clicks.firstReview, 1);
  assert.equal(clicks.lastReview, 1);
  assert.deepEqual(focused, ['copy-first-review', 'first-of-type-review-path', 'copy-last-review', 'last-review-path', 'workbench-1-review-path']);
  assert.deepEqual(assigned, []);
  fire('1');
  assert.deepEqual(assigned, ['apps/partnership-breakpoint/standalone.html']);
  fire('7', true);
  fire('8', true);
  fire('9', true);
  assert.equal(clicks.firstReview, 2);
  assert.deepEqual(assigned, ['apps/partnership-breakpoint/standalone.html']);
});

test('copy first Open href control is distinct from Copy first review path and Copy last review path', () => {
  assert.match(html, /id="copy-first-open"/);
  assert.match(html, />Copy first Open href</);
  assert.match(html, /aria-keyshortcuts="0"/);
  assert.match(html, /id="copy-first-open-fallback"/);
  assert.match(html, /class="copy-first-open-fallback"/);
  assert.match(html, /textarea id="copy-first-open-fallback"/);
  assert.match(html, /id="copy-first-review"/);
  assert.match(html, />Copy first review path</);
  assert.match(html, /id="copy-last-review"/);
  assert.match(html, />Copy last review path</);
  assert.match(html, /querySelector\('#workbenches a\.open'\)/);
  assert.match(html, /getAttribute\?\.\('href'\)/);
  assert.notEqual(html.match(/id="copy-first-open"/)?.[0], html.match(/id="copy-first-review"/)?.[0]);
  assert.notEqual(html.match(/id="copy-first-open"/)?.[0], html.match(/id="copy-last-review"/)?.[0]);
  assert.equal(html.indexOf('id="copy-first-open"') < html.indexOf('id="copy-first-review"'), true);
  assert.match(html, /@media print[\s\S]*\.copy-first-open-tools/);
  assert.match(html, /@media print[\s\S]*\.copy-first-open-fallback \{ display: none !important; \}/);
  assert.doesNotMatch(html, /hosted API/i);
});

test('copy first Open href markdown is the first #workbenches a.open href, or empty if missing', async () => {
  assert.match(html, /firstOpenMarkdown/);
  assert.match(html, /querySelector\('#workbenches a\.open'\)/);
  assert.match(html, /firstOpenFallback\.hidden = false/);
  assert.match(html, /firstOpenFallback\.select\(\)/);
  assert.match(html, /This is the first Open workbench href, not a live product feed/);
  assert.match(html, /Copied an empty string/);
  let copied = '';
  let clickFirst = null;
  let firstOpen = {
    getAttribute(name) { return name === 'href' ? 'apps/partnership-breakpoint/standalone.html' : null; },
  };
  const document = {
    getElementById(id) {
      if (id === 'copy-first-open') return { addEventListener(name, handler) { if (name === 'click') clickFirst = handler; } };
      if (id === 'copy-first-open-status') return { textContent: '' };
      if (id === 'copy-first-open-fallback') return { hidden: true, value: '', focus() {}, select() {} };
      return null;
    },
    querySelector(selector) {
      return selector === '#workbenches a.open' ? firstOpen : null;
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
  await clickFirst();
  assert.equal(copied, '- apps/partnership-breakpoint/standalone.html');
  assert.doesNotMatch(copied, /\n/);
  assert.doesNotMatch(copied, /Review constraints and negotiation room/);
  assert.doesNotMatch(copied, /live product feed/);
  firstOpen = null;
  copied = 'stale';
  await clickFirst();
  assert.equal(copied, '');
});

test('copy first Open href shows a visible textarea when clipboard is unavailable', async () => {
  let clickFirst = null;
  const fallback = { hidden: true, value: '', focused: false, selected: false, focus() { this.focused = true; }, select() { this.selected = true; } };
  const status = { textContent: '' };
  const document = {
    getElementById(id) {
      if (id === 'copy-first-open') return { addEventListener(name, handler) { if (name === 'click') clickFirst = handler; } };
      if (id === 'copy-first-open-status') return status;
      if (id === 'copy-first-open-fallback') return fallback;
      return null;
    },
    querySelector(selector) {
      return selector === '#workbenches a.open'
        ? { getAttribute(name) { return name === 'href' ? 'apps/partnership-breakpoint/standalone.html' : null; } }
        : null;
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
  await clickFirst();
  assert.equal(fallback.hidden, false);
  assert.equal(fallback.focused, true);
  assert.equal(fallback.selected, true);
  assert.equal(fallback.value, '- apps/partnership-breakpoint/standalone.html');
  assert.match(status.textContent, /Clipboard unavailable/);
  assert.match(status.textContent, /not a live product feed/);
});

test('keyboard 0 copies the first Open workbench href through its own control', () => {
  assert.match(html, /event\.key === '0'/);
  assert.match(html, /firstOpenBtn\?\.click\(\)/);
  assert.match(html, /inEditable\(event\.target\)/);
  assert.match(html, /aria-keyshortcuts="0"/);
  assert.match(html, /<kbd>0<\/kbd><\/dt><dd>Copy the first Open workbench href as one Markdown line from this catalog page, not a live product feed/);
  assert.match(html, /Press <kbd>0<\/kbd> to copy the first Open workbench href/);
  assert.match(html, /If that href is missing, this copies an empty string/);
  assert.match(html, /This is distinct from <kbd>\\<\/kbd>, which focuses Copy first Open href/);
  assert.match(html, /from <kbd>s<\/kbd>, which focuses the first Open workbench link/);
  assert.match(html, /<strong>First Open href\.<\/strong>/);
  assert.match(html, /const keys = \{ 1: 0, 2: 1, 3: 2, 4: 3 \}/);
  assert.match(html, /const launchKeys = \{ 1: 0, 2: 1, 3: 2, 4: 3 \}/);
  assert.doesNotMatch(html, /const keys = \{ 1: 0, 2: 1, 3: 2, 4: 3, 0:/);
  assert.doesNotMatch(html, /const launchKeys = \{ 1: 0, 2: 1, 3: 2, 4: 3, 0:/);
  const clicks = { firstOpen: 0, firstReview: 0, lastReview: 0 };
  const focused = [];
  const assigned = [];
  let keydown = null;
  const document = {
    getElementById(id) {
      if (id === 'copy-first-open') return { click() { clicks.firstOpen += 1; }, addEventListener() {}, focus() { focused.push('copy-first-open'); } };
      if (id === 'copy-first-review') return { click() { clicks.firstReview += 1; }, addEventListener() {}, focus() { focused.push('copy-first-review'); } };
      if (id === 'copy-last-review') return { click() { clicks.lastReview += 1; }, addEventListener() {}, focus() { focused.push('copy-last-review'); } };
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
  const fire = (key, target, shiftKey = false) => {
    keydown({
      key,
      target,
      defaultPrevented: false,
      altKey: false,
      ctrlKey: false,
      metaKey: false,
      shiftKey,
      preventDefault() {},
    });
  };
  const input = { tagName: 'INPUT', closest() { return input; } };
  const textarea = { tagName: 'TEXTAREA', closest() { return textarea; } };
  const select = { tagName: 'SELECT', closest() { return select; } };
  const body = { tagName: 'BODY', closest() { return null; } };
  fire('0', input, true);
  fire('0', textarea, true);
  fire('0', select, true);
  assert.equal(clicks.firstOpen, 0);
  assert.equal(clicks.firstReview, 0);
  assert.deepEqual(focused, []);
  assert.deepEqual(assigned, []);
  fire('0', body, true);
  assert.equal(clicks.firstOpen, 1);
  assert.equal(clicks.firstReview, 0);
  assert.deepEqual(focused, []);
  assert.deepEqual(assigned, []);
  fire('7', body, true);
  assert.equal(clicks.firstReview, 1);
  assert.equal(clicks.firstOpen, 1);
  assert.deepEqual(assigned, []);
});

test('keyboard backslash focuses Copy first Open href when focus is not in an input', () => {
  assert.match(html, /event\.key === '\\\\'/);
  assert.match(html, /getElementById\('copy-first-open'\) \|\| document\.getElementById\('catalog-heading'\) \|\| document\.getElementById\('workbenches-title'\) \|\| document\.getElementById\('workbenches'\)/);
  assert.match(html, /id="copy-first-open"/);
  assert.match(html, /id="catalog-heading"/);
  assert.match(html, /id="workbenches-title"/);
  assert.match(html, /<kbd>\\<\/kbd><\/dt><dd>Focus the Copy first Open href control, or the catalog heading or workbenches heading if that control is missing. This key moves focus; it does not open a workbench. It does not copy./);
  assert.match(html, /Press <kbd>\\<\/kbd> to focus Copy first Open href/);
  assert.match(html, /This is distinct from <kbd>0<\/kbd>, which copies the first Open workbench href/);
  assert.match(html, /from <kbd>s<\/kbd>, which focuses the first Open workbench link/);
  assert.match(html, /from <kbd>\]<\/kbd>, which focuses the last Open workbench link/);
  assert.match(html, /<strong>First-open jump\.<\/strong>/);
  assert.match(html, /inEditable\(event\.target\)/);
  assert.match(html, /const keys = \{ 1: 0, 2: 1, 3: 2, 4: 3 \}/);
  assert.doesNotMatch(html, /const keys = \{ 1: 0, 2: 1, 3: 2, 4: 3, 0:/);
  assert.doesNotMatch(html, /const launchKeys = \{ 1: 0, 2: 1, 3: 2, 4: 3, 0:/);
  const focused = [];
  const clicks = { firstOpen: 0, firstReview: 0 };
  const assigned = [];
  let keydown = null;
  const copyFirstOpen = { focus() { focused.push('copy-first-open'); }, click() { clicks.firstOpen += 1; }, addEventListener() {} };
  const heading = { focus() { focused.push('catalog-heading'); } };
  const document = {
    getElementById(id) {
      if (id === 'copy-first-open') return copyFirstOpen;
      if (id === 'copy-first-review') return { click() { clicks.firstReview += 1; }, addEventListener() {}, focus() { focused.push('copy-first-review'); } };
      if (id === 'catalog-heading') return heading;
      if (id === 'workbenches-title') return { focus() { focused.push('workbenches-title'); } };
      if (id === 'workbenches') return { focus() { focused.push('workbenches'); } };
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
  const fire = (key, target, shiftKey = false) => {
    keydown({
      key,
      target,
      defaultPrevented: false,
      altKey: false,
      ctrlKey: false,
      metaKey: false,
      shiftKey,
      preventDefault() {},
    });
  };
  const input = { tagName: 'INPUT', closest() { return input; } };
  const textarea = { tagName: 'TEXTAREA', closest() { return textarea; } };
  const body = { tagName: 'BODY', closest() { return null; } };
  fire('\\', input, false);
  fire('\\', textarea, false);
  assert.deepEqual(focused, []);
  assert.equal(clicks.firstOpen, 0);
  assert.deepEqual(assigned, []);
  fire('\\', body, false);
  assert.deepEqual(focused, ['copy-first-open']);
  assert.equal(clicks.firstOpen, 0);
  assert.equal(clicks.firstReview, 0);
  assert.deepEqual(assigned, []);
  fire('0', body, true);
  assert.equal(clicks.firstOpen, 1);
  assert.deepEqual(focused, ['copy-first-open']);
  assert.deepEqual(assigned, []);
  fire('8', body, true);
  assert.deepEqual(focused, ['copy-first-open', 'copy-first-review']);
  assert.equal(clicks.firstReview, 0);
  assert.deepEqual(assigned, []);
});

test('keyboard backslash focuses the catalog heading when Copy first Open href is missing', () => {
  const focused = [];
  const assigned = [];
  let keydown = null;
  const heading = { focus() { focused.push('catalog-heading'); } };
  const document = {
    getElementById(id) {
      if (id === 'copy-first-open') return null;
      if (id === 'catalog-heading') return heading;
      if (id === 'workbenches-title') return { focus() { focused.push('workbenches-title'); } };
      if (id === 'workbenches') return { focus() { focused.push('workbenches'); } };
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
  keydown({
    key: '\\',
    target: { tagName: 'BODY', closest() { return null; } },
    defaultPrevented: false,
    altKey: false,
    ctrlKey: false,
    metaKey: false,
    shiftKey: false,
    preventDefault() {},
  });
  assert.deepEqual(focused, ['catalog-heading']);
  assert.deepEqual(assigned, []);
});

test('keyboard backslash focuses the workbenches heading when Copy first Open href and catalog heading are missing', () => {
  const focused = [];
  const assigned = [];
  let keydown = null;
  const heading = { focus() { focused.push('workbenches-title'); } };
  const document = {
    getElementById(id) {
      if (id === 'copy-first-open') return null;
      if (id === 'catalog-heading') return null;
      if (id === 'workbenches-title') return heading;
      if (id === 'workbenches') return { focus() { focused.push('workbenches'); } };
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
  keydown({
    key: '\\',
    target: { tagName: 'BODY', closest() { return null; } },
    defaultPrevented: false,
    altKey: false,
    ctrlKey: false,
    metaKey: false,
    shiftKey: false,
    preventDefault() {},
  });
  assert.deepEqual(focused, ['workbenches-title']);
  assert.deepEqual(assigned, []);
});

test('0, backslash, and s stay distinct from last-review, first-review, last-open, and the 1-4 opener map', () => {
  assert.match(html, /event\.key === '0'/);
  assert.match(html, /event\.key === '\\\\'/);
  assert.match(html, /event\.key === 's'/);
  assert.match(html, /event\.key === '\]'/);
  assert.match(html, /event\.key === '\{'/);
  assert.match(html, /event\.key === '5'/);
  assert.match(html, /event\.key === '6'/);
  assert.match(html, /event\.key === '7'/);
  assert.match(html, /event\.key === '8'/);
  assert.match(html, /event\.key === '9'/);
  assert.match(html, /firstOpenBtn\?\.click\(\)/);
  assert.match(html, /firstReviewBtn\?\.click\(\)/);
  assert.match(html, /lastReviewBtn\?\.click\(\)/);
  assert.match(html, /getElementById\('copy-first-open'\) \|\| document\.getElementById\('catalog-heading'\)/);
  assert.match(html, /querySelector\('#workbenches a\.open'\)\?\.focus\(\)/);
  assert.match(html, /<strong>First-open-link jump\.<\/strong>/);
  assert.match(html, /const keys = \{ 1: 0, 2: 1, 3: 2, 4: 3 \}/);
  assert.match(html, /const launchKeys = \{ 1: 0, 2: 1, 3: 2, 4: 3 \}/);
  assert.doesNotMatch(html, /const keys = \{ 1: 0, 2: 1, 3: 2, 4: 3, 0:/);
  assert.doesNotMatch(html, /const launchKeys = \{ 1: 0, 2: 1, 3: 2, 4: 3, 0:/);
  assert.match(readme, /Press `0` to copy the first Open workbench href/);
  assert.match(readme, /Press `\\` to focus the Copy first Open href control/);
  assert.match(readme, /Press `s` to focus the first Open\s+workbench link/);
  const clicks = { firstOpen: 0, firstReview: 0, lastReview: 0 };
  const focused = [];
  const assigned = [];
  let keydown = null;
  const firstOpenLink = { focus() { focused.push('first-open-link'); }, href: 'apps/partnership-breakpoint/standalone.html' };
  const lastOpen = { focus() { focused.push('last-open'); }, href: 'apps/weekend-gap/standalone.html' };
  const opens = [firstOpenLink, lastOpen];
  const document = {
    getElementById(id) {
      if (id === 'copy-first-open') return { click() { clicks.firstOpen += 1; }, addEventListener() {}, focus() { focused.push('copy-first-open'); } };
      if (id === 'copy-first-review') return { click() { clicks.firstReview += 1; }, addEventListener() {}, focus() { focused.push('copy-first-review'); } };
      if (id === 'copy-last-review') return { click() { clicks.lastReview += 1; }, addEventListener() {}, focus() { focused.push('copy-last-review'); } };
      if (id === 'workbenches-title') return { focus() { focused.push('workbenches-title'); } };
      if (id === 'workbenches') return { focus() { focused.push('workbenches'); } };
      if (id === 'catalog-heading') return { focus() { focused.push('catalog-heading'); } };
      if (id === 'shortcuts') return { hidden: true };
      if (id === 'shortcuts-open') return { setAttribute() {}, addEventListener() {} };
      if (id === 'shortcuts-close') return { addEventListener() {} };
      if (id === 'skip-shortcuts') return { addEventListener() {} };
      return null;
    },
    querySelector(selector) {
      if (selector === '#workbenches a.open') return firstOpenLink;
      if (selector === '#workbenches article.workbench:first-of-type .review-path') return { focus() { focused.push('first-of-type-review-path'); } };
      if (selector === '#workbench-1 .review-path') return { focus() { focused.push('workbench-1-review-path'); } };
      if (selector === '#workbenches article.workbench:last-of-type .review-path') return { focus() { focused.push('last-review-path'); } };
      if (selector === '#workbench-4 .review-path') return { focus() { focused.push('last-review-path'); } };
      return null;
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
    localStorage: { getItem: () => null, setItem() {} },
    window: { location: { assign(href) { assigned.push(href); } } },
  });
  const fire = (key, shiftKey = false) => {
    keydown({
      key,
      target: { tagName: 'BODY', closest() { return null; } },
      defaultPrevented: false,
      altKey: false,
      ctrlKey: false,
      metaKey: false,
      shiftKey,
      preventDefault() {},
    });
  };
  fire('0', true);
  fire('\\', false);
  fire('s');
  fire(']');
  fire('{', true);
  fire('5', true);
  fire('6', true);
  fire('7', true);
  fire('8', true);
  fire('9', true);
  assert.equal(clicks.firstOpen, 1);
  assert.equal(clicks.firstReview, 1);
  assert.equal(clicks.lastReview, 1);
  assert.deepEqual(focused, ['copy-first-open', 'first-open-link', 'last-open', 'copy-last-review', 'last-review-path', 'copy-first-review', 'first-of-type-review-path']);
  assert.deepEqual(assigned, []);
  fire('1');
  assert.deepEqual(assigned, ['apps/partnership-breakpoint/standalone.html']);
  fire('0', true);
  fire('\\', false);
  fire('s');
  assert.equal(clicks.firstOpen, 2);
  assert.deepEqual(assigned, ['apps/partnership-breakpoint/standalone.html']);
});


test('What\'s new and README name last-open copy, last-open jump, and last-open-link jump without changing workbench versions', () => {
  const news = html.slice(html.indexOf('id="whats-new"'), html.indexOf('id="workbenches"'));
  const headings = [...news.matchAll(/<h3[^>]*>([^<]+)<\/h3>/g)].map((match) => match[1]);
  assert.equal(headings[0], 'Last-skip-text copy, last-skip-text jump, and last-skip-target jump');
  assert.equal(headings.includes('First-skip-text copy, first-skip-text jump, and skip-nav jump'), true);
  assert.equal(headings.includes('Last-skip copy, last-skip jump, and last-skip-link jump'), true);
  assert.equal(headings.includes('First-skip copy, first-skip jump, and first-skip-link jump'), true);
  assert.equal(headings.includes('Last-open copy, last-open jump, and last-open-link jump'), true);
  assert.equal(headings.includes('First-open copy, first-open jump, and first-open-link jump'), true);
  assert.equal(headings.includes('First-review copy, first-review jump, and first-path jump'), true);
  assert.equal(headings.includes('Last-review copy, last-review jump, and last-path jump'), true);
  assert.equal(headings[headings.length - 1], 'Saturday late bank open, last-open-FX copy, and weekend-FX-open hide in Weekend Gap 1.5.22');
  assert.match(html, /Copy last Open href through Home as Markdown/);
  assert.match(html, /jump to that control with keyboard End/);
  assert.match(html, /jump to the last Open workbench link with keyboard right bracket/);
  assert.match(html, /The branded 404 page can copy the last Open workbench href without adding a public path/);
  assert.match(html, /They do not change workbench versions and they do not call a live product feed/);
  assert.match(html, /These are in-page catalog tools/);
  assert.match(readme, /last-open copy, last-open jump, and last-open-link jump/);
  assert.match(readme, /That What's new entry is hub-only. It does not change workbench versions/);
  assert.match(readme, /Copy last Open href on\s+that 404 page copies/);
  assert.match(readme, /Copy last Open href copies the last Open workbench href/);
  assert.match(readme, /Press `Home` to copy the last Open workbench href/);
  assert.match(readme, /Press `End` to focus the Copy last Open href control/);
  assert.match(readme, /Press `\]` to focus the last Open\s+workbench link/);
  assert.match(readme, /Key `Home` copies the last Open workbench href/);
  assert.match(readme, /Key `End` focuses the Copy last Open href control/);
  assert.doesNotMatch(html, /hosted API/i);
  assert.doesNotMatch(html, /live service/i);
});

test('copy last Open href control is distinct from Copy first Open href and Copy last review path', () => {
  assert.match(html, /id="copy-last-open"/);
  assert.match(html, />Copy last Open href</);
  assert.match(html, /aria-keyshortcuts="Home"/);
  assert.match(html, /id="copy-last-open-fallback"/);
  assert.match(html, /class="copy-last-open-fallback"/);
  assert.match(html, /textarea id="copy-last-open-fallback"/);
  assert.match(html, /id="copy-first-open"/);
  assert.match(html, />Copy first Open href</);
  assert.match(html, /id="copy-last-review"/);
  assert.match(html, />Copy last review path</);
  assert.match(html, /querySelectorAll\('#workbenches a\.open'\)/);
  assert.notEqual(html.match(/id="copy-last-open"/)?.[0], html.match(/id="copy-first-open"/)?.[0]);
  assert.notEqual(html.match(/id="copy-last-open"/)?.[0], html.match(/id="copy-last-review"/)?.[0]);
  assert.equal(html.indexOf('id="copy-first-open"') < html.indexOf('id="copy-last-open"'), true);
  assert.equal(html.indexOf('id="copy-last-open"') < html.indexOf('id="copy-first-review"'), true);
  assert.match(html, /@media print[\s\S]*\.copy-last-open-tools/);
  assert.match(html, /@media print[\s\S]*\.copy-last-open-fallback \{ display: none !important; \}/);
  assert.doesNotMatch(html, /hosted API/i);
});

test('copy last Open href markdown is the last #workbenches a.open href, or empty if missing', async () => {
  assert.match(html, /lastOpenMarkdown/);
  assert.match(html, /querySelectorAll\('#workbenches a\.open'\)/);
  assert.match(html, /lastOpenFallback\.hidden = false/);
  assert.match(html, /lastOpenFallback\.select\(\)/);
  assert.match(html, /This is the last Open workbench href, not a live product feed/);
  assert.match(html, /Copied an empty string/);
  let copied = '';
  let clickLast = null;
  let opens = [
    { getAttribute(name) { return name === 'href' ? 'apps/partnership-breakpoint/standalone.html' : null; } },
    { getAttribute(name) { return name === 'href' ? 'apps/weekend-gap/standalone.html' : null; } },
  ];
  const document = {
    getElementById(id) {
      if (id === 'copy-last-open') return { addEventListener(name, handler) { if (name === 'click') clickLast = handler; } };
      if (id === 'copy-last-open-status') return { textContent: '' };
      if (id === 'copy-last-open-fallback') return { hidden: true, value: '', focus() {}, select() {} };
      return null;
    },
    querySelector: () => null,
    querySelectorAll(selector) {
      return selector === '#workbenches a.open' ? opens : [];
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
  await clickLast();
  assert.equal(copied, '- apps/weekend-gap/standalone.html');
  assert.doesNotMatch(copied, /\n/);
  assert.doesNotMatch(copied, /apps\/partnership-breakpoint\/standalone\.html/);
  assert.doesNotMatch(copied, /live product feed/);
  opens = [];
  copied = 'stale';
  await clickLast();
  assert.equal(copied, '');
});

test('copy last Open href shows a visible textarea when clipboard is unavailable', async () => {
  let clickLast = null;
  const fallback = { hidden: true, value: '', focused: false, selected: false, focus() { this.focused = true; }, select() { this.selected = true; } };
  const status = { textContent: '' };
  const document = {
    getElementById(id) {
      if (id === 'copy-last-open') return { addEventListener(name, handler) { if (name === 'click') clickLast = handler; } };
      if (id === 'copy-last-open-status') return status;
      if (id === 'copy-last-open-fallback') return fallback;
      return null;
    },
    querySelector: () => null,
    querySelectorAll(selector) {
      return selector === '#workbenches a.open'
        ? [{ getAttribute(name) { return name === 'href' ? 'apps/weekend-gap/standalone.html' : null; } }]
        : [];
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
  await clickLast();
  assert.equal(fallback.hidden, false);
  assert.equal(fallback.focused, true);
  assert.equal(fallback.selected, true);
  assert.equal(fallback.value, '- apps/weekend-gap/standalone.html');
  assert.match(status.textContent, /Clipboard unavailable/);
  assert.match(status.textContent, /not a live product feed/);
});

test('keyboard Home copies the last Open workbench href through its own control', () => {
  assert.match(html, /event\.key === 'Home'/);
  assert.match(html, /lastOpenBtn\?\.click\(\)/);
  assert.match(html, /inEditable\(event\.target\)/);
  assert.match(html, /aria-keyshortcuts="Home"/);
  assert.match(html, /<kbd>Home<\/kbd><\/dt><dd>Copy the last Open workbench href as one Markdown line from this catalog page, not a live product feed/);
  assert.match(html, /Press <kbd>Home<\/kbd> to copy the last Open workbench href/);
  assert.match(html, /If that href is missing, this copies an empty string/);
  assert.match(html, /This is distinct from <kbd>0<\/kbd>, which copies the first Open workbench href/);
  assert.match(html, /from <kbd>End<\/kbd>, which focuses Copy last Open href/);
  assert.match(html, /from <kbd>\]<\/kbd>, which focuses the last Open workbench link/);
  assert.match(html, /<strong>Last Open href\.<\/strong>/);
  assert.match(html, /const keys = \{ 1: 0, 2: 1, 3: 2, 4: 3 \}/);
  assert.match(html, /const launchKeys = \{ 1: 0, 2: 1, 3: 2, 4: 3 \}/);
  assert.doesNotMatch(html, /const keys = \{ 1: 0, 2: 1, 3: 2, 4: 3, Home:/);
  assert.doesNotMatch(html, /const launchKeys = \{ 1: 0, 2: 1, 3: 2, 4: 3, Home:/);
  const clicks = { lastOpen: 0, firstOpen: 0, firstReview: 0, lastReview: 0 };
  const focused = [];
  const assigned = [];
  let keydown = null;
  const document = {
    getElementById(id) {
      if (id === 'copy-last-open') return { click() { clicks.lastOpen += 1; }, addEventListener() {}, focus() { focused.push('copy-last-open'); } };
      if (id === 'copy-first-open') return { click() { clicks.firstOpen += 1; }, addEventListener() {}, focus() { focused.push('copy-first-open'); } };
      if (id === 'copy-first-review') return { click() { clicks.firstReview += 1; }, addEventListener() {}, focus() { focused.push('copy-first-review'); } };
      if (id === 'copy-last-review') return { click() { clicks.lastReview += 1; }, addEventListener() {}, focus() { focused.push('copy-last-review'); } };
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
  const fire = (key, target, shiftKey = false) => {
    keydown({
      key,
      target,
      defaultPrevented: false,
      altKey: false,
      ctrlKey: false,
      metaKey: false,
      shiftKey,
      preventDefault() {},
    });
  };
  const input = { tagName: 'INPUT', closest() { return input; } };
  const textarea = { tagName: 'TEXTAREA', closest() { return textarea; } };
  const select = { tagName: 'SELECT', closest() { return select; } };
  const body = { tagName: 'BODY', closest() { return null; } };
  fire('Home', input);
  fire('Home', textarea);
  fire('Home', select);
  assert.equal(clicks.lastOpen, 0);
  assert.equal(clicks.firstOpen, 0);
  assert.deepEqual(focused, []);
  assert.deepEqual(assigned, []);
  fire('Home', body);
  assert.equal(clicks.lastOpen, 1);
  assert.equal(clicks.firstOpen, 0);
  assert.deepEqual(focused, []);
  assert.deepEqual(assigned, []);
  fire('0', body, true);
  assert.equal(clicks.firstOpen, 1);
  assert.equal(clicks.lastOpen, 1);
  assert.deepEqual(assigned, []);
});

test('keyboard End focuses Copy last Open href when focus is not in an input', () => {
  assert.match(html, /event\.key === 'End'/);
  assert.match(html, /getElementById\('copy-last-open'\) \|\| document\.getElementById\('catalog-heading'\) \|\| document\.getElementById\('workbenches-title'\) \|\| document\.getElementById\('workbenches'\)/);
  assert.match(html, /id="copy-last-open"/);
  assert.match(html, /id="catalog-heading"/);
  assert.match(html, /id="workbenches-title"/);
  assert.match(html, /<kbd>End<\/kbd><\/dt><dd>Focus the Copy last Open href control, or the catalog heading or workbenches heading if that control is missing. This key moves focus; it does not open a workbench. It does not copy./);
  assert.match(html, /Press <kbd>End<\/kbd> to focus Copy last Open href/);
  assert.match(html, /This is distinct from <kbd>Home<\/kbd>, which copies the last Open workbench href/);
  assert.match(html, /from <kbd>0<\/kbd>, which copies the first Open workbench href/);
  assert.match(html, /from <kbd>\]<\/kbd>, which focuses the last Open workbench link/);
  assert.match(html, /<strong>Last-open jump\.<\/strong>/);
  assert.match(html, /inEditable\(event\.target\)/);
  assert.match(html, /const keys = \{ 1: 0, 2: 1, 3: 2, 4: 3 \}/);
  assert.doesNotMatch(html, /const keys = \{ 1: 0, 2: 1, 3: 2, 4: 3, Home:/);
  assert.doesNotMatch(html, /const launchKeys = \{ 1: 0, 2: 1, 3: 2, 4: 3, Home:/);
  const focused = [];
  const clicks = { lastOpen: 0, firstOpen: 0 };
  const assigned = [];
  let keydown = null;
  const copyLastOpen = { focus() { focused.push('copy-last-open'); }, click() { clicks.lastOpen += 1; }, addEventListener() {} };
  const heading = { focus() { focused.push('catalog-heading'); } };
  const document = {
    getElementById(id) {
      if (id === 'copy-last-open') return copyLastOpen;
      if (id === 'copy-first-open') return { click() { clicks.firstOpen += 1; }, addEventListener() {}, focus() { focused.push('copy-first-open'); } };
      if (id === 'catalog-heading') return heading;
      if (id === 'workbenches-title') return { focus() { focused.push('workbenches-title'); } };
      if (id === 'workbenches') return { focus() { focused.push('workbenches'); } };
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
  const fire = (key, target, shiftKey = false) => {
    keydown({
      key,
      target,
      defaultPrevented: false,
      altKey: false,
      ctrlKey: false,
      metaKey: false,
      shiftKey,
      preventDefault() {},
    });
  };
  const input = { tagName: 'INPUT', closest() { return input; } };
  const textarea = { tagName: 'TEXTAREA', closest() { return textarea; } };
  const body = { tagName: 'BODY', closest() { return null; } };
  fire('End', input, false);
  fire('End', textarea, false);
  assert.deepEqual(focused, []);
  assert.equal(clicks.lastOpen, 0);
  assert.deepEqual(assigned, []);
  fire('End', body, false);
  assert.deepEqual(focused, ['copy-last-open']);
  assert.equal(clicks.lastOpen, 0);
  assert.equal(clicks.firstOpen, 0);
  assert.deepEqual(assigned, []);
  fire('Home', body, false);
  assert.equal(clicks.lastOpen, 1);
  assert.deepEqual(focused, ['copy-last-open']);
  assert.deepEqual(assigned, []);
  fire('\\', body, false);
  assert.deepEqual(focused, ['copy-last-open', 'copy-first-open']);
  assert.equal(clicks.firstOpen, 0);
  assert.deepEqual(assigned, []);
});

test('keyboard End focuses the catalog heading when Copy last Open href is missing', () => {
  const focused = [];
  const assigned = [];
  let keydown = null;
  const heading = { focus() { focused.push('catalog-heading'); } };
  const document = {
    getElementById(id) {
      if (id === 'copy-last-open') return null;
      if (id === 'catalog-heading') return heading;
      if (id === 'workbenches-title') return { focus() { focused.push('workbenches-title'); } };
      if (id === 'workbenches') return { focus() { focused.push('workbenches'); } };
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
  keydown({
    key: 'End',
    target: { tagName: 'BODY', closest() { return null; } },
    defaultPrevented: false,
    altKey: false,
    ctrlKey: false,
    metaKey: false,
    shiftKey: false,
    preventDefault() {},
  });
  assert.deepEqual(focused, ['catalog-heading']);
  assert.deepEqual(assigned, []);
});

test('Home, End, and ] stay distinct from first-open, last-review, first-review, and the 1-4 opener map', () => {
  assert.match(html, /event\.key === 'Home'/);
  assert.match(html, /event\.key === 'End'/);
  assert.match(html, /event\.key === '\]'/);
  assert.match(html, /event\.key === '0'/);
  assert.match(html, /event\.key === '\\\\'/);
  assert.match(html, /event\.key === 's'/);
  assert.match(html, /lastOpenBtn\?\.click\(\)/);
  assert.match(html, /firstOpenBtn\?\.click\(\)/);
  assert.match(html, /getElementById\('copy-last-open'\) \|\| document\.getElementById\('catalog-heading'\)/);
  assert.match(html, /<strong>Last-open-link jump\.<\/strong>/);
  assert.match(html, /const keys = \{ 1: 0, 2: 1, 3: 2, 4: 3 \}/);
  assert.match(html, /const launchKeys = \{ 1: 0, 2: 1, 3: 2, 4: 3 \}/);
  assert.doesNotMatch(html, /const keys = \{ 1: 0, 2: 1, 3: 2, 4: 3, Home:/);
  assert.doesNotMatch(html, /const launchKeys = \{ 1: 0, 2: 1, 3: 2, 4: 3, Home:/);
  assert.match(readme, /Press `Home` to copy the last Open workbench href/);
  assert.match(readme, /Press `End` to focus the Copy last Open href control/);
  const clicks = { lastOpen: 0, firstOpen: 0, firstReview: 0, lastReview: 0 };
  const focused = [];
  const assigned = [];
  let keydown = null;
  const firstOpenLink = { focus() { focused.push('first-open-link'); }, href: 'apps/partnership-breakpoint/standalone.html' };
  const lastOpen = { focus() { focused.push('last-open'); }, href: 'apps/weekend-gap/standalone.html' };
  const opens = [firstOpenLink, lastOpen];
  const document = {
    getElementById(id) {
      if (id === 'copy-last-open') return { click() { clicks.lastOpen += 1; }, addEventListener() {}, focus() { focused.push('copy-last-open'); } };
      if (id === 'copy-first-open') return { click() { clicks.firstOpen += 1; }, addEventListener() {}, focus() { focused.push('copy-first-open'); } };
      if (id === 'copy-first-review') return { click() { clicks.firstReview += 1; }, addEventListener() {}, focus() { focused.push('copy-first-review'); } };
      if (id === 'copy-last-review') return { click() { clicks.lastReview += 1; }, addEventListener() {}, focus() { focused.push('copy-last-review'); } };
      if (id === 'workbenches-title') return { focus() { focused.push('workbenches-title'); } };
      if (id === 'workbenches') return { focus() { focused.push('workbenches'); } };
      if (id === 'catalog-heading') return { focus() { focused.push('catalog-heading'); } };
      if (id === 'shortcuts') return { hidden: true };
      if (id === 'shortcuts-open') return { setAttribute() {}, addEventListener() {} };
      if (id === 'shortcuts-close') return { addEventListener() {} };
      if (id === 'skip-shortcuts') return { addEventListener() {} };
      return null;
    },
    querySelector(selector) {
      if (selector === '#workbenches a.open') return firstOpenLink;
      return null;
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
    localStorage: { getItem: () => null, setItem() {} },
    window: { location: { assign(href) { assigned.push(href); } } },
  });
  const fire = (key, shiftKey = false) => {
    keydown({
      key,
      target: { tagName: 'BODY', closest() { return null; } },
      defaultPrevented: false,
      altKey: false,
      ctrlKey: false,
      metaKey: false,
      shiftKey,
      preventDefault() {},
    });
  };
  fire('Home');
  fire('End');
  fire(']');
  fire('0', true);
  fire('\\', false);
  fire('s');
  assert.equal(clicks.lastOpen, 1);
  assert.equal(clicks.firstOpen, 1);
  assert.deepEqual(focused, ['copy-last-open', 'last-open', 'copy-first-open', 'first-open-link']);
  assert.deepEqual(assigned, []);
  fire('1');
  assert.deepEqual(assigned, ['apps/partnership-breakpoint/standalone.html']);
  fire('Home');
  fire('End');
  assert.equal(clicks.lastOpen, 2);
  assert.deepEqual(assigned, ['apps/partnership-breakpoint/standalone.html']);
});

test('What\'s new and README name first-skip copy, first-skip jump, and first-skip-link jump without changing workbench versions', () => {
  const news = html.slice(html.indexOf('id="whats-new"'), html.indexOf('id="workbenches"'));
  const headings = [...news.matchAll(/<h3[^>]*>([^<]+)<\/h3>/g)].map((match) => match[1]);
  assert.equal(headings[0], 'Last-skip-text copy, last-skip-text jump, and last-skip-target jump');
  assert.equal(headings.includes('First-skip-text copy, first-skip-text jump, and skip-nav jump'), true);
  assert.equal(headings.includes('Last-skip copy, last-skip jump, and last-skip-link jump'), true);
  assert.equal(headings.includes('First-skip copy, first-skip jump, and first-skip-link jump'), true);
  assert.equal(headings.includes('Last-open copy, last-open jump, and last-open-link jump'), true);
  assert.equal(headings.includes('First-open copy, first-open jump, and first-open-link jump'), true);
  assert.equal(headings[headings.length - 1], 'Saturday late bank open, last-open-FX copy, and weekend-FX-open hide in Weekend Gap 1.5.22');
  assert.match(html, /Copy first skip href through PageUp as Markdown/);
  assert.match(html, /jump to that control with keyboard PageDown/);
  assert.match(html, /jump to the first skip link with keyboard ArrowRight/);
  assert.match(html, /The branded 404 page can copy the first skip-link href without adding a public path/);
  assert.match(html, /They do not change workbench versions and they do not call a live product feed/);
  assert.match(html, /These are in-page catalog tools/);
  assert.match(readme, /first-skip copy, first-skip jump, and first-skip-link jump/);
  assert.match(readme, /That What's new entry is hub-only. It does not change workbench versions/);
  assert.match(readme, /Copy first skip href on\s+that 404 page copies/);
  assert.match(readme, /Copy first skip href copies the first skip-link href/);
  assert.match(readme, /Press `PageUp` to copy the first skip-link href/);
  assert.match(readme, /Press `PageDown` to focus the Copy first skip href control/);
  assert.match(readme, /Press `ArrowRight` to focus the first skip link/);
  assert.match(readme, /Key `PageUp` copies the first skip-link href/);
  assert.match(readme, /Key `PageDown` focuses the Copy first skip href control/);
  assert.match(readme, /Key `ArrowRight` focuses the first skip link/);
  assert.doesNotMatch(html, /hosted API/i);
  assert.doesNotMatch(html, /live service/i);
});

test('copy first skip href control is distinct from Copy skip links and Copy first Open href', () => {
  assert.match(html, /id="copy-first-skip"/);
  assert.match(html, />Copy first skip href</);
  assert.match(html, /aria-keyshortcuts="PageUp"/);
  assert.match(html, /id="copy-first-skip-fallback"/);
  assert.match(html, /class="copy-first-skip-fallback"/);
  assert.match(html, /textarea id="copy-first-skip-fallback"/);
  assert.match(html, /id="copy-skips"/);
  assert.match(html, />Copy skip links</);
  assert.match(html, /id="copy-first-open"/);
  assert.match(html, />Copy first Open href</);
  assert.match(html, /querySelector\('#skips a\.skip'\)/);
  assert.notEqual(html.match(/id="copy-first-skip"/)?.[0], html.match(/id="copy-skips"/)?.[0]);
  assert.notEqual(html.match(/id="copy-first-skip"/)?.[0], html.match(/id="copy-first-open"/)?.[0]);
  assert.match(html, /@media print[\s\S]*\.copy-first-skip-tools/);
  assert.match(html, /@media print[\s\S]*\.copy-first-skip-fallback \{ display: none !important; \}/);
  assert.doesNotMatch(html, /hosted API/i);
});

test('copy first skip href markdown is the first #skips a.skip href, or empty if missing', async () => {
  assert.match(html, /firstSkipMarkdown/);
  assert.match(html, /querySelector\('#skips a\.skip'\)/);
  assert.match(html, /firstSkipFallback\.hidden = false/);
  assert.match(html, /firstSkipFallback\.select\(\)/);
  assert.match(html, /This is the first skip-link href, not a live product feed/);
  assert.match(html, /Copied an empty string/);
  let copied = '';
  let clickFirst = null;
  let skip = { getAttribute(name) { return name === 'href' ? '#whats-new' : null; } };
  const document = {
    getElementById(id) {
      if (id === 'copy-first-skip') return { addEventListener(name, handler) { if (name === 'click') clickFirst = handler; } };
      if (id === 'copy-first-skip-status') return { textContent: '' };
      if (id === 'copy-first-skip-fallback') return { hidden: true, value: '', focus() {}, select() {} };
      return null;
    },
    querySelector(selector) {
      return selector === '#skips a.skip' ? skip : null;
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
  await clickFirst();
  assert.equal(copied, '- #whats-new');
  assert.doesNotMatch(copied, /\n/);
  skip = null;
  copied = 'stale';
  await clickFirst();
  assert.equal(copied, '');
});

test('keyboard PageUp copies first skip href when focus is not in an input', () => {
  assert.match(html, /event\.key === 'PageUp'/);
  assert.match(html, /firstSkipBtn\?\.click\(\)/);
  assert.match(html, /const keys = \{ 1: 0, 2: 1, 3: 2, 4: 3 \}/);
  assert.doesNotMatch(html, /const keys = \{ 1: 0, 2: 1, 3: 2, 4: 3, PageUp:/);
  assert.doesNotMatch(html, /const launchKeys = \{ 1: 0, 2: 1, 3: 2, 4: 3, PageUp:/);
  const clicks = { firstSkip: 0, lastOpen: 0 };
  const focused = [];
  const assigned = [];
  let keydown = null;
  const document = {
    getElementById(id) {
      if (id === 'copy-first-skip') return { click() { clicks.firstSkip += 1; }, addEventListener() {}, focus() { focused.push('copy-first-skip'); } };
      if (id === 'copy-last-open') return { click() { clicks.lastOpen += 1; }, addEventListener() {}, focus() { focused.push('copy-last-open'); } };
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
  fire('PageUp', input);
  assert.equal(clicks.firstSkip, 0);
  fire('PageUp', body);
  assert.equal(clicks.firstSkip, 1);
  assert.equal(clicks.lastOpen, 0);
  assert.deepEqual(assigned, []);
});

test('keyboard PageDown focuses Copy first skip href and ArrowRight focuses the first skip link', () => {
  assert.match(html, /event\.key === 'PageDown'/);
  assert.match(html, /event\.key === 'ArrowRight'/);
  assert.match(html, /getElementById\('copy-first-skip'\) \|\| document\.getElementById\('skips'\) \|\| document\.getElementById\('catalog-heading'\)/);
  assert.match(html, /querySelector\('#skips a\.skip'\) \|\| document\.getElementById\('skips'\) \|\| document\.getElementById\('catalog-heading'\)/);
  assert.doesNotMatch(html, /const launchKeys = \{ 1: 0, 2: 1, 3: 2, 4: 3, PageDown:/);
  const focused = [];
  const clicks = { firstSkip: 0 };
  const assigned = [];
  let keydown = null;
  const firstSkip = { focus() { focused.push('first-skip-link'); } };
  const document = {
    getElementById(id) {
      if (id === 'copy-first-skip') return { click() { clicks.firstSkip += 1; }, addEventListener() {}, focus() { focused.push('copy-first-skip'); } };
      if (id === 'skips') return { focus() { focused.push('skips'); } };
      if (id === 'catalog-heading') return { focus() { focused.push('catalog-heading'); } };
      if (id === 'shortcuts') return { hidden: true };
      if (id === 'shortcuts-open') return { setAttribute() {}, addEventListener() {} };
      if (id === 'shortcuts-close') return { addEventListener() {} };
      if (id === 'skip-shortcuts') return { addEventListener() {} };
      return null;
    },
    querySelector(selector) {
      return selector === '#skips a.skip' ? firstSkip : null;
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
  const fire = (key) => {
    keydown({
      key,
      target: { tagName: 'BODY', closest() { return null; } },
      defaultPrevented: false,
      altKey: false,
      ctrlKey: false,
      metaKey: false,
      shiftKey: false,
      preventDefault() {},
    });
  };
  fire('PageDown');
  fire('ArrowRight');
  assert.equal(clicks.firstSkip, 0);
  assert.deepEqual(focused, ['copy-first-skip', 'first-skip-link']);
  assert.deepEqual(assigned, []);
});

test('What\'s new and README name last-skip copy, last-skip jump, and last-skip-link jump without changing workbench versions', () => {
  const news = html.slice(html.indexOf('id="whats-new"'), html.indexOf('id="workbenches"'));
  const headings = [...news.matchAll(/<h3[^>]*>([^<]+)<\/h3>/g)].map((match) => match[1]);
  assert.equal(headings[0], 'Last-skip-text copy, last-skip-text jump, and last-skip-target jump');
  assert.equal(headings.includes('First-skip-text copy, first-skip-text jump, and skip-nav jump'), true);
  assert.equal(headings.includes('Last-skip copy, last-skip jump, and last-skip-link jump'), true);
  assert.equal(headings.includes('First-skip copy, first-skip jump, and first-skip-link jump'), true);
  assert.equal(headings.includes('Last-open copy, last-open jump, and last-open-link jump'), true);
  assert.equal(headings.includes('First-open copy, first-open jump, and first-open-link jump'), true);
  assert.equal(headings[headings.length - 1], 'Saturday late bank open, last-open-FX copy, and weekend-FX-open hide in Weekend Gap 1.5.22');
  assert.match(html, /Copy last skip href through Insert as Markdown/);
  assert.match(html, /jump to that control with keyboard ArrowDown/);
  assert.match(html, /jump to the last skip link with keyboard ArrowLeft/);
  assert.match(html, /The branded 404 page can copy the last skip-link href without adding a public path/);
  assert.match(html, /They do not change workbench versions and they do not call a live product feed/);
  assert.match(html, /These are in-page catalog tools/);
  assert.match(readme, /last-skip copy, last-skip jump, and last-skip-link jump/);
  assert.match(readme, /That What's new entry is hub-only. It does not change workbench versions/);
  assert.match(readme, /Copy last skip href on\s+that 404 page copies/);
  assert.match(readme, /Copy last skip href copies the last skip-link href/);
  assert.match(readme, /Press `Insert` to copy the last skip-link href/);
  assert.match(readme, /Press `ArrowDown` to focus the Copy last skip href control/);
  assert.match(readme, /Press `ArrowLeft` to focus the last skip link/);
  assert.match(readme, /Key `Insert` copies the last skip-link href/);
  assert.match(readme, /Key `ArrowDown` focuses the Copy last skip href control/);
  assert.match(readme, /Key `ArrowLeft` focuses the last skip link/);
  assert.doesNotMatch(html, /hosted API/i);
  assert.doesNotMatch(html, /live service/i);
});

test('copy last skip href control is distinct from Copy first skip href and Copy skip links', () => {
  assert.match(html, /id="copy-last-skip"/);
  assert.match(html, />Copy last skip href</);
  assert.match(html, /aria-keyshortcuts="Insert"/);
  assert.match(html, /id="copy-last-skip-fallback"/);
  assert.match(html, /class="copy-last-skip-fallback"/);
  assert.match(html, /textarea id="copy-last-skip-fallback"/);
  assert.match(html, /id="copy-first-skip"/);
  assert.match(html, />Copy first skip href</);
  assert.match(html, /id="copy-skips"/);
  assert.match(html, />Copy skip links</);
  assert.match(html, /querySelectorAll\('#skips a\.skip'\)/);
  assert.notEqual(html.match(/id="copy-last-skip"/)?.[0], html.match(/id="copy-first-skip"/)?.[0]);
  assert.notEqual(html.match(/id="copy-last-skip"/)?.[0], html.match(/id="copy-skips"/)?.[0]);
  assert.equal(html.indexOf('id="copy-first-skip"') < html.indexOf('id="copy-last-skip"'), true);
  assert.match(html, /@media print[\s\S]*\.copy-last-skip-tools/);
  assert.match(html, /@media print[\s\S]*\.copy-last-skip-fallback \{ display: none !important; \}/);
  assert.doesNotMatch(html, /hosted API/i);
});

test('copy last skip href markdown is the last #skips a.skip href, or empty if missing', async () => {
  assert.match(html, /lastSkipMarkdown/);
  assert.match(html, /querySelectorAll\('#skips a\.skip'\)/);
  assert.match(html, /lastSkipFallback\.hidden = false/);
  assert.match(html, /lastSkipFallback\.select\(\)/);
  assert.match(html, /This is the last skip-link href, not a live product feed/);
  assert.match(html, /Copied an empty string/);
  let copied = '';
  let clickLast = null;
  let skips = [
    { getAttribute(name) { return name === 'href' ? '#whats-new' : null; } },
    { getAttribute(name) { return name === 'href' ? '#version-line' : null; } },
  ];
  const document = {
    getElementById(id) {
      if (id === 'copy-last-skip') return { addEventListener(name, handler) { if (name === 'click') clickLast = handler; } };
      if (id === 'copy-last-skip-status') return { textContent: '' };
      if (id === 'copy-last-skip-fallback') return { hidden: true, value: '', focus() {}, select() {} };
      return null;
    },
    querySelector: () => null,
    querySelectorAll(selector) {
      return selector === '#skips a.skip' ? skips : [];
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
  await clickLast();
  assert.equal(copied, '- #version-line');
  assert.doesNotMatch(copied, /\n/);
  assert.doesNotMatch(copied, /#whats-new/);
  skips = [];
  copied = 'stale';
  await clickLast();
  assert.equal(copied, '');
});

test('keyboard Insert copies last skip href when focus is not in an input', () => {
  assert.match(html, /event\.key === 'Insert'/);
  assert.match(html, /lastSkipBtn\?\.click\(\)/);
  assert.match(html, /const keys = \{ 1: 0, 2: 1, 3: 2, 4: 3 \}/);
  assert.doesNotMatch(html, /const keys = \{ 1: 0, 2: 1, 3: 2, 4: 3, Insert:/);
  assert.doesNotMatch(html, /const launchKeys = \{ 1: 0, 2: 1, 3: 2, 4: 3, Insert:/);
  const clicks = { lastSkip: 0, firstSkip: 0, lastOpen: 0 };
  const focused = [];
  const assigned = [];
  let keydown = null;
  const document = {
    getElementById(id) {
      if (id === 'copy-last-skip') return { click() { clicks.lastSkip += 1; }, addEventListener() {}, focus() { focused.push('copy-last-skip'); } };
      if (id === 'copy-first-skip') return { click() { clicks.firstSkip += 1; }, addEventListener() {}, focus() { focused.push('copy-first-skip'); } };
      if (id === 'copy-last-open') return { click() { clicks.lastOpen += 1; }, addEventListener() {}, focus() { focused.push('copy-last-open'); } };
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
  fire('Insert', input);
  assert.equal(clicks.lastSkip, 0);
  fire('Insert', body);
  assert.equal(clicks.lastSkip, 1);
  assert.equal(clicks.firstSkip, 0);
  assert.equal(clicks.lastOpen, 0);
  assert.deepEqual(assigned, []);
});

test('keyboard ArrowDown focuses Copy last skip href and ArrowLeft focuses the last skip link', () => {
  assert.match(html, /event\.key === 'ArrowDown'/);
  assert.match(html, /event\.key === 'ArrowLeft'/);
  assert.match(html, /getElementById\('copy-last-skip'\) \|\| document\.getElementById\('skips'\) \|\| document\.getElementById\('catalog-heading'\)/);
  assert.match(html, /querySelectorAll\('#skips a\.skip'\)/);
  assert.doesNotMatch(html, /const launchKeys = \{ 1: 0, 2: 1, 3: 2, 4: 3, ArrowDown:/);
  assert.doesNotMatch(html, /const launchKeys = \{ 1: 0, 2: 1, 3: 2, 4: 3, ArrowLeft:/);
  const focused = [];
  const clicks = { lastSkip: 0, firstSkip: 0 };
  const assigned = [];
  let keydown = null;
  const firstSkip = { focus() { focused.push('first-skip-link'); } };
  const lastSkip = { focus() { focused.push('last-skip-link'); } };
  const document = {
    getElementById(id) {
      if (id === 'copy-last-skip') return { click() { clicks.lastSkip += 1; }, addEventListener() {}, focus() { focused.push('copy-last-skip'); } };
      if (id === 'copy-first-skip') return { click() { clicks.firstSkip += 1; }, addEventListener() {}, focus() { focused.push('copy-first-skip'); } };
      if (id === 'skips') return { focus() { focused.push('skips'); } };
      if (id === 'catalog-heading') return { focus() { focused.push('catalog-heading'); } };
      if (id === 'shortcuts') return { hidden: true };
      if (id === 'shortcuts-open') return { setAttribute() {}, addEventListener() {} };
      if (id === 'shortcuts-close') return { addEventListener() {} };
      if (id === 'skip-shortcuts') return { addEventListener() {} };
      return null;
    },
    querySelector(selector) {
      return selector === '#skips a.skip' ? firstSkip : null;
    },
    querySelectorAll(selector) {
      return selector === '#skips a.skip' ? [firstSkip, lastSkip] : [];
    },
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
  const fire = (key) => {
    keydown({
      key,
      target: { tagName: 'BODY', closest() { return null; } },
      defaultPrevented: false,
      altKey: false,
      ctrlKey: false,
      metaKey: false,
      shiftKey: false,
      preventDefault() {},
    });
  };
  fire('ArrowDown');
  fire('ArrowLeft');
  assert.equal(clicks.lastSkip, 0);
  assert.equal(clicks.firstSkip, 0);
  assert.deepEqual(focused, ['copy-last-skip', 'last-skip-link']);
  assert.deepEqual(assigned, []);
});

test('What\'s new and README name first-skip-text copy, first-skip-text jump, and skip-nav jump without changing workbench versions', () => {
  const news = html.slice(html.indexOf('id="whats-new"'), html.indexOf('id="workbenches"'));
  const headings = [...news.matchAll(/<h3[^>]*>([^<]+)<\/h3>/g)].map((match) => match[1]);
  assert.equal(headings[0], 'Last-skip-text copy, last-skip-text jump, and last-skip-target jump');
  assert.equal(headings.includes('First-skip-text copy, first-skip-text jump, and skip-nav jump'), true);
  assert.equal(headings.includes('Last-skip copy, last-skip jump, and last-skip-link jump'), true);
  assert.equal(headings.includes('First-skip copy, first-skip jump, and first-skip-link jump'), true);
  assert.equal(headings.includes('Last-open copy, last-open jump, and last-open-link jump'), true);
  assert.equal(headings.includes('First-open copy, first-open jump, and first-open-link jump'), true);
  assert.equal(headings[headings.length - 1], 'Saturday late bank open, last-open-FX copy, and weekend-FX-open hide in Weekend Gap 1.5.22');
  assert.match(html, /Copy first skip text through Delete as Markdown/);
  assert.match(html, /jump to that control with keyboard ArrowUp/);
  assert.match(html, /jump to the skip nav with keyboard F2/);
  assert.match(html, /The branded 404 page can copy the first skip-link text without adding a public path/);
  assert.match(html, /They do not change workbench versions and they do not call a live product feed/);
  assert.match(html, /These are in-page catalog tools/);
  assert.match(readme, /first-skip-text copy, first-skip-text jump, and skip-nav jump/);
  assert.match(readme, /That What's new entry is hub-only. It does not change workbench versions/);
  assert.match(readme, /Copy first skip text on\s+that 404 page copies/);
  assert.match(readme, /Copy first skip text copies the first skip-link text/);
  assert.match(readme, /Press `Delete` to copy the first skip-link text/);
  assert.match(readme, /Press `ArrowUp` to focus the Copy first skip text control/);
  assert.match(readme, /Press `F2` to focus the skip nav/);
  assert.match(readme, /Key `Delete` copies the first skip-link text/);
  assert.match(readme, /Key `ArrowUp` focuses the Copy first skip text control/);
  assert.match(readme, /Key `F2` focuses the skip nav/);
  assert.doesNotMatch(html, /hosted API/i);
  assert.doesNotMatch(html, /live service/i);
});

test('copy first skip text control is distinct from Copy first skip href and Copy last skip href', () => {
  assert.match(html, /id="copy-first-skip-text"/);
  assert.match(html, />Copy first skip text</);
  assert.match(html, /aria-keyshortcuts="Delete"/);
  assert.match(html, /id="copy-first-skip-text-fallback"/);
  assert.match(html, /class="copy-first-skip-text-fallback"/);
  assert.match(html, /textarea id="copy-first-skip-text-fallback"/);
  assert.match(html, /id="copy-first-skip"/);
  assert.match(html, />Copy first skip href</);
  assert.match(html, /id="copy-last-skip"/);
  assert.match(html, />Copy last skip href</);
  assert.match(html, /id="copy-skips"/);
  assert.match(html, />Copy skip links</);
  assert.match(html, /firstSkipTextMarkdown/);
  assert.notEqual(html.match(/id="copy-first-skip-text"/)?.[0], html.match(/id="copy-first-skip"/)?.[0]);
  assert.notEqual(html.match(/id="copy-first-skip-text"/)?.[0], html.match(/id="copy-last-skip"/)?.[0]);
  assert.notEqual(html.match(/id="copy-first-skip-text"/)?.[0], html.match(/id="copy-skips"/)?.[0]);
  assert.equal(html.indexOf('id="copy-first-skip"') < html.indexOf('id="copy-last-skip"'), true);
  assert.equal(html.indexOf('id="copy-last-skip"') < html.indexOf('id="copy-first-skip-text"'), true);
  assert.match(html, /@media print[\s\S]*\.copy-first-skip-text-tools/);
  assert.match(html, /@media print[\s\S]*\.copy-first-skip-text-fallback \{ display: none !important; \}/);
  assert.doesNotMatch(html, /hosted API/i);
});

test('copy first skip text markdown is the first #skips a.skip text, or empty if missing', async () => {
  assert.match(html, /firstSkipTextMarkdown/);
  assert.match(html, /querySelector\('#skips a\.skip'\)/);
  assert.match(html, /firstSkipTextFallback\.hidden = false/);
  assert.match(html, /firstSkipTextFallback\.select\(\)/);
  assert.match(html, /This is the first skip-link text, not a live product feed/);
  assert.match(html, /Copied an empty string/);
  let copied = '';
  let clickFirst = null;
  let skip = { textContent: "Skip to what's new" };
  const document = {
    getElementById(id) {
      if (id === 'copy-first-skip-text') return { addEventListener(name, handler) { if (name === 'click') clickFirst = handler; } };
      if (id === 'copy-first-skip-text-status') return { textContent: '' };
      if (id === 'copy-first-skip-text-fallback') return { hidden: true, value: '', focus() {}, select() {} };
      return null;
    },
    querySelector(selector) {
      return selector === '#skips a.skip' ? skip : null;
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
  await clickFirst();
  assert.equal(copied, "- Skip to what's new");
  assert.doesNotMatch(copied, /\n/);
  assert.doesNotMatch(copied, /#whats-new/);
  skip = null;
  copied = 'stale';
  await clickFirst();
  assert.equal(copied, '');
});

test('keyboard Delete copies first skip text when focus is not in an input', () => {
  assert.match(html, /event\.key === 'Delete'/);
  assert.match(html, /firstSkipTextBtn\?\.click\(\)/);
  assert.match(html, /const keys = \{ 1: 0, 2: 1, 3: 2, 4: 3 \}/);
  assert.doesNotMatch(html, /const keys = \{ 1: 0, 2: 1, 3: 2, 4: 3, Delete:/);
  assert.doesNotMatch(html, /const launchKeys = \{ 1: 0, 2: 1, 3: 2, 4: 3, Delete:/);
  const clicks = { firstSkipText: 0, firstSkip: 0, lastSkip: 0, lastOpen: 0 };
  const focused = [];
  const assigned = [];
  let keydown = null;
  const document = {
    getElementById(id) {
      if (id === 'copy-first-skip-text') return { click() { clicks.firstSkipText += 1; }, addEventListener() {}, focus() { focused.push('copy-first-skip-text'); } };
      if (id === 'copy-first-skip') return { click() { clicks.firstSkip += 1; }, addEventListener() {}, focus() { focused.push('copy-first-skip'); } };
      if (id === 'copy-last-skip') return { click() { clicks.lastSkip += 1; }, addEventListener() {}, focus() { focused.push('copy-last-skip'); } };
      if (id === 'copy-last-open') return { click() { clicks.lastOpen += 1; }, addEventListener() {}, focus() { focused.push('copy-last-open'); } };
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
  fire('Delete', input);
  assert.equal(clicks.firstSkipText, 0);
  fire('Delete', body);
  assert.equal(clicks.firstSkipText, 1);
  assert.equal(clicks.firstSkip, 0);
  assert.equal(clicks.lastSkip, 0);
  assert.equal(clicks.lastOpen, 0);
  assert.deepEqual(assigned, []);
});

test('keyboard ArrowUp focuses Copy first skip text and F2 focuses the skip nav', () => {
  assert.match(html, /event\.key === 'ArrowUp'/);
  assert.match(html, /event\.key === 'F2'/);
  assert.match(html, /getElementById\('copy-first-skip-text'\) \|\| document\.getElementById\('skips'\) \|\| document\.getElementById\('catalog-heading'\)/);
  assert.match(html, /\(document\.getElementById\('skips'\) \|\| document\.getElementById\('catalog-heading'\)\)\?\.focus\(\)/);
  assert.doesNotMatch(html, /const launchKeys = \{ 1: 0, 2: 1, 3: 2, 4: 3, ArrowUp:/);
  assert.doesNotMatch(html, /const launchKeys = \{ 1: 0, 2: 1, 3: 2, 4: 3, F2:/);
  const focused = [];
  const clicks = { firstSkipText: 0, firstSkip: 0, lastSkip: 0 };
  const assigned = [];
  let keydown = null;
  const firstSkip = { focus() { focused.push('first-skip-link'); } };
  const document = {
    getElementById(id) {
      if (id === 'copy-first-skip-text') return { click() { clicks.firstSkipText += 1; }, addEventListener() {}, focus() { focused.push('copy-first-skip-text'); } };
      if (id === 'copy-first-skip') return { click() { clicks.firstSkip += 1; }, addEventListener() {}, focus() { focused.push('copy-first-skip'); } };
      if (id === 'copy-last-skip') return { click() { clicks.lastSkip += 1; }, addEventListener() {}, focus() { focused.push('copy-last-skip'); } };
      if (id === 'skips') return { focus() { focused.push('skips'); } };
      if (id === 'catalog-heading') return { focus() { focused.push('catalog-heading'); } };
      if (id === 'shortcuts') return { hidden: true };
      if (id === 'shortcuts-open') return { setAttribute() {}, addEventListener() {} };
      if (id === 'shortcuts-close') return { addEventListener() {} };
      if (id === 'skip-shortcuts') return { addEventListener() {} };
      return null;
    },
    querySelector(selector) {
      return selector === '#skips a.skip' ? firstSkip : null;
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
  const fire = (key) => {
    keydown({
      key,
      target: { tagName: 'BODY', closest() { return null; } },
      defaultPrevented: false,
      altKey: false,
      ctrlKey: false,
      metaKey: false,
      shiftKey: false,
      preventDefault() {},
    });
  };
  fire('ArrowUp');
  fire('F2');
  assert.equal(clicks.firstSkipText, 0);
  assert.equal(clicks.firstSkip, 0);
  assert.equal(clicks.lastSkip, 0);
  assert.deepEqual(focused, ['copy-first-skip-text', 'skips']);
  assert.deepEqual(assigned, []);
});
