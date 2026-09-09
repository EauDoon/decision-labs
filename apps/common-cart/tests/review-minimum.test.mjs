import test from 'node:test';
import assert from 'node:assert/strict';
import { analyzeCartReview } from '../src/model.js';
import { fixture } from './review-fixture.mjs';
test("Minimum-order relaxation preview follows a small explicit numerical oracle",()=>{
const s=fixture();s.offers[0].minimumUnits=6;assert.deepEqual(analyzeCartReview(s,'minimum').rows[0],['One',6,1,0,5,2]);
 const before=JSON.stringify(s);analyzeCartReview(s,'minimum');assert.equal(JSON.stringify(s),before);
});
