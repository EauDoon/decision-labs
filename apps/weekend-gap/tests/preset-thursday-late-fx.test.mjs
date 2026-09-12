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

function firstThursdayLateFxOpenHour(scenario) {
  for (let hour = 0; hour < 160; hour += 1) {
    const { dayIndex, localHour } = dayAndHourAt(hour);
    if (dayIndex === 4 && localHour >= 16 && localHour < 18 && getOperationalStatus(scenario, hour).fxWeekday) {
      const ordinary = getOperationalStatus({
        ...scenario,
        thursdayLateFxOpen: false
      }, hour).fxWeekday;
      if (!ordinary) return hour;
    }
  }
  return null;
}

test("Thursday late FX open keeps the Normal Friday calendar with a Thursday afternoon FX window", () => {
  const preset = PRESETS.thursdayLateFxOpen;
  assert.match(preset.name, /synthetic/i);
  assert.match(preset.name, /Thursday late FX open/i);
  assert.equal(preset.thursdayLateFxOpen, true);
  assert.equal(DEFAULT_SCENARIO.thursdayLateFxOpen, false);
  assert.equal(preset.thursdayEarlyFxOpen, false);
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
  assert.notDeepEqual(preset, PRESETS.thursdayEarlyFxOpen);
  assert.notDeepEqual(preset, PRESETS.wednesdayLateFxOpen);
  assert.notDeepEqual(preset, PRESETS.wednesdayEarlyFxOpen);
  assert.notDeepEqual(preset, PRESETS.tuesdayLateFxOpen);
  assert.notDeepEqual(preset, PRESETS.tuesdayEarlyFxOpen);
  assert.notDeepEqual(preset, PRESETS.mondayEarlyFxOpen);
  assert.notDeepEqual(preset, PRESETS.mondayLateFxOpen);
  assert.notDeepEqual(preset, PRESETS.fridayLateFxOpen);
  assert.notDeepEqual(preset, PRESETS.sundayEarlyFxOpen);
  assert.notDeepEqual(preset, PRESETS.saturdayLateFxOpen);
  const late = runSimulation(preset);
  const normal = runSimulation(DEFAULT_SCENARIO);
  const thursdayEarly = runSimulation(PRESETS.thursdayEarlyFxOpen);
  const wednesdayLate = runSimulation(PRESETS.wednesdayLateFxOpen);
  const wednesdayEarly = runSimulation(PRESETS.wednesdayEarlyFxOpen);
  const tuesdayLate = runSimulation(PRESETS.tuesdayLateFxOpen);
  const mondayLate = runSimulation(PRESETS.mondayLateFxOpen);
  const fridayLate = runSimulation(PRESETS.fridayLateFxOpen);
  assert.equal(formatTime(145), "Thu 16:00");
  assert.equal(formatTime(146), "Thu 17:00");
  assert.equal(formatTime(147), "Thu 18:00");
  assert.equal(getOperationalStatus(preset, 145).fxWeekday, true);
  assert.equal(getOperationalStatus(preset, 146).fxWeekday, true);
  assert.equal(getOperationalStatus(DEFAULT_SCENARIO, 145).fxWeekday, true);
  assert.equal(getOperationalStatus(preset, 137).fxWeekday, true);
  assert.equal(late.timeline[65].timeLabel, "Mon 08:00");
  assert.equal(late.timeline[65].fxWeekday, true);
  assert.equal(normal.timeline[65].fxWeekday, true);
  assert.equal(thursdayEarly.timeline[65].fxWeekday, true);
  assert.equal(wednesdayLate.timeline[65].fxWeekday, true);
  assert.equal(wednesdayEarly.timeline[65].fxWeekday, true);
  assert.equal(tuesdayLate.timeline[65].fxWeekday, true);
  assert.equal(mondayLate.timeline[1].fxWeekday, true);
  assert.equal(fridayLate.timeline[1].fxWeekday, true);
  assert.equal(late.timeline[1].fxWeekday, true);
  assert.equal(late.summary.finalQueuedAud, normal.summary.finalQueuedAud);
  assert.equal(late.summary.totalSettledAud, normal.summary.totalSettledAud);
  assert.equal(getOperationalStatus(preset, 145).issuerOpen, getOperationalStatus(DEFAULT_SCENARIO, 145).issuerOpen);
  assert.equal(getOperationalStatus(preset, 145).bankOpen, getOperationalStatus(DEFAULT_SCENARIO, 145).bankOpen);
  assert.equal(getOperationalStatus(preset, 145).payoutOpen, getOperationalStatus(DEFAULT_SCENARIO, 145).payoutOpen);
  assert.equal(firstThursdayLateFxOpenHour(preset), null);
  assert.equal(firstThursdayLateFxOpenHour(DEFAULT_SCENARIO), null);
  assert.equal(firstThursdayLateFxOpenHour(PRESETS.thursdayEarlyFxOpen), null);
  assert.equal(firstThursdayLateFxOpenHour(PRESETS.wednesdayLateFxOpen), null);
  assert.equal(firstThursdayLateFxOpenHour(PRESETS.wednesdayEarlyFxOpen), null);
  assert.equal(firstThursdayLateFxOpenHour(PRESETS.tuesdayLateFxOpen), null);
  assert.equal(firstThursdayLateFxOpenHour(PRESETS.tuesdayEarlyFxOpen), null);
  assert.equal(firstThursdayLateFxOpenHour(PRESETS.mondayEarlyFxOpen), null);
  assert.equal(firstThursdayLateFxOpenHour(PRESETS.mondayLateFxOpen), null);
  assert.equal(firstThursdayLateFxOpenHour(PRESETS.fridayLateFxOpen), null);
  assert.equal(firstThursdayLateFxOpenHour(PRESETS.sundayEarlyFxOpen), null);
  assert.equal(firstThursdayLateFxOpenHour(PRESETS.saturdayLateFxOpen), null);
  const wednesdayAfternoon = { dayIndex: 3, localHour: 16 };
  const thursdayMorning = dayAndHourAt(137);
  const thursdayAfternoon = dayAndHourAt(145);
  assert.equal(thursdayAfternoon.dayIndex, 4);
  assert.equal(thursdayAfternoon.localHour, 16);
  assert.notEqual(thursdayAfternoon.dayIndex, wednesdayAfternoon.dayIndex);
  assert.notEqual(thursdayAfternoon.localHour, thursdayMorning.localHour);
  assert.equal(getOperationalStatus(PRESETS.thursdayEarlyFxOpen, 137).fxWeekday, true);
  assert.equal(getOperationalStatus(PRESETS.wednesdayLateFxOpen, 121).fxWeekday, true);
  assert.equal(getOperationalStatus(PRESETS.wednesdayEarlyFxOpen, 113).fxWeekday, true);
  assert.equal(getOperationalStatus(PRESETS.tuesdayLateFxOpen, 97).fxWeekday, true);
  assert.equal(getOperationalStatus(PRESETS.mondayLateFxOpen, 73).fxWeekday, true);
});

