/**
 * Linko Repository Contracts
 * Clean interface boundaries decoupling UI views from concrete persistence adapters (localStorage vs REST API).
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
  TimeRange,
} from '../types';
import {
  RegisterRequest,
  LoginRequest,
  AuthResponseData,
  CreateLinkRequest,
  UpdateLinkRequest,
  CheckAliasResponseData,
} from '../types/apiContracts';

export interface IAuthRepository {
  getCurrentUser(): Promise<User | null>;
  login(credentials: LoginRequest): Promise<AuthResponseData>;
  register(data: RegisterRequest): Promise<AuthResponseData>;
  logout(): Promise<void>;
  getUserCount(): Promise<number>;
  bootstrapAdmin(data: { name: string; email: string; passwordPlain: string }): Promise<User>;
}

export interface ILinkRepository {
  getLinks(params?: {
    userId?: string;
    campaignId?: string;
    tag?: string;
    search?: string;
    status?: 'all' | 'active' | 'expired' | 'disabled' | 'expiring';
    page?: number;
    limit?: number;
  }): Promise<Link[]>;
  getLinkById(id: string): Promise<Link | null>;
  getLinkByCode(code: string): Promise<Link | null>;
  checkAliasAvailable(code: string): Promise<CheckAliasResponseData>;
  createLink(data: CreateLinkRequest & { userId: string }): Promise<Link>;
  updateLink(id: string, updates: UpdateLinkRequest): Promise<Link>;
  deleteLink(id: string): Promise<boolean>;
}

export interface IAnalyticsRepository {
  getDashboardAnalytics(params?: {
    range?: TimeRange;
    campaignId?: string;
    userId?: string;
    isAdmin?: boolean;
  }): Promise<DashboardAnalytics>;
  getLinkAnalytics(options: { range?: string; linkId?: string; userId?: string }): Promise<AnalyticsSummary>;
  recordClick(params: {
    linkId: string;
    referrer?: string;
    userAgent?: string;
    source?: 'direct' | 'qr';
  }): Promise<void>;
}

export interface ICampaignRepository {
  getCampaigns(userId?: string): Promise<Campaign[]>;
  createCampaign(data: { userId: string; name: string; description?: string; color: string }): Promise<Campaign>;
  deleteCampaign(id: string): Promise<boolean>;
  getTags(userId?: string): Promise<Tag[]>;
  createTag(data: { name: string; userId: string; color?: string }): Promise<Tag>;
  deleteTag(id: string): Promise<boolean>;
}

export interface ITrustRepository {
  getBlocklist(): Promise<BlocklistEntry[]>;
  addBlocklistEntry(domain: string, reason: string, addedBy?: string): Promise<BlocklistEntry>;
  removeBlocklistEntry(id: string): Promise<boolean>;
  getAbuseReports(): Promise<AbuseReport[]>;
  submitAbuseReport(data: {
    linkId?: string;
    shortCode?: string;
    originalUrl?: string;
    reason: string;
    reporterEmail?: string;
  }): Promise<{ success: boolean; reportId: string }>;
  resolveAbuseReport(id: string, resolution: 'resolved' | 'dismissed', action?: 'disable_link'): Promise<boolean>;
}

export interface IBioRepository {
  getBioPage(userId: string): Promise<BioPage>;
  getBioPageBySlug(slug: string): Promise<BioPage>;
  saveBioPage(userId: string, data: Partial<BioPage>): Promise<BioPage>;
}
