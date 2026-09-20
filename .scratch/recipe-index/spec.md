# Recipe Index

Status: ready-for-agent

Turn the Pocket export into a private recipe index, readable from a laptop and a phone, seeded once from `pocket.csv`.

Vocabulary in this document follows [CONTEXT.md](../../CONTEXT.md). Decisions recorded in [ADR-0001](../../docs/adr/0001-hosted-backend-for-cross-device-sync.md), [ADR-0002](../../docs/adr/0002-source-is-a-curated-entity-from-day-one.md), and [ADR-0003](../../docs/adr/0003-the-index-stores-pointers-not-recipes.md) are settled and must be respected, not revisited.

## Problem Statement

Pocket has been discontinued. Nine years of collecting — 3,357 saved recipes, hand-filed into 27 kitchen categories — now exist only as a CSV file that can never be re-downloaded. The current app can display that file but nothing more: it cannot add, change, or remove anything, and it exists only on the laptop it was built on.

Three problems follow from that.

**The collection is decaying in place.** The file is read-only by construction, so a recipe found today has nowhere to go, and one that turns out to be useless cannot be removed. The curation stops the day Pocket died.

**It is not where the cooking happens.** Deciding what to make happens in a kitchen, holding a phone. A collection that lives on a laptop in another room is not consulted.

**The categories — the most valuable part — are currently wrong.** Tag values in the export are separated by `|`, but the app splits on `,`. Every one of the 447 recipes filed under more than one category is read as a single nonsense category such as `dezerty|vánoce`, and the one category whose name legitimately contains a comma, `marmelády, zavařování`, is split into two categories that do not exist. Nothing about this looks broken on screen, which is why it has gone unnoticed. Half of the browsing value of the collection is silently unavailable.

There is also a smaller indignity: 603 recipes display a raw URL where their name should be, because Pocket never captured a title for them.

## Solution

A private recipe index holding **pointers to where recipes live**, never the recipes themselves. Browse by Category to decide what to cook; follow the pointer to the blog that has the instructions.

The collection moves out of the bundled CSV and into a hosted Postgres database, so the same recipes are available from a laptop and a phone, and so edits persist. The CSV becomes a one-time **Import** that seeds the database and is then no longer part of the running app.

The Import repairs the collection as it goes: it splits categories correctly, gives the 603 nameless recipes real names derived from their URL slugs, and builds a curated shelf of **Sources** — the blogs recipes come from — collapsing the 42 blogs that appear under two domains into one entry each.

Delivered in three phases, so the uncertain parts are proven first:

- **Phase 1 — the spine.** Schema, Import, login, and browsing, deployed and working on a phone. Read-only.
- **Phase 2 — editing.** Add, change, soft-delete with a recycle bin; Tried and Favourite.
- **Phase 3 — curation tools.** Merge and rename for Sources and Categories.

## User Stories

### Phase 1 — browsing the collection

1. As a cook, I want to see all my recipes in one list, so that nothing I saved over nine years is lost to a dead service.
2. As a cook, I want to open the index on my phone, so that I can decide what to make while standing in the kitchen.
3. As a cook, I want to log in to my own private index, so that my collection is mine alone and not visible to anyone else.
4. As a cook, I want to stay logged in between visits, so that I am not typing a password one-handed while cooking.
5. As a cook, I want to filter recipes by Category, so that I can look at only desserts when I need a dessert.
6. As a cook, I want to select more than one Category at once, so that I can see everything that would work as a light lunch.
7. As a cook, I want to see how many recipes are in each Category, so that I know where my collection is deep and where it is thin.
8. As a cook, I want recipes filed under several Categories to appear under each of them, so that a Christmas dessert is found whether I browse `dezerty` or `vánoce`.
9. As a cook, I want to search recipes by name, so that I can find the pretzel recipe I remember saving.
10. As a cook, I want search to match Category names too, so that typing a category name is a fast way to narrow the list.
11. As a cook, I want to search without typing Czech diacritics, so that `svickova` finds `Svíčková` when I am typing quickly.
12. As a cook, I want to sort by name, so that I can scan the collection alphabetically.
13. As a cook, I want to sort by the date I saved a recipe, so that I can see what I was interested in recently.
14. As a cook, I want to sort by Source, so that I can read down everything from one blog together.
15. As a cook, I want the newest recipes first by default, so that the list opens on what is most likely relevant.
16. As a cook, I want the list paginated, so that 3,357 recipes do not arrive as one unreadable page.
17. As a cook, I want to tap a recipe and be taken to the page that holds it, so that I get to the actual instructions in one step.
18. As a cook, I want to see which Source each recipe came from, so that I can judge whether I trust it before opening it.
19. As a cook, I want to browse the list of Sources I have collected from, so that I can go back to a blog I remember liking.
20. As a cook, I want to see all recipes from one Source, so that a blog I trust becomes a place to browse rather than a name.
21. As a cook, I want recipes that arrived with no Category to still be reachable, so that the 96 uncategorised ones are not invisible.
22. As a cook, I want the interface in Czech, so that it matches the language my collection is already in.
23. As a cook, I want the list to remain usable on a narrow phone screen, so that browsing in the kitchen is not an exercise in pinching and zooming.
24. As a cook, I want the collection to load once and then respond instantly to filtering and sorting, so that browsing feels immediate on a slow kitchen connection.

