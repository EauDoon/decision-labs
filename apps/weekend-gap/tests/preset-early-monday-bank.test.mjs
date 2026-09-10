import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import {
  DEFAULT_SCENARIO,
  PRESETS,
  getOperationalStatus,
  runSimulation
} from "../src/model.js";

test("Early Monday bank open keeps the Normal Friday calendar with a one-hour earlier Monday bank", () => {
  const preset = PRESETS.earlyMondayBankOpen;
  assert.match(preset.name, /synthetic/i);
  assert.match(preset.name, /Early Monday bank open/i);
  assert.equal(preset.demandProfile, DEFAULT_SCENARIO.demandProfile);
  assert.equal(preset.mondayHoliday, false);
  assert.equal(preset.saturdayHoliday, false);
  assert.equal(preset.issuerOpenStartHour, DEFAULT_SCENARIO.issuerOpenStartHour);
  assert.equal(preset.issuerOpenEndHour, DEFAULT_SCENARIO.issuerOpenEndHour);
  assert.equal(preset.bankOpenStartHour, DEFAULT_SCENARIO.bankOpenStartHour - 1);
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
  const early = runSimulation(preset);
  const normal = runSimulation(DEFAULT_SCENARIO);
  assert.equal(early.timeline[1].timeLabel, "Fri 16:00");
  assert.equal(early.timeline[1].bankOpen, true);
  assert.equal(normal.timeline[1].bankOpen, true);
  assert.equal(early.timeline[2].bankOpen, false);
  assert.equal(normal.timeline[2].bankOpen, false);
  assert.equal(early.timeline[64].timeLabel, "Mon 07:00");
  assert.equal(early.timeline[64].bankOpen, true);
  assert.equal(normal.timeline[64].bankOpen, false);
  assert.equal(getOperationalStatus(preset, 64).bankOpen, true);
  assert.equal(getOperationalStatus(DEFAULT_SCENARIO, 64).bankOpen, false);
  assert.equal(early.timeline[65].timeLabel, "Mon 08:00");
  assert.equal(early.timeline[65].bankOpen, true);
  assert.equal(normal.timeline[65].bankOpen, true);
});

test("Early Monday bank open is available as a preset button and is not a live queue", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  assert.match(html, /data-preset="earlyMondayBankOpen"/);
  assert.match(html, /Early Monday bank open \(synthetic\)/);
  assert.doesNotMatch(html, /live queue/i);
});
