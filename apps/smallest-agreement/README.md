# The Smallest Agreement

The Smallest Agreement is a local, static workshop for a group that wants to test structured clause changes against a chosen approval threshold. It finds the lowest-cost combination that also respects optional group support floors, optional veto groups, a change-cost budget, and locked clause choices.

It is deliberately a decision aid, not a decision maker. People define the groups, weights, support scores, clauses, alternatives, and change costs. The app does not interpret policy text or infer what an option means.

![The Smallest Agreement showing the built-in neighborhood proposal, approval threshold, cost budget, and clause lock controls.](.github/assets/project-preview.jpg)

*Built-in synthetic neighborhood-plan scenario.*

## Use without installation

Open [standalone.html](standalone.html) directly in a current desktop or mobile browser. It is one self-contained file: no package installation, server, account, or network connection is needed. The full GUI, local autosave, JSON import, and JSON export work from `file://`.

Share link does not create a URL in this mode. A `file://` address points to a local path and is not a portable way to share a draft; export JSON instead. The button remains visible and explains that limit if it is used.

To regenerate or verify the standalone file from source:

```sh
npm run build:standalone
npm run build:standalone -- --check
```

## Run from source

Requires Node.js 20 or newer. No package installation is needed.

### Windows one-click

Double-click `launch-windows.cmd`. It checks for Node.js 20 or newer, starts the loopback-only server, and opens the GUI only after it is ready. Keep the command window open while using the app; press Ctrl+C there to stop it cleanly.

### Cross-platform terminal

From this project directory, run:

```sh
npm run launch
```

The launcher prints the local URL before it opens it. If the system browser opener is unavailable, open that printed URL manually. Press Ctrl+C in the terminal to stop the local server cleanly.

`npm run launch -- --help` lists flags. `--no-open` prints the URL without opening a browser. `PORT` must be an integer from 1 through 65535; omit it to use 4173. Empty PORT values and unknown arguments are rejected with that usage text. `HOST` is not read; the server always binds `127.0.0.1`.

### Start server only

```sh
npm start
```

Open the local address shown in the terminal. The app listens only on `127.0.0.1`. `HOST` is not read. `PORT` uses the same rules as the launcher: an integer from 1 through 65535, default 4173. Empty and invalid values are rejected before the server listens.

The project is also a static ESM app, so any static file server can host it.

### Checks

```sh
npm test
npm run check
```

## Use the workshop

1. Choose a synthetic preset or make a new proposal from the controls.
2. Set the approval threshold and participant group weights.
3. Give every option a support score from 0 to 100 for each group. Set each alternative's explicit change cost. Original options always have cost 0.
4. Optionally set a minimum average support for any group, mark a veto group, a maximum total change cost, and an option lock on a clause. Blank budget and floor inputs mean no limit. Zero is an active limit. Unlock an option before removing it. A veto is a numerical constraint, not a legal right.
5. Save a named snapshot before changing assumptions. The local library holds up to 20 independent snapshots. Loading, importing, resetting, and editing can be undone through up to 50 in-tab changes; a new edit clears redo.
6. Review up to five ranked passing packages, their lowest group support, and groups losing support. If no package satisfies every requirement, inspect constraint checks and near misses. Clause contribution and group contribution explain the arithmetic; they are not bargaining power.
7. Try a custom package and pin it beside the original and the solver recommendation. Preview locking an option, or lock a whole recommended or near-miss package in one undoable step. Reduce support by a chosen number of points to test the recommendation under a deterministic downside scenario. Leave-one-group-out omits a group's weight from the average as a sensitivity check, not a forecast.
8. Compare the working draft with a saved snapshot. Review changed inputs before comparing output metrics, especially when groups, weights, or clauses differ.
9. Export JSON to reopen the draft, CSV for all modeled input evidence, a support-matrix CSV of scores only, a groups CSV of participant rows, a worksheet CSV of groups and options as text, or a Markdown brief with ranked packages. Copy recommended package puts the solver's selected options on the clipboard. Print facilitator pack hides the workshop tour and keeps original vs solver vs pin, notes, and veto highlights. When served, Share link places the draft in the URL hash.

Each clause keeps one original option and at least two alternatives, so the workshop always compares a structured choice set.

