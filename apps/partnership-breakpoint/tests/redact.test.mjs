import test from 'node:test';
import assert from 'node:assert/strict';
import { ValidationError, clonePreset, redactConfiguration, validateConfiguration } from '../src/model.js';

test('redactConfiguration replaces names, clears the deal title and notes, and keeps economics', () => {
  const config = clonePreset('balanced');
  config.deal.title = 'Confidential JV';
  config.deal.notes = 'Do not circulate the counterparty list.';
  config.deal.currency = 'USD';
  config.stress = { volumeDropPct: 5, volumeGrowthPct: 0, feeDropPct: 0, variableCostRisePct: 0 };
  const originalNames = config.participants.map((item) => item.name);
  const originalIds = config.participants.map((item) => item.id);
  const originalShares = config.participants.map((item) => item.revenueShare);
  const redacted = redactConfiguration(config);
  assert.equal(Object.hasOwn(redacted.deal, 'title'), false);
  assert.equal(Object.hasOwn(redacted.deal, 'notes'), false);
  assert.equal(redacted.deal.currency, 'USD');
  assert.deepEqual(redacted.participants.map((item) => item.name), ['Participant 1', 'Participant 2', 'Participant 3']);
  assert.deepEqual(redacted.participants.map((item) => item.id), originalIds);
  assert.deepEqual(redacted.participants.map((item) => item.revenueShare), originalShares);
  assert.equal(redacted.deal.monthlyVolume, config.deal.monthlyVolume);
  assert.deepEqual(redacted.stress, config.stress);
  assert.equal(validateConfiguration(redacted).valid, true);
  assert.deepEqual(config.participants.map((item) => item.name), originalNames);
  assert.equal(config.deal.title, 'Confidential JV');
  assert.equal(config.deal.notes, 'Do not circulate the counterparty list.');
});

test('redacted cases preserve independent commercial plans, alternatives, and display preferences', () => {
  const config = clonePreset('balanced');
  config.deal.title = 'Synthetic private deal';
  config.deal.notes = 'Synthetic private notes';
  config.participants[0].name = 'Synthetic private participant';
  config.plan = {
    startingCash: 1200, collectionLagPeriods: 1, paymentLagPeriods: 0,
    periods: [{ volume: 90000, feePerTransaction: 0.21, setupExpense: 500,
      participants: { platform: { fixedMonthlyCost: 2000, capacity: null } } }],
  };
  config.alternatives = {
    feeLevels: [0.2, 0.22], shareModes: ['current', 'equal'], commitmentRelief: true,
    capacityInvestments: [{ participantId: 'platform', addedCapacity: 10000, investmentCost: 400 }],
    objective: 'profit',
  };
  config.hideHoldingParticipants = true;
  config.collapseAllHoldCases = false;
  const original = JSON.parse(JSON.stringify(config));
  const expected = JSON.parse(JSON.stringify(config));
  delete expected.deal.title;
  delete expected.deal.notes;
  expected.participants.forEach((participant, index) => { participant.name = `Participant ${index + 1}`; });
  const redacted = redactConfiguration(config);
  assert.deepEqual(redacted, expected);
  assert.equal(validateConfiguration(JSON.parse(JSON.stringify(redacted))).valid, true);
  assert.doesNotMatch(JSON.stringify(redacted), /Synthetic private/);
  redacted.plan.periods[0].participants.platform.fixedMonthlyCost = 0;
  redacted.alternatives.capacityInvestments[0].investmentCost = 0;
  redacted.alternatives.feeLevels[0] = 0;
  assert.deepEqual(config, original);

  for (const extension of ['plan', 'alternatives']) {
    const malformed = JSON.parse(JSON.stringify(config));
    malformed[extension].notes = 'Synthetic private extension notes';
    assert.throws(() => redactConfiguration(malformed), ValidationError);
  }
});
