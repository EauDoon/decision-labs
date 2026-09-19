# Weekend Gap

> **Current keyboard behavior:** Home, End, Page Up, Page Down, arrow keys, Insert, Delete, Backspace, and F1 through F12 keep their native browser behavior. Older descriptions of those key bindings below are historical and no longer apply. Use the visible controls with Tab and Enter, or open the in-app shortcut help for retained application shortcuts.

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
- Normal Friday, Weekend Rush, Market Stress, Thin FX, Tight Windows (synthetic), Long-weekend Friday start (synthetic), Compressed Friday close (synthetic), Payday Friday burst (synthetic), Public-holiday Monday (synthetic), Saturday market burst (synthetic), Sunday stall close (synthetic), Thin Saturday FX (synthetic), Early Monday bank open (synthetic), Friday late FX close (synthetic), Monday late issuer open (synthetic), Saturday early FX open (synthetic), Sunday late bank close (synthetic), Sunday late payout close (synthetic), Saturday early payout open (synthetic), Friday early payout open (synthetic), Saturday late payout open (synthetic), Sunday early payout open (synthetic), Sunday late issuer close (synthetic), Sunday early issuer open (synthetic), Saturday early issuer open (synthetic), Friday early issuer open (synthetic), Saturday early bank open (synthetic), Friday early bank open (synthetic), Saturday late bank open (synthetic), Friday late bank open (synthetic), Friday late FX open (synthetic), Saturday late FX open (synthetic), Sunday late FX open (synthetic), Sunday early FX open (synthetic), Monday early FX open (synthetic), Monday late FX open (synthetic), Tuesday early FX open (synthetic), Tuesday late FX open (synthetic), Wednesday early FX open (synthetic), Wednesday late FX open (synthetic), Thursday early FX open (synthetic), Thursday late FX open (synthetic), Friday early FX open (synthetic), Saturday midday FX open (synthetic), Sunday midday FX open (synthetic), and Saturday afternoon FX open (synthetic) presets.
- Immediate redeemable AUD, queued demand, effective liquidity ratio, estimated synthetic discount or slippage, next payout time, hours to first settlement, and hours to clear the queue.
- An outcome summary showing total settled demand, the queue remaining at the horizon close, the peak queue timestamp, backlog interval count, hours to first settlement (or no settlement within the horizon), and hours to clear the queue (or queue remains). Copy dashboard numbers as Markdown, copy hours to clear as one line, copy hours to first settlement as one line, or export a one-row dashboard CSV.
- Play, pause and keyboard-accessible timeline scrubber with a concise, discoverable keyboard set (press `?` in the app for the list): Space play or pause, J first settlement, F first closed bank hour, P peak queue, S, D, Q, G section jumps, M compare Gantt, A analysis export, C copy selected hour, U and R undo and redo, E export scenario.
- Canvas chart with a printable SVG queue path that can be downloaded as a file, a formula-safe hourly queue CSV, and a text-equivalent data table.
- A horizon-length gate Gantt (SVG plus table) with hatch marks for closed hours and a consolidated hour filter (all hours, closed on at least one gate, closed on every gate, open on at least one gate, weekend only, weekday only, queued demand only), a single-gate display filter, and row-density control. Gate hour evidence buttons copy the first and last open and closed hours plus open and closed counts for one gate. Closed-hours, FX-hours and weekend-FX-counts lists and the selected hour remain copyable. Older workspace files keep loading: legacy per-gate hide flags map onto the consolidated filter and are no longer written.
- Import and export of scenario JSON, server-mode URL-hash sharing, reset and safe local autosave.

## Scheduled funding tranches

Add reserve cash before a named hour settles, with the cost of securing it tracked as an expense that never reduces the reserve. The outcome summary names the funded total and cost, comparisons show signed funding deltas, and the reserve planner counts only tranches before its deadline. Copy the schedule as Markdown from the editor. This is arithmetic on a synthetic reserve, not a credit line or a funding recommendation.

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

## New in v1.8.0: scheduled funding tranches with cost accounting

Weekend Gap 1.8.0 is a capability release on 1.7.0. Scheduled funding is arithmetic on a synthetic reserve, not a credit line.

1. Optional `fundingTranches` (at most 16) add reserve cash before a named hour settles, each with a tracked cost of securing the funds. Costs never reduce the reserve. Any invalid entry rejects the whole schedule.
2. The simulation, reserve planner, comparisons, dashboard, reports, timeline analysis, and review packets all account for tranches. The planner counts only tranches before the deadline; comparisons list schedule edits with signed funding deltas.
3. The scenario editor gains a funding tranche list with add, edit, and remove actions, plus a schedule copy button. Edits are undoable and travel in scenario JSON, share links, and autosave.
4. The CLI gains a `funding` command comparing the funded run against the same scenario with tranches stripped, and now accepts dated schedule fields. Review tools run at any horizon and accept scheduled scenarios.

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

## New in v1.5.54: Sunday lunch FX open, first-weekday-FX-open copy, and weekday-FX-closed hide

Sunday lunch FX open, first-weekday-FX-open copy, and weekday-FX-closed hide in Weekend Gap 1.5.54

1. Press `Shift+F10` to copy the first weekday-FX-open hour through the existing first-weekday-FX-open copy control, using one-line Markdown. Honest empty when none. The key is ignored while typing. Distinct from unshifted `F10` last-weekday-FX-closed copy, last-weekend-FX-open copy, last-weekend-FX-closed copy, first-weekend-FX-closed copy, first-weekend-FX-open copy, first-weekday-FX-closed copy, last-weekday-FX-open copy, `F7` last-weekend-FX-closed copy and `Delete` last-closed-FX copy. Shift is handled before unshifted `F10`. Last-weekday-FX-open copy remains as a button without `Shift+F10`.
2. Press `Shift+F11` to jump to the first-weekday-FX-open-hour copy control. If that control is missing, the Gantt heading is used. The key does not copy. The key is ignored while typing. Distinct from unshifted `F11` last-weekday-FX-closed jump and `F8` last-weekend-FX-closed jump. Last-weekday-FX-open jump stays without `Shift+F11`.
3. Press `Shift+F12` to jump to the existing hide-weekday-FX-closed Gantt filter (`hideWeekdayFxClosedGanttHours`), which keeps `F9` as well. If that control is missing, the Gantt heading is used. The key is ignored while typing. Distinct from 1.5.34 `Shift+F12` hide-weekday-FX-open. Unshifted `F12` and `ArrowLeft` still jump to hide-weekend-FX-open. `Backspace` still jumps to hide-weekend-FX-closed. Hide-weekday-FX-open stays.
4. Use the Sunday lunch FX open (synthetic) preset. It keeps the same 72-hour calendar as Normal Friday and treats FX as weekday-depth / open on Sunday from 10:00 to 12:00 through `isSundayLunchFxOpenHour`. It is distinct from Sunday brunch FX open (the previous preset remains), Sunday breakfast FX open, Sunday sunrise FX open, Sunday daybreak FX open, Sunday predawn FX open, Saturday late-night FX open, Saturday night FX open, Sunday late-night FX open, Sunday night FX open, Sunday evening FX open, Saturday evening FX open, Sunday morning FX open, Saturday late FX open, Saturday afternoon FX open, Saturday midday FX open, Saturday early FX open, Sunday afternoon FX open, Sunday midday FX open, Sunday late FX open, Friday early FX open, and Friday late FX open. Named overlap with Sunday brunch (09:00-11:00) and Sunday morning (10:00-12:00), not a new even 2h window. It is synthetic, not an FX feed.
5. Unshifted `F10`, `F11` and `F12` stay last-weekday-FX-closed copy, last-weekday-FX-closed jump, and hide-weekend-FX-open jump. Last-weekend-FX-closed copy remains as a button with `F7`. Hide-weekend-FX-open remains as a control with unshifted `F12` and `ArrowLeft`. Hide-weekday-FX-open remains as a control. Shortcut handling returns immediately when the event is already handled.
6. Analysis JSON still has no timestamps. Hatched Gantt rows are a local drawing. They do not connect to a bank or a live redemption queue.
7. Timing review packets from 1.5.0 stay in place.

