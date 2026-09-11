import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

test("keyboard 1 is wired to copy last closed bank hour through the new control", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  const app = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
  assert.match(html, /id="copy-last-closed-bank"/);
  assert.match(html, /<kbd>1<\/kbd>/u);
  assert.match(html, /Copy last closed bank hour as Markdown/);
  assert.match(html, /id="copy-last-closed-bank"[^>]*aria-keyshortcuts="1"/);
  assert.match(app, /function copyLastClosedBankHourMarkdown/);
  assert.match(app, /lastClosedBankHourToMarkdown\(scenario\)/);
  assert.match(app, /event\.key === "1"/);
  assert.match(app, /copyLastClosedBankHourMarkdown\(\)/);
  assert.match(app, /event\.key === "8"/);
  assert.match(app, /copyLastClosedIssuerHourMarkdown\(\)/);
  assert.notEqual(app.match(/function copyLastClosedBankHourMarkdown/)?.[0], app.match(/function copyLastClosedIssuerHourMarkdown/)?.[0]);
  const handler = app.slice(app.indexOf('document.addEventListener("keydown"'));
  assert.ok(handler.indexOf('event.key === "1"') !== handler.indexOf('event.key === "8"'));
});
