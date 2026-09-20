import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { parseExport } from "./parseExport";

const exportText = readFileSync(
    fileURLToPath(new URL("../data/pocket.csv", import.meta.url)),
    "utf8",
);

const { recipes, categories } = parseExport(exportText);

/**
 * The numbers below come from the Pocket export itself and are the ones the spec
 * cites. They are what tells us the collection is filed the way it was filed.
 */
describe("the whole Pocket export", () => {
    it("keeps every recipe the export holds", () => {
        expect(recipes).toHaveLength(3357);
    });

    it("holds the 27 Categories the cook actually used", () => {
        expect(categories).toHaveLength(27);
    });

    it("finds `marmelády, zavařování` on 53 recipes", () => {
        const inTheCommaNamedCategory = recipes.filter((recipe) =>
            recipe.categories.includes("marmelády, zavařování"),
        );

        expect(inTheCommaNamedCategory).toHaveLength(53);
    });

    it("invents no Category containing a pipe", () => {
        const invented = categories.filter((category) => category.name.includes("|"));

        expect(invented).toEqual([]);
    });

    it("files 447 recipes under more than one Category", () => {
        const underSeveral = recipes.filter((recipe) => recipe.categories.length > 1);

        expect(underSeveral).toHaveLength(447);
    });

    it("keeps the 96 recipes that arrived with no Category", () => {
        const uncategorised = recipes.filter((recipe) => recipe.categories.length === 0);

        expect(uncategorised).toHaveLength(96);
    });

    it("gives every recipe a real date, none of them text", () => {
        const withoutADate = recipes.filter(
            (recipe) => Number.isNaN(recipe.savedAt.getTime()),
        );

        expect(withoutADate).toEqual([]);
    });
});
