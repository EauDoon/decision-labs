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

function firstSaturdayLateNightFxOpenHour(scenario) {
  for (let hour = 0; hour < 72; hour += 1) {
    const { dayIndex, localHour } = dayAndHourAt(hour);
    if (dayIndex === 6 && localHour >= 22 && localHour < 24 && getOperationalStatus(scenario, hour).fxWeekday) {
      const ordinary = getOperationalStatus({
        ...scenario,
        saturdayLateNightFxOpen: false
      }, hour).fxWeekday;
      if (!ordinary) return hour;
    }
  }
  return null;
}

test("Saturday late-night FX open keeps the Normal Friday calendar with a Saturday late-night FX window", () => {
  const preset = PRESETS.saturdayLateNightFxOpen;
  assert.match(preset.name, /synthetic/i);
  assert.match(preset.name, /Saturday late-night FX open/i);
  assert.equal(preset.saturdayLateNightFxOpen, true);
  assert.equal(DEFAULT_SCENARIO.saturdayLateNightFxOpen, false);
  assert.equal(preset.saturdayNightFxOpen, false);
  assert.equal(preset.sundayPredawnFxOpen, false);
  assert.equal(preset.sundayDawnFxOpen, false);
  assert.equal(preset.sundayDaybreakFxOpen, false);
  assert.equal(preset.sundayLateNightFxOpen, false);
  assert.equal(preset.sundayNightFxOpen, false);
  assert.equal(preset.sundayEveningFxOpen, false);
  assert.equal(preset.saturdayEveningFxOpen, false);
  assert.equal(preset.sundayMorningFxOpen, false);
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
  assert.equal(preset.saturdayLatePayoutOpen, false);
  assert.equal(preset.demandProfile, DEFAULT_SCENARIO.demandProfile);
  assert.notDeepEqual(preset, PRESETS.normal);
  assert.notDeepEqual(preset, PRESETS.saturdayNightFxOpen);
  assert.notDeepEqual(preset, PRESETS.sundayPredawnFxOpen);
  assert.notDeepEqual(preset, PRESETS.sundayDawnFxOpen);
  assert.notDeepEqual(preset, PRESETS.sundayDaybreakFxOpen);
  assert.notDeepEqual(preset, PRESETS.sundayLateNightFxOpen);
  assert.notDeepEqual(preset, PRESETS.sundayNightFxOpen);
  assert.notDeepEqual(preset, PRESETS.sundayEveningFxOpen);
  assert.notDeepEqual(preset, PRESETS.saturdayEveningFxOpen);
  assert.notDeepEqual(preset, PRESETS.sundayMorningFxOpen);
  assert.notDeepEqual(preset, PRESETS.sundayAfternoonFxOpen);
  assert.notDeepEqual(preset, PRESETS.saturdayAfternoonFxOpen);
  assert.notDeepEqual(preset, PRESETS.saturdayLateFxOpen);
  assert.notDeepEqual(preset, PRESETS.saturdayMiddayFxOpen);
  assert.notDeepEqual(preset, PRESETS.saturdayEarlyFxOpen);
  assert.notDeepEqual(preset, PRESETS.sundayLateFxOpen);
  assert.notDeepEqual(preset, PRESETS.sundayEarlyFxOpen);
  const lateNight = runSimulation(preset);
  const normal = runSimulation(DEFAULT_SCENARIO);
  const saturdayNight = runSimulation(PRESETS.saturdayNightFxOpen);
  const sundayLateNight = runSimulation(PRESETS.sundayLateNightFxOpen);
  const sundayNight = runSimulation(PRESETS.sundayNightFxOpen);
  const sundayEvening = runSimulation(PRESETS.sundayEveningFxOpen);
  const saturdayEvening = runSimulation(PRESETS.saturdayEveningFxOpen);
  const sundayMorning = runSimulation(PRESETS.sundayMorningFxOpen);
  const sundayAfternoon = runSimulation(PRESETS.sundayAfternoonFxOpen);
  const saturdayAfternoon = runSimulation(PRESETS.saturdayAfternoonFxOpen);
  const saturdayLate = runSimulation(PRESETS.saturdayLateFxOpen);
  const saturdayMidday = runSimulation(PRESETS.saturdayMiddayFxOpen);
  const saturdayEarly = runSimulation(PRESETS.saturdayEarlyFxOpen);
  const sundayMidday = runSimulation(PRESETS.sundayMiddayFxOpen);
  const sundayLate = runSimulation(PRESETS.sundayLateFxOpen);
  const sundayEarly = runSimulation(PRESETS.sundayEarlyFxOpen);
  assert.equal(formatTime(29), "Sat 20:00");
  assert.equal(formatTime(30), "Sat 21:00");
  assert.equal(formatTime(31), "Sat 22:00");
  assert.equal(formatTime(32), "Sat 23:00");
  assert.equal(formatTime(33), "Sun 00:00");
  assert.equal(formatTime(55), "Sun 22:00");
  assert.equal(formatTime(56), "Sun 23:00");
  assert.equal(formatTime(53), "Sun 20:00");
  assert.equal(formatTime(51), "Sun 18:00");
  assert.equal(formatTime(27), "Sat 18:00");
  assert.equal(lateNight.timeline[31].timeLabel, "Sat 22:00");
  assert.equal(lateNight.timeline[31].weekend, true);
  assert.equal(lateNight.timeline[31].fxWeekday, true);
  assert.equal(normal.timeline[31].fxWeekday, false);
  assert.equal(saturdayNight.timeline[31].fxWeekday, false);
  assert.equal(sundayLateNight.timeline[31].fxWeekday, false);
  assert.equal(lateNight.timeline[32].timeLabel, "Sat 23:00");
  assert.equal(lateNight.timeline[32].weekend, true);
  assert.equal(lateNight.timeline[32].fxWeekday, true);
  assert.equal(normal.timeline[32].fxWeekday, false);
  assert.equal(saturdayNight.timeline[32].fxWeekday, false);
  assert.equal(lateNight.timeline[30].timeLabel, "Sat 21:00");
  assert.equal(lateNight.timeline[30].fxWeekday, false);
  assert.equal(saturdayNight.timeline[29].fxWeekday, true);
  assert.equal(lateNight.timeline[29].fxWeekday, false);
  assert.equal(saturdayNight.timeline[30].fxWeekday, true);
  assert.equal(lateNight.timeline[33].fxWeekday, false);
  assert.equal(saturdayEvening.timeline[27].fxWeekday, true);
  assert.equal(lateNight.timeline[27].fxWeekday, false);
  assert.equal(sundayLateNight.timeline[55].fxWeekday, true);
  assert.equal(lateNight.timeline[55].fxWeekday, false);
  assert.equal(sundayLateNight.timeline[56].fxWeekday, true);
  assert.equal(lateNight.timeline[56].fxWeekday, false);
  assert.equal(sundayNight.timeline[53].fxWeekday, true);
  assert.equal(lateNight.timeline[53].fxWeekday, false);
  assert.equal(sundayEvening.timeline[51].fxWeekday, true);
  assert.equal(lateNight.timeline[51].fxWeekday, false);
  assert.equal(sundayLate.timeline[49].fxWeekday, true);
  assert.equal(lateNight.timeline[49].fxWeekday, false);
  assert.equal(sundayAfternoon.timeline[47].fxWeekday, true);
  assert.equal(lateNight.timeline[47].fxWeekday, false);
  assert.equal(sundayMidday.timeline[45].fxWeekday, true);
  assert.equal(lateNight.timeline[45].fxWeekday, false);
  assert.equal(sundayMorning.timeline[43].fxWeekday, true);
  assert.equal(lateNight.timeline[43].fxWeekday, false);
  assert.equal(saturdayLate.timeline[25].fxWeekday, true);
  assert.equal(lateNight.timeline[25].fxWeekday, false);
  assert.equal(saturdayAfternoon.timeline[23].fxWeekday, true);
  assert.equal(lateNight.timeline[23].fxWeekday, false);
  assert.equal(saturdayMidday.timeline[21].fxWeekday, true);
  assert.equal(lateNight.timeline[21].fxWeekday, false);
  assert.equal(saturdayEarly.timeline[15].fxWeekday, true);
  assert.equal(lateNight.timeline[15].fxWeekday, false);
  assert.equal(sundayEarly.timeline[41].fxWeekday, true);
  assert.equal(lateNight.timeline[41].fxWeekday, false);
  assert.equal(lateNight.timeline[31].issuerOpen, false);
  assert.equal(lateNight.timeline[31].bankOpen, false);
  assert.equal(lateNight.timeline[31].payoutOpen, false);
  assert.equal(getOperationalStatus(preset, 31).fxWeekday, true);
  assert.equal(getOperationalStatus(DEFAULT_SCENARIO, 31).fxWeekday, false);
  assert.equal(getOperationalStatus(PRESETS.saturdayNightFxOpen, 29).fxWeekday, true);
  assert.equal(getOperationalStatus(preset, 29).fxWeekday, false);
  assert.equal(getOperationalStatus(PRESETS.sundayLateNightFxOpen, 55).fxWeekday, true);
  assert.equal(getOperationalStatus(preset, 55).fxWeekday, false);
  const lateNightOpen = firstSaturdayLateNightFxOpenHour(preset);
  assert.equal(lateNightOpen, 31);
  assert.equal(firstSaturdayLateNightFxOpenHour(DEFAULT_SCENARIO), null);
  assert.equal(firstSaturdayLateNightFxOpenHour(PRESETS.saturdayNightFxOpen), null);
  assert.equal(firstSaturdayLateNightFxOpenHour(PRESETS.sundayLateNightFxOpen), null);
  assert.equal(firstSaturdayLateNightFxOpenHour(PRESETS.sundayEveningFxOpen), null);
  assert.equal(firstSaturdayLateNightFxOpenHour(PRESETS.saturdayEveningFxOpen), null);
  assert.equal(firstSaturdayLateNightFxOpenHour(PRESETS.sundayNightFxOpen), null);
  assert.ok(lateNightOpen > 30);
  assert.ok(lateNightOpen < 33);
  const saturdayLateNight = dayAndHourAt(31);
  const saturdayCloseHour = dayAndHourAt(33);
  const saturdayNightHour = dayAndHourAt(29);
  const saturdayEveningHour = dayAndHourAt(27);
  const sundayLateNightHour = dayAndHourAt(55);
  assert.equal(saturdayLateNight.dayIndex, 6);
  assert.equal(saturdayLateNight.localHour, 22);
  assert.equal(saturdayCloseHour.dayIndex, 0);
  assert.equal(saturdayCloseHour.localHour, 0);
  assert.equal(saturdayNightHour.dayIndex, 6);
  assert.equal(saturdayNightHour.localHour, 20);
  assert.equal(saturdayEveningHour.dayIndex, 6);
  assert.equal(saturdayEveningHour.localHour, 18);
  assert.equal(sundayLateNightHour.dayIndex, 0);
  assert.equal(sundayLateNightHour.localHour, 22);
  assert.notEqual(saturdayLateNight.localHour, saturdayNightHour.localHour);
  assert.notEqual(saturdayLateNight.localHour, saturdayEveningHour.localHour);
  assert.notEqual(saturdayLateNight.dayIndex, sundayLateNightHour.dayIndex);
});

