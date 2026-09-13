import test from 'node:test';
import assert from 'node:assert/strict';
import { PRESETS } from '../src/model.js';

test('bottle-hand cycling carnival split sits immediately after domestique in PRESETS', () => {
  const keys = Object.keys(PRESETS);
  assert.ok(keys.indexOf('domestiqueCyclingCarnivalSplit') !== -1);
  assert.ok(keys.indexOf('bottleHandCyclingCarnivalSplit') !== -1);
  assert.equal(keys.indexOf('bottleHandCyclingCarnivalSplit'), keys.indexOf('domestiqueCyclingCarnivalSplit') + 1);
  assert.equal(keys.indexOf('domestiqueCyclingCarnivalSplit'), keys.indexOf('soigneurCyclingCarnivalSplit') + 1);
});
