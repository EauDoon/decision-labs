import test from 'node:test';
import assert from 'node:assert/strict';
import {analyzeAgreementReview} from '../src/model.js';
import {fixture,oracle} from './review-fixture.mjs';
test('Group floor and veto slack: independent fixture oracle',()=>{const c=fixture();c.groups[1].minSupport=50;assert.deepEqual(analyzeAgreementReview(c,'floors').rows,[['A',65,null,null,null,null],['B',55,50,5,null,null]]);c.groups[1].veto=true;const r=analyzeAgreementReview(c,'floors').rows[1];assert.equal(r[4],60);assert.equal(r[5],5);});
