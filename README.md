# harness-recipe

**Tu agente es tan bueno como el harness que lo rodea.**

Este skill analiza tu proyecto JS/TS, audita las 7 capas del harness y genera lo que falte — una capa a la vez, con diff y tu “sí” antes de tocar nada.

Compatible con [Agent Skills](https://agentskills.io) · [skills.sh](https://skills.sh) · Claude Code · Cursor

---

## Install

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

## How it works

```text
  analyze  →  audit  →  generate
     │          │          │
   detect     ✅⚠️❌      diff + yes
   (read)    report      (write)
```

| Step | What happens |
|------|----------------|
| **1. Analyze** | `detect.mjs` escanea el repo (solo lectura): package manager, topología, harness existente |
| **2. Audit** | Reporte en español, tabla por capa, arreglo concreto por cada ❌ |
| **3. Generate** | Una capa a la vez. Te muestra el diff. Espera tu OK. Luego escribe |

Nada se escribe sin tu aprobación.

---

## The 7 layers

```text
① sensors        scripts, lint, typecheck, tests
② context        CLAUDE.md / AGENTS.md + rules
③ permissions    allow / deny en settings
④ hooks          SessionStart, PreToolUse, …
⑤ git hooks      commit-msg, pre-push, commitlint
⑥ tools          MCP (.mcp.json)
⑦ observability  improve-harness + review checklist
```

La regla de oro: un **hecho** va en CLAUDE.md o una rule · un **límite** en deny · un **check** en hook, lint o test.

---

## Try saying

```text
Audita el harness de este proyecto.
¿Qué le falta a mi setup de Claude Code?
Genera la capa de permisos.
Genera los hooks.
Audita mis microfrontends.
```

---

## Support matrix

| ✅ Yes | ❌ Not yet |
|--------|------------|
| Next.js, Vite, Node, libs JS/TS | Python, Go, … |
| Single app | React Native |
| Turborepo · pnpm / npm / yarn / bun workspaces | Nx |
| Module Federation (host + remotes) | Vercel Microfrontends |
| Normal clone · `--bare` · worktrees | CI pipelines |

Unsupported stack → el reporte lo dice. No inventa.

---

## Package layout

```text
skills/harness-recipe/
├── SKILL.md              # agent instructions
├── scripts/detect.mjs    # read-only scanner → JSON
├── references/           # per-layer + topology sheets
├── assets/templates/     # configs with {{placeholders}}
└── evals/                # skill eval cases
```

`feature-workflow` e `improve-harness` viven en templates: se copian al proyecto solo si generas esas capas. No se instalan como skills del paquete.

---

## Safety

- `detect.mjs` **solo lee**. Imprime JSON. No escribe ni ejecuta tu app.
- La generación es el paso 3, **después** de que apruebes el diff.
- Trátalo como código de terceros: léelo antes de instalar.

---

## Dev

```bash
node --test skills/harness-recipe/scripts/detect.test.mjs
node --test skills/harness-recipe/scripts/references.test.mjs

node skills/harness-recipe/scripts/detect.mjs /path/to/project
npx skills add . -l
```

---

MIT © [oscaroceguera](https://github.com/oscaroceguera)
