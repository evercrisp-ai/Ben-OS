'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { useGoalProgressData } from '@/hooks/use-chart-data';
import { cn } from '@/lib/utils';

interface GoalProgressBarsProps {
  className?: string;
}

export function GoalProgressBars({ className }: GoalProgressBarsProps) {
  const { data, isLoading, error } = useGoalProgressData();

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Goal Progress</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-2 w-full" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Goal Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex h-[200px] items-center justify-center text-muted-foreground">
            Failed to load goal progress
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Goal Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex h-[200px] items-center justify-center text-muted-foreground">
            No active goals
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn(className)} data-testid="goal-progress">
      <CardHeader>
        <CardTitle>Goal Progress</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {data.map((goal) => {
          const percentage = Math.round((goal.current / goal.target) * 100);

          return (
            <div key={goal.id} className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{goal.name}</span>
                <span className="text-sm text-muted-foreground">
                  {goal.current}/{goal.target} ({percentage}%)
                </span>
              </div>
              <Progress
                value={percentage}
                className="h-2"
                role="progressbar"
                aria-label={`${goal.name} progress`}
                aria-valuenow={percentage}
                aria-valuemin={0}
                aria-valuemax={100}
                style={
                  {
                    '--progress-background': goal.color,
                  } as React.CSSProperties
                }
              />
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
