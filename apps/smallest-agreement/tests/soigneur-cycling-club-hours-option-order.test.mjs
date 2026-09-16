import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

test("soigneur cycling club hours sits after lead-out cycling club hours in the preset select", async () => {
  const html = (await readFile(new URL("../index.html", import.meta.url), "utf8")).replaceAll("\r\n", "\n");
  const leadOut = html.indexOf('<option value="lead-out-cycling-club-hours">Lead-out cycling club hours</option>');
  const soigneur = html.indexOf('<option value="soigneur-cycling-club-hours">Soigneur cycling club hours</option>');
  const feedZone = html.indexOf('<option value="feed-zone-cycling-club-hours">Feed-zone cycling club hours</option>');
  assert.ok(leadOut !== -1);
  assert.ok(feedZone !== -1);
  assert.ok(soigneur > leadOut);
  assert.ok(leadOut > feedZone);
});
