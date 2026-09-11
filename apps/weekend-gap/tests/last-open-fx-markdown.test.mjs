import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import {
  DEFAULT_SCENARIO,
  firstOpenFxHourToMarkdown,
  formatTime,
  lastOpenBankGanttHour,
  lastOpenBankHourToMarkdown,
  lastOpenFxGanttHour,
  lastOpenFxHourToMarkdown,
  lastOpenPayoutGanttHour,
  lastOpenPayoutHourToMarkdown
} from "../src/model.js";

test("last open FX hour Markdown is one synthetic line with an honest empty", () => {
  const text = lastOpenFxHourToMarkdown(DEFAULT_SCENARIO);
  assert.equal(text, lastOpenFxHourToMarkdown(DEFAULT_SCENARIO));
  assert.equal(text.split("\n").length, 1);
  const hour = lastOpenFxGanttHour(DEFAULT_SCENARIO);
  const bankHour = lastOpenBankGanttHour(DEFAULT_SCENARIO);
  const payoutHour = lastOpenPayoutGanttHour(DEFAULT_SCENARIO);
  assert.equal(hour, 71);
  assert.equal(bankHour, 71);
  assert.equal(payoutHour, 71);
  assert.equal(formatTime(hour), "Mon 14:00");
  assert.equal(text, "Last open FX hour: Mon 14:00 (hour 71). Counts of modeled hours, not an FX calendar.");
  assert.match(text, /Counts of modeled hours/);
  assert.match(text, /not an FX calendar/);
  assert.doesNotMatch(text, /timestamp|createdAt|exportedAt/i);
  assert.notEqual(text, lastOpenBankHourToMarkdown(DEFAULT_SCENARIO));
  assert.notEqual(text, lastOpenPayoutHourToMarkdown(DEFAULT_SCENARIO));
  assert.notEqual(text, firstOpenFxHourToMarkdown(DEFAULT_SCENARIO));
  const mondayHoliday = {
    ...DEFAULT_SCENARIO,
    mondayHoliday: true
  };
  const fxHour = lastOpenFxGanttHour(mondayHoliday);
  assert.equal(fxHour, 8);
  assert.equal(formatTime(fxHour), "Fri 23:00");
  const fxText = lastOpenFxHourToMarkdown(mondayHoliday);
  assert.equal(fxText, "Last open FX hour: Fri 23:00 (hour 8). Counts of modeled hours, not an FX calendar.");
  assert.notEqual(fxText, lastOpenBankHourToMarkdown(mondayHoliday));
  assert.notEqual(fxText, lastOpenPayoutHourToMarkdown(mondayHoliday));
  assert.notEqual(fxText, firstOpenFxHourToMarkdown(mondayHoliday));
  assert.notEqual(lastOpenFxGanttHour(mondayHoliday), lastOpenBankGanttHour(mondayHoliday));
  assert.notEqual(lastOpenFxGanttHour(mondayHoliday), lastOpenPayoutGanttHour(mondayHoliday));
});

test("last open FX hour Markdown uses none when no modeled hour is open", async () => {
  const model = await readFile(new URL("../src/model.js", import.meta.url), "utf8");
  const start = model.indexOf("export function lastOpenFxHourToMarkdown");
  const next = model.indexOf("export function ", start + 1);
  const body = model.slice(start, next === -1 ? undefined : next);
  assert.match(body, /hour === null/);
  assert.match(body, /Last open FX hour: none\. Counts of modeled hours, not an FX calendar\./);
  const empty = "Last open FX hour: none. Counts of modeled hours, not an FX calendar.";
  assert.equal(empty.split("\n").length, 1);
  assert.doesNotMatch(empty, /timestamp|createdAt|exportedAt/i);
  assert.notEqual(empty, lastOpenBankHourToMarkdown(DEFAULT_SCENARIO));
  assert.notEqual(empty, lastOpenPayoutHourToMarkdown(DEFAULT_SCENARIO));
  assert.notEqual(empty, firstOpenFxHourToMarkdown(DEFAULT_SCENARIO));
  assert.doesNotMatch(model, /Date\.now/);
});

test("copy last open FX hour uses clipboard and a textarea fallback", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  const app = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
  assert.match(html, /id="copy-last-open-fx"/);
  assert.match(html, /Copy last open FX hour/);
  assert.match(html, /id="last-open-fx-copy-fallback"/);
  assert.match(html, /id="copy-last-open-bank"/);
  assert.match(html, /id="copy-last-open-payout"/);
  assert.match(html, /id="copy-first-open-fx"/);
  assert.match(app, /lastOpenFxHourToMarkdown\(scenario\)/);
  assert.match(app, /last-open-fx-copy-fallback/);
  assert.match(app, /copyTextWithFallback/);
  assert.match(app, /local drawing, not a live FX feed/);
  assert.match(app, /Clipboard unavailable\. Copy the Markdown from the text box\./);
  assert.notEqual(app.match(/function copyLastOpenFxHourMarkdown/)?.[0], app.match(/function copyLastOpenBankHourMarkdown/)?.[0]);
  assert.notEqual(app.match(/function copyLastOpenFxHourMarkdown/)?.[0], app.match(/function copyLastOpenPayoutHourMarkdown/)?.[0]);
  assert.notEqual(app.match(/function copyLastOpenFxHourMarkdown/)?.[0], app.match(/function copyFirstOpenFxHourMarkdown/)?.[0]);
});
