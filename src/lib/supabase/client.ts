import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@db";

/** Supabase client for Client Components (anon key, RLS applies). */
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
