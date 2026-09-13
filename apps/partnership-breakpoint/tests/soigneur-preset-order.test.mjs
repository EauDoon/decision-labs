import test from 'node:test';
import assert from 'node:assert/strict';
import { PRESETS } from '../src/model.js';

test('soigneur cycling carnival split sits immediately after lead-out in PRESETS', () => {
  const keys = Object.keys(PRESETS);
  assert.ok(keys.indexOf('leadOutCyclingCarnivalSplit') !== -1);
  assert.ok(keys.indexOf('soigneurCyclingCarnivalSplit') !== -1);
  assert.equal(keys.indexOf('soigneurCyclingCarnivalSplit'), keys.indexOf('leadOutCyclingCarnivalSplit') + 1);
  assert.equal(keys.indexOf('leadOutCyclingCarnivalSplit'), keys.indexOf('feedZoneCyclingCarnivalSplit') + 1);
});
