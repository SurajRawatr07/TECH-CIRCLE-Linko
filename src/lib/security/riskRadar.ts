/**
 * Linko — Link Risk Radar
 * Explainable, heuristic URL risk analyzer running 100% in-browser.
 * 
 * NOTICE:
 * This analyzer performs deterministic structural and heuristic checks on the URL string
 * and local demonstration blocklists. It does NOT fetch or contact external servers,
 * and does NOT claim complete malware or zero-day phishing detection.
 */

export type RiskLevel = 'low' | 'caution' | 'high';
export type IndicatorSeverity = 'info' | 'warning' | 'danger';

export interface RiskIndicator {
  code: string;
  title: string;
  severity: IndicatorSeverity;
  explanation: string;
  evidence: string;
}

export interface RiskReport {
  url: string;
  hostname: string;
  level: RiskLevel;
  score: number; // 0 (safest) to 100 (highest risk)
  isBlocked: boolean;
  indicators: RiskIndicator[];
  recommendations: string[];
  disclaimer: string;
}

// Suspicious/disposable TLDs frequently abused in phishing campaigns
const SUSPICIOUS_TLDS = new Set([
  'xyz', 'top', 'tk', 'ml', 'ga', 'cf', 'gq', 'buzz', 'fit', 'work',
  'icu', 'zip', 'mov', 'click', 'link', 'country', 'stream', 'download',
  'review', 'party', 'gdn', 'racing'
]);

// Sensitive credential harvesting and phishing target keywords
const PHISHING_KEYWORDS = [
  'login', 'signin', 'verify', 'verification', 'authenticate', 'account-update',
  'banking', 'paypal', 'metamask', 'wallet-drain', 'crypto-airdrop', 'seed-phrase',
  'secure-portal', 'password-reset', 'billing-confirm', 'security-alert', 'recover-account'
];

// Major tech / brand names often spoofed in subdomains
const BRAND_KEYWORDS = [
  'apple', 'google', 'microsoft', 'amazon', 'paypal', 'netflix', 'facebook',
  'instagram', 'chase', 'wellsfargo', 'coinbase', 'binance', 'discord'
];

const IPV4_REGEX = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;

