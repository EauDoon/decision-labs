# Offline scenario analysis

Run commands from this app directory with Node.js 20 or later. No installation, browser, network, or account is required. The CLI reads exported scenario JSON and writes results to standard output. It never modifies input files. Use shell redirection to save results to a **different** path, since redirecting to an input path can truncate it before the command starts.

```sh
npm run analyze -- summary scenario.json
node scripts/analyze.mjs summary scenario.json
node scripts/analyze.mjs summary - < scenario.json
```

Use the direct `node` command in pipelines to avoid npm's banner. A dash reads standard input. UTF-8 BOM files are accepted. Success exits 0; invalid arguments, unreadable files, malformed JSON and model validation errors exit 1, with a JSON `error` on standard error and no result on standard output. `--help` lists commands. Calculations reuse the browser model, including its tolerances and limits. JSON represents nonfinite calculated numbers as `null`; they are not zero. Results reflect declared assumptions, not likelihoods, forecasts, or financial advice.

`summary` returns the current participant ledger, aggregate economics, viability and first breakpoint. It validates the complete case first, including revenue shares and identifiers. A nonviable but valid scenario is a successful analysis, not an input error.
