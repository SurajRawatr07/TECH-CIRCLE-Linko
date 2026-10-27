import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Shield,
  Users,
  Link2,
  MousePointerClick,
  AlertTriangle,
  Ban,
  Activity,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { adminApi, linksApi } from '../../lib/api';
import { Link as LinkType } from '../../types';
import { formatCompactNumber } from '../../lib/utils';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Skeleton } from '../../components/ui/Skeleton';

export function AdminOverviewPage() {
  const { user } = useAuthStore();
  const [stats, setStats] = useState<{
    totalUsers: number;
    totalLinks: number;
    totalClicks: number;
    activeLinks: number;
    flaggedLinks: number;
    blockedDomainsCount: number;
  } | null>(null);

  const [flaggedLinks, setFlaggedLinks] = useState<LinkType[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadAdminData() {
      setIsLoading(true);
      try {
        const [statData, allLinks] = await Promise.all([
          adminApi.getPlatformStats(),
          linksApi.getLinks(),
        ]);
        setStats(statData);
        setFlaggedLinks(allLinks.filter((l: LinkType) => l.abuseStatus !== 'clean').slice(0, 5));
      } catch (err) {
        console.error('Failed to load admin stats', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadAdminData();
  }, []);



  if (isLoading || !stats) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-60" />
        <div className="grid grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Platform Governance Console
            </h1>
            <Badge variant="danger" size="sm">Admin Mode</Badge>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            System-wide traffic volumes, security invariant monitoring, and domain moderation
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link to="/admin/abuse">
            <Button variant="outline" size="sm" className="text-xs">
              <AlertTriangle className="w-3.5 h-3.5 mr-1 text-amber-500" />
              <span>Abuse Queue</span>
            </Button>
          </Link>
          <Link to="/admin/blocklist">
            <Button variant="outline" size="sm" className="text-xs">
              <Ban className="w-3.5 h-3.5 mr-1 text-rose-500" />
              <span>Safety Blocklist</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 space-y-1">
          <span className="text-xs text-slate-500">Platform Accounts</span>
          <p className="text-2xl font-bold font-mono text-slate-900 dark:text-white">
            {stats.totalUsers}
          </p>
          <span className="text-[11px] text-neutral-900 dark:text-neutral-100 font-semibold">Enterprise & Creator</span>
        </Card>

        <Card className="p-4 space-y-1">
          <span className="text-xs text-slate-500">Total System Links</span>
          <p className="text-2xl font-bold font-mono text-slate-900 dark:text-white">
            {stats.totalLinks}
          </p>
          <span className="text-[11px] text-neutral-900 dark:text-neutral-100 font-semibold">
            {stats.activeLinks} active ({Math.round((stats.activeLinks / stats.totalLinks) * 100)}%)
          </span>
        </Card>

        <Card className="p-4 space-y-1">
          <span className="text-xs text-slate-500">Total Redirect Events</span>
          <p className="text-2xl font-bold font-mono text-slate-900 dark:text-white">
            {formatCompactNumber(stats.totalClicks)}
          </p>
          <span className="text-[11px] text-slate-500 font-mono">Last 90 days aggregated</span>
        </Card>

        <Card className="p-4 space-y-1">
          <span className="text-xs text-slate-500">Security Flags</span>
          <p className="text-2xl font-bold font-mono text-rose-600">
            {stats.flaggedLinks}
          </p>
          <span className="text-[11px] text-slate-500">
            {stats.blockedDomainsCount} blocked domains active
          </span>
        </Card>
      </div>

      {/* Flagged / Abusive Links Widget */}
      <Card className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              <span>Flagged & Moderated Links</span>
            </h3>
            <p className="text-xs text-slate-500">Links currently flagged or disabled for review</p>
          </div>
          <Link to="/admin/links">
            <Button variant="ghost" size="sm" className="text-xs">
              <span>View all links</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          </Link>
        </div>

        {flaggedLinks.length === 0 ? (
          <p className="text-xs text-slate-400 py-4 text-center">No links currently flagged.</p>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {flaggedLinks.map((item) => (
              <div key={item.id} className="py-3 flex items-center justify-between text-xs">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-slate-900 dark:text-white">
                      /{item.shortCode}
                    </span>
                    <Badge variant={item.abuseStatus === 'disabled' ? 'danger' : 'warning'} size="sm">
                      {item.abuseStatus}
                    </Badge>
                  </div>
                  <p className="text-slate-500 font-mono text-[11px] truncate max-w-md mt-0.5">
                    {item.originalUrl}
                  </p>
                  {item.abuseReason && (
                    <p className="text-[11px] text-rose-600 mt-0.5">
                      Reason: {item.abuseReason}
                    </p>
                  )}
                </div>

                <Link to={`/app/links/${item.id}`}>
                  <Button variant="outline" size="sm" className="text-xs">
                    Inspect
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
