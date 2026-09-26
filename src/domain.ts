/** A pointer to where the instructions for one dish can be found. */
export interface Recipe {
    name: string;
    url: string;
    savedAt: Date;
    /** Names of the Categories this Recipe is filed under. */
    categories: string[];
    /** The primary host of the one Source this Recipe came from. */
    source: string;
}

/** A kitchen-domain label a Recipe is filed under. */
export interface Category {
    name: string;
}

/**
 * A place recipes live. Curated rather than observed: one blog that answers to
 * two hosts is one Source.
 */
export interface Source {
    /** Display name. Defaults to the primary host; renamable later. */
    name: string;
    /**
     * Every host that resolves to this Source, the primary one first. The
     * primary host is what a Recipe links to, so a rename cannot orphan it.
     */
    hosts: string[];
    /** How many Recipes this Source holds — what makes the shelf worth reading. */
    recipeCount: number;
}
