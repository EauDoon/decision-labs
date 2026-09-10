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

function firstSundayEarlyIssuerOpenHour(scenario) {
  for (let hour = 0; hour < 72; hour += 1) {
    const { dayIndex, localHour } = dayAndHourAt(hour);
    if (dayIndex === 0 && localHour >= 8 && localHour < 10 && getOperationalStatus(scenario, hour).issuerOpen) {
      return hour;
    }
  }
  return null;
}

test("Sunday early issuer open keeps the Normal Friday calendar with a Sunday morning issuer window", () => {
  const preset = PRESETS.sundayEarlyIssuerOpen;
  assert.match(preset.name, /synthetic/i);
  assert.match(preset.name, /Sunday early issuer open/i);
  assert.equal(preset.sundayEarlyIssuerOpen, true);
  assert.equal(DEFAULT_SCENARIO.sundayEarlyIssuerOpen, false);
  assert.equal(preset.sundayLateIssuerClose, false);
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
  assert.notDeepEqual(preset, PRESETS.sundayLateIssuerClose);
  const early = runSimulation(preset);
  const normal = runSimulation(DEFAULT_SCENARIO);
  const lateIssuer = runSimulation(PRESETS.sundayLateIssuerClose);
  const bank = runSimulation(PRESETS.sundayLateBankClose);
  const payout = runSimulation(PRESETS.sundayLatePayoutClose);
  const earlyPayout = runSimulation(PRESETS.sundayEarlyPayoutOpen);
  assert.equal(early.timeline[40].timeLabel, "Sun 07:00");
  assert.equal(early.timeline[40].issuerOpen, false);
  assert.equal(normal.timeline[40].issuerOpen, false);
  assert.equal(early.timeline[41].timeLabel, "Sun 08:00");
  assert.equal(formatTime(41), "Sun 08:00");
  assert.equal(early.timeline[41].weekend, true);
  assert.equal(early.timeline[41].issuerOpen, true);
  assert.equal(normal.timeline[41].issuerOpen, false);
  assert.equal(lateIssuer.timeline[41].issuerOpen, false);
  assert.equal(bank.timeline[41].issuerOpen, false);
  assert.equal(payout.timeline[41].issuerOpen, false);
  assert.equal(earlyPayout.timeline[41].issuerOpen, false);
  assert.equal(earlyPayout.timeline[41].payoutOpen, true);
  assert.equal(early.timeline[41].payoutOpen, false);
  assert.equal(early.timeline[41].bankOpen, false);
  assert.equal(early.timeline[41].fxWeekday, false);
  assert.equal(early.timeline[42].timeLabel, "Sun 09:00");
  assert.equal(early.timeline[42].issuerOpen, true);
  assert.equal(early.timeline[43].timeLabel, "Sun 10:00");
  assert.equal(early.timeline[43].issuerOpen, false);
  assert.equal(early.timeline[49].timeLabel, "Sun 16:00");
  assert.equal(early.timeline[49].issuerOpen, false);
  assert.equal(lateIssuer.timeline[49].issuerOpen, true);
  assert.equal(getOperationalStatus(preset, 41).issuerOpen, true);
  assert.equal(getOperationalStatus(DEFAULT_SCENARIO, 41).issuerOpen, false);
  assert.equal(getOperationalStatus(PRESETS.sundayLateIssuerClose, 41).issuerOpen, false);
  assert.equal(getOperationalStatus(PRESETS.sundayLateBankClose, 41).issuerOpen, false);
  assert.equal(getOperationalStatus(PRESETS.sundayLatePayoutClose, 41).issuerOpen, false);
  assert.equal(getOperationalStatus(PRESETS.sundayEarlyPayoutOpen, 41).issuerOpen, false);
  assert.equal(getOperationalStatus(preset, 41).bankOpen, false);
  assert.equal(getOperationalStatus(preset, 41).payoutOpen, false);
  const earlyOpen = firstSundayEarlyIssuerOpenHour(preset);
  assert.equal(earlyOpen, 41);
  assert.equal(firstSundayEarlyIssuerOpenHour(PRESETS.sundayLateIssuerClose), null);
  assert.equal(firstSundayEarlyIssuerOpenHour(PRESETS.sundayLateBankClose), null);
  assert.equal(firstSundayEarlyIssuerOpenHour(PRESETS.sundayLatePayoutClose), null);
  assert.equal(firstSundayEarlyIssuerOpenHour(PRESETS.sundayEarlyPayoutOpen), null);
  assert.equal(firstSundayEarlyIssuerOpenHour(PRESETS.sundayStallClose), null);
  assert.equal(firstSundayEarlyIssuerOpenHour(PRESETS.saturdayEarlyFxOpen), null);
  assert.equal(firstSundayEarlyIssuerOpenHour(PRESETS.fridayLateFxClose), null);
  assert.ok(earlyOpen > 33);
  assert.ok(earlyOpen < 49);
});

test("older scenario JSON without sundayEarlyIssuerOpen keeps Sunday morning issuer closed", () => {
  assert.equal(sanitizeScenario({}).scenario.sundayEarlyIssuerOpen, false);
  assert.equal(sanitizeScenario({ sundayEarlyIssuerOpen: "true" }).scenario.sundayEarlyIssuerOpen, false);
  assert.ok(sanitizeScenario({ sundayEarlyIssuerOpen: "true" }).errors.some((error) => error.includes("sundayEarlyIssuerOpen")));
});

test("Sunday early issuer open is available as a preset button and is not a bank feed", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  assert.match(html, /data-preset="sundayEarlyIssuerOpen"/);
  assert.match(html, /Sunday early issuer open \(synthetic\)/);
  assert.match(html, /id="sundayEarlyIssuerOpen"/);
  assert.match(html, /Keep Sunday issuer open 08:00 to 10:00/);
  assert.match(html, /not a bank feed/i);
  assert.doesNotMatch(html, /live queue/i);
});
