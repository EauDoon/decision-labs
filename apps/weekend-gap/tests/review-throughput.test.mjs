import test from 'node:test';
import assert from 'node:assert/strict';
import {analyzeWeekendReview} from '../src/model.js';
import {fixture,oracle} from './review-fixture.mjs';
test('Joint-throughput ladder: independent hourly oracle',()=>{const c=fixture();c.issuerThroughputAudPerHour=1;c.fxDepthAudPerHour=1;c.payoutThroughputAudPerHour=1;for(const row of analyzeWeekendReview(c,'throughput').rows){const expected=oracle({...c,issuerThroughputAudPerHour:row[1],fxDepthAudPerHour:row[2],payoutThroughputAudPerHour:row[3]}).at(-1);assert.equal(row[4],expected.settled);assert.equal(row[6],expected.queue);}assert.deepEqual(analyzeWeekendReview(fixture(),'throughput').rows.map(r=>r[4]),[72,72,72,72]);});
