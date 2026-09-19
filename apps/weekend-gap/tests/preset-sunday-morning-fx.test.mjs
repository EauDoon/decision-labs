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

function firstSundayMorningFxOpenHour(scenario) {
  for (let hour = 0; hour < 72; hour += 1) {
    const { dayIndex, localHour } = dayAndHourAt(hour);
    if (dayIndex === 0 && localHour >= 10 && localHour < 12 && getOperationalStatus(scenario, hour).fxWeekday) {
      const ordinary = getOperationalStatus({
        ...scenario,
        sundayMorningFxOpen: false
      }, hour).fxWeekday;
      if (!ordinary) return hour;
    }
  }
  return null;
}

test("Sunday morning FX open keeps the Normal Friday calendar with a Sunday morning FX window", () => {
  const preset = PRESETS.sundayMorningFxOpen;
  assert.match(preset.name, /synthetic/i);
  assert.match(preset.name, /Sunday morning FX open/i);
  assert.equal(preset.sundayMorningFxOpen, true);
  assert.equal(DEFAULT_SCENARIO.sundayMorningFxOpen, false);
  assert.equal(preset.sundayAfternoonFxOpen, false);
  assert.equal(preset.sundayMiddayFxOpen, false);
  assert.equal(preset.saturdayAfternoonFxOpen, false);
  assert.equal(preset.saturdayMiddayFxOpen, false);
  assert.equal(preset.saturdayEarlyFxOpen, false);
  assert.equal(preset.saturdayLateFxOpen, false);
  assert.equal(preset.sundayEarlyFxOpen, false);
  assert.equal(preset.sundayLateFxOpen, false);
  assert.equal(preset.fridayEarlyFxOpen, false);
  assert.equal(preset.fridayLateFxOpen, false);
  assert.equal(preset.demandProfile, DEFAULT_SCENARIO.demandProfile);
  assert.notDeepEqual(preset, PRESETS.normal);
  assert.notDeepEqual(preset, PRESETS.sundayAfternoonFxOpen);
  assert.notDeepEqual(preset, PRESETS.saturdayAfternoonFxOpen);
  assert.notDeepEqual(preset, PRESETS.sundayMiddayFxOpen);
  assert.notDeepEqual(preset, PRESETS.saturdayMiddayFxOpen);
  assert.notDeepEqual(preset, PRESETS.sundayLateFxOpen);
  assert.notDeepEqual(preset, PRESETS.sundayEarlyFxOpen);
  const morning = runSimulation(preset);
  const normal = runSimulation(DEFAULT_SCENARIO);
  const sundayAfternoon = runSimulation(PRESETS.sundayAfternoonFxOpen);
  const saturdayAfternoon = runSimulation(PRESETS.saturdayAfternoonFxOpen);
  const sundayMidday = runSimulation(PRESETS.sundayMiddayFxOpen);
  const sundayLate = runSimulation(PRESETS.sundayLateFxOpen);
  const sundayEarly = runSimulation(PRESETS.sundayEarlyFxOpen);
  assert.equal(formatTime(41), "Sun 08:00");
  assert.equal(formatTime(42), "Sun 09:00");
  assert.equal(formatTime(43), "Sun 10:00");
  assert.equal(formatTime(44), "Sun 11:00");
  assert.equal(formatTime(45), "Sun 12:00");
  assert.equal(formatTime(46), "Sun 13:00");
  assert.equal(formatTime(47), "Sun 14:00");
  assert.equal(formatTime(48), "Sun 15:00");
  assert.equal(formatTime(49), "Sun 16:00");
  assert.equal(formatTime(23), "Sat 14:00");
  assert.equal(morning.timeline[43].timeLabel, "Sun 10:00");
  assert.equal(morning.timeline[43].weekend, true);
  assert.equal(morning.timeline[43].fxWeekday, true);
  assert.equal(normal.timeline[43].fxWeekday, false);
  assert.equal(morning.timeline[44].timeLabel, "Sun 11:00");
  assert.equal(morning.timeline[44].fxWeekday, true);
  assert.equal(morning.timeline[45].timeLabel, "Sun 12:00");
  assert.equal(morning.timeline[45].fxWeekday, false);
  assert.equal(sundayMidday.timeline[45].fxWeekday, true);
  assert.equal(morning.timeline[41].fxWeekday, false);
  assert.equal(sundayEarly.timeline[41].fxWeekday, true);
  assert.equal(morning.timeline[47].fxWeekday, false);
  assert.equal(sundayAfternoon.timeline[47].fxWeekday, true);
  assert.equal(morning.timeline[49].fxWeekday, false);
  assert.equal(sundayLate.timeline[49].fxWeekday, true);
  assert.equal(saturdayAfternoon.timeline[23].fxWeekday, true);
  assert.equal(morning.timeline[23].fxWeekday, false);
  assert.equal(morning.timeline[43].issuerOpen, false);
  assert.equal(morning.timeline[43].bankOpen, false);
  assert.equal(morning.timeline[43].payoutOpen, false);
  assert.equal(getOperationalStatus(preset, 43).fxWeekday, true);
  assert.equal(getOperationalStatus(DEFAULT_SCENARIO, 43).fxWeekday, false);
  assert.equal(getOperationalStatus(PRESETS.sundayMiddayFxOpen, 45).fxWeekday, true);
  assert.equal(getOperationalStatus(preset, 45).fxWeekday, false);
  assert.equal(getOperationalStatus(PRESETS.sundayAfternoonFxOpen, 47).fxWeekday, true);
  assert.equal(getOperationalStatus(preset, 47).fxWeekday, false);
  assert.equal(getOperationalStatus(PRESETS.sundayLateFxOpen, 49).fxWeekday, true);
  assert.equal(getOperationalStatus(preset, 49).fxWeekday, false);
  assert.equal(getOperationalStatus(PRESETS.sundayEarlyFxOpen, 41).fxWeekday, true);
  assert.equal(getOperationalStatus(preset, 41).fxWeekday, false);
  assert.equal(getOperationalStatus(PRESETS.saturdayAfternoonFxOpen, 23).fxWeekday, true);
  assert.equal(getOperationalStatus(preset, 23).fxWeekday, false);
  const morningOpen = firstSundayMorningFxOpenHour(preset);
  assert.equal(morningOpen, 43);
  assert.equal(firstSundayMorningFxOpenHour(DEFAULT_SCENARIO), null);
  assert.equal(firstSundayMorningFxOpenHour(PRESETS.sundayAfternoonFxOpen), null);
  assert.equal(firstSundayMorningFxOpenHour(PRESETS.saturdayAfternoonFxOpen), null);
  assert.equal(firstSundayMorningFxOpenHour(PRESETS.sundayMiddayFxOpen), null);
  assert.equal(firstSundayMorningFxOpenHour(PRESETS.sundayLateFxOpen), null);
  assert.equal(firstSundayMorningFxOpenHour(PRESETS.sundayEarlyFxOpen), null);
  assert.ok(morningOpen > 42);
  assert.ok(morningOpen < 45);
  const sundayMorning = dayAndHourAt(43);
  const sundayNoon = dayAndHourAt(45);
  const sundayAfternoonHour = dayAndHourAt(47);
  const sundayLateHour = dayAndHourAt(49);
  const sundayEarlyHour = dayAndHourAt(41);
  const saturdayAfternoonHour = dayAndHourAt(23);
  assert.equal(sundayMorning.dayIndex, 0);
  assert.equal(sundayMorning.localHour, 10);
  assert.equal(sundayNoon.dayIndex, 0);
  assert.equal(sundayNoon.localHour, 12);
  assert.equal(sundayAfternoonHour.dayIndex, 0);
  assert.equal(sundayAfternoonHour.localHour, 14);
  assert.equal(sundayLateHour.dayIndex, 0);
  assert.equal(sundayLateHour.localHour, 16);
  assert.equal(sundayEarlyHour.dayIndex, 0);
  assert.equal(sundayEarlyHour.localHour, 8);
  assert.equal(saturdayAfternoonHour.dayIndex, 6);
  assert.equal(saturdayAfternoonHour.localHour, 14);
  assert.notEqual(sundayMorning.localHour, sundayNoon.localHour);
  assert.notEqual(sundayMorning.localHour, sundayAfternoonHour.localHour);
  assert.notEqual(sundayMorning.localHour, sundayLateHour.localHour);
  assert.notEqual(sundayMorning.localHour, sundayEarlyHour.localHour);
  assert.notEqual(sundayMorning.dayIndex, saturdayAfternoonHour.dayIndex);
});

