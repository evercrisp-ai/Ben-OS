// Report Generator Service
// Generates daily, weekly, and monthly reports with data aggregation and AI insights

import { getSupabaseClient } from '@/lib/supabase/client';
import {
  generateDailyInsights,
  generateWeeklyInsights,
  generateMonthlyInsights,
  generateStrategicRecommendations,
} from '@/lib/ai-summary';
import type {
  DailyReport,
  WeeklyReport,
  MonthlyReport,
  TaskSummary,
  AgentActivitySummary,
  MilestoneProgress,
  Goal,
  TrendData,
  Task,
  Milestone,
  ActivityLog,
} from '@/types/database';
import {
  format,
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  subMonths,
  parseISO,
} from 'date-fns';

/**
 * Generate a daily report for the specified date
 */
export async function generateDailyReport(date: Date): Promise<DailyReport> {
  const supabase = getSupabaseClient();
  const dayStart = startOfDay(date).toISOString();
  const dayEnd = endOfDay(date).toISOString();
  const dateString = format(date, 'yyyy-MM-dd');

  // Fetch tasks completed today
  const { data: completedTasks } = await supabase
    .from('tasks')
    .select('*, boards(project_id, projects(title))')
    .eq('status', 'done')
    .gte('completed_at', dayStart)
    .lte('completed_at', dayEnd);

  // Fetch tasks started today (status changed to in_progress)
  const { data: startedTasks } = await supabase
    .from('tasks')
    .select('*, boards(project_id, projects(title))')
    .eq('status', 'in_progress')
    .gte('updated_at', dayStart)
    .lte('updated_at', dayEnd);

  // Fetch blocked tasks (tasks with "blocked" in description or specific status pattern)
  const { data: allInProgressTasks } = await supabase
    .from('tasks')
    .select('*, boards(project_id, projects(title))')
    .eq('status', 'review')
    .gte('updated_at', dayStart);

  // Fetch agent activity for the day
  const { data: agentActivity } = await supabase
    .from('activity_logs')
    .select('*, agents(name)')
    .not('agent_id', 'is', null)
    .gte('created_at', dayStart)
    .lte('created_at', dayEnd);

  // Fetch agents for activity summary
  const { data: agents } = await supabase
    .from('agents')
    .select('id, name')
    .eq('is_active', true);

  // Transform tasks to TaskSummary
  const tasksCompleted = transformToTaskSummary(completedTasks || []);
  const tasksStarted = transformToTaskSummary(startedTasks || []);
  const tasksBlocked = transformToTaskSummary(allInProgressTasks || []);

  // Aggregate agent activity
  const agentActivitySummary = aggregateAgentActivity(
    agentActivity || [],
    agents || [],
    completedTasks || []
  );

  // Generate AI insights
  const aiInsights = await generateDailyInsights({
    tasksCompleted,
    tasksStarted,
    tasksBlocked,
    date: dateString,
  });

  return {
    date: dateString,
    tasksCompleted,
    tasksStarted,
    tasksBlocked,
    agentActivity: agentActivitySummary,
    aiInsights,
  };
}

/**
 * Generate a weekly report for the specified date range
 */
