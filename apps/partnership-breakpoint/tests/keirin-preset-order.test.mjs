import test from 'node:test';
import assert from 'node:assert/strict';
import { PRESETS } from '../src/model.js';

test('keirin cycling carnival split sits immediately after hill-climb in PRESETS', () => {
  const keys = Object.keys(PRESETS);
  assert.ok(keys.indexOf('hillClimbCyclingCarnivalSplit') !== -1);
  assert.ok(keys.indexOf('keirinCyclingCarnivalSplit') !== -1);
  assert.equal(keys.indexOf('keirinCyclingCarnivalSplit'), keys.indexOf('hillClimbCyclingCarnivalSplit') + 1);
});
