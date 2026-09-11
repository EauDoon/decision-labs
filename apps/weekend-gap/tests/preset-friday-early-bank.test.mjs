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

function firstFridayEarlyBankOpenHour(scenario) {
  for (let hour = 0; hour < 200; hour += 1) {
    const { dayIndex, localHour } = dayAndHourAt(hour);
    if (dayIndex === 5 && localHour >= 8 && localHour < 10 && getOperationalStatus(scenario, hour).bankOpen) {
      const ordinary = getOperationalStatus({
        ...scenario,
        fridayEarlyBankOpen: false
      }, hour).bankOpen;
      if (!ordinary) return hour;
    }
  }
  return null;
}

test("Friday early bank open keeps the Normal Friday calendar with a Friday morning bank window", () => {
  const preset = PRESETS.fridayEarlyBankOpen;
  assert.match(preset.name, /synthetic/i);
  assert.match(preset.name, /Friday early bank open/i);
  assert.equal(preset.fridayEarlyBankOpen, true);
  assert.equal(DEFAULT_SCENARIO.fridayEarlyBankOpen, false);
  assert.equal(preset.saturdayEarlyBankOpen, false);
  assert.equal(preset.fridayEarlyIssuerOpen, false);
  assert.equal(preset.saturdayEarlyIssuerOpen, false);
  assert.equal(preset.sundayLateBankClose, false);
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
  assert.notDeepEqual(preset, PRESETS.saturdayEarlyBankOpen);
  assert.notDeepEqual(preset, PRESETS.saturdayLateBankOpen);
  assert.notDeepEqual(preset, PRESETS.fridayLateBankOpen);
  assert.notDeepEqual(preset, PRESETS.fridayEarlyIssuerOpen);
  assert.notDeepEqual(preset, PRESETS.saturdayEarlyIssuerOpen);
  assert.notDeepEqual(preset, PRESETS.sundayLateBankClose);
  assert.notDeepEqual(preset, PRESETS.earlyMondayBankOpen);
  assert.notDeepEqual(preset, PRESETS.fridayEarlyPayoutOpen);
  assert.notDeepEqual(preset, PRESETS.saturdayEarlyPayoutOpen);
  assert.notDeepEqual(preset, PRESETS.paydayFridayBurst);
  assert.notDeepEqual(preset, PRESETS.publicHolidayMonday);
  assert.notDeepEqual(preset, PRESETS.saturdayMarketBurst);
  assert.notDeepEqual(preset, PRESETS.sundayStallClose);
  assert.notDeepEqual(preset, PRESETS.thinSaturdayFx);
  assert.notDeepEqual(preset, PRESETS.thinFxTightWindows);
  assert.notDeepEqual(preset, PRESETS.longWeekendFridayStart);
  assert.notDeepEqual(preset, PRESETS.compressedFridayClose);
  assert.notDeepEqual(preset, PRESETS.fridayLateFxClose);
  assert.notDeepEqual(preset, PRESETS.mondayLateIssuerOpen);
  assert.notDeepEqual(preset, PRESETS.saturdayEarlyFxOpen);
  assert.notDeepEqual(preset, PRESETS.sundayLatePayoutClose);
  assert.notDeepEqual(preset, PRESETS.saturdayLatePayoutOpen);
  assert.notDeepEqual(preset, PRESETS.sundayEarlyPayoutOpen);
  const early = runSimulation(preset);
  const normal = runSimulation(DEFAULT_SCENARIO);
  const saturdayBank = runSimulation(PRESETS.saturdayEarlyBankOpen);
  const fridayIssuer = runSimulation(PRESETS.fridayEarlyIssuerOpen);
  const lateBank = runSimulation(PRESETS.sundayLateBankClose);
  const mondayBank = runSimulation(PRESETS.earlyMondayBankOpen);
  assert.equal(early.timeline[0].timeLabel, "Fri 15:00");
  assert.equal(early.timeline[0].bankOpen, true);
  assert.equal(normal.timeline[0].bankOpen, true);
  assert.equal(early.timeline[17].timeLabel, "Sat 08:00");
  assert.equal(early.timeline[17].bankOpen, false);
  assert.equal(saturdayBank.timeline[17].bankOpen, true);
  assert.equal(fridayIssuer.timeline[17].bankOpen, false);
  assert.equal(lateBank.timeline[17].bankOpen, false);
  assert.equal(mondayBank.timeline[17].bankOpen, false);
  const delayed = { ...DEFAULT_SCENARIO, bankOpenStartHour: 12 };
  const delayedEarly = { ...delayed, fridayEarlyBankOpen: true };
  assert.equal(formatTime(161), "Fri 08:00");
  assert.equal(dayAndHourAt(161).dayIndex, 5);
  assert.equal(dayAndHourAt(161).localHour, 8);
  assert.equal(getOperationalStatus(delayed, 161).bankOpen, false);
  assert.equal(getOperationalStatus(delayedEarly, 161).bankOpen, true);
  assert.equal(getOperationalStatus(delayedEarly, 162).bankOpen, true);
  assert.equal(getOperationalStatus(delayedEarly, 163).bankOpen, false);
  assert.equal(getOperationalStatus(delayedEarly, 161).issuerOpen, true);
  assert.equal(getOperationalStatus(delayedEarly, 161).payoutOpen, true);
  assert.equal(getOperationalStatus(delayedEarly, 0).bankOpen, true);
  assert.equal(getOperationalStatus(delayed, 0).bankOpen, true);
  assert.equal(getOperationalStatus(PRESETS.saturdayEarlyBankOpen, 161).bankOpen, getOperationalStatus(DEFAULT_SCENARIO, 161).bankOpen);
  assert.equal(getOperationalStatus(PRESETS.fridayEarlyIssuerOpen, 161).bankOpen, getOperationalStatus(DEFAULT_SCENARIO, 161).bankOpen);
  assert.equal(getOperationalStatus(PRESETS.saturdayEarlyIssuerOpen, 161).bankOpen, getOperationalStatus(DEFAULT_SCENARIO, 161).bankOpen);
  assert.equal(getOperationalStatus(PRESETS.sundayLateBankClose, 161).bankOpen, getOperationalStatus(DEFAULT_SCENARIO, 161).bankOpen);
  assert.equal(getOperationalStatus(PRESETS.earlyMondayBankOpen, 161).bankOpen, getOperationalStatus(DEFAULT_SCENARIO, 161).bankOpen);
  const earlyOpen = firstFridayEarlyBankOpenHour(delayedEarly);
  assert.equal(earlyOpen, 161);
  assert.equal(firstFridayEarlyBankOpenHour(delayed), null);
  assert.equal(firstFridayEarlyBankOpenHour(PRESETS.saturdayEarlyBankOpen), null);
  assert.equal(firstFridayEarlyBankOpenHour(PRESETS.fridayEarlyIssuerOpen), null);
  assert.equal(firstFridayEarlyBankOpenHour(PRESETS.saturdayEarlyIssuerOpen), null);
  assert.equal(firstFridayEarlyBankOpenHour(PRESETS.sundayLateBankClose), null);
  assert.equal(firstFridayEarlyBankOpenHour(PRESETS.earlyMondayBankOpen), null);
});

test("older scenario JSON without fridayEarlyBankOpen keeps Friday morning on the ordinary bank window", () => {
  assert.equal(sanitizeScenario({}).scenario.fridayEarlyBankOpen, false);
  assert.equal(sanitizeScenario({ fridayEarlyBankOpen: "true" }).scenario.fridayEarlyBankOpen, false);
  assert.ok(sanitizeScenario({ fridayEarlyBankOpen: "true" }).errors.some((error) => error.includes("fridayEarlyBankOpen")));
});

test("Friday early bank open is available as a preset button and is not a bank feed", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  assert.match(html, /data-preset="fridayEarlyBankOpen"/);
  assert.match(html, /Friday early bank open \(synthetic\)/);
  assert.match(html, /id="fridayEarlyBankOpen"/);
  assert.match(html, /Keep Friday bank open 08:00 to 10:00/);
  assert.match(html, /not a bank feed/i);
  assert.doesNotMatch(html, /live queue/i);
});
