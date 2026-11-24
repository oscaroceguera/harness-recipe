import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync, chmodSync, symlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { detect } from "./detect.mjs";

// Build a throwaway repo from { "relative/path": content } (objects are JSON-encoded).
function make(files) {
  const root = mkdtempSync(join(tmpdir(), "harness-detect-"));
  for (const [rel, content] of Object.entries(files)) {
    const p = join(root, rel);
    mkdirSync(dirname(p), { recursive: true });
    writeFileSync(p, typeof content === "string" ? content : JSON.stringify(content));
  }
  return root;
}

const nextPkg = (dev = "next dev -p 5173") => ({
  name: "app",
  scripts: { dev, lint: "eslint .", test: "vitest run", typecheck: "tsc --noEmit" },
  dependencies: { next: "16.0.0", react: "19.0.0" },
});

test("next-pnpm-single", () => {
  const r = detect(make({ "package.json": nextPkg(), "pnpm-lock.yaml": "", "src/app/page.tsx": "" }));
  assert.equal(r.supported, true);
  assert.equal(r.packageManager, "pnpm");
  assert.equal(r.topology, "single");
  assert.equal(r.packages.length, 1);
  const p = r.packages[0];
  assert.equal(p.path, ".");
  assert.equal(p.framework, "next");
  assert.equal(p.srcDir, "src");
  assert.equal(p.appRouter, true);
  assert.equal(p.port, 5173);
  assert.deepEqual(p.scripts, { lint: true, test: true, typecheck: true, format: false, knip: false, e2e: false });
  assert.equal(p.moduleFederation, null);
});

test("pnpm-settings-only workspace file is still a single app", () => {
  const r = detect(make({
    "package.json": nextPkg(),
    "pnpm-lock.yaml": "",
    "pnpm-workspace.yaml": "onlyBuiltDependencies:\n  - esbuild\n",
  }));
  assert.equal(r.topology, "single");
  assert.equal(r.monorepoTool, null);
});

test("vite-npm uses default port 5173", () => {
  const r = detect(make({
    "package.json": { scripts: { dev: "vite" }, devDependencies: { vite: "7.0.0" } },
    "package-lock.json": "{}",
  }));
  assert.equal(r.packageManager, "npm");
  assert.equal(r.packages[0].framework, "vite");
  assert.equal(r.packages[0].srcDir, ".");
  assert.equal(r.packages[0].port, 5173);
});

test("turborepo expands workspace globs", () => {
  const r = detect(make({
    "package.json": { name: "root", private: true },
    "pnpm-lock.yaml": "",
    "turbo.json": {},
    "pnpm-workspace.yaml": 'packages:\n  - "apps/*"\n  - "packages/*"\n',
    "apps/web/package.json": nextPkg(),
    "apps/docs/package.json": nextPkg("next dev"),
    "packages/ui/package.json": { name: "@repo/ui", dependencies: { react: "19.0.0" } },
  }));
  assert.equal(r.topology, "monorepo");
  assert.equal(r.monorepoTool, "turbo");
  assert.deepEqual(r.packages.map((p) => p.path).sort(), ["apps/docs", "apps/web", "packages/ui"]);
  assert.equal(r.packages.find((p) => p.path === "packages/ui").framework, "lib");
});

test("npm workspaces object form", () => {
  const r = detect(make({
    "package.json": { workspaces: { packages: ["apps/*"] } },
    "package-lock.json": "{}",
    "apps/a/package.json": { name: "a" },
  }));
  assert.equal(r.monorepoTool, "npm");
  assert.deepEqual(r.packages.map((p) => p.path), ["apps/a"]);
});

