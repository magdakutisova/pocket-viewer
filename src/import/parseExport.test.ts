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

describe("recipes Pocket never captured a name for", () => {
    it("reads a name out of the URL when the title is only the URL again", () => {
        const url = "http://www.101cookbooks.com/archives/skinny-omelette-recipe.html";
        const { recipes } = parseExport(exportOf(`${url},${url},1467204139,snídaně,unread`));

        expect(recipes[0].name).toBe("Skinny omelette recipe");
    });

    it("leaves a recipe that has a real name alone", () => {
        const { recipes } = parseExport(
            exportOf("Svíčková na smetaně,https://example.com/svickova-na-smetane,1467204139,hlavní jídla,unread"),
        );

        expect(recipes[0].name).toBe("Svíčková na smetaně");
    });

    it("derives a Czech name without its diacritics, which is expected and editable later", () => {
        const url = "http://www.smoothcooking.cz/2015/01/svickova-na-smetane.html";
        const { recipes } = parseExport(exportOf(`${url},${url},1467204139,hlavní jídla,unread`));

        // The slug carries no diacritics, so neither can the name derived from it.
        expect(recipes[0].name).toBe("Svickova na smetane");
    });

    it("copes with a trailing slash, underscores and other file extensions", () => {
        const withSlash = "https://www.jamieoliver.com/recipes/asian-inspired-turkey-salad/";
        const underscored = "https://www.simplyrecipes.com/recipes/turkey_soup_with_lemon.php";
        const { recipes } = parseExport(
            exportOf(
                `${withSlash},${withSlash},1467204139,saláty,unread`,
                `${underscored},${underscored},1467204139,polévky,unread`,
            ),
        );

        expect(recipes.map((recipe) => recipe.name)).toEqual([
            "Asian inspired turkey salad",
            "Turkey soup with lemon",
        ]);
    });

    it("skips a numeric last segment, which names nothing, for the one above it", () => {
        const url = "http://www.thebrewerandthebaker.com/archives/14350";
        const { recipes } = parseExport(exportOf(`${url},${url},1467204139,dezerty,unread`));

        expect(recipes[0].name).toBe("Archives");
    });

    it("drops a post id from the front of a slug, but keeps a number that is part of the name", () => {
        const withId = "https://www.seriouseats.com/recipes/19511-leftover-turkey-halal-cart-style.html";
        const withCount = "https://www.buzzfeed.com/recipes/7-layer-bean-dip";
        const { recipes } = parseExport(
            exportOf(
                `${withId},${withId},1467204139,hlavní jídla,unread`,
                `${withCount},${withCount},1467204139,svačiny a chuťovky,unread`,
            ),
        );

        expect(recipes.map((recipe) => recipe.name)).toEqual([
            "Leftover turkey halal cart style",
            "7 layer bean dip",
        ]);
    });

    it("falls back to the host when the URL carries no path to name it by", () => {
        const url = "http://gordon.ura.cz/?p=2097";
        const { recipes } = parseExport(exportOf(`${url},${url},1467204139,hlavní jídla,unread`));

        expect(recipes[0].name).toBe("Gordon.ura.cz");
    });
});

