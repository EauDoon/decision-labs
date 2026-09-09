import test from 'node:test';
import assert from 'node:assert/strict';
import { analyzePartnershipReview } from '../src/model.js';
import { fixture } from './review-fixture.mjs';
test('Variable-cost allowance: independent synthetic expectations',()=>{assert.deepEqual(analyzePartnershipReview(fixture(),'variable').rows[0].slice(0,4),['A',1,3.8,2.8]);const c=fixture();c.deal.monthlyVolume=0;assert.equal(analyzePartnershipReview(c,'variable').rows[0][2],null);});
