# Offline analyst CLI

From this app directory, use Node.js 20 or newer. No dependencies or network
access are needed. These are deterministic planning results, never orders or
merchant commitments. Outputs are organizer-private unless explicitly identified
as merchant aggregates. Keep private outputs out of public repositories.

```sh
npm run analyze -- market --input scenario.json --output market.json
node scripts/analyze.mjs market --input -
node scripts/analyze.mjs --help
```

`market` evaluates every offer and ranks candidates using the existing model.
It includes allocations, buyer identifiers, normalized inputs, and the winner,
which is null when no offer qualifies. See MODEL.md for ranking and limits.

Supply a scenario JSON export through `--input`, or pipe UTF-8 JSON using `-`.
UTF-8 BOMs are accepted. Input is capped at 1 MiB, including stdin. Malformed
JSON, invalid model inputs, unknown/duplicate options, device paths, and directory
inputs fail with exit code 1 and diagnostics on stderr. Exit code 0 means success.
Omitted `--output` or `--output -` writes JSON to stdout. A named output uses
exclusive creation, so existing files and symlinks are never overwritten. No
output is created until analysis succeeds. Parent directories must already exist.
Unix output permissions request owner read/write; Windows access follows local
ACLs. Shell redirection is controlled by your shell and can overwrite files.

## Inspect one offer

`node scripts/analyze.mjs offer --input scenario.json --offer O01` returns the
offer evaluation, grouped exclusion reasons, next-tier gap and capacity bar.
Offer IDs are exact and must exist. This organizer-private report explains whole
orders that cannot fit, deadline/budget exclusions and unreachable price tiers.
Options for another command are rejected rather than silently ignored.

## Prepare merchant aggregates

`node scripts/analyze.mjs merchant --input scenario.json --output merchant.json`
uses the existing merchant report and residual report allowlists. It includes
merchant offer terms, aggregate demand and leftover counts, without room titles,
buyer labels, identifiers, individual budgets or allocations. Aggregate reports
are not anonymization guarantees for small groups. Residual fills are planning
alternatives, not simultaneous purchases or reserved inventory.

## Run organizer reviews

`node scripts/analyze.mjs tools` lists the model's supported review IDs and titles.
`node scripts/analyze.mjs review --input scenario.json --tool withdrawal` runs
one review, preserving its columns, rows and limitations. Current tools cover
withdrawal stress, shipping exposure, delivery slack, minimum/capacity previews,
stranded buyers, dependency, coverage and same-cohort alternatives. Review output
can contain private buyer labels. An unsupported or missing tool fails closed.

## Save and replay review evidence

```sh
node scripts/analyze.mjs packet --input scenario.json --tool coverage --output packet.json
node scripts/analyze.mjs replay --input packet.json --output replayed.json
```

Packets retain the full private scenario, canonical input snapshot and review.
Replay recomputes through the model and rejects changed snapshots, result cells,
metadata or unsupported packet shapes. Success writes the recomputed packet.
Packets are unsigned: internal consistency does not authenticate the author or
prove inputs are real. Keep the original packet when investigating a failure.

## Compare negotiations

`node scripts/analyze.mjs compare --input before.json --against after.json`
returns summary metrics and offer-ID alignment. Missing offers are explicit;
merchant names are not used to infer identity. The summary identifies changed
demand. Different currencies retain the model warning and null comparable costs;
no exchange rates or cross-currency savings are invented. At most one source
can be stdin. Both scenarios are validated before any output is written.

## Sweep a negotiation term

```sh
node scripts/analyze.mjs sweep --input scenario.json --offer O01 --field capacity --values '[10,20,30]'
```

Provide 1 to 25 explicit finite JSON numbers for `capacity`, `minimumUnits`,
`unitPrice`, `shippingPerBuyer` or `deliveryDays`. Each value starts from the same
original scenario and rematches all offers, reporting the winning offer, its
units/cost and the changed offer's outcome. Duplicate values remain in supplied
order. Model integer, range and tier-order constraints still apply. All candidates
must validate; an invalid point aborts the entire sweep without output. Source
files remain unchanged. This is sensitivity exploration, not optimization or a
claim that a merchant will accept a term.

## Evaluate a scenario batch

`node scripts/analyze.mjs batch --input scenarios.jsonl --output results.jsonl`
reads 1 to 25 complete scenario objects, one JSON object per line. The whole
file is capped at 1 MiB. CRLF and one final newline are accepted; blank lines
fail with their physical line number. Every row validates before evaluation
and all results are prepared before writing. Invalid later rows produce no
partial stdout or output file. Results are JSONL objects containing `line` and
the private `market` result, in input order. Correct the reported line and rerun
with an unused output filename. This bounded batch is not a streaming service.
