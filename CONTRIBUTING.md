# Contributing

Thanks for your interest in decision-labs. Pull requests are welcome.

## Ground Rules

- Open an issue first for non trivial changes so we can agree on scope.
- Keep diffs small and focused. One concern per pull request.
- Add or update tests for any behavior change.
- Run the full test suite locally and ensure CI is green before requesting review.
- Follow the existing code style. Do not reformat unrelated code.
- Use signed commits if your environment supports it.

## Local Checks

Use Node.js 20 or newer. There is nothing to install. From the repository
root, before pushing:

- `npm test` runs the catalog tests in `tests/` and then every workbench
  suite. Run it through npm, including on Windows: the app runner needs the
  environment npm provides.
- `npm run check` syntax-checks the hub scripts and tests, checks the
  launcher guards and the catalog version list, then runs each app's own
  check, including that `standalone.html` matches its sources.
- Do not run `npm test` and `npm run check` at the same time. The catalog
  boundary test creates temporary `server-boundary-*` folders inside each
  app, and Partnership Breakpoint's check scans every file in its folder.
- `npm run build:standalone` regenerates every app's `standalone.html`.
  Run it after changing an app's `index.html`, `styles.css` or `src/` files
  and commit the result.
- To work on one app, run `npm test` and `npm run check` in `apps/<id>/`.
- `git status` should be clean apart from your change.

Text rules enforced by the checks:

- `scripts/check-hub.mjs` rejects en and em dashes in `index.html`,
  `404.html`, `README.md`, `package.json`, every workflow, and every `.mjs`
  file in `scripts/` and `tests/`.
- `apps/partnership-breakpoint/scripts/check.mjs` rejects em dashes,
  private home directory paths, and private key markers in every file under
  that app.

App changes also need an entry at the top of that app's `CHANGELOG.md` and
a version bump in its `package.json`. The catalog page, the 404 page and the
README table repeat each app's version, and the tests and checks fail until
they match the package.

## Releasing

Each workbench versions itself in `apps/<id>/package.json`; the catalog
version in the root `package.json` names a release of all four together.
`scripts/versions.mjs` keeps every other copy of those numbers in step.

1. Bump each changed app by SemVer in its `package.json` and add its entry
   at the top of its `CHANGELOG.md` (entries stay in descending SemVer
   order).
2. Run `npm run versions:sync` to update the catalog page, the 404 page and
   the README table, then `npm run build:standalone` to restamp the
   standalone pages.
3. Bump the root `package.json` version by the highest app bump level in the
   release (a catalog-only change bumps the catalog alone) and add a
   `## [X.Y.Z] - YYYY-MM-DD` section to the root `CHANGELOG.md`, with its
   link reference.
4. Run `npm test`, `npm run check` and
   `node scripts/versions.mjs check --tag vX.Y.Z`.
5. Merge the pull request with a merge commit once its checks are green.
6. Run the Release workflow on `main` from the Actions tab (or
   `gh workflow run release.yml --ref main`). A manual run is a dry run: it
   verifies the tag, runs the checks, extracts the notes and packages the
   files without publishing.
7. Tag the merge commit and push the tag:
   `git tag -a vX.Y.Z -m "Decision Labs X.Y.Z" <merge commit>` then
   `git push origin vX.Y.Z`. The tag push publishes the GitHub release with
   the root changelog section as its notes and the four standalone pages
   attached as `<app>-<version>.html`.

## Review

A maintainer listed in CODEOWNERS will review your pull request. Address
review comments in new commits rather than force pushing, unless asked.

## Reporting Issues

For security issues see SECURITY.md. For everything else use GitHub issues.