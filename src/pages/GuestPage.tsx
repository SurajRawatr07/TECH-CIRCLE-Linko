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
  Sparkles,
  Info,
  Clock,
  RefreshCw,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { validateDestinationUrl, generateBase62Code } from '../lib/shortener/base62';
import { analyzeUrlRisk, RiskReport } from '../lib/security/riskRadar';
import { getBaseShortUrl } from '../lib/utils';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { useToastStore } from '../store/useToastStore';
import { LocalStore } from '../lib/api/localStore';

const GUEST_STORAGE_KEY = 'lp_guest_creations';
const HOURLY_LIMIT = 3;
const WINDOW_MS = 60 * 60 * 1000; // 1 hour

interface GuestShortenedLink {
  id: string;
  originalUrl: string;
  shortCode: string;
  fullShortUrl: string;
  createdAt: string;
  riskReport: RiskReport;
}

export function GuestPage() {
  const [searchParams] = useSearchParams();
  const { success, error: toastError } = useToastStore();

  const [inputUrl, setInputUrl] = useState(searchParams.get('url') || '');
  const [urlValidation, setUrlValidation] = useState<{ valid: boolean; error?: string }>({ valid: false });
  const [liveRisk, setLiveRisk] = useState<RiskReport | null>(null);

  const [createdLinks, setCreatedLinks] = useState<GuestShortenedLink[]>([]);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [activeQrModal, setActiveQrModal] = useState<GuestShortenedLink | null>(null);
  const [hourlyUsage, setHourlyUsage] = useState<number>(0);
  const qrRef = useRef<SVGSVGElement | null>(null);

  // Load guest rate limit usage
  useEffect(() => {
    refreshUsage();
  }, []);

  // Live URL validation and risk preview
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

  function getGuestTimestamps(): number[] {
    try {
      const raw = localStorage.getItem(GUEST_STORAGE_KEY);
      if (!raw) return [];
      const parsed: number[] = JSON.parse(raw);
      const now = Date.now();
      return parsed.filter((t) => now - t < WINDOW_MS);
    } catch {
      return [];
    }
  }

  function refreshUsage() {
    const validTimestamps = getGuestTimestamps();
    setHourlyUsage(validTimestamps.length);
  }

  function handleShorten(e: React.FormEvent) {
    e.preventDefault();

    const validTimestamps = getGuestTimestamps();
    if (validTimestamps.length >= HOURLY_LIMIT) {
      toastError(`Guest quota limit reached (${HOURLY_LIMIT}/hour). Create a free account for unlimited shortening.`);
      return;
    }

    const valResult = validateDestinationUrl(inputUrl);
    if (!valResult.valid || !valResult.normalizedUrl) {
      toastError(valResult.error || 'Please enter a valid HTTP/HTTPS URL');
      return;
    }

    // Generate unique Base62 short code
    const existingLinks = LocalStore.getLinks();
    const existingCodes = existingLinks.map((l) => l.shortCode);
    const shortCode = generateBase62Code(existingCodes, 6);

    const fullShortUrl = `${getBaseShortUrl()}/r/${shortCode}`;
    const riskReport = analyzeUrlRisk(valResult.normalizedUrl);

    // Save to local link registry so in-app simulator can resolve it
    LocalStore.createLink({
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
      rules: {},
    });

    // Record guest creation timestamp
    const now = Date.now();
    const updatedTimestamps = [...validTimestamps, now];
    localStorage.setItem(GUEST_STORAGE_KEY, JSON.stringify(updatedTimestamps));
    setHourlyUsage(updatedTimestamps.length);

    const newGuestLink: GuestShortenedLink = {
      id: 'gst_' + Date.now().toString(36),
      originalUrl: valResult.normalizedUrl,
      shortCode,
      fullShortUrl,
      createdAt: new Date().toISOString(),
      riskReport,
    };

    setCreatedLinks((prev) => [newGuestLink, ...prev]);
    setInputUrl('');
    success(`Short code "${shortCode}" generated successfully!`);
  }

  function handleCopy(text: string, code: string) {
    navigator.clipboard.writeText(text);
    setCopiedCode(code);
    success('Copied short link to clipboard');
    setTimeout(() => setCopiedCode(null), 2000);
  }

  function handleDownloadQr(link: GuestShortenedLink) {
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
        const downloadLink = document.createElement('a');
        downloadLink.download = `linkpulse-qr-${link.shortCode}.png`;
        downloadLink.href = pngFile;
        downloadLink.click();
        success('QR code downloaded as PNG');
      }
    };

    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  }

  const remainingQuota = Math.max(0, HOURLY_LIMIT - hourlyUsage);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-8">
      {/* Header */}
      <div className="space-y-3 text-center sm:text-left">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200">
          <Sparkles className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
          <span>Guest Shortener Portal · No Account Required</span>
        </div>
        <h1 className="font-display text-2xl sm:text-4xl font-bold tracking-tight text-neutral-900 dark:text-white">
          Shorten Links Fast & Anonymously
        </h1>
        <p className="text-sm sm:text-base text-neutral-600 dark:text-neutral-400 max-w-2xl">
          Instantly transform any long destination into a Base62 short URL and downloadable QR code.
          Evaluated in real-time with Link Risk Radar.
        </p>
      </div>

      {/* Guest Quota Bar & Limitation Disclaimer */}
      <Card className="p-4 bg-slate-50/80 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 space-y-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 font-medium text-slate-800 dark:text-slate-200">
            <Clock className="w-4 h-4 text-teal-600 dark:text-teal-400" />
            <span>
              Guest Hourly Allowance: <strong className="font-mono">{hourlyUsage}/{HOURLY_LIMIT}</strong> links created
            </span>
            <Badge variant={remainingQuota > 0 ? 'success' : 'danger'} size="sm">
              {remainingQuota > 0 ? `${remainingQuota} remaining` : 'Quota Reached'}
            </Badge>
          </div>
          <Link
            to="/signup"
            className="inline-flex items-center gap-1.5 font-semibold text-teal-700 dark:text-teal-300 hover:underline"
          >
            <span>Create free account for unlimited links</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
        <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
          <strong>Architecture notice:</strong> In this frontend-only phase, guest limits are enforced locally in browser storage.
          Browser-only limits can be bypassed by clearing browser cookies/site data. To preserve a persistent link dashboard,
          custom aliases, and click analytics across sessions, sign up for a free account.
        </p>
      </Card>

      {/* Shorten Form */}
      <Card className="p-6 sm:p-8 space-y-6 border-neutral-300 dark:border-neutral-800 shadow-sm">
        <form onSubmit={handleShorten} className="space-y-4">
          <label className="block text-sm font-semibold text-neutral-900 dark:text-white">
            Destination URL
          </label>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none">
                <Link2 className="w-4.5 h-4.5" />
              </div>
              <input
                type="text"
                value={inputUrl}
                onChange={(e) => setInputUrl(e.target.value)}
                placeholder="https://example.com/very/long/target/address..."
                className="w-full pl-10 pr-4 py-3 text-sm rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-900/20 dark:focus:ring-white/20"
                disabled={remainingQuota === 0}
              />
            </div>
            <Button
              type="submit"
              disabled={!urlValidation.valid || remainingQuota === 0}
              className="py-3 px-6 text-sm font-semibold whitespace-nowrap bg-neutral-900 text-white hover:bg-black dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-100"
            >
              Shorten URL
            </Button>
          </div>

          {/* Validation Error */}
          {inputUrl.trim() && !urlValidation.valid && (
            <p className="text-xs text-rose-600 dark:text-rose-400 flex items-center gap-1.5 font-medium">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{urlValidation.error}</span>
            </p>
          )}

          {/* Live Link Risk Radar Verdict */}
          {liveRisk && (
            <div
              className={`p-3.5 rounded-xl border text-xs space-y-2 ${
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
                    Link Risk Radar Verdict: {liveRisk.level.toUpperCase()} RISK (Safety Score: {100 - liveRisk.score}/100)
                  </span>
                </div>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-black/5 dark:bg-white/10">
                  Heuristic Check
                </span>
              </div>

              {liveRisk.indicators.length > 0 ? (
                <ul className="space-y-1 list-disc list-inside text-[11px] opacity-90">
                  {liveRisk.indicators.map((ind, i) => (
                    <li key={i}>
                      <strong>{ind.title}:</strong> {ind.explanation}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-[11px] opacity-90">
                  Destination uses standard secure HTTPS with clean structural parameters.
                </p>
              )}
            </div>
          )}
        </form>
      </Card>

      {/* Guest Generated Results */}
      {createdLinks.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-neutral-900 dark:text-white">
              Generated Guest Links (This Session)
            </h2>
            <span className="text-xs text-neutral-500">
              {createdLinks.length} {createdLinks.length === 1 ? 'link' : 'links'}
            </span>
          </div>

          <div className="space-y-3">
            {createdLinks.map((link) => (
              <Card key={link.id} className="p-4 sm:p-5 space-y-3 border-neutral-200 dark:border-neutral-800">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-base font-bold text-neutral-900 dark:text-white">
                        /r/{link.shortCode}
                      </span>
                      <Badge
                        variant={
                          link.riskReport.level === 'high'
                            ? 'danger'
                            : link.riskReport.level === 'caution'
                            ? 'warning'
                            : 'success'
                        }
                        size="sm"
                      >
                        {link.riskReport.level} risk
                      </Badge>
                      <span className="text-[10px] text-neutral-400 font-mono">
                        Base62 Generated
                      </span>
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
                      onClick={() => handleCopy(link.fullShortUrl, link.shortCode)}
                      className="gap-1.5 text-xs"
                    >
                      {copiedCode === link.shortCode ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy Link</span>
                        </>
                      )}
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setActiveQrModal(link)}
                      className="gap-1.5 text-xs"
                    >
                      <QrCode className="w-3.5 h-3.5" />
                      <span>QR Code</span>
                    </Button>

                    <Link
                      to={`/r/${link.shortCode}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-xs font-medium text-neutral-800 dark:text-neutral-200 transition-colors"
                      title="Test in-app redirect simulator"
                    >
                      <span>Simulate</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>

                {/* Redirect Outcome Preview */}
                <div className="p-2.5 rounded-lg bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-xs flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-neutral-400">Redirects to:</span>
                    <a
                      href={link.originalUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-mono text-neutral-800 dark:text-neutral-200 hover:underline truncate max-w-sm"
                    >
                      {link.originalUrl}
                    </a>
                  </div>
                  <span className="text-[11px] text-neutral-500">
                    Resolves locally in this browser
                  </span>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* QR Modal for Guest */}
      {activeQrModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <Card className="max-w-sm w-full p-6 text-center space-y-4">
            <h3 className="text-base font-bold text-neutral-900 dark:text-white">
              QR Code: /r/{activeQrModal.shortCode}
            </h3>
            <p className="text-xs text-neutral-500">
              Scan with camera or download high-resolution PNG asset.
            </p>
            <div className="p-4 bg-white rounded-xl inline-block mx-auto border border-neutral-200 shadow-xs">
              <QRCodeSVG
                ref={qrRef}
                value={activeQrModal.fullShortUrl}
                size={200}
                level="H"
                fgColor="#171717"
                bgColor="#ffffff"
              />
            </div>
            <div className="flex items-center justify-center gap-3 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setActiveQrModal(null)}
              >
                Close
              </Button>
              <Button
                size="sm"
                onClick={() => handleDownloadQr(activeQrModal)}
                className="gap-1.5 bg-neutral-900 text-white hover:bg-black dark:bg-white dark:text-neutral-900"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download PNG</span>
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Conversion Banner */}
      <Card className="p-6 bg-linear-to-r from-slate-900 to-neutral-900 text-white space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h3 className="font-display text-lg font-bold">
              Want Custom Aliases, Analytics & Unlimited Links?
            </h3>
            <p className="text-xs text-neutral-300 max-w-xl">
              Create a free account to unlock your personal management dashboard, custom aliases,
              password protection, expiration dates, tags, campaigns, and CSV bulk import.
            </p>
          </div>
          <Link
            to="/signup"
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-semibold text-sm transition-colors shrink-0"
          >
            <span>Create Free Account</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </Card>
    </div>
  );
}
