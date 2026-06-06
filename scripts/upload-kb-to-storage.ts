/**
 * Uploads KB files from scripts/kb/ to the james-os-kb Supabase Storage bucket.
 * Idempotent — upserts existing files.
 *
 * Usage:
 *   SUPABASE_URL=https://xxx.supabase.co \
 *   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key \
 *   npx ts-node --project tsconfig.node.json scripts/upload-kb-to-storage.ts
 */

import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import * as path from "path";

const BUCKET = "james-os-kb";
const KB_DIR = path.join(__dirname, "kb");

async function main(): Promise<void> {
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    console.error("ERROR: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set");
    process.exit(1);
  }

  const client = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });

  if (!fs.existsSync(KB_DIR)) {
    console.error(`ERROR: KB directory not found: ${KB_DIR}`);
    process.exit(1);
  }

  const files = fs.readdirSync(KB_DIR).filter((f) =>
    [".md", ".txt", ".json"].includes(path.extname(f))
  );

  if (files.length === 0) {
    console.warn("No KB files found in scripts/kb/ — nothing to upload");
    return;
  }

  console.log(`Uploading ${files.length} KB file(s) to ${BUCKET}...`);

  let uploaded = 0;
  let failed = 0;

  for (const filename of files) {
    const filePath = path.join(KB_DIR, filename);
    const content = fs.readFileSync(filePath);
    const mimeType = filename.endsWith(".json") ? "application/json" : "text/markdown";

    const { error } = await client.storage.from(BUCKET).upload(filename, content, {
      contentType: mimeType,
      upsert: true,
    });

    if (error) {
      console.error(`  FAIL  ${filename}: ${error.message}`);
      failed++;
    } else {
      console.log(`  OK    ${filename}`);
      uploaded++;
    }
  }

  console.log(`\nDone: ${uploaded} uploaded, ${failed} failed`);

  if (failed > 0) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("Unexpected error:", err);
  process.exit(1);
});
