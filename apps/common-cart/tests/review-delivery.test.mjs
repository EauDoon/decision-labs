import test from 'node:test';
import assert from 'node:assert/strict';
import { analyzeCartReview } from '../src/model.js';
import { fixture } from './review-fixture.mjs';
test("Delivery slack by included order follows a small explicit numerical oracle",()=>{
const s=fixture();s.buyers[1].latestDeliveryDays=2;
 assert.deepEqual(analyzeCartReview(s,'delivery').rows,[['One','A',2,2,5,3],['One','B',3,2,2,0],['Two','A',2,2,5,3]]);
});
