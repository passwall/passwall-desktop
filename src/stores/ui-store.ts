import { create } from "zustand";
import type { Notification } from "@/types";

let notificationId = 0;

export type ThemeMode = "light" | "dark" | "system";

interface UiState {
  searchQuery: string;
  selectedItemId: string | null;
  notifications: Notification[];
  sidebarCollapsed: boolean;
  theme: ThemeMode;

  setSearchQuery: (query: string) => void;
  setSelectedItemId: (id: string | null) => void;
  addNotification: (
    type: Notification["type"],
    message: string,
    duration?: number
  ) => void;
  removeNotification: (id: string) => void;
  toggleSidebar: () => void;
  setTheme: (theme: ThemeMode) => void;
}

const savedTheme =
  (localStorage.getItem("passwall_theme") as ThemeMode) || "dark";

export const useUiStore = create<UiState>((set, get) => ({
  searchQuery: "",
  selectedItemId: null,
  notifications: [],
  sidebarCollapsed: false,
  theme: savedTheme,

  setSearchQuery(query: string) {
    set({ searchQuery: query });
  },

  setSelectedItemId(id: string | null) {
    set({ selectedItemId: id });
  },

  addNotification(type, message, duration = 4000) {
    const id = `notification-${++notificationId}`;
    const notification: Notification = { id, type, message };
    set({ notifications: [...get().notifications, notification] });

    if (duration > 0) {
      setTimeout(() => {
        get().removeNotification(id);
      }, duration);
    }
  },

  removeNotification(id: string) {
    set({
      notifications: get().notifications.filter((n) => n.id !== id),
    });
  },

  toggleSidebar() {
    set({ sidebarCollapsed: !get().sidebarCollapsed });
  },

  setTheme(theme: ThemeMode) {
    set({ theme });
    localStorage.setItem("passwall_theme", theme);
  },
}));
