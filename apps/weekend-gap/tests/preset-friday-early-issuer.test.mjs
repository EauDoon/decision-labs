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

function firstFridayEarlyIssuerOpenHour(scenario) {
  for (let hour = 0; hour < 200; hour += 1) {
    const { dayIndex, localHour } = dayAndHourAt(hour);
    if (dayIndex === 5 && localHour >= 8 && localHour < 10 && getOperationalStatus(scenario, hour).issuerOpen) {
      const ordinary = getOperationalStatus({
        ...scenario,
        fridayEarlyIssuerOpen: false
      }, hour).issuerOpen;
      if (!ordinary) return hour;
    }
  }
  return null;
}

test("Friday early issuer open keeps the Normal Friday calendar with a Friday morning issuer window", () => {
  const preset = PRESETS.fridayEarlyIssuerOpen;
  assert.match(preset.name, /synthetic/i);
  assert.match(preset.name, /Friday early issuer open/i);
  assert.equal(preset.fridayEarlyIssuerOpen, true);
  assert.equal(DEFAULT_SCENARIO.fridayEarlyIssuerOpen, false);
  assert.equal(preset.saturdayEarlyIssuerOpen, false);
  assert.equal(preset.sundayEarlyIssuerOpen, false);
  assert.equal(preset.sundayLateIssuerClose, false);
  assert.equal(preset.fridayEarlyPayoutOpen, false);
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
  assert.notDeepEqual(preset, PRESETS.saturdayEarlyIssuerOpen);
  assert.notDeepEqual(preset, PRESETS.sundayEarlyIssuerOpen);
  assert.notDeepEqual(preset, PRESETS.sundayLateIssuerClose);
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
  assert.notDeepEqual(preset, PRESETS.earlyMondayBankOpen);
  assert.notDeepEqual(preset, PRESETS.fridayLateFxClose);
  assert.notDeepEqual(preset, PRESETS.mondayLateIssuerOpen);
  assert.notDeepEqual(preset, PRESETS.saturdayEarlyFxOpen);
  assert.notDeepEqual(preset, PRESETS.sundayLateBankClose);
  assert.notDeepEqual(preset, PRESETS.sundayLatePayoutClose);
  assert.notDeepEqual(preset, PRESETS.saturdayLatePayoutOpen);
  assert.notDeepEqual(preset, PRESETS.sundayEarlyPayoutOpen);
  assert.notDeepEqual(preset, PRESETS.saturdayEarlyBankOpen);
  const early = runSimulation(preset);
  const normal = runSimulation(DEFAULT_SCENARIO);
  const saturday = runSimulation(PRESETS.saturdayEarlyIssuerOpen);
  const sundayEarly = runSimulation(PRESETS.sundayEarlyIssuerOpen);
  assert.equal(early.timeline[0].timeLabel, "Fri 15:00");
  assert.equal(early.timeline[0].issuerOpen, true);
  assert.equal(normal.timeline[0].issuerOpen, true);
  assert.equal(early.timeline[17].timeLabel, "Sat 08:00");
  assert.equal(early.timeline[17].issuerOpen, false);
  assert.equal(saturday.timeline[17].issuerOpen, true);
  assert.equal(early.timeline[41].timeLabel, "Sun 08:00");
  assert.equal(early.timeline[41].issuerOpen, false);
  assert.equal(sundayEarly.timeline[41].issuerOpen, true);
  const delayed = { ...DEFAULT_SCENARIO, issuerOpenStartHour: 12 };
  const delayedEarly = { ...delayed, fridayEarlyIssuerOpen: true };
  assert.equal(formatTime(161), "Fri 08:00");
  assert.equal(dayAndHourAt(161).dayIndex, 5);
  assert.equal(dayAndHourAt(161).localHour, 8);
  assert.equal(getOperationalStatus(delayed, 161).issuerOpen, false);
  assert.equal(getOperationalStatus(delayedEarly, 161).issuerOpen, true);
  assert.equal(getOperationalStatus(delayedEarly, 162).issuerOpen, true);
  assert.equal(getOperationalStatus(delayedEarly, 163).issuerOpen, false);
  assert.equal(getOperationalStatus(delayedEarly, 161).bankOpen, true);
  assert.equal(getOperationalStatus(delayedEarly, 161).payoutOpen, true);
  assert.equal(getOperationalStatus(PRESETS.saturdayEarlyIssuerOpen, 161).issuerOpen, getOperationalStatus(DEFAULT_SCENARIO, 161).issuerOpen);
  const earlyOpen = firstFridayEarlyIssuerOpenHour(delayedEarly);
  assert.equal(earlyOpen, 161);
  assert.equal(firstFridayEarlyIssuerOpenHour(delayed), null);
  assert.equal(firstFridayEarlyIssuerOpenHour(PRESETS.saturdayEarlyIssuerOpen), null);
  assert.equal(firstFridayEarlyIssuerOpenHour(PRESETS.sundayEarlyIssuerOpen), null);
  assert.equal(firstFridayEarlyIssuerOpenHour(PRESETS.fridayEarlyPayoutOpen), null);
});

test("older scenario JSON without fridayEarlyIssuerOpen keeps Friday morning on the ordinary issuer window", () => {
  assert.equal(sanitizeScenario({}).scenario.fridayEarlyIssuerOpen, false);
  assert.equal(sanitizeScenario({ fridayEarlyIssuerOpen: "true" }).scenario.fridayEarlyIssuerOpen, false);
  assert.ok(sanitizeScenario({ fridayEarlyIssuerOpen: "true" }).errors.some((error) => error.includes("fridayEarlyIssuerOpen")));
});

test("Friday early issuer open is available as a preset button and is not a bank feed", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  assert.match(html, /data-preset="fridayEarlyIssuerOpen"/);
  assert.match(html, /Friday early issuer open \(synthetic\)/);
  assert.match(html, /id="fridayEarlyIssuerOpen"/);
  assert.match(html, /Keep Friday issuer open 08:00 to 10:00/);
  assert.match(html, /not a bank feed/i);
  assert.doesNotMatch(html, /live queue/i);
});
