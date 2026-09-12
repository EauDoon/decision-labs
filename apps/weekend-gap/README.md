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

- A deterministic 72-hour Friday-to-Monday simulation.
- Editable AUD liquidity, reserve, issuer, bank, FX, payout and demand assumptions.
- Normal Friday, Weekend Rush, Market Stress, Thin FX, Tight Windows (synthetic), Long-weekend Friday start (synthetic), Compressed Friday close (synthetic), Payday Friday burst (synthetic), Public-holiday Monday (synthetic), Saturday market burst (synthetic), Sunday stall close (synthetic), Thin Saturday FX (synthetic), Early Monday bank open (synthetic), Friday late FX close (synthetic), Monday late issuer open (synthetic), Saturday early FX open (synthetic), Sunday late bank close (synthetic), Sunday late payout close (synthetic), Saturday early payout open (synthetic), Friday early payout open (synthetic), Saturday late payout open (synthetic), Sunday early payout open (synthetic), Sunday late issuer close (synthetic), Sunday early issuer open (synthetic), Saturday early issuer open (synthetic), Friday early issuer open (synthetic), Saturday early bank open (synthetic), Friday early bank open (synthetic), Saturday late bank open (synthetic), Friday late bank open (synthetic), Friday late FX open (synthetic), Saturday late FX open (synthetic), Sunday late FX open (synthetic), Sunday early FX open (synthetic), Monday early FX open (synthetic), Monday late FX open (synthetic), Tuesday early FX open (synthetic), Tuesday late FX open (synthetic), Wednesday early FX open (synthetic), Wednesday late FX open (synthetic), Thursday early FX open (synthetic), Thursday late FX open (synthetic), Friday early FX open (synthetic), and Saturday midday FX open (synthetic) presets.
- Immediate redeemable AUD, queued demand, effective liquidity ratio, estimated synthetic discount or slippage, next payout time, hours to first settlement, and hours to clear the queue.
- An outcome summary showing total settled demand, the queue remaining at Monday 15:00, the peak queue timestamp, backlog interval count, hours to first settlement (or no settlement in 72 hours), and hours to clear the queue (or queue remains). Copy dashboard numbers as Markdown, copy hours to clear as one line, copy hours to first settlement as one line, or export a one-row dashboard CSV.
- Play, pause and keyboard-accessible timeline scrubber, plus shortcuts for help, dashboard, queue chart, Gantt, selected Gantt hour, hours to clear, hours to first settlement line, hours to first settlement copy, comma hours-to-first-settlement copy, semicolon hours-to-clear copy, hours-to-clear copy jump, Print jump, first-payout marker, Payout Gantt row, analysis export, Bank Gantt row, Issuer Gantt row, FX Gantt row, first-closed-FX copy jump, remaining-reserve copy jump, apostrophe first-closed-bank copy, colon first-closed-issuer copy, quote first-closed-payout copy, close-brace first-closed-FX copy, tilde first-open-payout copy, open-paren first-open-FX copy, star first-open-bank copy, dollar first-open-issuer copy, 5 last-open-issuer copy, 8 last-closed-issuer copy, 1 last-closed-bank copy, 4 last-open-bank copy, PageUp last-open-payout copy, Insert last-open-FX copy, Delete last-closed-FX copy, F3 last-closed-payout copy, F7 last-weekend-FX-closed copy, F10 last-weekday-FX-closed copy, Shift+F10 last-weekday-FX-open copy, plus first-closed-FX copy jump, bang first-open-payout copy jump, close-paren first-open-FX copy jump, ampersand first-open-bank copy jump, caret first-open-issuer copy jump, 6 last-open-issuer copy jump, 9 last-closed-issuer copy jump, 2 last-closed-bank copy jump, Home last-open-bank copy jump, PageDown last-open-payout copy jump, ArrowDown last-open-FX copy jump, F2 last-closed-FX copy jump, F4 last-closed-payout copy jump, F8 last-weekend-FX-closed copy jump, F11 last-weekday-FX-closed copy jump, Shift+F11 last-weekday-FX-open copy jump, first-closed-bank copy jump, first-closed-issuer copy jump, first-closed-payout copy jump, hide-zero-queue filter jump, hide-bank-closed filter jump, hide-issuer-closed filter jump, pipe hide-payout-closed filter jump, at-sign hide-FX-closed filter jump, hash hide-payout-open filter jump, percent hide-FX-open filter jump, backtick hide-issuer-open filter jump, 7 hide-weekend-issuer-open filter jump, 0 hide-weekend-issuer-closed filter jump, 3 hide-weekend-bank-closed filter jump, End hide-weekend-bank-open filter jump, ArrowUp hide-weekend-payout-open filter jump, ArrowLeft hide-weekend-FX-open filter jump, F12 hide-weekend-FX-open filter jump, Shift+F12 hide-weekday-FX-closed filter jump, ArrowRight hide-weekend-payout-closed filter jump, Backspace hide-weekend-FX-closed filter jump, F9 hide-weekday-FX-closed filter jump, compare Gantt, peak queue, selected Gantt hour copy, remaining-reserve copy, selected versus peak-queue hour copy, closed-hours copy, timing review, first settlement, first closed bank hour, scenario inputs, undo, redo and export.
- Canvas chart with a printable SVG queue path that can be downloaded as a file, a formula-safe hourly queue CSV, and a text-equivalent data table.
- A 72-hour gate Gantt (SVG plus table) with hatch marks for closed hours, a closed-hours-only display filter, an every-gate-closed display filter, a Saturday-and-Sunday-hours display filter, a hide-weekend-hours display filter, a hide-open-hours display filter, a hide-closed-hours display filter, a hide-zero-queue-hours display filter, a hide-bank-closed-hours display filter, a hide-issuer-closed-hours display filter, a hide-payout-closed-hours display filter, a hide-FX-closed-hours display filter, a hide-payout-open-hours display filter, a hide-FX-open-hours display filter, a hide-bank-open-hours display filter, a hide-issuer-open-hours display filter, a hide-weekend-issuer-open-hours display filter, a hide-weekend-issuer-closed-hours display filter, a hide-weekend-bank-closed-hours display filter, a hide-weekend-bank-open-hours display filter, a hide-weekend-payout-open-hours display filter, a hide-weekend-FX-open-hours display filter, a hide-weekend-payout-closed-hours display filter, a hide-weekend-FX-closed-hours display filter, a hide-weekday-FX-closed-hours display filter, a hide-weekday-FX-open-hours display filter, a single-gate display filter, copy of the selected hour, copy of remaining reserve at that hour, copy of the peak-queue hour, copy of selected versus peak-queue hour, copy of closed hours, copy of FX hours, copy of weekend FX hour counts, copy of the first closed FX hour label, copy of the first closed bank hour label, copy of the first closed issuer hour label, copy of the first closed payout hour label, copy of the first open payout hour label, copy of the first open FX hour label, copy of the first open bank hour label, copy of the first open issuer hour label, copy of the last open issuer hour label, copy of the last open bank hour label, copy of the last open payout hour label, copy of the last open FX hour label, copy of the last closed issuer hour label, copy of the last closed bank hour label, copy of the last closed FX hour label, copy of the last closed payout hour label, copy of the last weekend-FX-closed hour label, copy of the last weekday-FX-closed hour label, copy of the last weekend-FX-open hour label, copy of the last weekday-FX-open hour label, copy of the first weekday-FX-open hour label, copy of the first weekday-FX-closed hour label, copy of the first weekend-FX-open hour label, copy of the first weekend-FX-closed hour label, copy of the next-payout hour label, the current hour and first payout window marked, plus a paired-row baseline versus current Gantt.
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
CHANGELOG.md        Version history
```

## License

MIT. See [LICENSE](LICENSE).

## New in v1.5.37: Saturday midday FX open, last-weekday-FX-open copy, and weekday-FX-closed hide

Saturday midday FX open, last-weekday-FX-open copy, and weekday-FX-closed hide in Weekend Gap 1.5.37

1. Press `Shift+F10` to copy the last weekday-FX-open hour through the existing last-weekday-FX-open copy control, using one-line Markdown. Honest empty when none. The key is ignored while typing. Distinct from unshifted `F10` last-weekday-FX-closed copy, last-weekend-FX-open copy, last-weekend-FX-closed copy, first-weekend-FX-closed copy, first-weekend-FX-open copy, first-weekday-FX-closed copy, first-weekday-FX-open copy, `F7` last-weekend-FX-closed copy and `Delete` last-closed-FX copy. Shift is handled before unshifted `F10`. First-weekend-FX-closed copy remains as a button without `Shift+F10`.
2. Press `Shift+F11` to jump to the last-weekday-FX-open-hour copy control. If that control is missing, the Gantt heading is used. The key does not copy. The key is ignored while typing. Distinct from unshifted `F11` last-weekday-FX-closed jump and `F8` last-weekend-FX-closed jump.
3. Press `Shift+F12` to jump to the existing hide-weekday-FX-closed Gantt filter (`hideWeekdayFxClosedGanttHours`), which keeps `F9` as well. If that control is missing, the Gantt heading is used. The key is ignored while typing. Distinct from 1.5.34 `Shift+F12` hide-weekday-FX-open. Unshifted `F12` and `ArrowLeft` still jump to hide-weekend-FX-open. `Backspace` still jumps to hide-weekend-FX-closed. Hide-weekday-FX-open stays.
4. Use the Saturday midday FX open (synthetic) preset. It keeps the same 72-hour calendar as Normal Friday and treats FX as weekday-depth / open on Saturday from 12:00 to 14:00 through `isSaturdayMiddayFxOpenHour`. It is distinct from Saturday early FX open, Saturday late FX open, Friday early FX open, Friday late FX open, Sunday early FX open, and Saturday early issuer, bank, and payout. It is synthetic, not an FX feed.
5. Unshifted `F10`, `F11` and `F12` stay last-weekday-FX-closed copy, last-weekday-FX-closed jump, and hide-weekend-FX-open jump. Last-weekend-FX-closed copy remains as a button with `F7`. Hide-weekend-FX-open remains as a control with unshifted `F12` and `ArrowLeft`. Hide-weekday-FX-open remains as a control. Shortcut handling returns immediately when the event is already handled.
6. Analysis JSON still has no timestamps. Hatched Gantt rows are a local drawing. They do not connect to a bank or a live redemption queue.
7. Timing review packets from 1.5.0 stay in place.

v1.5.36 Friday early FX open, first-weekend-FX-closed copy and weekday-FX-closed hide remain below.

## New in v1.5.36: Friday early FX open, first-weekend-FX-closed copy, and weekday-FX-closed hide

Friday early FX open, first-weekend-FX-closed copy, and weekday-FX-closed hide in Weekend Gap 1.5.36

1. Press `Shift+F10` to copy the first weekend-FX-closed hour through the existing first-weekend-FX-closed copy control, using one-line Markdown. Honest empty when none. The key is ignored while typing. Distinct from unshifted `F10` last-weekday-FX-closed copy, last-weekend-FX-open copy, last-weekend-FX-closed copy, first-weekend-FX-open copy, first-weekday-FX-closed copy, first-weekday-FX-open copy, last-weekday-FX-open copy, `F7` last-weekend-FX-closed copy and `Delete` last-closed-FX copy. Shift is handled before unshifted `F10`. First-weekend-FX-open copy remains as a button without `Shift+F10`.
2. Press `Shift+F11` to jump to the first-weekend-FX-closed-hour copy control. If that control is missing, the Gantt heading is used. The key does not copy. The key is ignored while typing. Distinct from unshifted `F11` last-weekday-FX-closed jump and `F8` last-weekend-FX-closed jump.
3. Press `Shift+F12` to jump to the existing hide-weekday-FX-closed Gantt filter (`hideWeekdayFxClosedGanttHours`), which keeps `F9` as well. If that control is missing, the Gantt heading is used. The key is ignored while typing. Distinct from 1.5.34 `Shift+F12` hide-weekday-FX-open. Unshifted `F12` and `ArrowLeft` still jump to hide-weekend-FX-open. `Backspace` still jumps to hide-weekend-FX-closed. Hide-weekday-FX-open stays.
4. Use the Friday early FX open (synthetic) preset. It keeps the same 72-hour calendar as Normal Friday and treats FX as weekday-depth / open on Friday from 08:00 to 10:00 through `isFridayEarlyFxOpenHour`. It is distinct from Thursday late FX open, Thursday early FX open, Friday late FX open, Wednesday late FX open, Wednesday early FX open, Tuesday late FX open, Tuesday early FX open, Monday late FX open, Monday early FX open, Sunday early FX open, and Saturday late FX open. It is synthetic, not an FX feed.
5. Unshifted `F10`, `F11` and `F12` stay last-weekday-FX-closed copy, last-weekday-FX-closed jump, and hide-weekend-FX-open jump. Last-weekend-FX-closed copy remains as a button with `F7`. Hide-weekend-FX-open remains as a control with unshifted `F12` and `ArrowLeft`. Hide-weekday-FX-open remains as a control. Shortcut handling returns immediately when the event is already handled.
6. Analysis JSON still has no timestamps. Hatched Gantt rows are a local drawing. They do not connect to a bank or a live redemption queue.
7. Timing review packets from 1.5.0 stay in place.

v1.5.35 Thursday late FX open, first-weekend-FX-open copy and weekday-FX-closed hide remain below.

## New in v1.5.35: Thursday late FX open, first-weekend-FX-open copy, and weekday-FX-closed hide

Thursday late FX open, first-weekend-FX-open copy, and weekday-FX-closed hide in Weekend Gap 1.5.35

1. Press `Shift+F10` to copy the first weekend-FX-open hour through the existing first-weekend-FX-open copy control, using one-line Markdown. Honest empty when none. The key is ignored while typing. Distinct from unshifted `F10` last-weekday-FX-closed copy, last-weekend-FX-open copy, last-weekend-FX-closed copy, first-weekend-FX-closed copy, first-weekday-FX-closed copy, first-weekday-FX-open copy, last-weekday-FX-open copy, `F7` last-weekend-FX-closed copy and `Delete` last-closed-FX copy. Shift is handled before unshifted `F10`. Last-weekend-FX-open copy remains as a button without `Shift+F10`.
2. Press `Shift+F11` to jump to the first-weekend-FX-open-hour copy control. If that control is missing, the Gantt heading is used. The key does not copy. The key is ignored while typing. Distinct from unshifted `F11` last-weekday-FX-closed jump and `F8` last-weekend-FX-closed jump.
3. Press `Shift+F12` to jump to the existing hide-weekday-FX-closed Gantt filter (`hideWeekdayFxClosedGanttHours`), which keeps `F9` as well. If that control is missing, the Gantt heading is used. The key is ignored while typing. Distinct from 1.5.34 `Shift+F12` hide-weekday-FX-open. Unshifted `F12` and `ArrowLeft` still jump to hide-weekend-FX-open. `Backspace` still jumps to hide-weekend-FX-closed. Hide-weekday-FX-open stays.
4. Use the Thursday late FX open (synthetic) preset. It keeps the same 72-hour calendar as Normal Friday and treats FX as weekday-depth / open on Thursday from 16:00 to 18:00 through `isThursdayLateFxOpenHour`. It is distinct from Thursday early FX open, Wednesday late FX open, Wednesday early FX open, Tuesday late FX open, Tuesday early FX open, Monday late FX open, Monday early FX open, Friday late FX open, Sunday early FX open, and Saturday late FX open. It is synthetic, not an FX feed.
5. Unshifted `F10`, `F11` and `F12` stay last-weekday-FX-closed copy, last-weekday-FX-closed jump, and hide-weekend-FX-open jump. Last-weekend-FX-closed copy remains as a button with `F7`. Hide-weekend-FX-open remains as a control with unshifted `F12` and `ArrowLeft`. Hide-weekday-FX-open remains as a control. Shortcut handling returns immediately when the event is already handled.
6. Analysis JSON still has no timestamps. Hatched Gantt rows are a local drawing. They do not connect to a bank or a live redemption queue.
7. Timing review packets from 1.5.0 stay in place.

v1.5.34 Thursday early FX open, last-weekend-FX-open copy and weekday-FX-open hide remain below.

## New in v1.5.34: Thursday early FX open, last-weekend-FX-open copy, and weekday-FX-open hide

Thursday early FX open, last-weekend-FX-open copy, and weekday-FX-open hide in Weekend Gap 1.5.34

1. Press `Shift+F10` to copy the last weekend-FX-open hour through the existing last-weekend-FX-open copy control, using one-line Markdown. Honest empty when none. The key is ignored while typing. Distinct from unshifted `F10` last-weekday-FX-closed copy, last-weekend-FX-closed copy, first-weekend-FX-closed copy, first-weekend-FX-open copy, first-weekday-FX-closed copy, first-weekday-FX-open copy, last-weekday-FX-open copy, `F7` last-weekend-FX-closed copy and `Delete` last-closed-FX copy. Shift is handled before unshifted `F10`. Last-weekend-FX-closed copy remains as a button without `Shift+F10` and keeps `F7`.
2. Press `Shift+F11` to jump to the last-weekend-FX-open-hour copy control. If that control is missing, the Gantt heading is used. The key does not copy. The key is ignored while typing. Distinct from unshifted `F11` last-weekday-FX-closed jump and `F8` last-weekend-FX-closed jump.
3. Press `Shift+F12` to jump to the existing hide-weekday-FX-open Gantt filter (`hideWeekdayFxOpenGanttHours`). If that control is missing, the Gantt heading is used. The key is ignored while typing. Distinct from 1.5.33 `Shift+F12` hide-weekend-FX-open. Unshifted `F12` and `ArrowLeft` still jump to hide-weekend-FX-open. `F9` still jumps to hide-weekday-FX-closed. `Backspace` still jumps to hide-weekend-FX-closed. Hide-weekend-FX-open stays.
4. Use the Thursday early FX open (synthetic) preset. It keeps the same 72-hour calendar as Normal Friday and treats FX as weekday-depth / open on Thursday from 08:00 to 10:00 through `isThursdayEarlyFxOpenHour`. It is distinct from Wednesday late FX open, Wednesday early FX open, Tuesday late FX open, Tuesday early FX open, Monday late FX open, Monday early FX open, Friday late FX open, Sunday early FX open, and Saturday late FX open. It is synthetic, not an FX feed.
5. Unshifted `F10`, `F11` and `F12` stay last-weekday-FX-closed copy, last-weekday-FX-closed jump, and hide-weekend-FX-open jump. Last-weekend-FX-closed copy remains as a button with `F7`. Hide-weekend-FX-open remains as a control with unshifted `F12` and `ArrowLeft`. Hide-weekday-FX-closed remains as a control with `F9`. Shortcut handling returns immediately when the event is already handled.
6. Analysis JSON still has no timestamps. Hatched Gantt rows are a local drawing. They do not connect to a bank or a live redemption queue.
7. Timing review packets from 1.5.0 stay in place.

v1.5.33 Wednesday late FX open, last-weekend-FX-closed copy and weekend-FX-open hide remain below.

## New in v1.5.33: Wednesday late FX open, last-weekend-FX-closed copy, and weekend-FX-open hide

Wednesday late FX open, last-weekend-FX-closed copy, and weekend-FX-open hide in Weekend Gap 1.5.33

1. Press `Shift+F10` to copy the last weekend-FX-closed hour through the existing last-weekend-FX-closed copy control, using one-line Markdown. Honest empty when none. The key is ignored while typing. Distinct from unshifted `F10` last-weekday-FX-closed copy, first-weekend-FX-closed copy, first-weekend-FX-open copy, first-weekday-FX-closed copy, first-weekday-FX-open copy, last-weekday-FX-open copy, last-weekend-FX-open copy, `F7` last-weekend-FX-closed copy and `Delete` last-closed-FX copy. Shift is handled before unshifted `F10`. First-weekend-FX-closed copy remains as a button without `Shift+F10`.
2. Press `Shift+F11` to jump to the last-weekend-FX-closed-hour copy control. If that control is missing, the Gantt heading is used. The key does not copy. The key is ignored while typing. Distinct from unshifted `F11` last-weekday-FX-closed jump and `F8` last-weekend-FX-closed jump.
3. Press `Shift+F12` to jump to the existing hide-weekend-FX-open Gantt filter (`hideWeekendFxOpenGanttHours`). If that control is missing, the Gantt heading is used. The key is ignored while typing. Distinct from 1.5.32 `Shift+F12` hide-weekday-FX-open. Unshifted `F12` and `ArrowLeft` still jump to hide-weekend-FX-open. `F9` still jumps to hide-weekday-FX-closed. `Backspace` still jumps to hide-weekend-FX-closed. Hide-weekday-FX-open stays.
4. Use the Wednesday late FX open (synthetic) preset. It keeps the same 72-hour calendar as Normal Friday and treats FX as weekday-depth / open on Wednesday from 16:00 to 18:00 through `isWednesdayLateFxOpenHour`. It is distinct from Wednesday early FX open, Tuesday late FX open, Tuesday early FX open, Monday late FX open, Monday early FX open, Friday late FX open, Sunday early FX open, and Saturday late FX open. It is synthetic, not an FX feed.
5. Unshifted `F10`, `F11` and `F12` stay last-weekday-FX-closed copy, last-weekday-FX-closed jump, and hide-weekend-FX-open jump. First-weekend-FX-closed copy remains as a button. Hide-weekday-FX-open remains as a control. Hide-weekday-FX-closed remains as a control with `F9`. Shortcut handling returns immediately when the event is already handled.
6. Analysis JSON still has no timestamps. Hatched Gantt rows are a local drawing. They do not connect to a bank or a live redemption queue.
7. Timing review packets from 1.5.0 stay in place.

v1.5.32 Wednesday early FX open, first-weekend-FX-closed copy and weekday-FX-open hide remain below.

## New in v1.5.32: Wednesday early FX open, first-weekend-FX-closed copy, and weekday-FX-open hide

Wednesday early FX open, first-weekend-FX-closed copy, and weekday-FX-open hide in Weekend Gap 1.5.32

1. Press `Shift+F10` to copy the first weekend-FX-closed hour through the new first-weekend-FX-closed copy control, using one-line Markdown. Honest empty when none. The key is ignored while typing. Distinct from unshifted `F10` last-weekday-FX-closed copy, first-weekend-FX-open copy, first-weekday-FX-closed copy, first-weekday-FX-open copy, last-weekday-FX-open copy, last-weekend-FX-open copy, `F7` last-weekend-FX-closed copy and `Delete` last-closed-FX copy. Shift is handled before unshifted `F10`. First-weekend-FX-open copy remains as a button without `Shift+F10`.
2. Press `Shift+F11` to jump to the first-weekend-FX-closed-hour copy control. If that control is missing, the Gantt heading is used. The key does not copy. The key is ignored while typing. Distinct from unshifted `F11` last-weekday-FX-closed jump and `F8` last-weekend-FX-closed jump.
3. Press `Shift+F12` to jump to the existing hide-weekday-FX-open Gantt filter (`hideWeekdayFxOpenGanttHours`). If that control is missing, the Gantt heading is used. The key is ignored while typing. Distinct from unshifted `F12` hide-weekend-FX-open and from 1.5.31 `Shift+F12` hide-weekday-FX-closed. `F9` still jumps to hide-weekday-FX-closed. `Backspace` still jumps to hide-weekend-FX-closed. Hide-weekday-FX-closed stays.
4. Use the Wednesday early FX open (synthetic) preset. It keeps the same 72-hour calendar as Normal Friday and treats FX as weekday-depth / open on Wednesday from 08:00 to 10:00 through `isWednesdayEarlyFxOpenHour`. It is distinct from Tuesday late FX open, Tuesday early FX open, Monday late FX open, Monday early FX open, Friday late FX open, Sunday early FX open, and Saturday late FX open. It is synthetic, not an FX feed.
5. Unshifted `F10`, `F11` and `F12` stay last-weekday-FX-closed copy, last-weekday-FX-closed jump, and hide-weekend-FX-open jump. First-weekend-FX-open copy remains as a button. Hide-weekday-FX-closed remains as a control with `F9`. Shortcut handling returns immediately when the event is already handled.
6. Analysis JSON still has no timestamps. Hatched Gantt rows are a local drawing. They do not connect to a bank or a live redemption queue.
7. Timing review packets from 1.5.0 stay in place.

v1.5.31 Tuesday late FX open, first-weekend-FX-open copy and weekday-FX-closed hide remain below.

## New in v1.5.31: Tuesday late FX open, first-weekend-FX-open copy, and weekday-FX-closed hide

Tuesday late FX open, first-weekend-FX-open copy, and weekday-FX-closed hide in Weekend Gap 1.5.31

1. Press `Shift+F10` to copy the first weekend-FX-open hour through the new first-weekend-FX-open copy control, using one-line Markdown. Honest empty when none. The key is ignored while typing. Distinct from unshifted `F10` last-weekday-FX-closed copy, first-weekday-FX-closed copy, first-weekday-FX-open copy, last-weekday-FX-open copy, last-weekend-FX-open copy, `F7` last-weekend-FX-closed copy and `Delete` last-closed-FX copy. Shift is handled before unshifted `F10`. First-weekday-FX-closed copy remains as a button without `Shift+F10`.
2. Press `Shift+F11` to jump to the first-weekend-FX-open-hour copy control. If that control is missing, the Gantt heading is used. The key does not copy. The key is ignored while typing. Distinct from unshifted `F11` last-weekday-FX-closed jump and `F8` last-weekend-FX-closed jump.
3. Press `Shift+F12` to jump to the existing hide-weekday-FX-closed Gantt filter (`hideWeekdayFxClosedGanttHours`). If that control is missing, the Gantt heading is used. The key is ignored while typing. Distinct from unshifted `F12` hide-weekend-FX-open and from 1.5.30 `Shift+F12` hide-weekday-FX-open. `F9` still jumps to hide-weekday-FX-closed. `Backspace` still jumps to hide-weekend-FX-closed. Hide-weekday-FX-open stays.
4. Use the Tuesday late FX open (synthetic) preset. It keeps the same 72-hour calendar as Normal Friday and treats FX as weekday-depth / open on Tuesday from 16:00 to 18:00 through `isTuesdayLateFxOpenHour`. It is distinct from Tuesday early FX open, Monday late FX open, Monday early FX open, Friday late FX open, Sunday early FX open, and Saturday late FX open. It is synthetic, not an FX feed.
5. Unshifted `F10`, `F11` and `F12` stay last-weekday-FX-closed copy, last-weekday-FX-closed jump, and hide-weekend-FX-open jump. First-weekday-FX-closed copy remains as a button. Hide-weekday-FX-open remains as a control. Shortcut handling returns immediately when the event is already handled.
6. Analysis JSON still has no timestamps. Hatched Gantt rows are a local drawing. They do not connect to a bank or a live redemption queue.
7. Timing review packets from 1.5.0 stay in place.

v1.5.30 Tuesday early FX open, first-weekday-FX-closed copy and weekday-FX-open hide remain below.

## New in v1.5.30: Tuesday early FX open, first-weekday-FX-closed copy, and weekday-FX-open hide

Tuesday early FX open, first-weekday-FX-closed copy, and weekday-FX-open hide in Weekend Gap 1.5.30

1. Press `Shift+F10` to copy the first weekday-FX-closed hour through the new first-weekday-FX-closed copy control, using one-line Markdown. Honest empty when none. The key is ignored while typing. Distinct from unshifted `F10` last-weekday-FX-closed copy, first-weekday-FX-open copy, last-weekday-FX-open copy, last-weekend-FX-open copy, `F7` last-weekend-FX-closed copy and `Delete` last-closed-FX copy. Shift is handled before unshifted `F10`.
2. Press `Shift+F11` to jump to the first-weekday-FX-closed-hour copy control. If that control is missing, the Gantt heading is used. The key does not copy. The key is ignored while typing. Distinct from unshifted `F11` last-weekday-FX-closed jump and `F8` last-weekend-FX-closed jump. First-weekday-FX-open copy remains as a button.
3. Press `Shift+F12` to jump to the existing hide-weekday-FX-open Gantt filter (`hideWeekdayFxOpenGanttHours`). If that control is missing, the Gantt heading is used. The key is ignored while typing. Distinct from unshifted `F12` hide-weekend-FX-open and from hide-weekday-FX-closed jump. `F9` still jumps to hide-weekday-FX-closed. `Backspace` still jumps to hide-weekend-FX-closed.
4. Use the Tuesday early FX open (synthetic) preset. It keeps the same 72-hour calendar as Normal Friday and treats FX as weekday-depth / open on Tuesday from 08:00 to 10:00 through `isTuesdayEarlyFxOpenHour`. It is distinct from Monday early FX open, Monday late FX open, Friday late FX open, Sunday early FX open, and Saturday late FX open. It is synthetic, not an FX feed.
5. Unshifted `F10`, `F11` and `F12` stay last-weekday-FX-closed copy, last-weekday-FX-closed jump, and hide-weekend-FX-open jump. First-weekday-FX-open copy remains as a button. Hide-weekday-FX-closed remains as a control with `F9`. Shortcut handling returns immediately when the event is already handled.
6. Analysis JSON still has no timestamps. Hatched Gantt rows are a local drawing. They do not connect to a bank or a live redemption queue.
7. Timing review packets from 1.5.0 stay in place.

v1.5.29 Monday late FX open, first-weekday-FX-open copy and weekday-FX-closed hide remain below.

## New in v1.5.29: Monday late FX open, first-weekday-FX-open copy, and weekday-FX-closed hide

Monday late FX open, first-weekday-FX-open copy, and weekday-FX-closed hide in Weekend Gap 1.5.29

1. Press `Shift+F10` to copy the first weekday-FX-open hour through the new first-weekday-FX-open copy control, using one-line Markdown. Honest empty when none. The key is ignored while typing. Distinct from unshifted `F10` last-weekday-FX-closed copy, last-weekday-FX-open copy, last-weekend-FX-open copy, `F7` last-weekend-FX-closed copy and `Delete` last-closed-FX copy. Shift is handled before unshifted `F10`.
2. Press `Shift+F11` to jump to the first-weekday-FX-open-hour copy control. If that control is missing, the Gantt heading is used. The key does not copy. The key is ignored while typing. Distinct from unshifted `F11` last-weekday-FX-closed jump and `F8` last-weekend-FX-closed jump.
3. Press `Shift+F12` to jump to the existing hide-weekday-FX-closed Gantt filter (`hideWeekdayFxClosedGanttHours`). If that control is missing, the Gantt heading is used. The key is ignored while typing. Distinct from unshifted `F12` hide-weekend-FX-open and from hide-weekend-FX-closed jump. `F9` still jumps to the same weekday-FX-closed filter. `Backspace` still jumps to hide-weekend-FX-closed.
4. Use the Monday late FX open (synthetic) preset. It keeps the same 72-hour calendar as Normal Friday and treats FX as weekday-depth / open on Monday from 16:00 to 18:00 through `isMondayLateFxOpenHour`. That window is a real weekday-FX-open case, including when a Monday public holiday would otherwise thin FX. It is distinct from Monday early FX open, Friday late FX open, Saturday late FX open, and Sunday early FX open. It is synthetic, not an FX feed.
5. Unshifted `F10`, `F11` and `F12` stay last-weekday-FX-closed copy, last-weekday-FX-closed jump, and hide-weekend-FX-open jump. Last-weekday-FX-open copy remains as a button. Hide-weekend-FX-closed remains as a control. Shortcut handling returns immediately when the event is already handled.
6. Analysis JSON still has no timestamps. Hatched Gantt rows are a local drawing. They do not connect to a bank or a live redemption queue.
7. Timing review packets from 1.5.0 stay in place.

v1.5.28 Monday early FX open, last-weekday-FX-open copy and weekend-FX-closed hide remain below.

## New in v1.5.28: Monday early FX open, last-weekday-FX-open copy, and weekend-FX-closed hide

Monday early FX open, last-weekday-FX-open copy, and weekend-FX-closed hide in Weekend Gap 1.5.28

1. Press `Shift+F10` to copy the last weekday-FX-open hour through the new last-weekday-FX-open copy control, using one-line Markdown. Honest empty when none. The key is ignored while typing. Distinct from unshifted `F10` last-weekday-FX-closed copy, last-weekend-FX-open copy, `F7` last-weekend-FX-closed copy and `Delete` last-closed-FX copy. Shift is handled before unshifted `F10`.
2. Press `Shift+F11` to jump to the last-weekday-FX-open-hour copy control. If that control is missing, the Gantt heading is used. The key does not copy. The key is ignored while typing. Distinct from unshifted `F11` last-weekday-FX-closed jump and `F8` last-weekend-FX-closed jump.
3. Press `Shift+F12` to jump to the existing hide-weekend-FX-closed Gantt filter (`hideWeekendFxClosedGanttHours`). If that control is missing, the Gantt heading is used. The key is ignored while typing. Distinct from unshifted `F12` hide-weekend-FX-open and from hide-weekday-FX-open jump. `Backspace` still jumps to the same weekend-FX-closed filter.
4. Use the Monday early FX open (synthetic) preset. It keeps the same 72-hour calendar as Normal Friday and treats FX as weekday-depth / open on Monday from 08:00 to 10:00 through `isMondayEarlyFxOpenHour`. That window is a real weekday-FX-open case, including when a Monday public holiday would otherwise thin FX. It is distinct from Sunday early FX open, Friday late FX open, Saturday late FX open, Sunday late FX open, and Early Monday bank open. It is synthetic, not an FX feed.
5. Unshifted `F10`, `F11` and `F12` stay last-weekday-FX-closed copy, last-weekday-FX-closed jump, and hide-weekend-FX-open jump. Last-weekend-FX-open copy remains as a button. Shortcut handling returns immediately when the event is already handled.
6. Analysis JSON still has no timestamps. Hatched Gantt rows are a local drawing. They do not connect to a bank or a live redemption queue.
7. Timing review packets from 1.5.0 stay in place.

v1.5.27 Sunday early FX open, last-weekend-FX-open copy and weekday-FX-open hide remain below.

## New in v1.5.27: Sunday early FX open, last-weekend-FX-open copy and weekday-FX-open hide

1. Press `Shift+F10` to copy the last weekend-FX-open hour through the new last-weekend-FX-open copy control, using one-line Markdown. Honest empty when none. The key is ignored while typing. Distinct from unshifted `F10` last-weekday-FX-closed copy, `F7` last-weekend-FX-closed copy and `Delete` last-closed-FX copy. Shift is handled before unshifted `F10`.
2. Press `Shift+F11` to jump to the last-weekend-FX-open-hour copy control. If that control is missing, the Gantt heading is used. The key does not copy. The key is ignored while typing. Distinct from unshifted `F11` last-weekday-FX-closed jump and `F8` last-weekend-FX-closed jump.
3. Press `Shift+F12` to jump to the hide-weekday-FX-open Gantt filter. If that control is missing, the Gantt heading is used. The key is ignored while typing. Distinct from unshifted `F12` hide-weekend-FX-open and `F9` hide-weekday-FX-closed.
4. Use the Sunday early FX open (synthetic) preset. It keeps the same 72-hour calendar as Normal Friday and treats FX as weekday-depth / open on Sunday from 08:00 to 10:00 even though Sunday is not a business day. That window is ORed into FX open / weekday FX depth through `isSundayEarlyFxOpenHour`. It is distinct from Sunday late FX open, Saturday late FX open, Friday late FX open, Sunday early payout open, and Sunday early issuer open. It is synthetic, not an FX feed.
5. Hide Gantt hours that are weekday and FX-open. Display only. The model still contains 72 hours. Workspace JSON stores the optional boolean `hideWeekdayFxOpenGanttHours`. Older files restore all hours. Unknown keys are rejected. Distinct from hide-weekend-FX-open, hide-FX-open, and hide-weekday-FX-closed. The selected hour stays visible if it would otherwise hide. On the default Saturday calendar weekday FX stays weekday-depth, so hide-weekday-FX-open hides Friday and Monday FX-open hours. Hide-weekend-FX-open still hides Saturday and Sunday weekday-depth hours such as Sunday early FX open.
6. Unshifted `F10`, `F11` and `F12` stay last-weekday-FX-closed copy, last-weekday-FX-closed jump, and hide-weekend-FX-open jump. Shortcut handling returns immediately when the event is already handled.
7. Analysis JSON still has no timestamps. Hatched Gantt cells remain a local drawing. They do not connect to a bank or a live redemption queue.
8. Timing review packets from 1.5.0 stay in place.

v1.5.26 Sunday late FX open, last-weekday-FX-closed copy and weekend-FX-open hide remain below.

## New in v1.5.26: Sunday late FX open, last-weekday-FX-closed copy and weekend-FX-open hide

1. Press `F10` to copy the last weekday-FX-closed hour through the last-weekday-FX-closed copy control, using one-line Markdown. Honest empty when none. The key is ignored while typing. Distinct from `F7` last-weekend-FX-closed copy, `Delete` last-closed-FX copy and `F3` last-closed-payout copy.
2. Press `F11` to jump to the last-weekday-FX-closed-hour copy control. If that control is missing, the Gantt heading is used. The key does not copy. The key is ignored while typing. Distinct from `F8` last-weekend-FX-closed jump and `F2` last-closed-FX jump.
3. Press `F12` to jump to the existing hide-weekend-FX-open Gantt filter. If that control is missing, the Gantt heading is used. The key is ignored while typing. Distinct from `F9` hide-weekday-FX-closed. Workspace JSON still stores optional `hideWeekendFxOpenGanttHours`.
4. Use the Sunday late FX open (synthetic) preset. It keeps the same 72-hour calendar as Normal Friday and treats FX as weekday-depth / open on Sunday from 16:00 to 18:00 even though Sunday is not a business day. That window is ORed into FX open / weekday FX depth through `isSundayLateFxOpenHour`. It is distinct from Saturday late FX open, Friday late FX open, Saturday late bank open, Saturday late payout open, Sunday late issuer close, Sunday late payout close, and Sunday late bank close. It is synthetic, not an FX feed.
5. `F7`, `F8` and `F9` stay last-weekend-FX-closed copy, last-weekend-FX-closed jump, and hide-weekday-FX-closed jump. Shortcut handling returns immediately when the event is already handled.
6. Analysis JSON still has no timestamps. Hatched Gantt cells remain a local drawing. They do not connect to a bank or a live redemption queue.
7. Timing review packets from 1.5.0 stay in place.

v1.5.25 Saturday late FX open, last-weekend-FX-closed copy and weekday-FX-closed Gantt hide remain below.

## New in v1.5.25: Saturday late FX open, last-weekend-FX-closed copy and weekday-FX-closed Gantt hide

1. Press `F7` to copy the last weekend-FX-closed hour through the last-weekend-FX-closed copy control, using one-line Markdown. Honest empty when none. The key is ignored while typing. Distinct from `F3` last-closed-payout copy and `Delete` last-closed-FX copy.
2. Press `F8` to jump to the last-weekend-FX-closed-hour copy control. If that control is missing, the Gantt heading is used. The key does not copy. The key is ignored while typing. Distinct from `F4` last-closed-payout jump and `F2` last-closed-FX jump.
3. Press `F9` to jump to the hide-weekday-FX-closed Gantt filter. If that control is missing, the Gantt heading is used. The key is ignored while typing. Distinct from `Backspace` hide-weekend-FX-closed.
4. Use the Saturday late FX open (synthetic) preset. It keeps the same 72-hour calendar as Normal Friday and treats FX as weekday-depth / open on Saturday from 16:00 to 18:00 even though Saturday is not a business day. That window is ORed into FX open / weekday FX depth through `isSaturdayLateFxOpenHour`. It is distinct from Saturday late bank open, Saturday late payout open, Saturday early FX open, and Friday late FX open. It is synthetic, not an FX feed.
5. Hide Gantt hours that are weekday and FX-closed. Display only. The model still contains 72 hours. Workspace JSON stores the optional boolean `hideWeekdayFxClosedGanttHours`. Older files restore all hours. Unknown keys are rejected. Distinct from hide-FX-closed, hide-weekend-FX-closed, and hide-weekend-FX-open filters. The selected hour stays visible if it would otherwise hide. On the default Saturday calendar weekday FX stays weekday-depth, so hide-weekday-FX-closed matches the full drawing unless a weekday FX-closed hour exists, such as a public-holiday Monday. Hide-weekend-FX-closed still hides Saturday and Sunday thinned hours. Hide-FX-closed also hides those weekday closed hours.
6. Analysis JSON still has no timestamps. Hatched Gantt cells remain a local drawing. They do not connect to a bank or a live redemption queue.
7. Timing review packets from 1.5.0 stay in place.

v1.5.24 Friday late FX open, last-closed-payout copy and weekend-FX-closed Gantt hide remain below.

## New in v1.5.24: Friday late FX open, last-closed-payout copy and weekend-FX-closed Gantt hide

1. Press `F3` to copy the last closed payout hour through the last-closed-payout copy control, using one-line Markdown. Honest empty when none. The key is ignored while typing. Distinct from `Delete` last-closed-FX copy, `PageUp` last-open-payout copy and `"` first-closed-payout copy.
2. Press `F4` to jump to the last-closed-payout-hour copy control. If that control is missing, the Gantt heading is used. The key does not copy. The key is ignored while typing. Distinct from `F2` last-closed-FX jump and `PageDown` last-open-payout jump.
3. Press `Backspace` to jump to the hide-weekend-FX-closed Gantt filter. If that control is missing, the Gantt heading is used. The key is ignored while typing. Distinct from `ArrowRight` hide-weekend-payout-closed and `ArrowLeft` hide-weekend-FX-open.
4. Use the Friday late FX open (synthetic) preset. It keeps the same 72-hour calendar as Normal Friday and treats FX as weekday-depth / open on Friday from 16:00 to 18:00. That window is ORed into FX open / weekday FX depth. It is distinct from Friday late bank open, Friday late FX close (Saturday 00:00 delayed Friday FX close), Saturday late bank open, Saturday early bank open, and Saturday early FX open. It is synthetic, not an FX feed.
5. Hide Gantt hours that are weekend and FX-closed. Display only. The model still contains 72 hours. Workspace JSON stores the optional boolean `hideWeekendFxClosedGanttHours`. Older files restore all hours. Unknown keys are rejected. Distinct from hide-FX-closed, hide-weekend-FX-open, hide-weekend-payout-closed, and hide-weekend filters. The selected hour stays visible if it would otherwise hide. On the default Saturday calendar FX is weekend-thinned, so hide-weekend-FX-closed matches hide-weekend. Saturday early FX open keeps Saturday 06:00 to 12:00 visible under hide-weekend-FX-closed and hides those hours under hide-weekend-FX-open, unlike hide-FX-closed which also hides weekday closed hours such as a public-holiday Monday.
6. Analysis JSON still has no timestamps. Hatched Gantt cells remain a local drawing. They do not connect to a bank or a live redemption queue.
7. Timing review packets from 1.5.0 stay in place.

