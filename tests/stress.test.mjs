import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DEFAULT_STRESS, EPSILON, MAX_NUMERIC_INPUT, ValidationError,
  applyStressProposal, calculatePartnership, clonePreset, evaluateStressGrid, validateConfiguration,
} from '../src/model.js';

const noStress = () => ({ volumeDropPct: 0, volumeGrowthPct: 0, feeDropPct: 0, variableCostRisePct: 0 });
function simpleCase() {
  return {
    deal: { monthlyVolume: 100, feePerTransaction: 10, addressableVolume: 200, volumeShockPct: 0 },
    participants: ['a', 'b'].map((id) => ({ id, name: id.toUpperCase(), revenueShare: 0.5,
      variableCostPerTransaction: 2, fixedMonthlyCost: 0, minimumAcceptableProfit: 200,
      capacity: null, minimumCommitment: 0, riskCost: 0 })),
    stress: { volumeDropPct: 20, volumeGrowthPct: 0, feeDropPct: 10, variableCostRisePct: 20 },
  };
}
function close(actual, expected) {
  assert.ok(Math.abs(actual - expected) <= 1e-8 * Math.max(1, Math.abs(expected)), `${actual} != ${expected}`);
}

test('legacy v1 cases remain valid and retain their baseline calculations', () => {
  const legacy = clonePreset('balanced');
  const before = calculatePartnership(legacy);
  assert.equal('stress' in legacy, false);
  assert.deepEqual(evaluateStressGrid(legacy).settings, DEFAULT_STRESS);
  assert.equal(evaluateStressGrid(legacy).caseCount, 27);
  const withSettings = { ...legacy, stress: noStress() };
  assert.deepEqual(calculatePartnership(withSettings), before);
  assert.deepEqual(calculatePartnership(legacy), before);
});

test('compound shocks can fail while each full shock alone holds', () => {
  const config = simpleCase();
  const result = evaluateStressGrid(config);
  assert.equal(result.caseCount, 18);
  for (const scenario of result.scenarios) {
    const nonzero = [scenario.volumeChangePct, scenario.feeDropPct, scenario.variableCostRisePct].filter(Boolean).length;
    if (nonzero <= 1) assert.equal(scenario.viable, true);
  }
  const compound = result.scenarios.find((scenario) => scenario.volumeChangePct === -20 && scenario.feeDropPct === 10 && scenario.variableCostRisePct === 20);
  assert.equal(compound.viable, false);
  close(compound.participants[0].monthlyProfit, 168);
  close(result.participants[0].worst.profitGap, -32);
  assert.equal(result.negotiation.status, 'insufficient-revenue');
  assert.equal(result.negotiation.proposal, null);
});

test('a tested fixed-share proposal repairs underallocation across compound cases without mutation', () => {
  const config = simpleCase();
  config.participants[0].revenueShare = 0.3;
  config.participants[1].revenueShare = 0.7;
  config.participants.forEach((participant) => { participant.minimumAcceptableProfit = 100; });
  const snapshot = structuredClone(config);
  for (const participant of config.participants) Object.freeze(participant);
  Object.freeze(config.participants);
  Object.freeze(config.deal);
  Object.freeze(config.stress);
  Object.freeze(config);
  const before = evaluateStressGrid(config);
  assert.ok(before.passCount < before.caseCount);
  assert.equal(before.negotiation.status, 'feasible');
  close(before.participants[0].requiredShare, 292 / 720);
  const proposal = applyStressProposal(config);
  assert.deepEqual(config, snapshot);
  assert.deepEqual(proposal.deal, config.deal);
  assert.deepEqual(proposal.stress, config.stress);
  close(proposal.participants.reduce((sum, participant) => sum + participant.revenueShare, 0), 1);
  const after = evaluateStressGrid(proposal);
  assert.equal(after.passCount, after.caseCount);
  assert.ok(proposal.participants[0].revenueShare > config.participants[0].revenueShare);
});

