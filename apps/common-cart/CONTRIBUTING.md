# Contributing

Common Cart is deliberately small. Contributions should preserve the transparent local-first model and keep the project usable without an install step.

## Before opening a pull request

1. Create a focused branch.
2. Keep model calculations in `src/model.js` as pure exported functions, and keep `src/model.d.ts` aligned with those exports.
3. Add or update deterministic tests for every model behavior change.
4. Keep the browser functional without external services, trackers, fonts, or assets.
5. Update `MODEL.md` when formulas, ordering, fields, or limits change.
6. Run `npm run check`. Pull requests run the same command in GitHub Actions.

## Design constraints

- Do not add live purchasing or payment execution.
- Do not send buyer data over the network.
- Do not expose individual buyer records in merchant-facing views.
- Do not claim optimality unless the implemented algorithm and proof justify it.
- Preserve keyboard operation, visible focus, responsive tables, and text equivalents for charts.

## Pull request notes

Explain the user-visible change, the model impact, tests added, and any new privacy or security assumptions. Small, reviewable pull requests are preferred.
