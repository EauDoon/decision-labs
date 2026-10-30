# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

The catalog version names a release of all four workbenches together. Each
workbench keeps its own version and detailed notes in `apps/<id>/CHANGELOG.md`.

## [Unreleased]

### Fixed

- The catalog launcher checks canonical file paths as well as request paths,
  refusing symlinks and directory junctions that redirect a public filename to
  another file. Private drafts and files outside the catalog are not served.
- Missing, unreadable or redirected 404 pages use a safe text fallback rather
  than terminating the request handler or exposing a nonpublic file.
- Consistent native path resolution keeps ordinary public files available when
  Windows exposes the checkout through an equivalent short-name path.
- The Smallest Agreement: importing participant group or clause option CSV
  keeps a leading apostrophe that belongs to a group name, clause title,
  option label or note, such as `'s-Hertogenbosch`. Only an apostrophe that
  escapes a spreadsheet formula prefix is removed, which is the only place
  the exporters add one, so an exported table imports back unchanged.
- `npm run test:browser` reads a relative `PLAYWRIGHT_MODULE` directory from
  the current directory, as it already did for `AXE_MODULE`, instead of from
  `scripts/`, where the documented package directory was not found.
- Common Cart: the exported offer CSV imports back without changing the
  decision. It wrote only six columns, so a re-import reset every minimum to
  1 and every delivery to 7 days, dropped all quantity price tiers and
  renumbered offers by row; the winner changed on 56 of the 60 examples. The
  export now adds `category`, `minimum`, `delivery`, `tiers` and `id` after
  the original six columns. A tiers cell lists `minimum@unit price` pairs
  separated by semicolons (`10@24; 18@20`), and a malformed pair names the
  CSV offer and tier. A non-blank id is kept and must be unique; a blank id
  takes the first unused `O` number. Six-column files and the template import
  exactly as before, and the CLI `import --kind offers` reads the new columns.

## [1.0.0] - 2026-10-09

The first versioned catalog release. It ships Partnership Breakpoint 1.9.0,
Common Cart 1.8.0, The Smallest Agreement 1.7.0 and Weekend Gap 1.9.0.

### Added

- Release workflow: pushing a `vX.Y.Z` tag verifies that the tag, every
  package version, every changelog, the catalog pages and the standalone
  stamps agree, runs the catalog tests and `npm run check`, then publishes a
  GitHub release with this changelog section as its notes and the four
  standalone pages attached as `<app>-<version>.html`. A manual run on `main`
  is a dry run that never publishes.
- `scripts/versions.mjs`, with `npm run versions:sync` and
  `npm run versions:check`: one implementation that writes the catalog
  version list, cards and footer, the 404 page line and the README table from
  the app packages, and verifies them together with every app changelog (one
  title, unique entries in descending SemVer order, the package version on
  top), this changelog and each standalone stamp. `npm run check` runs it. It
  also verifies a release tag, extracts release notes and packages the
  release files.
- `--version` in all four analyst CLIs, and a generator meta tag naming the
  workbench and its version in every standalone page.
- Browser acceptance in CI: the 18 workbench journeys, a catalog journey
  through the loopback launcher, and an axe-core pass that fails on any
  violation on the catalog, the 404 page and the four standalone pages.
- Tests for the WCAG AA text contrast of each workbench's colour tokens, the
  analyst CLI contracts and the worked case study numbers, busy and invalid
  ports for every dev server and launcher, the version contract and the
  release workflow guards.
- Dependabot for the SHA-pinned GitHub Actions, weekly and grouped.
- `.gitattributes`: text is stored and checked out with LF, the Windows
  launchers with CRLF, images are binary and the standalone pages are marked
  generated.
- Catalog test discovery: `npm test` runs every `tests/*.test.mjs`, and the
  hub check covers every script, test and workflow.
- SECURITY.md describing how to report vulnerabilities privately.
- CONTRIBUTING.md outlining the pull request and review process, the local
  checks and the release procedure.
- CHANGELOG.md tracking notable changes per release.
- CODEOWNERS assigning review ownership to the maintainer.

### Changed

- Workbench releases: Partnership Breakpoint 1.9.0, Common Cart 1.8.0,
  The Smallest Agreement 1.7.0 and Weekend Gap 1.9.0.
- CI: the integration workflow runs the catalog on Ubuntu and Windows with
  Node 20 and 24 and every workbench in parallel on Node 24; each app
  workflow covers Ubuntu and Windows on Node 20, 22 and 24 with separate test
  and check steps; superseded pull request runs are cancelled.
- The four workbench changelogs are back in SemVer order with one title
  each, and app tests derive their release assertions from `package.json`
  instead of 53 literal version pins.
- Common Cart's `npm run check` no longer reruns its whole test suite.
- README, CONTRIBUTING and the pull request template describe the commands
  and checks the repository actually has. PROGRESS.md is marked as a
  historical record.

### Fixed

- The Common Cart, The Smallest Agreement and Weekend Gap dev servers report
  a busy port and exit 1 instead of crashing with a stack trace or exiting 0
  silently, Weekend Gap validates `PORT`, and all four launchers exit nonzero
  when their server stops before it is ready.
- WCAG AA text contrast in Partnership Breakpoint, Common Cart and The
  Smallest Agreement, and Weekend Gap's assumptions panel is no longer a
  complementary landmark nested inside `main`.
- CODEOWNERS names a valid owner, so review ownership applies.
- The pull request template no longer pastes issue template front matter
  into every pull request.

### Security

- SECURITY.md sends reporters to GitHub private vulnerability reporting when
  it is enabled, and otherwise to a public contact request with no technical
  detail, instead of a reporting form that is not enabled and an email
  contact that CODEOWNERS does not list.

[Unreleased]: https://github.com/EauDoon/decision-labs/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/EauDoon/decision-labs/releases/tag/v1.0.0
