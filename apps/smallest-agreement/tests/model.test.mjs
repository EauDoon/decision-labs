import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  MAX_CHANGE_COST,
  MAX_CLAUSES,
  MAX_COMBINATIONS,
  MAX_GROUPS,
  MAX_NEAR_MISSES,
  MAX_OPTIONS_PER_CLAUSE,
  MAX_WEIGHT,
  approvalForOptions,
  getOriginalOptions,
  canonicalProposal,
  clauseContributions,
  clauseWeightedSupport,
  comparePinnedPackages,
  explorePackageGaps,
  evaluatePackage,
  formatSupportMatrixCsv,
  parseSupportMatrixCsv,
  parseParticipantGroupsCsv,
  formatParticipantGroupsCsv,
  duplicateClauseOption,
  changedClauseIds,
  groupsBelowSupportRequirement,
  overBudgetClauseIds,
  formatCurrentLocksMarkdown,
  formatRecommendedChangeCostCsv,
  parseClauseOptionsCsv,
  formatClauseOptionsCsv,
  previewLockedOption,
  leaveOneGroupOut,
  formatDiscussionWorksheet,
  formatDiscussionWorksheetCsv,
  formatRecommendedPackageMarkdown,
  formatVetoBlockersMarkdown,
  formatPinnedPackagesMarkdown,
  compareWorkshopFiles,
  formatWorkspaceJson,
  parseWorkspaceJson,
  formatLocksJson,
  parseLocksJson,
  resetGroupSupport,
  groupContributions,
  lockPackage,
  clearAllLocks,
  toggleClauseLock,
  vetoBlockingGroups,
  previewRenormalizedWeights,
  applyRenormalizedWeights,
  duplicateParticipantGroup,
  moveClause,
  sortPackageGapRows,
  stressPackage,
  compareScenarioInputs,
  formatEvidenceCsv,
  findSmallestAgreement,
  formatDecisionBrief,
  validateProposal,
} from "../src/model.js";

function option(id, original, support, changeCost = 0) {
  return { id, original, label: id, changeCost, support };
}

function proposal({ threshold = 70, groups = [{ id: "g", name: "Group", weight: 1 }], clauses } = {}) {
  return { title: "Test proposal", threshold, groups, clauses };
}

test("weighted approval uses group weights and averages clause support", () => {
  const groups = [{ id: "a", name: "A", weight: 1 }, { id: "b", name: "B", weight: 3 }];
  const options = [option("o", true, { a: 100, b: 50 })];
  assert.equal(approvalForOptions(groups, options), 62.5);
});

test("decision brief is deterministic and carries the recommendation into a portable handoff", () => {
  const input = proposal({
    title: "A | safe local change",
    threshold: 70,
    clauses: [
      { id: "one", title: "Access | hours", options: [
        option("one-original", true, { g: 50 }),
        option("one-change", false, { g: 90 }, 2),
        option("one-more", false, { g: 60 }, 4),
      ] },
    ],
  });
  const result = findSmallestAgreement(input);
  const brief = formatDecisionBrief(input, result);
  assert.equal(brief, formatDecisionBrief(input, result));
  assert.match(brief, /Approval threshold: 70\.0%/u);
  assert.match(brief, /A lowest-cost passing combination was found\./u);
  assert.match(brief, /Access hours: "one-original" => "one-change" \(cost 2\.0\)/u);
  assert.match(brief, /\| Group \| Weight \| Current \| Recommended \| Change \|/u);
  assert.doesNotMatch(brief, /[|][^\\n]*safe local change/u);
  assert.doesNotMatch(brief, /[\u2014\u2013]/u);
});

test("canonical proposals discard unknown imported fields at every level", () => {
  const input = proposal({
    clauses: [{ id: "one", title: "One", hidden: "clause", options: [
      { ...option("original", true, { g: 50 }), hidden: "option" },
      option("alternative", false, { g: 80 }, 1),
      option("alternative-two", false, { g: 70 }, 2),
    ] }],
  });
  input.hidden = "root";
  input.groups[0].hidden = "group";
  const clean = canonicalProposal(input);
  assert.equal(JSON.stringify(clean).includes("hidden"), false);
  assert.deepEqual(Object.keys(clean), ["title", "threshold", "groups", "clauses"]);
  assert.deepEqual(Object.keys(clean.clauses[0].options[0].support), ["g"]);
});

test("original flags reject nested payloads and nonboolean values before canonical export", () => {
  for (const invalid of [{ privateNote: "synthetic-canary" }, {}, [], null, 0, 1, "false", "true"]) {
    const input = proposal({ clauses: [{ id: "one", title: "One", options: [
      option("original", true, { g: 50 }),
      option("alternative", invalid, { g: 80 }, 1),
      option("alternative-two", false, { g: 70 }, 2),
    ] }] });
    const snapshot = structuredClone(input);
    const validation = validateProposal(input);
    assert.equal(validation.valid, false);
    assert.match(validation.errors.join(" "), /original must be a boolean/u);
    assert.equal(findSmallestAgreement(input).status, "invalid");
    assert.throws(() => canonicalProposal(input), /original must be a boolean/u);
    assert.deepEqual(input, snapshot);
  }
});

test("omitted and false original flags remain alternatives and canonicalize to booleans", () => {
  const input = proposal({ clauses: [{ id: "one", title: "One", options: [
    option("original", true, { g: 50 }),
    option("omitted", undefined, { g: 80 }, 1),
    option("explicit-false", false, { g: 70 }, 2),
  ] }] });
  delete input.clauses[0].options[1].original;
  assert.equal(validateProposal(input).valid, true);
  const clean = canonicalProposal(input);
  assert.deepEqual(clean.clauses[0].options.map(({ original }) => original), [true, false, false]);
  assert.equal(findSmallestAgreement(clean).agreement.options[0].id, "omitted");
  assert.equal(Object.hasOwn(input.clauses[0].options[1], "original"), false);
  assert.deepEqual(canonicalProposal(JSON.parse(JSON.stringify(clean))), clean);
});

test("decision briefs render user markup as text", () => {
  const input = proposal({
    clauses: [{ id: "one", title: "<script>alert(1)</script>", options: [
      option("original", true, { g: 50 }),
      option("alternative", false, { g: 80 }, 1),
      option("alternative-two", false, { g: 70 }, 2),
    ] }],
  });
  const brief = formatDecisionBrief(input, findSmallestAgreement(input));
  assert.doesNotMatch(brief, /<script>/u);
  assert.match(brief, /&lt;script&gt;/u);
});

test("search chooses the passing agreement with the smallest total change cost", () => {
  const input = proposal({
    threshold: 70,
    clauses: [
      { id: "one", title: "One", options: [option("one-original", true, { g: 50 }), option("one-change", false, { g: 90 }, 2), option("one-more", false, { g: 60 }, 4)] },
      { id: "two", title: "Two", options: [option("two-original", true, { g: 50 }), option("two-change", false, { g: 90 }, 1), option("two-more", false, { g: 60 }, 4)] },
    ],
  });
  const result = findSmallestAgreement(input);
  assert.equal(result.status, "found");
  assert.equal(result.agreement.changeCost, 1);
  assert.deepEqual(result.agreement.options.map((item) => item.id), ["one-original", "two-change"]);
});

test("ties use option IDs in clause order after the documented tie breakers", () => {
  const input = proposal({
    threshold: 60,
    clauses: [{
      id: "one", title: "One", options: [
        option("original", true, { g: 30 }),
        option("zeta", false, { g: 80 }, 1),
        option("alpha", false, { g: 80 }, 1),
      ],
    }],
  });
  const result = findSmallestAgreement(input);
  assert.equal(result.status, "found");
  assert.equal(result.agreement.options[0].id, "alpha");
});

test("status quo is returned when it already passes", () => {
  const input = proposal({
    threshold: 60,
    clauses: [{ id: "one", title: "One", options: [option("original", true, { g: 70 }), option("alternative", false, { g: 90 }, 2), option("alternative-two", false, { g: 85 }, 3)] }],
  });
  const result = findSmallestAgreement(input);
  assert.equal(result.status, "already_passing");
  assert.equal(result.agreement.changeCost, 0);
  assert.equal(result.agreement.options[0].id, "original");
});

test("infeasible result has no agreement and returns near misses", () => {
  const input = proposal({
    threshold: 90,
    clauses: [{ id: "one", title: "One", options: [option("original", true, { g: 40 }), option("alternative", false, { g: 75 }, 1), option("alternative-two", false, { g: 65 }, 2)] }],
  });
  const result = findSmallestAgreement(input);
  assert.equal(result.status, "infeasible");
  assert.equal(result.agreement, null);
  assert.equal(result.nearMisses[0].approval, 75);
});

test("validation rejects missing originals, unsafe costs, and incomplete support", () => {
  const input = proposal({
    groups: [{ id: "a", name: "A", weight: 1 }, { id: "b", name: "B", weight: 1 }],
    clauses: [{ id: "one", title: "One", options: [
      option("first", false, { a: 50 }, -1),
      option("second", false, { a: 50, b: 50 }, 1),
      option("third", false, { a: 50, b: 50 }, 1),
    ] }],
  });
  const validation = validateProposal(input);
  assert.equal(validation.valid, false);
  assert.match(validation.errors.join(" "), /exactly one original option/);
  assert.match(validation.errors.join(" "), /from 0 through/);
  assert.match(validation.errors.join(" "), /support.b/);
});

test("model contract documents the live validation, search, and transport caps", async () => {
  const contract = await readFile(new URL("../MODEL.md", import.meta.url), "utf8");
  const readme = await readFile(new URL("../README.md", import.meta.url), "utf8");
  const security = await readFile(new URL("../SECURITY.md", import.meta.url), "utf8");
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  const withCommas = (value) => value.toLocaleString("en-US");

  assert.equal(MAX_GROUPS, 24);
  assert.equal(MAX_CLAUSES, 20);
  assert.equal(MAX_OPTIONS_PER_CLAUSE, 24);
  assert.equal(MAX_COMBINATIONS, 50_000);
  assert.equal(MAX_NEAR_MISSES, 5);
  assert.equal(MAX_WEIGHT, 1_000_000);
  assert.equal(MAX_CHANGE_COST, 1_000_000_000);
  assert.equal(MAX_CHANGE_COST * MAX_CLAUSES, 20_000_000_000);

  assert.match(contract, new RegExp(`1 to ${MAX_GROUPS}`));
  assert.match(contract, new RegExp(`1 to ${MAX_CLAUSES}`));
  assert.match(contract, new RegExp(`3 to ${MAX_OPTIONS_PER_CLAUSE}`));
  assert.match(contract, new RegExp(`at most ${withCommas(MAX_WEIGHT)}`));
  assert.match(contract, new RegExp(`from 0 through ${withCommas(MAX_CHANGE_COST)}`));
  assert.match(contract, new RegExp(`${withCommas(MAX_COMBINATIONS)} lock-permitted combinations`));
  assert.match(contract, new RegExp(`integer from 1 through ${withCommas(MAX_COMBINATIONS)}`));
  assert.match(contract, new RegExp(`integer from 0 through ${MAX_NEAR_MISSES}`));
  assert.match(contract, /1 to 64 characters/u);
  assert.match(contract, /constructor.*prototype.*__proto__/u);
  assert.match(contract, /Support maps must contain exactly the declared group ids|no other keys/u);
  assert.match(contract, /`NaN` and infinities are invalid/u);
  assert.match(contract, /at most 120 characters/u);
  assert.match(contract, /at most 80 characters/u);
  assert.match(contract, /at most 240 characters/u);
  assert.match(contract, /Omitting `original`, or setting it to `false`, marks an alternative/u);
  assert.match(contract, /plain object with only `maxCombinations`/u);
  assert.match(contract, /unknown keys/u);

  assert.match(html, /id="proposal-title"[^>]*maxlength="120"/u);
  assert.match(html, /id="max-change-cost"[^>]*max="20000000000"/u);
  assert.match(readme, /JSON files of 250 KB or smaller/u);
  assert.match(readme, /60,000 characters/u);
  assert.match(security, /250 KB/u);
  assert.match(security, /60,000 characters/u);
});

test("validation bounds imported structure, labels, and identifier syntax", () => {
  const baseClause = { id: "one", title: "One", options: [
    option("first", true, { g: 50 }),
    option("second", false, { g: 60 }, 1),
    option("third", false, { g: 70 }, 2),
  ] };
  const tooManyGroups = proposal({
    groups: Array.from({ length: MAX_GROUPS + 1 }, (_, index) => ({ id: `g-${index}`, name: `Group ${index}`, weight: 1 })),
    clauses: [baseClause],
  });
  assert.equal(validateProposal(tooManyGroups).valid, false);

  const tooManyOptions = proposal({ clauses: [{
    id: "one",
    title: "One",
    options: Array.from({ length: MAX_OPTIONS_PER_CLAUSE + 1 }, (_, index) => option(`o-${index}`, index === 0, { g: 50 }, index === 0 ? 0 : 1)),
  }] });
  assert.equal(validateProposal(tooManyOptions).valid, false);

  const unsafeId = proposal({ clauses: [{ ...baseClause, id: "__proto__" }] });
  assert.match(validateProposal(unsafeId).errors.join(" "), /safe identifier/);

  const excessiveWeight = proposal({ groups: [{ id: "g", name: "Group", weight: MAX_WEIGHT + 1 }], clauses: [baseClause] });
  assert.match(validateProposal(excessiveWeight).errors.join(" "), /no more than/);

  const nullGroup = proposal({ groups: [null], clauses: [baseClause] });
  assert.doesNotThrow(() => validateProposal(nullGroup));
  assert.equal(validateProposal(nullGroup).valid, false);

  const padded = " ".repeat(241) + "x";
  for (const mutate of [
    (input) => { input.title = padded; },
    (input) => { input.groups[0].name = padded; },
    (input) => { input.clauses[0].title = padded; },
    (input) => { input.clauses[0].options[0].label = padded; },
  ]) {
    const input = proposal({ clauses: [structuredClone(baseClause)] });
    mutate(input);
    assert.equal(validateProposal(input).valid, false);
  }
});

