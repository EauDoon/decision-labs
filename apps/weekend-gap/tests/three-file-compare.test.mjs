import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import {
  DEFAULT_SCENARIO,
  PRESETS,
  analysisToJSON,
  compareThreeScenarioFiles,
  scenarioToJSON
} from "../src/model.js";

test("three-file compare reports side-by-side summaries without loading a scenario", () => {
  const baseline = scenarioToJSON(DEFAULT_SCENARIO);
  const current = scenarioToJSON(PRESETS.weekendRush);
  const imported = scenarioToJSON(PRESETS.marketStress);
  const result = compareThreeScenarioFiles(baseline, current, imported);
  assert.equal(result.errors.length, 0);
  assert.equal(result.runs.length, 3);
  assert.deepEqual(result.runs.map((run) => run.role), ["baseline", "current", "imported"]);
  assert.equal(result.runs[0].name, DEFAULT_SCENARIO.name);
  assert.equal(result.runs[1].name, PRESETS.weekendRush.name);
  assert.equal(result.runs[2].name, PRESETS.marketStress.name);
  assert.equal(typeof result.runs[0].hoursToFirstSettlement, "number");
  assert.equal(typeof result.runs[0].peakQueueHour, "number");
});

test("three-file compare keeps honest nulls when a run never queues or never settles", () => {
  const baseline = scenarioToJSON(DEFAULT_SCENARIO);
  const neverSettles = scenarioToJSON({ ...DEFAULT_SCENARIO, payoutThroughputAudPerHour: 0, name: "Closed payout" });
  const neverQueues = scenarioToJSON({ ...DEFAULT_SCENARIO, redemptionDemandAud: 0, name: "No demand" });
  const result = compareThreeScenarioFiles(baseline, neverSettles, neverQueues);
  assert.equal(result.runs[1].hoursToFirstSettlement, null);
  assert.equal(result.runs[1].hoursToClearQueue, null);
  assert.ok(result.runs[1].peakQueuedAud > 0);
  assert.equal(result.runs[2].peakQueuedAud, 0);
  assert.equal(result.runs[2].peakQueueHour, null);
  assert.equal(result.runs[2].hoursToClearQueue, null);
  assert.equal(result.runs[2].hoursToFirstSettlement, null);
});

test("three-file compare rejects analysis reports and malformed JSON", () => {
  const scenario = scenarioToJSON(DEFAULT_SCENARIO);
  const analysis = analysisToJSON(DEFAULT_SCENARIO, PRESETS.weekendRush);
  const rejected = compareThreeScenarioFiles(scenario, scenario, analysis);
  assert.equal(rejected.runs, null);
  assert.ok(rejected.errors.some((error) => /analysis/i.test(error)));
  const missing = compareThreeScenarioFiles(scenario, scenario, "{");
  assert.equal(missing.runs, null);
  assert.ok(missing.errors.length > 0);
});

test("three-file compare controls do not replace the open scenario", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  const app = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
  assert.match(html, /id="compare-file-baseline"/);
  assert.match(html, /id="compare-file-current"/);
  assert.match(html, /id="compare-file-imported"/);
  assert.match(html, /id="compare-three-scenario-files"/);
  assert.match(html, /does not replace the open scenario/);
  assert.match(app, /compareThreeScenarioFiles/);
  assert.match(app, /The open scenario was not replaced/);
  const start = app.indexOf('document.querySelector("#compare-three-scenario-files")');
  const end = app.indexOf("function clearWindowShiftPreview", start);
  assert.doesNotMatch(app.slice(start, end), /setScenario\(/);
});
