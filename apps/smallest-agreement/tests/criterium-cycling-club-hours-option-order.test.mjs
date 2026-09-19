import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

test("criterium cycling club hours sits after road cycling club hours in the preset select", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  const track = html.indexOf('<option value="track-cycling-club-hours">Track cycling club hours</option>');
  const gravel = html.indexOf('<option value="gravel-cycling-club-hours">Gravel cycling club hours</option>');
  const road = html.indexOf('<option value="road-cycling-club-hours">Road cycling club hours</option>');
  const criterium = html.indexOf('<option value="criterium-cycling-club-hours">Criterium cycling club hours</option>');
  const timeTrial = html.indexOf('<option value="time-trial-cycling-club-hours">Time-trial cycling club hours</option>');
  assert.ok(track !== -1 && gravel > track);
  assert.ok(road > gravel);
  assert.ok(criterium > road);
  assert.ok(timeTrial > criterium);
});
