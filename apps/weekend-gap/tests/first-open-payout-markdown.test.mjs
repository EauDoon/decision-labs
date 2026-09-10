import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import {
  DEFAULT_SCENARIO,
  firstClosedBankHourToMarkdown,
  firstClosedFxHourToMarkdown,
  firstClosedIssuerHourToMarkdown,
  firstClosedPayoutHourToMarkdown,
  firstOpenPayoutGanttHour,
  firstOpenPayoutHourToMarkdown,
  formatTime
} from "../src/model.js";

test("first open payout hour Markdown is one synthetic line with an honest empty", () => {
  const text = firstOpenPayoutHourToMarkdown(DEFAULT_SCENARIO);
  assert.equal(text, firstOpenPayoutHourToMarkdown(DEFAULT_SCENARIO));
  assert.equal(text.split("\n").length, 1);
  const hour = firstOpenPayoutGanttHour(DEFAULT_SCENARIO);
  assert.equal(hour, 0);
  assert.equal(formatTime(hour), "Fri 15:00");
  assert.equal(text, "First open payout hour: Fri 15:00 (hour 0). Counts of modeled hours, not a bank calendar.");
  assert.match(text, /Counts of modeled hours/);
  assert.match(text, /not a bank calendar/);
  assert.doesNotMatch(text, /timestamp|createdAt|exportedAt/i);
  assert.notEqual(text, firstClosedPayoutHourToMarkdown(DEFAULT_SCENARIO));
  assert.notEqual(text, firstClosedFxHourToMarkdown(DEFAULT_SCENARIO));
  assert.notEqual(text, firstClosedBankHourToMarkdown(DEFAULT_SCENARIO));
  assert.notEqual(text, firstClosedIssuerHourToMarkdown(DEFAULT_SCENARIO));
  const earlierPayout = {
    ...DEFAULT_SCENARIO,
    payoutOpenStartHour: 16
  };
  const payoutHour = firstOpenPayoutGanttHour(earlierPayout);
  assert.equal(payoutHour, 1);
  assert.equal(formatTime(payoutHour), "Fri 16:00");
  const payoutText = firstOpenPayoutHourToMarkdown(earlierPayout);
  assert.equal(payoutText, "First open payout hour: Fri 16:00 (hour 1). Counts of modeled hours, not a bank calendar.");
  assert.notEqual(payoutText, firstClosedPayoutHourToMarkdown(earlierPayout));
});

test("first open payout hour Markdown uses none when no modeled hour is open", async () => {
  const neverOpen = {
    ...DEFAULT_SCENARIO,
    payoutOpenStartHour: 0,
    payoutOpenEndHour: 1,
    mondayHoliday: true
  };
  const empty = firstOpenPayoutHourToMarkdown(neverOpen);
  assert.equal(firstOpenPayoutGanttHour(neverOpen), null);
  assert.equal(empty, "First open payout hour: none. Counts of modeled hours, not a bank calendar.");
  assert.equal(empty.split("\n").length, 1);
  assert.doesNotMatch(empty, /timestamp|createdAt|exportedAt/i);
  assert.notEqual(empty, firstClosedPayoutHourToMarkdown(DEFAULT_SCENARIO));
  assert.notEqual(empty, firstClosedFxHourToMarkdown(DEFAULT_SCENARIO));
  const model = await readFile(new URL("../src/model.js", import.meta.url), "utf8");
  const start = model.indexOf("export function firstOpenPayoutHourToMarkdown");
  const next = model.indexOf("export function ", start + 1);
  const body = model.slice(start, next);
  assert.match(body, /hour === null/);
  assert.match(body, /First open payout hour: none\. Counts of modeled hours, not a bank calendar\./);
});

test("copy first open payout hour uses clipboard and a textarea fallback", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  const app = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
  assert.match(html, /id="copy-first-open-payout"/);
  assert.match(html, /Copy first open payout hour/);
  assert.match(html, /id="first-open-payout-copy-fallback"/);
  assert.match(html, /id="copy-first-closed-payout"/);
  assert.match(html, /id="copy-first-closed-fx"/);
  assert.match(html, /id="copy-first-closed-bank"/);
  assert.match(html, /id="copy-first-closed-issuer"/);
  assert.match(app, /firstOpenPayoutHourToMarkdown\(scenario\)/);
  assert.match(app, /first-open-payout-copy-fallback/);
  assert.match(app, /copyTextWithFallback/);
  assert.match(app, /synthetic label, not live payout data/);
  assert.match(app, /Clipboard unavailable\. Copy the Markdown from the text box\./);
  assert.notEqual(app.match(/function copyFirstOpenPayoutHourMarkdown/)?.[0], app.match(/function copyFirstClosedPayoutHourMarkdown/)?.[0]);
  assert.notEqual(app.match(/function copyFirstOpenPayoutHourMarkdown/)?.[0], app.match(/function copyFirstClosedFxHourMarkdown/)?.[0]);
  assert.notEqual(app.match(/function copyFirstOpenPayoutHourMarkdown/)?.[0], app.match(/function copyFirstClosedIssuerHourMarkdown/)?.[0]);
  assert.notEqual(app.match(/function copyFirstOpenPayoutHourMarkdown/)?.[0], app.match(/function copyFirstClosedBankHourMarkdown/)?.[0]);
});