v1.5.23 Friday late bank open, last-closed-FX copy and weekend-payout-closed Gantt hide remain below.

## New in v1.5.23: Friday late bank open, last-closed-FX copy and weekend-payout-closed Gantt hide

1. Press `Delete` to copy the last closed FX hour through the last-closed-FX copy control, using one-line Markdown. Honest empty when none. The key is ignored while typing. Distinct from `Insert` last-open-FX copy, `PageUp` last-open-payout copy and `}` first-closed-FX copy.
2. Press `F2` to jump to the last-closed-FX-hour copy control. If that control is missing, the Gantt heading is used. The key does not copy. The key is ignored while typing. Distinct from `ArrowDown` last-open-FX jump and `PageDown` last-open-payout jump.
3. Press `ArrowRight` to jump to the hide-weekend-payout-closed Gantt filter. If that control is missing, the Gantt heading is used. The key is ignored while typing. Distinct from `ArrowLeft` hide-weekend-FX-open and `ArrowUp` hide-weekend-payout-open.
4. Use the Friday late bank open (synthetic) preset. It keeps the same 72-hour calendar as Normal Friday and treats the bank gate as open on Friday from 16:00 to 18:00 even when the ordinary bank window ends earlier. The workshop clock starts Friday 15:00, so that Friday evening window is inside the modeled start. It is distinct from Friday early bank open, Saturday late bank open, Saturday early bank open, and Friday early issuer open. It is synthetic, not a bank feed.
5. Hide Gantt hours that are weekend and payout-closed. Display only. The model still contains 72 hours. Workspace JSON stores the optional boolean `hideWeekendPayoutClosedGanttHours`. Older files restore all hours. Unknown keys are rejected. Distinct from hide-weekend-FX-open, hide-weekend-payout-open, hide-payout-closed, and hide-weekend filters. The selected hour stays visible if it would otherwise hide. On the default Saturday calendar the payout gate is closed all weekend, so hide-weekend-payout-closed matches hide-weekend. Saturday early payout open keeps Saturday 07:00 to 09:00 visible under hide-weekend-payout-closed and hides those hours under hide-weekend-payout-open, unlike hide-payout-closed which also hides weekday closed hours.
6. Analysis JSON still has no timestamps. Hatched Gantt cells remain a local drawing. They do not connect to a bank or a live redemption queue.
7. Timing review packets from 1.5.0 stay in place.

