import assert from "node:assert/strict";
import test from "node:test";
import { DEFAULT_SCENARIO as DEFAULT, PRESETS, compareScenarios, planReserve, runSimulation, analysisToJSON, scenarioFromJSON } from "../src/model.js";

test("comparison produces signed deltas and detached inputs", () => {
  const source = { ...DEFAULT };
  const result = compareScenarios(source, { ...source, reserveCashAud: 1 });
  source.reserveCashAud = 0;
  assert.equal(result.baseline.scenario.reserveCashAud, DEFAULT.reserveCashAud);
  assert.ok(result.deltas.totalSettledAud < 0);
  assert.ok(result.deltas.finalQueuedAud > 0);
  assert.deepEqual(result.changes.map((change) => change.field), ["reserveCashAud"]);
});

test("identical scenarios have zero comparison deltas", () => {
  const result = compareScenarios(PRESETS.marketStress, PRESETS.marketStress);
  assert.equal(result.changes.length, 0);
  assert.ok(Object.values(result.deltas).every((value) => value === 0));
});

test("whole-cent minimum agrees with full simulation and fails one cent lower", () => {
  for (const demand of [1.23, 1000, 1200000]) {
    for (const percent of [25, 50, 100]) {
      const input = { ...DEFAULT, redemptionDemandAud: demand };
      const plan = planReserve(input, percent);
      assert.equal(plan.status, "reachable");
      const achieved = runSimulation({ ...input, reserveCashAud: plan.minimumReserveAud }).summary.totalSettledAud;
      assert.ok(achieved + 0.000001 >= plan.targetAud);
      if (plan.minimumReserveAud > 0) {
        const lower = runSimulation({ ...input, reserveCashAud: plan.minimumReserveAud - 0.01 }).summary.totalSettledAud;
        assert.ok(lower + 0.000001 < plan.targetAud);
      }
      assert.ok(plan.iterations <= 39);
      assert.ok(Math.abs(plan.minimumReserveAud * 100 - Math.round(plan.minimumReserveAud * 100)) < 0.0001);
    }
  }
});

test("deadline recurrence matches every full-simulation checkpoint", () => {
  const input = { ...DEFAULT, redemptionDemandAud: 1000, reserveCashAud: 317.21 };
  const simulation = runSimulation(input);
  for (let hour = 1; hour <= 72; hour += 1) {
    assert.equal(planReserve(input, 0, hour).currentSettledAud, simulation.timeline[hour].settledAud);
  }
});

test("more reserve cannot repair zero throughput or disjoint windows", () => {
  for (const change of [{ payoutThroughputAudPerHour: 0 }, { fxDepthAudPerHour: 0 },
    { issuerThroughputAudPerHour: 0 }, { bankOpenStartHour: 20, bankOpenEndHour: 22 }]) {
    const plan = planReserve({ ...DEFAULT, ...change });
    assert.equal(plan.status, "unreachable");
    assert.equal(plan.minimumReserveAud, null);
    assert.equal(plan.maximumSettledAud, 0);
  }
});

test("early deadlines cannot settle demand that has not arrived", () => {
  const plan = planReserve(DEFAULT, 100, 1);
  assert.equal(plan.status, "unreachable");
  assert.ok(plan.maximumSettledAud < plan.targetAud);
});

test("nominal cap cannot be bypassed by the reserve search", () => {
  const plan = planReserve({ ...DEFAULT, nominalLiquidityAud: 10000, redemptionDemandAud: 20000 });
  assert.equal(plan.status, "unreachable");
  assert.equal(plan.maximumReserveAud, 10000);
  assert.ok(plan.maximumSettledAud <= 10000.000001);
});

test("zero demand or zero target requires no reserve", () => {
  assert.equal(planReserve({ ...DEFAULT, redemptionDemandAud: 0 }).minimumReserveAud, 0);
  assert.equal(planReserve(DEFAULT, 0).minimumReserveAud, 0);
});

test("cent-exact nominal caps do not lose a cent through binary multiplication", () => {
  for (const cap of [10000.05, 10000.13, 10000.21]) {
    const plan = planReserve({ ...DEFAULT, nominalLiquidityAud: cap, redemptionDemandAud: cap });
    assert.equal(plan.status, "reachable");
    assert.equal(plan.minimumReserveAud, cap);
    assert.equal(plan.maximumReserveAud, cap);
  }
  const subcent = planReserve({ ...DEFAULT, nominalLiquidityAud: 10000.059, redemptionDemandAud: 10000.059 });
  assert.equal(subcent.maximumReserveAud, 10000.05);
  assert.equal(subcent.status, "unreachable");
});

test("malformed targets and deadlines fail without coercion", () => {
  for (const target of [null, "", "50", NaN, Infinity, -1, 101, {}, []]) {
    assert.throws(() => planReserve(DEFAULT, target), RangeError);
  }
  for (const deadline of [null, "72", NaN, Infinity, 0, -1, 73, 1.5]) {
    assert.throws(() => planReserve(DEFAULT, 100, deadline), RangeError);
  }
});

test("settlement tolerance handles high values without erasing tiny positive targets", () => {
  const large = { ...DEFAULT, nominalLiquidityAud: 5e9, redemptionDemandAud: 1e9,
    issuerOpenStartHour: 0, issuerOpenEndHour: 24, bankOpenStartHour: 0, bankOpenEndHour: 24,
    payoutOpenStartHour: 0, payoutOpenEndHour: 24, issuerThroughputAudPerHour: 1e9,
    payoutThroughputAudPerHour: 1e9, fxDepthAudPerHour: 1e9 };
  assert.equal(planReserve(large).status, "reachable");
  assert.equal(planReserve(large).minimumReserveAud, 1e9);
  const tiny = planReserve({ ...DEFAULT, redemptionDemandAud: 5e-7 });
  assert.equal(tiny.minimumReserveAud, 0.01);
  assert.ok(tiny.achievedSettledAud > 0);
});

test("analysis export is deterministic and carries complete evidence", () => {
  const output = analysisToJSON(DEFAULT, PRESETS.weekendRush, 80, 70);
  assert.equal(output, analysisToJSON(DEFAULT, PRESETS.weekendRush, 80, 70));
  const report = JSON.parse(output);
  assert.equal(report.timeline.length, 73);
  assert.equal(report.reservePlan.targetPercent, 80);
  assert.equal(report.reservePlan.deadlineHour, 70);
  assert.equal(report.timeline.at(-1).candidateQueuedAud, report.candidateSummary.finalQueuedAud);
  assert.equal(scenarioFromJSON(output).scenario, null);
});
