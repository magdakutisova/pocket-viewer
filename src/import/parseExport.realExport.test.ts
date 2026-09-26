import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import Papa from "papaparse";
import { describe, expect, it } from "vitest";
import { parseExport } from "./parseExport";

const exportText = readFileSync(
    fileURLToPath(new URL("../data/pocket.csv", import.meta.url)),
    "utf8",
);

const { recipes, categories, sources } = parseExport(exportText);

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

    it("leaves no name still carrying an HTML entity, as 32 of them did", () => {
        const escaped = recipes.filter((recipe) => /&(quot|amp|apos|lt|gt|nbsp|#\d+);/i.test(recipe.name));

        expect(escaped).toEqual([]);
    });

    it("leaves no recipe anywhere in the collection showing a URL for a name", () => {
        const showingAUrl = recipes.filter((recipe) => /^https?:\/\//i.test(recipe.name));

        expect(showingAUrl).toEqual([]);
    });
});

describe("the shelf of Sources", () => {
    it("holds 318 Sources, one per place rather than one per host", () => {
        const hosts = sources.flatMap((source) => source.hosts);

        expect(new Set(hosts).size).toBe(360);
        expect(sources).toHaveLength(318);
    });

    it("collapses the 41 blogspot blogs that answer to two hosts, and sonnentor", () => {
        const twinned = sources.filter((source) => source.hosts.length > 1);
        const blogspot = twinned.filter((source) =>
            source.hosts.every((host) => host.includes(".blogspot.")),
        );

        // The spec calls these "42 blogspot pairs". 41 of them are blogspot;
        // the 42nd is sonnentor.cz and sonnentor.com, one shop under two flags.
        expect(blogspot).toHaveLength(41);
        expect(twinned).toHaveLength(42);
        expect(twinned.find((source) => !source.hosts[0].includes(".blogspot."))?.hosts).toEqual([
            "sonnentor.com",
            "sonnentor.cz",
        ]);
    });

    it("gathers the 1,686 recipes that sit on a twinned host under one Source each", () => {
        const twinned = sources.filter((source) => source.hosts.length > 1);
        const namesOfTwinned = new Set(twinned.map((source) => source.name));
        const onATwinnedHost = recipes.filter((recipe) => namesOfTwinned.has(recipe.source));

        expect(onATwinnedHost).toHaveLength(1686);
    });

    it("keeps hubneme-a-zhubneme, split 162 and 18, as one blog", () => {
        const source = sources.find((it) => it.name.startsWith("hubneme-a-zhubneme"));

        expect(source?.hosts).toEqual([
            "hubneme-a-zhubneme.blogspot.cz",
            "hubneme-a-zhubneme.blogspot.com",
        ]);
        expect(recipes.filter((recipe) => recipe.source === source?.name)).toHaveLength(180);
    });

    it("opens with the long tail the shelf is known to have: 153 Sources of one recipe", () => {
        const recipesPerSource = new Map<string, number>();
        for (const recipe of recipes) {
            recipesPerSource.set(recipe.source, (recipesPerSource.get(recipe.source) ?? 0) + 1);
        }
        const holdingOne = [...recipesPerSource.values()].filter((count) => count === 1);

        expect(holdingOne).toHaveLength(153);
    });

    it("gives every recipe a Source that is on the shelf", () => {
        const onTheShelf = new Set(sources.map((source) => source.name));
        const orphaned = recipes.filter((recipe) => !onTheShelf.has(recipe.source));

        expect(orphaned).toEqual([]);
    });
});
