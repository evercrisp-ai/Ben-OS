'use client';

import { useReport, isDailyReport, isWeeklyReport, isMonthlyReport } from '@/hooks/use-reports';
import { downloadAsMarkdown, downloadAsPDF } from '@/lib/report-exporter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import {
  FileText,
  FileDown,
  CalendarDays,
  TrendingUp,
  TrendingDown,
  Minus,
  CheckCircle2,
  AlertCircle,
  Clock,
  Target,
  Lightbulb,
  Bot,
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import type {
  Report,
  DailyReport,
  WeeklyReport,
  MonthlyReport,
  TaskSummary,
  MilestoneProgress,
} from '@/types/database';

interface ReportViewerProps {
  reportId: string;
}

export function ReportViewer({ reportId }: ReportViewerProps) {
  const { data: report, isLoading, error } = useReport(reportId);

  if (isLoading) {
    return <ReportViewerSkeleton />;
  }

  if (error || !report) {
    return (
      <Card data-testid="report-error">
        <CardContent className="py-10 text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground" />
          <p className="mt-4 text-muted-foreground">
            {error?.message || 'Report not found'}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6" data-testid="report-content">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">
            {getReportTitle(report)}
          </h1>
          <p className="text-muted-foreground">
            Generated on {format(parseISO(report.generated_at), 'MMM d, yyyy h:mm a')}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => downloadAsMarkdown(report)}
            data-testid="export-markdown"
          >
            <FileText className="mr-2 h-4 w-4" />
            Markdown
          </Button>
          <Button
            variant="outline"
            onClick={() => downloadAsPDF(report)}
            data-testid="export-pdf"
          >
            <FileDown className="mr-2 h-4 w-4" />
            PDF
          </Button>
        </div>
      </div>

      {/* Report Content */}
      {isDailyReport(report) && (
        <DailyReportContent report={report.content as unknown as DailyReport} />
      )}
      {isWeeklyReport(report) && (
        <WeeklyReportContent report={report.content as unknown as WeeklyReport} />
      )}
      {isMonthlyReport(report) && (
        <MonthlyReportContent report={report.content as unknown as MonthlyReport} />
      )}
    </div>
  );
}

