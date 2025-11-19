import { useEffect, useState } from "react";
import Papa from "papaparse";
import type { Article } from "../types";

export function usePocketData() {
    const [articles, setArticles] = useState<Article[]>([]);
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {
        Papa.parse("/src/data/pocket.csv", {
            download: true,
            header: true,
            complete: (results: any) => {
                const parsed = results.data as any[];
                const cleaned = parsed.map((item) => ({
                    title: item.title || "No Title",
                    url: item.url || "",
                    timeAdded: item.time_added || "",
                    tags: item.tags ? item.tags.split(",") : [],
                    status: item.status || "unread",
                }));
                setArticles(cleaned);
                setLoading(false);
            },
        });
    }, []);

    return { articles, loading };
}