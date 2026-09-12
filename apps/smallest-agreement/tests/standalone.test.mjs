import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import test from "node:test";
import vm from "node:vm";
import { isStandaloneCurrent, standaloneBytes } from "../scripts/build-standalone.mjs";

const root = fileURLToPath(new URL("..", import.meta.url));
const buildScript = fileURLToPath(new URL("../scripts/build-standalone.mjs", import.meta.url));

test("standalone artifact is current, self-contained, and LF-normalized", async () => {
  execFileSync(process.execPath, [buildScript, "--check"], { cwd: root, stdio: "pipe" });
  const html = await standaloneBytes();
  assert.equal(isStandaloneCurrent(html.replace(/\n/gu, "\r\n"), html), true);
  assert.equal(isStandaloneCurrent("stale", html), false);
  const csp = html.match(/<meta http-equiv="Content-Security-Policy" content="([^"]+)">/u)?.[1];
  assert.match(html, /<style>\n/u);
  assert.match(html, /<script type="module">\n/u);
  assert.doesNotMatch(html, /<link\b|<script\b[^>]*\bsrc\s*=|\bhttps?:\/\//iu);
  assert.doesNotMatch(html, /\r/u);
  assert.match(csp ?? "", /^default-src 'none'; /u);
  assert.match(csp ?? "", /script-src 'unsafe-inline'/u);
  assert.match(csp ?? "", /style-src 'unsafe-inline'/u);
  assert.match(csp ?? "", /connect-src 'none';/u);
  assert.match(csp ?? "", /object-src 'none';/u);
  assert.match(csp ?? "", /base-uri 'none';/u);
  assert.match(csp ?? "", /form-action 'none'/u);
  assert.match(html, /Threshold margin/u);
  assert.match(html, /Closest gap/u);
  assert.match(html, /id="max-change-cost"/u);
  assert.match(html, /data-field="group-floor"/u);
  assert.match(html, /data-field="clause-lock"/u);
  assert.match(html, /Constraint checks/u);
  assert.match(html, /Clause contribution/u);
  assert.match(html, /Near-miss explorer/u);
  assert.match(html, /aria-describedby="floor-note"/u);
  assert.match(html, /id="veto-note"/u);
  assert.match(html, /Import support CSV/u);
  assert.match(html, /Import groups CSV/u);
  assert.match(html, /id="groups-import-file"/u);
  assert.match(html, /Import clauses CSV/u);
  assert.match(html, /id="clauses-import-file"/u);
  assert.match(html, /Try this option/u);
  assert.match(html, /Leave one group out/u);
  assert.match(html, /id="coach-overlay"/u);
  assert.match(html, /id="shortcut-overlay"/u);
  assert.match(html, /Focus the clause filter/u);
  assert.match(html, /<kbd>\/<\/kbd> Focus the clause filter/u);
  assert.match(html, /Focus Add group/u);
  assert.match(html, /Jump to the first locked clause/u);
  assert.match(html, /<kbd>v<\/kbd> Toggle the veto-only group filter/u);
  assert.match(html, /<kbd>b<\/kbd> Jump to the first veto-blocker highlight, or the veto list/u);
  assert.match(html, /<kbd>g<\/kbd> Focus the participant groups heading or the first group card/u);
  assert.match(html, /<kbd>c<\/kbd> Jump to the change-budget field/u);
  assert.match(html, /<kbd>p<\/kbd> Print the facilitator pack/u);
  assert.match(html, /<kbd>k<\/kbd> Jump to the first unlocked clause card, or the lock controls/u);
  assert.match(html, /<kbd>t<\/kbd> Jump to the approval threshold field/u);
  assert.match(html, /<kbd>a<\/kbd> Focus Add clause/u);
  assert.match(html, /<kbd>w<\/kbd> Jump to group weights or renormalize controls/u);
  assert.match(html, /<kbd>m<\/kbd> Jump to remaining change-budget or cost margin/u);
  assert.match(html, /<kbd>d<\/kbd> Jump to the first group below its support floor, or the groups heading/u);
  assert.match(html, /<kbd>o<\/kbd> Jump to the first recommended-package option card, or the clauses heading/u);
  assert.match(html, /<kbd>j<\/kbd> Copy remaining change-budget as one-line Markdown/u);
  assert.match(html, /<kbd>x<\/kbd> Focus the JSON export control/u);
  assert.match(html, /<kbd>h<\/kbd> Jump to the workshop method \/ How it works heading/u);
  assert.match(html, /<kbd>i<\/kbd> Copy original versus recommended labels and costs as compact Markdown/u);
  assert.match(html, /<kbd>q<\/kbd> Jump to the first clause that differs from the recommendation, or the clauses heading/u);
  assert.match(html, /<kbd>y<\/kbd> Jump to the first veto group card, or the groups heading/u);
  assert.match(html, /<kbd>z<\/kbd> Jump to the numeric approval threshold field, or the method heading/u);
  assert.match(html, /<kbd>,<\/kbd> Copy the recommended package option count as one-line Markdown/u);
  assert.match(html, /<kbd>\.<\/kbd> Jump to the first locked clause card, or the clauses heading/u);
  assert.match(html, /<kbd>;<\/kbd> Copy the current lock count as one-line Markdown/u);
  assert.match(html, /<kbd>\[<\/kbd> Jump to the lock-count copy control, or the locks heading/u);
  assert.match(html, /<kbd>\]<\/kbd> Jump to Print facilitator pack, or the facilitator pack heading/u);
  assert.match(html, /<kbd>'<\/kbd> Copy the first locked clause option label as one-line Markdown/u);
  assert.match(html, /<kbd>&lt;<\/kbd> Jump to the first-locked-option copy control, or the clauses heading/u);
  assert.match(html, /<kbd>&gt;<\/kbd> Jump to the hide-locked-clauses control, or the clauses heading/u);
  assert.match(html, /<kbd>:<\/kbd> Copy the below-floor group count as one-line Markdown/u);
  assert.match(html, /<kbd>-<\/kbd> Jump to the below-floor group count copy control, or the groups heading/u);
  assert.match(html, /<kbd>=<\/kbd> Jump to the hide-groups-meeting-threshold control, or the groups heading/u);
  assert.match(html, /<kbd>"<\/kbd> Copy the first below-floor group label as one-line Markdown/u);
  assert.match(html, /<kbd>_<\/kbd> Jump to the first below-floor group copy control, or the groups heading/u);
  assert.match(html, /<kbd>\{<\/kbd> Jump to the hide-groups-below-threshold control, or the groups heading/u);
  assert.match(html, /<kbd>\}<\/kbd> Copy the groups-meeting-threshold count as one-line Markdown/u);
  assert.match(html, /<kbd>\+<\/kbd> Jump to the threshold-group count copy control, or the groups or results heading/u);
  assert.match(html, /<kbd>\|<\/kbd> Jump to the hide-veto-groups control, or the groups heading/u);
  assert.match(html, /<kbd>~<\/kbd> Copy the first veto group label as one-line Markdown/u);
  assert.match(html, /<kbd>!<\/kbd> Jump to the first veto group copy control, or the groups heading/u);
  assert.match(html, /<kbd>@<\/kbd> Jump to the hide-non-veto-groups control, or the groups heading/u);
  assert.match(html, /<kbd>\(<\/kbd> Copy the veto-group count as one-line Markdown/u);
  assert.match(html, /<kbd>\)<\/kbd> Jump to the veto-group count copy control, or the groups heading/u);
  assert.match(html, /<kbd>#<\/kbd> Jump to the hide-first-veto-group control, or the groups heading/u);
  assert.match(html, /<kbd>\*<\/kbd> Copy the first non-veto group label as one-line Markdown/u);
  assert.match(html, /<kbd>&amp;<\/kbd> Jump to the first non-veto group copy control, or the groups heading/u);
  assert.match(html, /<kbd>%<\/kbd> Jump to the hide-last-veto-group control, or the groups heading/u);
  assert.match(html, /<kbd>\$<\/kbd> Copy the last veto group label as one-line Markdown/u);
  assert.match(html, /<kbd>\^<\/kbd> Jump to the last veto group copy control, or the groups heading/u);
  assert.match(html, /<kbd>\u0060<\/kbd> Jump to the hide-first-non-veto-group control, or the groups heading/u);
  assert.match(html, /<kbd>5<\/kbd> Copy the last non-veto group label as one-line Markdown/u);
  assert.match(html, /<kbd>6<\/kbd> Jump to the last non-veto group copy control, or the groups heading/u);
  assert.match(html, /<kbd>7<\/kbd> Jump to the hide-last-group-below-threshold control, or the groups heading/u);
  assert.match(html, /<kbd>8<\/kbd> Copy the last below-threshold group label as one-line Markdown/u);
  assert.match(html, /<kbd>9<\/kbd> Jump to the last below-threshold group copy control, or the groups heading/u);
  assert.match(html, /<kbd>0<\/kbd> Jump to the hide-first-group-below-threshold control, or the groups heading/u);
  assert.match(html, /<kbd>1<\/kbd> Copy the first below-threshold group label as one-line Markdown/u);
  assert.match(html, /<kbd>2<\/kbd> Jump to the first below-threshold group copy control, or the groups heading/u);
  assert.match(html, /<kbd>3<\/kbd> Jump to the hide-last-group-at-or-above-threshold control, or the groups heading/u);
  assert.match(html, /<kbd>4<\/kbd> Copy the last at-or-above-threshold group label as one-line Markdown/u);
  assert.match(html, /<kbd>Home<\/kbd> Jump to the last at-or-above-threshold group copy control, or the groups heading/u);
  assert.match(html, /<kbd>End<\/kbd> Jump to the hide-first-group-at-or-above-threshold control, or the groups heading/u);
  assert.match(html, /<kbd>PageUp<\/kbd> Copy the first at-or-above-threshold group label as one-line Markdown/u);
  assert.match(html, /<kbd>PageDown<\/kbd> Jump to the first at-or-above-threshold group copy control, or the groups heading/u);
  assert.match(html, /<kbd>ArrowUp<\/kbd> Jump to the hide-last-group-at-floor control, or the groups heading/u);
  assert.match(html, /<kbd>Insert<\/kbd> Copy the last at-floor group label as one-line Markdown/u);
  assert.match(html, /<kbd>ArrowDown<\/kbd> Jump to the last at-floor group copy control, or the groups heading/u);
  assert.match(html, /<kbd>ArrowLeft<\/kbd> Jump to the hide-first-group-at-floor control, or the groups heading/u);
  assert.match(html, /<kbd>F3<\/kbd> Copy the first at-floor group label as one-line Markdown/u);
  assert.match(html, /<kbd>F4<\/kbd> Jump to the first at-floor group copy control, or the groups heading/u);
  assert.match(html, /<kbd>Delete<\/kbd> Copy the last below-floor group label as one-line Markdown/u);
  assert.match(html, /<kbd>F2<\/kbd> Jump to the last below-floor group copy control, or the groups heading/u);
  assert.match(html, /<kbd>ArrowRight<\/kbd> Jump to the hide-first-group-below-floor control, or the groups heading/u);
  assert.match(html, /<kbd>Backspace<\/kbd> Jump to the hide-last-group-below-floor control, or the groups heading/u);
  assert.match(html, /<kbd>F7<\/kbd> Copy the last group-without-floor label as one-line Markdown/u);
  assert.match(html, /<kbd>F8<\/kbd> Jump to the last group-without-floor copy control, or the groups heading/u);
  assert.match(html, /<kbd>F9<\/kbd> Jump to the hide-last-group-without-floor control, or the groups heading/u);
  assert.match(html, /<kbd>F10<\/kbd> Copy the first group-without-floor label as one-line Markdown/u);
  assert.match(html, /<kbd>F11<\/kbd> Jump to the first group-without-floor copy control, or the groups heading/u);
  assert.match(html, /<kbd>F12<\/kbd> Jump to the hide-first-group-without-floor control, or the groups heading/u);
  assert.match(html, /<kbd>Shift\+F7<\/kbd> Copy the first-without-floor remaining as one-line Markdown/u);
  assert.match(html, /<kbd>Shift\+F8<\/kbd> Jump to the first-without-floor remaining copy control, or the groups heading/u);
  assert.match(html, /<kbd>Shift\+F9<\/kbd> Jump to the hide-last-group-without-floor control, or the groups heading/u);
  assert.match(html, /<kbd>Shift\+F10<\/kbd> Copy the groups-without-floor count as one-line Markdown/u);
  assert.match(html, /<kbd>Shift\+F11<\/kbd> Jump to the groups-without-floor count copy control, or the groups heading/u);
  assert.match(html, /<kbd>Shift\+F12<\/kbd> Jump to the hide-first-group-without-floor control, or the groups heading/u);
  assert.match(html, /id="locks-heading"/u);
  assert.match(html, /id="print-heading"/u);
  assert.match(html, /id="method-heading"/u);
  assert.match(html, /id="find-agreement"/u);
  assert.match(html, /Side-by-side package/u);
  assert.match(html, /Lock recommended package/u);
  assert.match(html, /Lock this option/u);
  assert.match(html, /data-action="toggle-clause-lock"/u);
  assert.match(html, /id="clear-locks"/u);
  assert.match(html, /Clear all locks/u);
  assert.match(html, /veto-blocking/u);
  assert.match(html, /id="near-miss-sort"/u);
  assert.match(html, /Lock this package/u);
  assert.match(html, /workplace-hybrid/u);
  assert.match(html, /club-constitution/u);
  assert.match(html, /library-quiet-hours/u);
  assert.match(html, /sports-fixture-night/u);
  assert.match(html, /market-stall-hours/u);
  assert.match(html, /shared-bike-shed/u);
  assert.match(html, /street-stall-lighting/u);
  assert.match(html, /hall-hire-hours/u);
  assert.match(html, /community-garden-watering/u);
  assert.match(html, /shared-laundry-hours/u);
  assert.match(html, /rooftop-bbq-hours/u);
  assert.match(html, /school-disco-hours/u);
  assert.match(html, /sports-day-hours/u);
  assert.match(html, /netball-training-hours/u);
  assert.match(html, /swimming-club-hours/u);
  assert.match(html, /athletics-club-hours/u);
  assert.match(html, /cricket-club-hours/u);
  assert.match(html, /tennis-club-hours/u);
  assert.match(html, /basketball-club-hours/u);
  assert.match(html, /volleyball-club-hours/u);
  assert.match(html, /soccer-club-hours/u);
  assert.match(html, /hockey-club-hours/u);
  assert.match(html, /rugby-club-hours/u);
  assert.match(html, /softball-club-hours/u);
  assert.match(html, /lacrosse-club-hours/u);
  assert.match(html, /water-polo-club-hours/u);
  assert.match(html, /rowing-club-hours/u);
  assert.match(html, /sailing-club-hours/u);
  assert.match(html, /canoeing-club-hours/u);
  assert.match(html, /kayaking-club-hours/u);
  assert.match(html, /dragon-boat-club-hours/u);
  assert.match(html, /surf-club-hours/u);
  assert.match(html, /triathlon-club-hours/u);
  assert.match(html, /cycling-club-hours/u);
  assert.match(html, /mountain-bike-club-hours/u);
  assert.match(html, /bmx-club-hours/u);
  assert.match(html, /cyclo-cross-club-hours/u);
  assert.match(html, /track-cycling-club-hours/u);
  assert.match(html, /gravel-cycling-club-hours/u);
  assert.match(html, /criterium-cycling-club-hours/u);
  assert.match(html, /time-trial-cycling-club-hours/u);
  assert.match(html, /road-cycling-club-hours/u);
  assert.match(html, /<option value="track-cycling-club-hours">Track cycling club hours<\/option>\s*<option value="gravel-cycling-club-hours">Gravel cycling club hours<\/option>\s*<option value="road-cycling-club-hours">Road cycling club hours<\/option>\s*<option value="criterium-cycling-club-hours">Criterium cycling club hours<\/option>\s*<option value="time-trial-cycling-club-hours">Time-trial cycling club hours<\/option>\s*<option value="hill-climb-cycling-club-hours">Hill-climb cycling club hours<\/option>\s*<option value="keirin-cycling-club-hours">Keirin cycling club hours<\/option>/u);
  assert.match(html, /id="clause-filter"/u);
  assert.match(html, /id="clause-filter-status"/u);
  assert.match(html, /id="veto-groups-only"/u);
  assert.match(html, /Show veto groups only/u);
  assert.match(html, /id="locked-clauses-only"/u);
  assert.match(html, /Show locked clauses only/u);
  assert.match(html, /id="hide-unlocked-clauses"/u);
  assert.match(html, /Hide unlocked clauses/u);
  assert.match(html, /id="hide-locked-clauses"/u);
  assert.match(html, /Hide locked clauses/u);
  assert.match(html, /id="changed-clauses-only"/u);
  assert.match(html, /Show clauses that differ from the recommendation/u);
  assert.match(html, /id="over-budget-clauses-only"/u);
  assert.match(html, /Show clauses whose cheapest remaining change exceeds remaining budget/u);
  assert.match(html, /id="no-cheaper-remaining-clauses-only"/u);
  assert.match(html, /Show clauses with no remaining cheaper option than the recommendation/u);
  assert.match(html, /id="below-floor-groups-only"/u);
  assert.match(html, /Show groups below their support floor/u);
  assert.match(html, /id="hide-groups-at-floor"/u);
  assert.match(html, /Hide groups currently meeting their support floor/u);
  assert.match(html, /id="hide-groups-without-floors"/u);
  assert.match(html, /Hide groups that have no support floor/u);
  assert.match(html, /id="hide-groups-meeting-threshold"/u);
  assert.match(html, /Hide groups currently meeting the approval threshold/u);
  assert.match(html, /id="hide-groups-below-threshold"/u);
  assert.match(html, /Hide groups currently below the approval threshold/u);
  assert.match(html, /id="hide-veto-groups"/u);
  assert.match(html, /Hide veto groups/u);
  assert.match(html, /id="hide-non-veto-groups"/u);
  assert.match(html, /Hide non-veto groups/u);
  assert.match(html, /id="hide-first-veto-group"/u);
  assert.match(html, /Hide first veto group/u);
  assert.match(html, /id="hide-last-veto-group"/u);
  assert.match(html, /Hide last veto group/u);
  assert.match(html, /id="hide-first-non-veto-group"/u);
  assert.match(html, /Hide first non-veto group/u);
  assert.match(html, /id="hide-last-non-veto-group"/u);
  assert.match(html, /Hide last non-veto group/u);
  assert.match(html, /id="hide-last-group-below-threshold"/u);
  assert.match(html, /Hide last group currently below the approval threshold/u);
  assert.match(html, /id="hide-first-group-below-threshold"/u);
  assert.match(html, /Hide first group currently below the approval threshold/u);
  assert.match(html, /id="hide-last-group-at-or-above-threshold"/u);
  assert.match(html, /Hide last group currently at or above the approval threshold/u);
  assert.match(html, /id="hide-first-group-at-or-above-threshold"/u);
  assert.match(html, /Hide first group currently at or above the approval threshold/u);
  assert.match(html, /id="hide-last-group-at-floor"/u);
  assert.match(html, /Hide last group currently meeting their support floor/u);
  assert.match(html, /id="hide-first-group-at-floor"/u);
  assert.match(html, /Hide first group currently meeting their support floor/u);
  assert.match(html, /id="hide-first-group-below-floor"/u);
  assert.match(html, /Hide first group currently below their support floor/u);
  assert.match(html, /id="hide-last-group-below-floor"/u);
  assert.match(html, /Hide last group currently below their support floor/u);
  assert.match(html, /id="hide-last-group-without-floor"/u);
  assert.match(html, /Hide last group without a support floor/u);
  assert.match(html, /id="hide-first-group-without-floor"/u);
  assert.match(html, /Hide first group without a support floor/u);
  assert.match(html, /id="veto-groups-status"/u);
  assert.match(html, /aria-live="polite"/u);
  assert.match(html, /id="support-drop-range"/u);
  assert.match(html, /id="printable-ballot"/u);
  assert.match(html, /Print facilitator pack/u);
  assert.match(html, /Print redacted/u);
  assert.match(html, /id="print-redacted-button"/u);
  assert.match(html, /Facilitator pack\. The workshop tour is hidden/u);
  assert.match(html, /a one-line lock count, and the first locked clause option label as one line on the worksheet, plus a one-line below-floor group count, the first below-floor group label as one line, a one-line threshold-group count, the first veto group label as one line, a one-line veto-group count, the first non-veto group label as one line, and the last veto group label as one line/u);
  assert.match(html, /Discussion worksheet/u);
  assert.match(html, /Facilitator note \(optional\)/u);
  assert.match(html, /Duplicate group/u);
  assert.match(html, /Reset support to blank/u);
  assert.match(html, /data-action="reset-group-support"/u);
  assert.match(html, /Duplicate clause/u);
  assert.match(html, /id="worksheet-button"/u);
  assert.match(html, /id="worksheet-csv-button"/u);
  assert.match(html, /id="export-workspace-button"/u);
  assert.match(html, /Export workspace JSON/u);
  assert.match(html, /id="export-locks-button"/u);
  assert.match(html, /Export locks JSON/u);
  assert.match(html, /id="import-locks-button"/u);
  assert.match(html, /Import locks JSON/u);
  assert.match(html, /id="locks-import-file"/u);
  assert.match(html, /id="clause-density"/u);
  assert.match(html, /id="copy-veto-button"/u);
  assert.match(html, /Copy veto blockers/u);
  assert.match(html, /id="copy-packages-table-button"/u);
  assert.match(html, /Copy package table/u);
  assert.match(html, /id="copy-group-support-button"/u);
  assert.match(html, /Copy group support/u);
  assert.match(html, /id="group-support-fallback"/u);
  assert.match(html, /id="copy-remaining-budget-button"/u);
  assert.match(html, /Copy remaining budget/u);
  assert.match(html, /id="remaining-budget-fallback"/u);
  assert.match(html, /id="copy-approval-threshold-button"/u);
  assert.match(html, /Copy approval threshold/u);
  assert.match(html, /id="approval-threshold-fallback"/u);
  assert.match(html, /id="copy-original-versus-recommended-button"/u);
  assert.match(html, /Copy original versus recommended/u);
  assert.match(html, /id="original-versus-recommended-fallback"/u);
  assert.match(html, /id="package-markdown-fallback"/u);
  assert.match(html, /id="copy-option-count-button"/u);
  assert.match(html, /Copy option count/u);
  assert.match(html, /id="option-count-fallback"/u);
  assert.match(html, /id="copy-locks-button"/u);
  assert.match(html, /Copy current locks/u);
  assert.match(html, /id="locks-markdown-fallback"/u);
  assert.match(html, /id="copy-lock-count-button"/u);
  assert.match(html, /Copy lock count/u);
  assert.match(html, /id="lock-count-fallback"/u);
  assert.match(html, /id="copy-first-locked-option-button"/u);
  assert.match(html, /Copy first locked option/u);
  assert.match(html, /id="first-locked-option-fallback"/u);
  assert.match(html, /id="copy-below-floor-count-button"/u);
  assert.match(html, /Copy below-floor group count/u);
  assert.match(html, /id="below-floor-count-fallback"/u);
  assert.match(html, /id="copy-first-below-floor-group-button"/u);
  assert.match(html, /Copy first below-floor group/u);
  assert.match(html, /id="first-below-floor-group-fallback"/u);
  assert.match(html, /id="copy-threshold-group-count-button"/u);
  assert.match(html, /Copy threshold-group count/u);
  assert.match(html, /id="threshold-group-count-fallback"/u);
  assert.match(html, /id="copy-first-veto-group-button"/u);
  assert.match(html, /Copy first veto group/u);
  assert.match(html, /id="first-veto-group-fallback"/u);
  assert.match(html, /id="copy-veto-group-count-button"/u);
  assert.match(html, /Copy veto-group count/u);
  assert.match(html, /id="veto-group-count-fallback"/u);
  assert.match(html, /id="copy-first-non-veto-group-button"/u);
  assert.match(html, /Copy first non-veto group/u);
  assert.match(html, /id="first-non-veto-group-fallback"/u);
  assert.match(html, /id="copy-last-veto-group-button"/u);
  assert.match(html, /id="copy-last-veto-group-button"[^>]*aria-keyshortcuts="\$"/u);
  assert.match(html, /Copy last veto group/u);
  assert.match(html, /id="last-veto-group-fallback"/u);
  assert.match(html, /id="copy-last-non-veto-group-button"/u);
  assert.match(html, /id="copy-last-non-veto-group-button"[^>]*aria-keyshortcuts="5"/u);
  assert.match(html, /Copy last non-veto group/u);
  assert.match(html, /id="last-non-veto-group-fallback"/u);
  assert.match(html, /id="copy-last-below-threshold-group-button"/u);
  assert.match(html, /id="copy-last-below-threshold-group-button"[^>]*aria-keyshortcuts="8"/u);
  assert.match(html, /Copy last below-threshold group/u);
  assert.match(html, /id="last-below-threshold-group-fallback"/u);
  assert.match(html, /id="copy-first-below-threshold-group-button"/u);
  assert.match(html, /id="copy-first-below-threshold-group-button"[^>]*aria-keyshortcuts="1"/u);
  assert.match(html, /Copy first below-threshold group/u);
  assert.match(html, /id="first-below-threshold-group-fallback"/u);
  assert.match(html, /id="copy-last-group-at-or-above-threshold-button"/u);
  assert.match(html, /id="copy-last-group-at-or-above-threshold-button"[^>]*aria-keyshortcuts="4"/u);
  assert.match(html, /Copy last at-or-above-threshold group/u);
  assert.match(html, /id="last-group-at-or-above-threshold-fallback"/u);
  assert.match(html, /id="copy-first-group-at-or-above-threshold-button"/u);
  assert.match(html, /id="copy-first-group-at-or-above-threshold-button"[^>]*aria-keyshortcuts="PageUp"/u);
  assert.match(html, /Copy first at-or-above-threshold group/u);
  assert.match(html, /id="first-group-at-or-above-threshold-fallback"/u);
  assert.match(html, /id="copy-last-group-at-floor-button"/u);
  assert.match(html, /id="copy-last-group-at-floor-button"[^>]*aria-keyshortcuts="Insert"/u);
  assert.match(html, /Copy last at-floor group/u);
  assert.match(html, /id="last-group-at-floor-fallback"/u);
  assert.match(html, /id="copy-first-group-at-floor-button"/u);
  assert.match(html, /id="copy-first-group-at-floor-button"[^>]*aria-keyshortcuts="F3"/u);
  assert.match(html, /Copy first at-floor group/u);
  assert.match(html, /id="first-group-at-floor-fallback"/u);
  assert.match(html, /id="copy-last-below-floor-group-button"/u);
  assert.match(html, /id="copy-last-below-floor-group-button"[^>]*aria-keyshortcuts="Delete"/u);
  assert.match(html, /Copy last below-floor group/u);
  assert.match(html, /id="last-below-floor-group-fallback"/u);
  assert.match(html, /id="copy-last-group-without-floor-button"/u);
  assert.match(html, /id="copy-last-group-without-floor-button"[^>]*aria-keyshortcuts="F7"/u);
  assert.match(html, /Copy last group without a support floor/u);
  assert.match(html, /id="last-group-without-floor-fallback"/u);
  assert.match(html, /id="copy-first-group-without-floor-button"/u);
  assert.match(html, /id="copy-first-group-without-floor-button"[^>]*aria-keyshortcuts="F10"/u);
  assert.match(html, /Copy first group without a support floor/u);
  assert.match(html, /id="first-group-without-floor-fallback"/u);
  assert.match(html, /id="copy-groups-without-floor-count-button"/u);
  assert.match(html, /id="copy-groups-without-floor-count-button"[^>]*aria-keyshortcuts="Shift\+F10"/u);
  assert.match(html, /Copy groups-without-floor count/u);
  assert.match(html, /id="groups-without-floor-count-fallback"/u);
  assert.match(html, /id="copy-groups-without-floor-remaining-button"/u);
  assert.match(html, /Copy groups-without-floor remaining/u);
  assert.match(html, /id="groups-without-floor-remaining-fallback"/u);
  assert.match(html, /id="copy-last-group-without-floor-remaining-button"/u);
  assert.doesNotMatch(html, /id="copy-last-group-without-floor-remaining-button"[^>]*aria-keyshortcuts/u);
  assert.match(html, /Copy last-without-floor remaining/u);
  assert.match(html, /id="last-group-without-floor-remaining-fallback"/u);
  assert.match(html, /id="copy-first-group-without-floor-remaining-button"/u);
  assert.match(html, /id="copy-first-group-without-floor-remaining-button"[^>]*aria-keyshortcuts="Shift\+F7"/u);
  assert.match(html, /Copy first-without-floor remaining/u);
  assert.match(html, /id="first-group-without-floor-remaining-fallback"/u);
  assert.match(html, /id="copy-first-group-without-floor-cost-button"/u);
  assert.doesNotMatch(html, /id="copy-first-group-without-floor-cost-button"[^>]*aria-keyshortcuts/u);
  assert.match(html, /Copy first-without-floor cost/u);
  assert.match(html, /id="first-group-without-floor-cost-fallback"/u);
  assert.match(html, /id="copy-last-group-without-floor-cost-button"/u);
  assert.doesNotMatch(html, /id="copy-last-group-without-floor-cost-button"[^>]*aria-keyshortcuts/u);
  assert.match(html, /Copy last-without-floor cost/u);
  assert.match(html, /id="last-group-without-floor-cost-fallback"/u);
  assert.match(html, /id="copy-change-cost-button"/u);
  assert.match(html, /Copy change-cost table/u);
  assert.match(html, /id="change-cost-csv-fallback"/u);
  assert.match(html, /id="package-table-fallback"/u);
  assert.match(html, /id="clause-paste"/u);
  assert.match(html, /Paste clause options TSV or CSV/u);
  assert.match(html, /id="clause-paste-button"/u);
  assert.match(html, /id="groups-paste"/u);
  assert.match(html, /Paste participant groups TSV or CSV/u);
  assert.match(html, /id="groups-paste-button"/u);
  assert.match(html, /id="file-compare-heading"/u);
  assert.match(html, /id="compare-files-button"/u);
  assert.match(html, /id="coach-again"/u);
  assert.match(html, /Duplicate option/u);
  assert.match(html, /Move up/u);
  assert.match(html, /id="weight-shares"/u);
  assert.match(html, /id="weight-renorm"/u);
  assert.match(html, /Budget remaining/u);
  assert.match(html, /Group contribution/u);
  assert.match(html, /Filter clauses by title or option label/u);
  assert.match(html, /Copyright \(c\) 2026 EauDoon/u);
});

async function savedWorkbench(storage, hash = "") {
  const html = await standaloneBytes();
  const script = html.match(/<script type="module">([\s\S]*?)<\/script>/u)[1];
  const elements = new Map();
  const documentEvents = new Map();
  let focusedSelector = "";
  const canvasContext = { setTransform() {}, clearRect() {}, fillRect() {}, fillText() {} };
  const element = (selector) => {
    if (!elements.has(selector)) {
      const node = {
        value: "",
        textContent: "",
        innerHTML: "",
        className: "",
        clientWidth: 400,
        append() {},
        replaceChildren() {},
        setAttribute() {},
        events: new Map(),
        addEventListener(name, callback) { this.events.set(name, callback); },
        getContext: () => canvasContext,
        focus() { focusedSelector = selector; },
        classList: {
          toggle(name, force) {
            const names = new Set((node.className || "").split(/\s+/u).filter(Boolean));
            if (force) names.add(name);
            else names.delete(name);
            node.className = [...names].join(" ");
          },
        },
      };
      elements.set(selector, node);
    }
    return elements.get(selector);
  };
  const clipboard = { text: "", blocked: false, writeText(value) {
    if (this.blocked) return Promise.reject(new Error("clipboard blocked"));
    this.text = value;
    return Promise.resolve();
  } };
  let printCalls = 0;
  const context = vm.createContext({ console, TextEncoder, TextDecoder, Uint8Array, atob,
    document: {
      querySelector: element,
      createElement: (tag) => element(Symbol(tag)),
      querySelectorAll: () => [],
      addEventListener: (name, callback) => documentEvents.set(name, callback),
    },
    window: {
      devicePixelRatio: 1,
      addEventListener() {},
      navigator: { clipboard },
      print() { printCalls += 1; },
    },
    navigator: { clipboard },
    location: { hash, protocol: "file:" },
    localStorage: { getItem: (key) => storage.get(key) ?? null, setItem: (key, value) => storage.set(key, value) },
  });
  new vm.Script(script).runInContext(context, { timeout: 5000 });
  return {
    numberInput: (selector, value) => element(selector).events.get("input")({ target: { valueAsNumber: value } }),
    field: (selector, value) => { element(selector).value = value; },
    title: () => element("#proposal-title").value,
    message: () => element("#autosave-status").textContent,
    alert: () => element("#result-alert").textContent,
    summary: () => element("#result-summary").innerHTML,
    clauses: () => element("#clauses-editor").innerHTML,
    clauseDensityClass: () => element("#clauses-editor").className || "",
    setDensity: (value) => {
      const target = element("#clause-density");
      target.value = value;
      target.events.get("change")({ target: { value } });
    },
    groups: () => element("#groups-editor").innerHTML,
    disabled: (selector) => element(selector).disabled,
    click: (selector) => element(selector).events.get("click")(),
    importJson: async (contents, { size, read } = {}) => {
      const target = {
        files: [{ size: size ?? contents.length, text: async () => read === undefined ? contents : await read }],
        value: "draft.json",
      };
      await element("#import-file").events.get("change")({ target });
    },
    importGroupsCsv: async (contents, { size } = {}) => {
      const target = {
        files: [{ size: size ?? contents.length, text: async () => contents }],
        value: "groups.csv",
      };
      await element("#groups-import-file").events.get("change")({ target });
    },
    importClausesCsv: async (contents, { size } = {}) => {
      const target = {
        files: [{ size: size ?? contents.length, text: async () => contents }],
        value: "clauses.csv",
      };
      await element("#clauses-import-file").events.get("change")({ target });
    },
    pasteClauses: (value) => { element("#clause-paste").value = value; },
    pasteGroups: (value) => { element("#groups-paste").value = value; },
    importLocksJson: async (contents, { size } = {}) => {
      const target = {
        files: [{ size: size ?? contents.length, text: async () => contents }],
        value: "locks.json",
      };
      await element("#locks-import-file").events.get("change")({ target });
    },
    setTitle: (value) => {
      const target = element("#proposal-title");
      target.value = value;
      target.events.get("input")({ target });
    },
    edit: (field, value, dataset = {}) => {
      const target = { value: String(value), valueAsNumber: value, validity: { badInput: false }, dataset: { field: "group-floor", groupId: "g", ...dataset } };
      if (field === "budget") element("#max-change-cost").events.get("input")({ target });
      else documentEvents.get("input")({ target });
    },
    filterClauses: (value) => {
      const target = element("#clause-filter");
      target.value = value;
      target.events.get("input")({ target });
    },
    filterStatus: () => element("#clause-filter-status").textContent,
    filterVetoGroups: (checked) => {
      const target = element("#veto-groups-only");
      target.checked = checked;
      target.events.get("change")({ target: { checked } });
    },
    vetoGroupsStatus: () => element("#veto-groups-status").textContent,
    filterLockedClauses: (checked) => {
      const target = element("#locked-clauses-only");
      target.checked = checked;
      target.events.get("change")({ target: { checked } });
    },
    filterHideUnlockedClauses: (checked) => {
      const target = element("#hide-unlocked-clauses");
      target.checked = checked;
      target.events.get("change")({ target: { checked } });
    },
    filterHideLockedClauses: (checked) => {
      const target = element("#hide-locked-clauses");
      target.checked = checked;
      target.events.get("change")({ target: { checked } });
    },
    filterChangedClauses: (checked) => {
      const target = element("#changed-clauses-only");
      target.checked = checked;
      target.events.get("change")({ target: { checked } });
    },
    filterOverBudgetClauses: (checked) => {
      const target = element("#over-budget-clauses-only");
      target.checked = checked;
      target.events.get("change")({ target: { checked } });
    },
    filterNoCheaperRemainingClauses: (checked) => {
      const target = element("#no-cheaper-remaining-clauses-only");
      target.checked = checked;
      target.events.get("change")({ target: { checked } });
    },
    filterBelowFloorGroups: (checked) => {
      const target = element("#below-floor-groups-only");
      target.checked = checked;
      target.events.get("change")({ target: { checked } });
    },
    filterHideGroupsAtFloor: (checked) => {
      const target = element("#hide-groups-at-floor");
      target.checked = checked;
      target.events.get("change")({ target: { checked } });
    },
    filterHideGroupsWithoutFloors: (checked) => {
      const target = element("#hide-groups-without-floors");
      target.checked = checked;
      target.events.get("change")({ target: { checked } });
    },
    filterHideGroupsMeetingThreshold: (checked) => {
      const target = element("#hide-groups-meeting-threshold");
      target.checked = checked;
      target.events.get("change")({ target: { checked } });
    },
    filterHideGroupsBelowThreshold: (checked) => {
      const target = element("#hide-groups-below-threshold");
      target.checked = checked;
      target.events.get("change")({ target: { checked } });
    },
    filterHideVetoGroups: (checked) => {
      const target = element("#hide-veto-groups");
      target.checked = checked;
      target.events.get("change")({ target: { checked } });
    },
    filterHideNonVetoGroups: (checked) => {
      const target = element("#hide-non-veto-groups");
      target.checked = checked;
      target.events.get("change")({ target: { checked } });
    },
    filterHideFirstVetoGroup: (checked) => {
      const target = element("#hide-first-veto-group");
      target.checked = checked;
      target.events.get("change")({ target: { checked } });
    },
    filterHideLastVetoGroup: (checked) => {
      const target = element("#hide-last-veto-group");
      target.checked = checked;
      target.events.get("change")({ target: { checked } });
    },
    filterHideFirstNonVetoGroup: (checked) => {
      const target = element("#hide-first-non-veto-group");
      target.checked = checked;
      target.events.get("change")({ target: { checked } });
    },
    filterHideLastNonVetoGroup: (checked) => {
      const target = element("#hide-last-non-veto-group");
      target.checked = checked;
      target.events.get("change")({ target: { checked } });
    },
    filterHideLastGroupBelowThreshold: (checked) => {
      const target = element("#hide-last-group-below-threshold");
      target.checked = checked;
      target.events.get("change")({ target: { checked } });
    },
    filterHideFirstGroupBelowThreshold: (checked) => {
      const target = element("#hide-first-group-below-threshold");
      target.checked = checked;
      target.events.get("change")({ target: { checked } });
    },
    filterHideLastGroupAtOrAboveThreshold: (checked) => {
      const target = element("#hide-last-group-at-or-above-threshold");
      target.checked = checked;
      target.events.get("change")({ target: { checked } });
    },
    filterHideFirstGroupAtOrAboveThreshold: (checked) => {
      const target = element("#hide-first-group-at-or-above-threshold");
      target.checked = checked;
      target.events.get("change")({ target: { checked } });
    },
    filterHideLastGroupAtFloor: (checked) => {
      const target = element("#hide-last-group-at-floor");
      target.checked = checked;
      target.events.get("change")({ target: { checked } });
    },
    filterHideFirstGroupAtFloor: (checked) => {
      const target = element("#hide-first-group-at-floor");
      target.checked = checked;
      target.events.get("change")({ target: { checked } });
    },
    filterHideFirstGroupBelowFloor: (checked) => {
      const target = element("#hide-first-group-below-floor");
      target.checked = checked;
      target.events.get("change")({ target: { checked } });
    },
    filterHideLastGroupBelowFloor: (checked) => {
      const target = element("#hide-last-group-below-floor");
      target.checked = checked;
      target.events.get("change")({ target: { checked } });
    },
    filterHideLastGroupWithoutFloor: (checked) => {
      const target = element("#hide-last-group-without-floor");
      target.checked = checked;
      target.events.get("change")({ target: { checked } });
    },
    filterHideFirstGroupWithoutFloor: (checked) => {
      const target = element("#hide-first-group-without-floor");
      target.checked = checked;
      target.events.get("change")({ target: { checked } });
    },
    ballot: () => element("#ballot-body").innerHTML,
    shares: () => element("#weight-shares").innerHTML,
    coalition: () => element("#coalition-table").innerHTML,
    constraints: () => element("#constraint-checks").innerHTML,
    weightRenorm: () => element("#weight-renorm").innerHTML,
    sideBySide: () => element("#side-by-side").innerHTML,
    nearMisses: () => element("#near-misses-list").innerHTML,
    sortNearMisses: (value) => {
      const target = element("#near-miss-sort");
      target.value = value;
      target.events.get("change")({ target });
    },
    coachHidden: () => element("#coach-overlay").hidden,
    clickAction: (action, dataset = {}) => {
      documentEvents.get("click")({
        target: {
          closest: (selector) => selector === "[data-action]"
            ? { disabled: false, dataset: { action, ...dataset } }
            : null,
        },
      });
    },
    changeManual: (clauseId, optionId) => {
      documentEvents.get("change")({
        target: { dataset: { field: "manual-option", clauseId }, value: optionId },
      });
    },
    focused: () => focusedSelector,
    clipboardText: () => clipboard.text,
    blockClipboard: () => { clipboard.blocked = true; },
    printCalls: () => printCalls,
    packageTable: () => element("#package-table-fallback").value,
    packageMarkdown: () => element("#package-markdown-fallback").value,
    groupSupport: () => element("#group-support-fallback").value,
    remainingBudget: () => element("#remaining-budget-fallback").value,
    approvalThreshold: () => element("#approval-threshold-fallback").value,
    optionCount: () => element("#option-count-fallback").value,
    originalVersusRecommended: () => element("#original-versus-recommended-fallback").value,
    locksMarkdown: () => element("#locks-markdown-fallback").value,
    lockCount: () => element("#lock-count-fallback").value,
    firstLockedOption: () => element("#first-locked-option-fallback").value,
    belowFloorCount: () => element("#below-floor-count-fallback").value,
    firstBelowFloorGroup: () => element("#first-below-floor-group-fallback").value,
    thresholdGroupCount: () => element("#threshold-group-count-fallback").value,
    firstVetoGroup: () => element("#first-veto-group-fallback").value,
    vetoGroupCount: () => element("#veto-group-count-fallback").value,
    firstNonVetoGroup: () => element("#first-non-veto-group-fallback").value,
    lastVetoGroup: () => element("#last-veto-group-fallback").value,
    lastNonVetoGroup: () => element("#last-non-veto-group-fallback").value,
    lastBelowThresholdGroup: () => element("#last-below-threshold-group-fallback").value,
    firstBelowThresholdGroup: () => element("#first-below-threshold-group-fallback").value,
    lastGroupAtOrAboveThreshold: () => element("#last-group-at-or-above-threshold-fallback").value,
    firstGroupAtOrAboveThreshold: () => element("#first-group-at-or-above-threshold-fallback").value,
    lastGroupAtFloor: () => element("#last-group-at-floor-fallback").value,
    firstGroupAtFloor: () => element("#first-group-at-floor-fallback").value,
    lastBelowFloorGroup: () => element("#last-below-floor-group-fallback").value,
    lastGroupWithoutFloor: () => element("#last-group-without-floor-fallback").value,
    firstGroupWithoutFloor: () => element("#first-group-without-floor-fallback").value,
    groupsWithoutFloorCount: () => element("#groups-without-floor-count-fallback").value,
    groupsWithoutFloorRemaining: () => element("#groups-without-floor-remaining-fallback").value,
    lastGroupWithoutFloorRemaining: () => element("#last-group-without-floor-remaining-fallback").value,
    firstGroupWithoutFloorRemaining: () => element("#first-group-without-floor-remaining-fallback").value,
    firstGroupWithoutFloorCost: () => element("#first-group-without-floor-cost-fallback").value,
    lastGroupWithoutFloorCost: () => element("#last-group-without-floor-cost-fallback").value,
    changeCostCsv: () => element("#change-cost-csv-fallback").value,
    fileComparison: () => element("#file-comparison").innerHTML,
    compareFiles: async (left, right) => {
      await element("#compare-file-left").events.get("change")({
        target: { files: [{ size: left.length, text: async () => left }], value: "left.json" },
      });
      await element("#compare-file-right").events.get("change")({
        target: { files: [{ size: right.length, text: async () => right }], value: "right.json" },
      });
      await element("#compare-files-button").events.get("click")();
    },
    clearFocus: () => { focusedSelector = ""; },
    keydown: (key, target = { tagName: "BODY", isContentEditable: false }, extras = {}) => {
      documentEvents.get("keydown")({
        key,
        ctrlKey: false,
        metaKey: false,
        altKey: false,
        shiftKey: extras.shiftKey === true,
        defaultPrevented: extras.defaultPrevented === true,
        preventDefault() {},
        target,
      });
    },
  };
}

test("invalid thresholds in storage and share links fail closed without replacing the workshop", async () => {
  const key = "smallest-agreement:proposal:v1";
  const valid = { title: "Custom saved workshop", threshold: 70,
    groups: [{ id: "g", name: "Group", weight: 1 }],
    clauses: [{ id: "clause", title: "Clause", options: [
      { id: "original", label: "Original", original: true, changeCost: 0, support: { g: 60 } },
      { id: "alternative", label: "Alternative", original: false, changeCost: 1, support: { g: 80 } },
      { id: "other", label: "Other", original: false, changeCost: 2, support: { g: 90 } },
    ] }],
  };
  for (const value of [101, -1, null, "70", false, {}]) {
    const storage = new Map([[key, JSON.stringify({ ...valid, threshold: value })]]);
    const app = await savedWorkbench(storage);
    assert.equal(app.title(), "Neighbourhood Plan: the shared green", `stored threshold ${String(value)}`);
    assert.match(app.message(), /Local draft ignored: threshold must be a number from 0 to 100/u, `stored threshold ${String(value)}`);
    assert.doesNotMatch(app.alert(), /Fix the proposal before searching/u);
  }
  const encoded = Buffer.from(JSON.stringify({ ...valid, threshold: 101 })).toString("base64url");
  const shared = await savedWorkbench(new Map(), `#agreement=${encoded}`);
  assert.equal(shared.title(), "Neighbourhood Plan: the shared green");
  assert.match(shared.message(), /Share link ignored: threshold must be a number from 0 to 100/u);
});

test("share links reject malformed UTF-8 instead of loading replacement text", async () => {
  const draft = { title: "Corrupt workshop", threshold: 70,
    groups: [{ id: "g", name: "Group", weight: 1 }],
    clauses: [{ id: "clause", title: "Clause", options: [
      { id: "original", label: "Original", original: true, changeCost: 0, support: { g: 60 } },
      { id: "alternative", label: "Alternative", original: false, changeCost: 1, support: { g: 80 } },
      { id: "other", label: "Other", original: false, changeCost: 2, support: { g: 90 } },
    ] }],
  };
  const bytes = Buffer.from(JSON.stringify(draft));
  const titleStart = bytes.indexOf("Corrupt");
  bytes[titleStart] = 0xc3;
  bytes[titleStart + 1] = 0x28;

  const app = await savedWorkbench(new Map(), `#agreement=${bytes.toString("base64url")}`);
  assert.equal(app.title(), "Neighbourhood Plan: the shared green");
  assert.match(app.message(), /Share link ignored: it is not valid UTF-8/u);
});

test("share-link and storage parse failures name the decode or JSON cause", async () => {
  const key = "smallest-agreement:proposal:v1";
  const cases = [
    ["#agreement=%", /Share link ignored: the URL encoding is invalid/u],
    ["#agreement=$$$$", /Share link ignored: it is not valid base64/u],
    [`#agreement=${Buffer.from("not-json").toString("base64url")}`, /Share link ignored: the text is not valid JSON/u],
  ];
  for (const [hash, pattern] of cases) {
    const app = await savedWorkbench(new Map(), hash);
    assert.equal(app.title(), "Neighbourhood Plan: the shared green", hash);
    assert.match(app.message(), pattern, hash);
  }

  const storedJson = await savedWorkbench(new Map([[key, "{not json"]]));
  assert.equal(storedJson.title(), "Neighbourhood Plan: the shared green");
  assert.match(storedJson.message(), /Local draft ignored: the text is not valid JSON/u);
});

test("import failures name JSON syntax, the first invalid field, and oversize files", async () => {
  const draft = { title: "Imported workshop", threshold: 70,
    groups: [{ id: "g", name: "Group", weight: 1 }],
    clauses: [{ id: "clause", title: "Clause", options: [
      { id: "original", label: "Original", original: true, changeCost: 0, support: { g: 60 } },
      { id: "alternative", label: "Alternative", original: false, changeCost: 1, support: { g: 80 } },
      { id: "other", label: "Other", original: false, changeCost: 2, support: { g: 90 } },
    ] }],
  };
  const app = await savedWorkbench(new Map());
  await app.importJson("{not json");
  assert.match(app.message(), /Import failed: the text is not valid JSON/u);
  await app.importJson("[]");
  assert.match(app.message(), /Import failed: Proposal must be an object/u);
  await app.importJson(JSON.stringify({ ...draft, threshold: 101 }));
  assert.match(app.message(), /Import failed: threshold must be a number from 0 to 100/u);
  await app.importJson("{}", { size: 250_001 });
  assert.match(app.message(), /Import failed: files must be 250 KB or smaller/u);
  assert.equal(app.title(), "Neighbourhood Plan: the shared green");
  assert.doesNotMatch(app.title(), /Track cycling club hours/u);
  assert.doesNotMatch(app.title(), /Gravel cycling club hours/u);
  assert.doesNotMatch(app.title(), /Road cycling club hours/u);
});

test("newer imports and edits supersede slower file reads", async () => {
  const draft = { title: "Earlier import", threshold: 70,
    groups: [{ id: "g", name: "Group", weight: 1 }],
    clauses: [{ id: "clause", title: "Clause", options: [
      { id: "original", label: "Original", original: true, changeCost: 0, support: { g: 60 } },
      { id: "alternative", label: "Alternative", original: false, changeCost: 1, support: { g: 80 } },
      { id: "other", label: "Other", original: false, changeCost: 2, support: { g: 90 } },
    ] }],
  };
  const storage = new Map();
  const app = await savedWorkbench(storage);
  let releaseEarlier;
  const earlierRead = new Promise((resolve) => { releaseEarlier = resolve; });
  const earlierImport = app.importJson("", { size: 100, read: earlierRead });
  await app.importJson(JSON.stringify({ ...draft, title: "Latest import" }));
  releaseEarlier(JSON.stringify(draft));
  await earlierImport;
  assert.equal(app.title(), "Latest import");

  let releasePending;
  const pendingRead = new Promise((resolve) => { releasePending = resolve; });
  const pendingImport = app.importJson("", { size: 100, read: pendingRead });
  app.setTitle("Intervening edit");
  releasePending(JSON.stringify({ ...draft, title: "Stale import" }));
  await pendingImport;
  assert.equal(app.title(), "Intervening edit");
  assert.equal(JSON.parse(storage.get("smallest-agreement:proposal:v1")).title, "Intervening edit");
});

test("invalid budget and floor edits preserve the last valid custom autosave across reloads", async () => {
  const key = "smallest-agreement:proposal:v1";
  const draft = { title: "Custom saved workshop", threshold: 70, maxChangeCost: 3,
    groups: [{ id: "g", name: "Custom group", weight: 1, minSupport: 50 }],
    clauses: [{ id: "clause", title: "Custom clause", options: [
      { id: "original", label: "Original", original: true, changeCost: 0, support: { g: 60 } },
      { id: "alternative", label: "Alternative", original: false, changeCost: 1, support: { g: 80 } },
      { id: "other", label: "Other", original: false, changeCost: 2, support: { g: 90 } },
    ] }],
  };
  for (const [field, invalid, corrected] of [["budget", -1, 2], ["floor", 101, 75]]) {
    const storage = new Map([[key, JSON.stringify(draft)]]);
    const app = await savedWorkbench(storage);
    app.setTitle(`Custom ${field} workshop`);
    const lastValid = storage.get(key);
    assert.match(app.message(), /Saved in this browser/u);
    app.edit(field, invalid);
    assert.match(app.message(), field === "budget"
      ? /Invalid edits are not saved: maxChangeCost must be from 0 through/u
      : /Invalid edits are not saved: groups\[0\]\.minSupport must be from 0 to 100/u);
    assert.equal(storage.get(key), lastValid);
    const reloaded = await savedWorkbench(storage);
    assert.equal(reloaded.title(), `Custom ${field} workshop`);
    assert.deepEqual(JSON.parse(storage.get(key)), JSON.parse(lastValid));
    app.edit(field, corrected);
    assert.match(app.message(), /Saved in this browser/u);
    const persisted = JSON.parse(storage.get(key));
    assert.equal(field === "budget" ? persisted.maxChangeCost : persisted.groups[0].minSupport, corrected);
    assert.equal((await savedWorkbench(storage)).title(), `Custom ${field} workshop`);
  }
});

test("empty and whitespace title edits clear stale results and block export and sharing until corrected", async () => {
  const key = "smallest-agreement:proposal:v1";
  const storage = new Map();
  const app = await savedWorkbench(storage);
  app.setTitle("Custom title kept in storage");
  const lastValid = storage.get(key);
  for (const title of ["", "   "]) {
    app.setTitle(title);
    assert.equal(app.title(), title, "typing must preserve the entered text");
    assert.match(app.message(), /Invalid edits are not saved: title must be a non-empty string no longer than 120 characters/u);
    assert.match(app.alert(), /Fix the proposal before searching: title must be a non-empty string no longer than 120 characters/u);
    assert.match(app.summary(), /Not evaluated/u);
    assert.equal(app.disabled("#export-button"), true);
    assert.equal(app.disabled("#share-button"), true);
    assert.equal(storage.get(key), lastValid);
    assert.doesNotThrow(() => app.click("#export-button"));
    assert.match(app.message(), /Correct invalid inputs before exporting JSON/u);
    await app.click("#share-button");
    assert.match(app.message(), /Correct invalid inputs before sharing/u);
  }
  app.setTitle("Corrected workshop title");
  assert.equal(app.title(), "Corrected workshop title");
  assert.doesNotMatch(app.alert(), /Fix the proposal before searching/u);
  assert.doesNotMatch(app.summary(), /Not evaluated/u);
  assert.equal(app.disabled("#export-button"), false);
  assert.equal(app.disabled("#share-button"), false);
  assert.equal(JSON.parse(storage.get(key)).title, "Corrected workshop title");
});

test("editor disables add controls at the model's validation caps", async () => {
  const key = "smallest-agreement:proposal:v1";
  const base = { title: "Bounded workshop", threshold: 70,
    groups: [{ id: "g", name: "Group", weight: 1 }],
    clauses: [{ id: "clause", title: "Clause", options: [
      { id: "original", label: "Original", original: true, changeCost: 0, support: { g: 60 } },
      { id: "alternative", label: "Alternative", original: false, changeCost: 1, support: { g: 80 } },
      { id: "other", label: "Other", original: false, changeCost: 2, support: { g: 90 } },
    ] }],
  };

  const groupCapped = structuredClone(base);
  groupCapped.groups = Array.from({ length: 24 }, (_, index) => ({ id: `g${index}`, name: `Group ${index}`, weight: 1 }));
  for (const option of groupCapped.clauses[0].options) option.support = Object.fromEntries(groupCapped.groups.map(({ id }) => [id, 50]));
  const cappedGroups = await savedWorkbench(new Map([[key, JSON.stringify(groupCapped)]]));
  assert.equal(cappedGroups.disabled('[data-action="add-group"]'), true);
  assert.match(cappedGroups.groups(), /data-action="duplicate-group"[^>]*disabled/u);

  const clauseCapped = structuredClone(base);
  clauseCapped.clauses = Array.from({ length: 20 }, (_, index) => ({ ...structuredClone(base.clauses[0]), id: `clause-${index}` }));
  assert.equal((await savedWorkbench(new Map([[key, JSON.stringify(clauseCapped)]]))).disabled('[data-action="add-clause"]'), true);

  const optionCapped = structuredClone(base);
  optionCapped.clauses[0].options.push(...Array.from({ length: 21 }, (_, index) => ({
    id: `extra-${index}`, label: `Extra ${index}`, original: false, changeCost: index + 3, support: { g: 50 },
  })));
  assert.match((await savedWorkbench(new Map([[key, JSON.stringify(optionCapped)]]))).clauses(), /data-action="add-option"[^>]*disabled/u);
  const duplicateCapped = await savedWorkbench(new Map([[key, JSON.stringify(clauseCapped)]]));
  assert.match(duplicateCapped.clauses(), /data-action="duplicate-clause"[^>]*disabled/u);
});


test("undo and redo restore edits and replacement imports; new edits clear redo", async () => {
  const storage = new Map();
  const app = await savedWorkbench(storage);
  const original = app.title();
  assert.equal(app.disabled("#undo-button"), true);
  app.setTitle("Negotiation draft");
  app.click("#undo-button");
  assert.equal(app.title(), original);
  app.click("#redo-button");
  assert.equal(app.title(), "Negotiation draft");
  app.click("#undo-button");
  app.setTitle("Another round");
  assert.equal(app.disabled("#redo-button"), true);
  assert.equal(JSON.parse(storage.get("smallest-agreement:proposal:v1")).title, "Another round");
});


test("named snapshots survive reload, load independently, and support undo", async () => {
  const storage = new Map();
  const app = await savedWorkbench(storage);
  app.setTitle("First round");
  app.field("#scenario-name", "Working group");
  app.click("#save-scenario");
  app.setTitle("Second round");
  app.field("#scenario-select", "0");
  app.click("#load-scenario");
  assert.equal(app.title(), "First round");
  app.click("#undo-button");
  assert.equal(app.title(), "Second round");
  const next = await savedWorkbench(storage);
  next.field("#scenario-select", "0");
  next.click("#load-scenario");
  assert.equal(next.title(), "First round");
  assert.equal(JSON.parse(storage.get("smallest-agreement:scenarios:v1"))[0].name, "Working group");
});

test("invalid scenario libraries are preserved and cannot be overwritten", async () => {
  const key = "smallest-agreement:scenarios:v1";
  const storage = new Map([[key, "{broken"]]);
  const app = await savedWorkbench(storage);
  assert.equal(app.disabled("#save-scenario"), true);
  app.click("#save-scenario");
  assert.equal(storage.get(key), "{broken");
});


test("required numeric edits remain invalid instead of silently changing support, cost, or weight", async () => {
  for (const [field, value, details] of [
    ["group-weight", 0, { groupId: "residents" }],
    ["group-weight", NaN, { groupId: "residents" }],
    ["option-support", 101, { clauseId: "hours", optionId: "hours-original", groupId: "residents" }],
    ["option-support", NaN, { clauseId: "hours", optionId: "hours-original", groupId: "residents" }],
    ["option-cost", -1, { clauseId: "hours", optionId: "hours-seasonal" }],
  ]) {
    const storage = new Map();
    const app = await savedWorkbench(storage);
    app.setTitle("Valid saved draft");
    const before = storage.get("smallest-agreement:proposal:v1");
    app.edit(field, value, { field, ...details });
    assert.match(app.alert(), /Fix the proposal before searching/);
    assert.equal(app.disabled("#export-button"), true);
    assert.equal(storage.get("smallest-agreement:proposal:v1"), before);
    app.click("#undo-button");
    assert.doesNotMatch(app.alert(), /Fix the proposal/);
  }
});


test("exact thresholds preserve decimals and reject missing values without corrupting autosave", async () => {
  const storage = new Map();
  const app = await savedWorkbench(storage);
  app.numberInput("#threshold-number", 68.125);
  assert.equal(JSON.parse(storage.get("smallest-agreement:proposal:v1")).threshold, 68.125);
  app.numberInput("#threshold-number", NaN);
  assert.match(app.alert(), /Fix the proposal/);
  assert.equal(JSON.parse(storage.get("smallest-agreement:proposal:v1")).threshold, 68.125);
  app.click("#undo-button");
  assert.doesNotMatch(app.alert(), /Fix the proposal/);
});


test("saving snapshots cannot overwrite a library changed by another tab", async () => {
  const storage = new Map();
  const first = await savedWorkbench(storage);
  const second = await savedWorkbench(storage);
  first.field("#scenario-name", "First tab snapshot");
  first.click("#save-scenario");
  const saved = storage.get("smallest-agreement:scenarios:v1");
  second.click("#save-scenario");
  assert.equal(storage.get("smallest-agreement:scenarios:v1"), saved);
  assert.match(second.message(), /changed in another tab/);
});

test("weight shares and leftover budget are visible accounting, not voting rights", async () => {
  const app = await savedWorkbench(new Map());
  app.field("#preset-select", "protected-access");
  app.click("#load-preset");
  assert.match(app.shares(), /Regular participants/u);
  assert.match(app.shares(), /mixing weights/u);
  assert.match(app.summary(), /Budget remaining/u);
});

test("workplace hybrid preset loads a valid three-group office policy", async () => {
  const app = await savedWorkbench(new Map());
  app.field("#preset-select", "workplace-hybrid");
  app.click("#load-preset");
  assert.match(app.title(), /Workplace Hybrid: office presence policy/u);
  assert.equal(app.disabled("#export-button"), false);
  assert.doesNotMatch(app.alert(), /Fix the proposal/u);
  assert.match(app.clauses(), /Weekly office presence/u);
  assert.match(app.clauses(), /Core collaboration hours/u);
  assert.match(app.clauses(), /Desk assignment/u);
  assert.match(app.clauses(), /On-site staff|data-group-id="onsite"|onsite/u);
});

test("club constitution preset loads a distinct synthetic membership-meeting workshop", async () => {
  const app = await savedWorkbench(new Map());
  app.field("#preset-select", "club-constitution");
  app.click("#load-preset");
  assert.match(app.title(), /Club Constitution: membership meetings/u);
  assert.equal(app.disabled("#export-button"), false);
  assert.doesNotMatch(app.alert(), /Fix the proposal/u);
  assert.match(app.clauses(), /Meeting quorum/u);
  assert.match(app.clauses(), /Proxy votes/u);
  assert.match(app.clauses(), /Guest speakers at general meetings/u);
  assert.match(app.groups(), /Officers/u);
  assert.match(app.groups(), /Club staff/u);
  assert.doesNotMatch(app.title(), /Workplace Hybrid/u);
  assert.doesNotMatch(app.title(), /Neighbourhood Plan/u);
  assert.doesNotMatch(app.clauses(), /Weekly office presence/u);
  assert.doesNotMatch(app.clauses(), /Park access hours/u);
});

test("library quiet hours preset loads a distinct synthetic reading-room workshop", async () => {
  const app = await savedWorkbench(new Map());
  app.field("#preset-select", "library-quiet-hours");
  app.click("#load-preset");
  assert.match(app.title(), /Library Quiet Hours: shared reading rooms/u);
  assert.equal(app.disabled("#export-button"), false);
  assert.doesNotMatch(app.alert(), /Fix the proposal/u);
  assert.match(app.clauses(), /Evening hours/u);
  assert.match(app.clauses(), /Children&#39;s area sound rules/u);
  assert.match(app.clauses(), /After-hours events/u);
  assert.match(app.groups(), /Readers/u);
  assert.match(app.groups(), /Families/u);
  assert.match(app.groups(), /Library staff/u);
  assert.doesNotMatch(app.title(), /Workplace Hybrid/u);
  assert.doesNotMatch(app.title(), /Neighbourhood Plan/u);
  assert.doesNotMatch(app.title(), /Club Constitution/u);
  assert.doesNotMatch(app.clauses(), /Weekly office presence/u);
  assert.doesNotMatch(app.clauses(), /Park access hours/u);
  assert.doesNotMatch(app.clauses(), /Meeting quorum/u);
});

test("sports fixture night preset loads a distinct synthetic match-evening workshop", async () => {
  const app = await savedWorkbench(new Map());
  app.field("#preset-select", "sports-fixture-night");
  app.click("#load-preset");
  assert.match(app.title(), /Sports Fixture Night: match end-time, floodlights, and parking/u);
  assert.equal(app.disabled("#export-button"), false);
  assert.doesNotMatch(app.alert(), /Fix the proposal/u);
  assert.match(app.clauses(), /Match end-time/u);
  assert.match(app.clauses(), /Floodlights/u);
  assert.match(app.clauses(), /Match-night parking/u);
  assert.match(app.groups(), /Members/u);
  assert.match(app.groups(), /Neighbours/u);
  assert.match(app.groups(), /Council rangers/u);
  assert.doesNotMatch(app.title(), /Workplace Hybrid/u);
  assert.doesNotMatch(app.title(), /Neighbourhood Plan/u);
  assert.doesNotMatch(app.title(), /Club Constitution/u);
  assert.doesNotMatch(app.title(), /Library Quiet Hours/u);
  assert.doesNotMatch(app.clauses(), /Weekly office presence/u);
  assert.doesNotMatch(app.clauses(), /Park access hours/u);
  assert.doesNotMatch(app.clauses(), /Meeting quorum/u);
  assert.doesNotMatch(app.clauses(), /Evening hours/u);
});

test("market stall hours preset loads a distinct synthetic stall workshop", async () => {
  const app = await savedWorkbench(new Map());
  app.field("#preset-select", "market-stall-hours");
  app.click("#load-preset");
  assert.match(app.title(), /Market stall hours: open hours, packing, and neighbour noise/u);
  assert.equal(app.disabled("#export-button"), false);
  assert.doesNotMatch(app.alert(), /Fix the proposal/u);
  assert.match(app.clauses(), /Stall open hours/u);
  assert.match(app.clauses(), /Packing and pack-down/u);
  assert.match(app.clauses(), /Neighbour noise/u);
  assert.match(app.groups(), /Stallholders/u);
  assert.match(app.groups(), /Neighbours/u);
  assert.match(app.groups(), /Market officers/u);
  assert.doesNotMatch(app.title(), /Sports Fixture Night/u);
  assert.doesNotMatch(app.title(), /Neighbourhood Plan/u);
  assert.doesNotMatch(app.title(), /Library Quiet Hours/u);
  assert.doesNotMatch(app.clauses(), /Match end-time/u);
  assert.doesNotMatch(app.clauses(), /Park access hours/u);
  assert.doesNotMatch(app.clauses(), /Evening hours/u);
  assert.doesNotMatch(app.clauses(), /Weekend market use/u);
});

test("shared bike shed preset loads a distinct synthetic neighbour workshop", async () => {
  const app = await savedWorkbench(new Map());
  app.field("#preset-select", "shared-bike-shed");
  app.click("#load-preset");
  assert.match(app.title(), /Shared bike shed: access hours, lighting, and lock-up/u);
  assert.equal(app.disabled("#export-button"), false);
  assert.doesNotMatch(app.alert(), /Fix the proposal/u);
  assert.match(app.clauses(), /Access hours/u);
  assert.match(app.clauses(), /Shed lighting/u);
  assert.match(app.clauses(), /Lock-up/u);
  assert.match(app.groups(), /Bike users/u);
  assert.match(app.groups(), /Neighbours/u);
  assert.match(app.groups(), /Building managers/u);
  assert.doesNotMatch(app.title(), /Market stall hours/u);
  assert.doesNotMatch(app.title(), /Sports Fixture Night/u);
  assert.doesNotMatch(app.title(), /Neighbourhood Plan/u);
  assert.doesNotMatch(app.title(), /Library Quiet Hours/u);
  assert.doesNotMatch(app.title(), /Shared laundry hours/u);
  assert.doesNotMatch(app.clauses(), /Stall open hours/u);
  assert.doesNotMatch(app.clauses(), /Match end-time/u);
  assert.doesNotMatch(app.clauses(), /Park access hours/u);
  assert.doesNotMatch(app.clauses(), /Evening hours/u);
  assert.doesNotMatch(app.clauses(), /Weekend market use/u);
  assert.doesNotMatch(app.clauses(), /Wash hours/u);
  assert.doesNotMatch(app.clauses(), /Dryer noise/u);
  assert.doesNotMatch(app.groups(), /Tenants/u);
});

test("street stall lighting preset loads a distinct synthetic lighting workshop", async () => {
  const app = await savedWorkbench(new Map());
  app.field("#preset-select", "street-stall-lighting");
  app.click("#load-preset");
  assert.match(app.title(), /Street stall lighting: lighting hours, glare, and pack-down/u);
  assert.equal(app.disabled("#export-button"), false);
  assert.doesNotMatch(app.alert(), /Fix the proposal/u);
  assert.match(app.clauses(), /Lighting hours/u);
  assert.match(app.clauses(), /Glare/u);
  assert.match(app.clauses(), /Pack-down lighting/u);
  assert.match(app.groups(), /Stallholders/u);
  assert.match(app.groups(), /Nearby residents/u);
  assert.match(app.groups(), /Council officers/u);
  assert.doesNotMatch(app.title(), /Market stall hours/u);
  assert.doesNotMatch(app.title(), /Shared bike shed/u);
  assert.doesNotMatch(app.title(), /Sports Fixture Night/u);
  assert.doesNotMatch(app.title(), /Neighbourhood Plan/u);
  assert.doesNotMatch(app.title(), /Library Quiet Hours/u);
  assert.doesNotMatch(app.title(), /Open Source Policy/u);
  assert.doesNotMatch(app.title(), /Association Budget/u);
  assert.doesNotMatch(app.title(), /Protected Access/u);
  assert.doesNotMatch(app.title(), /Workplace Hybrid/u);
  assert.doesNotMatch(app.title(), /Club Constitution/u);
  assert.doesNotMatch(app.clauses(), /Stall open hours/u);
  assert.doesNotMatch(app.clauses(), /Access hours/u);
  assert.doesNotMatch(app.clauses(), /Match end-time/u);
  assert.doesNotMatch(app.clauses(), /Park access hours/u);
  assert.doesNotMatch(app.clauses(), /Evening hours/u);
  assert.doesNotMatch(app.clauses(), /Weekend market use/u);
  assert.doesNotMatch(app.groups(), /Market officers/u);
  assert.doesNotMatch(app.groups(), /Building managers/u);
});

test("hall hire hours preset loads a distinct synthetic hall workshop", async () => {
  const app = await savedWorkbench(new Map());
  app.field("#preset-select", "hall-hire-hours");
  app.click("#load-preset");
  assert.match(app.title(), /Hall hire hours: close time, PA volume, and clean-up/u);
  assert.equal(app.disabled("#export-button"), false);
  assert.doesNotMatch(app.alert(), /Fix the proposal/u);
  assert.match(app.clauses(), /Close time/u);
  assert.match(app.clauses(), /PA volume/u);
  assert.match(app.clauses(), /Clean-up/u);
  assert.match(app.groups(), /Hirers/u);
  assert.match(app.groups(), /Neighbours/u);
  assert.match(app.groups(), /Hall committee/u);
  assert.doesNotMatch(app.title(), /Street stall lighting/u);
  assert.doesNotMatch(app.title(), /Market stall hours/u);
  assert.doesNotMatch(app.title(), /Shared bike shed/u);
  assert.doesNotMatch(app.title(), /Sports Fixture Night/u);
  assert.doesNotMatch(app.title(), /Neighbourhood Plan/u);
  assert.doesNotMatch(app.title(), /Library Quiet Hours/u);
  assert.doesNotMatch(app.title(), /Open Source Policy/u);
  assert.doesNotMatch(app.title(), /Association Budget/u);
  assert.doesNotMatch(app.title(), /Protected Access/u);
  assert.doesNotMatch(app.title(), /Workplace Hybrid/u);
  assert.doesNotMatch(app.title(), /Club Constitution/u);
  assert.doesNotMatch(app.title(), /Community garden watering/u);
  assert.doesNotMatch(app.title(), /Shared laundry hours/u);
  assert.doesNotMatch(app.clauses(), /Lighting hours/u);
  assert.doesNotMatch(app.clauses(), /Stall open hours/u);
  assert.doesNotMatch(app.clauses(), /Access hours/u);
  assert.doesNotMatch(app.clauses(), /Match end-time/u);
  assert.doesNotMatch(app.clauses(), /Park access hours/u);
  assert.doesNotMatch(app.clauses(), /Evening hours/u);
  assert.doesNotMatch(app.clauses(), /Weekend market use/u);
  assert.doesNotMatch(app.groups(), /Stallholders/u);
  assert.doesNotMatch(app.groups(), /Nearby residents/u);
  assert.doesNotMatch(app.groups(), /Market officers/u);
  assert.doesNotMatch(app.groups(), /Building managers/u);
  assert.doesNotMatch(app.groups(), /Council officers/u);
  assert.doesNotMatch(app.groups(), /Plot-holders/u);
  assert.doesNotMatch(app.groups(), /Garden committee/u);
  assert.doesNotMatch(app.clauses(), /Watering hours/u);
  assert.doesNotMatch(app.clauses(), /Hose noise/u);
  assert.doesNotMatch(app.clauses(), /Wash hours/u);
  assert.doesNotMatch(app.clauses(), /Dryer noise/u);
  assert.doesNotMatch(app.groups(), /Tenants/u);
});

test("community garden watering preset loads a distinct synthetic watering workshop", async () => {
  const app = await savedWorkbench(new Map());
  app.field("#preset-select", "community-garden-watering");
  app.click("#load-preset");
  assert.match(app.title(), /Community garden watering: watering hours, hose noise, and lock-up/u);
  assert.equal(app.disabled("#export-button"), false);
  assert.doesNotMatch(app.alert(), /Fix the proposal/u);
  assert.match(app.clauses(), /Watering hours/u);
  assert.match(app.clauses(), /Hose noise/u);
  assert.match(app.clauses(), /Garden lock-up/u);
  assert.match(app.groups(), /Plot-holders/u);
  assert.match(app.groups(), /Neighbours/u);
  assert.match(app.groups(), /Garden committee/u);
  assert.doesNotMatch(app.title(), /Hall hire hours/u);
  assert.doesNotMatch(app.title(), /Street stall lighting/u);
  assert.doesNotMatch(app.title(), /Market stall hours/u);
  assert.doesNotMatch(app.title(), /Shared bike shed/u);
  assert.doesNotMatch(app.title(), /Sports Fixture Night/u);
  assert.doesNotMatch(app.title(), /Neighbourhood Plan/u);
  assert.doesNotMatch(app.title(), /Library Quiet Hours/u);
  assert.doesNotMatch(app.title(), /Open Source Policy/u);
  assert.doesNotMatch(app.title(), /Association Budget/u);
  assert.doesNotMatch(app.title(), /Protected Access/u);
  assert.doesNotMatch(app.title(), /Workplace Hybrid/u);
  assert.doesNotMatch(app.title(), /Club Constitution/u);
  assert.doesNotMatch(app.clauses(), /Close time/u);
  assert.doesNotMatch(app.clauses(), /PA volume/u);
  assert.doesNotMatch(app.clauses(), /Clean-up/u);
  assert.doesNotMatch(app.clauses(), /Lighting hours/u);
  assert.doesNotMatch(app.clauses(), /Stall open hours/u);
  assert.doesNotMatch(app.clauses(), /Access hours/u);
  assert.doesNotMatch(app.clauses(), /Match end-time/u);
  assert.doesNotMatch(app.clauses(), /Park access hours/u);
  assert.doesNotMatch(app.clauses(), /Evening hours/u);
  assert.doesNotMatch(app.clauses(), /Weekend market use/u);
  assert.doesNotMatch(app.groups(), /Hirers/u);
  assert.doesNotMatch(app.groups(), /Hall committee/u);
  assert.doesNotMatch(app.groups(), /Stallholders/u);
  assert.doesNotMatch(app.groups(), /Nearby residents/u);
  assert.doesNotMatch(app.groups(), /Market officers/u);
  assert.doesNotMatch(app.groups(), /Building managers/u);
  assert.doesNotMatch(app.groups(), /Council officers/u);
  assert.doesNotMatch(app.title(), /Shared laundry hours/u);
  assert.doesNotMatch(app.clauses(), /Wash hours/u);
  assert.doesNotMatch(app.clauses(), /Dryer noise/u);
  assert.doesNotMatch(app.groups(), /Tenants/u);
});

test("shared laundry hours preset loads a distinct synthetic laundry workshop", async () => {
  const app = await savedWorkbench(new Map());
  app.field("#preset-select", "shared-laundry-hours");
  app.click("#load-preset");
  assert.match(app.title(), /Shared laundry hours: wash hours, dryer noise, and lock-up/u);
  assert.equal(app.disabled("#export-button"), false);
  assert.doesNotMatch(app.alert(), /Fix the proposal/u);
  assert.match(app.clauses(), /Wash hours/u);
  assert.match(app.clauses(), /Dryer noise/u);
  assert.match(app.clauses(), /Laundry lock-up/u);
  assert.match(app.groups(), /Tenants/u);
  assert.match(app.groups(), /Neighbours/u);
  assert.match(app.groups(), /Building managers/u);
  assert.doesNotMatch(app.title(), /Community garden watering/u);
  assert.doesNotMatch(app.title(), /Hall hire hours/u);
  assert.doesNotMatch(app.title(), /Street stall lighting/u);
  assert.doesNotMatch(app.title(), /Market stall hours/u);
  assert.doesNotMatch(app.title(), /Shared bike shed/u);
  assert.doesNotMatch(app.title(), /Sports Fixture Night/u);
  assert.doesNotMatch(app.title(), /Neighbourhood Plan/u);
  assert.doesNotMatch(app.title(), /Library Quiet Hours/u);
  assert.doesNotMatch(app.title(), /Open Source Policy/u);
  assert.doesNotMatch(app.title(), /Association Budget/u);
  assert.doesNotMatch(app.title(), /Protected Access/u);
  assert.doesNotMatch(app.title(), /Workplace Hybrid/u);
  assert.doesNotMatch(app.title(), /Club Constitution/u);
  assert.doesNotMatch(app.clauses(), /Watering hours/u);
  assert.doesNotMatch(app.clauses(), /Hose noise/u);
  assert.doesNotMatch(app.clauses(), /Garden lock-up/u);
  assert.doesNotMatch(app.clauses(), /Close time/u);
  assert.doesNotMatch(app.clauses(), /PA volume/u);
  assert.doesNotMatch(app.clauses(), /Clean-up/u);
  assert.doesNotMatch(app.clauses(), /Lighting hours/u);
  assert.doesNotMatch(app.clauses(), /Access hours/u);
  assert.doesNotMatch(app.clauses(), /Stall open hours/u);
  assert.doesNotMatch(app.clauses(), /Match end-time/u);
  assert.doesNotMatch(app.clauses(), /Park access hours/u);
  assert.doesNotMatch(app.clauses(), /Evening hours/u);
  assert.doesNotMatch(app.groups(), /Plot-holders/u);
  assert.doesNotMatch(app.groups(), /Garden committee/u);
  assert.doesNotMatch(app.groups(), /Hirers/u);
  assert.doesNotMatch(app.groups(), /Hall committee/u);
  assert.doesNotMatch(app.groups(), /Stallholders/u);
  assert.doesNotMatch(app.groups(), /Bike users/u);
  assert.doesNotMatch(app.title(), /Rooftop BBQ hours/u);
  assert.doesNotMatch(app.clauses(), /Cook hours/u);
  assert.doesNotMatch(app.clauses(), /Smoke/u);
  assert.doesNotMatch(app.groups(), /Building committee/u);
});

test("rooftop BBQ hours preset loads a distinct synthetic rooftop workshop", async () => {
  const app = await savedWorkbench(new Map());
  app.field("#preset-select", "rooftop-bbq-hours");
  app.click("#load-preset");
  assert.match(app.title(), /Rooftop BBQ hours: cook hours, smoke, and lock-up/u);
  assert.equal(app.disabled("#export-button"), false);
  assert.doesNotMatch(app.alert(), /Fix the proposal/u);
  assert.match(app.clauses(), /Cook hours/u);
  assert.match(app.clauses(), /Smoke/u);
  assert.match(app.clauses(), /Rooftop lock-up/u);
  assert.match(app.groups(), /Residents/u);
  assert.match(app.groups(), /Neighbours/u);
  assert.match(app.groups(), /Building committee/u);
  assert.doesNotMatch(app.title(), /Shared laundry hours/u);
  assert.doesNotMatch(app.title(), /Community garden watering/u);
  assert.doesNotMatch(app.title(), /Hall hire hours/u);
  assert.doesNotMatch(app.title(), /Street stall lighting/u);
  assert.doesNotMatch(app.title(), /Market stall hours/u);
  assert.doesNotMatch(app.title(), /Shared bike shed/u);
  assert.doesNotMatch(app.title(), /Sports Fixture Night/u);
  assert.doesNotMatch(app.title(), /Neighbourhood Plan/u);
  assert.doesNotMatch(app.title(), /Library Quiet Hours/u);
  assert.doesNotMatch(app.clauses(), /Wash hours/u);
  assert.doesNotMatch(app.clauses(), /Dryer noise/u);
  assert.doesNotMatch(app.clauses(), /Laundry lock-up/u);
  assert.doesNotMatch(app.clauses(), /Watering hours/u);
  assert.doesNotMatch(app.clauses(), /Hose noise/u);
  assert.doesNotMatch(app.clauses(), /Garden lock-up/u);
  assert.doesNotMatch(app.clauses(), /Close time/u);
  assert.doesNotMatch(app.clauses(), /PA volume/u);
  assert.doesNotMatch(app.clauses(), /Lighting hours/u);
  assert.doesNotMatch(app.clauses(), /Access hours/u);
  assert.doesNotMatch(app.clauses(), /Stall open hours/u);
  assert.doesNotMatch(app.clauses(), /Match end-time/u);
  assert.doesNotMatch(app.clauses(), /Park access hours/u);
  assert.doesNotMatch(app.clauses(), /Evening hours/u);
  assert.doesNotMatch(app.groups(), /Tenants/u);
  assert.doesNotMatch(app.groups(), /Building managers/u);
  assert.doesNotMatch(app.groups(), /Plot-holders/u);
  assert.doesNotMatch(app.groups(), /Garden committee/u);
  assert.doesNotMatch(app.groups(), /Hirers/u);
  assert.doesNotMatch(app.groups(), /Hall committee/u);
  assert.doesNotMatch(app.title(), /School disco hours/u);
  assert.doesNotMatch(app.clauses(), /Finish time/u);
  assert.doesNotMatch(app.clauses(), /Bass/u);
  assert.doesNotMatch(app.groups(), /Students/u);
  assert.doesNotMatch(app.groups(), /P&C/u);
  assert.doesNotMatch(app.title(), /Sports day hours/u);
  assert.doesNotMatch(app.clauses(), /Race start/u);
  assert.doesNotMatch(app.clauses(), /Field lock-up/u);
});

test("school disco hours preset loads a distinct synthetic disco workshop", async () => {
  const app = await savedWorkbench(new Map());
  app.field("#preset-select", "school-disco-hours");
  app.click("#load-preset");
  assert.match(app.title(), /School disco hours: finish time, bass, and lock-up/u);
  assert.equal(app.disabled("#export-button"), false);
  assert.doesNotMatch(app.alert(), /Fix the proposal/u);
  assert.match(app.clauses(), /Finish time/u);
  assert.match(app.clauses(), /Bass/u);
  assert.match(app.clauses(), /Hall lock-up/u);
  assert.match(app.groups(), /Students/u);
  assert.match(app.groups(), /Neighbours/u);
  assert.match(app.groups(), /P&amp;C/u);
  assert.doesNotMatch(app.title(), /Rooftop BBQ hours/u);
  assert.doesNotMatch(app.title(), /Shared laundry hours/u);
  assert.doesNotMatch(app.title(), /Community garden watering/u);
  assert.doesNotMatch(app.title(), /Hall hire hours/u);
  assert.doesNotMatch(app.title(), /Street stall lighting/u);
  assert.doesNotMatch(app.title(), /Market stall hours/u);
  assert.doesNotMatch(app.title(), /Shared bike shed/u);
  assert.doesNotMatch(app.title(), /Sports Fixture Night/u);
  assert.doesNotMatch(app.title(), /Neighbourhood Plan/u);
  assert.doesNotMatch(app.title(), /Library Quiet Hours/u);
  assert.doesNotMatch(app.clauses(), /Cook hours/u);
  assert.doesNotMatch(app.clauses(), /Smoke/u);
  assert.doesNotMatch(app.clauses(), /Rooftop lock-up/u);
  assert.doesNotMatch(app.clauses(), /Wash hours/u);
  assert.doesNotMatch(app.clauses(), /Dryer noise/u);
  assert.doesNotMatch(app.clauses(), /Laundry lock-up/u);
  assert.doesNotMatch(app.clauses(), /Watering hours/u);
  assert.doesNotMatch(app.clauses(), /Close time/u);
  assert.doesNotMatch(app.clauses(), /PA volume/u);
  assert.doesNotMatch(app.clauses(), /Lighting hours/u);
  assert.doesNotMatch(app.clauses(), /Access hours/u);
  assert.doesNotMatch(app.clauses(), /Stall open hours/u);
  assert.doesNotMatch(app.clauses(), /Match end-time/u);
  assert.doesNotMatch(app.clauses(), /Park access hours/u);
  assert.doesNotMatch(app.clauses(), /Evening hours/u);
  assert.doesNotMatch(app.groups(), /Residents/u);
  assert.doesNotMatch(app.groups(), /Building committee/u);
  assert.doesNotMatch(app.groups(), /Tenants/u);
  assert.doesNotMatch(app.groups(), /Building managers/u);
  assert.doesNotMatch(app.groups(), /Hirers/u);
  assert.doesNotMatch(app.groups(), /Hall committee/u);
  assert.doesNotMatch(app.title(), /Sports day hours/u);
  assert.doesNotMatch(app.clauses(), /Race start/u);
  assert.doesNotMatch(app.clauses(), /Field lock-up/u);
  assert.doesNotMatch(app.title(), /Netball training hours/u);
  assert.doesNotMatch(app.clauses(), /Court lights/u);
  assert.doesNotMatch(app.clauses(), /Court lock-up/u);
  assert.doesNotMatch(app.title(), /Swimming club hours/u);
  assert.doesNotMatch(app.clauses(), /Pool open/u);
  assert.doesNotMatch(app.clauses(), /Lane lights/u);
  assert.doesNotMatch(app.clauses(), /Pool lock-up/u);
});

test("sports day hours preset loads a distinct synthetic sports-day workshop", async () => {
  const app = await savedWorkbench(new Map());
  app.field("#preset-select", "sports-day-hours");
  app.click("#load-preset");
  assert.match(app.title(), /Sports day hours: race start, PA volume, and lock-up/u);
  assert.equal(app.disabled("#export-button"), false);
  assert.doesNotMatch(app.alert(), /Fix the proposal/u);
  assert.match(app.clauses(), /Race start/u);
  assert.match(app.clauses(), /PA volume/u);
  assert.match(app.clauses(), /Field lock-up/u);
  assert.match(app.groups(), /Students/u);
  assert.match(app.groups(), /Neighbours/u);
  assert.match(app.groups(), /P&amp;C/u);
  assert.doesNotMatch(app.title(), /School disco hours/u);
  assert.doesNotMatch(app.title(), /Rooftop BBQ hours/u);
  assert.doesNotMatch(app.title(), /Shared laundry hours/u);
  assert.doesNotMatch(app.title(), /Community garden watering/u);
  assert.doesNotMatch(app.title(), /Hall hire hours/u);
  assert.doesNotMatch(app.title(), /Street stall lighting/u);
  assert.doesNotMatch(app.title(), /Market stall hours/u);
  assert.doesNotMatch(app.title(), /Shared bike shed/u);
  assert.doesNotMatch(app.title(), /Sports Fixture Night/u);
  assert.doesNotMatch(app.title(), /Neighbourhood Plan/u);
  assert.doesNotMatch(app.title(), /Library Quiet Hours/u);
  assert.doesNotMatch(app.clauses(), /Finish time/u);
  assert.doesNotMatch(app.clauses(), /Bass/u);
  assert.doesNotMatch(app.clauses(), /Hall lock-up/u);
  assert.doesNotMatch(app.clauses(), /Cook hours/u);
  assert.doesNotMatch(app.clauses(), /Smoke/u);
  assert.doesNotMatch(app.clauses(), /Rooftop lock-up/u);
  assert.doesNotMatch(app.clauses(), /Wash hours/u);
  assert.doesNotMatch(app.clauses(), /Dryer noise/u);
  assert.doesNotMatch(app.clauses(), /Laundry lock-up/u);
  assert.doesNotMatch(app.clauses(), /Watering hours/u);
  assert.doesNotMatch(app.clauses(), /Close time/u);
  assert.doesNotMatch(app.clauses(), /Lighting hours/u);
  assert.doesNotMatch(app.clauses(), /Access hours/u);
  assert.doesNotMatch(app.clauses(), /Stall open hours/u);
  assert.doesNotMatch(app.clauses(), /Match end-time/u);
  assert.doesNotMatch(app.clauses(), /Park access hours/u);
  assert.doesNotMatch(app.clauses(), /Evening hours/u);
  assert.doesNotMatch(app.groups(), /Residents/u);
  assert.doesNotMatch(app.groups(), /Building committee/u);
  assert.doesNotMatch(app.groups(), /Tenants/u);
  assert.doesNotMatch(app.groups(), /Building managers/u);
  assert.doesNotMatch(app.groups(), /Hirers/u);
  assert.doesNotMatch(app.groups(), /Hall committee/u);
  assert.doesNotMatch(app.title(), /Netball training hours/u);
  assert.doesNotMatch(app.clauses(), /Court lights/u);
  assert.doesNotMatch(app.clauses(), /Court lock-up/u);
  assert.doesNotMatch(app.clauses(), /Start time/u);
  assert.doesNotMatch(app.title(), /Swimming club hours/u);
  assert.doesNotMatch(app.clauses(), /Pool open/u);
  assert.doesNotMatch(app.clauses(), /Lane lights/u);
  assert.doesNotMatch(app.clauses(), /Pool lock-up/u);
  assert.doesNotMatch(app.title(), /Athletics club hours/u);
  assert.doesNotMatch(app.clauses(), /Track open/u);
  assert.doesNotMatch(app.clauses(), /Track lock-up/u);
});

test("netball training hours preset loads a distinct synthetic netball workshop", async () => {
  const app = await savedWorkbench(new Map());
  app.field("#preset-select", "netball-training-hours");
  app.click("#load-preset");
  assert.match(app.title(), /Netball training hours: start time, court lights, and lock-up/u);
  assert.equal(app.disabled("#export-button"), false);
  assert.doesNotMatch(app.alert(), /Fix the proposal/u);
  assert.match(app.clauses(), /Start time/u);
  assert.match(app.clauses(), /Court lights/u);
  assert.match(app.clauses(), /Court lock-up/u);
  assert.match(app.groups(), /Students/u);
  assert.match(app.groups(), /Neighbours/u);
  assert.match(app.groups(), /P&amp;C/u);
  assert.doesNotMatch(app.title(), /Sports day hours/u);
  assert.doesNotMatch(app.title(), /School disco hours/u);
  assert.doesNotMatch(app.title(), /Rooftop BBQ hours/u);
  assert.doesNotMatch(app.title(), /Shared laundry hours/u);
  assert.doesNotMatch(app.title(), /Community garden watering/u);
  assert.doesNotMatch(app.title(), /Hall hire hours/u);
  assert.doesNotMatch(app.title(), /Street stall lighting/u);
  assert.doesNotMatch(app.title(), /Market stall hours/u);
  assert.doesNotMatch(app.title(), /Shared bike shed/u);
  assert.doesNotMatch(app.title(), /Sports Fixture Night/u);
  assert.doesNotMatch(app.title(), /Neighbourhood Plan/u);
  assert.doesNotMatch(app.title(), /Library Quiet Hours/u);
  assert.doesNotMatch(app.clauses(), /Race start/u);
  assert.doesNotMatch(app.clauses(), /PA volume/u);
  assert.doesNotMatch(app.clauses(), /Field lock-up/u);
  assert.doesNotMatch(app.clauses(), /Finish time/u);
  assert.doesNotMatch(app.clauses(), /Bass/u);
  assert.doesNotMatch(app.clauses(), /Hall lock-up/u);
  assert.doesNotMatch(app.clauses(), /Cook hours/u);
  assert.doesNotMatch(app.clauses(), /Smoke/u);
  assert.doesNotMatch(app.clauses(), /Rooftop lock-up/u);
  assert.doesNotMatch(app.clauses(), /Wash hours/u);
  assert.doesNotMatch(app.clauses(), /Dryer noise/u);
  assert.doesNotMatch(app.clauses(), /Laundry lock-up/u);
  assert.doesNotMatch(app.clauses(), /Watering hours/u);
  assert.doesNotMatch(app.clauses(), /Close time/u);
  assert.doesNotMatch(app.clauses(), /Lighting hours/u);
  assert.doesNotMatch(app.clauses(), /Access hours/u);
  assert.doesNotMatch(app.clauses(), /Stall open hours/u);
  assert.doesNotMatch(app.clauses(), /Match end-time/u);
  assert.doesNotMatch(app.clauses(), /Park access hours/u);
  assert.doesNotMatch(app.clauses(), /Evening hours/u);
  assert.doesNotMatch(app.groups(), /Residents/u);
  assert.doesNotMatch(app.groups(), /Building committee/u);
  assert.doesNotMatch(app.groups(), /Tenants/u);
  assert.doesNotMatch(app.groups(), /Building managers/u);
  assert.doesNotMatch(app.groups(), /Hirers/u);
  assert.doesNotMatch(app.groups(), /Hall committee/u);
  assert.doesNotMatch(app.title(), /Swimming club hours/u);
  assert.doesNotMatch(app.clauses(), /Pool open/u);
  assert.doesNotMatch(app.clauses(), /Lane lights/u);
  assert.doesNotMatch(app.clauses(), /Pool lock-up/u);
  assert.doesNotMatch(app.title(), /Athletics club hours/u);
  assert.doesNotMatch(app.clauses(), /Track open/u);
  assert.doesNotMatch(app.clauses(), /Track lock-up/u);
});

test("swimming club hours preset loads a distinct synthetic swimming workshop", async () => {
  const app = await savedWorkbench(new Map());
  app.field("#preset-select", "swimming-club-hours");
  app.click("#load-preset");
  assert.match(app.title(), /Swimming club hours: pool open, lane lights, and lock-up/u);
  assert.equal(app.disabled("#export-button"), false);
  assert.doesNotMatch(app.alert(), /Fix the proposal/u);
  assert.match(app.clauses(), /Pool open/u);
  assert.match(app.clauses(), /Lane lights/u);
  assert.match(app.clauses(), /Pool lock-up/u);
  assert.match(app.groups(), /Students/u);
  assert.match(app.groups(), /Neighbours/u);
  assert.match(app.groups(), /P&amp;C/u);
  assert.doesNotMatch(app.title(), /Netball training hours/u);
  assert.doesNotMatch(app.title(), /Sports day hours/u);
  assert.doesNotMatch(app.title(), /School disco hours/u);
  assert.doesNotMatch(app.title(), /Rooftop BBQ hours/u);
  assert.doesNotMatch(app.title(), /Shared laundry hours/u);
  assert.doesNotMatch(app.title(), /Community garden watering/u);
  assert.doesNotMatch(app.title(), /Hall hire hours/u);
  assert.doesNotMatch(app.title(), /Street stall lighting/u);
  assert.doesNotMatch(app.title(), /Market stall hours/u);
  assert.doesNotMatch(app.title(), /Shared bike shed/u);
  assert.doesNotMatch(app.title(), /Sports Fixture Night/u);
  assert.doesNotMatch(app.title(), /Neighbourhood Plan/u);
  assert.doesNotMatch(app.title(), /Library Quiet Hours/u);
  assert.doesNotMatch(app.clauses(), /Start time/u);
  assert.doesNotMatch(app.clauses(), /Court lights/u);
  assert.doesNotMatch(app.clauses(), /Court lock-up/u);
  assert.doesNotMatch(app.clauses(), /Race start/u);
  assert.doesNotMatch(app.clauses(), /PA volume/u);
  assert.doesNotMatch(app.clauses(), /Field lock-up/u);
  assert.doesNotMatch(app.clauses(), /Finish time/u);
  assert.doesNotMatch(app.clauses(), /Bass/u);
  assert.doesNotMatch(app.clauses(), /Hall lock-up/u);
  assert.doesNotMatch(app.clauses(), /Cook hours/u);
  assert.doesNotMatch(app.clauses(), /Smoke/u);
  assert.doesNotMatch(app.clauses(), /Rooftop lock-up/u);
  assert.doesNotMatch(app.clauses(), /Wash hours/u);
  assert.doesNotMatch(app.clauses(), /Dryer noise/u);
  assert.doesNotMatch(app.clauses(), /Laundry lock-up/u);
  assert.doesNotMatch(app.clauses(), /Watering hours/u);
  assert.doesNotMatch(app.clauses(), /Close time/u);
  assert.doesNotMatch(app.clauses(), /Lighting hours/u);
  assert.doesNotMatch(app.clauses(), /Access hours/u);
  assert.doesNotMatch(app.clauses(), /Stall open hours/u);
  assert.doesNotMatch(app.clauses(), /Match end-time/u);
  assert.doesNotMatch(app.clauses(), /Park access hours/u);
  assert.doesNotMatch(app.clauses(), /Evening hours/u);
  assert.doesNotMatch(app.groups(), /Residents/u);
  assert.doesNotMatch(app.groups(), /Building committee/u);
  assert.doesNotMatch(app.groups(), /Tenants/u);
  assert.doesNotMatch(app.groups(), /Building managers/u);
  assert.doesNotMatch(app.groups(), /Hirers/u);
  assert.doesNotMatch(app.groups(), /Hall committee/u);
  assert.doesNotMatch(app.title(), /Athletics club hours/u);
  assert.doesNotMatch(app.clauses(), /Track open/u);
  assert.doesNotMatch(app.clauses(), /Track lock-up/u);
  assert.doesNotMatch(app.title(), /Cricket club hours/u);
  assert.doesNotMatch(app.clauses(), /Scoring nets/u);
  assert.doesNotMatch(app.clauses(), /Tea room/u);
  assert.doesNotMatch(app.clauses(), /Pavilion lock-up/u);
});

test("athletics club hours preset loads a distinct synthetic athletics workshop", async () => {
  const app = await savedWorkbench(new Map());
  app.field("#preset-select", "athletics-club-hours");
  app.click("#load-preset");
  assert.match(app.title(), /Athletics club hours: track open, PA volume, and lock-up/u);
  assert.equal(app.disabled("#export-button"), false);
  assert.doesNotMatch(app.alert(), /Fix the proposal/u);
  assert.match(app.clauses(), /Track open/u);
  assert.match(app.clauses(), /PA volume/u);
  assert.match(app.clauses(), /Track lock-up/u);
  assert.match(app.groups(), /Students/u);
  assert.match(app.groups(), /Neighbours/u);
  assert.match(app.groups(), /P&amp;C/u);
  assert.doesNotMatch(app.title(), /Swimming club hours/u);
  assert.doesNotMatch(app.title(), /Netball training hours/u);
  assert.doesNotMatch(app.title(), /Sports day hours/u);
  assert.doesNotMatch(app.title(), /School disco hours/u);
  assert.doesNotMatch(app.title(), /Rooftop BBQ hours/u);
  assert.doesNotMatch(app.title(), /Shared laundry hours/u);
  assert.doesNotMatch(app.title(), /Community garden watering/u);
  assert.doesNotMatch(app.title(), /Hall hire hours/u);
  assert.doesNotMatch(app.title(), /Street stall lighting/u);
  assert.doesNotMatch(app.title(), /Market stall hours/u);
  assert.doesNotMatch(app.title(), /Shared bike shed/u);
  assert.doesNotMatch(app.title(), /Sports Fixture Night/u);
  assert.doesNotMatch(app.title(), /Neighbourhood Plan/u);
  assert.doesNotMatch(app.title(), /Library Quiet Hours/u);
  assert.doesNotMatch(app.clauses(), /Pool open/u);
  assert.doesNotMatch(app.clauses(), /Lane lights/u);
  assert.doesNotMatch(app.clauses(), /Pool lock-up/u);
  assert.doesNotMatch(app.clauses(), /Start time/u);
  assert.doesNotMatch(app.clauses(), /Court lights/u);
  assert.doesNotMatch(app.clauses(), /Court lock-up/u);
  assert.doesNotMatch(app.clauses(), /Race start/u);
  assert.doesNotMatch(app.clauses(), /Field lock-up/u);
  assert.doesNotMatch(app.clauses(), /Finish time/u);
  assert.doesNotMatch(app.clauses(), /Bass/u);
  assert.doesNotMatch(app.clauses(), /Hall lock-up/u);
  assert.doesNotMatch(app.clauses(), /Cook hours/u);
  assert.doesNotMatch(app.clauses(), /Smoke/u);
  assert.doesNotMatch(app.clauses(), /Rooftop lock-up/u);
  assert.doesNotMatch(app.clauses(), /Wash hours/u);
  assert.doesNotMatch(app.clauses(), /Dryer noise/u);
  assert.doesNotMatch(app.clauses(), /Laundry lock-up/u);
  assert.doesNotMatch(app.clauses(), /Watering hours/u);
  assert.doesNotMatch(app.clauses(), /Close time/u);
  assert.doesNotMatch(app.clauses(), /Lighting hours/u);
  assert.doesNotMatch(app.clauses(), /Access hours/u);
  assert.doesNotMatch(app.clauses(), /Stall open hours/u);
  assert.doesNotMatch(app.clauses(), /Match end-time/u);
  assert.doesNotMatch(app.clauses(), /Park access hours/u);
  assert.doesNotMatch(app.clauses(), /Evening hours/u);
  assert.doesNotMatch(app.groups(), /Residents/u);
  assert.doesNotMatch(app.groups(), /Building committee/u);
  assert.doesNotMatch(app.groups(), /Tenants/u);
  assert.doesNotMatch(app.groups(), /Building managers/u);
  assert.doesNotMatch(app.groups(), /Hirers/u);
  assert.doesNotMatch(app.groups(), /Hall committee/u);
  assert.doesNotMatch(app.title(), /Cricket club hours/u);
  assert.doesNotMatch(app.clauses(), /Scoring nets/u);
  assert.doesNotMatch(app.clauses(), /Tea room/u);
  assert.doesNotMatch(app.clauses(), /Pavilion lock-up/u);
});

test("cricket club hours preset loads a distinct synthetic cricket workshop", async () => {
  const app = await savedWorkbench(new Map());
  app.field("#preset-select", "cricket-club-hours");
  app.click("#load-preset");
  assert.match(app.title(), /Cricket club hours: scoring nets, tea room, and lock-up/u);
  assert.equal(app.disabled("#export-button"), false);
  assert.doesNotMatch(app.alert(), /Fix the proposal/u);
  assert.match(app.clauses(), /Scoring nets/u);
  assert.match(app.clauses(), /Tea room/u);
  assert.match(app.clauses(), /Pavilion lock-up/u);
  assert.match(app.groups(), /Students/u);
  assert.match(app.groups(), /Neighbours/u);
  assert.match(app.groups(), /P&amp;C/u);
  assert.doesNotMatch(app.title(), /Athletics club hours/u);
  assert.doesNotMatch(app.title(), /Swimming club hours/u);
  assert.doesNotMatch(app.title(), /Netball training hours/u);
  assert.doesNotMatch(app.title(), /Sports day hours/u);
  assert.doesNotMatch(app.title(), /School disco hours/u);
  assert.doesNotMatch(app.title(), /Rooftop BBQ hours/u);
  assert.doesNotMatch(app.title(), /Shared laundry hours/u);
  assert.doesNotMatch(app.title(), /Community garden watering/u);
  assert.doesNotMatch(app.title(), /Hall hire hours/u);
  assert.doesNotMatch(app.title(), /Street stall lighting/u);
  assert.doesNotMatch(app.title(), /Market stall hours/u);
  assert.doesNotMatch(app.title(), /Shared bike shed/u);
  assert.doesNotMatch(app.title(), /Sports Fixture Night/u);
  assert.doesNotMatch(app.title(), /Neighbourhood Plan/u);
  assert.doesNotMatch(app.title(), /Library Quiet Hours/u);
  assert.doesNotMatch(app.title(), /Tennis club hours/u);
  assert.doesNotMatch(app.clauses(), /Track open/u);
  assert.doesNotMatch(app.clauses(), /Track lock-up/u);
  assert.doesNotMatch(app.clauses(), /Pool open/u);
  assert.doesNotMatch(app.clauses(), /Lane lights/u);
  assert.doesNotMatch(app.clauses(), /Pool lock-up/u);
  assert.doesNotMatch(app.clauses(), /Start time/u);
  assert.doesNotMatch(app.clauses(), /Court lights/u);
  assert.doesNotMatch(app.clauses(), /Court lock-up/u);
  assert.doesNotMatch(app.clauses(), /Race start/u);
  assert.doesNotMatch(app.clauses(), /PA volume/u);
  assert.doesNotMatch(app.clauses(), /Field lock-up/u);
  assert.doesNotMatch(app.clauses(), /Finish time/u);
  assert.doesNotMatch(app.clauses(), /Bass/u);
  assert.doesNotMatch(app.clauses(), /Hall lock-up/u);
  assert.doesNotMatch(app.clauses(), /Cook hours/u);
  assert.doesNotMatch(app.clauses(), /Smoke/u);
  assert.doesNotMatch(app.clauses(), /Rooftop lock-up/u);
  assert.doesNotMatch(app.clauses(), /Wash hours/u);
  assert.doesNotMatch(app.clauses(), /Dryer noise/u);
  assert.doesNotMatch(app.clauses(), /Laundry lock-up/u);
  assert.doesNotMatch(app.clauses(), /Watering hours/u);
  assert.doesNotMatch(app.clauses(), /Close time/u);
  assert.doesNotMatch(app.clauses(), /Lighting hours/u);
  assert.doesNotMatch(app.clauses(), /Access hours/u);
  assert.doesNotMatch(app.clauses(), /Stall open hours/u);
  assert.doesNotMatch(app.clauses(), /Match end-time/u);
  assert.doesNotMatch(app.clauses(), /Park access hours/u);
  assert.doesNotMatch(app.clauses(), /Evening hours/u);
  assert.doesNotMatch(app.groups(), /Residents/u);
  assert.doesNotMatch(app.groups(), /Building committee/u);
  assert.doesNotMatch(app.groups(), /Tenants/u);
  assert.doesNotMatch(app.groups(), /Building managers/u);
  assert.doesNotMatch(app.groups(), /Hirers/u);
  assert.doesNotMatch(app.groups(), /Hall committee/u);
  assert.doesNotMatch(app.clauses(), /Court booking/u);
  assert.doesNotMatch(app.clauses(), /Ball machines/u);
  assert.doesNotMatch(app.clauses(), /Clubhouse lock-up/u);
});

test("basketball club hours preset loads a distinct synthetic basketball workshop", async () => {
  const app = await savedWorkbench(new Map());
  app.field("#preset-select", "basketball-club-hours");
  app.click("#load-preset");
  assert.match(app.title(), /Basketball club hours: hall booking, ball racks, and lock-up/u);
  assert.equal(app.disabled("#export-button"), false);
  assert.doesNotMatch(app.alert(), /Fix the proposal/u);
  assert.match(app.clauses(), /Hall booking/u);
  assert.match(app.clauses(), /Ball racks/u);
  assert.match(app.clauses(), /Gym lock-up/u);
  assert.match(app.groups(), /Students/u);
  assert.match(app.groups(), /Neighbours/u);
  assert.match(app.groups(), /P&amp;C/u);
  assert.doesNotMatch(app.title(), /Tennis club hours/u);
  assert.doesNotMatch(app.title(), /Volleyball club hours/u);
  assert.doesNotMatch(app.title(), /Soccer club hours/u);
  assert.doesNotMatch(app.title(), /Hockey club hours/u);
  assert.doesNotMatch(app.title(), /Rugby club hours/u);
  assert.doesNotMatch(app.title(), /Softball club hours/u);
  assert.doesNotMatch(app.title(), /Lacrosse club hours/u);
  assert.doesNotMatch(app.title(), /Cricket club hours/u);
  assert.doesNotMatch(app.title(), /Athletics club hours/u);
  assert.doesNotMatch(app.title(), /Swimming club hours/u);
  assert.doesNotMatch(app.title(), /Netball training hours/u);
  assert.doesNotMatch(app.title(), /Sports day hours/u);
  assert.doesNotMatch(app.title(), /School disco hours/u);
  assert.doesNotMatch(app.title(), /Rooftop BBQ hours/u);
  assert.doesNotMatch(app.title(), /Shared laundry hours/u);
  assert.doesNotMatch(app.title(), /Community garden watering/u);
  assert.doesNotMatch(app.title(), /Hall hire hours/u);
  assert.doesNotMatch(app.title(), /Street stall lighting/u);
  assert.doesNotMatch(app.title(), /Market stall hours/u);
  assert.doesNotMatch(app.title(), /Shared bike shed/u);
  assert.doesNotMatch(app.title(), /Sports Fixture Night/u);
  assert.doesNotMatch(app.title(), /Neighbourhood Plan/u);
  assert.doesNotMatch(app.title(), /Library Quiet Hours/u);
  assert.doesNotMatch(app.clauses(), /Court booking/u);
  assert.doesNotMatch(app.clauses(), /Ball machines/u);
  assert.doesNotMatch(app.clauses(), /Clubhouse lock-up/u);
  assert.doesNotMatch(app.clauses(), /Hall\/court booking/u);
  assert.doesNotMatch(app.clauses(), /Net posts/u);
  assert.doesNotMatch(app.clauses(), /Sports hall lock-up/u);
  assert.doesNotMatch(app.clauses(), /Pitch booking/u);
  assert.doesNotMatch(app.clauses(), /Goal nets/u);
  assert.doesNotMatch(app.clauses(), /Changing-room lock-up/u);
  assert.doesNotMatch(app.clauses(), /Ice booking/u);
  assert.doesNotMatch(app.clauses(), /Rink boards/u);
  assert.doesNotMatch(app.clauses(), /Rink lock-up/u);
  assert.doesNotMatch(app.clauses(), /Scoring nets/u);
  assert.doesNotMatch(app.clauses(), /Tea room/u);
  assert.doesNotMatch(app.clauses(), /Pavilion lock-up/u);
  assert.doesNotMatch(app.clauses(), /Track open/u);
  assert.doesNotMatch(app.clauses(), /Track lock-up/u);
  assert.doesNotMatch(app.clauses(), /Pool open/u);
  assert.doesNotMatch(app.clauses(), /Lane lights/u);
  assert.doesNotMatch(app.clauses(), /Pool lock-up/u);
  assert.doesNotMatch(app.clauses(), /Start time/u);
  assert.doesNotMatch(app.clauses(), /Court lights/u);
  assert.doesNotMatch(app.clauses(), /Court lock-up/u);
  assert.doesNotMatch(app.clauses(), /Race start/u);
  assert.doesNotMatch(app.clauses(), /PA volume/u);
  assert.doesNotMatch(app.clauses(), /Field lock-up/u);
  assert.doesNotMatch(app.clauses(), /Finish time/u);
  assert.doesNotMatch(app.clauses(), /Bass/u);
  assert.doesNotMatch(app.clauses(), /Hall lock-up/u);
  assert.doesNotMatch(app.clauses(), /Cook hours/u);
  assert.doesNotMatch(app.clauses(), /Smoke/u);
  assert.doesNotMatch(app.clauses(), /Rooftop lock-up/u);
  assert.doesNotMatch(app.clauses(), /Wash hours/u);
  assert.doesNotMatch(app.clauses(), /Dryer noise/u);
  assert.doesNotMatch(app.clauses(), /Laundry lock-up/u);
  assert.doesNotMatch(app.clauses(), /Watering hours/u);
  assert.doesNotMatch(app.clauses(), /Close time/u);
  assert.doesNotMatch(app.clauses(), /Lighting hours/u);
  assert.doesNotMatch(app.clauses(), /Access hours/u);
  assert.doesNotMatch(app.clauses(), /Stall open hours/u);
  assert.doesNotMatch(app.clauses(), /Match end-time/u);
  assert.doesNotMatch(app.clauses(), /Park access hours/u);
  assert.doesNotMatch(app.clauses(), /Evening hours/u);
  assert.doesNotMatch(app.groups(), /Residents/u);
  assert.doesNotMatch(app.groups(), /Building committee/u);
  assert.doesNotMatch(app.groups(), /Tenants/u);
  assert.doesNotMatch(app.groups(), /Building managers/u);
  assert.doesNotMatch(app.groups(), /Hirers/u);
  assert.doesNotMatch(app.groups(), /Hall committee/u);
});

test("volleyball club hours preset loads a distinct synthetic volleyball workshop", async () => {
  const app = await savedWorkbench(new Map());
  app.field("#preset-select", "volleyball-club-hours");
  app.click("#load-preset");
  assert.match(app.title(), /Volleyball club hours: hall\/court booking, net posts, and lock-up/u);
  assert.equal(app.disabled("#export-button"), false);
  assert.doesNotMatch(app.alert(), /Fix the proposal/u);
  assert.match(app.clauses(), /Hall\/court booking/u);
  assert.match(app.clauses(), /Net posts/u);
  assert.match(app.clauses(), /Sports hall lock-up/u);
  assert.match(app.groups(), /Students/u);
  assert.match(app.groups(), /Neighbours/u);
  assert.match(app.groups(), /P&amp;C/u);
  assert.doesNotMatch(app.title(), /Basketball club hours/u);
  assert.doesNotMatch(app.title(), /Soccer club hours/u);
  assert.doesNotMatch(app.title(), /Hockey club hours/u);
  assert.doesNotMatch(app.title(), /Rugby club hours/u);
  assert.doesNotMatch(app.title(), /Softball club hours/u);
  assert.doesNotMatch(app.title(), /Lacrosse club hours/u);
  assert.doesNotMatch(app.title(), /Tennis club hours/u);
  assert.doesNotMatch(app.title(), /Cricket club hours/u);
  assert.doesNotMatch(app.title(), /Athletics club hours/u);
  assert.doesNotMatch(app.title(), /Swimming club hours/u);
  assert.doesNotMatch(app.title(), /Netball training hours/u);
  assert.doesNotMatch(app.title(), /Sports day hours/u);
  assert.doesNotMatch(app.title(), /School disco hours/u);
  assert.doesNotMatch(app.title(), /Rooftop BBQ hours/u);
  assert.doesNotMatch(app.title(), /Shared laundry hours/u);
  assert.doesNotMatch(app.title(), /Community garden watering/u);
  assert.doesNotMatch(app.title(), /Hall hire hours/u);
  assert.doesNotMatch(app.title(), /Street stall lighting/u);
  assert.doesNotMatch(app.title(), /Market stall hours/u);
  assert.doesNotMatch(app.title(), /Shared bike shed/u);
  assert.doesNotMatch(app.title(), /Sports Fixture Night/u);
  assert.doesNotMatch(app.title(), /Neighbourhood Plan/u);
  assert.doesNotMatch(app.title(), /Library Quiet Hours/u);
  assert.doesNotMatch(app.clauses(), /Hall booking/u);
  assert.doesNotMatch(app.clauses(), /Ball racks/u);
  assert.doesNotMatch(app.clauses(), /Gym lock-up/u);
  assert.doesNotMatch(app.clauses(), /Pitch booking/u);
  assert.doesNotMatch(app.clauses(), /Goal nets/u);
  assert.doesNotMatch(app.clauses(), /Changing-room lock-up/u);
  assert.doesNotMatch(app.clauses(), /Ice booking/u);
  assert.doesNotMatch(app.clauses(), /Rink boards/u);
  assert.doesNotMatch(app.clauses(), /Rink lock-up/u);
  assert.doesNotMatch(app.clauses(), /Court booking/u);
  assert.doesNotMatch(app.clauses(), /Ball machines/u);
  assert.doesNotMatch(app.clauses(), /Clubhouse lock-up/u);
  assert.doesNotMatch(app.clauses(), /Scoring nets/u);
  assert.doesNotMatch(app.clauses(), /Tea room/u);
  assert.doesNotMatch(app.clauses(), /Pavilion lock-up/u);
  assert.doesNotMatch(app.clauses(), /Track open/u);
  assert.doesNotMatch(app.clauses(), /Track lock-up/u);
  assert.doesNotMatch(app.clauses(), /Pool open/u);
  assert.doesNotMatch(app.clauses(), /Lane lights/u);
  assert.doesNotMatch(app.clauses(), /Pool lock-up/u);
  assert.doesNotMatch(app.clauses(), /Start time/u);
  assert.doesNotMatch(app.clauses(), /Court lights/u);
  assert.doesNotMatch(app.clauses(), /Court lock-up/u);
  assert.doesNotMatch(app.clauses(), /Race start/u);
  assert.doesNotMatch(app.clauses(), /PA volume/u);
  assert.doesNotMatch(app.clauses(), /Field lock-up/u);
  assert.doesNotMatch(app.clauses(), /Finish time/u);
  assert.doesNotMatch(app.clauses(), /Bass/u);
  assert.doesNotMatch(app.clauses(), /Hall lock-up/u);
  assert.doesNotMatch(app.clauses(), /Cook hours/u);
  assert.doesNotMatch(app.clauses(), /Smoke/u);
  assert.doesNotMatch(app.clauses(), /Rooftop lock-up/u);
  assert.doesNotMatch(app.clauses(), /Wash hours/u);
  assert.doesNotMatch(app.clauses(), /Dryer noise/u);
  assert.doesNotMatch(app.clauses(), /Laundry lock-up/u);
  assert.doesNotMatch(app.clauses(), /Watering hours/u);
  assert.doesNotMatch(app.clauses(), /Close time/u);
  assert.doesNotMatch(app.clauses(), /Lighting hours/u);
  assert.doesNotMatch(app.clauses(), /Access hours/u);
  assert.doesNotMatch(app.clauses(), /Stall open hours/u);
  assert.doesNotMatch(app.clauses(), /Match end-time/u);
  assert.doesNotMatch(app.clauses(), /Park access hours/u);
  assert.doesNotMatch(app.clauses(), /Evening hours/u);
  assert.doesNotMatch(app.groups(), /Residents/u);
  assert.doesNotMatch(app.groups(), /Building committee/u);
  assert.doesNotMatch(app.groups(), /Tenants/u);
  assert.doesNotMatch(app.groups(), /Building managers/u);
  assert.doesNotMatch(app.groups(), /Hirers/u);
  assert.doesNotMatch(app.groups(), /Hall committee/u);
});

test("soccer club hours preset loads a distinct synthetic soccer workshop", async () => {
  const app = await savedWorkbench(new Map());
  app.field("#preset-select", "soccer-club-hours");
  app.click("#load-preset");
  assert.match(app.title(), /Soccer club hours: pitch booking, goal nets, and changing-room lock-up/u);
  assert.equal(app.disabled("#export-button"), false);
  assert.doesNotMatch(app.alert(), /Fix the proposal/u);
  assert.match(app.clauses(), /Pitch booking/u);
  assert.match(app.clauses(), /Goal nets/u);
  assert.match(app.clauses(), /Changing-room lock-up/u);
  assert.doesNotMatch(app.clauses(), /Outdoor pitch booking/u);
  assert.doesNotMatch(app.clauses(), /Clubhouse bar/u);
  assert.doesNotMatch(app.clauses(), /Softball diamond booking/u);
  assert.doesNotMatch(app.clauses(), /Lacrosse field booking/u);
  assert.match(app.groups(), /Students/u);
  assert.match(app.groups(), /Neighbours/u);
  assert.match(app.groups(), /P&amp;C/u);
  assert.doesNotMatch(app.title(), /Volleyball club hours/u);
  assert.doesNotMatch(app.title(), /Basketball club hours/u);
  assert.doesNotMatch(app.title(), /Tennis club hours/u);
  assert.doesNotMatch(app.title(), /Hockey club hours/u);
  assert.doesNotMatch(app.title(), /Rugby club hours/u);
  assert.doesNotMatch(app.title(), /Softball club hours/u);
  assert.doesNotMatch(app.title(), /Lacrosse club hours/u);
  assert.doesNotMatch(app.title(), /Cricket club hours/u);
  assert.doesNotMatch(app.title(), /Athletics club hours/u);
  assert.doesNotMatch(app.title(), /Swimming club hours/u);
  assert.doesNotMatch(app.title(), /Netball training hours/u);
  assert.doesNotMatch(app.title(), /Sports day hours/u);
  assert.doesNotMatch(app.title(), /School disco hours/u);
  assert.doesNotMatch(app.title(), /Rooftop BBQ hours/u);
  assert.doesNotMatch(app.title(), /Shared laundry hours/u);
  assert.doesNotMatch(app.title(), /Community garden watering/u);
  assert.doesNotMatch(app.title(), /Hall hire hours/u);
  assert.doesNotMatch(app.title(), /Street stall lighting/u);
  assert.doesNotMatch(app.title(), /Market stall hours/u);
  assert.doesNotMatch(app.title(), /Shared bike shed/u);
  assert.doesNotMatch(app.title(), /Sports Fixture Night/u);
  assert.doesNotMatch(app.title(), /Neighbourhood Plan/u);
  assert.doesNotMatch(app.title(), /Library Quiet Hours/u);
  assert.doesNotMatch(app.clauses(), /Hall\/court booking/u);
  assert.doesNotMatch(app.clauses(), /Net posts/u);
  assert.doesNotMatch(app.clauses(), /Sports hall lock-up/u);
  assert.doesNotMatch(app.clauses(), /Hall booking/u);
  assert.doesNotMatch(app.clauses(), /Ball racks/u);
  assert.doesNotMatch(app.clauses(), /Gym lock-up/u);
  assert.doesNotMatch(app.clauses(), /Ice booking/u);
  assert.doesNotMatch(app.clauses(), /Rink boards/u);
  assert.doesNotMatch(app.clauses(), /Rink lock-up/u);
  assert.doesNotMatch(app.clauses(), /Court booking/u);
  assert.doesNotMatch(app.clauses(), /Ball machines/u);
  assert.doesNotMatch(app.clauses(), /Clubhouse lock-up/u);
  assert.doesNotMatch(app.clauses(), /Scoring nets/u);
  assert.doesNotMatch(app.clauses(), /Tea room/u);
  assert.doesNotMatch(app.clauses(), /Pavilion lock-up/u);
  assert.doesNotMatch(app.clauses(), /Track open/u);
  assert.doesNotMatch(app.clauses(), /Track lock-up/u);
  assert.doesNotMatch(app.clauses(), /Pool open/u);
  assert.doesNotMatch(app.clauses(), /Lane lights/u);
  assert.doesNotMatch(app.clauses(), /Pool lock-up/u);
  assert.doesNotMatch(app.clauses(), /Start time/u);
  assert.doesNotMatch(app.clauses(), /Court lights/u);
  assert.doesNotMatch(app.clauses(), /Court lock-up/u);
  assert.doesNotMatch(app.clauses(), /Race start/u);
  assert.doesNotMatch(app.clauses(), /PA volume/u);
  assert.doesNotMatch(app.clauses(), /Field lock-up/u);
  assert.doesNotMatch(app.clauses(), /Finish time/u);
  assert.doesNotMatch(app.clauses(), /Bass/u);
  assert.doesNotMatch(app.clauses(), /Hall lock-up/u);
  assert.doesNotMatch(app.clauses(), /Cook hours/u);
  assert.doesNotMatch(app.clauses(), /Smoke/u);
  assert.doesNotMatch(app.clauses(), /Rooftop lock-up/u);
  assert.doesNotMatch(app.clauses(), /Wash hours/u);
  assert.doesNotMatch(app.clauses(), /Dryer noise/u);
  assert.doesNotMatch(app.clauses(), /Laundry lock-up/u);
  assert.doesNotMatch(app.clauses(), /Watering hours/u);
  assert.doesNotMatch(app.clauses(), /Close time/u);
  assert.doesNotMatch(app.clauses(), /Lighting hours/u);
  assert.doesNotMatch(app.clauses(), /Access hours/u);
  assert.doesNotMatch(app.clauses(), /Stall open hours/u);
  assert.doesNotMatch(app.clauses(), /Match end-time/u);
  assert.doesNotMatch(app.clauses(), /Park access hours/u);
  assert.doesNotMatch(app.clauses(), /Evening hours/u);
  assert.doesNotMatch(app.groups(), /Residents/u);
  assert.doesNotMatch(app.groups(), /Building committee/u);
  assert.doesNotMatch(app.groups(), /Tenants/u);
  assert.doesNotMatch(app.groups(), /Building managers/u);
  assert.doesNotMatch(app.groups(), /Hirers/u);
  assert.doesNotMatch(app.groups(), /Hall committee/u);
});

test("hockey club hours preset loads a distinct synthetic hockey workshop", async () => {
  const app = await savedWorkbench(new Map());
  app.field("#preset-select", "hockey-club-hours");
  app.click("#load-preset");
  assert.match(app.title(), /Hockey club hours: ice booking, rink boards, and changing-room lock-up/u);
  assert.equal(app.disabled("#export-button"), false);
  assert.doesNotMatch(app.alert(), /Fix the proposal/u);
  assert.match(app.clauses(), /Ice booking/u);
  assert.match(app.clauses(), /Rink boards/u);
  assert.match(app.clauses(), /Rink lock-up/u);
  assert.match(app.groups(), /Students/u);
  assert.match(app.groups(), /Neighbours/u);
  assert.match(app.groups(), /P&amp;C/u);
  assert.doesNotMatch(app.title(), /Soccer club hours/u);
  assert.doesNotMatch(app.title(), /Volleyball club hours/u);
  assert.doesNotMatch(app.title(), /Basketball club hours/u);
  assert.doesNotMatch(app.title(), /Tennis club hours/u);
  assert.doesNotMatch(app.title(), /Rugby club hours/u);
  assert.doesNotMatch(app.title(), /Softball club hours/u);
  assert.doesNotMatch(app.title(), /Lacrosse club hours/u);
  assert.doesNotMatch(app.title(), /Cricket club hours/u);
  assert.doesNotMatch(app.title(), /Athletics club hours/u);
  assert.doesNotMatch(app.title(), /Swimming club hours/u);
  assert.doesNotMatch(app.title(), /Netball training hours/u);
  assert.doesNotMatch(app.title(), /Sports day hours/u);
  assert.doesNotMatch(app.title(), /School disco hours/u);
  assert.doesNotMatch(app.title(), /Rooftop BBQ hours/u);
  assert.doesNotMatch(app.title(), /Shared laundry hours/u);
  assert.doesNotMatch(app.title(), /Community garden watering/u);
  assert.doesNotMatch(app.title(), /Hall hire hours/u);
  assert.doesNotMatch(app.title(), /Street stall lighting/u);
  assert.doesNotMatch(app.title(), /Market stall hours/u);
  assert.doesNotMatch(app.title(), /Shared bike shed/u);
  assert.doesNotMatch(app.title(), /Sports Fixture Night/u);
  assert.doesNotMatch(app.title(), /Neighbourhood Plan/u);
  assert.doesNotMatch(app.title(), /Library Quiet Hours/u);
  assert.doesNotMatch(app.clauses(), /Pitch booking/u);
  assert.doesNotMatch(app.clauses(), /Goal nets/u);
  assert.doesNotMatch(app.clauses(), /Changing-room lock-up/u);
  assert.doesNotMatch(app.clauses(), /Outdoor pitch booking/u);
  assert.doesNotMatch(app.clauses(), /Clubhouse bar/u);
  assert.doesNotMatch(app.clauses(), /Softball diamond booking/u);
  assert.doesNotMatch(app.clauses(), /Lacrosse field booking/u);
  assert.doesNotMatch(app.clauses(), /Hall\/court booking/u);
  assert.doesNotMatch(app.clauses(), /Net posts/u);
  assert.doesNotMatch(app.clauses(), /Sports hall lock-up/u);
  assert.doesNotMatch(app.clauses(), /Hall booking/u);
  assert.doesNotMatch(app.clauses(), /Ball racks/u);
  assert.doesNotMatch(app.clauses(), /Gym lock-up/u);
  assert.doesNotMatch(app.clauses(), /Court booking/u);
  assert.doesNotMatch(app.clauses(), /Ball machines/u);
  assert.doesNotMatch(app.clauses(), /Clubhouse lock-up/u);
  assert.doesNotMatch(app.clauses(), /Scoring nets/u);
  assert.doesNotMatch(app.clauses(), /Tea room/u);
  assert.doesNotMatch(app.clauses(), /Pavilion lock-up/u);
  assert.doesNotMatch(app.clauses(), /Track open/u);
  assert.doesNotMatch(app.clauses(), /Track lock-up/u);
  assert.doesNotMatch(app.clauses(), /Pool open/u);
  assert.doesNotMatch(app.clauses(), /Lane lights/u);
  assert.doesNotMatch(app.clauses(), /Pool lock-up/u);
  assert.doesNotMatch(app.clauses(), /Start time/u);
  assert.doesNotMatch(app.clauses(), /Court lights/u);
  assert.doesNotMatch(app.clauses(), /Court lock-up/u);
  assert.doesNotMatch(app.clauses(), /Race start/u);
  assert.doesNotMatch(app.clauses(), /PA volume/u);
  assert.doesNotMatch(app.clauses(), /Field lock-up/u);
  assert.doesNotMatch(app.clauses(), /Finish time/u);
  assert.doesNotMatch(app.clauses(), /Bass/u);
  assert.doesNotMatch(app.clauses(), /Hall lock-up/u);
  assert.doesNotMatch(app.clauses(), /Cook hours/u);
  assert.doesNotMatch(app.clauses(), /Smoke/u);
  assert.doesNotMatch(app.clauses(), /Rooftop lock-up/u);
  assert.doesNotMatch(app.clauses(), /Wash hours/u);
  assert.doesNotMatch(app.clauses(), /Dryer noise/u);
  assert.doesNotMatch(app.clauses(), /Laundry lock-up/u);
  assert.doesNotMatch(app.clauses(), /Watering hours/u);
  assert.doesNotMatch(app.clauses(), /Close time/u);
  assert.doesNotMatch(app.clauses(), /Lighting hours/u);
  assert.doesNotMatch(app.clauses(), /Access hours/u);
  assert.doesNotMatch(app.clauses(), /Stall open hours/u);
  assert.doesNotMatch(app.clauses(), /Match end-time/u);
  assert.doesNotMatch(app.clauses(), /Park access hours/u);
  assert.doesNotMatch(app.clauses(), /Evening hours/u);
  assert.doesNotMatch(app.groups(), /Residents/u);
  assert.doesNotMatch(app.groups(), /Building committee/u);
  assert.doesNotMatch(app.groups(), /Tenants/u);
  assert.doesNotMatch(app.groups(), /Building managers/u);
  assert.doesNotMatch(app.groups(), /Hirers/u);
  assert.doesNotMatch(app.groups(), /Hall committee/u);
});

test("rugby club hours preset loads a distinct synthetic rugby workshop", async () => {
  const app = await savedWorkbench(new Map());
  app.field("#preset-select", "rugby-club-hours");
  app.click("#load-preset");
  assert.match(app.title(), /Rugby club hours: pitch booking, clubhouse bar, and changing-room lock-up/u);
  assert.equal(app.disabled("#export-button"), false);
  assert.doesNotMatch(app.alert(), /Fix the proposal/u);
  assert.match(app.clauses(), /Outdoor pitch booking/u);
  assert.match(app.clauses(), /Clubhouse bar/u);
  assert.match(app.clauses(), /Changing-room lock-up/u);
  assert.match(app.groups(), /Students/u);
  assert.match(app.groups(), /Neighbours/u);
  assert.match(app.groups(), /P&amp;C/u);
  assert.doesNotMatch(app.title(), /Hockey club hours/u);
  assert.doesNotMatch(app.title(), /Softball club hours/u);
  assert.doesNotMatch(app.title(), /Lacrosse club hours/u);
  assert.doesNotMatch(app.title(), /Water polo club hours/u);
  assert.doesNotMatch(app.title(), /Soccer club hours/u);
  assert.doesNotMatch(app.title(), /Volleyball club hours/u);
  assert.doesNotMatch(app.title(), /Basketball club hours/u);
  assert.doesNotMatch(app.title(), /Tennis club hours/u);
  assert.doesNotMatch(app.title(), /Cricket club hours/u);
  assert.doesNotMatch(app.title(), /Athletics club hours/u);
  assert.doesNotMatch(app.title(), /Swimming club hours/u);
  assert.doesNotMatch(app.title(), /Netball training hours/u);
  assert.doesNotMatch(app.title(), /Sports day hours/u);
  assert.doesNotMatch(app.title(), /School disco hours/u);
  assert.doesNotMatch(app.title(), /Rooftop BBQ hours/u);
  assert.doesNotMatch(app.title(), /Shared laundry hours/u);
  assert.doesNotMatch(app.title(), /Community garden watering/u);
  assert.doesNotMatch(app.title(), /Hall hire hours/u);
  assert.doesNotMatch(app.title(), /Street stall lighting/u);
  assert.doesNotMatch(app.title(), /Market stall hours/u);
  assert.doesNotMatch(app.title(), /Shared bike shed/u);
  assert.doesNotMatch(app.title(), /Sports Fixture Night/u);
  assert.doesNotMatch(app.title(), /Neighbourhood Plan/u);
  assert.doesNotMatch(app.title(), /Library Quiet Hours/u);
  assert.doesNotMatch(app.clauses(), /Goal nets/u);
  assert.doesNotMatch(app.clauses(), /Ice booking/u);
  assert.doesNotMatch(app.clauses(), /Rink boards/u);
  assert.doesNotMatch(app.clauses(), /Rink lock-up/u);
  assert.doesNotMatch(app.clauses(), /Softball diamond booking/u);
  assert.doesNotMatch(app.clauses(), /Lacrosse field booking/u);
  assert.doesNotMatch(app.clauses(), /Water polo pool booking/u);
  assert.doesNotMatch(app.clauses(), /Hall\/court booking/u);
  assert.doesNotMatch(app.clauses(), /Net posts/u);
  assert.doesNotMatch(app.clauses(), /Sports hall lock-up/u);
  assert.doesNotMatch(app.clauses(), /Hall booking/u);
  assert.doesNotMatch(app.clauses(), /Ball racks/u);
  assert.doesNotMatch(app.clauses(), /Gym lock-up/u);
  assert.doesNotMatch(app.clauses(), /Court booking/u);
  assert.doesNotMatch(app.clauses(), /Ball machines/u);
  assert.doesNotMatch(app.clauses(), /Clubhouse lock-up/u);
  assert.doesNotMatch(app.clauses(), /Scoring nets/u);
  assert.doesNotMatch(app.clauses(), /Tea room/u);
  assert.doesNotMatch(app.clauses(), /Pavilion lock-up/u);
  assert.doesNotMatch(app.clauses(), /Track open/u);
  assert.doesNotMatch(app.clauses(), /Track lock-up/u);
  assert.doesNotMatch(app.clauses(), /Pool open/u);
  assert.doesNotMatch(app.clauses(), /Lane lights/u);
  assert.doesNotMatch(app.clauses(), /Pool lock-up/u);
  assert.doesNotMatch(app.clauses(), /Start time/u);
  assert.doesNotMatch(app.clauses(), /Court lights/u);
  assert.doesNotMatch(app.clauses(), /Court lock-up/u);
  assert.doesNotMatch(app.clauses(), /Race start/u);
  assert.doesNotMatch(app.clauses(), /PA volume/u);
  assert.doesNotMatch(app.clauses(), /Field lock-up/u);
  assert.doesNotMatch(app.clauses(), /Finish time/u);
  assert.doesNotMatch(app.clauses(), /Bass/u);
  assert.doesNotMatch(app.clauses(), /Hall lock-up/u);
  assert.doesNotMatch(app.clauses(), /Cook hours/u);
  assert.doesNotMatch(app.clauses(), /Smoke/u);
  assert.doesNotMatch(app.clauses(), /Rooftop lock-up/u);
  assert.doesNotMatch(app.clauses(), /Wash hours/u);
  assert.doesNotMatch(app.clauses(), /Dryer noise/u);
  assert.doesNotMatch(app.clauses(), /Laundry lock-up/u);
  assert.doesNotMatch(app.clauses(), /Watering hours/u);
  assert.doesNotMatch(app.clauses(), /Close time/u);
  assert.doesNotMatch(app.clauses(), /Lighting hours/u);
  assert.doesNotMatch(app.clauses(), /Access hours/u);
  assert.doesNotMatch(app.clauses(), /Stall open hours/u);
  assert.doesNotMatch(app.clauses(), /Match end-time/u);
  assert.doesNotMatch(app.clauses(), /Park access hours/u);
  assert.doesNotMatch(app.clauses(), /Evening hours/u);
  assert.doesNotMatch(app.groups(), /Residents/u);
  assert.doesNotMatch(app.groups(), /Building committee/u);
  assert.doesNotMatch(app.groups(), /Tenants/u);
  assert.doesNotMatch(app.groups(), /Building managers/u);
  assert.doesNotMatch(app.groups(), /Hirers/u);
  assert.doesNotMatch(app.groups(), /Hall committee/u);
});

test("softball club hours preset loads a distinct synthetic softball workshop", async () => {
  const app = await savedWorkbench(new Map());
  app.field("#preset-select", "softball-club-hours");
  app.click("#load-preset");
  assert.match(app.title(), /Softball club hours: diamond booking, clubhouse bar, and changing-room lock-up/u);
  assert.equal(app.disabled("#export-button"), false);
  assert.doesNotMatch(app.alert(), /Fix the proposal/u);
  assert.match(app.clauses(), /Softball diamond booking/u);
  assert.match(app.clauses(), /Clubhouse bar/u);
  assert.match(app.clauses(), /Changing-room lock-up/u);
  assert.match(app.groups(), /Students/u);
  assert.match(app.groups(), /Neighbours/u);
  assert.match(app.groups(), /P&amp;C/u);
  assert.doesNotMatch(app.title(), /Rugby club hours/u);
  assert.doesNotMatch(app.title(), /Hockey club hours/u);
  assert.doesNotMatch(app.title(), /Soccer club hours/u);
  assert.doesNotMatch(app.title(), /Baseball/u);
  assert.doesNotMatch(app.title(), /Lacrosse club hours/u);
  assert.doesNotMatch(app.title(), /Water polo club hours/u);
  assert.doesNotMatch(app.title(), /Volleyball club hours/u);
  assert.doesNotMatch(app.title(), /Basketball club hours/u);
  assert.doesNotMatch(app.title(), /Tennis club hours/u);
  assert.doesNotMatch(app.title(), /Cricket club hours/u);
  assert.doesNotMatch(app.title(), /Athletics club hours/u);
  assert.doesNotMatch(app.title(), /Swimming club hours/u);
  assert.doesNotMatch(app.title(), /Netball training hours/u);
  assert.doesNotMatch(app.title(), /Sports day hours/u);
  assert.doesNotMatch(app.title(), /School disco hours/u);
  assert.doesNotMatch(app.title(), /Rooftop BBQ hours/u);
  assert.doesNotMatch(app.title(), /Shared laundry hours/u);
  assert.doesNotMatch(app.title(), /Community garden watering/u);
  assert.doesNotMatch(app.title(), /Hall hire hours/u);
  assert.doesNotMatch(app.title(), /Street stall lighting/u);
  assert.doesNotMatch(app.title(), /Market stall hours/u);
  assert.doesNotMatch(app.title(), /Shared bike shed/u);
  assert.doesNotMatch(app.title(), /Sports Fixture Night/u);
  assert.doesNotMatch(app.title(), /Neighbourhood Plan/u);
  assert.doesNotMatch(app.title(), /Library Quiet Hours/u);
  assert.doesNotMatch(app.clauses(), /Outdoor pitch booking/u);
  assert.doesNotMatch(app.clauses(), /Pitch booking/u);
  assert.doesNotMatch(app.clauses(), /Goal nets/u);
  assert.doesNotMatch(app.clauses(), /Ice booking/u);
  assert.doesNotMatch(app.clauses(), /Rink boards/u);
  assert.doesNotMatch(app.clauses(), /Rink lock-up/u);
  assert.doesNotMatch(app.clauses(), /Lacrosse field booking/u);
  assert.doesNotMatch(app.clauses(), /Water polo pool booking/u);
  assert.doesNotMatch(app.clauses(), /Hall\/court booking/u);
  assert.doesNotMatch(app.clauses(), /Net posts/u);
  assert.doesNotMatch(app.clauses(), /Sports hall lock-up/u);
  assert.doesNotMatch(app.clauses(), /Hall booking/u);
  assert.doesNotMatch(app.clauses(), /Ball racks/u);
  assert.doesNotMatch(app.clauses(), /Gym lock-up/u);
  assert.doesNotMatch(app.clauses(), /Court booking/u);
  assert.doesNotMatch(app.clauses(), /Ball machines/u);
  assert.doesNotMatch(app.clauses(), /Clubhouse lock-up/u);
  assert.doesNotMatch(app.clauses(), /Scoring nets/u);
  assert.doesNotMatch(app.clauses(), /Tea room/u);
  assert.doesNotMatch(app.clauses(), /Pavilion lock-up/u);
  assert.doesNotMatch(app.clauses(), /Track open/u);
  assert.doesNotMatch(app.clauses(), /Track lock-up/u);
  assert.doesNotMatch(app.clauses(), /Pool open/u);
  assert.doesNotMatch(app.clauses(), /Lane lights/u);
  assert.doesNotMatch(app.clauses(), /Pool lock-up/u);
  assert.doesNotMatch(app.clauses(), /Start time/u);
  assert.doesNotMatch(app.clauses(), /Court lights/u);
  assert.doesNotMatch(app.clauses(), /Court lock-up/u);
  assert.doesNotMatch(app.clauses(), /Race start/u);
  assert.doesNotMatch(app.clauses(), /PA volume/u);
  assert.doesNotMatch(app.clauses(), /Field lock-up/u);
  assert.doesNotMatch(app.clauses(), /Finish time/u);
  assert.doesNotMatch(app.clauses(), /Bass/u);
  assert.doesNotMatch(app.clauses(), /Hall lock-up/u);
  assert.doesNotMatch(app.clauses(), /Cook hours/u);
  assert.doesNotMatch(app.clauses(), /Smoke/u);
  assert.doesNotMatch(app.clauses(), /Rooftop lock-up/u);
  assert.doesNotMatch(app.clauses(), /Wash hours/u);
  assert.doesNotMatch(app.clauses(), /Dryer noise/u);
  assert.doesNotMatch(app.clauses(), /Laundry lock-up/u);
  assert.doesNotMatch(app.clauses(), /Watering hours/u);
  assert.doesNotMatch(app.clauses(), /Close time/u);
  assert.doesNotMatch(app.clauses(), /Lighting hours/u);
  assert.doesNotMatch(app.clauses(), /Access hours/u);
  assert.doesNotMatch(app.clauses(), /Stall open hours/u);
  assert.doesNotMatch(app.clauses(), /Match end-time/u);
  assert.doesNotMatch(app.clauses(), /Park access hours/u);
  assert.doesNotMatch(app.clauses(), /Evening hours/u);
  assert.doesNotMatch(app.groups(), /Residents/u);
  assert.doesNotMatch(app.groups(), /Building committee/u);
  assert.doesNotMatch(app.groups(), /Tenants/u);
  assert.doesNotMatch(app.groups(), /Building managers/u);
  assert.doesNotMatch(app.groups(), /Hirers/u);
  assert.doesNotMatch(app.groups(), /Hall committee/u);
});

test("lacrosse club hours preset loads a distinct synthetic lacrosse workshop", async () => {
  const app = await savedWorkbench(new Map());
  app.field("#preset-select", "lacrosse-club-hours");
  app.click("#load-preset");
  assert.match(app.title(), /Lacrosse club hours: field booking, clubhouse bar, and changing-room lock-up/u);
  assert.equal(app.disabled("#export-button"), false);
  assert.doesNotMatch(app.alert(), /Fix the proposal/u);
  assert.match(app.clauses(), /Lacrosse field booking/u);
  assert.match(app.clauses(), /Clubhouse bar/u);
  assert.match(app.clauses(), /Changing-room lock-up/u);
  assert.match(app.groups(), /Students/u);
  assert.match(app.groups(), /Neighbours/u);
  assert.match(app.groups(), /P&amp;C/u);
  assert.doesNotMatch(app.title(), /Softball club hours/u);
  assert.doesNotMatch(app.title(), /Rugby club hours/u);
  assert.doesNotMatch(app.title(), /Water polo club hours/u);
  assert.doesNotMatch(app.title(), /Hockey club hours/u);
  assert.doesNotMatch(app.title(), /Soccer club hours/u);
  assert.doesNotMatch(app.title(), /Baseball/u);
  assert.doesNotMatch(app.title(), /Volleyball club hours/u);
  assert.doesNotMatch(app.title(), /Basketball club hours/u);
  assert.doesNotMatch(app.title(), /Tennis club hours/u);
  assert.doesNotMatch(app.title(), /Cricket club hours/u);
  assert.doesNotMatch(app.title(), /Athletics club hours/u);
  assert.doesNotMatch(app.title(), /Swimming club hours/u);
  assert.doesNotMatch(app.title(), /Netball training hours/u);
  assert.doesNotMatch(app.title(), /Sports day hours/u);
  assert.doesNotMatch(app.title(), /School disco hours/u);
  assert.doesNotMatch(app.title(), /Rooftop BBQ hours/u);
  assert.doesNotMatch(app.title(), /Shared laundry hours/u);
  assert.doesNotMatch(app.title(), /Community garden watering/u);
  assert.doesNotMatch(app.title(), /Hall hire hours/u);
  assert.doesNotMatch(app.title(), /Street stall lighting/u);
  assert.doesNotMatch(app.title(), /Market stall hours/u);
  assert.doesNotMatch(app.title(), /Shared bike shed/u);
  assert.doesNotMatch(app.title(), /Sports Fixture Night/u);
  assert.doesNotMatch(app.title(), /Neighbourhood Plan/u);
  assert.doesNotMatch(app.title(), /Library Quiet Hours/u);
  assert.doesNotMatch(app.clauses(), /Softball diamond booking/u);
  assert.doesNotMatch(app.clauses(), /Outdoor pitch booking/u);
  assert.doesNotMatch(app.clauses(), /Water polo pool booking/u);
  assert.doesNotMatch(app.clauses(), /Pitch booking/u);
  assert.doesNotMatch(app.clauses(), /Goal nets/u);
  assert.doesNotMatch(app.clauses(), /Ice booking/u);
  assert.doesNotMatch(app.clauses(), /Rink boards/u);
  assert.doesNotMatch(app.clauses(), /Rink lock-up/u);
  assert.doesNotMatch(app.clauses(), /Hall\/court booking/u);
  assert.doesNotMatch(app.clauses(), /Net posts/u);
  assert.doesNotMatch(app.clauses(), /Sports hall lock-up/u);
  assert.doesNotMatch(app.clauses(), /Hall booking/u);
  assert.doesNotMatch(app.clauses(), /Ball racks/u);
  assert.doesNotMatch(app.clauses(), /Gym lock-up/u);
  assert.doesNotMatch(app.clauses(), /Court booking/u);
  assert.doesNotMatch(app.clauses(), /Ball machines/u);
  assert.doesNotMatch(app.clauses(), /Clubhouse lock-up/u);
  assert.doesNotMatch(app.clauses(), /Scoring nets/u);
  assert.doesNotMatch(app.clauses(), /Tea room/u);
  assert.doesNotMatch(app.clauses(), /Pavilion lock-up/u);
  assert.doesNotMatch(app.clauses(), /Track open/u);
  assert.doesNotMatch(app.clauses(), /Track lock-up/u);
  assert.doesNotMatch(app.clauses(), /Pool open/u);
  assert.doesNotMatch(app.clauses(), /Lane lights/u);
  assert.doesNotMatch(app.clauses(), /Pool lock-up/u);
  assert.doesNotMatch(app.clauses(), /Start time/u);
  assert.doesNotMatch(app.clauses(), /Court lights/u);
  assert.doesNotMatch(app.clauses(), /Court lock-up/u);
  assert.doesNotMatch(app.clauses(), /Race start/u);
  assert.doesNotMatch(app.clauses(), /PA volume/u);
  assert.doesNotMatch(app.clauses(), /Field lock-up/u);
  assert.doesNotMatch(app.clauses(), /Finish time/u);
  assert.doesNotMatch(app.clauses(), /Bass/u);
  assert.doesNotMatch(app.clauses(), /Hall lock-up/u);
  assert.doesNotMatch(app.clauses(), /Cook hours/u);
  assert.doesNotMatch(app.clauses(), /Smoke/u);
  assert.doesNotMatch(app.clauses(), /Rooftop lock-up/u);
  assert.doesNotMatch(app.clauses(), /Wash hours/u);
  assert.doesNotMatch(app.clauses(), /Dryer noise/u);
  assert.doesNotMatch(app.clauses(), /Laundry lock-up/u);
  assert.doesNotMatch(app.clauses(), /Watering hours/u);
  assert.doesNotMatch(app.clauses(), /Close time/u);
  assert.doesNotMatch(app.clauses(), /Lighting hours/u);
  assert.doesNotMatch(app.clauses(), /Access hours/u);
  assert.doesNotMatch(app.clauses(), /Stall open hours/u);
  assert.doesNotMatch(app.clauses(), /Match end-time/u);
  assert.doesNotMatch(app.clauses(), /Park access hours/u);
  assert.doesNotMatch(app.clauses(), /Evening hours/u);
  assert.doesNotMatch(app.groups(), /Residents/u);
  assert.doesNotMatch(app.groups(), /Building committee/u);
  assert.doesNotMatch(app.groups(), /Tenants/u);
  assert.doesNotMatch(app.groups(), /Building managers/u);
  assert.doesNotMatch(app.groups(), /Hirers/u);
  assert.doesNotMatch(app.groups(), /Hall committee/u);
});

test("water polo club hours preset loads a distinct synthetic water polo workshop", async () => {
  const app = await savedWorkbench(new Map());
  app.field("#preset-select", "water-polo-club-hours");
  app.click("#load-preset");
  assert.match(app.title(), /Water polo club hours: pool booking, clubhouse bar, and changing-room lock-up/u);
  assert.equal(app.disabled("#export-button"), false);
  assert.doesNotMatch(app.alert(), /Fix the proposal/u);
  assert.match(app.clauses(), /Water polo pool booking/u);
  assert.match(app.clauses(), /Clubhouse bar/u);
  assert.match(app.clauses(), /Changing-room lock-up/u);
  assert.match(app.groups(), /Students/u);
  assert.match(app.groups(), /Neighbours/u);
  assert.match(app.groups(), /P&amp;C/u);
  assert.doesNotMatch(app.title(), /Lacrosse club hours/u);
  assert.doesNotMatch(app.title(), /Rowing club hours/u);
  assert.doesNotMatch(app.title(), /Sailing club hours/u);
  assert.doesNotMatch(app.title(), /Softball club hours/u);
  assert.doesNotMatch(app.title(), /Rugby club hours/u);
  assert.doesNotMatch(app.title(), /Hockey club hours/u);
  assert.doesNotMatch(app.title(), /Soccer club hours/u);
  assert.doesNotMatch(app.title(), /Swimming club hours/u);
  assert.doesNotMatch(app.title(), /Baseball/u);
  assert.doesNotMatch(app.title(), /Volleyball club hours/u);
  assert.doesNotMatch(app.title(), /Basketball club hours/u);
  assert.doesNotMatch(app.title(), /Tennis club hours/u);
  assert.doesNotMatch(app.title(), /Cricket club hours/u);
  assert.doesNotMatch(app.title(), /Athletics club hours/u);
  assert.doesNotMatch(app.title(), /Netball training hours/u);
  assert.doesNotMatch(app.title(), /Sports day hours/u);
  assert.doesNotMatch(app.title(), /School disco hours/u);
  assert.doesNotMatch(app.title(), /Rooftop BBQ hours/u);
  assert.doesNotMatch(app.title(), /Shared laundry hours/u);
  assert.doesNotMatch(app.title(), /Community garden watering/u);
  assert.doesNotMatch(app.title(), /Hall hire hours/u);
  assert.doesNotMatch(app.title(), /Street stall lighting/u);
  assert.doesNotMatch(app.title(), /Market stall hours/u);
  assert.doesNotMatch(app.title(), /Shared bike shed/u);
  assert.doesNotMatch(app.title(), /Sports Fixture Night/u);
  assert.doesNotMatch(app.title(), /Neighbourhood Plan/u);
  assert.doesNotMatch(app.title(), /Library Quiet Hours/u);
  assert.doesNotMatch(app.clauses(), /Lacrosse field booking/u);
  assert.doesNotMatch(app.clauses(), /Rowing pontoon booking/u);
  assert.doesNotMatch(app.clauses(), /Sailing jetty booking/u);
  assert.doesNotMatch(app.clauses(), /Softball diamond booking/u);
  assert.doesNotMatch(app.clauses(), /Outdoor pitch booking/u);
  assert.doesNotMatch(app.clauses(), /Pitch booking/u);
  assert.doesNotMatch(app.clauses(), /Goal nets/u);
  assert.doesNotMatch(app.clauses(), /Ice booking/u);
  assert.doesNotMatch(app.clauses(), /Rink boards/u);
  assert.doesNotMatch(app.clauses(), /Rink lock-up/u);
  assert.doesNotMatch(app.clauses(), /Hall\/court booking/u);
  assert.doesNotMatch(app.clauses(), /Net posts/u);
  assert.doesNotMatch(app.clauses(), /Sports hall lock-up/u);
  assert.doesNotMatch(app.clauses(), /Hall booking/u);
  assert.doesNotMatch(app.clauses(), /Ball racks/u);
  assert.doesNotMatch(app.clauses(), /Gym lock-up/u);
  assert.doesNotMatch(app.clauses(), /Court booking/u);
  assert.doesNotMatch(app.clauses(), /Ball machines/u);
  assert.doesNotMatch(app.clauses(), /Clubhouse lock-up/u);
  assert.doesNotMatch(app.clauses(), /Scoring nets/u);
  assert.doesNotMatch(app.clauses(), /Tea room/u);
  assert.doesNotMatch(app.clauses(), /Pavilion lock-up/u);
  assert.doesNotMatch(app.clauses(), /Track open/u);
  assert.doesNotMatch(app.clauses(), /Track lock-up/u);
  assert.doesNotMatch(app.clauses(), /Pool open/u);
  assert.doesNotMatch(app.clauses(), /Lane lights/u);
  assert.doesNotMatch(app.clauses(), /Pool lock-up/u);
  assert.doesNotMatch(app.clauses(), /Start time/u);
  assert.doesNotMatch(app.clauses(), /Court lights/u);
  assert.doesNotMatch(app.clauses(), /Court lock-up/u);
  assert.doesNotMatch(app.clauses(), /Race start/u);
  assert.doesNotMatch(app.clauses(), /PA volume/u);
  assert.doesNotMatch(app.clauses(), /Field lock-up/u);
  assert.doesNotMatch(app.clauses(), /Finish time/u);
  assert.doesNotMatch(app.clauses(), /Bass/u);
  assert.doesNotMatch(app.clauses(), /Hall lock-up/u);
  assert.doesNotMatch(app.clauses(), /Cook hours/u);
  assert.doesNotMatch(app.clauses(), /Smoke/u);
  assert.doesNotMatch(app.clauses(), /Rooftop lock-up/u);
  assert.doesNotMatch(app.clauses(), /Wash hours/u);
  assert.doesNotMatch(app.clauses(), /Dryer noise/u);
  assert.doesNotMatch(app.clauses(), /Laundry lock-up/u);
  assert.doesNotMatch(app.clauses(), /Watering hours/u);
  assert.doesNotMatch(app.clauses(), /Close time/u);
  assert.doesNotMatch(app.clauses(), /Lighting hours/u);
  assert.doesNotMatch(app.clauses(), /Access hours/u);
  assert.doesNotMatch(app.clauses(), /Stall open hours/u);
  assert.doesNotMatch(app.clauses(), /Match end-time/u);
  assert.doesNotMatch(app.clauses(), /Park access hours/u);
  assert.doesNotMatch(app.clauses(), /Evening hours/u);
  assert.doesNotMatch(app.groups(), /Residents/u);
  assert.doesNotMatch(app.groups(), /Building committee/u);
  assert.doesNotMatch(app.groups(), /Tenants/u);
  assert.doesNotMatch(app.groups(), /Building managers/u);
  assert.doesNotMatch(app.groups(), /Hirers/u);
  assert.doesNotMatch(app.groups(), /Hall committee/u);
});

test("rowing club hours preset loads a distinct synthetic rowing workshop", async () => {
  const app = await savedWorkbench(new Map());
  app.field("#preset-select", "rowing-club-hours");
  app.click("#load-preset");
  assert.match(app.title(), /Rowing club hours: pontoon booking, clubhouse bar, and changing-room lock-up/u);
  assert.equal(app.disabled("#export-button"), false);
  assert.doesNotMatch(app.alert(), /Fix the proposal/u);
  assert.match(app.clauses(), /Rowing pontoon booking/u);
  assert.match(app.clauses(), /Clubhouse bar/u);
  assert.match(app.clauses(), /Changing-room lock-up/u);
  assert.match(app.groups(), /Students/u);
  assert.match(app.groups(), /Neighbours/u);
  assert.match(app.groups(), /P&amp;C/u);
  assert.doesNotMatch(app.title(), /Sailing club hours/u);
  assert.doesNotMatch(app.title(), /Canoeing club hours/u);
  assert.doesNotMatch(app.title(), /Kayaking club hours/u);
  assert.doesNotMatch(app.title(), /Water polo club hours/u);
  assert.doesNotMatch(app.title(), /Lacrosse club hours/u);
  assert.doesNotMatch(app.title(), /Softball club hours/u);
  assert.doesNotMatch(app.title(), /Rugby club hours/u);
  assert.doesNotMatch(app.title(), /Hockey club hours/u);
  assert.doesNotMatch(app.title(), /Soccer club hours/u);
  assert.doesNotMatch(app.title(), /Swimming club hours/u);
  assert.doesNotMatch(app.title(), /Baseball/u);
  assert.doesNotMatch(app.title(), /Volleyball club hours/u);
  assert.doesNotMatch(app.title(), /Basketball club hours/u);
  assert.doesNotMatch(app.title(), /Tennis club hours/u);
  assert.doesNotMatch(app.title(), /Cricket club hours/u);
  assert.doesNotMatch(app.title(), /Athletics club hours/u);
  assert.doesNotMatch(app.title(), /Netball training hours/u);
  assert.doesNotMatch(app.title(), /Sports day hours/u);
  assert.doesNotMatch(app.title(), /School disco hours/u);
  assert.doesNotMatch(app.title(), /Rooftop BBQ hours/u);
  assert.doesNotMatch(app.title(), /Shared laundry hours/u);
  assert.doesNotMatch(app.title(), /Community garden watering/u);
  assert.doesNotMatch(app.title(), /Hall hire hours/u);
  assert.doesNotMatch(app.title(), /Street stall lighting/u);
  assert.doesNotMatch(app.title(), /Market stall hours/u);
  assert.doesNotMatch(app.title(), /Shared bike shed/u);
  assert.doesNotMatch(app.title(), /Sports Fixture Night/u);
  assert.doesNotMatch(app.title(), /Neighbourhood Plan/u);
  assert.doesNotMatch(app.title(), /Library Quiet Hours/u);
  assert.doesNotMatch(app.clauses(), /Water polo pool booking/u);
  assert.doesNotMatch(app.clauses(), /Sailing jetty booking/u);
  assert.doesNotMatch(app.clauses(), /Canoe shed booking/u);
  assert.doesNotMatch(app.clauses(), /Lacrosse field booking/u);
  assert.doesNotMatch(app.clauses(), /Softball diamond booking/u);
  assert.doesNotMatch(app.clauses(), /Outdoor pitch booking/u);
  assert.doesNotMatch(app.clauses(), /Pitch booking/u);
  assert.doesNotMatch(app.clauses(), /Goal nets/u);
  assert.doesNotMatch(app.clauses(), /Ice booking/u);
  assert.doesNotMatch(app.clauses(), /Pool open/u);
  assert.doesNotMatch(app.clauses(), /Lane lights/u);
  assert.doesNotMatch(app.groups(), /Residents/u);
  assert.doesNotMatch(app.groups(), /Building committee/u);
  assert.doesNotMatch(app.groups(), /Tenants/u);
  assert.doesNotMatch(app.groups(), /Building managers/u);
  assert.doesNotMatch(app.groups(), /Hirers/u);
  assert.doesNotMatch(app.groups(), /Hall committee/u);
});

test("sailing club hours preset loads a distinct synthetic sailing workshop", async () => {
  const app = await savedWorkbench(new Map());
  app.field("#preset-select", "sailing-club-hours");
  app.click("#load-preset");
  assert.match(app.title(), /Sailing club hours: jetty booking, clubhouse bar, and changing-room lock-up/u);
  assert.equal(app.disabled("#export-button"), false);
  assert.doesNotMatch(app.alert(), /Fix the proposal/u);
  assert.match(app.clauses(), /Sailing jetty booking/u);
  assert.match(app.clauses(), /Clubhouse bar/u);
  assert.match(app.clauses(), /Changing-room lock-up/u);
  assert.match(app.groups(), /Students/u);
  assert.match(app.groups(), /Neighbours/u);
  assert.match(app.groups(), /P&amp;C/u);
  assert.match(app.firstGroupWithoutFloor(), /First group without a support floor: Students/u);
  assert.match(app.lastGroupWithoutFloor(), /Last group without a support floor: P&amp;C/u);
  assert.match(app.groupsWithoutFloorCount(), /Groups without a support floor: 3/u);
  assert.doesNotMatch(app.groupsWithoutFloorCount(), /First group without a support floor/u);
  assert.doesNotMatch(app.groupsWithoutFloorCount(), /Last group without a support floor/u);
  assert.doesNotMatch(app.firstGroupWithoutFloor(), /Last group without a support floor/u);
  assert.doesNotMatch(app.lastGroupWithoutFloor(), /First group without a support floor/u);
  assert.doesNotMatch(app.title(), /Rowing club hours/u);
  assert.doesNotMatch(app.title(), /Canoeing club hours/u);
  assert.doesNotMatch(app.title(), /Kayaking club hours/u);
  assert.doesNotMatch(app.title(), /Dragon boat club hours/u);
  assert.doesNotMatch(app.title(), /Water polo club hours/u);
  assert.doesNotMatch(app.title(), /Lacrosse club hours/u);
  assert.doesNotMatch(app.title(), /Softball club hours/u);
  assert.doesNotMatch(app.title(), /Rugby club hours/u);
  assert.doesNotMatch(app.title(), /Hockey club hours/u);
  assert.doesNotMatch(app.title(), /Soccer club hours/u);
  assert.doesNotMatch(app.title(), /Swimming club hours/u);
  assert.doesNotMatch(app.title(), /Baseball/u);
  assert.doesNotMatch(app.title(), /Volleyball club hours/u);
  assert.doesNotMatch(app.title(), /Basketball club hours/u);
  assert.doesNotMatch(app.title(), /Tennis club hours/u);
  assert.doesNotMatch(app.title(), /Cricket club hours/u);
  assert.doesNotMatch(app.title(), /Athletics club hours/u);
  assert.doesNotMatch(app.title(), /Netball training hours/u);
  assert.doesNotMatch(app.title(), /Sports day hours/u);
  assert.doesNotMatch(app.title(), /School disco hours/u);
  assert.doesNotMatch(app.title(), /Rooftop BBQ hours/u);
  assert.doesNotMatch(app.title(), /Shared laundry hours/u);
  assert.doesNotMatch(app.title(), /Community garden watering/u);
  assert.doesNotMatch(app.title(), /Hall hire hours/u);
  assert.doesNotMatch(app.title(), /Street stall lighting/u);
  assert.doesNotMatch(app.title(), /Market stall hours/u);
  assert.doesNotMatch(app.title(), /Shared bike shed/u);
  assert.doesNotMatch(app.title(), /Sports Fixture Night/u);
  assert.doesNotMatch(app.title(), /Neighbourhood Plan/u);
  assert.doesNotMatch(app.title(), /Library Quiet Hours/u);
  assert.doesNotMatch(app.clauses(), /Rowing pontoon booking/u);
  assert.doesNotMatch(app.clauses(), /Canoe shed booking/u);
  assert.doesNotMatch(app.clauses(), /Water polo pool booking/u);
  assert.doesNotMatch(app.clauses(), /Lacrosse field booking/u);
  assert.doesNotMatch(app.clauses(), /Softball diamond booking/u);
  assert.doesNotMatch(app.clauses(), /Outdoor pitch booking/u);
  assert.doesNotMatch(app.clauses(), /Pitch booking/u);
  assert.doesNotMatch(app.clauses(), /Goal nets/u);
  assert.doesNotMatch(app.clauses(), /Ice booking/u);
  assert.doesNotMatch(app.clauses(), /Pool open/u);
  assert.doesNotMatch(app.clauses(), /Lane lights/u);
  assert.doesNotMatch(app.groups(), /Residents/u);
  assert.doesNotMatch(app.groups(), /Building committee/u);
  assert.doesNotMatch(app.groups(), /Tenants/u);
  assert.doesNotMatch(app.groups(), /Building managers/u);
  assert.doesNotMatch(app.groups(), /Hirers/u);
  assert.doesNotMatch(app.groups(), /Hall committee/u);
});

test("canoeing club hours preset loads a distinct synthetic canoeing workshop", async () => {
  const app = await savedWorkbench(new Map());
  app.field("#preset-select", "canoeing-club-hours");
  app.click("#load-preset");
  assert.match(app.title(), /Canoeing club hours: canoe-shed booking, clubhouse bar, and changing-room lock-up/u);
  assert.equal(app.disabled("#export-button"), false);
  assert.doesNotMatch(app.alert(), /Fix the proposal/u);
  assert.match(app.clauses(), /Canoe shed booking/u);
  assert.match(app.clauses(), /Clubhouse bar/u);
  assert.match(app.clauses(), /Changing-room lock-up/u);
  assert.match(app.clauses(), /paddle pontoon/u);
  assert.match(app.clauses(), /canoe shed/u);
  assert.match(app.groups(), /Students/u);
  assert.match(app.groups(), /Neighbours/u);
  assert.match(app.groups(), /P&amp;C/u);
  assert.match(app.firstGroupWithoutFloor(), /First group without a support floor: Students/u);
  assert.match(app.lastGroupWithoutFloor(), /Last group without a support floor: P&amp;C/u);
  assert.match(app.groupsWithoutFloorCount(), /Groups without a support floor: 3/u);
  assert.doesNotMatch(app.groupsWithoutFloorCount(), /First group without a support floor/u);
  assert.doesNotMatch(app.groupsWithoutFloorCount(), /Last group without a support floor/u);
  assert.doesNotMatch(app.firstGroupWithoutFloor(), /Last group without a support floor/u);
  assert.doesNotMatch(app.lastGroupWithoutFloor(), /First group without a support floor/u);
  assert.doesNotMatch(app.title(), /Sailing club hours/u);
  assert.doesNotMatch(app.title(), /Rowing club hours/u);
  assert.doesNotMatch(app.title(), /Kayaking club hours/u);
  assert.doesNotMatch(app.title(), /Dragon boat club hours/u);
  assert.doesNotMatch(app.title(), /Water polo club hours/u);
  assert.doesNotMatch(app.title(), /Lacrosse club hours/u);
  assert.doesNotMatch(app.title(), /Softball club hours/u);
  assert.doesNotMatch(app.title(), /Rugby club hours/u);
  assert.doesNotMatch(app.title(), /Hockey club hours/u);
  assert.doesNotMatch(app.title(), /Soccer club hours/u);
  assert.doesNotMatch(app.title(), /Swimming club hours/u);
  assert.doesNotMatch(app.title(), /Baseball/u);
  assert.doesNotMatch(app.title(), /Volleyball club hours/u);
  assert.doesNotMatch(app.title(), /Basketball club hours/u);
  assert.doesNotMatch(app.title(), /Tennis club hours/u);
  assert.doesNotMatch(app.title(), /Cricket club hours/u);
  assert.doesNotMatch(app.title(), /Athletics club hours/u);
  assert.doesNotMatch(app.title(), /Netball training hours/u);
  assert.doesNotMatch(app.title(), /Sports day hours/u);
  assert.doesNotMatch(app.title(), /School disco hours/u);
  assert.doesNotMatch(app.title(), /Rooftop BBQ hours/u);
  assert.doesNotMatch(app.title(), /Shared laundry hours/u);
  assert.doesNotMatch(app.title(), /Community garden watering/u);
  assert.doesNotMatch(app.title(), /Hall hire hours/u);
  assert.doesNotMatch(app.title(), /Street stall lighting/u);
  assert.doesNotMatch(app.title(), /Market stall hours/u);
  assert.doesNotMatch(app.title(), /Shared bike shed/u);
  assert.doesNotMatch(app.title(), /Sports Fixture Night/u);
  assert.doesNotMatch(app.title(), /Neighbourhood Plan/u);
  assert.doesNotMatch(app.title(), /Library Quiet Hours/u);
  assert.doesNotMatch(app.clauses(), /Sailing jetty booking/u);
  assert.doesNotMatch(app.clauses(), /Rowing pontoon booking/u);
  assert.doesNotMatch(app.clauses(), /Whitewater booking/u);
  assert.doesNotMatch(app.clauses(), /Dragon-boat staging booking/u);
  assert.doesNotMatch(app.clauses(), /yacht-club/u);
  assert.doesNotMatch(app.clauses(), /boat-house/u);
  assert.doesNotMatch(app.clauses(), /Water polo pool booking/u);
  assert.doesNotMatch(app.clauses(), /Lacrosse field booking/u);
  assert.doesNotMatch(app.clauses(), /Softball diamond booking/u);
  assert.doesNotMatch(app.clauses(), /Outdoor pitch booking/u);
  assert.doesNotMatch(app.clauses(), /Pitch booking/u);
  assert.doesNotMatch(app.clauses(), /Goal nets/u);
  assert.doesNotMatch(app.clauses(), /Ice booking/u);
  assert.doesNotMatch(app.clauses(), /Pool open/u);
  assert.doesNotMatch(app.clauses(), /Lane lights/u);
  assert.doesNotMatch(app.groups(), /Residents/u);
  assert.doesNotMatch(app.groups(), /Building committee/u);
  assert.doesNotMatch(app.groups(), /Tenants/u);
  assert.doesNotMatch(app.groups(), /Building managers/u);
  assert.doesNotMatch(app.groups(), /Hirers/u);
  assert.doesNotMatch(app.groups(), /Hall committee/u);
});

test("kayaking club hours preset loads a distinct synthetic kayaking workshop", async () => {
  const app = await savedWorkbench(new Map());
  app.field("#preset-select", "kayaking-club-hours");
  app.click("#load-preset");
  assert.match(app.title(), /Kayaking club hours: whitewater booking, slalom bar, and spraydeck lock-up/u);
  assert.equal(app.disabled("#export-button"), false);
  assert.doesNotMatch(app.alert(), /Fix the proposal/u);
  assert.match(app.clauses(), /Whitewater booking/u);
  assert.match(app.clauses(), /Slalom bar hours/u);
  assert.match(app.clauses(), /Spraydeck lock-up/u);
  assert.match(app.clauses(), /whitewater/u);
  assert.match(app.clauses(), /slalom/u);
  assert.match(app.clauses(), /spraydeck/u);
  assert.match(app.groups(), /Students/u);
  assert.match(app.groups(), /Neighbours/u);
  assert.match(app.groups(), /P&amp;C/u);
  assert.match(app.firstGroupWithoutFloor(), /First group without a support floor: Students/u);
  assert.match(app.lastGroupWithoutFloor(), /Last group without a support floor: P&amp;C/u);
  assert.match(app.groupsWithoutFloorCount(), /Groups without a support floor: 3/u);
  assert.match(app.groupsWithoutFloorRemaining(), /Groups-without-floor remaining: 9/u);
  assert.match(app.lastGroupWithoutFloorRemaining(), /Last-without-floor remaining: 2/u);
  assert.match(app.firstGroupWithoutFloorRemaining(), /First-without-floor remaining: 4/u);
  assert.doesNotMatch(app.groupsWithoutFloorRemaining(), /Groups without a support floor:/u);
  assert.doesNotMatch(app.groupsWithoutFloorRemaining(), /Last-without-floor remaining/u);
  assert.doesNotMatch(app.groupsWithoutFloorRemaining(), /First-without-floor remaining/u);
  assert.doesNotMatch(app.lastGroupWithoutFloorRemaining(), /Groups-without-floor remaining/u);
  assert.doesNotMatch(app.lastGroupWithoutFloorRemaining(), /First-without-floor remaining/u);
  assert.doesNotMatch(app.firstGroupWithoutFloorRemaining(), /Groups-without-floor remaining/u);
  assert.doesNotMatch(app.firstGroupWithoutFloorRemaining(), /Last-without-floor remaining/u);
  assert.doesNotMatch(app.groupsWithoutFloorCount(), /Groups-without-floor remaining/u);
  assert.doesNotMatch(app.groupsWithoutFloorCount(), /Last-without-floor remaining/u);
  assert.doesNotMatch(app.groupsWithoutFloorCount(), /First-without-floor remaining/u);
  assert.doesNotMatch(app.groupsWithoutFloorRemaining(), /First group without a support floor/u);
  assert.doesNotMatch(app.groupsWithoutFloorRemaining(), /Last group without a support floor/u);
  assert.doesNotMatch(app.groupsWithoutFloorRemaining(), /Remaining change-budget/u);
  assert.doesNotMatch(app.groupsWithoutFloorRemaining(), /Students/u);
  assert.doesNotMatch(app.lastGroupWithoutFloorRemaining(), /Students/u);
  assert.doesNotMatch(app.firstGroupWithoutFloorRemaining(), /Students/u);
  assert.doesNotMatch(app.groupsWithoutFloorCount(), /First group without a support floor/u);
  assert.doesNotMatch(app.groupsWithoutFloorCount(), /Last group without a support floor/u);
  assert.doesNotMatch(app.firstGroupWithoutFloor(), /Last group without a support floor/u);
  assert.doesNotMatch(app.lastGroupWithoutFloor(), /First group without a support floor/u);
  assert.doesNotMatch(app.title(), /Canoeing club hours/u);
  assert.doesNotMatch(app.title(), /Dragon boat club hours/u);
  assert.doesNotMatch(app.title(), /Surf club hours/u);
  assert.doesNotMatch(app.title(), /Triathlon club hours/u);
  assert.doesNotMatch(app.title(), /Sailing club hours/u);
  assert.doesNotMatch(app.title(), /Rowing club hours/u);
  assert.doesNotMatch(app.title(), /Water polo club hours/u);
  assert.doesNotMatch(app.title(), /Lacrosse club hours/u);
  assert.doesNotMatch(app.title(), /Softball club hours/u);
  assert.doesNotMatch(app.title(), /Rugby club hours/u);
  assert.doesNotMatch(app.title(), /Hockey club hours/u);
  assert.doesNotMatch(app.title(), /Soccer club hours/u);
  assert.doesNotMatch(app.title(), /Swimming club hours/u);
  assert.doesNotMatch(app.title(), /Baseball/u);
  assert.doesNotMatch(app.title(), /Volleyball club hours/u);
  assert.doesNotMatch(app.title(), /Basketball club hours/u);
  assert.doesNotMatch(app.title(), /Tennis club hours/u);
  assert.doesNotMatch(app.title(), /Cricket club hours/u);
  assert.doesNotMatch(app.title(), /Athletics club hours/u);
  assert.doesNotMatch(app.title(), /Netball training hours/u);
  assert.doesNotMatch(app.title(), /Sports day hours/u);
  assert.doesNotMatch(app.title(), /School disco hours/u);
  assert.doesNotMatch(app.title(), /Rooftop BBQ hours/u);
  assert.doesNotMatch(app.title(), /Shared laundry hours/u);
  assert.doesNotMatch(app.title(), /Community garden watering/u);
  assert.doesNotMatch(app.title(), /Hall hire hours/u);
  assert.doesNotMatch(app.title(), /Street stall lighting/u);
  assert.doesNotMatch(app.title(), /Market stall hours/u);
  assert.doesNotMatch(app.title(), /Shared bike shed/u);
  assert.doesNotMatch(app.title(), /Sports Fixture Night/u);
  assert.doesNotMatch(app.title(), /Neighbourhood Plan/u);
  assert.doesNotMatch(app.title(), /Library Quiet Hours/u);
  assert.doesNotMatch(app.clauses(), /Canoe shed booking/u);
  assert.doesNotMatch(app.clauses(), /Dragon-boat staging booking/u);
  assert.doesNotMatch(app.clauses(), /paddle pontoon/u);
  assert.doesNotMatch(app.clauses(), /Sailing jetty booking/u);
  assert.doesNotMatch(app.clauses(), /yacht-club/u);
  assert.doesNotMatch(app.clauses(), /marina/u);
  assert.doesNotMatch(app.clauses(), /Rowing pontoon booking/u);
  assert.doesNotMatch(app.clauses(), /boat-house/u);
  assert.doesNotMatch(app.clauses(), /Water polo pool booking/u);
  assert.doesNotMatch(app.clauses(), /Lacrosse field booking/u);
  assert.doesNotMatch(app.clauses(), /Softball diamond booking/u);
  assert.doesNotMatch(app.clauses(), /Outdoor pitch booking/u);
  assert.doesNotMatch(app.clauses(), /Pitch booking/u);
  assert.doesNotMatch(app.clauses(), /Goal nets/u);
  assert.doesNotMatch(app.clauses(), /Ice booking/u);
  assert.doesNotMatch(app.clauses(), /Pool open/u);
  assert.doesNotMatch(app.clauses(), /Lane lights/u);
  assert.doesNotMatch(app.groups(), /Residents/u);
  assert.doesNotMatch(app.groups(), /Building committee/u);
  assert.doesNotMatch(app.groups(), /Tenants/u);
  assert.doesNotMatch(app.groups(), /Building managers/u);
  assert.doesNotMatch(app.groups(), /Hirers/u);
  assert.doesNotMatch(app.groups(), /Hall committee/u);
});

test("dragon boat club hours preset loads a distinct synthetic dragon-boat workshop", async () => {
  const app = await savedWorkbench(new Map());
  app.field("#preset-select", "dragon-boat-club-hours");
  app.click("#load-preset");
  assert.match(app.title(), /Dragon boat club hours: dragon-boat staging booking, drum bar, and paddle-box lock-up/u);
  assert.equal(app.disabled("#export-button"), false);
  assert.doesNotMatch(app.alert(), /Fix the proposal/u);
  assert.match(app.clauses(), /Dragon-boat staging booking/u);
  assert.match(app.clauses(), /Drum bar hours/u);
  assert.match(app.clauses(), /Paddle-box lock-up/u);
  assert.match(app.clauses(), /dragon-boat/u);
  assert.match(app.clauses(), /drum-seat/u);
  assert.match(app.clauses(), /paddle-box/u);
  assert.match(app.groups(), /Students/u);
  assert.match(app.groups(), /Neighbours/u);
  assert.match(app.groups(), /P&amp;C/u);
  assert.match(app.firstGroupWithoutFloor(), /First group without a support floor: Students/u);
  assert.match(app.lastGroupWithoutFloor(), /Last group without a support floor: P&amp;C/u);
  assert.match(app.groupsWithoutFloorCount(), /Groups without a support floor: 3/u);
  assert.match(app.groupsWithoutFloorRemaining(), /Groups-without-floor remaining: 16/u);
  assert.match(app.lastGroupWithoutFloorRemaining(), /Last-without-floor remaining: 7/u);
  assert.match(app.firstGroupWithoutFloorRemaining(), /First-without-floor remaining: 5/u);
  assert.doesNotMatch(app.groupsWithoutFloorRemaining(), /Groups without a support floor:/u);
  assert.doesNotMatch(app.groupsWithoutFloorRemaining(), /Last-without-floor remaining/u);
  assert.doesNotMatch(app.groupsWithoutFloorRemaining(), /First-without-floor remaining/u);
  assert.doesNotMatch(app.lastGroupWithoutFloorRemaining(), /Groups-without-floor remaining/u);
  assert.doesNotMatch(app.lastGroupWithoutFloorRemaining(), /First-without-floor remaining/u);
  assert.doesNotMatch(app.firstGroupWithoutFloorRemaining(), /Groups-without-floor remaining/u);
  assert.doesNotMatch(app.firstGroupWithoutFloorRemaining(), /Last-without-floor remaining/u);
  assert.doesNotMatch(app.groupsWithoutFloorCount(), /Groups-without-floor remaining/u);
  assert.doesNotMatch(app.groupsWithoutFloorCount(), /Last-without-floor remaining/u);
  assert.doesNotMatch(app.groupsWithoutFloorCount(), /First-without-floor remaining/u);
  assert.doesNotMatch(app.groupsWithoutFloorRemaining(), /First group without a support floor/u);
  assert.doesNotMatch(app.groupsWithoutFloorRemaining(), /Last group without a support floor/u);
  assert.doesNotMatch(app.groupsWithoutFloorRemaining(), /Remaining change-budget/u);
  assert.doesNotMatch(app.groupsWithoutFloorRemaining(), /Students/u);
  assert.doesNotMatch(app.lastGroupWithoutFloorRemaining(), /Students/u);
  assert.doesNotMatch(app.lastGroupWithoutFloorRemaining(), /P&amp;C/u);
  assert.doesNotMatch(app.firstGroupWithoutFloorRemaining(), /Students/u);
  assert.doesNotMatch(app.firstGroupWithoutFloorRemaining(), /P&amp;C/u);
  assert.doesNotMatch(app.groupsWithoutFloorCount(), /First group without a support floor/u);
  assert.doesNotMatch(app.groupsWithoutFloorCount(), /Last group without a support floor/u);
  assert.doesNotMatch(app.firstGroupWithoutFloor(), /Last group without a support floor/u);
  assert.doesNotMatch(app.lastGroupWithoutFloor(), /First group without a support floor/u);
  assert.doesNotMatch(app.title(), /Kayaking club hours/u);
  assert.doesNotMatch(app.title(), /Canoeing club hours/u);
  assert.doesNotMatch(app.title(), /Surf club hours/u);
  assert.doesNotMatch(app.title(), /Triathlon club hours/u);
  assert.doesNotMatch(app.title(), /Sailing club hours/u);
  assert.doesNotMatch(app.title(), /Rowing club hours/u);
  assert.doesNotMatch(app.title(), /Water polo club hours/u);
  assert.doesNotMatch(app.title(), /Lacrosse club hours/u);
  assert.doesNotMatch(app.title(), /Softball club hours/u);
  assert.doesNotMatch(app.title(), /Rugby club hours/u);
  assert.doesNotMatch(app.title(), /Hockey club hours/u);
  assert.doesNotMatch(app.title(), /Soccer club hours/u);
  assert.doesNotMatch(app.title(), /Swimming club hours/u);
  assert.doesNotMatch(app.title(), /Baseball/u);
  assert.doesNotMatch(app.title(), /Volleyball club hours/u);
  assert.doesNotMatch(app.title(), /Basketball club hours/u);
  assert.doesNotMatch(app.title(), /Tennis club hours/u);
  assert.doesNotMatch(app.title(), /Cricket club hours/u);
  assert.doesNotMatch(app.title(), /Athletics club hours/u);
  assert.doesNotMatch(app.title(), /Netball training hours/u);
  assert.doesNotMatch(app.title(), /Sports day hours/u);
  assert.doesNotMatch(app.title(), /School disco hours/u);
  assert.doesNotMatch(app.title(), /Rooftop BBQ hours/u);
  assert.doesNotMatch(app.title(), /Shared laundry hours/u);
  assert.doesNotMatch(app.title(), /Community garden watering/u);
  assert.doesNotMatch(app.title(), /Hall hire hours/u);
  assert.doesNotMatch(app.title(), /Street stall lighting/u);
  assert.doesNotMatch(app.title(), /Market stall hours/u);
  assert.doesNotMatch(app.title(), /Shared bike shed/u);
  assert.doesNotMatch(app.title(), /Sports Fixture Night/u);
  assert.doesNotMatch(app.title(), /Neighbourhood Plan/u);
  assert.doesNotMatch(app.title(), /Library Quiet Hours/u);
  assert.doesNotMatch(app.clauses(), /Whitewater booking/u);
  assert.doesNotMatch(app.clauses(), /slalom/u);
  assert.doesNotMatch(app.clauses(), /spraydeck/u);
  assert.doesNotMatch(app.clauses(), /Canoe shed booking/u);
  assert.doesNotMatch(app.clauses(), /paddle pontoon/u);
  assert.doesNotMatch(app.clauses(), /Sailing jetty booking/u);
  assert.doesNotMatch(app.clauses(), /yacht-club/u);
  assert.doesNotMatch(app.clauses(), /marina/u);
  assert.doesNotMatch(app.clauses(), /Rowing pontoon booking/u);
  assert.doesNotMatch(app.clauses(), /boat-house/u);
  assert.doesNotMatch(app.clauses(), /Water polo pool booking/u);
  assert.doesNotMatch(app.clauses(), /Lacrosse field booking/u);
  assert.doesNotMatch(app.clauses(), /Softball diamond booking/u);
  assert.doesNotMatch(app.clauses(), /Outdoor pitch booking/u);
  assert.doesNotMatch(app.clauses(), /Pitch booking/u);
  assert.doesNotMatch(app.clauses(), /Goal nets/u);
  assert.doesNotMatch(app.clauses(), /Ice booking/u);
  assert.doesNotMatch(app.clauses(), /Pool open/u);
  assert.doesNotMatch(app.clauses(), /Lane lights/u);
  assert.doesNotMatch(app.clauses(), /Surf-club staging booking/u);
  assert.doesNotMatch(app.clauses(), /board-bag/u);
  assert.doesNotMatch(app.groups(), /Residents/u);
  assert.doesNotMatch(app.groups(), /Building committee/u);
  assert.doesNotMatch(app.groups(), /Tenants/u);
  assert.doesNotMatch(app.groups(), /Building managers/u);
  assert.doesNotMatch(app.groups(), /Hirers/u);
  assert.doesNotMatch(app.groups(), /Hall committee/u);
});

test("surf club hours preset loads a distinct synthetic surf-club workshop", async () => {
  const app = await savedWorkbench(new Map());
  app.field("#preset-select", "surf-club-hours");
  app.click("#load-preset");
  assert.match(app.title(), /Surf club hours: surf-club staging booking, clubhouse bar, and board-bag lock-up/u);
  assert.equal(app.disabled("#export-button"), false);
  assert.doesNotMatch(app.alert(), /Fix the proposal/u);
  assert.match(app.clauses(), /Surf-club staging booking/u);
  assert.match(app.clauses(), /Clubhouse bar hours/u);
  assert.match(app.clauses(), /Board-bag lock-up/u);
  assert.match(app.clauses(), /surf-club/u);
  assert.match(app.clauses(), /board-rack/u);
  assert.match(app.clauses(), /board-bag/u);
  assert.match(app.groups(), /Students/u);
  assert.match(app.groups(), /Neighbours/u);
  assert.match(app.groups(), /P&amp;C/u);
  assert.match(app.firstGroupWithoutFloor(), /First group without a support floor: Students/u);
  assert.match(app.lastGroupWithoutFloor(), /Last group without a support floor: P&amp;C/u);
  assert.match(app.groupsWithoutFloorCount(), /Groups without a support floor: 3/u);
  assert.match(app.groupsWithoutFloorRemaining(), /Groups-without-floor remaining: 19/u);
  assert.match(app.lastGroupWithoutFloorRemaining(), /Last-without-floor remaining: 8/u);
  assert.match(app.firstGroupWithoutFloorRemaining(), /First-without-floor remaining: 6/u);
  assert.match(app.firstGroupWithoutFloorCost(), /First-without-floor cost: 6/u);
  assert.doesNotMatch(app.firstGroupWithoutFloorCost(), /First-without-floor remaining/u);
  assert.doesNotMatch(app.firstGroupWithoutFloorRemaining(), /First-without-floor cost/u);
  assert.doesNotMatch(app.groupsWithoutFloorRemaining(), /Groups without a support floor:/u);
  assert.doesNotMatch(app.groupsWithoutFloorRemaining(), /Last-without-floor remaining/u);
  assert.doesNotMatch(app.groupsWithoutFloorRemaining(), /First-without-floor remaining/u);
  assert.doesNotMatch(app.lastGroupWithoutFloorRemaining(), /Groups-without-floor remaining/u);
  assert.doesNotMatch(app.lastGroupWithoutFloorRemaining(), /First-without-floor remaining/u);
  assert.doesNotMatch(app.firstGroupWithoutFloorRemaining(), /Groups-without-floor remaining/u);
  assert.doesNotMatch(app.firstGroupWithoutFloorRemaining(), /Last-without-floor remaining/u);
  assert.doesNotMatch(app.groupsWithoutFloorCount(), /Groups-without-floor remaining/u);
  assert.doesNotMatch(app.groupsWithoutFloorCount(), /Last-without-floor remaining/u);
  assert.doesNotMatch(app.groupsWithoutFloorCount(), /First-without-floor remaining/u);
  assert.doesNotMatch(app.groupsWithoutFloorRemaining(), /First group without a support floor/u);
  assert.doesNotMatch(app.groupsWithoutFloorRemaining(), /Last group without a support floor/u);
  assert.doesNotMatch(app.groupsWithoutFloorRemaining(), /Remaining change-budget/u);
  assert.doesNotMatch(app.groupsWithoutFloorRemaining(), /Students/u);
  assert.doesNotMatch(app.lastGroupWithoutFloorRemaining(), /Students/u);
  assert.doesNotMatch(app.lastGroupWithoutFloorRemaining(), /P&amp;C/u);
  assert.doesNotMatch(app.firstGroupWithoutFloorRemaining(), /Students/u);
  assert.doesNotMatch(app.firstGroupWithoutFloorRemaining(), /P&amp;C/u);
  assert.doesNotMatch(app.groupsWithoutFloorCount(), /First group without a support floor/u);
  assert.doesNotMatch(app.groupsWithoutFloorCount(), /Last group without a support floor/u);
  assert.doesNotMatch(app.firstGroupWithoutFloor(), /Last group without a support floor/u);
  assert.doesNotMatch(app.lastGroupWithoutFloor(), /First group without a support floor/u);
  assert.doesNotMatch(app.title(), /Dragon boat club hours/u);
  assert.doesNotMatch(app.title(), /Kayaking club hours/u);
  assert.doesNotMatch(app.title(), /Triathlon club hours/u);
  assert.doesNotMatch(app.title(), /Canoeing club hours/u);
  assert.doesNotMatch(app.title(), /Sailing club hours/u);
  assert.doesNotMatch(app.title(), /Rowing club hours/u);
  assert.doesNotMatch(app.title(), /Water polo club hours/u);
  assert.doesNotMatch(app.title(), /Lacrosse club hours/u);
  assert.doesNotMatch(app.title(), /Softball club hours/u);
  assert.doesNotMatch(app.title(), /Rugby club hours/u);
  assert.doesNotMatch(app.title(), /Hockey club hours/u);
  assert.doesNotMatch(app.title(), /Soccer club hours/u);
  assert.doesNotMatch(app.title(), /Swimming club hours/u);
  assert.doesNotMatch(app.title(), /Baseball/u);
  assert.doesNotMatch(app.title(), /Volleyball club hours/u);
  assert.doesNotMatch(app.title(), /Basketball club hours/u);
  assert.doesNotMatch(app.title(), /Tennis club hours/u);
  assert.doesNotMatch(app.title(), /Cricket club hours/u);
  assert.doesNotMatch(app.title(), /Athletics club hours/u);
  assert.doesNotMatch(app.title(), /Netball training hours/u);
  assert.doesNotMatch(app.title(), /Sports day hours/u);
  assert.doesNotMatch(app.title(), /School disco hours/u);
  assert.doesNotMatch(app.title(), /Rooftop BBQ hours/u);
  assert.doesNotMatch(app.title(), /Shared laundry hours/u);
  assert.doesNotMatch(app.title(), /Community garden watering/u);
  assert.doesNotMatch(app.title(), /Hall hire hours/u);
  assert.doesNotMatch(app.title(), /Street stall lighting/u);
  assert.doesNotMatch(app.title(), /Market stall hours/u);
  assert.doesNotMatch(app.title(), /Shared bike shed/u);
  assert.doesNotMatch(app.title(), /Sports Fixture Night/u);
  assert.doesNotMatch(app.title(), /Neighbourhood Plan/u);
  assert.doesNotMatch(app.title(), /Library Quiet Hours/u);
  assert.doesNotMatch(app.clauses(), /Dragon-boat staging booking/u);
  assert.doesNotMatch(app.clauses(), /drum-seat/u);
  assert.doesNotMatch(app.clauses(), /paddle-box/u);
  assert.doesNotMatch(app.clauses(), /Whitewater booking/u);
  assert.doesNotMatch(app.clauses(), /slalom/u);
  assert.doesNotMatch(app.clauses(), /spraydeck/u);
  assert.doesNotMatch(app.clauses(), /Canoe shed booking/u);
  assert.doesNotMatch(app.clauses(), /paddle pontoon/u);
  assert.doesNotMatch(app.clauses(), /Sailing jetty booking/u);
  assert.doesNotMatch(app.clauses(), /yacht-club/u);
  assert.doesNotMatch(app.clauses(), /marina/u);
  assert.doesNotMatch(app.clauses(), /Rowing pontoon booking/u);
  assert.doesNotMatch(app.clauses(), /boat-house/u);
  assert.doesNotMatch(app.clauses(), /Water polo pool booking/u);
  assert.doesNotMatch(app.clauses(), /Lacrosse field booking/u);
  assert.doesNotMatch(app.clauses(), /Softball diamond booking/u);
  assert.doesNotMatch(app.clauses(), /Outdoor pitch booking/u);
  assert.doesNotMatch(app.clauses(), /Pitch booking/u);
  assert.doesNotMatch(app.clauses(), /Goal nets/u);
  assert.doesNotMatch(app.clauses(), /Ice booking/u);
  assert.doesNotMatch(app.clauses(), /Pool open/u);
  assert.doesNotMatch(app.clauses(), /Lane lights/u);
  assert.doesNotMatch(app.clauses(), /Triathlon staging booking/u);
  assert.doesNotMatch(app.clauses(), /transition-area/u);
  assert.doesNotMatch(app.clauses(), /bike-bag/u);
  assert.doesNotMatch(app.groups(), /Residents/u);
  assert.doesNotMatch(app.groups(), /Building committee/u);
  assert.doesNotMatch(app.groups(), /Tenants/u);
  assert.doesNotMatch(app.groups(), /Building managers/u);
  assert.doesNotMatch(app.groups(), /Hirers/u);
  assert.doesNotMatch(app.groups(), /Hall committee/u);
});

test("triathlon club hours preset loads a distinct synthetic triathlon workshop", async () => {
  const app = await savedWorkbench(new Map());
  app.field("#preset-select", "triathlon-club-hours");
  app.click("#load-preset");
  assert.match(app.title(), /Triathlon club hours: triathlon staging booking, transition-area hours, and bike-bag lock-up/u);
  assert.equal(app.disabled("#export-button"), false);
  assert.doesNotMatch(app.alert(), /Fix the proposal/u);
  assert.match(app.clauses(), /Triathlon staging booking/u);
  assert.match(app.clauses(), /Transition-area hours/u);
  assert.match(app.clauses(), /Bike-bag lock-up/u);
  assert.match(app.clauses(), /triathlon/u);
  assert.match(app.clauses(), /transition-rack/u);
  assert.match(app.clauses(), /bike-bag/u);
  assert.match(app.groups(), /Students/u);
  assert.match(app.groups(), /Neighbours/u);
  assert.match(app.groups(), /P&amp;C/u);
  assert.match(app.firstGroupWithoutFloor(), /First group without a support floor: Students/u);
  assert.match(app.lastGroupWithoutFloor(), /Last group without a support floor: P&amp;C/u);
  assert.match(app.groupsWithoutFloorCount(), /Groups without a support floor: 3/u);
  assert.match(app.groupsWithoutFloorRemaining(), /Groups-without-floor remaining: 22/u);
  assert.match(app.lastGroupWithoutFloorRemaining(), /Last-without-floor remaining: 9/u);
  assert.match(app.firstGroupWithoutFloorRemaining(), /First-without-floor remaining: 7/u);
  assert.match(app.firstGroupWithoutFloorCost(), /First-without-floor cost: 7/u);
  assert.match(app.lastGroupWithoutFloorCost(), /Last-without-floor cost: 9/u);
  assert.doesNotMatch(app.lastGroupWithoutFloorCost(), /First-without-floor cost/u);
  assert.doesNotMatch(app.lastGroupWithoutFloorCost(), /Last-without-floor remaining/u);
  assert.doesNotMatch(app.firstGroupWithoutFloorCost(), /First-without-floor remaining/u);
  assert.doesNotMatch(app.firstGroupWithoutFloorRemaining(), /First-without-floor cost/u);
  assert.doesNotMatch(app.groupsWithoutFloorRemaining(), /Groups without a support floor:/u);
  assert.doesNotMatch(app.groupsWithoutFloorRemaining(), /Last-without-floor remaining/u);
  assert.doesNotMatch(app.groupsWithoutFloorRemaining(), /First-without-floor remaining/u);
  assert.doesNotMatch(app.lastGroupWithoutFloorRemaining(), /Groups-without-floor remaining/u);
  assert.doesNotMatch(app.lastGroupWithoutFloorRemaining(), /First-without-floor remaining/u);
  assert.doesNotMatch(app.firstGroupWithoutFloorRemaining(), /Groups-without-floor remaining/u);
  assert.doesNotMatch(app.firstGroupWithoutFloorRemaining(), /Last-without-floor remaining/u);
  assert.doesNotMatch(app.groupsWithoutFloorCount(), /Groups-without-floor remaining/u);
  assert.doesNotMatch(app.groupsWithoutFloorCount(), /Last-without-floor remaining/u);
  assert.doesNotMatch(app.groupsWithoutFloorCount(), /First-without-floor remaining/u);
  assert.doesNotMatch(app.groupsWithoutFloorRemaining(), /First group without a support floor/u);
  assert.doesNotMatch(app.groupsWithoutFloorRemaining(), /Last group without a support floor/u);
  assert.doesNotMatch(app.groupsWithoutFloorRemaining(), /Remaining change-budget/u);
  assert.doesNotMatch(app.groupsWithoutFloorRemaining(), /Students/u);
  assert.doesNotMatch(app.lastGroupWithoutFloorRemaining(), /Students/u);
  assert.doesNotMatch(app.lastGroupWithoutFloorRemaining(), /P&amp;C/u);
  assert.doesNotMatch(app.firstGroupWithoutFloorRemaining(), /Students/u);
  assert.doesNotMatch(app.firstGroupWithoutFloorRemaining(), /P&amp;C/u);
  assert.doesNotMatch(app.firstGroupWithoutFloorCost(), /Students/u);
  assert.doesNotMatch(app.firstGroupWithoutFloorCost(), /P&amp;C/u);
  assert.doesNotMatch(app.groupsWithoutFloorCount(), /First group without a support floor/u);
  assert.doesNotMatch(app.groupsWithoutFloorCount(), /Last group without a support floor/u);
  assert.doesNotMatch(app.firstGroupWithoutFloor(), /Last group without a support floor/u);
  assert.doesNotMatch(app.lastGroupWithoutFloor(), /First group without a support floor/u);
  assert.doesNotMatch(app.title(), /BMX club hours/u);
  assert.doesNotMatch(app.title(), /Mountain bike club hours/u);
  assert.doesNotMatch(app.title(), /Cycling club hours/u);
  assert.doesNotMatch(app.title(), /Surf club hours/u);
  assert.doesNotMatch(app.title(), /Dragon boat club hours/u);
  assert.doesNotMatch(app.title(), /Kayaking club hours/u);
  assert.doesNotMatch(app.title(), /Canoeing club hours/u);
  assert.doesNotMatch(app.title(), /Sailing club hours/u);
  assert.doesNotMatch(app.title(), /Rowing club hours/u);
  assert.doesNotMatch(app.title(), /Water polo club hours/u);
  assert.doesNotMatch(app.title(), /Lacrosse club hours/u);
  assert.doesNotMatch(app.title(), /Softball club hours/u);
  assert.doesNotMatch(app.title(), /Rugby club hours/u);
  assert.doesNotMatch(app.title(), /Hockey club hours/u);
  assert.doesNotMatch(app.title(), /Soccer club hours/u);
  assert.doesNotMatch(app.title(), /Swimming club hours/u);
  assert.doesNotMatch(app.title(), /Baseball/u);
  assert.doesNotMatch(app.title(), /Volleyball club hours/u);
  assert.doesNotMatch(app.title(), /Basketball club hours/u);
  assert.doesNotMatch(app.title(), /Tennis club hours/u);
  assert.doesNotMatch(app.title(), /Cricket club hours/u);
  assert.doesNotMatch(app.title(), /Athletics club hours/u);
  assert.doesNotMatch(app.title(), /Netball training hours/u);
  assert.doesNotMatch(app.title(), /Sports day hours/u);
  assert.doesNotMatch(app.title(), /School disco hours/u);
  assert.doesNotMatch(app.title(), /Rooftop BBQ hours/u);
  assert.doesNotMatch(app.title(), /Shared laundry hours/u);
  assert.doesNotMatch(app.title(), /Community garden watering/u);
  assert.doesNotMatch(app.title(), /Hall hire hours/u);
  assert.doesNotMatch(app.title(), /Street stall lighting/u);
  assert.doesNotMatch(app.title(), /Market stall hours/u);
  assert.doesNotMatch(app.title(), /Shared bike shed/u);
  assert.doesNotMatch(app.title(), /Sports Fixture Night/u);
  assert.doesNotMatch(app.title(), /Neighbourhood Plan/u);
  assert.doesNotMatch(app.title(), /Library Quiet Hours/u);
  assert.doesNotMatch(app.clauses(), /Surf-club staging booking/u);
  assert.doesNotMatch(app.clauses(), /board-rack/u);
  assert.doesNotMatch(app.clauses(), /board-bag/u);
  assert.doesNotMatch(app.clauses(), /Velodrome staging booking/u);
  assert.doesNotMatch(app.clauses(), /bike-rack/u);
  assert.doesNotMatch(app.clauses(), /bike-box/u);
  assert.doesNotMatch(app.clauses(), /Downhill staging booking/u);
  assert.doesNotMatch(app.clauses(), /trail-gate/u);
  assert.doesNotMatch(app.clauses(), /helmet-box/u);
  assert.doesNotMatch(app.clauses(), /Trail cafe hours/u);
  assert.doesNotMatch(app.clauses(), /Pump-track booking/u);
  assert.doesNotMatch(app.clauses(), /start-gate/u);
  assert.doesNotMatch(app.clauses(), /pump-track/u);
  assert.doesNotMatch(app.clauses(), /Start-gate hours/u);
  assert.doesNotMatch(app.clauses(), /pad-box/u);
  assert.doesNotMatch(app.clauses(), /Dragon-boat staging booking/u);
  assert.doesNotMatch(app.clauses(), /drum-seat/u);
  assert.doesNotMatch(app.clauses(), /paddle-box/u);
  assert.doesNotMatch(app.clauses(), /Whitewater booking/u);
  assert.doesNotMatch(app.clauses(), /slalom/u);
  assert.doesNotMatch(app.clauses(), /spraydeck/u);
  assert.doesNotMatch(app.clauses(), /Canoe shed booking/u);
  assert.doesNotMatch(app.clauses(), /paddle pontoon/u);
  assert.doesNotMatch(app.clauses(), /Sailing jetty booking/u);
  assert.doesNotMatch(app.clauses(), /yacht-club/u);
  assert.doesNotMatch(app.clauses(), /marina/u);
  assert.doesNotMatch(app.clauses(), /Rowing pontoon booking/u);
  assert.doesNotMatch(app.clauses(), /boat-house/u);
  assert.doesNotMatch(app.clauses(), /Water polo pool booking/u);
  assert.doesNotMatch(app.clauses(), /Lacrosse field booking/u);
  assert.doesNotMatch(app.clauses(), /Softball diamond booking/u);
  assert.doesNotMatch(app.clauses(), /Outdoor pitch booking/u);
  assert.doesNotMatch(app.clauses(), /Pitch booking/u);
  assert.doesNotMatch(app.clauses(), /Goal nets/u);
  assert.doesNotMatch(app.clauses(), /Ice booking/u);
  assert.doesNotMatch(app.clauses(), /Pool open/u);
  assert.doesNotMatch(app.clauses(), /Lane lights/u);
  assert.doesNotMatch(app.groups(), /Residents/u);
  assert.doesNotMatch(app.groups(), /Building committee/u);
  assert.doesNotMatch(app.groups(), /Tenants/u);
  assert.doesNotMatch(app.groups(), /Building managers/u);
  assert.doesNotMatch(app.groups(), /Hirers/u);
  assert.doesNotMatch(app.groups(), /Hall committee/u);
});

test("cycling club hours preset loads a distinct synthetic cycling workshop", async () => {
  const app = await savedWorkbench(new Map());
  app.field("#preset-select", "cycling-club-hours");
  app.click("#load-preset");
  assert.match(app.title(), /Cycling club hours: velodrome staging booking, cafe hours, and bike-box lock-up/u);
  assert.equal(app.disabled("#export-button"), false);
  assert.doesNotMatch(app.alert(), /Fix the proposal/u);
  assert.match(app.clauses(), /Velodrome staging booking/u);
  assert.match(app.clauses(), /Cafe hours/u);
  assert.match(app.clauses(), /Bike-box lock-up/u);
  assert.match(app.clauses(), /velodrome/u);
  assert.match(app.clauses(), /bike-rack/u);
  assert.match(app.clauses(), /bike-box/u);
  assert.match(app.groups(), /Students/u);
  assert.match(app.groups(), /Neighbours/u);
  assert.match(app.groups(), /P&amp;C/u);
  assert.match(app.firstGroupWithoutFloor(), /First group without a support floor: Students/u);
  assert.match(app.lastGroupWithoutFloor(), /Last group without a support floor: P&amp;C/u);
  assert.match(app.groupsWithoutFloorCount(), /Groups without a support floor: 3/u);
  assert.match(app.groupsWithoutFloorRemaining(), /Groups-without-floor remaining: 25/u);
  assert.match(app.lastGroupWithoutFloorRemaining(), /Last-without-floor remaining: 10/u);
  assert.match(app.firstGroupWithoutFloorRemaining(), /First-without-floor remaining: 8/u);
  assert.match(app.firstGroupWithoutFloorCost(), /First-without-floor cost: 8/u);
  assert.match(app.lastGroupWithoutFloorCost(), /Last-without-floor cost: 10/u);
  assert.doesNotMatch(app.lastGroupWithoutFloorCost(), /First-without-floor cost/u);
  assert.doesNotMatch(app.lastGroupWithoutFloorCost(), /First-without-floor remaining/u);
  assert.doesNotMatch(app.lastGroupWithoutFloorCost(), /Last-without-floor remaining/u);
  assert.doesNotMatch(app.firstGroupWithoutFloorCost(), /Last-without-floor cost/u);
  assert.doesNotMatch(app.firstGroupWithoutFloorCost(), /First-without-floor remaining/u);
  assert.doesNotMatch(app.firstGroupWithoutFloorRemaining(), /First-without-floor cost/u);
  assert.doesNotMatch(app.groupsWithoutFloorRemaining(), /Groups without a support floor:/u);
  assert.doesNotMatch(app.groupsWithoutFloorRemaining(), /Last-without-floor remaining/u);
  assert.doesNotMatch(app.groupsWithoutFloorRemaining(), /First-without-floor remaining/u);
  assert.doesNotMatch(app.lastGroupWithoutFloorRemaining(), /Groups-without-floor remaining/u);
  assert.doesNotMatch(app.lastGroupWithoutFloorRemaining(), /First-without-floor remaining/u);
  assert.doesNotMatch(app.firstGroupWithoutFloorRemaining(), /Groups-without-floor remaining/u);
  assert.doesNotMatch(app.firstGroupWithoutFloorRemaining(), /Last-without-floor remaining/u);
  assert.doesNotMatch(app.groupsWithoutFloorCount(), /Groups-without-floor remaining/u);
  assert.doesNotMatch(app.groupsWithoutFloorCount(), /Last-without-floor remaining/u);
  assert.doesNotMatch(app.groupsWithoutFloorCount(), /First-without-floor remaining/u);
  assert.doesNotMatch(app.groupsWithoutFloorRemaining(), /First group without a support floor/u);
  assert.doesNotMatch(app.groupsWithoutFloorRemaining(), /Last group without a support floor/u);
  assert.doesNotMatch(app.groupsWithoutFloorRemaining(), /Remaining change-budget/u);
  assert.doesNotMatch(app.groupsWithoutFloorRemaining(), /Students/u);
  assert.doesNotMatch(app.lastGroupWithoutFloorRemaining(), /Students/u);
  assert.doesNotMatch(app.lastGroupWithoutFloorRemaining(), /P&amp;C/u);
  assert.doesNotMatch(app.firstGroupWithoutFloorRemaining(), /Students/u);
  assert.doesNotMatch(app.firstGroupWithoutFloorRemaining(), /P&amp;C/u);
  assert.doesNotMatch(app.firstGroupWithoutFloorCost(), /Students/u);
  assert.doesNotMatch(app.firstGroupWithoutFloorCost(), /P&amp;C/u);
  assert.doesNotMatch(app.lastGroupWithoutFloorCost(), /Students/u);
  assert.doesNotMatch(app.lastGroupWithoutFloorCost(), /P&amp;C/u);
  assert.doesNotMatch(app.groupsWithoutFloorCount(), /First group without a support floor/u);
  assert.doesNotMatch(app.groupsWithoutFloorCount(), /Last group without a support floor/u);
  assert.doesNotMatch(app.firstGroupWithoutFloor(), /Last group without a support floor/u);
  assert.doesNotMatch(app.lastGroupWithoutFloor(), /First group without a support floor/u);
  assert.doesNotMatch(app.title(), /BMX club hours/u);
  assert.doesNotMatch(app.title(), /Mountain bike club hours/u);
  assert.doesNotMatch(app.title(), /Triathlon club hours/u);
  assert.doesNotMatch(app.title(), /Surf club hours/u);
  assert.doesNotMatch(app.title(), /Dragon boat club hours/u);
  assert.doesNotMatch(app.title(), /Kayaking club hours/u);
  assert.doesNotMatch(app.title(), /Canoeing club hours/u);
  assert.doesNotMatch(app.title(), /Sailing club hours/u);
  assert.doesNotMatch(app.title(), /Rowing club hours/u);
  assert.doesNotMatch(app.title(), /Water polo club hours/u);
  assert.doesNotMatch(app.title(), /Lacrosse club hours/u);
  assert.doesNotMatch(app.title(), /Softball club hours/u);
  assert.doesNotMatch(app.title(), /Rugby club hours/u);
  assert.doesNotMatch(app.title(), /Hockey club hours/u);
  assert.doesNotMatch(app.title(), /Soccer club hours/u);
  assert.doesNotMatch(app.title(), /Swimming club hours/u);
  assert.doesNotMatch(app.title(), /Baseball/u);
  assert.doesNotMatch(app.title(), /Volleyball club hours/u);
  assert.doesNotMatch(app.title(), /Basketball club hours/u);
  assert.doesNotMatch(app.title(), /Tennis club hours/u);
  assert.doesNotMatch(app.title(), /Cricket club hours/u);
  assert.doesNotMatch(app.title(), /Athletics club hours/u);
  assert.doesNotMatch(app.title(), /Netball training hours/u);
  assert.doesNotMatch(app.title(), /Sports day hours/u);
  assert.doesNotMatch(app.title(), /School disco hours/u);
  assert.doesNotMatch(app.title(), /Rooftop BBQ hours/u);
  assert.doesNotMatch(app.title(), /Shared laundry hours/u);
  assert.doesNotMatch(app.title(), /Community garden watering/u);
  assert.doesNotMatch(app.title(), /Hall hire hours/u);
  assert.doesNotMatch(app.title(), /Street stall lighting/u);
  assert.doesNotMatch(app.title(), /Market stall hours/u);
  assert.doesNotMatch(app.title(), /Shared bike shed/u);
  assert.doesNotMatch(app.title(), /Sports Fixture Night/u);
  assert.doesNotMatch(app.title(), /Neighbourhood Plan/u);
  assert.doesNotMatch(app.title(), /Library Quiet Hours/u);
  assert.doesNotMatch(app.clauses(), /Triathlon staging booking/u);
  assert.doesNotMatch(app.clauses(), /transition-rack/u);
  assert.doesNotMatch(app.clauses(), /bike-bag/u);
  assert.doesNotMatch(app.clauses(), /Downhill staging booking/u);
  assert.doesNotMatch(app.clauses(), /trail-gate/u);
  assert.doesNotMatch(app.clauses(), /helmet-box/u);
  assert.doesNotMatch(app.clauses(), /Trail cafe hours/u);
  assert.doesNotMatch(app.clauses(), /Pump-track booking/u);
  assert.doesNotMatch(app.clauses(), /start-gate/u);
  assert.doesNotMatch(app.clauses(), /pump-track/u);
  assert.doesNotMatch(app.clauses(), /Start-gate hours/u);
  assert.doesNotMatch(app.clauses(), /pad-box/u);
  assert.doesNotMatch(app.clauses(), /Surf-club staging booking/u);
  assert.doesNotMatch(app.clauses(), /board-rack/u);
  assert.doesNotMatch(app.clauses(), /board-bag/u);
  assert.doesNotMatch(app.clauses(), /Dragon-boat staging booking/u);
  assert.doesNotMatch(app.clauses(), /drum-seat/u);
  assert.doesNotMatch(app.clauses(), /paddle-box/u);
  assert.doesNotMatch(app.clauses(), /Whitewater booking/u);
  assert.doesNotMatch(app.clauses(), /slalom/u);
  assert.doesNotMatch(app.clauses(), /spraydeck/u);
  assert.doesNotMatch(app.clauses(), /Canoe shed booking/u);
  assert.doesNotMatch(app.clauses(), /paddle pontoon/u);
  assert.doesNotMatch(app.clauses(), /Sailing jetty booking/u);
  assert.doesNotMatch(app.clauses(), /yacht-club/u);
  assert.doesNotMatch(app.clauses(), /marina/u);
  assert.doesNotMatch(app.clauses(), /Rowing pontoon booking/u);
  assert.doesNotMatch(app.clauses(), /boat-house/u);
  assert.doesNotMatch(app.clauses(), /Water polo pool booking/u);
  assert.doesNotMatch(app.clauses(), /Lacrosse field booking/u);
  assert.doesNotMatch(app.clauses(), /Softball diamond booking/u);
  assert.doesNotMatch(app.clauses(), /Outdoor pitch booking/u);
  assert.doesNotMatch(app.clauses(), /Pitch booking/u);
  assert.doesNotMatch(app.clauses(), /Goal nets/u);
  assert.doesNotMatch(app.clauses(), /Ice booking/u);
  assert.doesNotMatch(app.clauses(), /Pool open/u);
  assert.doesNotMatch(app.clauses(), /Lane lights/u);
  assert.doesNotMatch(app.groups(), /Residents/u);
  assert.doesNotMatch(app.groups(), /Building committee/u);
  assert.doesNotMatch(app.groups(), /Tenants/u);
  assert.doesNotMatch(app.groups(), /Building managers/u);
  assert.doesNotMatch(app.groups(), /Hirers/u);
  assert.doesNotMatch(app.groups(), /Hall committee/u);
});

test("mountain bike club hours preset loads a distinct synthetic mountain-bike workshop", async () => {
  const app = await savedWorkbench(new Map());
  app.field("#preset-select", "mountain-bike-club-hours");
  app.click("#load-preset");
  assert.match(app.title(), /Mountain bike club hours: downhill staging booking, trail cafe hours, and helmet-box lock-up/u);
  assert.equal(app.disabled("#export-button"), false);
  assert.doesNotMatch(app.alert(), /Fix the proposal/u);
  assert.match(app.clauses(), /Downhill staging booking/u);
  assert.match(app.clauses(), /Trail cafe hours/u);
  assert.match(app.clauses(), /Helmet-box lock-up/u);
  assert.match(app.clauses(), /downhill/u);
  assert.match(app.clauses(), /trail-gate/u);
  assert.match(app.clauses(), /helmet-box/u);
  assert.match(app.groups(), /Students/u);
  assert.match(app.groups(), /Neighbours/u);
  assert.match(app.groups(), /P&amp;C/u);
  assert.match(app.firstGroupWithoutFloor(), /First group without a support floor: Students/u);
  assert.match(app.lastGroupWithoutFloor(), /Last group without a support floor: P&amp;C/u);
  assert.match(app.groupsWithoutFloorCount(), /Groups without a support floor: 3/u);
  assert.match(app.groupsWithoutFloorRemaining(), /Groups-without-floor remaining: 28/u);
  assert.match(app.lastGroupWithoutFloorRemaining(), /Last-without-floor remaining: 11/u);
  assert.match(app.firstGroupWithoutFloorRemaining(), /First-without-floor remaining: 9/u);
  assert.match(app.firstGroupWithoutFloorCost(), /First-without-floor cost: 9/u);
  assert.match(app.lastGroupWithoutFloorCost(), /Last-without-floor cost: 11/u);
  assert.doesNotMatch(app.lastGroupWithoutFloorCost(), /First-without-floor cost/u);
  assert.doesNotMatch(app.lastGroupWithoutFloorCost(), /First-without-floor remaining/u);
  assert.doesNotMatch(app.lastGroupWithoutFloorCost(), /Last-without-floor remaining/u);
  assert.doesNotMatch(app.firstGroupWithoutFloorCost(), /Last-without-floor cost/u);
  assert.doesNotMatch(app.firstGroupWithoutFloorCost(), /First-without-floor remaining/u);
  assert.doesNotMatch(app.firstGroupWithoutFloorRemaining(), /First-without-floor cost/u);
  assert.doesNotMatch(app.groupsWithoutFloorRemaining(), /Groups without a support floor:/u);
  assert.doesNotMatch(app.groupsWithoutFloorRemaining(), /Last-without-floor remaining/u);
  assert.doesNotMatch(app.groupsWithoutFloorRemaining(), /First-without-floor remaining/u);
  assert.doesNotMatch(app.lastGroupWithoutFloorRemaining(), /Groups-without-floor remaining/u);
  assert.doesNotMatch(app.lastGroupWithoutFloorRemaining(), /First-without-floor remaining/u);
  assert.doesNotMatch(app.firstGroupWithoutFloorRemaining(), /Groups-without-floor remaining/u);
  assert.doesNotMatch(app.firstGroupWithoutFloorRemaining(), /Last-without-floor remaining/u);
  assert.doesNotMatch(app.groupsWithoutFloorCount(), /Groups-without-floor remaining/u);
  assert.doesNotMatch(app.groupsWithoutFloorCount(), /Last-without-floor remaining/u);
  assert.doesNotMatch(app.groupsWithoutFloorCount(), /First-without-floor remaining/u);
  assert.doesNotMatch(app.groupsWithoutFloorRemaining(), /First group without a support floor/u);
  assert.doesNotMatch(app.groupsWithoutFloorRemaining(), /Last group without a support floor/u);
  assert.doesNotMatch(app.groupsWithoutFloorRemaining(), /Remaining change-budget/u);
  assert.doesNotMatch(app.groupsWithoutFloorRemaining(), /Students/u);
  assert.doesNotMatch(app.lastGroupWithoutFloorRemaining(), /Students/u);
  assert.doesNotMatch(app.lastGroupWithoutFloorRemaining(), /P&amp;C/u);
  assert.doesNotMatch(app.firstGroupWithoutFloorRemaining(), /Students/u);
  assert.doesNotMatch(app.firstGroupWithoutFloorRemaining(), /P&amp;C/u);
  assert.doesNotMatch(app.firstGroupWithoutFloorCost(), /Students/u);
  assert.doesNotMatch(app.firstGroupWithoutFloorCost(), /P&amp;C/u);
  assert.doesNotMatch(app.lastGroupWithoutFloorCost(), /Students/u);
  assert.doesNotMatch(app.lastGroupWithoutFloorCost(), /P&amp;C/u);
  assert.doesNotMatch(app.groupsWithoutFloorCount(), /First group without a support floor/u);
  assert.doesNotMatch(app.groupsWithoutFloorCount(), /Last group without a support floor/u);
  assert.doesNotMatch(app.firstGroupWithoutFloor(), /Last group without a support floor/u);
  assert.doesNotMatch(app.lastGroupWithoutFloor(), /First group without a support floor/u);
  assert.doesNotMatch(app.title(), /BMX club hours/u);
  assert.doesNotMatch(app.title(), /Cyclo-cross club hours/u);
  assert.doesNotMatch(app.title(), /Track cycling club hours/u);
  assert.doesNotMatch(app.title(), /Gravel cycling club hours/u);
  assert.doesNotMatch(app.title(), /Road cycling club hours/u);
  assert.doesNotMatch(app.title(), /Cycling club hours/u);
  assert.doesNotMatch(app.title(), /Triathlon club hours/u);
  assert.doesNotMatch(app.title(), /Surf club hours/u);
  assert.doesNotMatch(app.title(), /Dragon boat club hours/u);
  assert.doesNotMatch(app.title(), /Kayaking club hours/u);
  assert.doesNotMatch(app.title(), /Canoeing club hours/u);
  assert.doesNotMatch(app.title(), /Sailing club hours/u);
  assert.doesNotMatch(app.title(), /Rowing club hours/u);
  assert.doesNotMatch(app.title(), /Water polo club hours/u);
  assert.doesNotMatch(app.title(), /Lacrosse club hours/u);
  assert.doesNotMatch(app.title(), /Softball club hours/u);
  assert.doesNotMatch(app.title(), /Rugby club hours/u);
  assert.doesNotMatch(app.title(), /Hockey club hours/u);
  assert.doesNotMatch(app.title(), /Soccer club hours/u);
  assert.doesNotMatch(app.title(), /Swimming club hours/u);
  assert.doesNotMatch(app.title(), /Baseball/u);
  assert.doesNotMatch(app.title(), /Volleyball club hours/u);
  assert.doesNotMatch(app.title(), /Basketball club hours/u);
  assert.doesNotMatch(app.title(), /Tennis club hours/u);
  assert.doesNotMatch(app.title(), /Cricket club hours/u);
  assert.doesNotMatch(app.title(), /Athletics club hours/u);
  assert.doesNotMatch(app.title(), /Netball training hours/u);
  assert.doesNotMatch(app.title(), /Sports day hours/u);
  assert.doesNotMatch(app.title(), /School disco hours/u);
  assert.doesNotMatch(app.title(), /Rooftop BBQ hours/u);
  assert.doesNotMatch(app.title(), /Shared laundry hours/u);
  assert.doesNotMatch(app.title(), /Community garden watering/u);
  assert.doesNotMatch(app.title(), /Hall hire hours/u);
  assert.doesNotMatch(app.title(), /Street stall lighting/u);
  assert.doesNotMatch(app.title(), /Market stall hours/u);
  assert.doesNotMatch(app.title(), /Shared bike shed/u);
  assert.doesNotMatch(app.title(), /Sports Fixture Night/u);
  assert.doesNotMatch(app.title(), /Neighbourhood Plan/u);
  assert.doesNotMatch(app.title(), /Library Quiet Hours/u);
  assert.doesNotMatch(app.clauses(), /Velodrome staging booking/u);
  assert.doesNotMatch(app.clauses(), /bike-rack/u);
  assert.doesNotMatch(app.clauses(), /bike-box/u);
  assert.doesNotMatch(app.clauses(), /Pump-track booking/u);
  assert.doesNotMatch(app.clauses(), /start-gate/u);
  assert.doesNotMatch(app.clauses(), /pump-track/u);
  assert.doesNotMatch(app.clauses(), /Start-gate hours/u);
  assert.doesNotMatch(app.clauses(), /pad-box/u);
  assert.doesNotMatch(app.clauses(), /Cyclo-cross course booking/u);
  assert.doesNotMatch(app.clauses(), /start-grid/u);
  assert.doesNotMatch(app.clauses(), /pit-box/u);
  assert.doesNotMatch(app.clauses(), /Gravel course booking/u);
  assert.doesNotMatch(app.clauses(), /feed-zone/u);
  assert.doesNotMatch(app.clauses(), /drop-bag/u);
  assert.doesNotMatch(app.clauses(), /Road course booking/u);
  assert.doesNotMatch(app.clauses(), /feed-station/u);
  assert.doesNotMatch(app.clauses(), /wheel-bag/u);
  assert.doesNotMatch(app.clauses(), /Triathlon staging booking/u);
  assert.doesNotMatch(app.clauses(), /transition-rack/u);
  assert.doesNotMatch(app.clauses(), /bike-bag/u);
  assert.doesNotMatch(app.clauses(), /Surf-club staging booking/u);
  assert.doesNotMatch(app.clauses(), /board-rack/u);
  assert.doesNotMatch(app.clauses(), /board-bag/u);
  assert.doesNotMatch(app.clauses(), /Dragon-boat staging booking/u);
  assert.doesNotMatch(app.clauses(), /drum-seat/u);
  assert.doesNotMatch(app.clauses(), /paddle-box/u);
  assert.doesNotMatch(app.clauses(), /Whitewater booking/u);
  assert.doesNotMatch(app.clauses(), /slalom/u);
  assert.doesNotMatch(app.clauses(), /spraydeck/u);
  assert.doesNotMatch(app.clauses(), /Canoe shed booking/u);
  assert.doesNotMatch(app.clauses(), /paddle pontoon/u);
  assert.doesNotMatch(app.clauses(), /Sailing jetty booking/u);
  assert.doesNotMatch(app.clauses(), /yacht-club/u);
  assert.doesNotMatch(app.clauses(), /marina/u);
  assert.doesNotMatch(app.clauses(), /Rowing pontoon booking/u);
  assert.doesNotMatch(app.clauses(), /boat-house/u);
  assert.doesNotMatch(app.clauses(), /Water polo pool booking/u);
  assert.doesNotMatch(app.clauses(), /Lacrosse field booking/u);
  assert.doesNotMatch(app.clauses(), /Softball diamond booking/u);
  assert.doesNotMatch(app.clauses(), /Outdoor pitch booking/u);
  assert.doesNotMatch(app.clauses(), /Pitch booking/u);
  assert.doesNotMatch(app.clauses(), /Goal nets/u);
  assert.doesNotMatch(app.clauses(), /Ice booking/u);
  assert.doesNotMatch(app.clauses(), /Pool open/u);
  assert.doesNotMatch(app.clauses(), /Lane lights/u);
  assert.doesNotMatch(app.groups(), /Residents/u);
  assert.doesNotMatch(app.groups(), /Building committee/u);
  assert.doesNotMatch(app.groups(), /Tenants/u);
  assert.doesNotMatch(app.groups(), /Building managers/u);
  assert.doesNotMatch(app.groups(), /Hirers/u);
  assert.doesNotMatch(app.groups(), /Hall committee/u);
});

test("BMX club hours preset loads a distinct synthetic BMX workshop", async () => {
  const app = await savedWorkbench(new Map());
  app.field("#preset-select", "bmx-club-hours");
  app.click("#load-preset");
  assert.match(app.title(), /BMX club hours: pump-track booking, start-gate hours, and pad-box lock-up/u);
  assert.equal(app.disabled("#export-button"), false);
  assert.doesNotMatch(app.alert(), /Fix the proposal/u);
  assert.match(app.clauses(), /Pump-track booking/u);
  assert.match(app.clauses(), /Start-gate hours/u);
  assert.match(app.clauses(), /Pad-box lock-up/u);
  assert.match(app.clauses(), /pump-track/u);
  assert.match(app.clauses(), /start-gate/u);
  assert.match(app.clauses(), /pad-box/u);
  assert.match(app.clauses(), /11:20/u);
  assert.match(app.clauses(), /18:05/u);
  assert.match(app.clauses(), /09:15/u);
  assert.match(app.clauses(), /19:50/u);
  assert.match(app.clauses(), /14:25/u);
  assert.match(app.clauses(), /20:05/u);
  assert.match(app.clauses(), /marshals/u);
  assert.match(app.groups(), /Students/u);
  assert.match(app.groups(), /Neighbours/u);
  assert.match(app.groups(), /P&amp;C/u);
  assert.match(app.firstGroupWithoutFloor(), /First group without a support floor: Students/u);
  assert.match(app.lastGroupWithoutFloor(), /Last group without a support floor: P&amp;C/u);
  assert.match(app.groupsWithoutFloorCount(), /Groups without a support floor: 3/u);
  assert.match(app.groupsWithoutFloorRemaining(), /Groups-without-floor remaining: 31/u);
  assert.match(app.lastGroupWithoutFloorRemaining(), /Last-without-floor remaining: 12/u);
  assert.match(app.firstGroupWithoutFloorRemaining(), /First-without-floor remaining: 10/u);
  assert.match(app.firstGroupWithoutFloorCost(), /First-without-floor cost: 10/u);
  assert.match(app.lastGroupWithoutFloorCost(), /Last-without-floor cost: 12/u);
  assert.doesNotMatch(app.lastGroupWithoutFloorCost(), /First-without-floor cost/u);
  assert.doesNotMatch(app.lastGroupWithoutFloorCost(), /First-without-floor remaining/u);
  assert.doesNotMatch(app.lastGroupWithoutFloorCost(), /Last-without-floor remaining/u);
  assert.doesNotMatch(app.firstGroupWithoutFloorCost(), /Last-without-floor cost/u);
  assert.doesNotMatch(app.firstGroupWithoutFloorCost(), /First-without-floor remaining/u);
  assert.doesNotMatch(app.firstGroupWithoutFloorRemaining(), /First-without-floor cost/u);
  assert.doesNotMatch(app.groupsWithoutFloorRemaining(), /Groups without a support floor:/u);
  assert.doesNotMatch(app.groupsWithoutFloorRemaining(), /Last-without-floor remaining/u);
  assert.doesNotMatch(app.groupsWithoutFloorRemaining(), /First-without-floor remaining/u);
  assert.doesNotMatch(app.lastGroupWithoutFloorRemaining(), /Groups-without-floor remaining/u);
  assert.doesNotMatch(app.lastGroupWithoutFloorRemaining(), /First-without-floor remaining/u);
  assert.doesNotMatch(app.firstGroupWithoutFloorRemaining(), /Groups-without-floor remaining/u);
  assert.doesNotMatch(app.firstGroupWithoutFloorRemaining(), /Last-without-floor remaining/u);
  assert.doesNotMatch(app.groupsWithoutFloorCount(), /Groups-without-floor remaining/u);
  assert.doesNotMatch(app.groupsWithoutFloorCount(), /Last-without-floor remaining/u);
  assert.doesNotMatch(app.groupsWithoutFloorCount(), /First-without-floor remaining/u);
  assert.doesNotMatch(app.groupsWithoutFloorRemaining(), /First group without a support floor/u);
  assert.doesNotMatch(app.groupsWithoutFloorRemaining(), /Last group without a support floor/u);
  assert.doesNotMatch(app.groupsWithoutFloorRemaining(), /Remaining change-budget/u);
  assert.doesNotMatch(app.groupsWithoutFloorRemaining(), /Students/u);
  assert.doesNotMatch(app.lastGroupWithoutFloorRemaining(), /Students/u);
  assert.doesNotMatch(app.lastGroupWithoutFloorRemaining(), /P&amp;C/u);
  assert.doesNotMatch(app.firstGroupWithoutFloorRemaining(), /Students/u);
  assert.doesNotMatch(app.firstGroupWithoutFloorRemaining(), /P&amp;C/u);
  assert.doesNotMatch(app.firstGroupWithoutFloorCost(), /Students/u);
  assert.doesNotMatch(app.firstGroupWithoutFloorCost(), /P&amp;C/u);
  assert.doesNotMatch(app.lastGroupWithoutFloorCost(), /Students/u);
  assert.doesNotMatch(app.lastGroupWithoutFloorCost(), /P&amp;C/u);
  assert.doesNotMatch(app.groupsWithoutFloorCount(), /First group without a support floor/u);
  assert.doesNotMatch(app.groupsWithoutFloorCount(), /Last group without a support floor/u);
  assert.doesNotMatch(app.firstGroupWithoutFloor(), /Last group without a support floor/u);
  assert.doesNotMatch(app.lastGroupWithoutFloor(), /First group without a support floor/u);
  assert.doesNotMatch(app.title(), /Mountain bike club hours/u);
  assert.doesNotMatch(app.title(), /Cyclo-cross club hours/u);
  assert.doesNotMatch(app.title(), /Track cycling club hours/u);
  assert.doesNotMatch(app.title(), /Gravel cycling club hours/u);
  assert.doesNotMatch(app.title(), /Road cycling club hours/u);
  assert.doesNotMatch(app.title(), /Cycling club hours/u);
  assert.doesNotMatch(app.title(), /Triathlon club hours/u);
  assert.doesNotMatch(app.title(), /Surf club hours/u);
  assert.doesNotMatch(app.title(), /Dragon boat club hours/u);
  assert.doesNotMatch(app.title(), /Kayaking club hours/u);
  assert.doesNotMatch(app.title(), /Canoeing club hours/u);
  assert.doesNotMatch(app.title(), /Sailing club hours/u);
  assert.doesNotMatch(app.title(), /Rowing club hours/u);
  assert.doesNotMatch(app.title(), /Water polo club hours/u);
  assert.doesNotMatch(app.title(), /Lacrosse club hours/u);
  assert.doesNotMatch(app.title(), /Softball club hours/u);
  assert.doesNotMatch(app.title(), /Rugby club hours/u);
  assert.doesNotMatch(app.title(), /Hockey club hours/u);
  assert.doesNotMatch(app.title(), /Soccer club hours/u);
  assert.doesNotMatch(app.title(), /Swimming club hours/u);
  assert.doesNotMatch(app.title(), /Baseball/u);
  assert.doesNotMatch(app.title(), /Volleyball club hours/u);
  assert.doesNotMatch(app.title(), /Basketball club hours/u);
  assert.doesNotMatch(app.title(), /Tennis club hours/u);
  assert.doesNotMatch(app.title(), /Cricket club hours/u);
  assert.doesNotMatch(app.title(), /Athletics club hours/u);
  assert.doesNotMatch(app.title(), /Netball training hours/u);
  assert.doesNotMatch(app.title(), /Sports day hours/u);
  assert.doesNotMatch(app.title(), /School disco hours/u);
  assert.doesNotMatch(app.title(), /Rooftop BBQ hours/u);
  assert.doesNotMatch(app.title(), /Shared laundry hours/u);
  assert.doesNotMatch(app.title(), /Community garden watering/u);
  assert.doesNotMatch(app.title(), /Hall hire hours/u);
  assert.doesNotMatch(app.title(), /Street stall lighting/u);
  assert.doesNotMatch(app.title(), /Market stall hours/u);
  assert.doesNotMatch(app.title(), /Shared bike shed/u);
  assert.doesNotMatch(app.title(), /Sports Fixture Night/u);
  assert.doesNotMatch(app.title(), /Neighbourhood Plan/u);
  assert.doesNotMatch(app.title(), /Library Quiet Hours/u);
  assert.doesNotMatch(app.clauses(), /Downhill staging booking/u);
  assert.doesNotMatch(app.clauses(), /trail-gate/u);
  assert.doesNotMatch(app.clauses(), /Trail cafe hours/u);
  assert.doesNotMatch(app.clauses(), /helmet-box/u);
  assert.doesNotMatch(app.clauses(), /Helmet-box lock-up/u);
  assert.doesNotMatch(app.clauses(), /Cyclo-cross course booking/u);
  assert.doesNotMatch(app.clauses(), /start-grid/u);
  assert.doesNotMatch(app.clauses(), /pit-box/u);
  assert.doesNotMatch(app.clauses(), /Sprint track booking/u);
  assert.doesNotMatch(app.clauses(), /timing-hut/u);
  assert.doesNotMatch(app.clauses(), /wheel-box/u);
  assert.doesNotMatch(app.clauses(), /Gravel course booking/u);
  assert.doesNotMatch(app.clauses(), /feed-zone/u);
  assert.doesNotMatch(app.clauses(), /drop-bag/u);
  assert.doesNotMatch(app.clauses(), /Road course booking/u);
  assert.doesNotMatch(app.clauses(), /feed-station/u);
  assert.doesNotMatch(app.clauses(), /wheel-bag/u);
  assert.doesNotMatch(app.clauses(), /Velodrome staging booking/u);
  assert.doesNotMatch(app.clauses(), /bike-rack/u);
  assert.doesNotMatch(app.clauses(), /bike-box/u);
  assert.doesNotMatch(app.clauses(), /Triathlon staging booking/u);
  assert.doesNotMatch(app.clauses(), /transition-rack/u);
  assert.doesNotMatch(app.clauses(), /bike-bag/u);
  assert.doesNotMatch(app.clauses(), /Surf-club staging booking/u);
  assert.doesNotMatch(app.clauses(), /board-rack/u);
  assert.doesNotMatch(app.clauses(), /board-bag/u);
  assert.doesNotMatch(app.clauses(), /Dragon-boat staging booking/u);
  assert.doesNotMatch(app.clauses(), /drum-seat/u);
  assert.doesNotMatch(app.clauses(), /paddle-box/u);
  assert.doesNotMatch(app.clauses(), /Whitewater booking/u);
  assert.doesNotMatch(app.clauses(), /slalom/u);
  assert.doesNotMatch(app.clauses(), /spraydeck/u);
  assert.doesNotMatch(app.clauses(), /Canoe shed booking/u);
  assert.doesNotMatch(app.clauses(), /paddle pontoon/u);
  assert.doesNotMatch(app.clauses(), /Sailing jetty booking/u);
  assert.doesNotMatch(app.clauses(), /yacht-club/u);
  assert.doesNotMatch(app.clauses(), /marina/u);
  assert.doesNotMatch(app.clauses(), /Rowing pontoon booking/u);
  assert.doesNotMatch(app.clauses(), /boat-house/u);
  assert.doesNotMatch(app.clauses(), /Water polo pool booking/u);
  assert.doesNotMatch(app.clauses(), /Lacrosse field booking/u);
  assert.doesNotMatch(app.clauses(), /Softball diamond booking/u);
  assert.doesNotMatch(app.clauses(), /Outdoor pitch booking/u);
  assert.doesNotMatch(app.clauses(), /Pitch booking/u);
  assert.doesNotMatch(app.clauses(), /Goal nets/u);
  assert.doesNotMatch(app.clauses(), /Ice booking/u);
  assert.doesNotMatch(app.clauses(), /Pool open/u);
  assert.doesNotMatch(app.clauses(), /Lane lights/u);
  assert.doesNotMatch(app.groups(), /Residents/u);
  assert.doesNotMatch(app.groups(), /Building committee/u);
  assert.doesNotMatch(app.groups(), /Tenants/u);
  assert.doesNotMatch(app.groups(), /Building managers/u);
  assert.doesNotMatch(app.groups(), /Hirers/u);
  assert.doesNotMatch(app.groups(), /Hall committee/u);
});

test("cyclo-cross club hours preset loads a distinct synthetic cyclo-cross workshop", async () => {
  const pkg = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"));
  assert.equal(pkg.version, "1.5.41");
  const app = await savedWorkbench(new Map());
  app.field("#preset-select", "cyclo-cross-club-hours");
  app.click("#load-preset");
  assert.match(app.title(), /Cyclo-cross club hours: cyclo-cross course booking, start-grid hours, and pit-box lock-up/u);
  assert.equal(app.disabled("#export-button"), false);
  assert.doesNotMatch(app.alert(), /Fix the proposal/u);
  assert.match(app.clauses(), /Cyclo-cross course booking/u);
  assert.match(app.clauses(), /Start-grid hours/u);
  assert.match(app.clauses(), /Pit-box lock-up/u);
  assert.match(app.clauses(), /cyclo-cross/u);
  assert.match(app.clauses(), /start-grid/u);
  assert.match(app.clauses(), /pit-box/u);
  assert.match(app.clauses(), /10:40/u);
  assert.match(app.clauses(), /16:50/u);
  assert.match(app.clauses(), /08:05/u);
  assert.match(app.clauses(), /18:15/u);
  assert.match(app.clauses(), /13:30/u);
  assert.match(app.clauses(), /19:55/u);
  assert.match(app.clauses(), /marshals/u);
  assert.match(app.groups(), /Students/u);
  assert.match(app.groups(), /Neighbours/u);
  assert.match(app.groups(), /P&amp;C/u);
  assert.match(app.firstGroupWithoutFloor(), /First group without a support floor: Students/u);
  assert.match(app.lastGroupWithoutFloor(), /Last group without a support floor: P&amp;C/u);
  assert.match(app.groupsWithoutFloorCount(), /Groups without a support floor: 3/u);
  assert.match(app.groupsWithoutFloorRemaining(), /Groups-without-floor remaining: 34/u);
  assert.match(app.lastGroupWithoutFloorRemaining(), /Last-without-floor remaining: 13/u);
  assert.match(app.firstGroupWithoutFloorRemaining(), /First-without-floor remaining: 11/u);
  assert.match(app.firstGroupWithoutFloorCost(), /First-without-floor cost: 11/u);
  assert.match(app.lastGroupWithoutFloorCost(), /Last-without-floor cost: 13/u);
  assert.doesNotMatch(app.lastGroupWithoutFloorCost(), /First-without-floor cost/u);
  assert.doesNotMatch(app.lastGroupWithoutFloorCost(), /First-without-floor remaining/u);
  assert.doesNotMatch(app.lastGroupWithoutFloorCost(), /Last-without-floor remaining/u);
  assert.doesNotMatch(app.firstGroupWithoutFloorCost(), /Last-without-floor cost/u);
  assert.doesNotMatch(app.firstGroupWithoutFloorCost(), /First-without-floor remaining/u);
  assert.doesNotMatch(app.firstGroupWithoutFloorRemaining(), /First-without-floor cost/u);
  assert.doesNotMatch(app.groupsWithoutFloorRemaining(), /Groups without a support floor:/u);
  assert.doesNotMatch(app.groupsWithoutFloorRemaining(), /Last-without-floor remaining/u);
  assert.doesNotMatch(app.groupsWithoutFloorRemaining(), /First-without-floor remaining/u);
  assert.doesNotMatch(app.lastGroupWithoutFloorRemaining(), /Groups-without-floor remaining/u);
  assert.doesNotMatch(app.lastGroupWithoutFloorRemaining(), /First-without-floor remaining/u);
  assert.doesNotMatch(app.firstGroupWithoutFloorRemaining(), /Groups-without-floor remaining/u);
  assert.doesNotMatch(app.firstGroupWithoutFloorRemaining(), /Last-without-floor remaining/u);
  assert.doesNotMatch(app.groupsWithoutFloorCount(), /Groups-without-floor remaining/u);
  assert.doesNotMatch(app.groupsWithoutFloorCount(), /Last-without-floor remaining/u);
  assert.doesNotMatch(app.groupsWithoutFloorCount(), /First-without-floor remaining/u);
  assert.doesNotMatch(app.groupsWithoutFloorRemaining(), /First group without a support floor/u);
  assert.doesNotMatch(app.groupsWithoutFloorRemaining(), /Last group without a support floor/u);
  assert.doesNotMatch(app.groupsWithoutFloorRemaining(), /Remaining change-budget/u);
  assert.doesNotMatch(app.groupsWithoutFloorRemaining(), /Students/u);
  assert.doesNotMatch(app.lastGroupWithoutFloorRemaining(), /Students/u);
  assert.doesNotMatch(app.lastGroupWithoutFloorRemaining(), /P&amp;C/u);
  assert.doesNotMatch(app.firstGroupWithoutFloorRemaining(), /Students/u);
  assert.doesNotMatch(app.firstGroupWithoutFloorRemaining(), /P&amp;C/u);
  assert.doesNotMatch(app.firstGroupWithoutFloorCost(), /Students/u);
  assert.doesNotMatch(app.firstGroupWithoutFloorCost(), /P&amp;C/u);
  assert.doesNotMatch(app.lastGroupWithoutFloorCost(), /Students/u);
  assert.doesNotMatch(app.lastGroupWithoutFloorCost(), /P&amp;C/u);
  assert.doesNotMatch(app.groupsWithoutFloorCount(), /First group without a support floor/u);
  assert.doesNotMatch(app.groupsWithoutFloorCount(), /Last group without a support floor/u);
  assert.doesNotMatch(app.firstGroupWithoutFloor(), /Last group without a support floor/u);
  assert.doesNotMatch(app.lastGroupWithoutFloor(), /First group without a support floor/u);
  assert.doesNotMatch(app.title(), /Track cycling club hours/u);
  assert.doesNotMatch(app.title(), /Gravel cycling club hours/u);
  assert.doesNotMatch(app.title(), /Road cycling club hours/u);
  assert.doesNotMatch(app.title(), /BMX club hours/u);
  assert.doesNotMatch(app.title(), /Mountain bike club hours/u);
  assert.doesNotMatch(app.title(), /Cycling club hours/u);
  assert.doesNotMatch(app.title(), /Triathlon club hours/u);
  assert.doesNotMatch(app.title(), /Surf club hours/u);
  assert.doesNotMatch(app.title(), /Dragon boat club hours/u);
  assert.doesNotMatch(app.title(), /Kayaking club hours/u);
  assert.doesNotMatch(app.title(), /Canoeing club hours/u);
  assert.doesNotMatch(app.title(), /Sailing club hours/u);
  assert.doesNotMatch(app.title(), /Rowing club hours/u);
  assert.doesNotMatch(app.title(), /Water polo club hours/u);
  assert.doesNotMatch(app.title(), /Lacrosse club hours/u);
  assert.doesNotMatch(app.title(), /Softball club hours/u);
  assert.doesNotMatch(app.title(), /Rugby club hours/u);
  assert.doesNotMatch(app.title(), /Hockey club hours/u);
  assert.doesNotMatch(app.title(), /Soccer club hours/u);
  assert.doesNotMatch(app.title(), /Swimming club hours/u);
  assert.doesNotMatch(app.title(), /Baseball/u);
  assert.doesNotMatch(app.title(), /Volleyball club hours/u);
  assert.doesNotMatch(app.title(), /Basketball club hours/u);
  assert.doesNotMatch(app.title(), /Tennis club hours/u);
  assert.doesNotMatch(app.title(), /Cricket club hours/u);
  assert.doesNotMatch(app.title(), /Athletics club hours/u);
  assert.doesNotMatch(app.title(), /Netball training hours/u);
  assert.doesNotMatch(app.title(), /Sports day hours/u);
  assert.doesNotMatch(app.title(), /School disco hours/u);
  assert.doesNotMatch(app.title(), /Rooftop BBQ hours/u);
  assert.doesNotMatch(app.title(), /Shared laundry hours/u);
  assert.doesNotMatch(app.title(), /Community garden watering/u);
  assert.doesNotMatch(app.title(), /Hall hire hours/u);
  assert.doesNotMatch(app.title(), /Street stall lighting/u);
  assert.doesNotMatch(app.title(), /Market stall hours/u);
  assert.doesNotMatch(app.title(), /Shared bike shed/u);
  assert.doesNotMatch(app.title(), /Sports Fixture Night/u);
  assert.doesNotMatch(app.title(), /Neighbourhood Plan/u);
  assert.doesNotMatch(app.title(), /Library Quiet Hours/u);
  assert.doesNotMatch(app.clauses(), /Pump-track booking/u);
  assert.doesNotMatch(app.clauses(), /start-gate/u);
  assert.doesNotMatch(app.clauses(), /pump-track/u);
  assert.doesNotMatch(app.clauses(), /Start-gate hours/u);
  assert.doesNotMatch(app.clauses(), /pad-box/u);
  assert.doesNotMatch(app.clauses(), /Pad-box lock-up/u);
  assert.doesNotMatch(app.clauses(), /Downhill staging booking/u);
  assert.doesNotMatch(app.clauses(), /trail-gate/u);
  assert.doesNotMatch(app.clauses(), /Trail cafe hours/u);
  assert.doesNotMatch(app.clauses(), /helmet-box/u);
  assert.doesNotMatch(app.clauses(), /Helmet-box lock-up/u);
  assert.doesNotMatch(app.clauses(), /Sprint track booking/u);
  assert.doesNotMatch(app.clauses(), /timing-hut/u);
  assert.doesNotMatch(app.clauses(), /wheel-box/u);
  assert.doesNotMatch(app.clauses(), /Gravel course booking/u);
  assert.doesNotMatch(app.clauses(), /feed-zone/u);
  assert.doesNotMatch(app.clauses(), /drop-bag/u);
  assert.doesNotMatch(app.clauses(), /Road course booking/u);
  assert.doesNotMatch(app.clauses(), /feed-station/u);
  assert.doesNotMatch(app.clauses(), /wheel-bag/u);
  assert.doesNotMatch(app.clauses(), /Velodrome staging booking/u);
  assert.doesNotMatch(app.clauses(), /bike-rack/u);
  assert.doesNotMatch(app.clauses(), /bike-box/u);
  assert.doesNotMatch(app.clauses(), /Triathlon staging booking/u);
  assert.doesNotMatch(app.clauses(), /transition-rack/u);
  assert.doesNotMatch(app.clauses(), /bike-bag/u);
  assert.doesNotMatch(app.clauses(), /Surf-club staging booking/u);
  assert.doesNotMatch(app.clauses(), /board-rack/u);
  assert.doesNotMatch(app.clauses(), /board-bag/u);
  assert.doesNotMatch(app.clauses(), /Dragon-boat staging booking/u);
  assert.doesNotMatch(app.clauses(), /drum-seat/u);
  assert.doesNotMatch(app.clauses(), /paddle-box/u);
  assert.doesNotMatch(app.clauses(), /Whitewater booking/u);
  assert.doesNotMatch(app.clauses(), /slalom/u);
  assert.doesNotMatch(app.clauses(), /spraydeck/u);
  assert.doesNotMatch(app.clauses(), /Canoe shed booking/u);
  assert.doesNotMatch(app.clauses(), /paddle pontoon/u);
  assert.doesNotMatch(app.clauses(), /Sailing jetty booking/u);
  assert.doesNotMatch(app.clauses(), /yacht-club/u);
  assert.doesNotMatch(app.clauses(), /marina/u);
  assert.doesNotMatch(app.clauses(), /Rowing pontoon booking/u);
  assert.doesNotMatch(app.clauses(), /boat-house/u);
  assert.doesNotMatch(app.clauses(), /Water polo pool booking/u);
  assert.doesNotMatch(app.clauses(), /Lacrosse field booking/u);
  assert.doesNotMatch(app.clauses(), /Softball diamond booking/u);
  assert.doesNotMatch(app.clauses(), /Outdoor pitch booking/u);
  assert.doesNotMatch(app.clauses(), /Pitch booking/u);
  assert.doesNotMatch(app.clauses(), /Goal nets/u);
  assert.doesNotMatch(app.clauses(), /Ice booking/u);
  assert.doesNotMatch(app.clauses(), /Pool open/u);
  assert.doesNotMatch(app.clauses(), /Lane lights/u);
  assert.doesNotMatch(app.groups(), /Residents/u);
  assert.doesNotMatch(app.groups(), /Building committee/u);
  assert.doesNotMatch(app.groups(), /Tenants/u);
  assert.doesNotMatch(app.groups(), /Building managers/u);
  assert.doesNotMatch(app.groups(), /Hirers/u);
  assert.doesNotMatch(app.groups(), /Hall committee/u);
});

test("track cycling club hours preset loads a distinct synthetic track-cycling workshop", async () => {
  const pkg = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"));
  assert.equal(pkg.version, "1.5.41");
  const app = await savedWorkbench(new Map());
  app.field("#preset-select", "track-cycling-club-hours");
  app.click("#load-preset");
  assert.match(app.title(), /Track cycling club hours: sprint track booking, timing-hut hours, and wheel-box lock-up/u);
  assert.equal(app.disabled("#export-button"), false);
  assert.doesNotMatch(app.alert(), /Fix the proposal/u);
  assert.match(app.clauses(), /Sprint track booking/u);
  assert.match(app.clauses(), /Timing-hut hours/u);
  assert.match(app.clauses(), /Wheel-box lock-up/u);
  assert.match(app.clauses(), /sprint track/u);
  assert.match(app.clauses(), /timing-hut/u);
  assert.match(app.clauses(), /wheel-box/u);
  assert.match(app.clauses(), /track cycling/u);
  assert.match(app.clauses(), /09:50/u);
  assert.match(app.clauses(), /17:35/u);
  assert.match(app.clauses(), /07:25/u);
  assert.match(app.clauses(), /20:25/u);
  assert.match(app.clauses(), /12:45/u);
  assert.match(app.clauses(), /21:10/u);
  assert.match(app.clauses(), /commissaires/u);
  assert.match(app.groups(), /Students/u);
  assert.match(app.groups(), /Neighbours/u);
  assert.match(app.groups(), /P&amp;C/u);
  assert.match(app.firstGroupWithoutFloor(), /First group without a support floor: Students/u);
  assert.match(app.lastGroupWithoutFloor(), /Last group without a support floor: P&amp;C/u);
  assert.match(app.groupsWithoutFloorCount(), /Groups without a support floor: 3/u);
  assert.match(app.groupsWithoutFloorRemaining(), /Groups-without-floor remaining: 37/u);
  assert.match(app.lastGroupWithoutFloorRemaining(), /Last-without-floor remaining: 14/u);
  assert.match(app.firstGroupWithoutFloorRemaining(), /First-without-floor remaining: 12/u);
  assert.match(app.firstGroupWithoutFloorCost(), /First-without-floor cost: 12/u);
  assert.match(app.lastGroupWithoutFloorCost(), /Last-without-floor cost: 14/u);
  assert.doesNotMatch(app.lastGroupWithoutFloorCost(), /First-without-floor cost/u);
  assert.doesNotMatch(app.lastGroupWithoutFloorCost(), /First-without-floor remaining/u);
  assert.doesNotMatch(app.lastGroupWithoutFloorCost(), /Last-without-floor remaining/u);
  assert.doesNotMatch(app.firstGroupWithoutFloorCost(), /Last-without-floor cost/u);
  assert.doesNotMatch(app.firstGroupWithoutFloorCost(), /First-without-floor remaining/u);
  assert.doesNotMatch(app.firstGroupWithoutFloorRemaining(), /First-without-floor cost/u);
  assert.doesNotMatch(app.groupsWithoutFloorRemaining(), /Groups without a support floor:/u);
  assert.doesNotMatch(app.groupsWithoutFloorRemaining(), /Last-without-floor remaining/u);
  assert.doesNotMatch(app.groupsWithoutFloorRemaining(), /First-without-floor remaining/u);
  assert.doesNotMatch(app.lastGroupWithoutFloorRemaining(), /Groups-without-floor remaining/u);
  assert.doesNotMatch(app.lastGroupWithoutFloorRemaining(), /First-without-floor remaining/u);
  assert.doesNotMatch(app.firstGroupWithoutFloorRemaining(), /Groups-without-floor remaining/u);
  assert.doesNotMatch(app.firstGroupWithoutFloorRemaining(), /Last-without-floor remaining/u);
  assert.doesNotMatch(app.groupsWithoutFloorCount(), /Groups-without-floor remaining/u);
  assert.doesNotMatch(app.groupsWithoutFloorCount(), /Last-without-floor remaining/u);
  assert.doesNotMatch(app.groupsWithoutFloorCount(), /First-without-floor remaining/u);
  assert.doesNotMatch(app.groupsWithoutFloorRemaining(), /First group without a support floor/u);
  assert.doesNotMatch(app.groupsWithoutFloorRemaining(), /Last group without a support floor/u);
  assert.doesNotMatch(app.groupsWithoutFloorRemaining(), /Remaining change-budget/u);
  assert.doesNotMatch(app.groupsWithoutFloorRemaining(), /Students/u);
  assert.doesNotMatch(app.lastGroupWithoutFloorRemaining(), /Students/u);
  assert.doesNotMatch(app.lastGroupWithoutFloorRemaining(), /P&amp;C/u);
  assert.doesNotMatch(app.firstGroupWithoutFloorRemaining(), /Students/u);
  assert.doesNotMatch(app.firstGroupWithoutFloorRemaining(), /P&amp;C/u);
  assert.doesNotMatch(app.firstGroupWithoutFloorCost(), /Students/u);
  assert.doesNotMatch(app.firstGroupWithoutFloorCost(), /P&amp;C/u);
  assert.doesNotMatch(app.lastGroupWithoutFloorCost(), /Students/u);
  assert.doesNotMatch(app.lastGroupWithoutFloorCost(), /P&amp;C/u);
  assert.doesNotMatch(app.groupsWithoutFloorCount(), /First group without a support floor/u);
  assert.doesNotMatch(app.groupsWithoutFloorCount(), /Last group without a support floor/u);
  assert.doesNotMatch(app.firstGroupWithoutFloor(), /Last group without a support floor/u);
  assert.doesNotMatch(app.lastGroupWithoutFloor(), /First group without a support floor/u);
  assert.doesNotMatch(app.title(), /Cyclo-cross club hours/u);
  assert.doesNotMatch(app.title(), /Gravel cycling club hours/u);
  assert.doesNotMatch(app.title(), /Road cycling club hours/u);
  assert.doesNotMatch(app.title(), /BMX club hours/u);
  assert.doesNotMatch(app.title(), /Mountain bike club hours/u);
  assert.doesNotMatch(app.title(), /Cycling club hours/u);
  assert.doesNotMatch(app.title(), /Triathlon club hours/u);
  assert.doesNotMatch(app.title(), /Surf club hours/u);
  assert.doesNotMatch(app.title(), /Dragon boat club hours/u);
  assert.doesNotMatch(app.title(), /Kayaking club hours/u);
  assert.doesNotMatch(app.title(), /Canoeing club hours/u);
  assert.doesNotMatch(app.title(), /Sailing club hours/u);
  assert.doesNotMatch(app.title(), /Rowing club hours/u);
  assert.doesNotMatch(app.title(), /Water polo club hours/u);
  assert.doesNotMatch(app.title(), /Lacrosse club hours/u);
  assert.doesNotMatch(app.title(), /Softball club hours/u);
  assert.doesNotMatch(app.title(), /Rugby club hours/u);
  assert.doesNotMatch(app.title(), /Hockey club hours/u);
  assert.doesNotMatch(app.title(), /Soccer club hours/u);
  assert.doesNotMatch(app.title(), /Swimming club hours/u);
  assert.doesNotMatch(app.title(), /Baseball/u);
  assert.doesNotMatch(app.title(), /Volleyball club hours/u);
  assert.doesNotMatch(app.title(), /Basketball club hours/u);
  assert.doesNotMatch(app.title(), /Tennis club hours/u);
  assert.doesNotMatch(app.title(), /Cricket club hours/u);
  assert.doesNotMatch(app.title(), /Athletics club hours/u);
  assert.doesNotMatch(app.title(), /Netball training hours/u);
  assert.doesNotMatch(app.title(), /Sports day hours/u);
  assert.doesNotMatch(app.title(), /School disco hours/u);
  assert.doesNotMatch(app.title(), /Rooftop BBQ hours/u);
  assert.doesNotMatch(app.title(), /Shared laundry hours/u);
  assert.doesNotMatch(app.title(), /Community garden watering/u);
  assert.doesNotMatch(app.title(), /Hall hire hours/u);
  assert.doesNotMatch(app.title(), /Street stall lighting/u);
  assert.doesNotMatch(app.title(), /Market stall hours/u);
  assert.doesNotMatch(app.title(), /Shared bike shed/u);
  assert.doesNotMatch(app.title(), /Sports Fixture Night/u);
  assert.doesNotMatch(app.title(), /Neighbourhood Plan/u);
  assert.doesNotMatch(app.title(), /Library Quiet Hours/u);
  assert.doesNotMatch(app.clauses(), /Cyclo-cross course booking/u);
  assert.doesNotMatch(app.clauses(), /start-grid/u);
  assert.doesNotMatch(app.clauses(), /pit-box/u);
  assert.doesNotMatch(app.clauses(), /Pit-box lock-up/u);
  assert.doesNotMatch(app.clauses(), /Gravel course booking/u);
  assert.doesNotMatch(app.clauses(), /feed-zone/u);
  assert.doesNotMatch(app.clauses(), /drop-bag/u);
  assert.doesNotMatch(app.clauses(), /Road course booking/u);
  assert.doesNotMatch(app.clauses(), /feed-station/u);
  assert.doesNotMatch(app.clauses(), /wheel-bag/u);
  assert.doesNotMatch(app.clauses(), /Drop-bag lock-up/u);
  assert.doesNotMatch(app.clauses(), /Pump-track booking/u);
  assert.doesNotMatch(app.clauses(), /start-gate/u);
  assert.doesNotMatch(app.clauses(), /pump-track/u);
  assert.doesNotMatch(app.clauses(), /Start-gate hours/u);
  assert.doesNotMatch(app.clauses(), /pad-box/u);
  assert.doesNotMatch(app.clauses(), /Pad-box lock-up/u);
  assert.doesNotMatch(app.clauses(), /Downhill staging booking/u);
  assert.doesNotMatch(app.clauses(), /trail-gate/u);
  assert.doesNotMatch(app.clauses(), /Trail cafe hours/u);
  assert.doesNotMatch(app.clauses(), /helmet-box/u);
  assert.doesNotMatch(app.clauses(), /Helmet-box lock-up/u);
  assert.doesNotMatch(app.clauses(), /Velodrome staging booking/u);
  assert.doesNotMatch(app.clauses(), /bike-rack/u);
  assert.doesNotMatch(app.clauses(), /bike-box/u);
  assert.doesNotMatch(app.clauses(), /Triathlon staging booking/u);
  assert.doesNotMatch(app.clauses(), /transition-rack/u);
  assert.doesNotMatch(app.clauses(), /bike-bag/u);
  assert.doesNotMatch(app.clauses(), /Surf-club staging booking/u);
  assert.doesNotMatch(app.clauses(), /board-rack/u);
  assert.doesNotMatch(app.clauses(), /board-bag/u);
  assert.doesNotMatch(app.clauses(), /Dragon-boat staging booking/u);
  assert.doesNotMatch(app.clauses(), /drum-seat/u);
  assert.doesNotMatch(app.clauses(), /paddle-box/u);
  assert.doesNotMatch(app.clauses(), /Whitewater booking/u);
  assert.doesNotMatch(app.clauses(), /slalom/u);
  assert.doesNotMatch(app.clauses(), /spraydeck/u);
  assert.doesNotMatch(app.clauses(), /Canoe shed booking/u);
  assert.doesNotMatch(app.clauses(), /paddle pontoon/u);
  assert.doesNotMatch(app.clauses(), /Sailing jetty booking/u);
  assert.doesNotMatch(app.clauses(), /yacht-club/u);
  assert.doesNotMatch(app.clauses(), /marina/u);
  assert.doesNotMatch(app.clauses(), /Rowing pontoon booking/u);
  assert.doesNotMatch(app.clauses(), /boat-house/u);
  assert.doesNotMatch(app.clauses(), /Water polo pool booking/u);
  assert.doesNotMatch(app.clauses(), /Lacrosse field booking/u);
  assert.doesNotMatch(app.clauses(), /Softball diamond booking/u);
  assert.doesNotMatch(app.clauses(), /Outdoor pitch booking/u);
  assert.doesNotMatch(app.clauses(), /Pitch booking/u);
  assert.doesNotMatch(app.clauses(), /Goal nets/u);
  assert.doesNotMatch(app.clauses(), /Ice booking/u);
  assert.doesNotMatch(app.clauses(), /Pool open/u);
  assert.doesNotMatch(app.clauses(), /Lane lights/u);
  assert.doesNotMatch(app.groups(), /Residents/u);
  assert.doesNotMatch(app.groups(), /Building committee/u);
  assert.doesNotMatch(app.groups(), /Tenants/u);
  assert.doesNotMatch(app.groups(), /Building managers/u);
  assert.doesNotMatch(app.groups(), /Hirers/u);
  assert.doesNotMatch(app.groups(), /Hall committee/u);
});

test("gravel cycling club hours preset loads a distinct synthetic gravel-cycling workshop", async () => {
  const pkg = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"));
  assert.equal(pkg.version, "1.5.41");
  const app = await savedWorkbench(new Map());
  app.field("#preset-select", "gravel-cycling-club-hours");
  app.click("#load-preset");
  assert.match(app.title(), /Gravel cycling club hours: gravel course booking, feed-zone hours, and drop-bag lock-up/u);
  assert.equal(app.disabled("#export-button"), false);
  assert.doesNotMatch(app.alert(), /Fix the proposal/u);
  assert.match(app.clauses(), /Gravel course booking/u);
  assert.match(app.clauses(), /Feed-zone hours/u);
  assert.match(app.clauses(), /Drop-bag lock-up/u);
  assert.match(app.clauses(), /gravel course/u);
  assert.match(app.clauses(), /feed-zone/u);
  assert.match(app.clauses(), /drop-bag/u);
  assert.match(app.clauses(), /gravel cycling/u);
  assert.match(app.clauses(), /09:10/u);
  assert.match(app.clauses(), /16:20/u);
  assert.match(app.clauses(), /08:40/u);
  assert.match(app.clauses(), /19:05/u);
  assert.match(app.clauses(), /13:10/u);
  assert.match(app.clauses(), /20:40/u);
  assert.match(app.clauses(), /marshals/u);
  assert.match(app.groups(), /Students/u);
  assert.match(app.groups(), /Neighbours/u);
  assert.match(app.groups(), /P&amp;C/u);
  assert.match(app.firstGroupWithoutFloor(), /First group without a support floor: Students/u);
  assert.match(app.lastGroupWithoutFloor(), /Last group without a support floor: P&amp;C/u);
  assert.match(app.groupsWithoutFloorCount(), /Groups without a support floor: 3/u);
  assert.match(app.groupsWithoutFloorRemaining(), /Groups-without-floor remaining: 40/u);
  assert.match(app.lastGroupWithoutFloorRemaining(), /Last-without-floor remaining: 15/u);
  assert.match(app.firstGroupWithoutFloorRemaining(), /First-without-floor remaining: 13/u);
  assert.match(app.firstGroupWithoutFloorCost(), /First-without-floor cost: 13/u);
  assert.match(app.lastGroupWithoutFloorCost(), /Last-without-floor cost: 15/u);
  assert.doesNotMatch(app.lastGroupWithoutFloorCost(), /First-without-floor cost/u);
  assert.doesNotMatch(app.lastGroupWithoutFloorCost(), /First-without-floor remaining/u);
  assert.doesNotMatch(app.lastGroupWithoutFloorCost(), /Last-without-floor remaining/u);
  assert.doesNotMatch(app.firstGroupWithoutFloorCost(), /Last-without-floor cost/u);
  assert.doesNotMatch(app.firstGroupWithoutFloorCost(), /First-without-floor remaining/u);
  assert.doesNotMatch(app.firstGroupWithoutFloorRemaining(), /First-without-floor cost/u);
  assert.doesNotMatch(app.groupsWithoutFloorRemaining(), /Groups without a support floor:/u);
  assert.doesNotMatch(app.groupsWithoutFloorRemaining(), /Last-without-floor remaining/u);
  assert.doesNotMatch(app.groupsWithoutFloorRemaining(), /First-without-floor remaining/u);
  assert.doesNotMatch(app.lastGroupWithoutFloorRemaining(), /Groups-without-floor remaining/u);
  assert.doesNotMatch(app.lastGroupWithoutFloorRemaining(), /First-without-floor remaining/u);
  assert.doesNotMatch(app.firstGroupWithoutFloorRemaining(), /Groups-without-floor remaining/u);
  assert.doesNotMatch(app.firstGroupWithoutFloorRemaining(), /Last-without-floor remaining/u);
  assert.doesNotMatch(app.groupsWithoutFloorCount(), /Groups-without-floor remaining/u);
  assert.doesNotMatch(app.groupsWithoutFloorCount(), /Last-without-floor remaining/u);
  assert.doesNotMatch(app.groupsWithoutFloorCount(), /First-without-floor remaining/u);
  assert.doesNotMatch(app.groupsWithoutFloorRemaining(), /First group without a support floor/u);
  assert.doesNotMatch(app.groupsWithoutFloorRemaining(), /Last group without a support floor/u);
  assert.doesNotMatch(app.groupsWithoutFloorRemaining(), /Remaining change-budget/u);
  assert.doesNotMatch(app.groupsWithoutFloorRemaining(), /Students/u);
  assert.doesNotMatch(app.lastGroupWithoutFloorRemaining(), /Students/u);
  assert.doesNotMatch(app.lastGroupWithoutFloorRemaining(), /P&amp;C/u);
  assert.doesNotMatch(app.firstGroupWithoutFloorRemaining(), /Students/u);
  assert.doesNotMatch(app.firstGroupWithoutFloorRemaining(), /P&amp;C/u);
  assert.doesNotMatch(app.firstGroupWithoutFloorCost(), /Students/u);
  assert.doesNotMatch(app.firstGroupWithoutFloorCost(), /P&amp;C/u);
  assert.doesNotMatch(app.lastGroupWithoutFloorCost(), /Students/u);
  assert.doesNotMatch(app.lastGroupWithoutFloorCost(), /P&amp;C/u);
  assert.doesNotMatch(app.groupsWithoutFloorCount(), /First group without a support floor/u);
  assert.doesNotMatch(app.groupsWithoutFloorCount(), /Last group without a support floor/u);
  assert.doesNotMatch(app.firstGroupWithoutFloor(), /Last group without a support floor/u);
  assert.doesNotMatch(app.lastGroupWithoutFloor(), /First group without a support floor/u);
  assert.doesNotMatch(app.title(), /Track cycling club hours/u);
  assert.doesNotMatch(app.title(), /Cyclo-cross club hours/u);
  assert.doesNotMatch(app.title(), /Road cycling club hours/u);
  assert.doesNotMatch(app.title(), /BMX club hours/u);
  assert.doesNotMatch(app.title(), /Mountain bike club hours/u);
  assert.doesNotMatch(app.title(), /Cycling club hours/u);
  assert.doesNotMatch(app.title(), /Triathlon club hours/u);
  assert.doesNotMatch(app.title(), /Surf club hours/u);
  assert.doesNotMatch(app.title(), /Dragon boat club hours/u);
  assert.doesNotMatch(app.title(), /Kayaking club hours/u);
  assert.doesNotMatch(app.title(), /Canoeing club hours/u);
  assert.doesNotMatch(app.title(), /Sailing club hours/u);
  assert.doesNotMatch(app.title(), /Rowing club hours/u);
  assert.doesNotMatch(app.title(), /Water polo club hours/u);
  assert.doesNotMatch(app.title(), /Lacrosse club hours/u);
  assert.doesNotMatch(app.title(), /Softball club hours/u);
  assert.doesNotMatch(app.title(), /Rugby club hours/u);
  assert.doesNotMatch(app.title(), /Hockey club hours/u);
  assert.doesNotMatch(app.title(), /Soccer club hours/u);
  assert.doesNotMatch(app.title(), /Swimming club hours/u);
  assert.doesNotMatch(app.title(), /Baseball/u);
  assert.doesNotMatch(app.title(), /Volleyball club hours/u);
  assert.doesNotMatch(app.title(), /Basketball club hours/u);
  assert.doesNotMatch(app.title(), /Tennis club hours/u);
  assert.doesNotMatch(app.title(), /Cricket club hours/u);
  assert.doesNotMatch(app.title(), /Athletics club hours/u);
  assert.doesNotMatch(app.title(), /Netball training hours/u);
  assert.doesNotMatch(app.title(), /Sports day hours/u);
  assert.doesNotMatch(app.title(), /School disco hours/u);
  assert.doesNotMatch(app.title(), /Rooftop BBQ hours/u);
  assert.doesNotMatch(app.title(), /Shared laundry hours/u);
  assert.doesNotMatch(app.title(), /Community garden watering/u);
  assert.doesNotMatch(app.title(), /Hall hire hours/u);
  assert.doesNotMatch(app.title(), /Street stall lighting/u);
  assert.doesNotMatch(app.title(), /Market stall hours/u);
  assert.doesNotMatch(app.title(), /Shared bike shed/u);
  assert.doesNotMatch(app.title(), /Sports Fixture Night/u);
  assert.doesNotMatch(app.title(), /Neighbourhood Plan/u);
  assert.doesNotMatch(app.title(), /Library Quiet Hours/u);
  assert.doesNotMatch(app.clauses(), /Sprint track booking/u);
  assert.doesNotMatch(app.clauses(), /timing-hut/u);
  assert.doesNotMatch(app.clauses(), /wheel-box/u);
  assert.doesNotMatch(app.clauses(), /Wheel-box lock-up/u);
  assert.doesNotMatch(app.clauses(), /Road course booking/u);
  assert.doesNotMatch(app.clauses(), /feed-station/u);
  assert.doesNotMatch(app.clauses(), /wheel-bag/u);
  assert.doesNotMatch(app.clauses(), /Wheel-bag lock-up/u);
  assert.doesNotMatch(app.clauses(), /soigneurs/u);
  assert.doesNotMatch(app.clauses(), /Cyclo-cross course booking/u);
  assert.doesNotMatch(app.clauses(), /start-grid/u);
  assert.doesNotMatch(app.clauses(), /pit-box/u);
  assert.doesNotMatch(app.clauses(), /Pit-box lock-up/u);
  assert.doesNotMatch(app.clauses(), /Pump-track booking/u);
  assert.doesNotMatch(app.clauses(), /start-gate/u);
  assert.doesNotMatch(app.clauses(), /pump-track/u);
  assert.doesNotMatch(app.clauses(), /Start-gate hours/u);
  assert.doesNotMatch(app.clauses(), /pad-box/u);
  assert.doesNotMatch(app.clauses(), /Pad-box lock-up/u);
  assert.doesNotMatch(app.clauses(), /Downhill staging booking/u);
  assert.doesNotMatch(app.clauses(), /trail-gate/u);
  assert.doesNotMatch(app.clauses(), /Trail cafe hours/u);
  assert.doesNotMatch(app.clauses(), /helmet-box/u);
  assert.doesNotMatch(app.clauses(), /Helmet-box lock-up/u);
  assert.doesNotMatch(app.clauses(), /Velodrome staging booking/u);
  assert.doesNotMatch(app.clauses(), /bike-rack/u);
  assert.doesNotMatch(app.clauses(), /bike-box/u);
  assert.doesNotMatch(app.clauses(), /Triathlon staging booking/u);
  assert.doesNotMatch(app.clauses(), /transition-rack/u);
  assert.doesNotMatch(app.clauses(), /bike-bag/u);
  assert.doesNotMatch(app.clauses(), /Surf-club staging booking/u);
  assert.doesNotMatch(app.clauses(), /board-rack/u);
  assert.doesNotMatch(app.clauses(), /board-bag/u);
  assert.doesNotMatch(app.clauses(), /Dragon-boat staging booking/u);
  assert.doesNotMatch(app.clauses(), /drum-seat/u);
  assert.doesNotMatch(app.clauses(), /paddle-box/u);
  assert.doesNotMatch(app.clauses(), /Whitewater booking/u);
  assert.doesNotMatch(app.clauses(), /slalom/u);
  assert.doesNotMatch(app.clauses(), /spraydeck/u);
  assert.doesNotMatch(app.clauses(), /Canoe shed booking/u);
  assert.doesNotMatch(app.clauses(), /paddle pontoon/u);
  assert.doesNotMatch(app.clauses(), /Sailing jetty booking/u);
  assert.doesNotMatch(app.clauses(), /yacht-club/u);
  assert.doesNotMatch(app.clauses(), /marina/u);
  assert.doesNotMatch(app.clauses(), /Rowing pontoon booking/u);
  assert.doesNotMatch(app.clauses(), /boat-house/u);
  assert.doesNotMatch(app.clauses(), /Water polo pool booking/u);
  assert.doesNotMatch(app.clauses(), /Lacrosse field booking/u);
  assert.doesNotMatch(app.clauses(), /Softball diamond booking/u);
  assert.doesNotMatch(app.clauses(), /Outdoor pitch booking/u);
  assert.doesNotMatch(app.clauses(), /Pitch booking/u);
  assert.doesNotMatch(app.clauses(), /Goal nets/u);
  assert.doesNotMatch(app.clauses(), /Ice booking/u);
  assert.doesNotMatch(app.clauses(), /Pool open/u);
  assert.doesNotMatch(app.clauses(), /Lane lights/u);
  assert.doesNotMatch(app.clauses(), /09:50/u);
  assert.doesNotMatch(app.clauses(), /17:35/u);
  assert.doesNotMatch(app.clauses(), /07:25/u);
  assert.doesNotMatch(app.clauses(), /20:25/u);
  assert.doesNotMatch(app.clauses(), /12:45/u);
  assert.doesNotMatch(app.clauses(), /21:10/u);
  assert.doesNotMatch(app.clauses(), /10:40/u);
  assert.doesNotMatch(app.clauses(), /16:50/u);
  assert.doesNotMatch(app.clauses(), /08:05/u);
  assert.doesNotMatch(app.clauses(), /18:15/u);
  assert.doesNotMatch(app.clauses(), /13:30/u);
  assert.doesNotMatch(app.clauses(), /19:55/u);
  assert.doesNotMatch(app.clauses(), /08:25/u);
  assert.doesNotMatch(app.clauses(), /17:55/u);
  assert.doesNotMatch(app.clauses(), /07:40/u);
  assert.doesNotMatch(app.clauses(), /20:50/u);
  assert.doesNotMatch(app.clauses(), /12:20/u);
  assert.doesNotMatch(app.clauses(), /21:25/u);
  assert.doesNotMatch(app.groups(), /Residents/u);
  assert.doesNotMatch(app.groups(), /Building committee/u);
  assert.doesNotMatch(app.groups(), /Tenants/u);
  assert.doesNotMatch(app.groups(), /Building managers/u);
  assert.doesNotMatch(app.groups(), /Hirers/u);
  assert.doesNotMatch(app.groups(), /Hall committee/u);
});

test("road cycling club hours preset loads a distinct synthetic road-cycling workshop", async () => {
  const pkg = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"));
  assert.equal(pkg.version, "1.5.41");
  const app = await savedWorkbench(new Map());
  app.field("#preset-select", "road-cycling-club-hours");
  app.click("#load-preset");
  assert.match(app.title(), /Road cycling club hours: road course booking, feed-station hours, and wheel-bag lock-up/u);
  assert.equal(app.disabled("#export-button"), false);
  assert.doesNotMatch(app.alert(), /Fix the proposal/u);
  assert.match(app.clauses(), /Road course booking/u);
  assert.match(app.clauses(), /Feed-station hours/u);
  assert.match(app.clauses(), /Wheel-bag lock-up/u);
  assert.match(app.clauses(), /road course/u);
  assert.match(app.clauses(), /feed-station/u);
  assert.match(app.clauses(), /wheel-bag/u);
  assert.match(app.clauses(), /road cycling/u);
  assert.match(app.clauses(), /08:25/u);
  assert.match(app.clauses(), /17:55/u);
  assert.match(app.clauses(), /07:40/u);
  assert.match(app.clauses(), /20:50/u);
  assert.match(app.clauses(), /12:20/u);
  assert.match(app.clauses(), /21:25/u);
  assert.match(app.clauses(), /soigneurs/u);
  assert.match(app.groups(), /Students/u);
  assert.match(app.groups(), /Neighbours/u);
  assert.match(app.groups(), /P&amp;C/u);
  assert.match(app.firstGroupWithoutFloor(), /First group without a support floor: Students/u);
  assert.match(app.lastGroupWithoutFloor(), /Last group without a support floor: P&amp;C/u);
  assert.match(app.groupsWithoutFloorCount(), /Groups without a support floor: 3/u);
  assert.match(app.groupsWithoutFloorRemaining(), /Groups-without-floor remaining: 43/u);
  assert.match(app.lastGroupWithoutFloorRemaining(), /Last-without-floor remaining: 16/u);
  assert.match(app.firstGroupWithoutFloorRemaining(), /First-without-floor remaining: 14/u);
  assert.match(app.firstGroupWithoutFloorCost(), /First-without-floor cost: 14/u);
  assert.match(app.lastGroupWithoutFloorCost(), /Last-without-floor cost: 16/u);
  assert.doesNotMatch(app.lastGroupWithoutFloorCost(), /First-without-floor cost/u);
  assert.doesNotMatch(app.lastGroupWithoutFloorCost(), /First-without-floor remaining/u);
  assert.doesNotMatch(app.lastGroupWithoutFloorCost(), /Last-without-floor remaining/u);
  assert.doesNotMatch(app.firstGroupWithoutFloorCost(), /Last-without-floor cost/u);
  assert.doesNotMatch(app.firstGroupWithoutFloorCost(), /First-without-floor remaining/u);
  assert.doesNotMatch(app.firstGroupWithoutFloorRemaining(), /First-without-floor cost/u);
  assert.doesNotMatch(app.groupsWithoutFloorRemaining(), /Groups without a support floor:/u);
  assert.doesNotMatch(app.groupsWithoutFloorRemaining(), /Last-without-floor remaining/u);
  assert.doesNotMatch(app.groupsWithoutFloorRemaining(), /First-without-floor remaining/u);
  assert.doesNotMatch(app.lastGroupWithoutFloorRemaining(), /Groups-without-floor remaining/u);
  assert.doesNotMatch(app.lastGroupWithoutFloorRemaining(), /First-without-floor remaining/u);
  assert.doesNotMatch(app.firstGroupWithoutFloorRemaining(), /Groups-without-floor remaining/u);
  assert.doesNotMatch(app.firstGroupWithoutFloorRemaining(), /Last-without-floor remaining/u);
  assert.doesNotMatch(app.groupsWithoutFloorCount(), /Groups-without-floor remaining/u);
  assert.doesNotMatch(app.groupsWithoutFloorCount(), /Last-without-floor remaining/u);
  assert.doesNotMatch(app.groupsWithoutFloorCount(), /First-without-floor remaining/u);
  assert.doesNotMatch(app.groupsWithoutFloorRemaining(), /First group without a support floor/u);
  assert.doesNotMatch(app.groupsWithoutFloorRemaining(), /Last group without a support floor/u);
  assert.doesNotMatch(app.groupsWithoutFloorRemaining(), /Remaining change-budget/u);
  assert.doesNotMatch(app.groupsWithoutFloorRemaining(), /Students/u);
  assert.doesNotMatch(app.lastGroupWithoutFloorRemaining(), /Students/u);
  assert.doesNotMatch(app.lastGroupWithoutFloorRemaining(), /P&amp;C/u);
  assert.doesNotMatch(app.firstGroupWithoutFloorRemaining(), /Students/u);
  assert.doesNotMatch(app.firstGroupWithoutFloorRemaining(), /P&amp;C/u);
  assert.doesNotMatch(app.firstGroupWithoutFloorCost(), /Students/u);
  assert.doesNotMatch(app.firstGroupWithoutFloorCost(), /P&amp;C/u);
  assert.doesNotMatch(app.lastGroupWithoutFloorCost(), /Students/u);
  assert.doesNotMatch(app.lastGroupWithoutFloorCost(), /P&amp;C/u);
  assert.doesNotMatch(app.groupsWithoutFloorCount(), /First group without a support floor/u);
  assert.doesNotMatch(app.groupsWithoutFloorCount(), /Last group without a support floor/u);
  assert.doesNotMatch(app.firstGroupWithoutFloor(), /Last group without a support floor/u);
  assert.doesNotMatch(app.lastGroupWithoutFloor(), /First group without a support floor/u);
  assert.doesNotMatch(app.title(), /Keirin cycling club hours/u);
  assert.doesNotMatch(app.title(), /Hill-climb cycling club hours/u);
  assert.doesNotMatch(app.title(), /Time-trial cycling club hours/u);
  assert.doesNotMatch(app.title(), /Criterium cycling club hours/u);
  assert.doesNotMatch(app.title(), /Gravel cycling club hours/u);
  assert.doesNotMatch(app.title(), /Track cycling club hours/u);
  assert.doesNotMatch(app.title(), /Cyclo-cross club hours/u);
  assert.doesNotMatch(app.title(), /BMX club hours/u);
  assert.doesNotMatch(app.title(), /Mountain bike club hours/u);
  assert.doesNotMatch(app.title(), /Cycling club hours/u);
  assert.doesNotMatch(app.title(), /Triathlon club hours/u);
  assert.doesNotMatch(app.title(), /Surf club hours/u);
  assert.doesNotMatch(app.title(), /Dragon boat club hours/u);
  assert.doesNotMatch(app.title(), /Kayaking club hours/u);
  assert.doesNotMatch(app.title(), /Canoeing club hours/u);
  assert.doesNotMatch(app.title(), /Sailing club hours/u);
  assert.doesNotMatch(app.title(), /Rowing club hours/u);
  assert.doesNotMatch(app.title(), /Water polo club hours/u);
  assert.doesNotMatch(app.title(), /Lacrosse club hours/u);
  assert.doesNotMatch(app.title(), /Softball club hours/u);
  assert.doesNotMatch(app.title(), /Rugby club hours/u);
  assert.doesNotMatch(app.title(), /Hockey club hours/u);
  assert.doesNotMatch(app.title(), /Soccer club hours/u);
  assert.doesNotMatch(app.title(), /Swimming club hours/u);
  assert.doesNotMatch(app.title(), /Baseball/u);
  assert.doesNotMatch(app.title(), /Volleyball club hours/u);
  assert.doesNotMatch(app.title(), /Basketball club hours/u);
  assert.doesNotMatch(app.title(), /Tennis club hours/u);
  assert.doesNotMatch(app.title(), /Cricket club hours/u);
  assert.doesNotMatch(app.title(), /Athletics club hours/u);
  assert.doesNotMatch(app.title(), /Netball training hours/u);
  assert.doesNotMatch(app.title(), /Sports day hours/u);
  assert.doesNotMatch(app.title(), /School disco hours/u);
  assert.doesNotMatch(app.title(), /Rooftop BBQ hours/u);
  assert.doesNotMatch(app.title(), /Shared laundry hours/u);
  assert.doesNotMatch(app.title(), /Community garden watering/u);
  assert.doesNotMatch(app.title(), /Hall hire hours/u);
  assert.doesNotMatch(app.title(), /Street stall lighting/u);
  assert.doesNotMatch(app.title(), /Market stall hours/u);
  assert.doesNotMatch(app.title(), /Shared bike shed/u);
  assert.doesNotMatch(app.title(), /Sports Fixture Night/u);
  assert.doesNotMatch(app.title(), /Neighbourhood Plan/u);
  assert.doesNotMatch(app.title(), /Library Quiet Hours/u);
  assert.doesNotMatch(app.clauses(), /Criterium course booking/u);
  assert.doesNotMatch(app.clauses(), /pit-lane/u);
  assert.doesNotMatch(app.clauses(), /Number-board lock-up/u);
  assert.doesNotMatch(app.clauses(), /number-board/u);
  assert.doesNotMatch(app.clauses(), /09:35/u);
  assert.doesNotMatch(app.clauses(), /18:05/u);
  assert.doesNotMatch(app.clauses(), /08:10/u);
  assert.doesNotMatch(app.clauses(), /19:20/u);
  assert.doesNotMatch(app.clauses(), /13:25/u);
  assert.doesNotMatch(app.clauses(), /20:55/u);
  assert.doesNotMatch(app.clauses(), /start-ramp/u);
  assert.doesNotMatch(app.clauses(), /timing-chip/u);
  assert.doesNotMatch(app.clauses(), /09:45/u);
  assert.doesNotMatch(app.clauses(), /18:25/u);
  assert.doesNotMatch(app.clauses(), /13:35/u);
  assert.doesNotMatch(app.clauses(), /18:35/u);
  assert.doesNotMatch(app.clauses(), /13:45/u);
  assert.doesNotMatch(app.clauses(), /09:40/u);
  assert.doesNotMatch(app.clauses(), /08:15/u);
  assert.doesNotMatch(app.clauses(), /19:25/u);
  assert.doesNotMatch(app.clauses(), /21:00/u);
  assert.doesNotMatch(app.clauses(), /Gravel course booking/u);
  assert.doesNotMatch(app.clauses(), /feed-zone/u);
  assert.doesNotMatch(app.clauses(), /drop-bag/u);
  assert.doesNotMatch(app.clauses(), /Drop-bag lock-up/u);
  assert.doesNotMatch(app.clauses(), /Sprint track booking/u);
  assert.doesNotMatch(app.clauses(), /timing-hut/u);
  assert.doesNotMatch(app.clauses(), /wheel-box/u);
  assert.doesNotMatch(app.clauses(), /Wheel-box lock-up/u);
  assert.doesNotMatch(app.clauses(), /Cyclo-cross course booking/u);
  assert.doesNotMatch(app.clauses(), /start-grid/u);
  assert.doesNotMatch(app.clauses(), /pit-box/u);
  assert.doesNotMatch(app.clauses(), /Pit-box lock-up/u);
  assert.doesNotMatch(app.clauses(), /Pump-track booking/u);
  assert.doesNotMatch(app.clauses(), /start-gate/u);
  assert.doesNotMatch(app.clauses(), /pump-track/u);
  assert.doesNotMatch(app.clauses(), /Start-gate hours/u);
  assert.doesNotMatch(app.clauses(), /pad-box/u);
  assert.doesNotMatch(app.clauses(), /Pad-box lock-up/u);
  assert.doesNotMatch(app.clauses(), /Downhill staging booking/u);
  assert.doesNotMatch(app.clauses(), /trail-gate/u);
  assert.doesNotMatch(app.clauses(), /Trail cafe hours/u);
  assert.doesNotMatch(app.clauses(), /helmet-box/u);
  assert.doesNotMatch(app.clauses(), /Helmet-box lock-up/u);
  assert.doesNotMatch(app.clauses(), /Velodrome staging booking/u);
  assert.doesNotMatch(app.clauses(), /bike-rack/u);
  assert.doesNotMatch(app.clauses(), /bike-box/u);
  assert.doesNotMatch(app.clauses(), /Triathlon staging booking/u);
  assert.doesNotMatch(app.clauses(), /transition-rack/u);
  assert.doesNotMatch(app.clauses(), /bike-bag/u);
  assert.doesNotMatch(app.clauses(), /Surf-club staging booking/u);
  assert.doesNotMatch(app.clauses(), /board-rack/u);
  assert.doesNotMatch(app.clauses(), /board-bag/u);
  assert.doesNotMatch(app.clauses(), /Dragon-boat staging booking/u);
  assert.doesNotMatch(app.clauses(), /drum-seat/u);
  assert.doesNotMatch(app.clauses(), /paddle-box/u);
  assert.doesNotMatch(app.clauses(), /Whitewater booking/u);
  assert.doesNotMatch(app.clauses(), /slalom/u);
  assert.doesNotMatch(app.clauses(), /spraydeck/u);
  assert.doesNotMatch(app.clauses(), /Canoe shed booking/u);
  assert.doesNotMatch(app.clauses(), /paddle pontoon/u);
  assert.doesNotMatch(app.clauses(), /Sailing jetty booking/u);
  assert.doesNotMatch(app.clauses(), /yacht-club/u);
  assert.doesNotMatch(app.clauses(), /marina/u);
  assert.doesNotMatch(app.clauses(), /Rowing pontoon booking/u);
  assert.doesNotMatch(app.clauses(), /boat-house/u);
  assert.doesNotMatch(app.clauses(), /Water polo pool booking/u);
  assert.doesNotMatch(app.clauses(), /Lacrosse field booking/u);
  assert.doesNotMatch(app.clauses(), /Softball diamond booking/u);
  assert.doesNotMatch(app.clauses(), /Outdoor pitch booking/u);
  assert.doesNotMatch(app.clauses(), /Pitch booking/u);
  assert.doesNotMatch(app.clauses(), /Goal nets/u);
  assert.doesNotMatch(app.clauses(), /Ice booking/u);
  assert.doesNotMatch(app.clauses(), /Pool open/u);
  assert.doesNotMatch(app.clauses(), /Lane lights/u);
  assert.doesNotMatch(app.clauses(), /marshals/u);
  assert.doesNotMatch(app.clauses(), /commissaires/u);
  assert.doesNotMatch(app.clauses(), /start-ramp/u);
  assert.doesNotMatch(app.clauses(), /timing-chip/u);
  assert.doesNotMatch(app.clauses(), /09:45/u);
  assert.doesNotMatch(app.clauses(), /18:25/u);
  assert.doesNotMatch(app.clauses(), /13:35/u);
  assert.doesNotMatch(app.clauses(), /18:35/u);
  assert.doesNotMatch(app.clauses(), /13:45/u);
  assert.doesNotMatch(app.clauses(), /09:40/u);
  assert.doesNotMatch(app.clauses(), /08:15/u);
  assert.doesNotMatch(app.clauses(), /19:25/u);
  assert.doesNotMatch(app.clauses(), /21:00/u);
  assert.doesNotMatch(app.clauses(), /09:10/u);
  assert.doesNotMatch(app.clauses(), /16:20/u);
  assert.doesNotMatch(app.clauses(), /08:40/u);
  assert.doesNotMatch(app.clauses(), /19:05/u);
  assert.doesNotMatch(app.clauses(), /13:10/u);
  assert.doesNotMatch(app.clauses(), /20:40/u);
  assert.doesNotMatch(app.clauses(), /09:50/u);
  assert.doesNotMatch(app.clauses(), /17:35/u);
  assert.doesNotMatch(app.clauses(), /07:25/u);
  assert.doesNotMatch(app.clauses(), /20:25/u);
  assert.doesNotMatch(app.clauses(), /12:45/u);
  assert.doesNotMatch(app.clauses(), /21:10/u);
  assert.doesNotMatch(app.clauses(), /10:40/u);
  assert.doesNotMatch(app.clauses(), /16:50/u);
  assert.doesNotMatch(app.clauses(), /08:05/u);
  assert.doesNotMatch(app.clauses(), /18:15/u);
  assert.doesNotMatch(app.clauses(), /13:30/u);
  assert.doesNotMatch(app.clauses(), /19:55/u);
  assert.doesNotMatch(app.groups(), /Residents/u);
  assert.doesNotMatch(app.groups(), /Building committee/u);
  assert.doesNotMatch(app.groups(), /Tenants/u);
  assert.doesNotMatch(app.groups(), /Building managers/u);
  assert.doesNotMatch(app.groups(), /Hirers/u);
  assert.doesNotMatch(app.groups(), /Hall committee/u);
});

test("criterium cycling club hours preset loads a distinct synthetic criterium-cycling workshop", async () => {
  const pkg = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"));
  assert.equal(pkg.version, "1.5.41");
  const app = await savedWorkbench(new Map());
  app.field("#preset-select", "criterium-cycling-club-hours");
  app.click("#load-preset");
  assert.match(app.title(), /Criterium cycling club hours: criterium course booking, pit-lane hours, and number-board lock-up/u);
  assert.equal(app.disabled("#export-button"), false);
  assert.doesNotMatch(app.alert(), /Fix the proposal/u);
  assert.match(app.clauses(), /Criterium course booking/u);
  assert.match(app.clauses(), /Pit-lane hours/u);
  assert.match(app.clauses(), /Number-board lock-up/u);
  assert.match(app.clauses(), /criterium course/u);
  assert.match(app.clauses(), /pit-lane/u);
  assert.match(app.clauses(), /number-board/u);
  assert.match(app.clauses(), /criterium cycling/u);
  assert.match(app.clauses(), /09:35/u);
  assert.match(app.clauses(), /18:05/u);
  assert.match(app.clauses(), /08:10/u);
  assert.match(app.clauses(), /19:20/u);
  assert.match(app.clauses(), /13:25/u);
  assert.match(app.clauses(), /20:55/u);
  assert.match(app.clauses(), /commissaires/u);
  assert.match(app.groups(), /Students/u);
  assert.match(app.groups(), /Neighbours/u);
  assert.match(app.groups(), /P&amp;C/u);
  assert.match(app.firstGroupWithoutFloor(), /First group without a support floor: Students/u);
  assert.match(app.lastGroupWithoutFloor(), /Last group without a support floor: P&amp;C/u);
  assert.match(app.groupsWithoutFloorCount(), /Groups without a support floor: 3/u);
  assert.match(app.groupsWithoutFloorRemaining(), /Groups-without-floor remaining: 46/u);
  assert.match(app.lastGroupWithoutFloorRemaining(), /Last-without-floor remaining: 17/u);
  assert.match(app.firstGroupWithoutFloorRemaining(), /First-without-floor remaining: 15/u);
  assert.match(app.firstGroupWithoutFloorCost(), /First-without-floor cost: 15/u);
  assert.match(app.lastGroupWithoutFloorCost(), /Last-without-floor cost: 17/u);
  assert.doesNotMatch(app.lastGroupWithoutFloorCost(), /First-without-floor cost/u);
  assert.doesNotMatch(app.lastGroupWithoutFloorCost(), /First-without-floor remaining/u);
  assert.doesNotMatch(app.lastGroupWithoutFloorCost(), /Last-without-floor remaining/u);
  assert.doesNotMatch(app.firstGroupWithoutFloorCost(), /Last-without-floor cost/u);
  assert.doesNotMatch(app.firstGroupWithoutFloorCost(), /First-without-floor remaining/u);
  assert.doesNotMatch(app.firstGroupWithoutFloorRemaining(), /First-without-floor cost/u);
  assert.doesNotMatch(app.groupsWithoutFloorRemaining(), /Groups without a support floor:/u);
  assert.doesNotMatch(app.groupsWithoutFloorRemaining(), /Last-without-floor remaining/u);
  assert.doesNotMatch(app.groupsWithoutFloorRemaining(), /First-without-floor remaining/u);
  assert.doesNotMatch(app.lastGroupWithoutFloorRemaining(), /Groups-without-floor remaining/u);
  assert.doesNotMatch(app.lastGroupWithoutFloorRemaining(), /First-without-floor remaining/u);
  assert.doesNotMatch(app.firstGroupWithoutFloorRemaining(), /Groups-without-floor remaining/u);
  assert.doesNotMatch(app.firstGroupWithoutFloorRemaining(), /Last-without-floor remaining/u);
  assert.doesNotMatch(app.groupsWithoutFloorCount(), /Groups-without-floor remaining/u);
  assert.doesNotMatch(app.groupsWithoutFloorCount(), /Last-without-floor remaining/u);
  assert.doesNotMatch(app.groupsWithoutFloorCount(), /First-without-floor remaining/u);
  assert.doesNotMatch(app.groupsWithoutFloorRemaining(), /First group without a support floor/u);
  assert.doesNotMatch(app.groupsWithoutFloorRemaining(), /Last group without a support floor/u);
  assert.doesNotMatch(app.groupsWithoutFloorRemaining(), /Remaining change-budget/u);
  assert.doesNotMatch(app.groupsWithoutFloorRemaining(), /Students/u);
  assert.doesNotMatch(app.lastGroupWithoutFloorRemaining(), /Students/u);
  assert.doesNotMatch(app.lastGroupWithoutFloorRemaining(), /P&amp;C/u);
  assert.doesNotMatch(app.firstGroupWithoutFloorRemaining(), /Students/u);
  assert.doesNotMatch(app.firstGroupWithoutFloorRemaining(), /P&amp;C/u);
  assert.doesNotMatch(app.firstGroupWithoutFloorCost(), /Students/u);
  assert.doesNotMatch(app.firstGroupWithoutFloorCost(), /P&amp;C/u);
  assert.doesNotMatch(app.lastGroupWithoutFloorCost(), /Students/u);
  assert.doesNotMatch(app.lastGroupWithoutFloorCost(), /P&amp;C/u);
  assert.doesNotMatch(app.groupsWithoutFloorCount(), /First group without a support floor/u);
  assert.doesNotMatch(app.groupsWithoutFloorCount(), /Last group without a support floor/u);
  assert.doesNotMatch(app.firstGroupWithoutFloor(), /Last group without a support floor/u);
  assert.doesNotMatch(app.lastGroupWithoutFloor(), /First group without a support floor/u);
  assert.doesNotMatch(app.title(), /Time-trial cycling club hours/u);
  assert.doesNotMatch(app.title(), /Road cycling club hours/u);
  assert.doesNotMatch(app.title(), /Gravel cycling club hours/u);
  assert.doesNotMatch(app.title(), /Track cycling club hours/u);
  assert.doesNotMatch(app.title(), /Cyclo-cross club hours/u);
  assert.doesNotMatch(app.title(), /BMX club hours/u);
  assert.doesNotMatch(app.title(), /Mountain bike club hours/u);
  assert.doesNotMatch(app.title(), /Cycling club hours/u);
  assert.doesNotMatch(app.title(), /Triathlon club hours/u);
  assert.doesNotMatch(app.title(), /Surf club hours/u);
  assert.doesNotMatch(app.title(), /Dragon boat club hours/u);
  assert.doesNotMatch(app.title(), /Kayaking club hours/u);
  assert.doesNotMatch(app.title(), /Canoeing club hours/u);
  assert.doesNotMatch(app.title(), /Sailing club hours/u);
  assert.doesNotMatch(app.title(), /Rowing club hours/u);
  assert.doesNotMatch(app.title(), /Water polo club hours/u);
  assert.doesNotMatch(app.title(), /Lacrosse club hours/u);
  assert.doesNotMatch(app.title(), /Softball club hours/u);
  assert.doesNotMatch(app.title(), /Rugby club hours/u);
  assert.doesNotMatch(app.title(), /Hockey club hours/u);
  assert.doesNotMatch(app.title(), /Soccer club hours/u);
  assert.doesNotMatch(app.title(), /Swimming club hours/u);
  assert.doesNotMatch(app.title(), /Baseball/u);
  assert.doesNotMatch(app.title(), /Volleyball club hours/u);
  assert.doesNotMatch(app.title(), /Basketball club hours/u);
  assert.doesNotMatch(app.title(), /Tennis club hours/u);
  assert.doesNotMatch(app.title(), /Cricket club hours/u);
  assert.doesNotMatch(app.title(), /Athletics club hours/u);
  assert.doesNotMatch(app.title(), /Netball training hours/u);
  assert.doesNotMatch(app.title(), /Sports day hours/u);
  assert.doesNotMatch(app.title(), /School disco hours/u);
  assert.doesNotMatch(app.title(), /Rooftop BBQ hours/u);
  assert.doesNotMatch(app.title(), /Shared laundry hours/u);
  assert.doesNotMatch(app.title(), /Community garden watering/u);
  assert.doesNotMatch(app.title(), /Hall hire hours/u);
  assert.doesNotMatch(app.title(), /Street stall lighting/u);
  assert.doesNotMatch(app.title(), /Market stall hours/u);
  assert.doesNotMatch(app.title(), /Shared bike shed/u);
  assert.doesNotMatch(app.title(), /Sports Fixture Night/u);
  assert.doesNotMatch(app.title(), /Neighbourhood Plan/u);
  assert.doesNotMatch(app.title(), /Library Quiet Hours/u);
  assert.doesNotMatch(app.clauses(), /Road course booking/u);
  assert.doesNotMatch(app.clauses(), /feed-station/u);
  assert.doesNotMatch(app.clauses(), /wheel-bag/u);
  assert.doesNotMatch(app.clauses(), /soigneurs/u);
  assert.doesNotMatch(app.clauses(), /08:25/u);
  assert.doesNotMatch(app.clauses(), /17:55/u);
  assert.doesNotMatch(app.clauses(), /07:40/u);
  assert.doesNotMatch(app.clauses(), /20:50/u);
  assert.doesNotMatch(app.clauses(), /12:20/u);
  assert.doesNotMatch(app.clauses(), /21:25/u);
  assert.doesNotMatch(app.clauses(), /Gravel course booking/u);
  assert.doesNotMatch(app.clauses(), /feed-zone/u);
  assert.doesNotMatch(app.clauses(), /drop-bag/u);
  assert.doesNotMatch(app.clauses(), /Drop-bag lock-up/u);
  assert.doesNotMatch(app.clauses(), /Sprint track booking/u);
  assert.doesNotMatch(app.clauses(), /timing-hut/u);
  assert.doesNotMatch(app.clauses(), /wheel-box/u);
  assert.doesNotMatch(app.clauses(), /Wheel-box lock-up/u);
  assert.doesNotMatch(app.clauses(), /Cyclo-cross course booking/u);
  assert.doesNotMatch(app.clauses(), /start-grid/u);
  assert.doesNotMatch(app.clauses(), /pit-box/u);
  assert.doesNotMatch(app.clauses(), /Pit-box lock-up/u);
  assert.doesNotMatch(app.clauses(), /Pump-track booking/u);
  assert.doesNotMatch(app.clauses(), /start-gate/u);
  assert.doesNotMatch(app.clauses(), /pump-track/u);
  assert.doesNotMatch(app.clauses(), /Start-gate hours/u);
  assert.doesNotMatch(app.clauses(), /pad-box/u);
  assert.doesNotMatch(app.clauses(), /Pad-box lock-up/u);
  assert.doesNotMatch(app.clauses(), /Downhill staging booking/u);
  assert.doesNotMatch(app.clauses(), /trail-gate/u);
  assert.doesNotMatch(app.clauses(), /Trail cafe hours/u);
  assert.doesNotMatch(app.clauses(), /helmet-box/u);
  assert.doesNotMatch(app.clauses(), /Helmet-box lock-up/u);
  assert.doesNotMatch(app.clauses(), /Velodrome staging booking/u);
  assert.doesNotMatch(app.clauses(), /bike-rack/u);
  assert.doesNotMatch(app.clauses(), /bike-box/u);
  assert.doesNotMatch(app.clauses(), /Triathlon staging booking/u);
  assert.doesNotMatch(app.clauses(), /transition-rack/u);
  assert.doesNotMatch(app.clauses(), /bike-bag/u);
  assert.doesNotMatch(app.clauses(), /Surf-club staging booking/u);
  assert.doesNotMatch(app.clauses(), /board-rack/u);
  assert.doesNotMatch(app.clauses(), /board-bag/u);
  assert.doesNotMatch(app.clauses(), /Dragon-boat staging booking/u);
  assert.doesNotMatch(app.clauses(), /drum-seat/u);
  assert.doesNotMatch(app.clauses(), /paddle-box/u);
  assert.doesNotMatch(app.clauses(), /Whitewater booking/u);
  assert.doesNotMatch(app.clauses(), /slalom/u);
  assert.doesNotMatch(app.clauses(), /spraydeck/u);
  assert.doesNotMatch(app.clauses(), /Canoe shed booking/u);
  assert.doesNotMatch(app.clauses(), /paddle pontoon/u);
  assert.doesNotMatch(app.clauses(), /Sailing jetty booking/u);
  assert.doesNotMatch(app.clauses(), /yacht-club/u);
  assert.doesNotMatch(app.clauses(), /marina/u);
  assert.doesNotMatch(app.clauses(), /Rowing pontoon booking/u);
  assert.doesNotMatch(app.clauses(), /boat-house/u);
  assert.doesNotMatch(app.clauses(), /Water polo pool booking/u);
  assert.doesNotMatch(app.clauses(), /Lacrosse field booking/u);
  assert.doesNotMatch(app.clauses(), /Softball diamond booking/u);
  assert.doesNotMatch(app.clauses(), /Outdoor pitch booking/u);
  assert.doesNotMatch(app.clauses(), /Pitch booking/u);
  assert.doesNotMatch(app.clauses(), /Goal nets/u);
  assert.doesNotMatch(app.clauses(), /Ice booking/u);
  assert.doesNotMatch(app.clauses(), /Pool open/u);
  assert.doesNotMatch(app.clauses(), /Lane lights/u);
  assert.doesNotMatch(app.clauses(), /marshals/u);
  assert.doesNotMatch(app.clauses(), /soigneurs/u);
  assert.doesNotMatch(app.clauses(), /start-ramp/u);
  assert.doesNotMatch(app.clauses(), /timing-chip/u);
  assert.doesNotMatch(app.clauses(), /09:45/u);
  assert.doesNotMatch(app.clauses(), /18:25/u);
  assert.doesNotMatch(app.clauses(), /13:35/u);
  assert.doesNotMatch(app.clauses(), /18:35/u);
  assert.doesNotMatch(app.clauses(), /13:45/u);
  assert.doesNotMatch(app.clauses(), /09:40/u);
  assert.doesNotMatch(app.clauses(), /08:15/u);
  assert.doesNotMatch(app.clauses(), /19:25/u);
  assert.doesNotMatch(app.clauses(), /21:00/u);
  assert.doesNotMatch(app.clauses(), /09:10/u);
  assert.doesNotMatch(app.clauses(), /16:20/u);
  assert.doesNotMatch(app.clauses(), /08:40/u);
  assert.doesNotMatch(app.clauses(), /19:05/u);
  assert.doesNotMatch(app.clauses(), /13:10/u);
  assert.doesNotMatch(app.clauses(), /20:40/u);
  assert.doesNotMatch(app.clauses(), /09:50/u);
  assert.doesNotMatch(app.clauses(), /17:35/u);
  assert.doesNotMatch(app.clauses(), /07:25/u);
  assert.doesNotMatch(app.clauses(), /20:25/u);
  assert.doesNotMatch(app.clauses(), /12:45/u);
  assert.doesNotMatch(app.clauses(), /21:10/u);
  assert.doesNotMatch(app.clauses(), /10:40/u);
  assert.doesNotMatch(app.clauses(), /16:50/u);
  assert.doesNotMatch(app.clauses(), /08:05/u);
  assert.doesNotMatch(app.clauses(), /18:15/u);
  assert.doesNotMatch(app.clauses(), /13:30/u);
  assert.doesNotMatch(app.clauses(), /19:55/u);
  assert.doesNotMatch(app.groups(), /Residents/u);
  assert.doesNotMatch(app.groups(), /Building committee/u);
  assert.doesNotMatch(app.groups(), /Tenants/u);
  assert.doesNotMatch(app.groups(), /Building managers/u);
  assert.doesNotMatch(app.groups(), /Hirers/u);
  assert.doesNotMatch(app.groups(), /Hall committee/u);
});

test("keirin cycling club hours preset loads a distinct synthetic keirin-cycling workshop", async () => {
  const pkg = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"));
  assert.equal(pkg.version, "1.5.41");
  const app = await savedWorkbench(new Map());
  app.field("#preset-select", "keirin-cycling-club-hours");
  app.click("#load-preset");
  assert.match(app.title(), /Keirin cycling club hours: keirin course booking, derny-pacer hours, and keirin-chip lock-up/u);
  assert.equal(app.disabled("#export-button"), false);
  assert.doesNotMatch(app.alert(), /Fix the proposal/u);
  assert.match(app.clauses(), /Keirin course booking/u);
  assert.match(app.clauses(), /Derny-pacer hours/u);
  assert.match(app.clauses(), /Keirin-chip lock-up/u);
  assert.match(app.clauses(), /keirin course/u);
  assert.match(app.clauses(), /derny-pacer/u);
  assert.match(app.clauses(), /keirin-chip/u);
  assert.match(app.clauses(), /keirin cycling/u);
  assert.match(app.clauses(), /09:50/u);
  assert.match(app.clauses(), /18:35/u);
  assert.match(app.clauses(), /13:45/u);
  assert.match(app.clauses(), /pacer crew/u);
  assert.match(app.groups(), /Students/u);
  assert.match(app.groups(), /Neighbours/u);
  assert.match(app.groups(), /P&amp;C/u);
  assert.match(app.firstGroupWithoutFloor(), /First group without a support floor: Students/u);
  assert.match(app.lastGroupWithoutFloor(), /Last group without a support floor: P&amp;C/u);
  assert.match(app.groupsWithoutFloorCount(), /Groups without a support floor: 3/u);
  assert.match(app.groupsWithoutFloorRemaining(), /Groups-without-floor remaining: 53/u);
  assert.match(app.lastGroupWithoutFloorRemaining(), /Last-without-floor remaining: 20/u);
  assert.match(app.firstGroupWithoutFloorRemaining(), /First-without-floor remaining: 18/u);
  assert.match(app.firstGroupWithoutFloorCost(), /First-without-floor cost: 18/u);
  assert.match(app.lastGroupWithoutFloorCost(), /Last-without-floor cost: 20/u);
  assert.doesNotMatch(app.title(), /Hill-climb cycling club hours/u);
  assert.doesNotMatch(app.title(), /Time-trial cycling club hours/u);
  assert.doesNotMatch(app.title(), /Criterium cycling club hours/u);
  assert.doesNotMatch(app.title(), /Road cycling club hours/u);
  assert.doesNotMatch(app.clauses(), /start-ramp/u);
  assert.doesNotMatch(app.clauses(), /timing-hut/u);
  assert.doesNotMatch(app.clauses(), /time-check/u);
  assert.doesNotMatch(app.clauses(), /pit-lane/u);
  assert.doesNotMatch(app.clauses(), /circuit/u);
  assert.doesNotMatch(app.clauses(), /sealed-road/u);
  assert.doesNotMatch(app.clauses(), /feed-zone/u);
  assert.doesNotMatch(app.clauses(), /banked-boards/u);
  assert.doesNotMatch(app.clauses(), /summit-marshal/u);
  assert.doesNotMatch(app.clauses(), /hairpin/u);
  assert.doesNotMatch(app.clauses(), /climb-chip/u);
  assert.doesNotMatch(app.clauses(), /09:45/u);
  assert.doesNotMatch(app.clauses(), /18:25/u);
  assert.doesNotMatch(app.clauses(), /13:35/u);
  assert.doesNotMatch(app.groups(), /Residents/u);
});

test("hill-climb cycling club hours preset loads a distinct synthetic hill-climb-cycling workshop", async () => {
  const pkg = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"));
  assert.equal(pkg.version, "1.5.41");
  const app = await savedWorkbench(new Map());
  app.field("#preset-select", "hill-climb-cycling-club-hours");
  app.click("#load-preset");
  assert.match(app.title(), /Hill-climb cycling club hours: hill-climb course booking, summit-marshal hours, and climb-chip lock-up/u);
  assert.equal(app.disabled("#export-button"), false);
  assert.doesNotMatch(app.alert(), /Fix the proposal/u);
  assert.match(app.clauses(), /Hill-climb course booking/u);
  assert.match(app.clauses(), /Summit-marshal hours/u);
  assert.match(app.clauses(), /Climb-chip lock-up/u);
  assert.match(app.clauses(), /hill-climb course/u);
  assert.match(app.clauses(), /summit-marshal/u);
  assert.match(app.clauses(), /climb-chip/u);
  assert.match(app.clauses(), /hill-climb cycling/u);
  assert.match(app.clauses(), /09:45/u);
  assert.match(app.clauses(), /18:25/u);
  assert.match(app.clauses(), /13:35/u);
  assert.match(app.clauses(), /timekeepers/u);
  assert.match(app.groups(), /Students/u);
  assert.match(app.groups(), /Neighbours/u);
  assert.match(app.groups(), /P&amp;C/u);
  assert.match(app.firstGroupWithoutFloor(), /First group without a support floor: Students/u);
  assert.match(app.lastGroupWithoutFloor(), /Last group without a support floor: P&amp;C/u);
  assert.match(app.groupsWithoutFloorCount(), /Groups without a support floor: 3/u);
  assert.match(app.groupsWithoutFloorRemaining(), /Groups-without-floor remaining: 50/u);
  assert.match(app.lastGroupWithoutFloorRemaining(), /Last-without-floor remaining: 19/u);
  assert.match(app.firstGroupWithoutFloorRemaining(), /First-without-floor remaining: 17/u);
  assert.match(app.firstGroupWithoutFloorCost(), /First-without-floor cost: 17/u);
  assert.match(app.lastGroupWithoutFloorCost(), /Last-without-floor cost: 19/u);
  assert.doesNotMatch(app.title(), /Keirin cycling club hours/u);
  assert.doesNotMatch(app.title(), /Time-trial cycling club hours/u);
  assert.doesNotMatch(app.title(), /Criterium cycling club hours/u);
  assert.doesNotMatch(app.title(), /Road cycling club hours/u);
  assert.doesNotMatch(app.clauses(), /start-ramp/u);
  assert.doesNotMatch(app.clauses(), /timing-hut/u);
  assert.doesNotMatch(app.clauses(), /time-check/u);
  assert.doesNotMatch(app.clauses(), /pit-lane/u);
  assert.doesNotMatch(app.clauses(), /circuit/u);
  assert.doesNotMatch(app.clauses(), /sealed-road/u);
  assert.doesNotMatch(app.clauses(), /derny-pacer/u);
  assert.doesNotMatch(app.clauses(), /keirin-chip/u);
  assert.doesNotMatch(app.clauses(), /18:35/u);
  assert.doesNotMatch(app.clauses(), /13:45/u);
  assert.doesNotMatch(app.clauses(), /commissaires/u);
  assert.doesNotMatch(app.clauses(), /09:40/u);
  assert.doesNotMatch(app.clauses(), /18:15/u);
  assert.doesNotMatch(app.clauses(), /13:30/u);
  assert.doesNotMatch(app.groups(), /Residents/u);
});

test("time-trial cycling club hours preset loads a distinct synthetic time-trial-cycling workshop", async () => {
  const pkg = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"));
  assert.equal(pkg.version, "1.5.41");
  const app = await savedWorkbench(new Map());
  app.field("#preset-select", "time-trial-cycling-club-hours");
  app.click("#load-preset");
  assert.match(app.title(), /Time-trial cycling club hours: time-trial course booking, start-ramp hours, and timing-chip lock-up/u);
  assert.equal(app.disabled("#export-button"), false);
  assert.doesNotMatch(app.alert(), /Fix the proposal/u);
  assert.match(app.clauses(), /Time-trial course booking/u);
  assert.match(app.clauses(), /Start-ramp hours/u);
  assert.match(app.clauses(), /Timing-chip lock-up/u);
  assert.match(app.clauses(), /time-trial course/u);
  assert.match(app.clauses(), /start-ramp/u);
  assert.match(app.clauses(), /timing-chip/u);
  assert.match(app.clauses(), /time-trial cycling/u);
  assert.match(app.clauses(), /09:40/u);
  assert.match(app.clauses(), /18:15/u);
  assert.match(app.clauses(), /08:15/u);
  assert.match(app.clauses(), /19:25/u);
  assert.match(app.clauses(), /13:30/u);
  assert.match(app.clauses(), /21:00/u);
  assert.match(app.clauses(), /timekeepers/u);
  assert.match(app.groups(), /Students/u);
  assert.match(app.groups(), /Neighbours/u);
  assert.match(app.groups(), /P&amp;C/u);
  assert.match(app.firstGroupWithoutFloor(), /First group without a support floor: Students/u);
  assert.match(app.lastGroupWithoutFloor(), /Last group without a support floor: P&amp;C/u);
  assert.match(app.groupsWithoutFloorCount(), /Groups without a support floor: 3/u);
  assert.match(app.groupsWithoutFloorRemaining(), /Groups-without-floor remaining: 47/u);
  assert.match(app.lastGroupWithoutFloorRemaining(), /Last-without-floor remaining: 18/u);
  assert.match(app.firstGroupWithoutFloorRemaining(), /First-without-floor remaining: 16/u);
  assert.match(app.firstGroupWithoutFloorCost(), /First-without-floor cost: 16/u);
  assert.match(app.lastGroupWithoutFloorCost(), /Last-without-floor cost: 18/u);
  assert.doesNotMatch(app.lastGroupWithoutFloorCost(), /First-without-floor cost/u);
  assert.doesNotMatch(app.lastGroupWithoutFloorCost(), /First-without-floor remaining/u);
  assert.doesNotMatch(app.lastGroupWithoutFloorCost(), /Last-without-floor remaining/u);
  assert.doesNotMatch(app.firstGroupWithoutFloorCost(), /Last-without-floor cost/u);
  assert.doesNotMatch(app.firstGroupWithoutFloorCost(), /First-without-floor remaining/u);
  assert.doesNotMatch(app.firstGroupWithoutFloorRemaining(), /First-without-floor cost/u);
  assert.doesNotMatch(app.groupsWithoutFloorRemaining(), /Groups without a support floor:/u);
  assert.doesNotMatch(app.groupsWithoutFloorRemaining(), /Last-without-floor remaining/u);
  assert.doesNotMatch(app.groupsWithoutFloorRemaining(), /First-without-floor remaining/u);
  assert.doesNotMatch(app.lastGroupWithoutFloorRemaining(), /Groups-without-floor remaining/u);
  assert.doesNotMatch(app.lastGroupWithoutFloorRemaining(), /First-without-floor remaining/u);
  assert.doesNotMatch(app.firstGroupWithoutFloorRemaining(), /Groups-without-floor remaining/u);
  assert.doesNotMatch(app.firstGroupWithoutFloorRemaining(), /Last-without-floor remaining/u);
  assert.doesNotMatch(app.groupsWithoutFloorCount(), /Groups-without-floor remaining/u);
  assert.doesNotMatch(app.groupsWithoutFloorCount(), /Last-without-floor remaining/u);
  assert.doesNotMatch(app.groupsWithoutFloorCount(), /First-without-floor remaining/u);
  assert.doesNotMatch(app.groupsWithoutFloorRemaining(), /First group without a support floor/u);
  assert.doesNotMatch(app.groupsWithoutFloorRemaining(), /Last group without a support floor/u);
  assert.doesNotMatch(app.groupsWithoutFloorRemaining(), /Remaining change-budget/u);
  assert.doesNotMatch(app.groupsWithoutFloorRemaining(), /Students/u);
  assert.doesNotMatch(app.lastGroupWithoutFloorRemaining(), /Students/u);
  assert.doesNotMatch(app.lastGroupWithoutFloorRemaining(), /P&amp;C/u);
  assert.doesNotMatch(app.firstGroupWithoutFloorRemaining(), /Students/u);
  assert.doesNotMatch(app.firstGroupWithoutFloorRemaining(), /P&amp;C/u);
  assert.doesNotMatch(app.firstGroupWithoutFloorCost(), /Students/u);
  assert.doesNotMatch(app.firstGroupWithoutFloorCost(), /P&amp;C/u);
  assert.doesNotMatch(app.lastGroupWithoutFloorCost(), /Students/u);
  assert.doesNotMatch(app.lastGroupWithoutFloorCost(), /P&amp;C/u);
  assert.doesNotMatch(app.groupsWithoutFloorCount(), /First group without a support floor/u);
  assert.doesNotMatch(app.groupsWithoutFloorCount(), /Last group without a support floor/u);
  assert.doesNotMatch(app.firstGroupWithoutFloor(), /Last group without a support floor/u);
  assert.doesNotMatch(app.lastGroupWithoutFloor(), /First group without a support floor/u);
  assert.doesNotMatch(app.title(), /Keirin cycling club hours/u);
  assert.doesNotMatch(app.title(), /Hill-climb cycling club hours/u);
  assert.doesNotMatch(app.title(), /Criterium cycling club hours/u);
  assert.doesNotMatch(app.title(), /Road cycling club hours/u);
  assert.doesNotMatch(app.title(), /Gravel cycling club hours/u);
  assert.doesNotMatch(app.title(), /Track cycling club hours/u);
  assert.doesNotMatch(app.title(), /Cyclo-cross club hours/u);
  assert.doesNotMatch(app.title(), /BMX club hours/u);
  assert.doesNotMatch(app.title(), /Mountain bike club hours/u);
  assert.doesNotMatch(app.title(), /Cycling club hours/u);
  assert.doesNotMatch(app.title(), /Triathlon club hours/u);
  assert.doesNotMatch(app.clauses(), /Criterium course booking/u);
  assert.doesNotMatch(app.clauses(), /pit-lane/u);
  assert.doesNotMatch(app.clauses(), /Number-board lock-up/u);
  assert.doesNotMatch(app.clauses(), /number-board/u);
  assert.doesNotMatch(app.clauses(), /09:35/u);
  assert.doesNotMatch(app.clauses(), /18:05/u);
  assert.doesNotMatch(app.clauses(), /08:10/u);
  assert.doesNotMatch(app.clauses(), /19:20/u);
  assert.doesNotMatch(app.clauses(), /13:25/u);
  assert.doesNotMatch(app.clauses(), /20:55/u);
  assert.doesNotMatch(app.clauses(), /commissaires/u);
  assert.doesNotMatch(app.clauses(), /09:45/u);
  assert.doesNotMatch(app.clauses(), /18:25/u);
  assert.doesNotMatch(app.clauses(), /13:35/u);
  assert.doesNotMatch(app.clauses(), /18:35/u);
  assert.doesNotMatch(app.clauses(), /13:45/u);
  assert.doesNotMatch(app.clauses(), /Road course booking/u);
  assert.doesNotMatch(app.clauses(), /feed-station/u);
  assert.doesNotMatch(app.clauses(), /wheel-bag/u);
  assert.doesNotMatch(app.clauses(), /soigneurs/u);
  assert.doesNotMatch(app.clauses(), /timing-hut/u);
  assert.doesNotMatch(app.clauses(), /circuit/u);
  assert.doesNotMatch(app.clauses(), /sealed-road/u);
  assert.doesNotMatch(app.clauses(), /feed-zone/u);
  assert.doesNotMatch(app.groups(), /Residents/u);
  assert.doesNotMatch(app.groups(), /Building committee/u);
  assert.doesNotMatch(app.groups(), /Tenants/u);
  assert.doesNotMatch(app.groups(), /Building managers/u);
  assert.doesNotMatch(app.groups(), /Hirers/u);
  assert.doesNotMatch(app.groups(), /Hall committee/u);
});

test("tennis club hours preset loads a distinct synthetic tennis workshop", async () => {
  const app = await savedWorkbench(new Map());
  app.field("#preset-select", "tennis-club-hours");
  app.click("#load-preset");
  assert.match(app.title(), /Tennis club hours: court booking, ball machines, and lock-up/u);
  assert.equal(app.disabled("#export-button"), false);
  assert.doesNotMatch(app.alert(), /Fix the proposal/u);
  assert.match(app.clauses(), /Court booking/u);
  assert.match(app.clauses(), /Ball machines/u);
  assert.match(app.clauses(), /Clubhouse lock-up/u);
  assert.match(app.groups(), /Students/u);
  assert.match(app.groups(), /Neighbours/u);
  assert.match(app.groups(), /P&amp;C/u);
  assert.doesNotMatch(app.title(), /Cricket club hours/u);
  assert.doesNotMatch(app.title(), /Athletics club hours/u);
  assert.doesNotMatch(app.title(), /Swimming club hours/u);
  assert.doesNotMatch(app.title(), /Netball training hours/u);
  assert.doesNotMatch(app.title(), /Sports day hours/u);
  assert.doesNotMatch(app.title(), /School disco hours/u);
  assert.doesNotMatch(app.title(), /Rooftop BBQ hours/u);
  assert.doesNotMatch(app.title(), /Shared laundry hours/u);
  assert.doesNotMatch(app.title(), /Community garden watering/u);
  assert.doesNotMatch(app.title(), /Hall hire hours/u);
  assert.doesNotMatch(app.title(), /Street stall lighting/u);
  assert.doesNotMatch(app.title(), /Market stall hours/u);
  assert.doesNotMatch(app.title(), /Shared bike shed/u);
  assert.doesNotMatch(app.title(), /Sports Fixture Night/u);
  assert.doesNotMatch(app.title(), /Neighbourhood Plan/u);
  assert.doesNotMatch(app.title(), /Library Quiet Hours/u);
  assert.doesNotMatch(app.title(), /Basketball club hours/u);
  assert.doesNotMatch(app.title(), /Volleyball club hours/u);
  assert.doesNotMatch(app.title(), /Soccer club hours/u);
  assert.doesNotMatch(app.title(), /Hockey club hours/u);
  assert.doesNotMatch(app.title(), /Rugby club hours/u);
  assert.doesNotMatch(app.title(), /Softball club hours/u);
  assert.doesNotMatch(app.title(), /Lacrosse club hours/u);
  assert.doesNotMatch(app.title(), /Water polo club hours/u);
  assert.doesNotMatch(app.clauses(), /Scoring nets/u);
  assert.doesNotMatch(app.clauses(), /Tea room/u);
  assert.doesNotMatch(app.clauses(), /Pavilion lock-up/u);
  assert.doesNotMatch(app.clauses(), /Track open/u);
  assert.doesNotMatch(app.clauses(), /Track lock-up/u);
  assert.doesNotMatch(app.clauses(), /Pool open/u);
  assert.doesNotMatch(app.clauses(), /Lane lights/u);
  assert.doesNotMatch(app.clauses(), /Pool lock-up/u);
  assert.doesNotMatch(app.clauses(), /Start time/u);
  assert.doesNotMatch(app.clauses(), /Court lights/u);
  assert.doesNotMatch(app.clauses(), /Court lock-up/u);
  assert.doesNotMatch(app.clauses(), /Race start/u);
  assert.doesNotMatch(app.clauses(), /PA volume/u);
  assert.doesNotMatch(app.clauses(), /Field lock-up/u);
  assert.doesNotMatch(app.clauses(), /Finish time/u);
  assert.doesNotMatch(app.clauses(), /Bass/u);
  assert.doesNotMatch(app.clauses(), /Hall lock-up/u);
  assert.doesNotMatch(app.clauses(), /Hall booking/u);
  assert.doesNotMatch(app.clauses(), /Ball racks/u);
  assert.doesNotMatch(app.clauses(), /Gym lock-up/u);
  assert.doesNotMatch(app.clauses(), /Hall\/court booking/u);
  assert.doesNotMatch(app.clauses(), /Net posts/u);
  assert.doesNotMatch(app.clauses(), /Sports hall lock-up/u);
  assert.doesNotMatch(app.clauses(), /Pitch booking/u);
  assert.doesNotMatch(app.clauses(), /Goal nets/u);
  assert.doesNotMatch(app.clauses(), /Changing-room lock-up/u);
  assert.doesNotMatch(app.clauses(), /Ice booking/u);
  assert.doesNotMatch(app.clauses(), /Rink boards/u);
  assert.doesNotMatch(app.clauses(), /Rink lock-up/u);
  assert.doesNotMatch(app.clauses(), /Cook hours/u);
  assert.doesNotMatch(app.clauses(), /Smoke/u);
  assert.doesNotMatch(app.clauses(), /Rooftop lock-up/u);
  assert.doesNotMatch(app.clauses(), /Wash hours/u);
  assert.doesNotMatch(app.clauses(), /Dryer noise/u);
  assert.doesNotMatch(app.clauses(), /Laundry lock-up/u);
  assert.doesNotMatch(app.clauses(), /Watering hours/u);
  assert.doesNotMatch(app.clauses(), /Close time/u);
  assert.doesNotMatch(app.clauses(), /Lighting hours/u);
  assert.doesNotMatch(app.clauses(), /Access hours/u);
  assert.doesNotMatch(app.clauses(), /Stall open hours/u);
  assert.doesNotMatch(app.clauses(), /Match end-time/u);
  assert.doesNotMatch(app.clauses(), /Park access hours/u);
  assert.doesNotMatch(app.clauses(), /Evening hours/u);
  assert.doesNotMatch(app.groups(), /Residents/u);
  assert.doesNotMatch(app.groups(), /Building committee/u);
  assert.doesNotMatch(app.groups(), /Tenants/u);
  assert.doesNotMatch(app.groups(), /Building managers/u);
  assert.doesNotMatch(app.groups(), /Hirers/u);
  assert.doesNotMatch(app.groups(), /Hall committee/u);
});

test("keyboard f focuses the clause filter unless an input is active", async () => {
  const app = await savedWorkbench(new Map());
  app.keydown("f");
  assert.equal(app.focused(), "#clause-filter");
  app.clearFocus();
  app.keydown("f", { tagName: "INPUT", isContentEditable: false });
  assert.equal(app.focused(), "");
  app.keydown("f", { tagName: "TEXTAREA", isContentEditable: false });
  assert.equal(app.focused(), "");
  app.keydown("F");
  assert.equal(app.focused(), "#clause-filter");
});

test("keyboard slash focuses the clause filter unless an input is active", async () => {
  const app = await savedWorkbench(new Map());
  app.keydown("/");
  assert.equal(app.focused(), "#clause-filter");
  app.clearFocus();
  app.keydown("/", { tagName: "INPUT", isContentEditable: false });
  assert.equal(app.focused(), "");
  app.keydown("/", { tagName: "TEXTAREA", isContentEditable: false });
  assert.equal(app.focused(), "");
  app.keydown("/", { tagName: "SELECT", isContentEditable: false });
  assert.equal(app.focused(), "");
});

test("keyboard n focuses Add group unless an input is active", async () => {
  const app = await savedWorkbench(new Map());
  app.keydown("n");
  assert.equal(app.focused(), "#add-group");
  app.clearFocus();
  app.keydown("n", { tagName: "INPUT", isContentEditable: false });
  assert.equal(app.focused(), "");
  app.keydown("n", { tagName: "SELECT", isContentEditable: false });
  assert.equal(app.focused(), "");
  app.keydown("N");
  assert.equal(app.focused(), "#add-group");
});

test("keyboard l jumps to the first locked clause unless an input is active", async () => {
  const app = await savedWorkbench(new Map());
  app.keydown("l");
  assert.equal(app.focused(), "#clear-locks");
  app.clearFocus();
  app.keydown("l", { tagName: "INPUT", isContentEditable: false });
  assert.equal(app.focused(), "");
  app.keydown("l", { tagName: "TEXTAREA", isContentEditable: false });
  assert.equal(app.focused(), "");
  app.clickAction("toggle-clause-lock", { clauseId: "hours", optionId: "hours-pilot" });
  app.clearFocus();
  app.keydown("L");
  assert.equal(app.focused(), '[data-field="clause-lock"][data-clause-id="hours"]');
});

test("show workshop tour reopens the first-run coach after it was dismissed", async () => {
  const storage = new Map([["smallest-agreement:coach:v1", "dismissed"]]);
  const app = await savedWorkbench(storage);
  assert.equal(app.coachHidden(), true);
  app.click("#coach-again");
  assert.equal(app.coachHidden(), false);
  app.click("#coach-skip");
  assert.equal(app.coachHidden(), true);
  assert.equal(storage.get("smallest-agreement:coach:v1"), "dismissed");
});

test("clause notes persist on the worksheet and can be undone without changing search inputs otherwise", async () => {
  const storage = new Map();
  const app = await savedWorkbench(storage);
  app.setTitle("Workshop draft for clause notes");
  app.edit("clause-note", "Ask about lighting.", { field: "clause-note", clauseId: "path" });
  const saved = JSON.parse(storage.get("smallest-agreement:proposal:v1"));
  assert.equal(saved.clauses.find((clause) => clause.id === "path").note, "Ask about lighting.");
  assert.match(app.clauses(), /Facilitator note/u);
  assert.match(app.ballot(), /Facilitator note: Ask about lighting\./u);
  app.click("#undo-button");
  assert.equal(JSON.parse(storage.get("smallest-agreement:proposal:v1")).clauses.find((clause) => clause.id === "path").note, undefined);
});

test("printable worksheet lists every clause option without recording a vote", async () => {
  const app = await savedWorkbench(new Map());
  assert.match(app.ballot(), /Neighbourhood Plan: the shared green/u);
  assert.match(app.ballot(), /Park access hours/u);
  assert.match(app.ballot(), /Close at 20:00 every day \(original\)/u);
  assert.match(app.ballot(), /ballot-box/u);
  assert.match(app.ballot(), /Participant groups: Residents, Shopkeepers, Park stewards/u);
});

test("print facilitator pack keeps pin columns, notes, and veto highlights while hiding the coach", async () => {
  const html = await standaloneBytes();
  assert.match(html, /Print facilitator pack/u);
  assert.match(html, /Print redacted/u);
  assert.match(html, /Facilitator pack\. The workshop tour is hidden/u);
  assert.match(html, /\.groups-without-floor-count-fallback-label, #groups-without-floor-count-fallback, #groups-without-floor-count-fallback-note, \.groups-without-floor-remaining-fallback-label, #groups-without-floor-remaining-fallback, #groups-without-floor-remaining-fallback-note, \.last-group-without-floor-remaining-fallback-label, #last-group-without-floor-remaining-fallback, #last-group-without-floor-remaining-fallback-note, \.change-cost-csv-fallback-label/u);
  assert.match(html, /\.locked-clauses-filter, #locked-clauses-filter-note, \.hide-unlocked-clauses-filter, #hide-unlocked-clauses-filter-note, \.hide-locked-clauses-filter, #hide-locked-clauses-filter-note, \.changed-clauses-filter, #changed-clauses-filter-note, \.over-budget-clauses-filter, #over-budget-clauses-filter-note, \.no-cheaper-remaining-clauses-filter, #no-cheaper-remaining-clauses-filter-note/u);
  assert.match(html, /\.below-floor-groups-filter, #below-floor-groups-filter-note/u);
  assert.match(html, /\.hide-groups-at-floor-filter, #hide-groups-at-floor-filter-note/u);
  assert.match(html, /\.hide-groups-without-floors-filter, #hide-groups-without-floors-filter-note/u);
  assert.match(html, /\.hide-groups-meeting-threshold-filter, #hide-groups-meeting-threshold-filter-note/u);
  assert.match(html, /\.hide-groups-below-threshold-filter, #hide-groups-below-threshold-filter-note/u);
  assert.match(html, /\.hide-veto-groups-filter, #hide-veto-groups-filter-note/u);
  assert.match(html, /\.hide-non-veto-groups-filter, #hide-non-veto-groups-filter-note/u);
  assert.match(html, /\.hide-first-veto-group-filter, #hide-first-veto-group-filter-note/u);
  assert.match(html, /\.hide-last-veto-group-filter, #hide-last-veto-group-filter-note/u);
  assert.match(html, /\.hide-first-non-veto-group-filter, #hide-first-non-veto-group-filter-note, \.hide-last-non-veto-group-filter, #hide-last-non-veto-group-filter-note, \.hide-last-group-below-threshold-filter, #hide-last-group-below-threshold-filter-note, \.hide-first-group-below-threshold-filter, #hide-first-group-below-threshold-filter-note, \.hide-last-group-at-or-above-threshold-filter, #hide-last-group-at-or-above-threshold-filter-note, \.hide-first-group-at-or-above-threshold-filter, #hide-first-group-at-or-above-threshold-filter-note, \.hide-last-group-at-floor-filter, #hide-last-group-at-floor-filter-note, \.hide-first-group-at-floor-filter, #hide-first-group-at-floor-filter-note, \.hide-first-group-below-floor-filter, #hide-first-group-below-floor-filter-note, \.hide-last-group-below-floor-filter, #hide-last-group-below-floor-filter-note, \.hide-last-group-without-floor-filter, #hide-last-group-without-floor-filter-note, \.hide-first-group-without-floor-filter, #hide-first-group-without-floor-filter-note/u);
  assert.match(html, /#side-by-side, #printable-ballot, #constraint-checks, #coalition-table \{ display: block !important; \}/u);
  const storage = new Map();
  const app = await savedWorkbench(storage);
  app.setTitle("Workshop draft for print notes");
  app.edit("clause-note", "Ask about lighting.", { field: "clause-note", clauseId: "path" });
  assert.match(app.sideBySide(), /Facilitator note: Ask about lighting\./u);
  assert.match(app.ballot(), /Facilitator note: Ask about lighting\./u);
  assert.equal(app.coachHidden(), false);
});

test("print facilitator pack includes recommended package option labels", async () => {
  const html = await standaloneBytes();
  assert.match(html, /recommended package option labels/u);
  const draft = {
    title: "Print labels workshop",
    threshold: 70,
    groups: [{ id: "g", name: "Residents", weight: 1 }],
    clauses: [
      { id: "one", title: "Hours", options: [
        { id: "one-original", label: "Keep original hours", original: true, changeCost: 0, support: { g: 40 } },
        { id: "one-alt", label: "Extend hours", original: false, changeCost: 1, support: { g: 90 } },
        { id: "one-other", label: "Cut hours", original: false, changeCost: 2, support: { g: 20 } },
      ] },
    ],
  };
  const storage = new Map([["smallest-agreement:proposal:v1", JSON.stringify(draft)]]);
  const app = await savedWorkbench(storage);
  assert.match(app.ballot(), /Recommended: Extend hours/u);
  assert.match(app.ballot(), /Extend hours \(recommended\)/u);
  assert.match(app.ballot(), /Keep original hours \(original\)/u);
  assert.doesNotMatch(app.ballot(), /Keep original hours \(original\) \(recommended\)/u);
  assert.match(app.ballot(), /Participant groups: Residents/u);
  app.click("#print-button");
  assert.equal(app.printCalls(), 1);
  assert.match(app.ballot(), /Recommended: Extend hours/u);
  assert.match(app.ballot(), /Participant groups: Residents/u);
  app.click("#print-redacted-button");
  assert.equal(app.printCalls(), 2);
  assert.match(app.ballot(), /Participant groups: Group 1/u);
  assert.match(app.ballot(), /Recommended: Extend hours/u);
  assert.doesNotMatch(app.ballot(), /Residents/u);
  assert.equal(JSON.parse(storage.get("smallest-agreement:proposal:v1")).groups[0].name, "Residents");
});

test("print facilitator pack includes remaining change-budget as one line without changing the saved draft", async () => {
  const html = await standaloneBytes();
  assert.match(html, /a one-line remaining change-budget, the numeric approval threshold on the worksheet, a one-line lock count, and the first locked clause option label as one line/u);
  assert.match(html, /not a legal appropriation/u);
  const storage = new Map();
  const app = await savedWorkbench(storage);
  app.setTitle("Workshop draft for remaining-budget print");
  assert.match(app.ballot(), /leftover change-budget is unlimited/u);
  assert.match(app.ballot(), /not a legal appropriation/u);
  assert.match(app.ballot(), /Participant groups: Residents, Shopkeepers, Park stewards/u);
  app.click("#print-button");
  assert.equal(app.printCalls(), 1);
  assert.match(app.ballot(), /leftover change-budget is unlimited/u);
  app.click("#print-redacted-button");
  assert.equal(app.printCalls(), 2);
  assert.match(app.ballot(), /Participant groups: Group 1, Group 2, Group 3/u);
  assert.match(app.ballot(), /leftover change-budget is unlimited/u);
  assert.doesNotMatch(app.ballot(), /Residents/u);
  assert.equal(JSON.parse(storage.get("smallest-agreement:proposal:v1")).groups[0].name, "Residents");

  const leftover = {
    title: "Print leftover workshop",
    threshold: 70,
    maxChangeCost: 3,
    groups: [{ id: "g", name: "Residents", weight: 1 }],
    clauses: [
      { id: "keep", title: "Keep", options: [
        { id: "keep-original", label: "Keep original keep", original: true, changeCost: 0, support: { g: 90 } },
        { id: "keep-alt", label: "Alt keep", original: false, changeCost: 5, support: { g: 40 } },
        { id: "keep-other", label: "Other keep", original: false, changeCost: 8, support: { g: 20 } },
      ] },
      { id: "spend", title: "Spend", options: [
        { id: "spend-original", label: "Keep original spend", original: true, changeCost: 0, support: { g: 40 } },
        { id: "spend-alt", label: "Alt spend", original: false, changeCost: 2, support: { g: 90 } },
        { id: "spend-other", label: "Other spend", original: false, changeCost: 8, support: { g: 20 } },
      ] },
    ],
  };
  const leftoverStorage = new Map([["smallest-agreement:proposal:v1", JSON.stringify(leftover)]]);
  const leftoverApp = await savedWorkbench(leftoverStorage);
  assert.match(leftoverApp.ballot(), /<p>Remaining change-budget: 1\.0\. This leftover is a draft accounting line, not a legal appropriation\.<\/p>/u);
  leftoverApp.click("#print-redacted-button");
  assert.match(leftoverApp.ballot(), /Participant groups: Group 1/u);
  assert.match(leftoverApp.ballot(), /Remaining change-budget: 1\.0/u);
  assert.doesNotMatch(leftoverApp.ballot(), /Residents/u);
  assert.equal(JSON.parse(leftoverStorage.get("smallest-agreement:proposal:v1")).groups[0].name, "Residents");

  const exhausted = {
    title: "Print exhausted workshop",
    threshold: 70,
    maxChangeCost: 2,
    groups: [{ id: "g", name: "Residents", weight: 1 }],
    clauses: [{ id: "one", title: "One", options: [
      { id: "original", label: "Keep original", original: true, changeCost: 0, support: { g: 40 } },
      { id: "alt", label: "Alt", original: false, changeCost: 2, support: { g: 90 } },
      { id: "other", label: "Other", original: false, changeCost: 8, support: { g: 20 } },
    ] }],
  };
  const spent = await savedWorkbench(new Map([["smallest-agreement:proposal:v1", JSON.stringify(exhausted)]]));
  assert.match(spent.ballot(), /Remaining change-budget is exhausted \(0\.0 leftover\)/u);
  assert.match(spent.ballot(), /not a legal appropriation/u);
});

test("print facilitator pack includes a one-line lock count without changing the saved draft", async () => {
  const html = await standaloneBytes();
  assert.match(html, /one-line lock count, and the first locked clause option label as one line on the worksheet/u);
  assert.match(html, /not a legal hold/u);
  const storage = new Map();
  const app = await savedWorkbench(storage);
  app.setTitle("Workshop draft for lock-count print");
  assert.match(app.ballot(), /Current lock count: 0/u);
  assert.match(app.ballot(), /not a legal hold/u);
  assert.match(app.ballot(), /Participant groups: Residents, Shopkeepers, Park stewards/u);
  app.click("#print-button");
  assert.equal(app.printCalls(), 1);
  assert.match(app.ballot(), /Current lock count: 0/u);
  app.click("#print-redacted-button");
  assert.equal(app.printCalls(), 2);
  assert.match(app.ballot(), /Participant groups: Group 1, Group 2, Group 3/u);
  assert.match(app.ballot(), /Current lock count: 0/u);
  assert.doesNotMatch(app.ballot(), /Residents/u);
  assert.equal(JSON.parse(storage.get("smallest-agreement:proposal:v1")).groups[0].name, "Residents");
  assert.equal(JSON.parse(storage.get("smallest-agreement:proposal:v1")).clauses.some((clause) => clause.lockedOptionId), false);

  const locked = {
    title: "Print lock count workshop",
    threshold: 70,
    groups: [{ id: "g", name: "Residents", weight: 1 }],
    clauses: [
      { id: "one", title: "Hours", lockedOptionId: "one-alt", options: [
        { id: "one-original", label: "Keep original hours", original: true, changeCost: 0, support: { g: 90 } },
        { id: "one-alt", label: "Extend hours", original: false, changeCost: 1, support: { g: 90 } },
        { id: "one-other", label: "Cut hours", original: false, changeCost: 2, support: { g: 20 } },
      ] },
      { id: "two", title: "Path", options: [
        { id: "two-original", label: "Keep original path", original: true, changeCost: 0, support: { g: 90 } },
        { id: "two-alt", label: "Warm path", original: false, changeCost: 1, support: { g: 40 } },
        { id: "two-other", label: "Motion path", original: false, changeCost: 2, support: { g: 20 } },
      ] },
    ],
  };
  const lockedStorage = new Map([["smallest-agreement:proposal:v1", JSON.stringify(locked)]]);
  const lockedApp = await savedWorkbench(lockedStorage);
  assert.match(lockedApp.ballot(), /Current lock count: 1\. Locks are draft choices, not a legal hold/u);
  lockedApp.click("#print-redacted-button");
  assert.match(lockedApp.ballot(), /Participant groups: Group 1/u);
  assert.match(lockedApp.ballot(), /Current lock count: 1/u);
  assert.doesNotMatch(lockedApp.ballot(), /Residents/u);
  assert.equal(JSON.parse(lockedStorage.get("smallest-agreement:proposal:v1")).groups[0].name, "Residents");
  assert.equal(JSON.parse(lockedStorage.get("smallest-agreement:proposal:v1")).clauses[0].lockedOptionId, "one-alt");
});

test("print facilitator pack includes the first locked option label as one line without changing the saved draft", async () => {
  const html = await standaloneBytes();
  assert.match(html, /first locked clause option label as one line on the worksheet/u);
  assert.match(html, /not a legal hold/u);
  const storage = new Map();
  const app = await savedWorkbench(storage);
  app.setTitle("Workshop draft for first-locked print");
  assert.match(app.ballot(), /No clause is locked, so there is no first locked option label to copy/u);
  assert.match(app.ballot(), /not a legal hold/u);
  assert.match(app.ballot(), /Participant groups: Residents, Shopkeepers, Park stewards/u);
  app.click("#print-button");
  assert.equal(app.printCalls(), 1);
  assert.match(app.ballot(), /No clause is locked/u);
  app.click("#print-redacted-button");
  assert.equal(app.printCalls(), 2);
  assert.match(app.ballot(), /Participant groups: Group 1, Group 2, Group 3/u);
  assert.match(app.ballot(), /No clause is locked/u);
  assert.doesNotMatch(app.ballot(), /Residents/u);
  assert.equal(JSON.parse(storage.get("smallest-agreement:proposal:v1")).groups[0].name, "Residents");
  assert.equal(JSON.parse(storage.get("smallest-agreement:proposal:v1")).clauses.some((clause) => clause.lockedOptionId), false);

  const locked = {
    title: "Print first locked option workshop",
    threshold: 70,
    groups: [{ id: "g", name: "Residents", weight: 1 }],
    clauses: [
      { id: "one", title: "Hours", lockedOptionId: "one-alt", options: [
        { id: "one-original", label: "Keep original hours", original: true, changeCost: 0, support: { g: 90 } },
        { id: "one-alt", label: "Extend hours", original: false, changeCost: 1, support: { g: 90 } },
        { id: "one-other", label: "Cut hours", original: false, changeCost: 2, support: { g: 20 } },
      ] },
      { id: "two", title: "Path", options: [
        { id: "two-original", label: "Keep original path", original: true, changeCost: 0, support: { g: 90 } },
        { id: "two-alt", label: "Warm path", original: false, changeCost: 1, support: { g: 40 } },
        { id: "two-other", label: "Motion path", original: false, changeCost: 2, support: { g: 20 } },
      ] },
    ],
  };
  const lockedStorage = new Map([["smallest-agreement:proposal:v1", JSON.stringify(locked)]]);
  const lockedApp = await savedWorkbench(lockedStorage);
  assert.match(lockedApp.ballot(), /First locked clause option: Extend hours\. Locks are draft choices, not a legal hold/u);
  lockedApp.click("#print-redacted-button");
  assert.match(lockedApp.ballot(), /Participant groups: Group 1/u);
  assert.match(lockedApp.ballot(), /First locked clause option: Extend hours/u);
  assert.doesNotMatch(lockedApp.ballot(), /Residents/u);
  assert.equal(JSON.parse(lockedStorage.get("smallest-agreement:proposal:v1")).groups[0].name, "Residents");
  assert.equal(JSON.parse(lockedStorage.get("smallest-agreement:proposal:v1")).clauses[0].lockedOptionId, "one-alt");
});

test("print facilitator pack includes below-floor group count as one line without changing the saved draft", async () => {
  const html = await standaloneBytes();
  assert.match(html, /plus a one-line below-floor group count/u);
  assert.match(html, /not a legal quorum/u);
  const storage = new Map();
  const app = await savedWorkbench(storage);
  app.setTitle("Workshop draft for below-floor print");
  assert.match(app.ballot(), /Groups below their support floor: 0/u);
  assert.match(app.ballot(), /not a legal quorum/u);
  assert.match(app.ballot(), /Participant groups: Residents, Shopkeepers, Park stewards/u);
  app.click("#print-button");
  assert.equal(app.printCalls(), 1);
  assert.match(app.ballot(), /Groups below their support floor: 0/u);
  app.click("#print-redacted-button");
  assert.equal(app.printCalls(), 2);
  assert.match(app.ballot(), /Participant groups: Group 1, Group 2, Group 3/u);
  assert.match(app.ballot(), /Groups below their support floor: 0/u);
  assert.doesNotMatch(app.ballot(), /Residents/u);
  assert.equal(JSON.parse(storage.get("smallest-agreement:proposal:v1")).groups[0].name, "Residents");

  const counted = {
    title: "Print below-floor count workshop",
    threshold: 70,
    groups: [
      { id: "floored", name: "Residents", weight: 1, minSupport: 80 },
      { id: "open", name: "Open", weight: 1 },
    ],
    clauses: [{ id: "one", title: "Hours", options: [
      { id: "original", label: "Keep original hours", original: true, changeCost: 0, support: { floored: 50, open: 90 } },
      { id: "mid", label: "Mid option", original: false, changeCost: 1, support: { floored: 50, open: 40 } },
      { id: "other", label: "Other option", original: false, changeCost: 2, support: { floored: 50, open: 80 } },
    ] }],
  };
  const countedStorage = new Map([["smallest-agreement:proposal:v1", JSON.stringify(counted)]]);
  const countedApp = await savedWorkbench(countedStorage);
  assert.match(countedApp.ballot(), /Groups below their support floor: 1\. A floor is a number you entered, not a legal quorum/u);
  countedApp.click("#print-redacted-button");
  assert.match(countedApp.ballot(), /Participant groups: Group 1, Group 2/u);
  assert.match(countedApp.ballot(), /Groups below their support floor: 1/u);
  assert.doesNotMatch(countedApp.ballot(), /Residents/u);
  assert.equal(JSON.parse(countedStorage.get("smallest-agreement:proposal:v1")).groups[0].name, "Residents");
});

test("print facilitator pack includes the first below-floor group label as one line without changing the saved draft", async () => {
  const html = await standaloneBytes();
  assert.match(html, /the first below-floor group label as one line/u);
  assert.match(html, /not a legal quorum/u);
  const storage = new Map();
  const app = await savedWorkbench(storage);
  app.setTitle("Workshop draft for first below-floor print");
  assert.match(app.ballot(), /No group is below its support floor, so there is no first below-floor group label to copy/u);
  assert.match(app.ballot(), /not a legal quorum/u);
  assert.match(app.ballot(), /not a legal identity/u);
  assert.match(app.ballot(), /Participant groups: Residents, Shopkeepers, Park stewards/u);
  app.click("#print-button");
  assert.equal(app.printCalls(), 1);
  assert.match(app.ballot(), /No group is below its support floor/u);
  app.click("#print-redacted-button");
  assert.equal(app.printCalls(), 2);
  assert.match(app.ballot(), /Participant groups: Group 1, Group 2, Group 3/u);
  assert.match(app.ballot(), /No group is below its support floor/u);
  assert.doesNotMatch(app.ballot(), /Residents/u);
  assert.equal(JSON.parse(storage.get("smallest-agreement:proposal:v1")).groups[0].name, "Residents");

  const labelled = {
    title: "Print first below-floor group workshop",
    threshold: 70,
    groups: [
      { id: "floored", name: "Residents", weight: 1, minSupport: 80 },
      { id: "open", name: "Open", weight: 1 },
    ],
    clauses: [{ id: "one", title: "Hours", options: [
      { id: "original", label: "Keep original hours", original: true, changeCost: 0, support: { floored: 50, open: 90 } },
      { id: "mid", label: "Mid option", original: false, changeCost: 1, support: { floored: 50, open: 40 } },
      { id: "other", label: "Other option", original: false, changeCost: 2, support: { floored: 50, open: 80 } },
    ] }],
  };
  const labelledStorage = new Map([["smallest-agreement:proposal:v1", JSON.stringify(labelled)]]);
  const labelledApp = await savedWorkbench(labelledStorage);
  assert.match(labelledApp.ballot(), /First below-floor group: Residents\. A floor is a number you entered, not a legal quorum\. The label is not a legal identity/u);
  labelledApp.click("#print-redacted-button");
  assert.match(labelledApp.ballot(), /Participant groups: Group 1, Group 2/u);
  assert.match(labelledApp.ballot(), /First below-floor group: Group 1/u);
  assert.doesNotMatch(labelledApp.ballot(), /Residents/u);
  assert.equal(JSON.parse(labelledStorage.get("smallest-agreement:proposal:v1")).groups[0].name, "Residents");
});

test("print facilitator pack includes the threshold-group count as one line without changing the saved draft", async () => {
  const html = await standaloneBytes();
  assert.match(html, /a one-line threshold-group count/u);
  assert.match(html, /not a legal quorum/u);
  const passing = {
    title: "Print threshold-group count workshop",
    threshold: 70,
    groups: [
      { id: "cleared", name: "Residents", weight: 1 },
      { id: "short", name: "Open", weight: 1 },
    ],
    clauses: [{ id: "one", title: "Hours", options: [
      { id: "original", label: "Keep original hours", original: true, changeCost: 0, support: { cleared: 90, short: 20 } },
      { id: "mid", label: "Mid option", original: false, changeCost: 1, support: { cleared: 80, short: 30 } },
      { id: "other", label: "Other option", original: false, changeCost: 2, support: { cleared: 70, short: 40 } },
    ] }],
  };
  const storage = new Map([["smallest-agreement:proposal:v1", JSON.stringify(passing)]]);
  const app = await savedWorkbench(storage);
  assert.match(app.ballot(), /Groups meeting the approval threshold: 1\. A threshold is a number you entered, not a legal quorum/u);
  assert.match(app.ballot(), /Participant groups: Residents, Open/u);
  app.click("#print-button");
  assert.equal(app.printCalls(), 1);
  assert.match(app.ballot(), /Groups meeting the approval threshold: 1/u);
  app.click("#print-redacted-button");
  assert.equal(app.printCalls(), 2);
  assert.match(app.ballot(), /Participant groups: Group 1, Group 2/u);
  assert.match(app.ballot(), /Groups meeting the approval threshold: 1/u);
  assert.doesNotMatch(app.ballot(), /Residents/u);
  assert.equal(JSON.parse(storage.get("smallest-agreement:proposal:v1")).groups[0].name, "Residents");

  const zero = {
    title: "Print zero threshold-group count workshop",
    threshold: 95,
    groups: [
      { id: "cleared", name: "Residents", weight: 1 },
      { id: "short", name: "Open", weight: 1 },
    ],
    clauses: [{ id: "one", title: "Hours", options: [
      { id: "original", label: "Keep original hours", original: true, changeCost: 0, support: { cleared: 40, short: 20 } },
      { id: "mid", label: "Mid option", original: false, changeCost: 1, support: { cleared: 30, short: 30 } },
      { id: "other", label: "Other option", original: false, changeCost: 2, support: { cleared: 20, short: 40 } },
    ] }],
  };
  const zeroStorage = new Map([["smallest-agreement:proposal:v1", JSON.stringify(zero)]]);
  const zeroApp = await savedWorkbench(zeroStorage);
  assert.match(zeroApp.ballot(), /Groups meeting the approval threshold: 0\. A threshold is a number you entered, not a legal quorum/u);
  zeroApp.click("#print-redacted-button");
  assert.match(zeroApp.ballot(), /Participant groups: Group 1, Group 2/u);
  assert.match(zeroApp.ballot(), /Groups meeting the approval threshold: 0/u);
  assert.doesNotMatch(zeroApp.ballot(), /Residents/u);
  assert.equal(JSON.parse(zeroStorage.get("smallest-agreement:proposal:v1")).groups[0].name, "Residents");
});

test("print facilitator pack includes the first veto group label as one line without changing the saved draft", async () => {
  const html = await standaloneBytes();
  assert.match(html, /the first veto group label as one line/u);
  assert.match(html, /not a legal right/u);
  const noneFixed = {
    title: "Print no veto group workshop",
    threshold: 70,
    groups: [
      { id: "open", name: "Residents", weight: 1 },
      { id: "other", name: "Open", weight: 1 },
    ],
    clauses: [{ id: "one", title: "Hours", options: [
      { id: "original", label: "Keep original hours", original: true, changeCost: 0, support: { open: 90, other: 80 } },
      { id: "mid", label: "Mid option", original: false, changeCost: 1, support: { open: 80, other: 70 } },
      { id: "other-opt", label: "Other option", original: false, changeCost: 2, support: { open: 70, other: 60 } },
    ] }],
  };
  const noneStorage = new Map([["smallest-agreement:proposal:v1", JSON.stringify(noneFixed)]]);
  const noneApp = await savedWorkbench(noneStorage);
  assert.match(noneApp.ballot(), /No veto group is marked, so there is no first veto group label to copy\. A veto is a number you entered, not a legal right/u);
  assert.match(noneApp.ballot(), /Participant groups: Residents, Open/u);
  noneApp.click("#print-button");
  assert.equal(noneApp.printCalls(), 1);
  assert.match(noneApp.ballot(), /No veto group is marked/u);
  noneApp.click("#print-redacted-button");
  assert.equal(noneApp.printCalls(), 2);
  assert.match(noneApp.ballot(), /Participant groups: Group 1, Group 2/u);
  assert.match(noneApp.ballot(), /No veto group is marked/u);
  assert.doesNotMatch(noneApp.ballot(), /Residents/u);
  assert.equal(JSON.parse(noneStorage.get("smallest-agreement:proposal:v1")).groups[0].name, "Residents");

  const labelled = {
    title: "Print first veto group workshop",
    threshold: 70,
    groups: [
      { id: "open", name: "Open", weight: 1 },
      { id: "veto", name: "Residents", weight: 1, veto: true },
      { id: "later", name: "Later veto", weight: 1, veto: true },
    ],
    clauses: [{ id: "one", title: "Hours", options: [
      { id: "original", label: "Keep original hours", original: true, changeCost: 0, support: { open: 90, veto: 80, later: 80 } },
      { id: "mid", label: "Mid option", original: false, changeCost: 1, support: { open: 80, veto: 70, later: 70 } },
      { id: "other-opt", label: "Other option", original: false, changeCost: 2, support: { open: 70, veto: 60, later: 60 } },
    ] }],
  };
  const labelledStorage = new Map([["smallest-agreement:proposal:v1", JSON.stringify(labelled)]]);
  const labelledApp = await savedWorkbench(labelledStorage);
  assert.match(labelledApp.ballot(), /First veto group: Residents\. A veto is a number you entered, not a legal right/u);
  assert.doesNotMatch(labelledApp.ballot(), /First veto group: Later veto/u);
  labelledApp.click("#print-redacted-button");
  assert.match(labelledApp.ballot(), /Participant groups: Group 1, Group 2, Group 3/u);
  assert.match(labelledApp.ballot(), /First veto group: Group 2/u);
  assert.doesNotMatch(labelledApp.ballot(), /Residents/u);
  assert.equal(JSON.parse(labelledStorage.get("smallest-agreement:proposal:v1")).groups[1].name, "Residents");
});

test("print facilitator pack includes the veto-group count as one line without changing the saved draft", async () => {
  const html = await standaloneBytes();
  assert.match(html, /a one-line veto-group count/u);
  assert.match(html, /not a legal right/u);
  const noneFixed = {
    title: "Print zero veto-group count workshop",
    threshold: 70,
    groups: [
      { id: "open", name: "Residents", weight: 1 },
      { id: "other", name: "Open", weight: 1 },
    ],
    clauses: [{ id: "one", title: "Hours", options: [
      { id: "original", label: "Keep original hours", original: true, changeCost: 0, support: { open: 90, other: 80 } },
      { id: "mid", label: "Mid option", original: false, changeCost: 1, support: { open: 80, other: 70 } },
      { id: "other-opt", label: "Other option", original: false, changeCost: 2, support: { open: 70, other: 60 } },
    ] }],
  };
  const noneStorage = new Map([["smallest-agreement:proposal:v1", JSON.stringify(noneFixed)]]);
  const noneApp = await savedWorkbench(noneStorage);
  assert.match(noneApp.ballot(), /Veto groups: 0\. A veto is a number you entered, not a legal right/u);
  assert.match(noneApp.ballot(), /Participant groups: Residents, Open/u);
  noneApp.click("#print-button");
  assert.equal(noneApp.printCalls(), 1);
  assert.match(noneApp.ballot(), /Veto groups: 0/u);
  noneApp.click("#print-redacted-button");
  assert.equal(noneApp.printCalls(), 2);
  assert.match(noneApp.ballot(), /Participant groups: Group 1, Group 2/u);
  assert.match(noneApp.ballot(), /Veto groups: 0/u);
  assert.doesNotMatch(noneApp.ballot(), /Residents/u);
  assert.doesNotMatch(noneApp.ballot(), /[\u2014\u2013]/u);
  assert.equal(JSON.parse(noneStorage.get("smallest-agreement:proposal:v1")).groups[0].name, "Residents");

  const labelled = {
    title: "Print veto-group count workshop",
    threshold: 70,
    groups: [
      { id: "open", name: "Open", weight: 1 },
      { id: "veto", name: "Residents", weight: 1, veto: true },
      { id: "later", name: "Later veto", weight: 1, veto: true },
    ],
    clauses: [{ id: "one", title: "Hours", options: [
      { id: "original", label: "Keep original hours", original: true, changeCost: 0, support: { open: 90, veto: 80, later: 80 } },
      { id: "mid", label: "Mid option", original: false, changeCost: 1, support: { open: 80, veto: 70, later: 70 } },
      { id: "other-opt", label: "Other option", original: false, changeCost: 2, support: { open: 70, veto: 60, later: 60 } },
    ] }],
  };
  const labelledStorage = new Map([["smallest-agreement:proposal:v1", JSON.stringify(labelled)]]);
  const labelledApp = await savedWorkbench(labelledStorage);
  assert.match(labelledApp.ballot(), /Veto groups: 2\. A veto is a number you entered, not a legal right/u);
  assert.doesNotMatch(labelledApp.ballot(), /Veto groups: 1/u);
  labelledApp.click("#print-redacted-button");
  assert.match(labelledApp.ballot(), /Participant groups: Group 1, Group 2, Group 3/u);
  assert.match(labelledApp.ballot(), /Veto groups: 2/u);
  assert.doesNotMatch(labelledApp.ballot(), /[\u2014\u2013]/u);
  assert.equal(JSON.parse(labelledStorage.get("smallest-agreement:proposal:v1")).groups[1].name, "Residents");
});

test("print facilitator pack includes the first non-veto group label as one line without changing the saved draft", async () => {
  const html = await standaloneBytes();
  assert.match(html, /the first non-veto group label as one line/u);
  assert.match(html, /not a legal right/u);
  const noneFixed = {
    title: "Print no non-veto group workshop",
    threshold: 70,
    groups: [
      { id: "veto", name: "Residents", weight: 1, veto: true },
      { id: "later", name: "Later veto", weight: 1, veto: true },
    ],
    clauses: [{ id: "one", title: "Hours", options: [
      { id: "original", label: "Keep original hours", original: true, changeCost: 0, support: { veto: 90, later: 80 } },
      { id: "mid", label: "Mid option", original: false, changeCost: 1, support: { veto: 80, later: 70 } },
      { id: "other-opt", label: "Other option", original: false, changeCost: 2, support: { veto: 70, later: 60 } },
    ] }],
  };
  const noneStorage = new Map([["smallest-agreement:proposal:v1", JSON.stringify(noneFixed)]]);
  const noneApp = await savedWorkbench(noneStorage);
  assert.match(noneApp.ballot(), /No non-veto group is marked, so there is no first non-veto group label to copy\. A veto is a number you entered, not a legal right\. The label is not a legal identity/u);
  assert.match(noneApp.ballot(), /Participant groups: Residents, Later veto/u);
  noneApp.click("#print-button");
  assert.equal(noneApp.printCalls(), 1);
  assert.match(noneApp.ballot(), /No non-veto group is marked/u);
  noneApp.click("#print-redacted-button");
  assert.equal(noneApp.printCalls(), 2);
  assert.match(noneApp.ballot(), /Participant groups: Group 1, Group 2/u);
  assert.match(noneApp.ballot(), /No non-veto group is marked/u);
  assert.doesNotMatch(noneApp.ballot(), /Residents/u);
  assert.equal(JSON.parse(noneStorage.get("smallest-agreement:proposal:v1")).groups[0].name, "Residents");

  const labelled = {
    title: "Print first non-veto group workshop",
    threshold: 70,
    groups: [
      { id: "veto", name: "Veto first", weight: 1, veto: true },
      { id: "open", name: "Residents", weight: 1 },
      { id: "later", name: "Later open", weight: 1 },
    ],
    clauses: [{ id: "one", title: "Hours", options: [
      { id: "original", label: "Keep original hours", original: true, changeCost: 0, support: { veto: 90, open: 80, later: 80 } },
      { id: "mid", label: "Mid option", original: false, changeCost: 1, support: { veto: 80, open: 70, later: 70 } },
      { id: "other-opt", label: "Other option", original: false, changeCost: 2, support: { veto: 70, open: 60, later: 60 } },
    ] }],
  };
  const labelledStorage = new Map([["smallest-agreement:proposal:v1", JSON.stringify(labelled)]]);
  const labelledApp = await savedWorkbench(labelledStorage);
  assert.match(labelledApp.ballot(), /First non-veto group: Residents\. A veto is a number you entered, not a legal right\. The label is not a legal identity/u);
  assert.doesNotMatch(labelledApp.ballot(), /First non-veto group: Later open/u);
  assert.doesNotMatch(labelledApp.ballot(), /First non-veto group: Veto first/u);
  labelledApp.click("#print-redacted-button");
  assert.match(labelledApp.ballot(), /Participant groups: Group 1, Group 2, Group 3/u);
  assert.match(labelledApp.ballot(), /First non-veto group: Group 2/u);
  assert.doesNotMatch(labelledApp.ballot(), /Residents/u);
  assert.equal(JSON.parse(labelledStorage.get("smallest-agreement:proposal:v1")).groups[1].name, "Residents");
});

test("print facilitator pack includes the last veto group label as redacted Group 1-N without changing the saved draft", async () => {
  const html = await standaloneBytes();
  assert.match(html, /the last veto group label as one line/u);
  assert.match(html, /not a legal right/u);
  const noneFixed = {
    title: "Print no last veto group workshop",
    threshold: 70,
    groups: [
      { id: "open", name: "Residents", weight: 1 },
      { id: "later", name: "Later open", weight: 1 },
    ],
    clauses: [{ id: "one", title: "Hours", options: [
      { id: "original", label: "Keep original hours", original: true, changeCost: 0, support: { open: 90, later: 80 } },
      { id: "mid", label: "Mid option", original: false, changeCost: 1, support: { open: 80, later: 70 } },
      { id: "other-opt", label: "Other option", original: false, changeCost: 2, support: { open: 70, later: 60 } },
    ] }],
  };
  const noneStorage = new Map([["smallest-agreement:proposal:v1", JSON.stringify(noneFixed)]]);
  const noneApp = await savedWorkbench(noneStorage);
  assert.match(noneApp.ballot(), /No veto group is marked, so there is no last veto group label to copy\. A veto is a number you entered, not a legal right/u);
  assert.match(noneApp.ballot(), /Participant groups: Residents, Later open/u);
  noneApp.click("#print-button");
  assert.equal(noneApp.printCalls(), 1);
  assert.match(noneApp.ballot(), /No veto group is marked/u);
  noneApp.click("#print-redacted-button");
  assert.equal(noneApp.printCalls(), 2);
  assert.match(noneApp.ballot(), /Participant groups: Group 1, Group 2/u);
  assert.match(noneApp.ballot(), /No veto group is marked/u);
  assert.doesNotMatch(noneApp.ballot(), /Residents/u);
  assert.doesNotMatch(noneApp.ballot(), /[\u2014\u2013]/u);
  assert.equal(JSON.parse(noneStorage.get("smallest-agreement:proposal:v1")).groups[0].name, "Residents");

  const labelled = {
    title: "Print last veto group workshop",
    threshold: 70,
    groups: [
      { id: "open", name: "Open", weight: 1 },
      { id: "veto", name: "Residents", weight: 1, veto: true },
      { id: "later", name: "Later veto", weight: 1, veto: true },
    ],
    clauses: [{ id: "one", title: "Hours", options: [
      { id: "original", label: "Keep original hours", original: true, changeCost: 0, support: { open: 90, veto: 80, later: 80 } },
      { id: "mid", label: "Mid option", original: false, changeCost: 1, support: { open: 80, veto: 70, later: 70 } },
      { id: "other-opt", label: "Other option", original: false, changeCost: 2, support: { open: 70, veto: 60, later: 60 } },
    ] }],
  };
  const labelledStorage = new Map([["smallest-agreement:proposal:v1", JSON.stringify(labelled)]]);
  const labelledApp = await savedWorkbench(labelledStorage);
  assert.match(labelledApp.ballot(), /Last veto group: Later veto\. A veto is a number you entered, not a legal right/u);
  assert.doesNotMatch(labelledApp.ballot(), /Last veto group: Residents/u);
  labelledApp.click("#print-redacted-button");
  assert.match(labelledApp.ballot(), /Participant groups: Group 1, Group 2, Group 3/u);
  assert.match(labelledApp.ballot(), /Last veto group: Group 3/u);
  assert.doesNotMatch(labelledApp.ballot(), /Later veto/u);
  assert.doesNotMatch(labelledApp.ballot(), /Residents/u);
  assert.doesNotMatch(labelledApp.ballot(), /[\u2014\u2013]/u);
  assert.equal(JSON.parse(labelledStorage.get("smallest-agreement:proposal:v1")).groups[2].name, "Later veto");
});

test("print facilitator pack includes the numeric approval threshold without changing the saved draft", async () => {
  const html = await standaloneBytes();
  assert.match(html, /numeric approval threshold on the worksheet/u);
  assert.match(html, /not a legal quorum/u);
  const storage = new Map();
  const app = await savedWorkbench(storage);
  app.setTitle("Workshop draft for threshold print");
  assert.match(app.ballot(), /Approval threshold: 68\.0%/u);
  assert.match(app.ballot(), /not a legal quorum/u);
  assert.match(app.ballot(), /Participant groups: Residents, Shopkeepers, Park stewards/u);
  app.click("#print-button");
  assert.equal(app.printCalls(), 1);
  assert.match(app.ballot(), /Approval threshold: 68\.0%/u);
  app.click("#print-redacted-button");
  assert.equal(app.printCalls(), 2);
  assert.match(app.ballot(), /Participant groups: Group 1, Group 2, Group 3/u);
  assert.match(app.ballot(), /Approval threshold: 68\.0%/u);
  assert.doesNotMatch(app.ballot(), /Residents/u);
  assert.equal(JSON.parse(storage.get("smallest-agreement:proposal:v1")).groups[0].name, "Residents");
  assert.equal(JSON.parse(storage.get("smallest-agreement:proposal:v1")).threshold, 68);

  const exact = {
    title: "Print threshold workshop",
    threshold: 70,
    groups: [{ id: "g", name: "Residents", weight: 1 }],
    clauses: [{ id: "one", title: "One", options: [
      { id: "original", label: "Keep original", original: true, changeCost: 0, support: { g: 90 } },
      { id: "alt", label: "Alt", original: false, changeCost: 2, support: { g: 40 } },
      { id: "other", label: "Other", original: false, changeCost: 8, support: { g: 20 } },
    ] }],
  };
  const exactStorage = new Map([["smallest-agreement:proposal:v1", JSON.stringify(exact)]]);
  const exactApp = await savedWorkbench(exactStorage);
  assert.match(exactApp.ballot(), /Approval threshold: 70\.0%\. This is a number you entered, not a legal quorum/u);
  exactApp.click("#print-redacted-button");
  assert.match(exactApp.ballot(), /Participant groups: Group 1/u);
  assert.match(exactApp.ballot(), /Approval threshold: 70\.0%/u);
  assert.doesNotMatch(exactApp.ballot(), /Residents/u);
  assert.equal(JSON.parse(exactStorage.get("smallest-agreement:proposal:v1")).groups[0].name, "Residents");
  assert.equal(JSON.parse(exactStorage.get("smallest-agreement:proposal:v1")).threshold, 70);
});

test("print redacted replaces group display names without changing the saved draft", async () => {
  const storage = new Map();
  const app = await savedWorkbench(storage);
  app.setTitle("Workshop draft for redacted print");
  app.edit("group-floor", 40, { field: "group-floor", groupId: "residents" });
  assert.match(app.coalition(), /Residents/u);
  assert.match(app.sideBySide(), /Residents/u);
  assert.match(app.constraints(), /Residents support/u);
  assert.match(app.ballot(), /Participant groups: Residents, Shopkeepers, Park stewards/u);
  assert.match(app.groups(), /Residents/u);
  app.click("#print-button");
  assert.equal(app.printCalls(), 1);
  assert.match(app.coalition(), /Residents/u);
  app.click("#print-redacted-button");
  assert.equal(app.printCalls(), 2);
  assert.match(app.coalition(), /Group 1/u);
  assert.match(app.coalition(), /Group 2/u);
  assert.match(app.coalition(), /Group 3/u);
  assert.doesNotMatch(app.coalition(), /Residents/u);
  assert.match(app.sideBySide(), /Group 1/u);
  assert.doesNotMatch(app.sideBySide(), /Residents/u);
  assert.match(app.constraints(), /Group 1 support/u);
  assert.doesNotMatch(app.constraints(), /Residents/u);
  assert.match(app.ballot(), /Participant groups: Group 1, Group 2, Group 3/u);
  assert.doesNotMatch(app.ballot(), /Residents/u);
  assert.match(app.groups(), /Residents/u);
  const saved = JSON.parse(storage.get("smallest-agreement:proposal:v1"));
  assert.equal(saved.groups[0].name, "Residents");
  assert.equal(saved.groups[1].name, "Shopkeepers");
  assert.equal(saved.groups[2].name, "Park stewards");
});

test("moving a clause changes documented tie-breaker order and supports undo", async () => {
  const storage = new Map();
  const app = await savedWorkbench(storage);
  app.setTitle("Workshop draft for clause order");
  const before = JSON.parse(storage.get("smallest-agreement:proposal:v1"));
  app.clickAction("move-clause", { clauseId: "hours", direction: "up" });
  assert.match(app.message(), /Could not move that clause/u);
  assert.equal(JSON.parse(storage.get("smallest-agreement:proposal:v1")).clauses[0].id, "hours");
  app.clickAction("move-clause", { clauseId: "hours", direction: "down" });
  const after = JSON.parse(storage.get("smallest-agreement:proposal:v1"));
  assert.equal(after.clauses[0].id, before.clauses[1].id);
  assert.equal(after.clauses[1].id, "hours");
  app.click("#undo-button");
  assert.equal(JSON.parse(storage.get("smallest-agreement:proposal:v1")).clauses[0].id, "hours");
});

test("duplicate option copies an alternative's scores and cost with a new identifier", async () => {
  const storage = new Map();
  const app = await savedWorkbench(storage);
  app.setTitle("Workshop draft for option copies");
  const before = JSON.parse(storage.get("smallest-agreement:proposal:v1"));
  const source = before.clauses[0].options[1];
  app.clickAction("duplicate-option", { clauseId: "hours", optionId: source.id });
  const after = JSON.parse(storage.get("smallest-agreement:proposal:v1"));
  const copy = after.clauses[0].options.at(-1);
  assert.equal(after.clauses[0].options.length, before.clauses[0].options.length + 1);
  assert.equal(copy.original, false);
  assert.equal(copy.id === source.id, false);
  assert.equal(copy.label, `${source.label} (copy)`);
  assert.equal(copy.changeCost, source.changeCost);
  assert.deepEqual(copy.support, source.support);
  app.clickAction("duplicate-option", { clauseId: "hours", optionId: source.id });
  assert.equal(JSON.parse(storage.get("smallest-agreement:proposal:v1")).clauses[0].options.at(-1).label, `${source.label} (copy 2)`);
  app.clickAction("duplicate-option", { clauseId: "hours", optionId: "hours-original" });
  const fromOriginal = JSON.parse(storage.get("smallest-agreement:proposal:v1")).clauses[0].options.at(-1);
  assert.equal(fromOriginal.original, false);
  assert.equal(fromOriginal.changeCost, 0);
  app.click("#undo-button");
  app.click("#undo-button");
  app.click("#undo-button");
  assert.equal(JSON.parse(storage.get("smallest-agreement:proposal:v1")).clauses[0].options.length, before.clauses[0].options.length);
});

test("duplicate group copies weight and support scores with a unique id and supports undo", async () => {
  const storage = new Map();
  const app = await savedWorkbench(storage);
  app.setTitle("Workshop draft for group copies");
  const before = JSON.parse(storage.get("smallest-agreement:proposal:v1"));
  const source = before.groups[0];
  app.clickAction("duplicate-group", { groupId: source.id });
  const after = JSON.parse(storage.get("smallest-agreement:proposal:v1"));
  assert.equal(after.groups.length, before.groups.length + 1);
  const copy = after.groups[1];
  assert.equal(copy.id === source.id, false);
  assert.equal(copy.name, `${source.name} (copy)`);
  assert.equal(copy.weight, source.weight);
  assert.equal(after.clauses[0].options[0].support[copy.id], before.clauses[0].options[0].support[source.id]);
  assert.match(app.groups(), /Duplicate group/u);
  app.clickAction("duplicate-group", { groupId: source.id });
  const names = JSON.parse(storage.get("smallest-agreement:proposal:v1")).groups.map((group) => group.name);
  assert.equal(names.includes(`${source.name} (copy)`), true);
  assert.equal(names.includes(`${source.name} (copy 2)`), true);
  assert.equal(new Set(names).size, names.length);
  app.click("#undo-button");
  app.click("#undo-button");
  assert.equal(JSON.parse(storage.get("smallest-agreement:proposal:v1")).groups.length, before.groups.length);
});

test("duplicate clause copies options and locks with new identifiers and supports undo", async () => {
  const storage = new Map();
  const app = await savedWorkbench(storage);
  app.setTitle("Workshop draft for duplication");
  const before = JSON.parse(storage.get("smallest-agreement:proposal:v1"));
  app.clickAction("duplicate-clause", { clauseId: "hours" });
  const after = JSON.parse(storage.get("smallest-agreement:proposal:v1"));
  assert.equal(after.clauses.length, before.clauses.length + 1);
  assert.equal(after.clauses[1].title, "Park access hours (copy)");
  assert.equal(after.clauses[1].id === "hours", false);
  assert.equal(after.clauses[1].options[0].id === "hours-original", false);
  assert.equal(after.clauses[1].options[0].label, before.clauses[0].options[0].label);
  assert.match(app.clauses(), /Park access hours \(copy\)/u);
  app.click("#undo-button");
  assert.equal(JSON.parse(storage.get("smallest-agreement:proposal:v1")).clauses.length, before.clauses.length);
});

test("clause filter matches title or option labels without changing the stored draft", async () => {
  const storage = new Map();
  const app = await savedWorkbench(storage);
  const before = storage.get("smallest-agreement:proposal:v1");
  app.filterClauses("zzzz-no-match");
  assert.match(app.clauses(), /No clauses match this filter/u);
  assert.match(app.filterStatus(), /No clauses match this filter/u);
  assert.equal(storage.get("smallest-agreement:proposal:v1"), before);
  app.filterClauses("Park access");
  assert.match(app.clauses(), /Park access hours/u);
  assert.doesNotMatch(app.clauses(), /Weekend market use/u);
  assert.match(app.filterStatus(), /Showing 1 of 3 clauses/u);
  app.filterClauses("clean-up bond");
  assert.match(app.clauses(), /Weekend market use/u);
  assert.doesNotMatch(app.clauses(), /Park access hours/u);
  assert.equal(storage.get("smallest-agreement:proposal:v1"), before);
});

test("clause filter live region announces when no clauses match", async () => {
  const html = await standaloneBytes();
  assert.match(html, /id="clause-filter-status"[^>]*role="status"/u);
  assert.match(html, /id="clause-filter-status"[^>]*aria-live="polite"/u);
  const app = await savedWorkbench(new Map());
  assert.equal(app.filterStatus(), "");
  app.filterClauses("no-such-clause-zzzz");
  assert.match(app.filterStatus(), /No clauses match this filter/u);
  app.filterClauses("");
  assert.equal(app.filterStatus(), "");
});

test("hide-unlocked-clauses hides unlocked cards without changing the stored draft", async () => {
  const html = await standaloneBytes();
  assert.match(html, /id="hide-unlocked-clauses"/u);
  assert.match(html, /Hide unlocked clauses/u);
  const storage = new Map();
  const app = await savedWorkbench(storage);
  const before = storage.get("smallest-agreement:proposal:v1");
  app.filterHideUnlockedClauses(true);
  assert.match(app.clauses(), /No clauses remain after hiding unlocked clauses/u);
  assert.match(app.filterStatus(), /No clauses remain after hiding unlocked clauses/u);
  assert.match(app.ballot(), /Park access hours/u);
  assert.match(app.ballot(), /Weekend market use/u);
  assert.equal(storage.get("smallest-agreement:proposal:v1"), before);
  app.filterLockedClauses(true);
  assert.match(app.clauses(), /No clauses remain after hiding unlocked clauses/u);
  app.filterLockedClauses(false);
  app.filterChangedClauses(true);
  assert.match(app.clauses(), /No clauses differ between the original and recommended packages/u);
  app.filterChangedClauses(false);
  app.filterHideUnlockedClauses(false);
  assert.match(app.clauses(), /Park access hours/u);
  app.clickAction("toggle-clause-lock", { clauseId: "hours", optionId: "hours-pilot" });
  app.filterHideUnlockedClauses(true);
  assert.match(app.clauses(), /Park access hours/u);
  assert.doesNotMatch(app.clauses(), /Weekend market use/u);
  assert.doesNotMatch(app.clauses(), /Path lighting/u);
  assert.match(app.filterStatus(), /Showing 1 of 3 clauses/u);
  assert.match(app.ballot(), /Weekend market use/u);
  assert.equal(JSON.parse(storage.get("smallest-agreement:workspace:v1")).hideUnlockedClauses, true);
  assert.equal(Object.hasOwn(JSON.parse(storage.get("smallest-agreement:proposal:v1")), "hideUnlockedClauses"), false);
  const saved = JSON.parse(storage.get("smallest-agreement:proposal:v1"));
  assert.equal(saved.clauses.length, 3);
  app.clearFocus();
  app.keydown("k");
  assert.equal(app.focused(), '[data-field="clause-title"][data-clause-id="market"]');
  assert.match(app.clauses(), /Weekend market use/u);
  assert.equal(JSON.parse(storage.get("smallest-agreement:workspace:v1")).hideUnlockedClauses, false);
});

test("hide-locked-clauses hides locked cards without changing the stored draft", async () => {
  const html = await standaloneBytes();
  assert.match(html, /id="hide-locked-clauses"/u);
  assert.match(html, /Hide locked clauses/u);
  const storage = new Map();
  const app = await savedWorkbench(storage);
  const before = storage.get("smallest-agreement:proposal:v1");
  app.filterHideLockedClauses(true);
  assert.match(app.clauses(), /Park access hours/u);
  assert.match(app.clauses(), /Weekend market use/u);
  assert.match(app.ballot(), /Park access hours/u);
  assert.equal(storage.get("smallest-agreement:proposal:v1"), before);
  app.clickAction("toggle-clause-lock", { clauseId: "hours", optionId: "hours-pilot" });
  app.filterHideLockedClauses(true);
  assert.doesNotMatch(app.clauses(), /Park access hours/u);
  assert.match(app.clauses(), /Weekend market use/u);
  assert.match(app.clauses(), /Path lighting/u);
  assert.match(app.filterStatus(), /Showing 2 of 3 clauses/u);
  assert.match(app.ballot(), /Park access hours/u);
  assert.equal(JSON.parse(storage.get("smallest-agreement:workspace:v1")).hideLockedClauses, true);
  assert.equal(Object.hasOwn(JSON.parse(storage.get("smallest-agreement:proposal:v1")), "hideLockedClauses"), false);
  const saved = JSON.parse(storage.get("smallest-agreement:proposal:v1"));
  assert.equal(saved.clauses.length, 3);
  app.filterLockedClauses(true);
  assert.match(app.clauses(), /No clauses remain after hiding locked clauses/u);
  app.filterLockedClauses(false);
  app.filterHideUnlockedClauses(true);
  assert.match(app.clauses(), /No clauses remain after hiding unlocked clauses/u);
  app.filterHideUnlockedClauses(false);
  app.clearFocus();
  app.keydown(".");
  assert.equal(app.focused(), '[data-field="clause-title"][data-clause-id="hours"]');
  assert.match(app.clauses(), /Park access hours/u);
  assert.equal(JSON.parse(storage.get("smallest-agreement:workspace:v1")).hideLockedClauses, false);
});

test("locked-clause filter hides unlocked cards without changing the stored draft", async () => {
  const html = await standaloneBytes();
  assert.match(html, /id="locked-clauses-only"/u);
  assert.match(html, /Show locked clauses only/u);
  assert.match(html, /draft choice, not a recorded vote/u);
  const storage = new Map();
  const app = await savedWorkbench(storage);
  const before = storage.get("smallest-agreement:proposal:v1");
  app.filterLockedClauses(true);
  assert.match(app.clauses(), /No locked clauses match this filter/u);
  assert.match(app.filterStatus(), /No locked clauses match this filter/u);
  assert.doesNotMatch(app.alert(), /Fix the proposal/u);
  assert.match(app.ballot(), /Park access hours/u);
  assert.match(app.ballot(), /Weekend market use/u);
  assert.equal(storage.get("smallest-agreement:proposal:v1"), before);
  app.filterLockedClauses(false);
  app.clickAction("toggle-clause-lock", { clauseId: "hours", optionId: "hours-pilot" });
  app.filterLockedClauses(true);
  assert.match(app.clauses(), /Park access hours/u);
  assert.doesNotMatch(app.clauses(), /Weekend market use/u);
  assert.doesNotMatch(app.clauses(), /Path lighting/u);
  assert.match(app.filterStatus(), /Showing 1 of 3 clauses/u);
  assert.match(app.ballot(), /Weekend market use/u);
  const saved = JSON.parse(storage.get("smallest-agreement:proposal:v1"));
  assert.equal(saved.clauses.length, 3);
  assert.equal(saved.clauses.find((clause) => clause.id === "hours").lockedOptionId, "hours-pilot");
});

test("changed-clause filter hides unchanged cards without changing the stored draft", async () => {
  const html = await standaloneBytes();
  assert.match(html, /id="changed-clauses-only"/u);
  assert.match(html, /Show clauses that differ from the recommendation/u);
  const storage = new Map();
  const app = await savedWorkbench(storage);
  const before = storage.get("smallest-agreement:proposal:v1");
  app.filterChangedClauses(true);
  assert.match(app.clauses(), /No clauses differ between the original and recommended packages/u);
  assert.match(app.filterStatus(), /No clauses differ between the original and recommended packages/u);
  assert.match(app.ballot(), /Park access hours/u);
  assert.equal(storage.get("smallest-agreement:proposal:v1"), before);
  const draft = {
    title: "Changed clause filter workshop",
    threshold: 70,
    groups: [{ id: "g", name: "Group", weight: 1 }],
    clauses: [
      { id: "one", title: "Keep this", options: [
        { id: "one-original", label: "Original one", original: true, changeCost: 0, support: { g: 90 } },
        { id: "one-alt", label: "Alt one", original: false, changeCost: 1, support: { g: 40 } },
        { id: "one-other", label: "Other one", original: false, changeCost: 2, support: { g: 20 } },
      ] },
      { id: "two", title: "Change this", options: [
        { id: "two-original", label: "Original two", original: true, changeCost: 0, support: { g: 40 } },
        { id: "two-alt", label: "Alt two", original: false, changeCost: 1, support: { g: 90 } },
        { id: "two-other", label: "Other two", original: false, changeCost: 8, support: { g: 20 } },
      ] },
    ],
  };
  const filtered = await savedWorkbench(new Map([["smallest-agreement:proposal:v1", JSON.stringify(draft)]]));
  filtered.filterChangedClauses(true);
  assert.match(filtered.clauses(), /Change this/u);
  assert.doesNotMatch(filtered.clauses(), /Keep this/u);
  assert.match(filtered.filterStatus(), /Showing 1 of 2 clauses/u);
  assert.match(filtered.ballot(), /Keep this/u);
});

test("over-budget clause filter hides affordable remaining changes without changing the stored draft", async () => {
  const html = await standaloneBytes();
  assert.match(html, /id="over-budget-clauses-only"/u);
  assert.match(html, /Show clauses whose cheapest remaining change exceeds remaining budget/u);
  const storage = new Map();
  const app = await savedWorkbench(storage);
  const before = storage.get("smallest-agreement:proposal:v1");
  app.filterOverBudgetClauses(true);
  assert.match(app.clauses(), /No clauses have a cheapest remaining change that exceeds the remaining budget/u);
  assert.match(app.filterStatus(), /No clauses have a cheapest remaining change that exceeds the remaining budget/u);
  assert.match(app.ballot(), /Park access hours/u);
  assert.equal(storage.get("smallest-agreement:proposal:v1"), before);
  const draft = {
    title: "Over budget filter workshop",
    threshold: 70,
    maxChangeCost: 3,
    groups: [{ id: "g", name: "Group", weight: 1 }],
    clauses: [
      { id: "keep", title: "Keep this", options: [
        { id: "keep-original", label: "Original keep", original: true, changeCost: 0, support: { g: 90 } },
        { id: "keep-alt", label: "Costly keep", original: false, changeCost: 5, support: { g: 40 } },
        { id: "keep-other", label: "Other keep", original: false, changeCost: 8, support: { g: 20 } },
      ] },
      { id: "spend", title: "Spend this", options: [
        { id: "spend-original", label: "Original spend", original: true, changeCost: 0, support: { g: 40 } },
        { id: "spend-alt", label: "Alt spend", original: false, changeCost: 2, support: { g: 90 } },
        { id: "spend-other", label: "Other spend", original: false, changeCost: 8, support: { g: 20 } },
      ] },
    ],
  };
  const filtered = await savedWorkbench(new Map([["smallest-agreement:proposal:v1", JSON.stringify(draft)]]));
  filtered.filterOverBudgetClauses(true);
  assert.match(filtered.clauses(), /Keep this/u);
  assert.doesNotMatch(filtered.clauses(), /Spend this/u);
  assert.match(filtered.filterStatus(), /Showing 1 of 2 clauses/u);
  assert.match(filtered.ballot(), /Spend this/u);
  assert.doesNotMatch(filtered.alert(), /Fix the proposal/u);
  const exhausted = {
    title: "Exhausted budget filter workshop",
    threshold: 70,
    maxChangeCost: 2,
    groups: [{ id: "g", name: "Group", weight: 1 }],
    clauses: [
      { id: "one", title: "First clause", options: [
        { id: "one-original", label: "Original one", original: true, changeCost: 0, support: { g: 40 } },
        { id: "one-alt", label: "Alt one", original: false, changeCost: 2, support: { g: 90 } },
        { id: "one-other", label: "Other one", original: false, changeCost: 8, support: { g: 20 } },
      ] },
      { id: "two", title: "Second clause", options: [
        { id: "two-original", label: "Original two", original: true, changeCost: 0, support: { g: 90 } },
        { id: "two-alt", label: "Alt two", original: false, changeCost: 1, support: { g: 40 } },
        { id: "two-other", label: "Other two", original: false, changeCost: 8, support: { g: 20 } },
      ] },
    ],
  };
  const spent = await savedWorkbench(new Map([["smallest-agreement:proposal:v1", JSON.stringify(exhausted)]]));
  spent.filterOverBudgetClauses(true);
  assert.match(spent.clauses(), /First clause/u);
  assert.match(spent.clauses(), /Second clause/u);
  assert.match(spent.filterStatus(), /Showing 2 of 2 clauses/u);
});

test("no-cheaper-remaining clause filter hides clauses that still have a cheaper option than the recommendation", async () => {
  const html = await standaloneBytes();
  assert.match(html, /id="no-cheaper-remaining-clauses-only"/u);
  assert.match(html, /Show clauses with no remaining cheaper option than the recommendation/u);
  const storage = new Map();
  const app = await savedWorkbench(storage);
  const before = storage.get("smallest-agreement:proposal:v1");
  app.filterNoCheaperRemainingClauses(true);
  assert.match(app.clauses(), /Park access hours/u);
  assert.match(app.clauses(), /Weekend market use/u);
  assert.match(app.clauses(), /Path lighting/u);
  assert.match(app.filterStatus(), /Showing 3 of 3 clauses/u);
  assert.match(app.ballot(), /Park access hours/u);
  assert.equal(storage.get("smallest-agreement:proposal:v1"), before);
  const draft = {
    title: "No cheaper remaining workshop",
    threshold: 70,
    groups: [{ id: "g", name: "Group", weight: 1 }],
    clauses: [
      { id: "keep", title: "Keep this", options: [
        { id: "keep-original", label: "Original keep", original: true, changeCost: 0, support: { g: 90 } },
        { id: "keep-alt", label: "Alt keep", original: false, changeCost: 5, support: { g: 40 } },
        { id: "keep-other", label: "Other keep", original: false, changeCost: 8, support: { g: 20 } },
      ] },
      { id: "spend", title: "Change this", options: [
        { id: "spend-original", label: "Original spend", original: true, changeCost: 0, support: { g: 40 } },
        { id: "spend-alt", label: "Alt spend", original: false, changeCost: 2, support: { g: 90 } },
        { id: "spend-other", label: "Other spend", original: false, changeCost: 8, support: { g: 20 } },
      ] },
    ],
  };
  const filteredStorage = new Map([["smallest-agreement:proposal:v1", JSON.stringify(draft)]]);
  const filtered = await savedWorkbench(filteredStorage);
  filtered.filterNoCheaperRemainingClauses(true);
  assert.match(filtered.clauses(), /Keep this/u);
  assert.doesNotMatch(filtered.clauses(), /Change this/u);
  assert.match(filtered.filterStatus(), /Showing 1 of 2 clauses/u);
  assert.match(filtered.ballot(), /Change this/u);
  filtered.filterLockedClauses(true);
  assert.match(filtered.clauses(), /No locked clauses match this filter/u);
  filtered.filterLockedClauses(false);
  filtered.filterOverBudgetClauses(true);
  assert.match(filtered.clauses(), /No clauses have a cheapest remaining change that exceeds the remaining budget/u);
  assert.equal(JSON.parse(filteredStorage.get("smallest-agreement:proposal:v1")).title, "No cheaper remaining workshop");
  assert.equal(JSON.parse(filteredStorage.get("smallest-agreement:workspace:v1")).noCheaperRemainingClausesOnly, true);
  assert.equal(Object.hasOwn(JSON.parse(filteredStorage.get("smallest-agreement:proposal:v1")), "noCheaperRemainingClausesOnly"), false);
  const allChanged = {
    title: "All cheaper remaining workshop",
    threshold: 70,
    groups: [{ id: "g", name: "Group", weight: 1 }],
    clauses: [
      { id: "one", title: "First change", options: [
        { id: "one-original", label: "Original one", original: true, changeCost: 0, support: { g: 40 } },
        { id: "one-alt", label: "Alt one", original: false, changeCost: 1, support: { g: 90 } },
        { id: "one-other", label: "Other one", original: false, changeCost: 8, support: { g: 20 } },
      ] },
      { id: "two", title: "Second change", options: [
        { id: "two-original", label: "Original two", original: true, changeCost: 0, support: { g: 40 } },
        { id: "two-alt", label: "Alt two", original: false, changeCost: 2, support: { g: 90 } },
        { id: "two-other", label: "Other two", original: false, changeCost: 8, support: { g: 20 } },
      ] },
    ],
  };
  const empty = await savedWorkbench(new Map([["smallest-agreement:proposal:v1", JSON.stringify(allChanged)]]));
  empty.filterNoCheaperRemainingClauses(true);
  assert.match(empty.clauses(), /No clauses lack a remaining cheaper option than the recommendation/u);
  assert.match(empty.filterStatus(), /No clauses lack a remaining cheaper option than the recommendation/u);
  assert.match(empty.ballot(), /First change/u);
});

test("below-floor group filter hides groups that meet their floor or threshold", async () => {
  const html = await standaloneBytes();
  assert.match(html, /id="below-floor-groups-only"/u);
  assert.match(html, /Show groups below their support floor/u);
  const storage = new Map();
  const app = await savedWorkbench(storage);
  const before = storage.get("smallest-agreement:proposal:v1");
  app.filterBelowFloorGroups(true);
  assert.match(app.groups(), /Residents/u);
  assert.match(app.groups(), /Shopkeepers/u);
  assert.doesNotMatch(app.groups(), /Park stewards/u);
  assert.match(app.shares(), /Park stewards/u);
  assert.match(app.vetoGroupsStatus(), /Showing 2 of 3 groups/u);
  assert.equal(storage.get("smallest-agreement:proposal:v1"), before);
});

test("hide-groups-at-floor hides groups that meet a declared floor without changing the stored draft", async () => {
  const html = await standaloneBytes();
  assert.match(html, /id="hide-groups-at-floor"/u);
  assert.match(html, /Hide groups currently meeting their support floor/u);
  const storage = new Map();
  const app = await savedWorkbench(storage);
  const before = storage.get("smallest-agreement:proposal:v1");
  app.filterHideGroupsAtFloor(true);
  assert.match(app.groups(), /Residents/u);
  assert.match(app.groups(), /Shopkeepers/u);
  assert.match(app.groups(), /Park stewards/u);
  assert.equal(storage.get("smallest-agreement:proposal:v1"), before);
  const draft = {
    title: "Hide at floor workshop",
    threshold: 50,
    groups: [
      { id: "cleared", name: "Cleared", weight: 1, minSupport: 40 },
      { id: "open", name: "Open", weight: 1 },
      { id: "short", name: "Short", weight: 1, minSupport: 90 },
    ],
    clauses: [{ id: "one", title: "One", options: [
      { id: "original", label: "Keep original", original: true, changeCost: 0, support: { cleared: 90, open: 80, short: 20 } },
      { id: "mid", label: "Mid option", original: false, changeCost: 1, support: { cleared: 80, open: 70, short: 30 } },
      { id: "other", label: "Other option", original: false, changeCost: 2, support: { cleared: 70, open: 60, short: 40 } },
    ] }],
  };
  const filteredStorage = new Map([["smallest-agreement:proposal:v1", JSON.stringify(draft)]]);
  const filtered = await savedWorkbench(filteredStorage);
  filtered.filterHideGroupsAtFloor(true);
  assert.doesNotMatch(filtered.groups(), /data-group-id="cleared"/u);
  assert.match(filtered.groups(), /Open/u);
  assert.match(filtered.groups(), /Short/u);
  assert.match(filtered.shares(), /Cleared/u);
  assert.match(filtered.vetoGroupsStatus(), /Showing 2 of 3 groups/u);
  filtered.filterLockedClauses(true);
  assert.match(filtered.clauses(), /No locked clauses match this filter/u);
  filtered.filterLockedClauses(false);
  filtered.filterOverBudgetClauses(true);
  assert.match(filtered.clauses(), /No clauses have a cheapest remaining change that exceeds the remaining budget/u);
  assert.match(filtered.groups(), /Open/u);
  assert.doesNotMatch(filtered.groups(), /data-group-id="cleared"/u);
  assert.equal(JSON.parse(filteredStorage.get("smallest-agreement:proposal:v1")).title, "Hide at floor workshop");
  assert.equal(JSON.parse(filteredStorage.get("smallest-agreement:workspace:v1")).hideGroupsAtFloor, true);
  assert.equal(Object.hasOwn(JSON.parse(filteredStorage.get("smallest-agreement:proposal:v1")), "hideGroupsAtFloor"), false);
});

test("hide-groups-without-floors hides groups with no floor without changing the stored draft", async () => {
  const html = await standaloneBytes();
  assert.match(html, /id="hide-groups-without-floors"/u);
  assert.match(html, /Hide groups that have no support floor/u);
  const storage = new Map();
  const app = await savedWorkbench(storage);
  const before = storage.get("smallest-agreement:proposal:v1");
  app.filterHideGroupsWithoutFloors(true);
  assert.match(app.groups(), /No groups remain after hiding groups that have no support floor/u);
  assert.match(app.shares(), /Residents/u);
  assert.match(app.shares(), /Shopkeepers/u);
  assert.match(app.shares(), /Park stewards/u);
  assert.equal(storage.get("smallest-agreement:proposal:v1"), before);
  app.filterHideGroupsAtFloor(true);
  assert.match(app.groups(), /No groups remain after hiding groups that currently meet their support floor or have no support floor/u);
  app.filterHideGroupsAtFloor(false);
  app.filterLockedClauses(true);
  assert.match(app.clauses(), /No locked clauses match this filter/u);
  app.filterLockedClauses(false);
  app.filterChangedClauses(true);
  assert.match(app.clauses(), /No clauses differ between the original and recommended packages/u);
  app.filterChangedClauses(false);
  app.filterHideGroupsWithoutFloors(false);
  assert.match(app.groups(), /Residents/u);

  const protectedStorage = new Map();
  const protectedApp = await savedWorkbench(protectedStorage);
  protectedApp.field("#preset-select", "protected-access");
  protectedApp.click("#load-preset");
  const protectedBefore = protectedStorage.get("smallest-agreement:proposal:v1");
  protectedApp.filterHideGroupsWithoutFloors(true);
  assert.doesNotMatch(protectedApp.groups(), /data-group-id="regular"/u);
  assert.match(protectedApp.groups(), /New participants/u);
  assert.match(protectedApp.shares(), /Regular participants/u);
  assert.match(protectedApp.vetoGroupsStatus(), /Showing 1 of 2 groups/u);
  protectedApp.filterHideGroupsAtFloor(true);
  assert.match(protectedApp.groups(), /No groups remain after hiding groups that currently meet their support floor or have no support floor/u);
  assert.match(protectedApp.shares(), /Regular participants/u);
  protectedApp.filterHideGroupsAtFloor(false);
  assert.match(protectedApp.groups(), /New participants/u);
  assert.doesNotMatch(protectedApp.groups(), /data-group-id="regular"/u);
  assert.equal(JSON.parse(protectedStorage.get("smallest-agreement:proposal:v1")).title, "Protected Access: shared workshop");
  assert.equal(JSON.parse(protectedStorage.get("smallest-agreement:workspace:v1")).hideGroupsWithoutFloors, true);
  assert.equal(Object.hasOwn(JSON.parse(protectedStorage.get("smallest-agreement:proposal:v1")), "hideGroupsWithoutFloors"), false);
  assert.equal(protectedStorage.get("smallest-agreement:proposal:v1"), protectedBefore);

  const clubStorage = new Map();
  const club = await savedWorkbench(clubStorage);
  club.field("#preset-select", "club-constitution");
  club.click("#load-preset");
  club.filterHideGroupsWithoutFloors(true);
  assert.doesNotMatch(club.groups(), /data-group-id="officers"/u);
  club.clearFocus();
  club.keydown("y");
  assert.equal(club.focused(), '[data-field="group-name"][data-group-id="officers"]');
  assert.match(club.groups(), /Officers/u);
  assert.equal(JSON.parse(clubStorage.get("smallest-agreement:workspace:v1")).hideGroupsWithoutFloors, false);
});

test("hide-groups-meeting-threshold hides groups that meet the numeric threshold without changing the stored draft", async () => {
  const html = await standaloneBytes();
  assert.match(html, /id="hide-groups-meeting-threshold"/u);
  assert.match(html, /Hide groups currently meeting the approval threshold/u);
  const storage = new Map();
  const app = await savedWorkbench(storage);
  const before = storage.get("smallest-agreement:proposal:v1");
  app.filterHideGroupsMeetingThreshold(true);
  assert.equal(storage.get("smallest-agreement:proposal:v1"), before);
  const draft = {
    title: "Hide meeting threshold workshop",
    threshold: 70,
    groups: [
      { id: "cleared", name: "Cleared", weight: 1 },
      { id: "short", name: "Short", weight: 1 },
      { id: "floored", name: "Floored", weight: 1, minSupport: 90 },
    ],
    clauses: [{ id: "one", title: "One", options: [
      { id: "original", label: "Keep original", original: true, changeCost: 0, support: { cleared: 90, short: 20, floored: 20 } },
      { id: "mid", label: "Mid option", original: false, changeCost: 1, support: { cleared: 80, short: 30, floored: 30 } },
      { id: "other", label: "Other option", original: false, changeCost: 2, support: { cleared: 70, short: 40, floored: 40 } },
    ] }],
  };
  const filteredStorage = new Map([["smallest-agreement:proposal:v1", JSON.stringify(draft)]]);
  const filtered = await savedWorkbench(filteredStorage);
  filtered.filterHideGroupsMeetingThreshold(true);
  assert.doesNotMatch(filtered.groups(), /data-group-id="cleared"/u);
  assert.match(filtered.groups(), /Short/u);
  assert.match(filtered.groups(), /Floored/u);
  assert.match(filtered.shares(), /Cleared/u);
  assert.match(filtered.vetoGroupsStatus(), /Showing 2 of 3 groups/u);
  filtered.filterHideGroupsAtFloor(true);
  assert.match(filtered.groups(), /Short/u);
  assert.match(filtered.groups(), /Floored/u);
  assert.doesNotMatch(filtered.groups(), /data-group-id="cleared"/u);
  filtered.filterHideGroupsAtFloor(false);
  assert.equal(JSON.parse(filteredStorage.get("smallest-agreement:proposal:v1")).title, "Hide meeting threshold workshop");
  assert.equal(JSON.parse(filteredStorage.get("smallest-agreement:workspace:v1")).hideGroupsMeetingThreshold, true);
  assert.equal(Object.hasOwn(JSON.parse(filteredStorage.get("smallest-agreement:proposal:v1")), "hideGroupsMeetingThreshold"), false);
  filtered.filterHideGroupsMeetingThreshold(false);
  assert.match(filtered.groups(), /Cleared/u);
  const empty = await savedWorkbench(new Map([["smallest-agreement:proposal:v1", JSON.stringify({
    title: "All groups meet threshold",
    threshold: 10,
    groups: [{ id: "g", name: "Open", weight: 1 }],
    clauses: [{ id: "one", title: "One", options: [
      { id: "original", label: "Keep original", original: true, changeCost: 0, support: { g: 90 } },
      { id: "mid", label: "Mid option", original: false, changeCost: 1, support: { g: 80 } },
      { id: "other", label: "Other option", original: false, changeCost: 2, support: { g: 70 } },
    ] }],
  })]]));
  empty.filterHideGroupsMeetingThreshold(true);
  assert.match(empty.groups(), /No groups remain after hiding groups that currently meet the numeric approval threshold/u);
});

test("hide-groups-below-threshold hides groups below the numeric threshold without changing the stored draft", async () => {
  const html = await standaloneBytes();
  assert.match(html, /id="hide-groups-below-threshold"/u);
  assert.match(html, /Hide groups currently below the approval threshold/u);
  const storage = new Map();
  const app = await savedWorkbench(storage);
  const before = storage.get("smallest-agreement:proposal:v1");
  app.filterHideGroupsBelowThreshold(true);
  assert.equal(storage.get("smallest-agreement:proposal:v1"), before);
  const draft = {
    title: "Hide below threshold workshop",
    threshold: 70,
    groups: [
      { id: "cleared", name: "Cleared", weight: 1 },
      { id: "short", name: "Short", weight: 1 },
      { id: "floored", name: "Floored", weight: 1, minSupport: 90 },
    ],
    clauses: [{ id: "one", title: "One", options: [
      { id: "original", label: "Keep original", original: true, changeCost: 0, support: { cleared: 90, short: 20, floored: 20 } },
      { id: "mid", label: "Mid option", original: false, changeCost: 1, support: { cleared: 80, short: 30, floored: 30 } },
      { id: "other", label: "Other option", original: false, changeCost: 2, support: { cleared: 70, short: 40, floored: 40 } },
    ] }],
  };
  const filteredStorage = new Map([["smallest-agreement:proposal:v1", JSON.stringify(draft)]]);
  const filtered = await savedWorkbench(filteredStorage);
  filtered.filterHideGroupsBelowThreshold(true);
  assert.doesNotMatch(filtered.groups(), /data-group-id="short"/u);
  assert.doesNotMatch(filtered.groups(), /data-group-id="floored"/u);
  assert.match(filtered.groups(), /Cleared/u);
  assert.match(filtered.shares(), /Short/u);
  assert.match(filtered.vetoGroupsStatus(), /Showing 1 of 3 groups/u);
  filtered.filterHideGroupsMeetingThreshold(true);
  assert.match(filtered.groups(), /No groups remain after hiding groups that currently meet the numeric approval threshold or are below the numeric approval threshold/u);
  assert.match(filtered.shares(), /Cleared/u);
  filtered.filterHideGroupsMeetingThreshold(false);
  assert.equal(JSON.parse(filteredStorage.get("smallest-agreement:proposal:v1")).title, "Hide below threshold workshop");
  assert.equal(JSON.parse(filteredStorage.get("smallest-agreement:workspace:v1")).hideGroupsBelowThreshold, true);
  assert.equal(Object.hasOwn(JSON.parse(filteredStorage.get("smallest-agreement:proposal:v1")), "hideGroupsBelowThreshold"), false);
  filtered.filterHideGroupsBelowThreshold(false);
  assert.match(filtered.groups(), /Short/u);
  const empty = await savedWorkbench(new Map([["smallest-agreement:proposal:v1", JSON.stringify({
    title: "All groups are below threshold",
    threshold: 95,
    groups: [{ id: "g", name: "Open", weight: 1 }],
    clauses: [{ id: "one", title: "One", options: [
      { id: "original", label: "Keep original", original: true, changeCost: 0, support: { g: 40 } },
      { id: "mid", label: "Mid option", original: false, changeCost: 1, support: { g: 30 } },
      { id: "other", label: "Other option", original: false, changeCost: 2, support: { g: 20 } },
    ] }],
  })]]));
  empty.filterHideGroupsBelowThreshold(true);
  assert.match(empty.groups(), /No groups remain after hiding groups whose average is below the numeric approval threshold/u);
});

test("hide-veto-groups hides veto group cards without changing the stored draft", async () => {
  const html = await standaloneBytes();
  assert.match(html, /id="hide-veto-groups"/u);
  assert.match(html, /Hide veto groups/u);
  assert.match(html, /a number you entered, not a legal right/u);
  const storage = new Map();
  const app = await savedWorkbench(storage);
  const before = storage.get("smallest-agreement:proposal:v1");
  app.filterHideVetoGroups(true);
  assert.equal(storage.get("smallest-agreement:proposal:v1"), before);
  assert.match(app.groups(), /Residents/u);
  app.filterHideVetoGroups(false);
  app.field("#preset-select", "club-constitution");
  app.click("#load-preset");
  const clubBefore = storage.get("smallest-agreement:proposal:v1");
  app.filterHideVetoGroups(true);
  assert.doesNotMatch(app.groups(), /data-group-id="officers"/u);
  assert.match(app.groups(), /Members/u);
  assert.match(app.groups(), /Club staff/u);
  assert.match(app.shares(), /Officers/u);
  assert.match(app.vetoGroupsStatus(), /Showing 2 of 3 groups/u);
  app.filterVetoGroups(true);
  assert.match(app.groups(), /No groups remain after hiding veto groups/u);
  assert.match(app.shares(), /Officers/u);
  app.filterVetoGroups(false);
  assert.equal(storage.get("smallest-agreement:proposal:v1"), clubBefore);
  assert.equal(JSON.parse(storage.get("smallest-agreement:workspace:v1")).hideVetoGroups, true);
  assert.equal(Object.hasOwn(JSON.parse(storage.get("smallest-agreement:proposal:v1")), "hideVetoGroups"), false);
  app.filterHideVetoGroups(false);
  assert.match(app.groups(), /Officers/u);
  const empty = await savedWorkbench(new Map([["smallest-agreement:proposal:v1", JSON.stringify({
    title: "Only veto groups workshop",
    threshold: 70,
    groups: [{ id: "veto", name: "Veto bloc", weight: 1, veto: true }],
    clauses: [{ id: "one", title: "One", options: [
      { id: "original", label: "Keep original", original: true, changeCost: 0, support: { veto: 90 } },
      { id: "mid", label: "Mid option", original: false, changeCost: 1, support: { veto: 80 } },
      { id: "other", label: "Other option", original: false, changeCost: 2, support: { veto: 70 } },
    ] }],
  })]]));
  empty.filterHideVetoGroups(true);
  assert.match(empty.groups(), /No groups remain after hiding veto groups/u);
  assert.match(empty.groups(), /not a legal right/u);
});

test("hide-non-veto-groups hides non-veto group cards without changing the stored draft", async () => {
  const html = await standaloneBytes();
  assert.match(html, /id="hide-non-veto-groups"/u);
  assert.match(html, /Hide non-veto groups/u);
  assert.match(html, /a number you entered, not a legal right/u);
  const storage = new Map();
  const app = await savedWorkbench(storage);
  const before = storage.get("smallest-agreement:proposal:v1");
  app.filterHideNonVetoGroups(true);
  assert.match(app.groups(), /No groups remain after hiding groups that are not marked as a veto group/u);
  assert.match(app.groups(), /not a legal right/u);
  assert.match(app.shares(), /Residents/u);
  assert.equal(storage.get("smallest-agreement:proposal:v1"), before);
  app.filterHideNonVetoGroups(false);
  app.field("#preset-select", "club-constitution");
  app.click("#load-preset");
  const clubBefore = storage.get("smallest-agreement:proposal:v1");
  app.filterHideNonVetoGroups(true);
  assert.match(app.groups(), /Officers/u);
  assert.doesNotMatch(app.groups(), /data-group-id="members"/u);
  assert.doesNotMatch(app.groups(), /Club staff/u);
  assert.match(app.shares(), /Members/u);
  assert.match(app.vetoGroupsStatus(), /Showing 1 of 3 groups/u);
  app.filterHideVetoGroups(true);
  assert.match(app.groups(), /No groups remain after hiding veto groups and non-veto groups/u);
  assert.match(app.groups(), /not a legal right/u);
  assert.match(app.shares(), /Officers/u);
  app.filterHideVetoGroups(false);
  assert.equal(storage.get("smallest-agreement:proposal:v1"), clubBefore);
  assert.equal(JSON.parse(storage.get("smallest-agreement:workspace:v1")).hideNonVetoGroups, true);
  assert.equal(JSON.parse(storage.get("smallest-agreement:workspace:v1")).hideVetoGroups, false);
  assert.equal(Object.hasOwn(JSON.parse(storage.get("smallest-agreement:proposal:v1")), "hideNonVetoGroups"), false);
  app.filterHideNonVetoGroups(false);
  assert.match(app.groups(), /Members/u);
  assert.match(app.groups(), /Officers/u);
  const empty = await savedWorkbench(new Map([["smallest-agreement:proposal:v1", JSON.stringify({
    title: "No veto groups workshop",
    threshold: 70,
    groups: [{ id: "open", name: "Open bloc", weight: 1 }],
    clauses: [{ id: "one", title: "One", options: [
      { id: "original", label: "Keep original", original: true, changeCost: 0, support: { open: 90 } },
      { id: "mid", label: "Mid option", original: false, changeCost: 1, support: { open: 80 } },
      { id: "other", label: "Other option", original: false, changeCost: 2, support: { open: 70 } },
    ] }],
  })]]));
  empty.filterHideNonVetoGroups(true);
  assert.match(empty.groups(), /No groups remain after hiding groups that are not marked as a veto group/u);
  assert.match(empty.groups(), /not a legal right/u);
});

test("hide-first-veto-group hides only the first veto group row without changing the stored draft", async () => {
  const html = await standaloneBytes();
  assert.match(html, /id="hide-first-veto-group"/u);
  assert.match(html, /Hide first veto group/u);
  assert.match(html, /a number you entered, not a legal right/u);
  const storage = new Map();
  const app = await savedWorkbench(storage);
  const before = storage.get("smallest-agreement:proposal:v1");
  app.filterHideFirstVetoGroup(true);
  assert.match(app.groups(), /Residents/u);
  assert.equal(storage.get("smallest-agreement:proposal:v1"), before);
  app.filterHideFirstVetoGroup(false);
  app.field("#preset-select", "club-constitution");
  app.click("#load-preset");
  const clubBefore = storage.get("smallest-agreement:proposal:v1");
  app.filterHideFirstVetoGroup(true);
  assert.doesNotMatch(app.groups(), /data-group-id="officers"/u);
  assert.match(app.groups(), /Members/u);
  assert.match(app.groups(), /Club staff/u);
  assert.match(app.shares(), /Officers/u);
  assert.match(app.vetoGroupsStatus(), /Showing 2 of 3 groups/u);
  app.filterHideVetoGroups(true);
  assert.doesNotMatch(app.groups(), /data-group-id="officers"/u);
  assert.match(app.groups(), /Members/u);
  assert.match(app.shares(), /Officers/u);
  app.filterHideVetoGroups(false);
  assert.equal(storage.get("smallest-agreement:proposal:v1"), clubBefore);
  assert.equal(JSON.parse(storage.get("smallest-agreement:workspace:v1")).hideFirstVetoGroup, true);
  assert.equal(JSON.parse(storage.get("smallest-agreement:workspace:v1")).hideVetoGroups, false);
  assert.equal(Object.hasOwn(JSON.parse(storage.get("smallest-agreement:proposal:v1")), "hideFirstVetoGroup"), false);
  app.filterHideFirstVetoGroup(false);
  assert.match(app.groups(), /Officers/u);
  const twoVeto = await savedWorkbench(new Map([["smallest-agreement:proposal:v1", JSON.stringify({
    title: "Two veto groups workshop",
    threshold: 70,
    groups: [
      { id: "open", name: "Open", weight: 1 },
      { id: "first-veto", name: "First veto", weight: 1, veto: true },
      { id: "later-veto", name: "Later veto", weight: 1, veto: true },
    ],
    clauses: [{ id: "one", title: "One", options: [
      { id: "original", label: "Keep original", original: true, changeCost: 0, support: { open: 90, "first-veto": 90, "later-veto": 90 } },
      { id: "mid", label: "Mid option", original: false, changeCost: 1, support: { open: 80, "first-veto": 80, "later-veto": 80 } },
      { id: "other", label: "Other option", original: false, changeCost: 2, support: { open: 70, "first-veto": 70, "later-veto": 70 } },
    ] }],
  })]]));
  twoVeto.filterHideFirstVetoGroup(true);
  assert.doesNotMatch(twoVeto.groups(), /data-group-id="first-veto"/u);
  assert.match(twoVeto.groups(), /Later veto/u);
  assert.match(twoVeto.groups(), /Open/u);
  assert.match(twoVeto.shares(), /First veto/u);
  assert.match(twoVeto.vetoGroupsStatus(), /Showing 2 of 3 groups/u);
  const empty = await savedWorkbench(new Map([["smallest-agreement:proposal:v1", JSON.stringify({
    title: "Only first veto group workshop",
    threshold: 70,
    groups: [{ id: "veto", name: "Veto bloc", weight: 1, veto: true }],
    clauses: [{ id: "one", title: "One", options: [
      { id: "original", label: "Keep original", original: true, changeCost: 0, support: { veto: 90 } },
      { id: "mid", label: "Mid option", original: false, changeCost: 1, support: { veto: 80 } },
      { id: "other", label: "Other option", original: false, changeCost: 2, support: { veto: 70 } },
    ] }],
  })]]));
  empty.filterHideFirstVetoGroup(true);
  assert.match(empty.groups(), /No groups remain after hiding the first veto group/u);
  assert.match(empty.groups(), /not a legal right/u);
  empty.filterHideVetoGroups(true);
  assert.match(empty.groups(), /No groups remain after hiding veto groups and the first veto group/u);
  assert.match(empty.groups(), /not a legal right/u);
  assert.match(empty.shares(), /Veto bloc/u);
});

test("hide-last-veto-group hides only the last veto group row without changing the stored draft", async () => {
  const html = await standaloneBytes();
  assert.match(html, /id="hide-last-veto-group"/u);
  assert.match(html, /Hide last veto group/u);
  assert.match(html, /a number you entered, not a legal right/u);
  const storage = new Map();
  const app = await savedWorkbench(storage);
  const before = storage.get("smallest-agreement:proposal:v1");
  app.filterHideLastVetoGroup(true);
  assert.match(app.groups(), /Residents/u);
  assert.equal(storage.get("smallest-agreement:proposal:v1"), before);
  app.filterHideLastVetoGroup(false);
  app.field("#preset-select", "club-constitution");
  app.click("#load-preset");
  const clubBefore = storage.get("smallest-agreement:proposal:v1");
  app.filterHideLastVetoGroup(true);
  assert.doesNotMatch(app.groups(), /data-group-id="officers"/u);
  assert.match(app.groups(), /Members/u);
  assert.match(app.groups(), /Club staff/u);
  assert.match(app.shares(), /Officers/u);
  assert.match(app.vetoGroupsStatus(), /Showing 2 of 3 groups/u);
  app.filterHideVetoGroups(true);
  assert.doesNotMatch(app.groups(), /data-group-id="officers"/u);
  assert.match(app.groups(), /Members/u);
  assert.match(app.shares(), /Officers/u);
  app.filterHideVetoGroups(false);
  assert.equal(storage.get("smallest-agreement:proposal:v1"), clubBefore);
  assert.equal(JSON.parse(storage.get("smallest-agreement:workspace:v1")).hideLastVetoGroup, true);
  assert.equal(JSON.parse(storage.get("smallest-agreement:workspace:v1")).hideVetoGroups, false);
  assert.equal(JSON.parse(storage.get("smallest-agreement:workspace:v1")).hideFirstVetoGroup, false);
  assert.equal(Object.hasOwn(JSON.parse(storage.get("smallest-agreement:proposal:v1")), "hideLastVetoGroup"), false);
  app.filterHideLastVetoGroup(false);
  assert.match(app.groups(), /Officers/u);
  const twoVeto = await savedWorkbench(new Map([["smallest-agreement:proposal:v1", JSON.stringify({
    title: "Two veto groups workshop",
    threshold: 70,
    groups: [
      { id: "open", name: "Open", weight: 1 },
      { id: "first-veto", name: "First veto", weight: 1, veto: true },
      { id: "later-veto", name: "Later veto", weight: 1, veto: true },
    ],
    clauses: [{ id: "one", title: "One", options: [
      { id: "original", label: "Keep original", original: true, changeCost: 0, support: { open: 90, "first-veto": 90, "later-veto": 90 } },
      { id: "mid", label: "Mid option", original: false, changeCost: 1, support: { open: 80, "first-veto": 80, "later-veto": 80 } },
      { id: "other", label: "Other option", original: false, changeCost: 2, support: { open: 70, "first-veto": 70, "later-veto": 70 } },
    ] }],
  })]]));
  twoVeto.filterHideLastVetoGroup(true);
  assert.doesNotMatch(twoVeto.groups(), /data-group-id="later-veto"/u);
  assert.match(twoVeto.groups(), /First veto/u);
  assert.match(twoVeto.groups(), /Open/u);
  assert.match(twoVeto.shares(), /Later veto/u);
  assert.match(twoVeto.vetoGroupsStatus(), /Showing 2 of 3 groups/u);
  twoVeto.filterHideFirstVetoGroup(true);
  assert.doesNotMatch(twoVeto.groups(), /data-group-id="first-veto"/u);
  assert.doesNotMatch(twoVeto.groups(), /data-group-id="later-veto"/u);
  assert.match(twoVeto.groups(), /Open/u);
  twoVeto.filterHideFirstVetoGroup(false);
  const empty = await savedWorkbench(new Map([["smallest-agreement:proposal:v1", JSON.stringify({
    title: "Only last veto group workshop",
    threshold: 70,
    groups: [{ id: "veto", name: "Veto bloc", weight: 1, veto: true }],
    clauses: [{ id: "one", title: "One", options: [
      { id: "original", label: "Keep original", original: true, changeCost: 0, support: { veto: 90 } },
      { id: "mid", label: "Mid option", original: false, changeCost: 1, support: { veto: 80 } },
      { id: "other", label: "Other option", original: false, changeCost: 2, support: { veto: 70 } },
    ] }],
  })]]));
  empty.filterHideLastVetoGroup(true);
  assert.match(empty.groups(), /No groups remain after hiding the last veto group/u);
  assert.match(empty.groups(), /not a legal right/u);
  empty.filterHideVetoGroups(true);
  assert.match(empty.groups(), /No groups remain after hiding veto groups and the last veto group/u);
  assert.match(empty.groups(), /not a legal right/u);
  assert.match(empty.shares(), /Veto bloc/u);
});

test("hide-first-non-veto-group hides only the first non-veto group row without changing the stored draft", async () => {
  const html = await standaloneBytes();
  assert.match(html, /id="hide-first-non-veto-group"/u);
  assert.match(html, /Hide first non-veto group/u);
  assert.match(html, /a number you entered, not a legal right/u);
  const storage = new Map();
  const app = await savedWorkbench(storage);
  const before = storage.get("smallest-agreement:proposal:v1");
  app.filterHideFirstNonVetoGroup(true);
  assert.doesNotMatch(app.groups(), /data-group-id="residents"/u);
  assert.match(app.groups(), /Shopkeepers/u);
  assert.match(app.groups(), /Park stewards/u);
  assert.match(app.shares(), /Residents/u);
  assert.match(app.vetoGroupsStatus(), /Showing 2 of 3 groups/u);
  assert.equal(storage.get("smallest-agreement:proposal:v1"), before);
  app.filterHideFirstNonVetoGroup(false);
  app.field("#preset-select", "club-constitution");
  app.click("#load-preset");
  const clubBefore = storage.get("smallest-agreement:proposal:v1");
  app.filterHideFirstNonVetoGroup(true);
  assert.doesNotMatch(app.groups(), /data-group-id="members"/u);
  assert.match(app.groups(), /Officers/u);
  assert.match(app.groups(), /Club staff/u);
  assert.match(app.shares(), /Members/u);
  assert.match(app.vetoGroupsStatus(), /Showing 2 of 3 groups/u);
  app.filterHideNonVetoGroups(true);
  assert.doesNotMatch(app.groups(), /data-group-id="members"/u);
  assert.match(app.groups(), /Officers/u);
  assert.match(app.shares(), /Members/u);
  app.filterHideNonVetoGroups(false);
  assert.equal(storage.get("smallest-agreement:proposal:v1"), clubBefore);
  assert.equal(JSON.parse(storage.get("smallest-agreement:workspace:v1")).hideFirstNonVetoGroup, true);
  assert.equal(JSON.parse(storage.get("smallest-agreement:workspace:v1")).hideNonVetoGroups, false);
  assert.equal(JSON.parse(storage.get("smallest-agreement:workspace:v1")).hideFirstVetoGroup, false);
  assert.equal(JSON.parse(storage.get("smallest-agreement:workspace:v1")).hideLastVetoGroup, false);
  assert.equal(JSON.parse(storage.get("smallest-agreement:workspace:v1")).hideLastNonVetoGroup, false);
  assert.equal(Object.hasOwn(JSON.parse(storage.get("smallest-agreement:proposal:v1")), "hideFirstNonVetoGroup"), false);
  app.filterHideFirstNonVetoGroup(false);
  assert.match(app.groups(), /Members/u);
  const twoOpen = await savedWorkbench(new Map([["smallest-agreement:proposal:v1", JSON.stringify({
    title: "Two non-veto groups workshop",
    threshold: 70,
    groups: [
      { id: "first-open", name: "First open", weight: 1 },
      { id: "later-open", name: "Later open", weight: 1 },
      { id: "veto", name: "Veto bloc", weight: 1, veto: true },
    ],
    clauses: [{ id: "one", title: "One", options: [
      { id: "original", label: "Keep original", original: true, changeCost: 0, support: { "first-open": 90, "later-open": 90, veto: 90 } },
      { id: "mid", label: "Mid option", original: false, changeCost: 1, support: { "first-open": 80, "later-open": 80, veto: 80 } },
      { id: "other", label: "Other option", original: false, changeCost: 2, support: { "first-open": 70, "later-open": 70, veto: 70 } },
    ] }],
  })]]));
  twoOpen.filterHideFirstNonVetoGroup(true);
  assert.doesNotMatch(twoOpen.groups(), /data-group-id="first-open"/u);
  assert.match(twoOpen.groups(), /Later open/u);
  assert.match(twoOpen.groups(), /Veto bloc/u);
  assert.match(twoOpen.shares(), /First open/u);
  assert.match(twoOpen.vetoGroupsStatus(), /Showing 2 of 3 groups/u);
  twoOpen.filterHideNonVetoGroups(true);
  assert.doesNotMatch(twoOpen.groups(), /data-group-id="first-open"/u);
  assert.doesNotMatch(twoOpen.groups(), /data-group-id="later-open"/u);
  assert.match(twoOpen.groups(), /Veto bloc/u);
  twoOpen.filterHideNonVetoGroups(false);
  const empty = await savedWorkbench(new Map([["smallest-agreement:proposal:v1", JSON.stringify({
    title: "Only first non-veto group workshop",
    threshold: 70,
    groups: [{ id: "open", name: "Open bloc", weight: 1 }],
    clauses: [{ id: "one", title: "One", options: [
      { id: "original", label: "Keep original", original: true, changeCost: 0, support: { open: 90 } },
      { id: "mid", label: "Mid option", original: false, changeCost: 1, support: { open: 80 } },
      { id: "other", label: "Other option", original: false, changeCost: 2, support: { open: 70 } },
    ] }],
  })]]));
  empty.filterHideFirstNonVetoGroup(true);
  assert.match(empty.groups(), /No groups remain after hiding the first non-veto group/u);
  assert.match(empty.groups(), /not a legal right/u);
  empty.filterHideNonVetoGroups(true);
  assert.match(empty.groups(), /No groups remain after hiding non-veto groups and the first non-veto group/u);
  assert.match(empty.groups(), /not a legal right/u);
  assert.match(empty.shares(), /Open bloc/u);
});

test("hide-last-non-veto-group hides only the last non-veto group row without changing the stored draft", async () => {
  const html = await standaloneBytes();
  assert.match(html, /id="hide-last-non-veto-group"/u);
  assert.match(html, /Hide last non-veto group/u);
  assert.match(html, /a number you entered, not a legal right/u);
  const storage = new Map();
  const app = await savedWorkbench(storage);
  const before = storage.get("smallest-agreement:proposal:v1");
  app.filterHideLastNonVetoGroup(true);
  assert.doesNotMatch(app.groups(), /data-group-id="stewards"/u);
  assert.match(app.groups(), /Residents/u);
  assert.match(app.groups(), /Shopkeepers/u);
  assert.match(app.shares(), /Park stewards/u);
  assert.match(app.vetoGroupsStatus(), /Showing 2 of 3 groups/u);
  assert.equal(storage.get("smallest-agreement:proposal:v1"), before);
  app.filterHideLastNonVetoGroup(false);
  app.field("#preset-select", "club-constitution");
  app.click("#load-preset");
  const clubBefore = storage.get("smallest-agreement:proposal:v1");
  app.filterHideLastNonVetoGroup(true);
  assert.doesNotMatch(app.groups(), /data-group-id="staff"/u);
  assert.match(app.groups(), /Members/u);
  assert.match(app.groups(), /Officers/u);
  assert.match(app.shares(), /Club staff/u);
  assert.match(app.vetoGroupsStatus(), /Showing 2 of 3 groups/u);
  app.filterHideNonVetoGroups(true);
  assert.doesNotMatch(app.groups(), /data-group-id="members"/u);
  assert.doesNotMatch(app.groups(), /data-group-id="staff"/u);
  assert.match(app.groups(), /Officers/u);
  assert.match(app.shares(), /Members/u);
  app.filterHideNonVetoGroups(false);
  assert.equal(storage.get("smallest-agreement:proposal:v1"), clubBefore);
  assert.equal(JSON.parse(storage.get("smallest-agreement:workspace:v1")).hideLastNonVetoGroup, true);
  assert.equal(JSON.parse(storage.get("smallest-agreement:workspace:v1")).hideNonVetoGroups, false);
  assert.equal(JSON.parse(storage.get("smallest-agreement:workspace:v1")).hideFirstNonVetoGroup, false);
  assert.equal(Object.hasOwn(JSON.parse(storage.get("smallest-agreement:proposal:v1")), "hideLastNonVetoGroup"), false);
  app.filterHideLastNonVetoGroup(false);
  assert.match(app.groups(), /Club staff/u);
  const twoOpen = await savedWorkbench(new Map([["smallest-agreement:proposal:v1", JSON.stringify({
    title: "Two non-veto groups workshop",
    threshold: 70,
    groups: [
      { id: "first-open", name: "First open", weight: 1 },
      { id: "later-open", name: "Later open", weight: 1 },
      { id: "veto", name: "Veto bloc", weight: 1, veto: true },
    ],
    clauses: [{ id: "one", title: "One", options: [
      { id: "original", label: "Keep original", original: true, changeCost: 0, support: { "first-open": 90, "later-open": 90, veto: 90 } },
      { id: "mid", label: "Mid option", original: false, changeCost: 1, support: { "first-open": 80, "later-open": 80, veto: 80 } },
      { id: "other", label: "Other option", original: false, changeCost: 2, support: { "first-open": 70, "later-open": 70, veto: 70 } },
    ] }],
  })]]));
  twoOpen.filterHideLastNonVetoGroup(true);
  assert.doesNotMatch(twoOpen.groups(), /data-group-id="later-open"/u);
  assert.match(twoOpen.groups(), /First open/u);
  assert.match(twoOpen.groups(), /Veto bloc/u);
  assert.match(twoOpen.shares(), /Later open/u);
  assert.match(twoOpen.vetoGroupsStatus(), /Showing 2 of 3 groups/u);
  twoOpen.filterHideFirstNonVetoGroup(true);
  assert.doesNotMatch(twoOpen.groups(), /data-group-id="first-open"/u);
  assert.doesNotMatch(twoOpen.groups(), /data-group-id="later-open"/u);
  assert.match(twoOpen.groups(), /Veto bloc/u);
  twoOpen.filterHideFirstNonVetoGroup(false);
  const empty = await savedWorkbench(new Map([["smallest-agreement:proposal:v1", JSON.stringify({
    title: "Only last non-veto group workshop",
    threshold: 70,
    groups: [{ id: "open", name: "Open bloc", weight: 1 }],
    clauses: [{ id: "one", title: "One", options: [
      { id: "original", label: "Keep original", original: true, changeCost: 0, support: { open: 90 } },
      { id: "mid", label: "Mid option", original: false, changeCost: 1, support: { open: 80 } },
      { id: "other", label: "Other option", original: false, changeCost: 2, support: { open: 70 } },
    ] }],
  })]]));
  empty.filterHideLastNonVetoGroup(true);
  assert.match(empty.groups(), /No groups remain after hiding the last non-veto group/u);
  assert.match(empty.groups(), /not a legal right/u);
  empty.filterHideNonVetoGroups(true);
  assert.match(empty.groups(), /No groups remain after hiding non-veto groups and the last non-veto group/u);
  assert.match(empty.groups(), /not a legal right/u);
  empty.filterHideNonVetoGroups(false);
  empty.filterHideFirstNonVetoGroup(true);
  assert.match(empty.groups(), /No groups remain after hiding the first non-veto group and the last non-veto group/u);
  assert.match(empty.groups(), /not a legal right/u);
  assert.match(empty.shares(), /Open bloc/u);
});

test("hide-last-group-below-threshold hides only the last below-threshold group without changing the stored draft", async () => {
  const html = await standaloneBytes();
  assert.match(html, /id="hide-last-group-below-threshold"/u);
  assert.match(html, /Hide last group currently below the approval threshold/u);
  const storage = new Map();
  const app = await savedWorkbench(storage);
  const before = storage.get("smallest-agreement:proposal:v1");
  app.filterHideLastGroupBelowThreshold(true);
  assert.equal(storage.get("smallest-agreement:proposal:v1"), before);
  const draft = {
    title: "Hide last below threshold workshop",
    threshold: 70,
    groups: [
      { id: "cleared", name: "Cleared", weight: 1 },
      { id: "short", name: "Short", weight: 1 },
      { id: "floored", name: "Floored", weight: 1, minSupport: 90 },
    ],
    clauses: [{ id: "one", title: "One", options: [
      { id: "original", label: "Keep original", original: true, changeCost: 0, support: { cleared: 90, short: 20, floored: 20 } },
      { id: "mid", label: "Mid option", original: false, changeCost: 1, support: { cleared: 80, short: 30, floored: 30 } },
      { id: "other", label: "Other option", original: false, changeCost: 2, support: { cleared: 70, short: 40, floored: 40 } },
    ] }],
  };
  const filteredStorage = new Map([["smallest-agreement:proposal:v1", JSON.stringify(draft)]]);
  const filtered = await savedWorkbench(filteredStorage);
  filtered.filterHideLastGroupBelowThreshold(true);
  assert.doesNotMatch(filtered.groups(), /data-group-id="floored"/u);
  assert.match(filtered.groups(), /Cleared/u);
  assert.match(filtered.groups(), /Short/u);
  assert.match(filtered.shares(), /Floored/u);
  assert.match(filtered.vetoGroupsStatus(), /Showing 2 of 3 groups/u);
  filtered.filterHideGroupsBelowThreshold(true);
  assert.doesNotMatch(filtered.groups(), /data-group-id="short"/u);
  assert.doesNotMatch(filtered.groups(), /data-group-id="floored"/u);
  assert.match(filtered.groups(), /Cleared/u);
  assert.match(filtered.shares(), /Short/u);
  filtered.filterHideGroupsBelowThreshold(false);
  assert.equal(JSON.parse(filteredStorage.get("smallest-agreement:proposal:v1")).title, "Hide last below threshold workshop");
  assert.equal(JSON.parse(filteredStorage.get("smallest-agreement:workspace:v1")).hideLastGroupBelowThreshold, true);
  assert.equal(JSON.parse(filteredStorage.get("smallest-agreement:workspace:v1")).hideGroupsBelowThreshold, false);
  assert.equal(JSON.parse(filteredStorage.get("smallest-agreement:workspace:v1")).hideLastNonVetoGroup, false);
  assert.equal(JSON.parse(filteredStorage.get("smallest-agreement:workspace:v1")).hideFirstNonVetoGroup, false);
  assert.equal(JSON.parse(filteredStorage.get("smallest-agreement:workspace:v1")).hideLastVetoGroup, false);
  assert.equal(Object.hasOwn(JSON.parse(filteredStorage.get("smallest-agreement:proposal:v1")), "hideLastGroupBelowThreshold"), false);
  filtered.filterHideLastGroupBelowThreshold(false);
  assert.match(filtered.groups(), /Floored/u);
  const empty = await savedWorkbench(new Map([["smallest-agreement:proposal:v1", JSON.stringify({
    title: "Only last below-threshold group workshop",
    threshold: 95,
    groups: [{ id: "g", name: "Open", weight: 1 }],
    clauses: [{ id: "one", title: "One", options: [
      { id: "original", label: "Keep original", original: true, changeCost: 0, support: { g: 40 } },
      { id: "mid", label: "Mid option", original: false, changeCost: 1, support: { g: 30 } },
      { id: "other", label: "Other option", original: false, changeCost: 2, support: { g: 20 } },
    ] }],
  })]]));
  empty.filterHideLastGroupBelowThreshold(true);
  assert.match(empty.groups(), /No groups remain after hiding the last group whose average is below the numeric approval threshold/u);
  empty.filterHideGroupsBelowThreshold(true);
  assert.match(empty.groups(), /No groups remain after hiding groups whose average is below the numeric approval threshold and the last group below the numeric approval threshold/u);
  assert.match(empty.shares(), /Open/u);
});

test("hide-first-group-below-threshold hides only the first below-threshold group without changing the stored draft", async () => {
  const html = await standaloneBytes();
  assert.match(html, /id="hide-first-group-below-threshold"/u);
  assert.match(html, /Hide first group currently below the approval threshold/u);
  const storage = new Map();
  const app = await savedWorkbench(storage);
  const before = storage.get("smallest-agreement:proposal:v1");
  app.filterHideFirstGroupBelowThreshold(true);
  assert.equal(storage.get("smallest-agreement:proposal:v1"), before);
  const draft = {
    title: "Hide first below threshold workshop",
    threshold: 70,
    groups: [
      { id: "cleared", name: "Cleared", weight: 1 },
      { id: "short", name: "Short", weight: 1 },
      { id: "floored", name: "Floored", weight: 1, minSupport: 90 },
    ],
    clauses: [{ id: "one", title: "One", options: [
      { id: "original", label: "Keep original", original: true, changeCost: 0, support: { cleared: 90, short: 20, floored: 20 } },
      { id: "mid", label: "Mid option", original: false, changeCost: 1, support: { cleared: 80, short: 30, floored: 30 } },
      { id: "other", label: "Other option", original: false, changeCost: 2, support: { cleared: 70, short: 40, floored: 40 } },
    ] }],
  };
  const filteredStorage = new Map([["smallest-agreement:proposal:v1", JSON.stringify(draft)]]);
  const filtered = await savedWorkbench(filteredStorage);
  filtered.filterHideFirstGroupBelowThreshold(true);
  assert.doesNotMatch(filtered.groups(), /data-group-id="short"/u);
  assert.match(filtered.groups(), /Cleared/u);
  assert.match(filtered.groups(), /Floored/u);
  assert.match(filtered.shares(), /Short/u);
  assert.match(filtered.vetoGroupsStatus(), /Showing 2 of 3 groups/u);
  filtered.filterHideLastGroupBelowThreshold(true);
  assert.doesNotMatch(filtered.groups(), /data-group-id="short"/u);
  assert.doesNotMatch(filtered.groups(), /data-group-id="floored"/u);
  assert.match(filtered.groups(), /Cleared/u);
  assert.match(filtered.shares(), /Floored/u);
  filtered.filterHideLastGroupBelowThreshold(false);
  assert.equal(JSON.parse(filteredStorage.get("smallest-agreement:proposal:v1")).title, "Hide first below threshold workshop");
  assert.equal(JSON.parse(filteredStorage.get("smallest-agreement:workspace:v1")).hideFirstGroupBelowThreshold, true);
  assert.equal(JSON.parse(filteredStorage.get("smallest-agreement:workspace:v1")).hideLastGroupBelowThreshold, false);
  assert.equal(JSON.parse(filteredStorage.get("smallest-agreement:workspace:v1")).hideGroupsBelowThreshold, false);
  assert.equal(JSON.parse(filteredStorage.get("smallest-agreement:workspace:v1")).hideLastNonVetoGroup, false);
  assert.equal(Object.hasOwn(JSON.parse(filteredStorage.get("smallest-agreement:proposal:v1")), "hideFirstGroupBelowThreshold"), false);
  filtered.filterHideFirstGroupBelowThreshold(false);
  assert.match(filtered.groups(), /Short/u);
  const empty = await savedWorkbench(new Map([["smallest-agreement:proposal:v1", JSON.stringify({
    title: "Only first below-threshold group workshop",
    threshold: 95,
    groups: [{ id: "g", name: "Open", weight: 1 }],
    clauses: [{ id: "one", title: "One", options: [
      { id: "original", label: "Keep original", original: true, changeCost: 0, support: { g: 40 } },
      { id: "mid", label: "Mid option", original: false, changeCost: 1, support: { g: 30 } },
      { id: "other", label: "Other option", original: false, changeCost: 2, support: { g: 20 } },
    ] }],
  })]]));
  empty.filterHideFirstGroupBelowThreshold(true);
  assert.match(empty.groups(), /No groups remain after hiding the first group whose average is below the numeric approval threshold/u);
  empty.filterHideGroupsBelowThreshold(true);
  assert.match(empty.groups(), /No groups remain after hiding groups whose average is below the numeric approval threshold and the first group below the numeric approval threshold/u);
  empty.filterHideGroupsBelowThreshold(false);
  empty.filterHideLastGroupBelowThreshold(true);
  assert.match(empty.groups(), /No groups remain after hiding the last group below the numeric approval threshold and the first group below the numeric approval threshold/u);
  assert.match(empty.shares(), /Open/u);
});

test("hide-last-group-at-or-above-threshold hides only the last at-or-above group without changing the stored draft", async () => {
  const html = await standaloneBytes();
  assert.match(html, /id="hide-last-group-at-or-above-threshold"/u);
  assert.match(html, /Hide last group currently at or above the approval threshold/u);
  const storage = new Map();
  const app = await savedWorkbench(storage);
  const before = storage.get("smallest-agreement:proposal:v1");
  app.filterHideLastGroupAtOrAboveThreshold(true);
  assert.equal(storage.get("smallest-agreement:proposal:v1"), before);
  const draft = {
    title: "Hide last at or above threshold workshop",
    threshold: 70,
    groups: [
      { id: "cleared", name: "Cleared", weight: 1 },
      { id: "short", name: "Short", weight: 1 },
      { id: "later", name: "Later", weight: 1 },
    ],
    clauses: [{ id: "one", title: "One", options: [
      { id: "original", label: "Keep original", original: true, changeCost: 0, support: { cleared: 90, short: 20, later: 80 } },
      { id: "mid", label: "Mid option", original: false, changeCost: 1, support: { cleared: 80, short: 30, later: 75 } },
      { id: "other", label: "Other option", original: false, changeCost: 2, support: { cleared: 70, short: 40, later: 72 } },
    ] }],
  };
  const filteredStorage = new Map([["smallest-agreement:proposal:v1", JSON.stringify(draft)]]);
  const filtered = await savedWorkbench(filteredStorage);
  filtered.filterHideLastGroupAtOrAboveThreshold(true);
  assert.doesNotMatch(filtered.groups(), /data-group-id="later"/u);
  assert.match(filtered.groups(), /Cleared/u);
  assert.match(filtered.groups(), /Short/u);
  assert.match(filtered.shares(), /Later/u);
  assert.match(filtered.vetoGroupsStatus(), /Showing 2 of 3 groups/u);
  filtered.filterHideGroupsMeetingThreshold(true);
  assert.doesNotMatch(filtered.groups(), /data-group-id="cleared"/u);
  assert.doesNotMatch(filtered.groups(), /data-group-id="later"/u);
  assert.match(filtered.groups(), /Short/u);
  assert.match(filtered.shares(), /Cleared/u);
  filtered.filterHideGroupsMeetingThreshold(false);
  assert.equal(JSON.parse(filteredStorage.get("smallest-agreement:proposal:v1")).title, "Hide last at or above threshold workshop");
  assert.equal(JSON.parse(filteredStorage.get("smallest-agreement:workspace:v1")).hideLastGroupAtOrAboveThreshold, true);
  assert.equal(JSON.parse(filteredStorage.get("smallest-agreement:workspace:v1")).hideGroupsMeetingThreshold, false);
  assert.equal(JSON.parse(filteredStorage.get("smallest-agreement:workspace:v1")).hideFirstGroupBelowThreshold, false);
  assert.equal(JSON.parse(filteredStorage.get("smallest-agreement:workspace:v1")).hideLastGroupBelowThreshold, false);
  assert.equal(Object.hasOwn(JSON.parse(filteredStorage.get("smallest-agreement:proposal:v1")), "hideLastGroupAtOrAboveThreshold"), false);
  filtered.filterHideLastGroupAtOrAboveThreshold(false);
  assert.match(filtered.groups(), /Later/u);
  const empty = await savedWorkbench(new Map([["smallest-agreement:proposal:v1", JSON.stringify({
    title: "Only last at-or-above group workshop",
    threshold: 70,
    groups: [{ id: "g", name: "Open", weight: 1 }],
    clauses: [{ id: "one", title: "One", options: [
      { id: "original", label: "Keep original", original: true, changeCost: 0, support: { g: 90 } },
      { id: "mid", label: "Mid option", original: false, changeCost: 1, support: { g: 80 } },
      { id: "other", label: "Other option", original: false, changeCost: 2, support: { g: 70 } },
    ] }],
  })]]));
  empty.filterHideLastGroupAtOrAboveThreshold(true);
  assert.match(empty.groups(), /No groups remain after hiding the last group whose average is at or above the numeric approval threshold/u);
  empty.filterHideGroupsMeetingThreshold(true);
  assert.match(empty.groups(), /No groups remain after hiding groups whose average currently meets the numeric approval threshold and the last group at or above the numeric approval threshold/u);
  assert.match(empty.shares(), /Open/u);
});

test("hide-first-group-at-or-above-threshold hides only the first at-or-above group without changing the stored draft", async () => {
  const html = await standaloneBytes();
  assert.match(html, /id="hide-first-group-at-or-above-threshold"/u);
  assert.match(html, /Hide first group currently at or above the approval threshold/u);
  const storage = new Map();
  const app = await savedWorkbench(storage);
  const before = storage.get("smallest-agreement:proposal:v1");
  app.filterHideFirstGroupAtOrAboveThreshold(true);
  assert.equal(storage.get("smallest-agreement:proposal:v1"), before);
  const draft = {
    title: "Hide first at or above threshold workshop",
    threshold: 70,
    groups: [
      { id: "cleared", name: "Cleared", weight: 1 },
      { id: "short", name: "Short", weight: 1 },
      { id: "later", name: "Later", weight: 1 },
    ],
    clauses: [{ id: "one", title: "One", options: [
      { id: "original", label: "Keep original", original: true, changeCost: 0, support: { cleared: 90, short: 20, later: 80 } },
      { id: "mid", label: "Mid option", original: false, changeCost: 1, support: { cleared: 80, short: 30, later: 75 } },
      { id: "other", label: "Other option", original: false, changeCost: 2, support: { cleared: 70, short: 40, later: 72 } },
    ] }],
  };
  const filteredStorage = new Map([["smallest-agreement:proposal:v1", JSON.stringify(draft)]]);
  const filtered = await savedWorkbench(filteredStorage);
  filtered.filterHideFirstGroupAtOrAboveThreshold(true);
  assert.doesNotMatch(filtered.groups(), /data-group-id="cleared"/u);
  assert.match(filtered.groups(), /Short/u);
  assert.match(filtered.groups(), /Later/u);
  assert.match(filtered.shares(), /Cleared/u);
  assert.match(filtered.vetoGroupsStatus(), /Showing 2 of 3 groups/u);
  filtered.filterHideLastGroupAtOrAboveThreshold(true);
  assert.doesNotMatch(filtered.groups(), /data-group-id="cleared"/u);
  assert.doesNotMatch(filtered.groups(), /data-group-id="later"/u);
  assert.match(filtered.groups(), /Short/u);
  assert.match(filtered.shares(), /Later/u);
  filtered.filterHideLastGroupAtOrAboveThreshold(false);
  filtered.filterHideGroupsMeetingThreshold(true);
  assert.doesNotMatch(filtered.groups(), /data-group-id="cleared"/u);
  assert.doesNotMatch(filtered.groups(), /data-group-id="later"/u);
  assert.match(filtered.groups(), /Short/u);
  filtered.filterHideGroupsMeetingThreshold(false);
  assert.equal(JSON.parse(filteredStorage.get("smallest-agreement:proposal:v1")).title, "Hide first at or above threshold workshop");
  assert.equal(JSON.parse(filteredStorage.get("smallest-agreement:workspace:v1")).hideFirstGroupAtOrAboveThreshold, true);
  assert.equal(JSON.parse(filteredStorage.get("smallest-agreement:workspace:v1")).hideLastGroupAtOrAboveThreshold, false);
  assert.equal(JSON.parse(filteredStorage.get("smallest-agreement:workspace:v1")).hideGroupsMeetingThreshold, false);
  assert.equal(JSON.parse(filteredStorage.get("smallest-agreement:workspace:v1")).hideFirstGroupBelowThreshold, false);
  assert.equal(Object.hasOwn(JSON.parse(filteredStorage.get("smallest-agreement:proposal:v1")), "hideFirstGroupAtOrAboveThreshold"), false);
  filtered.filterHideFirstGroupAtOrAboveThreshold(false);
  assert.match(filtered.groups(), /Cleared/u);
  const empty = await savedWorkbench(new Map([["smallest-agreement:proposal:v1", JSON.stringify({
    title: "Only first at-or-above group workshop",
    threshold: 70,
    groups: [{ id: "g", name: "Open", weight: 1 }],
    clauses: [{ id: "one", title: "One", options: [
      { id: "original", label: "Keep original", original: true, changeCost: 0, support: { g: 90 } },
      { id: "mid", label: "Mid option", original: false, changeCost: 1, support: { g: 80 } },
      { id: "other", label: "Other option", original: false, changeCost: 2, support: { g: 70 } },
    ] }],
  })]]));
  empty.filterHideFirstGroupAtOrAboveThreshold(true);
  assert.match(empty.groups(), /No groups remain after hiding the first group whose average is at or above the numeric approval threshold/u);
  empty.filterHideGroupsMeetingThreshold(true);
  assert.match(empty.groups(), /No groups remain after hiding groups whose average currently meets the numeric approval threshold and the first group at or above the numeric approval threshold/u);
  empty.filterHideGroupsMeetingThreshold(false);
  empty.filterHideLastGroupAtOrAboveThreshold(true);
  assert.match(empty.groups(), /No groups remain after hiding the last group at or above the numeric approval threshold and the first group at or above the numeric approval threshold/u);
  assert.match(empty.shares(), /Open/u);
});

test("hide-last-group-at-floor hides only the last floor-meeting group without changing the stored draft", async () => {
  const html = await standaloneBytes();
  assert.match(html, /id="hide-last-group-at-floor"/u);
  assert.match(html, /Hide last group currently meeting their support floor/u);
  assert.match(html, /id="hide-last-group-at-floor"[^>]*aria-keyshortcuts="ArrowUp"/u);
  const storage = new Map();
  const app = await savedWorkbench(storage);
  const before = storage.get("smallest-agreement:proposal:v1");
  app.filterHideLastGroupAtFloor(true);
  assert.equal(storage.get("smallest-agreement:proposal:v1"), before);
  const draft = {
    title: "Hide last group at floor workshop",
    threshold: 50,
    groups: [
      { id: "cleared", name: "Cleared", weight: 1, minSupport: 40 },
      { id: "open", name: "Open", weight: 1 },
      { id: "later", name: "Later", weight: 1, minSupport: 40 },
      { id: "short", name: "Short", weight: 1, minSupport: 90 },
    ],
    clauses: [{ id: "one", title: "One", options: [
      { id: "original", label: "Keep original", original: true, changeCost: 0, support: { cleared: 90, open: 80, later: 80, short: 20 } },
      { id: "mid", label: "Mid option", original: false, changeCost: 1, support: { cleared: 80, open: 70, later: 75, short: 30 } },
      { id: "other", label: "Other option", original: false, changeCost: 2, support: { cleared: 70, open: 60, later: 72, short: 40 } },
    ] }],
  };
  const filteredStorage = new Map([["smallest-agreement:proposal:v1", JSON.stringify(draft)]]);
  const filtered = await savedWorkbench(filteredStorage);
  filtered.filterHideLastGroupAtFloor(true);
  assert.match(filtered.groups(), /Cleared/u);
  assert.match(filtered.groups(), /Open/u);
  assert.doesNotMatch(filtered.groups(), /data-group-id="later"/u);
  assert.match(filtered.groups(), /Short/u);
  assert.match(filtered.shares(), /Later/u);
  assert.match(filtered.vetoGroupsStatus(), /Showing 3 of 4 groups/u);
  filtered.filterHideGroupsAtFloor(true);
  assert.doesNotMatch(filtered.groups(), /data-group-id="cleared"/u);
  assert.doesNotMatch(filtered.groups(), /data-group-id="later"/u);
  assert.match(filtered.groups(), /Open/u);
  assert.match(filtered.groups(), /Short/u);
  filtered.filterHideGroupsAtFloor(false);
  assert.equal(JSON.parse(filteredStorage.get("smallest-agreement:proposal:v1")).title, "Hide last group at floor workshop");
  assert.equal(JSON.parse(filteredStorage.get("smallest-agreement:workspace:v1")).hideLastGroupAtFloor, true);
  assert.equal(JSON.parse(filteredStorage.get("smallest-agreement:workspace:v1")).hideGroupsAtFloor, false);
  assert.equal(JSON.parse(filteredStorage.get("smallest-agreement:workspace:v1")).hideFirstGroupAtOrAboveThreshold, false);
  assert.equal(JSON.parse(filteredStorage.get("smallest-agreement:workspace:v1")).hideFirstGroupAtFloor, false);
  assert.equal(Object.hasOwn(JSON.parse(filteredStorage.get("smallest-agreement:proposal:v1")), "hideLastGroupAtFloor"), false);
  filtered.filterHideLastGroupAtFloor(false);
  assert.match(filtered.groups(), /Later/u);
  const empty = await savedWorkbench(new Map([["smallest-agreement:proposal:v1", JSON.stringify({
    title: "Only last at-floor group workshop",
    threshold: 50,
    groups: [{ id: "g", name: "Open", weight: 1, minSupport: 40 }],
    clauses: [{ id: "one", title: "One", options: [
      { id: "original", label: "Keep original", original: true, changeCost: 0, support: { g: 90 } },
      { id: "mid", label: "Mid option", original: false, changeCost: 1, support: { g: 80 } },
      { id: "other", label: "Other option", original: false, changeCost: 2, support: { g: 70 } },
    ] }],
  })]]));
  empty.filterHideLastGroupAtFloor(true);
  assert.match(empty.groups(), /No groups remain after hiding the last group whose average currently meets their support floor/u);
  assert.match(empty.groups(), /not a legal quorum/u);
  empty.filterHideGroupsAtFloor(true);
  assert.match(empty.groups(), /No groups remain after hiding groups whose average currently meets their support floor and the last group currently meeting their support floor/u);
  assert.match(empty.shares(), /Open/u);
});

test("hide-first-group-at-floor hides only the first floor-meeting group without changing the stored draft", async () => {
  const html = await standaloneBytes();
  assert.match(html, /id="hide-first-group-at-floor"/u);
  assert.match(html, /Hide first group currently meeting their support floor/u);
  assert.match(html, /id="hide-first-group-at-floor"[^>]*aria-keyshortcuts="ArrowLeft"/u);
  const storage = new Map();
  const app = await savedWorkbench(storage);
  const before = storage.get("smallest-agreement:proposal:v1");
  app.filterHideFirstGroupAtFloor(true);
  assert.equal(storage.get("smallest-agreement:proposal:v1"), before);
  const draft = {
    title: "Hide first group at floor workshop",
    threshold: 50,
    groups: [
      { id: "cleared", name: "Cleared", weight: 1, minSupport: 40 },
      { id: "open", name: "Open", weight: 1 },
      { id: "later", name: "Later", weight: 1, minSupport: 40 },
      { id: "short", name: "Short", weight: 1, minSupport: 90 },
    ],
    clauses: [{ id: "one", title: "One", options: [
      { id: "original", label: "Keep original", original: true, changeCost: 0, support: { cleared: 90, open: 80, later: 80, short: 20 } },
      { id: "mid", label: "Mid option", original: false, changeCost: 1, support: { cleared: 80, open: 70, later: 75, short: 30 } },
      { id: "other", label: "Other option", original: false, changeCost: 2, support: { cleared: 70, open: 60, later: 72, short: 40 } },
    ] }],
  };
  const filteredStorage = new Map([["smallest-agreement:proposal:v1", JSON.stringify(draft)]]);
  const filtered = await savedWorkbench(filteredStorage);
  filtered.filterHideFirstGroupAtFloor(true);
  assert.doesNotMatch(filtered.groups(), /data-group-id="cleared"/u);
  assert.match(filtered.groups(), /Open/u);
  assert.match(filtered.groups(), /Later/u);
  assert.match(filtered.groups(), /Short/u);
  assert.match(filtered.shares(), /Cleared/u);
  assert.match(filtered.vetoGroupsStatus(), /Showing 3 of 4 groups/u);
  filtered.filterHideLastGroupAtFloor(true);
  assert.doesNotMatch(filtered.groups(), /data-group-id="cleared"/u);
  assert.doesNotMatch(filtered.groups(), /data-group-id="later"/u);
  assert.match(filtered.groups(), /Open/u);
  assert.match(filtered.groups(), /Short/u);
  filtered.filterHideLastGroupAtFloor(false);
  filtered.filterHideGroupsAtFloor(true);
  assert.doesNotMatch(filtered.groups(), /data-group-id="cleared"/u);
  assert.doesNotMatch(filtered.groups(), /data-group-id="later"/u);
  assert.match(filtered.groups(), /Open/u);
  assert.match(filtered.groups(), /Short/u);
  filtered.filterHideGroupsAtFloor(false);
  assert.equal(JSON.parse(filteredStorage.get("smallest-agreement:proposal:v1")).title, "Hide first group at floor workshop");
  assert.equal(JSON.parse(filteredStorage.get("smallest-agreement:workspace:v1")).hideFirstGroupAtFloor, true);
  assert.equal(JSON.parse(filteredStorage.get("smallest-agreement:workspace:v1")).hideLastGroupAtFloor, false);
  assert.equal(JSON.parse(filteredStorage.get("smallest-agreement:workspace:v1")).hideGroupsAtFloor, false);
  assert.equal(JSON.parse(filteredStorage.get("smallest-agreement:workspace:v1")).hideFirstGroupAtOrAboveThreshold, false);
  assert.equal(Object.hasOwn(JSON.parse(filteredStorage.get("smallest-agreement:proposal:v1")), "hideFirstGroupAtFloor"), false);
  filtered.filterHideFirstGroupAtFloor(false);
  assert.match(filtered.groups(), /Cleared/u);
  const empty = await savedWorkbench(new Map([["smallest-agreement:proposal:v1", JSON.stringify({
    title: "Only first at-floor group workshop",
    threshold: 50,
    groups: [{ id: "g", name: "Open", weight: 1, minSupport: 40 }],
    clauses: [{ id: "one", title: "One", options: [
      { id: "original", label: "Keep original", original: true, changeCost: 0, support: { g: 90 } },
      { id: "mid", label: "Mid option", original: false, changeCost: 1, support: { g: 80 } },
      { id: "other", label: "Other option", original: false, changeCost: 2, support: { g: 70 } },
    ] }],
  })]]));
  empty.filterHideFirstGroupAtFloor(true);
  assert.match(empty.groups(), /No groups remain after hiding the first group whose average currently meets their support floor/u);
  assert.match(empty.groups(), /not a legal quorum/u);
  empty.filterHideGroupsAtFloor(true);
  assert.match(empty.groups(), /No groups remain after hiding groups whose average currently meets their support floor and the first group currently meeting their support floor/u);
  empty.filterHideGroupsAtFloor(false);
  empty.filterHideLastGroupAtFloor(true);
  assert.match(empty.groups(), /No groups remain after hiding the last group currently meeting their support floor and the first group currently meeting their support floor/u);
  assert.match(empty.shares(), /Open/u);
});

test("hide-first-group-below-floor hides only the first below-floor group without changing the stored draft", async () => {
  const html = await standaloneBytes();
  assert.match(html, /id="hide-first-group-below-floor"/u);
  assert.match(html, /Hide first group currently below their support floor/u);
  assert.match(html, /id="hide-first-group-below-floor"[^>]*aria-keyshortcuts="ArrowRight"/u);
  const storage = new Map();
  const app = await savedWorkbench(storage);
  const before = storage.get("smallest-agreement:proposal:v1");
  app.filterHideFirstGroupBelowFloor(true);
  assert.equal(storage.get("smallest-agreement:proposal:v1"), before);
  const draft = {
    title: "Hide first group below floor workshop",
    threshold: 50,
    groups: [
      { id: "short", name: "Short", weight: 1, minSupport: 90 },
      { id: "open", name: "Open", weight: 1 },
      { id: "later", name: "Later", weight: 1, minSupport: 90 },
      { id: "cleared", name: "Cleared", weight: 1, minSupport: 40 },
    ],
    clauses: [{ id: "one", title: "One", options: [
      { id: "original", label: "Keep original", original: true, changeCost: 0, support: { short: 20, open: 80, later: 25, cleared: 90 } },
      { id: "mid", label: "Mid option", original: false, changeCost: 1, support: { short: 30, open: 70, later: 28, cleared: 80 } },
      { id: "other", label: "Other option", original: false, changeCost: 2, support: { short: 40, open: 60, later: 32, cleared: 70 } },
    ] }],
  };
  const filteredStorage = new Map([["smallest-agreement:proposal:v1", JSON.stringify(draft)]]);
  const filtered = await savedWorkbench(filteredStorage);
  filtered.filterHideFirstGroupBelowFloor(true);
  assert.doesNotMatch(filtered.groups(), /data-group-id="short"/u);
  assert.match(filtered.groups(), /Open/u);
  assert.match(filtered.groups(), /Later/u);
  assert.match(filtered.groups(), /Cleared/u);
  assert.match(filtered.shares(), /Short/u);
  assert.match(filtered.vetoGroupsStatus(), /Showing 3 of 4 groups/u);
  filtered.filterHideFirstGroupAtFloor(true);
  assert.doesNotMatch(filtered.groups(), /data-group-id="short"/u);
  assert.doesNotMatch(filtered.groups(), /data-group-id="cleared"/u);
  assert.match(filtered.groups(), /Open/u);
  assert.match(filtered.groups(), /Later/u);
  filtered.filterHideFirstGroupAtFloor(false);
  filtered.filterHideFirstGroupBelowThreshold(true);
  assert.doesNotMatch(filtered.groups(), /data-group-id="short"/u);
  assert.match(filtered.groups(), /Later/u);
  filtered.filterHideFirstGroupBelowThreshold(false);
  assert.equal(JSON.parse(filteredStorage.get("smallest-agreement:proposal:v1")).title, "Hide first group below floor workshop");
  assert.equal(JSON.parse(filteredStorage.get("smallest-agreement:workspace:v1")).hideFirstGroupBelowFloor, true);
  assert.equal(JSON.parse(filteredStorage.get("smallest-agreement:workspace:v1")).hideFirstGroupAtFloor, false);
  assert.equal(JSON.parse(filteredStorage.get("smallest-agreement:workspace:v1")).hideFirstGroupBelowThreshold, false);
  assert.equal(JSON.parse(filteredStorage.get("smallest-agreement:workspace:v1")).hideLastGroupBelowFloor, false);
  assert.equal(Object.hasOwn(JSON.parse(filteredStorage.get("smallest-agreement:proposal:v1")), "hideFirstGroupBelowFloor"), false);
  filtered.filterHideFirstGroupBelowFloor(false);
  assert.match(filtered.groups(), /Short/u);
  const empty = await savedWorkbench(new Map([["smallest-agreement:proposal:v1", JSON.stringify({
    title: "Only first below-floor group workshop",
    threshold: 70,
    groups: [{ id: "g", name: "Open", weight: 1, minSupport: 90 }],
    clauses: [{ id: "one", title: "One", options: [
      { id: "original", label: "Keep original", original: true, changeCost: 0, support: { g: 20 } },
      { id: "mid", label: "Mid option", original: false, changeCost: 1, support: { g: 30 } },
      { id: "other", label: "Other option", original: false, changeCost: 2, support: { g: 40 } },
    ] }],
  })]]));
  empty.filterHideFirstGroupBelowFloor(true);
  assert.match(empty.groups(), /No groups remain after hiding the first group whose average is currently below their support floor/u);
  assert.match(empty.groups(), /not a legal quorum/u);
  empty.filterHideFirstGroupBelowThreshold(true);
  assert.match(empty.groups(), /No groups remain after hiding the first group below the numeric approval threshold and the first group currently below their support floor/u);
  empty.filterHideFirstGroupBelowThreshold(false);
  const pair = await savedWorkbench(new Map([["smallest-agreement:proposal:v1", JSON.stringify({
    title: "First at-floor and first below-floor workshop",
    threshold: 50,
    groups: [
      { id: "cleared", name: "Cleared", weight: 1, minSupport: 40 },
      { id: "short", name: "Short", weight: 1, minSupport: 90 },
    ],
    clauses: [{ id: "one", title: "One", options: [
      { id: "original", label: "Keep original", original: true, changeCost: 0, support: { cleared: 90, short: 20 } },
      { id: "mid", label: "Mid option", original: false, changeCost: 1, support: { cleared: 80, short: 30 } },
      { id: "other", label: "Other option", original: false, changeCost: 2, support: { cleared: 70, short: 40 } },
    ] }],
  })]]));
  pair.filterHideFirstGroupAtFloor(true);
  pair.filterHideFirstGroupBelowFloor(true);
  assert.match(pair.groups(), /No groups remain after hiding the first group currently meeting their support floor and the first group currently below their support floor/u);
  assert.match(pair.shares(), /Cleared/u);
  assert.match(pair.shares(), /Short/u);
});

test("hide-last-group-below-floor hides only the last below-floor group without changing the stored draft", async () => {
  const html = await standaloneBytes();
  assert.match(html, /id="hide-last-group-below-floor"/u);
  assert.match(html, /Hide last group currently below their support floor/u);
  assert.match(html, /id="hide-last-group-below-floor"[^>]*aria-keyshortcuts="Backspace"/u);
  const storage = new Map();
  const app = await savedWorkbench(storage);
  const before = storage.get("smallest-agreement:proposal:v1");
  app.filterHideLastGroupBelowFloor(true);
  assert.equal(storage.get("smallest-agreement:proposal:v1"), before);
  const draft = {
    title: "Hide last group below floor workshop",
    threshold: 50,
    groups: [
      { id: "short", name: "Short", weight: 1, minSupport: 90 },
      { id: "open", name: "Open", weight: 1 },
      { id: "later", name: "Later", weight: 1, minSupport: 90 },
      { id: "cleared", name: "Cleared", weight: 1, minSupport: 40 },
    ],
    clauses: [{ id: "one", title: "One", options: [
      { id: "original", label: "Keep original", original: true, changeCost: 0, support: { short: 20, open: 80, later: 25, cleared: 90 } },
      { id: "mid", label: "Mid option", original: false, changeCost: 1, support: { short: 30, open: 70, later: 28, cleared: 80 } },
      { id: "other", label: "Other option", original: false, changeCost: 2, support: { short: 40, open: 60, later: 32, cleared: 70 } },
    ] }],
  };
  const filteredStorage = new Map([["smallest-agreement:proposal:v1", JSON.stringify(draft)]]);
  const filtered = await savedWorkbench(filteredStorage);
  filtered.filterHideLastGroupBelowFloor(true);
  assert.match(filtered.groups(), /Short/u);
  assert.match(filtered.groups(), /Open/u);
  assert.doesNotMatch(filtered.groups(), /data-group-id="later"/u);
  assert.match(filtered.groups(), /Cleared/u);
  assert.match(filtered.shares(), /Later/u);
  assert.match(filtered.vetoGroupsStatus(), /Showing 3 of 4 groups/u);
  filtered.filterHideFirstGroupBelowFloor(true);
  assert.doesNotMatch(filtered.groups(), /data-group-id="short"/u);
  assert.doesNotMatch(filtered.groups(), /data-group-id="later"/u);
  assert.match(filtered.groups(), /Open/u);
  assert.match(filtered.groups(), /Cleared/u);
  filtered.filterHideFirstGroupBelowFloor(false);
  filtered.filterHideLastGroupBelowThreshold(true);
  assert.doesNotMatch(filtered.groups(), /data-group-id="later"/u);
  assert.match(filtered.groups(), /Short/u);
  filtered.filterHideLastGroupBelowThreshold(false);
  assert.equal(JSON.parse(filteredStorage.get("smallest-agreement:proposal:v1")).title, "Hide last group below floor workshop");
  assert.equal(JSON.parse(filteredStorage.get("smallest-agreement:workspace:v1")).hideLastGroupBelowFloor, true);
  assert.equal(JSON.parse(filteredStorage.get("smallest-agreement:workspace:v1")).hideFirstGroupBelowFloor, false);
  assert.equal(JSON.parse(filteredStorage.get("smallest-agreement:workspace:v1")).hideLastGroupBelowThreshold, false);
  assert.equal(Object.hasOwn(JSON.parse(filteredStorage.get("smallest-agreement:proposal:v1")), "hideLastGroupBelowFloor"), false);
  filtered.filterHideLastGroupBelowFloor(false);
  assert.match(filtered.groups(), /Later/u);
  const empty = await savedWorkbench(new Map([["smallest-agreement:proposal:v1", JSON.stringify({
    title: "Only last below-floor group workshop",
    threshold: 70,
    groups: [{ id: "g", name: "Open", weight: 1, minSupport: 90 }],
    clauses: [{ id: "one", title: "One", options: [
      { id: "original", label: "Keep original", original: true, changeCost: 0, support: { g: 20 } },
      { id: "mid", label: "Mid option", original: false, changeCost: 1, support: { g: 30 } },
      { id: "other", label: "Other option", original: false, changeCost: 2, support: { g: 40 } },
    ] }],
  })]]));
  empty.filterHideLastGroupBelowFloor(true);
  assert.match(empty.groups(), /No groups remain after hiding the last group whose average is currently below their support floor/u);
  assert.match(empty.groups(), /not a legal quorum/u);
  empty.filterHideLastGroupBelowThreshold(true);
  assert.match(empty.groups(), /No groups remain after hiding the last group below the numeric approval threshold and the last group currently below their support floor/u);
  empty.filterHideLastGroupBelowThreshold(false);
  empty.filterHideFirstGroupBelowFloor(true);
  assert.match(empty.groups(), /No groups remain after hiding the first group currently below their support floor and the last group currently below their support floor/u);
  const pair = await savedWorkbench(new Map([["smallest-agreement:proposal:v1", JSON.stringify({
    title: "Last at-floor and last below-floor workshop",
    threshold: 50,
    groups: [
      { id: "cleared", name: "Cleared", weight: 1, minSupport: 40 },
      { id: "short", name: "Short", weight: 1, minSupport: 90 },
    ],
    clauses: [{ id: "one", title: "One", options: [
      { id: "original", label: "Keep original", original: true, changeCost: 0, support: { cleared: 90, short: 20 } },
      { id: "mid", label: "Mid option", original: false, changeCost: 1, support: { cleared: 80, short: 30 } },
      { id: "other", label: "Other option", original: false, changeCost: 2, support: { cleared: 70, short: 40 } },
    ] }],
  })]]));
  pair.filterHideLastGroupAtFloor(true);
  pair.filterHideLastGroupBelowFloor(true);
  assert.match(pair.groups(), /No groups remain after hiding the last group currently meeting their support floor and the last group currently below their support floor/u);
  assert.match(pair.shares(), /Cleared/u);
  assert.match(pair.shares(), /Short/u);
});

test("hide-last-group-without-floor hides only the last group with no support floor without changing the stored draft", async () => {
  const html = await standaloneBytes();
  assert.match(html, /id="hide-last-group-without-floor"/u);
  assert.match(html, /Hide last group without a support floor/u);
  assert.match(html, /id="hide-last-group-without-floor"[^>]*aria-keyshortcuts="F9"/u);
  const storage = new Map();
  const app = await savedWorkbench(storage);
  const before = storage.get("smallest-agreement:proposal:v1");
  app.filterHideLastGroupWithoutFloor(true);
  assert.equal(storage.get("smallest-agreement:proposal:v1"), before);
  const draft = {
    title: "Hide last group without floor workshop",
    threshold: 50,
    groups: [
      { id: "open", name: "Open", weight: 1 },
      { id: "floored", name: "Floored", weight: 1, minSupport: 40 },
      { id: "later", name: "Later open", weight: 1 },
      { id: "cleared", name: "Cleared", weight: 1, minSupport: 40 },
    ],
    clauses: [{ id: "one", title: "One", options: [
      { id: "original", label: "Keep original", original: true, changeCost: 0, support: { open: 80, floored: 90, later: 70, cleared: 90 } },
      { id: "mid", label: "Mid option", original: false, changeCost: 1, support: { open: 70, floored: 80, later: 65, cleared: 80 } },
      { id: "other", label: "Other option", original: false, changeCost: 2, support: { open: 60, floored: 70, later: 62, cleared: 70 } },
    ] }],
  };
  const filteredStorage = new Map([["smallest-agreement:proposal:v1", JSON.stringify(draft)]]);
  const filtered = await savedWorkbench(filteredStorage);
  filtered.filterHideLastGroupWithoutFloor(true);
  assert.match(filtered.groups(), /Open/u);
  assert.match(filtered.groups(), /Floored/u);
  assert.doesNotMatch(filtered.groups(), /data-group-id="later"/u);
  assert.match(filtered.groups(), /Cleared/u);
  assert.match(filtered.shares(), /Later open/u);
  assert.match(filtered.vetoGroupsStatus(), /Showing 3 of 4 groups/u);
  filtered.filterHideGroupsWithoutFloors(true);
  assert.doesNotMatch(filtered.groups(), /data-group-id="open"/u);
  assert.doesNotMatch(filtered.groups(), /data-group-id="later"/u);
  assert.match(filtered.groups(), /Floored/u);
  assert.match(filtered.groups(), /Cleared/u);
  filtered.filterHideGroupsWithoutFloors(false);
  filtered.filterHideLastGroupBelowFloor(true);
  assert.doesNotMatch(filtered.groups(), /data-group-id="later"/u);
  assert.match(filtered.groups(), /Open/u);
  filtered.filterHideLastGroupBelowFloor(false);
  assert.equal(JSON.parse(filteredStorage.get("smallest-agreement:proposal:v1")).title, "Hide last group without floor workshop");
  assert.equal(JSON.parse(filteredStorage.get("smallest-agreement:workspace:v1")).hideLastGroupWithoutFloor, true);
  assert.equal(JSON.parse(filteredStorage.get("smallest-agreement:workspace:v1")).hideGroupsWithoutFloors, false);
  assert.equal(JSON.parse(filteredStorage.get("smallest-agreement:workspace:v1")).hideLastGroupBelowFloor, false);
  assert.equal(Object.hasOwn(JSON.parse(filteredStorage.get("smallest-agreement:proposal:v1")), "hideLastGroupWithoutFloor"), false);
  filtered.filterHideLastGroupWithoutFloor(false);
  assert.match(filtered.groups(), /Later open/u);
  const empty = await savedWorkbench(new Map([["smallest-agreement:proposal:v1", JSON.stringify({
    title: "Only last group without floor workshop",
    threshold: 50,
    groups: [{ id: "g", name: "Open", weight: 1 }],
    clauses: [{ id: "one", title: "One", options: [
      { id: "original", label: "Keep original", original: true, changeCost: 0, support: { g: 90 } },
      { id: "mid", label: "Mid option", original: false, changeCost: 1, support: { g: 80 } },
      { id: "other", label: "Other option", original: false, changeCost: 2, support: { g: 70 } },
    ] }],
  })]]));
  empty.filterHideLastGroupWithoutFloor(true);
  assert.match(empty.groups(), /No groups remain after hiding the last group without a support floor/u);
  assert.match(empty.groups(), /not a legal quorum/u);
  empty.filterHideGroupsWithoutFloors(true);
  assert.match(empty.groups(), /No groups remain after hiding groups that have no support floor and the last group without a support floor/u);
  empty.filterHideGroupsWithoutFloors(false);
  const pair = await savedWorkbench(new Map([["smallest-agreement:proposal:v1", JSON.stringify({
    title: "Last below-floor and last without floor workshop",
    threshold: 50,
    groups: [
      { id: "short", name: "Short", weight: 1, minSupport: 90 },
      { id: "open", name: "Open", weight: 1 },
    ],
    clauses: [{ id: "one", title: "One", options: [
      { id: "original", label: "Keep original", original: true, changeCost: 0, support: { short: 20, open: 80 } },
      { id: "mid", label: "Mid option", original: false, changeCost: 1, support: { short: 30, open: 70 } },
      { id: "other", label: "Other option", original: false, changeCost: 2, support: { short: 40, open: 60 } },
    ] }],
  })]]));
  pair.filterHideLastGroupBelowFloor(true);
  pair.filterHideLastGroupWithoutFloor(true);
  assert.match(pair.groups(), /No groups remain after hiding the last group currently below their support floor and the last group without a support floor/u);
  assert.match(pair.shares(), /Short/u);
  assert.match(pair.shares(), /Open/u);
});

test("hide-first-group-without-floor hides only the first group with no support floor without changing the stored draft", async () => {
  const html = await standaloneBytes();
  assert.match(html, /id="hide-first-group-without-floor"/u);
  assert.match(html, /Hide first group without a support floor/u);
  assert.match(html, /id="hide-first-group-without-floor"[^>]*aria-keyshortcuts="F12"/u);
  const storage = new Map();
  const app = await savedWorkbench(storage);
  const before = storage.get("smallest-agreement:proposal:v1");
  app.filterHideFirstGroupWithoutFloor(true);
  assert.equal(storage.get("smallest-agreement:proposal:v1"), before);
  const draft = {
    title: "Hide first group without floor workshop",
    threshold: 50,
    groups: [
      { id: "open", name: "Open", weight: 1 },
      { id: "floored", name: "Floored", weight: 1, minSupport: 40 },
      { id: "later", name: "Later open", weight: 1 },
      { id: "cleared", name: "Cleared", weight: 1, minSupport: 40 },
    ],
    clauses: [{ id: "one", title: "One", options: [
      { id: "original", label: "Keep original", original: true, changeCost: 0, support: { open: 80, floored: 90, later: 70, cleared: 90 } },
      { id: "mid", label: "Mid option", original: false, changeCost: 1, support: { open: 70, floored: 80, later: 65, cleared: 80 } },
      { id: "other", label: "Other option", original: false, changeCost: 2, support: { open: 60, floored: 70, later: 62, cleared: 70 } },
    ] }],
  };
  const filteredStorage = new Map([["smallest-agreement:proposal:v1", JSON.stringify(draft)]]);
  const filtered = await savedWorkbench(filteredStorage);
  filtered.filterHideFirstGroupWithoutFloor(true);
  assert.doesNotMatch(filtered.groups(), /data-group-id="open"/u);
  assert.match(filtered.groups(), /Floored/u);
  assert.match(filtered.groups(), /Later open/u);
  assert.match(filtered.groups(), /Cleared/u);
  assert.match(filtered.shares(), /Open/u);
  assert.match(filtered.vetoGroupsStatus(), /Showing 3 of 4 groups/u);
  filtered.filterHideLastGroupWithoutFloor(true);
  assert.doesNotMatch(filtered.groups(), /data-group-id="open"/u);
  assert.doesNotMatch(filtered.groups(), /data-group-id="later"/u);
  assert.match(filtered.groups(), /Floored/u);
  assert.match(filtered.groups(), /Cleared/u);
  filtered.filterHideLastGroupWithoutFloor(false);
  filtered.filterHideGroupsWithoutFloors(true);
  assert.doesNotMatch(filtered.groups(), /data-group-id="open"/u);
  assert.doesNotMatch(filtered.groups(), /data-group-id="later"/u);
  assert.match(filtered.groups(), /Floored/u);
  filtered.filterHideGroupsWithoutFloors(false);
  filtered.filterHideLastGroupBelowFloor(true);
  assert.doesNotMatch(filtered.groups(), /data-group-id="open"/u);
  assert.match(filtered.groups(), /Later open/u);
  filtered.filterHideLastGroupBelowFloor(false);
  assert.equal(JSON.parse(filteredStorage.get("smallest-agreement:proposal:v1")).title, "Hide first group without floor workshop");
  assert.equal(JSON.parse(filteredStorage.get("smallest-agreement:workspace:v1")).hideFirstGroupWithoutFloor, true);
  assert.equal(JSON.parse(filteredStorage.get("smallest-agreement:workspace:v1")).hideLastGroupWithoutFloor, false);
  assert.equal(JSON.parse(filteredStorage.get("smallest-agreement:workspace:v1")).hideGroupsWithoutFloors, false);
  assert.equal(JSON.parse(filteredStorage.get("smallest-agreement:workspace:v1")).hideLastGroupBelowFloor, false);
  assert.equal(Object.hasOwn(JSON.parse(filteredStorage.get("smallest-agreement:proposal:v1")), "hideFirstGroupWithoutFloor"), false);
  filtered.filterHideFirstGroupWithoutFloor(false);
  assert.match(filtered.groups(), /Open/u);
  const empty = await savedWorkbench(new Map([["smallest-agreement:proposal:v1", JSON.stringify({
    title: "Only first group without floor workshop",
    threshold: 50,
    groups: [{ id: "g", name: "Open", weight: 1 }],
    clauses: [{ id: "one", title: "One", options: [
      { id: "original", label: "Keep original", original: true, changeCost: 0, support: { g: 90 } },
      { id: "mid", label: "Mid option", original: false, changeCost: 1, support: { g: 80 } },
      { id: "other", label: "Other option", original: false, changeCost: 2, support: { g: 70 } },
    ] }],
  })]]));
  empty.filterHideFirstGroupWithoutFloor(true);
  assert.match(empty.groups(), /No groups remain after hiding the first group without a support floor/u);
  assert.match(empty.groups(), /not a legal quorum/u);
  empty.filterHideGroupsWithoutFloors(true);
  assert.match(empty.groups(), /No groups remain after hiding groups that have no support floor and the first group without a support floor/u);
  empty.filterHideGroupsWithoutFloors(false);
  const pair = await savedWorkbench(new Map([["smallest-agreement:proposal:v1", JSON.stringify({
    title: "First and last without floor workshop",
    threshold: 50,
    groups: [
      { id: "open", name: "Open", weight: 1 },
      { id: "later", name: "Later", weight: 1 },
    ],
    clauses: [{ id: "one", title: "One", options: [
      { id: "original", label: "Keep original", original: true, changeCost: 0, support: { open: 80, later: 70 } },
      { id: "mid", label: "Mid option", original: false, changeCost: 1, support: { open: 70, later: 65 } },
      { id: "other", label: "Other option", original: false, changeCost: 2, support: { open: 60, later: 62 } },
    ] }],
  })]]));
  pair.filterHideFirstGroupWithoutFloor(true);
  pair.filterHideLastGroupWithoutFloor(true);
  assert.match(pair.groups(), /No groups remain after hiding the first group without a support floor and the last group without a support floor/u);
  assert.match(pair.shares(), /Open/u);
  assert.match(pair.shares(), /Later/u);
});

test("keyboard y reveals a veto group hidden by hide-first-group-below-floor", async () => {
  const draft = {
    title: "Veto first below floor workshop",
    threshold: 70,
    groups: [
      { id: "minority", name: "Minority", weight: 1, veto: true, minSupport: 90 },
      { id: "majority", name: "Majority", weight: 9, minSupport: 40 },
    ],
    clauses: [{ id: "one", title: "One", options: [
      { id: "original", label: "Keep original", original: true, changeCost: 0, support: { majority: 90, minority: 20 } },
      { id: "mid", label: "Mid option", original: false, changeCost: 1, support: { majority: 88, minority: 22 } },
      { id: "other", label: "Other option", original: false, changeCost: 2, support: { majority: 85, minority: 24 } },
    ] }],
  };
  const storage = new Map([["smallest-agreement:proposal:v1", JSON.stringify(draft)]]);
  const app = await savedWorkbench(storage);
  app.filterHideFirstGroupBelowFloor(true);
  assert.doesNotMatch(app.groups(), /data-group-id="minority"/u);
  assert.match(app.groups(), /Majority/u);
  app.clearFocus();
  app.keydown("y");
  assert.equal(app.focused(), '[data-field="group-name"][data-group-id="minority"]');
  assert.match(app.groups(), /Minority/u);
  assert.equal(JSON.parse(storage.get("smallest-agreement:workspace:v1")).hideFirstGroupBelowFloor, false);
  assert.equal(JSON.parse(storage.get("smallest-agreement:proposal:v1")).groups[0].name, "Minority");
});

test("keyboard y reveals a veto group hidden by hide-last-group-below-floor", async () => {
  const draft = {
    title: "Veto last below floor workshop",
    threshold: 70,
    groups: [
      { id: "majority", name: "Majority", weight: 9, minSupport: 40 },
      { id: "minority", name: "Minority", weight: 1, veto: true, minSupport: 90 },
    ],
    clauses: [{ id: "one", title: "One", options: [
      { id: "original", label: "Keep original", original: true, changeCost: 0, support: { majority: 90, minority: 20 } },
      { id: "mid", label: "Mid option", original: false, changeCost: 1, support: { majority: 88, minority: 22 } },
      { id: "other", label: "Other option", original: false, changeCost: 2, support: { majority: 85, minority: 24 } },
    ] }],
  };
  const storage = new Map([["smallest-agreement:proposal:v1", JSON.stringify(draft)]]);
  const app = await savedWorkbench(storage);
  app.filterHideLastGroupBelowFloor(true);
  assert.doesNotMatch(app.groups(), /data-group-id="minority"/u);
  assert.match(app.groups(), /Majority/u);
  app.clearFocus();
  app.keydown("y");
  assert.equal(app.focused(), '[data-field="group-name"][data-group-id="minority"]');
  assert.match(app.groups(), /Minority/u);
  assert.equal(JSON.parse(storage.get("smallest-agreement:workspace:v1")).hideLastGroupBelowFloor, false);
  assert.equal(JSON.parse(storage.get("smallest-agreement:proposal:v1")).groups[1].name, "Minority");
});

test("keyboard y reveals a veto group hidden by hide-last-group-without-floor", async () => {
  const draft = {
    title: "Veto last without floor workshop",
    threshold: 70,
    groups: [
      { id: "majority", name: "Majority", weight: 9, minSupport: 40 },
      { id: "minority", name: "Minority", weight: 1, veto: true },
    ],
    clauses: [{ id: "one", title: "One", options: [
      { id: "original", label: "Keep original", original: true, changeCost: 0, support: { majority: 90, minority: 80 } },
      { id: "mid", label: "Mid option", original: false, changeCost: 1, support: { majority: 88, minority: 78 } },
      { id: "other", label: "Other option", original: false, changeCost: 2, support: { majority: 85, minority: 76 } },
    ] }],
  };
  const storage = new Map([["smallest-agreement:proposal:v1", JSON.stringify(draft)]]);
  const app = await savedWorkbench(storage);
  app.filterHideLastGroupWithoutFloor(true);
  assert.doesNotMatch(app.groups(), /data-group-id="minority"/u);
  assert.match(app.groups(), /Majority/u);
  app.clearFocus();
  app.keydown("y");
  assert.equal(app.focused(), '[data-field="group-name"][data-group-id="minority"]');
  assert.match(app.groups(), /Minority/u);
  assert.equal(JSON.parse(storage.get("smallest-agreement:workspace:v1")).hideLastGroupWithoutFloor, false);
  assert.equal(JSON.parse(storage.get("smallest-agreement:proposal:v1")).groups[1].name, "Minority");
});

test("keyboard y reveals a veto group hidden by hide-first-group-without-floor", async () => {
  const draft = {
    title: "Veto first without floor workshop",
    threshold: 70,
    groups: [
      { id: "minority", name: "Minority", weight: 1, veto: true },
      { id: "majority", name: "Majority", weight: 9, minSupport: 40 },
    ],
    clauses: [{ id: "one", title: "One", options: [
      { id: "original", label: "Keep original", original: true, changeCost: 0, support: { majority: 90, minority: 80 } },
      { id: "mid", label: "Mid option", original: false, changeCost: 1, support: { majority: 88, minority: 78 } },
      { id: "other", label: "Other option", original: false, changeCost: 2, support: { majority: 85, minority: 76 } },
    ] }],
  };
  const storage = new Map([["smallest-agreement:proposal:v1", JSON.stringify(draft)]]);
  const app = await savedWorkbench(storage);
  app.filterHideFirstGroupWithoutFloor(true);
  assert.doesNotMatch(app.groups(), /data-group-id="minority"/u);
  assert.match(app.groups(), /Majority/u);
  app.clearFocus();
  app.keydown("y");
  assert.equal(app.focused(), '[data-field="group-name"][data-group-id="minority"]');
  assert.match(app.groups(), /Minority/u);
  assert.equal(JSON.parse(storage.get("smallest-agreement:workspace:v1")).hideFirstGroupWithoutFloor, false);
  assert.equal(JSON.parse(storage.get("smallest-agreement:proposal:v1")).groups[0].name, "Minority");
});

test("keyboard y reveals a veto group hidden by hide-last-group-below-threshold", async () => {
  const draft = {
    title: "Veto last below threshold workshop",
    threshold: 80,
    groups: [
      { id: "majority", name: "Majority", weight: 9 },
      { id: "minority", name: "Minority", weight: 1, veto: true },
    ],
    clauses: [{ id: "one", title: "One", options: [
      { id: "original", label: "Keep original", original: true, changeCost: 0, support: { majority: 90, minority: 10 } },
      { id: "mid", label: "Mid option", original: false, changeCost: 1, support: { majority: 88, minority: 20 } },
      { id: "other", label: "Other option", original: false, changeCost: 2, support: { majority: 85, minority: 30 } },
    ] }],
  };
  const storage = new Map([["smallest-agreement:proposal:v1", JSON.stringify(draft)]]);
  const app = await savedWorkbench(storage);
  app.filterHideLastGroupBelowThreshold(true);
  assert.doesNotMatch(app.groups(), /data-group-id="minority"/u);
  assert.match(app.groups(), /Majority/u);
  app.clearFocus();
  app.keydown("y");
  assert.equal(app.focused(), '[data-field="group-name"][data-group-id="minority"]');
  assert.match(app.groups(), /Minority/u);
  assert.equal(JSON.parse(storage.get("smallest-agreement:workspace:v1")).hideLastGroupBelowThreshold, false);
  assert.equal(JSON.parse(storage.get("smallest-agreement:proposal:v1")).groups[1].name, "Minority");
});

test("keyboard y reveals a veto group hidden by hide-first-group-below-threshold", async () => {
  const draft = {
    title: "Veto first below threshold workshop",
    threshold: 80,
    groups: [
      { id: "minority", name: "Minority", weight: 1, veto: true },
      { id: "majority", name: "Majority", weight: 9 },
    ],
    clauses: [{ id: "one", title: "One", options: [
      { id: "original", label: "Keep original", original: true, changeCost: 0, support: { majority: 90, minority: 10 } },
      { id: "mid", label: "Mid option", original: false, changeCost: 1, support: { majority: 88, minority: 20 } },
      { id: "other", label: "Other option", original: false, changeCost: 2, support: { majority: 85, minority: 30 } },
    ] }],
  };
  const storage = new Map([["smallest-agreement:proposal:v1", JSON.stringify(draft)]]);
  const app = await savedWorkbench(storage);
  app.filterHideFirstGroupBelowThreshold(true);
  assert.doesNotMatch(app.groups(), /data-group-id="minority"/u);
  assert.match(app.groups(), /Majority/u);
  app.clearFocus();
  app.keydown("y");
  assert.equal(app.focused(), '[data-field="group-name"][data-group-id="minority"]');
  assert.match(app.groups(), /Minority/u);
  assert.equal(JSON.parse(storage.get("smallest-agreement:workspace:v1")).hideFirstGroupBelowThreshold, false);
  assert.equal(JSON.parse(storage.get("smallest-agreement:proposal:v1")).groups[0].name, "Minority");
});

test("keyboard y reveals a veto group hidden by hide-last-group-at-or-above-threshold", async () => {
  const draft = {
    title: "Veto last at or above threshold workshop",
    threshold: 70,
    groups: [
      { id: "majority", name: "Majority", weight: 9 },
      { id: "minority", name: "Minority", weight: 1, veto: true },
    ],
    clauses: [{ id: "one", title: "One", options: [
      { id: "original", label: "Keep original", original: true, changeCost: 0, support: { majority: 90, minority: 80 } },
      { id: "mid", label: "Mid option", original: false, changeCost: 1, support: { majority: 88, minority: 78 } },
      { id: "other", label: "Other option", original: false, changeCost: 2, support: { majority: 85, minority: 76 } },
    ] }],
  };
  const storage = new Map([["smallest-agreement:proposal:v1", JSON.stringify(draft)]]);
  const app = await savedWorkbench(storage);
  app.filterHideLastGroupAtOrAboveThreshold(true);
  assert.doesNotMatch(app.groups(), /data-group-id="minority"/u);
  assert.match(app.groups(), /Majority/u);
  app.clearFocus();
  app.keydown("y");
  assert.equal(app.focused(), '[data-field="group-name"][data-group-id="minority"]');
  assert.match(app.groups(), /Minority/u);
  assert.equal(JSON.parse(storage.get("smallest-agreement:workspace:v1")).hideLastGroupAtOrAboveThreshold, false);
  assert.equal(JSON.parse(storage.get("smallest-agreement:proposal:v1")).groups[1].name, "Minority");
});

test("keyboard y reveals a veto group hidden by hide-first-group-at-or-above-threshold", async () => {
  const draft = {
    title: "Veto first at or above threshold workshop",
    threshold: 70,
    groups: [
      { id: "minority", name: "Minority", weight: 1, veto: true },
      { id: "majority", name: "Majority", weight: 9 },
    ],
    clauses: [{ id: "one", title: "One", options: [
      { id: "original", label: "Keep original", original: true, changeCost: 0, support: { majority: 90, minority: 80 } },
      { id: "mid", label: "Mid option", original: false, changeCost: 1, support: { majority: 88, minority: 78 } },
      { id: "other", label: "Other option", original: false, changeCost: 2, support: { majority: 85, minority: 76 } },
    ] }],
  };
  const storage = new Map([["smallest-agreement:proposal:v1", JSON.stringify(draft)]]);
  const app = await savedWorkbench(storage);
  app.filterHideFirstGroupAtOrAboveThreshold(true);
  assert.doesNotMatch(app.groups(), /data-group-id="minority"/u);
  assert.match(app.groups(), /Majority/u);
  app.clearFocus();
  app.keydown("y");
  assert.equal(app.focused(), '[data-field="group-name"][data-group-id="minority"]');
  assert.match(app.groups(), /Minority/u);
  assert.equal(JSON.parse(storage.get("smallest-agreement:workspace:v1")).hideFirstGroupAtOrAboveThreshold, false);
  assert.equal(JSON.parse(storage.get("smallest-agreement:proposal:v1")).groups[0].name, "Minority");
});

test("keyboard y reveals a veto group hidden by hide-last-group-at-floor", async () => {
  const draft = {
    title: "Veto last at floor workshop",
    threshold: 70,
    groups: [
      { id: "majority", name: "Majority", weight: 9, minSupport: 40 },
      { id: "minority", name: "Minority", weight: 1, veto: true, minSupport: 40 },
    ],
    clauses: [{ id: "one", title: "One", options: [
      { id: "original", label: "Keep original", original: true, changeCost: 0, support: { majority: 90, minority: 80 } },
      { id: "mid", label: "Mid option", original: false, changeCost: 1, support: { majority: 88, minority: 78 } },
      { id: "other", label: "Other option", original: false, changeCost: 2, support: { majority: 85, minority: 76 } },
    ] }],
  };
  const storage = new Map([["smallest-agreement:proposal:v1", JSON.stringify(draft)]]);
  const app = await savedWorkbench(storage);
  app.filterHideLastGroupAtFloor(true);
  assert.doesNotMatch(app.groups(), /data-group-id="minority"/u);
  assert.match(app.groups(), /Majority/u);
  app.clearFocus();
  app.keydown("y");
  assert.equal(app.focused(), '[data-field="group-name"][data-group-id="minority"]');
  assert.match(app.groups(), /Minority/u);
  assert.equal(JSON.parse(storage.get("smallest-agreement:workspace:v1")).hideLastGroupAtFloor, false);
  assert.equal(JSON.parse(storage.get("smallest-agreement:proposal:v1")).groups[1].name, "Minority");
});

test("keyboard y reveals a veto group hidden by hide-first-group-at-floor", async () => {
  const draft = {
    title: "Veto first at floor workshop",
    threshold: 70,
    groups: [
      { id: "minority", name: "Minority", weight: 1, veto: true, minSupport: 40 },
      { id: "majority", name: "Majority", weight: 9, minSupport: 40 },
    ],
    clauses: [{ id: "one", title: "One", options: [
      { id: "original", label: "Keep original", original: true, changeCost: 0, support: { majority: 90, minority: 80 } },
      { id: "mid", label: "Mid option", original: false, changeCost: 1, support: { majority: 88, minority: 78 } },
      { id: "other", label: "Other option", original: false, changeCost: 2, support: { majority: 85, minority: 76 } },
    ] }],
  };
  const storage = new Map([["smallest-agreement:proposal:v1", JSON.stringify(draft)]]);
  const app = await savedWorkbench(storage);
  app.filterHideFirstGroupAtFloor(true);
  assert.doesNotMatch(app.groups(), /data-group-id="minority"/u);
  assert.match(app.groups(), /Majority/u);
  app.clearFocus();
  app.keydown("y");
  assert.equal(app.focused(), '[data-field="group-name"][data-group-id="minority"]');
  assert.match(app.groups(), /Minority/u);
  assert.equal(JSON.parse(storage.get("smallest-agreement:workspace:v1")).hideFirstGroupAtFloor, false);
  assert.equal(JSON.parse(storage.get("smallest-agreement:proposal:v1")).groups[0].name, "Minority");
});

test("keyboard y reveals a veto group hidden by hide-first-veto-group", async () => {
  const storage = new Map();
  const app = await savedWorkbench(storage);
  app.field("#preset-select", "club-constitution");
  app.click("#load-preset");
  app.filterHideFirstVetoGroup(true);
  assert.doesNotMatch(app.groups(), /data-group-id="officers"/u);
  assert.match(app.groups(), /Members/u);
  app.clearFocus();
  app.keydown("y");
  assert.equal(app.focused(), '[data-field="group-name"][data-group-id="officers"]');
  assert.match(app.groups(), /Officers/u);
  assert.equal(JSON.parse(storage.get("smallest-agreement:workspace:v1")).hideFirstVetoGroup, false);
  assert.equal(JSON.parse(storage.get("smallest-agreement:proposal:v1")).groups.find((group) => group.id === "officers").name, "Officers");
});

test("keyboard y reveals a veto group hidden by hide-last-veto-group", async () => {
  const storage = new Map();
  const app = await savedWorkbench(storage);
  app.field("#preset-select", "club-constitution");
  app.click("#load-preset");
  app.filterHideLastVetoGroup(true);
  assert.doesNotMatch(app.groups(), /data-group-id="officers"/u);
  assert.match(app.groups(), /Members/u);
  app.clearFocus();
  app.keydown("y");
  assert.equal(app.focused(), '[data-field="group-name"][data-group-id="officers"]');
  assert.match(app.groups(), /Officers/u);
  assert.equal(JSON.parse(storage.get("smallest-agreement:workspace:v1")).hideLastVetoGroup, false);
  assert.equal(JSON.parse(storage.get("smallest-agreement:proposal:v1")).groups.find((group) => group.id === "officers").name, "Officers");
});

test("keyboard y reveals a veto group hidden by hide-veto-groups", async () => {
  const storage = new Map();
  const app = await savedWorkbench(storage);
  app.field("#preset-select", "club-constitution");
  app.click("#load-preset");
  app.filterHideVetoGroups(true);
  assert.doesNotMatch(app.groups(), /data-group-id="officers"/u);
  assert.match(app.groups(), /Members/u);
  app.clearFocus();
  app.keydown("y");
  assert.equal(app.focused(), '[data-field="group-name"][data-group-id="officers"]');
  assert.match(app.groups(), /Officers/u);
  assert.equal(JSON.parse(storage.get("smallest-agreement:workspace:v1")).hideVetoGroups, false);
  assert.equal(JSON.parse(storage.get("smallest-agreement:proposal:v1")).groups.find((group) => group.id === "officers").name, "Officers");
});

test("keyboard y reveals a veto group hidden by hide-groups-below-threshold", async () => {
  const draft = {
    title: "Veto below threshold workshop",
    threshold: 80,
    groups: [
      { id: "majority", name: "Majority", weight: 9 },
      { id: "minority", name: "Minority", weight: 1, veto: true },
    ],
    clauses: [{ id: "one", title: "One", options: [
      { id: "original", label: "Keep original", original: true, changeCost: 0, support: { majority: 90, minority: 10 } },
      { id: "mid", label: "Mid option", original: false, changeCost: 1, support: { majority: 88, minority: 20 } },
      { id: "other", label: "Other option", original: false, changeCost: 2, support: { majority: 85, minority: 30 } },
    ] }],
  };
  const storage = new Map([["smallest-agreement:proposal:v1", JSON.stringify(draft)]]);
  const app = await savedWorkbench(storage);
  app.filterHideGroupsBelowThreshold(true);
  assert.doesNotMatch(app.groups(), /data-group-id="minority"/u);
  assert.match(app.groups(), /Majority/u);
  app.clearFocus();
  app.keydown("y");
  assert.equal(app.focused(), '[data-field="group-name"][data-group-id="minority"]');
  assert.match(app.groups(), /Minority/u);
  assert.equal(JSON.parse(storage.get("smallest-agreement:workspace:v1")).hideGroupsBelowThreshold, false);
  assert.equal(JSON.parse(storage.get("smallest-agreement:proposal:v1")).groups[1].name, "Minority");
});

test("veto-only group filter hides non-veto cards without changing the stored draft", async () => {
  const html = await standaloneBytes();
  assert.match(html, /id="veto-groups-status"[^>]*role="status"/u);
  assert.match(html, /id="veto-groups-status"[^>]*aria-live="polite"/u);
  const storage = new Map();
  const app = await savedWorkbench(storage);
  const before = storage.get("smallest-agreement:proposal:v1");
  app.filterVetoGroups(true);
  assert.match(app.groups(), /No veto groups match this filter/u);
  assert.match(app.vetoGroupsStatus(), /No veto groups match this filter/u);
  assert.match(app.shares(), /Residents/u);
  assert.equal(storage.get("smallest-agreement:proposal:v1"), before);
  app.filterVetoGroups(false);
  app.field("#preset-select", "club-constitution");
  app.click("#load-preset");
  app.filterVetoGroups(true);
  assert.match(app.groups(), /Officers/u);
  assert.doesNotMatch(app.groups(), /Club staff/u);
  assert.doesNotMatch(app.groups(), /data-group-id="members"/u);
  assert.match(app.shares(), /Members/u);
  assert.match(app.vetoGroupsStatus(), /Showing 1 of 3 groups/u);
});

test("keyboard v toggles the veto-only group filter unless an input is active", async () => {
  const storage = new Map();
  const app = await savedWorkbench(storage);
  const before = storage.get("smallest-agreement:proposal:v1");
  app.keydown("v");
  assert.match(app.groups(), /No veto groups match this filter/u);
  assert.match(app.vetoGroupsStatus(), /No veto groups match this filter/u);
  assert.match(app.shares(), /Residents/u);
  assert.equal(storage.get("smallest-agreement:proposal:v1"), before);
  app.clearFocus();
  app.keydown("v", { tagName: "INPUT", isContentEditable: false });
  assert.match(app.groups(), /No veto groups match this filter/u);
  app.keydown("v", { tagName: "TEXTAREA", isContentEditable: false });
  assert.match(app.groups(), /No veto groups match this filter/u);
  app.keydown("v");
  assert.match(app.groups(), /Residents/u);
  app.field("#preset-select", "club-constitution");
  app.click("#load-preset");
  app.keydown("V");
  assert.match(app.groups(), /Officers/u);
  assert.doesNotMatch(app.groups(), /Club staff/u);
  assert.doesNotMatch(app.groups(), /data-group-id="members"/u);
  assert.match(app.shares(), /Members/u);
});

test("keyboard b jumps to the first veto-blocker highlight unless an input is active", async () => {
  const html = await standaloneBytes();
  assert.match(html, /<kbd>b<\/kbd> Jump to the first veto-blocker highlight, or the veto list/u);
  const app = await savedWorkbench(new Map());
  app.keydown("b");
  assert.equal(app.focused(), "#constraint-checks");
  app.clearFocus();
  app.keydown("b", { tagName: "INPUT", isContentEditable: false });
  assert.equal(app.focused(), "");
  app.keydown("b", { tagName: "TEXTAREA", isContentEditable: false });
  assert.equal(app.focused(), "");
  const key = "smallest-agreement:proposal:v1";
  const draft = {
    title: "Veto jump workshop",
    threshold: 80,
    groups: [
      { id: "majority", name: "Majority", weight: 9 },
      { id: "minority", name: "Minority", weight: 1, veto: true },
    ],
    clauses: [{ id: "one", title: "One", options: [
      { id: "original", label: "Keep original", original: true, changeCost: 0, support: { majority: 90, minority: 10 } },
      { id: "mid", label: "Mid option", original: false, changeCost: 1, support: { majority: 88, minority: 20 } },
      { id: "other", label: "Other option", original: false, changeCost: 2, support: { majority: 85, minority: 30 } },
    ] }],
  };
  const blocked = await savedWorkbench(new Map([[key, JSON.stringify(draft)]]));
  assert.match(blocked.groups(), /data-veto-block="minority"/u);
  blocked.keydown("B");
  assert.equal(blocked.focused(), '[data-veto-block="minority"]');
});

test("keyboard g focuses the first group card unless an input is active", async () => {
  const html = await standaloneBytes();
  assert.match(html, /id="groups-heading"/u);
  assert.match(html, /<kbd>g<\/kbd> Focus the participant groups heading or the first group card/u);
  const app = await savedWorkbench(new Map());
  app.keydown("g");
  assert.equal(app.focused(), '[data-field="group-name"][data-group-id="residents"]');
  app.clearFocus();
  app.keydown("g", { tagName: "INPUT", isContentEditable: false });
  assert.equal(app.focused(), "");
  app.keydown("g", { tagName: "SELECT", isContentEditable: false });
  assert.equal(app.focused(), "");
  app.keydown("G");
  assert.equal(app.focused(), '[data-field="group-name"][data-group-id="residents"]');
  app.filterVetoGroups(true);
  app.clearFocus();
  app.keydown("g");
  assert.equal(app.focused(), "#groups-heading");
});

test("keyboard c jumps to the change-budget field unless an input is active", async () => {
  const html = await standaloneBytes();
  assert.match(html, /<kbd>c<\/kbd> Jump to the change-budget field/u);
  const app = await savedWorkbench(new Map());
  app.keydown("c");
  assert.equal(app.focused(), "#max-change-cost");
  app.clearFocus();
  app.keydown("c", { tagName: "INPUT", isContentEditable: false });
  assert.equal(app.focused(), "");
  app.keydown("c", { tagName: "TEXTAREA", isContentEditable: false });
  assert.equal(app.focused(), "");
  app.keydown("C");
  assert.equal(app.focused(), "#max-change-cost");
});

test("keyboard p prints the facilitator pack unless an input is active", async () => {
  const html = await standaloneBytes();
  assert.match(html, /<kbd>p<\/kbd> Print the facilitator pack/u);
  const app = await savedWorkbench(new Map());
  app.keydown("p");
  assert.equal(app.printCalls(), 1);
  app.clearFocus();
  app.keydown("p", { tagName: "INPUT", isContentEditable: false });
  assert.equal(app.printCalls(), 1);
  app.keydown("p", { tagName: "TEXTAREA", isContentEditable: false });
  assert.equal(app.printCalls(), 1);
  app.keydown("P");
  assert.equal(app.printCalls(), 2);
});

test("keyboard k jumps to the first unlocked clause unless an input is active", async () => {
  const html = await standaloneBytes();
  assert.match(html, /<kbd>k<\/kbd> Jump to the first unlocked clause card, or the lock controls/u);
  const app = await savedWorkbench(new Map());
  app.keydown("k");
  assert.equal(app.focused(), '[data-field="clause-title"][data-clause-id="hours"]');
  app.clearFocus();
  app.keydown("k", { tagName: "INPUT", isContentEditable: false });
  assert.equal(app.focused(), "");
  app.clickAction("toggle-clause-lock", { clauseId: "hours", optionId: "hours-pilot" });
  app.clickAction("toggle-clause-lock", { clauseId: "market", optionId: "market-monthly" });
  app.clickAction("toggle-clause-lock", { clauseId: "path", optionId: "path-warm" });
  app.clearFocus();
  app.keydown("K");
  assert.equal(app.focused(), "#clear-locks");
});

test("keyboard t jumps to the approval threshold field unless an input is active", async () => {
  const html = await standaloneBytes();
  assert.match(html, /<kbd>t<\/kbd> Jump to the approval threshold field/u);
  assert.match(html, /id="threshold-number"/u);
  const app = await savedWorkbench(new Map());
  app.keydown("t");
  assert.equal(app.focused(), "#threshold-number");
  app.clearFocus();
  app.keydown("t", { tagName: "INPUT", isContentEditable: false });
  assert.equal(app.focused(), "");
  app.keydown("t", { tagName: "TEXTAREA", isContentEditable: false });
  assert.equal(app.focused(), "");
  app.keydown("t", { tagName: "SELECT", isContentEditable: false });
  assert.equal(app.focused(), "");
  app.keydown("T");
  assert.equal(app.focused(), "#threshold-number");
});

test("keyboard a focuses Add clause unless an input is active", async () => {
  const html = await standaloneBytes();
  assert.match(html, /<kbd>a<\/kbd> Focus Add clause/u);
  assert.match(html, /id="add-clause"/u);
  const app = await savedWorkbench(new Map());
  app.keydown("a");
  assert.equal(app.focused(), "#add-clause");
  app.clearFocus();
  app.keydown("a", { tagName: "INPUT", isContentEditable: false });
  assert.equal(app.focused(), "");
  app.keydown("a", { tagName: "SELECT", isContentEditable: false });
  assert.equal(app.focused(), "");
  app.keydown("a", { tagName: "TEXTAREA", isContentEditable: false });
  assert.equal(app.focused(), "");
  app.keydown("A");
  assert.equal(app.focused(), "#add-clause");
});

test("keyboard w jumps to group weights or renormalize controls unless an input is active", async () => {
  const html = await standaloneBytes();
  assert.match(html, /<kbd>w<\/kbd> Jump to group weights or renormalize controls/u);
  assert.match(html, /id="weight-renorm"/u);
  const app = await savedWorkbench(new Map());
  app.keydown("w");
  assert.equal(app.focused(), '[data-action="preview-renorm"]');
  app.clearFocus();
  app.keydown("w", { tagName: "INPUT", isContentEditable: false });
  assert.equal(app.focused(), "");
  app.keydown("w", { tagName: "TEXTAREA", isContentEditable: false });
  assert.equal(app.focused(), "");
  app.keydown("W");
  assert.equal(app.focused(), '[data-action="preview-renorm"]');
});

test("keyboard m jumps to remaining change-budget unless an input is active", async () => {
  const html = await standaloneBytes();
  assert.match(html, /<kbd>m<\/kbd> Jump to remaining change-budget or cost margin/u);
  assert.match(html, /id="budget-remaining"/u);
  const app = await savedWorkbench(new Map());
  app.keydown("m");
  assert.equal(app.focused(), "#budget-remaining");
  assert.match(app.summary(), /id="budget-remaining"/u);
  app.clearFocus();
  app.keydown("m", { tagName: "INPUT", isContentEditable: false });
  assert.equal(app.focused(), "");
  app.keydown("m", { tagName: "TEXTAREA", isContentEditable: false });
  assert.equal(app.focused(), "");
  app.keydown("M");
  assert.equal(app.focused(), "#budget-remaining");
});

test("keyboard d jumps to the first group below its support floor unless an input is active", async () => {
  const html = await standaloneBytes();
  assert.match(html, /<kbd>d<\/kbd> Jump to the first group below its support floor, or the groups heading/u);
  assert.match(html, /id="groups-heading"/u);
  const app = await savedWorkbench(new Map());
  assert.match(app.groups(), /data-below-floor="residents"/u);
  app.keydown("d");
  assert.equal(app.focused(), '[data-field="group-name"][data-group-id="residents"]');
  app.clearFocus();
  app.keydown("d", { tagName: "INPUT", isContentEditable: false });
  assert.equal(app.focused(), "");
  app.keydown("d", { tagName: "TEXTAREA", isContentEditable: false });
  assert.equal(app.focused(), "");
  app.keydown("D");
  assert.equal(app.focused(), '[data-field="group-name"][data-group-id="residents"]');
  const draft = {
    title: "Floor jump workshop",
    threshold: 50,
    groups: [
      { id: "cleared", name: "Cleared", weight: 1, minSupport: 40 },
      { id: "open", name: "Open", weight: 1 },
    ],
    clauses: [{ id: "one", title: "One", options: [
      { id: "original", label: "Keep original", original: true, changeCost: 0, support: { cleared: 90, open: 90 } },
      { id: "mid", label: "Mid option", original: false, changeCost: 1, support: { cleared: 80, open: 80 } },
      { id: "other", label: "Other option", original: false, changeCost: 2, support: { cleared: 70, open: 70 } },
    ] }],
  };
  const cleared = await savedWorkbench(new Map([["smallest-agreement:proposal:v1", JSON.stringify(draft)]]));
  cleared.keydown("d");
  assert.equal(cleared.focused(), "#groups-heading");
});

test("keyboard o jumps to the first recommended-package option unless an input is active", async () => {
  const html = await standaloneBytes();
  assert.match(html, /<kbd>o<\/kbd> Jump to the first recommended-package option card, or the clauses heading/u);
  assert.match(html, /id="clauses-heading"/u);
  const app = await savedWorkbench(new Map());
  assert.match(app.clauses(), /data-recommended-option="hours-original"/u);
  app.keydown("o");
  assert.equal(app.focused(), '[data-recommended-option="hours-original"]');
  app.clearFocus();
  app.keydown("o", { tagName: "INPUT", isContentEditable: false });
  assert.equal(app.focused(), "");
  app.keydown("o", { tagName: "TEXTAREA", isContentEditable: false });
  assert.equal(app.focused(), "");
  app.keydown("O");
  assert.equal(app.focused(), '[data-recommended-option="hours-original"]');
  const draft = {
    title: "No recommendation jump workshop",
    threshold: 95,
    maxChangeCost: 0,
    groups: [{ id: "g", name: "Group", weight: 1 }],
    clauses: [{ id: "one", title: "One", options: [
      { id: "original", label: "Keep original", original: true, changeCost: 0, support: { g: 10 } },
      { id: "mid", label: "Mid option", original: false, changeCost: 1, support: { g: 90 } },
      { id: "other", label: "Other option", original: false, changeCost: 2, support: { g: 90 } },
    ] }],
  };
  const missing = await savedWorkbench(new Map([["smallest-agreement:proposal:v1", JSON.stringify(draft)]]));
  missing.keydown("o");
  assert.equal(missing.focused(), "#clauses-heading");
});

test("keyboard j copies remaining change-budget unless an input is active", async () => {
  const html = await standaloneBytes();
  assert.match(html, /<kbd>j<\/kbd> Copy remaining change-budget as one-line Markdown/u);
  const app = await savedWorkbench(new Map());
  app.keydown("j");
  assert.match(app.clipboardText(), /leftover change-budget is unlimited/u);
  assert.match(app.clipboardText(), /not a legal appropriation/u);
  assert.doesNotMatch(app.clipboardText(), /^# Recommended package/u);
  app.clearFocus();
  app.keydown("j", { tagName: "INPUT", isContentEditable: false });
  assert.equal(app.focused(), "");
  app.keydown("j", { tagName: "TEXTAREA", isContentEditable: false });
  assert.equal(app.focused(), "");
  const again = await savedWorkbench(new Map());
  again.keydown("J");
  assert.match(again.clipboardText(), /leftover change-budget is unlimited/u);
  const blocked = await savedWorkbench(new Map());
  blocked.blockClipboard();
  await blocked.click("#copy-remaining-budget-button");
  assert.equal(blocked.focused(), "#remaining-budget-fallback");
  blocked.clearFocus();
  blocked.keydown("j", { tagName: "INPUT", isContentEditable: false });
  assert.equal(blocked.focused(), "");
});

test("keyboard y jumps to the first veto group card unless an input is active", async () => {
  const html = await standaloneBytes();
  assert.match(html, /<kbd>y<\/kbd> Jump to the first veto group card, or the groups heading/u);
  assert.match(html, /id="groups-heading"/u);
  const app = await savedWorkbench(new Map());
  app.keydown("y");
  assert.equal(app.focused(), "#groups-heading");
  app.clearFocus();
  app.keydown("y", { tagName: "INPUT", isContentEditable: false });
  assert.equal(app.focused(), "");
  app.keydown("y", { tagName: "TEXTAREA", isContentEditable: false });
  assert.equal(app.focused(), "");
  app.field("#preset-select", "club-constitution");
  app.click("#load-preset");
  app.clearFocus();
  app.keydown("Y");
  assert.equal(app.focused(), '[data-field="group-name"][data-group-id="officers"]');
});

test("keyboard q jumps to the first clause that differs from the recommendation unless an input is active", async () => {
  const html = await standaloneBytes();
  assert.match(html, /<kbd>q<\/kbd> Jump to the first clause that differs from the recommendation, or the clauses heading/u);
  assert.match(html, /id="clauses-heading"/u);
  const unchanged = await savedWorkbench(new Map());
  unchanged.keydown("q");
  assert.equal(unchanged.focused(), "#clauses-heading");
  unchanged.clearFocus();
  unchanged.keydown("q", { tagName: "INPUT", isContentEditable: false });
  assert.equal(unchanged.focused(), "");
  unchanged.keydown("q", { tagName: "TEXTAREA", isContentEditable: false });
  assert.equal(unchanged.focused(), "");
  const draft = {
    title: "Changed clause jump workshop",
    threshold: 70,
    groups: [{ id: "g", name: "Group", weight: 1 }],
    clauses: [
      { id: "keep", title: "Keep", options: [
        { id: "keep-original", label: "Keep original keep", original: true, changeCost: 0, support: { g: 90 } },
        { id: "keep-alt", label: "Alt keep", original: false, changeCost: 5, support: { g: 40 } },
        { id: "keep-other", label: "Other keep", original: false, changeCost: 8, support: { g: 20 } },
      ] },
      { id: "spend", title: "Spend", options: [
        { id: "spend-original", label: "Keep original spend", original: true, changeCost: 0, support: { g: 40 } },
        { id: "spend-alt", label: "Alt spend", original: false, changeCost: 2, support: { g: 90 } },
        { id: "spend-other", label: "Other spend", original: false, changeCost: 8, support: { g: 20 } },
      ] },
    ],
  };
  const changed = await savedWorkbench(new Map([["smallest-agreement:proposal:v1", JSON.stringify(draft)]]));
  changed.keydown("Q");
  assert.equal(changed.focused(), '[data-field="clause-title"][data-clause-id="spend"]');
});

test("keyboard i copies original versus recommended labels and costs unless an input is active", async () => {
  const html = await standaloneBytes();
  assert.match(html, /<kbd>i<\/kbd> Copy original versus recommended labels and costs as compact Markdown/u);
  const app = await savedWorkbench(new Map());
  app.keydown("i");
  assert.match(app.clipboardText(), /^# Original versus recommended package/u);
  assert.match(app.clipboardText(), /option labels and costs only/u);
  assert.match(app.clipboardText(), /not a recorded vote/u);
  assert.doesNotMatch(app.clipboardText(), /^# Recommended package/u);
  app.clearFocus();
  app.keydown("i", { tagName: "INPUT", isContentEditable: false });
  assert.equal(app.focused(), "");
  app.keydown("i", { tagName: "TEXTAREA", isContentEditable: false });
  assert.equal(app.focused(), "");
  const again = await savedWorkbench(new Map());
  again.keydown("I");
  assert.match(again.clipboardText(), /^# Original versus recommended package/u);
  const blocked = await savedWorkbench(new Map());
  blocked.blockClipboard();
  await blocked.click("#copy-original-versus-recommended-button");
  assert.equal(blocked.focused(), "#original-versus-recommended-fallback");
  blocked.clearFocus();
  blocked.keydown("i", { tagName: "INPUT", isContentEditable: false });
  assert.equal(blocked.focused(), "");
});

test("keyboard h jumps to the workshop method heading unless an input is active", async () => {
  const html = await standaloneBytes();
  assert.match(html, /<kbd>h<\/kbd> Jump to the workshop method \/ How it works heading/u);
  assert.match(html, /id="method-heading"/u);
  assert.match(html, /id="method-heading"[^>]*tabindex="-1"/u);
  assert.match(html, />How it works</u);
  const app = await savedWorkbench(new Map());
  app.keydown("h");
  assert.equal(app.focused(), "#method-heading");
  app.clearFocus();
  app.keydown("h", { tagName: "INPUT", isContentEditable: false });
  assert.equal(app.focused(), "");
  app.keydown("h", { tagName: "TEXTAREA", isContentEditable: false });
  assert.equal(app.focused(), "");
  app.keydown("h", { tagName: "SELECT", isContentEditable: false });
  assert.equal(app.focused(), "");
  app.keydown("H");
  assert.equal(app.focused(), "#method-heading");
});

test("keyboard period jumps to the first locked clause card unless an input is active", async () => {
  const html = await standaloneBytes();
  assert.match(html, /<kbd>\.<\/kbd> Jump to the first locked clause card, or the clauses heading/u);
  assert.match(html, /id="clauses-heading"/u);
  const app = await savedWorkbench(new Map());
  app.keydown(".");
  assert.equal(app.focused(), "#clauses-heading");
  app.clearFocus();
  app.keydown(".", { tagName: "INPUT", isContentEditable: false });
  assert.equal(app.focused(), "");
  app.keydown(".", { tagName: "TEXTAREA", isContentEditable: false });
  assert.equal(app.focused(), "");
  app.clickAction("toggle-clause-lock", { clauseId: "hours", optionId: "hours-pilot" });
  app.clearFocus();
  app.keydown(".");
  assert.equal(app.focused(), '[data-field="clause-title"][data-clause-id="hours"]');
});

test("keyboard semicolon copies the current lock count unless an input is active", async () => {
  const html = await standaloneBytes();
  assert.match(html, /<kbd>;<\/kbd> Copy the current lock count as one-line Markdown/u);
  assert.match(html, /id="copy-lock-count-button"/u);
  const app = await savedWorkbench(new Map());
  app.keydown(";");
  assert.equal(app.clipboardText(), "Current lock count: 0. Locks are draft choices, not a legal hold.\n");
  assert.equal(app.clipboardText(), app.lockCount());
  assert.doesNotMatch(app.clipboardText(), /# Current clause locks/u);
  assert.doesNotMatch(app.clipboardText(), /Unlocked/u);
  assert.match(app.clipboardText(), /not a legal hold/u);
  app.clearFocus();
  app.keydown(";", { tagName: "INPUT", isContentEditable: false });
  assert.equal(app.focused(), "");
  app.keydown(";", { tagName: "TEXTAREA", isContentEditable: false });
  assert.equal(app.focused(), "");
  const shifted = await savedWorkbench(new Map());
  shifted.keydown(":");
  assert.doesNotMatch(shifted.clipboardText(), /Current lock count/u);
  const locked = await savedWorkbench(new Map());
  locked.clickAction("toggle-clause-lock", { clauseId: "hours", optionId: "hours-pilot" });
  locked.clearFocus();
  locked.keydown(";");
  assert.equal(locked.clipboardText(), "Current lock count: 1. Locks are draft choices, not a legal hold.\n");
  const blocked = await savedWorkbench(new Map());
  blocked.blockClipboard();
  await blocked.click("#copy-lock-count-button");
  assert.equal(blocked.focused(), "#lock-count-fallback");
  blocked.clearFocus();
  blocked.keydown(";", { tagName: "INPUT", isContentEditable: false });
  assert.equal(blocked.focused(), "");
});

test("keyboard [ jumps to the lock-count copy control unless an input is active", async () => {
  const html = await standaloneBytes();
  assert.match(html, /<kbd>\[<\/kbd> Jump to the lock-count copy control, or the locks heading/u);
  assert.match(html, /id="copy-lock-count-button"/u);
  assert.match(html, /id="locks-heading"/u);
  const app = await savedWorkbench(new Map());
  app.keydown("[");
  assert.equal(app.focused(), "#copy-lock-count-button");
  app.clearFocus();
  app.keydown("[", { tagName: "INPUT", isContentEditable: false });
  assert.equal(app.focused(), "");
  app.keydown("[", { tagName: "TEXTAREA", isContentEditable: false });
  assert.equal(app.focused(), "");
  app.keydown("[", { tagName: "SELECT", isContentEditable: false });
  assert.equal(app.focused(), "");
});

test("keyboard ] jumps to Print facilitator pack unless an input is active", async () => {
  const html = await standaloneBytes();
  assert.match(html, /<kbd>\]<\/kbd> Jump to Print facilitator pack, or the facilitator pack heading/u);
  assert.match(html, /id="print-button"/u);
  assert.match(html, /id="print-heading"/u);
  const app = await savedWorkbench(new Map());
  app.keydown("]");
  assert.equal(app.focused(), "#print-button");
  app.clearFocus();
  app.keydown("]", { tagName: "INPUT", isContentEditable: false });
  assert.equal(app.focused(), "");
  app.keydown("]", { tagName: "TEXTAREA", isContentEditable: false });
  assert.equal(app.focused(), "");
  app.keydown("]", { tagName: "SELECT", isContentEditable: false });
  assert.equal(app.focused(), "");
  app.keydown("}");
  assert.equal(app.focused(), "");
});

test("keyboard apostrophe copies the first locked option unless an input is active", async () => {
  const html = await standaloneBytes();
  assert.match(html, /<kbd>'<\/kbd> Copy the first locked clause option label as one-line Markdown/u);
  assert.match(html, /id="copy-first-locked-option-button"/u);
  const app = await savedWorkbench(new Map());
  app.keydown("'");
  assert.equal(app.clipboardText(), "No clause is locked, so there is no first locked option label to copy. Locks are draft choices, not a legal hold.\n");
  assert.equal(app.clipboardText(), app.firstLockedOption());
  assert.doesNotMatch(app.clipboardText(), /Current lock count/u);
  assert.match(app.message(), /not a legal hold/u);
  app.clearFocus();
  app.keydown("'", { tagName: "INPUT", isContentEditable: false });
  assert.equal(app.focused(), "");
  app.keydown("'", { tagName: "TEXTAREA", isContentEditable: false });
  assert.equal(app.focused(), "");
  const quoted = await savedWorkbench(new Map());
  quoted.keydown("\"");
  assert.doesNotMatch(quoted.clipboardText(), /First locked clause option/u);
  const locked = await savedWorkbench(new Map());
  locked.clickAction("toggle-clause-lock", { clauseId: "hours", optionId: "hours-pilot" });
  locked.clearFocus();
  locked.keydown("'");
  assert.equal(locked.clipboardText(), "First locked clause option: Trial a 21:00 Friday close for three months. Locks are draft choices, not a legal hold.\n");
  const blocked = await savedWorkbench(new Map());
  blocked.blockClipboard();
  await blocked.click("#copy-first-locked-option-button");
  assert.equal(blocked.focused(), "#first-locked-option-fallback");
  blocked.clearFocus();
  blocked.keydown("'", { tagName: "INPUT", isContentEditable: false });
  assert.equal(blocked.focused(), "");
});

test("keyboard < jumps to the first-locked-option copy control unless an input is active", async () => {
  const html = await standaloneBytes();
  assert.match(html, /<kbd>&lt;<\/kbd> Jump to the first-locked-option copy control, or the clauses heading/u);
  assert.match(html, /id="copy-first-locked-option-button"/u);
  assert.match(html, /id="clauses-heading"/u);
  const app = await savedWorkbench(new Map());
  app.keydown("<");
  assert.equal(app.focused(), "#copy-first-locked-option-button");
  app.clearFocus();
  app.keydown("<", { tagName: "INPUT", isContentEditable: false });
  assert.equal(app.focused(), "");
  app.keydown("<", { tagName: "TEXTAREA", isContentEditable: false });
  assert.equal(app.focused(), "");
  app.keydown("<", { tagName: "SELECT", isContentEditable: false });
  assert.equal(app.focused(), "");
});

test("keyboard > jumps to the hide-locked-clauses control unless an input is active", async () => {
  const html = await standaloneBytes();
  assert.match(html, /<kbd>&gt;<\/kbd> Jump to the hide-locked-clauses control, or the clauses heading/u);
  assert.match(html, /id="hide-locked-clauses"/u);
  assert.match(html, /id="clauses-heading"/u);
  const app = await savedWorkbench(new Map());
  app.keydown(">");
  assert.equal(app.focused(), "#hide-locked-clauses");
  app.clearFocus();
  app.keydown(">", { tagName: "INPUT", isContentEditable: false });
  assert.equal(app.focused(), "");
  app.keydown(">", { tagName: "TEXTAREA", isContentEditable: false });
  assert.equal(app.focused(), "");
  app.keydown(">", { tagName: "SELECT", isContentEditable: false });
  assert.equal(app.focused(), "");
});

test("keyboard colon copies the below-floor group count unless an input is active", async () => {
  const html = await standaloneBytes();
  assert.match(html, /<kbd>:<\/kbd> Copy the below-floor group count as one-line Markdown/u);
  assert.match(html, /id="copy-below-floor-count-button"/u);
  const app = await savedWorkbench(new Map());
  app.keydown(":");
  assert.equal(app.clipboardText(), "Groups below their support floor: 0. A floor is a number you entered, not a legal quorum.\n");
  assert.equal(app.clipboardText(), app.belowFloorCount());
  assert.doesNotMatch(app.clipboardText(), /Current lock count/u);
  assert.doesNotMatch(app.clipboardText(), /First locked clause option/u);
  assert.doesNotMatch(app.clipboardText(), /First below-floor group/u);
  assert.match(app.message(), /honest zero/u);
  assert.match(app.message(), /not a legal quorum/u);
  app.clearFocus();
  app.keydown(":", { tagName: "INPUT", isContentEditable: false });
  assert.equal(app.focused(), "");
  app.keydown(":", { tagName: "TEXTAREA", isContentEditable: false });
  assert.equal(app.focused(), "");
  const draft = {
    title: "Colon below-floor count workshop",
    threshold: 70,
    groups: [
      { id: "floored", name: "Floored", weight: 1, minSupport: 80 },
      { id: "open", name: "Open", weight: 1 },
    ],
    clauses: [{ id: "one", title: "One", options: [
      { id: "original", label: "Keep original", original: true, changeCost: 0, support: { floored: 50, open: 90 } },
      { id: "mid", label: "Mid option", original: false, changeCost: 1, support: { floored: 50, open: 40 } },
      { id: "other", label: "Other option", original: false, changeCost: 2, support: { floored: 50, open: 80 } },
    ] }],
  };
  const counted = await savedWorkbench(new Map([["smallest-agreement:proposal:v1", JSON.stringify(draft)]]));
  counted.keydown(":");
  assert.equal(counted.clipboardText(), "Groups below their support floor: 1. A floor is a number you entered, not a legal quorum.\n");
  const blocked = await savedWorkbench(new Map());
  blocked.blockClipboard();
  await blocked.click("#copy-below-floor-count-button");
  assert.equal(blocked.focused(), "#below-floor-count-fallback");
  blocked.clearFocus();
  blocked.keydown(":", { tagName: "INPUT", isContentEditable: false });
  assert.equal(blocked.focused(), "");
});

test("keyboard quote copies the first below-floor group unless an input is active", async () => {
  const html = await standaloneBytes();
  assert.match(html, /<kbd>"<\/kbd> Copy the first below-floor group label as one-line Markdown/u);
  assert.match(html, /id="copy-first-below-floor-group-button"/u);
  assert.match(html, /id="copy-first-below-floor-group-button"[^>]*aria-keyshortcuts='"'/u);
  const app = await savedWorkbench(new Map());
  app.keydown("\"");
  assert.equal(app.clipboardText(), "No group is below its support floor, so there is no first below-floor group label to copy. A floor is a number you entered, not a legal quorum. The label is not a legal identity.\n");
  assert.equal(app.clipboardText(), app.firstBelowFloorGroup());
  assert.doesNotMatch(app.clipboardText(), /Groups below their support floor/u);
  assert.doesNotMatch(app.clipboardText(), /Current lock count/u);
  assert.doesNotMatch(app.clipboardText(), /First locked clause option/u);
  assert.match(app.message(), /honest empty/u);
  assert.match(app.message(), /not a legal quorum/u);
  assert.match(app.message(), /not a legal identity/u);
  app.clearFocus();
  app.keydown("\"", { tagName: "INPUT", isContentEditable: false });
  assert.equal(app.focused(), "");
  app.keydown("\"", { tagName: "TEXTAREA", isContentEditable: false });
  assert.equal(app.focused(), "");
  const draft = {
    title: "Quote first below-floor group workshop",
    threshold: 70,
    groups: [
      { id: "floored", name: "Floored", weight: 1, minSupport: 80 },
      { id: "open", name: "Open", weight: 1 },
    ],
    clauses: [{ id: "one", title: "One", options: [
      { id: "original", label: "Keep original", original: true, changeCost: 0, support: { floored: 50, open: 90 } },
      { id: "mid", label: "Mid option", original: false, changeCost: 1, support: { floored: 50, open: 40 } },
      { id: "other", label: "Other option", original: false, changeCost: 2, support: { floored: 50, open: 80 } },
    ] }],
  };
  const labelled = await savedWorkbench(new Map([["smallest-agreement:proposal:v1", JSON.stringify(draft)]]));
  labelled.keydown("\"");
  assert.equal(labelled.clipboardText(), "First below-floor group: Floored. A floor is a number you entered, not a legal quorum. The label is not a legal identity.\n");
  assert.doesNotMatch(labelled.clipboardText(), /Groups below their support floor/u);
  const blocked = await savedWorkbench(new Map());
  blocked.blockClipboard();
  await blocked.click("#copy-first-below-floor-group-button");
  assert.equal(blocked.focused(), "#first-below-floor-group-fallback");
  blocked.clearFocus();
  blocked.keydown("\"", { tagName: "INPUT", isContentEditable: false });
  assert.equal(blocked.focused(), "");
});

test("keyboard underscore jumps to the first below-floor group copy control unless an input is active", async () => {
  const html = await standaloneBytes();
  assert.match(html, /<kbd>_<\/kbd> Jump to the first below-floor group copy control, or the groups heading/u);
  assert.match(html, /id="copy-first-below-floor-group-button"/u);
  assert.match(html, /id="groups-heading"/u);
  const app = await savedWorkbench(new Map());
  app.keydown("_");
  assert.equal(app.focused(), "#copy-first-below-floor-group-button");
  app.clearFocus();
  app.keydown("_", { tagName: "INPUT", isContentEditable: false });
  assert.equal(app.focused(), "");
  app.keydown("_", { tagName: "TEXTAREA", isContentEditable: false });
  assert.equal(app.focused(), "");
  app.keydown("_", { tagName: "SELECT", isContentEditable: false });
  assert.equal(app.focused(), "");
});

test("keyboard brace jumps to hide-groups-below-threshold unless an input is active", async () => {
  const html = await standaloneBytes();
  assert.match(html, /<kbd>\{<\/kbd> Jump to the hide-groups-below-threshold control, or the groups heading/u);
  assert.match(html, /id="hide-groups-below-threshold"/u);
  assert.match(html, /id="hide-groups-below-threshold"[^>]*aria-keyshortcuts="\{"/u);
  assert.match(html, /id="groups-heading"/u);
  const app = await savedWorkbench(new Map());
  app.keydown("{");
  assert.equal(app.focused(), "#hide-groups-below-threshold");
  app.clearFocus();
  app.keydown("{", { tagName: "INPUT", isContentEditable: false });
  assert.equal(app.focused(), "");
  app.keydown("{", { tagName: "TEXTAREA", isContentEditable: false });
  assert.equal(app.focused(), "");
  app.keydown("{", { tagName: "SELECT", isContentEditable: false });
  assert.equal(app.focused(), "");
  app.keydown("|");
  assert.equal(app.focused(), "#hide-veto-groups");
  app.clearFocus();
  app.keydown("{");
  assert.equal(app.focused(), "#hide-groups-below-threshold");
});

test("keyboard close-brace copies the threshold-group count unless an input is active", async () => {
  const html = await standaloneBytes();
  assert.match(html, /<kbd>\}<\/kbd> Copy the groups-meeting-threshold count as one-line Markdown/u);
  assert.match(html, /id="copy-threshold-group-count-button"/u);
  assert.match(html, /id="copy-threshold-group-count-button"[^>]*aria-keyshortcuts="\}"/u);
  const app = await savedWorkbench(new Map());
  app.keydown("}");
  assert.equal(app.clipboardText(), app.thresholdGroupCount());
  assert.match(app.clipboardText(), /Groups meeting the approval threshold/u);
  assert.doesNotMatch(app.clipboardText(), /First below-floor group/u);
  assert.doesNotMatch(app.clipboardText(), /Groups below their support floor/u);
  assert.match(app.message(), /not a legal quorum/u);
  app.clearFocus();
  app.keydown("}", { tagName: "INPUT", isContentEditable: false });
  assert.equal(app.focused(), "");
  app.keydown("}", { tagName: "TEXTAREA", isContentEditable: false });
  assert.equal(app.focused(), "");
  const passing = {
    title: "Close-brace threshold-group count workshop",
    threshold: 70,
    groups: [
      { id: "cleared", name: "Cleared", weight: 1 },
      { id: "short", name: "Short", weight: 1 },
    ],
    clauses: [{ id: "one", title: "One", options: [
      { id: "original", label: "Keep original", original: true, changeCost: 0, support: { cleared: 90, short: 20 } },
      { id: "mid", label: "Mid option", original: false, changeCost: 1, support: { cleared: 80, short: 30 } },
      { id: "other", label: "Other option", original: false, changeCost: 2, support: { cleared: 70, short: 40 } },
    ] }],
  };
  const counted = await savedWorkbench(new Map([["smallest-agreement:proposal:v1", JSON.stringify(passing)]]));
  counted.keydown("}");
  assert.equal(counted.clipboardText(), "Groups meeting the approval threshold: 1. A threshold is a number you entered, not a legal quorum.\n");
  assert.doesNotMatch(counted.clipboardText(), /First below-floor group/u);
  const blocked = await savedWorkbench(new Map());
  blocked.blockClipboard();
  await blocked.click("#copy-threshold-group-count-button");
  assert.equal(blocked.focused(), "#threshold-group-count-fallback");
  blocked.clearFocus();
  blocked.keydown("}", { tagName: "INPUT", isContentEditable: false });
  assert.equal(blocked.focused(), "");
});

test("keyboard hyphen jumps to the below-floor count copy control unless an input is active", async () => {
  const html = await standaloneBytes();
  assert.match(html, /<kbd>-<\/kbd> Jump to the below-floor group count copy control, or the groups heading/u);
  assert.match(html, /id="copy-below-floor-count-button"/u);
  assert.match(html, /id="groups-heading"/u);
  const app = await savedWorkbench(new Map());
  app.keydown("-");
  assert.equal(app.focused(), "#copy-below-floor-count-button");
  app.clearFocus();
  app.keydown("-", { tagName: "INPUT", isContentEditable: false });
  assert.equal(app.focused(), "");
  app.keydown("-", { tagName: "TEXTAREA", isContentEditable: false });
  assert.equal(app.focused(), "");
  app.keydown("-", { tagName: "SELECT", isContentEditable: false });
  assert.equal(app.focused(), "");
});

test("keyboard equals jumps to hide-groups-meeting-threshold unless an input is active", async () => {
  const html = await standaloneBytes();
  assert.match(html, /<kbd>=<\/kbd> Jump to the hide-groups-meeting-threshold control, or the groups heading/u);
  assert.match(html, /id="hide-groups-meeting-threshold"/u);
  assert.match(html, /id="groups-heading"/u);
  const app = await savedWorkbench(new Map());
  app.keydown("=");
  assert.equal(app.focused(), "#hide-groups-meeting-threshold");
  app.clearFocus();
  app.keydown("=", { tagName: "INPUT", isContentEditable: false });
  assert.equal(app.focused(), "");
  app.keydown("=", { tagName: "TEXTAREA", isContentEditable: false });
  assert.equal(app.focused(), "");
  app.keydown("=", { tagName: "SELECT", isContentEditable: false });
  assert.equal(app.focused(), "");
  app.keydown("+");
  assert.equal(app.focused(), "#copy-threshold-group-count-button");
  app.clearFocus();
  app.keydown("=");
  assert.equal(app.focused(), "#hide-groups-meeting-threshold");
});

test("keyboard plus jumps to the threshold-group count copy control unless an input is active", async () => {
  const html = await standaloneBytes();
  assert.match(html, /<kbd>\+<\/kbd> Jump to the threshold-group count copy control, or the groups or results heading/u);
  assert.match(html, /id="copy-threshold-group-count-button"/u);
  assert.match(html, /id="groups-heading"/u);
  assert.match(html, /id="results-heading"/u);
  const app = await savedWorkbench(new Map());
  app.keydown("+");
  assert.equal(app.focused(), "#copy-threshold-group-count-button");
  app.clearFocus();
  app.keydown("+", { tagName: "INPUT", isContentEditable: false });
  assert.equal(app.focused(), "");
  app.keydown("+", { tagName: "TEXTAREA", isContentEditable: false });
  assert.equal(app.focused(), "");
  app.keydown("+", { tagName: "SELECT", isContentEditable: false });
  assert.equal(app.focused(), "");
  app.keydown("=");
  assert.equal(app.focused(), "#hide-groups-meeting-threshold");
});

test("keyboard tilde copies the first veto group label unless an input is active", async () => {
  const html = await standaloneBytes();
  assert.match(html, /<kbd>~<\/kbd> Copy the first veto group label as one-line Markdown/u);
  assert.match(html, /id="copy-first-veto-group-button"/u);
  assert.match(html, /id="copy-first-veto-group-button"[^>]*aria-keyshortcuts="~"/u);
  const app = await savedWorkbench(new Map());
  app.keydown("~");
  assert.equal(app.clipboardText(), app.firstVetoGroup());
  assert.match(app.clipboardText(), /No veto group is marked/u);
  assert.doesNotMatch(app.clipboardText(), /Groups meeting the approval threshold/u);
  assert.doesNotMatch(app.clipboardText(), /First below-floor group/u);
  assert.match(app.message(), /not a legal right/u);
  app.clearFocus();
  app.keydown("~", { tagName: "INPUT", isContentEditable: false });
  assert.equal(app.focused(), "");
  app.keydown("~", { tagName: "TEXTAREA", isContentEditable: false });
  assert.equal(app.focused(), "");
  const labelled = await savedWorkbench(new Map());
  labelled.field("#preset-select", "club-constitution");
  labelled.click("#load-preset");
  labelled.keydown("~");
  assert.equal(labelled.clipboardText(), "First veto group: Officers. A veto is a number you entered, not a legal right.\n");
  assert.doesNotMatch(labelled.clipboardText(), /First below-floor group/u);
  assert.doesNotMatch(labelled.clipboardText(), /Groups meeting the approval threshold/u);
  const blocked = await savedWorkbench(new Map());
  blocked.blockClipboard();
  await blocked.click("#copy-first-veto-group-button");
  assert.equal(blocked.focused(), "#first-veto-group-fallback");
  blocked.clearFocus();
  blocked.keydown("~", { tagName: "INPUT", isContentEditable: false });
  assert.equal(blocked.focused(), "");
});

test("keyboard bang jumps to the first veto group copy control unless an input is active", async () => {
  const html = await standaloneBytes();
  assert.match(html, /<kbd>!<\/kbd> Jump to the first veto group copy control, or the groups heading/u);
  assert.match(html, /id="copy-first-veto-group-button"/u);
  assert.match(html, /id="groups-heading"/u);
  const app = await savedWorkbench(new Map());
  app.keydown("!");
  assert.equal(app.focused(), "#copy-first-veto-group-button");
  assert.equal(app.clipboardText(), "");
  app.clearFocus();
  app.keydown("!", { tagName: "INPUT", isContentEditable: false });
  assert.equal(app.focused(), "");
  app.keydown("!", { tagName: "TEXTAREA", isContentEditable: false });
  assert.equal(app.focused(), "");
  app.keydown("!", { tagName: "SELECT", isContentEditable: false });
  assert.equal(app.focused(), "");
  app.keydown("~");
  assert.equal(app.clipboardText(), app.firstVetoGroup());
  app.clearFocus();
  app.keydown("!");
  assert.equal(app.focused(), "#copy-first-veto-group-button");
});

test("keyboard pipe jumps to hide-veto-groups unless an input is active", async () => {
  const html = await standaloneBytes();
  assert.match(html, /<kbd>\|<\/kbd> Jump to the hide-veto-groups control, or the groups heading/u);
  assert.match(html, /id="hide-veto-groups"/u);
  assert.match(html, /id="hide-veto-groups"[^>]*aria-keyshortcuts="\|"/u);
  assert.match(html, /id="groups-heading"/u);
  const app = await savedWorkbench(new Map());
  app.keydown("|");
  assert.equal(app.focused(), "#hide-veto-groups");
  app.clearFocus();
  app.keydown("|", { tagName: "INPUT", isContentEditable: false });
  assert.equal(app.focused(), "");
  app.keydown("|", { tagName: "TEXTAREA", isContentEditable: false });
  assert.equal(app.focused(), "");
  app.keydown("|", { tagName: "SELECT", isContentEditable: false });
  assert.equal(app.focused(), "");
  app.keydown("{");
  assert.equal(app.focused(), "#hide-groups-below-threshold");
});

test("keyboard at-sign jumps to hide-non-veto-groups unless an input is active", async () => {
  const html = await standaloneBytes();
  assert.match(html, /<kbd>@<\/kbd> Jump to the hide-non-veto-groups control, or the groups heading/u);
  assert.match(html, /id="hide-non-veto-groups"/u);
  assert.match(html, /id="hide-non-veto-groups"[^>]*aria-keyshortcuts="@"/u);
  assert.match(html, /id="groups-heading"/u);
  const app = await savedWorkbench(new Map());
  app.keydown("@");
  assert.equal(app.focused(), "#hide-non-veto-groups");
  app.clearFocus();
  app.keydown("@", { tagName: "INPUT", isContentEditable: false });
  assert.equal(app.focused(), "");
  app.keydown("@", { tagName: "TEXTAREA", isContentEditable: false });
  assert.equal(app.focused(), "");
  app.keydown("@", { tagName: "SELECT", isContentEditable: false });
  assert.equal(app.focused(), "");
  app.keydown("|");
  assert.equal(app.focused(), "#hide-veto-groups");
  app.clearFocus();
  app.keydown("@");
  assert.equal(app.focused(), "#hide-non-veto-groups");
});

test("keyboard open-paren copies the veto-group count unless an input is active", async () => {
  const html = await standaloneBytes();
  assert.match(html, /<kbd>\(<\/kbd> Copy the veto-group count as one-line Markdown/u);
  assert.match(html, /id="copy-veto-group-count-button"/u);
  assert.match(html, /id="copy-veto-group-count-button"[^>]*aria-keyshortcuts="\("/u);
  const app = await savedWorkbench(new Map());
  app.keydown("(");
  assert.equal(app.clipboardText(), app.vetoGroupCount());
  assert.match(app.clipboardText(), /Veto groups: 0/u);
  assert.doesNotMatch(app.clipboardText(), /First veto group/u);
  assert.doesNotMatch(app.clipboardText(), /Groups meeting the approval threshold/u);
  assert.match(app.message(), /not a legal right/u);
  app.clearFocus();
  app.keydown("(", { tagName: "INPUT", isContentEditable: false });
  assert.equal(app.focused(), "");
  app.keydown("(", { tagName: "TEXTAREA", isContentEditable: false });
  assert.equal(app.focused(), "");
  const labelled = await savedWorkbench(new Map());
  labelled.field("#preset-select", "club-constitution");
  labelled.click("#load-preset");
  labelled.keydown("(");
  assert.equal(labelled.clipboardText(), "Veto groups: 1. A veto is a number you entered, not a legal right.\n");
  assert.doesNotMatch(labelled.clipboardText(), /First veto group/u);
  assert.doesNotMatch(labelled.clipboardText(), /Groups meeting the approval threshold/u);
  labelled.clearFocus();
  labelled.keydown("~");
  assert.equal(labelled.clipboardText(), labelled.firstVetoGroup());
  assert.match(labelled.clipboardText(), /First veto group: Officers/u);
  labelled.clearFocus();
  labelled.keydown("(");
  assert.equal(labelled.clipboardText(), "Veto groups: 1. A veto is a number you entered, not a legal right.\n");
  const blocked = await savedWorkbench(new Map());
  blocked.blockClipboard();
  await blocked.click("#copy-veto-group-count-button");
  assert.equal(blocked.focused(), "#veto-group-count-fallback");
  blocked.clearFocus();
  blocked.keydown("(", { tagName: "INPUT", isContentEditable: false });
  assert.equal(blocked.focused(), "");
});

test("keyboard close-paren jumps to the veto-group count copy control unless an input is active", async () => {
  const html = await standaloneBytes();
  assert.match(html, /<kbd>\)<\/kbd> Jump to the veto-group count copy control, or the groups heading/u);
  assert.match(html, /id="copy-veto-group-count-button"/u);
  assert.match(html, /id="groups-heading"/u);
  const app = await savedWorkbench(new Map());
  app.keydown(")");
  assert.equal(app.focused(), "#copy-veto-group-count-button");
  assert.equal(app.clipboardText(), "");
  app.clearFocus();
  app.keydown(")", { tagName: "INPUT", isContentEditable: false });
  assert.equal(app.focused(), "");
  app.keydown(")", { tagName: "TEXTAREA", isContentEditable: false });
  assert.equal(app.focused(), "");
  app.keydown(")", { tagName: "SELECT", isContentEditable: false });
  assert.equal(app.focused(), "");
  app.keydown("!");
  assert.equal(app.focused(), "#copy-first-veto-group-button");
  assert.equal(app.clipboardText(), "");
  app.clearFocus();
  app.keydown(")");
  assert.equal(app.focused(), "#copy-veto-group-count-button");
  assert.equal(app.clipboardText(), "");
  app.clearFocus();
  app.keydown("(");
  assert.equal(app.clipboardText(), app.vetoGroupCount());
  app.clearFocus();
  app.keydown(")");
  assert.equal(app.focused(), "#copy-veto-group-count-button");
});

test("keyboard hash jumps to hide-first-veto-group unless an input is active", async () => {
  const html = await standaloneBytes();
  assert.match(html, /<kbd>#<\/kbd> Jump to the hide-first-veto-group control, or the groups heading/u);
  assert.match(html, /id="hide-first-veto-group"/u);
  assert.match(html, /id="hide-first-veto-group"[^>]*aria-keyshortcuts="#"/u);
  assert.match(html, /id="groups-heading"/u);
  const app = await savedWorkbench(new Map());
  app.keydown("#");
  assert.equal(app.focused(), "#hide-first-veto-group");
  app.clearFocus();
  app.keydown("#", { tagName: "INPUT", isContentEditable: false });
  assert.equal(app.focused(), "");
  app.keydown("#", { tagName: "TEXTAREA", isContentEditable: false });
  assert.equal(app.focused(), "");
  app.keydown("#", { tagName: "SELECT", isContentEditable: false });
  assert.equal(app.focused(), "");
  app.keydown("@");
  assert.equal(app.focused(), "#hide-non-veto-groups");
  app.clearFocus();
  app.keydown("#");
  assert.equal(app.focused(), "#hide-first-veto-group");
});

test("keyboard asterisk copies the first non-veto group unless an input is active", async () => {
  const html = await standaloneBytes();
  assert.match(html, /<kbd>\*<\/kbd> Copy the first non-veto group label as one-line Markdown/u);
  assert.match(html, /id="copy-first-non-veto-group-button"/u);
  assert.match(html, /id="copy-first-non-veto-group-button"[^>]*aria-keyshortcuts="\*"/u);
  const app = await savedWorkbench(new Map());
  app.keydown("*");
  assert.equal(app.clipboardText(), app.firstNonVetoGroup());
  assert.match(app.clipboardText(), /First non-veto group: Residents/u);
  assert.doesNotMatch(app.clipboardText(), /First veto group/u);
  assert.doesNotMatch(app.clipboardText(), /Veto groups:/u);
  assert.doesNotMatch(app.clipboardText(), /Last veto group/u);
  assert.match(app.message(), /not a legal right/u);
  app.clearFocus();
  app.keydown("*", { tagName: "INPUT", isContentEditable: false });
  assert.equal(app.focused(), "");
  app.keydown("*", { tagName: "TEXTAREA", isContentEditable: false });
  assert.equal(app.focused(), "");
  const labelled = await savedWorkbench(new Map());
  labelled.field("#preset-select", "club-constitution");
  labelled.click("#load-preset");
  labelled.keydown("*");
  assert.equal(labelled.clipboardText(), "First non-veto group: Members. A veto is a number you entered, not a legal right. The label is not a legal identity.\n");
  assert.doesNotMatch(labelled.clipboardText(), /First veto group/u);
  assert.doesNotMatch(labelled.clipboardText(), /Veto groups:/u);
  assert.doesNotMatch(labelled.clipboardText(), /Officers/u);
  labelled.clearFocus();
  labelled.keydown("~");
  assert.equal(labelled.clipboardText(), labelled.firstVetoGroup());
  assert.match(labelled.clipboardText(), /First veto group: Officers/u);
  labelled.clearFocus();
  labelled.keydown("*");
  assert.equal(labelled.clipboardText(), "First non-veto group: Members. A veto is a number you entered, not a legal right. The label is not a legal identity.\n");
  labelled.clearFocus();
  labelled.keydown("(");
  assert.equal(labelled.clipboardText(), labelled.vetoGroupCount());
  assert.match(labelled.clipboardText(), /Veto groups: 1/u);
  const blocked = await savedWorkbench(new Map());
  blocked.blockClipboard();
  await blocked.click("#copy-first-non-veto-group-button");
  assert.equal(blocked.focused(), "#first-non-veto-group-fallback");
  blocked.clearFocus();
  blocked.keydown("*", { tagName: "INPUT", isContentEditable: false });
  assert.equal(blocked.focused(), "");
});

test("keyboard ampersand jumps to the first non-veto group copy control unless an input is active", async () => {
  const html = await standaloneBytes();
  assert.match(html, /<kbd>&amp;<\/kbd> Jump to the first non-veto group copy control, or the groups heading/u);
  assert.match(html, /id="copy-first-non-veto-group-button"/u);
  assert.match(html, /id="groups-heading"/u);
  const app = await savedWorkbench(new Map());
  app.keydown("&");
  assert.equal(app.focused(), "#copy-first-non-veto-group-button");
  assert.equal(app.clipboardText(), "");
  app.clearFocus();
  app.keydown("&", { tagName: "INPUT", isContentEditable: false });
  assert.equal(app.focused(), "");
  app.keydown("&", { tagName: "TEXTAREA", isContentEditable: false });
  assert.equal(app.focused(), "");
  app.keydown("&", { tagName: "SELECT", isContentEditable: false });
  assert.equal(app.focused(), "");
  app.keydown(")");
  assert.equal(app.focused(), "#copy-veto-group-count-button");
  assert.equal(app.clipboardText(), "");
  app.clearFocus();
  app.keydown("&");
  assert.equal(app.focused(), "#copy-first-non-veto-group-button");
  assert.equal(app.clipboardText(), "");
  app.clearFocus();
  app.keydown("*");
  assert.equal(app.clipboardText(), app.firstNonVetoGroup());
  app.clearFocus();
  app.keydown("&");
  assert.equal(app.focused(), "#copy-first-non-veto-group-button");
});

test("keyboard percent jumps to hide-last-veto-group unless an input is active", async () => {
  const html = await standaloneBytes();
  assert.match(html, /<kbd>%<\/kbd> Jump to the hide-last-veto-group control, or the groups heading/u);
  assert.match(html, /id="hide-last-veto-group"/u);
  assert.match(html, /id="hide-last-veto-group"[^>]*aria-keyshortcuts="%"/u);
  assert.match(html, /id="groups-heading"/u);
  const app = await savedWorkbench(new Map());
  app.keydown("%");
  assert.equal(app.focused(), "#hide-last-veto-group");
  app.clearFocus();
  app.keydown("%", { tagName: "INPUT", isContentEditable: false });
  assert.equal(app.focused(), "");
  app.keydown("%", { tagName: "TEXTAREA", isContentEditable: false });
  assert.equal(app.focused(), "");
  app.keydown("%", { tagName: "SELECT", isContentEditable: false });
  assert.equal(app.focused(), "");
  app.keydown("#");
  assert.equal(app.focused(), "#hide-first-veto-group");
  app.clearFocus();
  app.keydown("%");
  assert.equal(app.focused(), "#hide-last-veto-group");
});

test("keyboard dollar copies the last veto group unless an input is active", async () => {
  const html = await standaloneBytes();
  assert.match(html, /<kbd>\$<\/kbd> Copy the last veto group label as one-line Markdown/u);
  assert.match(html, /id="copy-last-veto-group-button"/u);
  assert.match(html, /id="copy-last-veto-group-button"[^>]*aria-keyshortcuts="\$"/u);
  const app = await savedWorkbench(new Map());
  app.keydown("$");
  assert.equal(app.clipboardText(), app.lastVetoGroup());
  assert.match(app.clipboardText(), /No veto group is marked/u);
  assert.doesNotMatch(app.clipboardText(), /First veto group/u);
  assert.doesNotMatch(app.clipboardText(), /First non-veto group/u);
  assert.doesNotMatch(app.clipboardText(), /Veto groups:/u);
  assert.match(app.message(), /not a legal right/u);
  app.clearFocus();
  app.keydown("$", { tagName: "INPUT", isContentEditable: false });
  assert.equal(app.focused(), "");
  app.keydown("$", { tagName: "TEXTAREA", isContentEditable: false });
  assert.equal(app.focused(), "");
  const labelled = await savedWorkbench(new Map());
  labelled.field("#preset-select", "club-constitution");
  labelled.click("#load-preset");
  labelled.keydown("$");
  assert.equal(labelled.clipboardText(), "Last veto group: Officers. A veto is a number you entered, not a legal right.\n");
  assert.doesNotMatch(labelled.clipboardText(), /First veto group/u);
  assert.doesNotMatch(labelled.clipboardText(), /First non-veto group/u);
  assert.doesNotMatch(labelled.clipboardText(), /Members/u);
  labelled.clearFocus();
  labelled.keydown("*");
  assert.equal(labelled.clipboardText(), labelled.firstNonVetoGroup());
  assert.match(labelled.clipboardText(), /First non-veto group: Members/u);
  labelled.clearFocus();
  labelled.keydown("$");
  assert.equal(labelled.clipboardText(), "Last veto group: Officers. A veto is a number you entered, not a legal right.\n");
  labelled.clearFocus();
  labelled.keydown("(");
  assert.equal(labelled.clipboardText(), labelled.vetoGroupCount());
  assert.match(labelled.clipboardText(), /Veto groups: 1/u);
  const twoVeto = await savedWorkbench(new Map([["smallest-agreement:proposal:v1", JSON.stringify({
    title: "Two veto groups workshop",
    threshold: 70,
    groups: [
      { id: "open", name: "Open", weight: 1 },
      { id: "first-veto", name: "First veto", weight: 1, veto: true },
      { id: "later-veto", name: "Later veto", weight: 1, veto: true },
    ],
    clauses: [{ id: "one", title: "One", options: [
      { id: "original", label: "Keep original", original: true, changeCost: 0, support: { open: 90, "first-veto": 90, "later-veto": 90 } },
      { id: "mid", label: "Mid option", original: false, changeCost: 1, support: { open: 80, "first-veto": 80, "later-veto": 80 } },
      { id: "other", label: "Other option", original: false, changeCost: 2, support: { open: 70, "first-veto": 70, "later-veto": 70 } },
    ] }],
  })]]));
  twoVeto.keydown("$");
  assert.equal(twoVeto.clipboardText(), "Last veto group: Later veto. A veto is a number you entered, not a legal right.\n");
  assert.doesNotMatch(twoVeto.clipboardText(), /First veto group/u);
  const blocked = await savedWorkbench(new Map());
  blocked.blockClipboard();
  await blocked.click("#copy-last-veto-group-button");
  assert.equal(blocked.focused(), "#last-veto-group-fallback");
  blocked.clearFocus();
  blocked.keydown("$", { tagName: "INPUT", isContentEditable: false });
  assert.equal(blocked.focused(), "");
});

test("keyboard caret jumps to the last veto group copy control unless an input is active", async () => {
  const html = await standaloneBytes();
  assert.match(html, /<kbd>\^<\/kbd> Jump to the last veto group copy control, or the groups heading/u);
  assert.match(html, /id="copy-last-veto-group-button"/u);
  assert.match(html, /id="groups-heading"/u);
  const app = await savedWorkbench(new Map());
  app.keydown("^");
  assert.equal(app.focused(), "#copy-last-veto-group-button");
  assert.equal(app.clipboardText(), "");
  app.clearFocus();
  app.keydown("^", { tagName: "INPUT", isContentEditable: false });
  assert.equal(app.focused(), "");
  app.keydown("^", { tagName: "TEXTAREA", isContentEditable: false });
  assert.equal(app.focused(), "");
  app.keydown("^", { tagName: "SELECT", isContentEditable: false });
  assert.equal(app.focused(), "");
  app.keydown("&");
  assert.equal(app.focused(), "#copy-first-non-veto-group-button");
  assert.equal(app.clipboardText(), "");
  app.clearFocus();
  app.keydown("^");
  assert.equal(app.focused(), "#copy-last-veto-group-button");
  assert.equal(app.clipboardText(), "");
  app.clearFocus();
  app.keydown("$");
  assert.equal(app.clipboardText(), app.lastVetoGroup());
  app.clearFocus();
  app.keydown("^");
  assert.equal(app.focused(), "#copy-last-veto-group-button");
});

test("keyboard backtick jumps to hide-first-non-veto-group unless an input is active", async () => {
  const html = await standaloneBytes();
  assert.match(html, /<kbd>\u0060<\/kbd> Jump to the hide-first-non-veto-group control, or the groups heading/u);
  assert.match(html, /id="hide-first-non-veto-group"/u);
  assert.match(html, /id="hide-first-non-veto-group"[^>]*aria-keyshortcuts="\u0060"/u);
  assert.match(html, /id="groups-heading"/u);
  const app = await savedWorkbench(new Map());
  app.keydown("`");
  assert.equal(app.focused(), "#hide-first-non-veto-group");
  app.clearFocus();
  app.keydown("`", { tagName: "INPUT", isContentEditable: false });
  assert.equal(app.focused(), "");
  app.keydown("`", { tagName: "TEXTAREA", isContentEditable: false });
  assert.equal(app.focused(), "");
  app.keydown("`", { tagName: "SELECT", isContentEditable: false });
  assert.equal(app.focused(), "");
  app.keydown("%");
  assert.equal(app.focused(), "#hide-last-veto-group");
  app.clearFocus();
  app.keydown("`");
  assert.equal(app.focused(), "#hide-first-non-veto-group");
});

test("keyboard 5 copies the last non-veto group unless an input is active", async () => {
  const html = await standaloneBytes();
  assert.match(html, /<kbd>5<\/kbd> Copy the last non-veto group label as one-line Markdown/u);
  assert.match(html, /id="copy-last-non-veto-group-button"/u);
  assert.match(html, /id="copy-last-non-veto-group-button"[^>]*aria-keyshortcuts="5"/u);
  const app = await savedWorkbench(new Map());
  app.keydown("5");
  assert.equal(app.clipboardText(), app.lastNonVetoGroup());
  assert.match(app.clipboardText(), /Last non-veto group: Park stewards/u);
  assert.doesNotMatch(app.clipboardText(), /Last veto group/u);
  assert.doesNotMatch(app.clipboardText(), /First non-veto group/u);
  assert.match(app.message(), /not a legal right/u);
  app.clearFocus();
  app.keydown("5", { tagName: "INPUT", isContentEditable: false });
  assert.equal(app.focused(), "");
  app.keydown("5", { tagName: "TEXTAREA", isContentEditable: false });
  assert.equal(app.focused(), "");
  const labelled = await savedWorkbench(new Map());
  labelled.field("#preset-select", "club-constitution");
  labelled.click("#load-preset");
  labelled.keydown("5");
  assert.equal(labelled.clipboardText(), "Last non-veto group: Club staff. A veto is a number you entered, not a legal right. The label is not a legal identity.\n");
  assert.doesNotMatch(labelled.clipboardText(), /Last veto group/u);
  assert.doesNotMatch(labelled.clipboardText(), /First non-veto group/u);
  assert.doesNotMatch(labelled.clipboardText(), /Members/u);
  labelled.clearFocus();
  labelled.keydown("$");
  assert.equal(labelled.clipboardText(), labelled.lastVetoGroup());
  assert.match(labelled.clipboardText(), /Last veto group: Officers/u);
  labelled.clearFocus();
  labelled.keydown("5");
  assert.equal(labelled.clipboardText(), "Last non-veto group: Club staff. A veto is a number you entered, not a legal right. The label is not a legal identity.\n");
  labelled.clearFocus();
  labelled.keydown("*");
  assert.equal(labelled.clipboardText(), labelled.firstNonVetoGroup());
  assert.match(labelled.clipboardText(), /First non-veto group: Members/u);
  const twoOpen = await savedWorkbench(new Map([["smallest-agreement:proposal:v1", JSON.stringify({
    title: "Two non-veto groups workshop",
    threshold: 70,
    groups: [
      { id: "first-open", name: "First open", weight: 1 },
      { id: "later-open", name: "Later open", weight: 1 },
      { id: "veto", name: "Veto bloc", weight: 1, veto: true },
    ],
    clauses: [{ id: "one", title: "One", options: [
      { id: "original", label: "Keep original", original: true, changeCost: 0, support: { "first-open": 90, "later-open": 90, veto: 90 } },
      { id: "mid", label: "Mid option", original: false, changeCost: 1, support: { "first-open": 80, "later-open": 80, veto: 80 } },
      { id: "other", label: "Other option", original: false, changeCost: 2, support: { "first-open": 70, "later-open": 70, veto: 70 } },
    ] }],
  })]]));
  twoOpen.keydown("5");
  assert.equal(twoOpen.clipboardText(), "Last non-veto group: Later open. A veto is a number you entered, not a legal right. The label is not a legal identity.\n");
  assert.doesNotMatch(twoOpen.clipboardText(), /First non-veto group/u);
  const blocked = await savedWorkbench(new Map());
  blocked.blockClipboard();
  await blocked.click("#copy-last-non-veto-group-button");
  assert.equal(blocked.focused(), "#last-non-veto-group-fallback");
  blocked.clearFocus();
  blocked.keydown("5", { tagName: "INPUT", isContentEditable: false });
  assert.equal(blocked.focused(), "");
});

test("keyboard 6 jumps to the last non-veto group copy control unless an input is active", async () => {
  const html = await standaloneBytes();
  assert.match(html, /<kbd>6<\/kbd> Jump to the last non-veto group copy control, or the groups heading/u);
  assert.match(html, /id="copy-last-non-veto-group-button"/u);
  assert.match(html, /id="groups-heading"/u);
  const app = await savedWorkbench(new Map());
  app.keydown("6");
  assert.equal(app.focused(), "#copy-last-non-veto-group-button");
  assert.equal(app.clipboardText(), "");
  app.clearFocus();
  app.keydown("6", { tagName: "INPUT", isContentEditable: false });
  assert.equal(app.focused(), "");
  app.keydown("6", { tagName: "TEXTAREA", isContentEditable: false });
  assert.equal(app.focused(), "");
  app.keydown("6", { tagName: "SELECT", isContentEditable: false });
  assert.equal(app.focused(), "");
  app.keydown("^");
  assert.equal(app.focused(), "#copy-last-veto-group-button");
  assert.equal(app.clipboardText(), "");
  app.clearFocus();
  app.keydown("6");
  assert.equal(app.focused(), "#copy-last-non-veto-group-button");
  assert.equal(app.clipboardText(), "");
  app.clearFocus();
  app.keydown("&");
  assert.equal(app.focused(), "#copy-first-non-veto-group-button");
  assert.equal(app.clipboardText(), "");
  app.clearFocus();
  app.keydown("5");
  assert.equal(app.clipboardText(), app.lastNonVetoGroup());
  app.clearFocus();
  app.keydown("6");
  assert.equal(app.focused(), "#copy-last-non-veto-group-button");
});

test("keyboard 7 jumps to hide-last-group-below-threshold unless an input is active", async () => {
  const html = await standaloneBytes();
  assert.match(html, /<kbd>7<\/kbd> Jump to the hide-last-group-below-threshold control, or the groups heading/u);
  assert.match(html, /id="hide-last-group-below-threshold"/u);
  assert.match(html, /id="hide-last-group-below-threshold"[^>]*aria-keyshortcuts="7"/u);
  assert.match(html, /id="groups-heading"/u);
  const app = await savedWorkbench(new Map());
  app.keydown("7");
  assert.equal(app.focused(), "#hide-last-group-below-threshold");
  app.clearFocus();
  app.keydown("7", { tagName: "INPUT", isContentEditable: false });
  assert.equal(app.focused(), "");
  app.keydown("7", { tagName: "TEXTAREA", isContentEditable: false });
  assert.equal(app.focused(), "");
  app.keydown("7", { tagName: "SELECT", isContentEditable: false });
  assert.equal(app.focused(), "");
  app.keydown("`");
  assert.equal(app.focused(), "#hide-first-non-veto-group");
  app.clearFocus();
  app.keydown("7");
  assert.equal(app.focused(), "#hide-last-group-below-threshold");
});

test("keyboard 8 copies the last below-threshold group unless an input is active", async () => {
  const html = await standaloneBytes();
  assert.match(html, /<kbd>8<\/kbd> Copy the last below-threshold group label as one-line Markdown/u);
  assert.match(html, /id="copy-last-below-threshold-group-button"/u);
  assert.match(html, /id="copy-last-below-threshold-group-button"[^>]*aria-keyshortcuts="8"/u);
  const draft = {
    title: "Last below-threshold copy workshop",
    threshold: 70,
    groups: [
      { id: "cleared", name: "Cleared", weight: 1 },
      { id: "short", name: "Short", weight: 1 },
      { id: "floored", name: "Floored", weight: 1 },
    ],
    clauses: [{ id: "one", title: "One", options: [
      { id: "original", label: "Keep original", original: true, changeCost: 0, support: { cleared: 90, short: 20, floored: 20 } },
      { id: "mid", label: "Mid option", original: false, changeCost: 1, support: { cleared: 80, short: 30, floored: 30 } },
      { id: "other", label: "Other option", original: false, changeCost: 2, support: { cleared: 70, short: 40, floored: 40 } },
    ] }],
  };
  const app = await savedWorkbench(new Map([["smallest-agreement:proposal:v1", JSON.stringify(draft)]]));
  app.keydown("8");
  assert.equal(app.clipboardText(), app.lastBelowThresholdGroup());
  assert.match(app.clipboardText(), /Last below-threshold group: Floored/u);
  assert.doesNotMatch(app.clipboardText(), /Last non-veto group/u);
  assert.doesNotMatch(app.clipboardText(), /First below-floor group/u);
  assert.doesNotMatch(app.clipboardText(), /Short/u);
  assert.match(app.message(), /not a legal identity/u);
  app.clearFocus();
  app.keydown("8", { tagName: "INPUT", isContentEditable: false });
  assert.equal(app.focused(), "");
  app.keydown("8", { tagName: "TEXTAREA", isContentEditable: false });
  assert.equal(app.focused(), "");
  app.clearFocus();
  app.keydown("5");
  assert.equal(app.clipboardText(), app.lastNonVetoGroup());
  assert.match(app.clipboardText(), /Last non-veto group: Floored/u);
  app.clearFocus();
  app.keydown("8");
  assert.equal(app.clipboardText(), "Last below-threshold group: Floored. A threshold is a number you entered, not a legal quorum. The label is not a legal identity.\n");
  app.clearFocus();
  app.keydown('"');
  assert.equal(app.clipboardText(), app.firstBelowFloorGroup());
  const passing = await savedWorkbench(new Map([["smallest-agreement:proposal:v1", JSON.stringify({
    title: "No below-threshold groups workshop",
    threshold: 70,
    groups: [{ id: "open", name: "Open", weight: 1 }],
    clauses: [{ id: "one", title: "One", options: [
      { id: "original", label: "Keep original", original: true, changeCost: 0, support: { open: 90 } },
      { id: "mid", label: "Mid option", original: false, changeCost: 1, support: { open: 80 } },
      { id: "other", label: "Other option", original: false, changeCost: 2, support: { open: 70 } },
    ] }],
  })]]));
  passing.keydown("8");
  assert.equal(passing.clipboardText(), "No group is below the approval threshold, so there is no last below-threshold group label to copy. A threshold is a number you entered, not a legal quorum. The label is not a legal identity.\n");
  const blocked = await savedWorkbench(new Map([["smallest-agreement:proposal:v1", JSON.stringify(draft)]]));
  blocked.blockClipboard();
  await blocked.click("#copy-last-below-threshold-group-button");
  assert.equal(blocked.focused(), "#last-below-threshold-group-fallback");
  blocked.clearFocus();
  blocked.keydown("8", { tagName: "INPUT", isContentEditable: false });
  assert.equal(blocked.focused(), "");
});

test("keyboard 9 jumps to the last below-threshold group copy control unless an input is active", async () => {
  const html = await standaloneBytes();
  assert.match(html, /<kbd>9<\/kbd> Jump to the last below-threshold group copy control, or the groups heading/u);
  assert.match(html, /id="copy-last-below-threshold-group-button"/u);
  assert.match(html, /id="groups-heading"/u);
  const app = await savedWorkbench(new Map());
  app.keydown("9");
  assert.equal(app.focused(), "#copy-last-below-threshold-group-button");
  assert.equal(app.clipboardText(), "");
  app.clearFocus();
  app.keydown("9", { tagName: "INPUT", isContentEditable: false });
  assert.equal(app.focused(), "");
  app.keydown("9", { tagName: "TEXTAREA", isContentEditable: false });
  assert.equal(app.focused(), "");
  app.keydown("9", { tagName: "SELECT", isContentEditable: false });
  assert.equal(app.focused(), "");
  app.keydown("6");
  assert.equal(app.focused(), "#copy-last-non-veto-group-button");
  assert.equal(app.clipboardText(), "");
  app.clearFocus();
  app.keydown("9");
  assert.equal(app.focused(), "#copy-last-below-threshold-group-button");
  assert.equal(app.clipboardText(), "");
  app.clearFocus();
  app.keydown("8");
  assert.equal(app.clipboardText(), app.lastBelowThresholdGroup());
  app.clearFocus();
  app.keydown("9");
  assert.equal(app.focused(), "#copy-last-below-threshold-group-button");
});

test("keyboard 0 jumps to hide-first-group-below-threshold unless an input is active", async () => {
  const html = await standaloneBytes();
  assert.match(html, /<kbd>0<\/kbd> Jump to the hide-first-group-below-threshold control, or the groups heading/u);
  assert.match(html, /id="hide-first-group-below-threshold"/u);
  assert.match(html, /id="hide-first-group-below-threshold"[^>]*aria-keyshortcuts="0"/u);
  assert.match(html, /id="groups-heading"/u);
  const app = await savedWorkbench(new Map());
  app.keydown("0");
  assert.equal(app.focused(), "#hide-first-group-below-threshold");
  app.clearFocus();
  app.keydown("0", { tagName: "INPUT", isContentEditable: false });
  assert.equal(app.focused(), "");
  app.keydown("0", { tagName: "TEXTAREA", isContentEditable: false });
  assert.equal(app.focused(), "");
  app.keydown("0", { tagName: "SELECT", isContentEditable: false });
  assert.equal(app.focused(), "");
  app.keydown("7");
  assert.equal(app.focused(), "#hide-last-group-below-threshold");
  app.clearFocus();
  app.keydown("0");
  assert.equal(app.focused(), "#hide-first-group-below-threshold");
});

test("keyboard 1 copies the first below-threshold group unless an input is active", async () => {
  const html = await standaloneBytes();
  assert.match(html, /<kbd>1<\/kbd> Copy the first below-threshold group label as one-line Markdown/u);
  assert.match(html, /id="copy-first-below-threshold-group-button"/u);
  assert.match(html, /id="copy-first-below-threshold-group-button"[^>]*aria-keyshortcuts="1"/u);
  const draft = {
    title: "First below-threshold copy workshop",
    threshold: 70,
    groups: [
      { id: "cleared", name: "Cleared", weight: 1 },
      { id: "short", name: "Short", weight: 1 },
      { id: "floored", name: "Floored", weight: 1 },
    ],
    clauses: [{ id: "one", title: "One", options: [
      { id: "original", label: "Keep original", original: true, changeCost: 0, support: { cleared: 90, short: 20, floored: 20 } },
      { id: "mid", label: "Mid option", original: false, changeCost: 1, support: { cleared: 80, short: 30, floored: 30 } },
      { id: "other", label: "Other option", original: false, changeCost: 2, support: { cleared: 70, short: 40, floored: 40 } },
    ] }],
  };
  const app = await savedWorkbench(new Map([["smallest-agreement:proposal:v1", JSON.stringify(draft)]]));
  app.keydown("1");
  assert.equal(app.clipboardText(), app.firstBelowThresholdGroup());
  assert.match(app.clipboardText(), /First below-threshold group: Short/u);
  assert.doesNotMatch(app.clipboardText(), /Last below-threshold group/u);
  assert.doesNotMatch(app.clipboardText(), /First below-floor group/u);
  assert.doesNotMatch(app.clipboardText(), /Floored/u);
  assert.match(app.message(), /not a legal identity/u);
  app.clearFocus();
  app.keydown("1", { tagName: "INPUT", isContentEditable: false });
  assert.equal(app.focused(), "");
  app.keydown("1", { tagName: "TEXTAREA", isContentEditable: false });
  assert.equal(app.focused(), "");
  app.clearFocus();
  app.keydown("8");
  assert.equal(app.clipboardText(), app.lastBelowThresholdGroup());
  assert.match(app.clipboardText(), /Last below-threshold group: Floored/u);
  app.clearFocus();
  app.keydown("1");
  assert.equal(app.clipboardText(), "First below-threshold group: Short. A threshold is a number you entered, not a legal quorum. The label is not a legal identity.\n");
  app.clearFocus();
  app.keydown('"');
  assert.equal(app.clipboardText(), app.firstBelowFloorGroup());
  const passing = await savedWorkbench(new Map([["smallest-agreement:proposal:v1", JSON.stringify({
    title: "No below-threshold groups workshop",
    threshold: 70,
    groups: [{ id: "open", name: "Open", weight: 1 }],
    clauses: [{ id: "one", title: "One", options: [
      { id: "original", label: "Keep original", original: true, changeCost: 0, support: { open: 90 } },
      { id: "mid", label: "Mid option", original: false, changeCost: 1, support: { open: 80 } },
      { id: "other", label: "Other option", original: false, changeCost: 2, support: { open: 70 } },
    ] }],
  })]]));
  passing.keydown("1");
  assert.equal(passing.clipboardText(), "No group is below the approval threshold, so there is no first below-threshold group label to copy. A threshold is a number you entered, not a legal quorum. The label is not a legal identity.\n");
  const blocked = await savedWorkbench(new Map([["smallest-agreement:proposal:v1", JSON.stringify(draft)]]));
  blocked.blockClipboard();
  await blocked.click("#copy-first-below-threshold-group-button");
  assert.equal(blocked.focused(), "#first-below-threshold-group-fallback");
  blocked.clearFocus();
  blocked.keydown("1", { tagName: "INPUT", isContentEditable: false });
  assert.equal(blocked.focused(), "");
});

test("keyboard 2 jumps to the first below-threshold group copy control unless an input is active", async () => {
  const html = await standaloneBytes();
  assert.match(html, /<kbd>2<\/kbd> Jump to the first below-threshold group copy control, or the groups heading/u);
  assert.match(html, /id="copy-first-below-threshold-group-button"/u);
  assert.match(html, /id="groups-heading"/u);
  const app = await savedWorkbench(new Map());
  app.keydown("2");
  assert.equal(app.focused(), "#copy-first-below-threshold-group-button");
  assert.equal(app.clipboardText(), "");
  app.clearFocus();
  app.keydown("2", { tagName: "INPUT", isContentEditable: false });
  assert.equal(app.focused(), "");
  app.keydown("2", { tagName: "TEXTAREA", isContentEditable: false });
  assert.equal(app.focused(), "");
  app.keydown("2", { tagName: "SELECT", isContentEditable: false });
  assert.equal(app.focused(), "");
  app.keydown("9");
  assert.equal(app.focused(), "#copy-last-below-threshold-group-button");
  assert.equal(app.clipboardText(), "");
  app.clearFocus();
  app.keydown("2");
  assert.equal(app.focused(), "#copy-first-below-threshold-group-button");
  assert.equal(app.clipboardText(), "");
  app.clearFocus();
  app.keydown("1");
  assert.equal(app.clipboardText(), app.firstBelowThresholdGroup());
  app.clearFocus();
  app.keydown("2");
  assert.equal(app.focused(), "#copy-first-below-threshold-group-button");
});

test("keyboard 3 jumps to hide-last-group-at-or-above-threshold unless an input is active", async () => {
  const html = await standaloneBytes();
  assert.match(html, /<kbd>3<\/kbd> Jump to the hide-last-group-at-or-above-threshold control, or the groups heading/u);
  assert.match(html, /id="hide-last-group-at-or-above-threshold"/u);
  assert.match(html, /id="hide-last-group-at-or-above-threshold"[^>]*aria-keyshortcuts="3"/u);
  assert.match(html, /id="groups-heading"/u);
  const app = await savedWorkbench(new Map());
  app.keydown("3");
  assert.equal(app.focused(), "#hide-last-group-at-or-above-threshold");
  app.clearFocus();
  app.keydown("3", { tagName: "INPUT", isContentEditable: false });
  assert.equal(app.focused(), "");
  app.keydown("3", { tagName: "TEXTAREA", isContentEditable: false });
  assert.equal(app.focused(), "");
  app.keydown("3", { tagName: "SELECT", isContentEditable: false });
  assert.equal(app.focused(), "");
  app.keydown("0");
  assert.equal(app.focused(), "#hide-first-group-below-threshold");
  app.clearFocus();
  app.keydown("7");
  assert.equal(app.focused(), "#hide-last-group-below-threshold");
  app.clearFocus();
  app.keydown("3");
  assert.equal(app.focused(), "#hide-last-group-at-or-above-threshold");
});

test("keyboard 4 copies the last at-or-above-threshold group unless an input is active", async () => {
  const html = await standaloneBytes();
  assert.match(html, /<kbd>4<\/kbd> Copy the last at-or-above-threshold group label as one-line Markdown/u);
  assert.match(html, /id="copy-last-group-at-or-above-threshold-button"/u);
  assert.match(html, /id="copy-last-group-at-or-above-threshold-button"[^>]*aria-keyshortcuts="4"/u);
  const draft = {
    title: "Last at-or-above-threshold copy workshop",
    threshold: 70,
    groups: [
      { id: "cleared", name: "Cleared", weight: 1 },
      { id: "short", name: "Short", weight: 1 },
      { id: "later", name: "Later", weight: 1 },
    ],
    clauses: [{ id: "one", title: "One", options: [
      { id: "original", label: "Keep original", original: true, changeCost: 0, support: { cleared: 90, short: 20, later: 80 } },
      { id: "mid", label: "Mid option", original: false, changeCost: 1, support: { cleared: 80, short: 30, later: 75 } },
      { id: "other", label: "Other option", original: false, changeCost: 2, support: { cleared: 70, short: 40, later: 72 } },
    ] }],
  };
  const app = await savedWorkbench(new Map([["smallest-agreement:proposal:v1", JSON.stringify(draft)]]));
  app.keydown("4");
  assert.equal(app.clipboardText(), app.lastGroupAtOrAboveThreshold());
  assert.match(app.clipboardText(), /Last at-or-above-threshold group: Later/u);
  assert.doesNotMatch(app.clipboardText(), /Last below-threshold group/u);
  assert.doesNotMatch(app.clipboardText(), /First below-threshold group/u);
  assert.doesNotMatch(app.clipboardText(), /threshold-group count/u);
  assert.doesNotMatch(app.clipboardText(), /Cleared/u);
  assert.doesNotMatch(app.clipboardText(), /Short/u);
  assert.match(app.message(), /not a legal identity/u);
  app.clearFocus();
  app.keydown("4", { tagName: "INPUT", isContentEditable: false });
  assert.equal(app.focused(), "");
  app.keydown("4", { tagName: "TEXTAREA", isContentEditable: false });
  assert.equal(app.focused(), "");
  app.clearFocus();
  app.keydown("1");
  assert.equal(app.clipboardText(), app.firstBelowThresholdGroup());
  assert.match(app.clipboardText(), /First below-threshold group: Short/u);
  app.clearFocus();
  app.keydown("8");
  assert.equal(app.clipboardText(), app.lastBelowThresholdGroup());
  assert.match(app.clipboardText(), /Last below-threshold group: Short/u);
  app.clearFocus();
  app.keydown("4");
  assert.equal(app.clipboardText(), "Last at-or-above-threshold group: Later. A threshold is a number you entered, not a legal quorum. The label is not a legal identity.\n");
  app.clearFocus();
  app.keydown("}");
  assert.match(app.clipboardText(), /Groups meeting the approval threshold/u);
  const none = await savedWorkbench(new Map([["smallest-agreement:proposal:v1", JSON.stringify({
    title: "No at-or-above-threshold groups workshop",
    threshold: 70,
    groups: [{ id: "open", name: "Open", weight: 1 }],
    clauses: [{ id: "one", title: "One", options: [
      { id: "original", label: "Keep original", original: true, changeCost: 0, support: { open: 20 } },
      { id: "mid", label: "Mid option", original: false, changeCost: 1, support: { open: 30 } },
      { id: "other", label: "Other option", original: false, changeCost: 2, support: { open: 40 } },
    ] }],
  })]]));
  none.keydown("4");
  assert.equal(none.clipboardText(), "No group is at or above the approval threshold, so there is no last at-or-above-threshold group label to copy. A threshold is a number you entered, not a legal quorum. The label is not a legal identity.\n");
  const blocked = await savedWorkbench(new Map([["smallest-agreement:proposal:v1", JSON.stringify(draft)]]));
  blocked.blockClipboard();
  await blocked.click("#copy-last-group-at-or-above-threshold-button");
  assert.equal(blocked.focused(), "#last-group-at-or-above-threshold-fallback");
  blocked.clearFocus();
  blocked.keydown("4", { tagName: "INPUT", isContentEditable: false });
  assert.equal(blocked.focused(), "");
});

test("keyboard Home jumps to the last at-or-above-threshold group copy control unless an input is active", async () => {
  const html = await standaloneBytes();
  assert.match(html, /<kbd>Home<\/kbd> Jump to the last at-or-above-threshold group copy control, or the groups heading/u);
  assert.match(html, /id="copy-last-group-at-or-above-threshold-button"/u);
  assert.match(html, /id="groups-heading"/u);
  const app = await savedWorkbench(new Map());
  app.keydown("Home");
  assert.equal(app.focused(), "#copy-last-group-at-or-above-threshold-button");
  assert.equal(app.clipboardText(), "");
  app.clearFocus();
  app.keydown("Home", { tagName: "INPUT", isContentEditable: false });
  assert.equal(app.focused(), "");
  app.keydown("Home", { tagName: "TEXTAREA", isContentEditable: false });
  assert.equal(app.focused(), "");
  app.keydown("Home", { tagName: "SELECT", isContentEditable: false });
  assert.equal(app.focused(), "");
  app.keydown("2");
  assert.equal(app.focused(), "#copy-first-below-threshold-group-button");
  assert.equal(app.clipboardText(), "");
  app.clearFocus();
  app.keydown("Home");
  assert.equal(app.focused(), "#copy-last-group-at-or-above-threshold-button");
  assert.equal(app.clipboardText(), "");
  app.clearFocus();
  app.keydown("4");
  assert.equal(app.clipboardText(), app.lastGroupAtOrAboveThreshold());
  app.clearFocus();
  app.keydown("Home");
  assert.equal(app.focused(), "#copy-last-group-at-or-above-threshold-button");
});

test("keyboard End jumps to hide-first-group-at-or-above-threshold unless an input is active", async () => {
  const html = await standaloneBytes();
  assert.match(html, /<kbd>End<\/kbd> Jump to the hide-first-group-at-or-above-threshold control, or the groups heading/u);
  assert.match(html, /id="hide-first-group-at-or-above-threshold"/u);
  assert.match(html, /id="hide-first-group-at-or-above-threshold"[^>]*aria-keyshortcuts="End"/u);
  assert.match(html, /id="groups-heading"/u);
  const app = await savedWorkbench(new Map());
  app.keydown("End");
  assert.equal(app.focused(), "#hide-first-group-at-or-above-threshold");
  app.clearFocus();
  app.keydown("End", { tagName: "INPUT", isContentEditable: false });
  assert.equal(app.focused(), "");
  app.keydown("End", { tagName: "TEXTAREA", isContentEditable: false });
  assert.equal(app.focused(), "");
  app.keydown("End", { tagName: "SELECT", isContentEditable: false });
  assert.equal(app.focused(), "");
  app.keydown("3");
  assert.equal(app.focused(), "#hide-last-group-at-or-above-threshold");
  app.clearFocus();
  app.keydown("End");
  assert.equal(app.focused(), "#hide-first-group-at-or-above-threshold");
});

test("keyboard PageUp copies the first at-or-above-threshold group unless an input is active", async () => {
  const html = await standaloneBytes();
  assert.match(html, /<kbd>PageUp<\/kbd> Copy the first at-or-above-threshold group label as one-line Markdown/u);
  assert.match(html, /id="copy-first-group-at-or-above-threshold-button"/u);
  assert.match(html, /id="copy-first-group-at-or-above-threshold-button"[^>]*aria-keyshortcuts="PageUp"/u);
  const draft = {
    title: "First at-or-above-threshold copy workshop",
    threshold: 70,
    groups: [
      { id: "cleared", name: "Cleared", weight: 1 },
      { id: "short", name: "Short", weight: 1 },
      { id: "later", name: "Later", weight: 1 },
    ],
    clauses: [{ id: "one", title: "One", options: [
      { id: "original", label: "Keep original", original: true, changeCost: 0, support: { cleared: 90, short: 20, later: 80 } },
      { id: "mid", label: "Mid option", original: false, changeCost: 1, support: { cleared: 80, short: 30, later: 75 } },
      { id: "other", label: "Other option", original: false, changeCost: 2, support: { cleared: 70, short: 40, later: 72 } },
    ] }],
  };
  const app = await savedWorkbench(new Map([["smallest-agreement:proposal:v1", JSON.stringify(draft)]]));
  app.keydown("PageUp");
  assert.equal(app.clipboardText(), app.firstGroupAtOrAboveThreshold());
  assert.match(app.clipboardText(), /First at-or-above-threshold group: Cleared/u);
  assert.doesNotMatch(app.clipboardText(), /Last at-or-above-threshold group/u);
  assert.doesNotMatch(app.clipboardText(), /First below-threshold group/u);
  assert.doesNotMatch(app.clipboardText(), /Later/u);
  assert.doesNotMatch(app.clipboardText(), /Short/u);
  assert.match(app.message(), /not a legal identity/u);
  app.clearFocus();
  app.keydown("PageUp", { tagName: "INPUT", isContentEditable: false });
  assert.equal(app.focused(), "");
  app.keydown("PageUp", { tagName: "TEXTAREA", isContentEditable: false });
  assert.equal(app.focused(), "");
  app.clearFocus();
  app.keydown("4");
  assert.equal(app.clipboardText(), app.lastGroupAtOrAboveThreshold());
  assert.match(app.clipboardText(), /Last at-or-above-threshold group: Later/u);
  app.clearFocus();
  app.keydown("1");
  assert.equal(app.clipboardText(), app.firstBelowThresholdGroup());
  assert.match(app.clipboardText(), /First below-threshold group: Short/u);
  app.clearFocus();
  app.keydown("PageUp");
  assert.equal(app.clipboardText(), "First at-or-above-threshold group: Cleared. A threshold is a number you entered, not a legal quorum. The label is not a legal identity.\n");
  const none = await savedWorkbench(new Map([["smallest-agreement:proposal:v1", JSON.stringify({
    title: "No at-or-above-threshold groups workshop",
    threshold: 70,
    groups: [{ id: "open", name: "Open", weight: 1 }],
    clauses: [{ id: "one", title: "One", options: [
      { id: "original", label: "Keep original", original: true, changeCost: 0, support: { open: 20 } },
      { id: "mid", label: "Mid option", original: false, changeCost: 1, support: { open: 30 } },
      { id: "other", label: "Other option", original: false, changeCost: 2, support: { open: 40 } },
    ] }],
  })]]));
  none.keydown("PageUp");
  assert.equal(none.clipboardText(), "No group is at or above the approval threshold, so there is no first at-or-above-threshold group label to copy. A threshold is a number you entered, not a legal quorum. The label is not a legal identity.\n");
  const blocked = await savedWorkbench(new Map([["smallest-agreement:proposal:v1", JSON.stringify(draft)]]));
  blocked.blockClipboard();
  await blocked.click("#copy-first-group-at-or-above-threshold-button");
  assert.equal(blocked.focused(), "#first-group-at-or-above-threshold-fallback");
  blocked.clearFocus();
  blocked.keydown("PageUp", { tagName: "INPUT", isContentEditable: false });
  assert.equal(blocked.focused(), "");
});

test("keyboard PageDown jumps to the first at-or-above-threshold group copy control unless an input is active", async () => {
  const html = await standaloneBytes();
  assert.match(html, /<kbd>PageDown<\/kbd> Jump to the first at-or-above-threshold group copy control, or the groups heading/u);
  assert.match(html, /id="copy-first-group-at-or-above-threshold-button"/u);
  assert.match(html, /id="groups-heading"/u);
  const app = await savedWorkbench(new Map());
  app.keydown("PageDown");
  assert.equal(app.focused(), "#copy-first-group-at-or-above-threshold-button");
  assert.equal(app.clipboardText(), "");
  app.clearFocus();
  app.keydown("PageDown", { tagName: "INPUT", isContentEditable: false });
  assert.equal(app.focused(), "");
  app.keydown("PageDown", { tagName: "TEXTAREA", isContentEditable: false });
  assert.equal(app.focused(), "");
  app.keydown("PageDown", { tagName: "SELECT", isContentEditable: false });
  assert.equal(app.focused(), "");
  app.keydown("Home");
  assert.equal(app.focused(), "#copy-last-group-at-or-above-threshold-button");
  assert.equal(app.clipboardText(), "");
  app.clearFocus();
  app.keydown("PageDown");
  assert.equal(app.focused(), "#copy-first-group-at-or-above-threshold-button");
  assert.equal(app.clipboardText(), "");
  app.clearFocus();
  app.keydown("PageUp");
  assert.equal(app.clipboardText(), app.firstGroupAtOrAboveThreshold());
  app.clearFocus();
  app.keydown("PageDown");
  assert.equal(app.focused(), "#copy-first-group-at-or-above-threshold-button");
});

test("keyboard ArrowUp jumps to hide-last-group-at-floor unless an input is active", async () => {
  const html = await standaloneBytes();
  assert.match(html, /<kbd>ArrowUp<\/kbd> Jump to the hide-last-group-at-floor control, or the groups heading/u);
  assert.match(html, /id="hide-last-group-at-floor"/u);
  assert.match(html, /id="hide-last-group-at-floor"[^>]*aria-keyshortcuts="ArrowUp"/u);
  assert.match(html, /id="groups-heading"/u);
  const app = await savedWorkbench(new Map());
  app.keydown("ArrowUp");
  assert.equal(app.focused(), "#hide-last-group-at-floor");
  app.clearFocus();
  app.keydown("ArrowUp", { tagName: "INPUT", isContentEditable: false });
  assert.equal(app.focused(), "");
  app.keydown("ArrowUp", { tagName: "TEXTAREA", isContentEditable: false });
  assert.equal(app.focused(), "");
  app.keydown("ArrowUp", { tagName: "SELECT", isContentEditable: false });
  assert.equal(app.focused(), "");
  app.keydown("End");
  assert.equal(app.focused(), "#hide-first-group-at-or-above-threshold");
  app.clearFocus();
  app.keydown("3");
  assert.equal(app.focused(), "#hide-last-group-at-or-above-threshold");
  app.clearFocus();
  app.keydown("ArrowUp");
  assert.equal(app.focused(), "#hide-last-group-at-floor");
});

test("keyboard Insert copies the last at-floor group unless an input is active", async () => {
  const html = await standaloneBytes();
  assert.match(html, /<kbd>Insert<\/kbd> Copy the last at-floor group label as one-line Markdown/u);
  assert.match(html, /id="copy-last-group-at-floor-button"/u);
  assert.match(html, /id="copy-last-group-at-floor-button"[^>]*aria-keyshortcuts="Insert"/u);
  assert.match(html, /const key = event\.key\.length === 1 \? event\.key\.toLowerCase\(\) : event\.key/u);
  assert.match(html, /if \(event\.defaultPrevented\) return/u);
  const draft = {
    title: "Last at-floor copy workshop",
    threshold: 50,
    groups: [
      { id: "cleared", name: "Cleared", weight: 1, minSupport: 40 },
      { id: "short", name: "Short", weight: 1, minSupport: 90 },
      { id: "later", name: "Later", weight: 1, minSupport: 40 },
    ],
    clauses: [{ id: "one", title: "One", options: [
      { id: "original", label: "Keep original", original: true, changeCost: 0, support: { cleared: 90, short: 20, later: 80 } },
      { id: "mid", label: "Mid option", original: false, changeCost: 1, support: { cleared: 80, short: 30, later: 75 } },
      { id: "other", label: "Other option", original: false, changeCost: 2, support: { cleared: 70, short: 40, later: 72 } },
    ] }],
  };
  const app = await savedWorkbench(new Map([["smallest-agreement:proposal:v1", JSON.stringify(draft)]]));
  app.keydown("Insert");
  assert.equal(app.clipboardText(), app.lastGroupAtFloor());
  assert.match(app.clipboardText(), /Last at-floor group: Later/u);
  assert.doesNotMatch(app.clipboardText(), /Last at-or-above-threshold group/u);
  assert.doesNotMatch(app.clipboardText(), /First at-or-above-threshold group/u);
  assert.doesNotMatch(app.clipboardText(), /Cleared/u);
  assert.doesNotMatch(app.clipboardText(), /Short/u);
  assert.match(app.message(), /not a legal identity/u);
  assert.match(app.message(), /not a legal quorum/u);
  app.clearFocus();
  app.keydown("Insert", { tagName: "INPUT", isContentEditable: false });
  assert.equal(app.focused(), "");
  app.keydown("Insert", { tagName: "TEXTAREA", isContentEditable: false });
  assert.equal(app.focused(), "");
  app.clearFocus();
  app.keydown("4");
  assert.equal(app.clipboardText(), app.lastGroupAtOrAboveThreshold());
  assert.match(app.clipboardText(), /Last at-or-above-threshold group: Later/u);
  app.clearFocus();
  app.keydown("PageUp");
  assert.equal(app.clipboardText(), app.firstGroupAtOrAboveThreshold());
  assert.match(app.clipboardText(), /First at-or-above-threshold group: Cleared/u);
  app.clearFocus();
  app.keydown("Insert");
  assert.equal(app.clipboardText(), "Last at-floor group: Later. A floor is a number you entered, not a legal quorum. The label is not a legal identity.\n");
  app.clearFocus();
  app.keydown("Insert", { tagName: "BODY", isContentEditable: false }, { defaultPrevented: true });
  assert.equal(app.clipboardText(), "Last at-floor group: Later. A floor is a number you entered, not a legal quorum. The label is not a legal identity.\n");
  const none = await savedWorkbench(new Map([["smallest-agreement:proposal:v1", JSON.stringify({
    title: "No at-floor groups workshop",
    threshold: 50,
    groups: [{ id: "open", name: "Open", weight: 1 }],
    clauses: [{ id: "one", title: "One", options: [
      { id: "original", label: "Keep original", original: true, changeCost: 0, support: { open: 90 } },
      { id: "mid", label: "Mid option", original: false, changeCost: 1, support: { open: 80 } },
      { id: "other", label: "Other option", original: false, changeCost: 2, support: { open: 70 } },
    ] }],
  })]]));
  none.keydown("Insert");
  assert.equal(none.clipboardText(), "No group currently meets their support floor, so there is no last at-floor group label to copy. A floor is a number you entered, not a legal quorum. The label is not a legal identity.\n");
  const blocked = await savedWorkbench(new Map([["smallest-agreement:proposal:v1", JSON.stringify(draft)]]));
  blocked.blockClipboard();
  await blocked.click("#copy-last-group-at-floor-button");
  assert.equal(blocked.focused(), "#last-group-at-floor-fallback");
  blocked.clearFocus();
  blocked.keydown("Insert", { tagName: "INPUT", isContentEditable: false });
  assert.equal(blocked.focused(), "");
});

test("keyboard ArrowDown jumps to the last at-floor group copy control unless an input is active", async () => {
  const html = await standaloneBytes();
  assert.match(html, /<kbd>ArrowDown<\/kbd> Jump to the last at-floor group copy control, or the groups heading/u);
  assert.match(html, /id="copy-last-group-at-floor-button"/u);
  assert.match(html, /id="groups-heading"/u);
  const app = await savedWorkbench(new Map());
  app.keydown("ArrowDown");
  assert.equal(app.focused(), "#copy-last-group-at-floor-button");
  assert.equal(app.clipboardText(), "");
  app.clearFocus();
  app.keydown("ArrowDown", { tagName: "INPUT", isContentEditable: false });
  assert.equal(app.focused(), "");
  app.keydown("ArrowDown", { tagName: "TEXTAREA", isContentEditable: false });
  assert.equal(app.focused(), "");
  app.keydown("ArrowDown", { tagName: "SELECT", isContentEditable: false });
  assert.equal(app.focused(), "");
  app.keydown("PageDown");
  assert.equal(app.focused(), "#copy-first-group-at-or-above-threshold-button");
  assert.equal(app.clipboardText(), "");
  app.clearFocus();
  app.keydown("Home");
  assert.equal(app.focused(), "#copy-last-group-at-or-above-threshold-button");
  assert.equal(app.clipboardText(), "");
  app.clearFocus();
  app.keydown("ArrowDown");
  assert.equal(app.focused(), "#copy-last-group-at-floor-button");
  assert.equal(app.clipboardText(), "");
  app.clearFocus();
  app.keydown("Insert");
  assert.equal(app.clipboardText(), app.lastGroupAtFloor());
  app.clearFocus();
  app.keydown("ArrowDown");
  assert.equal(app.focused(), "#copy-last-group-at-floor-button");
  app.clearFocus();
  app.keydown("ArrowDown", { tagName: "BODY", isContentEditable: false }, { defaultPrevented: true });
  assert.equal(app.focused(), "");
});

test("keyboard ArrowLeft jumps to hide-first-group-at-floor unless an input is active", async () => {
  const html = await standaloneBytes();
  assert.match(html, /<kbd>ArrowLeft<\/kbd> Jump to the hide-first-group-at-floor control, or the groups heading/u);
  assert.match(html, /id="hide-first-group-at-floor"/u);
  assert.match(html, /id="hide-first-group-at-floor"[^>]*aria-keyshortcuts="ArrowLeft"/u);
  assert.match(html, /id="groups-heading"/u);
  const app = await savedWorkbench(new Map());
  app.keydown("ArrowLeft");
  assert.equal(app.focused(), "#hide-first-group-at-floor");
  app.clearFocus();
  app.keydown("ArrowLeft", { tagName: "INPUT", isContentEditable: false });
  assert.equal(app.focused(), "");
  app.keydown("ArrowLeft", { tagName: "TEXTAREA", isContentEditable: false });
  assert.equal(app.focused(), "");
  app.keydown("ArrowLeft", { tagName: "SELECT", isContentEditable: false });
  assert.equal(app.focused(), "");
  app.keydown("ArrowUp");
  assert.equal(app.focused(), "#hide-last-group-at-floor");
  app.clearFocus();
  app.keydown("End");
  assert.equal(app.focused(), "#hide-first-group-at-or-above-threshold");
  app.clearFocus();
  app.keydown("ArrowLeft");
  assert.equal(app.focused(), "#hide-first-group-at-floor");
  app.clearFocus();
  app.keydown("ArrowLeft", { tagName: "BODY", isContentEditable: false }, { defaultPrevented: true });
  assert.equal(app.focused(), "");
});

test("keyboard Delete copies the last below-floor group unless an input is active", async () => {
  const html = await standaloneBytes();
  assert.match(html, /<kbd>Delete<\/kbd> Copy the last below-floor group label as one-line Markdown/u);
  assert.match(html, /id="copy-last-below-floor-group-button"/u);
  assert.match(html, /id="copy-last-below-floor-group-button"[^>]*aria-keyshortcuts="Delete"/u);
  assert.match(html, /const key = event\.key\.length === 1 \? event\.key\.toLowerCase\(\) : event\.key/u);
  assert.match(html, /if \(event\.defaultPrevented\) return/u);
  const draft = {
    title: "Last below-floor copy workshop",
    threshold: 70,
    groups: [
      { id: "floored", name: "Floored", weight: 1, minSupport: 80 },
      { id: "open", name: "Open", weight: 5 },
      { id: "later", name: "Later floor", weight: 1, minSupport: 90 },
    ],
    clauses: [{ id: "one", title: "One", options: [
      { id: "original", label: "Keep original", original: true, changeCost: 0, support: { floored: 50, open: 90, later: 40 } },
      { id: "mid", label: "Mid option", original: false, changeCost: 1, support: { floored: 50, open: 40, later: 40 } },
      { id: "other", label: "Other option", original: false, changeCost: 2, support: { floored: 50, open: 80, later: 40 } },
    ] }],
  };
  const app = await savedWorkbench(new Map([["smallest-agreement:proposal:v1", JSON.stringify(draft)]]));
  app.keydown("Delete");
  assert.equal(app.clipboardText(), app.lastBelowFloorGroup());
  assert.match(app.clipboardText(), /Last below-floor group: Later floor/u);
  assert.doesNotMatch(app.clipboardText(), /First below-floor group/u);
  assert.doesNotMatch(app.clipboardText(), /Last below-threshold group/u);
  assert.doesNotMatch(app.clipboardText(), /Last at-floor group/u);
  assert.doesNotMatch(app.clipboardText(), /Floored/u);
  assert.match(app.message(), /not a legal identity/u);
  assert.match(app.message(), /not a legal quorum/u);
  app.clearFocus();
  app.keydown("Delete", { tagName: "INPUT", isContentEditable: false });
  assert.equal(app.focused(), "");
  app.keydown("Delete", { tagName: "TEXTAREA", isContentEditable: false });
  assert.equal(app.focused(), "");
  app.clearFocus();
  app.keydown("\"");
  assert.equal(app.clipboardText(), app.firstBelowFloorGroup());
  assert.match(app.clipboardText(), /First below-floor group: Floored/u);
  app.clearFocus();
  app.keydown("8");
  assert.equal(app.clipboardText(), app.lastBelowThresholdGroup());
  assert.match(app.clipboardText(), /Last below-threshold group: Later floor/u);
  app.clearFocus();
  app.keydown("Delete");
  assert.equal(app.clipboardText(), "Last below-floor group: Later floor. A floor is a number you entered, not a legal quorum. The label is not a legal identity.\n");
  app.clearFocus();
  app.keydown("Delete", { tagName: "BODY", isContentEditable: false }, { defaultPrevented: true });
  assert.equal(app.clipboardText(), "Last below-floor group: Later floor. A floor is a number you entered, not a legal quorum. The label is not a legal identity.\n");
  const none = await savedWorkbench(new Map([["smallest-agreement:proposal:v1", JSON.stringify({
    title: "No below-floor groups workshop",
    threshold: 70,
    groups: [{ id: "open", name: "Open", weight: 1 }],
    clauses: [{ id: "one", title: "One", options: [
      { id: "original", label: "Keep original", original: true, changeCost: 0, support: { open: 90 } },
      { id: "mid", label: "Mid option", original: false, changeCost: 1, support: { open: 80 } },
      { id: "other", label: "Other option", original: false, changeCost: 2, support: { open: 70 } },
    ] }],
  })]]));
  none.keydown("Delete");
  assert.equal(none.clipboardText(), "No group is below its support floor, so there is no last below-floor group label to copy. A floor is a number you entered, not a legal quorum. The label is not a legal identity.\n");
  const blocked = await savedWorkbench(new Map([["smallest-agreement:proposal:v1", JSON.stringify(draft)]]));
  blocked.blockClipboard();
  await blocked.click("#copy-last-below-floor-group-button");
  assert.equal(blocked.focused(), "#last-below-floor-group-fallback");
  blocked.clearFocus();
  blocked.keydown("Delete", { tagName: "INPUT", isContentEditable: false });
  assert.equal(blocked.focused(), "");
});

test("keyboard F2 jumps to the last below-floor group copy control unless an input is active", async () => {
  const html = await standaloneBytes();
  assert.match(html, /<kbd>F2<\/kbd> Jump to the last below-floor group copy control, or the groups heading/u);
  assert.match(html, /id="copy-last-below-floor-group-button"/u);
  assert.match(html, /id="groups-heading"/u);
  const app = await savedWorkbench(new Map());
  app.keydown("F2");
  assert.equal(app.focused(), "#copy-last-below-floor-group-button");
  assert.equal(app.clipboardText(), "");
  app.clearFocus();
  app.keydown("F2", { tagName: "INPUT", isContentEditable: false });
  assert.equal(app.focused(), "");
  app.keydown("F2", { tagName: "TEXTAREA", isContentEditable: false });
  assert.equal(app.focused(), "");
  app.keydown("F2", { tagName: "SELECT", isContentEditable: false });
  assert.equal(app.focused(), "");
  app.keydown("ArrowDown");
  assert.equal(app.focused(), "#copy-last-group-at-floor-button");
  assert.equal(app.clipboardText(), "");
  app.clearFocus();
  app.keydown("Home");
  assert.equal(app.focused(), "#copy-last-group-at-or-above-threshold-button");
  assert.equal(app.clipboardText(), "");
  app.clearFocus();
  app.keydown("F2");
  assert.equal(app.focused(), "#copy-last-below-floor-group-button");
  assert.equal(app.clipboardText(), "");
  app.clearFocus();
  app.keydown("Delete");
  assert.equal(app.clipboardText(), app.lastBelowFloorGroup());
  app.clearFocus();
  app.keydown("F2");
  assert.equal(app.focused(), "#copy-last-below-floor-group-button");
  app.clearFocus();
  app.keydown("F2", { tagName: "BODY", isContentEditable: false }, { defaultPrevented: true });
  assert.equal(app.focused(), "");
});

test("keyboard ArrowRight jumps to hide-first-group-below-floor unless an input is active", async () => {
  const html = await standaloneBytes();
  assert.match(html, /<kbd>ArrowRight<\/kbd> Jump to the hide-first-group-below-floor control, or the groups heading/u);
  assert.match(html, /id="hide-first-group-below-floor"/u);
  assert.match(html, /id="hide-first-group-below-floor"[^>]*aria-keyshortcuts="ArrowRight"/u);
  assert.match(html, /id="groups-heading"/u);
  const app = await savedWorkbench(new Map());
  app.keydown("ArrowRight");
  assert.equal(app.focused(), "#hide-first-group-below-floor");
  app.clearFocus();
  app.keydown("ArrowRight", { tagName: "INPUT", isContentEditable: false });
  assert.equal(app.focused(), "");
  app.keydown("ArrowRight", { tagName: "TEXTAREA", isContentEditable: false });
  assert.equal(app.focused(), "");
  app.keydown("ArrowRight", { tagName: "SELECT", isContentEditable: false });
  assert.equal(app.focused(), "");
  app.keydown("ArrowLeft");
  assert.equal(app.focused(), "#hide-first-group-at-floor");
  app.clearFocus();
  app.keydown("ArrowUp");
  assert.equal(app.focused(), "#hide-last-group-at-floor");
  app.clearFocus();
  app.keydown("ArrowRight");
  assert.equal(app.focused(), "#hide-first-group-below-floor");
  app.clearFocus();
  app.keydown("ArrowRight", { tagName: "BODY", isContentEditable: false }, { defaultPrevented: true });
  assert.equal(app.focused(), "");
});

test("keyboard F3 copies the first at-floor group unless an input is active", async () => {
  const html = await standaloneBytes();
  assert.match(html, /<kbd>F3<\/kbd> Copy the first at-floor group label as one-line Markdown/u);
  assert.match(html, /id="copy-first-group-at-floor-button"/u);
  assert.match(html, /id="copy-first-group-at-floor-button"[^>]*aria-keyshortcuts="F3"/u);
  assert.match(html, /const key = event\.key\.length === 1 \? event\.key\.toLowerCase\(\) : event\.key/u);
  assert.match(html, /if \(event\.defaultPrevented\) return/u);
  const draft = {
    title: "First at-floor copy workshop",
    threshold: 50,
    groups: [
      { id: "cleared", name: "Cleared", weight: 1, minSupport: 40 },
      { id: "short", name: "Short", weight: 1, minSupport: 90 },
      { id: "later", name: "Later", weight: 1, minSupport: 40 },
    ],
    clauses: [{ id: "one", title: "One", options: [
      { id: "original", label: "Keep original", original: true, changeCost: 0, support: { cleared: 90, short: 20, later: 80 } },
      { id: "mid", label: "Mid option", original: false, changeCost: 1, support: { cleared: 80, short: 30, later: 75 } },
      { id: "other", label: "Other option", original: false, changeCost: 2, support: { cleared: 70, short: 40, later: 72 } },
    ] }],
  };
  const app = await savedWorkbench(new Map([["smallest-agreement:proposal:v1", JSON.stringify(draft)]]));
  app.keydown("F3");
  assert.equal(app.clipboardText(), app.firstGroupAtFloor());
  assert.match(app.clipboardText(), /First at-floor group: Cleared/u);
  assert.doesNotMatch(app.clipboardText(), /Last at-floor group/u);
  assert.doesNotMatch(app.clipboardText(), /First at-or-above-threshold group/u);
  assert.doesNotMatch(app.clipboardText(), /Later/u);
  assert.doesNotMatch(app.clipboardText(), /Short/u);
  assert.match(app.message(), /not a legal identity/u);
  assert.match(app.message(), /not a legal quorum/u);
  app.clearFocus();
  app.keydown("F3", { tagName: "INPUT", isContentEditable: false });
  assert.equal(app.focused(), "");
  app.keydown("F3", { tagName: "TEXTAREA", isContentEditable: false });
  assert.equal(app.focused(), "");
  app.clearFocus();
  app.keydown("Insert");
  assert.equal(app.clipboardText(), app.lastGroupAtFloor());
  assert.match(app.clipboardText(), /Last at-floor group: Later/u);
  app.clearFocus();
  app.keydown("PageUp");
  assert.equal(app.clipboardText(), app.firstGroupAtOrAboveThreshold());
  assert.match(app.clipboardText(), /First at-or-above-threshold group: Cleared/u);
  app.clearFocus();
  app.keydown("ArrowDown");
  assert.equal(app.focused(), "#copy-last-group-at-floor-button");
  app.clearFocus();
  app.keydown("F3");
  assert.equal(app.clipboardText(), "First at-floor group: Cleared. A floor is a number you entered, not a legal quorum. The label is not a legal identity.\n");
  app.clearFocus();
  app.keydown("F3", { tagName: "BODY", isContentEditable: false }, { defaultPrevented: true });
  assert.equal(app.clipboardText(), "First at-floor group: Cleared. A floor is a number you entered, not a legal quorum. The label is not a legal identity.\n");
  const none = await savedWorkbench(new Map([["smallest-agreement:proposal:v1", JSON.stringify({
    title: "No at-floor groups workshop",
    threshold: 50,
    groups: [{ id: "open", name: "Open", weight: 1 }],
    clauses: [{ id: "one", title: "One", options: [
      { id: "original", label: "Keep original", original: true, changeCost: 0, support: { open: 90 } },
      { id: "mid", label: "Mid option", original: false, changeCost: 1, support: { open: 80 } },
      { id: "other", label: "Other option", original: false, changeCost: 2, support: { open: 70 } },
    ] }],
  })]]));
  none.keydown("F3");
  assert.equal(none.clipboardText(), "No group currently meets their support floor, so there is no first at-floor group label to copy. A floor is a number you entered, not a legal quorum. The label is not a legal identity.\n");
  const blocked = await savedWorkbench(new Map([["smallest-agreement:proposal:v1", JSON.stringify(draft)]]));
  blocked.blockClipboard();
  await blocked.click("#copy-first-group-at-floor-button");
  assert.equal(blocked.focused(), "#first-group-at-floor-fallback");
  blocked.clearFocus();
  blocked.keydown("F3", { tagName: "INPUT", isContentEditable: false });
  assert.equal(blocked.focused(), "");
});

test("keyboard F4 jumps to the first at-floor group copy control unless an input is active", async () => {
  const html = await standaloneBytes();
  assert.match(html, /<kbd>F4<\/kbd> Jump to the first at-floor group copy control, or the groups heading/u);
  assert.match(html, /id="copy-first-group-at-floor-button"/u);
  assert.match(html, /id="groups-heading"/u);
  const app = await savedWorkbench(new Map());
  app.keydown("F4");
  assert.equal(app.focused(), "#copy-first-group-at-floor-button");
  assert.equal(app.clipboardText(), "");
  app.clearFocus();
  app.keydown("F4", { tagName: "INPUT", isContentEditable: false });
  assert.equal(app.focused(), "");
  app.keydown("F4", { tagName: "TEXTAREA", isContentEditable: false });
  assert.equal(app.focused(), "");
  app.keydown("F4", { tagName: "SELECT", isContentEditable: false });
  assert.equal(app.focused(), "");
  app.keydown("ArrowDown");
  assert.equal(app.focused(), "#copy-last-group-at-floor-button");
  assert.equal(app.clipboardText(), "");
  app.clearFocus();
  app.keydown("F2");
  assert.equal(app.focused(), "#copy-last-below-floor-group-button");
  assert.equal(app.clipboardText(), "");
  app.clearFocus();
  app.keydown("F4");
  assert.equal(app.focused(), "#copy-first-group-at-floor-button");
  assert.equal(app.clipboardText(), "");
  app.clearFocus();
  app.keydown("Insert");
  assert.equal(app.clipboardText(), app.lastGroupAtFloor());
  app.clearFocus();
  app.keydown("F4");
  assert.equal(app.focused(), "#copy-first-group-at-floor-button");
  app.clearFocus();
  app.keydown("F4", { tagName: "BODY", isContentEditable: false }, { defaultPrevented: true });
  assert.equal(app.focused(), "");
});

test("keyboard Backspace jumps to hide-last-group-below-floor unless an input is active", async () => {
  const html = await standaloneBytes();
  assert.match(html, /<kbd>Backspace<\/kbd> Jump to the hide-last-group-below-floor control, or the groups heading/u);
  assert.match(html, /id="hide-last-group-below-floor"/u);
  assert.match(html, /id="hide-last-group-below-floor"[^>]*aria-keyshortcuts="Backspace"/u);
  assert.match(html, /id="groups-heading"/u);
  const app = await savedWorkbench(new Map());
  app.keydown("Backspace");
  assert.equal(app.focused(), "#hide-last-group-below-floor");
  assert.match(app.groups(), /Residents/u);
  app.clearFocus();
  app.keydown("Backspace", { tagName: "INPUT", isContentEditable: false });
  assert.equal(app.focused(), "");
  app.keydown("Backspace", { tagName: "TEXTAREA", isContentEditable: false });
  assert.equal(app.focused(), "");
  app.keydown("Backspace", { tagName: "SELECT", isContentEditable: false });
  assert.equal(app.focused(), "");
  app.keydown("ArrowRight");
  assert.equal(app.focused(), "#hide-first-group-below-floor");
  app.clearFocus();
  app.keydown("ArrowLeft");
  assert.equal(app.focused(), "#hide-first-group-at-floor");
  app.clearFocus();
  app.keydown("ArrowUp");
  assert.equal(app.focused(), "#hide-last-group-at-floor");
  app.clearFocus();
  app.keydown("Backspace");
  assert.equal(app.focused(), "#hide-last-group-below-floor");
  assert.match(app.groups(), /Residents/u);
  app.clearFocus();
  app.keydown("Backspace", { tagName: "BODY", isContentEditable: false }, { defaultPrevented: true });
  assert.equal(app.focused(), "");
});

test("keyboard F7 copies the last group without a support floor unless an input is active", async () => {
  const html = await standaloneBytes();
  assert.match(html, /<kbd>F7<\/kbd> Copy the last group-without-floor label as one-line Markdown/u);
  assert.match(html, /id="copy-last-group-without-floor-button"/u);
  assert.match(html, /id="copy-last-group-without-floor-button"[^>]*aria-keyshortcuts="F7"/u);
  assert.match(html, /const key = event\.key\.length === 1 \? event\.key\.toLowerCase\(\) : event\.key/u);
  assert.match(html, /if \(event\.defaultPrevented\) return/u);
  assert.equal("F7".length === 1, false);
  assert.equal("F8".length === 1, false);
  assert.equal("F9".length === 1, false);
  const draft = {
    title: "Last without floor copy workshop",
    threshold: 50,
    groups: [
      { id: "open", name: "Open", weight: 1 },
      { id: "floored", name: "Floored", weight: 1, minSupport: 40 },
      { id: "later", name: "Later open", weight: 1 },
    ],
    clauses: [{ id: "one", title: "One", options: [
      { id: "original", label: "Keep original", original: true, changeCost: 0, support: { open: 90, floored: 90, later: 80 } },
      { id: "mid", label: "Mid option", original: false, changeCost: 1, support: { open: 80, floored: 80, later: 75 } },
      { id: "other", label: "Other option", original: false, changeCost: 2, support: { open: 70, floored: 70, later: 72 } },
    ] }],
  };
  const app = await savedWorkbench(new Map([["smallest-agreement:proposal:v1", JSON.stringify(draft)]]));
  app.keydown("F7");
  assert.equal(app.clipboardText(), app.lastGroupWithoutFloor());
  assert.match(app.clipboardText(), /Last group without a support floor: Later open/u);
  assert.doesNotMatch(app.clipboardText(), /First at-floor group/u);
  assert.doesNotMatch(app.clipboardText(), /Last at-floor group/u);
  assert.doesNotMatch(app.clipboardText(), /First below-floor group/u);
  assert.doesNotMatch(app.clipboardText(), /Last below-floor group/u);
  assert.doesNotMatch(app.clipboardText(), /Floored/u);
  assert.match(app.message(), /not a legal identity/u);
  assert.match(app.message(), /not a legal quorum/u);
  app.clearFocus();
  app.keydown("F7", { tagName: "INPUT", isContentEditable: false });
  assert.equal(app.focused(), "");
  app.keydown("F7", { tagName: "TEXTAREA", isContentEditable: false });
  assert.equal(app.focused(), "");
  app.clearFocus();
  app.keydown("F3");
  assert.equal(app.clipboardText(), app.firstGroupAtFloor());
  assert.match(app.clipboardText(), /First at-floor group: Floored/u);
  app.clearFocus();
  app.keydown("Insert");
  assert.equal(app.clipboardText(), app.lastGroupAtFloor());
  assert.match(app.clipboardText(), /Last at-floor group: Floored/u);
  app.clearFocus();
  app.keydown("\"");
  assert.equal(app.clipboardText(), app.firstBelowFloorGroup());
  app.clearFocus();
  app.keydown("F7");
  assert.equal(app.clipboardText(), "Last group without a support floor: Later open. A floor is a number you entered, not a legal quorum. The label is not a legal identity.\n");
  app.clearFocus();
  app.keydown("F7", { tagName: "BODY", isContentEditable: false }, { defaultPrevented: true });
  assert.equal(app.clipboardText(), "Last group without a support floor: Later open. A floor is a number you entered, not a legal quorum. The label is not a legal identity.\n");
  const none = await savedWorkbench(new Map([["smallest-agreement:proposal:v1", JSON.stringify({
    title: "No groups without floors workshop",
    threshold: 50,
    groups: [{ id: "floored", name: "Floored", weight: 1, minSupport: 40 }],
    clauses: [{ id: "one", title: "One", options: [
      { id: "original", label: "Keep original", original: true, changeCost: 0, support: { floored: 90 } },
      { id: "mid", label: "Mid option", original: false, changeCost: 1, support: { floored: 80 } },
      { id: "other", label: "Other option", original: false, changeCost: 2, support: { floored: 70 } },
    ] }],
  })]]));
  none.keydown("F7");
  assert.equal(none.clipboardText(), "No group is without a support floor, so there is no last group-without-floor label to copy. A floor is a number you entered, not a legal quorum. The label is not a legal identity.\n");
  const blocked = await savedWorkbench(new Map([["smallest-agreement:proposal:v1", JSON.stringify(draft)]]));
  blocked.blockClipboard();
  await blocked.click("#copy-last-group-without-floor-button");
  assert.equal(blocked.focused(), "#last-group-without-floor-fallback");
  blocked.clearFocus();
  blocked.keydown("F7", { tagName: "INPUT", isContentEditable: false });
  assert.equal(blocked.focused(), "");
});

test("keyboard F8 jumps to the last group-without-floor copy control unless an input is active", async () => {
  const html = await standaloneBytes();
  assert.match(html, /<kbd>F8<\/kbd> Jump to the last group-without-floor copy control, or the groups heading/u);
  assert.match(html, /id="copy-last-group-without-floor-button"/u);
  assert.match(html, /id="groups-heading"/u);
  assert.equal("F8".length === 1, false);
  const app = await savedWorkbench(new Map());
  app.keydown("F8");
  assert.equal(app.focused(), "#copy-last-group-without-floor-button");
  app.clearFocus();
  app.keydown("F8", { tagName: "INPUT", isContentEditable: false });
  assert.equal(app.focused(), "");
  app.keydown("F8", { tagName: "TEXTAREA", isContentEditable: false });
  assert.equal(app.focused(), "");
  app.keydown("F8", { tagName: "SELECT", isContentEditable: false });
  assert.equal(app.focused(), "");
  app.keydown("F4");
  assert.equal(app.focused(), "#copy-first-group-at-floor-button");
  app.clearFocus();
  app.keydown("F8");
  assert.equal(app.focused(), "#copy-last-group-without-floor-button");
  app.clearFocus();
  app.keydown("F8", { tagName: "BODY", isContentEditable: false }, { defaultPrevented: true });
  assert.equal(app.focused(), "");
});

test("keyboard F9 jumps to hide-last-group-without-floor unless an input is active", async () => {
  const html = await standaloneBytes();
  assert.match(html, /<kbd>F9<\/kbd> Jump to the hide-last-group-without-floor control, or the groups heading/u);
  assert.match(html, /id="hide-last-group-without-floor"/u);
  assert.match(html, /id="hide-last-group-without-floor"[^>]*aria-keyshortcuts="F9"/u);
  assert.match(html, /id="groups-heading"/u);
  assert.equal("F9".length === 1, false);
  const app = await savedWorkbench(new Map());
  app.keydown("F9");
  assert.equal(app.focused(), "#hide-last-group-without-floor");
  assert.match(app.groups(), /Residents/u);
  app.clearFocus();
  app.keydown("F9", { tagName: "INPUT", isContentEditable: false });
  assert.equal(app.focused(), "");
  app.keydown("F9", { tagName: "TEXTAREA", isContentEditable: false });
  assert.equal(app.focused(), "");
  app.keydown("F9", { tagName: "SELECT", isContentEditable: false });
  assert.equal(app.focused(), "");
  app.keydown("Backspace");
  assert.equal(app.focused(), "#hide-last-group-below-floor");
  app.clearFocus();
  app.keydown("F4");
  assert.equal(app.focused(), "#copy-first-group-at-floor-button");
  app.clearFocus();
  app.keydown("F9");
  assert.equal(app.focused(), "#hide-last-group-without-floor");
  assert.match(app.groups(), /Residents/u);
  app.clearFocus();
  app.keydown("F9", { tagName: "BODY", isContentEditable: false }, { defaultPrevented: true });
  assert.equal(app.focused(), "");
});

test("keyboard F10 copies the first group without a support floor unless an input is active", async () => {
  const html = await standaloneBytes();
  assert.match(html, /<kbd>F10<\/kbd> Copy the first group-without-floor label as one-line Markdown/u);
  assert.match(html, /id="copy-first-group-without-floor-button"/u);
  assert.match(html, /id="copy-first-group-without-floor-button"[^>]*aria-keyshortcuts="F10"/u);
  assert.match(html, /else if \(key === "F10"\)/u);
  assert.match(html, /else if \(key === "F7"\)/u);
  assert.match(html, /const key = event\.key\.length === 1 \? event\.key\.toLowerCase\(\) : event\.key/u);
  assert.match(html, /if \(event\.defaultPrevented\) return/u);
  assert.equal("F10".length === 1, false);
  assert.equal("F11".length === 1, false);
  assert.equal("F12".length === 1, false);
  const draft = {
    title: "First without floor copy workshop",
    threshold: 50,
    groups: [
      { id: "open", name: "Open", weight: 1 },
      { id: "floored", name: "Floored", weight: 1, minSupport: 40 },
      { id: "later", name: "Later open", weight: 1 },
    ],
    clauses: [{ id: "one", title: "One", options: [
      { id: "original", label: "Keep original", original: true, changeCost: 0, support: { open: 90, floored: 90, later: 80 } },
      { id: "mid", label: "Mid option", original: false, changeCost: 1, support: { open: 80, floored: 80, later: 75 } },
      { id: "other", label: "Other option", original: false, changeCost: 2, support: { open: 70, floored: 70, later: 72 } },
    ] }],
  };
  const app = await savedWorkbench(new Map([["smallest-agreement:proposal:v1", JSON.stringify(draft)]]));
  app.keydown("F10");
  assert.equal(app.clipboardText(), app.firstGroupWithoutFloor());
  assert.match(app.clipboardText(), /First group without a support floor: Open/u);
  assert.doesNotMatch(app.clipboardText(), /Last group without a support floor/u);
  assert.doesNotMatch(app.clipboardText(), /First at-floor group/u);
  assert.doesNotMatch(app.clipboardText(), /Last at-floor group/u);
  assert.doesNotMatch(app.clipboardText(), /First below-floor group/u);
  assert.doesNotMatch(app.clipboardText(), /Last below-floor group/u);
  assert.doesNotMatch(app.clipboardText(), /Floored/u);
  assert.doesNotMatch(app.clipboardText(), /Later open/u);
  assert.match(app.message(), /not a legal identity/u);
  assert.match(app.message(), /not a legal quorum/u);
  app.clearFocus();
  app.keydown("F10", { tagName: "INPUT", isContentEditable: false });
  assert.equal(app.focused(), "");
  app.keydown("F10", { tagName: "TEXTAREA", isContentEditable: false });
  assert.equal(app.focused(), "");
  app.clearFocus();
  app.keydown("F7");
  assert.equal(app.clipboardText(), app.lastGroupWithoutFloor());
  assert.match(app.clipboardText(), /Last group without a support floor: Later open/u);
  app.clearFocus();
  app.keydown("F3");
  assert.equal(app.clipboardText(), app.firstGroupAtFloor());
  assert.match(app.clipboardText(), /First at-floor group: Floored/u);
  app.clearFocus();
  app.keydown("F10");
  assert.equal(app.clipboardText(), "First group without a support floor: Open. A floor is a number you entered, not a legal quorum. The label is not a legal identity.\n");
  app.clearFocus();
  app.keydown("F10", { tagName: "BODY", isContentEditable: false }, { defaultPrevented: true });
  assert.equal(app.clipboardText(), "First group without a support floor: Open. A floor is a number you entered, not a legal quorum. The label is not a legal identity.\n");
  const none = await savedWorkbench(new Map([["smallest-agreement:proposal:v1", JSON.stringify({
    title: "No groups without floors workshop",
    threshold: 50,
    groups: [{ id: "floored", name: "Floored", weight: 1, minSupport: 40 }],
    clauses: [{ id: "one", title: "One", options: [
      { id: "original", label: "Keep original", original: true, changeCost: 0, support: { floored: 90 } },
      { id: "mid", label: "Mid option", original: false, changeCost: 1, support: { floored: 80 } },
      { id: "other", label: "Other option", original: false, changeCost: 2, support: { floored: 70 } },
    ] }],
  })]]));
  none.keydown("F10");
  assert.equal(none.clipboardText(), "No group is without a support floor, so there is no first group-without-floor label to copy. A floor is a number you entered, not a legal quorum. The label is not a legal identity.\n");
  const blocked = await savedWorkbench(new Map([["smallest-agreement:proposal:v1", JSON.stringify(draft)]]));
  blocked.blockClipboard();
  await blocked.click("#copy-first-group-without-floor-button");
  assert.equal(blocked.focused(), "#first-group-without-floor-fallback");
  blocked.clearFocus();
  blocked.keydown("F10", { tagName: "INPUT", isContentEditable: false });
  assert.equal(blocked.focused(), "");
});

test("keyboard F11 jumps to the first group-without-floor copy control unless an input is active", async () => {
  const html = await standaloneBytes();
  assert.match(html, /<kbd>F11<\/kbd> Jump to the first group-without-floor copy control, or the groups heading/u);
  assert.match(html, /id="copy-first-group-without-floor-button"/u);
  assert.match(html, /id="groups-heading"/u);
  assert.match(html, /else if \(key === "F11"\)/u);
  assert.match(html, /else if \(key === "F8"\)/u);
  assert.equal("F11".length === 1, false);
  const app = await savedWorkbench(new Map());
  app.keydown("F11");
  assert.equal(app.focused(), "#copy-first-group-without-floor-button");
  app.clearFocus();
  app.keydown("F11", { tagName: "INPUT", isContentEditable: false });
  assert.equal(app.focused(), "");
  app.keydown("F11", { tagName: "TEXTAREA", isContentEditable: false });
  assert.equal(app.focused(), "");
  app.keydown("F11", { tagName: "SELECT", isContentEditable: false });
  assert.equal(app.focused(), "");
  app.keydown("F8");
  assert.equal(app.focused(), "#copy-last-group-without-floor-button");
  app.clearFocus();
  app.keydown("F11");
  assert.equal(app.focused(), "#copy-first-group-without-floor-button");
  app.clearFocus();
  app.keydown("F11", { tagName: "BODY", isContentEditable: false }, { defaultPrevented: true });
  assert.equal(app.focused(), "");
});

test("keyboard F12 jumps to hide-first-group-without-floor unless an input is active", async () => {
  const html = await standaloneBytes();
  assert.match(html, /<kbd>F12<\/kbd> Jump to the hide-first-group-without-floor control, or the groups heading/u);
  assert.match(html, /id="hide-first-group-without-floor"/u);
  assert.match(html, /id="hide-first-group-without-floor"[^>]*aria-keyshortcuts="F12"/u);
  assert.match(html, /id="groups-heading"/u);
  assert.match(html, /else if \(key === "F12"\)/u);
  assert.match(html, /else if \(key === "F9"\)/u);
  assert.equal("F12".length === 1, false);
  const app = await savedWorkbench(new Map());
  app.keydown("F12");
  assert.equal(app.focused(), "#hide-first-group-without-floor");
  assert.match(app.groups(), /Residents/u);
  app.clearFocus();
  app.keydown("F12", { tagName: "INPUT", isContentEditable: false });
  assert.equal(app.focused(), "");
  app.keydown("F12", { tagName: "TEXTAREA", isContentEditable: false });
  assert.equal(app.focused(), "");
  app.keydown("F12", { tagName: "SELECT", isContentEditable: false });
  assert.equal(app.focused(), "");
  app.keydown("F9");
  assert.equal(app.focused(), "#hide-last-group-without-floor");
  app.clearFocus();
  app.keydown("F11");
  assert.equal(app.focused(), "#copy-first-group-without-floor-button");
  app.clearFocus();
  app.keydown("F12");
  assert.equal(app.focused(), "#hide-first-group-without-floor");
  assert.match(app.groups(), /Residents/u);
  app.clearFocus();
  app.keydown("F12", { tagName: "BODY", isContentEditable: false }, { defaultPrevented: true });
  assert.equal(app.focused(), "");
});

test("keyboard Shift+F10 copies the groups-without-floor count unless an input is active", async () => {
  const html = await standaloneBytes();
  assert.match(html, /<kbd>Shift\+F10<\/kbd> Copy the groups-without-floor count as one-line Markdown/u);
  assert.match(html, /id="copy-groups-without-floor-count-button"/u);
  assert.match(html, /id="copy-groups-without-floor-count-button"[^>]*aria-keyshortcuts="Shift\+F10"/u);
  const builder = readFileSync(new URL("../scripts/build-standalone.mjs", import.meta.url), "utf8").replaceAll("\r\n", "\n");
  const appSource = readFileSync(new URL("../src/app.js", import.meta.url), "utf8").replaceAll("\r\n", "\n");
  assert.equal(appSource.includes('} else if (event.shiftKey && key === "F10") {\n    event.preventDefault();\n    copyGroupsWithoutFloorCount();'), true);
  assert.equal(appSource.includes('} else if (key === "F10") {\n    event.preventDefault();\n    copyFirstGroupWithoutFloor();'), true);
  assert.equal(appSource.indexOf('event.shiftKey && key === "F10"') < appSource.indexOf('} else if (key === "F10")'), true);
  assert.match(builder, /formatGroupsWithoutFloorCountMarkdown,/u);
  assert.equal("F10".length === 1, false);
  const draft = {
    title: "Without-floor count copy workshop",
    threshold: 50,
    groups: [
      { id: "open", name: "Open", weight: 1 },
      { id: "floored", name: "Floored", weight: 1, minSupport: 40 },
      { id: "later", name: "Later open", weight: 1 },
    ],
    clauses: [{ id: "one", title: "One", options: [
      { id: "original", label: "Keep original", original: true, changeCost: 0, support: { open: 90, floored: 90, later: 80 } },
      { id: "mid", label: "Mid option", original: false, changeCost: 1, support: { open: 80, floored: 80, later: 75 } },
      { id: "other", label: "Other option", original: false, changeCost: 2, support: { open: 70, floored: 70, later: 72 } },
    ] }],
  };
  const app = await savedWorkbench(new Map([["smallest-agreement:proposal:v1", JSON.stringify(draft)]]));
  app.keydown("F10", { tagName: "BODY", isContentEditable: false }, { shiftKey: true });
  assert.equal(app.clipboardText(), app.groupsWithoutFloorCount());
  assert.equal(app.clipboardText(), "Groups without a support floor: 2. A floor is a number you entered, not a legal quorum.\n");
  assert.doesNotMatch(app.clipboardText(), /First group without a support floor/u);
  assert.doesNotMatch(app.clipboardText(), /Last group without a support floor/u);
  assert.doesNotMatch(app.clipboardText(), /Open/u);
  assert.doesNotMatch(app.clipboardText(), /Later open/u);
  assert.match(app.message(), /not a legal quorum/u);
  app.clearFocus();
  app.keydown("F10", { tagName: "INPUT", isContentEditable: false }, { shiftKey: true });
  assert.equal(app.focused(), "");
  app.keydown("F10", { tagName: "TEXTAREA", isContentEditable: false }, { shiftKey: true });
  assert.equal(app.focused(), "");
  app.clearFocus();
  app.keydown("F10");
  assert.equal(app.clipboardText(), app.firstGroupWithoutFloor());
  assert.match(app.clipboardText(), /First group without a support floor: Open/u);
  app.clearFocus();
  app.keydown("F10", { tagName: "BODY", isContentEditable: false }, { shiftKey: true });
  assert.equal(app.clipboardText(), "Groups without a support floor: 2. A floor is a number you entered, not a legal quorum.\n");
  app.clearFocus();
  app.keydown("F10", { tagName: "BODY", isContentEditable: false }, { shiftKey: true, defaultPrevented: true });
  assert.equal(app.clipboardText(), "Groups without a support floor: 2. A floor is a number you entered, not a legal quorum.\n");
  const none = await savedWorkbench(new Map([["smallest-agreement:proposal:v1", JSON.stringify({
    title: "No groups without floors workshop",
    threshold: 50,
    groups: [{ id: "floored", name: "Floored", weight: 1, minSupport: 40 }],
    clauses: [{ id: "one", title: "One", options: [
      { id: "original", label: "Keep original", original: true, changeCost: 0, support: { floored: 90 } },
      { id: "mid", label: "Mid option", original: false, changeCost: 1, support: { floored: 80 } },
      { id: "other", label: "Other option", original: false, changeCost: 2, support: { floored: 70 } },
    ] }],
  })]]));
  none.keydown("F10", { tagName: "BODY", isContentEditable: false }, { shiftKey: true });
  assert.equal(none.clipboardText(), "Groups without a support floor: 0. A floor is a number you entered, not a legal quorum.\n");
  assert.match(none.message(), /honest zero/u);
  const blocked = await savedWorkbench(new Map([["smallest-agreement:proposal:v1", JSON.stringify(draft)]]));
  blocked.blockClipboard();
  await blocked.click("#copy-groups-without-floor-count-button");
  assert.equal(blocked.focused(), "#groups-without-floor-count-fallback");
  blocked.clearFocus();
  blocked.keydown("F10", { tagName: "INPUT", isContentEditable: false }, { shiftKey: true });
  assert.equal(blocked.focused(), "");
});

test("keyboard Shift+F11 jumps to the groups-without-floor count copy control unless an input is active", async () => {
  const html = await standaloneBytes();
  assert.match(html, /<kbd>Shift\+F11<\/kbd> Jump to the groups-without-floor count copy control, or the groups heading/u);
  assert.match(html, /id="copy-groups-without-floor-count-button"/u);
  assert.match(html, /id="groups-heading"/u);
  const appSource = readFileSync(new URL("../src/app.js", import.meta.url), "utf8").replaceAll("\r\n", "\n");
  assert.equal(appSource.includes('} else if (event.shiftKey && key === "F11") {\n    event.preventDefault();\n    jumpToGroupsWithoutFloorCountCopy();'), true);
  assert.equal(appSource.includes('} else if (key === "F11") {\n    event.preventDefault();\n    jumpToFirstGroupWithoutFloorCopy();'), true);
  assert.equal("F11".length === 1, false);
  const app = await savedWorkbench(new Map());
  app.keydown("F11", { tagName: "BODY", isContentEditable: false }, { shiftKey: true });
  assert.equal(app.focused(), "#copy-groups-without-floor-count-button");
  assert.equal(app.clipboardText(), "");
  app.clearFocus();
  app.keydown("F11", { tagName: "INPUT", isContentEditable: false }, { shiftKey: true });
  assert.equal(app.focused(), "");
  app.keydown("F11", { tagName: "TEXTAREA", isContentEditable: false }, { shiftKey: true });
  assert.equal(app.focused(), "");
  app.keydown("F11", { tagName: "SELECT", isContentEditable: false }, { shiftKey: true });
  assert.equal(app.focused(), "");
  app.keydown("F11");
  assert.equal(app.focused(), "#copy-first-group-without-floor-button");
  app.clearFocus();
  app.keydown("F11", { tagName: "BODY", isContentEditable: false }, { shiftKey: true });
  assert.equal(app.focused(), "#copy-groups-without-floor-count-button");
  assert.equal(app.clipboardText(), "");
  app.clearFocus();
  app.keydown("F11", { tagName: "BODY", isContentEditable: false }, { shiftKey: true, defaultPrevented: true });
  assert.equal(app.focused(), "");
});

test("keyboard Shift+F12 jumps to hide-first-group-without-floor unless an input is active", async () => {
  const html = await standaloneBytes();
  assert.match(html, /<kbd>Shift\+F12<\/kbd> Jump to the hide-first-group-without-floor control, or the groups heading/u);
  assert.match(html, /id="hide-first-group-without-floor"/u);
  assert.match(html, /id="hide-first-group-without-floor"[^>]*aria-keyshortcuts="F12"/u);
  assert.match(html, /id="groups-heading"/u);
  const appSource = readFileSync(new URL("../src/app.js", import.meta.url), "utf8").replaceAll("\r\n", "\n");
  assert.equal(appSource.includes('} else if (event.shiftKey && key === "F12") {\n    event.preventDefault();\n    jumpToHideFirstGroupWithoutFloor();'), true);
  assert.equal(appSource.includes('} else if (key === "F12") {\n    event.preventDefault();\n    jumpToHideFirstGroupWithoutFloor();'), true);
  assert.equal("F12".length === 1, false);
  const app = await savedWorkbench(new Map());
  app.keydown("F12", { tagName: "BODY", isContentEditable: false }, { shiftKey: true });
  assert.equal(app.focused(), "#hide-first-group-without-floor");
  assert.match(app.groups(), /Residents/u);
  assert.equal(app.clipboardText(), "");
  app.clearFocus();
  app.keydown("F12", { tagName: "INPUT", isContentEditable: false }, { shiftKey: true });
  assert.equal(app.focused(), "");
  app.keydown("F12", { tagName: "TEXTAREA", isContentEditable: false }, { shiftKey: true });
  assert.equal(app.focused(), "");
  app.keydown("F12", { tagName: "SELECT", isContentEditable: false }, { shiftKey: true });
  assert.equal(app.focused(), "");
  app.keydown("F12");
  assert.equal(app.focused(), "#hide-first-group-without-floor");
  app.clearFocus();
  app.keydown("F11", { tagName: "BODY", isContentEditable: false }, { shiftKey: true });
  assert.equal(app.focused(), "#copy-groups-without-floor-count-button");
  app.clearFocus();
  app.keydown("F12", { tagName: "BODY", isContentEditable: false }, { shiftKey: true });
  assert.equal(app.focused(), "#hide-first-group-without-floor");
  app.clearFocus();
  app.keydown("F12", { tagName: "BODY", isContentEditable: false }, { shiftKey: true, defaultPrevented: true });
  assert.equal(app.focused(), "");
});

test("keyboard Shift+F7 copies the first-without-floor remaining unless an input is active", async () => {
  const html = await standaloneBytes();
  const pkg = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"));
  assert.equal(pkg.version, "1.5.41");
  assert.match(html, /<kbd>Shift\+F7<\/kbd> Copy the first-without-floor remaining as one-line Markdown/u);
  assert.match(html, /id="copy-first-group-without-floor-remaining-button"/u);
  assert.match(html, /id="copy-first-group-without-floor-remaining-button"[^>]*aria-keyshortcuts="Shift\+F7"/u);
  assert.match(html, /id="copy-last-group-without-floor-remaining-button"/u);
  assert.doesNotMatch(html, /id="copy-last-group-without-floor-remaining-button"[^>]*aria-keyshortcuts/u);
  assert.match(html, /id="copy-last-group-without-floor-cost-button"/u);
  assert.doesNotMatch(html, /id="copy-last-group-without-floor-cost-button"[^>]*aria-keyshortcuts/u);
  assert.match(html, /id="copy-first-group-without-floor-cost-button"/u);
  assert.doesNotMatch(html, /id="copy-first-group-without-floor-cost-button"[^>]*aria-keyshortcuts/u);
  const builder = readFileSync(new URL("../scripts/build-standalone.mjs", import.meta.url), "utf8").replaceAll("\r\n", "\n");
  const appSource = readFileSync(new URL("../src/app.js", import.meta.url), "utf8").replaceAll("\r\n", "\n");
  assert.equal(appSource.includes('} else if (event.shiftKey && key === "F7") {\n    event.preventDefault();\n    copyFirstGroupWithoutFloorRemaining();'), true);
  assert.equal(appSource.includes('} else if (key === "F7") {\n    event.preventDefault();\n    copyLastGroupWithoutFloor();'), true);
  assert.equal(appSource.indexOf('event.shiftKey && key === "F7"') < appSource.indexOf('} else if (key === "F7")'), true);
  assert.match(builder, /formatFirstGroupWithoutFloorRemainingMarkdown,/u);
  assert.equal("F7".length === 1, false);
  const draft = {
    title: "First-without-floor remaining copy workshop",
    threshold: 50,
    groups: [
      { id: "open", name: "Open", weight: 4 },
      { id: "floored", name: "Floored", weight: 3, minSupport: 40 },
      { id: "later", name: "Later open", weight: 2 },
    ],
    clauses: [{ id: "one", title: "One", options: [
      { id: "original", label: "Keep original", original: true, changeCost: 0, support: { open: 90, floored: 90, later: 80 } },
      { id: "mid", label: "Mid option", original: false, changeCost: 1, support: { open: 80, floored: 80, later: 75 } },
      { id: "other", label: "Other option", original: false, changeCost: 2, support: { open: 70, floored: 70, later: 72 } },
    ] }],
  };
  const app = await savedWorkbench(new Map([["smallest-agreement:proposal:v1", JSON.stringify(draft)]]));
  app.keydown("F7", { tagName: "BODY", isContentEditable: false }, { shiftKey: true });
  assert.equal(app.clipboardText(), app.firstGroupWithoutFloorRemaining());
  assert.equal(app.clipboardText(), "First-without-floor remaining: 4. A floor is a number you entered, not a legal quorum.\n");
  assert.doesNotMatch(app.clipboardText(), /Last-without-floor remaining/u);
  assert.doesNotMatch(app.clipboardText(), /Last-without-floor cost/u);
  assert.doesNotMatch(app.clipboardText(), /First-without-floor cost/u);
  assert.doesNotMatch(app.clipboardText(), /Groups-without-floor remaining/u);
  assert.doesNotMatch(app.clipboardText(), /Groups without a support floor:/u);
  assert.doesNotMatch(app.clipboardText(), /First group without a support floor/u);
  assert.doesNotMatch(app.clipboardText(), /Last group without a support floor/u);
  assert.doesNotMatch(app.clipboardText(), /Remaining change-budget/u);
  assert.doesNotMatch(app.clipboardText(), /Open/u);
  assert.doesNotMatch(app.clipboardText(), /Later open/u);
  assert.match(app.message(), /not a legal quorum/u);
  app.clearFocus();
  app.keydown("F7", { tagName: "INPUT", isContentEditable: false }, { shiftKey: true });
  assert.equal(app.focused(), "");
  app.keydown("F7", { tagName: "TEXTAREA", isContentEditable: false }, { shiftKey: true });
  assert.equal(app.focused(), "");
  app.clearFocus();
  app.keydown("F7");
  assert.equal(app.clipboardText(), app.lastGroupWithoutFloor());
  assert.match(app.clipboardText(), /Last group without a support floor: Later open/u);
  app.clearFocus();
  app.keydown("F7", { tagName: "BODY", isContentEditable: false }, { shiftKey: true });
  assert.equal(app.clipboardText(), "First-without-floor remaining: 4. A floor is a number you entered, not a legal quorum.\n");
  app.clearFocus();
  app.keydown("F10", { tagName: "BODY", isContentEditable: false }, { shiftKey: true });
  assert.equal(app.clipboardText(), "Groups without a support floor: 2. A floor is a number you entered, not a legal quorum.\n");
  app.clearFocus();
  app.keydown("F7", { tagName: "BODY", isContentEditable: false }, { shiftKey: true, defaultPrevented: true });
  assert.equal(app.clipboardText(), "Groups without a support floor: 2. A floor is a number you entered, not a legal quorum.\n");
  const none = await savedWorkbench(new Map([["smallest-agreement:proposal:v1", JSON.stringify({
    title: "No groups without floors workshop",
    threshold: 50,
    groups: [{ id: "floored", name: "Floored", weight: 1, minSupport: 40 }],
    clauses: [{ id: "one", title: "One", options: [
      { id: "original", label: "Keep original", original: true, changeCost: 0, support: { floored: 90 } },
      { id: "mid", label: "Mid option", original: false, changeCost: 1, support: { floored: 80 } },
      { id: "other", label: "Other option", original: false, changeCost: 2, support: { floored: 70 } },
    ] }],
  })]]));
  none.keydown("F7", { tagName: "BODY", isContentEditable: false }, { shiftKey: true });
  assert.equal(none.clipboardText(), "First-without-floor remaining: 0. A floor is a number you entered, not a legal quorum.\n");
  assert.match(none.message(), /honest zero/u);
  const blocked = await savedWorkbench(new Map([["smallest-agreement:proposal:v1", JSON.stringify(draft)]]));
  blocked.blockClipboard();
  await blocked.click("#copy-first-group-without-floor-remaining-button");
  assert.equal(blocked.focused(), "#first-group-without-floor-remaining-fallback");
  blocked.clearFocus();
  blocked.keydown("F7", { tagName: "INPUT", isContentEditable: false }, { shiftKey: true });
  assert.equal(blocked.focused(), "");
});

test("keyboard Shift+F8 jumps to the first-without-floor remaining copy control unless an input is active", async () => {
  const html = await standaloneBytes();
  assert.match(html, /<kbd>Shift\+F8<\/kbd> Jump to the first-without-floor remaining copy control, or the groups heading/u);
  assert.match(html, /id="copy-first-group-without-floor-remaining-button"/u);
  assert.match(html, /id="copy-last-group-without-floor-remaining-button"/u);
  assert.match(html, /id="copy-last-group-without-floor-cost-button"/u);
  assert.match(html, /id="copy-first-group-without-floor-cost-button"/u);
  assert.match(html, /id="groups-heading"/u);
  const appSource = readFileSync(new URL("../src/app.js", import.meta.url), "utf8").replaceAll("\r\n", "\n");
  assert.equal(appSource.includes('} else if (event.shiftKey && key === "F8") {\n    event.preventDefault();\n    jumpToFirstGroupWithoutFloorRemainingCopy();'), true);
  assert.equal(appSource.includes('} else if (key === "F8") {\n    event.preventDefault();\n    jumpToLastGroupWithoutFloorCopy();'), true);
  assert.equal(appSource.indexOf('event.shiftKey && key === "F8"') < appSource.indexOf('} else if (key === "F8")'), true);
  assert.equal("F8".length === 1, false);
  const app = await savedWorkbench(new Map());
  app.keydown("F8", { tagName: "BODY", isContentEditable: false }, { shiftKey: true });
  assert.equal(app.focused(), "#copy-first-group-without-floor-remaining-button");
  assert.equal(app.clipboardText(), "");
  app.clearFocus();
  app.keydown("F8", { tagName: "INPUT", isContentEditable: false }, { shiftKey: true });
  assert.equal(app.focused(), "");
  app.keydown("F8", { tagName: "TEXTAREA", isContentEditable: false }, { shiftKey: true });
  assert.equal(app.focused(), "");
  app.keydown("F8", { tagName: "SELECT", isContentEditable: false }, { shiftKey: true });
  assert.equal(app.focused(), "");
  app.keydown("F8");
  assert.equal(app.focused(), "#copy-last-group-without-floor-button");
  app.clearFocus();
  app.keydown("F8", { tagName: "BODY", isContentEditable: false }, { shiftKey: true });
  assert.equal(app.focused(), "#copy-first-group-without-floor-remaining-button");
  assert.equal(app.clipboardText(), "");
  app.clearFocus();
  app.keydown("F8", { tagName: "BODY", isContentEditable: false }, { shiftKey: true, defaultPrevented: true });
  assert.equal(app.focused(), "");
});

test("keyboard Shift+F9 jumps to hide-last-group-without-floor unless an input is active", async () => {
  const html = await standaloneBytes();
  assert.match(html, /<kbd>Shift\+F9<\/kbd> Jump to the hide-last-group-without-floor control, or the groups heading/u);
  assert.match(html, /id="hide-last-group-without-floor"/u);
  assert.match(html, /id="hide-last-group-without-floor"[^>]*aria-keyshortcuts="F9"/u);
  assert.match(html, /id="hide-first-group-without-floor"/u);
  assert.match(html, /id="hide-first-group-without-floor"[^>]*aria-keyshortcuts="F12"/u);
  assert.match(html, /id="groups-heading"/u);
  const appSource = readFileSync(new URL("../src/app.js", import.meta.url), "utf8").replaceAll("\r\n", "\n");
  assert.equal(appSource.includes('} else if (event.shiftKey && key === "F9") {\n    event.preventDefault();\n    jumpToHideLastGroupWithoutFloor();'), true);
  assert.equal(appSource.includes('} else if (key === "F9") {\n    event.preventDefault();\n    jumpToHideLastGroupWithoutFloor();'), true);
  assert.equal(appSource.indexOf('event.shiftKey && key === "F9"') < appSource.indexOf('} else if (key === "F9")'), true);
  assert.equal("F9".length === 1, false);
  const app = await savedWorkbench(new Map());
  app.keydown("F9", { tagName: "BODY", isContentEditable: false }, { shiftKey: true });
  assert.equal(app.focused(), "#hide-last-group-without-floor");
  assert.match(app.groups(), /Residents/u);
  assert.equal(app.clipboardText(), "");
  app.clearFocus();
  app.keydown("F9", { tagName: "INPUT", isContentEditable: false }, { shiftKey: true });
  assert.equal(app.focused(), "");
  app.keydown("F9", { tagName: "TEXTAREA", isContentEditable: false }, { shiftKey: true });
  assert.equal(app.focused(), "");
  app.keydown("F9", { tagName: "SELECT", isContentEditable: false }, { shiftKey: true });
  assert.equal(app.focused(), "");
  app.keydown("F9");
  assert.equal(app.focused(), "#hide-last-group-without-floor");
  app.clearFocus();
  app.keydown("F8", { tagName: "BODY", isContentEditable: false }, { shiftKey: true });
  assert.equal(app.focused(), "#copy-first-group-without-floor-remaining-button");
  app.clearFocus();
  app.keydown("F9", { tagName: "BODY", isContentEditable: false }, { shiftKey: true });
  assert.equal(app.focused(), "#hide-last-group-without-floor");
  app.clearFocus();
  app.keydown("F12", { tagName: "BODY", isContentEditable: false }, { shiftKey: true });
  assert.equal(app.focused(), "#hide-first-group-without-floor");
  app.clearFocus();
  app.keydown("F12");
  assert.equal(app.focused(), "#hide-first-group-without-floor");
  app.clearFocus();
  app.keydown("F9", { tagName: "BODY", isContentEditable: false }, { shiftKey: true, defaultPrevented: true });
  assert.equal(app.focused(), "");
});

test("keyboard comma copies the recommended package option count unless an input is active", async () => {
  const html = await standaloneBytes();
  assert.match(html, /<kbd>,<\/kbd> Copy the recommended package option count as one-line Markdown/u);
  const app = await savedWorkbench(new Map());
  app.keydown(",");
  assert.equal(app.clipboardText(), "Recommended package option count: 3. This is a decision aid, not a recorded vote.\n");
  assert.doesNotMatch(app.clipboardText(), /^# Recommended package/u);
  assert.match(app.message(), /not a recorded vote/u);
  app.clearFocus();
  app.keydown(",", { tagName: "INPUT", isContentEditable: false });
  assert.equal(app.focused(), "");
  app.keydown(",", { tagName: "TEXTAREA", isContentEditable: false });
  assert.equal(app.focused(), "");
  const shifted = await savedWorkbench(new Map());
  shifted.keydown("<");
  assert.equal(shifted.clipboardText(), "");
  const blocked = await savedWorkbench(new Map());
  blocked.blockClipboard();
  await blocked.click("#copy-option-count-button");
  assert.equal(blocked.focused(), "#option-count-fallback");
  blocked.clearFocus();
  blocked.keydown(",", { tagName: "INPUT", isContentEditable: false });
  assert.equal(blocked.focused(), "");
});

test("keyboard z jumps to the numeric approval threshold unless an input is active", async () => {
  const html = await standaloneBytes();
  assert.match(html, /<kbd>z<\/kbd> Jump to the numeric approval threshold field, or the method heading/u);
  assert.match(html, /id="threshold-number"/u);
  assert.match(html, /id="method-heading"/u);
  const app = await savedWorkbench(new Map());
  app.keydown("z");
  assert.equal(app.focused(), "#threshold-number");
  app.clearFocus();
  app.keydown("z", { tagName: "INPUT", isContentEditable: false });
  assert.equal(app.focused(), "");
  app.keydown("z", { tagName: "TEXTAREA", isContentEditable: false });
  assert.equal(app.focused(), "");
  app.keydown("z", { tagName: "SELECT", isContentEditable: false });
  assert.equal(app.focused(), "");
  app.keydown("Z");
  assert.equal(app.focused(), "#threshold-number");
});

test("keyboard x focuses JSON export unless an input is active", async () => {
  const html = await standaloneBytes();
  assert.match(html, /<kbd>x<\/kbd> Focus the JSON export control/u);
  assert.match(html, /id="export-button"/u);
  const app = await savedWorkbench(new Map());
  app.keydown("x");
  assert.equal(app.focused(), "#export-button");
  app.clearFocus();
  app.keydown("x", { tagName: "INPUT", isContentEditable: false });
  assert.equal(app.focused(), "");
  app.keydown("x", { tagName: "TEXTAREA", isContentEditable: false });
  assert.equal(app.focused(), "");
  app.keydown("x", { tagName: "SELECT", isContentEditable: false });
  assert.equal(app.focused(), "");
  app.keydown("X");
  assert.equal(app.focused(), "#export-button");
});

test("side-by-side pins original, solver, and custom package columns", async () => {
  const app = await savedWorkbench(new Map());
  assert.match(app.sideBySide(), /Current original/u);
  assert.match(app.sideBySide(), /Solver recommendation/u);
  assert.match(app.sideBySide(), /Custom package/u);
  assert.match(app.sideBySide(), /Custom approval/u);
  assert.match(app.sideBySide(), /Close at 20:00 every day/u);
  assert.match(app.sideBySide(), /Lock recommended package/u);
  app.changeManual("hours", "hours-pilot");
  assert.match(app.sideBySide(), /Trial a 21:00 Friday close for three months/u);
  assert.match(app.sideBySide(), /\(custom\)/u);
});

test("locking a package applies every clause lock in one undoable step", async () => {
  const storage = new Map();
  const app = await savedWorkbench(storage);
  app.setTitle("Workshop draft for package locks");
  const before = JSON.parse(storage.get("smallest-agreement:proposal:v1"));
  assert.equal(before.clauses.every((clause) => clause.lockedOptionId === undefined), true);
  const optionIds = before.clauses.map((clause) => clause.options[1].id);
  app.clickAction("lock-package", { optionIds: optionIds.join("|") });
  const after = JSON.parse(storage.get("smallest-agreement:proposal:v1"));
  assert.deepEqual(after.clauses.map((clause) => clause.lockedOptionId), optionIds);
  assert.match(app.message(), /Locked every clause to that package/u);
  app.click("#undo-button");
  const restored = JSON.parse(storage.get("smallest-agreement:proposal:v1"));
  assert.equal(restored.clauses.every((clause) => clause.lockedOptionId === undefined), true);
  app.clickAction("lock-package", { optionIds: "missing" });
  assert.match(app.message(), /Could not lock that package/u);
  assert.equal(JSON.parse(storage.get("smallest-agreement:proposal:v1")).clauses.every((clause) => clause.lockedOptionId === undefined), true);
});

test("clearing all locks is one undoable draft edit", async () => {
  const storage = new Map();
  const app = await savedWorkbench(storage);
  app.setTitle("Workshop draft for clearing locks");
  const optionIds = JSON.parse(storage.get("smallest-agreement:proposal:v1")).clauses.map((clause) => clause.options[1].id);
  app.clickAction("lock-package", { optionIds: optionIds.join("|") });
  assert.equal(JSON.parse(storage.get("smallest-agreement:proposal:v1")).clauses.every((clause) => clause.lockedOptionId !== undefined), true);
  assert.equal(app.disabled("#clear-locks"), false);
  app.clickAction("clear-locks");
  const cleared = JSON.parse(storage.get("smallest-agreement:proposal:v1"));
  assert.equal(cleared.clauses.every((clause) => clause.lockedOptionId === undefined), true);
  assert.match(app.message(), /Cleared every clause lock/u);
  app.click("#undo-button");
  const restored = JSON.parse(storage.get("smallest-agreement:proposal:v1"));
  assert.deepEqual(restored.clauses.map((clause) => clause.lockedOptionId), optionIds);
});

test("clause cards can lock or unlock one option without applying a whole package", async () => {
  const storage = new Map();
  const app = await savedWorkbench(storage);
  app.setTitle("Workshop draft for clause lock toggles");
  app.clickAction("toggle-clause-lock", { clauseId: "hours", optionId: "hours-pilot" });
  assert.equal(JSON.parse(storage.get("smallest-agreement:proposal:v1")).clauses.find((clause) => clause.id === "hours").lockedOptionId, "hours-pilot");
  assert.match(app.clauses(), /Unlock option/u);
  assert.match(app.message(), /Locked that clause to the selected option/u);
  app.clickAction("toggle-clause-lock", { clauseId: "hours", optionId: "hours-pilot" });
  assert.equal(JSON.parse(storage.get("smallest-agreement:proposal:v1")).clauses.find((clause) => clause.id === "hours").lockedOptionId, undefined);
  assert.match(app.message(), /Unlocked that clause/u);
  app.click("#undo-button");
  assert.equal(JSON.parse(storage.get("smallest-agreement:proposal:v1")).clauses.find((clause) => clause.id === "hours").lockedOptionId, "hours-pilot");
});

test("near-miss explorer can sort closest misses by cost or approval gap", async () => {
  const key = "smallest-agreement:proposal:v1";
  const draft = {
    title: "Near miss sort workshop",
    threshold: 90,
    groups: [{ id: "g", name: "Group", weight: 1 }],
    clauses: [{ id: "one", title: "One", options: [
      { id: "original", label: "Keep original", original: true, changeCost: 0, support: { g: 40 } },
      { id: "cheap", label: "Cheap miss", original: false, changeCost: 1, support: { g: 50 } },
      { id: "near", label: "Near miss", original: false, changeCost: 5, support: { g: 80 } },
    ] }],
  };
  const app = await savedWorkbench(new Map([[key, JSON.stringify(draft)]]));
  const byGap = app.nearMisses();
  assert.match(byGap, /Closest misses/u);
  assert.ok(byGap.indexOf("Near miss") < byGap.indexOf("Cheap miss"));
  app.sortNearMisses("change_cost");
  const byCost = app.nearMisses();
  assert.ok(byCost.indexOf("Cheap miss") < byCost.indexOf("Near miss"));
  app.sortNearMisses("approval_gap");
  assert.ok(app.nearMisses().indexOf("Near miss") < app.nearMisses().indexOf("Cheap miss"));
});

test("veto-blocking groups are highlighted as a numerical constraint, not a legitimacy claim", async () => {
  const key = "smallest-agreement:proposal:v1";
  const draft = {
    title: "Veto block workshop",
    threshold: 80,
    groups: [
      { id: "majority", name: "Majority", weight: 9 },
      { id: "minority", name: "Minority", weight: 1, veto: true },
    ],
    clauses: [{ id: "one", title: "One", options: [
      { id: "original", label: "Keep original", original: true, changeCost: 0, support: { majority: 90, minority: 10 } },
      { id: "mid", label: "Mid option", original: false, changeCost: 1, support: { majority: 88, minority: 20 } },
      { id: "other", label: "Other option", original: false, changeCost: 2, support: { majority: 85, minority: 30 } },
    ] }],
  };
  const app = await savedWorkbench(new Map([[key, JSON.stringify(draft)]]));
  assert.match(app.groups(), /group-row veto-blocking/u);
  assert.match(app.groups(), /numerical constraint, not a legal right/u);
  assert.doesNotMatch(app.groups(), /legitimacy/u);
  assert.match(app.coalition(), /veto-blocking/u);
  assert.match(app.constraints(), /Highlighted veto rows failed/u);
  assert.match(app.ballot(), /Veto not met on the inspected package for: Minority/u);
});

test("copy recommended package writes Markdown to the clipboard", async () => {
  const html = await standaloneBytes();
  assert.match(html, /id="copy-package-button"/u);
  assert.match(html, /id="copy-group-support-button"/u);
  assert.match(html, /Copy group support/u);
  assert.match(html, /id="package-markdown-fallback"/u);
  const app = await savedWorkbench(new Map());
  assert.match(app.packageMarkdown(), /^# Recommended package\n/u);
  assert.match(app.packageMarkdown(), /Park access hours/u);
  assert.match(app.packageMarkdown(), /not a recorded vote or a claim of legitimacy/u);
  await app.click("#copy-package-button");
  assert.equal(app.clipboardText(), app.packageMarkdown());
  assert.match(app.clipboardText(), /^# Recommended package\n/u);
  assert.match(app.clipboardText(), /Neighbourhood Plan: the shared green/u);
  assert.match(app.clipboardText(), /not a recorded vote or a claim of legitimacy/u);
  assert.match(app.message(), /Recommended package copied as Markdown/u);
  assert.match(app.message(), /not a recorded vote/u);
  const blocked = await savedWorkbench(new Map());
  blocked.blockClipboard();
  await blocked.click("#copy-package-button");
  assert.equal(blocked.clipboardText(), "");
  assert.equal(blocked.focused(), "#package-markdown-fallback");
  assert.match(blocked.packageMarkdown(), /Park access hours/u);
  assert.match(blocked.message(), /Clipboard is blocked/u);
  assert.match(blocked.message(), /not a recorded vote/u);
});

test("copy group support writes a Markdown table and is not a legal right", async () => {
  const html = await standaloneBytes();
  assert.match(html, /id="copy-group-support-button"/u);
  assert.match(html, /id="group-support-fallback"/u);
  assert.match(html, /not a legal right/u);
  const app = await savedWorkbench(new Map());
  assert.match(app.groupSupport(), /^# Group support\n/u);
  assert.match(app.groupSupport(), /\| Group \| Weight \| Average support \|/u);
  assert.match(app.groupSupport(), /Residents/u);
  assert.match(app.groupSupport(), /not a legal right/u);
  await app.click("#copy-group-support-button");
  assert.equal(app.clipboardText(), app.groupSupport());
  assert.match(app.message(), /not a legal right/u);
  const blocked = await savedWorkbench(new Map());
  blocked.blockClipboard();
  await blocked.click("#copy-group-support-button");
  assert.equal(blocked.clipboardText(), "");
  assert.equal(blocked.focused(), "#group-support-fallback");
  assert.match(blocked.groupSupport(), /\| Group \| Weight \| Average support \|/u);
  assert.match(blocked.message(), /Clipboard is blocked/u);
  assert.match(blocked.message(), /not a legal right/u);
});

test("copy original versus recommended writes compact Markdown of labels and costs with a clipboard fallback", async () => {
  const html = await standaloneBytes();
  assert.match(html, /id="copy-original-versus-recommended-button"/u);
  assert.match(html, /Copy original versus recommended/u);
  assert.match(html, /id="original-versus-recommended-fallback"/u);
  assert.match(html, /option labels and costs only/u);
  assert.match(html, /not a recorded vote/u);
  const app = await savedWorkbench(new Map());
  assert.match(app.originalVersusRecommended(), /^# Original versus recommended package/u);
  assert.match(app.originalVersusRecommended(), /option labels and costs only/u);
  assert.match(app.originalVersusRecommended(), /not a recorded vote/u);
  assert.match(app.originalVersusRecommended(), /\(cost 0\.0\) versus /u);
  assert.doesNotMatch(app.originalVersusRecommended(), /^# Recommended package/u);
  await app.click("#copy-original-versus-recommended-button");
  assert.equal(app.clipboardText(), app.originalVersusRecommended());
  assert.match(app.message(), /not a recorded vote/u);
  const blocked = await savedWorkbench(new Map());
  blocked.blockClipboard();
  await blocked.click("#copy-original-versus-recommended-button");
  assert.equal(blocked.clipboardText(), "");
  assert.equal(blocked.focused(), "#original-versus-recommended-fallback");
  assert.match(blocked.originalVersusRecommended(), /^# Original versus recommended package/u);
  assert.match(blocked.message(), /Clipboard is blocked/u);
  assert.match(blocked.message(), /not a recorded vote/u);
  const draft = {
    title: "No recommendation versus workshop",
    threshold: 95,
    maxChangeCost: 0,
    groups: [{ id: "g", name: "Group", weight: 1 }],
    clauses: [{ id: "one", title: "One", options: [
      { id: "original", label: "Keep original", original: true, changeCost: 0, support: { g: 10 } },
      { id: "mid", label: "Mid option", original: false, changeCost: 1, support: { g: 90 } },
      { id: "other", label: "Other option", original: false, changeCost: 2, support: { g: 90 } },
    ] }],
  };
  const missing = await savedWorkbench(new Map([["smallest-agreement:proposal:v1", JSON.stringify(draft)]]));
  assert.match(missing.originalVersusRecommended(), /No recommended package is available/u);
  await missing.click("#copy-original-versus-recommended-button");
  assert.match(missing.clipboardText(), /No recommended package is available/u);
  assert.match(missing.message(), /not a recorded vote/u);
});

test("copy remaining budget writes one-line Markdown distinct from package and group-support copy", async () => {
  const html = await standaloneBytes();
  assert.match(html, /id="copy-remaining-budget-button"/u);
  assert.match(html, /Copy remaining budget/u);
  assert.match(html, /id="remaining-budget-fallback"/u);
  assert.match(html, /not a legal appropriation/u);
  const app = await savedWorkbench(new Map());
  assert.match(app.remainingBudget(), /leftover change-budget is unlimited/u);
  assert.match(app.remainingBudget(), /not a legal appropriation/u);
  assert.doesNotMatch(app.remainingBudget(), /^# Recommended package/u);
  assert.doesNotMatch(app.remainingBudget(), /\| Group \| Weight \| Average support \|/u);
  await app.click("#copy-remaining-budget-button");
  assert.equal(app.clipboardText(), app.remainingBudget());
  assert.match(app.message(), /not a legal appropriation/u);
  const blocked = await savedWorkbench(new Map());
  blocked.blockClipboard();
  await blocked.click("#copy-remaining-budget-button");
  assert.equal(blocked.clipboardText(), "");
  assert.equal(blocked.focused(), "#remaining-budget-fallback");
  assert.match(blocked.remainingBudget(), /leftover change-budget is unlimited/u);
  assert.match(blocked.message(), /Clipboard is blocked/u);
  assert.match(blocked.message(), /not a legal appropriation/u);
  const draft = {
    title: "Exhausted remaining budget workshop",
    threshold: 70,
    maxChangeCost: 2,
    groups: [{ id: "g", name: "Group", weight: 1 }],
    clauses: [{ id: "one", title: "One", options: [
      { id: "original", label: "Keep original", original: true, changeCost: 0, support: { g: 40 } },
      { id: "alt", label: "Alt", original: false, changeCost: 2, support: { g: 90 } },
      { id: "other", label: "Other", original: false, changeCost: 8, support: { g: 20 } },
    ] }],
  };
  const spent = await savedWorkbench(new Map([["smallest-agreement:proposal:v1", JSON.stringify(draft)]]));
  assert.match(spent.remainingBudget(), /Remaining change-budget is exhausted \(0\.0 leftover\)/u);
  await spent.click("#copy-remaining-budget-button");
  assert.match(spent.clipboardText(), /Remaining change-budget is exhausted \(0\.0 leftover\)/u);
  assert.match(spent.message(), /not a legal appropriation/u);
});

test("copy recommended package option count writes one-line Markdown with a clipboard fallback", async () => {
  const html = await standaloneBytes();
  assert.match(html, /id="copy-option-count-button"/u);
  assert.match(html, /Copy option count/u);
  assert.match(html, /id="option-count-fallback"/u);
  assert.match(html, /not a recorded vote/u);
  const app = await savedWorkbench(new Map());
  assert.equal(app.optionCount(), "Recommended package option count: 3. This is a decision aid, not a recorded vote.\n");
  assert.doesNotMatch(app.optionCount(), /Close at 20:00/u);
  assert.doesNotMatch(app.optionCount(), /^# Recommended package/u);
  await app.click("#copy-option-count-button");
  assert.equal(app.clipboardText(), app.optionCount());
  assert.match(app.message(), /not a recorded vote/u);
  const blocked = await savedWorkbench(new Map());
  blocked.blockClipboard();
  await blocked.click("#copy-option-count-button");
  assert.equal(blocked.clipboardText(), "");
  assert.equal(blocked.focused(), "#option-count-fallback");
  assert.match(blocked.optionCount(), /Recommended package option count: 3/u);
  assert.match(blocked.message(), /Clipboard is blocked/u);
  assert.match(blocked.message(), /not a recorded vote/u);
  const draft = {
    title: "No recommendation option count workshop",
    threshold: 95,
    maxChangeCost: 0,
    groups: [{ id: "g", name: "Group", weight: 1 }],
    clauses: [{ id: "one", title: "One", options: [
      { id: "original", label: "Keep original", original: true, changeCost: 0, support: { g: 10 } },
      { id: "alt", label: "Alt", original: false, changeCost: 1, support: { g: 90 } },
      { id: "other", label: "Other", original: false, changeCost: 2, support: { g: 90 } },
    ] }],
  };
  const missing = await savedWorkbench(new Map([["smallest-agreement:proposal:v1", JSON.stringify(draft)]]));
  assert.match(missing.optionCount(), /No recommended package is available/u);
  await missing.click("#copy-option-count-button");
  assert.match(missing.clipboardText(), /No recommended package is available/u);
  assert.match(missing.message(), /not a recorded vote/u);
});

test("copy approval threshold writes one-line Markdown with a clipboard fallback", async () => {
  const html = await standaloneBytes();
  assert.match(html, /id="copy-approval-threshold-button"/u);
  assert.match(html, /Copy approval threshold/u);
  assert.match(html, /id="approval-threshold-fallback"/u);
  assert.match(html, /not a legal quorum/u);
  const app = await savedWorkbench(new Map());
  assert.equal(app.approvalThreshold(), "Approval threshold: 68.0%. This is a number you entered, not a legal quorum.\n");
  assert.doesNotMatch(app.approvalThreshold(), /leftover change-budget/u);
  assert.doesNotMatch(app.approvalThreshold(), /^# Recommended package/u);
  await app.click("#copy-approval-threshold-button");
  assert.equal(app.clipboardText(), app.approvalThreshold());
  assert.match(app.message(), /not a legal quorum/u);
  const blocked = await savedWorkbench(new Map());
  blocked.blockClipboard();
  await blocked.click("#copy-approval-threshold-button");
  assert.equal(blocked.clipboardText(), "");
  assert.equal(blocked.focused(), "#approval-threshold-fallback");
  assert.match(blocked.approvalThreshold(), /Approval threshold: 68\.0%/u);
  assert.match(blocked.message(), /Clipboard is blocked/u);
  assert.match(blocked.message(), /not a legal quorum/u);
  const draft = {
    title: "Exact threshold workshop",
    threshold: 70,
    groups: [{ id: "g", name: "Group", weight: 1 }],
    clauses: [{ id: "one", title: "One", options: [
      { id: "original", label: "Keep original", original: true, changeCost: 0, support: { g: 90 } },
      { id: "alt", label: "Alt", original: false, changeCost: 2, support: { g: 40 } },
      { id: "other", label: "Other", original: false, changeCost: 8, support: { g: 20 } },
    ] }],
  };
  const exact = await savedWorkbench(new Map([["smallest-agreement:proposal:v1", JSON.stringify(draft)]]));
  assert.equal(exact.approvalThreshold(), "Approval threshold: 70.0%. This is a number you entered, not a legal quorum.\n");
  await exact.click("#copy-approval-threshold-button");
  assert.equal(exact.clipboardText(), "Approval threshold: 70.0%. This is a number you entered, not a legal quorum.\n");
  assert.match(exact.message(), /not a legal quorum/u);
});

test("copy package table writes a Markdown comparison and keeps a textarea fallback", async () => {
  const html = await standaloneBytes();
  assert.match(html, /id="copy-packages-table-button"/u);
  assert.match(html, /id="package-table-fallback"/u);
  assert.match(html, /not a recorded vote/u);
  const app = await savedWorkbench(new Map());
  assert.match(app.packageTable(), /^# Original, recommended, and pinned packages\n/u);
  assert.match(app.packageTable(), /\| Clause \| Original \| Recommended \| Pinned \|/u);
  assert.match(app.packageTable(), /Park access hours/u);
  await app.click("#copy-packages-table-button");
  assert.equal(app.clipboardText(), app.packageTable());
  assert.match(app.clipboardText(), /not a recorded vote or a claim of legitimacy/u);
  assert.match(app.message(), /Package table copied as Markdown/u);
  const blocked = await savedWorkbench(new Map());
  blocked.blockClipboard();
  await blocked.click("#copy-packages-table-button");
  assert.equal(blocked.clipboardText(), "");
  assert.equal(blocked.focused(), "#package-table-fallback");
  assert.match(blocked.packageTable(), /\| Clause \| Original \| Recommended \| Pinned \|/u);
  assert.match(blocked.message(), /Clipboard is blocked/u);
  assert.match(blocked.message(), /not a recorded vote/u);
});

test("copy current lock count writes one-line Markdown with a clipboard fallback", async () => {
  const html = await standaloneBytes();
  assert.match(html, /id="copy-lock-count-button"/u);
  assert.match(html, /Copy lock count/u);
  assert.match(html, /id="lock-count-fallback"/u);
  assert.match(html, /not a legal hold/u);
  const app = await savedWorkbench(new Map());
  assert.equal(app.lockCount(), "Current lock count: 0. Locks are draft choices, not a legal hold.\n");
  assert.doesNotMatch(app.lockCount(), /# Current clause locks/u);
  assert.doesNotMatch(app.lockCount(), /Unlocked/u);
  await app.click("#copy-lock-count-button");
  assert.equal(app.clipboardText(), app.lockCount());
  assert.match(app.message(), /not a legal hold/u);
  const blocked = await savedWorkbench(new Map());
  blocked.blockClipboard();
  await blocked.click("#copy-lock-count-button");
  assert.equal(blocked.clipboardText(), "");
  assert.equal(blocked.focused(), "#lock-count-fallback");
  assert.match(blocked.lockCount(), /Current lock count: 0/u);
  assert.match(blocked.message(), /Clipboard is blocked/u);
  assert.match(blocked.message(), /not a legal hold/u);
  const locked = await savedWorkbench(new Map());
  locked.clickAction("toggle-clause-lock", { clauseId: "hours", optionId: "hours-pilot" });
  assert.equal(locked.lockCount(), "Current lock count: 1. Locks are draft choices, not a legal hold.\n");
  await locked.click("#copy-lock-count-button");
  assert.equal(locked.clipboardText(), "Current lock count: 1. Locks are draft choices, not a legal hold.\n");
  assert.match(locked.message(), /not a legal hold/u);
});

test("copy first locked option writes one-line Markdown with a clipboard fallback", async () => {
  const html = await standaloneBytes();
  assert.match(html, /id="copy-first-locked-option-button"/u);
  assert.match(html, /Copy first locked option/u);
  assert.match(html, /id="first-locked-option-fallback"/u);
  assert.match(html, /not a legal hold/u);
  const app = await savedWorkbench(new Map());
  assert.equal(app.firstLockedOption(), "No clause is locked, so there is no first locked option label to copy. Locks are draft choices, not a legal hold.\n");
  assert.doesNotMatch(app.firstLockedOption(), /Current lock count/u);
  assert.doesNotMatch(app.firstLockedOption(), /# Current clause locks/u);
  await app.click("#copy-first-locked-option-button");
  assert.equal(app.clipboardText(), app.firstLockedOption());
  assert.match(app.message(), /honest empty/u);
  assert.match(app.message(), /not a legal hold/u);
  const blocked = await savedWorkbench(new Map());
  blocked.blockClipboard();
  await blocked.click("#copy-first-locked-option-button");
  assert.equal(blocked.clipboardText(), "");
  assert.equal(blocked.focused(), "#first-locked-option-fallback");
  assert.match(blocked.firstLockedOption(), /No clause is locked/u);
  assert.match(blocked.message(), /Clipboard is blocked/u);
  assert.match(blocked.message(), /not a legal hold/u);
  const locked = await savedWorkbench(new Map());
  locked.clickAction("toggle-clause-lock", { clauseId: "hours", optionId: "hours-pilot" });
  assert.equal(locked.firstLockedOption(), "First locked clause option: Trial a 21:00 Friday close for three months. Locks are draft choices, not a legal hold.\n");
  await locked.click("#copy-first-locked-option-button");
  assert.equal(locked.clipboardText(), "First locked clause option: Trial a 21:00 Friday close for three months. Locks are draft choices, not a legal hold.\n");
  assert.doesNotMatch(locked.clipboardText(), /Current lock count/u);
  assert.doesNotMatch(locked.clipboardText(), /# Current clause locks/u);
  assert.match(locked.message(), /not a legal hold/u);
});

test("copy below-floor group count writes one-line Markdown with a clipboard fallback", async () => {
  const html = await standaloneBytes();
  assert.match(html, /id="copy-below-floor-count-button"/u);
  assert.match(html, /Copy below-floor group count/u);
  assert.match(html, /id="below-floor-count-fallback"/u);
  assert.match(html, /not a legal quorum/u);
  const app = await savedWorkbench(new Map());
  assert.equal(app.belowFloorCount(), "Groups below their support floor: 0. A floor is a number you entered, not a legal quorum.\n");
  assert.doesNotMatch(app.belowFloorCount(), /Current lock count/u);
  assert.doesNotMatch(app.belowFloorCount(), /Remaining change-budget/u);
  await app.click("#copy-below-floor-count-button");
  assert.equal(app.clipboardText(), app.belowFloorCount());
  assert.match(app.message(), /honest zero/u);
  assert.match(app.message(), /not a legal quorum/u);
  const blocked = await savedWorkbench(new Map());
  blocked.blockClipboard();
  await blocked.click("#copy-below-floor-count-button");
  assert.equal(blocked.clipboardText(), "");
  assert.equal(blocked.focused(), "#below-floor-count-fallback");
  assert.match(blocked.belowFloorCount(), /Groups below their support floor: 0/u);
  assert.match(blocked.message(), /Clipboard is blocked/u);
  assert.match(blocked.message(), /not a legal quorum/u);
  const draft = {
    title: "Below-floor count workshop",
    threshold: 70,
    groups: [
      { id: "floored", name: "Floored", weight: 1, minSupport: 80 },
      { id: "open", name: "Open", weight: 1 },
    ],
    clauses: [{ id: "one", title: "One", options: [
      { id: "original", label: "Keep original", original: true, changeCost: 0, support: { floored: 50, open: 90 } },
      { id: "mid", label: "Mid option", original: false, changeCost: 1, support: { floored: 50, open: 40 } },
      { id: "other", label: "Other option", original: false, changeCost: 2, support: { floored: 50, open: 80 } },
    ] }],
  };
  const counted = await savedWorkbench(new Map([["smallest-agreement:proposal:v1", JSON.stringify(draft)]]));
  assert.equal(counted.belowFloorCount(), "Groups below their support floor: 1. A floor is a number you entered, not a legal quorum.\n");
  await counted.click("#copy-below-floor-count-button");
  assert.equal(counted.clipboardText(), "Groups below their support floor: 1. A floor is a number you entered, not a legal quorum.\n");
  assert.doesNotMatch(counted.clipboardText(), /Current lock count/u);
  assert.doesNotMatch(counted.clipboardText(), /Remaining change-budget/u);
  assert.match(counted.message(), /not a legal quorum/u);
});

test("copy first below-floor group writes one-line Markdown with a clipboard fallback", async () => {
  const html = await standaloneBytes();
  assert.match(html, /id="copy-first-below-floor-group-button"/u);
  assert.match(html, /Copy first below-floor group/u);
  assert.match(html, /id="first-below-floor-group-fallback"/u);
  assert.match(html, /not a legal identity/u);
  const app = await savedWorkbench(new Map());
  assert.equal(app.firstBelowFloorGroup(), "No group is below its support floor, so there is no first below-floor group label to copy. A floor is a number you entered, not a legal quorum. The label is not a legal identity.\n");
  assert.doesNotMatch(app.firstBelowFloorGroup(), /Groups below their support floor/u);
  assert.doesNotMatch(app.firstBelowFloorGroup(), /Current lock count/u);
  assert.doesNotMatch(app.firstBelowFloorGroup(), /First locked clause option/u);
  await app.click("#copy-first-below-floor-group-button");
  assert.equal(app.clipboardText(), app.firstBelowFloorGroup());
  assert.match(app.message(), /honest empty/u);
  assert.match(app.message(), /not a legal quorum/u);
  assert.match(app.message(), /not a legal identity/u);
  const blocked = await savedWorkbench(new Map());
  blocked.blockClipboard();
  await blocked.click("#copy-first-below-floor-group-button");
  assert.equal(blocked.clipboardText(), "");
  assert.equal(blocked.focused(), "#first-below-floor-group-fallback");
  assert.match(blocked.firstBelowFloorGroup(), /No group is below its support floor/u);
  assert.match(blocked.message(), /Clipboard is blocked/u);
  assert.match(blocked.message(), /not a legal identity/u);
  const draft = {
    title: "First below-floor group workshop",
    threshold: 70,
    groups: [
      { id: "floored", name: "Floored", weight: 1, minSupport: 80 },
      { id: "open", name: "Open", weight: 1 },
    ],
    clauses: [{ id: "one", title: "One", options: [
      { id: "original", label: "Keep original", original: true, changeCost: 0, support: { floored: 50, open: 90 } },
      { id: "mid", label: "Mid option", original: false, changeCost: 1, support: { floored: 50, open: 40 } },
      { id: "other", label: "Other option", original: false, changeCost: 2, support: { floored: 50, open: 80 } },
    ] }],
  };
  const labelled = await savedWorkbench(new Map([["smallest-agreement:proposal:v1", JSON.stringify(draft)]]));
  assert.equal(labelled.firstBelowFloorGroup(), "First below-floor group: Floored. A floor is a number you entered, not a legal quorum. The label is not a legal identity.\n");
  await labelled.click("#copy-first-below-floor-group-button");
  assert.equal(labelled.clipboardText(), "First below-floor group: Floored. A floor is a number you entered, not a legal quorum. The label is not a legal identity.\n");
  assert.doesNotMatch(labelled.clipboardText(), /Groups below their support floor/u);
  assert.doesNotMatch(labelled.clipboardText(), /Current lock count/u);
  assert.doesNotMatch(labelled.clipboardText(), /Later floor/u);
  assert.match(labelled.message(), /not a legal identity/u);
});

test("copy threshold-group count writes one-line Markdown with a clipboard fallback", async () => {
  const html = await standaloneBytes();
  assert.match(html, /id="copy-threshold-group-count-button"/u);
  assert.match(html, /Copy threshold-group count/u);
  assert.match(html, /id="threshold-group-count-fallback"/u);
  assert.match(html, /not a legal quorum/u);
  const passing = {
    title: "Threshold-group count workshop",
    threshold: 70,
    groups: [
      { id: "cleared", name: "Cleared", weight: 1 },
      { id: "short", name: "Short", weight: 1 },
    ],
    clauses: [{ id: "one", title: "One", options: [
      { id: "original", label: "Keep original", original: true, changeCost: 0, support: { cleared: 90, short: 20 } },
      { id: "mid", label: "Mid option", original: false, changeCost: 1, support: { cleared: 80, short: 30 } },
      { id: "other", label: "Other option", original: false, changeCost: 2, support: { cleared: 70, short: 40 } },
    ] }],
  };
  const app = await savedWorkbench(new Map([["smallest-agreement:proposal:v1", JSON.stringify(passing)]]));
  assert.equal(app.thresholdGroupCount(), "Groups meeting the approval threshold: 1. A threshold is a number you entered, not a legal quorum.\n");
  assert.doesNotMatch(app.thresholdGroupCount(), /Groups below their support floor/u);
  assert.doesNotMatch(app.thresholdGroupCount(), /First below-floor group/u);
  await app.click("#copy-threshold-group-count-button");
  assert.equal(app.clipboardText(), app.thresholdGroupCount());
  assert.match(app.message(), /not a legal quorum/u);
  const blocked = await savedWorkbench(new Map([["smallest-agreement:proposal:v1", JSON.stringify(passing)]]));
  blocked.blockClipboard();
  await blocked.click("#copy-threshold-group-count-button");
  assert.equal(blocked.clipboardText(), "");
  assert.equal(blocked.focused(), "#threshold-group-count-fallback");
  assert.match(blocked.thresholdGroupCount(), /Groups meeting the approval threshold: 1/u);
  assert.match(blocked.message(), /Clipboard is blocked/u);
  assert.match(blocked.message(), /not a legal quorum/u);
  const zeroDraft = {
    title: "Zero threshold-group count workshop",
    threshold: 95,
    groups: [
      { id: "cleared", name: "Cleared", weight: 1 },
      { id: "short", name: "Short", weight: 1 },
    ],
    clauses: [{ id: "one", title: "One", options: [
      { id: "original", label: "Keep original", original: true, changeCost: 0, support: { cleared: 40, short: 20 } },
      { id: "mid", label: "Mid option", original: false, changeCost: 1, support: { cleared: 30, short: 30 } },
      { id: "other", label: "Other option", original: false, changeCost: 2, support: { cleared: 20, short: 40 } },
    ] }],
  };
  const zero = await savedWorkbench(new Map([["smallest-agreement:proposal:v1", JSON.stringify(zeroDraft)]]));
  assert.equal(zero.thresholdGroupCount(), "Groups meeting the approval threshold: 0. A threshold is a number you entered, not a legal quorum.\n");
  await zero.click("#copy-threshold-group-count-button");
  assert.equal(zero.clipboardText(), "Groups meeting the approval threshold: 0. A threshold is a number you entered, not a legal quorum.\n");
  assert.match(zero.message(), /honest zero/u);
  assert.match(zero.message(), /not a legal quorum/u);
  assert.doesNotMatch(zero.clipboardText(), /Groups below their support floor/u);
  assert.doesNotMatch(zero.clipboardText(), /First below-floor group/u);
});

test("copy first veto group writes one-line Markdown with a clipboard fallback", async () => {
  const html = await standaloneBytes();
  assert.match(html, /id="copy-first-veto-group-button"/u);
  assert.match(html, /Copy first veto group/u);
  assert.match(html, /id="first-veto-group-fallback"/u);
  assert.match(html, /not a legal right/u);
  const app = await savedWorkbench(new Map());
  assert.equal(app.firstVetoGroup(), "No veto group is marked, so there is no first veto group label to copy. A veto is a number you entered, not a legal right.\n");
  assert.doesNotMatch(app.firstVetoGroup(), /First below-floor group/u);
  assert.doesNotMatch(app.firstVetoGroup(), /Groups meeting the approval threshold/u);
  await app.click("#copy-first-veto-group-button");
  assert.equal(app.clipboardText(), app.firstVetoGroup());
  assert.match(app.message(), /honest empty/u);
  assert.match(app.message(), /not a legal right/u);
  const blocked = await savedWorkbench(new Map());
  blocked.blockClipboard();
  await blocked.click("#copy-first-veto-group-button");
  assert.equal(blocked.clipboardText(), "");
  assert.equal(blocked.focused(), "#first-veto-group-fallback");
  assert.match(blocked.firstVetoGroup(), /No veto group is marked/u);
  assert.match(blocked.message(), /Clipboard is blocked/u);
  assert.match(blocked.message(), /not a legal right/u);
  const labelled = await savedWorkbench(new Map());
  labelled.field("#preset-select", "club-constitution");
  labelled.click("#load-preset");
  assert.equal(labelled.firstVetoGroup(), "First veto group: Officers. A veto is a number you entered, not a legal right.\n");
  await labelled.click("#copy-first-veto-group-button");
  assert.equal(labelled.clipboardText(), "First veto group: Officers. A veto is a number you entered, not a legal right.\n");
  assert.doesNotMatch(labelled.clipboardText(), /First below-floor group/u);
  assert.doesNotMatch(labelled.clipboardText(), /Groups meeting the approval threshold/u);
  assert.match(labelled.message(), /not a legal right/u);
});

test("copy veto-group count writes one-line Markdown with a clipboard fallback", async () => {
  const html = await standaloneBytes();
  assert.match(html, /id="copy-veto-group-count-button"/u);
  assert.match(html, /Copy veto-group count/u);
  assert.match(html, /id="veto-group-count-fallback"/u);
  assert.match(html, /not a legal right/u);
  const app = await savedWorkbench(new Map());
  assert.equal(app.vetoGroupCount(), "Veto groups: 0. A veto is a number you entered, not a legal right.\n");
  assert.doesNotMatch(app.vetoGroupCount(), /First veto group/u);
  assert.doesNotMatch(app.vetoGroupCount(), /Groups meeting the approval threshold/u);
  await app.click("#copy-veto-group-count-button");
  assert.equal(app.clipboardText(), app.vetoGroupCount());
  assert.match(app.message(), /honest zero/u);
  assert.match(app.message(), /not a legal right/u);
  const blocked = await savedWorkbench(new Map());
  blocked.blockClipboard();
  await blocked.click("#copy-veto-group-count-button");
  assert.equal(blocked.clipboardText(), "");
  assert.equal(blocked.focused(), "#veto-group-count-fallback");
  assert.match(blocked.vetoGroupCount(), /Veto groups: 0/u);
  assert.match(blocked.message(), /Clipboard is blocked/u);
  assert.match(blocked.message(), /not a legal right/u);
  const labelled = await savedWorkbench(new Map());
  labelled.field("#preset-select", "club-constitution");
  labelled.click("#load-preset");
  assert.equal(labelled.vetoGroupCount(), "Veto groups: 1. A veto is a number you entered, not a legal right.\n");
  await labelled.click("#copy-veto-group-count-button");
  assert.equal(labelled.clipboardText(), "Veto groups: 1. A veto is a number you entered, not a legal right.\n");
  assert.doesNotMatch(labelled.clipboardText(), /First veto group/u);
  assert.doesNotMatch(labelled.clipboardText(), /Groups meeting the approval threshold/u);
  assert.match(labelled.message(), /not a legal right/u);
});

test("copy first non-veto group writes one-line Markdown with a clipboard fallback", async () => {
  const html = await standaloneBytes();
  assert.match(html, /id="copy-first-non-veto-group-button"/u);
  assert.match(html, /Copy first non-veto group/u);
  assert.match(html, /id="first-non-veto-group-fallback"/u);
  assert.match(html, /not a legal identity/u);
  const app = await savedWorkbench(new Map());
  assert.equal(app.firstNonVetoGroup(), "First non-veto group: Residents. A veto is a number you entered, not a legal right. The label is not a legal identity.\n");
  assert.doesNotMatch(app.firstNonVetoGroup(), /First veto group/u);
  assert.doesNotMatch(app.firstNonVetoGroup(), /Veto groups:/u);
  await app.click("#copy-first-non-veto-group-button");
  assert.equal(app.clipboardText(), app.firstNonVetoGroup());
  assert.match(app.message(), /not a legal right/u);
  assert.match(app.message(), /not a legal identity/u);
  const blocked = await savedWorkbench(new Map());
  blocked.blockClipboard();
  await blocked.click("#copy-first-non-veto-group-button");
  assert.equal(blocked.clipboardText(), "");
  assert.equal(blocked.focused(), "#first-non-veto-group-fallback");
  assert.match(blocked.firstNonVetoGroup(), /First non-veto group: Residents/u);
  assert.match(blocked.message(), /Clipboard is blocked/u);
  assert.match(blocked.message(), /not a legal identity/u);
  const labelled = await savedWorkbench(new Map());
  labelled.field("#preset-select", "club-constitution");
  labelled.click("#load-preset");
  assert.equal(labelled.firstNonVetoGroup(), "First non-veto group: Members. A veto is a number you entered, not a legal right. The label is not a legal identity.\n");
  await labelled.click("#copy-first-non-veto-group-button");
  assert.equal(labelled.clipboardText(), "First non-veto group: Members. A veto is a number you entered, not a legal right. The label is not a legal identity.\n");
  assert.doesNotMatch(labelled.clipboardText(), /First veto group/u);
  assert.doesNotMatch(labelled.clipboardText(), /Veto groups:/u);
  assert.doesNotMatch(labelled.clipboardText(), /Officers/u);
  assert.match(labelled.message(), /not a legal identity/u);
  const none = await savedWorkbench(new Map([["smallest-agreement:proposal:v1", JSON.stringify({
    title: "Only veto groups workshop",
    threshold: 70,
    groups: [{ id: "veto", name: "Veto bloc", weight: 1, veto: true }],
    clauses: [{ id: "one", title: "One", options: [
      { id: "original", label: "Keep original", original: true, changeCost: 0, support: { veto: 90 } },
      { id: "mid", label: "Mid option", original: false, changeCost: 1, support: { veto: 80 } },
      { id: "other", label: "Other option", original: false, changeCost: 2, support: { veto: 70 } },
    ] }],
  })]]));
  assert.equal(none.firstNonVetoGroup(), "No non-veto group is marked, so there is no first non-veto group label to copy. A veto is a number you entered, not a legal right. The label is not a legal identity.\n");
  await none.click("#copy-first-non-veto-group-button");
  assert.equal(none.clipboardText(), none.firstNonVetoGroup());
  assert.match(none.message(), /honest empty/u);
  assert.match(none.message(), /not a legal identity/u);
});

test("copy last veto group writes one-line Markdown with a clipboard fallback", async () => {
  const html = await standaloneBytes();
  assert.match(html, /id="copy-last-veto-group-button"/u);
  assert.match(html, /Copy last veto group/u);
  assert.match(html, /id="last-veto-group-fallback"/u);
  assert.match(html, /not a legal right/u);
  const app = await savedWorkbench(new Map());
  assert.equal(app.lastVetoGroup(), "No veto group is marked, so there is no last veto group label to copy. A veto is a number you entered, not a legal right.\n");
  assert.doesNotMatch(app.lastVetoGroup(), /First veto group/u);
  assert.doesNotMatch(app.lastVetoGroup(), /First non-veto group/u);
  await app.click("#copy-last-veto-group-button");
  assert.equal(app.clipboardText(), app.lastVetoGroup());
  assert.match(app.message(), /honest empty/u);
  assert.match(app.message(), /not a legal right/u);
  const blocked = await savedWorkbench(new Map());
  blocked.blockClipboard();
  await blocked.click("#copy-last-veto-group-button");
  assert.equal(blocked.clipboardText(), "");
  assert.equal(blocked.focused(), "#last-veto-group-fallback");
  assert.match(blocked.lastVetoGroup(), /No veto group is marked/u);
  assert.match(blocked.message(), /Clipboard is blocked/u);
  assert.match(blocked.message(), /not a legal right/u);
  const labelled = await savedWorkbench(new Map());
  labelled.field("#preset-select", "club-constitution");
  labelled.click("#load-preset");
  assert.equal(labelled.lastVetoGroup(), "Last veto group: Officers. A veto is a number you entered, not a legal right.\n");
  await labelled.click("#copy-last-veto-group-button");
  assert.equal(labelled.clipboardText(), "Last veto group: Officers. A veto is a number you entered, not a legal right.\n");
  assert.doesNotMatch(labelled.clipboardText(), /First veto group/u);
  assert.doesNotMatch(labelled.clipboardText(), /First non-veto group/u);
  assert.doesNotMatch(labelled.clipboardText(), /Members/u);
  assert.match(labelled.message(), /not a legal right/u);
  const twoVeto = await savedWorkbench(new Map([["smallest-agreement:proposal:v1", JSON.stringify({
    title: "Two veto groups workshop",
    threshold: 70,
    groups: [
      { id: "open", name: "Open", weight: 1 },
      { id: "first-veto", name: "First veto", weight: 1, veto: true },
      { id: "later-veto", name: "Later veto", weight: 1, veto: true },
    ],
    clauses: [{ id: "one", title: "One", options: [
      { id: "original", label: "Keep original", original: true, changeCost: 0, support: { open: 90, "first-veto": 90, "later-veto": 90 } },
      { id: "mid", label: "Mid option", original: false, changeCost: 1, support: { open: 80, "first-veto": 80, "later-veto": 80 } },
      { id: "other", label: "Other option", original: false, changeCost: 2, support: { open: 70, "first-veto": 70, "later-veto": 70 } },
    ] }],
  })]]));
  assert.equal(twoVeto.lastVetoGroup(), "Last veto group: Later veto. A veto is a number you entered, not a legal right.\n");
  await twoVeto.click("#copy-last-veto-group-button");
  assert.equal(twoVeto.clipboardText(), "Last veto group: Later veto. A veto is a number you entered, not a legal right.\n");
  assert.doesNotMatch(twoVeto.clipboardText(), /First veto group/u);
  assert.doesNotMatch(twoVeto.clipboardText(), /First veto\./u);
  assert.doesNotMatch(twoVeto.clipboardText(), /First non-veto group/u);
});

test("copy last non-veto group writes one-line Markdown with a clipboard fallback", async () => {
  const html = await standaloneBytes();
  assert.match(html, /id="copy-last-non-veto-group-button"/u);
  assert.match(html, /Copy last non-veto group/u);
  assert.match(html, /id="last-non-veto-group-fallback"/u);
  assert.match(html, /not a legal identity/u);
  const app = await savedWorkbench(new Map());
  assert.equal(app.lastNonVetoGroup(), "Last non-veto group: Park stewards. A veto is a number you entered, not a legal right. The label is not a legal identity.\n");
  assert.doesNotMatch(app.lastNonVetoGroup(), /Last veto group/u);
  assert.doesNotMatch(app.lastNonVetoGroup(), /First non-veto group/u);
  await app.click("#copy-last-non-veto-group-button");
  assert.equal(app.clipboardText(), app.lastNonVetoGroup());
  assert.match(app.message(), /not a legal right/u);
  assert.match(app.message(), /not a legal identity/u);
  const blocked = await savedWorkbench(new Map());
  blocked.blockClipboard();
  await blocked.click("#copy-last-non-veto-group-button");
  assert.equal(blocked.clipboardText(), "");
  assert.equal(blocked.focused(), "#last-non-veto-group-fallback");
  assert.match(blocked.lastNonVetoGroup(), /Last non-veto group: Park stewards/u);
  assert.match(blocked.message(), /Clipboard is blocked/u);
  assert.match(blocked.message(), /not a legal identity/u);
  const labelled = await savedWorkbench(new Map());
  labelled.field("#preset-select", "club-constitution");
  labelled.click("#load-preset");
  assert.equal(labelled.lastNonVetoGroup(), "Last non-veto group: Club staff. A veto is a number you entered, not a legal right. The label is not a legal identity.\n");
  await labelled.click("#copy-last-non-veto-group-button");
  assert.equal(labelled.clipboardText(), "Last non-veto group: Club staff. A veto is a number you entered, not a legal right. The label is not a legal identity.\n");
  assert.doesNotMatch(labelled.clipboardText(), /Last veto group/u);
  assert.doesNotMatch(labelled.clipboardText(), /First non-veto group/u);
  assert.doesNotMatch(labelled.clipboardText(), /Members/u);
  assert.match(labelled.message(), /not a legal identity/u);
  const none = await savedWorkbench(new Map([["smallest-agreement:proposal:v1", JSON.stringify({
    title: "Only veto groups workshop",
    threshold: 70,
    groups: [{ id: "veto", name: "Veto bloc", weight: 1, veto: true }],
    clauses: [{ id: "one", title: "One", options: [
      { id: "original", label: "Keep original", original: true, changeCost: 0, support: { veto: 90 } },
      { id: "mid", label: "Mid option", original: false, changeCost: 1, support: { veto: 80 } },
      { id: "other", label: "Other option", original: false, changeCost: 2, support: { veto: 70 } },
    ] }],
  })]]));
  assert.equal(none.lastNonVetoGroup(), "No non-veto group is marked, so there is no last non-veto group label to copy. A veto is a number you entered, not a legal right. The label is not a legal identity.\n");
  await none.click("#copy-last-non-veto-group-button");
  assert.equal(none.clipboardText(), none.lastNonVetoGroup());
  assert.match(none.message(), /honest empty/u);
  assert.match(none.message(), /not a legal identity/u);
});

test("copy last below-threshold group writes one-line Markdown with a clipboard fallback", async () => {
  const html = await standaloneBytes();
  assert.match(html, /id="copy-last-below-threshold-group-button"/u);
  assert.match(html, /Copy last below-threshold group/u);
  assert.match(html, /id="last-below-threshold-group-fallback"/u);
  assert.match(html, /not a legal identity/u);
  const draft = {
    title: "Last below-threshold copy workshop",
    threshold: 70,
    groups: [
      { id: "cleared", name: "Cleared", weight: 1 },
      { id: "short", name: "Short", weight: 1 },
      { id: "floored", name: "Floored", weight: 1 },
    ],
    clauses: [{ id: "one", title: "One", options: [
      { id: "original", label: "Keep original", original: true, changeCost: 0, support: { cleared: 90, short: 20, floored: 20 } },
      { id: "mid", label: "Mid option", original: false, changeCost: 1, support: { cleared: 80, short: 30, floored: 30 } },
      { id: "other", label: "Other option", original: false, changeCost: 2, support: { cleared: 70, short: 40, floored: 40 } },
    ] }],
  };
  const app = await savedWorkbench(new Map([["smallest-agreement:proposal:v1", JSON.stringify(draft)]]));
  assert.equal(app.lastBelowThresholdGroup(), "Last below-threshold group: Floored. A threshold is a number you entered, not a legal quorum. The label is not a legal identity.\n");
  assert.doesNotMatch(app.lastBelowThresholdGroup(), /Last non-veto group/u);
  assert.doesNotMatch(app.lastBelowThresholdGroup(), /First below-floor group/u);
  await app.click("#copy-last-below-threshold-group-button");
  assert.equal(app.clipboardText(), app.lastBelowThresholdGroup());
  assert.match(app.message(), /not a legal quorum/u);
  assert.match(app.message(), /not a legal identity/u);
  const blocked = await savedWorkbench(new Map([["smallest-agreement:proposal:v1", JSON.stringify(draft)]]));
  blocked.blockClipboard();
  await blocked.click("#copy-last-below-threshold-group-button");
  assert.equal(blocked.clipboardText(), "");
  assert.equal(blocked.focused(), "#last-below-threshold-group-fallback");
  assert.match(blocked.lastBelowThresholdGroup(), /Last below-threshold group: Floored/u);
  assert.match(blocked.message(), /Clipboard is blocked/u);
  assert.match(blocked.message(), /not a legal identity/u);
  const none = await savedWorkbench(new Map([["smallest-agreement:proposal:v1", JSON.stringify({
    title: "No below-threshold groups workshop",
    threshold: 70,
    groups: [{ id: "open", name: "Open", weight: 1 }],
    clauses: [{ id: "one", title: "One", options: [
      { id: "original", label: "Keep original", original: true, changeCost: 0, support: { open: 90 } },
      { id: "mid", label: "Mid option", original: false, changeCost: 1, support: { open: 80 } },
      { id: "other", label: "Other option", original: false, changeCost: 2, support: { open: 70 } },
    ] }],
  })]]));
  assert.equal(none.lastBelowThresholdGroup(), "No group is below the approval threshold, so there is no last below-threshold group label to copy. A threshold is a number you entered, not a legal quorum. The label is not a legal identity.\n");
  await none.click("#copy-last-below-threshold-group-button");
  assert.equal(none.clipboardText(), none.lastBelowThresholdGroup());
  assert.match(none.message(), /honest empty/u);
  assert.match(none.message(), /not a legal identity/u);
});

test("copy first below-threshold group writes one-line Markdown with a clipboard fallback", async () => {
  const html = await standaloneBytes();
  assert.match(html, /id="copy-first-below-threshold-group-button"/u);
  assert.match(html, /Copy first below-threshold group/u);
  assert.match(html, /id="first-below-threshold-group-fallback"/u);
  assert.match(html, /not a legal identity/u);
  const draft = {
    title: "First below-threshold copy workshop",
    threshold: 70,
    groups: [
      { id: "cleared", name: "Cleared", weight: 1 },
      { id: "short", name: "Short", weight: 1 },
      { id: "floored", name: "Floored", weight: 1 },
    ],
    clauses: [{ id: "one", title: "One", options: [
      { id: "original", label: "Keep original", original: true, changeCost: 0, support: { cleared: 90, short: 20, floored: 20 } },
      { id: "mid", label: "Mid option", original: false, changeCost: 1, support: { cleared: 80, short: 30, floored: 30 } },
      { id: "other", label: "Other option", original: false, changeCost: 2, support: { cleared: 70, short: 40, floored: 40 } },
    ] }],
  };
  const app = await savedWorkbench(new Map([["smallest-agreement:proposal:v1", JSON.stringify(draft)]]));
  assert.equal(app.firstBelowThresholdGroup(), "First below-threshold group: Short. A threshold is a number you entered, not a legal quorum. The label is not a legal identity.\n");
  assert.doesNotMatch(app.firstBelowThresholdGroup(), /Last below-threshold group/u);
  assert.doesNotMatch(app.firstBelowThresholdGroup(), /First below-floor group/u);
  await app.click("#copy-first-below-threshold-group-button");
  assert.equal(app.clipboardText(), app.firstBelowThresholdGroup());
  assert.match(app.message(), /not a legal quorum/u);
  assert.match(app.message(), /not a legal identity/u);
  const blocked = await savedWorkbench(new Map([["smallest-agreement:proposal:v1", JSON.stringify(draft)]]));
  blocked.blockClipboard();
  await blocked.click("#copy-first-below-threshold-group-button");
  assert.equal(blocked.clipboardText(), "");
  assert.equal(blocked.focused(), "#first-below-threshold-group-fallback");
  assert.match(blocked.firstBelowThresholdGroup(), /First below-threshold group: Short/u);
  assert.match(blocked.message(), /Clipboard is blocked/u);
  assert.match(blocked.message(), /not a legal identity/u);
  const none = await savedWorkbench(new Map([["smallest-agreement:proposal:v1", JSON.stringify({
    title: "No below-threshold groups workshop",
    threshold: 70,
    groups: [{ id: "open", name: "Open", weight: 1 }],
    clauses: [{ id: "one", title: "One", options: [
      { id: "original", label: "Keep original", original: true, changeCost: 0, support: { open: 90 } },
      { id: "mid", label: "Mid option", original: false, changeCost: 1, support: { open: 80 } },
      { id: "other", label: "Other option", original: false, changeCost: 2, support: { open: 70 } },
    ] }],
  })]]));
  assert.equal(none.firstBelowThresholdGroup(), "No group is below the approval threshold, so there is no first below-threshold group label to copy. A threshold is a number you entered, not a legal quorum. The label is not a legal identity.\n");
  await none.click("#copy-first-below-threshold-group-button");
  assert.equal(none.clipboardText(), none.firstBelowThresholdGroup());
  assert.match(none.message(), /honest empty/u);
  assert.match(none.message(), /not a legal identity/u);
});

test("copy last at-or-above-threshold group writes one-line Markdown with a clipboard fallback", async () => {
  const html = await standaloneBytes();
  assert.match(html, /id="copy-last-group-at-or-above-threshold-button"/u);
  assert.match(html, /Copy last at-or-above-threshold group/u);
  assert.match(html, /id="last-group-at-or-above-threshold-fallback"/u);
  assert.match(html, /not a legal identity/u);
  const draft = {
    title: "Last at-or-above-threshold copy workshop",
    threshold: 70,
    groups: [
      { id: "cleared", name: "Cleared", weight: 1 },
      { id: "short", name: "Short", weight: 1 },
      { id: "later", name: "Later", weight: 1 },
    ],
    clauses: [{ id: "one", title: "One", options: [
      { id: "original", label: "Keep original", original: true, changeCost: 0, support: { cleared: 90, short: 20, later: 80 } },
      { id: "mid", label: "Mid option", original: false, changeCost: 1, support: { cleared: 80, short: 30, later: 75 } },
      { id: "other", label: "Other option", original: false, changeCost: 2, support: { cleared: 70, short: 40, later: 72 } },
    ] }],
  };
  const app = await savedWorkbench(new Map([["smallest-agreement:proposal:v1", JSON.stringify(draft)]]));
  assert.equal(app.lastGroupAtOrAboveThreshold(), "Last at-or-above-threshold group: Later. A threshold is a number you entered, not a legal quorum. The label is not a legal identity.\n");
  assert.doesNotMatch(app.lastGroupAtOrAboveThreshold(), /Last below-threshold group/u);
  assert.doesNotMatch(app.lastGroupAtOrAboveThreshold(), /First below-threshold group/u);
  await app.click("#copy-last-group-at-or-above-threshold-button");
  assert.equal(app.clipboardText(), app.lastGroupAtOrAboveThreshold());
  assert.match(app.message(), /not a legal quorum/u);
  assert.match(app.message(), /not a legal identity/u);
  const blocked = await savedWorkbench(new Map([["smallest-agreement:proposal:v1", JSON.stringify(draft)]]));
  blocked.blockClipboard();
  await blocked.click("#copy-last-group-at-or-above-threshold-button");
  assert.equal(blocked.clipboardText(), "");
  assert.equal(blocked.focused(), "#last-group-at-or-above-threshold-fallback");
  assert.match(blocked.lastGroupAtOrAboveThreshold(), /Last at-or-above-threshold group: Later/u);
  assert.match(blocked.message(), /Clipboard is blocked/u);
  assert.match(blocked.message(), /not a legal identity/u);
  const none = await savedWorkbench(new Map([["smallest-agreement:proposal:v1", JSON.stringify({
    title: "No at-or-above-threshold groups workshop",
    threshold: 70,
    groups: [{ id: "open", name: "Open", weight: 1 }],
    clauses: [{ id: "one", title: "One", options: [
      { id: "original", label: "Keep original", original: true, changeCost: 0, support: { open: 20 } },
      { id: "mid", label: "Mid option", original: false, changeCost: 1, support: { open: 30 } },
      { id: "other", label: "Other option", original: false, changeCost: 2, support: { open: 40 } },
    ] }],
  })]]));
  assert.equal(none.lastGroupAtOrAboveThreshold(), "No group is at or above the approval threshold, so there is no last at-or-above-threshold group label to copy. A threshold is a number you entered, not a legal quorum. The label is not a legal identity.\n");
  await none.click("#copy-last-group-at-or-above-threshold-button");
  assert.equal(none.clipboardText(), none.lastGroupAtOrAboveThreshold());
  assert.match(none.message(), /honest empty/u);
  assert.match(none.message(), /not a legal identity/u);
});

test("copy first at-or-above-threshold group writes one-line Markdown with a clipboard fallback", async () => {
  const html = await standaloneBytes();
  assert.match(html, /id="copy-first-group-at-or-above-threshold-button"/u);
  assert.match(html, /Copy first at-or-above-threshold group/u);
  assert.match(html, /id="first-group-at-or-above-threshold-fallback"/u);
  assert.match(html, /not a legal identity/u);
  const draft = {
    title: "First at-or-above-threshold copy workshop",
    threshold: 70,
    groups: [
      { id: "cleared", name: "Cleared", weight: 1 },
      { id: "short", name: "Short", weight: 1 },
      { id: "later", name: "Later", weight: 1 },
    ],
    clauses: [{ id: "one", title: "One", options: [
      { id: "original", label: "Keep original", original: true, changeCost: 0, support: { cleared: 90, short: 20, later: 80 } },
      { id: "mid", label: "Mid option", original: false, changeCost: 1, support: { cleared: 80, short: 30, later: 75 } },
      { id: "other", label: "Other option", original: false, changeCost: 2, support: { cleared: 70, short: 40, later: 72 } },
    ] }],
  };
  const app = await savedWorkbench(new Map([["smallest-agreement:proposal:v1", JSON.stringify(draft)]]));
  assert.equal(app.firstGroupAtOrAboveThreshold(), "First at-or-above-threshold group: Cleared. A threshold is a number you entered, not a legal quorum. The label is not a legal identity.\n");
  assert.doesNotMatch(app.firstGroupAtOrAboveThreshold(), /Last at-or-above-threshold group/u);
  assert.doesNotMatch(app.firstGroupAtOrAboveThreshold(), /First below-threshold group/u);
  await app.click("#copy-first-group-at-or-above-threshold-button");
  assert.equal(app.clipboardText(), app.firstGroupAtOrAboveThreshold());
  assert.match(app.message(), /not a legal quorum/u);
  assert.match(app.message(), /not a legal identity/u);
  const blocked = await savedWorkbench(new Map([["smallest-agreement:proposal:v1", JSON.stringify(draft)]]));
  blocked.blockClipboard();
  await blocked.click("#copy-first-group-at-or-above-threshold-button");
  assert.equal(blocked.clipboardText(), "");
  assert.equal(blocked.focused(), "#first-group-at-or-above-threshold-fallback");
  assert.match(blocked.firstGroupAtOrAboveThreshold(), /First at-or-above-threshold group: Cleared/u);
  assert.match(blocked.message(), /Clipboard is blocked/u);
  assert.match(blocked.message(), /not a legal identity/u);
  const none = await savedWorkbench(new Map([["smallest-agreement:proposal:v1", JSON.stringify({
    title: "No at-or-above-threshold groups workshop",
    threshold: 70,
    groups: [{ id: "open", name: "Open", weight: 1 }],
    clauses: [{ id: "one", title: "One", options: [
      { id: "original", label: "Keep original", original: true, changeCost: 0, support: { open: 20 } },
      { id: "mid", label: "Mid option", original: false, changeCost: 1, support: { open: 30 } },
      { id: "other", label: "Other option", original: false, changeCost: 2, support: { open: 40 } },
    ] }],
  })]]));
  assert.equal(none.firstGroupAtOrAboveThreshold(), "No group is at or above the approval threshold, so there is no first at-or-above-threshold group label to copy. A threshold is a number you entered, not a legal quorum. The label is not a legal identity.\n");
  await none.click("#copy-first-group-at-or-above-threshold-button");
  assert.equal(none.clipboardText(), none.firstGroupAtOrAboveThreshold());
  assert.match(none.message(), /honest empty/u);
  assert.match(none.message(), /not a legal identity/u);
});

test("copy last at-floor group writes one-line Markdown with a clipboard fallback", async () => {
  const html = await standaloneBytes();
  assert.match(html, /id="copy-last-group-at-floor-button"/u);
  assert.match(html, /Copy last at-floor group/u);
  assert.match(html, /id="last-group-at-floor-fallback"/u);
  assert.match(html, /not a legal identity/u);
  const draft = {
    title: "Last at-floor copy workshop",
    threshold: 50,
    groups: [
      { id: "cleared", name: "Cleared", weight: 1, minSupport: 40 },
      { id: "short", name: "Short", weight: 1, minSupport: 90 },
      { id: "later", name: "Later", weight: 1, minSupport: 40 },
    ],
    clauses: [{ id: "one", title: "One", options: [
      { id: "original", label: "Keep original", original: true, changeCost: 0, support: { cleared: 90, short: 20, later: 80 } },
      { id: "mid", label: "Mid option", original: false, changeCost: 1, support: { cleared: 80, short: 30, later: 75 } },
      { id: "other", label: "Other option", original: false, changeCost: 2, support: { cleared: 70, short: 40, later: 72 } },
    ] }],
  };
  const app = await savedWorkbench(new Map([["smallest-agreement:proposal:v1", JSON.stringify(draft)]]));
  assert.equal(app.lastGroupAtFloor(), "Last at-floor group: Later. A floor is a number you entered, not a legal quorum. The label is not a legal identity.\n");
  assert.doesNotMatch(app.lastGroupAtFloor(), /Last at-or-above-threshold group/u);
  assert.doesNotMatch(app.lastGroupAtFloor(), /First at-or-above-threshold group/u);
  await app.click("#copy-last-group-at-floor-button");
  assert.equal(app.clipboardText(), app.lastGroupAtFloor());
  assert.match(app.message(), /not a legal quorum/u);
  assert.match(app.message(), /not a legal identity/u);
  const blocked = await savedWorkbench(new Map([["smallest-agreement:proposal:v1", JSON.stringify(draft)]]));
  blocked.blockClipboard();
  await blocked.click("#copy-last-group-at-floor-button");
  assert.equal(blocked.clipboardText(), "");
  assert.equal(blocked.focused(), "#last-group-at-floor-fallback");
  assert.match(blocked.lastGroupAtFloor(), /Last at-floor group: Later/u);
  assert.match(blocked.message(), /Clipboard is blocked/u);
  assert.match(blocked.message(), /not a legal identity/u);
  const none = await savedWorkbench(new Map([["smallest-agreement:proposal:v1", JSON.stringify({
    title: "No at-floor groups workshop",
    threshold: 50,
    groups: [{ id: "open", name: "Open", weight: 1 }],
    clauses: [{ id: "one", title: "One", options: [
      { id: "original", label: "Keep original", original: true, changeCost: 0, support: { open: 90 } },
      { id: "mid", label: "Mid option", original: false, changeCost: 1, support: { open: 80 } },
      { id: "other", label: "Other option", original: false, changeCost: 2, support: { open: 70 } },
    ] }],
  })]]));
  assert.equal(none.lastGroupAtFloor(), "No group currently meets their support floor, so there is no last at-floor group label to copy. A floor is a number you entered, not a legal quorum. The label is not a legal identity.\n");
  await none.click("#copy-last-group-at-floor-button");
  assert.equal(none.clipboardText(), none.lastGroupAtFloor());
  assert.match(none.message(), /honest empty/u);
  assert.match(none.message(), /not a legal identity/u);
});

test("copy last below-floor group writes one-line Markdown with a clipboard fallback", async () => {
  const html = await standaloneBytes();
  assert.match(html, /id="copy-last-below-floor-group-button"/u);
  assert.match(html, /Copy last below-floor group/u);
  assert.match(html, /id="last-below-floor-group-fallback"/u);
  assert.match(html, /not a legal identity/u);
  const draft = {
    title: "Last below-floor copy workshop",
    threshold: 70,
    groups: [
      { id: "floored", name: "Floored", weight: 1, minSupport: 80 },
      { id: "open", name: "Open", weight: 5 },
      { id: "later", name: "Later floor", weight: 1, minSupport: 90 },
    ],
    clauses: [{ id: "one", title: "One", options: [
      { id: "original", label: "Keep original", original: true, changeCost: 0, support: { floored: 50, open: 90, later: 40 } },
      { id: "mid", label: "Mid option", original: false, changeCost: 1, support: { floored: 50, open: 40, later: 40 } },
      { id: "other", label: "Other option", original: false, changeCost: 2, support: { floored: 50, open: 80, later: 40 } },
    ] }],
  };
  const app = await savedWorkbench(new Map([["smallest-agreement:proposal:v1", JSON.stringify(draft)]]));
  assert.equal(app.lastBelowFloorGroup(), "Last below-floor group: Later floor. A floor is a number you entered, not a legal quorum. The label is not a legal identity.\n");
  assert.doesNotMatch(app.lastBelowFloorGroup(), /First below-floor group/u);
  assert.doesNotMatch(app.lastBelowFloorGroup(), /Last below-threshold group/u);
  assert.doesNotMatch(app.lastBelowFloorGroup(), /Last at-floor group/u);
  await app.click("#copy-last-below-floor-group-button");
  assert.equal(app.clipboardText(), app.lastBelowFloorGroup());
  assert.match(app.message(), /not a legal quorum/u);
  assert.match(app.message(), /not a legal identity/u);
  const blocked = await savedWorkbench(new Map([["smallest-agreement:proposal:v1", JSON.stringify(draft)]]));
  blocked.blockClipboard();
  await blocked.click("#copy-last-below-floor-group-button");
  assert.equal(blocked.clipboardText(), "");
  assert.equal(blocked.focused(), "#last-below-floor-group-fallback");
  assert.match(blocked.lastBelowFloorGroup(), /Last below-floor group: Later floor/u);
  assert.match(blocked.message(), /Clipboard is blocked/u);
  assert.match(blocked.message(), /not a legal identity/u);
  const none = await savedWorkbench(new Map([["smallest-agreement:proposal:v1", JSON.stringify({
    title: "No below-floor groups workshop",
    threshold: 70,
    groups: [{ id: "open", name: "Open", weight: 1 }],
    clauses: [{ id: "one", title: "One", options: [
      { id: "original", label: "Keep original", original: true, changeCost: 0, support: { open: 90 } },
      { id: "mid", label: "Mid option", original: false, changeCost: 1, support: { open: 80 } },
      { id: "other", label: "Other option", original: false, changeCost: 2, support: { open: 70 } },
    ] }],
  })]]));
  assert.equal(none.lastBelowFloorGroup(), "No group is below its support floor, so there is no last below-floor group label to copy. A floor is a number you entered, not a legal quorum. The label is not a legal identity.\n");
  await none.click("#copy-last-below-floor-group-button");
  assert.equal(none.clipboardText(), none.lastBelowFloorGroup());
  assert.match(none.message(), /honest empty/u);
  assert.match(none.message(), /not a legal identity/u);
});

test("copy last group without a support floor writes one-line Markdown with a clipboard fallback", async () => {
  const html = await standaloneBytes();
  assert.match(html, /id="copy-last-group-without-floor-button"/u);
  assert.match(html, /Copy last group without a support floor/u);
  assert.match(html, /id="last-group-without-floor-fallback"/u);
  assert.match(html, /not a legal identity/u);
  const draft = {
    title: "Last without floor copy workshop",
    threshold: 50,
    groups: [
      { id: "open", name: "Open", weight: 1 },
      { id: "floored", name: "Floored", weight: 1, minSupport: 40 },
      { id: "later", name: "Later open", weight: 1 },
    ],
    clauses: [{ id: "one", title: "One", options: [
      { id: "original", label: "Keep original", original: true, changeCost: 0, support: { open: 90, floored: 90, later: 80 } },
      { id: "mid", label: "Mid option", original: false, changeCost: 1, support: { open: 80, floored: 80, later: 75 } },
      { id: "other", label: "Other option", original: false, changeCost: 2, support: { open: 70, floored: 70, later: 72 } },
    ] }],
  };
  const app = await savedWorkbench(new Map([["smallest-agreement:proposal:v1", JSON.stringify(draft)]]));
  assert.equal(app.lastGroupWithoutFloor(), "Last group without a support floor: Later open. A floor is a number you entered, not a legal quorum. The label is not a legal identity.\n");
  assert.doesNotMatch(app.lastGroupWithoutFloor(), /First at-floor group/u);
  assert.doesNotMatch(app.lastGroupWithoutFloor(), /Last at-floor group/u);
  assert.doesNotMatch(app.lastGroupWithoutFloor(), /First below-floor group/u);
  assert.doesNotMatch(app.lastGroupWithoutFloor(), /Last below-floor group/u);
  assert.doesNotMatch(app.lastGroupWithoutFloor(), /First group without a support floor/u);
  assert.doesNotMatch(app.lastGroupWithoutFloor(), /Floored/u);
  await app.click("#copy-last-group-without-floor-button");
  assert.equal(app.clipboardText(), app.lastGroupWithoutFloor());
  assert.match(app.message(), /not a legal quorum/u);
  assert.match(app.message(), /not a legal identity/u);
  const blocked = await savedWorkbench(new Map([["smallest-agreement:proposal:v1", JSON.stringify(draft)]]));
  blocked.blockClipboard();
  await blocked.click("#copy-last-group-without-floor-button");
  assert.equal(blocked.clipboardText(), "");
  assert.equal(blocked.focused(), "#last-group-without-floor-fallback");
  assert.match(blocked.lastGroupWithoutFloor(), /Last group without a support floor: Later open/u);
  assert.match(blocked.message(), /Clipboard is blocked/u);
  assert.match(blocked.message(), /not a legal identity/u);
  const none = await savedWorkbench(new Map([["smallest-agreement:proposal:v1", JSON.stringify({
    title: "No groups without floors workshop",
    threshold: 50,
    groups: [{ id: "floored", name: "Floored", weight: 1, minSupport: 40 }],
    clauses: [{ id: "one", title: "One", options: [
      { id: "original", label: "Keep original", original: true, changeCost: 0, support: { floored: 90 } },
      { id: "mid", label: "Mid option", original: false, changeCost: 1, support: { floored: 80 } },
      { id: "other", label: "Other option", original: false, changeCost: 2, support: { floored: 70 } },
    ] }],
  })]]));
  assert.equal(none.lastGroupWithoutFloor(), "No group is without a support floor, so there is no last group-without-floor label to copy. A floor is a number you entered, not a legal quorum. The label is not a legal identity.\n");
  await none.click("#copy-last-group-without-floor-button");
  assert.equal(none.clipboardText(), none.lastGroupWithoutFloor());
  assert.match(none.message(), /honest empty/u);
  assert.match(none.message(), /not a legal identity/u);
});

test("copy first group without a support floor writes one-line Markdown with a clipboard fallback", async () => {
  const html = await standaloneBytes();
  assert.match(html, /id="copy-first-group-without-floor-button"/u);
  assert.match(html, /Copy first group without a support floor/u);
  assert.match(html, /id="first-group-without-floor-fallback"/u);
  assert.match(html, /not a legal identity/u);
  const draft = {
    title: "First without floor copy workshop",
    threshold: 50,
    groups: [
      { id: "open", name: "Open", weight: 1 },
      { id: "floored", name: "Floored", weight: 1, minSupport: 40 },
      { id: "later", name: "Later open", weight: 1 },
    ],
    clauses: [{ id: "one", title: "One", options: [
      { id: "original", label: "Keep original", original: true, changeCost: 0, support: { open: 90, floored: 90, later: 80 } },
      { id: "mid", label: "Mid option", original: false, changeCost: 1, support: { open: 80, floored: 80, later: 75 } },
      { id: "other", label: "Other option", original: false, changeCost: 2, support: { open: 70, floored: 70, later: 72 } },
    ] }],
  };
  const app = await savedWorkbench(new Map([["smallest-agreement:proposal:v1", JSON.stringify(draft)]]));
  assert.equal(app.firstGroupWithoutFloor(), "First group without a support floor: Open. A floor is a number you entered, not a legal quorum. The label is not a legal identity.\n");
  assert.doesNotMatch(app.firstGroupWithoutFloor(), /Last group without a support floor/u);
  assert.doesNotMatch(app.firstGroupWithoutFloor(), /Groups without a support floor:/u);
  assert.doesNotMatch(app.firstGroupWithoutFloor(), /First at-floor group/u);
  assert.doesNotMatch(app.firstGroupWithoutFloor(), /Last at-floor group/u);
  assert.doesNotMatch(app.firstGroupWithoutFloor(), /First below-floor group/u);
  assert.doesNotMatch(app.firstGroupWithoutFloor(), /Last below-floor group/u);
  assert.doesNotMatch(app.firstGroupWithoutFloor(), /hideGroupsWithoutFloors/u);
  assert.doesNotMatch(app.firstGroupWithoutFloor(), /Floored/u);
  assert.doesNotMatch(app.firstGroupWithoutFloor(), /Later open/u);
  await app.click("#copy-first-group-without-floor-button");
  assert.equal(app.clipboardText(), app.firstGroupWithoutFloor());
  assert.match(app.message(), /not a legal quorum/u);
  assert.match(app.message(), /not a legal identity/u);
  const blocked = await savedWorkbench(new Map([["smallest-agreement:proposal:v1", JSON.stringify(draft)]]));
  blocked.blockClipboard();
  await blocked.click("#copy-first-group-without-floor-button");
  assert.equal(blocked.clipboardText(), "");
  assert.equal(blocked.focused(), "#first-group-without-floor-fallback");
  assert.match(blocked.firstGroupWithoutFloor(), /First group without a support floor: Open/u);
  assert.match(blocked.message(), /Clipboard is blocked/u);
  assert.match(blocked.message(), /not a legal identity/u);
  const none = await savedWorkbench(new Map([["smallest-agreement:proposal:v1", JSON.stringify({
    title: "No groups without floors workshop",
    threshold: 50,
    groups: [{ id: "floored", name: "Floored", weight: 1, minSupport: 40 }],
    clauses: [{ id: "one", title: "One", options: [
      { id: "original", label: "Keep original", original: true, changeCost: 0, support: { floored: 90 } },
      { id: "mid", label: "Mid option", original: false, changeCost: 1, support: { floored: 80 } },
      { id: "other", label: "Other option", original: false, changeCost: 2, support: { floored: 70 } },
    ] }],
  })]]));
  assert.equal(none.firstGroupWithoutFloor(), "No group is without a support floor, so there is no first group-without-floor label to copy. A floor is a number you entered, not a legal quorum. The label is not a legal identity.\n");
  await none.click("#copy-first-group-without-floor-button");
  assert.equal(none.clipboardText(), none.firstGroupWithoutFloor());
  assert.match(none.message(), /honest empty/u);
  assert.match(none.message(), /not a legal identity/u);
});

test("copy groups-without-floor count writes one-line Markdown with a clipboard fallback", async () => {
  const html = await standaloneBytes();
  assert.match(html, /id="copy-groups-without-floor-count-button"/u);
  assert.match(html, /Copy groups-without-floor count/u);
  assert.match(html, /id="groups-without-floor-count-fallback"/u);
  assert.match(html, /not a legal quorum/u);
  const draft = {
    title: "Without-floor count copy workshop",
    threshold: 50,
    groups: [
      { id: "open", name: "Open", weight: 1 },
      { id: "floored", name: "Floored", weight: 1, minSupport: 40 },
      { id: "later", name: "Later open", weight: 1 },
    ],
    clauses: [{ id: "one", title: "One", options: [
      { id: "original", label: "Keep original", original: true, changeCost: 0, support: { open: 90, floored: 90, later: 80 } },
      { id: "mid", label: "Mid option", original: false, changeCost: 1, support: { open: 80, floored: 80, later: 75 } },
      { id: "other", label: "Other option", original: false, changeCost: 2, support: { open: 70, floored: 70, later: 72 } },
    ] }],
  };
  const app = await savedWorkbench(new Map([["smallest-agreement:proposal:v1", JSON.stringify(draft)]]));
  assert.equal(app.groupsWithoutFloorCount(), "Groups without a support floor: 2. A floor is a number you entered, not a legal quorum.\n");
  assert.doesNotMatch(app.groupsWithoutFloorCount(), /First group without a support floor/u);
  assert.doesNotMatch(app.groupsWithoutFloorCount(), /Last group without a support floor/u);
  assert.doesNotMatch(app.groupsWithoutFloorCount(), /First at-floor group/u);
  assert.doesNotMatch(app.groupsWithoutFloorCount(), /Last at-floor group/u);
  assert.doesNotMatch(app.groupsWithoutFloorCount(), /First below-floor group/u);
  assert.doesNotMatch(app.groupsWithoutFloorCount(), /Last below-floor group/u);
  assert.doesNotMatch(app.groupsWithoutFloorCount(), /Open/u);
  assert.doesNotMatch(app.groupsWithoutFloorCount(), /Later open/u);
  await app.click("#copy-groups-without-floor-count-button");
  assert.equal(app.clipboardText(), app.groupsWithoutFloorCount());
  assert.match(app.message(), /not a legal quorum/u);
  const blocked = await savedWorkbench(new Map([["smallest-agreement:proposal:v1", JSON.stringify(draft)]]));
  blocked.blockClipboard();
  await blocked.click("#copy-groups-without-floor-count-button");
  assert.equal(blocked.clipboardText(), "");
  assert.equal(blocked.focused(), "#groups-without-floor-count-fallback");
  assert.match(blocked.groupsWithoutFloorCount(), /Groups without a support floor: 2/u);
  assert.match(blocked.message(), /Clipboard is blocked/u);
  assert.match(blocked.message(), /not a legal quorum/u);
  const none = await savedWorkbench(new Map([["smallest-agreement:proposal:v1", JSON.stringify({
    title: "No groups without floors workshop",
    threshold: 50,
    groups: [{ id: "floored", name: "Floored", weight: 1, minSupport: 40 }],
    clauses: [{ id: "one", title: "One", options: [
      { id: "original", label: "Keep original", original: true, changeCost: 0, support: { floored: 90 } },
      { id: "mid", label: "Mid option", original: false, changeCost: 1, support: { floored: 80 } },
      { id: "other", label: "Other option", original: false, changeCost: 2, support: { floored: 70 } },
    ] }],
  })]]));
  assert.equal(none.groupsWithoutFloorCount(), "Groups without a support floor: 0. A floor is a number you entered, not a legal quorum.\n");
  await none.click("#copy-groups-without-floor-count-button");
  assert.equal(none.clipboardText(), none.groupsWithoutFloorCount());
  assert.match(none.message(), /honest zero/u);
  assert.match(none.message(), /not a legal quorum/u);
});

test("copy groups-without-floor remaining writes one-line Markdown with a clipboard fallback", async () => {
  const html = await standaloneBytes();
  assert.match(html, /id="copy-groups-without-floor-remaining-button"/u);
  assert.match(html, /Copy groups-without-floor remaining/u);
  assert.match(html, /id="groups-without-floor-remaining-fallback"/u);
  assert.match(html, /not a legal quorum/u);
  const draft = {
    title: "Without-floor remaining copy workshop",
    threshold: 50,
    groups: [
      { id: "open", name: "Open", weight: 4 },
      { id: "floored", name: "Floored", weight: 3, minSupport: 40 },
      { id: "later", name: "Later open", weight: 2 },
    ],
    clauses: [{ id: "one", title: "One", options: [
      { id: "original", label: "Keep original", original: true, changeCost: 0, support: { open: 90, floored: 90, later: 80 } },
      { id: "mid", label: "Mid option", original: false, changeCost: 1, support: { open: 80, floored: 80, later: 75 } },
      { id: "other", label: "Other option", original: false, changeCost: 2, support: { open: 70, floored: 70, later: 72 } },
    ] }],
  };
  const app = await savedWorkbench(new Map([["smallest-agreement:proposal:v1", JSON.stringify(draft)]]));
  assert.equal(app.groupsWithoutFloorRemaining(), "Groups-without-floor remaining: 6. A floor is a number you entered, not a legal quorum.\n");
  assert.doesNotMatch(app.groupsWithoutFloorRemaining(), /Groups without a support floor:/u);
  assert.doesNotMatch(app.groupsWithoutFloorRemaining(), /Last-without-floor remaining/u);
  assert.doesNotMatch(app.groupsWithoutFloorRemaining(), /First-without-floor remaining/u);
  assert.doesNotMatch(app.groupsWithoutFloorRemaining(), /First group without a support floor/u);
  assert.doesNotMatch(app.groupsWithoutFloorRemaining(), /Last group without a support floor/u);
  assert.doesNotMatch(app.groupsWithoutFloorRemaining(), /Remaining change-budget/u);
  assert.doesNotMatch(app.groupsWithoutFloorRemaining(), /First at-floor group/u);
  assert.doesNotMatch(app.groupsWithoutFloorRemaining(), /Last at-floor group/u);
  assert.doesNotMatch(app.groupsWithoutFloorRemaining(), /First below-floor group/u);
  assert.doesNotMatch(app.groupsWithoutFloorRemaining(), /Last below-floor group/u);
  assert.doesNotMatch(app.groupsWithoutFloorRemaining(), /Open/u);
  assert.doesNotMatch(app.groupsWithoutFloorRemaining(), /Later open/u);
  await app.click("#copy-groups-without-floor-remaining-button");
  assert.equal(app.clipboardText(), app.groupsWithoutFloorRemaining());
  assert.match(app.message(), /not a legal quorum/u);
  const blocked = await savedWorkbench(new Map([["smallest-agreement:proposal:v1", JSON.stringify(draft)]]));
  blocked.blockClipboard();
  await blocked.click("#copy-groups-without-floor-remaining-button");
  assert.equal(blocked.clipboardText(), "");
  assert.equal(blocked.focused(), "#groups-without-floor-remaining-fallback");
  assert.match(blocked.groupsWithoutFloorRemaining(), /Groups-without-floor remaining: 6/u);
  assert.match(blocked.message(), /Clipboard is blocked/u);
  assert.match(blocked.message(), /not a legal quorum/u);
  const none = await savedWorkbench(new Map([["smallest-agreement:proposal:v1", JSON.stringify({
    title: "No groups without floors workshop",
    threshold: 50,
    groups: [{ id: "floored", name: "Floored", weight: 1, minSupport: 40 }],
    clauses: [{ id: "one", title: "One", options: [
      { id: "original", label: "Keep original", original: true, changeCost: 0, support: { floored: 90 } },
      { id: "mid", label: "Mid option", original: false, changeCost: 1, support: { floored: 80 } },
      { id: "other", label: "Other option", original: false, changeCost: 2, support: { floored: 70 } },
    ] }],
  })]]));
  assert.equal(none.groupsWithoutFloorRemaining(), "Groups-without-floor remaining: 0. A floor is a number you entered, not a legal quorum.\n");
  await none.click("#copy-groups-without-floor-remaining-button");
  assert.equal(none.clipboardText(), none.groupsWithoutFloorRemaining());
  assert.match(none.message(), /honest zero/u);
  assert.match(none.message(), /not a legal quorum/u);
});

test("copy last-without-floor remaining writes one-line Markdown with a clipboard fallback", async () => {
  const html = await standaloneBytes();
  assert.match(html, /id="copy-last-group-without-floor-remaining-button"/u);
  assert.match(html, /Copy last-without-floor remaining/u);
  assert.doesNotMatch(html, /id="copy-last-group-without-floor-remaining-button"[^>]*aria-keyshortcuts/u);
  assert.match(html, /id="last-group-without-floor-remaining-fallback"/u);
  assert.match(html, /not a legal quorum/u);
  const draft = {
    title: "Last-without-floor remaining copy workshop",
    threshold: 50,
    groups: [
      { id: "open", name: "Open", weight: 4 },
      { id: "floored", name: "Floored", weight: 3, minSupport: 40 },
      { id: "later", name: "Later open", weight: 2 },
    ],
    clauses: [{ id: "one", title: "One", options: [
      { id: "original", label: "Keep original", original: true, changeCost: 0, support: { open: 90, floored: 90, later: 80 } },
      { id: "mid", label: "Mid option", original: false, changeCost: 1, support: { open: 80, floored: 80, later: 75 } },
      { id: "other", label: "Other option", original: false, changeCost: 2, support: { open: 70, floored: 70, later: 72 } },
    ] }],
  };
  const app = await savedWorkbench(new Map([["smallest-agreement:proposal:v1", JSON.stringify(draft)]]));
  assert.equal(app.lastGroupWithoutFloorRemaining(), "Last-without-floor remaining: 2. A floor is a number you entered, not a legal quorum.\n");
  assert.doesNotMatch(app.lastGroupWithoutFloorRemaining(), /Groups-without-floor remaining/u);
  assert.doesNotMatch(app.lastGroupWithoutFloorRemaining(), /First-without-floor remaining/u);
  assert.doesNotMatch(app.lastGroupWithoutFloorRemaining(), /Groups without a support floor:/u);
  assert.doesNotMatch(app.lastGroupWithoutFloorRemaining(), /First group without a support floor/u);
  assert.doesNotMatch(app.lastGroupWithoutFloorRemaining(), /Last group without a support floor/u);
  assert.doesNotMatch(app.lastGroupWithoutFloorRemaining(), /Remaining change-budget/u);
  assert.doesNotMatch(app.lastGroupWithoutFloorRemaining(), /First at-floor group/u);
  assert.doesNotMatch(app.lastGroupWithoutFloorRemaining(), /Last at-floor group/u);
  assert.doesNotMatch(app.lastGroupWithoutFloorRemaining(), /First below-floor group/u);
  assert.doesNotMatch(app.lastGroupWithoutFloorRemaining(), /Last below-floor group/u);
  assert.doesNotMatch(app.lastGroupWithoutFloorRemaining(), /Open/u);
  assert.doesNotMatch(app.lastGroupWithoutFloorRemaining(), /Later open/u);
  await app.click("#copy-last-group-without-floor-remaining-button");
  assert.equal(app.clipboardText(), app.lastGroupWithoutFloorRemaining());
  assert.match(app.message(), /not a legal quorum/u);
  const blocked = await savedWorkbench(new Map([["smallest-agreement:proposal:v1", JSON.stringify(draft)]]));
  blocked.blockClipboard();
  await blocked.click("#copy-last-group-without-floor-remaining-button");
  assert.equal(blocked.clipboardText(), "");
  assert.equal(blocked.focused(), "#last-group-without-floor-remaining-fallback");
  assert.match(blocked.lastGroupWithoutFloorRemaining(), /Last-without-floor remaining: 2/u);
  assert.match(blocked.message(), /Clipboard is blocked/u);
  assert.match(blocked.message(), /not a legal quorum/u);
  const none = await savedWorkbench(new Map([["smallest-agreement:proposal:v1", JSON.stringify({
    title: "No groups without floors workshop",
    threshold: 50,
    groups: [{ id: "floored", name: "Floored", weight: 1, minSupport: 40 }],
    clauses: [{ id: "one", title: "One", options: [
      { id: "original", label: "Keep original", original: true, changeCost: 0, support: { floored: 90 } },
      { id: "mid", label: "Mid option", original: false, changeCost: 1, support: { floored: 80 } },
      { id: "other", label: "Other option", original: false, changeCost: 2, support: { floored: 70 } },
    ] }],
  })]]));
  assert.equal(none.lastGroupWithoutFloorRemaining(), "Last-without-floor remaining: 0. A floor is a number you entered, not a legal quorum.\n");
  await none.click("#copy-last-group-without-floor-remaining-button");
  assert.equal(none.clipboardText(), none.lastGroupWithoutFloorRemaining());
  assert.match(none.message(), /honest zero/u);
  assert.match(none.message(), /not a legal quorum/u);
});

test("copy first-without-floor remaining writes one-line Markdown with a clipboard fallback", async () => {
  const html = await standaloneBytes();
  assert.match(html, /id="copy-first-group-without-floor-remaining-button"/u);
  assert.match(html, /Copy first-without-floor remaining/u);
  assert.match(html, /id="copy-first-group-without-floor-remaining-button"[^>]*aria-keyshortcuts="Shift\+F7"/u);
  assert.match(html, /id="first-group-without-floor-remaining-fallback"/u);
  assert.match(html, /not a legal quorum/u);
  const draft = {
    title: "First-without-floor remaining copy workshop",
    threshold: 50,
    groups: [
      { id: "open", name: "Open", weight: 4 },
      { id: "floored", name: "Floored", weight: 3, minSupport: 40 },
      { id: "later", name: "Later open", weight: 2 },
    ],
    clauses: [{ id: "one", title: "One", options: [
      { id: "original", label: "Keep original", original: true, changeCost: 0, support: { open: 90, floored: 90, later: 80 } },
      { id: "mid", label: "Mid option", original: false, changeCost: 1, support: { open: 80, floored: 80, later: 75 } },
      { id: "other", label: "Other option", original: false, changeCost: 2, support: { open: 70, floored: 70, later: 72 } },
    ] }],
  };
  const app = await savedWorkbench(new Map([["smallest-agreement:proposal:v1", JSON.stringify(draft)]]));
  assert.equal(app.firstGroupWithoutFloorRemaining(), "First-without-floor remaining: 4. A floor is a number you entered, not a legal quorum.\n");
  assert.doesNotMatch(app.firstGroupWithoutFloorRemaining(), /Last-without-floor remaining/u);
  assert.doesNotMatch(app.firstGroupWithoutFloorRemaining(), /Groups-without-floor remaining/u);
  assert.doesNotMatch(app.firstGroupWithoutFloorRemaining(), /First-without-floor cost/u);
  assert.doesNotMatch(app.firstGroupWithoutFloorRemaining(), /Groups without a support floor:/u);
  assert.doesNotMatch(app.firstGroupWithoutFloorRemaining(), /First group without a support floor/u);
  assert.doesNotMatch(app.firstGroupWithoutFloorRemaining(), /Last group without a support floor/u);
  assert.doesNotMatch(app.firstGroupWithoutFloorRemaining(), /Remaining change-budget/u);
  assert.doesNotMatch(app.firstGroupWithoutFloorRemaining(), /First at-floor group/u);
  assert.doesNotMatch(app.firstGroupWithoutFloorRemaining(), /Last at-floor group/u);
  assert.doesNotMatch(app.firstGroupWithoutFloorRemaining(), /First below-floor group/u);
  assert.doesNotMatch(app.firstGroupWithoutFloorRemaining(), /Last below-floor group/u);
  assert.doesNotMatch(app.firstGroupWithoutFloorRemaining(), /Open/u);
  assert.doesNotMatch(app.firstGroupWithoutFloorRemaining(), /Later open/u);
  await app.click("#copy-first-group-without-floor-remaining-button");
  assert.equal(app.clipboardText(), app.firstGroupWithoutFloorRemaining());
  assert.match(app.message(), /not a legal quorum/u);
  const blocked = await savedWorkbench(new Map([["smallest-agreement:proposal:v1", JSON.stringify(draft)]]));
  blocked.blockClipboard();
  await blocked.click("#copy-first-group-without-floor-remaining-button");
  assert.equal(blocked.clipboardText(), "");
  assert.equal(blocked.focused(), "#first-group-without-floor-remaining-fallback");
  assert.match(blocked.firstGroupWithoutFloorRemaining(), /First-without-floor remaining: 4/u);
  assert.match(blocked.message(), /Clipboard is blocked/u);
  assert.match(blocked.message(), /not a legal quorum/u);
  const none = await savedWorkbench(new Map([["smallest-agreement:proposal:v1", JSON.stringify({
    title: "No groups without floors workshop",
    threshold: 50,
    groups: [{ id: "floored", name: "Floored", weight: 1, minSupport: 40 }],
    clauses: [{ id: "one", title: "One", options: [
      { id: "original", label: "Keep original", original: true, changeCost: 0, support: { floored: 90 } },
      { id: "mid", label: "Mid option", original: false, changeCost: 1, support: { floored: 80 } },
      { id: "other", label: "Other option", original: false, changeCost: 2, support: { floored: 70 } },
    ] }],
  })]]));
  assert.equal(none.firstGroupWithoutFloorRemaining(), "First-without-floor remaining: 0. A floor is a number you entered, not a legal quorum.\n");
  await none.click("#copy-first-group-without-floor-remaining-button");
  assert.equal(none.clipboardText(), none.firstGroupWithoutFloorRemaining());
  assert.match(none.message(), /honest zero/u);
  assert.match(none.message(), /not a legal quorum/u);
});

test("copy first-without-floor cost writes one-line Markdown with a clipboard fallback", async () => {
  const html = await standaloneBytes();
  assert.match(html, /id="copy-first-group-without-floor-cost-button"/u);
  assert.match(html, /Copy first-without-floor cost/u);
  assert.match(html, /id="first-group-without-floor-cost-fallback"/u);
  assert.match(html, /id="copy-first-group-without-floor-remaining-button"/u);
  assert.match(html, /not a legal quorum/u);
  const draft = {
    title: "First-without-floor cost copy workshop",
    threshold: 50,
    groups: [
      { id: "open", name: "Open", weight: 4 },
      { id: "floored", name: "Floored", weight: 3, minSupport: 40 },
      { id: "later", name: "Later open", weight: 2 },
    ],
    clauses: [{ id: "one", title: "One", options: [
      { id: "original", label: "Keep original", original: true, changeCost: 0, support: { open: 90, floored: 90, later: 80 } },
      { id: "mid", label: "Mid option", original: false, changeCost: 1, support: { open: 80, floored: 80, later: 75 } },
      { id: "other", label: "Other option", original: false, changeCost: 2, support: { open: 70, floored: 70, later: 72 } },
    ] }],
  };
  const app = await savedWorkbench(new Map([["smallest-agreement:proposal:v1", JSON.stringify(draft)]]));
  assert.equal(app.firstGroupWithoutFloorCost(), "First-without-floor cost: 4. A floor is a number you entered, not a legal quorum.\n");
  assert.equal(app.firstGroupWithoutFloorRemaining(), "First-without-floor remaining: 4. A floor is a number you entered, not a legal quorum.\n");
  assert.notEqual(app.firstGroupWithoutFloorCost(), app.firstGroupWithoutFloorRemaining());
  assert.doesNotMatch(app.firstGroupWithoutFloorCost(), /First-without-floor remaining/u);
  assert.doesNotMatch(app.firstGroupWithoutFloorCost(), /Last-without-floor remaining/u);
  assert.doesNotMatch(app.firstGroupWithoutFloorCost(), /Last-without-floor cost/u);
  assert.doesNotMatch(app.firstGroupWithoutFloorCost(), /Groups-without-floor remaining/u);
  assert.doesNotMatch(app.firstGroupWithoutFloorCost(), /Groups without a support floor:/u);
  assert.doesNotMatch(app.firstGroupWithoutFloorCost(), /First group without a support floor/u);
  assert.doesNotMatch(app.firstGroupWithoutFloorCost(), /Last group without a support floor/u);
  assert.doesNotMatch(app.firstGroupWithoutFloorCost(), /Remaining change-budget/u);
  assert.doesNotMatch(app.firstGroupWithoutFloorCost(), /First at-floor group/u);
  assert.doesNotMatch(app.firstGroupWithoutFloorCost(), /Last at-floor group/u);
  assert.doesNotMatch(app.firstGroupWithoutFloorCost(), /First below-floor group/u);
  assert.doesNotMatch(app.firstGroupWithoutFloorCost(), /Last below-floor group/u);
  assert.doesNotMatch(app.firstGroupWithoutFloorCost(), /Open/u);
  assert.doesNotMatch(app.firstGroupWithoutFloorCost(), /Later open/u);
  await app.click("#copy-first-group-without-floor-cost-button");
  assert.equal(app.clipboardText(), app.firstGroupWithoutFloorCost());
  assert.match(app.message(), /not a legal quorum/u);
  await app.click("#copy-first-group-without-floor-remaining-button");
  assert.equal(app.clipboardText(), app.firstGroupWithoutFloorRemaining());
  const blocked = await savedWorkbench(new Map([["smallest-agreement:proposal:v1", JSON.stringify(draft)]]));
  blocked.blockClipboard();
  await blocked.click("#copy-first-group-without-floor-cost-button");
  assert.equal(blocked.clipboardText(), "");
  assert.equal(blocked.focused(), "#first-group-without-floor-cost-fallback");
  assert.match(blocked.firstGroupWithoutFloorCost(), /First-without-floor cost: 4/u);
  assert.match(blocked.message(), /Clipboard is blocked/u);
  assert.match(blocked.message(), /not a legal quorum/u);
  const none = await savedWorkbench(new Map([["smallest-agreement:proposal:v1", JSON.stringify({
    title: "No groups without floors workshop",
    threshold: 50,
    groups: [{ id: "floored", name: "Floored", weight: 1, minSupport: 40 }],
    clauses: [{ id: "one", title: "One", options: [
      { id: "original", label: "Keep original", original: true, changeCost: 0, support: { floored: 90 } },
      { id: "mid", label: "Mid option", original: false, changeCost: 1, support: { floored: 80 } },
      { id: "other", label: "Other option", original: false, changeCost: 2, support: { floored: 70 } },
    ] }],
  })]]));
  assert.equal(none.firstGroupWithoutFloorCost(), "First-without-floor cost: 0. A floor is a number you entered, not a legal quorum.\n");
  await none.click("#copy-first-group-without-floor-cost-button");
  assert.equal(none.clipboardText(), none.firstGroupWithoutFloorCost());
  assert.match(none.message(), /honest zero/u);
  assert.match(none.message(), /not a legal quorum/u);
});

test("copy last-without-floor cost writes one-line Markdown with a clipboard fallback", async () => {
  const html = await standaloneBytes();
  assert.match(html, /id="copy-last-group-without-floor-cost-button"/u);
  assert.match(html, /Copy last-without-floor cost/u);
  assert.match(html, /id="last-group-without-floor-cost-fallback"/u);
  assert.match(html, /id="copy-first-group-without-floor-cost-button"/u);
  assert.match(html, /not a legal quorum/u);
  const draft = {
    title: "Last-without-floor cost copy workshop",
    threshold: 50,
    groups: [
      { id: "open", name: "Open", weight: 4 },
      { id: "floored", name: "Floored", weight: 3, minSupport: 40 },
      { id: "later", name: "Later open", weight: 2 },
    ],
    clauses: [{ id: "one", title: "One", options: [
      { id: "original", label: "Keep original", original: true, changeCost: 0, support: { open: 90, floored: 90, later: 80 } },
      { id: "mid", label: "Mid option", original: false, changeCost: 1, support: { open: 80, floored: 80, later: 75 } },
      { id: "other", label: "Other option", original: false, changeCost: 2, support: { open: 70, floored: 70, later: 72 } },
    ] }],
  };
  const app = await savedWorkbench(new Map([["smallest-agreement:proposal:v1", JSON.stringify(draft)]]));
  assert.equal(app.lastGroupWithoutFloorCost(), "Last-without-floor cost: 2. A floor is a number you entered, not a legal quorum.\n");
  assert.equal(app.firstGroupWithoutFloorCost(), "First-without-floor cost: 4. A floor is a number you entered, not a legal quorum.\n");
  assert.equal(app.lastGroupWithoutFloorRemaining(), "Last-without-floor remaining: 2. A floor is a number you entered, not a legal quorum.\n");
  assert.notEqual(app.lastGroupWithoutFloorCost(), app.firstGroupWithoutFloorCost());
  assert.notEqual(app.lastGroupWithoutFloorCost(), app.lastGroupWithoutFloorRemaining());
  assert.doesNotMatch(app.lastGroupWithoutFloorCost(), /First-without-floor cost/u);
  assert.doesNotMatch(app.lastGroupWithoutFloorCost(), /First-without-floor remaining/u);
  assert.doesNotMatch(app.lastGroupWithoutFloorCost(), /Last-without-floor remaining/u);
  assert.doesNotMatch(app.lastGroupWithoutFloorCost(), /Groups-without-floor remaining/u);
  assert.doesNotMatch(app.lastGroupWithoutFloorCost(), /Groups without a support floor:/u);
  assert.doesNotMatch(app.lastGroupWithoutFloorCost(), /First group without a support floor/u);
  assert.doesNotMatch(app.lastGroupWithoutFloorCost(), /Last group without a support floor/u);
  assert.doesNotMatch(app.lastGroupWithoutFloorCost(), /Remaining change-budget/u);
  assert.doesNotMatch(app.lastGroupWithoutFloorCost(), /First at-floor group/u);
  assert.doesNotMatch(app.lastGroupWithoutFloorCost(), /Last at-floor group/u);
  assert.doesNotMatch(app.lastGroupWithoutFloorCost(), /First below-floor group/u);
  assert.doesNotMatch(app.lastGroupWithoutFloorCost(), /Last below-floor group/u);
  assert.doesNotMatch(app.lastGroupWithoutFloorCost(), /Open/u);
  assert.doesNotMatch(app.lastGroupWithoutFloorCost(), /Later open/u);
  await app.click("#copy-last-group-without-floor-cost-button");
  assert.equal(app.clipboardText(), app.lastGroupWithoutFloorCost());
  assert.match(app.message(), /not a legal quorum/u);
  await app.click("#copy-first-group-without-floor-cost-button");
  assert.equal(app.clipboardText(), app.firstGroupWithoutFloorCost());
  const blocked = await savedWorkbench(new Map([["smallest-agreement:proposal:v1", JSON.stringify(draft)]]));
  blocked.blockClipboard();
  await blocked.click("#copy-last-group-without-floor-cost-button");
  assert.equal(blocked.clipboardText(), "");
  assert.equal(blocked.focused(), "#last-group-without-floor-cost-fallback");
  assert.match(blocked.lastGroupWithoutFloorCost(), /Last-without-floor cost: 2/u);
  assert.match(blocked.message(), /Clipboard is blocked/u);
  assert.match(blocked.message(), /not a legal quorum/u);
  const none = await savedWorkbench(new Map([["smallest-agreement:proposal:v1", JSON.stringify({
    title: "No groups without floors workshop",
    threshold: 50,
    groups: [{ id: "floored", name: "Floored", weight: 1, minSupport: 40 }],
    clauses: [{ id: "one", title: "One", options: [
      { id: "original", label: "Keep original", original: true, changeCost: 0, support: { floored: 90 } },
      { id: "mid", label: "Mid option", original: false, changeCost: 1, support: { floored: 80 } },
      { id: "other", label: "Other option", original: false, changeCost: 2, support: { floored: 70 } },
    ] }],
  })]]));
  assert.equal(none.lastGroupWithoutFloorCost(), "Last-without-floor cost: 0. A floor is a number you entered, not a legal quorum.\n");
  await none.click("#copy-last-group-without-floor-cost-button");
  assert.equal(none.clipboardText(), none.lastGroupWithoutFloorCost());
  assert.match(none.message(), /honest zero/u);
  assert.match(none.message(), /not a legal quorum/u);
});

test("copy first at-floor group writes one-line Markdown with a clipboard fallback", async () => {
  const html = await standaloneBytes();
  assert.match(html, /id="copy-first-group-at-floor-button"/u);
  assert.match(html, /Copy first at-floor group/u);
  assert.match(html, /id="first-group-at-floor-fallback"/u);
  assert.match(html, /not a legal identity/u);
  const draft = {
    title: "First at-floor copy workshop",
    threshold: 50,
    groups: [
      { id: "cleared", name: "Cleared", weight: 1, minSupport: 40 },
      { id: "short", name: "Short", weight: 1, minSupport: 90 },
      { id: "later", name: "Later", weight: 1, minSupport: 40 },
    ],
    clauses: [{ id: "one", title: "One", options: [
      { id: "original", label: "Keep original", original: true, changeCost: 0, support: { cleared: 90, short: 20, later: 80 } },
      { id: "mid", label: "Mid option", original: false, changeCost: 1, support: { cleared: 80, short: 30, later: 75 } },
      { id: "other", label: "Other option", original: false, changeCost: 2, support: { cleared: 70, short: 40, later: 72 } },
    ] }],
  };
  const app = await savedWorkbench(new Map([["smallest-agreement:proposal:v1", JSON.stringify(draft)]]));
  assert.equal(app.firstGroupAtFloor(), "First at-floor group: Cleared. A floor is a number you entered, not a legal quorum. The label is not a legal identity.\n");
  assert.doesNotMatch(app.firstGroupAtFloor(), /Last at-floor group/u);
  assert.doesNotMatch(app.firstGroupAtFloor(), /First at-or-above-threshold group/u);
  assert.doesNotMatch(app.firstGroupAtFloor(), /Later/u);
  await app.click("#copy-first-group-at-floor-button");
  assert.equal(app.clipboardText(), app.firstGroupAtFloor());
  assert.match(app.message(), /not a legal quorum/u);
  assert.match(app.message(), /not a legal identity/u);
  const blocked = await savedWorkbench(new Map([["smallest-agreement:proposal:v1", JSON.stringify(draft)]]));
  blocked.blockClipboard();
  await blocked.click("#copy-first-group-at-floor-button");
  assert.equal(blocked.clipboardText(), "");
  assert.equal(blocked.focused(), "#first-group-at-floor-fallback");
  assert.match(blocked.firstGroupAtFloor(), /First at-floor group: Cleared/u);
  assert.match(blocked.message(), /Clipboard is blocked/u);
  assert.match(blocked.message(), /not a legal identity/u);
  const none = await savedWorkbench(new Map([["smallest-agreement:proposal:v1", JSON.stringify({
    title: "No at-floor groups workshop",
    threshold: 50,
    groups: [{ id: "open", name: "Open", weight: 1 }],
    clauses: [{ id: "one", title: "One", options: [
      { id: "original", label: "Keep original", original: true, changeCost: 0, support: { open: 90 } },
      { id: "mid", label: "Mid option", original: false, changeCost: 1, support: { open: 80 } },
      { id: "other", label: "Other option", original: false, changeCost: 2, support: { open: 70 } },
    ] }],
  })]]));
  assert.equal(none.firstGroupAtFloor(), "No group currently meets their support floor, so there is no first at-floor group label to copy. A floor is a number you entered, not a legal quorum. The label is not a legal identity.\n");
  await none.click("#copy-first-group-at-floor-button");
  assert.equal(none.clipboardText(), none.firstGroupAtFloor());
  assert.match(none.message(), /honest empty/u);
  assert.match(none.message(), /not a legal identity/u);
});

test("copy current locks writes Markdown with a textarea fallback and is not a legal hold", async () => {
  const html = await standaloneBytes();
  assert.match(html, /id="copy-locks-button"/u);
  assert.match(html, /id="locks-markdown-fallback"/u);
  assert.match(html, /not a legal hold/u);
  const app = await savedWorkbench(new Map());
  app.clickAction("toggle-clause-lock", { clauseId: "hours", optionId: "hours-pilot" });
  assert.match(app.locksMarkdown(), /# Current clause locks/u);
  assert.match(app.locksMarkdown(), /Park access hours: Trial a 21:00 Friday close for three months/u);
  assert.match(app.locksMarkdown(), /Weekend market use: Unlocked/u);
  await app.click("#copy-locks-button");
  assert.equal(app.clipboardText(), app.locksMarkdown());
  assert.match(app.clipboardText(), /not a legal hold/u);
  assert.match(app.message(), /not a legal hold/u);
  const blocked = await savedWorkbench(new Map());
  blocked.blockClipboard();
  await blocked.click("#copy-locks-button");
  assert.equal(blocked.clipboardText(), "");
  assert.equal(blocked.focused(), "#locks-markdown-fallback");
  assert.match(blocked.message(), /Clipboard is blocked/u);
  assert.match(blocked.message(), /not a legal hold/u);
});

test("copy change-cost table writes formula-safe CSV with a textarea fallback", async () => {
  const html = await standaloneBytes();
  assert.match(html, /id="copy-change-cost-button"/u);
  assert.match(html, /id="change-cost-csv-fallback"/u);
  const draft = {
    title: "Cost table workshop",
    threshold: 70,
    groups: [{ id: "g", name: "Group", weight: 1 }],
    clauses: [{ id: "one", title: "Hours", options: [
      { id: "one-original", label: "Keep", original: true, changeCost: 0, support: { g: 40 } },
      { id: "one-change", label: "Change", original: false, changeCost: 2, support: { g: 90 } },
      { id: "one-other", label: "Other", original: false, changeCost: 8, support: { g: 20 } },
    ] }],
  };
  const app = await savedWorkbench(new Map([["smallest-agreement:proposal:v1", JSON.stringify(draft)]]));
  assert.match(app.changeCostCsv(), /^"clause","original_option","recommended_option","cost_delta"\r\n/u);
  assert.match(app.changeCostCsv(), /"Hours","Keep","Change","2"/u);
  await app.click("#copy-change-cost-button");
  assert.equal(app.clipboardText(), app.changeCostCsv());
  const blocked = await savedWorkbench(new Map([["smallest-agreement:proposal:v1", JSON.stringify(draft)]]));
  blocked.blockClipboard();
  await blocked.click("#copy-change-cost-button");
  assert.equal(blocked.clipboardText(), "");
  assert.equal(blocked.focused(), "#change-cost-csv-fallback");
  assert.match(blocked.message(), /Clipboard is blocked/u);
});

test("copy veto blockers writes a constraint list rather than a legitimacy claim", async () => {
  const key = "smallest-agreement:proposal:v1";
  const draft = {
    title: "Veto copy workshop",
    threshold: 80,
    groups: [
      { id: "majority", name: "Majority", weight: 9 },
      { id: "minority", name: "Minority", weight: 1, veto: true },
    ],
    clauses: [{ id: "one", title: "One", options: [
      { id: "original", label: "Keep original", original: true, changeCost: 0, support: { majority: 90, minority: 10 } },
      { id: "mid", label: "Mid option", original: false, changeCost: 1, support: { majority: 88, minority: 20 } },
      { id: "other", label: "Other option", original: false, changeCost: 2, support: { majority: 85, minority: 30 } },
    ] }],
  };
  const app = await savedWorkbench(new Map([[key, JSON.stringify(draft)]]));
  await app.click("#copy-veto-button");
  assert.match(app.clipboardText(), /^# Veto constraint list\n/u);
  assert.match(app.clipboardText(), /numerical constraint list, not a legal veto or a claim of legitimacy/u);
  assert.match(app.clipboardText(), /Minority: 10\.0% against required 80\.0%/u);
  assert.match(app.message(), /not a legitimacy claim/u);
});

test("comparing two workshop JSON files lists missing group and clause ids honestly", async () => {
  const app = await savedWorkbench(new Map());
  const neighbourhood = {
    title: "Left workshop",
    threshold: 70,
    groups: [{ id: "g", name: "Group", weight: 1 }],
    clauses: [{ id: "clause", title: "Clause", options: [
      { id: "original", label: "Original", original: true, changeCost: 0, support: { g: 60 } },
      { id: "alternative", label: "Alternative", original: false, changeCost: 1, support: { g: 80 } },
      { id: "other", label: "Other", original: false, changeCost: 2, support: { g: 90 } },
    ] }],
  };
  const other = {
    title: "Right workshop",
    threshold: 70,
    groups: [{ id: "other", name: "Other group", weight: 1 }],
    clauses: [{ id: "path", title: "Path", options: [
      { id: "original", label: "Original", original: true, changeCost: 0, support: { other: 60 } },
      { id: "alternative", label: "Alternative", original: false, changeCost: 1, support: { other: 80 } },
      { id: "other", label: "Other", original: false, changeCost: 2, support: { other: 90 } },
    ] }],
  };
  await app.compareFiles(JSON.stringify(neighbourhood), JSON.stringify(other));
  assert.match(app.fileComparison(), /only in the first file/u);
  assert.match(app.fileComparison(), /only in the second file/u);
  assert.match(app.fileComparison(), /not share the same group and clause identifiers/u);
  assert.match(app.fileComparison(), /rather than filled with zeros/u);
  assert.match(app.message(), /Missing group and clause ids are listed/u);
});

test("groups CSV import replaces the roster with named errors and supports undo", async () => {
  const storage = new Map();
  const app = await savedWorkbench(storage);
  app.setTitle("Workshop draft for group CSV");
  const before = JSON.parse(storage.get("smallest-agreement:proposal:v1"));
  await app.importGroupsCsv("name,weight,hidden\nA,1,x\n");
  assert.match(app.message(), /Groups CSV import failed \(unknown_column\)/u);
  assert.equal(JSON.parse(storage.get("smallest-agreement:proposal:v1")).groups.length, before.groups.length);
  const supportHeaders = before.clauses.flatMap((clause) => clause.options.map((option) => `${clause.id}:${option.id}`));
  const row = ["New residents", "4", "", "no", ...supportHeaders.map(() => "55")].join(",");
  await app.importGroupsCsv(`name,weight,min_support,veto,${supportHeaders.join(",")}\n${row}\n`);
  const after = JSON.parse(storage.get("smallest-agreement:proposal:v1"));
  assert.equal(after.groups.length, 1);
  assert.equal(after.groups[0].name, "New residents");
  assert.equal(after.groups[0].weight, 4);
  assert.match(app.message(), /Imported 1 participant groups/u);
  app.click("#undo-button");
  assert.equal(JSON.parse(storage.get("smallest-agreement:proposal:v1")).groups.length, before.groups.length);
});

test("clauses CSV import replaces options with named errors and supports undo", async () => {
  const storage = new Map();
  const app = await savedWorkbench(storage);
  app.setTitle("Workshop draft for clause CSV");
  const before = JSON.parse(storage.get("smallest-agreement:proposal:v1"));
  await app.importClausesCsv("clause_id,option_id,clause_title,option_label,original,change_cost,hidden\nhours,hours-original,Hours,Keep,yes,0,x\n");
  assert.match(app.message(), /Clauses CSV import failed \(unknown_column\)/u);
  assert.equal(JSON.parse(storage.get("smallest-agreement:proposal:v1")).clauses.length, before.clauses.length);
  const rows = [
    "hours,hours-original,Park hours,Close at 20:00,yes,0",
    "hours,hours-seasonal,Park hours,Seasonal close,no,2",
    "hours,hours-pilot,Park hours,Friday trial,no,3",
  ].join("\n");
  await app.importClausesCsv(`clause_id,option_id,clause_title,option_label,original,change_cost\n${rows}\n`);
  const after = JSON.parse(storage.get("smallest-agreement:proposal:v1"));
  assert.equal(after.clauses.length, 1);
  assert.equal(after.clauses[0].title, "Park hours");
  assert.equal(after.clauses[0].options[0].label, "Close at 20:00");
  assert.equal(after.clauses[0].options[0].support.residents, before.clauses[0].options[0].support.residents);
  assert.match(app.message(), /Imported 1 clauses/u);
  app.click("#undo-button");
  assert.equal(JSON.parse(storage.get("smallest-agreement:proposal:v1")).clauses.length, before.clauses.length);
});

test("pasting TSV or CSV clause options uses the same validation and is undoable", async () => {
  const storage = new Map();
  const app = await savedWorkbench(storage);
  app.setTitle("Workshop draft for pasted clauses");
  const before = JSON.parse(storage.get("smallest-agreement:proposal:v1"));
  app.pasteClauses("clause_id\toption_id\tclause_title\toption_label\toriginal\tchange_cost\thidden\nhours\thours-original\tHours\tKeep\tyes\t0\tx\n");
  app.click("#clause-paste-button");
  assert.match(app.message(), /Pasted clauses failed \(unknown_column\)/u);
  assert.equal(JSON.parse(storage.get("smallest-agreement:proposal:v1")).clauses.length, before.clauses.length);
  const tsv = [
    "clause_id\toption_id\tclause_title\toption_label\toriginal\tchange_cost",
    "hours\thours-original\tPark hours\tClose at 20:00\tyes\t0",
    "hours\thours-seasonal\tPark hours\tSeasonal close\tno\t2",
    "hours\thours-pilot\tPark hours\tFriday trial\tno\t3",
  ].join("\n");
  app.pasteClauses(tsv);
  app.click("#clause-paste-button");
  const after = JSON.parse(storage.get("smallest-agreement:proposal:v1"));
  assert.equal(after.clauses.length, 1);
  assert.equal(after.clauses[0].title, "Park hours");
  assert.equal(after.clauses[0].options[0].label, "Close at 20:00");
  assert.equal(after.clauses[0].options[0].support.residents, before.clauses[0].options[0].support.residents);
  assert.match(app.message(), /Imported 1 clauses \(3 options\) from the pasted table/u);
  app.click("#undo-button");
  assert.equal(JSON.parse(storage.get("smallest-agreement:proposal:v1")).clauses.length, before.clauses.length);
  const csv = [
    "clause_id,option_id,clause_title,option_label,original,change_cost",
    "path,path-original,Path lighting,Keep lamps,yes,0",
    "path,path-warm,Path lighting,Warm lights,no,3",
    "path,path-motion,Path lighting,Motion lights,no,4",
  ].join("\n");
  app.pasteClauses(csv);
  app.click("#clause-paste-button");
  const csvAfter = JSON.parse(storage.get("smallest-agreement:proposal:v1"));
  assert.equal(csvAfter.clauses[0].id, "path");
  assert.equal(csvAfter.clauses[0].title, "Path lighting");
  assert.match(app.message(), /from the pasted table/u);
});

test("pasting TSV or CSV participant groups uses the same validation and rejects partial pastes", async () => {
  const storage = new Map();
  const app = await savedWorkbench(storage);
  app.setTitle("Workshop draft for pasted groups");
  const before = JSON.parse(storage.get("smallest-agreement:proposal:v1"));
  const supportHeaders = before.clauses.flatMap((clause) => clause.options.map((option) => `${clause.id}:${option.id}`));
  app.pasteGroups(`name\tweight\thidden\nA\t1\tx\n`);
  app.click("#groups-paste-button");
  assert.match(app.message(), /Pasted groups failed \(unknown_column\)/u);
  assert.equal(JSON.parse(storage.get("smallest-agreement:proposal:v1")).groups.length, before.groups.length);
  const partial = ["name", "weight", "min_support", "veto", ...supportHeaders].join("\t")
    + "\nGood\t2\t\tno\t" + supportHeaders.map(() => "55").join("\t")
    + "\nBad\tnope\t\tno\t" + supportHeaders.map(() => "40").join("\t") + "\n";
  app.pasteGroups(partial);
  app.click("#groups-paste-button");
  assert.match(app.message(), /Pasted groups failed \(invalid_weight\)/u);
  assert.equal(JSON.parse(storage.get("smallest-agreement:proposal:v1")).groups.length, before.groups.length);
  const tsv = ["name", "weight", "min_support", "veto", ...supportHeaders].join("\t")
    + "\nStallholders\t4\t\tno\t" + supportHeaders.map(() => "55").join("\t") + "\n";
  app.pasteGroups(tsv);
  app.click("#groups-paste-button");
  const after = JSON.parse(storage.get("smallest-agreement:proposal:v1"));
  assert.equal(after.groups.length, 1);
  assert.equal(after.groups[0].name, "Stallholders");
  assert.match(app.message(), /Imported 1 participant groups from the pasted table/u);
  app.click("#undo-button");
  assert.equal(JSON.parse(storage.get("smallest-agreement:proposal:v1")).groups.length, before.groups.length);
});

test("locks JSON import replaces every lock, fails closed on unknown ids, and can be undone", async () => {
  const storage = new Map();
  const app = await savedWorkbench(storage);
  app.setTitle("Workshop draft for locks JSON");
  app.clickAction("toggle-clause-lock", { clauseId: "hours", optionId: "hours-pilot" });
  app.clickAction("toggle-clause-lock", { clauseId: "market", optionId: "market-monthly" });
  const before = JSON.parse(storage.get("smallest-agreement:proposal:v1"));
  assert.equal(before.clauses.find((clause) => clause.id === "hours").lockedOptionId, "hours-pilot");
  await app.importLocksJson(JSON.stringify({
    format: "smallest-agreement-locks",
    version: 1,
    locks: [{ clauseId: "missing", optionId: "hours-pilot" }],
  }));
  assert.match(app.message(), /Locks JSON import failed \(unknown_clause\)/u);
  assert.equal(JSON.parse(storage.get("smallest-agreement:proposal:v1")).clauses.find((clause) => clause.id === "hours").lockedOptionId, "hours-pilot");
  await app.importLocksJson(JSON.stringify({
    format: "smallest-agreement-locks",
    version: 1,
    locks: [{ clauseId: "path", optionId: "path-warm" }],
  }));
  const after = JSON.parse(storage.get("smallest-agreement:proposal:v1"));
  assert.equal(after.clauses.find((clause) => clause.id === "hours").lockedOptionId, undefined);
  assert.equal(after.clauses.find((clause) => clause.id === "market").lockedOptionId, undefined);
  assert.equal(after.clauses.find((clause) => clause.id === "path").lockedOptionId, "path-warm");
  assert.match(app.message(), /Imported 1 clause lock/u);
  app.click("#undo-button");
  const undone = JSON.parse(storage.get("smallest-agreement:proposal:v1"));
  assert.equal(undone.clauses.find((clause) => clause.id === "hours").lockedOptionId, "hours-pilot");
  assert.equal(undone.clauses.find((clause) => clause.id === "market").lockedOptionId, "market-monthly");
});

test("clause density persists in workspace JSON and local workspace prefs", async () => {
  const storage = new Map();
  const app = await savedWorkbench(storage);
  app.setTitle("Workshop draft for density");
  app.setDensity("compact");
  assert.match(app.clauseDensityClass(), /clause-density-compact/u);
  assert.equal(JSON.parse(storage.get("smallest-agreement:workspace:v1")).clauseDensity, "compact");
  const proposal = JSON.parse(storage.get("smallest-agreement:proposal:v1"));
  const workspace = JSON.stringify({
    format: "smallest-agreement-workspace",
    version: 1,
    clauseDensity: "compact",
    proposal,
  });
  await app.importJson(workspace);
  assert.match(app.message(), /Imported workspace/u);
  assert.equal(JSON.parse(storage.get("smallest-agreement:workspace:v1")).clauseDensity, "compact");
});

test("workspace JSON persists veto-only and locked-clause filters that the solver ignores", async () => {
  const storage = new Map();
  const app = await savedWorkbench(storage);
  app.setTitle("Workshop draft for display filters");
  app.filterVetoGroups(true);
  app.filterLockedClauses(true);
  const prefs = JSON.parse(storage.get("smallest-agreement:workspace:v1"));
  assert.equal(prefs.vetoGroupsOnly, true);
  assert.equal(prefs.lockedClausesOnly, true);
  const proposal = JSON.parse(storage.get("smallest-agreement:proposal:v1"));
  assert.equal(Object.hasOwn(proposal, "vetoGroupsOnly"), false);
  assert.equal(Object.hasOwn(proposal, "lockedClausesOnly"), false);
  assert.equal(Object.hasOwn(proposal, "changedClausesOnly"), false);
  assert.equal(Object.hasOwn(proposal, "belowFloorGroupsOnly"), false);
  assert.equal(Object.hasOwn(proposal, "overBudgetClausesOnly"), false);
  assert.equal(Object.hasOwn(proposal, "hideGroupsAtFloor"), false);
  assert.equal(Object.hasOwn(proposal, "hideGroupsWithoutFloors"), false);
  assert.equal(Object.hasOwn(proposal, "hideUnlockedClauses"), false);
  assert.equal(Object.hasOwn(proposal, "hideLockedClauses"), false);
  assert.equal(Object.hasOwn(proposal, "hideGroupsMeetingThreshold"), false);
  assert.equal(Object.hasOwn(proposal, "hideGroupsBelowThreshold"), false);
  assert.equal(Object.hasOwn(proposal, "hideVetoGroups"), false);
  assert.equal(Object.hasOwn(proposal, "hideNonVetoGroups"), false);
  assert.equal(Object.hasOwn(proposal, "hideFirstVetoGroup"), false);
  assert.equal(Object.hasOwn(proposal, "hideLastVetoGroup"), false);
  assert.equal(Object.hasOwn(proposal, "hideFirstNonVetoGroup"), false);
  assert.equal(Object.hasOwn(proposal, "hideLastNonVetoGroup"), false);
  assert.equal(Object.hasOwn(proposal, "hideLastGroupBelowThreshold"), false);
  assert.equal(Object.hasOwn(proposal, "hideFirstGroupBelowThreshold"), false);
  assert.equal(Object.hasOwn(proposal, "hideLastGroupAtOrAboveThreshold"), false);
  assert.equal(Object.hasOwn(proposal, "hideFirstGroupAtOrAboveThreshold"), false);
  assert.equal(Object.hasOwn(proposal, "hideLastGroupAtFloor"), false);
  assert.equal(Object.hasOwn(proposal, "hideFirstGroupAtFloor"), false);
  assert.equal(Object.hasOwn(proposal, "hideFirstGroupBelowFloor"), false);
  assert.equal(Object.hasOwn(proposal, "hideLastGroupBelowFloor"), false);
  assert.equal(Object.hasOwn(proposal, "hideLastGroupWithoutFloor"), false);
  assert.equal(Object.hasOwn(proposal, "hideFirstGroupWithoutFloor"), false);
  assert.equal(Object.hasOwn(proposal, "noCheaperRemainingClausesOnly"), false);
  assert.equal(proposal.clauses.length, 3);
  assert.match(app.groups(), /No veto groups match this filter/u);
  assert.match(app.clauses(), /No locked clauses match this filter/u);
  assert.match(app.ballot(), /Park access hours/u);
  app.filterChangedClauses(true);
  app.filterBelowFloorGroups(true);
  app.filterOverBudgetClauses(true);
  app.filterHideGroupsAtFloor(true);
  app.filterHideGroupsWithoutFloors(true);
  app.filterNoCheaperRemainingClauses(true);
  app.filterHideUnlockedClauses(true);
  app.filterHideLockedClauses(true);
  app.filterHideGroupsMeetingThreshold(true);
  app.filterHideGroupsBelowThreshold(true);
  app.filterHideVetoGroups(true);
  app.filterHideNonVetoGroups(true);
  app.filterHideFirstVetoGroup(true);
  app.filterHideLastVetoGroup(true);
  app.filterHideFirstNonVetoGroup(true);
  app.filterHideLastNonVetoGroup(true);
  app.filterHideLastGroupBelowThreshold(true);
  app.filterHideFirstGroupBelowThreshold(true);
  app.filterHideLastGroupAtOrAboveThreshold(true);
  app.filterHideFirstGroupAtOrAboveThreshold(true);
  app.filterHideLastGroupAtFloor(true);
  app.filterHideFirstGroupAtFloor(true);
  app.filterHideFirstGroupBelowFloor(true);
  app.filterHideLastGroupBelowFloor(true);
  app.filterHideLastGroupWithoutFloor(true);
  app.filterHideFirstGroupWithoutFloor(true);
  const nextPrefs = JSON.parse(storage.get("smallest-agreement:workspace:v1"));
  assert.equal(nextPrefs.changedClausesOnly, true);
  assert.equal(nextPrefs.belowFloorGroupsOnly, true);
  assert.equal(nextPrefs.overBudgetClausesOnly, true);
  assert.equal(nextPrefs.hideGroupsAtFloor, true);
  assert.equal(nextPrefs.hideGroupsWithoutFloors, true);
  assert.equal(nextPrefs.noCheaperRemainingClausesOnly, true);
  assert.equal(nextPrefs.hideUnlockedClauses, true);
  assert.equal(nextPrefs.hideLockedClauses, true);
  assert.equal(nextPrefs.hideGroupsMeetingThreshold, true);
  assert.equal(nextPrefs.hideGroupsBelowThreshold, true);
  assert.equal(nextPrefs.hideVetoGroups, true);
  assert.equal(nextPrefs.hideNonVetoGroups, true);
  assert.equal(nextPrefs.hideFirstVetoGroup, true);
  assert.equal(nextPrefs.hideLastVetoGroup, true);
  assert.equal(nextPrefs.hideFirstNonVetoGroup, true);
  assert.equal(nextPrefs.hideLastNonVetoGroup, true);
  assert.equal(nextPrefs.hideLastGroupBelowThreshold, true);
  assert.equal(nextPrefs.hideFirstGroupBelowThreshold, true);
  assert.equal(nextPrefs.hideLastGroupAtOrAboveThreshold, true);
  assert.equal(nextPrefs.hideFirstGroupAtOrAboveThreshold, true);
  assert.equal(nextPrefs.hideLastGroupAtFloor, true);
  assert.equal(nextPrefs.hideFirstGroupAtFloor, true);
  assert.equal(nextPrefs.hideFirstGroupBelowFloor, true);
  assert.equal(nextPrefs.hideLastGroupBelowFloor, true);
  assert.equal(nextPrefs.hideLastGroupWithoutFloor, true);
  assert.equal(nextPrefs.hideFirstGroupWithoutFloor, true);
  app.filterVetoGroups(false);
  app.filterLockedClauses(false);
  await app.importJson(JSON.stringify({
    format: "smallest-agreement-workspace",
    version: 1,
    vetoGroupsOnly: true,
    lockedClausesOnly: true,
    proposal,
  }));
  assert.match(app.message(), /Imported workspace/u);
  assert.match(app.groups(), /No veto groups match this filter/u);
  assert.match(app.clauses(), /No locked clauses match this filter/u);
  assert.equal(JSON.parse(storage.get("smallest-agreement:workspace:v1")).vetoGroupsOnly, true);
  await app.importJson(JSON.stringify({
    format: "smallest-agreement-workspace",
    version: 1,
    proposal,
  }));
  assert.match(app.groups(), /Residents/u);
  assert.match(app.clauses(), /Park access hours/u);
  assert.equal(JSON.parse(storage.get("smallest-agreement:workspace:v1")).vetoGroupsOnly, false);
  assert.equal(JSON.parse(storage.get("smallest-agreement:workspace:v1")).lockedClausesOnly, false);
  assert.equal(JSON.parse(storage.get("smallest-agreement:workspace:v1")).hideGroupsWithoutFloors, false);
  assert.equal(JSON.parse(storage.get("smallest-agreement:workspace:v1")).hideUnlockedClauses, false);
  assert.equal(JSON.parse(storage.get("smallest-agreement:workspace:v1")).hideLockedClauses, false);
  assert.equal(JSON.parse(storage.get("smallest-agreement:workspace:v1")).hideGroupsMeetingThreshold, false);
  assert.equal(JSON.parse(storage.get("smallest-agreement:workspace:v1")).hideGroupsBelowThreshold, false);
  assert.equal(JSON.parse(storage.get("smallest-agreement:workspace:v1")).hideVetoGroups, false);
  assert.equal(JSON.parse(storage.get("smallest-agreement:workspace:v1")).hideNonVetoGroups, false);
  assert.equal(JSON.parse(storage.get("smallest-agreement:workspace:v1")).hideFirstVetoGroup, false);
  assert.equal(JSON.parse(storage.get("smallest-agreement:workspace:v1")).hideLastVetoGroup, false);
  assert.equal(JSON.parse(storage.get("smallest-agreement:workspace:v1")).hideFirstNonVetoGroup, false);
  assert.equal(JSON.parse(storage.get("smallest-agreement:workspace:v1")).hideLastNonVetoGroup, false);
  assert.equal(JSON.parse(storage.get("smallest-agreement:workspace:v1")).hideLastGroupBelowThreshold, false);
  assert.equal(JSON.parse(storage.get("smallest-agreement:workspace:v1")).hideFirstGroupBelowThreshold, false);
  assert.equal(JSON.parse(storage.get("smallest-agreement:workspace:v1")).hideLastGroupAtOrAboveThreshold, false);
  assert.equal(JSON.parse(storage.get("smallest-agreement:workspace:v1")).hideFirstGroupAtOrAboveThreshold, false);
  assert.equal(JSON.parse(storage.get("smallest-agreement:workspace:v1")).hideLastGroupAtFloor, false);
  assert.equal(JSON.parse(storage.get("smallest-agreement:workspace:v1")).hideFirstGroupAtFloor, false);
  assert.equal(JSON.parse(storage.get("smallest-agreement:workspace:v1")).hideFirstGroupBelowFloor, false);
  assert.equal(JSON.parse(storage.get("smallest-agreement:workspace:v1")).hideLastGroupBelowFloor, false);
  assert.equal(JSON.parse(storage.get("smallest-agreement:workspace:v1")).hideLastGroupWithoutFloor, false);
  assert.equal(JSON.parse(storage.get("smallest-agreement:workspace:v1")).hideFirstGroupWithoutFloor, false);
  await app.importJson(JSON.stringify({
    format: "smallest-agreement-workspace",
    version: 1,
    vetoGroupsOnly: "yes",
    proposal,
  }));
  assert.match(app.message(), /Import failed \(invalid_filter\)/u);
  await app.importJson(JSON.stringify({
    format: "smallest-agreement-workspace",
    version: 1,
    hideVetoGroups: "yes",
    proposal,
  }));
  assert.match(app.message(), /Import failed \(invalid_filter\)/u);
  await app.importJson(JSON.stringify({
    format: "smallest-agreement-workspace",
    version: 1,
    hideNonVetoGroups: "yes",
    proposal,
  }));
  assert.match(app.message(), /Import failed \(invalid_filter\)/u);
  await app.importJson(JSON.stringify({
    format: "smallest-agreement-workspace",
    version: 1,
    hideFirstVetoGroup: "yes",
    proposal,
  }));
  assert.match(app.message(), /Import failed \(invalid_filter\)/u);
  await app.importJson(JSON.stringify({
    format: "smallest-agreement-workspace",
    version: 1,
    hideLastVetoGroup: "yes",
    proposal,
  }));
  assert.match(app.message(), /Import failed \(invalid_filter\)/u);
  await app.importJson(JSON.stringify({
    format: "smallest-agreement-workspace",
    version: 1,
    hideFirstNonVetoGroup: "yes",
    proposal,
  }));
  assert.match(app.message(), /Import failed \(invalid_filter\)/u);
  await app.importJson(JSON.stringify({
    format: "smallest-agreement-workspace",
    version: 1,
    hideLastNonVetoGroup: "yes",
    proposal,
  }));
  assert.match(app.message(), /Import failed \(invalid_filter\)/u);
  await app.importJson(JSON.stringify({
    format: "smallest-agreement-workspace",
    version: 1,
    hideLastGroupBelowThreshold: "yes",
    proposal,
  }));
  assert.match(app.message(), /Import failed \(invalid_filter\)/u);
  await app.importJson(JSON.stringify({
    format: "smallest-agreement-workspace",
    version: 1,
    hideFirstGroupBelowThreshold: "yes",
    proposal,
  }));
  assert.match(app.message(), /Import failed \(invalid_filter\)/u);
  await app.importJson(JSON.stringify({
    format: "smallest-agreement-workspace",
    version: 1,
    hideLastGroupAtOrAboveThreshold: "yes",
    proposal,
  }));
  assert.match(app.message(), /Import failed \(invalid_filter\)/u);
  await app.importJson(JSON.stringify({
    format: "smallest-agreement-workspace",
    version: 1,
    hideFirstGroupAtOrAboveThreshold: "yes",
    proposal,
  }));
  assert.match(app.message(), /Import failed \(invalid_filter\)/u);
  await app.importJson(JSON.stringify({
    format: "smallest-agreement-workspace",
    version: 1,
    hideLastGroupAtFloor: "yes",
    proposal,
  }));
  assert.match(app.message(), /Import failed \(invalid_filter\)/u);
  await app.importJson(JSON.stringify({
    format: "smallest-agreement-workspace",
    version: 1,
    hideFirstGroupAtFloor: "yes",
    proposal,
  }));
  assert.match(app.message(), /Import failed \(invalid_filter\)/u);
  await app.importJson(JSON.stringify({
    format: "smallest-agreement-workspace",
    version: 1,
    hideFirstGroupBelowFloor: "yes",
    proposal,
  }));
  assert.match(app.message(), /Import failed \(invalid_filter\)/u);
  await app.importJson(JSON.stringify({
    format: "smallest-agreement-workspace",
    version: 1,
    hideLastGroupBelowFloor: "yes",
    proposal,
  }));
  assert.match(app.message(), /Import failed \(invalid_filter\)/u);
  await app.importJson(JSON.stringify({
    format: "smallest-agreement-workspace",
    version: 1,
    hideLastGroupWithoutFloor: "yes",
    proposal,
  }));
  assert.match(app.message(), /Import failed \(invalid_filter\)/u);
  await app.importJson(JSON.stringify({
    format: "smallest-agreement-workspace",
    version: 1,
    hideFirstGroupWithoutFloor: "yes",
    proposal,
  }));
  assert.match(app.message(), /Import failed \(invalid_filter\)/u);
  await app.importJson(JSON.stringify({
    format: "smallest-agreement-workspace",
    version: 1,
    extra: true,
    proposal,
  }));
  assert.match(app.message(), /Import failed \(unknown_key\)/u);
});

test("resetting one group's support to blank is undoable and leaves other scores", async () => {
  const storage = new Map();
  const app = await savedWorkbench(storage);
  app.setTitle("Workshop draft for blank support");
  const before = JSON.parse(storage.get("smallest-agreement:proposal:v1"));
  const residents = before.clauses[0].options[0].support.residents;
  const shopkeepers = before.clauses[0].options[0].support.shopkeepers;
  app.clickAction("reset-group-support", { groupId: "residents" });
  assert.match(app.message(), /Cleared Residents support scores to blank/u);
  assert.match(app.alert(), /Fix the proposal before searching/u);
  assert.match(app.clauses(), /data-group-id="residents"[^>]*value=""/u);
  assert.equal(JSON.parse(storage.get("smallest-agreement:proposal:v1")).clauses[0].options[0].support.residents, residents);
  assert.equal(JSON.parse(storage.get("smallest-agreement:proposal:v1")).clauses[0].options[0].support.shopkeepers, shopkeepers);
  app.click("#undo-button");
  const undone = JSON.parse(storage.get("smallest-agreement:proposal:v1"));
  assert.equal(undone.clauses[0].options[0].support.residents, residents);
  assert.doesNotMatch(app.alert(), /Fix the proposal/u);
});

test("renormalize weights requires a preview then apply and can be undone", async () => {
  const storage = new Map();
  const app = await savedWorkbench(storage);
  app.setTitle("Workshop draft for renormalize");
  assert.match(app.weightRenorm(), /Preview renormalize weights/u);
  app.clickAction("preview-renorm");
  assert.match(app.weightRenorm(), /Apply renormalized weights/u);
  assert.match(app.weightRenorm(), /Current weight/u);
  const before = JSON.parse(storage.get("smallest-agreement:proposal:v1"));
  const total = before.groups.reduce((sum, group) => sum + group.weight, 0);
  app.clickAction("apply-renorm");
  const after = JSON.parse(storage.get("smallest-agreement:proposal:v1"));
  assert.equal(after.groups.reduce((sum, group) => sum + group.weight, 0), 1);
  assert.equal(after.groups[0].weight, before.groups[0].weight / total);
  assert.match(app.message(), /Renormalized group weights so they sum to 1/u);
  app.click("#undo-button");
  assert.deepEqual(JSON.parse(storage.get("smallest-agreement:proposal:v1")).groups.map((group) => group.weight), before.groups.map((group) => group.weight));
});

test('partial numeric edit clears the exported review even without full render', async () => {
 const app = await savedWorkbench(new Map());
 app.click('#agreement-review-run');
 assert.equal(app.disabled('#agreement-review-export'), false);
 app.numberInput('#threshold-number', 61);
 assert.equal(app.disabled('#agreement-review-export'), true);
});

test("standalone builder appImport still lists first and last without-floor cost markdown", () => {
  const builder = readFileSync(new URL("../scripts/build-standalone.mjs", import.meta.url), "utf8").replaceAll("\r\n", "\n");
  const app = readFileSync(new URL("../src/app.js", import.meta.url), "utf8").replaceAll("\r\n", "\n");
  const added = /formatFirstGroupWithoutFloorCostMarkdown,\n  formatLastGroupWithoutFloorCostMarkdown,/u;
  assert.match(builder, added);
  assert.match(app, added);
  assert.equal(app.includes('} else if (event.shiftKey && key === "F7") {\n    event.preventDefault();\n    copyFirstGroupWithoutFloorRemaining();'), true);
  assert.equal(app.includes('} else if (event.shiftKey && key === "F8") {\n    event.preventDefault();\n    jumpToFirstGroupWithoutFloorRemainingCopy();'), true);
  assert.equal(app.includes('} else if (event.shiftKey && key === "F9") {\n    event.preventDefault();\n    jumpToHideLastGroupWithoutFloor();'), true);
  assert.equal(app.includes('} else if (key === "F7") {\n    event.preventDefault();\n    copyLastGroupWithoutFloor();'), true);
  assert.equal(app.includes('} else if (key === "F8") {\n    event.preventDefault();\n    jumpToLastGroupWithoutFloorCopy();'), true);
  assert.equal(app.includes('} else if (key === "F9") {\n    event.preventDefault();\n    jumpToHideLastGroupWithoutFloor();'), true);
  assert.equal(app.includes('} else if (event.shiftKey && key === "F10") {\n    event.preventDefault();\n    copyGroupsWithoutFloorCount();'), true);
  assert.equal(app.includes('} else if (event.shiftKey && key === "F12") {\n    event.preventDefault();\n    jumpToHideFirstGroupWithoutFloor();'), true);
  assert.equal(app.includes('} else if (key === "F12") {\n    event.preventDefault();\n    jumpToHideFirstGroupWithoutFloor();'), true);
  assert.equal(app.indexOf('event.shiftKey && key === "F7"') < app.indexOf('} else if (key === "F7")'), true);
  assert.equal(app.indexOf('event.shiftKey && key === "F10"') < app.indexOf('} else if (key === "F10")'), true);
});
