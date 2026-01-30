// AI Summary Service for generating report insights using OpenAI
// This service is used by the report generator to add AI-powered analysis

import type {
  TaskSummary,
  MilestoneProgress,
  TrendData,
} from '@/types/database';

/**
 * Generate AI insights for a daily report
 */
export async function generateDailyInsights(data: {
  tasksCompleted: TaskSummary[];
  tasksStarted: TaskSummary[];
  tasksBlocked: TaskSummary[];
  date: string;
}): Promise<string> {
  const prompt = buildDailyPrompt(data);
  return callOpenAI(prompt);
}

/**
 * Generate AI insights for a weekly report
 */
export async function generateWeeklyInsights(data: {
  velocityPoints: number;
  milestonesProgress: MilestoneProgress[];
  areaFocusDistribution: Record<string, number>;
  topAccomplishments: string[];
  weekStart: string;
  weekEnd: string;
}): Promise<string> {
  const prompt = buildWeeklyPrompt(data);
  return callOpenAI(prompt);
}

/**
 * Generate AI insights for a monthly report
 */
export async function generateMonthlyInsights(data: {
  month: string;
  goalsAchieved: number;
  projectsCompleted: number;
  overallProgress: number;
  trendAnalysis: TrendData;
}): Promise<string> {
  const prompt = buildMonthlyPrompt(data);
  return callOpenAI(prompt);
}

/**
 * Generate strategic recommendations for monthly reports
 */
export async function generateStrategicRecommendations(data: {
  trendAnalysis: TrendData;
  focusAreas: string[];
  projectsInProgress: number;
  upcomingMilestones: number;
}): Promise<string[]> {
  const prompt = buildRecommendationsPrompt(data);
  const response = await callOpenAI(prompt);
  
  // Parse the response as a list of recommendations
  const lines = response.split('\n').filter(line => line.trim().length > 0);
  return lines.map(line => line.replace(/^[\d\.\-\*]\s*/, '').trim()).slice(0, 5);
}

/**
 * Build the prompt for daily insights
 */
function buildDailyPrompt(data: {
  tasksCompleted: TaskSummary[];
  tasksStarted: TaskSummary[];
  tasksBlocked: TaskSummary[];
  date: string;
}): string {
  return `Analyze this daily productivity report and provide 2-3 sentences of actionable insights:

Date: ${data.date}
Tasks Completed: ${data.tasksCompleted.length}
Tasks Started: ${data.tasksStarted.length}
Tasks Blocked: ${data.tasksBlocked.length}

Completed Tasks:
${data.tasksCompleted.map(t => `- ${t.title} (${t.priority})`).join('\n') || 'None'}

Blocked Tasks:
${data.tasksBlocked.map(t => `- ${t.title} (${t.priority})`).join('\n') || 'None'}

Provide brief, actionable insights about the day's productivity and any immediate focus areas.`;
}

/**
 * Build the prompt for weekly insights
 */
function buildWeeklyPrompt(data: {
  velocityPoints: number;
  milestonesProgress: MilestoneProgress[];
  areaFocusDistribution: Record<string, number>;
  topAccomplishments: string[];
  weekStart: string;
  weekEnd: string;
}): string {
  const areas = Object.entries(data.areaFocusDistribution)
    .map(([area, hours]) => `${area}: ${hours}%`)
    .join(', ');

  return `Analyze this weekly productivity report and provide 3-4 sentences of strategic insights:

Week: ${data.weekStart} to ${data.weekEnd}
Velocity Points: ${data.velocityPoints}
Milestones in Progress: ${data.milestonesProgress.filter(m => m.status === 'in_progress').length}
Milestones Completed: ${data.milestonesProgress.filter(m => m.status === 'completed').length}

Area Focus Distribution: ${areas || 'Not tracked'}

Top Accomplishments:
${data.topAccomplishments.map(a => `- ${a}`).join('\n') || 'None recorded'}

Provide strategic insights about the week's productivity, goal progress, and suggested focus for next week.`;
}

/**
 * Build the prompt for monthly insights
 */
