# 04 — Browse module: filter, search, sort, pagination

**What to build:** Everything you do to find a recipe, working properly and running instantly.

The behaviour lives in the page component today, mixed into rendering, and it only half exists: there is a search box and a read/unread control that does nothing, but no sorting at all. Lift it into a pure module that takes the collection plus criteria and returns the recipes to display. Being pure, every combination is testable in milliseconds without a browser.

Search should match both recipe names and Category names, and should ignore Czech diacritics on both sides — typing `svickova` while cooking must find `Svíčková`. Sorting covers name, date saved, Source and Category, in both directions, defaulting to newest first.

The read/unread control is removed rather than repaired. It filters on a field that holds `unread` on all 3,357 recipes, so it can only ever show everything or nothing, and the concept does not survive the move to a recipe index.

**Blocked by:** 01, 03

**Status:** ready-for-agent

- [ ] The browse logic is a pure module taking a collection and criteria, with no React or I/O
- [ ] Several Categories can be selected at once, and a recipe matching any of them appears
- [ ] A recipe held in several Categories appears under each of them
- [ ] Search matches recipe names and Category names, case-insensitively
- [ ] Search ignores diacritics on both sides: `svickova` finds `Svíčková`, and `Svíčková` finds it too
- [ ] Sorting works by name, date saved, Source and Category, each in both directions
- [ ] Newest first is the default order
- [ ] Pagination works, including the first and last page boundaries and an empty result
- [ ] The 96 recipes with no Category remain reachable through an uncategorised filter
- [ ] Each Category shows how many recipes it holds
- [ ] The read/unread control is gone
- [ ] The list is usable on a narrow phone-width viewport without horizontal scrolling

## Comments

Two of these landed early, by hand, while ticket 01 was being checked in the browser:

- The Category select has a **Bez kategorie** option, so the 96 unfiled recipes are already reachable. It is a third state on `CategoryFilter` in `src/hooks/useFilterStore.ts` (`all` / `named` / `uncategorised`), filtered in `Home.tsx` — no tests, because the filtering still lives in the component. Fold that shape into the browse module rather than reinventing it, and cover it there.
- `RecipeCard` had light-mode greys on the dark default background; it now carries `dark:` variants. Worth a look when the card is restyled for phone width.
