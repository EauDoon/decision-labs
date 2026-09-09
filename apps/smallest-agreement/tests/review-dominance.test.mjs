import test from 'node:test';
import assert from 'node:assert/strict';
import {analyzeAgreementReview} from '../src/model.js';
import {fixture,oracle} from './review-fixture.mjs';
test('Option support and cost dominance: independent fixture oracle',()=>{const c=fixture();c.clauses[0].options.push({id:'worse',label:'Worse',changeCost:3,support:{a:70,b:50}});const row=analyzeAgreementReview(c,'dominance').rows.find(r=>r[1]==='Worse');assert.equal(row[3],'New one');c.clauses[0].lockedOptionId='worse';assert.equal(analyzeAgreementReview(c,'dominance').rows.find(r=>r[1]==='New one')[3],'Excluded by current lock');});
