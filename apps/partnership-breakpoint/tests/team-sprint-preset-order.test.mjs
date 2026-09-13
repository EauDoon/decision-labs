import test from 'node:test';
import assert from 'node:assert/strict';
import { PRESETS } from '../src/model.js';

test('team-sprint cycling carnival split sits immediately after team-pursuit in PRESETS', () => {
  const keys = Object.keys(PRESETS);
  assert.ok(keys.indexOf('teamPursuitCyclingCarnivalSplit') !== -1);
  assert.ok(keys.indexOf('teamSprintCyclingCarnivalSplit') !== -1);
  assert.equal(keys.indexOf('teamSprintCyclingCarnivalSplit'), keys.indexOf('teamPursuitCyclingCarnivalSplit') + 1);
  assert.equal(keys.indexOf('teamPursuitCyclingCarnivalSplit'), keys.indexOf('individualPursuitCyclingCarnivalSplit') + 1);
});
