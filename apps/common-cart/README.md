# Common Cart

Common Cart is a local-first pooled purchase simulator. Buyers enter compatible product constraints, merchants enter conditional offers, and the app shows which offers the group can unlock without exposing individual buyer records in the merchant view.

It is a working research prototype for a simple question: can shared demand create bargaining power before a marketplace has accounts, payments, or live merchant integrations?

![Common Cart showing the built-in coffee example, requested units, fulfilled demand, and group headroom.](.github/assets/project-preview.jpg)

*Built-in synthetic coffee scenario.*

## Changelog (1.3.2)

Organizer tools for offer intake, list hygiene, honest compares, and a quieter print page. This remains an offline simulator. Merchant views still receive aggregates and counts only.

- **Offer CSV import.** Import `name, capacity, unit price, shipping, fulfillment, variants`. Formula prefixes are neutralized. Invalid rows name the offer and field. Buyers stay in place.
- **Buyer sort.** Preview label A-Z or quantity high-low without changing ids or saved order. Apply writes the new order and is undoable.
- **Overlap CSV copy.** Copy the variant overlap matrix as formula-safe CSV. Cells and totals are counts only.
- **Keyboard jump.** `o` focuses the offers list when you are not typing. `m` still focuses the merchant inspector.
- **Fulfillment filter.** Show all, shipping, or pickup offer rows on screen. Saved offers and matching stay unchanged.
- **Print one-pager.** Hide coach, help, and private buyer rows. Keep the title, winner aggregates, residual or tertiary fill, and heatmap.
- **Restore last removed buyer.** One session slot. Restore is undoable and keeps the original id when it is free.
- **Mixed-currency warning.** Compared rooms that use different currencies omit landed totals instead of converting them.
- **Duplicate room snapshot.** Copy the open room into a named snapshot with a unique `(copy)` title suffix for later compares.
- **Winner budget leftover.** Organizer-only sum of unused item-ceiling headroom after the winner. Merchant JSON stays aggregates.

## Changelog (1.3.1)

Organizer and merchant workbench updates for leftover planning, share hygiene, and empty-room recovery. This remains an offline simulator. Residual coverage is still a planning aid, not a dual checkout or split invoice.

- **Tertiary residual fill.** After the winner and the next leftover offer, a third distinct offer is tried on remaining whole buyers. Quantities are never split. Organizer briefing names the tertiary fill as aggregates. Compare rooms report leftover and unfilled counts.
- **Variant overlap matrix.** Merchants see how many buyers accept each offered variant, including pairwise overlap. Cells are counts only. Labels, IDs, budgets, and allocations stay out.
- **Redacted share link.** Optional hash uses Buyer 1 through N labels. The default share link still encodes saved private labels. Standalone `file://` pages keep pointing to JSON export.
- **Delivery heatmap CSV.** Aggregate deadline buckets with buyer and unit counts. Formula-like text is escaped the same way as other CSV exports.
- **Keyboard jump.** `m` focuses the merchant inspector region when you are not typing. `?` help lists it with undo, redo, export, and add buyer.
- **Copy as pickup.** One click clones a shipping offer with fulfillment set to pickup and shipping charged at 0. The original offer is unchanged.
- **Empty-room recovery.** Deleting every buyer leaves a valid empty room. Restore neighbourhood example reloads the coffee scenario and is undoable.

## Changelog (1.3.0)

Pooled-purchase workbench updates for organizers who need leftover fill, quantity-ladder planning, and private-label hygiene. This remains an offline simulator. Residual coverage is a planning aid, not a dual checkout.

- **Residual coverage.** After the winning offer is chosen, leftover whole-buyer demand can be tested against the next-best other offer with the same exact allocator. A buyer's quantity is never split. The buyer room shows Unfilled after winner, and merchant JSON keeps only aggregates.
- **Units to the next cheaper tier.** The inspector reports additional whole units, and which excluded buyers could supply them. Merchant-facing tables show counts only. Unreachable bands name capacity or compatibility limits.
- **Buyer CSV import.** Import `label, category, quantity, max unit price, latest delivery days, variants`, with optional max order total. Spreadsheet formula prefixes are neutralized like CSV export. Invalid rows name the buyer and field.
- **Screenshot mode.** Replace organizer labels with Buyer 1 through N without changing the saved room. Export redacted JSON when you need a shareable copy without private names.
- **First-run coach and shortcuts.** A dismissible overlay (skipped for share links) explains pooling, comparing, and inspecting exclusions. `?` opens help, `u`/`r` undo and redo, `e` exports JSON, `n` adds a buyer. Keys are ignored while typing.
- **Capacity leftover bar and delivery heatmap.** SVG plus text equivalents for filled units versus capacity versus the next-tier mark, and aggregate delivery-deadline buckets.
- **Pickup or shipping.** Offer field `fulfillment` is `shipping` or `pickup`. Legacy JSON without the field still ships. Pickup charges zero shipping in matching, budgets, and landed totals. Unknown values are rejected. Quantity `tiers` are unchanged.
- **Organizer briefing.** Markdown export of title, currency, winner aggregates, excluded count, next-tier gap, and residual coverage, without private buyer rows.
- **Office pantry and hardware tools presets.** Distinct categories and variants, including a pickup hardware offer.
- **Exclusion grouping.** Inspector counts price, delivery, variant, budget, capacity leftover, and quantity-versus-capacity reasons while keeping per-buyer detail.
- **Workbench extras.** Compare the open room with two snapshots, copy an offer as a new tier set, and export merchant-safe residual coverage.

