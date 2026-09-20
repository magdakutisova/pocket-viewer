# Hosted backend (Supabase) rather than browser-local storage

The app began as a static viewer that parsed a bundled CSV in the browser, and the obvious next step for adding edits was browser-local storage (IndexedDB) — no server, no cost, no accounts. We chose a hosted Postgres backend on Supabase instead, because the collection has to be readable from a phone in the kitchen as well as from a laptop, and because roughly nine years of curation that can no longer be re-downloaded from a discontinued Pocket should not live in a single browser profile.

## Considered options

- **Browser-local (IndexedDB) + export** — rejected: no phone access, and a cleared cache loses everything between manual exports.
- **A file on disk the app reads and writes** — rejected: durable and portable, but no practical phone story and awkward browser file APIs.
- **PocketBase, self-hosted** — rejected reluctantly: fitting name, one binary, backed up by copying a file, but it needs a server the user must rent and maintain.
- **Firebase / Firestore** — rejected: a document store makes the Recipe–Category–Source relations clunky, and "all desserts from this blog" is a natural SQL join.

## Consequences

The bundled `src/data/pocket.csv` stops being the app's data source. It becomes the input to a one-time Import that seeds the database, after which the app never reads it again. The frontend stays a static React build; it gains a login because Supabase rows need an owner.