function buildMonthlyPrompt(data: {
  month: string;
  goalsAchieved: number;
  projectsCompleted: number;
  overallProgress: number;
  trendAnalysis: TrendData;
}): string {
  return `Analyze this monthly productivity report and provide 4-5 sentences of comprehensive insights:

Month: ${data.month}
Goals Achieved: ${data.goalsAchieved}
Projects Completed: ${data.projectsCompleted}
Overall Progress: ${data.overallProgress}%

Velocity Trend: ${data.trendAnalysis.velocityTrend} (${data.trendAnalysis.velocityChange > 0 ? '+' : ''}${data.trendAnalysis.velocityChange}%)
Productivity Trend: ${data.trendAnalysis.productivityTrend}

Comparison to Previous Month:
- Tasks Completed: ${data.trendAnalysis.comparisonToPrevious.tasksCompleted.current} (previous: ${data.trendAnalysis.comparisonToPrevious.tasksCompleted.previous})
- Projects Completed: ${data.trendAnalysis.comparisonToPrevious.projectsCompleted.current} (previous: ${data.trendAnalysis.comparisonToPrevious.projectsCompleted.previous})

Focus Areas: ${data.trendAnalysis.focusAreas.join(', ') || 'Not specified'}

Provide comprehensive insights about monthly performance, trends, and strategic outlook.`;
}

/**
 * Build the prompt for strategic recommendations
 */
function buildRecommendationsPrompt(data: {
  trendAnalysis: TrendData;
  focusAreas: string[];
  projectsInProgress: number;
  upcomingMilestones: number;
}): string {
  return `Based on this productivity data, provide 3-5 specific, actionable strategic recommendations:

Velocity Trend: ${data.trendAnalysis.velocityTrend}
Productivity Trend: ${data.trendAnalysis.productivityTrend}
Projects in Progress: ${data.projectsInProgress}
Upcoming Milestones: ${data.upcomingMilestones}
Current Focus Areas: ${data.focusAreas.join(', ') || 'Not specified'}

Each recommendation should be:
- Specific and actionable
- Related to improving productivity or achieving goals
- Concise (one sentence each)

List recommendations, one per line:`;
}

/**
 * Call OpenAI API to generate insights
 * Falls back to a generated summary if API is not available
 */
async function callOpenAI(prompt: string): Promise<string> {
  const apiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY || process.env.OPENAI_API_KEY;
  
  if (!apiKey) {
    // Return a fallback summary when API key is not available
    return generateFallbackSummary(prompt);
  }

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are a productivity analyst helping a user understand their work patterns and progress. Provide concise, actionable insights.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        max_tokens: 300,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      console.error('OpenAI API error:', await response.text());
      return generateFallbackSummary(prompt);
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || generateFallbackSummary(prompt);
  } catch (error) {
    console.error('Error calling OpenAI:', error);
    return generateFallbackSummary(prompt);
  }
}

/**
 * Generate a fallback summary when OpenAI is not available
 */
function generateFallbackSummary(prompt: string): string {
  // Extract key metrics from the prompt
  const tasksMatch = prompt.match(/Tasks Completed: (\d+)/);
  const velocityMatch = prompt.match(/Velocity Points: (\d+)/);
  const goalsMatch = prompt.match(/Goals Achieved: (\d+)/);
  const progressMatch = prompt.match(/Overall Progress: (\d+)%/);

  if (tasksMatch) {
    const completed = parseInt(tasksMatch[1]);
    const blockedMatch = prompt.match(/Tasks Blocked: (\d+)/);
    const blocked = blockedMatch ? parseInt(blockedMatch[1]) : 0;
    
    if (blocked > 0) {
      return `Completed ${completed} task${completed !== 1 ? 's' : ''} today with ${blocked} blocked item${blocked !== 1 ? 's' : ''} requiring attention. Consider reviewing blockers early tomorrow to maintain momentum.`;
    }
    return `Productive day with ${completed} task${completed !== 1 ? 's' : ''} completed. Keep the momentum going!`;
  }

  if (velocityMatch) {
    const velocity = parseInt(velocityMatch[1]);
    return `Strong week with ${velocity} velocity points achieved. Continue focusing on high-impact tasks to maintain this pace.`;
  }

  if (goalsMatch && progressMatch) {
    const goals = parseInt(goalsMatch[1]);
    const progress = parseInt(progressMatch[1]);
    return `Made solid progress this month with ${goals} goal${goals !== 1 ? 's' : ''} achieved and ${progress}% overall progress. Review strategic priorities to ensure continued alignment with long-term objectives.`;
  }

  return 'Review your progress and adjust priorities as needed to stay on track with your goals.';
}
