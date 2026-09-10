import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

test("keyboard y is wired to the hours-to-first-settlement dashboard line", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  const app = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
  assert.match(html, /id="hours-to-first-settlement-line"/);
  assert.match(html, /<kbd>Y<\/kbd>/);
  assert.match(html, /Jump to the hours-to-first-settlement line/);
  assert.match(app, /function jumpToHoursToFirstSettlementLine/);
  assert.match(app, /#hours-to-first-settlement-line/);
  assert.match(app, /event\.key === "y"/);
  assert.match(app, /function jumpToDashboard/);
  assert.match(app, /function jumpToFirstSettlement/);
  assert.match(app, /function jumpToHoursToClear/);
  assert.notEqual(app.match(/function jumpToHoursToFirstSettlementLine/)?.[0], app.match(/function jumpToFirstSettlement/)?.[0]);
  assert.notEqual(app.match(/function jumpToHoursToFirstSettlementLine/)?.[0], app.match(/function jumpToHoursToClear/)?.[0]);
});
