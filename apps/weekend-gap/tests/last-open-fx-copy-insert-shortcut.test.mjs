import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

test("keyboard Insert is wired to copy last open FX hour through the new control", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  const app = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
  assert.match(html, /id="copy-last-open-fx"/);
  assert.match(html, /<kbd>Insert<\/kbd>/u);
  assert.match(html, /Copy last open FX hour as Markdown/);
  assert.match(html, /id="copy-last-open-fx"[^>]*aria-keyshortcuts="Insert"/);
  assert.match(app, /function copyLastOpenFxHourMarkdown/);
  assert.match(app, /lastOpenFxHourToMarkdown\(scenario\)/);
  assert.match(app, /event\.key === "Insert"/);
  assert.match(app, /copyLastOpenFxHourMarkdown\(\)/);
  assert.match(app, /event\.key === "4"/);
  assert.match(app, /copyLastOpenBankHourMarkdown\(\)/);
  assert.match(app, /event\.key === "PageUp"/);
  assert.match(app, /copyLastOpenPayoutHourMarkdown\(\)/);
  assert.notEqual(app.match(/function copyLastOpenFxHourMarkdown/)?.[0], app.match(/function copyLastOpenBankHourMarkdown/)?.[0]);
  assert.notEqual(app.match(/function copyLastOpenFxHourMarkdown/)?.[0], app.match(/function copyLastOpenPayoutHourMarkdown/)?.[0]);
  assert.notEqual(app.match(/function copyLastOpenFxHourMarkdown/)?.[0], app.match(/function copyFirstOpenFxHourMarkdown/)?.[0]);
  const handler = app.slice(app.indexOf('document.addEventListener("keydown"'));
  assert.ok(handler.indexOf('event.key === "Insert"') !== handler.indexOf('event.key === "4"'));
  assert.ok(handler.indexOf('event.key === "Insert"') !== handler.indexOf('event.key === "PageUp"'));
});
