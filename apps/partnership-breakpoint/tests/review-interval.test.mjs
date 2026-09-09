import test from 'node:test';
import assert from 'node:assert/strict';
import { analyzePartnershipReview } from '../src/model.js';
import { fixture } from './review-fixture.mjs';
test('Feasible effective volume interval: independent synthetic expectations',()=>{
 const config=fixture();const row=analyzePartnershipReview(config,'interval').rows[0];assert.deepEqual(row.slice(0,3),[3,15,'Feasible']);
 for(let volume=0;volume<=30;volume++){
  const oracle=config.participants.every(p=>volume*10*p.revenueShare-volume*p.variableCostPerTransaction-p.fixedMonthlyCost-p.riskCost>=p.minimumAcceptableProfit&&volume>=(p.minimumCommitment??0)&&volume<=(p.capacity??Infinity));
  assert.equal(volume>=row[0]&&volume<=row[1],oracle);
 }
 config.participants[0].variableCostPerTransaction=6;config.participants[0].fixedMonthlyCost=0;config.participants[0].minimumAcceptableProfit=0;config.participants[0].minimumCommitment=0;
 assert.equal(analyzePartnershipReview(config,'interval').rows[0][2],'Empty');
});
