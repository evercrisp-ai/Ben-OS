'use client';

import * as React from 'react';
import { ArrowLeft, Download, Save, Check, Loader2, ListTodo, GitBranch, LayoutList } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { PRDStatusBadge } from './PRDStatusBadge';
import { PRDVersionHistory } from './PRDVersionHistory';
import { PRDLinkedTasks } from './PRDLinkedTasks';
import { PRDProgress } from './PRDProgress';
import { PRDTraceability } from './PRDTraceability';
import { usePRD, useUpdatePRD, useUpdatePRDStatus } from '@/hooks/use-prds';
import { useGenerateTasksFromPRD } from '@/hooks/use-tasks';
import { exportPRDToMarkdown } from '@/lib/prd-export';
import { PRD_SECTIONS } from '@/types/database';
import type { PRD, PRDSection, PRDStatus, Json, Task } from '@/types/database';

type ViewMode = 'editor' | 'tasks' | 'traceability';

interface PRDEditorProps {
  prdId: string;
  boardId?: string;
  onBack?: () => void;
  onSave?: (prd: PRD) => void;
  onTaskClick?: (task: Task) => void;
}

const DEBOUNCE_DELAY = 1500; // 1.5 seconds

/**
 * Extract requirements from PRD sections for task generation
 */
function extractRequirementsForTasks(sections: PRDSection[]): Array<{ title: string; description?: string }> {
  const requirements: Array<{ title: string; description?: string }> = [];
  
  for (const section of sections) {
    if (!section.content) continue;
    
    const lines = section.content.split('\n');
    
    for (const line of lines) {
      const trimmed = line.trim();
      // Match bullet points (-, *, •) or numbered items (1., 1), etc.)
      if (/^[-*•]\s+.+|^\d+[.)]\s+.+/.test(trimmed)) {
        const text = trimmed.replace(/^[-*•]\s+|^\d+[.)]\s+/, '').trim();
        if (text.length > 5) {
          requirements.push({
            title: text.length > 100 ? text.substring(0, 100) + '...' : text,
            description: section.title === 'Requirements' ? undefined : `From ${section.title}: ${text}`,
          });
        }
      }
    }
  }
  
  return requirements;
}

