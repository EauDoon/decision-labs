import test from 'node:test';
import assert from 'node:assert/strict';
import {analyzeAgreementReview} from '../src/model.js';
import {fixture,oracle} from './review-fixture.mjs';
test('Single-lock opportunity cost: independent fixture oracle',()=>{const c=fixture();c.clauses[0].lockedOptionId='o1';const row=analyzeAgreementReview(c,'locks').rows[0];assert.equal(row[3],2);assert.equal(row[4],1);assert.equal(row[5],'n1, o2');});