function DailyReportContent({ report }: { report: DailyReport }) {
  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <SummaryCard
          title="Completed"
          value={report.tasksCompleted.length}
          icon={CheckCircle2}
          color="text-green-500"
        />
        <SummaryCard
          title="Started"
          value={report.tasksStarted.length}
          icon={Clock}
          color="text-blue-500"
        />
        <SummaryCard
          title="Blocked"
          value={report.tasksBlocked.length}
          icon={AlertCircle}
          color="text-red-500"
        />
      </div>

      {/* Tasks Completed */}
      {report.tasksCompleted.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              Tasks Completed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <TaskList tasks={report.tasksCompleted} />
          </CardContent>
        </Card>
      )}

      {/* Tasks Started */}
      {report.tasksStarted.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-blue-500" />
              Tasks Started
            </CardTitle>
          </CardHeader>
          <CardContent>
            <TaskList tasks={report.tasksStarted} />
          </CardContent>
        </Card>
      )}

      {/* Blocked Tasks */}
      {report.tasksBlocked.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-500" />
              Blocked Tasks
            </CardTitle>
          </CardHeader>
          <CardContent>
            <TaskList tasks={report.tasksBlocked} />
          </CardContent>
        </Card>
      )}

      {/* Agent Activity */}
      {report.agentActivity.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bot className="h-5 w-5" />
              Agent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {report.agentActivity.map(agent => (
                <div
                  key={agent.agentId}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <span className="font-medium">{agent.agentName}</span>
                  <div className="flex gap-4 text-sm text-muted-foreground">
                    <span>{agent.tasksCompleted} completed</span>
                    <span>{agent.tasksCreated} created</span>
                    <span>{agent.actionsPerformed} actions</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* AI Insights */}
      {report.aiInsights && (
        <InsightsCard insights={report.aiInsights} />
      )}
    </div>
  );
}

function WeeklyReportContent({ report }: { report: WeeklyReport }) {
  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <SummaryCard
          title="Velocity Points"
          value={report.velocityPoints}
          icon={TrendingUp}
          color="text-indigo-500"
        />
        <SummaryCard
          title="In Progress"
          value={report.milestonesProgress.filter(m => m.status === 'in_progress').length}
          icon={Clock}
          color="text-blue-500"
        />
        <SummaryCard
          title="Completed"
          value={report.milestonesProgress.filter(m => m.status === 'completed').length}
          icon={CheckCircle2}
          color="text-green-500"
        />
      </div>

      {/* Top Accomplishments */}
      {report.topAccomplishments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-indigo-500" />
              Top Accomplishments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="list-decimal list-inside space-y-2">
              {report.topAccomplishments.map((accomplishment, i) => (
                <li key={i} className="text-sm">
                  {accomplishment}
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>
      )}

      {/* Milestone Progress */}
      {report.milestonesProgress.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5" />
              Milestone Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <MilestoneProgressList milestones={report.milestonesProgress} />
          </CardContent>
        </Card>
      )}

      {/* Area Focus Distribution */}
      {Object.keys(report.areaFocusDistribution).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Area Focus Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(report.areaFocusDistribution).map(([area, percentage]) => (
                <div key={area} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>{area}</span>
                    <span className="text-muted-foreground">{percentage}%</span>
                  </div>
                  <Progress value={percentage} className="h-2" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* AI Insights */}
      {report.aiInsights && (
        <InsightsCard insights={report.aiInsights} />
      )}
    </div>
  );
}

function MonthlyReportContent({ report }: { report: MonthlyReport }) {
  const getTrendIcon = (trend: 'increasing' | 'stable' | 'decreasing') => {
    switch (trend) {
      case 'increasing':
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'decreasing':
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      default:
        return <Minus className="h-4 w-4 text-gray-500" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <SummaryCard
          title="Overall Progress"
          value={`${report.overallProgress}%`}
          icon={Target}
          color="text-indigo-500"
        />
        <SummaryCard
          title="Goals Achieved"
          value={report.goalsAchieved.length}
          icon={CheckCircle2}
          color="text-green-500"
        />
        <SummaryCard
          title="Projects Completed"
          value={report.projectsCompleted.length}
          icon={CheckCircle2}
          color="text-blue-500"
        />
        <Card className="p-4">
          <div className="flex items-center gap-2">
            {getTrendIcon(report.trendAnalysis.velocityTrend)}
            <span className="text-sm text-muted-foreground">Velocity</span>
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-2xl font-bold">
              {report.trendAnalysis.velocityChange > 0 ? '+' : ''}
              {report.trendAnalysis.velocityChange}%
            </span>
          </div>
        </Card>
      </div>

      {/* Trend Analysis */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Trend Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-lg border p-4">
              <h4 className="text-sm font-medium text-muted-foreground">
                Tasks Completed
              </h4>
              <div className="mt-2 flex items-center gap-4">
                <span className="text-2xl font-bold">
                  {report.trendAnalysis.comparisonToPrevious.tasksCompleted.current}
                </span>
                <span className="text-sm text-muted-foreground">
                  vs {report.trendAnalysis.comparisonToPrevious.tasksCompleted.previous} last month
                </span>
              </div>
            </div>
            <div className="rounded-lg border p-4">
              <h4 className="text-sm font-medium text-muted-foreground">
                Projects Completed
              </h4>
              <div className="mt-2 flex items-center gap-4">
                <span className="text-2xl font-bold">
                  {report.trendAnalysis.comparisonToPrevious.projectsCompleted.current}
                </span>
                <span className="text-sm text-muted-foreground">
                  vs {report.trendAnalysis.comparisonToPrevious.projectsCompleted.previous} last month
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Goals Achieved */}
      {report.goalsAchieved.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              Goals Achieved
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {report.goalsAchieved.map(goal => (
                <div
                  key={goal.id}
                  className="flex items-start gap-3 rounded-lg border p-3"
                >
                  <CheckCircle2 className="mt-0.5 h-5 w-5 text-green-500" />
                  <div>
                    <span className="font-medium">{goal.title}</span>
                    <Badge variant="outline" className="ml-2">
                      {goal.type}
                    </Badge>
                    {goal.description && (
                      <p className="mt-1 text-sm text-muted-foreground">
                        {goal.description}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Strategic Recommendations */}
      {report.strategicRecommendations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-yellow-500" />
              Strategic Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="list-decimal list-inside space-y-2">
              {report.strategicRecommendations.map((rec, i) => (
                <li key={i} className="text-sm">
                  {rec}
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>
      )}

      {/* AI Insights */}
      {report.aiInsights && (
        <InsightsCard insights={report.aiInsights} />
      )}
    </div>
  );
}

// Shared components

function SummaryCard({
  title,
  value,
  icon: Icon,
  color,
}: {
  title: string;
  value: number | string;
  icon: React.ElementType;
  color: string;
}) {
  return (
    <Card className="p-4">
      <div className="flex items-center gap-2">
        <Icon className={`h-5 w-5 ${color}`} />
        <span className="text-sm text-muted-foreground">{title}</span>
      </div>
      <div className="mt-2 text-3xl font-bold">{value}</div>
    </Card>
  );
}

function TaskList({ tasks }: { tasks: TaskSummary[] }) {
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'high':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      default:
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    }
  };

  return (
    <div className="space-y-2">
      {tasks.map(task => (
        <div
          key={task.id}
          className="flex items-center justify-between rounded-lg border p-3"
        >
          <div className="flex items-center gap-3">
            <span>{task.title}</span>
            <Badge className={getPriorityColor(task.priority)}>
              {task.priority}
            </Badge>
          </div>
          {task.projectTitle && (
            <span className="text-sm text-muted-foreground">
              {task.projectTitle}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}

function MilestoneProgressList({ milestones }: { milestones: MilestoneProgress[] }) {
  return (
    <div className="space-y-4">
      {milestones.map(milestone => (
        <div key={milestone.id} className="space-y-2">
          <div className="flex items-center justify-between">
            <div>
              <span className="font-medium">{milestone.title}</span>
              <span className="ml-2 text-sm text-muted-foreground">
                {milestone.projectTitle}
              </span>
            </div>
            <Badge variant={milestone.status === 'completed' ? 'default' : 'outline'}>
              {milestone.status}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <Progress value={milestone.percentComplete} className="flex-1" />
            <span className="text-sm text-muted-foreground">
              {milestone.tasksCompleted}/{milestone.tasksTotal} tasks ({milestone.percentComplete}%)
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

function InsightsCard({ insights }: { insights: string }) {
  return (
    <Card className="border-indigo-200 bg-indigo-50 dark:border-indigo-800 dark:bg-indigo-950">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-indigo-700 dark:text-indigo-300">
          <Lightbulb className="h-5 w-5" />
          AI Insights
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-indigo-900 dark:text-indigo-100">{insights}</p>
      </CardContent>
    </Card>
  );
}

function ReportViewerSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-32" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-10 w-28" />
          <Skeleton className="h-10 w-20" />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
      </div>
      <Skeleton className="h-64" />
    </div>
  );
}

function getReportTitle(report: Report): string {
  const type = report.type.charAt(0).toUpperCase() + report.type.slice(1);
  const date = format(parseISO(report.period_start), 'MMM d, yyyy');
  return `${type} Report - ${date}`;
}
