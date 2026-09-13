import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

test("points-race cycling club hours sits after omnium cycling club hours in the preset select", async () => {
  const html = (await readFile(new URL("../index.html", import.meta.url), "utf8")).replaceAll("\r\n", "\n");
  const madison = html.indexOf('<option value="madison-cycling-club-hours">Madison cycling club hours</option>');
  const omnium = html.indexOf('<option value="omnium-cycling-club-hours">Omnium cycling club hours</option>');
  const pointsRace = html.indexOf('<option value="points-race-cycling-club-hours">Points-race cycling club hours</option>');
  assert.ok(omnium !== -1 && omnium > madison);
  assert.ok(pointsRace > omnium);
  assert.match(html, /<kbd>Shift\+F9<\/kbd> Jump to the hide-last-group-without-floor control, or the groups heading/);
});
