"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { MobileSidebar } from "./MobileSidebar";
import { ErrorBoundary } from "@/components/shared/ErrorBoundary";
import { useUIStore } from "@/stores/ui-store";

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const { sidebarCollapsed } = useUIStore();

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop Sidebar */}
      <div className="hidden md:block">
        <Sidebar />
      </div>

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
        <div className="flex items-center gap-2 md:gap-0">
          <div className="pl-2 md:hidden">
            <MobileSidebar />
          </div>
          <Header className="flex-1" />
        </div>

        {/* Page Content */}
        <main className="flex-1 p-4 md:p-6">
          <ErrorBoundary>{children}</ErrorBoundary>
        </main>
      </div>
    </div>
  );
}