v1.5.53 Sunday brunch FX open, first-weekday-FX-open copy and weekday-FX-closed hide remain below.

## New in v1.5.53: Sunday brunch FX open, first-weekday-FX-open copy, and weekday-FX-closed hide

Sunday brunch FX open, first-weekday-FX-open copy, and weekday-FX-closed hide in Weekend Gap 1.5.53

1. Press `Shift+F10` to copy the first weekday-FX-open hour through the existing first-weekday-FX-open copy control, using one-line Markdown. Honest empty when none. The key is ignored while typing. Distinct from unshifted `F10` last-weekday-FX-closed copy, last-weekend-FX-open copy, last-weekend-FX-closed copy, first-weekend-FX-closed copy, first-weekend-FX-open copy, first-weekday-FX-closed copy, last-weekday-FX-open copy, `F7` last-weekend-FX-closed copy and `Delete` last-closed-FX copy. Shift is handled before unshifted `F10`. Last-weekday-FX-open copy remains as a button without `Shift+F10`.
2. Press `Shift+F11` to jump to the first-weekday-FX-open-hour copy control. If that control is missing, the Gantt heading is used. The key does not copy. The key is ignored while typing. Distinct from unshifted `F11` last-weekday-FX-closed jump and `F8` last-weekend-FX-closed jump. Last-weekday-FX-open jump stays without `Shift+F11`.
3. Press `Shift+F12` to jump to the existing hide-weekday-FX-closed Gantt filter (`hideWeekdayFxClosedGanttHours`), which keeps `F9` as well. If that control is missing, the Gantt heading is used. The key is ignored while typing. Distinct from 1.5.34 `Shift+F12` hide-weekday-FX-open. Unshifted `F12` and `ArrowLeft` still jump to hide-weekend-FX-open. `Backspace` still jumps to hide-weekend-FX-closed. Hide-weekday-FX-open stays.
4. Use the Sunday brunch FX open (synthetic) preset. It keeps the same 72-hour calendar as Normal Friday and treats FX as weekday-depth / open on Sunday from 09:00 to 11:00 through `isSundayBrunchFxOpenHour`. It is distinct from Sunday breakfast FX open (the previous preset remains), Sunday sunrise FX open, Sunday daybreak FX open, Sunday predawn FX open, Saturday late-night FX open, Saturday night FX open, Sunday late-night FX open, Sunday night FX open, Sunday evening FX open, Saturday evening FX open, Sunday morning FX open, Saturday late FX open, Saturday afternoon FX open, Saturday midday FX open, Saturday early FX open, Sunday afternoon FX open, Sunday midday FX open, Sunday late FX open, Friday early FX open, and Friday late FX open. Named overlap with Sunday early (08:00-10:00) and Sunday morning (10:00-12:00), not a new even 2h window. It is synthetic, not an FX feed.
5. Unshifted `F10`, `F11` and `F12` stay last-weekday-FX-closed copy, last-weekday-FX-closed jump, and hide-weekend-FX-open jump. Last-weekend-FX-closed copy remains as a button with `F7`. Hide-weekend-FX-open remains as a control with unshifted `F12` and `ArrowLeft`. Hide-weekday-FX-open remains as a control. Shortcut handling returns immediately when the event is already handled.
6. Analysis JSON still has no timestamps. Hatched Gantt rows are a local drawing. They do not connect to a bank or a live redemption queue.
7. Timing review packets from 1.5.0 stay in place.

v1.5.52 Sunday breakfast FX open, first-weekday-FX-open copy and weekday-FX-closed hide remain below.

## New in v1.5.52: Sunday breakfast FX open, first-weekday-FX-open copy, and weekday-FX-closed hide

Sunday breakfast FX open, first-weekday-FX-open copy, and weekday-FX-closed hide in Weekend Gap 1.5.52

1. Press `Shift+F10` to copy the first weekday-FX-open hour through the existing first-weekday-FX-open copy control, using one-line Markdown. Honest empty when none. The key is ignored while typing. Distinct from unshifted `F10` last-weekday-FX-closed copy, last-weekend-FX-open copy, last-weekend-FX-closed copy, first-weekend-FX-closed copy, first-weekend-FX-open copy, first-weekday-FX-closed copy, last-weekday-FX-open copy, `F7` last-weekend-FX-closed copy and `Delete` last-closed-FX copy. Shift is handled before unshifted `F10`. Last-weekday-FX-open copy remains as a button without `Shift+F10`.
2. Press `Shift+F11` to jump to the first-weekday-FX-open-hour copy control. If that control is missing, the Gantt heading is used. The key does not copy. The key is ignored while typing. Distinct from unshifted `F11` last-weekday-FX-closed jump and `F8` last-weekend-FX-closed jump. Last-weekday-FX-open jump stays without `Shift+F11`.
3. Press `Shift+F12` to jump to the existing hide-weekday-FX-closed Gantt filter (`hideWeekdayFxClosedGanttHours`), which keeps `F9` as well. If that control is missing, the Gantt heading is used. The key is ignored while typing. Distinct from 1.5.34 `Shift+F12` hide-weekday-FX-open. Unshifted `F12` and `ArrowLeft` still jump to hide-weekend-FX-open. `Backspace` still jumps to hide-weekend-FX-closed. Hide-weekday-FX-open stays.
4. Use the Sunday breakfast FX open (synthetic) preset. It keeps the same 72-hour calendar as Normal Friday and treats FX as weekday-depth / open on Sunday from 07:00 to 09:00 through `isSundayBreakfastFxOpenHour`. It is distinct from Sunday sunrise FX open (the previous preset remains), Sunday daybreak FX open, Sunday predawn FX open, Saturday late-night FX open, Saturday night FX open, Sunday late-night FX open, Sunday night FX open, Sunday evening FX open, Saturday evening FX open, Sunday morning FX open, Saturday late FX open, Saturday afternoon FX open, Saturday midday FX open, Saturday early FX open, Sunday afternoon FX open, Sunday midday FX open, Sunday late FX open, Friday early FX open, and Friday late FX open. It is synthetic, not an FX feed.
5. Unshifted `F10`, `F11` and `F12` stay last-weekday-FX-closed copy, last-weekday-FX-closed jump, and hide-weekend-FX-open jump. Last-weekend-FX-closed copy remains as a button with `F7`. Hide-weekend-FX-open remains as a control with unshifted `F12` and `ArrowLeft`. Hide-weekday-FX-open remains as a control. Shortcut handling returns immediately when the event is already handled.
6. Analysis JSON still has no timestamps. Hatched Gantt rows are a local drawing. They do not connect to a bank or a live redemption queue.
7. Timing review packets from 1.5.0 stay in place.

