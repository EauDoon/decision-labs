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

function firstSundayLateFxOpenHour(scenario) {
  for (let hour = 0; hour < 72; hour += 1) {
    const { dayIndex, localHour } = dayAndHourAt(hour);
    if (dayIndex === 0 && localHour >= 16 && localHour < 18 && getOperationalStatus(scenario, hour).fxWeekday) {
      const ordinary = getOperationalStatus({
        ...scenario,
        sundayLateFxOpen: false
      }, hour).fxWeekday;
      if (!ordinary) return hour;
    }
  }
  return null;
}

test("Sunday late FX open keeps the Normal Friday calendar with a Sunday evening FX window", () => {
  const preset = PRESETS.sundayLateFxOpen;
  assert.match(preset.name, /synthetic/i);
  assert.match(preset.name, /Sunday late FX open/i);
  assert.equal(preset.sundayLateFxOpen, true);
  assert.equal(DEFAULT_SCENARIO.sundayLateFxOpen, false);
  assert.equal(preset.saturdayLateFxOpen, false);
  assert.equal(preset.fridayLateFxOpen, false);
  assert.equal(preset.saturdayLateBankOpen, false);
  assert.equal(preset.saturdayLatePayoutOpen, false);
  assert.equal(preset.sundayLateIssuerClose, false);
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
  assert.notDeepEqual(preset, PRESETS.saturdayLateFxOpen);
  assert.notDeepEqual(preset, PRESETS.fridayLateFxOpen);
  assert.notDeepEqual(preset, PRESETS.saturdayLateBankOpen);
  assert.notDeepEqual(preset, PRESETS.saturdayLatePayoutOpen);
  assert.notDeepEqual(preset, PRESETS.sundayLateIssuerClose);
  assert.notDeepEqual(preset, PRESETS.sundayLatePayoutClose);
  assert.notDeepEqual(preset, PRESETS.sundayLateBankClose);
  const late = runSimulation(preset);
  const normal = runSimulation(DEFAULT_SCENARIO);
  const saturdayLate = runSimulation(PRESETS.saturdayLateFxOpen);
  const fridayLate = runSimulation(PRESETS.fridayLateFxOpen);
  const lateBank = runSimulation(PRESETS.sundayLateBankClose);
  const latePayout = runSimulation(PRESETS.sundayLatePayoutClose);
  const lateIssuer = runSimulation(PRESETS.sundayLateIssuerClose);
  assert.equal(late.timeline[25].timeLabel, "Sat 16:00");
  assert.equal(late.timeline[25].fxWeekday, false);
  assert.equal(saturdayLate.timeline[25].fxWeekday, true);
  assert.equal(late.timeline[48].timeLabel, "Sun 15:00");
  assert.equal(late.timeline[48].fxWeekday, false);
  assert.equal(late.timeline[49].timeLabel, "Sun 16:00");
  assert.equal(formatTime(49), "Sun 16:00");
  assert.equal(late.timeline[49].weekend, true);
  assert.equal(late.timeline[49].fxWeekday, true);
  assert.equal(normal.timeline[49].fxWeekday, false);
  assert.equal(lateBank.timeline[49].fxWeekday, false);
  assert.equal(lateBank.timeline[49].bankOpen, true);
  assert.equal(latePayout.timeline[49].payoutOpen, true);
  assert.equal(lateIssuer.timeline[49].issuerOpen, true);
  assert.equal(late.timeline[49].bankOpen, false);
  assert.equal(late.timeline[49].issuerOpen, false);
  assert.equal(late.timeline[49].payoutOpen, false);
  assert.equal(late.timeline[50].timeLabel, "Sun 17:00");
  assert.equal(late.timeline[50].fxWeekday, true);
  assert.equal(late.timeline[51].timeLabel, "Sun 18:00");
  assert.equal(late.timeline[51].fxWeekday, false);
  assert.equal(late.timeline[1].timeLabel, "Fri 16:00");
  assert.equal(late.timeline[1].fxWeekday, true);
  assert.equal(fridayLate.timeline[1].fxWeekday, true);
  assert.equal(getOperationalStatus(preset, 49).fxWeekday, true);
  assert.equal(getOperationalStatus(DEFAULT_SCENARIO, 49).fxWeekday, false);
  assert.equal(getOperationalStatus(PRESETS.saturdayLateFxOpen, 49).fxWeekday, false);
  assert.equal(getOperationalStatus(PRESETS.sundayLateBankClose, 49).fxWeekday, false);
  assert.equal(getOperationalStatus(PRESETS.sundayLateBankClose, 49).bankOpen, true);
  assert.equal(getOperationalStatus(preset, 49).bankOpen, false);
  assert.equal(getOperationalStatus(preset, 49).issuerOpen, false);
  assert.equal(getOperationalStatus(preset, 49).payoutOpen, false);
  const lateOpen = firstSundayLateFxOpenHour(preset);
  assert.equal(lateOpen, 49);
  assert.equal(firstSundayLateFxOpenHour(DEFAULT_SCENARIO), null);
  assert.equal(firstSundayLateFxOpenHour(PRESETS.saturdayLateFxOpen), null);
  assert.equal(firstSundayLateFxOpenHour(PRESETS.fridayLateFxOpen), null);
  assert.equal(firstSundayLateFxOpenHour(PRESETS.saturdayLateBankOpen), null);
  assert.equal(firstSundayLateFxOpenHour(PRESETS.saturdayLatePayoutOpen), null);
  assert.equal(firstSundayLateFxOpenHour(PRESETS.sundayLateIssuerClose), null);
  assert.equal(firstSundayLateFxOpenHour(PRESETS.sundayLatePayoutClose), null);
  assert.equal(firstSundayLateFxOpenHour(PRESETS.sundayLateBankClose), null);
  assert.ok(lateOpen > 33);
  assert.ok(lateOpen < 57);
});

