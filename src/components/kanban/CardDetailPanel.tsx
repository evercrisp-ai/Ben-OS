"use client";

import * as React from "react";
import {
  X,
  Calendar as CalendarIcon,
  User,
  Tag,
  AlertCircle,
  ArrowUp,
  ArrowDown,
  Minus,
  CheckCircle2,
  Clock,
  Trash2,
  Save,
  Target,
  FileText,
  Bot,
  Brain,
  History,
  ChevronDown,
  ChevronUp,
  Loader2,
} from "lucide-react";
import { format } from "date-fns";
import { SubtaskList } from "@/components/subtasks";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { useBoardStore, type CardData } from "@/stores/board-store";
import type { TaskPriority, TaskStatus, Milestone, PRD, Agent, Json } from "@/types/database";
import { useActiveAgents } from "@/hooks/use-agents";
import {
  useTaskActivityLogs,
  formatActivityAction,
  formatActivityChanges,
} from "@/hooks/use-activity-logs";

const priorityConfig: Record<TaskPriority, { icon: React.ComponentType<{ className?: string }>; color: string; label: string }> = {
  critical: { icon: AlertCircle, color: "text-red-500", label: "Critical" },
  high: { icon: ArrowUp, color: "text-orange-500", label: "High" },
  medium: { icon: Minus, color: "text-yellow-500", label: "Medium" },
  low: { icon: ArrowDown, color: "text-blue-500", label: "Low" },
};

const statusLabels: Record<TaskStatus, string> = {
  backlog: "Backlog",
  todo: "To Do",
  in_progress: "In Progress",
  review: "Review",
  done: "Done",
};

const storyPointOptions = [1, 2, 3, 5, 8, 13, 21];

interface CardDetailPanelProps {
  onUpdate: (cardId: string, updates: Partial<CardData>) => void;
  onDelete: (cardId: string) => void;
  milestones?: Milestone[];
  prds?: PRD[];
  onLinkToPRD?: (cardId: string, prdId: string | null) => void;
}

