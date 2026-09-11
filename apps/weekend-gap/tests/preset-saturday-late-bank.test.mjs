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

function firstSaturdayLateBankOpenHour(scenario) {
  for (let hour = 0; hour < 72; hour += 1) {
    const { dayIndex, localHour } = dayAndHourAt(hour);
    if (dayIndex === 6 && localHour >= 16 && localHour < 18 && getOperationalStatus(scenario, hour).bankOpen) {
      return hour;
    }
  }
  return null;
}

test("Saturday late bank open keeps the Normal Friday calendar with a Saturday evening bank window", () => {
  const preset = PRESETS.saturdayLateBankOpen;
  assert.match(preset.name, /synthetic/i);
  assert.match(preset.name, /Saturday late bank open/i);
  assert.equal(preset.saturdayLateBankOpen, true);
  assert.equal(DEFAULT_SCENARIO.saturdayLateBankOpen, false);
  assert.equal(preset.saturdayEarlyBankOpen, false);
  assert.equal(preset.fridayEarlyBankOpen, false);
  assert.equal(preset.fridayEarlyIssuerOpen, false);
  assert.equal(preset.saturdayEarlyIssuerOpen, false);
  assert.equal(preset.sundayLateBankClose, false);
  assert.equal(preset.saturdayLatePayoutOpen, false);
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
  assert.notDeepEqual(preset, PRESETS.fridayEarlyBankOpen);
  assert.notDeepEqual(preset, PRESETS.fridayLateBankOpen);
  assert.notDeepEqual(preset, PRESETS.fridayEarlyIssuerOpen);
  assert.notDeepEqual(preset, PRESETS.saturdayEarlyIssuerOpen);
  assert.notDeepEqual(preset, PRESETS.sundayLateBankClose);
  assert.notDeepEqual(preset, PRESETS.earlyMondayBankOpen);
  assert.notDeepEqual(preset, PRESETS.saturdayLatePayoutOpen);
  assert.notDeepEqual(preset, PRESETS.saturdayEarlyPayoutOpen);
  assert.notDeepEqual(preset, PRESETS.fridayEarlyPayoutOpen);
  const late = runSimulation(preset);
  const normal = runSimulation(DEFAULT_SCENARIO);
  const earlyBank = runSimulation(PRESETS.saturdayEarlyBankOpen);
  const fridayBank = runSimulation(PRESETS.fridayEarlyBankOpen);
  const latePayout = runSimulation(PRESETS.saturdayLatePayoutOpen);
  const lateSundayBank = runSimulation(PRESETS.sundayLateBankClose);
  assert.equal(late.timeline[17].timeLabel, "Sat 08:00");
  assert.equal(late.timeline[17].bankOpen, false);
  assert.equal(earlyBank.timeline[17].bankOpen, true);
  assert.equal(late.timeline[24].timeLabel, "Sat 15:00");
  assert.equal(late.timeline[24].bankOpen, false);
  assert.equal(late.timeline[25].timeLabel, "Sat 16:00");
  assert.equal(formatTime(25), "Sat 16:00");
  assert.equal(late.timeline[25].weekend, true);
  assert.equal(late.timeline[25].bankOpen, true);
  assert.equal(normal.timeline[25].bankOpen, false);
  assert.equal(earlyBank.timeline[25].bankOpen, false);
  assert.equal(fridayBank.timeline[25].bankOpen, false);
  assert.equal(latePayout.timeline[25].bankOpen, false);
  assert.equal(lateSundayBank.timeline[25].bankOpen, false);
  assert.equal(late.timeline[25].issuerOpen, false);
  assert.equal(late.timeline[25].payoutOpen, false);
  assert.equal(late.timeline[25].fxWeekday, false);
  assert.equal(late.timeline[26].timeLabel, "Sat 17:00");
  assert.equal(late.timeline[26].bankOpen, true);
  assert.equal(late.timeline[27].timeLabel, "Sat 18:00");
  assert.equal(late.timeline[27].bankOpen, false);
  assert.equal(latePayout.timeline[27].payoutOpen, true);
  assert.equal(late.timeline[49].timeLabel, "Sun 16:00");
  assert.equal(late.timeline[49].bankOpen, false);
  assert.equal(lateSundayBank.timeline[49].bankOpen, true);
  assert.equal(getOperationalStatus(preset, 25).bankOpen, true);
  assert.equal(getOperationalStatus(DEFAULT_SCENARIO, 25).bankOpen, false);
  assert.equal(getOperationalStatus(PRESETS.saturdayEarlyBankOpen, 25).bankOpen, false);
  assert.equal(getOperationalStatus(PRESETS.fridayEarlyBankOpen, 25).bankOpen, false);
  assert.equal(getOperationalStatus(PRESETS.fridayEarlyIssuerOpen, 25).bankOpen, false);
  assert.equal(getOperationalStatus(PRESETS.sundayLateBankClose, 25).bankOpen, false);
  assert.equal(getOperationalStatus(preset, 25).issuerOpen, false);
  assert.equal(getOperationalStatus(preset, 25).payoutOpen, false);
  const lateOpen = firstSaturdayLateBankOpenHour(preset);
  assert.equal(lateOpen, 25);
  assert.equal(firstSaturdayLateBankOpenHour(PRESETS.saturdayEarlyBankOpen), null);
  assert.equal(firstSaturdayLateBankOpenHour(PRESETS.fridayEarlyBankOpen), null);
  assert.equal(firstSaturdayLateBankOpenHour(PRESETS.fridayEarlyIssuerOpen), null);
  assert.equal(firstSaturdayLateBankOpenHour(PRESETS.sundayLateBankClose), null);
  assert.equal(firstSaturdayLateBankOpenHour(PRESETS.saturdayLatePayoutOpen), null);
  assert.ok(lateOpen > 17);
  assert.ok(lateOpen < 33);
});

test("older scenario JSON without saturdayLateBankOpen keeps Saturday evening bank closed", () => {
  assert.equal(sanitizeScenario({}).scenario.saturdayLateBankOpen, false);
  assert.equal(sanitizeScenario({ saturdayLateBankOpen: "true" }).scenario.saturdayLateBankOpen, false);
  assert.ok(sanitizeScenario({ saturdayLateBankOpen: "true" }).errors.some((error) => error.includes("saturdayLateBankOpen")));
});

test("Saturday late bank open is available as a preset button and is not a bank feed", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  assert.match(html, /data-preset="saturdayLateBankOpen"/);
  assert.match(html, /Saturday late bank open \(synthetic\)/);
  assert.match(html, /id="saturdayLateBankOpen"/);
  assert.match(html, /Keep Saturday bank open 16:00 to 18:00/);
  assert.match(html, /not a bank feed/i);
  assert.doesNotMatch(html, /live queue/i);
});
