import test from 'node:test';
import assert from 'node:assert/strict';
import { analyzeCartReview } from '../src/model.js';
import { fixture } from './review-fixture.mjs';
test("Shipping exposure and headroom follows a small explicit numerical oracle",()=>{
const s=fixture();s.offers[0].shippingPerBuyer=3;let row=analyzeCartReview(s,'shipping').rows[0];assert.equal(row[2],6);assert.equal(row[3],31);assert.equal(row[4],600/31);assert.equal(row[6],7);
 s.offers[0].fulfillment='pickup';row=analyzeCartReview(s,'shipping').rows[0];assert.equal(row[2],0);assert.equal(row[3],25);
});
