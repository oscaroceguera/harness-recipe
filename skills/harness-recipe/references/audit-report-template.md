# Harness audit — {{projectName}}

**Topology:** {{topology}} ({{monorepoTool}}) · **Package manager:** {{pm}} · **Packages:** {{packagesSummary}}
{{unsupportedNote}}  <!-- only when supported:false or something unsupported: say so and do not guess -->

Legend: ✅ ready · ⚠️ works but improvable · ❌ missing or broken

## 1. Sensors and scripts
| Item | Status | Why it matters | Fix |
|------|--------|----------------|-----|

## 2. Context (AGENTS.md, CLAUDE.md, and rules)
| Item | Status | Why it matters | Fix |
|------|--------|----------------|-----|

## 3. Permissions
| Item | Status | Why it matters | Fix |
|------|--------|----------------|-----|

## 4. Hooks
| Item | Status | Why it matters | Fix |
|------|--------|----------------|-----|

## 5. Git hooks and commits
| Item | Status | Why it matters | Fix |
|------|--------|----------------|-----|

## 6. Tools
| Item | Status | Why it matters | Fix |
|------|--------|----------------|-----|

## 7. Observability
| Item | Status | Why it matters | Fix |
|------|--------|----------------|-----|

## Topology: {{topology}}
<!-- extra rows from the topology reference (ports, Module Federation shared, monorepo rules without paths…) -->

## Next step
<!-- layers in recipe order (1→7); ❌ first. One line per layer: what to generate. -->

## Session habits (for you, not the agent)
- Claude: `/context` when the session feels slow: shows what is using context (CLAUDE.md / AGENTS.md, rules, MCP, conversation).
- Claude: `/compact <what to keep>` after finishing a subtask and before starting the next one.
- Claude: `/clear` when switching to unrelated work; `/rename` first so you can `/resume` later.
- Claude: `/mcp` to turn off servers this task does not need.
- Cursor: keep **Agents → Third-Party Imports** enabled so `.claude/settings.json` hooks run; use Project Rules / AGENTS.md for guidance that must survive agent switches.
