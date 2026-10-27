/**
 * LinkPulse HTTP REST API Repository Adapter
 *
 * Ready-to-connect adapter implementing repository interfaces for a future Node.js + SQL backend.
 *
 * TO ACTIVATE REST MODE:
 * 1. Set `VITE_API_BASE_URL` in your `.env` (e.g. `VITE_API_BASE_URL=http://localhost:8000/api/v1`).
 * 2. Ensure your Node.js + PostgreSQL/MySQL/SQLite backend implements the endpoints configured in `src/config/api.ts`.
 * 3. The repository provider in `src/repositories/index.ts` will direct calls to this adapter.
 */

import {
  IAuthRepository,
  ILinkRepository,
  IAnalyticsRepository,
  ICampaignRepository,
  ITrustRepository,
  IBioRepository,
} from './contracts';
import { API_CONFIG } from '../config/api';
import {
  RegisterRequest,
  LoginRequest,
  AuthResponseData,
  CreateLinkRequest,
  UpdateLinkRequest,
  CheckAliasResponseData,
  ApiResponse,
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

/**
 * Standard typed HTTP client helper for REST endpoints.
 */
async function requestHttp<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_CONFIG.baseUrl}${endpoint}`;
  const token = typeof window !== 'undefined' ? localStorage.getItem('lp_token') : null;

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorMessage = `HTTP error ${response.status}: ${response.statusText}`;
    try {
      const errorJson = await response.json();
      if (errorJson && errorJson.error) {
        errorMessage = errorJson.error;
      }
    } catch {}
    throw new Error(errorMessage);
  }

  const json = (await response.json()) as ApiResponse<T> | T;
  if (json && typeof json === 'object' && 'data' in json && 'success' in json) {
    return (json as ApiResponse<T>).data;
  }
  return json as T;
}

export class HttpAuthRepository implements IAuthRepository {
  async getCurrentUser(): Promise<User | null> {
    try {
      return await requestHttp<User>(API_CONFIG.endpoints.auth.me);
    } catch {
      return null;
    }
  }

  async login(credentials: LoginRequest): Promise<AuthResponseData> {
    return requestHttp<AuthResponseData>(API_CONFIG.endpoints.auth.login, {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  }

  async register(data: RegisterRequest): Promise<AuthResponseData> {
    return requestHttp<AuthResponseData>(API_CONFIG.endpoints.auth.register, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async logout(): Promise<void> {
    await requestHttp<void>(API_CONFIG.endpoints.auth.logout, { method: 'POST' });
  }

  async getUserCount(): Promise<number> {
    return requestHttp<number>('/auth/count');
  }

  async bootstrapAdmin(data: { name: string; email: string; passwordPlain: string }): Promise<User> {
    return requestHttp<User>(API_CONFIG.endpoints.auth.bootstrapAdmin, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }
}

export class HttpLinkRepository implements ILinkRepository {
  async getLinks(params?: {
    userId?: string;
    campaignId?: string;
    tag?: string;
    search?: string;
    status?: 'all' | 'active' | 'expired' | 'disabled' | 'expiring';
    page?: number;
    limit?: number;
  }): Promise<Link[]> {
    const query = new URLSearchParams();
    if (params?.userId) query.set('userId', params.userId);
    if (params?.campaignId) query.set('campaignId', params.campaignId);
    if (params?.tag) query.set('tag', params.tag);
    if (params?.search) query.set('search', params.search);
    if (params?.status) query.set('status', params.status);
    if (params?.page) query.set('page', String(params.page));
    if (params?.limit) query.set('limit', String(params.limit));

    const qs = query.toString();
    const endpoint = `${API_CONFIG.endpoints.links.list}${qs ? `?${qs}` : ''}`;
    return requestHttp<Link[]>(endpoint);
  }

  async getLinkById(id: string): Promise<Link | null> {
    return requestHttp<Link | null>(API_CONFIG.endpoints.links.detail(id));
  }

  async getLinkByCode(code: string): Promise<Link | null> {
    return requestHttp<Link | null>(API_CONFIG.endpoints.links.byCode(code));
  }

  async checkAliasAvailable(code: string): Promise<CheckAliasResponseData> {
    return requestHttp<CheckAliasResponseData>(API_CONFIG.endpoints.links.checkAlias(code));
  }

  async createLink(data: CreateLinkRequest & { userId: string }): Promise<Link> {
    return requestHttp<Link>(API_CONFIG.endpoints.links.create, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateLink(id: string, updates: UpdateLinkRequest): Promise<Link> {
    return requestHttp<Link>(API_CONFIG.endpoints.links.update(id), {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  }

  async deleteLink(id: string): Promise<boolean> {
    await requestHttp<void>(API_CONFIG.endpoints.links.delete(id), {
      method: 'DELETE',
    });
    return true;
  }
}

export class HttpAnalyticsRepository implements IAnalyticsRepository {
  async getDashboardAnalytics(params?: {
    range?: TimeRange;
    campaignId?: string;
    userId?: string;
    isAdmin?: boolean;
  }): Promise<DashboardAnalytics> {
    const query = new URLSearchParams();
    if (params?.range) query.set('range', params.range);
    if (params?.campaignId) query.set('campaignId', params.campaignId);
    if (params?.userId) query.set('userId', params.userId);
    if (params?.isAdmin) query.set('isAdmin', 'true');
    const qs = query.toString();
    return requestHttp<DashboardAnalytics>(`${API_CONFIG.endpoints.analytics.dashboard}${qs ? `?${qs}` : ''}`);
  }

  async getLinkAnalytics(options: { range?: string; linkId?: string; userId?: string }): Promise<AnalyticsSummary> {
    const linkId = options.linkId || '';
    return requestHttp<AnalyticsSummary>(API_CONFIG.endpoints.analytics.linkSummary(linkId));
  }

  async recordClick(params: {
    linkId: string;
    referrer?: string;
    userAgent?: string;
    source?: 'direct' | 'qr';
  }): Promise<void> {
    await requestHttp<void>(API_CONFIG.endpoints.analytics.recordClick, {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }
}

export class HttpCampaignRepository implements ICampaignRepository {
  async getCampaigns(userId?: string): Promise<Campaign[]> {
    const qs = userId ? `?userId=${encodeURIComponent(userId)}` : '';
    return requestHttp<Campaign[]>(`${API_CONFIG.endpoints.campaigns.list}${qs}`);
  }

  async createCampaign(data: { userId: string; name: string; description?: string; color: string }): Promise<Campaign> {
    return requestHttp<Campaign>(API_CONFIG.endpoints.campaigns.create, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async deleteCampaign(id: string): Promise<boolean> {
    await requestHttp<void>(API_CONFIG.endpoints.campaigns.delete(id), { method: 'DELETE' });
    return true;
  }

  async getTags(userId?: string): Promise<Tag[]> {
    const qs = userId ? `?userId=${encodeURIComponent(userId)}` : '';
    return requestHttp<Tag[]>(`${API_CONFIG.endpoints.tags.list}${qs}`);
  }

  async createTag(data: { name: string; userId: string; color?: string }): Promise<Tag> {
    return requestHttp<Tag>(API_CONFIG.endpoints.tags.create, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async deleteTag(id: string): Promise<boolean> {
    await requestHttp<void>(API_CONFIG.endpoints.tags.delete(id), { method: 'DELETE' });
    return true;
  }
}

export class HttpTrustRepository implements ITrustRepository {
  async getBlocklist(): Promise<BlocklistEntry[]> {
    return requestHttp<BlocklistEntry[]>(API_CONFIG.endpoints.trust.blocklist);
  }

  async addBlocklistEntry(domain: string, reason: string, addedBy?: string): Promise<BlocklistEntry> {
    return requestHttp<BlocklistEntry>(API_CONFIG.endpoints.trust.blocklist, {
      method: 'POST',
      body: JSON.stringify({ domain, reason, addedBy }),
    });
  }

  async removeBlocklistEntry(id: string): Promise<boolean> {
    await requestHttp<void>(`${API_CONFIG.endpoints.trust.blocklist}/${id}`, { method: 'DELETE' });
    return true;
  }

  async getAbuseReports(): Promise<AbuseReport[]> {
    return requestHttp<AbuseReport[]>('/trust/reports');
  }

  async submitAbuseReport(data: {
    linkId?: string;
    shortCode?: string;
    originalUrl?: string;
    reason: string;
    reporterEmail?: string;
  }): Promise<{ success: boolean; reportId: string }> {
    return requestHttp<{ success: boolean; reportId: string }>(API_CONFIG.endpoints.trust.reportAbuse, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async resolveAbuseReport(id: string, resolution: 'resolved' | 'dismissed', action?: 'disable_link'): Promise<boolean> {
    await requestHttp<void>(`/trust/reports/${id}/resolve`, {
      method: 'POST',
      body: JSON.stringify({ resolution, action }),
    });
    return true;
  }
}

export class HttpBioRepository implements IBioRepository {
  async getBioPage(userId: string): Promise<BioPage> {
    return requestHttp<BioPage>(`${API_CONFIG.endpoints.bio.getMine}?userId=${encodeURIComponent(userId)}`);
  }

  async getBioPageBySlug(slug: string): Promise<BioPage> {
    return requestHttp<BioPage>(API_CONFIG.endpoints.bio.getBySlug(slug));
  }

  async saveBioPage(userId: string, data: Partial<BioPage>): Promise<BioPage> {
    return requestHttp<BioPage>(API_CONFIG.endpoints.bio.updateMine, {
      method: 'PUT',
      body: JSON.stringify({ userId, ...data }),
    });
  }
}
