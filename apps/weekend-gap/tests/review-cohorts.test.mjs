import test from 'node:test';
import assert from 'node:assert/strict';
import {analyzeWeekendReview} from '../src/model.js';
import {fixture,oracle} from './review-fixture.mjs';
test('Arrival-cohort waiting ledger: independent hourly oracle',()=>{const rows=analyzeWeekendReview(fixture(),'cohorts').rows;assert.equal(rows.length,72);assert.deepEqual(rows[9],[9,1,1,0,48,0]);assert.deepEqual(rows[56],[56,1,1,0,1,0]);assert.equal(rows.reduce((s,r)=>s+r[2]*r[4]+r[5],0),1176);const c=fixture();c.reserveCashAud=0;const r=analyzeWeekendReview(c,'cohorts').rows;assert.deepEqual(r[0],[0,1,0,1,null,72]);assert.equal(r.reduce((s,v)=>s+v[5],0),72*73/2);});
