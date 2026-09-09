# Model

## Units and inputs

All money inputs and outputs are monthly currency units unless a field says per transaction. An optional `title` (1 to 80 characters after trimming) names the case in the workbench and in exported JSON. An optional `currency` must be exactly three uppercase ASCII letters such as `USD` and is a display prefix only. The model never converts currencies. Omit `currency` to keep the word `units`. Lowercase codes, longer or shorter strings, and non-strings are rejected rather than coerced.

Shared deal inputs:

- `monthlyVolume`: planned transactions per month before the optional shock.
- `feePerTransaction`: gross fee collected per transaction.
- `addressableVolume`: maximum transactions per month available from addressable demand.
- `volumeShockPct`: an optional reduction from planned volume, from 0 to 100.
- `title`: optional case name. If present, it must be a string of 1 to 80 characters after trimming.
- `currency`: optional 3-letter uppercase display code. If present, it must match `^[A-Z]{3}$`.
- `notes`: optional free-text notes. If present, it must be a string of 1 to 500 characters after trimming. Notes travel with JSON, hash links, and autosave, and they appear in printed and Markdown reports. They are not interpreted as formulas or instructions.

Participant inputs:

- `revenueShare`: share of gross fee revenue, from 0 through 1. All participant shares must sum to exactly 1.
- `variableCostPerTransaction`: participant-specific variable cost per completed transaction.
- `fixedMonthlyCost`: recurring monthly cost.
- `minimumAcceptableProfit`: monthly profit needed to remain in the arrangement, including any outside-option floor supplied by the user.
- `capacity`: optional maximum transactions per month the participant can support.
- `minimumCommitment`: optional minimum monthly transactions required by the participant.
- `riskCost`: monthly expected risk cost entered by the user.

All numeric inputs must be finite, non-negative, and no greater than 1,000,000,000,000,000. Each revenue share must also be at most 1. Between 2 and 24 participants with unique identifiers and non-empty names are required. Participant names are limited to 80 characters and identifiers to 64 characters. Configuration, deal, stress, and participant values must be plain objects. Only own fields are read, so inherited prototype values are ignored. Unknown imported fields and reserved keys (`__proto__`, `constructor`, `prototype`) are rejected rather than preserved. A present `volumeShockPct` of `null` is invalid; omit the field to use zero.

## Formulas

Let `V` be effective monthly volume, `F` be fee per transaction, `S` be a participant revenue share, `C` be variable cost per transaction, `K` be fixed monthly cost, `R` be monthly risk cost, and `M` be minimum acceptable monthly profit.

```text
postShockVolume = monthlyVolume * (1 - volumeShockPct / 100)
V = min(postShockVolume, addressableVolume)

revenue = V * F * S
variableCost = V * C
monthlyProfit = revenue - variableCost - K - R
margin = monthlyProfit / revenue, when revenue is non-zero
contributionPerTransaction = F * S - C
```

Accounting break-even volume is:

```text
(K + R) / contributionPerTransaction
```

when contribution per transaction is positive. If contribution is zero or negative and monthly overhead is positive, accounting break-even is marked impossible. If both are zero, it is zero.

Profit exit volume is:

```text
(M + K + R) / contributionPerTransaction
```

when contribution per transaction is positive. The displayed exit volume is the greater of this profit threshold and any minimum commitment. When the threshold cannot be met by volume, it is marked impossible.

A participant holds only if all three tests pass:

```text
monthlyProfit >= M
effectiveVolume >= minimumCommitment
effectiveVolume <= capacity, when capacity is supplied
```

Capacity use is effective volume divided by capacity. When capacity is omitted the ledger reports Unbounded. When capacity is zero and volume is positive the ratio is undefined and the ledger reports that volume exceeds zero capacity. This ratio is a utilization display, not a probability.

The partnership is viable only when every participant holds.

The named weakest participant has the smallest transaction-volume distance to either its economic exit threshold or its capacity ceiling. Its binding limit identifies the nearest boundary as minimum acceptable profit, minimum commitment, or capacity. This is a local headroom comparison, not a probability of exit. First breakpoint uses a different measure, relative shock size, so the two rankings can name different participants.

## Adverse shocks

The app calculates a local deterministic boundary for each participant using all other inputs unchanged:

