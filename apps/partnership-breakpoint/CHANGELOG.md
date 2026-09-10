# Changelog

## 1.5.6

- Keeps the 1.5.0 constraint review and 1.5.1/1.5.2/1.5.3/1.5.4/1.5.5 review UI: `createPartnershipReviewPacket`, `replayPartnershipReviewPacket`, `PARTNERSHIP_REVIEW_TOOLS`, `analyzePartnershipReview`, waterfall SVG, copy waterfall, persisted hide holders, Talent/agent/platform, ledger all-hold filter, Three-party joint venture, Podcast host and network, first-breakpoint snapshot, Community hall split, and keys `f` `w` `l` `b` `c` `p` `t` `d` `k` `h` `a` `m` `v` `i` `o` `j` `q`.
- Press `x` to jump to the first roster row currently over listed capacity, or the Participants heading if none, when no field is focused. Shortcuts stay ignored while a field is focused.
- Press `y` to copy deal notes as one-line Markdown, or an honest empty line when notes are omitted. Clipboard falls back to a textarea. It is not a forecast.
- Press `z` to jump to Copy deal title and currency, or the Shared deal heading if that control is missing, when no field is focused.
- Added the Festival stall split starting point, a three-party stallholder plus site manager plus ticket office with different cost bases, distinct from Balanced, Thin Margin, Growth at a Cost, Creator take-rate, Three-party JV, Two-party 50/50 studio, Four-party marketplace, Licensor and distributor, Talent, agent, and platform, Three-party joint venture, Podcast host and network, and Community hall split. It is a synthetic starting point, not a live roster.
- Hide participants whose current volume headroom is at or above a hold with no listed capacity breach now travels on saved case JSON as optional `hideParticipantsAtHold`. Older files omit it and default to showing those roster rows. Unknown sibling fields are still rejected. Display only; the solver is unchanged. `hideHoldingParticipants`, `hideAllHoldLedger`, `hideZeroShareParticipants`, and `hideParticipantsOverCapacity` stay available.
- Print one-pager includes a currency code line when the case is valid. The saved case is unchanged.
- Copy first-breakpoint participant label copies a one-line Markdown name with a synthetic-not-forecast notice. Clipboard falls back to a textarea. It is distinct from capacity utilization and allocation-balance copy.

## 1.5.5

- Keeps the 1.5.0 constraint review and 1.5.1/1.5.2/1.5.3/1.5.4 review UI: `createPartnershipReviewPacket`, `replayPartnershipReviewPacket`, `PARTNERSHIP_REVIEW_TOOLS`, `analyzePartnershipReview`, waterfall SVG, copy waterfall, persisted hide holders, Talent/agent/platform, ledger all-hold filter, Three-party joint venture, Podcast host and network, first-breakpoint snapshot, and keys `f` `w` `l` `b` `c` `p` `t` `d` `k` `h` `a` `m` `v`.
- Press `i` to jump to the inspect or compare cases heading when no field is focused. Shortcuts stay ignored while a field is focused.
- Press `o` to jump to the Operating region heading when no field is focused.
- Press `j` to copy capacity utilization as Markdown. Clipboard falls back to a textarea. It is a display, not a forecast.
- Press `q` to jump to Equal split, or Normalize current shares if that control is missing, when no field is focused.
- Added the Community hall split starting point, a three-party venue plus promoter plus sound with different cost bases, distinct from Balanced, Thin Margin, Growth at a Cost, Creator take-rate, Three-party JV, Two-party 50/50 studio, Four-party marketplace, Licensor and distributor, Talent, agent, and platform, Three-party joint venture, and Podcast host and network. It is a synthetic starting point, not a live roster.
- Hide participants whose volume is above listed capacity now travels on saved case JSON as optional `hideParticipantsOverCapacity`. Older files omit it and default to showing those roster rows. Unknown sibling fields are still rejected. Display only; the solver is unchanged. `hideHoldingParticipants`, `hideAllHoldLedger`, and `hideZeroShareParticipants` stay available.
- Copy deal title and currency copies a one-line Markdown summary, or an honest empty line when both are omitted. Clipboard falls back to a textarea. It is display text, not a forecast.
- Print one-pager includes a deal title line when the case is valid. The saved case is unchanged.

## 1.5.4

