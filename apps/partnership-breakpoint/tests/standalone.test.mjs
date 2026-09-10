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

test('standalone retains 1.5.10 review tools and 1.5.11 copy controls', async () => {
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
  assert.match(html, /id="copy-first-over-capacity-remaining"/);
  assert.match(html, /School concert split/);
  assert.match(html, /Sports carnival split/);
  assert.match(html, /Netball carnival/);
  assert.match(html, /Swimming carnival split/);
  assert.match(html, /hideParticipantsAtLeastHeadroom/);
  assert.match(html, /hideParticipantsWithinCapacity/);
  assert.match(html, /hideFirstBreakpointParticipant/);
  assert.match(html, /hideFirstOverCapacityParticipant/);
});
