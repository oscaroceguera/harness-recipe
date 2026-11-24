# Layer 6 — Tools

Enable only what the work needs. Every MCP server and skill description costs context on every request.

## Audit

| Item | Report field | ✅ | ⚠️ | ❌ |
|------|--------------|----|----|----|
| Current library docs | `harness.mcp` includes `context7`, or the user has it globally | yes | — | no |
| Context7 not disabled locally | `.claude/settings.local.json` `disabledMcpjsonServers` | absent | contains `context7` | — |
| Browser for e2e | Playwright in deps (`scripts.e2e`) or a Playwright MCP/skill | yes on apps | — | missing on next/vite apps |
| Framework skills | `harness.skills`, `skills-lock.json` | React/Next best-practice skills on React apps | — | — |
| Unused MCP servers | `harness.mcp` vs what the stack uses | all used | a server unrelated to the stack | — |

## Generate

- `.mcp.json` from `assets/templates/.mcp.json` (Context7). Alternative the recipe uses: `{{pmx}} ctx7 setup --claude --project --oauth`.
- React/Next apps, optional: `npx skills add vercel-labs/agent-skills --skill vercel-react-best-practices` (also `vercel-composition-patterns`, `web-design-guidelines`).
- Playwright browser: `{{pmx}} playwright install chromium`.
- Do not add tools the user did not ask for beyond these; list them as suggestions.

## Prove it works

| Request | Expected |
|---------|----------|
| "How do I configure X in <library version>?" | Agent calls Context7 `resolve-library-id` then `query-docs` |
| `/mcp` | Context7 connected |
