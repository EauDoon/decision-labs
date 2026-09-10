# Changelog

## 1.5.12 - 2026-09-10

A workshop follow-up on 1.5.11. The solver is still a decision aid, not a decision maker. A veto remains a number, not a legal right. Locks remain draft choices, not a legal hold or a recorded vote. Package review packets, replay, and AGREEMENT_REVIEW_TOOLS from 1.5.0 are unchanged.

### Added

- Keyboard `~` copies the first veto group label through the existing `#copy-first-veto-group-button` (same one-line Markdown). Ignored while typing. Distinct from `}` threshold-group count copy and `"` first below-floor group copy. A veto is a number you entered, not a legal right.
- Keyboard `!` jumps to that first veto group copy control, or the groups heading if missing. Ignored while typing. It does not copy.
- Keyboard `@` jumps to the hide-non-veto-groups control, or the groups heading if missing. Ignored while typing. Distinct from `|` hide-veto-groups.
- Swimming club hours preset: synthetic students, neighbours (a veto group), and P&C scoring pool open, lane lights, and lock-up. Distinct from Neighbourhood Plan, Library Quiet Hours, Sports Fixture Night, Market stall hours, Shared bike shed, Street stall lighting, Hall hire hours, Community garden watering, Shared laundry hours, Rooftop BBQ hours, School disco hours, Sports day hours, and Netball training hours. Not a recorded vote.
- Hide only the first veto-group row on screen. Hidden groups still count in the model. The solver is unchanged. Distinct from hideVetoGroups and hideNonVetoGroups. Workspace JSON persists the optional boolean and rejects unknown keys. Older files omit the key and default to show-all. If both hide-veto and hide-first-veto are on, the empty-groups notice is honest and model counts stay the same. A veto is a number you entered, not a legal right.
- Print facilitator pack includes the first veto group label as one line. Print redacted still uses Group 1 through Group N. Honest when none. A veto is a number you entered, not a legal right. The saved draft is unchanged.
- Copy the count of groups marked as a veto group as one-line Markdown, with a clipboard fallback. Honest zero. Distinct from threshold-group count copy and first veto group copy. A veto is a number you entered, not a legal right.

## 1.5.11 - 2026-09-10

A workshop follow-up on 1.5.10. The solver is still a decision aid, not a decision maker. A veto remains a number, not a legal right. Locks remain draft choices, not a legal hold or a recorded vote. Package review packets, replay, and AGREEMENT_REVIEW_TOOLS from 1.5.0 are unchanged.

### Added

- Keyboard `}` copies the groups-meeting-threshold count through the existing `#copy-threshold-group-count-button` (same one-line Markdown). Ignored while typing. Distinct from `"` first below-floor group copy and `:` below-floor count copy.
- Keyboard `+` (event.key plus, not equals) jumps to that threshold-group count copy control, or the groups or results heading if missing. Ignored while typing.
- Keyboard `|` jumps to the hide-veto-groups control, or the groups heading if missing. Ignored while typing. Distinct from `{` hide-groups-below-threshold.
- Netball training hours preset: synthetic students, neighbours (a veto group), and P&C scoring start time, court lights, and lock-up. Distinct from Neighbourhood Plan, Library Quiet Hours, Sports Fixture Night, Market stall hours, Shared bike shed, Street stall lighting, Hall hire hours, Community garden watering, Shared laundry hours, Rooftop BBQ hours, School disco hours, and Sports day hours. Not a recorded vote.
- Hide non-veto groups on screen. Hidden groups still count in the model. The solver is unchanged. Distinct from hideVetoGroups, vetoGroupsOnly, hideGroupsAtFloor, hideGroupsWithoutFloors, hideGroupsMeetingThreshold, and hideGroupsBelowThreshold. Workspace JSON persists the optional boolean and rejects unknown keys. Older files omit the key and default to show-all. If both hide-veto and hide-non-veto are on, the empty-groups notice is honest and model counts stay the same. A veto is a number you entered, not a legal right.
- Print facilitator pack includes the threshold-group count as one line when the case is valid. Print redacted still uses Group 1 through Group N. Honest zero. A threshold is a number you entered, not a legal quorum. The saved draft is unchanged.
- Copy the first veto group label as one-line Markdown, with a clipboard fallback. Honest when none. Distinct from first below-floor group copy and threshold-group count copy. A veto is a number you entered, not a legal right. Do not treat the label as a legal identity.

## 1.5.10 - 2026-09-10

