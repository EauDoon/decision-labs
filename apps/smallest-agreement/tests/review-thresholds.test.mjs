import test from 'node:test';
import assert from 'node:assert/strict';
import {analyzeAgreementReview} from '../src/model.js';
import {fixture,oracle} from './review-fixture.mjs';
test('Threshold scenarios: independent fixture oracle',()=>{const c=fixture();for(const row of analyzeAgreementReview(c,'thresholds').rows){const expected=oracle({...c,threshold:row[0]});assert.equal(row[2],expected?.cost??null);assert.equal(row[3],expected?.approval??null);}});