test("validation rejects duplicate ids, prototype keys, extra support fields, and non-finite numbers", () => {
  const clauses = [{ id: "one", title: "One", options: [
    option("original", true, { g: 50 }),
    option("alternative", false, { g: 80 }, 1),
    option("alternative-two", false, { g: 70 }, 2),
  ] }];
  const duplicateGroups = proposal({
    groups: [{ id: "g", name: "A", weight: 1 }, { id: "g", name: "B", weight: 1 }],
    clauses: structuredClone(clauses),
  });
  assert.match(validateProposal(duplicateGroups).errors.join(" "), /groups\[1\]\.id must be unique/u);
  assert.equal(findSmallestAgreement(duplicateGroups).status, "invalid");

  const duplicateClauses = proposal({ clauses: [structuredClone(clauses[0]), { ...structuredClone(clauses[0]) }] });
  assert.match(validateProposal(duplicateClauses).errors.join(" "), /clauses\[1\]\.id must be unique/u);

  const duplicateOptions = proposal({ clauses: [{ id: "one", title: "One", options: [
    option("same", true, { g: 50 }),
    option("same", false, { g: 80 }, 1),
    option("other", false, { g: 70 }, 2),
  ] }] });
  assert.match(validateProposal(duplicateOptions).errors.join(" "), /options\[1\]\.id must be unique/u);

  for (const id of ["constructor", "prototype", "__proto__"]) {
    const reserved = proposal({ clauses: [{ ...structuredClone(clauses[0]), id }] });
    assert.match(validateProposal(reserved).errors.join(" "), /safe identifier/u, `id ${id}`);
    assert.equal(findSmallestAgreement(reserved).status, "invalid");
  }

  const extraSupport = proposal({ clauses: structuredClone(clauses) });
  extraSupport.clauses[0].options[0].support.hidden = 99;
  assert.match(validateProposal(extraSupport).errors.join(" "), /declared group ids/u);
  assert.throws(() => canonicalProposal(extraSupport), /declared group ids/u);

  const protoSupport = proposal({ clauses: structuredClone(clauses) });
  protoSupport.clauses[0].options[0].support = JSON.parse('{"g":50,"__proto__":1,"constructor":2}');
  assert.match(validateProposal(protoSupport).errors.join(" "), /declared group ids/u);

  const inherited = proposal({ clauses: structuredClone(clauses) });
  inherited.clauses[0].options[0].support = {};
  const descriptor = Object.getOwnPropertyDescriptor(Object.prototype, "g");
  Object.defineProperty(Object.prototype, "g", { configurable: true, enumerable: true, value: 50 });
  try {
    assert.equal(inherited.clauses[0].options[0].support.g, 50);
    const validation = validateProposal(inherited);
    assert.equal(validation.valid, false);
    assert.match(validation.errors.join(" "), /support\.g must be a number from 0 to 100/u);
  } finally {
    if (descriptor) Object.defineProperty(Object.prototype, "g", descriptor);
    else delete Object.prototype.g;
  }

  for (const value of [NaN, Infinity, -Infinity, "1", null, undefined, true, {}]) {
    const costly = proposal({ clauses: structuredClone(clauses) });
    costly.clauses[0].options[1].changeCost = value;
    const validation = validateProposal(costly);
    assert.equal(validation.valid, false, `changeCost ${String(value)}`);
    assert.match(validation.errors.join(" "), /changeCost must be from 0 through/u);
    assert.equal(findSmallestAgreement(costly).status, "invalid");
  }
  for (const value of [NaN, Infinity, -Infinity, 0, -1, "2", null, undefined, true, {}]) {
    const weighted = proposal({ clauses: structuredClone(clauses) });
    weighted.groups[0].weight = value;
    const validation = validateProposal(weighted);
    assert.equal(validation.valid, false, `weight ${String(value)}`);
    assert.match(validation.errors.join(" "), /weight must be greater than 0 and no more than/u);
    assert.equal(findSmallestAgreement(weighted).status, "invalid");
  }
});

test("invalid thresholds fail closed before any search or canonical export", () => {
  const clauses = [{ id: "one", title: "One", options: [
    option("original", true, { g: 50 }),
    option("alternative", false, { g: 80 }, 1),
    option("alternative-two", false, { g: 70 }, 2),
  ] }];
  for (const value of [-1, 101, NaN, Infinity, -Infinity, null, undefined, "70", false, true, {}, []]) {
    const input = proposal({ clauses: structuredClone(clauses) });
    input.threshold = value;
    const snapshot = structuredClone(input);
    const validation = validateProposal(input);
    assert.equal(validation.valid, false, `threshold ${String(value)}`);
    assert.match(validation.errors.join(" "), /threshold must be a number from 0 to 100/u);
    const result = findSmallestAgreement(input);
    assert.equal(result.status, "invalid", `threshold ${String(value)}`);
    assert.match(result.errors.join(" "), /threshold must be a number from 0 to 100/u);
    assert.equal(result.agreement, undefined);
    assert.throws(() => canonicalProposal(input), /threshold must be a number from 0 to 100/u);
    assert.deepEqual(input, snapshot);
    const brief = formatDecisionBrief(input, result);
    assert.match(brief, /The draft is not valid enough to evaluate/u);
    assert.match(brief, /threshold must be a number from 0 to 100/u);
    assert.doesNotMatch(brief, /A lowest-cost passing combination was found/u);
  }
  for (const value of [0, 100, 70, 12.5]) {
    assert.equal(validateProposal(proposal({ threshold: value, clauses: structuredClone(clauses) })).valid, true, `threshold ${value}`);
  }
});

test("search treats threshold 0 and 100 as inclusive bounds", () => {
  const clauses = [{ id: "one", title: "One", options: [
    option("original", true, { g: 0 }),
    option("middle", false, { g: 50 }, 1),
    option("perfect", false, { g: 100 }, 2),
  ] }];
  const atZero = findSmallestAgreement(proposal({ threshold: 0, clauses: structuredClone(clauses) }));
  assert.equal(atZero.status, "already_passing");
  assert.equal(atZero.agreement.options[0].id, "original");
  assert.equal(atZero.checkedCombinations, 1);

  const exactCeiling = findSmallestAgreement(proposal({ threshold: 100, clauses: structuredClone(clauses) }));
  assert.equal(exactCeiling.status, "found");
  assert.equal(exactCeiling.agreement.options[0].id, "perfect");
  assert.equal(exactCeiling.agreement.approval, 100);
  assert.equal(exactCeiling.nearMisses[0].options[0].id, "middle");

  const alreadyPerfect = proposal({ threshold: 100, clauses: [{ id: "one", title: "One", options: [
    option("original", true, { g: 100 }),
    option("middle", false, { g: 50 }, 1),
    option("other", false, { g: 0 }, 2),
  ] }] });
  assert.equal(findSmallestAgreement(alreadyPerfect).status, "already_passing");
});

test("public search options cannot raise the resource or result caps", () => {
  const input = proposal({ clauses: [{ id: "one", title: "One", options: [
    option("a", true, { g: 40 }), option("b", false, { g: 60 }, 1), option("c", false, { g: 80 }, 2),
  ] }] });
  assert.equal(findSmallestAgreement(input, { maxCombinations: MAX_COMBINATIONS + 1 }).status, "invalid");
  assert.equal(findSmallestAgreement(input, { nearMissLimit: MAX_NEAR_MISSES + 1 }).status, "invalid");
  for (const value of [0, -1, 1.5, NaN, Infinity, "4", null, {}, true]) {
    const combinations = findSmallestAgreement(input, { maxCombinations: value });
    assert.equal(combinations.status, "invalid", `maxCombinations ${String(value)}`);
    assert.match(combinations.errors.join(" "), /maxCombinations must be an integer from 1 through/u);
  }
  for (const value of [-1, 1.5, NaN, Infinity, "2", null, {}, true]) {
    const misses = findSmallestAgreement(input, { nearMissLimit: value });
    assert.equal(misses.status, "invalid", `nearMissLimit ${String(value)}`);
    assert.match(misses.errors.join(" "), /nearMissLimit must be an integer from 0 through/u);
  }
  const noMisses = findSmallestAgreement(proposal({
    threshold: 90,
    clauses: [{ id: "one", title: "One", options: [
      option("a", true, { g: 40 }), option("b", false, { g: 75 }, 1), option("c", false, { g: 65 }, 2),
    ] }],
  }), { nearMissLimit: 0 });
  assert.equal(noMisses.status, "infeasible");
  assert.deepEqual(noMisses.nearMisses, []);
  for (const value of [null, 4, "options", true, []]) {
    const result = findSmallestAgreement(input, value);
    assert.equal(result.status, "invalid", `search options ${String(value)}`);
    assert.match(result.errors.join(" "), /Search options must be a plain object/u);
  }
  const extra = findSmallestAgreement(input, { maxCombinations: 8, debug: true, sample: false });
  assert.equal(extra.status, "invalid");
  assert.match(extra.errors.join(" "), /Unknown search option: debug, sample/u);
});

test("search returns an explicit safety result when combinations exceed the bound", () => {
  const input = proposal({
    clauses: [
      { id: "one", title: "One", options: [option("a", true, { g: 40 }), option("b", false, { g: 60 }, 1), option("c", false, { g: 80 }, 2)] },
      { id: "two", title: "Two", options: [option("d", true, { g: 40 }), option("e", false, { g: 60 }, 1), option("f", false, { g: 80 }, 2)] },
    ],
  });
  const result = findSmallestAgreement(input, { maxCombinations: 4 });
  assert.equal(result.status, "too_large");
  assert.equal(result.maxCombinations, 4);
  assert.equal(result.possibleCombinations, 5);
});

test("infeasible searches retain only the requested best near misses", () => {
  const clauses = Array.from({ length: 9 }, (_, clauseIndex) => ({
    id: `clause-${clauseIndex}`,
    title: `Clause ${clauseIndex}`,
    options: [
      option(`original-${clauseIndex}`, true, { g: 10 }),
      option(`middle-${clauseIndex}`, false, { g: 20 }, 1),
      option(`high-${clauseIndex}`, false, { g: 30 }, 2),
    ],
  }));
  const result = findSmallestAgreement(proposal({ threshold: 100, clauses }), { nearMissLimit: 5 });
  assert.equal(result.status, "infeasible");
  assert.equal(result.possibleCombinations, 19_683);
  assert.equal(result.nearMisses.length, 5);
  assert.ok(result.nearMisses.every((candidate, index, list) => index === 0 || list[index - 1].approval >= candidate.approval));
});

function constrainedProposal() {
  return proposal({
    threshold: 70,
    groups: [{ id: "majority", name: "Majority", weight: 9 }, { id: "minority", name: "Minority", weight: 1 }],
    clauses: [{ id: "access", title: "Access", options: [
      option("original", true, { majority: 80, minority: 10 }),
      option("cheap", false, { majority: 90, minority: 30 }, 1),
      option("balanced", false, { majority: 75, minority: 75 }, 3),
    ] }],
  });
}

test("a protected group's floor prevents an already-passing majority from bypassing it", () => {
  const input = constrainedProposal();
  assert.equal(findSmallestAgreement(input).status, "already_passing");
  input.groups[1].minSupport = 60;
  const result = findSmallestAgreement(input);
  assert.equal(result.status, "found");
  assert.equal(result.agreement.options[0].id, "balanced");
  assert.equal(result.baseline.constraints.met, false);
  assert.equal(result.agreement.constraints.floors[0].met, true);
  assert.equal(result.rejected.floors, 2);
  assert.equal(result.checkedCombinations, 3);
});

test("budget and floors jointly produce honest infeasibility without unsafe near misses", () => {
  const input = constrainedProposal();
  input.groups[1].minSupport = 60;
  input.maxChangeCost = 2;
  const result = findSmallestAgreement(input);
  assert.equal(result.status, "infeasible");
  assert.equal(result.agreement, null);
  assert.equal(result.eligibleCombinations, 0);
  assert.deepEqual(result.nearMisses, []);
  assert.deepEqual(result.rejected, { budget: 1, floors: 2, vetoes: 0, anyConstraint: 3 });
  const brief = formatDecisionBrief(input, result);
  assert.match(brief, /No permitted combination meets both/u);
  assert.match(brief, /Maximum total change cost: 2/u);
  assert.match(brief, /Minority: average support must be at least 60%/u);
  assert.doesNotMatch(brief, /short by -/u);
});

