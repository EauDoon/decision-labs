# Model and search contract

## Purpose

The model compares explicitly supplied structured options. It finds the smallest calculated change that crosses a configurable approval threshold. It makes no claim that the result is a collective decision. Version 1.5.39 keeps the 1.5.0 review packet contract. Workshop display filters, print redaction, pasted tables, lock copy, unique group copies, and `moveClause` do not change search math. A veto is a number, not a legal right. Locks are draft choices, not a legal hold. Time-trial cycling club hours is a start-ramp / time-check / timing-chip workshop, distinct from criterium cycling club hours (closed-circuit / pit-lane / number-board) and road cycling club hours (sealed-road / feed-station / wheel-bag).

## Inputs

A valid proposal has:

- A title and approval threshold from 0 to 100.
- One or more participant groups, each with a positive numeric weight.
- One or more clauses.
- At least three options per clause: exactly one original option and at least two alternatives.
- For every option and every group, a support score from 0 to 100.
- A non-negative finite change cost for every option. The original option's cost must be 0.

An option is original only when `original` is the boolean `true`. Omitting `original`, or setting it to `false`, marks an alternative. Any other value is invalid.

Option labels are opaque strings to the model. Only the supplied numbers affect calculation.

## Field limits

These bounds apply to validation, import, autosave, and share-link decoding. Out-of-range values are invalid rather than clamped. Titles, names, and labels must contain a non-whitespace character; the length limit counts the string as stored, including surrounding spaces.

| Field | Limit |
| --- | --- |
| `title` | Non-empty string, at most 120 characters |
| `groups` | 1 to 24 |
| `groups[].id`, `clauses[].id`, `options[].id` | 1 to 64 characters: start with `A-Z`, `a-z`, or `0-9`; then those characters, `.`, `_`, or `-`. Duplicate ids in the same list are invalid. `constructor`, `prototype`, and `__proto__` are reserved. |
| `groups[].name` | Non-empty string, at most 80 characters |
| `groups[].weight` | Finite number greater than 0 and at most 1,000,000. `NaN` and infinities are invalid. |
| `clauses` | 1 to 20 |
| `clauses[].title` | Non-empty string, at most 120 characters |
| `clauses[].note` | Optional string of 1 to 240 characters. Facilitator text only; omitted from search math. |
| `clauses[].options` | 3 to 24, including exactly one original |
| `options[].label` | Non-empty string, at most 240 characters |
| `options[].changeCost` | Finite number from 0 through 1,000,000,000. `NaN` and infinities are invalid. |
| `options[].support` | Own finite scores from 0 to 100 for every declared group id, and no other keys |

The GUI uses the same title, name, and label lengths as `maxlength` attributes. Support floors, the total-cost budget, and option locks are listed under Optional constraints. Extra keys on the proposal, groups, clauses, and options are discarded during canonicalization. Extra keys on `support` and reserved prototype keys are rejected.

## Approval formula

For group `g`, with weight `w_g`, and selected option support score `s_gi` for each clause `i`:

```text
group approval(g) = sum(s_gi for every selected clause option) / number of clauses

overall approval =
  sum(w_g * sum(s_gi for every selected clause option) for every group)
  / (sum(w_g for every group) * number of clauses * 100)
  * 100
```

An agreement passes when overall approval is at least the threshold and every configured constraint is met. The displayed group approval is the unweighted average of that group's selected option scores. The overall result then weights those group averages by the supplied group weights.

## Optional constraints

| JSON field | Accepted values | Meaning |
| --- | --- | --- |
| `groups[].minSupport` | Finite number from 0 to 100 | That group's average across selected clause options must meet this minimum, regardless of weight. |
| `groups[].veto` | Boolean `true` | That group's average must be at least the overall threshold. If the group also has `minSupport`, the required value is `max(threshold, minSupport)`. |
| `maxChangeCost` | Finite number from 0 to 20,000,000,000 | Sum of selected alternatives' change costs cannot exceed this budget. |
| `clauses[].lockedOptionId` | An option ID belonging to that clause | The search must select this option. Other choices stay in the draft but are excluded from search. |
| `clauses[].note` | String of 1 to 240 characters | Facilitator reminder shown on the worksheet. The solver ignores it. |

Omit an optional field to disable it. `null`, numeric strings, unknown option references, and out-of-range values are invalid. `groups[].veto` must be a boolean if present; `false` and omitted are equivalent and are dropped from canonical JSON. In the GUI, a blank budget or floor omits the field; zero remains a real constraint. Locks may select originals or alternatives. A locked alternative still contributes its full cost and counts as a changed clause. Removing a locked option requires unlocking it first. Locks are draft choices, not recorded votes.