test("Saturday late-night FX open ORs into fxWeekday through isSaturdayLateNightFxOpenHour after saturdayNightFxOpen", async () => {
  const model = await readFile(new URL("../src/model.js", import.meta.url), "utf8");
  const helperStart = model.indexOf("function isSaturdayLateNightFxOpenHour");
  const helperNext = model.indexOf("function isSundayPredawnFxOpenHour", helperStart);
  const commentStart = model.lastIndexOf("/** Saturday 22:00-24:00", helperStart);
  const helper = model.slice(commentStart === -1 ? helperStart : commentStart, helperNext === -1 ? undefined : helperNext);
  assert.match(helper, /scenario\.saturdayLateNightFxOpen !== true/);
  assert.match(helper, /localHour >= 22 && localHour < 24/);
  assert.match(helper, /dayIndex === 6/);
  assert.match(helper, /saturdayNightFxOpen/);
  assert.match(helper, /sundayLateNightFxOpen/);
  assert.match(helper, /sundayNightFxOpen/);
  assert.match(helper, /saturdayEveningFxOpen/);
  assert.match(helper, /sundayEveningFxOpen/);
  assert.match(helper, /sundayLateFxOpen/);
  assert.match(helper, /sundayAfternoonFxOpen/);
  assert.match(helper, /sundayMiddayFxOpen/);
  assert.match(helper, /sundayMorningFxOpen/);
  assert.match(helper, /sundayEarlyFxOpen/);
  assert.match(helper, /saturdayLateFxOpen/);
  assert.match(helper, /saturdayAfternoonFxOpen/);
  assert.match(helper, /saturdayMiddayFxOpen/);
  assert.match(helper, /saturdayEarlyFxOpen/);
  assert.match(helper, /saturdayLatePayoutOpen/);
  assert.doesNotMatch(helper, /isSaturdayNightFxOpenHour/);
  assert.doesNotMatch(helper, /isSundayLateNightFxOpenHour/);
  assert.doesNotMatch(helper, /isSaturdayEveningFxOpenHour/);
  assert.doesNotMatch(helper, /isSundayNightFxOpenHour/);
  assert.doesNotMatch(helper, /isSundayEveningFxOpenHour/);
  assert.doesNotMatch(helper, /isSundayLateFxOpenHour/);
  assert.doesNotMatch(helper, /isSundayAfternoonFxOpenHour/);
  assert.doesNotMatch(helper, /isSundayMiddayFxOpenHour/);
  assert.doesNotMatch(helper, /isSundayMorningFxOpenHour/);
  assert.doesNotMatch(helper, /isSaturdayLateFxOpenHour/);
  assert.doesNotMatch(helper, /isSaturdayAfternoonFxOpenHour/);
  assert.doesNotMatch(helper, /isSaturdayMiddayFxOpenHour/);
  assert.match(model, /isSaturdayLateNightFxOpenHour\(hourOffset, scenario\)/);
  const saturdayNightStart = model.indexOf("function isSaturdayNightFxOpenHour");
  const saturdayLateNightStart = model.indexOf("function isSaturdayLateNightFxOpenHour");
  const statusStart = model.indexOf("export function getOperationalStatus");
  assert.ok(saturdayNightStart !== -1 && saturdayLateNightStart > saturdayNightStart);
  assert.ok(saturdayLateNightStart !== -1 && statusStart > saturdayLateNightStart);
  const statusNext = model.indexOf("\nexport function ", statusStart + 1);
  const status = model.slice(statusStart, statusNext === -1 ? undefined : statusNext);
  assert.match(status, /isSaturdayNightFxOpenHour\(hourOffset, scenario\)/);
  assert.match(status, /isSaturdayLateNightFxOpenHour\(hourOffset, scenario\)/);
  const saturdayNightCall = status.indexOf("isSaturdayNightFxOpenHour(hourOffset, scenario)");
  const saturdayLateNightCall = status.indexOf("isSaturdayLateNightFxOpenHour(hourOffset, scenario)");
  assert.ok(saturdayNightCall !== -1 && saturdayLateNightCall > saturdayNightCall);
  assert.doesNotMatch(model, /Date\.now/);
});

