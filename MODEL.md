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
- capacity in units; and
- shipping cost per included buyer.

An offer can also supply `tiers`, an optional array of up to eight `{ minimumUnits, unitPrice }` objects. Thresholds must be whole numbers, strictly increase above the previous minimum, and fit capacity. Prices must be nonnegative and strictly decrease below the previous price. Missing or empty tiers retain the original flat-price behavior. Tier objects survive JSON, autosave, and share-link round trips.

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

To keep this exact search responsive, a scenario accepts at most 40 buyers and 40 offers, and each buyer quantity, merchant minimum, and merchant capacity is capped at 5,000 units.

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

## Aggregate merchant signal

Demand is grouped by product category. For each category, the merchant view reports buyer count, total units, the range of price ceilings, the range of delivery limits, and the union of accepted variants. It does not report buyer labels or buyer-to-offer matches.

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
