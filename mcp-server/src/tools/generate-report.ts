// generate_report tool - Creates summary reports on demand
import { getSupabaseClient, ReportType, Json, Task, Milestone, Project } from '../lib/supabase.js';
import {
  format,
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  parseISO,
} from 'date-fns';

export interface GenerateReportInput {
  type: ReportType;
  date?: string; // For daily reports, or week containing date, or month
}

interface TaskSummary {
  id: string;
  title: string;
  status: string;
  priority: string;
  projectTitle?: string;
  completedAt?: string;
  storyPoints?: number | null;
}

interface MilestoneProgress {
  id: string;
  title: string;
  projectTitle: string;
  status: string;
  targetDate: string | null;
  tasksTotal: number;
  tasksCompleted: number;
  percentComplete: number;
}

interface DailyReportContent {
  date: string;
  tasksCompleted: TaskSummary[];
  tasksStarted: TaskSummary[];
  tasksBlocked: TaskSummary[];
  summary: string;
}

interface WeeklyReportContent {
  weekStart: string;
  weekEnd: string;
  velocityPoints: number;
  milestonesProgress: MilestoneProgress[];
  areaFocusDistribution: Record<string, number>;
  topAccomplishments: string[];
  summary: string;
}

interface MonthlyReportContent {
  month: string;
  goalsAchieved: number;
  projectsCompleted: number;
  tasksCompleted: number;
  overallProgress: number;
  summary: string;
}

export interface GenerateReportOutput {
  report: {
    id: string;
    type: ReportType;
    period_start: string;
    period_end: string;
    content: DailyReportContent | WeeklyReportContent | MonthlyReportContent;
    generated_at: string;
  };
}

