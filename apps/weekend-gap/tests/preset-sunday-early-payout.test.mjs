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

function firstSundayMorningPayoutOpenHour(scenario) {
  for (let hour = 0; hour < 72; hour += 1) {
    const { dayIndex, localHour } = dayAndHourAt(hour);
    if (dayIndex === 0 && localHour >= 8 && localHour < 10 && getOperationalStatus(scenario, hour).payoutOpen) {
      return hour;
    }
  }
  return null;
}

test("Sunday early payout open keeps the Normal Friday calendar with a Sunday morning payout window", () => {
  const preset = PRESETS.sundayEarlyPayoutOpen;
  assert.match(preset.name, /synthetic/i);
  assert.match(preset.name, /Sunday early payout open/i);
  assert.equal(preset.sundayEarlyPayoutOpen, true);
  assert.equal(DEFAULT_SCENARIO.sundayEarlyPayoutOpen, false);
  assert.equal(preset.saturdayLatePayoutOpen, false);
  assert.equal(preset.fridayEarlyPayoutOpen, false);
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
  assert.notDeepEqual(preset, PRESETS.fridayEarlyPayoutOpen);
  assert.notDeepEqual(preset, PRESETS.saturdayLatePayoutOpen);
  const early = runSimulation(preset);
  const normal = runSimulation(DEFAULT_SCENARIO);
  const fridayPayout = runSimulation(PRESETS.fridayEarlyPayoutOpen);
  const saturdayEarly = runSimulation(PRESETS.saturdayEarlyPayoutOpen);
  const saturdayLate = runSimulation(PRESETS.saturdayLatePayoutOpen);
  const sundayPayout = runSimulation(PRESETS.sundayLatePayoutClose);
  assert.equal(early.timeline[3].timeLabel, "Fri 18:00");
  assert.equal(early.timeline[3].payoutOpen, false);
  assert.equal(fridayPayout.timeline[3].payoutOpen, true);
  assert.equal(early.timeline[16].timeLabel, "Sat 07:00");
  assert.equal(early.timeline[16].payoutOpen, false);
  assert.equal(saturdayEarly.timeline[16].payoutOpen, true);
  assert.equal(early.timeline[27].timeLabel, "Sat 18:00");
  assert.equal(early.timeline[27].payoutOpen, false);
  assert.equal(saturdayLate.timeline[27].payoutOpen, true);
  assert.equal(early.timeline[40].timeLabel, "Sun 07:00");
  assert.equal(early.timeline[40].payoutOpen, false);
  assert.equal(normal.timeline[40].payoutOpen, false);
  assert.equal(early.timeline[41].timeLabel, "Sun 08:00");
  assert.equal(formatTime(41), "Sun 08:00");
  assert.equal(early.timeline[41].weekend, true);
  assert.equal(early.timeline[41].payoutOpen, true);
  assert.equal(normal.timeline[41].payoutOpen, false);
  assert.equal(fridayPayout.timeline[41].payoutOpen, false);
  assert.equal(saturdayEarly.timeline[41].payoutOpen, false);
  assert.equal(saturdayLate.timeline[41].payoutOpen, false);
  assert.equal(sundayPayout.timeline[41].payoutOpen, false);
  assert.equal(early.timeline[41].fxWeekday, false);
  assert.equal(early.timeline[41].issuerOpen, false);
  assert.equal(early.timeline[41].bankOpen, false);
  assert.equal(early.timeline[42].timeLabel, "Sun 09:00");
  assert.equal(early.timeline[42].payoutOpen, true);
  assert.equal(early.timeline[43].timeLabel, "Sun 10:00");
  assert.equal(early.timeline[43].payoutOpen, false);
  assert.equal(early.timeline[49].timeLabel, "Sun 16:00");
  assert.equal(early.timeline[49].payoutOpen, false);
  assert.equal(sundayPayout.timeline[49].payoutOpen, true);
  assert.equal(getOperationalStatus(preset, 41).payoutOpen, true);
  assert.equal(getOperationalStatus(DEFAULT_SCENARIO, 41).payoutOpen, false);
  assert.equal(getOperationalStatus(PRESETS.fridayEarlyPayoutOpen, 41).payoutOpen, false);
  assert.equal(getOperationalStatus(PRESETS.saturdayEarlyPayoutOpen, 41).payoutOpen, false);
  assert.equal(getOperationalStatus(PRESETS.saturdayLatePayoutOpen, 41).payoutOpen, false);
  assert.equal(getOperationalStatus(PRESETS.sundayLatePayoutClose, 41).payoutOpen, false);
  const earlyOpen = firstSundayMorningPayoutOpenHour(preset);
  assert.equal(earlyOpen, 41);
  assert.equal(firstSundayMorningPayoutOpenHour(PRESETS.fridayEarlyPayoutOpen), null);
  assert.equal(firstSundayMorningPayoutOpenHour(PRESETS.saturdayEarlyPayoutOpen), null);
  assert.equal(firstSundayMorningPayoutOpenHour(PRESETS.saturdayLatePayoutOpen), null);
  assert.equal(firstSundayMorningPayoutOpenHour(PRESETS.sundayLatePayoutClose), null);
  assert.equal(firstSundayMorningPayoutOpenHour(PRESETS.sundayLateBankClose), null);
  assert.equal(firstSundayMorningPayoutOpenHour(PRESETS.saturdayEarlyFxOpen), null);
  assert.equal(firstSundayMorningPayoutOpenHour(PRESETS.fridayLateFxClose), null);
  assert.ok(earlyOpen > 3);
  assert.ok(earlyOpen > 16);
  assert.ok(earlyOpen > 27);
  assert.ok(earlyOpen < 49);
});

test("older scenario JSON without sundayEarlyPayoutOpen keeps Sunday morning payout closed", () => {
  assert.equal(sanitizeScenario({}).scenario.sundayEarlyPayoutOpen, false);
  assert.equal(sanitizeScenario({ sundayEarlyPayoutOpen: "true" }).scenario.sundayEarlyPayoutOpen, false);
  assert.ok(sanitizeScenario({ sundayEarlyPayoutOpen: "true" }).errors.some((error) => error.includes("sundayEarlyPayoutOpen")));
});

test("Sunday early payout open is available as a preset button and is not a bank feed", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  assert.match(html, /data-preset="sundayEarlyPayoutOpen"/);
  assert.match(html, /Sunday early payout open \(synthetic\)/);
  assert.match(html, /id="sundayEarlyPayoutOpen"/);
  assert.match(html, /Open Sunday payout Sunday morning/);
  assert.match(html, /not a bank feed/i);
  assert.doesNotMatch(html, /live queue/i);
});
