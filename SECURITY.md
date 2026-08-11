# Security policy

## Scope

Partnership Breakpoint is a local static browser application. It has no server-side account system, remote data store, authentication flow, or production service included in this repository.

## Reporting

Do not post a suspected vulnerability in a public issue. Use the repository hosting platform's private vulnerability-reporting feature when it is enabled. Include a minimal reproduction, affected file or behavior, impact, and any suggested mitigation.

Do not include personal data, credentials, access tokens, or private deal information in a report.

## Data handling

The application stores only valid cases in the current browser's local storage and URL hash when the browser permits it. Imported files, shared hashes, participant counts, identifiers, and names have explicit size limits. A hash can be shared with anyone who receives the full URL. Review values before sharing a link or exported JSON.