test("Sunday late FX open ORs into fxWeekday through isSundayLateFxOpenHour, not Saturday late FX helpers", async () => {
  const model = await readFile(new URL("../src/model.js", import.meta.url), "utf8");
  const helperStart = model.indexOf("function isSundayLateFxOpenHour");
  const helperNext = model.indexOf("\nexport function getOperationalStatus", helperStart);
  const helper = model.slice(helperStart, helperNext === -1 ? undefined : helperNext);
  assert.match(helper, /scenario\.sundayLateFxOpen !== true/);
  assert.match(helper, /localHour >= 16 && localHour < 18/);
  assert.doesNotMatch(helper, /isSaturdayLateFxOpenHour/);
  assert.doesNotMatch(helper, /isFridayLateFxOpenHour/);
  assert.doesNotMatch(helper, /isFridayLateFxHour/);
  assert.doesNotMatch(helper, /isSaturdayEarlyFxHour/);
  assert.match(model, /isSundayLateFxOpenHour\(hourOffset, scenario\)/);
  const statusStart = model.indexOf("export function getOperationalStatus");
  const statusNext = model.indexOf("\nexport function ", statusStart + 1);
  const status = model.slice(statusStart, statusNext === -1 ? undefined : statusNext);
  assert.match(status, /isFridayLateFxHour\(hourOffset, scenario\)/);
  assert.match(status, /isSaturdayEarlyFxHour\(hourOffset, scenario\)/);
  assert.match(status, /isFridayLateFxOpenHour\(hourOffset, scenario\)/);
  assert.match(status, /isSaturdayLateFxOpenHour\(hourOffset, scenario\)/);
  assert.match(status, /isSundayLateFxOpenHour\(hourOffset, scenario\)/);
  assert.doesNotMatch(model, /Date\.now/);
});

test("older scenario JSON without sundayLateFxOpen keeps Sunday evening on ordinary weekend FX depth", () => {
  assert.equal(sanitizeScenario({}).scenario.sundayLateFxOpen, false);
  assert.equal(sanitizeScenario({ sundayLateFxOpen: "true" }).scenario.sundayLateFxOpen, false);
  assert.ok(sanitizeScenario({ sundayLateFxOpen: "true" }).errors.some((error) => error.includes("sundayLateFxOpen")));
});

test("Sunday late FX open is available as a preset button and is not an FX feed", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  assert.match(html, /data-preset="sundayLateFxOpen"/);
  assert.match(html, /Sunday late FX open \(synthetic\)/);
  assert.match(html, /id="sundayLateFxOpen"/);
  assert.match(html, /Keep Sunday FX open 16:00 to 18:00/);
  assert.match(html, /not an FX feed/i);
  assert.doesNotMatch(html, /live queue/i);
});