test("module federation host and remote", () => {
  const mf = (body) => `import { federation } from "@module-federation/vite";\nexport default { plugins: [federation({ ${body}, shared: ["react", "react-dom"] })] };\n`;
  const pkg = { devDependencies: { vite: "7.0.0", "@module-federation/vite": "1.0.0" } };
  const r = detect(make({
    "package.json": { workspaces: ["apps/*"] },
    "yarn.lock": "",
    "apps/host/package.json": pkg,
    "apps/host/vite.config.ts": mf('remotes: { cart: "cart@http://localhost:5174/remoteEntry.js" }'),
    "apps/remote/package.json": pkg,
    "apps/remote/vite.config.ts": mf('exposes: { "./Cart": "./src/Cart.tsx" }'),
  }));
  const host = r.packages.find((p) => p.path === "apps/host");
  const remote = r.packages.find((p) => p.path === "apps/remote");
  assert.equal(host.moduleFederation.role, "host");
  assert.equal(remote.moduleFederation.role, "remote");
  assert.deepEqual(host.moduleFederation.shared, ["react", "react-dom"]);
});

test("harness-full is reflected", () => {
  const root = make({
    "package.json": nextPkg(),
    "pnpm-lock.yaml": "",
    "AGENTS.md": "# shared",
    "CLAUDE.md": "# x\n\n@AGENTS.md\n",
    "apps/CLAUDE.md": "# nested",
    ".claude/rules/perf.md": '---\npaths:\n  - "src/app/**"\n---\n# Perf\n',
    ".claude/rules/global.md": "# Global\n",
    ".claude/settings.json": {
      $schema: "https://json.schemastore.org/claude-code-settings.json",
      permissions: { allow: ["Bash(pnpm run lint*)"], deny: ["Read(./.env)"] },
      hooks: { Stop: [], PostToolUse: [] },
    },
    ".claude/hooks/check-all.sh": "#!/bin/sh\n",
    ".claude/skills/improve-harness/SKILL.md": "x",
    ".cursor/rules/tests.mdc": '---\ndescription: Tests\nglobs: "**/*.spec.ts"\nalwaysApply: false\n---\n# Tests\n',
    ".cursor/rules/global.mdc": "---\nalwaysApply: true\n---\n# Global\n",
    ".cursor/hooks.json": { version: 1, hooks: { beforeReadFile: [], stop: [] } },
    ".cursor/hooks/deny-env-read.sh": "#!/bin/sh\n",
    ".githooks/pre-push": "#!/bin/sh\n",
    ".git/config": "[core]\n\thooksPath = .githooks\n",
    "commitlint.config.js": "",
    ".mcp.json": { mcpServers: { context7: {} } },
  });
  chmodSync(join(root, ".claude/hooks/check-all.sh"), 0o755);
  chmodSync(join(root, ".cursor/hooks/deny-env-read.sh"), 0o755);
  const h = detect(root).harness;
  assert.deepEqual(h.claudeMd.sort(), ["CLAUDE.md", "apps/CLAUDE.md"]);
  assert.deepEqual(h.agentsMd, ["AGENTS.md"]);
  assert.equal(h.agentsImportedByClaude, true);
  assert.deepEqual(h.rules.find((x) => x.file === "perf.md").paths, ["src/app/**"]);
  assert.equal(h.rules.find((x) => x.file === "global.md").paths, null);
  assert.deepEqual(h.cursorRules.find((x) => x.file === "tests.mdc").globs, ["**/*.spec.ts"]);
  assert.equal(h.cursorRules.find((x) => x.file === "tests.mdc").alwaysApply, false);
  assert.equal(h.cursorRules.find((x) => x.file === "global.mdc").alwaysApply, true);
  assert.deepEqual(h.cursorHooks, { exists: true, version: 1, events: ["beforeReadFile", "stop"] });
  assert.deepEqual(h.cursorHookScripts, [{ file: "deny-env-read.sh", executable: true }]);
  assert.deepEqual(h.settings, { exists: true, schema: true, allow: 1, ask: 0, deny: 1, hooks: ["Stop", "PostToolUse"] });
  assert.deepEqual(h.hooks, [{ file: "check-all.sh", executable: true }]);
  assert.deepEqual(h.gitHooks, { dir: true, hooksPath: ".githooks", files: ["pre-push"] });
  assert.equal(h.commitlint, true);
  assert.deepEqual(h.mcp, ["context7"]);
  assert.deepEqual(h.skills, ["improve-harness"]);
});

