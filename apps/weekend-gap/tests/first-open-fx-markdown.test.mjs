import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import {
  DEFAULT_SCENARIO,
  firstClosedFxHourToMarkdown,
  firstClosedPayoutHourToMarkdown,
  firstOpenBankHourToMarkdown,
  firstOpenFxGanttHour,
  firstOpenFxHourToMarkdown,
  firstOpenPayoutHourToMarkdown,
  formatTime
} from "../src/model.js";

test("first open FX hour Markdown is one synthetic line with an honest empty", () => {
  const text = firstOpenFxHourToMarkdown(DEFAULT_SCENARIO);
  assert.equal(text, firstOpenFxHourToMarkdown(DEFAULT_SCENARIO));
  assert.equal(text.split("\n").length, 1);
  const hour = firstOpenFxGanttHour(DEFAULT_SCENARIO);
  assert.equal(hour, 0);
  assert.equal(formatTime(hour), "Fri 15:00");
  assert.equal(text, "First open FX hour: Fri 15:00 (hour 0). Counts of modeled hours, not a bank calendar.");
  assert.match(text, /Counts of modeled hours/);
  assert.match(text, /not a bank calendar/);
  assert.doesNotMatch(text, /timestamp|createdAt|exportedAt/i);
  assert.notEqual(text, firstOpenPayoutHourToMarkdown(DEFAULT_SCENARIO));
  assert.notEqual(text, firstClosedFxHourToMarkdown(DEFAULT_SCENARIO));
  assert.notEqual(text, firstClosedPayoutHourToMarkdown(DEFAULT_SCENARIO));
  assert.notEqual(text, firstOpenBankHourToMarkdown(DEFAULT_SCENARIO));
  const laterPayout = {
    ...DEFAULT_SCENARIO,
    payoutOpenStartHour: 16
  };
  const fxHour = firstOpenFxGanttHour(laterPayout);
  assert.equal(fxHour, 0);
  const fxText = firstOpenFxHourToMarkdown(laterPayout);
  assert.equal(fxText, "First open FX hour: Fri 15:00 (hour 0). Counts of modeled hours, not a bank calendar.");
  assert.notEqual(fxText, firstOpenPayoutHourToMarkdown(laterPayout));
});

test("first open FX hour Markdown uses none when no modeled hour is open", async () => {
  const model = await readFile(new URL("../src/model.js", import.meta.url), "utf8");
  const start = model.indexOf("export function firstOpenFxHourToMarkdown");
  const next = model.indexOf("export function ", start + 1);
  const body = model.slice(start, next);
  assert.match(body, /hour === null/);
  assert.match(body, /First open FX hour: none\. Counts of modeled hours, not a bank calendar\./);
  const empty = "First open FX hour: none. Counts of modeled hours, not a bank calendar.";
  assert.equal(empty.split("\n").length, 1);
  assert.doesNotMatch(empty, /timestamp|createdAt|exportedAt/i);
});

test("copy first open FX hour uses clipboard and a textarea fallback", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  const app = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
  assert.match(html, /id="copy-first-open-fx"/);
  assert.match(html, /Copy first open FX hour/);
  assert.match(html, /id="first-open-fx-copy-fallback"/);
  assert.match(html, /id="copy-first-open-payout"/);
  assert.match(html, /id="copy-first-closed-fx"/);
  assert.match(html, /id="copy-first-closed-payout"/);
  assert.match(app, /firstOpenFxHourToMarkdown\(scenario\)/);
  assert.match(app, /first-open-fx-copy-fallback/);
  assert.match(app, /copyTextWithFallback/);
  assert.match(app, /local drawing, not a live FX feed/);
  assert.match(app, /Clipboard unavailable\. Copy the Markdown from the text box\./);
  assert.notEqual(app.match(/function copyFirstOpenFxHourMarkdown/)?.[0], app.match(/function copyFirstOpenPayoutHourMarkdown/)?.[0]);
  assert.notEqual(app.match(/function copyFirstOpenFxHourMarkdown/)?.[0], app.match(/function copyFirstClosedFxHourMarkdown/)?.[0]);
  assert.notEqual(app.match(/function copyFirstOpenFxHourMarkdown/)?.[0], app.match(/function copyFirstClosedPayoutHourMarkdown/)?.[0]);
});
