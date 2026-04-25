import { create } from "zustand";

interface ThemeState {
  isDark: boolean;
  toggle: () => void;
}

export const useThemeStore = create<ThemeState>((set) => ({
  isDark: localStorage.getItem("theme") === "dark",
  toggle: () =>
    set((state) => {
      const newValue = !state.isDark;
      localStorage.setItem("theme", newValue ? "dark" : "light");
      return { isDark: newValue };
    }),
}));
