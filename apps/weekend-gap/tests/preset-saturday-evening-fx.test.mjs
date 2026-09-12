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

function firstSaturdayEveningFxOpenHour(scenario) {
  for (let hour = 0; hour < 72; hour += 1) {
    const { dayIndex, localHour } = dayAndHourAt(hour);
    if (dayIndex === 6 && localHour >= 18 && localHour < 20 && getOperationalStatus(scenario, hour).fxWeekday) {
      const ordinary = getOperationalStatus({
        ...scenario,
        saturdayEveningFxOpen: false
      }, hour).fxWeekday;
      if (!ordinary) return hour;
    }
  }
  return null;
}

test("Saturday evening FX open keeps the Normal Friday calendar with a Saturday evening FX window", () => {
  const preset = PRESETS.saturdayEveningFxOpen;
  assert.match(preset.name, /synthetic/i);
  assert.match(preset.name, /Saturday evening FX open/i);
  assert.equal(preset.saturdayEveningFxOpen, true);
  assert.equal(DEFAULT_SCENARIO.saturdayEveningFxOpen, false);
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
  assert.notDeepEqual(preset, PRESETS.sundayMorningFxOpen);
  assert.notDeepEqual(preset, PRESETS.sundayAfternoonFxOpen);
  assert.notDeepEqual(preset, PRESETS.saturdayAfternoonFxOpen);
  assert.notDeepEqual(preset, PRESETS.saturdayLateFxOpen);
  assert.notDeepEqual(preset, PRESETS.saturdayMiddayFxOpen);
  assert.notDeepEqual(preset, PRESETS.sundayLateFxOpen);
  assert.notDeepEqual(preset, PRESETS.sundayEarlyFxOpen);
  const evening = runSimulation(preset);
  const normal = runSimulation(DEFAULT_SCENARIO);
  const sundayMorning = runSimulation(PRESETS.sundayMorningFxOpen);
  const sundayAfternoon = runSimulation(PRESETS.sundayAfternoonFxOpen);
  const saturdayAfternoon = runSimulation(PRESETS.saturdayAfternoonFxOpen);
  const saturdayLate = runSimulation(PRESETS.saturdayLateFxOpen);
  const saturdayMidday = runSimulation(PRESETS.saturdayMiddayFxOpen);
  const sundayMidday = runSimulation(PRESETS.sundayMiddayFxOpen);
  const sundayLate = runSimulation(PRESETS.sundayLateFxOpen);
  const sundayEarly = runSimulation(PRESETS.sundayEarlyFxOpen);
  assert.equal(formatTime(25), "Sat 16:00");
  assert.equal(formatTime(26), "Sat 17:00");
  assert.equal(formatTime(27), "Sat 18:00");
  assert.equal(formatTime(28), "Sat 19:00");
  assert.equal(formatTime(29), "Sat 20:00");
  assert.equal(formatTime(23), "Sat 14:00");
  assert.equal(formatTime(21), "Sat 12:00");
  assert.equal(formatTime(43), "Sun 10:00");
  assert.equal(formatTime(47), "Sun 14:00");
  assert.equal(formatTime(45), "Sun 12:00");
  assert.equal(formatTime(49), "Sun 16:00");
  assert.equal(evening.timeline[27].timeLabel, "Sat 18:00");
  assert.equal(evening.timeline[27].weekend, true);
  assert.equal(evening.timeline[27].fxWeekday, true);
  assert.equal(normal.timeline[27].fxWeekday, false);
  assert.equal(evening.timeline[28].timeLabel, "Sat 19:00");
  assert.equal(evening.timeline[28].fxWeekday, true);
  assert.equal(evening.timeline[29].timeLabel, "Sat 20:00");
  assert.equal(evening.timeline[29].fxWeekday, false);
  assert.equal(evening.timeline[25].fxWeekday, false);
  assert.equal(saturdayLate.timeline[25].fxWeekday, true);
  assert.equal(evening.timeline[26].fxWeekday, false);
  assert.equal(saturdayLate.timeline[26].fxWeekday, true);
  assert.equal(saturdayLate.timeline[27].fxWeekday, false);
  assert.equal(evening.timeline[23].fxWeekday, false);
  assert.equal(saturdayAfternoon.timeline[23].fxWeekday, true);
  assert.equal(evening.timeline[21].fxWeekday, false);
  assert.equal(saturdayMidday.timeline[21].fxWeekday, true);
  assert.equal(evening.timeline[43].fxWeekday, false);
  assert.equal(sundayMorning.timeline[43].fxWeekday, true);
  assert.equal(evening.timeline[45].fxWeekday, false);
  assert.equal(sundayMidday.timeline[45].fxWeekday, true);
  assert.equal(evening.timeline[47].fxWeekday, false);
  assert.equal(sundayAfternoon.timeline[47].fxWeekday, true);
  assert.equal(evening.timeline[49].fxWeekday, false);
  assert.equal(sundayLate.timeline[49].fxWeekday, true);
  assert.equal(sundayEarly.timeline[41].fxWeekday, true);
  assert.equal(evening.timeline[41].fxWeekday, false);
  assert.equal(evening.timeline[27].issuerOpen, false);
  assert.equal(evening.timeline[27].bankOpen, false);
  assert.equal(evening.timeline[27].payoutOpen, false);
  assert.equal(getOperationalStatus(preset, 27).fxWeekday, true);
  assert.equal(getOperationalStatus(DEFAULT_SCENARIO, 27).fxWeekday, false);
  assert.equal(getOperationalStatus(PRESETS.saturdayLateFxOpen, 25).fxWeekday, true);
  assert.equal(getOperationalStatus(preset, 25).fxWeekday, false);
  assert.equal(getOperationalStatus(PRESETS.saturdayAfternoonFxOpen, 23).fxWeekday, true);
  assert.equal(getOperationalStatus(preset, 23).fxWeekday, false);
  assert.equal(getOperationalStatus(PRESETS.saturdayMiddayFxOpen, 21).fxWeekday, true);
  assert.equal(getOperationalStatus(preset, 21).fxWeekday, false);
  assert.equal(getOperationalStatus(PRESETS.sundayMorningFxOpen, 43).fxWeekday, true);
  assert.equal(getOperationalStatus(preset, 43).fxWeekday, false);
  assert.equal(getOperationalStatus(PRESETS.sundayAfternoonFxOpen, 47).fxWeekday, true);
  assert.equal(getOperationalStatus(preset, 47).fxWeekday, false);
  assert.equal(getOperationalStatus(PRESETS.sundayMiddayFxOpen, 45).fxWeekday, true);
  assert.equal(getOperationalStatus(preset, 45).fxWeekday, false);
  assert.equal(getOperationalStatus(PRESETS.sundayLateFxOpen, 49).fxWeekday, true);
  assert.equal(getOperationalStatus(preset, 49).fxWeekday, false);
  const eveningOpen = firstSaturdayEveningFxOpenHour(preset);
  assert.equal(eveningOpen, 27);
  assert.equal(firstSaturdayEveningFxOpenHour(DEFAULT_SCENARIO), null);
  assert.equal(firstSaturdayEveningFxOpenHour(PRESETS.sundayMorningFxOpen), null);
  assert.equal(firstSaturdayEveningFxOpenHour(PRESETS.sundayAfternoonFxOpen), null);
  assert.equal(firstSaturdayEveningFxOpenHour(PRESETS.saturdayAfternoonFxOpen), null);
  assert.equal(firstSaturdayEveningFxOpenHour(PRESETS.saturdayLateFxOpen), null);
  assert.equal(firstSaturdayEveningFxOpenHour(PRESETS.saturdayMiddayFxOpen), null);
  assert.equal(firstSaturdayEveningFxOpenHour(PRESETS.sundayMiddayFxOpen), null);
  assert.equal(firstSaturdayEveningFxOpenHour(PRESETS.sundayLateFxOpen), null);
  assert.ok(eveningOpen > 26);
  assert.ok(eveningOpen < 29);
  const saturdayEvening = dayAndHourAt(27);
  const saturdayLateHour = dayAndHourAt(25);
  const saturdayAfternoonHour = dayAndHourAt(23);
  const saturdayMiddayHour = dayAndHourAt(21);
  const saturdayCloseHour = dayAndHourAt(29);
  const sundayMorningHour = dayAndHourAt(43);
  const sundayNoon = dayAndHourAt(45);
  const sundayAfternoonHour = dayAndHourAt(47);
  const sundayLateHour = dayAndHourAt(49);
  assert.equal(saturdayEvening.dayIndex, 6);
  assert.equal(saturdayEvening.localHour, 18);
  assert.equal(saturdayCloseHour.dayIndex, 6);
  assert.equal(saturdayCloseHour.localHour, 20);
  assert.equal(saturdayLateHour.dayIndex, 6);
  assert.equal(saturdayLateHour.localHour, 16);
  assert.equal(saturdayAfternoonHour.dayIndex, 6);
  assert.equal(saturdayAfternoonHour.localHour, 14);
  assert.equal(saturdayMiddayHour.dayIndex, 6);
  assert.equal(saturdayMiddayHour.localHour, 12);
  assert.equal(sundayMorningHour.dayIndex, 0);
  assert.equal(sundayMorningHour.localHour, 10);
  assert.equal(sundayNoon.dayIndex, 0);
  assert.equal(sundayNoon.localHour, 12);
  assert.equal(sundayAfternoonHour.dayIndex, 0);
  assert.equal(sundayAfternoonHour.localHour, 14);
  assert.equal(sundayLateHour.dayIndex, 0);
  assert.equal(sundayLateHour.localHour, 16);
  assert.notEqual(saturdayEvening.localHour, saturdayLateHour.localHour);
  assert.notEqual(saturdayEvening.localHour, saturdayAfternoonHour.localHour);
  assert.notEqual(saturdayEvening.localHour, saturdayMiddayHour.localHour);
  assert.notEqual(saturdayEvening.dayIndex, sundayMorningHour.dayIndex);
  assert.notEqual(saturdayEvening.localHour, sundayMorningHour.localHour);
});

