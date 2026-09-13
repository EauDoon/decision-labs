import test from 'node:test';
import assert from 'node:assert/strict';
import { PRESETS } from '../src/model.js';

test('echelon cycling carnival split sits immediately after bottle-hand in PRESETS', () => {
  const keys = Object.keys(PRESETS);
  assert.ok(keys.indexOf('bottleHandCyclingCarnivalSplit') !== -1);
  assert.ok(keys.indexOf('echelonCyclingCarnivalSplit') !== -1);
  assert.equal(keys.indexOf('echelonCyclingCarnivalSplit'), keys.indexOf('bottleHandCyclingCarnivalSplit') + 1);
  assert.equal(keys.indexOf('bottleHandCyclingCarnivalSplit'), keys.indexOf('domestiqueCyclingCarnivalSplit') + 1);
});
