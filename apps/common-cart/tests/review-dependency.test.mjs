import test from 'node:test';
import assert from 'node:assert/strict';
import { analyzeCartReview } from '../src/model.js';
import { fixture } from './review-fixture.mjs';
test("Sole-offer dependency follows a small explicit numerical oracle",()=>{
const s=fixture(); assert.deepEqual(analyzeCartReview(s,'dependency').rows,[['One',1,3],['Two',0,0]]);
 s.offers=[]; assert.deepEqual(analyzeCartReview(s,'dependency').rows,[]);
});
