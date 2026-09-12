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

function firstFridayEarlyFxOpenHour(scenario) {
  for (let hour = 0; hour < 180; hour += 1) {
    const { dayIndex, localHour } = dayAndHourAt(hour);
    if (dayIndex === 5 && localHour >= 8 && localHour < 10 && getOperationalStatus(scenario, hour).fxWeekday) {
      const ordinary = getOperationalStatus({
        ...scenario,
        fridayEarlyFxOpen: false
      }, hour).fxWeekday;
      if (!ordinary) return hour;
    }
  }
  return null;
}

test("Friday early FX open keeps the Normal Friday calendar with a Friday morning FX window", () => {
  const preset = PRESETS.fridayEarlyFxOpen;
  assert.match(preset.name, /synthetic/i);
  assert.match(preset.name, /Friday early FX open/i);
  assert.equal(preset.fridayEarlyFxOpen, true);
  assert.equal(DEFAULT_SCENARIO.fridayEarlyFxOpen, false);
  assert.equal(preset.thursdayLateFxOpen, false);
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
  assert.notDeepEqual(preset, PRESETS.thursdayLateFxOpen);
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
  const early = runSimulation(preset);
  const normal = runSimulation(DEFAULT_SCENARIO);
  const thursdayLate = runSimulation(PRESETS.thursdayLateFxOpen);
  const thursdayEarly = runSimulation(PRESETS.thursdayEarlyFxOpen);
  const wednesdayLate = runSimulation(PRESETS.wednesdayLateFxOpen);
  const tuesdayLate = runSimulation(PRESETS.tuesdayLateFxOpen);
  const mondayLate = runSimulation(PRESETS.mondayLateFxOpen);
  const fridayLate = runSimulation(PRESETS.fridayLateFxOpen);
  assert.equal(formatTime(161), "Fri 08:00");
  assert.equal(formatTime(162), "Fri 09:00");
  assert.equal(formatTime(163), "Fri 10:00");
  assert.equal(getOperationalStatus(preset, 161).fxWeekday, true);
  assert.equal(getOperationalStatus(preset, 162).fxWeekday, true);
  assert.equal(getOperationalStatus(DEFAULT_SCENARIO, 161).fxWeekday, true);
  assert.equal(getOperationalStatus(preset, 145).fxWeekday, true);
  assert.equal(early.timeline[65].timeLabel, "Mon 08:00");
  assert.equal(early.timeline[65].fxWeekday, true);
  assert.equal(normal.timeline[65].fxWeekday, true);
  assert.equal(thursdayLate.timeline[65].fxWeekday, true);
  assert.equal(thursdayEarly.timeline[65].fxWeekday, true);
  assert.equal(wednesdayLate.timeline[65].fxWeekday, true);
  assert.equal(tuesdayLate.timeline[65].fxWeekday, true);
  assert.equal(mondayLate.timeline[1].fxWeekday, true);
  assert.equal(fridayLate.timeline[1].fxWeekday, true);
  assert.equal(early.timeline[1].fxWeekday, true);
  assert.equal(early.summary.finalQueuedAud, normal.summary.finalQueuedAud);
  assert.equal(early.summary.totalSettledAud, normal.summary.totalSettledAud);
  assert.equal(getOperationalStatus(preset, 161).issuerOpen, getOperationalStatus(DEFAULT_SCENARIO, 161).issuerOpen);
  assert.equal(getOperationalStatus(preset, 161).bankOpen, getOperationalStatus(DEFAULT_SCENARIO, 161).bankOpen);
  assert.equal(getOperationalStatus(preset, 161).payoutOpen, getOperationalStatus(DEFAULT_SCENARIO, 161).payoutOpen);
  assert.equal(firstFridayEarlyFxOpenHour(preset), null);
  assert.equal(firstFridayEarlyFxOpenHour(DEFAULT_SCENARIO), null);
  assert.equal(firstFridayEarlyFxOpenHour(PRESETS.thursdayLateFxOpen), null);
  assert.equal(firstFridayEarlyFxOpenHour(PRESETS.thursdayEarlyFxOpen), null);
  assert.equal(firstFridayEarlyFxOpenHour(PRESETS.wednesdayLateFxOpen), null);
  assert.equal(firstFridayEarlyFxOpenHour(PRESETS.wednesdayEarlyFxOpen), null);
  assert.equal(firstFridayEarlyFxOpenHour(PRESETS.tuesdayLateFxOpen), null);
  assert.equal(firstFridayEarlyFxOpenHour(PRESETS.tuesdayEarlyFxOpen), null);
  assert.equal(firstFridayEarlyFxOpenHour(PRESETS.mondayEarlyFxOpen), null);
  assert.equal(firstFridayEarlyFxOpenHour(PRESETS.mondayLateFxOpen), null);
  assert.equal(firstFridayEarlyFxOpenHour(PRESETS.fridayLateFxOpen), null);
  assert.equal(firstFridayEarlyFxOpenHour(PRESETS.sundayEarlyFxOpen), null);
  assert.equal(firstFridayEarlyFxOpenHour(PRESETS.saturdayLateFxOpen), null);
  const thursdayAfternoon = { dayIndex: 4, localHour: 16 };
  const fridayLateHour = dayAndHourAt(1);
  const fridayMorning = dayAndHourAt(161);
  assert.equal(fridayMorning.dayIndex, 5);
  assert.equal(fridayMorning.localHour, 8);
  assert.notEqual(fridayMorning.dayIndex, thursdayAfternoon.dayIndex);
  assert.notEqual(fridayMorning.localHour, fridayLateHour.localHour);
  assert.equal(fridayLateHour.dayIndex, 5);
  assert.equal(fridayLateHour.localHour, 16);
  assert.equal(getOperationalStatus(PRESETS.fridayLateFxOpen, 1).fxWeekday, true);
  assert.equal(getOperationalStatus(PRESETS.thursdayLateFxOpen, 145).fxWeekday, true);
  assert.equal(getOperationalStatus(PRESETS.thursdayEarlyFxOpen, 137).fxWeekday, true);
  assert.equal(getOperationalStatus(PRESETS.wednesdayLateFxOpen, 121).fxWeekday, true);
  assert.equal(getOperationalStatus(PRESETS.mondayLateFxOpen, 73).fxWeekday, true);
});