test("floor and budget boundaries are inclusive, zero budgets are real constraints", () => {
  const input = constrainedProposal();
  input.groups[1].minSupport = 75;
  input.maxChangeCost = 3;
  assert.equal(findSmallestAgreement(input).status, "found");
  input.maxChangeCost = 0;
  assert.equal(findSmallestAgreement(input).status, "infeasible");
  input.clauses[0].options[2].changeCost = 0;
  assert.equal(findSmallestAgreement(input).agreement.changeCost, 0);
  input.groups[1].minSupport = 0;
  assert.equal(findSmallestAgreement(input).status, "already_passing");
});

test("floors apply to a group's average across clauses, not each individual option", () => {
  const input = constrainedProposal();
  input.groups[1].minSupport = 60;
  input.clauses.push({ id: "second", title: "Second", lockedOptionId: "high", options: [
    option("original", true, { majority: 0, minority: 0 }),
    option("high", false, { majority: 80, minority: 90 }, 1),
    option("other", false, { majority: 30, minority: 0 }, 2),
  ] });
  const result = findSmallestAgreement(input);
  assert.equal(result.status, "found");
  assert.deepEqual(result.agreement.options.map(({ id }) => id), ["cheap", "high"]);
  assert.equal(result.agreement.constraints.floors[0].actual, 60);
});

test("locking an alternative rejects a passing original and includes its full cost", () => {
  const input = constrainedProposal();
  input.clauses[0].lockedOptionId = "balanced";
  const result = findSmallestAgreement(input);
  assert.equal(result.status, "found");
  assert.equal(result.possibleCombinations, 1);
  assert.equal(result.agreement.changeCost, 3);
  assert.equal(result.agreement.constraints.locks[0].met, true);
  assert.equal(result.baseline.constraints.locks[0].met, false);
  input.maxChangeCost = 2;
  assert.equal(findSmallestAgreement(input).status, "infeasible");
});

test("locks reduce the actual search space without raising the hard cap", () => {
  const input = constrainedProposal();
  input.clauses = Array.from({ length: 12 }, (_, i) => ({ ...structuredClone(input.clauses[0]), id: `c${i}`, lockedOptionId: "balanced" }));
  assert.equal(findSmallestAgreement(input).possibleCombinations, 1);
  assert.equal(findSmallestAgreement(input).agreement.changedClauseCount, 12);
  for (const clause of input.clauses) delete clause.lockedOptionId;
  assert.equal(findSmallestAgreement(input).status, "too_large");
  input.maxChangeCost = 0;
  assert.equal(findSmallestAgreement(input).status, "too_large");
});

test("near misses honor all constraints and rejection counts disclose overlap", () => {
  const input = constrainedProposal();
  input.threshold = 100;
  input.groups[1].minSupport = 20;
  input.maxChangeCost = 0;
  const result = findSmallestAgreement(input);
  assert.deepEqual(result.rejected, { budget: 2, floors: 1, vetoes: 0, anyConstraint: 3 });
  input.maxChangeCost = 2;
  input.groups[1].minSupport = 60;
  const overlapping = findSmallestAgreement(input);
  assert.equal(overlapping.rejected.anyConstraint, 3);
  input.maxChangeCost = 0;
  const overlap = findSmallestAgreement(input);
  assert.equal(overlap.rejected.budget + overlap.rejected.floors, 4);
  assert.equal(overlap.rejected.anyConstraint, 3);
  input.maxChangeCost = 3;
  const misses = findSmallestAgreement(input);
  assert.deepEqual(misses.nearMisses.map((miss) => miss.options[0].id), ["balanced"]);
  assert.ok(misses.nearMisses.every((miss) => miss.constraints.met && miss.approval < input.threshold));
});

test("invalid constraint types, references, and limits fail closed", () => {
  for (const value of [-1, 101, NaN, Infinity, null, "60", false, {}]) {
    const input = constrainedProposal();
    input.groups[1].minSupport = value;
    assert.equal(findSmallestAgreement(input).status, "invalid", `floor ${String(value)}`);
    assert.throws(() => canonicalProposal(input));
  }
  for (const value of [-1, 20_000_000_001, NaN, Infinity, null, "0", false, {}]) {
    const input = constrainedProposal();
    input.maxChangeCost = value;
    assert.equal(findSmallestAgreement(input).status, "invalid", `budget ${String(value)}`);
  }
  for (const value of [null, "missing", "", 0, {}, true]) {
    const input = constrainedProposal();
    input.clauses[0].lockedOptionId = value;
    assert.equal(findSmallestAgreement(input).status, "invalid", `lock ${String(value)}`);
  }
});

test("canonical import and JSON round trips preserve constraints without adding them to legacy drafts", () => {
  const legacy = constrainedProposal();
  assert.deepEqual(canonicalProposal(legacy), legacy);
  const input = constrainedProposal();
  input.maxChangeCost = 0;
  input.groups[1].minSupport = 0;
  input.clauses[0].lockedOptionId = "original";
  const clean = canonicalProposal(JSON.parse(JSON.stringify(input)));
  assert.deepEqual(clean, input);
  assert.deepEqual(findSmallestAgreement(clean), findSmallestAgreement(input));
});

test("constraint brief escapes names and reports actual checked count for early baseline return", () => {
  const input = constrainedProposal();
  input.groups[1].name = "<img src=x> | [Group](https://invalid.test)";
  input.groups[1].minSupport = 0;
  input.clauses[0].lockedOptionId = "original";
  const result = findSmallestAgreement(input);
  const brief = formatDecisionBrief(input, result);
  assert.match(brief, /Search combinations checked: 1/u);
  assert.match(brief, /Lock Access to "original"/u);
  assert.doesNotMatch(brief, /<img|\[Group\]\(/u);
  assert.match(brief, /&lt;img src=x&gt;/u);
  assert.doesNotMatch(brief, /[\u2013\u2014]/u);
  assert.equal(brief, formatDecisionBrief(input, result));
});

test("constrained search matches an independent Cartesian-product oracle across 128 synthetic cases", () => {
  let seed = 47319;
  const next = (limit) => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed % limit; };
  const rank = (a, b) => a.cost - b.cost || a.changed - b.changed || b.approval - a.approval || (a.ids.join("|") < b.ids.join("|") ? -1 : a.ids.join("|") > b.ids.join("|") ? 1 : 0);
  for (let sample = 0; sample < 128; sample += 1) {
    const input = proposal({ threshold: next(101), groups: [
      { id: "a", name: "A", weight: 1 + next(5), ...(sample % 2 ? { minSupport: next(101) } : {}) },
      { id: "b", name: "B", weight: 1 + next(5), ...(sample % 3 ? { minSupport: next(101) } : {}) },
    ], clauses: Array.from({ length: 3 }, (_, ci) => ({
      id: `c${ci}`, title: `Clause ${ci}`, ...(sample % 4 === ci ? { lockedOptionId: `o${next(3)}` } : {}),
      options: Array.from({ length: 3 }, (_, oi) => option(`o${oi}`, oi === 0, { a: next(101), b: next(101) }, oi === 0 ? 0 : next(8))),
    })) });
    if (sample % 3) input.maxChangeCost = next(15);
    let combinations = [[]];
    for (const clause of input.clauses) combinations = combinations.flatMap((selected) => clause.options.filter((o) => clause.lockedOptionId === undefined || clause.lockedOptionId === o.id).map((o) => [...selected, o]));
    const summarized = combinations.map((selected) => {
      const averages = input.groups.map((g) => selected.reduce((s, o) => s + o.support[g.id], 0) / selected.length);
      const approval = averages.reduce((s, score, i) => s + score * input.groups[i].weight, 0) / input.groups.reduce((s, g) => s + g.weight, 0);
      const cost = selected.reduce((s, o) => s + o.changeCost, 0);
      return { approval, cost, changed: selected.filter((o) => !o.original).length, ids: selected.map((o) => o.id), eligible: averages.every((score, i) => input.groups[i].minSupport === undefined || score + 1e-9 >= input.groups[i].minSupport) && (input.maxChangeCost === undefined || cost <= input.maxChangeCost + 1e-9) };
    });
    const feasible = summarized.filter((s) => s.eligible && s.approval + 1e-9 >= input.threshold).sort(rank);
    const actual = findSmallestAgreement(input);
    assert.equal(actual.possibleCombinations, combinations.length, `sample ${sample}`);
    assert.deepEqual(actual.agreement?.options.map((o) => o.id) ?? null, feasible[0]?.ids ?? null, `sample ${sample}`);
    assert.equal(actual.status, feasible.length ? feasible[0].changed === 0 ? "already_passing" : "found" : "infeasible");
    if (actual.status !== "already_passing") {
      assert.equal(actual.eligibleCombinations, summarized.filter((s) => s.eligible).length);
      assert.equal(actual.rejected.anyConstraint, summarized.filter((s) => !s.eligible).length);
      const expectedMisses = summarized.filter((s) => s.eligible && s.approval + 1e-9 < input.threshold).sort((a, b) => b.approval - a.approval || rank(a, b)).slice(0, 5);
      assert.deepEqual(actual.nearMisses.map((s) => s.options.map((o) => o.id)), expectedMisses.map((s) => s.ids));
    }
  }
});


test("passing alternatives are complete, deterministically ranked, and respect floors and budget", () => {
  const input = proposal({ threshold: 50, clauses: [{ id: "one", title: "One", options: [
    option("original", true, { g: 60 }), option("better", false, { g: 90 }, 2), option("cheap", false, { g: 70 }, 1),
  ] }] });
  const result = findSmallestAgreement(input, { alternativesLimit: 5 });
  assert.equal(result.status, "already_passing");
  assert.equal(result.checkedCombinations, 3);
  assert.equal(result.passingCombinations, 3);
  assert.deepEqual(result.alternatives.map(row => row.options[0].id), ["original", "cheap", "better"]);
  input.groups[0].minSupport = 65;
  input.maxChangeCost = 1;
  const constrained = findSmallestAgreement(input, { alternativesLimit: 5 });
  assert.deepEqual(constrained.alternatives.map(row => row.options[0].id), ["cheap"]);
  for (const limit of [-1, 6, 1.5, "3"]) assert.equal(findSmallestAgreement(input, { alternativesLimit: limit }).status, "invalid");
});


test("custom packages evaluate all constraints without changing the draft", () => {
  const input = proposal({ clauses: [{ id: "one", title: "One", lockedOptionId: "better", options: [
    option("original", true, { g: 80 }), option("better", false, { g: 90 }, 2), option("cheap", false, { g: 75 }, 1),
  ] }] });
  const before = JSON.stringify(input);
  assert.equal(evaluatePackage(input, ["original"]).status, "not_passing");
  assert.equal(evaluatePackage(input, ["better"]).status, "passing");
  assert.equal(evaluatePackage(input, ["missing"]).status, "invalid");
  assert.equal(evaluatePackage(input, []).status, "invalid");
  assert.equal(JSON.stringify(input), before);
  input.maxChangeCost = 1;
  assert.equal(evaluatePackage(input, ["better"]).status, "not_passing");
});


test("pinned package comparison shows original, solver, and custom columns without mutating the draft", () => {
  const input = proposal({
    threshold: 70,
    clauses: [{ id: "one", title: "Hours", options: [
      option("original", true, { g: 40 }), option("better", false, { g: 90 }, 2), option("cheap", false, { g: 75 }, 1),
    ] }],
  });
  const before = JSON.stringify(input);
  const pinned = comparePinnedPackages(input, ["better"], ["cheap"]);
  assert.equal(pinned.status, "ok");
  assert.equal(pinned.clauses[0].original.optionId, "original");
  assert.equal(pinned.clauses[0].recommended.optionId, "better");
  assert.equal(pinned.clauses[0].custom.optionId, "cheap");
  assert.equal(pinned.originalCost, 0);
  assert.equal(pinned.recommendedCost, 2);
  assert.equal(pinned.customCost, 1);
  assert.equal(pinned.recommendedApproval, 90);
  assert.equal(pinned.customApproval, 75);
  assert.equal(pinned.groups[0].original, 40);
  assert.equal(pinned.groups[0].recommended, 90);
  assert.equal(pinned.groups[0].custom, 75);
  const withoutRecommended = comparePinnedPackages(input, null, ["original"]);
  assert.equal(withoutRecommended.status, "ok");
  assert.equal(withoutRecommended.clauses[0].recommended, null);
  assert.equal(withoutRecommended.recommendedApproval, null);
  assert.equal(comparePinnedPackages(input, ["missing"], ["original"]).status, "invalid");
  assert.equal(comparePinnedPackages(input, ["better"], ["missing"]).status, "invalid");
  assert.equal(JSON.stringify(input), before);
});


