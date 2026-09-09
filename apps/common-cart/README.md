# Common Cart

Common Cart is a local-first pooled purchase simulator. Buyers enter compatible product constraints, merchants enter conditional offers, and the app shows which offers the group can unlock without exposing individual buyer records in the merchant view.

It is a working research prototype for a simple question: can shared demand create bargaining power before a marketplace has accounts, payments, or live merchant integrations?

![Common Cart showing the built-in coffee example, requested units, fulfilled demand, and group headroom.](.github/assets/project-preview.jpg)

*Built-in synthetic coffee scenario.*

## Decision workspace improvements (09-09-2026)

- Set an optional **Max order total** for each buyer to include shipping in eligibility. Blank preserves the existing item-only budget. Each tier checks this ceiling independently.
- **Undo / Redo** preserves up to 50 valid room states during the session. Invalid edits are not saved; Undo restores the last valid state. A new valid edit clears the redo branch.
- Save up to **12 named snapshots** using the room title. Snapshots are independent of current edits and survive reload when browser storage is available. Export individual rooms as JSON for portable backups. Corrupt snapshot storage is preserved and snapshot writes are disabled for that session.
- **Copy** buyers or offers to create independent alternatives, including variants and tiers, with unique IDs.
- Pin a **baseline**, then adjust a room or load a snapshot. Compare participation, winning merchant, and landed totals. Different demand is explicitly flagged; different currencies suppress cost comparisons. A lower total for fewer buyers is not savings.
- Export the **aggregate merchant report** as JSON, without buyer IDs, labels, budgets, or allocations. Export a separate **private buyer CSV** for the inspected offer, including excluded orders and reasons. Formula-like text is escaped; numeric results retain up to eight decimal places.
- The offer chart scrolls with readable rows for all 40 offers and marks the selected price band's minimum. Keyboard users can scroll the chart and retain focus after removing rows.

Autosave status remains visible. Storage failures require JSON export before closing. Replacing an invalid draft asks before discarding it; valid preset, import, and reset replacements can be undone. Undo history and the pinned baseline are session-only. Share links and full scenario JSON contain private buyer records, unlike the aggregate report. This remains an offline simulator without live inventory, checkout, or merchant authentication.

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

- Start from coffee, office chair, community pantry, or price-ladder examples.
- Add buyers with a category, quantity, price ceiling, delivery limit, and accepted variants.
- Add merchant bids with a price, minimum order, delivery time, capacity, and shipping cost.
- Edit quantity price tiers and inspect each band's whole-order feasibility.
- Review item cost, shipping, landed cost, and ceiling headroom per included buyer locally.
- Compare qualified offers by fulfilled units, group headroom, buyers included, and landed cost.
- Inspect why each buyer order is included, blocked by the minimum, left out by capacity, or incompatible with an offer.
- See which local buyer labels each qualified offer includes; merchant-facing views stay aggregated.
- Inspect a merchant view that contains aggregate ranges rather than individual records.
- Import or export a scenario as JSON.
- Encode the current scenario in a share link.
- Work entirely in the browser with local autosave.

## How matching works

A buyer is compatible with an offer only when all four tests pass:

1. The product category matches.
2. The offered variant is accepted.
3. The unit price is no higher than the buyer's ceiling.
4. Delivery is no later than the buyer's limit.

The allocator performs an exact bounded search for the greatest whole-buyer quantity within merchant capacity. For tiered offers, each price is evaluated inside its own quantity band. The selected cohort must reach that band's minimum without reaching the next band's threshold. The feasible band with the most units wins. Buyers' ceilings cover item prices, not shipping; landed-cost overruns are shown separately without changing legacy eligibility. See [MODEL.md](./MODEL.md) for formulas, bounds, ranking rules, and limitations.

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
|   `-- standalone.test.mjs Single-file build checks
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

Common Cart makes no network requests. Scenarios are held in browser memory and local storage. Export and link sharing happen only when requested. A share link contains the full scenario, including buyer labels, so review it before sending.

The merchant view is an interface boundary, not a formal privacy guarantee. Small cohorts and unusual constraints can still reveal information.

## Non-goals

Common Cart is not a marketplace, procurement recommendation, live price feed, or payment service. It does not verify merchants, reserve inventory, collect identities, execute purchases, allocate disputes, or claim an economically optimal match.

## Contributing

Bug reports and focused pull requests are welcome. Read [CONTRIBUTING.md](./CONTRIBUTING.md) and [SECURITY.md](./SECURITY.md) first.

## License

MIT. See [LICENSE](./LICENSE).
