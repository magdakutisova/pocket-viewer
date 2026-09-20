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

/** Turns the text of a Pocket export into the Recipes it describes. Pure: no I/O, no network. */
export function parseExport(csvText: string): ParsedExport {
    const { data } = Papa.parse<ExportRow>(csvText, {
        header: true,
        skipEmptyLines: true,
    });

    const recipes = data.map((row) => ({
        name: row.title,
        url: row.url,
        savedAt: parseSavedAt(row.time_added),
        categories: parseCategories(row.tags),
    }));

    const names = new Set(recipes.flatMap((recipe) => recipe.categories));
    const categories = [...names].map((name) => ({ name }));

    return { recipes, categories };
}