test("duplicateParticipantGroup copies weight, constraints, and support keys with a unique id", () => {
  const input = proposal({
    groups: [
      { id: "majority", name: "Majority", weight: 9 },
      { id: "minority", name: "Minority", weight: 1, minSupport: 60, veto: true },
    ],
    clauses: [{ id: "one", title: "One", options: [
      option("original", true, { majority: 80, minority: 10 }),
      option("cheap", false, { majority: 90, minority: 30 }, 1),
      option("balanced", false, { majority: 75, minority: 75 }, 3),
    ] }],
  });
  const before = JSON.stringify(input);
  const duplicated = duplicateParticipantGroup(input, "minority");
  assert.equal(duplicated.status, "ok");
  assert.equal(duplicated.proposal.groups.length, 3);
  const copy = duplicated.proposal.groups[2];
  assert.equal(copy.id, "group-copy-1");
  assert.equal(copy.id === "minority", false);
  assert.equal(copy.name, "Minority (copy)");
  assert.equal(copy.weight, 1);
  assert.equal(copy.minSupport, 60);
  assert.equal(copy.veto, true);
  for (const option of duplicated.proposal.clauses[0].options) {
    assert.equal(option.support[copy.id], option.support.minority);
    assert.equal(Object.hasOwn(option.support, copy.id), true);
  }
  assert.equal(validateProposal(duplicated.proposal).valid, true);
  assert.equal(JSON.stringify(input), before);
  assert.equal(duplicateParticipantGroup(input, "missing").status, "invalid");
  const capped = structuredClone(input);
  capped.groups = Array.from({ length: MAX_GROUPS }, (_, index) => ({ id: `g${index}`, name: `Group ${index}`, weight: 1 }));
  for (const option of capped.clauses[0].options) {
    option.support = Object.fromEntries(capped.groups.map((group) => [group.id, 50]));
  }
  assert.equal(duplicateParticipantGroup(capped, "g0").status, "invalid");
});

test("lockPackage sets every clause lock in one copy and rejects unknown options", () => {
  const input = proposal({
    threshold: 70,
    clauses: [
      { id: "one", title: "One", options: [
        option("one-original", true, { g: 40 }), option("one-change", false, { g: 90 }, 2), option("one-other", false, { g: 20 }, 8),
      ] },
      { id: "two", title: "Two", options: [
        option("two-original", true, { g: 40 }), option("two-change", false, { g: 90 }, 1), option("two-other", false, { g: 20 }, 8),
      ] },
    ],
  });
  const before = JSON.stringify(input);
  const locked = lockPackage(input, ["one-change", "two-change"]);
  assert.equal(locked.status, "ok");
  assert.deepEqual(locked.proposal.clauses.map((clause) => clause.lockedOptionId), ["one-change", "two-change"]);
  assert.equal(JSON.stringify(input), before);
  const searched = findSmallestAgreement(locked.proposal);
  assert.equal(searched.possibleCombinations, 1);
  assert.deepEqual(searched.agreement.options.map((option) => option.id), ["one-change", "two-change"]);
  assert.equal(lockPackage(input, ["one-change"]).status, "invalid");
  assert.equal(lockPackage(input, ["missing", "two-change"]).status, "invalid");
  assert.equal(lockPackage(input, ["one-change", "one-change"]).status, "invalid");
});

test("clearAllLocks removes every clause lock in one copy and rejects invalid drafts", () => {
  const input = proposal({
    threshold: 70,
    clauses: [
      { id: "one", title: "One", lockedOptionId: "one-change", options: [
        option("one-original", true, { g: 40 }), option("one-change", false, { g: 90 }, 2), option("one-other", false, { g: 20 }, 8),
      ] },
      { id: "two", title: "Two", lockedOptionId: "two-original", options: [
        option("two-original", true, { g: 40 }), option("two-change", false, { g: 90 }, 1), option("two-other", false, { g: 20 }, 8),
      ] },
    ],
  });
  const before = JSON.stringify(input);
  const cleared = clearAllLocks(input);
  assert.equal(cleared.status, "ok");
  assert.equal(cleared.cleared, 2);
  assert.equal(cleared.proposal.clauses.every((clause) => Object.hasOwn(clause, "lockedOptionId") === false), true);
  assert.equal(JSON.stringify(input), before);
  assert.equal(clearAllLocks(cleared.proposal).cleared, 0);
  assert.equal(clearAllLocks({ title: "" }).status, "invalid");
});

test("toggleClauseLock locks or unlocks one option on a copy and rejects unknown ids", () => {
  const input = proposal({
    threshold: 70,
    clauses: [{ id: "one", title: "One", options: [
      option("one-original", true, { g: 40 }), option("one-change", false, { g: 90 }, 2), option("one-other", false, { g: 20 }, 8),
    ] }],
  });
  const before = JSON.stringify(input);
  const locked = toggleClauseLock(input, "one", "one-change");
  assert.equal(locked.status, "ok");
  assert.equal(locked.locked, true);
  assert.equal(locked.proposal.clauses[0].lockedOptionId, "one-change");
  assert.equal(JSON.stringify(input), before);
  const switched = toggleClauseLock(locked.proposal, "one", "one-other");
  assert.equal(switched.proposal.clauses[0].lockedOptionId, "one-other");
  const unlocked = toggleClauseLock(switched.proposal, "one", "one-other");
  assert.equal(unlocked.locked, false);
  assert.equal(Object.hasOwn(unlocked.proposal.clauses[0], "lockedOptionId"), false);
  assert.equal(toggleClauseLock(input, "missing", "one-change").status, "invalid");
  assert.equal(toggleClauseLock(input, "one", "missing").status, "invalid");
});

test("moveClause reorders clauses for the documented tie breaker without mutating the draft", () => {
  const input = proposal({
    threshold: 70,
    clauses: [
      { id: "one", title: "One", options: [
        option("one-keep", true, { g: 40 }),
        option("aaa", false, { g: 80 }, 1),
        option("zzz", false, { g: 80 }, 1),
      ] },
      { id: "two", title: "Two", options: [
        option("two-keep", true, { g: 40 }),
        option("mmm", false, { g: 80 }, 1),
        option("nnn", false, { g: 80 }, 1),
      ] },
    ],
  });
  const before = JSON.stringify(input);
  const first = findSmallestAgreement(input);
  assert.equal(first.status, "found");
  assert.deepEqual(first.agreement.options.map((row) => row.id), ["aaa", "mmm"]);
  const moved = moveClause(input, "two", "up");
  assert.equal(moved.status, "ok");
  assert.deepEqual(moved.proposal.clauses.map((clause) => clause.id), ["two", "one"]);
  assert.equal(JSON.stringify(input), before);
  const after = findSmallestAgreement(moved.proposal);
  assert.equal(after.status, "found");
  assert.deepEqual(after.agreement.options.map((row) => row.id), ["mmm", "aaa"]);
  assert.equal(moveClause(input, "one", "up").status, "invalid");
  assert.equal(moveClause(input, "two", "down").status, "invalid");
  assert.equal(moveClause(input, "missing", "down").status, "invalid");
  assert.equal(moveClause(input, "one", "sideways").status, "invalid");
});

test("vetoBlockingGroups names groups whose veto fails on the inspected package", () => {
  const input = proposal({
    threshold: 80,
    groups: [
      { id: "majority", name: "Majority", weight: 9 },
      { id: "minority", name: "Minority", weight: 1, veto: true },
    ],
    clauses: [{ id: "one", title: "One", options: [
      option("original", true, { majority: 90, minority: 20 }),
      option("alt", false, { majority: 70, minority: 85 }, 1),
      option("other", false, { majority: 60, minority: 90 }, 2),
    ] }],
  });
  const before = JSON.stringify(input);
  const blocked = vetoBlockingGroups(input, [input.clauses[0].options[0]]);
  assert.equal(blocked.status, "ok");
  assert.equal(blocked.groups.length, 1);
  assert.equal(blocked.groups[0].id, "minority");
  assert.equal(blocked.groups[0].required, 80);
  assert.ok(blocked.groups[0].actual < 80);
  const cleared = vetoBlockingGroups(input, [input.clauses[0].options[1]]);
  assert.equal(cleared.groups.length, 0);
  assert.equal(JSON.stringify(input), before);
  assert.equal(vetoBlockingGroups(input, []).status, "invalid");
});

test("renormalized weights preview then apply so weights sum to 1 and reject invalid weights", () => {
  const input = proposal({
    groups: [{ id: "a", name: "A", weight: 3 }, { id: "b", name: "B", weight: 1 }],
    clauses: [{ id: "one", title: "One", options: [
      option("original", true, { a: 40, b: 50 }),
      option("alternative", false, { a: 70, b: 80 }, 1),
      option("other", false, { a: 10, b: 20 }, 2),
    ] }],
  });
  const before = JSON.stringify(input);
  const preview = previewRenormalizedWeights(input);
  assert.equal(preview.status, "ok");
  assert.equal(preview.total, 4);
  assert.equal(preview.nextTotal, 1);
  assert.equal(preview.rows[0].next, 0.75);
  assert.equal(preview.rows[1].next, 0.25);
  assert.equal(JSON.stringify(input), before);
  const applied = applyRenormalizedWeights(input);
  assert.equal(applied.status, "ok");
  assert.equal(applied.proposal.groups.reduce((sum, group) => sum + group.weight, 0), 1);
  assert.equal(applied.proposal.groups[0].weight, 0.75);
  const uneven = structuredClone(applied.proposal);
  uneven.groups = [{ id: "a", name: "A", weight: 3 }, { id: "b", name: "B", weight: 2 }, { id: "c", name: "C", weight: 2 }];
  for (const option of uneven.clauses[0].options) option.support = { a: 50, b: 50, c: 50 };
  const evened = applyRenormalizedWeights(uneven);
  assert.equal(evened.proposal.groups.reduce((sum, group) => sum + group.weight, 0), 1);
  assert.equal(JSON.stringify(input), before);
  input.groups[0].weight = 0;
  assert.equal(previewRenormalizedWeights(input).status, "invalid");
  assert.equal(applyRenormalizedWeights(input).status, "invalid");
});


test("downside stress tests preserve inputs and expose protected-group failures", () => {
  const input = proposal({ threshold: 50, groups: [{ id: "a", name: "A", weight: 9 }, { id: "b", name: "B", weight: 1, minSupport: 70 }], clauses: [{ id: "one", title: "One", options: [
    option("original", true, { a: 90, b: 80 }), option("other", false, { a: 80, b: 80 }, 1), option("third", false, { a: 70, b: 75 }, 2),
  ] }] });
  const before = JSON.stringify(input);
  assert.equal(stressPackage(input, ["original"], 10).status, "passing");
  const failed = stressPackage(input, ["original"], 11);
  assert.equal(failed.status, "not_passing");
  assert.ok(failed.summary.approval > input.threshold);
  assert.equal(failed.summary.constraints.floors[0].met, false);
  assert.equal(stressPackage(input, ["original"], 100).summary.approval, 0);
  for (const drop of [-1, 101, NaN, "5"]) assert.equal(stressPackage(input, ["original"], drop).status, "invalid");
  assert.equal(JSON.stringify(input), before);
});


test("scenario comparison identifies input changes and does not invent unchanged fields", () => {
  const input = proposal({ clauses: [{ id: "one", title: "One", options: [
    option("original", true, { g: 60 }), option("better", false, { g: 90 }, 2), option("cheap", false, { g: 70 }, 1),
  ] }] });
  assert.deepEqual(compareScenarioInputs(input, structuredClone(input)), []);
  const after = structuredClone(input);
  after.threshold = 80;
  after.groups[0].minSupport = 60;
  after.clauses[0].options[1].support.g = 85;
  const changes = compareScenarioInputs(input, after);
  assert.equal(changes.length, 3);
  assert.ok(changes.some(row => row.field === "Approval threshold" && row.before === 70 && row.after === 80));
  assert.ok(changes.some(row => row.field.includes("minimum support") && row.before === undefined));
  assert.ok(changes.some(row => row.before === 90 && row.after === 85));
});


test("evidence CSV includes every input and protects spreadsheet text cells", () => {
  const input = proposal({ clauses: [{ id: "one", title: 'Clause, "quoted"', options: [
    option("original", true, { g: 60 }), option("better", false, { g: 90 }, 2), option("cheap", false, { g: 70 }, 1),
  ] }] });
  input.title = '=HYPERLINK("unsafe")';
  input.groups[0].name = '  +SUM(1,2)';
  input.groups[0].minSupport = 65;
  input.maxChangeCost = 1;
  const csv = formatEvidenceCsv(input);
  assert.equal(csv.split("\r\n").length, 5);
  assert.ok(csv.includes("\"'=HYPERLINK(\"\"unsafe\"\")\""));
  assert.ok(csv.includes("\"'  +SUM(1,2)\""));
  assert.ok(csv.includes('Clause, ""quoted""'));
  assert.ok(csv.includes('"minimum_support","veto","support"'));
  assert.ok(csv.includes('"cheap","cheap","no","yes","1"'));
  assert.equal(csv, formatEvidenceCsv(input));
});


test("CSV neutralizes formula prefixes behind ASCII controls and leading spreadsheet separators", () => {
  const input = proposal({ clauses: [{ id: "one", title: "One", options: [
    option("original", true, { g: 60 }), option("better", false, { g: 90 }, 2), option("cheap", false, { g: 70 }, 1),
  ] }] });
  for (let code = 0; code <= 31; code += 1) {
    input.title = String.fromCharCode(code) + "=SUM(1,2)";
    assert.ok(formatEvidenceCsv(input).includes('"' + "'" + input.title + '"'), "ASCII control " + code);
  }
  for (const prefix of ["\t", "\r", "\n"]) {
    input.title = prefix + "ordinary text";
    assert.ok(formatEvidenceCsv(input).includes('"' + "'" + input.title + '"'));
  }
});

