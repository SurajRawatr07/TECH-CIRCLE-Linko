/**
 * LinkPulse API & Backend Integration Configuration
 *
 * This configuration file provides the centralized connection boundary for
 * connecting LinkPulse to a future Node.js + SQL REST API backend.
 *
 * HOW TO CONNECT A FUTURE NODE.JS + SQL BACKEND:
 * 1. Define `VITE_API_BASE_URL` in your .env file (e.g., VITE_API_BASE_URL=http://localhost:8000/api/v1).
 * 2. The HTTP Repository (`src/repositories/HttpApiRepository.ts`) will automatically activate
 *    when `API_CONFIG.isBackendConnected` is true, delegating all link, analytics, auth,
 *    and campaign requests to the REST server while maintaining identical UI component contracts.
 * 3. In offline mode or when `VITE_API_BASE_URL` is omitted, LinkPulse runs 100% client-side
 *    using `LocalStorageRepository.ts` and the modular browser database.
 */

export const API_CONFIG = {
  // Base URL for REST endpoints (e.g., https://api.linkpulse.io/v1 or http://localhost:8000/api/v1)
  baseUrl: (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, ''),

  // Connection status flag based on environment variable configuration
  isBackendConnected: Boolean(import.meta.env.VITE_API_BASE_URL),

  // REST API Endpoint Routes
  endpoints: {
    // Auth routes
    auth: {
      login: '/auth/login',
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
      stats: '/admin/stats',
      users: '/admin/users',
      links: '/admin/links',
      anomalies: '/admin/anomalies',
      auditLogs: '/admin/audit-logs',
      updateBlocklist: '/admin/blocklist',
    },
  },

  // HTTP Request Default Timeout (ms)
  timeoutMs: 10000,
} as const;