A workshop follow-up on 1.5.9. The solver is still a decision aid, not a decision maker. A veto remains a number, not a legal right. Locks remain draft choices, not a legal hold or a recorded vote. Package review packets, replay, and AGREEMENT_REVIEW_TOOLS from 1.5.0 are unchanged.

### Added

- Keyboard `"` (straight double quote) copies the first below-floor group label through the existing `#copy-first-below-floor-group-button` (same one-line Markdown). Ignored while typing. Distinct from `:` below-floor count copy.
- Keyboard `_` jumps to that first below-floor group copy control, or the groups heading if missing. Ignored while typing.
- Keyboard `{` jumps to the hide-groups-below-threshold control, or the groups heading if missing. Ignored while typing. Distinct from `=` hide-groups-meeting-threshold.
- Sports day hours preset: synthetic students, neighbours (a veto group), and P&C scoring race start, PA volume, and lock-up. Distinct from Neighbourhood Plan, Library Quiet Hours, Sports Fixture Night, Market stall hours, Shared bike shed, Street stall lighting, Hall hire hours, Community garden watering, Shared laundry hours, Rooftop BBQ hours, and School disco hours. Not a recorded vote.
- Hide veto groups on screen. Hidden groups still count in the model. The solver is unchanged. Distinct from vetoGroupsOnly (show-only), hideGroupsAtFloor, hideGroupsWithoutFloors, hideGroupsMeetingThreshold, hideGroupsBelowThreshold, leftover-budget, and locked-clause filters. Workspace JSON persists the optional boolean and rejects unknown keys. Older files omit the key and default to show-all. A veto is a number you entered, not a legal right.
- Print facilitator pack includes the first below-floor group label as one line. Print redacted still uses Group 1 through Group N. Honest when none. A floor is a number you entered, not a legal quorum. The saved draft is unchanged.
- Copy the count of groups currently meeting the numeric approval threshold as one-line Markdown, with a clipboard fallback. Honest zero. Distinct from below-floor count copy and first-below-floor group copy. A threshold is a number you entered, not a legal quorum.

## 1.5.9 - 2026-09-10

A workshop follow-up on 1.5.8. The solver is still a decision aid, not a decision maker. A veto remains a number, not a legal right. Locks remain draft choices, not a legal hold or a recorded vote. Package review packets, replay, and AGREEMENT_REVIEW_TOOLS from 1.5.0 are unchanged.

### Added

- Keyboard `:` copies the below-floor group count through the existing `#copy-below-floor-count-button` (same one-line Markdown). Ignored while typing.
- Keyboard `-` jumps to that below-floor group count copy control, or the groups heading if missing. Ignored while typing.
- Keyboard `=` jumps to the hide-groups-meeting-threshold control, or the groups heading if missing. Ignored while typing.
- School disco hours preset: synthetic students, neighbours (a veto group), and P&C scoring finish time, bass, and lock-up. Distinct from Neighbourhood Plan, Library Quiet Hours, Sports Fixture Night, Market stall hours, Shared bike shed, Street stall lighting, Hall hire hours, Community garden watering, Shared laundry hours, and Rooftop BBQ hours. Not a recorded vote.
- Hide groups whose inspected average is below the numeric approval threshold. Hidden groups still count in the model. The solver is unchanged. Distinct from hideGroupsAtFloor, hideGroupsWithoutFloors, hideGroupsMeetingThreshold, belowFloorGroupsOnly, leftover-budget, and locked-clause filters. Workspace JSON persists the optional boolean and rejects unknown keys. Older files omit the key and default to show-all.
- Print facilitator pack includes the below-floor group count as one line. Print redacted still uses Group 1 through Group N. Honest zero. A floor is a number you entered, not a legal quorum. The saved draft is unchanged.
- Copy the first below-floor group label as one-line Markdown, with a clipboard fallback. Honest when none. Distinct from below-floor count copy, lock-count copy, and first-locked-option copy. A floor is a number you entered, not a legal quorum. Do not treat the label as a legal identity.

## 1.5.8 - 2026-09-10

A workshop follow-up on 1.5.7. The solver is still a decision aid, not a decision maker. A veto remains a number, not a legal right. Locks remain draft choices, not a legal hold or a recorded vote. Package review packets, replay, and AGREEMENT_REVIEW_TOOLS from 1.5.0 are unchanged.

### Added

