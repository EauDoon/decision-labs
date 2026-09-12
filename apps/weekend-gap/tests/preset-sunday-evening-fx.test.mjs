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

function firstSundayEveningFxOpenHour(scenario) {
  for (let hour = 0; hour < 72; hour += 1) {
    const { dayIndex, localHour } = dayAndHourAt(hour);
    if (dayIndex === 0 && localHour >= 18 && localHour < 20 && getOperationalStatus(scenario, hour).fxWeekday) {
      const ordinary = getOperationalStatus({
        ...scenario,
        sundayEveningFxOpen: false
      }, hour).fxWeekday;
      if (!ordinary) return hour;
    }
  }
  return null;
}

test("Sunday evening FX open keeps the Normal Friday calendar with a Sunday evening FX window", () => {
  const preset = PRESETS.sundayEveningFxOpen;
  assert.match(preset.name, /synthetic/i);
  assert.match(preset.name, /Sunday evening FX open/i);
  assert.equal(preset.sundayEveningFxOpen, true);
  assert.equal(DEFAULT_SCENARIO.sundayEveningFxOpen, false);
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
  assert.notDeepEqual(preset, PRESETS.saturdayEveningFxOpen);
  assert.notDeepEqual(preset, PRESETS.sundayMorningFxOpen);
  assert.notDeepEqual(preset, PRESETS.sundayAfternoonFxOpen);
  assert.notDeepEqual(preset, PRESETS.saturdayAfternoonFxOpen);
  assert.notDeepEqual(preset, PRESETS.saturdayLateFxOpen);
  assert.notDeepEqual(preset, PRESETS.saturdayMiddayFxOpen);
  assert.notDeepEqual(preset, PRESETS.saturdayEarlyFxOpen);
  assert.notDeepEqual(preset, PRESETS.sundayLateFxOpen);
  assert.notDeepEqual(preset, PRESETS.sundayEarlyFxOpen);
  const evening = runSimulation(preset);
  const normal = runSimulation(DEFAULT_SCENARIO);
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
  assert.equal(formatTime(51), "Sun 18:00");
  assert.equal(formatTime(52), "Sun 19:00");
  assert.equal(formatTime(53), "Sun 20:00");
  assert.equal(formatTime(27), "Sat 18:00");
  assert.equal(formatTime(28), "Sat 19:00");
  assert.equal(formatTime(25), "Sat 16:00");
  assert.equal(formatTime(23), "Sat 14:00");
  assert.equal(formatTime(21), "Sat 12:00");
  assert.equal(formatTime(15), "Sat 06:00");
  assert.equal(formatTime(49), "Sun 16:00");
  assert.equal(formatTime(47), "Sun 14:00");
  assert.equal(formatTime(45), "Sun 12:00");
  assert.equal(formatTime(43), "Sun 10:00");
  assert.equal(evening.timeline[51].timeLabel, "Sun 18:00");
  assert.equal(evening.timeline[51].weekend, true);
  assert.equal(evening.timeline[51].fxWeekday, true);
  assert.equal(normal.timeline[51].fxWeekday, false);
  assert.equal(evening.timeline[52].timeLabel, "Sun 19:00");
  assert.equal(evening.timeline[52].fxWeekday, true);
  assert.equal(evening.timeline[53].timeLabel, "Sun 20:00");
  assert.equal(evening.timeline[53].fxWeekday, false);
  assert.equal(saturdayEvening.timeline[27].fxWeekday, true);
  assert.equal(evening.timeline[27].fxWeekday, false);
  assert.equal(saturdayEvening.timeline[28].fxWeekday, true);
  assert.equal(evening.timeline[28].fxWeekday, false);
  assert.equal(sundayLate.timeline[49].fxWeekday, true);
  assert.equal(evening.timeline[49].fxWeekday, false);
  assert.equal(sundayLate.timeline[50].fxWeekday, true);
  assert.equal(evening.timeline[50].fxWeekday, false);
  assert.equal(sundayAfternoon.timeline[47].fxWeekday, true);
  assert.equal(evening.timeline[47].fxWeekday, false);
  assert.equal(sundayMidday.timeline[45].fxWeekday, true);
  assert.equal(evening.timeline[45].fxWeekday, false);
  assert.equal(sundayMorning.timeline[43].fxWeekday, true);
  assert.equal(evening.timeline[43].fxWeekday, false);
  assert.equal(saturdayLate.timeline[25].fxWeekday, true);
  assert.equal(evening.timeline[25].fxWeekday, false);
  assert.equal(saturdayAfternoon.timeline[23].fxWeekday, true);
  assert.equal(evening.timeline[23].fxWeekday, false);
  assert.equal(saturdayMidday.timeline[21].fxWeekday, true);
  assert.equal(evening.timeline[21].fxWeekday, false);
  assert.equal(saturdayEarly.timeline[15].fxWeekday, true);
  assert.equal(evening.timeline[15].fxWeekday, false);
  assert.equal(sundayEarly.timeline[41].fxWeekday, true);
  assert.equal(evening.timeline[41].fxWeekday, false);
  assert.equal(evening.timeline[51].issuerOpen, false);
  assert.equal(evening.timeline[51].bankOpen, false);
  assert.equal(evening.timeline[51].payoutOpen, false);
  assert.equal(getOperationalStatus(preset, 51).fxWeekday, true);
  assert.equal(getOperationalStatus(DEFAULT_SCENARIO, 51).fxWeekday, false);
  assert.equal(getOperationalStatus(PRESETS.saturdayEveningFxOpen, 27).fxWeekday, true);
  assert.equal(getOperationalStatus(preset, 27).fxWeekday, false);
  assert.equal(getOperationalStatus(PRESETS.sundayLateFxOpen, 49).fxWeekday, true);
  assert.equal(getOperationalStatus(preset, 49).fxWeekday, false);
  assert.equal(getOperationalStatus(PRESETS.sundayAfternoonFxOpen, 47).fxWeekday, true);
  assert.equal(getOperationalStatus(preset, 47).fxWeekday, false);
  assert.equal(getOperationalStatus(PRESETS.sundayMiddayFxOpen, 45).fxWeekday, true);
  assert.equal(getOperationalStatus(preset, 45).fxWeekday, false);
  assert.equal(getOperationalStatus(PRESETS.sundayMorningFxOpen, 43).fxWeekday, true);
  assert.equal(getOperationalStatus(preset, 43).fxWeekday, false);
  assert.equal(getOperationalStatus(PRESETS.saturdayLateFxOpen, 25).fxWeekday, true);
  assert.equal(getOperationalStatus(preset, 25).fxWeekday, false);
  assert.equal(getOperationalStatus(PRESETS.saturdayAfternoonFxOpen, 23).fxWeekday, true);
  assert.equal(getOperationalStatus(preset, 23).fxWeekday, false);
  assert.equal(getOperationalStatus(PRESETS.saturdayMiddayFxOpen, 21).fxWeekday, true);
  assert.equal(getOperationalStatus(preset, 21).fxWeekday, false);
  assert.equal(getOperationalStatus(PRESETS.saturdayEarlyFxOpen, 15).fxWeekday, true);
  assert.equal(getOperationalStatus(preset, 15).fxWeekday, false);
  const eveningOpen = firstSundayEveningFxOpenHour(preset);
  assert.equal(eveningOpen, 51);
  assert.equal(firstSundayEveningFxOpenHour(DEFAULT_SCENARIO), null);
  assert.equal(firstSundayEveningFxOpenHour(PRESETS.saturdayEveningFxOpen), null);
  assert.equal(firstSundayEveningFxOpenHour(PRESETS.sundayMorningFxOpen), null);
  assert.equal(firstSundayEveningFxOpenHour(PRESETS.sundayAfternoonFxOpen), null);
  assert.equal(firstSundayEveningFxOpenHour(PRESETS.saturdayAfternoonFxOpen), null);
  assert.equal(firstSundayEveningFxOpenHour(PRESETS.saturdayLateFxOpen), null);
  assert.equal(firstSundayEveningFxOpenHour(PRESETS.saturdayMiddayFxOpen), null);
  assert.equal(firstSundayEveningFxOpenHour(PRESETS.saturdayEarlyFxOpen), null);
  assert.equal(firstSundayEveningFxOpenHour(PRESETS.sundayMiddayFxOpen), null);
  assert.equal(firstSundayEveningFxOpenHour(PRESETS.sundayLateFxOpen), null);
  assert.ok(eveningOpen > 50);
  assert.ok(eveningOpen < 53);
  const sundayEvening = dayAndHourAt(51);
  const sundayCloseHour = dayAndHourAt(53);
  const sundayLateHour = dayAndHourAt(49);
  const sundayAfternoonHour = dayAndHourAt(47);
  const sundayNoon = dayAndHourAt(45);
  const sundayMorningHour = dayAndHourAt(43);
  const saturdayEveningHour = dayAndHourAt(27);
  const saturdayLateHour = dayAndHourAt(25);
  const saturdayAfternoonHour = dayAndHourAt(23);
  const saturdayMiddayHour = dayAndHourAt(21);
  const saturdayEarlyHour = dayAndHourAt(15);
  assert.equal(sundayEvening.dayIndex, 0);
  assert.equal(sundayEvening.localHour, 18);
  assert.equal(sundayCloseHour.dayIndex, 0);
  assert.equal(sundayCloseHour.localHour, 20);
  assert.equal(sundayLateHour.dayIndex, 0);
  assert.equal(sundayLateHour.localHour, 16);
  assert.equal(sundayAfternoonHour.dayIndex, 0);
  assert.equal(sundayAfternoonHour.localHour, 14);
  assert.equal(sundayNoon.dayIndex, 0);
  assert.equal(sundayNoon.localHour, 12);
  assert.equal(sundayMorningHour.dayIndex, 0);
  assert.equal(sundayMorningHour.localHour, 10);
  assert.equal(saturdayEveningHour.dayIndex, 6);
  assert.equal(saturdayEveningHour.localHour, 18);
  assert.equal(saturdayLateHour.dayIndex, 6);
  assert.equal(saturdayLateHour.localHour, 16);
  assert.equal(saturdayAfternoonHour.dayIndex, 6);
  assert.equal(saturdayAfternoonHour.localHour, 14);
  assert.equal(saturdayMiddayHour.dayIndex, 6);
  assert.equal(saturdayMiddayHour.localHour, 12);
  assert.equal(saturdayEarlyHour.dayIndex, 6);
  assert.equal(saturdayEarlyHour.localHour, 6);
  assert.notEqual(sundayEvening.localHour, sundayLateHour.localHour);
  assert.notEqual(sundayEvening.localHour, sundayAfternoonHour.localHour);
  assert.notEqual(sundayEvening.localHour, sundayNoon.localHour);
  assert.notEqual(sundayEvening.localHour, sundayMorningHour.localHour);
  assert.notEqual(sundayEvening.dayIndex, saturdayEveningHour.dayIndex);
  assert.equal(sundayEvening.localHour, saturdayEveningHour.localHour);
});

