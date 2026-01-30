"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, Layers, Loader2 } from "lucide-react";
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
import { Input } from "@/components/ui/input";
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
import type { AreaType } from "@/types/database";

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

const AREA_ICONS = ["🏠", "💼", "🚀", "📚", "🎯", "💡", "🔧", "🎨", "📊", "🌟"];

export function MobileSidebar() {
  const pathname = usePathname();
  const { sidebarOpen, setSidebarOpen } = useUIStore();

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
                        onClick={() => setSidebarOpen(false)}
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

      {/* New Area Dialog */}
      <Dialog open={showNewAreaDialog} onOpenChange={setShowNewAreaDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Area</DialogTitle>
            <DialogDescription>
              Areas are top-level categories for organizing your projects.
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
