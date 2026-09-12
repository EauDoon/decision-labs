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

function firstSaturdayAfternoonFxOpenHour(scenario) {
  for (let hour = 0; hour < 72; hour += 1) {
    const { dayIndex, localHour } = dayAndHourAt(hour);
    if (dayIndex === 6 && localHour >= 14 && localHour < 16 && getOperationalStatus(scenario, hour).fxWeekday) {
      const ordinary = getOperationalStatus({
        ...scenario,
        saturdayAfternoonFxOpen: false
      }, hour).fxWeekday;
      if (!ordinary) return hour;
    }
  }
  return null;
}

test("Saturday afternoon FX open keeps the Normal Friday calendar with a Saturday afternoon FX window", () => {
  const preset = PRESETS.saturdayAfternoonFxOpen;
  assert.match(preset.name, /synthetic/i);
  assert.match(preset.name, /Saturday afternoon FX open/i);
  assert.equal(preset.saturdayAfternoonFxOpen, true);
  assert.equal(DEFAULT_SCENARIO.saturdayAfternoonFxOpen, false);
  assert.equal(preset.sundayMiddayFxOpen, false);
  assert.equal(preset.saturdayMiddayFxOpen, false);
  assert.equal(preset.saturdayEarlyFxOpen, false);
  assert.equal(preset.saturdayLateFxOpen, false);
  assert.equal(preset.sundayEarlyFxOpen, false);
  assert.equal(preset.sundayLateFxOpen, false);
  assert.equal(preset.fridayEarlyFxOpen, false);
  assert.equal(preset.fridayLateFxOpen, false);
  assert.equal(preset.saturdayEarlyIssuerOpen, false);
  assert.equal(preset.saturdayEarlyBankOpen, false);
  assert.equal(preset.saturdayEarlyPayoutOpen, false);
  assert.equal(preset.mondayHoliday, false);
  assert.equal(preset.demandProfile, DEFAULT_SCENARIO.demandProfile);
  assert.equal(preset.issuerOpenStartHour, DEFAULT_SCENARIO.issuerOpenStartHour);
  assert.equal(preset.bankOpenStartHour, DEFAULT_SCENARIO.bankOpenStartHour);
  assert.equal(preset.redemptionDemandAud, DEFAULT_SCENARIO.redemptionDemandAud);
  assert.notDeepEqual(preset, PRESETS.normal);
  assert.notDeepEqual(preset, PRESETS.sundayMiddayFxOpen);
  assert.notDeepEqual(preset, PRESETS.saturdayMiddayFxOpen);
  assert.notDeepEqual(preset, PRESETS.saturdayEarlyFxOpen);
  assert.notDeepEqual(preset, PRESETS.saturdayLateFxOpen);
  assert.notDeepEqual(preset, PRESETS.sundayEarlyFxOpen);
  assert.notDeepEqual(preset, PRESETS.sundayLateFxOpen);
  assert.notDeepEqual(preset, PRESETS.fridayEarlyFxOpen);
  assert.notDeepEqual(preset, PRESETS.fridayLateFxOpen);
  const afternoon = runSimulation(preset);
  const normal = runSimulation(DEFAULT_SCENARIO);
  const saturdayMidday = runSimulation(PRESETS.saturdayMiddayFxOpen);
  const saturdayLate = runSimulation(PRESETS.saturdayLateFxOpen);
  const sundayMidday = runSimulation(PRESETS.sundayMiddayFxOpen);
  const sundayEarly = runSimulation(PRESETS.sundayEarlyFxOpen);
  const sundayLate = runSimulation(PRESETS.sundayLateFxOpen);
  assert.equal(formatTime(21), "Sat 12:00");
  assert.equal(formatTime(22), "Sat 13:00");
  assert.equal(formatTime(23), "Sat 14:00");
  assert.equal(formatTime(24), "Sat 15:00");
  assert.equal(formatTime(25), "Sat 16:00");
  assert.equal(formatTime(45), "Sun 12:00");
  assert.equal(formatTime(41), "Sun 08:00");
  assert.equal(formatTime(49), "Sun 16:00");
  assert.equal(afternoon.timeline[22].timeLabel, "Sat 13:00");
  assert.equal(afternoon.timeline[22].fxWeekday, false);
  assert.equal(saturdayMidday.timeline[21].fxWeekday, true);
  assert.equal(afternoon.timeline[21].fxWeekday, false);
  assert.equal(afternoon.timeline[23].timeLabel, "Sat 14:00");
  assert.equal(afternoon.timeline[23].weekend, true);
  assert.equal(afternoon.timeline[23].fxWeekday, true);
  assert.equal(normal.timeline[23].fxWeekday, false);
  assert.equal(saturdayMidday.timeline[23].fxWeekday, false);
  assert.equal(saturdayLate.timeline[23].fxWeekday, false);
  assert.equal(sundayMidday.timeline[23].fxWeekday, false);
  assert.equal(afternoon.timeline[23].issuerOpen, false);
  assert.equal(afternoon.timeline[23].bankOpen, false);
  assert.equal(afternoon.timeline[23].payoutOpen, false);
  assert.equal(afternoon.timeline[24].timeLabel, "Sat 15:00");
  assert.equal(afternoon.timeline[24].fxWeekday, true);
  assert.equal(afternoon.timeline[25].timeLabel, "Sat 16:00");
  assert.equal(afternoon.timeline[25].fxWeekday, false);
  assert.equal(saturdayLate.timeline[25].fxWeekday, true);
  assert.equal(sundayMidday.timeline[45].fxWeekday, true);
  assert.equal(afternoon.timeline[45].fxWeekday, false);
  assert.equal(sundayEarly.timeline[41].fxWeekday, true);
  assert.equal(afternoon.timeline[41].fxWeekday, false);
  assert.equal(sundayLate.timeline[49].fxWeekday, true);
  assert.equal(afternoon.timeline[49].fxWeekday, false);
  assert.equal(getOperationalStatus(preset, 23).fxWeekday, true);
  assert.equal(getOperationalStatus(DEFAULT_SCENARIO, 23).fxWeekday, false);
  assert.equal(getOperationalStatus(PRESETS.saturdayMiddayFxOpen, 21).fxWeekday, true);
  assert.equal(getOperationalStatus(preset, 21).fxWeekday, false);
  assert.equal(getOperationalStatus(PRESETS.saturdayLateFxOpen, 25).fxWeekday, true);
  assert.equal(getOperationalStatus(preset, 25).fxWeekday, false);
  assert.equal(getOperationalStatus(PRESETS.sundayMiddayFxOpen, 45).fxWeekday, true);
  assert.equal(getOperationalStatus(preset, 45).fxWeekday, false);
  assert.equal(getOperationalStatus(preset, 23).issuerOpen, false);
  assert.equal(getOperationalStatus(preset, 23).bankOpen, false);
  assert.equal(getOperationalStatus(preset, 23).payoutOpen, false);
  const afternoonOpen = firstSaturdayAfternoonFxOpenHour(preset);
  assert.equal(afternoonOpen, 23);
  assert.equal(firstSaturdayAfternoonFxOpenHour(DEFAULT_SCENARIO), null);
  assert.equal(firstSaturdayAfternoonFxOpenHour(PRESETS.saturdayMiddayFxOpen), null);
  assert.equal(firstSaturdayAfternoonFxOpenHour(PRESETS.saturdayLateFxOpen), null);
  assert.equal(firstSaturdayAfternoonFxOpenHour(PRESETS.sundayMiddayFxOpen), null);
  assert.equal(firstSaturdayAfternoonFxOpenHour(PRESETS.sundayEarlyFxOpen), null);
  assert.equal(firstSaturdayAfternoonFxOpenHour(PRESETS.sundayLateFxOpen), null);
  assert.equal(firstSaturdayAfternoonFxOpenHour(PRESETS.saturdayEarlyFxOpen), null);
  assert.equal(firstSaturdayAfternoonFxOpenHour(PRESETS.fridayEarlyFxOpen), null);
  assert.ok(afternoonOpen > 22);
  assert.ok(afternoonOpen < 25);
  const saturdayAfternoon = dayAndHourAt(23);
  const saturdayNoon = dayAndHourAt(21);
  const saturdayLateHour = dayAndHourAt(25);
  const sundayNoon = dayAndHourAt(45);
  assert.equal(saturdayAfternoon.dayIndex, 6);
  assert.equal(saturdayAfternoon.localHour, 14);
  assert.equal(saturdayNoon.dayIndex, 6);
  assert.equal(saturdayNoon.localHour, 12);
  assert.equal(saturdayLateHour.dayIndex, 6);
  assert.equal(saturdayLateHour.localHour, 16);
  assert.equal(sundayNoon.dayIndex, 0);
  assert.equal(sundayNoon.localHour, 12);
  assert.notEqual(saturdayAfternoon.localHour, saturdayNoon.localHour);
  assert.notEqual(saturdayAfternoon.localHour, saturdayLateHour.localHour);
  assert.notEqual(saturdayAfternoon.dayIndex, sundayNoon.dayIndex);
});

