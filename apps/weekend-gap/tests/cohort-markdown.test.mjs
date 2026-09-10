import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import {
  DEFAULT_SCENARIO,
  arrivalCohortsToMarkdown,
  analyzeWeekendReview,
  runSimulation
} from "../src/model.js";

test("arrival-cohort Markdown lists cohort window, arrivals and remaining without forecasting", () => {
  const text = arrivalCohortsToMarkdown(DEFAULT_SCENARIO);
  assert.equal(text, arrivalCohortsToMarkdown(DEFAULT_SCENARIO));
  assert.match(text, /Synthetic educational ledger/);
  assert.match(text, /Not a forecast/);
  assert.match(text, /\| Cohort window \| Arrivals AUD \| Remaining AUD \|/);
  assert.match(text, /Fri 15:00 \(hour 0\)/);
  assert.match(text, /Mon 14:00 \(hour 71\)/);
  const result = runSimulation(DEFAULT_SCENARIO);
  const review = analyzeWeekendReview(result.scenario, "cohorts");
  const rows = text.split("\n").filter((line) => line.includes("(hour "));
  assert.equal(rows.length, 72);
  assert.equal(review.rows.length, 72);
  const remainingTotal = review.rows.reduce((sum, row) => sum + row[3], 0);
  assert.ok(Math.abs(remainingTotal - result.summary.finalQueuedAud) < 1e-8);
  assert.doesNotMatch(text, /timestamp|createdAt|exportedAt/i);
});

test("copy arrival-cohort table uses clipboard and a textarea fallback", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  const app = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
  assert.match(html, /id="copy-cohort-markdown"/);
  assert.match(html, /Copy arrival-cohort table/);
  assert.match(html, /id="cohort-copy-fallback"/);
  assert.match(app, /arrivalCohortsToMarkdown\(scenario\)/);
  assert.match(app, /cohort-copy-fallback/);
  assert.match(app, /synthetic ledger, not a forecast/);
});
