import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

test("keyboard i is wired to the Issuer Gantt row and is distinct from Bank and FX", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  const app = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
  assert.match(html, /id="gantt-issuer-row"/);
  assert.match(html, /<kbd>I<\/kbd>/);
  assert.match(html, /Jump to the Issuer Gantt row/);
  assert.match(app, /function jumpToGanttIssuerRow/);
  assert.match(app, /#gantt-issuer-row/);
  assert.match(app, /event\.key === "i"/);
  assert.match(app, /gateFilter !== "all" && gateFilter !== "issuer"/);
  assert.match(app, /function jumpToGanttBankRow/);
  assert.match(app, /function jumpToGanttFxRow/);
  assert.notEqual(app.match(/function jumpToGanttIssuerRow/)?.[0], app.match(/function jumpToGanttBankRow/)?.[0]);
  assert.notEqual(app.match(/function jumpToGanttIssuerRow/)?.[0], app.match(/function jumpToGanttFxRow/)?.[0]);
});