All constraints apply together. No priority rule silently relaxes a budget, floor, veto, or lock to make a proposal pass. A group floor or veto applies to an average, not to every individual clause and not to semantic consent or a legal right. JSON canonicalization preserves understood constraints and drops unrelated fields. Unconstrained v1 drafts remain valid and retain their original field shape. Drafts without `veto` stay valid; the field is not added during canonicalization.

Calculations use JavaScript floating-point numbers. Comparisons use an absolute tolerance of `1e-9` for approval, support floors, costs, and numeric tie breakers. Display rounding never decides feasibility.

## Search and ordering

The search evaluates the Cartesian product of permitted clause options: exactly one selected option for each clause. A locked clause contributes one choice. It starts by evaluating the status quo, meaning every original option, even if a lock requires a different option.

When alternatives are not requested and status quo meets the threshold and every constraint, it is returned with cost 0 after one baseline check. This is optimal because costs are non-negative and no alternative can use fewer than zero changes. Otherwise, all permitted combinations are evaluated and passing combinations are ordered by:

1. Lowest total change cost.
2. Fewest changed clauses.
3. Higher overall approval.
4. Lexicographically earlier option IDs in clause order.

This final option-ID rule makes otherwise equal choices reproducible. It does not represent a substantive preference.

Constraint-compliant combinations below the approval threshold are ordered as near misses by smallest approval gap, then by the same ordering above. At most five are returned. Over-budget, below-floor, and below-veto combinations are excluded rather than presented as adoptable alternatives.

For an enumerated result, `eligibleCombinations` counts combinations meeting every constraint, whether or not they meet the approval threshold. `rejected.anyConstraint` counts rejected combinations once each; `rejected.budget`, `rejected.floors`, and `rejected.vetoes` can overlap. A floor rejection means one or more groups miss their floor. A veto rejection means one or more veto groups miss the required average. Locks remove options before enumeration, so excluded options are not counted as rejected candidates. Near misses still exclude over-budget, below-floor, and below-veto combinations.

## Bound and outcomes

The default maximum is 50,000 lock-permitted combinations. The count is calculated before enumeration or the baseline shortcut. If it exceeds that maximum, the result is `too_large`; no partial search, sampling, or recommendation occurs. Budgets and floors do not reduce the counted search space. `possibleCombinations` is the permitted search-space size (or a cap-plus-one sentinel when too large). `checkedCombinations` is 1 for the already-passing baseline shortcut and the full space for an enumerated result; it does not count the separately reported baseline again.

`findSmallestAgreement(proposal, options)` accepts a plain object with only `maxCombinations` (integer from 1 through 50,000), `nearMissLimit` (integer from 0 through 5), and `alternativesLimit` (integer from 0 through 5). The first two default to those maxima; `alternativesLimit` defaults to zero. When alternatives are requested, every permitted combination is enumerated, including an already-passing original. `passingCombinations` counts all passing candidates, and `alternatives` contains only the requested best candidates. The GUI requests five alternatives. `null`, non-objects, unknown keys, inherited values, and values outside those ranges return `invalid`. A caller can lower a cap for tests or a tighter bound, but cannot raise either cap.

Other explicit outcomes are:

- `invalid`: structural input validation failed.
- `already_passing`: the original proposal meets the threshold and every constraint.
- `found`: at least one changed combination meets the threshold and every constraint.
- `infeasible`: every permitted combination was evaluated and none meets both the threshold and every constraint.
- `too_large`: the full search exceeds the configured maximum.

The pure model has no network access, no semantic inference, and no hidden randomness.

## Assumptions and limits

The formula assumes that support can be represented as a 0 to 100 score, group weights are valid for the particular process, clause scores can be averaged, and change costs can be compared and summed. Those are working assumptions, not findings.

Small textual edits can have large semantic, legal, financial, or lived effects. Costs can omit implementation burden, power differences, dependency effects, and who is excluded from the room. A numerical result cannot prove consensus, democratic legitimacy, consent, fairness, representation, legal compliance, or authority to adopt a policy.

Use the result to focus a human conversation. Establish process rules, evidence standards, decision rights, and adoption requirements separately.


## Inspection APIs and local workflows