The synthetic presets are Neighbourhood Plan, Open Source Policy, Association Budget, Protected Access, Workplace Hybrid, and Club Constitution. Protected Access demonstrates why majority-weighted approval alone can miss a group's minimum support. It starts with a budget of 3, a 60% floor for new participants, and a locked safety-training clause. The recommendation costs 3 and gives that group 70% average support. Lower the budget to 2 to see an infeasible result. Workplace Hybrid is a three-group office presence policy with on-site staff, remote staff, and managers. Club Constitution is a synthetic membership-meeting workshop with members, officers (a veto group), and club staff, covering quorum, proxy votes, and guest speakers.

## Local data and sharing

Drafts autosave to this browser's local storage. Invalid storage is ignored safely. Import accepts JSON files of 250 KB or smaller that pass the model's structural validation. Unknown fields on the proposal, groups, clauses, and options are discarded; extra support keys, duplicate identifiers, reserved prototype keys, and non-finite weights or costs are rejected. Export JSON creates a complete draft file. Export brief creates a deterministic Markdown report with the current result, recommendation, group-level changes, and near misses. It is a handoff of model output, not a decision record or a claim of legitimacy.

When the app is served locally, Share link serializes the complete proposal in the URL fragment. Fragments are not sent as part of an HTTP request, but anyone with the link can read the proposal. Do not use it for sensitive material. Share links longer than 60,000 characters are rejected; export JSON for larger drafts. The standalone `file://` mode does not create share links because local file addresses are not portable.

## Search boundary

The app exhaustively checks up to 50,000 lock-permitted combinations. Locks reduce the choice set; budgets, support floors, and vetoes do not bypass this limit. It does not sample, guess, or use hidden randomness. If the number of combinations is higher, it returns an explicit `too_large` result and does not recommend an agreement. Reduce alternatives or clauses, or lock choices, before relying on the result. The GUI enumerates the bounded space to show passing alternatives even when the original already passes. Direct model callers retain the one-check baseline shortcut unless they request alternatives.

Near misses meet every configured constraint but miss the overall approval threshold. An over-budget, below-floor, or below-veto result is never offered as a near miss. Rejection counts can overlap when a combination fails more than one constraint.

See [MODEL.md](MODEL.md) for the formula, deterministic ordering, assumptions, and limits.

## What this cannot establish

A score can be incomplete, a weight can be contested, and a low numerical change cost can mask a large semantic shift. A passing result cannot confer legitimacy, consent, representation, fairness, legal validity, or authority to adopt the proposal. Keep deliberation, governing rules, and accountable human judgment outside the calculation.

Support floors and veto marks protect only the numerical averages you enter. They do not establish consent, a legal veto, or prevent a low score on an individual clause. Clause locks express a supplied constraint, not a grant of decision authority. Optional clause notes are facilitator reminders only.

## v1.4.2, 09-09-2026

- Added a formula-safe discussion worksheet CSV of groups, weights, options, and notes as text.
- Added keyboard `n` to focus Add group, an undoable clear-all-locks control, and per-option lock toggles on clause cards.
- Added veto-blocking highlights as a numerical constraint, Markdown copy of the recommended package, and participant-group CSV import with named errors.
- Added a print facilitator pack that hides the coach and keeps original vs solver vs pin, notes, and veto highlights.
- Added preview-then-apply renormalize so group weights sum to 1, and the Club Constitution membership-meeting preset.

See [CHANGELOG.md](CHANGELOG.md) for the full list.

## v1.4.1, 09-09-2026

- Added a three-column pin of original, solver, and custom packages.
- Added one-step package locks from the recommendation or a near-miss row. Undo restores the previous locks.
- Added user-controlled near-miss display sort by approval gap or change cost.
- Added a live region when the clause filter has no matches, group duplication with copied support scores, optional 240-character clause notes ignored by the solver, and keyboard `f` to focus the clause filter.

See [CHANGELOG.md](CHANGELOG.md) for the full list.

## v1.4.0, 09-09-2026

