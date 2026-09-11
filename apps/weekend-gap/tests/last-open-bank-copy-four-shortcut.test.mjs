import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

test("keyboard 4 is wired to copy last open bank hour through the new control", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  const app = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
  assert.match(html, /id="copy-last-open-bank"/);
  assert.match(html, /<kbd>4<\/kbd>/u);
  assert.match(html, /Copy last open bank hour as Markdown/);
  assert.match(html, /id="copy-last-open-bank"[^>]*aria-keyshortcuts="4"/);
  assert.match(app, /function copyLastOpenBankHourMarkdown/);
  assert.match(app, /lastOpenBankHourToMarkdown\(scenario\)/);
  assert.match(app, /event\.key === "4"/);
  assert.match(app, /copyLastOpenBankHourMarkdown\(\)/);
  assert.match(app, /event\.key === "1"/);
  assert.match(app, /copyLastClosedBankHourMarkdown\(\)/);
  assert.match(app, /event\.key === "5"/);
  assert.match(app, /copyLastOpenIssuerHourMarkdown\(\)/);
  assert.notEqual(app.match(/function copyLastOpenBankHourMarkdown/)?.[0], app.match(/function copyLastClosedBankHourMarkdown/)?.[0]);
  assert.notEqual(app.match(/function copyLastOpenBankHourMarkdown/)?.[0], app.match(/function copyLastOpenIssuerHourMarkdown/)?.[0]);
  const handler = app.slice(app.indexOf('document.addEventListener("keydown"'));
  assert.ok(handler.indexOf('event.key === "4"') !== handler.indexOf('event.key === "1"'));
  assert.ok(handler.indexOf('event.key === "4"') !== handler.indexOf('event.key === "5"'));
});
