import type { ReactNode } from "react";
import { supabase } from "../supabase/client";

/**
 * The frame around the collection once it is yours: who you are, and the way
 * out. Signing out is noticed by useSession, which puts the login page back.
 */
export function SignedIn({ email, children }: { email: string | undefined; children: ReactNode }) {
    return (
        <div className="w-full">
            <div className="max-w-3xl mx-auto px-6 pt-4 flex justify-end items-center gap-3 text-sm opacity-70">
                <span>{email}</span>
                <button
                    type="button"
                    onClick={() => void supabase().auth.signOut()}
                    className="underline !bg-transparent !p-0"
                >
                    Odhlásit se
                </button>
            </div>
            {children}
        </div>
    );
}
