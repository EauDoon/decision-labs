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

function firstSaturdayLateFxOpenHour(scenario) {
  for (let hour = 0; hour < 72; hour += 1) {
    const { dayIndex, localHour } = dayAndHourAt(hour);
    if (dayIndex === 6 && localHour >= 16 && localHour < 18 && getOperationalStatus(scenario, hour).fxWeekday) {
      const ordinary = getOperationalStatus({
        ...scenario,
        saturdayLateFxOpen: false
      }, hour).fxWeekday;
      if (!ordinary) return hour;
    }
  }
  return null;
}

test("Saturday late FX open keeps the Normal Friday calendar with a Saturday evening FX window", () => {
  const preset = PRESETS.saturdayLateFxOpen;
  assert.match(preset.name, /synthetic/i);
  assert.match(preset.name, /Saturday late FX open/i);
  assert.equal(preset.saturdayLateFxOpen, true);
  assert.equal(DEFAULT_SCENARIO.saturdayLateFxOpen, false);
  assert.equal(preset.saturdayLateBankOpen, false);
  assert.equal(preset.saturdayLatePayoutOpen, false);
  assert.equal(preset.saturdayEarlyFxOpen, false);
  assert.equal(preset.saturdayMiddayFxOpen, false);
  assert.equal(preset.fridayLateFxOpen, false);
  assert.equal(preset.fridayFxLateClose, false);
  assert.equal(preset.saturdayEarlyBankOpen, false);
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
  assert.notDeepEqual(preset, PRESETS.saturdayLateBankOpen);
  assert.notDeepEqual(preset, PRESETS.saturdayLatePayoutOpen);
  assert.notDeepEqual(preset, PRESETS.saturdayEarlyFxOpen);
  assert.notDeepEqual(preset, PRESETS.saturdayMiddayFxOpen);
  assert.notDeepEqual(preset, PRESETS.fridayLateFxOpen);
  assert.notDeepEqual(preset, PRESETS.fridayLateFxClose);
  const late = runSimulation(preset);
  const normal = runSimulation(DEFAULT_SCENARIO);
  const lateBank = runSimulation(PRESETS.saturdayLateBankOpen);
  const latePayout = runSimulation(PRESETS.saturdayLatePayoutOpen);
  const saturdayEarly = runSimulation(PRESETS.saturdayEarlyFxOpen);
  const fridayLate = runSimulation(PRESETS.fridayLateFxOpen);
  assert.equal(late.timeline[15].timeLabel, "Sat 06:00");
  assert.equal(late.timeline[15].fxWeekday, false);
  assert.equal(saturdayEarly.timeline[15].fxWeekday, true);
  assert.equal(late.timeline[24].timeLabel, "Sat 15:00");
  assert.equal(late.timeline[24].fxWeekday, false);
  assert.equal(late.timeline[25].timeLabel, "Sat 16:00");
  assert.equal(formatTime(25), "Sat 16:00");
  assert.equal(late.timeline[25].weekend, true);
  assert.equal(late.timeline[25].fxWeekday, true);
  assert.equal(normal.timeline[25].fxWeekday, false);
  assert.equal(lateBank.timeline[25].fxWeekday, false);
  assert.equal(lateBank.timeline[25].bankOpen, true);
  assert.equal(late.timeline[25].bankOpen, false);
  assert.equal(late.timeline[25].issuerOpen, false);
  assert.equal(late.timeline[25].payoutOpen, false);
  assert.equal(late.timeline[26].timeLabel, "Sat 17:00");
  assert.equal(late.timeline[26].fxWeekday, true);
  assert.equal(late.timeline[27].timeLabel, "Sat 18:00");
  assert.equal(late.timeline[27].fxWeekday, false);
  assert.equal(latePayout.timeline[27].payoutOpen, true);
  assert.equal(late.timeline[27].payoutOpen, false);
  assert.equal(late.timeline[1].timeLabel, "Fri 16:00");
  assert.equal(late.timeline[1].fxWeekday, true);
  assert.equal(fridayLate.timeline[1].fxWeekday, true);
  assert.equal(late.timeline[9].timeLabel, "Sat 00:00");
  assert.equal(late.timeline[9].fxWeekday, false);
  assert.equal(getOperationalStatus(preset, 25).fxWeekday, true);
  assert.equal(getOperationalStatus(DEFAULT_SCENARIO, 25).fxWeekday, false);
  assert.equal(getOperationalStatus(PRESETS.saturdayLateBankOpen, 25).fxWeekday, false);
  assert.equal(getOperationalStatus(PRESETS.saturdayLateBankOpen, 25).bankOpen, true);
  assert.equal(getOperationalStatus(preset, 25).bankOpen, false);
  assert.equal(getOperationalStatus(preset, 25).issuerOpen, false);
  assert.equal(getOperationalStatus(preset, 25).payoutOpen, false);
  assert.equal(getOperationalStatus(PRESETS.saturdayEarlyFxOpen, 15).fxWeekday, true);
  assert.equal(getOperationalStatus(preset, 15).fxWeekday, false);
  const lateOpen = firstSaturdayLateFxOpenHour(preset);
  assert.equal(lateOpen, 25);
  assert.equal(firstSaturdayLateFxOpenHour(DEFAULT_SCENARIO), null);
  assert.equal(firstSaturdayLateFxOpenHour(PRESETS.saturdayLateBankOpen), null);
  assert.equal(firstSaturdayLateFxOpenHour(PRESETS.saturdayLatePayoutOpen), null);
  assert.equal(firstSaturdayLateFxOpenHour(PRESETS.saturdayEarlyFxOpen), null);
  assert.equal(firstSaturdayLateFxOpenHour(PRESETS.saturdayMiddayFxOpen), null);
  assert.equal(firstSaturdayLateFxOpenHour(PRESETS.fridayLateFxOpen), null);
  assert.ok(lateOpen > 17);
  assert.ok(lateOpen < 33);
});

