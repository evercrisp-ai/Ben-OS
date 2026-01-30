'use client';

import * as React from 'react';
import { History, RotateCcw, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { usePRDVersions, useRestorePRDVersion } from '@/hooks/use-prds';
import type { PRDVersion, PRDSection } from '@/types/database';
import { formatDistanceToNow, format } from 'date-fns';

interface PRDVersionHistoryProps {
  prdId: string;
}

export function PRDVersionHistory({ prdId }: PRDVersionHistoryProps) {
  const { data: versions = [], isLoading } = usePRDVersions(prdId);
  const restoreVersion = useRestorePRDVersion();

  const [selectedVersion, setSelectedVersion] = React.useState<PRDVersion | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = React.useState(false);
  const [isRestoreConfirmOpen, setIsRestoreConfirmOpen] = React.useState(false);

  const handleRestore = async () => {
    if (!selectedVersion) return;

    await restoreVersion.mutateAsync({
      prdId,
      version: selectedVersion,
    });

    setIsRestoreConfirmOpen(false);
    setSelectedVersion(null);
  };

  const handlePreview = (version: PRDVersion) => {
    setSelectedVersion(version);
    setIsPreviewOpen(true);
  };

  const handleRestoreClick = (version: PRDVersion) => {
    setSelectedVersion(version);
    setIsRestoreConfirmOpen(true);
  };

  return (
    <>
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="outline" size="sm" className="gap-1" data-testid="version-history-btn">
            <History className="size-4" />
            History
          </Button>
        </SheetTrigger>
        <SheetContent className="w-[400px] sm:w-[540px]">
          <SheetHeader>
            <SheetTitle>Version History</SheetTitle>
            <SheetDescription>
              View and restore previous versions of this PRD.
            </SheetDescription>
          </SheetHeader>

          <ScrollArea className="h-[calc(100vh-120px)] mt-6" data-testid="version-list">
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-20 rounded-lg bg-muted animate-pulse" />
                ))}
              </div>
            ) : versions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <History className="size-12 text-muted-foreground mb-4" />
                <h3 className="font-medium text-lg mb-1">No versions yet</h3>
                <p className="text-sm text-muted-foreground">
                  Versions are created automatically when you make changes.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {versions.map((version) => (
                  <div
                    key={version.id}
                    className="p-4 rounded-lg border bg-card"
                    data-testid={`version-${version.version_number}`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">Version {version.version_number}</span>
                          <Badge variant="outline" className="text-xs">
                            {version.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(version.created_at), 'MMM d, yyyy h:mm a')}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(version.created_at), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground truncate mb-3">
                      {version.title}
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePreview(version)}
                        className="gap-1"
                      >
                        <Eye className="size-3" />
                        Preview
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRestoreClick(version)}
                        className="gap-1"
                      >
                        <RotateCcw className="size-3" />
                        Restore
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </SheetContent>
      </Sheet>

      {/* Preview Dialog */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>
              Version {selectedVersion?.version_number} - {selectedVersion?.title}
            </DialogTitle>
            <DialogDescription>
              {selectedVersion && format(new Date(selectedVersion.created_at), 'MMM d, yyyy h:mm a')}
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="h-[60vh] pr-4">
            <div className="prose prose-sm dark:prose-invert max-w-none">
              {selectedVersion?.content ? (
                <pre className="whitespace-pre-wrap font-sans text-sm">
                  {selectedVersion.content}
                </pre>
              ) : (
                <div className="space-y-4">
                  {((selectedVersion?.sections || []) as unknown as PRDSection[]).map((section) => (
                    <div key={section.id}>
                      <h3 className="font-semibold">{section.title}</h3>
                      <p className="text-muted-foreground">
                        {section.content || '(empty)'}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </ScrollArea>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPreviewOpen(false)}>
              Close
            </Button>
            <Button onClick={() => { setIsPreviewOpen(false); handleRestoreClick(selectedVersion!); }}>
              <RotateCcw className="size-4 mr-1" />
              Restore This Version
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Restore Confirmation Dialog */}
      <Dialog open={isRestoreConfirmOpen} onOpenChange={setIsRestoreConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Restore Version {selectedVersion?.version_number}?</DialogTitle>
            <DialogDescription>
              This will replace the current content with the content from version{' '}
              {selectedVersion?.version_number}. The current version will be saved to history.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRestoreConfirmOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleRestore} disabled={restoreVersion.isPending}>
              {restoreVersion.isPending ? 'Restoring...' : 'Restore'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
