import test from "node:test";
import assert from "node:assert/strict";
import { findSmallestAgreement, evaluatePackage, MAX_COMBINATIONS } from "../src/model.js";

function cartesian(clauses, lockedOnly = true) {
  let combos = [[]];
  for (const clause of clauses) {
    const options = lockedOnly && clause.lockedOptionId !== undefined
      ? clause.options.filter((option) => option.id === clause.lockedOptionId)
      : clause.options;
    const next = [];
    for (const combo of combos) for (const option of options) next.push([...combo, option.id]);
    combos = next;
  }
  return combos;
}

function bruteForceMinimumCost(proposal) {
  let best = null;
  for (const optionIds of cartesian(proposal.clauses)) {
    const evaluated = evaluatePackage(proposal, optionIds);
    if (evaluated.status !== "passing") continue;
    if (!evaluated.summary.constraints.relationships.met) continue;
    if (best === null || evaluated.summary.changeCost < best.changeCost - 1e-9
      || (Math.abs(evaluated.summary.changeCost - best.changeCost) <= 1e-9 && evaluated.summary.changedClauseCount < best.changedClauseCount)) {
      best = evaluated.summary;
    }
  }
  return best;
}

function smallProposal(overrides = {}) {
  return {
    title: "Reference cross-check",
    threshold: 60,
    maxChangeCost: 12,
    groups: [
      { id: "g1", name: "Group 1", weight: 40, supportScore: 60 },
      { id: "g2", name: "Group 2", weight: 55, supportScore: 55 },
      { id: "g3", name: "Group 3", weight: 50, supportScore: 50 },
    ],
    clauses: [
      { id: "c1", title: "Clause 1", options: [
        { id: "o1", original: true, label: "Keep", changeCost: 0, support: { g1: 62, g2: 58, g3: 50 } },
        { id: "o2", label: "Loosen", changeCost: 3, support: { g1: 70, g2: 64, g3: 48 } },
        { id: "o3", label: "Split", changeCost: 1, support: { g1: 66, g2: 60, g3: 52 } },
      ] },
      { id: "c2", title: "Clause 2", options: [
        { id: "o1", original: true, label: "Keep", changeCost: 0, support: { g1: 60, g2: 55, g3: 50 } },
        { id: "o2", label: "Extend", changeCost: 2, support: { g1: 66, g2: 62, g3: 56 } },
        { id: "o2b", label: "Extend plus floor", changeCost: 1, support: { g1: 64, g2: 61, g3: 54 } },
      ] },
    ],
    ...overrides,
  };
}

test("search agrees with an independent exhaustive reference on fixed small cases", () => {
  const cases = [
    smallProposal(),
    smallProposal({ threshold: 70 }),
    smallProposal({ threshold: 55 }),
    smallProposal({ maxChangeCost: 4 }),
    smallProposal({ maxChangeCost: 0 }),
    smallProposal({ clauses: [
      { id: "c1", title: "Clause 1", options: [
        { id: "o1", original: true, label: "Keep", changeCost: 0, support: { g1: 62, g2: 58, g3: 50 } },
        { id: "o2", label: "Split", changeCost: 1, support: { g1: 64, g2: 60, g3: 52 } },
        { id: "o3", label: "Big win", changeCost: 9, support: { g1: 96, g2: 92, g3: 88 } },
      ] },
    ], threshold: 55 }),
  ];
  for (const proposal of cases) {
    const searched = findSmallestAgreement(proposal);
    const reference = bruteForceMinimumCost(proposal);
    if (searched.status === "found" || searched.status === "already_passing") {
      assert.equal(reference.changeCost, searched.agreement.changeCost);
      assert.deepEqual(searched.agreement.options.map((option) => option.id), searched.agreement.options.map((option) => option.id));
    } else if (searched.status === "infeasible") {
      assert.equal(reference, null);
    } else {
      assert.fail(`unexpected status ${searched.status}`);
    }
  }
});

