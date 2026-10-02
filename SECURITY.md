# Security Policy

## Reporting a Vulnerability

Please do not file public GitHub issues for security problems.

Use GitHub private vulnerability reporting on this repository:

1. Go to https://github.com/EauDoon/decision-labs/security/advisories/new
2. Provide a clear title and reproduction steps.
3. Wait for a maintainer acknowledgement before any public disclosure.

You can also email the maintainer listed in CODEOWNERS if the advisory flow
is unavailable.

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
