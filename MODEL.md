# Model

## Units and inputs

All money inputs and outputs are monthly currency units unless a field says per transaction. The application does not select a currency, so use one consistent currency for every input in a case.

Shared deal inputs:

- `monthlyVolume`: planned transactions per month before the optional shock.
- `feePerTransaction`: gross fee collected per transaction.
- `addressableVolume`: maximum transactions per month available from addressable demand.
- `volumeShockPct`: an optional reduction from planned volume, from 0 to 100.

Participant inputs:

- `revenueShare`: share of gross fee revenue. All participant shares must sum to exactly 1.
- `variableCostPerTransaction`: participant-specific variable cost per completed transaction.
- `fixedMonthlyCost`: recurring monthly cost.
- `minimumAcceptableProfit`: monthly profit needed to remain in the arrangement, including any outside-option floor supplied by the user.
- `capacity`: optional maximum transactions per month the participant can support.
- `minimumCommitment`: optional minimum monthly transactions required by the participant.
- `riskCost`: monthly expected risk cost entered by the user.

All numeric inputs must be finite, non-negative, and no greater than 1,000,000,000,000,000. Between 2 and 24 participants with unique identifiers and non-empty names are required. Participant names are limited to 80 characters and identifiers to 64 characters. Unknown imported fields are rejected rather than preserved.

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

The partnership is viable only when every participant holds.

The named weakest participant has the smallest transaction-volume distance to either its economic exit threshold or its capacity ceiling. Its binding limit identifies the nearest boundary as minimum acceptable profit, minimum commitment, or capacity. This is a local headroom comparison, not a probability of exit.

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
