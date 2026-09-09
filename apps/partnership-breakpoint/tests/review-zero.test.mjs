import test from 'node:test';
import assert from 'node:assert/strict';
import { analyzePartnershipReview } from '../src/model.js';
import { fixture } from './review-fixture.mjs';
test('Zero-volume obligations: independent synthetic expectations',()=>{const rows=analyzePartnershipReview(fixture(),'zero').rows;assert.deepEqual(rows[0].slice(0,5),['A',8,-8,12,2]);assert.deepEqual(rows[1].slice(0,5),['B',4,-4,6,1]);});
