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
  firstOpenFxHourToMarkdown,
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
  assert.notEqual(text, firstOpenFxHourToMarkdown(DEFAULT_SCENARIO));
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
