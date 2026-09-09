import assert from "node:assert/strict";
import test from "node:test";
import {
  DEFAULT_SCENARIO,
  PRESETS,
  compareScenarios,
  hoursToClearQueue,
  runSimulation
} from "../src/model.js";

test("hours-to-clear-queue is the first zero-queue checkpoint after the queue was positive", () => {
  const result = runSimulation(DEFAULT_SCENARIO);
  const firstPositive = result.timeline.find((point) => point.queuedAud > 0);
  assert.ok(firstPositive);
  const cleared = result.timeline.find((point) => point.hour > firstPositive.hour && point.queuedAud === 0);
  assert.ok(cleared);
  assert.equal(result.summary.hoursToClearQueue, cleared.hour);
  assert.equal(hoursToClearQueue(result.timeline), cleared.hour);
  assert.equal(result.timeline[cleared.hour].queuedAud, 0);
  assert.ok(result.timeline.slice(0, cleared.hour).some((point) => point.queuedAud > 0));
});

test("queue remains when demand never finishes settling", () => {
  const result = runSimulation({ ...DEFAULT_SCENARIO, payoutThroughputAudPerHour: 0 });
  assert.ok(result.summary.peakQueuedAud > 0);
  assert.ok(result.summary.finalQueuedAud > 0);
  assert.equal(result.summary.hoursToClearQueue, null);
  assert.equal(hoursToClearQueue(result.timeline), null);
  assert.ok(result.timeline.filter((point) => point.queuedAud > 0).length > 0);
});

test("zero demand never queues so hours-to-clear-queue stays null", () => {
  const result = runSimulation({ ...DEFAULT_SCENARIO, redemptionDemandAud: 0 });
  assert.equal(result.summary.peakQueuedAud, 0);
  assert.equal(result.summary.hoursToClearQueue, null);
  assert.equal(hoursToClearQueue(result.timeline), null);
});

test("market stress keeps a residual queue through Monday 15:00", () => {
  const result = runSimulation(PRESETS.marketStress);
  assert.ok(result.summary.finalQueuedAud > 0);
  assert.equal(result.summary.hoursToClearQueue, null);
});

test("comparison deltas stay numeric when both runs clear and stay null when only one clears", () => {
  const same = compareScenarios(DEFAULT_SCENARIO, DEFAULT_SCENARIO);
  assert.equal(same.deltas.hoursToClearQueue, 0);
  const mixed = compareScenarios(DEFAULT_SCENARIO, PRESETS.marketStress);
  assert.equal(mixed.baseline.summary.hoursToClearQueue, runSimulation(DEFAULT_SCENARIO).summary.hoursToClearQueue);
  assert.equal(mixed.candidate.summary.hoursToClearQueue, null);
  assert.equal(mixed.deltas.hoursToClearQueue, null);
});