test("Friday early FX open ORs into fxWeekday through isFridayEarlyFxOpenHour, not Friday late or Thursday late helpers", async () => {
  const model = await readFile(new URL("../src/model.js", import.meta.url), "utf8");
  const helperStart = model.indexOf("function isFridayEarlyFxOpenHour");
  const helperNext = model.indexOf("\nexport function getOperationalStatus", helperStart);
  const helper = model.slice(helperStart, helperNext === -1 ? undefined : helperNext);
  assert.match(helper, /scenario\.fridayEarlyFxOpen !== true/);
  assert.match(helper, /localHour >= 8 && localHour < 10/);
  assert.match(helper, /dayIndex === 5/);
  assert.match(helper, /isFridayLateFxOpenHour/);
  assert.match(helper, /isFridayLateFxHour/);
  assert.match(helper, /isFridayEarlyIssuerHour/);
  assert.match(helper, /isFridayEarlyBankHour/);
  assert.match(helper, /isFridayEarlyPayoutHour/);
  assert.match(helper, /isThursdayLateFxOpenHour/);
  assert.doesNotMatch(helper, /isFridayLateFxOpenHour\(hourOffset/);
  assert.doesNotMatch(helper, /isFridayLateFxHour\(hourOffset/);
  assert.doesNotMatch(helper, /isFridayEarlyIssuerHour\(/);
  assert.doesNotMatch(helper, /isFridayEarlyBankHour\(/);
  assert.doesNotMatch(helper, /isFridayEarlyPayoutHour\(/);
  assert.doesNotMatch(helper, /isThursdayLateFxOpenHour\(hourOffset/);
  assert.doesNotMatch(helper, /isThursdayEarlyFxOpenHour/);
  assert.doesNotMatch(helper, /isWednesdayLateFxOpenHour/);
  assert.match(model, /isFridayEarlyFxOpenHour\(hourOffset, scenario\)/);
  const lateStart = model.indexOf("function isFridayLateFxOpenHour");
  const lateNext = model.indexOf("\n/** Saturday 16:00-18:00", lateStart);
  const late = model.slice(lateStart, lateNext === -1 ? undefined : lateNext);
  assert.match(late, /localHour >= 16 && localHour < 18/);
  assert.doesNotMatch(late, /fridayEarlyFxOpen !== true/);
  const statusStart = model.indexOf("export function getOperationalStatus");
  const statusNext = model.indexOf("\nexport function ", statusStart + 1);
  const status = model.slice(statusStart, statusNext === -1 ? undefined : statusNext);
  assert.match(status, /isThursdayEarlyFxOpenHour\(hourOffset, scenario\)/);
  assert.match(status, /isThursdayLateFxOpenHour\(hourOffset, scenario\)/);
  assert.match(status, /isFridayEarlyFxOpenHour\(hourOffset, scenario\)/);
  assert.match(status, /isFridayLateFxOpenHour\(hourOffset, scenario\)/);
  const thursdayLateCall = status.indexOf("isThursdayLateFxOpenHour(hourOffset, scenario)");
  const fridayEarlyCall = status.indexOf("isFridayEarlyFxOpenHour(hourOffset, scenario)");
  assert.ok(thursdayLateCall !== -1 && fridayEarlyCall > thursdayLateCall);
  assert.doesNotMatch(model, /Date\.now/);
});

test("older scenario JSON without fridayEarlyFxOpen keeps Friday morning on ordinary weekday FX depth", () => {
  assert.equal(sanitizeScenario({}).scenario.fridayEarlyFxOpen, false);
  assert.equal(sanitizeScenario({ fridayEarlyFxOpen: "true" }).scenario.fridayEarlyFxOpen, false);
  assert.ok(sanitizeScenario({ fridayEarlyFxOpen: "true" }).errors.some((error) => error.includes("fridayEarlyFxOpen")));
});

test("Friday early FX open is available as a preset button and is not an FX feed", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  const thursdayPreset = html.indexOf('data-preset="thursdayLateFxOpen"');
  const fridayPreset = html.indexOf('data-preset="fridayEarlyFxOpen"');
  assert.ok(thursdayPreset !== -1 && fridayPreset > thursdayPreset);
  assert.match(html, /Friday early FX open \(synthetic\)/);
  assert.match(html, /id="fridayEarlyFxOpen"/);
  assert.match(html, /Keep Friday FX open 08:00 to 10:00/);
  assert.match(html, /Keep Thursday FX open 16:00 to 18:00/);
  assert.match(html, /not an FX feed/i);
  assert.doesNotMatch(html, /live queue/i);
});
