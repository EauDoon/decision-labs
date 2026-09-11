# Changelog

## 1.5.22 - 2026-09-11

A workshop follow-up on 1.5.21. Weekend Gap remains a local-first decision aid, not a decision maker. Hatched Gantt cells are a local drawing, not a bank feed. Timing review packets from 1.5.0 and the 1.5.1-1.5.21 review UI stay in place. Analysis JSON still has no timestamps.

### Added

- Keyboard `Insert` copies last open FX hour through the new last-open-FX copy control, using one-line Markdown. Honest empty when none. Ignored while typing. Distinct from `4` last-open-bank copy, `PageUp` last-open-payout copy and `(` first-open-FX copy.
- Keyboard `ArrowDown` jumps to the last-open-FX-hour copy control, or the Gantt heading if that control is missing. Does not copy. Ignored while typing. Distinct from `PageDown` last-open-payout jump and `Home` last-open-bank jump.
- Keyboard `ArrowLeft` jumps to the hide-weekend-FX-open Gantt filter, or the Gantt heading if that control is missing. Ignored while typing. Distinct from `ArrowUp` hide-weekend-payout-open and `End` hide-weekend-bank-open.
- Saturday late bank open (synthetic) preset: same 72-hour calendar as Normal Friday, Saturday 16:00 to 18:00 treats the bank gate as open even though Saturday is not a business day. Distinct from Saturday early bank open, Friday early bank open, and Friday early issuer open. Synthetic. Not a bank feed.
- Filter that hides Gantt hours that are weekend and FX-open (`fxWeekday` true on a weekend hour). Display only; the model still contains 72 hours. Workspace JSON stores optional `hideWeekendFxOpenGanttHours`. Older files omit the key and show all hours. Unknown keys are rejected. Distinct from `hideWeekendPayoutOpenGanttHours`, `hideFxOpenGanttHours`, `hideWeekendGanttHours`, and `hideWeekendBankOpenGanttHours`. The selected hour stays visible if it would otherwise hide.

## 1.5.21 - 2026-09-11

A workshop follow-up on 1.5.20. Weekend Gap remains a local-first decision aid, not a decision maker. Hatched Gantt cells are a local drawing, not a bank feed. Timing review packets from 1.5.0 and the 1.5.1-1.5.20 review UI stay in place. Analysis JSON still has no timestamps.

### Added

- Keyboard `PageUp` copies last open payout hour through the new last-open-payout copy control, using one-line Markdown. Honest empty when none. Ignored while typing. Distinct from `4` last-open-bank copy, `5` last-open-issuer copy and `~` first-open-payout copy.
- Keyboard `PageDown` jumps to the last-open-payout-hour copy control, or the Gantt heading if that control is missing. Does not copy. Ignored while typing. Distinct from `Home` last-open-bank jump.
- Keyboard `ArrowUp` jumps to the hide-weekend-payout-open Gantt filter, or the Gantt heading if that control is missing. Ignored while typing. Distinct from `End` hide-weekend-bank-open.
- Friday early bank open (synthetic) preset: same 72-hour calendar as Normal Friday, Friday 08:00 to 10:00 treats the bank gate as open even when the ordinary bank window starts later. Distinct from Saturday early bank open, Friday early issuer open, Saturday early issuer open, Sunday late bank close, and Early Monday bank open. Synthetic. Not a bank feed.
- Filter that hides Gantt hours that are weekend and payout-open. Display only; the model still contains 72 hours. Workspace JSON stores optional `hideWeekendPayoutOpenGanttHours`. Older files omit the key and show all hours. Unknown keys are rejected. Distinct from `hideWeekendBankOpenGanttHours`, `hidePayoutOpenGanttHours`, `hideWeekendGanttHours`, and `hideWeekendIssuerOpenGanttHours`. The selected hour stays visible if it would otherwise hide.

## 1.5.20 - 2026-09-11

A workshop follow-up on 1.5.19. Weekend Gap remains a local-first decision aid, not a decision maker. Hatched Gantt cells are a local drawing, not a bank feed. Timing review packets from 1.5.0 and the 1.5.1-1.5.19 review UI stay in place. Analysis JSON still has no timestamps.

### Added

