import { Link, DeviceType, BrowserType, OsType } from '../../types';

const BASE62_CHARS = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';

export function generateShortCode(length = 6): string {
  let result = '';
  const cryptoObj = typeof window !== 'undefined' && window.crypto ? window.crypto : null;
  if (cryptoObj && cryptoObj.getRandomValues) {
    const values = new Uint8Array(length);
    cryptoObj.getRandomValues(values);
    for (let i = 0; i < length; i++) {
      result += BASE62_CHARS[values[i] % BASE62_CHARS.length];
    }
  } else {
    for (let i = 0; i < length; i++) {
      result += BASE62_CHARS.charAt(Math.floor(Math.random() * BASE62_CHARS.length));
    }
  }
  return result;
}

const BOT_PATTERNS = [
  /bot/i,
  /crawler/i,
  /spider/i,
  /googlebot/i,
  /bingbot/i,
  /slurp/i,
  /duckduckbot/i,
  /baiduspider/i,
  /yandexbot/i,
  /facebookexternalhit/i,
  /twitterbot/i,
  /rogerbot/i,
  /linkedinbot/i,
  /embedly/i,
  /quora link preview/i,
  /slackbot/i,
  /redditbot/i,
  /applebot/i,
  /whatsapp/i,
  /discordbot/i,
  /headlesschrome/i,
  /phantomjs/i,
  /curl/i,
  /wget/i,
  /python-requests/i,
];

export function isBot(userAgent: string): boolean {
  if (!userAgent) return false;
  return BOT_PATTERNS.some((pattern) => pattern.test(userAgent));
}

export function parseUserAgent(userAgent: string): {
  deviceType: DeviceType;
  browser: BrowserType;
  os: OsType;
  isBot: boolean;
} {
  const ua = userAgent || (typeof navigator !== 'undefined' ? navigator.userAgent : '');
  const bot = isBot(ua);

  let deviceType: DeviceType = 'desktop';
  if (/iPad|tablet|PlayBook|Silk|(android(?!.*mobi))/i.test(ua)) {
    deviceType = 'tablet';
  } else if (/Mobile|iP(hone|od)|Android|BlackBerry|IEMobile|Kindle|NetFront/i.test(ua)) {
    deviceType = 'mobile';
  }

  let browser: BrowserType = 'Other';
  if (/edg/i.test(ua)) {
    browser = 'Edge';
  } else if (/chrome|chromium|crios/i.test(ua)) {
    browser = 'Chrome';
  } else if (/firefox|fxios/i.test(ua)) {
    browser = 'Firefox';
  } else if (/safari/i.test(ua) && !/chrome/i.test(ua)) {
    browser = 'Safari';
  }

  let os: OsType = 'Other';
  if (/windows/i.test(ua)) {
    os = 'Windows';
  } else if (/macintosh|mac os x/i.test(ua)) {
    os = 'macOS';
  } else if (/iphone|ipad|ipod/i.test(ua)) {
    os = 'iOS';
  } else if (/android/i.test(ua)) {
    os = 'Android';
  } else if (/linux/i.test(ua)) {
    os = 'Linux';
  }

  return { deviceType, browser, os, isBot: bot };
}

export type RedirectEvaluationResult =
  | { status: 'not_found'; message: string }
  | { status: 'disabled'; message: string }
  | { status: 'blocklisted'; message: string; domain: string }
  | { status: 'expired'; message: string }
  | { status: 'limit_reached'; message: string }
  | { status: 'password_required'; message: string }
  | { status: 'password_invalid'; message: string }
  | { status: 'success'; destinationUrl: string; matchedMobile?: boolean };

