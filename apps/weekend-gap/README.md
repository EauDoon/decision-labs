# Weekend Gap

Weekend Gap is a responsive, zero-dependency browser simulator for a specific operational question: what can happen to synthetic AUD stablecoin redemption liquidity from Friday afternoon to Monday when the onchain ledger remains open but issuer redemption, banking, FX and Australian AUD payout windows do not fully overlap?

It is an educational tool. It uses no live market data, issuer data, account data or external services. Every scenario value is synthetic and editable. It is not financial advice.

## Open without installing anything

For terminal-only simulation and analyst workflows, see the [offline CLI](CLI.md).

Double-click [standalone.html](standalone.html) to use the full simulator directly from a file. It has no server, package installation, or network dependency. Import and export JSON remain available.

Standalone files cannot make portable share links, so sharing is disabled there. Use **Export JSON** to move a scenario to another copy of the simulator.

To regenerate the single file from this source project, use Node.js 20 or newer:

```sh
npm run build:standalone
npm run build:standalone -- --check
```

The check command does not rewrite `standalone.html`; it fails when the generated file is missing or stale.

## Run with a local launcher

This project requires Node.js 20 or newer. It has no runtime dependencies and does not need package installation.

### Windows one-click launch

After installing Node.js 20 or newer, double-click `launch-windows.cmd` in this folder. It starts the loopback-only local server and opens the GUI once it is ready. Keep the command window open while using the app, then press `Ctrl+C` to stop it.

### Cross-platform npm launch

```sh
npm run launch
```

The launcher opens the local GUI after the server is listening. If it cannot open a browser, it prints the local URL, normally `http://127.0.0.1:5173`. Press `Ctrl+C` in the terminal to stop the server.

Use this no-browser option in a terminal-only environment:

```sh
npm run launch -- --no-open
```

To run only the server without opening a browser:

```sh
npm start
```

```sh
npm test
npm run check
```

## What is included

- A deterministic weekend-liquidity simulation over a configurable horizon (24 to 336 whole hours from Friday 15:00; the 72-hour Friday-to-Monday case stays the default).
- Editable AUD liquidity, reserve, issuer, bank, FX, payout and demand assumptions.
- Normal Friday, Weekend Rush, Market Stress, Thin FX, Tight Windows (synthetic), Long-weekend Friday start (synthetic), Compressed Friday close (synthetic), Payday Friday burst (synthetic), Public-holiday Monday (synthetic), Saturday market burst (synthetic), Sunday stall close (synthetic), Thin Saturday FX (synthetic), Early Monday bank open (synthetic), Friday late FX close (synthetic), Monday late issuer open (synthetic), Saturday early FX open (synthetic), Sunday late bank close (synthetic), Sunday late payout close (synthetic), Saturday early payout open (synthetic), Friday early payout open (synthetic), Saturday late payout open (synthetic), Sunday early payout open (synthetic), Sunday late issuer close (synthetic), Sunday early issuer open (synthetic), Saturday early issuer open (synthetic), Friday early issuer open (synthetic), Saturday early bank open (synthetic), Friday early bank open (synthetic), Saturday late bank open (synthetic), Friday late bank open (synthetic), Friday late FX open (synthetic), Saturday late FX open (synthetic), Sunday late FX open (synthetic), Sunday early FX open (synthetic), Monday early FX open (synthetic), Monday late FX open (synthetic), Tuesday early FX open (synthetic), Tuesday late FX open (synthetic), Wednesday early FX open (synthetic), and Wednesday late FX open (synthetic) presets.
- Immediate redeemable AUD, queued demand, effective liquidity ratio, estimated synthetic discount or slippage, next payout time, hours to first settlement, and hours to clear the queue.
- An outcome summary showing total settled demand, the queue remaining at the horizon close, the peak queue timestamp, backlog interval count, hours to first settlement (or no settlement within the horizon), and hours to clear the queue (or queue remains). Copy dashboard numbers as Markdown, copy hours to clear as one line, copy hours to first settlement as one line, or export a one-row dashboard CSV.
- Play, pause and keyboard-accessible timeline scrubber with a concise, discoverable keyboard set (press `?` in the app for the list): Space play or pause, J first settlement, F first closed bank hour, P peak queue, S, D, Q, G section jumps, M compare Gantt, A analysis export, C copy selected hour, U and R undo and redo, E export scenario.
- Canvas chart with a printable SVG queue path that can be downloaded as a file, a formula-safe hourly queue CSV, and a text-equivalent data table.
- A horizon-length gate Gantt (SVG plus table) with hatch marks for closed hours and a consolidated hour filter (all hours, closed on at least one gate, closed on every gate, open on at least one gate, weekend only, weekday only, queued demand only), a single-gate display filter, and row-density control. Gate hour evidence buttons copy the first and last open and closed hours plus open and closed counts for one gate. Closed-hours, FX-hours and weekend-FX-counts lists and the selected hour remain copyable. Older workspace files keep loading: legacy per-gate hide flags map onto the consolidated filter and are no longer written.
- Import and export of scenario JSON, server-mode URL-hash sharing, reset and safe local autosave.

## Scenario comparison and reserve planner

Pin a baseline, then test a preset or edit an assumption. The comparison table
shows signed changes in demand, settled amount, remaining queue, peak queue, and
starting reserve. A dashed baseline queue overlays the chart.

The reserve planner finds the minimum whole-cent starting reserve needed to settle
a chosen percentage of total horizon demand by an hourly checkpoint. It holds all
other inputs fixed and reports unreachable targets when the nominal cap, demand
arrival, operating windows, or throughput prevent them. Apply a reachable result
to the editor, or export an analysis report containing both scenarios, changed
assumptions, target, deadline, and hourly comparison.

