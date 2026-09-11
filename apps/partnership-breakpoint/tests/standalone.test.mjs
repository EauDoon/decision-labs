import assert from 'node:assert/strict';
import test from 'node:test';
import { isStandaloneCurrent, renderStandalone, buildStandalone } from '../scripts/build-standalone.mjs';

const html = '<html><head><title>Partnership Breakpoint</title><link rel="stylesheet" href="styles.css" /></head><body><a href="MODEL.md">Read the full model</a><script type="module" src="src/app.js"></script></body></html>';
const appImport = `import {
  createPartnershipReviewPacket,
  replayPartnershipReviewPacket,
  PARTNERSHIP_REVIEW_TOOLS,
  analyzePartnershipReview,
  PRESETS,
  DEFAULT_STRESS,
  MAX_PARTICIPANTS,
  ValidationError,
  applyStressProposal,
  calculatePartnership,
  calculateFeeRequirements,
  clonePreset,
  compareImportedCase,
  compareThreeSnapshots,
  duplicateDisplayNames,
  duplicateParticipant,
  dropAndReallocate,
  evaluateStressGrid,
  exportDownloadName,
  makeParticipant,
  materializeStressCase,
  moveParticipant,
  swapAdjacentParticipants,
  participantsFromCsv,
  participantsFromRosterText,
  participantsToCsv,
  redactConfiguration,
  solveFeeForAllHold,
  solveMinimumShareToHold,
  solveMinimumVolumeToHold,
  stressGridCsv,
  uniqueCopyName,
  validateConfiguration,
} from './model.js';

`;

test('standalone renderer inlines local assets with deterministic LF bytes', () => {
  const input = { html, css: 'body { color: black; }', model: 'export const value = 1;\n', app: `${appImport}console.log(value);\n` };
  const first = renderStandalone(input);
  const second = renderStandalone(input);
  assert.equal(first, second);
  assert.equal(isStandaloneCurrent(first.replace(/\n/g, '\r\n'), second), true);
  assert.equal(isStandaloneCurrent('stale', second), false);
  assert.match(first, /<style>\nbody \{ color: black; \}\n<\/style>/);
  assert.match(first, /http-equiv="Content-Security-Policy"/);
  assert.match(first, /default-src 'none'; base-uri 'none'; connect-src 'none'; form-action 'none'; img-src 'none'; media-src 'none'; object-src 'none'; style-src 'unsafe-inline'; script-src 'unsafe-inline'/);
  assert.match(first, /const value = 1;/);
  assert.doesNotMatch(first, /src="src\/app\.js"|href="styles\.css"|href="MODEL\.md"/);
  assert.doesNotMatch(first, /\r/);
});

test('standalone renderer refuses missing markers and external CSS resources', () => {
  assert.throws(() => renderStandalone({ html: '<html></html>', css: '', model: '', app: appImport }), /marker/);
  assert.throws(() => renderStandalone({ html, css: 'body { background: url(image.png); }', model: '', app: appImport }), /URL resource/);
});

