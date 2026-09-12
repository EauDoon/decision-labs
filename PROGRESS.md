# Progress: decision-labs consolidation and depth session

Started 2026-09-12. Branch: `improve/consolidation-and-depth-20260912`.

## Baseline (recorded, all green)

- Root `npm test`: hub 503 tests (502 pass, 1 skip) + apps 485/887/418/826, all pass.
- Root `npm run check`: green; every standalone.html current and deterministic.
- Node v26.7.0 local. No browser automation tools available in this session; browser
  checks below are done by serving locally and manual inspection if possible, otherwise
  recorded as unverified.

## Diagnosis (why this session's direction)

~2,900 commits since 2026-09-08, mostly generated one-control-per-commit work:
- weekend-gap Gantt card: ~20 gate-specific hide checkboxes (bound to Insert, PageUp,
  ArrowUp, Backspace, F7-F12...) plus ~25 single-purpose copy buttons each paired with a
  hidden textarea fallback; ~40 global single-key bindings.
- common-cart buyers card: 17 near-duplicate hide-first/last checkboxes bound to absurd
  keys; ~15 leftover copy controls labeled "(organizer private)".
- Tests assert markup (a button exists) rather than outcomes, locking in the clutter.

## Plan (prioritized)

1. Weekend-gap: replace the ~20 hide checkboxes with a small set of coherent filters
   (gate subset + a single "closed on gate(s)" rule + weekend/weekday + queue>0),
   replace ~25 copy buttons with one "Copy hour evidence" menu covering first/last
   open/closed hours per gate, remove gimmick keyboard bindings, keep a concise ?
   shortcut help, keep text-equivalent table. Workspace schema: keep old keys valid on
   import; write only the new consolidated keys.
2. Common-cart: collapse the 17 buyer hide checkboxes into a filter select + two
   meaningful toggles; collapse leftover copy controls into one organizer export.
   Preserve privacy (no merchant data in merchant-facing outputs).
3. Partnership-breakpoint: deepen the binding-constraint story: side-by-side
   distinction of least-volume-headroom participant vs first-by-adverse-shock ranking
   with explanation, plus who-gains/loses under the leading proposal with constraints
   re-checked.
4. Smallest-agreement: outcome taxonomy (already passing / found minimum / infeasible /
   invalid / bound exceeded) made explicit in the result panel and exports.
5. Weekend-gap: bottleneck analysis distinguishing reserve shortage vs timing vs
   throughput constraint.
6. Tests: replace markup-mirroring tests for retired controls with outcome tests; add
   regression tests for any fixed defect. Rebuild standalones; run root npm test +
   npm run check.

## Acceptance criteria

- Each app: one coherent filter story, one coherent export/copy story, no gimmick key
  bindings, ? help accurate.
- Workspace JSON from older versions still opens (documented contract).
- Root npm test and npm run check green; standalones rebuilt.
- Privacy: common-cart merchant-facing outputs contain no buyer records; verified by tests.

## Session log

- Cloned repo, recorded green baseline, surveyed all four apps and test suites.