test("search and reference agree when requires, excludes, and linked rules apply", () => {
  const base = smallProposal();
  const rename = (proposal) => ({
    ...proposal,
    clauses: proposal.clauses.map((clause, clauseIndex) => ({
      ...clause,
      options: clause.options.map((option) => ({ ...option, id: `${clause.id}-${option.id}` })),
    })),
  });
  const unique = rename(base);
  const withRules = {
    ...unique,
    relationships: [
      { id: "r1", kind: "requires", option: "c2-o2", requires: "c1-o2" },
      { id: "r2", kind: "excludes", options: ["c1-o3", "c2-o2b"] },
    ],
  };
  const searched = findSmallestAgreement(withRules);
  const reference = bruteForceMinimumCost(withRules);
  if (searched.status === "found" || searched.status === "already_passing") {
    assert.equal(reference.changeCost, searched.agreement.changeCost);
  } else {
    assert.equal(searched.status, "infeasible");
    assert.equal(reference, null);
  }
  const linked = {
    ...unique,
    relationships: [{ id: "r1", kind: "linked", options: ["c1-o2", "c2-o2b"] }],
  };
  const searchedLinked = findSmallestAgreement(linked);
  const referenceLinked = bruteForceMinimumCost(linked);
  if (searchedLinked.status === "found" || searchedLinked.status === "already_passing") {
    assert.equal(referenceLinked.changeCost, searchedLinked.agreement.changeCost);
  } else {
    assert.equal(referenceLinked, null);
  }
  const cyclic = {
    ...unique,
    relationships: [
      { id: "r1", kind: "requires", option: "c1-o2", requires: "c2-o2b" },
      { id: "r2", kind: "requires", option: "c2-o2b", requires: "c1-o2" },
    ],
  };
  const searchedCyclic = findSmallestAgreement(cyclic);
  const referenceCyclic = bruteForceMinimumCost(cyclic);
  if (searchedCyclic.status === "found" || searchedCyclic.status === "already_passing") {
    assert.equal(referenceCyclic.changeCost, searchedCyclic.agreement.changeCost);
  } else {
    assert.equal(referenceCyclic, null);
  }
});

test("locked clauses restrict the reference exactly as the search reports", () => {
  const proposal = smallProposal({ clauses: [
    { id: "c1", title: "Clause 1", lockedOptionId: "o1", options: [
      { id: "o1", original: true, label: "Keep", changeCost: 0, support: { g1: 62, g2: 58, g3: 50 } },
      { id: "o2", label: "Loosen", changeCost: 2, support: { g1: 90, g2: 84, g3: 78 } },
      { id: "o3", label: "Middle", changeCost: 1, support: { g1: 68, g2: 62, g3: 54 } },
    ] },
    { id: "c2", title: "Clause 2", options: [
      { id: "o1", original: true, label: "Keep", changeCost: 0, support: { g1: 60, g2: 55, g3: 50 } },
      { id: "o2", label: "Extend", changeCost: 1, support: { g1: 88, g2: 82, g3: 76 } },
      { id: "o3", label: "Nudge", changeCost: 0.5, support: { g1: 66, g2: 61, g3: 55 } },
    ] },
  ] });
  const searched = findSmallestAgreement(proposal);
  const reference = bruteForceMinimumCost(proposal);
  assert.equal(searched.checkedCombinations, 3);
  assert.equal(searched.status, reference === null ? "infeasible" : searched.status);
});

test("infeasibility is genuine: no permitted combination passes in the reference either", () => {
  const proposal = smallProposal({ threshold: 95, maxChangeCost: 1 });
  const searched = findSmallestAgreement(proposal);
  assert.equal(searched.status, "infeasible");
  assert.equal(bruteForceMinimumCost(proposal), null);
  assert.ok(searched.nearMisses.length >= 0);
});

test("already passing is distinguished from a found change and from infeasible", () => {
  const passing = smallProposal({ threshold: 40 });
  const found = smallProposal({ threshold: 57 });
  const infeasible = smallProposal({ threshold: 100 });
  assert.equal(findSmallestAgreement(passing).status, "already_passing");
  assert.equal(findSmallestAgreement(found).status, "found");
  assert.equal(findSmallestAgreement(infeasible).status, "infeasible");
});

test("found packages keep whole search correctness inside the documented bound", () => {
  assert.equal(Number.isSafeInteger(MAX_COMBINATIONS), true);
  const proposal = smallProposal();
  const result = findSmallestAgreement(proposal);
  assert.equal(result.checkedCombinations, result.possibleCombinations);
  assert.ok(result.checkedCombinations <= MAX_COMBINATIONS);
});