Baselines and planner settings are now saved with the local workspace. Scenario
JSON and share links still carry only the current scenario. Analysis JSON is a
report, not an importable scenario. Reduced queues are not evidence of a better
strategy if the scenarios use different demand.

## Longer horizons and calendar overrides

Set the horizon to whole hours from 24 through 336 to model disruptions past
Monday afternoon. Add dated calendar overrides for closures, delayed
reopenings, extended windows, and scheduled capacity changes; each names a
half-open hour range inside the horizon, and later entries win per field.
The Gantt, queue chart, tables, comparisons, CSVs, and reports all follow the
scenario horizon, and workspace files keep the selected hour inside it. Older
scenarios without these fields still open as the 72-hour Friday-to-Monday
case. Hours count from Friday 15:00 in abstract local time; intervals are
half-open hours and the final checkpoint closes the horizon.

## Operating interpretation

The model only settles queued demand during an overlapping issuer redemption, bank settlement and Australian AUD payout window. When the chain is open, hourly settlement is limited by the smallest of issuer throughput, available FX depth, payout throughput and remaining AUD reserve. On weekends, the synthetic FX multiplier reduces available depth and widens the base spread. A closed issuer, bank or payout gate reduces immediate payout capacity to zero.

The model does not assert that any real stablecoin, issuer, bank, exchange, off-ramp or jurisdiction works this way. It cannot establish redemption rights, reserve quality, legal availability, market prices, actual liquidity or outcomes.

Detailed formulas, units, non-goals and limitations are in [MODEL.md](MODEL.md).

## Scenario format

Exported JSON uses this envelope:

```json
{
  "format": "weekend-gap-scenario",
  "version": 1,
  "scenario": {
    "name": "Normal Friday",
    "nominalLiquidityAud": 10000000
  }
}
```

Imports accept either this envelope or a raw scenario object. Claimed envelopes must use the supported format and version; malformed or unsupported envelopes are rejected instead of silently applying partial/default assumptions. Values are validated and clamped to safe ranges. Server-mode shared links store the same editable scenario in the URL hash, which is not sent to the server by a browser request. The standalone file disables sharing because `file://` links are not portable; use exported JSON instead.

## Project structure

```text
index.html          Browser app shell and visible method section
styles.css          Responsive visual system
src/model.js        Pure deterministic model and scenario parsing
src/app.js          Browser interaction and canvas rendering
tests/*.test.mjs     Node built-in model and browser-state tests
standalone.html      Generated single-file GUI for direct opening
scripts/build-standalone.mjs Deterministic standalone builder
scripts/dev-server.mjs Dependency-free local development server
CHANGELOG.md        Version history
```

## License

MIT. See [LICENSE](LICENSE).

## New in v1.7.0: configurable horizons and operating calendar overrides

Weekend Gap 1.7.0 is a capability release on 1.6.0. The 72-hour Friday-to-Monday case is unchanged byte-for-byte in its outputs.

1. `horizonHours` sets the simulation length to whole hours from 24 through 336 starting Friday 15:00 in abstract local time. Intervals are half-open hours and the final checkpoint closes the horizon. The timeline slider, Gantt, charts, tables, comparisons, CSVs, reports, and workspace bounds all follow the horizon.
2. Optional `calendarOverrides` (at most 32) name half-open hour ranges inside the horizon with gate states, FX depth, and throughput changes. Later entries win per field, so a closure can carry a narrower reopening. Out-of-horizon ranges are rejected, not clamped.
3. The scenario editor gains a horizon field and an override list with add, edit, and remove actions. Edits are undoable and travel in scenario JSON, share links, and autosave. Shrinking the horizon below an override drops it with a warning message.
4. Saturday/Sunday rules, Monday and Saturday holidays, dated presets, and demand profiles apply at any horizon; a Monday holiday closes every Monday in the window. Older scenarios without these fields still open as the 72-hour case.

## New in v1.6.0: consolidated Gantt filters, gate hour evidence, and a concise keyboard set

Weekend Gap 1.6.0 is a maintainability release. It does not change the simulation math. Peak queue, settled totals, reserve accounting and scenario files are computed exactly as in 1.5.x.

1. The Gantt card replaces roughly twenty per-gate "hide hours" checkboxes with one Show hours filter: all hours, closed on at least one gate, closed on every gate, open on at least one gate, Saturday and Sunday only, weekdays only, or hours with queued demand. Show gates and row density stay as selects.
2. The roughly twenty-five single-purpose "copy first or last open or closed hour" buttons become four gate hour evidence buttons. Each copies the first and last open and closed hour for one gate, plus open and closed counts, as Markdown. Closed-hours, FX-hours, weekend-FX-counts and selected-hour copies stay as separate buttons.
3. The keyboard set is trimmed to a discoverable list shown under `?`. Niche keys (punctuation, F2-F12, Insert, PageUp, arrow keys bound to filters and copy controls) are retired. Normal browser behavior (Find, fullscreen, dev tools, scrolling) is no longer intercepted.
4. Workspace JSON gains one `ganttHourFilter` key and stops writing the legacy hide flags. Older workspace files still open: each legacy flag maps onto the closest consolidated filter value, and files without the new key restore to all hours.
5. Analysis JSON, review packets, CSV exports and the standalone build keep their documented formats. Analysis JSON still has no timestamps. Hatched Gantt rows are a local drawing. They do not connect to a bank or a live redemption queue.
6. Presets from 1.5.1 through 1.5.33, the timing review panel, comparison and reserve planner are unchanged.

v1.5.33 remains the previous behavior reference for the retired controls.