test("Saturday evening FX open ORs into fxWeekday through isSaturdayEveningFxOpenHour after sundayMorningFxOpen", async () => {
  const model = await readFile(new URL("../src/model.js", import.meta.url), "utf8");
  const helperStart = model.indexOf("function isSaturdayEveningFxOpenHour");
  const helperNext = model.indexOf("function isSundayEveningFxOpenHour", helperStart);
  const commentStart = model.lastIndexOf("/** Saturday 18:00-20:00", helperStart);
  const helper = model.slice(commentStart === -1 ? helperStart : commentStart, helperNext === -1 ? undefined : helperNext);
  assert.match(helper, /scenario\.saturdayEveningFxOpen !== true/);
  assert.match(helper, /localHour >= 18 && localHour < 20/);
  assert.match(helper, /dayIndex === 6/);
  assert.match(helper, /sundayMorningFxOpen/);
  assert.match(helper, /saturdayLateFxOpen/);
  assert.match(helper, /saturdayAfternoonFxOpen/);
  assert.match(helper, /saturdayMiddayFxOpen/);
  assert.match(helper, /saturdayEarlyFxOpen/);
  assert.match(helper, /saturdayLatePayoutOpen/);
  assert.match(helper, /sundayEveningFxOpen/);
  assert.doesNotMatch(helper, /isSundayMorningFxOpenHour/);
  assert.doesNotMatch(helper, /isSaturdayLateFxOpenHour/);
  assert.doesNotMatch(helper, /isSaturdayAfternoonFxOpenHour/);
  assert.doesNotMatch(helper, /isSaturdayMiddayFxOpenHour/);
  assert.doesNotMatch(helper, /function isSundayEveningFxOpenHour/);
  assert.match(model, /isSaturdayEveningFxOpenHour\(hourOffset, scenario\)/);
  const morningStart = model.indexOf("function isSundayMorningFxOpenHour");
  const eveningStart = model.indexOf("function isSaturdayEveningFxOpenHour");
  const sundayEveningStart = model.indexOf("function isSundayEveningFxOpenHour");
  const statusStart = model.indexOf("export function getOperationalStatus");
  assert.ok(morningStart !== -1 && eveningStart > morningStart);
  assert.ok(eveningStart !== -1 && sundayEveningStart > eveningStart);
  assert.ok(sundayEveningStart !== -1 && statusStart > sundayEveningStart);
  const statusNext = model.indexOf("\nexport function ", statusStart + 1);
  const status = model.slice(statusStart, statusNext === -1 ? undefined : statusNext);
  assert.match(status, /isSundayMorningFxOpenHour\(hourOffset, scenario\)/);
  assert.match(status, /isSaturdayEveningFxOpenHour\(hourOffset, scenario\)/);
  assert.match(status, /isSundayEveningFxOpenHour\(hourOffset, scenario\)/);
  const sundayMorningCall = status.indexOf("isSundayMorningFxOpenHour(hourOffset, scenario)");
  const saturdayEveningCall = status.indexOf("isSaturdayEveningFxOpenHour(hourOffset, scenario)");
  const sundayEveningCall = status.indexOf("isSundayEveningFxOpenHour(hourOffset, scenario)");
  assert.ok(sundayMorningCall !== -1 && saturdayEveningCall > sundayMorningCall);
  assert.ok(saturdayEveningCall !== -1 && sundayEveningCall > saturdayEveningCall);
  assert.doesNotMatch(model, /Date\.now/);
});

