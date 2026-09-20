# 07 — Read the collection from Supabase

**What to build:** The real application. Everything you can already do — filter, search, sort, page through — now runs against the database rather than a file bundled into the build.

The whole collection is about half a megabyte, small enough to fetch in a single query when the app loads and hold in memory. Browsing then runs over that in-memory collection using the module from ticket 04. The database owns the data, the relations and the writes; it is not consulted on every keystroke. This keeps browsing instant on a slow kitchen connection and keeps the logic in tested pure functions rather than in SQL.

When this ticket is done, the bundled export is no longer read at runtime. It stays in version control as the original input — Pocket is gone and the file cannot be produced again — but the application never opens it.

**Blocked by:** 04, 06

**Status:** ready-for-agent

- [ ] The collection loads in a single query when the app starts
- [ ] Filtering, search, sorting and pagination all run in memory, with no request per interaction
- [ ] The bundled export is not read by the application at any point
- [ ] Soft-deleted recipes are excluded everywhere by default
- [ ] A loading state appears while the collection is being fetched
- [ ] A failed fetch shows an error rather than an empty collection presented as success
- [ ] A logged-out visitor sees no recipes
- [ ] All 3,357 recipes are present and correctly categorised when browsing