v1.5.51 Sunday sunrise FX open, first-weekday-FX-open copy and weekday-FX-closed hide remain below.

## New in v1.5.51: Sunday sunrise FX open, first-weekday-FX-open copy, and weekday-FX-closed hide

Sunday sunrise FX open, first-weekday-FX-open copy, and weekday-FX-closed hide in Weekend Gap 1.5.51

1. Press `Shift+F10` to copy the first weekday-FX-open hour through the existing first-weekday-FX-open copy control, using one-line Markdown. Honest empty when none. The key is ignored while typing. Distinct from unshifted `F10` last-weekday-FX-closed copy, last-weekend-FX-open copy, last-weekend-FX-closed copy, first-weekend-FX-closed copy, first-weekend-FX-open copy, first-weekday-FX-closed copy, last-weekday-FX-open copy, `F7` last-weekend-FX-closed copy and `Delete` last-closed-FX copy. Shift is handled before unshifted `F10`. Last-weekday-FX-open copy remains as a button without `Shift+F10`.
2. Press `Shift+F11` to jump to the first-weekday-FX-open-hour copy control. If that control is missing, the Gantt heading is used. The key does not copy. The key is ignored while typing. Distinct from unshifted `F11` last-weekday-FX-closed jump and `F8` last-weekend-FX-closed jump. Last-weekday-FX-open jump stays without `Shift+F11`.
3. Press `Shift+F12` to jump to the existing hide-weekday-FX-closed Gantt filter (`hideWeekdayFxClosedGanttHours`), which keeps `F9` as well. If that control is missing, the Gantt heading is used. The key is ignored while typing. Distinct from 1.5.34 `Shift+F12` hide-weekday-FX-open. Unshifted `F12` and `ArrowLeft` still jump to hide-weekend-FX-open. `Backspace` still jumps to hide-weekend-FX-closed. Hide-weekday-FX-open stays.
4. Use the Sunday sunrise FX open (synthetic) preset. It keeps the same 72-hour calendar as Normal Friday and treats FX as weekday-depth / open on Sunday from 06:00 to 08:00 through `isSundaySunriseFxOpenHour`. It is distinct from Sunday daybreak FX open (the previous preset remains), Sunday predawn FX open, Saturday late-night FX open, Saturday night FX open, Sunday late-night FX open, Sunday night FX open, Sunday evening FX open, Saturday evening FX open, Sunday morning FX open, Saturday late FX open, Saturday afternoon FX open, Saturday midday FX open, Saturday early FX open, Sunday afternoon FX open, Sunday midday FX open, Sunday late FX open, Friday early FX open, and Friday late FX open. It is synthetic, not an FX feed.
5. Unshifted `F10`, `F11` and `F12` stay last-weekday-FX-closed copy, last-weekday-FX-closed jump, and hide-weekend-FX-open jump. Last-weekend-FX-closed copy remains as a button with `F7`. Hide-weekend-FX-open remains as a control with unshifted `F12` and `ArrowLeft`. Hide-weekday-FX-open remains as a control. Shortcut handling returns immediately when the event is already handled.
6. Analysis JSON still has no timestamps. Hatched Gantt rows are a local drawing. They do not connect to a bank or a live redemption queue.
7. Timing review packets from 1.5.0 stay in place.

v1.5.50 Sunday daybreak FX open, first-weekday-FX-open copy and weekday-FX-closed hide remain below.

## New in v1.5.50: Sunday daybreak FX open, first-weekday-FX-open copy, and weekday-FX-closed hide

Sunday daybreak FX open, first-weekday-FX-open copy, and weekday-FX-closed hide in Weekend Gap 1.5.50

1. Press `Shift+F10` to copy the first weekday-FX-open hour through the existing first-weekday-FX-open copy control, using one-line Markdown. Honest empty when none. The key is ignored while typing. Distinct from unshifted `F10` last-weekday-FX-closed copy, last-weekend-FX-open copy, last-weekend-FX-closed copy, first-weekend-FX-closed copy, first-weekend-FX-open copy, first-weekday-FX-closed copy, last-weekday-FX-open copy, `F7` last-weekend-FX-closed copy and `Delete` last-closed-FX copy. Shift is handled before unshifted `F10`. Last-weekday-FX-open copy remains as a button without `Shift+F10`.
2. Press `Shift+F11` to jump to the first-weekday-FX-open-hour copy control. If that control is missing, the Gantt heading is used. The key does not copy. The key is ignored while typing. Distinct from unshifted `F11` last-weekday-FX-closed jump and `F8` last-weekend-FX-closed jump. Last-weekday-FX-open jump stays without `Shift+F11`.
3. Press `Shift+F12` to jump to the existing hide-weekday-FX-closed Gantt filter (`hideWeekdayFxClosedGanttHours`), which keeps `F9` as well. If that control is missing, the Gantt heading is used. The key is ignored while typing. Distinct from 1.5.34 `Shift+F12` hide-weekday-FX-open. Unshifted `F12` and `ArrowLeft` still jump to hide-weekend-FX-open. `Backspace` still jumps to hide-weekend-FX-closed. Hide-weekday-FX-open stays.
4. Use the Sunday daybreak FX open (synthetic) preset. It keeps the same 72-hour calendar as Normal Friday and treats FX as weekday-depth / open on Sunday from 04:00 to 06:00 through `isSundayDaybreakFxOpenHour`. It is distinct from Sunday dawn FX open (the previous preset remains), Sunday predawn FX open, Saturday late-night FX open, Saturday night FX open, Sunday late-night FX open, Sunday night FX open, Sunday evening FX open, Saturday evening FX open, Sunday morning FX open, Saturday late FX open, Saturday afternoon FX open, Saturday midday FX open, Saturday early FX open, Sunday afternoon FX open, Sunday midday FX open, Sunday late FX open, Friday early FX open, and Friday late FX open. It is synthetic, not an FX feed.
5. Unshifted `F10`, `F11` and `F12` stay last-weekday-FX-closed copy, last-weekday-FX-closed jump, and hide-weekend-FX-open jump. Last-weekend-FX-closed copy remains as a button with `F7`. Hide-weekend-FX-open remains as a control with unshifted `F12` and `ArrowLeft`. Hide-weekday-FX-open remains as a control. Shortcut handling returns immediately when the event is already handled.
6. Analysis JSON still has no timestamps. Hatched Gantt rows are a local drawing. They do not connect to a bank or a live redemption queue.
7. Timing review packets from 1.5.0 stay in place.

v1.5.49 Sunday dawn FX open, first-weekday-FX-open copy and weekday-FX-closed hide remain below.

## New in v1.5.49: Sunday dawn FX open, first-weekday-FX-open copy, and weekday-FX-closed hide

Sunday dawn FX open, first-weekday-FX-open copy, and weekday-FX-closed hide in Weekend Gap 1.5.49

