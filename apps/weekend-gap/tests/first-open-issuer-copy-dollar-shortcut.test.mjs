import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

test("keyboard dollar is wired to copy first open issuer hour through the existing control", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  const app = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
  assert.match(html, /id="copy-first-open-issuer"/);
  assert.match(html, /<kbd>\$<\/kbd>/u);
  assert.match(html, /Copy first open issuer hour as Markdown/);
  assert.match(html, /id="copy-first-open-issuer"[^>]*aria-keyshortcuts="\$"/);
  assert.match(app, /function copyFirstOpenIssuerHourMarkdown/);
  assert.match(app, /firstOpenIssuerHourToMarkdown\(scenario\)/);
  assert.match(app, /event\.key === "\$"/);
  assert.match(app, /copyFirstOpenIssuerHourMarkdown\(\)/);
  assert.match(app, /event\.key === "\*"/);
  assert.match(app, /copyFirstOpenBankHourMarkdown\(\)/);
  assert.notEqual(app.match(/function copyFirstOpenIssuerHourMarkdown/)?.[0], app.match(/function copyFirstOpenBankHourMarkdown/)?.[0]);
  const handler = app.slice(app.indexOf('document.addEventListener("keydown"'));
  assert.ok(handler.indexOf('event.key === "$"') !== handler.indexOf('event.key === "*"'));
});
