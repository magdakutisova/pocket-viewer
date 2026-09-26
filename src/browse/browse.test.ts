import { describe, expect, it } from "vitest";
import type { Recipe } from "../domain";
import {
    browse,
    countByCategory,
    countUncategorised,
    toggleCategory,
    type SortDirection,
    type SortField,
} from "./browse";

function recipe(overrides: Partial<Recipe> & { name: string }): Recipe {
    return {
        url: `https://example.com/${overrides.name}`,
        savedAt: new Date("2016-06-29T12:42:19.000Z"),
        categories: [],
        source: "example.com",
        ...overrides,
    };
}

describe("browsing the collection with nothing asked for", () => {
    it("returns the whole collection, newest first", () => {
        const older = recipe({ name: "Bábovka", savedAt: new Date("2013-03-30") });
        const newer = recipe({ name: "Svíčková", savedAt: new Date("2021-11-02") });

        const result = browse([older, newer], {});

        expect(result.recipes.map((it) => it.name)).toEqual(["Svíčková", "Bábovka"]);
        expect(result.total).toBe(2);
    });
});

describe("filtering by Category", () => {
    const vanocka = recipe({ name: "Vánočka", categories: ["dezerty", "vánoce"] });
    const polevka = recipe({ name: "Polévka", categories: ["polévky"] });
    const bramboraky = recipe({ name: "Bramboráky", categories: [] });
    const collection = [vanocka, polevka, bramboraky];

    it("shows a recipe filed under any of the Categories picked", () => {
        const result = browse(collection, {
            categories: { kind: "anyOf", names: ["polévky", "vánoce"] },
        });

        expect(result.recipes.map((it) => it.name).sort()).toEqual(["Polévka", "Vánočka"]);
    });

    it("finds a recipe held in several Categories under each of them", () => {
        const underDezerty = browse(collection, {
            categories: { kind: "anyOf", names: ["dezerty"] },
        });
        const underVanoce = browse(collection, {
            categories: { kind: "anyOf", names: ["vánoce"] },
        });

        expect(underDezerty.recipes.map((it) => it.name)).toEqual(["Vánočka"]);
        expect(underVanoce.recipes.map((it) => it.name)).toEqual(["Vánočka"]);
    });

    it("keeps the unfiled recipes reachable on their own", () => {
        const result = browse(collection, { categories: { kind: "uncategorised" } });

        expect(result.recipes.map((it) => it.name)).toEqual(["Bramboráky"]);
    });
});

describe("searching", () => {
    const svickova = recipe({ name: "Svíčková na smetaně", categories: ["hlavní jídla"] });
    const babovka = recipe({ name: "Bábovka", categories: ["dezerty", "vánoce"] });
    const collection = [svickova, babovka];

    it("matches a recipe name whatever the case", () => {
        const result = browse(collection, { search: "SVÍČKOVÁ" });

        expect(result.recipes.map((it) => it.name)).toEqual(["Svíčková na smetaně"]);
    });

    it("matches a Category name too, so typing a category narrows the list", () => {
        const result = browse(collection, { search: "vánoce" });

        expect(result.recipes.map((it) => it.name)).toEqual(["Bábovka"]);
    });

    it("finds Svíčková when typing svickova, one-handed and without diacritics", () => {
        const result = browse(collection, { search: "svickova" });

        expect(result.recipes.map((it) => it.name)).toEqual(["Svíčková na smetaně"]);
    });

    it("finds it typed the other way round too, diacritics against a plain name", () => {
        const plain = recipe({ name: "Svickova na smetane" });
        const result = browse([plain], { search: "Svíčková" });

        expect(result.recipes.map((it) => it.name)).toEqual(["Svickova na smetane"]);
    });

    it("matches a Category without diacritics as well", () => {
        const result = browse(collection, { search: "hlavni jidla" });

        expect(result.recipes.map((it) => it.name)).toEqual(["Svíčková na smetaně"]);
    });
});

describe("sorting", () => {
    const collection = [
        recipe({
            name: "Čaj",
            savedAt: new Date("2015-01-01"),
            source: "zazvor.info",
            categories: ["nápoje"],
        }),
        recipe({
            name: "Bábovka",
            savedAt: new Date("2021-01-01"),
            source: "apetitonline.cz",
            categories: ["dezerty"],
        }),
        recipe({
            name: "Ančovičky",
            savedAt: new Date("2018-01-01"),
            source: "mimibazar.cz",
            categories: ["pomazánky"],
        }),
    ];

    function namesSortedBy(field: SortField, direction: SortDirection) {
        return browse(collection, { sort: { field, direction } }).recipes.map((it) => it.name);
    }

    it("sorts by name in Czech order, where Č comes after C and before D", () => {
        expect(namesSortedBy("name", "asc")).toEqual(["Ančovičky", "Bábovka", "Čaj"]);
        expect(namesSortedBy("name", "desc")).toEqual(["Čaj", "Bábovka", "Ančovičky"]);
    });

    it("sorts by the date saved, newest first or oldest first", () => {
        expect(namesSortedBy("savedAt", "desc")).toEqual(["Bábovka", "Ančovičky", "Čaj"]);
        expect(namesSortedBy("savedAt", "asc")).toEqual(["Čaj", "Ančovičky", "Bábovka"]);
    });

    it("sorts by Source, so one blog reads together", () => {
        expect(namesSortedBy("source", "asc")).toEqual(["Bábovka", "Ančovičky", "Čaj"]);
        expect(namesSortedBy("source", "desc")).toEqual(["Čaj", "Ančovičky", "Bábovka"]);
    });

    it("sorts by Category", () => {
        expect(namesSortedBy("category", "asc")).toEqual(["Bábovka", "Čaj", "Ančovičky"]);
        expect(namesSortedBy("category", "desc")).toEqual(["Ančovičky", "Čaj", "Bábovka"]);
    });

    it("puts an unfiled recipe last when sorting by Category, not first", () => {
        const unfiled = recipe({ name: "Bramboráky", categories: [] });
        const filed = recipe({ name: "Vánočka", categories: ["dezerty"] });

        const result = browse([unfiled, filed], { sort: { field: "category", direction: "asc" } });

        expect(result.recipes.map((it) => it.name)).toEqual(["Vánočka", "Bramboráky"]);
    });
});

