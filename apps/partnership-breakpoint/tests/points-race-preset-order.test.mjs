import test from 'node:test';
import assert from 'node:assert/strict';
import { PRESETS } from '../src/model.js';

test('points-race cycling carnival split sits immediately after omnium in PRESETS', () => {
  const keys = Object.keys(PRESETS);
  assert.ok(keys.indexOf('omniumCyclingCarnivalSplit') !== -1);
  assert.ok(keys.indexOf('pointsRaceCyclingCarnivalSplit') !== -1);
  assert.equal(keys.indexOf('pointsRaceCyclingCarnivalSplit'), keys.indexOf('omniumCyclingCarnivalSplit') + 1);
});
