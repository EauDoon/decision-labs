import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

test("omnium cycling club hours sits after madison cycling club hours in the preset select", async () => {
  const html = (await readFile(new URL("../index.html", import.meta.url), "utf8")).replaceAll("\r\n", "\n");
  const keirin = html.indexOf('<option value="keirin-cycling-club-hours">Keirin cycling club hours</option>');
  const madison = html.indexOf('<option value="madison-cycling-club-hours">Madison cycling club hours</option>');
  const omnium = html.indexOf('<option value="omnium-cycling-club-hours">Omnium cycling club hours</option>');
  assert.ok(keirin !== -1 && madison > keirin);
  assert.ok(omnium > madison);
  assert.match(html, /<kbd>Shift\+F9<\/kbd> Jump to the hide-last-group-without-floor control, or the groups heading/);
});
