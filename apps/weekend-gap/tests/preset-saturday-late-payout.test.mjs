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

function firstSaturdayEveningPayoutOpenHour(scenario) {
  for (let hour = 0; hour < 72; hour += 1) {
    const { dayIndex, localHour } = dayAndHourAt(hour);
    if (dayIndex === 6 && localHour >= 18 && localHour < 20 && getOperationalStatus(scenario, hour).payoutOpen) {
      return hour;
    }
  }
  return null;
}

test("Saturday late payout open keeps the Normal Friday calendar with a Saturday evening payout window", () => {
  const preset = PRESETS.saturdayLatePayoutOpen;
  assert.match(preset.name, /synthetic/i);
  assert.match(preset.name, /Saturday late payout open/i);
  assert.equal(preset.saturdayLatePayoutOpen, true);
  assert.equal(DEFAULT_SCENARIO.saturdayLatePayoutOpen, false);
  assert.equal(preset.fridayEarlyPayoutOpen, false);
  assert.equal(preset.saturdayEarlyPayoutOpen, false);
  assert.equal(preset.sundayLatePayoutClose, false);
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
  assert.notDeepEqual(preset, PRESETS.saturdayEarlyPayoutOpen);
  assert.notDeepEqual(preset, PRESETS.fridayEarlyPayoutOpen);
  const late = runSimulation(preset);
  const normal = runSimulation(DEFAULT_SCENARIO);
  const fridayPayout = runSimulation(PRESETS.fridayEarlyPayoutOpen);
  const saturdayEarly = runSimulation(PRESETS.saturdayEarlyPayoutOpen);
  const sundayPayout = runSimulation(PRESETS.sundayLatePayoutClose);
  assert.equal(late.timeline[3].timeLabel, "Fri 18:00");
  assert.equal(late.timeline[3].payoutOpen, false);
  assert.equal(fridayPayout.timeline[3].payoutOpen, true);
  assert.equal(late.timeline[16].timeLabel, "Sat 07:00");
  assert.equal(late.timeline[16].payoutOpen, false);
  assert.equal(saturdayEarly.timeline[16].payoutOpen, true);
  assert.equal(late.timeline[26].timeLabel, "Sat 17:00");
  assert.equal(late.timeline[26].payoutOpen, false);
  assert.equal(normal.timeline[26].payoutOpen, false);
  assert.equal(late.timeline[27].timeLabel, "Sat 18:00");
  assert.equal(formatTime(27), "Sat 18:00");
  assert.equal(late.timeline[27].weekend, true);
  assert.equal(late.timeline[27].payoutOpen, true);
  assert.equal(normal.timeline[27].payoutOpen, false);
  assert.equal(fridayPayout.timeline[27].payoutOpen, false);
  assert.equal(saturdayEarly.timeline[27].payoutOpen, false);
  assert.equal(sundayPayout.timeline[27].payoutOpen, false);
  assert.equal(late.timeline[27].fxWeekday, false);
  assert.equal(late.timeline[27].issuerOpen, false);
  assert.equal(late.timeline[27].bankOpen, false);
  assert.equal(late.timeline[28].timeLabel, "Sat 19:00");
  assert.equal(late.timeline[28].payoutOpen, true);
  assert.equal(late.timeline[29].timeLabel, "Sat 20:00");
  assert.equal(late.timeline[29].payoutOpen, false);
  assert.equal(late.timeline[49].timeLabel, "Sun 16:00");
  assert.equal(late.timeline[49].payoutOpen, false);
  assert.equal(sundayPayout.timeline[49].payoutOpen, true);
  assert.equal(getOperationalStatus(preset, 27).payoutOpen, true);
  assert.equal(getOperationalStatus(DEFAULT_SCENARIO, 27).payoutOpen, false);
  assert.equal(getOperationalStatus(PRESETS.fridayEarlyPayoutOpen, 27).payoutOpen, false);
  assert.equal(getOperationalStatus(PRESETS.saturdayEarlyPayoutOpen, 27).payoutOpen, false);
  assert.equal(getOperationalStatus(PRESETS.sundayLatePayoutClose, 27).payoutOpen, false);
  const lateOpen = firstSaturdayEveningPayoutOpenHour(preset);
  assert.equal(lateOpen, 27);
  assert.equal(firstSaturdayEveningPayoutOpenHour(PRESETS.fridayEarlyPayoutOpen), null);
  assert.equal(firstSaturdayEveningPayoutOpenHour(PRESETS.saturdayEarlyPayoutOpen), null);
  assert.equal(firstSaturdayEveningPayoutOpenHour(PRESETS.sundayLatePayoutClose), null);
  assert.equal(firstSaturdayEveningPayoutOpenHour(PRESETS.sundayLateBankClose), null);
  assert.equal(firstSaturdayEveningPayoutOpenHour(PRESETS.saturdayEarlyFxOpen), null);
  assert.equal(firstSaturdayEveningPayoutOpenHour(PRESETS.fridayLateFxClose), null);
  assert.ok(lateOpen > 3);
  assert.ok(lateOpen > 16);
  assert.ok(lateOpen < 49);
});

test("older scenario JSON without saturdayLatePayoutOpen keeps Saturday evening payout closed", () => {
  assert.equal(sanitizeScenario({}).scenario.saturdayLatePayoutOpen, false);
  assert.equal(sanitizeScenario({ saturdayLatePayoutOpen: "true" }).scenario.saturdayLatePayoutOpen, false);
  assert.ok(sanitizeScenario({ saturdayLatePayoutOpen: "true" }).errors.some((error) => error.includes("saturdayLatePayoutOpen")));
});

test("Saturday late payout open is available as a preset button and is not a bank feed", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  assert.match(html, /data-preset="saturdayLatePayoutOpen"/);
  assert.match(html, /Saturday late payout open \(synthetic\)/);
  assert.match(html, /id="saturdayLatePayoutOpen"/);
  assert.match(html, /Open Saturday payout Saturday evening/);
  assert.match(html, /not a bank feed/i);
  assert.doesNotMatch(html, /live queue/i);
});
