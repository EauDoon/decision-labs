import test from 'node:test';
import assert from 'node:assert/strict';
import {
  MAX_PARTICIPANTS,
  clonePreset,
  duplicateParticipant,
  moveParticipant,
  nextUnusedParticipantId,
  validateConfiguration,
} from '../src/model.js';

function shareSum(participants) {
  return participants.reduce((sum, item) => sum + item.revenueShare, 0);
}

test('duplicate participant assigns a unique id, a name suffix, and a zero share', () => {
  const config = clonePreset('balanced');
  const originalSum = shareSum(config.participants);
  const originalIds = config.participants.map((item) => item.id);
  const once = duplicateParticipant(config.participants, 0);
  assert.equal(once.length, 4);
  assert.equal(once[1].id, 'participant-1');
  assert.equal(once[1].name, 'Platform copy');
  assert.equal(once[1].revenueShare, 0);
  assert.equal(once[1].fixedMonthlyCost, config.participants[0].fixedMonthlyCost);
  assert.equal(shareSum(once), originalSum);
  assert.equal(new Set(once.map((item) => item.id)).size, once.length);
  assert.deepEqual(once.filter((item) => originalIds.includes(item.id)).map((item) => item.id), originalIds);

  const twice = duplicateParticipant(once, 0);
  const ids = twice.map((item) => item.id);
  assert.equal(new Set(ids).size, ids.length);
  assert.equal(twice[1].id, 'participant-2');
  assert.equal(shareSum(twice), originalSum);
  assert.equal(validateConfiguration({ ...config, participants: twice }).valid, true);
});

test('duplicate participant refuses an out-of-range index and the participant cap', () => {
  const config = clonePreset('balanced');
  assert.throws(() => duplicateParticipant(config.participants, -1), (error) => {
    assert.match(error.errors.join(' '), /Choose a current participant/);
    return true;
  });
  assert.throws(() => duplicateParticipant(config.participants, 3), (error) => {
    assert.match(error.errors.join(' '), /Choose a current participant/);
    return true;
  });
  const padded = [...config.participants];
  while (padded.length < MAX_PARTICIPANTS) {
    padded.push({ ...config.participants[2], id: nextUnusedParticipantId(padded), revenueShare: 0 });
  }
  assert.equal(padded.length, MAX_PARTICIPANTS);
  assert.throws(() => duplicateParticipant(padded, 0), (error) => {
    assert.match(error.errors.join(' '), /Between 2 and 24/);
    return true;
  });
});

test('move up and down reorder participants without changing shares or ids', () => {
  const config = clonePreset('balanced');
  const originalSum = shareSum(config.participants);
  const originalIds = config.participants.map((item) => item.id);
  const down = moveParticipant(config.participants, 0, 'down');
  assert.deepEqual(down.map((item) => item.id), ['distributor', 'platform', 'liquidity-partner']);
  assert.equal(shareSum(down), originalSum);
  const up = moveParticipant(down, 2, 'up');
  assert.deepEqual(up.map((item) => item.id), ['distributor', 'liquidity-partner', 'platform']);
  const blocked = moveParticipant(config.participants, 0, 'up');
  assert.deepEqual(blocked.map((item) => item.id), originalIds);
  const blockedLast = moveParticipant(config.participants, 2, 'down');
  assert.deepEqual(blockedLast.map((item) => item.id), originalIds);
  assert.notEqual(blocked[0], config.participants[0]);
});
