import assert from "node:assert/strict";
import test from "node:test";
import { DEFAULT_SCENARIO, compareDemandProfiles, previewDemandProfileStep, runSimulation, stepDemandProfile } from "../src/model.js";

test("demand profile comparison reruns three timings on the same other inputs", () => {
  const input = { ...DEFAULT_SCENARIO, redemptionDemandAud: 2400000, demandProfile: "mondayRush" };
  const rows = compareDemandProfiles(input);
  assert.equal(rows.length, 3);
  assert.deepEqual(rows.map((row) => row.demandProfile), ["flat", "fridayBurst", "mondayRush"]);
  for (const row of rows) {
    const result = runSimulation({ ...input, demandProfile: row.demandProfile });
    assert.equal(row.peakQueuedAud, result.summary.peakQueuedAud);
    assert.equal(row.finalQueuedAud, result.summary.finalQueuedAud);
    assert.equal(row.totalSettledAud, result.summary.totalSettledAud);
    assert.equal(row.hoursToFirstSettlement, result.summary.hoursToFirstSettlement);
    assert.equal(result.scenario.redemptionDemandAud, 2400000);
    assert.equal(result.scenario.reserveCashAud, input.reserveCashAud);
  }
  const peaks = new Set(rows.map((row) => row.peakQueuedAud));
  assert.ok(peaks.size > 1);
});

test("demand profile comparison is a timing experiment and does not change total demand", () => {
  const rows = compareDemandProfiles({ ...DEFAULT_SCENARIO, demandProfile: "flat" });
  const settled = rows.map((row) => row.totalSettledAud);
  assert.ok(settled.every((value) => value <= DEFAULT_SCENARIO.redemptionDemandAud + 1e-6));
  assert.equal(compareDemandProfiles(DEFAULT_SCENARIO)[0].demandProfile, "flat");
});

test("demand timing steps are adjacent, deterministic and stay put at either end", () => {
  assert.equal(stepDemandProfile("flat", "earlier"), "fridayBurst");
  assert.equal(stepDemandProfile("flat", "later"), "mondayRush");
  assert.equal(stepDemandProfile("fridayBurst", "earlier"), "fridayBurst");
  assert.equal(stepDemandProfile("mondayRush", "later"), "mondayRush");
  assert.equal(stepDemandProfile("fridayBurst", "later"), "flat");
  assert.equal(stepDemandProfile("mondayRush", "earlier"), "flat");
  assert.throws(() => stepDemandProfile("flat", "random"), RangeError);
  assert.doesNotMatch(stepDemandProfile.toString(), /Math\.random|Date\.now/);
});

test("demand timing preview keeps total demand and does not mutate the input", () => {
  const input = { ...DEFAULT_SCENARIO, demandProfile: "flat", redemptionDemandAud: 2400000 };
  const preview = previewDemandProfileStep(input, "later");
  assert.equal(input.demandProfile, "flat");
  assert.equal(preview.candidateProfile, "mondayRush");
  assert.equal(preview.unchanged, false);
  assert.equal(preview.applied.redemptionDemandAud, 2400000);
  const later = runSimulation({ ...input, demandProfile: "mondayRush" });
  assert.equal(preview.candidate.peakQueuedAud, later.summary.peakQueuedAud);
  assert.equal(preview.candidate.totalSettledAud, later.summary.totalSettledAud);
  const stuck = previewDemandProfileStep({ ...input, demandProfile: "fridayBurst" }, "earlier");
  assert.equal(stuck.unchanged, true);
  assert.equal(stuck.candidateProfile, "fridayBurst");
});