test("AGENTS.md inside .cursor skills is not project context", () => {
  const r = detect(make({
    "package.json": nextPkg(),
    "AGENTS.md": "x",
    ".cursor/skills/foo/AGENTS.md": "x",
  }));
  assert.deepEqual(r.harness.agentsMd, ["AGENTS.md"]);
  assert.equal(r.harness.agentsImportedByClaude, false);
});

test("no-package is unsupported, not a crash", () => {
  const r = detect(make({ "README.md": "x" }));
  assert.equal(r.supported, false);
  assert.match(r.unsupportedReason, /package\.json/);
});

test("bad-json reports an error field", () => {
  const r = detect(make({ "package.json": "{ nope", ".claude/settings.json": "{ nope" }));
  assert.equal(r.supported, false);
  assert.deepEqual(r.harness.settings, { error: "invalid JSON" });
});

test("skips-node-modules and build dirs", () => {
  const r = detect(make({
    "package.json": nextPkg(),
    "node_modules/x/CLAUDE.md": "x",
    ".next/CLAUDE.md": "x",
    "dist/AGENTS.md": "x",
  }));
  assert.deepEqual(r.harness.claudeMd, []);
  assert.deepEqual(r.harness.agentsMd, []);
});

test("AGENTS.md inside installed skills is not project context", () => {
  const r = detect(make({
    "package.json": nextPkg(),
    "AGENTS.md": "x",
    ".agents/skills/foo/AGENTS.md": "x",
    ".claude/skills/foo/AGENTS.md": "x",
  }));
  assert.deepEqual(r.harness.agentsMd, ["AGENTS.md"]);
});

test("turborepo-style check-types counts as typecheck", () => {
  const r = detect(make({ "package.json": { scripts: { "check-types": "tsc --noEmit" } } }));
  assert.equal(r.packages[0].scripts.typecheck, true);
});

test("hooksPath is read through a git worktree's gitdir pointer", () => {
  const main = make({ ".git/config": "[core]\n\thooksPath = .githooks\n", ".git/worktrees/wt/commondir": "../..\n" });
  const wt = make({ "package.json": nextPkg(), ".git": `gitdir: ${join(main, ".git/worktrees/wt")}\n` });
  assert.equal(detect(wt).harness.gitHooks.hooksPath, ".githooks");
});

test("typecheckScript reports the real script name", () => {
  const named = (name) => detect(make({ "package.json": { scripts: { [name]: "tsc --noEmit" } } })).packages[0].typecheckScript;
  assert.equal(named("check-types"), "check-types");
  assert.equal(named("typecheck"), "typecheck");
  assert.equal(detect(make({ "package.json": {} })).packages[0].typecheckScript, null);
});

test("ports: next without -p defaults to 3000, unknown is null", () => {
  assert.equal(detect(make({ "package.json": nextPkg("next dev") })).packages[0].port, 3000);
  assert.equal(detect(make({ "package.json": { scripts: { dev: "node server.js" } } })).packages[0].port, null);
});

test("nx, vercel microfrontends and react-native are unsupported", () => {
  assert.equal(detect(make({ "package.json": {}, "nx.json": {} })).supported, false);
  assert.equal(detect(make({ "package.json": {}, "microfrontends.json": {} })).supported, false);
  const rn = detect(make({ "package.json": { dependencies: { "react-native": "0.80.0" } } }));
  assert.equal(rn.supported, false);
  assert.match(rn.unsupportedReason, /react.?native/i);
});

test("prints the report when run through a symlinked skill folder", () => {
  // Skills are often installed as .claude/skills/<name> -> .agents/skills/<name>.
  const skillDir = dirname(dirname(fileURLToPath(import.meta.url)));
  const link = join(mkdtempSync(join(tmpdir(), "harness-link-")), "harness-recipe");
  symlinkSync(skillDir, link);
  const project = make({ "package.json": nextPkg() });
  const out = execFileSync(process.execPath, [join(link, "scripts/detect.mjs"), project], { encoding: "utf8" });
  assert.equal(JSON.parse(out).packages[0].framework, "next");
});
