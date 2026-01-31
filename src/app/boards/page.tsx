"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Kanban, MoreHorizontal, Search, Loader2, Users } from "lucide-react";
import { useState } from "react";
import { useBoards } from "@/hooks/use-boards";
import { useProjects } from "@/hooks/use-projects";
import type { ColumnConfig } from "@/types/database";

export default function BoardsPage() {
  const { data: boards, isLoading: boardsLoading } = useBoards();
  const { data: projects } = useProjects();

  const [searchQuery, setSearchQuery] = useState("");

  const filteredBoards = boards?.filter((board) =>
    board.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getProjectName = (projectId: string) => {
    return projects?.find((p) => p.id === projectId)?.title || "Unknown Project";
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Boards</h1>
          <p className="text-muted-foreground">
            Kanban boards for visual task management. Each project has its own board.
          </p>
        </div>
        <Link href="/projects">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Project
          </Button>
        </Link>
      </div>

      {/* Search */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search boards..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Boards Grid */}
      {boardsLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : filteredBoards && filteredBoards.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredBoards.map((board) => {
            const columns = (board.column_config as ColumnConfig[]) || [];
            return (
              <Link
                key={board.id}
                href={`/boards/${board.id}`}
                className="group cursor-pointer rounded-lg border border-border bg-card p-4 shadow-sm transition-all hover:shadow-md hover:border-primary/50"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <Kanban className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold">{board.name}</h3>
                      <p className="text-xs text-muted-foreground">
                        {getProjectName(board.project_id)}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 opacity-0 transition-opacity group-hover:opacity-100"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </div>
                <div className="mt-4 flex items-center justify-between text-sm">
                  <div className="flex items-center gap-4 text-muted-foreground">
                    <span>{columns.length} columns</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
                <div className="mt-3 text-xs text-muted-foreground">
                  Updated {new Date(board.updated_at).toLocaleDateString()}
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Kanban className="h-12 w-12 text-muted-foreground/50 mb-4" />
          <h3 className="text-lg font-semibold">No boards yet</h3>
          <p className="text-muted-foreground mt-1">
            {searchQuery
              ? "No boards match your search"
              : "Boards are automatically created with each project"}
          </p>
          {!searchQuery && (
            <Link href="/projects">
              <Button className="mt-4">
                <Plus className="mr-2 h-4 w-4" />
                Create your first project
              </Button>
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
