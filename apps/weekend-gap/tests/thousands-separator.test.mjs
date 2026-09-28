import test from "node:test";
import assert from "node:assert/strict";
import { DEFAULT_SCENARIO, buildDemandSchedule, finiteNumber, sanitizeScenario } from "../src/model.js";

test("finiteNumber reads a thousands separator and still rejects NaN and a broken group", () => {
  // Number("1,000") is NaN, so a grouped demand string fell through to the
  // fallback. A 72-hour schedule then summed to zero instead of the demand.
  assert.equal(finiteNumber("1,000", 42), 1000);
  assert.equal(finiteNumber("1,000.50", 42), 1000.5);
  assert.equal(finiteNumber("1\u00A0000", 42), 1000);
  assert.equal(finiteNumber("12.5", 42), 12.5);
  assert.equal(finiteNumber("NaN", 42), 42);
  assert.equal(finiteNumber("1,00", 42), 42);
  assert.equal(finiteNumber("", 42), 42);
});

test("grouped demand still sums to the entered total on a 72-hour flat schedule", () => {
  const schedule = buildDemandSchedule("1,000", 72, "flat");
  assert.equal(schedule.length, 72);
  const total = schedule.reduce((sum, value) => sum + value, 0);
  assert.ok(Math.abs(total - 1000) < 1e-6);
  assert.ok(Math.abs(schedule[0] - schedule[71]) < 1e-9);
  assert.ok(Math.abs(buildDemandSchedule("1,00", 72, "flat").reduce((sum, value) => sum + value, 0)) < 1e-9);
});

test("sanitizeScenario keeps grouped demand instead of substituting the default", () => {
  const { scenario, errors } = sanitizeScenario({ redemptionDemandAud: "1,000" });
  assert.equal(scenario.redemptionDemandAud, 1000);
  assert.equal(errors.some((error) => error.includes("redemptionDemandAud")), false);
  assert.equal(scenario.horizonHours, DEFAULT_SCENARIO.horizonHours);
});
