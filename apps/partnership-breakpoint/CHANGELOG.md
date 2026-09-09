# Changelog

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
