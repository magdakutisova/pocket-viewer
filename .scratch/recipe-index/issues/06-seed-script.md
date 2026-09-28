# 06 — Seed script

**What to build:** The collection, moved out of a CSV file and into the database, once and correctly.

A one-off Node script run from a developer machine — there is no upload screen, because this happens once. The script does the I/O only; the transformation is the pure module built in tickets 01 to 03, reused rather than reimplemented. If a recipe is miscategorised here, it is miscategorised in the one place that has tests around it.

The script must be safe to run repeatedly. It will be run many times while the transform is being corrected, and a second run must not double the collection.

It prints a summary of what it did, because this is the moment to catch a silent transform bug — before the result becomes the thing you rely on. Check it against the expected shape: roughly 3,357 Recipes, 27 Categories, roughly 320 Sources.

Nothing is filtered out. That includes the roughly 30 records that are not recipes — `kosmetika`, `děti`, `cestování` — and the 96 with no Category. Pruning is a decision for later, made deliberately, not something the import does on your behalf.

**Blocked by:** 02, 03, 05

**Status:** done

- [x] A Node script seeds the database from the bundled export
- [x] It calls the existing pure transform module; no parsing logic is duplicated inside the script
- [x] Running it twice leaves the same row counts as running it once
- [x] It prints a summary: recipes, Sources, Categories created, names derived, and TLD twins collapsed
- [x] The result matches the expected shape: about 3,357 Recipes, 27 Categories, about 320 Sources
- [x] Every recipe keeps the date it was originally saved, not the date of the import
- [x] All 3,357 rows are imported, including the non-recipe records and the 96 without a Category
- [x] Spot-checking a multi-Category recipe in the database shows it linked to each of its Categories

## Comments

**Done.** Seeded against the real project; all eight criteria verified from the
database rather than from the transform that produced it.

```
  Recipes                 3357
  Categories                27
  Sources                  318
    their hosts            360
  Recipe–Category links   3835
  Names derived from URLs  603
  TLD twins collapsed       42
```

Every figure matches what the export is known to hold. Run twice more: no new
rows either time. `npm run seed:verify` re-checks the spot-checks — 447 recipes
linked to more than one Category, `marmelády, zavařování` present as one
Category holding 53 recipes with no stray `marmelády` beside it, 96 recipes with
no Category, dates spanning 2013-03-30 to 2025-05-25 rather than the day of the
import.

Favourite implying Tried was confirmed by hand: writing `favourite = true,
tried = false` stores `true, true`. The database repairs the contradiction
rather than rejecting it, which is what the trigger is for.

### Two bugs the "run it twice" criterion caught

**Unordered pagination.** Reading ids back used `.range()` with no `order`.
Postgres promises no row order, and an upsert rewrites a row and moves it, so
the second run's pages overlapped and dropped ids — which arrived at Postgres as
a not-null violation on `recipe_category.recipe_id`. Fixed by ordering, and by
checking every row resolved to an id before writing anything that depends on it.
The first run passed, so only re-running found this.

**The service-role key guard was blind to legacy keys.** Covered on ticket 05.

### For ticket 07

- **PostgREST cannot embed across these relations.** `recipe(*, category(*))`
  fails with "Could not find a relationship in the schema cache", because the
  foreign keys are composite on `(id, owner_id)`. Either select the three tables
  and join in memory — which suits a collection held in memory anyway — or add a
  plain single-column FK alongside for PostgREST to infer from.
- **A select returns at most 1000 rows.** The collection is 3,357, so the load
  must paginate with `.range()` and an `order`, or ask for a higher limit. A
  single unpaginated query silently returns a third of the collection and looks
  like success. `scripts/verify-seed.ts` has the walk.
- **Re-running the seed preserves `tried`, `favourite` and `deleted_at`.** They
  are left out of the upsert payload deliberately.