- Keyboard `'` copies the first locked clause option label through the existing first-locked-option copy control (same one-line Markdown). Ignored while typing.
- Keyboard `<` jumps to that first-locked-option copy control, or the clauses heading if missing. Ignored while typing.
- Keyboard `>` jumps to the hide-locked-clauses control, or the clauses heading if missing. Ignored while typing.
- Rooftop BBQ hours preset: synthetic residents, neighbours (a veto group), and building committee scoring cook hours, smoke, and lock-up. Distinct from Neighbourhood Plan, Library Quiet Hours, Sports Fixture Night, Market stall hours, Shared bike shed, Street stall lighting, Hall hire hours, Community garden watering, and Shared laundry hours. Not a recorded vote.
- Hide groups currently meeting the numeric approval threshold. Hidden groups still count in the model. The solver is unchanged. Distinct from hideGroupsAtFloor, hideGroupsWithoutFloors, leftover-budget, lockedClausesOnly, hideUnlockedClauses, and hideLockedClauses. Workspace JSON persists the optional boolean and rejects unknown keys. Older files omit the key and default to show-all.
- Print facilitator pack includes the first locked clause option label as one line. Print redacted still uses Group 1 through Group N. Locks remain draft choices. The saved draft is unchanged.
- Copy a one-line Markdown count of groups currently below their support floor, with a clipboard fallback and an honest zero. Distinct from lock-count copy and remaining change-budget copy. A floor is a number you entered, not a legal quorum.

## 1.5.7 - 2026-09-10

A workshop follow-up on 1.5.6. The solver is still a decision aid, not a decision maker. A veto remains a number, not a legal right. Locks remain draft choices, not a legal hold or a recorded vote. Package review packets, replay, and AGREEMENT_REVIEW_TOOLS from 1.5.0 are unchanged.

### Added

- Keyboard `;` copies the current lock count through the existing lock-count copy control (same one-line Markdown). Ignored while typing.
- Keyboard `[` jumps to the lock-count copy control, or the locks heading if that control is missing. Ignored while typing.
- Keyboard `]` jumps to Print facilitator pack, or the facilitator pack heading if that control is missing. Ignored while typing.
- Shared laundry hours preset: synthetic tenants, neighbours (a veto group), and building managers scoring wash hours, dryer noise, and lock-up. Distinct from Neighbourhood Plan, Library Quiet Hours, Sports Fixture Night, Market stall hours, Shared bike shed, Street stall lighting, Hall hire hours, and Community garden watering. Not a recorded vote.
- Hide locked clauses. Hidden locked clauses still count in the model. The solver is unchanged. Distinct from lockedClausesOnly, hideUnlockedClauses, leftover-budget, and at-floor filters. Workspace JSON persists the optional boolean and rejects unknown keys. Older files omit the key and default to show-all.
- Print facilitator pack includes remaining change-budget as one line. Print redacted still uses Group 1 through Group N. The leftover is a draft accounting line, not a legal appropriation. The saved draft is unchanged.
- Copy first locked clause option label as one-line Markdown, with a clipboard fallback. Honest when no clause is locked. Distinct from lock-count copy and current-locks copy. Locks are draft choices, not a legal hold.

## 1.5.6 - 2026-09-10

A workshop follow-up on 1.5.5. The solver is still a decision aid, not a decision maker. A veto remains a number, not a legal right. Locks remain draft choices, not a legal hold or a recorded vote. Package review packets, replay, and AGREEMENT_REVIEW_TOOLS from 1.5.0 are unchanged.

### Added

- Keyboard `z` jumps to the numeric approval threshold field, or the method heading if that field is missing. Ignored while typing.
- Keyboard `,` (comma, no shift) copies the recommended package option count as one-line Markdown (count only), with a clipboard fallback. It is not a recorded vote.
- Keyboard `.` jumps to the first locked clause card, or the clauses heading if none. Ignored while typing.
- Community garden watering preset: synthetic plot-holders, neighbours (a veto group), and garden committee scoring watering hours, hose noise, and lock-up. Distinct from Neighbourhood Plan, Library Quiet Hours, Sports Fixture Night, Market stall hours, Shared bike shed, Street stall lighting, and Hall hire hours. Not a recorded vote.
- Hide unlocked clauses. Hidden clauses still count in the model. The solver is unchanged. Distinct from hideGroupsAtFloor, hideGroupsWithoutFloors, leftover-budget clause filter, and the lock filter. Workspace JSON persists the optional boolean and rejects unknown keys. Older files omit the key and default to show-all.
- Print facilitator pack includes a one-line lock count. Print redacted still uses Group 1 through Group N. Locks are draft choices, not a legal hold. The saved draft is unchanged.
- Copy current lock count as one-line Markdown, with a clipboard fallback. Locks are draft choices, not a legal hold.

