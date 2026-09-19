# Progress: decision-labs consolidation and depth session

Started 2026-09-12. Branch: `improve/consolidation-and-depth-20260912`.

## Baseline (recorded, all green)

- Root `npm test`: hub 503 tests (502 pass, 1 skip) + apps 485/887/418/826, all pass.
- Root `npm run check`: green; every standalone.html current and deterministic.
- Node v26.7.0 local. Headless Chrome (Google Chrome Beta) available for driving pages.

## Diagnosis (why this session's direction)

~2,900 commits since 2026-09-08, mostly generated one-control-per-commit work:
- weekend-gap Gantt card: 23 gate-specific hide checkboxes (bound to Insert, PageUp,
  ArrowUp, Backspace, F2-F12...) plus 25 single-purpose copy buttons each paired with a
  hidden textarea fallback; ~40 global single-key bindings including punctuation.
- Hub catalog: ~40 first/last copy controls, ~90 key bindings (PageUp, Insert, F-keys,
  Shift+F-keys), a 55-entry What's new list of skip-copy features, and a README of
  1,139 lines documenting the key wall.
- Tests assert markup (a button exists) rather than outcomes, locking in the clutter.

## Completed this session

### 1. Weekend Gap 1.6.0 (commit 92a6d5e3)
- One Show hours select replaces the 23 per-gate hide checkboxes
  (any-closed / every-closed / any-open / weekend / weekday / queued).
  Model gains `GANTT_HOUR_FILTERS`, `ganttHourMatchesFilter`; SVG builder takes
  `{ hourFilter, gateFilter }`.
- Four gate hour evidence buttons replace the 25 first/last open-closed-hour copy
  buttons (`gateHourEvidenceToMarkdown`: first/last open and closed + counts per gate).
- Keydown trimmed to the ? list (Space, J, F, P, S, D, Q, G, H, M, A, T, K, Y, N, I,
  B, O, W, C, U, R, E, Esc). Browsers regain Find/F11/F12/Backspace/arrows/PageUp.
- Workspace schema: writes `ganttHourFilter`; import still accepts legacy
  `hide*GanttHours` flags and maps them (`legacyHourFilterFromKeys`). Invalid
  `ganttHourFilter` values rejected without touching the active workspace.
- app.js 3,222 -> ~2,050 lines; standalone rebuilt; 421/421 tests pass (258
  markup-mirror tests retired; outcome tests added for filter semantics, legacy
  mapping, evidence buttons, keyboard set, workspace round trip).

### 2. Hub catalog (commits 7b5c238c, 20000e01)
- ~40 copy controls + ~90 key bindings replaced by a coherent toolset: Copy intro /
  versions / jobs / How it works / Trust, keys 1-4, section focus keys h/m/n/w/k/t,
  last-launched l/o/x, print p, ? help, Esc close. What's new collapsed to 5 real
  entries. How-it-works and shortcut lists now match the printed contract.
- serve.mjs: 404 page keeps one copy tool per printed list; retired skip-copy
  accessors removed (1,983 -> ~360 lines); fixed an unterminated-string escape in
  the emitted inline script found by browser verification.
- index.html 3,868 -> ~820 lines; README 1,139 -> ~200 lines.
- Root tests rewritten to assert outcomes: every listed shortcut has a handler and
  every handled key is listed; banned browser keys unbound; 404 copy derives from
  printed content; PUBLIC_PATHS/CSP/host/method boundary preserved.

### 3. Partnership Breakpoint 1.6.0 (commit 2f627239)
- `calculatePartnership` returns `rankingDisagreement`: a deterministic comparison of
  the least-volume-headroom ranking and the first-relative-shock ranking, with honest
  reasons for agreement, disagreement, and unbounded cases. The First breakpoint panel
  prints "Not the least-headroom participant" plus the reason when they differ.
  Growth at a Cost preset demonstrates the disagreement; verified in-browser via a
  share link (note renders naming both participants, 0 resource requests).

### 4. The Smallest Agreement 1.5.34 (commit 319147f3)
- New tests cross-check `findSmallestAgreement` against an independent exhaustive
  brute-force reference on fixed small cases (thresholds, budgets, single clause,
  locked clause). Status and change cost agree everywhere; infeasible cases proven
  genuine; the already_passing / found / infeasible boundaries pinned. No model code
  changed; the standing evidence that the reported minimum is exact within the bound.

## Verification actually performed

- Root `npm test`: 37 (hub) + 485 + 887 + 418 + 421, all pass, 0 fail.
- Root `npm run check`: green; weekend-gap standalone current and deterministic;
  all four rebuilt where sources changed.
