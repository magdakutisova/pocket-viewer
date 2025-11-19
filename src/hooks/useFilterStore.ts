import { create } from "zustand";

interface FilterStore {
  status: "all" | "read" | "unread";
  search: string;
  setStatus: (status: "all" | "read" | "unread") => void;
  setSearch: (term: string) => void;
}

export const useFilterStore = create<FilterStore>((set) => ({
  status: "all",
  search: "",
  setStatus: (status) => set({ status }),
  setSearch: (term) => set({ search: term }),
}));