test("clause contributions report weighted support and equal overall pull versus originals", () => {
  const groups = [{ id: "a", name: "A", weight: 1 }, { id: "b", name: "B", weight: 3 }];
  const input = proposal({
    groups,
    clauses: [
      { id: "one", title: "One", options: [
        option("one-original", true, { a: 100, b: 40 }),
        option("one-change", false, { a: 80, b: 80 }, 1),
        option("one-other", false, { a: 0, b: 0 }, 2),
      ] },
      { id: "two", title: "Two", options: [
        option("two-original", true, { a: 20, b: 20 }),
        option("two-change", false, { a: 100, b: 100 }, 1),
        option("two-other", false, { a: 0, b: 0 }, 2),
      ] },
    ],
  });
  const originals = [input.clauses[0].options[0], input.clauses[1].options[0]];
  const selected = [input.clauses[0].options[1], input.clauses[1].options[1]];
  assert.equal(clauseWeightedSupport(groups, originals[0]), 55);
  const original = clauseContributions(input, originals);
  assert.equal(original.status, "ok");
  assert.equal(original.rows[0].delta, 0);
  assert.equal(original.rows[0].overallPull, 0);
  assert.equal(original.overallApproval, original.originalApproval);

  const changed = clauseContributions(input, selected);
  assert.equal(changed.status, "ok");
  assert.equal(changed.rows[0].selectedSupport, 80);
  assert.equal(changed.rows[0].originalSupport, 55);
  assert.equal(changed.rows[0].delta, 25);
  assert.equal(changed.rows[0].overallPull, 12.5);
  assert.equal(changed.rows[1].delta, 80);
  assert.equal(changed.rows[1].overallPull, 40);
  const pullSum = changed.rows.reduce((sum, row) => sum + row.overallPull, 0);
  assert.equal(Number((changed.overallApproval - changed.originalApproval).toFixed(10)), Number(pullSum.toFixed(10)));
  const snapshot = proposal({ groups, clauses: input.clauses });
  assert.equal(JSON.stringify(input), JSON.stringify(snapshot));
});

test("clause contributions reject mismatched packages without mutating the proposal", () => {
  const input = proposal({ clauses: [{ id: "one", title: "One", options: [
    option("original", true, { g: 50 }), option("alternative", false, { g: 80 }, 1), option("other", false, { g: 70 }, 2),
  ] }] });
  const before = JSON.stringify(input);
  assert.equal(clauseContributions(input, []).status, "invalid");
  assert.equal(clauseContributions(input, [{ id: "missing" }]).status, "invalid");
  assert.equal(JSON.stringify(input), before);
});

test("package gap explorer names cheaper misses and the next packages over threshold", () => {
  const input = proposal({
    threshold: 80,
    clauses: [{ id: "one", title: "One", options: [
      option("original", true, { g: 40 }),
      option("near", false, { g: 70 }, 1),
      option("pass", false, { g: 90 }, 3),
    ] }],
  });
  const result = findSmallestAgreement(input, { alternativesLimit: 5 });
  assert.equal(result.status, "found");
  const gaps = explorePackageGaps(input, result);
  assert.equal(gaps.status, "ok");
  assert.equal(gaps.recommended.changeCost, 3);
  assert.ok(gaps.cheaperMisses.some((row) => row.labels.includes("near") && row.approvalGap > 0 && row.changeCost === 1));
  assert.ok(gaps.cheaperMisses.every((row) => Array.isArray(row.optionIds) && row.optionIds.length === 1));
  assert.ok(gaps.closestMisses.every((row) => row.approvalGap > 0 && row.meetsThreshold === false));
  assert.equal(gaps.nextOverThreshold.length, 0);
  const extra = proposal({
    threshold: 50,
    clauses: [{ id: "one", title: "One", options: [
      option("original", true, { g: 60 }),
      option("cheap", false, { g: 70 }, 1),
      option("better", false, { g: 90 }, 2),
    ] }],
  });
  const passing = findSmallestAgreement(extra, { alternativesLimit: 5 });
  const over = explorePackageGaps(extra, passing);
  assert.ok(over.nextOverThreshold.length >= 1);
  assert.ok(over.nextOverThreshold.every((row) => row.meetsThreshold && row.approvalGap <= 0));
  assert.ok(over.nextOverThreshold.every((row) => row.costVsRecommended > 0 || row.changedClauseCount > 0));
});

test("near-miss rows can be sorted by approval gap or change cost without mutating the list", () => {
  const input = proposal({
    threshold: 90,
    clauses: [{ id: "one", title: "One", options: [
      option("original", true, { g: 40 }),
      option("cheap", false, { g: 50 }, 1),
      option("near", false, { g: 80 }, 5),
    ] }],
  });
  const result = findSmallestAgreement(input);
  const gaps = explorePackageGaps(input, result);
  const snapshot = JSON.stringify(gaps.closestMisses);
  const byGap = sortPackageGapRows(gaps.closestMisses, "approval_gap");
  const byCost = sortPackageGapRows(gaps.closestMisses, "change_cost");
  assert.equal(byGap.status, "ok");
  assert.equal(byCost.status, "ok");
  assert.equal(byGap.rows[0].changeCost, 5);
  assert.equal(byGap.rows[0].approval, 80);
  assert.equal(byCost.rows[0].changeCost, 0);
  assert.ok(byCost.rows.findIndex((row) => row.changeCost === 1) < byCost.rows.findIndex((row) => row.changeCost === 5));
  assert.equal(JSON.stringify(gaps.closestMisses), snapshot);
  assert.equal(sortPackageGapRows(gaps.closestMisses, "fairness").status, "invalid");
  assert.equal(sortPackageGapRows(null, "approval_gap").status, "invalid");
});

test("veto groups require threshold support and leave old JSON valid without the field", () => {
  const input = constrainedProposal();
  assert.equal(findSmallestAgreement(input).status, "already_passing");
  assert.equal(Object.hasOwn(canonicalProposal(input).groups[1], "veto"), false);
  input.groups[1].veto = false;
  assert.equal(validateProposal(input).valid, true);
  assert.equal(Object.hasOwn(canonicalProposal(input).groups[1], "veto"), false);
  input.groups[1].veto = true;
  const result = findSmallestAgreement(input);
  assert.equal(result.status, "found");
  assert.equal(result.agreement.options[0].id, "balanced");
  assert.equal(result.baseline.constraints.vetoes[0].met, false);
  assert.equal(result.agreement.constraints.vetoes[0].required, 70);
  assert.ok(result.rejected.vetoes >= 1);
  const brief = formatDecisionBrief(input, result);
  assert.match(brief, /has a veto/u);
  assert.doesNotMatch(brief, /[\u2013\u2014]/u);
  input.groups[1].minSupport = 80;
  const stricter = findSmallestAgreement(input);
  assert.equal(stricter.status, "infeasible");
  assert.equal(stricter.baseline.constraints.vetoes[0].required, 80);
  for (const value of [null, "true", 1, {}, []]) {
    const bad = constrainedProposal();
    bad.groups[1].veto = value;
    assert.equal(findSmallestAgreement(bad).status, "invalid", `veto ${String(value)}`);
  }
});

test("support matrix CSV round-trips scores and names formula, identity, and header errors", () => {
  const input = proposal({
    groups: [{ id: "a", name: "A", weight: 1 }, { id: "b", name: "B", weight: 2 }],
    clauses: [{ id: "one", title: "One", options: [
      option("original", true, { a: 40, b: 50 }),
      option("alternative", false, { a: 70, b: 80 }, 1),
      option("other", false, { a: 10, b: 20 }, 2),
    ] }],
  });
  const csv = formatSupportMatrixCsv(input);
  const parsed = parseSupportMatrixCsv(csv, input);
  assert.equal(parsed.status, "ok");
  assert.deepEqual(parsed.proposal, canonicalProposal(input));
  assert.equal(JSON.stringify(input.clauses[0].options[0].support), JSON.stringify({ a: 40, b: 50 }));

  const edited = parseSupportMatrixCsv("clause_id,option_id,a,b\r\none,original,55,65\r\n", input);
  assert.equal(edited.status, "ok");
  assert.equal(edited.proposal.clauses[0].options[0].support.a, 55);
  assert.equal(input.clauses[0].options[0].support.a, 40);

  const apostrophe = parseSupportMatrixCsv("clause_id,option_id,a,b\r\none,original,'60,'70\r\n", input);
  assert.equal(apostrophe.status, "ok");
  assert.equal(apostrophe.proposal.clauses[0].options[0].support.a, 60);

  const formula = parseSupportMatrixCsv("clause_id,option_id,a,b\r\none,original,=SUM(1),50\r\n", input);
  assert.equal(formula.status, "invalid");
  assert.equal(formula.errors[0].code, "formula_cell");

  const unknown = parseSupportMatrixCsv("clause_id,option_id,a,b\r\nmissing,original,1,2\r\n", input);
  assert.equal(unknown.errors[0].code, "unknown_clause");
  const missingOption = parseSupportMatrixCsv("clause_id,option_id,a,b\r\none,nope,1,2\r\n", input);
  assert.equal(missingOption.errors[0].code, "unknown_option");
  const extra = parseSupportMatrixCsv("clause_id,option_id,a,b,hidden\r\none,original,1,2,3\r\n", input);
  assert.equal(extra.errors[0].code, "unknown_group_column");
  const header = parseSupportMatrixCsv("option_id,a,b\r\n", input);
  assert.equal(header.errors[0].code, "missing_clause_id_column");
  const empty = parseSupportMatrixCsv("   ", input);
  assert.equal(empty.errors[0].code, "empty_csv");
  const score = parseSupportMatrixCsv("clause_id,option_id,a,b\r\none,original,101,0\r\n", input);
  assert.equal(score.errors[0].code, "invalid_score");
});

test("participant groups CSV replaces groups with named errors for unknown columns and bad values", () => {
  const input = proposal({
    groups: [{ id: "a", name: "A", weight: 1 }, { id: "b", name: "B", weight: 2, minSupport: 40, veto: true }],
    clauses: [{ id: "one", title: "One", options: [
      option("original", true, { a: 40, b: 50 }),
      option("alternative", false, { a: 70, b: 80 }, 1),
      option("other", false, { a: 10, b: 20 }, 2),
    ] }],
  });
  const before = JSON.stringify(input);
  const csv = formatParticipantGroupsCsv(input);
  const parsed = parseParticipantGroupsCsv(csv, input);
  assert.equal(parsed.status, "ok");
  assert.equal(parsed.importedGroups, 2);
  assert.equal(parsed.proposal.groups[0].name, "A");
  assert.equal(parsed.proposal.groups[1].veto, true);
  assert.equal(parsed.proposal.groups[1].minSupport, 40);
  assert.equal(parsed.proposal.clauses[0].options[0].support[parsed.proposal.groups[0].id], 40);
  assert.equal(JSON.stringify(input), before);

  const replacement = parseParticipantGroupsCsv("name,weight,min_support,veto,one:original,one:alternative,one:other\r\nResidents,3,,yes,90,80,70\r\n", input);
  assert.equal(replacement.status, "ok");
  assert.equal(replacement.importedGroups, 1);
  assert.equal(replacement.proposal.groups[0].id, "residents");
  assert.equal(replacement.proposal.groups[0].weight, 3);
  assert.equal(replacement.proposal.groups[0].veto, true);
  assert.equal(Object.hasOwn(replacement.proposal.groups[0], "minSupport"), false);
  assert.equal(replacement.proposal.clauses[0].options[0].support.residents, 90);

  const unknown = parseParticipantGroupsCsv("name,weight,hidden,one:original,one:alternative,one:other\r\nA,1,x,1,2,3\r\n", input);
  assert.equal(unknown.status, "invalid");
  assert.equal(unknown.errors[0].code, "unknown_column");
  const missing = parseParticipantGroupsCsv("name,weight\r\nA,1\r\n", input);
  assert.equal(missing.errors.some((error) => error.code === "missing_support_column"), true);
  const badWeight = parseParticipantGroupsCsv("name,weight,one:original,one:alternative,one:other\r\nA,0,1,2,3\r\n", input);
  assert.equal(badWeight.errors[0].code, "invalid_weight");
  const badVeto = parseParticipantGroupsCsv("name,weight,veto,one:original,one:alternative,one:other\r\nA,1,maybe,1,2,3\r\n", input);
  assert.equal(badVeto.errors[0].code, "invalid_veto");
  const formula = parseParticipantGroupsCsv("name,weight,one:original,one:alternative,one:other\r\nA,=SUM(1),1,2,3\r\n", input);
  assert.equal(formula.errors[0].code, "formula_cell");
  assert.equal(parseParticipantGroupsCsv("   ", input).errors[0].code, "empty_csv");
  const tsv = parseParticipantGroupsCsv("name\tweight\tmin_support\tveto\tone:original\tone:alternative\tone:other\nStallholders\t2\t\tno\t90\t80\t70\n", input);
  assert.equal(tsv.status, "ok");
  assert.equal(tsv.importedGroups, 1);
  assert.equal(tsv.proposal.groups[0].name, "Stallholders");
  const partial = parseParticipantGroupsCsv("name,weight,one:original,one:alternative,one:other\r\nGood,1,90,80,70\r\nBad,nope,1,2,3\r\n", input);
  assert.equal(partial.status, "invalid");
  assert.equal(partial.errors[0].code, "invalid_weight");
});

