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
  assert.match(html, /id="copy-last-over-capacity-remaining"[^>]*aria-keyshortcuts="\* Shift\+F10"/);
  assert.match(html, /id="copy-last-over-capacity-volume"/);
  assert.match(html, /data-action="copy-last-over-capacity-volume"/);
  assert.doesNotMatch(html, /id="copy-last-over-capacity-volume"[^>]*aria-keyshortcuts="Shift\+F10"/);
  assert.match(html, /id="copy-first-over-capacity-volume"/);
  assert.match(html, /data-action="copy-first-over-capacity-volume"/);
  assert.doesNotMatch(html, /id="copy-first-over-capacity-volume"[^>]*aria-keyshortcuts="Shift\+F10"/);
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
  assert.match(html, /id="copy-first-zero-share-participant"/);
  assert.match(html, /data-action="copy-first-zero-share-participant"/);
  assert.match(html, /id="copy-first-zero-share-participant"[^>]*aria-keyshortcuts="F7"/);
  assert.match(html, /id="copy-last-zero-share-participant"/);
  assert.match(html, /data-action="copy-last-zero-share-participant"/);
  assert.match(html, /id="copy-last-zero-share-participant"[^>]*aria-keyshortcuts="F3"/);
  assert.match(html, /id="copy-last-zero-share-remaining"/);
  assert.match(html, /data-action="copy-last-zero-share-remaining"/);
  assert.match(html, /id="copy-last-zero-share-remaining"[^>]*aria-keyshortcuts="F10"/);
  assert.match(html, /id="copy-last-zero-share-volume"/);
  assert.match(html, /data-action="copy-last-zero-share-volume"/);
  assert.doesNotMatch(html, /id="copy-last-zero-share-volume"[^>]*aria-keyshortcuts="Shift\+F10"/);
  assert.match(html, /id="copy-first-zero-share-volume"/);
  assert.match(html, /data-action="copy-first-zero-share-volume"/);
  assert.doesNotMatch(html, /id="copy-first-zero-share-volume"[^>]*aria-keyshortcuts="Shift\+F10"/);
  assert.match(html, /id="copy-first-zero-share-remaining"/);
  assert.match(html, /data-action="copy-first-zero-share-remaining"/);
  assert.match(html, /id="hide-zero-share-participants"/);
  assert.match(html, /data-action="hide-zero-share-participants"/);
  assert.doesNotMatch(html, /id="hide-zero-share-participants"[^>]*aria-keyshortcuts="Shift\+F12"/);
  assert.match(html, /id="hide-last-zero-share-participant"/);
  assert.match(html, /data-action="hide-last-zero-share-participant"/);
  assert.match(html, /id="hide-last-zero-share-participant"[^>]*aria-keyshortcuts="Backspace"/);
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
  assert.match(html, /event\.key === 'F3'/);
  assert.match(html, /event\.key === 'F4'/);
  assert.match(html, /event\.key === 'Backspace'/);
  assert.match(html, /event\.key === 'F7'/);
  assert.match(html, /event\.key === 'F8'/);
  assert.match(html, /event\.key === 'F9'/);
  assert.match(html, /event\.key === 'F10'/);
  assert.match(html, /event\.key === 'F11'/);
  assert.match(html, /event\.key === 'F12'/);
  assert.match(html, /event\.key === 'F10' && event\.shiftKey/);
  assert.match(html, /event\.key === 'F10' && !event\.shiftKey/);
  const shiftF10At = html.indexOf("event.key === 'F10' && event.shiftKey");
  assert.notEqual(shiftF10At, -1);
  const f10At = html.indexOf("event.key === 'F10' && !event.shiftKey");
  assert.ok(shiftF10At < f10At);
  const shiftF10Slice = html.slice(shiftF10At, f10At);
  assert.match(shiftF10Slice, /copyLastOverCapacityRemaining/);
  assert.doesNotMatch(shiftF10Slice, /copyFirstOverCapacityVolume/);
  assert.doesNotMatch(shiftF10Slice, /copyLastOverCapacityVolume/);
  assert.doesNotMatch(shiftF10Slice, /copyFirstZeroShareVolume/);
  assert.doesNotMatch(shiftF10Slice, /copyLastZeroShareVolume/);
  assert.doesNotMatch(shiftF10Slice, /copyFirstZeroShareRemaining/);
  assert.doesNotMatch(shiftF10Slice, /copyLastZeroShareRemaining/);
  assert.match(html, /event\.key === 'F11' && event\.shiftKey/);
  assert.match(html, /event\.key === 'F11' && !event\.shiftKey/);
  const shiftF11At = html.indexOf("event.key === 'F11' && event.shiftKey");
  assert.notEqual(shiftF11At, -1);
  const f11At = html.indexOf("event.key === 'F11' && !event.shiftKey");
  assert.ok(shiftF11At < f11At);
  const shiftF11Slice = html.slice(shiftF11At, f11At);
  assert.match(shiftF11Slice, /copy-last-over-capacity-remaining/);
  assert.doesNotMatch(shiftF11Slice, /copy-first-over-capacity-volume/);
  assert.doesNotMatch(shiftF11Slice, /copy-last-over-capacity-volume/);
  assert.doesNotMatch(shiftF11Slice, /copy-first-zero-share-volume/);
  assert.doesNotMatch(shiftF11Slice, /copy-last-zero-share-volume/);
  assert.doesNotMatch(shiftF11Slice, /copy-last-zero-share-remaining/);
  assert.match(html, /event\.key === 'F12' && event\.shiftKey/);
  assert.match(html, /event\.key === 'F12' && !event\.shiftKey/);
  assert.notEqual(html.indexOf('F7'), html.indexOf('F3'));
  assert.notEqual(html.indexOf('F8'), html.indexOf('F4'));
  assert.notEqual(html.indexOf('F9'), html.indexOf('ArrowRight'));
  assert.notEqual(html.indexOf('F10'), html.indexOf('F7'));
  assert.notEqual(html.indexOf('F11'), html.indexOf('F8'));
  assert.notEqual(html.indexOf('F12'), html.indexOf('F9'));
  assert.notEqual(html.indexOf('Shift+F10'), html.indexOf('F10'));
  const f9At = html.indexOf("event.key === 'F9'");
  assert.notEqual(f9At, -1);
  const f9Next = html.indexOf('if (event.key ===', f9At + 1);
  const f9Slice = html.slice(f9At, f9Next === -1 ? f9At + 400 : f9Next);
  assert.doesNotMatch(f9Slice, /copyLastZeroShareParticipant/);
  assert.doesNotMatch(f9Slice, /copyFirstZeroShareParticipant/);
  assert.doesNotMatch(f9Slice, /copyLastZeroShareRemaining/);
  assert.doesNotMatch(f9Slice, /copyFirstZeroShareRemaining/);
  assert.doesNotMatch(f9Slice, /copyLastZeroShareVolume/);
  assert.doesNotMatch(f9Slice, /copyFirstZeroShareVolume/);
  const f12At = html.indexOf("event.key === 'F12' && !event.shiftKey");
  assert.notEqual(f12At, -1);
  const f12Next = html.indexOf('if (event.key ===', f12At + 1);
  const f12Slice = html.slice(f12At, f12Next === -1 ? f12At + 400 : f12Next);
  assert.match(f12Slice, /hide-last-zero-share-participant/);
  assert.doesNotMatch(f12Slice, /copyLastZeroShareRemaining/);
  assert.doesNotMatch(f12Slice, /copyFirstZeroShareRemaining/);
  assert.doesNotMatch(f12Slice, /copyLastZeroShareVolume/);
  assert.doesNotMatch(f12Slice, /copyFirstZeroShareVolume/);
  assert.doesNotMatch(f12Slice, /hide-first-zero-share-participant/);
  assert.doesNotMatch(f12Slice, /hide-zero-share-participants/);
  const shiftF12At = html.indexOf("event.key === 'F12' && event.shiftKey");
  assert.notEqual(shiftF12At, -1);
  assert.ok(shiftF12At < f12At);
  const shiftF12Next = html.indexOf('if (event.key ===', shiftF12At + 1);
  const shiftF12Slice = html.slice(shiftF12At, shiftF12Next === -1 ? shiftF12At + 400 : f12At);
  assert.match(shiftF12Slice, /hide-first-over-capacity-participant/);
  assert.doesNotMatch(shiftF12Slice, /hide-last-over-capacity-participant/);
  assert.doesNotMatch(shiftF12Slice, /hide-last-zero-share-participant/);
  assert.doesNotMatch(shiftF12Slice, /hide-zero-share-participants/);
  assert.doesNotMatch(shiftF12Slice, /hide-first-zero-share-participant/);
  assert.match(html, /function handleShortcut\(event\) \{\s*if \(event\.defaultPrevented\) return;/u);
  assert.match(html, /const key = event\.key\.length === 1 \? event\.key\.toLowerCase\(\) : event\.key;/);
  assert.doesNotMatch(html, /if \(event\.key\.length !== 1\) return;/);
  assert.match(html, /key === 'u'/);
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
  assert.match(html, /Rowing carnival split/);
  assert.match(html, /Sailing carnival split/);
  assert.match(html, /Canoeing carnival split/);
  assert.match(html, /Kayaking carnival split/);
  assert.match(html, /Dragon boat carnival split/);
  assert.match(html, /Surf carnival split/);
  assert.match(html, /Triathlon carnival split/);
  assert.match(html, /Cycling carnival split/);
  assert.match(html, /Mountain bike carnival split/);
  const surfAt = html.indexOf('Surf carnival split');
  const triathlonAt = html.indexOf('Triathlon carnival split');
  const cyclingAt = html.indexOf('Cycling carnival split');
  const mountainAt = html.indexOf('Mountain bike carnival split');
  assert.notEqual(surfAt, -1);
  assert.notEqual(triathlonAt, -1);
  assert.notEqual(cyclingAt, -1);
  assert.notEqual(mountainAt, -1);
  assert.ok(surfAt < triathlonAt);
  assert.ok(triathlonAt < cyclingAt);
  assert.ok(cyclingAt < mountainAt);
  assert.match(html, /lastOverCapacityVolumeMarkdown/);
  assert.match(html, /copyLastOverCapacityVolume/);
  assert.match(html, /firstOverCapacityVolumeMarkdown/);
  assert.match(html, /copyFirstOverCapacityVolume/);
  assert.match(html, /lastOverCapacityRemainingMarkdown/);
  assert.match(html, /copyLastOverCapacityRemaining/);
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
  assert.match(html, /hideLastZeroShareParticipant/);
  assert.match(html, /copyLastZeroShareRemaining/);
  assert.match(html, /lastZeroShareRemainingMarkdown/);
  assert.match(html, /copyLastZeroShareVolume/);
  assert.match(html, /lastZeroShareVolumeMarkdown/);
  assert.match(html, /copyFirstZeroShareVolume/);
  assert.match(html, /firstZeroShareVolumeMarkdown/);
  assert.match(html, /copyFirstZeroShareRemaining/);
  assert.match(html, /firstZeroShareRemainingMarkdown/);
  assert.match(html, /id="hide-last-over-capacity-participant"/);
});
