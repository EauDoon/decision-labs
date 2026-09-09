import test from 'node:test';
import assert from 'node:assert/strict';
import {analyzeAgreementReview} from '../src/model.js';
import {fixture,oracle} from './review-fixture.mjs';
test('Single-clause substitutions: independent fixture oracle',()=>{assert.deepEqual(analyzeAgreementReview(fixture(),'substitutions').rows.filter(r=>!r[1].startsWith('Unused')),[['One','Original one',45,-15,0,'Does not pass'],['Two','New two',75,15,5,'Pass']]);});
