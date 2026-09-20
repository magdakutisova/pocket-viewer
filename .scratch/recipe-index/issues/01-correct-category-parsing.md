# 01 — Correct Category parsing, with tests

**What to build:** Browsing by Category returns the right recipes. Today it does not. The Pocket export separates Categories with `|`, but the app splits on `,`, so every recipe filed under more than one Category is filed under a single invented Category such as `dezerty|vánoce` — 447 recipes, roughly one in seven. The one Category whose name legitimately contains a comma, `marmelády, zavařování`, is split into two Categories that have never existed. Nothing about this looks broken on screen, which is why it has gone unnoticed.

Move parsing of the export into a pure module — text in, domain objects out, no network and no React — and fix the split. This is also where the project's test infrastructure comes from: there is none today, and Vitest fits a project already built on Vite. Rename the domain vocabulary to Recipe and Category while touching this code; see the glossary.

The app continues to read the bundled export. No database is involved in this ticket.

**Blocked by:** None — can start immediately

**Status:** resolved

- [x] Vitest is installed and configured, and a test command runs the suite
- [x] Parsing lives in a pure module with no I/O, no network access and no React dependency
- [x] `dezerty|vánoce` produces two Categories
- [x] `marmelády, zavařování` stays one Category, and it is found on 53 recipes
- [x] `dezerty|marmelády, zavařování|přílohy` produces exactly three Categories
- [x] A recipe with no Categories parses successfully and is kept, not discarded
- [x] The export's `time_added` is converted from a Unix epoch in seconds to a date, not held as text
- [x] Parsing the full export yields 27 distinct Categories
- [x] The words Article, tag and status are gone from the code this ticket touches
- [x] Running the app and filtering by a real Category shows correctly filed recipes, including ones held in several Categories

## Comments

**Implemented.** Parsing now lives in `src/import/parseExport.ts` — CSV text in, Recipes and Categories out, no I/O, no network, no React. Vitest runs via `npm test`.

The real export is asserted against directly in `parseExport.realExport.test.ts`: 3,357 recipes, 27 Categories, `marmelády, zavařování` on 53 recipes, 447 recipes under more than one Category, 96 under none, no Category containing a pipe, and every recipe carrying a real date.

Two things found while building, beyond the checklist:

- Category names are trimmed, so `dezerty| vánoce` cannot invent a 28th Category through a stray space. The current export is clean, but the failure mode is the silent one this ticket is about.
- The app read the CSV over HTTP from `/src/data/pocket.csv`, a path that only resolves in dev. It is now imported as text (`?raw`), so the bundled export works in a build too. It leaves the app entirely in ticket 07.

The read/unread control is gone; the Category filter took its place. Multi-select, counts, sorting and diacritic-insensitive search are ticket 04.
