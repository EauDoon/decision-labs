import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

test("keirin cycling club hours sits after hill-climb cycling club hours in the preset select", async () => {
  const html = (await readFile(new URL("../index.html", import.meta.url), "utf8")).replaceAll("\r\n", "\n");
  const timeTrial = html.indexOf('<option value="time-trial-cycling-club-hours">Time-trial cycling club hours</option>');
  const hillClimb = html.indexOf('<option value="hill-climb-cycling-club-hours">Hill-climb cycling club hours</option>');
  const keirin = html.indexOf('<option value="keirin-cycling-club-hours">Keirin cycling club hours</option>');
  assert.ok(timeTrial !== -1 && hillClimb > timeTrial);
  assert.ok(keirin > hillClimb);
  assert.match(html, /<kbd>Shift\+F9<\/kbd> Jump to the hide-last-group-without-floor control, or the groups heading/);
});
