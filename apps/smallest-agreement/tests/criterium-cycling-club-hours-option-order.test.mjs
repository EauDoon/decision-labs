import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

test("criterium cycling club hours sits after road cycling club hours in the preset select", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  const track = html.indexOf('<option value="track-cycling-club-hours">Track cycling club hours</option>');
  const gravel = html.indexOf('<option value="gravel-cycling-club-hours">Gravel cycling club hours</option>');
  const road = html.indexOf('<option value="road-cycling-club-hours">Road cycling club hours</option>');
  const criterium = html.indexOf('<option value="criterium-cycling-club-hours">Criterium cycling club hours</option>');
  assert.ok(track !== -1 && gravel > track);
  assert.ok(road > gravel);
  assert.ok(criterium > road);
  assert.match(html, /<kbd>Shift\+F9<\/kbd> Jump to the hide-last-group-without-floor control, or the groups heading/);
});
