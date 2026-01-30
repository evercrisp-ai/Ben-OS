'use client';

import { useQuery } from '@tanstack/react-query';
import { getSupabaseClient } from '@/lib/supabase/client';
import {
  startOfDay,
  subDays,
  format,
  eachDayOfInterval,
  eachWeekOfInterval,
  endOfWeek,
  isWithinInterval,
  parseISO,
} from 'date-fns';
import type { Task, Milestone, ActivityLog, Area, Project } from '@/types/database';

// Types for chart data
export interface BurndownDataPoint {
  date: string;
  remaining: number;
  ideal: number;
}

export interface BurnupDataPoint {
  date: string;
  completed: number;
  total: number;
}

export interface VelocityDataPoint {
  week: string;
  points: number;
  weekStart: string;
}

export interface AreaDistributionDataPoint {
  name: string;
  value: number;
  color: string;
}

export interface HeatmapDataPoint {
  date: string;
  count: number;
  level: 0 | 1 | 2 | 3 | 4;
}

export interface GoalProgress {
  id: string;
  name: string;
  current: number;
  target: number;
  color: string;
}

export interface DateRange {
  days: number;
  label: string;
}

export const DATE_RANGES: DateRange[] = [
  { days: 7, label: 'Last 7 days' },
  { days: 14, label: 'Last 14 days' },
  { days: 30, label: 'Last 30 days' },
  { days: 90, label: 'Last 90 days' },
];

// Query keys for chart data
export const chartDataKeys = {
  all: ['chartData'] as const,
  burndown: (milestoneId: string, days: number) =>
    [...chartDataKeys.all, 'burndown', milestoneId, days] as const,
  burnup: (projectId: string, days: number) =>
    [...chartDataKeys.all, 'burnup', projectId, days] as const,
  velocity: (days: number) => [...chartDataKeys.all, 'velocity', days] as const,
  areaDistribution: (days: number) =>
    [...chartDataKeys.all, 'areaDistribution', days] as const,
  activityHeatmap: (days: number) =>
    [...chartDataKeys.all, 'activityHeatmap', days] as const,
  goalProgress: () => [...chartDataKeys.all, 'goalProgress'] as const,
};

/**
 * Fetch burndown chart data for a milestone
 * Shows remaining work over time
 */
export function useBurndownData(milestoneId: string, days: number = 30) {
  return useQuery({
    queryKey: chartDataKeys.burndown(milestoneId, days),
    queryFn: async (): Promise<BurndownDataPoint[]> => {
      const supabase = getSupabaseClient();
      if (!supabase) throw new Error('Supabase client not available');
      const startDate = subDays(new Date(), days);
      const endDate = new Date();

      // Get all tasks for this milestone
      const { data: tasks, error: tasksError } = await supabase
        .from('tasks')
        .select('*')
        .eq('milestone_id', milestoneId);

      if (tasksError) throw new Error(tasksError.message);

      const totalPoints = (tasks as Task[]).reduce(
        (sum, task) => sum + (task.story_points || 1),
        0
      );

      // Calculate burndown data
      const dateRange = eachDayOfInterval({ start: startDate, end: endDate });
      const dataPoints: BurndownDataPoint[] = [];

      dateRange.forEach((date, index) => {
        const dayEnd = startOfDay(date);
        dayEnd.setHours(23, 59, 59, 999);

        const completedByDate = (tasks as Task[]).filter((task) => {
          if (!task.completed_at) return false;
          return parseISO(task.completed_at) <= dayEnd;
        });

        const completedPoints = completedByDate.reduce(
          (sum, task) => sum + (task.story_points || 1),
          0
        );

        const remaining = totalPoints - completedPoints;
        const ideal = totalPoints - (totalPoints * (index + 1)) / dateRange.length;

        dataPoints.push({
          date: format(date, 'MMM d'),
          remaining: Math.max(0, remaining),
          ideal: Math.max(0, ideal),
        });
      });

      return dataPoints;
    },
    enabled: !!milestoneId,
  });
}

/**
 * Fetch burnup chart data for a project
 * Shows completed work accumulation over time
 */
