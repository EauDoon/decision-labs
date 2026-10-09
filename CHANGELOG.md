# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

The catalog version names a release of all four workbenches together. Each
workbench keeps its own version and detailed notes in `apps/<id>/CHANGELOG.md`.

## [Unreleased]

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
