import test from 'node:test';
import assert from 'node:assert/strict';
import { PRESETS } from '../src/model.js';

test('hill-climb cycling carnival split sits immediately after time-trial in PRESETS', () => {
  const keys = Object.keys(PRESETS);
  assert.ok(keys.indexOf('timeTrialCyclingCarnivalSplit') !== -1);
  assert.ok(keys.indexOf('hillClimbCyclingCarnivalSplit') !== -1);
  assert.equal(keys.indexOf('hillClimbCyclingCarnivalSplit'), keys.indexOf('timeTrialCyclingCarnivalSplit') + 1);
});
