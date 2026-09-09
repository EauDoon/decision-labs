import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculatePartnership,
  clonePreset,
  effectiveVolume,
  evaluateParticipant,
  exitVolume,
  maxMonthlyVolumeForHoldSearch,
  solveMinimumVolumeToHold,
  validateConfiguration,
} from '../src/model.js';

test('volume-to-hold solver finds the profit-floor monthly volume on the balanced preset', () => {
  const config = clonePreset('balanced');
  const result = solveMinimumVolumeToHold(config, 'liquidity-partner');
  assert.equal(result.status, 'possible');
  const analytical = exitVolume(config.participants[2], config.deal.feePerTransaction);
  assert.ok(Math.abs(result.monthlyVolume - analytical) < 1e-6);
  assert.equal(result.effectiveVolume, effectiveVolume({ ...config.deal, monthlyVolume: result.monthlyVolume }));
  const applied = { ...config, deal: { ...config.deal, monthlyVolume: result.monthlyVolume } };
  assert.equal(validateConfiguration(applied).valid, true);
  const evaluated = calculatePartnership(applied).participants.find((item) => item.id === 'liquidity-partner');
  assert.equal(evaluated.viable, true);
  const below = { ...config, deal: { ...config.deal, monthlyVolume: Math.max(0, result.monthlyVolume - 1e-4) } };
  assert.equal(evaluateParticipant(below.participants[2], below.deal).viable, false);
  assert.equal(applied.deal.feePerTransaction, config.deal.feePerTransaction);
  assert.deepEqual(applied.participants.map((item) => item.revenueShare), config.participants.map((item) => item.revenueShare));
});

test('volume-to-hold solver respects shock, reports zero, and stays honest when impossible', () => {
  const atZero = clonePreset('balanced');
  atZero.participants.forEach((item) => {
    item.fixedMonthlyCost = 0;
    item.riskCost = 0;
    item.minimumAcceptableProfit = 0;
    item.minimumCommitment = 0;
  });
  const zero = solveMinimumVolumeToHold(atZero, 'platform');
  assert.equal(zero.status, 'possible');
  assert.equal(zero.monthlyVolume, 0);

  const shocked = clonePreset('balanced');
  shocked.deal.volumeShockPct = 20;
  const recovered = solveMinimumVolumeToHold(shocked, 'liquidity-partner');
  assert.equal(recovered.status, 'possible');
  const appliedShock = { ...shocked, deal: { ...shocked.deal, monthlyVolume: recovered.monthlyVolume } };
  assert.equal(calculatePartnership(appliedShock).participants[2].viable, true);
  assert.ok(recovered.monthlyVolume > recovered.effectiveVolume);
  assert.equal(appliedShock.deal.volumeShockPct, 20);
  assert.equal(appliedShock.deal.feePerTransaction, shocked.deal.feePerTransaction);

  const profitImpossible = clonePreset('balanced');
  profitImpossible.participants[2].minimumAcceptableProfit = 1_000_000;
  const blockedProfit = solveMinimumVolumeToHold(profitImpossible, 'liquidity-partner');
  assert.equal(blockedProfit.status, 'impossible');
  assert.equal(blockedProfit.monthlyVolume, null);
  assert.equal(blockedProfit.effectiveVolume, null);
  assert.match(blockedProfit.reason, /No monthly volume/);
  assert.doesNotMatch(blockedProfit.reason, /likely|chance|odds/i);

  const capacityImpossible = clonePreset('balanced');
  capacityImpossible.participants[2].capacity = 1000;
  capacityImpossible.participants[2].minimumAcceptableProfit = 5000;
  const blockedCapacity = solveMinimumVolumeToHold(capacityImpossible, 'liquidity-partner');
  assert.equal(blockedCapacity.status, 'impossible');
  assert.match(blockedCapacity.reason, /capacity|profit/i);

  const unknown = clonePreset('balanced');
  assert.throws(() => solveMinimumVolumeToHold(unknown, 'missing'), (error) => /Choose a current participant/.test(error.errors.join(' ')));
});

test('volume-to-hold search high bound stays inside capacity and addressable demand', () => {
  const config = clonePreset('balanced');
  const partner = config.participants[2];
  const bound = maxMonthlyVolumeForHoldSearch(config, partner);
  assert.equal(bound, partner.capacity);
  const tight = clonePreset('balanced');
  tight.participants[2].capacity = 50_000;
  tight.deal.volumeShockPct = 50;
  const shockedBound = maxMonthlyVolumeForHoldSearch(tight, tight.participants[2]);
  assert.equal(shockedBound, 50_000 / 0.5);
});
