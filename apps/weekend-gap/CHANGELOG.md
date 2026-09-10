# Changelog

## 1.5.4 - 2026-09-10

A workshop follow-up on 1.5.3. Weekend Gap remains a local-first decision aid, not a decision maker. Hatched Gantt cells are a local drawing, not a bank feed. Timing review packets from 1.5.0 and the 1.5.1-1.5.3 review UI stay in place. Analysis JSON still has no timestamps.

### Added

- Keyboard `k` jumps to the hours-to-clear line when focus is not in an input, select, or text area. Shortcut help lists it.
- Keyboard `n` jumps to the first-payout Gantt marker, or the Gantt heading if none exists. Ignored while typing.
- Keyboard `a` jumps to analysis and export controls. Ignored while typing.
- Keyboard `w` jumps to the FX Gantt row, or the Gantt heading if that row is filtered away. Distinct from Bank `B`. Ignored while typing.
- Copy remaining reserve and queued AUD at the selected Gantt hour as one-line Markdown. Synthetic educational snapshot, not live market data. Distinct from hours-to-clear copy and selected-hour copy. Clipboard write has a textarea fallback.
- Sunday stall close (synthetic) preset: same 72-hour calendar as Normal Friday, with a Sunday late redemption burst and an earlier payout close. Distinct from Saturday market burst, Payday Friday burst, Public-holiday Monday, Long-weekend Friday start, Compressed Friday close, Weekend Rush, Market Stress, and Thin FX, Tight Windows. Not a live queue.
- Filter the Gantt to Saturday and Sunday hours. Display only; the model still contains 72 hours. Workspace JSON stores optional `hideWeekdayGanttHours`. Older files omit the key and show all hours. Unknown keys are rejected. Every-gate-closed and single-gate filters still compose.
- Print and print redacted include the selected Gantt hour label line. The saved scenario is unchanged.
- Copy compact weekend FX open and closed hour counts as Markdown. Counts of modeled hours, not a bank calendar. Clipboard write has a textarea fallback.

## 1.5.3 - 2026-09-10

Hours-to-clear copy, Saturday market burst, selected Gantt hour persist, closed-hours copy shortcut, Bank Gantt jump, FX hours Markdown, compare Gantt jump, hours-to-clear print, and every-gate-closed Gantt filter. See README for the full 1.5.3 list.

## 1.5.2 - 2026-09-10

Peak-hour copy, Public-holiday Monday, single-gate Gantt filter, closed-hours Markdown, backlog-only table, selected-hour copy shortcut, timing-review jump, cohort Markdown, peak-hour print, and backlog filter persist. See README.

## 1.5.1 - 2026-09-10

Selected Gantt hour copy, first closed bank hour, closed-hours Gantt filter, three-file compare, Payday Friday burst, scenario-input jump, dashboard CSV, closed-hours persist, print redacted labels, and limiting-gate Markdown. See README.

## 1.5.0 - 2026-09-09

Timing review packets, inspect/export, and WEEKEND_REVIEW_TOOLS. See README.
