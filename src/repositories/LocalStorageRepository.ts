/**
 * LinkPulse LocalStorage Repository Implementation
 * Provides high-speed, 100% frontend persistent data storage via browser localStorage
 * implementing the repository contracts.
 */

import {
  IAuthRepository,
  ILinkRepository,
  IAnalyticsRepository,
  ICampaignRepository,
  ITrustRepository,
  IBioRepository,
} from './contracts';
import { db } from '../lib/api/mockDb';
import { authService } from '../services/auth/authService';
import { analyticsService } from '../services/analytics/analyticsService';
import { campaignService, tagService } from '../services/campaigns/campaignService';
import { trustService } from '../services/trust/trustService';
import { bioService } from '../services/bio/bioService';
import {
  RegisterRequest,
  LoginRequest,
  AuthResponseData,
  CreateLinkRequest,
  UpdateLinkRequest,
  CheckAliasResponseData,
} from '../types/apiContracts';
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

export class LocalAuthRepository implements IAuthRepository {
  async getCurrentUser(): Promise<User | null> {
    return authService.getCurrentUser();
  }

  async login(credentials: LoginRequest): Promise<AuthResponseData> {
    const user = await authService.login(credentials.email, credentials.passwordPlain);
    const token = `lp_local_tok_${user.id}_${Date.now()}`;
    return {
      user,
      token,
      expiresInSeconds: 86400 * 7,
    };
  }

  async register(data: RegisterRequest): Promise<AuthResponseData> {
    const user = await authService.register(data.name, data.email, data.passwordPlain);
    const token = `lp_local_tok_${user.id}_${Date.now()}`;
    return {
      user,
      token,
      expiresInSeconds: 86400 * 7,
    };
  }

  async logout(): Promise<void> {
    await authService.logout();
  }

  async getUserCount(): Promise<number> {
    return authService.getUserCount();
  }

  async bootstrapAdmin(data: { name: string; email: string; passwordPlain: string }): Promise<User> {
    return authService.bootstrapAdmin(data);
  }
}

export class LocalLinkRepository implements ILinkRepository {
  async getLinks(params?: {
    userId?: string;
    campaignId?: string;
    tag?: string;
    search?: string;
    status?: 'all' | 'active' | 'expired' | 'disabled' | 'expiring';
    page?: number;
    limit?: number;
  }): Promise<Link[]> {
    const dbStatus =
      params?.status === 'expiring'
        ? 'active'
        : params?.status === 'all'
          ? 'all'
          : params?.status;

    return db.getLinks({
      userId: params?.userId,
      campaignId: params?.campaignId,
      status: dbStatus,
      search: params?.search,
    });
  }

  async getLinkById(id: string): Promise<Link | null> {
    return db.getLinkById(id);
  }

  async getLinkByCode(code: string): Promise<Link | null> {
    return db.getLinkByCode(code);
  }

  async checkAliasAvailable(code: string): Promise<CheckAliasResponseData> {
    const cleanCode = code.trim().toLowerCase();
    const existing = await db.getLinkByCode(cleanCode);
    if (existing) {
      return {
        code,
        available: false,
        reason: 'This custom alias is already reserved. Please select a unique code.',
      };
    }
    return {
      code,
      available: true,
    };
  }

  async createLink(data: CreateLinkRequest & { userId: string }): Promise<Link> {
    const shortCode = data.shortCode || Math.random().toString(36).substring(2, 8);
    const title = data.title || 'Untitled Link';
    return db.createLink({
      userId: data.userId,
      originalUrl: data.originalUrl,
      shortCode,
      title,
      campaignId: data.campaignId,
      tags: data.tags,
      rules: data.rules,
    });
  }

  async updateLink(id: string, updates: UpdateLinkRequest): Promise<Link> {
    return db.updateLink(id, updates);
  }

  async deleteLink(id: string): Promise<boolean> {
    return db.deleteLink(id);
  }
}

export class LocalAnalyticsRepository implements IAnalyticsRepository {
  async getDashboardAnalytics(params?: {
    range?: TimeRange;
    campaignId?: string;
    userId?: string;
    isAdmin?: boolean;
  }): Promise<DashboardAnalytics> {
    return analyticsService.getDashboardAnalytics({
      range: params?.range || '7d',
      campaignId: params?.campaignId,
      userId: params?.userId,
      isAdmin: params?.isAdmin,
    });
  }

  async getLinkAnalytics(options: { range?: string; linkId?: string; userId?: string }): Promise<AnalyticsSummary> {
    return analyticsService.getAnalytics(options);
  }

  async recordClick(params: {
    linkId: string;
    referrer?: string;
    userAgent?: string;
    source?: 'direct' | 'qr';
  }): Promise<void> {
    return analyticsService.recordClick(params);
  }
}

export class LocalCampaignRepository implements ICampaignRepository {
  async getCampaigns(userId?: string): Promise<Campaign[]> {
    return campaignService.getCampaigns(userId);
  }

  async createCampaign(data: { userId: string; name: string; description?: string; color: string }): Promise<Campaign> {
    return campaignService.createCampaign(data);
  }

  async deleteCampaign(id: string): Promise<boolean> {
    await campaignService.deleteCampaign(id);
    return true;
  }

  async getTags(userId?: string): Promise<Tag[]> {
    return tagService.getTags(userId);
  }

  async createTag(data: { name: string; userId: string; color?: string }): Promise<Tag> {
    return tagService.createTag(data.name, data.userId, data.color);
  }

  async deleteTag(id: string): Promise<boolean> {
    await tagService.deleteTag(id);
    return true;
  }
}

export class LocalTrustRepository implements ITrustRepository {
  async getBlocklist(): Promise<BlocklistEntry[]> {
    return trustService.getBlocklist();
  }

  async addBlocklistEntry(domain: string, reason: string, addedBy?: string): Promise<BlocklistEntry> {
    return trustService.addBlocklistEntry(domain, reason, addedBy);
  }

  async removeBlocklistEntry(id: string): Promise<boolean> {
    await trustService.removeBlocklistEntry(id);
    return true;
  }

  async getAbuseReports(): Promise<AbuseReport[]> {
    return trustService.getAbuseReports();
  }

  async submitAbuseReport(data: {
    linkId?: string;
    shortCode?: string;
    originalUrl?: string;
    reason: string;
    reporterEmail?: string;
  }): Promise<{ success: boolean; reportId: string }> {
    return trustService.reportAbuse(data);
  }

  async resolveAbuseReport(id: string, resolution: 'resolved' | 'dismissed', action?: 'disable_link'): Promise<boolean> {
    await trustService.resolveAbuseReport(id, resolution, action);
    return true;
  }
}

export class LocalBioRepository implements IBioRepository {
  async getBioPage(userId: string): Promise<BioPage> {
    return bioService.getBioPage(userId);
  }

  async getBioPageBySlug(slug: string): Promise<BioPage> {
    return bioService.getPublicBioPage(slug);
  }

  async saveBioPage(userId: string, data: Partial<BioPage>): Promise<BioPage> {
    return bioService.saveBioPage(userId, data);
  }
}
