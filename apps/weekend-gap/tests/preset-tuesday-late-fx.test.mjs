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

function firstTuesdayLateFxOpenHour(scenario) {
  for (let hour = 0; hour < 110; hour += 1) {
    const { dayIndex, localHour } = dayAndHourAt(hour);
    if (dayIndex === 2 && localHour >= 16 && localHour < 18 && getOperationalStatus(scenario, hour).fxWeekday) {
      const ordinary = getOperationalStatus({
        ...scenario,
        tuesdayLateFxOpen: false
      }, hour).fxWeekday;
      if (!ordinary) return hour;
    }
  }
  return null;
}

test("Tuesday late FX open keeps the Normal Friday calendar with a Tuesday afternoon FX window", () => {
  const preset = PRESETS.tuesdayLateFxOpen;
  assert.match(preset.name, /synthetic/i);
  assert.match(preset.name, /Tuesday late FX open/i);
  assert.equal(preset.tuesdayLateFxOpen, true);
  assert.equal(DEFAULT_SCENARIO.tuesdayLateFxOpen, false);
  assert.equal(preset.tuesdayEarlyFxOpen, false);
  assert.equal(preset.mondayEarlyFxOpen, false);
  assert.equal(preset.mondayLateFxOpen, false);
  assert.equal(preset.fridayLateFxOpen, false);
  assert.equal(preset.sundayEarlyFxOpen, false);
  assert.equal(preset.saturdayLateFxOpen, false);
  assert.equal(preset.mondayHoliday, false);
  assert.equal(preset.demandProfile, DEFAULT_SCENARIO.demandProfile);
  assert.equal(preset.issuerOpenStartHour, DEFAULT_SCENARIO.issuerOpenStartHour);
  assert.equal(preset.bankOpenStartHour, DEFAULT_SCENARIO.bankOpenStartHour);
  assert.equal(preset.redemptionDemandAud, DEFAULT_SCENARIO.redemptionDemandAud);
  assert.notDeepEqual(preset, PRESETS.normal);
  assert.notDeepEqual(preset, PRESETS.tuesdayEarlyFxOpen);
  assert.notDeepEqual(preset, PRESETS.mondayEarlyFxOpen);
  assert.notDeepEqual(preset, PRESETS.mondayLateFxOpen);
  assert.notDeepEqual(preset, PRESETS.fridayLateFxOpen);
  assert.notDeepEqual(preset, PRESETS.sundayEarlyFxOpen);
  assert.notDeepEqual(preset, PRESETS.saturdayLateFxOpen);
  const late = runSimulation(preset);
  const normal = runSimulation(DEFAULT_SCENARIO);
  const tuesdayEarly = runSimulation(PRESETS.tuesdayEarlyFxOpen);
  const mondayLate = runSimulation(PRESETS.mondayLateFxOpen);
  const fridayLate = runSimulation(PRESETS.fridayLateFxOpen);
  assert.equal(formatTime(97), "Tue 16:00");
  assert.equal(formatTime(98), "Tue 17:00");
  assert.equal(formatTime(99), "Tue 18:00");
  assert.equal(getOperationalStatus(preset, 97).fxWeekday, true);
  assert.equal(getOperationalStatus(preset, 98).fxWeekday, true);
  assert.equal(getOperationalStatus(DEFAULT_SCENARIO, 97).fxWeekday, true);
  assert.equal(getOperationalStatus(preset, 89).fxWeekday, true);
  assert.equal(late.timeline[65].timeLabel, "Mon 08:00");
  assert.equal(late.timeline[65].fxWeekday, true);
  assert.equal(normal.timeline[65].fxWeekday, true);
  assert.equal(tuesdayEarly.timeline[65].fxWeekday, true);
  assert.equal(mondayLate.timeline[1].fxWeekday, true);
  assert.equal(fridayLate.timeline[1].fxWeekday, true);
  assert.equal(late.timeline[1].fxWeekday, true);
  assert.equal(late.summary.finalQueuedAud, normal.summary.finalQueuedAud);
  assert.equal(late.summary.totalSettledAud, normal.summary.totalSettledAud);
  assert.equal(getOperationalStatus(preset, 97).issuerOpen, getOperationalStatus(DEFAULT_SCENARIO, 97).issuerOpen);
  assert.equal(getOperationalStatus(preset, 97).bankOpen, getOperationalStatus(DEFAULT_SCENARIO, 97).bankOpen);
  assert.equal(getOperationalStatus(preset, 97).payoutOpen, getOperationalStatus(DEFAULT_SCENARIO, 97).payoutOpen);
  assert.equal(firstTuesdayLateFxOpenHour(preset), null);
  assert.equal(firstTuesdayLateFxOpenHour(DEFAULT_SCENARIO), null);
  assert.equal(firstTuesdayLateFxOpenHour(PRESETS.tuesdayEarlyFxOpen), null);
  assert.equal(firstTuesdayLateFxOpenHour(PRESETS.mondayEarlyFxOpen), null);
  assert.equal(firstTuesdayLateFxOpenHour(PRESETS.mondayLateFxOpen), null);
  assert.equal(firstTuesdayLateFxOpenHour(PRESETS.fridayLateFxOpen), null);
  assert.equal(firstTuesdayLateFxOpenHour(PRESETS.sundayEarlyFxOpen), null);
  assert.equal(firstTuesdayLateFxOpenHour(PRESETS.saturdayLateFxOpen), null);
  const mondayHour = { dayIndex: 1, localHour: 16 };
  const tuesdayHour = dayAndHourAt(97);
  assert.equal(tuesdayHour.dayIndex, 2);
  assert.equal(tuesdayHour.localHour, 16);
  assert.notEqual(tuesdayHour.dayIndex, mondayHour.dayIndex);
  assert.equal(getOperationalStatus(PRESETS.tuesdayEarlyFxOpen, 89).fxWeekday, true);
  assert.equal(getOperationalStatus(PRESETS.mondayLateFxOpen, 73).fxWeekday, true);
});

