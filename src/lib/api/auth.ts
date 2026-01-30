/**
 * Agent Authentication Utilities for Ben OS
 * Section 4.2 - Agent Authentication
 *
 * Implements secure API key authentication for AI agents:
 * - 4.2.1: Agent registration
 * - 4.2.2: API key generation (secure random, bos_ prefix)
 * - 4.2.3: API key hashing (SHA-256)
 * - 4.2.4: Key validation middleware
 * - 4.2.5: Agent capabilities
 * - 4.2.6: Key rotation
 * - 4.2.7: Key revocation
 * - 4.2.8: Last active tracking
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { errorResponse } from './helpers';
import type { Agent, AgentInsert, AgentType } from '@/types/database';
import crypto from 'crypto';

// API key prefix
const API_KEY_PREFIX = 'bos_';

// Character set for API key generation (alphanumeric)
const CHARSET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

/**
 * Agent capability types
 * Format: action:resource
 */
export type AgentCapability =
  | 'read:tasks'
  | 'write:tasks'
  | 'read:projects'
  | 'write:projects'
  | 'read:boards'
  | 'write:boards'
  | 'read:areas'
  | 'write:areas'
  | 'read:milestones'
  | 'write:milestones'
  | 'read:prds'
  | 'write:prds'
  | 'read:reports'
  | 'write:reports'
  | 'read:agents'
  | 'write:agents'
  | 'admin'; // Full access

/**
 * Default capabilities for new agents
 */
export const DEFAULT_CAPABILITIES: AgentCapability[] = [
  'read:tasks',
  'read:projects',
  'read:boards',
  'read:areas',
  'read:milestones',
  'read:prds',
  'read:reports',
];

/**
 * Admin capabilities (full access)
 */
export const ADMIN_CAPABILITIES: AgentCapability[] = [
  'read:tasks',
  'write:tasks',
  'read:projects',
  'write:projects',
  'read:boards',
  'write:boards',
  'read:areas',
  'write:areas',
  'read:milestones',
  'write:milestones',
  'read:prds',
  'write:prds',
  'read:reports',
  'write:reports',
  'read:agents',
  'write:agents',
  'admin',
];

/**
 * Result of agent registration
 */
export interface RegisterAgentResult {
  agent: Agent;
  apiKey: string; // Only returned once at registration
}

/**
 * Result of API key rotation
 */
export interface RotateKeyResult {
  agent: Agent;
  apiKey: string; // New API key
}

/**
 * Authenticated request context
 */
export interface AuthContext {
  agent: Agent;
  capabilities: AgentCapability[];
}

/**
 * Options for registering an agent
 */
export interface RegisterAgentOptions {
  name: string;
  type?: AgentType;
  capabilities?: AgentCapability[];
}

/**
 * 4.2.2: Generate a secure random API key
 * Format: bos_[32 random alphanumeric characters]
 * Total length: 36 characters
 */
export function generateApiKey(): string {
  const randomBytes = crypto.randomBytes(32);
  let key = API_KEY_PREFIX;

  for (let i = 0; i < 32; i++) {
    // Use modulo to map byte to charset index
    const index = randomBytes[i] % CHARSET.length;
    key += CHARSET[index];
  }

  return key;
}

/**
 * 4.2.3: Hash an API key using SHA-256
 * Returns a 64-character hex string
 */
export function hashApiKey(apiKey: string): string {
  return crypto.createHash('sha256').update(apiKey).digest('hex');
}

/**
 * 4.2.1: Register a new agent with an API key
 * Returns the agent and the plaintext API key (only shown once)
 */
export async function registerAgent(options: RegisterAgentOptions): Promise<RegisterAgentResult> {
  const { name, type = 'task', capabilities = DEFAULT_CAPABILITIES } = options;

  // Generate API key
  const apiKey = generateApiKey();
  const apiKeyHash = hashApiKey(apiKey);

  const supabase = createServiceRoleClient();

  const agentData: AgentInsert = {
    name,
    type,
    capabilities: capabilities as unknown as AgentInsert['capabilities'],
    api_key_hash: apiKeyHash,
    is_active: true,
  };

  const { data, error } = await supabase.from('agents').insert(agentData).select().single();

  if (error) {
    throw new Error(`Failed to register agent: ${error.message}`);
  }

  return {
    agent: data,
    apiKey, // Only returned once at registration
  };
}

/**
 * Get an agent by ID
 */
export async function getAgentById(id: string): Promise<Agent | null> {
  const supabase = createServiceRoleClient();

  const { data, error } = await supabase.from('agents').select('*').eq('id', id).single();

  if (error) {
    return null;
  }

  return data;
}

/**
 * Get an agent by API key hash
 */
async function getAgentByKeyHash(apiKeyHash: string): Promise<Agent | null> {
  const supabase = createServiceRoleClient();

  const { data, error } = await supabase
    .from('agents')
    .select('*')
    .eq('api_key_hash', apiKeyHash)
    .single();

  if (error) {
    return null;
  }

  return data;
}

/**
 * 4.2.8: Update agent's last active timestamp
 */
export async function updateLastActive(agentId: string): Promise<void> {
  const supabase = createServiceRoleClient();

  await supabase
    .from('agents')
    .update({ last_active_at: new Date().toISOString() })
    .eq('id', agentId);
}

/**
 * 4.2.4: Validate an API key and return the agent
 * Returns null if key is invalid or agent is inactive
 */
