# Decision Labs

**Four local-first decision workbenches, in one repository.**

Decision Labs is a set of independent, static, browser-based workbenches for
exploring bounded, high-stakes decisions with transparent, deterministic math.
Each workbench is self-contained: its own source, tests, generated single-file
build, and MIT license. Each workbench has its own version and release notes.

Every app:

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

| Workbench | The question it helps you explore |
| --- | --- |
| [Partnership Breakpoint](apps/partnership-breakpoint/) | In a shared revenue split, which participant breaks first, and what is the smallest adverse volume, fee, or cost movement that reaches their exit threshold? |
| [Common Cart](apps/common-cart/) | Before a marketplace has accounts or payments, can pooled buyer constraints unlock better merchant offers without exposing individual buyers? |
| [The Smallest Agreement](apps/smallest-agreement/) | What is the lowest-cost set of clause changes that crosses an approval threshold while respecting support floors, a cost budget, and locked choices? |
| [Weekend Gap](apps/weekend-gap/) | What happens to synthetic AUD stablecoin redemption liquidity from Friday to Monday when the on-chain ledger stays open but issuer, bank, FX, and payout windows do not fully overlap? |

Each app also ships a `MODEL.md` (formulas and conventions), `CONTRIBUTING.md`,
`SECURITY.md`, and its own `LICENSE`.

## Quick start

Download the repository ZIP, extract it, and open [index.html](index.html) to
choose a workbench. The entry page opens each self-contained app without a server.
Export JSON before clearing browser data or moving to a different browser.

For a local browser address, run these commands from the repository root:

```sh
npm start
```

Open the printed address, normally `http://127.0.0.1:4170`. The launcher serves
only the entry page and the four generated workbenches. It accepts local Host
headers, binds loopback only, and does not expose source files or local drafts.
Set `PORT` to an integer from 1 through 65535 to choose another port.

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
|-- index.html                 # Offline workbench selector
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

## Continuous integration

Each app has its own path-filtered GitHub Actions workflow that runs its checks
on pull requests and on pushes to `main`. A repository integration workflow also
runs the root suite and all app checks on every PR and main push. Report repository-wide and component
issues in the [shared issue tracker](https://github.com/EauDoon/decision-labs/issues).

## License

MIT. See [LICENSE](LICENSE) and each app's retained `LICENSE` file.
