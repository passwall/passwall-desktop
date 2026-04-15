import { useEffect } from "react";

interface ShortcutMap {
  [key: string]: () => void;
}

export function useKeyboardShortcuts(shortcuts: ShortcutMap) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const key = [
        e.metaKey || e.ctrlKey ? "mod" : "",
        e.shiftKey ? "shift" : "",
        e.altKey ? "alt" : "",
        e.key.toLowerCase(),
      ]
        .filter(Boolean)
        .join("+");

      if (shortcuts[key]) {
        e.preventDefault();
        shortcuts[key]();
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [shortcuts]);
}
