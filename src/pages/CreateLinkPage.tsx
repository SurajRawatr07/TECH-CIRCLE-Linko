import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import {
  Link2,
  ArrowRight,
  ArrowLeft,
  Check,
  AlertCircle,
  AlertTriangle,
  RefreshCw,
  Copy,
  QrCode,
  Lock,
  Calendar,
  Smartphone,
  Plus,
  CheckCircle2,
  ExternalLink,
  Download,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { useAuthStore } from '../store/useAuthStore';
import { useToastStore } from '../store/useToastStore';
import { linksApi, campaignsApi, tagsApi, adminApi } from '../lib/api';
import { generateShortCode, checkRateLimit } from '../lib/utils';
import { validateUrl, validateAlias, checkPasswordRules } from '../lib/validators';
import { getBaseShortUrl } from '../lib/utils';
import { analyzeUrlRisk, RiskReport } from '../lib/security/riskRadar';
import { generateBase62Code, validateDestinationUrl } from '../lib/shortener/base62';
import { Campaign, Tag } from '../types';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';

export function CreateLinkPage() {
  const { user } = useAuthStore();
  const { success, error: toastError } = useToastStore();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Step 1: Destination & Alias
  const [originalUrl, setOriginalUrl] = useState(searchParams.get('url') || '');
  const [title, setTitle] = useState('');
  const [shortCode, setShortCode] = useState(generateShortCode(6));
  const [aliasAvailability, setAliasAvailability] = useState<{
    checking: boolean;
    available?: boolean;
    error?: string;
  }>({ checking: false, available: true });

  const [campaignId, setCampaignId] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [newTagInput, setNewTagInput] = useState('');

  // Step 2: Rules
  const [enableExpiry, setEnableExpiry] = useState(false);
  const [expiresAt, setExpiresAt] = useState('');
  const [enableLimit, setEnableLimit] = useState(false);
  const [clickLimit, setClickLimit] = useState<number | ''>('');
  const [enablePassword, setEnablePassword] = useState(false);
  const [password, setPassword] = useState('');
  const [enableMobileUrl, setEnableMobileUrl] = useState(false);
  const [mobileUrl, setMobileUrl] = useState('');

  // Dropdown lists
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [blocklist, setBlocklist] = useState<string[]>([]);

  // Validation
  const [urlCheck, setUrlCheck] = useState<{ valid: boolean; error?: string; hostname?: string }>({
    valid: false,
  });
  const [riskReport, setRiskReport] = useState<RiskReport | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdLink, setCreatedLink] = useState<{
    id: string;
    shortCode: string;
    fullUrl: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (user) {
      campaignsApi.getCampaigns(user.role === 'admin' ? undefined : user.id).then(setCampaigns);
      tagsApi.getTags(user.role === 'admin' ? undefined : user.id).then(setTags);
      adminApi.getBlocklist().then((list) => setBlocklist(list.map((b) => b.domain)));
    }
  }, [user]);

  // URL check and live Risk Radar evaluation
  useEffect(() => {
    if (!originalUrl.trim()) {
      setUrlCheck({ valid: false });
      setRiskReport(null);
      return;
    }
    const valResult = validateDestinationUrl(originalUrl);
    setUrlCheck(valResult);

    if (valResult.valid && valResult.normalizedUrl) {
      const risk = analyzeUrlRisk(valResult.normalizedUrl, blocklist);
      setRiskReport(risk);
      if (valResult.parsedUrl?.hostname && !title) {
        setTitle(valResult.parsedUrl.hostname);
      }
    } else {
      setRiskReport(null);
    }
  }, [originalUrl, blocklist, title]);

  // Debounced alias check
  useEffect(() => {
    if (!shortCode.trim()) {
      setAliasAvailability({ checking: false, available: false, error: 'Alias is required' });
      return;
    }
    setAliasAvailability({ checking: true });
    const timer = setTimeout(async () => {
      const res = await linksApi.checkAliasAvailable(shortCode.trim());
      setAliasAvailability({ checking: false, available: res.available, error: res.error });
    }, 200);
    return () => clearTimeout(timer);
  }, [shortCode]);

  function handleRegenerateAlias() {
    setShortCode(generateBase62Code([], 6));
  }

  function handleAddTag() {
    const t = newTagInput.trim();
    if (t && !selectedTags.includes(t)) {
      setSelectedTags([...selectedTags, t]);
    }
    setNewTagInput('');
  }

  const passwordAnalysis = checkPasswordRules(password);

  // Compute Validation Errors & Warnings
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!urlCheck.valid) {
    errors.push(urlCheck.error || 'Destination URL is invalid.');
  }

  if (!aliasAvailability.available) {
    errors.push(aliasAvailability.error || 'Alias is unavailable.');
  }

  if (enableExpiry && expiresAt) {
    if (new Date(expiresAt).getTime() <= Date.now()) {
      errors.push('Expiration date cannot be in the past.');
    }
  }

  if (enableLimit) {
    if (!clickLimit || Number(clickLimit) < 1) {
      errors.push('Click limit must be at least 1.');
    }
  }

  if (enablePassword) {
    if (!password) {
      errors.push('Password protection is enabled but no password was provided.');
    } else if (passwordAnalysis.strength === 'Weak') {
      warnings.push('Password strength is Weak. We recommend meeting all 6 criteria.');
    }
  }

  if (enableMobileUrl && mobileUrl.trim()) {
    let mob = mobileUrl.trim();
    if (!mob.startsWith('http://') && !mob.startsWith('https://')) mob = 'https://' + mob;
    const mobCheck = validateUrl(mob, blocklist);
    if (!mobCheck.valid) {
      errors.push(`Mobile URL error: ${mobCheck.error}`);
    }
  }

  async function handlePublish() {
    if (errors.length > 0 || !user) return;

    // Rate limit check: max 10 links per min
    const rl = checkRateLimit(user.id, 10, 60000);
    if (!rl.allowed) {
      toastError('Rate limit exceeded', `Max 10 links per minute. Please wait ${rl.resetInSeconds} seconds.`);
      return;
    }

    setIsSubmitting(true);
    try {
      let finalDest = originalUrl.trim();
      if (!finalDest.startsWith('http://') && !finalDest.startsWith('https://')) {
        finalDest = 'https://' + finalDest;
      }

      const created = await linksApi.createLink({
        userId: user.id,
        originalUrl: finalDest,
        shortCode: shortCode.trim(),
        title: title.trim() || urlCheck.hostname || 'Short Link',
        campaignId: campaignId || undefined,
        tags: selectedTags,
        rules: {
          expiresAt: enableExpiry && expiresAt ? new Date(expiresAt).toISOString() : undefined,
          clickLimit: enableLimit && typeof clickLimit === 'number' ? clickLimit : undefined,
          password: enablePassword && password ? password : undefined,
          mobileUrl: enableMobileUrl && mobileUrl.trim() ? mobileUrl.trim() : undefined,
        },
      });

      const fullUrl = `${getBaseShortUrl()}/r/${created.shortCode}`;
      setCreatedLink({ id: created.id, shortCode: created.shortCode, fullUrl });
      setStep(3);
      success('Link published successfully!');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to publish';
      toastError('Error', msg);
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleCopy() {
    if (!createdLink) return;
    navigator.clipboard.writeText(createdLink.fullUrl);
    setCopied(true);
    success('Copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Create Short Link
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Step {step} of 2: {step === 1 ? 'Destination & Alias' : step === 2 ? 'Options & Review' : 'Success'}
          </p>
        </div>

        {step < 3 && (
          <div className="flex items-center gap-2 text-xs">
            <button
              onClick={() => setStep(1)}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
                step === 1
                  ? 'pearl-btn-dark'
                  : 'text-neutral-500 hover:text-neutral-800'
              }`}
            >
              1. Destination
            </button>
            <span className="text-neutral-300 dark:text-neutral-700">/</span>
            <button
              onClick={() => {
                if (urlCheck.valid && aliasAvailability.available) setStep(2);
              }}
              disabled={!urlCheck.valid || !aliasAvailability.available}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors disabled:opacity-40 cursor-pointer ${
                step === 2
                  ? 'pearl-btn-dark'
                  : 'text-neutral-500 hover:text-neutral-800'
              }`}
            >
              2. Options & Review
            </button>
          </div>
        )}
      </div>

      {/* STEP 1: Destination & Alias */}
      {step === 1 && (
        <Card className="p-6 space-y-6">
          <Input
            label="Destination URL *"
            placeholder="https://example.com/long-page-path"
            value={originalUrl}
            onChange={(e) => setOriginalUrl(e.target.value)}
            error={originalUrl && !urlCheck.valid ? urlCheck.error : undefined}
            required
          />

          {/* Live Link Risk Radar Verdict */}
          {riskReport && (
            <div
              className={`p-3.5 rounded-xl border text-xs space-y-2 ${
                riskReport.level === 'high'
                  ? 'bg-rose-50 border-rose-200 text-rose-900 dark:bg-rose-950/40 dark:border-rose-900/60 dark:text-rose-200'
                  : riskReport.level === 'caution'
                  ? 'bg-amber-50 border-amber-200 text-amber-900 dark:bg-amber-950/40 dark:border-amber-900/60 dark:text-amber-200'
                  : 'bg-emerald-50 border-emerald-200 text-emerald-900 dark:bg-emerald-950/40 dark:border-emerald-900/60 dark:text-emerald-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-semibold">
                  {riskReport.level === 'high' ? (
                    <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                  ) : riskReport.level === 'caution' ? (
                    <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  )}
                  <span>
                    Link Risk Radar: {riskReport.level.toUpperCase()} RISK (Safety Score: {100 - riskReport.score}/100)
                  </span>
                </div>
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-black/5 dark:bg-white/10">
                  Heuristic Check
                </span>
              </div>

              {riskReport.indicators.length > 0 ? (
                <ul className="space-y-1 list-disc list-inside text-[11px] opacity-90">
                  {riskReport.indicators.map((ind, i) => (
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

          <div className="space-y-2">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Short Alias *
            </label>
            <div className="flex items-center gap-2">
              <div className="flex items-center flex-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm min-h-[44px]">
                <span className="font-mono text-xs text-slate-400 select-none mr-1.5">
                  {getBaseShortUrl().replace(/^https?:\/\//, '')}/r/
                </span>
                <input
                  type="text"
                  value={shortCode}
                  onChange={(e) => setShortCode(e.target.value)}
                  className="flex-1 bg-transparent font-mono text-xs text-slate-900 dark:text-slate-100 focus:outline-none"
                  placeholder="alias"
                />
              </div>

              <Button
                type="button"
                variant="outline"
                size="md"
                onClick={handleRegenerateAlias}
                className="shrink-0 text-xs min-h-[44px]"
              >
                <RefreshCw className="w-3.5 h-3.5 mr-1" />
                <span>Regenerate</span>
              </Button>
            </div>

            <div className="text-xs">
              {aliasAvailability.checking ? (
                <span className="text-neutral-400">Checking availability...</span>
              ) : aliasAvailability.available ? (
                <span className="text-neutral-900 dark:text-white flex items-center gap-1 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Alias available</span>
                </span>
              ) : (
                <span className="text-red-600 flex items-center gap-1 font-medium">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>{aliasAvailability.error || 'Unavailable'}</span>
                </span>
              )}
            </div>
          </div>

          <Input
            label="Title / Display Label"
            placeholder="e.g. Documentation Portal"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />

          <Select
            label="Campaign (Optional)"
            options={[
              { value: '', label: 'None' },
              ...campaigns.map((c) => ({ value: c.id, label: c.name })),
            ]}
            value={campaignId}
            onChange={(e) => setCampaignId(e.target.value)}
          />

          {/* Tags */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-700 dark:text-neutral-300">
              Tags
            </label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {tags.map((t) => {
                const isSelected = selectedTags.includes(t.name);
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => {
                      if (isSelected) {
                        setSelectedTags(selectedTags.filter((tag) => tag !== t.name));
                      } else {
                        setSelectedTags([...selectedTags, t.name]);
                      }
                    }}
                    className={`text-xs px-2.5 py-1 min-h-[36px] rounded-lg border transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-neutral-900 text-white border-neutral-900 font-medium'
                        : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 border-neutral-200 dark:border-neutral-700 hover:bg-neutral-200'
                    }`}
                  >
                    {t.name}
                  </button>
                );
              })}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Add custom tag..."
                value={newTagInput}
                onChange={(e) => setNewTagInput(e.target.value)}
                className="flex-1 px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
              />
              <Button type="button" variant="outline" size="sm" onClick={handleAddTag} className="min-h-[40px]">
                <Plus className="w-3.5 h-3.5 mr-1" />
                <span>Add</span>
              </Button>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
            <Button
              type="button"
              variant="primary"
              disabled={!urlCheck.valid || !aliasAvailability.available}
              onClick={() => setStep(2)}
              className="min-h-[44px]"
            >
              <span>Next: Options & Review</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </Card>
      )}

      {/* STEP 2: Options & Review */}
      {step === 2 && (
        <div className="space-y-6">
          <Card className="p-6 space-y-6">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-3">
              Redirect & Expiry Rules
            </h3>

            {/* Expiration date */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                  Expiration Date
                </span>
                <input
                  type="checkbox"
                  checked={enableExpiry}
                  onChange={(e) => setEnableExpiry(e.target.checked)}
                  className="w-4 h-4 accent-neutral-900 rounded cursor-pointer"
                />
              </div>
              {enableExpiry && (
                <Input
                  type="datetime-local"
                  value={expiresAt}
                  onChange={(e) => setExpiresAt(e.target.value)}
                />
              )}
            </div>

            {/* Click limit */}
            <div className="space-y-2 pt-3 border-t border-neutral-100 dark:border-neutral-800">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-neutral-800 dark:text-neutral-200">
                  Click Limit Cap
                </span>
                <input
                  type="checkbox"
                  checked={enableLimit}
                  onChange={(e) => setEnableLimit(e.target.checked)}
                  className="w-4 h-4 accent-neutral-900 rounded cursor-pointer"
                />
              </div>
              {enableLimit && (
                <Input
                  type="number"
                  min="1"
                  placeholder="e.g. 100"
                  value={clickLimit}
                  onChange={(e) => setClickLimit(e.target.value === '' ? '' : Number(e.target.value))}
                />
              )}
            </div>

            {/* Password protection with live rules checklist */}
            <div className="space-y-2 pt-3 border-t border-neutral-100 dark:border-neutral-800">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-neutral-800 dark:text-neutral-200">
                  Password Protection
                </span>
                <input
                  type="checkbox"
                  checked={enablePassword}
                  onChange={(e) => setEnablePassword(e.target.checked)}
                  className="w-4 h-4 accent-neutral-900 rounded cursor-pointer"
                />
              </div>
              {enablePassword && (
                <div className="space-y-2">
                  <Input
                    type="text"
                    placeholder="Enter access passphrase"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />

                  {/* Password rules checklist */}
                  <div className="p-3 bg-neutral-50 dark:bg-neutral-900/60 rounded-xl border border-neutral-200 dark:border-neutral-800 space-y-1 text-[11px]">
                    {passwordAnalysis.rules.map((r) => (
                      <div
                        key={r.id}
                        className={`flex items-center gap-1.5 ${
                          r.valid ? 'text-neutral-900 dark:text-white font-medium' : 'text-neutral-400'
                        }`}
                      >
                        {r.valid ? (
                          <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                        ) : (
                          <span className="w-3.5 h-3.5 rounded-full border border-neutral-300 dark:border-neutral-700" />
                        )}
                        <span>{r.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Mobile Destination URL */}
            <div className="space-y-2 pt-3 border-t border-neutral-100 dark:border-neutral-800">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-neutral-800 dark:text-neutral-200">
                  Mobile Device Destination
                </span>
                <input
                  type="checkbox"
                  checked={enableMobileUrl}
                  onChange={(e) => setEnableMobileUrl(e.target.checked)}
                  className="w-4 h-4 accent-neutral-900 rounded cursor-pointer"
                />
              </div>
              {enableMobileUrl && (
                <Input
                  placeholder="https://m.example.com or app deep link"
                  value={mobileUrl}
                  onChange={(e) => setMobileUrl(e.target.value)}
                />
              )}
            </div>
          </Card>

          {/* Check before publishing box */}
          <Card className="p-6 space-y-4">
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-white">
              Check before publishing
            </h3>

            {errors.length === 0 && warnings.length === 0 && (
              <div className="p-3 bg-neutral-100 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-xl text-xs text-neutral-800 dark:text-neutral-200 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-neutral-900 dark:text-white shrink-0" />
                <span>All checks passed. Ready to publish.</span>
              </div>
            )}

            {errors.length > 0 && (
              <div className="space-y-1.5">
                <p className="text-xs font-semibold text-rose-600">Blocking Errors:</p>
                {errors.map((err, i) => (
                  <div key={i} className="p-2 bg-rose-50 dark:bg-rose-950/40 rounded text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
                    <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                    <span>{err}</span>
                  </div>
                ))}
              </div>
            )}

            {warnings.length > 0 && (
              <div className="space-y-1.5">
                <p className="text-xs font-semibold text-amber-600">Advisories (Non-blocking):</p>
                {warnings.map((warn, i) => (
                  <div key={i} className="p-2 bg-amber-50 dark:bg-amber-950/40 rounded text-xs text-amber-800 dark:text-amber-300 flex items-center gap-2">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    <span>{warn}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Review summary */}
            <div className="p-3.5 bg-slate-50 dark:bg-slate-900/60 rounded-lg border border-slate-200 dark:border-slate-800 text-xs space-y-1">
              <p className="font-semibold text-slate-800 dark:text-slate-200">Review Summary:</p>
              <p className="text-slate-600 dark:text-slate-400 font-mono">
                linko.io/r/{shortCode} &rarr; {originalUrl}
              </p>
            </div>
          </Card>

          <div className="flex items-center justify-between">
            <Button variant="outline" size="md" onClick={() => setStep(1)} className="min-h-[44px]">
              <ArrowLeft className="w-4 h-4 mr-1" />
              <span>Back</span>
            </Button>
            <Button
              variant="primary"
              size="md"
              disabled={errors.length > 0}
              isLoading={isSubmitting}
              onClick={handlePublish}
              className="min-h-[44px]"
            >
              <span>Publish Short Link</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      )}

      {/* STEP 3: Success Screen */}
      {step === 3 && createdLink && (
        <Card className="p-8 text-center space-y-6">
          <div className="w-12 h-12 rounded-xl bg-neutral-900 text-white flex items-center justify-center mx-auto shadow-xs">
            <CheckCircle2 className="w-6 h-6 stroke-[2.2]" />
          </div>

          <div>
            <h2 className="font-display text-xl sm:text-2xl font-normal text-neutral-900 dark:text-white">
              Link Published!
            </h2>
            <p className="text-xs text-neutral-500 mt-1">
              Your link is active and ready to share.
            </p>
          </div>

          <div className="p-3 bg-neutral-50 dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 flex items-center justify-between gap-3 max-w-md mx-auto">
            <span className="font-mono text-sm font-medium text-neutral-900 dark:text-neutral-100 underline decoration-neutral-300 truncate">
              {createdLink.fullUrl}
            </span>
            <Button variant="primary" size="sm" onClick={handleCopy} className="shrink-0 min-h-[38px]">
              {copied ? <Check className="w-3.5 h-3.5 mr-1" /> : <Copy className="w-3.5 h-3.5 mr-1" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </Button>
          </div>

          <div className="p-4 bg-white rounded-xl shadow-xs border border-slate-200 inline-block">
            <QRCodeSVG id="created-qr-svg" value={createdLink.fullUrl} size={140} />
          </div>

          <div className="flex flex-wrap justify-center gap-2.5 pt-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const svg = document.getElementById('created-qr-svg');
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
                    const a = document.createElement('a');
                    a.download = `linko-qr-${createdLink.shortCode}.png`;
                    a.href = canvas.toDataURL('image/png');
                    a.click();
                    success('QR code downloaded as PNG');
                  }
                };
                img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
              }}
              className="min-h-[40px] text-xs gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download QR PNG</span>
            </Button>

            <Link
              to={`/r/${createdLink.shortCode}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-xs font-semibold text-neutral-800 dark:text-neutral-200"
            >
              <span>Test in Simulator</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="flex justify-center gap-3 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setOriginalUrl('');
                setTitle('');
                setShortCode(generateBase62Code([], 6));
                setStep(1);
              }}
              className="min-h-[40px]"
            >
              Create Another Link
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => navigate('/app/links')}
              className="min-h-[40px]"
            >
              View Links
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
