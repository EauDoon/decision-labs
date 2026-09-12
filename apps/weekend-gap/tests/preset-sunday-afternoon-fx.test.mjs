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

function firstSundayAfternoonFxOpenHour(scenario) {
  for (let hour = 0; hour < 72; hour += 1) {
    const { dayIndex, localHour } = dayAndHourAt(hour);
    if (dayIndex === 0 && localHour >= 14 && localHour < 16 && getOperationalStatus(scenario, hour).fxWeekday) {
      const ordinary = getOperationalStatus({
        ...scenario,
        sundayAfternoonFxOpen: false
      }, hour).fxWeekday;
      if (!ordinary) return hour;
    }
  }
  return null;
}

test("Sunday afternoon FX open keeps the Normal Friday calendar with a Sunday afternoon FX window", () => {
  const preset = PRESETS.sundayAfternoonFxOpen;
  assert.match(preset.name, /synthetic/i);
  assert.match(preset.name, /Sunday afternoon FX open/i);
  assert.equal(preset.sundayAfternoonFxOpen, true);
  assert.equal(DEFAULT_SCENARIO.sundayAfternoonFxOpen, false);
  assert.equal(preset.saturdayAfternoonFxOpen, false);
  assert.equal(preset.sundayMiddayFxOpen, false);
  assert.equal(preset.saturdayMiddayFxOpen, false);
  assert.equal(preset.saturdayEarlyFxOpen, false);
  assert.equal(preset.saturdayLateFxOpen, false);
  assert.equal(preset.sundayEarlyFxOpen, false);
  assert.equal(preset.sundayLateFxOpen, false);
  assert.equal(preset.fridayEarlyFxOpen, false);
  assert.equal(preset.fridayLateFxOpen, false);
  assert.equal(preset.demandProfile, DEFAULT_SCENARIO.demandProfile);
  assert.notDeepEqual(preset, PRESETS.normal);
  assert.notDeepEqual(preset, PRESETS.saturdayAfternoonFxOpen);
  assert.notDeepEqual(preset, PRESETS.sundayMiddayFxOpen);
  assert.notDeepEqual(preset, PRESETS.saturdayMiddayFxOpen);
  assert.notDeepEqual(preset, PRESETS.sundayLateFxOpen);
  assert.notDeepEqual(preset, PRESETS.sundayEarlyFxOpen);
  const afternoon = runSimulation(preset);
  const normal = runSimulation(DEFAULT_SCENARIO);
  const saturdayAfternoon = runSimulation(PRESETS.saturdayAfternoonFxOpen);
  const sundayMidday = runSimulation(PRESETS.sundayMiddayFxOpen);
  const sundayLate = runSimulation(PRESETS.sundayLateFxOpen);
  const sundayEarly = runSimulation(PRESETS.sundayEarlyFxOpen);
  assert.equal(formatTime(45), "Sun 12:00");
  assert.equal(formatTime(46), "Sun 13:00");
  assert.equal(formatTime(47), "Sun 14:00");
  assert.equal(formatTime(48), "Sun 15:00");
  assert.equal(formatTime(49), "Sun 16:00");
  assert.equal(formatTime(23), "Sat 14:00");
  assert.equal(afternoon.timeline[46].timeLabel, "Sun 13:00");
  assert.equal(afternoon.timeline[46].fxWeekday, false);
  assert.equal(sundayMidday.timeline[45].fxWeekday, true);
  assert.equal(afternoon.timeline[45].fxWeekday, false);
  assert.equal(afternoon.timeline[47].timeLabel, "Sun 14:00");
  assert.equal(afternoon.timeline[47].weekend, true);
  assert.equal(afternoon.timeline[47].fxWeekday, true);
  assert.equal(normal.timeline[47].fxWeekday, false);
  assert.equal(saturdayAfternoon.timeline[47].fxWeekday, false);
  assert.equal(sundayMidday.timeline[47].fxWeekday, false);
  assert.equal(sundayLate.timeline[47].fxWeekday, false);
  assert.equal(afternoon.timeline[47].issuerOpen, false);
  assert.equal(afternoon.timeline[47].bankOpen, false);
  assert.equal(afternoon.timeline[47].payoutOpen, false);
  assert.equal(afternoon.timeline[48].timeLabel, "Sun 15:00");
  assert.equal(afternoon.timeline[48].fxWeekday, true);
  assert.equal(afternoon.timeline[49].timeLabel, "Sun 16:00");
  assert.equal(afternoon.timeline[49].fxWeekday, false);
  assert.equal(sundayLate.timeline[49].fxWeekday, true);
  assert.equal(saturdayAfternoon.timeline[23].fxWeekday, true);
  assert.equal(afternoon.timeline[23].fxWeekday, false);
  assert.equal(sundayEarly.timeline[41].fxWeekday, true);
  assert.equal(afternoon.timeline[41].fxWeekday, false);
  assert.equal(getOperationalStatus(preset, 47).fxWeekday, true);
  assert.equal(getOperationalStatus(DEFAULT_SCENARIO, 47).fxWeekday, false);
  assert.equal(getOperationalStatus(PRESETS.sundayMiddayFxOpen, 45).fxWeekday, true);
  assert.equal(getOperationalStatus(preset, 45).fxWeekday, false);
  assert.equal(getOperationalStatus(PRESETS.sundayLateFxOpen, 49).fxWeekday, true);
  assert.equal(getOperationalStatus(preset, 49).fxWeekday, false);
  assert.equal(getOperationalStatus(PRESETS.saturdayAfternoonFxOpen, 23).fxWeekday, true);
  assert.equal(getOperationalStatus(preset, 23).fxWeekday, false);
  const afternoonOpen = firstSundayAfternoonFxOpenHour(preset);
  assert.equal(afternoonOpen, 47);
  assert.equal(firstSundayAfternoonFxOpenHour(DEFAULT_SCENARIO), null);
  assert.equal(firstSundayAfternoonFxOpenHour(PRESETS.saturdayAfternoonFxOpen), null);
  assert.equal(firstSundayAfternoonFxOpenHour(PRESETS.sundayMiddayFxOpen), null);
  assert.equal(firstSundayAfternoonFxOpenHour(PRESETS.sundayLateFxOpen), null);
  assert.equal(firstSundayAfternoonFxOpenHour(PRESETS.sundayEarlyFxOpen), null);
  assert.ok(afternoonOpen > 46);
  assert.ok(afternoonOpen < 49);
  const sundayAfternoon = dayAndHourAt(47);
  const sundayNoon = dayAndHourAt(45);
  const sundayLateHour = dayAndHourAt(49);
  const saturdayAfternoonHour = dayAndHourAt(23);
  assert.equal(sundayAfternoon.dayIndex, 0);
  assert.equal(sundayAfternoon.localHour, 14);
  assert.equal(sundayNoon.dayIndex, 0);
  assert.equal(sundayNoon.localHour, 12);
  assert.equal(sundayLateHour.dayIndex, 0);
  assert.equal(sundayLateHour.localHour, 16);
  assert.equal(saturdayAfternoonHour.dayIndex, 6);
  assert.equal(saturdayAfternoonHour.localHour, 14);
  assert.notEqual(sundayAfternoon.localHour, sundayNoon.localHour);
  assert.notEqual(sundayAfternoon.localHour, sundayLateHour.localHour);
  assert.notEqual(sundayAfternoon.dayIndex, saturdayAfternoonHour.dayIndex);
});

