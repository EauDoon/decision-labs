# Security policy

## Local boundary

The Smallest Agreement is designed to run locally. It makes no network requests, uses no account system, and stores drafts only in the current browser's local storage unless a person exports JSON or shares a URL fragment.

Treat proposal content as potentially sensitive. Do not place confidential material in a shared URL. Anyone who receives the full link can read the serialized proposal. Prefer exported JSON kept in an appropriate location for larger or sensitive drafts.

## Import safety

Imported JSON is parsed and structurally validated before it replaces the active draft. Unknown fields are discarded before the draft is stored, exported, or shared. Files, URL fragments, collection sizes, labels, and identifiers have explicit limits before search or rendering. Invalid local storage and malformed URL fragments are ignored. Validation cannot determine whether scores, weights, labels, or costs are truthful or appropriate.

## Reporting a vulnerability

Please report a reproducible security issue privately to the project maintainer before public disclosure. Include the affected version, steps to reproduce, expected behavior, actual behavior, and any relevant proof of concept. Do not include private proposal data in a public report.

## Supported versions

The current `main` branch is supported.
