import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

test("bottle-hand cycling club hours sits after domestique cycling club hours in the preset select", async () => {
  const html = (await readFile(new URL("../index.html", import.meta.url), "utf8")).replaceAll("\r\n", "\n");
  const domestique = html.indexOf('<option value="domestique-cycling-club-hours">Domestique cycling club hours</option>');
  const bottleHand = html.indexOf('<option value="bottle-hand-cycling-club-hours">Bottle-hand cycling club hours</option>');
  const soigneur = html.indexOf('<option value="soigneur-cycling-club-hours">Soigneur cycling club hours</option>');
  assert.ok(domestique !== -1);
  assert.ok(soigneur !== -1);
  assert.ok(bottleHand > domestique);
  assert.ok(domestique > soigneur);
  assert.match(html, /<kbd>Shift\+F9<\/kbd> Jump to the hide-last-group-without-floor control, or the groups heading/);
});
