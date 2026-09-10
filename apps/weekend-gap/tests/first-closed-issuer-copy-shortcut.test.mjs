import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

test("keyboard colon is wired to copy first closed issuer hour through the existing control", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  const app = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
  assert.match(html, /id="copy-first-closed-issuer"/);
  assert.match(html, /<kbd>:<\/kbd>/);
  assert.match(html, /Copy first closed issuer hour as Markdown/);
  assert.match(html, /id="copy-first-closed-issuer"[^>]*aria-keyshortcuts="[^"]*:/);
  assert.match(app, /function copyFirstClosedIssuerHourMarkdown/);
  assert.match(app, /firstClosedIssuerHourToMarkdown\(scenario\)/);
  assert.match(app, /event\.key === ":"/);
  assert.match(app, /copyFirstClosedIssuerHourMarkdown\(\)/);
  assert.match(app, /event\.key === "'"/);
  assert.match(app, /copyFirstClosedBankHourMarkdown\(\)/);
  assert.notEqual(app.match(/function copyFirstClosedIssuerHourMarkdown/)?.[0], app.match(/function copyFirstClosedBankHourMarkdown/)?.[0]);
  const handler = app.slice(app.indexOf('document.addEventListener("keydown"'));
  assert.ok(handler.indexOf('event.key === ":"') !== handler.indexOf('event.key === "\'"'));
});
