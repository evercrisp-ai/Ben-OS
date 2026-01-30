"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, Layers } from "lucide-react";
import {
  LayoutDashboard,
  Kanban,
  FolderKanban,
  FileText,
  BarChart3,
  Settings,
  HelpCircle,
  Plus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useUIStore } from "@/stores/ui-store";

interface NavItem {
  title: string;
  href: string;
  icon: React.ElementType;
}

const mainNavItems: NavItem[] = [
  { title: "Dashboard", href: "/", icon: LayoutDashboard },
  { title: "Projects", href: "/projects", icon: FolderKanban },
  { title: "Boards", href: "/boards", icon: Kanban },
  { title: "PRDs", href: "/prds", icon: FileText },
  { title: "Reports", href: "/reports", icon: BarChart3 },
];

// Mock areas - will be replaced with real data
const mockAreas = [
  { id: "1", name: "Personal", color: "#6366f1", icon: "🏠" },
  { id: "2", name: "Work", color: "#22c55e", icon: "💼" },
  { id: "3", name: "Side Projects", color: "#f59e0b", icon: "🚀" },
];

export function MobileSidebar() {
  const pathname = usePathname();
  const { sidebarOpen, setSidebarOpen } = useUIStore();

  return (
    <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-72 p-0">
        <SheetHeader className="border-b border-border p-4">
          <SheetTitle className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Layers className="h-4 w-4" />
            </div>
            <span>Ben OS</span>
          </SheetTitle>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-8rem)]">
          <nav className="p-4 space-y-1">
            {mainNavItems.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-sidebar-accent text-sidebar-accent-foreground"
                      : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span>{item.title}</span>
                </Link>
              );
            })}
          </nav>

          <Separator className="mx-4" />

          {/* Areas Section */}
          <div className="p-4 space-y-2">
            <div className="flex items-center justify-between px-3">
              <span className="text-xs font-semibold uppercase text-muted-foreground">
                Areas
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="h-5 w-5"
                aria-label="Add area"
              >
                <Plus className="h-3 w-3" />
              </Button>
            </div>
            <div className="space-y-1">
              {mockAreas.map((area) => (
                <Link
                  key={area.id}
                  href={`/areas/${area.id}`}
                  onClick={() => setSidebarOpen(false)}
                  className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                >
                  <span>{area.icon}</span>
                  <span>{area.name}</span>
                </Link>
              ))}
            </div>
          </div>
        </ScrollArea>

        {/* Footer */}
        <div className="absolute bottom-0 left-0 right-0 border-t border-border p-4">
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="flex-1 justify-start"
              asChild
              onClick={() => setSidebarOpen(false)}
            >
              <Link href="/settings">
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </Link>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="flex-1 justify-start"
              onClick={() => setSidebarOpen(false)}
            >
              <HelpCircle className="mr-2 h-4 w-4" />
              Help
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
