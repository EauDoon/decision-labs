# Contributing

Keep changes small, explicit, and reproducible.

## Model changes

The economic model in `src/model.js` must remain pure and deterministic. Do not read browser state, dates, network responses, or random values from model functions. Export a focused function for each material calculation and add boundary tests in `tests/model.test.mjs` before changing an equation or validation rule.

State units and assumptions in `MODEL.md`. A formula or interpretation change requires corresponding updates to browser-visible Method and Limits text.

## Interface changes

Keep the app usable without a mouse. Use native controls, visible focus, labels, text equivalents for the canvas, and responsive layouts. Do not add external services, tracking, dependencies, or fake integrations.

## Validation

Run both checks before proposing a change:

```sh
npm test
npm run check
```

Inspect the resulting diff. Do not include secrets, private paths, or em dashes in public content.
