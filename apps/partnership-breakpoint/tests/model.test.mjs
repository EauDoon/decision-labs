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

test('validation rejects duplicate ids, prototype keys, extra fields, and non-finite shares', () => {
  const base = clonePreset('balanced');

  const duplicate = clonePreset('balanced');
  duplicate.participants[1].id = duplicate.participants[0].id;
  assert.match(validateConfiguration(duplicate).errors.join(' '), /id must be unique/);
  assert.throws(() => calculatePartnership(duplicate), ValidationError);

  const inheritedDeal = Object.create(base.deal);
  assert.equal(validateConfiguration({ deal: inheritedDeal, participants: base.participants }).valid, false);
  assert.match(validateConfiguration({ deal: inheritedDeal, participants: base.participants }).errors.join(' '), /Deal must be an object/);

  const inheritedConfig = Object.create({ deal: base.deal, participants: base.participants });
  assert.equal(validateConfiguration(inheritedConfig).valid, false);
  assert.match(validateConfiguration(inheritedConfig).errors.join(' '), /must be an object/);

  const reserved = JSON.parse(JSON.stringify({ deal: base.deal, participants: base.participants })
    .replace('"monthlyVolume"', '"__proto__":{"polluted":true},"constructor":{"prototype":{}},"prototype":1,"monthlyVolume"'));
  const reservedErrors = validateConfiguration(reserved).errors.join(' ');
  assert.match(reservedErrors, /reserved field: __proto__/);
  assert.match(reservedErrors, /reserved field: constructor/);
  assert.match(reservedErrors, /reserved field: prototype/);
  assert.throws(() => calculatePartnership(reserved), ValidationError);

  const extraParticipant = clonePreset('balanced');
  extraParticipant.participants[0].injected = 1;
  assert.match(validateConfiguration(extraParticipant).errors.join(' '), /unknown field: injected/);

  for (const share of [Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY, -0.01, 1.01]) {
    const config = clonePreset('balanced');
    config.participants[0].revenueShare = share;
    const validation = validateConfiguration(config);
    assert.equal(validation.valid, false, String(share));
    assert.match(validation.errors.join(' '), /revenue share/);
  }

  const nullShock = clonePreset('balanced');
  nullShock.deal.volumeShockPct = null;
  assert.match(validateConfiguration(nullShock).errors.join(' '), /volume shock/);

  const dictionary = Object.assign(Object.create(null), {
    deal: Object.assign(Object.create(null), base.deal),
    participants: base.participants.map((participant) => Object.assign(Object.create(null), participant)),
  });
  assert.equal(validateConfiguration(dictionary).valid, true);
  assert.equal(calculatePartnership(dictionary).effectiveVolume, 100000);
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

test('capacity utilization is volume over capacity, unbounded, or exceeds zero capacity', () => {
  const balanced = calculatePartnership(clonePreset('balanced'));
  assert.equal(balanced.effectiveVolume, 100000);
  assert.equal(balanced.participants[0].capacityUtilization, 100000 / 130000);
  assert.ok(balanced.participants[0].capacityUtilization < 1);

  const jv = calculatePartnership(clonePreset('threePartyJv'));
  const capital = jv.participants.find((item) => item.id === 'capital');
  assert.equal(capital.capacity, null);
  assert.equal(capital.capacityUtilization, null);

  const over = clonePreset('balanced');
  over.participants[0].capacity = 50000;
  const overResult = calculatePartnership(over);
  assert.equal(overResult.participants[0].capacityUtilization, 2);

  const zero = clonePreset('balanced');
  zero.participants[0].capacity = 0;
  const zeroResult = calculatePartnership(zero);
  assert.equal(zeroResult.participants[0].capacityUtilization, Number.POSITIVE_INFINITY);

  const idle = clonePreset('balanced');
  idle.deal.monthlyVolume = 0;
  idle.deal.addressableVolume = 0;
  idle.participants.forEach((item) => { item.capacity = 0; item.minimumCommitment = 0; });
  const idleResult = calculatePartnership(idle);
  assert.equal(idleResult.participants[0].capacityUtilization, 0);
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

test('all shipped presets are valid, viable starting configurations', () => {
  for (const key of Object.keys(PRESETS)) {
    const config = clonePreset(key);
    assert.equal(validateConfiguration(config).valid, true, `${key} should validate`);
    assert.equal(calculatePartnership(config).viable, true, `${key} should start viable`);
  }
});

test('two-party 50/50 studio preset is a distinct even-split starting point', () => {
  const studio = clonePreset('twoPartyStudio');
  assert.equal(PRESETS.twoPartyStudio.name, 'Two-party 50/50 studio');
  assert.equal(studio.participants.length, 2);
  assert.equal(studio.participants[0].revenueShare, 0.5);
  assert.equal(studio.participants[1].revenueShare, 0.5);
  assert.deepEqual(studio.participants.map((item) => item.id), ['production-studio', 'distribution-studio']);
  assert.notEqual(studio.deal.feePerTransaction, clonePreset('creatorTakeRate').deal.feePerTransaction);
  assert.notEqual(studio.participants.length, clonePreset('threePartyJv').participants.length);
  const result = calculatePartnership(studio);
  assert.equal(result.viable, true);
  assert.ok(result.participants.every((item) => item.revenueShare === 0.5));
});

test('four-party marketplace preset is distinct from two- and three-party starting points', () => {
  const market = clonePreset('fourPartyMarketplace');
  assert.equal(PRESETS.fourPartyMarketplace.name, 'Four-party marketplace');
  assert.equal(market.participants.length, 4);
  assert.deepEqual(market.participants.map((item) => item.id), ['marketplace', 'seller', 'logistics', 'payments']);
  assert.deepEqual(market.participants.map((item) => item.revenueShare), [0.28, 0.42, 0.18, 0.12]);
  assert.equal(market.deal.monthlyVolume, 25000);
  assert.equal(market.deal.feePerTransaction, 1.2);
  assert.notEqual(market.participants.length, clonePreset('balanced').participants.length);
  assert.notEqual(market.participants.length, clonePreset('creatorTakeRate').participants.length);
  assert.notEqual(market.participants.length, clonePreset('threePartyJv').participants.length);
  assert.notEqual(market.participants.length, clonePreset('twoPartyStudio').participants.length);
  assert.notEqual(market.deal.feePerTransaction, clonePreset('balanced').deal.feePerTransaction);
  assert.notEqual(market.deal.feePerTransaction, clonePreset('creatorTakeRate').deal.feePerTransaction);
  assert.notEqual(market.deal.feePerTransaction, clonePreset('threePartyJv').deal.feePerTransaction);
  assert.notEqual(market.deal.feePerTransaction, clonePreset('twoPartyStudio').deal.feePerTransaction);
  const result = calculatePartnership(market);
  assert.equal(result.viable, true);
  assert.equal(result.participants.length, 4);
  assert.ok(result.participants.every((item) => item.viable));
});

test('three-party joint venture preset is a distinct synthetic operator starting point', () => {
  const venture = clonePreset('threePartyJointVenture');
  assert.equal(PRESETS.threePartyJointVenture.name, 'Three-party joint venture');
  assert.equal(venture.participants.length, 3);
  assert.deepEqual(venture.participants.map((item) => item.id), ['synthetic-operator', 'capital-partner', 'operator-talent']);
  assert.deepEqual(venture.participants.map((item) => item.name), ['Synthetic operator', 'Capital partner', 'Operator-talent']);
  assert.deepEqual(venture.participants.map((item) => item.revenueShare), [0.4, 0.38, 0.22]);
  assert.equal(venture.deal.monthlyVolume, 8000);
  assert.equal(venture.deal.feePerTransaction, 55);
  assert.equal(venture.participants[1].capacity, null);
  assert.notEqual(venture.participants[0].variableCostPerTransaction, venture.participants[1].variableCostPerTransaction);
  assert.notEqual(venture.participants[1].variableCostPerTransaction, venture.participants[2].variableCostPerTransaction);
  assert.notEqual(venture.participants.map((item) => item.id).join(','), clonePreset('balanced').participants.map((item) => item.id).join(','));
  assert.notEqual(venture.participants.map((item) => item.id).join(','), clonePreset('threePartyJv').participants.map((item) => item.id).join(','));
  assert.notEqual(venture.participants.map((item) => item.id).join(','), clonePreset('talentAgentPlatform').participants.map((item) => item.id).join(','));
  assert.notEqual(venture.participants.length, clonePreset('twoPartyStudio').participants.length);
  assert.notEqual(venture.participants.length, clonePreset('fourPartyMarketplace').participants.length);
  assert.notEqual(venture.participants.length, clonePreset('licensorDistributor').participants.length);
  assert.notEqual(venture.deal.feePerTransaction, clonePreset('balanced').deal.feePerTransaction);
  assert.notEqual(venture.deal.feePerTransaction, clonePreset('twoPartyStudio').deal.feePerTransaction);
  assert.notEqual(venture.deal.feePerTransaction, clonePreset('fourPartyMarketplace').deal.feePerTransaction);
  assert.notEqual(venture.deal.feePerTransaction, clonePreset('licensorDistributor').deal.feePerTransaction);
  assert.notEqual(venture.deal.feePerTransaction, clonePreset('talentAgentPlatform').deal.feePerTransaction);
  assert.notEqual(venture.deal.feePerTransaction, clonePreset('threePartyJv').deal.feePerTransaction);
  const result = calculatePartnership(venture);
  assert.equal(result.viable, true);
  assert.ok(result.participants.every((item) => item.viable));
  assert.equal(new Set(result.participants.map((item) => item.id)).size, 3);
});

test('talent, agent, and platform preset is a distinct three-party starting point', () => {
  const agency = clonePreset('talentAgentPlatform');
  assert.equal(PRESETS.talentAgentPlatform.name, 'Talent, agent, and platform');
  assert.equal(agency.participants.length, 3);
  assert.deepEqual(agency.participants.map((item) => item.id), ['talent', 'booking-agent', 'booking-platform']);
  assert.deepEqual(agency.participants.map((item) => item.name), ['Talent', 'Booking agent', 'Platform']);
  assert.deepEqual(agency.participants.map((item) => item.revenueShare), [0.62, 0.18, 0.2]);
  assert.equal(agency.deal.monthlyVolume, 7500);
  assert.equal(agency.deal.feePerTransaction, 24);
  assert.equal(agency.participants[0].capacity, null);
  assert.notEqual(agency.participants[0].variableCostPerTransaction, agency.participants[1].variableCostPerTransaction);
  assert.notEqual(agency.participants[1].variableCostPerTransaction, agency.participants[2].variableCostPerTransaction);
  assert.notEqual(agency.participants.map((item) => item.id).join(','), clonePreset('balanced').participants.map((item) => item.id).join(','));
  assert.notEqual(agency.participants.length, clonePreset('twoPartyStudio').participants.length);
  assert.notEqual(agency.participants.length, clonePreset('fourPartyMarketplace').participants.length);
  assert.notEqual(agency.participants.map((item) => item.id).join(','), clonePreset('licensorDistributor').participants.map((item) => item.id).join(','));
  assert.notEqual(agency.deal.feePerTransaction, clonePreset('balanced').deal.feePerTransaction);
  assert.notEqual(agency.deal.feePerTransaction, clonePreset('twoPartyStudio').deal.feePerTransaction);
  assert.notEqual(agency.deal.feePerTransaction, clonePreset('fourPartyMarketplace').deal.feePerTransaction);
  assert.notEqual(agency.deal.feePerTransaction, clonePreset('licensorDistributor').deal.feePerTransaction);
  const result = calculatePartnership(agency);
  assert.equal(result.viable, true);
  assert.ok(result.participants.every((item) => item.viable));
  assert.equal(new Set(result.participants.map((item) => item.id)).size, 3);
});

test('licensor and distributor preset is a distinct two-party IP starting point', () => {
  const license = clonePreset('licensorDistributor');
  assert.equal(PRESETS.licensorDistributor.name, 'Licensor and distributor');
  assert.equal(license.participants.length, 2);
  assert.deepEqual(license.participants.map((item) => item.id), ['ip-licensor', 'territory-distributor']);
  assert.deepEqual(license.participants.map((item) => item.revenueShare), [0.4, 0.6]);
  assert.equal(license.deal.feePerTransaction, 22);
  assert.equal(license.deal.monthlyVolume, 9000);
  assert.notEqual(license.participants[0].variableCostPerTransaction, license.participants[1].variableCostPerTransaction);
  assert.notEqual(license.participants[0].fixedMonthlyCost, license.participants[1].fixedMonthlyCost);
  assert.notEqual(license.deal.feePerTransaction, clonePreset('creatorTakeRate').deal.feePerTransaction);
  assert.notEqual(license.deal.feePerTransaction, clonePreset('twoPartyStudio').deal.feePerTransaction);
  assert.notEqual(license.participants.map((item) => item.id).join(','), clonePreset('twoPartyStudio').participants.map((item) => item.id).join(','));
  assert.notEqual(license.participants.length, clonePreset('threePartyJv').participants.length);
  assert.notEqual(license.participants.length, clonePreset('fourPartyMarketplace').participants.length);
  const result = calculatePartnership(license);
  assert.equal(result.viable, true);
  assert.ok(result.participants.every((item) => item.viable));
});

test('podcast host and network preset is a distinct two-party starting point', () => {
  const podcast = clonePreset('podcastHostNetwork');
  assert.equal(PRESETS.podcastHostNetwork.name, 'Podcast host and network');
  assert.equal(podcast.participants.length, 2);
  assert.deepEqual(podcast.participants.map((item) => item.id), ['podcast-host', 'podcast-network']);
  assert.deepEqual(podcast.participants.map((item) => item.name), ['Podcast host', 'Podcast network']);
  assert.deepEqual(podcast.participants.map((item) => item.revenueShare), [0.58, 0.42]);
  assert.equal(podcast.deal.monthlyVolume, 3500);
  assert.equal(podcast.deal.feePerTransaction, 14);
  assert.equal(podcast.participants[0].capacity, null);
  assert.notEqual(podcast.participants[0].variableCostPerTransaction, podcast.participants[1].variableCostPerTransaction);
  assert.notEqual(podcast.participants[0].fixedMonthlyCost, podcast.participants[1].fixedMonthlyCost);
  const others = ['balanced', 'thinMargin', 'growthAtCost', 'creatorTakeRate', 'threePartyJv', 'twoPartyStudio', 'fourPartyMarketplace', 'licensorDistributor', 'talentAgentPlatform', 'threePartyJointVenture', 'communityHallSplit', 'festivalStallSplit', 'popupCinemaSplit', 'communityRadioSplit', 'schoolConcertSplit', 'sportsCarnivalSplit', 'netballCarnivalSplit', 'swimmingCarnivalSplit', 'athleticsCarnivalSplit', 'cricketCarnivalSplit', 'tennisCarnivalSplit', 'basketballCarnivalSplit', 'volleyballCarnivalSplit', 'rugbyCarnivalSplit', 'hockeyCarnivalSplit', 'baseballCarnivalSplit', 'softballCarnivalSplit', 'lacrosseCarnivalSplit', 'waterPoloCarnivalSplit', 'rowingCarnivalSplit'];
  for (const key of others) {
    const other = clonePreset(key);
    assert.notEqual(podcast.participants.map((item) => item.id).join(','), other.participants.map((item) => item.id).join(','), key);
    assert.notEqual(JSON.stringify(podcast.deal), JSON.stringify(other.deal), key);
  }
  const result = calculatePartnership(podcast);
  assert.equal(result.viable, true);
  assert.ok(result.participants.every((item) => item.viable));
  assert.equal(new Set(result.participants.map((item) => item.id)).size, 2);
});

test('community hall split preset is a distinct venue promoter sound starting point', () => {
  const hall = clonePreset('communityHallSplit');
  assert.equal(PRESETS.communityHallSplit.name, 'Community hall split');
  assert.equal(hall.participants.length, 3);
  assert.deepEqual(hall.participants.map((item) => item.id), ['venue', 'promoter', 'sound']);
  assert.deepEqual(hall.participants.map((item) => item.name), ['Venue', 'Promoter', 'Sound']);
  assert.deepEqual(hall.participants.map((item) => item.revenueShare), [0.45, 0.35, 0.2]);
  assert.equal(hall.deal.monthlyVolume, 2000);
  assert.equal(hall.deal.feePerTransaction, 28);
  assert.notEqual(hall.participants[0].variableCostPerTransaction, hall.participants[1].variableCostPerTransaction);
  assert.notEqual(hall.participants[1].variableCostPerTransaction, hall.participants[2].variableCostPerTransaction);
  assert.notEqual(hall.participants[0].fixedMonthlyCost, hall.participants[1].fixedMonthlyCost);
  assert.notEqual(hall.participants[1].fixedMonthlyCost, hall.participants[2].fixedMonthlyCost);
  const others = ['balanced', 'thinMargin', 'growthAtCost', 'creatorTakeRate', 'threePartyJv', 'twoPartyStudio', 'fourPartyMarketplace', 'licensorDistributor', 'talentAgentPlatform', 'threePartyJointVenture', 'podcastHostNetwork', 'festivalStallSplit', 'popupCinemaSplit', 'communityRadioSplit', 'schoolConcertSplit', 'sportsCarnivalSplit', 'netballCarnivalSplit', 'swimmingCarnivalSplit', 'athleticsCarnivalSplit', 'cricketCarnivalSplit', 'tennisCarnivalSplit', 'basketballCarnivalSplit', 'volleyballCarnivalSplit', 'rugbyCarnivalSplit', 'hockeyCarnivalSplit', 'baseballCarnivalSplit', 'softballCarnivalSplit', 'lacrosseCarnivalSplit', 'waterPoloCarnivalSplit', 'rowingCarnivalSplit'];
  for (const key of others) {
    const other = clonePreset(key);
    assert.notEqual(hall.participants.map((item) => item.id).join(','), other.participants.map((item) => item.id).join(','), key);
    assert.notEqual(JSON.stringify(hall.deal), JSON.stringify(other.deal), key);
    assert.notEqual(JSON.stringify(hall.participants.map((item) => item.variableCostPerTransaction)), JSON.stringify(other.participants.map((item) => item.variableCostPerTransaction)), key);
  }
  const result = calculatePartnership(hall);
  assert.equal(result.viable, true);
  assert.ok(result.participants.every((item) => item.viable));
  assert.equal(new Set(result.participants.map((item) => item.id)).size, 3);
});

test('festival stall split preset is a distinct stallholder site ticket starting point', () => {
  const stall = clonePreset('festivalStallSplit');
  assert.equal(PRESETS.festivalStallSplit.name, 'Festival stall split');
  assert.equal(stall.participants.length, 3);
  assert.deepEqual(stall.participants.map((item) => item.id), ['stallholder', 'site-manager', 'ticket-office']);
  assert.deepEqual(stall.participants.map((item) => item.name), ['Stallholder', 'Site manager', 'Ticket office']);
  assert.deepEqual(stall.participants.map((item) => item.revenueShare), [0.48, 0.32, 0.2]);
  assert.equal(stall.deal.monthlyVolume, 2400);
  assert.equal(stall.deal.feePerTransaction, 18);
  assert.notEqual(stall.participants[0].variableCostPerTransaction, stall.participants[1].variableCostPerTransaction);
  assert.notEqual(stall.participants[1].variableCostPerTransaction, stall.participants[2].variableCostPerTransaction);
  assert.notEqual(stall.participants[0].fixedMonthlyCost, stall.participants[1].fixedMonthlyCost);
  assert.notEqual(stall.participants[1].fixedMonthlyCost, stall.participants[2].fixedMonthlyCost);
  const others = ['balanced', 'thinMargin', 'growthAtCost', 'creatorTakeRate', 'threePartyJv', 'twoPartyStudio', 'fourPartyMarketplace', 'licensorDistributor', 'talentAgentPlatform', 'threePartyJointVenture', 'podcastHostNetwork', 'communityHallSplit', 'popupCinemaSplit', 'communityRadioSplit', 'schoolConcertSplit', 'sportsCarnivalSplit', 'netballCarnivalSplit', 'swimmingCarnivalSplit', 'athleticsCarnivalSplit', 'cricketCarnivalSplit', 'tennisCarnivalSplit', 'basketballCarnivalSplit', 'volleyballCarnivalSplit', 'rugbyCarnivalSplit', 'hockeyCarnivalSplit', 'baseballCarnivalSplit', 'softballCarnivalSplit', 'lacrosseCarnivalSplit', 'waterPoloCarnivalSplit', 'rowingCarnivalSplit'];
  for (const key of others) {
    const other = clonePreset(key);
    assert.notEqual(stall.participants.map((item) => item.id).join(','), other.participants.map((item) => item.id).join(','), key);
    assert.notEqual(JSON.stringify(stall.deal), JSON.stringify(other.deal), key);
    assert.notEqual(JSON.stringify(stall.participants.map((item) => item.variableCostPerTransaction)), JSON.stringify(other.participants.map((item) => item.variableCostPerTransaction)), key);
  }
  const result = calculatePartnership(stall);
  assert.equal(result.viable, true);
  assert.ok(result.participants.every((item) => item.viable));
  assert.equal(new Set(result.participants.map((item) => item.id)).size, 3);
});

test('pop-up cinema split preset is a distinct venue projectionist ticket starting point', () => {
  const cinema = clonePreset('popupCinemaSplit');
  assert.equal(PRESETS.popupCinemaSplit.name, 'Pop-up cinema split');
  assert.equal(cinema.participants.length, 3);
  assert.deepEqual(cinema.participants.map((item) => item.id), ['cinema-venue', 'projectionist', 'ticket-desk']);
  assert.deepEqual(cinema.participants.map((item) => item.name), ['Cinema venue', 'Projectionist', 'Ticket desk']);
  assert.deepEqual(cinema.participants.map((item) => item.revenueShare), [0.42, 0.33, 0.25]);
  assert.equal(cinema.deal.monthlyVolume, 1600);
  assert.equal(cinema.deal.feePerTransaction, 24);
  assert.notEqual(cinema.participants[0].variableCostPerTransaction, cinema.participants[1].variableCostPerTransaction);
  assert.notEqual(cinema.participants[1].variableCostPerTransaction, cinema.participants[2].variableCostPerTransaction);
  assert.notEqual(cinema.participants[0].fixedMonthlyCost, cinema.participants[1].fixedMonthlyCost);
  assert.notEqual(cinema.participants[1].fixedMonthlyCost, cinema.participants[2].fixedMonthlyCost);
  const others = ['balanced', 'thinMargin', 'growthAtCost', 'creatorTakeRate', 'threePartyJv', 'twoPartyStudio', 'fourPartyMarketplace', 'licensorDistributor', 'talentAgentPlatform', 'threePartyJointVenture', 'podcastHostNetwork', 'communityHallSplit', 'festivalStallSplit', 'communityRadioSplit', 'schoolConcertSplit', 'sportsCarnivalSplit', 'netballCarnivalSplit', 'swimmingCarnivalSplit', 'athleticsCarnivalSplit', 'cricketCarnivalSplit', 'tennisCarnivalSplit', 'basketballCarnivalSplit', 'volleyballCarnivalSplit', 'rugbyCarnivalSplit', 'hockeyCarnivalSplit', 'baseballCarnivalSplit', 'softballCarnivalSplit', 'lacrosseCarnivalSplit', 'waterPoloCarnivalSplit', 'rowingCarnivalSplit'];
  for (const key of others) {
    const other = clonePreset(key);
    assert.notEqual(cinema.participants.map((item) => item.id).join(','), other.participants.map((item) => item.id).join(','), key);
    assert.notEqual(JSON.stringify(cinema.deal), JSON.stringify(other.deal), key);
    assert.notEqual(JSON.stringify(cinema.participants.map((item) => item.variableCostPerTransaction)), JSON.stringify(other.participants.map((item) => item.variableCostPerTransaction)), key);
  }
  const result = calculatePartnership(cinema);
  assert.equal(result.viable, true);
  assert.ok(result.participants.every((item) => item.viable));
  assert.equal(new Set(result.participants.map((item) => item.id)).size, 3);
});

test('community radio split preset is a distinct presenter station underwriter starting point', () => {
  const radio = clonePreset('communityRadioSplit');
  assert.equal(PRESETS.communityRadioSplit.name, 'Community radio split');
  assert.equal(radio.participants.length, 3);
  assert.deepEqual(radio.participants.map((item) => item.id), ['presenter', 'station', 'underwriter']);
  assert.deepEqual(radio.participants.map((item) => item.name), ['Presenter', 'Station', 'Underwriter']);
  assert.deepEqual(radio.participants.map((item) => item.revenueShare), [0.44, 0.36, 0.2]);
  assert.equal(radio.deal.monthlyVolume, 3200);
  assert.equal(radio.deal.feePerTransaction, 11);
  assert.notEqual(radio.participants[0].variableCostPerTransaction, radio.participants[1].variableCostPerTransaction);
  assert.notEqual(radio.participants[1].variableCostPerTransaction, radio.participants[2].variableCostPerTransaction);
  assert.notEqual(radio.participants[0].fixedMonthlyCost, radio.participants[1].fixedMonthlyCost);
  assert.notEqual(radio.participants[1].fixedMonthlyCost, radio.participants[2].fixedMonthlyCost);
  const others = ['balanced', 'thinMargin', 'growthAtCost', 'creatorTakeRate', 'threePartyJv', 'twoPartyStudio', 'fourPartyMarketplace', 'licensorDistributor', 'talentAgentPlatform', 'threePartyJointVenture', 'podcastHostNetwork', 'communityHallSplit', 'festivalStallSplit', 'popupCinemaSplit', 'schoolConcertSplit', 'sportsCarnivalSplit', 'netballCarnivalSplit', 'swimmingCarnivalSplit', 'athleticsCarnivalSplit', 'cricketCarnivalSplit', 'tennisCarnivalSplit', 'basketballCarnivalSplit', 'volleyballCarnivalSplit', 'rugbyCarnivalSplit', 'hockeyCarnivalSplit', 'baseballCarnivalSplit', 'softballCarnivalSplit', 'lacrosseCarnivalSplit', 'waterPoloCarnivalSplit', 'rowingCarnivalSplit'];
  for (const key of others) {
    const other = clonePreset(key);
    assert.notEqual(radio.participants.map((item) => item.id).join(','), other.participants.map((item) => item.id).join(','), key);
    assert.notEqual(JSON.stringify(radio.deal), JSON.stringify(other.deal), key);
    assert.notEqual(JSON.stringify(radio.participants.map((item) => item.variableCostPerTransaction)), JSON.stringify(other.participants.map((item) => item.variableCostPerTransaction)), key);
  }
  const result = calculatePartnership(radio);
  assert.equal(result.viable, true);
  assert.ok(result.participants.every((item) => item.viable));
  assert.equal(new Set(result.participants.map((item) => item.id)).size, 3);
});

test('school concert split preset is a distinct venue PTA ticketing starting point', () => {
  const concert = clonePreset('schoolConcertSplit');
  assert.equal(PRESETS.schoolConcertSplit.name, 'School concert split');
  assert.equal(concert.participants.length, 3);
  assert.deepEqual(concert.participants.map((item) => item.id), ['concert-venue', 'pta', 'ticketing']);
  assert.deepEqual(concert.participants.map((item) => item.name), ['Concert venue', 'PTA', 'Ticketing']);
  assert.deepEqual(concert.participants.map((item) => item.revenueShare), [0.46, 0.31, 0.23]);
  assert.equal(concert.deal.monthlyVolume, 1800);
  assert.equal(concert.deal.feePerTransaction, 12);
  assert.notEqual(concert.participants[0].variableCostPerTransaction, concert.participants[1].variableCostPerTransaction);
  assert.notEqual(concert.participants[1].variableCostPerTransaction, concert.participants[2].variableCostPerTransaction);
  assert.notEqual(concert.participants[0].fixedMonthlyCost, concert.participants[1].fixedMonthlyCost);
  assert.notEqual(concert.participants[1].fixedMonthlyCost, concert.participants[2].fixedMonthlyCost);
  const others = ['balanced', 'thinMargin', 'growthAtCost', 'creatorTakeRate', 'threePartyJv', 'twoPartyStudio', 'fourPartyMarketplace', 'licensorDistributor', 'talentAgentPlatform', 'threePartyJointVenture', 'podcastHostNetwork', 'communityHallSplit', 'festivalStallSplit', 'popupCinemaSplit', 'communityRadioSplit', 'sportsCarnivalSplit', 'netballCarnivalSplit', 'swimmingCarnivalSplit', 'athleticsCarnivalSplit', 'cricketCarnivalSplit', 'tennisCarnivalSplit', 'basketballCarnivalSplit', 'volleyballCarnivalSplit', 'rugbyCarnivalSplit', 'hockeyCarnivalSplit', 'baseballCarnivalSplit', 'softballCarnivalSplit', 'lacrosseCarnivalSplit', 'waterPoloCarnivalSplit', 'rowingCarnivalSplit'];
  for (const key of others) {
    const other = clonePreset(key);
    assert.notEqual(concert.participants.map((item) => item.id).join(','), other.participants.map((item) => item.id).join(','), key);
    assert.notEqual(JSON.stringify(concert.deal), JSON.stringify(other.deal), key);
    assert.notEqual(JSON.stringify(concert.participants.map((item) => item.variableCostPerTransaction)), JSON.stringify(other.participants.map((item) => item.variableCostPerTransaction)), key);
  }
  const result = calculatePartnership(concert);
  assert.equal(result.viable, true);
  assert.ok(result.participants.every((item) => item.viable));
  assert.equal(new Set(result.participants.map((item) => item.id)).size, 3);
});

test('sports carnival split preset is a distinct carnival ride ticket starting point', () => {
  const carnival = clonePreset('sportsCarnivalSplit');
  assert.equal(PRESETS.sportsCarnivalSplit.name, 'Sports carnival split');
  assert.equal(carnival.participants.length, 3);
  assert.deepEqual(carnival.participants.map((item) => item.id), ['carnival-committee', 'ride-operator', 'ticket-booth']);
  assert.deepEqual(carnival.participants.map((item) => item.name), ['Carnival committee', 'Ride operator', 'Ticket booth']);
  assert.deepEqual(carnival.participants.map((item) => item.revenueShare), [0.43, 0.35, 0.22]);
  assert.equal(carnival.deal.monthlyVolume, 2800);
  assert.equal(carnival.deal.feePerTransaction, 16);
  assert.notEqual(carnival.participants[0].variableCostPerTransaction, carnival.participants[1].variableCostPerTransaction);
  assert.notEqual(carnival.participants[1].variableCostPerTransaction, carnival.participants[2].variableCostPerTransaction);
  assert.notEqual(carnival.participants[0].fixedMonthlyCost, carnival.participants[1].fixedMonthlyCost);
  assert.notEqual(carnival.participants[1].fixedMonthlyCost, carnival.participants[2].fixedMonthlyCost);
  const others = ['balanced', 'thinMargin', 'growthAtCost', 'creatorTakeRate', 'threePartyJv', 'twoPartyStudio', 'fourPartyMarketplace', 'licensorDistributor', 'talentAgentPlatform', 'threePartyJointVenture', 'podcastHostNetwork', 'communityHallSplit', 'festivalStallSplit', 'popupCinemaSplit', 'communityRadioSplit', 'schoolConcertSplit', 'netballCarnivalSplit', 'swimmingCarnivalSplit', 'athleticsCarnivalSplit', 'cricketCarnivalSplit', 'tennisCarnivalSplit', 'basketballCarnivalSplit', 'volleyballCarnivalSplit', 'rugbyCarnivalSplit', 'hockeyCarnivalSplit', 'baseballCarnivalSplit', 'softballCarnivalSplit', 'lacrosseCarnivalSplit', 'waterPoloCarnivalSplit', 'rowingCarnivalSplit'];
  for (const key of others) {
    const other = clonePreset(key);
    assert.notEqual(carnival.participants.map((item) => item.id).join(','), other.participants.map((item) => item.id).join(','), key);
    assert.notEqual(JSON.stringify(carnival.deal), JSON.stringify(other.deal), key);
    assert.notEqual(JSON.stringify(carnival.participants.map((item) => item.variableCostPerTransaction)), JSON.stringify(other.participants.map((item) => item.variableCostPerTransaction)), key);
  }
  const result = calculatePartnership(carnival);
  assert.equal(result.viable, true);
  assert.ok(result.participants.every((item) => item.viable));
  assert.equal(new Set(result.participants.map((item) => item.id)).size, 3);
});

test('netball carnival split preset is a distinct committee canteen first-aid starting point', () => {
  const netball = clonePreset('netballCarnivalSplit');
  assert.equal(PRESETS.netballCarnivalSplit.name, 'Netball carnival');
  assert.equal(netball.participants.length, 3);
  assert.deepEqual(netball.participants.map((item) => item.id), ['netball-committee', 'canteen', 'first-aid']);
  assert.deepEqual(netball.participants.map((item) => item.name), ['Carnival committee', 'Canteen', 'First-aid']);
  assert.deepEqual(netball.participants.map((item) => item.revenueShare), [0.41, 0.34, 0.25]);
  assert.equal(netball.deal.monthlyVolume, 2100);
  assert.equal(netball.deal.feePerTransaction, 14);
  assert.notEqual(netball.participants[0].variableCostPerTransaction, netball.participants[1].variableCostPerTransaction);
  assert.notEqual(netball.participants[1].variableCostPerTransaction, netball.participants[2].variableCostPerTransaction);
  assert.notEqual(netball.participants[0].fixedMonthlyCost, netball.participants[1].fixedMonthlyCost);
  assert.notEqual(netball.participants[1].fixedMonthlyCost, netball.participants[2].fixedMonthlyCost);
  const others = ['balanced', 'thinMargin', 'growthAtCost', 'creatorTakeRate', 'threePartyJv', 'twoPartyStudio', 'fourPartyMarketplace', 'licensorDistributor', 'talentAgentPlatform', 'threePartyJointVenture', 'podcastHostNetwork', 'communityHallSplit', 'festivalStallSplit', 'popupCinemaSplit', 'communityRadioSplit', 'schoolConcertSplit', 'sportsCarnivalSplit', 'swimmingCarnivalSplit', 'athleticsCarnivalSplit', 'cricketCarnivalSplit', 'tennisCarnivalSplit', 'basketballCarnivalSplit', 'volleyballCarnivalSplit', 'rugbyCarnivalSplit', 'hockeyCarnivalSplit', 'baseballCarnivalSplit', 'softballCarnivalSplit', 'lacrosseCarnivalSplit', 'waterPoloCarnivalSplit', 'rowingCarnivalSplit'];
  for (const key of others) {
    const other = clonePreset(key);
    assert.notEqual(netball.participants.map((item) => item.id).join(','), other.participants.map((item) => item.id).join(','), key);
    assert.notEqual(JSON.stringify(netball.deal), JSON.stringify(other.deal), key);
    assert.notEqual(JSON.stringify(netball.participants.map((item) => item.variableCostPerTransaction)), JSON.stringify(other.participants.map((item) => item.variableCostPerTransaction)), key);
    assert.notEqual(JSON.stringify(netball.participants.map((item) => item.fixedMonthlyCost)), JSON.stringify(other.participants.map((item) => item.fixedMonthlyCost)), key);
  }
  const result = calculatePartnership(netball);
  assert.equal(result.viable, true);
  assert.ok(result.participants.every((item) => item.viable));
  assert.equal(new Set(result.participants.map((item) => item.id)).size, 3);
});

test('swimming carnival split preset is a distinct committee pool-operations canteen starting point', () => {
  const swimming = clonePreset('swimmingCarnivalSplit');
  assert.equal(PRESETS.swimmingCarnivalSplit.name, 'Swimming carnival split');
  assert.equal(swimming.participants.length, 3);
  assert.deepEqual(swimming.participants.map((item) => item.id), ['swimming-committee', 'pool-operations', 'swim-canteen']);
  assert.deepEqual(swimming.participants.map((item) => item.name), ['Carnival committee', 'Pool operations', 'Canteen']);
  assert.deepEqual(swimming.participants.map((item) => item.revenueShare), [0.4, 0.36, 0.24]);
  assert.equal(swimming.deal.monthlyVolume, 2300);
  assert.equal(swimming.deal.feePerTransaction, 15);
  assert.notEqual(swimming.participants[0].variableCostPerTransaction, swimming.participants[1].variableCostPerTransaction);
  assert.notEqual(swimming.participants[1].variableCostPerTransaction, swimming.participants[2].variableCostPerTransaction);
  assert.notEqual(swimming.participants[0].fixedMonthlyCost, swimming.participants[1].fixedMonthlyCost);
  assert.notEqual(swimming.participants[1].fixedMonthlyCost, swimming.participants[2].fixedMonthlyCost);
  const others = ['balanced', 'thinMargin', 'growthAtCost', 'creatorTakeRate', 'threePartyJv', 'twoPartyStudio', 'fourPartyMarketplace', 'licensorDistributor', 'talentAgentPlatform', 'threePartyJointVenture', 'podcastHostNetwork', 'communityHallSplit', 'festivalStallSplit', 'popupCinemaSplit', 'communityRadioSplit', 'schoolConcertSplit', 'sportsCarnivalSplit', 'netballCarnivalSplit', 'athleticsCarnivalSplit', 'cricketCarnivalSplit', 'tennisCarnivalSplit', 'basketballCarnivalSplit', 'volleyballCarnivalSplit', 'rugbyCarnivalSplit', 'hockeyCarnivalSplit', 'baseballCarnivalSplit', 'softballCarnivalSplit', 'lacrosseCarnivalSplit', 'waterPoloCarnivalSplit', 'rowingCarnivalSplit'];
  for (const key of others) {
    const other = clonePreset(key);
    assert.notEqual(swimming.participants.map((item) => item.id).join(','), other.participants.map((item) => item.id).join(','), key);
    assert.notEqual(JSON.stringify(swimming.deal), JSON.stringify(other.deal), key);
    assert.notEqual(JSON.stringify(swimming.participants.map((item) => item.variableCostPerTransaction)), JSON.stringify(other.participants.map((item) => item.variableCostPerTransaction)), key);
    assert.notEqual(JSON.stringify(swimming.participants.map((item) => item.fixedMonthlyCost)), JSON.stringify(other.participants.map((item) => item.fixedMonthlyCost)), key);
  }
  const result = calculatePartnership(swimming);
  assert.equal(result.viable, true);
  assert.ok(result.participants.every((item) => item.viable));
  assert.equal(new Set(result.participants.map((item) => item.id)).size, 3);
});

test('athletics carnival split preset is a distinct committee track-hire first-aid starting point', () => {
  const athletics = clonePreset('athleticsCarnivalSplit');
  assert.equal(PRESETS.athleticsCarnivalSplit.name, 'Athletics carnival split');
  assert.equal(athletics.participants.length, 3);
  assert.deepEqual(athletics.participants.map((item) => item.id), ['athletics-committee', 'track-hire', 'athletics-first-aid']);
  assert.deepEqual(athletics.participants.map((item) => item.name), ['Carnival committee', 'Track hire', 'First-aid']);
  assert.deepEqual(athletics.participants.map((item) => item.revenueShare), [0.42, 0.33, 0.25]);
  assert.equal(athletics.deal.monthlyVolume, 2500);
  assert.equal(athletics.deal.feePerTransaction, 13);
  assert.notEqual(athletics.participants[0].variableCostPerTransaction, athletics.participants[1].variableCostPerTransaction);
  assert.notEqual(athletics.participants[1].variableCostPerTransaction, athletics.participants[2].variableCostPerTransaction);
  assert.notEqual(athletics.participants[0].fixedMonthlyCost, athletics.participants[1].fixedMonthlyCost);
  assert.notEqual(athletics.participants[1].fixedMonthlyCost, athletics.participants[2].fixedMonthlyCost);
  const others = ['balanced', 'thinMargin', 'growthAtCost', 'creatorTakeRate', 'threePartyJv', 'twoPartyStudio', 'fourPartyMarketplace', 'licensorDistributor', 'talentAgentPlatform', 'threePartyJointVenture', 'podcastHostNetwork', 'communityHallSplit', 'festivalStallSplit', 'popupCinemaSplit', 'communityRadioSplit', 'schoolConcertSplit', 'sportsCarnivalSplit', 'netballCarnivalSplit', 'swimmingCarnivalSplit', 'cricketCarnivalSplit', 'tennisCarnivalSplit', 'basketballCarnivalSplit', 'volleyballCarnivalSplit', 'rugbyCarnivalSplit', 'hockeyCarnivalSplit', 'baseballCarnivalSplit', 'softballCarnivalSplit', 'lacrosseCarnivalSplit', 'waterPoloCarnivalSplit', 'rowingCarnivalSplit'];
  for (const key of others) {
    const other = clonePreset(key);
    assert.notEqual(athletics.participants.map((item) => item.id).join(','), other.participants.map((item) => item.id).join(','), key);
    assert.notEqual(JSON.stringify(athletics.deal), JSON.stringify(other.deal), key);
    assert.notEqual(JSON.stringify(athletics.participants.map((item) => item.variableCostPerTransaction)), JSON.stringify(other.participants.map((item) => item.variableCostPerTransaction)), key);
    assert.notEqual(JSON.stringify(athletics.participants.map((item) => item.fixedMonthlyCost)), JSON.stringify(other.participants.map((item) => item.fixedMonthlyCost)), key);
  }
  const result = calculatePartnership(athletics);
  assert.equal(result.viable, true);
  assert.ok(result.participants.every((item) => item.viable));
  assert.equal(new Set(result.participants.map((item) => item.id)).size, 3);
});

test('cricket carnival split preset is a distinct committee pitch-hire first-aid starting point', () => {
  const cricket = clonePreset('cricketCarnivalSplit');
  assert.equal(PRESETS.cricketCarnivalSplit.name, 'Cricket carnival split');
  assert.equal(cricket.participants.length, 3);
  assert.deepEqual(cricket.participants.map((item) => item.id), ['cricket-committee', 'pitch-hire', 'cricket-first-aid']);
  assert.deepEqual(cricket.participants.map((item) => item.name), ['Carnival committee', 'Pitch hire', 'First-aid']);
  assert.deepEqual(cricket.participants.map((item) => item.revenueShare), [0.38, 0.37, 0.25]);
  assert.equal(cricket.deal.monthlyVolume, 2700);
  assert.equal(cricket.deal.feePerTransaction, 12);
  assert.notEqual(cricket.participants[0].variableCostPerTransaction, cricket.participants[1].variableCostPerTransaction);
  assert.notEqual(cricket.participants[1].variableCostPerTransaction, cricket.participants[2].variableCostPerTransaction);
  assert.notEqual(cricket.participants[0].fixedMonthlyCost, cricket.participants[1].fixedMonthlyCost);
  assert.notEqual(cricket.participants[1].fixedMonthlyCost, cricket.participants[2].fixedMonthlyCost);
  const others = ['balanced', 'thinMargin', 'growthAtCost', 'creatorTakeRate', 'threePartyJv', 'twoPartyStudio', 'fourPartyMarketplace', 'licensorDistributor', 'talentAgentPlatform', 'threePartyJointVenture', 'podcastHostNetwork', 'communityHallSplit', 'festivalStallSplit', 'popupCinemaSplit', 'communityRadioSplit', 'schoolConcertSplit', 'sportsCarnivalSplit', 'netballCarnivalSplit', 'swimmingCarnivalSplit', 'athleticsCarnivalSplit', 'tennisCarnivalSplit', 'basketballCarnivalSplit', 'volleyballCarnivalSplit', 'rugbyCarnivalSplit', 'hockeyCarnivalSplit', 'baseballCarnivalSplit', 'softballCarnivalSplit', 'lacrosseCarnivalSplit', 'waterPoloCarnivalSplit', 'rowingCarnivalSplit'];
  for (const key of others) {
    const other = clonePreset(key);
    assert.notEqual(cricket.participants.map((item) => item.id).join(','), other.participants.map((item) => item.id).join(','), key);
    assert.notEqual(JSON.stringify(cricket.deal), JSON.stringify(other.deal), key);
    assert.notEqual(JSON.stringify(cricket.participants.map((item) => item.variableCostPerTransaction)), JSON.stringify(other.participants.map((item) => item.variableCostPerTransaction)), key);
    assert.notEqual(JSON.stringify(cricket.participants.map((item) => item.fixedMonthlyCost)), JSON.stringify(other.participants.map((item) => item.fixedMonthlyCost)), key);
  }
  const result = calculatePartnership(cricket);
  assert.equal(result.viable, true);
  assert.ok(result.participants.every((item) => item.viable));
  assert.equal(new Set(result.participants.map((item) => item.id)).size, 3);
});

test('tennis carnival split preset is a distinct committee court-hire first-aid starting point', () => {
  const tennis = clonePreset('tennisCarnivalSplit');
  assert.equal(PRESETS.tennisCarnivalSplit.name, 'Tennis carnival split');
  assert.equal(tennis.participants.length, 3);
  assert.deepEqual(tennis.participants.map((item) => item.id), ['tennis-committee', 'court-hire', 'tennis-first-aid']);
  assert.deepEqual(tennis.participants.map((item) => item.name), ['Carnival committee', 'Court hire', 'First-aid']);
  assert.deepEqual(tennis.participants.map((item) => item.revenueShare), [0.39, 0.36, 0.25]);
  assert.equal(tennis.deal.monthlyVolume, 2900);
  assert.equal(tennis.deal.feePerTransaction, 11);
  assert.notEqual(tennis.participants[0].variableCostPerTransaction, tennis.participants[1].variableCostPerTransaction);
  assert.notEqual(tennis.participants[1].variableCostPerTransaction, tennis.participants[2].variableCostPerTransaction);
  assert.notEqual(tennis.participants[0].fixedMonthlyCost, tennis.participants[1].fixedMonthlyCost);
  assert.notEqual(tennis.participants[1].fixedMonthlyCost, tennis.participants[2].fixedMonthlyCost);
  const others = ['balanced', 'thinMargin', 'growthAtCost', 'creatorTakeRate', 'threePartyJv', 'twoPartyStudio', 'fourPartyMarketplace', 'licensorDistributor', 'talentAgentPlatform', 'threePartyJointVenture', 'podcastHostNetwork', 'communityHallSplit', 'festivalStallSplit', 'popupCinemaSplit', 'communityRadioSplit', 'schoolConcertSplit', 'sportsCarnivalSplit', 'netballCarnivalSplit', 'swimmingCarnivalSplit', 'athleticsCarnivalSplit', 'cricketCarnivalSplit', 'basketballCarnivalSplit', 'volleyballCarnivalSplit', 'rugbyCarnivalSplit', 'hockeyCarnivalSplit', 'baseballCarnivalSplit', 'softballCarnivalSplit', 'lacrosseCarnivalSplit', 'waterPoloCarnivalSplit', 'rowingCarnivalSplit'];
  for (const key of others) {
    const other = clonePreset(key);
    assert.notEqual(tennis.participants.map((item) => item.id).join(','), other.participants.map((item) => item.id).join(','), key);
    assert.notEqual(JSON.stringify(tennis.deal), JSON.stringify(other.deal), key);
    assert.notEqual(JSON.stringify(tennis.participants.map((item) => item.variableCostPerTransaction)), JSON.stringify(other.participants.map((item) => item.variableCostPerTransaction)), key);
    assert.notEqual(JSON.stringify(tennis.participants.map((item) => item.fixedMonthlyCost)), JSON.stringify(other.participants.map((item) => item.fixedMonthlyCost)), key);
  }
  const result = calculatePartnership(tennis);
  assert.equal(result.viable, true);
  assert.ok(result.participants.every((item) => item.viable));
  assert.equal(new Set(result.participants.map((item) => item.id)).size, 3);
});

test('basketball carnival split preset is a distinct committee stadium-hire first-aid starting point', () => {
  const basketball = clonePreset('basketballCarnivalSplit');
  assert.equal(PRESETS.basketballCarnivalSplit.name, 'Basketball carnival split');
  assert.equal(basketball.participants.length, 3);
  assert.deepEqual(basketball.participants.map((item) => item.id), ['basketball-committee', 'stadium-hire', 'basketball-first-aid']);
  assert.deepEqual(basketball.participants.map((item) => item.name), ['Carnival committee', 'Stadium hire', 'First-aid']);
  assert.deepEqual(basketball.participants.map((item) => item.revenueShare), [0.4, 0.35, 0.25]);
  assert.equal(basketball.deal.monthlyVolume, 3100);
  assert.equal(basketball.deal.feePerTransaction, 10);
  assert.notEqual(basketball.participants[0].variableCostPerTransaction, basketball.participants[1].variableCostPerTransaction);
  assert.notEqual(basketball.participants[1].variableCostPerTransaction, basketball.participants[2].variableCostPerTransaction);
  assert.notEqual(basketball.participants[0].fixedMonthlyCost, basketball.participants[1].fixedMonthlyCost);
  assert.notEqual(basketball.participants[1].fixedMonthlyCost, basketball.participants[2].fixedMonthlyCost);
  const others = ['balanced', 'thinMargin', 'growthAtCost', 'creatorTakeRate', 'threePartyJv', 'twoPartyStudio', 'fourPartyMarketplace', 'licensorDistributor', 'talentAgentPlatform', 'threePartyJointVenture', 'podcastHostNetwork', 'communityHallSplit', 'festivalStallSplit', 'popupCinemaSplit', 'communityRadioSplit', 'schoolConcertSplit', 'sportsCarnivalSplit', 'netballCarnivalSplit', 'swimmingCarnivalSplit', 'athleticsCarnivalSplit', 'cricketCarnivalSplit', 'tennisCarnivalSplit', 'volleyballCarnivalSplit', 'rugbyCarnivalSplit', 'hockeyCarnivalSplit', 'baseballCarnivalSplit', 'softballCarnivalSplit', 'lacrosseCarnivalSplit', 'waterPoloCarnivalSplit', 'rowingCarnivalSplit'];
  for (const key of others) {
    const other = clonePreset(key);
    assert.notEqual(basketball.participants.map((item) => item.id).join(','), other.participants.map((item) => item.id).join(','), key);
    assert.notEqual(JSON.stringify(basketball.deal), JSON.stringify(other.deal), key);
    assert.notEqual(JSON.stringify(basketball.participants.map((item) => item.variableCostPerTransaction)), JSON.stringify(other.participants.map((item) => item.variableCostPerTransaction)), key);
    assert.notEqual(JSON.stringify(basketball.participants.map((item) => item.fixedMonthlyCost)), JSON.stringify(other.participants.map((item) => item.fixedMonthlyCost)), key);
  }
  const result = calculatePartnership(basketball);
  assert.equal(result.viable, true);
  assert.ok(result.participants.every((item) => item.viable));
  assert.equal(new Set(result.participants.map((item) => item.id)).size, 3);
});

test('volleyball carnival split preset is a distinct committee court-hire first-aid starting point', () => {
  const volleyball = clonePreset('volleyballCarnivalSplit');
  assert.equal(PRESETS.volleyballCarnivalSplit.name, 'Volleyball carnival split');
  assert.equal(volleyball.participants.length, 3);
  assert.deepEqual(volleyball.participants.map((item) => item.id), ['volleyball-committee', 'volleyball-court-hire', 'volleyball-first-aid']);
  assert.deepEqual(volleyball.participants.map((item) => item.name), ['Carnival committee', 'Court hire', 'First-aid']);
  assert.deepEqual(volleyball.participants.map((item) => item.revenueShare), [0.36, 0.39, 0.25]);
  assert.equal(volleyball.deal.monthlyVolume, 3300);
  assert.equal(volleyball.deal.feePerTransaction, 9.5);
  assert.notEqual(volleyball.participants[0].variableCostPerTransaction, volleyball.participants[1].variableCostPerTransaction);
  assert.notEqual(volleyball.participants[1].variableCostPerTransaction, volleyball.participants[2].variableCostPerTransaction);
  assert.notEqual(volleyball.participants[0].fixedMonthlyCost, volleyball.participants[1].fixedMonthlyCost);
  assert.notEqual(volleyball.participants[1].fixedMonthlyCost, volleyball.participants[2].fixedMonthlyCost);
  const others = ['balanced', 'thinMargin', 'growthAtCost', 'creatorTakeRate', 'threePartyJv', 'twoPartyStudio', 'fourPartyMarketplace', 'licensorDistributor', 'talentAgentPlatform', 'threePartyJointVenture', 'podcastHostNetwork', 'communityHallSplit', 'festivalStallSplit', 'popupCinemaSplit', 'communityRadioSplit', 'schoolConcertSplit', 'sportsCarnivalSplit', 'netballCarnivalSplit', 'swimmingCarnivalSplit', 'athleticsCarnivalSplit', 'cricketCarnivalSplit', 'tennisCarnivalSplit', 'basketballCarnivalSplit', 'rugbyCarnivalSplit', 'hockeyCarnivalSplit', 'baseballCarnivalSplit', 'softballCarnivalSplit', 'lacrosseCarnivalSplit', 'waterPoloCarnivalSplit', 'rowingCarnivalSplit'];
  for (const key of others) {
    const other = clonePreset(key);
    assert.notEqual(volleyball.participants.map((item) => item.id).join(','), other.participants.map((item) => item.id).join(','), key);
    assert.notEqual(JSON.stringify(volleyball.deal), JSON.stringify(other.deal), key);
    assert.notEqual(JSON.stringify(volleyball.participants.map((item) => item.variableCostPerTransaction)), JSON.stringify(other.participants.map((item) => item.variableCostPerTransaction)), key);
    assert.notEqual(JSON.stringify(volleyball.participants.map((item) => item.fixedMonthlyCost)), JSON.stringify(other.participants.map((item) => item.fixedMonthlyCost)), key);
  }
  const tennis = clonePreset('tennisCarnivalSplit');
  const basketball = clonePreset('basketballCarnivalSplit');
  assert.notEqual(JSON.stringify(volleyball.deal), JSON.stringify(tennis.deal));
  assert.notEqual(JSON.stringify(volleyball.deal), JSON.stringify(basketball.deal));
  assert.notEqual(volleyball.participants.map((item) => item.id).join(','), tennis.participants.map((item) => item.id).join(','));
  assert.notEqual(volleyball.participants.map((item) => item.id).join(','), basketball.participants.map((item) => item.id).join(','));
  const result = calculatePartnership(volleyball);
  assert.equal(result.viable, true);
  assert.ok(result.participants.every((item) => item.viable));
  assert.equal(new Set(result.participants.map((item) => item.id)).size, 3);
});

test('volleyball carnival remaining listed capacity is distinct from tennis and basketball', () => {
  const volleyball = clonePreset('volleyballCarnivalSplit');
  const result = calculatePartnership(volleyball);
  assert.equal(result.effectiveVolume, 3300);
  const remaining = volleyball.participants.map((item) => item.capacity - result.effectiveVolume);
  assert.deepEqual(remaining, [600, 1800, 250]);
  assert.ok(remaining.every((value) => value > 1e-9));
  const lastWithin = [...volleyball.participants].reverse().find((item) => item.capacity - result.effectiveVolume >= -1e-9);
  assert.equal(lastWithin.id, 'volleyball-first-aid');
  const lastSpare = [...volleyball.participants].reverse().find((item) => item.capacity - result.effectiveVolume > 1e-9);
  assert.equal(lastSpare.id, 'volleyball-first-aid');
  const tennis = clonePreset('tennisCarnivalSplit');
  const basketball = clonePreset('basketballCarnivalSplit');
  const tennisRemaining = tennis.participants.map((item) => item.capacity - calculatePartnership(tennis).effectiveVolume);
  const basketballRemaining = basketball.participants.map((item) => item.capacity - calculatePartnership(basketball).effectiveVolume);
  assert.notEqual(JSON.stringify(remaining), JSON.stringify(tennisRemaining));
  assert.notEqual(JSON.stringify(remaining), JSON.stringify(basketballRemaining));
  assert.notEqual(result.effectiveVolume, calculatePartnership(tennis).effectiveVolume);
  assert.notEqual(result.effectiveVolume, calculatePartnership(basketball).effectiveVolume);
});


test('rugby carnival split preset is a distinct committee ground-hire first-aid starting point', () => {
  const rugby = clonePreset('rugbyCarnivalSplit');
  assert.equal(PRESETS.rugbyCarnivalSplit.name, 'Rugby carnival split');
  assert.equal(rugby.participants.length, 3);
  assert.deepEqual(rugby.participants.map((item) => item.id), ['rugby-committee', 'rugby-ground-hire', 'rugby-first-aid']);
  assert.deepEqual(rugby.participants.map((item) => item.name), ['Carnival committee', 'Ground hire', 'First-aid']);
  assert.deepEqual(rugby.participants.map((item) => item.revenueShare), [0.37, 0.38, 0.25]);
  assert.equal(rugby.deal.monthlyVolume, 3500);
  assert.equal(rugby.deal.feePerTransaction, 9);
  assert.notEqual(rugby.participants[0].variableCostPerTransaction, rugby.participants[1].variableCostPerTransaction);
  assert.notEqual(rugby.participants[1].variableCostPerTransaction, rugby.participants[2].variableCostPerTransaction);
  assert.notEqual(rugby.participants[0].fixedMonthlyCost, rugby.participants[1].fixedMonthlyCost);
  assert.notEqual(rugby.participants[1].fixedMonthlyCost, rugby.participants[2].fixedMonthlyCost);
  const others = ['balanced', 'thinMargin', 'growthAtCost', 'creatorTakeRate', 'threePartyJv', 'twoPartyStudio', 'fourPartyMarketplace', 'licensorDistributor', 'talentAgentPlatform', 'threePartyJointVenture', 'podcastHostNetwork', 'communityHallSplit', 'festivalStallSplit', 'popupCinemaSplit', 'communityRadioSplit', 'schoolConcertSplit', 'sportsCarnivalSplit', 'netballCarnivalSplit', 'swimmingCarnivalSplit', 'athleticsCarnivalSplit', 'cricketCarnivalSplit', 'tennisCarnivalSplit', 'basketballCarnivalSplit', 'volleyballCarnivalSplit', 'hockeyCarnivalSplit', 'baseballCarnivalSplit', 'softballCarnivalSplit', 'lacrosseCarnivalSplit', 'waterPoloCarnivalSplit', 'rowingCarnivalSplit'];
  for (const key of others) {
    const other = clonePreset(key);
    assert.notEqual(rugby.participants.map((item) => item.id).join(','), other.participants.map((item) => item.id).join(','), key);
    assert.notEqual(JSON.stringify(rugby.deal), JSON.stringify(other.deal), key);
    assert.notEqual(JSON.stringify(rugby.participants.map((item) => item.variableCostPerTransaction)), JSON.stringify(other.participants.map((item) => item.variableCostPerTransaction)), key);
    assert.notEqual(JSON.stringify(rugby.participants.map((item) => item.fixedMonthlyCost)), JSON.stringify(other.participants.map((item) => item.fixedMonthlyCost)), key);
  }
  const volleyball = clonePreset('volleyballCarnivalSplit');
  const basketball = clonePreset('basketballCarnivalSplit');
  assert.notEqual(JSON.stringify(rugby.deal), JSON.stringify(volleyball.deal));
  assert.notEqual(JSON.stringify(rugby.deal), JSON.stringify(basketball.deal));
  assert.notEqual(rugby.participants.map((item) => item.id).join(','), volleyball.participants.map((item) => item.id).join(','));
  assert.notEqual(rugby.participants.map((item) => item.id).join(','), basketball.participants.map((item) => item.id).join(','));
  const result = calculatePartnership(rugby);
  assert.equal(result.viable, true);
  assert.ok(result.participants.every((item) => item.viable));
  assert.equal(new Set(result.participants.map((item) => item.id)).size, 3);
});

test('rugby carnival remaining listed capacity is distinct from volleyball and basketball', () => {
  const rugby = clonePreset('rugbyCarnivalSplit');
  const result = calculatePartnership(rugby);
  assert.equal(result.effectiveVolume, 3500);
  const remaining = rugby.participants.map((item) => item.capacity - result.effectiveVolume);
  assert.deepEqual(remaining, [700, 1800, 0]);
  const lastWithin = [...rugby.participants].reverse().find((item) => item.capacity - result.effectiveVolume >= -1e-9);
  assert.equal(lastWithin.id, 'rugby-first-aid');
  const lastSpare = [...rugby.participants].reverse().find((item) => item.capacity - result.effectiveVolume > 1e-9);
  assert.equal(lastSpare.id, 'rugby-ground-hire');
  const firstSpare = rugby.participants.find((item) => item.capacity - result.effectiveVolume > 1e-9);
  assert.equal(firstSpare.id, 'rugby-committee');
  assert.notEqual(lastSpare.id, lastWithin.id);
  const volleyball = clonePreset('volleyballCarnivalSplit');
  const basketball = clonePreset('basketballCarnivalSplit');
  const volleyballRemaining = volleyball.participants.map((item) => item.capacity - calculatePartnership(volleyball).effectiveVolume);
  const basketballRemaining = basketball.participants.map((item) => item.capacity - calculatePartnership(basketball).effectiveVolume);
  assert.notEqual(JSON.stringify(remaining), JSON.stringify(volleyballRemaining));
  assert.notEqual(JSON.stringify(remaining), JSON.stringify(basketballRemaining));
  assert.notEqual(result.effectiveVolume, calculatePartnership(volleyball).effectiveVolume);
  assert.notEqual(result.effectiveVolume, calculatePartnership(basketball).effectiveVolume);
});

test('hockey carnival split preset is a distinct committee ice-hire first-aid starting point', () => {
  const hockey = clonePreset('hockeyCarnivalSplit');
  assert.equal(PRESETS.hockeyCarnivalSplit.name, 'Hockey carnival split');
  assert.equal(hockey.participants.length, 3);
  assert.deepEqual(hockey.participants.map((item) => item.id), ['hockey-committee', 'hockey-ice-hire', 'hockey-first-aid']);
  assert.deepEqual(hockey.participants.map((item) => item.name), ['Carnival committee', 'Ice hire', 'First-aid']);
  assert.deepEqual(hockey.participants.map((item) => item.revenueShare), [0.37, 0.38, 0.25]);
  assert.equal(hockey.deal.monthlyVolume, 3700);
  assert.equal(hockey.deal.feePerTransaction, 8.5);
  assert.equal(hockey.deal.addressableVolume, 4900);
  assert.notEqual(hockey.participants[0].variableCostPerTransaction, hockey.participants[1].variableCostPerTransaction);
  assert.notEqual(hockey.participants[1].variableCostPerTransaction, hockey.participants[2].variableCostPerTransaction);
  assert.notEqual(hockey.participants[0].fixedMonthlyCost, hockey.participants[1].fixedMonthlyCost);
  assert.notEqual(hockey.participants[1].fixedMonthlyCost, hockey.participants[2].fixedMonthlyCost);
  const others = ['balanced', 'thinMargin', 'growthAtCost', 'creatorTakeRate', 'threePartyJv', 'twoPartyStudio', 'fourPartyMarketplace', 'licensorDistributor', 'talentAgentPlatform', 'threePartyJointVenture', 'podcastHostNetwork', 'communityHallSplit', 'festivalStallSplit', 'popupCinemaSplit', 'communityRadioSplit', 'schoolConcertSplit', 'sportsCarnivalSplit', 'netballCarnivalSplit', 'swimmingCarnivalSplit', 'athleticsCarnivalSplit', 'cricketCarnivalSplit', 'tennisCarnivalSplit', 'basketballCarnivalSplit', 'volleyballCarnivalSplit', 'rugbyCarnivalSplit', 'baseballCarnivalSplit', 'softballCarnivalSplit', 'lacrosseCarnivalSplit', 'waterPoloCarnivalSplit', 'rowingCarnivalSplit'];
  for (const key of others) {
    const other = clonePreset(key);
    assert.notEqual(hockey.participants.map((item) => item.id).join(','), other.participants.map((item) => item.id).join(','), key);
    assert.notEqual(JSON.stringify(hockey.deal), JSON.stringify(other.deal), key);
    assert.notEqual(JSON.stringify(hockey.participants.map((item) => item.variableCostPerTransaction)), JSON.stringify(other.participants.map((item) => item.variableCostPerTransaction)), key);
    assert.notEqual(JSON.stringify(hockey.participants.map((item) => item.fixedMonthlyCost)), JSON.stringify(other.participants.map((item) => item.fixedMonthlyCost)), key);
  }
  const rugby = clonePreset('rugbyCarnivalSplit');
  const volleyball = clonePreset('volleyballCarnivalSplit');
  const basketball = clonePreset('basketballCarnivalSplit');
  assert.notEqual(JSON.stringify(hockey.deal), JSON.stringify(rugby.deal));
  assert.notEqual(JSON.stringify(hockey.deal), JSON.stringify(volleyball.deal));
  assert.notEqual(JSON.stringify(hockey.deal), JSON.stringify(basketball.deal));
  assert.notEqual(hockey.participants.map((item) => item.id).join(','), rugby.participants.map((item) => item.id).join(','));
  assert.notEqual(hockey.participants.map((item) => item.id).join(','), volleyball.participants.map((item) => item.id).join(','));
  assert.notEqual(hockey.participants.map((item) => item.id).join(','), basketball.participants.map((item) => item.id).join(','));
  const result = calculatePartnership(hockey);
  assert.equal(result.viable, true);
  assert.ok(result.participants.every((item) => item.viable));
  assert.equal(new Set(result.participants.map((item) => item.id)).size, 3);
});

test('hockey carnival remaining listed capacity is distinct from rugby volleyball and basketball', () => {
  const hockey = clonePreset('hockeyCarnivalSplit');
  const result = calculatePartnership(hockey);
  assert.equal(result.effectiveVolume, 3700);
  const remaining = hockey.participants.map((item) => item.capacity - result.effectiveVolume);
  assert.deepEqual(remaining, [800, 1900, 0]);
  const lastWithin = [...hockey.participants].reverse().find((item) => item.capacity - result.effectiveVolume >= -1e-9);
  assert.equal(lastWithin.id, 'hockey-first-aid');
  assert.equal(remaining[2], 0);
  const lastSpare = [...hockey.participants].reverse().find((item) => item.capacity - result.effectiveVolume > 1e-9);
  assert.equal(lastSpare.id, 'hockey-ice-hire');
  assert.ok(remaining[1] > 0);
  const firstSpare = hockey.participants.find((item) => item.capacity - result.effectiveVolume > 1e-9);
  assert.equal(firstSpare.id, 'hockey-committee');
  assert.notEqual(lastSpare.id, lastWithin.id);
  const rugby = clonePreset('rugbyCarnivalSplit');
  const volleyball = clonePreset('volleyballCarnivalSplit');
  const basketball = clonePreset('basketballCarnivalSplit');
  const rugbyRemaining = rugby.participants.map((item) => item.capacity - calculatePartnership(rugby).effectiveVolume);
  const volleyballRemaining = volleyball.participants.map((item) => item.capacity - calculatePartnership(volleyball).effectiveVolume);
  const basketballRemaining = basketball.participants.map((item) => item.capacity - calculatePartnership(basketball).effectiveVolume);
  assert.notEqual(JSON.stringify(remaining), JSON.stringify(rugbyRemaining));
  assert.notEqual(JSON.stringify(remaining), JSON.stringify(volleyballRemaining));
  assert.notEqual(JSON.stringify(remaining), JSON.stringify(basketballRemaining));
  assert.notEqual(result.effectiveVolume, calculatePartnership(rugby).effectiveVolume);
  assert.notEqual(result.effectiveVolume, calculatePartnership(volleyball).effectiveVolume);
  assert.notEqual(result.effectiveVolume, calculatePartnership(basketball).effectiveVolume);
});

test('baseball carnival split preset is a distinct committee diamond-hire first-aid starting point', () => {
  const baseball = clonePreset('baseballCarnivalSplit');
  assert.equal(PRESETS.baseballCarnivalSplit.name, 'Baseball carnival split');
  assert.equal(baseball.participants.length, 3);
  assert.deepEqual(baseball.participants.map((item) => item.id), ['baseball-committee', 'baseball-diamond-hire', 'baseball-first-aid']);
  assert.deepEqual(baseball.participants.map((item) => item.name), ['Carnival committee', 'Diamond hire', 'First-aid']);
  assert.deepEqual(baseball.participants.map((item) => item.revenueShare), [0.37, 0.38, 0.25]);
  assert.equal(baseball.deal.monthlyVolume, 3900);
  assert.equal(baseball.deal.feePerTransaction, 8);
  assert.equal(baseball.deal.addressableVolume, 5100);
  assert.notEqual(baseball.participants[0].variableCostPerTransaction, baseball.participants[1].variableCostPerTransaction);
  assert.notEqual(baseball.participants[1].variableCostPerTransaction, baseball.participants[2].variableCostPerTransaction);
  assert.notEqual(baseball.participants[0].fixedMonthlyCost, baseball.participants[1].fixedMonthlyCost);
  assert.notEqual(baseball.participants[1].fixedMonthlyCost, baseball.participants[2].fixedMonthlyCost);
  const others = ['balanced', 'thinMargin', 'growthAtCost', 'creatorTakeRate', 'threePartyJv', 'twoPartyStudio', 'fourPartyMarketplace', 'licensorDistributor', 'talentAgentPlatform', 'threePartyJointVenture', 'podcastHostNetwork', 'communityHallSplit', 'festivalStallSplit', 'popupCinemaSplit', 'communityRadioSplit', 'schoolConcertSplit', 'sportsCarnivalSplit', 'netballCarnivalSplit', 'swimmingCarnivalSplit', 'athleticsCarnivalSplit', 'cricketCarnivalSplit', 'tennisCarnivalSplit', 'basketballCarnivalSplit', 'volleyballCarnivalSplit', 'rugbyCarnivalSplit', 'hockeyCarnivalSplit', 'softballCarnivalSplit', 'lacrosseCarnivalSplit', 'waterPoloCarnivalSplit', 'rowingCarnivalSplit'];
  for (const key of others) {
    const other = clonePreset(key);
    assert.notEqual(baseball.participants.map((item) => item.id).join(','), other.participants.map((item) => item.id).join(','), key);
    assert.notEqual(JSON.stringify(baseball.deal), JSON.stringify(other.deal), key);
    assert.notEqual(JSON.stringify(baseball.participants.map((item) => item.variableCostPerTransaction)), JSON.stringify(other.participants.map((item) => item.variableCostPerTransaction)), key);
    assert.notEqual(JSON.stringify(baseball.participants.map((item) => item.fixedMonthlyCost)), JSON.stringify(other.participants.map((item) => item.fixedMonthlyCost)), key);
  }
  const hockey = clonePreset('hockeyCarnivalSplit');
  const rugby = clonePreset('rugbyCarnivalSplit');
  const volleyball = clonePreset('volleyballCarnivalSplit');
  assert.notEqual(JSON.stringify(baseball.deal), JSON.stringify(hockey.deal));
  assert.notEqual(JSON.stringify(baseball.deal), JSON.stringify(rugby.deal));
  assert.notEqual(JSON.stringify(baseball.deal), JSON.stringify(volleyball.deal));
  assert.notEqual(baseball.participants.map((item) => item.id).join(','), hockey.participants.map((item) => item.id).join(','));
  assert.notEqual(baseball.participants.map((item) => item.id).join(','), rugby.participants.map((item) => item.id).join(','));
  assert.notEqual(baseball.participants.map((item) => item.id).join(','), volleyball.participants.map((item) => item.id).join(','));
  const result = calculatePartnership(baseball);
  assert.equal(result.viable, true);
  assert.ok(result.participants.every((item) => item.viable));
  assert.equal(new Set(result.participants.map((item) => item.id)).size, 3);
});

test('baseball carnival remaining listed capacity is distinct from hockey rugby and volleyball', () => {
  const baseball = clonePreset('baseballCarnivalSplit');
  const result = calculatePartnership(baseball);
  assert.equal(result.effectiveVolume, 3900);
  const remaining = baseball.participants.map((item) => item.capacity - result.effectiveVolume);
  assert.deepEqual(remaining, [900, 2000, 0]);
  const lastWithin = [...baseball.participants].reverse().find((item) => item.capacity - result.effectiveVolume >= -1e-9);
  assert.equal(lastWithin.id, 'baseball-first-aid');
  assert.equal(remaining[2], 0);
  const lastSpare = [...baseball.participants].reverse().find((item) => item.capacity - result.effectiveVolume > 1e-9);
  assert.equal(lastSpare.id, 'baseball-diamond-hire');
  assert.ok(remaining[1] > 0);
  const firstSpare = baseball.participants.find((item) => item.capacity - result.effectiveVolume > 1e-9);
  assert.equal(firstSpare.id, 'baseball-committee');
  assert.notEqual(lastSpare.id, lastWithin.id);
  const hockey = clonePreset('hockeyCarnivalSplit');
  const rugby = clonePreset('rugbyCarnivalSplit');
  const volleyball = clonePreset('volleyballCarnivalSplit');
  const hockeyRemaining = hockey.participants.map((item) => item.capacity - calculatePartnership(hockey).effectiveVolume);
  const rugbyRemaining = rugby.participants.map((item) => item.capacity - calculatePartnership(rugby).effectiveVolume);
  const volleyballRemaining = volleyball.participants.map((item) => item.capacity - calculatePartnership(volleyball).effectiveVolume);
  assert.notEqual(JSON.stringify(remaining), JSON.stringify(hockeyRemaining));
  assert.notEqual(JSON.stringify(remaining), JSON.stringify(rugbyRemaining));
  assert.notEqual(JSON.stringify(remaining), JSON.stringify(volleyballRemaining));
  assert.notEqual(result.effectiveVolume, calculatePartnership(hockey).effectiveVolume);
  assert.notEqual(result.effectiveVolume, calculatePartnership(rugby).effectiveVolume);
  assert.notEqual(result.effectiveVolume, calculatePartnership(volleyball).effectiveVolume);
});

test('softball carnival split preset is a distinct committee diamond-hire first-aid starting point', () => {
  const softball = clonePreset('softballCarnivalSplit');
  assert.equal(PRESETS.softballCarnivalSplit.name, 'Softball carnival split');
  assert.equal(softball.participants.length, 3);
  assert.deepEqual(softball.participants.map((item) => item.id), ['softball-committee', 'softball-diamond-hire', 'softball-first-aid']);
  assert.deepEqual(softball.participants.map((item) => item.name), ['Carnival committee', 'Diamond hire', 'First-aid']);
  assert.deepEqual(softball.participants.map((item) => item.revenueShare), [0.37, 0.38, 0.25]);
  assert.equal(softball.deal.monthlyVolume, 4000);
  assert.equal(softball.deal.feePerTransaction, 8);
  assert.equal(softball.deal.addressableVolume, 5200);
  assert.deepEqual(softball.participants.map((item) => item.capacity), [4900, 6000, 4000]);
  assert.ok(softball.participants.every((item) => item.capacity != null && Number.isFinite(item.capacity)));
  assert.notEqual(softball.participants[0].variableCostPerTransaction, softball.participants[1].variableCostPerTransaction);
  assert.notEqual(softball.participants[1].variableCostPerTransaction, softball.participants[2].variableCostPerTransaction);
  assert.notEqual(softball.participants[0].fixedMonthlyCost, softball.participants[1].fixedMonthlyCost);
  assert.notEqual(softball.participants[1].fixedMonthlyCost, softball.participants[2].fixedMonthlyCost);
  const others = ['balanced', 'thinMargin', 'growthAtCost', 'creatorTakeRate', 'threePartyJv', 'twoPartyStudio', 'fourPartyMarketplace', 'licensorDistributor', 'talentAgentPlatform', 'threePartyJointVenture', 'podcastHostNetwork', 'communityHallSplit', 'festivalStallSplit', 'popupCinemaSplit', 'communityRadioSplit', 'schoolConcertSplit', 'sportsCarnivalSplit', 'netballCarnivalSplit', 'swimmingCarnivalSplit', 'athleticsCarnivalSplit', 'cricketCarnivalSplit', 'tennisCarnivalSplit', 'basketballCarnivalSplit', 'volleyballCarnivalSplit', 'rugbyCarnivalSplit', 'hockeyCarnivalSplit', 'baseballCarnivalSplit', 'lacrosseCarnivalSplit', 'waterPoloCarnivalSplit', 'rowingCarnivalSplit'];
  for (const key of others) {
    const other = clonePreset(key);
    assert.notEqual(softball.participants.map((item) => item.id).join(','), other.participants.map((item) => item.id).join(','), key);
    assert.notEqual(JSON.stringify(softball.deal), JSON.stringify(other.deal), key);
    assert.notEqual(JSON.stringify(softball.participants.map((item) => item.variableCostPerTransaction)), JSON.stringify(other.participants.map((item) => item.variableCostPerTransaction)), key);
    assert.notEqual(JSON.stringify(softball.participants.map((item) => item.fixedMonthlyCost)), JSON.stringify(other.participants.map((item) => item.fixedMonthlyCost)), key);
  }
  const baseball = clonePreset('baseballCarnivalSplit');
  const hockey = clonePreset('hockeyCarnivalSplit');
  const rugby = clonePreset('rugbyCarnivalSplit');
  assert.notEqual(JSON.stringify(softball.deal), JSON.stringify(baseball.deal));
  assert.notEqual(JSON.stringify(softball.deal), JSON.stringify(hockey.deal));
  assert.notEqual(JSON.stringify(softball.deal), JSON.stringify(rugby.deal));
  assert.notEqual(softball.participants.map((item) => item.id).join(','), baseball.participants.map((item) => item.id).join(','));
  assert.notEqual(softball.participants.map((item) => item.id).join(','), hockey.participants.map((item) => item.id).join(','));
  assert.notEqual(softball.participants.map((item) => item.capacity).join(','), baseball.participants.map((item) => item.capacity).join(','));
  assert.notEqual(softball.participants[1].id, 'baseball-diamond-hire');
  const result = calculatePartnership(softball);
  assert.equal(result.viable, true);
  assert.ok(result.participants.every((item) => item.viable));
  assert.equal(new Set(result.participants.map((item) => item.id)).size, 3);
});

test('softball carnival remaining listed capacity is distinct from baseball hockey and rugby', () => {
  const softball = clonePreset('softballCarnivalSplit');
  const result = calculatePartnership(softball);
  assert.equal(result.effectiveVolume, 4000);
  const remaining = softball.participants.map((item) => item.capacity - result.effectiveVolume);
  assert.deepEqual(remaining, [900, 2000, 0]);
  const lastWithin = [...softball.participants].reverse().find((item) => item.capacity - result.effectiveVolume >= -1e-9);
  assert.equal(lastWithin.id, 'softball-first-aid');
  assert.equal(remaining[2], 0);
  const lastSpare = [...softball.participants].reverse().find((item) => item.capacity - result.effectiveVolume > 1e-9);
  assert.equal(lastSpare.id, 'softball-diamond-hire');
  assert.ok(remaining[1] > 0);
  const firstSpare = softball.participants.find((item) => item.capacity - result.effectiveVolume > 1e-9);
  assert.equal(firstSpare.id, 'softball-committee');
  assert.notEqual(lastSpare.id, lastWithin.id);
  assert.equal(softball.participants.find((item) => item.capacity == null), undefined);
  const baseball = clonePreset('baseballCarnivalSplit');
  const hockey = clonePreset('hockeyCarnivalSplit');
  const rugby = clonePreset('rugbyCarnivalSplit');
  const baseballResult = calculatePartnership(baseball);
  const hockeyRemaining = hockey.participants.map((item) => item.capacity - calculatePartnership(hockey).effectiveVolume);
  const rugbyRemaining = rugby.participants.map((item) => item.capacity - calculatePartnership(rugby).effectiveVolume);
  assert.notEqual(JSON.stringify(softball.participants.map((item) => item.capacity)), JSON.stringify(baseball.participants.map((item) => item.capacity)));
  assert.notEqual(JSON.stringify(remaining), JSON.stringify(hockeyRemaining));
  assert.notEqual(JSON.stringify(remaining), JSON.stringify(rugbyRemaining));
  assert.notEqual(result.effectiveVolume, baseballResult.effectiveVolume);
  assert.notEqual(result.effectiveVolume, calculatePartnership(hockey).effectiveVolume);
  assert.notEqual(result.effectiveVolume, calculatePartnership(rugby).effectiveVolume);
  const lastAtHold = [...softball.participants].reverse().find((item) => {
    const named = result.participants.find((row) => item.id === row.id);
    const remainingToHold = named?.headroomToExit == null ? null : Math.max(0, -named.headroomToExit);
    return remainingToHold != null && remainingToHold <= 1e-9;
  });
  assert.equal(lastAtHold.id, 'softball-first-aid');
  assert.ok(result.participants.every((item) => Math.max(0, -item.headroomToExit) <= 1e-9));
});

test('lacrosse carnival split preset is a distinct committee ground-hire first-aid starting point', () => {
  const lacrosse = clonePreset('lacrosseCarnivalSplit');
  assert.equal(PRESETS.lacrosseCarnivalSplit.name, 'Lacrosse carnival split');
  assert.equal(lacrosse.participants.length, 3);
  assert.deepEqual(lacrosse.participants.map((item) => item.id), ['lacrosse-committee', 'lacrosse-ground-hire', 'lacrosse-first-aid']);
  assert.deepEqual(lacrosse.participants.map((item) => item.name), ['Carnival committee', 'Ground hire', 'First-aid']);
  assert.deepEqual(lacrosse.participants.map((item) => item.revenueShare), [0.37, 0.38, 0.25]);
  assert.equal(lacrosse.deal.monthlyVolume, 4100);
  assert.equal(lacrosse.deal.feePerTransaction, 8);
  assert.equal(lacrosse.deal.addressableVolume, 5300);
  assert.deepEqual(lacrosse.participants.map((item) => item.capacity), [5000, 6100, 4100]);
  assert.ok(lacrosse.participants.every((item) => item.capacity != null && Number.isFinite(item.capacity)));
  assert.notEqual(lacrosse.participants[0].variableCostPerTransaction, lacrosse.participants[1].variableCostPerTransaction);
  assert.notEqual(lacrosse.participants[1].variableCostPerTransaction, lacrosse.participants[2].variableCostPerTransaction);
  assert.notEqual(lacrosse.participants[0].fixedMonthlyCost, lacrosse.participants[1].fixedMonthlyCost);
  assert.notEqual(lacrosse.participants[1].fixedMonthlyCost, lacrosse.participants[2].fixedMonthlyCost);
  const others = ['balanced', 'thinMargin', 'growthAtCost', 'creatorTakeRate', 'threePartyJv', 'twoPartyStudio', 'fourPartyMarketplace', 'licensorDistributor', 'talentAgentPlatform', 'threePartyJointVenture', 'podcastHostNetwork', 'communityHallSplit', 'festivalStallSplit', 'popupCinemaSplit', 'communityRadioSplit', 'schoolConcertSplit', 'sportsCarnivalSplit', 'netballCarnivalSplit', 'swimmingCarnivalSplit', 'athleticsCarnivalSplit', 'cricketCarnivalSplit', 'tennisCarnivalSplit', 'basketballCarnivalSplit', 'volleyballCarnivalSplit', 'rugbyCarnivalSplit', 'hockeyCarnivalSplit', 'baseballCarnivalSplit', 'softballCarnivalSplit', 'waterPoloCarnivalSplit', 'rowingCarnivalSplit'];
  for (const key of others) {
    const other = clonePreset(key);
    assert.notEqual(lacrosse.participants.map((item) => item.id).join(','), other.participants.map((item) => item.id).join(','), key);
    assert.notEqual(JSON.stringify(lacrosse.deal), JSON.stringify(other.deal), key);
    assert.notEqual(JSON.stringify(lacrosse.participants.map((item) => item.variableCostPerTransaction)), JSON.stringify(other.participants.map((item) => item.variableCostPerTransaction)), key);
    assert.notEqual(JSON.stringify(lacrosse.participants.map((item) => item.fixedMonthlyCost)), JSON.stringify(other.participants.map((item) => item.fixedMonthlyCost)), key);
  }
  const softball = clonePreset('softballCarnivalSplit');
  const baseball = clonePreset('baseballCarnivalSplit');
  const rugby = clonePreset('rugbyCarnivalSplit');
  assert.notEqual(JSON.stringify(lacrosse.deal), JSON.stringify(softball.deal));
  assert.notEqual(JSON.stringify(lacrosse.deal), JSON.stringify(baseball.deal));
  assert.notEqual(JSON.stringify(lacrosse.deal), JSON.stringify(rugby.deal));
  assert.notEqual(lacrosse.participants.map((item) => item.id).join(','), softball.participants.map((item) => item.id).join(','));
  assert.notEqual(lacrosse.participants.map((item) => item.id).join(','), baseball.participants.map((item) => item.id).join(','));
  assert.notEqual(lacrosse.participants.map((item) => item.capacity).join(','), softball.participants.map((item) => item.capacity).join(','));
  assert.notEqual(lacrosse.participants[1].id, 'softball-diamond-hire');
  assert.notEqual(lacrosse.participants[1].id, 'rugby-ground-hire');
  const result = calculatePartnership(lacrosse);
  assert.equal(result.viable, true);
  assert.ok(result.participants.every((item) => item.viable));
  assert.equal(new Set(result.participants.map((item) => item.id)).size, 3);
});

test('lacrosse carnival remaining listed capacity is distinct from softball baseball and rugby', () => {
  const lacrosse = clonePreset('lacrosseCarnivalSplit');
  const result = calculatePartnership(lacrosse);
  assert.equal(result.effectiveVolume, 4100);
  const remaining = lacrosse.participants.map((item) => item.capacity - result.effectiveVolume);
  assert.deepEqual(remaining, [900, 2000, 0]);
  const lastWithin = [...lacrosse.participants].reverse().find((item) => item.capacity - result.effectiveVolume >= -1e-9);
  assert.equal(lastWithin.id, 'lacrosse-first-aid');
  assert.equal(remaining[2], 0);
  const lastSpare = [...lacrosse.participants].reverse().find((item) => item.capacity - result.effectiveVolume > 1e-9);
  assert.equal(lastSpare.id, 'lacrosse-ground-hire');
  assert.ok(remaining[1] > 0);
  const firstSpare = lacrosse.participants.find((item) => item.capacity - result.effectiveVolume > 1e-9);
  assert.equal(firstSpare.id, 'lacrosse-committee');
  assert.notEqual(lastSpare.id, lastWithin.id);
  assert.equal(lacrosse.participants.find((item) => item.capacity == null), undefined);
  const softball = clonePreset('softballCarnivalSplit');
  const baseball = clonePreset('baseballCarnivalSplit');
  const rugby = clonePreset('rugbyCarnivalSplit');
  const softballResult = calculatePartnership(softball);
  const baseballResult = calculatePartnership(baseball);
  const rugbyRemaining = rugby.participants.map((item) => item.capacity - calculatePartnership(rugby).effectiveVolume);
  assert.notEqual(JSON.stringify(lacrosse.participants.map((item) => item.capacity)), JSON.stringify(softball.participants.map((item) => item.capacity)));
  assert.notEqual(JSON.stringify(lacrosse.participants.map((item) => item.capacity)), JSON.stringify(baseball.participants.map((item) => item.capacity)));
  assert.notEqual(JSON.stringify(remaining), JSON.stringify(rugbyRemaining));
  assert.notEqual(result.effectiveVolume, softballResult.effectiveVolume);
  assert.notEqual(result.effectiveVolume, baseballResult.effectiveVolume);
  assert.notEqual(result.effectiveVolume, calculatePartnership(rugby).effectiveVolume);
  const lastAtHold = [...lacrosse.participants].reverse().find((item) => {
    const named = result.participants.find((row) => item.id === row.id);
    const remainingToHold = named?.headroomToExit == null ? null : Math.max(0, -named.headroomToExit);
    return remainingToHold != null && remainingToHold <= 1e-9;
  });
  assert.equal(lastAtHold.id, 'lacrosse-first-aid');
  const firstAtHold = lacrosse.participants.find((item) => {
    const named = result.participants.find((row) => item.id === row.id);
    const remainingToHold = named?.headroomToExit == null ? null : Math.max(0, -named.headroomToExit);
    return remainingToHold != null && remainingToHold <= 1e-9;
  });
  assert.equal(firstAtHold.id, 'lacrosse-committee');
  assert.notEqual(firstAtHold.id, lastAtHold.id);
  assert.ok(result.participants.every((item) => Math.max(0, -item.headroomToExit) <= 1e-9));
});

test('water polo carnival split preset is a distinct committee pool-hire first-aid starting point', () => {
  const waterPolo = clonePreset('waterPoloCarnivalSplit');
  assert.equal(PRESETS.waterPoloCarnivalSplit.name, 'Water polo carnival split');
  assert.equal(waterPolo.participants.length, 3);
  assert.deepEqual(waterPolo.participants.map((item) => item.id), ['waterpolo-committee', 'waterpolo-pool-hire', 'waterpolo-first-aid']);
  assert.deepEqual(waterPolo.participants.map((item) => item.name), ['Carnival committee', 'Pool hire', 'First-aid']);
  assert.deepEqual(waterPolo.participants.map((item) => item.revenueShare), [0.37, 0.38, 0.25]);
  assert.equal(waterPolo.deal.monthlyVolume, 4200);
  assert.equal(waterPolo.deal.feePerTransaction, 8);
  assert.equal(waterPolo.deal.addressableVolume, 5400);
  assert.deepEqual(waterPolo.participants.map((item) => item.capacity), [5100, 6200, 4200]);
  assert.ok(waterPolo.participants.every((item) => item.capacity != null && Number.isFinite(item.capacity)));
  assert.notEqual(waterPolo.participants[0].variableCostPerTransaction, waterPolo.participants[1].variableCostPerTransaction);
  assert.notEqual(waterPolo.participants[1].variableCostPerTransaction, waterPolo.participants[2].variableCostPerTransaction);
  assert.notEqual(waterPolo.participants[0].fixedMonthlyCost, waterPolo.participants[1].fixedMonthlyCost);
  assert.notEqual(waterPolo.participants[1].fixedMonthlyCost, waterPolo.participants[2].fixedMonthlyCost);
  const others = ['balanced', 'thinMargin', 'growthAtCost', 'creatorTakeRate', 'threePartyJv', 'twoPartyStudio', 'fourPartyMarketplace', 'licensorDistributor', 'talentAgentPlatform', 'threePartyJointVenture', 'podcastHostNetwork', 'communityHallSplit', 'festivalStallSplit', 'popupCinemaSplit', 'communityRadioSplit', 'schoolConcertSplit', 'sportsCarnivalSplit', 'netballCarnivalSplit', 'swimmingCarnivalSplit', 'athleticsCarnivalSplit', 'cricketCarnivalSplit', 'tennisCarnivalSplit', 'basketballCarnivalSplit', 'volleyballCarnivalSplit', 'rugbyCarnivalSplit', 'hockeyCarnivalSplit', 'baseballCarnivalSplit', 'softballCarnivalSplit', 'lacrosseCarnivalSplit', 'rowingCarnivalSplit'];
  for (const key of others) {
    const other = clonePreset(key);
    assert.notEqual(waterPolo.participants.map((item) => item.id).join(','), other.participants.map((item) => item.id).join(','), key);
    assert.notEqual(JSON.stringify(waterPolo.deal), JSON.stringify(other.deal), key);
    assert.notEqual(JSON.stringify(waterPolo.participants.map((item) => item.variableCostPerTransaction)), JSON.stringify(other.participants.map((item) => item.variableCostPerTransaction)), key);
    assert.notEqual(JSON.stringify(waterPolo.participants.map((item) => item.fixedMonthlyCost)), JSON.stringify(other.participants.map((item) => item.fixedMonthlyCost)), key);
  }
  const lacrosse = clonePreset('lacrosseCarnivalSplit');
  const softball = clonePreset('softballCarnivalSplit');
  const rugby = clonePreset('rugbyCarnivalSplit');
  assert.notEqual(JSON.stringify(waterPolo.deal), JSON.stringify(lacrosse.deal));
  assert.notEqual(JSON.stringify(waterPolo.deal), JSON.stringify(softball.deal));
  assert.notEqual(JSON.stringify(waterPolo.deal), JSON.stringify(rugby.deal));
  assert.notEqual(waterPolo.participants.map((item) => item.id).join(','), lacrosse.participants.map((item) => item.id).join(','));
  assert.notEqual(waterPolo.participants.map((item) => item.id).join(','), softball.participants.map((item) => item.id).join(','));
  assert.notEqual(waterPolo.participants.map((item) => item.capacity).join(','), lacrosse.participants.map((item) => item.capacity).join(','));
  assert.notEqual(waterPolo.participants[1].id, 'lacrosse-ground-hire');
  assert.notEqual(waterPolo.participants[1].id, 'rugby-ground-hire');
  const result = calculatePartnership(waterPolo);
  assert.equal(result.viable, true);
  assert.ok(result.participants.every((item) => item.viable));
  assert.equal(new Set(result.participants.map((item) => item.id)).size, 3);
});

test('water polo carnival remaining listed capacity is distinct from lacrosse softball and rugby', () => {
  const waterPolo = clonePreset('waterPoloCarnivalSplit');
  const result = calculatePartnership(waterPolo);
  assert.equal(result.effectiveVolume, 4200);
  const remaining = waterPolo.participants.map((item) => item.capacity - result.effectiveVolume);
  assert.deepEqual(remaining, [900, 2000, 0]);
  const lastWithin = [...waterPolo.participants].reverse().find((item) => item.capacity - result.effectiveVolume >= -1e-9);
  assert.equal(lastWithin.id, 'waterpolo-first-aid');
  assert.equal(remaining[2], 0);
  const lastSpare = [...waterPolo.participants].reverse().find((item) => item.capacity - result.effectiveVolume > 1e-9);
  assert.equal(lastSpare.id, 'waterpolo-pool-hire');
  assert.ok(remaining[1] > 0);
  const firstSpare = waterPolo.participants.find((item) => item.capacity - result.effectiveVolume > 1e-9);
  assert.equal(firstSpare.id, 'waterpolo-committee');
  assert.notEqual(lastSpare.id, lastWithin.id);
  assert.equal(waterPolo.participants.find((item) => item.capacity == null), undefined);
  const lacrosse = clonePreset('lacrosseCarnivalSplit');
  const softball = clonePreset('softballCarnivalSplit');
  const rugby = clonePreset('rugbyCarnivalSplit');
  const lacrosseResult = calculatePartnership(lacrosse);
  const softballResult = calculatePartnership(softball);
  const rugbyRemaining = rugby.participants.map((item) => item.capacity - calculatePartnership(rugby).effectiveVolume);
  assert.notEqual(JSON.stringify(waterPolo.participants.map((item) => item.capacity)), JSON.stringify(lacrosse.participants.map((item) => item.capacity)));
  assert.notEqual(JSON.stringify(waterPolo.participants.map((item) => item.capacity)), JSON.stringify(softball.participants.map((item) => item.capacity)));
  assert.notEqual(JSON.stringify(remaining), JSON.stringify(rugbyRemaining));
  assert.notEqual(result.effectiveVolume, lacrosseResult.effectiveVolume);
  assert.notEqual(result.effectiveVolume, softballResult.effectiveVolume);
  assert.notEqual(result.effectiveVolume, calculatePartnership(rugby).effectiveVolume);
  const lastAtHold = [...waterPolo.participants].reverse().find((item) => {
    const named = result.participants.find((row) => item.id === row.id);
    const remainingToHold = named?.headroomToExit == null ? null : Math.max(0, -named.headroomToExit);
    return remainingToHold != null && remainingToHold <= 1e-9;
  });
  assert.equal(lastAtHold.id, 'waterpolo-first-aid');
  const firstAtHold = waterPolo.participants.find((item) => {
    const named = result.participants.find((row) => item.id === row.id);
    const remainingToHold = named?.headroomToExit == null ? null : Math.max(0, -named.headroomToExit);
    return remainingToHold != null && remainingToHold <= 1e-9;
  });
  assert.equal(firstAtHold.id, 'waterpolo-committee');
  assert.notEqual(firstAtHold.id, lastAtHold.id);
  assert.ok(result.participants.every((item) => Math.max(0, -item.headroomToExit) <= 1e-9));
});

test('rowing carnival split preset is a distinct committee boat-hire first-aid starting point', () => {
  const rowing = clonePreset('rowingCarnivalSplit');
  assert.equal(PRESETS.rowingCarnivalSplit.name, 'Rowing carnival split');
  assert.equal(rowing.participants.length, 3);
  assert.deepEqual(rowing.participants.map((item) => item.id), ['rowing-committee', 'rowing-boat-hire', 'rowing-first-aid']);
  assert.deepEqual(rowing.participants.map((item) => item.name), ['Carnival committee', 'Boat hire', 'First-aid']);
  assert.deepEqual(rowing.participants.map((item) => item.revenueShare), [0.37, 0.38, 0.25]);
  assert.equal(rowing.deal.monthlyVolume, 4300);
  assert.equal(rowing.deal.feePerTransaction, 8);
  assert.equal(rowing.deal.addressableVolume, 5500);
  assert.deepEqual(rowing.participants.map((item) => item.capacity), [5200, 6300, 4300]);
  assert.ok(rowing.participants.every((item) => item.capacity != null && Number.isFinite(item.capacity)));
  assert.notEqual(rowing.participants[0].variableCostPerTransaction, rowing.participants[1].variableCostPerTransaction);
  assert.notEqual(rowing.participants[1].variableCostPerTransaction, rowing.participants[2].variableCostPerTransaction);
  assert.notEqual(rowing.participants[0].fixedMonthlyCost, rowing.participants[1].fixedMonthlyCost);
  assert.notEqual(rowing.participants[1].fixedMonthlyCost, rowing.participants[2].fixedMonthlyCost);
  const others = ['balanced', 'thinMargin', 'growthAtCost', 'creatorTakeRate', 'threePartyJv', 'twoPartyStudio', 'fourPartyMarketplace', 'licensorDistributor', 'talentAgentPlatform', 'threePartyJointVenture', 'podcastHostNetwork', 'communityHallSplit', 'festivalStallSplit', 'popupCinemaSplit', 'communityRadioSplit', 'schoolConcertSplit', 'sportsCarnivalSplit', 'netballCarnivalSplit', 'swimmingCarnivalSplit', 'athleticsCarnivalSplit', 'cricketCarnivalSplit', 'tennisCarnivalSplit', 'basketballCarnivalSplit', 'volleyballCarnivalSplit', 'rugbyCarnivalSplit', 'hockeyCarnivalSplit', 'baseballCarnivalSplit', 'softballCarnivalSplit', 'lacrosseCarnivalSplit', 'waterPoloCarnivalSplit'];
  for (const key of others) {
    const other = clonePreset(key);
    assert.notEqual(rowing.participants.map((item) => item.id).join(','), other.participants.map((item) => item.id).join(','), key);
    assert.notEqual(JSON.stringify(rowing.deal), JSON.stringify(other.deal), key);
    assert.notEqual(JSON.stringify(rowing.participants.map((item) => item.variableCostPerTransaction)), JSON.stringify(other.participants.map((item) => item.variableCostPerTransaction)), key);
    assert.notEqual(JSON.stringify(rowing.participants.map((item) => item.fixedMonthlyCost)), JSON.stringify(other.participants.map((item) => item.fixedMonthlyCost)), key);
  }
  const waterPolo = clonePreset('waterPoloCarnivalSplit');
  const lacrosse = clonePreset('lacrosseCarnivalSplit');
  const softball = clonePreset('softballCarnivalSplit');
  assert.notEqual(JSON.stringify(rowing.deal), JSON.stringify(waterPolo.deal));
  assert.notEqual(JSON.stringify(rowing.deal), JSON.stringify(lacrosse.deal));
  assert.notEqual(JSON.stringify(rowing.deal), JSON.stringify(softball.deal));
  assert.notEqual(rowing.participants.map((item) => item.id).join(','), waterPolo.participants.map((item) => item.id).join(','));
  assert.notEqual(rowing.participants.map((item) => item.id).join(','), lacrosse.participants.map((item) => item.id).join(','));
  assert.notEqual(rowing.participants.map((item) => item.capacity).join(','), waterPolo.participants.map((item) => item.capacity).join(','));
  assert.notEqual(rowing.participants[1].id, 'waterpolo-pool-hire');
  assert.notEqual(rowing.participants[1].id, 'lacrosse-ground-hire');
  assert.notEqual(rowing.participants[1].name, 'Pool hire');
  assert.notEqual(rowing.participants[1].name, 'Ground hire');
  assert.notEqual(rowing.participants[1].name, 'Diamond hire');
  const result = calculatePartnership(rowing);
  assert.equal(result.viable, true);
  assert.ok(result.participants.every((item) => item.viable));
  assert.equal(new Set(result.participants.map((item) => item.id)).size, 3);
});

test('rowing carnival remaining listed capacity is distinct from water polo lacrosse and softball', () => {
  const rowing = clonePreset('rowingCarnivalSplit');
  const result = calculatePartnership(rowing);
  assert.equal(result.effectiveVolume, 4300);
  const remaining = rowing.participants.map((item) => item.capacity - result.effectiveVolume);
  assert.deepEqual(remaining, [900, 2000, 0]);
  const lastWithin = [...rowing.participants].reverse().find((item) => item.capacity - result.effectiveVolume >= -1e-9);
  assert.equal(lastWithin.id, 'rowing-first-aid');
  assert.equal(remaining[2], 0);
  const lastSpare = [...rowing.participants].reverse().find((item) => item.capacity - result.effectiveVolume > 1e-9);
  assert.equal(lastSpare.id, 'rowing-boat-hire');
  assert.ok(remaining[1] > 0);
  const firstSpare = rowing.participants.find((item) => item.capacity - result.effectiveVolume > 1e-9);
  assert.equal(firstSpare.id, 'rowing-committee');
  assert.notEqual(lastSpare.id, lastWithin.id);
  assert.equal(rowing.participants.find((item) => item.capacity == null), undefined);
  const waterPolo = clonePreset('waterPoloCarnivalSplit');
  const lacrosse = clonePreset('lacrosseCarnivalSplit');
  const softball = clonePreset('softballCarnivalSplit');
  const waterPoloResult = calculatePartnership(waterPolo);
  const lacrosseResult = calculatePartnership(lacrosse);
  const softballRemaining = softball.participants.map((item) => item.capacity - calculatePartnership(softball).effectiveVolume);
  assert.notEqual(JSON.stringify(rowing.participants.map((item) => item.capacity)), JSON.stringify(waterPolo.participants.map((item) => item.capacity)));
  assert.notEqual(JSON.stringify(rowing.participants.map((item) => item.capacity)), JSON.stringify(lacrosse.participants.map((item) => item.capacity)));
  assert.notEqual(JSON.stringify(remaining), JSON.stringify(softballRemaining));
  assert.notEqual(result.effectiveVolume, waterPoloResult.effectiveVolume);
  assert.notEqual(result.effectiveVolume, lacrosseResult.effectiveVolume);
  assert.notEqual(result.effectiveVolume, calculatePartnership(softball).effectiveVolume);
  const lastAtHold = [...rowing.participants].reverse().find((item) => {
    const named = result.participants.find((row) => item.id === row.id);
    const remainingToHold = named?.headroomToExit == null ? null : Math.max(0, -named.headroomToExit);
    return remainingToHold != null && remainingToHold <= 1e-9;
  });
  assert.equal(lastAtHold.id, 'rowing-first-aid');
  const firstAtHold = rowing.participants.find((item) => {
    const named = result.participants.find((row) => item.id === row.id);
    const remainingToHold = named?.headroomToExit == null ? null : Math.max(0, -named.headroomToExit);
    return remainingToHold != null && remainingToHold <= 1e-9;
  });
  assert.equal(firstAtHold.id, 'rowing-committee');
  assert.notEqual(firstAtHold.id, lastAtHold.id);
  assert.ok(result.participants.every((item) => Math.max(0, -item.headroomToExit) <= 1e-9));
});

test('creator take-rate and three-party JV presets calculate interesting first breakpoints', () => {
  const creator = calculatePartnership(clonePreset('creatorTakeRate'));
  assert.equal(creator.participants.length, 2);
  assert.equal(creator.firstBreakpoint.status, 'bounded');
  assert.equal(creator.firstBreakpoint.participant.id, 'creator');
  assert.equal(creator.firstBreakpoint.kind, 'fee');
  assert.ok(creator.firstBreakpoint.shock.changePct < 10);
  assert.ok(creator.participants.every((item) => item.shocks.volume.status === 'bounded'));

  const jv = calculatePartnership(clonePreset('threePartyJv'));
  assert.equal(jv.participants.length, 3);
  assert.equal(jv.firstBreakpoint.status, 'bounded');
  assert.equal(jv.firstBreakpoint.participant.id, 'operator');
  assert.equal(jv.firstBreakpoint.kind, 'volumeIncrease');
  assert.equal(jv.firstBreakpoint.shock.breakpoint, 14000);
  assert.equal(jv.weakestParticipant.id, 'operator');
});

test('optional deal title and currency persist when valid and are rejected when illegal', () => {
  const omitted = clonePreset('balanced');
  assert.equal(validateConfiguration(omitted).valid, true);
  assert.equal(omitted.deal.title, undefined);
  assert.equal(omitted.deal.currency, undefined);

  const labeled = clonePreset('balanced');
  labeled.deal.title = 'Northeast rail JV';
  labeled.deal.currency = 'USD';
  assert.equal(validateConfiguration(labeled).valid, true);
  assert.equal(calculatePartnership(labeled).deal.title, 'Northeast rail JV');
  assert.equal(calculatePartnership(labeled).deal.currency, 'USD');

  labeled.deal.title = 'x'.repeat(80);
  assert.equal(validateConfiguration(labeled).valid, true);

  const invalidTitles = ['', '   ', 'x'.repeat(81), 12, null, true];
  for (const title of invalidTitles) {
    const config = clonePreset('balanced');
    config.deal.title = title;
    const validation = validateConfiguration(config);
    assert.equal(validation.valid, false, String(title));
    assert.match(validation.errors.join(' '), /Deal title/);
  }

  const invalidCurrencies = ['', 'usd', 'US', 'USDT', 'US1', ' usd', 'USD ', null, 840];
  for (const currency of invalidCurrencies) {
    const config = clonePreset('balanced');
    config.deal.currency = currency;
    const validation = validateConfiguration(config);
    assert.equal(validation.valid, false, String(currency));
    assert.match(validation.errors.join(' '), /Deal currency/);
  }
});

test('optional deal notes persist when valid and reject unknown abuse', () => {
  const omitted = clonePreset('balanced');
  assert.equal(omitted.deal.notes, undefined);
  assert.equal(validateConfiguration(omitted).valid, true);

  const noted = clonePreset('balanced');
  noted.deal.notes = 'Harbor counterparty wants a 90-day review.';
  assert.equal(validateConfiguration(noted).valid, true);
  assert.equal(calculatePartnership(noted).deal.notes, 'Harbor counterparty wants a 90-day review.');

  noted.deal.notes = 'x'.repeat(500);
  assert.equal(validateConfiguration(noted).valid, true);

  const invalidNotes = ['', '   ', 'x'.repeat(501), 12, null, true, { text: 'no' }];
  for (const notes of invalidNotes) {
    const config = clonePreset('balanced');
    config.deal.notes = notes;
    const validation = validateConfiguration(config);
    assert.equal(validation.valid, false, String(notes));
    assert.match(validation.errors.join(' '), /Deal notes/);
  }

  const unknown = clonePreset('balanced');
  unknown.deal.memo = 'secret';
  assert.match(validateConfiguration(unknown).errors.join(' '), /unknown field: memo/);
});

test('optional hideAllHoldLedger is a boolean and older files omit it', () => {
  const omitted = clonePreset('balanced');
  assert.equal(Object.hasOwn(omitted, 'hideAllHoldLedger'), false);
  assert.equal(validateConfiguration(omitted).valid, true);

  const hidden = clonePreset('balanced');
  hidden.hideAllHoldLedger = true;
  assert.equal(validateConfiguration(hidden).valid, true);

  const shown = clonePreset('balanced');
  shown.hideAllHoldLedger = false;
  assert.equal(validateConfiguration(shown).valid, true);

  for (const value of ['true', 1, 0, null, 'yes', {}]) {
    const config = clonePreset('balanced');
    config.hideAllHoldLedger = value;
    const validation = validateConfiguration(config);
    assert.equal(validation.valid, false, String(value));
    assert.match(validation.errors.join(' '), /boolean/);
  }

  const extra = clonePreset('balanced');
  extra.hideAllHoldLedger = true;
  extra.unexpected = true;
  assert.match(validateConfiguration(extra).errors.join(' '), /unknown field: unexpected/);

  const both = clonePreset('balanced');
  both.collapseAllHoldCases = true;
  both.hideHoldingParticipants = true;
  both.hideAllHoldLedger = true;
  both.hideZeroShareParticipants = true;
  assert.equal(validateConfiguration(both).valid, true);
});

test('optional hideHoldingParticipants is a boolean and older files omit it', () => {
  const omitted = clonePreset('balanced');
  assert.equal(Object.hasOwn(omitted, 'hideHoldingParticipants'), false);
  assert.equal(validateConfiguration(omitted).valid, true);

  const hidden = clonePreset('balanced');
  hidden.hideHoldingParticipants = true;
  assert.equal(validateConfiguration(hidden).valid, true);

  const shown = clonePreset('balanced');
  shown.hideHoldingParticipants = false;
  assert.equal(validateConfiguration(shown).valid, true);

  for (const value of ['true', 1, 0, null, 'yes', {}]) {
    const config = clonePreset('balanced');
    config.hideHoldingParticipants = value;
    const validation = validateConfiguration(config);
    assert.equal(validation.valid, false, String(value));
    assert.match(validation.errors.join(' '), /boolean/);
  }

  const extra = clonePreset('balanced');
  extra.hideHoldingParticipants = true;
  extra.unexpected = true;
  assert.match(validateConfiguration(extra).errors.join(' '), /unknown field: unexpected/);

  const both = clonePreset('balanced');
  both.collapseAllHoldCases = true;
  both.hideHoldingParticipants = true;
  both.hideZeroShareParticipants = true;
  assert.equal(validateConfiguration(both).valid, true);
});

test('optional hideZeroShareParticipants is a boolean and older files omit it', () => {
  const omitted = clonePreset('balanced');
  assert.equal(Object.hasOwn(omitted, 'hideZeroShareParticipants'), false);
  assert.equal(validateConfiguration(omitted).valid, true);

  const hidden = clonePreset('balanced');
  hidden.hideZeroShareParticipants = true;
  assert.equal(validateConfiguration(hidden).valid, true);

  const shown = clonePreset('balanced');
  shown.hideZeroShareParticipants = false;
  assert.equal(validateConfiguration(shown).valid, true);

  for (const value of ['true', 1, 0, null, 'yes', {}]) {
    const config = clonePreset('balanced');
    config.hideZeroShareParticipants = value;
    const validation = validateConfiguration(config);
    assert.equal(validation.valid, false, String(value));
    assert.match(validation.errors.join(' '), /boolean/);
  }

  const extra = clonePreset('balanced');
  extra.hideZeroShareParticipants = true;
  extra.unexpected = true;
  assert.match(validateConfiguration(extra).errors.join(' '), /unknown field: unexpected/);

  const both = clonePreset('balanced');
  both.hideHoldingParticipants = true;
  both.hideAllHoldLedger = true;
  both.hideZeroShareParticipants = true;
  assert.equal(validateConfiguration(both).valid, true);
});

test('optional hideParticipantsOverCapacity is a boolean and older files omit it', () => {
  const omitted = clonePreset('balanced');
  assert.equal(Object.hasOwn(omitted, 'hideParticipantsOverCapacity'), false);
  assert.equal(validateConfiguration(omitted).valid, true);

  const hidden = clonePreset('balanced');
  hidden.hideParticipantsOverCapacity = true;
  assert.equal(validateConfiguration(hidden).valid, true);

  const shown = clonePreset('balanced');
  shown.hideParticipantsOverCapacity = false;
  assert.equal(validateConfiguration(shown).valid, true);

  for (const value of ['true', 1, 0, null, 'yes', {}]) {
    const config = clonePreset('balanced');
    config.hideParticipantsOverCapacity = value;
    const validation = validateConfiguration(config);
    assert.equal(validation.valid, false, String(value));
    assert.match(validation.errors.join(' '), /boolean/);
  }

  const extra = clonePreset('balanced');
  extra.hideParticipantsOverCapacity = true;
  extra.unexpected = true;
  assert.match(validateConfiguration(extra).errors.join(' '), /unknown field: unexpected/);

  const both = clonePreset('balanced');
  both.hideHoldingParticipants = true;
  both.hideAllHoldLedger = true;
  both.hideZeroShareParticipants = true;
  both.hideParticipantsOverCapacity = true;
  assert.equal(validateConfiguration(both).valid, true);
});

test('optional hideParticipantsAtHold is a boolean and older files omit it', () => {
  const omitted = clonePreset('balanced');
  assert.equal(Object.hasOwn(omitted, 'hideParticipantsAtHold'), false);
  assert.equal(validateConfiguration(omitted).valid, true);

  const hidden = clonePreset('balanced');
  hidden.hideParticipantsAtHold = true;
  assert.equal(validateConfiguration(hidden).valid, true);

  const shown = clonePreset('balanced');
  shown.hideParticipantsAtHold = false;
  assert.equal(validateConfiguration(shown).valid, true);

  for (const value of ['true', 1, 0, null, 'yes', {}]) {
    const config = clonePreset('balanced');
    config.hideParticipantsAtHold = value;
    const validation = validateConfiguration(config);
    assert.equal(validation.valid, false, String(value));
    assert.match(validation.errors.join(' '), /boolean/);
  }

  const extra = clonePreset('balanced');
  extra.hideParticipantsAtHold = true;
  extra.unexpected = true;
  assert.match(validateConfiguration(extra).errors.join(' '), /unknown field: unexpected/);

  const both = clonePreset('balanced');
  both.hideHoldingParticipants = true;
  both.hideAllHoldLedger = true;
  both.hideZeroShareParticipants = true;
  both.hideParticipantsOverCapacity = true;
  both.hideParticipantsAtHold = true;
  both.hideParticipantsWithoutCapacity = true;
  both.hideParticipantsWithSpareCapacity = true;
  both.hideParticipantsAtLeastHeadroom = true;
  both.hideParticipantsWithinCapacity = true;
  assert.equal(validateConfiguration(both).valid, true);
});

test('optional hideParticipantsWithoutCapacity is a boolean and older files omit it', () => {
  const omitted = clonePreset('balanced');
  assert.equal(Object.hasOwn(omitted, 'hideParticipantsWithoutCapacity'), false);
  assert.equal(validateConfiguration(omitted).valid, true);

  const hidden = clonePreset('balanced');
  hidden.hideParticipantsWithoutCapacity = true;
  assert.equal(validateConfiguration(hidden).valid, true);

  const shown = clonePreset('balanced');
  shown.hideParticipantsWithoutCapacity = false;
  assert.equal(validateConfiguration(shown).valid, true);

  for (const value of ['true', 1, 0, null, 'yes', {}]) {
    const config = clonePreset('balanced');
    config.hideParticipantsWithoutCapacity = value;
    const validation = validateConfiguration(config);
    assert.equal(validation.valid, false, String(value));
    assert.match(validation.errors.join(' '), /boolean/);
  }

  const extra = clonePreset('balanced');
  extra.hideParticipantsWithoutCapacity = true;
  extra.unexpected = true;
  assert.match(validateConfiguration(extra).errors.join(' '), /unknown field: unexpected/);

  const both = clonePreset('balanced');
  both.hideHoldingParticipants = true;
  both.hideAllHoldLedger = true;
  both.hideZeroShareParticipants = true;
  both.hideParticipantsOverCapacity = true;
  both.hideParticipantsAtHold = true;
  both.hideParticipantsWithoutCapacity = true;
  both.hideParticipantsWithSpareCapacity = true;
  both.hideParticipantsAtLeastHeadroom = true;
  both.hideParticipantsWithinCapacity = true;
  assert.equal(validateConfiguration(both).valid, true);
});

test('optional hideParticipantsWithSpareCapacity is a boolean and older files omit it', () => {
  const omitted = clonePreset('balanced');
  assert.equal(Object.hasOwn(omitted, 'hideParticipantsWithSpareCapacity'), false);
  assert.equal(validateConfiguration(omitted).valid, true);

  const hidden = clonePreset('balanced');
  hidden.hideParticipantsWithSpareCapacity = true;
  assert.equal(validateConfiguration(hidden).valid, true);

  const shown = clonePreset('balanced');
  shown.hideParticipantsWithSpareCapacity = false;
  assert.equal(validateConfiguration(shown).valid, true);

  for (const value of ['true', 1, 0, null, 'yes', {}]) {
    const config = clonePreset('balanced');
    config.hideParticipantsWithSpareCapacity = value;
    const validation = validateConfiguration(config);
    assert.equal(validation.valid, false, String(value));
    assert.match(validation.errors.join(' '), /boolean/);
  }

  const extra = clonePreset('balanced');
  extra.hideParticipantsWithSpareCapacity = true;
  extra.unexpected = true;
  assert.match(validateConfiguration(extra).errors.join(' '), /unknown field: unexpected/);

  const both = clonePreset('balanced');
  both.hideHoldingParticipants = true;
  both.hideAllHoldLedger = true;
  both.hideZeroShareParticipants = true;
  both.hideParticipantsOverCapacity = true;
  both.hideParticipantsAtHold = true;
  both.hideParticipantsWithoutCapacity = true;
  both.hideParticipantsWithSpareCapacity = true;
  both.hideParticipantsAtLeastHeadroom = true;
  both.hideParticipantsWithinCapacity = true;
  assert.equal(validateConfiguration(both).valid, true);
});

test('optional hideParticipantsAtLeastHeadroom is a boolean and older files omit it', () => {
  const omitted = clonePreset('balanced');
  assert.equal(Object.hasOwn(omitted, 'hideParticipantsAtLeastHeadroom'), false);
  assert.equal(validateConfiguration(omitted).valid, true);

  const hidden = clonePreset('balanced');
  hidden.hideParticipantsAtLeastHeadroom = true;
  assert.equal(validateConfiguration(hidden).valid, true);

  const shown = clonePreset('balanced');
  shown.hideParticipantsAtLeastHeadroom = false;
  assert.equal(validateConfiguration(shown).valid, true);

  for (const value of ['true', 1, 0, null, 'yes', {}]) {
    const config = clonePreset('balanced');
    config.hideParticipantsAtLeastHeadroom = value;
    const validation = validateConfiguration(config);
    assert.equal(validation.valid, false, String(value));
    assert.match(validation.errors.join(' '), /boolean/);
  }

  const extra = clonePreset('balanced');
  extra.hideParticipantsAtLeastHeadroom = true;
  extra.unexpected = true;
  assert.match(validateConfiguration(extra).errors.join(' '), /unknown field: unexpected/);

  const both = clonePreset('balanced');
  both.hideHoldingParticipants = true;
  both.hideAllHoldLedger = true;
  both.hideZeroShareParticipants = true;
  both.hideParticipantsOverCapacity = true;
  both.hideParticipantsAtHold = true;
  both.hideParticipantsWithoutCapacity = true;
  both.hideParticipantsWithSpareCapacity = true;
  both.hideParticipantsAtLeastHeadroom = true;
  both.hideParticipantsWithinCapacity = true;
  assert.equal(validateConfiguration(both).valid, true);
});

test('optional hideParticipantsWithinCapacity is a boolean and older files omit it', () => {
  const omitted = clonePreset('balanced');
  assert.equal(Object.hasOwn(omitted, 'hideParticipantsWithinCapacity'), false);
  assert.equal(validateConfiguration(omitted).valid, true);

  const hidden = clonePreset('balanced');
  hidden.hideParticipantsWithinCapacity = true;
  assert.equal(validateConfiguration(hidden).valid, true);

  const shown = clonePreset('balanced');
  shown.hideParticipantsWithinCapacity = false;
  assert.equal(validateConfiguration(shown).valid, true);

  for (const value of ['true', 1, 0, null, 'yes', {}]) {
    const config = clonePreset('balanced');
    config.hideParticipantsWithinCapacity = value;
    const validation = validateConfiguration(config);
    assert.equal(validation.valid, false, String(value));
    assert.match(validation.errors.join(' '), /boolean/);
  }

  const extra = clonePreset('balanced');
  extra.hideParticipantsWithinCapacity = true;
  extra.unexpected = true;
  assert.match(validateConfiguration(extra).errors.join(' '), /unknown field: unexpected/);

  const both = clonePreset('balanced');
  both.hideHoldingParticipants = true;
  both.hideAllHoldLedger = true;
  both.hideZeroShareParticipants = true;
  both.hideParticipantsOverCapacity = true;
  both.hideParticipantsAtHold = true;
  both.hideParticipantsWithoutCapacity = true;
  both.hideParticipantsWithSpareCapacity = true;
  both.hideParticipantsAtLeastHeadroom = true;
  both.hideParticipantsWithinCapacity = true;
  assert.equal(validateConfiguration(both).valid, true);
});

test('optional hideFirstBreakpointParticipant is a boolean and older files omit it', () => {
  const omitted = clonePreset('balanced');
  assert.equal(Object.hasOwn(omitted, 'hideFirstBreakpointParticipant'), false);
  assert.equal(validateConfiguration(omitted).valid, true);

  const hidden = clonePreset('balanced');
  hidden.hideFirstBreakpointParticipant = true;
  assert.equal(validateConfiguration(hidden).valid, true);

  const shown = clonePreset('balanced');
  shown.hideFirstBreakpointParticipant = false;
  assert.equal(validateConfiguration(shown).valid, true);

  for (const value of ['true', 1, 0, null, 'yes', {}]) {
    const config = clonePreset('balanced');
    config.hideFirstBreakpointParticipant = value;
    const validation = validateConfiguration(config);
    assert.equal(validation.valid, false, String(value));
    assert.match(validation.errors.join(' '), /boolean/);
  }

  const extra = clonePreset('balanced');
  extra.hideFirstBreakpointParticipant = true;
  extra.unexpected = true;
  assert.match(validateConfiguration(extra).errors.join(' '), /unknown field: unexpected/);

  const both = clonePreset('balanced');
  both.hideHoldingParticipants = true;
  both.hideAllHoldLedger = true;
  both.hideZeroShareParticipants = true;
  both.hideParticipantsOverCapacity = true;
  both.hideParticipantsAtHold = true;
  both.hideParticipantsWithoutCapacity = true;
  both.hideParticipantsWithSpareCapacity = true;
  both.hideParticipantsAtLeastHeadroom = true;
  both.hideParticipantsWithinCapacity = true;
  both.hideFirstBreakpointParticipant = true;
  both.hideFirstOverCapacityParticipant = true;
  assert.equal(validateConfiguration(both).valid, true);
});

test('optional hideFirstOverCapacityParticipant is a boolean and older files omit it', () => {
  const omitted = clonePreset('balanced');
  assert.equal(Object.hasOwn(omitted, 'hideFirstOverCapacityParticipant'), false);
  assert.equal(validateConfiguration(omitted).valid, true);

  const hidden = clonePreset('balanced');
  hidden.hideFirstOverCapacityParticipant = true;
  assert.equal(validateConfiguration(hidden).valid, true);

  const shown = clonePreset('balanced');
  shown.hideFirstOverCapacityParticipant = false;
  assert.equal(validateConfiguration(shown).valid, true);

  for (const value of ['true', 1, 0, null, 'yes', {}]) {
    const config = clonePreset('balanced');
    config.hideFirstOverCapacityParticipant = value;
    const validation = validateConfiguration(config);
    assert.equal(validation.valid, false, String(value));
    assert.match(validation.errors.join(' '), /boolean/);
  }

  const extra = clonePreset('balanced');
  extra.hideFirstOverCapacityParticipant = true;
  extra.unexpected = true;
  assert.match(validateConfiguration(extra).errors.join(' '), /unknown field: unexpected/);

  const both = clonePreset('balanced');
  both.hideHoldingParticipants = true;
  both.hideAllHoldLedger = true;
  both.hideZeroShareParticipants = true;
  both.hideParticipantsOverCapacity = true;
  both.hideParticipantsAtHold = true;
  both.hideParticipantsWithoutCapacity = true;
  both.hideParticipantsWithSpareCapacity = true;
  both.hideParticipantsAtLeastHeadroom = true;
  both.hideParticipantsWithinCapacity = true;
  both.hideFirstBreakpointParticipant = true;
  both.hideFirstOverCapacityParticipant = true;
  both.hideLastOverCapacityParticipant = true;
  both.hideLastBreakpointParticipant = true;
  assert.equal(validateConfiguration(both).valid, true);
});

test('optional hideLastOverCapacityParticipant is a boolean and older files omit it', () => {
  const omitted = clonePreset('balanced');
  assert.equal(Object.hasOwn(omitted, 'hideLastOverCapacityParticipant'), false);
  assert.equal(validateConfiguration(omitted).valid, true);

  const hidden = clonePreset('balanced');
  hidden.hideLastOverCapacityParticipant = true;
  assert.equal(validateConfiguration(hidden).valid, true);

  const shown = clonePreset('balanced');
  shown.hideLastOverCapacityParticipant = false;
  assert.equal(validateConfiguration(shown).valid, true);

  for (const value of ['true', 1, 0, null, 'yes', {}]) {
    const config = clonePreset('balanced');
    config.hideLastOverCapacityParticipant = value;
    const validation = validateConfiguration(config);
    assert.equal(validation.valid, false, String(value));
    assert.match(validation.errors.join(' '), /boolean/);
  }

  const extra = clonePreset('balanced');
  extra.hideLastOverCapacityParticipant = true;
  extra.unexpected = true;
  assert.match(validateConfiguration(extra).errors.join(' '), /unknown field: unexpected/);

  const both = clonePreset('balanced');
  both.hideHoldingParticipants = true;
  both.hideAllHoldLedger = true;
  both.hideZeroShareParticipants = true;
  both.hideParticipantsOverCapacity = true;
  both.hideParticipantsAtHold = true;
  both.hideParticipantsWithoutCapacity = true;
  both.hideParticipantsWithSpareCapacity = true;
  both.hideParticipantsAtLeastHeadroom = true;
  both.hideParticipantsWithinCapacity = true;
  both.hideFirstBreakpointParticipant = true;
  both.hideFirstOverCapacityParticipant = true;
  both.hideLastOverCapacityParticipant = true;
  both.hideLastBreakpointParticipant = true;
  assert.equal(validateConfiguration(both).valid, true);
});

test('optional hideLastBreakpointParticipant is a boolean and older files omit it', () => {
  const omitted = clonePreset('balanced');
  assert.equal(Object.hasOwn(omitted, 'hideLastBreakpointParticipant'), false);
  assert.equal(validateConfiguration(omitted).valid, true);

  const hidden = clonePreset('balanced');
  hidden.hideLastBreakpointParticipant = true;
  assert.equal(validateConfiguration(hidden).valid, true);

  const shown = clonePreset('balanced');
  shown.hideLastBreakpointParticipant = false;
  assert.equal(validateConfiguration(shown).valid, true);

  for (const value of ['true', 1, 0, null, 'yes', {}]) {
    const config = clonePreset('balanced');
    config.hideLastBreakpointParticipant = value;
    const validation = validateConfiguration(config);
    assert.equal(validation.valid, false, String(value));
    assert.match(validation.errors.join(' '), /boolean/);
  }

  const extra = clonePreset('balanced');
  extra.hideLastBreakpointParticipant = true;
  extra.unexpected = true;
  assert.match(validateConfiguration(extra).errors.join(' '), /unknown field: unexpected/);

  const both = clonePreset('balanced');
  both.hideHoldingParticipants = true;
  both.hideAllHoldLedger = true;
  both.hideZeroShareParticipants = true;
  both.hideParticipantsOverCapacity = true;
  both.hideParticipantsAtHold = true;
  both.hideParticipantsWithoutCapacity = true;
  both.hideParticipantsWithSpareCapacity = true;
  both.hideParticipantsAtLeastHeadroom = true;
  both.hideParticipantsWithinCapacity = true;
  both.hideFirstBreakpointParticipant = true;
  both.hideFirstOverCapacityParticipant = true;
  both.hideLastOverCapacityParticipant = true;
  both.hideLastBreakpointParticipant = true;
  both.hideLastWithinCapacityParticipant = true;
  both.hideFirstWithinCapacityParticipant = true;
  assert.equal(validateConfiguration(both).valid, true);
});

test('optional hideLastWithinCapacityParticipant is a boolean and older files omit it', () => {
  const omitted = clonePreset('balanced');
  assert.equal(Object.hasOwn(omitted, 'hideLastWithinCapacityParticipant'), false);
  assert.equal(validateConfiguration(omitted).valid, true);

  const hidden = clonePreset('balanced');
  hidden.hideLastWithinCapacityParticipant = true;
  assert.equal(validateConfiguration(hidden).valid, true);

  const shown = clonePreset('balanced');
  shown.hideLastWithinCapacityParticipant = false;
  assert.equal(validateConfiguration(shown).valid, true);

  for (const value of ['true', 1, 0, null, 'yes', {}]) {
    const config = clonePreset('balanced');
    config.hideLastWithinCapacityParticipant = value;
    const validation = validateConfiguration(config);
    assert.equal(validation.valid, false, String(value));
    assert.match(validation.errors.join(' '), /boolean/);
  }

  const extra = clonePreset('balanced');
  extra.hideLastWithinCapacityParticipant = true;
  extra.unexpected = true;
  assert.match(validateConfiguration(extra).errors.join(' '), /unknown field: unexpected/);

  const both = clonePreset('balanced');
  both.hideHoldingParticipants = true;
  both.hideAllHoldLedger = true;
  both.hideZeroShareParticipants = true;
  both.hideParticipantsOverCapacity = true;
  both.hideParticipantsAtHold = true;
  both.hideParticipantsWithoutCapacity = true;
  both.hideParticipantsWithSpareCapacity = true;
  both.hideParticipantsAtLeastHeadroom = true;
  both.hideParticipantsWithinCapacity = true;
  both.hideFirstBreakpointParticipant = true;
  both.hideFirstOverCapacityParticipant = true;
  both.hideLastOverCapacityParticipant = true;
  both.hideLastBreakpointParticipant = true;
  both.hideLastWithinCapacityParticipant = true;
  both.hideFirstWithinCapacityParticipant = true;
  assert.equal(validateConfiguration(both).valid, true);
});

test('optional hideFirstWithinCapacityParticipant is a boolean and older files omit it', () => {
  const omitted = clonePreset('balanced');
  assert.equal(Object.hasOwn(omitted, 'hideFirstWithinCapacityParticipant'), false);
  assert.equal(validateConfiguration(omitted).valid, true);

  const hidden = clonePreset('balanced');
  hidden.hideFirstWithinCapacityParticipant = true;
  assert.equal(validateConfiguration(hidden).valid, true);

  const shown = clonePreset('balanced');
  shown.hideFirstWithinCapacityParticipant = false;
  assert.equal(validateConfiguration(shown).valid, true);

  for (const value of ['true', 1, 0, null, 'yes', {}]) {
    const config = clonePreset('balanced');
    config.hideFirstWithinCapacityParticipant = value;
    const validation = validateConfiguration(config);
    assert.equal(validation.valid, false, String(value));
    assert.match(validation.errors.join(' '), /boolean/);
  }

  const extra = clonePreset('balanced');
  extra.hideFirstWithinCapacityParticipant = true;
  extra.unexpected = true;
  assert.match(validateConfiguration(extra).errors.join(' '), /unknown field: unexpected/);

  const both = clonePreset('balanced');
  both.hideHoldingParticipants = true;
  both.hideAllHoldLedger = true;
  both.hideZeroShareParticipants = true;
  both.hideParticipantsOverCapacity = true;
  both.hideParticipantsAtHold = true;
  both.hideParticipantsWithoutCapacity = true;
  both.hideParticipantsWithSpareCapacity = true;
  both.hideParticipantsAtLeastHeadroom = true;
  both.hideParticipantsWithinCapacity = true;
  both.hideFirstBreakpointParticipant = true;
  both.hideFirstOverCapacityParticipant = true;
  both.hideLastOverCapacityParticipant = true;
  both.hideLastBreakpointParticipant = true;
  both.hideLastWithinCapacityParticipant = true;
  both.hideFirstWithinCapacityParticipant = true;
  both.hideLastSpareCapacityParticipant = true;
  both.hideFirstSpareCapacityParticipant = true;
  assert.equal(validateConfiguration(both).valid, true);
});

test('optional hideLastSpareCapacityParticipant is a boolean and older files omit it', () => {
  const omitted = clonePreset('balanced');
  assert.equal(Object.hasOwn(omitted, 'hideLastSpareCapacityParticipant'), false);
  assert.equal(validateConfiguration(omitted).valid, true);

  const hidden = clonePreset('balanced');
  hidden.hideLastSpareCapacityParticipant = true;
  assert.equal(validateConfiguration(hidden).valid, true);

  const shown = clonePreset('balanced');
  shown.hideLastSpareCapacityParticipant = false;
  assert.equal(validateConfiguration(shown).valid, true);

  for (const value of ['true', 1, 0, null, 'yes', {}]) {
    const config = clonePreset('balanced');
    config.hideLastSpareCapacityParticipant = value;
    const validation = validateConfiguration(config);
    assert.equal(validation.valid, false, String(value));
    assert.match(validation.errors.join(' '), /boolean/);
  }

  const extra = clonePreset('balanced');
  extra.hideLastSpareCapacityParticipant = true;
  extra.unexpected = true;
  assert.match(validateConfiguration(extra).errors.join(' '), /unknown field: unexpected/);

  const both = clonePreset('balanced');
  both.hideHoldingParticipants = true;
  both.hideAllHoldLedger = true;
  both.hideZeroShareParticipants = true;
  both.hideParticipantsOverCapacity = true;
  both.hideParticipantsAtHold = true;
  both.hideParticipantsWithoutCapacity = true;
  both.hideParticipantsWithSpareCapacity = true;
  both.hideParticipantsAtLeastHeadroom = true;
  both.hideParticipantsWithinCapacity = true;
  both.hideFirstBreakpointParticipant = true;
  both.hideFirstOverCapacityParticipant = true;
  both.hideLastOverCapacityParticipant = true;
  both.hideLastBreakpointParticipant = true;
  both.hideLastWithinCapacityParticipant = true;
  both.hideFirstWithinCapacityParticipant = true;
  both.hideLastSpareCapacityParticipant = true;
  both.hideFirstSpareCapacityParticipant = true;
  assert.equal(validateConfiguration(both).valid, true);
  const calculated = calculatePartnership(both);
  assert.equal(calculated.viable, true);
});


test('optional hideFirstSpareCapacityParticipant is a boolean and older files omit it', () => {
  const omitted = clonePreset('balanced');
  assert.equal(Object.hasOwn(omitted, 'hideFirstSpareCapacityParticipant'), false);
  assert.equal(validateConfiguration(omitted).valid, true);

  const hidden = clonePreset('balanced');
  hidden.hideFirstSpareCapacityParticipant = true;
  assert.equal(validateConfiguration(hidden).valid, true);

  const shown = clonePreset('balanced');
  shown.hideFirstSpareCapacityParticipant = false;
  assert.equal(validateConfiguration(shown).valid, true);

  for (const value of ['true', 1, 0, null, 'yes', {}]) {
    const config = clonePreset('balanced');
    config.hideFirstSpareCapacityParticipant = value;
    const validation = validateConfiguration(config);
    assert.equal(validation.valid, false, String(value));
    assert.match(validation.errors.join(' '), /boolean/);
  }

  const extra = clonePreset('balanced');
  extra.hideFirstSpareCapacityParticipant = true;
  extra.unexpected = true;
  assert.match(validateConfiguration(extra).errors.join(' '), /unknown field: unexpected/);

  const both = clonePreset('balanced');
  both.hideHoldingParticipants = true;
  both.hideAllHoldLedger = true;
  both.hideZeroShareParticipants = true;
  both.hideParticipantsOverCapacity = true;
  both.hideParticipantsAtHold = true;
  both.hideParticipantsWithoutCapacity = true;
  both.hideParticipantsWithSpareCapacity = true;
  both.hideParticipantsAtLeastHeadroom = true;
  both.hideParticipantsWithinCapacity = true;
  both.hideFirstBreakpointParticipant = true;
  both.hideFirstOverCapacityParticipant = true;
  both.hideLastOverCapacityParticipant = true;
  both.hideLastBreakpointParticipant = true;
  both.hideLastWithinCapacityParticipant = true;
  both.hideFirstWithinCapacityParticipant = true;
  both.hideLastSpareCapacityParticipant = true;
  both.hideFirstSpareCapacityParticipant = true;
  both.hideLastParticipantWithoutCapacity = true;
  both.hideFirstParticipantWithoutCapacity = true;
  assert.equal(validateConfiguration(both).valid, true);
  const calculated = calculatePartnership(both);
  assert.equal(calculated.viable, true);
});

test('optional hideLastParticipantWithoutCapacity is a boolean and older files omit it', () => {
  const omitted = clonePreset('balanced');
  assert.equal(Object.hasOwn(omitted, 'hideLastParticipantWithoutCapacity'), false);
  assert.equal(validateConfiguration(omitted).valid, true);

  const hidden = clonePreset('balanced');
  hidden.hideLastParticipantWithoutCapacity = true;
  assert.equal(validateConfiguration(hidden).valid, true);

  const shown = clonePreset('balanced');
  shown.hideLastParticipantWithoutCapacity = false;
  assert.equal(validateConfiguration(shown).valid, true);

  for (const value of ['true', 1, 0, null, 'yes', {}]) {
    const config = clonePreset('balanced');
    config.hideLastParticipantWithoutCapacity = value;
    const validation = validateConfiguration(config);
    assert.equal(validation.valid, false, String(value));
    assert.match(validation.errors.join(' '), /boolean/);
  }

  const extra = clonePreset('balanced');
  extra.hideLastParticipantWithoutCapacity = true;
  extra.unexpected = true;
  assert.match(validateConfiguration(extra).errors.join(' '), /unknown field: unexpected/);

  const both = clonePreset('balanced');
  both.hideHoldingParticipants = true;
  both.hideAllHoldLedger = true;
  both.hideZeroShareParticipants = true;
  both.hideParticipantsOverCapacity = true;
  both.hideParticipantsAtHold = true;
  both.hideParticipantsWithoutCapacity = true;
  both.hideParticipantsWithSpareCapacity = true;
  both.hideParticipantsAtLeastHeadroom = true;
  both.hideParticipantsWithinCapacity = true;
  both.hideFirstBreakpointParticipant = true;
  both.hideFirstOverCapacityParticipant = true;
  both.hideLastOverCapacityParticipant = true;
  both.hideLastBreakpointParticipant = true;
  both.hideLastWithinCapacityParticipant = true;
  both.hideFirstWithinCapacityParticipant = true;
  both.hideLastSpareCapacityParticipant = true;
  both.hideFirstSpareCapacityParticipant = true;
  both.hideLastParticipantWithoutCapacity = true;
  both.hideFirstParticipantWithoutCapacity = true;
  assert.equal(validateConfiguration(both).valid, true);
  const calculated = calculatePartnership(both);
  assert.equal(calculated.viable, true);

  const talent = clonePreset('talentAgentPlatform');
  assert.equal(talent.participants[0].capacity, null);
  assert.notEqual(talent.participants[1].capacity, null);
  assert.notEqual(talent.participants[2].capacity, null);
  talent.hideLastParticipantWithoutCapacity = true;
  assert.equal(validateConfiguration(talent).valid, true);
  assert.equal(Object.hasOwn(talent, 'hideParticipantsWithoutCapacity'), false);
});

test('optional hideFirstParticipantWithoutCapacity is a boolean and older files omit it', () => {
  const omitted = clonePreset('balanced');
  assert.equal(Object.hasOwn(omitted, 'hideFirstParticipantWithoutCapacity'), false);
  assert.equal(validateConfiguration(omitted).valid, true);

  const hidden = clonePreset('balanced');
  hidden.hideFirstParticipantWithoutCapacity = true;
  assert.equal(validateConfiguration(hidden).valid, true);

  const shown = clonePreset('balanced');
  shown.hideFirstParticipantWithoutCapacity = false;
  assert.equal(validateConfiguration(shown).valid, true);

  for (const value of ['true', 1, 0, null, 'yes', {}]) {
    const config = clonePreset('balanced');
    config.hideFirstParticipantWithoutCapacity = value;
    const validation = validateConfiguration(config);
    assert.equal(validation.valid, false, String(value));
    assert.match(validation.errors.join(' '), /boolean/);
  }

  const extra = clonePreset('balanced');
  extra.hideFirstParticipantWithoutCapacity = true;
  extra.unexpected = true;
  assert.match(validateConfiguration(extra).errors.join(' '), /unknown field: unexpected/);

  const both = clonePreset('balanced');
  both.hideHoldingParticipants = true;
  both.hideAllHoldLedger = true;
  both.hideZeroShareParticipants = true;
  both.hideParticipantsOverCapacity = true;
  both.hideParticipantsAtHold = true;
  both.hideParticipantsWithoutCapacity = true;
  both.hideParticipantsWithSpareCapacity = true;
  both.hideParticipantsAtLeastHeadroom = true;
  both.hideParticipantsWithinCapacity = true;
  both.hideFirstBreakpointParticipant = true;
  both.hideFirstOverCapacityParticipant = true;
  both.hideLastOverCapacityParticipant = true;
  both.hideLastBreakpointParticipant = true;
  both.hideLastWithinCapacityParticipant = true;
  both.hideFirstWithinCapacityParticipant = true;
  both.hideLastSpareCapacityParticipant = true;
  both.hideFirstSpareCapacityParticipant = true;
  both.hideLastParticipantWithoutCapacity = true;
  both.hideFirstParticipantWithoutCapacity = true;
  assert.equal(validateConfiguration(both).valid, true);
  const calculated = calculatePartnership(both);
  assert.equal(calculated.viable, true);

  const talent = clonePreset('talentAgentPlatform');
  assert.equal(talent.participants[0].capacity, null);
  assert.notEqual(talent.participants[1].capacity, null);
  assert.notEqual(talent.participants[2].capacity, null);
  talent.hideFirstParticipantWithoutCapacity = true;
  assert.equal(validateConfiguration(talent).valid, true);
  assert.equal(Object.hasOwn(talent, 'hideParticipantsWithoutCapacity'), false);
  assert.equal(Object.hasOwn(talent, 'hideLastParticipantWithoutCapacity'), false);
});

test('optional hideLastParticipantAtHold is a boolean and older files omit it', () => {
  const omitted = clonePreset('balanced');
  assert.equal(Object.hasOwn(omitted, 'hideLastParticipantAtHold'), false);
  assert.equal(validateConfiguration(omitted).valid, true);

  const hidden = clonePreset('balanced');
  hidden.hideLastParticipantAtHold = true;
  assert.equal(validateConfiguration(hidden).valid, true);

  const shown = clonePreset('balanced');
  shown.hideLastParticipantAtHold = false;
  assert.equal(validateConfiguration(shown).valid, true);

  for (const value of ['true', 1, 0, null, 'yes', {}]) {
    const config = clonePreset('balanced');
    config.hideLastParticipantAtHold = value;
    const validation = validateConfiguration(config);
    assert.equal(validation.valid, false, String(value));
    assert.match(validation.errors.join(' '), /boolean/);
  }

  const extra = clonePreset('balanced');
  extra.hideLastParticipantAtHold = true;
  extra.unexpected = true;
  assert.match(validateConfiguration(extra).errors.join(' '), /unknown field: unexpected/);

  const both = clonePreset('balanced');
  both.hideHoldingParticipants = true;
  both.hideAllHoldLedger = true;
  both.hideZeroShareParticipants = true;
  both.hideParticipantsOverCapacity = true;
  both.hideParticipantsAtHold = true;
  both.hideParticipantsWithoutCapacity = true;
  both.hideParticipantsWithSpareCapacity = true;
  both.hideParticipantsAtLeastHeadroom = true;
  both.hideParticipantsWithinCapacity = true;
  both.hideFirstBreakpointParticipant = true;
  both.hideFirstOverCapacityParticipant = true;
  both.hideLastOverCapacityParticipant = true;
  both.hideLastBreakpointParticipant = true;
  both.hideLastWithinCapacityParticipant = true;
  both.hideFirstWithinCapacityParticipant = true;
  both.hideLastSpareCapacityParticipant = true;
  both.hideFirstSpareCapacityParticipant = true;
  both.hideLastParticipantWithoutCapacity = true;
  both.hideFirstParticipantWithoutCapacity = true;
  both.hideLastParticipantAtHold = true;
  both.hideFirstParticipantAtHold = true;
  assert.equal(validateConfiguration(both).valid, true);
  const calculated = calculatePartnership(both);
  assert.equal(calculated.viable, true);
  assert.equal(calculated.participants.length, 3);

  const softball = clonePreset('softballCarnivalSplit');
  softball.hideLastParticipantAtHold = true;
  assert.equal(validateConfiguration(softball).valid, true);
  const softballResult = calculatePartnership(softball);
  assert.equal(softballResult.viable, true);
  assert.equal(Object.hasOwn(softball, 'hideParticipantsAtHold'), false);
  assert.equal(Object.hasOwn(softball, 'hideLastBreakpointParticipant'), false);
  assert.equal(Object.hasOwn(softball, 'hideFirstParticipantWithoutCapacity'), false);
  assert.equal(Object.hasOwn(softball, 'hideLastParticipantWithoutCapacity'), false);
});

test('optional hideFirstParticipantAtHold is a boolean and older files omit it', () => {
  const omitted = clonePreset('balanced');
  assert.equal(Object.hasOwn(omitted, 'hideFirstParticipantAtHold'), false);
  assert.equal(validateConfiguration(omitted).valid, true);

  const hidden = clonePreset('balanced');
  hidden.hideFirstParticipantAtHold = true;
  assert.equal(validateConfiguration(hidden).valid, true);

  const shown = clonePreset('balanced');
  shown.hideFirstParticipantAtHold = false;
  assert.equal(validateConfiguration(shown).valid, true);

  for (const value of ['true', 1, 0, null, 'yes', {}]) {
    const config = clonePreset('balanced');
    config.hideFirstParticipantAtHold = value;
    const validation = validateConfiguration(config);
    assert.equal(validation.valid, false, String(value));
    assert.match(validation.errors.join(' '), /boolean/);
  }

  const extra = clonePreset('balanced');
  extra.hideFirstParticipantAtHold = true;
  extra.unexpected = true;
  assert.match(validateConfiguration(extra).errors.join(' '), /unknown field: unexpected/);

  const both = clonePreset('balanced');
  both.hideHoldingParticipants = true;
  both.hideAllHoldLedger = true;
  both.hideZeroShareParticipants = true;
  both.hideParticipantsOverCapacity = true;
  both.hideParticipantsAtHold = true;
  both.hideParticipantsWithoutCapacity = true;
  both.hideParticipantsWithSpareCapacity = true;
  both.hideParticipantsAtLeastHeadroom = true;
  both.hideParticipantsWithinCapacity = true;
  both.hideFirstBreakpointParticipant = true;
  both.hideFirstOverCapacityParticipant = true;
  both.hideLastOverCapacityParticipant = true;
  both.hideLastBreakpointParticipant = true;
  both.hideLastWithinCapacityParticipant = true;
  both.hideFirstWithinCapacityParticipant = true;
  both.hideLastSpareCapacityParticipant = true;
  both.hideFirstSpareCapacityParticipant = true;
  both.hideLastParticipantWithoutCapacity = true;
  both.hideFirstParticipantWithoutCapacity = true;
  both.hideLastParticipantAtHold = true;
  both.hideFirstParticipantAtHold = true;
  assert.equal(validateConfiguration(both).valid, true);
  const calculated = calculatePartnership(both);
  assert.equal(calculated.viable, true);
  assert.equal(calculated.participants.length, 3);

  const lacrosse = clonePreset('lacrosseCarnivalSplit');
  lacrosse.hideFirstParticipantAtHold = true;
  assert.equal(validateConfiguration(lacrosse).valid, true);
  const lacrosseResult = calculatePartnership(lacrosse);
  assert.equal(lacrosseResult.viable, true);
  assert.equal(Object.hasOwn(lacrosse, 'hideParticipantsAtHold'), false);
  assert.equal(Object.hasOwn(lacrosse, 'hideLastParticipantAtHold'), false);
  assert.equal(Object.hasOwn(lacrosse, 'hideLastBreakpointParticipant'), false);
  assert.equal(Object.hasOwn(lacrosse, 'hideFirstParticipantWithoutCapacity'), false);
  assert.equal(Object.hasOwn(lacrosse, 'hideLastParticipantWithoutCapacity'), false);
});

test('optional hideFirstZeroShareParticipant is a boolean and older files omit it', () => {
  const omitted = clonePreset('balanced');
  assert.equal(Object.hasOwn(omitted, 'hideFirstZeroShareParticipant'), false);
  assert.equal(validateConfiguration(omitted).valid, true);

  const hidden = clonePreset('balanced');
  hidden.hideFirstZeroShareParticipant = true;
  assert.equal(validateConfiguration(hidden).valid, true);

  const shown = clonePreset('balanced');
  shown.hideFirstZeroShareParticipant = false;
  assert.equal(validateConfiguration(shown).valid, true);

  for (const value of ['true', 1, 0, null, 'yes', {}]) {
    const config = clonePreset('balanced');
    config.hideFirstZeroShareParticipant = value;
    const validation = validateConfiguration(config);
    assert.equal(validation.valid, false, String(value));
    assert.match(validation.errors.join(' '), /boolean/);
  }

  const extra = clonePreset('balanced');
  extra.hideFirstZeroShareParticipant = true;
  extra.unexpected = true;
  assert.match(validateConfiguration(extra).errors.join(' '), /unknown field: unexpected/);

  const both = clonePreset('balanced');
  both.hideHoldingParticipants = true;
  both.hideAllHoldLedger = true;
  both.hideZeroShareParticipants = true;
  both.hideParticipantsOverCapacity = true;
  both.hideParticipantsAtHold = true;
  both.hideParticipantsWithoutCapacity = true;
  both.hideParticipantsWithSpareCapacity = true;
  both.hideParticipantsAtLeastHeadroom = true;
  both.hideParticipantsWithinCapacity = true;
  both.hideFirstBreakpointParticipant = true;
  both.hideFirstOverCapacityParticipant = true;
  both.hideLastOverCapacityParticipant = true;
  both.hideLastBreakpointParticipant = true;
  both.hideLastWithinCapacityParticipant = true;
  both.hideFirstWithinCapacityParticipant = true;
  both.hideLastSpareCapacityParticipant = true;
  both.hideFirstSpareCapacityParticipant = true;
  both.hideLastParticipantWithoutCapacity = true;
  both.hideFirstParticipantWithoutCapacity = true;
  both.hideLastParticipantAtHold = true;
  both.hideFirstParticipantAtHold = true;
  both.hideFirstZeroShareParticipant = true;
  both.hideLastZeroShareParticipant = true;
  assert.equal(validateConfiguration(both).valid, true);
  const calculated = calculatePartnership(both);
  assert.equal(calculated.viable, true);
  assert.equal(calculated.participants.length, 3);

  const waterPolo = clonePreset('waterPoloCarnivalSplit');
  waterPolo.hideFirstZeroShareParticipant = true;
  assert.equal(validateConfiguration(waterPolo).valid, true);
  const waterPoloResult = calculatePartnership(waterPolo);
  assert.equal(waterPoloResult.viable, true);
  assert.equal(Object.hasOwn(waterPolo, 'hideZeroShareParticipants'), false);
  assert.equal(Object.hasOwn(waterPolo, 'hideFirstParticipantAtHold'), false);
  assert.equal(Object.hasOwn(waterPolo, 'hideLastParticipantAtHold'), false);
  assert.equal(Object.hasOwn(waterPolo, 'hideParticipantsAtHold'), false);
});

test('optional hideLastZeroShareParticipant is a boolean and older files omit it', () => {
  const omitted = clonePreset('balanced');
  assert.equal(Object.hasOwn(omitted, 'hideLastZeroShareParticipant'), false);
  assert.equal(validateConfiguration(omitted).valid, true);

  const hidden = clonePreset('balanced');
  hidden.hideLastZeroShareParticipant = true;
  assert.equal(validateConfiguration(hidden).valid, true);

  const shown = clonePreset('balanced');
  shown.hideLastZeroShareParticipant = false;
  assert.equal(validateConfiguration(shown).valid, true);

  for (const value of ['true', 1, 0, null, 'yes', {}]) {
    const config = clonePreset('balanced');
    config.hideLastZeroShareParticipant = value;
    const validation = validateConfiguration(config);
    assert.equal(validation.valid, false, String(value));
    assert.match(validation.errors.join(' '), /boolean/);
  }

  const extra = clonePreset('balanced');
  extra.hideLastZeroShareParticipant = true;
  extra.unexpected = true;
  assert.match(validateConfiguration(extra).errors.join(' '), /unknown field: unexpected/);

  const both = clonePreset('balanced');
  both.hideHoldingParticipants = true;
  both.hideAllHoldLedger = true;
  both.hideZeroShareParticipants = true;
  both.hideParticipantsOverCapacity = true;
  both.hideParticipantsAtHold = true;
  both.hideParticipantsWithoutCapacity = true;
  both.hideParticipantsWithSpareCapacity = true;
  both.hideParticipantsAtLeastHeadroom = true;
  both.hideParticipantsWithinCapacity = true;
  both.hideFirstBreakpointParticipant = true;
  both.hideFirstOverCapacityParticipant = true;
  both.hideLastOverCapacityParticipant = true;
  both.hideLastBreakpointParticipant = true;
  both.hideLastWithinCapacityParticipant = true;
  both.hideFirstWithinCapacityParticipant = true;
  both.hideLastSpareCapacityParticipant = true;
  both.hideFirstSpareCapacityParticipant = true;
  both.hideLastParticipantWithoutCapacity = true;
  both.hideFirstParticipantWithoutCapacity = true;
  both.hideLastParticipantAtHold = true;
  both.hideFirstParticipantAtHold = true;
  both.hideFirstZeroShareParticipant = true;
  both.hideLastZeroShareParticipant = true;
  assert.equal(validateConfiguration(both).valid, true);
  const calculated = calculatePartnership(both);
  assert.equal(calculated.viable, true);
  assert.equal(calculated.participants.length, 3);

  const rowing = clonePreset('rowingCarnivalSplit');
  rowing.hideLastZeroShareParticipant = true;
  assert.equal(validateConfiguration(rowing).valid, true);
  const rowingResult = calculatePartnership(rowing);
  assert.equal(rowingResult.viable, true);
  assert.equal(Object.hasOwn(rowing, 'hideZeroShareParticipants'), false);
  assert.equal(Object.hasOwn(rowing, 'hideFirstZeroShareParticipant'), false);
  assert.equal(Object.hasOwn(rowing, 'hideFirstParticipantAtHold'), false);
  assert.equal(Object.hasOwn(rowing, 'hideLastParticipantAtHold'), false);
});

test('optional collapseAllHoldCases is a boolean and older files omit it', () => {
  const omitted = clonePreset('balanced');
  assert.equal(Object.hasOwn(omitted, 'collapseAllHoldCases'), false);
  assert.equal(validateConfiguration(omitted).valid, true);

  const collapsed = clonePreset('balanced');
  collapsed.collapseAllHoldCases = true;
  assert.equal(validateConfiguration(collapsed).valid, true);

  const expanded = clonePreset('balanced');
  expanded.collapseAllHoldCases = false;
  assert.equal(validateConfiguration(expanded).valid, true);

  for (const value of ['true', 1, 0, null, 'yes', {}]) {
    const config = clonePreset('balanced');
    config.collapseAllHoldCases = value;
    const validation = validateConfiguration(config);
    assert.equal(validation.valid, false, String(value));
    assert.match(validation.errors.join(' '), /boolean/);
  }

  const extra = clonePreset('balanced');
  extra.collapseAllHoldCases = true;
  extra.unexpected = true;
  assert.match(validateConfiguration(extra).errors.join(' '), /unknown field: unexpected/);
});
