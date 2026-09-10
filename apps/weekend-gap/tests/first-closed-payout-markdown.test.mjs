import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import {
  DEFAULT_SCENARIO,
  firstClosedBankHourToMarkdown,
  firstClosedFxHourToMarkdown,
  firstClosedIssuerHourToMarkdown,
  firstClosedPayoutGanttHour,
  firstClosedPayoutHourToMarkdown,
  formatTime
} from "../src/model.js";

test("first closed payout hour Markdown is one synthetic line with an honest empty", () => {
  const text = firstClosedPayoutHourToMarkdown(DEFAULT_SCENARIO);
  assert.equal(text, firstClosedPayoutHourToMarkdown(DEFAULT_SCENARIO));
  assert.equal(text.split("\n").length, 1);
  const hour = firstClosedPayoutGanttHour(DEFAULT_SCENARIO);
  assert.equal(hour, 2);
  assert.equal(formatTime(hour), "Fri 17:00");
  assert.equal(text, "First closed payout hour: Fri 17:00 (hour 2). Counts of modeled hours, not a bank calendar.");
  assert.match(text, /Counts of modeled hours/);
  assert.match(text, /not a bank calendar/);
  assert.doesNotMatch(text, /timestamp|createdAt|exportedAt/i);
  assert.notEqual(text, firstClosedFxHourToMarkdown(DEFAULT_SCENARIO));
  assert.notEqual(text, firstClosedBankHourToMarkdown(DEFAULT_SCENARIO));
  assert.notEqual(text, firstClosedIssuerHourToMarkdown(DEFAULT_SCENARIO));
  const earlierPayout = {
    ...DEFAULT_SCENARIO,
    payoutOpenEndHour: 16
  };
  const payoutHour = firstClosedPayoutGanttHour(earlierPayout);
  assert.equal(payoutHour, 1);
  assert.equal(formatTime(payoutHour), "Fri 16:00");
  const payoutText = firstClosedPayoutHourToMarkdown(earlierPayout);
  assert.equal(payoutText, "First closed payout hour: Fri 16:00 (hour 1). Counts of modeled hours, not a bank calendar.");
  assert.notEqual(payoutText, firstClosedBankHourToMarkdown(earlierPayout));
  assert.notEqual(payoutText, firstClosedIssuerHourToMarkdown(earlierPayout));
  assert.notEqual(payoutText, firstClosedFxHourToMarkdown(earlierPayout));
});

test("first closed payout hour Markdown uses none when no modeled hour is closed", async () => {
  const model = await readFile(new URL("../src/model.js", import.meta.url), "utf8");
  const start = model.indexOf("export function firstClosedPayoutHourToMarkdown");
  const next = model.indexOf("export function ", start + 1);
  const body = model.slice(start, next);
  assert.match(body, /hour === null/);
  assert.match(body, /First closed payout hour: none\. Counts of modeled hours, not a bank calendar\./);
  const empty = "First closed payout hour: none. Counts of modeled hours, not a bank calendar.";
  assert.equal(empty.split("\n").length, 1);
  assert.doesNotMatch(empty, /timestamp|createdAt|exportedAt/i);
  assert.notEqual(empty, firstClosedBankHourToMarkdown(DEFAULT_SCENARIO));
  assert.notEqual(empty, firstClosedIssuerHourToMarkdown(DEFAULT_SCENARIO));
  assert.notEqual(empty, firstClosedFxHourToMarkdown(DEFAULT_SCENARIO));
});

test("copy first closed payout hour uses clipboard and a textarea fallback", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  const app = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
  assert.match(html, /id="copy-first-closed-payout"/);
  assert.match(html, /Copy first closed payout hour/);
  assert.match(html, /id="first-closed-payout-copy-fallback"/);
  assert.match(html, /id="copy-first-closed-fx"/);
  assert.match(html, /id="copy-first-closed-bank"/);
  assert.match(html, /id="copy-first-closed-issuer"/);
  assert.match(app, /firstClosedPayoutHourToMarkdown\(scenario\)/);
  assert.match(app, /first-closed-payout-copy-fallback/);
  assert.match(app, /copyTextWithFallback/);
  assert.match(app, /synthetic label, not live payout data/);
  assert.match(app, /Clipboard unavailable\. Copy the Markdown from the text box\./);
  assert.notEqual(app.match(/function copyFirstClosedPayoutHourMarkdown/)?.[0], app.match(/function copyFirstClosedIssuerHourMarkdown/)?.[0]);
  assert.notEqual(app.match(/function copyFirstClosedPayoutHourMarkdown/)?.[0], app.match(/function copyFirstClosedBankHourMarkdown/)?.[0]);
  assert.notEqual(app.match(/function copyFirstClosedPayoutHourMarkdown/)?.[0], app.match(/function copyFirstClosedFxHourMarkdown/)?.[0]);
});
