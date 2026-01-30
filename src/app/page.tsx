"use client";

import { useUIStore } from "@/stores/ui-store";
import { Button } from "@/components/ui/button";
import { WidgetSkeleton } from "@/components/shared/Skeleton";
import { toast } from "sonner";
import {
  Plus,
  CheckCircle2,
  Clock,
  AlertCircle,
  TrendingUp,
} from "lucide-react";

// Mock data - will be replaced with real data
const stats = [
  {
    title: "Tasks Completed",
    value: "24",
    change: "+12%",
    icon: CheckCircle2,
    trend: "up",
  },
  {
    title: "In Progress",
    value: "8",
    change: "-2",
    icon: Clock,
    trend: "neutral",
  },
  {
    title: "Overdue",
    value: "3",
    change: "+1",
    icon: AlertCircle,
    trend: "down",
  },
  {
    title: "Velocity",
    value: "18",
    subtitle: "points/week",
    icon: TrendingUp,
    trend: "up",
  },
];

const recentTasks = [
  { id: 1, title: "Update API documentation", status: "done", priority: "medium" },
  { id: 2, title: "Fix login redirect bug", status: "in_progress", priority: "high" },
  { id: 3, title: "Design new dashboard widgets", status: "todo", priority: "medium" },
  { id: 4, title: "Review PR #142", status: "in_progress", priority: "high" },
  { id: 5, title: "Write unit tests for auth", status: "todo", priority: "low" },
];

export default function DashboardPage() {
  const { setCommandPaletteOpen } = useUIStore();

  const handleQuickAction = (action: string) => {
    toast.success(`${action} action triggered`, {
      description: "This feature will be implemented in Section 1.5",
    });
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back! Here&apos;s an overview of your projects.
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setCommandPaletteOpen(true)} variant="outline">
            Quick Actions
            <kbd className="ml-2 hidden rounded bg-muted px-1.5 py-0.5 text-xs sm:inline-block">
              ⌘K
            </kbd>
          </Button>
          <Button onClick={() => handleQuickAction("New Task")}>
            <Plus className="mr-2 h-4 w-4" />
            New Task
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.title}
              className="rounded-lg border border-border bg-card p-4 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </span>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-bold">{stat.value}</span>
                {stat.subtitle && (
                  <span className="text-sm text-muted-foreground">
                    {stat.subtitle}
                  </span>
                )}
                {stat.change && (
                  <span
                    className={`text-xs font-medium ${
                      stat.trend === "up"
                        ? "text-green-600 dark:text-green-400"
                        : stat.trend === "down"
                          ? "text-red-600 dark:text-red-400"
                          : "text-muted-foreground"
                    }`}
                  >
                    {stat.change}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Content Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Today's Focus */}
        <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
          <div className="flex items-center justify-between pb-4">
            <h2 className="font-semibold">Today&apos;s Focus</h2>
            <Button variant="ghost" size="sm">
              View all
            </Button>
          </div>
          <div className="space-y-3">
            {recentTasks.slice(0, 3).map((task) => (
              <div
                key={task.id}
                className="flex items-center gap-3 rounded-lg border border-border p-3 transition-colors hover:bg-muted/50"
              >
                <div
                  className={`h-2 w-2 rounded-full ${
                    task.priority === "high"
                      ? "bg-red-500"
                      : task.priority === "medium"
                        ? "bg-yellow-500"
                        : "bg-green-500"
                  }`}
                />
                <span className="flex-1 text-sm">{task.title}</span>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs ${
                    task.status === "done"
                      ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                      : task.status === "in_progress"
                        ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                        : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400"
                  }`}
                >
                  {task.status.replace("_", " ")}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
          <div className="flex items-center justify-between pb-4">
            <h2 className="font-semibold">Recent Activity</h2>
            <Button variant="ghost" size="sm">
              View all
            </Button>
          </div>
          <div className="space-y-4">
            {[
              { action: "Completed task", item: "Update API docs", time: "2m ago" },
              { action: "Moved task", item: "Fix login bug", time: "15m ago" },
              { action: "Created task", item: "Design widgets", time: "1h ago" },
              { action: "Added comment", item: "Review PR #142", time: "2h ago" },
            ].map((activity, i) => (
              <div key={i} className="flex items-center gap-3 text-sm">
                <div className="h-2 w-2 rounded-full bg-primary" />
                <span className="flex-1">
                  <span className="font-medium">{activity.action}</span>
                  {": "}
                  <span className="text-muted-foreground">{activity.item}</span>
                </span>
                <span className="text-xs text-muted-foreground">
                  {activity.time}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Skeleton Examples (for demonstration) */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Loading State Examples</h2>
        <p className="text-sm text-muted-foreground">
          These skeletons demonstrate the loading states for various UI components.
        </p>
        <div className="grid gap-4 md:grid-cols-3">
          <WidgetSkeleton />
          <WidgetSkeleton />
          <WidgetSkeleton />
        </div>
      </div>
    </div>
  );
}
