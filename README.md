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
| [Partnership Breakpoint](apps/partnership-breakpoint/) | 1.5.30 | Find which participant in a revenue split reaches an exit threshold first when volume, fees, or costs move. | **Balanced** starting point |
| [Common Cart](apps/common-cart/) | 1.4.30 | Pool buyer constraints and compare conditional merchant offers without exposing individual buyer records to the merchant view. | **Coffee** scenario (Neighbourhood coffee run) |
| [The Smallest Agreement](apps/smallest-agreement/) | 1.5.30 | Find the lowest-cost set of clause changes that still crosses an approval threshold while respecting support floors, locks, and a change budget. | **Neighbourhood Plan** |
| [Weekend Gap](apps/weekend-gap/) | 1.5.29 | Follow synthetic AUD redemption demand from Friday to Monday when reserves and settlement windows do not fully overlap. | **Normal Friday** (72-hour case) |

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
not open the workbench. Key `{` copies the last review path from this page as one Markdown line. That copy is catalog copy, not a live product feed. If that path is missing, it copies an empty string. That key is distinct from `$`, which copies the last workbench heading, from `r`, which focuses the first review path, and from `5`, which focuses Copy last review path. Key `5` focuses the Copy last review path control, or the workbenches heading if that control is missing. That key moves focus; it does not open a workbench. It does not copy. That key is distinct from `{`, which copies the last review path, from `r`, which focuses the first review path, and from `6`, which focuses the last review path. Key `6` focuses the last review path on the last workbench card, or the workbenches heading if that path is missing. That key moves focus; it does not open a workbench. It does not copy. That key is distinct from `r`, which focuses the first review path, and from `5`, which focuses Copy last review path. Key `7` copies the first review path from this page as one Markdown line. That copy is catalog copy, not a live product feed. If that path is missing, it copies an empty string. That key is distinct from `{`, which copies the last review path, from `r`, which focuses the first review path, and from `8`, which focuses Copy first review path. Key `8` focuses the Copy first review path control, or the workbenches heading if that control is missing. That key moves focus; it does not open a workbench. It does not copy. That key is distinct from `7`, which copies the first review path, from `5`, which focuses Copy last review path, and from `9`, which focuses the first review path. Key `9` focuses the first review path on the first workbench card, or the workbenches heading if that path is missing. That key moves focus; it does not open a workbench. It does not copy. That key is distinct from `6`, which focuses the last review path, from `r`, which also focuses the first review path, and from `8`, which focuses Copy first review path. Key `0` copies the first Open workbench href from this page as one Markdown line. That copy is catalog copy, not a live product feed. If that href is missing, it copies an empty string. That key is distinct from `\`, which focuses Copy first Open href, from `s`, which focuses the first Open workbench link, from `]`, which focuses the last Open workbench link, from `{`, which copies the last review path, from `7`, which copies the first review path, and from `5` and `6`, which jump last-review. Key `\` focuses the Copy first Open href control, or the catalog heading or workbenches heading if that control is missing. That key moves focus; it does not open a workbench. It does not copy. That key is distinct from `0`, which copies the first Open workbench href, from `s`, which focuses the first Open workbench link, from `]`, which focuses the last Open workbench link, and from first-review keys `7`, `8`, and `9`. Key `Home` copies the last Open workbench href from this page as one Markdown line. That copy is catalog copy, not a live product feed. If that href is missing, it copies an empty string. That key is distinct from `0`, which copies the first Open workbench href, from `End`, which focuses Copy last Open href, from `s`, which focuses the first Open workbench link, from `]`, which focuses the last Open workbench link, from `{`, which copies the last review path, from `7`, which copies the first review path, and from `5` and `6`, which jump last-review. Key `End` focuses the Copy last Open href control, or the catalog heading or workbenches heading if that control is missing. That key moves focus; it does not open a workbench. It does not copy. That key is distinct from `Home`, which copies the last Open workbench href, from `0`, which copies the first Open workbench href, from `s`, which focuses the first Open workbench link, from `]`, which focuses the last Open workbench link, and from first-review keys `7`, `8`, and `9`. Key `PageUp` copies the first skip-link href from this page as one Markdown line. That copy is catalog copy, not a live product feed. If that href is missing, it copies an empty string. That key is distinct from `z`, which copies every skip-link target, from `PageDown`, which focuses Copy first skip href, from `ArrowRight`, which focuses the first skip link, from `Home`, which copies the last Open workbench href, and from `0`, which copies the first Open workbench href. Key `PageDown` focuses the Copy first skip href control, or the skip-link row or catalog heading if that control is missing. That key moves focus; it does not open a workbench. It does not copy. That key is distinct from `PageUp`, which copies the first skip-link href, from `z`, which copies skip-link targets, from `#`, which focuses Copy skip links, from `ArrowRight`, which focuses the first skip link, and from first-open keys `0`, `\\`, and `s`. Key `ArrowRight` focuses the first skip link, or the skip-link row or catalog heading if none. That key moves focus; it does not open a workbench. It does not copy. That key is distinct from `PageUp`, which copies the first skip-link href, from `PageDown`, which focuses Copy first skip href, from `z`, which copies skip-link targets, from `#`, which focuses Copy skip links, from `.`, which focuses Skip to catalog versions, and from `n`, which focuses What's new. Key `Insert` copies the last skip-link href from this page as one Markdown line. That copy is catalog copy, not a live product feed. If that href is missing, it copies an empty string. That key is distinct from `PageUp`, which copies the first skip-link href, from `z`, which copies every skip-link target, from `ArrowDown`, which focuses Copy last skip href, from `ArrowLeft`, which focuses the last skip link, from `Home`, which copies the last Open workbench href, and from `0`, which copies the first Open workbench href. Key `ArrowDown` focuses the Copy last skip href control, or the skip-link row or catalog heading if that control is missing. That key moves focus; it does not open a workbench. It does not copy. That key is distinct from `Insert`, which copies the last skip-link href, from `PageDown`, which focuses Copy first skip href, from `z`, which copies skip-link targets, from `#`, which focuses Copy skip links, from `ArrowLeft`, which focuses the last skip link, and from `End`, which focuses Copy last Open href. Key `ArrowLeft` focuses the last skip link, or the skip-link row or catalog heading if none. That key moves focus; it does not open a workbench. It does not copy. That key is distinct from `Insert`, which copies the last skip-link href, from `ArrowDown`, which focuses Copy last skip href, from `ArrowRight`, which focuses the first skip link, from `z`, which copies skip-link targets, from `#`, which focuses Copy skip links, from `.`, which focuses Skip to catalog versions, and from `n`, which focuses What's new. Key `Delete` copies the first skip-link text from this page as one Markdown line. That copy is catalog copy, not a live product feed. If that text is missing, it copies an empty string. That key is distinct from `PageUp`, which copies the first skip-link href, from `Insert`, which copies the last skip-link href, from `z`, which copies every skip-link target, from `Home`, which copies the last Open workbench href, and from `0`, which copies the first Open workbench href. Key `ArrowUp` focuses the Copy first skip text control, or the skip-link row or catalog heading if that control is missing. That key moves focus; it does not open a workbench. It does not copy. That key is distinct from `PageDown`, which focuses Copy first skip href, from `ArrowDown`, which focuses Copy last skip href, from `#`, which focuses Copy skip links, and from `End`, which focuses Copy last Open href. Key `F2` focuses the skip nav, or the catalog heading if that nav is missing. That key moves focus; it does not open a workbench. It does not copy. That key is distinct from `ArrowRight`, which focuses the first skip link, from `ArrowLeft`, which focuses the last skip link, from `.`, which focuses Skip to catalog versions, and from `n`, which focuses What's new. Key `F3` copies the last skip-link text from this page as one Markdown line. That copy is catalog copy, not a live product feed. If that text is missing, it copies an empty string. That key is distinct from `Delete`, which copies the first skip-link text, from `Insert`, which copies the last skip-link href, from `PageUp`, which copies the first skip-link href, from `Home`, which copies the last Open workbench href, and from `0`, which copies the first Open workbench href. Key `F4` focuses the Copy last skip text control, or the skip-link row or catalog heading if that control is missing. That key moves focus; it does not open a workbench. It does not copy. That key is distinct from `ArrowUp`, which focuses Copy first skip text, from `ArrowDown`, which focuses Copy last skip href, from `#`, which focuses Copy skip links, and from `End`, which focuses Copy last Open href. Key `F6` focuses the last skip target, or the catalog heading if that target is missing. That key moves focus; it does not open a workbench. It does not copy. That key is distinct from `ArrowLeft`, which focuses the last skip link, from `F2`, which focuses the skip nav, from `.`, which focuses Skip to catalog versions, and from `n`, which focuses What's new. Key `F7` copies the labelled heading of the first skip href from this page as one Markdown line. That copy is catalog copy, not a live product feed. If that labelled text is missing, it copies an empty string. That key is distinct from `Delete`, which copies the first skip-link text, from `F3`, which copies the last skip-link text, from `PageUp`, which copies the first skip-link href, from `)`, which copies the first What's new heading, and from `0`, which copies the first Open workbench href. Key `F8` focuses the Copy first skip target text control, or the skip-link row or catalog heading if that control is missing. That key moves focus; it does not open a workbench. It does not copy. That key is distinct from `F4`, which focuses Copy last skip text, from `ArrowUp`, which focuses Copy first skip text, from `ArrowDown`, which focuses Copy last skip href, and from `#`, which focuses Copy skip links. Key `F9` focuses the first skip target, or the catalog heading if that target is missing. That key moves focus; it does not open a workbench. It does not copy. That key is distinct from `n`, which focuses What's new, from `g`, which focuses the first What's new heading, from `F6`, which focuses the last skip target, from `F2`, which focuses the skip nav, and from `.`, which focuses Skip to catalog versions. Key `F10` copies the labelled heading of the last skip href that has one from this page as one Markdown line. That copy is catalog copy, not a live product feed. If that labelled text is missing, it copies an empty string. That key is distinct from `F7`, which copies the first skip-target text, from `F3`, which copies the last skip-link text, from `Delete`, which copies the first skip-link text, from `Insert`, which copies the last skip-link href, and from `"`, which copies the last Trust item. Key `F11` focuses the Copy last skip target text control, or the skip-link row or catalog heading if that control is missing. That key moves focus; it does not open a workbench. It does not copy. That key is distinct from `F8`, which focuses Copy first skip target text, from `F4`, which focuses Copy last skip text, from `ArrowUp`, which focuses Copy first skip text, and from `#`, which focuses Copy skip links. Key `F12` focuses the last labelled skip target, or the catalog heading if that target is missing. That key moves focus; it does not open a workbench. It does not copy. That key is distinct from `F9`, which focuses the first skip target, from `F6`, which focuses the last skip target, from `t`, which focuses Trust and limits, from `F2`, which focuses the skip nav, and from `.`, which focuses Skip to catalog versions. Key `Shift+F10` copies the labelled heading of the first skip href that has aria-labelledby from this page as one Markdown line. That copy is catalog copy, not a live product feed. If that labelled text is missing, it copies an empty string. That key is distinct from `F10`, which copies the last skip-target text, from `F7`, which copies the first skip-target text, from `F3`, which copies the last skip-link text, and from `Delete`, which copies the first skip-link text. Key `Shift+F11` focuses the Copy first labelled skip target text control, or the skip-link row or catalog heading if that control is missing. That key moves focus; it does not open a workbench. It does not copy. That key is distinct from `F11`, which focuses Copy last skip target text, from `F8`, which focuses Copy first skip target text, from `F4`, which focuses Copy last skip text, and from `#`, which focuses Copy skip links. Key `Shift+F12` focuses the label of the first labelled skip target, or the catalog heading if that label is missing. That key moves focus; it does not open a workbench. It does not copy. That key is distinct from `F9`, which focuses the first skip target, from `F12`, which focuses the last labelled skip target, from `n`, which focuses What's new, and from `g`, which focuses the first What's new heading. Key `Shift+F7` copies the labelled heading of the last skip href that has aria-labelledby from this page as one Markdown line. That copy is catalog copy, not a live product feed. If that labelled text is missing, it copies an empty string. That key is distinct from `F10`, which copies the last skip-target text, from `Shift+F10`, which copies the first labelled skip-target text, from `F7`, which copies the first skip-target text, and from `F3`, which copies the last skip-link text. Key `Shift+F8` focuses the Copy last labelled skip target text control, or the skip-link row or catalog heading if that control is missing. That key moves focus; it does not open a workbench. It does not copy. That key is distinct from `F11`, which focuses Copy last skip target text, from `Shift+F11`, which focuses Copy first labelled skip target text, from `F8`, which focuses Copy first skip target text, and from `#`, which focuses Copy skip links. Key `Shift+F9` focuses the label of the last labelled skip target, or the catalog heading if that label is missing. That key moves focus; it does not open a workbench. It does not copy. That key is distinct from `F12`, which focuses the last labelled skip target, from `Shift+F12`, which focuses the first labelled skip label, from `F9`, which focuses the first skip target, and from `t`, which focuses Trust and limits. Key `p` prints this catalog page. It is not a live product
sheet. Key `e` copies the catalog heading and lede from this page as Markdown.
That copy is catalog copy, not a live product feed. If those nodes are
missing, it copies an empty string. Keys `v` and `j` copy the printed version list and one-sentence jobs.
Key `,` copies the footer version line from this page as one Markdown line.
That copy is catalog copy, not a live product version.
Key `[` focuses the Copy version line control, or the footer version line if
that control is missing. That key moves focus; it does not open a workbench.
It does not copy.
Key `q` copies those same catalog jobs through the Copy jobs control. It does not fork that Markdown. Key `;` copies the first workbench name and one-sentence job from this page as one Markdown line. That copy is catalog copy, not a live product feed. If that card is missing, it copies an empty string. That key is distinct from `j` and `q`, which copy all four jobs, and from `y`, which copies the last-launched job. Key `}` copies the last workbench name and one-sentence job from this page as one Markdown line. That copy is catalog copy, not a live product feed. If that card is missing, it copies an empty string. That key is distinct from `;`, which copies the first workbench job, and from `j` and `q`, which copy all four jobs. Key `~` copies the last What's new heading from this page as one Markdown line. That copy is catalog copy, not a live product feed. If that heading is missing, it copies an empty string. That key is distinct from `g`, which focuses the first What's new heading, and from `n`, which focuses What's new. Key `!` focuses the Copy last What's new heading control, or the What's new heading if that control is missing. That key moves focus; it does not open a workbench. It does not copy. That key is distinct from `g`, which focuses the first What's new heading, and from `n`, which focuses What's new. Key `(` focuses the Copy first What's new heading control, or the What's new heading if that control is missing. That key moves focus; it does not open a workbench. It does not copy. That key is distinct from `g`, which focuses the first What's new heading itself, and from `~`, which copies the last What's new heading. Key `)` copies the first What's new heading from this page as one Markdown line. That copy is catalog copy, not a live product feed. If that heading is missing, it copies an empty string. That key is distinct from `~`, which copies the last What's new heading, from `g`, which focuses the first What's new heading, and from `(`, which focuses Copy first What's new heading. Key `*` copies the first workbench heading from this page as one Markdown line. That copy is catalog copy, not a live product feed. If that heading is missing, it copies an empty string. That key is distinct from `~`, which copies the last What's new heading, from `)`, which copies the first What's new heading, from `e`, which copies the catalog heading and lede, and from `j`, which copies catalog jobs. Key `&` focuses the Copy first workbench heading control, or the workbenches heading if that control is missing. That key moves focus; it does not open a workbench. It does not copy. That key is distinct from `*`, which copies the first workbench heading, from `e`, which copies the catalog heading and lede, and from `a`, which focuses the first workbench article. Key `%` focuses the Copy first Trust item control, or the Trust and limits heading if that control is missing. That key moves focus; it does not open a workbench. It does not copy. That key is distinct from `:`, which copies the first Trust and limits list item, and from `/`, which focuses the first Trust and limits list item. Key `$` copies the last workbench heading from this page as one Markdown line. That copy is catalog copy, not a live product feed. If that heading is missing, it copies an empty string. That key is distinct from `*`, which copies the first workbench heading, from `}`, which copies the last workbench job, and from `"`, which copies the last Trust and limits list item. Key `^` focuses the Copy last workbench heading control, or the workbenches heading if that control is missing. That key moves focus; it does not open a workbench. It does not copy. That key is distinct from `$`, which copies the last workbench heading, from `*`, which copies the first workbench heading, and from `&`, which focuses Copy first workbench heading. Key `` ` `` focuses the Copy last Trust item control, or the Trust and limits heading if that control is missing. That key moves focus; it does not open a workbench. It does not copy. That key is distinct from `"`, which copies the last Trust and limits list item, from `%`, which focuses Copy first Trust item, and from `:`, which copies the first Trust and limits list item. Key `@` focuses the Copy catalog intro control, or the catalog heading if that control is missing. That key moves focus; it does not open a workbench. It does not copy. That key is distinct from `e`, which copies the catalog heading and lede. Key `#` focuses the Copy skip links control, or the skip-link row or catalog heading if that control is missing. That key moves focus; it does not open a workbench. It does not copy. That key is distinct from `z`, which copies skip-link targets. Key `+` focuses the Copy last job control, or the workbenches heading if that control is missing. That key moves focus; it does not open a workbench. It does not copy. That key is distinct from `s`, which focuses the first Open workbench link, from `]`, which focuses the last Open workbench link, and from `=`, which focuses Copy How it works. Key `|` focuses the Copy first job control, or the workbenches heading if that control is missing. That key moves focus; it does not open a workbench. It does not copy. That key is distinct from `;`, which copies the first workbench job, and from `}`, which copies the last workbench job. Key `:` copies the first Trust and limits list item from this page as one Markdown line. That copy is catalog copy, not a live policy feed. If that item is missing, it copies an empty string. That key is distinct from `i`, which copies the full Trust and limits list, and from `;`, which copies the first workbench job. Key `"` copies the last Trust and limits list item from this page as one Markdown line. That copy is catalog copy, not a live policy feed. If that item is missing, it copies an empty string. That key is distinct from `:`, which copies the first Trust and limits list item, and from `i`, which copies the full Trust and limits list. Key `i` copies Trust and limits from this page as Markdown. That list is not a
live policy feed. Key `u` copies How it works from this page as Markdown. That
list is not a live policy feed. Key `-` copies the first How it works list
item from this page as one Markdown line. That copy is catalog copy, not a
live policy feed. If that item is missing, it copies an empty string. That
key is distinct from `u`, which copies the full How it works list, and from
`d`, which focuses the first How it works list item. Key `<` copies the last
How it works list item from this page as one Markdown line. That copy is
catalog copy, not a live policy feed. If that item is missing, it copies an
empty string. That key is distinct from `-`, which copies the first How it
works list item, and from `u`, which copies the full How it works list. Key `=` focuses the Copy
How it works control, or the How it works heading if that control is missing.
That key moves focus; it does not open a workbench. It does not copy. That
key is distinct from `k`, which focuses How it works, and from `u`, which
copies How it works. Key `>` focuses the Copy last How it works item control,
or the How it works heading if that control is missing. That key moves
focus; it does not open a workbench. It does not copy. That key is distinct
from `=`, which focuses Copy How it works, and from `k`, which focuses How
it works. Key `_` focuses the Copy first How it works item control, or the
How it works heading if that control is missing. That key moves focus; it
does not open a workbench. It does not copy. That key is distinct from `-`,
which copies the first How it works list item, and from `d`, which focuses
the first How it works list item. Keys `l` and `o` focus or open the last-launched workbench stored in this
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
The Smallest Agreement 1.5.9 also names the School disco hours start, below-floor count copy shortcut, and the below-threshold group hide filter.
The Smallest Agreement 1.5.10 also names the Sports day hours start, first below-floor group copy shortcut, and the veto-group hide filter.
The Smallest Agreement 1.5.11 also names the Netball training hours start, threshold-group count copy shortcut, and the non-veto-group hide filter.
The Smallest Agreement 1.5.12 also names the Swimming club hours start, first-veto-group copy shortcut, and the first-veto-group hide filter.
The Smallest Agreement 1.5.13 also names the Athletics club hours start, veto-group count copy shortcut, and the last-veto-group hide filter.
The Smallest Agreement 1.5.14 also names the Cricket club hours start, first-non-veto-group copy shortcut, and the first-non-veto-group hide filter.
The Smallest Agreement 1.5.15 also names the Tennis club hours start, last-veto-group copy shortcut, and the last-non-veto-group hide filter.
The Smallest Agreement 1.5.16 also names the Basketball club hours start, last-non-veto-group copy shortcut, and the last-below-threshold hide filter.
The Smallest Agreement 1.5.17 also names the Volleyball club hours start, last-below-threshold group copy shortcut, and the first-below-threshold hide filter.
The Smallest Agreement 1.5.18 also names the Soccer club hours start, first-below-threshold group copy shortcut, and the last-at-or-above-threshold hide filter.
The Smallest Agreement 1.5.19 also names the Hockey club hours start, last-at-or-above-threshold group copy shortcut, and the first-at-or-above-threshold hide filter. The Smallest Agreement 1.5.20 also names the Rugby club hours start, first-at-or-above-threshold group copy shortcut, and the last-at-floor hide filter. The Smallest Agreement 1.5.21 also names the Softball club hours start, last-at-floor group copy shortcut, and the first-at-floor hide filter. The Smallest Agreement 1.5.22 also names the Lacrosse club hours start, last-below-floor group copy shortcut, and the first-below-floor hide filter. The Smallest Agreement 1.5.23 also names the Water polo club hours start, first-at-floor group copy shortcut, and the last-below-floor hide filter. The Smallest Agreement 1.5.24 also names the Rowing club hours start, last-without-floor group copy shortcut, and the last-without-floor hide filter. The Smallest Agreement 1.5.25 also names the Sailing club hours start, first-without-floor group copy shortcut, and the first-without-floor hide filter. The Smallest Agreement 1.5.26 also names the Canoeing club hours start, without-floor-count group copy shortcut, and the first-without-floor hide jump. The Smallest Agreement 1.5.27 also names the Kayaking club hours start, without-floor-remaining group copy shortcut, and the last-without-floor hide jump. The Smallest Agreement 1.5.28 also names the Dragon boat club hours start, last-without-floor-remaining group copy shortcut, and the first-without-floor hide jump. The Smallest Agreement 1.5.29 also names the Surf club hours start, first-without-floor-remaining group copy shortcut, and the last-without-floor hide jump. The Smallest Agreement 1.5.30 also names the Triathlon club hours start, first-without-floor-cost group copy shortcut, and the first-without-floor hide jump.
Common Cart 1.4.1 also names organizer buyer
CSV, leftover jump, and the community garden start. Common Cart 1.4.2 also names
organizer leftover copy, school fete catering, and overlap Markdown. Common Cart 1.4.3 also names
uncovered leftover counts, the Office fruit box start, and leftover review jumps. Common Cart 1.4.4 also names
leftover headroom copy, the Library photocopy paper start, and uncovered leftover jumps. Common Cart 1.4.5 also names leftover fill copy, the Sports club match-day kit start, and remaining-capacity copy. Common Cart 1.4.6 also names remaining-capacity jump, the Surf club first-aid kit start, and leftover-fill copy jump. Common Cart 1.4.7 also names leftover-fill unit-count copy, the Theatre wardrobe kit start, and leftover print jump. Common Cart 1.4.8 also names leftover-fill unit-count copy shortcut, the Community choir folders start, and the leftover-buyer hide filter. Common Cart 1.4.9 also names uncovered leftover unit-count copy shortcut, the Scout camp kit start, and the remaining-capacity offer hide filter. Common Cart 1.4.10 also names leftover-fill merchant copy shortcut, the School excursion lunch start, and the unserved-buyer hide filter. Common Cart 1.4.11 also names leftover-fill remaining copy shortcut, the Netball canteen start, and the leftover-only-buyer hide filter. Common Cart 1.4.12 also names leftover-fill fulfillment copy shortcut, the Swimming carnival lunch start, and the winner-allocated-buyer hide filter. Common Cart 1.4.13 also names leftover-fill delivery copy shortcut, the Athletics carnival lunch start, and the leftover-fill-buyer hide filter. Common Cart 1.4.14 also names leftover-fill pickup copy shortcut, the Cricket carnival lunch start, and the last leftover-fill-buyer hide filter. Common Cart 1.4.15 also names leftover-fill label copy shortcut, the Tennis carnival lunch start, and the first leftover-fill-buyer hide filter. Common Cart 1.4.16 also names leftover-fill minimum copy shortcut, the Basketball carnival lunch start, and the first tertiary-fill-buyer hide filter. Common Cart 1.4.17 also names leftover-fill maximum copy shortcut, the Volleyball carnival lunch start, and the last tertiary-fill-buyer hide filter. Common Cart 1.4.18 also names tertiary-fill remaining copy shortcut, the Soccer carnival lunch start, and the last-unserved-buyer hide filter. Common Cart 1.4.19 also names tertiary-fill maximum copy shortcut, the Rugby carnival lunch start, and the first-unserved-buyer hide filter. Common Cart 1.4.20 also names leftover uncovered remaining copy shortcut, the Hockey carnival lunch start, and the last leftover-only-buyer hide filter. Common Cart 1.4.21 also names leftover uncovered maximum copy shortcut, the Baseball carnival lunch start, and the first leftover-only-buyer hide filter. Common Cart 1.4.22 also names leftover uncovered minimum copy shortcut, the Softball carnival lunch start, and the last winner-allocated-buyer hide filter. Common Cart 1.4.23 also names leftover uncovered count copy shortcut, the Water polo carnival lunch start, and the first winner-allocated-buyer hide filter. Common Cart 1.4.24 also names leftover uncovered leftover-only count copy shortcut, the Rowing carnival lunch start, and the first uncovered leftover-buyer hide filter. Common Cart 1.4.25 also names leftover uncovered leftover-only remaining copy shortcut, the Sailing carnival lunch start, and the last uncovered leftover-buyer hide filter. Common Cart 1.4.26 also names leftover uncovered leftover-only maximum copy shortcut, the Canoeing carnival lunch start, and the first uncovered leftover-buyer hide jump. Common Cart 1.4.27 also names leftover uncovered leftover-only minimum copy shortcut, the Kayaking carnival lunch start, and the first uncovered leftover-buyer hide jump. Common Cart 1.4.28 also names leftover uncovered leftover-only headroom copy shortcut, the Dragon boat carnival lunch start, and the last uncovered leftover-buyer hide jump. Common Cart 1.4.29 also names leftover uncovered leftover-only allocated copy shortcut, the Surf carnival lunch start, and the first uncovered leftover-buyer hide jump. Common Cart 1.4.30 also names leftover uncovered leftover-only capacity copy shortcut, the Triathlon carnival lunch start, and the last leftover-only-buyer hide jump. Partnership Breakpoint 1.5.1
also names waterfall SVG download, compare and print keys, and the Licensor
and distributor start. Partnership Breakpoint 1.5.2 also names waterfall
Markdown copy, the Talent, agent, and platform start, and the all-hold ledger
filter. Partnership Breakpoint 1.5.3 also names tornado Markdown copy, the
Three-party joint venture start, and the all-hold ledger persist / unbounded
tornado filter. Partnership Breakpoint 1.5.4 also names allocation-balance
Markdown copy, the Podcast host and network start, and the zero-share roster
filter. Partnership Breakpoint 1.5.5 also names capacity-utilization Markdown copy, the Community hall split start, and the over-capacity roster filter. Partnership Breakpoint 1.5.6 also names first-breakpoint participant copy, the Festival stall split start, and the at-hold roster filter. Partnership Breakpoint 1.5.7 also names least-headroom participant copy, the Pop-up cinema split start, and the unbounded-capacity roster filter. Partnership Breakpoint 1.5.8 also names least-headroom copy shortcut, the Community radio split start, and the spare-capacity roster filter. Partnership Breakpoint 1.5.9 also names remaining-to-hold copy shortcut, the School concert split start, and the least-headroom roster filter. Partnership Breakpoint 1.5.10 also names volume-to-hold copy shortcut, the Sports carnival split start, and the within-capacity roster filter. Partnership Breakpoint 1.5.11 also names over-capacity count copy shortcut, the Netball carnival split start, and the first-breakpoint roster filter. Partnership Breakpoint 1.5.12 also names over-capacity label copy shortcut, the Swimming carnival split start, and the first-over-capacity roster filter. Partnership Breakpoint 1.5.13 also names remaining-capacity copy shortcut, the Athletics carnival split start, and the last-over-capacity roster filter. Partnership Breakpoint 1.5.14 also names last-over-capacity copy shortcut, the Cricket carnival split start, and the last-breakpoint roster filter. Partnership Breakpoint 1.5.15 also names last-over-capacity remaining copy shortcut, the Tennis carnival split start, and the last-within-capacity roster filter. Partnership Breakpoint 1.5.16 also names first-within-capacity remaining copy shortcut, the Basketball carnival split start, and the first-within-capacity roster filter. Partnership Breakpoint 1.5.17 also names last-within-capacity remaining copy shortcut, the Volleyball carnival split start, and the last-spare-capacity roster filter. Partnership Breakpoint 1.5.18 also names last-spare-capacity remaining copy shortcut, the Rugby carnival split start, and the first-spare-capacity roster filter. Partnership Breakpoint 1.5.19 also names first-spare-capacity remaining copy shortcut, the Hockey carnival split start, and the last-unbounded-capacity roster filter. Partnership Breakpoint 1.5.20 also names last-unbounded remaining-to-hold copy shortcut, the Baseball carnival split start, and the first-unbounded-capacity roster filter. Partnership Breakpoint 1.5.21 also names first-unbounded remaining-to-hold copy shortcut, the Softball carnival split start, and the last-at-hold roster filter. Partnership Breakpoint 1.5.22 also names last-at-hold remaining-to-hold copy shortcut, the Lacrosse carnival split start, and the first-at-hold roster filter. Partnership Breakpoint 1.5.23 also names first-at-hold remaining-to-hold copy shortcut, the Water polo carnival split start, and the first-zero-share roster filter. Partnership Breakpoint 1.5.24 also names last-zero-share copy shortcut, the Rowing carnival split start, and the last-zero-share roster filter. Partnership Breakpoint 1.5.25 also names first-zero-share copy shortcut, the Sailing carnival split start, and the first-zero-share hide jump. Partnership Breakpoint 1.5.26 also names last-zero-share remaining copy shortcut, the Canoeing carnival split start, and the last-zero-share hide jump. Partnership Breakpoint 1.5.27 also names first-zero-share remaining copy shortcut, the Kayaking carnival split start, and the first-zero-share hide jump. Partnership Breakpoint 1.5.28 also names last-zero-share volume copy shortcut, the Dragon boat carnival split start, and the zero-share hide jump. Partnership Breakpoint 1.5.29 also names first-zero-share volume copy shortcut, the Surf carnival split start, and the last-zero-share hide jump. Partnership Breakpoint 1.5.30 also names last-over-capacity volume copy shortcut, the Triathlon carnival split start, and the first-over-capacity hide jump. Weekend Gap 1.5.1 also names Gantt hour Markdown copy,
Payday Friday burst, and one-row dashboard CSV. Weekend Gap 1.5.2 also names
peak-queue hour copy, Public-holiday Monday, and the single-gate Gantt filter.
Weekend Gap 1.5.3 also names hours-to-clear Markdown copy, Saturday market
burst, and selected Gantt hour persist. Weekend Gap 1.5.4 also names remaining
reserve copy, Sunday stall close, and the weekend-hours Gantt filter. Weekend Gap 1.5.5 also names hours-to-first-settlement Markdown copy, Thin Saturday FX, and the hide-open Gantt filter. Weekend Gap 1.5.6 also names first-settlement jump, Early Monday bank open, and the hide-weekend Gantt filter. Weekend Gap 1.5.7 also names first-settlement copy shortcut, Friday late FX close, and the hide-closed Gantt filter. Weekend Gap 1.5.8 also names hours-to-clear copy shortcut, Monday late issuer open, and the hide-zero-queue Gantt filter. Weekend Gap 1.5.9 also names first-closed-bank copy shortcut, Saturday early FX open, and the hide-bank-closed Gantt filter. Weekend Gap 1.5.10 also names first-closed-issuer copy shortcut, Sunday late bank close, and the hide-issuer-closed Gantt filter. Weekend Gap 1.5.11 also names first-closed-payout copy shortcut, Sunday late payout close, and the hide-payout-closed Gantt filter. Weekend Gap 1.5.12 also names first-closed-FX copy shortcut, Saturday early payout open, and the hide-FX-closed Gantt filter. Weekend Gap 1.5.13 also names first-open-payout copy shortcut, Friday early payout open, and the hide-payout-open Gantt filter. Weekend Gap 1.5.14 also names first-open-FX copy shortcut, Saturday late payout open, and the hide-FX-open Gantt filter. Weekend Gap 1.5.15 also names first-open-bank copy shortcut, Sunday early payout open, and the hide-bank-open Gantt filter. Weekend Gap 1.5.16 also names first-open-issuer copy shortcut, Sunday late issuer close, and the hide-issuer-open Gantt filter. Weekend Gap 1.5.17 also names last-open-issuer copy shortcut, Sunday early issuer open, and the hide-weekend-issuer-open Gantt filter. Weekend Gap 1.5.18 also names last-closed-issuer copy shortcut, Saturday early issuer open, and the hide-weekend-issuer-closed Gantt filter. Weekend Gap 1.5.19 also names last-closed-bank copy shortcut, Friday early issuer open, and the hide-weekend-bank-closed Gantt filter. Weekend Gap 1.5.20 also names last-open-bank copy shortcut, Saturday early bank open, and the hide-weekend-bank-open Gantt filter. Weekend Gap 1.5.21 also names last-open-payout copy shortcut, Friday early bank open, and the hide-weekend-payout-open Gantt filter. Weekend Gap 1.5.22 also names last-open-FX copy shortcut, Saturday late bank open, and the hide-weekend-FX-open Gantt filter. Weekend Gap 1.5.23 also names last-closed-FX copy shortcut, Friday late bank open, and the hide-weekend-payout-closed Gantt filter. Weekend Gap 1.5.24 also names last-closed-payout copy shortcut, Friday late FX open, and the hide-weekend-FX-closed Gantt filter. Weekend Gap 1.5.25 also names last-weekend-FX-closed copy shortcut, Saturday late FX open, and the hide-weekday-FX-closed Gantt filter. Weekend Gap 1.5.26 also names last-weekday-FX-closed copy shortcut, Sunday late FX open, and the hide-weekend-FX-open Gantt filter. Weekend Gap 1.5.27 also names last-weekend-FX-open copy shortcut, Sunday early FX open, and the hide-weekday-FX-open Gantt filter. Weekend Gap 1.5.28 also names last-weekday-FX-open copy shortcut, Monday early FX open, and the hide-weekend-FX-closed Gantt filter. Weekend Gap 1.5.29 also names first-weekday-FX-open copy shortcut, Monday late FX open, and the hide-weekday-FX-closed Gantt filter.
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
The catalog also names last How-it-works copy, last-How jump, and first-How jump.
That What's new entry is hub-only. It does not change workbench versions.
The catalog also names last-job copy, last-job jump, and first-job jump.
That What's new entry is hub-only. It does not change workbench versions.
The catalog also names last What's new copy, last-news jump, and first-news jump.
That What's new entry is hub-only. It does not change workbench versions.
The catalog also names first What's new copy, intro jump, and skip-link jump.
That What's new entry is hub-only. It does not change workbench versions.
The catalog also names first-workbench copy, first-card jump, and first-trust jump.
That What's new entry is hub-only. It does not change workbench versions.
The catalog also names last-workbench copy, last-card jump, and last-trust jump.
That What's new entry is hub-only. It does not change workbench versions.
The catalog also names last-review copy, last-review jump, and last-path jump.
That What's new entry is hub-only. It does not change workbench versions.
The catalog also names first-review copy, first-review jump, and first-path jump.
That What's new entry is hub-only. It does not change workbench versions.
The catalog also names first-open copy, first-open jump, and first-open-link jump.
That What's new entry is hub-only. It does not change workbench versions.
The catalog also names last-open copy, last-open jump, and last-open-link jump.
That What's new entry is hub-only. It does not change workbench versions.
The catalog also names first-skip copy, first-skip jump, and first-skip-link jump.
That What's new entry is hub-only. It does not change workbench versions.
The catalog also names last-skip copy, last-skip jump, and last-skip-link jump.
That What's new entry is hub-only. It does not change workbench versions.
The catalog also names first-skip-text copy, first-skip-text jump, and skip-nav jump.
That What's new entry is hub-only. It does not change workbench versions.
The catalog also names last-skip-text copy, last-skip-text jump, and last-skip-target jump.
That What's new entry is hub-only. It does not change workbench versions.
The catalog also names first-skip-target-text copy, first-skip-target-text jump, and first-skip-target jump.
That What's new entry is hub-only. It does not change workbench versions.
The catalog also names last-skip-target-text copy, last-skip-target-text jump, and last-labelled-skip-target jump.
That What's new entry is hub-only. It does not change workbench versions.
The catalog also names first-labelled-skip-target-text copy, first-labelled-skip-target-text jump, and first-labelled-skip-label jump.
That What's new entry is hub-only. It does not change workbench versions.
The catalog also names last-labelled-skip-target-text copy, last-labelled-skip-target-text jump, and last-labelled-skip-label jump.
That What's new entry is hub-only. It does not change workbench versions.
The catalog also names first-labelled-skip-href copy, first-labelled-skip-href jump, and first-labelled-skip-target jump.
That What's new entry is hub-only. It does not change workbench versions.
The catalog also names last-labelled-skip-href copy, last-labelled-skip-href jump, and last-labelled-skip-target jump.
That What's new entry is hub-only. It does not change workbench versions.
The catalog also names last-labelled-skip-text copy, last-labelled-skip-text jump, and last-labelled-skip-link jump.
That What's new entry is hub-only. It does not change workbench versions.
Copy first labelled skip href copies the href of the first skip link whose target has aria-labelledby
already printed on this page as one Markdown line. If that href is missing, it copies an empty string.
Copy first labelled skip href on
that 404 page copies the same labelled skip-link href without adding a public path.
Key `Shift+F2` copies the href of the first skip href that has aria-labelledby.
Key `Shift+F3` focuses the Copy first labelled skip href control.
Key `Shift+F4` focuses the first labelled skip target.
Copy last labelled skip href copies the href of the last skip link whose target has aria-labelledby
already printed on this page as one Markdown line. If that href is missing, it copies an empty string.
Copy last labelled skip href on
that 404 page copies the same labelled skip-link href without adding a public path.
Key `Shift+F5` copies the href of the last skip href that has aria-labelledby.
Key `Shift+F6` focuses the Copy last labelled skip href control.
Key `Shift+F1` focuses the last labelled skip target.
Copy last labelled skip text copies the text of the last skip link whose target has aria-labelledby
already printed on this page as one Markdown line. If that text is missing, it copies an empty string.
Copy last labelled skip text on
that 404 page copies the same labelled skip-link text without adding a public path.
Key `Shift+Insert` copies the text of the last skip href that has aria-labelledby.
Key `Shift+ArrowDown` focuses the Copy last labelled skip text control.
Key `Shift+ArrowLeft` focuses the last labelled skip link.
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
Press `{` to copy the last review path from this page as one Markdown
line. That key uses the same Copy last review path control, including
the visible text box when the clipboard API is unavailable. If that path is
missing, it copies an empty string. This is catalog copy, not a live product
feed. It is distinct from `$`, which copies the last workbench heading, from
`r`, which focuses the first review path, and from `5`.
Press `5` to focus the Copy last review path control, or the workbenches
heading if that control is missing. That key moves focus; it does not open a
workbench. It does not copy. That key is distinct from `{`, which copies the
last review path, from `r`, which focuses the first review path, and from `6`.
Press `6` to focus the last review path on the last workbench card, or the
workbenches heading if that path is missing. That key moves focus; it does not
open a workbench. It does not copy. That key is distinct from `r`, which focuses
the first review path, and from `5`.
Press `7` to copy the first review path from this page as one Markdown
line. That key uses the same Copy first review path control, including
the visible text box when the clipboard API is unavailable. If that path is
missing, it copies an empty string. This is catalog copy, not a live product
feed. It is distinct from `{`, which copies the last review path, from
`r`, which focuses the first review path, and from `8`.
Press `8` to focus the Copy first review path control, or the workbenches
heading if that control is missing. That key moves focus; it does not open a
workbench. It does not copy. That key is distinct from `7`, which copies the
first review path, from `5`, which focuses Copy last review path, and from `9`.
Press `9` to focus the first review path on the first workbench card, or the
workbenches heading if that path is missing. That key moves focus; it does not
open a workbench. It does not copy. That key is distinct from `6`, which focuses
the last review path, from `r`, which also focuses the first review path, and
from `8`.
Press `0` to copy the first Open workbench href from this page as one Markdown
line. That key uses the same Copy first Open href control, including
the visible text box when the clipboard API is unavailable. If that href is
missing, it copies an empty string. This is catalog copy, not a live product
feed. It is distinct from `\`, which focuses Copy first Open href, from
`s`, which focuses the first Open workbench link, from `]`, which focuses the
last Open workbench link, from `{`, from `7`, and from last-review keys `5` and `6`.
Press `\` to focus the Copy first Open href control, or the catalog heading or
workbenches heading if that control is missing. That key moves focus; it does not
open a workbench. It does not copy. That key is distinct from `0`, which copies
the first Open workbench href, from `s`, which focuses the first Open workbench
link, from `]`, which focuses the last Open workbench link, and from first-review
keys `7`, `8`, and `9`.
Press `Home` to copy the last Open workbench href from this page as one Markdown
line. That key uses the same Copy last Open href control, including
the visible text box when the clipboard API is unavailable. If that href is
missing, it copies an empty string. This is catalog copy, not a live product
feed. It is distinct from `0`, which copies the first Open workbench href, from
`End`, which focuses Copy last Open href, from `s`, which focuses the first Open
workbench link, from `]`, which focuses the last Open workbench link, from `{`,
from `7`, and from last-review keys `5` and `6`.
Press `End` to focus the Copy last Open href control, or the catalog heading or
workbenches heading if that control is missing. That key moves focus; it does not
open a workbench. It does not copy. That key is distinct from `Home`, which copies
the last Open workbench href, from `0`, which copies the first Open workbench
href, from `s`, which focuses the first Open workbench link, from `]`, which
focuses the last Open workbench link, and from first-review keys `7`, `8`, and `9`.
Press `PageUp` to copy the first skip-link href from this page as one Markdown
line. That key uses the same Copy first skip href control, including
the visible text box when the clipboard API is unavailable. If that href is
missing, it copies an empty string. This is catalog copy, not a live product
feed. It is distinct from `z`, which copies every skip-link target, from
`PageDown`, which focuses Copy first skip href, from `ArrowRight`, which focuses
the first skip link, from `Home`, which copies the last Open workbench href, and
from `0`, which copies the first Open workbench href.
Press `PageDown` to focus the Copy first skip href control, or the skip-link row
or catalog heading if that control is missing. That key moves focus; it does not
open a workbench. It does not copy. That key is distinct from `PageUp`, which copies
the first skip-link href, from `z`, which copies skip-link targets, from `#`, which
focuses Copy skip links, from `ArrowRight`, which focuses the first skip link, and
from first-open keys `0`, `\`, and `s`.
Press `ArrowRight` to focus the first skip link, or the skip-link row or catalog
heading if none. That key moves focus; it does not open a workbench. It does not
copy. That key is distinct from `PageUp`, which copies the first skip-link href,
from `PageDown`, which focuses Copy first skip href, from `z`, which copies
skip-link targets, from `#`, which focuses Copy skip links, from `.`, which
focuses Skip to catalog versions, and from `n`, which focuses What's new.
Press `Insert` to copy the last skip-link href from this page as one Markdown
line. That key uses the same Copy last skip href control, including
the visible text box when the clipboard API is unavailable. If that href is
missing, it copies an empty string. This is catalog copy, not a live product
feed. It is distinct from `PageUp`, which copies the first skip-link href, from
`z`, which copies every skip-link target, from `ArrowDown`, which focuses
Copy last skip href, from `ArrowLeft`, which focuses the last skip link, from
`Home`, which copies the last Open workbench href, and from `0`, which copies
the first Open workbench href.
Press `ArrowDown` to focus the Copy last skip href control, or the skip-link row
or catalog heading if that control is missing. That key moves focus; it does not
open a workbench. It does not copy. That key is distinct from `Insert`, which copies
the last skip-link href, from `PageDown`, which focuses Copy first skip href, from
`z`, which copies skip-link targets, from `#`, which focuses Copy skip links, from
`ArrowLeft`, which focuses the last skip link, and from `End`, which focuses Copy
last Open href.
Press `ArrowLeft` to focus the last skip link, or the skip-link row or catalog
heading if none. That key moves focus; it does not open a workbench. It does not
copy. That key is distinct from `Insert`, which copies the last skip-link href,
from `ArrowDown`, which focuses Copy last skip href, from `ArrowRight`, which
focuses the first skip link, from `z`, which copies skip-link targets, from `#`,
which focuses Copy skip links, from `.`, which focuses Skip to catalog versions,
and from `n`, which focuses What's new.
Press `Delete` to copy the first skip-link text from this page as one Markdown
line. That key uses the same Copy first skip text control, including
the visible text box when the clipboard API is unavailable. If that text is
missing, it copies an empty string. This is catalog copy, not a live product
feed. It is distinct from `PageUp`, which copies the first skip-link href, from
`Insert`, which copies the last skip-link href, from `z`, which copies every
skip-link target, from `Home`, which copies the last Open workbench href, and
from `0`, which copies the first Open workbench href.
Press `ArrowUp` to focus the Copy first skip text control, or the skip-link row
or catalog heading if that control is missing. That key moves focus; it does not
open a workbench. It does not copy. That key is distinct from `PageDown`, which
focuses Copy first skip href, from `ArrowDown`, which focuses Copy last skip href, from
`#`, which focuses Copy skip links, and from `End`, which focuses Copy last Open href.
Press `F2` to focus the skip nav, or the catalog heading if that nav is missing.
That key moves focus; it does not open a workbench. It does not copy. That key
is distinct from `ArrowRight`, which focuses the first skip link, from `ArrowLeft`,
which focuses the last skip link, from `.`, which focuses Skip to catalog versions,
and from `n`, which focuses What's new.
Press `F3` to copy the last skip-link text from this page as one Markdown
line. That key uses the same Copy last skip text control, including
the visible text box when the clipboard API is unavailable. If that text is
missing, it copies an empty string. This is catalog copy, not a live product
feed. It is distinct from `Delete`, which copies the first skip-link text, from
`Insert`, which copies the last skip-link href, from `PageUp`, which copies the
first skip-link href, from `Home`, which copies the last Open workbench href, and
from `0`, which copies the first Open workbench href.
Press `F4` to focus the Copy last skip text control, or the skip-link row
or catalog heading if that control is missing. That key moves focus; it does not
open a workbench. It does not copy. That key is distinct from `ArrowUp`, which
focuses Copy first skip text, from `ArrowDown`, which focuses Copy last skip href, from
`#`, which focuses Copy skip links, and from `End`, which focuses Copy last Open href.
Press `F6` to focus the last skip target, or the catalog heading if that target is missing.
That key moves focus; it does not open a workbench. It does not copy. That key
is distinct from `ArrowLeft`, which focuses the last skip link, from `F2`,
which focuses the skip nav, from `.`, which focuses Skip to catalog versions,
and from `n`, which focuses What's new.
Press `F7` to copy the labelled heading of the first skip href from this page as one Markdown
line. That key uses the same Copy first skip target text control, including
the visible text box when the clipboard API is unavailable. If that labelled text is
missing, it copies an empty string. This is catalog copy, not a live product
feed. It is distinct from `Delete`, which copies the first skip-link text, from
`F3`, which copies the last skip-link text, from `PageUp`, which copies the
first skip-link href, from `)`, which copies the first What's new heading, and
from `0`, which copies the first Open workbench href.
Press `F8` to focus the Copy first skip target text control, or the skip-link row
or catalog heading if that control is missing. That key moves focus; it does not
open a workbench. It does not copy. That key is distinct from `F4`, which
focuses Copy last skip text, from `ArrowUp`, which focuses Copy first skip text, from
`ArrowDown`, which focuses Copy last skip href, and from `#`, which focuses Copy skip links.
Press `F9` to focus the first skip target, or the catalog heading if that target is missing.
That key moves focus; it does not open a workbench. It does not copy. That key
is distinct from `n`, which focuses What's new, from `g`, which focuses the first What's new heading, from `F6`,
which focuses the last skip target, from `F2`, which focuses the skip nav, from `.`, which focuses Skip to catalog versions.
Press `F10` to copy the labelled heading of the last skip href that has one from this page as one Markdown
line. That key uses the same Copy last skip target text control, including
the visible text box when the clipboard API is unavailable. If that labelled text is
missing, it copies an empty string. This is catalog copy, not a live product
feed. It is distinct from `F7`, which copies the first skip-target text, from
`F3`, which copies the last skip-link text, from `Delete`, which copies the
first skip-link text, from `Insert`, which copies the last skip-link href, and
from `"`, which copies the last Trust item.
Press `F11` to focus the Copy last skip target text control, or the skip-link row
or catalog heading if that control is missing. That key moves focus; it does not
open a workbench. It does not copy. That key is distinct from `F8`, which
focuses Copy first skip target text, from `F4`, which focuses Copy last skip text, from
`ArrowUp`, which focuses Copy first skip text, and from `#`, which focuses Copy skip links.
Press `F12` to focus the last labelled skip target, or the catalog heading if that target is missing.
That key moves focus; it does not open a workbench. It does not copy. That key
is distinct from `F9`, which focuses the first skip target, from `F6`, which focuses the last skip target, from `t`,
which focuses Trust and limits, from `F2`, which focuses the skip nav, from `.`, which focuses Skip to catalog versions.
Press `Shift+F10` to copy the labelled heading of the first skip href that has aria-labelledby from this page as one Markdown
line. That key uses the same Copy first labelled skip target text control, including
the visible text box when the clipboard API is unavailable. If that labelled text is
missing, it copies an empty string. This is catalog copy, not a live product
feed. It is distinct from `F10`, which copies the last skip-target text, from
`F7`, which copies the first skip-target text, from `F3`, which copies the last skip-link text, and from
`Delete`, which copies the first skip-link text.
Press `Shift+F11` to focus the Copy first labelled skip target text control, or the skip-link row
or catalog heading if that control is missing. That key moves focus; it does not
open a workbench. It does not copy. That key is distinct from `F11`, which
focuses Copy last skip target text, from `F8`, which focuses Copy first skip target text, from
`F4`, which focuses Copy last skip text, and from `#`, which focuses Copy skip links.
Press `Shift+F12` to focus the first labelled skip label, or the catalog heading if that label is missing.
That key moves focus; it does not open a workbench. It does not copy. That key
is distinct from `F9`, which focuses the first skip target, from `F12`, which focuses the last labelled skip target, from `n`,
which focuses What's new, from `g`, which focuses the first What's new heading.
Press `Shift+F7` to copy the labelled heading of the last skip href that has aria-labelledby from this page as one Markdown
line. That key uses the same Copy last labelled skip target text control, including
the visible text box when the clipboard API is unavailable. If that labelled text is
missing, it copies an empty string. This is catalog copy, not a live product
feed. It is distinct from `F10`, which copies the last skip-target text, from
`Shift+F10`, which copies the first labelled skip-target text, from `F7`, which copies the first skip-target text, and from
`F3`, which copies the last skip-link text.
Press `Shift+F8` to focus the Copy last labelled skip target text control, or the skip-link row
or catalog heading if that control is missing. That key moves focus; it does not
open a workbench. It does not copy. That key is distinct from `F11`, which
focuses Copy last skip target text, from `Shift+F11`, which focuses Copy first labelled skip target text, from
`F8`, which focuses Copy first skip target text, and from `#`, which focuses Copy skip links.
Press `Shift+F9` to focus the last labelled skip label, or the catalog heading if that label is missing.
That key moves focus; it does not open a workbench. It does not copy. That key
is distinct from `F12`, which focuses the last labelled skip target, from `Shift+F12`, which focuses the first labelled skip label, from `F9`,
which focuses the first skip target, from `t`, which focuses Trust and limits.
Press `Shift+F2` to copy the href of the first skip link whose target has aria-labelledby from this page as one Markdown
line. That key uses the same Copy first labelled skip href control, including
the visible text box when the clipboard API is unavailable. If that href is
missing, it copies an empty string. This is catalog copy, not a live product
feed. It is distinct from `PageUp`, which copies the first skip-link href, from
`Insert`, which copies the last skip-link href, from `Shift+F10`, which copies the first labelled skip-target text, and from
`Shift+F7`, which copies the last labelled skip-target text.
Press `Shift+F3` to focus the Copy first labelled skip href control, or the skip-link row
or catalog heading if that control is missing. That key moves focus; it does not
open a workbench. It does not copy. That key is distinct from `PageDown`, which
focuses Copy first skip href, from `Shift+F8`, which focuses Copy last labelled skip target text, from
`Shift+F11`, which focuses Copy first labelled skip target text, and from `#`, which focuses Copy skip links.
Press `Shift+F4` to focus the first labelled skip target, or the catalog heading if that target is missing.
That key moves focus; it does not open a workbench. It does not copy. That key
is distinct from `F9`, which focuses the first skip target, from `Shift+F12`, which focuses the first labelled skip label, from `F12`,
which focuses the last labelled skip target, from `n`, which focuses What's new.
Press `Shift+F5` to copy the href of the last skip link whose target has aria-labelledby from this page as one Markdown
line. That key uses the same Copy last labelled skip href control, including
the visible text box when the clipboard API is unavailable. If that href is
missing, it copies an empty string. This is catalog copy, not a live product
feed. It is distinct from `Insert`, which copies the last skip-link href, from
`Shift+F2`, which copies the first labelled skip href, from `Shift+F7`, which copies the last labelled skip-target text, and from
`PageUp`, which copies the first skip-link href.
Press `Shift+F6` to focus the Copy last labelled skip href control, or the skip-link row
or catalog heading if that control is missing. That key moves focus; it does not
open a workbench. It does not copy. That key is distinct from `F6`, which
focuses the last skip target, from `Shift+F3`, which focuses Copy first labelled skip href, from
`Shift+F8`, which focuses Copy last labelled skip target text, and from `#`, which focuses Copy skip links.
Press `Shift+F1` to focus the last labelled skip target, or the catalog heading if that target is missing.
That key moves focus; it does not open a workbench. It does not copy. That key
is distinct from `F12`, which also focuses the last labelled skip target, from `Shift+F4`, which focuses the first labelled skip target, from `F9`,
which focuses the first skip target, from `t`, which focuses Trust and limits.
Press `Shift+Insert` to copy the text of the last skip link whose target has aria-labelledby from this page as one Markdown
line. That key uses the same Copy last labelled skip text control, including
the visible text box when the clipboard API is unavailable. If that text is
missing, it copies an empty string. This is catalog copy, not a live product
feed. It is distinct from `Insert`, which copies the last skip-link href, from
`F3`, which copies the last skip-link text, from `Shift+F5`, which copies the last labelled skip href, and from
`Shift+F7`, which copies the last labelled skip-target text.
Press `Shift+ArrowDown` to focus the Copy last labelled skip text control, or the skip-link row
or catalog heading if that control is missing. That key moves focus; it does not
open a workbench. It does not copy. That key is distinct from `ArrowDown`, which
focuses Copy last skip href, from `Shift+F6`, which focuses Copy last labelled skip href, from
`F4`, which focuses Copy last skip text, and from `#`, which focuses Copy skip links.
Press `Shift+ArrowLeft` to focus the last labelled skip link, or the skip-link row or catalog heading if that link is missing.
That key moves focus; it does not open a workbench. It does not copy. That key
is distinct from `ArrowLeft`, which focuses the last skip link, from `Shift+F1`, which focuses the last labelled skip target, from `Shift+F9`,
which focuses the last labelled skip label, from `t`, which focuses Trust and limits.
Press `f` to focus the footer version line. That key does
not open a workbench. Press `p` to print this catalog. That key prints this
page in the browser. It is not a live product sheet. Press `c` to copy the catalog address
when this page is served over http. On a file URL that key does not claim a
copy succeeded. Press `e` to copy the catalog heading and lede from this page.
That key uses the same Copy catalog intro control, including the visible text
box when the clipboard API is unavailable. If those nodes are missing, it
copies an empty string. This is catalog copy, not a live product feed.
Press `@` to focus the Copy catalog intro control, or the catalog heading if
that control is missing. That key moves focus; it does not open a workbench.
It does not copy. That key is distinct from `e`, which copies the catalog
heading and lede.
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
line. It does not fetch a policy file or add another public path. Copy last How it works item on
that 404 page copies the printed last How it works list item as one Markdown
line. It does not fetch a policy file or add another public path. Copy last job on
that 404 page copies the printed last workbench job as one Markdown line. It does not
fetch a product feed or add another public path. Copy last What's new heading on
that 404 page copies the printed last What's new heading as one Markdown line. It does not
fetch a product feed or add another public path. Copy first What's new heading on
that 404 page copies the printed first What's new heading as one Markdown line. It does not
fetch a product feed or add another public path. Copy first workbench heading on
that 404 page copies the printed first workbench heading as one Markdown line. It does not
fetch a product feed or add another public path. Copy last workbench heading on
that 404 page copies the printed last workbench heading as one Markdown line. It does not
fetch a product feed or add another public path. Copy last review path on
that 404 page copies the printed last review path as one Markdown line. It does not
fetch a product feed or add another public path. Copy first review path on
that 404 page copies the printed first review path as one Markdown line. It does not
fetch a product feed or add another public path. Copy first Open href on
that 404 page copies the printed first Open workbench href as one Markdown line. It does not
fetch a product feed or add another public path. Copy last Open href on
that 404 page copies the printed last Open workbench href as one Markdown line. It does not
fetch a product feed or add another public path. Copy first skip href on
that 404 page copies the printed first skip-link href as one Markdown line. It does not
fetch a product feed or add another public path. Copy last skip href on
that 404 page copies the printed last skip-link href as one Markdown line. It does not
fetch a product feed or add another public path. Copy first skip text on
that 404 page copies the printed first skip-link text as one Markdown line. It does not
fetch a product feed or add another public path. Copy last skip text on
that 404 page copies the printed last skip-link text as one Markdown line. It does not
fetch a product feed or add another public path. Copy first skip target text on
that 404 page copies the printed first skip-target text as one Markdown line. It does not
fetch a product feed or add another public path. Copy last skip target text on
that 404 page copies the printed last skip-target text as one Markdown line. It does not
fetch a product feed or add another public path. Copy first labelled skip target text on
that 404 page copies the printed first labelled skip-target text as one Markdown line. It does not
fetch a product feed or add another public path. When the catalog is served over http,
Copy first labelled skip target text on
that 404 page copies the printed first labelled skip-target text as one Markdown line. It does not
fetch a product feed or add another public path. Copy last labelled skip target text on
that 404 page copies the printed last labelled skip-target text as one Markdown line. It does not
fetch a product feed or add another public path. Copy first labelled skip href on
that 404 page copies the printed first labelled skip-link href as one Markdown line. It does not
fetch a product feed or add another public path. Copy last labelled skip href on
that 404 page copies the printed last labelled skip-link href as one Markdown line. It does not
fetch a product feed or add another public path. Copy last labelled skip text on
that 404 page copies the printed last labelled skip-link text as one Markdown line. It does not
fetch a product feed or add another public path. When the catalog is served over http,
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
Copy last job copies the last workbench name and one-sentence job from the
catalog cards as one Markdown line, with the same clipboard and visible text
box fallback. If that card is missing, it copies an empty string. That copy is
catalog copy, not a live product feed. It is distinct from Copy first job, which
copies the first card, and from Copy jobs, which copies all four jobs.
Copy last What's new heading copies the last What's new heading from this
catalog page as one Markdown line, with the same clipboard and visible text
box fallback. If that heading is missing, it copies an empty string. That copy is
catalog copy, not a live product feed. It is distinct from Copy last job, which
copies the last workbench job, and from Copy last How it works item.
Copy first What's new heading copies the first What's new heading from this
catalog page as one Markdown line, with the same clipboard and visible text
box fallback. If that heading is missing, it copies an empty string. That copy is
catalog copy, not a live product feed. It is distinct from Copy last What's new
heading, which copies the last heading, and from key `g`, which focuses the
first heading itself.
Copy first workbench heading copies the first workbench card heading from this
catalog page as one Markdown line, with the same clipboard and visible text
box fallback. If that heading is missing, it copies an empty string. That copy is
catalog copy, not a live product feed. It is distinct from Copy first What's new
heading, which copies the first What's new heading, and from Copy first job,
which copies the first workbench name and job.
Copy last workbench heading copies the last workbench card heading from this
catalog page as one Markdown line, with the same clipboard and visible text
box fallback. If that heading is missing, it copies an empty string. That copy is
catalog copy, not a live product feed. It is distinct from Copy first workbench
heading, which copies the first workbench heading, and from Copy last job,
which copies the last workbench name and job.
Copy last review path copies the last workbench card review path from this
catalog page as one Markdown line, with the same clipboard and visible text
box fallback. If that path is missing, it copies an empty string. That copy is
catalog copy, not a live product feed. It is distinct from Copy last workbench
heading, which copies the last workbench heading, and from key `r`, which
focuses the first review path.
Copy first review path copies the first workbench card review path from this
catalog page as one Markdown line, with the same clipboard and visible text
box fallback. If that path is missing, it copies an empty string. That copy is
catalog copy, not a live product feed. It is distinct from Copy last review
path, which copies the last review path, and from key `r`, which
focuses the first review path.
Copy first Open href copies the first Open workbench href from this
catalog page as one Markdown line, with the same clipboard and visible text
box fallback. If that href is missing, it copies an empty string. That copy is
catalog copy, not a live product feed. It is distinct from Copy first review
path, which copies the first review path, and from key `s`, which
focuses the first Open workbench link.
Copy last Open href copies the last Open workbench href from this
catalog page as one Markdown line, with the same clipboard and visible text
box fallback. If that href is missing, it copies an empty string. That copy is
catalog copy, not a live product feed. It is distinct from Copy first Open
href, which copies the first Open workbench href, and from key `]`, which
focuses the last Open workbench link.
Copy first skip href copies the first skip-link href from this
catalog page as one Markdown line, with the same clipboard and visible text
box fallback. If that href is missing, it copies an empty string. That copy is
catalog copy, not a live product feed. It is distinct from Copy skip links,
which copies every skip-link target, and from Copy first Open href, which
copies the first Open workbench href.
Copy last skip href copies the last skip-link href from this
catalog page as one Markdown line, with the same clipboard and visible text
box fallback. If that href is missing, it copies an empty string. That copy is
catalog copy, not a live product feed. It is distinct from Copy first skip href,
which copies the first skip-link href, from Copy skip links, which copies every
skip-link target, and from Copy last Open href, which copies the last Open
workbench href.
Copy first skip text copies the first skip-link text from this
catalog page as one Markdown line, with the same clipboard and visible text
box fallback. If that text is missing, it copies an empty string. That copy is
catalog copy, not a live product feed. It is distinct from Copy first skip href,
which copies the first skip-link href, from Copy last skip href, which copies
the last skip-link href, from Copy skip links, which copies every skip-link
target, from Copy last Open href, which copies the last Open workbench href, and
from Copy first Open href, which copies the first Open workbench href.
Copy last skip text copies the last skip-link text from this
catalog page as one Markdown line, with the same clipboard and visible text
box fallback. If that text is missing, it copies an empty string. That copy is
catalog copy, not a live product feed. It is distinct from Copy first skip text,
which copies the first skip-link text, from Copy last skip href, which copies
the last skip-link href, from Copy first skip href, which copies the first
skip-link href, from Copy skip links, which copies every skip-link
target, from Copy last Open href, which copies the last Open workbench href, and
from Copy first Open href, which copies the first Open workbench href.
Copy first skip target text copies the labelled heading of the first skip href from this
catalog page as one Markdown line, with the same clipboard and visible text
box fallback. If that labelled text is missing, it copies an empty string. That copy is
catalog copy, not a live product feed. It is distinct from Copy first skip text,
which copies the first skip-link text, from Copy last skip text, which copies
the last skip-link text, from Copy first skip href, which copies the first
skip-link href, from Copy first What's new heading, which copies the first What's new h3, and
from Copy skip links, which copies every skip-link target.
Copy last skip target text copies the labelled heading of the last skip href that has one from this
catalog page as one Markdown line, with the same clipboard and visible text
box fallback. If that labelled text is missing, it copies an empty string. That copy is
catalog copy, not a live product feed. It is distinct from Copy first skip target text,
which copies the first skip-target labelled heading, from Copy last skip text, which copies
the last skip-link text, from Copy last Trust item, which copies the last Trust and limits list item, and
from Copy skip links, which copies every skip-link target.
Copy first labelled skip target text copies the labelled heading of the first skip href that has aria-labelledby from this
catalog page as one Markdown line, with the same clipboard and visible text
box fallback. If that labelled text is missing, it copies an empty string. That copy is
catalog copy, not a live product feed. It is distinct from Copy first skip target text,
which copies the first skip-target labelled heading, from Copy last skip target text, which copies
the last skip-target labelled heading, from Copy last skip text, which copies the last skip-link text, and
from Copy skip links, which copies every skip-link target.
Copy first labelled skip target text copies the labelled heading of the first skip href that has aria-labelledby from this
catalog page as one Markdown line, with the same clipboard and visible text
box fallback. If that labelled text is missing, it copies an empty string. That copy is
catalog copy, not a live product feed. It is distinct from Copy first skip target text,
which copies the first skip-target labelled heading, from Copy last skip target text, which copies
the last skip-target labelled heading, from Copy last skip text, which copies the last skip-link text, and
from Copy skip links, which copies every skip-link target.
Copy last labelled skip target text copies the labelled heading of the last skip href that has aria-labelledby from this
catalog page as one Markdown line, with the same clipboard and visible text
box fallback. If that labelled text is missing, it copies an empty string. That copy is
catalog copy, not a live product feed. It is distinct from Copy first labelled skip target text,
which copies the first labelled skip-target labelled heading, from Copy last skip target text, which copies
the last skip-target labelled heading, from Copy first skip target text, which copies the first skip-target labelled heading, and
from Copy skip links, which copies every skip-link target.
Press `j` to copy catalog jobs through that same control.
Press `q` to copy catalog jobs through that same Copy jobs control. It does not fork that Markdown.
Press `;` to copy the first workbench name and one-sentence job from this page
as one Markdown line. That key uses the same Copy first job control, including
the visible text box when the clipboard API is unavailable. If that card is
missing, it copies an empty string. This is catalog copy, not a live product
feed. It is distinct from `j` and `q`, which copy all four jobs, and from `y`.
Press `}` to copy the last workbench name and one-sentence job from this page
as one Markdown line. That key uses the same Copy last job control, including
the visible text box when the clipboard API is unavailable. If that card is
missing, it copies an empty string. This is catalog copy, not a live product
feed. It is distinct from `;`, which copies the first workbench job, and from
`j` and `q`, which copy all four jobs.
Press `~` to copy the last What's new heading from this page as one Markdown
line. That key uses the same Copy last What's new heading control, including
the visible text box when the clipboard API is unavailable. If that heading is
missing, it copies an empty string. This is catalog copy, not a live product
feed. It is distinct from `g`, which focuses the first What's new heading, and
from `n`, which focuses What's new.
Press `!` to focus the Copy last What's new heading control, or the What's new
heading if that control is missing. That key moves focus; it does not open a
workbench. It does not copy. That key is distinct from `g`, which focuses the
first What's new heading, and from `n`.
Press `(` to focus the Copy first What's new heading control, or the What's new
heading if that control is missing. That key moves focus; it does not open a
workbench. It does not copy. That key is distinct from `g`, which focuses the
first What's new heading itself, and from `~`.
Press `)` to copy the first What's new heading from this page as one Markdown
line. That key uses the same Copy first What's new heading control, including
the visible text box when the clipboard API is unavailable. If that heading is
missing, it copies an empty string. This is catalog copy, not a live product
feed. It is distinct from `~`, which copies the last What's new heading, from
`g`, which focuses the first What's new heading, and from `(`.
Press `*` to copy the first workbench heading from this page as one Markdown
line. That key uses the same Copy first workbench heading control, including
the visible text box when the clipboard API is unavailable. If that heading is
missing, it copies an empty string. This is catalog copy, not a live product
feed. It is distinct from `~`, which copies the last What's new heading, from
`)`, which copies the first What's new heading, from `e`, and from `j`.
Press `&` to focus the Copy first workbench heading control, or the workbenches
heading if that control is missing. That key moves focus; it does not open a
workbench. It does not copy. That key is distinct from `*`, which copies the
first workbench heading, from `e`, which copies the catalog heading and lede,
and from `a`.
Press `%` to focus the Copy first Trust item control, or the Trust and limits
heading if that control is missing. That key moves focus; it does not open a
workbench. It does not copy. That key is distinct from `:`, which copies the
first Trust and limits list item, and from `/`.
Press `$` to copy the last workbench heading from this page as one Markdown
line. That key uses the same Copy last workbench heading control, including
the visible text box when the clipboard API is unavailable. If that heading is
missing, it copies an empty string. This is catalog copy, not a live product
feed. It is distinct from `*`, which copies the first workbench heading, from
`}`, which copies the last workbench job, and from `"`.
Press `^` to focus the Copy last workbench heading control, or the workbenches
heading if that control is missing. That key moves focus; it does not open a
workbench. It does not copy. That key is distinct from `$`, which copies the
last workbench heading, from `*`, which copies the first workbench heading,
and from `&`.
Press `` ` `` to focus the Copy last Trust item control, or the Trust and limits
heading if that control is missing. That key moves focus; it does not open a
workbench. It does not copy. That key is distinct from `"`, which copies the
last Trust and limits list item, from `%`, which focuses Copy first Trust item,
and from `:`.
Press `+` to focus the Copy last job control, or the workbenches heading if
that control is missing. That key moves focus; it does not open a workbench.
It does not copy. That key is distinct from `s`, which focuses the first Open
workbench link, from `]`, which focuses the last Open workbench link, and from
`=`.
Press `|` to focus the Copy first job control, or the workbenches heading if
that control is missing. That key moves focus; it does not open a workbench.
It does not copy. That key is distinct from `;`, which copies the first
workbench job, and from `}`.
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
Press `<` to copy the last How it works list item from this page as one
Markdown line. That key uses the same Copy last How it works item control,
including the visible text box when the clipboard API is unavailable. If
that item is missing, it copies an empty string. This is catalog copy, not a
live policy feed. It is distinct from `-`, which copies the first How it
works list item, and from `u`.
Press `=` to focus the Copy How it works control, or the How it works heading
if that control is missing. That key moves focus; it does not open a
workbench. It does not copy. That key is distinct from `k`, which focuses How
it works, and from `u`.
Press `>` to focus the Copy last How it works item control, or the How it
works heading if that control is missing. That key moves focus; it does not
open a workbench. It does not copy. That key is distinct from `=`, which
focuses Copy How it works, and from `k`.
Press `_` to focus the Copy first How it works item control, or the How it
works heading if that control is missing. That key moves focus; it does not
open a workbench. It does not copy. That key is distinct from `-`, which
copies the first How it works list item, and from `d`.
Press `y` to copy the last-launched workbench name and one-sentence job from
this-browser storage. If none is stored, that key copies an empty line. This is
not a cloud recency.
Press `z` to copy skip-link targets from this page. That key uses the same Copy
skip links control, including the visible text box when the clipboard API is
unavailable. This is in-page navigation copy, not a sitemap API.
Press `#` to focus the Copy skip links control, or the skip-link row or catalog
heading if that control is missing. That key moves focus; it does not open a
workbench. It does not copy. That key is distinct from `z`, which copies
skip-link targets.
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
Copy last How it works item copies the last How it works list item already
printed on this catalog page as one Markdown line, with the same clipboard
and visible text box fallback. If that item is missing, it copies an empty
string. That copy is catalog copy, not a live policy feed. It is distinct
from Copy How it works, which copies the full list, and from Copy first How
it works item.

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

Offline file and pipeline commands: [Common Cart](apps/common-cart/CLI.md), [Smallest Agreement](apps/smallest-agreement/ANALYST.md), [Partnership Breakpoint](apps/partnership-breakpoint/CLI.md), and [Weekend Gap](apps/weekend-gap/CLI.md).

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
