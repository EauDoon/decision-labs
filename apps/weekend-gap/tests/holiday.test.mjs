import assert from "node:assert/strict";
import test from "node:test";
import {
  DEFAULT_SCENARIO,
  formatTime,
  getOperationalStatus,
  isBusinessDay,
  runSimulation,
  sanitizeScenario,
  scenarioFromJSON
} from "../src/model.js";

test("older scenario JSON without mondayHoliday keeps a weekday Monday", () => {
  assert.equal(DEFAULT_SCENARIO.mondayHoliday, false);
  assert.equal(sanitizeScenario({}).scenario.mondayHoliday, false);
  assert.equal(sanitizeScenario({ name: "Legacy" }).errors.length, 0);
  assert.equal(sanitizeScenario({ mondayHoliday: "true" }).scenario.mondayHoliday, false);
  assert.ok(sanitizeScenario({ mondayHoliday: "true" }).errors.some((error) => error.includes("mondayHoliday")));
  const imported = scenarioFromJSON(JSON.stringify({
    format: "weekend-gap-scenario",
    version: 1,
    scenario: { name: "Legacy file", redemptionDemandAud: 1000 }
  }));
  assert.equal(imported.scenario.mondayHoliday, false);
});

test("holiday Monday is a non-business day like Sunday and blocks settlement", () => {
  assert.equal(formatTime(57), "Mon 00:00");
  assert.equal(formatTime(65), "Mon 08:00");
  assert.equal(isBusinessDay(65), true);
  assert.equal(isBusinessDay(65, true), false);
  assert.equal(isBusinessDay(21, true), false);

  const result = runSimulation({ ...DEFAULT_SCENARIO, mondayHoliday: true });
  assert.equal(result.scenario.mondayHoliday, true);
  const mondayPoints = result.timeline.filter((point) => point.timeLabel.startsWith("Mon"));
  assert.ok(mondayPoints.length > 0);
  for (const point of mondayPoints) {
    assert.equal(point.issuerOpen, false);
    assert.equal(point.bankOpen, false);
    assert.equal(point.payoutOpen, false);
    assert.equal(point.immediateAud, 0);
    assert.equal(point.weekend, true);
  }
  for (let hour = 57; hour < 72; hour += 1) {
    assert.equal(result.timeline[hour + 1].settledThisHour, 0);
    assert.equal(getOperationalStatus(result.scenario, hour).payoutOpen, false);
  }
  assert.ok(result.timeline[1].settledThisHour > 0);
});

test("weekday Monday still settles when the holiday flag is off", () => {
  const result = runSimulation({ ...DEFAULT_SCENARIO, mondayHoliday: false });
  assert.ok(result.timeline[66].settledThisHour > 0);
  assert.equal(result.timeline[66].timeLabel, "Mon 09:00");
});
