"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "./ThemeProvider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/components/auth";

// 5.2.2 Code Splitting - Lazy load CommandPalette (only shown on ⌘K)
const CommandPalette = dynamic(
  () => import("./CommandPalette").then((mod) => mod.CommandPalette),
  { ssr: false }
);

// Lazy load QuickCreate dialogs
const QuickCreate = dynamic(
  () => import("./QuickCreate").then((mod) => mod.QuickCreate),
  { ssr: false }
);

// 5.2.5 Caching Strategy - Optimized React Query configuration
function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Optimized stale times based on data update frequency
        staleTime: 2 * 60 * 1000, // 2 minutes - data is fresh for longer
        gcTime: 10 * 60 * 1000, // 10 minutes - keep in cache longer for fast navigation
        
        // Prevent unnecessary refetches
        refetchOnWindowFocus: false,
        refetchOnReconnect: "always",
        refetchOnMount: true,
        
        // Retry failed requests with exponential backoff
        retry: 2,
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
        
        // Network mode for offline support
        networkMode: "offlineFirst",
      },
      mutations: {
        // Retry mutations once on failure
        retry: 1,
        retryDelay: 1000,
        networkMode: "offlineFirst",
      },
    },
  });
}

let browserQueryClient: QueryClient | undefined = undefined;

function getQueryClient() {
  if (typeof window === "undefined") {
    // Server: always make a new query client
    return makeQueryClient();
  } else {
    // Browser: make a new query client if we don't already have one
    if (!browserQueryClient) browserQueryClient = makeQueryClient();
    return browserQueryClient;
  }
}

interface ProvidersProps {
  children: React.ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  const queryClient = getQueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        <AuthProvider>
          <TooltipProvider delayDuration={300}>
            {children}
            <CommandPalette />
            <QuickCreate />
            <Toaster position="bottom-right" />
          </TooltipProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
