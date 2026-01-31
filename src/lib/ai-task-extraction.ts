// AI Task Extraction Service for generating tasks from PRD content using OpenAI
// This service analyzes PRD content and extracts actionable tasks

import type { TaskPriority } from '@/types/database';

export interface ExtractedTask {
  title: string;
  description: string;
  priority: TaskPriority;
  story_points: number | null;
  suggested_column: 'backlog' | 'todo';
}

export interface TaskExtractionResult {
  tasks: ExtractedTask[];
  summary: string;
  raw_response?: string;
}

/**
 * Extract tasks from PRD content using AI
 */
export async function extractTasksFromPRD(
  prdTitle: string,
  prdContent: string,
  sections?: { title: string; content: string }[]
): Promise<TaskExtractionResult> {
  const prompt = buildExtractionPrompt(prdTitle, prdContent, sections);
  return callOpenAI(prompt);
}

/**
 * Build the prompt for task extraction
 */
function buildExtractionPrompt(
  title: string,
  content: string,
  sections?: { title: string; content: string }[]
): string {
  let prdText = `# ${title}\n\n`;
  
  if (sections && sections.length > 0) {
    sections.forEach((section) => {
      prdText += `## ${section.title}\n${section.content}\n\n`;
    });
  } else if (content) {
    prdText += content;
  }

  return `You are a product manager analyzing a Product Requirements Document (PRD) to extract actionable development tasks.

Analyze the following PRD and extract specific, actionable tasks that need to be completed:

${prdText}

For each task, provide:
1. A clear, concise title (max 100 characters)
2. A brief description explaining what needs to be done
3. Priority: low, medium, high, or critical
4. Story points estimate (1, 2, 3, 5, 8, or 13 using Fibonacci scale)
5. Whether it should go in "backlog" or "todo" column

Respond in JSON format with this structure:
{
  "summary": "Brief summary of what this PRD is about and the work involved",
  "tasks": [
    {
      "title": "Task title",
      "description": "What needs to be done",
      "priority": "medium",
      "story_points": 3,
      "suggested_column": "backlog"
    }
  ]
}

Guidelines:
- Extract 3-10 tasks depending on PRD complexity
- Tasks should be specific and actionable, not vague
- Prioritize based on dependencies and business impact
- Higher story points for complex/uncertain work
- Put foundational/blocking tasks in "todo", others in "backlog"
- Include both technical implementation tasks and any required research/design tasks`;
}

/**
 * Call OpenAI API to extract tasks
 * Falls back to a basic extraction if API is not available
 */
async function callOpenAI(prompt: string): Promise<TaskExtractionResult> {
  const apiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY || process.env.OPENAI_API_KEY;
  
  if (!apiKey) {
    // Return a fallback extraction when API key is not available
    return generateFallbackTasks(prompt);
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
            content: 'You are a product manager who extracts actionable development tasks from PRDs. Always respond with valid JSON.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        max_tokens: 2000,
        temperature: 0.7,
        response_format: { type: 'json_object' },
      }),
    });

    if (!response.ok) {
      console.error('OpenAI API error:', await response.text());
      return generateFallbackTasks(prompt);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;
    
    if (!content) {
      return generateFallbackTasks(prompt);
    }

    try {
      const parsed = JSON.parse(content) as {
        summary?: string;
        tasks?: Array<{
          title: string;
          description: string;
          priority: string;
          story_points: number;
          suggested_column: string;
        }>;
      };
      
      // Validate and normalize the response
      const tasks: ExtractedTask[] = (parsed.tasks || []).map((task) => ({
        title: task.title?.slice(0, 300) || 'Untitled Task',
        description: task.description || '',
        priority: validatePriority(task.priority),
        story_points: validateStoryPoints(task.story_points),
        suggested_column: task.suggested_column === 'todo' ? 'todo' : 'backlog',
      }));

      return {
        tasks,
        summary: parsed.summary || 'Tasks extracted from PRD',
        raw_response: content,
      };
    } catch (parseError) {
      console.error('Failed to parse OpenAI response:', parseError);
      return generateFallbackTasks(prompt);
    }
  } catch (error) {
    console.error('Error calling OpenAI:', error);
    return generateFallbackTasks(prompt);
  }
}

/**
 * Validate priority value
 */
function validatePriority(priority: string): TaskPriority {
  const validPriorities: TaskPriority[] = ['low', 'medium', 'high', 'critical'];
  const normalized = priority?.toLowerCase() as TaskPriority;
  return validPriorities.includes(normalized) ? normalized : 'medium';
}

/**
 * Validate story points value
 */
function validateStoryPoints(points: number): number | null {
  const validPoints = [1, 2, 3, 5, 8, 13, 21];
  if (typeof points === 'number' && validPoints.includes(points)) {
    return points;
  }
  return null;
}

/**
 * Generate fallback tasks when OpenAI is not available
 * This provides a basic extraction based on section headers
 */
function generateFallbackTasks(prompt: string): TaskExtractionResult {
  // Extract the PRD title from the prompt
  const titleMatch = prompt.match(/^# (.+)$/m);
  const title = titleMatch?.[1] || 'PRD';

  // Generate some basic tasks based on common PRD sections
  const tasks: ExtractedTask[] = [
    {
      title: `Review and finalize requirements for ${title}`,
      description: 'Review the PRD content and ensure all requirements are clear and complete',
      priority: 'high',
      story_points: 2,
      suggested_column: 'todo',
    },
    {
      title: `Design technical architecture for ${title}`,
      description: 'Create technical design document and architecture diagrams',
      priority: 'high',
      story_points: 5,
      suggested_column: 'todo',
    },
    {
      title: `Implement core functionality for ${title}`,
      description: 'Develop the main features outlined in the PRD',
      priority: 'medium',
      story_points: 8,
      suggested_column: 'backlog',
    },
    {
      title: `Write tests for ${title}`,
      description: 'Create unit tests and integration tests for the implementation',
      priority: 'medium',
      story_points: 3,
      suggested_column: 'backlog',
    },
    {
      title: `Documentation for ${title}`,
      description: 'Write user documentation and update technical docs',
      priority: 'low',
      story_points: 2,
      suggested_column: 'backlog',
    },
  ];

  return {
    tasks,
    summary: `Generated placeholder tasks for "${title}". Enable OpenAI API key for AI-powered task extraction.`,
  };
}

/**
 * Estimate total effort from extracted tasks
 */
export function estimateTotalEffort(tasks: ExtractedTask[]): {
  totalPoints: number;
  taskCount: number;
  priorityBreakdown: Record<TaskPriority, number>;
} {
  const priorityBreakdown: Record<TaskPriority, number> = {
    low: 0,
    medium: 0,
    high: 0,
    critical: 0,
  };

  let totalPoints = 0;

  tasks.forEach((task) => {
    totalPoints += task.story_points || 0;
    priorityBreakdown[task.priority]++;
  });

  return {
    totalPoints,
    taskCount: tasks.length,
    priorityBreakdown,
  };
}
