import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Link2,
  Copy,
  Check,
  ExternalLink,
  QrCode,
  Lock,
  Calendar,
  Smartphone,
  AlertTriangle,
  Download,
  Trash2,
  ArrowLeft,
  CheckCircle2,
  Power,
  BarChart2,
  Clock,
  ShieldCheck,
  Shield,
  ShieldAlert,
  Globe,
  History,
  Edit3,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { linksApi, clicksApi, policyLabApi } from '../lib/api';
import { useToastStore } from '../store/useToastStore';
import { Link as LinkType, ClickEvent, AnalyticsSummary } from '../types';
import { formatCompactNumber, cn, getBaseShortUrl } from '../lib/utils';
import { analyzeUrlRisk, RiskReport } from '../lib/security/riskRadar';
import { DestinationGuardian, DestinationChangeRecord } from '../lib/security/destinationGuardian';
import { validateDestinationUrl } from '../lib/shortener/base62';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import { Tabs } from '../components/ui/Tabs';
import { Modal, ConfirmDialog } from '../components/ui/Modal';
import { Skeleton } from '../components/ui/Skeleton';

export function LinkDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { success, error: toastError } = useToastStore();

  const [link, setLink] = useState<LinkType | null>(null);
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null);
  const [clickLog, setClickLog] = useState<ClickEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Active tab: 'overview' | 'security' | 'rules' | 'qr' | 'logs'
  const [activeTab, setActiveTab] = useState('overview');

  // Destination Guardian & Edit state
  const [changeHistory, setChangeHistory] = useState<DestinationChangeRecord[]>([]);
  const [editDestModalOpen, setEditDestModalOpen] = useState(false);
  const [newDestInput, setNewDestInput] = useState('');
  const [destError, setDestError] = useState('');
  const [isUpdatingDest, setIsUpdatingDest] = useState(false);

  // QR Customizer state
  const [qrFgColor, setQrFgColor] = useState('#171717');
  const [qrBgColor, setQrBgColor] = useState('#ffffff');
  const [qrSize, setQrSize] = useState(200);

  // Delete modal
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function loadLinkDetails() {
      if (!id) return;
      setIsLoading(true);
      try {
        const [linkData, analyticsData, recentClicks] = await Promise.all([
          linksApi.getLinkById(id),
          clicksApi.getAnalytics({ range: '30d', linkId: id }),
          clicksApi.getLinkClicks(id, 50),
        ]);

        if (!linkData) {
          toastError('Link not found');
          navigate('/app/links');
          return;
        }

        setLink(linkData);
        setNewDestInput(linkData.originalUrl);
        setAnalytics(analyticsData);
        setClickLog(recentClicks);
        setChangeHistory(DestinationGuardian.getChangeHistory(linkData.id));
      } catch {
        toastError('Failed to load link data');
      } finally {
        setIsLoading(false);
      }
    }

    loadLinkDetails();
  }, [id, navigate]);

  const riskReport = useMemo(() => {
    if (!link?.originalUrl) return null;
    return analyzeUrlRisk(link.originalUrl);
  }, [link?.originalUrl]);

  async function handleSaveNewDestination(e: React.FormEvent) {
    e.preventDefault();
    if (!link) return;
    setDestError('');

    const validation = validateDestinationUrl(newDestInput);
    if (!validation.valid) {
      setDestError(validation.error || 'Please enter a valid HTTP or HTTPS destination URL.');
      return;
    }

    if (newDestInput.trim() === link.originalUrl.trim()) {
      setEditDestModalOpen(false);
      return;
    }

    setIsUpdatingDest(true);
    try {
      DestinationGuardian.recordChange({
        linkId: link.id,
        shortCode: link.shortCode,
        linkTitle: link.title,
        oldUrl: link.originalUrl,
        newUrl: newDestInput.trim(),
      });

      const updated = await linksApi.updateLink(link.id, { originalUrl: newDestInput.trim() });
      setLink(updated);
      setChangeHistory(DestinationGuardian.getChangeHistory(link.id));
      setEditDestModalOpen(false);
      success('Destination updated & logged in Destination Guardian audit.');
    } catch {
      toastError('Failed to update destination');
    } finally {
      setIsUpdatingDest(false);
    }
  }

  function handleCopy() {
    if (!link) return;
    const full = `${getBaseShortUrl()}/r/${link.shortCode}`;
    navigator.clipboard.writeText(full);
    setCopied(true);
    success('Copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleToggleActive() {
    if (!link) return;
    try {
      const updated = await linksApi.updateLink(link.id, { isActive: !link.isActive });
      setLink(updated);
      success(updated.isActive ? 'Link enabled' : 'Link disabled');
    } catch {
      toastError('Failed to update status');
    }
  }

  async function handleDelete() {
    if (!link) return;
    try {
      await linksApi.deleteLink(link.id);
      success('Link deleted');
      navigate('/app/links');
    } catch {
      toastError('Failed to delete link');
    }
  }

  function handleDownloadSvg() {
    const svgEl = document.getElementById('qr-svg-code');
    if (!svgEl) return;
    const svgData = new XMLSerializer().serializeToString(svgEl);
    const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const linkEl = document.createElement('a');
    linkEl.href = url;
    linkEl.download = `linko-qr-${link?.shortCode}.svg`;
    document.body.appendChild(linkEl);
    linkEl.click();
    document.body.removeChild(linkEl);
    success('QR Code downloaded as SVG');
  }

  if (isLoading || !link) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-60" />
        <div className="grid grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  const fullShortUrl = `${getBaseShortUrl()}/r/${link.shortCode}`;

  return (
    <div className="space-y-6">
      {/* Back button & Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            to="/app/links"
            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xl font-bold text-neutral-900 dark:text-white">
                /{link.shortCode}
              </span>
              {!link.isActive ? (
                <Badge variant="danger" size="sm">Disabled</Badge>
              ) : (
                <Badge variant="success" size="sm">Active</Badge>
              )}
              {riskReport && (
                <Badge
                  variant={riskReport.level === 'low' ? 'success' : riskReport.level === 'caution' ? 'warning' : 'danger'}
                  size="sm"
                >
                  Radar: {riskReport.score}/100
                </Badge>
              )}
            </div>
            <h1 className="text-sm font-semibold text-neutral-900 dark:text-white truncate mt-0.5">
              {link.title}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleCopy} className="text-xs">
            {copied ? <Check className="w-3.5 h-3.5 mr-1 text-neutral-900 dark:text-white" /> : <Copy className="w-3.5 h-3.5 mr-1" />}
            <span>{copied ? 'Copied' : 'Copy URL'}</span>
          </Button>

          <a href={fullShortUrl} target="_blank" rel="noreferrer">
            <Button variant="outline" size="sm" className="text-xs">
              <ExternalLink className="w-3.5 h-3.5 mr-1" />
              <span>Test Redirect</span>
            </Button>
          </a>

          <Button
            variant="outline"
            size="sm"
            onClick={handleToggleActive}
            className="text-xs"
          >
            <Power className="w-3.5 h-3.5 mr-1" />
            <span>{link.isActive ? 'Disable' : 'Enable'}</span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setDeleteConfirmOpen(true)}
            className="text-xs text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {/* Target Destination URL Card with Guardian Change Action */}
      <Card className="p-4 bg-neutral-50 dark:bg-neutral-900/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 truncate">
          <span className="text-neutral-400 font-sans font-medium shrink-0">Destination:</span>
          <a
            href={link.originalUrl}
            target="_blank"
            rel="noreferrer"
            className="text-neutral-800 dark:text-neutral-200 hover:underline font-mono truncate max-w-xl flex items-center gap-1"
          >
            <span className="truncate">{link.originalUrl}</span>
            <ExternalLink className="w-3 h-3 shrink-0 text-neutral-400" />
          </a>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <Button
            variant="outline"
            size="sm"
            className="text-xs"
            onClick={() => {
              setNewDestInput(link.originalUrl);
              setDestError('');
              setEditDestModalOpen(true);
            }}
          >
            <Edit3 className="w-3.5 h-3.5 mr-1" />
            <span>Change Target</span>
          </Button>
          <span className="text-neutral-400 text-[11px] font-sans">
            Created {new Date(link.createdAt).toLocaleDateString()}
          </span>
        </div>
      </Card>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 space-y-1">
          <span className="text-xs text-neutral-500">Total Visits</span>
          <p className="text-2xl font-bold font-mono tabular-nums text-neutral-900 dark:text-white">
            {formatCompactNumber(link.clicksCount)}
          </p>
          <span className="text-[11px] text-neutral-700 dark:text-neutral-300 font-mono">
            {link.uniqueClicksCount} unique visitors
          </span>
        </Card>

        <Card className="p-4 space-y-1">
          <span className="text-xs text-neutral-500">QR Code Scans</span>
          <p className="text-2xl font-bold font-mono tabular-nums text-neutral-900 dark:text-white">
            {link.qrScansCount}
          </p>
          <span className="text-[11px] text-neutral-500">
            {Math.round((link.qrScansCount / (link.clicksCount || 1)) * 100)}% of total volume
          </span>
        </Card>

        <Card className="p-4 space-y-1">
          <span className="text-xs text-neutral-500">Security Invariant</span>
          <p className="text-2xl font-bold text-neutral-900 dark:text-white">
            {link.rules.password ? 'Protected' : 'Open'}
          </p>
          <span className="text-[11px] text-neutral-500">
            {link.rules.clickLimit ? `Limit: ${link.rules.clickLimit} cap` : 'Uncapped clicks'}
          </span>
        </Card>

        <Card className="p-4 space-y-1">
          <span className="text-xs text-neutral-500">Link Risk Radar</span>
          <p className="text-2xl font-bold text-neutral-900 dark:text-white">
            {riskReport ? (riskReport.level === 'low' ? 'Low Risk' : riskReport.level === 'caution' ? 'Caution' : 'High Risk') : 'Clean'}
          </p>
          <span className="text-[11px] text-neutral-500">
            {riskReport ? `Score: ${riskReport.score}/100 heuristic` : 'Local verification'}
          </span>
        </Card>
      </div>

      {/* Tabs navigation */}
      <Tabs
        tabs={[
          { id: 'overview', label: 'Overview & Charts' },
          { id: 'security', label: `Risk Radar & Guardian (${changeHistory.length})` },
          { id: 'rules', label: 'Redirect Rules' },
          { id: 'qr', label: 'QR Code Studio' },
          { id: 'logs', label: `Click Log (${clickLog.length})` },
        ]}
        activeTab={activeTab}
        onChange={setActiveTab}
      />

      {/* TAB: Risk Radar & Destination Guardian */}
      {activeTab === 'security' && (
        <div className="space-y-6">
          {/* Risk Radar Summary */}
          {riskReport && (
            <Card className="p-6 space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-100 dark:border-neutral-800 pb-4">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      riskReport.level === 'low'
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                        : riskReport.level === 'caution'
                        ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                        : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                    }`}
                  >
                    {riskReport.level === 'low' ? (
                      <ShieldCheck className="w-5 h-5" />
                    ) : riskReport.level === 'caution' ? (
                      <AlertTriangle className="w-5 h-5" />
                    ) : (
                      <ShieldAlert className="w-5 h-5" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                      <span>
                        Link Risk Radar:{' '}
                        {riskReport.level === 'low'
                          ? 'Low Risk'
                          : riskReport.level === 'caution'
                          ? 'Caution Recommended'
                          : 'High Risk Detected'}
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded-full font-mono font-semibold bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300">
                        Score: {riskReport.score}/100
                      </span>
                    </h3>
                    <p className="text-xs text-neutral-500 mt-0.5">
                      Evaluated on destination target: <span className="font-mono">{riskReport.hostname}</span>
                    </p>
                  </div>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs"
                  onClick={() => {
                    setNewDestInput(link.originalUrl);
                    setDestError('');
                    setEditDestModalOpen(true);
                  }}
                >
                  <Edit3 className="w-3.5 h-3.5 mr-1" />
                  <span>Update Destination</span>
                </Button>
              </div>

              {/* Heuristic Breakdown */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-500">
                  Detected Risk Indicators ({riskReport.indicators.length})
                </h4>
                {riskReport.indicators.length === 0 ? (
                  <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>No structural risk signals or phishing heuristic triggers found for this URL.</span>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {riskReport.indicators.map((ind) => (
                      <div
                        key={ind.code}
                        className="p-3.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50 space-y-1 text-xs"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-semibold text-neutral-900 dark:text-white flex items-center gap-1.5">
                            {ind.severity === 'danger' ? (
                              <AlertCircle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                            ) : (
                              <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                            )}
                            {ind.title}
                          </span>
                          <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-neutral-200 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300">
                            {ind.severity}
                          </span>
                        </div>
                        <p className="text-neutral-600 dark:text-neutral-400 text-[11px] leading-relaxed">
                          {ind.explanation}
                        </p>
                        <p className="text-[10px] font-mono text-neutral-500 truncate">
                          Evidence: {ind.evidence}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Recommendations */}
              <div className="space-y-2 pt-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-500">
                  Recommendations & Guardrails
                </h4>
                <ul className="space-y-1.5 text-xs text-neutral-600 dark:text-neutral-400">
                  {riskReport.recommendations.map((rec, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-neutral-400 mt-0.5">•</span>
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="p-3 rounded-lg bg-neutral-100 dark:bg-neutral-800/80 text-[11px] text-neutral-500 dark:text-neutral-400">
                {riskReport.disclaimer}
              </div>
            </Card>
          )}

          {/* Destination Guardian Audit Log for this link */}
          <Card className="p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-100 dark:border-neutral-800 pb-3">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-neutral-700 dark:text-neutral-300" />
                <h3 className="text-sm font-semibold text-neutral-900 dark:text-white">
                  Destination Guardian Change Log ({changeHistory.length})
                </h3>
              </div>
              <span className="text-xs text-neutral-500">
                Audits all in-app destination modifications
              </span>
            </div>

            {changeHistory.length === 0 ? (
              <p className="text-xs text-neutral-500 italic py-2">
                No destination modifications recorded. The link currently routes to its original creation URL.
              </p>
            ) : (
              <div className="space-y-3">
                {changeHistory.map((rec) => (
                  <div
                    key={rec.id}
                    className="p-3.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50 text-xs space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[11px] text-neutral-500">
                        {new Date(rec.timestamp).toLocaleString()}
                      </span>
                      <Badge
                        variant={rec.status === 'approved' ? 'success' : rec.status === 'paused' ? 'danger' : 'warning'}
                        size="sm"
                      >
                        {rec.status === 'approved' ? 'Approved' : rec.status === 'paused' ? 'Paused' : 'Pending Review'}
                      </Badge>
                    </div>
                    <div className="space-y-1 font-mono text-[11px]">
                      <div className="flex items-center gap-2">
                        <span className="text-neutral-400 w-16 shrink-0">Previous:</span>
                        <span className="text-rose-600 dark:text-rose-400 line-through truncate">{rec.oldUrl}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-neutral-400 w-16 shrink-0">Updated:</span>
                        <span className="text-emerald-600 dark:text-emerald-400 font-medium truncate">{rec.newUrl}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      )}

      {/* TAB 1: Overview & Charts */}
      {activeTab === 'overview' && analytics && (
        <div className="space-y-6">
          <Card className="p-6 space-y-4">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
              Clicks Over Last 30 Days
            </h3>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={analytics.clicksOverTime} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="linkDetailGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#171717" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#171717" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="#737373" />
                  <YAxis tick={{ fontSize: 10 }} stroke="#737373" allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#171717',
                      borderRadius: '8px',
                      fontSize: '12px',
                      color: '#fff',
                    }}
                  />
                  <Area type="monotone" dataKey="clicks" stroke="#171717" strokeWidth={2} fill="url(#linkDetailGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="p-5 space-y-3">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                Top Referrers
              </h3>
              <div className="space-y-2 text-xs">
                {analytics.referrers.map((ref: { name: string; count: number; percentage: number }) => (
                  <div key={ref.name} className="flex items-center justify-between">
                    <span className="text-slate-600 dark:text-slate-400 truncate max-w-xs">{ref.name}</span>
                    <span className="font-mono tabular-nums">{ref.count}</span>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-5 space-y-3">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                Device Distribution
              </h3>
              <div className="space-y-2 text-xs">
                {analytics.devices.map((dev: { name: string; count: number; percentage: number }) => (
                  <div key={dev.name} className="flex items-center justify-between">
                    <span className="capitalize text-slate-600 dark:text-slate-400">{dev.name}</span>
                    <span className="font-mono tabular-nums">{dev.count} ({dev.percentage}%)</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* TAB 2: Rules */}
      {activeTab === 'rules' && (
        <Card className="p-6 space-y-6 max-w-2xl">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-3">
            Active Configuration Rules
          </h3>

          <div className="space-y-4 text-xs">
            <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800">
              <span className="font-medium text-slate-600 dark:text-slate-400">Password Access:</span>
              <span className="font-mono">
                {link.rules.password ? `Enabled (${link.rules.password})` : 'Disabled'}
              </span>
            </div>

            <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800">
              <span className="font-medium text-slate-600 dark:text-slate-400">Expiration Date:</span>
              <span className="font-mono">
                {link.rules.expiresAt ? new Date(link.rules.expiresAt).toLocaleString() : 'Never'}
              </span>
            </div>

            <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800">
              <span className="font-medium text-slate-600 dark:text-slate-400">Visitor Click Limit:</span>
              <span className="font-mono">
                {link.rules.clickLimit ? `${link.rules.clickLimit} clicks` : 'Unlimited'}
              </span>
            </div>

            <div className="space-y-2 py-2">
              <span className="font-medium text-slate-600 dark:text-slate-400">Device Routing Targets:</span>
              {link.rules.deviceTargeting && Object.keys(link.rules.deviceTargeting).length > 0 ? (
                <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-lg space-y-1.5 font-mono text-[11px]">
                  {link.rules.deviceTargeting.ios && <p>iOS: {link.rules.deviceTargeting.ios}</p>}
                  {link.rules.deviceTargeting.android && <p>Android: {link.rules.deviceTargeting.android}</p>}
                  {link.rules.deviceTargeting.desktop && <p>Desktop: {link.rules.deviceTargeting.desktop}</p>}
                </div>
              ) : (
                <p className="text-slate-400">No device targeting rules configured.</p>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* TAB 3: QR Studio */}
      {activeTab === 'qr' && (
        <Card className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            {/* Visual Canvas */}
            <div className="flex flex-col items-center justify-center p-8 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700">
              <div
                style={{ backgroundColor: qrBgColor, padding: '16px', borderRadius: '12px' }}
                className="shadow-sm"
              >
                <QRCodeSVG
                  id="qr-svg-code"
                  value={`${fullShortUrl}?src=qr`}
                  size={qrSize}
                  fgColor={qrFgColor}
                  bgColor={qrBgColor}
                  level="H"
                />
              </div>
              <p className="mt-4 text-xs font-mono text-slate-400">
                Encodes: {fullShortUrl}?src=qr
              </p>
            </div>

            {/* Customizer settings */}
            <div className="space-y-4">
              <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                Customize QR Output
              </h3>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Foreground Color
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={qrFgColor}
                      onChange={(e) => setQrFgColor(e.target.value)}
                      className="w-8 h-8 rounded border border-slate-300 cursor-pointer"
                    />
                    <span className="font-mono">{qrFgColor}</span>
                  </div>
                </div>

                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Background Color
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={qrBgColor}
                      onChange={(e) => setQrBgColor(e.target.value)}
                      className="w-8 h-8 rounded border border-slate-300 cursor-pointer"
                    />
                    <span className="font-mono">{qrBgColor}</span>
                  </div>
                </div>

                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Size: {qrSize}px
                  </label>
                  <input
                    type="range"
                    min="120"
                    max="300"
                    step="10"
                    value={qrSize}
                    onChange={(e) => setQrSize(Number(e.target.value))}
                    className="w-full accent-neutral-900"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-neutral-100 dark:border-neutral-800 flex items-center gap-3">
                <Button variant="primary" size="sm" onClick={handleDownloadSvg}>
                  <Download className="w-3.5 h-3.5 mr-1.5" />
                  <span>Download SVG</span>
                </Button>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* TAB 4: Click History Logs */}
      {activeTab === 'logs' && (
        <Card className="p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-50 dark:bg-neutral-800/80 text-neutral-500 font-semibold uppercase tracking-wider border-b border-neutral-200 dark:border-neutral-800">
                <tr>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Referrer</th>
                  <th className="py-3 px-4">Device & OS</th>
                  <th className="py-3 px-4">Location</th>
                  <th className="py-3 px-4">Source</th>
                  <th className="py-3 px-4 text-right">Bot Flag</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                {clickLog.map((event) => (
                  <tr key={event.id} className="hover:bg-neutral-50/50 dark:hover:bg-neutral-800/40">
                    <td className="py-3 px-4 font-mono text-[11px] text-neutral-500">
                      {new Date(event.timestamp).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 truncate max-w-xs text-neutral-700 dark:text-neutral-300">
                      {event.referrer}
                    </td>
                    <td className="py-3 px-4 capitalize">
                      {event.deviceType} · {event.os}
                    </td>
                    <td className="py-3 px-4">
                      {event.city ? `${event.city}, ` : ''}{event.country}
                    </td>
                    <td className="py-3 px-4 uppercase text-[10px] font-mono font-semibold">
                      {event.source}
                    </td>
                    <td className="py-3 px-4 text-right">
                      {event.isBot ? (
                        <Badge variant="warning" size="sm">Bot Crawler</Badge>
                      ) : (
                        <span className="text-neutral-900 dark:text-white font-medium text-[11px]">Human</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Destination Change Guardian Edit Modal */}
      <Modal
        isOpen={editDestModalOpen}
        onClose={() => setEditDestModalOpen(false)}
        title="Update Destination Target"
      >
        <form onSubmit={handleSaveNewDestination} className="space-y-4">
          <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2.5">
            <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Destination Guardian Active</p>
              <p className="text-[11px] mt-0.5 text-amber-700 dark:text-amber-400">
                Changing a link's destination target is recorded in the platform security audit log to protect visitors from silent hijacking.
              </p>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
              New Destination URL *
            </label>
            <Input
              value={newDestInput}
              onChange={(e) => {
                setNewDestInput(e.target.value);
                setDestError('');
              }}
              placeholder="https://example.com/new-path"
              error={destError}
              autoFocus
            />
            <p className="text-[11px] text-neutral-500 mt-1 font-mono truncate">
              Current: {link.originalUrl}
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-neutral-100 dark:border-neutral-800">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setEditDestModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={isUpdatingDest}
            >
              Confirm & Audit Change
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete confirmation dialog */}
      <ConfirmDialog
        isOpen={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={handleDelete}
        title="Delete Short Link"
        message={`Are you sure you want to delete /${link.shortCode}? Traffic to this short code will return 404.`}
        confirmLabel="Delete Permanently"
        isDestructive
      />
    </div>
  );
}