export async function generateWeeklyReport(
  weekStart: Date,
  weekEnd: Date
): Promise<WeeklyReport> {
  const supabase = getSupabaseClient();
  const startDate = startOfWeek(weekStart, { weekStartsOn: 1 });
  const endDate = endOfWeek(weekEnd, { weekStartsOn: 1 });
  const startString = format(startDate, 'yyyy-MM-dd');
  const endString = format(endDate, 'yyyy-MM-dd');

  // Fetch completed tasks with story points
  const { data: completedTasks } = await supabase
    .from('tasks')
    .select('*, boards(project_id, projects(title, area_id, areas(name)))')
    .eq('status', 'done')
    .gte('completed_at', startDate.toISOString())
    .lte('completed_at', endDate.toISOString());

  // Calculate velocity points
  const velocityPoints = (completedTasks || []).reduce(
    (sum, task) => sum + (task.story_points || 0),
    0
  );

  // Fetch milestones with their tasks
  const { data: milestones } = await supabase
    .from('milestones')
    .select('*, projects(title)')
    .in('status', ['pending', 'in_progress', 'completed']);

  // Fetch all tasks for milestone progress calculation
  const { data: allTasks } = await supabase
    .from('tasks')
    .select('milestone_id, status');

  // Calculate milestone progress
  const milestonesProgress = calculateMilestoneProgress(
    milestones || [],
    allTasks || []
  );

  // Calculate area focus distribution
  const areaFocusDistribution = calculateAreaFocusDistribution(completedTasks || []);

  // Extract top accomplishments (completed high-priority tasks)
  const topAccomplishments = (completedTasks || [])
    .filter(t => t.priority === 'critical' || t.priority === 'high')
    .slice(0, 5)
    .map(t => t.title);

  // Generate AI insights
  const aiInsights = await generateWeeklyInsights({
    velocityPoints,
    milestonesProgress,
    areaFocusDistribution,
    topAccomplishments,
    weekStart: startString,
    weekEnd: endString,
  });

  return {
    weekStart: startString,
    weekEnd: endString,
    velocityPoints,
    milestonesProgress,
    areaFocusDistribution,
    topAccomplishments,
    aiInsights,
  };
}

/**
 * Generate a monthly report for the specified month
 */
export async function generateMonthlyReport(monthString: string): Promise<MonthlyReport> {
  const supabase = getSupabaseClient();
  const monthDate = parseISO(`${monthString}-01`);
  const monthStart = startOfMonth(monthDate);
  const monthEnd = endOfMonth(monthDate);
  const prevMonthStart = startOfMonth(subMonths(monthDate, 1));
  const prevMonthEnd = endOfMonth(subMonths(monthDate, 1));

  // Fetch completed tasks this month
  const { data: completedTasks } = await supabase
    .from('tasks')
    .select('*')
    .eq('status', 'done')
    .gte('completed_at', monthStart.toISOString())
    .lte('completed_at', monthEnd.toISOString());

  // Fetch completed tasks previous month
  const { data: prevCompletedTasks } = await supabase
    .from('tasks')
    .select('*')
    .eq('status', 'done')
    .gte('completed_at', prevMonthStart.toISOString())
    .lte('completed_at', prevMonthEnd.toISOString());

  // Fetch completed projects this month
  const { data: completedProjects } = await supabase
    .from('projects')
    .select('*')
    .eq('status', 'completed')
    .gte('updated_at', monthStart.toISOString())
    .lte('updated_at', monthEnd.toISOString());

  // Fetch completed projects previous month
  const { data: prevCompletedProjects } = await supabase
    .from('projects')
    .select('*')
    .eq('status', 'completed')
    .gte('updated_at', prevMonthStart.toISOString())
    .lte('updated_at', prevMonthEnd.toISOString());

  // Fetch completed milestones this month
  const { data: completedMilestones } = await supabase
    .from('milestones')
    .select('*, projects(title)')
    .eq('status', 'completed')
    .gte('updated_at', monthStart.toISOString())
    .lte('updated_at', monthEnd.toISOString());

  // Fetch areas for focus analysis
  const { data: areas } = await supabase.from('areas').select('name');

  // Build goals achieved list
  const goalsAchieved: Goal[] = [
    ...(completedProjects || []).map(p => ({
      id: p.id,
      title: p.title,
      type: 'project' as const,
      achievedAt: p.updated_at,
      description: p.description || undefined,
    })),
    ...(completedMilestones || []).map(m => ({
      id: m.id,
      title: m.title,
      type: 'milestone' as const,
      achievedAt: m.updated_at,
      description: m.description || undefined,
    })),
  ];

  // Calculate overall progress
  const totalTasks = await supabase.from('tasks').select('id', { count: 'exact' });
  const doneTasks = await supabase
    .from('tasks')
    .select('id', { count: 'exact' })
    .eq('status', 'done');

  const overallProgress = totalTasks.count
    ? Math.round(((doneTasks.count || 0) / totalTasks.count) * 100)
    : 0;

  // Calculate velocity for trend analysis
  const currentVelocity = (completedTasks || []).reduce(
    (sum, t) => sum + (t.story_points || 0),
    0
  );
  const prevVelocity = (prevCompletedTasks || []).reduce(
    (sum, t) => sum + (t.story_points || 0),
    0
  );

  const velocityChange = prevVelocity > 0
    ? Math.round(((currentVelocity - prevVelocity) / prevVelocity) * 100)
    : 0;

  // Build trend analysis
  const trendAnalysis: TrendData = {
    velocityTrend: velocityChange > 5 ? 'increasing' : velocityChange < -5 ? 'decreasing' : 'stable',
    velocityChange,
    productivityTrend:
      (completedTasks?.length || 0) > (prevCompletedTasks?.length || 0)
        ? 'increasing'
        : (completedTasks?.length || 0) < (prevCompletedTasks?.length || 0)
        ? 'decreasing'
        : 'stable',
    focusAreas: (areas || []).slice(0, 3).map(a => a.name),
    comparisonToPrevious: {
      tasksCompleted: {
        current: completedTasks?.length || 0,
        previous: prevCompletedTasks?.length || 0,
      },
      projectsCompleted: {
        current: completedProjects?.length || 0,
        previous: prevCompletedProjects?.length || 0,
      },
    },
  };

  // Fetch data for recommendations
  const { data: inProgressProjects } = await supabase
    .from('projects')
    .select('id')
    .eq('status', 'active');

  const { data: upcomingMilestones } = await supabase
    .from('milestones')
    .select('id')
    .in('status', ['pending', 'in_progress']);

  // Generate strategic recommendations
  const strategicRecommendations = await generateStrategicRecommendations({
    trendAnalysis,
    focusAreas: trendAnalysis.focusAreas,
    projectsInProgress: inProgressProjects?.length || 0,
    upcomingMilestones: upcomingMilestones?.length || 0,
  });

  // Generate AI insights
  const aiInsights = await generateMonthlyInsights({
    month: monthString,
    goalsAchieved: goalsAchieved.length,
    projectsCompleted: completedProjects?.length || 0,
    overallProgress,
    trendAnalysis,
  });

  return {
    month: monthString,
    goalsAchieved,
    projectsCompleted: completedProjects || [],
    overallProgress,
    trendAnalysis,
    strategicRecommendations,
    aiInsights,
  };
}

