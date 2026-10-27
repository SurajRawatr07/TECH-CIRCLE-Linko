import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Link2,
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  ClipboardPaste,
  SlidersHorizontal,
  Share2,
} from 'lucide-react';
import { HeroPhoneQrIllustration } from '../components/common/HeroPhoneQrIllustration';

export function LandingPage() {
  const navigate = useNavigate();
  const [quickUrl, setQuickUrl] = useState('');
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  function handleQuickStart(e: React.FormEvent) {
    e.preventDefault();
    if (quickUrl.trim()) {
      navigate(`/guest?url=${encodeURIComponent(quickUrl.trim())}`);
    } else {
      navigate('/guest');
    }
  }

  const steps = [
    {
      num: '1',
      icon: ClipboardPaste,
      title: 'Paste your long URL',
      desc: 'Enter any long web address into the link creation bar. LinkPulse sanitizes and validates destination URLs before creating the redirect.',
    },
    {
      num: '2',
      icon: SlidersHorizontal,
      title: 'Customize and create your short link',
      desc: 'Set an optional custom memorable alias, expiration date, or password protection, then generate your short link with one click.',
    },
    {
      num: '3',
      icon: Share2,
      title: 'Share your link and view available click analytics',
      desc: 'Distribute your clean short URL or downloadable QR code, and inspect real-time click volume and device metrics in your dashboard.',
    },
  ];

  const faqs = [
    {
      q: 'What is LinkPulse?',
      a: 'LinkPulse is a dependable URL shortening and click intelligence platform. It provides clean short URLs, high-resolution QR codes, link lifecycle scheduling, and verified traffic analytics for individuals and modern teams.',
    },
    {
      q: 'How do I create a short link?',
      a: 'Paste any destination URL into the shortener box in the hero section or inside your dashboard, optionally configure a custom alias or click quota, and click "Shorten Link".',
    },
    {
      q: 'Can I customize my short-link alias?',
      a: 'Yes. You can choose a custom memorable alias (e.g. linkpulse.io/r/custom-name) for any link you create, provided the chosen code is not already registered.',
    },
    {
      q: 'Can I generate a QR code?',
      a: 'Yes. Every created short link automatically includes high-resolution QR code generation that you can preview, customize with distinct colors, and download instantly.',
    },
    {
      q: 'How can I view link analytics?',
      a: 'When authenticated, open your Dashboard or My Links page to inspect atomic click counts, device breakdowns, referrer platforms, and geographic traffic data for each of your active links.',
    },
    {
      q: 'Is LinkPulse free to use?',
      a: 'Yes, LinkPulse is completely free to use. You can shorten links, generate QR codes, organize campaigns, and access full management tools with no credit card required.',
    },
  ];

  return (
    <div className="space-y-16 sm:space-y-24 pb-16 overflow-x-hidden bg-white dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 transition-colors">
      {/* 1. Hero Section */}
      <section className="relative w-full overflow-hidden px-4 sm:px-6 lg:px-8 pt-8 sm:pt-14 lg:pt-20 pb-12 sm:pb-16 bg-white dark:bg-neutral-950 border-b border-neutral-200/80 dark:border-neutral-800 transition-colors">
        <div className="mx-auto max-w-7xl">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
            {/* Left Column: Heading, Subtitle, Form, Feature trigger */}
            <div className="lg:col-span-7 flex flex-col items-start text-left space-y-6">
              <div className="flex items-center gap-2.5">
                <span className="text-xs font-semibold tracking-widest uppercase text-neutral-500 dark:text-neutral-400">
                  URL SHORTENER & ANALYTICS PLATFORM
                </span>
              </div>

              <h1
                style={{ textWrap: 'balance' }}
                className="font-display text-3xl sm:text-4xl md:text-5xl lg:text-[54px] font-normal text-neutral-900 dark:text-white tracking-tight leading-[1.12]"
              >
                Shorten Links.{' '}
                <span className="relative inline-block whitespace-nowrap">
                  <em className="text-teal-600 dark:text-teal-400 not-italic font-normal">Strengthen Trust.</em>
                </span>
              </h1>

              <div className="max-w-xl space-y-2 text-base sm:text-[17px] text-neutral-600 dark:text-neutral-300 leading-[1.65] font-body">
                <p>
                  High-performance Base62 URL shortener with Link Risk Radar, Destination Change Guardian, and real-time click intelligence.
                </p>
                <p className="text-sm text-neutral-500">
                  Try instantly as a guest without signing up, or create a free account to manage links and campaigns.
                </p>
              </div>

              {/* Quick URL form */}
              <form
                onSubmit={handleQuickStart}
                className="pt-2 w-full max-w-lg flex flex-col sm:flex-row gap-3"
              >
                <div className="relative flex-1">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none">
                    <Link2 className="w-4.5 h-4.5" />
                  </div>
                  <input
                    type="url"
                    placeholder="https://your-long-website-address.com/..."
                    value={quickUrl}
                    onChange={(e) => setQuickUrl(e.target.value)}
                    className="w-full pl-10 pr-3.5 py-3 min-h-[46px] text-sm rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white placeholder:text-neutral-400 dark:placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-neutral-900/15 dark:focus:ring-white/20 focus:border-neutral-900 dark:focus:border-neutral-100 transition-colors shadow-2xs"
                  />
                </div>
                <button
                  type="submit"
                  className="pearl-btn-dark inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3 min-h-[46px] text-sm font-semibold whitespace-nowrap cursor-pointer shrink-0"
                >
                  <span>Shorten Link</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>

              <div className="pt-1 flex flex-wrap items-center gap-3 sm:gap-4 text-xs text-neutral-500 dark:text-neutral-400">
                <span className="inline-flex items-center gap-1.5 font-medium text-neutral-800 dark:text-neutral-200">
                  <CheckCircle2 className="w-3.5 h-3.5 text-neutral-900 dark:text-neutral-100" /> Free to use
                </span>
                <span>·</span>
                <span>No credit card required</span>
                <span>·</span>
                <span>Ready in 10 seconds</span>
              </div>
            </div>

            {/* Right Column: Premium Smartphone QR Code & Person Interactive Animation */}
            <div className="lg:col-span-5 flex justify-center w-full">
              <HeroPhoneQrIllustration />
            </div>
          </div>
        </div>
      </section>

      {/* 2. How It Works (Exactly 3 Simple Steps) */}
      <section id="how-it-works" className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto scroll-mt-20">
        <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-14 space-y-3">
          <div className="text-xs font-semibold tracking-widest uppercase text-neutral-500 dark:text-neutral-400">
            HOW IT WORKS
          </div>
          <h2
            style={{ textWrap: 'balance' }}
            className="font-display text-2xl sm:text-3xl md:text-4xl font-normal text-neutral-900 dark:text-white tracking-tight leading-[1.15]"
          >
            Three simple steps to{' '}
            <span className="relative inline-block">
              <em className="text-[#b45309] dark:text-amber-500 not-italic font-normal">streamline links</em>
            </span>
          </h2>
          <p className="text-sm sm:text-base text-neutral-600 dark:text-neutral-300 max-w-lg mx-auto">
            Everything you need to turn unwieldy URLs into actionable marketing assets.
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
                    0{item.num}
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

      {/* 3. Frequently Asked Questions Accordion */}
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
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setOpenFaq(isOpen ? null : index);
                    }
                  }}
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

      {/* 4. Final CTA Section (Preserving exact wording and hierarchy) */}
      <section className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="p-8 sm:p-12 md:p-14 rounded-3xl bg-neutral-900 dark:bg-neutral-900 text-white text-center space-y-6 shadow-xl border border-neutral-800">
          <div className="text-xs font-semibold tracking-widest uppercase text-neutral-400">
            GET STARTED TODAY
          </div>
          <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-normal tracking-tight text-white leading-tight">
            Ready to shorten your first link?
          </h2>
          <p className="text-sm sm:text-base text-neutral-300 max-w-lg mx-auto font-body leading-relaxed">
            Join LinkPulse to create custom links, export branded QR codes, and gain actionable click analytics in seconds.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2 w-full max-w-md mx-auto sm:max-w-none">
            <button
              type="button"
              className="pearl-btn-pearl w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl px-7 py-3.5 min-h-[46px] text-sm font-semibold cursor-pointer"
              onClick={() => navigate('/register')}
            >
              <span>Create Free Account</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              type="button"
              className="w-full sm:w-auto inline-flex items-center justify-center rounded-xl px-6 py-3.5 min-h-[46px] text-sm font-medium text-neutral-300 hover:text-white hover:bg-neutral-800 border border-neutral-700 transition-colors cursor-pointer"
              onClick={() => navigate('/login')}
            >
              Sign In
            </button>
          </div>
        </div>
      </section>

    </div>
  );
}
