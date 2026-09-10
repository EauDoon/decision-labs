# Decision Labs

**Four local workbenches you can open today. One catalog. No account.**

Decision Labs is a repository of independent, static, browser-based workbenches.
Each one helps a group inspect a bounded, high-stakes decision with transparent,
deterministic math. Open a workbench, change the assumptions, and take a JSON
export into the conversation that actually decides.

This root is the catalog, not a fifth product and not a hosted service. Each
workbench keeps its own source, tests, generated single-file build, MIT license,
version, and release notes.

Every workbench:

- runs in the browser with **no install, no account, and no network requests**;
- uses **zero package dependencies** (Node.js 20 or newer is only needed to run
  the tests and the local launcher);
- keeps all data in your browser and only shares it when you explicitly export
  JSON or send a link;
- computes **deterministically** and states its model, assumptions, and limits
  openly; and
- acts as a decision **aid**, never a decision maker. It assigns no
  probabilities, no prices, and no legitimacy.

## The workbenches

| Workbench | Version | Job to be done | Built-in synthetic example |
| --- | --- | --- | --- |
| [Partnership Breakpoint](apps/partnership-breakpoint/) | 1.5.1 | Find which participant in a revenue split reaches an exit threshold first when volume, fees, or costs move. | **Balanced** starting point |
| [Common Cart](apps/common-cart/) | 1.4.1 | Pool buyer constraints and compare conditional merchant offers without exposing individual buyer records to the merchant view. | **Coffee** scenario (Neighbourhood coffee run) |
| [The Smallest Agreement](apps/smallest-agreement/) | 1.5.1 | Find the lowest-cost set of clause changes that still crosses an approval threshold while respecting support floors, locks, and a change budget. | **Neighbourhood Plan** |
| [Weekend Gap](apps/weekend-gap/) | 1.5.1 | Follow synthetic AUD redemption demand from Friday to Monday when reserves and settlement windows do not fully overlap. | **Normal Friday** (72-hour case) |

Open [index.html](index.html) for the product home: one-sentence jobs, Open
workbench / How it works actions, in-page trust notes, card versions, and a
What's new section. Skip links jump to What's new, workbenches, How it works,
keyboard shortcuts, and Trust and limits. Catalog keys `w`, `k`, `n`, and `c`
focus the workbenches, How it works, What's new, or copy the catalog address on
http. Copy versions copies the four names and versions printed on this page as
Markdown. That list is not a live product version and it does not call a
registry. What's new names current in-workbench tools (share-to-hold,
residual coverage, veto groups, and the gate Gantt) without implying live
services. It also names the local 1.4.1 and 1.3.1 extras now on main: Partnership
Breakpoint CSV roster, capacity, and notes; Common Cart leftover/tertiary fill
and overlap counts; The Smallest Agreement package pin, locks, and notes; and
Weekend Gap queue-clear hours and Gantt compare. Weekend Gap 1.4.2 also names
queue CSV export, peak-queue jump, and the long-weekend Friday start. The
Smallest Agreement 1.4.2 also names the facilitator pack, group CSV, and
weight renormalize tools. Common Cart 1.3.2 also names offer CSV import, buyer
sort, and leftover headroom. Partnership Breakpoint 1.4.2 also names
volume-to-hold, stress-grid CSV, and the two-party studio start. Weekend Gap
1.4.3 also names dashboard Markdown copy, two-file compare, and the compressed
Friday close start. Common Cart 1.3.3 also names offer CSV export, variant
filter, and empty-offer recovery. Partnership Breakpoint 1.4.3 also names
roster export, imported-JSON compare, and the four-party marketplace start.
The Smallest Agreement 1.4.3 also names clause CSV import, veto-only filter,
and the Library Quiet Hours start. The Smallest Agreement 1.5.1 also names
the locked-clause filter, Sports Fixture Night start, and original versus
recommended versus pinned copy. Common Cart 1.4.1 also names organizer buyer
CSV, leftover jump, and the community garden start. Partnership Breakpoint 1.5.1
also names waterfall SVG download, compare and print keys, and the Licensor
and distributor start. Weekend Gap 1.5.1 also names Gantt hour Markdown copy,
Payday Friday burst, and one-row dashboard CSV. These are
browser tools on the case you opened, not hosted APIs. Each app also ships a `MODEL.md` (formulas and
conventions), `CONTRIBUTING.md`, `SECURITY.md`, and its own `LICENSE`. The
loopback launcher does not serve those markdown files; open the app folder or
the workbench itself to read them.

