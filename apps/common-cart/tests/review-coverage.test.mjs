import test from 'node:test';
import assert from 'node:assert/strict';
import { analyzeCartReview } from '../src/model.js';
import { fixture } from './review-fixture.mjs';
test('coverage counts actual whole-order allocations, not mere compatibility',()=>{
 const scenario=fixture(),before=JSON.stringify(scenario);
 const report=analyzeCartReview(scenario,'coverage');
 assert.deepEqual(report.rows,[['A',2,2,'One, Two'],['B',3,1,'One']]);
 assert.equal(JSON.stringify(scenario),before);
 assert.throws(()=>analyzeCartReview(scenario,'unknown'));
});
