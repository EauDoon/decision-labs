import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

test("keyboard F7 is wired to copy last weekend-FX-closed hour through the new control", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  const app = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
  assert.match(html, /id="copy-last-weekend-fx-closed"/);
  assert.match(html, /<kbd>F7<\/kbd>/u);
  assert.match(html, /Copy last weekend-FX-closed hour as Markdown/);
  assert.match(html, /id="copy-last-weekend-fx-closed"[^>]*aria-keyshortcuts="F7 Shift\+F10"/);
  assert.match(app, /function copyLastWeekendFxClosedHourMarkdown/);
  assert.match(app, /lastWeekendFxClosedHourToMarkdown\(scenario\)/);
  assert.match(app, /event\.key === "F7"/);
  assert.match(app, /copyLastWeekendFxClosedHourMarkdown\(\)/);
  assert.match(app, /event\.key === "F3"/);
  assert.match(app, /copyLastClosedPayoutHourMarkdown\(\)/);
  assert.match(app, /event\.key === "Delete"/);
  assert.match(app, /copyLastClosedFxHourMarkdown\(\)/);
  assert.notEqual(app.match(/function copyLastWeekendFxClosedHourMarkdown/)?.[0], app.match(/function copyLastClosedPayoutHourMarkdown/)?.[0]);
  assert.notEqual(app.match(/function copyLastWeekendFxClosedHourMarkdown/)?.[0], app.match(/function copyLastClosedFxHourMarkdown/)?.[0]);
  assert.notEqual(app.match(/function copyLastWeekendFxClosedHourMarkdown/)?.[0], app.match(/function copyFirstClosedFxHourMarkdown/)?.[0]);
  const handler = app.slice(app.indexOf('document.addEventListener("keydown"'));
  assert.ok(handler.indexOf('event.key === "F7"') !== handler.indexOf('event.key === "F3"'));
  assert.ok(handler.indexOf('event.key === "F7"') !== handler.indexOf('event.key === "Delete"'));
});
