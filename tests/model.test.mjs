import test from "node:test";
import assert from "node:assert/strict";
import {
  MAX_COMBINATIONS,
  MAX_GROUPS,
  MAX_NEAR_MISSES,
  MAX_OPTIONS_PER_CLAUSE,
  MAX_WEIGHT,
  approvalForOptions,
  findSmallestAgreement,
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
});

test("public search options cannot raise the resource or result caps", () => {
  const input = proposal({ clauses: [{ id: "one", title: "One", options: [
    option("a", true, { g: 40 }), option("b", false, { g: 60 }, 1), option("c", false, { g: 80 }, 2),
  ] }] });
  assert.equal(findSmallestAgreement(input, { maxCombinations: MAX_COMBINATIONS + 1 }).status, "invalid");
  assert.equal(findSmallestAgreement(input, { nearMissLimit: MAX_NEAR_MISSES + 1 }).status, "invalid");
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
