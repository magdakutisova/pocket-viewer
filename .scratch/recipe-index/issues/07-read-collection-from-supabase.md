# 07 — Read the collection from Supabase

**What to build:** The real application. Everything you can already do — filter, search, sort, page through — now runs against the database rather than a file bundled into the build.

The whole collection is about half a megabyte, small enough to fetch in a single query when the app loads and hold in memory. Browsing then runs over that in-memory collection using the module from ticket 04. The database owns the data, the relations and the writes; it is not consulted on every keystroke. This keeps browsing instant on a slow kitchen connection and keeps the logic in tested pure functions rather than in SQL.

When this ticket is done, the bundled export is no longer read at runtime. It stays in version control as the original input — Pocket is gone and the file cannot be produced again — but the application never opens it.

**Blocked by:** 04, 06

**Status:** done

- [x] The collection loads in a single query when the app starts
- [x] Filtering, search, sorting and pagination all run in memory, with no request per interaction
- [x] The bundled export is not read by the application at any point
- [x] Soft-deleted recipes are excluded everywhere by default
- [x] A loading state appears while the collection is being fetched
- [x] A failed fetch shows an error rather than an empty collection presented as success
- [x] A logged-out visitor sees no recipes
- [x] All 3,357 recipes are present and correctly categorised when browsing

## Comments

**Done.** Verified in the browser against the real collection, signed in.

- **One query.** `performance` shows exactly one call to `/rest/v1/rpc/collection`
  on load, ~640ms for the whole collection.
- **Nothing per interaction.** With `fetch` counted: search, both sort controls,
  two Category filters, next page and the switch to Sources cost **0** requests.
- **3,357 recipes, correctly categorised.** `svickova` finds Svíčková without
  diacritics; all 27 Categories with counts, `marmelády, zavařování` intact at
  53; a recipe under six Categories shows under each; 96 uncategorised; the
  shelf lists 318 Sources deepest-first with twins folded under "také".
- **Soft deletion excluded.** Soft-deleting one recipe took the collection to
  3356, removed it from the list and dropped its Source's count; restoring put
  it back at 3357 with its Categories intact.
- **Logged out reaches nothing.** `collection()` called with only the
  publishable key returns empty arrays — row-level security, not the UI hiding.
- **Loading and failure both show.** "Načítám sbírku…" while in flight; pointed
  at a function that does not exist, the screen reads what the database said.

### Why a database function rather than three selects

The ticket asks for a single query, and plain selects cannot give one here:
PostgREST returns at most 1000 rows against a collection of 3,357, and it cannot
embed `recipe(*, category(*))` because the foreign keys are composite on
`(id, owner_id)`. `public.collection()` returns the whole thing as one row of
JSON. It runs `security invoker`, so row-level security still applies, and it is
the single place `deleted_at is null` is enforced.

No browsing logic moved into SQL — the function assembles and hands over, and
`browse` still does all the filtering, search, sorting and pagination.

### Two things found while verifying

- **The collection was fetched twice on load.** React mounts an effect twice in
  development, and both mounts fetched. Concurrent callers now share one request;
  it is cleared once settled, so a genuine remount still gets fresh data.
- **A failed fetch said `[object Object]`.** Supabase rejects with a plain object,
  not an `Error`, so `String(error)` threw away the only line that explained the
  failure — on the screen whose entire job is explaining it.

### For Phase 2 and 3

`recipes[].source` carries the Source's **display name**, which matches what the
seed wrote and what the transform produced. `SourceList` filters by
`hosts[0]` — the primary host. The two are equal for all 318 Sources today, so
filtering works. **Renaming a Source in Phase 3 would break it.** Carry the
primary host on the Recipe instead, and look the display name up for showing.