1. Press `Shift+F10` to copy the first weekday-FX-open hour through the existing first-weekday-FX-open copy control, using one-line Markdown. Honest empty when none. The key is ignored while typing. Distinct from unshifted `F10` last-weekday-FX-closed copy, last-weekend-FX-open copy, last-weekend-FX-closed copy, first-weekend-FX-closed copy, first-weekend-FX-open copy, first-weekday-FX-closed copy, last-weekday-FX-open copy, `F7` last-weekend-FX-closed copy and `Delete` last-closed-FX copy. Shift is handled before unshifted `F10`. Last-weekday-FX-open copy remains as a button without `Shift+F10`.
2. Press `Shift+F11` to jump to the first-weekday-FX-open-hour copy control. If that control is missing, the Gantt heading is used. The key does not copy. The key is ignored while typing. Distinct from unshifted `F11` last-weekday-FX-closed jump and `F8` last-weekend-FX-closed jump. Last-weekday-FX-open jump stays without `Shift+F11`.
3. Press `Shift+F12` to jump to the existing hide-weekday-FX-closed Gantt filter (`hideWeekdayFxClosedGanttHours`), which keeps `F9` as well. If that control is missing, the Gantt heading is used. The key is ignored while typing. Distinct from 1.5.34 `Shift+F12` hide-weekday-FX-open. Unshifted `F12` and `ArrowLeft` still jump to hide-weekend-FX-open. `Backspace` still jumps to hide-weekend-FX-closed. Hide-weekday-FX-open stays.
4. Use the Sunday dawn FX open (synthetic) preset. It keeps the same 72-hour calendar as Normal Friday and treats FX as weekday-depth / open on Sunday from 02:00 to 04:00 through `isSundayDawnFxOpenHour`. It is distinct from Sunday predawn FX open (the previous preset remains), Saturday late-night FX open, Saturday night FX open, Sunday late-night FX open, Sunday night FX open, Sunday evening FX open, Saturday evening FX open, Sunday morning FX open, Saturday late FX open, Saturday afternoon FX open, Saturday midday FX open, Saturday early FX open, Sunday afternoon FX open, Sunday midday FX open, Sunday late FX open, Friday early FX open, and Friday late FX open. It is synthetic, not an FX feed.
5. Unshifted `F10`, `F11` and `F12` stay last-weekday-FX-closed copy, last-weekday-FX-closed jump, and hide-weekend-FX-open jump. Last-weekend-FX-closed copy remains as a button with `F7`. Hide-weekend-FX-open remains as a control with unshifted `F12` and `ArrowLeft`. Hide-weekday-FX-open remains as a control. Shortcut handling returns immediately when the event is already handled.
6. Analysis JSON still has no timestamps. Hatched Gantt rows are a local drawing. They do not connect to a bank or a live redemption queue.
7. Timing review packets from 1.5.0 stay in place.

v1.5.48 Sunday predawn FX open, first-weekday-FX-open copy and weekday-FX-closed hide remain below.

## New in v1.5.48: Sunday predawn FX open, first-weekday-FX-open copy, and weekday-FX-closed hide

Sunday predawn FX open, first-weekday-FX-open copy, and weekday-FX-closed hide in Weekend Gap 1.5.48

1. Press `Shift+F10` to copy the first weekday-FX-open hour through the existing first-weekday-FX-open copy control, using one-line Markdown. Honest empty when none. The key is ignored while typing. Distinct from unshifted `F10` last-weekday-FX-closed copy, last-weekend-FX-open copy, last-weekend-FX-closed copy, first-weekend-FX-closed copy, first-weekend-FX-open copy, first-weekday-FX-closed copy, last-weekday-FX-open copy, `F7` last-weekend-FX-closed copy and `Delete` last-closed-FX copy. Shift is handled before unshifted `F10`. Last-weekday-FX-open copy remains as a button without `Shift+F10`.
2. Press `Shift+F11` to jump to the first-weekday-FX-open-hour copy control. If that control is missing, the Gantt heading is used. The key does not copy. The key is ignored while typing. Distinct from unshifted `F11` last-weekday-FX-closed jump and `F8` last-weekend-FX-closed jump. Last-weekday-FX-open jump stays without `Shift+F11`.
3. Press `Shift+F12` to jump to the existing hide-weekday-FX-closed Gantt filter (`hideWeekdayFxClosedGanttHours`), which keeps `F9` as well. If that control is missing, the Gantt heading is used. The key is ignored while typing. Distinct from 1.5.34 `Shift+F12` hide-weekday-FX-open. Unshifted `F12` and `ArrowLeft` still jump to hide-weekend-FX-open. `Backspace` still jumps to hide-weekend-FX-closed. Hide-weekday-FX-open stays.
4. Use the Sunday predawn FX open (synthetic) preset. It keeps the same 72-hour calendar as Normal Friday and treats FX as weekday-depth / open on Sunday from 00:00 to 02:00 through `isSundayPredawnFxOpenHour`. It is distinct from Saturday late-night FX open (the previous preset remains), Saturday night FX open, Sunday late-night FX open, Sunday night FX open, Sunday evening FX open, Saturday evening FX open, Sunday morning FX open, Saturday late FX open, Saturday afternoon FX open, Saturday midday FX open, Saturday early FX open, Sunday afternoon FX open, Sunday midday FX open, Sunday late FX open, Friday early FX open, and Friday late FX open. It is synthetic, not an FX feed.
5. Unshifted `F10`, `F11` and `F12` stay last-weekday-FX-closed copy, last-weekday-FX-closed jump, and hide-weekend-FX-open jump. Last-weekend-FX-closed copy remains as a button with `F7`. Hide-weekend-FX-open remains as a control with unshifted `F12` and `ArrowLeft`. Hide-weekday-FX-open remains as a control. Shortcut handling returns immediately when the event is already handled.
6. Analysis JSON still has no timestamps. Hatched Gantt rows are a local drawing. They do not connect to a bank or a live redemption queue.
7. Timing review packets from 1.5.0 stay in place.

v1.5.47 Saturday late-night FX open, first-weekday-FX-open copy and weekday-FX-closed hide remain below.

## New in v1.5.47: Saturday late-night FX open, first-weekday-FX-open copy, and weekday-FX-closed hide

Saturday late-night FX open, first-weekday-FX-open copy, and weekday-FX-closed hide in Weekend Gap 1.5.47

