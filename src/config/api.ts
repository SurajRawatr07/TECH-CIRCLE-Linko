/**
 * Linko API & Backend Integration Configuration
 *
 * Central configuration boundary connecting Linko to local browser storage
 * or a future Node.js + Fastify + PostgreSQL REST API backend.
 *
 * CONFIGURATION FLAGS:
 * - VITE_DATA_MODE: 'local' (default) | 'api'
 * - VITE_API_BASE_URL: Base URL for REST endpoints (e.g., https://api.linko.io/v1 or http://localhost:8000/api/v1)
 * - VITE_PUBLIC_SHORT_DOMAIN: Public custom short link domain (optional)
 *
 * HOW TO CONNECT THE FASTIFY + POSTGRESQL BACKEND:
 * 1. Define `VITE_DATA_MODE=api` and `VITE_API_BASE_URL=http://localhost:8000/api/v1` in `.env`.
 * 2. The HTTP Repository (`src/repositories/HttpApiRepository.ts`) will activate when `API_CONFIG.isBackendConnected`
 *    is true, routing authentication, link creation, analytics, and admin moderation to the Fastify REST server.
 * 3. In local mode (default), Linko runs 100% in-browser using `LocalStorageRepository.ts` and the modular local database.
 */

const rawDataMode = (import.meta.env.VITE_DATA_MODE || 'local').toLowerCase();
const rawBaseUrl = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');

// Data mode validation
export const DATA_MODE: 'local' | 'api' =
  rawDataMode === 'api' && rawBaseUrl ? 'api' : 'local';

export const API_CONFIG = {
  // Current data mode ('local' | 'api')
  dataMode: DATA_MODE,

  // Base URL for REST endpoints
  baseUrl: rawBaseUrl,

  // Connection status flag based on environment variable configuration
  isBackendConnected: DATA_MODE === 'api' && Boolean(rawBaseUrl),

  // REST API Endpoint Routes for Fastify Backend
  endpoints: {
    // Auth routes
    auth: {
      login: '/auth/login',
      signup: '/auth/signup',
      register: '/auth/register',
      me: '/auth/me',
      logout: '/auth/logout',
      bootstrapAdmin: '/auth/bootstrap-admin',
    },

    // Link Management routes
    links: {
      list: '/links',
      create: '/links',
      detail: (id: string) => `/links/${id}`,
      update: (id: string) => `/links/${id}`,
      delete: (id: string) => `/links/${id}`,
      checkAlias: (code: string) => `/links/check-alias?code=${encodeURIComponent(code)}`,
      byCode: (code: string) => `/links/code/${encodeURIComponent(code)}`,
    },

    // Analytics routes
    analytics: {
      dashboard: '/analytics/dashboard',
      linkSummary: (id: string) => `/analytics/links/${id}/summary`,
      recordClick: '/analytics/clicks',
    },

    // Campaigns & Tags routes
    campaigns: {
      list: '/campaigns',
      create: '/campaigns',
      detail: (id: string) => `/campaigns/${id}`,
      delete: (id: string) => `/campaigns/${id}`,
    },
    tags: {
      list: '/tags',
      create: '/tags',
      delete: (id: string) => `/tags/${id}`,
    },

    // Security & Trust Center routes
    trust: {
      reportAbuse: '/trust/report',
      blocklist: '/trust/blocklist',
      domainReputation: (domain: string) => `/trust/check-domain?domain=${encodeURIComponent(domain)}`,
    },

    // Bio Builder routes
    bio: {
      getMine: '/bio/me',
      updateMine: '/bio/me',
      getBySlug: (slug: string) => `/bio/p/${encodeURIComponent(slug)}`,
    },

    // Policy Lab & Redirect Simulator routes
    policyLab: {
      simulate: '/policy-lab/simulate',
    },

    // Admin Telemetry & Management routes
    admin: {
      overview: '/admin/overview',
      stats: '/admin/stats',
      users: '/admin/users',
      links: '/admin/links',
      security: '/admin/security',
      anomalies: '/admin/anomalies',
      auditLogs: '/admin/audit-logs',
      updateBlocklist: '/admin/blocklist',
      updateLinkStatus: (id: string) => `/admin/links/${id}/status`,
    },
  },

  // HTTP Request Default Timeout (ms)
  timeoutMs: 10000,
} as const;
