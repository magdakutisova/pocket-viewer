/**
 * Seeds the database from the bundled Pocket export. Ticket 06.
 *
 * Run once, from a developer machine — there is no upload screen, because this
 * happens once:
 *
 *     npm run seed
 *
 * It does I/O only. Every decision about what the collection *is* — how
 * Categories split, how the 603 unnamed recipes get names, which blogs are one
 * blog — belongs to `src/import/parseExport.ts`, which is pure and tested. If a
 * recipe is miscategorised, it is miscategorised in the one place that has tests
 * around it.
 *
 * Safe to run repeatedly: every write is an upsert keyed on what makes a row
 * unique to its owner, so a second run leaves the same row counts as the first.
 */

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { parseExport } from "../src/import/parseExport.ts";
import { isSecretKey } from "../src/supabase/keys.ts";

/** Postgres takes these comfortably in one request; 3,357 recipes is 7 of them. */
const CHUNK = 500;

const TABLES = ["recipe_category", "recipe", "category", "source_host", "source"] as const;

async function main(): Promise<void> {
    const db = connect();
    const ownerId = await resolveOwner(db);

    const csv = readFileSync(
        fileURLToPath(new URL("../src/data/pocket.csv", import.meta.url)),
        "utf8",
    );
    const { recipes, categories, sources, summary } = parseExport(csv);

    const before = await countRows(db);

    // Sources first: a Recipe cannot exist without one to point at.
    await upsert(db, "source", "owner_id,primary_host", sources.map((source) => ({
        owner_id: ownerId,
        display_name: source.name,
        primary_host: source.hosts[0],
    })));

    const sourceIdByHost = await idsBy(db, "source", "primary_host", ownerId);
    resolve(sources, (source) => source.hosts[0], sourceIdByHost, "Sources");

    await upsert(db, "source_host", "owner_id,host", sources.flatMap((source) =>
        source.hosts.map((host) => ({
            owner_id: ownerId,
            host,
            source_id: sourceIdByHost.get(source.hosts[0])!,
        })),
    ));

    await upsert(db, "category", "owner_id,name", categories.map((category) => ({
        owner_id: ownerId,
        name: category.name,
    })));

    const categoryIdByName = await idsBy(db, "category", "name", ownerId);
    resolve(categories, (category) => category.name, categoryIdByName, "Categories");

    // A Recipe's Source is carried as its display name; resolve that back to the
    // host the row is keyed by, rather than assuming the two are the same string.
    const primaryHostByName = new Map(sources.map((source) => [source.name, source.hosts[0]]));

    // `tried`, `favourite` and `deleted_at` are deliberately absent. On a first
    // insert they take their column defaults; on a re-run they are left alone,
    // so re-importing cannot quietly undo what has been cooked or thrown away.
    await upsert(db, "recipe", "owner_id,url", recipes.map((recipe) => ({
        owner_id: ownerId,
        source_id: sourceIdByHost.get(primaryHostByName.get(recipe.source)!)!,
        name: recipe.name,
        url: recipe.url,
        saved_at: recipe.savedAt.toISOString(),
    })));

    const recipeIdByUrl = await idsBy(db, "recipe", "url", ownerId);
    resolve(recipes, (recipe) => recipe.url, recipeIdByUrl, "Recipes");

    await upsert(db, "recipe_category", "recipe_id,category_id", recipes.flatMap((recipe) =>
        recipe.categories.map((name) => ({
            owner_id: ownerId,
            recipe_id: recipeIdByUrl.get(recipe.url)!,
            category_id: categoryIdByName.get(name)!,
        })),
    ));

    report(before, await countRows(db), summary);
}

function connect(): SupabaseClient {
    const url = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !key) {
        throw new Error(
            "The seed needs SUPABASE_URL (or VITE_SUPABASE_URL) and SUPABASE_SERVICE_ROLE_KEY in " +
                ".env.local. The service-role key is a secret: it must never carry a VITE_ prefix, " +
                "which would compile it into the browser bundle. See docs/supabase-setup.md.",
        );
    }

    // Checked here rather than left to fail at the first admin call, which
    // reports only "User not allowed" and says nothing about which key is wrong.
    if (!isSecretKey(key)) {
        throw new Error(
            "SUPABASE_SERVICE_ROLE_KEY is not a secret key — it grants no more than the browser " +
                "already has, so the seed cannot write. Take the secret key from Project Settings " +
                "-> API Keys (it starts `sb_secret_`), or the legacy `service_role` JWT. The " +
                "publishable key and the legacy `anon` JWT are the ones that will not work.",
        );
    }

    // Row-level security is bypassed by this key, so every row below sets its
    // owner explicitly — `auth.uid()` is null here and the default would fail.
    return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

