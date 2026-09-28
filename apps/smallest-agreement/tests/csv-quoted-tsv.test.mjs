import test from "node:test";
import assert from "node:assert/strict";
import { parseParticipantGroupsCsv, parseSupportMatrixCsv } from "../src/model.js";

const proposal = {
  title: "Quoted TSV fixture",
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

const groupTail = "venue:hall\tvenue:annexe\tvenue:park";

test("a quoted TSV field drops the wrapping quotes and keeps an interior comma or tab", () => {
  // line.split("\\t") left the spreadsheet quotes on the name, so the group
  // was stored as "North, Block" including the quote characters.
  const comma = `name\tweight\t${groupTail}\n"North, Block"\t1\t50\t50\t50\nBravo crew\t1\t60\t60\t60\n`;
  const groups = parseParticipantGroupsCsv(comma, proposal);
  assert.equal(groups.status, "ok", JSON.stringify(groups.errors));
  assert.equal(groups.proposal.groups[0].name, "North, Block");
  assert.equal(groups.proposal.groups[1].name, "Bravo crew");

  const tab = `name\tweight\t${groupTail}\n"North\tBlock"\t1\t50\t50\t50\nBravo crew\t1\t60\t60\t60\n`;
  const tabbed = parseParticipantGroupsCsv(tab, proposal);
  assert.equal(tabbed.status, "ok", JSON.stringify(tabbed.errors));
  assert.equal(tabbed.proposal.groups[0].name, "North\tBlock");
});

test("an unquoted quotation mark in a TSV name stays, and a quoted score is a number", () => {
  const named = `name\tweight\t${groupTail}\nCafe "North"\t1\t50\t50\t50\nBravo crew\t1\t60\t60\t60\n`;
  const groups = parseParticipantGroupsCsv(named, proposal);
  assert.equal(groups.status, "ok", JSON.stringify(groups.errors));
  assert.equal(groups.proposal.groups[0].name, 'Cafe "North"');

  const support = 'clause_id\toption_id\talpha\tbravo\nvenue\thall\t"50"\t60\nvenue\tannexe\t80\t80\nvenue\tpark\t60\t60\n';
  const matrix = parseSupportMatrixCsv(support, proposal);
  assert.equal(matrix.status, "ok", JSON.stringify(matrix.errors));
  assert.equal(matrix.proposal.clauses[0].options[0].support.alpha, 50);
});

test("an unclosed quoted TSV field is rejected", () => {
  const broken = `name\tweight\t${groupTail}\n"North, Block\t1\t50\t50\t50\n`;
  const groups = parseParticipantGroupsCsv(broken, proposal);
  assert.equal(groups.status, "invalid");
  assert.equal(groups.errors[0].code, "truncated_row");
});