### Phase 1 — the Import

25. As someone seeding the index, I want the Pocket CSV loaded into the database in one operation, so that I can start using the collection without any manual data entry.
26. As someone seeding the index, I want Categories split on `|`, so that the 447 recipes filed under several Categories are filed correctly rather than under one invented Category.
27. As someone seeding the index, I want `marmelády, zavařování` preserved as the single Category it is, so that the comma in its name does not split it into two Categories that never existed.
28. As someone seeding the index, I want my 27 Categories created as records in their own right, so that they can later be renamed and merged rather than existing only as text.
29. As someone seeding the index, I want a Source created for each blog my recipes came from, so that I can browse by where recipes live.
30. As someone seeding the index, I want blogs that appear under both `.blogspot.cz` and `.blogspot.com` treated as one Source, so that my shelf does not open with half its blogs listed twice.
31. As someone seeding the index, I want the 603 recipes named after their URL to get a readable name derived from the URL slug, so that the list reads as recipe names rather than as web addresses.
32. As someone seeding the index, I want every one of the 3,357 rows imported, including the roughly 30 that are not recipes, so that nothing is silently discarded on my behalf.
33. As someone seeding the index, I want the date I originally saved each recipe preserved, so that sorting by date reflects nine years of collecting rather than the day I ran the import.
34. As someone seeding the index, I want to re-run the import during development without accumulating duplicates, so that I can fix the transform and try again.
35. As someone seeding the index, I want a summary of what the import did — recipes, Sources, Categories, names derived, twins collapsed — so that I can confirm it did what I expected before trusting it.

### Phase 2 — keeping the collection alive

36. As a cook, I want to add a recipe I found today, so that the collection keeps growing now that Pocket is gone.
37. As a cook, I want to pick Categories for a new recipe from my existing list, so that I never create a duplicate Category through a typo.
38. As a cook, I want a new recipe's Source recognised automatically from its URL, so that adding a recipe from a blog I already collect from takes no extra thought.
39. As a cook, I want to correct a recipe's name, so that I can fix the rough names the import derived from URL slugs.
40. As a cook, I want to change which Categories a recipe belongs to, so that my filing improves as my cooking changes.
41. As a cook, I want to delete a recipe I no longer want, so that the collection reflects what I actually use.
42. As a cook, I want a deleted recipe kept in a recycle bin, so that a mistaken tap on a phone does not permanently cost me something irreplaceable.
43. As a cook, I want to restore anything from the recycle bin, so that recovering from a mistake takes seconds and no technical help.
44. As a cook, I want to empty the recycle bin deliberately, so that I can make deletions final when I am certain.
45. As a cook, I want to mark a recipe as Tried, so that I can tell what I have actually cooked from what I have merely collected.
46. As a cook, I want to mark a Tried recipe as a Favourite, so that the ones worth repeating are distinguishable from the ones I made once.
47. As a cook, I want marking something a Favourite to record it as Tried automatically, so that the two never contradict each other.
48. As a cook, I want to filter to Favourites, so that I can find a reliable recipe when I do not want to experiment.
49. As a cook, I want to filter to things I have never Tried, so that I can pick something new when I do.