test('operational breaches never receive a financial repair proposal', () => {
  for (const field of ['capacity', 'minimumCommitment']) {
    const config = simpleCase();
    config.stress = { ...noStress(), volumeDropPct: 20, volumeGrowthPct: 20 };
    config.participants.forEach((participant) => { participant.minimumAcceptableProfit = 0; });
    config.participants[0][field] = field === 'capacity' ? 110 : 90;
    const result = evaluateStressGrid(config);
    assert.equal(result.negotiation.status, 'operational-breach');
    assert.ok(result.negotiation.operationalFailures.length > 0);
    assert.equal(result.negotiation.proposal, null);
    assert.throws(() => applyStressProposal(config), ValidationError);
  }
});

test('volume changes apply after existing churn and respect addressable volume', () => {
  const config = simpleCase();
  config.deal.monthlyVolume = 1000;
  config.deal.volumeShockPct = 50;
  config.deal.addressableVolume = 400;
  config.stress = { ...noStress(), volumeDropPct: 20, volumeGrowthPct: 100 };
  const result = evaluateStressGrid(config);
  assert.deepEqual(result.scenarios.map((scenario) => scenario.volume), [400, 320, 400]);
  config.deal.volumeShockPct = 100;
  assert.ok(evaluateStressGrid(config).scenarios.every((scenario) => scenario.volume === 0));
});

test('zero settings deduplicate axes and deterministic ties choose the first case', () => {
  const config = simpleCase();
  config.stress = noStress();
  const result = evaluateStressGrid(config);
  assert.equal(result.caseCount, 1);
  assert.equal(result.participants[0].worst.scenarioId, 'case-1');
  assert.deepEqual(result, evaluateStressGrid(structuredClone(config)));
});

test('zero revenue is infeasible only when a participant needs positive revenue', () => {
  const config = simpleCase();
  config.stress = { ...noStress(), feeDropPct: 100 };
  assert.equal(evaluateStressGrid(config).negotiation.status, 'no-revenue');
  for (const participant of config.participants) {
    participant.variableCostPerTransaction = 0;
    participant.minimumAcceptableProfit = 0;
  }
  const result = evaluateStressGrid(config);
  assert.equal(result.negotiation.status, 'feasible');
  assert.equal(result.negotiation.requiredShareTotal, 0);
  assert.equal(result.passCount, result.caseCount);
  assert.deepEqual(applyStressProposal(config).participants, config.participants);
});

test('negative contribution makes growth the worst profit case, not the volume decline', () => {
  const config = simpleCase();
  config.stress = { ...noStress(), volumeDropPct: 50, volumeGrowthPct: 100 };
  config.participants[0].variableCostPerTransaction = 6;
  const result = evaluateStressGrid(config);
  const worst = result.scenarios.find((scenario) => scenario.id === result.participants[0].worst.scenarioId);
  assert.equal(worst.volumeChangePct, 100);
  close(result.participants[0].worst.monthlyProfit, -200);
});

test('stress settings reject malformed, missing, unknown, and out-of-bounds inputs', () => {
  for (const invalid of [null, [], '20', {}, { ...noStress(), injected: 1 }, { ...noStress(), volumeDropPct: -1 },
    { ...noStress(), volumeGrowthPct: 101 }, { ...noStress(), feeDropPct: Infinity },
    { ...noStress(), feeDropPct: '10' }, { ...noStress(), variableCostRisePct: 201 },
    { ...noStress(), volumeDropPct: NaN }]) {
    const config = { ...simpleCase(), stress: invalid };
    assert.equal(validateConfiguration(config).valid, false);
    assert.throws(() => evaluateStressGrid(config), ValidationError);
  }
  const unknown = { ...simpleCase(), scenarios: [] };
  assert.equal(validateConfiguration(unknown).valid, false);
});

