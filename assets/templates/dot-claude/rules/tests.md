---
paths:
  - "**/*.spec.ts"
  - "**/*.spec.tsx"
  - "vitest.config.mts"
  - "playwright.config.ts"
---

# Tests

- Unit tests sit next to the code as `*.spec.ts(x)` (Vitest, jsdom, Testing Library). Run one file with `{{pmx}} vitest run <file>`.
- End-to-end tests live in `tests/<feature>/<scenario>.spec.ts`, one scenario per file. Run one with `{{pmx}} playwright test <file>`; the whole suite with `{{pm}} run test:e2e`.
- Query elements with `getByRole`, `getByLabel`, `getByTestId`; never CSS selectors.
- `playwright.config.ts` reuses the running dev server on port {{port}} and starts one only if none is running.
- A failing test is fixed in the code under test, not by loosening the assertion or skipping the test.
