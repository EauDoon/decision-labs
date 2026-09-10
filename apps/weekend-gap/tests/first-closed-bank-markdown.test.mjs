import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import {
  DEFAULT_SCENARIO,
  firstClosedBankHourToMarkdown,
  firstClosedFxHourToMarkdown,
  firstClosedGanttHour,
  firstClosedFxGanttHour,
  formatTime
} from "../src/model.js";

test("first closed bank hour Markdown is one synthetic line with an honest empty", () => {
  const text = firstClosedBankHourToMarkdown(DEFAULT_SCENARIO);
  assert.equal(text, firstClosedBankHourToMarkdown(DEFAULT_SCENARIO));
  assert.equal(text.split("\n").length, 1);
  const hour = firstClosedGanttHour(DEFAULT_SCENARIO);
  assert.equal(hour, 2);
  assert.equal(formatTime(hour), "Fri 17:00");
  assert.equal(text, "First closed bank hour: Fri 17:00 (hour 2). Counts of modeled hours, not a bank calendar.");
  assert.match(text, /Counts of modeled hours/);
  assert.match(text, /not a bank calendar/);
  assert.doesNotMatch(text, /timestamp|createdAt|exportedAt/i);
  assert.notEqual(text, firstClosedFxHourToMarkdown(DEFAULT_SCENARIO));
  assert.notEqual(hour, firstClosedFxGanttHour(DEFAULT_SCENARIO));
});

test("first closed bank hour Markdown uses none when no modeled hour is closed", async () => {
  const model = await readFile(new URL("../src/model.js", import.meta.url), "utf8");
  const start = model.indexOf("export function firstClosedBankHourToMarkdown");
  const next = model.indexOf("export function ", start + 1);
  const body = model.slice(start, next);
  assert.match(body, /hour === null/);
  assert.match(body, /First closed bank hour: none\. Counts of modeled hours, not a bank calendar\./);
  const empty = "First closed bank hour: none. Counts of modeled hours, not a bank calendar.";
  assert.equal(empty.split("\n").length, 1);
  assert.doesNotMatch(empty, /timestamp|createdAt|exportedAt/i);
  assert.notEqual(empty, firstClosedFxHourToMarkdown(DEFAULT_SCENARIO));
});

test("copy first closed bank hour uses clipboard and a textarea fallback", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  const app = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
  assert.match(html, /id="copy-first-closed-bank"/);
  assert.match(html, /Copy first closed bank hour/);
  assert.match(html, /id="first-closed-bank-copy-fallback"/);
  assert.match(html, /id="copy-first-closed-fx"/);
  assert.match(app, /firstClosedBankHourToMarkdown\(scenario\)/);
  assert.match(app, /first-closed-bank-copy-fallback/);
  assert.match(app, /copyTextWithFallback/);
  assert.match(app, /counts of modeled hours, not a bank calendar/);
  assert.match(app, /Clipboard unavailable\. Copy the Markdown from the text box\./);
  assert.notEqual(app.match(/function copyFirstClosedBankHourMarkdown/)?.[0], app.match(/function copyFirstClosedFxHourMarkdown/)?.[0]);
});
