import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import {
  DEFAULT_SCENARIO,
  PRESETS,
  buildDemandSchedule,
  runSimulation
} from "../src/model.js";

test("Sunday stall close preset is a synthetic Sunday late burst with an earlier payout close", () => {
  const preset = PRESETS.sundayStallClose;
  assert.match(preset.name, /synthetic/i);
  assert.match(preset.name, /Sunday stall close/i);
  assert.equal(preset.demandProfile, "sundayBurst");
  assert.equal(preset.mondayHoliday, false);
  assert.equal(preset.saturdayHoliday, false);
  assert.equal(preset.issuerOpenStartHour, DEFAULT_SCENARIO.issuerOpenStartHour);
  assert.equal(preset.issuerOpenEndHour, DEFAULT_SCENARIO.issuerOpenEndHour);
  assert.equal(preset.bankOpenStartHour, DEFAULT_SCENARIO.bankOpenStartHour);
  assert.equal(preset.bankOpenEndHour, DEFAULT_SCENARIO.bankOpenEndHour);
  assert.equal(preset.payoutOpenStartHour, DEFAULT_SCENARIO.payoutOpenStartHour);
  assert.ok(preset.payoutOpenEndHour < DEFAULT_SCENARIO.payoutOpenEndHour);
  assert.ok(preset.redemptionDemandAud > DEFAULT_SCENARIO.redemptionDemandAud);
  assert.notDeepEqual(preset, PRESETS.normal);
  assert.notDeepEqual(preset, PRESETS.saturdayMarketBurst);
  assert.notDeepEqual(preset, PRESETS.paydayFridayBurst);
  assert.notDeepEqual(preset, PRESETS.publicHolidayMonday);
  assert.notDeepEqual(preset, PRESETS.longWeekendFridayStart);
  assert.notDeepEqual(preset, PRESETS.compressedFridayClose);
  assert.notDeepEqual(preset, PRESETS.weekendRush);
  assert.notDeepEqual(preset, PRESETS.marketStress);
  assert.notDeepEqual(preset, PRESETS.thinFxTightWindows);
  const sunday = buildDemandSchedule(preset.redemptionDemandAud, 72, preset.demandProfile);
  const saturday = buildDemandSchedule(PRESETS.saturdayMarketBurst.redemptionDemandAud, 72, PRESETS.saturdayMarketBurst.demandProfile);
  const payday = buildDemandSchedule(PRESETS.paydayFridayBurst.redemptionDemandAud, 72, PRESETS.paydayFridayBurst.demandProfile);
  assert.ok(sunday[52] > saturday[52]);
  assert.ok(sunday[52] > sunday[21]);
  assert.ok(sunday[52] > payday[52]);
  const result = runSimulation(preset);
  assert.equal(result.timeline[52].timeLabel, "Sun 19:00");
  assert.equal(result.timeline[52].issuerOpen, false);
  assert.equal(result.timeline[1].payoutOpen, false);
  assert.equal(runSimulation(DEFAULT_SCENARIO).timeline[1].payoutOpen, true);
});

test("Sunday stall close is available as a preset button and is not a live queue", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  assert.match(html, /data-preset="sundayStallClose"/);
  assert.match(html, /Sunday stall close \(synthetic\)/);
  assert.match(html, /value="sundayBurst"/);
  assert.doesNotMatch(html, /live queue/i);
});
