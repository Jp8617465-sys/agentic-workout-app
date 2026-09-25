/**
 * Uploads KB files from kb-source/ to the james-os-kb Supabase Storage bucket.
 *
 * Storage layout:
 *   james-os-kb/
 *   ├── kb/          ← 15 core reference files (F01–F15)
 *   └── programme/   ← 5 programme files (JAMES_OS_*)
 *
 * Idempotent — upserts on every run. Safe to re-run after file updates.
 *
 * Usage:
 *   SUPABASE_URL=https://hmomveujugqdtvwqzyqp.supabase.co \
 *   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key \
 *   npx ts-node --project tsconfig.node.json scripts/upload-kb-to-storage.ts
 *
 * To upload a single updated file:
 *   FILE=JAMES_OS_Meso2_v2.md <env vars> npx ts-node scripts/upload-kb-to-storage.ts
 */

import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import * as path from "path";

const BUCKET = "james-os-kb";
const SOURCE_DIR = path.join(__dirname, "..", "kb-source");

// Maps source filename → Storage path
const FILE_MAP: Record<string, string> = {
  "F01_Master_Index.md":               "kb/F01_Master_Index.md",
  "F02_Strength_and_Power.md":         "kb/F02_Strength_and_Power.md",
  "F03_Concurrent_Training.md":        "kb/F03_Concurrent_Training.md",
  "F04_Rehab.md":                      "kb/F04_Rehab.md",
  "F05_Nutrition.md":                  "kb/F05_Nutrition.md",
  "F06_Running_Mechanics.md":          "kb/F06_Running_Mechanics.md",
  "F07_Sleep_and_Recovery.md":         "kb/F07_Sleep_and_Recovery.md",
  "F08_Mental_Performance.md":         "kb/F08_Mental_Performance.md",
  "F09_Protocol_Library.md":           "kb/F09_Protocol_Library.md",
  "F10_Decision_Trees.md":             "kb/F10_Decision_Trees.md",
  "F11_Assessment_Frameworks.md":      "kb/F11_Assessment_Frameworks.md",
  "F12_Evidence_Appendix.md":          "kb/F12_Evidence_Appendix.md",
  "F13_Integration_Guide.md":          "kb/F13_Integration_Guide.md",
  "F14_Glossary_and_Standards.md":     "kb/F14_Glossary_and_Standards.md",
  "F15_Versioning.md":                 "kb/F15_Versioning.md",
  "JAMES_OS_Meso1_v2.md":             "programme/JAMES_OS_Meso1_v2.md",
  "JAMES_OS_Meso2_v2.md":             "programme/JAMES_OS_Meso2_v2.md",
  "JAMES_OS_Meso3_v2.md":             "programme/JAMES_OS_Meso3_v2.md",
  "JAMES_OS_Nutrition_Protocol_v1.md": "programme/JAMES_OS_Nutrition_Protocol_v1.md",
  "JAMES_OS_Recovery_Sleep_Protocol_v1.md": "programme/JAMES_OS_Recovery_Sleep_Protocol_v1.md",
};

async function main(): Promise<void> {
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const singleFile = process.env.FILE; // Optional: upload one file only

  if (!supabaseUrl || !serviceRoleKey) {
    console.error("ERROR: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set");
    process.exit(1);
  }

  if (!fs.existsSync(SOURCE_DIR)) {
    console.error(`ERROR: kb-source/ directory not found at ${SOURCE_DIR}`);
    console.error("Place the 20 KB markdown files in kb-source/ before running.");
    process.exit(1);
  }

  const client = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });

  const filesToUpload = singleFile
    ? { [singleFile]: FILE_MAP[singleFile] }
    : FILE_MAP;

  if (singleFile && !FILE_MAP[singleFile]) {
    console.error(`ERROR: Unknown file "${singleFile}". Must be one of:\n${Object.keys(FILE_MAP).join("\n")}`);
    process.exit(1);
  }

  const entries = Object.entries(filesToUpload);
  console.log(`\nUploading ${entries.length} file(s) to ${BUCKET}...\n`);

  let uploaded = 0;
  let failed = 0;
  const missing: string[] = [];

  for (const [filename, storagePath] of entries) {
    const localPath = path.join(SOURCE_DIR, filename);

    if (!fs.existsSync(localPath)) {
      console.warn(`  MISS  ${filename} (not found in kb-source/ — skipping)`);
      missing.push(filename);
      continue;
    }

    const content = fs.readFileSync(localPath);

    const { error } = await client.storage.from(BUCKET).upload(storagePath, content, {
      contentType: "text/markdown",
      upsert: true,
    });

    if (error) {
      console.error(`  FAIL  ${storagePath}: ${error.message}`);
      failed++;
    } else {
      console.log(`  OK    ${storagePath}`);
      uploaded++;
    }
  }

  console.log(`\n─────────────────────────────────`);
  console.log(`Uploaded: ${uploaded}  Failed: ${failed}  Missing: ${missing.length}`);

  if (missing.length > 0) {
    console.log(`\nMissing files (add to kb-source/ and re-run):\n${missing.map(f => `  - ${f}`).join("\n")}`);
  }

  if (failed > 0) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("Unexpected error:", err);
  process.exit(1);
});
