# Changelog

## 1.5.0 - 2026-09-10

- Add one optional package review for margins, floors/vetoes, dominance, substitutions, rollbacks, threshold/budget scenarios, lock costs and targeted uncertainty.
- Export and inspect bounded review packets without replacing the current workshop, with exact recomputation and stale-read cancellation.
- Preserve all 1.4.3 workshop, CSV, workspace, lock and preset features.


## 1.4.3 - 2026-09-09

A workshop follow-up. The solver is still a decision aid, not a decision maker.

### Added

- Formula-safe clause options CSV import and export with named errors. Matching ids keep support scores; new options start at 50.
- Keyboard `l` jumps to the first locked clause, or the lock controls. Ignored while typing in an input, select, or text area.
- Filter participant groups to veto-only. Hidden groups still count in the model.
- Copy the veto-blocker list as Markdown. It is a numerical constraint list, not a legitimacy claim.
- Compare two workshop JSON files by group and clause identifiers. Missing ids are listed rather than filled with zeros.
- Persist compact or comfortable clause card density in version-1 workspace JSON and local workspace prefs. The solver ignores density.
- Export current locks as re-importable JSON. Import replaces every lock. Unknown ids fail closed.
- Keyboard `/` focuses the clause filter. Shortcut help documents it because `f` already focuses the filter.
- Undoable reset of one group's support scores to blank. The draft is invalid until those cells are filled.
- Library Quiet Hours preset: synthetic readers, families, and library staff scoring evening hours, children's-area sound rules, and after-hours events.

## 1.4.2 - 2026-09-09

A facilitator follow-up. The solver is still a decision aid, not a decision maker.

### Added

- Formula-safe discussion worksheet CSV with groups, weights, clause options, and facilitator notes as text. Support scores are omitted.
- Keyboard `n` focuses Add group when focus is not in an input, select, or text area. The shortcut help documents it.
- Clear all locks in one undoable step.
- Lock or unlock one option from the clause card, without applying a whole package.
- Highlight groups whose veto is not met on the inspected package. That is a numerical constraint, not a legal right or a legitimacy claim.
- Copy the recommended package as compact Markdown.
- Import participant groups from CSV (`name`, `weight`, optional `min_support` and `veto`, plus `clauseId:optionId` support columns). Unknown columns and invalid values fail with named errors.
- Print facilitator pack hides the workshop tour and keeps original vs solver vs pin, notes, and veto highlights.
- Preview then apply renormalized group weights that sum to 1. Any invalid weight is rejected.
- Club Constitution preset: synthetic members, officers, and staff scoring quorum, proxy, and guest-speaker clauses.

## 1.4.1 - 2026-09-09

A workshop follow-up. The solver is still a decision aid, not a decision maker.

### Added

- Three-column package pin: original selections, solver recommendation, and the custom package, with matching group scores.
- Lock a whole package (the recommendation or a near-miss row) onto every clause in one undoable step.
- Sort displayed near misses by approval gap or change cost. Sorting does not change which combinations the solver retained.
- Live region when the clause filter matches zero cards. Hidden cards still count in the model.
- Duplicate a participant group with a unique id, copied weight, optional floor and veto, and copied support scores.
- Optional `clauses[].note`: a 1 to 240 character facilitator reminder. The solver ignores it. The discussion worksheet and print readout show it. Omitted notes keep old JSON valid.
- Keyboard `f` focuses the clause filter when focus is not in an input, select, or text area.

## 1.4.0 - 2026-09-09

A deliberation workshop release. Passing packages remain a decision aid, not a collective decision, legal agreement, or claim of optimal politics.

### Added

- Clause contribution: each selected option's weighted support versus the original wording, and how that delta pulls overall approval equally across clauses.
- Group contribution: each group's pull is its weight share times its average support (`weight_share`). Pulls sum to the change in overall approval.
- Near-miss explorer: cheaper constraint-compliant misses, closest misses, and later packages over the threshold, with approval-point and cost gaps.
- Optional `groups[].veto`. The group's average must meet the overall threshold, or `max(threshold, minSupport)` when a floor is also set. Omitted or `false` is dropped from canonical JSON, so old drafts stay valid.
- Support-matrix CSV import and export (`clause_id,option_id` plus every group id). Formula-like cells are neutralized or rejected. Named errors cover missing headers, unknown ids, duplicate rows, truncated rows, and invalid scores. Import does not change labels, costs, locks, or constraints.
- Try this option: lock one alternative, re-run search on remaining unlocked clauses, and preview before apply. Apply is a normal draft edit and can be undone.
- Leave-one-group-out sensitivity using the omit method: remaining weights are used as written, which renormalizes them. Not a forecast.
- First-run coach for threshold, locks, budget, and review. Stored as dismissed in `localStorage`. Skipped on share-link load. Escape closes it. Show workshop tour reopens it.
- Keyboard shortcuts: `?` help, `u` undo, `r` redo, `e` export JSON, `s` jump to the live recommendation. Ignored while typing in inputs.
- Side-by-side original selections versus the solver recommendation.
- Workplace Hybrid preset: on-site staff, remote staff, and managers, with presence, hours, and desk clauses.
- Clause filter by title or option label. Hidden cards still count in the model.
- Printable discussion worksheet and a plain-text worksheet download. Unmarked boxes; not a recorded vote.
- Duplicate clause, duplicate alternative, and move clause up or down (clause order is the last documented tie breaker).
- Weight-share table and leftover change-cost budget on a recommendation.
- Clearer downside stress-test slider synced with the exact drop input.

### Changed

- Constraint checks and evidence CSV report vetoes. Rejection counts can overlap across budget, floors, and vetoes.
- Method copy names veto alongside floors, budget, and locks.

## 1.3.0 - 2026-09-09

Undo/redo, named snapshots, ranked passing packages, custom package evaluation, downside support test, evidence CSV, Markdown briefs, and a printable readout. See README for details.