test("Tuesday late FX open ORs into fxWeekday through isTuesdayLateFxOpenHour, not Tuesday early or Monday helpers", async () => {
  const model = await readFile(new URL("../src/model.js", import.meta.url), "utf8");
  const helperStart = model.indexOf("function isTuesdayLateFxOpenHour");
  const helperNext = model.indexOf("\nexport function getOperationalStatus", helperStart);
  const helper = model.slice(helperStart, helperNext === -1 ? undefined : helperNext);
  assert.match(helper, /scenario\.tuesdayLateFxOpen !== true/);
  assert.match(helper, /localHour >= 16 && localHour < 18/);
  assert.match(helper, /dayIndex === 2/);
  assert.doesNotMatch(helper, /isTuesdayEarlyFxOpenHour/);
  assert.doesNotMatch(helper, /isMondayEarlyFxOpenHour/);
  assert.doesNotMatch(helper, /isMondayLateFxOpenHour/);
  assert.doesNotMatch(helper, /isFridayLateFxOpenHour/);
  assert.doesNotMatch(helper, /isSundayEarlyFxOpenHour/);
  assert.doesNotMatch(helper, /isSaturdayLateFxOpenHour/);
  assert.match(model, /isTuesdayLateFxOpenHour\(hourOffset, scenario\)/);
  const statusStart = model.indexOf("export function getOperationalStatus");
  const statusNext = model.indexOf("\nexport function ", statusStart + 1);
  const status = model.slice(statusStart, statusNext === -1 ? undefined : statusNext);
  assert.match(status, /isTuesdayEarlyFxOpenHour\(hourOffset, scenario\)/);
  assert.match(status, /isTuesdayLateFxOpenHour\(hourOffset, scenario\)/);
  assert.match(status, /isMondayLateFxOpenHour\(hourOffset, scenario\)/);
  assert.match(status, /isFridayLateFxOpenHour\(hourOffset, scenario\)/);
  assert.doesNotMatch(model, /Date\.now/);
});

test("older scenario JSON without tuesdayLateFxOpen keeps Tuesday afternoon on ordinary weekday FX depth", () => {
  assert.equal(sanitizeScenario({}).scenario.tuesdayLateFxOpen, false);
  assert.equal(sanitizeScenario({ tuesdayLateFxOpen: "true" }).scenario.tuesdayLateFxOpen, false);
  assert.ok(sanitizeScenario({ tuesdayLateFxOpen: "true" }).errors.some((error) => error.includes("tuesdayLateFxOpen")));
});

test("Tuesday late FX open is available as a preset button and is not an FX feed", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  assert.match(html, /data-preset="tuesdayLateFxOpen"/);
  assert.match(html, /Tuesday late FX open \(synthetic\)/);
  assert.match(html, /id="tuesdayLateFxOpen"/);
  assert.match(html, /Keep Tuesday FX open 16:00 to 18:00/);
  assert.match(html, /not an FX feed/i);
  assert.doesNotMatch(html, /live queue/i);
});
