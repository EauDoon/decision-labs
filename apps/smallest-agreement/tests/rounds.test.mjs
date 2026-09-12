import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import {
  createRound, validateRound, summarizeRound, compareRounds, roundsEqual,
  findSmallestAgreement, formatWorkspaceJson, parseWorkspaceJson, MAX_ROUNDS,
} from "../src/model.js";

const cli = fileURLToPath(new URL("../scripts/analyze.mjs", import.meta.url));

function demoProposal(overrides = {}) {
  return {
    title: "Rounds demo",
    threshold: 60,
    maxChangeCost: 20,
    groups: [
      { id: "g1", name: "Group 1", weight: 50 },
      { id: "g2", name: "Group 2", weight: 50 },
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

test("createRound canonicalizes the baseline and keeps human fields separate", () => {
  const created = createRound(demoProposal(), { name: "First", notes: "human note", decision: "Chose to extend", recordedAt: "2026-09-12" });
  assert.equal(created.status, "ok");
  assert.match(created.round.id, /^round-[0-9a-f]{8}$/);
  assert.equal(created.round.name, "First");
  assert.equal(created.round.notes, "human note");
  assert.equal(created.round.decision, "Chose to extend");
  assert.equal(created.round.recordedAt, "2026-09-12");
  assert.equal(validateRound(created.round).valid, true);
  const minimal = createRound(demoProposal(), {});
  assert.equal(minimal.status, "ok");
  assert.equal(minimal.round.name, null);
  assert.equal(minimal.round.notes, null);
  assert.equal(minimal.round.decision, null);
});

test("createRound rejects invalid proposals and bad human fields", () => {
  assert.equal(createRound({ nope: true }, {}).status, "invalid");
  assert.equal(createRound(demoProposal(), { bogus: 1 }).status, "invalid");
  assert.equal(createRound(demoProposal(), { name: "" }).status, "invalid");
  assert.equal(createRound(demoProposal(), { name: "x".repeat(121) }).status, "invalid");
  assert.equal(createRound(demoProposal(), { notes: "" }).status, "invalid");
  assert.equal(createRound(demoProposal(), { decision: "x".repeat(501) }).status, "invalid");
  assert.equal(createRound(demoProposal(), { recordedAt: "" }).status, "invalid");
  assert.equal(createRound(demoProposal(), { id: "bad id!" }).status, "invalid");
  const named = createRound(demoProposal(), { id: "round-one" });
  assert.equal(named.status, "ok");
  assert.equal(named.round.id, "round-one");
});

test("validateRound rejects malformed rounds with named reasons", () => {
  assert.equal(validateRound(null).valid, false);
  assert.equal(validateRound({ id: "r1", proposal: demoProposal(), extra: 1 }).valid, false);
  assert.equal(validateRound({ proposal: demoProposal() }).valid, false);
  assert.equal(validateRound({ id: "r1", proposal: { nope: true } }).valid, false);
  assert.equal(validateRound({ id: "r1", proposal: demoProposal(), name: 42 }).valid, false);
});

test("roundsEqual ignores display-only recordedAt", () => {
  const left = createRound(demoProposal(), { recordedAt: "2026-09-12" }).round;
  const right = { ...left, recordedAt: "2026-09-13" };
  assert.equal(roundsEqual(left, right), true);
  assert.equal(roundsEqual(left, { ...left, name: "Other" }), false);
  assert.equal(roundsEqual(left, null), false);
});

test("summarizeRound states every outcome explicitly", () => {
  const found = summarizeRound(demoProposal());
  assert.equal(found.status, "found");
  assert.equal(found.changeCost, findSmallestAgreement(demoProposal()).agreement.changeCost);
  assert.ok(found.approval >= 60);
  assert.equal(found.groupSupport.length, 2);
  assert.ok(Array.isArray(found.optionIds));
  const passing = summarizeRound({ ...demoProposal(), threshold: 40 });
  assert.equal(passing.status, "already_passing");
  const infeasible = summarizeRound({ ...demoProposal(), threshold: 100 });
  assert.equal(infeasible.status, "infeasible");
  assert.equal(infeasible.changeCost, null);
  assert.equal(infeasible.optionIds, null);
  const invalid = summarizeRound({ nope: true });
  assert.equal(invalid.status, "invalid");
  assert.match(invalid.note, /Invalid inputs/);
});

test("compareRounds separates input changes from calculated results", () => {
  const left = createRound(demoProposal(), { name: "Before" }).round;
  const changed = demoProposal({ threshold: 65, maxChangeCost: 10 });
  changed.clauses[0] = { ...changed.clauses[0], lockedOptionId: "h2" };
  changed.clauses[1].options[1] = { ...changed.clauses[1].options[1], changeCost: 5 };
  const right = createRound(changed, { name: "After", notes: "human note", decision: "human decision" }).round;
  const compared = compareRounds(left, right);
  assert.ok(compared.inputChanges.some((line) => line.includes("Threshold 60% to 65%")));
  assert.ok(compared.inputChanges.some((line) => line.includes("Budget 20 to 10")));
  assert.ok(compared.inputChanges.some((line) => line.includes("lock")));
  assert.ok(compared.optionChanges.some((entry) => entry.field === "changeCost"));
  assert.equal(typeof compared.costDelta, "number");
  assert.equal(typeof compared.approvalDelta, "number");
  assert.ok(compared.supportDeltas.length > 0);
  assert.equal(compared.left.name, "Before");
  assert.equal(compared.right.name, "After");
  assert.throws(() => compareRounds(left, { nope: true }), /invalid/);
});

test("compareRounds tracks groups, clauses, locks, and relationships", () => {
  const left = createRound(demoProposal(), {}).round;
  const proposal = demoProposal();
  proposal.groups.push({ id: "g3", name: "Group 3", weight: 10 });
  for (const clause of proposal.clauses) {
    for (const option of clause.options) option.support.g3 = 50;
  }
  proposal.relationships = [{ id: "r1", kind: "linked", options: ["h2", "m2"] }];
  const right = createRound(proposal, {}).round;
  const compared = compareRounds(left, right);
  assert.ok(compared.inputChanges.some((line) => line.includes("Group added: Group 3")));
  assert.ok(compared.inputChanges.some((line) => line.includes("Relationship added: r1")));
});

test("workspace files carry rounds with validation and old files stay valid", () => {
  const round = createRound(demoProposal(), { name: "First" }).round;
  const formatted = formatWorkspaceJson(demoProposal(), {}, [round]);
  assert.equal(formatted.status, "ok");
  const parsed = parseWorkspaceJson(formatted.json);
  assert.equal(parsed.status, "ok");
  assert.equal(parsed.rounds.length, 1);
  assert.equal(parsed.rounds[0].id, round.id);
  const legacy = formatWorkspaceJson(demoProposal(), {});
  assert.equal(parseWorkspaceJson(legacy.json).rounds.length, 0);
  assert.equal(parseWorkspaceJson(legacy.json).status, "ok");
  const bad = JSON.parse(formatted.json);
  bad.rounds.push({ id: "bad id!", proposal: demoProposal() });
  assert.equal(parseWorkspaceJson(JSON.stringify(bad)).status, "invalid");
  const tooMany = JSON.parse(formatted.json);
  tooMany.rounds = Array.from({ length: MAX_ROUNDS + 1 }, (_, index) => ({ ...round, id: `round-${index}` }));
  assert.equal(parseWorkspaceJson(JSON.stringify(tooMany)).status, "invalid");
  const oversized = formatWorkspaceJson(demoProposal(), {}, tooMany.rounds);
  assert.equal(oversized.status, "invalid");
});

test("CLI rounds lists deterministic round summaries from a workspace", () => {
  const round = createRound(demoProposal(), { name: "First", notes: "human" }).round;
  const formatted = formatWorkspaceJson(demoProposal(), {}, [round]);
  const run = (args, value) => spawnSync(process.execPath, [cli, ...args], { input: value, encoding: "utf8", timeout: 10000 });
  const result = JSON.parse(run(["rounds", "-"], formatted.json).stdout);
  assert.equal(result.count, 1);
  assert.equal(result.rounds[0].id, round.id);
  assert.equal(result.rounds[0].name, "First");
  assert.equal(result.rounds[0].summary.status, "found");
  assert.equal("recordedAt" in result.rounds[0].summary, false);
  const empty = JSON.parse(run(["rounds", "-"], formatWorkspaceJson(demoProposal(), {}).json).stdout);
  assert.equal(empty.count, 0);
  const bad = run(["rounds", "-"], JSON.stringify({ format: "smallest-agreement-workspace", version: 1, proposal: demoProposal(), rounds: [{ id: "x" }] }));
  assert.notEqual(bad.status, 0);
});