- Keeps the 1.5.0 constraint review and 1.5.1/1.5.2/1.5.3 review UI: `createPartnershipReviewPacket`, `replayPartnershipReviewPacket`, `PARTNERSHIP_REVIEW_TOOLS`, `analyzePartnershipReview`, waterfall SVG, copy waterfall, persisted hide holders, Talent/agent/platform, ledger all-hold filter, Three-party joint venture, and keys `f` `w` `l` `b` `c` `p` `t` `d` `k`.
- Press `h` to jump to the least-headroom participant card, or the Participants heading if none, when no field is focused. Shortcuts stay ignored while a field is focused.
- Press `a` to jump to Add participant when no field is focused.
- Press `m` to jump to deal notes when no field is focused.
- Press `v` to jump to the viability card when no field is focused.
- Copy allocation balance names missing or excess revenue share, or an honest empty line when shares are missing. Clipboard falls back to a textarea. It is not a negotiated allocation.
- Added the Podcast host and network starting point, a two-party host plus network with different cost bases, distinct from Balanced, Thin Margin, Growth at a Cost, Creator take-rate, Three-party JV, Two-party 50/50 studio, Four-party marketplace, Licensor and distributor, Talent, agent, and platform, and Three-party joint venture. It is a synthetic starting point, not a live roster.
- Hide participants with zero revenue share now travels on saved case JSON as optional `hideZeroShareParticipants`. Older files omit it and default to showing those roster rows. Unknown sibling fields are still rejected. Display only; the solver is unchanged. `hideHoldingParticipants` and `hideAllHoldLedger` stay available.
- Print one-pager includes an allocation-balance line when the case is valid. The saved case is unchanged.
- Copy first-breakpoint snapshot copies a one-line Markdown ranking with a synthetic-not-forecast notice. Clipboard falls back to a textarea. It is distinct from tornado, waterfall, operating-region, and allocation-balance copy.

## 1.5.3

- Keeps the 1.5.0 constraint review and 1.5.1/1.5.2 review UI: `createPartnershipReviewPacket`, `replayPartnershipReviewPacket`, `PARTNERSHIP_REVIEW_TOOLS`, `analyzePartnershipReview`, waterfall SVG, copy waterfall, persisted hide holders, Talent/agent/platform, ledger all-hold filter, and keys `f` `w` `l` `b` `c` `p`.
- Press `t` to jump to the tornado chart heading when no field is focused. Shortcuts stay ignored while a field is focused.
- Copy tornado copies each participant, shock axis, and bounded percentage as Markdown. Clipboard falls back to a textarea. It is a comparison aid, not a forecast.
- Press `d` to jump to the Shared deal heading, which includes deal notes, when no field is focused.
- Copy operating region copies the displayed fee and volume sensitivity grid as Markdown. Display only.
- Added the Three-party joint venture starting point, a synthetic operator plus capital partner plus operator-talent with different cost bases, distinct from Balanced, Two-party 50/50 studio, Four-party marketplace, Licensor and distributor, Talent, agent, and platform, and Three-party JV. It is a synthetic starting point, not a live roster.
- Hide participants who hold in every tested compound case now travels on saved case JSON as optional `hideAllHoldLedger`. Older files omit it and default to showing those ledger rows. Unknown sibling fields are still rejected. Display only; counts stay unchanged.
- Press `k` to jump to the Compound stress heading, which includes Inspect cases, when no field is focused.
- Copy tested split copies hold counts and whether a fixed split is available as Markdown. Clipboard falls back to a textarea. Counts are counts. It is not a probability.
- Hide unbounded shocks filters unbounded or impossible shocks from the tornado chart and table. Restore shows all. Display only. Model math is unchanged.
- Print one-pager includes the least-headroom participant line when the case is valid. The saved case is unchanged.

## 1.5.2

- Keeps the 1.5.0 constraint review and 1.5.1 review UI: `createPartnershipReviewPacket`, `replayPartnershipReviewPacket`, `PARTNERSHIP_REVIEW_TOOLS`, `analyzePartnershipReview`, exact recompute, stale-read cancel, and no replacement of the working case.
- Press `f` to jump to the First breakpoint heading when no field is focused. Shortcuts stay ignored while a field is focused.
- Copy contribution waterfall copies each participant, contribution per transaction, and revenue share as Markdown. Clipboard falls back to a textarea. It is a comparison aid, not a forecast.
- Press `w` to jump to the Contribution waterfall heading when no field is focused.
- Copy the viability card copies the least-headroom participant, headroom, and binding limit as Markdown. Clipboard falls back to a textarea. Counts are counts. It is not a probability.
- Hide participants who currently hold now travels on saved case JSON as optional `hideHoldingParticipants`. Older files omit it and default to showing holders. Unknown sibling fields are still rejected. Display only; counts stay unchanged.
- Added the Talent, agent, and platform starting point, a three-party talent plus booking agent plus platform with different cost bases, distinct from Balanced, Two-party 50/50 studio, Four-party marketplace, and Licensor and distributor. It is a synthetic starting point, not a live roster.
- Copy capacity utilization copies volume over capacity, or Unbounded, as Markdown. Clipboard falls back to a textarea. Display only. It is not a probability.
- Hide participants who hold in every tested compound case filters the participant ledger display only. Expand restores them. Grid counts stay unchanged. Model math is unchanged.
- Press `l` to jump to the Participant ledger heading when no field is focused.
- Press `b` to jump to the viability and binding-limit card heading when no field is focused.
- Results jump nav includes Viability and Waterfall in-page links with visible focus.

