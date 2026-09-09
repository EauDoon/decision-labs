import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import {
  DEFAULT_SCENARIO,
  PRESETS,
  analysisToJSON,
  compareScenarioFiles,
  scenarioToJSON
} from "../src/model.js";

test("scenario file compare reports queue and settlement diffs", () => {
  const left = scenarioToJSON(DEFAULT_SCENARIO);
  const right = scenarioToJSON(PRESETS.weekendRush);
  const result = compareScenarioFiles(left, right);
  assert.equal(result.errors.length, 0);
  assert.ok(result.comparison);
  assert.equal(typeof result.deltas.peakQueuedAud, "number");
  assert.equal(typeof result.deltas.finalQueuedAud, "number");
  assert.equal(typeof result.deltas.totalSettledAud, "number");
  assert.equal(result.deltas.hoursToFirstSettlement, 0);
  assert.notEqual(result.deltas.peakQueuedAud, 0);
});

test("scenario file compare keeps honest nulls when only one run settles or clears", () => {
  const open = scenarioToJSON(DEFAULT_SCENARIO);
  const closed = scenarioToJSON({ ...DEFAULT_SCENARIO, payoutThroughputAudPerHour: 0 });
  const leftover = scenarioToJSON(PRESETS.marketStress);
  const mixedSettle = compareScenarioFiles(open, closed);
  assert.equal(mixedSettle.comparison.candidate.summary.hoursToFirstSettlement, null);
  assert.equal(mixedSettle.deltas.hoursToFirstSettlement, null);
  const mixedClear = compareScenarioFiles(open, leftover);
  assert.equal(mixedClear.comparison.candidate.summary.hoursToClearQueue, null);
  assert.equal(mixedClear.deltas.hoursToClearQueue, null);
});

test("scenario file compare rejects analysis reports and malformed JSON", () => {
  const scenario = scenarioToJSON(DEFAULT_SCENARIO);
  const analysis = analysisToJSON(DEFAULT_SCENARIO, PRESETS.weekendRush);
  const rejected = compareScenarioFiles(scenario, analysis);
  assert.equal(rejected.comparison, null);
  assert.equal(rejected.deltas, null);
  assert.ok(rejected.errors.some((error) => /analysis/i.test(error)));
  const bad = compareScenarioFiles("{", scenario);
  assert.equal(bad.comparison, null);
  assert.ok(bad.errors.length > 0);
});

test("compare scenario files controls are present", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  const app = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
  assert.match(html, /id="compare-file-a"/);
  assert.match(html, /id="compare-file-b"/);
  assert.match(html, /id="compare-scenario-files"/);
  assert.match(html, /id="file-compare-rows"/);
  assert.match(app, /compareScenarioFiles/);
  assert.match(app, /Not comparable/);
});
