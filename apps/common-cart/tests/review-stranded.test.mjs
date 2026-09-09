import test from 'node:test';
import assert from 'node:assert/strict';
import { analyzeCartReview } from '../src/model.js';
import { fixture } from './review-fixture.mjs';
test("Unserved buyer reasons follows a small explicit numerical oracle",()=>{
const s=fixture();s.buyers[1].maxUnitPrice=1;assert.deepEqual(analyzeCartReview(s,'stranded').rows,[['B',3,'price: 2']]);
 s.offers=[];assert.equal(analyzeCartReview(s,'stranded').rows.length,2);
});
