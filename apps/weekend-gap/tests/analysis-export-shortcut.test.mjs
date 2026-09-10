import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

test("keyboard a is wired to analysis and export controls", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  const app = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
  assert.match(html, /id="analysis-export-controls"/);
  assert.match(html, /id="analysis-export"/);
  assert.match(html, /<kbd>A<\/kbd>/);
  assert.match(html, /Jump to analysis and export controls/);
  assert.match(app, /function jumpToAnalysisExport/);
  assert.match(app, /#analysis-export-controls/);
  assert.match(app, /event\.key === "a"/);
  assert.match(app, /isEditableTarget/);
});
