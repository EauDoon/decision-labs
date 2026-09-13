import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

test("first-aid cycling club hours sits after team-sprint cycling club hours in the preset select", async () => {
  const html = (await readFile(new URL("../index.html", import.meta.url), "utf8")).replaceAll("\r\n", "\n");
  const sprint = html.indexOf('<option value="team-sprint-cycling-club-hours">Team-sprint cycling club hours</option>');
  const firstAid = html.indexOf('<option value="first-aid-cycling-club-hours">First-aid cycling club hours</option>');
  const team = html.indexOf('<option value="team-pursuit-cycling-club-hours">Team-pursuit cycling club hours</option>');
  assert.ok(sprint !== -1);
  assert.ok(team !== -1);
  assert.ok(firstAid > sprint);
  assert.ok(sprint > team);
  assert.match(html, /<kbd>Shift\+F9<\/kbd> Jump to the hide-last-group-without-floor control, or the groups heading/);
});
