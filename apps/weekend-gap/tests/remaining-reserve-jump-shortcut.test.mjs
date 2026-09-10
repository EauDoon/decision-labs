import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

test("keyboard slash is wired to the remaining-reserve copy control and shift-slash stays help", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  const app = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
  assert.match(html, /id="copy-remaining-reserve"/);
  assert.match(html, /<kbd>\/<\/kbd>/);
  assert.match(html, /Jump to the remaining-reserve copy control/);
  assert.match(html, /<kbd>Z<\/kbd>/);
  assert.match(html, /Copy remaining reserve at the selected hour as Markdown/);
  assert.match(app, /function jumpToRemainingReserveCopy/);
  assert.match(app, /#copy-remaining-reserve/);
  assert.match(app, /event\.key === "\/"/);
  assert.match(app, /event\.key === "\?"/);
  assert.match(app, /function copyRemainingReserveMarkdown/);
  assert.match(app, /event\.key === "z"/);
  assert.match(app, /function jumpToDashboard/);
  const handler = app.slice(app.indexOf('document.addEventListener("keydown"'), app.indexOf("maybeShowCoach();"));
  assert.ok(handler.indexOf('event.key === "?"') < handler.indexOf('event.key === "/"'));
  assert.notEqual(app.match(/function jumpToRemainingReserveCopy/)?.[0], app.match(/function copyRemainingReserveMarkdown/)?.[0]);
});
