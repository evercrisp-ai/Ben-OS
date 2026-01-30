"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { Search, Bell, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ThemeToggle } from "./ThemeToggle";
import { useUIStore } from "@/stores/ui-store";

// Breadcrumb mapping
const pathNameMap: Record<string, string> = {
  "/": "Dashboard",
  "/projects": "Projects",
  "/boards": "Boards",
  "/prds": "PRDs",
  "/reports": "Reports",
  "/settings": "Settings",
};

interface BreadcrumbItem {
  label: string;
  href: string;
  current?: boolean;
}

function generateBreadcrumbs(pathname: string): BreadcrumbItem[] {
  const segments = pathname.split("/").filter(Boolean);
  
  if (segments.length === 0) {
    return [{ label: "Dashboard", href: "/", current: true }];
  }

  const breadcrumbs: BreadcrumbItem[] = [{ label: "Dashboard", href: "/" }];
  
  let currentPath = "";
  segments.forEach((segment, index) => {
    currentPath += `/${segment}`;
    const isLast = index === segments.length - 1;
    
    // Check if it's a known path or treat as an ID
    const label = pathNameMap[currentPath] || 
      (segment.length > 20 ? `${segment.slice(0, 8)}...` : segment);
    
    breadcrumbs.push({
      label: label.charAt(0).toUpperCase() + label.slice(1),
      href: currentPath,
      current: isLast,
    });
  });

  return breadcrumbs;
}

interface HeaderProps {
  className?: string;
}

export function Header({ className }: HeaderProps) {
  const pathname = usePathname();
  const { setCommandPaletteOpen } = useUIStore();
  const breadcrumbs = generateBreadcrumbs(pathname);

  return (
    <header
      role="banner"
      data-testid="header"
      className={cn(
        "sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60",
        className
      )}
    >
      {/* Breadcrumbs */}
      <nav aria-label="Breadcrumb" className="flex items-center">
        <ol className="flex items-center gap-2 text-sm">
          {breadcrumbs.map((crumb, index) => (
            <li key={crumb.href} className="flex items-center gap-2">
              {index > 0 && (
                <span className="text-muted-foreground">/</span>
              )}
              {crumb.current ? (
                <span className="font-medium text-foreground">
                  {crumb.label}
                </span>
              ) : (
                <a
                  href={crumb.href}
                  className="text-muted-foreground transition-colors hover:text-foreground"
                >
                  {crumb.label}
                </a>
              )}
            </li>
          ))}
        </ol>
      </nav>

      {/* Right Side Actions */}
      <div className="flex items-center gap-2">
        {/* Search Button */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="hidden gap-2 text-muted-foreground md:flex"
              onClick={() => setCommandPaletteOpen(true)}
            >
              <Search className="h-4 w-4" />
              <span className="hidden lg:inline-flex">Search...</span>
              <kbd className="pointer-events-none hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground lg:inline-flex">
                <span className="text-xs">⌘</span>K
              </kbd>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Search (⌘K)</p>
          </TooltipContent>
        </Tooltip>

        {/* Mobile Search Icon */}
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={() => setCommandPaletteOpen(true)}
          aria-label="Search"
        >
          <Search className="h-4 w-4" />
        </Button>

        {/* Notifications */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="Notifications">
              <Bell className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Notifications</p>
          </TooltipContent>
        </Tooltip>

        {/* Theme Toggle */}
        <ThemeToggle />

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full"
              aria-label="User menu"
            >
              <Avatar className="h-8 w-8">
                <AvatarImage src="" alt="User" />
                <AvatarFallback>
                  <User className="h-4 w-4" />
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Profile</DropdownMenuItem>
            <DropdownMenuItem>Settings</DropdownMenuItem>
            <DropdownMenuItem>API Keys</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Log out</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
