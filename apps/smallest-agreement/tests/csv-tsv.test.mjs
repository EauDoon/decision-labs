import test from "node:test";
import assert from "node:assert/strict";
import {
  formatClauseOptionsCsv,
  formatParticipantGroupsCsv,
  formatSupportMatrixCsv,
  parseClauseOptionsCsv,
  parseParticipantGroupsCsv,
  parseSupportMatrixCsv,
} from "../src/model.js";

// Synthetic fixture. Group ids and support scores are made up for this test.
const proposal = {
  title: "TSV fixture",
  threshold: 60,
  groups: [
    { id: "alpha", name: "Alpha", weight: 1, minSupport: 40, veto: true },
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

const toTsv = (csv) => {
  // Turn a real export into the tab-separated text a spreadsheet copy produces:
  // unquote every field, then swap the separator. No field here contains a
  // quote or a comma, which is what a spreadsheet copies for this shape.
  return csv
    .split("\r\n")
    .filter((line) => line !== "")
    .map((line) => line.replaceAll('","', "\t").replace(/^"(.+)"$/u, "$1"))
    .join("\n");
};

test("parseSupportMatrixCsv accepts a pasted TSV, like the other two importers", () => {
  // The UI advertises "Paste participant groups TSV or CSV" and "Paste clause
  // options TSV or CSV", and both importers convert a tab-separated first line
  // before validating. The support matrix is the one importer that did not, so
  // the same numbers copied out of a spreadsheet failed there and worked here.
  const tsv = toTsv(formatSupportMatrixCsv(proposal));
  assert.match(tsv.split("\n")[0], /\talpha\tbravo$/, "fixture must be tab separated");

  const imported = parseSupportMatrixCsv(tsv, proposal);
  assert.equal(imported.status, "ok", JSON.stringify(imported.errors));
  // Three options times two group columns.
  assert.equal(imported.updatedCells, 6);
  assert.deepEqual(imported.proposal.clauses[0].options[0].support, { alpha: 50, bravo: 50 });
  assert.deepEqual(imported.proposal.clauses[0].options[1].support, { alpha: 80, bravo: 80 });
});

test("a CSV with a quoted comma stays CSV and is not split on the tab check", () => {
  const csv = formatSupportMatrixCsv(proposal);
  assert.equal(csv.split("\r\n")[0], '"clause_id","option_id","alpha","bravo"');
  const imported = parseSupportMatrixCsv(csv, proposal);
  assert.equal(imported.status, "ok", JSON.stringify(imported.errors));
  assert.equal(imported.updatedCells, 6);
});

test("the other two importers already handled TSV, and still do", () => {
  const groups = parseParticipantGroupsCsv(toTsv(formatParticipantGroupsCsv(proposal)), proposal);
  assert.equal(groups.status, "ok", JSON.stringify(groups.errors));
  const clauses = parseClauseOptionsCsv(toTsv(formatClauseOptionsCsv(proposal).csv), proposal);
  assert.equal(clauses.status, "ok", JSON.stringify(clauses.errors));
});

test("a pasted TSV still imports when blank lines precede the header", () => {
  // Spreadsheet and editor pastes often start with a blank line. The tab check
  // used to look only at that empty first line, treat the paste as CSV, and
  // reject the header as one cell. Blank lines before the header are skipped
  // for all three importers. A leading blank line on a real CSV stays CSV.
  const support = toTsv(formatSupportMatrixCsv(proposal));
  for (const prefix of ["\n", "\r\n", "   \n", "\n\n"]) {
    const imported = parseSupportMatrixCsv(`${prefix}${support}`, proposal);
    assert.equal(imported.status, "ok", JSON.stringify(imported.errors));
    assert.equal(imported.updatedCells, 6);
  }
  const groups = parseParticipantGroupsCsv(`\n${toTsv(formatParticipantGroupsCsv(proposal))}`, proposal);
  assert.equal(groups.status, "ok", JSON.stringify(groups.errors));
  const clauses = parseClauseOptionsCsv(`\n${toTsv(formatClauseOptionsCsv(proposal).csv)}`, proposal);
  assert.equal(clauses.status, "ok", JSON.stringify(clauses.errors));

  const csv = parseSupportMatrixCsv(`\n${formatSupportMatrixCsv(proposal)}`, proposal);
  assert.equal(csv.status, "ok", JSON.stringify(csv.errors));
  assert.equal(csv.updatedCells, 6);
});

test("a TSV support matrix still rejects the same real errors as CSV", () => {
  const missingColumn = parseSupportMatrixCsv("clause_id\toption_id\talpha\nvenue\thall\t50\n", proposal);
  assert.equal(missingColumn.status, "invalid");
  assert.deepEqual(missingColumn.errors.map((error) => error.code), ["missing_group_column"]);

  const wrongFirstColumn = parseSupportMatrixCsv("clause\toption_id\talpha\tbravo\nvenue\thall\t50\t50\n", proposal);
  assert.equal(wrongFirstColumn.status, "invalid");
  assert.deepEqual(wrongFirstColumn.errors.map((error) => error.code), ["missing_clause_id_column"]);

  const badScore = parseSupportMatrixCsv("clause_id\toption_id\talpha\tbravo\nvenue\thall\t50\tnope\n", proposal);
  assert.equal(badScore.status, "invalid");
  assert.deepEqual(badScore.errors.map((error) => error.code), ["invalid_score"]);
});
