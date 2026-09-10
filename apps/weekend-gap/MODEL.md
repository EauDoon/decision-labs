# Weekend Gap model notes

## Purpose

This document describes a synthetic, deterministic model of AUD stablecoin redemption operations from Friday 15:00 through Monday 15:00 local time. It is designed to make operating-window constraints visible. It is not a valuation model, market forecast, reserve assessment or representation of a real issuer.

## Reserve planner and comparison

The planner uses the same hourly queue and settlement recurrence as the
timeline. Its target is a percentage of total 72-hour demand, not just demand
arrived by the deadline. Hour 1 is the checkpoint after the first hourly step;
hour 72 is Monday 15:00.

Only starting reserve changes. Candidate reserves are integer cents between zero
and nominal liquidity rounded down to cents. Settlement is nondecreasing in
starting reserve under the fixed inputs, so a binary search finds the first
passing cent in at most 39 iterations at the model's A$5 billion bound. A
scale-aware tolerance (128 times machine epsilon times the larger target or
settled amount, below A$0.000143 at the model cap) absorbs floating-point
summation without accepting zero settlement for a positive target. Tests compare planner
outputs with the full simulation and require the preceding cent to fail.

If the maximum allowed reserve cannot meet the target, the result is unreachable.
It must not be read as a recommendation to add reserve. Demand arrival, closed
windows, throughput, and nominal liquidity may each prevent the target.

Comparison deltas are current minus baseline. Baselines are detached canonical
scenarios saved with the local workspace. A decrease in queue is not necessarily an improvement
if demand or other assumptions changed. The analysis JSON report binds both
input scenarios, changed fields, summaries, planner target and deadline, and
hourly queue values. It has no timestamp, making identical inputs reproducible.

## Units and editable assumptions

All money values are Australian dollars (AUD). Throughputs and FX depth are AUD per hour. Operating hours use a local 24-hour clock and apply on business days only. The editable scenario contains:

- Nominal stablecoin liquidity: the modeled outstanding nominal base used in the liquidity-ratio denominator.
- AUD reserve and cash capacity: the maximum cash pool that can be paid in the 72-hour simulation.
- Issuer redemption throughput and business-day operating window.
- Bank settlement operating window.
- FX depth, weekday spread and weekend multiplier.
- Australian AUD payout or off-ramp throughput and business-day operating window.
- Total 72-hour redemption demand.

Demand timing is explicitly selected: flat, Friday burst, Saturday burst, or Monday rush. Total demand is the only demand-volume input; each profile redistributes it deterministically. Adjacent earlier and later steps move Friday burst, flat, then Monday rush without randomness. Saturday burst is an extra synthetic arrival profile used by the Saturday market burst preset; the three-row timing experiment still compares flat, Friday burst and Monday rush. Presets change only visible scenario fields. The Long-weekend Friday start (synthetic) preset turns on Saturday and Monday holidays and keeps Normal Friday operating windows. The Compressed Friday close (synthetic) preset uses Friday burst arrivals and 16:00 operating closes without holiday flags. The Payday Friday burst (synthetic) preset keeps Normal Friday operating windows and uses Friday burst arrivals with a larger total demand. The Public-holiday Monday (synthetic) preset keeps the Normal Friday start and operating windows and turns on the Monday holiday so Monday banking windows stay closed. The Saturday market burst (synthetic) preset keeps the Normal Friday 72-hour calendar and uses Saturday-weighted arrivals. Optional issuer, bank, payout and FX display labels default to Issuer, Bank, Payout and FX. Older files without a demand profile default to flat. Older files without display labels restore those generic names.

## Timeline and gates

The timeline has 72 one-hour events beginning Friday 15:00, plus an initial state at hour zero. For each event `t`, demand enters the queue. An issuer redemption gate, bank settlement gate and Australian AUD payout gate must all be open for settlement to occur. Each gate is available only on Monday through Friday and only inside its editable local-hour window. An optional `mondayHoliday` flag, default false, treats Monday as a non-business day like Sunday: issuer, bank and payout windows stay closed, and the weekend FX multiplier applies. Older scenario JSON without the field keeps a weekday Monday. An optional `saturdayHoliday` flag, default false, treats Saturday as a non-business day like Sunday. Saturday is already a weekend in the model; the flag records an explicit Sunday-like public holiday and labels Saturday accordingly. When the flag is on, the simulator notices that Saturday holiday and Sunday-style close overlap, so both weekend days are treated as closed. When Monday holiday and Saturday holiday are both on, a separate notice says Saturday, Sunday and Monday stay closed under Sunday-style rules. Older files without the Saturday field keep the existing weekend Saturday.