/** This is a single-person index, so the one user is the owner of everything. */
async function resolveOwner(db: SupabaseClient): Promise<string> {
    const { data, error } = await db.auth.admin.listUsers();
    if (error) throw error;

    const wanted = process.env.SEED_OWNER_EMAIL;
    if (wanted) {
        const user = data.users.find((candidate) => candidate.email === wanted);
        if (!user) throw new Error(`No user with the email ${wanted} exists in this project.`);
        return user.id;
    }

    if (data.users.length !== 1) {
        throw new Error(
            `Expected exactly one user in this project, found ${data.users.length}. ` +
                `Set SEED_OWNER_EMAIL to say whose collection this is.`,
        );
    }

    return data.users[0].id;
}

async function upsert(
    db: SupabaseClient,
    table: string,
    onConflict: string,
    rows: Record<string, unknown>[],
): Promise<void> {
    for (let at = 0; at < rows.length; at += CHUNK) {
        const { error } = await db
            .from(table)
            .upsert(rows.slice(at, at + CHUNK), { onConflict, ignoreDuplicates: false });

        if (error) throw new Error(`Seeding ${table} failed: ${error.message}`, { cause: error });
    }
}

/** Reads back the ids the database assigned, keyed by whatever identifies a row. */
async function idsBy(
    db: SupabaseClient,
    table: string,
    key: string,
    ownerId: string,
): Promise<Map<string, string>> {
    const found = new Map<string, string>();

    // Supabase caps a single select, so walk it rather than trusting one page.
    for (let from = 0; ; from += 1000) {
        // Ordered, because pagination over an unordered select is not stable:
        // Postgres promises no row order, and an upsert rewrites rows and moves
        // them, so a second run's pages would overlap and drop ids on the floor.
        const { data, error } = await db
            .from(table)
            .select("*")
            .eq("owner_id", ownerId)
            .order("id", { ascending: true })
            .range(from, from + 999);

        if (error) throw new Error(`Reading ${table} back failed: ${error.message}`);

        const rows: Record<string, string>[] = data;
        for (const row of rows) found.set(row[key], row.id);
        if (rows.length < 1000) return found;
    }
}

/**
 * Every row the transform produced must have come back with an id.
 *
 * Without this a gap arrives at Postgres as a not-null violation naming a
 * column, which says nothing about which recipe went missing or why.
 */
function resolve<T>(items: T[], keyOf: (item: T) => string, ids: Map<string, string>, what: string): void {
    const missing = items.filter((item) => !ids.has(keyOf(item)));

    if (missing.length > 0) {
        throw new Error(
            `${missing.length} of ${items.length} ${what} came back without an id — ` +
                `first missing: ${keyOf(missing[0])}. The collection was not fully written.`,
        );
    }
}

async function countRows(db: SupabaseClient): Promise<Record<string, number>> {
    const counts: Record<string, number> = {};

    for (const table of TABLES) {
        const { count, error } = await db.from(table).select("*", { count: "exact", head: true });
        if (error) throw new Error(`Counting ${table} failed: ${error.message}`);
        counts[table] = count ?? 0;
    }

    return counts;
}

function report(
    before: Record<string, number>,
    after: Record<string, number>,
    summary: { namesDerived: number; twinsCollapsed: number },
): void {
    const line = (label: string, table: string) => {
        const added = after[table] - before[table];
        console.log(
            `  ${label.padEnd(22)} ${String(after[table]).padStart(5)}` +
                `   (${added === 0 ? "no new rows" : `+${added} new`})`,
        );
    };

    console.log("\nImported the Pocket export.\n");
    line("Recipes", "recipe");
    line("Categories", "category");
    line("Sources", "source");
    line("  their hosts", "source_host");
    line("Recipe–Category links", "recipe_category");

    console.log(`\n  Names derived from URLs  ${String(summary.namesDerived).padStart(5)}`);
    console.log(`  TLD twins collapsed      ${String(summary.twinsCollapsed).padStart(5)}`);

    console.log(
        "\nExpected shape: about 3357 Recipes, 27 Categories, about 320 Sources.\n" +
            "A second run should add nothing.\n",
    );
}

try {
    await main();
} catch (error) {
    // A seed that fails should say why in one line, not bury it in a stack.
    console.error(`\nThe import did not run.\n\n  ${messageOf(error)}\n`);
    process.exit(1);
}

function messageOf(error: unknown): string {
    return error instanceof Error ? error.message : String(error);
}
