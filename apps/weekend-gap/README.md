# Weekend Gap

Weekend Gap is a responsive, zero-dependency browser simulator for a specific operational question: what can happen to synthetic AUD stablecoin redemption liquidity from Friday afternoon to Monday when the onchain ledger remains open but issuer redemption, banking, FX and Australian AUD payout windows do not fully overlap?

It is an educational tool. It uses no live market data, issuer data, account data or external services. Every scenario value is synthetic and editable. It is not financial advice.

## Open without installing anything

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

- A deterministic 72-hour Friday-to-Monday simulation.
- Editable AUD liquidity, reserve, issuer, bank, FX, payout and demand assumptions.
- Normal Friday, Weekend Rush and Market Stress presets.
- Immediate redeemable AUD, queued demand, effective liquidity ratio, estimated synthetic discount or slippage, and next payout time.
- An outcome summary showing total settled demand, the queue remaining at Monday 15:00, the peak queue timestamp, and the number of hourly checkpoints with a backlog.
- Play, pause and keyboard-accessible timeline scrubber.
- Canvas chart with a text-equivalent data table.
- Import and export of scenario JSON, server-mode URL-hash sharing, reset and safe local autosave.

## Scenario comparison and reserve planner

Pin a baseline, then test a preset or edit an assumption. The comparison table
shows signed changes in demand, settled amount, remaining queue, peak queue, and
starting reserve. A dashed baseline queue overlays the chart.

The reserve planner finds the minimum whole-cent starting reserve needed to settle
a chosen percentage of total 72-hour demand by an hourly checkpoint. It holds all
other inputs fixed and reports unreachable targets when the nominal cap, demand
arrival, operating windows, or throughput prevent them. Apply a reachable result
to the editor, or export an analysis report containing both scenarios, changed
assumptions, target, deadline, and hourly comparison.

Baselines and planner settings are now saved with the local workspace. Scenario
JSON and share links still carry only the current scenario. Analysis JSON is a
report, not an importable scenario. Reduced queues are not evidence of a better
strategy if the scenarios use different demand.

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
```

## License

MIT. See [LICENSE](LICENSE).

## New in v1.3.0: repeatable experiments

1. Choose a preset, edit assumptions and select flat, Friday burst or Monday rush demand timing. Timing redistributes the same total demand; it does not introduce randomness.
2. Pin a baseline and write experiment notes. Compare the current scenario with the detached baseline, then run five sensitivity cases for one assumption. Capped values are labeled. Applying a case keeps the baseline.
3. Inspect simultaneous operating blockers, the longest backlog run and end-of-hour queue exposure. Use the full hourly table or jump to the peak queue or Monday opening checkpoint.
4. Save named copies in the local library (12 slots). Undo and redo recover up to 39 scenario edits in the current tab. This recovery history does not include notes, baseline changes or deleted library copies.
5. Export an editable workspace, a printable HTML report or the full hourly CSV. Open the report offline and use the browser Print command. Reports escape imported text and contain no scripts or external resources.

### What each export contains

| Export | Contents | Importable here |
| --- | --- | --- |
| Scenario JSON / share link | Current editable scenario | Scenario import / URL hash |
| Workspace JSON | Current and baseline scenarios, notes, target, deadline, selected hour | Workspace import |
| Analysis JSON | Both scenarios, results, reserve plan and hourly comparison | No, report only |
| Hourly CSV | All 73 checkpoints, prior-interval flows and next-hour capacity | No, spreadsheet data |
| Printable HTML | Notes, assumptions, comparison, diagnostics, reserve plan and model limits | No, report only |

Scenario, workspace and library data stay in browser storage. Nothing syncs to an account or server. A scenario hash takes priority over local recovery at startup. Normal reloads restore the latest workspace, including its baseline and notes. Browser/file-origin storage availability varies, so export important work. Storage failures remain visible while the simulator stays usable. Invalid planner drafts do not replace the last valid target in recovery, and incomplete numeric assumption fields leave the previous simulation intact.

The selected timeline hour has an accessible time label. With reduced motion enabled, playback becomes a single-hour step. Playback pauses when the tab is hidden, and the hourly table remains available without canvas.

Verification uses the built-in Node test runner, including an actual source-module workflow harness with a minimal DOM adapter. It checks imports, saved-scenario and workspace reload flows, failed imports, undo/redo, sensitivity invalidation, blocked storage, incomplete numeric drafts, reduced motion and missing canvas. This complements the browser checks; it is not a substitute for every browser or assistive-technology combination.