test("older scenario JSON without saturdayLateNightFxOpen keeps Saturday late-night on ordinary weekend FX depth", () => {
  assert.equal(sanitizeScenario({}).scenario.saturdayLateNightFxOpen, false);
  assert.equal(sanitizeScenario({ saturdayLateNightFxOpen: "true" }).scenario.saturdayLateNightFxOpen, false);
  assert.ok(sanitizeScenario({ saturdayLateNightFxOpen: "true" }).errors.some((error) => error.includes("saturdayLateNightFxOpen")));
});

test("Saturday late-night FX open is available as a preset button and is not an FX feed", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  const saturdayNightPreset = html.indexOf('data-preset="saturdayNightFxOpen"');
  const saturdayLateNightPreset = html.indexOf('data-preset="saturdayLateNightFxOpen"');
  assert.ok(saturdayNightPreset !== -1 && saturdayLateNightPreset > saturdayNightPreset);
  assert.match(html, /Saturday late-night FX open \(synthetic\)/);
  assert.match(html, /id="saturdayLateNightFxOpen"/);
  assert.match(html, /Keep Saturday FX open 22:00 to 24:00/);
  assert.match(html, /Keep Saturday FX open 20:00 to 22:00/);
  assert.match(html, /not an FX feed/i);
  assert.doesNotMatch(html, /live queue/i);
  assert.doesNotMatch(html, /hosted API/i);
});
