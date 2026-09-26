# 04 — Browse module: filter, search, sort, pagination

**What to build:** Everything you do to find a recipe, working properly and running instantly.

The behaviour lives in the page component today, mixed into rendering, and it only half exists: there is a search box and a read/unread control that does nothing, but no sorting at all. Lift it into a pure module that takes the collection plus criteria and returns the recipes to display. Being pure, every combination is testable in milliseconds without a browser.

Search should match both recipe names and Category names, and should ignore Czech diacritics on both sides — typing `svickova` while cooking must find `Svíčková`. Sorting covers name, date saved, Source and Category, in both directions, defaulting to newest first.

The read/unread control is removed rather than repaired. It filters on a field that holds `unread` on all 3,357 recipes, so it can only ever show everything or nothing, and the concept does not survive the move to a recipe index.

**Blocked by:** 01, 03

**Status:** resolved

- [x] The browse logic is a pure module taking a collection and criteria, with no React or I/O
- [x] Several Categories can be selected at once, and a recipe matching any of them appears
- [x] A recipe held in several Categories appears under each of them
- [x] Search matches recipe names and Category names, case-insensitively
- [x] Search ignores diacritics on both sides: `svickova` finds `Svíčková`, and `Svíčková` finds it too
- [x] Sorting works by name, date saved, Source and Category, each in both directions
- [x] Newest first is the default order
- [x] Pagination works, including the first and last page boundaries and an empty result
- [x] The 96 recipes with no Category remain reachable through an uncategorised filter
- [x] Each Category shows how many recipes it holds
- [x] The read/unread control is gone
- [x] The list is usable on a narrow phone-width viewport without horizontal scrolling

## Comments

Two of these landed early, by hand, while ticket 01 was being checked in the browser:

- The Category select has a **Bez kategorie** option, so the 96 unfiled recipes are already reachable. It is a third state on `CategoryFilter` in `src/hooks/useFilterStore.ts` (`all` / `named` / `uncategorised`), filtered in `Home.tsx` — no tests, because the filtering still lives in the component. Fold that shape into the browse module rather than reinventing it, and cover it there.
- `RecipeCard` had light-mode greys on the dark default background; it now carries `dark:` variants. Worth a look when the card is restyled for phone width.

**Implemented.** `src/browse/browse.ts` — collection and criteria in, the page to show out. 32 tests at that seam plus five against the real collection; `Home.tsx` now only renders what it returns.

Worth knowing:

- **Search folds diacritics on both sides**, so `svickova` finds `Svíčková` and `Svíčková` finds `Svickova`. Sorting by name uses Czech collation, where Č falls after C rather than after Z.
- **Sorting by Category** uses the alphabetically first Category a recipe holds, and unfiled recipes sort last in both directions rather than leading the list.
- **Sorting by Source uses the primary host**, which is the display name until Phase 3 renames one. Revisit with the rename tool.
- **Category counts come from the curated list**, so a Category holding nothing still appears rather than vanishing until something lands in it.
- **Picking Categories is a pure function** (`toggleCategory`), tested — including that taking the last one off means show everything, not show nothing.

**Collapsed on narrow screens.** At 375px the 27 Category chips filled half the screen before the first recipe, so below the `sm` breakpoint they fold behind a `Kategorie: …` toggle that names what is picked — `vše`, `bez kategorie`, or the first two and a count. Four recipes are visible where one was. A wider screen has room and shows the chips as before.

**Regression caught in review:** rewriting `RecipeList` dropped the `PAGE_BUTTON` styling added when the starter CSS was retired, leaving the pager as bare text with no disabled state. Restored, and now shared from `src/components/buttonStyles.ts` with the sort control using it too.
