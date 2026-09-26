import Papa from "papaparse";
import type { Category, Recipe } from "../domain";

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

/**
 * Pocket never captured a title for some recipes and repeated the URL in its
 * place. The slug is all we have to name them by, and it is enough.
 */
function parseName(title: string, url: string): string {
    if (title !== url) return title;

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

    const words = slug.replace(/[-_]+/g, " ").replace(/\s+/g, " ").trim();
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

/** Turns the text of a Pocket export into the Recipes it describes. Pure: no I/O, no network. */
export function parseExport(csvText: string): ParsedExport {
    const { data } = Papa.parse<ExportRow>(csvText, {
        header: true,
        skipEmptyLines: true,
    });

    const recipes = data.map((row) => ({
        name: parseName(row.title, row.url),
        url: row.url,
        savedAt: parseSavedAt(row.time_added),
        categories: parseCategories(row.tags),
    }));

    const names = new Set(recipes.flatMap((recipe) => recipe.categories));
    const categories = [...names].map((name) => ({ name }));

    return { recipes, categories };
}
