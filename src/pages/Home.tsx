import { ArticleList } from "../components/ArticleList";
import { useFilterStore } from "../hooks/useFilterStore";
import { usePocketData } from "../hooks/usePocketData";

export function Home() {
    const { articles, loading } = usePocketData();
    const { status, search, setStatus, setSearch } = useFilterStore();

    if (loading) return <p>Načítám články...</p>;

    const filtered = articles.filter((article) => {
        const matchesStatus = status === "all" ? true : article.status === status;
        const matchesSearch = article.title.toLowerCase().includes(search.toLowerCase())
            || article.tags.some((tag) =>
                tag.toLowerCase().includes(search.toLowerCase())
            );
        return matchesStatus && matchesSearch;
    });

    return (
        <div className="max-w-3xl mx-auto p-6">
            <h1 className="text-2xl font-semibold mb-4">📚 Moje Pocket data</h1>

            <div className="flex gap-4 mb-6 items-center">
                <input
                    type="text"
                    placeholder="Hledat..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="border rounded px-3 py-1 w-full"
                />
                <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as "all" | "read" | "unread")}
                    className="border rounded px-3 py-1"
                >
                    <option value="all">Všechny</option>
                    <option value="read">Přečtené</option>
                    <option value="unread">Nepřečtené</option>
                </select>
            </div>

            <ArticleList articles={filtered} />
        </div>
    );
}