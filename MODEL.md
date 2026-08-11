# Weekend Gap model notes

## Purpose

This document describes a synthetic, deterministic model of AUD stablecoin redemption operations from Friday 15:00 through Monday 15:00 local time. It is designed to make operating-window constraints visible. It is not a valuation model, market forecast, reserve assessment or representation of a real issuer.

## Units and editable assumptions

All money values are Australian dollars (AUD). Throughputs and FX depth are AUD per hour. Operating hours use a local 24-hour clock and apply on business days only. The editable scenario contains:

- Nominal stablecoin liquidity: the modelled outstanding nominal base used in the liquidity-ratio denominator.
- AUD reserve and cash capacity: the maximum cash pool that can be paid in the 72-hour simulation.
- Issuer redemption throughput and business-day operating window.
- Bank settlement operating window.
- FX depth, weekday spread and weekend multiplier.
- Australian AUD payout or off-ramp throughput and business-day operating window.
- Total 72-hour redemption demand.

The demand schedule is intentionally flat: total demand divided by 72. This makes the user-edited demand total the only demand-volume input and avoids hidden demand shocks or randomness. Presets change only visible scenario fields.

## Timeline and gates

The timeline has 72 one-hour events beginning Friday 15:00, plus an initial state at hour zero. For each event `t`, demand enters the queue. An issuer redemption gate, bank settlement gate and Australian AUD payout gate must all be open for settlement to occur. Each gate is available only on Monday through Friday and only inside its editable local-hour window.

The FX weekend multiplier applies on Saturday and Sunday:

```text
weekend FX depth = weekday FX depth / weekend multiplier
weekend FX spread = weekday FX spread × weekend multiplier
```

The model still requires issuer, bank and payout gates to settle. FX weakening therefore changes the synthetic spread and the capacity available in any hypothetical weekend overlap, but does not reopen a closed payout chain.

## Core formulas

For each hour, let `Q` be queued demand, `D` total redemption demand, `R` reserve remaining, `I` issuer hourly throughput, `F` available FX depth, and `P` payout hourly throughput.

```text
demand_this_hour = D / 72
Q_before_settlement = Q_previous + demand_this_hour

capacity = 0                                      if any gate is closed
capacity = min(I, F, P, R)                        if all gates are open

settled_this_hour = min(Q_before_settlement, capacity)
Q_next = Q_before_settlement - settled_this_hour
R_next = R - settled_this_hour
```

The interface defines immediately redeemable AUD as the current hourly `capacity`, not the total reserve. This distinguishes a cash pool from the amount that can complete the full issuer-to-AUD payout chain now.

```text
effective_liquidity_ratio = immediate_redeemable_AUD / nominal_stablecoin_liquidity

queue_pressure = queued_AUD / total_redemption_demand
estimated_discount_bps = clamp(
  current_FX_spread_bps
  + 550 × (1 - effective_liquidity_ratio)
  + 400 × queue_pressure,
  0,
  10,000
)
```

When total redemption demand is zero, queue pressure is defined as zero. The discount or slippage value is only a synthetic stress indicator. It is not a market quote, executable price, token price forecast or loss estimate.

## Validation and failure states

The model exports pure functions. It sanitizes untrusted scenario data, clamps numeric values to bounded ranges, caps reserve capacity at nominal liquidity, enforces an operating window of at least one hour, and rejects malformed JSON and URL hashes without executing them. It has no random input and no network access.

Explicit failure states include a closed issuer, bank or payout gate, zero reserve, zero throughput, zero FX depth, no overlapping payout time in the next seven days, malformed import JSON and malformed shared URLs. A failed import or hash keeps the current or default scenario instead of partially applying data.

## Non-goals and limitations

- The model cannot prove the actual liquidity, reserves, redemption rights, compliance status or operating hours of any issuer or financial institution.
- It does not represent a real bank, FX desk, off-ramp, blockchain, exchange, legal jurisdiction or payment scheme.
- It assumes one aggregate queue and one settlement route. It does not simulate priority, partial fills across venues, credit lines, fees, counterparty default, holidays, queue cancellation, token transfers, market makers or arbitrage.
- Business-day hours are illustrative local hours. Public holidays and daylight-saving transitions are outside the model.
- A cash reserve is treated as immediately available once all operating gates are open. This is an assumption, not a claim about custody or settlement finality.

Use the simulator to compare assumptions and reason about dependencies, not to make a trading, redemption, investment, legal or operational decision.
