import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import { DEFAULT_SCENARIO, PRESETS, analysisToJSON } from "../src/model.js";

const TIMESTAMP_KEYS = ["timestamp", "createdAt", "exportedAt", "generatedAt", "created_at", "exported_at"];

test("analysis JSON remains timestamp-free for identical inputs", () => {
  const output = analysisToJSON(DEFAULT_SCENARIO, PRESETS.weekendRush, 80, 70);
  assert.equal(output, analysisToJSON(DEFAULT_SCENARIO, PRESETS.weekendRush, 80, 70));
  const report = JSON.parse(output);
  for (const key of TIMESTAMP_KEYS) {
    assert.equal(Object.prototype.hasOwnProperty.call(report, key), false, `analysis JSON must not include ${key}`);
  }
  assert.doesNotMatch(output, /"timestamp"\s*:/);
  assert.doesNotMatch(output, /"createdAt"\s*:/);
  assert.doesNotMatch(output, /"exportedAt"\s*:/);
  assert.doesNotMatch(output, /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
});

test("analysisToJSON does not call the clock", async () => {
  const model = await readFile(new URL("../src/model.js", import.meta.url), "utf8");
  const start = model.indexOf("export function analysisToJSON");
  const next = model.indexOf("export function ", start + 1);
  const body = model.slice(start, next);
  assert.doesNotMatch(body, /Date\.now|new Date|toISOString|performance\.now/);
  assert.doesNotMatch(model, /Date\.now|Math\.random|fetch\(|XMLHttpRequest/);
  const app = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
  assert.match(app, /analysisToJSON\(baselineScenario, scenario/);
});
