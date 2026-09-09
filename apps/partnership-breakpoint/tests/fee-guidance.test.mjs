import assert from 'node:assert/strict';
import test from 'node:test';
import { calculateFeeRequirements, calculatePartnership, clonePreset } from '../src/model.js';

test('fee floor matches independent participant arithmetic and satisfies profit with positive headroom', () => {
 const config = clonePreset('balanced');
 const guide = calculateFeeRequirements(config);
 const expected = Math.max(...config.participants.map((p) => (100000 * p.variableCostPerTransaction + p.fixedMonthlyCost + p.riskCost + p.minimumAcceptableProfit) / (100000 * p.revenueShare)));
 assert.equal(guide.requiredFee, expected);
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
