import React, { useState, useEffect } from 'react';
import {
  History,
  CheckCircle2,
  AlertTriangle,
  Pause,
  ExternalLink,
  ArrowRight,
  ShieldAlert,
  Search,
  Filter,
} from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { DestinationGuardian, DestinationChangeRecord } from '../../lib/security/destinationGuardian';
import { useToastStore } from '../../store/useToastStore';
import { LocalStore } from '../../lib/api/localStore';

export function AdminDestinationAlertsPage() {
  const { success, error: toastError } = useToastStore();
  const [changes, setChanges] = useState<DestinationChangeRecord[]>([]);
  const [filter, setFilter] = useState<'all' | 'pending_review' | 'approved' | 'paused'>('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadChanges();
  }, []);

  function loadChanges() {
    const list = DestinationGuardian.getChangeHistory();
    // If no changes exist yet, populate an illustrative demonstration record if needed
    if (list.length === 0) {
      const demoRecord: DestinationChangeRecord = {
        id: 'dchg_demo_1',
        linkId: 'lnk_sample_dest',
        shortCode: 'launch26',
        linkTitle: 'Q4 Product Launch Portal',
        oldUrl: 'https://myshop.com/products/original-v1',
        newUrl: 'https://myshop.com/products/revised-v2-promo',
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        status: 'pending_review',
      };
      DestinationGuardian.saveChangeHistory([demoRecord]);
      setChanges([demoRecord]);
    } else {
      setChanges(list);
    }
  }

  function handleStatusUpdate(changeId: string, status: 'approved' | 'paused') {
    const updated = DestinationGuardian.updateChangeStatus(changeId, status, 'Admin Console Preview');
    if (updated) {
      if (status === 'paused') {
        // Also pause the link in local store
        try {
          const links = LocalStore.getLinks();
          const target = links.find((l) => l.id === updated.linkId);
          if (target) {
            target.isActive = false;
            LocalStore.saveLinks(links);
          }
        } catch {}
      }
      success(`Destination change marked as ${status}`);
      loadChanges();
    }
  }

  const filtered = changes.filter((c) => {
    if (filter !== 'all' && c.status !== filter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        c.shortCode.toLowerCase().includes(q) ||
        c.linkTitle.toLowerCase().includes(q) ||
        c.oldUrl.toLowerCase().includes(q) ||
        c.newUrl.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold font-display text-white flex items-center gap-2.5">
            <History className="w-6 h-6 text-amber-400" />
            <span>Destination-Change Guardian Review</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Audit and moderate destination URL modifications made across local links to prevent redirect hijacking.
          </p>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4 bg-slate-800/80 border-slate-700">
          <span className="text-xs text-slate-400">Total Changes Tracked</span>
          <p className="text-2xl font-bold font-mono text-white mt-1">{changes.length}</p>
        </Card>
        <Card className="p-4 bg-slate-800/80 border-slate-700">
          <span className="text-xs text-amber-400">Pending Review</span>
          <p className="text-2xl font-bold font-mono text-amber-300 mt-1">
            {changes.filter((c) => c.status === 'pending_review').length}
          </p>
        </Card>
        <Card className="p-4 bg-slate-800/80 border-slate-700">
          <span className="text-xs text-emerald-400">Approved Changes</span>
          <p className="text-2xl font-bold font-mono text-emerald-300 mt-1">
            {changes.filter((c) => c.status === 'approved').length}
          </p>
        </Card>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Search by code, title, or destination..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-slate-800 border border-slate-700 text-white placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-amber-400"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
        </div>
        <div className="flex items-center gap-1.5 bg-slate-800 p-1 rounded-xl border border-slate-700 text-xs">
          {(['all', 'pending_review', 'approved', 'paused'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setFilter(st)}
              className={`px-3 py-1.5 rounded-lg capitalize transition-colors ${
                filter === st
                  ? 'bg-amber-500 text-slate-950 font-semibold'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              {st.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Change List */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <Card className="p-8 text-center bg-slate-800/40 border-slate-700">
            <History className="w-8 h-8 text-slate-500 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-300">No destination changes found</p>
            <p className="text-xs text-slate-500 mt-1">
              Changes will appear here whenever a user edits a short link's original destination.
            </p>
          </Card>
        ) : (
          filtered.map((item) => (
            <Card key={item.id} className="p-5 bg-slate-800/80 border-slate-700 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-bold text-amber-300">
                      /r/{item.shortCode}
                    </span>
                    <span className="text-xs text-slate-200 font-medium">· {item.linkTitle}</span>
                    <Badge
                      variant={
                        item.status === 'approved'
                          ? 'success'
                          : item.status === 'paused'
                          ? 'danger'
                          : 'warning'
                      }
                      size="sm"
                    >
                      {item.status.replace('_', ' ')}
                    </Badge>
                  </div>
                  <span className="text-[11px] text-slate-400">
                    Modified on {new Date(item.timestamp).toLocaleString()}
                  </span>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  {item.status === 'pending_review' && (
                    <>
                      <Button
                        size="sm"
                        onClick={() => handleStatusUpdate(item.id, 'approved')}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs gap-1"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Approve</span>
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleStatusUpdate(item.id, 'paused')}
                        className="border-rose-500/50 text-rose-300 hover:bg-rose-500/10 text-xs gap-1"
                      >
                        <Pause className="w-3.5 h-3.5" />
                        <span>Pause Link</span>
                      </Button>
                    </>
                  )}
                  {item.status === 'paused' && (
                    <Button
                      size="sm"
                      onClick={() => handleStatusUpdate(item.id, 'approved')}
                      className="bg-emerald-600 text-white text-xs"
                    >
                      Re-Approve Link
                    </Button>
                  )}
                </div>
              </div>

              {/* Old vs New Destination Diff */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-mono">
                <div className="p-3 rounded-lg bg-rose-950/30 border border-rose-900/50 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-rose-400">Previous Destination</span>
                  <p className="text-rose-200 truncate">{item.oldUrl}</p>
                </div>
                <div className="p-3 rounded-lg bg-emerald-950/30 border border-emerald-900/50 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-emerald-400">New Destination</span>
                  <p className="text-emerald-200 truncate">{item.newUrl}</p>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
