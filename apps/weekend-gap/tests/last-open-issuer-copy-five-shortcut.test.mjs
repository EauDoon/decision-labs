import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

test("keyboard 5 is wired to copy last open issuer hour through the new control", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  const app = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
  assert.match(html, /id="copy-last-open-issuer"/);
  assert.match(html, /<kbd>5<\/kbd>/u);
  assert.match(html, /Copy last open issuer hour as Markdown/);
  assert.match(html, /id="copy-last-open-issuer"[^>]*aria-keyshortcuts="5"/);
  assert.match(app, /function copyLastOpenIssuerHourMarkdown/);
  assert.match(app, /lastOpenIssuerHourToMarkdown\(scenario\)/);
  assert.match(app, /event\.key === "5"/);
  assert.match(app, /copyLastOpenIssuerHourMarkdown\(\)/);
  assert.match(app, /event\.key === "\$"/);
  assert.match(app, /copyFirstOpenIssuerHourMarkdown\(\)/);
  assert.notEqual(app.match(/function copyLastOpenIssuerHourMarkdown/)?.[0], app.match(/function copyFirstOpenIssuerHourMarkdown/)?.[0]);
  const handler = app.slice(app.indexOf('document.addEventListener("keydown"'));
  assert.ok(handler.indexOf('event.key === "5"') !== handler.indexOf('event.key === "$"'));
});
