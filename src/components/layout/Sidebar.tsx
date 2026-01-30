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
  Loader2,
  LogIn,
  LogOut,
  User,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useUIStore } from "@/stores/ui-store";
import { useAreas, useCreateArea } from "@/hooks/use-areas";
import { useAuth } from "@/components/auth/AuthProvider";
import type { AreaType } from "@/types/database";

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

const AREA_ICONS = ["🏠", "💼", "🚀", "📚", "🎯", "💡", "🔧", "🎨", "📊", "🌟"];

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  const pathname = usePathname();
  const { sidebarCollapsed, toggleSidebar } = useUIStore();
  const { user, isConfigured, signOut, loading: authLoading } = useAuth();
  
  const { data: areas, isLoading: areasLoading } = useAreas();
  const createArea = useCreateArea();

  const [showNewAreaDialog, setShowNewAreaDialog] = React.useState(false);
  const [newAreaName, setNewAreaName] = React.useState("");
  const [newAreaType, setNewAreaType] = React.useState<AreaType>("personal");
  const [newAreaIcon, setNewAreaIcon] = React.useState("🏠");

  const handleCreateArea = async () => {
    if (!newAreaName.trim()) return;
    await createArea.mutateAsync({
      name: newAreaName.trim(),
      type: newAreaType,
      icon: newAreaIcon,
    });
    setNewAreaName("");
    setNewAreaType("personal");
    setNewAreaIcon("🏠");
    setShowNewAreaDialog(false);
  };

  return (
    <>
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
                      onClick={() => setShowNewAreaDialog(true)}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                  <div className="space-y-1">
                    {areasLoading ? (
                      <div className="flex justify-center py-2">
                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                      </div>
                    ) : areas && areas.length > 0 ? (
                      areas.map((area) => {
                        const isActive = pathname === `/areas/${area.id}`;
                        return (
                          <Link
                            key={area.id}
                            href={`/areas/${area.id}`}
                            className={cn(
                              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                              isActive
                                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                                : "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                            )}
                          >
                            <span>{area.icon}</span>
                            <span>{area.name}</span>
                          </Link>
                        );
                      })
                    ) : (
                      <p className="px-3 py-2 text-xs text-muted-foreground">
                        No areas yet
                      </p>
                    )}
                  </div>
                </div>
              </>
            )}
          </ScrollArea>

          {/* Footer */}
          <div className="border-t border-border p-3">
            {/* Auth Status */}
            {!sidebarCollapsed && (
              <div className="mb-3 rounded-lg bg-muted/50 p-2">
                {authLoading ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Loading...</span>
                  </div>
                ) : !isConfigured ? (
                  <div className="flex items-center gap-2 text-sm text-yellow-600 dark:text-yellow-400">
                    <Settings className="h-4 w-4" />
                    <span>DB not configured</span>
                  </div>
                ) : user ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <User className="h-4 w-4 text-green-600 dark:text-green-400" />
                      <span className="truncate text-xs">{user.email}</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full justify-start text-xs h-7"
                      onClick={() => signOut()}
                    >
                      <LogOut className="mr-2 h-3 w-3" />
                      Sign Out
                    </Button>
                  </div>
                ) : (
                  <Link href="/login" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                    <LogIn className="h-4 w-4" />
                    <span>Sign in to sync</span>
                  </Link>
                )}
              </div>
            )}
            
            {/* Collapsed auth indicator */}
            {sidebarCollapsed && (
              <div className="mb-2 flex justify-center">
                {authLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                ) : !isConfigured ? (
                  <Tooltip>
                    <TooltipTrigger>
                      <Settings className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                    </TooltipTrigger>
                    <TooltipContent side="right">
                      <p>Database not configured</p>
                    </TooltipContent>
                  </Tooltip>
                ) : user ? (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => signOut()}>
                        <User className="h-4 w-4 text-green-600 dark:text-green-400" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="right">
                      <p>{user.email}</p>
                      <p className="text-xs text-muted-foreground">Click to sign out</p>
                    </TooltipContent>
                  </Tooltip>
                ) : (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                        <Link href="/login">
                          <LogIn className="h-4 w-4 text-muted-foreground" />
                        </Link>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="right">
                      <p>Sign in to sync</p>
                    </TooltipContent>
                  </Tooltip>
                )}
              </div>
            )}

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

      {/* New Area Dialog */}
      <Dialog open={showNewAreaDialog} onOpenChange={setShowNewAreaDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Area</DialogTitle>
            <DialogDescription>
              Areas are top-level categories for organizing your projects (e.g., Work, Personal, Side Projects).
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Icon</label>
              <div className="flex flex-wrap gap-2">
                {AREA_ICONS.map((icon) => (
                  <Button
                    key={icon}
                    type="button"
                    variant={newAreaIcon === icon ? "default" : "outline"}
                    size="icon"
                    className="h-10 w-10 text-lg"
                    onClick={() => setNewAreaIcon(icon)}
                  >
                    {icon}
                  </Button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Name</label>
              <Input
                placeholder="e.g., Work, Personal, Side Projects..."
                value={newAreaName}
                onChange={(e) => setNewAreaName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleCreateArea()}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Type</label>
              <Select value={newAreaType} onValueChange={(v) => setNewAreaType(v as AreaType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="personal">Personal</SelectItem>
                  <SelectItem value="work">Work</SelectItem>
                  <SelectItem value="project">Project</SelectItem>
                  <SelectItem value="content">Content</SelectItem>
                  <SelectItem value="community">Community</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewAreaDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreateArea}
              disabled={!newAreaName.trim() || createArea.isPending}
            >
              {createArea.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Plus className="mr-2 h-4 w-4" />
              )}
              Create Area
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
