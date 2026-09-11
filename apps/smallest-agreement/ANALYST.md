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
