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

function firstSundayMiddayFxOpenHour(scenario) {
  for (let hour = 0; hour < 72; hour += 1) {
    const { dayIndex, localHour } = dayAndHourAt(hour);
    if (dayIndex === 0 && localHour >= 12 && localHour < 14 && getOperationalStatus(scenario, hour).fxWeekday) {
      const ordinary = getOperationalStatus({
        ...scenario,
        sundayMiddayFxOpen: false
      }, hour).fxWeekday;
      if (!ordinary) return hour;
    }
  }
  return null;
}

test("Sunday midday FX open keeps the Normal Friday calendar with a Sunday midday FX window", () => {
  const preset = PRESETS.sundayMiddayFxOpen;
  assert.match(preset.name, /synthetic/i);
  assert.match(preset.name, /Sunday midday FX open/i);
  assert.equal(preset.sundayMiddayFxOpen, true);
  assert.equal(DEFAULT_SCENARIO.sundayMiddayFxOpen, false);
  assert.equal(preset.saturdayMiddayFxOpen, false);
  assert.equal(preset.sundayEarlyFxOpen, false);
  assert.equal(preset.sundayLateFxOpen, false);
  assert.equal(preset.saturdayEarlyFxOpen, false);
  assert.equal(preset.saturdayLateFxOpen, false);
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
  assert.notDeepEqual(preset, PRESETS.saturdayMiddayFxOpen);
  assert.notDeepEqual(preset, PRESETS.sundayEarlyFxOpen);
  assert.notDeepEqual(preset, PRESETS.sundayLateFxOpen);
  assert.notDeepEqual(preset, PRESETS.saturdayEarlyFxOpen);
  assert.notDeepEqual(preset, PRESETS.saturdayLateFxOpen);
  assert.notDeepEqual(preset, PRESETS.fridayEarlyFxOpen);
  assert.notDeepEqual(preset, PRESETS.fridayLateFxOpen);
  assert.notDeepEqual(preset, PRESETS.saturdayEarlyIssuerOpen);
  assert.notDeepEqual(preset, PRESETS.saturdayEarlyBankOpen);
  assert.notDeepEqual(preset, PRESETS.saturdayEarlyPayoutOpen);
  const midday = runSimulation(preset);
  const normal = runSimulation(DEFAULT_SCENARIO);
  const saturdayMidday = runSimulation(PRESETS.saturdayMiddayFxOpen);
  const sundayEarly = runSimulation(PRESETS.sundayEarlyFxOpen);
  const sundayLate = runSimulation(PRESETS.sundayLateFxOpen);
  assert.equal(formatTime(44), "Sun 11:00");
  assert.equal(formatTime(45), "Sun 12:00");
  assert.equal(formatTime(46), "Sun 13:00");
  assert.equal(formatTime(47), "Sun 14:00");
  assert.equal(formatTime(41), "Sun 08:00");
  assert.equal(formatTime(49), "Sun 16:00");
  assert.equal(formatTime(21), "Sat 12:00");
  assert.equal(midday.timeline[44].timeLabel, "Sun 11:00");
  assert.equal(midday.timeline[44].fxWeekday, false);
  assert.equal(sundayEarly.timeline[41].fxWeekday, true);
  assert.equal(midday.timeline[41].fxWeekday, false);
  assert.equal(midday.timeline[45].timeLabel, "Sun 12:00");
  assert.equal(midday.timeline[45].weekend, true);
  assert.equal(midday.timeline[45].fxWeekday, true);
  assert.equal(normal.timeline[45].fxWeekday, false);
  assert.equal(saturdayMidday.timeline[45].fxWeekday, false);
  assert.equal(sundayEarly.timeline[45].fxWeekday, false);
  assert.equal(sundayLate.timeline[45].fxWeekday, false);
  assert.equal(midday.timeline[45].issuerOpen, false);
  assert.equal(midday.timeline[45].bankOpen, false);
  assert.equal(midday.timeline[45].payoutOpen, false);
  assert.equal(midday.timeline[46].timeLabel, "Sun 13:00");
  assert.equal(midday.timeline[46].fxWeekday, true);
  assert.equal(midday.timeline[47].timeLabel, "Sun 14:00");
  assert.equal(midday.timeline[47].fxWeekday, false);
  assert.equal(midday.timeline[49].timeLabel, "Sun 16:00");
  assert.equal(midday.timeline[49].fxWeekday, false);
  assert.equal(sundayLate.timeline[49].fxWeekday, true);
  assert.equal(saturdayMidday.timeline[21].fxWeekday, true);
  assert.equal(midday.timeline[21].fxWeekday, false);
  assert.equal(getOperationalStatus(preset, 45).fxWeekday, true);
  assert.equal(getOperationalStatus(DEFAULT_SCENARIO, 45).fxWeekday, false);
  assert.equal(getOperationalStatus(PRESETS.saturdayMiddayFxOpen, 21).fxWeekday, true);
  assert.equal(getOperationalStatus(preset, 21).fxWeekday, false);
  assert.equal(getOperationalStatus(PRESETS.sundayEarlyFxOpen, 41).fxWeekday, true);
  assert.equal(getOperationalStatus(preset, 41).fxWeekday, false);
  assert.equal(getOperationalStatus(PRESETS.sundayLateFxOpen, 49).fxWeekday, true);
  assert.equal(getOperationalStatus(preset, 49).fxWeekday, false);
  assert.equal(getOperationalStatus(preset, 45).issuerOpen, false);
  assert.equal(getOperationalStatus(preset, 45).bankOpen, false);
  assert.equal(getOperationalStatus(preset, 45).payoutOpen, false);
  const middayOpen = firstSundayMiddayFxOpenHour(preset);
  assert.equal(middayOpen, 45);
  assert.equal(firstSundayMiddayFxOpenHour(DEFAULT_SCENARIO), null);
  assert.equal(firstSundayMiddayFxOpenHour(PRESETS.saturdayMiddayFxOpen), null);
  assert.equal(firstSundayMiddayFxOpenHour(PRESETS.sundayEarlyFxOpen), null);
  assert.equal(firstSundayMiddayFxOpenHour(PRESETS.sundayLateFxOpen), null);
  assert.equal(firstSundayMiddayFxOpenHour(PRESETS.saturdayEarlyFxOpen), null);
  assert.equal(firstSundayMiddayFxOpenHour(PRESETS.saturdayLateFxOpen), null);
  assert.equal(firstSundayMiddayFxOpenHour(PRESETS.fridayEarlyFxOpen), null);
  assert.ok(middayOpen > 44);
  assert.ok(middayOpen < 47);
  const sundayNoon = dayAndHourAt(45);
  const sundayEarlyHour = dayAndHourAt(41);
  const sundayLateHour = dayAndHourAt(49);
  const saturdayNoon = dayAndHourAt(21);
  assert.equal(sundayNoon.dayIndex, 0);
  assert.equal(sundayNoon.localHour, 12);
  assert.equal(sundayEarlyHour.dayIndex, 0);
  assert.equal(sundayEarlyHour.localHour, 8);
  assert.equal(sundayLateHour.dayIndex, 0);
  assert.equal(sundayLateHour.localHour, 16);
  assert.equal(saturdayNoon.dayIndex, 6);
  assert.equal(saturdayNoon.localHour, 12);
  assert.notEqual(sundayNoon.localHour, sundayEarlyHour.localHour);
  assert.notEqual(sundayNoon.localHour, sundayLateHour.localHour);
  assert.notEqual(sundayNoon.dayIndex, saturdayNoon.dayIndex);
});

