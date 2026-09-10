import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import {
  DEFAULT_SCENARIO,
  PRESETS,
  getOperationalStatus,
  runSimulation
} from "../src/model.js";

test("Monday late issuer open keeps the Normal Friday calendar with a one-hour later Monday issuer", () => {
  const preset = PRESETS.mondayLateIssuerOpen;
  assert.match(preset.name, /synthetic/i);
  assert.match(preset.name, /Monday late issuer open/i);
  assert.equal(preset.demandProfile, DEFAULT_SCENARIO.demandProfile);
  assert.equal(preset.mondayHoliday, false);
  assert.equal(preset.saturdayHoliday, false);
  assert.equal(preset.fridayFxLateClose, false);
  assert.equal(preset.issuerOpenStartHour, DEFAULT_SCENARIO.issuerOpenStartHour + 1);
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
  assert.notDeepEqual(preset, PRESETS.fridayLateFxClose);
  const late = runSimulation(preset);
  const normal = runSimulation(DEFAULT_SCENARIO);
  assert.equal(late.timeline[0].timeLabel, "Fri 15:00");
  assert.equal(late.timeline[0].issuerOpen, true);
  assert.equal(normal.timeline[0].issuerOpen, true);
  assert.equal(late.timeline[64].timeLabel, "Mon 07:00");
  assert.equal(late.timeline[64].issuerOpen, false);
  assert.equal(normal.timeline[64].issuerOpen, false);
  assert.equal(late.timeline[65].timeLabel, "Mon 08:00");
  assert.equal(late.timeline[65].issuerOpen, false);
  assert.equal(normal.timeline[65].issuerOpen, true);
  assert.equal(getOperationalStatus(preset, 65).issuerOpen, false);
  assert.equal(getOperationalStatus(DEFAULT_SCENARIO, 65).issuerOpen, true);
  assert.equal(late.timeline[66].timeLabel, "Mon 09:00");
  assert.equal(late.timeline[66].issuerOpen, true);
  assert.equal(normal.timeline[66].issuerOpen, true);
});

test("Monday late issuer open is available as a preset button and is not a live queue", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  assert.match(html, /data-preset="mondayLateIssuerOpen"/);
  assert.match(html, /Monday late issuer open \(synthetic\)/);
  assert.doesNotMatch(html, /live queue/i);
});
