import test from "node:test";
import assert from "node:assert/strict";
import {
  clonePreset,
  computeResidualCoverage,
  leftoverFillEvidenceToMarkdown,
  uncoveredLeftoverEvidenceToMarkdown,
  leftoverOnlyEvidenceToMarkdown,
  tertiaryFillEvidenceToMarkdown,
  winningOfferEvidenceToMarkdown,
  validateScenario,
} from "../src/model.js";

function evidenceFixture() {
  const source = clonePreset("neighbourhood");
  return validateScenario({
    title: "Evidence fixture",
    currency: "AUD",
    buyers: [
      { ...source.buyers[0], id: "B01", label: "SECRET_LABEL", category: "Coffee beans", quantity: 8, maxUnitPrice: 30, latestDeliveryDays: 7, allowedVariants: ["Medium roast"] },
      { ...source.buyers[0], id: "B02", label: "Coffee annex", category: "Coffee beans", quantity: 4, maxUnitPrice: 30, latestDeliveryDays: 7, allowedVariants: ["Medium roast"] },
      { ...source.buyers[0], id: "B03", label: "Tea room", category: "Tea tins", quantity: 5, maxUnitPrice: 18, latestDeliveryDays: 10, allowedVariants: ["Black tea"] },
      { ...source.buyers[0], id: "B04", label: "Tea loft", category: "Tea tins", quantity: 4, maxUnitPrice: 18, latestDeliveryDays: 10, allowedVariants: ["Black tea"] }
    ],
    offers: [
      { ...source.offers[0], id: "O01", merchant: "Harbour Roasters", category: "Coffee beans", variant: "Medium roast", unitPrice: 24, minimumUnits: 10, deliveryDays: 5, capacity: 20, shippingPerBuyer: 1 },
      { ...source.offers[0], id: "O02", merchant: "Leaf Collective", category: "Tea tins", variant: "Black tea", unitPrice: 14, minimumUnits: 6, deliveryDays: 8, capacity: 20, shippingPerBuyer: 1 }
    ]
  });
}

test("leftover-fill evidence carries every retired single-field fact", () => {
  const scenario = evidenceFixture();
  const coverage = computeResidualCoverage(scenario);
  const text = leftoverFillEvidenceToMarkdown(scenario);
  assert.equal(text, leftoverFillEvidenceToMarkdown(scenario));
  assert.match(text, /organizer private/);
  assert.match(text, /Not a merchant export/);
  if (coverage.secondary) {
    assert.match(text, new RegExp(coverage.secondary.merchant));
    assert.match(text, new RegExp(`${coverage.secondary.deliveredBuyers} buyers, ${coverage.secondary.fulfilledUnits} units`));
    assert.match(text, new RegExp(`Units: ${coverage.secondary.fulfilledUnits}`));
  } else {
    assert.match(text, /Summary: none/);
  }
  for (const label of ["Merchant:", "Offer:", "Remaining capacity:", "Fulfillment:", "Delivery days:", "Pickup days:", "Minimum units:", "Offer capacity:"]) {
    assert.match(text, new RegExp(label));
  }
  assert.doesNotMatch(text, /SECRET_LABEL/);
  assert.doesNotMatch(text, /B0[1-4]/);
});

test("uncovered-leftover evidence carries the counts document and one-line facts", () => {
  const scenario = evidenceFixture();
  const coverage = computeResidualCoverage(scenario);
  const text = uncoveredLeftoverEvidenceToMarkdown(scenario);
  assert.match(text, new RegExp(`Uncovered leftover buyers: ${coverage.unfilledBuyerCount}`));
  assert.match(text, new RegExp(`Uncovered leftover units: ${coverage.unfilledUnits}`));
  for (const label of ["Units:", "Remaining:", "Count:", "Leftover-fill offer capacity:", "Leftover-fill offer minimum:"]) {
    assert.match(text, new RegExp(label));
  }
  assert.match(text, /organizer private/);
  assert.doesNotMatch(text, /SECRET_LABEL/);
});

test("leftover-only evidence carries all eight allocated facts without buyer identities", () => {
  const scenario = evidenceFixture();
  const text = leftoverOnlyEvidenceToMarkdown(scenario);
  for (const label of ["Count:", "Remaining units:", "Maximum buyer quantity:", "Minimum buyer quantity:", "Headroom:", "Allocated units:", "Offer capacity:", "Offer unit price:"]) {
    assert.match(text, new RegExp(label));
  }
  assert.match(text, /organizer private/);
  assert.doesNotMatch(text, /SECRET_LABEL/);
  assert.doesNotMatch(text, /Coffee annex/);
});

test("tertiary-fill evidence carries remaining and offer capacity", () => {
  const scenario = evidenceFixture();
  const text = tertiaryFillEvidenceToMarkdown(scenario);
  assert.match(text, /Remaining capacity:/);
  assert.match(text, /Offer capacity:/);
  assert.match(text, /organizer private/);
  assert.doesNotMatch(text, /SECRET_LABEL/);
});

test("winning-offer evidence is merchant-safe and names no buyers", () => {
  const scenario = evidenceFixture();
  const text = winningOfferEvidenceToMarkdown(scenario);
  assert.match(text, /Merchant:/);
  assert.match(text, /Fulfillment:/);
  assert.match(text, /Remaining capacity:/);
  assert.doesNotMatch(text, /organizer private/);
  assert.doesNotMatch(text, /Not a merchant export/);
  assert.doesNotMatch(text, /SECRET_LABEL/);
  assert.doesNotMatch(text, /B0[1-4]/);
});

test("evidence documents stay honest when nothing is unlocked", () => {
  const source = clonePreset("neighbourhood");
  const scenario = validateScenario({
    ...source,
    title: "Empty room",
    buyers: [],
    offers: [],
  });
  assert.match(leftoverFillEvidenceToMarkdown(scenario), /Summary: none/);
  assert.match(uncoveredLeftoverEvidenceToMarkdown(scenario), /Uncovered leftover buyers: 0/);
  assert.match(winningOfferEvidenceToMarkdown(scenario), /None unlocked/);
});
