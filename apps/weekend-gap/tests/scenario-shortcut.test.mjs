import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

test("keyboard s is wired to the scenario inputs heading", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  const app = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
  assert.match(html, /id="assumptions-title"/);
  assert.match(html, /<kbd>S<\/kbd>/);
  assert.match(html, /Jump to the scenario inputs/);
  assert.match(app, /function jumpToScenarioInputs/);
  assert.match(app, /#assumptions-title/);
  assert.match(app, /event\.key === "s"/);
});
