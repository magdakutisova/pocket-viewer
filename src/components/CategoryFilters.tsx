import type { CategoryFilter, CategoryCount } from "../browse/browse";

interface CategoryFiltersProps {
    counts: CategoryCount[];
    uncategorisedCount: number;
    selected: CategoryFilter;
    onToggle: (name: string) => void;
    onShowAll: () => void;
    onShowUncategorised: () => void;
}

function chipClasses(active: boolean): string {
    const base = "border rounded-full px-3 py-1 text-sm";

    return active ? `${base} font-semibold border-current` : `${base} opacity-70`;
}

/** The Categories, with how deep each one runs. Several can be picked at once. */
export function CategoryFilters({
    counts,
    uncategorisedCount,
    selected,
    onToggle,
    onShowAll,
    onShowUncategorised,
}: CategoryFiltersProps) {
    const picked = selected.kind === "anyOf" ? selected.names : [];

    return (
        <div className="flex flex-wrap gap-2 mb-4">
            <button onClick={onShowAll} className={chipClasses(selected.kind === "all")}>
                Vše
            </button>
            <button
                onClick={onShowUncategorised}
                className={chipClasses(selected.kind === "uncategorised")}
            >
                Bez kategorie ({uncategorisedCount})
            </button>
            {counts.map((category) => (
                <button
                    key={category.name}
                    onClick={() => onToggle(category.name)}
                    className={chipClasses(picked.includes(category.name))}
                >
                    {category.name} ({category.recipeCount})
                </button>
            ))}
        </div>
    );
}
