#!/usr/bin/env node
/**
 * Probe runner — `npm run probes`.
 *
 * Writes docs/product/probe-snapshot.json and prints a human summary. This is /arbi
 * Step 1: it is what makes the brief factual rather than vibes. The snapshot is
 * committed on purpose, so movement between wakes shows up as a diff.
 *
 * Deterministic: no AI, no network, no secrets. Safe to run from CI and from an
 * unattended wake.
 *
 * Exit code is ALWAYS 0. These probes report; they do not gate. Wiring them into CI as
 * a blocking check would mean the repo could not merge anything until every pre-existing
 * defect was fixed, and the pressure would go into silencing probes rather than fixing
 * code. `npm run check` is the gate; this is the instrument.
 */
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { execSync } from "node:child_process";
import { ROOT } from "./lib.mjs";

import * as reachability from "./reachability.mjs";
import * as orphans from "./orphans.mjs";
import * as stubs from "./stubs.mjs";
import * as roadmapClaims from "./roadmap-claims.mjs";
import * as schemaDrift from "./schema-drift.mjs";
import * as activation from "./activation.mjs";

const PROBES = [reachability, orphans, stubs, roadmapClaims, schemaDrift, activation];

/**
 * Probes that are deliberately absent, recorded so /arbi can say so in one clause and
 * move on. The pack tells arbi to declare a state-thin read when >=2 live probes are
 * unavailable. These two are not "unavailable" — they have no meaning for this project,
 * and counting them would make every brief state-thin forever.
 */
const NOT_APPLICABLE = {
  "service-health":
    "Nothing is deployed. The Supabase backend is deliberately unprovisioned and the app is offline-first.",
  "data-freshness":
    "There is no server-side data. The workout database lives on the user's device and is unreachable from CI.",
};

function git(cmd, fallback = "unknown") {
  try {
    return execSync(`git ${cmd}`, { cwd: ROOT, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
  } catch {
    return fallback;
  }
}

const results = [];
for (const probe of PROBES) {
  try {
    results.push(probe.collect());
  } catch (err) {
    // A probe that throws must say so loudly. A silent skip would let arbi report a
    // clean state it never actually measured, which is circuit breaker #10.
    results.push({
      name: probe.collect?.name ?? "unknown",
      status: "error",
      summary: `probe threw: ${err.message}`,
      findings: [],
    });
  }
}

const bySeverity = (sev) =>
  results.flatMap((r) => r.findings.filter((f) => f.severity === sev));

const snapshot = {
  capturedBy: "npm run probes",
  git: {
    branch: git("rev-parse --abbrev-ref HEAD"),
    head: git("rev-parse --short HEAD"),
    subject: git("log -1 --pretty=%s"),
    dirtyFiles: git("status --porcelain").split("\n").filter(Boolean).length,
    aheadOfMain: git("rev-list --count origin/main..HEAD", "0"),
  },
  probes: results,
  notApplicable: NOT_APPLICABLE,
  totals: {
    blocker: bySeverity("blocker").length,
    defect: bySeverity("defect").length,
    drift: bySeverity("drift").length,
    errored: results.filter((r) => r.status === "error").length,
  },
};

const OUT = join(ROOT, "docs/product/probe-snapshot.json");
writeFileSync(OUT, JSON.stringify(snapshot, null, 2) + "\n");

// ---- human summary -------------------------------------------------------------------
const BAR = "─".repeat(72);
console.log(BAR);
console.log(`probes · ${snapshot.git.branch} @ ${snapshot.git.head}`);
console.log(BAR);

for (const r of results) {
  const mark = r.status === "error" ? "!!" : r.findings.length ? "**" : "  ";
  console.log(`${mark} ${r.name.padEnd(16)} ${r.summary}`);
  for (const f of r.findings) {
    console.log(`      [${f.severity}] ${f.title}`);
    if (f.where) console.log(`               ${f.where}`);
  }
}

console.log(BAR);
console.log(
  `blockers ${snapshot.totals.blocker} · defects ${snapshot.totals.defect} · drift ${snapshot.totals.drift}` +
    (snapshot.totals.errored ? ` · PROBES ERRORED ${snapshot.totals.errored}` : ""),
);
console.log(`not applicable: ${Object.keys(NOT_APPLICABLE).join(", ")} (by design, not missing)`);
console.log(`snapshot -> docs/product/probe-snapshot.json`);

process.exit(0);
