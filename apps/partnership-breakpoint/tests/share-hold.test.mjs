import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculatePartnership,
  clonePreset,
  evaluateParticipant,
  proposalWithTargetShare,
  solveMinimumShareToHold,
  validateConfiguration,
} from '../src/model.js';

test('share-to-hold solver finds the profit-floor share on the balanced preset', () => {
  const config = clonePreset('balanced');
  const result = solveMinimumShareToHold(config, 'liquidity-partner');
  assert.equal(result.status, 'possible');
  assert.ok(Math.abs(result.share - 0.24) < 1e-9);
  assert.equal(result.proposal.reduce((sum, item) => sum + item.revenueShare, 0), 1);
  const leftover = 1 - result.share;
  const othersTotal = 0.4 + 0.35;
  assert.ok(Math.abs(result.proposal.find((item) => item.id === 'platform').revenueShare - leftover * (0.4 / othersTotal)) < 1e-9);
  const applied = { ...config, participants: result.proposal };
  assert.equal(validateConfiguration(applied).valid, true);
  const evaluated = calculatePartnership(applied).participants.find((item) => item.id === 'liquidity-partner');
  assert.equal(evaluated.viable, true);
  const belowShare = Math.max(0, result.share - 1e-6);
  const below = proposalWithTargetShare(config.participants, 'liquidity-partner', belowShare);
  assert.equal(evaluateParticipant(below.find((item) => item.id === 'liquidity-partner'), config.deal).viable, false);
});

test('share-to-hold solver recovers a failing participant and reports impossibility', () => {
  const failing = clonePreset('balanced');
  failing.participants[2].minimumAcceptableProfit = 5000;
  assert.equal(calculatePartnership(failing).participants[2].viable, false);
  const recovered = solveMinimumShareToHold(failing, 'liquidity-partner');
  assert.equal(recovered.status, 'possible');
  assert.ok(Math.abs(recovered.share - 0.485) < 1e-9);
  const applied = { ...failing, participants: recovered.proposal };
  assert.equal(calculatePartnership(applied).participants[2].viable, true);

  const profitImpossible = clonePreset('balanced');
  profitImpossible.participants[2].minimumAcceptableProfit = 20000;
  const blockedProfit = solveMinimumShareToHold(profitImpossible, 'liquidity-partner');
  assert.equal(blockedProfit.status, 'impossible');
  assert.equal(blockedProfit.share, null);
  assert.equal(blockedProfit.proposal, null);
  assert.match(blockedProfit.reason, /100% revenue share cannot make this participant hold/);

  const capacityImpossible = clonePreset('balanced');
  capacityImpossible.participants[2].capacity = 1;
  const blockedCapacity = solveMinimumShareToHold(capacityImpossible, 'liquidity-partner');
  assert.equal(blockedCapacity.status, 'impossible');
  assert.match(blockedCapacity.reason, /capacity/);
});
