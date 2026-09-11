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

function firstTuesdayEarlyFxOpenHour(scenario) {
  for (let hour = 0; hour < 96; hour += 1) {
    const { dayIndex, localHour } = dayAndHourAt(hour);
    if (dayIndex === 2 && localHour >= 8 && localHour < 10 && getOperationalStatus(scenario, hour).fxWeekday) {
      const ordinary = getOperationalStatus({
        ...scenario,
        tuesdayEarlyFxOpen: false
      }, hour).fxWeekday;
      if (!ordinary) return hour;
    }
  }
  return null;
}

test("Tuesday early FX open keeps the Normal Friday calendar with a Tuesday morning FX window", () => {
  const preset = PRESETS.tuesdayEarlyFxOpen;
  assert.match(preset.name, /synthetic/i);
  assert.match(preset.name, /Tuesday early FX open/i);
  assert.equal(preset.tuesdayEarlyFxOpen, true);
  assert.equal(DEFAULT_SCENARIO.tuesdayEarlyFxOpen, false);
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
  assert.notDeepEqual(preset, PRESETS.mondayEarlyFxOpen);
  assert.notDeepEqual(preset, PRESETS.mondayLateFxOpen);
  assert.notDeepEqual(preset, PRESETS.fridayLateFxOpen);
  assert.notDeepEqual(preset, PRESETS.sundayEarlyFxOpen);
  assert.notDeepEqual(preset, PRESETS.saturdayLateFxOpen);
  const early = runSimulation(preset);
  const normal = runSimulation(DEFAULT_SCENARIO);
  const mondayEarly = runSimulation(PRESETS.mondayEarlyFxOpen);
  const mondayLate = runSimulation(PRESETS.mondayLateFxOpen);
  const fridayLate = runSimulation(PRESETS.fridayLateFxOpen);
  assert.equal(formatTime(89), "Tue 08:00");
  assert.equal(formatTime(90), "Tue 09:00");
  assert.equal(formatTime(91), "Tue 10:00");
  assert.equal(getOperationalStatus(preset, 89).fxWeekday, true);
  assert.equal(getOperationalStatus(preset, 90).fxWeekday, true);
  assert.equal(getOperationalStatus(DEFAULT_SCENARIO, 89).fxWeekday, true);
  assert.equal(getOperationalStatus(preset, 65).fxWeekday, true);
  assert.equal(early.timeline[65].timeLabel, "Mon 08:00");
  assert.equal(early.timeline[65].fxWeekday, true);
  assert.equal(normal.timeline[65].fxWeekday, true);
  assert.equal(mondayEarly.timeline[65].fxWeekday, true);
  assert.equal(mondayLate.timeline[1].fxWeekday, true);
  assert.equal(fridayLate.timeline[1].fxWeekday, true);
  assert.equal(early.timeline[1].fxWeekday, true);
  assert.equal(early.summary.finalQueuedAud, normal.summary.finalQueuedAud);
  assert.equal(early.summary.totalSettledAud, normal.summary.totalSettledAud);
  assert.equal(getOperationalStatus(preset, 89).issuerOpen, getOperationalStatus(DEFAULT_SCENARIO, 89).issuerOpen);
  assert.equal(getOperationalStatus(preset, 89).bankOpen, getOperationalStatus(DEFAULT_SCENARIO, 89).bankOpen);
  assert.equal(getOperationalStatus(preset, 89).payoutOpen, getOperationalStatus(DEFAULT_SCENARIO, 89).payoutOpen);
  assert.equal(firstTuesdayEarlyFxOpenHour(preset), null);
  assert.equal(firstTuesdayEarlyFxOpenHour(DEFAULT_SCENARIO), null);
  assert.equal(firstTuesdayEarlyFxOpenHour(PRESETS.mondayEarlyFxOpen), null);
  assert.equal(firstTuesdayEarlyFxOpenHour(PRESETS.mondayLateFxOpen), null);
  assert.equal(firstTuesdayEarlyFxOpenHour(PRESETS.fridayLateFxOpen), null);
  assert.equal(firstTuesdayEarlyFxOpenHour(PRESETS.sundayEarlyFxOpen), null);
  assert.equal(firstTuesdayEarlyFxOpenHour(PRESETS.saturdayLateFxOpen), null);
  const mondayHour = { dayIndex: 1, localHour: 8 };
  const tuesdayHour = dayAndHourAt(89);
  assert.equal(tuesdayHour.dayIndex, 2);
  assert.equal(tuesdayHour.localHour, 8);
  assert.notEqual(tuesdayHour.dayIndex, mondayHour.dayIndex);
  assert.equal(getOperationalStatus(PRESETS.mondayEarlyFxOpen, 65).fxWeekday, true);
  assert.equal(getOperationalStatus(PRESETS.mondayLateFxOpen, 73).fxWeekday, true);
});