- Volume decrease: reduction from effective volume to the participant exit volume.
- Volume increase: increase from effective volume to the participant capacity when that capacity does not exceed addressable demand; otherwise the threshold is unreachable under unchanged inputs.
- Fee decrease: reduction from the current fee to the fee where monthly profit equals the acceptable-profit floor.
- Variable-cost increase: increase from the current cost to the cost where monthly profit equals the acceptable-profit floor.

At the displayed boundary, the applicable profit, commitment, or capacity condition is exactly met. Any further movement in the adverse direction fails. If a participant already fails, the adverse movement is zero. If the named adverse movement cannot cause failure under the current inputs, it is reported as unbounded rather than assigned an invented number.

The First breakpoint card compares bounded volume decreases, volume increases, fee decreases, and variable-cost increases by percentage movement from their current values. An already-failing or at-breakpoint condition ranks first. A zero current value has no percentage denominator, so that shock is ranked after shocks with a finite percentage. Ties use participant order, then volume decrease, volume increase, fee decrease, and variable-cost increase order. This is a deterministic negotiation prioritisation aid, not a probability or behavioural forecast.

Capacity remains an independent operational constraint rather than a fee or cost shock. Its reachable, bounded volume-increase threshold participates directly in the First breakpoint ranking. The fee-volume operating-region grid tests the current participant data over a finite range from zero to the greater of addressable and planned volume, and from zero to 150 percent of the current fee.

## Compound stress grid and fixed-share negotiation

The optional `stress` object accepts exactly four finite percentages:

- `volumeDropPct`: 0 to 100.
- `volumeGrowthPct`: 0 to 100.
- `feeDropPct`: 0 to 100.
- `variableCostRisePct`: 0 to 200.

All four fields are required if the object is supplied. Legacy cases without it remain valid. The GUI supplies illustrative defaults of 20%, 20%, 10%, and 20%, respectively, and preserves them in case JSON, local storage, and locally served URL fragments. No shares change when a case is imported.

The grid crosses volume changes of current, full decline, and full growth with fee cuts of zero, half, and full, and cost rises of zero, half, and full. Repeated percentage values on an axis are removed, giving 1 to 27 cases. Different shocks that produce the same demand-capped volume remain separate labeled cases. Counts are not probabilities or forecasts. Every scenario applies all its shocks at once:

```text
baseV = min(monthlyVolume * (1 - volumeShockPct / 100), addressableVolume)
scenarioV = min(baseV * (1 + volumeChangePct / 100), addressableVolume)
scenarioF = feePerTransaction * (1 - feeDropPct / 100)
scenarioC = variableCostPerTransaction * (1 + variableCostRisePct / 100)
scenarioProfit = scenarioV * (scenarioF * revenueShare - scenarioC) - K - R
```

Growth cannot restore demand after a 100% base volume shock. Percentage cost growth cannot increase a zero base cost. Capacity and commitment remain independent exit tests. Costs, shares, and monthly profit floors are otherwise unchanged. The model finds each participant's worst profit gap by evaluating every selected case, so a loss-making participant can have its worst result in a growth case. Ties keep the first case in deterministic grid order.

For each participant and case with positive gross fee revenue, the minimum share that funds the monthly profit floor is:

```text
requiredShare = (scenarioV * scenarioC + K + R + M) / (scenarioV * scenarioF)
fixedMinimumShare = max(requiredShare across every tested case)
```

At zero gross revenue, the required share is zero only if all required costs and profit are zero. Otherwise no finite share funds that case. Values too large for finite floating-point representation also block a proposal.

A single fixed split can be proposed only when all fixed minimum shares fit within 100% and every case passes capacity and commitment tests. A revenue redistribution cannot repair a capacity or commitment breach. No transfers, subsidies, fee changes, or scenario-specific shares are assumed.

The proposal assigns each participant its fixed minimum plus a share of unused revenue proportional to its current share. A floating-point remainder is assigned to the largest proposed share. The model validates the resulting configuration and rechecks every participant in every case using the original profit, commitment, capacity, and numeric-tolerance conventions. It also verifies the input numbers, shock formulas, and proposed shares with exact rational arithmetic over the supplied binary numbers. This prevents a small fixed cost from disappearing beside a large transaction total and falsely certifying a split. The original absolute tolerance of `1e-9` still applies. Either failed recheck returns `precision-limit` and blocks the proposal. Applying it is an explicit GUI action, changes only shares, and creates no commitment outside the workbench.

