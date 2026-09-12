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

function firstSaturdayMiddayFxOpenHour(scenario) {
  for (let hour = 0; hour < 72; hour += 1) {
    const { dayIndex, localHour } = dayAndHourAt(hour);
    if (dayIndex === 6 && localHour >= 12 && localHour < 14 && getOperationalStatus(scenario, hour).fxWeekday) {
      const ordinary = getOperationalStatus({
        ...scenario,
        saturdayMiddayFxOpen: false
      }, hour).fxWeekday;
      if (!ordinary) return hour;
    }
  }
  return null;
}

test("Saturday midday FX open keeps the Normal Friday calendar with a Saturday midday FX window", () => {
  const preset = PRESETS.saturdayMiddayFxOpen;
  assert.match(preset.name, /synthetic/i);
  assert.match(preset.name, /Saturday midday FX open/i);
  assert.equal(preset.saturdayMiddayFxOpen, true);
  assert.equal(DEFAULT_SCENARIO.saturdayMiddayFxOpen, false);
  assert.equal(preset.sundayMiddayFxOpen, false);
  assert.equal(preset.saturdayEarlyFxOpen, false);
  assert.equal(preset.saturdayLateFxOpen, false);
  assert.equal(preset.fridayEarlyFxOpen, false);
  assert.equal(preset.fridayLateFxOpen, false);
  assert.equal(preset.sundayEarlyFxOpen, false);
  assert.equal(preset.saturdayEarlyIssuerOpen, false);
  assert.equal(preset.saturdayEarlyBankOpen, false);
  assert.equal(preset.saturdayEarlyPayoutOpen, false);
  assert.equal(preset.mondayHoliday, false);
  assert.equal(preset.demandProfile, DEFAULT_SCENARIO.demandProfile);
  assert.equal(preset.issuerOpenStartHour, DEFAULT_SCENARIO.issuerOpenStartHour);
  assert.equal(preset.bankOpenStartHour, DEFAULT_SCENARIO.bankOpenStartHour);
  assert.equal(preset.redemptionDemandAud, DEFAULT_SCENARIO.redemptionDemandAud);
  assert.notDeepEqual(preset, PRESETS.normal);
  assert.notDeepEqual(preset, PRESETS.saturdayEarlyFxOpen);
  assert.notDeepEqual(preset, PRESETS.sundayMiddayFxOpen);
  assert.notDeepEqual(preset, PRESETS.saturdayLateFxOpen);
  assert.notDeepEqual(preset, PRESETS.fridayEarlyFxOpen);
  assert.notDeepEqual(preset, PRESETS.fridayLateFxOpen);
  assert.notDeepEqual(preset, PRESETS.sundayEarlyFxOpen);
  assert.notDeepEqual(preset, PRESETS.saturdayEarlyIssuerOpen);
  assert.notDeepEqual(preset, PRESETS.saturdayEarlyBankOpen);
  assert.notDeepEqual(preset, PRESETS.saturdayEarlyPayoutOpen);
  const midday = runSimulation(preset);
  const normal = runSimulation(DEFAULT_SCENARIO);
  const saturdayEarly = runSimulation(PRESETS.saturdayEarlyFxOpen);
  const saturdayLate = runSimulation(PRESETS.saturdayLateFxOpen);
  const fridayEarly = runSimulation(PRESETS.fridayEarlyFxOpen);
  assert.equal(formatTime(20), "Sat 11:00");
  assert.equal(formatTime(21), "Sat 12:00");
  assert.equal(formatTime(22), "Sat 13:00");
  assert.equal(formatTime(23), "Sat 14:00");
  assert.equal(formatTime(25), "Sat 16:00");
  assert.equal(midday.timeline[20].timeLabel, "Sat 11:00");
  assert.equal(midday.timeline[20].fxWeekday, false);
  assert.equal(saturdayEarly.timeline[20].fxWeekday, true);
  assert.equal(midday.timeline[21].timeLabel, "Sat 12:00");
  assert.equal(midday.timeline[21].weekend, true);
  assert.equal(midday.timeline[21].fxWeekday, true);
  assert.equal(normal.timeline[21].fxWeekday, false);
  assert.equal(saturdayEarly.timeline[21].fxWeekday, false);
  assert.equal(saturdayLate.timeline[21].fxWeekday, false);
  assert.equal(midday.timeline[21].issuerOpen, false);
  assert.equal(midday.timeline[21].bankOpen, false);
  assert.equal(midday.timeline[21].payoutOpen, false);
  assert.equal(midday.timeline[22].timeLabel, "Sat 13:00");
  assert.equal(midday.timeline[22].fxWeekday, true);
  assert.equal(midday.timeline[23].timeLabel, "Sat 14:00");
  assert.equal(midday.timeline[23].fxWeekday, false);
  assert.equal(midday.timeline[25].timeLabel, "Sat 16:00");
  assert.equal(midday.timeline[25].fxWeekday, false);
  assert.equal(saturdayLate.timeline[25].fxWeekday, true);
  assert.equal(saturdayEarly.timeline[15].fxWeekday, true);
  assert.equal(midday.timeline[15].fxWeekday, false);
  assert.equal(getOperationalStatus(preset, 21).fxWeekday, true);
  assert.equal(getOperationalStatus(DEFAULT_SCENARIO, 21).fxWeekday, false);
  assert.equal(getOperationalStatus(PRESETS.saturdayEarlyFxOpen, 15).fxWeekday, true);
  assert.equal(getOperationalStatus(preset, 15).fxWeekday, false);
  assert.equal(getOperationalStatus(PRESETS.saturdayLateFxOpen, 25).fxWeekday, true);
  assert.equal(getOperationalStatus(preset, 25).fxWeekday, false);
  assert.equal(getOperationalStatus(preset, 21).issuerOpen, false);
  assert.equal(getOperationalStatus(preset, 21).bankOpen, false);
  assert.equal(getOperationalStatus(preset, 21).payoutOpen, false);
  assert.equal(getOperationalStatus(PRESETS.saturdayEarlyIssuerOpen, 17).issuerOpen, true);
  assert.equal(getOperationalStatus(preset, 17).issuerOpen, false);
  assert.equal(getOperationalStatus(PRESETS.saturdayEarlyBankOpen, 17).bankOpen, true);
  assert.equal(getOperationalStatus(preset, 17).bankOpen, false);
  assert.equal(getOperationalStatus(PRESETS.saturdayEarlyPayoutOpen, 16).payoutOpen, true);
  assert.equal(getOperationalStatus(preset, 16).payoutOpen, false);
  assert.equal(fridayEarly.timeline[1].fxWeekday, true);
  assert.equal(midday.timeline[1].fxWeekday, true);
  const middayOpen = firstSaturdayMiddayFxOpenHour(preset);
  assert.equal(middayOpen, 21);
  assert.equal(firstSaturdayMiddayFxOpenHour(DEFAULT_SCENARIO), null);
  assert.equal(firstSaturdayMiddayFxOpenHour(PRESETS.saturdayEarlyFxOpen), null);
  assert.equal(firstSaturdayMiddayFxOpenHour(PRESETS.saturdayLateFxOpen), null);
  assert.equal(firstSaturdayMiddayFxOpenHour(PRESETS.fridayEarlyFxOpen), null);
  assert.equal(firstSaturdayMiddayFxOpenHour(PRESETS.fridayLateFxOpen), null);
  assert.equal(firstSaturdayMiddayFxOpenHour(PRESETS.sundayEarlyFxOpen), null);
  assert.ok(middayOpen > 20);
  assert.ok(middayOpen < 23);
  const saturdayNoon = dayAndHourAt(21);
  const saturdayEarlyHour = dayAndHourAt(15);
  const saturdayLateHour = dayAndHourAt(25);
  assert.equal(saturdayNoon.dayIndex, 6);
  assert.equal(saturdayNoon.localHour, 12);
  assert.equal(saturdayEarlyHour.dayIndex, 6);
  assert.equal(saturdayEarlyHour.localHour, 6);
  assert.equal(saturdayLateHour.dayIndex, 6);
  assert.equal(saturdayLateHour.localHour, 16);
  assert.notEqual(saturdayNoon.localHour, saturdayEarlyHour.localHour);
  assert.notEqual(saturdayNoon.localHour, saturdayLateHour.localHour);
});

