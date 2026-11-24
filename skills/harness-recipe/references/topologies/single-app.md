# Topology — single app

`Report.topology == "single"`, one entry in `packages` with `path: "."`.

Follow the layers as written. Fill placeholders from `packages[0]`:

| Placeholder | Value |
|-------------|-------|
| `{{pm}}` | `packageManager` (default `npm`) |
| `{{pmx}}` | npm → `npx --no-install`, pnpm → `pnpm exec`, yarn → `yarn`, bun → `bunx` |
| `{{install}}` | npm → `npm ci`, pnpm → `pnpm install --frozen-lockfile`, yarn → `yarn install --immutable`, bun → `bun install --frozen-lockfile` |
| `{{lockfile}}` | npm → `package-lock.json`, pnpm → `pnpm-lock.yaml`, yarn → `yarn.lock`, bun → `bun.lock` |
| `{{src}}` | `srcDir == "src"` → `src/`, else empty |
| `{{port}}` | `port`; if `null`, drop the port checks |

Notes:
- A `pnpm-workspace.yaml` without `packages:` only holds pnpm settings. It is still a single app.
- `vite` apps: no `app/` router. ESLint `boundaries` patterns must use the real folders (`{{src}}components`, `{{src}}features`, …).
- `node` / `lib` packages: skip Playwright, `session-start.sh` port check, and React test libraries.