// AI Context Section Component
function AIContextSection({
  aiContext,
  onUpdate,
}: {
  aiContext: Json;
  onUpdate: (context: Json) => void;
}) {
  const [isEditing, setIsEditing] = React.useState(false);
  const [editValue, setEditValue] = React.useState("");
  const [isExpanded, setIsExpanded] = React.useState(false);

  const contextStr = React.useMemo(() => {
    if (!aiContext || (typeof aiContext === 'object' && Object.keys(aiContext as object).length === 0)) {
      return "";
    }
    return typeof aiContext === "string" ? aiContext : JSON.stringify(aiContext, null, 2);
  }, [aiContext]);

  const handleStartEdit = () => {
    setEditValue(contextStr);
    setIsEditing(true);
  };

  const handleSave = () => {
    try {
      // Try to parse as JSON, otherwise save as string
      const parsed = editValue.trim() ? JSON.parse(editValue) : {};
      onUpdate(parsed);
    } catch {
      // If not valid JSON, save as a simple object with notes
      onUpdate({ notes: editValue });
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditValue("");
    setIsEditing(false);
  };

  return (
    <div className="space-y-2" data-testid="ai-context-section">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-2 text-sm font-medium hover:text-primary transition-colors"
        >
          <Brain className="size-4 text-muted-foreground" />
          <span>AI Context</span>
          {isExpanded ? (
            <ChevronUp className="size-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="size-4 text-muted-foreground" />
          )}
        </button>
        {!isEditing && isExpanded && (
          <Button variant="ghost" size="sm" onClick={handleStartEdit}>
            Edit
          </Button>
        )}
      </div>

      {isExpanded && (
        <div className="rounded-md border bg-muted/50 p-3">
          {isEditing ? (
            <div className="space-y-2">
              <Textarea
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                placeholder="Add AI-relevant context as JSON or plain text..."
                rows={6}
                className="font-mono text-xs"
              />
              <div className="flex justify-end gap-2">
                <Button variant="outline" size="sm" onClick={handleCancel}>
                  Cancel
                </Button>
                <Button size="sm" onClick={handleSave}>
                  Save Context
                </Button>
              </div>
            </div>
          ) : contextStr ? (
            <pre className="text-xs font-mono whitespace-pre-wrap overflow-x-auto max-h-48 overflow-y-auto">
              {contextStr}
            </pre>
          ) : (
            <p className="text-xs text-muted-foreground italic">
              No AI context set. Click Edit to add context that will help AI agents understand this task.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// Activity Feed Section Component
function ActivityFeedSection({ taskId }: { taskId: string }) {
  const { data: activities = [], isLoading } = useTaskActivityLogs(taskId, 10);
  const [isExpanded, setIsExpanded] = React.useState(false);

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
        <Loader2 className="size-4 animate-spin" />
        <span>Loading activity...</span>
      </div>
    );
  }

  return (
    <div className="space-y-2" data-testid="activity-feed-section">
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-2 text-sm font-medium hover:text-primary transition-colors w-full justify-between"
      >
        <div className="flex items-center gap-2">
          <History className="size-4 text-muted-foreground" />
          <span>Activity</span>
          {activities.length > 0 && (
            <Badge variant="secondary" className="text-xs">
              {activities.length}
            </Badge>
          )}
        </div>
        {isExpanded ? (
          <ChevronUp className="size-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="size-4 text-muted-foreground" />
        )}
      </button>

      {isExpanded && (
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {activities.length === 0 ? (
            <p className="text-xs text-muted-foreground italic py-2">
              No activity recorded yet.
            </p>
          ) : (
            activities.map((activity) => (
              <div
                key={activity.id}
                className="flex items-start gap-2 p-2 rounded-md bg-muted/50 text-xs"
                data-testid={`activity-${activity.id}`}
              >
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-medium capitalize">
                      {formatActivityAction(activity.action)}
                    </span>
                    <span className="text-muted-foreground">
                      {format(new Date(activity.created_at), "MMM d, h:mm a")}
                    </span>
                  </div>
                  {activity.payload && typeof activity.payload === 'object' && Object.keys(activity.payload as object).length > 0 && (
                    <div className="text-muted-foreground">
                      {formatActivityChanges(activity.payload as Record<string, unknown>).map((change, i) => (
                        <div key={i}>{change}</div>
                      ))}
                    </div>
                  )}
                  {activity.agent_id && (
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Bot className="size-3" />
                      <span>by agent</span>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

// Agent Assignment Section
function AgentAssignmentSection({
  assignedAgentId,
  onAssign,
  agents,
  isLoading,
}: {
  assignedAgentId: string | null;
  onAssign: (agentId: string | null) => void;
  agents: Agent[];
  isLoading: boolean;
}) {
  const currentAgent = agents.find((a) => a.id === assignedAgentId);

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Bot className="size-4" />
        <span>Assign to Agent</span>
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="gap-1"
            disabled={isLoading}
            aria-label="Assign to"
          >
            {isLoading ? (
              <Loader2 className="size-4 animate-spin" />
            ) : currentAgent ? (
              <>
                <Bot className="size-4 text-primary" />
                {currentAgent.name}
              </>
            ) : (
              "Unassigned"
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem onClick={() => onAssign(null)}>
            <User className="size-4 mr-2 text-muted-foreground" />
            Unassigned
          </DropdownMenuItem>
          {agents.map((agent) => (
            <DropdownMenuItem
              key={agent.id}
              onClick={() => onAssign(agent.id)}
            >
              <Bot
                className={cn(
                  "size-4 mr-2",
                  agent.type === "primary" ? "text-primary" : "text-blue-500"
                )}
              />
              <span className="flex-1">{agent.name}</span>
              <Badge variant="outline" className="text-xs ml-2">
                {agent.type}
              </Badge>
            </DropdownMenuItem>
          ))}
          {agents.length === 0 && !isLoading && (
            <div className="px-2 py-4 text-center text-xs text-muted-foreground">
              No agents available
            </div>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

// Due Date Calendar Picker
function DueDatePicker({
  dueDate,
  onChange,
}: {
  dueDate: string | null;
  onChange: (date: string | null) => void;
}) {
  const [open, setOpen] = React.useState(false);
  const selectedDate = dueDate ? new Date(dueDate) : undefined;

  const handleSelect = (date: Date | undefined) => {
    if (date) {
      // Format as YYYY-MM-DD for storage
      const formattedDate = format(date, "yyyy-MM-dd");
      onChange(formattedDate);
    } else {
      onChange(null);
    }
    setOpen(false);
  };

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <CalendarIcon className="size-4" />
        <span>Due Date</span>
      </div>
      <div className="flex items-center gap-2">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className={cn(
                "gap-1 justify-start text-left font-normal",
                !dueDate && "text-muted-foreground"
              )}
              aria-label="Due date"
            >
              <CalendarIcon className="size-4" />
              {dueDate ? format(new Date(dueDate), "MMM d, yyyy") : "Set date"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="end">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={handleSelect}
              initialFocus
            />
          </PopoverContent>
        </Popover>
        {dueDate && (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={() => onChange(null)}
            aria-label="Clear due date"
          >
            <X className="size-4" />
          </Button>
        )}
      </div>
    </div>
  );
}

// Story Points Selector with visual indicator
function StoryPointsSelector({
  points,
  onChange,
}: {
  points: number | null;
  onChange: (points: number | null) => void;
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Tag className="size-4" />
        <span>Story Points</span>
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" aria-label="Story points">
            {points ? `${points} points` : "Set points"}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => onChange(null)}>
            No estimate
          </DropdownMenuItem>
          {storyPointOptions.map((point) => (
            <DropdownMenuItem
              key={point}
              onClick={() => onChange(point)}
              className="justify-between"
            >
              <span>{point} points</span>
              <div
                className="h-2 bg-primary rounded-full ml-2"
                style={{ width: `${Math.min(point * 4, 84)}px` }}
              />
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

export function CardDetailPanel({ onUpdate, onDelete, milestones = [], prds = [], onLinkToPRD }: CardDetailPanelProps) {
  const { selectedCardId, selectCard, getCardById, columns } = useBoardStore();
  const card = selectedCardId ? getCardById(selectedCardId) : null;

  // Fetch agents
  const { data: agents = [], isLoading: agentsLoading } = useActiveAgents();

  const [title, setTitle] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [isDirty, setIsDirty] = React.useState(false);

  // Sync local state with selected card
  React.useEffect(() => {
    if (card) {
      setTitle(card.title);
      setDescription(card.description || "");
      setIsDirty(false);
    }
  }, [card]);

  const handleClose = () => {
    if (isDirty && card) {
      // Save changes before closing
      onUpdate(card.id, { title, description });
    }
    selectCard(null);
  };

  const handleSave = () => {
    if (card && isDirty) {
      onUpdate(card.id, { title, description });
      setIsDirty(false);
    }
  };

  const handleDelete = () => {
    if (card) {
      onDelete(card.id);
      selectCard(null);
    }
  };

  const handlePriorityChange = (priority: TaskPriority) => {
    if (card) {
      onUpdate(card.id, { priority });
    }
  };

  const handleStatusChange = (columnId: string) => {
    if (card) {
      const column = columns.find((c) => c.id === columnId);
      if (column) {
        onUpdate(card.id, { 
          column_id: columnId,
          status: columnId as TaskStatus,
        });
      }
    }
  };

  const handleStoryPointsChange = (points: number | null) => {
    if (card) {
      onUpdate(card.id, { story_points: points });
    }
  };

  const handleDueDateChange = (date: string | null) => {
    if (card) {
      onUpdate(card.id, { due_date: date });
    }
  };

  const handleMilestoneChange = (milestoneId: string | null) => {
    if (card) {
      onUpdate(card.id, { milestone_id: milestoneId });
    }
  };

  const handlePRDChange = (prdId: string | null) => {
    if (card && onLinkToPRD) {
      onLinkToPRD(card.id, prdId);
    }
  };

  const handleAgentAssignment = (agentId: string | null) => {
    if (card) {
      onUpdate(card.id, { assigned_agent_id: agentId });
    }
  };

  const handleAIContextUpdate = (aiContext: Json) => {
    if (card) {
      onUpdate(card.id, { ai_context: aiContext });
    }
  };

  const currentMilestone = milestones.find((m) => m.id === card?.milestone_id);
  const currentPRD = prds.find((p) => p.id === card?.prd_id);

  if (!card) return null;

  const priorityInfo = priorityConfig[card.priority];
  const PriorityIcon = priorityInfo.icon;
  const currentColumn = columns.find((c) => c.id === card.column_id);

  return (
    <Sheet open={!!selectedCardId} onOpenChange={(open) => !open && handleClose()}>
      <SheetContent 
        className="sm:max-w-lg w-full overflow-y-auto slide-in"
        data-testid="task-detail-panel"
      >
        <SheetHeader>
          <SheetTitle className="sr-only">Edit Task</SheetTitle>
          <SheetDescription className="sr-only">
            Edit task details and properties
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6 py-4">
          {/* Title */}
          <div>
            <label htmlFor="task-title" className="text-sm font-medium text-muted-foreground">
              Title
            </label>
            <input
              id="task-title"
              type="text"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                setIsDirty(true);
              }}
              className={cn(
                "w-full mt-1 px-3 py-2 text-lg font-semibold rounded-md border",
                "bg-background focus:outline-none focus:ring-2 focus:ring-primary"
              )}
              aria-label="Title"
            />
          </div>

          {/* Description */}
          <div>
            <label htmlFor="task-description" className="text-sm font-medium text-muted-foreground">
              Description
            </label>
            <textarea
              id="task-description"
              value={description}
              onChange={(e) => {
                setDescription(e.target.value);
                setIsDirty(true);
              }}
              placeholder="Add a description..."
              rows={4}
              className={cn(
                "w-full mt-1 px-3 py-2 text-sm rounded-md border resize-none",
                "bg-background focus:outline-none focus:ring-2 focus:ring-primary"
              )}
              aria-label="Description"
            />
          </div>

          <Separator />

          {/* Properties */}
          <div className="space-y-4">
            {/* Status */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <CheckCircle2 className="size-4" />
                <span>Status</span>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    {currentColumn?.name || statusLabels[card.status]}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {columns.map((col) => (
                    <DropdownMenuItem
                      key={col.id}
                      onClick={() => handleStatusChange(col.id)}
                    >
                      {col.name}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Priority */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <AlertCircle className="size-4" />
                <span>Priority</span>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-1">
                    <PriorityIcon className={cn("size-4", priorityInfo.color)} />
                    {priorityInfo.label}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {(Object.entries(priorityConfig) as [TaskPriority, typeof priorityInfo][]).map(
                    ([value, config]) => {
                      const Icon = config.icon;
                      return (
                        <DropdownMenuItem
                          key={value}
                          onClick={() => handlePriorityChange(value)}
                        >
                          <Icon className={cn("size-4 mr-2", config.color)} />
                          {config.label}
                        </DropdownMenuItem>
                      );
                    }
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Story Points */}
            <StoryPointsSelector
              points={card.story_points}
              onChange={handleStoryPointsChange}
            />

            {/* Due Date with Calendar */}
            <DueDatePicker
              dueDate={card.due_date}
              onChange={handleDueDateChange}
            />

            {/* Agent Assignment */}
            <AgentAssignmentSection
              assignedAgentId={card.assigned_agent_id}
              onAssign={handleAgentAssignment}
              agents={agents}
              isLoading={agentsLoading}
            />

            {/* Milestone */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Target className="size-4" />
                <span>Milestone</span>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" aria-label="Milestone">
                    {currentMilestone?.title || "No milestone"}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={() => handleMilestoneChange(null)}>
                    No milestone
                  </DropdownMenuItem>
                  {milestones.map((milestone) => (
                    <DropdownMenuItem
                      key={milestone.id}
                      onClick={() => handleMilestoneChange(milestone.id)}
                    >
                      <Target className="size-4 mr-2 text-primary" />
                      {milestone.title}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* PRD Link */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <FileText className="size-4" />
                <span>Link to PRD</span>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" aria-label="Link to PRD">
                    {currentPRD?.title || "No PRD linked"}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuItem onClick={() => handlePRDChange(null)}>
                    No PRD linked
                  </DropdownMenuItem>
                  {prds.map((prd) => (
                    <DropdownMenuItem
                      key={prd.id}
                      onClick={() => handlePRDChange(prd.id)}
                    >
                      <FileText className="size-4 mr-2 text-primary" />
                      <span className="truncate">{prd.title}</span>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          <Separator />

          {/* Subtasks Section */}
          <SubtaskList taskId={card.id} />

          <Separator />

          {/* AI Context Section */}
          <AIContextSection
            aiContext={card.ai_context}
            onUpdate={handleAIContextUpdate}
          />

          <Separator />

          {/* Activity Feed */}
          <ActivityFeedSection taskId={card.id} />

          <Separator />

          {/* Metadata */}
          <div className="space-y-2 text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <Clock className="size-3" />
              <span>
                Created {format(new Date(card.created_at), "MMM d, yyyy 'at' h:mm a")}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="size-3" />
              <span>
                Updated {format(new Date(card.updated_at), "MMM d, yyyy 'at' h:mm a")}
              </span>
            </div>
          </div>
        </div>

        <SheetFooter className="flex-row justify-between gap-2 pt-4 border-t">
          <Button
            variant="destructive"
            size="sm"
            onClick={handleDelete}
            className="gap-1"
          >
            <Trash2 className="size-4" />
            Delete
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleClose}>
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleSave}
              disabled={!isDirty}
              className="gap-1"
            >
              <Save className="size-4" />
              Save
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

// Also export as TaskDetailPanel for test compatibility
export { CardDetailPanel as TaskDetailPanel };
