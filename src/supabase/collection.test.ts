import { describe, expect, it } from "vitest";
import { toCollection } from "./collection";

const ONE_RECIPE = {
    recipes: [
        {
            name: "Vánočka",
            url: "https://example.com/vanocka",
            savedAt: "2016-06-29T12:42:19+00:00",
            source: "example.com",
            categories: ["dezerty", "vánoce"],
        },
    ],
    categories: [{ name: "dezerty" }, { name: "vánoce" }],
    sources: [{ name: "example.com", hosts: ["example.com"], recipeCount: 1 }],
};

describe("reading the collection the database sent", () => {
    it("keeps a recipe's name, pointer, Source and Categories", () => {
        const { recipes } = toCollection(ONE_RECIPE);

        expect(recipes[0].name).toBe("Vánočka");
        expect(recipes[0].url).toBe("https://example.com/vanocka");
        expect(recipes[0].source).toBe("example.com");
        expect(recipes[0].categories).toEqual(["dezerty", "vánoce"]);
    });

    it("reads the saved date back as a date, so sorting by it compares dates", () => {
        const { recipes } = toCollection(ONE_RECIPE);

        expect(recipes[0].savedAt).toBeInstanceOf(Date);
        expect(recipes[0].savedAt.toISOString()).toBe("2016-06-29T12:42:19.000Z");
    });

    it("carries the curated Categories and the shelf of Sources", () => {
        const { categories, sources } = toCollection(ONE_RECIPE);

        expect(categories).toEqual([{ name: "dezerty" }, { name: "vánoce" }]);
        expect(sources).toEqual([{ name: "example.com", hosts: ["example.com"], recipeCount: 1 }]);
    });

    it("reads an empty collection as empty rather than as a fault", () => {
        expect(toCollection({ recipes: [], categories: [], sources: [] })).toEqual({
            recipes: [],
            categories: [],
            sources: [],
        });
    });

    it("refuses a reply that is not a collection at all", () => {
        // A deploy where the database and the app disagree. Better to say so
        // than to hand the screens an empty collection that looks like success.
        expect(() => toCollection(null)).toThrowError(/collection/i);
        expect(() => toCollection({})).toThrowError(/collection/i);
        expect(() => toCollection({ recipes: "lots" })).toThrowError(/collection/i);
    });

    it("refuses a recipe whose saved date is unreadable", () => {
        expect(() =>
            toCollection({
                ...ONE_RECIPE,
                recipes: [{ ...ONE_RECIPE.recipes[0], savedAt: "not-a-date" }],
            }),
        ).toThrowError(/date/i);
    });
});
