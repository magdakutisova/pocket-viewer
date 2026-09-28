/**
 * Spot-checks what the seed actually wrote, from the database rather than from
 * the transform that produced it. Ticket 06's last acceptance criterion.
 *
 *     node --env-file=.env.local scripts/verify-seed.ts
 */

import { createClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL!;
const db = createClient(url, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
});

/**
 * PostgREST caps a single select at 1000 rows, so anything that reasons over
 * the whole collection has to walk it — ordered, or the pages are not stable.
 */
async function all<T>(table: string, select: string, order: string): Promise<T[]> {
    const rows: T[] = [];

    for (let from = 0; ; from += 1000) {
        const { data, error } = await db
            .from(table)
            .select(select)
            .order(order, { ascending: true })
            .range(from, from + 999);

        if (error) throw new Error(`Reading ${table} failed: ${error.message}`);
        rows.push(...(data as unknown as T[]));
        if (data.length < 1000) return rows;
    }
}

// Joined here rather than with a PostgREST embed: the relations are composite
// foreign keys on (id, owner_id), which PostgREST does not infer a relationship
// from. Worth knowing before ticket 07 reaches for `recipe(*, category(*))`.
const links = await all<{ recipe_id: string; category_id: string }>(
    "recipe_category",
    "recipe_id, category_id",
    "recipe_id",
);
const recipeRows = await all<{ id: string; name: string; saved_at: string }>(
    "recipe",
    "id, name, saved_at",
    "id",
);
const categoryRows = await all<{ id: string; name: string }>("category", "id, name", "id");

console.log(`Recipe–Category links read back: ${links.length}`);

const categoryName = new Map(categoryRows.map((row) => [row.id, row.name]));
const recipeRow = new Map(recipeRows.map((row) => [row.id, row]));

const byRecipe = new Map<string, { name: string; saved_at: string; categories: string[] }>();
for (const row of links) {
    const recipe = recipeRow.get(row.recipe_id)!;
    const entry = byRecipe.get(row.recipe_id)
        ?? { name: recipe.name, saved_at: recipe.saved_at, categories: [] };
    entry.categories.push(categoryName.get(row.category_id)!);
    byRecipe.set(row.recipe_id, entry);
}

const withSeveral = [...byRecipe.values()].filter((r) => r.categories.length > 1);
console.log(`Recipes linked to more than one Category: ${withSeveral.length}`);
for (const recipe of withSeveral.slice(0, 3)) {
    console.log(`  ${recipe.name}\n    -> ${recipe.categories.sort().join(" · ")}`);
}

// The comma-named Category is one Category, not two.
const commaNamedId = categoryRows.find((row) => row.name === "marmelády, zavařování")?.id;
const commaNamed = links.filter((row) => row.category_id === commaNamedId).length;
console.log(`\n"marmelády, zavařování" exists as one Category: ${commaNamedId !== undefined}`);
console.log(`  recipes in it: ${commaNamed}`);
console.log(`  a Category named just "marmelády": ${categoryRows.some((r) => r.name === "marmelády")}`);

// Dates are the nine years of collecting, not the day of the import.
const { data: oldest } = await db
    .from("recipe")
    .select("name, saved_at")
    .order("saved_at", { ascending: true })
    .limit(1);
const { data: newest } = await db
    .from("recipe")
    .select("name, saved_at")
    .order("saved_at", { ascending: false })
    .limit(1);
console.log(`\nSaved dates span ${oldest![0].saved_at} .. ${newest![0].saved_at}`);

// The uncategorised are present and reachable, not silently dropped.
const { count: total } = await db.from("recipe").select("*", { count: "exact", head: true });
console.log(`Recipes with no Category at all: ${total! - byRecipe.size}`);

// A Source that answers to two hosts is one shelf entry.
const { data: hosts } = await db.from("source_host").select("source_id, host");
const hostsBySource = new Map<string, string[]>();
for (const row of hosts ?? []) {
    hostsBySource.set(row.source_id, [...(hostsBySource.get(row.source_id) ?? []), row.host]);
}
const twins = [...hostsBySource.values()].filter((list) => list.length > 1);
console.log(`\nSources answering to more than one host: ${twins.length}`);
console.log(`  e.g. ${twins[0]?.sort().join("  +  ")}`);

// Favourite implying Tried is checked by hand, not here: confirming it means
// writing to the collection, and a script that reads should not also write.
// Run this in the SQL editor to see the database repair the contradiction:
//
//   update recipe set favourite = true, tried = false where id = '<some id>'
//     returning tried, favourite;   -- both come back true

