import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("edge selects replace the twelve first/last checkboxes with bounded options", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  const app = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
  for (const id of ["edge-leftover-fill", "edge-tertiary-fill", "edge-unserved", "edge-leftover-only", "edge-winner-allocated", "edge-uncovered-leftover"]) {
    assert.match(html, new RegExp(`id="${id}"`, "u"));
  }
  assert.match(html, /Hide first and last/u);
  assert.doesNotMatch(html, /id="hide-first-unserved-buyer"/u);
  assert.doesNotMatch(html, /id="hide-last-buyer-filled-by-leftover-fill"/u);
  assert.doesNotMatch(app, /hideFirstUnservedBuyer = event/u);
  assert.match(app, /bindEdgeRowSelect\("edge-unserved"/u);
  assert.match(app, /EDGE_ROW_OPTIONS/u);
  assert.match(html, /retired first\/last checkbox pairs map onto the matching edge select/u);
});

test("evidence buttons and print blocks replace the single-field controls", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  const app = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
  for (const id of ["copy-leftover-fill-evidence", "copy-uncovered-leftover-evidence", "copy-leftover-only-evidence", "copy-tertiary-fill-evidence", "copy-winning-offer-evidence",
    "leftover-print-fill-evidence", "leftover-print-uncovered-evidence", "leftover-print-tertiary-evidence"]) {
    assert.match(html, new RegExp(`id="${id}"`, "u"));
  }
  assert.doesNotMatch(html, /id="copy-leftover-fill-remaining"/u);
  assert.doesNotMatch(html, /id="copy-tertiary-fill-maximum"/u);
  assert.doesNotMatch(html, /id="leftover-print-fill-minimum"/u);
  assert.doesNotMatch(html, /id="copy-winning-merchant"/u);
  assert.match(app, /function copyLeftoverFillEvidence\(/u);
  assert.match(app, /function copyWinningOfferEvidence\(/u);
  assert.doesNotMatch(app, /function copyLeftoverFillMinimum\(/u);
});

test("help lists letters, question mark, and escape without retired keys", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  const list = html.slice(html.indexOf('<ul class="shortcut-list">'), html.indexOf("</ul>", html.indexOf('<ul class="shortcut-list">')));
  for (const key of ["u", "c", "i", "y", "z", "?"]) {
    assert.equal(list.includes(`<kbd>${key}</kbd>`), true, `${key} should stay listed`);
  }
  assert.match(list, /<kbd>Esc<\/kbd>/u);
  assert.doesNotMatch(list, /<kbd>,<\/kbd>/u);
  assert.doesNotMatch(list, /<kbd>1<\/kbd>/u);
  assert.doesNotMatch(list, /<kbd>\}<\/kbd>/u);
  assert.doesNotMatch(list, /Shift\+F/u);
});
