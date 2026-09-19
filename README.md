# Decision Labs

Decision Labs is a small catalog of four independent, offline workbenches for
making assumptions visible before a high stakes conversation. Change an input,
inspect the effect, and carry a deliberate JSON export into the discussion.

The catalog is a launcher, not a fifth product. Every workbench keeps its own
model, draft storage, version, standalone build, documentation, and tests.

## The workbenches

| Workbench | Version | Question | Starting case |
| --- | --- | --- | --- |
| [Partnership Breakpoint](apps/partnership-breakpoint/) | 1.8.0 | Which participant in a revenue split reaches an exit threshold first as volume, fees, or costs move? | **Balanced** |
| [Common Cart](apps/common-cart/) | 1.6.0 | How can buyer constraints be pooled and conditional merchant offers compared without exposing individual buyer records? | **Coffee**, Neighbourhood coffee run |
| [The Smallest Agreement](apps/smallest-agreement/) | 1.6.0 | What is the lowest-cost set of clause changes that crosses an approval threshold while respecting floors, locks, and a change budget? | **Neighbourhood Plan** |
| [Weekend Gap](apps/weekend-gap/) | 1.8.0 | How does synthetic AUD redemption demand move from Friday to Monday when reserves and settlement windows do not fully overlap? | **Normal Friday**, 72-hour case |

Source model notes: [Partnership Breakpoint MODEL.md](apps/partnership-breakpoint/MODEL.md), [Common Cart MODEL.md](apps/common-cart/MODEL.md), [The Smallest Agreement MODEL.md](apps/smallest-agreement/MODEL.md), and [Weekend Gap MODEL.md](apps/weekend-gap/MODEL.md).

## Quickstart

Open [index.html](index.html), choose a workbench, and start with its built-in
synthetic case. Each app also has a self-contained `standalone.html` file that
can be opened directly in a browser. Use **Export JSON** when a draft needs to
move to another person or device.

The optional local launcher serves only the catalog and the four standalone
pages on loopback:

## What's new

- Weekend Gap 1.8.0 adds scheduled funding tranches with cost accounting:
  reserve cash added before a named hour settles, with the cost of securing
  it tracked as an expense. The reserve planner, comparisons, dashboard,
  reports, and review packets all account for tranches, and the CLI gains a
  `funding` command. Review tools now run at any horizon and accept scheduled
  scenarios.
- Earlier releases keep their own changelogs in each app folder. Each
  workbench ships its own version and release notes; this catalog does not
  version the four tools together.

All four apps are static and dependency-free. Pick the mode you want and swap in
any app folder where you see `apps/partnership-breakpoint`.

### No install: open the single-file build

Every app includes a generated `standalone.html` with the interface, styles, and
model in one file. Open it directly in a browser; it makes no network requests.

```text
node scripts/serve.mjs
```

Node.js 20 or newer is needed for the launcher and checks. There are no runtime
package dependencies and no `npm install` step.

For a worked example, read the [CASE_STUDY.md repository documentation](https://github.com/EauDoon/decision-labs/blob/main/docs/CASE_STUDY.md).

## Model limits

- The workbenches are deterministic decision aids. They do not forecast,
  sample, or assign probabilities, prices, fairness, or legitimacy.
- Inputs and outputs describe the bounded case entered by the reviewer. They
  are not a live market, merchant, bank, partnership, vote, or account feed.
- A result is evidence for a conversation. People keep judgment, governing
  rules, and accountability, and the tools do not execute transactions.
- Drafts stay in browser storage until explicitly exported. Browser storage is
  not a backup. Do not share drafts containing sensitive information.
- Each app documents its formulas, units, assumptions, and non-goals beside
  its interface. The launcher does not serve source or model files.

## Checks

From the repository root:

```text
npm test
npm run check
```

`npm test` runs the root catalog and all workbench tests. `npm run check`
validates the catalog and each app's standalone build.

The repository is released under the [MIT License](LICENSE).
