import { create } from "zustand";
import { toggleCategory, type CategoryFilter, type Sort, type SortField } from "../browse/browse";

/** Which shelf the cook is looking at: the recipes, or the places they live. */
export type View = "recipes" | "sources";

interface FilterStore {
  view: View;
  categories: CategoryFilter;
  /** The primary host of the Source being browsed, or null for all of them. */
  source: string | null;
  search: string;
  sort: Sort;
  page: number;
  setView: (view: View) => void;
  /** Adds or removes one Category from the selection. */
  toggleCategory: (name: string) => void;
  showAllCategories: () => void;
  showUncategorised: () => void;
  setSource: (source: string | null) => void;
  setSearch: (term: string) => void;
  setSortField: (field: SortField) => void;
  flipSortDirection: () => void;
  setPage: (page: number) => void;
}

/** Every change to the criteria starts the list again at the first page. */
export const useFilterStore = create<FilterStore>((set) => ({
  view: "recipes",
  categories: { kind: "all" },
  source: null,
  search: "",
  sort: { field: "savedAt", direction: "desc" },
  page: 1,
  setView: (view) => set({ view }),
  toggleCategory: (name) =>
    set((state) => ({ categories: toggleCategory(state.categories, name), page: 1 })),
  showAllCategories: () => set({ categories: { kind: "all" }, page: 1 }),
  showUncategorised: () => set({ categories: { kind: "uncategorised" }, page: 1 }),
  setSource: (source) => set({ source, page: 1 }),
  setSearch: (term) => set({ search: term, page: 1 }),
  setSortField: (field) => set((state) => ({ sort: { ...state.sort, field }, page: 1 })),
  flipSortDirection: () =>
    set((state) => ({
      sort: { ...state.sort, direction: state.sort.direction === "asc" ? "desc" : "asc" },
      page: 1,
    })),
  setPage: (page) => set({ page }),
}));
