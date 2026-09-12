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

function firstWednesdayLateFxOpenHour(scenario) {
  for (let hour = 0; hour < 130; hour += 1) {
    const { dayIndex, localHour } = dayAndHourAt(hour);
    if (dayIndex === 3 && localHour >= 16 && localHour < 18 && getOperationalStatus(scenario, hour).fxWeekday) {
      const ordinary = getOperationalStatus({
        ...scenario,
        wednesdayLateFxOpen: false
      }, hour).fxWeekday;
      if (!ordinary) return hour;
    }
  }
  return null;
}

test("Wednesday late FX open keeps the Normal Friday calendar with a Wednesday afternoon FX window", () => {
  const preset = PRESETS.wednesdayLateFxOpen;
  assert.match(preset.name, /synthetic/i);
  assert.match(preset.name, /Wednesday late FX open/i);
  assert.equal(preset.wednesdayLateFxOpen, true);
  assert.equal(DEFAULT_SCENARIO.wednesdayLateFxOpen, false);
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
  const wednesdayEarly = runSimulation(PRESETS.wednesdayEarlyFxOpen);
  const tuesdayLate = runSimulation(PRESETS.tuesdayLateFxOpen);
  const tuesdayEarly = runSimulation(PRESETS.tuesdayEarlyFxOpen);
  const mondayLate = runSimulation(PRESETS.mondayLateFxOpen);
  const fridayLate = runSimulation(PRESETS.fridayLateFxOpen);
  assert.equal(formatTime(121), "Wed 16:00");
  assert.equal(formatTime(122), "Wed 17:00");
  assert.equal(formatTime(123), "Wed 18:00");
  assert.equal(getOperationalStatus(preset, 121).fxWeekday, true);
  assert.equal(getOperationalStatus(preset, 122).fxWeekday, true);
  assert.equal(getOperationalStatus(DEFAULT_SCENARIO, 121).fxWeekday, true);
  assert.equal(getOperationalStatus(preset, 113).fxWeekday, true);
  assert.equal(late.timeline[65].timeLabel, "Mon 08:00");
  assert.equal(late.timeline[65].fxWeekday, true);
  assert.equal(normal.timeline[65].fxWeekday, true);
  assert.equal(wednesdayEarly.timeline[65].fxWeekday, true);
  assert.equal(tuesdayLate.timeline[65].fxWeekday, true);
  assert.equal(tuesdayEarly.timeline[65].fxWeekday, true);
  assert.equal(mondayLate.timeline[1].fxWeekday, true);
  assert.equal(fridayLate.timeline[1].fxWeekday, true);
  assert.equal(late.timeline[1].fxWeekday, true);
  assert.equal(late.summary.finalQueuedAud, normal.summary.finalQueuedAud);
  assert.equal(late.summary.totalSettledAud, normal.summary.totalSettledAud);
  assert.equal(getOperationalStatus(preset, 121).issuerOpen, getOperationalStatus(DEFAULT_SCENARIO, 121).issuerOpen);
  assert.equal(getOperationalStatus(preset, 121).bankOpen, getOperationalStatus(DEFAULT_SCENARIO, 121).bankOpen);
  assert.equal(getOperationalStatus(preset, 121).payoutOpen, getOperationalStatus(DEFAULT_SCENARIO, 121).payoutOpen);
  assert.equal(firstWednesdayLateFxOpenHour(preset), null);
  assert.equal(firstWednesdayLateFxOpenHour(DEFAULT_SCENARIO), null);
  assert.equal(firstWednesdayLateFxOpenHour(PRESETS.wednesdayEarlyFxOpen), null);
  assert.equal(firstWednesdayLateFxOpenHour(PRESETS.tuesdayLateFxOpen), null);
  assert.equal(firstWednesdayLateFxOpenHour(PRESETS.tuesdayEarlyFxOpen), null);
  assert.equal(firstWednesdayLateFxOpenHour(PRESETS.mondayEarlyFxOpen), null);
  assert.equal(firstWednesdayLateFxOpenHour(PRESETS.mondayLateFxOpen), null);
  assert.equal(firstWednesdayLateFxOpenHour(PRESETS.fridayLateFxOpen), null);
  assert.equal(firstWednesdayLateFxOpenHour(PRESETS.sundayEarlyFxOpen), null);
  assert.equal(firstWednesdayLateFxOpenHour(PRESETS.saturdayLateFxOpen), null);
  const tuesdayHour = { dayIndex: 2, localHour: 16 };
  const wednesdayEarlyHour = dayAndHourAt(113);
  const wednesdayHour = dayAndHourAt(121);
  assert.equal(wednesdayHour.dayIndex, 3);
  assert.equal(wednesdayHour.localHour, 16);
  assert.equal(wednesdayEarlyHour.dayIndex, 3);
  assert.equal(wednesdayEarlyHour.localHour, 8);
  assert.notEqual(wednesdayHour.dayIndex, tuesdayHour.dayIndex);
  assert.notEqual(wednesdayHour.localHour, wednesdayEarlyHour.localHour);
  assert.equal(getOperationalStatus(PRESETS.wednesdayEarlyFxOpen, 113).fxWeekday, true);
  assert.equal(getOperationalStatus(PRESETS.tuesdayLateFxOpen, 97).fxWeekday, true);
  assert.equal(getOperationalStatus(PRESETS.tuesdayEarlyFxOpen, 89).fxWeekday, true);
  assert.equal(getOperationalStatus(PRESETS.mondayLateFxOpen, 73).fxWeekday, true);
});