- Keyboard `4` copies last open bank hour through the new last-open-bank copy control, using one-line Markdown. Honest empty when none. Ignored while typing. Distinct from `1` last-closed-bank copy and `5` last-open-issuer copy.
- Keyboard `Home` jumps to the last-open-bank-hour copy control, or the Gantt heading if that control is missing. Does not copy. Ignored while typing. Distinct from `2` last-closed-bank jump.
- Keyboard `End` jumps to the hide-weekend-bank-open Gantt filter, or the Gantt heading if that control is missing. Ignored while typing. Distinct from `3` hide-weekend-bank-closed and `0` hide-weekend-issuer-closed.
- Saturday early bank open (synthetic) preset: same 72-hour calendar as Normal Friday, Saturday 08:00 to 10:00 treats the bank gate as open even though Saturday is not a business day. Distinct from Friday early issuer open, Saturday early issuer open, Sunday late bank close, and Early Monday bank open. Synthetic. Not a bank feed.
- Filter that hides Gantt hours that are weekend and bank-open. Display only; the model still contains 72 hours. Workspace JSON stores optional `hideWeekendBankOpenGanttHours`. Older files omit the key and show all hours. Unknown keys are rejected. Distinct from `hideWeekendBankClosedGanttHours`, `hideWeekendIssuerOpenGanttHours`, `hideBankOpenGanttHours`, and `hideWeekendGanttHours`. The selected hour stays visible if it would otherwise hide.

## 1.5.19 - 2026-09-11

A workshop follow-up on 1.5.18. Weekend Gap remains a local-first decision aid, not a decision maker. Hatched Gantt cells are a local drawing, not a bank feed. Timing review packets from 1.5.0 and the 1.5.1-1.5.18 review UI stay in place. Analysis JSON still has no timestamps.

### Added

- Keyboard `1` copies last closed bank hour through the new last-closed-bank copy control, using one-line Markdown. Honest empty when none. Ignored while typing. Distinct from `8` last-closed-issuer copy.
- Keyboard `2` jumps to the last-closed-bank-hour copy control, or the Gantt heading if that control is missing. Does not copy. Ignored while typing. Distinct from `9` last-closed-issuer jump.
- Keyboard `3` jumps to the hide-weekend-bank-closed Gantt filter, or the Gantt heading if that control is missing. Ignored while typing. Distinct from `0` hide-weekend-issuer-closed.
- Friday early issuer open (synthetic) preset: same 72-hour calendar as Normal Friday, Friday 08:00 to 10:00 treats the issuer gate as open even when the ordinary issuer window starts later. Distinct from Saturday early issuer open, Sunday early issuer open, Sunday late issuer close, and Friday early payout open. Synthetic. Not a bank feed.
- Filter that hides Gantt hours that are weekend and bank-closed. Display only; the model still contains 72 hours. Workspace JSON stores optional `hideWeekendBankClosedGanttHours`. Older files omit the key and show all hours. Unknown keys are rejected. Distinct from `hideWeekendIssuerClosedGanttHours`, `hideBankClosedGanttHours`, and `hideWeekendGanttHours`. The selected hour stays visible if it would otherwise hide.

## 1.5.18 - 2026-09-10

A workshop follow-up on 1.5.17. Weekend Gap remains a local-first decision aid, not a decision maker. Hatched Gantt cells are a local drawing, not a bank feed. Timing review packets from 1.5.0 and the 1.5.1-1.5.17 review UI stay in place. Analysis JSON still has no timestamps.

### Added

