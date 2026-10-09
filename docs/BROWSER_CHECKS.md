# Browser acceptance

Run `npm run test:browser` from the repository root with a separately installed Playwright package and Chromium available. This optional developer check does not change the dependency-free applications or the existing Node test suite.

When Playwright is installed outside this checkout, set `PLAYWRIGHT_MODULE` to its package directory (`playwright-core` is enough). Set `BROWSER_EXECUTABLE` to an installed Chrome/Chromium executable if the normal Playwright browser is unavailable. Set `AXE_MODULE` to an installed `axe-core` package directory to add the accessibility gate described below. `BROWSER_EVIDENCE_DIR` optionally saves four mobile viewport screenshots outside the source tree. No browser profile or account is reused.

When `AXE_MODULE` is set, the script first opens `index.html`, `404.html` and the four generated `standalone.html` pages from files at 1280x900, injects axe-core on first load, and fails on any violation. It complements `tests/workbench-accessibility.test.mjs`, which computes text contrast from the source colours, because axe does not check hover states or every tinted row.

The catalog journey then opens `/` through the loopback launcher and checks that each of the four Open workbench links returns its standalone page, that the first Tab reaches the skip links and Enter moves focus to the target, that the page fits a 390px viewport, that `/missing` serves the 404 page, and that there are no browser exceptions or external requests.

For each of the four workbenches, the script opens the real generated page, changes an assumption and checks its visible result, exports and reimports JSON, rejects malformed JSON without losing the draft, checks keyboard focus and 390px page width, and rejects unexpected external requests or browser exceptions. Every workbench runs three modes: from a file, through the loopback catalog, and with browser storage throwing on every call, where editing and export must still work with a warning. File-mode sharing must explain JSON export or be absent. Partnership Breakpoint and The Smallest Agreement, which keep drafts in named storage keys, run three more modes: unreadable stored bytes, an empty stored value, and unreadable bytes opened with a share link. Those modes check that the unreadable bytes are preserved and that export stays available. That is 18 workbench journeys in all.

The synthetic edits are the current README examples: Common Cart's first buyer requests 3 units, Partnership Breakpoint's fee becomes 0.19, The Smallest Agreement's threshold becomes 75%, and Weekend Gap's starting reserve becomes zero. All browser contexts and the temporary loopback listener close when the check finishes.

## In CI

`.github/workflows/browser.yml` runs the same command on Ubuntu with Node 24 for pull requests that change the catalog pages, a standalone page, the launcher or this script, every Monday, and on manual dispatch. It installs `playwright-core@1.55.0` and `axe-core@4.10.3` into the runner's temporary directory with lifecycle scripts disabled and uses the preinstalled Google Chrome, so the repository stays dependency-free. It is not a required check, because headless browser jobs can flake.

Record the tested commit, browser version, platform, and console result. This is one acceptance journey per application plus an automated axe pass, not a full manual accessibility audit or cross-browser certification. Node model, boundary, replay, and adversarial tests remain required through `npm test` and `npm run check`.
