import { ArticleCard } from "./ArticleCard";
import type { Article } from "../types";
import { useMemo, useState} from "react";

export function ArticleList({ articles }: { articles: Article[] }) {
    const ITEMS_PER_PAGE = 20;
    const [page, setPage] = useState(1);

    const paginatedItems = useMemo(() => {
        const start = (page - 1) * ITEMS_PER_PAGE;
        
        return articles.slice(start, start + ITEMS_PER_PAGE);
    }, [articles, page]);

    return (
        <div>
            {paginatedItems.map((article, index) => (
                <ArticleCard key={index} article={article} />
            ))}

            <div className="flex gap-2 mt-4">
                <button 
                    disabled={page === 1}
                    onClick={() => setPage(page => page - 1)}
                >
                    Předchozí
                </button>
                <button 
                    disabled={(page * ITEMS_PER_PAGE) >= articles.length}
                    onClick={() => setPage(page => page + 1)}
                >
                    Další
                </button>
            </div>
        </div>        
    );
}