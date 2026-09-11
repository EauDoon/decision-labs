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
