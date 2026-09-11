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

function firstFridayLateBankOpenHour(scenario) {
  for (let hour = 0; hour < 72; hour += 1) {
    const { dayIndex, localHour } = dayAndHourAt(hour);
    if (dayIndex === 5 && localHour >= 16 && localHour < 18 && getOperationalStatus(scenario, hour).bankOpen) {
      const ordinary = getOperationalStatus({
        ...scenario,
        fridayLateBankOpen: false
      }, hour).bankOpen;
      if (!ordinary) return hour;
    }
  }
  return null;
}

test("Friday late bank open keeps the Normal Friday calendar with a Friday evening bank window", () => {
  const preset = PRESETS.fridayLateBankOpen;
  assert.match(preset.name, /synthetic/i);
  assert.match(preset.name, /Friday late bank open/i);
  assert.equal(preset.fridayLateBankOpen, true);
  assert.equal(DEFAULT_SCENARIO.fridayLateBankOpen, false);
  assert.equal(preset.fridayEarlyBankOpen, false);
  assert.equal(preset.saturdayLateBankOpen, false);
  assert.equal(preset.saturdayEarlyBankOpen, false);
  assert.equal(preset.fridayEarlyIssuerOpen, false);
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
  assert.notDeepEqual(preset, PRESETS.fridayEarlyBankOpen);
  assert.notDeepEqual(preset, PRESETS.saturdayLateBankOpen);
  assert.notDeepEqual(preset, PRESETS.saturdayEarlyBankOpen);
  assert.notDeepEqual(preset, PRESETS.fridayEarlyIssuerOpen);
  assert.notDeepEqual(preset, PRESETS.sundayLateBankClose);
  assert.notDeepEqual(preset, PRESETS.earlyMondayBankOpen);
  assert.notDeepEqual(preset, PRESETS.saturdayLatePayoutOpen);
  assert.notDeepEqual(preset, PRESETS.fridayEarlyPayoutOpen);
  const late = runSimulation(preset);
  const normal = runSimulation(DEFAULT_SCENARIO);
  const fridayEarly = runSimulation(PRESETS.fridayEarlyBankOpen);
  const saturdayLate = runSimulation(PRESETS.saturdayLateBankOpen);
  const saturdayEarly = runSimulation(PRESETS.saturdayEarlyBankOpen);
  const fridayIssuer = runSimulation(PRESETS.fridayEarlyIssuerOpen);
  assert.equal(late.timeline[1].timeLabel, "Fri 16:00");
  assert.equal(late.timeline[1].bankOpen, true);
  assert.equal(normal.timeline[1].bankOpen, true);
  assert.equal(late.timeline[2].timeLabel, "Fri 17:00");
  assert.equal(formatTime(2), "Fri 17:00");
  assert.equal(late.timeline[2].bankOpen, true);
  assert.equal(normal.timeline[2].bankOpen, false);
  assert.equal(fridayEarly.timeline[2].bankOpen, false);
  assert.equal(saturdayLate.timeline[2].bankOpen, false);
  assert.equal(saturdayEarly.timeline[2].bankOpen, false);
  assert.equal(fridayIssuer.timeline[2].bankOpen, false);
  assert.equal(late.timeline[2].issuerOpen, false);
  assert.equal(late.timeline[2].payoutOpen, false);
  assert.equal(late.timeline[3].timeLabel, "Fri 18:00");
  assert.equal(late.timeline[3].bankOpen, false);
  assert.equal(late.timeline[25].timeLabel, "Sat 16:00");
  assert.equal(late.timeline[25].bankOpen, false);
  assert.equal(saturdayLate.timeline[25].bankOpen, true);
  assert.equal(late.timeline[17].timeLabel, "Sat 08:00");
  assert.equal(late.timeline[17].bankOpen, false);
  assert.equal(saturdayEarly.timeline[17].bankOpen, true);
  const earlyClose = { ...DEFAULT_SCENARIO, bankOpenEndHour: 16 };
  const delayedLate = { ...earlyClose, fridayLateBankOpen: true };
  assert.equal(formatTime(1), "Fri 16:00");
  assert.equal(dayAndHourAt(1).dayIndex, 5);
  assert.equal(dayAndHourAt(1).localHour, 16);
  assert.equal(getOperationalStatus(earlyClose, 1).bankOpen, false);
  assert.equal(getOperationalStatus(delayedLate, 1).bankOpen, true);
  assert.equal(getOperationalStatus(delayedLate, 2).bankOpen, true);
  assert.equal(getOperationalStatus(delayedLate, 3).bankOpen, false);
  assert.equal(getOperationalStatus(delayedLate, 1).issuerOpen, true);
  assert.equal(getOperationalStatus(delayedLate, 1).payoutOpen, true);
  assert.equal(getOperationalStatus(PRESETS.fridayEarlyBankOpen, 2).bankOpen, getOperationalStatus(DEFAULT_SCENARIO, 2).bankOpen);
  assert.equal(getOperationalStatus(PRESETS.saturdayLateBankOpen, 2).bankOpen, getOperationalStatus(DEFAULT_SCENARIO, 2).bankOpen);
  assert.equal(getOperationalStatus(PRESETS.saturdayEarlyBankOpen, 2).bankOpen, getOperationalStatus(DEFAULT_SCENARIO, 2).bankOpen);
  assert.equal(getOperationalStatus(PRESETS.fridayEarlyIssuerOpen, 2).bankOpen, getOperationalStatus(DEFAULT_SCENARIO, 2).bankOpen);
  const lateOpen = firstFridayLateBankOpenHour(preset);
  assert.equal(lateOpen, 2);
  assert.equal(firstFridayLateBankOpenHour(DEFAULT_SCENARIO), null);
  assert.equal(firstFridayLateBankOpenHour(PRESETS.fridayEarlyBankOpen), null);
  assert.equal(firstFridayLateBankOpenHour(PRESETS.saturdayLateBankOpen), null);
  assert.equal(firstFridayLateBankOpenHour(PRESETS.saturdayEarlyBankOpen), null);
  assert.equal(firstFridayLateBankOpenHour(PRESETS.fridayEarlyIssuerOpen), null);
  assert.equal(firstFridayLateBankOpenHour(delayedLate), 1);
});

test("older scenario JSON without fridayLateBankOpen keeps Friday evening on the ordinary bank window", () => {
  assert.equal(sanitizeScenario({}).scenario.fridayLateBankOpen, false);
  assert.equal(sanitizeScenario({ fridayLateBankOpen: "true" }).scenario.fridayLateBankOpen, false);
  assert.ok(sanitizeScenario({ fridayLateBankOpen: "true" }).errors.some((error) => error.includes("fridayLateBankOpen")));
});

test("Friday late bank open is available as a preset button and is not a bank feed", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  assert.match(html, /data-preset="fridayLateBankOpen"/);
  assert.match(html, /Friday late bank open \(synthetic\)/);
  assert.match(html, /id="fridayLateBankOpen"/);
  assert.match(html, /Keep Friday bank open 16:00 to 18:00/);
  assert.match(html, /not a bank feed/i);
  assert.doesNotMatch(html, /live queue/i);
});
