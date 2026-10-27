import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Sparkles,
  Plus,
  Trash2,
  ExternalLink,
  Copy,
  Check,
  Smartphone,
  Eye,
  Globe,
  Save,
  Twitter,
  Github,
  Linkedin,
} from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { useToastStore } from '../store/useToastStore';
import { bioApi } from '../lib/api';
import { BioPage, BioLinkItem } from '../types';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Skeleton } from '../components/ui/Skeleton';
import { getBaseShortUrl } from '../lib/utils';

export function BioBuilderPage() {
  const { user } = useAuthStore();
  const { success, error: toastError } = useToastStore();

  const [bioPage, setBioPage] = useState<BioPage | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  // New Link input form
  const [newTitle, setNewTitle] = useState('');
  const [newUrl, setNewUrl] = useState('');

  useEffect(() => {
    async function loadBio() {
      if (!user) return;
      setIsLoading(true);
      try {
        const page = await bioApi.getBioByUserId(user.id);
        setBioPage(page);
      } catch {
        toastError('Failed to load Link-in-Bio data');
      } finally {
        setIsLoading(false);
      }
    }
    loadBio();
  }, [user]);

  function handleAddLink(e: React.FormEvent) {
    e.preventDefault();
    if (!newTitle.trim() || !newUrl.trim() || !bioPage) return;

    let target = newUrl.trim();
    if (!target.startsWith('http://') && !target.startsWith('https://')) {
      target = 'https://' + target;
    }

    const newItem: BioLinkItem = {
      id: `bl_${Date.now()}`,
      title: newTitle.trim(),
      url: target,
      active: true,
      clicks: 0,
    };

    setBioPage({
      ...bioPage,
      links: [...bioPage.links, newItem],
    });
    setNewTitle('');
    setNewUrl('');
  }

  function handleToggleLink(id: string) {
    if (!bioPage) return;
    setBioPage({
      ...bioPage,
      links: bioPage.links.map((l) => (l.id === id ? { ...l, active: !l.active } : l)),
    });
  }

  function handleDeleteLink(id: string) {
    if (!bioPage) return;
    setBioPage({
      ...bioPage,
      links: bioPage.links.filter((l) => l.id !== id),
    });
  }

  async function handleSave() {
    if (!bioPage || !user) return;
    setIsSaving(true);
    try {
      await bioApi.saveBioPage(user.id, bioPage);
      success('Bio page published successfully!');
    } catch {
      toastError('Failed to save bio page');
    } finally {
      setIsSaving(false);
    }
  }

  function handleCopyBioUrl() {
    if (!bioPage) return;
    const url = `${getBaseShortUrl()}/bio/${bioPage.slug}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    success('Copied Bio URL to clipboard');
    setTimeout(() => setCopied(false), 2000);
  }

  if (isLoading || !bioPage) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  const publicBioUrl = `${getBaseShortUrl()}/bio/${bioPage.slug}`;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Link-in-Bio Builder
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Design a mobile micro-landing page for social bios, conferences, and creator profiles
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleCopyBioUrl} className="text-xs">
            {copied ? <Check className="w-3.5 h-3.5 mr-1 text-neutral-900 dark:text-neutral-100" /> : <Copy className="w-3.5 h-3.5 mr-1" />}
            <span>Copy Bio URL</span>
          </Button>

          <a href={publicBioUrl} target="_blank" rel="noreferrer">
            <Button variant="outline" size="sm" className="text-xs">
              <ExternalLink className="w-3.5 h-3.5 mr-1" />
              <span>Live Page</span>
            </Button>
          </a>

          <Button
            variant="primary"
            size="sm"
            onClick={handleSave}
            isLoading={isSaving}
            className="text-xs"
          >
            <Save className="w-3.5 h-3.5 mr-1" />
            <span>Save & Publish</span>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Editor Controls (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Profile Identity */}
          <Card className="p-6 space-y-4">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-2">
              Profile Details
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Public Slug (linko.bio/...)"
                value={bioPage.slug}
                onChange={(e) =>
                  setBioPage({
                    ...bioPage,
                    slug: e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ''),
                  })
                }
                isMono
              />
              <Input
                label="Display Title"
                value={bioPage.title}
                onChange={(e) => setBioPage({ ...bioPage, title: e.target.value })}
              />
            </div>

            <Input
              label="Avatar Image URL"
              value={bioPage.avatarUrl}
              onChange={(e) => setBioPage({ ...bioPage, avatarUrl: e.target.value })}
            />

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                Bio Description
              </label>
              <textarea
                rows={2}
                value={bioPage.bio}
                onChange={(e) => setBioPage({ ...bioPage, bio: e.target.value })}
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 p-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-neutral-400"
              />
            </div>

            {/* Theme Selector */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                Palette & Theme
              </label>
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 text-xs">
                {(['pearl', 'slate', 'minimal', 'dark', 'gradient'] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setBioPage({ ...bioPage, theme: t })}
                    className={`py-2 px-3 rounded-lg border capitalize font-medium transition-all ${
                      bioPage.theme === t
                        ? 'border-neutral-900 bg-neutral-900 text-white shadow-xs'
                        : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
          </Card>

          {/* Add Link Form */}
          <Card className="p-6 space-y-4">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
              Add Link to Bio
            </h3>
            <form onSubmit={handleAddLink} className="space-y-3">
              <Input
                label="Button Title"
                placeholder="e.g. Read my latest engineering blog post"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                required
              />
              <Input
                label="Destination URL"
                placeholder="https://yourdomain.com/blog/scaling-vite"
                value={newUrl}
                onChange={(e) => setNewUrl(e.target.value)}
                required
              />
              <Button type="submit" variant="primary" size="sm" className="w-full">
                <Plus className="w-3.5 h-3.5 mr-1" />
                <span>Add Link</span>
              </Button>
            </form>
          </Card>

          {/* Links list in builder */}
          <Card className="p-6 space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Configured Links ({bioPage.links.length})
            </h3>
            <div className="space-y-2">
              {bioPage.links.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 text-xs"
                >
                  <div className="min-w-0 pr-3">
                    <p className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                      {item.title}
                    </p>
                    <p className="font-mono text-[11px] text-slate-400 truncate">{item.url}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="font-mono text-[11px] text-slate-400">
                      {item.clicks || 0} clicks
                    </span>
                    <button
                      type="button"
                      onClick={() => handleToggleLink(item.id)}
                      className={`text-[10px] px-2 py-0.5 rounded font-medium ${
                        item.active
                          ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900'
                          : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      {item.active ? 'Active' : 'Hidden'}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteLink(item.id)}
                      className="p-1 text-slate-400 hover:text-rose-600"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Live Mobile Mockup Preview (5 cols) */}
        <div className="lg:col-span-5 sticky top-20">
          <div className="flex items-center justify-center">
            {/* Phone Frame */}
            <div className="w-[320px] rounded-[36px] border-4 border-slate-800 bg-black p-3 shadow-2xl relative overflow-hidden">
              {/* Dynamic Island / Speaker notch */}
              <div className="w-24 h-4 bg-slate-900 rounded-full mx-auto mb-4" />

              {/* Inside Screen Content */}
              <div
                className={`min-h-[500px] rounded-[24px] p-5 flex flex-col items-center justify-between transition-colors ${
                  bioPage.theme === 'pearl'
                    ? 'bg-[#faf9f6] text-neutral-900'
                    : bioPage.theme === 'slate'
                    ? 'bg-neutral-900 text-white'
                    : bioPage.theme === 'minimal'
                    ? 'bg-white text-slate-900'
                    : bioPage.theme === 'dark'
                    ? 'bg-black text-white'
                    : 'bg-gradient-to-tr from-neutral-950 via-neutral-900 to-neutral-800 text-white'
                }`}
              >
                <div className="w-full text-center space-y-3">
                  <img
                    src={bioPage.avatarUrl}
                    alt={bioPage.title}
                    referrerPolicy="no-referrer"
                    className="w-16 h-16 rounded-full mx-auto object-cover ring-2 ring-neutral-400/40 shadow-xs"
                  />
                  <div>
                    <h4 className="text-xs font-bold truncate">{bioPage.title}</h4>
                    <p className="text-[10px] text-neutral-500 font-mono">@{bioPage.slug}</p>
                  </div>
                  {bioPage.bio && (
                    <p className="text-[10px] opacity-80 leading-relaxed max-w-[220px] mx-auto line-clamp-3">
                      {bioPage.bio}
                    </p>
                  )}

                  {/* Render Links Mock */}
                  <div className="space-y-2 pt-2">
                    {bioPage.links
                      .filter((l) => l.active)
                      .map((l) => (
                        <div
                          key={l.id}
                          className="w-full py-2.5 px-3 rounded-lg border border-white/10 bg-white/10 hover:bg-white/15 text-[11px] font-semibold text-center truncate shadow-xs"
                        >
                          {l.title}
                        </div>
                      ))}
                  </div>
                </div>

                <div className="pt-4 text-[9px] opacity-40">
                  Powered by Linko
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
