/**
 * Orphan modules — code in src/ that nothing reaches.
 *
 * Builds the import graph from the real entry points (index.ts, App.tsx, and every
 * screen registered in the navigators) and reports what is never reached. This is how
 * ~666 lines of parallel sync adapters sat in the tree importing only each other,
 * indistinguishable from working code in every review.
 *
 * Test files are excluded as importers: a module whose ONLY inbound edge is its own test
 * is still an orphan, and counting the test would hide exactly the case worth seeing.
 */
import { read, sourceFiles, isFile, exists, finding, RESULT } from "./lib.mjs";
import { dirname, join, normalize } from "node:path";

const ENTRY_POINTS = ["index.ts", "App.tsx"];

const CANDIDATE_SUFFIXES = ["", ".ts", ".tsx", "/index.ts", "/index.tsx"];

/** Resolve a relative or @/ import specifier to a repo-relative source path. */
function resolveImport(fromFile, spec) {
  let base;
  if (spec.startsWith("@/")) base = join("src", spec.slice(2));
  else if (spec.startsWith(".")) base = normalize(join(dirname(fromFile), spec));
  else return null; // node_modules
  for (const suffix of CANDIDATE_SUFFIXES) {
    const cand = base + suffix;
    // isFile, not exists: `./memory` matches the directory src/features/ai/memory,
    // and returning that made the reader throw EISDIR.
    if (isFile(cand)) return cand;
  }
  return null;
}

function importsOf(file) {
  const src = read(file);
  if (!src) return [];
  const specs = [
    ...src.matchAll(/(?:from|import)\s*["']([^"']+)["']/g),
    ...src.matchAll(/require\(\s*["']([^"']+)["']\s*\)/g),
  ].map((m) => m[1]);
  return [...new Set(specs)]
    .map((s) => resolveImport(file, s))
    .filter(Boolean);
}

export function collect() {
  const all = sourceFiles().filter((f) => !/\.test\.(ts|tsx)$/.test(f));

  // Roots: the app entry points. Everything else must be reachable from them.
  const roots = ENTRY_POINTS.filter(exists);

  const reached = new Set();
  const queue = [...roots];
  while (queue.length) {
    const cur = queue.pop();
    if (reached.has(cur)) continue;
    reached.add(cur);
    for (const dep of importsOf(cur)) if (!reached.has(dep)) queue.push(dep);
  }

  const orphans = all.filter((f) => !reached.has(f));

  // Group orphans that import each other — an isolated cluster is a parallel
  // implementation, which reads very differently from a few stray files.
  const orphanSet = new Set(orphans);
  const clusters = [];
  const seen = new Set();
  for (const o of orphans) {
    if (seen.has(o)) continue;
    const cluster = [];
    const q = [o];
    while (q.length) {
      const cur = q.pop();
      if (seen.has(cur)) continue;
      seen.add(cur);
      cluster.push(cur);
      for (const dep of importsOf(cur)) if (orphanSet.has(dep) && !seen.has(dep)) q.push(dep);
      for (const other of orphans) {
        if (!seen.has(other) && importsOf(other).includes(cur)) q.push(other);
      }
    }
    clusters.push(cluster.sort());
  }

  const findings = [];
  for (const cluster of clusters) {
    const lines = cluster.reduce((n, f) => n + (read(f)?.split("\n").length ?? 0), 0);
    if (cluster.length >= 3) {
      findings.push(
        finding(
          "defect",
          `${cluster.length} mutually-importing modules (~${lines} lines) are unreachable from the app`,
          `These import each other and nothing else imports any of them — a parallel implementation sitting beside the real one: ${cluster.join(", ")}`,
          cluster[0],
        ),
      );
    } else {
      for (const f of cluster) {
        findings.push(
          finding(
            "drift",
            `${f} is unreachable from the app entry points`,
            `~${read(f)?.split("\n").length ?? 0} lines, imported by nothing reachable from ${roots.join(" / ")}.`,
            f,
          ),
        );
      }
    }
  }

  return RESULT(
    "orphans",
    findings,
    `${reached.size} of ${all.length} modules reachable; ${orphans.length} orphaned across ${clusters.length} clusters`,
    { orphans, roots },
  );
}