## 1.5.5 - 2026-09-10

A workshop follow-up on 1.5.4. The solver is still a decision aid, not a decision maker. A veto remains a number, not a legal right. Locks remain draft choices, not a legal hold or a recorded vote. Package review packets, replay, and AGREEMENT_REVIEW_TOOLS from 1.5.0 are unchanged.

### Added

- Keyboard `h` jumps to the workshop method / How it works heading. Ignored while typing.
- Keyboard `i` copies original versus recommended package as compact Markdown (option labels and costs only), with a clipboard fallback. It is not a recorded vote.
- Keyboard `q` jumps to the first clause that differs from the recommendation, or the clauses heading if none. Ignored while typing.
- Keyboard `y` jumps to the first veto group card, or the groups heading if none. Ignored while typing. A veto is a number, not a legal right.
- Hall hire hours preset: synthetic hirers, neighbours (a veto group), and hall committee scoring close time, PA volume, and clean-up. Distinct from Neighbourhood Plan, Library Quiet Hours, Sports Fixture Night, Market stall hours, Shared bike shed, and Street stall lighting. Not a recorded vote.
- Hide groups that have no support floor. Hidden groups still count in the model. The solver is unchanged. Workspace JSON persists the optional boolean and rejects unknown keys. Older files omit the key and default to show-all.
- Print facilitator pack includes the numeric approval threshold. Print redacted still uses Group 1 through Group N. A threshold is a number you entered, not a legal quorum. The saved draft is unchanged.
- Copy approval threshold as one-line Markdown, with a clipboard fallback. A threshold is a number you entered, not a legal quorum.

## 1.5.4 - 2026-09-10

A workshop follow-up on 1.5.3. The solver is still a decision aid, not a decision maker. A veto remains a number, not a legal right. Locks remain draft choices, not a legal hold or a recorded vote. Package review packets, replay, and AGREEMENT_REVIEW_TOOLS from 1.5.0 are unchanged.

### Added

- Keyboard `d` jumps to the first group below its support floor, or the groups heading if none. Ignored while typing.
- Keyboard `o` jumps to the first recommended-package option card, or the clauses heading if none. Ignored while typing. The recommendation is not a recorded vote.
- Copy remaining change-budget as one-line Markdown, with a clipboard fallback. Honest when leftover is exhausted or unlimited. Distinct from recommended-package copy and the group-support table. It is not a legal appropriation.
- Keyboard `j` copies that remaining change-budget line. Ignored while typing.
- Keyboard `x` focuses the JSON export control. Ignored while typing. `e` still exports.
- Street stall lighting preset: synthetic stallholders, nearby residents (a veto group), and council officers scoring lighting hours, glare, and pack-down. Distinct from Neighbourhood Plan, Open Source Policy, Association Budget, Protected Access, Workplace Hybrid, Club Constitution, Library Quiet Hours, Sports Fixture Night, Market stall hours, and Shared bike shed. Not a recorded vote.
- Hide groups currently meeting a declared support floor. Groups without a floor stay visible. Hidden groups still count in the model. The solver is unchanged. Workspace JSON persists the optional boolean and rejects unknown keys. Older files omit the key and default to show-all.
- Print facilitator pack includes remaining change-budget. Print redacted still uses Group 1 through Group N. The leftover is a draft accounting line, not a legal appropriation. The saved draft is unchanged.
- Filter clause cards that have no remaining cheaper option than the recommendation. Hidden cards still count in the model. The solver is unchanged. Workspace JSON persists the optional boolean and rejects unknown keys. Older files omit the key and default to show-all.

## 1.5.3 - 2026-09-10

A workshop follow-up on 1.5.2. The solver is still a decision aid, not a decision maker. A veto remains a number, not a legal right. Locks remain draft choices, not a legal hold or a recorded vote. Package review packets, replay, and AGREEMENT_REVIEW_TOOLS from 1.5.0 are unchanged.

### Added

