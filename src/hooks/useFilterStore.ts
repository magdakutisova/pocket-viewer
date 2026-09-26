import { create } from "zustand";

/** What the cook is browsing: everything, one Category, or the unfiled recipes. */
export type CategoryFilter =
  | { kind: "all" }
  | { kind: "named"; name: string }
  | { kind: "uncategorised" };

/** Which shelf the cook is looking at: the recipes, or the places they live. */
export type View = "recipes" | "sources";

interface FilterStore {
  view: View;
  category: CategoryFilter;
  /** The name of the Source being browsed, or null for all of them. */
  source: string | null;
  search: string;
  setView: (view: View) => void;
  setCategory: (category: CategoryFilter) => void;
  setSource: (source: string | null) => void;
  setSearch: (term: string) => void;
}

export const useFilterStore = create<FilterStore>((set) => ({
  view: "recipes",
  category: { kind: "all" },
  source: null,
  search: "",
  setView: (view) => set({ view }),
  setCategory: (category) => set({ category }),
  setSource: (source) => set({ source }),
  setSearch: (term) => set({ search: term }),
}));
