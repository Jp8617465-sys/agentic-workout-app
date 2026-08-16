#!/usr/bin/env node
/**
 * Probe acceptance test — `npm run probes:test`.
 *
 * Asserts the probes independently rediscover the four blockers that were found by hand
 * during the 2026-08-16 audit. This is the test that keeps the instrument honest: a probe
 * that quietly stops detecting is worse than no probe, because the brief keeps reporting
 * a clean state that nobody measured.
 *
 * These assertions are expected to START FAILING as the blockers get fixed. That is the
 * point — when one flips, delete its case here in the same commit that fixes the code,
 * so the pair moves together and the deletion is visible in review.
 */
import * as reachability from "./reachability.mjs";
import * as orphans from "./orphans.mjs";
import * as stubs from "./stubs.mjs";
import * as roadmapClaims from "./roadmap-claims.mjs";
import * as schemaDrift from "./schema-drift.mjs";
import * as activation from "./activation.mjs";

let pass = 0;
let fail = 0;

function assert(label, ok, detail = "") {
  if (ok) {
    console.log(`  ok   ${label}`);
    pass++;
  } else {
    console.log(`  FAIL ${label}${detail ? ` — ${detail}` : ""}`);
    fail++;
  }
}

const has = (result, substr) =>
  result.findings.some((f) => (f.title + " " + f.detail).includes(substr));

console.log("probe acceptance — the four blockers found by hand on 2026-08-16\n");

// Blockers 1 and 1b (no user identity established; a random id fabricated per
// workout) were fixed 2026-08-16 by /arbi-run Mission 1 — onboarding now mints
// and persists a real users row, and useWorkoutLifecycle fails loudly instead
// of fabricating an id. Cases removed here, per this file's own rule: delete a
// case in the same commit that fixes what it was guarding, so the pair moves
// together and the deletion is visible in review.

const act = activation.collect();

const claims = roadmapClaims.collect();
assert(
  "blocker 2: seedDatabase() exists, is marked ✅, and is called by nothing",
  has(act, "seedDatabase") && has(claims, "seed.ts"),
  "the exercise catalog orphan is no longer detected",
);

const reach = reachability.collect();
assert(
  "blocker 3a: MesocycleOverview is registered but unreachable",
  has(reach, "MesocycleOverview"),
  "reachability probe stopped detecting the stranded screen",
);
// Blocker 3b (Auth navigated to from outside its active branch) was fixed in
// the same Mission 1 — Auth moved from the pre-onboarding gate into the main
// navigator branch. Case removed, same rule as above.

const st = stubs.collect();
assert(
  "blocker 4a: sync-engine returns hardcoded values behind hedging comments",
  st.findings.filter((f) => f.where?.includes("sync-engine")).length >= 2,
  "stub probe stopped detecting the unmarked stubs (repo still has 0 TODO markers)",
);
assert(
  "blocker 4b: sync-engine has an unbounded self-recursion",
  has(st, "self-recursion"),
  "stub probe stopped detecting the infinite recursion",
);

const orph = orphans.collect();
assert(
  "blocker 4c: the six sync adapters form an unreachable cluster",
  has(orph, "mutually-importing"),
  "orphan probe stopped detecting the parallel sync implementation",
);

const drift = schemaDrift.collect();
assert(
  "schema: migrations run by the app are absent from the Drizzle journal",
  has(drift, "absent from the Drizzle journal"),
  "db:generate is only safe once this is fixed — losing the check loses the warning",
);

// Guard against the probes going quiet altogether.
assert(
  "no probe errored",
  [reach, orph, st, claims, drift, act].every((r) => r.status !== "error"),
);

console.log("");
if (fail) {
  console.log(`probe acceptance: ${pass} passed, ${fail} FAILED`);
  console.log("A failure here means either a blocker was fixed (delete the case) or a");
  console.log("probe silently stopped working (fix the probe). Never delete a case to");
  console.log("get green without confirming which.");
  process.exit(1);
}
console.log(`probe acceptance: ${pass} passed, 0 failed`);
