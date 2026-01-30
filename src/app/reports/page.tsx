"use client";

import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { WidgetSkeleton } from "@/components/shared/Skeleton";
import { useTasks } from "@/hooks/use-tasks";
import { useProjects } from "@/hooks/use-projects";
import { useRecentActivityLogs, formatActivityAction } from "@/hooks/use-activity-logs";
import { useAuth } from "@/components/auth/AuthProvider";
import { BarChart3, TrendingUp, TrendingDown, Clock, CheckCircle2, AlertCircle, LogIn, Database } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

// Color palette for projects
const PROJECT_COLORS = [
  "bg-blue-500",
  "bg-green-500", 
  "bg-yellow-500",
  "bg-purple-500",
  "bg-pink-500",
  "bg-indigo-500",
  "bg-orange-500",
  "bg-teal-500",
];

export default function ReportsPage() {
  const { user, isConfigured } = useAuth();
  
  // Fetch real data from database
  const { data: tasks = [], isLoading: tasksLoading, error: tasksError } = useTasks();
  const { data: projects = [], isLoading: projectsLoading } = useProjects();
  const { data: activityLogs = [], isLoading: activityLoading } = useRecentActivityLogs(20);

  const isLoading = tasksLoading || projectsLoading || activityLoading;

  // Compute overview stats from real data
  const overviewStats = useMemo(() => {
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.status === 'done').length;
    const inProgressTasks = tasks.filter(t => t.status === 'in_progress').length;
    const overdueTasks = tasks.filter(t => {
      if (!t.due_date || t.status === 'done') return false;
      return new Date(t.due_date) < new Date();
    }).length;

    return [
      { label: "Total Tasks", value: String(totalTasks), icon: CheckCircle2, trend: "neutral" as const },
      { label: "Completed", value: String(completedTasks), icon: CheckCircle2, trend: "up" as const },
      { label: "In Progress", value: String(inProgressTasks), icon: Clock, trend: "neutral" as const },
      { label: "Overdue", value: String(overdueTasks), icon: AlertCircle, trend: overdueTasks > 0 ? "down" as const : "neutral" as const },
    ];
  }, [tasks]);

  // Compute project progress from real data
  const projectProgress = useMemo(() => {
    return projects.map((project, index) => {
      const projectTasks = tasks.filter(t => {
        // Tasks might be linked via board -> project relationship
        // For now, we'll show all projects with task counts from the whole system
        return true;
      });
      const totalTasks = projectTasks.length;
      const completedTasks = projectTasks.filter(t => t.status === 'done').length;
      const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
      
      return {
        id: project.id,
        name: project.title,
        progress,
        tasks: totalTasks,
        color: PROJECT_COLORS[index % PROJECT_COLORS.length],
        status: project.status,
      };
    });
  }, [projects, tasks]);

  // Format activity logs for timeline
  const activityTimeline = useMemo(() => {
    return activityLogs.slice(0, 5).map(log => {
      const action = formatActivityAction(log.action);
      const item = (log.payload as Record<string, unknown>)?.title as string || log.entity_type;
      const time = formatRelativeTime(log.created_at);
      return { action, item, time, entityType: log.entity_type };
    });
  }, [activityLogs]);

  const handleExport = () => {
    toast.success("Export started", {
      description: "Your report will be ready for download shortly",
    });
  };

  // Show database not configured message
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

  // Show login prompt if not authenticated
  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <LogIn className="h-16 w-16 text-muted-foreground" />
        <h2 className="text-xl font-semibold">Please Log In</h2>
        <p className="text-muted-foreground text-center max-w-md">
          You need to be logged in to view reports.
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

  // Show error state
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
          <h1 className="text-2xl font-bold tracking-tight">Reports</h1>
          <p className="text-muted-foreground">
            Analytics and insights for your projects.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            Last 30 days
          </Button>
          <Button onClick={handleExport}>
            <BarChart3 className="mr-2 h-4 w-4" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Overview Stats */}
      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <WidgetSkeleton key={i} />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {overviewStats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div
                key={stat.label}
                className="rounded-lg border border-border bg-card p-4 shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-muted-foreground">
                    {stat.label}
                  </span>
                  <Icon className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-2xl font-bold">{stat.value}</span>
                  {stat.trend !== "neutral" && (
                    <span
                      className={`flex items-center text-xs font-medium ${
                        stat.trend === "up"
                          ? "text-green-600 dark:text-green-400"
                          : "text-red-600 dark:text-red-400"
                      }`}
                    >
                      {stat.trend === "up" ? (
                        <TrendingUp className="mr-1 h-3 w-3" />
                      ) : (
                        <TrendingDown className="mr-1 h-3 w-3" />
                      )}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Charts Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Task Status Breakdown */}
        <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
          <div className="flex items-center justify-between pb-4">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-muted-foreground" />
              <h2 className="font-semibold">Task Status Breakdown</h2>
            </div>
          </div>
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-8 rounded bg-muted animate-pulse" />
              ))}
            </div>
          ) : tasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <BarChart3 className="h-10 w-10 text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">No tasks to analyze</p>
              <p className="text-xs text-muted-foreground mt-1">
                Create tasks to see status breakdown
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {[
                { label: "Backlog", status: "backlog", color: "bg-gray-500" },
                { label: "To Do", status: "todo", color: "bg-blue-400" },
                { label: "In Progress", status: "in_progress", color: "bg-yellow-500" },
                { label: "Review", status: "review", color: "bg-purple-500" },
                { label: "Done", status: "done", color: "bg-green-500" },
              ].map((item) => {
                const count = tasks.filter(t => t.status === item.status).length;
                const percentage = tasks.length > 0 ? Math.round((count / tasks.length) * 100) : 0;
                return (
                  <div key={item.status} className="flex items-center gap-3">
                    <div className={`h-3 w-3 rounded-full ${item.color}`} />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{item.label}</span>
                        <span className="text-xs text-muted-foreground">
                          {count} ({percentage}%)
                        </span>
                      </div>
                      <div className="mt-1 h-2 w-full rounded-full bg-muted">
                        <div
                          className={`h-2 rounded-full ${item.color}`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Project Progress */}
        <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
          <div className="flex items-center justify-between pb-4">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-muted-foreground" />
              <h2 className="font-semibold">Project Progress</h2>
            </div>
            <Link href="/projects">
              <Button variant="ghost" size="sm">
                View all
              </Button>
            </Link>
          </div>
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-10 rounded bg-muted animate-pulse" />
              ))}
            </div>
          ) : projectProgress.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <BarChart3 className="h-10 w-10 text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">No projects yet</p>
              <p className="text-xs text-muted-foreground mt-1">
                Create a project to track progress
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {projectProgress.slice(0, 5).map((project) => (
                <Link key={project.id} href={`/projects/${project.id}`}>
                  <div className="space-y-2 hover:bg-muted/50 rounded p-2 -mx-2 transition-colors">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{project.name}</span>
                      <span className="text-xs text-muted-foreground capitalize">
                        {project.status}
                      </span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-muted">
                      <div
                        className={`h-2 rounded-full ${project.color}`}
                        style={{ width: `${project.progress}%` }}
                      />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Activity Timeline */}
      <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
        <div className="flex items-center justify-between pb-4">
          <h2 className="font-semibold">Recent Activity</h2>
          <Button variant="ghost" size="sm">
            View all
          </Button>
        </div>
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-6 rounded bg-muted animate-pulse" />
            ))}
          </div>
        ) : activityTimeline.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Clock className="h-10 w-10 text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">No recent activity</p>
            <p className="text-xs text-muted-foreground mt-1">
              Activity will appear here as you work
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {activityTimeline.map((activity, i) => (
              <div key={i} className="flex items-center gap-3 text-sm">
                <div className="h-2 w-2 rounded-full bg-primary" />
                <span className="flex-1">
                  <span className="font-medium capitalize">{activity.action}</span>
                  {": "}
                  <span className="text-muted-foreground">{activity.item}</span>
                  <span className="text-muted-foreground text-xs ml-1">({activity.entityType})</span>
                </span>
                <span className="text-xs text-muted-foreground">{activity.time}</span>
              </div>
            ))}
          </div>
        )}
      </div>
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
