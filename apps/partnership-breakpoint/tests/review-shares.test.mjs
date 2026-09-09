import test from 'node:test';
import assert from 'node:assert/strict';
import { analyzePartnershipReview } from '../src/model.js';
import { fixture } from './review-fixture.mjs';
test('Revenue-share funding needs: independent synthetic expectations',()=>{const rows=analyzePartnershipReview(fixture(),'shares').rows;assert.equal(rows[0][2],.22);assert.equal(rows[1][2],.36);assert.ok(Math.abs(rows[2][2]-.58)<1e-12);const c=fixture();c.deal.feePerTransaction=0;assert.equal(analyzePartnershipReview(c,'shares').rows[0][2],null);});
