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

function firstSaturdayMorningFxOpenHour(scenario) {
  for (let hour = 0; hour < 72; hour += 1) {
    const { dayIndex, localHour } = dayAndHourAt(hour);
    if (dayIndex === 6 && localHour >= 6 && localHour < 12 && getOperationalStatus(scenario, hour).fxWeekday) {
      return hour;
    }
  }
  return null;
}

test("Saturday early FX open keeps the Normal Friday calendar with an earlier Saturday morning FX window", () => {
  const preset = PRESETS.saturdayEarlyFxOpen;
  assert.match(preset.name, /synthetic/i);
  assert.match(preset.name, /Saturday early FX open/i);
  assert.equal(preset.saturdayEarlyFxOpen, true);
  assert.equal(DEFAULT_SCENARIO.saturdayEarlyFxOpen, false);
  assert.equal(preset.fridayFxLateClose, false);
  assert.equal(preset.saturdayMiddayFxOpen, false);
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
  assert.notDeepEqual(preset, PRESETS.paydayFridayBurst);
  assert.notDeepEqual(preset, PRESETS.publicHolidayMonday);
  assert.notDeepEqual(preset, PRESETS.saturdayMarketBurst);
  assert.notDeepEqual(preset, PRESETS.sundayStallClose);
  assert.notDeepEqual(preset, PRESETS.thinSaturdayFx);
  assert.notDeepEqual(preset, PRESETS.thinFxTightWindows);
  assert.notDeepEqual(preset, PRESETS.longWeekendFridayStart);
  assert.notDeepEqual(preset, PRESETS.compressedFridayClose);
  assert.notDeepEqual(preset, PRESETS.earlyMondayBankOpen);
  assert.notDeepEqual(preset, PRESETS.fridayLateFxClose);
  assert.notDeepEqual(preset, PRESETS.saturdayMiddayFxOpen);
  assert.notDeepEqual(preset, PRESETS.saturdayLateFxOpen);
  assert.notDeepEqual(preset, PRESETS.mondayLateIssuerOpen);
  assert.notDeepEqual(preset, PRESETS.sundayLateBankClose);
  assert.notDeepEqual(preset, PRESETS.sundayLatePayoutClose);
  assert.notDeepEqual(preset, PRESETS.saturdayEarlyPayoutOpen);
  assert.notDeepEqual(preset, PRESETS.fridayEarlyPayoutOpen);
  const early = runSimulation(preset);
  const normal = runSimulation(DEFAULT_SCENARIO);
  assert.equal(early.timeline[14].timeLabel, "Sat 05:00");
  assert.equal(early.timeline[14].fxWeekday, false);
  assert.equal(normal.timeline[14].fxWeekday, false);
  assert.equal(early.timeline[15].timeLabel, "Sat 06:00");
  assert.equal(formatTime(15), "Sat 06:00");
  assert.equal(early.timeline[15].weekend, true);
  assert.equal(early.timeline[15].fxWeekday, true);
  assert.equal(normal.timeline[15].fxWeekday, false);
  assert.equal(early.timeline[15].issuerOpen, false);
  assert.equal(early.timeline[15].bankOpen, false);
  assert.equal(early.timeline[15].payoutOpen, false);
  assert.equal(early.timeline[15].fxDepthAudPerHour, DEFAULT_SCENARIO.fxDepthAudPerHour);
  assert.equal(normal.timeline[15].fxDepthAudPerHour, DEFAULT_SCENARIO.fxDepthAudPerHour / DEFAULT_SCENARIO.weekendFxMultiplier);
  assert.equal(early.timeline[20].timeLabel, "Sat 11:00");
  assert.equal(early.timeline[20].fxWeekday, true);
  assert.equal(early.timeline[21].timeLabel, "Sat 12:00");
  assert.equal(early.timeline[21].fxWeekday, false);
  assert.equal(getOperationalStatus(preset, 15).fxWeekday, true);
  assert.equal(getOperationalStatus(DEFAULT_SCENARIO, 15).fxWeekday, false);
  const earlyOpen = firstSaturdayMorningFxOpenHour(preset);
  assert.equal(earlyOpen, 15);
  assert.equal(firstSaturdayMorningFxOpenHour(PRESETS.thinSaturdayFx), null);
  assert.equal(firstSaturdayMorningFxOpenHour(PRESETS.fridayLateFxClose), null);
  assert.equal(firstSaturdayMorningFxOpenHour(PRESETS.saturdayMiddayFxOpen), null);
  assert.equal(firstSaturdayMorningFxOpenHour(PRESETS.saturdayLateFxOpen), null);
  assert.equal(firstSaturdayMorningFxOpenHour(PRESETS.mondayLateIssuerOpen), null);
  assert.equal(firstSaturdayMorningFxOpenHour(PRESETS.earlyMondayBankOpen), null);
  assert.ok(earlyOpen < 57);
});

test("older scenario JSON without saturdayEarlyFxOpen keeps Saturday morning weekend FX thinning", () => {
  assert.equal(sanitizeScenario({}).scenario.saturdayEarlyFxOpen, false);
  assert.equal(sanitizeScenario({ saturdayEarlyFxOpen: "true" }).scenario.saturdayEarlyFxOpen, false);
  assert.ok(sanitizeScenario({ saturdayEarlyFxOpen: "true" }).errors.some((error) => error.includes("saturdayEarlyFxOpen")));
});

test("Saturday early FX open is available as a preset button and is not a bank feed", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  assert.match(html, /data-preset="saturdayEarlyFxOpen"/);
  assert.match(html, /Saturday early FX open \(synthetic\)/);
  assert.match(html, /id="saturdayEarlyFxOpen"/);
  assert.match(html, /Open Saturday FX Saturday morning/);
  assert.match(html, /not a bank feed/i);
  assert.doesNotMatch(html, /live queue/i);
});
