'use client';

import * as React from 'react';
import { FileText, FileCheck, PlayCircle, CheckCircle2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { PRDStatus } from '@/types/database';

interface PRDStatusBadgeProps {
  status: PRDStatus;
  onStatusChange?: (status: PRDStatus) => void;
  interactive?: boolean;
}

const statusConfig: Record<PRDStatus, { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive'; icon: React.ElementType }> = {
  draft: { label: 'Draft', variant: 'secondary', icon: FileText },
  approved: { label: 'Approved', variant: 'default', icon: FileCheck },
  in_progress: { label: 'In Progress', variant: 'outline', icon: PlayCircle },
  completed: { label: 'Completed', variant: 'default', icon: CheckCircle2 },
};

const statusFlow: Record<PRDStatus, PRDStatus[]> = {
  draft: ['approved'],
  approved: ['in_progress', 'draft'],
  in_progress: ['completed', 'approved'],
  completed: ['in_progress'],
};

const statusActions: Record<PRDStatus, Partial<Record<PRDStatus, string>>> = {
  draft: { approved: 'Approve' },
  approved: { in_progress: 'Start Work', draft: 'Return to Draft' },
  in_progress: { completed: 'Mark Complete', approved: 'Back to Approved' },
  completed: { in_progress: 'Reopen' },
};

export function PRDStatusBadge({ status, onStatusChange, interactive = true }: PRDStatusBadgeProps) {
  const config = statusConfig[status];
  const StatusIcon = config.icon;
  const nextStatuses = statusFlow[status];

  if (!interactive || !onStatusChange) {
    return (
      <Badge variant={config.variant} className="gap-1">
        <StatusIcon className="size-3" />
        {config.label}
      </Badge>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Badge
          variant={config.variant}
          className="gap-1 cursor-pointer hover:opacity-80 transition-opacity"
          data-testid="prd-status-badge"
        >
          <StatusIcon className="size-3" />
          {config.label}
        </Badge>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        {nextStatuses.map((nextStatus) => {
          const nextConfig = statusConfig[nextStatus];
          const NextIcon = nextConfig.icon;
          const actionLabel = statusActions[status][nextStatus];

          return (
            <DropdownMenuItem
              key={nextStatus}
              onClick={() => onStatusChange(nextStatus)}
              data-testid={`status-option-${nextStatus}`}
            >
              <NextIcon className="size-4 mr-2" />
              {actionLabel || nextConfig.label}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
