/** A pointer to where the instructions for one dish can be found. */
export interface Recipe {
    name: string;
    url: string;
    savedAt: Date;
    /** Names of the Categories this Recipe is filed under. */
    categories: string[];
}

/** A kitchen-domain label a Recipe is filed under. */
export interface Category {
    name: string;
}
