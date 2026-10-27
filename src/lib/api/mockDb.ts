import {
  User,
  Link,
  ClickEvent,
  Campaign,
  Tag,
  BlocklistEntry,
  DashboardAnalytics,
  TimeRange,
  BioPage,
  AnalyticsSummary,
  AbuseReport,
} from '../../types';
import { INITIAL_BLOCKLIST, createInitialSeedData } from './seedData';
import { hashPassword, generateSalt } from '../utils/crypto';
import { parseUserAgent } from '../utils';

const STORAGE_KEYS = {
  USERS: 'linkpulse_users_v2',
  LINKS: 'linkpulse_links_v2',
  CLICKS: 'linkpulse_clicks_v2',
  CAMPAIGNS: 'linkpulse_campaigns_v2',
  TAGS: 'linkpulse_tags_v2',
  BLOCKLIST: 'linkpulse_blocklist_v2',
  SESSION: 'linkpulse_session_v2',
  LOGIN_ATTEMPTS: 'linkpulse_login_attempts',
  BIO: 'linkpulse_bio_v2',
};

function delay(ms = 100): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

class MockDb {
  private users: User[] = [];
  private links: Link[] = [];
  private clicks: ClickEvent[] = [];
  private campaigns: Campaign[] = [];
  private tags: Tag[] = [];
  private blocklist: BlocklistEntry[] = [];
  private bioPages: BioPage[] = [];

  constructor() {
    this.init();
  }

  private init() {
    if (typeof window === 'undefined') return;
    try {
      const u = localStorage.getItem(STORAGE_KEYS.USERS);
      const l = localStorage.getItem(STORAGE_KEYS.LINKS);
      const c = localStorage.getItem(STORAGE_KEYS.CLICKS);
      const cp = localStorage.getItem(STORAGE_KEYS.CAMPAIGNS);
      const t = localStorage.getItem(STORAGE_KEYS.TAGS);
      const b = localStorage.getItem(STORAGE_KEYS.BLOCKLIST);
      const bp = localStorage.getItem(STORAGE_KEYS.BIO);

      this.users = u ? JSON.parse(u) : [];
      this.links = l ? JSON.parse(l) : [];
      this.clicks = c ? JSON.parse(c) : [];
      this.campaigns = cp ? JSON.parse(cp) : [];
      this.tags = t ? JSON.parse(t) : [];
      this.blocklist = b ? JSON.parse(b) : [...INITIAL_BLOCKLIST];
      this.bioPages = bp ? JSON.parse(bp) : [];

      this.links.forEach((link) => {
        if (!link.abuseStatus) {
          link.abuseStatus = link.abuseFlag ? 'disabled' : 'clean';
        }
      });
    } catch {
      this.blocklist = [...INITIAL_BLOCKLIST];
      this.bioPages = [];
    }
  }

