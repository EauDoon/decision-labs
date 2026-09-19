import test from 'node:test';
import assert from 'node:assert/strict';
import { PRESETS } from '../src/model.js';

test('madison cycling carnival split sits immediately after keirin in PRESETS', () => {
  const keys = Object.keys(PRESETS);
  assert.ok(keys.indexOf('keirinCyclingCarnivalSplit') !== -1);
  assert.ok(keys.indexOf('madisonCyclingCarnivalSplit') !== -1);
  assert.equal(keys.indexOf('madisonCyclingCarnivalSplit'), keys.indexOf('keirinCyclingCarnivalSplit') + 1);
});
