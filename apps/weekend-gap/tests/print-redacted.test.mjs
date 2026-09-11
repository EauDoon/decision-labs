import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import {
  DEFAULT_SCENARIO,
  GENERIC_GATE_LABELS,
  buildGateGanttSvg,
  gateDisplayLabels,
  redactGateLabels,
  scenarioToJSON
} from "../src/model.js";

test("redactGateLabels keeps generic names and replaces custom institution labels", () => {
  const generic = redactGateLabels(GENERIC_GATE_LABELS);
  assert.deepEqual(generic, GENERIC_GATE_LABELS);
  const mixed = redactGateLabels({ issuer: "Issuer", bank: "Westpac", payout: "Payout", fx: "FX desk" });
  assert.equal(mixed.issuer, "Issuer");
  assert.equal(mixed.bank, "Bank");
  assert.equal(mixed.payout, "Payout");
  assert.equal(mixed.fx, "FX");
  const kept = redactGateLabels({ issuer: "issuer", bank: "Bank", payout: "PAYOUT", fx: "Fx" });
  assert.equal(kept.issuer, "issuer");
  assert.equal(kept.bank, "Bank");
  assert.equal(kept.payout, "PAYOUT");
  assert.equal(kept.fx, "Fx");
});

test("print-redacted Gantt headings use generic labels without changing saved scenario JSON", () => {
  const custom = {
    ...DEFAULT_SCENARIO,
    issuerLabel: "Acme Issuer",
    bankLabel: "National Bank",
    payoutLabel: "Off-ramp Co",
    fxLabel: "Desk FX"
  };
  const before = scenarioToJSON(custom);
  const live = gateDisplayLabels(custom, false);
  const redacted = gateDisplayLabels(custom, true);
  assert.equal(live.bank, "National Bank");
  assert.equal(redacted.bank, "Bank");
  assert.equal(redacted.issuer, "Issuer");
  const svg = buildGateGanttSvg(custom, 0, { redacted: true });
  assert.match(svg, />Issuer</);
  assert.match(svg, />Bank</);
  assert.doesNotMatch(svg, /National Bank/);
  assert.doesNotMatch(svg, /Acme Issuer/);
  assert.equal(scenarioToJSON(custom), before);
  assert.match(before, /National Bank/);
});

test("print redacted control is present and does not write back labels", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  const css = await readFile(new URL("../styles.css", import.meta.url), "utf8");
  const app = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
  assert.match(html, /id="print-redacted"/);
  assert.match(html, /Print redacted/);
  assert.match(html, /id="issuer-live-label"/);
  assert.match(html, /class="gate-redacted-label"/);
  assert.match(css, /\.print-redacted \.gate-live-label/);
  assert.match(css, /\.print-redacted \.gate-redacted-label/);
  assert.match(app, /buildGateGanttSvg\(scenario, selectedHour, \{ closedOnly, everyClosedOnly, hideWeekdayHours, hideWeekendHours, hideOpenHours, hideClosedHours, hideZeroQueueHours, hideBankClosedHours, hideIssuerClosedHours, hidePayoutClosedHours, hideFxClosedHours, hidePayoutOpenHours, hideFxOpenHours, hideBankOpenHours, hideIssuerOpenHours, hideWeekendIssuerOpenHours, hideWeekendIssuerClosedHours, hideWeekendBankClosedHours, hideWeekendBankOpenHours, hideWeekendPayoutOpenHours, hideWeekendFxOpenHours, hideWeekendPayoutClosedHours, gateFilter, redacted: true \}\)/);
  const printHandler = app.slice(app.indexOf('document.querySelector("#print-redacted")'), app.indexOf('document.querySelector("#copy-dashboard-markdown")'));
  assert.doesNotMatch(printHandler, /setScenario\(/);
  assert.match(printHandler, /The saved scenario was not changed/);
});
