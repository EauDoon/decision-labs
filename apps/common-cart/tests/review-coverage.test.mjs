import test from 'node:test';
import assert from 'node:assert/strict';
import { analyzeCartReview } from '../src/model.js';
const buyer=(id,quantity=1)=>({id,label:id,category:'Coffee',quantity,maxUnitPrice:10,latestDeliveryDays:5,allowedVariants:['Plain']});
const offer=(id,capacity=5)=>({id,merchant:id,category:'Coffee',variant:'Plain',unitPrice:5,minimumUnits:1,deliveryDays:2,capacity,shippingPerBuyer:0});
export const fixture=()=>({title:'Synthetic organizer review',currency:'AUD',buyers:[buyer('A',2),buyer('B',3)],offers:[offer('One'),offer('Two',2)]});
test('coverage counts actual whole-order allocations, not mere compatibility',()=>{
 const scenario=fixture(),before=JSON.stringify(scenario);
 const report=analyzeCartReview(scenario,'coverage');
 assert.deepEqual(report.rows,[['A',2,2,'One, Two'],['B',3,1,'One']]);
 assert.equal(JSON.stringify(scenario),before);
 assert.throws(()=>analyzeCartReview(scenario,'unknown'));
});
