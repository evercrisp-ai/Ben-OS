"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  LayoutDashboard,
  FolderKanban,
  Kanban,
  FileText,
  BarChart3,
  Settings,
  Plus,
  Moon,
  Sun,
  Laptop,
} from "lucide-react";
import { useTheme } from "next-themes";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";
import { useUIStore } from "@/stores/ui-store";

interface CommandItem {
  id: string;
  label: string;
  icon: React.ElementType;
  shortcut?: string;
  action: () => void;
}

export function CommandPalette() {
  const router = useRouter();
  const { commandPaletteOpen, setCommandPaletteOpen } = useUIStore();
  const { setTheme } = useTheme();

  // Register keyboard shortcut
  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setCommandPaletteOpen(!commandPaletteOpen);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [commandPaletteOpen, setCommandPaletteOpen]);

  const navigationItems: CommandItem[] = [
    {
      id: "dashboard",
      label: "Go to Dashboard",
      icon: LayoutDashboard,
      shortcut: "⌘D",
      action: () => {
        router.push("/");
        setCommandPaletteOpen(false);
      },
    },
    {
      id: "projects",
      label: "Go to Projects",
      icon: FolderKanban,
      shortcut: "⌘P",
      action: () => {
        router.push("/projects");
        setCommandPaletteOpen(false);
      },
    },
    {
      id: "boards",
      label: "Go to Boards",
      icon: Kanban,
      action: () => {
        router.push("/boards");
        setCommandPaletteOpen(false);
      },
    },
    {
      id: "prds",
      label: "Go to PRDs",
      icon: FileText,
      action: () => {
        router.push("/prds");
        setCommandPaletteOpen(false);
      },
    },
    {
      id: "reports",
      label: "Go to Reports",
      icon: BarChart3,
      action: () => {
        router.push("/reports");
        setCommandPaletteOpen(false);
      },
    },
    {
      id: "settings",
      label: "Go to Settings",
      icon: Settings,
      shortcut: "⌘,",
      action: () => {
        router.push("/settings");
        setCommandPaletteOpen(false);
      },
    },
  ];

  const { setQuickCreateOpen } = useUIStore();

  const createItems: CommandItem[] = [
    {
      id: "new-project",
      label: "Create New Project",
      icon: Plus,
      shortcut: "⌘⇧P",
      action: () => {
        setCommandPaletteOpen(false);
        setQuickCreateOpen("project");
      },
    },
    {
      id: "new-board",
      label: "Create New Board",
      icon: Plus,
      shortcut: "⌘⇧B",
      action: () => {
        setCommandPaletteOpen(false);
        setQuickCreateOpen("board");
      },
    },
    {
      id: "new-prd",
      label: "Create New PRD",
      icon: Plus,
      shortcut: "⌘⇧R",
      action: () => {
        setCommandPaletteOpen(false);
        setQuickCreateOpen("prd");
      },
    },
  ];

  const themeItems: CommandItem[] = [
    {
      id: "theme-light",
      label: "Light Mode",
      icon: Sun,
      action: () => {
        setTheme("light");
        setCommandPaletteOpen(false);
      },
    },
    {
      id: "theme-dark",
      label: "Dark Mode",
      icon: Moon,
      action: () => {
        setTheme("dark");
        setCommandPaletteOpen(false);
      },
    },
    {
      id: "theme-system",
      label: "System Theme",
      icon: Laptop,
      action: () => {
        setTheme("system");
        setCommandPaletteOpen(false);
      },
    },
  ];

  return (
    <CommandDialog
      open={commandPaletteOpen}
      onOpenChange={setCommandPaletteOpen}
    >
      <CommandInput placeholder="Type a command or search..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>

        <CommandGroup heading="Navigation">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            return (
              <CommandItem
                key={item.id}
                onSelect={item.action}
                className="cursor-pointer"
              >
                <Icon className="mr-2 h-4 w-4" />
                <span>{item.label}</span>
                {item.shortcut && (
                  <CommandShortcut>{item.shortcut}</CommandShortcut>
                )}
              </CommandItem>
            );
          })}
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Create">
          {createItems.map((item) => {
            const Icon = item.icon;
            return (
              <CommandItem
                key={item.id}
                onSelect={item.action}
                className="cursor-pointer"
              >
                <Icon className="mr-2 h-4 w-4" />
                <span>{item.label}</span>
              </CommandItem>
            );
          })}
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Theme">
          {themeItems.map((item) => {
            const Icon = item.icon;
            return (
              <CommandItem
                key={item.id}
                onSelect={item.action}
                className="cursor-pointer"
              >
                <Icon className="mr-2 h-4 w-4" />
                <span>{item.label}</span>
              </CommandItem>
            );
          })}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
