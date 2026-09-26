import type { Source } from "../domain";

/** Czech counts in three forms: 1 recept, 2 recepty, 5 receptů. */
function plural(count: number, one: string, few: string, many: string): string {
    if (count === 1) return `${count} ${one}`;
    if (count >= 2 && count <= 4) return `${count} ${few}`;

    return `${count} ${many}`;
}

interface SourceListProps {
    sources: Source[];
    onSelect: (primaryHost: string) => void;
}

/** The shelf: every place the collection's recipes live, deepest first. */
export function SourceList({ sources, onSelect }: SourceListProps) {
    return (
        <div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                {plural(sources.length, "zdroj", "zdroje", "zdrojů")}
            </p>

            <ul>
                {sources.map((source) => (
                    <li key={source.name} className="border p-3 rounded-xl shadow-sm mb-2">
                        <button onClick={() => onSelect(source.hosts[0])} className="text-left w-full">
                            <span className="font-semibold">{source.name}</span>
                            <span className="text-sm text-gray-600 dark:text-gray-400">
                                {" "}— {plural(source.recipeCount, "recept", "recepty", "receptů")}
                            </span>
                            {source.hosts.length > 1 && (
                                <span className="block text-xs text-gray-500 dark:text-gray-400 mt-1">
                                    také {source.hosts.slice(1).join(", ")}
                                </span>
                            )}
                        </button>
                    </li>
                ))}
            </ul>
        </div>
    );
}