### Decision workspace improvements (09-09-2026)

- Set an optional **Max order total** for each buyer to include shipping in eligibility. Blank preserves the existing item-only budget. Each tier checks this ceiling independently.
- **Undo / Redo** preserves up to 50 valid room states during the session. Invalid edits are not saved; Undo restores the last valid state. A new valid edit clears the redo branch.
- Save up to **12 named snapshots** using the room title. Snapshots are independent of current edits and survive reload when browser storage is available. Export individual rooms as JSON for portable backups. Corrupt snapshot storage is preserved and snapshot writes are disabled for that session.
- **Copy** buyers or offers to create independent alternatives, including variants and tiers, with unique IDs.
- Pin a **baseline**, then adjust a room or load a snapshot. Compare participation, winning merchant, and landed totals. Different demand is explicitly flagged; different currencies suppress cost comparisons. A lower total for fewer buyers is not savings.
- Export the **aggregate merchant report** as JSON, without buyer IDs, labels, budgets, or allocations. Export a separate **private buyer CSV** for the inspected offer, including excluded orders and reasons. Formula-like text is escaped; numeric results retain up to eight decimal places.
- The offer chart scrolls with readable rows for all 40 offers and marks the selected price band's minimum. Keyboard users can scroll the chart and retain focus after removing rows.

Autosave status remains visible. Storage failures require JSON export before closing. An unreadable existing autosave is preserved until you explicitly reset the room; current edits can still be exported. Replacing an invalid draft asks before discarding it; valid preset, import, and reset replacements can be undone. Undo history and the pinned baseline are session-only. Share links and full scenario JSON contain private buyer records, unlike the aggregate report. This remains an offline simulator without live inventory, checkout, or merchant authentication.

The standalone module also fixes a duplicate helper declaration that previously prevented the generated GUI from starting. Its generated script now receives a real JavaScript module syntax check in the test suite.

### Earlier quantity price ladders (27-08-2026)

Merchant offers now support up to eight quantity discounts. The exact allocator checks each price at a quantity that can actually be filled, including buyers who can afford only the discounted price. Demand that does not fit capacity cannot unlock a discount.

Open **Price ladder** to see 20 units qualify at A$20 each, with A$9 total shipping. Inspect the price-band table, the A$160 discount against the declared base price, and each included buyer's landed cost. One buyer's shipping exceeds their item-price ceiling and is explicitly flagged. These are synthetic scenario results, not live quotes or guaranteed savings.

The merchant table shows aggregate outcomes only. Existing scenarios, JSON files, share links, and local saves remain compatible. No dependency or installation was added.

## Open the GUI without installing anything

Download [standalone.html](standalone.html), then double-click it. The complete GUI, model, styles, and synthetic examples are inside that one file. It makes no network requests.

The standalone file supports local editing, autosave when the browser permits it, and JSON import and export. A `file://` link points to a path on your own device, so the standalone GUI directs sharing through Export JSON instead of producing a misleading link.

## Launch from the repository

Requirements: Node.js 20 or newer.

On Windows, double-click `launch-windows.cmd`. It starts the local server and opens Common Cart in your default browser. Keep the launcher window open while using the app; press `Ctrl+C` or close the window to stop it.

On Windows, macOS, or Linux, run:

```bash
npm run launch
```

The command opens `http://127.0.0.1:4173` after the server is ready. The listener is loopback IPv4 only. Set `PORT` to an integer from 1 through 65535 to use a different loopback port; omit it to use 4173. Empty or invalid `PORT` values are rejected before the server starts. Pass `--no-open` or set `NO_BROWSER=1` to print the address without opening a browser. If automatic browser opening is unavailable, copy the printed address into a browser. No package installation, account, API key, build, or network connection is required.

For server-only use, run `npm start` and open the printed address manually. `npm start` uses the same `PORT` default and validation.

Run the full local check:

```bash
npm run check
```

## What you can do