1. Press `Shift+F10` to copy the first weekday-FX-open hour through the existing first-weekday-FX-open copy control, using one-line Markdown. Honest empty when none. The key is ignored while typing. Distinct from unshifted `F10` last-weekday-FX-closed copy, last-weekend-FX-open copy, last-weekend-FX-closed copy, first-weekend-FX-closed copy, first-weekend-FX-open copy, first-weekday-FX-closed copy, last-weekday-FX-open copy, `F7` last-weekend-FX-closed copy and `Delete` last-closed-FX copy. Shift is handled before unshifted `F10`. Last-weekday-FX-open copy remains as a button without `Shift+F10`.
2. Press `Shift+F11` to jump to the first-weekday-FX-open-hour copy control. If that control is missing, the Gantt heading is used. The key does not copy. The key is ignored while typing. Distinct from unshifted `F11` last-weekday-FX-closed jump and `F8` last-weekend-FX-closed jump. Last-weekday-FX-open jump stays without `Shift+F11`.
3. Press `Shift+F12` to jump to the existing hide-weekday-FX-closed Gantt filter (`hideWeekdayFxClosedGanttHours`), which keeps `F9` as well. If that control is missing, the Gantt heading is used. The key is ignored while typing. Distinct from 1.5.34 `Shift+F12` hide-weekday-FX-open. Unshifted `F12` and `ArrowLeft` still jump to hide-weekend-FX-open. `Backspace` still jumps to hide-weekend-FX-closed. Hide-weekday-FX-open stays.
4. Use the Saturday late-night FX open (synthetic) preset. It keeps the same 72-hour calendar as Normal Friday and treats FX as weekday-depth / open on Saturday from 22:00 to 24:00 through `isSaturdayLateNightFxOpenHour`. It is distinct from Saturday night FX open (the previous preset remains), Sunday late-night FX open, Sunday night FX open, Sunday evening FX open, Saturday evening FX open, Sunday morning FX open, Saturday late FX open, Saturday afternoon FX open, Saturday midday FX open, Saturday early FX open, Sunday afternoon FX open, Sunday midday FX open, Sunday late FX open, Friday early FX open, and Friday late FX open. It is synthetic, not an FX feed.
5. Unshifted `F10`, `F11` and `F12` stay last-weekday-FX-closed copy, last-weekday-FX-closed jump, and hide-weekend-FX-open jump. Last-weekend-FX-closed copy remains as a button with `F7`. Hide-weekend-FX-open remains as a control with unshifted `F12` and `ArrowLeft`. Hide-weekday-FX-open remains as a control. Shortcut handling returns immediately when the event is already handled.
6. Analysis JSON still has no timestamps. Hatched Gantt rows are a local drawing. They do not connect to a bank or a live redemption queue.
7. Timing review packets from 1.5.0 stay in place.

v1.5.46 Saturday night FX open, first-weekday-FX-open copy and weekday-FX-closed hide remain below.

## New in v1.5.46: Saturday night FX open, first-weekday-FX-open copy, and weekday-FX-closed hide

Saturday night FX open, first-weekday-FX-open copy, and weekday-FX-closed hide in Weekend Gap 1.5.46

1. Press `Shift+F10` to copy the first weekday-FX-open hour through the existing first-weekday-FX-open copy control, using one-line Markdown. Honest empty when none. The key is ignored while typing. Distinct from unshifted `F10` last-weekday-FX-closed copy, last-weekend-FX-open copy, last-weekend-FX-closed copy, first-weekend-FX-closed copy, first-weekend-FX-open copy, first-weekday-FX-closed copy, last-weekday-FX-open copy, `F7` last-weekend-FX-closed copy and `Delete` last-closed-FX copy. Shift is handled before unshifted `F10`. Last-weekday-FX-open copy remains as a button without `Shift+F10`.
2. Press `Shift+F11` to jump to the first-weekday-FX-open-hour copy control. If that control is missing, the Gantt heading is used. The key does not copy. The key is ignored while typing. Distinct from unshifted `F11` last-weekday-FX-closed jump and `F8` last-weekend-FX-closed jump. Last-weekday-FX-open jump stays without `Shift+F11`.
3. Press `Shift+F12` to jump to the existing hide-weekday-FX-closed Gantt filter (`hideWeekdayFxClosedGanttHours`), which keeps `F9` as well. If that control is missing, the Gantt heading is used. The key is ignored while typing. Distinct from 1.5.34 `Shift+F12` hide-weekday-FX-open. Unshifted `F12` and `ArrowLeft` still jump to hide-weekend-FX-open. `Backspace` still jumps to hide-weekend-FX-closed. Hide-weekday-FX-open stays.
4. Use the Saturday night FX open (synthetic) preset. It keeps the same 72-hour calendar as Normal Friday and treats FX as weekday-depth / open on Saturday from 20:00 to 22:00 through `isSaturdayNightFxOpenHour`. It is distinct from Sunday late-night FX open (the previous preset remains), Sunday night FX open, Sunday evening FX open, Saturday evening FX open, Sunday morning FX open, Saturday late FX open, Saturday afternoon FX open, Saturday midday FX open, Saturday early FX open, Sunday afternoon FX open, Sunday midday FX open, Sunday late FX open, Friday early FX open, and Friday late FX open. It is synthetic, not an FX feed.
5. Unshifted `F10`, `F11` and `F12` stay last-weekday-FX-closed copy, last-weekday-FX-closed jump, and hide-weekend-FX-open jump. Last-weekend-FX-closed copy remains as a button with `F7`. Hide-weekend-FX-open remains as a control with unshifted `F12` and `ArrowLeft`. Hide-weekday-FX-open remains as a control. Shortcut handling returns immediately when the event is already handled.
6. Analysis JSON still has no timestamps. Hatched Gantt rows are a local drawing. They do not connect to a bank or a live redemption queue.
7. Timing review packets from 1.5.0 stay in place.

v1.5.45 Sunday late-night FX open, first-weekday-FX-open copy and weekday-FX-closed hide remain below.

## New in v1.5.45: Sunday late-night FX open, first-weekday-FX-open copy, and weekday-FX-closed hide

Sunday late-night FX open, first-weekday-FX-open copy, and weekday-FX-closed hide in Weekend Gap 1.5.45

1. Press `Shift+F10` to copy the first weekday-FX-open hour through the existing first-weekday-FX-open copy control, using one-line Markdown. Honest empty when none. The key is ignored while typing. Distinct from unshifted `F10` last-weekday-FX-closed copy, last-weekend-FX-open copy, last-weekend-FX-closed copy, first-weekend-FX-closed copy, first-weekend-FX-open copy, first-weekday-FX-closed copy, last-weekday-FX-open copy, `F7` last-weekend-FX-closed copy and `Delete` last-closed-FX copy. Shift is handled before unshifted `F10`. Last-weekday-FX-open copy remains as a button without `Shift+F10`.
2. Press `Shift+F11` to jump to the first-weekday-FX-open-hour copy control. If that control is missing, the Gantt heading is used. The key does not copy. The key is ignored while typing. Distinct from unshifted `F11` last-weekday-FX-closed jump and `F8` last-weekend-FX-closed jump. Last-weekday-FX-open jump stays without `Shift+F11`.
3. Press `Shift+F12` to jump to the existing hide-weekday-FX-closed Gantt filter (`hideWeekdayFxClosedGanttHours`), which keeps `F9` as well. If that control is missing, the Gantt heading is used. The key is ignored while typing. Distinct from 1.5.34 `Shift+F12` hide-weekday-FX-open. Unshifted `F12` and `ArrowLeft` still jump to hide-weekend-FX-open. `Backspace` still jumps to hide-weekend-FX-closed. Hide-weekday-FX-open stays.
4. Use the Sunday late-night FX open (synthetic) preset. It keeps the same 72-hour calendar as Normal Friday and treats FX as weekday-depth / open on Sunday from 22:00 to 24:00 through `isSundayLateNightFxOpenHour`. It is distinct from Sunday night FX open, Sunday evening FX open, Saturday evening FX open, Sunday morning FX open, Saturday late FX open, Saturday afternoon FX open, Saturday midday FX open, Saturday early FX open, Sunday afternoon FX open, Sunday midday FX open, Sunday late FX open, Friday early FX open, and Friday late FX open. It is synthetic, not an FX feed.
5. Unshifted `F10`, `F11` and `F12` stay last-weekday-FX-closed copy, last-weekday-FX-closed jump, and hide-weekend-FX-open jump. Last-weekend-FX-closed copy remains as a button with `F7`. Hide-weekend-FX-open remains as a control with unshifted `F12` and `ArrowLeft`. Hide-weekday-FX-open remains as a control. Shortcut handling returns immediately when the event is already handled.
6. Analysis JSON still has no timestamps. Hatched Gantt rows are a local drawing. They do not connect to a bank or a live redemption queue.
7. Timing review packets from 1.5.0 stay in place.

