import test from 'node:test';
import assert from 'node:assert/strict';
import {
  MAX_NUMERIC_INPUT,
  MAX_PARTICIPANTS,
  PRESETS,
  ValidationError,
  breakEvenVolume,
  calculatePartnership,
  clonePreset,
  effectiveVolume,
  exitVolume,
  participantShocks,
  validateConfiguration,
} from '../src/model.js';

test('balanced preset is viable and has a named weakest participant', () => {
  const result = calculatePartnership(clonePreset('balanced'));
  assert.equal(result.viable, true);
  assert.equal(result.effectiveVolume, 100000);
  assert.equal(result.weakestParticipant.name, 'Liquidity Partner');
});

test('validation rejects shares that do not reconcile exactly to one', () => {
  const config = clonePreset('balanced');
  config.participants[0].revenueShare = 0.41;
  const validation = validateConfiguration(config);
  assert.equal(validation.valid, false);
  assert.match(validation.errors.join(' '), /shares must sum to 1/);
  assert.throws(() => calculatePartnership(config), ValidationError);
});

test('validation rejects malformed deals instead of calculating thresholds', () => {
  const base = clonePreset('balanced');
  const invalidDeals = [
    [undefined, /Deal must be an object/],
    [null, /Deal must be an object/],
    [[], /Deal must be an object/],
    ['deal', /Deal must be an object/],
    [{ ...base.deal, monthlyVolume: -1 }, /monthly volume/],
    [{ ...base.deal, monthlyVolume: '100000' }, /monthly volume/],
    [{ ...base.deal, feePerTransaction: Number.NaN }, /fee per transaction/],
    [{ ...base.deal, addressableVolume: Number.POSITIVE_INFINITY }, /addressable volume/],
    [{ ...base.deal, volumeShockPct: 101 }, /volume shock/],
    [{ ...base.deal, volumeShockPct: -0.1 }, /volume shock/],
    [{ ...base.deal, volumeShockPct: '10' }, /volume shock/],
    [{ ...base.deal, extra: 1 }, /unknown field/],
  ];
  for (const [deal, pattern] of invalidDeals) {
    const config = { deal, participants: base.participants };
    const validation = validateConfiguration(config);
    assert.equal(validation.valid, false, String(pattern));
    assert.match(validation.errors.join(' '), pattern);
    assert.throws(() => calculatePartnership(config), ValidationError);
  }

  const missingVolume = clonePreset('balanced');
  delete missingVolume.deal.monthlyVolume;
  assert.match(validateConfiguration(missingVolume).errors.join(' '), /monthly volume/);
  assert.throws(() => calculatePartnership(missingVolume), ValidationError);

  const omittedShock = clonePreset('balanced');
  delete omittedShock.deal.volumeShockPct;
  assert.equal(validateConfiguration(omittedShock).valid, true);
  assert.equal(calculatePartnership(omittedShock).effectiveVolume, 100000);

  assert.equal(validateConfiguration(null).valid, false);
  assert.equal(validateConfiguration([]).valid, false);
  assert.match(validateConfiguration(null).errors.join(' '), /must be an object/);
});

test('validation rejects non-numeric optional values instead of coercing them', () => {
  const config = clonePreset('balanced');
  config.participants[0].capacity = '';
  const validation = validateConfiguration(config);
  assert.equal(validation.valid, false);
  assert.match(validation.errors.join(' '), /capacity must be a finite number/);
});

test('validation bounds participant count and user-controlled names', () => {
  const tooMany = clonePreset('balanced');
  while (tooMany.participants.length <= MAX_PARTICIPANTS) {
    const source = tooMany.participants[0];
    tooMany.participants.push({ ...source, id: `extra-${tooMany.participants.length}`, revenueShare: 0 });
  }
  assert.equal(validateConfiguration(tooMany).valid, false);

  const longName = clonePreset('balanced');
  longName.participants[0].name = 'x'.repeat(81);
  assert.match(validateConfiguration(longName).errors.join(' '), /80 characters/);

  const unknown = clonePreset('balanced');
  unknown.debug = 'ignored payload';
  assert.match(validateConfiguration(unknown).errors.join(' '), /unknown field/);

  const excessive = clonePreset('balanced');
  excessive.deal.monthlyVolume = MAX_NUMERIC_INPUT + 1;
  assert.equal(validateConfiguration(excessive).valid, false);
});

