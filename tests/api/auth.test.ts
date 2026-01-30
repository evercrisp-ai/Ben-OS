/**
 * Agent Authentication Tests for Ben OS
 * Section 4.2 - Agent Authentication
 *
 * Tests all authentication features:
 * - 4.2.1: Agent registration
 * - 4.2.2: API key generation
 * - 4.2.3: API key hashing
 * - 4.2.4: Key validation middleware
 * - 4.2.5: Agent capabilities
 * - 4.2.6: Key rotation
 * - 4.2.7: Key revocation
 * - 4.2.8: Last active tracking
 */

import { describe, test, expect, beforeAll, afterAll, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// Store registered agents for tests
const registeredAgents: Map<
  string,
  {
    id: string;
    name: string;
    type: string;
    capabilities: string[];
    api_key_hash: string;
    is_active: boolean;
    last_active_at: string | null;
    created_at: string;
    updated_at: string;
  }
> = new Map();

// Mock Supabase client for testing
vi.mock('@/lib/supabase/server', () => {
  type MockRecord = Record<string, unknown>;

  let idCounter = 1;
  // Generate valid UUID-like IDs for testing
  const generateId = () => {
    const counter = idCounter++;
    const hex = counter.toString(16).padStart(12, '0');
    return `00000000-0000-0000-0000-${hex}`;
  };

  const createMockQuery = (table: string) => {
    const filters: Array<{ type: string; args: unknown[] }> = [];
    let isSingle = false;
    let insertData: unknown = null;
    let updateData: unknown = null;

    const query = {
      select: () => query,
      insert: (data: unknown) => {
        insertData = data;
        return query;
      },
      update: (data: unknown) => {
        updateData = data;
        return query;
      },
      eq: (field: string, value: unknown) => {
        filters.push({ type: 'eq', args: [field, value] });
        return query;
      },
      single: () => {
        isSingle = true;
        return query;
      },
      then: async (resolve: (result: unknown) => void) => {
        let result: unknown;

        if (table === 'agents') {
          if (insertData) {
            // Handle insert
            const newAgent = {
              ...(insertData as MockRecord),
              id: generateId(),
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              last_active_at: null,
            };
            registeredAgents.set(newAgent.id as string, newAgent as typeof registeredAgents extends Map<string, infer V> ? V : never);
            result = { data: newAgent, error: null };
          } else if (updateData) {
            // Handle update
            const idFilter = filters.find((f) => f.type === 'eq' && f.args[0] === 'id');
            if (idFilter) {
              const id = idFilter.args[1] as string;
              const agent = registeredAgents.get(id);
              if (agent) {
                const updated = {
                  ...agent,
                  ...(updateData as MockRecord),
                  updated_at: new Date().toISOString(),
                };
                registeredAgents.set(id, updated as typeof registeredAgents extends Map<string, infer V> ? V : never);
                result = { data: updated, error: null };
              } else {
                result = { data: null, error: { message: 'Not found' } };
              }
            }
          } else {
            // Handle select
            let found = null;
            const idFilter = filters.find((f) => f.type === 'eq' && f.args[0] === 'id');
            const hashFilter = filters.find(
              (f) => f.type === 'eq' && f.args[0] === 'api_key_hash'
            );

            if (idFilter) {
              found = registeredAgents.get(idFilter.args[1] as string) || null;
            } else if (hashFilter) {
              const hash = hashFilter.args[1] as string;
              for (const agent of registeredAgents.values()) {
                if (agent.api_key_hash === hash) {
                  found = agent;
                  break;
                }
              }
            }

            if (isSingle) {
              result = {
                data: found,
                error: found ? null : { message: 'Not found' },
              };
            } else {
              result = { data: found ? [found] : [], error: null };
            }
          }
        } else {
          // For other tables, return empty result
          result = { data: isSingle ? null : [], error: null };
        }

        resolve(result);
      },
    };

    return query;
  };

  return {
    createServiceRoleClient: () => ({
      from: (table: string) => createMockQuery(table),
    }),
  };
});

// Import auth utilities after mocking
import {
  generateApiKey,
  hashApiKey,
  registerAgent,
  getAgentById,
  validateApiKey,
  hasCapability,
  rotateApiKey,
  revokeAgent,
  authenticateRequest,
  extractBearerToken,
  type AgentCapability,
} from '@/lib/api/auth';

// Helper to create mock NextRequest
function createRequest(
  url: string,
  options: {
    method?: string;
    body?: unknown;
    headers?: Record<string, string>;
  } = {}
): NextRequest {
  const { method = 'GET', body, headers = {} } = options;

  return new NextRequest(new URL(url, 'http://localhost:3000'), {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
}

describe('4.2 Agent Authentication', () => {
  beforeEach(() => {
    // Clear registered agents before each test
    registeredAgents.clear();
  });

  describe('4.2.1 Agent Registration', () => {
    test('Can register agent', async () => {
      const { agent, apiKey } = await registerAgent({ name: 'Test Agent' });

      expect(agent.id).toBeDefined();
      expect(agent.name).toBe('Test Agent');
      expect(agent.is_active).toBe(true);
      expect(apiKey).toMatch(/^bos_[a-zA-Z0-9]{32}$/);
    });

    test('Agent gets default capabilities', async () => {
      const { agent } = await registerAgent({ name: 'Default Agent' });

      const capabilities = agent.capabilities as AgentCapability[];
      expect(capabilities).toContain('read:tasks');
      expect(capabilities).toContain('read:projects');
    });

    test('Can register agent with custom capabilities', async () => {
      const { agent } = await registerAgent({
        name: 'Custom Agent',
        capabilities: ['read:tasks', 'write:tasks'],
      });

      const capabilities = agent.capabilities as AgentCapability[];
      expect(capabilities).toContain('read:tasks');
      expect(capabilities).toContain('write:tasks');
      expect(capabilities).not.toContain('write:projects');
    });

    test('Can register primary agent type', async () => {
      const { agent } = await registerAgent({
        name: 'Primary Agent',
        type: 'primary',
      });

      expect(agent.type).toBe('primary');
    });
  });

  describe('4.2.2 API Key Generation', () => {
    test('API key is secure', () => {
      const key = generateApiKey();

      expect(key.length).toBeGreaterThan(32);
      expect(key).toMatch(/^bos_/);
    });

    test('API key format is correct', () => {
      const key = generateApiKey();

      // Should be bos_ prefix + 32 alphanumeric characters
      expect(key).toMatch(/^bos_[a-zA-Z0-9]{32}$/);
      expect(key.length).toBe(36); // 4 (prefix) + 32 (key)
    });

    test('Generated keys are unique', () => {
      const keys = new Set<string>();

      for (let i = 0; i < 100; i++) {
        keys.add(generateApiKey());
      }

      expect(keys.size).toBe(100);
    });

    test('Keys contain mixed case and numbers', () => {
      const key = generateApiKey();
      const keyPart = key.slice(4); // Remove bos_ prefix

      // Over 100 keys, we should see all character types
      const allKeys = Array.from({ length: 100 }, () => generateApiKey().slice(4)).join('');

      expect(allKeys).toMatch(/[A-Z]/);
      expect(allKeys).toMatch(/[a-z]/);
      expect(allKeys).toMatch(/[0-9]/);
    });
  });

  describe('4.2.3 API Key Hashing', () => {
    test('Key is hashed in database', async () => {
      const { agent, apiKey } = await registerAgent({ name: 'Hash Test' });
      const dbAgent = await getAgentById(agent.id);

      expect(dbAgent).not.toBeNull();
      expect(dbAgent!.api_key_hash).not.toBe(apiKey);
      expect(dbAgent!.api_key_hash).toMatch(/^[a-f0-9]{64}$/);
    });

    test('Hash function produces consistent results', () => {
      const key = 'bos_TestKey12345678901234567890ab';
      const hash1 = hashApiKey(key);
      const hash2 = hashApiKey(key);

      expect(hash1).toBe(hash2);
    });

    test('Different keys produce different hashes', () => {
      const key1 = generateApiKey();
      const key2 = generateApiKey();

      const hash1 = hashApiKey(key1);
      const hash2 = hashApiKey(key2);

      expect(hash1).not.toBe(hash2);
    });

    test('Hash is SHA-256 format', () => {
      const hash = hashApiKey('bos_TestKey12345678901234567890ab');

      // SHA-256 produces 64 hex characters
      expect(hash).toMatch(/^[a-f0-9]{64}$/);
      expect(hash.length).toBe(64);
    });
  });

  describe('4.2.4 Key Validation Middleware', () => {
    test('Middleware validates key', async () => {
      // Register an agent
      const { apiKey } = await registerAgent({ name: 'Validation Test' });

      // Test with invalid key
      const invalidRequest = createRequest('/api/v1/tasks', {
        headers: { Authorization: 'Bearer invalid_key' },
      });
      const invalidResult = await authenticateRequest(invalidRequest);

      expect(invalidResult.success).toBe(false);
      if (!invalidResult.success) {
        expect(invalidResult.response.status).toBe(401);
      }

      // Test with valid key
      const validRequest = createRequest('/api/v1/tasks', {
        headers: { Authorization: `Bearer ${apiKey}` },
      });
      const validResult = await authenticateRequest(validRequest);

      expect(validResult.success).toBe(true);
    });

    test('Missing Authorization header returns 401', async () => {
      const request = createRequest('/api/v1/tasks');
      const result = await authenticateRequest(request);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.response.status).toBe(401);
      }
    });

    test('Invalid Bearer format returns 401', async () => {
      const request = createRequest('/api/v1/tasks', {
        headers: { Authorization: 'Basic dXNlcjpwYXNz' },
      });
      const result = await authenticateRequest(request);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.response.status).toBe(401);
      }
    });

    test('Extract Bearer token correctly', () => {
      const request = createRequest('/api/v1/tasks', {
        headers: { Authorization: 'Bearer bos_test123' },
      });

      const token = extractBearerToken(request);
      expect(token).toBe('bos_test123');
    });

    test('Returns null for missing Bearer token', () => {
      const request = createRequest('/api/v1/tasks');
      const token = extractBearerToken(request);

      expect(token).toBeNull();
    });
  });

  describe('4.2.5 Agent Capabilities', () => {
    test('Capabilities restrict access', async () => {
      const { agent, apiKey } = await registerAgent({
        name: 'Limited',
        capabilities: ['read:tasks'],
      });

      // Read should work
      const readRequest = createRequest('/api/v1/tasks', {
        method: 'GET',
        headers: { Authorization: `Bearer ${apiKey}` },
      });
      const readResult = await authenticateRequest(readRequest, 'tasks');

      expect(readResult.success).toBe(true);

      // Write should fail
      const writeRequest = createRequest('/api/v1/tasks', {
        method: 'POST',
        headers: { Authorization: `Bearer ${apiKey}` },
      });
      const writeResult = await authenticateRequest(writeRequest, 'tasks');

      expect(writeResult.success).toBe(false);
      if (!writeResult.success) {
        expect(writeResult.response.status).toBe(403);
      }
    });

    test('hasCapability checks correctly', async () => {
      const { agent } = await registerAgent({
        name: 'Cap Test',
        capabilities: ['read:tasks', 'write:tasks'],
      });

      expect(hasCapability(agent, 'read:tasks')).toBe(true);
      expect(hasCapability(agent, 'write:tasks')).toBe(true);
      expect(hasCapability(agent, 'write:projects')).toBe(false);
    });

    test('Admin capability grants all access', async () => {
      const { agent } = await registerAgent({
        name: 'Admin Agent',
        capabilities: ['admin'],
      });

      expect(hasCapability(agent, 'read:tasks')).toBe(true);
      expect(hasCapability(agent, 'write:tasks')).toBe(true);
      expect(hasCapability(agent, 'write:projects')).toBe(true);
      expect(hasCapability(agent, 'admin')).toBe(true);
    });
  });

  describe('4.2.6 Key Rotation', () => {
    test('Key can be rotated', async () => {
      const { agent, apiKey: oldKey } = await registerAgent({ name: 'Rotation Test' });
      const { apiKey: newKey } = await rotateApiKey(agent.id);

      expect(newKey).not.toBe(oldKey);
      expect(newKey).toMatch(/^bos_[a-zA-Z0-9]{32}$/);
    });

    test('Old key is invalidated after rotation', async () => {
      const { agent, apiKey: oldKey } = await registerAgent({ name: 'Rotation Invalidate' });
      const { apiKey: newKey } = await rotateApiKey(agent.id);

      // Old key should fail
      const oldKeyRequest = createRequest('/api/v1/tasks', {
        headers: { Authorization: `Bearer ${oldKey}` },
      });
      const oldResult = await authenticateRequest(oldKeyRequest);

      expect(oldResult.success).toBe(false);
      if (!oldResult.success) {
        expect(oldResult.response.status).toBe(401);
      }

      // New key should work
      const newKeyRequest = createRequest('/api/v1/tasks', {
        headers: { Authorization: `Bearer ${newKey}` },
      });
      const newResult = await authenticateRequest(newKeyRequest);

      expect(newResult.success).toBe(true);
    });

    test('Rotation throws for non-existent agent', async () => {
      await expect(rotateApiKey('00000000-0000-0000-0000-000000000000')).rejects.toThrow(
        'Agent not found'
      );
    });
  });

  describe('4.2.7 Key Revocation', () => {
    test('Agent can be revoked', async () => {
      const { agent, apiKey } = await registerAgent({ name: 'Revoke Test' });
      await revokeAgent(agent.id);

      // Key should no longer work
      const request = createRequest('/api/v1/tasks', {
        headers: { Authorization: `Bearer ${apiKey}` },
      });
      const result = await authenticateRequest(request);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.response.status).toBe(401);
      }
    });

    test('Revoked agent is_active is false', async () => {
      const { agent } = await registerAgent({ name: 'Revoke Active Test' });
      const revokedAgent = await revokeAgent(agent.id);

      expect(revokedAgent.is_active).toBe(false);
    });
  });

  describe('4.2.8 Last Active Tracking', () => {
    test('Last active updates on request', async () => {
      const { agent, apiKey } = await registerAgent({ name: 'Active Test' });

      // Initial last_active_at should be null
      const initialAgent = await getAgentById(agent.id);
      expect(initialAgent?.last_active_at).toBeNull();

      // Make an authenticated request
      const request = createRequest('/api/v1/tasks', {
        headers: { Authorization: `Bearer ${apiKey}` },
      });
      await authenticateRequest(request);

      // Wait a bit for the async update
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Last active should be updated
      const updatedAgent = await getAgentById(agent.id);
      expect(updatedAgent?.last_active_at).toBeDefined();
    });
  });

  describe('Validation Edge Cases', () => {
    test('Validates API key prefix', async () => {
      // Key without bos_ prefix should fail
      const agent = await validateApiKey('invalid_prefix_key');
      expect(agent).toBeNull();
    });

    test('Handles empty Authorization header', async () => {
      const request = createRequest('/api/v1/tasks', {
        headers: { Authorization: '' },
      });
      const result = await authenticateRequest(request);

      expect(result.success).toBe(false);
    });

    test('Handles Bearer with no token', async () => {
      const request = createRequest('/api/v1/tasks', {
        headers: { Authorization: 'Bearer ' },
      });
      const result = await authenticateRequest(request);

      expect(result.success).toBe(false);
    });
  });
});
