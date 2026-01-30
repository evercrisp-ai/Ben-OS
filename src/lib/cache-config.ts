/**
 * 5.2.5 Caching Strategy - Centralized cache configuration
 * 
 * This module defines stale times for different data types based on
 * how frequently they change and their importance.
 */

// Time constants (in milliseconds)
const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;

/**
 * Stale times for React Query - how long data is considered fresh
 */
export const STALE_TIMES = {
  // Static reference data (changes rarely)
  areas: 5 * MINUTE,      // Life areas change infrequently
  agents: 10 * MINUTE,    // Agent list is relatively static
  
  // Project data (changes occasionally)
  projects: 3 * MINUTE,   // Projects change less frequently
  boards: 3 * MINUTE,     // Board configurations are relatively stable
  prds: 2 * MINUTE,       // PRDs update during editing sessions
  prdVersions: 5 * MINUTE, // Version history is append-only
  
  // Operational data (changes frequently)
  tasks: 1 * MINUTE,      // Tasks change frequently in active work
  subtasks: 1 * MINUTE,   // Subtasks tied to task updates
  milestones: 2 * MINUTE, // Milestones track task progress
  
  // Analytics data (can be stale longer)
  activityLogs: 5 * MINUTE, // Activity feed can lag
  reports: 10 * MINUTE,     // Reports are generated periodically
  chartData: 5 * MINUTE,    // Chart data updates less urgently
  
  // Search results (ephemeral)
  search: 30 * SECOND,    // Search results should be fresh
};

/**
 * Garbage collection times - how long to keep data in cache after it becomes unused
 */
export const GC_TIMES = {
  default: 10 * MINUTE,
  reports: 30 * MINUTE,    // Keep reports longer
  chartData: 15 * MINUTE,  // Chart data is expensive to compute
};

/**
 * API Cache Control headers
 */
export const CACHE_HEADERS = {
  // Immutable static assets (fonts, icons)
  immutable: 'public, max-age=31536000, immutable',
  
  // Static but may update (CSS, JS bundles)
  static: 'public, max-age=31536000, immutable',
  
  // API responses - no caching
  api: 'no-cache, no-store, must-revalidate',
  
  // API responses - short cache for read operations
  apiRead: 'public, max-age=60, stale-while-revalidate=300',
  
  // HTML pages
  page: 'public, max-age=0, must-revalidate',
};

/**
 * HTTP cache helper for API routes
 */
export function getCacheHeaders(type: keyof typeof CACHE_HEADERS): HeadersInit {
  return {
    'Cache-Control': CACHE_HEADERS[type],
  };
}

/**
 * Prefetch configuration for anticipated navigation
 */
export const PREFETCH_CONFIG = {
  // Prefetch on hover delay (ms)
  hoverDelay: 100,
  
  // Prefetch priorities
  priorities: {
    high: ['tasks', 'boards'],    // Most likely to be accessed
    medium: ['projects', 'prds'], // Secondary navigation
    low: ['reports', 'activity'], // Less frequent access
  },
};
