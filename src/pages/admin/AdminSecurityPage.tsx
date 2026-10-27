import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Ban,
  History,
  Activity,
  Plus,
  Trash2,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  Search,
  ExternalLink,
  Info,
} from 'lucide-react';
import { adminApi, trustCenterApi } from '../../lib/api';
import { BlocklistEntry, AbuseReport } from '../../types';
import { DestinationGuardian, DestinationChangeRecord } from '../../lib/security/destinationGuardian';
import { AnomalyWatch, TrafficAnomalyAlert } from '../../lib/analytics/anomalyWatch';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Input } from '../../components/ui/Input';
import { useToastStore } from '../../store/useToastStore';

export function AdminSecurityPage() {
  const { success, error: toastError } = useToastStore();
  const [activeTab, setActiveTab] = useState<'abuse' | 'blocklist' | 'destinations' | 'anomalies'>('abuse');

  // Abuse Reports State
  const [abuseReports, setAbuseReports] = useState<AbuseReport[]>([]);
  // Blocklist State
  const [blocklist, setBlocklist] = useState<BlocklistEntry[]>([]);
  const [newDomain, setNewDomain] = useState('');
  const [newReason, setNewReason] = useState('');
  const [isAddingBlock, setIsAddingBlock] = useState(false);
  // Destination Changes State
  const [destChanges, setDestChanges] = useState<DestinationChangeRecord[]>([]);
  // Anomaly Alerts State
  const [anomalyAlerts, setAnomalyAlerts] = useState<TrafficAnomalyAlert[]>([]);

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadSecurityData();
  }, []);

  async function loadSecurityData() {
    setIsLoading(true);
    try {
      const [reports, blocks] = await Promise.all([
        adminApi.getAbuseReports(),
        adminApi.getBlocklist(),
      ]);
      setAbuseReports(reports);
      setBlocklist(blocks);
      setDestChanges(DestinationGuardian.getChangeHistory());
      setAnomalyAlerts(AnomalyWatch.getAlerts());
    } catch (e: any) {
      toastError('Failed to load security state', e.message);
    } finally {
      setIsLoading(false);
    }
  }

  // Abuse actions
  async function handleResolveAbuse(id: string, resolution: 'resolved' | 'dismissed', action?: 'disable_link') {
    try {
      await adminApi.resolveAbuseReport(id, resolution, action);
      success(`Report ${resolution}${action ? ' & link disabled' : ''}`);
      const updated = await adminApi.getAbuseReports();
      setAbuseReports(updated);
    } catch (err: any) {
      toastError('Action Failed', err.message);
    }
  }

  // Blocklist actions
  async function handleAddDomain(e: React.FormEvent) {
    e.preventDefault();
    if (!newDomain.trim()) return;
    setIsAddingBlock(true);
    try {
      await adminApi.addToBlocklist(newDomain.trim(), newReason.trim() || 'Manual administrative policy');
      success(`Domain "${newDomain.trim()}" added to blocklist`);
      setNewDomain('');
      setNewReason('');
      const updated = await adminApi.getBlocklist();
      setBlocklist(updated);
    } catch (err: any) {
      toastError('Failed to block domain', err.message);
    } finally {
      setIsAddingBlock(false);
    }
  }

  async function handleRemoveDomain(id: string) {
    try {
      await adminApi.removeFromBlocklist(id);
      success('Domain removed from blocklist');
      const updated = await adminApi.getBlocklist();
      setBlocklist(updated);
    } catch (err: any) {
      toastError('Failed to remove domain', err.message);
    }
  }

  // Destination Guardian actions
  function handleDestinationAction(changeId: string, status: 'approved' | 'paused') {
    DestinationGuardian.updateChangeStatus(changeId, status, 'Admin User');
    setDestChanges(DestinationGuardian.getChangeHistory());
    success(`Destination change marked as ${status}`);
  }

  // Anomaly actions
  function handleAnomalyStatus(alertId: string, status: 'acknowledged' | 'dismissed') {
    const updated = AnomalyWatch.updateAlertStatus(alertId, status);
    setAnomalyAlerts(updated);
    success(`Anomaly alert ${status}`);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-white">
              Platform Security & Safety Hub
            </h1>
            <Badge variant="warning" size="sm">Admin Preview</Badge>
          </div>
          <p className="text-xs text-slate-400 mt-1 font-body">
            Centralized suspicious-link queue, domain blocklist enforcement, destination alteration audits, and velocity anomaly detection.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={loadSecurityData}
          className="border-slate-700 text-slate-300 hover:bg-slate-800 text-xs shrink-0 self-start sm:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5 mr-1" />
          <span>Refresh Records</span>
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-800 overflow-x-auto text-xs">
        <button
          onClick={() => setActiveTab('abuse')}
          className={`px-4 py-3 font-semibold border-b-2 flex items-center gap-2 whitespace-nowrap cursor-pointer transition-colors ${
            activeTab === 'abuse'
              ? 'border-amber-400 text-amber-300 bg-slate-800/40'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <ShieldAlert className="w-4 h-4" />
          <span>Suspicious Links Queue</span>
          <span className="px-1.5 py-0.2 rounded-full bg-slate-800 text-[10px] font-mono">
            {abuseReports.filter((r) => r.status === 'pending').length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('blocklist')}
          className={`px-4 py-3 font-semibold border-b-2 flex items-center gap-2 whitespace-nowrap cursor-pointer transition-colors ${
            activeTab === 'blocklist'
              ? 'border-amber-400 text-amber-300 bg-slate-800/40'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <Ban className="w-4 h-4" />
          <span>Blocklist Management</span>
          <span className="px-1.5 py-0.2 rounded-full bg-slate-800 text-[10px] font-mono">
            {blocklist.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('destinations')}
          className={`px-4 py-3 font-semibold border-b-2 flex items-center gap-2 whitespace-nowrap cursor-pointer transition-colors ${
            activeTab === 'destinations'
              ? 'border-amber-400 text-amber-300 bg-slate-800/40'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <History className="w-4 h-4" />
          <span>Destination Guardian</span>
          <span className="px-1.5 py-0.2 rounded-full bg-slate-800 text-[10px] font-mono">
            {destChanges.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('anomalies')}
          className={`px-4 py-3 font-semibold border-b-2 flex items-center gap-2 whitespace-nowrap cursor-pointer transition-colors ${
            activeTab === 'anomalies'
              ? 'border-amber-400 text-amber-300 bg-slate-800/40'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>Traffic Anomaly Watch</span>
          <span className="px-1.5 py-0.2 rounded-full bg-slate-800 text-[10px] font-mono">
            {anomalyAlerts.filter((a) => a.status === 'active').length}
          </span>
        </button>
      </div>

      {/* Tab 1: Suspicious Links / Abuse Reports Queue */}
      {activeTab === 'abuse' && (
        <Card className="p-6 space-y-4 border-slate-800 bg-slate-950 text-slate-100">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-white">Reported & Suspicious Links</h2>
              <p className="text-xs text-slate-400">Review reported links and enforce manual suspension</p>
            </div>
          </div>

          {abuseReports.length === 0 ? (
            <div className="text-center py-10 space-y-2 border border-dashed border-slate-800 rounded-xl">
              <ShieldAlert className="w-8 h-8 text-slate-600 mx-auto" />
              <p className="text-xs text-slate-400 font-medium">No abuse reports in queue.</p>
              <p className="text-[11px] text-slate-500">All short link traffic currently meets safety heuristics.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-800">
              {abuseReports.map((report) => (
                <div key={report.id} className="py-4 space-y-2 text-xs">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-white text-sm">
                        /r/{report.shortCode}
                      </span>
                      <Badge
                        variant={
                          report.status === 'pending'
                            ? 'warning'
                            : report.status === 'resolved'
                            ? 'success'
                            : 'outline'
                        }
                        size="sm"
                      >
                        {report.status}
                      </Badge>
                      <span className="text-[11px] text-slate-500">
                        Reported {new Date(report.reportedAt).toLocaleDateString()}
                      </span>
                    </div>

                    {report.status === 'pending' && (
                      <div className="flex items-center gap-2">
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => handleResolveAbuse(report.id, 'resolved', 'disable_link')}
                          className="text-xs min-h-[32px]"
                        >
                          Disable Link & Resolve
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleResolveAbuse(report.id, 'dismissed')}
                          className="text-xs border-slate-700 text-slate-300 min-h-[32px]"
                        >
                          Dismiss
                        </Button>
                      </div>
                    )}
                  </div>

                  <p className="font-mono text-slate-400 text-[11px] truncate max-w-xl">
                    Target: {report.originalUrl || 'N/A'}
                  </p>
                  <p className="text-amber-200/90 text-[11px] bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                    <strong>Report details:</strong> {report.reason}
                  </p>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* Tab 2: Blocklist Management */}
      {activeTab === 'blocklist' && (
        <div className="space-y-6">
          <Card className="p-6 space-y-4 border-slate-800 bg-slate-950 text-slate-100">
            <h2 className="text-base font-semibold text-white">Add Domain to Safety Blocklist</h2>
            <form onSubmit={handleAddDomain} className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
              <div className="sm:col-span-5 space-y-1">
                <label className="text-xs text-slate-400">Target Hostname / Domain</label>
                <input
                  type="text"
                  required
                  placeholder="malicious-domain.xyz"
                  value={newDomain}
                  onChange={(e) => setNewDomain(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:ring-1 focus:ring-amber-400"
                />
              </div>
              <div className="sm:col-span-5 space-y-1">
                <label className="text-xs text-slate-400">Block Policy Reason</label>
                <input
                  type="text"
                  placeholder="Phishing credential harvesting or malware"
                  value={newReason}
                  onChange={(e) => setNewReason(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:ring-1 focus:ring-amber-400"
                />
              </div>
              <div className="sm:col-span-2">
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  isLoading={isAddingBlock}
                  className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold min-h-[38px] text-xs"
                >
                  <Plus className="w-3.5 h-3.5 mr-1" />
                  <span>Block</span>
                </Button>
              </div>
            </form>
          </Card>

          <Card className="p-6 space-y-4 border-slate-800 bg-slate-950 text-slate-100">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-white">Configured Blocklist ({blocklist.length})</h2>
              <span className="text-xs text-slate-500">Evaluated deterministically on every redirect</span>
            </div>

            {blocklist.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">No domains currently blocklisted.</p>
            ) : (
              <div className="divide-y divide-slate-800">
                {blocklist.map((entry) => (
                  <div key={entry.id} className="py-3 flex items-center justify-between text-xs">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-rose-400">{entry.domain}</span>
                        <span className="text-[10px] text-slate-500 font-mono">
                          Added {new Date(entry.addedAt || Date.now()).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-slate-400 text-[11px]">{entry.reason}</p>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemoveDomain(entry.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-slate-900 cursor-pointer"
                      title="Remove from blocklist"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      )}

      {/* Tab 3: Destination Change Guardian */}
      {activeTab === 'destinations' && (
        <Card className="p-6 space-y-4 border-slate-800 bg-slate-950 text-slate-100">
          <div>
            <h2 className="text-base font-semibold text-white">Destination Alteration Audit Log</h2>
            <p className="text-xs text-slate-400">
              Audit baseline destination changes made to short links to detect silent redirection swaps.
            </p>
          </div>

          {destChanges.length === 0 ? (
            <div className="text-center py-10 space-y-2 border border-dashed border-slate-800 rounded-xl">
              <History className="w-8 h-8 text-slate-600 mx-auto" />
              <p className="text-xs text-slate-400 font-medium">No destination modifications recorded.</p>
              <p className="text-[11px] text-slate-500">Changes made to short link destinations will appear here for review.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-800">
              {destChanges.map((change) => (
                <div key={change.id} className="py-4 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-white">/{change.shortCode}</span>
                      <Badge
                        variant={
                          change.status === 'approved'
                            ? 'success'
                            : change.status === 'paused'
                            ? 'danger'
                            : 'warning'
                        }
                        size="sm"
                      >
                        {change.status}
                      </Badge>
                      <span className="text-[11px] text-slate-500">
                        {new Date(change.timestamp).toLocaleString()}
                      </span>
                    </div>

                    {change.status === 'pending_review' && (
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDestinationAction(change.id, 'approved')}
                          className="text-xs text-emerald-400 border-emerald-800 hover:bg-emerald-950"
                        >
                          Approve
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => handleDestinationAction(change.id, 'paused')}
                          className="text-xs"
                        >
                          Pause Link
                        </Button>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] font-mono">
                    <div className="p-2 rounded bg-slate-900 border border-slate-800">
                      <span className="text-slate-500 block">Previous Target:</span>
                      <span className="text-slate-300 truncate block">{change.oldUrl}</span>
                    </div>
                    <div className="p-2 rounded bg-slate-900 border border-slate-800">
                      <span className="text-amber-400 block">Proposed New Target:</span>
                      <span className="text-white truncate block">{change.newUrl}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* Tab 4: Traffic Anomaly Watch */}
      {activeTab === 'anomalies' && (
        <Card className="p-6 space-y-4 border-slate-800 bg-slate-950 text-slate-100">
          <div>
            <h2 className="text-base font-semibold text-white">Click Velocity & Anomaly Review</h2>
            <p className="text-xs text-slate-400">
              Deterministic detection of click velocity spikes (&gt;10 clicks/min) and rapid replay bursts.
            </p>
          </div>

          {anomalyAlerts.length === 0 ? (
            <div className="text-center py-10 space-y-2 border border-dashed border-slate-800 rounded-xl">
              <Activity className="w-8 h-8 text-slate-600 mx-auto" />
              <p className="text-xs text-slate-400 font-medium">No anomalous velocity spikes detected.</p>
              <p className="text-[11px] text-slate-500">Click streams are within normal velocity bounds.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-800">
              {anomalyAlerts.map((alert) => (
                <div key={alert.id} className="py-4 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={alert.severity === 'critical' ? 'danger' : 'warning'}
                        size="sm"
                      >
                        {alert.severity}
                      </Badge>
                      <span className="font-semibold text-white">{alert.title}</span>
                      <span className="text-[11px] text-slate-500 font-mono">
                        {new Date(alert.detectedAt).toLocaleTimeString()}
                      </span>
                    </div>

                    {alert.status === 'active' && (
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleAnomalyStatus(alert.id, 'acknowledged')}
                          className="text-xs border-slate-700 text-slate-300 hover:bg-slate-800"
                        >
                          Acknowledge
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleAnomalyStatus(alert.id, 'dismissed')}
                          className="text-xs border-slate-700 text-slate-300 hover:bg-slate-800"
                        >
                          Dismiss
                        </Button>
                      </div>
                    )}
                  </div>

                  <p className="text-slate-300 text-[11px] leading-relaxed">
                    {alert.reason}
                  </p>
                  <div className="flex items-center gap-3 text-[10px] text-slate-400 font-mono">
                    <span>Observed Metric: <strong>{alert.metric}</strong></span>
                    <span>·</span>
                    <span>Link: /{alert.shortCode}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
