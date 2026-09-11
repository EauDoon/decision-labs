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

function firstSaturdayEarlyBankOpenHour(scenario) {
  for (let hour = 0; hour < 72; hour += 1) {
    const { dayIndex, localHour } = dayAndHourAt(hour);
    if (dayIndex === 6 && localHour >= 8 && localHour < 10 && getOperationalStatus(scenario, hour).bankOpen) {
      return hour;
    }
  }
  return null;
}

test("Saturday early bank open keeps the Normal Friday calendar with a Saturday morning bank window", () => {
  const preset = PRESETS.saturdayEarlyBankOpen;
  assert.match(preset.name, /synthetic/i);
  assert.match(preset.name, /Saturday early bank open/i);
  assert.equal(preset.saturdayEarlyBankOpen, true);
  assert.equal(DEFAULT_SCENARIO.saturdayEarlyBankOpen, false);
  assert.equal(preset.fridayEarlyIssuerOpen, false);
  assert.equal(preset.saturdayEarlyIssuerOpen, false);
  assert.equal(preset.sundayLateBankClose, false);
  assert.equal(preset.sundayLatePayoutClose, false);
  assert.equal(preset.sundayEarlyIssuerOpen, false);
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
  assert.notDeepEqual(preset, PRESETS.saturdayEarlyIssuerOpen);
  assert.notDeepEqual(preset, PRESETS.fridayEarlyIssuerOpen);
  assert.notDeepEqual(preset, PRESETS.fridayEarlyBankOpen);
  const early = runSimulation(preset);
  const normal = runSimulation(DEFAULT_SCENARIO);
  const issuer = runSimulation(PRESETS.saturdayEarlyIssuerOpen);
  const fridayIssuer = runSimulation(PRESETS.fridayEarlyIssuerOpen);
  const lateBank = runSimulation(PRESETS.sundayLateBankClose);
  const mondayBank = runSimulation(PRESETS.earlyMondayBankOpen);
  assert.equal(early.timeline[16].timeLabel, "Sat 07:00");
  assert.equal(early.timeline[16].bankOpen, false);
  assert.equal(normal.timeline[16].bankOpen, false);
  assert.equal(early.timeline[17].timeLabel, "Sat 08:00");
  assert.equal(formatTime(17), "Sat 08:00");
  assert.equal(early.timeline[17].weekend, true);
  assert.equal(early.timeline[17].bankOpen, true);
  assert.equal(normal.timeline[17].bankOpen, false);
  assert.equal(issuer.timeline[17].bankOpen, false);
  assert.equal(issuer.timeline[17].issuerOpen, true);
  assert.equal(fridayIssuer.timeline[17].bankOpen, false);
  assert.equal(lateBank.timeline[17].bankOpen, false);
  assert.equal(mondayBank.timeline[17].bankOpen, false);
  assert.equal(early.timeline[17].issuerOpen, false);
  assert.equal(early.timeline[17].payoutOpen, false);
  assert.equal(early.timeline[17].fxWeekday, false);
  assert.equal(early.timeline[18].timeLabel, "Sat 09:00");
  assert.equal(early.timeline[18].bankOpen, true);
  assert.equal(early.timeline[19].timeLabel, "Sat 10:00");
  assert.equal(early.timeline[19].bankOpen, false);
  assert.equal(early.timeline[41].timeLabel, "Sun 08:00");
  assert.equal(early.timeline[41].bankOpen, false);
  assert.equal(early.timeline[49].timeLabel, "Sun 16:00");
  assert.equal(early.timeline[49].bankOpen, false);
  assert.equal(lateBank.timeline[49].bankOpen, true);
  assert.equal(getOperationalStatus(preset, 17).bankOpen, true);
  assert.equal(getOperationalStatus(DEFAULT_SCENARIO, 17).bankOpen, false);
  assert.equal(getOperationalStatus(PRESETS.saturdayEarlyIssuerOpen, 17).bankOpen, false);
  assert.equal(getOperationalStatus(PRESETS.fridayEarlyIssuerOpen, 17).bankOpen, false);
  assert.equal(getOperationalStatus(PRESETS.sundayLateBankClose, 17).bankOpen, false);
  assert.equal(getOperationalStatus(PRESETS.earlyMondayBankOpen, 17).bankOpen, false);
  assert.equal(getOperationalStatus(preset, 17).issuerOpen, false);
  assert.equal(getOperationalStatus(preset, 17).payoutOpen, false);
  const earlyOpen = firstSaturdayEarlyBankOpenHour(preset);
  assert.equal(earlyOpen, 17);
  assert.equal(firstSaturdayEarlyBankOpenHour(PRESETS.saturdayEarlyIssuerOpen), null);
  assert.equal(firstSaturdayEarlyBankOpenHour(PRESETS.fridayEarlyIssuerOpen), null);
  assert.equal(firstSaturdayEarlyBankOpenHour(PRESETS.sundayLateBankClose), null);
  assert.equal(firstSaturdayEarlyBankOpenHour(PRESETS.earlyMondayBankOpen), null);
  assert.equal(firstSaturdayEarlyBankOpenHour(PRESETS.sundayLatePayoutClose), null);
  assert.equal(firstSaturdayEarlyBankOpenHour(PRESETS.saturdayEarlyPayoutOpen), null);
  assert.ok(earlyOpen > 9);
  assert.ok(earlyOpen < 33);
});

test("older scenario JSON without saturdayEarlyBankOpen keeps Saturday morning bank closed", () => {
  assert.equal(sanitizeScenario({}).scenario.saturdayEarlyBankOpen, false);
  assert.equal(sanitizeScenario({ saturdayEarlyBankOpen: "true" }).scenario.saturdayEarlyBankOpen, false);
  assert.ok(sanitizeScenario({ saturdayEarlyBankOpen: "true" }).errors.some((error) => error.includes("saturdayEarlyBankOpen")));
});

test("Saturday early bank open is available as a preset button and is not a bank feed", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  assert.match(html, /data-preset="saturdayEarlyBankOpen"/);
  assert.match(html, /Saturday early bank open \(synthetic\)/);
  assert.match(html, /id="saturdayEarlyBankOpen"/);
  assert.match(html, /Keep Saturday bank open 08:00 to 10:00/);
  assert.match(html, /not a bank feed/i);
  assert.doesNotMatch(html, /live queue/i);
});
