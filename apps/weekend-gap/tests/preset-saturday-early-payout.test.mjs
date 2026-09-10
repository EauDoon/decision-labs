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

function firstSaturdayMorningPayoutOpenHour(scenario) {
  for (let hour = 0; hour < 72; hour += 1) {
    const { dayIndex, localHour } = dayAndHourAt(hour);
    if (dayIndex === 6 && localHour >= 7 && localHour < 12 && getOperationalStatus(scenario, hour).payoutOpen) {
      return hour;
    }
  }
  return null;
}

test("Saturday early payout open keeps the Normal Friday calendar with an earlier Saturday morning payout window", () => {
  const preset = PRESETS.saturdayEarlyPayoutOpen;
  assert.match(preset.name, /synthetic/i);
  assert.match(preset.name, /Saturday early payout open/i);
  assert.equal(preset.saturdayEarlyPayoutOpen, true);
  assert.equal(DEFAULT_SCENARIO.saturdayEarlyPayoutOpen, false);
  assert.equal(preset.sundayLatePayoutClose, false);
  assert.equal(preset.fridayEarlyPayoutOpen, false);
  assert.equal(preset.sundayLateBankClose, false);
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
  assert.notDeepEqual(preset, PRESETS.mondayLateIssuerOpen);
  assert.notDeepEqual(preset, PRESETS.saturdayEarlyFxOpen);
  assert.notDeepEqual(preset, PRESETS.sundayLateBankClose);
  assert.notDeepEqual(preset, PRESETS.sundayLatePayoutClose);
  assert.notDeepEqual(preset, PRESETS.fridayEarlyPayoutOpen);
  assert.notDeepEqual(preset, PRESETS.saturdayLatePayoutOpen);
  const early = runSimulation(preset);
  const normal = runSimulation(DEFAULT_SCENARIO);
  const fx = runSimulation(PRESETS.saturdayEarlyFxOpen);
  const sundayPayout = runSimulation(PRESETS.sundayLatePayoutClose);
  assert.equal(early.timeline[16].timeLabel, "Sat 07:00");
  assert.equal(formatTime(16), "Sat 07:00");
  assert.equal(early.timeline[15].timeLabel, "Sat 06:00");
  assert.equal(early.timeline[15].payoutOpen, false);
  assert.equal(normal.timeline[15].payoutOpen, false);
  assert.equal(early.timeline[16].weekend, true);
  assert.equal(early.timeline[16].payoutOpen, true);
  assert.equal(normal.timeline[16].payoutOpen, false);
  assert.equal(fx.timeline[16].payoutOpen, false);
  assert.equal(fx.timeline[16].fxWeekday, true);
  assert.equal(early.timeline[16].fxWeekday, false);
  assert.equal(early.timeline[16].issuerOpen, false);
  assert.equal(early.timeline[16].bankOpen, false);
  assert.equal(early.timeline[17].timeLabel, "Sat 08:00");
  assert.equal(early.timeline[17].payoutOpen, true);
  assert.equal(early.timeline[18].timeLabel, "Sat 09:00");
  assert.equal(early.timeline[18].payoutOpen, false);
  assert.equal(early.timeline[49].timeLabel, "Sun 16:00");
  assert.equal(early.timeline[49].payoutOpen, false);
  assert.equal(sundayPayout.timeline[49].payoutOpen, true);
  assert.equal(sundayPayout.timeline[16].payoutOpen, false);
  assert.equal(getOperationalStatus(preset, 16).payoutOpen, true);
  assert.equal(getOperationalStatus(DEFAULT_SCENARIO, 16).payoutOpen, false);
  assert.equal(getOperationalStatus(PRESETS.sundayLatePayoutClose, 16).payoutOpen, false);
  assert.equal(getOperationalStatus(PRESETS.saturdayEarlyFxOpen, 16).payoutOpen, false);
  const earlyOpen = firstSaturdayMorningPayoutOpenHour(preset);
  assert.equal(earlyOpen, 16);
  assert.equal(firstSaturdayMorningPayoutOpenHour(PRESETS.sundayLatePayoutClose), null);
  assert.equal(firstSaturdayMorningPayoutOpenHour(PRESETS.sundayLateBankClose), null);
  assert.equal(firstSaturdayMorningPayoutOpenHour(PRESETS.saturdayEarlyFxOpen), null);
  assert.equal(firstSaturdayMorningPayoutOpenHour(PRESETS.fridayLateFxClose), null);
  assert.equal(firstSaturdayMorningPayoutOpenHour(PRESETS.mondayLateIssuerOpen), null);
  assert.equal(firstSaturdayMorningPayoutOpenHour(PRESETS.earlyMondayBankOpen), null);
  assert.ok(earlyOpen < 49);
  assert.ok(earlyOpen < 57);
});

test("older scenario JSON without saturdayEarlyPayoutOpen keeps Saturday payout closed", () => {
  assert.equal(sanitizeScenario({}).scenario.saturdayEarlyPayoutOpen, false);
  assert.equal(sanitizeScenario({ saturdayEarlyPayoutOpen: "true" }).scenario.saturdayEarlyPayoutOpen, false);
  assert.ok(sanitizeScenario({ saturdayEarlyPayoutOpen: "true" }).errors.some((error) => error.includes("saturdayEarlyPayoutOpen")));
});

test("Saturday early payout open is available as a preset button and is not a bank feed", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  assert.match(html, /data-preset="saturdayEarlyPayoutOpen"/);
  assert.match(html, /Saturday early payout open \(synthetic\)/);
  assert.match(html, /id="saturdayEarlyPayoutOpen"/);
  assert.match(html, /Open Saturday payout Saturday morning/);
  assert.match(html, /not a bank feed/i);
  assert.doesNotMatch(html, /live queue/i);
});
