import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

test("domestique cycling club hours sits after soigneur cycling club hours in the preset select", async () => {
  const html = (await readFile(new URL("../index.html", import.meta.url), "utf8")).replaceAll("\r\n", "\n");
  const soigneur = html.indexOf('<option value="soigneur-cycling-club-hours">Soigneur cycling club hours</option>');
  const domestique = html.indexOf('<option value="domestique-cycling-club-hours">Domestique cycling club hours</option>');
  const leadOut = html.indexOf('<option value="lead-out-cycling-club-hours">Lead-out cycling club hours</option>');
  assert.ok(soigneur !== -1);
  assert.ok(leadOut !== -1);
  assert.ok(domestique > soigneur);
  assert.ok(soigneur > leadOut);
  assert.match(html, /<kbd>Shift\+F9<\/kbd> Jump to the hide-last-group-without-floor control, or the groups heading/);
});
