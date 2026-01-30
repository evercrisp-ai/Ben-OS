"use client";

import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useProject } from "@/hooks/use-projects";
import { useBoards, useCreateBoard } from "@/hooks/use-boards";
import { usePRDs, useCreatePRD } from "@/hooks/use-prds";
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
  Loader2,
  ArrowLeft,
  Plus,
  Kanban,
  FileText,
  MoreHorizontal,
  Calendar,
} from "lucide-react";
import { useState } from "react";

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;

  const { data: project, isLoading: projectLoading, error: projectError } = useProject(projectId);
  const { data: boards, isLoading: boardsLoading } = useBoards(projectId);
  const { data: prds, isLoading: prdsLoading } = usePRDs(projectId);

  const createBoard = useCreateBoard();
  const createPRD = useCreatePRD();

  const [newBoardName, setNewBoardName] = useState("");
  const [newPRDTitle, setNewPRDTitle] = useState("");
  const [showNewBoardDialog, setShowNewBoardDialog] = useState(false);
  const [showNewPRDDialog, setShowNewPRDDialog] = useState(false);

  const handleCreateBoard = async () => {
    if (!newBoardName.trim()) return;
    await createBoard.mutateAsync({
      project_id: projectId,
      name: newBoardName.trim(),
    });
    setNewBoardName("");
    setShowNewBoardDialog(false);
  };

  const handleCreatePRD = async () => {
    if (!newPRDTitle.trim()) return;
    const prd = await createPRD.mutateAsync({
      project_id: projectId,
      title: newPRDTitle.trim(),
    });
    setNewPRDTitle("");
    setShowNewPRDDialog(false);
    router.push(`/prds/${prd.id}`);
  };

  if (projectLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (projectError || !project) {
    return (
      <div className="flex h-[50vh] flex-col items-center justify-center gap-4">
        <h1 className="text-2xl font-bold">Project not found</h1>
        <p className="text-muted-foreground">
          The project you&apos;re looking for doesn&apos;t exist or has been deleted.
        </p>
        <Button onClick={() => router.push("/projects")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Projects
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Button variant="ghost" size="icon" onClick={() => router.push("/projects")}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <span
              className={`inline-block rounded-full px-2 py-0.5 text-xs ${
                project.status === "active"
                  ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                  : project.status === "completed"
                    ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                    : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400"
              }`}
            >
              {project.status}
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">{project.title}</h1>
          {project.description && (
            <p className="text-muted-foreground mt-1">{project.description}</p>
          )}
          {project.target_date && (
            <div className="flex items-center gap-1 mt-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              Target: {new Date(project.target_date).toLocaleDateString()}
            </div>
          )}
        </div>
      </div>

      {/* Boards Section */}
      <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Kanban className="h-5 w-5 text-muted-foreground" />
            <h2 className="text-lg font-semibold">Boards</h2>
          </div>
          <Dialog open={showNewBoardDialog} onOpenChange={setShowNewBoardDialog}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="mr-2 h-4 w-4" />
                New Board
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Board</DialogTitle>
                <DialogDescription>
                  Create a Kanban board to manage tasks for this project.
                </DialogDescription>
              </DialogHeader>
              <div className="py-4">
                <Input
                  placeholder="Board name..."
                  value={newBoardName}
                  onChange={(e) => setNewBoardName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleCreateBoard()}
                />
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowNewBoardDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateBoard} disabled={!newBoardName.trim() || createBoard.isPending}>
                  {createBoard.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Plus className="mr-2 h-4 w-4" />
                  )}
                  Create Board
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {boardsLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : boards && boards.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {boards.map((board) => (
              <Link
                key={board.id}
                href={`/boards/${board.id}`}
                className="group rounded-lg border border-border p-4 transition-all hover:shadow-md hover:border-primary/50"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <Kanban className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold">{board.name}</h3>
                      <p className="text-xs text-muted-foreground">
                        {(board.column_config as Array<{ id: string }>)?.length || 0} columns
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 opacity-0 transition-opacity group-hover:opacity-100"
                    onClick={(e) => e.preventDefault()}
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <Kanban className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground">No boards yet</p>
            <p className="text-sm text-muted-foreground">Create a board to start managing tasks</p>
          </div>
        )}
      </div>

      {/* PRDs Section */}
      <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-muted-foreground" />
            <h2 className="text-lg font-semibold">PRDs</h2>
          </div>
          <Dialog open={showNewPRDDialog} onOpenChange={setShowNewPRDDialog}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="mr-2 h-4 w-4" />
                New PRD
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New PRD</DialogTitle>
                <DialogDescription>
                  Create a Product Requirements Document to plan your feature or initiative.
                </DialogDescription>
              </DialogHeader>
              <div className="py-4">
                <Input
                  placeholder="PRD title..."
                  value={newPRDTitle}
                  onChange={(e) => setNewPRDTitle(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleCreatePRD()}
                />
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowNewPRDDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreatePRD} disabled={!newPRDTitle.trim() || createPRD.isPending}>
                  {createPRD.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Plus className="mr-2 h-4 w-4" />
                  )}
                  Create PRD
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {prdsLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : prds && prds.length > 0 ? (
          <div className="space-y-3">
            {prds.map((prd) => (
              <Link
                key={prd.id}
                href={`/prds/${prd.id}`}
                className="group flex items-center gap-3 rounded-lg border border-border p-4 transition-all hover:shadow-md hover:border-primary/50"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <FileText className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold">{prd.title}</h3>
                  <p className="text-xs text-muted-foreground">
                    Updated {new Date(prd.updated_at).toLocaleDateString()}
                  </p>
                </div>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs ${
                    prd.status === "approved"
                      ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                      : prd.status === "in_progress"
                        ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                        : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400"
                  }`}
                >
                  {prd.status}
                </span>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground">No PRDs yet</p>
            <p className="text-sm text-muted-foreground">Create a PRD to plan your features</p>
          </div>
        )}
      </div>
    </div>
  );
}
