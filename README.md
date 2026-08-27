# Partnership Breakpoint

Partnership Breakpoint is a static browser workbench for locating the participant most likely to exit a shared commercial arrangement, then quantifying the smallest adverse change in volume, fee, or variable cost that reaches that participant's exit boundary.

It is useful when a negotiated revenue split looks acceptable in aggregate but may fail for one participant after costs, capacity, commitments, or a modest commercial shock are included.

Version 1.2.0 adds simultaneous volume, fee, and variable-cost stress tests, with a participant failure ledger and a tested revenue-split proposal when the selected cases permit one.

## Open without installation

Double-click [standalone.html](standalone.html) to run the complete workbench directly from a local file. It includes the interface, styles, and model code in one file and makes no network requests.

Use Export JSON to transfer a case. File URLs and their fragments are local to the file location and are not portable share links. Import JSON remains available in the standalone workbench.

To regenerate the standalone file from source, with Node.js 20 or later installed, run:

```sh
npm run build:standalone
```

`npm run build:standalone -- --check` verifies that `standalone.html` matches the current sources without rewriting it.

## Launch the GUI with Node.js

Node.js 20 or later is sufficient. No packages need to be installed.

On Windows, double-click [launch-windows.cmd](launch-windows.cmd). It checks for Node.js 20 or later, starts the loopback-only server, then opens the GUI after the server is listening.

From a terminal opened in the project folder on Windows, macOS, or Linux, run:

```sh
npm run launch
```

The Windows launcher resolves the project directory automatically. The npm command uses the terminal's current project folder. Both print the local URL and, if they cannot open a browser, leave that URL available to open manually. Press Ctrl+C in the launcher terminal to stop the local server cleanly.

To run the server without the launcher:

```sh
npm start
```

Open the local address printed by the server, normally `http://localhost:4173`.

```sh
npm test
npm run check
```

`npm test` runs the pure economic-model tests. `npm run check` scans project files for em dashes, private filesystem paths, and common private-key markers.

## Use the workbench

1. Set the shared monthly volume, fee per transaction, addressable monthly volume, and any churn or volume shock.
2. Add or edit participants. Revenue shares must total exactly 1. At least two participants are required.
3. Enter each participant's per-transaction variable cost, monthly fixed cost, minimum acceptable monthly profit, capacity, minimum commitment if any, and monthly risk cost.
4. Start with the First breakpoint card. It identifies who to protect first and the smallest percentage movement in volume, fee, or variable cost that reaches an exit boundary.
5. Read the participant ledger, binding limits, adverse-shock thresholds, and fee-volume operating region.
6. Edit Compound stress settings. The workbench tests up to 27 combinations of volume decline or growth, fee cuts, and variable-cost increases. Open the case evidence to inspect every outcome.
7. Compare each participant's worst profit gap and minimum revenue share. If a fixed split can fund every participant in every tested case without capacity or commitment failures, preview the proposal and select Apply tested revenue split. The workbench rechecks it before changing the shares.

The app autosaves valid inputs in local browser storage. When served locally, it also writes valid input state to the URL hash so the current case can be copied as a link. In standalone file mode, use Export JSON for a portable case file. Import JSON is available in both modes.

Existing v1 case files still import. Cases without stress settings start with illustrative stress settings, which are saved with the next export. These settings are assumptions, not forecasts. The original case economics and revenue shares stay unchanged unless you edit them or apply a proposal.

To try a feasible proposal, load Balanced, set volume decline to 5%, and set growth, fee reduction, and variable-cost increase to 0%. The two tested cases hold, and a fixed split is available to preview. Default stress settings are deliberately more demanding and expose both funding shortfalls and a capacity failure.

## What the outputs mean

- Effective volume is the post-shock monthly volume, capped by addressable volume.
- Monthly profit is participant revenue less variable cost, fixed cost, and risk cost.
- Break-even volume is the volume where accounting profit equals zero. It can be impossible when contribution per transaction is not positive.
- Exit volume is the larger of the volume needed to meet minimum acceptable profit and any stated minimum commitment.
- Headroom is effective volume less exit volume. The binding limit identifies whether the nearest boundary is minimum acceptable profit, minimum commitment, or capacity.
- Adverse-shock thresholds show the boundary at which an exit test is reached. Volume decrease tests economic exit, volume increase tests capacity, and fee or variable-cost movement tests profit. Any further adverse movement causes failure. They are not probability forecasts.
- First breakpoint ranks bounded shocks by percentage movement from the current scenario. It is a negotiation prioritisation aid, not a forecast of which participant will act.
- Compound case counts describe only discrete tested combinations, not likelihoods. Worst profit gap is the lowest monthly profit less the participant's minimum acceptable profit across those cases.
- Minimum fixed share is the largest share needed to meet a participant's profit floor across the tested cases. All participant minima must fit within 100%, and all capacity and commitment tests must pass, before a proposal is offered. A proposal does not prove that untested conditions or a counterparty will accept it.

## Design boundaries

This project is a transparent deterministic monthly model. It does not prove a contract is enforceable, that counterparties will actually exit at the stated threshold, that inputs are complete, or that demand, costs, and behavior stay unchanged. It does not model taxes, cash-flow timing, credit losses, correlations, allocations outside the stated deal, or strategic value beyond the entered minimum acceptable profit.

Read [MODEL.md](MODEL.md) for formulas and conventions, [CONTRIBUTING.md](CONTRIBUTING.md) for change standards, and [SECURITY.md](SECURITY.md) for vulnerability reporting.
