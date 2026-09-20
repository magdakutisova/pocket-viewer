export const UNREACHABLE = "Nepodařilo se spojit se serverem. Zkontrolujte připojení.";
export const REJECTED = "Přihlášení se nezdařilo. Zkontrolujte e-mail a heslo.";

/**
 * Tells a wrong password apart from an unreachable server, so that a weak
 * kitchen connection is not reported to the cook as a typo.
 *
 * Supabase rejects bad credentials with a 4xx, and only a 4xx means the server
 * looked and said no. A request that never arrived carries status 0 or none at
 * all, and a 5xx is the server's problem rather than yours — neither is worth
 * re-typing a password over.
 */
export function reasonForFailedSignIn(status: number | undefined): string {
    const serverLookedAndSaidNo = status !== undefined && status >= 400 && status < 500;
    return serverLookedAndSaidNo ? REJECTED : UNREACHABLE;
}
