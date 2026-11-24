# harness-recipe

[![License: MIT](https://img.shields.io/github/license/oscaroceguera/harness-recipe)](LICENSE)
[![GitHub stars](https://img.shields.io/github/stars/oscaroceguera/harness-recipe?style=social)](https://github.com/oscaroceguera/harness-recipe)
![Node 18+](https://img.shields.io/badge/node-%3E%3D18-339933?logo=node.js&logoColor=white)

[English](README.md) · **Español**

**Tu agente es tan bueno como el harness que lo rodea.**

Este skill analiza tu proyecto JS/TS, audita las 7 capas del harness y genera lo que falte — una capa a la vez, con diff y tu “sí” antes de tocar nada.

Compatible con [Agent Skills](https://agentskills.io) · [skills.sh](https://skills.sh) · Claude Code · Cursor

> Las instrucciones del skill y los reportes de auditoría están en **inglés** por defecto.

---

## Instalar

Requiere Node.js 18+ (para el scanner `detect.mjs`).

```bash
npx skills add oscaroceguera/harness-recipe
```

```bash
# Global (todos tus proyectos)
npx skills add oscaroceguera/harness-recipe -g

# Solo listar
npx skills add oscaroceguera/harness-recipe -l
```

---

## Cómo funciona

```text
  analyze  →  audit  →  generate
     │          │          │
   detect     ✅⚠️❌      diff + yes
   (read)    report      (write)
```

| Paso | Qué pasa |
|------|----------|
| **1. Analyze** | `detect.mjs` escanea el repo (solo lectura): package manager, topología, harness existente |
| **2. Audit** | Reporte en inglés, tabla por capa, arreglo concreto por cada ❌ |
| **3. Generate** | Una capa a la vez. Muestra el diff. Espera tu OK. Luego escribe |

Nada se escribe sin tu aprobación.

---

## Las 7 capas

```text
① sensors        scripts, lint, typecheck, tests
② context        AGENTS.md (+ CLAUDE.md fino) · `.claude/rules` + `.cursor/rules`
③ permissions    allow/deny de Claude · Cursor `beforeReadFile` para secretos
④ hooks          hooks `.claude` (Cursor vía Third-Party Imports) · gaps nativos Cursor
⑤ git hooks      commit-msg, pre-push, commitlint
⑥ tools          MCP (.mcp.json)
⑦ observability  improve-harness + review checklist
```

Regla de oro: un **hecho** va en AGENTS.md o una rule · un **límite** en deny / read hook · un **check** en hook, lint o test.

Claude ↔ Cursor: `AGENTS.md` compartido, rules espejo, scripts de hooks portables. Mantén **Third-Party Imports** ON en Cursor para que corran los hooks de `.claude`.

---

## Cómo pedirlo

```text
Audita el harness de este proyecto.
¿Qué le falta a mi setup de Claude Code / Cursor?
Genera la capa de permisos.
Genera los hooks.
Haz que las rules funcionen al cambiar a Cursor.
Audita mis microfrontends.
```

---

## Matriz de soporte

| ✅ Sí | ❌ Aún no |
|-------|-----------|
| Next.js, Vite, Node, libs JS/TS | Python, Go, … |
| App sola | React Native |
| Turborepo · workspaces de pnpm / npm / yarn / bun | Nx |
| Module Federation (host + remotes) | Vercel Microfrontends |
| Clon normal · `--bare` · worktrees | Pipelines de CI |

Stack no soportado → el reporte lo dice. No inventa.

---

## Estructura del paquete

```text
skills/harness-recipe/
├── SKILL.md              # instrucciones del agente
├── scripts/detect.mjs    # escáner de solo lectura → JSON (Claude + Cursor)
├── references/           # fichas por capa y topología
├── assets/templates/     # configs con {{placeholders}}
│   ├── AGENTS.md · CLAUDE.md
│   ├── dot-claude/       # → .claude/ del proyecto
│   └── dot-cursor/       # → .cursor/ del proyecto
└── evals/                # casos de evaluación del skill
```

`feature-workflow` e `improve-harness` viven en templates: se copian al proyecto destino solo si generas esas capas. No se instalan como skills del paquete.

---

## Seguridad

- `detect.mjs` es **solo lectura**. Imprime JSON. No escribe ni ejecuta tu app.
- La generación es el paso 3, **después** de que apruebes el diff.
- Trátalo como código de terceros: léelo antes de instalar.

---

## Desarrollo

```bash
node --test skills/harness-recipe/scripts/detect.test.mjs
node --test skills/harness-recipe/scripts/references.test.mjs

node skills/harness-recipe/scripts/detect.mjs /ruta/al/proyecto
npx skills add . -l
```

---

MIT © [oscaroceguera](https://github.com/oscaroceguera)
