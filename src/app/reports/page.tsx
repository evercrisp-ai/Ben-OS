"use client";

import { Button } from "@/components/ui/button";
import { BarChart3, TrendingUp, TrendingDown, Users, Clock, CheckCircle2, AlertCircle } from "lucide-react";
import { toast } from "sonner";

// Mock report data
const overviewStats = [
  { label: "Total Tasks", value: "248", change: "+12%", trend: "up", icon: CheckCircle2 },
  { label: "Completed", value: "186", change: "+8%", trend: "up", icon: CheckCircle2 },
  { label: "In Progress", value: "42", change: "-3%", trend: "down", icon: Clock },
  { label: "Overdue", value: "20", change: "+2%", trend: "up", icon: AlertCircle },
];

const teamPerformance = [
  { name: "John Doe", completed: 45, inProgress: 8, avatar: "JD" },
  { name: "Jane Smith", completed: 38, inProgress: 12, avatar: "JS" },
  { name: "Bob Johnson", completed: 32, inProgress: 5, avatar: "BJ" },
  { name: "Alice Williams", completed: 41, inProgress: 7, avatar: "AW" },
  { name: "Charlie Brown", completed: 30, inProgress: 10, avatar: "CB" },
];

const projectProgress = [
  { name: "Website Redesign", progress: 67, tasks: 12, color: "bg-blue-500" },
  { name: "Mobile App Development", progress: 42, tasks: 24, color: "bg-green-500" },
  { name: "API Integration", progress: 0, tasks: 8, color: "bg-yellow-500" },
  { name: "Open Source Library", progress: 75, tasks: 20, color: "bg-purple-500" },
  { name: "Blog Platform", progress: 0, tasks: 10, color: "bg-pink-500" },
];

export default function ReportsPage() {
  const handleExport = () => {
    toast.success("Export started", {
      description: "Your report will be ready for download shortly",
    });
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Reports</h1>
          <p className="text-muted-foreground">
            Analytics and insights for your projects and team.
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
                <span
                  className={`flex items-center text-xs font-medium ${
                    stat.trend === "up" && stat.label !== "Overdue"
                      ? "text-green-600 dark:text-green-400"
                      : stat.trend === "up" && stat.label === "Overdue"
                        ? "text-red-600 dark:text-red-400"
                        : "text-muted-foreground"
                  }`}
                >
                  {stat.trend === "up" ? (
                    <TrendingUp className="mr-1 h-3 w-3" />
                  ) : (
                    <TrendingDown className="mr-1 h-3 w-3" />
                  )}
                  {stat.change}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Team Performance */}
        <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
          <div className="flex items-center justify-between pb-4">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-muted-foreground" />
              <h2 className="font-semibold">Team Performance</h2>
            </div>
            <Button variant="ghost" size="sm">
              View all
            </Button>
          </div>
          <div className="space-y-4">
            {teamPerformance.map((member) => (
              <div key={member.name} className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                  {member.avatar}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{member.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {member.completed} completed
                    </span>
                  </div>
                  <div className="mt-1 h-2 w-full rounded-full bg-muted">
                    <div
                      className="h-2 rounded-full bg-primary"
                      style={{
                        width: `${(member.completed / 50) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Project Progress */}
        <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
          <div className="flex items-center justify-between pb-4">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-muted-foreground" />
              <h2 className="font-semibold">Project Progress</h2>
            </div>
            <Button variant="ghost" size="sm">
              View all
            </Button>
          </div>
          <div className="space-y-4">
            {projectProgress.map((project) => (
              <div key={project.name} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{project.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {project.progress}%
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-muted">
                  <div
                    className={`h-2 rounded-full ${project.color}`}
                    style={{
                      width: `${project.progress}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
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
        <div className="space-y-4">
          {[
            { action: "Task completed", item: "Update API documentation", user: "John Doe", time: "2 minutes ago" },
            { action: "New task created", item: "Design login page", user: "Jane Smith", time: "15 minutes ago" },
            { action: "Project updated", item: "Website Redesign", user: "Bob Johnson", time: "1 hour ago" },
            { action: "Comment added", item: "PR #142 Review", user: "Alice Williams", time: "2 hours ago" },
            { action: "Board modified", item: "Sprint Planning", user: "Charlie Brown", time: "3 hours ago" },
          ].map((activity, i) => (
            <div key={i} className="flex items-center gap-3 text-sm">
              <div className="h-2 w-2 rounded-full bg-primary" />
              <span className="flex-1">
                <span className="font-medium">{activity.action}</span>
                {": "}
                <span className="text-muted-foreground">{activity.item}</span>
                <span className="text-muted-foreground"> by {activity.user}</span>
              </span>
              <span className="text-xs text-muted-foreground">{activity.time}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