test('break-even volume is transparent for positive, zero, and impossible contribution', () => {
  const participant = { revenueShare: 0.5, variableCostPerTransaction: 0.05, fixedMonthlyCost: 100, riskCost: 20 };
  assert.equal(breakEvenVolume(participant, 0.5), 600);
  assert.equal(breakEvenVolume({ ...participant, fixedMonthlyCost: 0, riskCost: 0 }, 0.1), 0);
  assert.equal(breakEvenVolume(participant, 0.1), null);
});

test('effective volume respects both addressable demand and the configured churn shock', () => {
  const deal = { monthlyVolume: 1000, feePerTransaction: 1, addressableVolume: 700, volumeShockPct: 10 };
  assert.equal(effectiveVolume(deal), 700);
  assert.equal(effectiveVolume({ ...deal, addressableVolume: 950 }), 900);
});

test('capacity makes the partnership non-viable even when profit passes', () => {
  const config = clonePreset('balanced');
  config.participants[1].capacity = 90000;
  const result = calculatePartnership(config);
  assert.equal(result.viable, false);
  assert.equal(result.participants[1].capacityPass, false);
  assert.equal(result.participants[1].bindingConstraint.kind, 'capacity');
  assert.equal(result.participants[1].shocks.volumeIncrease.status, 'already-failing');
  assert.match(result.participants[1].failureReasons.join(' '), /exceeds capacity/);
});

test('volume, fee, and cost shocks report economically meaningful thresholds', () => {
  const config = clonePreset('balanced');
  const participant = config.participants[0];
  const shocks = participantShocks(participant, config.deal);
  assert.equal(shocks.volume.status, 'bounded');
  assert.ok(shocks.volume.change > 0);
  assert.ok(shocks.fee.change > 0);
  assert.ok(shocks.variableCost.change > 0);
  assert.ok(shocks.fee.breakpoint < config.deal.feePerTransaction);
  assert.ok(shocks.variableCost.breakpoint > participant.variableCostPerTransaction);
  assert.equal(shocks.volumeIncrease.status, 'bounded');
  assert.equal(shocks.volumeIncrease.breakpoint, participant.capacity);
});

test('exit volume and adverse-shock thresholds match the documented formulas', () => {
  const config = clonePreset('balanced');
  const deal = config.deal;
  const volume = effectiveVolume(deal);
  assert.equal(volume, 100000);

  for (const participant of config.participants) {
    const requiredProfit = participant.minimumAcceptableProfit + participant.fixedMonthlyCost + participant.riskCost;
    const contribution = participant.revenueShare * deal.feePerTransaction - participant.variableCostPerTransaction;
    const expectedExit = Math.max(requiredProfit / contribution, participant.minimumCommitment ?? 0);
    assert.equal(exitVolume(participant, deal.feePerTransaction), expectedExit);

    const shocks = participantShocks(participant, deal);
    const expectedFee = (requiredProfit + volume * participant.variableCostPerTransaction) / (volume * participant.revenueShare);
    const expectedCost = (participant.revenueShare * deal.feePerTransaction * volume - participant.fixedMonthlyCost
      - participant.riskCost - participant.minimumAcceptableProfit) / volume;
    assert.equal(shocks.volume.status, 'bounded');
    assert.equal(shocks.volume.breakpoint, expectedExit);
    assert.equal(shocks.volume.change, volume - expectedExit);
    assert.equal(shocks.fee.breakpoint, expectedFee);
    assert.equal(shocks.fee.change, deal.feePerTransaction - expectedFee);
    assert.equal(shocks.variableCost.breakpoint, expectedCost);
    assert.equal(shocks.variableCost.change, expectedCost - participant.variableCostPerTransaction);
    assert.equal(shocks.volumeIncrease.breakpoint, participant.capacity);
    assert.equal(shocks.volumeIncrease.change, participant.capacity - volume);
  }

  const result = calculatePartnership(config);
  assert.equal(result.firstBreakpoint.participant.id, 'liquidity-partner');
  assert.equal(result.firstBreakpoint.kind, 'fee');
  assert.equal(result.firstBreakpoint.shock.breakpoint, 0.192);
  assert.equal(Math.round(result.firstBreakpoint.shock.changePct * 10) / 10, 4);
});

