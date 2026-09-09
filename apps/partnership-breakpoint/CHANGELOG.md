# Changelog

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