The FX weekend multiplier applies on Saturday and Sunday:

```text
weekend FX depth = weekday FX depth / weekend multiplier
weekend FX spread = weekday FX spread × weekend multiplier
```

The model still requires issuer, bank and payout gates to settle. FX weakening therefore changes the synthetic spread and the capacity available in any hypothetical weekend overlap, but does not reopen a closed payout chain.

## Core formulas

For each hour, let `Q` be queued demand, `D` total redemption demand, `R` reserve remaining, `I` issuer hourly throughput, `F` available FX depth, and `P` payout hourly throughput.

```text
demand_this_hour = D * weight_this_hour / sum_of_all_72_weights
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

The model exports pure functions. It sanitizes untrusted scenario data, clamps numeric values to bounded ranges, caps reserve capacity at nominal liquidity, enforces an operating window of at least one hour, and rejects malformed JSON and URL hashes without executing them. Scenario envelopes must carry the supported `weekend-gap-scenario` format and version; raw scenario objects remain importable, while malformed, unsupported, and analysis-report envelopes are rejected. It has no random input and no network access.

Explicit failure states include a closed issuer, bank or payout gate, zero reserve, zero throughput, zero FX depth, no overlapping payout time in the next seven days, malformed import JSON and malformed shared URLs. A failed import or hash keeps the current or default scenario instead of partially applying data.

## Non-goals and limitations

- The model cannot prove the actual liquidity, reserves, redemption rights, compliance status or operating hours of any issuer or financial institution.
- It does not represent a real bank, FX desk, off-ramp, blockchain, exchange, legal jurisdiction or payment scheme.
- It assumes one aggregate queue and one settlement route. It does not simulate priority, partial fills across venues, credit lines, fees, counterparty default, holidays, queue cancellation, token transfers, market makers or arbitrage.
- Business-day hours are illustrative local hours. The only holidays in the model are the optional synthetic Monday holiday and the optional Saturday holiday flag. Other public holidays and daylight-saving transitions remain outside the model.
- A cash reserve is treated as immediately available once all operating gates are open. This is an assumption, not a claim about custody or settlement finality.

Use the simulator to compare assumptions and reason about dependencies, not to make a trading, redemption, investment, legal or operational decision.

## Demand timing

Flat arrivals remain the default for existing scenario files. Friday burst gives each of the first nine hours weight 8, all other hours weight 1. Monday rush gives hours 57 to 71 weight 8. Each hourly demand is total demand times its weight divided by the sum of weights. This conserves total demand subject to floating-point rounding. The reserve planner uses exactly the same arrival schedule.

## Diagnostic semantics

There are 72 intervals and 73 checkpoints. A checkpoint's arrived and settled values describe the interval that just ended. Immediate capacity describes the next interval at that checkpoint. The initial checkpoint has no preceding interval. Queue exposure is the sum of all 72 end-of-interval queue balances times one hour, measured in AUD-hours. It is an exposure proxy, not a customer wait-time estimate. The longest backlog run counts consecutive intervals with a positive closing queue.

Blocker counts include every closed gate and exhausted reserve observed in an interval with a closing backlog. Counts can overlap and must not be added or interpreted as causal attribution. With no closed gate, the smallest available capacity is reported. Equal capacity ties use the model's existing deterministic order. A constrained resource may have no marginal effect if another gate is closed.

Sensitivity holds other assumptions fixed and scales one supported field by 50%, 75%, 100%, 125% and 150%. Effective values are sanitized and any cap is labeled. Starting from zero gives five zero cases. Increasing reserve cannot repair non-overlapping windows or throughput limits. The pinned baseline is separate from the sensitivity experiment's current-scenario reference.

Hours to first settlement is the 0-based hour offset of the first interval with positive settlement. The dashboard reports "No settlement in 72h" when none of the 72 intervals settle. Comparison deltas for this field are numeric only when both runs settle; a mixed null and number is stored as null rather than coerced through zero.

Hours to clear the queue is the first checkpoint hour where queued AUD is 0 after a checkpoint with a positive queue. The dashboard reports "queue remains" when the queue never returns to zero, and "No queue in 72h" when it never goes positive. Comparison deltas follow the same numeric-or-null rule as hours to first settlement.

Hourly limiting-gate attribution counts `limitingGate` at the start of each of the 72 intervals. Closed issuer, bank or payout gates are named before throughput or reserve. The count is an observation, not the marginal effect of changing one assumption. It is separate from overlapping backlog-blocker counts in the diagnostics list.

A window-shift preview adds whole hours to one gate's start and end, then clamps with the existing one-hour minimum window and re-runs the simulation. Peak queue and settled total deltas are relative to the current scenario. Apply is a separate action and is one scenario-history step, so Undo scenario edit restores the previous window.

Demand-profile comparison reuses every other current assumption and runs flat, Friday burst and Monday rush. Earlier and later step buttons preview one adjacent profile, then apply it as a separate history step. Saved-experiment comparison accepts two or three library copies only. Two scenario JSON files can be compared for queue and settlement diffs; mixed settlement or queue-clear hours stay null. Three scenario JSON files labeled baseline, current and imported can be summarised side by side; hours stay null when a run never queues or never settles, and the open scenario is not replaced. None of these comparisons is a forecast.

The gate Gantt plots 72 hours of issuer, bank and payout open/closed state plus weekday versus weekend FX. Closed and weekend hours use hatched fills so open versus closed is not color-only. A text table remains the required equivalent. The selected-hour marker follows the timeline. The first-payout marker is `nextPayoutTime` from hour zero given starting reserve. A paired-row comparison Gantt draws current above baseline for each gate. Its table lists hours where those calendars differ and always includes the selected hour. A display filter can hide hours that are open on every gate; the table and chart are a local drawing and the model still contains 72 hours. A second display filter can show only Issuer, Bank, Payout or FX, with All gates restore; simulation results stay unchanged. A third display filter can show only hours where issuer, bank, payout and FX are all closed; uncheck to restore all hours. Keyboard `f` jumps to the first chart hour where the bank is closed, or the first closed issuer, bank or payout hour if the bank never closes. Keyboard `c` copies the same selected-hour Markdown as the copy button. Keyboard `x` copies the same closed-hours Markdown as the copy control. Keyboard `h` jumps to the selected Gantt hour table. Keyboard `b` jumps to the Bank Gantt row, or the Gantt heading if that row is filtered away. Keyboard `m` jumps to the paired compare Gantt heading if present, otherwise the gate Gantt. Keyboard `t` jumps to the timing review heading. A Gantt CSV exports open or closed state for the same 72 chart hours. Selected-hour Markdown copies issuer, bank, payout and FX state for the timeline hour with a synthetic-not-live notice. Peak-queue hour Markdown copies the peak checkpoint hour, queued AUD and gate state, and is distinct from selected-hour copy. Closed-hours Markdown lists each chart hour and which gates are closed; it is a local drawing, not a bank feed. FX-hours Markdown lists weekday depth versus weekend thinning for the same 72 chart hours; it is a local drawing, not a bank feed. Hours-to-clear Markdown copies one synthetic line for the queue-clear checkpoint. Arrival-cohort Markdown copies cohort window, arrivals and remaining amounts and is not a forecast. A formula-safe queue CSV exports the hour label and queue size at every checkpoint. A one-row dashboard CSV exports hours to clear, the peak hour label and hours to first settlement; empty cells mean those events never occurred. Printable queue and sensitivity bar SVGs are light-background paths and can be downloaded as files. Reports may inline the Gantt SVG, the comparison Gantt, the queue path and the hourly limiting-gate table. A Markdown report copies hours to clear the queue and the peak queue hour. Dashboard Markdown copies hours to clear, peak queue hour and hours to first settlement. Limiting-gate Markdown copies the 72-hour observation counts and is not a causal ranking. The hourly table highlights the peak queue checkpoint in text as well as style and can hide hours with no backlog without changing dashboard counts. Print and print redacted include the hours-to-clear line and one peak-queue hour line. Print redacted replaces custom gate display labels with generic Issuer, Bank, Payout and FX and does not change the saved scenario. None of these drawings or reports contain timestamps.

## Recovery and output boundaries

Workspace v1 stores canonical current and baseline scenarios, bounded notes (4000 characters), target, deadline, selected hour, Gantt hour index (`ganttHourIndex`, integer 0 to 72), Gantt table density (`snapshots`, `all` or `open`), selected chart (`queue` or `gantt`), `ganttClosedOnly` (boolean), `ganttGateFilter` (`all`, `issuer`, `bank`, `payout` or `fx`), `queueBacklogOnly` (boolean) and `ganttEveryGateClosed` (boolean). Older workspace files without density restore to six-hour snapshots. Older files without selected hour restore hour zero. Older files without Gantt hour index restore hour zero or the selected hour. Older files without selected chart restore the queue chart. Older files without `ganttClosedOnly` restore all hours. Older files without `ganttGateFilter` restore all gates. Older files without `queueBacklogOnly` restore all queue-table hours. Older files without `ganttEveryGateClosed` restore all Gantt hours. Unknown workspace keys and unknown field values are rejected. Imports are size-bounded and atomically decoded before replacing state; computed results are regenerated. The library contains at most 12 canonical scenarios. Scenario undo keeps at most 40 snapshots in memory. Portable reports are static escaped HTML with a restrictive content security policy and may inline the current gate Gantt, the baseline-versus-current Gantt, queue path and limiting-gate counts. Formula-safe queue, Gantt and dashboard CSVs quote cells and prefix formula-like text. The hourly ledger CSV contains only fixed headers, model-generated time labels and numeric values, so scenario names cannot inject spreadsheet formulas. Analysis JSON has no timestamp.

### Queue exposure by day

The optional timing review can decompose end-of-hour queue exposure and demand across the four partial calendar days. It preserves the current scenario and states timing conventions and numerical limits in each table. This is synthetic analysis, not a promise of operational service.

### Arrival-cohort waiting ledger

The optional timing review can attribute hourly settlement to earliest arrivals using an explicit FIFO assumption. It preserves the current scenario and states timing conventions and numerical limits in each table. This is synthetic analysis, not a promise of operational service.

### Settlement checkpoints

The optional timing review can compare service progress against both arrived and full-horizon demand. It preserves the current scenario and states timing conventions and numerical limits in each table. This is synthetic analysis, not a promise of operational service.

### Complete-chain closure spells

The optional timing review can locate continuous intervals when operating windows prevent any complete payout chain. It preserves the current scenario and states timing conventions and numerical limits in each table. This is synthetic analysis, not a promise of operational service.

### Operating-window overlap

The optional timing review can show individually open hours that cannot form a complete chain. It preserves the current scenario and states timing conventions and numerical limits in each table. This is synthetic analysis, not a promise of operational service.

### Reserve needed by service target

The optional timing review can compare minimum whole-cent reserves for four full-horizon settlement targets. It preserves the current scenario and states timing conventions and numerical limits in each table. This is synthetic analysis, not a promise of operational service.

### Joint-throughput ladder

The optional timing review can test coordinated throughput increases while retaining reserve, demand and operating windows. It preserves the current scenario and states timing conventions and numerical limits in each table. This is synthetic analysis, not a promise of operational service.

### Holiday assumption comparison

The optional timing review can compare all four Saturday and Monday holiday combinations with other inputs fixed. It preserves the current scenario and states timing conventions and numerical limits in each table. This is synthetic analysis, not a promise of operational service.

### Hourly effect of extra reserve

The optional timing review can locate when an additional reserve increment changes actual modeled settlements. It preserves the current scenario and states timing conventions and numerical limits in each table. This is synthetic analysis, not a promise of operational service.

### Review packet contract

`createWeekendReviewPacket(scenario, tool)` requires a complete already-valid typed scenario. `replayWeekendReviewPacket(packet)` requires format `weekend-review`, version 1, six exact top-level fields, an exact canonical source snapshot and every recomputed output primitive. Serialized packets are bounded to 1 MiB and UI downloads use those same compact bytes. The existing scenario sanitizer remains unchanged. Review input does not silently clamp invalid evidence. FIFO attribution is an additional analysis convention, not a change to the aggregate recurrence; completed waits start at zero for same-step settlement, and unfinished amounts accrue wait through hour 72.