test('a deal already at an exit volume reports an at-breakpoint shock of zero', () => {
  const config = clonePreset('balanced');
  const liquidity = config.participants.find((participant) => participant.id === 'liquidity-partner');
  const threshold = exitVolume(liquidity, config.deal.feePerTransaction);
  config.deal.monthlyVolume = threshold;
  config.deal.addressableVolume = threshold;
  const result = calculatePartnership(config);
  const shocks = result.participants.find((participant) => participant.id === 'liquidity-partner').shocks;
  assert.equal(result.viable, true);
  assert.equal(shocks.volume.status, 'at-breakpoint');
  assert.equal(shocks.volume.change, 0);
  assert.equal(result.firstBreakpoint.status, 'at-breakpoint');
  assert.equal(result.firstBreakpoint.kind, 'volume');
  assert.equal(result.firstBreakpoint.participant.id, 'liquidity-partner');
});

test('capacity shock is unbounded when no capacity limit is supplied', () => {
  const config = clonePreset('balanced');
  config.participants[0].capacity = null;
  const shocks = participantShocks(config.participants[0], config.deal);
  assert.equal(shocks.volumeIncrease.status, 'unbounded');
  assert.equal(shocks.volumeIncrease.breakpoint, null);
});

test('capacity above addressable demand is not a reachable shock', () => {
  const config = clonePreset('balanced');
  config.deal.addressableVolume = 100_000;
  config.participants[0].capacity = 101_000;
  const result = calculatePartnership(config);
  assert.equal(result.participants[0].shocks.volumeIncrease.status, 'unbounded');
  assert.match(result.participants[0].shocks.volumeIncrease.reason, /Addressable demand/);
  assert.notEqual(result.weakestParticipant.id, 'platform');
  assert.notEqual(result.firstBreakpoint.kind, 'volumeIncrease');
});

test('binding limit identifies a minimum commitment when it is the nearest economic boundary', () => {
  const config = clonePreset('balanced');
  config.participants[0].minimumCommitment = 120000;
  config.participants[0].capacity = 200000;
  const result = calculatePartnership(config);
  assert.equal(result.participants[0].bindingConstraint.kind, 'commitment');
  assert.equal(result.participants[0].bindingConstraint.label, 'minimum commitment');
});

test('first breakpoint ranks the smallest relative adverse movement deterministically', () => {
  const result = calculatePartnership(clonePreset('balanced'));
  assert.equal(result.firstBreakpoint.participant.name, 'Liquidity Partner');
  assert.equal(result.firstBreakpoint.kind, 'fee');
  assert.equal(result.firstBreakpoint.status, 'bounded');
  assert.equal(result.firstBreakpoint.comparison, 'relative-change');
  assert.equal(Math.round(result.firstBreakpoint.shock.changePct * 10) / 10, 4);
});

test('first breakpoint surfaces an existing failure before ranking future shocks', () => {
  const config = clonePreset('balanced');
  config.participants[1].capacity = 90000;
  const result = calculatePartnership(config);
  assert.equal(result.firstBreakpoint.participant.name, 'Distributor');
  assert.equal(result.firstBreakpoint.status, 'already-failing');
  assert.equal(result.firstBreakpoint.shock.change, 0);
});