- Headless Chrome (CDP drive, zero deps):
  - hub: 4 cards, 6 copy buttons, copy fallbacks fill with printed content, ?
    opens and Esc closes help, 0 resource requests.
  - weekend-gap standalone: filter every-closed 13 -> 49 gantt rows and back;
    gate evidence copy yields first/last open/closed + counts; ?/Esc work;
    workspace persists `ganttHourFilter`; presets apply (Weekend Rush);
    0 resource requests; no console errors on any app or hub (served + file://).
- partnership/common-cart/smallest-agreement standalones: render, accept edits,
  review panels present, 0 resource requests, no console errors.
- partnership disagreement note verified in-browser on the Balanced (agreement)
  and Growth-at-a-Cost (disagreement, via share link) cases.
- file:// standalone operation verified via headless Chrome on all four apps.

## Depth campaign M1-M8 (2026-09-12, commits 9771384f-8fd880c9-db00eb1a)

Substantive capability milestones, one version bump each, all with model/UI/CLI/docs/tests and rebuilt standalones:

### M1. Partnership Breakpoint 1.7.0 (commit 9771384f)
- Multi-period commercial planning: cash lags, recovery/funding, review/CLI/brief/CSV.

### M2. Partnership Breakpoint 1.8.0 (commit 79473a79)
- Negotiation alternatives on a declared grid (fee levels, share modes, commitment relief, up to 3 capacity investments); grids above 120 rejected; apply flow with undo; CSV export.

### M3. Common Cart 1.5.0 (commit 402ebfc8)
- Bounded exact multi-merchant procurement planner (250k-node bound), reference agreement, privacy-safe merchant summary.

### M4. Common Cart 1.6.0 (commit 134744b3)
- Supplier contingency experiments, standard withdrawal set, organizer/merchant exports, review/CLI.

### M5. The Smallest Agreement 1.5.35 (commit 7ce28939)
- Explicit option relationships: requires/excludes/linked, validation, search integration, editor, reference tests.

### M6. The Smallest Agreement 1.6.0 (commit 0bcd8dc6)
- Negotiation rounds with immutable baselines, human notes/decision separation, workspace rounds, CLI rounds.

### M7. Weekend Gap 1.7.0 (commit 8fd880c9)
- Configurable horizons (24-336 whole hours, default 72 byte-identical) and calendar overrides (max 32, half-open ranges, later-wins-per-field, reject-don't-clamp). Fixed mid-verification: override editor escaping the scenario form (typing reset rows), focus loss on valid edits, invalid-range status messaging.
- Catalog/README versions bumped; hub whats-new pin test tracks the release.

### M8. Weekend Gap 1.8.0 (commit db00eb1a)
- Scheduled funding tranches (max 16) with cost accounting; costs never reduce reserve; planner deadline-scoped; comparisons list schedule changes; CLI `funding` command; CLI accepts dated schedule fields (previously rejected `calendarOverrides` files).
- Also fixed: review tools hardcoded to 72h (crashed below 72, rejected scheduled scenarios), comparison change lists omitting schedule keys, horizon-pinned labels and headings.
- Caught during verification: unconditional hourly cent-rounding of the reserve broke the planner's cent-exact recurrence; fixed to add-only-when-funded so no-tranche runs stay byte-identical.

## Final review M9 (2026-09-12)

- Root `npm test`: hub 37 (36 pass, 1 skip) + apps 523 + 917 + 448 + 454, all pass, 0 fail. Root `npm run check`: green; all standalones current.
- Headless Chrome (CDP drives, zero deps), served and `file://`: hub 4 version cards, all four standalones render with 0 resource requests and no console errors; 12-button click sweep plus an input edit on partnership/agreement/cart clean.
- Finding: Common Cart standalone was dead on load since M4 - `let contingencyRuns` sat after the load-time `refresh()` call, so every load died with a temporal-dead-zone ReferenceError. Cart tests only read app.js as text; nothing executed it. Fixed by moving the declaration above first use; verified in-browser (contingency experiment runs) and via a new executing regression test with a negative control.
- Gap closed: partnership, cart, and agreement had no test executing their app modules (only weekend-gap did). Each now has an `app-boots` test that evaluates the real module top-to-bottom in a stub DOM and fails on any load-time throw. Stubs are deliberately tolerant (unknown selectors yield generic nodes): they guard evaluation order, not behavior.
- file:// verified for all four standalones after the fix.

## Remaining limitations and next actions

1. Common Cart retains many hide-first/last filter controls and copy buttons
   (M3/M4 shipped around them). Same consolidation recipe applies.
2. Weekend-gap bottleneck card: reserve vs timing vs throughput distinction is
   documented but could get a dedicated constraint analysis card.
3. App-local keyboard sets in partnership/smallest-agreement still have some
   legacy single-letter bindings (checked by their own tests, unchanged).
4. Smallest-agreement outcome taxonomy is covered by copy-level alert text and
   now by reference tests; a dedicated status chip in the result header is an
   optional polish.
5. Boot-test stubs are tolerant by design: they catch load-time evaluation
   crashes, not behavioral regressions. Behavioral coverage still rests on
   model tests, markup tests, and browser drives.

## Next concrete action

Campaign complete on branch `improve/consolidation-and-depth-20260912`.
Suggested next work: Common Cart filter/copy consolidation (item 1), or merge
the branch after review.