- Keyboard `8` copies last closed issuer hour through the new last-closed-issuer copy control, using one-line Markdown. Honest empty when none. Ignored while typing. Distinct from `5` last-open-issuer copy and `$` first-open-issuer copy.
- Keyboard `9` jumps to the last-closed-issuer-hour copy control, or the Gantt heading if that control is missing. Does not copy. Ignored while typing. Distinct from `6` last-open-issuer jump.
- Keyboard `0` jumps to the hide-weekend-issuer-closed Gantt filter, or the Gantt heading if that control is missing. Ignored while typing. Distinct from `7` hide-weekend-issuer-open and backtick hide-issuer-open.
- Saturday early issuer open (synthetic) preset: same 72-hour calendar as Normal Friday, Saturday 08:00 to 10:00 treats the issuer gate as open even though Saturday is not a business day. Distinct from Sunday early issuer open, Sunday late issuer close, Sunday early payout open, Sunday late payout close, Sunday late bank close, Saturday late payout open, Friday early payout open, Saturday early payout open, Saturday early FX open, Friday late FX close, Monday late issuer open, Early Monday bank open, Thin Saturday FX, Payday Friday, Public-holiday Monday, Saturday market burst, Sunday stall close, Long-weekend, and Compressed Friday. Synthetic. Not a bank feed.
- Filter that hides Gantt hours that are weekend and issuer-closed. Display only; the model still contains 72 hours. Workspace JSON stores optional `hideWeekendIssuerClosedGanttHours`. Older files omit the key and show all hours. Unknown keys are rejected. Distinct from `hideWeekendIssuerOpenGanttHours`, `hideIssuerClosedGanttHours`, `hideWeekendGanttHours`, and `hideOpenGanttHours`. The selected hour stays visible if it would otherwise hide.

## 1.5.17 - 2026-09-10

A workshop follow-up on 1.5.16. Weekend Gap remains a local-first decision aid, not a decision maker. Hatched Gantt cells are a local drawing, not a bank feed. Timing review packets from 1.5.0 and the 1.5.1-1.5.16 review UI stay in place. Analysis JSON still has no timestamps.

### Added

- Keyboard `5` copies last open issuer hour through the new last-open-issuer copy control, using one-line Markdown. Honest empty when none. Ignored while typing. Distinct from `$` first-open-issuer copy.
- Keyboard `6` jumps to the last-open-issuer-hour copy control, or the Gantt heading if that control is missing. Does not copy. Ignored while typing. Distinct from `^` first-open-issuer jump.
- Keyboard `7` jumps to the hide-weekend-issuer-open Gantt filter, or the Gantt heading if that control is missing. Ignored while typing. Distinct from backtick hide-issuer-open.
- Sunday early issuer open (synthetic) preset: same 72-hour calendar as Normal Friday, Sunday 08:00 to 10:00 treats the issuer gate as open even though Sunday is not a business day. Distinct from Sunday late issuer close, Sunday early payout open, Sunday late payout close, Sunday late bank close, Saturday late payout open, Friday early payout open, Saturday early payout open, Saturday early FX open, Friday late FX close, Monday late issuer open, Early Monday bank open, Thin Saturday FX, Payday Friday, Public-holiday Monday, Saturday market burst, Sunday stall close, Long-weekend, and Compressed Friday. Synthetic. Not a bank feed.
- Filter that hides Gantt hours that are weekend and issuer-open. Display only; the model still contains 72 hours. Workspace JSON stores optional `hideWeekendIssuerOpenGanttHours`. Older files omit the key and show all hours. Unknown keys are rejected. Distinct from `hideIssuerOpenGanttHours` and `hideWeekendGanttHours`. The selected hour stays visible if it would otherwise hide.

## 1.5.16 - 2026-09-10

A workshop follow-up on 1.5.15. Weekend Gap remains a local-first decision aid, not a decision maker. Hatched Gantt cells are a local drawing, not a bank feed. Timing review packets from 1.5.0 and the 1.5.1-1.5.15 review UI stay in place. Analysis JSON still has no timestamps.

### Added

- Keyboard `$` copies first open issuer hour through the existing copy control, using the same Markdown. Ignored while typing. Distinct from `*` first-open-bank copy.
- Keyboard `^` jumps to the first-open-issuer-hour copy control, or the Gantt heading if that control is missing. Does not copy. Ignored while typing. Distinct from `&` first-open-bank jump.
- Keyboard backtick jumps to the hide-issuer-open Gantt filter, or the Gantt heading if that control is missing. Ignored while typing. Distinct from `%` hide-FX-open.
- Sunday late issuer close (synthetic) preset: same 72-hour calendar as Normal Friday, Sunday 16:00 to 18:00 treats the issuer gate as open even though Sunday is not a business day. Distinct from Sunday late bank close, Sunday late payout close, Sunday early payout open, Saturday late payout open, Friday early payout open, Saturday early payout open, Saturday early FX open, Friday late FX close, Monday late issuer open, Early Monday bank open, Thin Saturday FX, Payday Friday, Public-holiday Monday, Saturday market burst, Sunday stall close, Long-weekend, and Compressed Friday. Synthetic. Not a bank feed.
- Filter that hides Gantt hours where the issuer gate is open. Display only; the model still contains 72 hours. Workspace JSON stores optional `hideIssuerOpenGanttHours`. Older files omit the key and show all hours. Unknown keys are rejected. Distinct from `hideIssuerClosedGanttHours` and `hideBankOpenGanttHours`. The selected hour stays visible if it would otherwise hide.

