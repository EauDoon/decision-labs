import test from 'node:test';
import assert from 'node:assert/strict';
import {analyzeAgreementReview} from '../src/model.js';
import {fixture,oracle} from './review-fixture.mjs';
test('Targeted support uncertainty: independent fixture oracle',()=>{const c=fixture();const row=analyzeAgreementReview(c,'uncertainty').rows[0];assert.deepEqual(row.slice(0,3),['A',5,60]);assert.ok(Math.abs(row[3]-57.5)<1e-10);assert.ok(Math.abs(row[4]+2.5)<1e-10);assert.equal(row[5],'Does not pass');assert.equal(analyzeAgreementReview(c,'uncertainty').rows.length,6);});