- Start from coffee, office chair, community pantry, office pantry bulk, hardware tools, or price-ladder examples.
- Add buyers with a category, quantity, price ceiling, delivery limit, and accepted variants, or import those columns from CSV. Sort the organizer list by label or quantity, then apply when you want that order saved.
- Add merchant bids with a price, minimum order, delivery time, capacity, shipping cost, and shipping or pickup fulfillment, or import name, capacity, unit price, shipping, fulfillment, and variants from CSV.
- Filter the on-screen offer list by fulfillment without changing saved bids.
- Edit quantity price tiers and inspect each band's whole-order feasibility, including units still needed for the next cheaper band.
- Review item cost, shipping, landed cost, and ceiling headroom per included buyer locally.
- Compare qualified offers by fulfilled units, group headroom, buyers included, and landed cost.
- Inspect why each buyer order is included, blocked by the minimum, left out by capacity, or incompatible with an offer, grouped by reason.
- See leftover demand after the winner, then a second and third distinct offer, as a planning aid, not a second checkout.
- See which local buyer labels each qualified offer includes; merchant-facing views stay aggregated. Screenshot mode can hide labels. A redacted share link uses Buyer 1 through N.
- Inspect a merchant view that contains aggregate ranges, a variant overlap matrix, and a delivery heatmap, rather than individual records. Copy overlap counts as formula-safe CSV.
- Import or export a scenario as JSON, duplicate the room as a compare snapshot, export an organizer briefing, export heatmap CSV, or encode the current scenario in a share link.
- Recover an empty buyer room with the neighbourhood example, or restore the last buyer removed in this session. Undo returns to the previous valid list.
- Work entirely in the browser with local autosave.

## How matching works

A buyer is compatible with an offer only when all four tests pass:

1. The product category matches.
2. The offered variant is accepted.
3. The unit price is no higher than the buyer's ceiling.
4. Delivery is no later than the buyer's limit.

The allocator performs an exact bounded search for the greatest whole-buyer quantity within merchant capacity. For tiered offers, each price is evaluated inside its own quantity band. The selected cohort must reach that band's minimum without reaching the next band's threshold. The feasible band with the most units wins. Buyers' ceilings cover item prices, not shipping; pickup fulfillment charges 0 shipping during matching. Landed-cost overruns are shown separately without changing legacy eligibility. See [MODEL.md](./MODEL.md) for formulas, bounds, ranking rules, residual coverage, and limitations.

## Repository map

```text
.
|-- index.html              Browser interface
|-- styles.css              Responsive visual system
|-- src/
|   |-- app.js              UI, local storage, import, export, and charts
|   |-- model.js            Pure validation, matching, ranking, and aggregation
|   `-- model.d.ts          Public model types
|-- tests/
|   |-- model.test.mjs      Deterministic matching and validation tests
|   |-- tiers.test.mjs      Quantity-band allocator tests
|   |-- residual.test.mjs   Leftover coverage after the winner
|   |-- next-tier.test.mjs  Units needed for the next cheaper band
|   |-- csv-import.test.mjs Buyer CSV import
|   |-- offer-csv.test.mjs  Merchant offer CSV import
|   |-- overlap.test.mjs    Merchant variant overlap counts
|   |-- heatmap.test.mjs    Delivery deadline buckets and CSV
|   |-- empty-room.test.mjs Empty buyer rooms and undoable restore
|   |-- restore-buyer.test.mjs Last removed buyer restore
|   |-- buyer-sort.test.mjs Organizer buyer sort preview and apply
|   |-- duplicate-room.test.mjs Room copy snapshots
|   |-- print.test.mjs      Print one-pager privacy
|   |-- shortcuts.test.mjs  Keyboard help for inspector and offers
|   |-- standalone.test.mjs Single-file build checks
|-- standalone.html         No-install, single-file GUI
|-- launch-windows.cmd      One-click Windows GUI launcher
|-- scripts/build-standalone.mjs  Deterministic single-file builder
|-- scripts/launch.mjs      Cross-platform GUI launcher
|-- scripts/dev-server.mjs  Dependency-free local server
|-- scripts/listen-config.mjs     Shared PORT default and validation
|-- MODEL.md                Model contract and limitations
|-- SECURITY.md             Security and privacy boundary
`-- CONTRIBUTING.md         Contribution workflow
```

The [root CI workflow](../../.github/workflows/common-cart.yml) runs this component's integrity check.

## Data and privacy

Common Cart makes no network requests. Scenarios are held in browser memory and local storage. Export and link sharing happen only when requested. A share link contains the full scenario, including buyer labels, so review it before sending. Screenshot mode, redacted JSON, and the optional redacted share link replace labels with Buyer 1 through N. Merchant reports, residual coverage JSON, heatmap CSV, variant overlap, overlap CSV, and organizer briefings omit private buyer rows. Offer CSV import does not read buyer columns. Winner budget leftover is organizer-only and is not written into merchant JSON.

The merchant view is an interface boundary, not a formal privacy guarantee. Small cohorts and unusual constraints can still reveal information.

## Non-goals

Common Cart is not a marketplace, procurement recommendation, live price feed, or payment service. It does not verify merchants, reserve inventory, collect identities, execute purchases, allocate disputes, or claim an economically optimal match.

## Contributing

Bug reports and focused pull requests are welcome. Read [CONTRIBUTING.md](./CONTRIBUTING.md) and [SECURITY.md](./SECURITY.md) first.

## License

MIT. See [LICENSE](./LICENSE).
