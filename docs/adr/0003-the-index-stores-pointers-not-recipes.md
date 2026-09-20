# The index stores pointers, never recipe content

A Recipe record holds a name, its categories, and a pointer to where the instructions can be found — a URL, or later a cookbook and a page. It never holds ingredients or instructions. The app's job is to answer "what shall I cook, and where do I find it", then hand off to the blog or book that has the real thing.

This is recorded because it is the load-bearing "no". It keeps the app small: there is no rich-text editor, no ingredient model, no image storage, no parsing or scanning of recipe text, and no question of transcribing the 3,357 existing records. A future reader looking for those features should know they were excluded deliberately, not overlooked.

## Consequences

A recipe that exists nowhere else — handwritten on a card, or remembered from a relative — has no home in this app as designed. If that need becomes real, the honest options are to point the record at a scan or document stored elsewhere, or to revisit this decision explicitly. Adding a "just this once" content field is how the model rots.
