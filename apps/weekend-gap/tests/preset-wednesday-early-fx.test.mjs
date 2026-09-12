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

function firstWednesdayEarlyFxOpenHour(scenario) {
  for (let hour = 0; hour < 130; hour += 1) {
    const { dayIndex, localHour } = dayAndHourAt(hour);
    if (dayIndex === 3 && localHour >= 8 && localHour < 10 && getOperationalStatus(scenario, hour).fxWeekday) {
      const ordinary = getOperationalStatus({
        ...scenario,
        wednesdayEarlyFxOpen: false
      }, hour).fxWeekday;
      if (!ordinary) return hour;
    }
  }
  return null;
}

test("Wednesday early FX open keeps the Normal Friday calendar with a Wednesday morning FX window", () => {
  const preset = PRESETS.wednesdayEarlyFxOpen;
  assert.match(preset.name, /synthetic/i);
  assert.match(preset.name, /Wednesday early FX open/i);
  assert.equal(preset.wednesdayEarlyFxOpen, true);
  assert.equal(DEFAULT_SCENARIO.wednesdayEarlyFxOpen, false);
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
  assert.notDeepEqual(preset, PRESETS.tuesdayLateFxOpen);
  assert.notDeepEqual(preset, PRESETS.tuesdayEarlyFxOpen);
  assert.notDeepEqual(preset, PRESETS.mondayEarlyFxOpen);
  assert.notDeepEqual(preset, PRESETS.mondayLateFxOpen);
  assert.notDeepEqual(preset, PRESETS.fridayLateFxOpen);
  assert.notDeepEqual(preset, PRESETS.sundayEarlyFxOpen);
  assert.notDeepEqual(preset, PRESETS.saturdayLateFxOpen);
  const early = runSimulation(preset);
  const normal = runSimulation(DEFAULT_SCENARIO);
  const tuesdayLate = runSimulation(PRESETS.tuesdayLateFxOpen);
  const tuesdayEarly = runSimulation(PRESETS.tuesdayEarlyFxOpen);
  const mondayLate = runSimulation(PRESETS.mondayLateFxOpen);
  const fridayLate = runSimulation(PRESETS.fridayLateFxOpen);
  assert.equal(formatTime(113), "Wed 08:00");
  assert.equal(formatTime(114), "Wed 09:00");
  assert.equal(formatTime(115), "Wed 10:00");
  assert.equal(getOperationalStatus(preset, 113).fxWeekday, true);
  assert.equal(getOperationalStatus(preset, 114).fxWeekday, true);
  assert.equal(getOperationalStatus(DEFAULT_SCENARIO, 113).fxWeekday, true);
  assert.equal(getOperationalStatus(preset, 89).fxWeekday, true);
  assert.equal(early.timeline[65].timeLabel, "Mon 08:00");
  assert.equal(early.timeline[65].fxWeekday, true);
  assert.equal(normal.timeline[65].fxWeekday, true);
  assert.equal(tuesdayLate.timeline[65].fxWeekday, true);
  assert.equal(tuesdayEarly.timeline[65].fxWeekday, true);
  assert.equal(mondayLate.timeline[1].fxWeekday, true);
  assert.equal(fridayLate.timeline[1].fxWeekday, true);
  assert.equal(early.timeline[1].fxWeekday, true);
  assert.equal(early.summary.finalQueuedAud, normal.summary.finalQueuedAud);
  assert.equal(early.summary.totalSettledAud, normal.summary.totalSettledAud);
  assert.equal(getOperationalStatus(preset, 113).issuerOpen, getOperationalStatus(DEFAULT_SCENARIO, 113).issuerOpen);
  assert.equal(getOperationalStatus(preset, 113).bankOpen, getOperationalStatus(DEFAULT_SCENARIO, 113).bankOpen);
  assert.equal(getOperationalStatus(preset, 113).payoutOpen, getOperationalStatus(DEFAULT_SCENARIO, 113).payoutOpen);
  assert.equal(firstWednesdayEarlyFxOpenHour(preset), null);
  assert.equal(firstWednesdayEarlyFxOpenHour(DEFAULT_SCENARIO), null);
  assert.equal(firstWednesdayEarlyFxOpenHour(PRESETS.tuesdayLateFxOpen), null);
  assert.equal(firstWednesdayEarlyFxOpenHour(PRESETS.tuesdayEarlyFxOpen), null);
  assert.equal(firstWednesdayEarlyFxOpenHour(PRESETS.mondayEarlyFxOpen), null);
  assert.equal(firstWednesdayEarlyFxOpenHour(PRESETS.mondayLateFxOpen), null);
  assert.equal(firstWednesdayEarlyFxOpenHour(PRESETS.fridayLateFxOpen), null);
  assert.equal(firstWednesdayEarlyFxOpenHour(PRESETS.sundayEarlyFxOpen), null);
  assert.equal(firstWednesdayEarlyFxOpenHour(PRESETS.saturdayLateFxOpen), null);
  const tuesdayHour = { dayIndex: 2, localHour: 16 };
  const wednesdayHour = dayAndHourAt(113);
  assert.equal(wednesdayHour.dayIndex, 3);
  assert.equal(wednesdayHour.localHour, 8);
  assert.notEqual(wednesdayHour.dayIndex, tuesdayHour.dayIndex);
  assert.equal(getOperationalStatus(PRESETS.tuesdayLateFxOpen, 97).fxWeekday, true);
  assert.equal(getOperationalStatus(PRESETS.tuesdayEarlyFxOpen, 89).fxWeekday, true);
  assert.equal(getOperationalStatus(PRESETS.mondayLateFxOpen, 73).fxWeekday, true);
});

