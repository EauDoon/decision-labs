import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

test("individual-pursuit cycling club hours sits after scratch cycling club hours in the preset select", async () => {
  const html = (await readFile(new URL("../index.html", import.meta.url), "utf8")).replaceAll("\r\n", "\n");
  const scratch = html.indexOf('<option value="scratch-cycling-club-hours">Scratch cycling club hours</option>');
  const pursuit = html.indexOf('<option value="individual-pursuit-cycling-club-hours">Individual-pursuit cycling club hours</option>');
  const pointsRace = html.indexOf('<option value="points-race-cycling-club-hours">Points-race cycling club hours</option>');
  assert.ok(pointsRace !== -1);
  assert.ok(scratch > pointsRace);
  assert.ok(pursuit > scratch);
  assert.match(html, /<kbd>Shift\+F9<\/kbd> Jump to the hide-last-group-without-floor control, or the groups heading/);
});
