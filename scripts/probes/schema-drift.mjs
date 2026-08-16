/**
 * Schema drift across four independent sources of truth.
 *
 *   1. drizzle/meta/_journal.json      what drizzle-kit believes has been generated
 *   2. src/lib/migrate.ts              the migrations the APP actually runs, inlined as
 *                                      SQL strings in a hand-maintained object
 *   3. src/lib/schema.ts               the Drizzle table definitions used for queries
 *   4. supabase/migrations/*.sql       the Postgres side
 *
 * These have diverged. The journal lists one migration while migrate.ts hardcodes five;
 * 0002 and 0004 exist ONLY as inline strings with no .sql file and no snapshot, so
 * `npm run db:generate` would diff against a one-migration baseline and corrupt the
 * chain. Separately, agentic_memories and user_disagreements are created by migration
 * 0004 but absent from schema.ts, so Drizzle cannot see tables the app creates.
 */
import { read, walk, finding, RESULT } from "./lib.mjs";

const tablesFromSql = (sql) =>
  [...sql.matchAll(/CREATE TABLE(?: IF NOT EXISTS)?\s+[`"]?(\w+)[`"]?/gi)].map((m) =>
    m[1].toLowerCase(),
  );

export function collect() {
  const findings = [];

  // 1. journal
  const journalRaw = read("drizzle/meta/_journal.json");
  const journalTags = journalRaw
    ? (JSON.parse(journalRaw).entries ?? []).map((e) => e.tag)
    : [];

  // 2. migrate.ts — both the journal it declares and the SQL it actually carries
  const migrateSrc = read("src/lib/migrate.ts") ?? "";
  const appTags = [...migrateSrc.matchAll(/tag:\s*"([^"]+)"/g)].map((m) => m[1]);
  const appSqlKeys = [...migrateSrc.matchAll(/^\s{4}"([^"]+)":\s*`/gm)].map((m) => m[1]);
  const appTables = [...new Set(tablesFromSql(migrateSrc))];

  // 3. schema.ts
  const schemaSrc = read("src/lib/schema.ts") ?? "";
  const schemaTables = [
    ...new Set(
      [...schemaSrc.matchAll(/sqliteTable\(\s*["'](\w+)["']/g)].map((m) => m[1].toLowerCase()),
    ),
  ];

  // 4. supabase
  const pgTables = [
    ...new Set(
      walk("supabase/migrations", (p) => p.endsWith(".sql")).flatMap((f) =>
        tablesFromSql(read(f) ?? ""),
      ),
    ),
  ];

  // --- journal vs app ----------------------------------------------------------------
  const missingFromJournal = appTags.filter((t) => !journalTags.includes(t));
  if (missingFromJournal.length) {
    findings.push(
      finding(
        "blocker",
        `${missingFromJournal.length} migrations run by the app are absent from the Drizzle journal`,
        `src/lib/migrate.ts applies [${appTags.join(", ")}] but drizzle/meta/_journal.json lists only [${journalTags.join(", ") || "none"}]. Running \`npm run db:generate\` would diff the current schema against that stale baseline and regenerate migrations that already ran — corrupting the chain. Do not run db:generate until the journal is rebuilt.`,
        "drizzle/meta/_journal.json",
      ),
    );
  }

  const noSqlFile = appSqlKeys.filter(
    (tag) => !walk("drizzle", (p) => p.endsWith(".sql")).some((f) => f.includes(tag)),
  );
  if (noSqlFile.length) {
    findings.push(
      finding(
        "drift",
        `${noSqlFile.length} migrations exist only as inline strings in migrate.ts`,
        `[${noSqlFile.join(", ")}] have no .sql file under drizzle/ and no snapshot. They are unreviewable as migrations and invisible to drizzle-kit.`,
        "src/lib/migrate.ts",
      ),
    );
  }

  // --- app SQL vs Drizzle schema -----------------------------------------------------
  const notInSchema = appTables.filter((t) => !schemaTables.includes(t));
  if (notInSchema.length) {
    findings.push(
      finding(
        "defect",
        `${notInSchema.length} tables are created by migrations but missing from schema.ts`,
        `[${notInSchema.join(", ")}] are created at runtime but have no Drizzle definition, so every query against them must be raw SQL and none of it is type-checked.`,
        "src/lib/schema.ts",
      ),
    );
  }

  // --- local vs Postgres --------------------------------------------------------------
  const notInPg = schemaTables.filter((t) => !pgTables.includes(t));
  if (notInPg.length) {
    findings.push(
      finding(
        "drift",
        `${notInPg.length} local tables have no Postgres equivalent`,
        `[${notInPg.join(", ")}] exist in the local SQLite schema but in no supabase/migrations file. Sync could never push them. Expected while the backend is deliberately unprovisioned — it becomes a blocker the moment sync is switched on.`,
        "supabase/migrations/",
      ),
    );
  }

  return RESULT(
    "schema-drift",
    findings,
    `journal ${journalTags.length} · app ${appTags.length} · drizzle-schema ${schemaTables.length} tables · postgres ${pgTables.length} tables`,
    { journalTags, appTags, schemaTables, pgTables },
  );
}
