# 03 — Derive Sources, collapsing the TLD twins

**What to build:** A browsable shelf of the places your recipes come from, with each blog appearing once.

Recipes span 360 distinct hosts, but 42 of those blogs appear under two domains each, because Google retired `blogspot.cz` in favour of `blogspot.com` partway through nine years of collecting. `hubneme-a-zhubneme.blogspot.cz` holds 162 recipes and `.blogspot.com` holds 18 — one blog, two entries. `delicious-blog-lucie` is split almost evenly at 115 and 104. Half the collection, 1,686 recipes, sits on a host that has a twin. A shelf built naively from hosts would open with half its blogs listed twice.

Derive one Source per host — lowercased, `www.` stripped — then merge hosts that differ only by a country-code TLD on the same stem. The Source's display name defaults to its primary host; renaming comes later.

Sources are curated records rather than a value derived on the fly, so that a cookbook can later be a Source in exactly the way a blog is. See ADR-0002.

**Blocked by:** 01

**Status:** ready-for-agent

- [ ] One Source per host, lowercased, with a leading `www.` removed
- [ ] Hosts differing only by a country-code TLD on the same stem resolve to one Source, covering all 42 known pairs
- [ ] Every recipe is linked to exactly one Source
- [ ] A Source's display name defaults to its primary host
- [ ] Parsing the full export yields roughly 320 Sources, of which about 150 hold a single recipe
- [ ] A test asserts that a `.blogspot.cz` and `.blogspot.com` pair produces one Source holding the recipes of both
- [ ] A test covers a `www.`-prefixed host and its bare equivalent resolving to one Source
- [ ] Each recipe in the list shows which Source it came from
- [ ] The Sources can be browsed as a list, and selecting one shows the recipes it holds