test('bounded extreme inputs do not throw or offer an unverified share allocation', () => {
  const config = simpleCase();
  config.deal = { monthlyVolume: MAX_NUMERIC_INPUT, feePerTransaction: MAX_NUMERIC_INPUT,
    addressableVolume: MAX_NUMERIC_INPUT, volumeShockPct: 0 };
  config.stress = { volumeDropPct: 100, volumeGrowthPct: 100, feeDropPct: 100, variableCostRisePct: 200 };
  for (const participant of config.participants) participant.variableCostPerTransaction = MAX_NUMERIC_INPUT;
  const result = evaluateStressGrid(config);
  assert.equal(result.caseCount, 27);
  assert.equal(result.negotiation.proposal, null);
  assert.ok(result.scenarios.every((scenario) => Number.isFinite(scenario.totalProfit)));
  config.deal.feePerTransaction = Number.MIN_VALUE;
  const tiny = evaluateStressGrid(config);
  assert.equal(tiny.negotiation.proposal, null);
  assert.ok(tiny.participants.every((participant) => participant.requiredShare === null));
});

test('generated cases match independent arithmetic and every offered proposal satisfies all tests', () => {
  let seed = 123456789;
  const random = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 2 ** 32; };
  let proposed = 0;
  for (let iteration = 0; iteration < 60; iteration += 1) {
    const config = simpleCase();
    config.participants[0].revenueShare = random();
    config.participants[1].revenueShare = 1 - config.participants[0].revenueShare;
    config.participants.forEach((participant) => {
      participant.variableCostPerTransaction = random() * 3;
      participant.fixedMonthlyCost = random() * 25;
      participant.riskCost = random() * 15;
      participant.minimumAcceptableProfit = random() * 125;
    });
    config.stress = { volumeDropPct: random() * 40, volumeGrowthPct: random() * 40,
      feeDropPct: random() * 25, variableCostRisePct: random() * 40 };
    const result = evaluateStressGrid(config);
    for (const scenario of result.scenarios) {
      const volume = Math.min(100 * (1 + scenario.volumeChangePct / 100), 200);
      const fee = 10 * (1 - scenario.feeDropPct / 100);
      scenario.participants.forEach((tested, index) => {
        const input = config.participants[index];
        const cost = input.variableCostPerTransaction * (1 + scenario.variableCostRisePct / 100);
        const expected = volume * fee * input.revenueShare - volume * cost - input.fixedMonthlyCost - input.riskCost;
        close(tested.monthlyProfit, expected);
        assert.equal(tested.viable, expected >= input.minimumAcceptableProfit - EPSILON);
        if (result.negotiation.proposal) {
          const offered = result.negotiation.proposal[index].revenueShare;
          const profit = volume * fee * offered - volume * cost - input.fixedMonthlyCost - input.riskCost;
          assert.ok(profit >= input.minimumAcceptableProfit - EPSILON);
        }
      });
    }
    if (result.negotiation.proposal) proposed += 1;
  }
  assert.ok(proposed > 0);
});

test('a roundoff-only share excess is rechecked, while a real funding gap remains infeasible', () => {
  const config = {
    deal: { monthlyVolume: 1, feePerTransaction: 0.7, addressableVolume: 1, volumeShockPct: 0 },
    participants: Array.from({ length: 7 }, (_, index) => ({ id: `p${index}`, name: `Participant ${index}`,
      revenueShare: 1 / 7, variableCostPerTransaction: 0.1, fixedMonthlyCost: 0,
      minimumAcceptableProfit: 0, capacity: null, minimumCommitment: 0, riskCost: 0 })),
    stress: noStress(),
  };
  const exactFit = evaluateStressGrid(config);
  assert.equal(exactFit.passCount, 1);
  assert.equal(exactFit.negotiation.requiredShareTotal, 1.0000000000000002);
  assert.equal(exactFit.negotiation.status, 'feasible');
  assert.ok(exactFit.negotiation.proposal);
  const applied = evaluateStressGrid(applyStressProposal(config));
  assert.equal(applied.passCount, applied.caseCount);

  config.participants[0].variableCostPerTransaction += 0.0000001;
  const insufficient = evaluateStressGrid(config);
  assert.equal(insufficient.negotiation.status, 'insufficient-revenue');
  assert.equal(insufficient.negotiation.proposal, null);
  assert.throws(() => applyStressProposal(config), ValidationError);

  config.deal.monthlyVolume = 1e12;
  config.deal.addressableVolume = 1e12;
  config.participants[0].variableCostPerTransaction = 0.100000000000001;
  const recheckFailure = evaluateStressGrid(config);
  assert.equal(recheckFailure.negotiation.status, 'precision-limit');
  assert.equal(recheckFailure.negotiation.proposal, null);
});

