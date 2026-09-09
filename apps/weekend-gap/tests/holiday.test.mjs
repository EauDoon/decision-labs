import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import {
  DEFAULT_SCENARIO,
  formatTime,
  getOperationalStatus,
  isBusinessDay,
  runSimulation,
  sanitizeScenario,
  scenarioFromJSON,
  weekendCloseOverlapNotice
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

test("older scenario JSON without saturdayHoliday keeps a weekend Saturday", () => {
  assert.equal(DEFAULT_SCENARIO.saturdayHoliday, false);
  assert.equal(sanitizeScenario({}).scenario.saturdayHoliday, false);
  assert.equal(sanitizeScenario({ name: "Legacy Saturday" }).errors.length, 0);
  assert.equal(sanitizeScenario({ saturdayHoliday: "true" }).scenario.saturdayHoliday, false);
  assert.ok(sanitizeScenario({ saturdayHoliday: "true" }).errors.some((error) => error.includes("saturdayHoliday")));
  const imported = scenarioFromJSON(JSON.stringify({
    format: "weekend-gap-scenario",
    version: 1,
    scenario: { name: "Legacy Saturday file", redemptionDemandAud: 1000 }
  }));
  assert.equal(imported.scenario.saturdayHoliday, false);
  assert.equal(imported.scenario.mondayHoliday, false);
});

test("holiday Saturday is a non-business day like Sunday", () => {
  assert.equal(formatTime(21), "Sat 12:00");
  assert.equal(formatTime(33), "Sun 00:00");
  assert.equal(isBusinessDay(21), false);
  assert.equal(isBusinessDay(21, false, false), false);
  assert.equal(isBusinessDay(21, false, true), false);
  assert.equal(isBusinessDay(33, false, true), false);
  assert.equal(isBusinessDay(65, false, true), true);

  const result = runSimulation({ ...DEFAULT_SCENARIO, saturdayHoliday: true });
  assert.equal(result.scenario.saturdayHoliday, true);
  const saturdayPoints = result.timeline.filter((point) => point.timeLabel.startsWith("Sat"));
  const sundayPoints = result.timeline.filter((point) => point.timeLabel.startsWith("Sun"));
  assert.ok(saturdayPoints.length > 0);
  assert.ok(sundayPoints.length > 0);
  for (const point of saturdayPoints) {
    assert.equal(point.issuerOpen, false);
    assert.equal(point.bankOpen, false);
    assert.equal(point.payoutOpen, false);
    assert.equal(point.immediateAud, 0);
    assert.equal(point.weekend, true);
  }
  for (const point of sundayPoints) {
    assert.equal(point.issuerOpen, false);
    assert.equal(point.weekend, true);
  }
  assert.ok(result.timeline[1].settledThisHour > 0);
  assert.ok(result.timeline[66].settledThisHour > 0);
});

test("Saturday without the holiday flag remains a weekend like Sunday", () => {
  const result = runSimulation({ ...DEFAULT_SCENARIO, saturdayHoliday: false });
  assert.equal(result.timeline[21].timeLabel, "Sat 12:00");
  assert.equal(result.timeline[21].issuerOpen, false);
  assert.equal(result.timeline[21].weekend, true);
  assert.equal(getOperationalStatus(result.scenario, 21).payoutOpen, false);
  assert.equal(getOperationalStatus(result.scenario, 33).payoutOpen, false);
});

test("holiday Saturday toggle is optional in the editor and labels Saturday like Sunday", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  const app = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
  assert.match(html, /id="saturdayHoliday"/);
  assert.match(html, /Treat Saturday as a public holiday/);
  assert.match(html, /Older scenario files omit this field and keep the existing weekend Saturday/);
  assert.match(html, /id="weekend-overlap-notice"/);
  assert.match(app, /Holiday Saturday/);
  assert.match(app, /saturdayHoliday && point\.timeLabel\.startsWith\("Sat"\)/);
});

test("Saturday holiday with Sunday-style close notices that both weekend days are closed", () => {
  assert.equal(weekendCloseOverlapNotice(DEFAULT_SCENARIO), "");
  assert.equal(weekendCloseOverlapNotice({ ...DEFAULT_SCENARIO, saturdayHoliday: false }), "");
  assert.equal(
    weekendCloseOverlapNotice({ ...DEFAULT_SCENARIO, saturdayHoliday: true }),
    "Saturday holiday and Sunday-style close overlap. Both weekend days are treated as closed."
  );
  const result = runSimulation({ ...DEFAULT_SCENARIO, saturdayHoliday: true });
  const saturday = result.timeline.filter((point) => point.timeLabel.startsWith("Sat"));
  const sunday = result.timeline.filter((point) => point.timeLabel.startsWith("Sun"));
  assert.ok(saturday.every((point) => point.issuerOpen === false && point.weekend === true));
  assert.ok(sunday.every((point) => point.issuerOpen === false && point.weekend === true));
});
