# 02 — Derive names for the 603 nameless recipes

**What to build:** The list reads as recipe names rather than as web addresses. Pocket never captured a title for 603 of the 3,357 recipes, and for those the export repeats the URL in the title column — so the collection currently shows `http://www.101cookbooks.com/archives/skinny-omelette-recipe.html` where a name belongs.

Every one of those 603 has a usable URL slug, so a readable name can be derived offline with no network calls: take the last meaningful path segment, drop any file extension, turn hyphens and underscores into spaces, and capitalise. That turns the example above into `Skinny omelette recipe`.

Czech slugs arrive without diacritics, so `svickova-na-smetane` becomes `Svickova na smetane` rather than `Svíčková na smetaně`. This is accepted: names are editable later, and a slightly wrong name beats a URL. Cover it with a test that documents the behaviour rather than treating it as a defect.

**Blocked by:** 01

**Status:** ready-for-agent

- [ ] A name is derived only where the export's title equals its URL; recipes with a real title are left untouched
- [ ] File extensions such as `.html`, `.htm`, `.php` and `.aspx` are stripped from the derived name
- [ ] Hyphens and underscores become spaces, and the result is capitalised
- [ ] All 603 affected recipes end up with a name that is not a URL, and none is left blank
- [ ] A test covers a Czech slug and asserts the diacritic-free result, documenting it as expected
- [ ] Derivation is part of the same pure module as parsing, with no network access
- [ ] Running the app shows names instead of URLs throughout the list
