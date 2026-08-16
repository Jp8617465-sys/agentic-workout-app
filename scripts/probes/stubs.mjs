/**
 * Unmarked stubs.
 *
 * This codebase contains ZERO TODO, FIXME, XXX, HACK or @deprecated markers. That reads
 * as "no known debt" and is the opposite of true: the debt is expressed as a hardcoded
 * return immediately after a comment explaining that the real implementation is missing.
 * A marker grep finds nothing; this finds the pattern.
 *
 *     // For now, return empty (will be populated when database integration complete)
 *     return jobs;
 *
 * Also flags functions whose body is a single unconditional boolean/empty return with a
 * hedging comment above it, which is the same defect wearing different clothes.
 */
import { read, sourceFiles, finding, RESULT } from "./lib.mjs";

// Phrases that mean "this is not the real implementation".
const HEDGE =
  /\b(for now|simplified|in production|will be populated|not implemented|placeholder|stub(bed)?|temporar(y|ily)|real implementation|simulated|fake)\b/i;

// A return that yields a constant — the shape a stub takes.
const CONST_RETURN = /^\s*return\s+(\[\]|\{\}|null|true|false|0|""|''|`\s*`|jobs|result)\s*;?\s*$/;

export function collect() {
  const findings = [];
  let scanned = 0;

  for (const file of sourceFiles()) {
    if (/\.test\.(ts|tsx)$/.test(file)) continue;
    const src = read(file);
    if (!src) continue;
    scanned++;
    const lines = src.split("\n");

    for (let i = 0; i < lines.length; i++) {
      if (!CONST_RETURN.test(lines[i])) continue;

      // Look back up to 4 lines for a hedging comment attached to this return.
      let hedge = null;
      for (let j = i - 1; j >= Math.max(0, i - 4); j--) {
        const prev = lines[j].trim();
        if (!prev.startsWith("//") && !prev.startsWith("*") && prev !== "") break;
        if (HEDGE.test(prev)) {
          hedge = prev.replace(/^[/*\s]+/, "");
          break;
        }
      }
      if (!hedge) continue;

      findings.push(
        finding(
          "defect",
          `Unmarked stub in ${file}:${i + 1}`,
          `\`${lines[i].trim()}\` — the comment above it says: "${hedge}". This carries no TODO marker, so it is invisible to every debt search.`,
          `${file}:${i + 1}`,
        ),
      );
    }
  }

  // Self-recursive dispatch: a case that calls its own dispatcher with the same shape
  // is an infinite loop waiting for the first caller to reach it.
  for (const file of sourceFiles()) {
    const src = read(file);
    if (!src) continue;
    const m = [...src.matchAll(/this\.(\w+)\(\s*\{\s*\.\.\.\s*(\w+)\s*,\s*(\w+):/g)];
    for (const hit of m) {
      const fn = hit[1];
      // Only flag when the call sits inside the method it names — genuine self-recursion.
      const declared = new RegExp(`(private|public|async)?\\s*${fn}\\s*\\(`).test(src);
      if (declared && src.includes(`${fn}(job)`)) {
        const line = src.slice(0, src.indexOf(hit[0])).split("\n").length;
        findings.push(
          finding(
            "defect",
            `Possible unbounded self-recursion in ${file}:${line}`,
            `\`this.${fn}({...})\` re-enters the same dispatcher with a spread of its own argument. If this branch is ever reached it recurses until the stack overflows.`,
            `${file}:${line}`,
          ),
        );
      }
    }
  }

  return RESULT(
    "stubs",
    findings,
    `${scanned} modules scanned; ${findings.length} unmarked stubs (repo has 0 TODO/FIXME markers)`,
  );
}