test("Thursday late FX open ORs into fxWeekday through isThursdayLateFxOpenHour, not the Thursday early or Wednesday late helpers", async () => {
  const model = await readFile(new URL("../src/model.js", import.meta.url), "utf8");
  const helperStart = model.indexOf("function isThursdayLateFxOpenHour");
  const helperNext = model.indexOf("\nexport function getOperationalStatus", helperStart);
  const helper = model.slice(helperStart, helperNext === -1 ? undefined : helperNext);
  assert.match(helper, /scenario\.thursdayLateFxOpen !== true/);
  assert.match(helper, /localHour >= 16 && localHour < 18/);
  assert.match(helper, /dayIndex === 4/);
  assert.doesNotMatch(helper, /isThursdayEarlyFxOpenHour/);
  assert.doesNotMatch(helper, /isWednesdayLateFxOpenHour/);
  assert.doesNotMatch(helper, /isWednesdayEarlyFxOpenHour/);
  assert.doesNotMatch(helper, /isTuesdayLateFxOpenHour/);
  assert.doesNotMatch(helper, /isTuesdayEarlyFxOpenHour/);
  assert.doesNotMatch(helper, /isMondayEarlyFxOpenHour/);
  assert.doesNotMatch(helper, /isMondayLateFxOpenHour/);
  assert.doesNotMatch(helper, /isFridayLateFxOpenHour/);
  assert.doesNotMatch(helper, /isSundayEarlyFxOpenHour/);
  assert.doesNotMatch(helper, /isSaturdayLateFxOpenHour/);
  assert.match(model, /isThursdayLateFxOpenHour\(hourOffset, scenario\)/);
  const earlyStart = model.indexOf("function isThursdayEarlyFxOpenHour");
  const earlyNext = model.indexOf("\n/** Thursday 16:00-18:00", earlyStart);
  const early = model.slice(earlyStart, earlyNext === -1 ? undefined : earlyNext);
  assert.match(early, /localHour >= 8 && localHour < 10/);
  assert.doesNotMatch(early, /thursdayLateFxOpen !== true/);
  const statusStart = model.indexOf("export function getOperationalStatus");
  const statusNext = model.indexOf("\nexport function ", statusStart + 1);
  const status = model.slice(statusStart, statusNext === -1 ? undefined : statusNext);
  assert.match(status, /isThursdayEarlyFxOpenHour\(hourOffset, scenario\)/);
  assert.match(status, /isThursdayLateFxOpenHour\(hourOffset, scenario\)/);
  assert.match(status, /isWednesdayLateFxOpenHour\(hourOffset, scenario\)/);
  assert.match(status, /isTuesdayLateFxOpenHour\(hourOffset, scenario\)/);
  assert.match(status, /isMondayLateFxOpenHour\(hourOffset, scenario\)/);
  assert.match(status, /isFridayLateFxOpenHour\(hourOffset, scenario\)/);
  assert.doesNotMatch(model, /Date\.now/);
});

test("older scenario JSON without thursdayLateFxOpen keeps Thursday afternoon on ordinary weekday FX depth", () => {
  assert.equal(sanitizeScenario({}).scenario.thursdayLateFxOpen, false);
  assert.equal(sanitizeScenario({ thursdayLateFxOpen: "true" }).scenario.thursdayLateFxOpen, false);
  assert.ok(sanitizeScenario({ thursdayLateFxOpen: "true" }).errors.some((error) => error.includes("thursdayLateFxOpen")));
});

test("Thursday late FX open is available as a preset button and is not an FX feed", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  assert.match(html, /data-preset="thursdayLateFxOpen"/);
  assert.match(html, /Thursday late FX open \(synthetic\)/);
  assert.match(html, /id="thursdayLateFxOpen"/);
  assert.match(html, /Keep Thursday FX open 16:00 to 18:00/);
  assert.match(html, /Keep Thursday FX open 08:00 to 10:00/);
  assert.match(html, /not an FX feed/i);
  assert.doesNotMatch(html, /live queue/i);
});
