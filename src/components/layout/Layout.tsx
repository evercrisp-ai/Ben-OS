"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { MobileSidebar } from "./MobileSidebar";
import { ErrorBoundary, SkipLink } from "@/components/shared";
import { useUIStore } from "@/stores/ui-store";

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const { sidebarCollapsed } = useUIStore();

  return (
    <div className="min-h-screen bg-background">
      {/* Skip Link for Keyboard Navigation - WCAG 2.1 AA */}
      <SkipLink />

      {/* Desktop Sidebar */}
      <nav className="hidden md:block" aria-label="Main navigation">
        <Sidebar />
      </nav>

      {/* Main Content */}
      <div
        data-testid="main-layout"
        className={cn(
          "flex min-h-screen flex-col transition-all duration-300",
          "md:ml-64",
          sidebarCollapsed && "md:ml-16"
        )}
      >
        {/* Header with Mobile Menu */}
        <header className="flex items-center gap-2 md:gap-0">
          <div className="pl-2 md:hidden">
            <MobileSidebar />
          </div>
          <Header className="flex-1" />
        </header>

        {/* Page Content */}
        <main
          id="main-content"
          tabIndex={-1}
          className="flex-1 p-4 md:p-6 outline-none focus:outline-none"
          role="main"
          aria-label="Main content"
        >
          <ErrorBoundary>{children}</ErrorBoundary>
        </main>
      </div>
    </div>
  );
}
