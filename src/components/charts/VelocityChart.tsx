'use client';

import * as React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useVelocityData } from '@/hooks/use-chart-data';
import { cn } from '@/lib/utils';

interface VelocityChartProps {
  days?: number;
  className?: string;
}

export function VelocityChart({ days = 30, className }: VelocityChartProps) {
  const { data, isLoading, error } = useVelocityData(days);

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Velocity Chart</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Velocity Chart</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex h-[300px] items-center justify-center text-muted-foreground">
            Failed to load velocity data
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Velocity Chart</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex h-[300px] items-center justify-center text-muted-foreground">
            No data available
          </div>
        </CardContent>
      </Card>
    );
  }

  // Calculate average velocity
  const avgVelocity =
    data.reduce((sum, d) => sum + d.points, 0) / data.length;

  return (
    <Card className={cn(className)} data-testid="velocity-chart">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Velocity Chart</CardTitle>
        <div className="text-sm text-muted-foreground">
          Avg: <span className="font-semibold">{avgVelocity.toFixed(1)}</span> pts/week
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              dataKey="week"
              tick={{ fontSize: 12 }}
              className="text-muted-foreground"
            />
            <YAxis tick={{ fontSize: 12 }} className="text-muted-foreground" />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
              }}
              labelStyle={{ color: 'hsl(var(--foreground))' }}
              formatter={(value) => [`${value} points`, 'Story Points']}
            />
            <Bar dataKey="points" radius={[4, 4, 0, 0]}>
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  data-testid={`velocity-bar-${index}`}
                  fill={entry.points >= avgVelocity ? '#10B981' : '#3B82F6'}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
