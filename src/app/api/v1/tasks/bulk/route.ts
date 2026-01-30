// Tasks Bulk API - POST bulk create/update
import { NextRequest } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';
import {
  applyRateLimit,
  errorResponse,
  successResponse,
  isValidUUID,
  ValidationErrors,
} from '@/lib/api';
import type { TaskInsert, TaskUpdate } from '@/types/database';

interface BulkOperation {
  operation: 'create' | 'update' | 'delete';
  id?: string; // Required for update/delete
  data?: Partial<TaskInsert | TaskUpdate>;
}

interface BulkRequest {
  operations: BulkOperation[];
}

interface BulkResult {
  success: boolean;
  operation: string;
  id?: string;
  data?: unknown;
  error?: string;
}

// POST /api/v1/tasks/bulk - Bulk create/update/delete tasks
export async function POST(request: NextRequest) {
  const { result, headers } = applyRateLimit(request);
  if (!result.allowed) {
    return errorResponse('Rate limit exceeded', 429, headers);
  }

  try {
    const body = await request.json() as BulkRequest;

    if (!body.operations || !Array.isArray(body.operations)) {
      return errorResponse('operations array is required', 400, headers);
    }

    if (body.operations.length === 0) {
      return errorResponse('operations array cannot be empty', 400, headers);
    }

    if (body.operations.length > 100) {
      return errorResponse('Maximum 100 operations per request', 400, headers);
    }

    const supabase = createServiceRoleClient();
    const results: BulkResult[] = [];

    // Process operations
    for (const op of body.operations) {
      const opResult: BulkResult = {
        success: false,
        operation: op.operation,
      };

      try {
        switch (op.operation) {
          case 'create': {
            if (!op.data) {
              opResult.error = 'data is required for create operation';
              break;
            }

            const taskData = op.data as Partial<TaskInsert>;
            if (!taskData.title) {
              opResult.error = 'title is required';
              break;
            }
            if (!taskData.board_id) {
              opResult.error = 'board_id is required';
              break;
            }

            const status = taskData.status || 'backlog';
            const newTask: TaskInsert = {
              title: taskData.title,
              board_id: taskData.board_id,
              description: taskData.description || null,
              status: status,
              priority: taskData.priority || 'medium',
              column_id: taskData.column_id || status,
              milestone_id: taskData.milestone_id || null,
              prd_id: taskData.prd_id || null,
              assigned_agent_id: taskData.assigned_agent_id || null,
              story_points: taskData.story_points || null,
              ai_context: taskData.ai_context || {},
              due_date: taskData.due_date || null,
              position: taskData.position || 0,
            };

            const { data, error } = await supabase
              .from('tasks')
              .insert(newTask)
              .select()
              .single();

            if (error) {
              opResult.error = error.message;
            } else {
              opResult.success = true;
              opResult.id = data.id;
              opResult.data = data;
            }
            break;
          }

          case 'update': {
            if (!op.id) {
              opResult.error = 'id is required for update operation';
              break;
            }
            if (!isValidUUID(op.id)) {
              opResult.error = 'Invalid id format';
              break;
            }
            if (!op.data) {
              opResult.error = 'data is required for update operation';
              break;
            }

            opResult.id = op.id;
            const updateData = op.data as Partial<TaskUpdate>;

            // Handle completed_at for status changes
            if (updateData.status === 'done') {
              (updateData as TaskUpdate).completed_at = new Date().toISOString();
            }

            const { data, error } = await supabase
              .from('tasks')
              .update(updateData)
              .eq('id', op.id)
              .select()
              .single();

            if (error) {
              opResult.error = error.message;
            } else if (!data) {
              opResult.error = 'Task not found';
            } else {
              opResult.success = true;
              opResult.data = data;
            }
            break;
          }

          case 'delete': {
            if (!op.id) {
              opResult.error = 'id is required for delete operation';
              break;
            }
            if (!isValidUUID(op.id)) {
              opResult.error = 'Invalid id format';
              break;
            }

            opResult.id = op.id;

            const { error } = await supabase
              .from('tasks')
              .delete()
              .eq('id', op.id);

            if (error) {
              opResult.error = error.message;
            } else {
              opResult.success = true;
            }
            break;
          }

          default:
            opResult.error = `Unknown operation: ${op.operation}`;
        }
      } catch (err) {
        opResult.error = err instanceof Error ? err.message : 'Unknown error';
      }

      results.push(opResult);
    }

    const successCount = results.filter(r => r.success).length;
    const failureCount = results.filter(r => !r.success).length;

    return successResponse({
      results,
      summary: {
        total: results.length,
        success: successCount,
        failed: failureCount,
      },
    }, 200, headers);
  } catch (err) {
    if (err instanceof SyntaxError) {
      return errorResponse(ValidationErrors.INVALID_JSON, 400, headers);
    }
    console.error('Unexpected error in POST /api/v1/tasks/bulk:', err);
    return errorResponse('Internal server error', 500, headers);
  }
}