test("Sunday midday FX open ORs into fxWeekday through isSundayMiddayFxOpenHour after saturdayMiddayFxOpen", async () => {
  const model = await readFile(new URL("../src/model.js", import.meta.url), "utf8");
  const helperStart = model.indexOf("function isSundayMiddayFxOpenHour");
  const helperNext = model.indexOf("\nexport function getOperationalStatus", helperStart);
  const commentStart = model.lastIndexOf("/** Sunday 12:00-14:00", helperStart);
  const helper = model.slice(commentStart === -1 ? helperStart : commentStart, helperNext === -1 ? undefined : helperNext);
  assert.match(helper, /scenario\.sundayMiddayFxOpen !== true/);
  assert.match(helper, /localHour >= 12 && localHour < 14/);
  assert.match(helper, /dayIndex === 0/);
  assert.match(helper, /saturdayMiddayFxOpen/);
  assert.match(helper, /sundayEarlyFxOpen/);
  assert.match(helper, /sundayLateFxOpen/);
  assert.match(helper, /saturdayEarlyFxOpen/);
  assert.match(helper, /saturdayLateFxOpen/);
  assert.match(helper, /fridayEarlyFxOpen/);
  assert.match(helper, /fridayLateFxOpen/);
  assert.doesNotMatch(helper, /isSaturdayMiddayFxOpenHour/);
  assert.doesNotMatch(helper, /isSundayEarlyFxOpenHour/);
  assert.doesNotMatch(helper, /isSundayLateFxOpenHour/);
  assert.doesNotMatch(helper, /isSaturdayEarlyFxHour/);
  assert.doesNotMatch(helper, /isSaturdayLateFxOpenHour/);
  assert.doesNotMatch(helper, /isFridayEarlyFxOpenHour/);
  assert.match(model, /isSundayMiddayFxOpenHour\(hourOffset, scenario\)/);
  assert.match(model, /function isSaturdayMiddayFxOpenHour/);
  assert.match(model, /function isSundayEarlyFxOpenHour/);
  const saturdayStart = model.indexOf("function isSaturdayMiddayFxOpenHour");
  const saturdayNext = model.indexOf("function isSundayMiddayFxOpenHour", saturdayStart);
  const saturday = model.slice(saturdayStart, saturdayNext === -1 ? undefined : saturdayNext);
  assert.match(saturday, /dayIndex === 6/);
  assert.match(saturday, /localHour >= 12 && localHour < 14/);
  assert.doesNotMatch(saturday, /sundayMiddayFxOpen !== true/);
  const statusStart = model.indexOf("export function getOperationalStatus");
  const statusNext = model.indexOf("\nexport function ", statusStart + 1);
  const status = model.slice(statusStart, statusNext === -1 ? undefined : statusNext);
  assert.match(status, /isSaturdayMiddayFxOpenHour\(hourOffset, scenario\)/);
  assert.match(status, /isSundayMiddayFxOpenHour\(hourOffset, scenario\)/);
  const saturdayMiddayCall = status.indexOf("isSaturdayMiddayFxOpenHour(hourOffset, scenario)");
  const sundayMiddayCall = status.indexOf("isSundayMiddayFxOpenHour(hourOffset, scenario)");
  assert.ok(saturdayMiddayCall !== -1 && sundayMiddayCall > saturdayMiddayCall);
  assert.doesNotMatch(model, /Date\.now/);
});

test("older scenario JSON without sundayMiddayFxOpen keeps Sunday midday on ordinary weekend FX depth", () => {
  assert.equal(sanitizeScenario({}).scenario.sundayMiddayFxOpen, false);
  assert.equal(sanitizeScenario({ sundayMiddayFxOpen: "true" }).scenario.sundayMiddayFxOpen, false);
  assert.ok(sanitizeScenario({ sundayMiddayFxOpen: "true" }).errors.some((error) => error.includes("sundayMiddayFxOpen")));
});

test("Sunday midday FX open is available as a preset button and is not an FX feed", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  const saturdayPreset = html.indexOf('data-preset="saturdayMiddayFxOpen"');
  const sundayPreset = html.indexOf('data-preset="sundayMiddayFxOpen"');
  assert.ok(saturdayPreset !== -1 && sundayPreset > saturdayPreset);
  assert.match(html, /Sunday midday FX open \(synthetic\)/);
  assert.match(html, /id="sundayMiddayFxOpen"/);
  assert.match(html, /Keep Sunday FX open 12:00 to 14:00/);
  assert.match(html, /Keep Saturday FX open 12:00 to 14:00/);
  assert.match(html, /not an FX feed/i);
  assert.doesNotMatch(html, /live queue/i);
});