v1.5.22 Saturday late bank open, last-open-FX copy and weekend-FX-open Gantt hide remain below.

## New in v1.5.22: Saturday late bank open, last-open-FX copy and weekend-FX-open Gantt hide

1. Press `Insert` to copy the last open FX hour through the last-open-FX copy control, using one-line Markdown. Honest empty when none. The key is ignored while typing. Distinct from `4` last-open-bank copy, `PageUp` last-open-payout copy and `(` first-open-FX copy.
2. Press `ArrowDown` to jump to the last-open-FX-hour copy control. If that control is missing, the Gantt heading is used. The key does not copy. The key is ignored while typing. Distinct from `PageDown` last-open-payout jump and `Home` last-open-bank jump.
3. Press `ArrowLeft` to jump to the hide-weekend-FX-open Gantt filter. If that control is missing, the Gantt heading is used. The key is ignored while typing. Distinct from `ArrowUp` hide-weekend-payout-open and `End` hide-weekend-bank-open.
4. Use the Saturday late bank open (synthetic) preset. It keeps the same 72-hour calendar as Normal Friday and treats the bank gate as open on Saturday from 16:00 to 18:00 even though Saturday is not a business day. The workshop clock starts Friday 15:00, so that Saturday evening window is inside the modeled start. It is distinct from Saturday early bank open, Friday early bank open, and Friday early issuer open. It is synthetic, not a bank feed.
5. Hide Gantt hours that are weekend and FX-open. Display only. The model still contains 72 hours. Workspace JSON stores the optional boolean `hideWeekendFxOpenGanttHours`. Older files restore all hours. Unknown keys are rejected. Distinct from hide-weekend-payout-open, hide-FX-open, hide-weekend, and hide-weekend-bank-open filters. The selected hour stays visible if it would otherwise hide. On the default Saturday calendar FX is weekend-thinned, so hide-weekend-FX-open matches the full drawing unless a weekend FX-open preset is used. Saturday early FX open keeps Saturday 06:00 to 12:00 visible under hide-FX-closed and hides those hours under hide-weekend-FX-open, unlike hide-weekend or hide-FX-open. Saturday early bank open stays visible under hide-weekend-FX-open.
6. Analysis JSON still has no timestamps. Hatched Gantt cells remain a local drawing. They do not connect to a bank or a live redemption queue.
7. Timing review packets from 1.5.0 stay in place.

