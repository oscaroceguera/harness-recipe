## Learned User Preferences

- Prefers chatting in Spanish while keeping skill content, audits, and agent-facing docs in English by default.
- Wants public docs as separate files: English `README.md` (default) and Spanish `README.es.md`, linked with a language switcher—not a single bilingual README.
- Asks for commits explicitly when ready; wait for that confirmation before committing.

## Learned Workspace Facts

- This repo packages the public `harness-recipe` Agent Skill under `skills/harness-recipe/` for install via `npx skills add oscaroceguera/harness-recipe`.
- Skill layout follows Agent Skills / skills.sh: `SKILL.md` lives in `skills/<name>/` matching the frontmatter `name`; nested template skills under `assets/templates/` must not be discovered as installable package skills.
- MIT-licensed; `detect.mjs` requires Node.js 18+.
