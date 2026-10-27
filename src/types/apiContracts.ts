/**
 * Linko REST API Typed Contracts
 * Strongly-typed request/response models for the future Node.js + Fastify + PostgreSQL backend.
 */

import {
  Link,
  User,
  Campaign,
  Tag,
  BlocklistEntry,
  DashboardAnalytics,
  AnalyticsSummary,
  BioPage,
  AbuseReport,
} from './index';

// ========================
// Generic API Responses
// ========================

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  timestamp: string;
}

export interface ApiErrorResponse {
  success: false;
  error: string;
  code?: string;
  details?: Record<string, string[]>;
  timestamp: string;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ========================
// Auth Contracts
// ========================

export interface RegisterRequest {
  name: string;
  email: string;
  passwordPlain: string;
}

export interface LoginRequest {
  email: string;
  passwordPlain: string;
}

export interface AuthResponseData {
  user: User;
  token: string;
  expiresInSeconds: number;
}

// ========================
// Link Contracts
// ========================

export interface CreateLinkRequest {
  originalUrl: string;
  shortCode?: string;
  title?: string;
  campaignId?: string;
  tags?: string[];
  rules?: {
    expiresAt?: string;
    clickLimit?: number;
    password?: string;
    mobileUrl?: string;
    utmCampaign?: string;
    utmSource?: string;
    utmMedium?: string;
  };
}

export interface UpdateLinkRequest {
  title?: string;
  originalUrl?: string;
  campaignId?: string;
  tags?: string[];
  isActive?: boolean;
  rules?: {
    expiresAt?: string;
    clickLimit?: number;
    password?: string;
    mobileUrl?: string;
    utmCampaign?: string;
    utmSource?: string;
    utmMedium?: string;
  };
}

export interface CheckAliasResponseData {
  code: string;
  available: boolean;
  reason?: string;
}

// ========================
// Analytics Contracts
// ========================

export interface RecordClickRequest {
  shortCode: string;
  referrer?: string;
  userAgent?: string;
  country?: string;
  city?: string;
  deviceType?: 'desktop' | 'mobile' | 'tablet';
}

export interface RecordClickResponseData {
  counted: boolean;
  destinationUrl: string;
  reason?: string;
}

// ========================
// Campaign & Tag Contracts
// ========================

export interface CreateCampaignRequest {
  name: string;
  description?: string;
  color?: string;
}

export interface CreateTagRequest {
  name: string;
  color?: string;
}

// ========================
// Trust & Security Contracts
// ========================

export interface SubmitAbuseReportRequest {
  shortCode: string;
  reason: string;
  reporterEmail?: string;
  details?: string;
}

export interface DomainCheckResponseData {
  domain: string;
  isBlocklisted: boolean;
  riskScore: number;
  threatLevel: 'low' | 'moderate' | 'high' | 'critical';
  details?: string;
}

// ========================
// Admin Contracts
// ========================

export interface AdminStatsResponseData {
  totalLinks: number;
  totalUsers: number;
  totalClicks: number;
  activeBlocklistCount: number;
  flaggedLinksCount: number;
  recentAnomaliesCount: number;
}
