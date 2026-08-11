# Contributing

## Scope

Keep changes focused on a local, inspectable deliberation workshop. Do not add remote services, accounts, telemetry, hidden scoring, automatic interpretation of policy text, or dependencies unless the change is explicitly justified and documented.

## Model changes

Changes to `src/model.js` require tests for the affected calculation or outcome. Preserve these properties:

- Inputs are validated before search.
- Search is deterministic and exhaustive within its bound.
- The safety bound returns an explicit result rather than a partial recommendation.
- The model treats option labels as opaque text.
- The app does not claim legitimacy, consent, or authority from a calculated score.

If a tie-breaker, formula, threshold interpretation, or bound changes, update `MODEL.md`, browser-visible Method and Limits copy, and relevant tests in the same change.

## Interface changes

Maintain keyboard operation, visible focus states, usable small-screen layouts, and a text or table equivalent for every visualized result. Keep the canvas visualization nonessential: the table must expose the same approval values.

## Checks

Run both commands before proposing a change:

```sh
npm test
npm run check
```

Keep public prose direct and accurate. Do not use em dashes.