test("Saturday afternoon FX open ORs into fxWeekday through isSaturdayAfternoonFxOpenHour after sundayMiddayFxOpen", async () => {
  const model = await readFile(new URL("../src/model.js", import.meta.url), "utf8");
  const helperStart = model.indexOf("function isSaturdayAfternoonFxOpenHour");
  const helperNext = model.indexOf("function isSundayAfternoonFxOpenHour", helperStart);
  const commentStart = model.lastIndexOf("/** Saturday 14:00-16:00", helperStart);
  const helper = model.slice(commentStart === -1 ? helperStart : commentStart, helperNext === -1 ? undefined : helperNext);
  assert.match(helper, /scenario\.saturdayAfternoonFxOpen !== true/);
  assert.match(helper, /localHour >= 14 && localHour < 16/);
  assert.match(helper, /dayIndex === 6/);
  assert.match(helper, /saturdayMiddayFxOpen/);
  assert.match(helper, /saturdayLateFxOpen/);
  assert.match(helper, /saturdayEarlyFxOpen/);
  assert.match(helper, /sundayMiddayFxOpen/);
  assert.match(helper, /sundayEarlyFxOpen/);
  assert.match(helper, /sundayLateFxOpen/);
  assert.match(helper, /fridayEarlyFxOpen/);
  assert.match(helper, /fridayLateFxOpen/);
  assert.doesNotMatch(helper, /isSaturdayMiddayFxOpenHour/);
  assert.doesNotMatch(helper, /isSaturdayLateFxOpenHour/);
  assert.doesNotMatch(helper, /isSundayMiddayFxOpenHour/);
  assert.doesNotMatch(helper, /isSundayEarlyFxOpenHour/);
  assert.doesNotMatch(helper, /isSundayLateFxOpenHour/);
  assert.doesNotMatch(helper, /isSaturdayEarlyFxHour/);
  assert.doesNotMatch(helper, /isFridayEarlyFxOpenHour/);
  assert.match(model, /isSaturdayAfternoonFxOpenHour\(hourOffset, scenario\)/);
  assert.match(model, /function isSundayMiddayFxOpenHour/);
  assert.match(model, /function isSaturdayMiddayFxOpenHour/);
  const sundayStart = model.indexOf("function isSundayMiddayFxOpenHour");
  const sundayNext = model.indexOf("function isSaturdayAfternoonFxOpenHour", sundayStart);
  const sunday = model.slice(sundayStart, sundayNext === -1 ? undefined : sundayNext);
  assert.match(sunday, /dayIndex === 0/);
  assert.match(sunday, /localHour >= 12 && localHour < 14/);
  assert.doesNotMatch(sunday, /saturdayAfternoonFxOpen !== true/);
  const statusStart = model.indexOf("export function getOperationalStatus");
  const statusNext = model.indexOf("\nexport function ", statusStart + 1);
  const status = model.slice(statusStart, statusNext === -1 ? undefined : statusNext);
  assert.match(status, /isSaturdayMiddayFxOpenHour\(hourOffset, scenario\)/);
  assert.match(status, /isSundayMiddayFxOpenHour\(hourOffset, scenario\)/);
  assert.match(status, /isSaturdayAfternoonFxOpenHour\(hourOffset, scenario\)/);
  const saturdayMiddayCall = status.indexOf("isSaturdayMiddayFxOpenHour(hourOffset, scenario)");
  const sundayMiddayCall = status.indexOf("isSundayMiddayFxOpenHour(hourOffset, scenario)");
  const saturdayAfternoonCall = status.indexOf("isSaturdayAfternoonFxOpenHour(hourOffset, scenario)");
  assert.ok(saturdayMiddayCall !== -1 && sundayMiddayCall > saturdayMiddayCall);
  assert.ok(sundayMiddayCall !== -1 && saturdayAfternoonCall > sundayMiddayCall);
  assert.doesNotMatch(model, /Date\.now/);
});

