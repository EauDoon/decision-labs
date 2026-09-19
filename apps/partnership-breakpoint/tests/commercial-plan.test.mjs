import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import {
  clonePreset, validateConfiguration, evaluateCommercialPlan, commercialPlanCsv,
  createCommercialBrief, analyzePartnershipReview, PARTNERSHIP_REVIEW_TOOLS,
} from '../src/model.js';

const cli = fileURLToPath(new URL('../scripts/analyze.mjs', import.meta.url));

function twoParticipantCase() {
  return {
    deal: { monthlyVolume: 1000, feePerTransaction: 1, addressableVolume: 1000 },
    participants: [
      { id: 'a', name: 'Alpha', revenueShare: 0.6, variableCostPerTransaction: 0.2, fixedMonthlyCost: 100, minimumAcceptableProfit: 50, riskCost: 0 },
      { id: 'b', name: 'Beta', revenueShare: 0.4, variableCostPerTransaction: 0.1, fixedMonthlyCost: 50, minimumAcceptableProfit: 20, riskCost: 0 },
    ],
    plan: {
      startingCash: 0,
      periods: [
        { volume: 1000, feePerTransaction: 1, addressableVolume: 1000, setupExpense: 500 },
        { volume: 1000, feePerTransaction: 1, addressableVolume: 1000 },
      ],
    },
  };
}

test('hand-computed two-period plan matches independent arithmetic', () => {
  const plan = evaluateCommercialPlan(twoParticipantCase());
  // Period 1: Alpha revenue 600, variable 200, fixed 100 -> profit 300. Beta: 400-100-50=250.
  const alpha = plan.participantPeriods[0];
  assert.equal(alpha.rows[0].monthlyProfit, 300);
  assert.equal(alpha.rows[0].viable, true);
  assert.equal(plan.participantPeriods[1].rows[0].monthlyProfit, 250);
  // Operating 550, setup 500 -> cumulative net 50; period 2 operating 550 -> cumulative 600.
  assert.equal(plan.periodTotals[0].operatingContribution, 550);
  assert.equal(plan.periodTotals[0].cumulativeNet, 50);
  assert.equal(plan.periodTotals[1].cumulativeNet, 600);
  assert.equal(plan.recovery.status, 'recovered');
  assert.equal(plan.recovery.period, 1);
  assert.equal(plan.totalSetupExpense, 500);
  assert.equal(plan.horizonOperatingContribution, 1100);
});

test('recovery distinguishes none-required, beyond-horizon, and impossible', () => {
  const base = twoParticipantCase();
  const noneRequired = evaluateCommercialPlan({ ...base, plan: { periods: [{ volume: 1000, feePerTransaction: 1 }] } });
  assert.equal(noneRequired.recovery.status, 'none-required');
  const short = evaluateCommercialPlan({ ...base, plan: { periods: [
    { volume: 1000, feePerTransaction: 1, setupExpense: 50000 },
    { volume: 1000, feePerTransaction: 1 },
  ] } });
  assert.equal(short.recovery.status, 'beyond-horizon');
  assert.ok(short.recovery.shortfall > 0);
  const loss = { ...base, plan: { periods: [{ volume: 0, feePerTransaction: 1, setupExpense: 100 }] } };
  const impossible = evaluateCommercialPlan(loss);
  assert.equal(impossible.recovery.status, 'impossible');
});

test('first constrained period names the period an exit test fails', () => {
  const config = twoParticipantCase();
  config.plan.periods[1] = { volume: 1000, feePerTransaction: 0.1, addressableVolume: 1000 };
  const plan = evaluateCommercialPlan(config);
  const alpha = plan.participantPeriods[0];
  assert.equal(alpha.rows[1].viable, false);
  assert.equal(alpha.firstConstrainedPeriod, 2);
  assert.equal(plan.participantPeriods[1].rows[1].viable, false);
  assert.equal(plan.participantPeriods[1].firstConstrainedPeriod, 2);
});

test('capacity overrides are honored and explicit null capacity means unbounded', () => {
  const config = twoParticipantCase();
  config.plan.periods[0].participants = { a: { capacity: 10 } };
  const plan = evaluateCommercialPlan(config);
  assert.equal(plan.participantPeriods[0].rows[0].viable, false);
  assert.deepEqual(plan.participantPeriods[0].rows[0].failureReasons, ['volume exceeds capacity']);
  const config2 = twoParticipantCase();
  config2.participants[0].capacity = 10;
  config2.plan.periods[0].participants = { a: { capacity: null } };
  assert.equal(evaluateCommercialPlan(config2).participantPeriods[0].rows[0].viable, true);
});

test('cash schedule separates P&L from collections and conserves funds', () => {
  const config = twoParticipantCase();
  config.plan.collectionLagPeriods = 1;
  config.plan.paymentLagPeriods = 1;
  config.plan.startingCash = 200;
  const plan = evaluateCommercialPlan(config);
  // Period 1 collects nothing and pays nothing; period 2 collects period-1 revenue and pays period-1 expenses.
  assert.equal(plan.cash.rows[0].cashIn, 0);
  assert.equal(plan.cash.rows[0].cashOut, 0);
  assert.equal(plan.cash.rows[0].closingCash, 200);
  assert.equal(plan.cash.rows[1].cashIn, 1000);
  assert.equal(plan.cash.rows[1].cashOut, 950);
  // Conservation identities hold exactly.
  assert.equal(plan.cash.totalCashIn + plan.cash.receivablesAfterHorizon, plan.cash.totalEarnedRevenue);
  assert.equal(plan.cash.totalCashOut + plan.cash.payablesAfterHorizon, plan.cash.totalIncurredExpense);
  assert.equal(plan.cash.rows[1].closingCash - plan.startingCash, plan.cash.totalCashIn - plan.cash.totalCashOut);
  // With starting cash 200 and minimum closing 200, no extra funding is needed.
  assert.equal(plan.cash.fundingRequirement, 0);
});