Each case must also pass two exact aggregate checks: the participants' combined costs and required profits cannot exceed gross fee revenue, and the proposed shares cannot allocate more than that gross revenue. Each aggregate check allows only `1e-9` currency units in total, not a percentage of revenue or a per-participant allowance. A binary share sum that rounds to 1 can still fail this check when large transaction totals make the excess material. Such a split is blocked with `precision-limit` rather than silently borrowing or adding revenue.

This is a feasible split for the selected discrete cases, not a bargaining recommendation, an optimal allocation, or proof covering untested shocks. The minimum-share table describes funding needs even when an operational breach separately blocks an allocation. Displayed calculations use JavaScript floating-point arithmetic. Exact proposal verification uses those supplied binary numbers, not a decimal accounting convention, and can block a split even when rounded displayed results appear to hold.

## Assumptions and limits

The model treats costs, shares, risk cost, capacity, and minimum acceptable profit as known fixed inputs for one representative month. It assumes every effective transaction completes, the entered revenue split applies to every transaction, and no participant receives value outside the model unless it is represented in its acceptable-profit floor.

It cannot establish a counterparty's actual reservation value, legal right to exit, cash availability, demand elasticity, cost curve, risk distribution, default loss, compliance obligations, tax treatment, or long-term strategic value. It also cannot infer probability, causality, or negotiation leverage from a threshold. Use it to make assumptions explicit and to challenge a proposed deal before relying on it.

## Fee negotiation guide

At current effective volume V, the fee floor for participant i is (V times variable cost + fixed cost + risk cost + minimum acceptable profit) divided by (V times revenue share). When the numerator is zero the floor is zero. A positive numerator with zero denominator has no finite floor. Values beyond the numeric input limit are unavailable. The partnership floor is the maximum participant floor. This diagnostic holds volume and shares fixed and does not include demand response or compound stress. Capacity and commitment tests remain separate. Display rounding can move a floor across a boundary, so rerun the model after entering any proposed fee.

Applying a compound case copies its realized volume, shocked fee and participant variable costs to a new baseline. It resets baseline volume shock to zero, keeps addressable demand and other inputs, and validates the result against input bounds. Stress settings remain the same, so the next grid represents additional shocks from the new baseline.

## Volume-to-hold solver

`solveMinimumVolumeToHold(config, participantId)` binary-searches the minimum monthly volume at which that participant holds, with fee, shares, addressable demand, and volume shock held fixed. The search high bound is the monthly volume that reaches `min(addressableVolume, capacity)` after shock, so a capacity breach at a larger volume cannot hide a lower holding volume. If the participant holds at volume 0, the result is 0. If they still fail at that high bound, the result is `impossible` with the failing tests named. This is a solvability result, not a probability. Applying a proposal is an explicit GUI action and changes only `monthlyVolume`.

## Roster edits

`duplicateParticipant` copies costs and constraints, assigns `nextUnusedParticipantId`, appends ` copy` to the name (trimmed to 80 characters), and sets `revenueShare` to 0 so the original allocation still sums to the same total. `moveParticipant` swaps two adjacent rows without changing shares. `dropAndReallocate` removes one participant when more than two remain and spreads that share across whoever remains in proportion to their current weights. If remaining weights are all zero, the dropped share is split equally. The last remaining participant absorbs floating-point remainder so a previously valid split still sums to 1.

`uniqueCopyName` appends ` copy`, then ` copy 2`, and so on, staying within 80 characters. The GUI uses it when duplicating the current case as an independent snapshot. The copy receives its own title and library entry. Later draft edits do not change the snapshot.

## Share-to-hold solver

`solveMinimumShareToHold(config, participantId)` binary-searches the minimum revenue share in `[0, 1]` at which that participant holds. Remaining participants keep their relative shares of `1 - targetShare`. If remaining current shares sum to 0, leftover is split equally among them. The search is deterministic and does not assign probability. If the participant holds at share 0, the result is 0. If the participant still fails at share 1, the result is `impossible` with a reason. Capacity and commitment tests do not depend on share, so those failures remain impossible to repair this way. Applying a proposal is an explicit GUI action and changes only revenue shares.

## Fee-to-hold solver

`solveFeeForAllHold` returns the partnership fee floor from `calculateFeeRequirements` when every capacity and commitment test already holds. Otherwise it returns `impossible`. The GUI previews the fee and requires Apply. Volume, shares, and costs stay unchanged until then. Demand response is not included.

## Redacted export

