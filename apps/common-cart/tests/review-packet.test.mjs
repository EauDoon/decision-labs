import test from 'node:test';
import assert from 'node:assert/strict';
import { createCartReviewPacket, replayCartReviewPacket } from '../src/model.js';
import { fixture } from './review-fixture.mjs';
test('private review packets replay exact input and reject changed evidence',()=>{
 const packet=createCartReviewPacket(fixture(),'coverage');
 assert.deepEqual(replayCartReviewPacket(JSON.parse(JSON.stringify(packet))),packet);
 for(const mutate of [p=>p.scenario.title='Changed room',p=>p.scenario.buyers[0].quantity++,p=>p.review.rows[0][2]++,p=>p.review.note='Changed',p=>p.tool='shipping',p=>p.extra=true,p=>delete p.review.rows[0],p=>delete p.review.rows[0][0],p=>delete p.review.columns[0]]){
  const changed=structuredClone(packet);mutate(changed);assert.throws(()=>replayCartReviewPacket(changed));
 }
 const reordered={...packet,review:Object.fromEntries(Object.entries(packet.review).reverse())};
 assert.deepEqual(replayCartReviewPacket(reordered),packet);
});