### Phase 3 — tidying the shelf

50. As a cook, I want to rename a Category, so that `#kopřivy` can lose the stray `#` everywhere at once.
51. As a cook, I want to merge two Categories, so that two names for the same thing become one.
52. As a cook, I want to add a new Category, so that my filing can grow with my cooking.
53. As a cook, I want to rename a Source, so that a shelf entry can read as the blog's real name rather than a domain.
54. As a cook, I want to merge two Sources, so that duplicate blogs the import did not catch can be joined by hand.
55. As a cook, I want to see how many recipes a Category or Source holds before I merge or rename it, so that I understand what a change will affect.

## Implementation Decisions

### Domain model

Four entities. A Recipe belongs to one Source and to any number of Categories.

| Entity | Holds | Notes |
| --- | --- | --- |
| **Recipe** | name, pointer (URL), date saved, Tried, Favourite, deleted-at | Never ingredients or instructions ([ADR-0003](../../docs/adr/0003-the-index-stores-pointers-not-recipes.md)) |
| **Source** | display name, the host(s) that map to it | Curated; several hosts may resolve to one Source ([ADR-0002](../../docs/adr/0002-source-is-a-curated-entity-from-day-one.md)) |
| **Category** | name | Curated list, renamable and mergeable |
| **Recipe–Category** | the many-to-many link | 447 recipes hold more than one Category |

Favourite implies Tried: the data layer must not permit a Favourite that is not Tried, and setting Favourite sets Tried.

Soft deletion is a timestamp on the Recipe, not a separate table. Every read path excludes soft-deleted Recipes by default; the recycle bin is the one view that includes them.

Recipes carry no `status` field. The Pocket concept of read/unread is gone from the model entirely — it held the value `unread` on all 3,357 rows and carried no information.

### Storage and architecture

Supabase (hosted Postgres) holds the data, with authentication for a single user and row-level security so the collection is private. The frontend remains a static React build, deployed to a host reachable from a phone.

**Supabase is storage and sync, not a query engine.** The whole collection is roughly half a megabyte of CSV, which is small enough to fetch in one query on load and hold in memory. Filtering, search, sorting, and pagination happen client-side over that in-memory collection — as the current app already does. Postgres owns the data, the relations, and the writes; it is not consulted on every keystroke. This keeps browsing instant on a slow connection, keeps the app working once loaded, and keeps the logic in pure functions rather than in SQL.

Writes go to Supabase directly and update the in-memory collection optimistically.

### The Import

A one-off Node script, run from a developer machine, not a screen in the app — it happens once. Its transform is a **separate pure module** taking CSV text and returning the Recipes, Sources, and Categories to create; the script does the I/O. A future import screen reuses the module rather than reimplementing the logic.

The transform's responsibilities:

- **Categories** split on `|` only. A comma is an ordinary character in a Category name; `marmelády, zavařování` is one Category, in 53 recipes.
- **Names**: where the export's `title` equals its `url`, derive a name from the last meaningful URL path segment — strip any file extension, replace hyphens and underscores with spaces, capitalise. This applies to 603 recipes and every one of them has a usable slug. Derived Czech names lose their diacritics; that is accepted, and names are editable.
- **Sources**: one per host, lowercased, `www.` stripped. Hosts differing only by a country-code TLD on the same stem are one Source — this collapses 42 blogspot pairs covering 1,686 recipes. The Source's display name defaults to its primary host.
- **Dates**: the export's `time_added` is a Unix epoch in seconds and must be converted, not stored as text.
- **Everything imports.** No row is filtered out, including the ~30 non-recipe rows and the 96 with no Categories.

The import must be idempotent — re-running it against an already-seeded database must not duplicate anything — so that the transform can be corrected and re-run during development.

After the import, the bundled CSV is no longer read by the application at any point.

### Expected shape after import

Roughly 3,357 Recipes, 27 Categories, and roughly 320 Sources, of which about 150 hold a single Recipe. These are the numbers to check the import against.

### Browsing

