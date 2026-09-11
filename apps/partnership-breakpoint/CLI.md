# Offline scenario analysis

Run commands from this app directory with Node.js 20 or later. No installation, browser, network, or account is required. The CLI reads exported scenario JSON and writes results to standard output. It never modifies input files. Use shell redirection to save results to a **different** path, since redirecting to an input path can truncate it before the command starts.

```sh
npm run analyze -- summary scenario.json
node scripts/analyze.mjs summary scenario.json
node scripts/analyze.mjs summary - < scenario.json
```

Use the direct `node` command in pipelines to avoid npm's banner. A dash reads standard input. UTF-8 BOM files are accepted. Success exits 0; invalid arguments, unreadable files, malformed JSON and model validation errors exit 1, with a JSON `error` on standard error and no result on standard output. `--help` lists commands. Calculations reuse the browser model, including its tolerances and limits. JSON represents nonfinite calculated numbers as `null`; they are not zero. Results reflect declared assumptions, not likelihoods, forecasts, or financial advice.

`summary` returns the current participant ledger, aggregate economics, viability and first breakpoint. It validates the complete case first, including revenue shares and identifiers. A nonviable but valid scenario is a successful analysis, not an input error.

## Compound stress evidence

```sh
node scripts/analyze.mjs stress scenario.json
node scripts/analyze.mjs stress scenario.json --failed-only
node scripts/analyze.mjs stress scenario.json --csv --failed-only > failures.csv
```

Stress uses the saved settings, or the model's illustrative defaults if omitted. JSON keeps whole-grid `caseCount`, `passCount` and negotiation evidence even when `--failed-only` selects a subset of `scenarios`; `selectedCaseCount` names the subset size. CSV has one row per participant per selected case and uses the existing spreadsheet formula escaping. No failures yields an empty JSON subset or a header-only CSV. Counts describe tested combinations, not probabilities.

## Holding boundaries

```sh
node scripts/analyze.mjs solve scenario.json fee
node scripts/analyze.mjs solve scenario.json share participant-id
node scripts/analyze.mjs solve scenario.json volume participant-id
```

Use a participant's stable `id` from the scenario, not their display name. `fee` holds volume and shares fixed and finds the common fee floor. `share` finds one participant's minimum share while redistributing others' leftover proportionally; this can make another participant fail. `volume` finds that participant's minimum planned monthly volume within demand and capacity limits. These return the existing model's `possible` or `impossible` status and explanation. Impossibility is a valid result with exit 0; no proposal is applied or saved automatically. Capacity and commitment constraints remain visible.

## Compare saved negotiations

```sh
node scripts/analyze.mjs compare current.json first.json
node scripts/analyze.mjs compare current.json first.json second.json
```

Two-case output uses `current` and `imported`; three-case output uses `current`, `first` and `second`. Alignment uses stable participant IDs regardless of roster ordering. Missing participants remain `null` with `rosterMismatch`, never zero profit. At most one scenario may come from stdin. All currency labels must match, including omitted labels. The CLI performs no currency conversion, and matching labels do not certify compatible assumptions.

## Reproducible constraint review

```sh
node scripts/analyze.mjs review scenario.json interval > interval-review.json
node scripts/analyze.mjs replay interval-review.json
```

`review` emits the browser-compatible version 1 review packet: validated scenario, exact input snapshot and derived table. `--help` lists the model's available review IDs. `replay` recomputes the packet and rejects changed inputs, fields or result cells with exit 1. A successful replay returns the verified packet. This checks internal reproducibility, not authorship or real-world truth; a consistently regenerated replacement packet can still contain different assumptions. The model's packet-size limit remains in force.

## Inspect one stress case as a baseline

```sh
node scripts/analyze.mjs stress scenario.json
node scripts/analyze.mjs case scenario.json case-14 > stressed-scenario.json
node scripts/analyze.mjs summary stressed-scenario.json
```

Choose an ID from this scenario's current stress output. Extraction writes importable scenario inputs with that case's effective volume, fee and variable costs. The baseline volume shock is reset to zero so it is not applied twice. Saved stress settings remain, so a later `stress` command tests additional shocks around this new baseline. Unknown case IDs fail without output. The original file is unchanged.

## Export a tested revenue split

```sh
node scripts/analyze.mjs proposal scenario.json > proposed-scenario.json
node scripts/analyze.mjs stress proposed-scenario.json
```

The explicit `proposal` command uses the model's revalidated fixed-share proposal and exports a new browser-importable scenario. Other economics stay fixed. Operational breaches, insufficient revenue and precision failures produce exit 1 with no scenario. To inspect those causes first, run `stress`. A successful proposal means all discrete tested cases hold under the model; it does not establish counterparty acceptance or protection in untested conditions. For a synthetic feasible example, start with Balanced and set volume drop to 5%, with growth, fee drop and variable-cost rise all zero.

## Spreadsheet roster round trips

```sh
node scripts/analyze.mjs roster scenario.json > participants.csv
node scripts/analyze.mjs roster scenario.json edited-roster.tsv > revised-scenario.json
```

With one input, `roster` exports the existing import columns and escapes formula-like names. With a second file, it detects CSV or TSV, validates the whole replacement and emits a scenario with unchanged deal terms. The existing roster size, numeric and share validation applies. Invalid replacement produces no scenario. At most one input may be stdin. Roster import regenerates IDs from names, so retain the original scenario if later comparisons need original IDs. This is the same behavior as browser roster import.

## Remove labels before sharing

```sh
node scripts/analyze.mjs redact scenario.json > redacted-scenario.json
node scripts/analyze.mjs review redacted-scenario.json slack > redacted-review.json
```

Redaction removes the title and notes, replaces names with Participant 1 through N, and replaces custom IDs with `participant-1` through `participant-N`. The model's redaction helper also omits display preferences. Economics, currency and stress settings remain. This is label removal, not anonymization: amounts or circumstances may still identify a deal, so review the output before sharing. Generate any review packets or CSV from the redacted scenario, since existing artifacts are not rewritten. Remapped IDs prevent reliable alignment with the original roster by ID; roster position is preserved. No file is uploaded or changed.
