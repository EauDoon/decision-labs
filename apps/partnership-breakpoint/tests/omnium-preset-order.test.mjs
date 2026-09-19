import test from 'node:test';
import assert from 'node:assert/strict';
import { PRESETS } from '../src/model.js';

test('omnium cycling carnival split sits immediately after madison in PRESETS', () => {
  const keys = Object.keys(PRESETS);
  assert.ok(keys.indexOf('madisonCyclingCarnivalSplit') !== -1);
  assert.ok(keys.indexOf('omniumCyclingCarnivalSplit') !== -1);
  assert.equal(keys.indexOf('omniumCyclingCarnivalSplit'), keys.indexOf('madisonCyclingCarnivalSplit') + 1);
});
