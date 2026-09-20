import { RecipeCard } from "./RecipeCard";
import type { Recipe } from "../domain";
import { useMemo, useState} from "react";

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
                    disabled={page === 1}
                    onClick={() => setPage(page => page - 1)}
                >
                    Předchozí
                </button>
                <button
                    disabled={(page * RECIPES_PER_PAGE) >= recipes.length}
                    onClick={() => setPage(page => page + 1)}
                >
                    Další
                </button>
            </div>
        </div>
    );
}
