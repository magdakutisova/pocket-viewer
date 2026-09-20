import type { Session } from "@supabase/supabase-js";
import { useEffect, useState } from "react";
import { supabase } from "../supabase/client";

export type SessionState =
    /** Restoring a stored session. Nothing is known yet either way. */
    | { status: "loading" }
    | { status: "signed-in"; session: Session }
    | { status: "signed-out" }
    /** The project credentials are missing or wrong; there is nothing to sign in to. */
    | { status: "misconfigured"; message: string };

/**
 * The single place the application learns whether it is signed in.
 *
 * Starts as `loading` while a stored session is restored, then tracks Supabase
 * for the rest of the session's life — a token refresh, a sign-out in another
 * tab, or an expiry all arrive here.
 */
export function useSession(): SessionState {
    const [state, setState] = useState<SessionState>({ status: "loading" });

    useEffect(() => {
        let client;
        try {
            client = supabase();
        } catch (error) {
            setState({ status: "misconfigured", message: messageFrom(error) });
            return;
        }

        const { data } = client.auth.onAuthStateChange((_event, session) => {
            setState(session ? { status: "signed-in", session } : { status: "signed-out" });
        });

        return () => data.subscription.unsubscribe();
    }, []);

    return state;
}

function messageFrom(error: unknown): string {
    return error instanceof Error ? error.message : String(error);
}
