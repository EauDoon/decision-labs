import test from 'node:test';
import assert from 'node:assert/strict';
import {analyzeAgreementReview} from '../src/model.js';
import {fixture,oracle} from './review-fixture.mjs';
test('Approval margin: independent fixture oracle',()=>{assert.deepEqual(analyzeAgreementReview(fixture(),'margin').rows[0],['Recommended package',60,60,0,2,'Met']);const c=fixture();c.threshold=100;assert.equal(analyzeAgreementReview(c,'margin').rows[0][0],'Original package (infeasible)');});