## 1.5.15 - 2026-09-10

A workshop follow-up on 1.5.14. Weekend Gap remains a local-first decision aid, not a decision maker. Hatched Gantt cells are a local drawing, not a bank feed. Timing review packets from 1.5.0 and the 1.5.1-1.5.14 review UI stay in place. Analysis JSON still has no timestamps.

### Added

- Keyboard `*` copies first open bank hour through the existing copy control, using the same Markdown. Ignored while typing. Distinct from `(` first-open-FX copy and `~` first-open-payout copy.
- Keyboard `&` jumps to the first-open-bank-hour copy control, or the Gantt heading if that control is missing. Does not copy. Ignored while typing. Distinct from `)` first-open-FX jump.
- Keyboard `%` jumps to the hide-FX-open Gantt filter, or the Gantt heading if that control is missing. Ignored while typing. Distinct from `#` hide-payout-open.
- Sunday early payout open (synthetic) preset: same 72-hour calendar as Normal Friday, payout gate opens Sunday morning from 08:00 to 10:00. Distinct from Saturday late payout open, Friday early payout open, Saturday early payout open, Sunday late payout close, Sunday late bank close, Saturday early FX open, Friday late FX close, Monday late issuer open, Early Monday bank open, Thin Saturday FX, Payday Friday, Public-holiday Monday, Saturday market burst, Sunday stall close, Long-weekend, and Compressed Friday. Synthetic. Not a bank feed.
- Filter that hides Gantt hours where the bank gate is open. Display only; the model still contains 72 hours. Workspace JSON stores optional `hideBankOpenGanttHours`. Older files omit the key and show all hours. Unknown keys are rejected. Distinct from `hideBankClosedGanttHours` and `hideFxOpenGanttHours`. The selected hour stays visible if it would otherwise hide.
- Print and print redacted include the first open bank hour as one line, with an honest empty when none. Counts of modeled hours, not a bank calendar. Redacted print stays redacted. The saved scenario is unchanged. Analysis JSON still has no timestamps.
- Copy first open issuer hour label as one-line Markdown with an honest empty when none exists. Clipboard write has a textarea fallback. Distinct from first-open-bank copy and first-closed-issuer copy. Synthetic, not live.

## 1.5.14 - 2026-09-10

A workshop follow-up on 1.5.13. Weekend Gap remains a local-first decision aid, not a decision maker. Hatched Gantt cells are a local drawing, not a bank feed. Timing review packets from 1.5.0 and the 1.5.1-1.5.13 review UI stay in place. Analysis JSON still has no timestamps.

### Added

- Keyboard `(` copies first open FX hour through the existing copy control, using the same Markdown. Ignored while typing. Distinct from `~` first-open-payout copy and `}` first-closed-FX copy.
- Keyboard `)` jumps to the first-open-FX-hour copy control, or the Gantt heading if that control is missing. Does not copy. Ignored while typing. Distinct from `!` first-open-payout jump.
- Keyboard `#` jumps to the hide-payout-open Gantt filter, or the Gantt heading if that control is missing. Ignored while typing. Distinct from `@` hide-FX-closed.
- Saturday late payout open (synthetic) preset: same 72-hour calendar as Normal Friday, payout gate opens Saturday evening from 18:00 to 20:00. Distinct from Friday early payout open, Saturday early payout open, Sunday late payout close, Sunday late bank close, Saturday early FX open, Friday late FX close, Monday late issuer open, Early Monday bank open, Thin Saturday FX, Payday Friday, Public-holiday Monday, Saturday market burst, Sunday stall close, Long-weekend, and Compressed Friday. Synthetic. Not a bank feed.
- Filter that hides Gantt hours where FX is weekday-depth / open. Display only; the model still contains 72 hours. Workspace JSON stores optional `hideFxOpenGanttHours`. Older files omit the key and show all hours. Unknown keys are rejected. Distinct from `hideFxClosedGanttHours` and `hidePayoutOpenGanttHours`. The selected hour stays visible if it would otherwise hide.
- Print and print redacted include the first open FX hour as one line, with an honest empty when none. Counts of modeled hours, not a bank calendar. Redacted print stays redacted. The saved scenario is unchanged. Analysis JSON still has no timestamps.
- Copy first open bank hour label as one-line Markdown with an honest empty when none exists. Clipboard write has a textarea fallback. Distinct from first-open-FX copy. Local drawing, not a live bank feed.

