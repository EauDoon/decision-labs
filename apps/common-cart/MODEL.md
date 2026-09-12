# Model notes

Common Cart uses a small deterministic matching model. Every result is derived from the scenario visible in the browser. There are no live prices, external services, hidden scores, or random draws.

## Inputs

Each buyer supplies:

- one product category;
- a whole-number quantity;
- a maximum unit price;
- a latest delivery time in days; and
- one or more accepted variants.

Each merchant offer supplies:

- one product category and variant;
- a unit price;
- a minimum order in units;
- delivery time in days;
- capacity in units;
- shipping cost per included buyer; and
- optional `fulfillment` of `shipping` or `pickup`.

If `fulfillment` is omitted, validation stores `shipping`, so older JSON keeps working. The only accepted values are `shipping` and `pickup`. Unknown strings are rejected. Pickup does not rewrite the stored `shippingPerBuyer` field. During compatibility, budgets, allocations, and totals, pickup treats shipping as 0.

An offer can also supply `tiers`, an optional array of up to eight `{ minimumUnits, unitPrice }` objects. Thresholds must be whole numbers, strictly increase above the previous minimum, and fit capacity. Prices must be nonnegative and strictly decrease below the previous price. Missing or empty tiers retain the original flat-price behavior. Tier objects survive JSON, autosave, and share-link round trips. Adding `fulfillment` does not change those tier rules.

All money values use the scenario's currency code. The code must be exactly three ASCII letters and is stored uppercase. The app does not perform currency conversion. Numeric fields accept JSON numbers and plain decimal strings; hexadecimal, binary, octal, exponential, and plus-prefixed strings are rejected rather than coerced.

Text fields are trimmed. Empty values after trim are rejected. Titles are at most 80 characters. Buyer and offer identifiers are at most 24 characters and must be unique within their collection. Labels, categories, merchant names, and variants are at most 60 characters. Each buyer lists between 1 and 12 accepted variants. Money amounts are finite numbers from 0 to 1,000,000. Delivery times are whole days from 0 to 365. Identifiers are compared as stored; they are not case-folded or Unicode-normalized. Unknown fields are rejected, including prototype keys such as `__proto__` and `constructor`. Validation reads own properties only, so values inherited from a prototype do not satisfy a field.

## Compatibility

Buyer `b` is compatible with offer `o` when:

```text
sameCategory(b, o)
and offeredVariant(o) is in acceptedVariants(b)
and unitPrice(o) <= maxUnitPrice(b)
and deliveryDays(o) <= latestDeliveryDays(b)
```

Category and variant comparisons trim surrounding whitespace, apply Unicode lowercasing, and normalize to NFC after input validation. Canonically equivalent spellings therefore match and group together. Matching remains exact after that normalization; inputs are not otherwise interpreted or classified.

For a tiered offer, `unitPrice` means the price of the band being evaluated. The ceiling covers items only. Shipping is included in landed totals and may exceed that ceiling; the buyer room shows the excess without excluding a buyer who meets the original item-price rule.

## Capacity allocation

The allocator performs an exact bounded whole-order search. It chooses a set of complete buyer quantities with the greatest total units that does not exceed merchant capacity. It never splits a buyer's quantity. Buyer IDs provide a stable deterministic order when more than one set reaches the same unit total.

To keep this exact search responsive, a scenario accepts at most 40 buyers and 40 offers, and each buyer quantity, merchant minimum, and merchant capacity is capped at 5,000 units. Those 40-entry bounds are a local matching cap, not a server quota. A room may have zero buyers. That empty room has no demand, so no offer qualifies until buyers are added or the neighbourhood example is restored. A room may have zero offers. That empty list unlocks nothing until an offer is added or example offers are restored. Restoring example offers copies neighbourhood bids and leaves buyers, title, and currency in place.

## Quantity price bands

Each price applies to all included units, not just the units above its threshold. A band's inclusive upper bound is the next tier's minimum minus one, or merchant capacity for the final band. Each band gets an independent exact whole-order search using buyers compatible at that band's price and its upper bound. The band is feasible only if its allocated units reach its own minimum. The feasible band with the most units is selected.

This also handles buyers who cannot afford the base price but can jointly qualify for a lower price. Eligibility does not depend on a preliminary base-price allocation. A group with two six-unit orders cannot reach a ten-unit threshold when capacity is ten, even though interested demand totals twelve.

The price-band table distinguishes all compatible demand from whole units that actually fit that band. Its shortfall is a quantity gap, not a promise that one extra buyer will solve it. The added buyer must also meet the constraints and fit as a whole order. Lower bands can be feasible without being selected. No synthetic transaction occurs when every band is infeasible.

The allocator maximizes units for one offer, not fairness or multi-merchant allocation. Equal-unit cohorts preserve the existing stable buyer-ID rule rather than optimizing shipping or headroom. Tier bands are disjoint, so different feasible bands cannot tie on allocated quantity.

## Qualification and totals

An offer qualifies when selected compatible units are at least the offer minimum.

For a qualifying offer:

```text
total cost = fulfilled units * unit price
           + included buyers * shipping per buyer

reservation value = sum(max unit price * quantity) for included buyers

group headroom = max(0, reservation value - total cost)

landed unit cost = total cost / fulfilled units

fulfillment rate = fulfilled units / all requested units

base-price discount = fulfilled units * (base price - selected tier price)

buyer landed total = buyer quantity * selected tier price + shipping per buyer

buyer ceiling headroom = buyer quantity * max item price - buyer landed total
```

Buyer ceiling headroom is signed, so a shipping overrun remains visible. Group headroom retains its original zero floor. The base-price discount compares the same allocated units at two declared prices with unchanged shipping. It is separate from group headroom and is not a comparison with a verified market offer. Arithmetic uses JavaScript numbers and display rounding, not an accounting ledger.

An offer that misses its minimum executes no synthetic transaction, so fulfilled units, cost, headroom, and included buyer IDs are reported as zero or empty. Its compatible unit count remains visible to show the gap.

The buyer room also reports a deterministic outcome for every buyer and offer pair. It identifies failed compatibility tests, whole orders omitted by capacity, compatible orders blocked because the offer misses its minimum, and orders included in a qualifying cohort. These buyer-level explanations are not displayed in the merchant view.

## Ranking

Qualified offers always rank above unqualified offers. The remaining order is:

1. more fulfilled units;
2. more group headroom;
3. more included buyers;
4. lower total cost; and
5. lexicographically smaller offer ID.

The final rule makes exact ties deterministic.

## Residual coverage