test("Tuesday early FX open ORs into fxWeekday through isTuesdayEarlyFxOpenHour, not Monday or Friday helpers", async () => {
  const model = await readFile(new URL("../src/model.js", import.meta.url), "utf8");
  const helperStart = model.indexOf("function isTuesdayEarlyFxOpenHour");
  const helperNext = model.indexOf("\nexport function getOperationalStatus", helperStart);
  const helper = model.slice(helperStart, helperNext === -1 ? undefined : helperNext);
  assert.match(helper, /scenario\.tuesdayEarlyFxOpen !== true/);
  assert.match(helper, /localHour >= 8 && localHour < 10/);
  assert.match(helper, /dayIndex === 2/);
  assert.doesNotMatch(helper, /isMondayEarlyFxOpenHour/);
  assert.doesNotMatch(helper, /isMondayLateFxOpenHour/);
  assert.doesNotMatch(helper, /isFridayLateFxOpenHour/);
  assert.doesNotMatch(helper, /isSundayEarlyFxOpenHour/);
  assert.doesNotMatch(helper, /isSaturdayLateFxOpenHour/);
  assert.match(model, /isTuesdayEarlyFxOpenHour\(hourOffset, scenario\)/);
  const statusStart = model.indexOf("export function getOperationalStatus");
  const statusNext = model.indexOf("\nexport function ", statusStart + 1);
  const status = model.slice(statusStart, statusNext === -1 ? undefined : statusNext);
  assert.match(status, /isMondayEarlyFxOpenHour\(hourOffset, scenario\)/);
  assert.match(status, /isMondayLateFxOpenHour\(hourOffset, scenario\)/);
  assert.match(status, /isTuesdayEarlyFxOpenHour\(hourOffset, scenario\)/);
  assert.match(status, /isFridayLateFxOpenHour\(hourOffset, scenario\)/);
  assert.doesNotMatch(model, /Date\.now/);
});

test("older scenario JSON without tuesdayEarlyFxOpen keeps Tuesday morning on ordinary weekday FX depth", () => {
  assert.equal(sanitizeScenario({}).scenario.tuesdayEarlyFxOpen, false);
  assert.equal(sanitizeScenario({ tuesdayEarlyFxOpen: "true" }).scenario.tuesdayEarlyFxOpen, false);
  assert.ok(sanitizeScenario({ tuesdayEarlyFxOpen: "true" }).errors.some((error) => error.includes("tuesdayEarlyFxOpen")));
});

test("Tuesday early FX open is available as a preset button and is not an FX feed", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  assert.match(html, /data-preset="tuesdayEarlyFxOpen"/);
  assert.match(html, /Tuesday early FX open \(synthetic\)/);
  assert.match(html, /id="tuesdayEarlyFxOpen"/);
  assert.match(html, /Keep Tuesday FX open 08:00 to 10:00/);
  assert.match(html, /not an FX feed/i);
  assert.doesNotMatch(html, /live queue/i);
});
