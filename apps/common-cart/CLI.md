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
