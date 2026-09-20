/// <reference types="vite/client" />

interface ImportMetaEnv {
    /** The Supabase project URL. Supplied by .env.local; never committed. */
    readonly VITE_SUPABASE_URL?: string;
    /** The Supabase publishable key. Supplied by .env.local; never committed. */
    readonly VITE_SUPABASE_ANON_KEY?: string;
}
