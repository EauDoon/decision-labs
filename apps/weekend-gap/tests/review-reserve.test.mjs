import test from 'node:test';
import assert from 'node:assert/strict';
import {analyzeWeekendReview} from '../src/model.js';
import {fixture,oracle} from './review-fixture.mjs';
test('Reserve needed by service target: independent hourly oracle',()=>{const c=fixture();for(const row of analyzeWeekendReview(c,'reserve').rows){const target=72*row[0]/100;const feasibleCents=Array.from({length:7201},(_,cents)=>cents).find(cents=>cents/100>=target);assert.equal(row[3],feasibleCents/100);}c.mondayHoliday=true;assert.ok(analyzeWeekendReview(c,'reserve').rows.every(r=>r[2]==='unreachable'&&r[3]===null));});
