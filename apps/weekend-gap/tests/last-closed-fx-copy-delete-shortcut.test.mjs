import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

test("keyboard Delete is wired to copy last closed FX hour through the new control", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  const app = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
  assert.match(html, /id="copy-last-closed-fx"/);
  assert.match(html, /<kbd>Delete<\/kbd>/u);
  assert.match(html, /Copy last closed FX hour as Markdown/);
  assert.match(html, /id="copy-last-closed-fx"[^>]*aria-keyshortcuts="Delete"/);
  assert.match(app, /function copyLastClosedFxHourMarkdown/);
  assert.match(app, /lastClosedFxHourToMarkdown\(scenario\)/);
  assert.match(app, /event\.key === "Delete"/);
  assert.match(app, /copyLastClosedFxHourMarkdown\(\)/);
  assert.match(app, /event\.key === "Insert"/);
  assert.match(app, /copyLastOpenFxHourMarkdown\(\)/);
  assert.match(app, /event\.key === "PageUp"/);
  assert.match(app, /copyLastOpenPayoutHourMarkdown\(\)/);
  assert.notEqual(app.match(/function copyLastClosedFxHourMarkdown/)?.[0], app.match(/function copyLastOpenFxHourMarkdown/)?.[0]);
  assert.notEqual(app.match(/function copyLastClosedFxHourMarkdown/)?.[0], app.match(/function copyLastOpenPayoutHourMarkdown/)?.[0]);
  assert.notEqual(app.match(/function copyLastClosedFxHourMarkdown/)?.[0], app.match(/function copyFirstClosedFxHourMarkdown/)?.[0]);
  const handler = app.slice(app.indexOf('document.addEventListener("keydown"'));
  assert.ok(handler.indexOf('event.key === "Delete"') !== handler.indexOf('event.key === "Insert"'));
  assert.ok(handler.indexOf('event.key === "Delete"') !== handler.indexOf('event.key === "PageUp"'));
});
