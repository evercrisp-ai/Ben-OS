'use client';

import * as React from 'react';
import { CheckCircle2, Circle, AlertCircle, LinkIcon, Unlink } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { usePRDTasks } from '@/hooks/use-tasks';
import type { PRDSection, Task, TaskStatus } from '@/types/database';

interface PRDTraceabilityProps {
  prdId: string;
  sections: PRDSection[];
  onTaskClick?: (task: Task) => void;
}

interface RequirementMatch {
  requirement: string;
  sectionId: string;
  sectionTitle: string;
  linkedTasks: Task[];
}

const statusIcon: Record<TaskStatus, { icon: React.ComponentType<{ className?: string }>; color: string }> = {
  backlog: { icon: Circle, color: 'text-muted-foreground' },
  todo: { icon: Circle, color: 'text-blue-500' },
  in_progress: { icon: Circle, color: 'text-yellow-500' },
  review: { icon: Circle, color: 'text-orange-500' },
  done: { icon: CheckCircle2, color: 'text-green-500' },
};

/**
 * Extract requirements from PRD sections
 * Looks for bullet points or numbered lists in the Requirements section
 */
function extractRequirements(sections: PRDSection[]): Array<{ id: string; text: string; sectionId: string; sectionTitle: string }> {
  const requirements: Array<{ id: string; text: string; sectionId: string; sectionTitle: string }> = [];
  
  // Focus on Requirements section, but also check other sections
  for (const section of sections) {
    if (!section.content) continue;
    
    // Split content into lines and look for requirements (bullet points, numbered items)
    const lines = section.content.split('\n');
    let reqIndex = 0;
    
    for (const line of lines) {
      const trimmed = line.trim();
      // Match bullet points (-, *, •) or numbered items (1., 1), etc.)
      if (/^[-*•]\s+.+|^\d+[.)]\s+.+/.test(trimmed)) {
        const text = trimmed.replace(/^[-*•]\s+|^\d+[.)]\s+/, '').trim();
        if (text.length > 5) { // Skip very short items
          requirements.push({
            id: `${section.id}-${reqIndex}`,
            text,
            sectionId: section.id,
            sectionTitle: section.title,
          });
          reqIndex++;
        }
      }
    }
  }
  
  return requirements;
}

/**
 * Match tasks to requirements based on title similarity
 */
function matchTasksToRequirements(
  requirements: Array<{ id: string; text: string; sectionId: string; sectionTitle: string }>,
  tasks: Task[]
): RequirementMatch[] {
  return requirements.map((req) => {
    // Find tasks that might be related to this requirement
    // Simple matching: check if task title contains keywords from requirement
    const reqWords = req.text.toLowerCase().split(/\s+/).filter((w) => w.length > 3);
    const linkedTasks = tasks.filter((task) => {
      const titleLower = task.title.toLowerCase();
      const descLower = (task.description || '').toLowerCase();
      // Check if any significant word from requirement appears in task
      return reqWords.some((word) => titleLower.includes(word) || descLower.includes(word));
    });

    return {
      requirement: req.text,
      sectionId: req.sectionId,
      sectionTitle: req.sectionTitle,
      linkedTasks,
    };
  });
}

export function PRDTraceability({ prdId, sections, onTaskClick }: PRDTraceabilityProps) {
  const { data: tasks = [] } = usePRDTasks(prdId);

  // Extract requirements and match tasks
  const requirements = React.useMemo(() => extractRequirements(sections), [sections]);
  const matches = React.useMemo(
    () => matchTasksToRequirements(requirements, tasks),
    [requirements, tasks]
  );

  // Get untracked tasks (linked to PRD but not matched to any requirement)
  const trackedTaskIds = new Set(matches.flatMap((m) => m.linkedTasks.map((t) => t.id)));
  const untrackedTasks = tasks.filter((t) => !trackedTaskIds.has(t.id));

  if (requirements.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground" data-testid="traceability-empty">
        <AlertCircle className="size-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">No requirements found in PRD sections.</p>
        <p className="text-xs mt-1">
          Add bullet points or numbered lists to your Requirements section.
        </p>
      </div>
    );
  }

  return (
    <div data-testid="traceability-matrix">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-sm font-medium">Traceability Matrix</h4>
        <Badge variant="outline" className="text-xs">
          {matches.filter((m) => m.linkedTasks.length > 0).length}/{requirements.length} covered
        </Badge>
      </div>

      <ScrollArea className="h-[400px]">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[40%]">Requirement</TableHead>
              <TableHead className="w-[20%]">Section</TableHead>
              <TableHead className="w-[30%]">Linked Tasks</TableHead>
              <TableHead className="w-[10%] text-center">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {matches.map((match, index) => {
              const allDone = match.linkedTasks.length > 0 && 
                match.linkedTasks.every((t) => t.status === 'done');
              const hasProgress = match.linkedTasks.some(
                (t) => t.status === 'in_progress' || t.status === 'review'
              );

              return (
                <TableRow key={index} data-testid={`trace-row-${index}`}>
                  <TableCell className="text-sm align-top">
                    <span className="line-clamp-2">{match.requirement}</span>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground align-top">
                    {match.sectionTitle}
                  </TableCell>
                  <TableCell className="align-top">
                    {match.linkedTasks.length > 0 ? (
                      <div className="space-y-1">
                        {match.linkedTasks.map((task) => {
                          const config = statusIcon[task.status];
                          const StatusIcon = config.icon;
                          return (
                            <div
                              key={task.id}
                              className={cn(
                                'flex items-center gap-2 text-xs p-1 rounded',
                                'hover:bg-muted cursor-pointer'
                              )}
                              onClick={() => onTaskClick?.(task)}
                            >
                              <StatusIcon className={cn('size-3', config.color)} />
                              <span className="truncate">{task.title}</span>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Unlink className="size-3" />
                        <span>No linked tasks</span>
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="text-center align-top">
                    {match.linkedTasks.length === 0 ? (
                      <Badge variant="outline" className="text-xs">
                        Pending
                      </Badge>
                    ) : allDone ? (
                      <Badge variant="default" className="text-xs bg-green-500">
                        Done
                      </Badge>
                    ) : hasProgress ? (
                      <Badge variant="secondary" className="text-xs">
                        In Progress
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-xs">
                        To Do
                      </Badge>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>

        {/* Untracked Tasks Section */}
        {untrackedTasks.length > 0 && (
          <div className="mt-6 pt-4 border-t">
            <h5 className="text-sm font-medium mb-3 flex items-center gap-2">
              <LinkIcon className="size-4" />
              Other Linked Tasks ({untrackedTasks.length})
            </h5>
            <div className="space-y-2">
              {untrackedTasks.map((task) => {
                const config = statusIcon[task.status];
                const StatusIcon = config.icon;
                return (
                  <div
                    key={task.id}
                    className={cn(
                      'flex items-center gap-2 p-2 rounded border',
                      'hover:bg-muted cursor-pointer'
                    )}
                    onClick={() => onTaskClick?.(task)}
                  >
                    <StatusIcon className={cn('size-4', config.color)} />
                    <span className="text-sm flex-1">{task.title}</span>
                    <Badge variant="outline" className="text-xs">
                      Unmatched
                    </Badge>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