export function analyzeUrlRisk(
  urlInput: string,
  blocklist: string[] = []
): RiskReport {
  const indicators: RiskIndicator[] = [];
  let score = 0;
  let isBlocked = false;

  const disclaimer =
    'Link Risk Radar evaluates local structural heuristics, protocol parameters, and blocklists. ' +
    'It does not fetch external servers or guarantee absence of threats.';

  if (!urlInput || typeof urlInput !== 'string') {
    return {
      url: '',
      hostname: '',
      level: 'high',
      score: 100,
      isBlocked: false,
      indicators: [
        {
          code: 'EMPTY_URL',
          title: 'Empty Destination',
          severity: 'danger',
          explanation: 'No destination URL was provided for safety evaluation.',
          evidence: 'Empty input',
        },
      ],
      recommendations: ['Provide a valid URL to analyze.'],
      disclaimer,
    };
  }

  let parsed: URL;
  try {
    const trimmed = urlInput.trim();
    const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : 'https://' + trimmed;
    parsed = new URL(withProtocol);
  } catch (err: any) {
    return {
      url: urlInput,
      hostname: '',
      level: 'high',
      score: 100,
      isBlocked: false,
      indicators: [
        {
          code: 'MALFORMED_URL',
          title: 'Invalid URL Structure',
          severity: 'danger',
          explanation: 'The address violates RFC URL formatting standards and cannot be parsed.',
          evidence: err.message || 'Syntax error',
        },
      ],
      recommendations: ['Check destination for typo or malformed characters before shortening.'],
      disclaimer,
    };
  }

  const hostname = parsed.hostname.toLowerCase();
  const fullUrl = parsed.href;

  // 1. Check demonstration blocklist
  const matchedBlockedDomain = blocklist.find(
    (b) => hostname === b.toLowerCase() || hostname.endsWith('.' + b.toLowerCase())
  );
  if (matchedBlockedDomain) {
    isBlocked = true;
    score += 85;
    indicators.push({
      code: 'BLOCKLIST_MATCH',
      title: 'Domain on Demonstration Blocklist',
      severity: 'danger',
      explanation: `The destination domain matches "${matchedBlockedDomain}" on the security blocklist.`,
      evidence: hostname,
    });
  }

  // 2. Protocol Security (HTTP vs HTTPS)
  if (parsed.protocol === 'http:') {
    score += 25;
    indicators.push({
      code: 'INSECURE_PROTOCOL',
      title: 'Unencrypted HTTP Protocol',
      severity: 'warning',
      explanation: 'Traffic is transmitted unencrypted, exposing visitors to eavesdropping or man-in-the-middle tampering.',
      evidence: parsed.protocol,
    });
  }

  // 3. Raw IP Address Hostname
  if (IPV4_REGEX.test(hostname) || hostname.startsWith('[') || hostname.includes(':')) {
    score += 45;
    indicators.push({
      code: 'RAW_IP_HOSTNAME',
      title: 'Raw IP Address Hostname',
      severity: 'danger',
      explanation: 'Legitimate public services use registered domain names. Bare IP addresses are frequently utilized by malicious command servers to evade domain takedowns.',
      evidence: hostname,
    });
  }

  // 4. RFC 3986 Userinfo Spoofing Trick (@ in URL)
  if (urlInput.includes('@')) {
    score += 50;
    indicators.push({
      code: 'USERINFO_SPOOF',
      title: 'Misleading Userinfo Symbol (@)',
      severity: 'danger',
      explanation: 'The "@" character in a URL treats preceding text as credentials, routing visitors to the host after the "@". This is a recognized phishing obfuscation technique.',
      evidence: '@ detected in authority',
    });
  }

  // 5. Suspicious / Disposable Top-Level Domain (TLD)
  const parts = hostname.split('.');
  const tld = parts[parts.length - 1];
  if (SUSPICIOUS_TLDS.has(tld)) {
    score += 20;
    indicators.push({
      code: 'SUSPICIOUS_TLD',
      title: `High-Risk TLD (.${tld})`,
      severity: 'warning',
      explanation: `The .${tld} top-level domain exhibits high historical abuse and disposable registration volumes.`,
      evidence: `.${tld}`,
    });
  }

  // 6. Excessive Subdomain Depth
  if (parts.length >= 4 && !IPV4_REGEX.test(hostname)) {
    score += 25;
    indicators.push({
      code: 'EXCESSIVE_SUBDOMAINS',
      title: 'Deep Subdomain Nesting',
      severity: 'warning',
      explanation: 'Multiple nested subdomain tiers (>= 4 dots) are frequently employed to camouflage a disposable root domain under fake brand prefixes.',
      evidence: `${parts.length} domain segments`,
    });
  }

  // 7. Excessive Hyphens in Domain
  const hyphenCount = (hostname.match(/-/g) || []).length;
  if (hyphenCount >= 3) {
    score += 20;
    indicators.push({
      code: 'EXCESSIVE_HYPHENS',
      title: 'High Hyphen Frequency in Domain',
      severity: 'warning',
      explanation: 'Domains with three or more hyphens are a common typosquatting signature.',
      evidence: `${hyphenCount} hyphens in hostname`,
    });
  }

  // 8. Brand Spoofing in Subdomain / Path
  const hasBrandSpoof = BRAND_KEYWORDS.some((brand) => {
    // Check if brand is in subdomains or path, but NOT the registered root domain
    const rootDomain = parts.slice(-2).join('.');
    return (
      (hostname.includes(brand) && !rootDomain.includes(brand)) ||
      (parsed.pathname.toLowerCase().includes(brand) && !rootDomain.includes(brand))
    );
  });
  if (hasBrandSpoof) {
    score += 35;
    indicators.push({
      code: 'BRAND_IMPERSONATION',
      title: 'Brand Impersonation Pattern',
      severity: 'danger',
      explanation: 'Recognized brand name detected in subdomain or path on an unaffiliated third-party root domain.',
      evidence: hostname,
    });
  }

  // 9. Sensitive Phishing & Credential Keywords
  const fullLower = fullUrl.toLowerCase();
  const matchedKeywords = PHISHING_KEYWORDS.filter((kw) => fullLower.includes(kw));
  if (matchedKeywords.length > 0) {
    score += matchedKeywords.length * 15;
    indicators.push({
      code: 'CREDENTIAL_KEYWORDS',
      title: 'Sensitive Security/Credential Terms Detected',
      severity: 'warning',
      explanation: `URL contains sensitive account or credential recovery keywords (${matchedKeywords.slice(0, 3).join(', ')}).`,
      evidence: matchedKeywords.join(', '),
    });
  }

  // 10. Non-Standard Port
  if (parsed.port && parsed.port !== '80' && parsed.port !== '443') {
    score += 15;
    indicators.push({
      code: 'NON_STANDARD_PORT',
      title: `Non-Standard Port (:${parsed.port})`,
      severity: 'info',
      explanation: 'Destination specifies an uncommon network port instead of default HTTP/HTTPS ports.',
      evidence: `:${parsed.port}`,
    });
  }

  // Normalize score between 0 and 100
  const normalizedScore = Math.min(100, Math.max(0, score));

  // Determine overall risk level
  let level: RiskLevel = 'low';
  if (isBlocked || normalizedScore >= 50) {
    level = 'high';
  } else if (normalizedScore >= 20) {
    level = 'caution';
  }

  // Generate actionable recommendations
  const recommendations: string[] = [];
  if (level === 'high') {
    recommendations.push('Do NOT input login credentials, banking details, or passwords on this destination.');
    recommendations.push('Verify the exact spelling of the domain and certificate issuer before proceeding.');
    if (isBlocked) {
      recommendations.push('This destination is blocked under platform safety policies.');
    }
  } else if (level === 'caution') {
    recommendations.push('Ensure the destination matches the intended organization before sharing broadly.');
    if (parsed.protocol === 'http:') {
      recommendations.push('Upgrade destination to HTTPS if the target site supports TLS.');
    }
  } else {
    recommendations.push('Standard HTTPS destination with no heuristic safety alerts.');
    recommendations.push('Safe to shorten and distribute.');
  }

  return {
    url: fullUrl,
    hostname,
    level,
    score: normalizedScore,
    isBlocked,
    indicators,
    recommendations,
    disclaimer,
  };
}
