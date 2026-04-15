import { useEffect } from "react";
import { useUiStore } from "@/stores/ui-store";

export function useTheme() {
  const theme = useUiStore((s) => s.theme);

  useEffect(() => {
    const root = document.documentElement;

    const applyTheme = (dark: boolean) => {
      if (dark) {
        root.classList.add("dark");
      } else {
        root.classList.remove("dark");
      }
    };

    if (theme === "system") {
      const mq = window.matchMedia("(prefers-color-scheme: dark)");
      applyTheme(mq.matches);
      const handler = (e: MediaQueryListEvent) => applyTheme(e.matches);
      mq.addEventListener("change", handler);
      return () => mq.removeEventListener("change", handler);
    } else {
      applyTheme(theme === "dark");
    }
  }, [theme]);

  return theme;
}
