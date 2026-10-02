# Browser acceptance

Run `npm run test:browser` from the repository root with a separately installed Playwright package and Chromium available. This optional developer check does not change the dependency-free applications or the existing Node test suite.

When Playwright is installed outside this checkout, set `PLAYWRIGHT_MODULE` to its package directory. Set `BROWSER_EXECUTABLE` to an installed Chrome/Chromium executable if the normal Playwright browser is unavailable. `BROWSER_EVIDENCE_DIR` optionally saves four mobile viewport screenshots outside the source tree. No browser profile or account is reused.

For each of the four workbenches, the script opens the real generated page from a file and through the loopback catalog, changes an assumption and checks its visible result, exports and reimports JSON, rejects malformed JSON without losing the draft, checks keyboard focus and 390px page width, and rejects unexpected external requests or browser exceptions. File-mode sharing must explain JSON export or be absent. A third run disables browser storage and checks that editing and export still work with a warning.

The synthetic edits are the current README examples: Common Cart's first buyer requests 3 units, Partnership Breakpoint's fee becomes 0.19, The Smallest Agreement's threshold becomes 75%, and Weekend Gap's starting reserve becomes zero. All browser contexts and the temporary loopback listener close when the check finishes.

Record the tested commit, browser version, platform, and console result. This is one acceptance journey per application, not a full accessibility audit or cross-browser certification. Node model, boundary, replay, and adversarial tests remain required through `npm test` and `npm run check`.