- Added clause contribution and group contribution tables that account for how selected scores pull overall approval. These are arithmetic readouts, not bargaining power.
- Added a near-miss explorer for cheaper misses and later passing packages, with approval-point and cost gaps.
- Added optional veto groups. A veto group's average must meet the threshold, or the higher of threshold and that group's support floor. Old JSON without `veto` remains valid.
- Added support-matrix CSV import and export. Formula-like cells are neutralized or rejected with named errors. Import replaces scores only.
- Added Try this option: lock one alternative, re-solve the rest, and preview before apply. Apply is an ordinary undoable edit.
- Added leave-one-group-out sensitivity (omit method), a first-run coach that skips share-link loads, keyboard shortcuts (`?`, `u`, `r`, `e`, `s`), and a side-by-side original vs recommendation view.
- Added the Workplace Hybrid office-policy preset, clause filtering by title or option label, clearer downside stress controls, printable and downloadable discussion worksheets, clause and option duplication, and clause reordering.
- Added weight-share accounting and leftover change-cost budget on recommendations.

See [CHANGELOG.md](CHANGELOG.md) for the full list.

## v1.3.0, 09-09-2026

- Added undo/redo, 20 named local snapshots, saved-round comparison, and a guard against overwriting a scenario library changed by another tab.
- Added up to five deterministic passing packages, custom package evaluation, and a user-controlled downside support test.
- Added complete spreadsheet-safe CSV evidence, ranked packages in Markdown briefs, and a printable readout.
- Added precise decimal threshold input, faithful invalid numeric handling, focus recovery for editor actions, keyboard section navigation, and cached evaluations for unchanged inputs.
- Invalid edits preserve the last valid autosave. Unsaved edits trigger the browser's leave-page protection when supported. Undo history is temporary; snapshots persist until deleted or browser data is cleared.

### Storage and handoff details

The scenario library is separate from the active draft. A snapshot copies the entire validated proposal, and later edits do not modify it. Invalid or oversized saved libraries are preserved and disabled rather than overwritten. Storage capacity and availability vary by browser, including in local-file mode. Keep JSON backups of important work. If another tab changes the library, export the active draft and reload before saving snapshots; this is conflict detection, not collaborative editing.

Custom package choices and the downside support-drop setting are temporary and are not included in proposal JSON, CSV, or the Markdown brief. The print readout includes their visible analysis. The downside test subtracts the selected number of percentage points from every score, clamps at zero, and checks the same recommendation without rerunning optimization. It is not a probability estimate.

CSV includes every clause option and group score, weights, floors, locks, budget, threshold, original markers, and recommendation markers. Text that could be interpreted as a spreadsheet formula receives a leading apostrophe. This CSV is for inspection, not JSON import. JSON retains the original text and compatible v1 proposal schema.

## v1.2.0, 27-08-2026

- Added constrained agreement search with support floors, a total-cost budget, and option locks.
- Added a Protected Access preset, constraint explanations, and budget/floor rejection counts.
- Preserved constraints in JSON, browser autosave, share links, and Markdown briefs. Existing unconstrained drafts remain valid without migration.
- Corrected search reporting to distinguish the permitted search space from checks actually performed when the original already passes.
- Added independent exhaustive-oracle coverage across 128 synthetic cases, invalid-input checks, constraint boundary tests, and standalone control checks.

## Project files

- `CHANGELOG.md`: version history for this app.
- `index.html` and `styles.css`: accessible responsive interface.
- `src/model.js`: pure validation, calculation, deterministic search, and Markdown brief functions.
- `src/app.js`: local browser state, editing controls, import/export, brief download, URL sharing, and canvas display.
- `tests/model.test.mjs`: Node built-in test coverage for the model.
- `tests/standalone.test.mjs`: self-contained artifact checks.
- `tests/cli.test.mjs`: launcher and builder help, unknown-flag, and PORT checks.
- [`../../.github/workflows/smallest-agreement.yml`](../../.github/workflows/smallest-agreement.yml): monorepo syntax, standalone, and test checks on Ubuntu and Windows.
- `scripts/dev-server.mjs`: dependency-free localhost server.
- `scripts/listen-config.mjs`: shared loopback bind address, PORT default, and PORT parsing.
- `scripts/launch.mjs`: cross-platform GUI launcher.
- `scripts/build-standalone.mjs`: deterministic standalone-file builder and stale-output check.
- `launch-windows.cmd`: Windows one-click launcher.
- `standalone.html`: no-install, self-contained GUI artifact.

## License

MIT. See [LICENSE](LICENSE).