test('standalone retains 1.5.16 review tools and 1.5.17 copy controls', async () => {
  const html = await buildStandalone();
  assert.match(html, /createPartnershipReviewPacket/);
  assert.match(html, /replayPartnershipReviewPacket/);
  assert.match(html, /PARTNERSHIP_REVIEW_TOOLS/);
  assert.match(html, /analyzePartnershipReview/);
  assert.match(html, /data-action="copy-first-breakpoint-remaining"/);
  assert.match(html, /id="copy-first-breakpoint-remaining"/);
  assert.match(html, /data-action="copy-first-breakpoint-volume"/);
  assert.match(html, /aria-keyshortcuts=":"/);
  assert.match(html, /data-action="hide-spare-capacity-participants"/);
  assert.match(html, /data-action="hide-least-headroom-participants"/);
  assert.match(html, /data-action="hide-within-capacity-participants"/);
  assert.match(html, /id="hide-within-capacity-participants"/);
  assert.match(html, /data-action="hide-first-breakpoint-participant"/);
  assert.match(html, /id="hide-first-breakpoint-participant"/);
  assert.match(html, /id="hide-first-breakpoint-participant"[^>]*aria-keyshortcuts="\|"/);
  assert.match(html, /aria-keyshortcuts="\{"/);
  assert.match(html, /id="copy-over-capacity-count"/);
  assert.match(html, /id="copy-over-capacity-count"[^>]*aria-keyshortcuts='"'/);
  assert.match(html, /id="copy-first-over-capacity-label"/);
  assert.match(html, /id="copy-first-over-capacity-label"[^>]*aria-keyshortcuts="\}"/u);
  assert.match(html, /id="hide-first-over-capacity-participant"/);
  assert.match(html, /id="hide-first-over-capacity-participant"[^>]*aria-keyshortcuts="@"/);
  assert.match(html, /id="copy-first-over-capacity-remaining"/);
  assert.match(html, /id="copy-first-over-capacity-remaining"[^>]*aria-keyshortcuts="~"/);
  assert.match(html, /id="copy-last-over-capacity-label"/);
  assert.match(html, /data-action="copy-last-over-capacity-label"/);
  assert.match(html, /id="copy-last-over-capacity-label"[^>]*aria-keyshortcuts="\("/);
  assert.match(html, /id="copy-last-over-capacity-remaining"/);
  assert.match(html, /data-action="copy-last-over-capacity-remaining"/);
  assert.match(html, /id="copy-last-over-capacity-remaining"[^>]*aria-keyshortcuts="\*"/);
  assert.match(html, /id="copy-first-within-capacity-remaining"/);
  assert.match(html, /data-action="copy-first-within-capacity-remaining"/);
  assert.match(html, /id="copy-first-within-capacity-remaining"[^>]*aria-keyshortcuts="\$"/);
  assert.match(html, /id="copy-last-within-capacity-remaining"/);
  assert.match(html, /data-action="copy-last-within-capacity-remaining"/);
  assert.match(html, /id="copy-last-within-capacity-remaining"[^>]*aria-keyshortcuts="5"/);
  assert.match(html, /id="hide-last-over-capacity-participant"[^>]*aria-keyshortcuts="#"/);
  assert.match(html, /id="hide-last-breakpoint-participant"/);
  assert.match(html, /data-action="hide-last-breakpoint-participant"/);
  assert.match(html, /id="copy-last-breakpoint-label"/);
  assert.match(html, /data-action="copy-last-breakpoint-label"/);
  assert.match(html, /id="hide-last-within-capacity-participant"/);
  assert.match(html, /data-action="hide-last-within-capacity-participant"/);
  assert.match(html, /id="hide-first-within-capacity-participant"/);
  assert.match(html, /data-action="hide-first-within-capacity-participant"/);
  assert.match(html, /id="hide-first-within-capacity-participant"[^>]*aria-keyshortcuts="\\`"/);
  assert.match(html, /id="hide-last-spare-capacity-participant"/);
  assert.match(html, /data-action="hide-last-spare-capacity-participant"/);
  assert.match(html, /id="hide-last-spare-capacity-participant"[^>]*aria-keyshortcuts="7"/);
  assert.match(html, /id="copy-last-spare-capacity-remaining"/);
  assert.match(html, /data-action="copy-last-spare-capacity-remaining"/);
  assert.match(html, /id="copy-last-spare-capacity-remaining"[^>]*aria-keyshortcuts="8"/);
  assert.match(html, /id="copy-first-spare-capacity-remaining"/);
  assert.match(html, /data-action="copy-first-spare-capacity-remaining"/);
  assert.match(html, /id="copy-first-spare-capacity-remaining"[^>]*aria-keyshortcuts="1"/);
  assert.match(html, /id="copy-last-unbounded-remaining"/);
  assert.match(html, /data-action="copy-last-unbounded-remaining"/);
  assert.match(html, /id="copy-last-unbounded-remaining"[^>]*aria-keyshortcuts="4"/);
  assert.match(html, /id="copy-first-unbounded-remaining"/);
  assert.match(html, /data-action="copy-first-unbounded-remaining"/);
  assert.match(html, /id="copy-first-unbounded-remaining"[^>]*aria-keyshortcuts="PageUp"/);
  assert.match(html, /id="copy-last-at-hold-remaining"/);
  assert.match(html, /data-action="copy-last-at-hold-remaining"/);
  assert.match(html, /id="copy-last-at-hold-remaining"[^>]*aria-keyshortcuts="Insert"/);
  assert.match(html, /id="copy-first-at-hold-remaining"/);
  assert.match(html, /data-action="copy-first-at-hold-remaining"/);
  assert.match(html, /id="copy-first-at-hold-remaining"[^>]*aria-keyshortcuts="Delete"/);
  assert.match(html, /id="hide-first-zero-share-participant"/);
  assert.match(html, /data-action="hide-first-zero-share-participant"/);
  assert.match(html, /id="hide-first-zero-share-participant"[^>]*aria-keyshortcuts="ArrowRight"/);
  assert.match(html, /id="hide-first-spare-capacity-participant"/);
  assert.match(html, /id="hide-first-spare-capacity-participant"/);
  assert.match(html, /data-action="hide-first-spare-capacity-participant"/);
  assert.match(html, /id="hide-first-spare-capacity-participant"[^>]*aria-keyshortcuts="0"/);
  assert.match(html, /id="hide-last-without-capacity-participant"/);
  assert.match(html, /data-action="hide-last-without-capacity-participant"/);
  assert.match(html, /id="hide-last-without-capacity-participant"[^>]*aria-keyshortcuts="3"/);
  assert.match(html, /id="hide-first-without-capacity-participant"/);
  assert.match(html, /data-action="hide-first-without-capacity-participant"/);
  assert.match(html, /id="hide-first-without-capacity-participant"[^>]*aria-keyshortcuts="End"/);
  assert.match(html, /id="hide-last-at-hold-participant"/);
  assert.match(html, /data-action="hide-last-at-hold-participant"/);
  assert.match(html, /id="hide-last-at-hold-participant"[^>]*aria-keyshortcuts="ArrowUp"/);
  assert.match(html, /id="hide-first-at-hold-participant"/);
  assert.match(html, /data-action="hide-first-at-hold-participant"/);
  assert.match(html, /id="hide-first-at-hold-participant"[^>]*aria-keyshortcuts="ArrowLeft"/);
  assert.match(html, /event\.key === 'PageUp'/);
  assert.match(html, /event\.key === 'PageDown'/);
  assert.match(html, /event\.key === 'ArrowUp'/);
  assert.match(html, /event\.key === 'Insert'/);
  assert.match(html, /event\.key === 'ArrowDown'/);
  assert.match(html, /event\.key === 'ArrowLeft'/);
  assert.match(html, /event\.key === 'Delete'/);
  assert.match(html, /event\.key === 'F2'/);
  assert.match(html, /event\.key === 'ArrowRight'/);
  assert.match(html, /if \(event\.defaultPrevented\) return;/);
  assert.doesNotMatch(html, /if \(event\.key\.length !== 1\) return;/);
  assert.match(html, /event\.key === 'u' \|\| event\.key === 'U'/);
  assert.match(html, /School concert split/);
  assert.match(html, /Sports carnival split/);
  assert.match(html, /Netball carnival/);
  assert.match(html, /Swimming carnival split/);
  assert.match(html, /Athletics carnival split/);
  assert.match(html, /Cricket carnival split/);
  assert.match(html, /Tennis carnival split/);
  assert.match(html, /Basketball carnival split/);
  assert.match(html, /Volleyball carnival split/);
  assert.match(html, /Rugby carnival split/);
  assert.match(html, /Hockey carnival split/);
  assert.match(html, /Baseball carnival split/);
  assert.match(html, /Softball carnival split/);
  assert.match(html, /Lacrosse carnival split/);
  assert.match(html, /Water polo carnival split/);
  assert.match(html, /hideParticipantsAtLeastHeadroom/);
  assert.match(html, /hideParticipantsWithinCapacity/);
  assert.match(html, /hideFirstBreakpointParticipant/);
  assert.match(html, /hideFirstOverCapacityParticipant/);
  assert.match(html, /hideLastOverCapacityParticipant/);
  assert.match(html, /hideLastBreakpointParticipant/);
  assert.match(html, /hideLastWithinCapacityParticipant/);
  assert.match(html, /hideFirstWithinCapacityParticipant/);
  assert.match(html, /hideLastSpareCapacityParticipant/);
  assert.match(html, /hideFirstSpareCapacityParticipant/);
  assert.match(html, /hideLastParticipantWithoutCapacity/);
  assert.match(html, /hideFirstParticipantWithoutCapacity/);
  assert.match(html, /hideLastParticipantAtHold/);
  assert.match(html, /hideFirstParticipantAtHold/);
  assert.match(html, /hideFirstZeroShareParticipant/);
  assert.match(html, /id="hide-last-over-capacity-participant"/);
});
