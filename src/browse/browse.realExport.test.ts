import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { parseExport } from "../import/parseExport";
import { browse, countByCategory, countUncategorised } from "./browse";

const { recipes } = parseExport(
    readFileSync(fileURLToPath(new URL("../data/pocket.csv", import.meta.url)), "utf8"),
);

/** The behaviour a cook would recognise, against the nine years actually collected. */
describe("browsing the real collection", () => {
    it("finds Svíčková typed without diacritics", () => {
        const found = browse(recipes, { search: "svickova", pageSize: 3357 });

        expect(found.total).toBeGreaterThan(0);
        expect(found.recipes.some((recipe) => recipe.name.includes("Svíčková"))).toBe(true);
    });

    it("shows a Christmas dessert whether you browse dezerty or vánoce", () => {
        const underBoth = browse(recipes, {
            categories: { kind: "anyOf", names: ["dezerty", "vánoce"] },
            pageSize: 3357,
        });
        const underDezerty = browse(recipes, {
            categories: { kind: "anyOf", names: ["dezerty"] },
            pageSize: 3357,
        });
        const underVanoce = browse(recipes, {
            categories: { kind: "anyOf", names: ["vánoce"] },
            pageSize: 3357,
        });

        expect(underDezerty.total).toBe(1021);
        expect(underVanoce.total).toBe(53);
        // 30 recipes are filed under both, so the two lists overlap rather than add up.
        expect(underBoth.total).toBe(1044);
    });

    it("keeps the 96 unfiled recipes reachable", () => {
        const unfiled = browse(recipes, { categories: { kind: "uncategorised" }, pageSize: 3357 });

        expect(unfiled.total).toBe(96);
        expect(countUncategorised(recipes)).toBe(96);
    });

    it("pages the whole collection at twenty a page", () => {
        const first = browse(recipes, {});

        expect(first.total).toBe(3357);
        expect(first.pageCount).toBe(168);
        expect(first.recipes).toHaveLength(20);
    });

    it("counts all 27 Categories, dezerty deepest", () => {
        const counts = countByCategory(recipes);

        expect(counts).toHaveLength(27);
        expect(counts[0]).toEqual({ name: "dezerty", recipeCount: 1021 });
        expect(counts.find((it) => it.name === "marmelády, zavařování")?.recipeCount).toBe(53);
    });
});