## 1.5.13 - 2026-09-10

A workshop follow-up on 1.5.12. Weekend Gap remains a local-first decision aid, not a decision maker. Hatched Gantt cells are a local drawing, not a bank feed. Timing review packets from 1.5.0 and the 1.5.1-1.5.12 review UI stay in place. Analysis JSON still has no timestamps.

### Added

- Keyboard `~` copies first open payout hour through the existing copy control, using the same Markdown. Ignored while typing. Distinct from `}` first-closed-FX copy and `"` first-closed-payout copy.
- Keyboard `!` jumps to the first-open-payout-hour copy control, or the Gantt heading if that control is missing. Does not copy. Ignored while typing. Distinct from `+` first-closed-FX jump.
- Keyboard `@` jumps to the hide-FX-closed Gantt filter, or the Gantt heading if that control is missing. Ignored while typing. Distinct from `|` hide-payout-closed.
- Friday early payout open (synthetic) preset: same 72-hour calendar as Normal Friday, payout gate opens Friday evening from 18:00 to 20:00, earlier than Saturday early payout open. Distinct from Saturday early payout open, Sunday late payout close, Sunday late bank close, Saturday early FX open, Friday late FX close, Monday late issuer open, Early Monday bank open, Thin Saturday FX, Payday Friday, Public-holiday Monday, Saturday market burst, Sunday stall close, Long-weekend, and Compressed Friday. Synthetic. Not a bank feed.
- Filter that hides Gantt hours where the payout gate is open. Display only; the model still contains 72 hours. Workspace JSON stores optional `hidePayoutOpenGanttHours`. Older files omit the key and show all hours. Unknown keys are rejected. Distinct from `hidePayoutClosedGanttHours`, `hideFxClosedGanttHours`, `hideIssuerClosedGanttHours`, `hideBankClosedGanttHours`, `hideClosedGanttHours`, and `hideOpenGanttHours`. The selected hour stays visible if it would otherwise hide.
- Print and print redacted include the first open payout hour as one line, with an honest empty when none. Counts of modeled hours, not a bank calendar. Redacted print stays redacted. The saved scenario is unchanged. Analysis JSON still has no timestamps.
- Copy first open FX hour label as one-line Markdown with an honest empty when none exists. Clipboard write has a textarea fallback. Distinct from first-open-payout copy, first-closed-FX copy, and first-closed-payout copy. Local drawing, not a live FX feed.

## 1.5.12 - 2026-09-10

A workshop follow-up on 1.5.11. Weekend Gap remains a local-first decision aid, not a decision maker. Hatched Gantt cells are a local drawing, not a bank feed. Timing review packets from 1.5.0 and the 1.5.1-1.5.11 review UI stay in place. Analysis JSON still has no timestamps.

### Added

