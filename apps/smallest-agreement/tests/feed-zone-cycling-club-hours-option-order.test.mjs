import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

test("feed-zone cycling club hours sits after first-aid cycling club hours in the preset select", async () => {
  const html = (await readFile(new URL("../index.html", import.meta.url), "utf8")).replaceAll("\r\n", "\n");
  const firstAid = html.indexOf('<option value="first-aid-cycling-club-hours">First-aid cycling club hours</option>');
  const feedZone = html.indexOf('<option value="feed-zone-cycling-club-hours">Feed-zone cycling club hours</option>');
  const sprint = html.indexOf('<option value="team-sprint-cycling-club-hours">Team-sprint cycling club hours</option>');
  assert.ok(firstAid !== -1);
  assert.ok(sprint !== -1);
  assert.ok(feedZone > firstAid);
  assert.ok(firstAid > sprint);
});
