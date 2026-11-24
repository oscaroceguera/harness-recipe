#!/usr/bin/env node
// Read-only project scan for the harness-recipe skill.
// Usage: node detect.mjs [dir]   → prints a JSON report. Never runs project scripts, never writes.
import { readFileSync, readdirSync, statSync, existsSync, realpathSync } from "node:fs";
import { join, resolve, relative } from "node:path";
import { pathToFileURL } from "node:url";

// .agents and .claude hold installed skills whose AGENTS.md/CLAUDE.md are not project context.
const SKIP = new Set(["node_modules", ".git", ".next", "dist", "build", "out", ".turbo", ".pnpm-store", ".vercel", "coverage", ".agents", ".claude"]);
const MAX_DEPTH = 4;
const CONFIG_RE = /^(next|vite|webpack|rspack|rsbuild)\.config\.(js|mjs|cjs|ts|mts)$/;

const read = (p) => (existsSync(p) ? readFileSync(p, "utf8") : null);
const isDir = (p) => existsSync(p) && statSync(p).isDirectory();
const list = (p) => (isDir(p) ? readdirSync(p).sort() : []);

function readJson(p) {
  const text = read(p);
  if (text === null) return { missing: true };
  try {
    return { value: JSON.parse(text) };
  } catch {
    return { error: "invalid JSON" };
  }
}

function packageManager(root, pkg) {
  if (existsSync(join(root, "pnpm-lock.yaml"))) return "pnpm";
  if (existsSync(join(root, "bun.lock")) || existsSync(join(root, "bun.lockb"))) return "bun";
  if (existsSync(join(root, "yarn.lock"))) return "yarn";
  if (existsSync(join(root, "package-lock.json"))) return "npm";
  const field = pkg?.packageManager?.split("@")[0];
  return ["pnpm", "npm", "yarn", "bun"].includes(field) ? field : null;
}

// `packages:` list from pnpm-workspace.yaml; [] when the file only holds settings.
function pnpmWorkspaceGlobs(root) {
  const text = read(join(root, "pnpm-workspace.yaml"));
  if (!text) return [];
  const globs = [];
  let inPackages = false;
  for (const line of text.split("\n")) {
    if (/^packages:\s*$/.test(line)) inPackages = true;
    else if (/^\S/.test(line)) inPackages = false;
    else if (inPackages) {
      const m = line.match(/^\s*-\s*["']?([^"'#]+?)["']?\s*$/);
      if (m) globs.push(m[1]);
    }
  }
  return globs;
}

// Expand "apps/*" style globs (one level) and literal paths to dirs holding a package.json.
function expandGlobs(root, globs) {
  const out = new Set();
  for (const g of globs) {
    if (g.startsWith("!")) continue;
    const clean = g.replace(/\/\*\*?$/, "/*");
    if (clean.endsWith("/*")) {
      const base = clean.slice(0, -2);
      for (const name of list(join(root, base))) {
        if (existsSync(join(root, base, name, "package.json"))) out.add(`${base}/${name}`);
      }
    } else if (existsSync(join(root, clean, "package.json"))) out.add(clean);
  }
  return [...out].sort();
}

function deps(pkg) {
  return { ...pkg?.dependencies, ...pkg?.devDependencies, ...pkg?.peerDependencies };
}

function framework(pkg) {
  const d = deps(pkg);
  if (d["react-native"]) return "react-native";
  if (d.next) return "next";
  if (d.vite) return "vite";
  const s = pkg?.scripts ?? {};
  if (s.dev || s.start) return "node";
  return "lib";
}

function port(pkg, fw) {
  const s = pkg?.scripts ?? {};
  const cmd = s.dev ?? s.start ?? "";
  const m = cmd.match(/(?:-p|--port)[\s=]+(\d+)/) ?? cmd.match(/PORT=(\d+)/);
  if (m) return Number(m[1]);
  if (fw === "next") return 3000;
  if (fw === "vite") return 5173;
  return null;
}

const TYPECHECK_NAMES = ["typecheck", "type-check", "check-types", "tsc"];

function scriptFlags(pkg) {
  const names = Object.keys(pkg?.scripts ?? {});
  const has = (...keys) => keys.some((k) => names.includes(k));
  return {
    lint: has("lint"),
    test: has("test"),
    typecheck: has(...TYPECHECK_NAMES),
    format: has("format", "format:check"),
    knip: has("knip"),
    e2e: has("test:e2e", "e2e"),
  };
}

function moduleFederation(dir, pkg) {
  const usesDep = Object.keys(deps(pkg)).some((k) => k.startsWith("@module-federation/"));
  const configs = list(dir).filter((f) => CONFIG_RE.test(f)).map((f) => read(join(dir, f)));
  const text = configs.find((c) => /ModuleFederationPlugin|federation\s*\(/.test(c));
  if (!usesDep && !text) return null;
  const src = text ?? "";
  const role = /\bremotes\s*:/.test(src) ? "host" : /\bexposes\s*:/.test(src) ? "remote" : "unknown";
  const block = src.match(/\bshared\s*:\s*(\[[^\]]*\]|\{[^}]*\})/)?.[1] ?? "";
  const shared = block.startsWith("[")
    ? [...block.matchAll(/["']([^"']+)["']/g)].map((m) => m[1])
    : [...block.matchAll(/(?:["']([^"']+)["']|([\w@/-]+))\s*:/g)].map((m) => m[1] ?? m[2]);
  return { role, shared };
}

