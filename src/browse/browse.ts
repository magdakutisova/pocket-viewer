import type { Category, Recipe } from "../domain";

/** What the cook is browsing: everything, some Categories, or the unfiled ones. */
export type CategoryFilter =
    | { kind: "all" }
    | { kind: "anyOf"; names: string[] }
    | { kind: "uncategorised" };

export type SortField = "name" | "savedAt" | "source" | "category";
export type SortDirection = "asc" | "desc";

export interface Sort {
    field: SortField;
    direction: SortDirection;
}

export interface BrowseCriteria {
    categories?: CategoryFilter;
    search?: string;
    /** The primary host of one Source, or null for all of them. */
    source?: string | null;
    sort?: Sort;
    page?: number;
    pageSize?: number;
}

/** Czech order, where Č sorts after C rather than after Z. */
function compareText(a: string, b: string): number {
    return a.localeCompare(b, "cs");
}

/**
 * A Recipe can hold several Categories, so it sorts under the first of them
 * alphabetically. An unfiled Recipe sorts last, whichever way the list runs.
 */
function firstCategory(recipe: Recipe): string | null {
    const [first] = [...recipe.categories].sort(compareText);

    return first ?? null;
}

function compareBy(field: SortField, a: Recipe, b: Recipe): number {
    switch (field) {
        case "name":
            return compareText(a.name, b.name);
        case "savedAt":
            return a.savedAt.getTime() - b.savedAt.getTime();
        case "source":
            return compareText(a.source, b.source);
        case "category":
            return compareText(firstCategory(a) ?? "", firstCategory(b) ?? "");
    }
}

/**
 * Cooking is one-handed: `svickova` has to find `Svíčková`. Folding both sides
 * the same way means it matches typed either way round.
 */
function fold(text: string): string {
    return text
        .normalize("NFD")
        .replace(/\p{Diacritic}/gu, "")
        .toLowerCase();
}

function matchesSearch(recipe: Recipe, search: string): boolean {
    const term = fold(search.trim());
    if (term === "") return true;

    return (
        fold(recipe.name).includes(term)
        || recipe.categories.some((name) => fold(name).includes(term))
    );
}

/**
 * Picks a Category on or off. Taking the last one off is a request to see
 * everything again, not to see nothing.
 */
export function toggleCategory(filter: CategoryFilter, name: string): CategoryFilter {
    const picked = filter.kind === "anyOf" ? filter.names : [];
    const names = picked.includes(name)
        ? picked.filter((it) => it !== name)
        : [...picked, name];

    return names.length === 0 ? { kind: "all" } : { kind: "anyOf", names };
}

function matchesCategories(recipe: Recipe, filter: CategoryFilter): boolean {
    switch (filter.kind) {
        case "all":
            return true;
        case "uncategorised":
            return recipe.categories.length === 0;
        case "anyOf":
            return filter.names.some((name) => recipe.categories.includes(name));
    }
}

export interface BrowseResult {
    /** The recipes on the requested page. */
    recipes: Recipe[];
    /** How many recipes matched, across every page. */
    total: number;
    /** The page actually shown, held within the pages that exist. */
    page: number;
    pageCount: number;
}

export interface CategoryCount {
    name: string;
    recipeCount: number;
}

/**
 * How deep each Category runs, deepest first. The curated list comes first, so
 * a Category the cook keeps but has filed nothing under is still on the shelf
 * rather than disappearing until something lands in it.
 */
export function countByCategory(
    collection: Recipe[],
    curated: Category[] = [],
): CategoryCount[] {
    const counts = new Map<string, number>(curated.map((category) => [category.name, 0]));
    for (const recipe of collection) {
        for (const name of recipe.categories) {
            counts.set(name, (counts.get(name) ?? 0) + 1);
        }
    }

    return [...counts.entries()]
        .map(([name, recipeCount]) => ({ name, recipeCount }))
        .sort((a, b) => b.recipeCount - a.recipeCount || compareText(a.name, b.name));
}

/** The recipes that arrived filed under nothing. Not a Category, so counted apart. */
export function countUncategorised(collection: Recipe[]): number {
    return collection.filter((recipe) => recipe.categories.length === 0).length;
}

/**
 * Everything a cook does to find a recipe: filter, search, sort, paginate.
 * Pure — a collection and criteria in, the recipes to show out.
 */
export function browse(collection: Recipe[], criteria: BrowseCriteria): BrowseResult {
    const {
        categories = { kind: "all" },
        search = "",
        source = null,
        // The list opens on what is most likely relevant: the newest.
        sort = { field: "savedAt", direction: "desc" },
        page = 1,
        pageSize = 20,
    } = criteria;

    const matching = collection.filter(
        (recipe) =>
            matchesCategories(recipe, categories)
            && matchesSearch(recipe, search)
            && (source === null || recipe.source === source),
    );

    const unfiledLast = sort.field === "category";
    const sorted = [...matching].sort((a, b) => {
        if (unfiledLast && (firstCategory(a) === null) !== (firstCategory(b) === null)) {
            return firstCategory(a) === null ? 1 : -1;
        }

        const difference = compareBy(sort.field, a, b);

        return sort.direction === "asc" ? difference : -difference;
    });

    // An empty result is still one page — an empty one — rather than none.
    const pageCount = Math.max(1, Math.ceil(sorted.length / pageSize));
    const shown = Math.min(Math.max(page, 1), pageCount);
    const start = (shown - 1) * pageSize;

    return {
        recipes: sorted.slice(start, start + pageSize),
        total: sorted.length,
        page: shown,
        pageCount,
    };
}