test("older scenario JSON without saturdayAfternoonFxOpen keeps Saturday afternoon on ordinary weekend FX depth", () => {
  assert.equal(sanitizeScenario({}).scenario.saturdayAfternoonFxOpen, false);
  assert.equal(sanitizeScenario({ saturdayAfternoonFxOpen: "true" }).scenario.saturdayAfternoonFxOpen, false);
  assert.ok(sanitizeScenario({ saturdayAfternoonFxOpen: "true" }).errors.some((error) => error.includes("saturdayAfternoonFxOpen")));
});

test("Saturday afternoon FX open is available as a preset button and is not an FX feed", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  const sundayPreset = html.indexOf('data-preset="sundayMiddayFxOpen"');
  const afternoonPreset = html.indexOf('data-preset="saturdayAfternoonFxOpen"');
  assert.ok(sundayPreset !== -1 && afternoonPreset > sundayPreset);
  assert.match(html, /Saturday afternoon FX open \(synthetic\)/);
  assert.match(html, /id="saturdayAfternoonFxOpen"/);
  assert.match(html, /Keep Saturday FX open 14:00 to 16:00/);
  assert.match(html, /Keep Sunday FX open 12:00 to 14:00/);
  assert.match(html, /Keep Saturday FX open 12:00 to 14:00/);
  assert.match(html, /not an FX feed/i);
  assert.doesNotMatch(html, /live queue/i);
});
