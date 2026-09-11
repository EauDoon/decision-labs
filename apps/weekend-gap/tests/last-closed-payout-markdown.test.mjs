import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import {
  DEFAULT_SCENARIO,
  firstClosedPayoutHourToMarkdown,
  formatTime,
  lastClosedFxGanttHour,
  lastClosedFxHourToMarkdown,
  lastClosedPayoutGanttHour,
  lastClosedPayoutHourToMarkdown,
  lastOpenPayoutGanttHour,
  lastOpenPayoutHourToMarkdown
} from "../src/model.js";

test("last closed payout hour Markdown is one synthetic line with an honest empty", () => {
  const text = lastClosedPayoutHourToMarkdown(DEFAULT_SCENARIO);
  assert.equal(text, lastClosedPayoutHourToMarkdown(DEFAULT_SCENARIO));
  assert.equal(text.split("\n").length, 1);
  const hour = lastClosedPayoutGanttHour(DEFAULT_SCENARIO);
  const openHour = lastOpenPayoutGanttHour(DEFAULT_SCENARIO);
  const fxHour = lastClosedFxGanttHour(DEFAULT_SCENARIO);
  assert.equal(hour, 64);
  assert.equal(openHour, 71);
  assert.equal(fxHour, 56);
  assert.equal(formatTime(hour), "Mon 07:00");
  assert.equal(text, "Last closed payout hour: Mon 07:00 (hour 64). Counts of modeled hours, not a payout calendar.");
  assert.match(text, /Counts of modeled hours/);
  assert.match(text, /not a payout calendar/);
  assert.doesNotMatch(text, /timestamp|createdAt|exportedAt/i);
  assert.notEqual(text, lastOpenPayoutHourToMarkdown(DEFAULT_SCENARIO));
  assert.notEqual(text, lastClosedFxHourToMarkdown(DEFAULT_SCENARIO));
  assert.notEqual(text, firstClosedPayoutHourToMarkdown(DEFAULT_SCENARIO));
  const earlierPayout = {
    ...DEFAULT_SCENARIO,
    payoutOpenEndHour: 14
  };
  const payoutHour = lastClosedPayoutGanttHour(earlierPayout);
  assert.equal(payoutHour, 71);
  assert.equal(formatTime(payoutHour), "Mon 14:00");
  const payoutText = lastClosedPayoutHourToMarkdown(earlierPayout);
  assert.equal(payoutText, "Last closed payout hour: Mon 14:00 (hour 71). Counts of modeled hours, not a payout calendar.");
  assert.notEqual(payoutText, lastOpenPayoutHourToMarkdown(earlierPayout));
  assert.notEqual(payoutText, lastClosedFxHourToMarkdown(earlierPayout));
  assert.notEqual(payoutText, firstClosedPayoutHourToMarkdown(earlierPayout));
  assert.notEqual(lastClosedPayoutGanttHour(earlierPayout), lastOpenPayoutGanttHour(earlierPayout));
  assert.notEqual(lastClosedPayoutGanttHour(earlierPayout), lastClosedFxGanttHour(earlierPayout));
});

test("last closed payout hour Markdown uses none when no modeled hour is closed", async () => {
  const model = await readFile(new URL("../src/model.js", import.meta.url), "utf8");
  const start = model.indexOf("export function lastClosedPayoutHourToMarkdown");
  const next = model.indexOf("export function ", start + 1);
  const body = model.slice(start, next === -1 ? undefined : next);
  assert.match(body, /hour === null/);
  assert.match(body, /Last closed payout hour: none\. Counts of modeled hours, not a payout calendar\./);
  const empty = "Last closed payout hour: none. Counts of modeled hours, not a payout calendar.";
  assert.equal(empty.split("\n").length, 1);
  assert.doesNotMatch(empty, /timestamp|createdAt|exportedAt/i);
  assert.notEqual(empty, lastOpenPayoutHourToMarkdown(DEFAULT_SCENARIO));
  assert.notEqual(empty, lastClosedFxHourToMarkdown(DEFAULT_SCENARIO));
  assert.notEqual(empty, firstClosedPayoutHourToMarkdown(DEFAULT_SCENARIO));
  assert.doesNotMatch(model, /Date\.now/);
});

test("copy last closed payout hour uses clipboard and a textarea fallback", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  const app = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
  assert.match(html, /id="copy-last-closed-payout"/);
  assert.match(html, /Copy last closed payout hour/);
  assert.match(html, /id="last-closed-payout-copy-fallback"/);
  assert.match(html, /id="copy-last-closed-fx"/);
  assert.match(html, /id="copy-last-open-payout"/);
  assert.match(html, /id="copy-first-closed-payout"/);
  assert.match(app, /lastClosedPayoutHourToMarkdown\(scenario\)/);
  assert.match(app, /last-closed-payout-copy-fallback/);
  assert.match(app, /copyTextWithFallback/);
  assert.match(app, /synthetic label, not live payout data/);
  assert.match(app, /Clipboard unavailable\. Copy the Markdown from the text box\./);
  assert.notEqual(app.match(/function copyLastClosedPayoutHourMarkdown/)?.[0], app.match(/function copyLastClosedFxHourMarkdown/)?.[0]);
  assert.notEqual(app.match(/function copyLastClosedPayoutHourMarkdown/)?.[0], app.match(/function copyLastOpenPayoutHourMarkdown/)?.[0]);
  assert.notEqual(app.match(/function copyLastClosedPayoutHourMarkdown/)?.[0], app.match(/function copyFirstClosedPayoutHourMarkdown/)?.[0]);
});
