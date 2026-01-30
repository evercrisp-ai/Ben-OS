"use client";

import * as React from "react";
import { 
  Search, 
  Filter, 
  X, 
  Plus,
  AlertCircle,
  ArrowUp,
  ArrowDown,
  Minus,
  User,
  Target
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { useBoardStore } from "@/stores/board-store";
import type { TaskPriority, Milestone } from "@/types/database";
import type { Agent, Board } from "@/types/database";

const priorityOptions: { value: TaskPriority; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { value: "critical", label: "Critical", icon: AlertCircle },
  { value: "high", label: "High", icon: ArrowUp },
  { value: "medium", label: "Medium", icon: Minus },
  { value: "low", label: "Low", icon: ArrowDown },
];

interface BoardHeaderProps {
  board: Board;
  agents?: Agent[];
  milestones?: Milestone[];
  onAddColumn: () => void;
}

export function BoardHeader({ board, agents = [], milestones = [], onAddColumn }: BoardHeaderProps) {
  const { filters, setFilters, clearFilters } = useBoardStore();
  const [searchValue, setSearchValue] = React.useState(filters.search);
  const searchInputRef = React.useRef<HTMLInputElement>(null);

  // Debounce search
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setFilters({ search: searchValue });
    }, 300);
    return () => clearTimeout(timer);
  }, [searchValue, setFilters]);

  const hasActiveFilters = 
    filters.priority.length > 0 || 
    filters.assignee.length > 0 || 
    filters.milestone.length > 0 ||
    filters.search.length > 0;

  const activeFilterCount = 
    filters.priority.length + 
    filters.assignee.length + 
    filters.milestone.length +
    (filters.search ? 1 : 0);

  const handlePriorityToggle = (priority: TaskPriority) => {
    const current = filters.priority;
    const updated = current.includes(priority)
      ? current.filter((p) => p !== priority)
      : [...current, priority];
    setFilters({ priority: updated });
  };

  const handleAssigneeToggle = (agentId: string) => {
    const current = filters.assignee;
    const updated = current.includes(agentId)
      ? current.filter((a) => a !== agentId)
      : [...current, agentId];
    setFilters({ assignee: updated });
  };

  const handleMilestoneToggle = (milestoneId: string) => {
    const current = filters.milestone;
    const updated = current.includes(milestoneId)
      ? current.filter((m) => m !== milestoneId)
      : [...current, milestoneId];
    setFilters({ milestone: updated });
  };

  const handleClearFilters = () => {
    clearFilters();
    setSearchValue("");
  };

  return (
    <div 
      className="flex items-center justify-between gap-4 p-4 border-b"
      data-testid="board-header"
    >
      {/* Board Title */}
      <div className="flex items-center gap-3">
        <h1 className="text-xl font-bold">{board.name}</h1>
      </div>

      {/* Search and Filters */}
      <div className="flex items-center gap-2">
        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <input
            ref={searchInputRef}
            type="text"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            placeholder="Search cards"
            className={cn(
              "h-9 w-[200px] pl-8 pr-8 text-sm rounded-md border",
              "bg-background focus:outline-none focus:ring-2 focus:ring-primary"
            )}
          />
          {searchValue && (
            <button
              onClick={() => setSearchValue("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="size-4" />
            </button>
          )}
        </div>

        {/* Priority Filter */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="outline" 
              size="sm" 
              className="gap-1"
              data-testid="filter-priority"
            >
              <Filter className="size-4" />
              Priority
              {filters.priority.length > 0 && (
                <Badge variant="secondary" className="h-4 px-1 text-xs ml-1">
                  {filters.priority.length}
                </Badge>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40">
            <DropdownMenuLabel>Filter by priority</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {priorityOptions.map((option) => {
              const Icon = option.icon;
              return (
                <DropdownMenuCheckboxItem
                  key={option.value}
                  checked={filters.priority.includes(option.value)}
                  onCheckedChange={() => handlePriorityToggle(option.value)}
                >
                  <Icon className="size-4 mr-2" />
                  {option.label}
                </DropdownMenuCheckboxItem>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Assignee Filter */}
        {agents.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="outline" 
                size="sm" 
                className="gap-1"
                data-testid="filter-assignee"
              >
                <User className="size-4" />
                Assignee
                {filters.assignee.length > 0 && (
                  <Badge variant="secondary" className="h-4 px-1 text-xs ml-1">
                    {filters.assignee.length}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel>Filter by assignee</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {agents.map((agent) => (
                <DropdownMenuCheckboxItem
                  key={agent.id}
                  checked={filters.assignee.includes(agent.id)}
                  onCheckedChange={() => handleAssigneeToggle(agent.id)}
                >
                  {agent.name}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        {/* Milestone Filter */}
        {milestones.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="outline" 
                size="sm" 
                className="gap-1"
                data-testid="filter-milestone"
              >
                <Target className="size-4" />
                Milestone
                {filters.milestone.length > 0 && (
                  <Badge variant="secondary" className="h-4 px-1 text-xs ml-1">
                    {filters.milestone.length}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel>Filter by milestone</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {milestones.map((milestone) => (
                <DropdownMenuCheckboxItem
                  key={milestone.id}
                  checked={filters.milestone.includes(milestone.id)}
                  onCheckedChange={() => handleMilestoneToggle(milestone.id)}
                >
                  {milestone.title}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        {/* Clear Filters */}
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearFilters}
            className="gap-1 text-muted-foreground"
          >
            <X className="size-4" />
            Clear ({activeFilterCount})
          </Button>
        )}

        {/* Add Column */}
        <Button size="sm" onClick={onAddColumn} className="gap-1">
          <Plus className="size-4" />
          Add column
        </Button>
      </div>
    </div>
  );
}