// Redirect engine evaluation: strictly implements section 8
export function evaluateRedirectRules(
  link: Link | undefined,
  options: {
    passwordEntered?: string;
    userAgent?: string;
    blocklist?: string[];
  }
): RedirectEvaluationResult {
  // 1. Code not found
  if (!link || link.isDeleted) {
    return { status: 'not_found', message: 'This short link was not found or has been removed.' };
  }

  // 2. Disabled
  if (!link.isActive || link.abuseFlag) {
    return { status: 'disabled', message: 'This short link has been disabled by its owner or an administrator.' };
  }

  // 3. Domain blocklisted
  const blocklist = options.blocklist || [];
  try {
    const targetUrl = new URL(link.originalUrl);
    const host = targetUrl.hostname.toLowerCase();
    const isBlocked = blocklist.some((b) => host === b.toLowerCase() || host.endsWith('.' + b.toLowerCase()));
    if (isBlocked) {
      return { status: 'blocklisted', message: 'Blocked for safety. The destination domain is on the global blocklist.', domain: host };
    }
  } catch {}

  // 4. Expired
  const now = new Date();
  if (link.rules.expiresAt) {
    const expiry = new Date(link.rules.expiresAt);
    if (now > expiry) {
      return { status: 'expired', message: 'This link has expired and is no longer active.' };
    }
  }

  // 5. Click limit reached
  if (link.rules.clickLimit && link.clicksCount >= link.rules.clickLimit) {
    return { status: 'limit_reached', message: `This link has reached its maximum visit limit of ${link.rules.clickLimit} clicks.` };
  }

  // 6. Password protected
  if (link.rules.password && link.rules.password.trim() !== '') {
    if (!options.passwordEntered) {
      return { status: 'password_required', message: 'This link is password-protected.' };
    }
    if (options.passwordEntered !== link.rules.password) {
      return { status: 'password_invalid', message: 'Incorrect password. Please try again.' };
    }
  }

  // 7. Mobile device + mobile URL set
  const ua = options.userAgent || (typeof navigator !== 'undefined' ? navigator.userAgent : '');
  const parsed = parseUserAgent(ua);
  if (parsed.deviceType === 'mobile' && link.rules.mobileUrl && link.rules.mobileUrl.trim() !== '') {
    return { status: 'success', destinationUrl: link.rules.mobileUrl.trim(), matchedMobile: true };
  }

  // 8. Default Destination
  return { status: 'success', destinationUrl: link.originalUrl };
}

// Client-side rate limiter for link creation: max 10 links per min
export function checkRateLimit(key: string, maxRequests = 10, windowMs = 60000): {
  allowed: boolean;
  remaining: number;
  resetInSeconds: number;
} {
  try {
    const storageKey = `linko_ratelimit_${key}`;
    const raw = localStorage.getItem(storageKey);
    const now = Date.now();
    let timestamps: number[] = raw ? JSON.parse(raw) : [];

    timestamps = timestamps.filter((t) => now - t < windowMs);

    if (timestamps.length >= maxRequests) {
      const oldest = timestamps[0];
      const resetInSeconds = Math.max(1, Math.ceil((oldest + windowMs - now) / 1000));
      return { allowed: false, remaining: 0, resetInSeconds };
    }

    timestamps.push(now);
    localStorage.setItem(storageKey, JSON.stringify(timestamps));
    return { allowed: true, remaining: maxRequests - timestamps.length, resetInSeconds: 0 };
  } catch {
    return { allowed: true, remaining: maxRequests, resetInSeconds: 0 };
  }
}

export function formatCompactNumber(num: number): string {
  if (num === 0) return '0';
  if (num < 1000) return num.toLocaleString();
  if (num < 1000000) return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
  return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
}

export function cn(...classes: unknown[]): string {
  return classes.filter(Boolean).join(' ');
}

export function getBaseShortUrl(): string {
  const envDomain = import.meta.env.VITE_PUBLIC_SHORT_DOMAIN;
  if (envDomain) {
    return envDomain.replace(/\/$/, '');
  }

  // Dynamically adapt to active hostname (e.g. AI Studio preview, localhost, or production Vercel deployment)
  if (typeof window !== 'undefined' && window.location && window.location.origin) {
    return window.location.origin;
  }

  // Fallback domain
  return 'https://linko.vercel.app';
}

