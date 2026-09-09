import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import { DEFAULT_SCENARIO, PRESETS, runSimulation } from "../src/model.js";

test("long-weekend Friday start preset is synthetic and distinct from Normal Friday and thin FX", () => {
  const preset = PRESETS.longWeekendFridayStart;
  assert.match(preset.name, /synthetic/i);
  assert.match(preset.name, /Long-weekend Friday start/i);
  assert.equal(preset.saturdayHoliday, true);
  assert.equal(preset.mondayHoliday, true);
  assert.notDeepEqual(preset, PRESETS.normal);
  assert.notDeepEqual(preset, PRESETS.thinFxTightWindows);
  assert.equal(preset.issuerOpenStartHour, DEFAULT_SCENARIO.issuerOpenStartHour);
  assert.equal(preset.issuerOpenEndHour, DEFAULT_SCENARIO.issuerOpenEndHour);
  assert.ok(preset.fxDepthAudPerHour > PRESETS.thinFxTightWindows.fxDepthAudPerHour);
  assert.notEqual(preset.reserveCashAud, PRESETS.normal.reserveCashAud);
  assert.notEqual(preset.redemptionDemandAud, PRESETS.normal.redemptionDemandAud);
  const result = runSimulation(preset);
  assert.ok(result.timeline[1].settledThisHour > 0);
  for (const point of result.timeline.filter((item) => item.timeLabel.startsWith("Sat") || item.timeLabel.startsWith("Sun") || item.timeLabel.startsWith("Mon"))) {
    assert.equal(point.issuerOpen, false);
    assert.equal(point.weekend, true);
  }
});

test("long-weekend Friday start is available as a preset button", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  assert.match(html, /data-preset="longWeekendFridayStart"/);
  assert.match(html, /Long-weekend Friday start \(synthetic\)/);
});
