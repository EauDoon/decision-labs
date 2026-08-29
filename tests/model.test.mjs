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
  canonicalProposal,
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
      { ...option("original", true, { g: 50, hidden: 99 }), hidden: "option" },
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
  assert.match(contract, /at most 120 characters/u);
  assert.match(contract, /at most 80 characters/u);
  assert.match(contract, /at most 240 characters/u);
  assert.match(contract, /Omitting `original`, or setting it to `false`, marks an alternative/u);

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
  assert.deepEqual(result.rejected, { budget: 1, floors: 2, anyConstraint: 3 });
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
  assert.deepEqual(result.rejected, { budget: 2, floors: 1, anyConstraint: 3 });
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