test("Saturday late FX open ORs into fxWeekday through isSaturdayLateFxOpenHour, not Friday late FX helpers", async () => {
  const model = await readFile(new URL("../src/model.js", import.meta.url), "utf8");
  const helperStart = model.indexOf("function isSaturdayLateFxOpenHour");
  const helperNext = model.indexOf("\nexport function getOperationalStatus", helperStart);
  const helper = model.slice(helperStart, helperNext === -1 ? undefined : helperNext);
  assert.match(helper, /scenario\.saturdayLateFxOpen !== true/);
  assert.match(helper, /localHour >= 16 && localHour < 18/);
  assert.doesNotMatch(helper, /isFridayLateFxOpenHour/);
  assert.doesNotMatch(helper, /isFridayLateFxHour/);
  assert.doesNotMatch(helper, /isSaturdayEarlyFxHour/);
  assert.match(model, /isSaturdayLateFxOpenHour\(hourOffset, scenario\)/);
  const statusStart = model.indexOf("export function getOperationalStatus");
  const statusNext = model.indexOf("\nexport function ", statusStart + 1);
  const status = model.slice(statusStart, statusNext === -1 ? undefined : statusNext);
  assert.match(status, /isFridayLateFxHour\(hourOffset, scenario\)/);
  assert.match(status, /isSaturdayEarlyFxHour\(hourOffset, scenario\)/);
  assert.match(status, /isFridayLateFxOpenHour\(hourOffset, scenario\)/);
  assert.match(status, /isSaturdayLateFxOpenHour\(hourOffset, scenario\)/);
  assert.doesNotMatch(model, /Date\.now/);
});

test("older scenario JSON without saturdayLateFxOpen keeps Saturday evening on ordinary weekend FX depth", () => {
  assert.equal(sanitizeScenario({}).scenario.saturdayLateFxOpen, false);
  assert.equal(sanitizeScenario({ saturdayLateFxOpen: "true" }).scenario.saturdayLateFxOpen, false);
  assert.ok(sanitizeScenario({ saturdayLateFxOpen: "true" }).errors.some((error) => error.includes("saturdayLateFxOpen")));
});

test("Saturday late FX open is available as a preset button and is not an FX feed", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  assert.match(html, /data-preset="saturdayLateFxOpen"/);
  assert.match(html, /Saturday late FX open \(synthetic\)/);
  assert.match(html, /id="saturdayLateFxOpen"/);
  assert.match(html, /Keep Saturday FX open 16:00 to 18:00/);
  assert.match(html, /not an FX feed/i);
  assert.doesNotMatch(html, /live queue/i);
});
