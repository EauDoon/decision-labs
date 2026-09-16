# Worked case: a profitable deal with a failing participant

## Question

Can an apparently viable three-party revenue split absorb a 5% fee reduction without one participant falling below its stated monthly profit floor?

## Reproduction

From the repository root, enter the Partnership Breakpoint app and run:

```powershell
cd apps/partnership-breakpoint
node --input-type=module -e "import { clonePreset } from './src/model.js'; process.stdout.write(JSON.stringify(clonePreset('balanced')))" | node scripts/analyze.mjs case - case-4 | node scripts/analyze.mjs summary -
```

The command creates its input from the existing `Balanced` synthetic preset, then uses the existing CLI and default stress settings. In that grid, `case-4` is 0% volume change, a 5% fee reduction, and 0% variable-cost increase. The command exits 0 and prints the calculated JSON result.

For the baseline used to identify the boundary:

```powershell
node --input-type=module -e "import { clonePreset } from './src/model.js'; process.stdout.write(JSON.stringify(clonePreset('balanced')))" | node scripts/analyze.mjs summary -
```

## Inputs

The preset supplies 100,000 planned transactions per month, a 0.20 fee per transaction, 140,000 addressable transactions, and a 0% baseline volume shock. Currency is omitted, so amounts are model units.

| Participant | Revenue share | Variable cost / txn | Fixed monthly cost | Minimum profit | Capacity | Commitment | Risk cost |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Platform | 40% | 0.04 | 1,800 | 1,200 | 130,000 | 0 | 300 |
| Distributor | 35% | 0.055 | 500 | 500 | 120,000 | 0 | 100 |
| Liquidity Partner | 25% | 0.03 | 1,400 | 100 | 115,000 | 0 | 300 |

When the stress object is omitted, the model's illustrative grid settings are 20% volume decline, 20% volume growth, 10% fee reduction, and 20% variable-cost increase. The grid has 27 cases. These settings are assumptions, not forecasts.

## Verified outputs

Baseline (`summary` on `Balanced`):

- Effective volume: `100000`
- Total revenue: `20000`
- Total monthly profit: `3100`
- Partnership viable: `true`
- Participant monthly profit: Platform `1900`, Distributor `900`, Liquidity Partner `300`
- All three baseline profit floors hold: `1200`, `500`, and `100`
- First breakpoint: Liquidity Partner, fee decrease to `0.192`, a `4.0000000000000036%` relative decrease in the raw JSON result (4.00% rounded)

Selected `case-4` after materialization and `summary`:

- Effective volume: `100000`
- Fee per transaction: `0.19`
- Total revenue: `19000`
- Total monthly profit: `2100`
- Partnership viable: `false`
- Platform profit: `1500`, floor `1200`, holds
- Distributor profit: `550`, floor `500`, holds
- Liquidity Partner profit: `50`, floor `100`, fails with `monthly profit is below the minimum acceptable profit`
- Liquidity Partner commitment and capacity tests still pass

The 5% fee cut crosses the baseline Liquidity Partner fee boundary of `0.192`, while the aggregate remains profitable. The case is therefore a concrete example of why viability is evaluated for every participant, rather than inferred from total profit.

## Insight

Aggregate economics can hide a participant-level breakpoint. In this synthetic split, total monthly profit falls by `1000` (from `3100` to `2100`), yet the Liquidity Partner loses `250` of monthly profit and moves from `200` above its floor to `50` below it. A small shared fee concession can therefore require a split or cost renegotiation even when the overall arrangement still shows positive profit.

## Limitations

- This is a synthetic preset, not evidence about a real counterparty, market, demand level, or reservation value.
- The model holds volume, shares, costs, risk cost, capacity, and profit floors fixed. It does not model demand elasticity, behavior, legal enforceability, taxes, cash-flow timing, default distributions, or transfers.
- `case-4` is one deterministic grid point. The 27-case count is a count of tested combinations, not a probability or forecast; untested combinations remain unassessed.
- Display calculations use JavaScript floating-point numbers. The values above are copied from the current public model's CLI output and rounded only where stated.