- Keyboard `}` copies first closed FX hour through the existing copy control, using the same Markdown. Ignored while typing. Distinct from `"` first-closed-payout copy and `:` first-closed-issuer copy. Local drawing, not a live FX feed.
- Keyboard `+` jumps to the first-closed-FX-hour copy control, or the Gantt heading if that control is missing. Does not copy. Ignored while typing. Distinct from `_` first-closed-payout jump.
- Keyboard `|` jumps to the hide-payout-closed Gantt filter, or the Gantt heading if that control is missing. Ignored while typing. Distinct from `{` hide-issuer-closed.
- Saturday early payout open (synthetic) preset: same 72-hour calendar as Normal Friday, payout gate opens Saturday morning from 07:00 to 09:00, earlier than Sunday late payout close. Distinct from Sunday late payout close, Sunday late bank close, Saturday early FX open, Friday late FX close, Monday late issuer open, Early Monday bank open, Thin Saturday FX, Payday Friday, Public-holiday Monday, Saturday market burst, Sunday stall close, Long-weekend, and Compressed Friday. Synthetic. Not a bank feed.
- Filter that hides Gantt hours where the FX gate is closed. Display only; the model still contains 72 hours. Workspace JSON stores optional `hideFxClosedGanttHours`. Older files omit the key and show all hours. Unknown keys are rejected. Distinct from `hidePayoutClosedGanttHours`, `hideIssuerClosedGanttHours`, `hideBankClosedGanttHours`, `hideClosedGanttHours`, `hideOpenGanttHours`, `hideWeekendGanttHours`, `hideWeekdayGanttHours`, `hideZeroQueueGanttHours`, every-gate-closed, and single-gate closed-only filters. The selected hour stays visible if it would otherwise hide.
- Print and print redacted include the first closed FX hour as one line, with an honest empty when none. Counts of modeled hours, not a bank calendar. Redacted print stays redacted. The saved scenario is unchanged. Analysis JSON still has no timestamps.
- Copy first open payout hour label as one-line Markdown with an honest empty when none exists. Clipboard write has a textarea fallback. Distinct from first-closed-payout copy, first-closed-FX copy, first-closed-issuer copy, and first-closed-bank copy. Synthetic, not live.

## 1.5.11 - 2026-09-10

A workshop follow-up on 1.5.10. Weekend Gap remains a local-first decision aid, not a decision maker. Hatched Gantt cells are a local drawing, not a bank feed. Timing review packets from 1.5.0 and the 1.5.1-1.5.10 review UI stay in place. Analysis JSON still has no timestamps.

### Added

- Keyboard `"` copies first closed payout hour through the existing copy control, using the same Markdown. Ignored while typing. Distinct from `:` first-closed-issuer copy and `'` first-closed-bank copy.
- Keyboard `_` jumps to the first-closed-payout-hour copy control, or the Gantt heading if that control is missing. Ignored while typing.
- Keyboard `{` jumps to the hide-issuer-closed Gantt filter, or the Gantt heading if that control is missing. Ignored while typing. Distinct from `=` hide-bank-closed.
- Sunday late payout close (synthetic) preset: same 72-hour calendar as Normal Friday, Sunday 16:00 to 18:00 treats the payout gate as open even though Sunday is not a business day. Distinct from Sunday late bank close, Sunday stall close, Saturday early FX open, Friday late FX close, Monday late issuer open, Early Monday bank open, Thin Saturday FX, Payday Friday, Public-holiday Monday, Saturday market burst, Long-weekend, and Compressed Friday. Synthetic. Not a bank feed.
- Filter that hides Gantt hours where the payout gate is closed. Display only; the model still contains 72 hours. Workspace JSON stores optional `hidePayoutClosedGanttHours`. Older files omit the key and show all hours. Unknown keys are rejected. Distinct from `hideWeekdayGanttHours`, `hideWeekendGanttHours`, `hideOpenGanttHours`, `hideClosedGanttHours`, `hideZeroQueueGanttHours`, `hideBankClosedGanttHours`, `hideIssuerClosedGanttHours`, every-gate-closed, and single-gate closed-only filters. The selected hour stays visible if it would otherwise hide.
- Print and print redacted include the first closed payout hour as one line, with an honest empty when none. Counts of modeled hours, not a bank calendar. Redacted print stays redacted. The saved scenario is unchanged. Analysis JSON still has no timestamps.
- Copy first closed FX hour label as one-line Markdown with an honest empty when none exists. Clipboard write has a textarea fallback. Distinct from first-closed-issuer copy, first-closed-bank copy, and first-closed-payout copy. Local drawing, not a live FX feed.

## 1.5.10 - 2026-09-10

A workshop follow-up on 1.5.9. Weekend Gap remains a local-first decision aid, not a decision maker. Hatched Gantt cells are a local drawing, not a bank feed. Timing review packets from 1.5.0 and the 1.5.1-1.5.9 review UI stay in place. Analysis JSON still has no timestamps.

