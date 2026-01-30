'use client';

/**
 * ActivityViewer Component
 * Section 4.4.6 - Activity Viewer UI
 *
 * Displays activity logs for a specific entity or recent activity.
 * Used in task detail panels and dashboard.
 */

import { formatDistanceToNow } from 'date-fns';
import { Activity, Bot, User, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import {
  useEntityActivityLogs,
  useRecentActivityLogs,
  formatActivityAction,
  formatActivityChanges,
} from '@/hooks/use-activity-logs';
import type { EntityType } from '@/lib/activity-logger';
import type { ActivityLog } from '@/types/database';

interface ActivityViewerProps {
  /** Entity type to filter by */
  entityType?: EntityType;
  /** Entity ID to filter by */
  entityId?: string;
  /** Title for the activity viewer */
  title?: string;
  /** Maximum number of items to display initially */
  limit?: number;
  /** Whether to show in compact mode */
  compact?: boolean;
  /** Whether to show the entity type badge */
  showEntityType?: boolean;
  /** Custom class name */
  className?: string;
}

/**
 * Get the action color based on action type
 */
function getActionColor(action: string): string {
  switch (action) {
    case 'create':
      return 'bg-green-500/10 text-green-700 dark:text-green-400';
    case 'update':
      return 'bg-blue-500/10 text-blue-700 dark:text-blue-400';
    case 'delete':
      return 'bg-red-500/10 text-red-700 dark:text-red-400';
    case 'status_change':
      return 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400';
    case 'assign':
    case 'unassign':
      return 'bg-purple-500/10 text-purple-700 dark:text-purple-400';
    default:
      return 'bg-gray-500/10 text-gray-700 dark:text-gray-400';
  }
}

/**
 * Format the entity type for display
 */
function formatEntityType(entityType: string): string {
  // Convert plural to singular for display
  const singular = entityType.endsWith('s') ? entityType.slice(0, -1) : entityType;
  return singular.charAt(0).toUpperCase() + singular.slice(1);
}

/**
 * Single activity item component
 */
function ActivityItem({
  activity,
  showEntityType,
  compact,
}: {
  activity: ActivityLog & { agents?: { name: string } | null };
  showEntityType?: boolean;
  compact?: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const payload = activity.payload as Record<string, unknown>;
  const changes = formatActivityChanges(payload);
  const hasChanges = changes.length > 0;

  const agentName = activity.agents?.name;
  const actorIcon = activity.user_initiated ? (
    <User className="h-4 w-4 text-muted-foreground" />
  ) : (
    <Bot className="h-4 w-4 text-primary" />
  );
  const actorLabel = activity.user_initiated
    ? 'User'
    : agentName || 'Agent';

  return (
    <div
      className={`border-b border-border/50 py-3 last:border-b-0 ${compact ? 'py-2' : ''}`}
      data-testid="activity-item"
    >
      <div className="flex items-start gap-3">
        {/* Actor icon */}
        <div className="mt-0.5 flex-shrink-0">{actorIcon}</div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium text-sm">{actorLabel}</span>
            <Badge variant="outline" className={getActionColor(activity.action)}>
              {formatActivityAction(activity.action)}
            </Badge>
            {showEntityType && (
              <Badge variant="secondary" className="text-xs">
                {formatEntityType(activity.entity_type)}
              </Badge>
            )}
          </div>

          {/* Title from payload if available */}
          {(() => {
            const data = payload.data as Record<string, unknown> | undefined;
            if (data?.title) {
              return (
                <p className="text-sm text-muted-foreground mt-1 truncate">
                  &quot;{String(data.title)}&quot;
                </p>
              );
            }
            return null;
          })()}

          {/* Changes preview */}
          {hasChanges && !expanded && !compact && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2 mt-1 text-xs text-muted-foreground"
              onClick={() => setExpanded(true)}
            >
              <ChevronDown className="h-3 w-3 mr-1" />
              Show {changes.length} change{changes.length > 1 ? 's' : ''}
            </Button>
          )}

          {/* Expanded changes */}
          {hasChanges && expanded && !compact && (
            <div className="mt-2 space-y-1">
              {changes.map((change, idx) => (
                <div
                  key={idx}
                  className="text-xs text-muted-foreground bg-muted/50 rounded px-2 py-1"
                >
                  {change}
                </div>
              ))}
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-xs text-muted-foreground"
                onClick={() => setExpanded(false)}
              >
                <ChevronUp className="h-3 w-3 mr-1" />
                Hide changes
              </Button>
            </div>
          )}

          {/* Timestamp */}
          <p className="text-xs text-muted-foreground mt-1">
            {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
          </p>
        </div>
      </div>
    </div>
  );
}

/**
 * Loading skeleton for activity items
 */
function ActivitySkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-start gap-3 py-3">
          <Skeleton className="h-4 w-4 rounded-full" />
          <div className="flex-1 space-y-2">
            <div className="flex gap-2">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-20" />
            </div>
            <Skeleton className="h-3 w-24" />
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * ActivityViewer component for displaying activity logs
 */
export function ActivityViewer({
  entityType,
  entityId,
  title = 'Activity',
  limit = 20,
  compact = false,
  showEntityType = true,
  className = '',
}: ActivityViewerProps) {
  // Use appropriate hook based on whether we have entity filter
  const entityQuery = useEntityActivityLogs(
    entityType || 'tasks',
    entityId || '',
    limit
  );

  const recentQuery = useRecentActivityLogs(limit);

  // Use entity query if both entityType and entityId provided, otherwise recent
  const isEntityMode = entityType && entityId;
  const { data: activities, isLoading, error } = isEntityMode ? entityQuery : recentQuery;

  return (
    <Card className={className} data-testid="activity-viewer">
      <CardHeader className={compact ? 'pb-2' : ''}>
        <CardTitle className="flex items-center gap-2 text-base">
          <Activity className="h-4 w-4" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className={compact ? 'pt-0' : ''}>
        {isLoading ? (
          <ActivitySkeleton count={compact ? 3 : 5} />
        ) : error ? (
          <p className="text-sm text-muted-foreground">
            Failed to load activity.
          </p>
        ) : !activities || activities.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">
            No activity yet.
          </p>
        ) : (
          <ScrollArea className={compact ? 'h-48' : 'h-80'}>
            <div data-testid="activity-list">
              {activities.map((activity) => (
                <ActivityItem
                  key={activity.id}
                  activity={activity as ActivityLog & { agents?: { name: string } | null }}
                  showEntityType={showEntityType && !isEntityMode}
                  compact={compact}
                />
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}

export default ActivityViewer;
