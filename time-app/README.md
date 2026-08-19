# Time app

A small, dependency-free browser app with a live clock, stopwatch, and countdown timer.

## Open it

Open [`index.html`](./index.html) in a browser. No build step or server is required.

## Run the tests

From the repository root:

```sh
npm test
```

The tests use Node's built-in `node:test` and `node:assert/strict` modules. Countdown fields treat empty values as zero and reject non-numeric, negative, or non-integer values.
