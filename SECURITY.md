# Security policy

## Supported version

The latest release on the default branch is supported.

## Reporting a vulnerability

Use GitHub's private vulnerability reporting feature when it is available for this repository. Do not include secrets, personal buyer data, or active exploit details in a public issue.

Include the affected version, reproduction steps, impact, and the smallest safe example that demonstrates the problem.

## Security boundary

Common Cart is a static local simulator. It has no backend, authentication, real merchant connection, payment execution, or analytics. The development server binds to `127.0.0.1` and rejects paths outside the project root.

Scenario JSON is untrusted input. The app validates types, lengths, ranges, collection sizes, and unique identifiers before calculation. User-provided values are inserted into the page as text or input values, not executable HTML.

Browser local storage is convenient, not secret storage. A scenario may contain buyer labels and commercial constraints. Do not enter sensitive personal data. A generated share link contains the full scenario in its URL fragment and should be reviewed before sharing.

## Out of scope

The project does not protect data after a user exports a file or shares a link. It does not provide anonymity guarantees, merchant verification, payment protection, or production marketplace security.
