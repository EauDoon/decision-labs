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

Buyer CSV import accepts a header row of label, category, quantity, max unit price, latest delivery days, variants, and optional max order total. Offer CSV import accepts name, capacity, unit price, shipping, fulfillment, and variants. Category, minimum, and delivery may be omitted and then default from the room. `createOfferCsv` writes those same six columns for the current offers, escapes spreadsheet formula prefixes, and omits buyer IDs, labels, budgets, allocations, and quantity tiers. Cells that were escaped for spreadsheet safety by a leading apostrophe have that apostrophe stripped. Formula-like labels are stored as text, not evaluated. Invalid rows name the CSV buyer or offer and field.

`previewBuyerSort` and `applyBuyerSort` reorder buyers by label A-Z or quantity high-low. Identifiers are unchanged. Preview does not write the saved order. Applied sort is a new validated room state, so session undo can restore the previous order.

`previewOfferSort` and `applyOfferSort` reorder offers by unit price low-high or capacity high-low. Identifiers are unchanged. Preview does not write the saved order. Applied sort is undoable.

`createVariantOverlapCsv` writes pairwise buyer counts and per-variant offer, buyer, and unit totals. It omits labels, IDs, budgets, and allocations, and escapes spreadsheet formula prefixes.

`organizerBuyerVariantCounts` groups organizer buyers by accepted variant and returns buyer and unit counts only. Merchant views still report counts only.

`filterOfferIdsByFulfillment` returns offer ids for all, shipping, or pickup without mutating the room.

`filterBuyerIdsByAcceptedVariant` returns buyer ids whose accepted variants include the chosen name, or every buyer id for `all`. It does not mutate the room.

`restoreRemovedBuyer` inserts one previously removed buyer when that id is free. The app keeps one session slot; the model does not store the slot.

`restoreExampleOffers` replaces offers with a named preset's offers and keeps the current buyers, title, and currency.

Compared rooms that use different currencies set `currencyWarning` and omit landed totals. The model does not convert currencies.

`duplicateRoom` copies a validated room and assigns a unique title suffix such as `(copy)` or `(copy 2)`, truncated to 80 characters.

`winnerBudgetLeftover` sums unused item-ceiling headroom for buyers included in the winner. Organizer briefing may include that aggregate. Merchant JSON stays on its existing aggregate whitelist.

`createWinnerAggregatesMarkdown` copies winner merchant, units, included-buyer counts, landed total, headroom, and residual fills. It omits the room title, labels, IDs, budgets, and allocations.

Named snapshots contain validated version-1 scenarios, at most 12 per workspace. Workspace JSON may include `fulfillmentFilter` of `all`, `shipping`, or `pickup`. Older files that omit it still validate and behave as `all`. Valid history contains at most 50 detached states. Baseline and three-room comparisons do not claim welfare or savings from differing cohorts. They do report leftover and unfilled residual counts. Merchant reports use an explicit whitelist and omit the scenario title as well as private buyer records. Buyer CSV is explicitly private and escapes spreadsheet formula prefixes. Organizer briefing markdown, winner aggregate markdown, merchant residual JSON, heatmap CSV, offer CSV export, variant overlap, and overlap CSV omit private buyer rows. `redactBuyerLabels` replaces labels with Buyer 1 through N without changing identifiers or constraints. `encodeRedactedScenario` encodes that redacted room; `encodeScenario` still keeps saved labels. `copyOfferAsPickup` duplicates an offer with `fulfillment` set to pickup and `shippingPerBuyer` set to 0.

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