## 1.5.1

- Keeps the 1.5.0 constraint review: `createPartnershipReviewPacket`, `replayPartnershipReviewPacket`, `PARTNERSHIP_REVIEW_TOOLS`, exact recompute, stale-read cancel, and no replacement of the working case.
- Download contribution waterfall SVG writes every participant chart as one namespaced SVG file with the same XML declaration as tornado. Invalid cases are refused.
- Press `c` to jump to the snapshot or imported JSON compare heading. Shortcuts stay ignored while a field is focused.
- Copy first breakpoint copies the displayed participant, shock axis, and magnitude as Markdown. Clipboard falls back to a textarea. It is a comparison aid, not a forecast.
- Hide participants who currently hold filters the roster display only. Expand restores them. Tested-case and model counts stay unchanged.
- Press `p` to print the one-pager when the case is valid, the same as the print control. Ignored in inputs.
- Swap with next exchanges two adjacent participants. Identifiers and shares stay with each person. The last row is disabled. Undo restores the previous order.
- Added the Licensor and distributor starting point, a two-party IP licensor plus territory distributor with different cost bases, distinct from Balanced, Creator take-rate, Three-party JV, Two-party 50/50 studio, and Four-party marketplace.
- Copy share-to-hold preview copies an open preview as Markdown. Clipboard falls back to a textarea. It is a solvability result, not a probability.
- Collapse cases every participant holds now travels on saved case JSON as optional `collapseAllHoldCases`. Older files omit it and default to expanded. Unknown sibling fields are still rejected.
- Copy deal notes copies entered notes, or an honest empty line, as Markdown. Clipboard falls back to a textarea. Notes are user-entered text, not a forecast.

## 1.5.0

- Optional constraint review covers effective-volume intervals, independent slack, fixed and variable cost allowances, funding shares, fee and volume scenarios, operational conflicts, and zero-volume obligations.
- Export and inspect bounded input-bound review packets with recomputation, exact result checks, stale-read cancellation, and no replacement of the working case.
- Retains all 1.4.3 roster, comparison, export, print, keyboard and preset features.


## 1.4.3

- Export participant CSV uses the same columns as import, with formula-safe cells. Empty optional capacity and commitment stay blank so a later import restores null. Identifiers are omitted because import regenerates them.
- Press `n` to focus Add participant, or add one if that control is missing. Shortcuts stay ignored while a field is focused.
- Download tornado SVG writes the displayed chart as a standalone SVG file with an XML declaration and SVG namespace.
- Compare current case with imported JSON aligns participants by identifier. Missing identifiers are labeled rather than filled with zeros. The compare does not replace the draft.
- A shared display name on two participants shows a warning. It does not block edits and is not a legitimacy claim.
- Paste a TSV or CSV roster into the textarea. Tabs on the first line parse as TSV, then the same CSV validation applies. Deal terms are unchanged.
- Press `s` to jump to share-to-hold (the preview if it is open, otherwise the first solver).
- Print redacted uses Participant 1 through N on the print path and in the print stylesheet. The saved case is unchanged.
- Copy visible cases CSV copies the currently displayed stress-grid rows, including after collapsing all-hold cases. It does not replace the download control. Clipboard falls back to a textarea.
- Added the Four-party marketplace starting point, distinct from Balanced, Creator take-rate, Three-party JV, and Two-party 50/50 studio.

## 1.4.2

