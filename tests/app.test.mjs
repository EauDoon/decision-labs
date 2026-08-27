import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { DEFAULT_SCENARIO } from "../src/model.js";

const appSource = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
const planningAud = Function(`${appSource.slice(appSource.indexOf("function planningAud("), appSource.indexOf("function signedAud("))}; return planningAud;`)();

test("reserve planner money retains cents and discloses display rounding", () => {
  assert.equal(planningAud(0.615), "A$0.62 (rounded to cents)");
  assert.equal(planningAud(10000.051), "A$10,000.05 (rounded to cents)");
  assert.equal(planningAud(5e-7), "A$0.00 (rounded to cents)");
  assert.match(appSource, /planningAud\(p\.targetAud\)/);
  assert.match(appSource, /planningAud\(p\.maximumSettledAud\)/);
});

const helperStart = appSource.indexOf("function noPayoutExplanation");
const helperEnd = appSource.indexOf("function render()", helperStart);
const { noPayoutExplanation, currentScenarioHashError } = Function(
  `${appSource.slice(helperStart, helperEnd)}; return { noPayoutExplanation, currentScenarioHashError };`
)();

test("zero-capacity payout explanations name the actual permanent blocker", () => {
  assert.equal(
    noPayoutExplanation(DEFAULT_SCENARIO, 0),
    "No payout is available because the AUD reserve is exhausted."
  );
  assert.equal(
    noPayoutExplanation({ ...DEFAULT_SCENARIO, issuerThroughputAudPerHour: 0 }, 1),
    "No payout is available because issuer throughput is zero."
  );
  assert.equal(
    noPayoutExplanation(DEFAULT_SCENARIO, 1),
    "The edited business-hour windows do not overlap within the modeled search period."
  );
});

test("invalid hash handling keeps state and reports that accurately", () => {
  assert.equal(
    currentScenarioHashError("The shared scenario link is too large. Defaults were kept."),
    "The shared scenario link is too large. The current scenario was kept."
  );

  const restoreScenario = appSource.slice(appSource.indexOf("function restoreScenario()"), appSource.indexOf("function setMessage()"));
  assert.match(restoreScenario, /if \(fromHash\.errors\.length\) \{\s+setMessage\(fromHash\.errors\[0\]\);\s+return;\s+\}\s+try/s);

  const hashChangeHandler = appSource.slice(appSource.indexOf('window.addEventListener("hashchange"'), appSource.indexOf('window.addEventListener("resize"'));
  assert.match(hashChangeHandler, /if \(!fromHash\.scenario\) \{\s+if \(fromHash\.errors\.length\) setMessage\(currentScenarioHashError\(fromHash\.errors\[0\]\)\);\s+return;/s);
});

test("outcome summary surfaces completion, residual queue and peak timing", async () => {
  const indexSource = await readFile(new URL("../index.html", import.meta.url), "utf8");
  assert.match(indexSource, /id="outcome-summary"/);
  assert.match(indexSource, /id="settled-total-value"/);
  assert.match(indexSource, /id="final-queue-value"/);
  assert.match(indexSource, /id="peak-queue-value"/);
  assert.match(indexSource, /id="backlog-hours-value"/);
  assert.match(appSource, /simulation\.summary/);
  assert.match(appSource, /peakQueueHour/);
  assert.match(appSource, /hoursWithQueue/);
  assert.match(appSource, /outcome-explanation/);
});