## Review and replay a case

Each app now has one optional review panel. Run a question on the current valid inputs, then export a review packet when you need a reproducible record. Inspect a packet in the same app to recompute its results without replacing the current draft, baseline or saved library. Input edits and newer review actions clear older results and cancel pending reads.

| Workbench | Find this panel | Useful questions |
| --- | --- | --- |
| Common Cart 1.4.0 | Buyer room: Review buyer coverage and offer resilience | Which buyers have alternatives? What happens if a winning buyer withdraws? |
| Partnership Breakpoint 1.5.0 | Review constraints and negotiation room | Where do all constraints overlap? Which costs or shares can the current revenue fund? |
| The Smallest Agreement 1.5.0 | Review the package before discussion | How much approval slack remains? What changes when a clause, lock, threshold or budget changes? |
| Weekend Gap 1.5.0 | Review the timing behind the queue | When does backlog accumulate? What do arrival cohorts, window overlap and bounded reserve scenarios show? |

Packets are limited to 1 MiB and bind canonical inputs to full-precision output. They are unsigned consistency records, not authenticated facts or external commitments. Common Cart packets can include private buyer constraints; other packets can contain participant names, scores and notes. Check them before sharing. A model update may make an older review fail replay; keep the matching standalone version when archiving a study.

## Quick start

Download the repository ZIP, extract it, and open [index.html](index.html) to
choose a workbench. The catalog links to each self-contained app. No server is
required for that path. Export JSON before clearing browser data or moving to a
different browser.

For a local browser address, run these commands from the repository root:

```sh
npm start
```

Open the printed address, normally `http://127.0.0.1:4170`. The launcher serves
only the catalog page and the four generated workbenches. It accepts local Host
headers, binds loopback only, and does not expose source files, model notes, or
local drafts. A path outside that set still returns HTTP 404; the body is a
Decision Labs page that points back to the catalog rather than a blank
"Not found" line. Set `PORT` to an integer from 1 through 65535 to choose another
port. Keys 1 to 4 on the catalog open the four workbenches when focus is not in
an input. Press `h` to focus the catalog heading. Press `n` to focus What's
new. Press `w` to focus the workbenches. Press `k` to focus How it works.
Press `t` to focus Trust and limits. Press `c` to copy the catalog address
when this page is served over http. On a file URL that key does not claim a
copy succeeded. Press `v` to copy catalog versions from this page. That key
uses the same Copy versions control, including the visible text box when the
clipboard API is unavailable. Press `l` to focus the workbench card that is
Last launched in this browser, or the workbenches heading if none is stored.
That recency is storage in this browser, not a cloud recency. Press `o` to
open that last-launched workbench. The key assigns `location` the same way
keys 1 to 4 do, including writing last-launched storage. If none is stored,
it focuses the workbenches and does not navigate. It does not copy, including
on a file URL. Press `?` on the catalog for the in-page shortcut list. The branded 404
page still returns HTTP 404, lists current catalog versions, and links
back to the catalog by name for Partnership Breakpoint, Common Cart, The
Smallest Agreement, and Weekend Gap. Copy versions on that 404 page copies
the printed catalog version line as Markdown. It does not fetch a package
file or add another public path. When the catalog is served over http,
a control copies the loopback address; it stays hidden on a file URL.
Copy versions copies the four workbench names and versions already printed on
this catalog page as Markdown. It uses the browser clipboard when that API is
available, and shows a visible text box if it is not. This is the catalog list,
not a live product version. Copy jobs copies the four workbench names and
one-sentence jobs from the catalog cards as Markdown, with the same clipboard
and visible text box fallback. That list is not a live product feed.
Press `j` to copy catalog jobs through that same control.