test("Sunday morning FX open ORs into fxWeekday through isSundayMorningFxOpenHour after sundayAfternoonFxOpen", async () => {
  const model = await readFile(new URL("../src/model.js", import.meta.url), "utf8");
  const helperStart = model.indexOf("function isSundayMorningFxOpenHour");
  const helperNext = model.indexOf("function isSaturdayEveningFxOpenHour", helperStart);
  const commentStart = model.lastIndexOf("/** Sunday 10:00-12:00", helperStart);
  const helper = model.slice(commentStart === -1 ? helperStart : commentStart, helperNext === -1 ? undefined : helperNext);
  assert.match(helper, /scenario\.sundayMorningFxOpen !== true/);
  assert.match(helper, /localHour >= 10 && localHour < 12/);
  assert.match(helper, /dayIndex === 0/);
  assert.match(helper, /sundayAfternoonFxOpen/);
  assert.match(helper, /sundayMiddayFxOpen/);
  assert.match(helper, /sundayLateFxOpen/);
  assert.match(helper, /sundayEarlyFxOpen/);
  assert.match(helper, /saturdayAfternoonFxOpen/);
  assert.match(helper, /saturdayEveningFxOpen/);
  assert.doesNotMatch(helper, /isSundayAfternoonFxOpenHour/);
  assert.doesNotMatch(helper, /isSundayMiddayFxOpenHour/);
  assert.doesNotMatch(helper, /isSundayLateFxOpenHour/);
  assert.doesNotMatch(helper, /isSundayEarlyFxOpenHour/);
  assert.match(model, /isSundayMorningFxOpenHour\(hourOffset, scenario\)/);
  const afternoonStart = model.indexOf("function isSundayAfternoonFxOpenHour");
  const morningStart = model.indexOf("function isSundayMorningFxOpenHour");
  const statusStart = model.indexOf("export function getOperationalStatus");
  assert.ok(afternoonStart !== -1 && morningStart > afternoonStart);
  assert.ok(morningStart !== -1 && statusStart > morningStart);
  const statusNext = model.indexOf("\nexport function ", statusStart + 1);
  const status = model.slice(statusStart, statusNext === -1 ? undefined : statusNext);
  assert.match(status, /isSundayAfternoonFxOpenHour\(hourOffset, scenario\)/);
  assert.match(status, /isSundayMorningFxOpenHour\(hourOffset, scenario\)/);
  const sundayAfternoonCall = status.indexOf("isSundayAfternoonFxOpenHour(hourOffset, scenario)");
  const sundayMorningCall = status.indexOf("isSundayMorningFxOpenHour(hourOffset, scenario)");
  assert.ok(sundayAfternoonCall !== -1 && sundayMorningCall > sundayAfternoonCall);
  assert.doesNotMatch(model, /Date\.now/);
});

