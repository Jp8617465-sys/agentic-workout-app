-- 003_james_os_storage.sql
-- Creates the james-os-kb Storage bucket for KB files (profile, constraints, periodization, etc.)
-- The Edge Function fetches files at runtime using SUPABASE_SERVICE_ROLE_KEY — never hardcoded.

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'james-os-kb',
  'james-os-kb',
  false,
  5242880, -- 5 MB
  ARRAY['text/plain', 'text/markdown', 'application/json']
)
ON CONFLICT (id) DO NOTHING;

-- Service role can manage KB files (upload script + Edge Function writes)
CREATE POLICY "james_kb_service_role_all"
  ON storage.objects
  FOR ALL
  TO service_role
  USING (bucket_id = 'james-os-kb')
  WITH CHECK (bucket_id = 'james-os-kb');

-- Authenticated users can read KB files (Edge Function reads on behalf of auth'd user)
CREATE POLICY "james_kb_authenticated_select"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (bucket_id = 'james-os-kb');
