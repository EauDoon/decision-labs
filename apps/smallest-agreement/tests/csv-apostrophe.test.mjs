import test from "node:test";
import assert from "node:assert/strict";
import {
  formatClauseOptionsCsv,
  formatParticipantGroupsCsv,
  parseClauseOptionsCsv,
  parseParticipantGroupsCsv,
  parseSupportMatrixCsv,
} from "../src/model.js";

// Synthetic fixture. Every text field starts with a real apostrophe that is
// part of the value, not a spreadsheet escape: a place name and quoted words.
const proposal = {
  title: "Apostrophe fixture",
  threshold: 60,
  groups: [
    { id: "alpha", name: "'s-Hertogenbosch residents", weight: 1 },
    { id: "bravo", name: "Bravo", weight: 1 },
  ],
  clauses: [
    {
      id: "venue",
      title: "'Shared' venue",
      note: "'Phase in' means two years",
      options: [
        { id: "hall", label: "'Village' hall", original: true, changeCost: 0, support: { alpha: 50, bravo: 50 } },
        { id: "annexe", label: "Sports annexe", changeCost: 4, support: { alpha: 80, bravo: 80 } },
        { id: "park", label: "Riverside park", changeCost: 2, support: { alpha: 60, bravo: 60 } },
      ],
    },
  ],
};

const toTsv = (csv) => csv
  .split("\r\n")
  .filter((line) => line !== "")
  .map((line) => line.replaceAll('","', "\t").replace(/^"(.+)"$/u, "$1"))
  .join("\n");

test("a group name that starts with an apostrophe survives the CSV and TSV round trip", () => {
  // The exporters add an apostrophe only before a formula prefix, so this one
  // is part of the name. The importer used to strip every leading apostrophe.
  const csv = formatParticipantGroupsCsv(proposal);
  assert.match(csv, /^"'s-Hertogenbosch residents",/mu, "the export writes the name unchanged");
  for (const text of [csv, toTsv(csv)]) {
    const imported = parseParticipantGroupsCsv(text, proposal);
    assert.equal(imported.status, "ok", JSON.stringify(imported.errors));
    assert.deepEqual(imported.proposal.groups.map((group) => group.name), ["'s-Hertogenbosch residents", "Bravo"]);
  }
});

test("clause titles, option labels and notes that start with an apostrophe survive the round trip", () => {
  const { csv } = formatClauseOptionsCsv(proposal);
  for (const text of [csv, toTsv(csv)]) {
    const imported = parseClauseOptionsCsv(text, proposal);
    assert.equal(imported.status, "ok", JSON.stringify(imported.errors));
    const [clause] = imported.proposal.clauses;
    assert.equal(clause.title, "'Shared' venue");
    assert.equal(clause.note, "'Phase in' means two years");
    assert.deepEqual(clause.options.map((option) => option.label), ["'Village' hall", "Sports annexe", "Riverside park"]);
  }
});

test("an apostrophe that escapes a formula prefix is still removed and the formula still rejected", () => {
  const formulaName = { ...proposal, groups: [{ id: "alpha", name: "=1+1", weight: 1 }, proposal.groups[1]] };
  const csv = formatParticipantGroupsCsv(formulaName);
  assert.match(csv, /^"'=1\+1",/mu, "the export escapes the formula prefix");
  const groups = parseParticipantGroupsCsv(csv, formulaName);
  assert.equal(groups.status, "invalid");
  assert.deepEqual(groups.errors.map((error) => error.code), ["formula_cell"]);

  const header = "clause_id,option_id,clause_title,option_label,original,change_cost";
  const escaped = `${header}\nvenue,hall,Venue,'-Hall,yes,0\nvenue,annexe,Venue,Annexe,no,4\nvenue,park,Venue,Park,no,2\n`;
  const clauses = parseClauseOptionsCsv(escaped, proposal);
  assert.equal(clauses.status, "invalid");
  assert.deepEqual(clauses.errors.map((error) => error.code), ["formula_cell"]);
});

test("numbers written as apostrophe text still import as numbers", () => {
  // A spreadsheet marks a number stored as text with a leading apostrophe.
  // Scores, weights and costs keep accepting that form.
  const groups = parseParticipantGroupsCsv(
    "name,weight,venue:hall,venue:annexe,venue:park\nAlpha,'2,'50,'80,'60\nBravo,1,50,80,60\n",
    proposal,
  );
  assert.equal(groups.status, "ok", JSON.stringify(groups.errors));
  assert.equal(groups.proposal.groups[0].weight, 2);
  assert.equal(groups.proposal.clauses[0].options[1].support[groups.proposal.groups[0].id], 80);

  const matrix = parseSupportMatrixCsv("clause_id,option_id,alpha,bravo\nvenue,hall,'55,50\nvenue,annexe,80,80\nvenue,park,60,60\n", proposal);
  assert.equal(matrix.status, "ok", JSON.stringify(matrix.errors));
  assert.equal(matrix.proposal.clauses[0].options[0].support.alpha, 55);

  const clauses = parseClauseOptionsCsv(
    "clause_id,option_id,clause_title,option_label,original,change_cost\nvenue,hall,Venue,Hall,yes,'0\nvenue,annexe,Venue,Annexe,no,'4\nvenue,park,Venue,Park,no,2\n",
    proposal,
  );
  assert.equal(clauses.status, "ok", JSON.stringify(clauses.errors));
  assert.equal(clauses.proposal.clauses[0].options[1].changeCost, 4);
});
