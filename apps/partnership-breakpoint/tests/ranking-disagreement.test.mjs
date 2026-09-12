import test from 'node:test';
import assert from 'node:assert/strict';
import { calculatePartnership, clonePreset, rankingDisagreement, firstBreakpoint } from '../src/model.js';

test('both rankings agree on the balanced preset and say so', () => {
  const config = clonePreset('balanced');
  const result = calculatePartnership(config);
  assert.equal(result.rankingDisagreement.differs, false);
  assert.equal(result.rankingDisagreement.weakestId, result.weakestParticipant.id);
  assert.equal(result.rankingDisagreement.breakpointId, result.firstBreakpoint.participant.id);
  assert.match(result.rankingDisagreement.reason, /same participant/);
});

test('growthAtCost ranks a fee shock first while the volume-limited partner has least headroom', () => {
  const config = clonePreset('growthAtCost');
  const result = calculatePartnership(config);
  assert.equal(result.rankingDisagreement.differs, true);
  assert.notEqual(result.rankingDisagreement.weakestId, result.rankingDisagreement.breakpointId);
  assert.equal(result.rankingDisagreement.weakestId, result.weakestParticipant.id);
  assert.equal(result.rankingDisagreement.breakpointId, result.firstBreakpoint.participant.id);
  assert.match(result.rankingDisagreement.reason, /closest to its .* limit in transaction distance/);
  assert.match(result.rankingDisagreement.reason, /smallest percentage move/);
  assert.match(result.rankingDisagreement.reason, new RegExp(result.firstBreakpoint.participant.name));
});

test('rankingDisagreement is deterministic and derives from the two rankings alone', () => {
  const config = clonePreset('thinMargin');
  const result = calculatePartnership(config);
  const recomputed = rankingDisagreement(result, result.firstBreakpoint);
  assert.deepEqual(result.rankingDisagreement, recomputed);
  assert.equal(recomputed.differs, result.weakestParticipant.id !== result.firstBreakpoint.participant?.id);
});

test('unbounded shock cases keep an honest explanation', () => {
  const config = clonePreset('balanced');
  const result = calculatePartnership(config);
  const emptyBreakpoint = { participant: null, kind: null, shock: null, status: 'unbounded' };
  const empty = rankingDisagreement(result, emptyBreakpoint);
  assert.equal(empty.differs, false);
  assert.match(empty.reason, /No bounded adverse shock/);
});

test('firstBreakpoint and weakestParticipant remain distinct rankings', () => {
  const config = clonePreset('growthAtCost');
  const result = calculatePartnership(config);
  const direct = firstBreakpoint(result);
  assert.equal(direct.participant.id, result.firstBreakpoint.participant.id);
  assert.notEqual(result.weakestParticipant.id, result.firstBreakpoint.participant.id);
});
