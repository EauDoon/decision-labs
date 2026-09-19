import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import {
  clonePreset, validateConfiguration, exploreNegotiationAlternatives, applyNegotiationAlternative,
  negotiationAlternativesCsv, analyzePartnershipReview, PARTNERSHIP_REVIEW_TOOLS,
  MAX_ALTERNATIVE_CANDIDATES,
} from '../src/model.js';

const cli = fileURLToPath(new URL('../scripts/analyze.mjs', import.meta.url));

function exploredCase() {
  const config = clonePreset('balanced');
  config.alternatives = {
    feeLevels: [0.18, 0.2, 0.22],
    shareModes: ['current', 'equal', 'funded'],
    commitmentRelief: true,
    capacityInvestments: [{ participantId: 'liquidity-partner', addedCapacity: 20000, investmentCost: 500 }],
    objective: 'stress-holds',
  };
  return config;
}

test('grid enumerates the full declared cross product with deterministic ids', () => {
  const explored = exploreNegotiationAlternatives(exploredCase());
  assert.equal(explored.searchMode, 'grid');
  assert.equal(explored.candidateCount + explored.skipped.length, 3 * 3 * 2 * 2);
  assert.ok(explored.candidateCount <= MAX_ALTERNATIVE_CANDIDATES);
  assert.deepEqual(explored.candidates.map((c) => c.rank), explored.candidates.map((_, i) => i + 1));
  assert.deepEqual(explored.bounds.feeLevels, [0.18, 0.2, 0.22]);
  assert.deepEqual(explored.bounds.shareModes, ['current', 'equal', 'funded']);
  assert.ok(explored.assumptionsHeldConstant.length > 0);
});

test('stress-holds objective ranks robustness first, profit ranks economics first', () => {
  const holds = exploreNegotiationAlternatives(exploredCase());
  const profits = exploreNegotiationAlternatives({ ...exploredCase(), alternatives: { ...exploredCase().alternatives, objective: 'profit' } });
  assert.equal(holds.objective, 'stress-holds');
  assert.equal(profits.objective, 'profit');
  const holdsOrder = holds.candidates.map((c) => [c.stressHolds, c.monthlyTotalProfit]);
  const sortedHolds = [...holdsOrder].sort((a, b) => (b[0] - a[0]) || (b[1] - a[1]));
  assert.deepEqual(holdsOrder, sortedHolds);
  const profitOrder = profits.candidates.map((c) => [c.monthlyTotalProfit, c.stressHolds]);
  const sortedProfit = [...profitOrder].sort((a, b) => (b[0] - a[0]) || (b[1] - a[1]));
  assert.deepEqual(profitOrder, sortedProfit);
});

test('infeasible funded modes are skipped with reasons, never invented', () => {
  const explored = exploreNegotiationAlternatives(exploredCase());
  assert.ok(explored.skipped.length > 0);
  for (const skipped of explored.skipped) {
    assert.match(skipped.reason, /skipped rather than invented/);
  }
  assert.ok(explored.candidates.every((c) => c.shareMode !== 'funded' || c.feasible || c.failureSummary !== ''));
});

test('capacity investments change capacity and fixed cost for one participant only', () => {
  const explored = exploreNegotiationAlternatives(exploredCase());
  const invested = explored.candidates.find((c) => c.investment);
  assert.ok(invested);
  const target = invested.participants.find((p) => p.id === 'liquidity-partner');
  const base = exploredCase().participants.find((p) => p.id === 'liquidity-partner');
  assert.equal(target.capacity, (base.capacity ?? 0) + 20000);
  assert.equal(target.fixedMonthlyCost, base.fixedMonthlyCost + 500);
  const others = invested.participants.filter((p) => p.id !== 'liquidity-partner');
  for (const other of others) {
    const original = exploredCase().participants.find((p) => p.id === other.id);
    assert.equal(other.fixedMonthlyCost, original.fixedMonthlyCost);
  }
});

test('commitment relief zeroes commitments without touching other inputs', () => {
  const explored = exploreNegotiationAlternatives(exploredCase());
  const relieved = explored.candidates.find((c) => c.commitmentRelief);
  assert.ok(relieved);
  assert.ok(relieved.participants.every((p) => (p.minimumCommitment ?? 0) === 0));
  assert.equal(relieved.deal.monthlyVolume, exploredCase().deal.monthlyVolume);
});

test('deltas compare each candidate against the current monthly case', () => {
  const explored = exploreNegotiationAlternatives(exploredCase());
  const current = explored.candidates.find((c) => c.shareMode === 'current' && c.fee === 0.2 && !c.commitmentRelief && !c.investment);
  assert.ok(current);
  assert.ok(current.participantProfits.every((p) => p.profitDelta === 0));
  const moved = explored.candidates.find((c) => c.fee === 0.22 && c.shareMode === 'current' && !c.commitmentRelief && !c.investment);
  assert.ok(moved);
  assert.ok(moved.participantProfits.some((p) => p.profitDelta !== 0));
});