test("Sunday evening FX open ORs into fxWeekday through isSundayEveningFxOpenHour after saturdayEveningFxOpen", async () => {
  const model = await readFile(new URL("../src/model.js", import.meta.url), "utf8");
  const helperStart = model.indexOf("function isSundayEveningFxOpenHour");
  const helperNext = model.indexOf("\nexport function getOperationalStatus", helperStart);
  const commentStart = model.lastIndexOf("/** Sunday 18:00-20:00", helperStart);
  const helper = model.slice(commentStart === -1 ? helperStart : commentStart, helperNext === -1 ? undefined : helperNext);
  assert.match(helper, /scenario\.sundayEveningFxOpen !== true/);
  assert.match(helper, /localHour >= 18 && localHour < 20/);
  assert.match(helper, /dayIndex === 0/);
  assert.match(helper, /saturdayEveningFxOpen/);
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
  assert.doesNotMatch(helper, /isSaturdayEveningFxOpenHour/);
  assert.doesNotMatch(helper, /isSundayLateFxOpenHour/);
  assert.doesNotMatch(helper, /isSundayAfternoonFxOpenHour/);
  assert.doesNotMatch(helper, /isSundayMiddayFxOpenHour/);
  assert.doesNotMatch(helper, /isSundayMorningFxOpenHour/);
  assert.doesNotMatch(helper, /isSaturdayLateFxOpenHour/);
  assert.doesNotMatch(helper, /isSaturdayAfternoonFxOpenHour/);
  assert.doesNotMatch(helper, /isSaturdayMiddayFxOpenHour/);
  assert.match(model, /isSundayEveningFxOpenHour\(hourOffset, scenario\)/);
  const saturdayEveningStart = model.indexOf("function isSaturdayEveningFxOpenHour");
  const sundayEveningStart = model.indexOf("function isSundayEveningFxOpenHour");
  const statusStart = model.indexOf("export function getOperationalStatus");
  assert.ok(saturdayEveningStart !== -1 && sundayEveningStart > saturdayEveningStart);
  assert.ok(sundayEveningStart !== -1 && statusStart > sundayEveningStart);
  const statusNext = model.indexOf("\nexport function ", statusStart + 1);
  const status = model.slice(statusStart, statusNext === -1 ? undefined : statusNext);
  assert.match(status, /isSaturdayEveningFxOpenHour\(hourOffset, scenario\)/);
  assert.match(status, /isSundayEveningFxOpenHour\(hourOffset, scenario\)/);
  const saturdayEveningCall = status.indexOf("isSaturdayEveningFxOpenHour(hourOffset, scenario)");
  const sundayEveningCall = status.indexOf("isSundayEveningFxOpenHour(hourOffset, scenario)");
  assert.ok(saturdayEveningCall !== -1 && sundayEveningCall > saturdayEveningCall);
  assert.doesNotMatch(model, /Date\.now/);
});

