import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

test("team-pursuit cycling club hours sits after individual-pursuit cycling club hours in the preset select", async () => {
  const html = (await readFile(new URL("../index.html", import.meta.url), "utf8")).replaceAll("\r\n", "\n");
  const pursuit = html.indexOf('<option value="individual-pursuit-cycling-club-hours">Individual-pursuit cycling club hours</option>');
  const team = html.indexOf('<option value="team-pursuit-cycling-club-hours">Team-pursuit cycling club hours</option>');
  const scratch = html.indexOf('<option value="scratch-cycling-club-hours">Scratch cycling club hours</option>');
  assert.ok(scratch !== -1);
  assert.ok(pursuit > scratch);
  assert.ok(team > pursuit);
});
