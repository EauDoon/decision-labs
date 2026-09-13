import test from 'node:test';
import assert from 'node:assert/strict';
import { PRESETS } from '../src/model.js';

test('first-aid cycling carnival split sits immediately after team-sprint in PRESETS', () => {
  const keys = Object.keys(PRESETS);
  assert.ok(keys.indexOf('teamSprintCyclingCarnivalSplit') !== -1);
  assert.ok(keys.indexOf('firstAidCyclingCarnivalSplit') !== -1);
  assert.equal(keys.indexOf('firstAidCyclingCarnivalSplit'), keys.indexOf('teamSprintCyclingCarnivalSplit') + 1);
  assert.equal(keys.indexOf('teamSprintCyclingCarnivalSplit'), keys.indexOf('teamPursuitCyclingCarnivalSplit') + 1);
});
