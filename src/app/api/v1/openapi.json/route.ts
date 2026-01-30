// OpenAPI/Swagger Specification
// Note: This route uses Node.js runtime due to rate limiter dependencies
// The response is still fast as it returns static JSON data

import { NextRequest, NextResponse } from 'next/server';
import { applyRateLimit, errorResponse } from '@/lib/api';

const openApiSpec = {
  openapi: '3.0.0',
  info: {
    title: 'Ben OS API',
    version: '1.0.0',
    description: 'Personal project management system API for managing areas, projects, milestones, tasks, boards, PRDs, and reports.',
    contact: {
      name: 'Ben OS Support',
    },
  },
  servers: [
    {
      url: '/api/v1',
      description: 'API v1',
    },
  ],
  tags: [
    { name: 'Areas', description: 'Top-level life domains' },
    { name: 'Projects', description: 'Initiatives within areas' },
    { name: 'Milestones', description: 'Major checkpoints within projects' },
    { name: 'Tasks', description: 'Actionable work items' },
    { name: 'Boards', description: 'Kanban boards for projects' },
    { name: 'PRDs', description: 'Product Requirement Documents' },
    { name: 'Reports', description: 'Generated reports' },
    { name: 'Search', description: 'Full-text search' },
  ],
  paths: {
    '/areas': {
      get: {
        tags: ['Areas'],
        summary: 'List all areas',
        parameters: [
          { $ref: '#/components/parameters/limit' },
          { $ref: '#/components/parameters/offset' },
          { $ref: '#/components/parameters/search' },
        ],
        responses: {
          '200': {
            description: 'List of areas',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/PaginatedAreas',
                },
              },
            },
          },
          '429': { $ref: '#/components/responses/RateLimitExceeded' },
        },
      },
      post: {
        tags: ['Areas'],
        summary: 'Create a new area',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/AreaCreate',
              },
            },
          },
        },
        responses: {
          '201': {
            description: 'Area created',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/AreaResponse',
                },
              },
            },
          },
          '400': { $ref: '#/components/responses/BadRequest' },
          '429': { $ref: '#/components/responses/RateLimitExceeded' },
        },
      },
    },
    '/areas/{id}': {
      get: {
        tags: ['Areas'],
        summary: 'Get a single area',
        parameters: [{ $ref: '#/components/parameters/id' }],
        responses: {
          '200': {
            description: 'Area details',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/AreaResponse' },
              },
            },
          },
          '404': { $ref: '#/components/responses/NotFound' },
          '429': { $ref: '#/components/responses/RateLimitExceeded' },
        },
      },
      put: {
        tags: ['Areas'],
        summary: 'Update an area',
        parameters: [{ $ref: '#/components/parameters/id' }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/AreaUpdate' },
            },
          },
        },
        responses: {
          '200': {
            description: 'Area updated',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/AreaResponse' },
              },
            },
          },
          '404': { $ref: '#/components/responses/NotFound' },
          '429': { $ref: '#/components/responses/RateLimitExceeded' },
        },
      },
      delete: {
        tags: ['Areas'],
        summary: 'Delete an area',
        parameters: [{ $ref: '#/components/parameters/id' }],
        responses: {
          '204': { description: 'Area deleted' },
          '404': { $ref: '#/components/responses/NotFound' },
          '429': { $ref: '#/components/responses/RateLimitExceeded' },
        },
      },
    },
    '/projects': {
      get: {
        tags: ['Projects'],
        summary: 'List all projects',
        parameters: [
          { $ref: '#/components/parameters/limit' },
          { $ref: '#/components/parameters/offset' },
          { $ref: '#/components/parameters/search' },
          { $ref: '#/components/parameters/status' },
          { $ref: '#/components/parameters/area_id' },
        ],
        responses: {
          '200': {
            description: 'List of projects',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/PaginatedProjects' },
              },
            },
          },
          '429': { $ref: '#/components/responses/RateLimitExceeded' },
        },
      },
      post: {
        tags: ['Projects'],
        summary: 'Create a new project',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ProjectCreate' },
            },
          },
        },
        responses: {
          '201': {
            description: 'Project created',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ProjectResponse' },
              },
            },
          },
          '400': { $ref: '#/components/responses/BadRequest' },
          '429': { $ref: '#/components/responses/RateLimitExceeded' },
        },
      },
    },
    '/projects/{id}': {
      get: {
        tags: ['Projects'],
        summary: 'Get a single project',
        parameters: [{ $ref: '#/components/parameters/id' }],
        responses: {
          '200': {
            description: 'Project details',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ProjectResponse' },
              },
            },
          },
          '404': { $ref: '#/components/responses/NotFound' },
          '429': { $ref: '#/components/responses/RateLimitExceeded' },
        },
      },
      put: {
        tags: ['Projects'],
        summary: 'Update a project',
        parameters: [{ $ref: '#/components/parameters/id' }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ProjectUpdate' },
            },
          },
        },
        responses: {
          '200': {
            description: 'Project updated',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ProjectResponse' },
              },
            },
          },
          '404': { $ref: '#/components/responses/NotFound' },
          '429': { $ref: '#/components/responses/RateLimitExceeded' },
        },
      },
      delete: {
        tags: ['Projects'],
        summary: 'Delete a project',
        parameters: [{ $ref: '#/components/parameters/id' }],
        responses: {
          '204': { description: 'Project deleted' },
          '404': { $ref: '#/components/responses/NotFound' },
          '429': { $ref: '#/components/responses/RateLimitExceeded' },
        },
      },
    },
    '/milestones': {
      get: {
        tags: ['Milestones'],
        summary: 'List all milestones',
        parameters: [
          { $ref: '#/components/parameters/limit' },
          { $ref: '#/components/parameters/offset' },
          { $ref: '#/components/parameters/search' },
          { $ref: '#/components/parameters/status' },
          { $ref: '#/components/parameters/project_id' },
        ],
        responses: {
          '200': {
            description: 'List of milestones',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/PaginatedMilestones' },
              },
            },
          },
          '429': { $ref: '#/components/responses/RateLimitExceeded' },
        },
      },
      post: {
        tags: ['Milestones'],
        summary: 'Create a new milestone',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/MilestoneCreate' },
            },
          },
        },
        responses: {
          '201': {
            description: 'Milestone created',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/MilestoneResponse' },
              },
            },
          },
          '400': { $ref: '#/components/responses/BadRequest' },
          '429': { $ref: '#/components/responses/RateLimitExceeded' },
        },
      },
    },
    '/milestones/{id}': {
      get: {
        tags: ['Milestones'],
        summary: 'Get a single milestone',
        parameters: [{ $ref: '#/components/parameters/id' }],
        responses: {
          '200': {
            description: 'Milestone details',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/MilestoneResponse' },
              },
            },
          },
          '404': { $ref: '#/components/responses/NotFound' },
          '429': { $ref: '#/components/responses/RateLimitExceeded' },
        },
      },
      put: {
        tags: ['Milestones'],
        summary: 'Update a milestone',
        parameters: [{ $ref: '#/components/parameters/id' }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/MilestoneUpdate' },
            },
          },
        },
        responses: {
          '200': {
            description: 'Milestone updated',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/MilestoneResponse' },
              },
            },
          },
          '404': { $ref: '#/components/responses/NotFound' },
          '429': { $ref: '#/components/responses/RateLimitExceeded' },
        },
      },
      delete: {
        tags: ['Milestones'],
        summary: 'Delete a milestone',
        parameters: [{ $ref: '#/components/parameters/id' }],
        responses: {
          '204': { description: 'Milestone deleted' },
          '404': { $ref: '#/components/responses/NotFound' },
          '429': { $ref: '#/components/responses/RateLimitExceeded' },
        },
      },
    },
    '/tasks': {
      get: {
        tags: ['Tasks'],
        summary: 'List all tasks',
        parameters: [
          { $ref: '#/components/parameters/limit' },
          { $ref: '#/components/parameters/offset' },
          { $ref: '#/components/parameters/search' },
          { $ref: '#/components/parameters/status' },
          { $ref: '#/components/parameters/priority' },
          { $ref: '#/components/parameters/board_id' },
          { $ref: '#/components/parameters/milestone_id' },
          { $ref: '#/components/parameters/assigned_agent' },
        ],
        responses: {
          '200': {
            description: 'List of tasks',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/PaginatedTasks' },
              },
            },
          },
          '429': { $ref: '#/components/responses/RateLimitExceeded' },
        },
      },
      post: {
        tags: ['Tasks'],
        summary: 'Create a new task',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/TaskCreate' },
            },
          },
        },
        responses: {
          '201': {
            description: 'Task created',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/TaskResponse' },
              },
            },
          },
          '400': { $ref: '#/components/responses/BadRequest' },
          '429': { $ref: '#/components/responses/RateLimitExceeded' },
        },
      },
    },
    '/tasks/{id}': {
      get: {
        tags: ['Tasks'],
        summary: 'Get a single task with subtasks',
        parameters: [{ $ref: '#/components/parameters/id' }],
        responses: {
          '200': {
            description: 'Task details',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/TaskResponse' },
              },
            },
          },
          '404': { $ref: '#/components/responses/NotFound' },
          '429': { $ref: '#/components/responses/RateLimitExceeded' },
        },
      },
      put: {
        tags: ['Tasks'],
        summary: 'Update a task',
        parameters: [{ $ref: '#/components/parameters/id' }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/TaskUpdate' },
            },
          },
        },
        responses: {
          '200': {
            description: 'Task updated',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/TaskResponse' },
              },
            },
          },
          '404': { $ref: '#/components/responses/NotFound' },
          '429': { $ref: '#/components/responses/RateLimitExceeded' },
        },
      },
      delete: {
        tags: ['Tasks'],
        summary: 'Delete a task',
        parameters: [{ $ref: '#/components/parameters/id' }],
        responses: {
          '204': { description: 'Task deleted' },
          '404': { $ref: '#/components/responses/NotFound' },
          '429': { $ref: '#/components/responses/RateLimitExceeded' },
        },
      },
    },
    '/tasks/bulk': {
      post: {
        tags: ['Tasks'],
        summary: 'Bulk create/update/delete tasks',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/BulkTaskRequest' },
            },
          },
        },
        responses: {
          '200': {
            description: 'Bulk operation results',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/BulkTaskResponse' },
              },
            },
          },
          '400': { $ref: '#/components/responses/BadRequest' },
          '429': { $ref: '#/components/responses/RateLimitExceeded' },
        },
      },
    },
    '/tasks/{id}/status': {
      put: {
        tags: ['Tasks'],
        summary: 'Update task status only',
        parameters: [{ $ref: '#/components/parameters/id' }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['status'],
                properties: {
                  status: {
                    type: 'string',
                    enum: ['backlog', 'todo', 'in_progress', 'review', 'done'],
                  },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Task status updated',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/TaskResponse' },
              },
            },
          },
          '404': { $ref: '#/components/responses/NotFound' },
          '429': { $ref: '#/components/responses/RateLimitExceeded' },
        },
      },
    },
    '/tasks/{id}/assign': {
      put: {
        tags: ['Tasks'],
        summary: 'Assign task to an agent',
        parameters: [{ $ref: '#/components/parameters/id' }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  agent_id: {
                    type: 'string',
                    format: 'uuid',
                    nullable: true,
                    description: 'Agent ID to assign, or null to unassign',
                  },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Task assigned',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/TaskResponse' },
              },
            },
          },
          '404': { $ref: '#/components/responses/NotFound' },
          '429': { $ref: '#/components/responses/RateLimitExceeded' },
        },
      },
    },
    '/boards': {
      get: {
        tags: ['Boards'],
        summary: 'List all boards',
        parameters: [
          { $ref: '#/components/parameters/limit' },
          { $ref: '#/components/parameters/offset' },
          { $ref: '#/components/parameters/search' },
          { $ref: '#/components/parameters/project_id' },
        ],
        responses: {
          '200': {
            description: 'List of boards',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/PaginatedBoards' },
              },
            },
          },
          '429': { $ref: '#/components/responses/RateLimitExceeded' },
        },
      },
      post: {
        tags: ['Boards'],
        summary: 'Create a new board',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/BoardCreate' },
            },
          },
        },
        responses: {
          '201': {
            description: 'Board created',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/BoardResponse' },
              },
            },
          },
          '400': { $ref: '#/components/responses/BadRequest' },
          '429': { $ref: '#/components/responses/RateLimitExceeded' },
        },
      },
    },
    '/boards/{id}': {
      get: {
        tags: ['Boards'],
        summary: 'Get a single board with tasks',
        parameters: [{ $ref: '#/components/parameters/id' }],
        responses: {
          '200': {
            description: 'Board details with tasks',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/BoardResponse' },
              },
            },
          },
          '404': { $ref: '#/components/responses/NotFound' },
          '429': { $ref: '#/components/responses/RateLimitExceeded' },
        },
      },
      put: {
        tags: ['Boards'],
        summary: 'Update a board',
        parameters: [{ $ref: '#/components/parameters/id' }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/BoardUpdate' },
            },
          },
        },
        responses: {
          '200': {
            description: 'Board updated',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/BoardResponse' },
              },
            },
          },
          '404': { $ref: '#/components/responses/NotFound' },
          '429': { $ref: '#/components/responses/RateLimitExceeded' },
        },
      },
      delete: {
        tags: ['Boards'],
        summary: 'Delete a board',
        parameters: [{ $ref: '#/components/parameters/id' }],
        responses: {
          '204': { description: 'Board deleted' },
          '404': { $ref: '#/components/responses/NotFound' },
          '429': { $ref: '#/components/responses/RateLimitExceeded' },
        },
      },
    },
    '/prds': {
      get: {
        tags: ['PRDs'],
        summary: 'List all PRDs',
        parameters: [
          { $ref: '#/components/parameters/limit' },
          { $ref: '#/components/parameters/offset' },
          { $ref: '#/components/parameters/search' },
          { $ref: '#/components/parameters/status' },
          { $ref: '#/components/parameters/project_id' },
        ],
        responses: {
          '200': {
            description: 'List of PRDs',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/PaginatedPRDs' },
              },
            },
          },
          '429': { $ref: '#/components/responses/RateLimitExceeded' },
        },
      },
      post: {
        tags: ['PRDs'],
        summary: 'Create a new PRD',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/PRDCreate' },
            },
          },
        },
        responses: {
          '201': {
            description: 'PRD created',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/PRDResponse' },
              },
            },
          },
          '400': { $ref: '#/components/responses/BadRequest' },
          '429': { $ref: '#/components/responses/RateLimitExceeded' },
        },
      },
    },
    '/prds/{id}': {
      get: {
        tags: ['PRDs'],
        summary: 'Get a single PRD with tasks and versions',
        parameters: [{ $ref: '#/components/parameters/id' }],
        responses: {
          '200': {
            description: 'PRD details',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/PRDResponse' },
              },
            },
          },
          '404': { $ref: '#/components/responses/NotFound' },
          '429': { $ref: '#/components/responses/RateLimitExceeded' },
        },
      },
      put: {
        tags: ['PRDs'],
        summary: 'Update a PRD',
        parameters: [{ $ref: '#/components/parameters/id' }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/PRDUpdate' },
            },
          },
        },
        responses: {
          '200': {
            description: 'PRD updated',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/PRDResponse' },
              },
            },
          },
          '404': { $ref: '#/components/responses/NotFound' },
          '429': { $ref: '#/components/responses/RateLimitExceeded' },
        },
      },
      delete: {
        tags: ['PRDs'],
        summary: 'Delete a PRD',
        parameters: [{ $ref: '#/components/parameters/id' }],
        responses: {
          '204': { description: 'PRD deleted' },
          '404': { $ref: '#/components/responses/NotFound' },
          '429': { $ref: '#/components/responses/RateLimitExceeded' },
        },
      },
    },
    '/reports': {
      get: {
        tags: ['Reports'],
        summary: 'List all reports',
        parameters: [
          { $ref: '#/components/parameters/limit' },
          { $ref: '#/components/parameters/offset' },
          {
            name: 'type',
            in: 'query',
            schema: { type: 'string', enum: ['daily', 'weekly', 'monthly'] },
          },
        ],
        responses: {
          '200': {
            description: 'List of reports',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/PaginatedReports' },
              },
            },
          },
          '429': { $ref: '#/components/responses/RateLimitExceeded' },
        },
      },
      post: {
        tags: ['Reports'],
        summary: 'Generate a new report',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['type'],
                properties: {
                  type: {
                    type: 'string',
                    enum: ['daily', 'weekly', 'monthly'],
                  },
                  period_start: { type: 'string', format: 'date' },
                  period_end: { type: 'string', format: 'date' },
                },
              },
            },
          },
        },
        responses: {
          '201': {
            description: 'Report generated',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ReportResponse' },
              },
            },
          },
          '400': { $ref: '#/components/responses/BadRequest' },
          '429': { $ref: '#/components/responses/RateLimitExceeded' },
        },
      },
    },
    '/reports/{id}': {
      get: {
        tags: ['Reports'],
        summary: 'Get a single report',
        parameters: [{ $ref: '#/components/parameters/id' }],
        responses: {
          '200': {
            description: 'Report details',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ReportResponse' },
              },
            },
          },
          '404': { $ref: '#/components/responses/NotFound' },
          '429': { $ref: '#/components/responses/RateLimitExceeded' },
        },
      },
      delete: {
        tags: ['Reports'],
        summary: 'Delete a report',
        parameters: [{ $ref: '#/components/parameters/id' }],
        responses: {
          '204': { description: 'Report deleted' },
          '404': { $ref: '#/components/responses/NotFound' },
          '429': { $ref: '#/components/responses/RateLimitExceeded' },
        },
      },
    },
    '/search': {
      get: {
        tags: ['Search'],
        summary: 'Search across all entities',
        parameters: [
          {
            name: 'q',
            in: 'query',
            required: true,
            schema: { type: 'string', minLength: 2 },
            description: 'Search query (minimum 2 characters)',
          },
          {
            name: 'types',
            in: 'query',
            schema: { type: 'string' },
            description: 'Comma-separated list of entity types to search (areas,projects,milestones,tasks,prds,boards)',
          },
          { $ref: '#/components/parameters/limit' },
        ],
        responses: {
          '200': {
            description: 'Search results',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/SearchResponse' },
              },
            },
          },
          '400': { $ref: '#/components/responses/BadRequest' },
          '429': { $ref: '#/components/responses/RateLimitExceeded' },
        },
      },
    },
  },
  components: {
    parameters: {
      id: {
        name: 'id',
        in: 'path',
        required: true,
        schema: { type: 'string', format: 'uuid' },
      },
      limit: {
        name: 'limit',
        in: 'query',
        schema: { type: 'integer', default: 50, maximum: 100 },
      },
      offset: {
        name: 'offset',
        in: 'query',
        schema: { type: 'integer', default: 0 },
      },
      search: {
        name: 'search',
        in: 'query',
        schema: { type: 'string' },
      },
      status: {
        name: 'status',
        in: 'query',
        schema: { type: 'string' },
        description: 'Comma-separated list of statuses',
      },
      priority: {
        name: 'priority',
        in: 'query',
        schema: { type: 'string' },
        description: 'Comma-separated list of priorities',
      },
      area_id: {
        name: 'area_id',
        in: 'query',
        schema: { type: 'string', format: 'uuid' },
      },
      project_id: {
        name: 'project_id',
        in: 'query',
        schema: { type: 'string', format: 'uuid' },
      },
      board_id: {
        name: 'board_id',
        in: 'query',
        schema: { type: 'string', format: 'uuid' },
      },
      milestone_id: {
        name: 'milestone_id',
        in: 'query',
        schema: { type: 'string', format: 'uuid' },
      },
      assigned_agent: {
        name: 'assigned_agent',
        in: 'query',
        schema: { type: 'string', format: 'uuid' },
      },
    },
    responses: {
      BadRequest: {
        description: 'Bad request - invalid parameters',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/Error' },
          },
        },
      },
      NotFound: {
        description: 'Resource not found',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/Error' },
          },
        },
      },
      RateLimitExceeded: {
        description: 'Rate limit exceeded (100 requests/minute)',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/Error' },
          },
        },
        headers: {
          'X-RateLimit-Limit': {
            schema: { type: 'integer' },
            description: 'Request limit per minute',
          },
          'X-RateLimit-Remaining': {
            schema: { type: 'integer' },
            description: 'Remaining requests',
          },
          'X-RateLimit-Reset': {
            schema: { type: 'integer' },
            description: 'Unix timestamp when limit resets',
          },
        },
      },
    },
    schemas: {
      Error: {
        type: 'object',
        properties: {
          error: { type: 'string' },
        },
      },
      Pagination: {
        type: 'object',
        properties: {
          total: { type: 'integer' },
          limit: { type: 'integer' },
          offset: { type: 'integer' },
          hasMore: { type: 'boolean' },
        },
      },
      Area: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          name: { type: 'string' },
          color: { type: 'string' },
          icon: { type: 'string', nullable: true },
          type: { type: 'string', enum: ['personal', 'work', 'project', 'content', 'community', 'other'] },
          position: { type: 'integer' },
          created_at: { type: 'string', format: 'date-time' },
          updated_at: { type: 'string', format: 'date-time' },
        },
      },
      AreaCreate: {
        type: 'object',
        required: ['name', 'type'],
        properties: {
          name: { type: 'string' },
          type: { type: 'string', enum: ['personal', 'work', 'project', 'content', 'community', 'other'] },
          color: { type: 'string' },
          icon: { type: 'string' },
        },
      },
      AreaUpdate: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          type: { type: 'string', enum: ['personal', 'work', 'project', 'content', 'community', 'other'] },
          color: { type: 'string' },
          icon: { type: 'string' },
          position: { type: 'integer' },
        },
      },
      AreaResponse: {
        type: 'object',
        properties: {
          data: { $ref: '#/components/schemas/Area' },
        },
      },
      PaginatedAreas: {
        type: 'object',
        properties: {
          data: { type: 'array', items: { $ref: '#/components/schemas/Area' } },
          pagination: { $ref: '#/components/schemas/Pagination' },
        },
      },
      Project: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          area_id: { type: 'string', format: 'uuid' },
          title: { type: 'string' },
          description: { type: 'string', nullable: true },
          status: { type: 'string', enum: ['active', 'paused', 'completed', 'archived'] },
          target_date: { type: 'string', format: 'date', nullable: true },
          position: { type: 'integer' },
          created_at: { type: 'string', format: 'date-time' },
          updated_at: { type: 'string', format: 'date-time' },
        },
      },
      ProjectCreate: {
        type: 'object',
        required: ['title', 'area_id'],
        properties: {
          title: { type: 'string' },
          area_id: { type: 'string', format: 'uuid' },
          description: { type: 'string' },
          status: { type: 'string', enum: ['active', 'paused', 'completed', 'archived'] },
          target_date: { type: 'string', format: 'date' },
        },
      },
      ProjectUpdate: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          area_id: { type: 'string', format: 'uuid' },
          description: { type: 'string' },
          status: { type: 'string', enum: ['active', 'paused', 'completed', 'archived'] },
          target_date: { type: 'string', format: 'date' },
          position: { type: 'integer' },
        },
      },
      ProjectResponse: {
        type: 'object',
        properties: {
          data: { $ref: '#/components/schemas/Project' },
        },
      },
      PaginatedProjects: {
        type: 'object',
        properties: {
          data: { type: 'array', items: { $ref: '#/components/schemas/Project' } },
          pagination: { $ref: '#/components/schemas/Pagination' },
        },
      },
      Milestone: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          project_id: { type: 'string', format: 'uuid' },
          title: { type: 'string' },
          description: { type: 'string', nullable: true },
          status: { type: 'string', enum: ['pending', 'in_progress', 'completed'] },
          target_date: { type: 'string', format: 'date', nullable: true },
          position: { type: 'integer' },
          created_at: { type: 'string', format: 'date-time' },
          updated_at: { type: 'string', format: 'date-time' },
        },
      },
      MilestoneCreate: {
        type: 'object',
        required: ['title', 'project_id'],
        properties: {
          title: { type: 'string' },
          project_id: { type: 'string', format: 'uuid' },
          description: { type: 'string' },
          status: { type: 'string', enum: ['pending', 'in_progress', 'completed'] },
          target_date: { type: 'string', format: 'date' },
        },
      },
      MilestoneUpdate: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          project_id: { type: 'string', format: 'uuid' },
          description: { type: 'string' },
          status: { type: 'string', enum: ['pending', 'in_progress', 'completed'] },
          target_date: { type: 'string', format: 'date' },
          position: { type: 'integer' },
        },
      },
      MilestoneResponse: {
        type: 'object',
        properties: {
          data: { $ref: '#/components/schemas/Milestone' },
        },
      },
      PaginatedMilestones: {
        type: 'object',
        properties: {
          data: { type: 'array', items: { $ref: '#/components/schemas/Milestone' } },
          pagination: { $ref: '#/components/schemas/Pagination' },
        },
      },
      Task: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          board_id: { type: 'string', format: 'uuid' },
          milestone_id: { type: 'string', format: 'uuid', nullable: true },
          prd_id: { type: 'string', format: 'uuid', nullable: true },
          assigned_agent_id: { type: 'string', format: 'uuid', nullable: true },
          title: { type: 'string' },
          description: { type: 'string', nullable: true },
          status: { type: 'string', enum: ['backlog', 'todo', 'in_progress', 'review', 'done'] },
          priority: { type: 'string', enum: ['low', 'medium', 'high', 'critical'] },
          story_points: { type: 'integer', nullable: true },
          column_id: { type: 'string' },
          position: { type: 'integer' },
          due_date: { type: 'string', format: 'date', nullable: true },
          completed_at: { type: 'string', format: 'date-time', nullable: true },
          created_at: { type: 'string', format: 'date-time' },
          updated_at: { type: 'string', format: 'date-time' },
        },
      },
      TaskCreate: {
        type: 'object',
        required: ['title', 'board_id'],
        properties: {
          title: { type: 'string' },
          board_id: { type: 'string', format: 'uuid' },
          description: { type: 'string' },
          status: { type: 'string', enum: ['backlog', 'todo', 'in_progress', 'review', 'done'] },
          priority: { type: 'string', enum: ['low', 'medium', 'high', 'critical'] },
          milestone_id: { type: 'string', format: 'uuid' },
          prd_id: { type: 'string', format: 'uuid' },
          assigned_agent_id: { type: 'string', format: 'uuid' },
          story_points: { type: 'integer' },
          due_date: { type: 'string', format: 'date' },
        },
      },
      TaskUpdate: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          board_id: { type: 'string', format: 'uuid' },
          description: { type: 'string' },
          status: { type: 'string', enum: ['backlog', 'todo', 'in_progress', 'review', 'done'] },
          priority: { type: 'string', enum: ['low', 'medium', 'high', 'critical'] },
          milestone_id: { type: 'string', format: 'uuid', nullable: true },
          prd_id: { type: 'string', format: 'uuid', nullable: true },
          assigned_agent_id: { type: 'string', format: 'uuid', nullable: true },
          story_points: { type: 'integer', nullable: true },
          column_id: { type: 'string' },
          position: { type: 'integer' },
          due_date: { type: 'string', format: 'date', nullable: true },
        },
      },
      TaskResponse: {
        type: 'object',
        properties: {
          data: { $ref: '#/components/schemas/Task' },
        },
      },
      PaginatedTasks: {
        type: 'object',
        properties: {
          data: { type: 'array', items: { $ref: '#/components/schemas/Task' } },
          pagination: { $ref: '#/components/schemas/Pagination' },
        },
      },
      BulkTaskRequest: {
        type: 'object',
        required: ['operations'],
        properties: {
          operations: {
            type: 'array',
            maxItems: 100,
            items: {
              type: 'object',
              required: ['operation'],
              properties: {
                operation: { type: 'string', enum: ['create', 'update', 'delete'] },
                id: { type: 'string', format: 'uuid' },
                data: { type: 'object' },
              },
            },
          },
        },
      },
      BulkTaskResponse: {
        type: 'object',
        properties: {
          data: {
            type: 'object',
            properties: {
              results: { type: 'array', items: { type: 'object' } },
              summary: {
                type: 'object',
                properties: {
                  total: { type: 'integer' },
                  success: { type: 'integer' },
                  failed: { type: 'integer' },
                },
              },
            },
          },
        },
      },
      Board: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          project_id: { type: 'string', format: 'uuid' },
          name: { type: 'string' },
          column_config: { type: 'array', items: { type: 'object' } },
          position: { type: 'integer' },
          created_at: { type: 'string', format: 'date-time' },
          updated_at: { type: 'string', format: 'date-time' },
        },
      },
      BoardCreate: {
        type: 'object',
        required: ['name', 'project_id'],
        properties: {
          name: { type: 'string' },
          project_id: { type: 'string', format: 'uuid' },
          column_config: { type: 'array', items: { type: 'object' } },
        },
      },
      BoardUpdate: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          project_id: { type: 'string', format: 'uuid' },
          column_config: { type: 'array', items: { type: 'object' } },
          position: { type: 'integer' },
        },
      },
      BoardResponse: {
        type: 'object',
        properties: {
          data: { $ref: '#/components/schemas/Board' },
        },
      },
      PaginatedBoards: {
        type: 'object',
        properties: {
          data: { type: 'array', items: { $ref: '#/components/schemas/Board' } },
          pagination: { $ref: '#/components/schemas/Pagination' },
        },
      },
      PRD: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          project_id: { type: 'string', format: 'uuid' },
          title: { type: 'string' },
          content: { type: 'string', nullable: true },
          status: { type: 'string', enum: ['draft', 'approved', 'in_progress', 'completed'] },
          sections: { type: 'array', items: { type: 'object' } },
          created_at: { type: 'string', format: 'date-time' },
          updated_at: { type: 'string', format: 'date-time' },
        },
      },
      PRDCreate: {
        type: 'object',
        required: ['title', 'project_id'],
        properties: {
          title: { type: 'string' },
          project_id: { type: 'string', format: 'uuid' },
          content: { type: 'string' },
          status: { type: 'string', enum: ['draft', 'approved', 'in_progress', 'completed'] },
          sections: { type: 'array', items: { type: 'object' } },
        },
      },
      PRDUpdate: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          project_id: { type: 'string', format: 'uuid' },
          content: { type: 'string' },
          status: { type: 'string', enum: ['draft', 'approved', 'in_progress', 'completed'] },
          sections: { type: 'array', items: { type: 'object' } },
          create_version: { type: 'boolean', description: 'Create a version snapshot before updating' },
        },
      },
      PRDResponse: {
        type: 'object',
        properties: {
          data: { $ref: '#/components/schemas/PRD' },
        },
      },
      PaginatedPRDs: {
        type: 'object',
        properties: {
          data: { type: 'array', items: { $ref: '#/components/schemas/PRD' } },
          pagination: { $ref: '#/components/schemas/Pagination' },
        },
      },
      Report: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          type: { type: 'string', enum: ['daily', 'weekly', 'monthly'] },
          period_start: { type: 'string', format: 'date' },
          period_end: { type: 'string', format: 'date' },
          content: { type: 'object' },
          generated_at: { type: 'string', format: 'date-time' },
        },
      },
      ReportResponse: {
        type: 'object',
        properties: {
          data: { $ref: '#/components/schemas/Report' },
        },
      },
      PaginatedReports: {
        type: 'object',
        properties: {
          data: { type: 'array', items: { $ref: '#/components/schemas/Report' } },
          pagination: { $ref: '#/components/schemas/Pagination' },
        },
      },
      SearchResult: {
        type: 'object',
        properties: {
          type: { type: 'string', enum: ['area', 'project', 'milestone', 'task', 'prd', 'board'] },
          id: { type: 'string', format: 'uuid' },
          title: { type: 'string' },
          description: { type: 'string', nullable: true },
          status: { type: 'string' },
          parent: {
            type: 'object',
            nullable: true,
            properties: {
              type: { type: 'string' },
              id: { type: 'string', format: 'uuid' },
              title: { type: 'string' },
            },
          },
          score: { type: 'number' },
        },
      },
      SearchResponse: {
        type: 'object',
        properties: {
          query: { type: 'string' },
          results: { type: 'array', items: { $ref: '#/components/schemas/SearchResult' } },
          counts: {
            type: 'object',
            properties: {
              areas: { type: 'integer' },
              projects: { type: 'integer' },
              milestones: { type: 'integer' },
              tasks: { type: 'integer' },
              prds: { type: 'integer' },
              boards: { type: 'integer' },
              total: { type: 'integer' },
            },
          },
        },
      },
    },
  },
};

// GET /api/v1/openapi.json - Return OpenAPI specification
export async function GET(request: NextRequest) {
  const { result, headers } = applyRateLimit(request);
  if (!result.allowed) {
    return errorResponse('Rate limit exceeded', 429, headers);
  }

  return NextResponse.json(openApiSpec, {
    status: 200,
    headers: {
      ...headers,
      'Content-Type': 'application/json',
    },
  });
}