export function useBurnupData(projectId: string, days: number = 30) {
  return useQuery({
    queryKey: chartDataKeys.burnup(projectId, days),
    queryFn: async (): Promise<BurnupDataPoint[]> => {
      const supabase = getSupabaseClient();
      if (!supabase) throw new Error('Supabase client not available');
      const startDate = subDays(new Date(), days);
      const endDate = new Date();

      // Get all boards for this project
      const { data: boards, error: boardsError } = await supabase
        .from('boards')
        .select('id')
        .eq('project_id', projectId);

      if (boardsError) throw new Error(boardsError.message);

      if (!boards || boards.length === 0) {
        return [];
      }

      const boardIds = boards.map((b) => b.id);

      // Get all tasks for these boards
      const { data: tasks, error: tasksError } = await supabase
        .from('tasks')
        .select('*')
        .in('board_id', boardIds);

      if (tasksError) throw new Error(tasksError.message);

      const totalPoints = (tasks as Task[]).reduce(
        (sum, task) => sum + (task.story_points || 1),
        0
      );

      // Calculate burnup data
      const dateRange = eachDayOfInterval({ start: startDate, end: endDate });
      const dataPoints: BurnupDataPoint[] = [];

      dateRange.forEach((date) => {
        const dayEnd = startOfDay(date);
        dayEnd.setHours(23, 59, 59, 999);

        const completedByDate = (tasks as Task[]).filter((task) => {
          if (!task.completed_at) return false;
          return parseISO(task.completed_at) <= dayEnd;
        });

        const completedPoints = completedByDate.reduce(
          (sum, task) => sum + (task.story_points || 1),
          0
        );

        dataPoints.push({
          date: format(date, 'MMM d'),
          completed: completedPoints,
          total: totalPoints,
        });
      });

      return dataPoints;
    },
    enabled: !!projectId,
  });
}

/**
 * Fetch velocity chart data
 * Shows story points completed per week
 */
export function useVelocityData(days: number = 30) {
  return useQuery({
    queryKey: chartDataKeys.velocity(days),
    queryFn: async (): Promise<VelocityDataPoint[]> => {
      const supabase = getSupabaseClient();
      if (!supabase) throw new Error('Supabase client not available');
      const startDate = subDays(new Date(), days);
      const endDate = new Date();

      // Get all completed tasks in date range
      const { data: tasks, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('status', 'done')
        .gte('completed_at', startDate.toISOString())
        .lte('completed_at', endDate.toISOString());

      if (error) throw new Error(error.message);

      // Group by week
      const weeks = eachWeekOfInterval(
        { start: startDate, end: endDate },
        { weekStartsOn: 1 }
      );

      const dataPoints: VelocityDataPoint[] = weeks.map((weekStart) => {
        const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });

        const weekTasks = (tasks as Task[]).filter((task) => {
          if (!task.completed_at) return false;
          const completedDate = parseISO(task.completed_at);
          return isWithinInterval(completedDate, { start: weekStart, end: weekEnd });
        });

        const points = weekTasks.reduce(
          (sum, task) => sum + (task.story_points || 1),
          0
        );

        return {
          week: format(weekStart, 'MMM d'),
          points,
          weekStart: weekStart.toISOString(),
        };
      });

      return dataPoints;
    },
  });
}

/**
 * Fetch area distribution data
 * Shows work distribution by area
 */
export function useAreaDistributionData(days: number = 30) {
  return useQuery({
    queryKey: chartDataKeys.areaDistribution(days),
    queryFn: async (): Promise<AreaDistributionDataPoint[]> => {
      const supabase = getSupabaseClient();
      if (!supabase) throw new Error('Supabase client not available');
      const startDate = subDays(new Date(), days);

      // Get all areas
      const { data: areas, error: areasError } = await supabase
        .from('areas')
        .select('*');

      if (areasError) throw new Error(areasError.message);

      // Get all projects
      const { data: projects, error: projectsError } = await supabase
        .from('projects')
        .select('*');

      if (projectsError) throw new Error(projectsError.message);

      // Get all boards
      const { data: boards, error: boardsError } = await supabase
        .from('boards')
        .select('*');

      if (boardsError) throw new Error(boardsError.message);

      // Get all tasks completed in date range
      const { data: tasks, error: tasksError } = await supabase
        .from('tasks')
        .select('*')
        .eq('status', 'done')
        .gte('completed_at', startDate.toISOString());

      if (tasksError) throw new Error(tasksError.message);

      // Build a mapping of board_id to area_id
      const boardToProject = new Map<string, string>();
      (boards as { id: string; project_id: string }[]).forEach((board) => {
        boardToProject.set(board.id, board.project_id);
      });

      const projectToArea = new Map<string, string>();
      (projects as Project[]).forEach((project) => {
        projectToArea.set(project.id, project.area_id);
      });

      // Count tasks per area
      const areaCounts = new Map<string, number>();
      (tasks as Task[]).forEach((task) => {
        const projectId = boardToProject.get(task.board_id);
        if (!projectId) return;
        const areaId = projectToArea.get(projectId);
        if (!areaId) return;

        const currentCount = areaCounts.get(areaId) || 0;
        areaCounts.set(areaId, currentCount + (task.story_points || 1));
      });

      // Build result
      const dataPoints: AreaDistributionDataPoint[] = (areas as Area[])
        .map((area) => ({
          name: area.name,
          value: areaCounts.get(area.id) || 0,
          color: area.color,
        }))
        .filter((point) => point.value > 0);

      return dataPoints;
    },
  });
}