test('exact proposal verification catches costs swallowed by large transaction totals', () => {
  const config = {
    deal: { monthlyVolume: 1e15, feePerTransaction: 1e15, addressableVolume: 1e15, volumeShockPct: 0 },
    participants: ['a', 'b'].map((id) => ({ id, name: id, revenueShare: 0.5,
      variableCostPerTransaction: 5e14, fixedMonthlyCost: 0, riskCost: 0, minimumAcceptableProfit: 0 })),
    stress: noStress(),
  };
  // This exact fit is representable. A magnitude-only error bound must not reject it.
  assert.equal(evaluateStressGrid(config).negotiation.status, 'feasible');
  for (const field of ['fixedMonthlyCost', 'riskCost', 'minimumAcceptableProfit']) {
    const hidden = structuredClone(config);
    hidden.participants.forEach((participant) => { participant[field] = 1; });
    const result = evaluateStressGrid(hidden);
    assert.equal(result.negotiation.status, 'precision-limit', field);
    assert.equal(result.negotiation.proposal, null, field);
    assert.throws(() => applyStressProposal(hidden), ValidationError);
  }
  config.participants.forEach((participant) => { participant.fixedMonthlyCost = 1; participant.variableCostPerTransaction = 4e14; });
  assert.equal(evaluateStressGrid(config).negotiation.status, 'feasible');
});

test('exact verification includes shock changes too small for the displayed factor', () => {
  const config = {
    deal: { monthlyVolume: 1e15, feePerTransaction: 1e15, addressableVolume: 1e15, volumeShockPct: 0 },
    participants: ['a', 'b'].map((id) => ({ id, name: id, revenueShare: 0.5,
      variableCostPerTransaction: 5e14, fixedMonthlyCost: 0, riskCost: 0, minimumAcceptableProfit: 0 })),
    stress: { ...noStress(), feeDropPct: 1e-20 },
  };
  assert.equal(1 - config.stress.feeDropPct / 100, 1);
  const result = evaluateStressGrid(config);
  assert.equal(result.negotiation.status, 'precision-limit');
  assert.equal(result.negotiation.proposal, null);
  config.stress = { ...noStress(), variableCostRisePct: 1e-20 };
  assert.equal(evaluateStressGrid(config).negotiation.status, 'precision-limit');
});

test('omitted optional capacity has the same ceiling and stress behavior as null', () => {
  const config = clonePreset('balanced');
  delete config.participants[0].capacity;
  assert.equal(validateConfiguration(config).valid, true);
  assert.equal(calculatePartnership(config).capacityCeiling, 115000);
  const omitted = evaluateStressGrid(config);
  config.participants[0].capacity = null;
  assert.equal(calculatePartnership(config).capacityCeiling, 115000);
  const explicitNull = evaluateStressGrid(config);
  assert.deepEqual(explicitNull.negotiation, omitted.negotiation);
  assert.deepEqual(explicitNull.participants, omitted.participants);
  const operatingTests = (result) => result.scenarios.map((scenario) => scenario.participants.map(({ capacityPass, capacityHeadroom, viable }) => ({ capacityPass, capacityHeadroom, viable })));
  assert.deepEqual(operatingTests(explicitNull), operatingTests(omitted));
});

