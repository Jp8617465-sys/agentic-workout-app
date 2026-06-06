import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { KB_FILES, KB_BUCKET } from "./kb-manifest.ts";

/**
 * Fetches all KB files from Supabase Storage using the service role key.
 * Missing files are skipped with a console.warn — never throws for missing files.
 * Returns a single concatenated context string ready for injection into the system prompt.
 */
export async function loadKBContext(): Promise<string> {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is not set");
  }

  const client = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });

  const sections: string[] = [];

  for (const file of KB_FILES) {
    try {
      const { data, error } = await client.storage
        .from(KB_BUCKET)
        .download(file.key);

      if (error || !data) {
        console.warn(`[kb-loader] Missing KB file: ${file.key} — skipping`);
        continue;
      }

      const text = await data.text();
      sections.push(`## ${file.description}\n\n${text.trim()}`);
    } catch (err) {
      console.warn(`[kb-loader] Error fetching ${file.key}: ${String(err)} — skipping`);
    }
  }

  if (sections.length === 0) {
    console.warn("[kb-loader] No KB files loaded — coaching context will be minimal");
    return "";
  }

  return `# JAMES-OS Knowledge Base\n\n${sections.join("\n\n---\n\n")}`;
}