/**
 * Save a report to the database
 */
export async function saveReport(
  type: 'daily' | 'weekly' | 'monthly',
  periodStart: string,
  periodEnd: string,
  content: DailyReport | WeeklyReport | MonthlyReport
): Promise<{ id: string }> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from('reports')
    .insert({
      type,
      period_start: periodStart,
      period_end: periodEnd,
      content: JSON.parse(JSON.stringify(content)),
    })
    .select('id')
    .single();

  if (error) {
    throw new Error(`Failed to save report: ${error.message}`);
  }

  return { id: data.id };
}

/**
 * Generate and save a daily report
 */
export async function generateAndSaveDailyReport(
  date: Date = new Date()
): Promise<{ id: string; report: DailyReport }> {
  const report = await generateDailyReport(date);
  const dateString = format(date, 'yyyy-MM-dd');
  const { id } = await saveReport('daily', dateString, dateString, report);
  return { id, report };
}

/**
 * Generate and save a weekly report
 */
export async function generateAndSaveWeeklyReport(
  date: Date = new Date()
): Promise<{ id: string; report: WeeklyReport }> {
  const weekStart = startOfWeek(date, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(date, { weekStartsOn: 1 });
  const report = await generateWeeklyReport(weekStart, weekEnd);
  const { id } = await saveReport(
    'weekly',
    format(weekStart, 'yyyy-MM-dd'),
    format(weekEnd, 'yyyy-MM-dd'),
    report
  );
  return { id, report };
}

/**
 * Generate and save a monthly report
 */
export async function generateAndSaveMonthlyReport(
  monthString?: string
): Promise<{ id: string; report: MonthlyReport }> {
  const month = monthString || format(new Date(), 'yyyy-MM');
  const monthDate = parseISO(`${month}-01`);
  const monthStart = startOfMonth(monthDate);
  const monthEnd = endOfMonth(monthDate);
  const report = await generateMonthlyReport(month);
  const { id } = await saveReport(
    'monthly',
    format(monthStart, 'yyyy-MM-dd'),
    format(monthEnd, 'yyyy-MM-dd'),
    report
  );
  return { id, report };
}

// Helper functions

function transformToTaskSummary(tasks: Array<Task & { boards?: { project_id: string; projects?: { title: string } } }>): TaskSummary[] {
  return tasks.map(task => ({
    id: task.id,
    title: task.title,
    status: task.status,
    priority: task.priority,
    projectTitle: task.boards?.projects?.title,
    completedAt: task.completed_at || undefined,
    storyPoints: task.story_points,
  }));
}

function aggregateAgentActivity(
  activityLogs: Array<ActivityLog & { agents?: { name: string } | null }>,
  agents: Array<{ id: string; name: string }>,
  completedTasks: Task[]
): AgentActivitySummary[] {
  const agentMap = new Map<string, AgentActivitySummary>();

  // Initialize with all active agents
  agents.forEach(agent => {
    agentMap.set(agent.id, {
      agentId: agent.id,
      agentName: agent.name,
      tasksCompleted: 0,
      tasksCreated: 0,
      actionsPerformed: 0,
    });
  });

  // Count activity logs
  activityLogs.forEach(log => {
    if (log.agent_id && agentMap.has(log.agent_id)) {
      const summary = agentMap.get(log.agent_id)!;
      summary.actionsPerformed++;

      if (log.action === 'create' && log.entity_type === 'tasks') {
        summary.tasksCreated++;
      }
    }
  });

  // Count completed tasks by agent
  completedTasks.forEach(task => {
    if (task.assigned_agent_id && agentMap.has(task.assigned_agent_id)) {
      agentMap.get(task.assigned_agent_id)!.tasksCompleted++;
    }
  });

  return Array.from(agentMap.values()).filter(
    a => a.actionsPerformed > 0 || a.tasksCompleted > 0 || a.tasksCreated > 0
  );
}

function calculateMilestoneProgress(
  milestones: Array<Milestone & { projects?: { title: string } }>,
  tasks: Array<{ milestone_id: string | null; status: string }>
): MilestoneProgress[] {
  return milestones.map(milestone => {
    const milestoneTasks = tasks.filter(t => t.milestone_id === milestone.id);
    const completedTasks = milestoneTasks.filter(t => t.status === 'done');
    const percentComplete =
      milestoneTasks.length > 0
        ? Math.round((completedTasks.length / milestoneTasks.length) * 100)
        : 0;

    return {
      id: milestone.id,
      title: milestone.title,
      projectTitle: milestone.projects?.title || 'Unknown Project',
      status: milestone.status,
      targetDate: milestone.target_date,
      tasksTotal: milestoneTasks.length,
      tasksCompleted: completedTasks.length,
      percentComplete,
    };
  });
}

function calculateAreaFocusDistribution(
  completedTasks: Array<{ boards?: { projects?: { area_id?: string; areas?: { name: string } } } }>
): Record<string, number> {
  const areaCounts: Record<string, number> = {};
  let total = 0;

  completedTasks.forEach(task => {
    const areaName = task.boards?.projects?.areas?.name || 'Unassigned';
    areaCounts[areaName] = (areaCounts[areaName] || 0) + 1;
    total++;
  });

  // Convert to percentages
  const distribution: Record<string, number> = {};
  Object.entries(areaCounts).forEach(([area, count]) => {
    distribution[area] = total > 0 ? Math.round((count / total) * 100) : 0;
  });

  return distribution;
}
