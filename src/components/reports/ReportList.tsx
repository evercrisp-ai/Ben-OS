'use client';

import { useState } from 'react';
import { useReports, useDeleteReport, useGenerateAndSaveDailyReport, useGenerateAndSaveWeeklyReport, useGenerateAndSaveMonthlyReport } from '@/hooks/use-reports';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  FileText,
  Plus,
  MoreVertical,
  Trash2,
  Eye,
  Calendar,
  CalendarDays,
  CalendarRange,
  Loader2,
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import type { Report, ReportType } from '@/types/database';

interface ReportListProps {
  onViewReport?: (reportId: string) => void;
}

export function ReportList({ onViewReport }: ReportListProps) {
  const [typeFilter, setTypeFilter] = useState<ReportType | 'all'>('all');
  const { data: reports, isLoading, error } = useReports({
    type: typeFilter === 'all' ? undefined : typeFilter,
  });

  const generateDaily = useGenerateAndSaveDailyReport();
  const generateWeekly = useGenerateAndSaveWeeklyReport();
  const generateMonthly = useGenerateAndSaveMonthlyReport();
  const deleteReport = useDeleteReport();

  const isGenerating = generateDaily.isPending || generateWeekly.isPending || generateMonthly.isPending;

  const handleGenerateReport = async (type: ReportType) => {
    switch (type) {
      case 'daily':
        await generateDaily.mutateAsync(new Date());
        break;
      case 'weekly':
        await generateWeekly.mutateAsync(new Date());
        break;
      case 'monthly':
        await generateMonthly.mutateAsync(undefined);
        break;
    }
  };

  if (isLoading) {
    return <ReportListSkeleton />;
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-10 text-center">
          <p className="text-muted-foreground">Failed to load reports: {error.message}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6" data-testid="report-list">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Reports</h2>
          <p className="text-sm text-muted-foreground">
            View and generate automated reports
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Type Filter */}
          <Select
            value={typeFilter}
            onValueChange={(value) => setTypeFilter(value as ReportType | 'all')}
          >
            <SelectTrigger className="w-32" data-testid="report-filter">
              <SelectValue placeholder="Filter" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="daily">Daily</SelectItem>
              <SelectItem value="weekly">Weekly</SelectItem>
              <SelectItem value="monthly">Monthly</SelectItem>
            </SelectContent>
          </Select>

          {/* Generate Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button disabled={isGenerating} data-testid="generate-report-button">
                {isGenerating ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="mr-2 h-4 w-4" />
                )}
                Generate Report
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => handleGenerateReport('daily')}
                disabled={generateDaily.isPending}
                data-testid="generate-daily"
              >
                <Calendar className="mr-2 h-4 w-4" />
                Daily Report
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleGenerateReport('weekly')}
                disabled={generateWeekly.isPending}
                data-testid="generate-weekly"
              >
                <CalendarDays className="mr-2 h-4 w-4" />
                Weekly Report
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleGenerateReport('monthly')}
                disabled={generateMonthly.isPending}
                data-testid="generate-monthly"
              >
                <CalendarRange className="mr-2 h-4 w-4" />
                Monthly Report
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Reports List */}
      {reports?.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center">
            <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
            <p className="mt-4 text-muted-foreground">
              No reports yet. Generate your first report to get started.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {reports?.map((report) => (
            <ReportCard
              key={report.id}
              report={report}
              onView={onViewReport}
              onDelete={(id) => deleteReport.mutate(id)}
              isDeleting={deleteReport.isPending}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface ReportCardProps {
  report: Report;
  onView?: (id: string) => void;
  onDelete: (id: string) => void;
  isDeleting: boolean;
}

function ReportCard({ report, onView, onDelete, isDeleting }: ReportCardProps) {
  const getTypeIcon = (type: ReportType) => {
    switch (type) {
      case 'daily':
        return <Calendar className="h-4 w-4" />;
      case 'weekly':
        return <CalendarDays className="h-4 w-4" />;
      case 'monthly':
        return <CalendarRange className="h-4 w-4" />;
    }
  };

  const getTypeColor = (type: ReportType) => {
    switch (type) {
      case 'daily':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'weekly':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'monthly':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
    }
  };

  const formatPeriod = (report: Report) => {
    const start = parseISO(report.period_start);
    const end = parseISO(report.period_end);

    if (report.type === 'daily') {
      return format(start, 'MMMM d, yyyy');
    } else if (report.type === 'weekly') {
      return `${format(start, 'MMM d')} - ${format(end, 'MMM d, yyyy')}`;
    } else {
      return format(start, 'MMMM yyyy');
    }
  };

  return (
    <Card
      className="transition-colors hover:bg-muted/50"
      data-testid={`report-${report.id}`}
    >
      <CardContent className="flex items-center justify-between p-4">
        <div className="flex items-center gap-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
            <FileText className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-medium">{formatPeriod(report)}</span>
              <Badge className={getTypeColor(report.type)} variant="secondary">
                {getTypeIcon(report.type)}
                <span className="ml-1 capitalize">{report.type}</span>
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              Generated {format(parseISO(report.generated_at), 'MMM d, yyyy h:mm a')}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onView?.(report.id)}
            data-testid={`view-report-${report.id}`}
          >
            <Eye className="mr-2 h-4 w-4" />
            View
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => onView?.(report.id)}
              >
                <Eye className="mr-2 h-4 w-4" />
                View Report
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onDelete(report.id)}
                disabled={isDeleting}
                className="text-red-600"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardContent>
    </Card>
  );
}

function ReportListSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-4 w-48" />
        </div>
        <div className="flex gap-3">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-36" />
        </div>
      </div>
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardContent className="flex items-center justify-between p-4">
              <div className="flex items-center gap-4">
                <Skeleton className="h-10 w-10 rounded-lg" />
                <div className="space-y-2">
                  <Skeleton className="h-5 w-48" />
                  <Skeleton className="h-4 w-32" />
                </div>
              </div>
              <Skeleton className="h-8 w-20" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
