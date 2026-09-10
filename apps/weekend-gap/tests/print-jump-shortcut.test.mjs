import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

test("keyboard right bracket is wired to Print or the print / one-pager heading", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  const app = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
  assert.match(html, /id="print"/);
  assert.match(html, />Print<\/button>/);
  assert.match(html, /id="print-heading"/);
  assert.match(html, /Print \/ one-pager/);
  assert.match(html, /<kbd>\]<\/kbd>/);
  assert.match(html, /Jump to Print/);
  assert.match(app, /function jumpToPrint/);
  assert.match(app, /#print/);
  assert.match(app, /#print-heading/);
  assert.match(app, /event\.key === "\]"/);
  assert.match(app, /function jumpToHoursToClearCopy/);
  assert.notEqual(app.match(/function jumpToPrint/)?.[0], app.match(/function jumpToHoursToClearCopy/)?.[0]);
});