export function PRDEditor({ prdId, boardId, onBack, onSave, onTaskClick }: PRDEditorProps) {
  const { data: prd, isLoading } = usePRD(prdId);
  const updatePRD = useUpdatePRD();
  const updateStatus = useUpdatePRDStatus();
  const generateTasks = useGenerateTasksFromPRD();

  const [title, setTitle] = React.useState('');
  const [sections, setSections] = React.useState<PRDSection[]>([]);
  const [content, setContent] = React.useState('');
  const [useRawMode, setUseRawMode] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);
  const [lastSaved, setLastSaved] = React.useState<Date | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = React.useState(false);
  const [viewMode, setViewMode] = React.useState<ViewMode>('editor');
  const [showGenerateDialog, setShowGenerateDialog] = React.useState(false);
  const [isGenerating, setIsGenerating] = React.useState(false);

  const debounceTimerRef = React.useRef<NodeJS.Timeout | null>(null);

  // Initialize state from PRD
  React.useEffect(() => {
    if (prd) {
      setTitle(prd.title);
      setContent(prd.content || '');

      // Parse sections from PRD, or use defaults
      const prdSections = prd.sections as PRDSection[] | null;
      if (prdSections && Array.isArray(prdSections) && prdSections.length > 0) {
        setSections(prdSections);
      } else {
        setSections(PRD_SECTIONS.map((s) => ({ ...s, content: '' })));
      }

      // Determine if we should use raw mode (if content exists but sections are empty)
      setUseRawMode(!!prd.content && (!prdSections || prdSections.length === 0));
    }
  }, [prd]);

  // Auto-save function
  const saveChanges = React.useCallback(async () => {
    if (!prd) return;

    setIsSaving(true);

    try {
      const updateData = useRawMode
        ? { id: prd.id, title, content, sections: [] as Json }
        : {
            id: prd.id,
            title,
            content: '',
            sections: sections as unknown as Json,
          };

      const result = await updatePRD.mutateAsync(updateData);
      setLastSaved(new Date());
      setHasUnsavedChanges(false);
      onSave?.(result);
    } finally {
      setIsSaving(false);
    }
  }, [prd, title, sections, content, useRawMode, updatePRD, onSave]);

  // Debounced auto-save
  const triggerAutoSave = React.useCallback(() => {
    setHasUnsavedChanges(true);

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      saveChanges();
    }, DEBOUNCE_DELAY);
  }, [saveChanges]);

  // Cleanup debounce timer
  React.useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  // Handle title change
  const handleTitleChange = (value: string) => {
    setTitle(value);
    triggerAutoSave();
  };

  // Handle section content change
  const handleSectionChange = (sectionId: string, value: string) => {
    setSections((prev) =>
      prev.map((s) => (s.id === sectionId ? { ...s, content: value } : s))
    );
    triggerAutoSave();
  };

  // Handle raw content change
  const handleContentChange = (value: string) => {
    setContent(value);
    triggerAutoSave();
  };

  // Handle status change
  const handleStatusChange = async (status: PRDStatus) => {
    if (!prd) return;
    await updateStatus.mutateAsync({ id: prd.id, status });
  };

  // Handle export
  const handleExport = () => {
    if (!prd) return;

    const markdown = useRawMode
      ? exportPRDToMarkdown({
          title,
          content,
          sections: [],
          status: prd.status,
          createdAt: prd.created_at,
          updatedAt: prd.updated_at,
        })
      : exportPRDToMarkdown({
          title,
          content: '',
          sections,
          status: prd.status,
          createdAt: prd.created_at,
          updatedAt: prd.updated_at,
        });

    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title.replace(/[^a-zA-Z0-9]/g, '_')}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Manual save
  const handleManualSave = async () => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    await saveChanges();
  };

  // Generate tasks from PRD requirements
  const handleGenerateTasks = async () => {
    if (!prd || !boardId) return;

    const requirements = extractRequirementsForTasks(sections);
    if (requirements.length === 0) {
      return;
    }

    setIsGenerating(true);
    try {
      await generateTasks.mutateAsync({
        prdId: prd.id,
        boardId,
        requirements,
      });
      setShowGenerateDialog(false);
    } finally {
      setIsGenerating(false);
    }
  };

  const potentialTasks = React.useMemo(
    () => extractRequirementsForTasks(sections),
    [sections]
  );

  if (isLoading || !prd) {
    return (
      <div className="h-full flex items-center justify-center" data-testid="prd-editor-loading">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col" data-testid="prd-editor">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-4">
          {onBack && (
            <Button variant="ghost" size="icon" onClick={onBack}>
              <ArrowLeft className="size-5" />
            </Button>
          )}
          <div className="flex items-center gap-3">
            <PRDStatusBadge
              status={prd.status}
              onStatusChange={handleStatusChange}
            />
            <PRDProgress prdId={prdId} className="hidden sm:flex" />
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              {isSaving ? (
                <>
                  <Loader2 className="size-3 animate-spin" />
                  Saving...
                </>
              ) : hasUnsavedChanges ? (
                'Unsaved changes'
              ) : lastSaved ? (
                <>
                  <Check className="size-3" />
                  Saved
                </>
              ) : null}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Generate Tasks Button */}
          {boardId && (
            <Dialog open={showGenerateDialog} onOpenChange={setShowGenerateDialog}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-1">
                  <ListTodo className="size-4" />
                  Generate Tasks
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Generate Tasks from PRD</DialogTitle>
                  <DialogDescription>
                    Create task stubs from requirements found in your PRD sections.
                  </DialogDescription>
                </DialogHeader>
                <div className="py-4">
                  {potentialTasks.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No requirements found. Add bullet points or numbered lists to your PRD sections.
                    </p>
                  ) : (
                    <div className="space-y-3">
                      <p className="text-sm font-medium">
                        Found {potentialTasks.length} potential task{potentialTasks.length === 1 ? '' : 's'}:
                      </p>
                      <ScrollArea className="h-[200px] border rounded-md p-2">
                        <ul className="space-y-1">
                          {potentialTasks.map((req, i) => (
                            <li key={i} className="text-sm flex items-start gap-2">
                              <span className="text-muted-foreground">{i + 1}.</span>
                              <span className="truncate">{req.title}</span>
                            </li>
                          ))}
                        </ul>
                      </ScrollArea>
                    </div>
                  )}
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowGenerateDialog(false)}>
                    Cancel
                  </Button>
                  <Button
                    onClick={handleGenerateTasks}
                    disabled={potentialTasks.length === 0 || isGenerating}
                    className="gap-1"
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="size-4 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <ListTodo className="size-4" />
                        Create {potentialTasks.length} Task{potentialTasks.length === 1 ? '' : 's'}
                      </>
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}

          <PRDVersionHistory prdId={prdId} />

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                onClick={handleManualSave}
                disabled={isSaving || !hasUnsavedChanges}
                className="gap-1"
              >
                <Save className="size-4" />
                Save
              </Button>
            </TooltipTrigger>
            <TooltipContent>Save changes (auto-saves after {DEBOUNCE_DELAY / 1000}s)</TooltipContent>
          </Tooltip>

          <Button variant="outline" size="sm" onClick={handleExport} className="gap-1">
            <Download className="size-4" />
            Export
          </Button>
        </div>
      </div>

      {/* View Mode Tabs */}
      <div className="flex items-center gap-1 p-2 border-b bg-muted/30">
        <Button
          variant={viewMode === 'editor' ? 'secondary' : 'ghost'}
          size="sm"
          onClick={() => setViewMode('editor')}
          className="gap-1"
        >
          <LayoutList className="size-4" />
          Editor
        </Button>
        <Button
          variant={viewMode === 'tasks' ? 'secondary' : 'ghost'}
          size="sm"
          onClick={() => setViewMode('tasks')}
          className="gap-1"
          data-testid="linked-tasks-tab"
        >
          <ListTodo className="size-4" />
          Linked Tasks
        </Button>
        <Button
          variant={viewMode === 'traceability' ? 'secondary' : 'ghost'}
          size="sm"
          onClick={() => setViewMode('traceability')}
          className="gap-1"
        >
          <GitBranch className="size-4" />
          Traceability
        </Button>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1">
        {viewMode === 'editor' && (
          <div className="max-w-3xl mx-auto p-6 space-y-6">
            {/* Title */}
            <div>
              <Input
                value={title}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="PRD Title"
                className="text-2xl font-bold border-none px-0 h-auto focus-visible:ring-0 focus-visible:ring-offset-0"
                aria-label="Title"
              />
            </div>

            <Separator />

            {/* Mode Toggle */}
            <div className="flex items-center gap-4 py-2">
              <Button
                variant={useRawMode ? 'outline' : 'default'}
                size="sm"
                onClick={() => setUseRawMode(false)}
              >
                Sections
              </Button>
              <Button
                variant={useRawMode ? 'default' : 'outline'}
                size="sm"
                onClick={() => setUseRawMode(true)}
              >
                Raw Markdown
              </Button>
            </div>

            {/* Sections Mode */}
            {!useRawMode ? (
              <div className="space-y-8">
                {sections.map((section) => (
                  <div key={section.id} className="space-y-2" data-testid={`section-${section.id}`}>
                    <h3 className="text-lg font-semibold">{section.title}</h3>
                    <Textarea
                      value={section.content}
                      onChange={(e) => handleSectionChange(section.id, e.target.value)}
                      placeholder={section.placeholder}
                      className="min-h-[120px] resize-y"
                      aria-label={section.title}
                    />
                  </div>
                ))}
              </div>
            ) : (
              /* Raw Markdown Mode */
              <div className="space-y-2" data-testid="raw-content">
                <Textarea
                  value={content}
                  onChange={(e) => handleContentChange(e.target.value)}
                  placeholder="Write your PRD content in Markdown..."
                  className="min-h-[500px] resize-y font-mono text-sm"
                  role="textbox"
                  aria-label="Content"
                />
              </div>
            )}
          </div>
        )}

        {viewMode === 'tasks' && (
          <div className="max-w-3xl mx-auto p-6">
            <PRDLinkedTasks prdId={prdId} onTaskClick={onTaskClick} />
          </div>
        )}

        {viewMode === 'traceability' && (
          <div className="max-w-4xl mx-auto p-6">
            <PRDTraceability prdId={prdId} sections={sections} onTaskClick={onTaskClick} />
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
