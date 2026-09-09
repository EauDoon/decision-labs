import test from 'node:test';
import assert from 'node:assert/strict';
import {analyzeWeekendReview} from '../src/model.js';
import {fixture,oracle} from './review-fixture.mjs';
test('Queue exposure by day: independent hourly oracle',()=>{assert.deepEqual(analyzeWeekendReview(fixture(),'days').rows,[['Friday',9,9,9,0,0],['Saturday',24,24,0,300,24],['Sunday',24,24,0,876,48],['Monday',15,15,63,0,0]]);});
