import { RecipeCard } from "./RecipeCard";
import type { Recipe } from "../domain";
import { useMemo, useState} from "react";

/**
 * The pager buttons carry their own look. Nothing styles a bare <button> any
 * more — Preflight strips it back, and the starter rule that used to dress
 * every button in the app is gone.
 */
const PAGE_BUTTON = "rounded-lg border border-gray-300 bg-gray-50 px-4 py-2 font-medium "
    + "hover:border-blue-500 disabled:opacity-50 dark:border-gray-700 dark:bg-gray-800";

export function RecipeList({ recipes }: { recipes: Recipe[] }) {
    const RECIPES_PER_PAGE = 20;
    const [page, setPage] = useState(1);

    const recipesOnPage = useMemo(() => {
        const start = (page - 1) * RECIPES_PER_PAGE;

        return recipes.slice(start, start + RECIPES_PER_PAGE);
    }, [recipes, page]);

    return (
        <div>
            {recipesOnPage.map((recipe) => (
                <RecipeCard key={recipe.url} recipe={recipe} />
            ))}

            <div className="flex gap-2 mt-4">
                <button
                    className={PAGE_BUTTON}
                    disabled={page === 1}
                    onClick={() => setPage(page => page - 1)}
                >
                    Předchozí
                </button>
                <button
                    className={PAGE_BUTTON}
                    disabled={(page * RECIPES_PER_PAGE) >= recipes.length}
                    onClick={() => setPage(page => page + 1)}
                >
                    Další
                </button>
            </div>
        </div>
    );
}
