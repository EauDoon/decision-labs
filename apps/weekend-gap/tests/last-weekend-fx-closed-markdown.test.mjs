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
  lastWeekendFxClosedHourToMarkdown
} from "../src/model.js";

test("last weekend-FX-closed hour Markdown is one synthetic line with an honest empty", () => {
  const text = lastWeekendFxClosedHourToMarkdown(DEFAULT_SCENARIO);
  assert.equal(text, lastWeekendFxClosedHourToMarkdown(DEFAULT_SCENARIO));
  assert.equal(text.split("\n").length, 1);
  const hour = lastWeekendFxClosedGanttHour(DEFAULT_SCENARIO);
  const fxHour = lastClosedFxGanttHour(DEFAULT_SCENARIO);
  const payoutHour = lastClosedPayoutGanttHour(DEFAULT_SCENARIO);
  assert.equal(hour, 56);
  assert.equal(fxHour, 56);
  assert.equal(payoutHour, 64);
  assert.equal(formatTime(hour), "Sun 23:00");
  assert.equal(text, "Last weekend-FX-closed hour: Sun 23:00 (hour 56). Counts of modeled hours, not an FX calendar.");
  assert.match(text, /Counts of modeled hours/);
  assert.match(text, /not an FX calendar/);
  assert.doesNotMatch(text, /timestamp|createdAt|exportedAt/i);
  assert.notEqual(text, lastClosedPayoutHourToMarkdown(DEFAULT_SCENARIO));
  assert.notEqual(text, firstClosedFxHourToMarkdown(DEFAULT_SCENARIO));
  const mondayHoliday = {
    ...DEFAULT_SCENARIO,
    mondayHoliday: true
  };
  const weekendHour = lastWeekendFxClosedGanttHour(mondayHoliday);
  const closedFxHour = lastClosedFxGanttHour(mondayHoliday);
  assert.equal(weekendHour, 56);
  assert.equal(closedFxHour, 71);
  assert.equal(formatTime(weekendHour), "Sun 23:00");
  assert.equal(formatTime(closedFxHour), "Mon 14:00");
  const weekendText = lastWeekendFxClosedHourToMarkdown(mondayHoliday);
  assert.equal(weekendText, "Last weekend-FX-closed hour: Sun 23:00 (hour 56). Counts of modeled hours, not an FX calendar.");
  assert.notEqual(weekendText, lastClosedFxHourToMarkdown(mondayHoliday));
  assert.notEqual(weekendText, lastClosedPayoutHourToMarkdown(mondayHoliday));
  assert.notEqual(lastWeekendFxClosedGanttHour(mondayHoliday), lastClosedFxGanttHour(mondayHoliday));
  assert.notEqual(lastWeekendFxClosedGanttHour(mondayHoliday), lastClosedPayoutGanttHour(mondayHoliday));
});

test("last weekend-FX-closed hour Markdown uses none when no modeled hour is closed", async () => {
  const model = await readFile(new URL("../src/model.js", import.meta.url), "utf8");
  const start = model.indexOf("export function lastWeekendFxClosedHourToMarkdown");
  const next = model.indexOf("export function ", start + 1);
  const body = model.slice(start, next === -1 ? undefined : next);
  assert.match(body, /hour === null/);
  assert.match(body, /Last weekend-FX-closed hour: none\. Counts of modeled hours, not an FX calendar\./);
  const empty = "Last weekend-FX-closed hour: none. Counts of modeled hours, not an FX calendar.";
  assert.equal(empty.split("\n").length, 1);
  assert.doesNotMatch(empty, /timestamp|createdAt|exportedAt/i);
  assert.notEqual(empty, lastClosedFxHourToMarkdown(DEFAULT_SCENARIO));
  assert.notEqual(empty, lastClosedPayoutHourToMarkdown(DEFAULT_SCENARIO));
  assert.notEqual(empty, firstClosedFxHourToMarkdown(DEFAULT_SCENARIO));
  assert.doesNotMatch(model, /Date\.now/);
});

test("copy last weekend-FX-closed hour uses clipboard and a textarea fallback", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  const app = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
  assert.match(html, /id="copy-last-weekend-fx-closed"/);
  assert.match(html, /Copy last weekend-FX-closed hour/);
  assert.match(html, /id="last-weekend-fx-closed-copy-fallback"/);
  assert.match(html, /id="copy-last-closed-fx"/);
  assert.match(html, /id="copy-last-closed-payout"/);
  assert.match(app, /lastWeekendFxClosedHourToMarkdown\(scenario\)/);
  assert.match(app, /last-weekend-fx-closed-copy-fallback/);
  assert.match(app, /copyTextWithFallback/);
  assert.match(app, /local drawing, not a live FX feed/);
  assert.match(app, /Clipboard unavailable\. Copy the Markdown from the text box\./);
  assert.notEqual(app.match(/function copyLastWeekendFxClosedHourMarkdown/)?.[0], app.match(/function copyLastClosedFxHourMarkdown/)?.[0]);
  assert.notEqual(app.match(/function copyLastWeekendFxClosedHourMarkdown/)?.[0], app.match(/function copyLastClosedPayoutHourMarkdown/)?.[0]);
  assert.notEqual(app.match(/function copyLastWeekendFxClosedHourMarkdown/)?.[0], app.match(/function copyLastOpenFxHourMarkdown/)?.[0]);
});
