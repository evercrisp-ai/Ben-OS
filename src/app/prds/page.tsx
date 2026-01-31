"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, FileText, MoreHorizontal, Search, Eye, MessageSquare, Loader2, Upload } from "lucide-react";
import { useState, useRef } from "react";
import { usePRDs, useCreatePRD, useUploadPRDMarkdown } from "@/hooks/use-prds";
import { useProjects } from "@/hooks/use-projects";

export default function PRDsPage() {
  const router = useRouter();
  const { data: prds, isLoading: prdsLoading } = usePRDs();
  const { data: projects } = useProjects();
  const createPRD = useCreatePRD();
  const uploadPRD = useUploadPRDMarkdown();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [showNewPRDDialog, setShowNewPRDDialog] = useState(false);
  const [newPRDTitle, setNewPRDTitle] = useState("");
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [createMode, setCreateMode] = useState<"manual" | "upload">("manual");

  const filteredPRDs = prds?.filter((prd) => {
    const matchesSearch = prd.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || prd.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleCreatePRD = async () => {
    if (!selectedProjectId) return;

    if (createMode === "upload" && selectedFile) {
      const prd = await uploadPRD.mutateAsync({
        file: selectedFile,
        projectId: selectedProjectId,
        title: newPRDTitle.trim() || undefined,
      });
      resetForm();
      router.push(`/prds/${prd.id}`);
    } else if (createMode === "manual" && newPRDTitle.trim()) {
      const prd = await createPRD.mutateAsync({
        project_id: selectedProjectId,
        title: newPRDTitle.trim(),
      });
      resetForm();
      router.push(`/prds/${prd.id}`);
    }
  };

  const resetForm = () => {
    setNewPRDTitle("");
    setSelectedProjectId("");
    setSelectedFile(null);
    setShowNewPRDDialog(false);
    setCreateMode("manual");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      // Use filename as title if not set
      if (!newPRDTitle) {
        const titleFromFile = file.name.replace(/\.(md|markdown)$/i, "");
        setNewPRDTitle(titleFromFile);
      }
    }
  };

  const isPending = createPRD.isPending || uploadPRD.isPending;

  const getProjectName = (projectId: string) => {
    return projects?.find((p) => p.id === projectId)?.title || "Unknown Project";
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
      case "in_progress":
        return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400";
      case "completed":
        return "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400";
      case "draft":
      default:
        return "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400";
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">PRDs</h1>
          <p className="text-muted-foreground">
            Product requirement documents and specifications.
          </p>
        </div>
        <Dialog open={showNewPRDDialog} onOpenChange={setShowNewPRDDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New PRD
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Create New PRD</DialogTitle>
              <DialogDescription>
                Create a Product Requirements Document to plan your feature or initiative.
              </DialogDescription>
            </DialogHeader>
            <Tabs value={createMode} onValueChange={(v) => setCreateMode(v as "manual" | "upload")} className="mt-2">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="manual">Create Manually</TabsTrigger>
                <TabsTrigger value="upload">Upload Markdown</TabsTrigger>
              </TabsList>
              <TabsContent value="manual" className="space-y-4 pt-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Project</label>
                  <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
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
                  {projects?.length === 0 && (
                    <p className="text-xs text-muted-foreground">
                      No projects yet.{" "}
                      <Link href="/projects" className="text-primary underline">
                        Create a project first
                      </Link>
                      .
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">PRD Title</label>
                  <Input
                    placeholder="e.g., User Authentication System, Dashboard Redesign..."
                    value={newPRDTitle}
                    onChange={(e) => setNewPRDTitle(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleCreatePRD()}
                  />
                </div>
              </TabsContent>
              <TabsContent value="upload" className="space-y-4 pt-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Project</label>
                  <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
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
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Markdown File</label>
                  <div 
                    className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 transition-colors"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".md,.markdown"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                    {selectedFile ? (
                      <div className="flex items-center justify-center gap-2">
                        <FileText className="h-5 w-5 text-primary" />
                        <span className="font-medium">{selectedFile.name}</span>
                      </div>
                    ) : (
                      <>
                        <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                        <p className="text-sm text-muted-foreground">
                          Click to upload a markdown file (.md)
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          The file content will be parsed into PRD sections
                        </p>
                      </>
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">PRD Title (optional)</label>
                  <Input
                    placeholder="Extracted from file if not provided..."
                    value={newPRDTitle}
                    onChange={(e) => setNewPRDTitle(e.target.value)}
                  />
                </div>
              </TabsContent>
            </Tabs>
            <DialogFooter className="mt-4">
              <Button variant="outline" onClick={resetForm}>
                Cancel
              </Button>
              <Button
                onClick={handleCreatePRD}
                disabled={
                  !selectedProjectId ||
                  isPending ||
                  (createMode === "manual" && !newPRDTitle.trim()) ||
                  (createMode === "upload" && !selectedFile)
                }
              >
                {isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : createMode === "upload" ? (
                  <Upload className="mr-2 h-4 w-4" />
                ) : (
                  <Plus className="mr-2 h-4 w-4" />
                )}
                {createMode === "upload" ? "Upload & Create PRD" : "Create PRD"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search PRDs..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* PRDs List */}
      {prdsLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : filteredPRDs && filteredPRDs.length > 0 ? (
        <div className="space-y-4">
          {filteredPRDs.map((prd) => (
            <Link
              key={prd.id}
              href={`/prds/${prd.id}`}
              className="group block cursor-pointer rounded-lg border border-border bg-card p-4 shadow-sm transition-all hover:shadow-md hover:border-primary/50"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <FileText className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{prd.title}</h3>
                      <span className={`rounded-full px-2 py-0.5 text-xs ${getStatusColor(prd.status)}`}>
                        {prd.status.replace("_", " ")}
                      </span>
                    </div>
                    <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
                      <span>{getProjectName(prd.project_id)}</span>
                      <div className="flex items-center gap-1">
                        <Eye className="h-3 w-3" />
                        <span>--</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <MessageSquare className="h-3 w-3" />
                        <span>--</span>
                      </div>
                      <span>Updated {new Date(prd.updated_at).toLocaleDateString()}</span>
                    </div>
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
            </Link>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <FileText className="h-12 w-12 text-muted-foreground/50 mb-4" />
          <h3 className="text-lg font-semibold">No PRDs yet</h3>
          <p className="text-muted-foreground mt-1">
            {searchQuery || statusFilter !== "all"
              ? "No PRDs match your filters"
              : "Create a PRD to document your plans and specs"}
          </p>
          {!searchQuery && statusFilter === "all" && (
            <Button className="mt-4" onClick={() => setShowNewPRDDialog(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create your first PRD
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