v1.5.21 Friday early bank open, last-open-payout copy and weekend-payout-open Gantt hide remain below.

## New in v1.5.21: Friday early bank open, last-open-payout copy and weekend-payout-open Gantt hide

1. Press `PageUp` to copy the last open payout hour through the last-open-payout copy control, using one-line Markdown. Honest empty when none. The key is ignored while typing. Distinct from `4` last-open-bank copy, `5` last-open-issuer copy and `~` first-open-payout copy.
2. Press `PageDown` to jump to the last-open-payout-hour copy control. If that control is missing, the Gantt heading is used. The key does not copy. The key is ignored while typing. Distinct from `Home` last-open-bank jump.
3. Press `ArrowUp` to jump to the hide-weekend-payout-open Gantt filter. If that control is missing, the Gantt heading is used. The key is ignored while typing. Distinct from `End` hide-weekend-bank-open.
4. Use the Friday early bank open (synthetic) preset. It keeps the same 72-hour calendar as Normal Friday and treats the bank gate as open on Friday from 08:00 to 10:00 even when the ordinary bank window starts later. The workshop clock starts Friday 15:00, so that morning window is before the modeled start. It is distinct from Saturday early bank open, Friday early issuer open, Saturday early issuer open, Sunday late bank close, and Early Monday bank open. It is synthetic, not a bank feed.
5. Hide Gantt hours that are weekend and payout-open. Display only. The model still contains 72 hours. Workspace JSON stores the optional boolean `hideWeekendPayoutOpenGanttHours`. Older files restore all hours. Unknown keys are rejected. Distinct from hide-weekend-bank-open, hide-payout-open, hide-weekend, and hide-weekend-issuer-open filters. The selected hour stays visible if it would otherwise hide. On the default Saturday calendar the payout gate is closed all weekend, so hide-weekend-payout-open matches the full drawing unless a payout-open weekend preset is used. Saturday early payout open keeps Saturday 07:00 to 09:00 visible under hide-payout-closed and hides those hours under hide-weekend-payout-open, unlike hide-weekend.
6. Analysis JSON still has no timestamps. Hatched Gantt cells remain a local drawing. They do not connect to a bank or a live redemption queue.
7. Timing review packets from 1.5.0 stay in place.