test("older scenario JSON without sundayEveningFxOpen keeps Sunday evening on ordinary weekend FX depth", () => {
  assert.equal(sanitizeScenario({}).scenario.sundayEveningFxOpen, false);
  assert.equal(sanitizeScenario({ sundayEveningFxOpen: "true" }).scenario.sundayEveningFxOpen, false);
  assert.ok(sanitizeScenario({ sundayEveningFxOpen: "true" }).errors.some((error) => error.includes("sundayEveningFxOpen")));
});

test("Sunday evening FX open is available as a preset button and is not an FX feed", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  const saturdayEveningPreset = html.indexOf('data-preset="saturdayEveningFxOpen"');
  const sundayEveningPreset = html.indexOf('data-preset="sundayEveningFxOpen"');
  assert.ok(saturdayEveningPreset !== -1 && sundayEveningPreset > saturdayEveningPreset);
  assert.match(html, /Sunday evening FX open \(synthetic\)/);
  assert.match(html, /id="sundayEveningFxOpen"/);
  assert.match(html, /Keep Sunday FX open 18:00 to 20:00/);
  assert.match(html, /Keep Saturday FX open 18:00 to 20:00/);
  assert.match(html, /not an FX feed/i);
  assert.doesNotMatch(html, /live queue/i);
  assert.doesNotMatch(html, /hosted API/i);
});