All four apps are static and dependency-free. Pick the mode you want and swap in
any app folder where you see `apps/partnership-breakpoint`.

### No install: open the single-file build

Every app includes a generated `standalone.html` with the interface, styles, and
model in one file. Open it directly in a browser; it makes no network requests.

```text
apps/<app>/standalone.html
```

To regenerate a standalone file from source (Node.js 20 or newer), from the app
folder:

```sh
npm run build:standalone
npm run build:standalone -- --check   # verify it matches source, without rewriting
```

### Local launcher (Node.js 20 or newer)

```sh
cd apps/partnership-breakpoint
npm run launch     # starts a loopback-only server, then opens the GUI
npm start          # server only; open the printed URL yourself
```

On Windows, double-click `launch-windows.cmd` in the app folder instead. The
server binds `127.0.0.1` only. Most apps default to `http://127.0.0.1:4173`;
Weekend Gap defaults to `http://127.0.0.1:5173`. Override the port with `PORT`
(an integer from 1 to 65535; invalid values are rejected).

### Run the tests and checks

From the repository root, these commands cover all four apps:

```sh
npm test           # root integration tests, then every app's test suite
npm run check      # every app's syntax and standalone freshness checks
npm run build:standalone  # regenerate all four self-contained builds
```

The integration tests also parse standalone JavaScript in its actual script
mode. This catches module declaration collisions that a classic-script test
harness can miss. App-local commands remain available from each app folder.

## Repository layout

```text
decision-labs/
|-- README.md                  # This file
|-- index.html                 # Product catalog for the four workbenches
|-- package.json               # Root launch, validation, and build commands
|-- scripts/                   # Loopback launcher and app command runner
|-- tests/                     # Launch boundary and browser-script parsing tests
|-- LICENSE                    # MIT (repository)
|-- .github/workflows/         # App checks and full-suite integration checks
`-- apps/
    |-- partnership-breakpoint/
    |-- common-cart/
    |-- smallest-agreement/
    `-- weekend-gap/
        |-- index.html         # Browser interface
        |-- styles.css         # Responsive styles
        |-- src/               # Pure model + browser app
        |-- tests/             # Node built-in tests
        |-- scripts/           # Dependency-free build, server, and launcher
        |-- standalone.html    # Generated single-file build
        |-- launch-windows.cmd # One-click Windows launcher
        |-- MODEL.md           # Formulas and conventions
        |-- CONTRIBUTING.md
        |-- SECURITY.md
        `-- LICENSE            # MIT (app)
```

## Design boundaries

These are transparent, deterministic models for exploration and negotiation. By
design, none of them:

- make network requests, use live data, or depend on external services;
- assign probabilities, forecasts, prices, or legal validity;
- prove a contract is enforceable, that a counterparty will act, or that inputs
  are complete; or
- claim a result is fair, legitimate, or optimal.

Keep real judgment, governing rules, and accountability with people. Read each
app's `MODEL.md` for the exact formulas, assumptions, and non-goals.

The hub page is a catalog. It does not version the four workbenches together
and it does not run them as a suite. Each workbench ships its own version.

## Continuous integration

Each app has its own path-filtered GitHub Actions workflow that runs its checks
on pull requests and on pushes to `main`. A repository integration workflow also
runs the root suite and all app checks on every PR and main push. Report
repository-wide and component issues in the
[shared issue tracker](https://github.com/EauDoon/decision-labs/issues).

## License

MIT. See [LICENSE](LICENSE) and each app's retained `LICENSE` file.

The local last-launched marker updates from both the Open workbench links and keys 1 to 4. Storage failure does not prevent opening an app. Missing or unreadable last-launched storage is silent: no recency note appears.