test('apply replaces only fee, shares, commitments, capacity, and fixed costs', () => {
  const config = exploredCase();
  const explored = exploreNegotiationAlternatives(config);
  const candidate = explored.candidates.find((c) => c.feasible);
  assert.ok(candidate);
  const next = applyNegotiationAlternative(config, candidate.id);
  assert.equal(next.deal.feePerTransaction, candidate.fee);
  assert.equal(next.deal.monthlyVolume, config.deal.monthlyVolume);
  assert.deepEqual(next.participants.map((p) => p.revenueShare), candidate.participants.map((p) => p.revenueShare));
  assert.equal(validateConfiguration(next).valid, true);
  try {
    applyNegotiationAlternative(config, 'alt-999');
    assert.fail('expected an unknown-candidate error');
  } catch (error) {
    assert.match(error.errors.join(' '), /current alternative candidate/);
  }
  const failing = explored.candidates.find((c) => !c.feasible);
  if (failing) {
    try {
      applyNegotiationAlternative(config, failing.id);
      assert.fail('expected a failing-candidate error');
    } catch (error) {
      assert.match(error.errors.join(' '), /viable alternative/);
    }
  }
});

test('exploration validation rejects bad grids and oversized searches', () => {
  const base = exploredCase();
  assert.equal(validateConfiguration({ ...base, alternatives: { ...base.alternatives, feeLevels: [] } }).valid, false);
  assert.equal(validateConfiguration({ ...base, alternatives: { ...base.alternatives, feeLevels: [0.2, 0.2, 0.2, 0.2, 0.2, 0.2, 0.2] } }).valid, false);
  assert.equal(validateConfiguration({ ...base, alternatives: { ...base.alternatives, shareModes: ['current', 'current'] } }).valid, false);
  assert.equal(validateConfiguration({ ...base, alternatives: { ...base.alternatives, shareModes: ['mystery'] } }).valid, false);
  assert.equal(validateConfiguration({ ...base, alternatives: { ...base.alternatives, commitmentRelief: 'yes' } }).valid, false);
  assert.equal(validateConfiguration({ ...base, alternatives: { ...base.alternatives, capacityInvestments: [{ participantId: 'ghost', addedCapacity: 1, investmentCost: 1 }] } }).valid, false);
  assert.equal(validateConfiguration({ ...base, alternatives: { ...base.alternatives, objective: 'vibes' } }).valid, false);
  assert.equal(validateConfiguration({ ...base, alternatives: { ...base.alternatives, feeLevels: [0.19, 0.2, 0.21, 0.22, 0.23, 0.24], shareModes: ['current', 'equal', 'funded'], commitmentRelief: true, capacityInvestments: [{ participantId: 'platform', addedCapacity: 1, investmentCost: 0 }, { participantId: 'distributor', addedCapacity: 1, investmentCost: 0 }, { participantId: 'liquidity-partner', addedCapacity: 1, investmentCost: 0 }] } }).valid, false);
  assert.equal(validateConfiguration({ ...base, alternatives: null }).valid, false);
  assert.equal(validateConfiguration(clonePreset('balanced')).valid, true);
});

test('exploration absent throws a useful error from explore and apply', () => {
  for (const fn of [() => exploreNegotiationAlternatives(clonePreset('balanced')), () => applyNegotiationAlternative(clonePreset('balanced'), 'alt-1')]) {
    try {
      fn();
      assert.fail('expected an absent-exploration error');
    } catch (error) {
      assert.match(error.errors.join(' '), /exploration is absent/);
    }
  }
});

test('alternatives review tool tabulates candidates with the stated objective', () => {
  assert.ok(PARTNERSHIP_REVIEW_TOOLS.some((tool) => tool.id === 'alternatives'));
  const review = analyzePartnershipReview(exploredCase(), 'alternatives');
  assert.deepEqual(review.columns, ['Candidate', 'Fee', 'Shares', 'Commitments', 'Capacity investment', 'Monthly viable', 'Stress holds', 'Total profit', 'Weakest binding']);
  assert.ok(review.rows.length > 0);
  assert.match(review.note, /Objective stress-holds/);
  assert.match(review.note, /not an optimum/);
  const empty = analyzePartnershipReview(clonePreset('balanced'), 'alternatives');
  assert.deepEqual(empty.rows, []);
  assert.match(empty.note, /No negotiation exploration/);
});

test('alternatives CSV lists candidates, skipped points, and the objective memo', () => {
  const csv = negotiationAlternativesCsv(exploredCase());
  assert.match(csv, /^"Section","Candidate","Rank","Fee","Shares"/);
  assert.match(csv, /"candidate","alt-/);
  assert.match(csv, /"skipped"/);
  assert.match(csv, /"objective"/);
  assert.match(csv, /delta vs current/);
});

test('CLI alternatives and apply-alternative follow the JSON contract', () => {
  const run = (args, value) => spawnSync(process.execPath, [cli, ...args], { input: JSON.stringify(value), encoding: 'utf8', timeout: 10000 });
  const config = exploredCase();
  const explored = JSON.parse(run(['alternatives', '-'], config).stdout);
  assert.equal(explored.searchMode, 'grid');
  assert.ok(explored.candidateCount > 0);
  const csv = run(['alternatives', '-', '--csv'], config).stdout;
  assert.match(csv, /"candidate"/);
  const best = explored.bestFeasibleId;
  assert.ok(best);
  const applied = JSON.parse(run(['apply-alternative', '-', best], config).stdout);
  assert.equal(applied.deal.feePerTransaction, explored.candidates.find((c) => c.id === best).fee);
  const missing = run(['alternatives', '-'], clonePreset('balanced'));
  assert.equal(missing.status, 1);
  assert.match(missing.stderr, /absent/);
  const badApply = run(['apply-alternative', '-', 'alt-999'], config);
  assert.equal(badApply.status, 1);
  const badFlag = run(['alternatives', '-', '--xml'], config);
  assert.equal(badFlag.status, 1);
});
