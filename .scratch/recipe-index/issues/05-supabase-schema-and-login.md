# 05 — Supabase schema and login

**What to build:** A private place for the collection to live, and a way to prove it is yours.

Stand up the Supabase project and the schema: Recipe, Source, Category, and the many-to-many between Recipe and Category. A Recipe carries its name, its pointer, the date it was saved, Tried, Favourite, and a soft-deletion timestamp. It carries no read/unread field — that concept is gone.

Favourite means proven, and implies Tried. The database enforces this rather than trusting the UI: a Favourite that is not Tried must not be storable. See the glossary.

Row-level security restricts the collection to its owner. This is a single-person index; nobody else ever reads it.

The app still reads the bundled export in this ticket. Nothing is migrated yet — this ticket delivers a database that exists, is private, and can be logged into. See ADR-0001 for why a hosted backend rather than browser storage.

**Blocked by:** None — can start immediately

**Status:** ready-for-agent

- [ ] A Supabase project exists with tables for Recipe, Source, Category and the Recipe–Category link
- [ ] A Recipe holds name, pointer, date saved, Tried, Favourite and a soft-deletion timestamp
- [ ] No table carries a read/unread or status column
- [ ] A database constraint makes a Favourite that is not Tried impossible to store
- [ ] Row-level security allows only the owner to read or write any row
- [ ] Logging in works, and the session survives a page reload
- [ ] A logged-out visitor can reach no data at all
- [ ] Project credentials come from environment configuration and are not committed
