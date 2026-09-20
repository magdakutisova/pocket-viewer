# Source is a curated entity, built from day one

A link index would normally treat "where this came from" as a string on each record, or derive it from the URL host on the fly. We made Source a first-class curated record instead — one that the user can rename and merge — and we built it into the first release rather than deferring it, because browsing the shelf of places recipes live is a core part of what this app is for.

The deciding evidence was in the data. The 3,357 imported recipes span 360 distinct hosts, but 42 of those blogs appear under two TLDs each, because Google retired `blogspot.cz` in favour of `blogspot.com` partway through the user's collecting. `hubneme-a-zhubneme.blogspot.cz` (162 recipes) and `.blogspot.com` (18) are one blog; `delicious-blog-lucie` is split almost evenly, 115 and 104. **1,686 recipes — half the collection — sit on a host that has a twin.** Derived-on-the-fly sources would present half the user's blogs twice, with no way to say "these are the same place".

## Considered options

- **Defer it; URL only for now** — the original recommendation, rejected by the user. It buys little for web recipes today but leaves a migration once paper books arrive, and paper books are the whole point of the eventual expansion.
- **Free text per recipe** — rejected: typo variants silently fragment the shelf, and renaming a cookbook means editing every recipe that cites it.

## Consequences

Import must create Sources, not just recipes, applying a normalisation rule for the known TLD twins. The long tail is real — 153 hosts hold exactly one recipe each — so the shelf starts with roughly 320 entries, and a merge tool is required rather than optional. In exchange, a paper cookbook is modelled the same way a blog is: one Source, many Recipes, its name typed once.
