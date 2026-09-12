import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

test("time-trial cycling club hours sits after criterium cycling club hours in the preset select", async () => {
  const html = (await readFile(new URL("../index.html", import.meta.url), "utf8")).replaceAll("\r\n", "\n");
  const road = html.indexOf('<option value="road-cycling-club-hours">Road cycling club hours</option>');
  const criterium = html.indexOf('<option value="criterium-cycling-club-hours">Criterium cycling club hours</option>');
  const timeTrial = html.indexOf('<option value="time-trial-cycling-club-hours">Time-trial cycling club hours</option>');
  assert.ok(road !== -1 && criterium > road);
  assert.ok(timeTrial > criterium);
  assert.match(html, /<kbd>Shift\+F9<\/kbd> Jump to the hide-last-group-without-floor control, or the groups heading/);
});
