# 05 — Supabase schema and login

**What to build:** A private place for the collection to live, and a way to prove it is yours.

Stand up the Supabase project and the schema: Recipe, Source, Category, and the many-to-many between Recipe and Category. A Recipe carries its name, its pointer, the date it was saved, Tried, Favourite, and a soft-deletion timestamp. It carries no read/unread field — that concept is gone.

Favourite means proven, and implies Tried. The database enforces this rather than trusting the UI: a Favourite that is not Tried must not be storable. See the glossary.

Row-level security restricts the collection to its owner. This is a single-person index; nobody else ever reads it.

The app still reads the bundled export in this ticket. Nothing is migrated yet — this ticket delivers a database that exists, is private, and can be logged into. See ADR-0001 for why a hosted backend rather than browser storage.

**Blocked by:** None — can start immediately

**Status:** ready-for-human

- [ ] A Supabase project exists with tables for Recipe, Source, Category and the Recipe–Category link — *schema written; creating the project is a manual step*
- [x] A Recipe holds name, pointer, date saved, Tried, Favourite and a soft-deletion timestamp
- [x] No table carries a read/unread or status column
- [x] A database constraint makes a Favourite that is not Tried impossible to store
- [x] Row-level security allows only the owner to read or write any row
- [ ] Logging in works, and the session survives a page reload — *built and verified against an unreachable project; needs the real one to confirm*
- [x] A logged-out visitor can reach no data at all
- [x] Project credentials come from environment configuration and are not committed

## Comments

**Implemented in `1410158`, on branch `ticket-05-supabase-schema-and-login`.**

Everything the repo can hold is delivered: the schema and row-level security in
`supabase/migrations/0001_recipe_index.sql`, the credential reader in
`src/supabase/`, and login in `src/auth/`.

**Two steps are yours, and are not automatable** — they need an account and a
password. `docs/supabase-setup.md` walks through both: create the project and
run the migration, then create the single user in the dashboard with *Auto
Confirm* ticked and turn new sign-ups off. The last two checkboxes close once
that is done.

### Decisions worth knowing about downstream

- **A fifth table, `source_host`.** A Source maps from several hosts — the 42
  blogspot TLD twins — and plural hosts cannot live on one column.
  `source.primary_host` is the identity a Source is upserted by; `source_host`
  holds every host that resolves to it, the primary one included. Nothing
  enforces that pairing, so ticket 06 must insert both.
- **`owner_id` defaults to `auth.uid()`**, which is the signed-in person in the
  browser but **null under a service-role key**. Ticket 06's Node seeder must
  set `owner_id` explicitly on every row or every insert fails the not-null
  constraint.
- **Unique keys chosen for ticket 06's idempotency**: `(owner_id, url)` on
  recipe, `(owner_id, name)` on category, `(owner_id, primary_host)` on source.
  Re-running the import upserts rather than duplicates.
- **Relations are composite foreign keys on `(id, owner_id)`**, so a row owned by
  someone other than its parent is unrepresentable rather than merely forbidden
  by policy.
- **Re-running the migration does not alter existing tables.** It is safe to
  re-run, but a changed column or constraint needs a `drop table` while the
  database is still empty, or a second migration file once it is not.

### Out of scope, deliberately

The app still reads the bundled CSV, as the ticket specifies. Nothing queries
Supabase yet — that is ticket 07.

### Noticed in passing

`src/index.css` still carries the unlayered Vite starter rules
(`body{display:flex}`, `h1{font-size:3.2em}`, `button{background}`), which
outrank Tailwind's layered utilities app-wide. One line was added here
(`#root { width: 100% }`) because without it nothing can centre itself; the rest
is worked around with `!` utilities in the auth components. Deleting the starter
block would remove those workarounds and fix `Home`'s heading and centering too.
Left alone because ticket 01 was editing those same screens in parallel.
