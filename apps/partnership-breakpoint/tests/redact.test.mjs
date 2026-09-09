import test from 'node:test';
import assert from 'node:assert/strict';
import { clonePreset, redactConfiguration, validateConfiguration } from '../src/model.js';

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
