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

function firstMondayEarlyFxOpenHour(scenario) {
  for (let hour = 0; hour < 72; hour += 1) {
    const { dayIndex, localHour } = dayAndHourAt(hour);
    if (dayIndex === 1 && localHour >= 8 && localHour < 10 && getOperationalStatus(scenario, hour).fxWeekday) {
      const ordinary = getOperationalStatus({
        ...scenario,
        mondayEarlyFxOpen: false
      }, hour).fxWeekday;
      if (!ordinary) return hour;
    }
  }
  return null;
}

test("Monday early FX open keeps the Normal Friday calendar with a Monday morning FX window", () => {
  const preset = PRESETS.mondayEarlyFxOpen;
  assert.match(preset.name, /synthetic/i);
  assert.match(preset.name, /Monday early FX open/i);
  assert.equal(preset.mondayEarlyFxOpen, true);
  assert.equal(DEFAULT_SCENARIO.mondayEarlyFxOpen, false);
  assert.equal(preset.sundayEarlyFxOpen, false);
  assert.equal(preset.fridayLateFxOpen, false);
  assert.equal(preset.sundayLateFxOpen, false);
  assert.equal(preset.saturdayLateFxOpen, false);
  assert.equal(preset.mondayHoliday, false);
  assert.equal(preset.demandProfile, DEFAULT_SCENARIO.demandProfile);
  assert.equal(preset.issuerOpenStartHour, DEFAULT_SCENARIO.issuerOpenStartHour);
  assert.equal(preset.bankOpenStartHour, DEFAULT_SCENARIO.bankOpenStartHour);
  assert.equal(preset.redemptionDemandAud, DEFAULT_SCENARIO.redemptionDemandAud);
  assert.notDeepEqual(preset, PRESETS.normal);
  assert.notDeepEqual(preset, PRESETS.sundayEarlyFxOpen);
  assert.notDeepEqual(preset, PRESETS.fridayLateFxOpen);
  assert.notDeepEqual(preset, PRESETS.earlyMondayBankOpen);
  const early = runSimulation(preset);
  const normal = runSimulation(DEFAULT_SCENARIO);
  const sundayEarly = runSimulation(PRESETS.sundayEarlyFxOpen);
  const fridayLate = runSimulation(PRESETS.fridayLateFxOpen);
  assert.equal(early.timeline[65].timeLabel, "Mon 08:00");
  assert.equal(formatTime(65), "Mon 08:00");
  assert.equal(early.timeline[65].weekend, false);
  assert.equal(early.timeline[65].fxWeekday, true);
  assert.equal(normal.timeline[65].fxWeekday, true);
  assert.equal(sundayEarly.timeline[65].fxWeekday, true);
  assert.equal(early.timeline[66].timeLabel, "Mon 09:00");
  assert.equal(early.timeline[66].fxWeekday, true);
  assert.equal(early.timeline[67].timeLabel, "Mon 10:00");
  assert.equal(early.timeline[67].fxWeekday, true);
  assert.equal(sundayEarly.timeline[41].timeLabel, "Sun 08:00");
  assert.equal(sundayEarly.timeline[41].fxWeekday, true);
  assert.equal(early.timeline[41].fxWeekday, false);
  assert.equal(fridayLate.timeline[1].fxWeekday, true);
  assert.equal(getOperationalStatus(preset, 65).fxWeekday, true);
  assert.equal(getOperationalStatus(DEFAULT_SCENARIO, 65).fxWeekday, true);
  assert.equal(firstMondayEarlyFxOpenHour(preset), null);
  assert.equal(firstMondayEarlyFxOpenHour(DEFAULT_SCENARIO), null);
  assert.equal(firstMondayEarlyFxOpenHour(PRESETS.sundayEarlyFxOpen), null);
  assert.equal(firstMondayEarlyFxOpenHour(PRESETS.fridayLateFxOpen), null);
  const holiday = { ...DEFAULT_SCENARIO, mondayHoliday: true };
  const holidayEarly = { ...DEFAULT_SCENARIO, mondayHoliday: true, mondayEarlyFxOpen: true };
  assert.equal(runSimulation(holiday).timeline[65].fxWeekday, false);
  assert.equal(runSimulation(holidayEarly).timeline[65].fxWeekday, true);
  assert.equal(runSimulation(holidayEarly).timeline[66].fxWeekday, true);
  assert.equal(runSimulation(holidayEarly).timeline[67].fxWeekday, false);
  assert.equal(runSimulation(holidayEarly).timeline[41].fxWeekday, false);
  assert.equal(firstMondayEarlyFxOpenHour(holidayEarly), 65);
  assert.equal(firstMondayEarlyFxOpenHour(holiday), null);
  assert.ok(firstMondayEarlyFxOpenHour(holidayEarly) > 57);
  assert.ok(firstMondayEarlyFxOpenHour(holidayEarly) < 71);
});

test("Monday early FX open ORs into fxWeekday through isMondayEarlyFxOpenHour, not Sunday early or Friday late helpers", async () => {
  const model = await readFile(new URL("../src/model.js", import.meta.url), "utf8");
  const helperStart = model.indexOf("function isMondayEarlyFxOpenHour");
  const helperNext = model.indexOf("\nexport function getOperationalStatus", helperStart);
  const helper = model.slice(helperStart, helperNext === -1 ? undefined : helperNext);
  assert.match(helper, /scenario\.mondayEarlyFxOpen !== true/);
  assert.match(helper, /localHour >= 8 && localHour < 10/);
  assert.match(helper, /dayIndex === 1/);
  assert.doesNotMatch(helper, /isSundayEarlyFxOpenHour/);
  assert.doesNotMatch(helper, /isFridayLateFxOpenHour/);
  assert.doesNotMatch(helper, /isSundayLateFxOpenHour/);
  assert.match(model, /isMondayEarlyFxOpenHour\(hourOffset, scenario\)/);
  const statusStart = model.indexOf("export function getOperationalStatus");
  const statusNext = model.indexOf("\nexport function ", statusStart + 1);
  const status = model.slice(statusStart, statusNext === -1 ? undefined : statusNext);
  assert.match(status, /isSundayEarlyFxOpenHour\(hourOffset, scenario\)/);
  assert.match(status, /isMondayEarlyFxOpenHour\(hourOffset, scenario\)/);
  assert.match(status, /isFridayLateFxOpenHour\(hourOffset, scenario\)/);
  assert.doesNotMatch(model, /Date\.now/);
});

test("older scenario JSON without mondayEarlyFxOpen keeps Monday morning on ordinary weekday FX depth", () => {
  assert.equal(sanitizeScenario({}).scenario.mondayEarlyFxOpen, false);
  assert.equal(sanitizeScenario({ mondayEarlyFxOpen: "true" }).scenario.mondayEarlyFxOpen, false);
  assert.ok(sanitizeScenario({ mondayEarlyFxOpen: "true" }).errors.some((error) => error.includes("mondayEarlyFxOpen")));
});

test("Monday early FX open is available as a preset button and is not an FX feed", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  assert.match(html, /data-preset="mondayEarlyFxOpen"/);
  assert.match(html, /Monday early FX open \(synthetic\)/);
  assert.match(html, /id="mondayEarlyFxOpen"/);
  assert.match(html, /Keep Monday FX open 08:00 to 10:00/);
  assert.match(html, /not an FX feed/i);
  assert.doesNotMatch(html, /live queue/i);
});
