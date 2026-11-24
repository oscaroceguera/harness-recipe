// Every template a reference cites must exist in assets/templates/.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const skill = dirname(dirname(fileURLToPath(import.meta.url)));
const TEMPLATES = "assets/templates/";
const FILE_LIKE = /^[\w.@-]+(\/[\w.@-]+)*(\/|\.[a-z]+)$/;

const docs = ["SKILL.md", ...readdirSync(join(skill, "references"), { recursive: true })
  .filter((f) => f.endsWith(".md"))
  .map((f) => join("references", f))];

// On a line that names a templates folder, backticked file names are resolved against
// that folder or the templates root. Destinations in the project (`.claude/...`) are skipped.
function citations(doc) {
  const out = [];
  readFileSync(join(skill, doc), "utf8").split("\n").forEach((line, i) => {
    if (!line.includes(TEMPLATES)) return;
    const ticks = [...line.matchAll(/`([^`]+)`/g)].map((m) => m[1]);
    const dirs = ticks.filter((t) => t.startsWith(TEMPLATES)).map((t) => t.endsWith("/") ? t : dirname(t) + "/");
    for (const t of ticks) {
      if (t.startsWith(TEMPLATES)) out.push({ where: `${doc}:${i + 1}`, cited: t, candidates: [t] });
      else if (FILE_LIKE.test(t) && !t.startsWith(".claude/")) {
        out.push({ where: `${doc}:${i + 1}`, cited: t, candidates: [TEMPLATES, ...dirs].map((d) => d + t) });
      }
    }
  });
  return out;
}

test("every template cited by SKILL.md and references/ exists", () => {
  const all = docs.flatMap(citations);
  assert.ok(all.length > 10, "found too few citations; the extractor is broken");
  const missing = all.filter((c) => !c.candidates.some((p) => existsSync(join(skill, p))));
  assert.deepEqual(missing.map((c) => `${c.where} → ${c.cited}`), []);
});
