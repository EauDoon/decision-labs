import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import {
  DEFAULT_SCENARIO,
  PRESETS,
  buildDemandSchedule,
  getOperationalStatus,
  runSimulation
} from "../src/model.js";

test("Thin Saturday FX preset keeps the Normal Friday calendar with Saturday burst and tighter Saturday FX", () => {
  const preset = PRESETS.thinSaturdayFx;
  assert.match(preset.name, /synthetic/i);
  assert.match(preset.name, /Thin Saturday FX/i);
  assert.equal(preset.demandProfile, "saturdayBurst");
  assert.equal(preset.mondayHoliday, false);
  assert.equal(preset.saturdayHoliday, false);
  assert.equal(preset.issuerOpenStartHour, DEFAULT_SCENARIO.issuerOpenStartHour);
  assert.equal(preset.issuerOpenEndHour, DEFAULT_SCENARIO.issuerOpenEndHour);
  assert.equal(preset.bankOpenStartHour, DEFAULT_SCENARIO.bankOpenStartHour);
  assert.equal(preset.bankOpenEndHour, DEFAULT_SCENARIO.bankOpenEndHour);
  assert.equal(preset.payoutOpenStartHour, DEFAULT_SCENARIO.payoutOpenStartHour);
  assert.equal(preset.payoutOpenEndHour, DEFAULT_SCENARIO.payoutOpenEndHour);
  assert.ok(preset.weekendFxMultiplier > PRESETS.saturdayMarketBurst.weekendFxMultiplier);
  assert.ok(preset.fxDepthAudPerHour < DEFAULT_SCENARIO.fxDepthAudPerHour);
  assert.ok(preset.fxDepthAudPerHour > PRESETS.thinFxTightWindows.fxDepthAudPerHour);
  assert.notDeepEqual(preset, PRESETS.normal);
  assert.notDeepEqual(preset, PRESETS.saturdayMarketBurst);
  assert.notDeepEqual(preset, PRESETS.sundayStallClose);
  assert.notDeepEqual(preset, PRESETS.paydayFridayBurst);
  assert.notDeepEqual(preset, PRESETS.publicHolidayMonday);
  assert.notDeepEqual(preset, PRESETS.thinFxTightWindows);
  const saturday = buildDemandSchedule(preset.redemptionDemandAud, 72, preset.demandProfile);
  const sunday = buildDemandSchedule(PRESETS.sundayStallClose.redemptionDemandAud, 72, PRESETS.sundayStallClose.demandProfile);
  assert.ok(saturday[21] > saturday[0]);
  assert.ok(saturday[21] > sunday[21]);
  const thinSaturday = getOperationalStatus(preset, 21);
  const marketSaturday = getOperationalStatus(PRESETS.saturdayMarketBurst, 21);
  assert.equal(thinSaturday.weekend, true);
  assert.ok(thinSaturday.fxDepthAudPerHour < marketSaturday.fxDepthAudPerHour);
  const result = runSimulation(preset);
  assert.equal(result.timeline[21].timeLabel, "Sat 12:00");
  assert.equal(result.timeline[21].issuerOpen, false);
  assert.equal(runSimulation(DEFAULT_SCENARIO).timeline[1].payoutOpen, true);
  assert.equal(result.timeline[1].payoutOpen, true);
});

test("Thin Saturday FX is available as a preset button and is not a live queue", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  assert.match(html, /data-preset="thinSaturdayFx"/);
  assert.match(html, /Thin Saturday FX \(synthetic\)/);
  assert.match(html, /value="saturdayBurst"/);
  assert.doesNotMatch(html, /live queue/i);
});
