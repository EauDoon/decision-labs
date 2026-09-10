import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import {
  DEFAULT_SCENARIO,
  PRESETS,
  firstClosedFxGanttHour,
  formatTime,
  getOperationalStatus,
  runSimulation,
  sanitizeScenario
} from "../src/model.js";

test("Friday late FX close keeps the Normal Friday calendar with a one-hour later Friday FX close", () => {
  const preset = PRESETS.fridayLateFxClose;
  assert.match(preset.name, /synthetic/i);
  assert.match(preset.name, /Friday late FX close/i);
  assert.equal(preset.fridayFxLateClose, true);
  assert.equal(DEFAULT_SCENARIO.fridayFxLateClose, false);
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
  const late = runSimulation(preset);
  const normal = runSimulation(DEFAULT_SCENARIO);
  assert.equal(late.timeline[9].timeLabel, "Sat 00:00");
  assert.equal(formatTime(9), "Sat 00:00");
  assert.equal(late.timeline[9].weekend, true);
  assert.equal(late.timeline[9].fxWeekday, true);
  assert.equal(normal.timeline[9].fxWeekday, false);
  assert.equal(late.timeline[9].issuerOpen, false);
  assert.equal(late.timeline[9].bankOpen, false);
  assert.equal(late.timeline[9].payoutOpen, false);
  assert.equal(late.timeline[9].fxDepthAudPerHour, DEFAULT_SCENARIO.fxDepthAudPerHour);
  assert.equal(normal.timeline[9].fxDepthAudPerHour, DEFAULT_SCENARIO.fxDepthAudPerHour / DEFAULT_SCENARIO.weekendFxMultiplier);
  assert.equal(late.timeline[10].timeLabel, "Sat 01:00");
  assert.equal(late.timeline[10].fxWeekday, false);
  assert.equal(normal.timeline[10].fxWeekday, false);
  assert.equal(getOperationalStatus(preset, 9).fxWeekday, true);
  assert.equal(getOperationalStatus(DEFAULT_SCENARIO, 9).fxWeekday, false);
  assert.equal(firstClosedFxGanttHour(preset), 10);
  assert.equal(firstClosedFxGanttHour(DEFAULT_SCENARIO), 9);
});

test("older scenario JSON without fridayFxLateClose keeps midnight weekend FX thinning", () => {
  assert.equal(sanitizeScenario({}).scenario.fridayFxLateClose, false);
  assert.equal(sanitizeScenario({ fridayFxLateClose: "true" }).scenario.fridayFxLateClose, false);
  assert.ok(sanitizeScenario({ fridayFxLateClose: "true" }).errors.some((error) => error.includes("fridayFxLateClose")));
});

test("Friday late FX close is available as a preset button and is not a live queue", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  assert.match(html, /data-preset="fridayLateFxClose"/);
  assert.match(html, /Friday late FX close \(synthetic\)/);
  assert.match(html, /id="fridayFxLateClose"/);
  assert.match(html, /Close Friday FX one hour later/);
  assert.doesNotMatch(html, /live queue/i);
});
