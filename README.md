# harness-recipe

Skill que lleva la **Harness Recipe** a cualquier proyecto JS/TS: analiza el repo, audita las 7 capas del harness sin tocar nada y genera lo que falte, una capa a la vez (te muestra el diff y espera tu "sí").

Compatible con el ecosistema abierto de [Agent Skills](https://agentskills.io) / [skills.sh](https://skills.sh).

## Instalar

En el proyecto donde quieras usarlo:

```bash
npx skills add oscaroceguera/harness-recipe
```

Opciones útiles:

```bash
# Solo este skill (si el repo crece)
npx skills add oscaroceguera/harness-recipe --skill harness-recipe

# Global (todos tus proyectos)
npx skills add oscaroceguera/harness-recipe -g

# Listar sin instalar
npx skills add oscaroceguera/harness-recipe -l
```

Funciona con Claude Code, Cursor y otros agentes que lean skills en `.agents/skills/`, `.claude/skills/` o `.cursor/skills/`.

## Cómo pedirlo

- "Audita el harness de este proyecto."
- "¿Qué le falta a mi setup de Claude Code?"
- "Genera la capa de permisos."
- "Genera los hooks."
- "Audita mis microfrontends."

## Qué hace

1. **Analiza** — corre `detect.mjs` (solo lectura) y resume topología, package manager y harness existente.
2. **Audita** — reporte en español, tabla por capa con ✅/⚠️/❌ y el arreglo concreto.
3. **Genera** — una capa a la vez, con diff y confirmación antes de escribir.

Las 7 capas: sensores y scripts · contexto (CLAUDE.md y rules) · permisos · hooks · git hooks y commits · tools (MCP) · observabilidad.

## Qué soporta

| Soportado | Aún no |
|-----------|--------|
| Next.js, Vite, Node, librerías (JS/TS) | Python, Go, otros lenguajes |
| App sola | React Native |
| Monorepo: Turborepo, workspaces de pnpm, npm, yarn y bun | Nx |
| Module Federation (host y remotes) | Vercel Microfrontends |
| Clon normal, clon `--bare` y worktrees | Pipelines de CI |

Si el proyecto no está soportado, el reporte lo dice en vez de adivinar.

## Estructura del paquete

```text
skills/harness-recipe/
  SKILL.md                 # instrucciones del agente
  scripts/detect.mjs       # escaneo de solo lectura → JSON
  references/              # fichas por capa y topología
  assets/templates/        # plantillas con {{placeholders}}
  evals/                   # casos de evaluación del skill
```

Las plantillas bajo `assets/templates/dot-claude/skills/` (`feature-workflow`, `improve-harness`) **no** se instalan como skills del paquete: se copian al proyecto destino solo si generas esas capas.

## Seguridad

- `scripts/detect.mjs` solo lee el filesystem e imprime JSON; no escribe ni ejecuta el proyecto.
- La generación de archivos ocurre solo en el paso 3, después de que apruebes el diff de cada capa.
- Revisa el skill antes de instalarlo, como cualquier código de terceros.

## Desarrollo

```bash
# Tests del detector
node --test skills/harness-recipe/scripts/detect.test.mjs
node --test skills/harness-recipe/scripts/references.test.mjs

# Probar detección contra un repo
node skills/harness-recipe/scripts/detect.mjs /ruta/al/proyecto

# Validar discovery local
npx skills add . -l
```

Licencia: [MIT](./LICENSE).
