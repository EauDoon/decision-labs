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

function firstSaturdayEarlyIssuerOpenHour(scenario) {
  for (let hour = 0; hour < 72; hour += 1) {
    const { dayIndex, localHour } = dayAndHourAt(hour);
    if (dayIndex === 6 && localHour >= 8 && localHour < 10 && getOperationalStatus(scenario, hour).issuerOpen) {
      return hour;
    }
  }
  return null;
}

test("Saturday early issuer open keeps the Normal Friday calendar with a Saturday morning issuer window", () => {
  const preset = PRESETS.saturdayEarlyIssuerOpen;
  assert.match(preset.name, /synthetic/i);
  assert.match(preset.name, /Saturday early issuer open/i);
  assert.equal(preset.saturdayEarlyIssuerOpen, true);
  assert.equal(DEFAULT_SCENARIO.saturdayEarlyIssuerOpen, false);
  assert.equal(preset.sundayEarlyIssuerOpen, false);
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
  assert.notDeepEqual(preset, PRESETS.sundayEarlyIssuerOpen);
  assert.notDeepEqual(preset, PRESETS.fridayEarlyIssuerOpen);
  assert.notDeepEqual(preset, PRESETS.saturdayEarlyBankOpen);
  const early = runSimulation(preset);
  const normal = runSimulation(DEFAULT_SCENARIO);
  const sundayEarly = runSimulation(PRESETS.sundayEarlyIssuerOpen);
  const lateIssuer = runSimulation(PRESETS.sundayLateIssuerClose);
  const payout = runSimulation(PRESETS.saturdayEarlyPayoutOpen);
  assert.equal(early.timeline[16].timeLabel, "Sat 07:00");
  assert.equal(early.timeline[16].issuerOpen, false);
  assert.equal(normal.timeline[16].issuerOpen, false);
  assert.equal(early.timeline[17].timeLabel, "Sat 08:00");
  assert.equal(formatTime(17), "Sat 08:00");
  assert.equal(early.timeline[17].weekend, true);
  assert.equal(early.timeline[17].issuerOpen, true);
  assert.equal(normal.timeline[17].issuerOpen, false);
  assert.equal(sundayEarly.timeline[17].issuerOpen, false);
  assert.equal(lateIssuer.timeline[17].issuerOpen, false);
  assert.equal(payout.timeline[17].issuerOpen, false);
  assert.equal(payout.timeline[16].payoutOpen, true);
  assert.equal(early.timeline[17].payoutOpen, false);
  assert.equal(early.timeline[17].bankOpen, false);
  assert.equal(early.timeline[17].fxWeekday, false);
  assert.equal(early.timeline[18].timeLabel, "Sat 09:00");
  assert.equal(early.timeline[18].issuerOpen, true);
  assert.equal(early.timeline[19].timeLabel, "Sat 10:00");
  assert.equal(early.timeline[19].issuerOpen, false);
  assert.equal(early.timeline[41].timeLabel, "Sun 08:00");
  assert.equal(early.timeline[41].issuerOpen, false);
  assert.equal(sundayEarly.timeline[41].issuerOpen, true);
  assert.equal(early.timeline[49].timeLabel, "Sun 16:00");
  assert.equal(early.timeline[49].issuerOpen, false);
  assert.equal(lateIssuer.timeline[49].issuerOpen, true);
  assert.equal(getOperationalStatus(preset, 17).issuerOpen, true);
  assert.equal(getOperationalStatus(DEFAULT_SCENARIO, 17).issuerOpen, false);
  assert.equal(getOperationalStatus(PRESETS.sundayEarlyIssuerOpen, 17).issuerOpen, false);
  assert.equal(getOperationalStatus(PRESETS.sundayLateIssuerClose, 17).issuerOpen, false);
  assert.equal(getOperationalStatus(preset, 17).bankOpen, false);
  assert.equal(getOperationalStatus(preset, 17).payoutOpen, false);
  const earlyOpen = firstSaturdayEarlyIssuerOpenHour(preset);
  assert.equal(earlyOpen, 17);
  assert.equal(firstSaturdayEarlyIssuerOpenHour(PRESETS.sundayEarlyIssuerOpen), null);
  assert.equal(firstSaturdayEarlyIssuerOpenHour(PRESETS.sundayLateIssuerClose), null);
  assert.equal(firstSaturdayEarlyIssuerOpenHour(PRESETS.sundayLateBankClose), null);
  assert.equal(firstSaturdayEarlyIssuerOpenHour(PRESETS.sundayLatePayoutClose), null);
  assert.equal(firstSaturdayEarlyIssuerOpenHour(PRESETS.sundayEarlyPayoutOpen), null);
  assert.equal(firstSaturdayEarlyIssuerOpenHour(PRESETS.saturdayEarlyPayoutOpen), null);
  assert.equal(firstSaturdayEarlyIssuerOpenHour(PRESETS.sundayStallClose), null);
  assert.equal(firstSaturdayEarlyIssuerOpenHour(PRESETS.saturdayEarlyFxOpen), null);
  assert.ok(earlyOpen > 9);
  assert.ok(earlyOpen < 33);
});

test("older scenario JSON without saturdayEarlyIssuerOpen keeps Saturday morning issuer closed", () => {
  assert.equal(sanitizeScenario({}).scenario.saturdayEarlyIssuerOpen, false);
  assert.equal(sanitizeScenario({ saturdayEarlyIssuerOpen: "true" }).scenario.saturdayEarlyIssuerOpen, false);
  assert.ok(sanitizeScenario({ saturdayEarlyIssuerOpen: "true" }).errors.some((error) => error.includes("saturdayEarlyIssuerOpen")));
});

test("Saturday early issuer open is available as a preset button and is not a bank feed", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  assert.match(html, /data-preset="saturdayEarlyIssuerOpen"/);
  assert.match(html, /Saturday early issuer open \(synthetic\)/);
  assert.match(html, /id="saturdayEarlyIssuerOpen"/);
  assert.match(html, /Keep Saturday issuer open 08:00 to 10:00/);
  assert.match(html, /not a bank feed/i);
  assert.doesNotMatch(html, /live queue/i);
});
