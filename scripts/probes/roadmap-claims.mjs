/**
 * Roadmap claims vs. reality.
 *
 * ROADMAP.md marks tasks ✅ and cites the files that implement them. This checks each
 * claim two ways:
 *
 *   1. Does the cited file exist?
 *   2. Is it imported by anything?
 *
 * The second question is the one that matters. src/lib/seed.ts exists, is 77 lines of
 * correct transactional code, loads a 1,367-line exercise catalog — and has zero call
 * sites anywhere in the repo. ROADMAP.md marks it ✅. A file-existence check passes; a
 * reachability check does not. "Written" and "wired up" are different claims and only
 * one of them is what ✅ means to a reader.
 */
import { read, sourceFiles, exists, findByBasename, finding, RESULT } from "./lib.mjs";

export function collect() {
  const roadmap = read("ROADMAP.md");
  if (!roadmap) {
    return RESULT("roadmap-claims", [], "ROADMAP.md not found — nothing to verify");
  }

  // Build the set of every path referenced by any import anywhere (plus entry points).
  const importedPaths = new Set();
  for (const f of [...sourceFiles(), "App.tsx", "index.ts"]) {
    const src = read(f);
    if (!src) continue;
    for (const m of src.matchAll(/(?:from|import|require\()\s*["']([^"']+)["']/g)) {
      importedPaths.add(m[1]);
    }
  }

  /** Is this file referenced by any import specifier? Matched on basename + parent dir. */
  function isImported(path) {
    const noExt = path.replace(/\.(ts|tsx|json)$/, "");
    const parts = noExt.split("/");
    const tail2 = parts.slice(-2).join("/");
    const tail1 = parts.at(-1);
    for (const spec of importedPaths) {
      const s = spec.replace(/\.(ts|tsx|json)$/, "");
      if (s.endsWith(tail2) || s.endsWith("/" + tail1) || s === tail1) return true;
    }
    return false;
  }

  const findings = [];
  let claims = 0;
  const missing = [];
  const orphanedClaims = [];

  for (const line of roadmap.split("\n")) {
    if (!line.includes("✅")) continue;
    // Cited files appear as `backticked/paths.ts`, possibly several per row.
    const cited = [...line.matchAll(/`([^`]+\.(?:ts|tsx|sql|json))`/g)].map((m) => m[1]);
    if (!cited.length) continue;

    const task = (line.split("|")[2] ?? line).trim().slice(0, 70);

    for (const cite of cited) {
      claims++;

      // ROADMAP cites some files by bare basename ("SetRow.tsx") and others by full
      // path. Resolve the basename form before declaring anything missing, or the probe
      // reports seven phantom absences and buries the one real finding.
      let path = cite;
      if (!cite.includes("/")) {
        const hits = findByBasename(cite);
        if (hits.length === 0) {
          missing.push({ path: cite, task });
          continue;
        }
        path = hits[0];
      } else if (!exists(cite)) {
        missing.push({ path: cite, task });
        continue;
      }

      // Screens are reached via navigation registration, not a plain import chain;
      // the reachability probe owns those, so skip them here to avoid double-reporting.
      if (/Screen\.tsx$/.test(path)) continue;
      if (!/\.(ts|tsx)$/.test(path)) continue;
      // supabase/functions/** is Deno code deployed to the edge — it is never imported
      // by the React Native bundle and is not expected to be.
      if (path.startsWith("supabase/")) continue;
      if (!isImported(path)) orphanedClaims.push({ path, task });
    }
  }

  for (const { path, task } of missing) {
    findings.push(
      finding("drift", `ROADMAP claims ✅ for a file that does not exist: ${path}`,
        `Task: "${task}"`, "ROADMAP.md"),
    );
  }

  // A file cited on several ✅ rows would otherwise be reported once per row.
  const seenClaim = new Set();
  for (const { path, task } of orphanedClaims.filter((c) => {
    if (seenClaim.has(c.path)) return false;
    seenClaim.add(c.path);
    return true;
  })) {
    findings.push(
      finding(
        "blocker",
        `ROADMAP claims ✅ but ${path} is imported by nothing`,
        `Task: "${task}". The file exists and may be perfectly correct, but nothing calls it — so the capability it claims is not actually present in the running app.`,
        path,
      ),
    );
  }

  // Cheap staleness signal: the roadmap's own "Last Updated" vs the newest commit.
  const stamp = roadmap.match(/\*\*Last Updated:\*\*\s*([0-9]{4}-[0-9]{2}-[0-9]{2})/);
  const extra = stamp ? { lastUpdated: stamp[1] } : {};

  return RESULT(
    "roadmap-claims",
    findings,
    `${claims} file claims behind ✅ rows; ${missing.length} missing, ${orphanedClaims.length} present-but-unreferenced`,
    extra,
  );
}
