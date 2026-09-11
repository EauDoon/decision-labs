import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import {
  DEFAULT_SCENARIO,
  PRESETS,
  dayAndHourAt,
  formatTime,
  getOperationalStatus,
  runSimulation,
  sanitizeScenario
} from "../src/model.js";

function firstMondayLateFxOpenHour(scenario) {
  for (let hour = 0; hour < 80; hour += 1) {
    const { dayIndex, localHour } = dayAndHourAt(hour);
    if (dayIndex === 1 && localHour >= 16 && localHour < 18 && getOperationalStatus(scenario, hour).fxWeekday) {
      const ordinary = getOperationalStatus({
        ...scenario,
        mondayLateFxOpen: false
      }, hour).fxWeekday;
      if (!ordinary) return hour;
    }
  }
  return null;
}

test("Monday late FX open keeps the Normal Friday calendar with a Monday evening FX window", () => {
  const preset = PRESETS.mondayLateFxOpen;
  assert.match(preset.name, /synthetic/i);
  assert.match(preset.name, /Monday late FX open/i);
  assert.equal(preset.mondayLateFxOpen, true);
  assert.equal(DEFAULT_SCENARIO.mondayLateFxOpen, false);
  assert.equal(preset.mondayEarlyFxOpen, false);
  assert.equal(preset.fridayLateFxOpen, false);
  assert.equal(preset.sundayEarlyFxOpen, false);
  assert.equal(preset.saturdayLateFxOpen, false);
  assert.equal(preset.mondayHoliday, false);
  assert.equal(preset.demandProfile, DEFAULT_SCENARIO.demandProfile);
  assert.equal(preset.issuerOpenStartHour, DEFAULT_SCENARIO.issuerOpenStartHour);
  assert.equal(preset.bankOpenStartHour, DEFAULT_SCENARIO.bankOpenStartHour);
  assert.equal(preset.redemptionDemandAud, DEFAULT_SCENARIO.redemptionDemandAud);
  assert.notDeepEqual(preset, PRESETS.normal);
  assert.notDeepEqual(preset, PRESETS.mondayEarlyFxOpen);
  assert.notDeepEqual(preset, PRESETS.fridayLateFxOpen);
  assert.notDeepEqual(preset, PRESETS.sundayEarlyFxOpen);
  assert.notDeepEqual(preset, PRESETS.saturdayLateFxOpen);
  const late = runSimulation(preset);
  const normal = runSimulation(DEFAULT_SCENARIO);
  const mondayEarly = runSimulation(PRESETS.mondayEarlyFxOpen);
  const fridayLate = runSimulation(PRESETS.fridayLateFxOpen);
  assert.equal(formatTime(73), "Mon 16:00");
  assert.equal(formatTime(74), "Mon 17:00");
  assert.equal(formatTime(75), "Mon 18:00");
  assert.equal(getOperationalStatus(preset, 73).fxWeekday, true);
  assert.equal(getOperationalStatus(preset, 74).fxWeekday, true);
  assert.equal(getOperationalStatus(DEFAULT_SCENARIO, 73).fxWeekday, true);
  assert.equal(getOperationalStatus(preset, 65).fxWeekday, true);
  assert.equal(late.timeline[65].timeLabel, "Mon 08:00");
  assert.equal(late.timeline[65].fxWeekday, true);
  assert.equal(normal.timeline[65].fxWeekday, true);
  assert.equal(mondayEarly.timeline[65].fxWeekday, true);
  assert.equal(fridayLate.timeline[1].fxWeekday, true);
  assert.equal(late.timeline[1].fxWeekday, true);
  assert.equal(firstMondayLateFxOpenHour(preset), null);
  assert.equal(firstMondayLateFxOpenHour(DEFAULT_SCENARIO), null);
  assert.equal(firstMondayLateFxOpenHour(PRESETS.mondayEarlyFxOpen), null);
  assert.equal(firstMondayLateFxOpenHour(PRESETS.fridayLateFxOpen), null);
  assert.equal(firstMondayLateFxOpenHour(PRESETS.sundayEarlyFxOpen), null);
  assert.equal(firstMondayLateFxOpenHour(PRESETS.saturdayLateFxOpen), null);
  const holiday = { ...DEFAULT_SCENARIO, mondayHoliday: true };
  const holidayLate = { ...DEFAULT_SCENARIO, mondayHoliday: true, mondayLateFxOpen: true };
  const holidayEarly = { ...DEFAULT_SCENARIO, mondayHoliday: true, mondayEarlyFxOpen: true };
  assert.equal(getOperationalStatus(holiday, 73).fxWeekday, false);
  assert.equal(getOperationalStatus(holidayLate, 73).fxWeekday, true);
  assert.equal(getOperationalStatus(holidayLate, 74).fxWeekday, true);
  assert.equal(getOperationalStatus(holidayLate, 75).fxWeekday, false);
  assert.equal(getOperationalStatus(holidayLate, 65).fxWeekday, false);
  assert.equal(getOperationalStatus(holidayEarly, 65).fxWeekday, true);
  assert.equal(getOperationalStatus(holidayEarly, 73).fxWeekday, false);
  assert.equal(runSimulation(holiday).timeline[65].fxWeekday, false);
  assert.equal(runSimulation(holidayLate).timeline[65].fxWeekday, false);
  assert.equal(firstMondayLateFxOpenHour(holidayLate), 73);
  assert.equal(firstMondayLateFxOpenHour(holiday), null);
  assert.ok(firstMondayLateFxOpenHour(holidayLate) > 71);
});

test("Monday late FX open ORs into fxWeekday through isMondayLateFxOpenHour, not Monday early or Friday late helpers", async () => {
  const model = await readFile(new URL("../src/model.js", import.meta.url), "utf8");
  const helperStart = model.indexOf("function isMondayLateFxOpenHour");
  const helperNext = model.indexOf("\nexport function getOperationalStatus", helperStart);
  const helper = model.slice(helperStart, helperNext === -1 ? undefined : helperNext);
  assert.match(helper, /scenario\.mondayLateFxOpen !== true/);
  assert.match(helper, /localHour >= 16 && localHour < 18/);
  assert.match(helper, /dayIndex === 1/);
  assert.doesNotMatch(helper, /isMondayEarlyFxOpenHour/);
  assert.doesNotMatch(helper, /isFridayLateFxOpenHour/);
  assert.doesNotMatch(helper, /isSundayEarlyFxOpenHour/);
  assert.doesNotMatch(helper, /isSaturdayLateFxOpenHour/);
  assert.match(model, /isMondayLateFxOpenHour\(hourOffset, scenario\)/);
  const statusStart = model.indexOf("export function getOperationalStatus");
  const statusNext = model.indexOf("\nexport function ", statusStart + 1);
  const status = model.slice(statusStart, statusNext === -1 ? undefined : statusNext);
  assert.match(status, /isMondayEarlyFxOpenHour\(hourOffset, scenario\)/);
  assert.match(status, /isMondayLateFxOpenHour\(hourOffset, scenario\)/);
  assert.match(status, /isFridayLateFxOpenHour\(hourOffset, scenario\)/);
  assert.doesNotMatch(model, /Date\.now/);
});

test("older scenario JSON without mondayLateFxOpen keeps Monday evening on ordinary weekday FX depth", () => {
  assert.equal(sanitizeScenario({}).scenario.mondayLateFxOpen, false);
  assert.equal(sanitizeScenario({ mondayLateFxOpen: "true" }).scenario.mondayLateFxOpen, false);
  assert.ok(sanitizeScenario({ mondayLateFxOpen: "true" }).errors.some((error) => error.includes("mondayLateFxOpen")));
});
