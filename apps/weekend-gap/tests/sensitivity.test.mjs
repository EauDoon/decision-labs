import test from "node:test";
import assert from "node:assert/strict";
import { DEFAULT_SCENARIO, runSensitivity, runSimulation } from "../src/model.js";
test("sensitivity preserves input and returns bounded reproducible cases",()=>{
 const source={...DEFAULT_SCENARIO,reserveCashAud:9000000};const original={...source};
 const rows=runSensitivity(source,"reserveCashAud");assert.equal(rows.length,5);assert.deepEqual(source,original);
 assert.equal(rows[4].effectiveValue,source.nominalLiquidityAud);assert.equal(rows[4].adjusted,true);
 assert.equal(rows[2].settlementDeltaAud,0);
 for(const row of rows) assert.deepEqual(row.summary,runSimulation(row.scenario).summary);
});
test("zero sensitivity baseline stays zero and unsupported fields fail closed",()=>{
 assert.ok(runSensitivity({...DEFAULT_SCENARIO,fxDepthAudPerHour:0},"fxDepthAudPerHour").every(r=>r.effectiveValue===0 && r.summary.totalSettledAud===0));
 assert.throws(()=>runSensitivity(DEFAULT_SCENARIO,"__proto__"),RangeError);
});
