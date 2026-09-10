# Changelog

## 1.5.8 - 2026-09-10

A workshop follow-up on 1.5.7. Weekend Gap remains a local-first decision aid, not a decision maker. Hatched Gantt cells are a local drawing, not a bank feed. Timing review packets from 1.5.0 and the 1.5.1-1.5.7 review UI stay in place. Analysis JSON still has no timestamps.

### Added

- Keyboard `;` copies hours-to-clear through the existing copy control, using the same Markdown. Honest empty when there is no queue. Ignored while typing.
- Keyboard `[` jumps to the hours-to-clear copy control, or the dashboard heading if that control is missing. Ignored while typing.
- Keyboard `]` jumps to Print, or the print / one-pager heading if that control is missing. Ignored while typing.
- Monday late issuer open (synthetic) preset: same 72-hour calendar as Normal Friday, Monday issuer window opens one hour later. Distinct from Payday Friday, Public-holiday Monday, Saturday market, Sunday stall close, Thin Saturday FX, Thin FX Tight Windows, Long-weekend, Compressed Friday, Early Monday bank open, and Friday late FX close. Not a live queue.
- Filter that hides Gantt hours whose synthetic queue is zero. Display only; the model still contains 72 hours. Workspace JSON stores optional `hideZeroQueueGanttHours`. Older files omit the key and show all hours. Unknown keys are rejected. Distinct from `hideOpenGanttHours`, `hideClosedGanttHours`, `hideWeekendGanttHours`, `hideWeekdayGanttHours`, every-gate-closed, and single-gate filters.
- Print and print redacted include the hours-to-clear line when a queue exists, with an honest empty when none. Counts of modeled hours, not a bank calendar. The saved scenario is unchanged.
- Copy first closed bank hour label as one-line Markdown with an honest empty when none exists. Clipboard write has a textarea fallback. Distinct from first-closed-FX copy. Counts of modeled hours, not a bank calendar.

## 1.5.7 - 2026-09-10

A workshop follow-up on 1.5.6. Weekend Gap remains a local-first decision aid, not a decision maker. Hatched Gantt cells are a local drawing, not a bank feed. Timing review packets from 1.5.0 and the 1.5.1-1.5.6 review UI stay in place. Analysis JSON still has no timestamps.

### Added

- Keyboard `,` copies hours-to-first-settlement through the existing copy control, using the same Markdown. Ignored while typing.
- Keyboard `.` jumps to the first-closed-FX-hour copy control, or the FX Gantt row or dashboard heading if that control is missing. Ignored while typing.
- Keyboard `/` without Shift jumps to the remaining-reserve copy control, or the dashboard heading if that control is missing. Ignored while typing. Shift+/ stays help (`?`). Keyboard `z` still copies remaining reserve.
- Friday late FX close (synthetic) preset: same 72-hour calendar as Normal Friday, Friday FX window closes one hour later. Distinct from Payday Friday, Public-holiday Monday, Saturday market, Sunday stall close, Thin Saturday FX, Thin FX Tight Windows, Long-weekend, Compressed Friday, and Early Monday bank open. Not a live queue.
- Filter that hides Gantt hours closed on every gate. Display only; the model still contains 72 hours. Workspace JSON stores optional `hideClosedGanttHours`. Older files omit the key and show all hours. Unknown keys are rejected. Inverse of `hideOpenGanttHours`. Hide-weekend, hide-weekday, every-gate-closed, and single-gate filters still compose.
- Print and print redacted include the first closed FX hour label. Counts of modeled hours, not a bank calendar. The saved scenario is unchanged.
- Copy hours-to-clear stays a dedicated button through the existing hours-to-clear control. One-line Markdown with a clipboard fallback and an honest empty when there is no queue.

## 1.5.6 - 2026-09-10

A workshop follow-up on 1.5.5. Weekend Gap remains a local-first decision aid, not a decision maker. Hatched Gantt cells are a local drawing, not a bank feed. Timing review packets from 1.5.0 and the 1.5.1-1.5.5 review UI stay in place. Analysis JSON still has no timestamps.

### Added

- Keyboard `y` jumps to the hours-to-first-settlement dashboard line, or the dashboard heading if that line is missing. Distinct from timeline jump `J` and hours-to-clear `K`. Ignored while typing.
- Keyboard `z` copies remaining reserve at the selected hour through the existing remaining-reserve copy control, using the same Markdown. Ignored while typing.
- Early Monday bank open (synthetic) preset: same 72-hour calendar as Normal Friday, Monday bank window opens one hour earlier. Distinct from Payday Friday, Public-holiday Monday, Saturday market, Sunday stall close, Thin Saturday FX, Thin FX Tight Windows, Long-weekend, and Compressed Friday. Not a live queue.
- Filter that hides Saturday and Sunday Gantt hours. Display only; the model still contains 72 hours. Workspace JSON stores optional `hideWeekendGanttHours`. Older files omit the key and show all hours. Unknown keys are rejected. Inverse of `hideWeekdayGanttHours`. Hide-open, every-gate-closed, weekday, and single-gate filters still compose.
- Print and print redacted include the hours-to-first-settlement line. The saved scenario is unchanged.
- Copy first closed FX hour label as one-line Markdown with an honest empty when none exists. Clipboard write has a textarea fallback. Counts of modeled hours, not a bank calendar.

## 1.5.5 - 2026-09-10

A workshop follow-up on 1.5.4. Weekend Gap remains a local-first decision aid, not a decision maker. Hatched Gantt cells are a local drawing, not a bank feed. Timing review packets from 1.5.0 and the 1.5.1-1.5.4 review UI stay in place. Analysis JSON still has no timestamps.

### Added

- Keyboard `i` jumps to the Issuer Gantt row, or the Gantt heading if that row is filtered away. Distinct from Bank `B` and FX `W`. Ignored while typing.
- Keyboard `l` copies hours-to-first-settlement as one-line Markdown. Synthetic educational snapshot, not live. Distinct from hours-to-clear copy. Clipboard write has a textarea fallback.
- Keyboard `o` jumps to the Payout Gantt row, or the Gantt heading if that row is filtered away. Ignored while typing.
- Keyboard `v` copies selected Gantt hour versus peak-queue hour as two-line Markdown. Clipboard write has a textarea fallback. Not a forecast.
- Thin Saturday FX (synthetic) preset: same 72-hour calendar as Normal Friday, Saturday burst arrivals, tighter Saturday FX hours. Distinct from Saturday market burst, Sunday stall close, Payday Friday burst, Public-holiday Monday, and Thin FX, Tight Windows. Not a live queue.
- Filter that hides Gantt hours open on every gate. Display only; the model still contains 72 hours. Workspace JSON stores optional `hideOpenGanttHours`. Older files omit the key and show all hours. Unknown keys are rejected. Saturday-and-Sunday and every-gate-closed filters still compose.
- Print and print redacted include remaining reserve at the selected hour. The saved scenario is unchanged.
- Copy next-payout hour label as one-line Markdown with an honest empty when none exists. Clipboard write has a textarea fallback.

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
