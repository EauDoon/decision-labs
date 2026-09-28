import test from "node:test";
import assert from "node:assert/strict";
import { buildDemandSchedule } from "../src/model.js";

function ratio(schedule, hour, baseHour) {
  return schedule[hour] / schedule[baseHour];
}

test("Monday rush weights hours 57 through 71 and then stays flat", () => {
  // MODEL.md: Monday rush gives hours 57 to 71 weight 8, and burst profiles
  // concentrate early with a flat tail. On a 72-hour horizon the last hour is
  // 71, so an unbounded "hour >= 57" check looks the same. On a longer horizon
  // every later hour was also weighted 8, so the tail was not flat and total
  // demand was redistributed.
  const long = buildDemandSchedule(9600, 96, "mondayRush");
  assert.ok(Math.abs(long.reduce((sum, value) => sum + value, 0) - 9600) < 1e-6);
  assert.ok(Math.abs(ratio(long, 56, 0) - 1) < 1e-9);
  assert.ok(Math.abs(ratio(long, 57, 0) - 8) < 1e-9);
  assert.ok(Math.abs(ratio(long, 71, 0) - 8) < 1e-9);
  assert.ok(Math.abs(ratio(long, 72, 0) - 1) < 1e-9);
  assert.ok(Math.abs(ratio(long, 95, 0) - 1) < 1e-9);

  const classic = buildDemandSchedule(7200, 72, "mondayRush");
  assert.ok(Math.abs(classic.reduce((sum, value) => sum + value, 0) - 7200) < 1e-6);
  assert.ok(Math.abs(ratio(classic, 56, 0) - 1) < 1e-9);
  assert.ok(Math.abs(ratio(classic, 57, 0) - 8) < 1e-9);
  assert.ok(Math.abs(ratio(classic, 71, 10) - 8) < 1e-9);
});
