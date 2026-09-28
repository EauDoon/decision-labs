import test from "node:test";
import assert from "node:assert/strict";
import { parseParticipantGroupsCsv, parseSupportMatrixCsv } from "../src/model.js";

const proposal = {
  title: "Unicode separator fixture",
  threshold: 60,
  groups: [
    { id: "alpha", name: "Alpha", weight: 1 },
    { id: "bravo", name: "Bravo", weight: 1 },
  ],
  clauses: [
    {
      id: "venue",
      title: "Venue",
      options: [
        { id: "hall", label: "Village hall", original: true, changeCost: 0, support: { alpha: 50, bravo: 50 } },
        { id: "annexe", label: "Sports annexe", changeCost: 4, support: { alpha: 80, bravo: 80 } },
        { id: "park", label: "Riverside park", changeCost: 2, support: { alpha: 60, bravo: 60 } },
      ],
    },
  ],
};

const groupHeader = "name,weight,venue:hall,venue:annexe,venue:park";
const groupRows = ["North,1,50,50,50", "Bravo crew,1,60,60,60"];
const supportHeader = "clause_id,option_id,alpha,bravo";
const supportRows = ["venue,hall,50,60", "venue,annexe,80,80", "venue,park,60,60"];

test("unicode line and paragraph separators keep group and support rows separate", () => {
  // U+2028 and U+2029 joined the header to the first data row, so the importer
  // reported an unknown column that contained both.
  for (const separator of ["\u2028", "\u2029"]) {
    const groups = parseParticipantGroupsCsv(`${groupHeader}${separator}${groupRows.join(separator)}`, proposal);
    assert.equal(groups.status, "ok", JSON.stringify(groups.errors));
    assert.deepEqual(groups.proposal.groups.map((group) => group.name), ["North", "Bravo crew"]);

    const support = parseSupportMatrixCsv(`${supportHeader}${separator}${supportRows.join(separator)}`, proposal);
    assert.equal(support.status, "ok", JSON.stringify(support.errors));
    assert.equal(support.updatedCells, 6);
    assert.equal(support.proposal.clauses[0].options[1].support.alpha, 80);
  }
});

test("a quoted unicode line separator stays inside a group name", () => {
  const csv = `${groupHeader}\n"North\u2028Block",1,50,50,50\nBravo crew,1,60,60,60\n`;
  const groups = parseParticipantGroupsCsv(csv, proposal);
  assert.equal(groups.status, "ok", JSON.stringify(groups.errors));
  assert.equal(groups.proposal.groups[0].name, "North\u2028Block");
});

test("a group TSV separated only by a unicode line separator still imports", () => {
  const tsv = "name\tweight\tvenue:hall\tvenue:annexe\tvenue:park\u2028North\t1\t50\t50\t50\u2028Bravo crew\t1\t60\t60\t60";
  const groups = parseParticipantGroupsCsv(tsv, proposal);
  assert.equal(groups.status, "ok", JSON.stringify(groups.errors));
  assert.deepEqual(groups.proposal.groups.map((group) => group.name), ["North", "Bravo crew"]);
});
