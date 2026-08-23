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

All money values use the scenario's three-letter currency code. The app does not perform currency conversion.

## Compatibility

Buyer `b` is compatible with offer `o` when:

```text
sameCategory(b, o)
and offeredVariant(o) is in acceptedVariants(b)
and unitPrice(o) <= maxUnitPrice(b)
and deliveryDays(o) <= latestDeliveryDays(b)
```

Category and variant comparisons are case-insensitive after input validation. Inputs are not otherwise interpreted or classified.

## Capacity allocation

The allocator performs an exact bounded whole-order search. It chooses a set of complete buyer quantities with the greatest total units that does not exceed merchant capacity. It never splits a buyer's quantity. Buyer IDs provide a stable deterministic order when more than one set reaches the same unit total.

To keep this exact search responsive, a scenario accepts at most 40 buyers and 40 offers, and each buyer quantity, merchant minimum, and merchant capacity is capped at 5,000 units.

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
```

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

The model can test whether a declared offer satisfies declared constraints. It cannot prove that a purchase is wise, fair, available, safe, or legally compliant.