test("clause options CSV replaces clauses with named errors and keeps matching support scores", () => {
  const input = proposal({
    groups: [{ id: "a", name: "A", weight: 1 }, { id: "b", name: "B", weight: 2 }],
    clauses: [{ id: "one", title: "One", lockedOptionId: "alternative", note: "Ask first", options: [
      option("original", true, { a: 40, b: 50 }),
      option("alternative", false, { a: 70, b: 80 }, 1),
      option("other", false, { a: 10, b: 20 }, 2),
    ] }],
  });
  const before = JSON.stringify(input);
  const csv = formatClauseOptionsCsv(input);
  assert.equal(csv.status, "ok");
  const parsed = parseClauseOptionsCsv(csv.csv, input);
  assert.equal(parsed.status, "ok");
  assert.equal(parsed.importedClauses, 1);
  assert.equal(parsed.importedOptions, 3);
  assert.equal(parsed.proposal.clauses[0].title, "One");
  assert.equal(parsed.proposal.clauses[0].lockedOptionId, "alternative");
  assert.equal(parsed.proposal.clauses[0].note, "Ask first");
  assert.equal(parsed.proposal.clauses[0].options[0].support.a, 40);
  assert.equal(JSON.stringify(input), before);

  const renamed = parseClauseOptionsCsv("clause_id,option_id,clause_title,option_label,original,change_cost,note,locked\r\none,original,Hours,Keep close,yes,0,Check lighting,no\r\none,alternative,Hours,Seasonal,no,2,,yes\r\none,other,Hours,Pilot,no,3,,no\r\n", input);
  assert.equal(renamed.status, "ok");
  assert.equal(renamed.proposal.clauses[0].title, "Hours");
  assert.equal(renamed.proposal.clauses[0].options[1].label, "Seasonal");
  assert.equal(renamed.proposal.clauses[0].options[1].changeCost, 2);
  assert.equal(renamed.proposal.clauses[0].lockedOptionId, "alternative");
  assert.equal(renamed.proposal.clauses[0].options[0].support.b, 50);
  assert.equal(renamed.proposal.clauses[0].note, "Check lighting");

  const fresh = parseClauseOptionsCsv("clause_id,option_id,clause_title,option_label,original,change_cost\r\ntwo,keep,Path,Keep lamps,yes,0\r\ntwo,warm,Path,Warm lights,no,3\r\ntwo,motion,Path,Motion lights,no,4\r\n", input);
  assert.equal(fresh.status, "ok");
  assert.equal(fresh.proposal.clauses[0].id, "two");
  assert.equal(fresh.proposal.clauses[0].options[1].support.a, 50);
  assert.equal(fresh.proposal.groups.length, 2);

  const unknown = parseClauseOptionsCsv("clause_id,option_id,clause_title,option_label,original,change_cost,hidden\r\none,original,One,original,yes,0,x\r\n", input);
  assert.equal(unknown.status, "invalid");
  assert.equal(unknown.errors[0].code, "unknown_column");
  const formula = parseClauseOptionsCsv("clause_id,option_id,clause_title,option_label,original,change_cost\r\none,original,=SUM(1),Keep,yes,0\r\none,alternative,One,Alt,no,1\r\none,other,One,Other,no,2\r\n", input);
  assert.equal(formula.errors[0].code, "formula_cell");
  const missingOriginal = parseClauseOptionsCsv("clause_id,option_id,clause_title,option_label,original,change_cost\r\none,original,One,Keep,no,0\r\none,alternative,One,Alt,no,1\r\none,other,One,Other,no,2\r\n", input);
  assert.equal(missingOriginal.errors[0].code, "missing_original");
  const originalCost = parseClauseOptionsCsv("clause_id,option_id,clause_title,option_label,original,change_cost\r\none,original,One,Keep,yes,1\r\none,alternative,One,Alt,no,1\r\none,other,One,Other,no,2\r\n", input);
  assert.equal(originalCost.errors[0].code, "invalid_cost");
  const few = parseClauseOptionsCsv("clause_id,option_id,clause_title,option_label,original,change_cost\r\none,original,One,Keep,yes,0\r\none,alternative,One,Alt,no,1\r\n", input);
  assert.equal(few.errors[0].code, "too_few_options");
  assert.equal(parseClauseOptionsCsv("   ", input).errors[0].code, "empty_csv");
  assert.equal(formatClauseOptionsCsv({ title: "" }).status, "invalid");

  const tsv = parseClauseOptionsCsv("clause_id\toption_id\tclause_title\toption_label\toriginal\tchange_cost\none\toriginal\tHours\tKeep close\tyes\t0\none\talternative\tHours\tSeasonal\tno\t2\none\tother\tHours\tPilot\tno\t3\n", input);
  assert.equal(tsv.status, "ok");
  assert.equal(tsv.proposal.clauses[0].title, "Hours");
  assert.equal(tsv.proposal.clauses[0].options[1].label, "Seasonal");
  assert.equal(tsv.proposal.clauses[0].options[0].support.b, 50);
  const tsvUnknown = parseClauseOptionsCsv("clause_id\toption_id\tclause_title\toption_label\toriginal\tchange_cost\thidden\none\toriginal\tOne\toriginal\tyes\t0\tx\n", input);
  assert.equal(tsvUnknown.errors[0].code, "unknown_column");
});

test("locking an option for preview re-solves remaining clauses without mutating the draft", () => {
  const input = proposal({
    threshold: 70,
    clauses: [
      { id: "one", title: "One", options: [
        option("one-original", true, { g: 40 }),
        option("one-change", false, { g: 90 }, 2),
        option("one-other", false, { g: 20 }, 8),
      ] },
      { id: "two", title: "Two", options: [
        option("two-original", true, { g: 40 }),
        option("two-change", false, { g: 90 }, 1),
        option("two-other", false, { g: 20 }, 8),
      ] },
    ],
  });
  const before = JSON.stringify(input);
  const preview = previewLockedOption(input, "one", "one-change");
  assert.equal(preview.status, "preview");
  assert.equal(preview.result.status, "found");
  assert.equal(preview.result.agreement.options[0].id, "one-change");
  assert.equal(preview.result.agreement.options[1].id, "two-change");
  assert.equal(preview.proposal.clauses[0].lockedOptionId, "one-change");
  assert.equal(JSON.stringify(input), before);
  assert.equal(previewLockedOption(input, "missing", "one-change").status, "invalid");
  assert.equal(previewLockedOption(input, "one", "missing").status, "invalid");
});

test("leave-one-group-out omits a group from the weighted average without forecasting", () => {
  const input = proposal({
    groups: [{ id: "a", name: "A", weight: 1 }, { id: "b", name: "B", weight: 3 }],
    clauses: [{ id: "one", title: "One", options: [
      option("original", true, { a: 100, b: 0 }),
      option("alternative", false, { a: 50, b: 50 }, 1),
      option("other", false, { a: 0, b: 100 }, 2),
    ] }],
  });
  const selected = [input.clauses[0].options[0]];
  const before = JSON.stringify(input);
  const table = leaveOneGroupOut(input, selected);
  assert.equal(table.status, "ok");
  assert.equal(table.method, "omit");
  assert.equal(table.fullApproval, 25);
  assert.equal(table.rows[0].approval, 0);
  assert.equal(table.rows[1].approval, 100);
  assert.equal(table.rows[0].delta, -25);
  assert.equal(table.rows[1].delta, 75);
  assert.equal(JSON.stringify(input), before);
  const lone = proposal({
    groups: [{ id: "a", name: "A", weight: 1 }],
    clauses: [{ id: "one", title: "One", options: [
      option("original", true, { a: 80 }),
      option("alternative", false, { a: 90 }, 1),
      option("other", false, { a: 70 }, 2),
    ] }],
  });
  const alone = leaveOneGroupOut(lone, [lone.clauses[0].options[0]]);
  assert.equal(alone.status, "ok");
  assert.equal(alone.rows[0].approval, null);
});

test("group contributions weight each group's average by its share of total weight", () => {
  const input = proposal({
    groups: [{ id: "a", name: "A", weight: 1 }, { id: "b", name: "B", weight: 3 }],
    clauses: [{ id: "one", title: "One", options: [
      option("original", true, { a: 100, b: 0 }),
      option("alternative", false, { a: 0, b: 100 }, 1),
      option("other", false, { a: 50, b: 50 }, 2),
    ] }],
  });
  const originals = [input.clauses[0].options[0]];
  const selected = [input.clauses[0].options[1]];
  const before = JSON.stringify(input);
  const original = groupContributions(input, originals);
  assert.equal(original.status, "ok");
  assert.equal(original.method, "weight_share");
  assert.equal(original.overallApproval, 25);
  assert.equal(original.rows[0].share, 0.25);
  assert.equal(original.rows[0].contribution, 25);
  assert.equal(original.rows[1].contribution, 0);
  const changed = groupContributions(input, selected);
  assert.equal(changed.overallApproval, 75);
  assert.equal(changed.rows[0].overallPull, -25);
  assert.equal(changed.rows[1].overallPull, 75);
  assert.equal(changed.rows[0].overallPull + changed.rows[1].overallPull, 50);
  assert.equal(JSON.stringify(input), before);
  assert.equal(groupContributions(input, []).status, "invalid");
});

test("discussion worksheet lists every option as unmarked text and rejects invalid drafts", () => {
  const input = proposal({
    groups: [{ id: "g", name: "Residents", weight: 2, minSupport: 40, veto: true }],
    clauses: [{ id: "one", title: "Hours", lockedOptionId: "one-change", options: [
      option("one-original", true, { g: 50 }),
      option("one-change", false, { g: 80 }, 2),
      option("one-other", false, { g: 90 }, 3),
    ] }],
  });
  input.title = "Park sheet";
  input.maxChangeCost = 4;
  const before = JSON.stringify(input);
  const worksheet = formatDiscussionWorksheet(input);
  assert.equal(worksheet.status, "ok");
  assert.match(worksheet.text, /^Discussion worksheet\n/u);
  assert.match(worksheet.text, /Park sheet/u);
  assert.match(worksheet.text, /Approval threshold: 70%/u);
  assert.match(worksheet.text, /Change-cost budget: 4/u);
  assert.match(worksheet.text, /not a recorded vote/u);
  assert.match(worksheet.text, /Group: Residents \(weight 2; veto, floor 40%\)/u);
  assert.match(worksheet.text, /Hours \[locked\]/u);
  assert.match(worksheet.text, /\[ \] one-original \(original\)/u);
  assert.match(worksheet.text, /\[ \] one-change \(cost 2, locked\)/u);
  assert.doesNotMatch(worksheet.text, /\[x\]/iu);
  assert.equal(JSON.stringify(input), before);
  const invalid = formatDiscussionWorksheet({ title: "" });
  assert.equal(invalid.status, "invalid");
});

test("discussion worksheet CSV lists groups, weights, options, and notes as formula-safe text", () => {
  const input = proposal({
    groups: [{ id: "g", name: "=SUM(1,2)", weight: 2, minSupport: 40, veto: true }],
    clauses: [{ id: "one", title: "Hours", lockedOptionId: "one-change", note: "+cmd notes", options: [
      option("one-original", true, { g: 50 }),
      option("one-change", false, { g: 80 }, 2),
      option("one-other", false, { g: 90 }, 3),
    ] }],
  });
  const before = JSON.stringify(input);
  const worksheet = formatDiscussionWorksheetCsv(input);
  assert.equal(worksheet.status, "ok");
  assert.match(worksheet.csv, /^"row_type","group_id","group_name","weight","min_support","veto","clause_id","clause_title","clause_note","option_id","option_label","original","change_cost","locked"/u);
  assert.ok(worksheet.csv.includes('"group","g","\'=SUM(1,2)","2","40","yes"'));
  assert.ok(worksheet.csv.includes('"option","","","","","","one","Hours","\'+cmd notes","one-change","one-change","no","2","yes"'));
  assert.ok(worksheet.csv.includes('"one-original","one-original","yes","0","no"'));
  assert.doesNotMatch(worksheet.csv, /,"support"/u);
  assert.equal(worksheet.csv, formatDiscussionWorksheetCsv(input).csv);
  assert.equal(JSON.stringify(input), before);
  assert.equal(formatDiscussionWorksheetCsv({ title: "" }).status, "invalid");
});

