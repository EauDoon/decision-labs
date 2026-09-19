import test from "node:test";
import assert from "node:assert/strict";
import {
  validateProposal, canonicalProposal, checkRelationships, findSmallestAgreement,
  evaluatePackage, MAX_RELATIONSHIPS,
} from "../src/model.js";

function demoProposal(overrides = {}) {
  return {
    title: "Relationships demo",
    threshold: 60,
    maxChangeCost: 20,
    groups: [
      { id: "g1", name: "Group 1", weight: 50, supportScore: 60 },
      { id: "g2", name: "Group 2", weight: 50, supportScore: 55 },
    ],
    clauses: [
      {
        id: "c1", title: "Hours", options: [
          { id: "h1", original: true, label: "Keep", changeCost: 0, support: { g1: 60, g2: 55 } },
          { id: "h2", label: "Extend", changeCost: 4, support: { g1: 80, g2: 50 } },
          { id: "h3", label: "Split", changeCost: 2, support: { g1: 66, g2: 58 } },
        ],
      },
      {
        id: "c2", title: "Market", options: [
          { id: "m1", original: true, label: "Keep", changeCost: 0, support: { g1: 60, g2: 55 } },
          { id: "m2", label: "Monthly", changeCost: 3, support: { g1: 90, g2: 70 } },
          { id: "m3", label: "Weekly", changeCost: 6, support: { g1: 95, g2: 40 } },
        ],
      },
    ],
    ...overrides,
  };
}

test("valid requires, excludes, and linked rules pass validation", () => {
  const proposal = demoProposal({
    relationships: [
      { id: "r1", kind: "requires", option: "m2", requires: "h2" },
      { id: "r2", kind: "excludes", options: ["h3", "m3"] },
      { id: "r3", kind: "linked", options: ["h2", "m3"] },
    ],
  });
  assert.equal(validateProposal(proposal).valid, true);
});

test("dangling references are rejected with the offending rule and option", () => {
  for (const relationships of [
    [{ id: "r1", kind: "requires", option: "m2", requires: "ghost" }],
    [{ id: "r1", kind: "requires", option: "ghost", requires: "h2" }],
    [{ id: "r1", kind: "excludes", options: ["h2", "ghost"] }],
    [{ id: "r1", kind: "linked", options: ["ghost", "h2"] }],
  ]) {
    const result = validateProposal(demoProposal({ relationships }));
    assert.equal(result.valid, false);
    assert.match(result.errors.join(" "), /ghost/);
  }
});

test("unknown kinds, fields, ids, and oversized rule sets are rejected", () => {
  assert.equal(validateProposal(demoProposal({ relationships: [{ id: "r1", kind: "implies", option: "m2", requires: "h2" }] })).valid, false);
  assert.equal(validateProposal(demoProposal({ relationships: [{ id: "r1", kind: "requires", option: "m2", requires: "h2", extra: 1 }] })).valid, false);
  assert.equal(validateProposal(demoProposal({ relationships: [{ id: "r1", kind: "requires", option: "m2", requires: "h2" }, { id: "r1", kind: "excludes", options: ["h2", "m2"] }] })).valid, false);
  assert.equal(validateProposal(demoProposal({ relationships: [{ id: "bad id!", kind: "requires", option: "m2", requires: "h2" }] })).valid, false);
  assert.equal(validateProposal(demoProposal({ relationships: "requires" })).valid, false);
  const many = Array.from({ length: MAX_RELATIONSHIPS + 1 }, (_, index) => ({ id: `r${index}`, kind: "excludes", options: ["h2", "m2"] }));
  assert.equal(validateProposal(demoProposal({ relationships: many })).valid, false);
});

test("contradictory structures explain why they can never hold", () => {
  const sameClauseRequires = validateProposal(demoProposal({ relationships: [{ id: "r1", kind: "requires", option: "h2", requires: "h3" }] }));
  assert.equal(sameClauseRequires.valid, false);
  assert.match(sameClauseRequires.errors.join(" "), /can never hold/);
  const sameClauseExcludes = validateProposal(demoProposal({ relationships: [{ id: "r1", kind: "excludes", options: ["h2", "h3"] }] }));
  assert.equal(sameClauseExcludes.valid, false);
  assert.match(sameClauseExcludes.errors.join(" "), /already selects one option|restates/);
  const sameClauseLinked = validateProposal(demoProposal({ relationships: [{ id: "r1", kind: "linked", options: ["h2", "h3"] }] }));
  assert.equal(sameClauseLinked.valid, false);
  assert.match(sameClauseLinked.errors.join(" "), /can never hold/);
  const selfRequires = validateProposal(demoProposal({ relationships: [{ id: "r1", kind: "requires", option: "h2", requires: "h2" }] }));
  assert.equal(selfRequires.valid, false);
  const clash = validateProposal(demoProposal({
    relationships: [
      { id: "r1", kind: "requires", option: "m2", requires: "h2" },
      { id: "r2", kind: "excludes", options: ["h2", "m2"] },
    ],
  }));
  assert.equal(clash.valid, false);
  assert.match(clash.errors.join(" "), /contradict/);
  const linkedSizes = validateProposal(demoProposal({ relationships: [{ id: "r1", kind: "linked", options: ["h2"] }] }));
  assert.equal(linkedSizes.valid, false);
  const excludesArity = validateProposal(demoProposal({ relationships: [{ id: "r1", kind: "excludes", options: ["h2", "m2", "m3"] }] }));
  assert.equal(excludesArity.valid, false);
});

