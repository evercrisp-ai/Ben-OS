"use client";

import * as React from "react";
import {
  Zap,
  Plus,
  FolderPlus,
  Search,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useCreateTask,
  useCreateProject,
  useAreas,
  useBoards,
} from "@/hooks";
import { useUIStore } from "@/stores/ui-store";
import { cn } from "@/lib/utils";

type ModalType = "task" | "project" | null;

interface QuickActionsWidgetProps {
  className?: string;
}

export function QuickActionsWidget({ className }: QuickActionsWidgetProps) {
  const [activeModal, setActiveModal] = React.useState<ModalType>(null);
  const { toggleCommandPalette } = useUIStore();

  const actions = [
    {
      id: "new-task",
      label: "New Task",
      icon: Plus,
      color: "text-blue-500 bg-blue-100 dark:bg-blue-900/30",
      onClick: () => setActiveModal("task"),
    },
    {
      id: "new-project",
      label: "New Project",
      icon: FolderPlus,
      color: "text-green-500 bg-green-100 dark:bg-green-900/30",
      onClick: () => setActiveModal("project"),
    },
    {
      id: "search",
      label: "Search",
      icon: Search,
      color: "text-purple-500 bg-purple-100 dark:bg-purple-900/30",
      onClick: () => toggleCommandPalette(),
      shortcut: "⌘K",
    },
  ];

  return (
    <>
      <Card className={className}>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <Zap className="size-5 text-primary" />
            Quick Actions
          </CardTitle>
          <CardDescription>Common actions at your fingertips</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-3">
            {actions.map((action) => {
              const Icon = action.icon;
              return (
                <Button
                  key={action.id}
                  variant="outline"
                  className={cn(
                    "flex flex-col items-center justify-center h-24 gap-2 relative",
                    "hover:border-primary/50"
                  )}
                  onClick={action.onClick}
                  data-testid={`quick-action-${action.id}`}
                >
                  <div
                    className={cn(
                      "flex items-center justify-center size-10 rounded-lg",
                      action.color
                    )}
                  >
                    <Icon className="size-5" />
                  </div>
                  <span className="text-xs font-medium">{action.label}</span>
                  {action.shortcut && (
                    <span className="absolute top-2 right-2 text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                      {action.shortcut}
                    </span>
                  )}
                </Button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* New Task Modal */}
      <NewTaskModal
        open={activeModal === "task"}
        onOpenChange={(open) => setActiveModal(open ? "task" : null)}
      />

      {/* New Project Modal */}
      <NewProjectModal
        open={activeModal === "project"}
        onOpenChange={(open) => setActiveModal(open ? "project" : null)}
      />
    </>
  );
}

interface NewTaskModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function NewTaskModal({ open, onOpenChange }: NewTaskModalProps) {
  const [title, setTitle] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [boardId, setBoardId] = React.useState("");
  const [priority, setPriority] = React.useState<string>("medium");

  const { data: boards } = useBoards();
  const createTask = useCreateTask();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !boardId) return;

    await createTask.mutateAsync({
      title: title.trim(),
      description: description.trim() || null,
      board_id: boardId,
      priority: priority as "low" | "medium" | "high" | "critical",
      status: "backlog",
      column_id: "backlog",
    });

    // Reset form
    setTitle("");
    setDescription("");
    setBoardId("");
    setPriority("medium");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent data-testid="new-task-modal">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="size-5 text-primary" />
            New Task
          </DialogTitle>
          <DialogDescription>
            Create a new task in your project
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="task-title">Title</Label>
            <Input
              id="task-title"
              placeholder="Enter task title..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="task-description">Description</Label>
            <Textarea
              id="task-description"
              placeholder="Add details..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="task-board">Board</Label>
              <Select value={boardId} onValueChange={setBoardId}>
                <SelectTrigger id="task-board">
                  <SelectValue placeholder="Select board" />
                </SelectTrigger>
                <SelectContent>
                  {boards?.map((board) => (
                    <SelectItem key={board.id} value={board.id}>
                      {board.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="task-priority">Priority</Label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger id="task-priority">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!title.trim() || !boardId || createTask.isPending}
            >
              {createTask.isPending ? "Creating..." : "Create Task"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

interface NewProjectModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function NewProjectModal({ open, onOpenChange }: NewProjectModalProps) {
  const [title, setTitle] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [areaId, setAreaId] = React.useState("");

  const { data: areas } = useAreas();
  const createProject = useCreateProject();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !areaId) return;

    await createProject.mutateAsync({
      title: title.trim(),
      description: description.trim() || null,
      area_id: areaId,
      status: "active",
    });

    // Reset form
    setTitle("");
    setDescription("");
    setAreaId("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent data-testid="new-project-modal">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FolderPlus className="size-5 text-primary" />
            New Project
          </DialogTitle>
          <DialogDescription>
            Create a new project in your workspace
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="project-title">Title</Label>
            <Input
              id="project-title"
              placeholder="Enter project title..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="project-description">Description</Label>
            <Textarea
              id="project-description"
              placeholder="Add project description..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="project-area">Area</Label>
            <Select value={areaId} onValueChange={setAreaId}>
              <SelectTrigger id="project-area">
                <SelectValue placeholder="Select area" />
              </SelectTrigger>
              <SelectContent>
                {areas?.map((area) => (
                  <SelectItem key={area.id} value={area.id}>
                    {area.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!title.trim() || !areaId || createProject.isPending}
            >
              {createProject.isPending ? "Creating..." : "Create Project"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
