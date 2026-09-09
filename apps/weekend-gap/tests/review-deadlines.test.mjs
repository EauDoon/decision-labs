import test from 'node:test';
import assert from 'node:assert/strict';
import {analyzeWeekendReview} from '../src/model.js';
import {fixture,oracle} from './review-fixture.mjs';
test('Settlement checkpoints: independent hourly oracle',()=>{const c=fixture(),expected=oracle(c);for(const row of analyzeWeekendReview(c,'deadlines').rows){const p=expected[row[0]-1];assert.equal(row[1],row[0]);assert.equal(row[2],p.settled);assert.equal(row[3],p.queue);}assert.deepEqual(analyzeWeekendReview({...c,redemptionDemandAud:0},'deadlines').rows[0].slice(4),[null,null]);});
