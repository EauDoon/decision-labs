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

function firstSundayLateIssuerOpenHour(scenario) {
  for (let hour = 0; hour < 72; hour += 1) {
    const { dayIndex, localHour } = dayAndHourAt(hour);
    if (dayIndex === 0 && localHour >= 16 && localHour < 18 && getOperationalStatus(scenario, hour).issuerOpen) {
      return hour;
    }
  }
  return null;
}

test("Sunday late issuer close keeps the Normal Friday calendar with a Sunday evening issuer window", () => {
  const preset = PRESETS.sundayLateIssuerClose;
  assert.match(preset.name, /synthetic/i);
  assert.match(preset.name, /Sunday late issuer close/i);
  assert.equal(preset.sundayLateIssuerClose, true);
  assert.equal(DEFAULT_SCENARIO.sundayLateIssuerClose, false);
  assert.equal(preset.sundayLateBankClose, false);
  assert.equal(preset.sundayLatePayoutClose, false);
  assert.equal(preset.sundayEarlyPayoutOpen, false);
  assert.equal(preset.saturdayLatePayoutOpen, false);
  assert.equal(preset.fridayEarlyPayoutOpen, false);
  assert.equal(preset.saturdayEarlyPayoutOpen, false);
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
  assert.notDeepEqual(preset, PRESETS.saturdayLatePayoutOpen);
  assert.notDeepEqual(preset, PRESETS.sundayEarlyPayoutOpen);
  assert.notDeepEqual(preset, PRESETS.sundayEarlyIssuerOpen);
  assert.notDeepEqual(preset, PRESETS.saturdayEarlyIssuerOpen);
  const late = runSimulation(preset);
  const normal = runSimulation(DEFAULT_SCENARIO);
  const bank = runSimulation(PRESETS.sundayLateBankClose);
  const payout = runSimulation(PRESETS.sundayLatePayoutClose);
  const early = runSimulation(PRESETS.sundayEarlyPayoutOpen);
  assert.equal(late.timeline[48].timeLabel, "Sun 15:00");
  assert.equal(late.timeline[48].issuerOpen, false);
  assert.equal(normal.timeline[48].issuerOpen, false);
  assert.equal(late.timeline[49].timeLabel, "Sun 16:00");
  assert.equal(formatTime(49), "Sun 16:00");
  assert.equal(late.timeline[49].weekend, true);
  assert.equal(late.timeline[49].issuerOpen, true);
  assert.equal(normal.timeline[49].issuerOpen, false);
  assert.equal(bank.timeline[49].issuerOpen, false);
  assert.equal(bank.timeline[49].bankOpen, true);
  assert.equal(payout.timeline[49].issuerOpen, false);
  assert.equal(payout.timeline[49].payoutOpen, true);
  assert.equal(late.timeline[49].bankOpen, false);
  assert.equal(late.timeline[49].payoutOpen, false);
  assert.equal(late.timeline[49].fxWeekday, false);
  assert.equal(late.timeline[50].timeLabel, "Sun 17:00");
  assert.equal(late.timeline[50].issuerOpen, true);
  assert.equal(normal.timeline[50].issuerOpen, false);
  assert.equal(late.timeline[51].timeLabel, "Sun 18:00");
  assert.equal(late.timeline[51].issuerOpen, false);
  assert.equal(early.timeline[41].issuerOpen, false);
  assert.equal(early.timeline[41].payoutOpen, true);
  assert.equal(late.timeline[41].payoutOpen, false);
  assert.equal(getOperationalStatus(preset, 49).issuerOpen, true);
  assert.equal(getOperationalStatus(DEFAULT_SCENARIO, 49).issuerOpen, false);
  assert.equal(getOperationalStatus(PRESETS.sundayLateBankClose, 49).issuerOpen, false);
  assert.equal(getOperationalStatus(PRESETS.sundayLatePayoutClose, 49).issuerOpen, false);
  assert.equal(getOperationalStatus(preset, 49).bankOpen, false);
  assert.equal(getOperationalStatus(preset, 49).payoutOpen, false);
  const lateOpen = firstSundayLateIssuerOpenHour(preset);
  assert.equal(lateOpen, 49);
  assert.equal(firstSundayLateIssuerOpenHour(PRESETS.sundayLateBankClose), null);
  assert.equal(firstSundayLateIssuerOpenHour(PRESETS.sundayLatePayoutClose), null);
  assert.equal(firstSundayLateIssuerOpenHour(PRESETS.sundayEarlyPayoutOpen), null);
  assert.equal(firstSundayLateIssuerOpenHour(PRESETS.sundayStallClose), null);
  assert.equal(firstSundayLateIssuerOpenHour(PRESETS.saturdayEarlyFxOpen), null);
  assert.equal(firstSundayLateIssuerOpenHour(PRESETS.fridayLateFxClose), null);
  assert.ok(lateOpen > 33);
  assert.ok(lateOpen < 57);
});

test("older scenario JSON without sundayLateIssuerClose keeps Sunday issuer closed", () => {
  assert.equal(sanitizeScenario({}).scenario.sundayLateIssuerClose, false);
  assert.equal(sanitizeScenario({ sundayLateIssuerClose: "true" }).scenario.sundayLateIssuerClose, false);
  assert.ok(sanitizeScenario({ sundayLateIssuerClose: "true" }).errors.some((error) => error.includes("sundayLateIssuerClose")));
});

test("Sunday late issuer close is available as a preset button and is not a bank feed", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  assert.match(html, /data-preset="sundayLateIssuerClose"/);
  assert.match(html, /Sunday late issuer close \(synthetic\)/);
  assert.match(html, /id="sundayLateIssuerClose"/);
  assert.match(html, /Keep Sunday issuer open 16:00 to 18:00/);
  assert.match(html, /not a bank feed/i);
  assert.doesNotMatch(html, /live queue/i);
});
