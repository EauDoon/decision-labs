import assert from "node:assert/strict";
import test from "node:test";
import { PRESETS, runSimulation } from "../src/model.js";

test("thin FX tight-windows preset is labeled synthetic and uses a holiday Monday", () => {
  const preset = PRESETS.thinFxTightWindows;
  assert.match(preset.name, /synthetic/i);
  assert.equal(preset.mondayHoliday, true);
  assert.ok(preset.fxDepthAudPerHour < PRESETS.normal.fxDepthAudPerHour);
  assert.ok(preset.issuerOpenEndHour - preset.issuerOpenStartHour < PRESETS.normal.issuerOpenEndHour - PRESETS.normal.issuerOpenStartHour);
  assert.ok(preset.payoutOpenEndHour - preset.payoutOpenStartHour < PRESETS.normal.payoutOpenEndHour - PRESETS.normal.payoutOpenStartHour);
  const result = runSimulation(preset);
  for (const point of result.timeline.filter((item) => item.timeLabel.startsWith("Mon"))) {
    assert.equal(point.settledThisHour, 0);
    assert.equal(point.issuerOpen, false);
  }
  assert.equal(result.scenario.fxDepthAudPerHour, 90000);
});
