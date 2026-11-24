# harness-recipe

Lleva la Harness Recipe a cualquier proyecto JS/TS. El skill **analiza** el proyecto (gestor de paquetes, topología, qué harness ya existe), lo **audita** sin tocar nada y **genera** lo que falte, una capa a la vez: te muestra el diff y espera tu "sí".

Las 7 capas: sensores y scripts · contexto (CLAUDE.md y rules) · permisos · hooks · git hooks y commits · tools (MCP) · observabilidad.

> Este README es para ti. Claude lee `SKILL.md`.

## Cómo pedirlo

- "Audita el harness de este proyecto."
- "¿Qué le falta a mi setup de Claude Code?"
- "Genera la capa de permisos."
- "Genera los hooks."
- "Audita mis microfrontends."

## Qué obtienes

Un reporte en español con una tabla por capa. Ejemplo (de una auditoría real de `calculator-harness`):

| Item | Estado | Por qué importa | Arreglo |
|------|--------|-----------------|---------|
| Rule `performance.md` | ❌ | `paths: app/**` no coincide con `src/app/`, así que nunca se carga | Cambiar a `src/app/**` |
| Git usa `.githooks` | ❌ | `core.hooksPath` sin configurar: `commit-msg` nunca corre | `pnpm run prepare` |
| Hooks y gestor | ❌ | Los hooks llaman a `npm` en un proyecto `pnpm` | Regenerar con `{{run}}` → `pnpm --silent run` |
| `SessionStart` matcher | ⚠️ | Sin `clear`, `/clear` arranca sin el estado del proyecto | `startup\|resume\|clear` |

Al final viene "Siguiente paso": las capas en orden, primero las que tienen ❌. Si quieres, lo guarda en `docs/harness-audit.md`.

## Qué soporta

| Soportado | Aún no |
|-----------|--------|
| Next.js, Vite, Node, librerías (JS/TS) | Python, Go, otros lenguajes |
| App sola | React Native |
| Monorepo: Turborepo, workspaces de pnpm, npm, yarn y bun | Nx |
| Module Federation (host y remotes) | Vercel Microfrontends |
| Clon normal, clon `--bare` y worktrees | Pipelines de CI |

Si el proyecto no está soportado, el reporte lo dice en vez de adivinar.

## Qué hay dentro

```text
SKILL.md                          flujo que sigue Claude: analizar → auditar → generar
scripts/detect.mjs                escanea el repo (solo lectura) e imprime un JSON
scripts/detect.test.mjs           tests de detect.mjs
references/layers/                una ficha por capa: qué auditar, qué generar, cómo probarlo
references/topologies/            app sola, Turborepo/workspaces, Module Federation
references/audit-report-template.md
assets/templates/                 configs con variables; dot-claude/ se copia como .claude/ (hooks, settings, rules, improve-harness, feature-workflow)
evals/evals.json                  casos para evaluar el skill
```

## Mantenimiento

- Las plantillas de `assets/templates/` salen de la receta en Obsidian (`05 Planning/Harness Recipe/`). Los valores fijos (`npm`, `5173`, `src/`) son variables como `{{pm}}`, `{{run}}`, `{{src}}` y `{{port}}`. La tabla completa está en `SKILL.md`.
- Si cambias la receta, copia el archivo a `assets/templates/` y vuelve a poner las variables.
- Tests: `node --test scripts/detect.test.mjs`
- Ver qué detecta en un repo: `node scripts/detect.mjs <ruta-del-repo>`
