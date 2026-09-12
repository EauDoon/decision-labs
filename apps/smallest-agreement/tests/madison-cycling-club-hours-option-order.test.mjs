import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

test("madison cycling club hours sits after keirin cycling club hours in the preset select", async () => {
  const html = (await readFile(new URL("../index.html", import.meta.url), "utf8")).replaceAll("\r\n", "\n");
  const hillClimb = html.indexOf('<option value="hill-climb-cycling-club-hours">Hill-climb cycling club hours</option>');
  const keirin = html.indexOf('<option value="keirin-cycling-club-hours">Keirin cycling club hours</option>');
  const madison = html.indexOf('<option value="madison-cycling-club-hours">Madison cycling club hours</option>');
  assert.ok(hillClimb !== -1 && keirin > hillClimb);
  assert.ok(madison > keirin);
  assert.match(html, /<kbd>Shift\+F9<\/kbd> Jump to the hide-last-group-without-floor control, or the groups heading/);
});