test('exact checking preserves zero, subnormal, and ordinarily rounded inputs', () => {
  const config = {
    deal: { monthlyVolume: Number.MIN_VALUE, feePerTransaction: 1, addressableVolume: 1, volumeShockPct: 0 },
    participants: ['a', 'b'].map((id) => ({ id, name: id, revenueShare: 0.5,
      variableCostPerTransaction: 0, fixedMonthlyCost: 0, riskCost: 0, minimumAcceptableProfit: 0 })),
    stress: { volumeDropPct: 100, volumeGrowthPct: 100, feeDropPct: 100, variableCostRisePct: 200 },
  };
  assert.equal(evaluateStressGrid(config).negotiation.status, 'feasible');
  config.deal.monthlyVolume = 1;
  config.deal.feePerTransaction = 0.6;
  config.participants.forEach((participant) => { participant.variableCostPerTransaction = 0.3; });
  config.stress = noStress();
  assert.equal(evaluateStressGrid(config).negotiation.status, 'feasible');
});

test('rounded share totals cannot fund insufficient aggregate costs at large values', () => {
  const shares = [0.1, 0.1, 0.8];
  assert.equal(shares.reduce((sum, share) => sum + share, 0), 1);
  // Binary 0.1 is 3602879701896397 / 2^55. These shares total ten times that value.
  assert.ok(10n * 3602879701896397n > 2n ** 55n);
  const config = {
    deal: { monthlyVolume: 1e15, feePerTransaction: 1, addressableVolume: 1e15, volumeShockPct: 0 },
    participants: shares.map((revenueShare, index) => ({ id: `p${index}`, name: `Participant ${index}`,
      revenueShare, variableCostPerTransaction: revenueShare, fixedMonthlyCost: 0, riskCost: 0, minimumAcceptableProfit: 0 })),
    stress: noStress(),
  };
  assert.equal(validateConfiguration(config).valid, true);
  const result = evaluateStressGrid(config);
  assert.equal(result.passCount, 1);
  assert.equal(result.negotiation.requiredShareTotal, 1);
  assert.equal(result.negotiation.status, 'precision-limit');
  assert.equal(result.negotiation.proposal, null);
  assert.throws(() => applyStressProposal(config), ValidationError);
});

test('proposed allocation cannot exceed available revenue even when costs fit', () => {
  const config = {
    deal: { monthlyVolume: 1e15, feePerTransaction: 1, addressableVolume: 1e15, volumeShockPct: 0 },
    participants: [0.1, 0.1, 0.8].map((revenueShare, index) => ({ id: `p${index}`, name: `Participant ${index}`,
      revenueShare, variableCostPerTransaction: 0, fixedMonthlyCost: 0, riskCost: 0, minimumAcceptableProfit: 0 })),
    stress: noStress(),
  };
  const result = evaluateStressGrid(config);
  assert.equal(result.negotiation.requiredShareTotal, 0);
  assert.equal(result.negotiation.status, 'precision-limit');
  assert.equal(result.negotiation.proposal, null);
  config.deal.monthlyVolume = 1;
  assert.equal(evaluateStressGrid(config).negotiation.status, 'feasible');
  const normal = clonePreset('balanced');
  normal.stress = { ...noStress(), volumeDropPct: 5 };
  assert.equal(evaluateStressGrid(normal).negotiation.status, 'feasible');
  assert.equal(evaluateStressGrid(applyStressProposal(normal)).passCount, 2);
});

test('aggregate funding has one absolute tolerance rather than a per-participant allowance', () => {
  const config = {
    deal: { monthlyVolume: 1, feePerTransaction: 1e9, addressableVolume: 1, volumeShockPct: 0 },
    participants: ['a', 'b'].map((id) => ({ id, name: id, revenueShare: 0.5,
      variableCostPerTransaction: 5e8, fixedMonthlyCost: 0.75e-9, riskCost: 0, minimumAcceptableProfit: 0 })),
    stress: noStress(),
  };
  assert.equal(evaluateStressGrid(config).negotiation.status, 'precision-limit');
  assert.equal(evaluateStressGrid(config).negotiation.proposal, null);
  config.participants.forEach((participant) => { participant.fixedMonthlyCost = 0.4e-9; });
  assert.equal(evaluateStressGrid(config).negotiation.status, 'feasible');
});
