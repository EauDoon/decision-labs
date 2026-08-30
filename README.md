# Decision Labs

Decision Labs collects four independent, local-first browser workbenches in one repository. Each app keeps its own source, package manifest, tests, generated `standalone.html`, and MIT license.

| App | Purpose |
|---|---|
| [Partnership Breakpoint](apps/partnership-breakpoint/) | Find participant-level exit thresholds in shared commercial arrangements. |
| [Common Cart](apps/common-cart/) | Match pooled buyer constraints to synthetic merchant offers. |
| [The Smallest Agreement](apps/smallest-agreement/) | Find the lowest-cost structured agreement that crosses an approval threshold. |
| [Weekend Gap](apps/weekend-gap/) | Explore synthetic AUD stablecoin liquidity across a weekend payout gap. |

## Run an app

All four apps require Node.js 20 or newer and have no package dependencies.

```sh
git clone https://github.com/EauDoon/decision-labs.git
cd decision-labs/apps/partnership-breakpoint
npm test
npm run check
```

Replace the final directory with any app name above. Open its `standalone.html` for the no-install browser build. Report repository-wide and component issues in the [shared issue tracker](https://github.com/EauDoon/decision-labs/issues).

## License

MIT. See [LICENSE](LICENSE) and each app's retained `LICENSE` file.