v1.5.44 Sunday night FX open, first-weekday-FX-open copy and weekday-FX-closed hide remain below.

## New in v1.5.44: Sunday night FX open, first-weekday-FX-open copy, and weekday-FX-closed hide

Sunday night FX open, first-weekday-FX-open copy, and weekday-FX-closed hide in Weekend Gap 1.5.44

1. Press `Shift+F10` to copy the first weekday-FX-open hour through the existing first-weekday-FX-open copy control, using one-line Markdown. Honest empty when none. The key is ignored while typing. Distinct from unshifted `F10` last-weekday-FX-closed copy, last-weekend-FX-open copy, last-weekend-FX-closed copy, first-weekend-FX-closed copy, first-weekend-FX-open copy, first-weekday-FX-closed copy, last-weekday-FX-open copy, `F7` last-weekend-FX-closed copy and `Delete` last-closed-FX copy. Shift is handled before unshifted `F10`. Last-weekday-FX-open copy remains as a button without `Shift+F10`.
2. Press `Shift+F11` to jump to the first-weekday-FX-open-hour copy control. If that control is missing, the Gantt heading is used. The key does not copy. The key is ignored while typing. Distinct from unshifted `F11` last-weekday-FX-closed jump and `F8` last-weekend-FX-closed jump. Last-weekday-FX-open jump stays without `Shift+F11`.
3. Press `Shift+F12` to jump to the existing hide-weekday-FX-closed Gantt filter (`hideWeekdayFxClosedGanttHours`), which keeps `F9` as well. If that control is missing, the Gantt heading is used. The key is ignored while typing. Distinct from 1.5.34 `Shift+F12` hide-weekday-FX-open. Unshifted `F12` and `ArrowLeft` still jump to hide-weekend-FX-open. `Backspace` still jumps to hide-weekend-FX-closed. Hide-weekday-FX-open stays.
4. Use the Sunday night FX open (synthetic) preset. It keeps the same 72-hour calendar as Normal Friday and treats FX as weekday-depth / open on Sunday from 20:00 to 22:00 through `isSundayNightFxOpenHour`. It is distinct from Sunday evening FX open, Saturday evening FX open, Sunday morning FX open, Saturday late FX open, Saturday afternoon FX open, Saturday midday FX open, Saturday early FX open, Sunday afternoon FX open, Sunday midday FX open, Sunday late FX open, Friday early FX open, and Friday late FX open. It is synthetic, not an FX feed.
5. Unshifted `F10`, `F11` and `F12` stay last-weekday-FX-closed copy, last-weekday-FX-closed jump, and hide-weekend-FX-open jump. Last-weekend-FX-closed copy remains as a button with `F7`. Hide-weekend-FX-open remains as a control with unshifted `F12` and `ArrowLeft`. Hide-weekday-FX-open remains as a control. Shortcut handling returns immediately when the event is already handled.
6. Analysis JSON still has no timestamps. Hatched Gantt rows are a local drawing. They do not connect to a bank or a live redemption queue.
7. Timing review packets from 1.5.0 stay in place.

v1.5.43 Sunday evening FX open, first-weekday-FX-open copy and weekday-FX-closed hide remain below.

## New in v1.5.43: Sunday evening FX open, first-weekday-FX-open copy, and weekday-FX-closed hide

Sunday evening FX open, first-weekday-FX-open copy, and weekday-FX-closed hide in Weekend Gap 1.5.43

1. Press `Shift+F10` to copy the first weekday-FX-open hour through the existing first-weekday-FX-open copy control, using one-line Markdown. Honest empty when none. The key is ignored while typing. Distinct from unshifted `F10` last-weekday-FX-closed copy, last-weekend-FX-open copy, last-weekend-FX-closed copy, first-weekend-FX-closed copy, first-weekend-FX-open copy, first-weekday-FX-closed copy, last-weekday-FX-open copy, `F7` last-weekend-FX-closed copy and `Delete` last-closed-FX copy. Shift is handled before unshifted `F10`. Last-weekday-FX-open copy remains as a button without `Shift+F10`.
2. Press `Shift+F11` to jump to the first-weekday-FX-open-hour copy control. If that control is missing, the Gantt heading is used. The key does not copy. The key is ignored while typing. Distinct from unshifted `F11` last-weekday-FX-closed jump and `F8` last-weekend-FX-closed jump. Last-weekday-FX-open jump stays without `Shift+F11`.
3. Press `Shift+F12` to jump to the existing hide-weekday-FX-closed Gantt filter (`hideWeekdayFxClosedGanttHours`), which keeps `F9` as well. If that control is missing, the Gantt heading is used. The key is ignored while typing. Distinct from 1.5.34 `Shift+F12` hide-weekday-FX-open. Unshifted `F12` and `ArrowLeft` still jump to hide-weekend-FX-open. `Backspace` still jumps to hide-weekend-FX-closed. Hide-weekday-FX-open stays.
4. Use the Sunday evening FX open (synthetic) preset. It keeps the same 72-hour calendar as Normal Friday and treats FX as weekday-depth / open on Sunday from 18:00 to 20:00 through `isSundayEveningFxOpenHour`. It is distinct from Saturday evening FX open, Sunday morning FX open, Saturday late FX open, Saturday afternoon FX open, Saturday midday FX open, Saturday early FX open, Sunday afternoon FX open, Sunday midday FX open, Sunday late FX open, Friday early FX open, and Friday late FX open. It is synthetic, not an FX feed.
5. Unshifted `F10`, `F11` and `F12` stay last-weekday-FX-closed copy, last-weekday-FX-closed jump, and hide-weekend-FX-open jump. Last-weekend-FX-closed copy remains as a button with `F7`. Hide-weekend-FX-open remains as a control with unshifted `F12` and `ArrowLeft`. Hide-weekday-FX-open remains as a control. Shortcut handling returns immediately when the event is already handled.
6. Analysis JSON still has no timestamps. Hatched Gantt rows are a local drawing. They do not connect to a bank or a live redemption queue.
7. Timing review packets from 1.5.0 stay in place.

v1.5.42 Saturday evening FX open, first-weekday-FX-open copy and weekday-FX-closed hide remain below.

## New in v1.5.42: Saturday evening FX open, first-weekday-FX-open copy, and weekday-FX-closed hide

Saturday evening FX open, first-weekday-FX-open copy, and weekday-FX-closed hide in Weekend Gap 1.5.42