After a winning offer is chosen, leftover buyers (those not in the winner's selected set) may be matched to the next-best other offer, then a third distinct offer, using the same exact whole-order allocator. A buyer's quantity is never split across offers. If no winner exists, every buyer remains leftover. If leftover buyers or leftover offers are missing, there is no secondary fill. Tertiary fill runs only after a secondary match, on the buyers still unfilled, and never reuses the primary or secondary offer.

This is a planning aid. It is not a dual checkout, split invoice, or promise that two or three merchants will jointly fulfill one room.

Organizer views may list leftover buyer identifiers. Merchant residual JSON reports leftover buyer counts and units only. Organizer briefing names secondary and tertiary merchants as aggregates. Room comparisons include leftover and unfilled counts.

## Units to the next cheaper tier

For one offer, the next cheaper quantity band is the band after the selected index, or after the base band when the offer does not qualify. The model reports how many additional whole units that independent band still needs, which currently excluded buyers are compatible at the next price, and whether the band is unreachable because of packing inside capacity or insufficient compatible demand. When no cheaper band remains, the reason says so. Organizer views may name those buyers. Merchant-facing tables use counts only.

## Aggregate merchant signal

Demand is grouped by product category. For each category, the merchant view reports buyer count, total units, the range of price ceilings, the range of delivery limits, and the union of accepted variants. It does not report buyer labels or buyer-to-offer matches.

The variant overlap matrix counts buyers whose accepted variants include each offered variant. Pairwise cells count buyers who accept both variants. Offered variants that differ only by the same matching normalization share a column. Buyer labels, IDs, budgets, and allocations are omitted.

The delivery heatmap groups buyers into deadline buckets of 0 to 3, 4 to 7, 8 to 14, 15 to 30, and 31 to 365 days. The matching CSV export uses those aggregate buckets only and escapes spreadsheet formula prefixes.

## Limits

- Equal-unit cohorts can differ in distributional impact even though the deterministic ID tie-break selects only one.
- A maximum price is a constraint, not a valuation or a welfare measure.
- Group headroom is not guaranteed savings against a real market price.
- Merchant offers are synthetic and unverified.
- Aggregate ranges can reveal information in small or distinctive cohorts.
- The model excludes taxes, tiered shipping, substitutions across categories, partial quantities, returns, credit risk, inventory changes, and strategic behavior.
- A real marketplace needs informed consent, identity and merchant controls, payment safety, fulfillment evidence, dispute handling, accessibility research, and jurisdiction-specific compliance.
- An encoded share payload is at most 60,000 characters of URL-safe base64. Oversized scenarios must be exported as JSON instead. Malformed payloads name the failed step (base64, UTF-8, or JSON location) rather than a generic decode error.

The model can test whether a declared offer satisfies declared constraints. It cannot prove that a purchase is wise, fair, available, safe, or legally compliant.
# Optional landed budgets and decision tools

`Buyer.maxOrderTotal` optionally limits `quantity * band.unitPrice + shippingPerBuyer`. Pickup fulfillment evaluates that shipping term as 0. The budget is independent of the item-price ceiling and is evaluated separately at each price band before exact whole-buyer allocation. Omitting it preserves existing behavior. A budget mismatch produces the `budget` incompatibility reason. Validation accepts totals from 0 to 5,001,000,000. Existing fractional-price precision is preserved; the comparison allows only a small floating-point tolerance (four machine epsilons at the magnitude of the total), not a currency-unit allowance.

Buyer CSV import accepts a header row of label, category, quantity, max unit price, latest delivery days, variants, and optional max order total. `createOrganizerBuyerCsv` writes those same columns for the current buyers, escapes spreadsheet formula prefixes, and is private organizer data, not a merchant export. `parseBuyerTable` and `importBuyersFromTable` use the same field checks. A tab in the first line is read as TSV. Valid paste or import replaces buyers and leaves offers unchanged. Offer CSV import accepts name, capacity, unit price, shipping, fulfillment, and variants. Category, minimum, and delivery may be omitted and then default from the room. `createOfferCsv` writes those same six columns for the current offers, escapes spreadsheet formula prefixes, and omits buyer IDs, labels, budgets, allocations, and quantity tiers. Cells that were escaped for spreadsheet safety by a leading apostrophe have that apostrophe stripped. Formula-like labels are stored as text, not evaluated. Invalid rows name the CSV buyer or offer and field.

`previewBuyerSort` and `applyBuyerSort` reorder buyers by label A-Z or quantity high-low. Identifiers are unchanged. Preview does not write the saved order. Applied sort is a new validated room state, so session undo can restore the previous order.

`previewOfferSort` and `applyOfferSort` reorder offers by unit price low-high or capacity high-low. Identifiers are unchanged. Preview does not write the saved order. Applied sort is undoable.

`createVariantOverlapCsv` writes pairwise buyer counts and per-variant offer, buyer, and unit totals. `createVariantOverlapMarkdown` writes the same counts as Markdown tables. Both omit labels, IDs, budgets, and allocations. CSV also escapes spreadsheet formula prefixes.

`organizerBuyerVariantCounts` groups organizer buyers by accepted variant and returns buyer and unit counts only. Merchant views still report counts only.

`filterOfferIdsByFulfillment` returns offer ids for all, shipping, or pickup without mutating the room.

`filterBuyerIdsByAcceptedVariant` returns buyer ids whose accepted variants include the chosen name, or every buyer id for `all`. It does not mutate the room.

`filterBuyerIdsHidingExcluded` returns included buyer ids for one offer when hideExcluded is true, or every buyer id when it is false. It is display-only. Matching is unchanged.

`filterBuyerIdsHidingFullyFilled` returns leftover buyer ids after the winner when hideFullyFilled is true, or every buyer id when it is false. It is display-only. Matching is unchanged. Distinct from `filterBuyerIdsHidingExcluded`.

`filterBuyerIdsHidingBuyersWithLeftover` returns buyer ids that are not leftover after the winner when hideBuyersWithLeftover is true, or every buyer id when it is false. It is display-only. Matching is unchanged. Inverse of `filterBuyerIdsHidingFullyFilled`. Distinct from `filterBuyerIdsHidingExcluded`.

`filterBuyerIdsHidingUnservedBuyers` returns buyer ids that received allocated units from the winner, leftover fill, or tertiary fill when hideUnservedBuyers is true, or every buyer id when it is false. It is display-only. Matching is unchanged. Distinct from `filterBuyerIdsHidingExcluded`, `filterBuyerIdsHidingFullyFilled`, and `filterBuyerIdsHidingBuyersWithLeftover`.

`filterBuyerIdsHidingLeftoverOnlyBuyers` returns buyer ids that are not leftover-only when hideLeftoverOnlyBuyers is true, or every buyer id when it is false. Leftover-only buyers have zero winner units and leftover fill and/or tertiary units greater than zero. Unserved buyers are not leftover-only. It is display-only. Matching is unchanged. Distinct from `filterBuyerIdsHidingExcluded`, `filterBuyerIdsHidingFullyFilled`, `filterBuyerIdsHidingBuyersWithLeftover`, `filterBuyerIdsHidingUnservedBuyers`, `filterBuyerIdsHidingWinnerAllocatedBuyers`, `filterBuyerIdsHidingBuyersFilledByLeftoverFill`, and `filterBuyerIdsHidingLastBuyerFilledByLeftoverFill`.

`filterBuyerIdsHidingWinnerAllocatedBuyers` returns buyer ids that did not receive winner units when hideWinnerAllocatedBuyers is true, or every buyer id when it is false. Leftover-only and unserved buyers stay visible. It is display-only. Matching is unchanged. Distinct from `filterBuyerIdsHidingExcluded`, `filterBuyerIdsHidingFullyFilled`, `filterBuyerIdsHidingBuyersWithLeftover`, `filterBuyerIdsHidingUnservedBuyers`, `filterBuyerIdsHidingLeftoverOnlyBuyers`, `filterBuyerIdsHidingBuyersFilledByLeftoverFill`, and `filterBuyerIdsHidingLastBuyerFilledByLeftoverFill`.

`filterBuyerIdsHidingBuyersFilledByLeftoverFill` returns buyer ids that are not in leftover-fill `selectedBuyerIds` when hideBuyersFilledByLeftoverFill is true, or every buyer id when it is false. Winner-allocated and unserved buyers stay visible. It is display-only. Matching is unchanged. Distinct from `filterBuyerIdsHidingExcluded`, `filterBuyerIdsHidingFullyFilled`, `filterBuyerIdsHidingBuyersWithLeftover`, `filterBuyerIdsHidingUnservedBuyers`, `filterBuyerIdsHidingLeftoverOnlyBuyers`, `filterBuyerIdsHidingWinnerAllocatedBuyers`, and `filterBuyerIdsHidingLastBuyerFilledByLeftoverFill`.

`filterBuyerIdsHidingLastBuyerFilledByLeftoverFill` returns buyer ids except the last leftover-fill `selectedBuyerIds` entry when hideLastBuyerFilledByLeftoverFill is true, or every buyer id when it is false. Winner-allocated, unserved, and other leftover-fill buyers stay visible. It is display-only. Matching is unchanged. Distinct from `filterBuyerIdsHidingExcluded`, `filterBuyerIdsHidingFullyFilled`, `filterBuyerIdsHidingBuyersWithLeftover`, `filterBuyerIdsHidingUnservedBuyers`, `filterBuyerIdsHidingLeftoverOnlyBuyers`, `filterBuyerIdsHidingWinnerAllocatedBuyers`, `filterBuyerIdsHidingBuyersFilledByLeftoverFill`, and `filterBuyerIdsHidingFirstBuyerFilledByLeftoverFill`.

`filterBuyerIdsHidingFirstBuyerFilledByLeftoverFill` returns buyer ids except the first leftover-fill `selectedBuyerIds` entry when hideFirstBuyerFilledByLeftoverFill is true, or every buyer id when it is false. Winner-allocated, unserved, and other leftover-fill buyers stay visible. It is display-only. Matching is unchanged. Distinct from `filterBuyerIdsHidingExcluded`, `filterBuyerIdsHidingFullyFilled`, `filterBuyerIdsHidingBuyersWithLeftover`, `filterBuyerIdsHidingUnservedBuyers`, `filterBuyerIdsHidingLeftoverOnlyBuyers`, `filterBuyerIdsHidingWinnerAllocatedBuyers`, `filterBuyerIdsHidingBuyersFilledByLeftoverFill`, `filterBuyerIdsHidingLastBuyerFilledByLeftoverFill`, and `filterBuyerIdsHidingFirstBuyerFilledByTertiaryFill`.

`filterBuyerIdsHidingFirstBuyerFilledByTertiaryFill` returns buyer ids except the first tertiary-fill `selectedBuyerIds` entry when hideFirstBuyerFilledByTertiaryFill is true, or every buyer id when it is false. Winner-allocated, leftover-fill, unserved, and other tertiary-fill buyers stay visible. It is display-only. Matching is unchanged. Distinct from `filterBuyerIdsHidingExcluded`, `filterBuyerIdsHidingFullyFilled`, `filterBuyerIdsHidingBuyersWithLeftover`, `filterBuyerIdsHidingUnservedBuyers`, `filterBuyerIdsHidingLeftoverOnlyBuyers`, `filterBuyerIdsHidingWinnerAllocatedBuyers`, `filterBuyerIdsHidingBuyersFilledByLeftoverFill`, `filterBuyerIdsHidingLastBuyerFilledByLeftoverFill`, `filterBuyerIdsHidingFirstBuyerFilledByLeftoverFill`, and `filterBuyerIdsHidingLastBuyerFilledByTertiaryFill`.

`filterBuyerIdsHidingLastBuyerFilledByTertiaryFill` returns buyer ids except the last tertiary-fill `selectedBuyerIds` entry when hideLastBuyerFilledByTertiaryFill is true, or every buyer id when it is false. Winner-allocated, leftover-fill, unserved, and other tertiary-fill buyers stay visible. It is display-only. Matching is unchanged. Distinct from `filterBuyerIdsHidingExcluded`, `filterBuyerIdsHidingFullyFilled`, `filterBuyerIdsHidingBuyersWithLeftover`, `filterBuyerIdsHidingUnservedBuyers`, `filterBuyerIdsHidingLeftoverOnlyBuyers`, `filterBuyerIdsHidingWinnerAllocatedBuyers`, `filterBuyerIdsHidingBuyersFilledByLeftoverFill`, `filterBuyerIdsHidingLastBuyerFilledByLeftoverFill`, `filterBuyerIdsHidingFirstBuyerFilledByLeftoverFill`, `filterBuyerIdsHidingFirstBuyerFilledByTertiaryFill`, and `filterBuyerIdsHidingLastUnservedBuyer`.

`filterBuyerIdsHidingLastUnservedBuyer` returns buyer ids except the last buyer with no winner, leftover-fill, or tertiary units when hideLastUnservedBuyer is true, or every buyer id when it is false. Winner-allocated, leftover-fill, tertiary-fill, and other unserved buyers stay visible. It is display-only. Matching is unchanged. Distinct from `filterBuyerIdsHidingUnservedBuyers`, `filterBuyerIdsHidingLastBuyerFilledByTertiaryFill`, and `filterBuyerIdsHidingFirstUnservedBuyer`.

`filterBuyerIdsHidingFirstUnservedBuyer` returns buyer ids except the first buyer with no winner, leftover-fill, or tertiary units when hideFirstUnservedBuyer is true, or every buyer id when it is false. Winner-allocated, leftover-fill, tertiary-fill, and other unserved buyers stay visible. It is display-only. Matching is unchanged. Distinct from `filterBuyerIdsHidingUnservedBuyers`, `filterBuyerIdsHidingLastUnservedBuyer`, and `filterBuyerIdsHidingLastBuyerFilledByTertiaryFill`.

`filterBuyerIdsHidingLastLeftoverOnlyBuyer` returns buyer ids except the last leftover-only buyer in buyer order when hideLastLeftoverOnlyBuyer is true, or every buyer id when it is false. A leftover-only buyer has leftover-fill or tertiary units and no winner units. Unserved buyers are not leftover-only. Winner-allocated, unserved, leftover-fill that are not last leftover-only, and other leftover-only buyers stay visible. It is display-only. Matching is unchanged. Distinct from `filterBuyerIdsHidingLeftoverOnlyBuyers`, `filterBuyerIdsHidingLastUnservedBuyer`, and `filterBuyerIdsHidingFirstUnservedBuyer`.

`filterBuyerIdsHidingFirstLeftoverOnlyBuyer` returns buyer ids except the first leftover-only buyer in buyer order when hideFirstLeftoverOnlyBuyer is true, or every buyer id when it is false. A leftover-only buyer has leftover-fill or tertiary units and no winner units. Unserved buyers are not leftover-only. Winner-allocated, unserved, leftover-fill that are not first leftover-only, and other leftover-only buyers stay visible. It is display-only. Matching is unchanged. Distinct from `filterBuyerIdsHidingLastLeftoverOnlyBuyer`, `filterBuyerIdsHidingLeftoverOnlyBuyers`, `filterBuyerIdsHidingLastUnservedBuyer`, and `filterBuyerIdsHidingFirstUnservedBuyer`.

`filterBuyerIdsHidingLastWinnerAllocatedBuyer` returns buyer ids except the last winner-allocated buyer in buyer order when hideLastWinnerAllocatedBuyer is true, or every buyer id when it is false. Leftover-only, leftover-fill, tertiary-fill, unserved, and other winner-allocated buyers stay visible. It is display-only. Matching is unchanged. Distinct from `filterBuyerIdsHidingWinnerAllocatedBuyers`, `filterBuyerIdsHidingLastLeftoverOnlyBuyer`, `filterBuyerIdsHidingFirstLeftoverOnlyBuyer`, and `filterBuyerIdsHidingFirstWinnerAllocatedBuyer`.

`filterBuyerIdsHidingFirstWinnerAllocatedBuyer` returns buyer ids except the first winner-allocated buyer in buyer order when hideFirstWinnerAllocatedBuyer is true, or every buyer id when it is false. Leftover-only, leftover-fill, tertiary-fill, unserved, and other winner-allocated buyers stay visible. It is display-only. Matching is unchanged. Distinct from `filterBuyerIdsHidingWinnerAllocatedBuyers`, `filterBuyerIdsHidingLastWinnerAllocatedBuyer`, `filterBuyerIdsHidingLastLeftoverOnlyBuyer`, and `filterBuyerIdsHidingFirstLeftoverOnlyBuyer`.

`filterBuyerIdsHidingFirstUncoveredLeftoverBuyer` returns buyer ids except the first uncovered leftover buyer in buyer order when hideFirstUncoveredLeftoverBuyer is true, or every buyer id when it is false. Uncovered leftover buyers are leftover-after-winner buyers still unfilled after leftover fill and tertiary fill. Leftover-only, leftover-fill, tertiary-fill, winner-allocated, unserved, and other leftover buyers stay visible. It is display-only. Matching is unchanged. Distinct from `filterBuyerIdsHidingLastUncoveredLeftoverBuyer`, `filterBuyerIdsHidingFirstLeftoverOnlyBuyer`, `filterBuyerIdsHidingLastLeftoverOnlyBuyer`, `filterBuyerIdsHidingFirstWinnerAllocatedBuyer`, `filterBuyerIdsHidingLastWinnerAllocatedBuyer`, and `filterBuyerIdsHidingFirstUnservedBuyer`.

`filterBuyerIdsHidingLastUncoveredLeftoverBuyer` returns buyer ids except the last uncovered leftover buyer in buyer order when hideLastUncoveredLeftoverBuyer is true, or every buyer id when it is false. Uncovered leftover buyers are leftover-after-winner buyers still unfilled after leftover fill and tertiary fill. Leftover-only, leftover-fill, tertiary-fill, winner-allocated, first uncovered leftover, unserved, and other leftover buyers stay visible. It is display-only. Matching is unchanged. Distinct from `filterBuyerIdsHidingFirstUncoveredLeftoverBuyer`, `filterBuyerIdsHidingFirstLeftoverOnlyBuyer`, `filterBuyerIdsHidingLastLeftoverOnlyBuyer`, `filterBuyerIdsHidingFirstWinnerAllocatedBuyer`, `filterBuyerIdsHidingLastWinnerAllocatedBuyer`, and `filterBuyerIdsHidingFirstUnservedBuyer`.

`compareRoomsByOfferIdentity` and `createOfferIdentityCompareMarkdown` compare two rooms by offer id. Shared ids report merchant-facing unit and buyer counts. Missing ids are listed and are not filled with zeros. Room titles, buyer labels, IDs, budgets, and allocations are omitted. Mixed currencies omit landed totals.

`createExclusionCountsMarkdown` copies inspected-offer exclusion reason counts. Counts only. Buyer ids stay out.

`restoreRemovedBuyer` inserts one previously removed buyer when that id is free. The app keeps one session slot; the model does not store the slot.

`restoreExampleOffers` replaces offers with a named preset's offers and keeps the current buyers, title, and currency.

Compared rooms that use different currencies set `currencyWarning` and omit landed totals. The model does not convert currencies.

`duplicateRoom` copies a validated room and assigns a unique title suffix such as `(copy)` or `(copy 2)`, truncated to 80 characters.

`winnerBudgetLeftover` sums unused item-ceiling headroom for buyers included in the winner. Organizer briefing may include that aggregate. Merchant JSON stays on its existing aggregate whitelist.

`createWinnerAggregatesMarkdown` copies winner merchant, units, included-buyer counts, landed total, headroom, and residual fills. It omits the room title, labels, IDs, budgets, and allocations.

`leftoverCoverageRows` returns leftover after winner, leftover fill, tertiary fill, and uncovered leftover as buyer counts, units, and merchant labels only. Each row includes `covered` when leftover fill or tertiary fill already placed that leftover, leftover after winner is empty, or uncovered leftover is empty.

`filterLeftoverCoverageRowsHidingCovered` returns leftover-coverage rows that are not fully covered when hideCovered is true, or every leftover-coverage row when it is false. It is display-only. Matching is unchanged.

`filterLeftoverCoverageRowsHidingTertiary` returns leftover-coverage rows without the tertiary leftover-coverage row when hideTertiary is true, or every leftover-coverage row when it is false. It is display-only. Matching is unchanged.

`filterLeftoverCoverageRowsHidingLeftoverFill` returns leftover-coverage rows without the leftover-fill coverage row when hideLeftoverFill is true, or every leftover-coverage row when it is false. It is display-only. Matching is unchanged. Compose it with the covered and tertiary leftover-row filters.

`createLeftoverCoverageMarkdown` writes those leftover counts as organizer-private Markdown. It is labeled organizer-private and is not a merchant export. Labels, IDs, budgets, and allocations stay out.

`createLeftoverFillMarkdown` writes leftover fill as one-line organizer-private Markdown: merchant label, leftover buyer-count, leftover unit-count. Honest empty when leftover fill is missing. It is the secondary leftover offer, not tertiary. Labels, IDs, budgets, and allocations stay out.

`createLeftoverFillUnitCountMarkdown` writes leftover fill unit-count as one-line organizer-private Markdown. Count only. Honest empty when leftover fill is missing. It is not a merchant export. Labels, IDs, budgets, merchant labels, and allocations stay out.

`createLeftoverFillMerchantLabelMarkdown` writes leftover-fill merchant label as one-line organizer-private Markdown. Merchant label only. Honest empty when leftover fill is missing. It is not a merchant export. Distinct from `createLeftoverFillMarkdown`, `createLeftoverFillUnitCountMarkdown`, `createUncoveredLeftoverUnitCountMarkdown`, and `createWinningMerchantLabelMarkdown`. Buyer identities, IDs, budgets, and allocations stay out.

`createLeftoverFillRemainingCapacityMarkdown` writes leftover-fill remaining capacity as one-line organizer-private Markdown. Remaining capacity on the leftover-fill offer, or honest empty when leftover fill is missing. It is not a merchant export. Distinct from `createLeftoverFillMarkdown`, `createLeftoverFillUnitCountMarkdown`, `createLeftoverFillMerchantLabelMarkdown`, `createUncoveredLeftoverUnitCountMarkdown`, and `createWinningRemainingCapacityMarkdown`. Buyer identities, IDs, budgets, and allocations stay out.

`createLeftoverFillFulfillmentMarkdown` writes leftover-fill fulfillment as one-line organizer-private Markdown. Pickup or shipping on the leftover-fill offer, or honest empty when leftover fill is missing. It is not a merchant export. Distinct from `createLeftoverFillMarkdown`, `createLeftoverFillUnitCountMarkdown`, `createLeftoverFillMerchantLabelMarkdown`, `createLeftoverFillRemainingCapacityMarkdown`, `createLeftoverFillDeliveryMarkdown`, and `createWinningFulfillmentMarkdown`. Buyer identities, IDs, budgets, and allocations stay out.

`createLeftoverFillDeliveryMarkdown` writes leftover-fill delivery days as one-line organizer-private Markdown. Count only (days) on the leftover-fill offer, or honest empty when leftover fill is missing. It is not a merchant export. Distinct from `createLeftoverFillFulfillmentMarkdown`, `createLeftoverFillPickupMarkdown`, and `createLeftoverFillRemainingCapacityMarkdown`. Buyer identities, IDs, budgets, and allocations stay out.

`createLeftoverFillPickupMarkdown` writes leftover-fill pickup days as one-line organizer-private Markdown. Count only (days) when leftover fill exists and the leftover-fill offer is pickup, or honest empty when leftover fill is missing or leftover fill is shipping. It is not a merchant export. Distinct from `createLeftoverFillDeliveryMarkdown`, `createLeftoverFillFulfillmentMarkdown`, and `createLeftoverFillLabelMarkdown`. Buyer identities, IDs, budgets, and allocations stay out.

`createLeftoverFillLabelMarkdown` writes leftover-fill offer label as one-line organizer-private Markdown. Merchant and variant only when leftover fill exists, or honest empty when leftover fill is missing. It is not a merchant export. Distinct from `createLeftoverFillMerchantLabelMarkdown`, `createLeftoverFillPickupMarkdown`, `createLeftoverFillMinimumMarkdown`, and `createWinningMerchantLabelMarkdown`. Buyer identities, IDs, budgets, and allocations stay out.

`createLeftoverFillMinimumMarkdown` writes leftover-fill offer minimum units as one-line organizer-private Markdown. Count only when leftover fill exists, or honest empty when leftover fill is missing. It is not a merchant export. Distinct from `createLeftoverFillLabelMarkdown`, `createLeftoverFillUnitCountMarkdown`, `createLeftoverFillRemainingCapacityMarkdown`, `createLeftoverFillPickupMarkdown`, `createLeftoverFillMaximumMarkdown`, and `createLeftoverUncoveredMinimumMarkdown`. Buyer identities, IDs, budgets, and allocations stay out.

`createLeftoverFillMaximumMarkdown` writes leftover-fill offer capacity as one-line organizer-private Markdown. Count only when leftover fill exists, or honest empty when leftover fill is missing. It is not a merchant export. Distinct from `createLeftoverFillMinimumMarkdown`, `createLeftoverFillRemainingCapacityMarkdown`, `createLeftoverFillUnitCountMarkdown`, `createLeftoverFillLabelMarkdown`, `createTertiaryFillRemainingCapacityMarkdown`, and `createTertiaryFillMaximumMarkdown`. Buyer identities, IDs, budgets, and allocations stay out.

`createTertiaryFillRemainingCapacityMarkdown` writes tertiary-fill remaining capacity as one-line organizer-private Markdown. Remaining capacity on the tertiary-fill offer, or honest empty when tertiary fill is missing. It is not a merchant export. Distinct from `createLeftoverFillRemainingCapacityMarkdown`, `createLeftoverFillMaximumMarkdown`, and `createTertiaryFillMaximumMarkdown`. Buyer identities, IDs, budgets, and allocations stay out.

`createTertiaryFillMaximumMarkdown` writes tertiary-fill offer capacity as one-line organizer-private Markdown. Count only when tertiary fill exists, or honest empty when tertiary fill is missing. It is not a merchant export. Distinct from `createTertiaryFillRemainingCapacityMarkdown` and `createLeftoverFillMaximumMarkdown`. Buyer identities, IDs, budgets, and allocations stay out.

`createUncoveredLeftoverCountsMarkdown` writes uncovered leftover buyer and unit counts only. It is organizer-private and is not a merchant export. Labels, IDs, budgets, and allocations stay out.

`createUncoveredLeftoverUnitCountMarkdown` writes uncovered leftover unit-count as one-line organizer-private Markdown. Count only. Honest empty when leftover after the winner is missing. It is not a merchant export. Distinct from `createUncoveredLeftoverCountsMarkdown` and `createLeftoverFillUnitCountMarkdown`. Labels, IDs, budgets, merchant labels, and allocations stay out.

`createLeftoverUncoveredRemainingMarkdown` writes leftover uncovered remaining units as one-line organizer-private Markdown. Remaining uncovered leftover units after leftover fill and tertiary fill, or honest empty when leftover after the winner is missing. It is not a merchant export. Distinct from `createLeftoverFillRemainingCapacityMarkdown`, `createTertiaryFillRemainingCapacityMarkdown`, `createTertiaryFillMaximumMarkdown`, `createUncoveredLeftoverUnitCountMarkdown`, `createLeftoverUncoveredMaximumMarkdown`, and `createLeftoverUncoveredMinimumMarkdown`. Buyer identities, IDs, budgets, and allocations stay out.

`createLeftoverUncoveredMaximumMarkdown` writes leftover-fill offer capacity as one-line organizer-private Markdown. Count only when leftover fill exists, or honest empty when leftover fill is missing. It is not a merchant export. Distinct prefix from `createLeftoverFillMaximumMarkdown`, `createLeftoverUncoveredRemainingMarkdown`, `createLeftoverUncoveredMinimumMarkdown`, `createTertiaryFillMaximumMarkdown`, and `createUncoveredLeftoverUnitCountMarkdown` even when the number matches. Buyer identities, IDs, budgets, and allocations stay out.

`createLeftoverUncoveredMinimumMarkdown` writes leftover-fill offer minimum units as one-line organizer-private Markdown. Count only when leftover fill exists, or honest empty when leftover fill is missing. It is not a merchant export. Distinct prefix from `createLeftoverFillMinimumMarkdown`, `createLeftoverUncoveredRemainingMarkdown`, `createLeftoverUncoveredMaximumMarkdown`, `createLeftoverUncoveredCountMarkdown`, and `createUncoveredLeftoverUnitCountMarkdown` even when the number matches. Buyer identities, IDs, budgets, and allocations stay out.

`createLeftoverUncoveredCountMarkdown` writes uncovered leftover buyer count as one-line organizer-private Markdown. Count only when leftover after the winner exists, or honest empty when leftover after the winner is missing. It is not a merchant export. Distinct prefix from `createUncoveredLeftoverCountsMarkdown`, `createUncoveredLeftoverUnitCountMarkdown`, `createLeftoverUncoveredRemainingMarkdown`, `createLeftoverUncoveredMaximumMarkdown`, and `createLeftoverUncoveredMinimumMarkdown` even when the number matches. Buyer identities, IDs, budgets, and allocations stay out.

`createLeftoverUncoveredLeftoverOnlyCountMarkdown` writes leftover-only buyer count as one-line organizer-private Markdown. Count of leftover-only buyers (leftover fill and/or tertiary fill, not winner, not unserved) when leftover after the winner exists, or honest empty when leftover after the winner is missing. It is not a merchant export. Distinct prefix from `createLeftoverUncoveredCountMarkdown`, `createUncoveredLeftoverCountsMarkdown`, `createUncoveredLeftoverUnitCountMarkdown`, `createLeftoverUncoveredRemainingMarkdown`, `createLeftoverUncoveredLeftoverOnlyRemainingMarkdown`, `createLeftoverUncoveredMaximumMarkdown`, and `createLeftoverUncoveredMinimumMarkdown` even when the number matches. Buyer identities, IDs, budgets, and allocations stay out.

`createLeftoverUncoveredLeftoverOnlyRemainingMarkdown` writes leftover-only buyer units after the winner as one-line organizer-private Markdown. Sum of leftover-only buyer quantities when leftover after the winner exists, or honest empty when leftover after the winner is missing. It is not a merchant export. Distinct prefix from `createLeftoverUncoveredRemainingMarkdown`, `createLeftoverUncoveredLeftoverOnlyCountMarkdown`, `createLeftoverUncoveredLeftoverOnlyMaximumMarkdown`, `createLeftoverUncoveredCountMarkdown`, `createLeftoverUncoveredMaximumMarkdown`, `createLeftoverUncoveredMinimumMarkdown`, `createUncoveredLeftoverUnitCountMarkdown`, `createLeftoverFillRemainingCapacityMarkdown`, and `createTertiaryFillRemainingCapacityMarkdown` even when the number matches. Buyer identities, IDs, budgets, and allocations stay out.

`createLeftoverUncoveredLeftoverOnlyMaximumMarkdown` writes the largest leftover-only buyer quantity as one-line organizer-private Markdown. Maximum leftover-only buyer quantity when leftover after the winner exists, or honest empty when leftover after the winner is missing. It is not a merchant export. Distinct prefix from `createLeftoverUncoveredLeftoverOnlyRemainingMarkdown`, `createLeftoverUncoveredLeftoverOnlyCountMarkdown`, `createLeftoverUncoveredLeftoverOnlyMinimumMarkdown`, `createLeftoverUncoveredRemainingMarkdown`, `createLeftoverUncoveredMaximumMarkdown`, `createLeftoverUncoveredMinimumMarkdown`, `createLeftoverUncoveredCountMarkdown`, `createUncoveredLeftoverUnitCountMarkdown`, `createLeftoverFillRemainingCapacityMarkdown`, `createLeftoverFillMaximumMarkdown`, and `createTertiaryFillRemainingCapacityMarkdown` even when the number matches. Buyer identities, IDs, budgets, and allocations stay out.

`createLeftoverUncoveredLeftoverOnlyMinimumMarkdown` writes the smallest leftover-only buyer quantity as one-line organizer-private Markdown. Minimum leftover-only buyer quantity when leftover after the winner exists, or honest empty when leftover after the winner is missing. It is not a merchant export. Distinct prefix from `createLeftoverUncoveredLeftoverOnlyHeadroomMarkdown`, `createLeftoverUncoveredLeftoverOnlyMaximumMarkdown`, `createLeftoverUncoveredLeftoverOnlyRemainingMarkdown`, `createLeftoverUncoveredLeftoverOnlyCountMarkdown`, `createLeftoverUncoveredRemainingMarkdown`, `createLeftoverUncoveredMaximumMarkdown`, `createLeftoverUncoveredMinimumMarkdown`, `createLeftoverUncoveredCountMarkdown`, `createUncoveredLeftoverUnitCountMarkdown`, `createLeftoverFillRemainingCapacityMarkdown`, `createLeftoverFillMinimumMarkdown`, `createLeftoverFillMaximumMarkdown`, and `createTertiaryFillRemainingCapacityMarkdown` even when the number matches. Buyer identities, IDs, budgets, and allocations stay out.

`createLeftoverUncoveredLeftoverOnlyHeadroomMarkdown` writes leftover-fill remaining capacity after leftover-only units as one-line organizer-private Markdown. Count only when leftover after the winner exists, or honest empty when leftover after the winner is missing. It is not a merchant export. Distinct prefix from `createLeftoverUncoveredLeftoverOnlyUnitPriceMarkdown`, `createLeftoverUncoveredLeftoverOnlyCapacityMarkdown`, `createLeftoverUncoveredLeftoverOnlyAllocatedMarkdown`, `createLeftoverUncoveredLeftoverOnlyMinimumMarkdown`, `createLeftoverUncoveredLeftoverOnlyMaximumMarkdown`, `createLeftoverUncoveredLeftoverOnlyRemainingMarkdown`, `createLeftoverUncoveredLeftoverOnlyCountMarkdown`, `createLeftoverUncoveredRemainingMarkdown`, `createLeftoverUncoveredMaximumMarkdown`, `createLeftoverUncoveredMinimumMarkdown`, `createLeftoverUncoveredCountMarkdown`, `createUncoveredLeftoverUnitCountMarkdown`, `createLeftoverFillRemainingCapacityMarkdown`, `createLeftoverFillMinimumMarkdown`, `createLeftoverFillMaximumMarkdown`, `createLeftoverHeadroomMarkdown`, and `createTertiaryFillRemainingCapacityMarkdown` even when the number matches. Buyer identities, IDs, budgets, and allocations stay out.

`createLeftoverUncoveredLeftoverOnlyAllocatedMarkdown` writes leftover-only units assigned onto leftover-fill as one-line organizer-private Markdown. Count only when leftover after the winner exists, or honest empty when leftover after the winner is missing. It is leftover-only units assigned onto leftover-fill, not leftover-fill offer capacity and not leftover-only headroom remaining. Cyclo-cross carnival leftover-only allocated is 28 leftover-only units, leftover uncovered leftover-only headroom is 26, leftover uncovered leftover-only capacity reports 54, leftover uncovered leftover-only minimum is 13, and leftover-fill offer unit price is 22. It is not a merchant export. Distinct prefix from `createLeftoverUncoveredLeftoverOnlyUnitPriceMarkdown`, `createLeftoverUncoveredLeftoverOnlyCapacityMarkdown`, `createLeftoverUncoveredLeftoverOnlyHeadroomMarkdown`, `createLeftoverUncoveredLeftoverOnlyRemainingMarkdown`, `createLeftoverUncoveredLeftoverOnlyMinimumMarkdown`, `createLeftoverUncoveredLeftoverOnlyMaximumMarkdown`, `createLeftoverUncoveredLeftoverOnlyCountMarkdown`, `createLeftoverUncoveredRemainingMarkdown`, `createLeftoverUncoveredMaximumMarkdown`, `createLeftoverUncoveredMinimumMarkdown`, `createLeftoverUncoveredCountMarkdown`, `createUncoveredLeftoverUnitCountMarkdown`, `createLeftoverFillRemainingCapacityMarkdown`, `createLeftoverFillMinimumMarkdown`, `createLeftoverFillMaximumMarkdown`, leftover unit price, leftover unspent item headroom, leftover-only allocated units, leftover uncovered remaining, leftover-fill remaining, and tertiary remaining even when the number matches. Buyer identities, IDs, budgets, and allocations stay out.

`createLeftoverUncoveredLeftoverOnlyCapacityMarkdown` writes leftover-fill offer capacity as one-line organizer-private Markdown. Leftover-fill offer capacity when leftover after the winner exists, or honest empty when leftover after the winner is missing. It is leftover-fill offer capacity, not leftover-only allocated units and not leftover-only headroom remaining. It is not a merchant export. Distinct prefix from `createLeftoverUncoveredLeftoverOnlyUnitPriceMarkdown`, `createLeftoverUncoveredLeftoverOnlyAllocatedMarkdown`, `createLeftoverUncoveredLeftoverOnlyHeadroomMarkdown`, `createLeftoverUncoveredLeftoverOnlyRemainingMarkdown`, `createLeftoverUncoveredLeftoverOnlyMinimumMarkdown`, `createLeftoverUncoveredLeftoverOnlyMaximumMarkdown`, `createLeftoverUncoveredLeftoverOnlyCountMarkdown`, `createLeftoverUncoveredRemainingMarkdown`, `createLeftoverUncoveredMaximumMarkdown`, `createLeftoverUncoveredMinimumMarkdown`, `createLeftoverUncoveredCountMarkdown`, `createUncoveredLeftoverUnitCountMarkdown`, `createLeftoverFillRemainingCapacityMarkdown`, `createLeftoverFillMinimumMarkdown`, `createLeftoverFillMaximumMarkdown`, leftover unit price, leftover unspent item headroom, and tertiary remaining even when the number matches. Buyer identities, IDs, budgets, and allocations stay out.

`createLeftoverUncoveredLeftoverOnlyUnitPriceMarkdown` writes leftover-fill offer unit price as one-line organizer-private Markdown. Leftover-fill offer unit price when leftover after the winner exists, or honest empty when leftover after the winner is missing. It is leftover-fill offer unit price, not leftover-fill offer capacity, leftover-only allocated units, leftover-only headroom remaining, leftover uncovered leftover-only remaining, leftover uncovered leftover-only minimum, leftover uncovered leftover-only maximum, leftover uncovered leftover-only count, leftover uncovered remaining, leftover uncovered maximum, leftover uncovered minimum, leftover uncovered count, leftover-fill remaining, leftover-fill maximum, leftover unspent item headroom, leftover unit price, or leftover-only allocated units even when the number matches. It is not a merchant export. Distinct prefix from `createLeftoverUncoveredLeftoverOnlyCapacityMarkdown`, `createLeftoverUncoveredLeftoverOnlyAllocatedMarkdown`, `createLeftoverUncoveredLeftoverOnlyHeadroomMarkdown`, `createLeftoverUncoveredLeftoverOnlyRemainingMarkdown`, `createLeftoverUncoveredLeftoverOnlyMinimumMarkdown`, `createLeftoverUncoveredLeftoverOnlyMaximumMarkdown`, `createLeftoverUncoveredLeftoverOnlyCountMarkdown`, `createLeftoverUncoveredRemainingMarkdown`, `createLeftoverUncoveredMaximumMarkdown`, `createLeftoverUncoveredMinimumMarkdown`, `createLeftoverUncoveredCountMarkdown`, `createUncoveredLeftoverUnitCountMarkdown`, `createLeftoverFillRemainingCapacityMarkdown`, `createLeftoverFillMaximumMarkdown`, leftover unit price, leftover unspent item headroom, and leftover-only allocated units even when the number matches. Buyer identities, IDs, budgets, and allocations stay out.

`createLeftoverHeadroomMarkdown` writes leftover unspent item headroom as one-line organizer-private Markdown. Currency and included-buyer counts only. Not a rebate. Labels, IDs, budgets, and allocations stay out.

`createWinningMerchantLabelMarkdown` writes the winning merchant name only, or `None unlocked`. It omits buyer identities, IDs, budgets, and allocations.

`createWinningFulfillmentMarkdown` writes pickup or shipping for the unlocked winner, or `None unlocked`. It is a merchant-safe one-liner. It omits buyer identities, IDs, budgets, and allocations.

`createWinningRemainingCapacityMarkdown` writes remaining capacity on the unlocked winner (capacity minus allocated units, using `capacityBar.leftoverUnits`), or `None unlocked`. It is a merchant-safe one-liner. It omits buyer identities, IDs, budgets, and allocations.

`createRequestedUnitsMarkdown` writes requested units as one-line organizer-private Markdown. Count only. It is not a merchant export. Labels, IDs, budgets, and allocations stay out.

`organizerLeftoverRows` lists leftover buyers after the winner with private labels and leftover-fill, tertiary-fill, or uncovered status. It is organizer-only.

`createWinnerInspectorSummaryMarkdown` copies the winning offer label, leftover buyer and unit counts, and residual coverage. It is organizer-private. Buyer identities stay out.

`filterOfferIdsHidingUnwinnable` returns offer ids that currently qualify when hideUnwinnable is true, or every offer id when it is false. It is display-only. Matching is unchanged.

`filterOfferIdsHidingZeroRemainingCapacity` returns offer ids whose remaining capacity after the winner is greater than zero when hideZeroRemaining is true, omitting fully filled offers and unwinnable offers already allocated to a winner. When hideZeroRemaining is false, every offer id is returned. It is display-only. Matching is unchanged. Distinct from `filterOfferIdsHidingUnwinnable`.

`filterOfferIdsHidingOffersWithRemainingCapacity` returns offer ids whose remaining capacity after the winner is zero when hideRemaining is true. When hideRemaining is false, every offer id is returned. It is display-only. Matching is unchanged. Inverse of `filterOfferIdsHidingZeroRemainingCapacity` on remaining units. Distinct from `filterOfferIdsHidingUnwinnable` and `filterOfferIdsHidingZeroRemainingCapacity`.

Named snapshots contain validated version-1 scenarios, at most 12 per workspace. Workspace JSON may include `fulfillmentFilter` of `all`, `shipping`, or `pickup`, `hideExcludedBuyers` as true or false, `hideUnwinnableOffers` as true or false, `hideCoveredLeftoverRows` as true or false, `hideTertiaryLeftoverRow` as true or false, `hideLeftoverFillRow` as true or false, `hideZeroRemainingCapacityOffers` as true or false, `hideOffersWithRemainingCapacity` as true or false, `hideFullyFilledBuyers` as true or false, `hideBuyersWithLeftover` as true or false, `hideUnservedBuyers` as true or false, `hideLeftoverOnlyBuyers` as true or false, `hideWinnerAllocatedBuyers` as true or false, `hideBuyersFilledByLeftoverFill` as true or false, `hideLastBuyerFilledByLeftoverFill` as true or false, `hideFirstBuyerFilledByLeftoverFill` as true or false, and `hideFirstBuyerFilledByTertiaryFill` as true or false, and `hideLastBuyerFilledByTertiaryFill` as true or false, and `hideLastUnservedBuyer` as true or false, and `hideFirstUnservedBuyer` as true or false, and `hideLastLeftoverOnlyBuyer` as true or false, and `hideFirstLeftoverOnlyBuyer` as true or false, and `hideLastWinnerAllocatedBuyer` as true or false, and `hideFirstWinnerAllocatedBuyer` as true or false, and `hideFirstUncoveredLeftoverBuyer` as true or false, and `hideLastUncoveredLeftoverBuyer` as true or false. Older files that omit those fields still validate and behave as all fulfillment rows shown, excluded buyers shown, unwinnable offers shown, leftover-coverage rows shown, the tertiary leftover-coverage row shown, the leftover-fill coverage row shown, zero remaining-capacity offers shown, remaining-capacity-positive offers shown, fully filled buyers shown, buyers with leftover shown, unserved buyers shown, leftover-only buyers shown, winner-allocated buyers shown, leftover-fill buyers shown, the last leftover-fill buyer shown, the first leftover-fill buyer shown, the first tertiary-fill buyer shown, the last tertiary-fill buyer shown, the last unserved buyer shown, and the first unserved buyer shown, and the last leftover-only buyer shown, and the first leftover-only buyer shown, and the last winner-allocated buyer shown, and the first winner-allocated buyer shown, and the first uncovered leftover buyer shown. Valid history contains at most 50 detached states. Baseline and three-room comparisons do not claim welfare or savings from differing cohorts. They do report leftover and unfilled residual counts. Merchant reports use an explicit whitelist and omit the scenario title as well as private buyer records. Buyer CSV is explicitly private and escapes spreadsheet formula prefixes. Organizer briefing markdown, winner aggregate markdown, merchant residual JSON, heatmap CSV, offer CSV export, variant overlap, overlap CSV, overlap Markdown, offer identity compare, exclusion count Markdown, leftover coverage Markdown, leftover coverage rows, leftover fill Markdown, leftover fill unit-count Markdown, leftover fill merchant Markdown, leftover fill remaining capacity Markdown, leftover fill fulfillment Markdown, leftover fill delivery Markdown, leftover fill pickup Markdown, leftover fill label Markdown, leftover fill minimum Markdown, leftover fill maximum Markdown, tertiary fill remaining capacity Markdown, tertiary fill maximum Markdown, leftover print winner merchant labels, leftover print leftover-fill merchant labels, leftover print leftover-fill remaining capacity, leftover print leftover-fill fulfillment, leftover print leftover-fill delivery days, leftover print leftover-fill pickup days, leftover print leftover-fill label, leftover print leftover-fill minimum, leftover print leftover-fill maximum, leftover print tertiary-fill remaining capacity, leftover print tertiary-fill maximum, leftover print leftover uncovered remaining, leftover print leftover uncovered maximum, leftover print leftover uncovered minimum, leftover print leftover uncovered count, leftover print leftover-fill unit counts, leftover print overlap counts, leftover print uncovered leftover counts, leftover print uncovered leftover unit counts, leftover print requested units, winning merchant label Markdown, winning fulfillment Markdown, winning remaining capacity Markdown, uncovered leftover counts Markdown, uncovered leftover unit-count Markdown, leftover uncovered remaining Markdown, leftover uncovered maximum Markdown, leftover uncovered minimum Markdown, leftover uncovered count Markdown, leftover uncovered leftover-only count Markdown, leftover uncovered leftover-only remaining Markdown, leftover uncovered leftover-only maximum Markdown, leftover uncovered leftover-only minimum Markdown, leftover uncovered leftover-only headroom Markdown, leftover uncovered leftover-only allocated Markdown, leftover uncovered leftover-only capacity Markdown, leftover uncovered leftover-only unit price Markdown, leftover unspent item headroom Markdown, requested units Markdown, and winner inspector summary Markdown omit private buyer rows. `redactBuyerLabels` replaces labels with Buyer 1 through N without changing identifiers or constraints. `encodeRedactedScenario` encodes that redacted room; `encodeScenario` still keeps saved labels. `copyOfferAsPickup` duplicates an offer with `fulfillment` set to pickup and `shippingPerBuyer` set to 0. `clonePreset("garden")` is the community garden bulk seed example. `clonePreset("schoolFete")` is the school fete catering example. `clonePreset("officeFruit")` is the office fruit box example. `clonePreset("libraryPaper")` is the library photocopy paper example. `clonePreset("sportsKit")` is the sports club match-day kit example. `clonePreset("surfFirstAid")` is the surf club first-aid kit example. `clonePreset("theatreWardrobe")` is the theatre wardrobe kit example. `clonePreset("choirFolders")` is the community choir folders example. `clonePreset("scoutCamp")` is the scout camp kit example. `clonePreset("schoolExcursionLunch")` is the school excursion lunch example. `clonePreset("netballCanteen")` is the netball canteen lunch example. `clonePreset("swimmingCarnivalLunch")` is the swimming carnival lunch example. `clonePreset("athleticsCarnivalLunch")` is the athletics carnival lunch example. `clonePreset("cricketCarnivalLunch")` is the cricket carnival lunch example. `clonePreset("tennisCarnivalLunch")` is the tennis carnival lunch example. `clonePreset("basketballCarnivalLunch")` is the basketball carnival lunch example. `clonePreset("volleyballCarnivalLunch")` is the volleyball carnival lunch example. `clonePreset("soccerCarnivalLunch")` is the soccer carnival lunch example. `clonePreset("rugbyCarnivalLunch")` is the rugby carnival lunch example. `clonePreset("hockeyCarnivalLunch")` is the hockey carnival lunch example. `clonePreset("baseballCarnivalLunch")` is the baseball carnival lunch example. `clonePreset("softballCarnivalLunch")` is the softball carnival lunch example. `clonePreset("waterPoloCarnivalLunch")` is the water polo carnival lunch example. `clonePreset("rowingCarnivalLunch")` is the rowing carnival lunch example. `clonePreset("sailingCarnivalLunch")` is the sailing carnival lunch example. `clonePreset("canoeingCarnivalLunch")` is the canoeing carnival lunch example. `clonePreset("kayakingCarnivalLunch")` is the kayaking carnival lunch example. `clonePreset("dragonBoatCarnivalLunch")` is the dragon boat carnival lunch example. `clonePreset("surfCarnivalLunch")` is the surf carnival lunch example. `clonePreset("triathlonCarnivalLunch")` is the triathlon carnival lunch example. `clonePreset("cyclingCarnivalLunch")` is the cycling carnival lunch example. Private review packets remain organizer-only and are never merchant exports.

## Organizer review calculations

Buyer option coverage counts qualified offers whose actual selected cohort contains the buyer ID. Mere category/price compatibility does not count when whole-order capacity excludes that buyer. Every analysis validates the current scenario, uses the existing allocator, and preserves the input.

### Sole-offer dependency

Count buyers whose current whole-order allocation is available from only one qualified offer, and sum their units. This measures current option dependency, not post-withdrawal rematching.

### Unserved buyer reasons

For buyers served by no qualified offer, count current exclusion reasons across offers. These are evaluated-band diagnostics, not promises that one relaxed constraint will solve the order.

### Same-cohort offer alternatives

Compare qualified offers only when their selected buyer-ID sets are identical. An alternative dominates on these two declared measures only when total landed cost and delivery days are both no worse and at least one is strictly better. Equal offers are retained.

### Winner withdrawal stress

Remove each included buyer from the current winner in turn and rerun the existing whole-order allocator on that same offer. Report originally served units retained/lost among the other buyers. No cross-merchant or behavioral prediction is made.

### Shipping exposure and headroom

Sum actual charged shipping across allocated buyers and divide by landed total when nonzero. Least remaining ceiling is the minimum of item-ceiling total and optional order budget, minus actual landed cost. Pickup charges zero shipping.

### Delivery slack by included order

Delivery slack equals latestDeliveryDays minus offer.deliveryDays for each actual included order. Counts repeat a buyer across alternative offers and must not be summed as unique demand.

### Capacity increase previews

On demand, rerun at most five ranked offers at up to three distinct capacity increases (10%, 25%, 50%, rounded up). Capacity is bounded at 5,000. These finite previews do not search for an optimal capacity or change merchant terms.

### Minimum-order relaxation preview

Reevaluate each offer with only its base minimum changed to one unit. Capacity, shipping, prices, and quantity-tier thresholds remain unchanged. The preview does not assert merchant acceptance.

### Private review packets

Packets contain the validated scenario, its exact normalized JSON snapshot, the selected review tool, and full-precision computed rows. Replay rejects changed input snapshots, unknown fields, or result mismatches, while ignoring object field order. The importer limits files to 1 MiB, recomputes all results, and leaves the active room unchanged. This consistency check is unsigned; someone able to rewrite both input and result can create a new valid packet. It is not authentication or an immutable audit trail. Review packets are organizer-private and never merchant exports.
