"use client";

import * as React from "react";
import { TodayFocusWidget } from "./TodayFocusWidget";
import { ProjectHealthWidget } from "./ProjectHealthWidget";
import { ActivityFeedWidget } from "./ActivityFeedWidget";
import { QuickActionsWidget } from "./QuickActionsWidget";
import { MilestoneCountdownWidget } from "./MilestoneCountdownWidget";
import { cn } from "@/lib/utils";

interface DashboardProps {
  className?: string;
}

export function Dashboard({ className }: DashboardProps) {
  return (
    <div
      data-testid="dashboard-grid"
      className={cn("grid gap-4 md:gap-6", className)}
    >
      {/* Top row - Quick Actions and Today's Focus */}
      <div className="grid gap-4 md:gap-6 lg:grid-cols-2">
        <QuickActionsWidget />
        <TodayFocusWidget />
      </div>

      {/* Middle row - Project Health and Milestone Countdown */}
      <div className="grid gap-4 md:gap-6 lg:grid-cols-2">
        <ProjectHealthWidget />
        <MilestoneCountdownWidget />
      </div>

      {/* Bottom row - Activity Feed (full width) */}
      <ActivityFeedWidget />
    </div>
  );
}
