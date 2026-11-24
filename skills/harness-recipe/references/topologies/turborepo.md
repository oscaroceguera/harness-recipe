# Topology — monorepo (Turborepo or workspaces)

`Report.topology == "monorepo"`. `monorepoTool` is `turbo`, `pnpm`, `npm`, `yarn` or `bun`.

## Where each piece lives

| Piece | Root | Per package (`apps/*`, `packages/*`) |
|-------|------|--------------------------------------|
| `CLAUDE.md` | Short: topology, package list, root commands, how to run one package | Nested `CLAUDE.md` in each app: its stack, port, entry points |
| `.claude/rules/*.md` | Yes, one folder; scope each rule with `paths: ["apps/web/**"]` | — |
| `.claude/settings.json`, hooks | Yes (one set) | — |
| `.githooks/`, commitlint, `.mcp.json` | Yes | — |
| Check scripts (lint, test, typecheck…) | Root `turbo.json` tasks / root scripts that fan out | Each package has its own scripts |
| `eslint.config.*`, `vitest.config.*`, `playwright.config.*` | Shared config package if one exists (e.g. `packages/eslint-config`) | Each app's config, with globs relative to that app |

## Audit additions

- Each `next`/`vite` package has `lint`, `typecheck`, `test` scripts; every `turbo.json` task the Stop hook calls exists in `tasks`.
- Root scripts `check` and `verify` exist.
- `{{port}}` differs per app; two apps with the same port is ⚠️ (e2e collisions).
- Rules without `paths` in a monorepo load for every package: ⚠️ unless they truly apply everywhere.

## Generate changes

`check-all.sh` — run the per-package checks through Turborepo so only changed packages run; keep root-only scripts (`format:check`, `dupes`) on `{{run}}`:

```bash
if ! out=$({{pmx}} turbo run {{typecheckScript}} lint test --filter='...[HEAD]' 2>&1); then
  failed+=("turbo")
  printf '\n=== turbo failed ===\n%s\n' "$(tail -n 40 <<<"$out")" >&2
fi
for script in format:check dupes; do …   # same loop as the template
```

Without Turborepo, use the workspace filter of the package manager (`pnpm -r --filter='...[HEAD]' run lint`, `npm run lint --workspaces --if-present`).

`format-lint-file.sh` — lint with the package that owns the file:

```bash
pkg_dir=$(dirname "$path")
while [ "$pkg_dir" != "/" ] && [ ! -f "$pkg_dir/package.json" ]; do pkg_dir=$(dirname "$pkg_dir"); done
(cd "$pkg_dir" && {{pmx}} eslint --max-warnings 0 "$path")
```

`session-start.sh` — check every app's port, not one.

Permissions: add `Bash(turbo run*)` / `Bash({{pm}} --filter*)` to `allow`.