test("Wednesday late FX open ORs into fxWeekday through isWednesdayLateFxOpenHour, not Wednesday early or Tuesday late helpers", async () => {
  const model = await readFile(new URL("../src/model.js", import.meta.url), "utf8");
  const helperStart = model.indexOf("function isWednesdayLateFxOpenHour");
  const helperNext = model.indexOf("\nexport function getOperationalStatus", helperStart);
  const helper = model.slice(helperStart, helperNext === -1 ? undefined : helperNext);
  assert.match(helper, /scenario\.wednesdayLateFxOpen !== true/);
  assert.match(helper, /localHour >= 16 && localHour < 18/);
  assert.match(helper, /dayIndex === 3/);
  assert.doesNotMatch(helper, /isWednesdayEarlyFxOpenHour/);
  assert.doesNotMatch(helper, /isTuesdayLateFxOpenHour/);
  assert.doesNotMatch(helper, /isTuesdayEarlyFxOpenHour/);
  assert.doesNotMatch(helper, /isMondayEarlyFxOpenHour/);
  assert.doesNotMatch(helper, /isMondayLateFxOpenHour/);
  assert.doesNotMatch(helper, /isFridayLateFxOpenHour/);
  assert.doesNotMatch(helper, /isSundayEarlyFxOpenHour/);
  assert.doesNotMatch(helper, /isSaturdayLateFxOpenHour/);
  assert.match(model, /isWednesdayLateFxOpenHour\(hourOffset, scenario\)/);
  const statusStart = model.indexOf("export function getOperationalStatus");
  const statusNext = model.indexOf("\nexport function ", statusStart + 1);
  const status = model.slice(statusStart, statusNext === -1 ? undefined : statusNext);
  assert.match(status, /isWednesdayEarlyFxOpenHour\(hourOffset, scenario\)/);
  assert.match(status, /isWednesdayLateFxOpenHour\(hourOffset, scenario\)/);
  assert.match(status, /isTuesdayLateFxOpenHour\(hourOffset, scenario\)/);
  assert.match(status, /isTuesdayEarlyFxOpenHour\(hourOffset, scenario\)/);
  assert.match(status, /isMondayLateFxOpenHour\(hourOffset, scenario\)/);
  assert.match(status, /isFridayLateFxOpenHour\(hourOffset, scenario\)/);
  assert.doesNotMatch(model, /Date\.now/);
});

test("older scenario JSON without wednesdayLateFxOpen keeps Wednesday afternoon on ordinary weekday FX depth", () => {
  assert.equal(sanitizeScenario({}).scenario.wednesdayLateFxOpen, false);
  assert.equal(sanitizeScenario({ wednesdayLateFxOpen: "true" }).scenario.wednesdayLateFxOpen, false);
  assert.ok(sanitizeScenario({ wednesdayLateFxOpen: "true" }).errors.some((error) => error.includes("wednesdayLateFxOpen")));
});

test("Wednesday late FX open is available as a preset button and is not an FX feed", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  assert.match(html, /data-preset="wednesdayLateFxOpen"/);
  assert.match(html, /Wednesday late FX open \(synthetic\)/);
  assert.match(html, /id="wednesdayLateFxOpen"/);
  assert.match(html, /Keep Wednesday FX open 16:00 to 18:00/);
  assert.match(html, /not an FX feed/i);
  assert.doesNotMatch(html, /live queue/i);
});
