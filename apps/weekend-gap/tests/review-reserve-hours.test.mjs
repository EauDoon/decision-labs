import test from 'node:test';
import assert from 'node:assert/strict';
import {analyzeWeekendReview} from '../src/model.js';
import {fixture,oracle} from './review-fixture.mjs';
test('Hourly effect of extra reserve: independent hourly oracle',()=>{const c=fixture();c.reserveCashAud=10;const base=oracle(c),other=oracle({...c,reserveCashAud:11});for(const row of analyzeWeekendReview(c,'reserve-hours').rows){const i=row[0]-1;assert.ok(row[3]>=-1e-10);assert.equal(row[1],base[i].paid);assert.equal(row[2],other[i].paid);assert.equal(row[4],other[i].settled-base[i].settled);}assert.equal(analyzeWeekendReview(c,'reserve-hours').rows.at(-1)[4],1);});