v1.5.20 Saturday early bank open, last-open-bank copy and weekend-bank-open Gantt hide remain below.

## New in v1.5.20: Saturday early bank open, last-open-bank copy and weekend-bank-open Gantt hide

1. Press `4` to copy the last open bank hour through the last-open-bank copy control, using one-line Markdown. Honest empty when none. The key is ignored while typing. Distinct from `1` last-closed-bank copy and `5` last-open-issuer copy.
2. Press `Home` to jump to the last-open-bank-hour copy control. If that control is missing, the Gantt heading is used. The key does not copy. The key is ignored while typing. Distinct from `2` last-closed-bank jump.
3. Press `End` to jump to the hide-weekend-bank-open Gantt filter. If that control is missing, the Gantt heading is used. The key is ignored while typing. Distinct from `3` hide-weekend-bank-closed and `0` hide-weekend-issuer-closed.
4. Use the Saturday early bank open (synthetic) preset. It keeps the same 72-hour calendar as Normal Friday and treats the bank gate as open on Saturday from 08:00 to 10:00 even though Saturday is not a business day. The workshop clock starts Friday 15:00, so that Saturday morning window is inside the modeled start. It is distinct from Friday early issuer open, Saturday early issuer open, Sunday late bank close, and Early Monday bank open. It is synthetic, not a bank feed.
5. Hide Gantt hours that are weekend and bank-open. Display only. The model still contains 72 hours. Workspace JSON stores the optional boolean `hideWeekendBankOpenGanttHours`. Older files restore all hours. Unknown keys are rejected. Distinct from hide-weekend-bank-closed, hide-weekend-issuer-open, hide-bank-open, and hide-weekend filters. The selected hour stays visible if it would otherwise hide. On the default Saturday calendar the bank is closed all weekend, so hide-weekend-bank-open matches the full drawing; Saturday early bank open keeps Saturday 08:00 to 10:00 visible under hide-weekend-bank-closed and hides those hours under hide-weekend-bank-open, unlike hide-weekend. Saturday early issuer open stays visible under hide-weekend-bank-open.
6. Analysis JSON still has no timestamps. Hatched Gantt cells remain a local drawing. They do not connect to a bank or a live redemption queue.
7. Timing review packets from 1.5.0 stay in place.

v1.5.19 Friday early issuer open, last-closed-bank copy and weekend-bank-closed Gantt hide remain below.

## New in v1.5.19: Friday early issuer open, last-closed-bank copy and weekend-bank-closed Gantt hide

1. Press `1` to copy the last closed bank hour through the last-closed-bank copy control, using one-line Markdown. Honest empty when none. The key is ignored while typing. Distinct from `8` last-closed-issuer copy.
2. Press `2` to jump to the last-closed-bank-hour copy control. If that control is missing, the Gantt heading is used. The key does not copy. The key is ignored while typing. Distinct from `9` last-closed-issuer jump.
3. Press `3` to jump to the hide-weekend-bank-closed Gantt filter. If that control is missing, the Gantt heading is used. The key is ignored while typing. Distinct from `0` hide-weekend-issuer-closed.
4. Use the Friday early issuer open (synthetic) preset. It keeps the same 72-hour calendar as Normal Friday and treats the issuer gate as open on Friday from 08:00 to 10:00 even when the ordinary issuer window starts later. The workshop clock starts Friday 15:00, so that morning window is before the modeled start. It is distinct from Saturday early issuer open, Sunday early issuer open, Sunday late issuer close, and Friday early payout open. It is synthetic, not a bank feed.
5. Hide Gantt hours that are weekend and bank-closed. Display only. The model still contains 72 hours. Workspace JSON stores the optional boolean `hideWeekendBankClosedGanttHours`. Older files restore all hours. Unknown keys are rejected. Distinct from hide-weekend-issuer-closed, hide-bank-closed, and hide-weekend filters. The selected hour stays visible if it would otherwise hide.
6. Analysis JSON still has no timestamps. Hatched Gantt cells remain a local drawing. They do not connect to a bank or a live redemption queue.
7. Timing review packets from 1.5.0 stay in place.

v1.5.18 Saturday early issuer open, last-closed-issuer copy and weekend-issuer-closed Gantt hide remain below.

## New in v1.5.18: Saturday early issuer open, last-closed-issuer copy and weekend-issuer-closed Gantt hide

1. Press `8` to copy the last closed issuer hour through the last-closed-issuer copy control, using one-line Markdown. Honest empty when none. The key is ignored while typing. Distinct from `5` last-open-issuer copy and `$` first-open-issuer copy.
2. Press `9` to jump to the last-closed-issuer-hour copy control. If that control is missing, the Gantt heading is used. The key does not copy. The key is ignored while typing. Distinct from `6` last-open-issuer jump.
3. Press `0` to jump to the hide-weekend-issuer-closed Gantt filter. If that control is missing, the Gantt heading is used. The key is ignored while typing. Distinct from `7` hide-weekend-issuer-open and backtick hide-issuer-open.
4. Use the Saturday early issuer open (synthetic) preset. It keeps the same 72-hour calendar as Normal Friday and treats the issuer gate as open on Saturday from 08:00 to 10:00. It is distinct from Sunday early issuer open, Sunday late issuer close, Sunday early payout open, Sunday late payout close, Sunday late bank close, Saturday late payout open, Friday early payout open, Saturday early payout open, Saturday early FX open, Friday late FX close, Monday late issuer open, Early Monday bank open, Thin Saturday FX, Payday Friday burst, Public-holiday Monday, Saturday market burst, Sunday stall close, Long-weekend Friday start, and Compressed Friday close. It is synthetic, not a bank feed.
5. Hide Gantt hours that are weekend and issuer-closed. Display only. The model still contains 72 hours. Workspace JSON stores the optional boolean `hideWeekendIssuerClosedGanttHours`. Older files restore all hours. Unknown keys are rejected. Distinct from hide-weekend-issuer-open, hide-issuer-closed, hide-weekend, and hide-open filters. The selected hour stays visible if it would otherwise hide.
6. Analysis JSON still has no timestamps. Hatched Gantt cells remain a local drawing. They do not connect to a bank or a live redemption queue.
7. Timing review packets from 1.5.0 stay in place.

v1.5.17 Sunday early issuer open, last-open-issuer copy and weekend-issuer-open Gantt hide remain below.

## New in v1.5.17: Sunday early issuer open, last-open-issuer copy and weekend-issuer-open Gantt hide

1. Press `5` to copy the last open issuer hour through the last-open-issuer copy control, using one-line Markdown. Honest empty when none. The key is ignored while typing. Distinct from `$` first-open-issuer copy.
2. Press `6` to jump to the last-open-issuer-hour copy control. If that control is missing, the Gantt heading is used. The key does not copy. The key is ignored while typing. Distinct from `^` first-open-issuer jump.
3. Press `7` to jump to the hide-weekend-issuer-open Gantt filter. If that control is missing, the Gantt heading is used. The key is ignored while typing. Distinct from backtick hide-issuer-open.
4. Use the Sunday early issuer open (synthetic) preset. It keeps the same 72-hour calendar as Normal Friday and treats the issuer gate as open on Sunday from 08:00 to 10:00. It is distinct from Sunday late issuer close, Sunday early payout open, Sunday late payout close, Sunday late bank close, Saturday late payout open, Friday early payout open, Saturday early payout open, Saturday early FX open, Friday late FX close, Monday late issuer open, Early Monday bank open, Thin Saturday FX, Payday Friday burst, Public-holiday Monday, Saturday market burst, Sunday stall close, Long-weekend Friday start, and Compressed Friday close. It is synthetic, not a bank feed.
5. Hide Gantt hours that are weekend and issuer-open. Display only. The model still contains 72 hours. Workspace JSON stores the optional boolean `hideWeekendIssuerOpenGanttHours`. Older files restore all hours. Unknown keys are rejected. Distinct from hide-issuer-open and hide-weekend filters. The selected hour stays visible if it would otherwise hide.
6. Analysis JSON still has no timestamps. Hatched Gantt cells remain a local drawing.
7. Timing review packets from 1.5.0 stay in place.

v1.5.16 Sunday late issuer close, issuer-open copy and issuer-open Gantt hide remain below.

## New in v1.5.16: Sunday late issuer close, issuer-open copy and issuer-open Gantt hide

1. Press `$` to copy the first open issuer hour through the existing copy control, using the same Markdown. The key is ignored while typing. Distinct from `*` first-open-bank copy.
2. Press `^` to jump to the first-open-issuer-hour copy control. If that control is missing, the Gantt heading is used. The key does not copy. The key is ignored while typing. Distinct from `&` first-open-bank jump.
3. Press backtick to jump to the hide-issuer-open Gantt filter. If that control is missing, the Gantt heading is used. The key is ignored while typing. Distinct from `%` hide-FX-open.
4. Use the Sunday late issuer close (synthetic) preset. It keeps the same 72-hour calendar as Normal Friday and treats the issuer gate as open on Sunday from 16:00 to 18:00. It is distinct from Sunday late bank close, Sunday late payout close, Sunday early payout open, Saturday late payout open, Friday early payout open, Saturday early payout open, Saturday early FX open, Friday late FX close, Monday late issuer open, Early Monday bank open, Thin Saturday FX, Payday Friday burst, Public-holiday Monday, Saturday market burst, Sunday stall close, Long-weekend Friday start, and Compressed Friday close. It is synthetic, not a bank feed.
5. Hide Gantt hours where the issuer gate is open. Display only. The model still contains 72 hours. Workspace JSON stores the optional boolean `hideIssuerOpenGanttHours`. Older files restore all hours. Unknown keys are rejected. Distinct from hide-issuer-closed and hide-bank-open filters. The selected hour stays visible if it would otherwise hide.
6. Copy the first open issuer hour label remains one-line Markdown, with an honest empty when none exists. Clipboard write has a textarea fallback. Distinct from first-open-bank copy. Synthetic, not live.
7. Analysis JSON still has no timestamps. Hatched Gantt cells remain a local drawing.
8. Timing review packets from 1.5.0 stay in place.

v1.5.15 Sunday early payout, bank-open Gantt hide and first-open-issuer copy remain below.

## New in v1.5.15: Sunday early payout, bank-open Gantt hide and first-open-issuer copy

1. Press `*` to copy the first open bank hour through the existing copy control, using the same Markdown. The key is ignored while typing. Distinct from `(` first-open-FX copy and `~` first-open-payout copy.
2. Press `&` to jump to the first-open-bank-hour copy control. If that control is missing, the Gantt heading is used. The key does not copy. The key is ignored while typing. Distinct from `)` first-open-FX jump.
3. Press `%` to jump to the hide-FX-open Gantt filter. If that control is missing, the Gantt heading is used. The key is ignored while typing. Distinct from `#` hide-payout-open.
4. Use the Sunday early payout open (synthetic) preset. It keeps the same 72-hour calendar as Normal Friday and treats the payout gate as open on Sunday morning from 08:00 to 10:00. It is distinct from Saturday late payout open, Friday early payout open, Saturday early payout open, Sunday late payout close, Sunday late bank close, Saturday early FX open, Friday late FX close, Monday late issuer open, Early Monday bank open, Thin Saturday FX, Payday Friday burst, Public-holiday Monday, Saturday market burst, Sunday stall close, Long-weekend Friday start, and Compressed Friday close. It is synthetic, not a bank feed.
5. Hide Gantt hours where the bank gate is open. Display only. The model still contains 72 hours. Workspace JSON stores the optional boolean `hideBankOpenGanttHours`. Older files restore all hours. Unknown keys are rejected. Distinct from hide-bank-closed and hide-FX-open filters. The selected hour stays visible if it would otherwise hide.
6. Print and print redacted include the first open bank hour as one line, with an honest empty when none exists. Redacted print stays redacted. These are counts of modeled hours, not a bank calendar. The saved scenario is unchanged. Analysis JSON still has no timestamps.
7. Copy the first open issuer hour label as one-line Markdown, with an honest empty when none exists. Clipboard write has a textarea fallback. Distinct from first-open-bank copy and first-closed-issuer copy. Synthetic, not live.
8. Analysis JSON still has no timestamps. Hatched Gantt cells remain a local drawing.
9. Timing review packets from 1.5.0 stay in place.

