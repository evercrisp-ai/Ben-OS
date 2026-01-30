"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Kanban,
  FolderKanban,
  FileText,
  BarChart3,
  Settings,
  HelpCircle,
  ChevronLeft,
  ChevronRight,
  Plus,
  Layers,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useUIStore } from "@/stores/ui-store";

interface NavItem {
  title: string;
  href: string;
  icon: React.ElementType;
  badge?: string;
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

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  const pathname = usePathname();
  const { sidebarCollapsed, toggleSidebar } = useUIStore();

  return (
    <aside
      data-testid="sidebar"
      className={cn(
        "fixed left-0 top-0 z-40 h-screen border-r border-border bg-sidebar transition-all duration-300",
        sidebarCollapsed ? "w-16" : "w-64",
        className
      )}
    >
      <div className="flex h-full flex-col">
        {/* Header */}
        <div
          className={cn(
            "flex h-16 items-center border-b border-border px-4",
            sidebarCollapsed ? "justify-center" : "justify-between"
          )}
        >
          {!sidebarCollapsed && (
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Layers className="h-4 w-4" />
              </div>
              <span className="font-semibold">Ben OS</span>
            </Link>
          )}
          {sidebarCollapsed && (
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Layers className="h-4 w-4" />
            </div>
          )}
        </div>

        {/* Main Navigation */}
        <ScrollArea className="flex-1 px-3 py-4">
          <nav role="navigation" className="space-y-1">
            {mainNavItems.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;

              const navLink = (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-sidebar-accent text-sidebar-accent-foreground"
                      : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                    sidebarCollapsed && "justify-center px-2"
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {!sidebarCollapsed && <span>{item.title}</span>}
                </Link>
              );

              if (sidebarCollapsed) {
                return (
                  <Tooltip key={item.href}>
                    <TooltipTrigger asChild>{navLink}</TooltipTrigger>
                    <TooltipContent side="right">
                      <p>{item.title}</p>
                    </TooltipContent>
                  </Tooltip>
                );
              }

              return navLink;
            })}
          </nav>

          {!sidebarCollapsed && (
            <>
              <Separator className="my-4" />

              {/* Areas Section */}
              <div className="space-y-2">
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
                      className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                    >
                      <span>{area.icon}</span>
                      <span>{area.name}</span>
                    </Link>
                  ))}
                </div>
              </div>
            </>
          )}
        </ScrollArea>

        {/* Footer */}
        <div className="border-t border-border p-3">
          <div
            className={cn(
              "flex gap-1",
              sidebarCollapsed ? "flex-col items-center" : "flex-row"
            )}
          >
            {sidebarCollapsed ? (
              <>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" asChild>
                      <Link href="/settings">
                        <Settings className="h-4 w-4" />
                        <span className="sr-only">Settings</span>
                      </Link>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="right">
                    <p>Settings</p>
                  </TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <HelpCircle className="h-4 w-4" />
                      <span className="sr-only">Help</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="right">
                    <p>Help</p>
                  </TooltipContent>
                </Tooltip>
              </>
            ) : (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex-1 justify-start"
                  asChild
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
                >
                  <HelpCircle className="mr-2 h-4 w-4" />
                  Help
                </Button>
              </>
            )}
          </div>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className={cn("mt-2 w-full", !sidebarCollapsed && "w-full")}
                onClick={toggleSidebar}
                aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
              >
                {sidebarCollapsed ? (
                  <ChevronRight className="h-4 w-4" />
                ) : (
                  <ChevronLeft className="h-4 w-4" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent side={sidebarCollapsed ? "right" : "top"}>
              <p>{sidebarCollapsed ? "Expand" : "Collapse"}</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </div>
    </aside>
  );
}
