'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { getSupabaseClient } from '@/lib/supabase/client';
import {
  generateDailyReport,
  generateWeeklyReport,
  generateMonthlyReport,
  generateAndSaveDailyReport,
  generateAndSaveWeeklyReport,
  generateAndSaveMonthlyReport,
} from '@/lib/report-generator';
import type {
  Report,
  ReportType,
  DailyReport,
  WeeklyReport,
  MonthlyReport,
} from '@/types/database';
import { startOfWeek, endOfWeek, format } from 'date-fns';

// Query keys for cache management
export const reportKeys = {
  all: ['reports'] as const,
  lists: () => [...reportKeys.all, 'list'] as const,
  list: (filters?: { type?: ReportType; limit?: number }) =>
    [...reportKeys.lists(), filters] as const,
  details: () => [...reportKeys.all, 'detail'] as const,
  detail: (id: string) => [...reportKeys.details(), id] as const,
  byType: (type: ReportType) => [...reportKeys.all, 'type', type] as const,
};

/**
 * Fetch all reports, with optional filters
 */
export function useReports(options?: { type?: ReportType; limit?: number }) {
  const { type, limit = 50 } = options || {};

  return useQuery({
    queryKey: reportKeys.list({ type, limit }),
    queryFn: async () => {
      const supabase = getSupabaseClient();
      let query = supabase
        .from('reports')
        .select('*')
        .order('generated_at', { ascending: false })
        .limit(limit);

      if (type) {
        query = query.eq('type', type);
      }

      const { data, error } = await query;

      if (error) {
        throw new Error(error.message);
      }

      return data as Report[];
    },
  });
}

/**
 * Fetch a single report by ID
 */
export function useReport(id: string) {
  return useQuery({
    queryKey: reportKeys.detail(id),
    queryFn: async () => {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from('reports')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        throw new Error(error.message);
      }

      return data as Report;
    },
    enabled: !!id,
  });
}

/**
 * Fetch reports by type
 */
export function useReportsByType(type: ReportType) {
  return useReports({ type });
}

/**
 * Generate a daily report (without saving)
 */
export function useGenerateDailyReport() {
  return useMutation({
    mutationFn: async (date: Date = new Date()) => {
      return generateDailyReport(date);
    },
    onError: (error) => {
      toast.error(`Failed to generate daily report: ${error.message}`);
    },
  });
}

/**
 * Generate a weekly report (without saving)
 */
export function useGenerateWeeklyReport() {
  return useMutation({
    mutationFn: async (date: Date = new Date()) => {
      const weekStart = startOfWeek(date, { weekStartsOn: 1 });
      const weekEnd = endOfWeek(date, { weekStartsOn: 1 });
      return generateWeeklyReport(weekStart, weekEnd);
    },
    onError: (error) => {
      toast.error(`Failed to generate weekly report: ${error.message}`);
    },
  });
}

/**
 * Generate a monthly report (without saving)
 */
export function useGenerateMonthlyReport() {
  return useMutation({
    mutationFn: async (monthString?: string) => {
      const month = monthString || format(new Date(), 'yyyy-MM');
      return generateMonthlyReport(month);
    },
    onError: (error) => {
      toast.error(`Failed to generate monthly report: ${error.message}`);
    },
  });
}

/**
 * Generate and save a daily report
 */
export function useGenerateAndSaveDailyReport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (date?: Date) => {
      return generateAndSaveDailyReport(date);
    },
    onSuccess: () => {
      toast.success('Daily report generated and saved');
      queryClient.invalidateQueries({ queryKey: reportKeys.lists() });
    },
    onError: (error) => {
      toast.error(`Failed to generate daily report: ${error.message}`);
    },
  });
}

/**
 * Generate and save a weekly report
 */
export function useGenerateAndSaveWeeklyReport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (date?: Date) => {
      return generateAndSaveWeeklyReport(date);
    },
    onSuccess: () => {
      toast.success('Weekly report generated and saved');
      queryClient.invalidateQueries({ queryKey: reportKeys.lists() });
    },
    onError: (error) => {
      toast.error(`Failed to generate weekly report: ${error.message}`);
    },
  });
}

/**
 * Generate and save a monthly report
 */
export function useGenerateAndSaveMonthlyReport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (monthString?: string) => {
      return generateAndSaveMonthlyReport(monthString);
    },
    onSuccess: () => {
      toast.success('Monthly report generated and saved');
      queryClient.invalidateQueries({ queryKey: reportKeys.lists() });
    },
    onError: (error) => {
      toast.error(`Failed to generate monthly report: ${error.message}`);
    },
  });
}

/**
 * Delete a report
 */
export function useDeleteReport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const supabase = getSupabaseClient();
      const { error } = await supabase.from('reports').delete().eq('id', id);

      if (error) {
        throw new Error(error.message);
      }

      return id;
    },
    onSuccess: () => {
      toast.success('Report deleted');
      queryClient.invalidateQueries({ queryKey: reportKeys.lists() });
    },
    onError: (error) => {
      toast.error(`Failed to delete report: ${error.message}`);
    },
  });
}

/**
 * Type guard for daily report
 */
export function isDailyReport(report: Report): boolean {
  return report.type === 'daily';
}

/**
 * Type guard for weekly report
 */
export function isWeeklyReport(report: Report): boolean {
  return report.type === 'weekly';
}

/**
 * Type guard for monthly report
 */
export function isMonthlyReport(report: Report): boolean {
  return report.type === 'monthly';
}

/**
 * Get typed content from a daily report
 */
export function getDailyReportContent(report: Report): DailyReport | null {
  if (report.type === 'daily') {
    return report.content as unknown as DailyReport;
  }
  return null;
}

/**
 * Get typed content from a weekly report
 */
export function getWeeklyReportContent(report: Report): WeeklyReport | null {
  if (report.type === 'weekly') {
    return report.content as unknown as WeeklyReport;
  }
  return null;
}

/**
 * Get typed content from a monthly report
 */
export function getMonthlyReportContent(report: Report): MonthlyReport | null {
  if (report.type === 'monthly') {
    return report.content as unknown as MonthlyReport;
  }
  return null;
}
