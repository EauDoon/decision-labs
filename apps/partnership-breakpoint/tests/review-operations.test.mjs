import test from 'node:test';
import assert from 'node:assert/strict';
import { analyzePartnershipReview } from '../src/model.js';
import { fixture } from './review-fixture.mjs';
test('Commitment and capacity conflicts: independent synthetic expectations',()=>{const c=fixture();c.participants[0].minimumCommitment=18;const rows=analyzePartnershipReview(c,'operations').rows;assert.deepEqual(rows.at(-1),['Shared operational interval',18,15,30,-3]);assert.equal(rows[1][4],-3);});
