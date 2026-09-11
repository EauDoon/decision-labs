import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import {
  DEFAULT_SCENARIO,
  firstClosedFxHourToMarkdown,
  formatTime,
  lastClosedBankHourToMarkdown,
  lastClosedFxGanttHour,
  lastClosedFxHourToMarkdown,
  lastOpenFxGanttHour,
  lastOpenFxHourToMarkdown,
  lastOpenPayoutGanttHour,
  lastOpenPayoutHourToMarkdown
} from "../src/model.js";

test("last closed FX hour Markdown is one synthetic line with an honest empty", () => {
  const text = lastClosedFxHourToMarkdown(DEFAULT_SCENARIO);
  assert.equal(text, lastClosedFxHourToMarkdown(DEFAULT_SCENARIO));
  assert.equal(text.split("\n").length, 1);
  const hour = lastClosedFxGanttHour(DEFAULT_SCENARIO);
  const openHour = lastOpenFxGanttHour(DEFAULT_SCENARIO);
  const payoutHour = lastOpenPayoutGanttHour(DEFAULT_SCENARIO);
  assert.equal(hour, 56);
  assert.equal(openHour, 71);
  assert.equal(payoutHour, 71);
  assert.equal(formatTime(hour), "Sun 23:00");
  assert.equal(text, "Last closed FX hour: Sun 23:00 (hour 56). Counts of modeled hours, not an FX calendar.");
  assert.match(text, /Counts of modeled hours/);
  assert.match(text, /not an FX calendar/);
  assert.doesNotMatch(text, /timestamp|createdAt|exportedAt/i);
  assert.notEqual(text, lastOpenFxHourToMarkdown(DEFAULT_SCENARIO));
  assert.notEqual(text, lastOpenPayoutHourToMarkdown(DEFAULT_SCENARIO));
  assert.notEqual(text, firstClosedFxHourToMarkdown(DEFAULT_SCENARIO));
  assert.notEqual(text, lastClosedBankHourToMarkdown(DEFAULT_SCENARIO));
  const mondayHoliday = {
    ...DEFAULT_SCENARIO,
    mondayHoliday: true
  };
  const fxHour = lastClosedFxGanttHour(mondayHoliday);
  assert.equal(fxHour, 71);
  assert.equal(formatTime(fxHour), "Mon 14:00");
  const fxText = lastClosedFxHourToMarkdown(mondayHoliday);
  assert.equal(fxText, "Last closed FX hour: Mon 14:00 (hour 71). Counts of modeled hours, not an FX calendar.");
  assert.notEqual(fxText, lastOpenFxHourToMarkdown(mondayHoliday));
  assert.notEqual(fxText, lastOpenPayoutHourToMarkdown(mondayHoliday));
  assert.notEqual(fxText, firstClosedFxHourToMarkdown(mondayHoliday));
  assert.notEqual(lastClosedFxGanttHour(mondayHoliday), lastOpenFxGanttHour(mondayHoliday));
  assert.notEqual(lastClosedFxGanttHour(mondayHoliday), lastOpenPayoutGanttHour(mondayHoliday));
});

test("last closed FX hour Markdown uses none when no modeled hour is closed", async () => {
  const model = await readFile(new URL("../src/model.js", import.meta.url), "utf8");
  const start = model.indexOf("export function lastClosedFxHourToMarkdown");
  const next = model.indexOf("export function ", start + 1);
  const body = model.slice(start, next === -1 ? undefined : next);
  assert.match(body, /hour === null/);
  assert.match(body, /Last closed FX hour: none\. Counts of modeled hours, not an FX calendar\./);
  const empty = "Last closed FX hour: none. Counts of modeled hours, not an FX calendar.";
  assert.equal(empty.split("\n").length, 1);
  assert.doesNotMatch(empty, /timestamp|createdAt|exportedAt/i);
  assert.notEqual(empty, lastOpenFxHourToMarkdown(DEFAULT_SCENARIO));
  assert.notEqual(empty, lastOpenPayoutHourToMarkdown(DEFAULT_SCENARIO));
  assert.notEqual(empty, firstClosedFxHourToMarkdown(DEFAULT_SCENARIO));
  assert.doesNotMatch(model, /Date\.now/);
});

test("copy last closed FX hour uses clipboard and a textarea fallback", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  const app = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
  assert.match(html, /id="copy-last-closed-fx"/);
  assert.match(html, /Copy last closed FX hour/);
  assert.match(html, /id="last-closed-fx-copy-fallback"/);
  assert.match(html, /id="copy-last-open-fx"/);
  assert.match(html, /id="copy-last-open-payout"/);
  assert.match(html, /id="copy-first-closed-fx"/);
  assert.match(app, /lastClosedFxHourToMarkdown\(scenario\)/);
  assert.match(app, /last-closed-fx-copy-fallback/);
  assert.match(app, /copyTextWithFallback/);
  assert.match(app, /local drawing, not a live FX feed/);
  assert.match(app, /Clipboard unavailable\. Copy the Markdown from the text box\./);
  assert.notEqual(app.match(/function copyLastClosedFxHourMarkdown/)?.[0], app.match(/function copyLastOpenFxHourMarkdown/)?.[0]);
  assert.notEqual(app.match(/function copyLastClosedFxHourMarkdown/)?.[0], app.match(/function copyLastOpenPayoutHourMarkdown/)?.[0]);
  assert.notEqual(app.match(/function copyLastClosedFxHourMarkdown/)?.[0], app.match(/function copyFirstClosedFxHourMarkdown/)?.[0]);
});
