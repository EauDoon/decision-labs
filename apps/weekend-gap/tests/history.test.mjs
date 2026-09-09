import test from "node:test";
import assert from "node:assert/strict";
import { DEFAULT_SCENARIO, createScenarioHistory } from "../src/model.js";
test("undo and redo restore detached assumptions and discard abandoned branches",()=>{
 const h=createScenarioHistory(DEFAULT_SCENARIO);h.record({...DEFAULT_SCENARIO,name:"A"});h.record({...DEFAULT_SCENARIO,name:"B"});
 const previous=h.undo();assert.equal(previous.name,"A");previous.name="tampered";
 assert.equal(h.redo().name,"B");h.undo();h.record({...DEFAULT_SCENARIO,name:"C"});assert.equal(h.canRedo,false);
 assert.equal(h.undo().name,"A");assert.equal(h.undo().name,DEFAULT_SCENARIO.name);assert.equal(h.canUndo,false);
});
test("history is bounded and identical snapshots do not consume recovery slots",()=>{
 const h=createScenarioHistory(DEFAULT_SCENARIO,3);h.record(DEFAULT_SCENARIO);assert.equal(h.size,1);
 for(let i=0;i<10;i++) h.record({...DEFAULT_SCENARIO,name:String(i)});
 assert.equal(h.size,3);assert.equal(h.undo().name,"8");assert.equal(h.undo().name,"7");assert.equal(h.canUndo,false);
 assert.throws(()=>createScenarioHistory(DEFAULT_SCENARIO,1000),RangeError);
});
