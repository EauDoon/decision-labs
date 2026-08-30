# Model and search contract

## Purpose

The model compares explicitly supplied structured options. It finds the smallest calculated change that crosses a configurable approval threshold. It makes no claim that the result is a collective decision.

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
| `maxChangeCost` | Finite number from 0 to 20,000,000,000 | Sum of selected alternatives' change costs cannot exceed this budget. |
| `clauses[].lockedOptionId` | An option ID belonging to that clause | The search must select this option. Other choices stay in the draft but are excluded from search. |

Omit an optional field to disable it. `null`, numeric strings, unknown option references, and out-of-range values are invalid. In the GUI, a blank budget or floor omits the field; zero remains a real constraint. Locks may select originals or alternatives. A locked alternative still contributes its full cost and counts as a changed clause. Removing a locked option requires unlocking it first.

All constraints apply together. No priority rule silently relaxes a budget, floor, or lock to make a proposal pass. A group floor applies to an average, not to every individual clause and not to semantic consent. JSON canonicalization preserves understood constraints and drops unrelated fields. Unconstrained v1 drafts remain valid and retain their original field shape.

Calculations use JavaScript floating-point numbers. Comparisons use an absolute tolerance of `1e-9` for approval, support floors, costs, and numeric tie breakers. Display rounding never decides feasibility.

## Search and ordering

The search evaluates the Cartesian product of permitted clause options: exactly one selected option for each clause. A locked clause contributes one choice. It starts by evaluating the status quo, meaning every original option, even if a lock requires a different option.

If status quo meets the threshold and every constraint, it is returned with cost 0 after one baseline check. This is optimal because costs are non-negative and no alternative can use fewer than zero changes. Otherwise, all permitted combinations are evaluated and passing combinations are ordered by:

1. Lowest total change cost.
2. Fewest changed clauses.
3. Higher overall approval.
4. Lexicographically earlier option IDs in clause order.

This final option-ID rule makes otherwise equal choices reproducible. It does not represent a substantive preference.

Constraint-compliant combinations below the approval threshold are ordered as near misses by smallest approval gap, then by the same ordering above. At most five are returned. Over-budget and below-floor combinations are excluded rather than presented as adoptable alternatives.

For an enumerated result, `eligibleCombinations` counts combinations meeting every constraint, whether or not they meet the approval threshold. `rejected.anyConstraint` counts rejected combinations once each; `rejected.budget` and `rejected.floors` can overlap. A floor rejection means one or more groups miss their floor. Locks remove options before enumeration, so excluded options are not counted as rejected candidates.

## Bound and outcomes

The default maximum is 50,000 lock-permitted combinations. The count is calculated before enumeration or the baseline shortcut. If it exceeds that maximum, the result is `too_large`; no partial search, sampling, or recommendation occurs. Budgets and floors do not reduce the counted search space. `possibleCombinations` is the permitted search-space size (or a cap-plus-one sentinel when too large). `checkedCombinations` is 1 for an already-passing baseline and the full space for an enumerated result; it does not count the separately reported baseline again.

`findSmallestAgreement(proposal, options)` accepts a plain object with only `maxCombinations` (integer from 1 through 50,000) and `nearMissLimit` (integer from 0 through 5). Both default to those maxima. `null`, non-objects, unknown keys, inherited values, and values outside those ranges return `invalid`. A caller can lower a cap for tests or a tighter bound, but cannot raise either cap.

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
