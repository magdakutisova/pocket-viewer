import { RecipeList } from "../components/RecipeList";
import { useCollection } from "../hooks/useCollection";
import { useFilterStore } from "../hooks/useFilterStore";

export function Home() {
    const { recipes, categories } = useCollection();
    const { category, search, setCategory, setSearch } = useFilterStore();

    const searchTerm = search.toLowerCase();
    const filtered = recipes.filter((recipe) => {
        const matchesCategory = category === null || recipe.categories.includes(category);
        const matchesSearch = recipe.name.toLowerCase().includes(searchTerm)
            || recipe.categories.some((name) => name.toLowerCase().includes(searchTerm));
        return matchesCategory && matchesSearch;
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
                    className="border rounded px-3 py-1 w-full"
                />
                <select
                    value={category ?? ""}
                    onChange={(e) => setCategory(e.target.value === "" ? null : e.target.value)}
                    className="border rounded px-3 py-1"
                >
                    <option value="">Všechny kategorie</option>
                    {categoryNames.map((name) => (
                        <option key={name} value={name}>{name}</option>
                    ))}
                </select>
            </div>

            {/* Keyed on the criteria so changing them starts again at the first page. */}
            <RecipeList key={`${category}|${search}`} recipes={filtered} />
        </div>
    );
}
