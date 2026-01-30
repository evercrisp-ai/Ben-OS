'use client';

import * as React from 'react';
import { ChartDateRangeSelector, useChartDateRange } from './ChartDateRangeSelector';
import { VelocityChart } from './VelocityChart';
import { AreaDistributionChart } from './AreaDistributionChart';
import { ActivityHeatmap } from './ActivityHeatmap';
import { cn } from '@/lib/utils';

interface ChartWithDateRangeProps {
  className?: string;
}

export function ChartWithDateRange({ className }: ChartWithDateRangeProps) {
  const { days, setDays } = useChartDateRange(30);

  return (
    <div className={cn('space-y-6', className)} data-testid="chart-with-date-range">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Progress Overview</h2>
        <ChartDateRangeSelector value={days} onChange={setDays} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <VelocityChart days={days} />
        <AreaDistributionChart days={days} />
      </div>

      <ActivityHeatmap days={Math.max(days, 90)} />
    </div>
  );
}
