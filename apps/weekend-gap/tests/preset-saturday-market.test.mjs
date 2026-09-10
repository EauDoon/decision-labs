import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import {
  DEFAULT_SCENARIO,
  PRESETS,
  buildDemandSchedule,
  runSimulation
} from "../src/model.js";

test("Saturday market burst preset is a synthetic Saturday redemption burst on the Normal Friday calendar", () => {
  const preset = PRESETS.saturdayMarketBurst;
  assert.match(preset.name, /synthetic/i);
  assert.match(preset.name, /Saturday market burst/i);
  assert.equal(preset.demandProfile, "saturdayBurst");
  assert.equal(preset.mondayHoliday, false);
  assert.equal(preset.saturdayHoliday, false);
  assert.equal(preset.issuerOpenStartHour, DEFAULT_SCENARIO.issuerOpenStartHour);
  assert.equal(preset.issuerOpenEndHour, DEFAULT_SCENARIO.issuerOpenEndHour);
  assert.equal(preset.bankOpenStartHour, DEFAULT_SCENARIO.bankOpenStartHour);
  assert.equal(preset.bankOpenEndHour, DEFAULT_SCENARIO.bankOpenEndHour);
  assert.equal(preset.payoutOpenStartHour, DEFAULT_SCENARIO.payoutOpenStartHour);
  assert.equal(preset.payoutOpenEndHour, DEFAULT_SCENARIO.payoutOpenEndHour);
  assert.ok(preset.redemptionDemandAud > DEFAULT_SCENARIO.redemptionDemandAud);
  assert.notDeepEqual(preset, PRESETS.normal);
  assert.notDeepEqual(preset, PRESETS.paydayFridayBurst);
  assert.notDeepEqual(preset, PRESETS.publicHolidayMonday);
  assert.notDeepEqual(preset, PRESETS.longWeekendFridayStart);
  assert.notDeepEqual(preset, PRESETS.compressedFridayClose);
  const saturday = buildDemandSchedule(preset.redemptionDemandAud, 72, preset.demandProfile);
  const payday = buildDemandSchedule(PRESETS.paydayFridayBurst.redemptionDemandAud, 72, PRESETS.paydayFridayBurst.demandProfile);
  assert.ok(saturday[21] > payday[21]);
  assert.ok(saturday[21] > saturday[0]);
  const result = runSimulation(preset);
  assert.ok(result.timeline[1].settledThisHour > 0);
  assert.equal(result.timeline[1].timeLabel, "Fri 16:00");
  assert.equal(result.timeline[21].timeLabel, "Sat 12:00");
  assert.equal(result.timeline[21].issuerOpen, false);
});

test("Saturday market burst is available as a preset button", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  assert.match(html, /data-preset="saturdayMarketBurst"/);
  assert.match(html, /Saturday market burst \(synthetic\)/);
  assert.match(html, /value="saturdayBurst"/);
});
