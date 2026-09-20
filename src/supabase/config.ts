/** The credentials the browser needs to reach the Supabase project. */
export interface SupabaseConfig {
    url: string;
    /**
     * The publishable key. It is safe in the browser only because row-level
     * security stands behind it — never the service-role key, which bypasses it.
     */
    anonKey: string;
}

const URL_VAR = "VITE_SUPABASE_URL";
const ANON_KEY_VAR = "VITE_SUPABASE_ANON_KEY";

/**
 * Reads the project credentials from environment configuration.
 *
 * Throws, naming every variable at fault, rather than handing back a client
 * pointed at `undefined` that fails much later with an opaque network error.
 */
export function readSupabaseConfig(env: Record<string, unknown>): SupabaseConfig {
    const url = textAt(env, URL_VAR);
    const anonKey = textAt(env, ANON_KEY_VAR);

    const missing = [
        url ? null : URL_VAR,
        anonKey ? null : ANON_KEY_VAR,
    ].filter((name) => name !== null);

    if (missing.length > 0) {
        throw new Error(
            `Supabase is not configured: ${missing.join(", ")} ${missing.length === 1 ? "is" : "are"} missing. ` +
                `Copy .env.example to .env.local and fill in the project credentials — see docs/supabase-setup.md.`,
        );
    }

    if (looksLikeASecret(anonKey!)) {
        throw new Error(
            `${ANON_KEY_VAR} looks like a secret (service-role) key. That key bypasses row-level security and must never ` +
                `be built into the browser bundle. Use the project's publishable key instead.`,
        );
    }

    return { url: url!, anonKey: anonKey! };
}

/** Vite's env object carries booleans too, so a non-string reads as absent. */
function textAt(env: Record<string, unknown>, name: string): string | undefined {
    const value = env[name];
    return typeof value === "string" && value.trim() !== "" ? value.trim() : undefined;
}

function looksLikeASecret(key: string): boolean {
    return key.startsWith("sb_secret_") || key.includes("service_role");
}