One pure module maps the in-memory collection plus criteria — Categories, search text, sort field and direction, page — to the Recipes to display. Search matches Recipe names and Category names, case-insensitively and ignoring Czech diacritics on both sides, so that `svickova` matches `Svíčková`.

### What is being replaced

The existing display, search, filter and pagination behaviour is preserved in function but rebuilt on the new model: it currently reads a CSV over HTTP into component state and filters inside the page component. The read/unread control is removed rather than reworked. Existing filter state management is reused where it fits the new criteria.

## Testing Decisions

There is no test infrastructure in this repo — no framework, no configuration, no test files. Phase 1 establishes it. Vitest, given the project already builds on Vite.

**What makes a good test here:** it exercises a module through its public interface and asserts on the values that come out. Tests describe behaviour a cook would recognise — "a recipe filed under two categories appears under both" — not the steps taken to produce it. No test asserts on internal structure, and none mocks Supabase: a test that mocks the database tests the mock.

**One seam, two modules.** Both are pure functions over data, with no I/O, so the whole suite runs without a database, a browser, or a network.

**The import transform** is the priority. It runs once, it determines the shape of all 3,357 records, and its failure mode is silent — the current `|` bug has miscategorised 447 recipes without anything appearing wrong. Tests are built from fixtures cut from the real export, chosen to cover the cases that actually bite:

- a recipe with several Categories separated by `|`
- the Category whose name contains a comma
- both together, as in `dezerty|marmelády, zavařování|přílohy`
- a recipe whose `title` equals its `url`, including a Czech slug that will lose diacritics
- a pair of hosts differing only by TLD, asserting one Source results
- a `www.`-prefixed host and its bare equivalent
- a recipe with no Categories
- an epoch timestamp, asserting a correct date
- the same input imported twice, asserting no duplication

**The browse module** is tested for the combinations that matter: multiple Categories selected at once, diacritic-insensitive search on both name and Category, each sort field in both directions, and pagination boundaries.

**Not covered by tests, and deliberately so:** Supabase I/O, authentication, and deployment. These are verified by running the app against the real project. The import is watched once, against its printed summary and the expected shape above.

There is no prior art in this repo to follow — these tests are the prior art for what comes after.

## Out of Scope

**Deferred to later work, and not to be built into this:**

- **The random picker** — "give me a dessert" — is part of the eventual vision, not this spec.
- **Sources that are not websites** — cookbooks, PDFs, emails, scanned tables of contents. Source is built as a curated entity in Phase 1 *specifically* so these fit later without a migration, but no non-web Source is created now.
- **A wishlist.** Favourite means proven and implies Tried, so there is no way to flag "excited to try this". This is a known gap, accepted deliberately.
- **Link checking.** A 30-recipe sample found 28 alive, and both failures were `403` responses from bot protection on pages that work fine in a browser — an automated checker would report live pages as dead. Not worth building.
- **Recipe content.** No ingredients, instructions, images, or scanning. See [ADR-0003](../../docs/adr/0003-the-index-stores-pointers-not-recipes.md).
- **Multiple users, sharing, or publishing.** One person, one login.
- **Fetching real page titles over the network** to improve the 603 derived names.
- **An import screen in the app.** The transform module is built to make one easy later; the screen is not built now.

## Further Notes

**Phase 1 is read-only on purpose.** The novel and uncertain work — Supabase, authentication, the import, and getting a build deployed somewhere a phone can reach — is all at the bottom of this stack, and the familiar work is at the top. Phase 1 proves the whole spine end to end with real data before any effort goes into editing screens or merge tools.

**The data is irreplaceable.** Pocket is gone and the export cannot be produced again. The bundled CSV should stay in version control as the original input even after it leaves the running application, and the soft-delete recycle bin exists because of this.

**Numbers cited throughout come from the actual export** and are worth re-deriving rather than trusting if the file is ever replaced: 3,357 recipes, 27 Categories, 360 hosts, 42 TLD-twinned blog pairs covering 1,686 recipes, 153 single-recipe hosts, 603 recipes needing a derived name, 447 recipes with multiple Categories, 53 recipes in the comma-named Category, 96 with no Category.

## Comments
