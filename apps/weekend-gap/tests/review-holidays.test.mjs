import test from 'node:test';
import assert from 'node:assert/strict';
import {analyzeWeekendReview} from '../src/model.js';
import {fixture,oracle} from './review-fixture.mjs';
test('Holiday assumption comparison: independent hourly oracle',()=>{assert.deepEqual(analyzeWeekendReview(fixture(),'holidays').rows,[['No','No',72,0,0],['No','Yes',9,-63,63],['Yes','No',72,0,0],['Yes','Yes',9,-63,63]]);});
