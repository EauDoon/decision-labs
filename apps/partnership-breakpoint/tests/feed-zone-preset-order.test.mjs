import test from 'node:test';
import assert from 'node:assert/strict';
import { PRESETS } from '../src/model.js';

test('feed-zone cycling carnival split sits immediately after first-aid in PRESETS', () => {
  const keys = Object.keys(PRESETS);
  assert.ok(keys.indexOf('firstAidCyclingCarnivalSplit') !== -1);
  assert.ok(keys.indexOf('feedZoneCyclingCarnivalSplit') !== -1);
  assert.equal(keys.indexOf('feedZoneCyclingCarnivalSplit'), keys.indexOf('firstAidCyclingCarnivalSplit') + 1);
  assert.equal(keys.indexOf('firstAidCyclingCarnivalSplit'), keys.indexOf('teamSprintCyclingCarnivalSplit') + 1);
});
