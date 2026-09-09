import test from 'node:test';
import assert from 'node:assert/strict';
import {analyzeWeekendReview} from '../src/model.js';
import {fixture,oracle} from './review-fixture.mjs';
test('Operating-window overlap: independent hourly oracle',()=>{const c=fixture();c.bankOpenStartHour=8;c.bankOpenEndHour=17;c.payoutOpenStartHour=12;c.payoutOpenEndHour=16;assert.deepEqual(analyzeWeekendReview(c,'overlap').rows,[['issuer',24,4,20],['bank',9,4,5],['payout',4,4,0]]);});
