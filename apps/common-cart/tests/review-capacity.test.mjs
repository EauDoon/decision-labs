import test from 'node:test';
import assert from 'node:assert/strict';
import { analyzeCartReview } from '../src/model.js';
import { fixture } from './review-fixture.mjs';
test("Capacity increase previews follows a small explicit numerical oracle",()=>{
const s=fixture();const row=analyzeCartReview(s,'capacity').rows.find(r=>r[0]==='Two');assert.deepEqual(row,['Two',2,3,2,3,1]);
 s.offers[0].capacity=5000;assert.ok(analyzeCartReview(s,'capacity').rows.every(r=>r[0]!=='One'));
});
