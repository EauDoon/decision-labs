# Partnership Breakpoint

Partnership Breakpoint is a static browser workbench for locating participant-level exit thresholds in a shared commercial arrangement, then ranking the smallest adverse percentage movements in volume, fee, or variable cost that reach those boundaries. A reachable capacity limit is ranked as a volume-increase shock.

It is useful when a negotiated revenue split looks acceptable in aggregate but may fail for one participant after costs, capacity, commitments, or a modest commercial shock are included. The workbench does not assign probabilities. The viability card names the participant with the least volume headroom. First breakpoint is a separate ranking by relative shock size and can name a different participant.

Version 1.4.0 adds deal identity, roster editing, share-to-hold and fee-to-hold solvers, tornado and waterfall charts, a first-run coach, keyboard shortcuts, redacted export, and two new starting points. The workbench does not assign probabilities.

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

Open the local address printed by the server, normally `http://127.0.0.1:4173`. The listener is loopback IPv4 only; `HOST` is ignored. Override the port with `PORT`, a base-10 integer from 1 through 65535. Invalid values, including `0`, hex, and non-integers, are rejected rather than treated as 4173.

`npm run launch` opens a browser after the server is listening. Set `PARTNERSHIP_BREAKPOINT_NO_OPEN=1` to print the URL without opening a browser.

```sh
npm test
npm run check
```

`npm test` runs every Node test file under `tests/`: the economic model, compound-stress negotiation, standalone renderer, workbench interaction, and local-server checks. `npm run check` scans project files for em dashes, private filesystem paths, and common private-key markers, syntax-checks JavaScript sources, and verifies that `standalone.html` matches the current sources. GitHub Actions runs both commands on pull requests and on pushes to `main`.

## Use the workbench

1. Set Monthly volume, Fee / transaction, Addressable volume, and Volume shock % on the Shared deal form. Optionally name the deal and enter a 3-letter uppercase currency code used only as a display prefix. Volume shock % is the only baseline volume reduction; there is no separate churn field.
2. Add, duplicate, reorder, or edit participants. Revenue shares must total exactly 1. Between 2 and 24 participants are required. Removing a participant reallocates that share across whoever remains.
3. Enter each participant's Variable cost / txn, Fixed monthly cost, Minimum monthly profit, optional Capacity / month, optional Minimum commitment, and Risk cost / month.
4. Start with the First breakpoint card. It ranks bounded volume decrease, volume increase (capacity), fee decrease, and variable-cost increase shocks by the smallest percentage movement from the current scenario. That ranking can name a different participant than the viability card's least-headroom participant.
5. Read the Participant ledger (including Binding limit), contribution waterfall, Smallest adverse shock by participant, tornado chart, and Operating region (fee and volume sensitivity).
6. Edit Compound stress settings. The workbench tests up to 27 combinations of volume decline or growth, fee cuts, and variable-cost increases. Open Inspect all N compound cases to review every outcome.
7. Compare each participant's Worst profit gap and Minimum share. If a fixed split can fund every participant in every tested case without capacity or commitment failures, preview the proposal and select Apply tested revenue split. The workbench rechecks it before changing the shares.
8. Use Solve minimum share to hold on one participant, or Solve fee for all to hold, to preview a deterministic floor. Apply is required. Export redacted JSON when sharing a case without names.

The app autosaves valid inputs in local browser storage. When served locally, it also writes valid input state to the URL hash so the current case can be copied as a link. In standalone file mode, use Export JSON for a portable case file. Import JSON is available in both modes. Rejected imports, share links, exports, and unsaved edits name the parse or validation cause.

Existing v1 case files still import. Cases without stress settings start with illustrative stress settings, which are saved with the next export. These settings are assumptions, not forecasts. The original case economics and revenue shares stay unchanged unless you edit them or apply a proposal.

To try a feasible proposal, load Balanced, set volume decline to 5%, and set growth, fee reduction, and variable-cost increase to 0%. The two tested cases hold, and a fixed split is available to preview. Default stress settings are deliberately more demanding and expose both funding shortfalls and a capacity failure.

