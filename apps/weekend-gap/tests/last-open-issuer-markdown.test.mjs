import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import {
  DEFAULT_SCENARIO,
  firstOpenIssuerGanttHour,
  firstOpenIssuerHourToMarkdown,
  formatTime,
  lastOpenIssuerGanttHour,
  lastOpenIssuerHourToMarkdown
} from "../src/model.js";

test("last open issuer hour Markdown is one synthetic line with an honest empty", () => {
  const text = lastOpenIssuerHourToMarkdown(DEFAULT_SCENARIO);
  assert.equal(text, lastOpenIssuerHourToMarkdown(DEFAULT_SCENARIO));
  assert.equal(text.split("\n").length, 1);
  const hour = lastOpenIssuerGanttHour(DEFAULT_SCENARIO);
  const first = firstOpenIssuerGanttHour(DEFAULT_SCENARIO);
  assert.equal(first, 0);
  assert.equal(hour, 71);
  assert.equal(formatTime(hour), "Mon 14:00");
  assert.equal(text, "Last open issuer hour: Mon 14:00 (hour 71). Counts of modeled hours, not a bank calendar.");
  assert.match(text, /Counts of modeled hours/);
  assert.match(text, /not a bank calendar/);
  assert.doesNotMatch(text, /timestamp|createdAt|exportedAt/i);
  assert.notEqual(text, firstOpenIssuerHourToMarkdown(DEFAULT_SCENARIO));
  const laterIssuer = {
    ...DEFAULT_SCENARIO,
    issuerOpenStartHour: 16,
    mondayHoliday: true
  };
  const issuerHour = lastOpenIssuerGanttHour(laterIssuer);
  assert.equal(issuerHour, 1);
  assert.equal(formatTime(issuerHour), "Fri 16:00");
  const issuerText = lastOpenIssuerHourToMarkdown(laterIssuer);
  assert.equal(issuerText, "Last open issuer hour: Fri 16:00 (hour 1). Counts of modeled hours, not a bank calendar.");
  assert.notEqual(issuerText, firstOpenIssuerHourToMarkdown(laterIssuer));
});

test("last open issuer hour Markdown uses none when no modeled hour is open", async () => {
  const neverOpen = {
    ...DEFAULT_SCENARIO,
    issuerOpenStartHour: 0,
    issuerOpenEndHour: 1,
    mondayHoliday: true
  };
  const empty = lastOpenIssuerHourToMarkdown(neverOpen);
  assert.equal(lastOpenIssuerGanttHour(neverOpen), null);
  assert.equal(empty, "Last open issuer hour: none. Counts of modeled hours, not a bank calendar.");
  assert.equal(empty.split("\n").length, 1);
  assert.doesNotMatch(empty, /timestamp|createdAt|exportedAt/i);
  assert.notEqual(empty, firstOpenIssuerHourToMarkdown(DEFAULT_SCENARIO));
  const model = await readFile(new URL("../src/model.js", import.meta.url), "utf8");
  const start = model.indexOf("export function lastOpenIssuerHourToMarkdown");
  const next = model.indexOf("export function ", start + 1);
  const body = model.slice(start, next === -1 ? undefined : next);
  assert.match(body, /hour === null/);
  assert.match(body, /Last open issuer hour: none\. Counts of modeled hours, not a bank calendar\./);
  assert.doesNotMatch(model, /Date\.now/);
});
