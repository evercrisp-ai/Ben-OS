"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useUIStore } from "@/stores/ui-store";
import { useAreas, useCreateArea } from "@/hooks/use-areas";
import { useProjects, useCreateProject } from "@/hooks/use-projects";
import { useCreatePRD } from "@/hooks/use-prds";
import type { AreaType } from "@/types/database";

const AREA_ICONS = ["🏠", "💼", "🚀", "📚", "🎯", "💡", "🔧", "🎨"];

export function QuickCreate() {
  const router = useRouter();
  const { quickCreateOpen, setQuickCreateOpen } = useUIStore();

  const { data: areas } = useAreas();
  const { data: projects } = useProjects();
  const createArea = useCreateArea();
  const createProject = useCreateProject();
  const createPRD = useCreatePRD();

  // Project form state
  const [projectTitle, setProjectTitle] = React.useState("");
  const [projectDescription, setProjectDescription] = React.useState("");
  const [selectedAreaId, setSelectedAreaId] = React.useState("");

  // New area inline form (when no areas exist)
  const [showNewArea, setShowNewArea] = React.useState(false);
  const [newAreaName, setNewAreaName] = React.useState("");
  const [newAreaIcon, setNewAreaIcon] = React.useState("🏠");
  const [newAreaType, setNewAreaType] = React.useState<AreaType>("personal");

  // PRD form state
  const [prdTitle, setPRDTitle] = React.useState("");
  const [prdProjectId, setPRDProjectId] = React.useState("");

  const resetForms = () => {
    setProjectTitle("");
    setProjectDescription("");
    setSelectedAreaId("");
    setShowNewArea(false);
    setNewAreaName("");
    setNewAreaIcon("🏠");
    setNewAreaType("personal");
    setPRDTitle("");
    setPRDProjectId("");
  };

  const handleClose = () => {
    setQuickCreateOpen(null);
    resetForms();
  };

  const handleCreateProject = async () => {
    if (!projectTitle.trim()) return;

    let areaId = selectedAreaId;

    // Create a new area if needed
    if (showNewArea && newAreaName.trim()) {
      const newArea = await createArea.mutateAsync({
        name: newAreaName.trim(),
        icon: newAreaIcon,
        type: newAreaType,
      });
      areaId = newArea.id;
    }

    if (!areaId) return;

    const project = await createProject.mutateAsync({
      area_id: areaId,
      title: projectTitle.trim(),
      description: projectDescription.trim() || undefined,
    });

    handleClose();
    router.push(`/projects/${project.id}`);
  };

  const handleCreatePRD = async () => {
    if (!prdTitle.trim() || !prdProjectId) return;

    const prd = await createPRD.mutateAsync({
      project_id: prdProjectId,
      title: prdTitle.trim(),
    });

    handleClose();
    router.push(`/prds/${prd.id}`);
  };

  const isPending =
    createArea.isPending ||
    createProject.isPending ||
    createPRD.isPending;

  return (
    <>
      {/* Quick Create Project */}
      <Dialog open={quickCreateOpen === "project"} onOpenChange={(open) => !open && handleClose()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Quick Create Project</DialogTitle>
            <DialogDescription>
              Create a new project. Projects organize your boards and PRDs.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {!showNewArea ? (
              <div className="space-y-2">
                <label className="text-sm font-medium">Area</label>
                <Select value={selectedAreaId} onValueChange={setSelectedAreaId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select an area..." />
                  </SelectTrigger>
                  <SelectContent>
                    {areas?.map((area) => (
                      <SelectItem key={area.id} value={area.id}>
                        {area.icon} {area.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {(!areas || areas.length === 0) && (
                  <p className="text-xs text-muted-foreground">
                    No areas yet.{" "}
                    <button
                      type="button"
                      className="text-primary underline"
                      onClick={() => setShowNewArea(true)}
                    >
                      Create one now
                    </button>
                  </p>
                )}
                {areas && areas.length > 0 && (
                  <button
                    type="button"
                    className="text-xs text-primary underline"
                    onClick={() => setShowNewArea(true)}
                  >
                    Or create a new area
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-3 p-3 rounded-lg border bg-muted/50">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">New Area</span>
                  <button
                    type="button"
                    className="text-xs text-muted-foreground underline"
                    onClick={() => setShowNewArea(false)}
                  >
                    Cancel
                  </button>
                </div>
                <div className="flex flex-wrap gap-1">
                  {AREA_ICONS.map((icon) => (
                    <Button
                      key={icon}
                      type="button"
                      variant={newAreaIcon === icon ? "default" : "outline"}
                      size="icon"
                      className="h-8 w-8 text-base"
                      onClick={() => setNewAreaIcon(icon)}
                    >
                      {icon}
                    </Button>
                  ))}
                </div>
                <Input
                  placeholder="Area name..."
                  value={newAreaName}
                  onChange={(e) => setNewAreaName(e.target.value)}
                />
                <Select value={newAreaType} onValueChange={(v) => setNewAreaType(v as AreaType)}>
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="personal">Personal</SelectItem>
                    <SelectItem value="work">Work</SelectItem>
                    <SelectItem value="project">Project</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="space-y-2">
              <label className="text-sm font-medium">Project Title</label>
              <Input
                placeholder="e.g., Website Redesign, Mobile App..."
                value={projectTitle}
                onChange={(e) => setProjectTitle(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleCreateProject()}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Description (optional)</label>
              <Textarea
                placeholder="What is this project about?"
                value={projectDescription}
                onChange={(e) => setProjectDescription(e.target.value)}
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button
              onClick={handleCreateProject}
              disabled={
                !projectTitle.trim() ||
                (!selectedAreaId && (!showNewArea || !newAreaName.trim())) ||
                isPending
              }
            >
              {isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Plus className="mr-2 h-4 w-4" />
              )}
              Create Project
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Quick Create PRD */}
      <Dialog open={quickCreateOpen === "prd"} onOpenChange={(open) => !open && handleClose()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Quick Create PRD</DialogTitle>
            <DialogDescription>
              Create a Product Requirements Document to plan your feature.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Project</label>
              <Select value={prdProjectId} onValueChange={setPRDProjectId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a project..." />
                </SelectTrigger>
                <SelectContent>
                  {projects?.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {(!projects || projects.length === 0) && (
                <p className="text-xs text-muted-foreground">
                  No projects yet.{" "}
                  <button
                    type="button"
                    className="text-primary underline"
                    onClick={() => {
                      setQuickCreateOpen("project");
                    }}
                  >
                    Create a project first
                  </button>
                </p>
              )}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">PRD Title</label>
              <Input
                placeholder="e.g., User Authentication, Dashboard Redesign..."
                value={prdTitle}
                onChange={(e) => setPRDTitle(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleCreatePRD()}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button
              onClick={handleCreatePRD}
              disabled={!prdTitle.trim() || !prdProjectId || isPending}
            >
              {isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Plus className="mr-2 h-4 w-4" />
              )}
              Create PRD
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