### Added

- Keyboard `:` copies first closed issuer hour through the existing copy control, using the same Markdown. Ignored while typing. Distinct from `'` first-closed-bank copy.
- Keyboard `-` jumps to the first-closed-issuer-hour copy control, or the Gantt heading if that control is missing. Ignored while typing.
- Keyboard `=` jumps to the hide-bank-closed Gantt filter, or the Gantt heading if that control is missing. Ignored while typing. Distinct from `>` hide-zero-queue.
- Sunday late bank close (synthetic) preset: same 72-hour calendar as Normal Friday, Sunday 16:00 to 18:00 treats the bank gate as open even though Sunday is not a business day. Distinct from Sunday stall close, Saturday early FX open, Friday late FX close, Monday late issuer open, Early Monday bank open, Thin Saturday FX, Payday Friday, Public-holiday Monday, Saturday market burst, Long-weekend, and Compressed Friday. Synthetic. Not a bank feed.
- Filter that hides Gantt hours where the issuer gate is closed. Display only; the model still contains 72 hours. Workspace JSON stores optional `hideIssuerClosedGanttHours`. Older files omit the key and show all hours. Unknown keys are rejected. Distinct from `hideWeekdayGanttHours`, `hideWeekendGanttHours`, `hideOpenGanttHours`, `hideClosedGanttHours`, `hideZeroQueueGanttHours`, `hideBankClosedGanttHours`, every-gate-closed, and single-gate closed-only filters. The selected hour stays visible if it would otherwise hide.
- Print and print redacted include the first closed issuer hour as one line, with an honest empty when none. Counts of modeled hours, not a bank calendar. Redacted print stays redacted. The saved scenario is unchanged. Analysis JSON still has no timestamps.
- Copy first closed payout hour label as one-line Markdown with an honest empty when none exists. Clipboard write has a textarea fallback. Distinct from first-closed-FX copy, first-closed-bank copy, and first-closed-issuer copy. Synthetic, not live.

## 1.5.9 - 2026-09-10

A workshop follow-up on 1.5.8. Weekend Gap remains a local-first decision aid, not a decision maker. Hatched Gantt cells are a local drawing, not a bank feed. Timing review packets from 1.5.0 and the 1.5.1-1.5.8 review UI stay in place. Analysis JSON still has no timestamps.

### Added

- Keyboard `'` copies first closed bank hour through the existing copy control, using the same Markdown. Ignored while typing.
- Keyboard `<` jumps to the first-closed-bank-hour copy control, or the Gantt heading if that control is missing. Ignored while typing.
- Keyboard `>` jumps to the hide-zero-queue Gantt filter, or the Gantt heading if that control is missing. Ignored while typing.
- Saturday early FX open (synthetic) preset: same 72-hour calendar as Normal Friday, FX window opens Saturday morning earlier than Thin Saturday FX, Friday late FX close, Monday late issuer open, and Early Monday bank open. Distinct from Normal Friday, Long-weekend Friday start, Compressed Friday close, Payday Friday burst, Public-holiday Monday, Saturday market burst, and Sunday stall close. Synthetic. Not a bank feed.
- Filter that hides Gantt hours where the bank gate is closed. Display only; the model still contains 72 hours. Workspace JSON stores optional `hideBankClosedGanttHours`. Older files omit the key and show all hours. Unknown keys are rejected. Distinct from `hideWeekdayGanttHours`, `hideWeekendGanttHours`, `hideOpenGanttHours`, `hideClosedGanttHours`, `hideZeroQueueGanttHours`, every-gate-closed, and single-gate closed-only filters. The selected hour stays visible if it would otherwise hide.
- Print and print redacted include the first closed bank hour as one line, with an honest empty when none. Counts of modeled hours, not a bank calendar. Redacted print stays redacted. The saved scenario is unchanged. Analysis JSON still has no timestamps.
- Copy first closed issuer hour label as one-line Markdown with an honest empty when none exists. Clipboard write has a textarea fallback. Distinct from first-closed-FX copy and first-closed-bank copy. Synthetic, not live.

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