function describePackage(root, path) {
  const dir = join(root, path);
  const pkg = readJson(join(dir, "package.json")).value ?? {};
  const fw = framework(pkg);
  const srcDir = isDir(join(dir, "src")) ? "src" : ".";
  return {
    path,
    name: pkg.name ?? null,
    framework: fw,
    srcDir,
    appRouter: isDir(join(dir, srcDir, "app")),
    port: port(pkg, fw),
    scripts: scriptFlags(pkg),
    typecheckScript: TYPECHECK_NAMES.find((n) => pkg.scripts?.[n]) ?? null,
    moduleFederation: moduleFederation(dir, pkg),
  };
}

function findFiles(root, names, dir = root, depth = 0, out = []) {
  for (const entry of list(dir)) {
    const p = join(dir, entry);
    if (isDir(p)) {
      if (!SKIP.has(entry) && depth < MAX_DEPTH) findFiles(root, names, p, depth + 1, out);
    } else if (names.includes(entry)) out.push(relative(root, p));
  }
  return out;
}

function rulePaths(text) {
  const fm = text.match(/^---\n([\s\S]*?)\n---/)?.[1];
  if (!fm) return null;
  const inline = fm.match(/^paths:\s*["']?([^"'\n]+?)["']?\s*$/m);
  if (inline && inline[1].trim()) return [inline[1].trim()];
  const block = fm.match(/^paths:\s*\n((?:\s*-.*\n?)+)/m)?.[1];
  if (!block) return null;
  return [...block.matchAll(/-\s*["']?([^"'\n]+?)["']?\s*$/gm)].map((m) => m[1]);
}

function settings(root) {
  const r = readJson(join(root, ".claude", "settings.json"));
  if (r.error) return { error: r.error };
  const s = r.value ?? {};
  const perms = s.permissions ?? {};
  return {
    exists: !r.missing,
    schema: typeof s.$schema === "string",
    allow: perms.allow?.length ?? 0,
    ask: perms.ask?.length ?? 0,
    deny: perms.deny?.length ?? 0,
    hooks: Object.keys(s.hooks ?? {}),
  };
}

// .git is a folder in a normal clone and a "gitdir:" file in a worktree, whose config lives in commondir.
function gitConfig(root) {
  const dotGit = join(root, ".git");
  if (isDir(dotGit)) return read(join(dotGit, "config"));
  const gitdir = read(dotGit)?.match(/^gitdir:\s*(.+)$/m)?.[1].trim();
  if (!gitdir) return null;
  const dir = resolve(root, gitdir);
  const common = read(join(dir, "commondir"))?.trim();
  return read(join(common ? resolve(dir, common) : dir, "config"));
}

function harness(root) {
  const claude = join(root, ".claude");
  const hooksPath = gitConfig(root)?.match(/hooksPath\s*=\s*(.+)/)?.[1].trim() ?? null;
  return {
    claudeMd: findFiles(root, ["CLAUDE.md"]),
    agentsMd: findFiles(root, ["AGENTS.md"]),
    rules: list(join(claude, "rules"))
      .filter((f) => f.endsWith(".md"))
      .map((file) => ({ file, paths: rulePaths(read(join(claude, "rules", file))) })),
    settings: settings(root),
    hooks: list(join(claude, "hooks")).map((file) => ({
      file,
      executable: (statSync(join(claude, "hooks", file)).mode & 0o111) !== 0,
    })),
    gitHooks: { dir: isDir(join(root, ".githooks")), hooksPath, files: list(join(root, ".githooks")) },
    commitlint: list(root).some((f) => f.startsWith("commitlint.config") || f.startsWith(".commitlintrc")),
    mcp: Object.keys(readJson(join(root, ".mcp.json")).value?.mcpServers ?? {}),
    skills: list(join(claude, "skills")).filter((f) => isDir(join(claude, "skills", f))),
  };
}

export function detect(rootDir) {
  const root = resolve(rootDir);
  const pkgJson = readJson(join(root, "package.json"));
  const pkg = pkgJson.value;
  const report = {
    root,
    supported: true,
    unsupportedReason: null,
    packageManager: packageManager(root, pkg),
    topology: "single",
    monorepoTool: null,
    packages: [],
    harness: harness(root),
  };
  const unsupported = (reason) => Object.assign(report, { supported: false, unsupportedReason: reason });

  if (pkgJson.missing) return unsupported("No package.json at the root: not a JS/TS project.");
  if (pkgJson.error) return unsupported("package.json is invalid JSON.");
  if (existsSync(join(root, "nx.json"))) return unsupported("Nx monorepos are not supported yet.");
  if (existsSync(join(root, "microfrontends.json"))) return unsupported("Vercel Microfrontends is not supported yet.");

  const pnpmGlobs = pnpmWorkspaceGlobs(root);
  const ws = Array.isArray(pkg.workspaces) ? pkg.workspaces : pkg.workspaces?.packages ?? [];
  const globs = pnpmGlobs.length ? pnpmGlobs : ws;
  const turbo = existsSync(join(root, "turbo.json"));

  if (turbo || globs.length) {
    report.topology = "monorepo";
    report.monorepoTool = turbo ? "turbo" : pnpmGlobs.length ? "pnpm" : report.packageManager ?? "npm";
    report.packages = expandGlobs(root, globs).map((p) => describePackage(root, p));
  } else {
    report.packages = [describePackage(root, ".")];
  }

  const rn = report.packages.find((p) => p.framework === "react-native");
  if (rn) unsupported(`React Native (${rn.path}) is not supported yet.`);
  return report;
}

// import.meta.url is the resolved path; argv[1] may be a symlink (skills installed via .claude/skills -> .agents/skills).
if (process.argv[1] && import.meta.url === pathToFileURL(realpathSync(process.argv[1])).href) {
  console.log(JSON.stringify(detect(process.argv[2] ?? process.cwd()), null, 2));
}