- `evaluatePackage(proposal, optionIds)` requires exactly one valid option ID per clause and returns `passing`, `not_passing`, or `invalid`. It tests all constraints, including locks, without modifying the proposal or performing an optimization.
- `comparePinnedPackages(proposal, recommendedIds, customIds)` reports original, solver, and custom selections side by side. Pass `null` for a missing solver recommendation. This is a readout of three packages, not a vote.
- `lockPackage(proposal, optionIds)` copies the proposal and sets every clause lock to those option IDs. It does not mutate the input. The GUI applies that copy as one undoable draft edit.
- `clearAllLocks(proposal)` copies the proposal and removes every `lockedOptionId`. It does not mutate the input. The GUI applies that copy as one undoable draft edit.
- `toggleClauseLock(proposal, clauseId, optionId)` locks that option or removes the lock when it is already selected. It does not mutate the input. The clause card exposes this as Lock this option / Unlock option, separate from applying a whole package.
- `moveClause(proposal, clauseId, direction)` copies the proposal and swaps that clause one step `up` or `down`. It does not mutate the input. Clause order is the last documented tie breaker. Unknown ids and moves past the first or last clause fail closed.
- `vetoBlockingGroups(proposal, options)` lists veto groups whose average misses the required value on that package. The GUI highlights those groups as a numerical constraint failure, not a legal right or legitimacy claim.
- `previewRenormalizedWeights(proposal)` and `applyRenormalizedWeights(proposal)` divide each weight by the current total so weights sum to 1. The last group receives the remainder so the sum is exact. Any invalid weight rejects the operation. Apply copies the proposal; it does not mutate the input.
- `sortPackageGapRows(rows, sortBy)` reorders described near-miss rows by `approval_gap` or `change_cost`. It does not change which combinations the solver retained.
- `duplicateParticipantGroup(proposal, groupId)` copies a group with a unique id, a unique copy name, the same weight, optional floor and veto, and every option's support score for that group. Invalid at the group cap. It does not mutate the input.
- `duplicateClauseOption(proposal, clauseId, optionId)` copies one option with a new id, a unique copy name, and the same cost and support. The copy is never an original. Invalid when the clause is already at the option cap. Does not mutate the input.
- `changedClauseIds(proposal, result)` lists clause ids whose recommended option is not the original. Empty when there is no recommendation. Display-only. The solver ignores the list.
- `groupsBelowSupportRequirement(proposal, options)` lists groups whose average on that package is below their support floor, or the approval threshold when no floor is set. Display-only. Solver counts stay the same.
- `groupsMeetingDeclaredSupportFloor(proposal, options)` lists groups whose average meets a declared `minSupport`. Groups without a floor are omitted. Display-only. The solver ignores the list.
- `groupsMeetingApprovalThreshold(proposal, options)` lists groups whose average meets the numeric approval threshold. Distinct from groups that meet a declared support floor. Display-only. The solver ignores the list.
- `groupsBelowApprovalThreshold(proposal, options)` lists groups whose average is below the numeric approval threshold. Distinct from groups below a declared support floor and from groups that meet the threshold. Display-only. The solver ignores the list.
- `groupsBelowDeclaredSupportFloor(proposal, options)` lists groups whose average is below a declared `minSupport`. Groups without a floor are omitted. A floor is a number you entered, not a legal quorum. Display-only. The solver ignores the list.
- `groupsWithoutDeclaredSupportFloor(proposal)` lists groups whose `minSupport` is missing. Distinct from groups below a declared floor. A floor is a number you entered, not a legal quorum. Display-only. The solver ignores the list.
- `overBudgetClauseIds(proposal, result)` lists clause ids whose cheapest remaining change costs more than leftover budget. When leftover budget is 0 or negative, every clause is listed. Unlimited budget yields an empty list. Display-only. The solver ignores the list.
- `clausesWithoutCheaperRemainingOption(proposal, result)` lists clause ids whose recommended option has no remaining cheaper alternative. Remaining cheaper means another option with a strictly lower change cost. Empty when there is no recommendation. Display-only. The solver ignores the list.
- `stressPackage(proposal, optionIds, supportDrop)` accepts a finite 0 to 100 point reduction, clamps every support score at zero, and evaluates the same choices. It reports the original and downside summaries. The scenario is hypothetical, not probabilistic.
- `compareScenarioInputs(before, after)` compares canonical fields by stable IDs, including clause order because that order participates in the tie breaker. The GUI shows the first 100 changed fields with an explicit truncation message.
- `formatEvidenceCsv(proposal, result)` includes every modeled input and recommendation markers, including a `veto` column. Text formula prefixes are neutralized, CSV quoting preserves commas, quotes, and newlines, and the GUI emits a UTF-8 byte-order mark.
- `clauseContributions(proposal, options)` reports each selected option's weighted support versus the original option. Overall approval is the mean of per-clause weighted support, so `overallPull` is `delta / clauseCount`. This is score accounting, not bargaining power.
- `groupContributions(proposal, options)` reports each group's pull as `weight share * group average`. Pulls sum to the change in overall approval. Method name: `weight_share`.
- `leaveOneGroupOut(proposal, options)` omits one group at a time from the weighted average (method `omit`). Remaining weights are used as written, which renormalizes them. A single-group proposal returns `approval: null` for that row. This is sensitivity, not a forecast.
- `explorePackageGaps(proposal, result)` names cheaper near misses, closest misses, and later passing packages, with approval-point and cost gaps versus the recommendation.
- `previewLockedOption(proposal, clauseId, optionId)` copies the proposal, locks that option, and re-runs search. It does not mutate the input.
- `parseSupportMatrixCsv(csvText, proposal)` replaces group scores from a CSV whose header is `clause_id,option_id` then every group id. It does not change labels, costs, locks, or constraints. Named errors include `empty_csv`, `missing_header`, `missing_clause_id_column`, `missing_option_id_column`, `unknown_group_column`, `missing_group_column`, `unknown_clause`, `unknown_option`, `formula_cell`, `invalid_score`, `duplicate_row`, `truncated_row`, and `invalid_proposal`. Leading apostrophes are stripped before formula detection. `formatSupportMatrixCsv` writes the same matrix.
- `parseParticipantGroupsCsv(csvText, proposal)` replaces groups from `name,weight`, optional `min_support` and `veto`, and one support column per existing option named `clauseId:optionId`. Unknown columns are rejected. A first line that contains tabs is treated as TSV and converted to CSV before the same validation. Named errors include `empty_csv`, `missing_header`, `missing_name_column`, `missing_weight_column`, `unknown_column`, `missing_support_column`, `duplicate_column`, `invalid_name`, `invalid_weight`, `invalid_floor`, `invalid_veto`, `formula_cell`, `truncated_row`, `too_many_groups`, and `invalid_proposal`. Partial tables are rejected rather than applied. Illegal strings are not coerced. `formatParticipantGroupsCsv` writes the same table. Clauses, locks, notes, and costs stay as they were.
- `parseClauseOptionsCsv(csvText, proposal)` replaces clauses from `clause_id,option_id,clause_title,option_label,original,change_cost`, with optional `note` and `locked`. Unknown columns are rejected. Matching clause and option ids keep their support scores; new options receive 50 for every group. Groups stay. A first line that contains tabs is treated as TSV and converted to CSV before the same validation. Named errors include `empty_csv`, `missing_header`, `missing_clause_id_column`, `missing_option_id_column`, `missing_column`, `unknown_column`, `duplicate_column`, `duplicate_row`, `duplicate_lock`, `invalid_id`, `invalid_title`, `invalid_label`, `invalid_original`, `invalid_cost`, `invalid_note`, `invalid_lock`, `inconsistent_title`, `inconsistent_note`, `formula_cell`, `truncated_row`, `too_few_options`, `too_many_options`, `too_many_clauses`, `missing_original`, `extra_original`, and `invalid_proposal`. `formatClauseOptionsCsv` writes the same table. The solver still ignores notes.
- `formatDiscussionWorksheet(proposal)` returns unmarked option boxes as plain text. Optional clause notes appear as facilitator text. It is a conversation aid, not a recorded vote or legal ballot.
- `formatDiscussionWorksheetCsv(proposal)` writes groups, weights, clause options, and facilitator notes as formula-safe CSV text. Support scores are omitted. Cells that look like spreadsheet formulas receive a leading apostrophe.
- `formatRecommendedPackageMarkdown(proposal, result)` copies the recommended options as compact Markdown. It is a decision aid, not a recorded vote. Unavailable when there is no recommendation.
- `formatOriginalVersusRecommendedMarkdown(proposal, result)` copies original versus recommended option labels and costs as compact Markdown. Labels and costs only. It is a decision aid, not a recorded vote. Unavailable when there is no recommendation.
- `formatGroupSupportMarkdown(proposal, options)` copies a Markdown table of group name, mixing weight, and average support on the inspected package. Mixing weights are not a legal right. Unavailable when there is no inspected package.
- `remainingChangeBudget(proposal, result)` reports leftover change-budget on the recommended package. Unlimited when `maxChangeCost` is omitted. Unavailable when there is no recommendation. Exhausted when leftover is 0 or negative. Display-only. It is not a legal appropriation.
- `formatRemainingChangeBudgetMarkdown(proposal, result)` copies leftover change-budget as one-line Markdown. Honest when exhausted. Distinct from recommended-package copy and the group-support table. It is not a legal appropriation.
- `formatApprovalThresholdMarkdown(proposal)` copies the approval threshold as one-line Markdown. A threshold is a number you entered, not a legal quorum. Distinct from remaining change-budget copy.
- `formatRecommendedPackageOptionCountMarkdown(proposal, result)` copies the recommended package option count as one-line Markdown (count only). It is a decision aid, not a recorded vote. Unavailable when there is no recommendation.
- `formatPinnedPackagesMarkdown(proposal, recommendedIds, customIds)` copies original, recommended, and pinned option labels as a Markdown table of clause titles. It is a decision aid, not a recorded vote. Missing packages render as `none`.
- `formatVetoBlockersMarkdown(proposal, options)` copies veto groups whose average misses the required value on that package. It is a numerical constraint list, not a legal veto or a legitimacy claim. Unavailable when there is no inspected package.
- `formatCurrentLocksMarkdown(proposal)` copies each clause title with the locked option label, or Unlocked. It is a draft choice list, not a legal hold or a recorded vote.
- `formatCurrentLockCountMarkdown(proposal)` copies the current clause lock count as one-line Markdown. Locks are draft choices, not a legal hold. Distinct from current-locks copy.
- `formatFirstLockedClauseOptionLabelMarkdown(proposal)` copies the first locked clause option label as one-line Markdown. Honest when no clause is locked. Distinct from lock-count copy and current-locks copy. Locks are draft choices, not a legal hold.
- `formatGroupsBelowSupportFloorCountMarkdown(proposal, options)` copies the count of groups currently below their declared support floor as one-line Markdown. Honest when the count is zero or no inspected package is available. Distinct from lock-count copy and remaining change-budget copy. A floor is a number you entered, not a legal quorum.
- `formatFirstBelowSupportFloorGroupLabelMarkdown(proposal, options)` copies the first group currently below its declared support floor as one-line Markdown. Honest when none or no inspected package is available. Distinct from below-floor count copy, last-below-floor group copy, lock-count copy, and first-locked-option copy. A floor is a number you entered, not a legal quorum. Do not treat the label as a legal identity.
- `formatGroupsMeetingApprovalThresholdCountMarkdown(proposal, options)` copies the count of groups currently meeting the numeric approval threshold as one-line Markdown. Honest when the count is zero or no inspected package is available. Distinct from below-floor count copy and first-below-floor group copy. A threshold is a number you entered, not a legal quorum.
- `formatFirstVetoGroupLabelMarkdown(proposal)` copies the first group marked as a veto group as one-line Markdown. Honest when none. Distinct from first-below-floor group copy and threshold-group count copy. A veto is a number you entered, not a legal right. Do not treat the label as a legal identity.
- `formatVetoGroupCountMarkdown(proposal)` copies the count of groups marked as a veto group as one-line Markdown. Honest when the count is zero. Distinct from threshold-group count copy and first veto group copy. A veto is a number you entered, not a legal right.
- `formatFirstNonVetoGroupLabelMarkdown(proposal)` copies the first group that is not marked as a veto group as one-line Markdown. Honest when none. Distinct from first veto group copy and veto-group count copy. A veto is a number you entered, not a legal right. Do not treat the label as a legal identity.
- `formatLastVetoGroupLabelMarkdown(proposal)` copies the last group marked as a veto group as one-line Markdown. Honest when none. Distinct from first veto group copy and first non-veto group copy. A veto is a number you entered, not a legal right.
- `formatLastNonVetoGroupLabelMarkdown(proposal)` copies the last group that is not marked as a veto group as one-line Markdown. Honest when none. Distinct from last veto group copy and first non-veto group copy. A veto is a number you entered, not a legal right. Do not treat the label as a legal identity.
- `formatLastBelowThresholdGroupLabelMarkdown(proposal, options)` copies the last group whose average on the inspected package is below the numeric approval threshold as one-line Markdown. Honest when none or no inspected package is available. Distinct from last non-veto group copy, first-below-floor group copy, and first below-threshold group copy. A threshold is a number you entered, not a legal quorum. Do not treat the label as a legal identity.
- `formatFirstBelowThresholdGroupLabelMarkdown(proposal, options)` copies the first group whose average on the inspected package is below the numeric approval threshold as one-line Markdown. Honest when none or no inspected package is available. Distinct from last below-threshold group copy and first-below-floor group copy. A threshold is a number you entered, not a legal quorum. Do not treat the label as a legal identity.
- `formatLastGroupAtOrAboveThresholdLabelMarkdown(proposal, options)` copies the last group whose average on the inspected package is at or above the numeric approval threshold as one-line Markdown. Uses the same meeting-threshold list as hideLastGroupAtOrAboveThreshold. Honest when none or no inspected package is available. Distinct from last below-threshold group copy, first below-threshold group copy, and threshold-group count copy. A threshold is a number you entered, not a legal quorum. Do not treat the label as a legal identity.
- `formatFirstGroupAtOrAboveThresholdLabelMarkdown(proposal, options)` copies the first group whose average on the inspected package is at or above the numeric approval threshold as one-line Markdown. Uses the same meeting-threshold list as hideFirstGroupAtOrAboveThreshold. Honest when none or no inspected package is available. Distinct from last at-or-above-threshold group copy and first below-threshold group copy. A threshold is a number you entered, not a legal quorum. Do not treat the label as a legal identity.
- `formatLastGroupAtFloorLabelMarkdown(proposal, options)` copies the last group whose average on the inspected package currently meets their declared support floor as one-line Markdown. Uses the same meeting-floor list as hideLastGroupAtFloor. Honest when none or no inspected package is available. Distinct from last at-or-above-threshold group copy, first at-or-above-threshold group copy, first at-floor group copy, and hideLastGroupAtFloor. A floor is a number you entered, not a legal quorum. Do not treat the label as a legal identity.
- `formatFirstGroupAtFloorLabelMarkdown(proposal, options)` copies the first group whose average on the inspected package currently meets their declared support floor as one-line Markdown. Uses the same meeting-floor list as hideFirstGroupAtFloor. Honest when none or no inspected package is available. Distinct from last at-floor group copy, first at-or-above-threshold group copy, and hideFirstGroupAtFloor. A floor is a number you entered, not a legal quorum. Do not treat the label as a legal identity.
- `formatLastBelowSupportFloorGroupLabelMarkdown(proposal, options)` copies the last group whose average on the inspected package is currently below their declared support floor as one-line Markdown. Uses the same below-floor list as hideFirstGroupBelowFloor and hideLastGroupBelowFloor. Honest when none or no inspected package is available. Distinct from first-below-floor group copy, last below-threshold group copy, last at-floor group copy, hideFirstGroupBelowFloor, and hideLastGroupBelowFloor. A floor is a number you entered, not a legal quorum. Do not treat the label as a legal identity.
- `formatLastGroupWithoutFloorLabelMarkdown(proposal, options)` copies the last group without a declared support floor (`minSupport` missing) as one-line Markdown. Uses the same without-floor list as hideLastGroupWithoutFloor. Honest when none or no inspected package is available. Distinct from first at-floor group copy, last at-floor group copy, first-below-floor group copy, last-below-floor group copy, first group-without-floor copy, groups-without-floor count copy, and hideGroupsWithoutFloors. A floor is a number you entered, not a legal quorum. Do not treat the label as a legal identity.
- `formatFirstGroupWithoutFloorLabelMarkdown(proposal, options)` copies the first group without a declared support floor (`minSupport` missing) as one-line Markdown. Uses the same without-floor list as hideFirstGroupWithoutFloor. Honest when none or no inspected package is available. Distinct from last group-without-floor copy, first at-floor group copy, last at-floor group copy, first-below-floor group copy, last-below-floor group copy, groups-without-floor count copy, hideGroupsWithoutFloors, and hideLastGroupWithoutFloor. A floor is a number you entered, not a legal quorum. Do not treat the label as a legal identity.
- `formatGroupsWithoutFloorCountMarkdown(proposal, options)` copies the count of groups without a declared support floor (`minSupport` missing) as one-line Markdown. Uses the same without-floor list as hideFirstGroupWithoutFloor and hideLastGroupWithoutFloor. Honest when the count is zero or no inspected package is available. Distinct prefix from first group-without-floor label copy, last group-without-floor label copy, and groups-without-floor remaining copy. A floor is a number you entered, not a legal quorum.
- `formatGroupsWithoutFloorRemainingMarkdown(proposal, options)` copies remaining mixing-weight total of groups without a declared support floor (`minSupport` missing) as one-line Markdown. Looks up each listed group's weight from `proposal.groups`. Uses the same without-floor list as hideFirstGroupWithoutFloor and hideLastGroupWithoutFloor. Honest when remaining is zero or no inspected package is available. Distinct prefix from groups-without-floor count copy, first group-without-floor label copy, last group-without-floor label copy, last-without-floor remaining copy, first-without-floor remaining copy, first-without-floor cost copy, last-without-floor cost copy, and remaining change-budget copy. A floor is a number you entered, not a legal quorum. Mixing weights are not a legal right. Do not treat labels as legal identities. Display-only. The solver ignores the copy.
- `formatLastGroupWithoutFloorRemainingMarkdown(proposal, options)` copies remaining mixing weight of the last group without a declared support floor (`minSupport` missing) as one-line Markdown. Looks up that listed group's weight from `proposal.groups`. Uses the same without-floor list as hideFirstGroupWithoutFloor and hideLastGroupWithoutFloor. Honest when remaining is zero, none, or no inspected package is available. Distinct prefix from aggregate groups-without-floor remaining copy, groups-without-floor count copy, first group-without-floor label copy, last group-without-floor label copy, first-without-floor remaining copy, first-without-floor cost copy, last-without-floor cost copy, and remaining change-budget copy. A floor is a number you entered, not a legal quorum. Mixing weights are not a legal right. Do not treat labels as legal identities. Display-only. The solver ignores the copy.
- `formatFirstGroupWithoutFloorRemainingMarkdown(proposal, options)` copies remaining mixing weight of the first group without a declared support floor (`minSupport` missing) as one-line Markdown. Looks up that listed group's weight from `proposal.groups`. Uses the same without-floor list as hideFirstGroupWithoutFloor and hideLastGroupWithoutFloor. Honest when remaining is zero, none, or no inspected package is available. Distinct prefix from last-without-floor remaining copy, last-without-floor cost copy, aggregate groups-without-floor remaining copy, groups-without-floor count copy, first group-without-floor label copy, last group-without-floor label copy, first-without-floor cost copy, and remaining change-budget copy. A floor is a number you entered, not a legal quorum. Mixing weights are not a legal right. Do not treat labels as legal identities. Display-only. The solver ignores the copy.
- `formatFirstGroupWithoutFloorCostMarkdown(proposal, options)` copies mixing-weight cost of the first group without a declared support floor (`minSupport` missing) as one-line Markdown. Looks up that listed group's weight from `proposal.groups`. Uses the same without-floor list as hideFirstGroupWithoutFloor, hideLastGroupWithoutFloor, and formatFirstGroupWithoutFloorRemainingMarkdown. Honest when cost is zero, none, or no inspected package is available. Distinct prefix from last-without-floor cost copy, first-without-floor remaining copy, last-without-floor remaining copy, aggregate groups-without-floor remaining copy, groups-without-floor count copy, first group-without-floor label copy, last group-without-floor label copy, and remaining change-budget copy. A floor is a number you entered, not a legal quorum. Mixing weights are not a legal right. Do not treat labels as legal identities. Display-only. The solver ignores the copy.
- `formatLastGroupWithoutFloorCostMarkdown(proposal, options)` copies mixing-weight cost of the last group without a declared support floor (`minSupport` missing) as one-line Markdown. Walks groups from the end. Does not call `formatFirstGroupWithoutFloorCostMarkdown`. Looks up that listed group's weight from `proposal.groups`. Uses the same without-floor list as hideFirstGroupWithoutFloor, hideLastGroupWithoutFloor, and formatLastGroupWithoutFloorRemainingMarkdown. Honest when cost is zero, none, or no inspected package is available. Distinct prefix from First-without-floor cost, First-without-floor remaining, Last-without-floor remaining, Groups-without-floor remaining, Groups without a support floor count, first/last group-without-floor label, and remaining change-budget. A floor is a number you entered, not a legal quorum. Mixing weights are not a legal right. Do not treat labels as legal identities. Display-only. The solver ignores the copy.
- `formatRecommendedChangeCostCsv(proposal, result)` writes formula-safe CSV of `clause,original_option,recommended_option,cost_delta`. Unavailable when there is no recommended package. Cells that look like spreadsheet formulas receive a leading apostrophe.
- `compareWorkshopFiles(leftText, rightText)` compares two proposal or workspace JSON files by group and clause identifiers. Identifiers present on only one side are listed. Support scores are compared only for shared group and option ids; missing groups are not treated as zero. `aligned` is true only when both files declare the same group and clause ids.
- `formatWorkspaceJson(proposal, prefs)` writes a version-1 workspace document with `clauseDensity` of `compact` or `comfortable` (default comfortable), and boolean display filters `vetoGroupsOnly`, `lockedClausesOnly`, `changedClausesOnly`, `belowFloorGroupsOnly`, `overBudgetClausesOnly`, `hideGroupsAtFloor`, `hideGroupsWithoutFloors`, `noCheaperRemainingClausesOnly`, `hideUnlockedClauses`, `hideLockedClauses`, `hideGroupsMeetingThreshold`, `hideGroupsBelowThreshold`, `hideVetoGroups`, `hideNonVetoGroups`, `hideFirstVetoGroup`, `hideLastVetoGroup`, `hideFirstNonVetoGroup`, `hideLastNonVetoGroup`, `hideLastGroupBelowThreshold`, `hideFirstGroupBelowThreshold`, `hideLastGroupAtOrAboveThreshold`, `hideFirstGroupAtOrAboveThreshold`, `hideLastGroupAtFloor`, `hideFirstGroupAtFloor`, `hideFirstGroupBelowFloor`, `hideLastGroupBelowFloor`, `hideLastGroupWithoutFloor`, and `hideFirstGroupWithoutFloor` (default false, meaning show all), plus the canonical proposal. `parseWorkspaceJson` reads that document or a bare proposal. Omitted density restores to comfortable. Omitted filter flags restore to show-all. Invalid density, non-boolean filters, and unknown wrapper keys are rejected. Density and these filters are display preferences; the solver ignores them.
- `formatLocksJson(proposal)` writes a version-1 `smallest-agreement-locks` document listing `{ clauseId, optionId }` for every locked clause. `parseLocksJson(text, proposal)` replaces every lock from that document. Unknown clause or option ids fail closed. An empty locks array clears every lock. The input proposal is not mutated.
- `resetGroupSupport(proposal, groupId)` copies the proposal and blanks that group's support scores. The copy is invalid until those cells are filled. Unknown group ids fail closed. It does not mutate the input.

