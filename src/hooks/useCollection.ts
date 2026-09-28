import { useEffect, useState } from "react";
import { toCollection, type Collection } from "../supabase/collection";
import { supabase } from "../supabase/client";
import { describeFailure } from "../supabase/failure";

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
/**
 * The fetch in flight, shared by everyone who asks while it is still going.
 *
 * React mounts an effect twice in development, and both a remount and a second
 * reader would otherwise each fetch the whole collection. Cleared once it
 * settles, so a genuine later remount gets fresh data rather than this one.
 */
let inFlight: Promise<Collection> | null = null;

function fetchCollection(): Promise<Collection> {
    inFlight ??= (async () => {
        const { data, error } = await supabase().rpc("collection");
        if (error) throw error;

        return toCollection(data);
    })().finally(() => {
        inFlight = null;
    });

    return inFlight;
}

export function useCollection(): CollectionState {
    const [state, setState] = useState<CollectionState>({ status: "loading" });

    useEffect(() => {
        let current = true;

        void (async () => {
            try {
                const collection = await fetchCollection();
                if (current) setState({ status: "ready", collection });
            } catch (error) {
                if (current) setState({ status: "failed", message: describeFailure(error) });
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