test('funding requirement equals the cash needed to keep every closing non-negative', () => {
  const config = twoParticipantCase();
  config.plan.collectionLagPeriods = 1;
  const plan = evaluateCommercialPlan(config);
  assert.ok(plan.cash.minClosingCash < 0);
  assert.equal(plan.cash.fundingRequirement, -plan.cash.minClosingCash);
  const funded = evaluateCommercialPlan({ ...config, plan: { ...config.plan, startingCash: plan.cash.fundingRequirement } });
  assert.ok(funded.cash.rows.every((row) => row.closingCash >= -1e-9));
});

test('plan validation rejects bad periods, lags, unknown ids, and reserved keys', () => {
  const base = twoParticipantCase();
  assert.equal(validateConfiguration({ ...base, plan: { periods: [] } }).valid, false);
  assert.equal(validateConfiguration({ ...base, plan: { periods: new Array(25).fill({ volume: 1, feePerTransaction: 1 }) } }).valid, false);
  assert.equal(validateConfiguration({ ...base, plan: { collectionLagPeriods: 5, periods: base.plan.periods } }).valid, false);
  assert.equal(validateConfiguration({ ...base, plan: { periods: [{ volume: 1, feePerTransaction: 1, participants: { ghost: {} } }] } }).valid, false);
  assert.equal(validateConfiguration({ ...base, plan: { periods: [{ volume: 1, feePerTransaction: -1 }] } }).valid, false);
  assert.equal(validateConfiguration({ ...base, plan: { periods: [{ volume: 1, feePerTransaction: 1 }], bogus: 1 } }).valid, false);
  const reserved = { ...base, plan: JSON.parse(JSON.stringify(base.plan)) };
  reserved.plan.periods[0].participants = JSON.parse('{"__proto__":{}}');
  assert.equal(validateConfiguration(reserved).valid, false);
  assert.equal(validateConfiguration({ ...base, plan: null }).valid, false);
});

test('legacy cases without a plan stay valid and evaluating one throws a useful error', () => {
  const config = clonePreset('balanced');
  assert.equal(validateConfiguration(config).valid, true);
  try {
    evaluateCommercialPlan(config);
    assert.fail('expected an absent-plan error');
  } catch (error) {
    assert.match(error.errors.join(' '), /Commercial plan is absent/);
  }
});

test('commercial review tool reports holding periods, first constraint, and cash', () => {
  assert.ok(PARTNERSHIP_REVIEW_TOOLS.some((tool) => tool.id === 'commercial'));
  const review = analyzePartnershipReview(twoParticipantCase(), 'commercial');
  assert.equal(review.rows.length, 2);
  assert.deepEqual(review.columns, ['Participant', 'Periods holding', 'First constrained period', 'Horizon operating profit', 'Period-by-period hold']);
  assert.match(review.note, /Recovery:/);
  assert.match(review.note, /funding requirement/);
});

test('commercial review on a plan-less case is an honest empty state, not an error', () => {
  const review = analyzePartnershipReview(clonePreset('balanced'), 'commercial');
  assert.deepEqual(review.rows, []);
  assert.match(review.note, /No commercial plan is attached/);
});

test('commercial brief keeps canonical inputs, evaluation, and monthly run-rate', () => {
  const brief = createCommercialBrief(twoParticipantCase());
  assert.equal(brief.format, 'partnership-commercial-brief');
  assert.equal(brief.version, 1);
  assert.equal(brief.evaluation.recovery.status, 'recovered');
  assert.equal(brief.monthlyRunRate.viable, true);
  assert.equal(brief.scenario.plan.periods.length, 2);
});

test('plan CSV separates P&L, totals, cash, recovery, and funding sections', () => {
  const csv = commercialPlanCsv(twoParticipantCase());
  assert.match(csv, /^"Section","Period","Participant ID"/);
  assert.match(csv, /"period-profit","1","a","Alpha","1000","1","600","200","100","0","300","true"/);
  assert.match(csv, /"plan-total","1",.*"550","500","50","50"/);
  assert.match(csv, /"cash","2",.*"50","1000","450","600"/);
  assert.match(csv, /"recovery"/);
  assert.match(csv, /"funding"/);
});

test('CLI plan evaluates JSON, CSV, and brief; invalid plans fail closed', () => {
  const run = (args, value) => spawnSync(process.execPath, [cli, ...args], { input: JSON.stringify(value), encoding: 'utf8', timeout: 10000 });
  const config = twoParticipantCase();
  const json = JSON.parse(run(['plan', '-'], config).stdout);
  assert.equal(json.recovery.status, 'recovered');
  const csv = run(['plan', '-', '--csv'], config).stdout;
  assert.match(csv, /"period-profit"/);
  const brief = JSON.parse(run(['plan', '-', '--brief'], config).stdout);
  assert.equal(brief.format, 'partnership-commercial-brief');
  const bad = run(['plan', '-'], { ...config, plan: { periods: [] } });
  assert.equal(bad.status, 1);
  assert.match(bad.stderr, /periods/);
  const noPlan = run(['plan', '-'], clonePreset('balanced'));
  assert.equal(noPlan.status, 1);
  assert.match(noPlan.stderr, /absent/);
  const badFlag = run(['plan', '-', '--xml'], config);
  assert.equal(badFlag.status, 1);
});
