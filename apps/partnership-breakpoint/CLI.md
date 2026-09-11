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