v1.5.14 Saturday late payout, FX-open Gantt hide and first-open-bank copy remain below.

## New in v1.5.14: Saturday late payout, FX-open Gantt hide and first-open-bank copy

1. Press `(` to copy the first open FX hour through the existing copy control, using the same Markdown. The key is ignored while typing. Distinct from `~` first-open-payout copy and `}` first-closed-FX copy.
2. Press `)` to jump to the first-open-FX-hour copy control. If that control is missing, the Gantt heading is used. The key does not copy. The key is ignored while typing. Distinct from `!` first-open-payout jump.
3. Press `#` to jump to the hide-payout-open Gantt filter. If that control is missing, the Gantt heading is used. The key is ignored while typing. Distinct from `@` hide-FX-closed.
4. Use the Saturday late payout open (synthetic) preset. It keeps the same 72-hour calendar as Normal Friday and treats the payout gate as open on Saturday evening from 18:00 to 20:00. It is distinct from Friday early payout open, Saturday early payout open, Sunday late payout close, Sunday late bank close, Saturday early FX open, Friday late FX close, Monday late issuer open, Early Monday bank open, Thin Saturday FX, Payday Friday burst, Public-holiday Monday, Saturday market burst, Sunday stall close, Long-weekend Friday start, and Compressed Friday close. It is synthetic, not a bank feed.
5. Hide Gantt hours where FX is weekday-depth / open. Display only. The model still contains 72 hours. Workspace JSON stores the optional boolean `hideFxOpenGanttHours`. Older files restore all hours. Unknown keys are rejected. Distinct from hide-FX-closed and hide-payout-open filters. The selected hour stays visible if it would otherwise hide.
6. Print and print redacted include the first open FX hour as one line, with an honest empty when none exists. Redacted print stays redacted. These are counts of modeled hours, not a bank calendar. The saved scenario is unchanged. Analysis JSON still has no timestamps.
7. Copy the first open bank hour label as one-line Markdown, with an honest empty when none exists. Clipboard write has a textarea fallback. Distinct from first-open-FX copy. Local drawing, not a live bank feed.
8. Analysis JSON still has no timestamps. Hatched Gantt cells remain a local drawing.
9. Timing review packets from 1.5.0 stay in place.

v1.5.13 Friday early payout, payout-open Gantt hide and first-open-FX copy remain below.

## New in v1.5.13: Friday early payout, payout-open Gantt hide and first-open-FX copy

1. Press `~` to copy the first open payout hour through the existing copy control, using the same Markdown. The key is ignored while typing. Distinct from `}` first-closed-FX copy and `"` first-closed-payout copy.
2. Press `!` to jump to the first-open-payout-hour copy control. If that control is missing, the Gantt heading is used. The key does not copy. The key is ignored while typing. Distinct from `+` first-closed-FX jump.
3. Press `@` to jump to the hide-FX-closed Gantt filter. If that control is missing, the Gantt heading is used. The key is ignored while typing. Distinct from `|` hide-payout-closed.
4. Use the Friday early payout open (synthetic) preset. It keeps the same 72-hour calendar as Normal Friday and treats the payout gate as open on Friday evening from 18:00 to 20:00, earlier than Saturday early payout open. It is distinct from Saturday early payout open, Sunday late payout close, Sunday late bank close, Saturday early FX open, Friday late FX close, Monday late issuer open, Early Monday bank open, Thin Saturday FX, Payday Friday burst, Public-holiday Monday, Saturday market burst, Sunday stall close, Long-weekend Friday start, and Compressed Friday close. It is synthetic, not a bank feed.
5. Hide Gantt hours where the payout gate is open. Display only. The model still contains 72 hours. Workspace JSON stores the optional boolean `hidePayoutOpenGanttHours`. Older files restore all hours. Unknown keys are rejected. Distinct from hide-payout-closed, hide-FX-closed, hide-issuer-closed, hide-bank-closed, hide-closed, and hide-open filters. The selected hour stays visible if it would otherwise hide.
6. Print and print redacted include the first open payout hour as one line, with an honest empty when none exists. Redacted print stays redacted. These are counts of modeled hours, not a bank calendar. The saved scenario is unchanged. Analysis JSON still has no timestamps.
7. Copy the first open FX hour label as one-line Markdown, with an honest empty when none exists. Clipboard write has a textarea fallback. Distinct from first-open-payout copy, first-closed-FX copy, and first-closed-payout copy. Local drawing, not a live FX feed.
8. Analysis JSON still has no timestamps. Hatched Gantt cells remain a local drawing.
9. Timing review packets from 1.5.0 stay in place.

v1.5.12 Saturday early payout, FX-closed Gantt hide and first-open-payout copy remain below.

## New in v1.5.12: Saturday early payout, FX-closed Gantt hide and first-open-payout copy

1. Press `}` to copy the first closed FX hour through the existing copy control, using the same Markdown. The key is ignored while typing. Distinct from `"` first-closed-payout copy and `:` first-closed-issuer copy. Local drawing, not a live FX feed.
2. Press `+` to jump to the first-closed-FX-hour copy control. If that control is missing, the Gantt heading is used. The key does not copy. The key is ignored while typing. Distinct from `_` first-closed-payout jump.
3. Press `|` to jump to the hide-payout-closed Gantt filter. If that control is missing, the Gantt heading is used. The key is ignored while typing. Distinct from `{` hide-issuer-closed.
4. Use the Saturday early payout open (synthetic) preset. It keeps the same 72-hour calendar as Normal Friday and treats the payout gate as open on Saturday morning from 07:00 to 09:00, earlier than Sunday late payout close. It is distinct from Sunday late payout close, Sunday late bank close, Saturday early FX open, Friday late FX close, Monday late issuer open, Early Monday bank open, Thin Saturday FX, Payday Friday burst, Public-holiday Monday, Saturday market burst, Sunday stall close, Long-weekend Friday start, and Compressed Friday close. It is synthetic, not a bank feed.
5. Hide Gantt hours where the FX gate is closed. Display only. The model still contains 72 hours. Workspace JSON stores the optional boolean `hideFxClosedGanttHours`. Older files restore all hours. Unknown keys are rejected. Distinct from hide-payout-closed, hide-issuer-closed, hide-bank-closed, hide-closed, hide-open, hide-weekend, hide-weekday, hide-zero-queue, every-gate-closed, and closed-on-at-least-one-gate filters. The selected hour stays visible if it would otherwise hide.
6. Print and print redacted include the first closed FX hour as one line, with an honest empty when none exists. Redacted print stays redacted. These are counts of modeled hours, not a bank calendar. The saved scenario is unchanged. Analysis JSON still has no timestamps.
7. Copy the first open payout hour label as one-line Markdown, with an honest empty when none exists. Clipboard write has a textarea fallback. Distinct from first-closed-payout copy, first-closed-FX copy, first-closed-issuer copy, and first-closed-bank copy. Synthetic, not live.
8. Analysis JSON still has no timestamps. Hatched Gantt cells remain a local drawing.
9. Timing review packets from 1.5.0 stay in place.

v1.5.11 Sunday late payout, payout-closed Gantt hide and first-closed-payout print remain below.

## New in v1.5.11: Sunday late payout, payout-closed Gantt hide and first-closed-payout print

1. Press `"` to copy the first closed payout hour through the existing copy control, using the same Markdown. The key is ignored while typing. Distinct from `:` first-closed-issuer copy and `'` first-closed-bank copy.
2. Press `_` to jump to the first-closed-payout-hour copy control. If that control is missing, the Gantt heading is used. The key is ignored while typing.
3. Press `{` to jump to the hide-issuer-closed Gantt filter. If that control is missing, the Gantt heading is used. The key is ignored while typing. Distinct from `=` hide-bank-closed.
4. Use the Sunday late payout close (synthetic) preset. It keeps the same 72-hour calendar as Normal Friday and treats the payout gate as open on Sunday from 16:00 to 18:00 even though Sunday is not a business day. It is distinct from Sunday late bank close, Sunday stall close, Saturday early FX open, Friday late FX close, Monday late issuer open, Early Monday bank open, Thin Saturday FX, Payday Friday burst, Public-holiday Monday, Saturday market burst, Long-weekend Friday start, and Compressed Friday close. It is synthetic, not a bank feed.
5. Hide Gantt hours where the payout gate is closed. Display only. The model still contains 72 hours. Workspace JSON stores the optional boolean `hidePayoutClosedGanttHours`. Older files restore all hours. Unknown keys are rejected. Distinct from hide-weekday, hide-weekend, hide-open, hide-closed, hide-zero-queue, hide-bank-closed, hide-issuer-closed, every-gate-closed, and closed-on-at-least-one-gate filters. The selected hour stays visible if it would otherwise hide.
6. Print and print redacted include the first closed payout hour as one line, with an honest empty when none exists. Redacted print stays redacted. These are counts of modeled hours, not a bank calendar. The saved scenario is unchanged. Analysis JSON still has no timestamps.
7. Copy the first closed FX hour label as one-line Markdown, with an honest empty when none exists. Clipboard write has a textarea fallback. Distinct from first-closed-issuer copy, first-closed-bank copy, and first-closed-payout copy. Local drawing, not a live FX feed.
8. Analysis JSON still has no timestamps. Hatched Gantt cells remain a local drawing.
9. Timing review packets from 1.5.0 stay in place.

v1.5.10 Sunday late bank, issuer-closed Gantt hide and first-closed-issuer print remain below.

## New in v1.5.10: Sunday late bank, issuer-closed Gantt hide and first-closed-issuer print

1. Press `:` to copy the first closed issuer hour through the existing copy control, using the same Markdown. The key is ignored while typing. Distinct from `'` first-closed-bank copy.
2. Press `-` to jump to the first-closed-issuer-hour copy control. If that control is missing, the Gantt heading is used. The key is ignored while typing.
3. Press `=` to jump to the hide-bank-closed Gantt filter. If that control is missing, the Gantt heading is used. The key is ignored while typing. Distinct from `>` hide-zero-queue.
4. Use the Sunday late bank close (synthetic) preset. It keeps the same 72-hour calendar as Normal Friday and treats the bank gate as open on Sunday from 16:00 to 18:00 even though Sunday is not a business day. It is distinct from Sunday stall close, Saturday early FX open, Friday late FX close, Monday late issuer open, Early Monday bank open, Thin Saturday FX, Payday Friday burst, Public-holiday Monday, Saturday market burst, Long-weekend Friday start, and Compressed Friday close. It is synthetic, not a bank feed.
5. Hide Gantt hours where the issuer gate is closed. Display only. The model still contains 72 hours. Workspace JSON stores the optional boolean `hideIssuerClosedGanttHours`. Older files restore all hours. Unknown keys are rejected. Distinct from hide-weekday, hide-weekend, hide-open, hide-closed, hide-zero-queue, hide-bank-closed, every-gate-closed, and closed-on-at-least-one-gate filters. The selected hour stays visible if it would otherwise hide.
6. Print and print redacted include the first closed issuer hour as one line, with an honest empty when none exists. Redacted print stays redacted. These are counts of modeled hours, not a bank calendar. The saved scenario is unchanged. Analysis JSON still has no timestamps.
7. Copy the first closed payout hour label as one-line Markdown, with an honest empty when none exists. Clipboard write has a textarea fallback. Distinct from first-closed-FX copy, first-closed-bank copy, and first-closed-issuer copy. Synthetic, not live.
8. Analysis JSON still has no timestamps. Hatched Gantt cells remain a local drawing.
9. Timing review packets from 1.5.0 stay in place.

v1.5.9 Saturday early FX, bank-closed Gantt hide and first-closed-bank print remain below.

## New in v1.5.9: Saturday early FX, bank-closed Gantt hide and first-closed-bank print

