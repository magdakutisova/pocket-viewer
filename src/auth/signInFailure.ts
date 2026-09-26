export const UNREACHABLE = "Nepodařilo se spojit se serverem. Zkontrolujte připojení.";
export const REJECTED = "Přihlášení se nezdařilo. Zkontrolujte e-mail a heslo.";
export const UNCONFIRMED = "Účet zatím není potvrzený.";

/** The parts of a Supabase auth error that say what actually went wrong. */
export interface SignInFailure {
    status: number | undefined;
    code?: string;
    message?: string;
}

/**
 * Says why a sign-in failed, in the cook's language.
 *
 * Only a credentials error blames the credentials. A weak kitchen connection is
 * not a typo, and neither is a misconfigured project — reporting either as
 * "check your password" sends you looking in the wrong place, which is exactly
 * what happened with a project URL that carried the Data API path.
 */
export function reasonForFailedSignIn({ status, code, message }: SignInFailure): string {
    if (code === "invalid_credentials") return REJECTED;
    if (code === "email_not_confirmed") return UNCONFIRMED;

    // Status 0 or absent means the request never arrived; a 5xx is the server's
    // problem. Neither is worth re-typing a password over.
    const serverLookedAndSaidNo = status !== undefined && status >= 400 && status < 500;
    if (!serverLookedAndSaidNo) return UNREACHABLE;

    // A 4xx that is not about credentials: pass on what the server said rather
    // than inventing a cause.
    return message
        ? `Přihlášení se nezdařilo: ${message}`
        : `Přihlášení se nezdařilo (chyba ${status}).`;
}
