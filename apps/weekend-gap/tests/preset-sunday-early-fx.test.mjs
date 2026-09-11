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

function firstSundayEarlyFxOpenHour(scenario) {
  for (let hour = 0; hour < 72; hour += 1) {
    const { dayIndex, localHour } = dayAndHourAt(hour);
    if (dayIndex === 0 && localHour >= 8 && localHour < 10 && getOperationalStatus(scenario, hour).fxWeekday) {
      const ordinary = getOperationalStatus({
        ...scenario,
        sundayEarlyFxOpen: false
      }, hour).fxWeekday;
      if (!ordinary) return hour;
    }
  }
  return null;
}

test("Sunday early FX open keeps the Normal Friday calendar with a Sunday morning FX window", () => {
  const preset = PRESETS.sundayEarlyFxOpen;
  assert.match(preset.name, /synthetic/i);
  assert.match(preset.name, /Sunday early FX open/i);
  assert.equal(preset.sundayEarlyFxOpen, true);
  assert.equal(DEFAULT_SCENARIO.sundayEarlyFxOpen, false);
  assert.equal(preset.sundayLateFxOpen, false);
  assert.equal(preset.saturdayLateFxOpen, false);
  assert.equal(preset.fridayLateFxOpen, false);
  assert.equal(preset.sundayEarlyPayoutOpen, false);
  assert.equal(preset.sundayEarlyIssuerOpen, false);
  assert.equal(preset.saturdayEarlyFxOpen, false);
  assert.equal(preset.fridayFxLateClose, false);
  assert.equal(preset.demandProfile, DEFAULT_SCENARIO.demandProfile);
  assert.equal(preset.mondayHoliday, false);
  assert.equal(preset.saturdayHoliday, false);
  assert.equal(preset.issuerOpenStartHour, DEFAULT_SCENARIO.issuerOpenStartHour);
  assert.equal(preset.issuerOpenEndHour, DEFAULT_SCENARIO.issuerOpenEndHour);
  assert.equal(preset.bankOpenStartHour, DEFAULT_SCENARIO.bankOpenStartHour);
  assert.equal(preset.bankOpenEndHour, DEFAULT_SCENARIO.bankOpenEndHour);
  assert.equal(preset.payoutOpenStartHour, DEFAULT_SCENARIO.payoutOpenStartHour);
  assert.equal(preset.payoutOpenEndHour, DEFAULT_SCENARIO.payoutOpenEndHour);
  assert.equal(preset.redemptionDemandAud, DEFAULT_SCENARIO.redemptionDemandAud);
  assert.notDeepEqual(preset, PRESETS.normal);
  assert.notDeepEqual(preset, PRESETS.sundayLateFxOpen);
  assert.notDeepEqual(preset, PRESETS.saturdayLateFxOpen);
  assert.notDeepEqual(preset, PRESETS.fridayLateFxOpen);
  assert.notDeepEqual(preset, PRESETS.sundayEarlyPayoutOpen);
  assert.notDeepEqual(preset, PRESETS.sundayEarlyIssuerOpen);
  const early = runSimulation(preset);
  const normal = runSimulation(DEFAULT_SCENARIO);
  const late = runSimulation(PRESETS.sundayLateFxOpen);
  const earlyPayout = runSimulation(PRESETS.sundayEarlyPayoutOpen);
  const earlyIssuer = runSimulation(PRESETS.sundayEarlyIssuerOpen);
  assert.equal(early.timeline[41].timeLabel, "Sun 08:00");
  assert.equal(formatTime(41), "Sun 08:00");
  assert.equal(early.timeline[41].weekend, true);
  assert.equal(early.timeline[41].fxWeekday, true);
  assert.equal(normal.timeline[41].fxWeekday, false);
  assert.equal(late.timeline[41].fxWeekday, false);
  assert.equal(earlyPayout.timeline[41].payoutOpen, true);
  assert.equal(earlyPayout.timeline[41].fxWeekday, false);
  assert.equal(earlyIssuer.timeline[41].issuerOpen, true);
  assert.equal(earlyIssuer.timeline[41].fxWeekday, false);
  assert.equal(early.timeline[41].bankOpen, false);
  assert.equal(early.timeline[41].issuerOpen, false);
  assert.equal(early.timeline[41].payoutOpen, false);
  assert.equal(early.timeline[42].timeLabel, "Sun 09:00");
  assert.equal(early.timeline[42].fxWeekday, true);
  assert.equal(early.timeline[43].timeLabel, "Sun 10:00");
  assert.equal(early.timeline[43].fxWeekday, false);
  assert.equal(early.timeline[49].timeLabel, "Sun 16:00");
  assert.equal(early.timeline[49].fxWeekday, false);
  assert.equal(late.timeline[49].fxWeekday, true);
  assert.equal(getOperationalStatus(preset, 41).fxWeekday, true);
  assert.equal(getOperationalStatus(DEFAULT_SCENARIO, 41).fxWeekday, false);
  assert.equal(getOperationalStatus(PRESETS.sundayLateFxOpen, 41).fxWeekday, false);
  assert.equal(getOperationalStatus(PRESETS.sundayEarlyPayoutOpen, 41).payoutOpen, true);
  assert.equal(getOperationalStatus(preset, 41).payoutOpen, false);
  assert.equal(getOperationalStatus(preset, 41).issuerOpen, false);
  assert.equal(getOperationalStatus(preset, 41).bankOpen, false);
  const earlyOpen = firstSundayEarlyFxOpenHour(preset);
  assert.equal(earlyOpen, 41);
  assert.equal(firstSundayEarlyFxOpenHour(DEFAULT_SCENARIO), null);
  assert.equal(firstSundayEarlyFxOpenHour(PRESETS.sundayLateFxOpen), null);
  assert.equal(firstSundayEarlyFxOpenHour(PRESETS.saturdayLateFxOpen), null);
  assert.equal(firstSundayEarlyFxOpenHour(PRESETS.fridayLateFxOpen), null);
  assert.equal(firstSundayEarlyFxOpenHour(PRESETS.sundayEarlyPayoutOpen), null);
  assert.equal(firstSundayEarlyFxOpenHour(PRESETS.sundayEarlyIssuerOpen), null);
  assert.ok(earlyOpen > 33);
  assert.ok(earlyOpen < 49);
});

