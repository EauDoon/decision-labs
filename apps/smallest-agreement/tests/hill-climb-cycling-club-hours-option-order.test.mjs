import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

test("hill-climb cycling club hours sits after time-trial cycling club hours in the preset select", async () => {
  const html = (await readFile(new URL("../index.html", import.meta.url), "utf8")).replaceAll("\r\n", "\n");
  const criterium = html.indexOf('<option value="criterium-cycling-club-hours">Criterium cycling club hours</option>');
  const timeTrial = html.indexOf('<option value="time-trial-cycling-club-hours">Time-trial cycling club hours</option>');
  const hillClimb = html.indexOf('<option value="hill-climb-cycling-club-hours">Hill-climb cycling club hours</option>');
  assert.ok(criterium !== -1 && timeTrial > criterium);
  assert.ok(hillClimb > timeTrial);
  assert.match(html, /<kbd>Shift\+F9<\/kbd> Jump to the hide-last-group-without-floor control, or the groups heading/);
});