1. Press `Shift+F10` to copy the first weekday-FX-open hour through the existing first-weekday-FX-open copy control, using one-line Markdown. Honest empty when none. The key is ignored while typing. Distinct from unshifted `F10` last-weekday-FX-closed copy, last-weekend-FX-open copy, last-weekend-FX-closed copy, first-weekend-FX-closed copy, first-weekend-FX-open copy, first-weekday-FX-closed copy, last-weekday-FX-open copy, `F7` last-weekend-FX-closed copy and `Delete` last-closed-FX copy. Shift is handled before unshifted `F10`. Last-weekday-FX-open copy remains as a button without `Shift+F10`.
2. Press `Shift+F11` to jump to the first-weekday-FX-open-hour copy control. If that control is missing, the Gantt heading is used. The key does not copy. The key is ignored while typing. Distinct from unshifted `F11` last-weekday-FX-closed jump and `F8` last-weekend-FX-closed jump. Last-weekday-FX-open jump stays without `Shift+F11`.
3. Press `Shift+F12` to jump to the existing hide-weekday-FX-closed Gantt filter (`hideWeekdayFxClosedGanttHours`), which keeps `F9` as well. If that control is missing, the Gantt heading is used. The key is ignored while typing. Distinct from 1.5.34 `Shift+F12` hide-weekday-FX-open. Unshifted `F12` and `ArrowLeft` still jump to hide-weekend-FX-open. `Backspace` still jumps to hide-weekend-FX-closed. Hide-weekday-FX-open stays.
4. Use the Saturday evening FX open (synthetic) preset. It keeps the same 72-hour calendar as Normal Friday and treats FX as weekday-depth / open on Saturday from 18:00 to 20:00 through `isSaturdayEveningFxOpenHour`. It is distinct from Sunday morning FX open, Saturday late FX open, Saturday afternoon FX open, Saturday midday FX open, Saturday early FX open, Sunday afternoon FX open, Sunday midday FX open, Sunday late FX open, Friday early FX open, and Friday late FX open. It is synthetic, not an FX feed.
5. Unshifted `F10`, `F11` and `F12` stay last-weekday-FX-closed copy, last-weekday-FX-closed jump, and hide-weekend-FX-open jump. Last-weekend-FX-closed copy remains as a button with `F7`. Hide-weekend-FX-open remains as a control with unshifted `F12` and `ArrowLeft`. Hide-weekday-FX-open remains as a control. Shortcut handling returns immediately when the event is already handled.
6. Analysis JSON still has no timestamps. Hatched Gantt rows are a local drawing. They do not connect to a bank or a live redemption queue.
7. Timing review packets from 1.5.0 stay in place.

v1.5.41 Sunday morning FX open, first-weekday-FX-open copy and weekday-FX-closed hide remain below.

## New in v1.5.41: Sunday morning FX open, first-weekday-FX-open copy, and weekday-FX-closed hide

Sunday morning FX open, first-weekday-FX-open copy, and weekday-FX-closed hide in Weekend Gap 1.5.41

1. Press `Shift+F10` to copy the first weekday-FX-open hour through the existing first-weekday-FX-open copy control, using one-line Markdown. Honest empty when none. The key is ignored while typing. Distinct from unshifted `F10` last-weekday-FX-closed copy, last-weekend-FX-open copy, last-weekend-FX-closed copy, first-weekend-FX-closed copy, first-weekend-FX-open copy, first-weekday-FX-closed copy, last-weekday-FX-open copy, `F7` last-weekend-FX-closed copy and `Delete` last-closed-FX copy. Shift is handled before unshifted `F10`. Last-weekday-FX-open copy remains as a button without `Shift+F10`.
2. Press `Shift+F11` to jump to the first-weekday-FX-open-hour copy control. If that control is missing, the Gantt heading is used. The key does not copy. The key is ignored while typing. Distinct from unshifted `F11` last-weekday-FX-closed jump and `F8` last-weekend-FX-closed jump. Last-weekday-FX-open jump stays without `Shift+F11`.
3. Press `Shift+F12` to jump to the existing hide-weekday-FX-closed Gantt filter (`hideWeekdayFxClosedGanttHours`), which keeps `F9` as well. If that control is missing, the Gantt heading is used. The key is ignored while typing. Distinct from 1.5.34 `Shift+F12` hide-weekday-FX-open. Unshifted `F12` and `ArrowLeft` still jump to hide-weekend-FX-open. `Backspace` still jumps to hide-weekend-FX-closed. Hide-weekday-FX-open stays.
4. Use the Sunday morning FX open (synthetic) preset. It keeps the same 72-hour calendar as Normal Friday and treats FX as weekday-depth / open on Sunday from 10:00 to 12:00 through `isSundayMorningFxOpenHour`. It is distinct from Sunday afternoon FX open, Sunday midday FX open, Sunday late FX open, Sunday early FX open, Saturday afternoon FX open, Saturday midday FX open, Saturday late FX open, Friday early FX open, and Friday late FX open. It is synthetic, not an FX feed.
5. Unshifted `F10`, `F11` and `F12` stay last-weekday-FX-closed copy, last-weekday-FX-closed jump, and hide-weekend-FX-open jump. Last-weekend-FX-closed copy remains as a button with `F7`. Hide-weekend-FX-open remains as a control with unshifted `F12` and `ArrowLeft`. Hide-weekday-FX-open remains as a control. Shortcut handling returns immediately when the event is already handled.
6. Analysis JSON still has no timestamps. Hatched Gantt rows are a local drawing. They do not connect to a bank or a live redemption queue.
7. Timing review packets from 1.5.0 stay in place.

v1.5.40 Sunday afternoon FX open, first-weekday-FX-open copy and weekday-FX-closed hide remain below.

## New in v1.5.40: Sunday afternoon FX open, first-weekday-FX-open copy, and weekday-FX-closed hide

Sunday afternoon FX open, first-weekday-FX-open copy, and weekday-FX-closed hide in Weekend Gap 1.5.40

1. Press `Shift+F10` to copy the first weekday-FX-open hour through the existing first-weekday-FX-open copy control, using one-line Markdown. Honest empty when none. The key is ignored while typing. Distinct from unshifted `F10` last-weekday-FX-closed copy, last-weekend-FX-open copy, last-weekend-FX-closed copy, first-weekend-FX-closed copy, first-weekend-FX-open copy, first-weekday-FX-closed copy, last-weekday-FX-open copy, `F7` last-weekend-FX-closed copy and `Delete` last-closed-FX copy. Shift is handled before unshifted `F10`. Last-weekday-FX-open copy remains as a button without `Shift+F10`.
2. Press `Shift+F11` to jump to the first-weekday-FX-open-hour copy control. If that control is missing, the Gantt heading is used. The key does not copy. The key is ignored while typing. Distinct from unshifted `F11` last-weekday-FX-closed jump and `F8` last-weekend-FX-closed jump. Last-weekday-FX-open jump stays without `Shift+F11`.
3. Press `Shift+F12` to jump to the existing hide-weekday-FX-closed Gantt filter (`hideWeekdayFxClosedGanttHours`), which keeps `F9` as well. If that control is missing, the Gantt heading is used. The key is ignored while typing. Distinct from 1.5.34 `Shift+F12` hide-weekday-FX-open. Unshifted `F12` and `ArrowLeft` still jump to hide-weekend-FX-open. `Backspace` still jumps to hide-weekend-FX-closed. Hide-weekday-FX-open stays.
4. Use the Sunday afternoon FX open (synthetic) preset. It keeps the same 72-hour calendar as Normal Friday and treats FX as weekday-depth / open on Sunday from 14:00 to 16:00 through `isSundayAfternoonFxOpenHour`. It is distinct from Saturday afternoon FX open, Sunday midday FX open, Sunday late FX open, Sunday early FX open, Saturday midday FX open, Saturday late FX open, Friday early FX open, and Friday late FX open. It is synthetic, not an FX feed.
5. Unshifted `F10`, `F11` and `F12` stay last-weekday-FX-closed copy, last-weekday-FX-closed jump, and hide-weekend-FX-open jump. Last-weekend-FX-closed copy remains as a button with `F7`. Hide-weekend-FX-open remains as a control with unshifted `F12` and `ArrowLeft`. Hide-weekday-FX-open remains as a control. Shortcut handling returns immediately when the event is already handled.
6. Analysis JSON still has no timestamps. Hatched Gantt rows are a local drawing. They do not connect to a bank or a live redemption queue.
7. Timing review packets from 1.5.0 stay in place.

