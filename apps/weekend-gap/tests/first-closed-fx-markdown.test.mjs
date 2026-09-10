import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import {
  DEFAULT_SCENARIO,
  firstClosedFxGanttHour,
  firstClosedFxHourToMarkdown,
  formatTime,
  fxGanttHoursToMarkdown,
  weekendFxHourCountsToMarkdown
} from "../src/model.js";

test("first closed FX hour Markdown is one synthetic line with an honest empty", () => {
  const text = firstClosedFxHourToMarkdown(DEFAULT_SCENARIO);
  assert.equal(text, firstClosedFxHourToMarkdown(DEFAULT_SCENARIO));
  assert.equal(text.split("\n").length, 1);
  const hour = firstClosedFxGanttHour(DEFAULT_SCENARIO);
  assert.equal(hour, 9);
  assert.equal(formatTime(hour), "Sat 00:00");
  assert.equal(text, "First closed FX hour: Sat 00:00 (hour 9). Counts of modeled hours, not a bank calendar.");
  assert.match(text, /Counts of modeled hours/);
  assert.match(text, /not a bank calendar/);
  assert.doesNotMatch(text, /timestamp|createdAt|exportedAt/i);
  assert.notEqual(text, fxGanttHoursToMarkdown(DEFAULT_SCENARIO));
  assert.notEqual(text, weekendFxHourCountsToMarkdown(DEFAULT_SCENARIO));
});

test("first closed FX hour Markdown uses none when no modeled hour is closed", async () => {
  const model = await readFile(new URL("../src/model.js", import.meta.url), "utf8");
  const start = model.indexOf("export function firstClosedFxHourToMarkdown");
  const next = model.indexOf("export function ", start + 1);
  const body = model.slice(start, next);
  assert.match(body, /hour === null/);
  assert.match(body, /First closed FX hour: none\. Counts of modeled hours, not a bank calendar\./);
  const empty = "First closed FX hour: none. Counts of modeled hours, not a bank calendar.";
  assert.equal(empty.split("\n").length, 1);
  assert.doesNotMatch(empty, /timestamp|createdAt|exportedAt/i);
});

test("copy first closed FX hour uses clipboard and a textarea fallback", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  const app = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
  assert.match(html, /id="copy-first-closed-fx"/);
  assert.match(html, /Copy first closed FX hour/);
  assert.match(html, /id="first-closed-fx-copy-fallback"/);
  assert.match(app, /firstClosedFxHourToMarkdown\(scenario\)/);
  assert.match(app, /first-closed-fx-copy-fallback/);
  assert.match(app, /copyTextWithFallback/);
  assert.match(app, /counts of modeled hours, not a bank calendar/);
  assert.match(app, /Clipboard unavailable\. Copy the Markdown from the text box\./);
});
