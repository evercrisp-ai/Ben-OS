#!/usr/bin/env node

// Ben OS MCP Server
// Model Context Protocol server for AI assistant integration with Ben OS

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

import { tools } from './tools/index.js';
import { listProjects } from './tools/list-projects.js';
import { getBoard } from './tools/get-board.js';
import { getPRD } from './tools/get-prd.js';
import { createTask } from './tools/create-task.js';
import { updateTask } from './tools/update-task.js';
import { moveTask } from './tools/move-task.js';
import { getContext } from './tools/get-context.js';
import { logActivity } from './tools/log-activity.js';
import { searchTasks } from './tools/search-tasks.js';
import { generateReport } from './tools/generate-report.js';

const SERVER_NAME = 'ben-os-mcp';
const SERVER_VERSION = '1.0.0';

// Create the MCP server instance
const server = new Server(
  {
    name: SERVER_NAME,
    version: SERVER_VERSION,
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Handle list_tools request
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: tools.map((tool) => ({
      name: tool.name,
      description: tool.description,
      inputSchema: tool.inputSchema,
    })),
  };
});

// Handle call_tool request
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    let result: unknown;
    // Cast args to unknown first to avoid TypeScript strict type checking issues
    const toolArgs = args as unknown;

    switch (name) {
      case 'list_projects':
        result = await listProjects(toolArgs as Parameters<typeof listProjects>[0]);
        break;

      case 'get_board':
        result = await getBoard(toolArgs as Parameters<typeof getBoard>[0]);
        break;

      case 'get_prd':
        result = await getPRD(toolArgs as Parameters<typeof getPRD>[0]);
        break;

      case 'create_task':
        result = await createTask(toolArgs as Parameters<typeof createTask>[0]);
        break;

      case 'update_task':
        result = await updateTask(toolArgs as Parameters<typeof updateTask>[0]);
        break;

      case 'move_task':
        result = await moveTask(toolArgs as Parameters<typeof moveTask>[0]);
        break;

      case 'get_context':
        result = await getContext(toolArgs as Parameters<typeof getContext>[0]);
        break;

      case 'log_activity':
        result = await logActivity(toolArgs as Parameters<typeof logActivity>[0]);
        break;

      case 'search_tasks':
        result = await searchTasks(toolArgs as Parameters<typeof searchTasks>[0]);
        break;

      case 'generate_report':
        result = await generateReport(toolArgs as Parameters<typeof generateReport>[0]);
        break;

      default:
        throw new Error(`Unknown tool: ${name}`);
    }

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({ error: errorMessage }),
        },
      ],
      isError: true,
    };
  }
});

// Track server running state
let isRunning = false;

/**
 * Check if the server is running
 */
export function isServerRunning(): boolean {
  return isRunning;
}

/**
 * Start the MCP server with stdio transport
 */
export async function startMCPServer(): Promise<{ isRunning: () => boolean }> {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  isRunning = true;

  console.error(`${SERVER_NAME} v${SERVER_VERSION} started`);

  return {
    isRunning: () => isRunning,
  };
}

/**
 * Main entry point - start the server
 */
async function main(): Promise<void> {
  try {
    await startMCPServer();
  } catch (error) {
    console.error('Failed to start MCP server:', error);
    process.exit(1);
  }
}

// Run the server
main();
