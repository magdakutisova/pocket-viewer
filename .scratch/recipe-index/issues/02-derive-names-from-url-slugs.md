# 02 — Derive names for the 603 nameless recipes

**What to build:** The list reads as recipe names rather than as web addresses. Pocket never captured a title for 603 of the 3,357 recipes, and for those the export repeats the URL in the title column — so the collection currently shows `http://www.101cookbooks.com/archives/skinny-omelette-recipe.html` where a name belongs.

Every one of those 603 has a usable URL slug, so a readable name can be derived offline with no network calls: take the last meaningful path segment, drop any file extension, turn hyphens and underscores into spaces, and capitalise. That turns the example above into `Skinny omelette recipe`.

Czech slugs arrive without diacritics, so `svickova-na-smetane` becomes `Svickova na smetane` rather than `Svíčková na smetaně`. This is accepted: names are editable later, and a slightly wrong name beats a URL. Cover it with a test that documents the behaviour rather than treating it as a defect.

**Blocked by:** 01

**Status:** resolved

- [x] A name is derived only where the export's title equals its URL; recipes with a real title are left untouched
- [x] File extensions such as `.html`, `.htm`, `.php` and `.aspx` are stripped from the derived name
- [x] Hyphens and underscores become spaces, and the result is capitalised
- [x] All 603 affected recipes end up with a name that is not a URL, and none is left blank
- [x] A test covers a Czech slug and asserts the diacritic-free result, documenting it as expected
- [x] Derivation is part of the same pure module as parsing, with no network access
- [x] Running the app shows names instead of URLs throughout the list

## Comments

**Implemented** in `parseName` inside `src/import/parseExport.ts`, the same pure module as the rest of parsing.

The rule is the ticket's: derive only where the title repeats the URL, take the last meaningful path segment, drop the file extension, turn hyphens and underscores into spaces, capitalise. Asserted against the real export — all 603 get a name that is neither blank nor a URL, and no recipe anywhere in the collection still shows a URL where a name belongs.

Three judgement calls worth knowing about:

- **"Meaningful" excludes a segment that is only digits.** `thebrewerandthebaker.com/archives/14350` would otherwise be named `14350`; it is named `Archives` instead. Neither is a recipe name — this is the one URL of the 603 with no usable slug. A word scans better than an id, and the rule protects future imports of `/p/12345` URLs, but it is worth overriding by hand once editing exists.
- **A URL with no path falls back to the host.** `gordon.ura.cz/?p=2097` would name nothing at all. No row of the current export reaches this (the one path-less row has a real title), but the export must never be able to kill the import — the spec is explicit that no row is filtered out.
- **Percent-encoded segments are decoded**, which affects exactly one row.

**Verified in the signed-in app.** The list reads as names throughout. Two rows showed a leftover post id — `19511 leftover turkey recipe…` and `20966 cauliflower mashed potatoes recipe` — which only looking at the running list surfaced; a leading run of four or more digits is now dropped. Shorter leading numbers are kept, because 29 of the 31 names that start with a number need it: `7 layer bean dip`, `100 calorie chocolate cake`, `3 ingredient strawberry banana popsicles`.
