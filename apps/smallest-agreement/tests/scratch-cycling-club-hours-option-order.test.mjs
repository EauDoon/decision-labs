import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

test("scratch cycling club hours sits after points-race cycling club hours in the preset select", async () => {
  const html = (await readFile(new URL("../index.html", import.meta.url), "utf8")).replaceAll("\r\n", "\n");
  const pointsRace = html.indexOf('<option value="points-race-cycling-club-hours">Points-race cycling club hours</option>');
  const scratch = html.indexOf('<option value="scratch-cycling-club-hours">Scratch cycling club hours</option>');
  assert.ok(pointsRace !== -1);
  assert.ok(scratch > pointsRace);
});
