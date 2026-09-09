import test from 'node:test';
import assert from 'node:assert/strict';
import { analyzeCartReview } from '../src/model.js';
import { fixture } from './review-fixture.mjs';
test("Winner withdrawal stress follows a small explicit numerical oracle",()=>{
const s=fixture();s.offers=s.offers.slice(0,1);s.offers[0].minimumUnits=5;
 assert.deepEqual(analyzeCartReview(s,'withdrawal').rows,[['A',2,3,0,3],['B',3,2,0,2]]);
 s.offers[0].minimumUnits=1;assert.deepEqual(analyzeCartReview(s,'withdrawal').rows.map(r=>r[4]),[0,0]);
});