- Keyboard `t` jumps to the approval threshold field when focus is not in an input, select, or text area. Shortcut help lists it.
- Copy recommended package Markdown now keeps a textarea fallback when the clipboard is blocked. It is not a recorded vote.
- Shared bike shed preset: synthetic bike users, neighbours (a veto group), and building managers scoring access hours, lighting, and lock-up. Distinct from Neighbourhood Plan, Library Quiet Hours, Sports Fixture Night, and Market stall hours. Not a recorded vote.
- Keyboard `a` focuses Add clause. Ignored while typing.
- Filter clause cards whose cheapest remaining change exceeds leftover budget, or every clause when the budget is exhausted. Hidden cards still count in the model. The solver is unchanged. Workspace JSON persists the optional boolean and rejects unknown keys. Older files omit the key and default to show-all.
- Copy group support as a Markdown table of group name, mixing weight, and average support. Mixing weights are not a legal right. Clipboard write has a textarea fallback.
- Keyboard `w` jumps to group weights or renormalize controls. Ignored while typing.
- Keyboard `m` jumps to remaining change-budget or cost margin. Ignored while typing.
- Undoable duplicate of a participant group now uses a unique copy name, the same weight, optional floor and veto, and a new id. Invalid at the group cap.
- Print facilitator pack marks recommended package option labels on the worksheet. Print redacted still uses Group 1 through Group N. The saved draft is unchanged.

## 1.5.2 - 2026-09-10

A workshop follow-up on 1.5.1. The solver is still a decision aid, not a decision maker. A veto remains a number, not a legal right. Locks remain draft choices, not a legal hold or a recorded vote. Package review packets, replay, and AGREEMENT_REVIEW_TOOLS from 1.5.0 are unchanged.

### Added

- Filter clause cards to those that differ between the original and recommended packages. Hidden cards still count in the model.
- Market stall hours preset: synthetic stallholders, neighbours (a veto group), and market officers scoring stall open hours, packing, and neighbour noise. Distinct from Neighbourhood Plan, Library Quiet Hours, and Sports Fixture Night. Not a recorded vote.
- Keyboard `c` jumps to the change-budget field when focus is not in an input, select, or text area. Shortcut help lists it.
- Keyboard `p` prints the facilitator pack, matching the existing print button. Ignored while typing.
- Copy current locks as Markdown (clause title and locked option label, or Unlocked). Clipboard write has a textarea fallback. It is not a legal hold.
- Undoable duplicate of a clause option, including an original. The copy gets a new id, a unique copy name, and the same cost and support. Invalid at the option cap.
- Keyboard `k` jumps to the first unlocked clause card, or the lock controls if every clause is locked. Ignored while typing.
- Filter participant groups to those whose average on the inspected package is below their support floor, or the approval threshold when no floor is set. Hidden groups still count in the model. Solver counts stay the same.
- Copy recommended versus original change-cost CSV (`clause`, `original_option`, `recommended_option`, `cost_delta`). Formula-like cells receive a leading apostrophe. Clipboard write has a textarea fallback.
- Paste TSV or CSV participant groups into a textarea using the same `parseParticipantGroupsCsv` validation as file import. A first line with tabs is treated as TSV. Partial pastes are rejected. Illegal strings are not coerced.
- Persist the changed-clause and below-floor display filters in version-1 workspace JSON and local workspace prefs. Unknown workspace keys are rejected. Older files omit the keys and default to show-all. The solver ignores the filters.

## 1.5.1 - 2026-09-10

A workshop follow-up on 1.5.0. The solver is still a decision aid, not a decision maker. A veto remains a number, not a legal right. Locks remain draft choices, not recorded votes. Package review packets, replay, and AGREEMENT_REVIEW_TOOLS from 1.5.0 are unchanged.

### Added

- Keyboard `v` toggles the veto-only group filter when focus is not in an input, select, or text area. Shortcut help lists it.
- Filter clause cards to those that currently have a lock. Hidden clauses still count in the model.
- Keyboard `b` jumps to the first veto-blocker highlight, or the veto list. Ignored while typing.
- Keyboard `g` focuses the participant groups heading or the first group card. Ignored while typing.
- Undoable model reorder moves a clause up or down. Clause order is the last documented tie breaker.
- Copy original, recommended, and pinned option labels as a Markdown table of clause titles. Clipboard write has a textarea fallback. It is not a vote record.
- Sports Fixture Night preset: synthetic members, neighbours (a veto group), and council rangers scoring match end-time, floodlights, and match-night parking.
- Persist the veto-only and locked-clause display filters in version-1 workspace JSON and local workspace prefs. Older files omit the keys and default to show-all. The solver ignores the filters.
- Print redacted replaces group display names with Group 1 through Group N on the print path only. The saved draft is unchanged.
- Paste TSV or CSV clause options into a textarea using the same `parseClauseOptionsCsv` validation as file import. A first line with tabs is treated as TSV. Import is undoable.

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
