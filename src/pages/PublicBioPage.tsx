import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ExternalLink,
  Twitter,
  Github,
  Linkedin,
  Instagram,
  Youtube,
  Globe,
  Link2,
} from 'lucide-react';
import { bioApi } from '../lib/api';
import { BioPage, BioSocialLink } from '../types';

export function PublicBioPage() {
  const { slug } = useParams<{ slug: string }>();
  const [page, setPage] = useState<BioPage | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadBio() {
      if (!slug) return;
      try {
        const data = await bioApi.getBioBySlug(slug);
        setPage(data);
      } catch {
        setPage(null);
      } finally {
        setIsLoading(false);
      }
    }
    loadBio();
  }, [slug]);

  function handleLinkClick(linkId: string, url: string) {
    if (slug) {
      bioApi.trackBioClick(slug, linkId);
    }
    window.open(url, '_blank', 'noopener,noreferrer');
  }

  const renderSocialIcon = (platform: BioSocialLink['platform']) => {
    switch (platform) {
      case 'twitter':
        return <Twitter className="w-4 h-4" />;
      case 'github':
        return <Github className="w-4 h-4" />;
      case 'linkedin':
        return <Linkedin className="w-4 h-4" />;
      case 'instagram':
        return <Instagram className="w-4 h-4" />;
      case 'youtube':
        return <Youtube className="w-4 h-4" />;
      default:
        return <Globe className="w-4 h-4" />;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#faf9f6] dark:bg-[#0a0a0a] text-neutral-900 dark:text-white p-4">
        <div className="w-8 h-8 border-2 border-neutral-900 dark:border-white border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!page) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#faf9f6] dark:bg-[#0a0a0a] text-neutral-900 dark:text-white p-4 text-center">
        <div className="max-w-sm space-y-4">
          <div className="w-12 h-12 rounded-xl bg-neutral-200 dark:bg-neutral-800 flex items-center justify-center mx-auto text-neutral-500">
            <Link2 className="w-6 h-6" />
          </div>
          <h1 className="text-xl font-bold">Bio Profile Not Found</h1>
          <p className="text-xs text-neutral-500">
            The profile <span className="font-mono text-neutral-900 dark:text-white font-semibold">@{slug}</span> has not been claimed yet or is unavailable.
          </p>
          <Link
            to="/"
            className="pearl-btn-dark inline-block px-4 py-2 text-xs font-semibold rounded-lg transition-colors"
          >
            Create Your Own on Linko
          </Link>
        </div>
      </div>
    );
  }

  // Theme configurations
  const themeStyles: Record<string, string> = {
    pearl: 'bg-[#faf9f6] text-neutral-900',
    slate: 'bg-neutral-950 text-white',
    minimal: 'bg-white dark:bg-neutral-950 text-neutral-900 dark:text-white',
    dark: 'bg-black text-white',
    gradient: 'bg-gradient-to-tr from-neutral-950 via-neutral-900 to-neutral-800 text-white',
  };

  const buttonThemeStyles: Record<string, string> = {
    pearl: 'bg-white hover:bg-neutral-50 border-neutral-200/80 text-neutral-900 shadow-xs',
    slate: 'bg-neutral-900 hover:bg-neutral-800 border-neutral-800 text-white shadow-xs',
    minimal: 'bg-white dark:bg-neutral-900 hover:bg-neutral-50 dark:hover:bg-neutral-800 border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-neutral-100 shadow-xs',
    dark: 'bg-neutral-900 hover:bg-neutral-800 border-neutral-800 text-white shadow-xs',
    gradient: 'bg-neutral-900/80 hover:bg-neutral-800/90 border-neutral-700/60 text-white shadow-xs backdrop-blur-xs',
  };

  const currentTheme = page.theme || 'pearl';

  return (
    <div
      className={`min-h-screen py-12 px-4 flex flex-col items-center justify-between ${
        themeStyles[currentTheme] || themeStyles.pearl
      }`}
    >
      <div className="w-full max-w-md mx-auto space-y-6">
        {/* Profile Card */}
        <div className="text-center space-y-3">
          <div className="relative inline-block">
            <img
              src={page.avatarUrl || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&auto=format&fit=crop&q=80'}
              alt={page.title}
              referrerPolicy="no-referrer"
              className="w-24 h-24 rounded-full mx-auto object-cover ring-2 ring-neutral-300 dark:ring-neutral-700 shadow-md"
            />
          </div>

          <div>
            <h1 className="text-lg font-bold tracking-tight">{page.title}</h1>
            <p className="text-xs text-neutral-500 font-mono mt-0.5">@{page.slug}</p>
          </div>

          {page.bio && (
            <p className="text-xs text-neutral-600 dark:text-neutral-400 max-w-xs mx-auto leading-relaxed">
              {page.bio}
            </p>
          )}

          {/* Social Icons row */}
          {page.socials && page.socials.length > 0 && (
            <div className="flex items-center justify-center gap-3 pt-2">
              {page.socials.map((s, idx) => (
                <a
                  key={idx}
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-full bg-neutral-100 dark:bg-white/5 hover:bg-neutral-200 dark:hover:bg-white/10 text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white transition-colors border border-neutral-200 dark:border-white/10"
                  aria-label={s.platform}
                >
                  {renderSocialIcon(s.platform)}
                </a>
              ))}
            </div>
          )}
        </div>

        {/* Links list */}
        <div className="space-y-3 pt-4">
          {page.links
            .filter((l) => l.active)
            .map((item) => (
              <button
                key={item.id}
                onClick={() => handleLinkClick(item.id, item.url)}
                className={`w-full group p-4 rounded-xl border transition-all duration-150 flex items-center justify-between cursor-pointer active:scale-[0.99] ${
                  buttonThemeStyles[currentTheme] || buttonThemeStyles.pearl
                }`}
              >
                <span className="text-xs font-semibold text-left truncate mr-2">
                  {item.title}
                </span>
                <ExternalLink className="w-3.5 h-3.5 text-neutral-400 group-hover:text-neutral-900 dark:group-hover:text-white transition-colors shrink-0" />
              </button>
            ))}
        </div>
      </div>

      {/* Powered by LinkPulse branding */}
      <div className="pt-12 text-center">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-[11px] text-neutral-500 hover:text-neutral-900 dark:hover:text-white transition-colors"
        >
          <div className="w-4 h-4 rounded bg-neutral-900 flex items-center justify-center text-white">
            <Link2 className="w-2.5 h-2.5" />
          </div>
          <span>Powered by <strong>Linko</strong></span>
        </Link>
      </div>
    </div>
  );
}
