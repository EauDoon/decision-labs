import test from 'node:test';
import assert from 'node:assert/strict';
import { PRESETS } from '../src/model.js';

test('domestique cycling carnival split sits immediately after soigneur in PRESETS', () => {
  const keys = Object.keys(PRESETS);
  assert.ok(keys.indexOf('soigneurCyclingCarnivalSplit') !== -1);
  assert.ok(keys.indexOf('domestiqueCyclingCarnivalSplit') !== -1);
  assert.equal(keys.indexOf('domestiqueCyclingCarnivalSplit'), keys.indexOf('soigneurCyclingCarnivalSplit') + 1);
  assert.equal(keys.indexOf('soigneurCyclingCarnivalSplit'), keys.indexOf('leadOutCyclingCarnivalSplit') + 1);
});
