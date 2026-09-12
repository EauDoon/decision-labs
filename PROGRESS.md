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
- file:// standalone operation verified via headless Chrome on all four apps.

## Remaining limitations and next actions

1. Common Cart and The Smallest Agreement retain their own hide-first/last
   checkbox clusters and copy controls (17 buyer filters, ~15 leftover copies).
   Same consolidation recipe applies; not done this session.
2. Partnership Breakpoint depth item (least-volume-headroom vs
   first-by-adverse-shock side-by-side) not started.
3. Smallest-agreement outcome taxonomy display not started.
4. Weekend-gap bottleneck card: reserve vs timing vs throughput distinction is
   documented but could get a dedicated constraint analysis card.
5. App-local keyboard sets in partnership/smallest-agreement still have some
   legacy single-letter bindings (checked by their own tests, unchanged).

## Next concrete action

Run the same consolidation recipe on Common Cart's buyer filters and leftover
copy controls (tests first: replace markup mirrors with outcome tests), then
Partnership Breakpoint depth work.
