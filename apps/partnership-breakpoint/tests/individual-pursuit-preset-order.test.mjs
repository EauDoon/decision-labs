import test from 'node:test';
import assert from 'node:assert/strict';
import { PRESETS } from '../src/model.js';

test('individual-pursuit cycling carnival split sits immediately after scratch in PRESETS', () => {
  const keys = Object.keys(PRESETS);
  assert.ok(keys.indexOf('scratchCyclingCarnivalSplit') !== -1);
  assert.ok(keys.indexOf('individualPursuitCyclingCarnivalSplit') !== -1);
  assert.equal(keys.indexOf('individualPursuitCyclingCarnivalSplit'), keys.indexOf('scratchCyclingCarnivalSplit') + 1);
  assert.equal(keys.indexOf('scratchCyclingCarnivalSplit'), keys.indexOf('pointsRaceCyclingCarnivalSplit') + 1);
});