describe("paging through a long list", () => {
    const collection = Array.from({ length: 45 }, (_, index) =>
        recipe({ name: `Recept ${index + 1}`, savedAt: new Date(2020, 0, 45 - index) }),
    );

    it("fills the first page and says how many pages there are", () => {
        const result = browse(collection, { page: 1, pageSize: 20 });

        expect(result.recipes).toHaveLength(20);
        expect(result.recipes[0].name).toBe("Recept 1");
        expect(result.total).toBe(45);
        expect(result.pageCount).toBe(3);
        expect(result.page).toBe(1);
    });

    it("gives the last page only what is left over", () => {
        const result = browse(collection, { page: 3, pageSize: 20 });

        expect(result.recipes).toHaveLength(5);
        expect(result.recipes[0].name).toBe("Recept 41");
    });

    it("holds at the last page rather than running off the end", () => {
        const result = browse(collection, { page: 99, pageSize: 20 });

        expect(result.page).toBe(3);
        expect(result.recipes).toHaveLength(5);
    });

    it("holds at the first page rather than running off the front", () => {
        const result = browse(collection, { page: 0, pageSize: 20 });

        expect(result.page).toBe(1);
        expect(result.recipes[0].name).toBe("Recept 1");
    });

    it("comes back empty, and sound, when nothing matches", () => {
        const result = browse(collection, { search: "neexistuje", page: 2 });

        expect(result.recipes).toEqual([]);
        expect(result.total).toBe(0);
        expect(result.pageCount).toBe(1);
        expect(result.page).toBe(1);
    });
});

describe("how deep each Category runs", () => {
    it("counts the recipes each Category holds, deepest first", () => {
        const collection = [
            recipe({ name: "Vánočka", categories: ["dezerty", "vánoce"] }),
            recipe({ name: "Bábovka", categories: ["dezerty"] }),
            recipe({ name: "Polévka", categories: ["polévky"] }),
            recipe({ name: "Bramboráky", categories: [] }),
        ];

        expect(countByCategory(collection)).toEqual([
            { name: "dezerty", recipeCount: 2 },
            { name: "polévky", recipeCount: 1 },
            { name: "vánoce", recipeCount: 1 },
        ]);
    });

    it("counts the unfiled recipes separately, since they are not a Category", () => {
        const collection = [
            recipe({ name: "Bramboráky", categories: [] }),
            recipe({ name: "Vánočka", categories: ["dezerty"] }),
        ];

        expect(countUncategorised(collection)).toBe(1);
    });
});

describe("browsing one Source", () => {
    it("shows only the recipes that blog holds", () => {
        const collection = [
            recipe({ name: "Bábovka", source: "delicious-blog-lucie.blogspot.com" }),
            recipe({ name: "Polévka", source: "zazvor.info" }),
        ];

        const result = browse(collection, { source: "zazvor.info" });

        expect(result.recipes.map((it) => it.name)).toEqual(["Polévka"]);
    });
});

describe("picking Categories on and off", () => {
    it("adds a Category to the ones already picked", () => {
        const picked = toggleCategory({ kind: "anyOf", names: ["dezerty"] }, "vánoce");

        expect(picked).toEqual({ kind: "anyOf", names: ["dezerty", "vánoce"] });
    });

    it("takes one off again when it is picked twice", () => {
        const picked = toggleCategory({ kind: "anyOf", names: ["dezerty", "vánoce"] }, "dezerty");

        expect(picked).toEqual({ kind: "anyOf", names: ["vánoce"] });
    });

    it("falls back to the whole collection when the last one is taken off", () => {
        const picked = toggleCategory({ kind: "anyOf", names: ["dezerty"] }, "dezerty");

        expect(picked).toEqual({ kind: "all" });
    });

    it("starts a fresh selection from the whole collection, or from the unfiled ones", () => {
        expect(toggleCategory({ kind: "all" }, "dezerty")).toEqual({
            kind: "anyOf",
            names: ["dezerty"],
        });
        expect(toggleCategory({ kind: "uncategorised" }, "dezerty")).toEqual({
            kind: "anyOf",
            names: ["dezerty"],
        });
    });
});

describe("Categories the cook keeps but nothing is filed under", () => {
    it("keeps a curated Category on the list, holding nothing", () => {
        const collection = [recipe({ name: "Vánočka", categories: ["dezerty"] })];

        const counts = countByCategory(collection, [{ name: "dezerty" }, { name: "marinády" }]);

        expect(counts).toEqual([
            { name: "dezerty", recipeCount: 1 },
            { name: "marinády", recipeCount: 0 },
        ]);
    });
});
