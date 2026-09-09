import test from "node:test";
import assert from "node:assert/strict";
import { DEFAULT_SCENARIO, PRESETS, workspaceToJSON, workspaceFromJSON, scenarioFromJSON } from "../src/model.js";
test("workspace round trip preserves detached baseline, notes and analysis controls",()=>{
 const text=workspaceToJSON(PRESETS.marketStress,DEFAULT_SCENARIO,{notes:"<b>test</b>",selectedHour:65,targetPercent:75,deadlineHour:70});
 const result=workspaceFromJSON(text);assert.deepEqual(result.errors,[]);assert.equal(result.workspace.baseline.name,"Normal Friday");
 assert.equal(result.workspace.current.name,"Market Stress");assert.equal(result.workspace.selectedHour,65);assert.equal(result.workspace.notes,"<b>test</b>");
 assert.equal(scenarioFromJSON(text).scenario,null);assert.deepEqual(workspaceFromJSON("\uFEFF"+text),result);
});
test("invalid workspace controls and format cannot replace an active workspace",()=>{
 const valid=JSON.parse(workspaceToJSON(DEFAULT_SCENARIO,DEFAULT_SCENARIO));
 for(const changed of [{version:2},{current:null},{baseline:[]},{targetPercent:-1},{deadlineHour:73},{selectedHour:1.5},{notes:"x".repeat(4001)}]) assert.equal(workspaceFromJSON(JSON.stringify({...valid,...changed})).workspace,null);
 assert.equal(workspaceFromJSON("x".repeat(250001)).workspace,null);
});
