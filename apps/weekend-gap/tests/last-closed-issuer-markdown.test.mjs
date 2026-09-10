import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import {
  DEFAULT_SCENARIO,
  firstClosedIssuerGanttHour,
  firstClosedIssuerHourToMarkdown,
  firstOpenIssuerHourToMarkdown,
  formatTime,
  lastClosedIssuerGanttHour,
  lastClosedIssuerHourToMarkdown,
  lastOpenIssuerGanttHour,
  lastOpenIssuerHourToMarkdown
} from "../src/model.js";

test("last closed issuer hour Markdown is one synthetic line with an honest empty", () => {
  const text = lastClosedIssuerHourToMarkdown(DEFAULT_SCENARIO);
  assert.equal(text, lastClosedIssuerHourToMarkdown(DEFAULT_SCENARIO));
  assert.equal(text.split("\n").length, 1);
  const hour = lastClosedIssuerGanttHour(DEFAULT_SCENARIO);
  const firstClosed = firstClosedIssuerGanttHour(DEFAULT_SCENARIO);
  const lastOpen = lastOpenIssuerGanttHour(DEFAULT_SCENARIO);
  assert.equal(firstClosed, 2);
  assert.equal(lastOpen, 71);
  assert.equal(hour, 64);
  assert.equal(formatTime(hour), "Mon 07:00");
  assert.equal(text, "Last closed issuer hour: Mon 07:00 (hour 64). Counts of modeled hours, not a bank calendar.");
  assert.match(text, /Counts of modeled hours/);
  assert.match(text, /not a bank calendar/);
  assert.doesNotMatch(text, /timestamp|createdAt|exportedAt/i);
  assert.notEqual(text, lastOpenIssuerHourToMarkdown(DEFAULT_SCENARIO));
  assert.notEqual(text, firstClosedIssuerHourToMarkdown(DEFAULT_SCENARIO));
  assert.notEqual(text, firstOpenIssuerHourToMarkdown(DEFAULT_SCENARIO));
  const laterIssuer = {
    ...DEFAULT_SCENARIO,
    issuerOpenStartHour: 16,
    mondayHoliday: true
  };
  const issuerHour = lastClosedIssuerGanttHour(laterIssuer);
  assert.equal(issuerHour, 71);
  assert.equal(formatTime(issuerHour), "Mon 14:00");
  const issuerText = lastClosedIssuerHourToMarkdown(laterIssuer);
  assert.equal(issuerText, "Last closed issuer hour: Mon 14:00 (hour 71). Counts of modeled hours, not a bank calendar.");
  assert.notEqual(issuerText, lastOpenIssuerHourToMarkdown(laterIssuer));
  assert.notEqual(issuerText, firstClosedIssuerHourToMarkdown(laterIssuer));
});

test("last closed issuer hour Markdown uses none when no modeled hour is closed", async () => {
  const model = await readFile(new URL("../src/model.js", import.meta.url), "utf8");
  const start = model.indexOf("export function lastClosedIssuerHourToMarkdown");
  const next = model.indexOf("export function ", start + 1);
  const body = model.slice(start, next === -1 ? undefined : next);
  assert.match(body, /hour === null/);
  assert.match(body, /Last closed issuer hour: none\. Counts of modeled hours, not a bank calendar\./);
  const empty = "Last closed issuer hour: none. Counts of modeled hours, not a bank calendar.";
  assert.equal(empty.split("\n").length, 1);
  assert.doesNotMatch(empty, /timestamp|createdAt|exportedAt/i);
  assert.notEqual(empty, lastOpenIssuerHourToMarkdown(DEFAULT_SCENARIO));
  assert.notEqual(empty, firstClosedIssuerHourToMarkdown(DEFAULT_SCENARIO));
  assert.doesNotMatch(model, /Date\.now/);
});

test("copy last closed issuer hour uses clipboard and a textarea fallback", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  const app = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
  assert.match(html, /id="copy-last-closed-issuer"/);
  assert.match(html, /Copy last closed issuer hour/);
  assert.match(html, /id="last-closed-issuer-copy-fallback"/);
  assert.match(html, /id="copy-last-open-issuer"/);
  assert.match(html, /id="copy-first-open-issuer"/);
  assert.match(app, /lastClosedIssuerHourToMarkdown\(scenario\)/);
  assert.match(app, /last-closed-issuer-copy-fallback/);
  assert.match(app, /copyTextWithFallback/);
  assert.match(app, /synthetic label, not live issuer data/);
  assert.match(app, /Clipboard unavailable\. Copy the Markdown from the text box\./);
  assert.notEqual(app.match(/function copyLastClosedIssuerHourMarkdown/)?.[0], app.match(/function copyLastOpenIssuerHourMarkdown/)?.[0]);
  assert.notEqual(app.match(/function copyLastClosedIssuerHourMarkdown/)?.[0], app.match(/function copyFirstOpenIssuerHourMarkdown/)?.[0]);
});