`redactConfiguration` copies a valid case, deletes `deal.title` and `deal.notes` if present, and replaces each participant `name` with `Participant 1` through `N`. Identifiers, shares, costs, stress settings, and currency are unchanged. This is a sharing aid, not encryption.

## Participant CSV import

`participantsFromCsv` reads a roster from CSV text and returns participant objects. It does not read deal terms, stress settings, titles, or currency. The workbench replaces the current participants only after the whole file validates.

Required columns, matched case-insensitively after trimming and collapsing spaces: `name`, `revenue share`, `variable cost`, `fixed cost`, `min profit`, and `risk`. Optional columns: `capacity` and `commitment`. Accepted aliases include `share`, `variable cost per transaction`, `fixed monthly cost`, `minimum acceptable profit`, `risk cost`, `minimum commitment`, and underscored forms. Unknown columns, duplicate columns, and missing required columns are named and rejected.

A leading apostrophe is stripped when the remaining cell looks like a spreadsheet formula (`=`, `+`, `-`, or `@`, including after ASCII controls). The remaining text is data. It is not executed. Numbers must be finite decimals; they are not coerced from hex, empty strings, or prose. Empty optional capacity or commitment cells become `null`. Names are trimmed to at most 80 characters. Identifiers are generated from names, kept unique, and limited to 64 characters.

Between 2 and 24 data rows are required. Revenue shares must sum to 1. Validation errors name the row (`Row 3 revenue share`) or the column. A rejected CSV leaves the current roster unchanged.

## Export filenames

`exportDownloadName` builds download names from an optional deal title. The title is lowercased, non-alphanumeric runs become hyphens, and the slug is capped at 40 characters. `Harbor JV` becomes `partnership-breakpoint-harbor-jv.json`. Empty or unusable titles keep the previous names (`partnership-breakpoint.json`, `partnership-breakpoint-redacted.json`, `partnership-breakpoint-report.md`, `partnership-breakpoint-brief.md`, `partnership-breakpoint-stress.csv`, `partnership-breakpoint-stress-visible.csv`). Path separators cannot appear in the slug.

## Stress-grid CSV

`escapeCsvCell` quotes every field and prefixes string values that look like spreadsheet formulas with an apostrophe. Negative numbers are not treated as formulas.

`stressGridCsv(config, options)` writes one row per participant in each selected case. Omit `options` or omit `scenarioIds` to include every tested case. `scenarioIds` is an optional array of case identifiers; grid order is preserved; unknown identifiers are skipped. Unknown option keys and reserved keys (`__proto__`, `constructor`, `prototype`) are rejected. Row counts describe selected cases, not likelihoods. The GUI Export visible stress CSV uses the currently displayed cases, including after collapsing all-hold rows.

## Three-snapshot compare

`compareThreeSnapshots(current, first, second)` evaluates each valid case and aligns participants by identifier. Each row reports monthly profit and hold or fail for the first snapshot, the second snapshot, and the current draft. If an identifier is missing from a case, that cell is empty rather than filled with zero. `sameRoster` is true only when all three cases have the same identifier set. This is a difference table, not a ranking.

## Charts

The tornado chart plots each participant's smallest bounded adverse percentage shock for volume down, volume up, fee down, and variable-cost up. Unbounded and already-failing cases have no bar. The contribution waterfall steps from revenue through variable, fixed, and risk cost to monthly profit, with a dashed minimum-profit line. Both charts ship with text-equivalent tables. Neither assigns probability.

## Display-only stress mute

Hiding a participant row in the stress ledger is a display filter. Case counts, hold counts, worst profit gaps, operational failures, and any tested proposal still include that participant. Showing the row again does not recalculate the grid.

Collapsing cases every participant holds hides those case-evidence rows from the inspect table only. Expand restores them. `passCount`, `caseCount`, and any proposal stay unchanged. This is a display filter, not a likelihood ranking.

### Feasible effective volume interval

The optional review can intersect participant profit, commitment, capacity and demand limits. It uses only the current validated inputs and changes no terms. The table explains units, unavailable cases and the assumptions held fixed.

### Constraint slack ledger

The optional review can separate profit, commitment and capacity gaps at the actual effective volume. It uses only the current validated inputs and changes no terms. The table explains units, unavailable cases and the assumptions held fixed.

### Fixed-cost allowance

The optional review can show the maximum monthly fixed cost each current split can fund. It uses only the current validated inputs and changes no terms. The table explains units, unavailable cases and the assumptions held fixed.
