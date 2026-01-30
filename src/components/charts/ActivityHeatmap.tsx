'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useActivityHeatmapData, type HeatmapDataPoint } from '@/hooks/use-chart-data';
import { cn } from '@/lib/utils';
import { format, parseISO, getDay, startOfWeek, addDays } from 'date-fns';

interface ActivityHeatmapProps {
  days?: number;
  className?: string;
}

const LEVEL_COLORS = [
  'bg-muted',
  'bg-green-200 dark:bg-green-900',
  'bg-green-400 dark:bg-green-700',
  'bg-green-600 dark:bg-green-500',
  'bg-green-800 dark:bg-green-300',
];

const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function ActivityHeatmap({ days = 90, className }: ActivityHeatmapProps) {
  const { data, isLoading, error } = useActivityHeatmapData(days);

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Activity Heatmap</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[150px] w-full" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Activity Heatmap</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex h-[150px] items-center justify-center text-muted-foreground">
            Failed to load activity data
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Activity Heatmap</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex h-[150px] items-center justify-center text-muted-foreground">
            No activity data available
          </div>
        </CardContent>
      </Card>
    );
  }

  // Organize data into weeks (columns) with days (rows)
  const weeks = organizeIntoWeeks(data);

  return (
    <Card className={cn(className)} data-testid="heatmap">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Activity Heatmap</CardTitle>
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <span>Less</span>
          {LEVEL_COLORS.map((color, i) => (
            <div
              key={i}
              className={cn('h-3 w-3 rounded-sm', color)}
            />
          ))}
          <span>More</span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex gap-1">
          {/* Day labels */}
          <div className="flex flex-col gap-1 pr-2">
            {DAYS_OF_WEEK.map((day, i) => (
              <div
                key={day}
                className="flex h-3 items-center text-[10px] text-muted-foreground"
                style={{ visibility: i % 2 === 1 ? 'visible' : 'hidden' }}
              >
                {day}
              </div>
            ))}
          </div>

          {/* Heatmap grid */}
          <div className="flex gap-1 overflow-x-auto">
            {weeks.map((week, weekIndex) => (
              <div key={weekIndex} className="flex flex-col gap-1">
                {week.map((day, dayIndex) => (
                  <HeatmapCell key={dayIndex} data={day} />
                ))}
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function HeatmapCell({ data }: { data: HeatmapDataPoint | null }) {
  if (!data) {
    return <div className="h-3 w-3 rounded-sm bg-transparent" />;
  }

  const formattedDate = format(parseISO(data.date), 'MMM d, yyyy');

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div
          className={cn(
            'h-3 w-3 cursor-pointer rounded-sm transition-colors',
            LEVEL_COLORS[data.level]
          )}
          data-testid={`heatmap-cell-${data.date}`}
        />
      </TooltipTrigger>
      <TooltipContent>
        <p className="font-semibold">{formattedDate}</p>
        <p className="text-muted-foreground">
          {data.count} {data.count === 1 ? 'activity' : 'activities'}
        </p>
      </TooltipContent>
    </Tooltip>
  );
}

function organizeIntoWeeks(data: HeatmapDataPoint[]): (HeatmapDataPoint | null)[][] {
  if (data.length === 0) return [];

  const weeks: (HeatmapDataPoint | null)[][] = [];
  const dataMap = new Map<string, HeatmapDataPoint>();

  // Create a map for quick lookup
  data.forEach((d) => {
    dataMap.set(d.date, d);
  });

  // Get the start date (beginning of first week)
  const firstDate = parseISO(data[0].date);
  const lastDate = parseISO(data[data.length - 1].date);
  const startDate = startOfWeek(firstDate, { weekStartsOn: 0 });

  let currentDate = startDate;
  let currentWeek: (HeatmapDataPoint | null)[] = [];

  while (currentDate <= lastDate) {
    const dateKey = format(currentDate, 'yyyy-MM-dd');
    const dayData = dataMap.get(dateKey) || null;

    currentWeek.push(dayData);

    if (getDay(currentDate) === 6) {
      // End of week (Saturday)
      weeks.push(currentWeek);
      currentWeek = [];
    }

    currentDate = addDays(currentDate, 1);
  }

  // Push remaining days
  if (currentWeek.length > 0) {
    // Fill remaining days with null
    while (currentWeek.length < 7) {
      currentWeek.push(null);
    }
    weeks.push(currentWeek);
  }

  return weeks;
}
