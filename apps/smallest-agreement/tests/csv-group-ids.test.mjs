import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import {
  canonicalProposal,
  compareScenarioInputs,
  formatParticipantGroupsCsv,
  formatSupportMatrixCsv,
  parseParticipantGroupsCsv,
  parseSupportMatrixCsv,
  validateProposal,
} from "../src/model.js";

async function appPresets() {
  const app = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
  const start = app.indexOf("{", app.indexOf("const presets = {"));
  let depth = 0;
  let end = start;
  for (; end < app.length; end += 1) {
    if (app[end] === "{") depth += 1;
    else if (app[end] === "}") {
      depth -= 1;
      if (depth === 0) break;
    }
  }
  return Function(`"use strict"; return (${app.slice(start, end + 1)});`)();
}

const presets = await appPresets();

function proposal(groups = [
  { id: "residents", name: "Residents", weight: 3 },
  { id: "stewards", name: "Park stewards", weight: 2 },
]) {
  return {
    title: "Synthetic hours",
    threshold: 60,
    maxChangeCost: 3,
    groups,
    clauses: [{
      id: "hours",
      title: "Opening hours",
      options: [
        { id: "late", original: true, label: "Late", changeCost: 0, support: Object.fromEntries(groups.map((group) => [group.id, 60])) },
        { id: "early", original: false, label: "Early", changeCost: 1, support: Object.fromEntries(groups.map((group) => [group.id, 70])) },
        { id: "split", original: false, label: "Split", changeCost: 2, support: Object.fromEntries(groups.map((group) => [group.id, 50])) },
      ],
    }],
  };
}

const HEADER = "name,weight,min_support,veto,id,hours:late,hours:early,hours:split";

function errorCodes(result) {
  assert.equal(result.status, "invalid");
  return result.errors.map((error) => error.code);
}

test("every app preset survives an unchanged participant groups CSV export and import", () => {
  const entries = Object.entries(presets);
  assert.ok(entries.length >= 61, `expected at least 61 presets, found ${entries.length}`);
  for (const [key, preset] of entries) {
    assert.equal(validateProposal(preset).valid, true, key);
    const result = parseParticipantGroupsCsv(formatParticipantGroupsCsv(preset), preset);
    assert.equal(result.status, "ok", `${key}: ${JSON.stringify(result.errors)}`);
    assert.deepStrictEqual(result.proposal, canonicalProposal(preset), key);
  }
});

test("the groups export writes an id column after veto", () => {
  const [header, first] = formatParticipantGroupsCsv(proposal()).split(/\r?\n/u);
  assert.equal(header, HEADER.split(",").map((cell) => `"${cell}"`).join(","));
  assert.equal(first, ["Residents", 3, "", "no", "residents", 60, 70, 50].map((cell) => `"${cell}"`).join(","));
});

test("after a groups round trip the same draft's support CSV still imports with no changes", () => {
  const neighbourhood = presets.neighbourhood;
  const groups = parseParticipantGroupsCsv(formatParticipantGroupsCsv(neighbourhood), neighbourhood);
  assert.equal(groups.status, "ok");
  assert.deepEqual(groups.proposal.groups.map((group) => group.id), neighbourhood.groups.map((group) => group.id));
  const support = parseSupportMatrixCsv(formatSupportMatrixCsv(neighbourhood), groups.proposal);
  assert.equal(support.status, "ok", JSON.stringify(support.errors));
  assert.deepEqual(compareScenarioInputs(neighbourhood, support.proposal), []);
});

test("a groups CSV without an id column keeps the name-derived identifiers", () => {
  const result = parseParticipantGroupsCsv("name,weight,min_support,veto,hours:late,hours:early,hours:split\nResidents,3,,no,60,70,50\nPark stewards,2,,no,55,65,50\n", proposal());
  assert.equal(result.status, "ok");
  assert.deepEqual(result.proposal.groups.map((group) => group.id), ["residents", "park-stewards"]);
  const legacy = "name,weight,hours:late,hours:early,hours:split\nHours,3,60,70,50\nLate,2,55,65,50\n";
  const avoided = parseParticipantGroupsCsv(legacy, proposal());
  assert.equal(avoided.status, "ok");
  assert.deepEqual(avoided.proposal.groups.map((group) => group.id), ["hours-2", "late-2"]);
});

test("duplicate, reserved or malformed explicit group ids are named errors with their row", () => {
  const cases = [
    [`${HEADER}\nA,1,,no,same,60,70,50\nB,1,,no,same,60,70,50\n`, "duplicate_id", 3],
    [`${HEADER}\nA,1,,no,constructor,60,70,50\n`, "invalid_id", 2],
    [`${HEADER}\nA,1,,no,-bad,60,70,50\n`, "invalid_id", 2],
    [`${HEADER}\nA,1,,no,has space,60,70,50\n`, "invalid_id", 2],
    [`${HEADER}\nA,1,,no,${"x".repeat(65)},60,70,50\n`, "invalid_id", 2],
  ];
  for (const [csv, code, row] of cases) {
    const result = parseParticipantGroupsCsv(csv, proposal());
    assert.deepEqual(errorCodes(result), [code], csv);
    assert.equal(result.errors[0].row, row, csv);
  }
  const repeated = parseParticipantGroupsCsv("name,weight,id,id,hours:late,hours:early,hours:split\nA,1,a,b,60,70,50\n", proposal());
  assert.ok(errorCodes(repeated).includes("duplicate_column"));
});

test("an explicit group id may equal a clause or option id, as the JSON model allows", () => {
  const sameAsClause = proposal([{ id: "hours", name: "Hours keepers", weight: 1 }, { id: "late", name: "Late shift", weight: 1 }]);
  assert.equal(validateProposal(sameAsClause).valid, true);
  const result = parseParticipantGroupsCsv(formatParticipantGroupsCsv(sameAsClause), sameAsClause);
  assert.equal(result.status, "ok", JSON.stringify(result.errors));
  assert.deepStrictEqual(result.proposal, canonicalProposal(sameAsClause));
});

test("blank id cells are generated without colliding with explicit ids", () => {
  const result = parseParticipantGroupsCsv(`${HEADER}\nResidents,1,,no,,60,70,50\nOthers,1,,no,residents,60,70,50\nStewards,1,,no, ,60,70,50\n`, proposal());
  assert.equal(result.status, "ok", JSON.stringify(result.errors));
  assert.deepEqual(result.proposal.groups.map((group) => group.id), ["residents-2", "residents", "stewards"]);
});

test("a pasted TSV groups table with an id column keeps its ids", () => {
  const tsv = `${HEADER.replaceAll(",", "\t")}\nResidents\t3\t\tno\tlocals\t60\t70\t50\nPark stewards\t2\t\tno\tstewards\t55\t65\t50\n`;
  const result = parseParticipantGroupsCsv(tsv, proposal());
  assert.equal(result.status, "ok", JSON.stringify(result.errors));
  assert.deepEqual(result.proposal.groups.map((group) => group.id), ["locals", "stewards"]);
});

test("renaming a group in the CSV keeps its id and its scores", () => {
  const source = proposal();
  const csv = formatParticipantGroupsCsv(source).replace("Park stewards", "Garden volunteers");
  const result = parseParticipantGroupsCsv(csv, source);
  assert.equal(result.status, "ok");
  assert.equal(result.proposal.groups[1].id, "stewards");
  assert.equal(result.proposal.groups[1].name, "Garden volunteers");
  assert.deepEqual(compareScenarioInputs(source, result.proposal).map((change) => change.field), ["Group stewards: name"]);
});