1. Press `'` to copy the first closed bank hour through the existing copy control, using the same Markdown. The key is ignored while typing.
2. Press `<` to jump to the first-closed-bank-hour copy control. If that control is missing, the Gantt heading is used. The key is ignored while typing.
3. Press `>` to jump to the hide-zero-queue Gantt filter. If that control is missing, the Gantt heading is used. The key is ignored while typing.
4. Use the Saturday early FX open (synthetic) preset. It keeps the same 72-hour calendar as Normal Friday and opens the FX window Saturday morning earlier than Thin Saturday FX, Friday late FX close, Monday late issuer open, and Early Monday bank open. It is distinct from Normal Friday, Long-weekend Friday start, Compressed Friday close, Payday Friday burst, Public-holiday Monday, Saturday market burst, and Sunday stall close. It is synthetic, not a bank feed.
5. Hide Gantt hours where the bank gate is closed. Display only. The model still contains 72 hours. Workspace JSON stores the optional boolean `hideBankClosedGanttHours`. Older files restore all hours. Unknown keys are rejected. Distinct from hide-weekday, hide-weekend, hide-open, hide-closed, hide-zero-queue, every-gate-closed, and closed-on-at-least-one-gate filters. The selected hour stays visible if it would otherwise hide.
6. Print and print redacted include the first closed bank hour as one line, with an honest empty when none exists. Redacted print stays redacted. These are counts of modeled hours, not a bank calendar. The saved scenario is unchanged. Analysis JSON still has no timestamps.
7. Copy the first closed issuer hour label as one-line Markdown, with an honest empty when none exists. Clipboard write has a textarea fallback. Distinct from first-closed-FX copy and first-closed-bank copy. Synthetic, not live.
8. Analysis JSON still has no timestamps. Hatched Gantt cells remain a local drawing.
9. Timing review packets from 1.5.0 stay in place.

v1.5.8 Monday late issuer, hours-to-clear semicolon copy and zero-queue Gantt hide remain below.

## New in v1.5.8: Monday late issuer, hours-to-clear semicolon copy and zero-queue Gantt hide

1. Press `;` to copy hours to clear through the existing copy control, using the same Markdown. The empty line is honest when there is no queue. The key is ignored while typing.
2. Press `[` to jump to the hours-to-clear copy control. If that control is missing, the dashboard heading is used. The key is ignored while typing.
3. Press `]` to jump to Print. If that control is missing, the print / one-pager heading is used. The key is ignored while typing.
4. Use the Monday late issuer open (synthetic) preset. It keeps the same 72-hour calendar as Normal Friday and opens the Monday issuer window one hour later. It is distinct from Payday Friday burst, Public-holiday Monday, Saturday market burst, Sunday stall close, Thin Saturday FX, Thin FX, Tight Windows, Long-weekend Friday start, Compressed Friday close, Early Monday bank open, and Friday late FX close. It is not a live queue.
5. Hide Gantt hours whose synthetic queue is zero. Display only. The model still contains 72 hours. Workspace JSON stores the optional boolean `hideZeroQueueGanttHours`. Older files restore all hours. Unknown keys are rejected. Distinct from hide-open, hide-closed, hide-weekend, hide-weekday, every-gate-closed, and single-gate filters.
6. Print and print redacted include the hours-to-clear line when a queue exists, with an honest empty when none. These are counts of modeled hours, not a bank calendar. The saved scenario is unchanged.
7. Copy the first closed bank hour label as one-line Markdown, with an honest empty when none exists. Clipboard write has a textarea fallback. Distinct from first-closed-FX copy. These are counts of modeled hours, not a bank calendar.
8. Analysis JSON still has no timestamps. Hatched Gantt cells remain a local drawing.
9. Timing review packets from 1.5.0 stay in place.

v1.5.7 Friday late FX close, settlement comma copy and closed Gantt hide remain below.

## New in v1.5.7: Friday late FX close, settlement comma copy and closed Gantt hide

1. Press `,` to copy hours to first settlement through the existing copy control, using the same Markdown as `L`. The key is ignored while typing.
2. Press `.` to jump to the first-closed-FX-hour copy control. If that control is missing, the FX Gantt row or dashboard heading is used. The key is ignored while typing.
3. Press `/` without Shift to jump to the remaining-reserve copy control. If that control is missing, the dashboard heading is used. The key is ignored while typing. Shift+/ still opens help. `Z` still copies remaining reserve.
4. Use the Friday late FX close (synthetic) preset. It keeps the same 72-hour calendar as Normal Friday and closes the Friday FX window one hour later. It is distinct from Payday Friday burst, Public-holiday Monday, Saturday market burst, Sunday stall close, Thin Saturday FX, Thin FX, Tight Windows, Long-weekend Friday start, Compressed Friday close, and Early Monday bank open. It is not a live queue.
5. Hide Gantt hours that are closed on every gate. Display only. The model still contains 72 hours. Workspace JSON stores the optional boolean `hideClosedGanttHours`. Older files restore all hours. Unknown keys are rejected. Inverse of the hide-open filter. Hide-weekend, hide-weekday, every-gate-closed, and single-gate filters still compose.
6. Print and print redacted include the first closed FX hour label. These are counts of modeled hours, not a bank calendar. The saved scenario is unchanged.
7. Copy hours to clear stays a dedicated button through the existing hours-to-clear control. One-line Markdown with a clipboard fallback and an honest empty when there is no queue.
8. Analysis JSON still has no timestamps. Hatched Gantt cells remain a local drawing.
9. Timing review packets from 1.5.0 stay in place.

v1.5.6 early Monday bank, settlement jump and weekend Gantt hide remain below.

## New in v1.5.6: early Monday bank, settlement jump and weekend Gantt hide

1. Press `Y` to jump to the hours-to-first-settlement dashboard line. If that line is missing, the dashboard heading is used. Distinct from timeline jump `J` and hours-to-clear `K`. The key is ignored while typing.
2. Press `Z` to copy remaining reserve at the selected hour through the existing remaining-reserve copy control, using the same Markdown. The key is ignored while typing.
3. Use the Early Monday bank open (synthetic) preset. It keeps the same 72-hour calendar as Normal Friday and opens the Monday bank window one hour earlier. It is distinct from Payday Friday burst, Public-holiday Monday, Saturday market burst, Sunday stall close, Thin Saturday FX, Thin FX, Tight Windows, Long-weekend Friday start, and Compressed Friday close. It is not a live queue.
4. Hide Saturday and Sunday Gantt hours. Display only. The model still contains 72 hours. Workspace JSON stores the optional boolean `hideWeekendGanttHours`. Older files restore all hours. Unknown keys are rejected. Inverse of the Saturday-and-Sunday filter. Hide-open, every-gate-closed, weekday, and single-gate filters still compose.
5. Print and print redacted include the hours-to-first-settlement line. The saved scenario is unchanged.
6. Copy the first closed FX hour label as one-line Markdown, with an honest empty when none exists. Clipboard write has a textarea fallback. These are counts of modeled hours, not a bank calendar.
7. Analysis JSON still has no timestamps. Hatched Gantt cells remain a local drawing.
8. Timing review packets from 1.5.0 stay in place.

v1.5.5 thin Saturday FX, settlement copy and issuer jump remain below.

## New in v1.5.5: thin Saturday FX, settlement copy and issuer jump

1. Press `I` to jump to the Issuer Gantt row. If that row is filtered away, the Gantt heading is used. Distinct from Bank `B` and FX `W`. The key is ignored while typing.
2. Press `L` to copy hours to first settlement as one-line Markdown, with a synthetic-not-live notice. Distinct from hours-to-clear copy. Clipboard write has a textarea fallback.
3. Press `O` to jump to the Payout Gantt row. If that row is filtered away, the Gantt heading is used. The key is ignored while typing.
4. Press `V` to copy the selected Gantt hour versus the peak-queue hour as two-line Markdown. Clipboard write has a textarea fallback. This is not a forecast.
5. Use the Thin Saturday FX (synthetic) preset. It keeps the same 72-hour calendar as Normal Friday, uses Saturday burst arrivals, and tightens Saturday FX hours. It is distinct from Saturday market burst, Sunday stall close, Payday Friday burst, Public-holiday Monday, and Thin FX, Tight Windows. It is not a live queue.
6. Hide Gantt hours that are open on every gate. Display only. The model still contains 72 hours. Workspace JSON stores the optional boolean `hideOpenGanttHours`. Older files restore all hours. Unknown keys are rejected. The Saturday-and-Sunday filter and the every-gate-closed filter still compose.
7. Print and print redacted include remaining reserve at the selected hour. The saved scenario is unchanged.
8. Copy the next-payout hour label as one-line Markdown, with an honest empty when no window exists. Clipboard write has a textarea fallback.
9. Analysis JSON still has no timestamps. Hatched Gantt cells remain a local drawing.
10. Timing review packets from 1.5.0 stay in place.

v1.5.4 Sunday stall close, reserve copy and weekend Gantt filter remain below.

## New in v1.5.4: Sunday stall close, reserve copy and weekend Gantt filter

1. Press `K` to jump to the hours-to-clear line. The key is ignored while typing in an input, textarea or select.
2. Press `N` to jump to the first-payout Gantt marker. If no payout window exists, the Gantt heading is used. The key is ignored while typing.
3. Press `A` to jump to analysis and export controls. The key is ignored while typing.
4. Press `W` to jump to the FX Gantt row. If that row is filtered away, the Gantt heading is used. Distinct from Bank `B`. The key is ignored while typing.
5. Copy remaining reserve and queued AUD at the selected Gantt hour as one-line Markdown, with a synthetic-not-live notice. Distinct from hours-to-clear copy and selected-hour copy. Clipboard write has a textarea fallback.
6. Use the Sunday stall close (synthetic) preset. It keeps the same 72-hour calendar as Normal Friday, uses a Sunday late redemption burst, and closes payouts earlier. It is distinct from Saturday market burst, Payday Friday burst, Public-holiday Monday, Long-weekend Friday start, Compressed Friday close, Weekend Rush, Market Stress, and Thin FX, Tight Windows. It is not a live queue.
7. Filter the Gantt to Saturday and Sunday hours. Display only. The model still contains 72 hours. Workspace JSON stores the optional boolean `hideWeekdayGanttHours`. Older files restore all hours. Unknown keys are rejected. Every-gate-closed and single-gate filters still compose.
8. Print and print redacted include the selected Gantt hour label line. The saved scenario is unchanged.
9. Copy compact weekend FX open and closed hour counts as Markdown. These are counts of modeled hours, not a bank calendar. Clipboard write has a textarea fallback.
10. Analysis JSON still has no timestamps.

v1.5.3 hours-to-clear copy, Saturday market and hour persist remain below.

## New in v1.5.3: hours-to-clear copy, Saturday market and hour persist

1. Copy hours to clear the queue as one-line Markdown, with a synthetic-not-live notice. Clipboard write has a textarea fallback.
2. Press `H` to jump to the selected Gantt hour table. The key is ignored while typing in an input, textarea or select.
3. Use the Saturday market burst (synthetic) preset. It keeps the same 72-hour calendar as Normal Friday and uses a Saturday redemption burst. It is distinct from Payday Friday burst, Public-holiday Monday, Long-weekend Friday start, and Compressed Friday close.
4. Press `X` to copy the closed-hours Markdown, the same text as the copy control. The key is ignored while typing.
5. Workspace JSON stores the selected Gantt hour index as an integer in range. Unknown keys are rejected. Older files that omit the field restore hour zero or the selected hour.
6. Press `B` to jump to the Bank gate row on the Gantt. If that row is filtered away, the Gantt heading is used. The key is ignored while typing.
7. Copy FX open and closed hours as Markdown. This is a local drawing, not a bank feed.
8. Press `M` to jump to the paired compare Gantt heading if present, otherwise the gate Gantt. The key is ignored while typing.
9. Print and print redacted include the hours-to-clear line. The saved scenario is unchanged.
10. Filter the Gantt to hours where every gate is closed. Display only. Uncheck to restore all hours. Workspace JSON stores the optional boolean. Older files restore all hours.

v1.5.2 peak-hour copy, holiday Monday and gate filter remain below.

## New in v1.5.2: peak-hour copy, holiday Monday and gate filter

