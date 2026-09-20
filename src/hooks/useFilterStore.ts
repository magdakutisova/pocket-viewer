import { create } from "zustand";

/** What the cook is browsing: everything, one Category, or the unfiled recipes. */
export type CategoryFilter =
  | { kind: "all" }
  | { kind: "named"; name: string }
  | { kind: "uncategorised" };

interface FilterStore {
  category: CategoryFilter;
  search: string;
  setCategory: (category: CategoryFilter) => void;
  setSearch: (term: string) => void;
}

export const useFilterStore = create<FilterStore>((set) => ({
  category: { kind: "all" },
  search: "",
  setCategory: (category) => set({ category }),
  setSearch: (term) => set({ search: term }),
}));
