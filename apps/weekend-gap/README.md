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
- Normal Friday, Weekend Rush, Market Stress, Thin FX, Tight Windows (synthetic), Long-weekend Friday start (synthetic), Compressed Friday close (synthetic), Payday Friday burst (synthetic), Public-holiday Monday (synthetic), Saturday market burst (synthetic), Sunday stall close (synthetic), and Thin Saturday FX (synthetic) presets.
- Immediate redeemable AUD, queued demand, effective liquidity ratio, estimated synthetic discount or slippage, next payout time, hours to first settlement, and hours to clear the queue.
- An outcome summary showing total settled demand, the queue remaining at Monday 15:00, the peak queue timestamp, backlog interval count, hours to first settlement (or no settlement in 72 hours), and hours to clear the queue (or queue remains). Copy dashboard numbers as Markdown, copy hours to clear as one line, copy hours to first settlement as one line, or export a one-row dashboard CSV.
- Play, pause and keyboard-accessible timeline scrubber, plus shortcuts for help, dashboard, queue chart, Gantt, selected Gantt hour, hours to clear, hours to first settlement copy, first-payout marker, Payout Gantt row, analysis export, Bank Gantt row, Issuer Gantt row, FX Gantt row, compare Gantt, peak queue, selected Gantt hour copy, selected versus peak-queue hour copy, closed-hours copy, timing review, first settlement, first closed bank hour, scenario inputs, undo, redo and export.
- Canvas chart with a printable SVG queue path that can be downloaded as a file, a formula-safe hourly queue CSV, and a text-equivalent data table.
- A 72-hour gate Gantt (SVG plus table) with hatch marks for closed hours, a closed-hours-only display filter, an every-gate-closed display filter, a Saturday-and-Sunday-hours display filter, a hide-open-hours display filter, a single-gate display filter, copy of the selected hour, copy of remaining reserve at that hour, copy of the peak-queue hour, copy of selected versus peak-queue hour, copy of closed hours, copy of FX hours, copy of weekend FX hour counts, copy of the next-payout hour label, the current hour and first payout window marked, plus a paired-row baseline versus current Gantt.
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
10. Gantt open versus closed hours use solid and hatched fills so the chart is not color-only. The text table remains required.

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
| Workspace JSON | Current and baseline scenarios, notes, target, deadline, selected hour, Gantt density, selected chart, closed-hours Gantt filter, weekend-hours Gantt filter | Workspace import |
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
