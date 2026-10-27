import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Link2,
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  ClipboardPaste,
  SlidersHorizontal,
  Share2,
  Shield,
  History,
  Activity,
  Lock,
  Compass,
  Copy,
  Check,
  QrCode,
  ExternalLink,
  AlertCircle,
  Download,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { validateDestinationUrl, generateBase62Code } from '../lib/shortener/base62';
import { analyzeUrlRisk, RiskReport } from '../lib/security/riskRadar';
import { getBaseShortUrl } from '../lib/utils';
import { LocalStore } from '../lib/api/localStore';
import { useToastStore } from '../store/useToastStore';
import { HeroPhoneQrIllustration } from '../components/common/HeroPhoneQrIllustration';

export function LandingPage() {
  const navigate = useNavigate();
  const { success, error: toastError } = useToastStore();

  const [inputUrl, setInputUrl] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);
  const [createdResult, setCreatedResult] = useState<{
    shortCode: string;
    fullShortUrl: string;
    originalUrl: string;
    risk: RiskReport;
  } | null>(null);
  const [copied, setCopied] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  // Directly process and create short link in local mode
  function handleHeroShorten(e: React.FormEvent) {
    e.preventDefault();
    setValidationError(null);

    const check = validateDestinationUrl(inputUrl);
    if (!check.valid || !check.normalizedUrl) {
      setValidationError(check.error || 'Please enter a valid HTTP or HTTPS web address.');
      return;
    }

    // Generate unique Base62 short code
    const existing = LocalStore.getLinks().map((l) => l.shortCode);
    const code = generateBase62Code(existing, 6);
    const fullUrl = `${getBaseShortUrl()}/r/${code}`;
    const risk = analyzeUrlRisk(check.normalizedUrl);

    // Persist in local storage
    LocalStore.createLink({
      id: 'linko_' + Date.now().toString(36),
      userId: 'guest_session',
      originalUrl: check.normalizedUrl,
      shortCode: code,
      title: `Link: ${check.parsedUrl?.hostname || 'Destination'}`,
      domain: check.parsedUrl?.hostname || 'unknown',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isActive: true,
      tags: ['guest', 'hero'],
      clicksCount: 0,
      uniqueClicksCount: 0,
      qrScansCount: 0,
      rules: {},
    });

    setCreatedResult({
      shortCode: code,
      fullShortUrl: fullUrl,
      originalUrl: check.normalizedUrl,
      risk,
    });

    success(`Short code "${code}" created in local storage!`);
  }

  function handleCopy(text: string) {
    navigator.clipboard.writeText(text);
    setCopied(true);
    success('Short link copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  }

  const features = [
    {
      title: 'Link Risk Radar',
      desc: 'Local heuristic evaluation analyzing destination protocols, suspicious TLDs, deep nesting, and known safety blocklists.',
      icon: Shield,
      path: '/shorten',
      tag: 'Security Inspection',
    },
    {
      title: 'Destination Change Guardian',
      desc: 'Maintains an immutable destination baseline and records audit events whenever a link target is updated.',
      icon: History,
      path: '/app/dashboard',
      tag: 'Redirection Integrity',
    },
    {
      title: 'Click Anomaly Watch',
      desc: 'Deterministic rule engine that flags high-velocity click bursts and replay patterns from locally recorded events.',
      icon: Activity,
      path: '/app/dashboard',
      tag: 'Velocity Analysis',
    },
    {
      title: 'Privacy Controls',
      desc: 'Export complete local application records, configure retention preferences, and clear browser state with one click.',
      icon: Lock,
      path: '/app/settings',
      tag: 'Data Sovereignty',
    },
    {
      title: 'Redirect Policy Simulator',
      desc: 'Test exact expiration dates, click limits, passwords, and blocklist policies before public release.',
      icon: Compass,
      path: '/app/policy-lab',
      tag: 'Policy Evaluation',
    },
  ];

  const steps = [
    {
      num: '01',
      icon: ClipboardPaste,
      title: 'Enter a destination URL',
      desc: 'Paste any valid HTTP or HTTPS destination into Linko. Structural parameters and protocols are validated immediately.',
    },
    {
      num: '02',
      icon: SlidersHorizontal,
      title: 'Create and configure your short link',
      desc: 'Generate a clean Base62 short code or set a custom memorable alias. Optionally attach expiration schedules and click limits.',
    },
    {
      num: '03',
      icon: Share2,
      title: 'Copy, share, and inspect supported activity',
      desc: 'Distribute your clean short URL or downloadable QR code, and inspect real-time click volume and device metrics.',
    },
  ];

  const faqs = [
    {
      q: 'How does guest shortening work on Linko?',
      a: 'Guest shortening allows anyone to shorten URLs and generate QR codes immediately at /shorten with no account or sign up required. In local mode, mappings are stored inside your browser session.',
    },
    {
      q: 'Can I generate and download QR codes?',
      a: 'Yes. Every created short link includes instant high-resolution QR code generation that you can preview and download directly as a PNG or SVG image.',
    },
    {
      q: 'What are the local-demo limitations?',
      a: 'When Linko is running without a connected backend server, short links and analytics are stored locally in browser storage. They resolve within your current browser session and cannot be assumed to work across different physical devices until the Fastify + PostgreSQL backend is connected.',
    },
    {
      q: 'What features are available in the user workspace?',
      a: 'The workspace (/app) allows you to manage saved links, pause and resume routing, configure expiration schedules and click quotas, inspect traffic analytics, organize tags and campaigns, and test redirect policies.',
    },
    {
      q: 'How does Link Risk Radar protect visitors?',
      a: 'Link Risk Radar evaluates destination URLs against structural risk heuristics including raw IP hostnames, suspicious TLDs, misleading user-info characters (@), brand typosquatting patterns, and safety blocklists.',
    },
  ];

  return (
    <div className="space-y-16 sm:space-y-24 pb-16 overflow-x-hidden bg-white dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 transition-colors">
      {/* 1. Hero Section */}
      <section className="relative w-full overflow-hidden px-4 sm:px-6 lg:px-8 pt-8 sm:pt-14 lg:pt-20 pb-12 sm:pb-16 bg-white dark:bg-neutral-950 border-b border-neutral-200/80 dark:border-neutral-800 transition-colors">
        <div className="mx-auto max-w-7xl">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
            {/* Left Column: Headline, Supporting text, Functional Form */}
            <div className="lg:col-span-7 flex flex-col items-start text-left space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>Linko URL Shortener & Link Security</span>
              </div>

              <h1
                style={{ textWrap: 'balance' }}
                className="font-display text-4xl sm:text-5xl lg:text-[56px] font-normal text-neutral-900 dark:text-white tracking-tight leading-[1.1]"
              >
                Shorten smarter.{' '}
                <span className="relative inline-block whitespace-nowrap">
                  <em className="text-neutral-900 dark:text-white not-italic font-medium underline decoration-neutral-300 dark:decoration-neutral-700 decoration-wavy">
                    Share safer.
                  </em>
                </span>
              </h1>

              <div className="max-w-xl space-y-2 text-base sm:text-[17px] text-neutral-600 dark:text-neutral-300 leading-relaxed font-body">
                <p>
                  Linko transforms long destination URLs into secure, dependable Base62 short links.
                  Equipped with built-in Link Risk Radar, Destination Change Guardian, and real-time click intelligence.
                </p>
              </div>

              {/* Functional URL Shortening Form (Working in local mode) */}
              <div className="w-full max-w-lg space-y-3">
                <form onSubmit={handleHeroShorten} className="flex flex-col sm:flex-row gap-2.5">
                  <div className="relative flex-1">
                    <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none">
                      <Link2 className="w-4.5 h-4.5" />
                    </div>
                    <input
                      type="url"
                      placeholder="https://example.com/your-long-destination-url..."
                      value={inputUrl}
                      onChange={(e) => {
                        setInputUrl(e.target.value);
                        if (validationError) setValidationError(null);
                      }}
                      className="w-full pl-10 pr-3.5 py-3 min-h-[46px] text-sm rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-900/15 dark:focus:ring-white/20 transition-all shadow-2xs"
                    />
                  </div>
                  <button
                    type="submit"
                    className="pearl-btn-dark inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3 min-h-[46px] text-sm font-semibold whitespace-nowrap cursor-pointer shrink-0"
                  >
                    <span>Shorten URL</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </form>

                {validationError && (
                  <p className="text-xs text-rose-600 dark:text-rose-400 flex items-center gap-1.5 font-medium">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{validationError}</span>
                  </p>
                )}

                {/* Instant Creation Result Box */}
                {createdResult && (
                  <div className="p-4 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900 space-y-3 shadow-xs">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-base font-bold text-neutral-900 dark:text-white">
                          /r/{createdResult.shortCode}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                          {createdResult.risk.level} Risk
                        </span>
                      </div>
                      <span className="text-[10px] text-neutral-500 font-mono">Saved Locally</span>
                    </div>

                    <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate font-mono">
                      {createdResult.originalUrl}
                    </p>

                    <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-neutral-200 dark:border-neutral-800">
                      <button
                        type="button"
                        onClick={() => handleCopy(createdResult.fullShortUrl)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 text-xs font-medium cursor-pointer"
                      >
                        {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copied ? 'Copied' : 'Copy Short Link'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setShowQrModal(true)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-xs font-medium transition-colors cursor-pointer"
                      >
                        <QrCode className="w-3.5 h-3.5" />
                        <span>QR Code</span>
                      </button>

                      <Link
                        to={`/r/${createdResult.shortCode}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-xs font-medium transition-colors"
                      >
                        <span>Simulate</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                )}

                {/* Clearly visible Guest Shorten & Login options */}
                <div className="pt-2 flex flex-wrap items-center gap-4 text-xs">
                  <Link
                    to="/shorten"
                    className="inline-flex items-center gap-1.5 font-semibold text-neutral-900 dark:text-white underline decoration-neutral-300 hover:decoration-neutral-900"
                  >
                    <span>Guest Shorten — No Sign Up</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                  <span className="text-neutral-400">·</span>
                  <Link
                    to="/auth/login"
                    className="text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors"
                  >
                    Existing user? Sign in
                  </Link>
                </div>
              </div>
            </div>

            {/* Right Column: Hero QR Illustration */}
            <div className="lg:col-span-5 flex justify-center w-full">
              <HeroPhoneQrIllustration />
            </div>
          </div>
        </div>
      </section>

      {/* 2. Features Section (Concise Five Feature Cards) */}
      <section id="features" className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto scroll-mt-20">
        <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-14 space-y-3">
          <div className="text-xs font-semibold tracking-widest uppercase text-neutral-500 dark:text-neutral-400">
            SECURITY & LINK INTELLIGENCE
          </div>
          <h2
            style={{ textWrap: 'balance' }}
            className="font-display text-2xl sm:text-3xl md:text-4xl font-normal text-neutral-900 dark:text-white tracking-tight leading-[1.15]"
          >
            Built for confidence at every redirect
          </h2>
          <p className="text-sm sm:text-base text-neutral-600 dark:text-neutral-300 max-w-lg mx-auto">
            Five core capabilities designed to protect audience safety, safeguard destination integrity, and provide deep visibility.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feat) => {
            const Icon = feat.icon;
            return (
              <div
                key={feat.title}
                className="p-6 sm:p-7 rounded-2xl border border-neutral-200/90 dark:border-neutral-800 bg-[#faf9f6] dark:bg-neutral-900 space-y-4 shadow-2xs hover:border-neutral-300 dark:hover:border-neutral-700 transition-all flex flex-col justify-between"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-xl bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 flex items-center justify-center">
                      <Icon className="w-5 h-5 stroke-[2.2]" />
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-neutral-200/70 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 font-medium">
                      {feat.tag}
                    </span>
                  </div>
                  <h3 className="font-display text-lg sm:text-xl font-normal text-neutral-900 dark:text-white">
                    {feat.title}
                  </h3>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed font-body">
                    {feat.desc}
                  </p>
                </div>

                <div className="pt-2 border-t border-neutral-200/60 dark:border-neutral-800">
                  <Link
                    to={feat.path}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-neutral-900 dark:text-white hover:underline"
                  >
                    <span>Explore feature</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 3. How It Works (Exactly 3 Simple Steps) */}
      <section id="how-it-works" className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto scroll-mt-20">
        <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-14 space-y-3">
          <div className="text-xs font-semibold tracking-widest uppercase text-neutral-500 dark:text-neutral-400">
            HOW IT WORKS
          </div>
          <h2
            style={{ textWrap: 'balance' }}
            className="font-display text-2xl sm:text-3xl md:text-4xl font-normal text-neutral-900 dark:text-white tracking-tight leading-[1.15]"
          >
            Three simple steps to shorten and share
          </h2>
          <p className="text-sm sm:text-base text-neutral-600 dark:text-neutral-300 max-w-lg mx-auto">
            A frictionless workflow built for speed, safety, and operational transparency.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {steps.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.num}
                className="p-6 sm:p-7 rounded-2xl border border-neutral-200/90 dark:border-neutral-800 bg-[#faf9f6] dark:bg-neutral-900 space-y-4 shadow-2xs hover:border-neutral-300 dark:hover:border-neutral-700 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 font-mono text-sm font-bold flex items-center justify-center">
                    {item.num}
                  </div>
                  <Icon className="w-5 h-5 text-neutral-400 dark:text-neutral-500" />
                </div>
                <h3 className="font-display text-lg sm:text-xl font-normal text-neutral-900 dark:text-white">
                  {item.title}
                </h3>
                <p className="text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed font-body">
                  {item.desc}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* 4. Frequently Asked Questions Accordion */}
      <section id="faq" className="px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto scroll-mt-20">
        <div className="text-center max-w-xl mx-auto mb-10 space-y-3">
          <div className="text-xs font-semibold tracking-widest uppercase text-neutral-500 dark:text-neutral-400">
            FAQ
          </div>
          <h2
            style={{ textWrap: 'balance' }}
            className="font-display text-2xl sm:text-3xl md:text-4xl font-normal text-neutral-900 dark:text-white tracking-tight leading-[1.15]"
          >
            Frequently Asked Questions
          </h2>
          <p className="text-xs sm:text-sm text-neutral-500">
            Answers to common questions regarding guest usage, local demo behavior, and security.
          </p>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, index) => {
            const isOpen = openFaq === index;
            return (
              <div
                key={faq.q}
                className="rounded-2xl border border-neutral-200/90 dark:border-neutral-800 bg-[#faf9f6] dark:bg-neutral-900 overflow-hidden transition-colors"
              >
                <button
                  type="button"
                  onClick={() => setOpenFaq(isOpen ? null : index)}
                  className="w-full px-5 sm:px-6 py-4.5 text-left flex items-center justify-between gap-4 font-display text-base sm:text-lg font-normal text-neutral-900 dark:text-white hover:text-neutral-700 dark:hover:text-neutral-200 cursor-pointer transition-colors"
                  aria-expanded={isOpen}
                >
                  <span className="text-left">{faq.q}</span>
                  <ChevronDown
                    className={`w-5 h-5 text-neutral-500 dark:text-neutral-400 transition-transform duration-200 shrink-0 ${
                      isOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                {isOpen && (
                  <div className="px-5 sm:px-6 pb-5 pt-1 text-sm text-neutral-600 dark:text-neutral-300 leading-relaxed font-body border-t border-neutral-200/60 dark:border-neutral-800/80">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* QR Code Modal for Hero Created Link */}
      {showQrModal && createdResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl max-w-sm w-full p-6 text-center space-y-4 shadow-xl">
            <h3 className="text-base font-bold text-neutral-900 dark:text-white">
              QR Code: /r/{createdResult.shortCode}
            </h3>
            <p className="text-xs text-neutral-500">
              Scan with mobile camera or download high-resolution QR asset.
            </p>
            <div className="p-4 bg-white rounded-xl inline-block mx-auto border border-neutral-200 shadow-xs">
              <QRCodeSVG
                value={createdResult.fullShortUrl}
                size={200}
                level="H"
                fgColor="#171717"
                bgColor="#ffffff"
              />
            </div>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowQrModal(false)}
                className="px-4 py-2 rounded-xl border border-neutral-300 dark:border-neutral-700 text-xs font-semibold hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  const svg = document.querySelector('svg');
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
                      const png = canvas.toDataURL('image/png');
                      const dl = document.createElement('a');
                      dl.download = `linko-qr-${createdResult.shortCode}.png`;
                      dl.href = png;
                      dl.click();
                      success('QR code downloaded as PNG');
                    }
                  };
                  img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 text-xs font-semibold hover:opacity-90 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download PNG</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
