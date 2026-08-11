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

The named weakest participant has the smallest transaction-volume distance to either its economic exit threshold or its capacity ceiling. This is a local headroom comparison, not a probability of exit.

## Adverse shocks

The app calculates a local deterministic boundary for each participant using all other inputs unchanged:

- Volume decrease: reduction from effective volume to the participant exit volume.
- Fee decrease: reduction from the current fee to the fee where monthly profit equals the acceptable-profit floor.
- Variable-cost increase: increase from the current cost to the cost where monthly profit equals the acceptable-profit floor.

At the displayed boundary, the applicable profit or commitment condition is exactly met. Any further movement in the adverse direction fails. If a participant already fails, the adverse movement is zero. If the named adverse movement cannot cause failure under the current inputs, it is reported as unbounded rather than assigned an invented number.

Capacity is deliberately not converted into a fee or cost shock. It is an independent operational constraint. The fee-volume operating-region grid tests the current participant data over a finite range from zero to the greater of addressable and planned volume, and from zero to 150 percent of the current fee.

## Assumptions and limits

The model treats costs, shares, risk cost, capacity, and minimum acceptable profit as known fixed inputs for one representative month. It assumes every effective transaction completes, the entered revenue split applies to every transaction, and no participant receives value outside the model unless it is represented in its acceptable-profit floor.

It cannot establish a counterparty's actual reservation value, legal right to exit, cash availability, demand elasticity, cost curve, risk distribution, default loss, compliance obligations, tax treatment, or long-term strategic value. It also cannot infer probability, causality, or negotiation leverage from a threshold. Use it to make assumptions explicit and to challenge a proposed deal before relying on it.
