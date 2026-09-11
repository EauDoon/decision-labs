import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import {
  DEFAULT_SCENARIO,
  firstClosedFxHourToMarkdown,
  formatTime,
  lastClosedFxGanttHour,
  lastClosedFxHourToMarkdown,
  lastClosedPayoutGanttHour,
  lastClosedPayoutHourToMarkdown,
  lastWeekendFxClosedGanttHour,
  lastWeekendFxClosedHourToMarkdown,
  lastWeekdayFxClosedGanttHour,
  lastWeekdayFxClosedHourToMarkdown
} from "../src/model.js";

test("last weekday-FX-closed hour Markdown is one synthetic line with an honest empty", () => {
  const text = lastWeekdayFxClosedHourToMarkdown(DEFAULT_SCENARIO);
  assert.equal(text, lastWeekdayFxClosedHourToMarkdown(DEFAULT_SCENARIO));
  assert.equal(text.split("\n").length, 1);
  const hour = lastWeekdayFxClosedGanttHour(DEFAULT_SCENARIO);
  const weekendHour = lastWeekendFxClosedGanttHour(DEFAULT_SCENARIO);
  const fxHour = lastClosedFxGanttHour(DEFAULT_SCENARIO);
  const payoutHour = lastClosedPayoutGanttHour(DEFAULT_SCENARIO);
  assert.equal(hour, null);
  assert.equal(weekendHour, 56);
  assert.equal(fxHour, 56);
  assert.equal(payoutHour, 64);
  assert.equal(text, "Last weekday-FX-closed hour: none. Counts of modeled hours, not an FX calendar.");
  assert.match(text, /Counts of modeled hours/);
  assert.match(text, /not an FX calendar/);
  assert.doesNotMatch(text, /timestamp|createdAt|exportedAt/i);
  assert.notEqual(text, lastWeekendFxClosedHourToMarkdown(DEFAULT_SCENARIO));
  assert.notEqual(text, lastClosedFxHourToMarkdown(DEFAULT_SCENARIO));
  assert.notEqual(text, lastClosedPayoutHourToMarkdown(DEFAULT_SCENARIO));
  assert.notEqual(text, firstClosedFxHourToMarkdown(DEFAULT_SCENARIO));
  const mondayHoliday = {
    ...DEFAULT_SCENARIO,
    mondayHoliday: true
  };
  const weekdayHour = lastWeekdayFxClosedGanttHour(mondayHoliday);
  const weekendClosedHour = lastWeekendFxClosedGanttHour(mondayHoliday);
  const closedFxHour = lastClosedFxGanttHour(mondayHoliday);
  assert.equal(weekdayHour, 71);
  assert.equal(weekendClosedHour, 56);
  assert.equal(closedFxHour, 71);
  assert.equal(formatTime(weekdayHour), "Mon 14:00");
  const weekdayText = lastWeekdayFxClosedHourToMarkdown(mondayHoliday);
  assert.equal(weekdayText, "Last weekday-FX-closed hour: Mon 14:00 (hour 71). Counts of modeled hours, not an FX calendar.");
  assert.notEqual(weekdayText, lastWeekendFxClosedHourToMarkdown(mondayHoliday));
  assert.notEqual(weekdayText, lastClosedFxHourToMarkdown(mondayHoliday));
  assert.notEqual(weekdayText, lastClosedPayoutHourToMarkdown(mondayHoliday));
  assert.notEqual(lastWeekdayFxClosedGanttHour(mondayHoliday), lastWeekendFxClosedGanttHour(mondayHoliday));
  assert.notEqual(lastWeekdayFxClosedHourToMarkdown(mondayHoliday), lastClosedFxHourToMarkdown(mondayHoliday));
  assert.notEqual(lastWeekdayFxClosedHourToMarkdown(mondayHoliday), lastClosedPayoutHourToMarkdown(mondayHoliday));
});

test("last weekday-FX-closed hour Markdown uses none when no modeled hour is closed", async () => {
  const model = await readFile(new URL("../src/model.js", import.meta.url), "utf8");
  const start = model.indexOf("export function lastWeekdayFxClosedHourToMarkdown");
  const next = model.indexOf("export function ", start + 1);
  const body = model.slice(start, next === -1 ? undefined : next);
  assert.match(body, /hour === null/);
  assert.match(body, /Last weekday-FX-closed hour: none\. Counts of modeled hours, not an FX calendar\./);
  const empty = "Last weekday-FX-closed hour: none. Counts of modeled hours, not an FX calendar.";
  assert.equal(empty.split("\n").length, 1);
  assert.doesNotMatch(empty, /timestamp|createdAt|exportedAt/i);
  assert.notEqual(empty, lastWeekendFxClosedHourToMarkdown(DEFAULT_SCENARIO));
  assert.notEqual(empty, lastClosedFxHourToMarkdown(DEFAULT_SCENARIO));
  assert.notEqual(empty, lastClosedPayoutHourToMarkdown(DEFAULT_SCENARIO));
  assert.notEqual(empty, firstClosedFxHourToMarkdown(DEFAULT_SCENARIO));
  assert.doesNotMatch(model, /Date\.now/);
});

test("copy last weekday-FX-closed hour uses clipboard and a textarea fallback", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  const app = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
  assert.match(html, /id="copy-last-weekday-fx-closed"/);
  assert.match(html, /Copy last weekday-FX-closed hour/);
  assert.match(html, /id="last-weekday-fx-closed-copy-fallback"/);
  assert.match(html, /id="copy-last-weekend-fx-closed"/);
  assert.match(html, /id="copy-last-closed-fx"/);
  assert.match(html, /id="copy-last-closed-payout"/);
  assert.match(app, /lastWeekdayFxClosedHourToMarkdown\(scenario\)/);
  assert.match(app, /last-weekday-fx-closed-copy-fallback/);
  assert.match(app, /copyTextWithFallback/);
  assert.match(app, /local drawing, not a live FX feed/);
  assert.match(app, /Clipboard unavailable\. Copy the Markdown from the text box\./);
  assert.notEqual(app.match(/function copyLastWeekdayFxClosedHourMarkdown/)?.[0], app.match(/function copyLastWeekendFxClosedHourMarkdown/)?.[0]);
  assert.notEqual(app.match(/function copyLastWeekdayFxClosedHourMarkdown/)?.[0], app.match(/function copyLastClosedFxHourMarkdown/)?.[0]);
  assert.notEqual(app.match(/function copyLastWeekdayFxClosedHourMarkdown/)?.[0], app.match(/function copyLastClosedPayoutHourMarkdown/)?.[0]);
});
