# 06 — Seed script

**What to build:** The collection, moved out of a CSV file and into the database, once and correctly.

A one-off Node script run from a developer machine — there is no upload screen, because this happens once. The script does the I/O only; the transformation is the pure module built in tickets 01 to 03, reused rather than reimplemented. If a recipe is miscategorised here, it is miscategorised in the one place that has tests around it.

The script must be safe to run repeatedly. It will be run many times while the transform is being corrected, and a second run must not double the collection.

It prints a summary of what it did, because this is the moment to catch a silent transform bug — before the result becomes the thing you rely on. Check it against the expected shape: roughly 3,357 Recipes, 27 Categories, roughly 320 Sources.

Nothing is filtered out. That includes the roughly 30 records that are not recipes — `kosmetika`, `děti`, `cestování` — and the 96 with no Category. Pruning is a decision for later, made deliberately, not something the import does on your behalf.

**Blocked by:** 02, 03, 05

**Status:** ready-for-agent

- [ ] A Node script seeds the database from the bundled export
- [ ] It calls the existing pure transform module; no parsing logic is duplicated inside the script
- [ ] Running it twice leaves the same row counts as running it once
- [ ] It prints a summary: recipes, Sources, Categories created, names derived, and TLD twins collapsed
- [ ] The result matches the expected shape: about 3,357 Recipes, 27 Categories, about 320 Sources
- [ ] Every recipe keeps the date it was originally saved, not the date of the import
- [ ] All 3,357 rows are imported, including the non-recipe records and the 96 without a Category
- [ ] Spot-checking a multi-Category recipe in the database shows it linked to each of its Categories
