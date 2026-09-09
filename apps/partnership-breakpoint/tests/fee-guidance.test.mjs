import assert from 'node:assert/strict';
import test from 'node:test';
import { calculateFeeRequirements, calculatePartnership, clonePreset, solveFeeForAllHold } from '../src/model.js';

test('fee floor matches independent participant arithmetic and satisfies profit with positive headroom', () => {
 const config = clonePreset('balanced');
 const guide = calculateFeeRequirements(config);
 const expected = Math.max(...config.participants.map((p) => (100000 * p.variableCostPerTransaction + p.fixedMonthlyCost + p.riskCost + p.minimumAcceptableProfit) / (100000 * p.revenueShare)));
 assert.ok(Math.abs(guide.requiredFee - expected) < 1e-15);
 config.deal.feePerTransaction = expected * (1 + 1e-12);
 assert.ok(calculatePartnership(config).viable);
});
test('zero shares, zero volume and operational failures are not represented as fee repairs', () => {
 const config = clonePreset('balanced');
 config.participants[0].revenueShare = 0; config.participants[1].revenueShare = 0.75;
 assert.equal(calculateFeeRequirements(config).requiredFee, null);
 config.deal.monthlyVolume = 0;
 assert.equal(calculateFeeRequirements(config).requiredFee, null);
 const capacity = clonePreset('balanced'); capacity.participants[0].capacity = 0;
 assert.equal(calculateFeeRequirements(capacity).operationallyFeasible, false);
 assert.deepEqual(calculateFeeRequirements(capacity).participants[0].operationalFailures, ['capacity']);
});

test('subnormal volume does not underflow a positive variable-cost fee floor to zero', () => {
 const config = clonePreset('balanced'); config.deal.monthlyVolume = Number.MIN_VALUE;
 config.participants.forEach((p) => { p.fixedMonthlyCost = 0; p.riskCost = 0; p.minimumAcceptableProfit = 0; p.minimumCommitment = 0; });
 const guide = calculateFeeRequirements(config);
 assert.ok(guide.requiredFee > 0);
 assert.equal(guide.participants[0].requiredFee, config.participants[0].variableCostPerTransaction / config.participants[0].revenueShare);
});

test('fee-to-hold solver matches the diagnostic floor and reports operational impossibility', () => {
  const config = clonePreset('balanced');
  const solved = solveFeeForAllHold(config);
  assert.equal(solved.status, 'possible');
  assert.equal(solved.fee, calculateFeeRequirements(config).requiredFee);
  const applied = { ...config, deal: { ...config.deal, feePerTransaction: solved.fee } };
  assert.equal(calculatePartnership(applied).viable, true);
  const slightlyBelow = { ...config, deal: { ...config.deal, feePerTransaction: solved.fee * 0.99 } };
  assert.equal(calculatePartnership(slightlyBelow).viable, false);

  const blocked = clonePreset('balanced');
  blocked.participants[0].capacity = 1;
  const impossible = solveFeeForAllHold(blocked);
  assert.equal(impossible.status, 'impossible');
  assert.equal(impossible.fee, null);
  assert.match(impossible.reason, /Capacity or commitment/);
});
