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

function firstThursdayEarlyFxOpenHour(scenario) {
  for (let hour = 0; hour < 160; hour += 1) {
    const { dayIndex, localHour } = dayAndHourAt(hour);
    if (dayIndex === 4 && localHour >= 8 && localHour < 10 && getOperationalStatus(scenario, hour).fxWeekday) {
      const ordinary = getOperationalStatus({
        ...scenario,
        thursdayEarlyFxOpen: false
      }, hour).fxWeekday;
      if (!ordinary) return hour;
    }
  }
  return null;
}

test("Thursday early FX open keeps the Normal Friday calendar with a Thursday morning FX window", () => {
  const preset = PRESETS.thursdayEarlyFxOpen;
  assert.match(preset.name, /synthetic/i);
  assert.match(preset.name, /Thursday early FX open/i);
  assert.equal(preset.thursdayEarlyFxOpen, true);
  assert.equal(DEFAULT_SCENARIO.thursdayEarlyFxOpen, false);
  assert.equal(preset.wednesdayLateFxOpen, false);
  assert.equal(preset.wednesdayEarlyFxOpen, false);
  assert.equal(preset.tuesdayLateFxOpen, false);
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
  assert.notDeepEqual(preset, PRESETS.wednesdayLateFxOpen);
  assert.notDeepEqual(preset, PRESETS.wednesdayEarlyFxOpen);
  assert.notDeepEqual(preset, PRESETS.tuesdayLateFxOpen);
  assert.notDeepEqual(preset, PRESETS.tuesdayEarlyFxOpen);
  assert.notDeepEqual(preset, PRESETS.mondayEarlyFxOpen);
  assert.notDeepEqual(preset, PRESETS.mondayLateFxOpen);
  assert.notDeepEqual(preset, PRESETS.fridayLateFxOpen);
  assert.notDeepEqual(preset, PRESETS.sundayEarlyFxOpen);
  assert.notDeepEqual(preset, PRESETS.saturdayLateFxOpen);
  const early = runSimulation(preset);
  const normal = runSimulation(DEFAULT_SCENARIO);
  const wednesdayLate = runSimulation(PRESETS.wednesdayLateFxOpen);
  const wednesdayEarly = runSimulation(PRESETS.wednesdayEarlyFxOpen);
  const tuesdayLate = runSimulation(PRESETS.tuesdayLateFxOpen);
  const tuesdayEarly = runSimulation(PRESETS.tuesdayEarlyFxOpen);
  const mondayLate = runSimulation(PRESETS.mondayLateFxOpen);
  const fridayLate = runSimulation(PRESETS.fridayLateFxOpen);
  assert.equal(formatTime(137), "Thu 08:00");
  assert.equal(formatTime(138), "Thu 09:00");
  assert.equal(formatTime(139), "Thu 10:00");
  assert.equal(getOperationalStatus(preset, 137).fxWeekday, true);
  assert.equal(getOperationalStatus(preset, 138).fxWeekday, true);
  assert.equal(getOperationalStatus(DEFAULT_SCENARIO, 137).fxWeekday, true);
  assert.equal(getOperationalStatus(preset, 113).fxWeekday, true);
  assert.equal(early.timeline[65].timeLabel, "Mon 08:00");
  assert.equal(early.timeline[65].fxWeekday, true);
  assert.equal(normal.timeline[65].fxWeekday, true);
  assert.equal(wednesdayLate.timeline[65].fxWeekday, true);
  assert.equal(wednesdayEarly.timeline[65].fxWeekday, true);
  assert.equal(tuesdayLate.timeline[65].fxWeekday, true);
  assert.equal(tuesdayEarly.timeline[65].fxWeekday, true);
  assert.equal(mondayLate.timeline[1].fxWeekday, true);
  assert.equal(fridayLate.timeline[1].fxWeekday, true);
  assert.equal(early.timeline[1].fxWeekday, true);
  assert.equal(early.summary.finalQueuedAud, normal.summary.finalQueuedAud);
  assert.equal(early.summary.totalSettledAud, normal.summary.totalSettledAud);
  assert.equal(getOperationalStatus(preset, 137).issuerOpen, getOperationalStatus(DEFAULT_SCENARIO, 137).issuerOpen);
  assert.equal(getOperationalStatus(preset, 137).bankOpen, getOperationalStatus(DEFAULT_SCENARIO, 137).bankOpen);
  assert.equal(getOperationalStatus(preset, 137).payoutOpen, getOperationalStatus(DEFAULT_SCENARIO, 137).payoutOpen);
  assert.equal(firstThursdayEarlyFxOpenHour(preset), null);
  assert.equal(firstThursdayEarlyFxOpenHour(DEFAULT_SCENARIO), null);
  assert.equal(firstThursdayEarlyFxOpenHour(PRESETS.wednesdayLateFxOpen), null);
  assert.equal(firstThursdayEarlyFxOpenHour(PRESETS.wednesdayEarlyFxOpen), null);
  assert.equal(firstThursdayEarlyFxOpenHour(PRESETS.tuesdayLateFxOpen), null);
  assert.equal(firstThursdayEarlyFxOpenHour(PRESETS.tuesdayEarlyFxOpen), null);
  assert.equal(firstThursdayEarlyFxOpenHour(PRESETS.mondayEarlyFxOpen), null);
  assert.equal(firstThursdayEarlyFxOpenHour(PRESETS.mondayLateFxOpen), null);
  assert.equal(firstThursdayEarlyFxOpenHour(PRESETS.fridayLateFxOpen), null);
  assert.equal(firstThursdayEarlyFxOpenHour(PRESETS.sundayEarlyFxOpen), null);
  assert.equal(firstThursdayEarlyFxOpenHour(PRESETS.saturdayLateFxOpen), null);
  const wednesdayHour = { dayIndex: 3, localHour: 8 };
  const thursdayHour = dayAndHourAt(137);
  assert.equal(thursdayHour.dayIndex, 4);
  assert.equal(thursdayHour.localHour, 8);
  assert.notEqual(thursdayHour.dayIndex, wednesdayHour.dayIndex);
  assert.equal(getOperationalStatus(PRESETS.wednesdayLateFxOpen, 121).fxWeekday, true);
  assert.equal(getOperationalStatus(PRESETS.wednesdayEarlyFxOpen, 113).fxWeekday, true);
  assert.equal(getOperationalStatus(PRESETS.tuesdayLateFxOpen, 97).fxWeekday, true);
  assert.equal(getOperationalStatus(PRESETS.tuesdayEarlyFxOpen, 89).fxWeekday, true);
  assert.equal(getOperationalStatus(PRESETS.mondayLateFxOpen, 73).fxWeekday, true);
});

