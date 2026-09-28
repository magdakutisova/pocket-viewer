import { useEffect, useState } from "react";
import { toCollection, type Collection } from "../supabase/collection";
import { supabase } from "../supabase/client";

export type CollectionState =
    | { status: "loading" }
    | { status: "ready"; collection: Collection }
    /** Said out loud, because an empty collection and a failed read look alike. */
    | { status: "failed"; message: string };

/**
 * The collection, fetched once when the app loads and then held in memory.
 *
 * One query: `public.collection()` returns the whole thing as a single row of
 * JSON. Everything a cook does to it afterwards — filter, search, sort, page —
 * runs over what is already here, so browsing stays instant on a slow kitchen
 * connection and the database is not consulted on every keystroke.
 */
export function useCollection(): CollectionState {
    const [state, setState] = useState<CollectionState>({ status: "loading" });

    useEffect(() => {
        let current = true;

        void (async () => {
            try {
                const { data, error } = await supabase().rpc("collection");
                if (error) throw error;

                const collection = toCollection(data);
                if (current) setState({ status: "ready", collection });
            } catch (error) {
                if (current) setState({ status: "failed", message: messageOf(error) });
            }
        })();

        // The collection outlives a re-render but not a sign-out; ignoring a
        // late reply keeps it from arriving after the session it belongs to.
        return () => {
            current = false;
        };
    }, []);

    return state;
}

function messageOf(error: unknown): string {
    return error instanceof Error ? error.message : String(error);
}
