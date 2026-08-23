# Common Cart

Common Cart is a local-first pooled purchase simulator. Buyers enter compatible product constraints, merchants enter conditional offers, and the app shows which offers the group can unlock without exposing individual buyer records in the merchant view.

It is a working research prototype for a simple question: can shared demand create bargaining power before a marketplace has accounts, payments, or live merchant integrations?

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

The command opens `http://127.0.0.1:4173` after the server is ready. If automatic browser opening is unavailable, copy the printed address into a browser. No package installation, account, API key, build, or network connection is required.

For server-only use, run `npm start` and open the printed address manually.

Run the full local check:

```bash
npm run check
```

## What you can do

- Start from coffee, office chair, or community pantry examples.
- Add buyers with a category, quantity, price ceiling, delivery limit, and accepted variants.
- Add merchant bids with a price, minimum order, delivery time, capacity, and shipping cost.
- Compare qualified offers by fulfilled units, group headroom, buyers included, and landed cost.
- Inspect why each buyer order is included, blocked by the minimum, left out by capacity, or incompatible with an offer.
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

The allocator performs an exact bounded search for the greatest whole-buyer quantity within merchant capacity. An offer unlocks only when the selected units reach its minimum order. The offer inspector exposes each outcome in the private buyer room while the merchant view remains aggregate-only. See [MODEL.md](./MODEL.md) for formulas, bounds, ranking rules, and limitations.

## Repository map

```text
.
|-- index.html              Browser interface
|-- styles.css              Responsive visual system
|-- src/
|   |-- app.js              UI, local storage, import, export, and charts
|   `-- model.js            Pure validation, matching, ranking, and aggregation
|-- tests/model.test.mjs    Deterministic model tests
|-- standalone.html         No-install, single-file GUI
|-- launch-windows.cmd      One-click Windows GUI launcher
|-- scripts/build-standalone.mjs  Deterministic single-file builder
|-- scripts/launch.mjs      Cross-platform GUI launcher
|-- scripts/dev-server.mjs  Dependency-free local server
|-- MODEL.md                Model contract and limitations
|-- SECURITY.md             Security and privacy boundary
`-- CONTRIBUTING.md         Contribution workflow
```

## Data and privacy

Common Cart makes no network requests. Scenarios are held in browser memory and local storage. Export and link sharing happen only when requested. A share link contains the full scenario, including buyer labels, so review it before sending.

The merchant view is an interface boundary, not a formal privacy guarantee. Small cohorts and unusual constraints can still reveal information.

## Non-goals

Common Cart is not a marketplace, procurement recommendation, live price feed, or payment service. It does not verify merchants, reserve inventory, collect identities, execute purchases, allocate disputes, or claim an economically optimal match.

## Contributing

Bug reports and focused pull requests are welcome. Read [CONTRIBUTING.md](./CONTRIBUTING.md) and [SECURITY.md](./SECURITY.md) first.

## License

MIT. See [LICENSE](./LICENSE).
