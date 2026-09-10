import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import { DEFAULT_SCENARIO, PRESETS, buildDemandSchedule, runSimulation } from "../src/model.js";

test("payday Friday burst preset is synthetic and distinct from existing Friday calendars", () => {
  const preset = PRESETS.paydayFridayBurst;
  assert.match(preset.name, /synthetic/i);
  assert.match(preset.name, /Payday Friday burst/i);
  assert.equal(preset.demandProfile, "fridayBurst");
  assert.equal(preset.mondayHoliday, false);
  assert.equal(preset.saturdayHoliday, false);
  assert.equal(preset.issuerOpenStartHour, DEFAULT_SCENARIO.issuerOpenStartHour);
  assert.equal(preset.issuerOpenEndHour, DEFAULT_SCENARIO.issuerOpenEndHour);
  assert.equal(preset.bankOpenEndHour, DEFAULT_SCENARIO.bankOpenEndHour);
  assert.equal(preset.payoutOpenEndHour, DEFAULT_SCENARIO.payoutOpenEndHour);
  assert.ok(preset.redemptionDemandAud > DEFAULT_SCENARIO.redemptionDemandAud);
  assert.ok(preset.redemptionDemandAud > PRESETS.compressedFridayClose.redemptionDemandAud);
  assert.notDeepEqual(preset, PRESETS.normal);
  assert.notDeepEqual(preset, PRESETS.thinFxTightWindows);
  assert.notDeepEqual(preset, PRESETS.longWeekendFridayStart);
  assert.notDeepEqual(preset, PRESETS.compressedFridayClose);
  const payday = buildDemandSchedule(preset.redemptionDemandAud, 72, preset.demandProfile);
  const compressed = buildDemandSchedule(PRESETS.compressedFridayClose.redemptionDemandAud, 72, PRESETS.compressedFridayClose.demandProfile);
  assert.ok(payday[0] > compressed[0]);
  const result = runSimulation(preset);
  assert.ok(result.timeline[1].settledThisHour > 0);
  assert.equal(result.timeline[2].timeLabel, "Fri 17:00");
  assert.equal(result.timeline[2].issuerOpen, false);
});

test("payday Friday burst is available as a preset button", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  assert.match(html, /data-preset="paydayFridayBurst"/);
  assert.match(html, /Payday Friday burst \(synthetic\)/);
});