- Added a volume-to-hold solver: binary search for the minimum monthly volume at which a named participant holds, with fee and shares fixed. Preview, then Apply. Impossible names the failing tests. This is a solvability result, not a forecast.
- Copy negotiation brief uses the Clipboard API when it exists; otherwise a visible textarea remains for copying. There is no download fallback.
- Stress-grid CSV uses the same formula-safe escaping as other CSVs. Export every tested case, or export the currently visible cases after collapsing all-hold rows. Participant rows stay complete.
- Press `g` to jump to the results nav, or the first results heading, when no field is focused.
- Print one-pager hides coach, help, and chrome, and keeps tornado, waterfall, ledger, and notes.
- Duplicate current case saves an independent snapshot with a unique ` copy` title suffix. Later draft edits do not change the snapshot.
- The roster highlights the first listed participant who fails the current baseline. The label is roster order, not a claim about who will act.
- The invalid-field summary stays sticky until the count is 0 and still announces the count.
- Added the Two-party 50/50 studio starting point, distinct from Creator take-rate and Three-party JV.
- Collapse cases every participant holds hides those evidence rows from the inspect table only. Expand restores them. Tested-case counts are unchanged.

## 1.4.1

- Kept the results jump nav sticky at the top of the results column so in-page links stay visible while scrolling. Links remain keyboard accessible and are hidden in print.
- Added participant CSV import for name, revenue share, variable cost, fixed cost, min profit, optional capacity, commitment, and risk. Formula prefixes are stored as text. Named row and column errors reject the file. A valid file replaces participants only; deal terms are unchanged.
- Showed capacity utilization in the participant ledger as volume over capacity, or Unbounded when capacity is omitted, with an SVG meter and text.
- Added a three-snapshot compare: pin two saved snapshots against the current draft. The table reports profit and hold or fail per participant. Different identifier sets are labeled rather than filled with zeros.
- Stored optional deal notes (1 to 500 characters) on the case. Notes appear in printed and Markdown reports. Unknown sibling fields are rejected. Redacted export clears notes with the title.
- Trapped Tab inside the coach and help dialogs and restored focus to the opener on close.
- Included a sanitized deal title in export filenames (`partnership-breakpoint-harbor-jv.json`). Empty or unusable titles keep the previous names.
- Kept Duplicate, Move, and Remove usable at 390px outside the participant disclosure. Cards still default to open.
- Added Copy share URL in locally served http mode. File URLs hide the control. Hide in table on the stress ledger is display-only and does not change case counts or proposals.

## 1.4.0

- Added optional deal title (1 to 80 characters) and optional 3-letter uppercase currency display prefix. Omitted currency still shows units. Illegal strings are rejected rather than coerced.
- Added Duplicate, Move up, and Move down on the participant roster. Duplicates receive a unique id, a name suffix, and a zero share so the allocation total does not change.
- Removing a participant (while more than two remain) reallocates that share across whoever remains. Remaining shares sum to exactly 1. The last two participants cannot be removed.
- Added a share-to-hold solver: binary search for the minimum revenue share at which a named participant holds, with remaining participants keeping their relative leftover. Preview, then Apply. Impossible at 100% is reported without assigning probability.
- Added a fee-to-hold solver for the minimum fee at which every participant holds with volume and shares fixed. Preview, then Apply. Capacity and commitment failures cannot be repaired by a fee change.
- Added print-friendly SVG tornado and contribution waterfall charts, each with a text-equivalent table.
- Added a dismissible first-run coach (skipped when a share link loaded the case) and keyboard shortcuts: `?` help, `u` undo, `r` redo, `e` export JSON. Shortcuts never steal keys from inputs.
- Added honest redacted JSON export (names replaced with Participant 1..N, deal title cleared) and a copyable Markdown negotiation brief.
- Added Creator take-rate and Three-party JV starting points. Snapshot comparison now highlights profit diffs. Participant cards collapse on small screens, and the invalid-field control announces how many fields need attention.

## 1.3.0

- Added named local snapshots, participant comparisons, bounded undo and redo, and snapshot removal recovery.
- Added reproducible Markdown reports, spreadsheet-safe compound CSV, and printable assumptions.
- Added fee-floor diagnostics, explicit share allocation tools, and previewed compound-case application.
- Made saving failures visible, prevented stale imports from overwriting edits, and improved field errors and keyboard access.

## 1.2.0 (27-08-2026)

- Added simultaneous volume, fee, and variable-cost stress testing with up to 27 deterministic cases.
- Added per-participant hold counts, worst profit gaps, operating failures, and case evidence in the GUI.
- Added a fixed-share negotiation envelope and an explicit apply action. Proposals must fund all participants and pass every selected case before becoming available.
- Preserved v1 case imports and baseline calculations. Optional validated stress settings now travel with exported cases.
- Added model and standalone interaction regression tests for compound failures, funding limits, operational constraints, invalid inputs, escaped names, and proposal application.
- Rebuilt the no-install standalone GUI without new dependencies or network services.
