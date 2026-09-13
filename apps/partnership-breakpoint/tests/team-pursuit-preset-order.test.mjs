import test from 'node:test';
import assert from 'node:assert/strict';
import { PRESETS } from '../src/model.js';

test('team-pursuit cycling carnival split sits immediately after individual-pursuit in PRESETS', () => {
  const keys = Object.keys(PRESETS);
  assert.ok(keys.indexOf('individualPursuitCyclingCarnivalSplit') !== -1);
  assert.ok(keys.indexOf('teamPursuitCyclingCarnivalSplit') !== -1);
  assert.equal(keys.indexOf('teamPursuitCyclingCarnivalSplit'), keys.indexOf('individualPursuitCyclingCarnivalSplit') + 1);
  assert.equal(keys.indexOf('individualPursuitCyclingCarnivalSplit'), keys.indexOf('scratchCyclingCarnivalSplit') + 1);
});
