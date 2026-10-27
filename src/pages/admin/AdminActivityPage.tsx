import React, { useState, useEffect } from 'react';
import {
  ScrollText,
  Clock,
  Shield,
  Sliders,
  RefreshCw,
  ExternalLink,
  Info,
} from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { LocalStore } from '../../lib/api/localStore';

interface AuditEntry {
  id: string;
  action: string;
  targetType: string;
  targetId: string;
  timestamp: string;
  performedBy: string;
  details: string;
}

export function AdminActivityPage() {
  const [auditEntries, setAuditEntries] = useState<AuditEntry[]>([]);
  const [activeTab, setActiveTab] = useState<'audit' | 'policies'>('audit');

  useEffect(() => {
    loadActivity();
  }, []);

  function loadActivity() {
    // Collect local activity entries
    const links = LocalStore.getLinks();
    const generated: AuditEntry[] = [];

    links.forEach((l) => {
      generated.push({
        id: `aud_create_${l.id}`,
        action: 'LINK_CREATED',
        targetType: 'Link',
        targetId: `/${l.shortCode}`,
        timestamp: l.createdAt,
        performedBy: l.userId === 'guest_session' ? 'Guest Visitor' : 'Workspace User',
        details: `Created redirect to "${l.originalUrl}"`,
      });

      if (!l.isActive) {
        generated.push({
          id: `aud_paused_${l.id}`,
          action: 'LINK_PAUSED',
          targetType: 'Link',
          targetId: `/${l.shortCode}`,
          timestamp: l.updatedAt || l.createdAt,
          performedBy: 'Link Owner',
          details: 'Routing paused under manual lifecycle setting.',
        });
      }
    });

    // Sort by timestamp descending
    generated.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    setAuditEntries(generated);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-white">
              Platform Activity & Audit History
            </h1>
            <Badge variant="warning" size="sm">Admin Preview</Badge>
          </div>
          <p className="text-xs text-slate-400 mt-1 font-body">
            Complete event log of link creation, lifecycle toggles, and administrative policy configurations.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={loadActivity}
          className="border-slate-700 text-slate-300 hover:bg-slate-800 text-xs shrink-0 self-start sm:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5 mr-1" />
          <span>Refresh Log</span>
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-800 text-xs">
        <button
          onClick={() => setActiveTab('audit')}
          className={`px-4 py-3 font-semibold border-b-2 flex items-center gap-2 whitespace-nowrap cursor-pointer transition-colors ${
            activeTab === 'audit'
              ? 'border-amber-400 text-amber-300 bg-slate-800/40'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <ScrollText className="w-4 h-4" />
          <span>Event Audit Trail</span>
          <span className="px-1.5 py-0.2 rounded-full bg-slate-800 text-[10px] font-mono">
            {auditEntries.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('policies')}
          className={`px-4 py-3 font-semibold border-b-2 flex items-center gap-2 whitespace-nowrap cursor-pointer transition-colors ${
            activeTab === 'policies'
              ? 'border-amber-400 text-amber-300 bg-slate-800/40'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>Active Policy Configuration</span>
        </button>
      </div>

      {/* Audit Trail Tab */}
      {activeTab === 'audit' && (
        <Card className="p-6 space-y-4 border-slate-800 bg-slate-950 text-slate-100">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-white">System Activity Stream</h2>
            <span className="text-xs text-slate-400 font-mono">
              {auditEntries.length} recorded events
            </span>
          </div>

          {auditEntries.length === 0 ? (
            <div className="text-center py-12 space-y-2 border border-dashed border-slate-800 rounded-xl">
              <ScrollText className="w-8 h-8 text-slate-600 mx-auto" />
              <p className="text-xs text-slate-400 font-medium">No audit entries recorded yet.</p>
              <p className="text-[11px] text-slate-500">Shortening links or modifying policies will generate audit events here.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-800">
              {auditEntries.map((entry) => (
                <div key={entry.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-amber-400">
                        {entry.action}
                      </span>
                      <span className="font-mono text-white font-semibold">
                        {entry.targetId}
                      </span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">
                        {entry.performedBy}
                      </span>
                    </div>
                    <p className="text-slate-400 text-[11px]">{entry.details}</p>
                  </div>

                  <span className="text-[11px] text-slate-500 font-mono shrink-0">
                    {new Date(entry.timestamp).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* Policies Tab */}
      {activeTab === 'policies' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="p-6 space-y-3 border-slate-800 bg-slate-950 text-slate-100">
            <div className="flex items-center gap-2 text-white font-semibold text-sm">
              <Shield className="w-4 h-4 text-amber-400" />
              <span>Link Risk Radar Policies</span>
            </div>
            <ul className="space-y-2 text-xs text-slate-400 font-body">
              <li className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                <span>Blocklist Matching</span>
                <Badge variant="danger" size="sm">Strict (Deny Redirect)</Badge>
              </li>
              <li className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                <span>Raw IPv4 / IPv6 Destinations</span>
                <Badge variant="warning" size="sm">Flag for Review (+45 Risk)</Badge>
              </li>
              <li className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                <span>High-Risk Suspicious TLDs</span>
                <Badge variant="warning" size="sm">Caution Flag (+20 Risk)</Badge>
              </li>
              <li className="flex items-center justify-between pt-1">
                <span>Unencrypted HTTP Protocol</span>
                <Badge variant="outline" size="sm">Warning (+25 Risk)</Badge>
              </li>
            </ul>
          </Card>

          <Card className="p-6 space-y-3 border-slate-800 bg-slate-950 text-slate-100">
            <div className="flex items-center gap-2 text-white font-semibold text-sm">
              <Sliders className="w-4 h-4 text-amber-400" />
              <span>Redirect Simulator Invariants</span>
            </div>
            <ul className="space-y-2 text-xs text-slate-400 font-body">
              <li className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                <span>Exceeded Click Limits</span>
                <span className="font-mono text-slate-300">HTTP 410 / Limit Reached</span>
              </li>
              <li className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                <span>Expired Timestamps</span>
                <span className="font-mono text-slate-300">HTTP 410 / Link Expired</span>
              </li>
              <li className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                <span>Paused by Owner / Admin</span>
                <span className="font-mono text-slate-300">HTTP 403 / Disabled</span>
              </li>
              <li className="flex items-center justify-between pt-1">
                <span>Password Guard</span>
                <span className="font-mono text-slate-300">Challenge / 401 Unauthorized</span>
              </li>
            </ul>
          </Card>
        </div>
      )}
    </div>
  );
}
