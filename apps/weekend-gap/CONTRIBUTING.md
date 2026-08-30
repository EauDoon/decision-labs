# Contributing

Weekend Gap is a small, dependency-free static project. Keep contributions focused on the simulator and preserve its educational, synthetic-data boundary.

## Before proposing a change

1. Keep calculations in `src/model.js` as pure exported functions.
2. Do not add live market feeds, issuer-specific data, account data, tracking or third-party runtime dependencies.
3. Add or update boundary tests in `tests/model.test.mjs` for model changes.
4. Keep the app usable with keyboard controls and narrow screens.
5. Keep public prose free of em dashes.

Run these checks from the project directory:

```sh
npm test
npm run check
```

Describe the changed assumption, formula or interface behavior and the limitation that remains. Do not present synthetic output as financial advice or live market evidence.
