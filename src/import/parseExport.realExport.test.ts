import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import Papa from "papaparse";
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


/**
 * Which rows needed a name is a fact about the export, not about the parser,
 * so it is read straight from the file rather than inferred from the output.
 */
const urlsOfNamelessRows = Papa.parse<{ title: string; url: string }>(exportText, {
    header: true,
    skipEmptyLines: true,
})
    .data.filter((row) => row.title === row.url)
    .map((row) => row.url);

describe("the recipes Pocket never named", () => {
    it("gives all 603 of them a name that is neither a URL nor blank", () => {
        const needingAName = new Set(urlsOfNamelessRows);
        const derived = recipes.filter((recipe) => needingAName.has(recipe.url));

        expect(needingAName.size).toBe(603);
        expect(derived).toHaveLength(603);
        expect(derived.filter((recipe) => /^https?:\/\//i.test(recipe.name))).toEqual([]);
        expect(derived.filter((recipe) => recipe.name.trim() === "")).toEqual([]);
    });

    it("leaves no recipe anywhere in the collection showing a URL for a name", () => {
        const showingAUrl = recipes.filter((recipe) => /^https?:\/\//i.test(recipe.name));

        expect(showingAUrl).toEqual([]);
    });
});
