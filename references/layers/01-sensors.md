# Layer 1 — Sensors and scripts

Install the check commands before any Claude Code config. A hook that calls a missing script is noise.

## Audit

Run per package in `Report.packages[]` (in a monorepo, also check the root `package.json`).

| Item | Report field | ✅ | ⚠️ | ❌ |
|------|--------------|----|----|----|
| lint | `scripts.lint` | true | — | false |
| typecheck | `scripts.typecheck` (name in `typecheckScript`) | true | Next ≥ 15.5 and the script lacks `next typegen` | false |
| unit tests | `scripts.test` | true | — | false |
| format | `scripts.format` | true | — | false |
| dead code | `scripts.knip` | true | false on a lib/app with < 20 files | false |
| e2e | `scripts.e2e` | true, or package is `lib` | — | false on next/vite apps |
| dupes | read `package.json` for a `dupes` script | present | — | absent |
| `.prettierignore` covers workflows | read `.prettierignore` | lists `.github/workflows` | — | missing while `.github/workflows/` exists |
| ESLint globs match the tree | read `eslint.config.*`; compare globs to `srcDir` | globs use the real folders | — | globs point at `app/` while code is in `src/app/` (rule never fires) |

## Generate

Templates in `assets/templates/` (fill placeholders from the Report):

- `vitest.config.mts`, `vitest.setup.ts` (goes to `{{src}}vitest.setup.ts`), `playwright.config.ts`, `knip.json`, `.prettierignore`, `.gitignore` (merge lines, never replace), `eslint.config.mjs`.
- `eslint.config.mjs` is the **Next.js** version. For `vite` or `node` packages drop the `eslint-config-next` imports and spreads; keep typescript-eslint, `max-lines`, `no-restricted-imports`, prettier. Rewrite the `boundaries` patterns to the folders that actually exist (list them first); if the layout has no clear layers, omit `boundaries`.
- Dev dependencies (install with `{{pm}} add -D`, or `npm i -D`): `vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event @playwright/test prettier eslint-config-prettier typescript-eslint eslint-plugin-boundaries knip jscpd`. Skip the React testing libs for `node`/`lib` packages, and Playwright for `lib`.
- Scripts to merge into `package.json` (keep existing `dev`/`build`/`start`):

```json
{
  "check": ".claude/hooks/check-all.sh --force",
  "dupes": "jscpd {{src}} --ignore \"**/*.spec.*\" --threshold 0 --reporters console",
  "format:check": "prettier --check .",
  "format:file": "prettier --write",
  "format": "prettier --write .",
  "knip": "knip --no-progress --reporter compact",
  "lint:file": "eslint --max-warnings 0",
  "lint": "eslint --max-warnings 0",
  "test": "vitest run --passWithNoTests",
  "test:e2e": "playwright test",
  "typecheck": "tsc -b",
  "verify": "{{pm}} run check && {{pm}} run test:e2e",
  "prepare": "git config core.hooksPath .githooks"
}
```

`check` runs every check regardless of git state; `verify` is what `.githooks/pre-push` calls (layer 5), so both are required.

**Formatting commit:** after adding Prettier, the first `{{pm}} run format` must not touch `.github/workflows/`. `.prettierignore` lists it: `anthropics/claude-code-action` skips the PR review when a PR's workflow file differs from the default branch's. If the project's `.prettierignore` already exists, merge the template's lines into it; check with `git diff --stat -- .github/workflows` (empty) before committing.

If a script already exists with another command, keep the existing one and say so in the diff. Add `typecheck` only when `typecheckScript` is null; otherwise the hooks call the existing name.

Next.js ≥ 15.5 (including 16): use `"typecheck": "next typegen && tsc --noEmit"` instead of `tsc -b`. The global types `PageProps`, `LayoutProps` and `RouteContext` come from `next typegen`; without it `tsc` fails on them. If an existing Next `typecheck` script lacks `next typegen`, propose the change in the diff.

## Prove it works

| Check | Expected |
|-------|----------|
| `{{pm}} test` | Passes, even with no spec files |
| Add a 401st code line to a source file, then `{{pm}} run lint` | `max-lines` error |
| A `../` import in source, then `{{pm}} run lint` | "Import through `@/`" error |
| `{{pm}} run knip` | Only real unused exports/deps. Add ignores; never weaken the command |
