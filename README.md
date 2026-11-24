# harness-recipe

[![License: MIT](https://img.shields.io/github/license/oscaroceguera/harness-recipe)](LICENSE)
[![GitHub stars](https://img.shields.io/github/stars/oscaroceguera/harness-recipe?style=social)](https://github.com/oscaroceguera/harness-recipe)
![Node 18+](https://img.shields.io/badge/node-%3E%3D18-339933?logo=node.js&logoColor=white)

**English** · [Español](README.es.md)

**Your agent is only as good as the harness around it.**

This skill analyzes your JS/TS project, audits the 7 harness layers, and generates what’s missing — one layer at a time, with a diff and your “yes” before anything is written.

Works with [Agent Skills](https://agentskills.io) · [skills.sh](https://skills.sh) · Claude Code · Cursor

---

## Install

Requires Node.js 18+ (for the `detect.mjs` scanner).

```bash
npx skills add oscaroceguera/harness-recipe
```

```bash
# Global (all your projects)
npx skills add oscaroceguera/harness-recipe -g

# List only
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
| **1. Analyze** | `detect.mjs` scans the repo (read-only): package manager, topology, existing harness |
| **2. Audit** | English report, table per layer, concrete fix for every ❌ |
| **3. Generate** | One layer at a time. Shows the diff. Waits for your OK. Then writes |

Nothing is written without your approval.

---

## The 7 layers

```text
① sensors        scripts, lint, typecheck, tests
② context        CLAUDE.md / AGENTS.md + rules
③ permissions    allow / deny in settings
④ hooks          SessionStart, PreToolUse, …
⑤ git hooks      commit-msg, pre-push, commitlint
⑥ tools          MCP (.mcp.json)
⑦ observability  improve-harness + review checklist
```

Golden rule: a **fact** goes in CLAUDE.md or a rule · a **limit** in deny · a **check** in a hook, lint rule, or test.

---

## Try saying

```text
Audit the harness of this project.
What is my Claude Code setup missing?
Generate the permissions layer.
Generate the hooks.
Audit my microfrontends.
```

---

## Support matrix

| ✅ Yes | ❌ Not yet |
|--------|------------|
| Next.js, Vite, Node, JS/TS libs | Python, Go, … |
| Single app | React Native |
| Turborepo · pnpm / npm / yarn / bun workspaces | Nx |
| Module Federation (host + remotes) | Vercel Microfrontends |
| Normal clone · `--bare` · worktrees | CI pipelines |

Unsupported stack → the report says so. It does not guess.

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

`feature-workflow` and `improve-harness` live in templates: they are copied into the target project only if you generate those layers. They are not installed as package skills.

---

## Safety

- `detect.mjs` is **read-only**. It prints JSON. It does not write or run your app.
- Generation is step 3, **after** you approve the diff.
- Treat it like third-party code: read it before installing.

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
