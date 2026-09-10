import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import { DEFAULT_SCENARIO, attributeBottlenecks, bottleneckCountsToMarkdown } from "../src/model.js";

test("limiting-gate Markdown copies observation counts and denies causal ranking", () => {
  const text = bottleneckCountsToMarkdown(DEFAULT_SCENARIO);
  assert.equal(text, bottleneckCountsToMarkdown(DEFAULT_SCENARIO));
  const attribution = attributeBottlenecks(DEFAULT_SCENARIO);
  assert.match(text, /Observation counts/);
  assert.match(text, /Not a causal ranking/);
  assert.match(text, /\| Limiter \| Hours \| Share of 72h \|/);
  const bank = attribution.rows.find((row) => row.label === "bank");
  assert.match(text, new RegExp("\\| bank \\| " + bank.hours + " \\|"));
  const none = attribution.rows.find((row) => row.label === "none");
  assert.match(text, new RegExp("\\| none \\| " + none.hours + " \\|"));
  const total = attribution.rows.reduce((sum, row) => sum + row.hours, 0);
  assert.equal(total, 72);
  assert.doesNotMatch(text, /timestamp|createdAt|exportedAt/i);
});

test("copy limiting-gate counts uses clipboard and a textarea fallback", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  const app = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
  assert.match(html, /id="copy-bottleneck-markdown"/);
  assert.match(html, /Copy limiting-gate counts/);
  assert.match(html, /id="bottleneck-copy-fallback"/);
  assert.match(app, /bottleneckCountsToMarkdown\(scenario\)/);
  assert.match(app, /observation counts, not a causal ranking/);
});
