'use client';

import * as React from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DATE_RANGES } from '@/hooks/use-chart-data';
import { cn } from '@/lib/utils';

interface ChartDateRangeSelectorProps {
  value: number;
  onChange: (days: number) => void;
  className?: string;
}

export function ChartDateRangeSelector({
  value,
  onChange,
  className,
}: ChartDateRangeSelectorProps) {
  return (
    <Select
      value={String(value)}
      onValueChange={(v) => onChange(Number(v))}
    >
      <SelectTrigger
        className={cn('w-[180px]', className)}
        data-testid="date-range-selector"
      >
        <SelectValue placeholder="Select date range" />
      </SelectTrigger>
      <SelectContent>
        {DATE_RANGES.map((range) => (
          <SelectItem
            key={range.days}
            value={String(range.days)}
            data-testid={`date-range-${range.days}`}
          >
            {range.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

// Hook for managing chart date range state
export function useChartDateRange(defaultDays: number = 30) {
  const [days, setDays] = React.useState(defaultDays);

  return {
    days,
    setDays,
    range: DATE_RANGES.find((r) => r.days === days) || DATE_RANGES[2],
  };
}
