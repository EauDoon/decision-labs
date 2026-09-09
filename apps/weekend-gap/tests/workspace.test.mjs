import test from "node:test";
import assert from "node:assert/strict";
import { DEFAULT_SCENARIO, PRESETS, workspaceToJSON, workspaceFromJSON, scenarioFromJSON } from "../src/model.js";
test("workspace round trip preserves detached baseline, notes and analysis controls",()=>{
 const text=workspaceToJSON(PRESETS.marketStress,DEFAULT_SCENARIO,{notes:"<b>test</b>",selectedHour:65,targetPercent:75,deadlineHour:70,ganttDensity:"all"});
 const result=workspaceFromJSON(text);assert.deepEqual(result.errors,[]);assert.equal(result.workspace.baseline.name,"Normal Friday");
 assert.equal(result.workspace.current.name,"Market Stress");assert.equal(result.workspace.selectedHour,65);assert.equal(result.workspace.notes,"<b>test</b>");
 assert.equal(result.workspace.ganttDensity,"all");
 assert.equal(scenarioFromJSON(text).scenario,null);assert.deepEqual(workspaceFromJSON("\uFEFF"+text),result);
});
test("workspace Gantt density defaults to snapshots and older files remain valid",()=>{
 const omitted=workspaceToJSON(DEFAULT_SCENARIO,DEFAULT_SCENARIO,{notes:"legacy"});
 const restored=workspaceFromJSON(omitted);
 assert.equal(restored.workspace.ganttDensity,"snapshots");
 const raw=JSON.parse(omitted);
 delete raw.ganttDensity;
 const legacy=workspaceFromJSON(JSON.stringify(raw));
 assert.ok(legacy.workspace);
 assert.equal(legacy.workspace.ganttDensity,"snapshots");
 assert.deepEqual(legacy.errors,[]);
 assert.equal(workspaceFromJSON(JSON.stringify({...raw,ganttDensity:"open"})).workspace.ganttDensity,"open");
});
test("older workspace files omit selectedHour and restore hour zero",()=>{
 const text=workspaceToJSON(PRESETS.weekendRush,DEFAULT_SCENARIO,{selectedHour:21,notes:"legacy hour"});
 const raw=JSON.parse(text);
 assert.equal(raw.selectedHour,21);
 delete raw.selectedHour;
 const legacy=workspaceFromJSON(JSON.stringify(raw));
 assert.ok(legacy.workspace);
 assert.equal(legacy.workspace.selectedHour,0);
 assert.deepEqual(legacy.errors,[]);
 assert.equal(workspaceFromJSON(JSON.stringify({...raw,selectedHour:65})).workspace.selectedHour,65);
});
test("invalid workspace controls and format cannot replace an active workspace",()=>{
 const valid=JSON.parse(workspaceToJSON(DEFAULT_SCENARIO,DEFAULT_SCENARIO));
 for(const changed of [{version:2},{current:null},{baseline:[]},{targetPercent:-1},{deadlineHour:73},{selectedHour:1.5},{notes:"x".repeat(4001)},{ganttDensity:"wide"}]) assert.equal(workspaceFromJSON(JSON.stringify({...valid,...changed})).workspace,null);
 assert.equal(workspaceFromJSON("x".repeat(250001)).workspace,null);
});
