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

    const origin = originOf(url!);

    if (looksLikeASecret(anonKey!)) {
        throw new Error(
            `${ANON_KEY_VAR} looks like a secret (service-role) key. That key bypasses row-level security and must never ` +
                `be built into the browser bundle. Use the project's publishable key instead.`,
        );
    }

    return { url: origin, anonKey: anonKey! };
}

/**
 * The project URL is an origin and nothing more — supabase-js appends
 * `/auth/v1/...` and `/rest/v1/...` to it itself.
 *
 * The Data API endpoint sits next to it in the dashboard and is easy to copy
 * instead. Left alone it produces `/rest/v1/auth/v1/token`, which PostgREST
 * answers with PGRST125 — an error that surfaces as a failed login and looks
 * nothing like a configuration fault.
 */
function originOf(url: string): string {
    let parsed: URL;
    try {
        parsed = new URL(url);
    } catch {
        throw new Error(
            `${URL_VAR} is not a URL: ${url}. It should be your project URL, like ` +
                `https://your-project-ref.supabase.co — see docs/supabase-setup.md.`,
        );
    }

    if (parsed.pathname !== "/" || parsed.search !== "" || parsed.hash !== "") {
        throw new Error(
            `${URL_VAR} should be the project URL — an origin with no path — but carries ` +
                `"${parsed.pathname}${parsed.search}${parsed.hash}". Use ${parsed.origin} instead. ` +
                `(The dashboard's Data API endpoint ends in /rest/v1; that is a different thing.)`,
        );
    }

    return parsed.origin;
}

/** Vite's env object carries booleans too, so a non-string reads as absent. */
function textAt(env: Record<string, unknown>, name: string): string | undefined {
    const value = env[name];
    return typeof value === "string" && value.trim() !== "" ? value.trim() : undefined;
}

function looksLikeASecret(key: string): boolean {
    return key.startsWith("sb_secret_") || key.includes("service_role");
}
