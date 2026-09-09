import test from 'node:test';
import assert from 'node:assert/strict';
import {analyzeWeekendReview} from '../src/model.js';
import {fixture,oracle} from './review-fixture.mjs';
test('Complete-chain closure spells: independent hourly oracle',()=>{assert.deepEqual(analyzeWeekendReview(fixture(),'closures').rows,[[9,57,48,0,48,48]]);const c=fixture();c.mondayHoliday=true;assert.deepEqual(analyzeWeekendReview(c,'closures').rows,[[9,72,63,0,63,63]]);});