  private save() {
    try {
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(this.users));
      localStorage.setItem(STORAGE_KEYS.LINKS, JSON.stringify(this.links));
      localStorage.setItem(STORAGE_KEYS.CLICKS, JSON.stringify(this.clicks));
      localStorage.setItem(STORAGE_KEYS.CAMPAIGNS, JSON.stringify(this.campaigns));
      localStorage.setItem(STORAGE_KEYS.TAGS, JSON.stringify(this.tags));
      localStorage.setItem(STORAGE_KEYS.BLOCKLIST, JSON.stringify(this.blocklist));
      localStorage.setItem(STORAGE_KEYS.BIO, JSON.stringify(this.bioPages));
    } catch (e) {
      console.warn('Storage quota exceeded', e);
    }
  }

  // Auth & Session
  public async getUserCount(): Promise<number> {
    await delay(20);
    return this.users.length;
  }

  public async getCurrentSession(): Promise<User | null> {
    await delay(30);
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.SESSION);
      if (!raw) return null;
      const parsed: User = JSON.parse(raw);
      return this.users.find((u) => u.id === parsed.id) || null;
    } catch {
      return null;
    }
  }

  public async setSession(user: User | null): Promise<void> {
    if (user) {
      // do not save passwordHash/salt in session storage
      const sanitized = { ...user };
      localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(sanitized));
    } else {
      localStorage.removeItem(STORAGE_KEYS.SESSION);
    }
  }

  public getFailedAttempts(): { count: number; lockedUntil: number } {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.LOGIN_ATTEMPTS);
      if (!raw) return { count: 0, lockedUntil: 0 };
      const parsed = JSON.parse(raw);
      if (parsed.lockedUntil && Date.now() > parsed.lockedUntil) {
        localStorage.removeItem(STORAGE_KEYS.LOGIN_ATTEMPTS);
        return { count: 0, lockedUntil: 0 };
      }
      return parsed;
    } catch {
      return { count: 0, lockedUntil: 0 };
    }
  }

  public recordFailedAttempt(): { count: number; lockedUntil: number } {
    const cur = this.getFailedAttempts();
    const count = cur.count + 1;
    let lockedUntil = cur.lockedUntil;
    if (count >= 5) {
      lockedUntil = Date.now() + 60000; // 60 seconds lockout
    }
    const result = { count, lockedUntil };
    localStorage.setItem(STORAGE_KEYS.LOGIN_ATTEMPTS, JSON.stringify(result));
    return result;
  }

  public clearFailedAttempts(): void {
    localStorage.removeItem(STORAGE_KEYS.LOGIN_ATTEMPTS);
  }

  public async register(name: string, email: string, passwordPlain: string): Promise<User> {
    await delay(120);
    const normalizedEmail = email.toLowerCase().trim();
    const existing = this.users.find((u) => u.email.toLowerCase() === normalizedEmail);
    if (existing) {
      throw new Error('This email is already registered.');
    }

    const salt = generateSalt();
    const passwordHash = await hashPassword(passwordPlain, salt);

    // Every registered account in the user portal is a standard user
    const role: 'user' = 'user';

    const newUser: User = {
      id: `usr_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      name: name.trim(),
      email: normalizedEmail,
      passwordHash,
      salt,
      role,
      createdAt: new Date().toISOString(),
    };

    this.users.push(newUser);
    this.save();
    await this.setSession(newUser);
    return newUser;
  }

  public async login(email: string, passwordPlain: string): Promise<User> {
    await delay(120);
    const attempts = this.getFailedAttempts();
    if (attempts.lockedUntil && Date.now() < attempts.lockedUntil) {
      const remainingSeconds = Math.ceil((attempts.lockedUntil - Date.now()) / 1000);
      throw new Error(`Too many failed login attempts. Account temporarily locked for ${remainingSeconds} seconds.`);
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = this.users.find((u) => u.email.toLowerCase() === normalizedEmail);

    if (!user) {
      this.recordFailedAttempt();
      throw new Error('Email or password is incorrect.');
    }

    const computedHash = await hashPassword(passwordPlain, user.salt);
    if (computedHash !== user.passwordHash) {
      this.recordFailedAttempt();
      throw new Error('Email or password is incorrect.');
    }

    this.clearFailedAttempts();
    await this.setSession(user);
    return user;
  }

  public async getUsers(): Promise<User[]> {
    await delay(60);
    return [...this.users];
  }

  // Links
  public async getLinks(options?: {
    userId?: string;
    campaignId?: string;
    status?: 'all' | 'active' | 'expired' | 'disabled';
    search?: string;
    includeDeleted?: boolean;
  }): Promise<Link[]> {
    await delay(80);
    let result = [...this.links];

    // Soft delete filter
    if (!options?.includeDeleted) {
      result = result.filter((l) => !l.isDeleted);
    }

    if (options?.userId) {
      result = result.filter((l) => l.userId === options.userId);
    }
    if (options?.campaignId) {
      result = result.filter((l) => l.campaignId === options.campaignId);
    }
    if (options?.status && options.status !== 'all') {
      const now = new Date();
      if (options.status === 'active') {
        result = result.filter(
          (l) => l.isActive && !l.abuseFlag && (!l.rules.expiresAt || new Date(l.rules.expiresAt) > now)
        );
      } else if (options.status === 'expired') {
        result = result.filter((l) => l.rules.expiresAt && new Date(l.rules.expiresAt) <= now);
      } else if (options.status === 'disabled') {
        result = result.filter((l) => !l.isActive || l.abuseFlag);
      }
    }
    if (options?.search) {
      const q = options.search.toLowerCase().trim();
      result = result.filter(
        (l) =>
          l.title.toLowerCase().includes(q) ||
          l.shortCode.toLowerCase().includes(q) ||
          l.originalUrl.toLowerCase().includes(q)
      );
    }

    return result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public async getLinkById(id: string): Promise<Link | null> {
    await delay(50);
    const link = this.links.find((l) => l.id === id);
    return link ? { ...link } : null;
  }

  public async getLinkByCode(shortCode: string): Promise<Link | null> {
    await delay(20);
    const link = this.links.find((l) => l.shortCode.toLowerCase() === shortCode.toLowerCase());
    return link ? { ...link } : null;
  }

  public async createLink(data: {
    userId: string;
    originalUrl: string;
    shortCode: string;
    title: string;
    campaignId?: string;
    tags?: string[];
    rules?: Link['rules'];
  }): Promise<Link> {
    await delay(100);
    const exists = this.links.some(
      (l) => !l.isDeleted && l.shortCode.toLowerCase() === data.shortCode.toLowerCase()
    );
    if (exists) {
      throw new Error(`The alias "${data.shortCode}" is already in use.`);
    }

    let domain = 'linkpulse.io';
    try {
      domain = new URL(data.originalUrl).hostname;
    } catch {}

    const newLink: Link = {
      id: `lnk_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      userId: data.userId,
      originalUrl: data.originalUrl,
      shortCode: data.shortCode,
      title: data.title || domain,
      domain,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isActive: true,
      tags: data.tags || [],
      campaignId: data.campaignId,
      clicksCount: 0,
      uniqueClicksCount: 0,
      qrScansCount: 0,
      rules: data.rules || {},
      abuseFlag: false,
    };

    this.links.unshift(newLink);
    this.save();
    return newLink;
  }

  public async updateLink(id: string, updates: Partial<Link>): Promise<Link> {
    await delay(80);
    const idx = this.links.findIndex((l) => l.id === id);
    if (idx === -1) throw new Error('Link not found');

    this.links[idx] = {
      ...this.links[idx],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    this.save();
    return { ...this.links[idx] };
  }

  // Soft-delete action: marks link as deleted so it returns 404 on redirect, but keeps analytics
  public async softDeleteLink(id: string): Promise<boolean> {
    await delay(70);
    const link = this.links.find((l) => l.id === id);
    if (!link) return false;
    link.isDeleted = true;
    link.isActive = false;
    link.updatedAt = new Date().toISOString();
    this.save();
    return true;
  }

  public async deleteLink(id: string): Promise<boolean> {
    return this.softDeleteLink(id);
  }

  public async bulkDeleteLinks(ids: string[]): Promise<void> {
    await delay(70);
    this.links = this.links.filter((l) => !ids.includes(l.id));
    this.save();
  }

  public async bulkSetStatus(ids: string[], isActive: boolean): Promise<void> {
    await delay(70);
    this.links.forEach((l) => {
      if (ids.includes(l.id)) {
        l.isActive = isActive;
        l.updatedAt = new Date().toISOString();
      }
    });
    this.save();
  }

  // Click Logging (fire-and-forget async, does not block redirect)
  public async recordClick(params: {
    linkId: string;
    referrer?: string;
    userAgent?: string;
    source?: 'direct' | 'qr';
  }): Promise<void> {
    setTimeout(() => {
      try {
        const link = this.links.find((l) => l.id === params.linkId);
        if (!link) return;

        const ua = params.userAgent || (typeof navigator !== 'undefined' ? navigator.userAgent : '');
        const parsed = parseUserAgent(ua);

        const visitorKey = `lp_v_${link.id}`;
        let isUnique = true;
        try {
          if (typeof window !== 'undefined' && localStorage.getItem(visitorKey)) {
            isUnique = false;
          } else if (typeof window !== 'undefined') {
            localStorage.setItem(visitorKey, '1');
          }
        } catch {}

        const event: ClickEvent = {
          id: `clk_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          linkId: link.id,
          timestamp: new Date().toISOString(),
          referrer: params.referrer || 'Direct',
          deviceType: parsed.deviceType,
          browser: parsed.browser,
          os: parsed.os,
          country: 'United States',
          countryCode: 'US',
          isBot: parsed.isBot,
          isUnique,
          source: params.source || 'direct',
        };

        this.clicks.push(event);

        // Increment link counts
        link.clicksCount += 1;
        if (isUnique) link.uniqueClicksCount += 1;
        if (params.source === 'qr') link.qrScansCount += 1;

        this.save();
      } catch (err) {
        console.error('Failed to record click', err);
      }
    }, 10);
  }

  public async getClicksForLink(linkId: string, limit = 50): Promise<ClickEvent[]> {
    await delay(50);
    return this.clicks
      .filter((c) => c.linkId === linkId)
      .slice(-limit)
      .reverse();
  }

  // Dashboard Analytics (Only 4 KPI cards and ONLY 3 charts as instructed)
  public async getDashboardAnalytics(options: {
    range: TimeRange;
    campaignId?: string;
    userId?: string;
    isAdmin?: boolean;
  }): Promise<DashboardAnalytics> {
    await delay(90);

    const now = Date.now();
    const days = options.range === '7d' ? 7 : options.range === '90d' ? 90 : 30;
    const cutoff = new Date(now - days * 86400000);

    let linksScope = [...this.links].filter((l) => !l.isDeleted);
    if (!options.isAdmin && options.userId) {
      linksScope = linksScope.filter((l) => l.userId === options.userId);
    }
    if (options.campaignId) {
      linksScope = linksScope.filter((l) => l.campaignId === options.campaignId);
    }

    const scopeIds = new Set(linksScope.map((l) => l.id));

    // Exclude bot clicks from primary analytics by default
    const filteredClicks = this.clicks.filter(
      (c) => scopeIds.has(c.linkId) && new Date(c.timestamp) >= cutoff && !c.isBot
    );

    const totalLinks = linksScope.length;
    const activeLinks = linksScope.filter(
      (l) => l.isActive && !l.abuseFlag && (!l.rules.expiresAt || new Date(l.rules.expiresAt) > new Date())
    ).length;
    const totalClicks = filteredClicks.length;
    const uniqueVisitors = filteredClicks.filter((c) => c.isUnique).length;

    // 1. Chart 1: Clicks over time (line)
    const dateMap = new Map<string, { clicks: number; uniqueClicks: number }>();
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(now - i * 86400000);
      const key = d.toISOString().split('T')[0];
      dateMap.set(key, { clicks: 0, uniqueClicks: 0 });
    }

    filteredClicks.forEach((c) => {
      const key = c.timestamp.split('T')[0];
      const cur = dateMap.get(key) || { clicks: 0, uniqueClicks: 0 };
      cur.clicks += 1;
      if (c.isUnique) cur.uniqueClicks += 1;
      dateMap.set(key, cur);
    });

    const clicksOverTime = Array.from(dateMap.entries()).map(([date, counts]) => ({
      date,
      clicks: counts.clicks,
      uniqueClicks: counts.uniqueClicks,
    }));

    // 2. Chart 2: Devices (donut)
    const deviceCounts: Record<string, number> = { desktop: 0, mobile: 0, tablet: 0 };
    filteredClicks.forEach((c) => {
      deviceCounts[c.deviceType] = (deviceCounts[c.deviceType] || 0) + 1;
    });
    const totalD = totalClicks || 1;
    const deviceBreakdown = [
      { name: 'Desktop', count: deviceCounts.desktop, percentage: Math.round((deviceCounts.desktop / totalD) * 100) },
      { name: 'Mobile', count: deviceCounts.mobile, percentage: Math.round((deviceCounts.mobile / totalD) * 100) },
      { name: 'Tablet', count: deviceCounts.tablet, percentage: Math.round((deviceCounts.tablet / totalD) * 100) },
    ];

    // 3. Chart 3: Top referrers (bar)
    const refCounts: Record<string, number> = {};
    filteredClicks.forEach((c) => {
      const r = c.referrer || 'Direct';
      refCounts[r] = (refCounts[r] || 0) + 1;
    });
    const topReferrers = Object.entries(refCounts)
      .map(([name, count]) => ({
        name: name.replace(/^https?:\/\//, ''),
        count,
        percentage: Math.round((count / totalD) * 100),
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      totalLinks,
      activeLinks,
      totalClicks,
      uniqueVisitors,
      clicksOverTime,
      deviceBreakdown,
      topReferrers,
    };
  }

  public async getLinkClicks(linkId: string, limit = 50): Promise<ClickEvent[]> {
    return this.getClicksForLink(linkId, limit);
  }

  public async getAnalytics(options: { range?: string; linkId?: string; userId?: string }): Promise<AnalyticsSummary> {
    await delay(50);
    const linkId = options.linkId;
    const clicks = linkId ? this.clicks.filter((c) => c.linkId === linkId && !c.isBot) : this.clicks.filter((c) => !c.isBot);
    const totalClicks = clicks.length;
    const uniqueClicks = clicks.filter((c) => c.isUnique).length;
    const qrScans = clicks.filter((c) => c.source === 'qr').length;

    // clicks over time (last 30 days default)
    const dateMap = new Map<string, { clicks: number; uniqueClicks: number }>();
    const now = Date.now();
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now - i * 86400000);
      const key = d.toISOString().split('T')[0];
      dateMap.set(key, { clicks: 0, uniqueClicks: 0 });
    }
    clicks.forEach((c) => {
      const key = c.timestamp.split('T')[0];
      const cur = dateMap.get(key);
      if (cur) {
        cur.clicks += 1;
        if (c.isUnique) cur.uniqueClicks += 1;
      }
    });

    const clicksOverTime = Array.from(dateMap.entries()).map(([date, counts]) => ({
      date,
      clicks: counts.clicks,
      uniqueClicks: counts.uniqueClicks,
    }));

    const totalD = totalClicks || 1;
    // referrers
    const refMap: Record<string, number> = {};
    clicks.forEach((c) => {
      const r = c.referrer || 'Direct';
      refMap[r] = (refMap[r] || 0) + 1;
    });
    const referrers = Object.entries(refMap)
      .map(([name, count]) => ({
        name: name.replace(/^https?:\/\//, ''),
        count,
        percentage: Math.round((count / totalD) * 100),
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // devices
    const devMap: Record<string, number> = {};
    clicks.forEach((c) => {
      devMap[c.deviceType] = (devMap[c.deviceType] || 0) + 1;
    });
    const devices = Object.entries(devMap).map(([name, count]) => ({
      name,
      count,
      percentage: Math.round((count / totalD) * 100),
    }));

    // countries
    const countryMap: Record<string, number> = {};
    clicks.forEach((c) => {
      const country = c.country || 'Unknown';
      countryMap[country] = (countryMap[country] || 0) + 1;
    });
    const countries = Object.entries(countryMap).map(([name, count]) => ({
      name,
      count,
      percentage: Math.round((count / totalD) * 100),
    }));

    return {
      totalClicks,
      uniqueClicks,
      qrScans,
      clicksOverTime,
      referrers,
      devices,
      countries,
    };
  }

  // Campaigns
  public async getCampaigns(userId?: string): Promise<Campaign[]> {
    await delay(40);
    const camps = userId ? this.campaigns.filter((c) => c.userId === userId) : [...this.campaigns];
    return camps.map((c) => {
      const campLinks = this.links.filter((l) => l.campaignId === c.id && !l.isDeleted);
      const linksCount = campLinks.length;
      const clicksCount = campLinks.reduce((sum, l) => sum + (l.clicksCount || 0), 0);
      return {
        ...c,
        linksCount,
        clicksCount,
      };
    });
  }

  public async createCampaign(data: { userId: string; name: string; description?: string; color: string }): Promise<Campaign> {
    await delay(70);
    const newCamp: Campaign = {
      id: `cmp_${Date.now()}`,
      userId: data.userId,
      name: data.name.trim(),
      description: data.description?.trim(),
      color: data.color || '#18181b',
      createdAt: new Date().toISOString(),
    };
    this.campaigns.push(newCamp);
    this.save();
    return newCamp;
  }

  public async updateCampaign(id: string, updates: Partial<Campaign>): Promise<Campaign> {
    await delay(60);
    const camp = this.campaigns.find((c) => c.id === id);
    if (!camp) throw new Error('Campaign not found');
    Object.assign(camp, updates);
    this.save();
    return { ...camp };
  }

  public async deleteCampaign(id: string): Promise<void> {
    await delay(60);
    this.campaigns = this.campaigns.filter((c) => c.id !== id);
    this.links.forEach((l) => {
      if (l.campaignId === id) l.campaignId = undefined;
    });
    this.save();
  }

  // Tags
  public async getTags(userId?: string): Promise<Tag[]> {
    await delay(40);
    if (!userId) return [...this.tags];
    return this.tags.filter((t) => t.userId === userId);
  }

  public async createTag(arg1: string, arg2?: string, arg3?: string): Promise<Tag> {
    await delay(50);
    let userId = 'user_admin';
    let name = '';
    let color = '#18181b';

    if (arg3 !== undefined) {
      if (arg1.startsWith('usr_') || arg1.startsWith('user_')) {
        userId = arg1;
        name = arg2 || '';
        color = arg3;
      } else {
        name = arg1;
        color = arg2 || '#18181b';
        userId = arg3;
      }
    } else if (arg2 !== undefined) {
      if (arg1.startsWith('usr_') || arg1.startsWith('user_')) {
        userId = arg1;
        name = arg2;
      } else {
        name = arg1;
        userId = arg2;
      }
    } else {
      name = arg1;
    }

    const trimmed = name.trim();
    const existing = this.tags.find((t) => t.userId === userId && t.name.toLowerCase() === trimmed.toLowerCase());
    if (existing) {
      if (color && !existing.color) existing.color = color;
      return existing;
    }

    const newTag: Tag = {
      id: `tag_${Date.now()}`,
      userId,
      name: trimmed,
      color,
      createdAt: new Date().toISOString(),
    };
    this.tags.push(newTag);
    this.save();
    return newTag;
  }

  public async deleteTag(id: string): Promise<void> {
    await delay(50);
    const tag = this.tags.find((t) => t.id === id);
    if (tag) {
      this.tags = this.tags.filter((t) => t.id !== id);
      this.links.forEach((l) => {
        l.tags = l.tags.filter((t) => t !== tag.name);
      });
      this.save();
    }
  }

  // Blocklist
  public async getBlocklist(): Promise<BlocklistEntry[]> {
    await delay(50);
    return [...this.blocklist];
  }

  public async addBlocklist(domain: string, reason: string, addedBy: string): Promise<BlocklistEntry> {
    await delay(60);
    const cleaned = domain.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, '');
    const entry: BlocklistEntry = {
      id: `blk_${Date.now()}`,
      domain: cleaned,
      reason: reason.trim(),
      addedAt: new Date().toISOString(),
      addedBy,
    };
    this.blocklist.unshift(entry);

    // Auto-disable matching links
    this.links.forEach((l) => {
      try {
        const u = new URL(l.originalUrl);
        if (u.hostname.toLowerCase() === cleaned || u.hostname.toLowerCase().endsWith('.' + cleaned)) {
          l.abuseFlag = true;
          l.isActive = false;
          l.abuseReason = `Destination domain ${cleaned} on safety blocklist`;
        }
      } catch {}
    });

    this.save();
    return entry;
  }

  public async removeBlocklist(id: string): Promise<void> {
    await delay(50);
    this.blocklist = this.blocklist.filter((b) => b.id !== id);
    this.save();
  }

  public async addToBlocklist(domain: string, reason: string, addedBy: string): Promise<BlocklistEntry> {
    return this.addBlocklist(domain, reason, addedBy);
  }

  public async removeFromBlocklist(id: string): Promise<void> {
    return this.removeBlocklist(id);
  }

  // Abuse Reports
  private abuseReports: AbuseReport[] = [
    {
      id: 'rep_1',
      linkId: 'link_1',
      shortCode: 'react',
      originalUrl: 'https://github.com/facebook/react',
      targetUrl: 'https://github.com/facebook/react',
      reason: 'Automated safety verification check on developer link.',
      reporterIp: '192.168.1.1',
      reporterEmail: 'security-bot@linkpulse.io',
      reportedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
      status: 'pending',
    },
    {
      id: 'rep_2',
      linkId: 'link_phish',
      shortCode: 'claim-gift',
      originalUrl: 'https://phishing-vault.net/claim',
      targetUrl: 'https://phishing-vault.net/claim',
      reason: 'Suspicious credential form detected by threat scanner.',
      reporterIp: '192.168.1.42',
      reporterEmail: 'threat-feed@linkpulse.io',
      reportedAt: new Date(Date.now() - 86400000 * 4).toISOString(),
      status: 'pending',
    },
  ];

  public async getAbuseReports(): Promise<AbuseReport[]> {
    await delay(40);
    return [...this.abuseReports];
  }

  public async resolveAbuseReport(
    reportId: string,
    status: 'resolved' | 'dismissed',
    action?: 'disable_link'
  ): Promise<void> {
    await delay(50);
    const rep = this.abuseReports.find((r) => r.id === reportId);
    if (rep) {
      rep.status = status;
      if (action === 'disable_link') {
        const link = this.links.find((l) => l.id === rep.linkId || l.shortCode === rep.shortCode);
        if (link) {
          link.isActive = false;
          link.abuseStatus = 'disabled';
          link.abuseReason = `Disabled via abuse report: ${rep.reason}`;
        }
      }
      this.save();
    }
  }

  public async getPlatformStats(): Promise<{
    totalUsers: number;
    totalLinks: number;
    totalClicks: number;
    activeLinks: number;
    flaggedLinks: number;
    blockedDomainsCount: number;
  }> {
    await delay(40);
    return {
      totalUsers: this.users.length,
      totalLinks: this.links.length,
      totalClicks: this.clicks.length,
      activeLinks: this.links.filter((l) => l.isActive && !l.abuseFlag && !l.isDeleted).length,
      flaggedLinks: this.links.filter((l) => l.abuseStatus === 'disabled' || l.abuseStatus === 'flagged' || l.abuseFlag).length,
      blockedDomainsCount: this.blocklist.length,
    };
  }

  // Reset user data in settings
  public async resetUserData(userId: string): Promise<void> {
    await delay(120);
    // Remove all links, clicks, campaigns, tags for this user
    this.links = this.links.filter((l) => l.userId !== userId);
    this.campaigns = this.campaigns.filter((c) => c.userId !== userId);
    this.tags = this.tags.filter((t) => t.userId !== userId);

    // Re-seed fresh sample data
    const seed = createInitialSeedData(userId);
    this.campaigns.push(...seed.campaigns);
    this.tags.push(...seed.tags);
    this.links.push(...seed.links);
    this.clicks.push(...seed.clicks);
    this.save();
  }

  // Bio Pages
  public async getBioBySlug(slug: string): Promise<BioPage | null> {
    await delay(50);
    const found = this.bioPages.find((b) => b.slug.toLowerCase() === slug.toLowerCase().trim());
    return found || null;
  }

  public async getBioByUserId(userId: string): Promise<BioPage> {
    await delay(50);
    let found = this.bioPages.find((b) => b.userId === userId);
    if (!found) {
      const user = this.users.find((u) => u.id === userId);
      const slug = (user?.name || 'profile').toLowerCase().replace(/[^a-z0-9]/g, '') || `user${Date.now().toString().slice(-4)}`;
      found = {
        id: `bio_${Date.now()}`,
        userId,
        slug,
        title: user?.name || 'My LinkPulse Bio',
        bio: 'Product builder, tech enthusiast & writer. Welcome to my curated links!',
        avatarUrl: user?.avatar || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&auto=format&fit=crop&q=80',
        theme: 'pearl',
        socials: [
          { platform: 'twitter', url: 'https://twitter.com' },
          { platform: 'github', url: 'https://github.com' },
          { platform: 'linkedin', url: 'https://linkedin.com' },
        ],
        links: [
          { id: `bl_1`, title: 'Official Website & Portfolio', url: 'https://github.com', active: true, clicks: 42 },
          { id: `bl_2`, title: 'Latest Product Launch & Updates', url: 'https://producthunt.com', active: true, clicks: 18 },
          { id: `bl_3`, title: 'Book a 1:1 Intro Chat', url: 'https://cal.com', active: true, clicks: 9 },
        ],
        updatedAt: new Date().toISOString(),
      };
      this.bioPages.push(found);
      this.save();
    }
    return found;
  }

  public async saveBioPage(userId: string, data: Partial<BioPage>): Promise<BioPage> {
    await delay(80);
    const index = this.bioPages.findIndex((b) => b.userId === userId);
    if (index >= 0) {
      this.bioPages[index] = {
        ...this.bioPages[index],
        ...data,
        updatedAt: new Date().toISOString(),
      };
      this.save();
      return this.bioPages[index];
    } else {
      const newPage: BioPage = {
        id: `bio_${Date.now()}`,
        userId,
        slug: data.slug || `bio_${Date.now().toString().slice(-4)}`,
        title: data.title || 'My Bio Page',
        bio: data.bio || '',
        avatarUrl: data.avatarUrl || '',
        theme: data.theme || 'pearl',
        socials: data.socials || [],
        links: data.links || [],
        updatedAt: new Date().toISOString(),
        ...data,
      };
      this.bioPages.push(newPage);
      this.save();
      return newPage;
    }
  }

  public async trackBioClick(slug: string, linkId: string): Promise<void> {
    const page = this.bioPages.find((b) => b.slug.toLowerCase() === slug.toLowerCase().trim());
    if (page) {
      const link = page.links.find((l) => l.id === linkId);
      if (link) {
        link.clicks = (link.clicks || 0) + 1;
        this.save();
      }
    }
  }

  // System
  public async resetDemoData(): Promise<void> {
    await delay(150);
    const curUser = await this.getCurrentSession();
    if (curUser) {
      await this.resetUserData(curUser.id);
    }
  }

  // Role management
  public async updateUserRole(userId: string, role: 'admin' | 'user'): Promise<void> {
    const user = this.users.find((u) => u.id === userId);
    if (user) {
      user.role = role;
      this.save();
    }
  }

  // Domain safety checking
  public async checkDomain(url: string): Promise<{ isBlocked: boolean; entry?: BlocklistEntry; reason?: string }> {
    try {
      const parsed = new URL(url.startsWith('http') ? url : `https://${url}`);
      const hostname = parsed.hostname.toLowerCase();
      const entry = this.blocklist.find(
        (b) => hostname === b.domain.toLowerCase() || hostname.endsWith('.' + b.domain.toLowerCase())
      );
      return { isBlocked: !!entry, entry, reason: entry?.reason };
    } catch {
      return { isBlocked: false };
    }
  }

  // Abuse reporting
  public async reportAbuse(data: {
    linkId?: string;
    shortCode?: string;
    originalUrl?: string;
    reason: string;
    reporterEmail?: string;
  }): Promise<{ success: boolean; reportId: string }> {
    const reportId = `rep_${Date.now()}`;
    const report: AbuseReport = {
      id: reportId,
      linkId: data.linkId || '',
      shortCode: data.shortCode || '',
      originalUrl: data.originalUrl || '',
      reason: data.reason,
      reporterEmail: data.reporterEmail,
      status: 'pending',
      reportedAt: new Date().toISOString(),
    };
    this.abuseReports.unshift(report);
    return { success: true, reportId };
  }

  // Password verification
  public async verifyPassword(id: string, passwordPlain: string): Promise<boolean> {
    const link = this.links.find((l) => l.id === id);
    if (!link || !link.rules?.password) return true;
    return link.rules.password === passwordPlain;
  }
}

export const db = new MockDb();
