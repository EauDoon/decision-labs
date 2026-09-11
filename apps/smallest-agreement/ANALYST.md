# Offline analyst commands

Run from this app directory with Node.js 20 or newer. No install, server,
account, or network is used. Commands read the named local files or UTF-8
standard input (`-`) and write results to standard output. They never modify
input files. Output contains the supplied participant data and notes. Review
it before sharing. Shell redirection is your choice and can overwrite files.

```sh
npm run --silent analyze -- solve proposal.json
node scripts/analyze.mjs solve - < proposal.json
```

`solve` accepts proposal JSON or a version-1 workspace export, validates and
canonicalizes through the existing model, and returns its bounded exhaustive
result with up to five passing alternatives. Unknown proposal fields are
discarded by the model. Workspace display preferences are ignored. Input is
limited to 256 KiB of valid UTF-8; a BOM is accepted. Search is limited to
50,000 lock-permitted combinations. `infeasible` and `too_large` are distinct
successful reports, never fabricated recommendations.

Exit 0 means a report was produced. Exit 2 means invalid usage, input, or an
unreadable file; a JSON error appears on stderr with no stdout result. JSON
parse errors do not echo input text. Run `node scripts/analyze.mjs --help`
for syntax. Use the direct `node` command or npm's `--silent` flag for clean
machine-readable stdout. Scores, weights, and costs are human assumptions.
These reports cannot establish fairness, consent, legal validity, or authority.

## Inspect a proposed package

`node scripts/analyze.mjs evaluate proposal.json original,balanced`
evaluates exactly one option ID per clause in the proposal's clause order.
Use the actual IDs in your export. The result includes support, cost, threshold
and constraint checks even when the package fails. Unknown or missing IDs are
errors. This command evaluates your selection without searching or editing it.

## Stress a fixed package

`node scripts/analyze.mjs stress proposal.json original,balanced 0,5,10,20`
reduces all support scores by each supplied drop, clamped at zero. Enter 1 to
20 drops from 0 to 100. Each row evaluates the same selected option IDs with
the original locks, budget, floors, and vetoes. Cost stays fixed. This is a
deterministic downside scenario, not a probability estimate or a new search.

## Compare workshop revisions

`node scripts/analyze.mjs compare before.json after.json` returns the model's
identifier-aware input comparison plus separately solved before/after cases.
Both files can be proposals or workspace exports; at most one can be stdin.
Added or removed IDs remain explicit, never invented zero scores. Read the
input changes before attributing an outcome difference to any one assumption.

## Create a portable review packet

`node scripts/analyze.mjs review proposal.json margin` emits the same version-1
`agreement-review` packet as the browser, including canonical scenario, exact
input snapshot, explanatory limits, and calculated table. The supported tools
are listed by `--help`. Packets can be imported through the browser's review
import. Scenario review searches retain each model tool's existing caps;
`too_large` is unavailable, not infeasible. When no recommendation exists,
the packet explicitly identifies its original-package context. A packet is
reproducible model evidence, not an authenticated decision record.

## Verify a received review

`node scripts/analyze.mjs replay review.json` accepts a review packet up to
1 MiB and recomputes it through the model's strict replay validator. It returns
the verified packet or exits 2 for changed inputs, changed results, extra
fields, or unsupported versions. CLI packets use compact JSON. If a packet no
longer matches the current model, run a new review; do not edit its claimed
results. Successful replay proves internal reproducibility under this model,
not who created the packet or whether the declared assumptions are true.

## Process a bounded workshop batch

`node scripts/analyze.mjs batch workshops.jsonl` reads one complete proposal
or workspace JSON object per nonblank line, up to 20 records and 1 MiB total.
Each record is limited to 256 KiB and 2,500 search combinations, so the whole
batch checks at most 50,000 combinations. A larger individual search reports
`too_large`; run that case with `solve` to use the normal 50,000 cap.

Output is JSONL in source order with physical line numbers, including one
error row for each invalid record. Valid later records still run. Exit 1
means at least one row failed input validation; exit 0 means every record
produced a report, including honest infeasible or capped reports. File-level
size/record-count errors exit 2 without partial stdout. Batch errors omit raw
JSON contents, but valid reports retain supplied data.
