import test from "node:test";
import assert from "node:assert/strict";
import { DEFAULT_SCENARIO, analyzeTimeline, runSimulation } from "../src/model.js";
test("diagnostics use 72 interval endpoints and preserve concurrent closure blockers",()=>{
  const d=analyzeTimeline(DEFAULT_SCENARIO), r=runSimulation(DEFAULT_SCENARIO);
  assert.equal(d.rows.length,72);
  assert.equal(d.queueAudHours,r.timeline.slice(1).reduce((s,p)=>s+p.queuedAud,0));
  assert.equal(d.backlogIntervals,r.timeline.slice(1).filter(p=>p.queuedAud>0).length);
  assert.deepEqual(d.rows[21].blockers,["Issuer closed","Bank closed","Payout closed"]);
  assert.ok(d.longestBacklogRun<=d.backlogIntervals);
});
test("zero demand has no backlog attribution; zero reserve has no last payout",()=>{
  const noDemand=analyzeTimeline({...DEFAULT_SCENARIO,redemptionDemandAud:0});
  assert.equal(noDemand.queueAudHours,0);assert.deepEqual(noDemand.blockers,[]);assert.equal(noDemand.firstBacklogHour,null);
  const noReserve=analyzeTimeline({...DEFAULT_SCENARIO,reserveCashAud:0});
  assert.equal(noReserve.reserveExhaustionHour,0);assert.equal(noReserve.lastSettlementHour,null);
  assert.equal(noReserve.backlogIntervals,72);
});