test("older scenario JSON without saturdayEveningFxOpen keeps Saturday evening on ordinary weekend FX depth", () => {
  assert.equal(sanitizeScenario({}).scenario.saturdayEveningFxOpen, false);
  assert.equal(sanitizeScenario({ saturdayEveningFxOpen: "true" }).scenario.saturdayEveningFxOpen, false);
  assert.ok(sanitizeScenario({ saturdayEveningFxOpen: "true" }).errors.some((error) => error.includes("saturdayEveningFxOpen")));
});

test("Saturday evening FX open is available as a preset button and is not an FX feed", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  const sundayMorningPreset = html.indexOf('data-preset="sundayMorningFxOpen"');
  const saturdayEveningPreset = html.indexOf('data-preset="saturdayEveningFxOpen"');
  assert.ok(sundayMorningPreset !== -1 && saturdayEveningPreset > sundayMorningPreset);
  assert.match(html, /Saturday evening FX open \(synthetic\)/);
  assert.match(html, /id="saturdayEveningFxOpen"/);
  assert.match(html, /Keep Saturday FX open 18:00 to 20:00/);
  assert.match(html, /Keep Sunday FX open 10:00 to 12:00/);
  assert.match(html, /not an FX feed/i);
  assert.doesNotMatch(html, /live queue/i);
});
