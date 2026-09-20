# 01 — Correct Category parsing, with tests

**What to build:** Browsing by Category returns the right recipes. Today it does not. The Pocket export separates Categories with `|`, but the app splits on `,`, so every recipe filed under more than one Category is filed under a single invented Category such as `dezerty|vánoce` — 447 recipes, roughly one in seven. The one Category whose name legitimately contains a comma, `marmelády, zavařování`, is split into two Categories that have never existed. Nothing about this looks broken on screen, which is why it has gone unnoticed.

Move parsing of the export into a pure module — text in, domain objects out, no network and no React — and fix the split. This is also where the project's test infrastructure comes from: there is none today, and Vitest fits a project already built on Vite. Rename the domain vocabulary to Recipe and Category while touching this code; see the glossary.

The app continues to read the bundled export. No database is involved in this ticket.

**Blocked by:** None — can start immediately

**Status:** ready-for-agent

- [ ] Vitest is installed and configured, and a test command runs the suite
- [ ] Parsing lives in a pure module with no I/O, no network access and no React dependency
- [ ] `dezerty|vánoce` produces two Categories
- [ ] `marmelády, zavařování` stays one Category, and it is found on 53 recipes
- [ ] `dezerty|marmelády, zavařování|přílohy` produces exactly three Categories
- [ ] A recipe with no Categories parses successfully and is kept, not discarded
- [ ] The export's `time_added` is converted from a Unix epoch in seconds to a date, not held as text
- [ ] Parsing the full export yields 27 distinct Categories
- [ ] The words Article, tag and status are gone from the code this ticket touches
- [ ] Running the app and filtering by a real Category shows correctly filed recipes, including ones held in several Categories
