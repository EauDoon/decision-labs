# Offline analyst CLI

Run from this app directory using Node.js 20 or newer. No installation, browser,
server, account, network or live data is required. All calculations reuse the
browser model and concern synthetic AUD assumptions, not payout instructions.

```sh
npm run analyze -- simulate scenario.json
node scripts/analyze.mjs simulate scenario.json --format markdown
```

Use `-` as the input path to consume JSON on stdin. Output goes to stdout and
errors go to stderr with exit status 1. Success returns status 0. The CLI never
writes input files. Redirect stdout to a different path to save results.
Use `node scripts/analyze.mjs --help` for syntax. Use the direct Node command
when piping JSON because npm may print its own command header.

Scenario input accepts raw objects or the browser's `weekend-gap-scenario` v1
envelope, including a UTF-8 BOM. Missing fields use the model's defaults, which
are included in JSON simulation output. Unknown fields, wrong types, invalid
values and assumptions that require normalization or clamping are rejected.
Fix the reported input and rerun; no previous result or workspace is modified.
Files must be regular files. Scenario inputs are bounded to 250,000 bytes.
All inputs require valid UTF-8. Duplicate JSON object members are rejected at
every depth, including names written with Unicode escapes, before model use.

`simulate` returns the canonical scenario and 72-hour summary as JSON, or the
existing dashboard Markdown. Null settlement times mean no qualifying event
within the modeled horizon, not hour zero or a later forecast.

## Compare assumptions

`node scripts/analyze.mjs compare baseline.json candidate.json` returns both
canonical inputs, summary metrics, changed fields and signed candidate-minus-
baseline deltas. `sameDemand` compares total demand and arrival profile. Inspect
it before interpreting reduced queues. One input may use stdin; two cannot.
Null timing deltas preserve the absence of an event rather than inventing zero.

## Test a reserve target

`node scripts/analyze.mjs reserve scenario.json 75 72` asks for the minimum
whole-cent starting reserve to settle 75% of total 72-hour demand by hour 72.
The target accepts decimals from 0 to 100; the deadline is a whole hour from
1 to 72. An `unreachable` result is a successful analysis with a null minimum,
not a CLI failure. Gates, arrival timing, throughput and nominal cap stay fixed.
The result includes the complete assumptions and the planner's explanation.

## Inspect the hourly ledger

`node scripts/analyze.mjs timeline scenario.json` returns 72 interval rows,
blocker observations, queue AUD-hours and backlog durations as JSON. Concurrent
blocker counts overlap; they are not additive causal effects. Add `--format csv`
for the existing 73-checkpoint ledger, including initial hour zero. CSV arrival
and settlement columns refer to the previous interval; next-hour capacity is
distinct. The last checkpoint closes hour 72; it does not extend the horizon.

## Run a one-factor sensitivity

`node scripts/analyze.mjs sensitivity scenario.json reserveCashAud` returns
the existing 0.5, 0.75, 1, 1.25 and 1.5 multipliers. Supported fields are
`reserveCashAud`, `redemptionDemandAud`, `issuerThroughputAudPerHour`,
`fxDepthAudPerHour` and `payoutThroughputAudPerHour`. Each row contains requested
and effective values, cap adjustment, resulting assumptions and summary. The
input is validated strictly; deliberate experimental cap adjustments remain
visible. Five sampled values establish neither an optimum nor a recommendation.

## Preview an operating-window change

`node scripts/analyze.mjs shift scenario.json bank -1 2` moves the ordinary
bank start one hour earlier and end two hours later. Choose `issuer`, `bank` or
`payout` and whole-hour deltas. The existing model clamps applied windows to its
valid bounds and one-hour minimum. Output keeps the original scenario, requested
shifts, applied scenario and outcome deltas. This is an offline counterfactual;
special calendar flags remain part of the unchanged scenario assumptions.

## Compare arrival timing

`node scripts/analyze.mjs profiles scenario.json` evaluates flat, Friday burst
and Monday rush arrivals with the same total demand, reserve, gates and rates.
The result includes the fixed demand denominator and all three outcome rows.
These are synthetic schedules, not estimates of customer behavior. No-settlement
timings remain null. Unlike comparing arbitrary files, this experiment isolates
the declared demand profile rather than changing the total demand.

## Analyze a saved library

`node scripts/analyze.mjs batch library.json` accepts the existing browser library
format: `{"format":"weekend-gap-library","version":1,"scenarios":[{},{}]}`.
Supply 1 to 12 raw scenario objects. The whole library is validated before any
output is emitted; one invalid entry fails the command without partial rows.
Results preserve input order and duplicate names through one-based indices and
include every canonical scenario and summary. Different demand is not normalized
away, and the CLI does not select a winner. The same 250,000-byte limit applies.

## Create a timing-review packet

`node scripts/analyze.mjs review scenario.json days` emits the native
`weekend-review` v1 packet, including canonical inputs, input snapshot, result
columns and rows, units and methodological notes. It is compatible with the
browser's review replay workflow. Tools are `days`, `cohorts`, `deadlines`,
`closures`, `overlap`, `reserve`, `throughput`, `holidays` and `reserve-hours`.
`--help` reads this catalog directly from the model. Keep each packet's notes
with its rows, especially the FIFO assumption and unfinished waiting amounts
in cohort reviews. Packets carry synthetic inputs, not proof of actual service.

## Replay and verify a saved packet

```sh
node scripts/analyze.mjs review scenario.json days > review.json
node scripts/analyze.mjs replay review.json
```

Replay accepts at most 1 MiB, recomputes the native packet and checks its exact
input snapshot and every result field. Success emits the verified packet, which
can be piped to other local tools. Changed inputs, notes, rows, versions or extra
fields fail with status 1 and no stdout. Recreate a packet from the intended
scenario after changes. This checks reproducibility against the current model,
not authorship, authenticity or real-world accuracy. CLI JSON has no timestamps.

Run `node --test tests/analyze-cli.test.mjs` for subprocess success, error and
recovery checks, plus an independent synthetic hourly-ledger oracle.