test("Wednesday early FX open ORs into fxWeekday through isWednesdayEarlyFxOpenHour, not Tuesday late or Tuesday early helpers", async () => {
  const model = await readFile(new URL("../src/model.js", import.meta.url), "utf8");
  const helperStart = model.indexOf("function isWednesdayEarlyFxOpenHour");
  const helperNext = model.indexOf("\nexport function getOperationalStatus", helperStart);
  const helper = model.slice(helperStart, helperNext === -1 ? undefined : helperNext);
  assert.match(helper, /scenario\.wednesdayEarlyFxOpen !== true/);
  assert.match(helper, /localHour >= 8 && localHour < 10/);
  assert.match(helper, /dayIndex === 3/);
  assert.doesNotMatch(helper, /isTuesdayLateFxOpenHour/);
  assert.doesNotMatch(helper, /isTuesdayEarlyFxOpenHour/);
  assert.doesNotMatch(helper, /isMondayEarlyFxOpenHour/);
  assert.doesNotMatch(helper, /isMondayLateFxOpenHour/);
  assert.doesNotMatch(helper, /isFridayLateFxOpenHour/);
  assert.doesNotMatch(helper, /isSundayEarlyFxOpenHour/);
  assert.doesNotMatch(helper, /isSaturdayLateFxOpenHour/);
  assert.match(model, /isWednesdayEarlyFxOpenHour\(hourOffset, scenario\)/);
  const statusStart = model.indexOf("export function getOperationalStatus");
  const statusNext = model.indexOf("\nexport function ", statusStart + 1);
  const status = model.slice(statusStart, statusNext === -1 ? undefined : statusNext);
  assert.match(status, /isTuesdayEarlyFxOpenHour\(hourOffset, scenario\)/);
  assert.match(status, /isTuesdayLateFxOpenHour\(hourOffset, scenario\)/);
  assert.match(status, /isWednesdayEarlyFxOpenHour\(hourOffset, scenario\)/);
  assert.match(status, /isMondayLateFxOpenHour\(hourOffset, scenario\)/);
  assert.match(status, /isFridayLateFxOpenHour\(hourOffset, scenario\)/);
  assert.doesNotMatch(model, /Date\.now/);
});

test("older scenario JSON without wednesdayEarlyFxOpen keeps Wednesday morning on ordinary weekday FX depth", () => {
  assert.equal(sanitizeScenario({}).scenario.wednesdayEarlyFxOpen, false);
  assert.equal(sanitizeScenario({ wednesdayEarlyFxOpen: "true" }).scenario.wednesdayEarlyFxOpen, false);
  assert.ok(sanitizeScenario({ wednesdayEarlyFxOpen: "true" }).errors.some((error) => error.includes("wednesdayEarlyFxOpen")));
});

test("Wednesday early FX open is available as a preset button and is not an FX feed", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  assert.match(html, /data-preset="wednesdayEarlyFxOpen"/);
  assert.match(html, /Wednesday early FX open \(synthetic\)/);
  assert.match(html, /id="wednesdayEarlyFxOpen"/);
  assert.match(html, /Keep Wednesday FX open 08:00 to 10:00/);
  assert.match(html, /not an FX feed/i);
  assert.doesNotMatch(html, /live queue/i);
});
