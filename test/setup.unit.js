/**
 * Runs BEFORE the module graph loads (jest `setupFiles`, not `setupFilesAfterEnv`).
 *
 * src/lib/supabase.ts calls createClient() at module scope, and supabase-js throws
 * "supabaseUrl is required" on an empty string. Any test whose graph reaches that
 * module therefore dies at import time unless these are set first.
 *
 * These are throwaway values for a client that every test mocks. They are NOT a
 * real project — the app's Supabase backend is deliberately unprovisioned.
 */
process.env["EXPO_PUBLIC_SUPABASE_URL"] = "http://localhost:54321";
process.env["EXPO_PUBLIC_SUPABASE_ANON_KEY"] = "test-anon-key";