test("older scenario JSON without sundayMorningFxOpen keeps Sunday morning on ordinary weekend FX depth", () => {
  assert.equal(sanitizeScenario({}).scenario.sundayMorningFxOpen, false);
  assert.equal(sanitizeScenario({ sundayMorningFxOpen: "true" }).scenario.sundayMorningFxOpen, false);
  assert.ok(sanitizeScenario({ sundayMorningFxOpen: "true" }).errors.some((error) => error.includes("sundayMorningFxOpen")));
});

test("Sunday morning FX open is available as a preset button and is not an FX feed", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  const sundayAfternoonPreset = html.indexOf('data-preset="sundayAfternoonFxOpen"');
  const sundayMorningPreset = html.indexOf('data-preset="sundayMorningFxOpen"');
  assert.ok(sundayAfternoonPreset !== -1 && sundayMorningPreset > sundayAfternoonPreset);
  assert.match(html, /Sunday morning FX open \(synthetic\)/);
  assert.match(html, /id="sundayMorningFxOpen"/);
  assert.match(html, /Keep Sunday FX open 10:00 to 12:00/);
  assert.match(html, /Keep Sunday FX open 14:00 to 16:00/);
  assert.match(html, /not an FX feed/i);
  assert.doesNotMatch(html, /live queue/i);
});
