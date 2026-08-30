# Security policy

Weekend Gap is a local static browser app. It has no authentication, backend, external network calls or data collection.

Scenario imports are treated as untrusted JSON. The app limits file and hash sizes, then validates and clamps values before use. Shared scenarios are stored in a URL hash and local autosave is stored only in the browser's local storage.

If you identify a security issue, do not include secrets, private keys, account data or personal information in a public report. Provide a minimal reproducible description through the repository's private security reporting channel when one is configured. Until then, use a minimal public issue only for non-sensitive disclosures.

Do not use this project to store sensitive scenarios or confidential operating data.