test("Saturday midday FX open ORs into fxWeekday through isSaturdayMiddayFxOpenHour after fridayEarlyFxOpen", async () => {
  const model = await readFile(new URL("../src/model.js", import.meta.url), "utf8");
  const helperStart = model.indexOf("function isSaturdayMiddayFxOpenHour");
  const helperNext = model.indexOf("function isSundayMiddayFxOpenHour", helperStart);
  const commentStart = model.lastIndexOf("/** Saturday 12:00-14:00", helperStart);
  const helper = model.slice(commentStart === -1 ? helperStart : commentStart, helperNext === -1 ? undefined : helperNext);
  assert.match(helper, /scenario\.saturdayMiddayFxOpen !== true/);
  assert.match(helper, /localHour >= 12 && localHour < 14/);
  assert.match(helper, /dayIndex === 6/);
  assert.match(helper, /saturdayEarlyFxOpen/);
  assert.match(helper, /saturdayLateFxOpen/);
  assert.match(helper, /fridayEarlyFxOpen/);
  assert.match(helper, /fridayLateFxOpen/);
  assert.match(helper, /sundayEarlyFxOpen/);
  assert.match(helper, /saturdayEarlyIssuerOpen/);
  assert.match(helper, /saturdayEarlyBankOpen/);
  assert.match(helper, /saturdayEarlyPayoutOpen/);
  assert.doesNotMatch(helper, /isSaturdayEarlyFxHour/);
  assert.doesNotMatch(helper, /isSaturdayLateFxOpenHour/);
  assert.doesNotMatch(helper, /isFridayEarlyFxOpenHour/);
  assert.doesNotMatch(helper, /isFridayLateFxOpenHour/);
  assert.doesNotMatch(helper, /isSundayEarlyFxOpenHour/);
  assert.doesNotMatch(helper, /isSaturdayEarlyIssuerHour/);
  assert.doesNotMatch(helper, /isSaturdayEarlyBankHour/);
  assert.doesNotMatch(helper, /isSaturdayEarlyPayoutHour/);
  assert.match(model, /isSaturdayMiddayFxOpenHour\(hourOffset, scenario\)/);
  assert.match(model, /function isSaturdayEarlyFxHour/);
  assert.match(model, /function isSaturdayLateFxOpenHour/);
  assert.match(model, /function isFridayEarlyFxOpenHour/);
  const earlyStart = model.indexOf("function isSaturdayEarlyFxHour");
  const earlyNext = model.indexOf("\n/** Sunday 16:00-18:00", earlyStart);
  const early = model.slice(earlyStart, earlyNext === -1 ? undefined : earlyNext);
  assert.match(early, /localHour >= 6 && localHour < 12/);
  assert.doesNotMatch(early, /saturdayMiddayFxOpen !== true/);
  const lateStart = model.indexOf("function isSaturdayLateFxOpenHour");
  const lateNext = model.indexOf("\n/** Sunday 16:00-18:00", lateStart);
  const late = model.slice(lateStart, lateNext === -1 ? undefined : lateNext);
  assert.match(late, /localHour >= 16 && localHour < 18/);
  assert.doesNotMatch(late, /saturdayMiddayFxOpen !== true/);
  const statusStart = model.indexOf("export function getOperationalStatus");
  const statusNext = model.indexOf("\nexport function ", statusStart + 1);
  const status = model.slice(statusStart, statusNext === -1 ? undefined : statusNext);
  assert.match(status, /isFridayEarlyFxOpenHour\(hourOffset, scenario\)/);
  assert.match(status, /isSaturdayMiddayFxOpenHour\(hourOffset, scenario\)/);
  assert.match(status, /isSundayMiddayFxOpenHour\(hourOffset, scenario\)/);
  assert.match(status, /isSaturdayEarlyFxHour\(hourOffset, scenario\)/);
  assert.match(status, /isSaturdayLateFxOpenHour\(hourOffset, scenario\)/);
  const fridayEarlyCall = status.indexOf("isFridayEarlyFxOpenHour(hourOffset, scenario)");
  const saturdayMiddayCall = status.indexOf("isSaturdayMiddayFxOpenHour(hourOffset, scenario)");
  const sundayMiddayCall = status.indexOf("isSundayMiddayFxOpenHour(hourOffset, scenario)");
  assert.ok(fridayEarlyCall !== -1 && saturdayMiddayCall > fridayEarlyCall);
  assert.ok(saturdayMiddayCall !== -1 && sundayMiddayCall > saturdayMiddayCall);
  assert.doesNotMatch(model, /Date\.now/);
});

