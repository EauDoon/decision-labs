import test from 'node:test';
import assert from 'node:assert/strict';
import { analyzePartnershipReview } from '../src/model.js';
import { fixture } from './review-fixture.mjs';
test('Constraint slack ledger: independent synthetic expectations',()=>{assert.deepEqual(analyzePartnershipReview(fixture(),'slack').rows,[['A',28,8,10,'Hold'],['B',14,9,5,'Hold']]);const c=fixture();c.participants[0].capacity=null;assert.equal(analyzePartnershipReview(c,'slack').rows[0][3],null);});