## What the outputs mean

- Effective volume is the post-shock monthly volume, capped by addressable volume.
- Monthly profit is participant revenue less variable cost, fixed cost, and risk cost.
- Break-even volume is the volume where accounting profit equals zero. It can be impossible when contribution per transaction is not positive.
- Exit volume is the larger of the volume needed to meet minimum acceptable profit and any stated minimum commitment.
- Headroom is effective volume less exit volume. The binding limit identifies whether the nearest boundary is minimum acceptable profit, minimum commitment, or capacity.
- Adverse-shock thresholds show the boundary at which an exit test is reached. Volume decrease tests economic exit, volume increase tests capacity within addressable demand, and fee or variable-cost movement tests profit. Any further adverse movement causes failure. They are not probability forecasts.
- First breakpoint ranks bounded shocks by percentage movement from the current scenario. It is a negotiation prioritisation aid, not a forecast of which participant will act.
- Compound case counts describe only discrete tested combinations, not likelihoods. Worst profit gap is the lowest monthly profit less the participant's minimum acceptable profit across those cases.
- Minimum fixed share is the largest share needed to meet a participant's profit floor across the tested cases. All participant minima must fit within 100%, and all capacity and commitment tests must pass, before a proposal is offered. A proposal does not prove that untested conditions or a counterparty will accept it.
- Share-to-hold is the smallest revenue share in [0, 1] at which one named participant holds while others keep their relative leftover. It is a solvability result, not a probability.
- Fee-to-hold is the smallest fee at current volume and shares at which every participant holds. It cannot repair capacity or commitment failures.

## Design boundaries

This project is a transparent deterministic monthly model. It does not prove a contract is enforceable, that counterparties will actually exit at the stated threshold, that inputs are complete, or that demand, costs, and behavior stay unchanged. It does not model taxes, cash-flow timing, credit losses, correlations, allocations outside the stated deal, or strategic value beyond the entered minimum acceptable profit.

Read [MODEL.md](MODEL.md) for formulas and conventions, [CONTRIBUTING.md](CONTRIBUTING.md) for change standards, and [SECURITY.md](SECURITY.md) for vulnerability reporting.

## Decision workflow (v1.4.0)

1. Enter shared deal terms and participant costs. Optional title and currency travel with JSON, hash links, and autosave. The allocation balance shows missing or excess revenue share. Equal split and Normalize current shares are explicit editing aids, not negotiated allocations. Duplicate, Move up, and Move down keep the share total unchanged except that a duplicate starts at zero share.
2. Name and save a snapshot before exploring terms. Up to 12 snapshots stay in this browser. Compare a snapshot with the current draft to see participant profit changes, with decreases and increases highlighted, and added or removed participants matched by identifier. Each snapshot uses its own stress settings.
3. Review the fee negotiation guide. It computes the fee required for each profit floor at current effective volume and shares, and separately flags capacity or commitment failures that fee changes cannot repair. Solve fee for all to hold previews that floor; Apply is required. Rounded fee floors require rechecking.
4. Inspect a compound case, preview the changed assumptions, and apply it only when you want a new baseline. Existing volume shock resets to zero to avoid double counting. The stress grid then applies the existing settings as additional shocks from this baseline.
5. Export JSON for portable case backups, redacted JSON with names removed, a Markdown decision report with reproducible inputs, a short negotiation brief, or a CSV containing every participant in every compound case. Formula-like text is prefixed with an apostrophe in CSV. Print report includes case assumptions and the displayed analysis.

The first visit shows a three-step coach. Dismiss it with Got it or Escape; dismissal is stored in this browser. Share links skip the coach. Press `?` for keyboard shortcuts (`u` undo, `r` redo, `e` export JSON). Shortcuts are ignored while a field is focused.

Undo and Redo retain up to 50 edits during this tab session. Reset, imports, snapshot loads and applied proposals can be undone. The last removed snapshot can be restored during the session. Browser storage is optional; failures are displayed and JSON export remains available. New edits cancel pending imports. Local snapshots and undo history are not synced or backed up elsewhere. No requests are sent to a server.
