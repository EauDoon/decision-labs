import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import { DEFAULT_SCENARIO, PRESETS, runSimulation } from "../src/model.js";

test("compressed Friday close preset is synthetic and distinct from Normal Friday, thin FX and long-weekend", () => {
  const preset = PRESETS.compressedFridayClose;
  assert.match(preset.name, /synthetic/i);
  assert.match(preset.name, /Compressed Friday close/i);
  assert.equal(preset.mondayHoliday, false);
  assert.equal(preset.saturdayHoliday, false);
  assert.equal(preset.demandProfile, "fridayBurst");
  assert.equal(preset.issuerOpenEndHour, 16);
  assert.equal(preset.bankOpenEndHour, 16);
  assert.equal(preset.payoutOpenEndHour, 16);
  assert.notDeepEqual(preset, PRESETS.normal);
  assert.notDeepEqual(preset, PRESETS.thinFxTightWindows);
  assert.notDeepEqual(preset, PRESETS.longWeekendFridayStart);
  assert.ok(preset.fxDepthAudPerHour > PRESETS.thinFxTightWindows.fxDepthAudPerHour);
  assert.ok(preset.issuerOpenEndHour < DEFAULT_SCENARIO.issuerOpenEndHour);
  assert.notEqual(preset.reserveCashAud, PRESETS.normal.reserveCashAud);
  assert.notEqual(preset.redemptionDemandAud, PRESETS.normal.redemptionDemandAud);
  const result = runSimulation(preset);
  assert.ok(result.timeline[1].settledThisHour > 0);
  assert.equal(result.timeline[2].timeLabel, "Fri 17:00");
  assert.equal(result.timeline[2].issuerOpen, false);
});

test("compressed Friday close is available as a preset button", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  assert.match(html, /data-preset="compressedFridayClose"/);
  assert.match(html, /Compressed Friday close \(synthetic\)/);
});