test("Thursday early FX open ORs into fxWeekday through isThursdayEarlyFxOpenHour, not Wednesday late or Wednesday early helpers", async () => {
  const model = await readFile(new URL("../src/model.js", import.meta.url), "utf8");
  const helperStart = model.indexOf("function isThursdayEarlyFxOpenHour");
  const helperNext = model.indexOf("\nexport function getOperationalStatus", helperStart);
  const helper = model.slice(helperStart, helperNext === -1 ? undefined : helperNext);
  assert.match(helper, /scenario\.thursdayEarlyFxOpen !== true/);
  assert.match(helper, /localHour >= 8 && localHour < 10/);
  assert.match(helper, /dayIndex === 4/);
  assert.doesNotMatch(helper, /isWednesdayLateFxOpenHour/);
  assert.doesNotMatch(helper, /isWednesdayEarlyFxOpenHour/);
  assert.doesNotMatch(helper, /isTuesdayLateFxOpenHour/);
  assert.doesNotMatch(helper, /isTuesdayEarlyFxOpenHour/);
  assert.doesNotMatch(helper, /isMondayEarlyFxOpenHour/);
  assert.doesNotMatch(helper, /isMondayLateFxOpenHour/);
  assert.doesNotMatch(helper, /isFridayLateFxOpenHour/);
  assert.doesNotMatch(helper, /isSundayEarlyFxOpenHour/);
  assert.doesNotMatch(helper, /isSaturdayLateFxOpenHour/);
  assert.match(model, /isThursdayEarlyFxOpenHour\(hourOffset, scenario\)/);
  const statusStart = model.indexOf("export function getOperationalStatus");
  const statusNext = model.indexOf("\nexport function ", statusStart + 1);
  const status = model.slice(statusStart, statusNext === -1 ? undefined : statusNext);
  assert.match(status, /isWednesdayEarlyFxOpenHour\(hourOffset, scenario\)/);
  assert.match(status, /isWednesdayLateFxOpenHour\(hourOffset, scenario\)/);
  assert.match(status, /isThursdayEarlyFxOpenHour\(hourOffset, scenario\)/);
  assert.match(status, /isTuesdayLateFxOpenHour\(hourOffset, scenario\)/);
  assert.match(status, /isMondayLateFxOpenHour\(hourOffset, scenario\)/);
  assert.match(status, /isFridayLateFxOpenHour\(hourOffset, scenario\)/);
  assert.doesNotMatch(model, /Date\.now/);
});

test("older scenario JSON without thursdayEarlyFxOpen keeps Thursday morning on ordinary weekday FX depth", () => {
  assert.equal(sanitizeScenario({}).scenario.thursdayEarlyFxOpen, false);
  assert.equal(sanitizeScenario({ thursdayEarlyFxOpen: "true" }).scenario.thursdayEarlyFxOpen, false);
  assert.ok(sanitizeScenario({ thursdayEarlyFxOpen: "true" }).errors.some((error) => error.includes("thursdayEarlyFxOpen")));
});

test("Thursday early FX open is available as a preset button and is not an FX feed", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  assert.match(html, /data-preset="thursdayEarlyFxOpen"/);
  assert.match(html, /Thursday early FX open \(synthetic\)/);
  assert.match(html, /id="thursdayEarlyFxOpen"/);
  assert.match(html, /Keep Thursday FX open 08:00 to 10:00/);
  assert.match(html, /not an FX feed/i);
  assert.doesNotMatch(html, /live queue/i);
});
