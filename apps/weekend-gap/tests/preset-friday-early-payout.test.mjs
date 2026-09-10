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

function firstFridayEveningPayoutOpenHour(scenario) {
  for (let hour = 0; hour < 72; hour += 1) {
    const { dayIndex, localHour } = dayAndHourAt(hour);
    if (dayIndex === 5 && localHour >= 18 && localHour < 20 && getOperationalStatus(scenario, hour).payoutOpen) {
      return hour;
    }
  }
  return null;
}

test("Friday early payout open keeps the Normal Friday calendar with an earlier Friday evening payout window", () => {
  const preset = PRESETS.fridayEarlyPayoutOpen;
  assert.match(preset.name, /synthetic/i);
  assert.match(preset.name, /Friday early payout open/i);
  assert.equal(preset.fridayEarlyPayoutOpen, true);
  assert.equal(DEFAULT_SCENARIO.fridayEarlyPayoutOpen, false);
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
  assert.notDeepEqual(preset, PRESETS.saturdayLatePayoutOpen);
  const early = runSimulation(preset);
  const normal = runSimulation(DEFAULT_SCENARIO);
  const saturdayPayout = runSimulation(PRESETS.saturdayEarlyPayoutOpen);
  const sundayPayout = runSimulation(PRESETS.sundayLatePayoutClose);
  assert.equal(early.timeline[2].timeLabel, "Fri 17:00");
  assert.equal(early.timeline[2].payoutOpen, false);
  assert.equal(normal.timeline[2].payoutOpen, false);
  assert.equal(early.timeline[3].timeLabel, "Fri 18:00");
  assert.equal(formatTime(3), "Fri 18:00");
  assert.equal(early.timeline[3].weekend, false);
  assert.equal(early.timeline[3].payoutOpen, true);
  assert.equal(normal.timeline[3].payoutOpen, false);
  assert.equal(saturdayPayout.timeline[3].payoutOpen, false);
  assert.equal(sundayPayout.timeline[3].payoutOpen, false);
  assert.equal(early.timeline[3].fxWeekday, true);
  assert.equal(early.timeline[3].issuerOpen, false);
  assert.equal(early.timeline[3].bankOpen, false);
  assert.equal(early.timeline[4].timeLabel, "Fri 19:00");
  assert.equal(early.timeline[4].payoutOpen, true);
  assert.equal(early.timeline[5].timeLabel, "Fri 20:00");
  assert.equal(early.timeline[5].payoutOpen, false);
  assert.equal(early.timeline[16].timeLabel, "Sat 07:00");
  assert.equal(early.timeline[16].payoutOpen, false);
  assert.equal(saturdayPayout.timeline[16].payoutOpen, true);
  assert.equal(early.timeline[49].timeLabel, "Sun 16:00");
  assert.equal(early.timeline[49].payoutOpen, false);
  assert.equal(sundayPayout.timeline[49].payoutOpen, true);
  assert.equal(getOperationalStatus(preset, 3).payoutOpen, true);
  assert.equal(getOperationalStatus(DEFAULT_SCENARIO, 3).payoutOpen, false);
  assert.equal(getOperationalStatus(PRESETS.saturdayEarlyPayoutOpen, 3).payoutOpen, false);
  assert.equal(getOperationalStatus(PRESETS.sundayLatePayoutClose, 3).payoutOpen, false);
  const earlyOpen = firstFridayEveningPayoutOpenHour(preset);
  assert.equal(earlyOpen, 3);
  assert.equal(firstFridayEveningPayoutOpenHour(PRESETS.saturdayEarlyPayoutOpen), null);
  assert.equal(firstFridayEveningPayoutOpenHour(PRESETS.sundayLatePayoutClose), null);
  assert.equal(firstFridayEveningPayoutOpenHour(PRESETS.sundayLateBankClose), null);
  assert.equal(firstFridayEveningPayoutOpenHour(PRESETS.saturdayEarlyFxOpen), null);
  assert.equal(firstFridayEveningPayoutOpenHour(PRESETS.fridayLateFxClose), null);
  assert.equal(firstFridayEveningPayoutOpenHour(PRESETS.mondayLateIssuerOpen), null);
  assert.equal(firstFridayEveningPayoutOpenHour(PRESETS.earlyMondayBankOpen), null);
  assert.ok(earlyOpen < 16);
  assert.ok(earlyOpen < 49);
});

test("older scenario JSON without fridayEarlyPayoutOpen keeps Friday evening payout closed", () => {
  assert.equal(sanitizeScenario({}).scenario.fridayEarlyPayoutOpen, false);
  assert.equal(sanitizeScenario({ fridayEarlyPayoutOpen: "true" }).scenario.fridayEarlyPayoutOpen, false);
  assert.ok(sanitizeScenario({ fridayEarlyPayoutOpen: "true" }).errors.some((error) => error.includes("fridayEarlyPayoutOpen")));
});

test("Friday early payout open is available as a preset button and is not a bank feed", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  assert.match(html, /data-preset="fridayEarlyPayoutOpen"/);
  assert.match(html, /Friday early payout open \(synthetic\)/);
  assert.match(html, /id="fridayEarlyPayoutOpen"/);
  assert.match(html, /Open Friday payout Friday evening/);
  assert.match(html, /not a bank feed/i);
  assert.doesNotMatch(html, /live queue/i);
});
