import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

test("team-sprint cycling club hours sits after team-pursuit cycling club hours in the preset select", async () => {
  const html = (await readFile(new URL("../index.html", import.meta.url), "utf8")).replaceAll("\r\n", "\n");
  const team = html.indexOf('<option value="team-pursuit-cycling-club-hours">Team-pursuit cycling club hours</option>');
  const sprint = html.indexOf('<option value="team-sprint-cycling-club-hours">Team-sprint cycling club hours</option>');
  const pursuit = html.indexOf('<option value="individual-pursuit-cycling-club-hours">Individual-pursuit cycling club hours</option>');
  assert.ok(pursuit !== -1);
  assert.ok(team > pursuit);
  assert.ok(sprint > team);
  assert.match(html, /<kbd>Shift\+F9<\/kbd> Jump to the hide-last-group-without-floor control, or the groups heading/);
});
