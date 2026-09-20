# Pocket Viewer

A personal index of recipes the user has collected. It records **where each recipe can be found**, never the recipe itself — the user browses by category to decide what to cook, then the index sends them to the blog, book, or file that holds the actual instructions.

## Language

**Recipe**:
A pointer to where the instructions for one dish can be found. Carries a name and its categories; never carries ingredients or instructions.
_Avoid_: Article, bookmark, link, item, entry

**Category**:
A kitchen-domain label a Recipe is filed under, from the user's own curated vocabulary (`dezerty`, `hlavní jídla`, `snídaně`, …). A Recipe may hold several.
_Avoid_: Tag, label, folder

**Source**:
A place recipes live — a blog, a cookbook, an email thread. Curated rather than observed: two web hosts can be one Source, and the user may rename or merge them.
_Avoid_: Site, domain, host, publisher, origin

**Tried**:
Whether the user has actually cooked a Recipe. A plain fact about the past, carrying no opinion about the result.
_Avoid_: Read, done, complete

**Favourite**:
A Recipe the user has cooked and would cook again. Being a Favourite implies being Tried — a dish you have never made cannot be a Favourite, however much you want to try it.
_Avoid_: Starred, saved, wishlist, want-to-try

**Import**:
Bringing recipes into the index from outside it — the Pocket CSV is the first one. An Import is a channel, never a Source; the Pocket export is not a place recipes live.
_Avoid_: Source, upload, sync
