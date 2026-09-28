import { useMemo } from "react";
import { browse, countByCategory, countUncategorised, type SortField } from "../browse/browse";
import { PAGE_BUTTON } from "../components/buttonStyles";
import { CategoryFilters } from "../components/CategoryFilters";
import { RecipeList } from "../components/RecipeList";
import { SourceList } from "../components/SourceList";
import { useCollection } from "../hooks/useCollection";
import type { Collection } from "../supabase/collection";
import { useFilterStore, type View } from "../hooks/useFilterStore";

/** Form controls need their own colours: they do not follow the page's. */
const CONTROL_COLOURS = "bg-white text-gray-900 dark:bg-neutral-800 dark:text-gray-100";

/** One instance, so that browsing is not recomputed on every render while loading. */
const NOTHING_YET: Collection = { recipes: [], categories: [], sources: [] };

const SORT_LABELS: Record<SortField, string> = {
    savedAt: "Datum uložení",
    name: "Název",
    source: "Zdroj",
    category: "Kategorie",
};

interface PageProps {
    view: View;
    onChangeView: (view: View) => void;
    children: React.ReactNode;
}

/** The chrome both shelves sit in: the title and the two tabs. */
function Page({ view, onChangeView, children }: PageProps) {
    return (
        <div className="max-w-3xl mx-auto p-4 sm:p-6">
            <h1 className="text-2xl font-semibold mb-4">📚 Moje recepty</h1>
            <Tabs view={view} onChange={onChangeView} />
            {children}
        </div>
    );
}

function Tabs({ view, onChange }: { view: View; onChange: (view: View) => void }) {
    return (
        <div className="flex gap-2 mb-4">
            <button
                onClick={() => onChange("recipes")}
                className={view === "recipes" ? "underline font-semibold" : ""}
            >
                Recepty
            </button>
            <button
                onClick={() => onChange("sources")}
                className={view === "sources" ? "underline font-semibold" : ""}
            >
                Zdroje
            </button>
        </div>
    );
}

export function Home() {
    const state = useCollection();

    // Hooks cannot sit behind a return, so browsing is computed over whatever is
    // here — the empty collection while loading — and the screen chosen after.
    const { recipes, categories: curatedCategories, sources } =
        state.status === "ready" ? state.collection : NOTHING_YET;
    const {
        view,
        categories,
        source,
        search,
        sort,
        page,
        setView,
        toggleCategory,
        showAllCategories,
        showUncategorised,
        setSource,
        setSearch,
        setSortField,
        flipSortDirection,
        setPage,
    } = useFilterStore();

    const categoryCounts = useMemo(
        () => countByCategory(recipes, curatedCategories),
        [recipes, curatedCategories],
    );
    const uncategorisedCount = useMemo(() => countUncategorised(recipes), [recipes]);
    const result = useMemo(
        () => browse(recipes, { categories, source, search, sort, page }),
        [recipes, categories, source, search, sort, page],
    );

    function browseSource(primaryHost: string) {
        setSource(primaryHost);
        setView("recipes");
    }

    if (state.status === "loading") {
        return (
            <Page view={view} onChangeView={setView}>
                <p className="text-sm opacity-70">Načítám sbírku…</p>
            </Page>
        );
    }

    if (state.status === "failed") {
        return (
            <Page view={view} onChangeView={setView}>
                <p role="alert" className="text-sm text-red-600 dark:text-red-400">
                    Sbírku se nepodařilo načíst.
                </p>
                <p className="text-sm opacity-70 mt-2">{state.message}</p>
            </Page>
        );
    }

    if (view === "sources") {
        return (
            <Page view={view} onChangeView={setView}>
                <SourceList sources={sources} onSelect={browseSource} />
            </Page>
        );
    }

    return (
        <Page view={view} onChangeView={setView}>
            {source !== null && (
                <p className="mb-4 text-sm">
                    Zdroj: <span className="font-semibold">{source}</span>{" "}
                    <button onClick={() => setSource(null)} className="underline">
                        zrušit
                    </button>
                </p>
            )}

            <div className="flex flex-wrap gap-2 mb-4 items-center">
                <input
                    type="text"
                    placeholder="Hledat..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className={`border rounded px-3 py-1 w-full ${CONTROL_COLOURS}`}
                />
                <select
                    value={sort.field}
                    onChange={(e) => setSortField(e.target.value as SortField)}
                    className={`border rounded px-3 py-1 ${CONTROL_COLOURS}`}
                >
                    {/* The dropdown inherits the page's light text but not its dark
                        background, so each option carries both colours itself. */}
                    {Object.entries(SORT_LABELS).map(([field, label]) => (
                        <option key={field} value={field} className={CONTROL_COLOURS}>
                            {label}
                        </option>
                    ))}
                </select>
                <button
                    onClick={flipSortDirection}
                    className={PAGE_BUTTON}
                    aria-label={sort.direction === "asc" ? "Seřadit sestupně" : "Seřadit vzestupně"}
                >
                    {sort.direction === "asc" ? "↑" : "↓"}
                </button>
            </div>

            <CategoryFilters
                counts={categoryCounts}
                uncategorisedCount={uncategorisedCount}
                selected={categories}
                onToggle={toggleCategory}
                onShowAll={showAllCategories}
                onShowUncategorised={showUncategorised}
            />

            <RecipeList result={result} onPage={setPage} />
        </Page>
    );
}
