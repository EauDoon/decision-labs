import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import {
  DEFAULT_SCENARIO,
  hoursToClearQueueToMarkdown,
  remainingReserveAtHourToMarkdown,
  runSimulation,
  selectedGanttHourToMarkdown
} from "../src/model.js";

test("remaining reserve Markdown is one synthetic line at the selected hour", () => {
  const text = remainingReserveAtHourToMarkdown(DEFAULT_SCENARIO, 0);
  assert.equal(text, remainingReserveAtHourToMarkdown(DEFAULT_SCENARIO, 0));
  assert.equal(text.split("\n").length, 1);
  const point = runSimulation(DEFAULT_SCENARIO).timeline[0];
  assert.match(text, new RegExp("^Remaining reserve: " + point.reserveRemainingAud + " AUD\\. Queued AUD: " + point.queuedAud + "\\. Hour: Fri 15:00 \\(hour 0\\)\\. "));
  assert.match(text, /Synthetic educational snapshot/);
  assert.match(text, /not live market data/);
  assert.doesNotMatch(text, /timestamp|createdAt|exportedAt/i);
  assert.notEqual(text, hoursToClearQueueToMarkdown(DEFAULT_SCENARIO));
  assert.notEqual(text, selectedGanttHourToMarkdown(DEFAULT_SCENARIO, 0));
});

test("remaining reserve Markdown follows the selected Gantt hour", () => {
  const saturday = remainingReserveAtHourToMarkdown(DEFAULT_SCENARIO, 21);
  const point = runSimulation(DEFAULT_SCENARIO).timeline[21];
  assert.equal(saturday.split("\n").length, 1);
  assert.match(saturday, /Hour: Sat 12:00 \(hour 21\)/);
  assert.match(saturday, new RegExp("Remaining reserve: " + point.reserveRemainingAud + " AUD"));
  assert.match(saturday, new RegExp("Queued AUD: " + point.queuedAud));
  assert.ok(point.queuedAud > 0);
  assert.notEqual(saturday, remainingReserveAtHourToMarkdown(DEFAULT_SCENARIO, 0));
});
