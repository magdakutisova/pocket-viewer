# 03 — Derive Sources, collapsing the TLD twins

**What to build:** A browsable shelf of the places your recipes come from, with each blog appearing once.

Recipes span 360 distinct hosts, but 42 of those blogs appear under two domains each, because Google retired `blogspot.cz` in favour of `blogspot.com` partway through nine years of collecting. `hubneme-a-zhubneme.blogspot.cz` holds 162 recipes and `.blogspot.com` holds 18 — one blog, two entries. `delicious-blog-lucie` is split almost evenly at 115 and 104. Half the collection, 1,686 recipes, sits on a host that has a twin. A shelf built naively from hosts would open with half its blogs listed twice.

Derive one Source per host — lowercased, `www.` stripped — then merge hosts that differ only by a country-code TLD on the same stem. The Source's display name defaults to its primary host; renaming comes later.

Sources are curated records rather than a value derived on the fly, so that a cookbook can later be a Source in exactly the way a blog is. See ADR-0002.

**Blocked by:** 01

**Status:** resolved

- [x] One Source per host, lowercased, with a leading `www.` removed
- [x] Hosts differing only by a country-code TLD on the same stem resolve to one Source, covering all 42 known pairs
- [x] Every recipe is linked to exactly one Source
- [x] A Source's display name defaults to its primary host
- [x] Parsing the full export yields roughly 320 Sources, of which about 150 hold a single recipe
- [x] A test asserts that a `.blogspot.cz` and `.blogspot.com` pair produces one Source holding the recipes of both
- [x] A test covers a `www.`-prefixed host and its bare equivalent resolving to one Source
- [x] Each recipe in the list shows which Source it came from
- [x] The Sources can be browsed as a list, and selecting one shows the recipes it holds

## Comments

**Implemented.** `collectSources` in `src/import/parseExport.ts` builds the shelf; `SourceList` renders it; selecting a Source filters the recipe list. Verified in the signed-in app: 318 Sources, and selecting `sonnentor.com` shows all 16 recipes from both of its hosts.

**The 42 pairs are 41 blogspot pairs plus one other.** The spec and ADR-0002 both say "42 blogspot pairs covering 1,686 recipes". 41 of them are blogspot (1,670 recipes); the 42nd is `sonnentor.cz` + `sonnentor.com` (16), one shop under two flags. Both totals in the spec are right, the composition is not. The test names this rather than counting to 42 and moving on.

**The merge rule is narrower than "same stem".** Two hosts on one stem merge only when one of them carries a two-letter country TLD. `example.com` and `example.org` stay apart — on one stem, but as often two owners as one, and merging by hand is the cheaper mistake to fix. No pair in this export is affected either way.

**Recipes link to a Source by its primary host, not its display name**, so renaming in Phase 3 cannot orphan them. This matches `source.primary_host` in the migration ticket 05 wrote; ticket 06 maps that to the real uuid at insert.

**Left for ticket 04:** the shelf is sorted deepest-first and is not searchable or paginated. With 318 entries and a long tail of 153 holding one recipe each, it wants the browse module.