describe("the Sources recipes come from", () => {
    it("treats a blogspot.cz and blogspot.com pair as the one blog it is", () => {
        const { sources, recipes } = parseExport(
            exportOf(
                "Bábovka,http://hubneme-a-zhubneme.blogspot.cz/babovka.html,1467204139,dezerty,unread",
                "Koláč,http://hubneme-a-zhubneme.blogspot.cz/kolac.html,1467204139,dezerty,unread",
                "Buchty,http://hubneme-a-zhubneme.blogspot.com/buchty.html,1467204139,dezerty,unread",
            ),
        );

        expect(sources).toHaveLength(1);
        expect(sources[0].hosts).toEqual([
            "hubneme-a-zhubneme.blogspot.cz",
            "hubneme-a-zhubneme.blogspot.com",
        ]);
        expect(recipes.map((recipe) => recipe.source)).toEqual([
            "hubneme-a-zhubneme.blogspot.cz",
            "hubneme-a-zhubneme.blogspot.cz",
            "hubneme-a-zhubneme.blogspot.cz",
        ]);
    });

    it("leaves two generic domains on one stem as two Sources, which they usually are", () => {
        const { sources } = parseExport(
            exportOf(
                "Bábovka,http://example.com/babovka,1467204139,dezerty,unread",
                "Koláč,http://example.org/kolac,1467204139,dezerty,unread",
            ),
        );

        expect(sources.map((source) => source.name).sort()).toEqual([
            "example.com",
            "example.org",
        ]);
    });

    it("names the Source after whichever host holds the most recipes", () => {
        const { sources } = parseExport(
            exportOf(
                "Bábovka,http://example.cz/babovka,1467204139,dezerty,unread",
                "Koláč,http://example.com/kolac,1467204139,dezerty,unread",
                "Buchty,http://example.com/buchty,1467204139,dezerty,unread",
            ),
        );

        expect(sources[0].name).toBe("example.com");
    });

    it("links every recipe to exactly one Source", () => {
        const { recipes, sources } = parseExport(
            exportOf(
                "Omeleta,https://www.example.com/omeleta,1467204139,snídaně,unread",
                "Polévka,https://another.example/polevka,1467204139,,unread",
            ),
        );

        const names = sources.map((source) => source.name);
        expect(recipes.every((recipe) => names.includes(recipe.source))).toBe(true);
        expect(recipes.map((recipe) => recipe.source)).toEqual(["example.com", "another.example"]);
    });

    it("names one Source per host, lowercased and without its www", () => {
        const { sources } = parseExport(
            exportOf(
                "Omeleta,https://WWW.Example.com/omeleta,1467204139,snídaně,unread",
                "Salát,https://example.com/salat,1467204139,saláty,unread",
                "Polévka,https://another.example/polevka,1467204139,polévky,unread",
            ),
        );

        expect(sources.map((source) => source.name)).toEqual([
            "example.com",
            "another.example",
        ]);
    });
});

describe("names that arrived HTML-escaped", () => {
    it("reads the entities back as the characters they stand for", () => {
        const { recipes } = parseExport(
            exportOf(
                '&quot;Nereceptová jídla&quot; - svačinky poprvé ;-),https://example.com/svacinky,1467204139,svačiny a chuťovky,unread',
                "Tuňák &amp; ratatouille,https://example.com/tunak,1467204139,hlavní jídla,unread",
            ),
        );

        expect(recipes.map((recipe) => recipe.name)).toEqual([
            '"Nereceptová jídla" - svačinky poprvé ;-)',
            "Tuňák & ratatouille",
        ]);
    });

    it("does not decode twice, so an escaped entity survives as written", () => {
        const { recipes } = parseExport(
            exportOf("Recept &amp;quot;A&amp;quot;,https://example.com/a,1467204139,dezerty,unread"),
        );

        expect(recipes[0].name).toBe('Recept &quot;A&quot;');
    });
});

describe("what the Import reports about itself", () => {
    it("counts the recipes it had to name, so a wrong rule is visible in the summary", () => {
        const { summary } = parseExport(
            exportOf(
                "Vánočka,https://example.com/vanocka,1467204139,dezerty,unread",
                "https://example.com/svickova,https://example.com/svickova,1467204139,,unread",
                "https://example.com/gulas,https://example.com/gulas,1467204139,,unread",
            ),
        );

        expect(summary.namesDerived).toBe(2);
    });

    it("counts the Sources it collapsed, so a shelf listing blogs twice is visible too", () => {
        const { summary } = parseExport(
            exportOf(
                "Buchty,https://kucharka.blogspot.cz/buchty,1467204139,,unread",
                "Koláče,https://kucharka.blogspot.com/kolace,1467204139,,unread",
                "Guláš,https://jinyblog.cz/gulas,1467204139,,unread",
            ),
        );

        expect(summary.twinsCollapsed).toBe(1);
    });

    it("reports nothing derived or collapsed when there was nothing to do", () => {
        const { summary } = parseExport(
            exportOf("Vánočka,https://example.com/vanocka,1467204139,dezerty,unread"),
        );

        expect(summary).toEqual({ namesDerived: 0, twinsCollapsed: 0 });
    });
});
