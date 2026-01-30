"use client";

import { useEffect, useRef } from "react";
import {
  registerShortcut,
  unregisterShortcut,
  handleKeyboardShortcut,
  type KeyboardShortcut,
} from "@/stores/ui-store";

export function useKeyboardShortcuts(
  shortcuts: Record<string, Omit<KeyboardShortcut, "key"> & { key: string }>
) {
  useEffect(() => {
    // Register all shortcuts
    Object.entries(shortcuts).forEach(([id, shortcut]) => {
      registerShortcut(id, shortcut);
    });

    // Global keyboard event listener
    const handleKeyDown = (event: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in input fields
      const target = event.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        return;
      }

      handleKeyboardShortcut(event);
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      // Unregister all shortcuts on cleanup
      Object.keys(shortcuts).forEach((id) => {
        unregisterShortcut(id);
      });
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [shortcuts]);
}

// Hook to register a single shortcut
export function useKeyboardShortcut(
  id: string,
  shortcut: KeyboardShortcut,
  deps: React.DependencyList = []
) {
  // Use a ref to hold the action so we don't need to re-register on every action change
  const actionRef = useRef(shortcut.action);
  
  // Update the ref when action changes
  useEffect(() => {
    actionRef.current = shortcut.action;
  }, [shortcut.action]);

  useEffect(() => {
    const wrappedShortcut: KeyboardShortcut = {
      ...shortcut,
      action: () => actionRef.current(),
    };
    
    registerShortcut(id, wrappedShortcut);

    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        return;
      }

      handleKeyboardShortcut(event);
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      unregisterShortcut(id);
      document.removeEventListener("keydown", handleKeyDown);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, shortcut.key, shortcut.description, ...deps]);
}
