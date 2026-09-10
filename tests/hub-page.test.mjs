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
  assert.match(html, /id="how-it-works" tabindex="-1"/);
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
  assert.match(html, /Volume-to-hold, stress CSV, and studio preset in Partnership Breakpoint 1\.4\.2/);
  assert.match(html, /Roster export, file compare, and marketplace preset in Partnership Breakpoint 1\.4\.3/);
  assert.match(html, /Waterfall SVG, compare jump, and licensor preset in Partnership Breakpoint 1\.5\.1/);
  assert.match(html, /Leftover fill and overlap counts in Common Cart 1\.3\.1/);
  assert.match(html, /Offer CSV, sort, and leftover headroom in Common Cart 1\.3\.2/);
  assert.match(html, /Offer export, variant filter, and empty-offer recovery in Common Cart 1\.3\.3/);
  assert.match(html, /Buyer CSV, leftover jump, and garden preset in Common Cart 1\.4\.1/);
  assert.match(html, /Package pin, locks, and notes in The Smallest Agreement 1\.4\.1/);
  assert.match(html, /Facilitator pack and group CSV in The Smallest Agreement 1\.4\.2/);
  assert.match(html, /Clause CSV, veto filter, and quiet-hours preset in The Smallest Agreement 1\.4\.3/);
  assert.match(html, /Locked-clause filter, fixture-night preset, and package copy in The Smallest Agreement 1\.5\.1/);
  assert.match(html, /Queue-clear hours and Gantt compare in Weekend Gap 1\.4\.1/);
  assert.match(html, /Queue CSV, peak jump, and long-weekend preset in Weekend Gap 1\.4\.2/);
  assert.match(html, /Dashboard copy, file compare, and compressed Friday in Weekend Gap 1\.4\.3/);
  assert.match(html, /Gantt hour copy, payday burst, and dashboard CSV in Weekend Gap 1\.5\.1/);
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
  assert.match(readme, /waterfall SVG download, compare and print keys/);
  assert.match(readme, /package pin, locks, and notes/);
  assert.match(readme, /facilitator pack, group CSV/);
  assert.match(readme, /clause CSV\s+import, veto-only filter/);
  assert.match(readme, /locked-clause filter, Sports Fixture Night/);
  assert.match(readme, /queue-clear hours and Gantt compare/);
  assert.match(readme, /queue CSV export, peak-queue jump/);
  assert.match(readme, /dashboard Markdown copy, two-file compare/);
  assert.match(readme, /Gantt hour Markdown copy,\s+Payday Friday burst/);
  assert.match(readme, /not hosted APIs/);
  assert.match(readme, /does not serve those\s+markdown files/);
  assert.match(readme, /Catalog keys `w`, `k`, `n`, and `c`/);
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
  assert.match(readme, /Skip links jump to What's new, workbenches, How it works,\s+keyboard shortcuts, and Trust and limits/);
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

test('print CSS keeps How it works and hides skip links', () => {
  const print = html.match(/@media print \{([\s\S]*)\}\s*<\/style>/)?.[1] ?? '';
  assert.match(print, /#how-it-works, \.guide \{ display: block !important; \}/);
  assert.match(print, /\.skips[\s\S]*display: none !important/);
  assert.match(print, /\.skip, \.skips, \.keys-note, \.how, \.site-nav, \.shortcuts, \.shortcuts-open \{ display: none !important; \}/);
  assert.match(html, /id="how-it-works"/);
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
  assert.match(html, /const hashTargets = \['#whats-new', '#workbenches', '#how-it-works', '#trust', '#shortcuts'\]/);
  assert.match(html, /hashTargets\.includes\(location\.hash\)/);
  assert.match(html, /location\.hash\.slice\(1\)/);
  assert.match(html, /if \(id === 'shortcuts'\) setOpen\(true, \{ focus: false \}\)/);
  assert.match(html, /getElementById\(id\)\?\.focus\(\)/);
  assert.match(html, /id="whats-new" tabindex="-1"/);
  assert.match(html, /id="workbenches" tabindex="-1"/);
  assert.match(html, /id="how-it-works" tabindex="-1"/);
  assert.match(html, /id="trust" tabindex="-1"/);
  assert.match(html, /id="shortcuts"[^>]*tabindex="-1"/);
});

test('copy jobs copies catalog names and jobs as Markdown with a visible fallback', () => {
  assert.match(html, /id="copy-jobs"/);
  assert.match(html, />Copy jobs</);
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

test('copy versions copies catalog names as Markdown with a visible fallback', () => {
  assert.match(html, /id="copy-versions"/);
  assert.match(html, />Copy versions</);
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
  assert.doesNotMatch(html, /Copied[\s\S]*event\.key === 'o'/);
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
