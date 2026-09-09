import test from 'node:test';
import assert from 'node:assert/strict';
import { clonePreset, compareThreeSnapshots, dropAndReallocate, validateConfiguration } from '../src/model.js';

test('compareThreeSnapshots reports profit and hold status for matching rosters', () => {
  const current = clonePreset('balanced');
  const first = clonePreset('balanced');
  const second = clonePreset('balanced');
  second.participants[0].fixedMonthlyCost = 1900;
  const compared = compareThreeSnapshots(current, first, second);
  assert.equal(compared.sameRoster, true);
  assert.equal(compared.rows.length, 3);
  const platform = compared.rows.find((row) => row.id === 'platform');
  assert.equal(platform.rosterMismatch, false);
  assert.equal(platform.first.viable, true);
  assert.equal(platform.second.viable, true);
  assert.equal(platform.current.monthlyProfit, platform.first.monthlyProfit);
  assert.equal(platform.second.monthlyProfit, platform.first.monthlyProfit - 100);
  assert.equal(compared.currentViable, true);
});

test('compareThreeSnapshots flags different participant sets instead of inventing rows', () => {
  const current = clonePreset('balanced');
  const first = clonePreset('balanced');
  const second = clonePreset('creatorTakeRate');
  const compared = compareThreeSnapshots(current, first, second);
  assert.equal(compared.sameRoster, false);
  const creator = compared.rows.find((row) => row.id === 'creator');
  assert.equal(creator.rosterMismatch, true);
  assert.equal(creator.first, null);
  assert.equal(creator.current, null);
  assert.equal(creator.second.id, 'creator');
  const platform = compared.rows.find((row) => row.id === 'platform');
  assert.equal(platform.rosterMismatch, false);
  assert.ok(platform.first);
  assert.ok(platform.current);
  assert.ok(platform.second);
  const distributor = compared.rows.find((row) => row.id === 'distributor');
  assert.equal(distributor.rosterMismatch, true);
  assert.equal(distributor.second, null);

  const dropped = { ...clonePreset('balanced'), participants: dropAndReallocate(clonePreset('balanced').participants, 2) };
  assert.equal(validateConfiguration(dropped).valid, true);
  const vsDropped = compareThreeSnapshots(current, first, dropped);
  assert.equal(vsDropped.sameRoster, false);
  const liquidity = vsDropped.rows.find((row) => row.id === 'liquidity-partner');
  assert.equal(liquidity.second, null);
  assert.equal(liquidity.rosterMismatch, true);
});
