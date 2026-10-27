import React, { useState, useEffect, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Link2,
  Copy,
  Check,
  QrCode,
  Download,
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  ShieldAlert,
  ArrowRight,
  Shield,
  Info,
  Calendar,
  MousePointer,
  Sparkles,
  RefreshCw,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { validateDestinationUrl, generateBase62Code, normalizeCustomAlias } from '../lib/shortener/base62';
import { analyzeUrlRisk, RiskReport } from '../lib/security/riskRadar';
import { getBaseShortUrl } from '../lib/utils';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { useToastStore } from '../store/useToastStore';
import { LocalStore } from '../lib/api/localStore';
import { Link as LinkType } from '../types';

export function GuestPage() {
  const [searchParams] = useSearchParams();
  const { success, error: toastError } = useToastStore();

  const [inputUrl, setInputUrl] = useState(searchParams.get('url') || '');
  const [customAlias, setCustomAlias] = useState('');
  const [aliasError, setAliasError] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState('');
  const [clickLimit, setClickLimit] = useState('');

  const [urlValidation, setUrlValidation] = useState<{ valid: boolean; error?: string }>({ valid: false });
  const [liveRisk, setLiveRisk] = useState<RiskReport | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [recentLinks, setRecentLinks] = useState<LinkType[]>([]);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [activeQrLink, setActiveQrLink] = useState<{ code: string; fullUrl: string } | null>(null);
  const qrRef = useRef<SVGSVGElement | null>(null);

  // Load recent links from LocalStore on mount
  useEffect(() => {
    loadRecentLinks();
  }, []);

  function loadRecentLinks() {
    const all = LocalStore.getLinks();
    setRecentLinks(all.slice(0, 10));
  }

  // Live URL validation and heuristic risk preview
  useEffect(() => {
    if (!inputUrl.trim()) {
      setUrlValidation({ valid: false });
      setLiveRisk(null);
      return;
    }

    const check = validateDestinationUrl(inputUrl);
    setUrlValidation(check);

    if (check.valid && check.normalizedUrl) {
      const risk = analyzeUrlRisk(check.normalizedUrl);
      setLiveRisk(risk);
    } else {
      setLiveRisk(null);
    }
  }, [inputUrl]);

  // Check alias availability live
  function handleAliasChange(val: string) {
    setCustomAlias(val);
    setAliasError(null);

    const clean = normalizeCustomAlias(val);
    if (!clean) return;

    if (clean.length < 3) {
      setAliasError('Alias must be at least 3 characters long');
      return;
    }

    const existing = LocalStore.getLinks();
    const isTaken = existing.some((l) => l.shortCode.toLowerCase() === clean.toLowerCase());
    if (isTaken) {
      setAliasError(`The alias "${clean}" is already in use. Please pick another code.`);
    }
  }

  function handleShorten(e: React.FormEvent) {
    e.preventDefault();
    setAliasError(null);

    const valResult = validateDestinationUrl(inputUrl);
    if (!valResult.valid || !valResult.normalizedUrl) {
      toastError('Validation Failed', valResult.error || 'Please enter a valid HTTP or HTTPS destination');
      return;
    }

    const existingLinks = LocalStore.getLinks();
    let shortCode = '';

    if (customAlias.trim()) {
      const cleanAlias = normalizeCustomAlias(customAlias);
      if (cleanAlias.length < 3) {
        setAliasError('Alias must be at least 3 characters long');
        return;
      }
      const isTaken = existingLinks.some((l) => l.shortCode.toLowerCase() === cleanAlias.toLowerCase());
      if (isTaken) {
        setAliasError(`The custom alias "${cleanAlias}" is already taken. Please choose a different alias.`);
        toastError('Duplicate Alias', `"${cleanAlias}" is already in use.`);
        return;
      }
      shortCode = cleanAlias;
    } else {
      const existingCodes = existingLinks.map((l) => l.shortCode);
      shortCode = generateBase62Code(existingCodes, 6);
    }

    setIsSubmitting(true);

    try {
      // Build rules
      const rules: any = {};
      if (expiresAt) {
        rules.expiresAt = new Date(expiresAt).toISOString();
      }
      if (clickLimit && parseInt(clickLimit, 10) > 0) {
        rules.clickLimit = parseInt(clickLimit, 10);
      }

      // Save to local storage
      const newLink: LinkType = {
        id: 'gst_' + Date.now().toString(36),
        userId: 'guest_session',
        originalUrl: valResult.normalizedUrl,
        shortCode,
        title: `Guest Link: ${valResult.parsedUrl?.hostname || 'Destination'}`,
        domain: valResult.parsedUrl?.hostname || 'unknown',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isActive: true,
        tags: ['guest'],
        clicksCount: 0,
        uniqueClicksCount: 0,
        qrScansCount: 0,
        rules,
      };

      LocalStore.createLink(newLink);
      loadRecentLinks();

      setInputUrl('');
      setCustomAlias('');
      setExpiresAt('');
      setClickLimit('');

      success(`Short link created: /r/${shortCode}`);
    } catch (err: any) {
      toastError('Creation Failed', err.message || 'Unable to save link.');
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleCopy(shortCode: string) {
    const fullUrl = `${getBaseShortUrl()}/r/${shortCode}`;
    navigator.clipboard.writeText(fullUrl);
    setCopiedCode(shortCode);
    success('Copied short link to clipboard');
    setTimeout(() => setCopiedCode(null), 2000);
  }

  function downloadQrPng(shortCode: string) {
    const svg = qrRef.current;
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    canvas.width = 512;
    canvas.height = 512;

    img.onload = () => {
      if (ctx) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 32, 32, 448, 448);
        const pngFile = canvas.toDataURL('image/png');
        const dl = document.createElement('a');
        dl.download = `linko-qr-${shortCode}.png`;
        dl.href = pngFile;
        dl.click();
        success('QR Code downloaded as PNG');
      }
    };

    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  }

  function downloadQrSvg(shortCode: string) {
    const svg = qrRef.current;
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const dl = document.createElement('a');
    dl.download = `linko-qr-${shortCode}.svg`;
    dl.href = url;
    dl.click();
    URL.revokeObjectURL(url);
    success('QR Code downloaded as SVG');
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-8">
      {/* Header */}
      <div className="space-y-3 text-center sm:text-left">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200">
          <Sparkles className="w-3.5 h-3.5 text-neutral-900 dark:text-white" />
          <span>Guest Shortener · No Sign Up Required</span>
        </div>
        <h1 className="font-display text-3xl sm:text-4xl font-normal tracking-tight text-neutral-900 dark:text-white">
          Shorten Links Anonymously
        </h1>
        <p className="text-sm sm:text-base text-neutral-600 dark:text-neutral-400 max-w-2xl font-body">
          Turn long destination URLs into clean Base62 short links, customize optional aliases,
          configure expiration or click limits, and inspect safety heuristics in real time.
        </p>
      </div>

      {/* Honest Local Demo Disclosure Banner */}
      <Card className="p-4 bg-neutral-50 dark:bg-neutral-900/60 border-neutral-200 dark:border-neutral-800 space-y-2">
        <div className="flex items-start gap-2.5 text-xs text-neutral-700 dark:text-neutral-300">
          <Info className="w-4 h-4 text-neutral-900 dark:text-neutral-100 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-semibold text-neutral-900 dark:text-white">
              Local Demonstration Notice:
            </span>
            <p className="text-[11px] leading-relaxed text-neutral-600 dark:text-neutral-400">
              In this frontend deployment without an active backend API, generated short links are stored in your browser's local demo storage.
              They resolve within this browser session and cannot be assumed to resolve on external devices until the Fastify + PostgreSQL backend is connected.
            </p>
          </div>
        </div>
      </Card>

      {/* Main Shortening Card */}
      <Card className="p-6 sm:p-8 space-y-6 border-neutral-300 dark:border-neutral-800 shadow-xs">
        <form onSubmit={handleShorten} className="space-y-5">
          {/* Destination URL */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-neutral-900 dark:text-white uppercase tracking-wider">
              Destination URL (HTTP / HTTPS)
            </label>
            <div className="relative">
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none">
                <Link2 className="w-4.5 h-4.5" />
              </div>
              <input
                type="url"
                required
                value={inputUrl}
                onChange={(e) => setInputUrl(e.target.value)}
                placeholder="https://example.com/long/web/address..."
                className="w-full pl-10 pr-4 py-3 text-sm rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-900/20 dark:focus:ring-white/20 transition-all"
              />
            </div>
            {inputUrl.trim() && !urlValidation.valid && (
              <p className="text-xs text-rose-600 dark:text-rose-400 flex items-center gap-1.5 font-medium pt-1">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{urlValidation.error}</span>
              </p>
            )}
          </div>

          {/* Optional Configurations: Alias, Expiry, Click Limit */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
            {/* Custom Alias */}
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300">
                Custom Alias <span className="text-neutral-400 font-normal">(optional)</span>
              </label>
              <div className="flex rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 overflow-hidden focus-within:ring-2 focus-within:ring-neutral-900/20 dark:focus-within:ring-white/20">
                <span className="px-2.5 py-2.5 text-xs text-neutral-400 bg-neutral-50 dark:bg-neutral-800 border-r border-neutral-200 dark:border-neutral-700 font-mono select-none">
                  /r/
                </span>
                <input
                  type="text"
                  value={customAlias}
                  onChange={(e) => handleAliasChange(e.target.value)}
                  placeholder="my-link"
                  className="w-full px-3 py-2 text-xs font-mono text-neutral-900 dark:text-white bg-transparent focus:outline-none"
                />
              </div>
              {aliasError && (
                <p className="text-[11px] text-rose-600 dark:text-rose-400 flex items-center gap-1 font-medium">
                  <AlertCircle className="w-3 h-3 shrink-0" />
                  <span>{aliasError}</span>
                </p>
              )}
            </div>

            {/* Expiration Date */}
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-neutral-400" />
                <span>Expiration <span className="text-neutral-400 font-normal">(optional)</span></span>
              </label>
              <input
                type="datetime-local"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-neutral-900/20 dark:focus:ring-white/20"
              />
            </div>

            {/* Click Quota Limit */}
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 flex items-center gap-1">
                <MousePointer className="w-3.5 h-3.5 text-neutral-400" />
                <span>Click Limit <span className="text-neutral-400 font-normal">(optional)</span></span>
              </label>
              <input
                type="number"
                min="1"
                placeholder="e.g. 100"
                value={clickLimit}
                onChange={(e) => setClickLimit(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-neutral-900/20 dark:focus:ring-white/20"
              />
            </div>
          </div>

          {/* Real-time Link Risk Radar Verdict */}
          {liveRisk && (
            <div
              className={`p-4 rounded-xl border text-xs space-y-2 ${
                liveRisk.level === 'high'
                  ? 'bg-rose-50 border-rose-200 text-rose-900 dark:bg-rose-950/40 dark:border-rose-900/60 dark:text-rose-200'
                  : liveRisk.level === 'caution'
                  ? 'bg-amber-50 border-amber-200 text-amber-900 dark:bg-amber-950/40 dark:border-amber-900/60 dark:text-amber-200'
                  : 'bg-emerald-50 border-emerald-200 text-emerald-900 dark:bg-emerald-950/40 dark:border-emerald-900/60 dark:text-emerald-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-semibold">
                  {liveRisk.level === 'high' ? (
                    <ShieldAlert className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                  ) : liveRisk.level === 'caution' ? (
                    <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  )}
                  <span>
                    Link Risk Radar: {liveRisk.level.toUpperCase()} RISK (Safety Score: {100 - liveRisk.score}/100)
                  </span>
                </div>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-black/5 dark:bg-white/10 font-bold">
                  Heuristic Analysis
                </span>
              </div>

              {liveRisk.indicators.length > 0 ? (
                <ul className="space-y-1 list-disc list-inside text-[11px] opacity-90 pl-1">
                  {liveRisk.indicators.map((ind, i) => (
                    <li key={i}>
                      <strong>{ind.title}:</strong> {ind.explanation}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-[11px] opacity-90">
                  Standard secure HTTPS destination with no heuristic risk flags detected.
                </p>
              )}
            </div>
          )}

          <Button
            type="submit"
            variant="primary"
            size="lg"
            isLoading={isSubmitting}
            disabled={!urlValidation.valid || Boolean(aliasError)}
            className="w-full min-h-[46px] font-semibold"
          >
            <span>Generate Short Link</span>
            <ArrowRight className="w-4 h-4 ml-1.5" />
          </Button>
        </form>
      </Card>

      {/* Recent Locally Stored Links */}
      {recentLinks.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-neutral-900 dark:text-white flex items-center gap-2">
              <Link2 className="w-4 h-4" />
              <span>Recent Links in Local Storage</span>
            </h2>
            <span className="text-xs text-neutral-500">
              {recentLinks.length} {recentLinks.length === 1 ? 'link' : 'links'} saved
            </span>
          </div>

          <div className="space-y-3">
            {recentLinks.map((link) => {
              const fullUrl = `${getBaseShortUrl()}/r/${link.shortCode}`;
              return (
                <Card key={link.id} className="p-4 sm:p-5 space-y-3 border-neutral-200 dark:border-neutral-800">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-base font-bold text-neutral-900 dark:text-white">
                          /r/{link.shortCode}
                        </span>
                        <Badge variant={link.isActive ? 'success' : 'danger'} size="sm">
                          {link.isActive ? 'Active' : 'Paused'}
                        </Badge>
                        {link.rules?.expiresAt && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 font-mono">
                            Expires {new Date(link.rules.expiresAt).toLocaleDateString()}
                          </span>
                        )}
                        {link.rules?.clickLimit && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 font-mono">
                            Limit: {link.rules.clickLimit}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate max-w-lg font-mono">
                        {link.originalUrl}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleCopy(link.shortCode)}
                        className="gap-1.5 text-xs min-h-[36px]"
                      >
                        {copiedCode === link.shortCode ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copy</span>
                          </>
                        )}
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setActiveQrLink({ code: link.shortCode, fullUrl })}
                        className="gap-1.5 text-xs min-h-[36px]"
                      >
                        <QrCode className="w-3.5 h-3.5" />
                        <span>QR</span>
                      </Button>

                      <Link
                        to={`/r/${link.shortCode}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 min-h-[36px] rounded-lg border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-xs font-medium text-neutral-800 dark:text-neutral-200 transition-colors"
                        title="Open local redirect simulation"
                      >
                        <span>Simulate</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* QR Code Modal for Guest */}
      {activeQrLink && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <Card className="max-w-sm w-full p-6 text-center space-y-4">
            <h3 className="text-base font-bold text-neutral-900 dark:text-white">
              QR Code: /r/{activeQrLink.code}
            </h3>
            <p className="text-xs text-neutral-500">
              Download high-resolution image asset for print or digital sharing.
            </p>
            <div className="p-4 bg-white rounded-xl inline-block mx-auto border border-neutral-200 shadow-xs">
              <QRCodeSVG
                ref={qrRef}
                value={activeQrLink.fullUrl}
                size={200}
                level="H"
                fgColor="#171717"
                bgColor="#ffffff"
              />
            </div>
            <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setActiveQrLink(null)}
              >
                Close
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => downloadQrSvg(activeQrLink.code)}
                className="gap-1.5 text-xs"
              >
                <Download className="w-3.5 h-3.5" />
                <span>SVG</span>
              </Button>
              <Button
                size="sm"
                onClick={() => downloadQrPng(activeQrLink.code)}
                className="gap-1.5 text-xs bg-neutral-900 text-white hover:bg-black dark:bg-white dark:text-neutral-900"
              >
                <Download className="w-3.5 h-3.5" />
                <span>PNG (512px)</span>
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
