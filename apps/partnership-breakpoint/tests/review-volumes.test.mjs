import test from 'node:test';
import assert from 'node:assert/strict';
import { analyzePartnershipReview } from '../src/model.js';
import { fixture } from './review-fixture.mjs';
test('Effective-volume scenarios: independent synthetic expectations',()=>{const c=fixture();c.deal.volumeShockPct=50;const rows=analyzePartnershipReview(c,'volumes').rows;assert.equal(rows.length,10);for(const row of rows){const p=c.participants.find(p=>p.name===row[2]);assert.equal(row[3],row[1]*(10*p.revenueShare-p.variableCostPerTransaction)-p.fixedMonthlyCost-p.riskCost);}assert.match(rows.at(-1)[4],/exceeds capacity/);});
