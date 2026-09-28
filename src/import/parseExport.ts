import Papa from "papaparse";
import type { Category, Recipe, Source } from "../domain";

/** Categories are separated by a pipe; a comma is an ordinary character in a Category name. */
const CATEGORY_SEPARATOR = "|";

/** One row of the Pocket export, named as the export names its columns. */
interface ExportRow {
    title: string;
    url: string;
    time_added: string;
    tags: string;
}

export interface ParsedExport {
    recipes: Recipe[];
    /** Every Category the collection holds, named once each. */
    categories: Category[];
    /** Every place the collection's recipes live, named once each. */
    sources: Source[];
    /** What the Import did to the collection on the way in. */
    summary: ImportSummary;
}

/**
 * The two repairs the Import makes that cannot be seen by counting the result.
 *
 * Both fail silently when their rule is wrong — a bad slug rule still produces a
 * name, and a bad twin rule still produces a shelf — so the numbers are printed
 * and checked against what the export is known to hold.
 */
export interface ImportSummary {
    /** Recipes Pocket never captured a title for, named from their URL instead. */
    namesDerived: number;
    /** Sources answering to more than one host: the TLD twins, collapsed into one. */
    twinsCollapsed: number;
}

function parseSavedAt(timeAdded: string): Date {
    return new Date(Number(timeAdded) * 1000);
}

function parseCategories(rawCategories: string): string[] {
    if (rawCategories.trim() === "") return [];

    return rawCategories
        .split(CATEGORY_SEPARATOR)
        .map((name) => name.trim())
        .filter((name) => name !== "");
}

const ENTITIES: Record<string, string> = {
    "&quot;": '"',
    "&apos;": "'",
    "&lt;": "<",
    "&gt;": ">",
    "&nbsp;": " ",
    "&amp;": "&",
};

/**
 * Some titles came out of Pocket HTML-escaped: `Tuňák &amp; ratatouille`. One
 * pass over the whole string, so `&amp;quot;` decodes to `&quot;` and stops
 * there rather than unravelling into a quotation mark.
 */
function decodeEntities(text: string): string {
    return text.replace(/&(?:#(\d+)|[a-z]+);/gi, (entity, codePoint: string | undefined) => {
        if (codePoint !== undefined) return String.fromCodePoint(Number(codePoint));

        return ENTITIES[entity.toLowerCase()] ?? entity;
    });
}

/**
 * Pocket never captured a title for some recipes and repeated the URL in its
 * place. The slug is all we have to name them by, and it is enough.
 */
function parseName(title: string, url: string): string {
    if (title !== url) return decodeEntities(title);

    let address;
    try {
        address = new URL(url);
    } catch {
        // Nothing to read a name out of. The row is still imported.
        return title;
    }

    const segments = address.pathname
        .split("/")
        .filter((segment) => segment !== "")
        .map(decodeSafely);

    // A segment that is only digits is a post id or a date, and names nothing.
    const fromPath = [...segments].reverse().find((segment) => !isOnlyDigits(segment))
        ?? segments[segments.length - 1];

    // Where no segment names anything — no path at all — the host has to do.
    const slug = fromPath === undefined
        ? address.hostname.replace(/^www\./, "")
        : withoutFileExtension(fromPath);

    // A long number in front of a slug is a post id. A short one is part of
    // the name — "7 layer bean dip", "100 calorie chocolate cake".
    const withoutPostId = slug.replace(/^\d{4,}[-_]/, "");

    const words = withoutPostId.replace(/[-_]+/g, " ").replace(/\s+/g, " ").trim();
    if (words === "") return title;

    return words.charAt(0).toUpperCase() + words.slice(1);
}

function isOnlyDigits(segment: string): boolean {
    return /^\d+$/.test(withoutFileExtension(segment));
}

function withoutFileExtension(segment: string): string {
    return segment.replace(/\.[a-z0-9]{2,5}$/i, "");
}

function decodeSafely(segment: string): string {
    try {
        return decodeURIComponent(segment);
    } catch {
        return segment;
    }
}

function parseHost(url: string): string {
    try {
        return new URL(url).hostname.toLowerCase().replace(/^www\./, "");
    } catch {
        // Not an address we can read. The row still imports, under its own name.
        return url.trim().toLowerCase();
    }
}

/**
 * Google retired `blogspot.cz` in favour of `blogspot.com` partway through nine
 * years of collecting, so 41 blogs answer to two hosts. Hosts sharing everything
 * but their last label are candidates for being the same place.
 */
function stemOf(host: string): string {
    return host.split(".").slice(0, -1).join(".");
}

function tldOf(host: string): string {
    return host.split(".").slice(-1)[0] ?? "";
}

/**
 * Two hosts on one stem are the same place when a country moved: `.cz` and
 * `.com`. Two generic TLDs on one stem — `.com` and `.org` — are as often two
 * owners as one, so they stay apart until merged by hand.
 */
function isOneBlogUnderTwoFlags(hosts: string[]): boolean {
    return hosts.some((host) => tldOf(host).length === 2);
}

/**
 * Builds the shelf: one Source per place, named after whichever of its hosts
 * holds the most recipes, deepest shelf entry first.
 */
function collectSources(hostOfEachRecipe: string[]): Source[] {
    const recipesPerHost = new Map<string, number>();
    for (const host of hostOfEachRecipe) {
        recipesPerHost.set(host, (recipesPerHost.get(host) ?? 0) + 1);
    }

    const byReach = (a: string, b: string) => {
        const difference = (recipesPerHost.get(b) ?? 0) - (recipesPerHost.get(a) ?? 0);

        return difference === 0 ? a.localeCompare(b) : difference;
    };

    const hostsPerStem = new Map<string, string[]>();
    for (const host of recipesPerHost.keys()) {
        const stem = stemOf(host);
        hostsPerStem.set(stem, [...(hostsPerStem.get(stem) ?? []), host]);
    }

    const shelf = [...hostsPerStem.values()].flatMap((onOneStem) =>
        onOneStem.length > 1 && !isOneBlogUnderTwoFlags(onOneStem)
            ? onOneStem.map((host) => [host])
            : [onOneStem],
    );

    return shelf
        .map((hosts) => {
            const sorted = [...hosts].sort(byReach);
            const recipeCount = sorted.reduce(
                (total, host) => total + (recipesPerHost.get(host) ?? 0),
                0,
            );

            return { name: sorted[0], hosts: sorted, recipeCount };
        })
        .sort((a, b) => b.recipeCount - a.recipeCount || a.name.localeCompare(b.name));
}

/** Turns the text of a Pocket export into the Recipes it describes. Pure: no I/O, no network. */
export function parseExport(csvText: string): ParsedExport {
    const { data } = Papa.parse<ExportRow>(csvText, {
        header: true,
        skipEmptyLines: true,
    });

    const sources = collectSources(data.map((row) => parseHost(row.url)));
    const sourceOfHost = new Map(
        sources.flatMap((source) => source.hosts.map((host) => [host, source.name])),
    );

    const recipes = data.map((row) => ({
        name: parseName(row.title, row.url),
        url: row.url,
        savedAt: parseSavedAt(row.time_added),
        categories: parseCategories(row.tags),
        source: sourceOfHost.get(parseHost(row.url))!,
    }));

    const names = new Set(recipes.flatMap((recipe) => recipe.categories));
    const categories = [...names].map((name) => ({ name }));

    const summary = {
        namesDerived: data.filter((row) => row.title === row.url).length,
        twinsCollapsed: sources.filter((source) => source.hosts.length > 1).length,
    };

    return { recipes, categories, sources, summary };
}
