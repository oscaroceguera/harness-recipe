# Topology — Module Federation

A package with `moduleFederation != null`. `role` is `host` (has `remotes`), `remote` (has `exposes`) or `unknown`. Host and remotes may share a monorepo or live in separate repos.

## Treat each as an app

- Host and every remote get the full single-app harness (or nested `AGENTS.md` / thin `CLAUDE.md` in a monorepo).
- Each has its own dev port; e2e for the host must start (or reuse) the remotes it loads. `playwright.config.ts` `webServer` becomes an array: host plus each remote.
- `session-start.sh` checks every port.

## Audit additions

| Item | Check | ✅ | ⚠️ | ❌ |
|------|-------|----|----|----|
| Shared singletons aligned | For each name in `moduleFederation.shared` (e.g. `react`, `react-dom`), the version in every host/remote `package.json` | Same version range | Different minor | Different major (runtime crash) |
| Exposes contract documented | Rule or doc listing each remote's `exposes` keys and their props | Present | — | Absent |
| Remote URLs not hard-coded to localhost in prod config | read host config `remotes` | Uses env vars | — | Hard-coded `localhost` |
| Separate repos | Remote is a different repo | Each repo audited on its own; host lists remote versions it expects | — | — |

## Generate additions

- `.claude/rules/module-federation.md` with `paths` on the federation config files and exposed modules:
  - one line per exposed module: key → file → props it accepts;
  - "Changing an exposed module's props is a breaking change for the host: update the host in the same change or version the expose."
  - "`shared` singletons must match across host and remotes."
- Add a check to `check-all.sh` that fails when a shared singleton's version differs between host and remotes (compare the `dependencies` entries with `jq`).
