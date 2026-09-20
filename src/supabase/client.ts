import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { readSupabaseConfig } from "./config";

let client: SupabaseClient | null = null;

/**
 * The connection to the Supabase project.
 *
 * A function rather than a constant because the credentials come from
 * environment configuration and can be absent — a caller that reaches an
 * unconfigured project gets a readable error it can show, not a blank page.
 */
export function supabase(): SupabaseClient {
    client ??= createClient(...connectionFrom(import.meta.env));
    return client;
}

function connectionFrom(env: Record<string, unknown>) {
    const { url, anonKey } = readSupabaseConfig(env);

    return [
        url,
        anonKey,
        {
            auth: {
                // The session is kept so that a reload — or picking the phone
                // back up mid-cook — does not ask for the password again.
                persistSession: true,
                autoRefreshToken: true,
                detectSessionInUrl: true,
            },
        },
    ] as const;
}
