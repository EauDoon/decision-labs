# Security Policy

## Reporting a Vulnerability

Please do not put the details of a security problem in a public GitHub
issue, pull request or discussion.

When GitHub private vulnerability reporting is enabled for this repository,
use it:

1. Open the repository's Security tab and choose Report a vulnerability
   (https://github.com/EauDoon/decision-labs/security/advisories/new).
2. Provide a clear title and reproduction steps.
3. Wait for a maintainer acknowledgement before any public disclosure.

If the Report a vulnerability button is not shown, private reporting is not
enabled. In that case open a public issue titled "Security contact request"
that contains no technical detail, not even the affected file or feature,
and wait for a maintainer to arrange a private channel before sharing
anything else.

## Scope

This policy covers the contents of this repository only. Issues in third
party dependencies should be reported to the upstream project first.

The optional local servers bind loopback, accept only localhost/loopback Host
headers and GET/HEAD requests, and reject hidden paths and links outside their
serving roots. The catalog serves only its explicit page allowlist. Individual
app servers also serve visible development files inside their own directories;
keep confidential files outside those directories and use standalone HTML when
no server is needed. These servers are not public hosting services.

## Response

Maintainers aim to acknowledge new reports within 7 days and to publish a
fix or mitigation as soon as practical.