v1.5.39 Saturday afternoon FX open, first-weekday-FX-open copy and weekday-FX-closed hide remain below.

## New in v1.5.39: Saturday afternoon FX open, first-weekday-FX-open copy, and weekday-FX-closed hide

Saturday afternoon FX open, first-weekday-FX-open copy, and weekday-FX-closed hide in Weekend Gap 1.5.39

1. Press `Shift+F10` to copy the first weekday-FX-open hour through the existing first-weekday-FX-open copy control, using one-line Markdown. Honest empty when none. The key is ignored while typing. Distinct from unshifted `F10` last-weekday-FX-closed copy, last-weekend-FX-open copy, last-weekend-FX-closed copy, first-weekend-FX-closed copy, first-weekend-FX-open copy, first-weekday-FX-closed copy, last-weekday-FX-open copy, `F7` last-weekend-FX-closed copy and `Delete` last-closed-FX copy. Shift is handled before unshifted `F10`. Last-weekday-FX-open copy remains as a button without `Shift+F10`.
2. Press `Shift+F11` to jump to the first-weekday-FX-open-hour copy control. If that control is missing, the Gantt heading is used. The key does not copy. The key is ignored while typing. Distinct from unshifted `F11` last-weekday-FX-closed jump and `F8` last-weekend-FX-closed jump. Last-weekday-FX-open jump stays without `Shift+F11`.
3. Press `Shift+F12` to jump to the existing hide-weekday-FX-closed Gantt filter (`hideWeekdayFxClosedGanttHours`), which keeps `F9` as well. If that control is missing, the Gantt heading is used. The key is ignored while typing. Distinct from 1.5.34 `Shift+F12` hide-weekday-FX-open. Unshifted `F12` and `ArrowLeft` still jump to hide-weekend-FX-open. `Backspace` still jumps to hide-weekend-FX-closed. Hide-weekday-FX-open stays.
4. Use the Saturday afternoon FX open (synthetic) preset. It keeps the same 72-hour calendar as Normal Friday and treats FX as weekday-depth / open on Saturday from 14:00 to 16:00 through `isSaturdayAfternoonFxOpenHour`. It is distinct from Saturday midday FX open, Saturday late FX open, Saturday early FX open, Sunday midday FX open, Sunday early FX open, Sunday late FX open, Friday early FX open, and Friday late FX open. It is synthetic, not an FX feed.
5. Unshifted `F10`, `F11` and `F12` stay last-weekday-FX-closed copy, last-weekday-FX-closed jump, and hide-weekend-FX-open jump. Last-weekend-FX-closed copy remains as a button with `F7`. Hide-weekend-FX-open remains as a control with unshifted `F12` and `ArrowLeft`. Hide-weekday-FX-open remains as a control. Shortcut handling returns immediately when the event is already handled.
6. Analysis JSON still has no timestamps. Hatched Gantt rows are a local drawing. They do not connect to a bank or a live redemption queue.
7. Timing review packets from 1.5.0 stay in place.

v1.5.38 Sunday midday FX open, first-weekday-FX-open copy and weekday-FX-closed hide remain below.

## New in v1.5.38: Sunday midday FX open, first-weekday-FX-open copy, and weekday-FX-closed hide

Sunday midday FX open, first-weekday-FX-open copy, and weekday-FX-closed hide in Weekend Gap 1.5.38

1. Press `Shift+F10` to copy the first weekday-FX-open hour through the existing first-weekday-FX-open copy control, using one-line Markdown. Honest empty when none. The key is ignored while typing. Distinct from unshifted `F10` last-weekday-FX-closed copy, last-weekend-FX-open copy, last-weekend-FX-closed copy, first-weekend-FX-closed copy, first-weekend-FX-open copy, first-weekday-FX-closed copy, last-weekday-FX-open copy, `F7` last-weekend-FX-closed copy and `Delete` last-closed-FX copy. Shift is handled before unshifted `F10`. Last-weekday-FX-open copy remains as a button without `Shift+F10`.
2. Press `Shift+F11` to jump to the first-weekday-FX-open-hour copy control. If that control is missing, the Gantt heading is used. The key does not copy. The key is ignored while typing. Distinct from unshifted `F11` last-weekday-FX-closed jump and `F8` last-weekend-FX-closed jump. Last-weekday-FX-open jump stays without `Shift+F11`.
3. Press `Shift+F12` to jump to the existing hide-weekday-FX-closed Gantt filter (`hideWeekdayFxClosedGanttHours`), which keeps `F9` as well. If that control is missing, the Gantt heading is used. The key is ignored while typing. Distinct from 1.5.34 `Shift+F12` hide-weekday-FX-open. Unshifted `F12` and `ArrowLeft` still jump to hide-weekend-FX-open. `Backspace` still jumps to hide-weekend-FX-closed. Hide-weekday-FX-open stays.
4. Use the Sunday midday FX open (synthetic) preset. It keeps the same 72-hour calendar as Normal Friday and treats FX as weekday-depth / open on Sunday from 12:00 to 14:00 through `isSundayMiddayFxOpenHour`. It is distinct from Saturday midday FX open, Sunday early FX open, Sunday late FX open, Saturday early FX open, Saturday late FX open, Friday early FX open, and Friday late FX open. It is synthetic, not an FX feed.
5. Unshifted `F10`, `F11` and `F12` stay last-weekday-FX-closed copy, last-weekday-FX-closed jump, and hide-weekend-FX-open jump. Last-weekend-FX-closed copy remains as a button with `F7`. Hide-weekend-FX-open remains as a control with unshifted `F12` and `ArrowLeft`. Hide-weekday-FX-open remains as a control. Shortcut handling returns immediately when the event is already handled.
6. Analysis JSON still has no timestamps. Hatched Gantt rows are a local drawing. They do not connect to a bank or a live redemption queue.
7. Timing review packets from 1.5.0 stay in place.

v1.5.37 Saturday midday FX open, last-weekday-FX-open copy and weekday-FX-closed hide remain below.

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

