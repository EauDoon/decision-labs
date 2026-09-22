# decision-labs regression baseline — 2026-09-23

## Scope
Monorepo `decision-labs` (4 workspace apps). Test target invoked: `npm test`,
which chains `node --test tests/launcher.test.mjs tests/standalone-modules.test.mjs tests/hub-page.test.mjs tests/hub-invariants.test.mjs tests/hub-versions.test.mjs && node scripts/run-apps.mjs test`.

## Environment
- Default branch: `main`.
- Toolchain: Node v24.18.0, npm 12.0.2 on Windows.
- Audit branch: `imp/portfolio-triage-phase9-2026-09-23`.
- No dependency install required (zero deps in root and per-app manifests).

## Results per phase
| Phase (workspace / app) | tests | pass | fail | skipped | duration_ms |
| --- | ---: | ---: | ---: | ---: | ---: |
| launcher + standalone-modules + hub-page + hub-invariants + hub-versions (root) | 23 | 23 | 0 | 0 | 545.3 |
| partnership-breakpoint@1.8.0 | 631 | 630 | 0 | 1 | 27,274.5 |
| common-cart@1.7.0 | 632 | 632 | 0 | 0 | 4,590.7 |
| smallest-agreement@1.6.0 | 485 | 484 | 0 | 1 | 8,383.3 |
| weekend-gap@1.8.0 | 543 | 543 | 0 | 0 | 159,378.9 |
| **Monorepo total** | **2,314** | **2,312** | **0** | **2** | **200,172.7** |

Error count: 0.

## Verdict
- All 2,314 node:test cases across the monorepo reported as pass or skipped.
- No failures, no cancelled runs, no errors.
- 2 skipped cases are pre-existing (node:test reports 1 in partnership-breakpoint
  and 1 in smallest-agreement) and unrelated to the audit.
- Audit branch is a no-op against source, tests, and schemas. Only this report
  is added under `audits/`.

## Follow-ups (out of scope for this commit)
- weekend-gap duration is ~159s and is the long pole of the suite. Consider
  parallelising the four app workspaces on a future pass.
- No PR is opened by this worker; the human opens the PR per the standing rule.