Snapshot libraries hold at most 20 canonical proposals and reject stored payloads over 5,000,000 characters. Single-draft JSON import remains bounded at 250 KB. Undo keeps at most 50 prior draft states in memory; undo history, custom choices, near-miss sort, and downside settings are not part of the proposal schema. Optional clause notes are part of the proposal schema and are ignored by search.

### Approval margin

The optional package review can separate aggregate approval margin from non-approval constraints. It states the selected package context, unchanged assumptions and applicable bounds. It does not modify proposal rules or infer real votes from supplied scores.

### Group floor and veto slack

The optional package review can show group-specific remaining support above declared floors and veto requirements. It states the selected package context, unchanged assumptions and applicable bounds. It does not modify proposal rules or infer real votes from supplied scores.

### Option support and cost dominance

The optional package review can find within-clause alternatives that improve every declared score without added cost or changes. It states the selected package context, unchanged assumptions and applicable bounds. It does not modify proposal rules or infer real votes from supplied scores.

### Single-clause substitutions

The optional package review can review every one-clause alternative around the fixed package. It states the selected package context, unchanged assumptions and applicable bounds. It does not modify proposal rules or infer real votes from supplied scores.

### Rollback contribution

The optional package review can show what is lost when each recommended change returns to its original option. It states the selected package context, unchanged assumptions and applicable bounds. It does not modify proposal rules or infer real votes from supplied scores.

