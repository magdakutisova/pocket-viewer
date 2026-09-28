/**
 * Turns whatever was thrown into something worth putting on screen.
 *
 * Supabase rejects with a plain object carrying `message`, `hint`, `details`
 * and `code` — not an `Error` — so the usual `String(error)` renders the one
 * line that was meant to explain the failure as "[object Object]".
 */
export function describeFailure(error: unknown): string {
    if (error instanceof Error) return error.message;
    if (typeof error === "string" && error !== "") return error;

    if (typeof error === "object" && error !== null) {
        const { message, hint, code } = error as Record<string, unknown>;

        const said = [
            typeof message === "string" ? message : null,
            typeof hint === "string" ? hint : null,
        ].filter((part) => part !== null && part !== "");

        if (said.length > 0) {
            return typeof code === "string" ? `${said.join(" — ")} (${code})` : said.join(" — ");
        }

        if (typeof code === "string") return `The database refused the request (${code}).`;
    }

    return "Something went wrong, and whatever failed did not say what.";
}
