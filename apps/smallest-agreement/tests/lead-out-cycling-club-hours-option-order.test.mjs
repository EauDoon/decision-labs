import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

test("lead-out cycling club hours sits after feed-zone cycling club hours in the preset select", async () => {
  const html = (await readFile(new URL("../index.html", import.meta.url), "utf8")).replaceAll("\r\n", "\n");
  const feedZone = html.indexOf('<option value="feed-zone-cycling-club-hours">Feed-zone cycling club hours</option>');
  const leadOut = html.indexOf('<option value="lead-out-cycling-club-hours">Lead-out cycling club hours</option>');
  const firstAid = html.indexOf('<option value="first-aid-cycling-club-hours">First-aid cycling club hours</option>');
  assert.ok(feedZone !== -1);
  assert.ok(firstAid !== -1);
  assert.ok(leadOut > feedZone);
  assert.ok(feedZone > firstAid);
});
