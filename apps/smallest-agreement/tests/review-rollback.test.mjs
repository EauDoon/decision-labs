import test from 'node:test';
import assert from 'node:assert/strict';
import {analyzeAgreementReview} from '../src/model.js';
import {fixture,oracle} from './review-fixture.mjs';
test('Rollback contribution: independent fixture oracle',()=>{assert.deepEqual(analyzeAgreementReview(fixture(),'rollback').rows,[['One','New one',15,2,45,'Does not pass']]);});
