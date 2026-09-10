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

function firstSundayLatePayoutOpenHour(scenario) {
  for (let hour = 0; hour < 72; hour += 1) {
    const { dayIndex, localHour } = dayAndHourAt(hour);
    if (dayIndex === 0 && localHour >= 16 && localHour < 18 && getOperationalStatus(scenario, hour).payoutOpen) {
      return hour;
    }
  }
  return null;
}

test("Sunday late payout close keeps the Normal Friday calendar with a Sunday evening payout window", () => {
  const preset = PRESETS.sundayLatePayoutClose;
  assert.match(preset.name, /synthetic/i);
  assert.match(preset.name, /Sunday late payout close/i);
  assert.equal(preset.sundayLatePayoutClose, true);
  assert.equal(preset.sundayLateBankClose, false);
  assert.equal(DEFAULT_SCENARIO.sundayLatePayoutClose, false);
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
  const late = runSimulation(preset);
  const normal = runSimulation(DEFAULT_SCENARIO);
  const bank = runSimulation(PRESETS.sundayLateBankClose);
  const stall = runSimulation(PRESETS.sundayStallClose);
  assert.equal(late.timeline[48].timeLabel, "Sun 15:00");
  assert.equal(late.timeline[48].payoutOpen, false);
  assert.equal(normal.timeline[48].payoutOpen, false);
  assert.equal(late.timeline[49].timeLabel, "Sun 16:00");
  assert.equal(formatTime(49), "Sun 16:00");
  assert.equal(late.timeline[49].weekend, true);
  assert.equal(late.timeline[49].payoutOpen, true);
  assert.equal(normal.timeline[49].payoutOpen, false);
  assert.equal(bank.timeline[49].payoutOpen, false);
  assert.equal(bank.timeline[49].bankOpen, true);
  assert.equal(late.timeline[49].bankOpen, false);
  assert.equal(stall.timeline[49].payoutOpen, false);
  assert.equal(late.timeline[49].issuerOpen, false);
  assert.equal(late.timeline[49].bankOpen, false);
  assert.equal(late.timeline[49].fxWeekday, false);
  assert.equal(late.timeline[50].timeLabel, "Sun 17:00");
  assert.equal(late.timeline[50].payoutOpen, true);
  assert.equal(normal.timeline[50].payoutOpen, false);
  assert.equal(late.timeline[51].timeLabel, "Sun 18:00");
  assert.equal(late.timeline[51].payoutOpen, false);
  assert.equal(getOperationalStatus(preset, 49).payoutOpen, true);
  assert.equal(getOperationalStatus(DEFAULT_SCENARIO, 49).payoutOpen, false);
  assert.equal(getOperationalStatus(PRESETS.sundayLateBankClose, 49).payoutOpen, false);
  const lateOpen = firstSundayLatePayoutOpenHour(preset);
  assert.equal(lateOpen, 49);
  assert.equal(firstSundayLatePayoutOpenHour(PRESETS.sundayStallClose), null);
  assert.equal(firstSundayLatePayoutOpenHour(PRESETS.sundayLateBankClose), null);
  assert.equal(firstSundayLatePayoutOpenHour(PRESETS.saturdayEarlyFxOpen), null);
  assert.equal(firstSundayLatePayoutOpenHour(PRESETS.fridayLateFxClose), null);
  assert.equal(firstSundayLatePayoutOpenHour(PRESETS.mondayLateIssuerOpen), null);
  assert.equal(firstSundayLatePayoutOpenHour(PRESETS.earlyMondayBankOpen), null);
  assert.ok(lateOpen > 33);
  assert.ok(lateOpen < 57);
});

test("older scenario JSON without sundayLatePayoutClose keeps Sunday payout closed", () => {
  assert.equal(sanitizeScenario({}).scenario.sundayLatePayoutClose, false);
  assert.equal(sanitizeScenario({ sundayLatePayoutClose: "true" }).scenario.sundayLatePayoutClose, false);
  assert.ok(sanitizeScenario({ sundayLatePayoutClose: "true" }).errors.some((error) => error.includes("sundayLatePayoutClose")));
});

test("Sunday late payout close is available as a preset button and is not a bank feed", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  assert.match(html, /data-preset="sundayLatePayoutClose"/);
  assert.match(html, /Sunday late payout close \(synthetic\)/);
  assert.match(html, /id="sundayLatePayoutClose"/);
  assert.match(html, /Keep Sunday payout open 16:00 to 18:00/);
  assert.match(html, /not a bank feed/i);
  assert.doesNotMatch(html, /live queue/i);
});
