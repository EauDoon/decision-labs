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
| [Partnership Breakpoint](apps/partnership-breakpoint/) | 1.5.9 | Find which participant in a revenue split reaches an exit threshold first when volume, fees, or costs move. | **Balanced** starting point |
| [Common Cart](apps/common-cart/) | 1.4.8 | Pool buyer constraints and compare conditional merchant offers without exposing individual buyer records to the merchant view. | **Coffee** scenario (Neighbourhood coffee run) |
| [The Smallest Agreement](apps/smallest-agreement/) | 1.5.8 | Find the lowest-cost set of clause changes that still crosses an approval threshold while respecting support floors, locks, and a change budget. | **Neighbourhood Plan** |
| [Weekend Gap](apps/weekend-gap/) | 1.5.9 | Follow synthetic AUD redemption demand from Friday to Monday when reserves and settlement windows do not fully overlap. | **Normal Friday** (72-hour case) |

Open [index.html](index.html) for the product home: one-sentence jobs, Open
workbench / How it works actions, in-page trust notes, card versions, and a
What's new section. Skip links jump to What's new, workbenches, How it works,
keyboard shortcuts, Trust and limits, and catalog versions. Catalog keys `w`, `k`, `n`, and `c`
focus the workbenches, How it works, What's new, or copy the catalog address on
http. Key `m` focuses the main catalog content. Key `s` focuses the first Open
workbench link without opening it. Key `]` focuses the last Open workbench
link, or the workbenches heading if none. That key moves focus; it does not
open the workbench. Key `a` focuses the first workbench article
without opening it. Key `b` focuses the last workbench card without opening
it. Key `f` focuses the footer version line. That key does not
open a workbench. Key `g` focuses the first What's new heading, or the What's
new heading if none. That key does not open a workbench. Key `d` focuses the
first How it works list item, or the How it works heading if none. That key
moves focus; it does not open a workbench. Key `/` focuses the first Trust and
limits list item, or the Trust and limits heading if none. That key moves
focus; it does not open a workbench. Shift+/ still opens the shortcut list. Key `r` focuses the
first review path on the first workbench card. That key moves focus; it does
not open the workbench. Key `p` prints this catalog page. It is not a live product
sheet. Key `e` copies the catalog heading and lede from this page as Markdown.
That copy is catalog copy, not a live product feed. If those nodes are
missing, it copies an empty string. Keys `v` and `j` copy the printed version list and one-sentence jobs.
Key `,` copies the footer version line from this page as one Markdown line.
That copy is catalog copy, not a live product version.
Key `[` focuses the Copy version line control, or the footer version line if
that control is missing. That key moves focus; it does not open a workbench.
It does not copy.
Key `q` copies those same catalog jobs through the Copy jobs control. It does not fork that Markdown. Key `;` copies the first workbench name and one-sentence job from this page as one Markdown line. That copy is catalog copy, not a live product feed. If that card is missing, it copies an empty string. That key is distinct from `j` and `q`, which copy all four jobs, and from `y`, which copies the last-launched job. Key `:` copies the first Trust and limits list item from this page as one Markdown line. That copy is catalog copy, not a live policy feed. If that item is missing, it copies an empty string. That key is distinct from `i`, which copies the full Trust and limits list, and from `;`, which copies the first workbench job. Key `"` copies the last Trust and limits list item from this page as one Markdown line. That copy is catalog copy, not a live policy feed. If that item is missing, it copies an empty string. That key is distinct from `:`, which copies the first Trust and limits list item, and from `i`, which copies the full Trust and limits list. Key `i` copies Trust and limits from this page as Markdown. That list is not a
live policy feed. Key `u` copies How it works from this page as Markdown. That
list is not a live policy feed. Key `-` copies the first How it works list
item from this page as one Markdown line. That copy is catalog copy, not a
live policy feed. If that item is missing, it copies an empty string. That
key is distinct from `u`, which copies the full How it works list, and from
`d`, which focuses the first How it works list item. Key `=` focuses the Copy
How it works control, or the How it works heading if that control is missing.
That key moves focus; it does not open a workbench. It does not copy. That
key is distinct from `k`, which focuses How it works, and from `u`, which
copies How it works. Keys `l` and `o` focus or open the last-launched workbench stored in this
browser. Key `x` clears that last-launched marker in this browser. Key `y`
copies the last-launched workbench name and one-sentence job from this-browser
storage, or an empty line if none is stored. That recency
is this-browser storage, not a cloud recency. Key `z` copies the six skip-link
targets from this page as Markdown. That copy is in-page navigation copy, not
a sitemap API. Key `.` focuses Skip to catalog versions. That key moves
focus; it does not open a workbench. Key `'` focuses Skip to Trust and limits.
That key moves focus; it does not open a workbench. Key `o` assigns a location like keys 1 to 4. It does not claim a
copy succeeded on a file URL. Copy versions copies the four names and versions printed on this page as
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
recommended versus pinned copy. The Smallest Agreement 1.5.2 also names the
Market stall hours start, lock Markdown copy, and recommended-difference filter.
The Smallest Agreement 1.5.3 also names the Shared bike shed start,
recommended-package Markdown copy, and leftover-budget clause filter.
The Smallest Agreement 1.5.4 also names the Street stall lighting start,
remaining change-budget copy, and the at-floor group filter.
The Smallest Agreement 1.5.5 also names the Hall hire hours start,
numeric approval-threshold copy, and the no-floor group filter.
The Smallest Agreement 1.5.6 also names the Community garden watering start,
lock-count copy, and the unlocked-clause filter.
The Smallest Agreement 1.5.7 also names the Shared laundry hours start,
first-locked-option copy, and the locked-clause hide filter.
The Smallest Agreement 1.5.8 also names the Rooftop BBQ hours start,
first-locked-option copy shortcut, and the threshold-group hide filter.
Common Cart 1.4.1 also names organizer buyer
CSV, leftover jump, and the community garden start. Common Cart 1.4.2 also names
organizer leftover copy, school fete catering, and overlap Markdown. Common Cart 1.4.3 also names
uncovered leftover counts, the Office fruit box start, and leftover review jumps. Common Cart 1.4.4 also names
leftover headroom copy, the Library photocopy paper start, and uncovered leftover jumps. Common Cart 1.4.5 also names leftover fill copy, the Sports club match-day kit start, and remaining-capacity copy. Common Cart 1.4.6 also names remaining-capacity jump, the Surf club first-aid kit start, and leftover-fill copy jump. Common Cart 1.4.7 also names leftover-fill unit-count copy, the Theatre wardrobe kit start, and leftover print jump. Common Cart 1.4.8 also names leftover-fill unit-count copy shortcut, the Community choir folders start, and the leftover-buyer hide filter. Partnership Breakpoint 1.5.1
also names waterfall SVG download, compare and print keys, and the Licensor
and distributor start. Partnership Breakpoint 1.5.2 also names waterfall
Markdown copy, the Talent, agent, and platform start, and the all-hold ledger
filter. Partnership Breakpoint 1.5.3 also names tornado Markdown copy, the
Three-party joint venture start, and the all-hold ledger persist / unbounded
tornado filter. Partnership Breakpoint 1.5.4 also names allocation-balance
Markdown copy, the Podcast host and network start, and the zero-share roster
filter. Partnership Breakpoint 1.5.5 also names capacity-utilization Markdown copy, the Community hall split start, and the over-capacity roster filter. Partnership Breakpoint 1.5.6 also names first-breakpoint participant copy, the Festival stall split start, and the at-hold roster filter. Partnership Breakpoint 1.5.7 also names least-headroom participant copy, the Pop-up cinema split start, and the unbounded-capacity roster filter. Partnership Breakpoint 1.5.8 also names least-headroom copy shortcut, the Community radio split start, and the spare-capacity roster filter. Partnership Breakpoint 1.5.9 also names remaining-to-hold copy shortcut, the School concert split start, and the least-headroom roster filter. Weekend Gap 1.5.1 also names Gantt hour Markdown copy,
Payday Friday burst, and one-row dashboard CSV. Weekend Gap 1.5.2 also names
peak-queue hour copy, Public-holiday Monday, and the single-gate Gantt filter.
Weekend Gap 1.5.3 also names hours-to-clear Markdown copy, Saturday market
burst, and selected Gantt hour persist. Weekend Gap 1.5.4 also names remaining
reserve copy, Sunday stall close, and the weekend-hours Gantt filter. Weekend Gap 1.5.5 also names hours-to-first-settlement Markdown copy, Thin Saturday FX, and the hide-open Gantt filter. Weekend Gap 1.5.6 also names first-settlement jump, Early Monday bank open, and the hide-weekend Gantt filter. Weekend Gap 1.5.7 also names first-settlement copy shortcut, Friday late FX close, and the hide-closed Gantt filter. Weekend Gap 1.5.8 also names hours-to-clear copy shortcut, Monday late issuer open, and the hide-zero-queue Gantt filter. Weekend Gap 1.5.9 also names first-closed-bank copy shortcut, Saturday early FX open, and the hide-bank-closed Gantt filter.
The catalog also names how-it-works jump, version-line copy, and skip-link focus.
That What's new entry is hub-only. It does not change workbench versions.
The catalog also names skip-link copy, last-card focus, and 404 Copy jobs.
That What's new entry is hub-only. It does not change workbench versions.
The catalog also names trust-item jump, first-job copy, and 404 Copy version line.
That What's new entry is hub-only. It does not change workbench versions.
The catalog also names version-line jump, last-open jump, and 404 Copy first Trust item.
That What's new entry is hub-only. It does not change workbench versions.
The catalog also names first How-it-works copy, How copy jump, and last Trust copy.
That What's new entry is hub-only. It does not change workbench versions.
These are
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
an input. Press `h` to focus the catalog heading. Press `m` to focus the
main catalog content. Press `n` to focus What's
new. Press `g` to focus the first What's new heading. Press `w` to focus the
workbenches. Press `k` to focus How it works.
Press `d` to focus the first How it works list item. That key moves focus; it
does not open a workbench.
Press `/` to focus the first Trust and limits list item. That key moves focus;
it does not open a workbench. Shift+/ still opens the shortcut list.
Press `t` to focus Trust and limits. Press `s` to focus the first Open
workbench link. Press `]` to focus the last Open workbench link. That key
moves focus; it does not open the workbench. If none is present, it focuses
the workbenches heading. Press `a` to focus the first workbench article without opening
it. That key is distinct from `s`, which focuses the first Open workbench link.
Press `b` to focus the last workbench card without opening it. That key moves
focus; it does not open the workbench. Press `r` to focus the first review
path on the first workbench card. That key moves focus; it does not open the
workbench.
Press `f` to focus the footer version line. That key does
not open a workbench. Press `p` to print this catalog. That key prints this
page in the browser. It is not a live product sheet. Press `c` to copy the catalog address
when this page is served over http. On a file URL that key does not claim a
copy succeeded. Press `e` to copy the catalog heading and lede from this page.
That key uses the same Copy catalog intro control, including the visible text
box when the clipboard API is unavailable. If those nodes are missing, it
copies an empty string. This is catalog copy, not a live product feed.
Press `v` to copy catalog versions from this page. That key
uses the same Copy versions control, including the visible text box when the
clipboard API is unavailable. Press `,` to copy the footer version line from
this page as one Markdown line. That key uses the same Copy version line
control, including the visible text box when the clipboard API is unavailable.
This is catalog copy, not a live product version. Press `[` to focus the Copy
version line control, or the footer version line if that control is missing.
That key moves focus; it does not open a workbench. It does not copy. Press `l` to focus the workbench card that is
Last launched in this browser, or the workbenches heading if none is stored.
That recency is storage in this browser, not a cloud recency. Press `o` to
open that last-launched workbench. The key assigns `location` the same way
keys 1 to 4 do, including writing last-launched storage. If none is stored,
it focuses the workbenches and does not navigate. It does not copy, including
on a file URL. Press `x` to clear last-launched storage in this browser and
hide the recency notes. That clear is this-browser storage, not a cloud
recency. If this browser refuses the storage write, the notes still hide for
this view and no error is shown. Press `?` on the catalog for the in-page shortcut list. The branded 404
page still returns HTTP 404, lists current catalog versions, and links
back to the catalog by name for Partnership Breakpoint, Common Cart, The
Smallest Agreement, and Weekend Gap. Copy versions on that 404 page copies
the printed catalog version line as Markdown. It does not fetch a package
file or add another public path. Copy Trust and limits on that 404 page copies
the printed Trust and limits heading and list as Markdown. It does not fetch a
policy file or add another public path. Copy How it works on that 404 page copies
the printed How it works heading and list as Markdown. It does not fetch a
policy file or add another public path. Copy jobs on that 404 page copies the
printed workbench names and one-sentence jobs as Markdown. It does not fetch a
product feed or add another public path. Copy catalog intro on that 404 page copies
the printed heading and lede as Markdown. It does not fetch a product feed or
add another public path. Copy version line on that 404 page copies the printed
catalog version listing as one Markdown line. It does not fetch a package
file or add another public path. Copy first Trust item on that 404 page copies
the printed first Trust and limits list item as one Markdown line. It does not
fetch a policy file or add another public path. Copy first How it works item on
that 404 page copies the printed first How it works list item as one Markdown
line. It does not fetch a policy file or add another public path. When the catalog is served over http,
a control copies the loopback address; it stays hidden on a file URL.
Copy versions copies the four workbench names and versions already printed on
this catalog page as Markdown. It uses the browser clipboard when that API is
available, and shows a visible text box if it is not. This is the catalog list,
not a live product version. Copy version line copies the footer version-line
text already printed on this page as one Markdown line, with the same clipboard
and visible text box fallback. That copy is catalog copy, not a live product
version. Copy catalog intro copies the catalog heading and
lede paragraph already printed on this page as Markdown, with the same
clipboard and visible text box fallback. If those nodes are missing, it
copies an empty string. That copy is catalog copy, not a live product feed.
Copy jobs copies the four workbench names and
one-sentence jobs from the catalog cards as Markdown, with the same clipboard
and visible text box fallback. That list is not a live product feed.
Copy first job copies the first workbench name and one-sentence job from the
catalog cards as one Markdown line, with the same clipboard and visible text
box fallback. If that card is missing, it copies an empty string. That copy is
catalog copy, not a live product feed.
Press `j` to copy catalog jobs through that same control.
Press `q` to copy catalog jobs through that same Copy jobs control. It does not fork that Markdown.
Press `;` to copy the first workbench name and one-sentence job from this page
as one Markdown line. That key uses the same Copy first job control, including
the visible text box when the clipboard API is unavailable. If that card is
missing, it copies an empty string. This is catalog copy, not a live product
feed. It is distinct from `j` and `q`, which copy all four jobs, and from `y`.
Press `:` to copy the first Trust and limits list item from this page as one
Markdown line. That key uses the same Copy first Trust item control, including
the visible text box when the clipboard API is unavailable. If that item is
missing, it copies an empty string. This is catalog copy, not a live policy
feed. It is distinct from `i`, which copies the full Trust and limits list, and
from `;`.
Press `"` to copy the last Trust and limits list item from this page as one
Markdown line. That key uses the same Copy last Trust item control, including
the visible text box when the clipboard API is unavailable. If that item is
missing, it copies an empty string. This is catalog copy, not a live policy
feed. It is distinct from `:`, which copies the first Trust and limits list
item, and from `i`.
Copy skip links copies the six skip-link labels and hash hrefs already printed
in the skip navigation as Markdown, with the same clipboard and visible text
box fallback. This is in-page navigation copy, not a sitemap API.
Copy Trust and limits copies the Trust and limits heading and list items
already printed on this catalog page as Markdown. It uses the browser
clipboard when that API is available, and shows a visible text box if it is
not. That list is not a live policy feed.
Copy first Trust item copies the first Trust and limits list item already
printed on this catalog page as one Markdown line, with the same clipboard
and visible text box fallback. If that item is missing, it copies an empty
string. That copy is catalog copy, not a live policy feed. It is distinct
from Copy Trust and limits, which copies the full list, and from Copy first
job.
Copy last Trust item copies the last Trust and limits list item already
printed on this catalog page as one Markdown line, with the same clipboard
and visible text box fallback. If that item is missing, it copies an empty
string. That copy is catalog copy, not a live policy feed. It is distinct
from Copy first Trust item, which copies the first item, and from Copy Trust
and limits, which copies the full list.
Press `i` to copy Trust and limits through that same control.
Press `u` to copy How it works through that same control.
Press `-` to copy the first How it works list item from this page as one
Markdown line. That key uses the same Copy first How it works item control,
including the visible text box when the clipboard API is unavailable. If
that item is missing, it copies an empty string. This is catalog copy, not a
live policy feed. It is distinct from `u`, which copies the full How it works
list, and from `d`.
Press `=` to focus the Copy How it works control, or the How it works heading
if that control is missing. That key moves focus; it does not open a
workbench. It does not copy. That key is distinct from `k`, which focuses How
it works, and from `u`.
Press `y` to copy the last-launched workbench name and one-sentence job from
this-browser storage. If none is stored, that key copies an empty line. This is
not a cloud recency.
Press `z` to copy skip-link targets from this page. That key uses the same Copy
skip links control, including the visible text box when the clipboard API is
unavailable. This is in-page navigation copy, not a sitemap API.
Press `.` to focus Skip to catalog versions. That key moves focus; it does not
open a workbench.
Press `'` to focus Skip to Trust and limits. That key moves focus; it does not
open a workbench.
Copy How it works copies the How it works heading and list items already
printed on this catalog page as Markdown. It uses the browser clipboard when
that API is available, and shows a visible text box if it is not. That list
is not a live policy feed.
Copy first How it works item copies the first How it works list item already
printed on this catalog page as one Markdown line, with the same clipboard
and visible text box fallback. If that item is missing, it copies an empty
string. That copy is catalog copy, not a live policy feed. It is distinct
from Copy How it works, which copies the full list, and from Copy first Trust
item.

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

The local last-launched marker updates from both the Open workbench links and keys 1 to 4. Storage failure does not prevent opening an app. Missing or unreadable last-launched storage is silent: no recency note appears. Key `x` clears that marker in this browser and hides the notes. A storage write failure stays silent.
