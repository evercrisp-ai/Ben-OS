import { create } from "zustand";
import { persist } from "zustand/middleware";

type QuickCreateType = "project" | "prd" | null;

interface UIState {
  sidebarCollapsed: boolean;
  sidebarOpen: boolean; // For mobile sheet
  commandPaletteOpen: boolean;
  quickCreateOpen: QuickCreateType;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setSidebarOpen: (open: boolean) => void;
  setCommandPaletteOpen: (open: boolean) => void;
  toggleCommandPalette: () => void;
  setQuickCreateOpen: (type: QuickCreateType) => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      sidebarCollapsed: false,
      sidebarOpen: false,
      commandPaletteOpen: false,
      quickCreateOpen: null,
      toggleSidebar: () =>
        set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
      setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      setCommandPaletteOpen: (open) => set({ commandPaletteOpen: open }),
      toggleCommandPalette: () =>
        set((state) => ({ commandPaletteOpen: !state.commandPaletteOpen })),
      setQuickCreateOpen: (type) => set({ quickCreateOpen: type }),
    }),
    {
      name: "ben-os-ui-store",
      partialize: (state) => ({
        sidebarCollapsed: state.sidebarCollapsed,
      }),
    }
  )
);

// Keyboard shortcuts registry
export interface KeyboardShortcut {
  key: string;
  modifiers?: ("ctrl" | "meta" | "alt" | "shift")[];
  description: string;
  action: () => void;
}

const registeredShortcuts: Map<string, KeyboardShortcut> = new Map();

export function registerShortcut(id: string, shortcut: KeyboardShortcut) {
  registeredShortcuts.set(id, shortcut);
}

export function unregisterShortcut(id: string) {
  registeredShortcuts.delete(id);
}

export function getRegisteredShortcuts(): string[] {
  return Array.from(registeredShortcuts.keys()).map((id) => {
    const shortcut = registeredShortcuts.get(id)!;
    const modifiers = shortcut.modifiers?.join("+") || "";
    return modifiers ? `${modifiers}+${shortcut.key}` : shortcut.key;
  });
}

export function handleKeyboardShortcut(event: KeyboardEvent): boolean {
  for (const [, shortcut] of registeredShortcuts) {
    const modifiersMatch =
      (!shortcut.modifiers || shortcut.modifiers.length === 0) ||
      shortcut.modifiers.every((mod) => {
        if (mod === "ctrl") return event.ctrlKey;
        if (mod === "meta") return event.metaKey;
        if (mod === "alt") return event.altKey;
        if (mod === "shift") return event.shiftKey;
        return false;
      });

    const keyMatch = event.key.toLowerCase() === shortcut.key.toLowerCase();

    if (modifiersMatch && keyMatch) {
      event.preventDefault();
      shortcut.action();
      return true;
    }
  }
  return false;
}