export async function generateReport(input: GenerateReportInput): Promise<GenerateReportOutput> {
  const supabase = getSupabaseClient();
  const referenceDate = input.date ? parseISO(input.date) : new Date();

  let periodStart: Date;
  let periodEnd: Date;
  let content: DailyReportContent | WeeklyReportContent | MonthlyReportContent;

  if (input.type === 'daily') {
    periodStart = startOfDay(referenceDate);
    periodEnd = endOfDay(referenceDate);
    content = await generateDailyContent(supabase, periodStart, periodEnd);
  } else if (input.type === 'weekly') {
    periodStart = startOfWeek(referenceDate, { weekStartsOn: 1 });
    periodEnd = endOfWeek(referenceDate, { weekStartsOn: 1 });
    content = await generateWeeklyContent(supabase, periodStart, periodEnd);
  } else {
    periodStart = startOfMonth(referenceDate);
    periodEnd = endOfMonth(referenceDate);
    content = await generateMonthlyContent(supabase, periodStart, periodEnd);
  }

  // Save the report
  const { data: report, error } = await supabase
    .from('reports')
    .insert({
      type: input.type,
      period_start: format(periodStart, 'yyyy-MM-dd'),
      period_end: format(periodEnd, 'yyyy-MM-dd'),
      content: content as unknown as Json,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to save report: ${error.message}`);
  }

  return {
    report: {
      id: report.id,
      type: report.type,
      period_start: report.period_start,
      period_end: report.period_end,
      content,
      generated_at: report.generated_at,
    },
  };
}

async function generateDailyContent(
  supabase: ReturnType<typeof getSupabaseClient>,
  periodStart: Date,
  periodEnd: Date
): Promise<DailyReportContent> {
  const startStr = periodStart.toISOString();
  const endStr = periodEnd.toISOString();

  // Fetch completed tasks
  const { data: completedTasks } = await supabase
    .from('tasks')
    .select('*, boards(project_id, projects(title))')
    .eq('status', 'done')
    .gte('completed_at', startStr)
    .lte('completed_at', endStr);

  // Fetch started tasks
  const { data: startedTasks } = await supabase
    .from('tasks')
    .select('*, boards(project_id, projects(title))')
    .eq('status', 'in_progress')
    .gte('updated_at', startStr)
    .lte('updated_at', endStr);

  // Fetch blocked tasks (in review)
  const { data: blockedTasks } = await supabase
    .from('tasks')
    .select('*, boards(project_id, projects(title))')
    .eq('status', 'review');

  const transformTask = (t: Task & { boards?: { projects?: { title: string } } }): TaskSummary => ({
    id: t.id,
    title: t.title,
    status: t.status,
    priority: t.priority,
    projectTitle: t.boards?.projects?.title,
    completedAt: t.completed_at || undefined,
    storyPoints: t.story_points,
  });

  const tasksCompletedList = (completedTasks || []).map(transformTask);
  const tasksStartedList = (startedTasks || []).map(transformTask);
  const tasksBlockedList = (blockedTasks || []).map(transformTask);

  return {
    date: format(periodStart, 'yyyy-MM-dd'),
    tasksCompleted: tasksCompletedList,
    tasksStarted: tasksStartedList,
    tasksBlocked: tasksBlockedList,
    summary: `Daily report: ${tasksCompletedList.length} tasks completed, ${tasksStartedList.length} tasks started, ${tasksBlockedList.length} tasks in review.`,
  };
}

async function generateWeeklyContent(
  supabase: ReturnType<typeof getSupabaseClient>,
  periodStart: Date,
  periodEnd: Date
): Promise<WeeklyReportContent> {
  const startStr = periodStart.toISOString();
  const endStr = periodEnd.toISOString();

  // Fetch completed tasks with story points
  const { data: completedTasks } = await supabase
    .from('tasks')
    .select('*, boards(project_id, projects(title, area_id, areas(name)))')
    .eq('status', 'done')
    .gte('completed_at', startStr)
    .lte('completed_at', endStr);

  const velocityPoints = (completedTasks || []).reduce(
    (sum, t) => sum + (t.story_points || 0),
    0
  );

  // Fetch milestones and their tasks
  const { data: milestones } = await supabase
    .from('milestones')
    .select('*, projects(title)')
    .in('status', ['pending', 'in_progress', 'completed']);

  const { data: allTasks } = await supabase
    .from('tasks')
    .select('milestone_id, status');

  const milestonesProgress: MilestoneProgress[] = (milestones || []).map((m: Milestone & { projects?: { title: string } }) => {
    const mTasks = (allTasks || []).filter((t) => t.milestone_id === m.id);
    const completedCount = mTasks.filter((t) => t.status === 'done').length;
    return {
      id: m.id,
      title: m.title,
      projectTitle: m.projects?.title || 'Unknown',
      status: m.status,
      targetDate: m.target_date,
      tasksTotal: mTasks.length,
      tasksCompleted: completedCount,
      percentComplete: mTasks.length > 0 ? Math.round((completedCount / mTasks.length) * 100) : 0,
    };
  });

  // Calculate area focus distribution
  const areaCounts: Record<string, number> = {};
  let total = 0;
  (completedTasks || []).forEach((t: Task & { boards?: { projects?: { areas?: { name: string } } } }) => {
    const areaName = t.boards?.projects?.areas?.name || 'Unassigned';
    areaCounts[areaName] = (areaCounts[areaName] || 0) + 1;
    total++;
  });

  const areaFocusDistribution: Record<string, number> = {};
  Object.entries(areaCounts).forEach(([area, count]) => {
    areaFocusDistribution[area] = total > 0 ? Math.round((count / total) * 100) : 0;
  });

  // Top accomplishments
  const topAccomplishments = (completedTasks || [])
    .filter((t) => t.priority === 'critical' || t.priority === 'high')
    .slice(0, 5)
    .map((t) => t.title);

  return {
    weekStart: format(periodStart, 'yyyy-MM-dd'),
    weekEnd: format(periodEnd, 'yyyy-MM-dd'),
    velocityPoints,
    milestonesProgress,
    areaFocusDistribution,
    topAccomplishments,
    summary: `Weekly report: ${velocityPoints} story points completed, ${(completedTasks || []).length} tasks done.`,
  };
}

async function generateMonthlyContent(
  supabase: ReturnType<typeof getSupabaseClient>,
  periodStart: Date,
  periodEnd: Date
): Promise<MonthlyReportContent> {
  const startStr = periodStart.toISOString();
  const endStr = periodEnd.toISOString();

  // Fetch completed tasks
  const { data: completedTasks } = await supabase
    .from('tasks')
    .select('id')
    .eq('status', 'done')
    .gte('completed_at', startStr)
    .lte('completed_at', endStr);

  // Fetch completed projects
  const { data: completedProjects } = await supabase
    .from('projects')
    .select('id')
    .eq('status', 'completed')
    .gte('updated_at', startStr)
    .lte('updated_at', endStr);

  // Fetch completed milestones
  const { data: completedMilestones } = await supabase
    .from('milestones')
    .select('id')
    .eq('status', 'completed')
    .gte('updated_at', startStr)
    .lte('updated_at', endStr);

  // Calculate overall progress
  const { count: totalTasks } = await supabase
    .from('tasks')
    .select('id', { count: 'exact', head: true });

  const { count: doneTasks } = await supabase
    .from('tasks')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'done');

  const overallProgress = totalTasks ? Math.round(((doneTasks || 0) / totalTasks) * 100) : 0;

  const goalsAchieved = (completedProjects?.length || 0) + (completedMilestones?.length || 0);

  return {
    month: format(periodStart, 'yyyy-MM'),
    goalsAchieved,
    projectsCompleted: completedProjects?.length || 0,
    tasksCompleted: completedTasks?.length || 0,
    overallProgress,
    summary: `Monthly report: ${goalsAchieved} goals achieved, ${completedProjects?.length || 0} projects completed, ${completedTasks?.length || 0} tasks done. Overall progress: ${overallProgress}%.`,
  };
}

export const generateReportTool = {
  name: 'generate_report',
  description: 'Generate a summary report (daily, weekly, or monthly). The report is saved to the database and returned.',
  inputSchema: {
    type: 'object' as const,
    properties: {
      type: {
        type: 'string',
        enum: ['daily', 'weekly', 'monthly'],
        description: 'Type of report to generate',
      },
      date: {
        type: 'string',
        description: 'Reference date in ISO format (defaults to today). For weekly reports, uses the week containing this date. For monthly reports, uses the month containing this date.',
      },
    },
    required: ['type'],
  },
  handler: generateReport,
};
