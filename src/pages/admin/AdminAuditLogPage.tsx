import React, { useState, useEffect } from 'react';
import {
  ScrollText,
  Search,
  Filter,
  Shield,
  Ban,
  History,
  Activity,
  Sliders,
  CheckCircle2,
} from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';

export interface AuditEvent {
  id: string;
  category: 'security' | 'blocklist' | 'moderation' | 'policy' | 'system';
  action: string;
  actor: string;
  target: string;
  details: string;
  timestamp: string;
  outcome: 'success' | 'warning' | 'blocked';
}

const STORAGE_KEY = 'lp_audit_events';

export function AdminAuditLogPage() {
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadEvents();
  }, []);

  function loadEvents() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        setEvents(JSON.parse(raw));
        return;
      }
    } catch {}

    // Initial baseline demonstration events
    const initial: AuditEvent[] = [
      {
        id: 'aud_1',
        category: 'security',
        action: 'BLOCKLIST_DOMAIN_ADDED',
        actor: 'Admin Console Preview',
        target: 'phishing-target.xyz',
        details: 'Domain added to security blocklist under heuristic phishing threat classification.',
        timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
        outcome: 'success',
      },
      {
        id: 'aud_2',
        category: 'moderation',
        action: 'ABUSE_REPORT_RESOLVED',
        actor: 'Admin Console Preview',
        target: 'lnk_sample_dest',
        details: 'Reviewed and confirmed clean destination structure for community flagged link.',
        timestamp: new Date(Date.now() - 3600000 * 5).toISOString(),
        outcome: 'success',
      },
      {
        id: 'aud_3',
        category: 'policy',
        action: 'DEFAULT_EXPIRY_UPDATED',
        actor: 'Admin Console Preview',
        target: 'Global Policy Settings',
        details: 'Set standard public link maximum expiration duration to 90 days.',
        timestamp: new Date(Date.now() - 3600000 * 12).toISOString(),
        outcome: 'success',
      },
      {
        id: 'aud_4',
        category: 'security',
        action: 'REDIRECT_POLICY_BLOCKED',
        actor: 'Redirect Engine',
        target: '/r/phish-test',
        details: 'Blocked attempt to resolve link pointing to domain on security blocklist.',
        timestamp: new Date(Date.now() - 3600000 * 24).toISOString(),
        outcome: 'blocked',
      },
    ];

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
    } catch {}
    setEvents(initial);
  }

  const filtered = events.filter((e) => {
    if (categoryFilter !== 'all' && e.category !== categoryFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        e.action.toLowerCase().includes(q) ||
        e.actor.toLowerCase().includes(q) ||
        e.target.toLowerCase().includes(q) ||
        e.details.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold font-display text-white flex items-center gap-2.5">
          <ScrollText className="w-6 h-6 text-amber-400" />
          <span>Audit-Event Viewer</span>
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Chronological record of security events, administrative adjustments, and policy enforcement triggers.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Search audit trail by action, actor, or target..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-slate-800 border border-slate-700 text-white placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-amber-400"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
        </div>

        <div className="flex items-center gap-1.5 bg-slate-800 p-1 rounded-xl border border-slate-700 text-xs">
          {(['all', 'security', 'blocklist', 'moderation', 'policy'] as const).map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1.5 rounded-lg capitalize transition-colors ${
                categoryFilter === cat
                  ? 'bg-amber-500 text-slate-950 font-semibold'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Audit Log Table */}
      <Card className="p-0 overflow-hidden bg-slate-800/80 border-slate-700">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-700 bg-slate-900/60 text-slate-400 font-semibold">
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">Actor</th>
                <th className="py-3 px-4">Target</th>
                <th className="py-3 px-4">Details</th>
                <th className="py-3 px-4">Outcome</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/60 font-mono">
              {filtered.map((item) => (
                <tr key={item.id} className="hover:bg-slate-700/30 transition-colors">
                  <td className="py-3 px-4 text-slate-400 whitespace-nowrap text-[11px]">
                    {new Date(item.timestamp).toLocaleString()}
                  </td>
                  <td className="py-3 px-4 capitalize font-sans">
                    <Badge variant="outline" size="sm">
                      {item.category}
                    </Badge>
                  </td>
                  <td className="py-3 px-4 font-bold text-amber-300 whitespace-nowrap">
                    {item.action}
                  </td>
                  <td className="py-3 px-4 text-slate-300 font-sans">{item.actor}</td>
                  <td className="py-3 px-4 text-white max-w-xs truncate">{item.target}</td>
                  <td className="py-3 px-4 text-slate-400 font-sans max-w-sm">
                    {item.details}
                  </td>
                  <td className="py-3 px-4 font-sans">
                    <Badge
                      variant={
                        item.outcome === 'success'
                          ? 'success'
                          : item.outcome === 'blocked'
                          ? 'danger'
                          : 'warning'
                      }
                      size="sm"
                    >
                      {item.outcome}
                    </Badge>
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
