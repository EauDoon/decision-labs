import test from 'node:test';
import assert from 'node:assert/strict';
import { analyzeCartReview } from '../src/model.js';
import { fixture } from './review-fixture.mjs';
test("Same-cohort offer alternatives follows a small explicit numerical oracle",()=>{
const s=fixture();s.offers.push({...s.offers[0],id:'Three',merchant:'Three',unitPrice:6});
 const rows=analyzeCartReview(s,'frontier').rows;assert.equal(rows[2][4],'One');assert.equal(rows[1][4],'None on these measures');
 s.offers[2].unitPrice=5;assert.equal(analyzeCartReview(s,'frontier').rows[2][4],'None on these measures');
});