test("Sunday early FX open ORs into fxWeekday through isSundayEarlyFxOpenHour, not Sunday late FX helpers", async () => {
  const model = await readFile(new URL("../src/model.js", import.meta.url), "utf8");
  const helperStart = model.indexOf("function isSundayEarlyFxOpenHour");
  const helperNext = model.indexOf("\nexport function getOperationalStatus", helperStart);
  const helper = model.slice(helperStart, helperNext === -1 ? undefined : helperNext);
  assert.match(helper, /scenario\.sundayEarlyFxOpen !== true/);
  assert.match(helper, /localHour >= 8 && localHour < 10/);
  assert.doesNotMatch(helper, /isSundayLateFxOpenHour/);
  assert.doesNotMatch(helper, /isSaturdayLateFxOpenHour/);
  assert.doesNotMatch(helper, /isFridayLateFxOpenHour/);
  assert.doesNotMatch(helper, /isSundayEarlyPayoutHour/);
  assert.doesNotMatch(helper, /isSundayEarlyIssuerHour/);
  assert.match(model, /isSundayEarlyFxOpenHour\(hourOffset, scenario\)/);
  const statusStart = model.indexOf("export function getOperationalStatus");
  const statusNext = model.indexOf("\nexport function ", statusStart + 1);
  const status = model.slice(statusStart, statusNext === -1 ? undefined : statusNext);
  assert.match(status, /isSundayLateFxOpenHour\(hourOffset, scenario\)/);
  assert.match(status, /isSundayEarlyFxOpenHour\(hourOffset, scenario\)/);
  assert.doesNotMatch(model, /Date\.now/);
});

test("older scenario JSON without sundayEarlyFxOpen keeps Sunday morning on ordinary weekend FX depth", () => {
  assert.equal(sanitizeScenario({}).scenario.sundayEarlyFxOpen, false);
  assert.equal(sanitizeScenario({ sundayEarlyFxOpen: "true" }).scenario.sundayEarlyFxOpen, false);
  assert.ok(sanitizeScenario({ sundayEarlyFxOpen: "true" }).errors.some((error) => error.includes("sundayEarlyFxOpen")));
});

test("Sunday early FX open is available as a preset button and is not an FX feed", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  assert.match(html, /data-preset="sundayEarlyFxOpen"/);
  assert.match(html, /Sunday early FX open \(synthetic\)/);
  assert.match(html, /id="sundayEarlyFxOpen"/);
  assert.match(html, /Keep Sunday FX open 08:00 to 10:00/);
  assert.match(html, /not an FX feed/i);
  assert.doesNotMatch(html, /live queue/i);
});
