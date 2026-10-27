import React, { useState, useEffect } from 'react';
import {
  Settings as SettingsIcon,
  User,
  Key,
  Sun,
  Moon,
  Laptop,
  Shield,
  Copy,
  Check,
  Building,
  Database,
  Download,
  Trash2,
  HardDrive,
  Eye,
  Lock,
  AlertTriangle,
  RotateCcw,
} from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { useThemeStore } from '../store/useThemeStore';
import { useToastStore } from '../store/useToastStore';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import { LocalStore } from '../lib/api/localStore';

interface StorageKeyInspection {
  key: string;
  name: string;
  description: string;
  count: number;
  sizeBytes: number;
}

export function SettingsPage() {
  const { user, setUser } = useAuthStore();
  const { theme, setTheme } = useThemeStore();
  const { success, error: toastError } = useToastStore();

  const [workspaceName, setWorkspaceName] = useState(user?.workspaceName || 'My Workspace');

  // Privacy Controls State
  const [analyticsEnabled, setAnalyticsEnabled] = useState(true);
  const [retentionPeriod, setRetentionPeriod] = useState<'7d' | '30d' | '90d' | 'all'>('30d');
  const [storageItems, setStorageItems] = useState<StorageKeyInspection[]>([]);
  const [totalStorageBytes, setTotalStorageBytes] = useState(0);

  useEffect(() => {
    // Load privacy settings
    try {
      const storedAnalytics = localStorage.getItem('lp_privacy_analytics_enabled');
      if (storedAnalytics !== null) {
        setAnalyticsEnabled(storedAnalytics === 'true');
      }
      const storedRetention = localStorage.getItem('lp_privacy_retention_period');
      if (storedRetention) {
        setRetentionPeriod(storedRetention as any);
      }
    } catch {}

    inspectLocalStorage();
  }, []);

  function inspectLocalStorage() {
    if (typeof window === 'undefined') return;

    const inspected: StorageKeyInspection[] = [];
    let totalBytes = 0;

    const knownKeys: Record<string, { name: string; description: string }> = {
      lp_local_links: { name: 'Saved Links', description: 'User-created short link records, rules, and aliases' },
      lp_local_users: { name: 'Registered Users', description: 'Locally registered user profiles and salted password hashes' },
      lp_current_user: { name: 'Active Session', description: 'Current logged-in user profile in active session' },
      linkpulse_clicks_v2: { name: 'Click Events', description: 'Interaction event stream for analytics' },
      linkpulse_campaigns_v2: { name: 'Campaigns', description: 'Custom link campaign groupings and themes' },
      linkpulse_tags_v2: { name: 'Tags', description: 'User-assigned link categorization tags' },
      linkpulse_blocklist_v2: { name: 'Safety Blocklist', description: 'Security demonstration blocked domains' },
      lp_guest_creations: { name: 'Guest Creations', description: 'Timestamps for guest hourly limit enforcement' },
      lp_destination_changes: { name: 'Destination Guardian', description: 'Audit history of link destination modifications' },
      lp_anomaly_alerts: { name: 'Traffic Anomalies', description: 'Click velocity burst and rapid replay alerts' },
      lp_audit_events: { name: 'Audit Events', description: 'Administrative actions and security incident logs' },
      lp_system_policies: { name: 'System Policies', description: 'Governance configuration and rate limits' },
      linko_theme: { name: 'Theme Mode', description: 'Light or Dark mode UI preference' },
      linkpulse_theme: { name: 'Theme Mode', description: 'Legacy Light or Dark mode UI preference' },
    };

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.startsWith('lp_') || key.startsWith('linkpulse_') || key.startsWith('linko_'))) {
        const value = localStorage.getItem(key) || '';
        const sizeBytes = new Blob([key + value]).size;
        totalBytes += sizeBytes;

        let count = 1;
        try {
          const parsed = JSON.parse(value);
          if (Array.isArray(parsed)) count = parsed.length;
        } catch {}

        const meta = knownKeys[key] || {
          name: key,
          description: 'Linko configuration state',
        };

        inspected.push({
          key,
          name: meta.name,
          description: meta.description,
          count,
          sizeBytes,
        });
      }
    }

    setStorageItems(inspected);
    setTotalStorageBytes(totalBytes);
  }

  function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setUser({ ...user, workspaceName });
    success('Workspace settings updated');
  }

  function handleToggleAnalytics(enabled: boolean) {
    setAnalyticsEnabled(enabled);
    localStorage.setItem('lp_privacy_analytics_enabled', String(enabled));
    success(enabled ? 'Local analytics collection enabled' : 'Analytics collection disabled');
    inspectLocalStorage();
  }

  function handleRetentionChange(period: '7d' | '30d' | '90d' | 'all') {
    setRetentionPeriod(period);
    localStorage.setItem('lp_privacy_retention_period', period);
    success(`Data retention set to ${period === 'all' ? 'Indefinite' : period}`);
  }

  function handlePurgeRetention() {
    if (retentionPeriod === 'all') {
      success('Retention is set to All Time; no records were pruned.');
      return;
    }
    const daysMap = { '7d': 7, '30d': 30, '90d': 90 };
    const cutoff = Date.now() - daysMap[retentionPeriod] * 86400000;

    try {
      const rawClicks = localStorage.getItem('linkpulse_clicks_v2');
      if (rawClicks) {
        const clicks = JSON.parse(rawClicks);
        const retained = clicks.filter((c: any) => new Date(c.timestamp).getTime() >= cutoff);
        localStorage.setItem('linkpulse_clicks_v2', JSON.stringify(retained));
        success(`Purged ${clicks.length - retained.length} historical clicks older than ${retentionPeriod}`);
        inspectLocalStorage();
      }
    } catch {
      toastError('Failed to prune records');
    }
  }

  function handleClearActivity() {
    localStorage.removeItem('linkpulse_clicks_v2');
    localStorage.removeItem('lp_anomaly_alerts');
    success('Local activity records and click logs cleared');
    inspectLocalStorage();
  }

  function handleExportData() {
    const backup: Record<string, any> = {};
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && (k.startsWith('lp_') || k.startsWith('linkpulse_') || k.startsWith('linko_'))) {
        try {
          backup[k] = JSON.parse(localStorage.getItem(k) || '');
        } catch {
          backup[k] = localStorage.getItem(k);
        }
      }
    }

    const jsonString = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(backup, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', jsonString);
    downloadAnchor.setAttribute('download', `linko-local-data-${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    success('Local data exported as JSON');
  }

  const activeUser = user || {
    id: 'local_workspace_user',
    name: 'Local Workspace User',
    email: 'local@workspace.storage',
    role: 'user' as const,
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white">
          Settings & Privacy Controls
        </h1>
        <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
          Workspace profile, privacy preferences, local browser data retention, and storage inspection
        </p>
      </div>

      {/* Profile & Workspace */}
      <Card className="p-6 space-y-4">
        <h3 className="text-sm font-semibold text-neutral-900 dark:text-white border-b border-neutral-100 dark:border-neutral-800 pb-3 flex items-center gap-2">
          <User className="w-4 h-4 text-teal-600 dark:text-teal-400" />
          <span>User Profile & Workspace</span>
        </h3>

        <form onSubmit={handleSaveProfile} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Full Name" value={activeUser.name} disabled />
            <Input label="Email Address" value={activeUser.email} disabled />
          </div>

          <Input
            label="Workspace Name"
            value={workspaceName}
            onChange={(e) => setWorkspaceName(e.target.value)}
          />

          <Button type="submit" variant="primary" size="sm" className="min-h-[40px]">
            Save Workspace Settings
          </Button>
        </form>
      </Card>

      {/* Appearance Theme */}
      <Card className="p-6 space-y-4">
        <h3 className="text-sm font-semibold text-neutral-900 dark:text-white border-b border-neutral-100 dark:border-neutral-800 pb-3 flex items-center gap-2">
          <Sun className="w-4 h-4 text-amber-500" />
          <span>Interface Appearance</span>
        </h3>

        <div className="grid grid-cols-3 gap-3">
          {[
            { id: 'light', label: 'Light', icon: Sun },
            { id: 'dark', label: 'Dark', icon: Moon },
            { id: 'system', label: 'System', icon: Laptop },
          ].map((item) => {
            const Icon = item.icon;
            const isSelected = theme === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setTheme(item.id as any)}
                className={`flex flex-col items-center gap-2 p-3.5 rounded-xl border text-xs font-semibold cursor-pointer transition-colors ${
                  isSelected
                    ? 'bg-neutral-900 text-white border-neutral-900 dark:bg-white dark:text-neutral-900'
                    : 'bg-white dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300 border-neutral-200 dark:border-neutral-800 hover:border-neutral-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </Card>

      {/* SECTION 9: PRIVACY CONTROLS */}
      <Card className="p-6 space-y-6">
        <div>
          <h3 className="text-sm font-semibold text-neutral-900 dark:text-white flex items-center gap-2">
            <Shield className="w-4 h-4 text-teal-600 dark:text-teal-400" />
            <span>Privacy Controls & Data Retention</span>
          </h3>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
            Control local telemetry recording, configure retention pruning, and clear browser activity.
          </p>
        </div>

        {/* Analytics Toggle */}
        <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <div className="space-y-0.5 max-w-md">
            <span className="text-xs font-bold text-slate-900 dark:text-white block">
              Local Click Telemetry Collection
            </span>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 block">
              When enabled, interactions with short links record device type, browser family, and timestamp to your browser.
              No telemetry is sent to external servers.
            </span>
          </div>

          <button
            type="button"
            onClick={() => handleToggleAnalytics(!analyticsEnabled)}
            className={`w-12 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors ${
              analyticsEnabled ? 'bg-teal-600' : 'bg-slate-300 dark:bg-slate-700'
            }`}
            aria-label="Toggle analytics collection"
          >
            <div
              className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                analyticsEnabled ? 'translate-x-6' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Retention Window */}
        <div className="space-y-3">
          <label className="block text-xs font-semibold text-slate-800 dark:text-slate-200">
            Local Click Retention Duration
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {(['7d', '30d', '90d', 'all'] as const).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => handleRetentionChange(p)}
                className={`py-2 px-3 rounded-lg border text-xs font-semibold capitalize transition-colors ${
                  retentionPeriod === p
                    ? 'bg-teal-600 text-white border-teal-600'
                    : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-slate-300'
                }`}
              >
                {p === 'all' ? 'All Time' : p}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePurgeRetention}
              className="text-xs gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Purge Records Older Than {retentionPeriod === 'all' ? 'Policy' : retentionPeriod}</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={handleClearActivity}
              className="text-xs text-rose-600 border-rose-200 hover:bg-rose-50 dark:hover:bg-rose-950/40 gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear All Activity Records</span>
            </Button>
          </div>
        </div>

        {/* Data Export Action */}
        <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="text-xs">
            <span className="font-semibold text-slate-900 dark:text-white block">Export Local Application Data</span>
            <span className="text-[11px] text-slate-500">Download all your links, campaigns, tags, and settings as a clean JSON file.</span>
          </div>

          <Button
            size="sm"
            onClick={handleExportData}
            className="text-xs font-bold gap-1.5 bg-neutral-900 text-white hover:bg-black dark:bg-white dark:text-neutral-900"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Data (JSON)</span>
          </Button>
        </div>
      </Card>

      {/* Storage Review Table */}
      <Card className="p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-white flex items-center gap-2">
              <Database className="w-4 h-4 text-teal-600 dark:text-teal-400" />
              <span>Local Browser Storage Inspection</span>
            </h3>
            <p className="text-xs text-neutral-500 mt-0.5">
              Transparent breakdown of all keys and data structures stored in this browser.
            </p>
          </div>
          <Badge variant="outline" size="sm">
            Total Size: {(totalStorageBytes / 1024).toFixed(1)} KB
          </Badge>
        </div>

        {/* Honest Architecture Disclosure */}
        <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-900 dark:text-amber-200 space-y-1">
          <span className="font-bold flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            <span>Browser Storage Notice</span>
          </span>
          <p className="text-[11px] leading-relaxed">
            Data in this prototype is stored in your web browser's standard <code>localStorage</code>.
            It is not synchronized across different devices or browsers, and browser storage is not encrypted by default.
            Clearing browser history will reset these local items.
          </p>
        </div>

        <div className="overflow-x-auto border border-neutral-200 dark:border-neutral-800 rounded-xl">
          <table className="w-full text-left text-xs">
            <thead className="bg-neutral-50 dark:bg-neutral-800 text-neutral-500 font-semibold border-b border-neutral-200 dark:border-neutral-800">
              <tr>
                <th className="py-2.5 px-3">Storage Key</th>
                <th className="py-2.5 px-3">Category</th>
                <th className="py-2.5 px-3">Purpose</th>
                <th className="py-2.5 px-3 text-right">Records</th>
                <th className="py-2.5 px-3 text-right">Bytes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800 font-mono text-[11px]">
              {storageItems.map((item) => (
                <tr key={item.key} className="hover:bg-neutral-50/50 dark:hover:bg-neutral-800/40">
                  <td className="py-2 px-3 text-neutral-800 dark:text-neutral-200 font-bold whitespace-nowrap">
                    {item.key}
                  </td>
                  <td className="py-2 px-3 font-sans text-neutral-700 dark:text-neutral-300">
                    {item.name}
                  </td>
                  <td className="py-2 px-3 font-sans text-neutral-500 dark:text-neutral-400 max-w-xs truncate">
                    {item.description}
                  </td>
                  <td className="py-2 px-3 text-right text-neutral-700 dark:text-neutral-300">
                    {item.count}
                  </td>
                  <td className="py-2 px-3 text-right text-neutral-500 whitespace-nowrap">
                    {item.sizeBytes.toLocaleString()} B
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
