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

To keep imported and shared drafts bounded, the model accepts at most 24 groups, 20 clauses, and 24 options per clause. Titles, names, labels, identifiers, weights, and change costs also have explicit limits.

Option labels are opaque strings to the model. Only the supplied numbers affect calculation.

## Approval formula

For group `g`, with weight `w_g`, and selected option support score `s_gi` for each clause `i`:

```text
group approval(g) = sum(s_gi for every selected clause option) / number of clauses

overall approval =
  sum(w_g * sum(s_gi for every selected clause option) for every group)
  / (sum(w_g for every group) * number of clauses * 100)
  * 100
```

An agreement passes when overall approval is at least the threshold. The displayed group approval is the unweighted average of that group's selected option scores. The overall result then weights those group averages by the supplied group weights.

## Search and ordering

The search evaluates the Cartesian product of clause options: exactly one selected option for each clause. It always starts by evaluating the status quo, meaning every original option.

If status quo already passes, it is returned with cost 0. Otherwise, passing combinations are ordered by:

1. Lowest total change cost.
2. Fewest changed clauses.
3. Higher overall approval.
4. Lexicographically earlier option IDs in clause order.

This final option-ID rule makes otherwise equal choices reproducible. It does not represent a substantive preference.

Non-passing combinations are ordered as near misses by smallest approval gap, then by the same ordering above. At most five are returned.

## Bound and outcomes

The default maximum is 50,000 combinations. The count is calculated before enumeration. If it exceeds that maximum, the result is `too_large`; no partial search, sampling, or recommendation occurs.

Other explicit outcomes are:

- `invalid`: structural input validation failed.
- `already_passing`: the original proposal passes.
- `found`: at least one changed combination passes.
- `infeasible`: every combination was evaluated and none passes.
- `too_large`: the full search exceeds the configured maximum.

The pure model has no network access, no semantic inference, and no hidden randomness.

## Assumptions and limits

The formula assumes that support can be represented as a 0 to 100 score, group weights are valid for the particular process, clause scores can be averaged, and change costs can be compared and summed. Those are working assumptions, not findings.

Small textual edits can have large semantic, legal, financial, or lived effects. Costs can omit implementation burden, power differences, dependency effects, and who is excluded from the room. A numerical result cannot prove consensus, democratic legitimacy, consent, fairness, representation, legal compliance, or authority to adopt a policy.

Use the result to focus a human conversation. Establish process rules, evidence standards, decision rights, and adoption requirements separately.
