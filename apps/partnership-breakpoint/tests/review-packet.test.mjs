import test from 'node:test';
import assert from 'node:assert/strict';
import {PARTNERSHIP_REVIEW_TOOLS,createPartnershipReviewPacket,replayPartnershipReviewPacket,analyzePartnershipReview} from '../src/model.js';
import {fixture} from './review-fixture.mjs';
test('review packets bind all inputs and every recomputed primitive without mutating the case',()=>{
 const config=fixture(),before=structuredClone(config);
 for(const {id} of PARTNERSHIP_REVIEW_TOOLS){const packet=createPartnershipReviewPacket(config,id);assert.deepEqual(replayPartnershipReviewPacket(JSON.parse(JSON.stringify(packet))),packet);}
 assert.deepEqual(config,before);
 const packet=createPartnershipReviewPacket(config,'slack');
 for(const mutate of [p=>p.scenario.deal.title='Changed',p=>p.scenario.deal.monthlyVolume++,p=>p.review.rows[0][1]++,p=>p.review.note='Changed',p=>p.extra=true,p=>delete p.review.rows[0],p=>delete p.review.rows[0][0],p=>delete p.review.columns[0]]){const bad=structuredClone(packet);mutate(bad);assert.throws(()=>replayPartnershipReviewPacket(bad));}
 assert.deepEqual(replayPartnershipReviewPacket({...packet,review:Object.fromEntries(Object.entries(packet.review).reverse())}),packet);
 for(const bad of [null,[],{}, {...config,participants:[]}, {...config,deal:{...config.deal,monthlyVolume:NaN}}])assert.throws(()=>analyzePartnershipReview(bad,'slack'));
 assert.throws(()=>analyzePartnershipReview(config,'unknown'));
});
test('review packets keep nonfinite arithmetic unavailable and roundtrip at declared bounds',()=>{
 const config=fixture();config.deal.monthlyVolume=Number.MIN_VALUE;config.deal.feePerTransaction=Number.MIN_VALUE;
 for(const {id} of PARTNERSHIP_REVIEW_TOOLS){const packet=createPartnershipReviewPacket(config,id);assert.deepEqual(replayPartnershipReviewPacket(JSON.parse(JSON.stringify(packet))),packet);assert.ok(packet.review.rows.flat().every(v=>typeof v!=='number'||Number.isFinite(v)));}
});
