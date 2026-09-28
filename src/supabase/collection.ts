import type { Category, Recipe, Source } from "../domain";

/** The whole collection, as the app holds it in memory. */
export interface Collection {
    recipes: Recipe[];
    categories: Category[];
    sources: Source[];
}

/**
 * Reads what `public.collection()` returned into the domain model.
 *
 * The only thing that needs converting is the saved date — JSON has no date
 * type, and sorting nine years of collecting by a string would sort them by
 * their first character.
 *
 * Anything that does not look like a collection is refused rather than
 * tidied into an empty one. An empty collection and a failed read look the
 * same on screen, and only one of them should.
 */
export function toCollection(reply: unknown): Collection {
    if (!isShaped(reply)) {
        throw new Error(
            "The database did not return a collection. The app and the database may be out of " +
                "step — check that supabase/migrations have all been run.",
        );
    }

    return {
        recipes: reply.recipes.map(toRecipe),
        categories: reply.categories as Category[],
        sources: reply.sources as Source[],
    };
}

interface ShapedReply {
    recipes: Record<string, unknown>[];
    categories: unknown[];
    sources: unknown[];
}

function isShaped(reply: unknown): reply is ShapedReply {
    if (typeof reply !== "object" || reply === null) return false;

    const { recipes, categories, sources } = reply as Record<string, unknown>;

    return Array.isArray(recipes) && Array.isArray(categories) && Array.isArray(sources);
}

function toRecipe(row: Record<string, unknown>): Recipe {
    const savedAt = new Date(row.savedAt as string);

    if (Number.isNaN(savedAt.getTime())) {
        throw new Error(`Recipe "${String(row.name)}" has an unreadable saved date: ${String(row.savedAt)}`);
    }

    return {
        name: row.name as string,
        url: row.url as string,
        savedAt,
        categories: row.categories as string[],
        source: row.source as string,
    };
}
