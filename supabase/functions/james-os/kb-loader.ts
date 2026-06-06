import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { KB_BUCKET, getKBPathsForCommand } from "./kb-manifest.ts";
import type { JamesOSCommand } from "./kb-manifest.ts";

/**
 * Loads KB files for a specific command from Supabase Storage.
 * Only fetches the files required by that command — not all 20 on every call.
 * Missing files are skipped with a console.warn — never throws.
 * Returns a concatenated context string ready for system prompt injection.
 */
export async function loadKBContext(command: JamesOSCommand): Promise<{ context: string; loaded: string[] }> {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is not set");
  }

  const client = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });

  const paths = getKBPathsForCommand(command);
  const sections: string[] = [];
  const loaded: string[] = [];

  for (const storagePath of paths) {
    try {
      const { data, error } = await client.storage.from(KB_BUCKET).download(storagePath);

      if (error || !data) {
        console.warn(`[kb-loader] Missing: ${storagePath} — skipping`);
        continue;
      }

      const text = await data.text();
      sections.push(text.trim());
      loaded.push(storagePath);
    } catch (err) {
      console.warn(`[kb-loader] Error fetching ${storagePath}: ${String(err)} — skipping`);
    }
  }

  if (sections.length === 0) {
    console.warn(`[kb-loader] No KB files loaded for command "${command}"`);
    return { context: "", loaded: [] };
  }

  return {
    context: sections.join("\n\n---\n\n"),
    loaded,
  };
}
