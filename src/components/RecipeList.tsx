import { RecipeCard } from "./RecipeCard";
import { PAGE_BUTTON } from "./buttonStyles";
import type { BrowseResult } from "../browse/browse";
import { plural } from "../czech";

interface RecipeListProps {
    result: BrowseResult;
    onPage: (page: number) => void;
}

export function RecipeList({ result, onPage }: RecipeListProps) {
    const { recipes, total, page, pageCount } = result;

    return (
        <div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                {plural(total, "recept", "recepty", "receptů")}
            </p>

            {recipes.map((recipe) => (
                <RecipeCard key={recipe.url} recipe={recipe} />
            ))}

            {total === 0 && <p className="text-sm">Nic nenalezeno.</p>}

            <div className="flex gap-2 mt-4 items-center">
                <button
                    className={PAGE_BUTTON}
                    disabled={page === 1}
                    onClick={() => onPage(page - 1)}
                >
                    Předchozí
                </button>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                    {page} / {pageCount}
                </span>
                <button
                    className={PAGE_BUTTON}
                    disabled={page >= pageCount}
                    onClick={() => onPage(page + 1)}
                >
                    Další
                </button>
            </div>
        </div>
    );
}
