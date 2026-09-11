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

`simulate` returns the canonical scenario and 72-hour summary as JSON, or the
existing dashboard Markdown. Null settlement times mean no qualifying event
within the modeled horizon, not hour zero or a later forecast.

## Compare assumptions

`node scripts/analyze.mjs compare baseline.json candidate.json` returns both
canonical inputs, summary metrics, changed fields and signed candidate-minus-
baseline deltas. `sameDemand` compares total demand and arrival profile. Inspect
it before interpreting reduced queues. One input may use stdin; two cannot.
Null timing deltas preserve the absence of an event rather than inventing zero.
