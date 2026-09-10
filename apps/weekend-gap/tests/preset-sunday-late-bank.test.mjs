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

function firstSundayLateBankOpenHour(scenario) {
  for (let hour = 0; hour < 72; hour += 1) {
    const { dayIndex, localHour } = dayAndHourAt(hour);
    if (dayIndex === 0 && localHour >= 16 && localHour < 18 && getOperationalStatus(scenario, hour).bankOpen) {
      return hour;
    }
  }
  return null;
}

test("Sunday late bank close keeps the Normal Friday calendar with a Sunday evening bank window", () => {
  const preset = PRESETS.sundayLateBankClose;
  assert.match(preset.name, /synthetic/i);
  assert.match(preset.name, /Sunday late bank close/i);
  assert.equal(preset.sundayLateBankClose, true);
  assert.equal(DEFAULT_SCENARIO.sundayLateBankClose, false);
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
  const late = runSimulation(preset);
  const normal = runSimulation(DEFAULT_SCENARIO);
  const stall = runSimulation(PRESETS.sundayStallClose);
  assert.equal(late.timeline[48].timeLabel, "Sun 15:00");
  assert.equal(late.timeline[48].bankOpen, false);
  assert.equal(normal.timeline[48].bankOpen, false);
  assert.equal(late.timeline[49].timeLabel, "Sun 16:00");
  assert.equal(formatTime(49), "Sun 16:00");
  assert.equal(late.timeline[49].weekend, true);
  assert.equal(late.timeline[49].bankOpen, true);
  assert.equal(normal.timeline[49].bankOpen, false);
  assert.equal(stall.timeline[49].bankOpen, false);
  assert.equal(late.timeline[49].issuerOpen, false);
  assert.equal(late.timeline[49].payoutOpen, false);
  assert.equal(late.timeline[49].fxWeekday, false);
  assert.equal(late.timeline[50].timeLabel, "Sun 17:00");
  assert.equal(late.timeline[50].bankOpen, true);
  assert.equal(normal.timeline[50].bankOpen, false);
  assert.equal(late.timeline[51].timeLabel, "Sun 18:00");
  assert.equal(late.timeline[51].bankOpen, false);
  assert.equal(getOperationalStatus(preset, 49).bankOpen, true);
  assert.equal(getOperationalStatus(DEFAULT_SCENARIO, 49).bankOpen, false);
  const lateOpen = firstSundayLateBankOpenHour(preset);
  assert.equal(lateOpen, 49);
  assert.equal(firstSundayLateBankOpenHour(PRESETS.sundayStallClose), null);
  assert.equal(firstSundayLateBankOpenHour(PRESETS.saturdayEarlyFxOpen), null);
  assert.equal(firstSundayLateBankOpenHour(PRESETS.fridayLateFxClose), null);
  assert.equal(firstSundayLateBankOpenHour(PRESETS.mondayLateIssuerOpen), null);
  assert.equal(firstSundayLateBankOpenHour(PRESETS.earlyMondayBankOpen), null);
  assert.ok(lateOpen > 33);
  assert.ok(lateOpen < 57);
});

test("older scenario JSON without sundayLateBankClose keeps Sunday bank closed", () => {
  assert.equal(sanitizeScenario({}).scenario.sundayLateBankClose, false);
  assert.equal(sanitizeScenario({ sundayLateBankClose: "true" }).scenario.sundayLateBankClose, false);
  assert.ok(sanitizeScenario({ sundayLateBankClose: "true" }).errors.some((error) => error.includes("sundayLateBankClose")));
});

test("Sunday late bank close is available as a preset button and is not a bank feed", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  assert.match(html, /data-preset="sundayLateBankClose"/);
  assert.match(html, /Sunday late bank close \(synthetic\)/);
  assert.match(html, /id="sundayLateBankClose"/);
  assert.match(html, /Keep Sunday bank open 16:00 to 18:00/);
  assert.match(html, /not a bank feed/i);
  assert.doesNotMatch(html, /live queue/i);
});
