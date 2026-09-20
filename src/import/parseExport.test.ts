import { describe, expect, it } from "vitest";
import { parseExport } from "./parseExport";

const HEADER = "title,url,time_added,tags,status";

function exportOf(...rows: string[]): string {
    return [HEADER, ...rows].join("\n");
}

describe("parsing Categories out of the Pocket export", () => {
    it("files a recipe under each Category the export separates with a pipe", () => {
        const { recipes } = parseExport(
            exportOf("Vánočka,https://example.com/vanocka,1467204139,dezerty|vánoce,unread"),
        );

        expect(recipes[0].categories).toEqual(["dezerty", "vánoce"]);
    });
});

describe("Categories whose name contains a comma", () => {
    it("keeps `marmelády, zavařování` as the one Category it is", () => {
        const { recipes } = parseExport(
            exportOf(
                'Rybízový džem,https://example.com/dzem,1467204139,"marmelády, zavařování",unread',
            ),
        );

        expect(recipes[0].categories).toEqual(["marmelády, zavařování"]);
    });

    it("splits a comma-named Category from its neighbours without splitting the name", () => {
        const { recipes } = parseExport(
            exportOf(
                'Švestkové knedlíky,https://example.com/knedliky,1467204139,"dezerty|marmelády, zavařování|přílohy",unread',
            ),
        );

        expect(recipes[0].categories).toEqual([
            "dezerty",
            "marmelády, zavařování",
            "přílohy",
        ]);
    });
});

describe("recipes that arrived with no Category", () => {
    it("keeps the recipe, filed under nothing at all", () => {
        const { recipes } = parseExport(
            exportOf("Bramboráky,https://example.com/bramboraky,1467204139,,unread"),
        );

        expect(recipes).toHaveLength(1);
        expect(recipes[0].name).toBe("Bramboráky");
        expect(recipes[0].categories).toEqual([]);
    });
});

describe("the date a recipe was saved", () => {
    it("reads the export's epoch seconds as a date, not as text", () => {
        const { recipes } = parseExport(
            exportOf(
                "Skinny omelette,https://example.com/omelette,1467204139,snídaně,unread",
            ),
        );

        // 1467204139 is 29 June 2016, 12:42:19 UTC
        expect(recipes[0].savedAt).toBeInstanceOf(Date);
        expect(recipes[0].savedAt.toISOString()).toBe("2016-06-29T12:42:19.000Z");
    });
});

describe("the Categories the collection holds", () => {
    it("names each Category once, however many recipes hold it", () => {
        const { categories } = parseExport(
            exportOf(
                "Vánočka,https://example.com/vanocka,1467204139,dezerty|vánoce,unread",
                "Linecké,https://example.com/linecke,1467204139,dezerty|cukroví,unread",
                "Bramboráky,https://example.com/bramboraky,1467204139,,unread",
            ),
        );

        expect(categories.map((category) => category.name).sort()).toEqual([
            "cukroví",
            "dezerty",
            "vánoce",
        ]);
    });
});

describe("Category names with stray whitespace around the separator", () => {
    it("does not let a stray space invent a second Category", () => {
        const { recipes, categories } = parseExport(
            exportOf("Vánočka,https://example.com/vanocka,1467204139,dezerty| vánoce,unread"),
        );

        expect(recipes[0].categories).toEqual(["dezerty", "vánoce"]);
        expect(categories.map((category) => category.name).sort()).toEqual([
            "dezerty",
            "vánoce",
        ]);
    });
});
