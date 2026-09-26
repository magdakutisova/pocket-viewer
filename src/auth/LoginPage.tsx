import { useState } from "react";
import { supabase } from "../supabase/client";
import { UNREACHABLE, reasonForFailedSignIn } from "./signInFailure";

/**
 * The whole application when signed out. Nothing of the collection is rendered
 * behind it, and nothing is fetched — row-level security means there would be
 * nothing to fetch.
 */
export function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [signingIn, setSigningIn] = useState(false);

    async function signIn(event: React.FormEvent) {
        event.preventDefault();
        setError(null);
        setSigningIn(true);

        try {
            const { error } = await supabase().auth.signInWithPassword({ email, password });

            // On success the session arrives through useSession, which swaps
            // this page for the collection — nothing to do here but stop.
            if (error) {
                setError(
                    reasonForFailedSignIn({
                        status: error.status,
                        code: error.code,
                        message: error.message,
                    }),
                );
            }
        } catch {
            // A rejected request must still give the button back, or a dropped
            // connection leaves it saying "Přihlašuji…" forever.
            setError(UNREACHABLE);
        } finally {
            setSigningIn(false);
        }
    }

    // The `!` utilities below outrank the unlayered Vite starter rules still in
    // src/index.css (`body{display:flex}`, `h1{font-size:3.2em}`,
    // `button{background}`), which otherwise beat Tailwind's layered utilities.
    return (
        <div className="w-full min-h-screen flex items-center justify-center p-6">
            <form onSubmit={signIn} className="w-full max-w-sm">
                <h1 className="!text-2xl font-semibold mb-1">📚 Moje recepty</h1>
                <p className="text-sm opacity-70 mb-6">Přihlaste se ke své sbírce.</p>

                <label className="block mb-3">
                    <span className="block text-sm mb-1">E-mail</span>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        autoComplete="username"
                        required
                        className="border rounded px-3 py-2 w-full"
                    />
                </label>

                <label className="block mb-5">
                    <span className="block text-sm mb-1">Heslo</span>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        autoComplete="current-password"
                        required
                        className="border rounded px-3 py-2 w-full"
                    />
                </label>

                {error && (
                    <p role="alert" className="text-sm text-red-500 mb-4">
                        {error}
                    </p>
                )}

                <button
                    type="submit"
                    disabled={signingIn}
                    className="w-full rounded !bg-blue-600 text-white px-3 py-2 disabled:opacity-50"
                >
                    {signingIn ? "Přihlašuji…" : "Přihlásit se"}
                </button>
            </form>
        </div>
    );
}
