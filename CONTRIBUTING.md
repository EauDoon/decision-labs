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

## Review

A maintainer listed in CODEOWNERS will review your pull request. Address
review comments in new commits rather than force pushing, unless asked.

## Reporting Issues

For security issues see SECURITY.md. For everything else use GitHub issues.