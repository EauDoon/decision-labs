import test from 'node:test';
import assert from 'node:assert/strict';
import { analyzePartnershipReview } from '../src/model.js';
import { fixture } from './review-fixture.mjs';
test('Fixed-cost allowance: independent synthetic expectations',()=>{const c=fixture();const rows=analyzePartnershipReview(c,'fixed').rows;assert.deepEqual(rows[0].slice(0,4),['A',8,36,28]);for(const [i,row] of rows.entries()){const p=c.participants[i];for(let cost=0;cost<=50;cost++)assert.equal(cost<=row[2],10*10*p.revenueShare-10*p.variableCostPerTransaction-cost-p.riskCost>=p.minimumAcceptableProfit);}});