export async function validateApiKey(apiKey: string): Promise<Agent | null> {
  // Validate key format
  if (!apiKey.startsWith(API_KEY_PREFIX)) {
    return null;
  }

  const apiKeyHash = hashApiKey(apiKey);
  const agent = await getAgentByKeyHash(apiKeyHash);

  // Check if agent exists and is active
  if (!agent || !agent.is_active) {
    return null;
  }

  // Update last active timestamp (async, don't wait)
  updateLastActive(agent.id).catch(console.error);

  return agent;
}

/**
 * Extract Bearer token from Authorization header
 */
export function extractBearerToken(request: NextRequest): string | null {
  const authHeader = request.headers.get('authorization');

  if (!authHeader?.startsWith('Bearer ')) {
    return null;
  }

  return authHeader.slice(7);
}

/**
 * 4.2.5: Check if agent has required capability
 */
export function hasCapability(agent: Agent, requiredCapability: AgentCapability): boolean {
  const capabilities = (agent.capabilities as AgentCapability[]) || [];

  // Admin capability grants all access
  if (capabilities.includes('admin')) {
    return true;
  }

  return capabilities.includes(requiredCapability);
}

/**
 * Get the required capability for an HTTP method and resource
 */
export function getRequiredCapability(
  method: string,
  resource: string
): AgentCapability | null {
  const action = ['GET', 'HEAD', 'OPTIONS'].includes(method.toUpperCase()) ? 'read' : 'write';
  const capability = `${action}:${resource}` as AgentCapability;

  // Validate it's a known capability
  const knownResources = [
    'tasks',
    'projects',
    'boards',
    'areas',
    'milestones',
    'prds',
    'reports',
    'agents',
  ];

  if (knownResources.includes(resource)) {
    return capability;
  }

  return null;
}

/**
 * 4.2.6: Rotate an agent's API key
 * Generates a new key and invalidates the old one immediately
 */
export async function rotateApiKey(agentId: string): Promise<RotateKeyResult> {
  const agent = await getAgentById(agentId);

  if (!agent) {
    throw new Error('Agent not found');
  }

  // Generate new API key
  const apiKey = generateApiKey();
  const apiKeyHash = hashApiKey(apiKey);

  const supabase = createServiceRoleClient();

  const { data, error } = await supabase
    .from('agents')
    .update({ api_key_hash: apiKeyHash })
    .eq('id', agentId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to rotate API key: ${error.message}`);
  }

  return {
    agent: data,
    apiKey,
  };
}

/**
 * 4.2.7: Revoke an agent's access
 * Sets is_active to false
 */
export async function revokeAgent(agentId: string): Promise<Agent> {
  const supabase = createServiceRoleClient();

  const { data, error } = await supabase
    .from('agents')
    .update({ is_active: false })
    .eq('id', agentId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to revoke agent: ${error.message}`);
  }

  return data;
}

/**
 * Reactivate a revoked agent
 */
export async function reactivateAgent(agentId: string): Promise<Agent> {
  const supabase = createServiceRoleClient();

  const { data, error } = await supabase
    .from('agents')
    .update({ is_active: true })
    .eq('id', agentId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to reactivate agent: ${error.message}`);
  }

  return data;
}

/**
 * 4.2.4: Authentication middleware wrapper
 * Validates the API key and checks capabilities before calling the handler
 *
 * @param handler - The route handler to wrap
 * @param resource - The resource being accessed (e.g., 'tasks', 'projects')
 * @returns A wrapped handler that requires authentication
 */
export function withAuth<T extends object>(
  handler: (
    request: NextRequest,
    context: T & { auth: AuthContext }
  ) => Promise<NextResponse>,
  resource?: string
) {
  return async (request: NextRequest, context: T): Promise<NextResponse> => {
    // Extract Bearer token
    const apiKey = extractBearerToken(request);

    if (!apiKey) {
      return errorResponse('Missing or invalid Authorization header', 401);
    }

    // Validate API key
    const agent = await validateApiKey(apiKey);

    if (!agent) {
      return errorResponse('Invalid or revoked API key', 401);
    }

    // Check capability if resource is specified
    if (resource) {
      const requiredCapability = getRequiredCapability(request.method, resource);

      if (requiredCapability && !hasCapability(agent, requiredCapability)) {
        return errorResponse(
          `Insufficient permissions. Required: ${requiredCapability}`,
          403
        );
      }
    }

    // Add auth context and call handler
    const authContext: AuthContext = {
      agent,
      capabilities: (agent.capabilities as AgentCapability[]) || [],
    };

    return handler(request, { ...context, auth: authContext });
  };
}

/**
 * Standalone authentication check for use in route handlers
 * Returns the auth context if valid, or an error response
 */
export async function authenticateRequest(
  request: NextRequest,
  resource?: string
): Promise<{ success: true; auth: AuthContext } | { success: false; response: NextResponse }> {
  // Extract Bearer token
  const apiKey = extractBearerToken(request);

  if (!apiKey) {
    return {
      success: false,
      response: errorResponse('Missing or invalid Authorization header', 401),
    };
  }

  // Validate API key
  const agent = await validateApiKey(apiKey);

  if (!agent) {
    return {
      success: false,
      response: errorResponse('Invalid or revoked API key', 401),
    };
  }

  // Check capability if resource is specified
  if (resource) {
    const requiredCapability = getRequiredCapability(request.method, resource);

    if (requiredCapability && !hasCapability(agent, requiredCapability)) {
      return {
        success: false,
        response: errorResponse(
          `Insufficient permissions. Required: ${requiredCapability}`,
          403
        ),
      };
    }
  }

  const authContext: AuthContext = {
    agent,
    capabilities: (agent.capabilities as AgentCapability[]) || [],
  };

  return { success: true, auth: authContext };
}
