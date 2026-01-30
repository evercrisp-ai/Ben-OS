"use client";

import { useMemo } from "react";
import { useUIStore } from "@/stores/ui-store";
import { Button } from "@/components/ui/button";
import { WidgetSkeleton } from "@/components/shared/Skeleton";
import { useTasks } from "@/hooks/use-tasks";
import { useProjects } from "@/hooks/use-projects";
import { useRecentActivityLogs, formatActivityAction } from "@/hooks/use-activity-logs";
import { useAuth } from "@/components/auth/AuthProvider";
import {
  Plus,
  CheckCircle2,
  Clock,
  AlertCircle,
  TrendingUp,
  LogIn,
  Database,
} from "lucide-react";
import Link from "next/link";

export default function DashboardPage() {
  const { setCommandPaletteOpen } = useUIStore();
  const { user, isConfigured } = useAuth();
  
  // Fetch real data from database
  const { data: tasks = [], isLoading: tasksLoading, error: tasksError } = useTasks();
  const { data: projects = [], isLoading: projectsLoading } = useProjects();
  const { data: activityLogs = [], isLoading: activityLoading } = useRecentActivityLogs(10);

  // Compute stats from real task data
  const stats = useMemo(() => {
    const completedTasks = tasks.filter(t => t.status === 'done').length;
    const inProgressTasks = tasks.filter(t => t.status === 'in_progress').length;
    const overdueTasks = tasks.filter(t => {
      if (!t.due_date || t.status === 'done') return false;
      return new Date(t.due_date) < new Date();
    }).length;
    const totalStoryPoints = tasks
      .filter(t => t.status === 'done')
      .reduce((sum, t) => sum + (t.story_points || 0), 0);

    return [
      {
        title: "Tasks Completed",
        value: String(completedTasks),
        icon: CheckCircle2,
        trend: "up" as const,
      },
      {
        title: "In Progress",
        value: String(inProgressTasks),
        icon: Clock,
        trend: "neutral" as const,
      },
      {
        title: "Overdue",
        value: String(overdueTasks),
        icon: AlertCircle,
        trend: overdueTasks > 0 ? "down" as const : "neutral" as const,
      },
      {
        title: "Story Points",
        value: String(totalStoryPoints),
        subtitle: "completed",
        icon: TrendingUp,
        trend: "up" as const,
      },
    ];
  }, [tasks]);

  // Get recent tasks (not completed, sorted by created_at)
  const recentTasks = useMemo(() => {
    return [...tasks]
      .filter(t => t.status !== 'done')
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 5)
      .map(t => ({
        id: t.id,
        title: t.title,
        status: t.status,
        priority: t.priority,
      }));
  }, [tasks]);

  // Format activity logs for display
  const formattedActivity = useMemo(() => {
    return activityLogs.slice(0, 4).map(log => {
      const action = formatActivityAction(log.action);
      const item = (log.payload as Record<string, unknown>)?.title as string || log.entity_type;
      const time = formatRelativeTime(log.created_at);
      return { action, item, time };
    });
  }, [activityLogs]);

  const isLoading = tasksLoading || projectsLoading || activityLoading;

  // Show login prompt if not authenticated
  if (!isConfigured) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Database className="h-16 w-16 text-muted-foreground" />
        <h2 className="text-xl font-semibold">Database Not Configured</h2>
        <p className="text-muted-foreground text-center max-w-md">
          Supabase environment variables are not set. Please configure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.
        </p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <LogIn className="h-16 w-16 text-muted-foreground" />
        <h2 className="text-xl font-semibold">Please Log In</h2>
        <p className="text-muted-foreground text-center max-w-md">
          You need to be logged in to view your dashboard and access your data.
        </p>
        <Link href="/login">
          <Button>
            <LogIn className="mr-2 h-4 w-4" />
            Go to Login
          </Button>
        </Link>
      </div>
    );
  }

  if (tasksError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <AlertCircle className="h-16 w-16 text-destructive" />
        <h2 className="text-xl font-semibold">Error Loading Data</h2>
        <p className="text-muted-foreground text-center max-w-md">
          {tasksError.message}
        </p>
      </div>
    );
  }

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
          <Link href="/projects">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Project
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <WidgetSkeleton key={i} />
          ))}
        </div>
      ) : (
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
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Content Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Today's Focus */}
        <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
          <div className="flex items-center justify-between pb-4">
            <h2 className="font-semibold">Today&apos;s Focus</h2>
            <Link href="/projects">
              <Button variant="ghost" size="sm">
                View all
              </Button>
            </Link>
          </div>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-14 rounded-lg bg-muted animate-pulse" />
              ))}
            </div>
          ) : recentTasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <CheckCircle2 className="h-10 w-10 text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">No active tasks</p>
              <p className="text-xs text-muted-foreground mt-1">
                Create a project and add tasks to get started
              </p>
            </div>
          ) : (
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
          )}
        </div>

        {/* Recent Activity */}
        <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
          <div className="flex items-center justify-between pb-4">
            <h2 className="font-semibold">Recent Activity</h2>
            <Button variant="ghost" size="sm">
              View all
            </Button>
          </div>
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-6 rounded bg-muted animate-pulse" />
              ))}
            </div>
          ) : formattedActivity.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Clock className="h-10 w-10 text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">No recent activity</p>
              <p className="text-xs text-muted-foreground mt-1">
                Activity will appear here as you work
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {formattedActivity.map((activity, i) => (
                <div key={i} className="flex items-center gap-3 text-sm">
                  <div className="h-2 w-2 rounded-full bg-primary" />
                  <span className="flex-1">
                    <span className="font-medium capitalize">{activity.action}</span>
                    {": "}
                    <span className="text-muted-foreground">{activity.item}</span>
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {activity.time}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick Stats Summary */}
      {!isLoading && projects.length > 0 && (
        <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
          <h2 className="font-semibold mb-4">Projects Overview</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {projects.slice(0, 3).map((project) => (
              <Link key={project.id} href={`/projects/${project.id}`}>
                <div className="rounded-lg border border-border p-3 hover:bg-muted/50 transition-colors">
                  <h3 className="font-medium text-sm">{project.title}</h3>
                  <p className="text-xs text-muted-foreground mt-1 capitalize">
                    {project.status}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Empty State for New Users */}
      {!isLoading && tasks.length === 0 && projects.length === 0 && (
        <div className="rounded-lg border border-dashed border-border bg-card p-8 text-center">
          <h2 className="text-lg font-semibold mb-2">Get Started</h2>
          <p className="text-muted-foreground mb-4">
            Create your first project to start organizing your work.
          </p>
          <Link href="/projects">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Your First Project
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}

// Helper function to format relative time
function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}
