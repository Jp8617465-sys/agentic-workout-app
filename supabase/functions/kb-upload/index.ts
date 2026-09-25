import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });

  let body: { path?: string; content?: string; encoded?: boolean };
  try {
    body = await req.json();
  } catch (e) {
    return new Response(JSON.stringify({ error: "invalid JSON: " + String(e) }), {
      status: 400,
      headers: { ...CORS, "Content-Type": "application/json" },
    });
  }

  const { path, content, encoded } = body;
  if (!path || content === undefined) {
    return new Response(JSON.stringify({ error: "path and content required" }), {
      status: 400,
      headers: { ...CORS, "Content-Type": "application/json" },
    });
  }

  const client = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } }
  );

  let text: string;
  try {
    // encoded=true means content is plain base64 of UTF-8 text
    if (encoded) {
      const bytes = Uint8Array.from(atob(content), (c) => c.charCodeAt(0));
      text = new TextDecoder().decode(bytes);
    } else {
      text = content;
    }
  } catch (e) {
    return new Response(JSON.stringify({ error: "decode failed: " + String(e) }), {
      status: 500,
      headers: { ...CORS, "Content-Type": "application/json" },
    });
  }

  const blob = new Blob([text], { type: "text/markdown" });
  const { error } = await client.storage.from("james-os-kb").upload(path, blob, {
    contentType: "text/markdown",
    upsert: true,
  });

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...CORS, "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ ok: true, path }), {
    headers: { ...CORS, "Content-Type": "application/json" },
  });
});
