import { createClient, SupabaseClient } from "@supabase/supabase-js";

// Lazily create and return a server-only Supabase client using the service role key.
// This avoids throwing during build when the env var isn't present locally.
export function getSupabaseAdmin(): SupabaseClient {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) {
        throw new Error("SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_URL is not set in environment");
    }
    return createClient(url, key);
}

// Note: Do NOT import this file into client-side code.