test("Sunday afternoon FX open ORs into fxWeekday through isSundayAfternoonFxOpenHour after saturdayAfternoonFxOpen", async () => {
  const model = await readFile(new URL("../src/model.js", import.meta.url), "utf8");
  const helperStart = model.indexOf("function isSundayAfternoonFxOpenHour");
  const helperNext = model.indexOf("\nexport function getOperationalStatus", helperStart);
  const commentStart = model.lastIndexOf("/** Sunday 14:00-16:00", helperStart);
  const helper = model.slice(commentStart === -1 ? helperStart : commentStart, helperNext === -1 ? undefined : helperNext);
  assert.match(helper, /scenario\.sundayAfternoonFxOpen !== true/);
  assert.match(helper, /localHour >= 14 && localHour < 16/);
  assert.match(helper, /dayIndex === 0/);
  assert.match(helper, /saturdayAfternoonFxOpen/);
  assert.match(helper, /sundayMiddayFxOpen/);
  assert.match(helper, /sundayLateFxOpen/);
  assert.match(helper, /sundayEarlyFxOpen/);
  assert.doesNotMatch(helper, /isSaturdayAfternoonFxOpenHour/);
  assert.doesNotMatch(helper, /isSundayMiddayFxOpenHour/);
  assert.doesNotMatch(helper, /isSundayLateFxOpenHour/);
  assert.match(model, /isSundayAfternoonFxOpenHour\(hourOffset, scenario\)/);
  const saturdayStart = model.indexOf("function isSaturdayAfternoonFxOpenHour");
  const sundayStart = model.indexOf("function isSundayAfternoonFxOpenHour");
  const statusStart = model.indexOf("export function getOperationalStatus");
  assert.ok(saturdayStart !== -1 && sundayStart > saturdayStart);
  assert.ok(sundayStart !== -1 && statusStart > sundayStart);
  const statusNext = model.indexOf("\nexport function ", statusStart + 1);
  const status = model.slice(statusStart, statusNext === -1 ? undefined : statusNext);
  assert.match(status, /isSaturdayAfternoonFxOpenHour\(hourOffset, scenario\)/);
  assert.match(status, /isSundayAfternoonFxOpenHour\(hourOffset, scenario\)/);
  const saturdayAfternoonCall = status.indexOf("isSaturdayAfternoonFxOpenHour(hourOffset, scenario)");
  const sundayAfternoonCall = status.indexOf("isSundayAfternoonFxOpenHour(hourOffset, scenario)");
  assert.ok(saturdayAfternoonCall !== -1 && sundayAfternoonCall > saturdayAfternoonCall);
  assert.doesNotMatch(model, /Date\.now/);
});

test("older scenario JSON without sundayAfternoonFxOpen keeps Sunday afternoon on ordinary weekend FX depth", () => {
  assert.equal(sanitizeScenario({}).scenario.sundayAfternoonFxOpen, false);
  assert.equal(sanitizeScenario({ sundayAfternoonFxOpen: "true" }).scenario.sundayAfternoonFxOpen, false);
  assert.ok(sanitizeScenario({ sundayAfternoonFxOpen: "true" }).errors.some((error) => error.includes("sundayAfternoonFxOpen")));
});

test("Sunday afternoon FX open is available as a preset button and is not an FX feed", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  const saturdayPreset = html.indexOf('data-preset="saturdayAfternoonFxOpen"');
  const sundayPreset = html.indexOf('data-preset="sundayAfternoonFxOpen"');
  assert.ok(saturdayPreset !== -1 && sundayPreset > saturdayPreset);
  assert.match(html, /Sunday afternoon FX open \(synthetic\)/);
  assert.match(html, /id="sundayAfternoonFxOpen"/);
  assert.match(html, /Keep Sunday FX open 14:00 to 16:00/);
  assert.match(html, /Keep Saturday FX open 14:00 to 16:00/);
  assert.match(html, /not an FX feed/i);
  assert.doesNotMatch(html, /live queue/i);
});
