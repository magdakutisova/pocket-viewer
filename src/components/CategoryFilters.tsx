import { useState } from "react";
import type { CategoryFilter, CategoryCount } from "../browse/browse";
import { PAGE_BUTTON } from "./buttonStyles";

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

/** What the collapsed row says it is holding, so it can stay shut. */
function summarise(selected: CategoryFilter): string {
    switch (selected.kind) {
        case "all":
            return "vše";
        case "uncategorised":
            return "bez kategorie";
        case "anyOf":
            return selected.names.length <= 2
                ? selected.names.join(", ")
                : `${selected.names.slice(0, 2).join(", ")} +${selected.names.length - 2}`;
    }
}

/**
 * The Categories, with how deep each one runs. Several can be picked at once.
 *
 * On a phone the 27 of them fill half the screen before the first recipe, so
 * there they start folded away; there is room for them on a wider screen.
 */
export function CategoryFilters({
    counts,
    uncategorisedCount,
    selected,
    onToggle,
    onShowAll,
    onShowUncategorised,
}: CategoryFiltersProps) {
    const [openOnNarrow, setOpenOnNarrow] = useState(false);
    const picked = selected.kind === "anyOf" ? selected.names : [];

    return (
        <div className="mb-4">
            <button
                onClick={() => setOpenOnNarrow((open) => !open)}
                className={`${PAGE_BUTTON} sm:hidden mb-2 w-full text-left`}
                aria-expanded={openOnNarrow}
            >
                Kategorie: {summarise(selected)} {openOnNarrow ? "▴" : "▾"}
            </button>

            <div
                className={`${openOnNarrow ? "flex" : "hidden"} sm:flex flex-wrap gap-2`}
            >
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
        </div>
    );
}
