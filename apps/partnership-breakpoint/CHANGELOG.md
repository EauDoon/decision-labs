# Changelog

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