1. Copy the peak-queue hour as Markdown: hour label, queued AUD, and gate open or closed state, with a synthetic-not-live notice. Distinct from selected Gantt hour copy. Clipboard write has a textarea fallback.
2. Filter the Gantt chart to a single gate (Issuer, Bank, Payout or FX), with All gates restore. Display only; the simulation is unchanged. Workspace JSON stores the filter. Unknown values are rejected.
3. Use the Public-holiday Monday (synthetic) preset. It keeps the same Friday start as Normal Friday and keeps Monday banking windows closed. It is distinct from Long-weekend Friday start, Compressed Friday close, Payday Friday burst and Thin FX, Tight Windows.
4. Copy the closed-hours list as Markdown: each hour and which gates are closed. This is a local drawing, not a bank feed.
5. Filter the hourly queue table to hours with backlog above zero. Display only. Dashboard counts stay unchanged. Restore shows all hours.
6. Press `C` to copy the selected Gantt hour Markdown, the same text as the copy button. The key is ignored while typing in an input, textarea or select.
7. Press `T` to jump to the timing review panel heading. The key is ignored while typing.
8. Copy the arrival-cohort table as Markdown: cohort window, arrivals and remaining. This is not a forecast.
9. Print and print redacted include one line for the peak-queue hour. The saved scenario is unchanged.
10. Workspace JSON stores the backlog-only queue-table filter. Older files that omit the field restore all hours. Analysis JSON still has no timestamps.

v1.5.1 Gantt hour copy, payday burst and dashboard CSV remain below.

## New in v1.5.1: Gantt hour copy, payday burst and dashboard CSV

1. Copy the selected Gantt hour as Markdown: issuer, bank, payout and FX open or closed state, with a synthetic-not-live notice. Clipboard write has a textarea fallback.
2. Press `F` to jump the timeline to the first hour where the bank gate is closed. If the bank never closes, the first closed issuer, bank or payout hour is used. The key is ignored while typing, and a notice is shown when no closed hour exists.
3. Filter the Gantt table and chart to hours that are closed on at least one gate. This is a local drawing. The model still contains 72 hours.
4. Compare three scenario JSON files labeled baseline, current and imported. Hours stay null when a run never queues or never settles. The open scenario is not replaced. Two-file compare, library copies and experiment compare stay separate.
5. Use the Payday Friday burst (synthetic) preset. It keeps the same 72-hour calendar as Normal Friday and uses a larger Friday redemption burst. It is distinct from Thin FX, Tight Windows, Long-weekend Friday start, and Compressed Friday close.
6. Press `S` to jump to the scenario inputs heading when not typing in an input, textarea or select.
7. Export a one-row dashboard CSV: hours to clear (empty if never), peak hour label, and hours to first settlement (empty if never). Cells are formula-safe and have no timestamps. Analysis JSON still has no clocks.
8. Workspace JSON stores the closed-hours-only Gantt filter. Older files that omit the field restore all hours.
9. Print redacted replaces custom institution names in dashboard and Gantt headings with generic Issuer, Bank, Payout and FX. Already-generic names are kept. The saved scenario is unchanged.
10. Copy hourly limiting-gate counts as Markdown. These are observation counts, not a causal ranking.

v1.5.0 timing review packets remain later on this page. v1.4.3 dashboard copy, file compare and the compressed Friday close remain below.

## New in v1.4.3: dashboard copy, file compare and a compressed Friday close

1. Copy dashboard numbers as Markdown: hours to clear the queue, peak queue hour, and hours to first settlement.
2. Press `D` to jump to the dashboard outcome summary when not typing in an input, textarea or select.
3. Compare two scenario JSON files. Queue and settlement diffs use honest nulls when only one run settles or clears.
4. When Monday holiday and Saturday holiday are both on, a notice says Saturday, Sunday and Monday stay closed under Sunday-style rules.
5. Preview an earlier or later demand-timing step, then apply it. Friday burst is earlier, Monday rush is later, and there is no randomness.
6. Workspace JSON stores the last queue or Gantt chart view. Older files that omit the field restore the queue chart.
7. The hourly table highlights the peak queue row and labels it in text.
8. Analysis JSON still has no timestamps. Tests reject created or exported clocks.
9. Press `Q` to jump to the queue chart. The key is ignored while typing in an input, textarea or select.
10. Use the Compressed Friday close (synthetic) preset. It is distinct from Normal Friday, Thin FX, Tight Windows, and Long-weekend Friday start.

v1.4.2 queue CSV, Gantt tools and the long-weekend preset remain below.

## New in v1.4.2: queue CSV, Gantt tools and a long-weekend preset

1. Export a formula-safe hourly queue CSV with the hour label and queue size at every checkpoint.
2. Press `G` to jump to the gate Gantt heading when not typing in an input, textarea or select.
3. Press `P` to jump the timeline to the peak queue hour. The key does nothing if demand never queues.
4. Workspace JSON stores the selected timeline hour. Older files that omit the field restore hour zero.
5. Export a Gantt CSV of issuer, bank, payout and FX open or closed state for the same 72 hours as the chart.
6. Print an operations brief that hides the coach and shortcut help while keeping dashboard numbers, the Gantt, and hours to clear the queue.
7. Copy a Markdown report that includes hours to clear the queue and the peak queue hour.
8. When Saturday is a public holiday, a notice says both weekend days are treated as closed under Sunday-style rules.
9. Use the Long-weekend Friday start (synthetic) preset. It is distinct from Normal Friday and Thin FX, Tight Windows.
10. Gantt open versus closed hours use solid and hatched fills so the chart is not color-only. Hatched Gantt rows are a local drawing. They do not connect to a bank or a live redemption queue. The text table remains required.

v1.4.1 queue files, calendar compare and holiday Saturday remain below.

## New in v1.4.1: queue files, calendar compare and holiday Saturday

1. Download the printable queue SVG as a file, using the same helper and synthetic-not-live notice as the Gantt download.
2. Press `J` to jump the timeline to the first settlement checkpoint. The key is ignored while typing in an input, textarea or select, and when no interval settles.
3. Hours to clear the queue appear on the dashboard: the first checkpoint where queued AUD is 0 after it has been positive, or "queue remains" if it never clears.
4. Workspace JSON stores Gantt table density. Older files without the field restore to six-hour snapshots.
5. Optionally treat Saturday as a public holiday like Sunday. Older scenario files omit the field and keep the existing weekend Saturday.
6. Applying a window shift still records one undo step. After apply, a notice says Undo scenario edit reverts that window.
7. Compare baseline and current operating calendars with a paired-row Gantt (current above baseline) and a table of hours that differ. Matching hours stay omitted except the selected hour.
8. Reports inline hours to clear the queue and the comparison Gantt. MODEL.md records the new semantics.

v1.4.0 operating-calendar tools remain below.

## New in v1.4.0: operating calendar and what-if tools

1. Scrub a 72-hour gate Gantt of issuer, bank, payout and FX state. The solid marker follows the timeline slider. The dashed marker is the first payout window. A table fallback and print styles keep the calendar readable without canvas.
2. Preview shifting one operating window by whole hours, see peak-queue and settled-total deltas, then apply explicitly.
3. Count which named limiting gate tagged each of the 72 hours, including a bank-closed fixture in tests. This is an observation count, not a causal ranking.
4. Compare flat, Friday burst and Monday rush on the same other inputs. Timing redistributes demand; it is not a forecast.
5. Optionally treat Monday as a public holiday. Older scenario files omit the field and keep a weekday Monday. Settlement cannot occur on a holiday Monday.
6. Run the five sensitivity cases as SVG bars for settled total or peak queue. The numeric table remains the text equivalent.
7. A first-run coach explains synthetic assumptions, gates and the Friday-Monday frame. It is skipped on share links and closes with Escape.
8. Keyboard shortcuts: `?` help, Space play/pause, `D` dashboard, `Q` queue chart, `G` Gantt, `P` peak queue, `J` first settlement, `U` undo, `R` redo, `E` export. Keys are ignored while typing in an input, textarea or select.
9. Print a light SVG of queue versus hour. The canvas playhead stays available on screen.
10. Use the Thin FX, Tight Windows (synthetic) preset for thin depth, compressed hours and a holiday Monday.
11. Hours to first settlement appear on the dashboard, or "No settlement in 72h" when the chain never pays.
12. Compare two or three named library copies side by side. Printable reports now inline the current Gantt.

v1.3.0 repeatable-experiment workflows remain: demand timing, pinned baselines, sensitivity apply, diagnostics, library, undo, workspace, HTML report and hourly CSV.

### Repeatable experiment workflows

1. Choose a preset, edit assumptions and select flat, Friday burst or Monday rush demand timing. Timing redistributes the same total demand; it does not introduce randomness.
2. Pin a baseline and write experiment notes. Compare the current scenario with the detached baseline, then run five sensitivity cases for one assumption. Capped values are labeled. Applying a case keeps the baseline.
3. Inspect simultaneous operating blockers, the longest backlog run and end-of-hour queue exposure. Use the full hourly table or jump to the peak queue or Monday opening checkpoint.
4. Save named copies in the local library (12 slots). Undo and redo recover up to 39 scenario edits in the current tab. This recovery history does not include notes, baseline changes or deleted library copies.
5. Export an editable workspace, a printable HTML report, a Markdown report, the hourly queue CSV, the Gantt CSV, the dashboard CSV or the full hourly CSV. Open the HTML report offline and use the browser Print command. Reports escape imported text and contain no scripts or external resources.

### What each export contains

| Export | Contents | Importable here |
| --- | --- | --- |
| Scenario JSON / share link | Current editable scenario | Scenario import / URL hash |
| Workspace JSON | Current and baseline scenarios, notes, target, deadline, selected hour, Gantt density, selected chart, closed-hours Gantt filter, weekend-hours Gantt filter, hide-weekend Gantt filter | Workspace import |
| Analysis JSON | Both scenarios, results, reserve plan and hourly comparison | No, report only |
| Hourly CSV | All 73 checkpoints, prior-interval flows and next-hour capacity | No, spreadsheet data |
| Queue CSV | Hour label and queue size at every checkpoint, formula-safe cells | No, spreadsheet data |
| Dashboard CSV | One formula-safe row: hours to clear, peak hour label, hours to first settlement | No, spreadsheet data |
| Gantt CSV | Open or closed issuer, bank, payout and FX state for the 72 chart hours | No, spreadsheet data |
| Markdown report | Hours to clear the queue and peak queue hour for current and baseline | No, copyable brief |
| Printable HTML | Notes, assumptions, comparison including hours to first settlement and hours to clear the queue, diagnostics, inline gate Gantt, baseline versus current Gantt, queue path, limiting-gate counts, reserve plan and model limits | No, report only |

Scenario, workspace and library data stay in browser storage. Nothing syncs to an account or server. A scenario hash takes priority over local recovery at startup. Normal reloads restore the latest workspace, including its baseline and notes. Browser/file-origin storage availability varies, so export important work. Storage failures remain visible while the simulator stays usable. Invalid planner drafts do not replace the last valid target in recovery, and incomplete numeric assumption fields leave the previous simulation intact.

The selected timeline hour has an accessible time label. With reduced motion enabled, playback becomes a single-hour step. Playback pauses when the tab is hidden, and the hourly table remains available without canvas.

Verification uses the built-in Node test runner, including an actual source-module workflow harness with a minimal DOM adapter. It checks imports, saved-scenario and workspace reload flows, failed imports, undo/redo, sensitivity invalidation, blocked storage, incomplete numeric drafts, reduced motion and missing canvas. This complements the browser checks; it is not a substitute for every browser or assistive-technology combination.

## New in v1.5.0: timing review

Open **Review the timing behind the queue** to inspect daily queue AUD-hours, an explicitly assumed FIFO arrival-cohort waiting ledger, settlement checkpoints, chain closure spells, operating-window overlap, four reserve targets, joint-throughput scenarios, holiday combinations, or hourly effects of a reserve increment. One selected question appears at a time. Every table explains its timing convention and declared-input limits. No scenario assumptions or funds are changed.

Export review packet stores a complete valid scenario, its exact source snapshot and recomputed table. Inspect review packet accepts at most 1 MiB and verifies every result cell while keeping the current scenario, baseline and workspace intact. Edits and newer review actions cancel old reads and clear stale output. Blank numeric drafts must be corrected before running a current-scenario review. These unsigned records establish consistency only, not real operational availability, source authenticity or funding authority. Existing scenario imports retain their documented normalization policy; review evidence requires complete valid typed inputs.
