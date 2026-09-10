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
  const others = ['balanced', 'thinMargin', 'growthAtCost', 'creatorTakeRate', 'threePartyJv', 'twoPartyStudio', 'fourPartyMarketplace', 'licensorDistributor', 'talentAgentPlatform', 'threePartyJointVenture', 'communityHallSplit', 'festivalStallSplit', 'popupCinemaSplit', 'communityRadioSplit', 'schoolConcertSplit', 'sportsCarnivalSplit', 'netballCarnivalSplit', 'swimmingCarnivalSplit', 'athleticsCarnivalSplit', 'cricketCarnivalSplit', 'tennisCarnivalSplit', 'basketballCarnivalSplit', 'volleyballCarnivalSplit'];
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
  const others = ['balanced', 'thinMargin', 'growthAtCost', 'creatorTakeRate', 'threePartyJv', 'twoPartyStudio', 'fourPartyMarketplace', 'licensorDistributor', 'talentAgentPlatform', 'threePartyJointVenture', 'podcastHostNetwork', 'festivalStallSplit', 'popupCinemaSplit', 'communityRadioSplit', 'schoolConcertSplit', 'sportsCarnivalSplit', 'netballCarnivalSplit', 'swimmingCarnivalSplit', 'athleticsCarnivalSplit', 'cricketCarnivalSplit', 'tennisCarnivalSplit', 'basketballCarnivalSplit', 'volleyballCarnivalSplit'];
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
  const others = ['balanced', 'thinMargin', 'growthAtCost', 'creatorTakeRate', 'threePartyJv', 'twoPartyStudio', 'fourPartyMarketplace', 'licensorDistributor', 'talentAgentPlatform', 'threePartyJointVenture', 'podcastHostNetwork', 'communityHallSplit', 'popupCinemaSplit', 'communityRadioSplit', 'schoolConcertSplit', 'sportsCarnivalSplit', 'netballCarnivalSplit', 'swimmingCarnivalSplit', 'athleticsCarnivalSplit', 'cricketCarnivalSplit', 'tennisCarnivalSplit', 'basketballCarnivalSplit', 'volleyballCarnivalSplit'];
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
  const others = ['balanced', 'thinMargin', 'growthAtCost', 'creatorTakeRate', 'threePartyJv', 'twoPartyStudio', 'fourPartyMarketplace', 'licensorDistributor', 'talentAgentPlatform', 'threePartyJointVenture', 'podcastHostNetwork', 'communityHallSplit', 'festivalStallSplit', 'communityRadioSplit', 'schoolConcertSplit', 'sportsCarnivalSplit', 'netballCarnivalSplit', 'swimmingCarnivalSplit', 'athleticsCarnivalSplit', 'cricketCarnivalSplit', 'tennisCarnivalSplit', 'basketballCarnivalSplit', 'volleyballCarnivalSplit'];
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
  const others = ['balanced', 'thinMargin', 'growthAtCost', 'creatorTakeRate', 'threePartyJv', 'twoPartyStudio', 'fourPartyMarketplace', 'licensorDistributor', 'talentAgentPlatform', 'threePartyJointVenture', 'podcastHostNetwork', 'communityHallSplit', 'festivalStallSplit', 'popupCinemaSplit', 'schoolConcertSplit', 'sportsCarnivalSplit', 'netballCarnivalSplit', 'swimmingCarnivalSplit', 'athleticsCarnivalSplit', 'cricketCarnivalSplit', 'tennisCarnivalSplit', 'basketballCarnivalSplit', 'volleyballCarnivalSplit'];
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
  const others = ['balanced', 'thinMargin', 'growthAtCost', 'creatorTakeRate', 'threePartyJv', 'twoPartyStudio', 'fourPartyMarketplace', 'licensorDistributor', 'talentAgentPlatform', 'threePartyJointVenture', 'podcastHostNetwork', 'communityHallSplit', 'festivalStallSplit', 'popupCinemaSplit', 'communityRadioSplit', 'sportsCarnivalSplit', 'netballCarnivalSplit', 'swimmingCarnivalSplit', 'athleticsCarnivalSplit', 'cricketCarnivalSplit', 'tennisCarnivalSplit', 'basketballCarnivalSplit', 'volleyballCarnivalSplit'];
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
  const others = ['balanced', 'thinMargin', 'growthAtCost', 'creatorTakeRate', 'threePartyJv', 'twoPartyStudio', 'fourPartyMarketplace', 'licensorDistributor', 'talentAgentPlatform', 'threePartyJointVenture', 'podcastHostNetwork', 'communityHallSplit', 'festivalStallSplit', 'popupCinemaSplit', 'communityRadioSplit', 'schoolConcertSplit', 'netballCarnivalSplit', 'swimmingCarnivalSplit', 'athleticsCarnivalSplit', 'cricketCarnivalSplit', 'tennisCarnivalSplit', 'basketballCarnivalSplit', 'volleyballCarnivalSplit'];
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
  const others = ['balanced', 'thinMargin', 'growthAtCost', 'creatorTakeRate', 'threePartyJv', 'twoPartyStudio', 'fourPartyMarketplace', 'licensorDistributor', 'talentAgentPlatform', 'threePartyJointVenture', 'podcastHostNetwork', 'communityHallSplit', 'festivalStallSplit', 'popupCinemaSplit', 'communityRadioSplit', 'schoolConcertSplit', 'sportsCarnivalSplit', 'swimmingCarnivalSplit', 'athleticsCarnivalSplit', 'cricketCarnivalSplit', 'tennisCarnivalSplit', 'basketballCarnivalSplit', 'volleyballCarnivalSplit'];
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
  const others = ['balanced', 'thinMargin', 'growthAtCost', 'creatorTakeRate', 'threePartyJv', 'twoPartyStudio', 'fourPartyMarketplace', 'licensorDistributor', 'talentAgentPlatform', 'threePartyJointVenture', 'podcastHostNetwork', 'communityHallSplit', 'festivalStallSplit', 'popupCinemaSplit', 'communityRadioSplit', 'schoolConcertSplit', 'sportsCarnivalSplit', 'netballCarnivalSplit', 'athleticsCarnivalSplit', 'cricketCarnivalSplit', 'tennisCarnivalSplit', 'basketballCarnivalSplit', 'volleyballCarnivalSplit'];
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
  const others = ['balanced', 'thinMargin', 'growthAtCost', 'creatorTakeRate', 'threePartyJv', 'twoPartyStudio', 'fourPartyMarketplace', 'licensorDistributor', 'talentAgentPlatform', 'threePartyJointVenture', 'podcastHostNetwork', 'communityHallSplit', 'festivalStallSplit', 'popupCinemaSplit', 'communityRadioSplit', 'schoolConcertSplit', 'sportsCarnivalSplit', 'netballCarnivalSplit', 'swimmingCarnivalSplit', 'cricketCarnivalSplit', 'tennisCarnivalSplit', 'basketballCarnivalSplit', 'volleyballCarnivalSplit'];
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
  const others = ['balanced', 'thinMargin', 'growthAtCost', 'creatorTakeRate', 'threePartyJv', 'twoPartyStudio', 'fourPartyMarketplace', 'licensorDistributor', 'talentAgentPlatform', 'threePartyJointVenture', 'podcastHostNetwork', 'communityHallSplit', 'festivalStallSplit', 'popupCinemaSplit', 'communityRadioSplit', 'schoolConcertSplit', 'sportsCarnivalSplit', 'netballCarnivalSplit', 'swimmingCarnivalSplit', 'athleticsCarnivalSplit', 'tennisCarnivalSplit', 'basketballCarnivalSplit', 'volleyballCarnivalSplit'];
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
  const others = ['balanced', 'thinMargin', 'growthAtCost', 'creatorTakeRate', 'threePartyJv', 'twoPartyStudio', 'fourPartyMarketplace', 'licensorDistributor', 'talentAgentPlatform', 'threePartyJointVenture', 'podcastHostNetwork', 'communityHallSplit', 'festivalStallSplit', 'popupCinemaSplit', 'communityRadioSplit', 'schoolConcertSplit', 'sportsCarnivalSplit', 'netballCarnivalSplit', 'swimmingCarnivalSplit', 'athleticsCarnivalSplit', 'cricketCarnivalSplit', 'basketballCarnivalSplit', 'volleyballCarnivalSplit'];
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
  const others = ['balanced', 'thinMargin', 'growthAtCost', 'creatorTakeRate', 'threePartyJv', 'twoPartyStudio', 'fourPartyMarketplace', 'licensorDistributor', 'talentAgentPlatform', 'threePartyJointVenture', 'podcastHostNetwork', 'communityHallSplit', 'festivalStallSplit', 'popupCinemaSplit', 'communityRadioSplit', 'schoolConcertSplit', 'sportsCarnivalSplit', 'netballCarnivalSplit', 'swimmingCarnivalSplit', 'athleticsCarnivalSplit', 'cricketCarnivalSplit', 'tennisCarnivalSplit', 'volleyballCarnivalSplit'];
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
  const others = ['balanced', 'thinMargin', 'growthAtCost', 'creatorTakeRate', 'threePartyJv', 'twoPartyStudio', 'fourPartyMarketplace', 'licensorDistributor', 'talentAgentPlatform', 'threePartyJointVenture', 'podcastHostNetwork', 'communityHallSplit', 'festivalStallSplit', 'popupCinemaSplit', 'communityRadioSplit', 'schoolConcertSplit', 'sportsCarnivalSplit', 'netballCarnivalSplit', 'swimmingCarnivalSplit', 'athleticsCarnivalSplit', 'cricketCarnivalSplit', 'tennisCarnivalSplit', 'basketballCarnivalSplit'];
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
  assert.equal(validateConfiguration(both).valid, true);
  const calculated = calculatePartnership(both);
  assert.equal(calculated.viable, true);
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
