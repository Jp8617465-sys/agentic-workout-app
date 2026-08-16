/**
 * Shared helpers for the arbi probes.
 *
 * Written as native ESM (.mjs) rather than TypeScript on purpose: the repo has no TS
 * runner installed (no tsx, no ts-node), and adding a build dependency so a handful of
 * file-scanning scripts can have type annotations is a worse trade than losing them.
 * These run under plain `node` with zero install step, which is what makes them usable
 * from a CI job and from an unattended /arbi wake.
 */
import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { join, relative, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

export const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");

export function read(rel) {
  const p = join(ROOT, rel);
  return existsSync(p) ? readFileSync(p, "utf8") : null;
}

export function exists(rel) {
  return existsSync(join(ROOT, rel));
}

/** exists() AND is a regular file. A bare existsSync matches directories too, which
 *  made the import resolver return a directory and readFileSync throw EISDIR. */
export function isFile(rel) {
  const p = join(ROOT, rel);
  return existsSync(p) && statSync(p).isFile();
}

/** Find a file anywhere under src/ by bare basename. ROADMAP.md cites some files as
 *  `SetRow.tsx` rather than a full path, so a plain existence check misreports them
 *  as missing. */
export function findByBasename(name) {
  // Root-level config (package.json, tsconfig.json, app.json) is cited by bare name too,
  // and searching only src/ reported all three as missing.
  if (existsSync(join(ROOT, name))) return [name];
  return walk("src", (p) => p.endsWith("/" + name) || p === name);
}

/** Recursively list files under `rel` matching `test(path)`. Paths are repo-relative. */
export function walk(rel, test = () => true) {
  const base = join(ROOT, rel);
  if (!existsSync(base)) return [];
  const out = [];
  const visit = (dir) => {
    for (const entry of readdirSync(dir)) {
      if (entry === "node_modules" || entry.startsWith(".")) continue;
      const full = join(dir, entry);
      if (statSync(full).isDirectory()) visit(full);
      else {
        const r = relative(ROOT, full);
        if (test(r)) out.push(r);
      }
    }
  };
  visit(base);
  return out;
}

export const sourceFiles = () =>
  walk("src", (p) => /\.(ts|tsx)$/.test(p) && !/\.d\.ts$/.test(p));

/** Every match of `re` group 1, deduplicated. */
export function matchAll(text, re) {
  return [...new Set([...text.matchAll(re)].map((m) => m[1]))];
}

/** 1-indexed line number of the first occurrence of `needle`. */
export function lineOf(text, needle) {
  const idx = text.indexOf(needle);
  if (idx < 0) return null;
  return text.slice(0, idx).split("\n").length;
}

/**
 * A finding. `severity` drives how arbi ranks it:
 *   blocker — the activation gate cannot pass while this is true
 *   defect  — real and wrong, but not gating the gate
 *   drift   — docs or config disagree with the code
 */
export function finding(severity, title, detail, where = null) {
  return { severity, title, detail, where };
}

export const OK = (name, summary, extra = {}) => ({
  name,
  status: "ok",
  summary,
  findings: [],
  ...extra,
});

export const RESULT = (name, findings, summary, extra = {}) => ({
  name,
  status: findings.length ? "findings" : "ok",
  summary,
  findings,
  ...extra,
});
