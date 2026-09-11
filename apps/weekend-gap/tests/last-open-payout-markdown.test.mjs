import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import {
  DEFAULT_SCENARIO,
  firstOpenPayoutHourToMarkdown,
  formatTime,
  lastOpenBankGanttHour,
  lastOpenBankHourToMarkdown,
  lastOpenIssuerGanttHour,
  lastOpenIssuerHourToMarkdown,
  lastOpenPayoutGanttHour,
  lastOpenPayoutHourToMarkdown
} from "../src/model.js";

test("last open payout hour Markdown is one synthetic line with an honest empty", () => {
  const text = lastOpenPayoutHourToMarkdown(DEFAULT_SCENARIO);
  assert.equal(text, lastOpenPayoutHourToMarkdown(DEFAULT_SCENARIO));
  assert.equal(text.split("\n").length, 1);
  const hour = lastOpenPayoutGanttHour(DEFAULT_SCENARIO);
  const bankHour = lastOpenBankGanttHour(DEFAULT_SCENARIO);
  const issuerHour = lastOpenIssuerGanttHour(DEFAULT_SCENARIO);
  assert.equal(issuerHour, 71);
  assert.equal(bankHour, 71);
  assert.equal(hour, 71);
  assert.equal(formatTime(hour), "Mon 14:00");
  assert.equal(text, "Last open payout hour: Mon 14:00 (hour 71). Counts of modeled hours, not a payout calendar.");
  assert.match(text, /Counts of modeled hours/);
  assert.match(text, /not a payout calendar/);
  assert.doesNotMatch(text, /timestamp|createdAt|exportedAt/i);
  assert.notEqual(text, lastOpenBankHourToMarkdown(DEFAULT_SCENARIO));
  assert.notEqual(text, lastOpenIssuerHourToMarkdown(DEFAULT_SCENARIO));
  assert.notEqual(text, firstOpenPayoutHourToMarkdown(DEFAULT_SCENARIO));
  const earlierPayout = {
    ...DEFAULT_SCENARIO,
    payoutOpenEndHour: 14
  };
  const payoutHour = lastOpenPayoutGanttHour(earlierPayout);
  assert.equal(payoutHour, 70);
  assert.equal(formatTime(payoutHour), "Mon 13:00");
  const payoutText = lastOpenPayoutHourToMarkdown(earlierPayout);
  assert.equal(payoutText, "Last open payout hour: Mon 13:00 (hour 70). Counts of modeled hours, not a payout calendar.");
  assert.notEqual(payoutText, lastOpenBankHourToMarkdown(earlierPayout));
  assert.notEqual(payoutText, lastOpenIssuerHourToMarkdown(earlierPayout));
  assert.notEqual(payoutText, firstOpenPayoutHourToMarkdown(earlierPayout));
  assert.notEqual(lastOpenPayoutGanttHour(earlierPayout), lastOpenBankGanttHour(earlierPayout));
  assert.notEqual(lastOpenPayoutGanttHour(earlierPayout), lastOpenIssuerGanttHour(earlierPayout));
});

test("last open payout hour Markdown uses none when no modeled hour is open", async () => {
  const neverOpen = {
    ...DEFAULT_SCENARIO,
    payoutOpenStartHour: 0,
    payoutOpenEndHour: 1,
    mondayHoliday: true
  };
  const empty = lastOpenPayoutHourToMarkdown(neverOpen);
  assert.equal(lastOpenPayoutGanttHour(neverOpen), null);
  assert.equal(empty, "Last open payout hour: none. Counts of modeled hours, not a payout calendar.");
  assert.equal(empty.split("\n").length, 1);
  assert.doesNotMatch(empty, /timestamp|createdAt|exportedAt/i);
  assert.notEqual(empty, lastOpenBankHourToMarkdown(DEFAULT_SCENARIO));
  assert.notEqual(empty, lastOpenIssuerHourToMarkdown(DEFAULT_SCENARIO));
  assert.notEqual(empty, firstOpenPayoutHourToMarkdown(DEFAULT_SCENARIO));
  const model = await readFile(new URL("../src/model.js", import.meta.url), "utf8");
  const start = model.indexOf("export function lastOpenPayoutHourToMarkdown");
  const next = model.indexOf("export function ", start + 1);
  const body = model.slice(start, next === -1 ? undefined : next);
  assert.match(body, /hour === null/);
  assert.match(body, /Last open payout hour: none\. Counts of modeled hours, not a payout calendar\./);
  assert.doesNotMatch(model, /Date\.now/);
});

test("copy last open payout hour uses clipboard and a textarea fallback", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  const app = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
  assert.match(html, /id="copy-last-open-payout"/);
  assert.match(html, /Copy last open payout hour/);
  assert.match(html, /id="last-open-payout-copy-fallback"/);
  assert.match(html, /id="copy-last-open-bank"/);
  assert.match(html, /id="copy-last-open-issuer"/);
  assert.match(html, /id="copy-first-open-payout"/);
  assert.match(app, /lastOpenPayoutHourToMarkdown\(scenario\)/);
  assert.match(app, /last-open-payout-copy-fallback/);
  assert.match(app, /copyTextWithFallback/);
  assert.match(app, /synthetic label, not live payout data/);
  assert.match(app, /Clipboard unavailable\. Copy the Markdown from the text box\./);
  assert.notEqual(app.match(/function copyLastOpenPayoutHourMarkdown/)?.[0], app.match(/function copyLastOpenBankHourMarkdown/)?.[0]);
  assert.notEqual(app.match(/function copyLastOpenPayoutHourMarkdown/)?.[0], app.match(/function copyLastOpenIssuerHourMarkdown/)?.[0]);
  assert.notEqual(app.match(/function copyLastOpenPayoutHourMarkdown/)?.[0], app.match(/function copyFirstOpenPayoutHourMarkdown/)?.[0]);
});
