"use client";

import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Plus,
  FolderKanban,
  ArrowLeft,
  Loader2,
  CheckCircle2,
  Clock,
} from "lucide-react";
import { useState } from "react";
import { useArea } from "@/hooks/use-areas";
import { useProjects, useCreateProject } from "@/hooks/use-projects";

export default function AreaPage() {
  const params = useParams();
  const router = useRouter();
  const areaId = params.id as string;

  const { data: area, isLoading: areaLoading, error: areaError } = useArea(areaId);
  const { data: projects, isLoading: projectsLoading } = useProjects(areaId);
  const createProject = useCreateProject();

  const [showNewProjectDialog, setShowNewProjectDialog] = useState(false);
  const [newProjectTitle, setNewProjectTitle] = useState("");

  const handleCreateProject = async () => {
    if (!newProjectTitle.trim()) return;
    const project = await createProject.mutateAsync({
      area_id: areaId,
      title: newProjectTitle.trim(),
    });
    setNewProjectTitle("");
    setShowNewProjectDialog(false);
    router.push(`/projects/${project.id}`);
  };

  const stats = {
    totalProjects: projects?.length || 0,
    activeProjects: projects?.filter((p) => p.status === "active").length || 0,
    completedProjects: projects?.filter((p) => p.status === "completed").length || 0,
  };

  if (areaLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (areaError || !area) {
    return (
      <div className="flex h-[50vh] flex-col items-center justify-center gap-4">
        <h1 className="text-2xl font-bold">Area not found</h1>
        <p className="text-muted-foreground">
          The area you&apos;re looking for doesn&apos;t exist.
        </p>
        <Button onClick={() => router.push("/")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.push("/")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <span className="text-3xl">{area.icon}</span>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{area.name}</h1>
            <p className="text-muted-foreground capitalize">{area.type} area</p>
          </div>
        </div>
        <Dialog open={showNewProjectDialog} onOpenChange={setShowNewProjectDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Project
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Project</DialogTitle>
              <DialogDescription>
                Create a project in the {area.name} area.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <Input
                placeholder="Project title..."
                value={newProjectTitle}
                onChange={(e) => setNewProjectTitle(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleCreateProject()}
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowNewProjectDialog(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleCreateProject}
                disabled={!newProjectTitle.trim() || createProject.isPending}
              >
                {createProject.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="mr-2 h-4 w-4" />
                )}
                Create Project
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">Total Projects</span>
            <FolderKanban className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="mt-2">
            <span className="text-2xl font-bold">{stats.totalProjects}</span>
          </div>
        </div>
        <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">Active</span>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="mt-2">
            <span className="text-2xl font-bold">{stats.activeProjects}</span>
          </div>
        </div>
        <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">Completed</span>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="mt-2">
            <span className="text-2xl font-bold">{stats.completedProjects}</span>
          </div>
        </div>
      </div>

      {/* Projects */}
      <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Projects</h2>
        </div>

        {projectsLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : projects && projects.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => (
              <Link
                key={project.id}
                href={`/projects/${project.id}`}
                className="group rounded-lg border border-border p-4 transition-all hover:shadow-md hover:border-primary/50"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <FolderKanban className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold truncate">{project.title}</h3>
                    {project.description && (
                      <p className="text-xs text-muted-foreground truncate">
                        {project.description}
                      </p>
                    )}
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs ${
                      project.status === "active"
                        ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                        : project.status === "completed"
                          ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                          : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400"
                    }`}
                  >
                    {project.status}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(project.updated_at).toLocaleDateString()}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <FolderKanban className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground">No projects in this area yet</p>
            <Button className="mt-4" onClick={() => setShowNewProjectDialog(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create your first project
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
