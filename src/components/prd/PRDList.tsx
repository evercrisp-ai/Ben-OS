'use client';

import * as React from 'react';
import { Plus, FileText, MoreVertical, Pencil, Trash2, Clock, CheckCircle2, PlayCircle, FileCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { usePRDs, useCreatePRD, useDeletePRD } from '@/hooks/use-prds';
import { PRD_SECTIONS } from '@/types/database';
import type { PRD, PRDStatus } from '@/types/database';
import { formatDistanceToNow } from 'date-fns';

interface PRDListProps {
  projectId: string;
  onSelectPRD?: (prd: PRD) => void;
}

const statusConfig: Record<PRDStatus, { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive'; icon: React.ElementType }> = {
  draft: { label: 'Draft', variant: 'secondary', icon: FileText },
  approved: { label: 'Approved', variant: 'default', icon: FileCheck },
  in_progress: { label: 'In Progress', variant: 'outline', icon: PlayCircle },
  completed: { label: 'Completed', variant: 'default', icon: CheckCircle2 },
};

export function PRDList({ projectId, onSelectPRD }: PRDListProps) {
  const { data: prds = [], isLoading } = usePRDs(projectId);
  const createPRD = useCreatePRD();
  const deletePRD = useDeletePRD();

  const [isCreateDialogOpen, setIsCreateDialogOpen] = React.useState(false);
  const [newPRDTitle, setNewPRDTitle] = React.useState('');

  const handleCreate = async () => {
    if (!newPRDTitle.trim()) return;

    await createPRD.mutateAsync({
      project_id: projectId,
      title: newPRDTitle.trim(),
      content: '',
      status: 'draft',
      sections: PRD_SECTIONS.map((s) => ({ ...s, content: '' })),
    });

    setNewPRDTitle('');
    setIsCreateDialogOpen(false);
  };

  const handleDelete = async (prd: PRD) => {
    if (confirm(`Are you sure you want to delete "${prd.title}"?`)) {
      await deletePRD.mutateAsync(prd.id);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4" data-testid="prd-list-loading">
        {[1, 2].map((i) => (
          <div key={i} className="h-32 rounded-lg bg-muted animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4" data-testid="prd-list">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="size-5 text-primary" />
          <h2 className="text-lg font-semibold">PRDs</h2>
          <span className="text-sm text-muted-foreground">({prds.length})</span>
        </div>
        <Button size="sm" onClick={() => setIsCreateDialogOpen(true)} className="gap-1">
          <Plus className="size-4" />
          New PRD
        </Button>
      </div>

      {/* PRD List */}
      {prds.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center border rounded-lg border-dashed">
          <FileText className="size-12 text-muted-foreground mb-4" />
          <h3 className="font-medium text-lg mb-1">No PRDs yet</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Create your first Product Requirements Document
          </p>
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="size-4 mr-1" />
            Create PRD
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {prds.map((prd) => {
            const status = statusConfig[prd.status];
            const StatusIcon = status.icon;

            return (
              <Card
                key={prd.id}
                className="cursor-pointer hover:border-primary/50 transition-colors"
                onClick={() => onSelectPRD?.(prd)}
                data-testid={`prd-${prd.id}`}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-base truncate">{prd.title}</CardTitle>
                      <CardDescription className="flex items-center gap-1 mt-1">
                        <Clock className="size-3" />
                        {formatDistanceToNow(new Date(prd.updated_at), { addSuffix: true })}
                      </CardDescription>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="icon" className="size-8">
                          <MoreVertical className="size-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onSelectPRD?.(prd); }}>
                          <Pencil className="size-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={(e) => { e.stopPropagation(); handleDelete(prd); }}
                        >
                          <Trash2 className="size-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent>
                  <Badge variant={status.variant} className="gap-1">
                    <StatusIcon className="size-3" />
                    {status.label}
                  </Badge>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New PRD</DialogTitle>
            <DialogDescription>
              Create a new Product Requirements Document with predefined sections.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="prd-title">Title</Label>
            <Input
              id="prd-title"
              value={newPRDTitle}
              onChange={(e) => setNewPRDTitle(e.target.value)}
              placeholder="e.g., User Authentication System"
              className="mt-2"
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCreate();
              }}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={!newPRDTitle.trim() || createPRD.isPending}>
              {createPRD.isPending ? 'Creating...' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
