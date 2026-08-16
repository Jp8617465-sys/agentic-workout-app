/**
 * The Activation Gate — the six steps between "compiles" and "works".
 *
 *   James opens the app, it tells him what to train today, he logs it in under ten
 *   seconds a set, and it gets smarter every session — offline, on his own phone.
 *
 * Steps 1-4 are checked statically here. Steps 5-6 need a device this container cannot
 * run, so they are reported as UNVERIFIABLE rather than assumed — a gate that quietly
 * counts unchecked steps as passing is worse than no gate.
 */
import { read, sourceFiles, finding, RESULT } from "./lib.mjs";

function anyMatch(re, files) {
  for (const f of files) {
    const src = read(f);
    if (src && re.test(src)) return f;
  }
  return null;
}

export function collect() {
  const files = sourceFiles();
  const entry = ["App.tsx", "index.ts", ...files];
  const steps = [];
  const findings = [];

  // --- 1. migrations run on cold start -------------------------------------------------
  const migrates = anyMatch(/useDatabaseMigrations|useMigrations/, entry);
  steps.push({ step: 1, name: "migrations run on cold start", pass: !!migrates, where: migrates });

  // --- 2. onboarding mints a user id AND persists a users row --------------------------
  // setUser must be called with an `id`, and a users row must be inserted somewhere.
  // Matches both explicit (`{ id: x }`) and ES2015 shorthand (`{ id }`) forms — the
  // original explicit-only regex false-negatived on `setUser({ id })`, which is the more
  // idiomatic form when the key and value share a name.
  const setUserWithId = anyMatch(/setUser\(\s*\{[^}]*\bid\b\s*[:,}]/s, files);
  const insertsUser = anyMatch(/insert\(\s*users\s*\)|INSERT INTO\s+users/i, files);
  const step2 = !!setUserWithId && !!insertsUser;
  steps.push({ step: 2, name: "onboarding mints a user id and persists a users row", pass: step2 });
  if (!step2) {
    findings.push(
      finding(
        "blocker",
        "Activation step 2 fails: no user identity is ever established",
        `userStore starts \`id: null\`${setUserWithId ? "" : " and no setUser() call passes an id"}${insertsUser ? "" : "; no users row is ever inserted into SQLite"}. Every screen guards \`if (!userId) return\`, so the app renders empty shells after onboarding. PRAGMA foreign_keys is ON, so any workout insert would also violate the users FK.`,
        "src/stores/userStore.ts",
      ),
    );
  }

  // --- 3. the exercise catalog is actually loaded ---------------------------------------
  const seedDefined = anyMatch(/export\s+async\s+function\s+seedDatabase/, files);
  const seedCalled = anyMatch(/seedDatabase\s*\(/, entry.filter((f) => !/lib\/seed\.ts$/.test(f)));
  steps.push({ step: 3, name: "exercise library populated and searchable", pass: !!seedCalled });
  if (seedDefined && !seedCalled) {
    findings.push(
      finding(
        "blocker",
        "Activation step 3 fails: seedDatabase() is defined but never called",
        "src/lib/seed.ts loads a 1,367-line exercise catalog and a 247-line injury-risk matrix, and has zero call sites. The Exercise Library renders empty, FTS5 search returns nothing, and every set log violates the exercise_performances -> exercises foreign key.",
        "src/lib/seed.ts",
      ),
    );
  }

  // --- 4. a workout logs end to end with FKs intact -------------------------------------
  // Fabricating an id when the real one is missing guarantees an FK violation.
  const fabricated = [];
  for (const f of files) {
    const src = read(f);
    if (src && /userId\s*\?\?\s*generateId\(\)/.test(src)) {
      fabricated.push(`${f}:${src.slice(0, src.search(/userId\s*\?\?\s*generateId\(\)/)).split("\n").length}`);
    }
  }
  const step4 = step2 && !!seedCalled && fabricated.length === 0;
  steps.push({ step: 4, name: "a full workout logs end to end, FKs intact", pass: step4 });
  if (fabricated.length) {
    findings.push(
      finding(
        "blocker",
        "Activation step 4 fails: a random user id is fabricated per workout",
        `\`input.userId ?? generateId()\` at ${fabricated.join(", ")} masks the missing identity from step 2 instead of failing loudly, then writes a workout row whose user_id matches no users row. With foreign keys enabled that insert is invalid.`,
        fabricated[0],
      ),
    );
  }

  // --- 5 & 6: not checkable without a device -------------------------------------------
  steps.push({ step: 5, name: "data survives app restart", pass: null, note: "requires a device — not verifiable here" });
  steps.push({ step: 6, name: "daily brief reflects yesterday's session", pass: null, note: "requires a device — not verifiable here" });

  const passed = steps.filter((s) => s.pass === true).length;
  const checkable = steps.filter((s) => s.pass !== null).length;

  return RESULT(
    "activation",
    findings,
    `${passed}/${checkable} statically checkable steps pass (2 of 6 steps need a device and are unverified)`,
    { steps },
  );
}