### Threshold scenarios

The optional package review can show whether nearby approval rules change the least-cost passing package. It states the selected package context, unchanged assumptions and applicable bounds. It does not modify proposal rules or infer real votes from supplied scores.

### Budget scenarios

The optional package review can compare discrete cost limits without changing scores or locks. It states the selected package context, unchanged assumptions and applicable bounds. It does not modify proposal rules or infer real votes from supplied scores.

### Single-lock opportunity cost

The optional package review can compare removing one lock while retaining every other declared constraint. It states the selected package context, unchanged assumptions and applicable bounds. It does not modify proposal rules or infer real votes from supplied scores.

### Targeted support uncertainty

The optional package review can stress one group at a time while holding the selected package fixed. It states the selected package context, unchanged assumptions and applicable bounds. It does not modify proposal rules or infer real votes from supplied scores.

### Review packet contract

`createAgreementReviewPacket(proposal, tool)` and `replayAgreementReviewPacket(packet)` bind canonical inputs to exact review result primitives. Version 1 uses format `agreement-review`, six strict top-level fields and a 1 MiB serialized cap. Replay recomputes; changing an input snapshot or result rejects the packet. These are unsigned records, not authenticated decisions. Aggregate calculations preserve full floating-point values in the packet even when the display rounds. The normal solver retains its 50,000-combination cap. Threshold/budget reviews cap each of at most five additional searches at 10,000; single-lock reviews share a total 50,000-candidate budget across their counterfactual searches. 1.5.37 does not change this contract or AGREEMENT_REVIEW_TOOLS.
