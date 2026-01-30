// Report Exporter Service
// Exports reports as PDF or Markdown

import type {
  Report,
  DailyReport,
  WeeklyReport,
  MonthlyReport,
  ReportType,
} from '@/types/database';
import { format, parseISO } from 'date-fns';

/**
 * Export a report as Markdown
 */
export function exportAsMarkdown(report: Report): string {
  const type = report.type as ReportType;
  const content = report.content as unknown as DailyReport | WeeklyReport | MonthlyReport;

  switch (type) {
    case 'daily':
      return generateDailyMarkdown(content as DailyReport);
    case 'weekly':
      return generateWeeklyMarkdown(content as WeeklyReport);
    case 'monthly':
      return generateMonthlyMarkdown(content as MonthlyReport);
    default:
      return '# Report\n\nUnsupported report type.';
  }
}

/**
 * Download a report as Markdown file
 */
export function downloadAsMarkdown(report: Report): void {
  const markdown = exportAsMarkdown(report);
  const filename = getReportFilename(report, 'md');
  downloadFile(markdown, filename, 'text/markdown');
}

/**
 * Export a report as PDF using browser print
 */
export function exportAsPDF(report: Report): void {
  const markdown = exportAsMarkdown(report);
  const html = markdownToHtml(markdown);
  const printWindow = window.open('', '_blank');

  if (printWindow) {
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${getReportTitle(report)}</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              max-width: 800px;
              margin: 40px auto;
              padding: 20px;
              line-height: 1.6;
              color: #333;
            }
            h1 { color: #1a1a1a; border-bottom: 2px solid #6366f1; padding-bottom: 10px; }
            h2 { color: #374151; margin-top: 30px; }
            h3 { color: #4b5563; margin-top: 20px; }
            table { border-collapse: collapse; width: 100%; margin: 15px 0; }
            th, td { border: 1px solid #e5e7eb; padding: 10px; text-align: left; }
            th { background-color: #f9fafb; font-weight: 600; }
            .badge { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 12px; }
            .badge-high { background: #fef2f2; color: #dc2626; }
            .badge-medium { background: #fffbeb; color: #d97706; }
            .badge-low { background: #f0fdf4; color: #16a34a; }
            blockquote { border-left: 4px solid #6366f1; margin: 20px 0; padding: 10px 20px; background: #f8fafc; }
            ul { padding-left: 20px; }
            li { margin: 8px 0; }
            .insights { background: #f0f9ff; border-radius: 8px; padding: 15px; margin: 20px 0; }
            .stat-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin: 15px 0; }
            .stat-card { background: #f9fafb; padding: 15px; border-radius: 8px; text-align: center; }
            .stat-value { font-size: 24px; font-weight: bold; color: #6366f1; }
            .stat-label { font-size: 14px; color: #6b7280; }
            @media print {
              body { margin: 20px; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          ${html}
          <script>
            window.onload = function() {
              window.print();
              window.onafterprint = function() {
                window.close();
              };
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  }
}

/**
 * Download PDF by triggering print dialog
 */
export function downloadAsPDF(report: Report): void {
  exportAsPDF(report);
}

// Helper functions

function generateDailyMarkdown(report: DailyReport): string {
  const lines: string[] = [];

  lines.push(`# Daily Report - ${formatDate(report.date)}`);
  lines.push('');
  lines.push(`*Generated on ${formatDateTime(new Date().toISOString())}*`);
  lines.push('');

  // Summary stats
  lines.push('## Summary');
  lines.push('');
  lines.push(`- **Tasks Completed**: ${report.tasksCompleted.length}`);
  lines.push(`- **Tasks Started**: ${report.tasksStarted.length}`);
  lines.push(`- **Tasks Blocked**: ${report.tasksBlocked.length}`);
  lines.push('');

  // Completed Tasks
  if (report.tasksCompleted.length > 0) {
    lines.push('## Tasks Completed');
    lines.push('');
    lines.push('| Task | Priority | Project |');
    lines.push('|------|----------|---------|');
    report.tasksCompleted.forEach(task => {
      lines.push(`| ${task.title} | ${task.priority} | ${task.projectTitle || '-'} |`);
    });
    lines.push('');
  }

  // Started Tasks
  if (report.tasksStarted.length > 0) {
    lines.push('## Tasks Started');
    lines.push('');
    report.tasksStarted.forEach(task => {
      lines.push(`- ${task.title} (${task.priority})`);
    });
    lines.push('');
  }

  // Blocked Tasks
  if (report.tasksBlocked.length > 0) {
    lines.push('## Blocked Tasks');
    lines.push('');
    report.tasksBlocked.forEach(task => {
      lines.push(`- ⚠️ ${task.title} (${task.priority})`);
    });
    lines.push('');
  }

  // Agent Activity
  if (report.agentActivity.length > 0) {
    lines.push('## Agent Activity');
    lines.push('');
    lines.push('| Agent | Tasks Completed | Tasks Created | Actions |');
    lines.push('|-------|-----------------|---------------|---------|');
    report.agentActivity.forEach(agent => {
      lines.push(`| ${agent.agentName} | ${agent.tasksCompleted} | ${agent.tasksCreated} | ${agent.actionsPerformed} |`);
    });
    lines.push('');
  }

  // AI Insights
  if (report.aiInsights) {
    lines.push('## AI Insights');
    lines.push('');
    lines.push(`> ${report.aiInsights}`);
    lines.push('');
  }

  return lines.join('\n');
}

function generateWeeklyMarkdown(report: WeeklyReport): string {
  const lines: string[] = [];

  lines.push(`# Weekly Report`);
  lines.push(`## ${formatDate(report.weekStart)} - ${formatDate(report.weekEnd)}`);
  lines.push('');
  lines.push(`*Generated on ${formatDateTime(new Date().toISOString())}*`);
  lines.push('');

  // Summary stats
  lines.push('## Summary');
  lines.push('');
  lines.push(`- **Velocity Points**: ${report.velocityPoints}`);
  lines.push(`- **Milestones in Progress**: ${report.milestonesProgress.filter(m => m.status === 'in_progress').length}`);
  lines.push(`- **Milestones Completed**: ${report.milestonesProgress.filter(m => m.status === 'completed').length}`);
  lines.push('');

  // Top Accomplishments
  if (report.topAccomplishments.length > 0) {
    lines.push('## Top Accomplishments');
    lines.push('');
    report.topAccomplishments.forEach((accomplishment, i) => {
      lines.push(`${i + 1}. ${accomplishment}`);
    });
    lines.push('');
  }

  // Milestone Progress
  if (report.milestonesProgress.length > 0) {
    lines.push('## Milestone Progress');
    lines.push('');
    lines.push('| Milestone | Project | Status | Progress |');
    lines.push('|-----------|---------|--------|----------|');
    report.milestonesProgress.forEach(milestone => {
      const progressBar = getProgressBar(milestone.percentComplete);
      lines.push(`| ${milestone.title} | ${milestone.projectTitle} | ${milestone.status} | ${progressBar} ${milestone.percentComplete}% |`);
    });
    lines.push('');
  }

  // Area Focus Distribution
  if (Object.keys(report.areaFocusDistribution).length > 0) {
    lines.push('## Area Focus Distribution');
    lines.push('');
    Object.entries(report.areaFocusDistribution).forEach(([area, percentage]) => {
      lines.push(`- **${area}**: ${percentage}%`);
    });
    lines.push('');
  }

  // AI Insights
  if (report.aiInsights) {
    lines.push('## AI Insights');
    lines.push('');
    lines.push(`> ${report.aiInsights}`);
    lines.push('');
  }

  return lines.join('\n');
}

function generateMonthlyMarkdown(report: MonthlyReport): string {
  const lines: string[] = [];

  lines.push(`# Monthly Report - ${formatMonth(report.month)}`);
  lines.push('');
  lines.push(`*Generated on ${formatDateTime(new Date().toISOString())}*`);
  lines.push('');

  // Summary stats
  lines.push('## Summary');
  lines.push('');
  lines.push(`- **Overall Progress**: ${report.overallProgress}%`);
  lines.push(`- **Goals Achieved**: ${report.goalsAchieved.length}`);
  lines.push(`- **Projects Completed**: ${report.projectsCompleted.length}`);
  lines.push('');

  // Trend Analysis
  lines.push('## Trend Analysis');
  lines.push('');
  lines.push(`- **Velocity Trend**: ${formatTrend(report.trendAnalysis.velocityTrend)} (${report.trendAnalysis.velocityChange > 0 ? '+' : ''}${report.trendAnalysis.velocityChange}%)`);
  lines.push(`- **Productivity Trend**: ${formatTrend(report.trendAnalysis.productivityTrend)}`);
  lines.push('');
  lines.push('### Comparison to Previous Month');
  lines.push('');
  lines.push('| Metric | This Month | Last Month |');
  lines.push('|--------|------------|------------|');
  lines.push(`| Tasks Completed | ${report.trendAnalysis.comparisonToPrevious.tasksCompleted.current} | ${report.trendAnalysis.comparisonToPrevious.tasksCompleted.previous} |`);
  lines.push(`| Projects Completed | ${report.trendAnalysis.comparisonToPrevious.projectsCompleted.current} | ${report.trendAnalysis.comparisonToPrevious.projectsCompleted.previous} |`);
  lines.push('');

  // Goals Achieved
  if (report.goalsAchieved.length > 0) {
    lines.push('## Goals Achieved');
    lines.push('');
    report.goalsAchieved.forEach(goal => {
      lines.push(`- ✅ **${goal.title}** (${goal.type})`);
      if (goal.description) {
        lines.push(`  - ${goal.description}`);
      }
    });
    lines.push('');
  }

  // Projects Completed
  if (report.projectsCompleted.length > 0) {
    lines.push('## Projects Completed');
    lines.push('');
    report.projectsCompleted.forEach(project => {
      lines.push(`- 🎉 **${project.title}**`);
      if (project.description) {
        lines.push(`  - ${project.description}`);
      }
    });
    lines.push('');
  }

  // Strategic Recommendations
  if (report.strategicRecommendations.length > 0) {
    lines.push('## Strategic Recommendations');
    lines.push('');
    report.strategicRecommendations.forEach((rec, i) => {
      lines.push(`${i + 1}. ${rec}`);
    });
    lines.push('');
  }

  // AI Insights
  if (report.aiInsights) {
    lines.push('## AI Insights');
    lines.push('');
    lines.push(`> ${report.aiInsights}`);
    lines.push('');
  }

  return lines.join('\n');
}

function markdownToHtml(markdown: string): string {
  // Simple markdown to HTML conversion
  return markdown
    // Headers
    .replace(/^### (.*$)/gm, '<h3>$1</h3>')
    .replace(/^## (.*$)/gm, '<h2>$1</h2>')
    .replace(/^# (.*$)/gm, '<h1>$1</h1>')
    // Bold and italic
    .replace(/\*\*\*(.*?)\*\*\*/g, '<strong><em>$1</em></strong>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    // Tables
    .replace(/^\|(.+)\|$/gm, (match, content) => {
      const cells = content.split('|').map((c: string) => c.trim());
      const isHeader = cells.some((c: string) => /^-+$/.test(c));
      if (isHeader) return '';
      const cellTag = match.includes('---') ? 'th' : 'td';
      return `<tr>${cells.map((c: string) => `<${cellTag}>${c}</${cellTag}>`).join('')}</tr>`;
    })
    // Wrap table rows
    .replace(/((<tr>.*<\/tr>\n?)+)/g, '<table>$1</table>')
    // Lists
    .replace(/^- (.*$)/gm, '<li>$1</li>')
    .replace(/^(\d+)\. (.*$)/gm, '<li>$2</li>')
    .replace(/((<li>.*<\/li>\n?)+)/g, '<ul>$1</ul>')
    // Blockquotes
    .replace(/^> (.*$)/gm, '<blockquote class="insights">$1</blockquote>')
    // Paragraphs
    .replace(/\n\n/g, '</p><p>')
    .replace(/^(.+)$/gm, (match) => {
      if (match.startsWith('<')) return match;
      return `<p>${match}</p>`;
    })
    // Cleanup
    .replace(/<p><\/p>/g, '')
    .replace(/<p>(<h[1-3]>)/g, '$1')
    .replace(/(<\/h[1-3]>)<\/p>/g, '$1')
    .replace(/<p>(<table>)/g, '$1')
    .replace(/(<\/table>)<\/p>/g, '$1')
    .replace(/<p>(<ul>)/g, '$1')
    .replace(/(<\/ul>)<\/p>/g, '$1')
    .replace(/<p>(<blockquote)/g, '$1')
    .replace(/(<\/blockquote>)<\/p>/g, '$1');
}

function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function getReportFilename(report: Report, extension: string): string {
  const type = report.type;
  const date = report.period_start;
  return `${type}-report-${date}.${extension}`;
}

function getReportTitle(report: Report): string {
  const type = report.type.charAt(0).toUpperCase() + report.type.slice(1);
  return `${type} Report - ${formatDate(report.period_start)}`;
}

function formatDate(dateString: string): string {
  try {
    return format(parseISO(dateString), 'MMM d, yyyy');
  } catch {
    return dateString;
  }
}

function formatDateTime(dateString: string): string {
  try {
    return format(parseISO(dateString), 'MMM d, yyyy h:mm a');
  } catch {
    return dateString;
  }
}

function formatMonth(monthString: string): string {
  try {
    return format(parseISO(`${monthString}-01`), 'MMMM yyyy');
  } catch {
    return monthString;
  }
}

function formatTrend(trend: 'increasing' | 'stable' | 'decreasing'): string {
  switch (trend) {
    case 'increasing':
      return '📈 Increasing';
    case 'decreasing':
      return '📉 Decreasing';
    default:
      return '➡️ Stable';
  }
}

function getProgressBar(percentage: number): string {
  const filled = Math.round(percentage / 10);
  const empty = 10 - filled;
  return '█'.repeat(filled) + '░'.repeat(empty);
}