test("option ids must be unique across clauses when relationships are declared", () => {
  const proposal = demoProposal({
    clauses: [
      {
        id: "c1", title: "Hours", options: [
          { id: "same", original: true, label: "Keep", changeCost: 0, support: { g1: 60, g2: 55 } },
          { id: "h2", label: "Extend", changeCost: 4, support: { g1: 80, g2: 50 } },
          { id: "h3", label: "Split", changeCost: 2, support: { g1: 66, g2: 58 } },
        ],
      },
      {
        id: "c2", title: "Market", options: [
          { id: "same", original: true, label: "Keep", changeCost: 0, support: { g1: 60, g2: 55 } },
          { id: "m2", label: "Monthly", changeCost: 3, support: { g1: 90, g2: 70 } },
          { id: "m3", label: "Weekly", changeCost: 6, support: { g1: 95, g2: 40 } },
        ],
      },
    ],
    relationships: [{ id: "r1", kind: "requires", option: "m2", requires: "h2" }],
  });
  const result = validateProposal(proposal);
  assert.equal(result.valid, false);
  assert.match(result.errors.join(" "), /unique across clauses/);
  const bare = { ...proposal };
  delete bare.relationships;
  assert.equal(validateProposal(bare).valid, true);
});

test("requires cycles are allowed and must be selected together", () => {
  const proposal = demoProposal({
    relationships: [
      { id: "r1", kind: "requires", option: "m2", requires: "h2" },
      { id: "r2", kind: "requires", option: "h2", requires: "m2" },
    ],
  });
  assert.equal(validateProposal(proposal).valid, true);
  const onlyM2 = checkRelationships(proposal, [
    proposal.clauses[0].options[0], proposal.clauses[1].options[1],
  ]);
  assert.equal(onlyM2.met, false);
  assert.equal(onlyM2.violations.length, 1);
  const both = checkRelationships(proposal, [
    proposal.clauses[0].options[1], proposal.clauses[1].options[1],
  ]);
  assert.equal(both.met, true);
  const neither = checkRelationships(proposal, [
    proposal.clauses[0].options[0], proposal.clauses[1].options[0],
  ]);
  assert.equal(neither.met, true);
});

test("checkRelationships names each violated rule with a reason", () => {
  const proposal = demoProposal({
    relationships: [
      { id: "r1", kind: "requires", option: "m2", requires: "h2" },
      { id: "r2", kind: "excludes", options: ["h3", "m3"] },
      { id: "r3", kind: "linked", options: ["h2", "m3"] },
    ],
  });
  const bad = checkRelationships(proposal, [proposal.clauses[0].options[2], proposal.clauses[1].options[1]]);
  assert.equal(bad.met, false);
  assert.deepEqual(bad.violations.map((entry) => entry.ruleId), ["r1"]);
  assert.match(bad.violations[0].reason, /requires/);
  const excluded = checkRelationships(proposal, [proposal.clauses[0].options[2], proposal.clauses[1].options[2]]);
  assert.equal(excluded.met, false);
  assert.deepEqual(excluded.violations.map((entry) => entry.ruleId), ["r2", "r3"]);
  const partialLink = checkRelationships(proposal, [proposal.clauses[0].options[1], proposal.clauses[1].options[0]]);
  assert.equal(partialLink.met, false);
  assert.deepEqual(partialLink.violations.map((entry) => entry.ruleId), ["r3"]);
  const clean = checkRelationships(proposal, [proposal.clauses[0].options[0], proposal.clauses[1].options[0]]);
  assert.equal(clean.met, true);
  assert.deepEqual(clean.violations, []);
});

test("search honors relationships and counts relationship rejections", () => {
  const proposal = demoProposal({
    relationships: [
      { id: "r1", kind: "requires", option: "m2", requires: "h2" },
      { id: "r2", kind: "excludes", options: ["h3", "m3"] },
    ],
  });
  const result = findSmallestAgreement(proposal);
  assert.equal(result.status, "found");
  assert.deepEqual(result.agreement.options.map((option) => option.id), ["h2", "m1"]);
  assert.equal(result.agreement.changeCost, 4);
  assert.equal(result.rejected.relationships, 3);
  assert.equal(result.rejected.anyConstraint, 3);
  assert.equal(result.agreement.constraints.relationships.met, true);
});

test("evaluatePackage enforces relationships on custom selections", () => {
  const proposal = demoProposal({
    relationships: [{ id: "r1", kind: "requires", option: "m2", requires: "h2" }],
  });
  const bad = evaluatePackage(proposal, ["h1", "m2"]);
  assert.equal(bad.status, "not_passing");
  assert.equal(bad.summary.constraints.relationships.met, false);
  const good = evaluatePackage(proposal, ["h2", "m2"]);
  assert.equal(good.summary.constraints.relationships.met, true);
});

test("canonical proposals keep relationships for files, packets, and comparisons", () => {
  const proposal = demoProposal({
    relationships: [{ id: "r1", kind: "requires", option: "m2", requires: "h2" }],
  });
  const canonical = canonicalProposal(proposal);
  assert.deepEqual(canonical.relationships, proposal.relationships);
  assert.notEqual(canonical.relationships, proposal.relationships);
  const plain = canonicalProposal(demoProposal());
  assert.equal(Object.hasOwn(plain, "relationships"), false);
});