test("recommended package Markdown copies selected options without claiming legitimacy", () => {
  const input = proposal({
    clauses: [{ id: "one", title: "Hours", options: [
      option("one-original", true, { g: 50 }),
      option("one-change", false, { g: 90 }, 2),
      option("one-other", false, { g: 60 }, 4),
    ] }],
  });
  const before = JSON.stringify(input);
  const result = findSmallestAgreement(input);
  const markdown = formatRecommendedPackageMarkdown(input, result);
  assert.equal(markdown.status, "ok");
  assert.match(markdown.text, /^# Recommended package\n/u);
  assert.match(markdown.text, /Proposal: Test proposal/u);
  assert.match(markdown.text, /not a recorded vote or a claim of legitimacy/u);
  assert.match(markdown.text, /Hours: "one-change" \(cost 2\.0\)/u);
  assert.doesNotMatch(markdown.text, /[\u2014\u2013]/u);
  assert.equal(markdown.text, formatRecommendedPackageMarkdown(input, result).text);
  assert.equal(JSON.stringify(input), before);
  assert.equal(formatRecommendedPackageMarkdown({ title: "" }).status, "invalid");
  const infeasible = proposal({
    threshold: 99,
    clauses: [{ id: "one", title: "Hours", options: [
      option("one-original", true, { g: 10 }),
      option("one-change", false, { g: 11 }, 1),
      option("one-other", false, { g: 12 }, 2),
    ] }],
  });
  assert.equal(formatRecommendedPackageMarkdown(infeasible).status, "unavailable");
});

test("pinned package Markdown table lists original, recommended, and pinned labels without recording a vote", () => {
  const input = proposal({
    clauses: [{ id: "one", title: "Hours", options: [
      option("one-original", true, { g: 50 }),
      option("one-change", false, { g: 90 }, 2),
      option("one-other", false, { g: 60 }, 4),
    ] }],
  });
  const before = JSON.stringify(input);
  const markdown = formatPinnedPackagesMarkdown(input, ["one-change"], ["one-other"]);
  assert.equal(markdown.status, "ok");
  assert.match(markdown.text, /^# Original, recommended, and pinned packages\n/u);
  assert.match(markdown.text, /Proposal: Test proposal/u);
  assert.match(markdown.text, /not a recorded vote or a claim of legitimacy/u);
  assert.match(markdown.text, /\| Clause \| Original \| Recommended \| Pinned \|/u);
  assert.match(markdown.text, /\| Hours \| one-original \| one-change \| one-other \|/u);
  assert.doesNotMatch(markdown.text, /[\u2014\u2013]/u);
  const withoutRecommended = formatPinnedPackagesMarkdown(input, null, ["one-original"]);
  assert.match(withoutRecommended.text, /\| Hours \| one-original \| none \| one-original \|/u);
  assert.equal(JSON.stringify(input), before);
  assert.equal(formatPinnedPackagesMarkdown({ title: "" }, ["one-change"], ["one-other"]).status, "invalid");
  assert.equal(formatPinnedPackagesMarkdown(input, ["missing"], ["one-other"]).status, "invalid");
});

test("veto-blocker Markdown lists unmet veto constraints without claiming legitimacy", () => {
  const input = proposal({
    threshold: 80,
    groups: [
      { id: "majority", name: "Majority", weight: 9 },
      { id: "minority", name: "Minority", weight: 1, veto: true },
    ],
    clauses: [{ id: "one", title: "Hours", options: [
      option("original", true, { majority: 90, minority: 10 }),
      option("mid", false, { majority: 88, minority: 20 }, 1),
      option("other", false, { majority: 85, minority: 30 }, 2),
    ] }],
  });
  const before = JSON.stringify(input);
  const listed = formatVetoBlockersMarkdown(input, [input.clauses[0].options[0]]);
  assert.equal(listed.status, "ok");
  assert.match(listed.text, /^# Veto constraint list\n/u);
  assert.match(listed.text, /numerical constraint list, not a legal veto or a claim of legitimacy/u);
  assert.match(listed.text, /Minority: 10\.0% against required 80\.0%/u);
  assert.doesNotMatch(listed.text, /[\u2014\u2013]/u);
  assert.equal(listed.groups.length, 1);
  assert.equal(JSON.stringify(input), before);
  const clear = proposal({
    groups: [{ id: "g", name: "Group", weight: 1, veto: true }],
    clauses: [{ id: "one", title: "Hours", options: [
      option("original", true, { g: 90 }),
      option("alt", false, { g: 80 }, 1),
      option("other", false, { g: 70 }, 2),
    ] }],
  });
  const met = formatVetoBlockersMarkdown(clear, [clear.clauses[0].options[0]]);
  assert.match(met.text, /Every marked veto group meets its required average/u);
  assert.equal(formatVetoBlockersMarkdown({ title: "" }).status, "invalid");
  assert.equal(formatVetoBlockersMarkdown(input, null).status, "unavailable");
});

test("workshop file compare lists identifier mismatches instead of inventing zeros", () => {
  const left = proposal({
    groups: [{ id: "a", name: "A", weight: 1 }, { id: "b", name: "B", weight: 2 }],
    clauses: [{ id: "one", title: "One", options: [
      option("original", true, { a: 40, b: 50 }),
      option("alternative", false, { a: 70, b: 80 }, 1),
      option("other", false, { a: 10, b: 20 }, 2),
    ] }],
  });
  const right = proposal({
    groups: [{ id: "a", name: "A", weight: 3 }, { id: "c", name: "C", weight: 1 }],
    clauses: [{ id: "two", title: "Two", options: [
      option("original", true, { a: 40, c: 50 }),
      option("alternative", false, { a: 70, c: 80 }, 1),
      option("other", false, { a: 10, c: 20 }, 2),
    ] }],
  });
  const beforeLeft = JSON.stringify(left);
  const beforeRight = JSON.stringify(right);
  const compared = compareWorkshopFiles(JSON.stringify(left), JSON.stringify(right));
  assert.equal(compared.status, "ok");
  assert.equal(compared.aligned, false);
  assert.deepEqual(compared.groups.onlyLeft.map((row) => row.id), ["b"]);
  assert.deepEqual(compared.groups.onlyRight.map((row) => row.id), ["c"]);
  assert.equal(compared.groups.fieldChanges.some((row) => row.id === "a" && row.field === "weight" && row.left === 1 && row.right === 3), true);
  assert.deepEqual(compared.clauses.onlyLeft.map((row) => row.id), ["one"]);
  assert.deepEqual(compared.clauses.onlyRight.map((row) => row.id), ["two"]);
  assert.equal(compared.clauses.fieldChanges.some((row) => row.field === "option.support" && row.groupId === "c"), false);
  assert.equal(JSON.stringify(left), beforeLeft);
  assert.equal(JSON.stringify(right), beforeRight);
  const same = compareWorkshopFiles(JSON.stringify(left), JSON.stringify(left));
  assert.equal(same.aligned, true);
  assert.equal(same.groups.fieldChanges.length, 0);
  assert.equal(compareWorkshopFiles("{", "{}").errors[0].code, "invalid_json");
  assert.equal(compareWorkshopFiles("{}", "{}").errors[0].code, "invalid_proposal");
});

test("workspace JSON persists compact or comfortable clause density and keeps old proposal files valid", () => {
  const input = proposal({
    clauses: [{ id: "one", title: "One", options: [
      option("original", true, { g: 50 }),
      option("alternative", false, { g: 80 }, 1),
      option("other", false, { g: 70 }, 2),
    ] }],
  });
  const before = JSON.stringify(input);
  const exported = formatWorkspaceJson(input, { clauseDensity: "compact" });
  assert.equal(exported.status, "ok");
  const parsed = parseWorkspaceJson(exported.json);
  assert.equal(parsed.status, "ok");
  assert.equal(parsed.kind, "workspace");
  assert.equal(parsed.clauseDensity, "compact");
  assert.deepEqual(parsed.proposal, canonicalProposal(input));
  const omitted = parseWorkspaceJson(JSON.stringify({ format: "smallest-agreement-workspace", version: 1, proposal: input }));
  assert.equal(omitted.clauseDensity, "comfortable");
  const bare = parseWorkspaceJson(JSON.stringify(input));
  assert.equal(bare.kind, "proposal");
  assert.equal(bare.clauseDensity, null);
  assert.equal(formatWorkspaceJson(input, { clauseDensity: "huge" }).errors[0].code, "invalid_density");
  assert.equal(parseWorkspaceJson(JSON.stringify({ format: "smallest-agreement-workspace", version: 1, clauseDensity: "huge", proposal: input })).errors[0].code, "invalid_density");
  assert.equal(JSON.stringify(input), before);
});

test("workspace JSON persists display filters that the solver ignores, and older files show all", () => {
  const input = proposal({
    clauses: [{ id: "one", title: "One", lockedOptionId: "alternative", options: [
      option("original", true, { g: 50 }),
      option("alternative", false, { g: 80 }, 1),
      option("other", false, { g: 70 }, 2),
    ] }],
  });
  const before = JSON.stringify(input);
  const baseline = findSmallestAgreement(input);
  const exported = formatWorkspaceJson(input, { clauseDensity: "comfortable", vetoGroupsOnly: true, lockedClausesOnly: true });
  assert.equal(exported.status, "ok");
  assert.equal(exported.vetoGroupsOnly, true);
  assert.equal(exported.lockedClausesOnly, true);
  const parsed = parseWorkspaceJson(exported.json);
  assert.equal(parsed.status, "ok");
  assert.equal(parsed.kind, "workspace");
  assert.equal(parsed.vetoGroupsOnly, true);
  assert.equal(parsed.lockedClausesOnly, true);
  assert.deepEqual(parsed.proposal, canonicalProposal(input));
  assert.equal(Object.hasOwn(parsed.proposal, "vetoGroupsOnly"), false);
  assert.equal(Object.hasOwn(parsed.proposal, "lockedClausesOnly"), false);
  assert.deepEqual(findSmallestAgreement(parsed.proposal), baseline);
  const omitted = parseWorkspaceJson(JSON.stringify({ format: "smallest-agreement-workspace", version: 1, proposal: input }));
  assert.equal(omitted.vetoGroupsOnly, false);
  assert.equal(omitted.lockedClausesOnly, false);
  const bare = parseWorkspaceJson(JSON.stringify(input));
  assert.equal(bare.vetoGroupsOnly, null);
  assert.equal(bare.lockedClausesOnly, null);
  assert.equal(formatWorkspaceJson(input, { vetoGroupsOnly: "yes" }).errors[0].code, "invalid_filter");
  assert.equal(parseWorkspaceJson(JSON.stringify({ format: "smallest-agreement-workspace", version: 1, vetoGroupsOnly: "yes", proposal: input })).errors[0].code, "invalid_filter");
  assert.equal(parseWorkspaceJson(JSON.stringify({ format: "smallest-agreement-workspace", version: 1, lockedClausesOnly: 1, proposal: input })).errors[0].code, "invalid_filter");
  assert.equal(JSON.stringify(input), before);
});

test("workspace JSON persists changed-clause and below-floor filters and rejects unknown keys", () => {
  const input = proposal({
    clauses: [{ id: "one", title: "One", options: [
      option("original", true, { g: 50 }),
      option("alternative", false, { g: 80 }, 1),
      option("other", false, { g: 70 }, 2),
    ] }],
  });
  const before = JSON.stringify(input);
  const baseline = findSmallestAgreement(input);
  const exported = formatWorkspaceJson(input, { changedClausesOnly: true, belowFloorGroupsOnly: true, overBudgetClausesOnly: true });
  assert.equal(exported.status, "ok");
  assert.equal(exported.changedClausesOnly, true);
  assert.equal(exported.belowFloorGroupsOnly, true);
  assert.equal(exported.overBudgetClausesOnly, true);
  const parsed = parseWorkspaceJson(exported.json);
  assert.equal(parsed.status, "ok");
  assert.equal(parsed.changedClausesOnly, true);
  assert.equal(parsed.belowFloorGroupsOnly, true);
  assert.equal(parsed.overBudgetClausesOnly, true);
  assert.equal(Object.hasOwn(parsed.proposal, "changedClausesOnly"), false);
  assert.equal(Object.hasOwn(parsed.proposal, "belowFloorGroupsOnly"), false);
  assert.equal(Object.hasOwn(parsed.proposal, "overBudgetClausesOnly"), false);
  assert.deepEqual(findSmallestAgreement(parsed.proposal), baseline);
  const omitted = parseWorkspaceJson(JSON.stringify({ format: "smallest-agreement-workspace", version: 1, proposal: input }));
  assert.equal(omitted.changedClausesOnly, false);
  assert.equal(omitted.belowFloorGroupsOnly, false);
  assert.equal(omitted.overBudgetClausesOnly, false);
  const bare = parseWorkspaceJson(JSON.stringify(input));
  assert.equal(bare.changedClausesOnly, null);
  assert.equal(bare.belowFloorGroupsOnly, null);
  assert.equal(bare.overBudgetClausesOnly, null);
  assert.equal(formatWorkspaceJson(input, { extra: true }).errors[0].code, "unknown_key");
  assert.equal(parseWorkspaceJson(JSON.stringify({ format: "smallest-agreement-workspace", version: 1, extra: true, proposal: input })).errors[0].code, "unknown_key");
  assert.equal(formatWorkspaceJson(input, { changedClausesOnly: "yes" }).errors[0].code, "invalid_filter");
  assert.equal(parseWorkspaceJson(JSON.stringify({ format: "smallest-agreement-workspace", version: 1, belowFloorGroupsOnly: 1, proposal: input })).errors[0].code, "invalid_filter");
  assert.equal(formatWorkspaceJson(input, { overBudgetClausesOnly: "yes" }).errors[0].code, "invalid_filter");
  assert.equal(JSON.stringify(input), before);
});

test("changedClauseIds lists clauses whose recommended option is not the original", () => {
  const input = proposal({
    threshold: 70,
    clauses: [
      { id: "one", title: "One", options: [
        option("one-original", true, { g: 40 }), option("one-change", false, { g: 90 }, 2), option("one-other", false, { g: 20 }, 8),
      ] },
      { id: "two", title: "Two", options: [
        option("two-original", true, { g: 90 }), option("two-change", false, { g: 40 }, 1), option("two-other", false, { g: 20 }, 8),
      ] },
    ],
  });
  const before = JSON.stringify(input);
  const result = findSmallestAgreement(input);
  assert.equal(result.status, "found");
  const changed = changedClauseIds(input, result);
  assert.equal(changed.status, "ok");
  assert.deepEqual(changed.clauseIds, ["one"]);
  assert.deepEqual(changedClauseIds(input, { status: "infeasible" }).clauseIds, []);
  assert.equal(changedClauseIds({ title: "" }, result).status, "invalid");
  assert.equal(JSON.stringify(input), before);
  assert.deepEqual(findSmallestAgreement(input), result);
});

test("overBudgetClauseIds lists clauses whose cheapest remaining change exceeds leftover budget", () => {
  const input = proposal({
    threshold: 70,
    clauses: [
      { id: "keep", title: "Keep", options: [
        option("keep-original", true, { g: 90 }), option("keep-alt", false, { g: 40 }, 5), option("keep-other", false, { g: 20 }, 8),
      ] },
      { id: "spend", title: "Spend", options: [
        option("spend-original", true, { g: 40 }), option("spend-alt", false, { g: 90 }, 2), option("spend-other", false, { g: 20 }, 8),
      ] },
    ],
  });
  input.maxChangeCost = 3;
  const before = JSON.stringify(input);
  const result = findSmallestAgreement(input);
  assert.equal(result.status, "found");
  assert.equal(result.agreement.changeCost, 2);
  const listed = overBudgetClauseIds(input, result);
  assert.equal(listed.status, "ok");
  assert.equal(listed.exhausted, false);
  assert.equal(listed.remaining, 1);
  assert.deepEqual(listed.clauseIds, ["keep"]);
  const unlimited = proposal({
    clauses: [{ id: "one", title: "One", options: [
      option("original", true, { g: 90 }), option("alt", false, { g: 40 }, 5), option("other", false, { g: 20 }, 8),
    ] }],
  });
  assert.deepEqual(overBudgetClauseIds(unlimited, findSmallestAgreement(unlimited)).clauseIds, []);
  const exhausted = proposal({
    threshold: 70,
    clauses: [{ id: "one", title: "One", options: [
      option("original", true, { g: 40 }), option("alt", false, { g: 90 }, 2), option("other", false, { g: 20 }, 8),
    ] }],
  });
  exhausted.maxChangeCost = 2;
  const spent = overBudgetClauseIds(exhausted, findSmallestAgreement(exhausted));
  assert.equal(spent.exhausted, true);
  assert.deepEqual(spent.clauseIds, ["one"]);
  assert.equal(overBudgetClauseIds({ title: "" }, result).status, "invalid");
  assert.equal(JSON.stringify(input), before);
  assert.deepEqual(findSmallestAgreement(input), result);
});

test("groupsBelowSupportRequirement uses each floor or the approval threshold", () => {
  const input = proposal({
    threshold: 70,
    groups: [
      { id: "floored", name: "Floored", weight: 1, minSupport: 80 },
      { id: "open", name: "Open", weight: 1 },
    ],
    clauses: [{ id: "one", title: "One", options: [
      { id: "original", original: true, label: "Keep", changeCost: 0, support: { floored: 50, open: 90 } },
      { id: "mid", original: false, label: "Mid", changeCost: 1, support: { floored: 85, open: 40 } },
      { id: "high", original: false, label: "High", changeCost: 2, support: { floored: 90, open: 80 } },
    ] }],
  });
  const before = JSON.stringify(input);
  const originals = getOriginalOptions(input);
  const belowOriginal = groupsBelowSupportRequirement(input, originals);
  assert.equal(belowOriginal.status, "ok");
  assert.deepEqual(belowOriginal.groups.map((group) => group.id), ["floored"]);
  const mid = input.clauses[0].options[1];
  const belowMid = groupsBelowSupportRequirement(input, [mid]);
  assert.deepEqual(belowMid.groups.map((group) => group.id), ["open"]);
  assert.equal(belowMid.groups[0].required, 70);
  assert.equal(groupsBelowSupportRequirement(input, []).status, "invalid");
  assert.equal(JSON.stringify(input), before);
});

test("duplicateClauseOption copies cost and support with a unique id and name", () => {
  const input = proposal({
    clauses: [{ id: "one", title: "One", options: [
      option("original", true, { g: 50 }),
      option("alternative", false, { g: 80 }, 3),
      option("other", false, { g: 70 }, 2),
    ] }],
  });
  const before = JSON.stringify(input);
  const duplicated = duplicateClauseOption(input, "one", "alternative");
  assert.equal(duplicated.status, "ok");
  const copy = duplicated.proposal.clauses[0].options.at(-1);
  assert.equal(copy.id, "option-copy-1");
  assert.equal(copy.original, false);
  assert.equal(copy.label, "alternative (copy)");
  assert.equal(copy.changeCost, 3);
  assert.deepEqual(copy.support, { g: 80 });
  const again = duplicateClauseOption(duplicated.proposal, "one", "alternative");
  assert.equal(again.proposal.clauses[0].options.at(-1).label, "alternative (copy 2)");
  const fromOriginal = duplicateClauseOption(input, "one", "original");
  assert.equal(fromOriginal.status, "ok");
  assert.equal(fromOriginal.proposal.clauses[0].options.at(-1).original, false);
  assert.equal(fromOriginal.proposal.clauses[0].options.at(-1).changeCost, 0);
  assert.equal(JSON.stringify(input), before);
  assert.equal(duplicateClauseOption(input, "missing", "alternative").status, "invalid");
  const capped = structuredClone(input);
  capped.clauses[0].options = Array.from({ length: MAX_OPTIONS_PER_CLAUSE }, (_, index) => option(`o-${index}`, index === 0, { g: 50 }, index === 0 ? 0 : 1));
  assert.equal(duplicateClauseOption(capped, "one", "o-1").status, "invalid");
});

test("formatCurrentLocksMarkdown lists locked option labels or Unlocked", () => {
  const input = proposal({
    clauses: [
      { id: "one", title: "One", lockedOptionId: "one-change", options: [
        option("one-original", true, { g: 50 }), option("one-change", false, { g: 80 }, 1), option("one-other", false, { g: 70 }, 2),
      ] },
      { id: "two", title: "Two", options: [
        option("two-original", true, { g: 50 }), option("two-change", false, { g: 80 }, 1), option("two-other", false, { g: 70 }, 2),
      ] },
    ],
  });
  const listed = formatCurrentLocksMarkdown(input);
  assert.equal(listed.status, "ok");
  assert.match(listed.text, /# Current clause locks/u);
  assert.match(listed.text, /not a legal hold/u);
  assert.match(listed.text, /- One: one-change/u);
  assert.match(listed.text, /- Two: Unlocked/u);
  assert.doesNotMatch(listed.text, /legal right/u);
  assert.equal(formatCurrentLocksMarkdown({ title: "" }).status, "invalid");
});

test("formatRecommendedChangeCostCsv writes formula-safe original vs recommended costs", () => {
  const input = proposal({
    threshold: 70,
    clauses: [{ id: "one", title: "=Hours keep", options: [
      option("one-original", true, { g: 40 }), option("one-change", false, { g: 90 }, 2), option("one-other", false, { g: 20 }, 8),
    ] }],
  });
  const result = findSmallestAgreement(input);
  const exported = formatRecommendedChangeCostCsv(input, result);
  assert.equal(exported.status, "ok");
  assert.match(exported.csv, /^"clause","original_option","recommended_option","cost_delta"\r\n/u);
  assert.match(exported.csv, /"'=Hours keep"/u);
  assert.match(exported.csv, /"2"\r\n/u);
  assert.equal(formatRecommendedChangeCostCsv(input, { status: "infeasible" }).status, "unavailable");
  assert.equal(formatRecommendedChangeCostCsv({ title: "" }, result).status, "invalid");
});

test("locks JSON round-trips current locks and fails closed on unknown ids", () => {
  const input = proposal({
    clauses: [
      { id: "one", title: "One", lockedOptionId: "one-change", options: [
        option("one-original", true, { g: 50 }), option("one-change", false, { g: 80 }, 1), option("one-other", false, { g: 70 }, 2),
      ] },
      { id: "two", title: "Two", lockedOptionId: "two-original", options: [
        option("two-original", true, { g: 50 }), option("two-change", false, { g: 80 }, 1), option("two-other", false, { g: 70 }, 2),
      ] },
    ],
  });
  const before = JSON.stringify(input);
  const exported = formatLocksJson(input);
  assert.equal(exported.status, "ok");
  assert.equal(exported.locks.length, 2);
  const cleared = parseLocksJson(JSON.stringify({ format: "smallest-agreement-locks", version: 1, locks: [{ clauseId: "one", optionId: "one-other" }] }), input);
  assert.equal(cleared.status, "ok");
  assert.equal(cleared.proposal.clauses[0].lockedOptionId, "one-other");
  assert.equal(Object.hasOwn(cleared.proposal.clauses[1], "lockedOptionId"), false);
  const restored = parseLocksJson(exported.json, cleared.proposal);
  assert.deepEqual(restored.proposal.clauses.map((clause) => clause.lockedOptionId), ["one-change", "two-original"]);
  assert.equal(parseLocksJson(JSON.stringify({ format: "smallest-agreement-locks", version: 1, locks: [{ clauseId: "missing", optionId: "one-change" }] }), input).errors[0].code, "unknown_clause");
  assert.equal(parseLocksJson(JSON.stringify({ format: "smallest-agreement-locks", version: 1, locks: [{ clauseId: "one", optionId: "two-change" }] }), input).errors[0].code, "unknown_option");
  assert.equal(parseLocksJson(JSON.stringify({ format: "smallest-agreement-locks", version: 1, locks: [{ clauseId: "one", optionId: "one-change" }, { clauseId: "one", optionId: "one-other" }] }), input).errors[0].code, "duplicate_clause");
  assert.equal(parseLocksJson("{", input).errors[0].code, "invalid_json");
  assert.equal(parseLocksJson("{}", input).errors[0].code, "invalid_format");
  assert.equal(JSON.stringify(input), before);
});

test("resetGroupSupport blanks one group's scores without mutating the draft", () => {
  const input = proposal({
    groups: [{ id: "a", name: "A", weight: 1 }, { id: "b", name: "B", weight: 2 }],
    clauses: [{ id: "one", title: "One", options: [
      option("original", true, { a: 40, b: 80 }),
      option("alternative", false, { a: 70, b: 60 }, 1),
      option("other", false, { a: 90, b: 50 }, 2),
    ] }],
  });
  const before = JSON.stringify(input);
  const reset = resetGroupSupport(input, "a");
  assert.equal(reset.status, "ok");
  assert.equal(reset.cleared, 3);
  assert.equal(reset.proposal.clauses[0].options[0].support.a, null);
  assert.equal(reset.proposal.clauses[0].options[0].support.b, 80);
  assert.equal(validateProposal(reset.proposal).valid, false);
  assert.equal(JSON.stringify(input), before);
  assert.equal(resetGroupSupport(input, "missing").errors[0], "Unknown group.");
});

test("optional clause notes round-trip, appear on the worksheet, and do not change search", () => {
  const input = proposal({ clauses: [{ id: "one", title: "Hours", options: [
    option("original", true, { g: 50 }), option("alternative", false, { g: 80 }, 1), option("other", false, { g: 70 }, 2),
  ] }] });
  assert.equal(Object.hasOwn(canonicalProposal(input).clauses[0], "note"), false);
  input.clauses[0].note = "Ask who closes the park.";
  const before = JSON.stringify(input);
  const clean = canonicalProposal(input);
  assert.equal(clean.clauses[0].note, "Ask who closes the park.");
  const withNote = findSmallestAgreement(input);
  const withoutNote = findSmallestAgreement(canonicalProposal({ ...input, clauses: input.clauses.map((clause) => { const { note, ...rest } = clause; return rest; }) }));
  assert.equal(withNote.status, withoutNote.status);
  assert.deepEqual(withNote.agreement.options.map((option) => option.id), withoutNote.agreement.options.map((option) => option.id));
  const worksheet = formatDiscussionWorksheet(input);
  assert.match(worksheet.text, /Facilitator note: Ask who closes the park\./u);
  const stripped = canonicalProposal({ ...input, clauses: input.clauses.map((clause) => { const { note, ...rest } = clause; return rest; }) });
  const changes = compareScenarioInputs(stripped, input);
  assert.ok(changes.some((row) => row.field.includes("facilitator note") && row.after === "Ask who closes the park."));
  for (const value of ["", 1, null, {}, "x".repeat(241)]) {
    const bad = proposal({ clauses: [{ id: "one", title: "Hours", options: [
      option("original", true, { g: 50 }), option("alternative", false, { g: 80 }, 1), option("other", false, { g: 70 }, 2),
    ] }] });
    bad.clauses[0].note = value;
    assert.equal(validateProposal(bad).valid, false, `note ${String(value).slice(0, 20)}`);
  }
  assert.equal(JSON.stringify(input), before);
});
