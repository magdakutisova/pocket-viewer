import { create } from "zustand";

interface FilterStore {
  /** The Category being browsed, or null for the whole collection. */
  category: string | null;
  search: string;
  setCategory: (category: string | null) => void;
  setSearch: (term: string) => void;
}

export const useFilterStore = create<FilterStore>((set) => ({
  category: null,
  search: "",
  setCategory: (category) => set({ category }),
  setSearch: (term) => set({ search: term }),
}));
