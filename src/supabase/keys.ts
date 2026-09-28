/**
 * Which Supabase key is which.
 *
 * A project issues two kinds. The publishable key is safe in the browser only
 * because row-level security stands behind it; the secret key bypasses that
 * entirely and must never leave a developer machine. Telling them apart is the
 * difference between a private collection and a public one, so it is decided
 * here once rather than guessed at each call site.
 *
 * Both the current format (`sb_publishable_…` / `sb_secret_…`) and the legacy
 * JWTs, whose role is encoded in the payload, are recognised.
 */
export function isSecretKey(key: string): boolean {
    if (key.startsWith("sb_secret_")) return true;
    if (key.startsWith("sb_publishable_")) return false;

    return roleOfLegacyKey(key) === "service_role";
}

/**
 * A legacy key is a JWT carrying its role in the payload. The role is base64 in
 * there, so searching the key for "service_role" as text never finds it — which
 * is why this decodes rather than matches.
 */
function roleOfLegacyKey(key: string): string | undefined {
    const payload = key.split(".")[1];
    if (!payload) return undefined;

    try {
        const decoded: unknown = JSON.parse(
            typeof atob === "function"
                ? atob(payload.replace(/-/g, "+").replace(/_/g, "/"))
                : Buffer.from(payload, "base64").toString("utf8"),
        );

        if (typeof decoded === "object" && decoded !== null && "role" in decoded) {
            const { role } = decoded as { role: unknown };
            return typeof role === "string" ? role : undefined;
        }
    } catch {
        // Not a JWT, or not one we can read. Claiming nothing is the safe answer:
        // the caller either refuses an unrecognised key or asks for a better one.
    }

    return undefined;
}