test("older scenario JSON without saturdayMiddayFxOpen keeps Saturday midday on ordinary weekend FX depth", () => {
  assert.equal(sanitizeScenario({}).scenario.saturdayMiddayFxOpen, false);
  assert.equal(sanitizeScenario({ saturdayMiddayFxOpen: "true" }).scenario.saturdayMiddayFxOpen, false);
  assert.ok(sanitizeScenario({ saturdayMiddayFxOpen: "true" }).errors.some((error) => error.includes("saturdayMiddayFxOpen")));
});

test("Saturday midday FX open is available as a preset button and is not an FX feed", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  const fridayPreset = html.indexOf('data-preset="fridayEarlyFxOpen"');
  const middayPreset = html.indexOf('data-preset="saturdayMiddayFxOpen"');
  const sundayPreset = html.indexOf('data-preset="sundayMiddayFxOpen"');
  assert.ok(fridayPreset !== -1 && middayPreset > fridayPreset);
  assert.ok(sundayPreset > middayPreset);
  assert.match(html, /Saturday midday FX open \(synthetic\)/);
  assert.match(html, /id="saturdayMiddayFxOpen"/);
  assert.match(html, /Keep Saturday FX open 12:00 to 14:00/);
  assert.match(html, /Keep Saturday FX open 16:00 to 18:00/);
  assert.match(html, /Open Saturday FX Saturday morning/);
  assert.match(html, /not an FX feed/i);
  assert.doesNotMatch(html, /live queue/i);
});
