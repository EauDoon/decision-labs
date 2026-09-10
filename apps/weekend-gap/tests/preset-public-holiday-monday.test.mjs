import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import { DEFAULT_SCENARIO, PRESETS, runSimulation } from "../src/model.js";

test("public-holiday Monday preset keeps the Normal Friday start and closes Monday banks", () => {
  const preset = PRESETS.publicHolidayMonday;
  assert.match(preset.name, /synthetic/i);
  assert.match(preset.name, /Public-holiday Monday/i);
  assert.equal(preset.mondayHoliday, true);
  assert.equal(preset.saturdayHoliday, false);
  assert.equal(preset.demandProfile, DEFAULT_SCENARIO.demandProfile);
  assert.equal(preset.issuerOpenStartHour, DEFAULT_SCENARIO.issuerOpenStartHour);
  assert.equal(preset.issuerOpenEndHour, DEFAULT_SCENARIO.issuerOpenEndHour);
  assert.equal(preset.bankOpenStartHour, DEFAULT_SCENARIO.bankOpenStartHour);
  assert.equal(preset.bankOpenEndHour, DEFAULT_SCENARIO.bankOpenEndHour);
  assert.equal(preset.payoutOpenStartHour, DEFAULT_SCENARIO.payoutOpenStartHour);
  assert.equal(preset.payoutOpenEndHour, DEFAULT_SCENARIO.payoutOpenEndHour);
  assert.equal(preset.redemptionDemandAud, DEFAULT_SCENARIO.redemptionDemandAud);
  assert.notDeepEqual(preset, PRESETS.normal);
  assert.notDeepEqual(preset, PRESETS.longWeekendFridayStart);
  assert.notDeepEqual(preset, PRESETS.compressedFridayClose);
  assert.notDeepEqual(preset, PRESETS.paydayFridayBurst);
  assert.notDeepEqual(preset, PRESETS.thinFxTightWindows);
  const result = runSimulation(preset);
  assert.ok(result.timeline[1].settledThisHour > 0);
  assert.equal(result.timeline[1].timeLabel, "Fri 16:00");
  for (const point of result.timeline.filter((item) => item.timeLabel.startsWith("Mon"))) {
    assert.equal(point.issuerOpen, false);
    assert.equal(point.bankOpen, false);
    assert.equal(point.payoutOpen, false);
    assert.equal(point.settledThisHour, 0);
    assert.equal(point.weekend, true);
  }
});

test("public-holiday Monday is available as a preset button", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  assert.match(html, /data-preset="publicHolidayMonday"/);
  assert.match(html, /Public-holiday Monday \(synthetic\)/);
});