/**
 * Fetch activity heatmap data
 * Shows daily activity intensity
 */
export function useActivityHeatmapData(days: number = 90) {
  return useQuery({
    queryKey: chartDataKeys.activityHeatmap(days),
    queryFn: async (): Promise<HeatmapDataPoint[]> => {
      const supabase = getSupabaseClient();
      if (!supabase) throw new Error('Supabase client not available');
      const startDate = subDays(new Date(), days);
      const endDate = new Date();

      // Get all activity logs in date range
      const { data: logs, error } = await supabase
        .from('activity_logs')
        .select('*')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());

      if (error) throw new Error(error.message);

      // Group by date
      const dateRange = eachDayOfInterval({ start: startDate, end: endDate });
      const dateCounts = new Map<string, number>();

      (logs as ActivityLog[]).forEach((log) => {
        const dateKey = format(parseISO(log.created_at), 'yyyy-MM-dd');
        const currentCount = dateCounts.get(dateKey) || 0;
        dateCounts.set(dateKey, currentCount + 1);
      });

      // Find max count for level calculation
      const counts = Array.from(dateCounts.values());
      const maxCount = Math.max(...counts, 1);

      // Build heatmap data
      const dataPoints: HeatmapDataPoint[] = dateRange.map((date) => {
        const dateKey = format(date, 'yyyy-MM-dd');
        const count = dateCounts.get(dateKey) || 0;

        // Calculate level (0-4)
        let level: 0 | 1 | 2 | 3 | 4 = 0;
        if (count > 0) {
          const ratio = count / maxCount;
          if (ratio > 0.75) level = 4;
          else if (ratio > 0.5) level = 3;
          else if (ratio > 0.25) level = 2;
          else level = 1;
        }

        return {
          date: dateKey,
          count,
          level,
        };
      });

      return dataPoints;
    },
  });
}

/**
 * Fetch goal progress data
 * Shows progress toward project milestones
 */
export function useGoalProgressData() {
  return useQuery({
    queryKey: chartDataKeys.goalProgress(),
    queryFn: async (): Promise<GoalProgress[]> => {
      const supabase = getSupabaseClient();
      if (!supabase) throw new Error('Supabase client not available');

      // Get active milestones with their tasks
      const { data: milestones, error: milestonesError } = await supabase
        .from('milestones')
        .select('*')
        .in('status', ['pending', 'in_progress'])
        .order('target_date', { ascending: true })
        .limit(5);

      if (milestonesError) throw new Error(milestonesError.message);

      if (!milestones || milestones.length === 0) {
        return [];
      }

      // Get tasks for these milestones
      const milestoneIds = (milestones as Milestone[]).map((m) => m.id);
      const { data: tasks, error: tasksError } = await supabase
        .from('tasks')
        .select('*')
        .in('milestone_id', milestoneIds);

      if (tasksError) throw new Error(tasksError.message);

      // Group tasks by milestone
      const tasksByMilestone = new Map<string, Task[]>();
      (tasks as Task[]).forEach((task) => {
        if (!task.milestone_id) return;
        const existing = tasksByMilestone.get(task.milestone_id) || [];
        existing.push(task);
        tasksByMilestone.set(task.milestone_id, existing);
      });

      // Calculate progress for each milestone
      const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];
      const goalProgress: GoalProgress[] = (milestones as Milestone[]).map(
        (milestone, index) => {
          const milestoneTasks = tasksByMilestone.get(milestone.id) || [];
          const totalPoints = milestoneTasks.reduce(
            (sum, task) => sum + (task.story_points || 1),
            0
          );
          const completedPoints = milestoneTasks
            .filter((task) => task.status === 'done')
            .reduce((sum, task) => sum + (task.story_points || 1), 0);

          return {
            id: milestone.id,
            name: milestone.title,
            current: completedPoints,
            target: totalPoints || 1, // Avoid division by zero
            color: colors[index % colors.length],
          };
        }
      );

      return goalProgress;
    },
  });
}
