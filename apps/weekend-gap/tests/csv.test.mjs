import test from "node:test";
import assert from "node:assert/strict";
import { DEFAULT_SCENARIO, PRESETS, timelineToCSV, runSimulation } from "../src/model.js";
test("CSV includes all checkpoints with unrounded auditable flows and baseline",()=>{
 const text=timelineToCSV(PRESETS.weekendRush,DEFAULT_SCENARIO), rows=text.trimEnd().split("\r\n").map(row=>row.split(","));
 assert.equal(rows.length,74);assert.ok(rows.every(row=>row.length===10));assert.equal(rows[1][2],"");
 const run=runSimulation(PRESETS.weekendRush),base=runSimulation(DEFAULT_SCENARIO);
 for(let i=0;i<73;i++){ assert.equal(Number(rows[i+1][0]),i);assert.equal(Number(rows[i+1][4]),run.timeline[i].settledThisHour);assert.equal(Number(rows[i+1][9]),base.timeline[i].queuedAud); }
 assert.equal(Number(rows[3][8]),0);assert.ok(Number(rows[3][4])>0);
});
test("scenario names cannot introduce spreadsheet formulas or extra CSV rows",()=>{
 const text=timelineToCSV({...DEFAULT_SCENARIO,name:'=HYPERLINK("bad")\nextra'});
 assert.equal(text.trimEnd().split("\r\n").length,74);assert.ok(!text.includes("HYPERLINK"));
});
