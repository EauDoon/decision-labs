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

function firstFridayLateFxOpenHour(scenario) {
  for (let hour = 0; hour < 72; hour += 1) {
    const { dayIndex, localHour } = dayAndHourAt(hour);
    if (dayIndex === 5 && localHour >= 16 && localHour < 18 && getOperationalStatus(scenario, hour).fxWeekday) {
      const ordinary = getOperationalStatus({
        ...scenario,
        fridayLateFxOpen: false
      }, hour).fxWeekday;
      if (!ordinary) return hour;
    }
  }
  return null;
}

test("Friday late FX open keeps the Normal Friday calendar with a Friday evening FX window", () => {
  const preset = PRESETS.fridayLateFxOpen;
  assert.match(preset.name, /synthetic/i);
  assert.match(preset.name, /Friday late FX open/i);
  assert.equal(preset.fridayLateFxOpen, true);
  assert.equal(DEFAULT_SCENARIO.fridayLateFxOpen, false);
  assert.equal(preset.fridayLateBankOpen, false);
  assert.equal(preset.fridayFxLateClose, false);
  assert.equal(preset.saturdayEarlyFxOpen, false);
  assert.equal(preset.saturdayLateBankOpen, false);
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
  assert.notDeepEqual(preset, PRESETS.fridayLateBankOpen);
  assert.notDeepEqual(preset, PRESETS.fridayLateFxClose);
  assert.notDeepEqual(preset, PRESETS.saturdayEarlyFxOpen);
  assert.notDeepEqual(preset, PRESETS.saturdayLateBankOpen);
  assert.notDeepEqual(preset, PRESETS.saturdayEarlyBankOpen);
  const late = runSimulation(preset);
  const normal = runSimulation(DEFAULT_SCENARIO);
  const lateBank = runSimulation(PRESETS.fridayLateBankOpen);
  const lateClose = runSimulation(PRESETS.fridayLateFxClose);
  const saturdayEarly = runSimulation(PRESETS.saturdayEarlyFxOpen);
  assert.equal(late.timeline[1].timeLabel, "Fri 16:00");
  assert.equal(late.timeline[1].fxWeekday, true);
  assert.equal(normal.timeline[1].fxWeekday, true);
  assert.equal(late.timeline[2].timeLabel, "Fri 17:00");
  assert.equal(formatTime(2), "Fri 17:00");
  assert.equal(late.timeline[2].fxWeekday, true);
  assert.equal(normal.timeline[2].fxWeekday, true);
  assert.equal(late.timeline[2].bankOpen, false);
  assert.equal(lateBank.timeline[2].bankOpen, true);
  assert.equal(late.timeline[2].issuerOpen, false);
  assert.equal(late.timeline[2].payoutOpen, false);
  assert.equal(late.timeline[3].timeLabel, "Fri 18:00");
  assert.equal(late.timeline[3].fxWeekday, true);
  assert.equal(late.timeline[9].timeLabel, "Sat 00:00");
  assert.equal(late.timeline[9].fxWeekday, false);
  assert.equal(lateClose.timeline[9].fxWeekday, true);
  assert.equal(late.timeline[15].timeLabel, "Sat 06:00");
  assert.equal(late.timeline[15].fxWeekday, false);
  assert.equal(saturdayEarly.timeline[15].fxWeekday, true);
  assert.equal(getOperationalStatus(preset, 1).fxWeekday, true);
  assert.equal(getOperationalStatus(preset, 2).fxWeekday, true);
  assert.equal(getOperationalStatus(preset, 2).bankOpen, false);
  assert.equal(getOperationalStatus(PRESETS.fridayLateBankOpen, 2).bankOpen, true);
  assert.equal(getOperationalStatus(PRESETS.fridayLateFxClose, 9).fxWeekday, true);
  assert.equal(getOperationalStatus(preset, 9).fxWeekday, false);
  assert.equal(firstFridayLateFxOpenHour(preset), null);
  assert.equal(firstFridayLateFxOpenHour(DEFAULT_SCENARIO), null);
  assert.equal(firstFridayLateFxOpenHour(PRESETS.fridayLateBankOpen), null);
  assert.equal(firstFridayLateFxOpenHour(PRESETS.fridayLateFxClose), null);
  assert.equal(firstFridayLateFxOpenHour(PRESETS.saturdayEarlyFxOpen), null);
});

test("Friday late FX open ORs into fxWeekday through isFridayLateFxOpenHour, not isFridayLateFxHour", async () => {
  const model = await readFile(new URL("../src/model.js", import.meta.url), "utf8");
  const helperStart = model.indexOf("function isFridayLateFxOpenHour");
  const helperNext = model.indexOf("\nexport function getOperationalStatus", helperStart);
  const helper = model.slice(helperStart, helperNext === -1 ? undefined : helperNext);
  assert.match(helper, /scenario\.fridayLateFxOpen !== true/);
  assert.match(helper, /localHour >= 16 && localHour < 18/);
  assert.doesNotMatch(helper, /isFridayLateFxHour/);
  assert.match(model, /isFridayLateFxOpenHour\(hourOffset, scenario\)/);
  const statusStart = model.indexOf("export function getOperationalStatus");
  const statusNext = model.indexOf("\nexport function ", statusStart + 1);
  const status = model.slice(statusStart, statusNext === -1 ? undefined : statusNext);
  assert.match(status, /isFridayLateFxHour\(hourOffset, scenario\)/);
  assert.match(status, /isSaturdayEarlyFxHour\(hourOffset, scenario\)/);
  assert.match(status, /isFridayLateFxOpenHour\(hourOffset, scenario\)/);
  assert.doesNotMatch(model, /Date\.now/);
});

test("older scenario JSON without fridayLateFxOpen keeps Friday evening on ordinary weekday FX depth", () => {
  assert.equal(sanitizeScenario({}).scenario.fridayLateFxOpen, false);
  assert.equal(sanitizeScenario({ fridayLateFxOpen: "true" }).scenario.fridayLateFxOpen, false);
  assert.ok(sanitizeScenario({ fridayLateFxOpen: "true" }).errors.some((error) => error.includes("fridayLateFxOpen")));
});

test("Friday late FX open is available as a preset button and is not an FX feed", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  assert.match(html, /data-preset="fridayLateFxOpen"/);
  assert.match(html, /Friday late FX open \(synthetic\)/);
  assert.match(html, /id="fridayLateFxOpen"/);
  assert.match(html, /Keep Friday FX open 16:00 to 18:00/);
  assert.match(html, /not an FX feed/i);
  assert.doesNotMatch(html, /live queue/i);
});