test('a zero fee floor with zero costs has no adverse fee threshold', () => {
  const config = {
    deal: { monthlyVolume: 100, feePerTransaction: 0.2, addressableVolume: 100, volumeShockPct: 0 },
    participants: [
      { id: 'a', name: 'A', revenueShare: 0.5, variableCostPerTransaction: 0, fixedMonthlyCost: 0, minimumAcceptableProfit: 0, capacity: null, minimumCommitment: 0, riskCost: 0 },
      { id: 'b', name: 'B', revenueShare: 0.5, variableCostPerTransaction: 0, fixedMonthlyCost: 0, minimumAcceptableProfit: 0, capacity: null, minimumCommitment: 0, riskCost: 0 },
    ],
  };
  assert.equal(participantShocks(config.participants[0], config.deal).fee.status, 'unbounded');
});

test('reachable capacity limits the weakest participant and first breakpoint', () => {
  const config = {
    deal: { monthlyVolume: 100, feePerTransaction: 10, addressableVolume: 200, volumeShockPct: 0 },
    participants: [
      { id: 'capacity-edge', name: 'Capacity Edge', revenueShare: 0.5, variableCostPerTransaction: 0, fixedMonthlyCost: 0, minimumAcceptableProfit: 0, capacity: 101, minimumCommitment: 0, riskCost: 0 },
      { id: 'profit-edge', name: 'Profit Edge', revenueShare: 0.5, variableCostPerTransaction: 0, fixedMonthlyCost: 0, minimumAcceptableProfit: 450, capacity: 1000, minimumCommitment: 0, riskCost: 0 },
    ],
  };
  const result = calculatePartnership(config);
  assert.equal(result.weakestParticipant.id, 'capacity-edge');
  assert.equal(result.weakestParticipant.fragilityHeadroom, 1);
  assert.equal(result.weakestParticipant.bindingConstraint.kind, 'capacity');
  assert.equal(result.weakestParticipant.shocks.volumeIncrease.change, 1);
  assert.equal(result.firstBreakpoint.participant.id, 'capacity-edge');
  assert.equal(result.firstBreakpoint.kind, 'volumeIncrease');
  assert.equal(result.firstBreakpoint.shock.changePct, 1);
});

test('first breakpoint can name a different participant than the weakest volume-headroom ranking', () => {
  const config = {
    deal: { monthlyVolume: 100, feePerTransaction: 1, addressableVolume: 200, volumeShockPct: 0 },
    participants: [
      { id: 'tight-capacity', name: 'Tight Capacity', revenueShare: 0.5, variableCostPerTransaction: 0.01, fixedMonthlyCost: 0, minimumAcceptableProfit: 0, capacity: 101, minimumCommitment: 0, riskCost: 0 },
      { id: 'tight-fee', name: 'Tight Fee', revenueShare: 0.5, variableCostPerTransaction: 0.1, fixedMonthlyCost: 0, minimumAcceptableProfit: 39.55, capacity: 1000, minimumCommitment: 0, riskCost: 0 },
    ],
  };
  const result = calculatePartnership(config);
  assert.equal(result.viable, true);
  assert.equal(result.weakestParticipant.id, 'tight-capacity');
  assert.ok(result.weakestParticipant.fragilityHeadroom < result.participants.find((participant) => participant.id === 'tight-fee').fragilityHeadroom);
  assert.equal(result.firstBreakpoint.participant.id, 'tight-fee');
  assert.equal(result.firstBreakpoint.kind, 'fee');
  assert.ok(result.firstBreakpoint.shock.changePct < result.participants[0].shocks.volumeIncrease.changePct);
});

test('already failing participants have a zero adverse shock', () => {
  const config = clonePreset('balanced');
  config.participants[2].minimumAcceptableProfit = 10000;
  const result = calculatePartnership(config);
  const shocks = result.participants[2].shocks;
  assert.equal(shocks.volume.status, 'already-failing');
  assert.equal(shocks.volume.change, 0);
  assert.equal(shocks.volumeIncrease.status, 'already-failing');
});

test('all three presets are valid, viable starting configurations', () => {
  for (const key of Object.keys(PRESETS)) {
    const config = clonePreset(key);
    assert.equal(validateConfiguration(config).valid, true, `${key} should validate`);
    assert.equal(calculatePartnership(config).viable, true, `${key} should start viable`);
  }
});
