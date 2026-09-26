import { RecipeList } from "../components/RecipeList";
import { useCollection } from "../hooks/useCollection";
import { useFilterStore, type CategoryFilter } from "../hooks/useFilterStore";

/** Form controls need their own colours: they do not follow the page's. */
const CONTROL_COLOURS = "bg-white text-gray-900 dark:bg-neutral-800 dark:text-gray-100";

/** Select values that stand for a filter rather than for a Category name. */
const ALL = "";
const UNCATEGORISED = "__bez-kategorie__";

function toSelectValue(category: CategoryFilter): string {
    switch (category.kind) {
        case "all":
            return ALL;
        case "uncategorised":
            return UNCATEGORISED;
        case "named":
            return category.name;
    }
}

function fromSelectValue(value: string): CategoryFilter {
    if (value === ALL) return { kind: "all" };
    if (value === UNCATEGORISED) return { kind: "uncategorised" };

    return { kind: "named", name: value };
}

function matchesCategory(recipeCategories: string[], category: CategoryFilter): boolean {
    switch (category.kind) {
        case "all":
            return true;
        case "uncategorised":
            return recipeCategories.length === 0;
        case "named":
            return recipeCategories.includes(category.name);
    }
}

export function Home() {
    const { recipes, categories } = useCollection();
    const { category, search, setCategory, setSearch } = useFilterStore();

    const searchTerm = search.toLowerCase();
    const filtered = recipes.filter((recipe) => {
        const matchesSearch = recipe.name.toLowerCase().includes(searchTerm)
            || recipe.categories.some((name) => name.toLowerCase().includes(searchTerm));
        return matchesCategory(recipe.categories, category) && matchesSearch;
    });

    const categoryNames = categories
        .map((category) => category.name)
        .sort((a, b) => a.localeCompare(b, "cs"));

    return (
        <div className="max-w-3xl mx-auto p-6">
            <h1 className="text-2xl font-semibold mb-4">📚 Moje recepty</h1>

            <div className="flex gap-4 mb-6 items-center">
                <input
                    type="text"
                    placeholder="Hledat..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className={`border rounded px-3 py-1 w-full ${CONTROL_COLOURS}`}
                />
                <select
                    value={toSelectValue(category)}
                    onChange={(e) => setCategory(fromSelectValue(e.target.value))}
                    className={`border rounded px-3 py-1 ${CONTROL_COLOURS}`}
                >
                    {/* The dropdown inherits the page's light text but not its dark
                        background, so each option carries both colours itself. */}
                    <option value={ALL} className={CONTROL_COLOURS}>Všechny kategorie</option>
                    <option value={UNCATEGORISED} className={CONTROL_COLOURS}>Bez kategorie</option>
                    {categoryNames.map((name) => (
                        <option key={name} value={name} className={CONTROL_COLOURS}>{name}</option>
                    ))}
                </select>
            </div>

            {/* Keyed on the criteria so changing them starts again at the first page. */}
            <RecipeList key={`${toSelectValue(category)}|${search}`} recipes={filtered} />
        </div>
    );
}
