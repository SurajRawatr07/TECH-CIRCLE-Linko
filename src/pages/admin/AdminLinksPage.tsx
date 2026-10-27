import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Shield, Power, Search, AlertCircle, ExternalLink, Trash2 } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { useToastStore } from '../../store/useToastStore';
import { adminApi, linksApi } from '../../lib/api';
import { Link as LinkType } from '../../types';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Badge } from '../../components/ui/Badge';
import { formatCompactNumber } from '../../lib/utils';
import { TableRowSkeleton } from '../../components/ui/Skeleton';

export function AdminLinksPage() {
  const { user } = useAuthStore();
  const { success, error: toastError } = useToastStore();

  const [links, setLinks] = useState<LinkType[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'clean' | 'flagged' | 'disabled'>('all');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadAllLinks() {
      setIsLoading(true);
      try {
        const data = await adminApi.getAllLinks();
        setLinks(data);
      } catch {
        toastError('Failed to fetch platform links');
      } finally {
        setIsLoading(false);
      }
    }
    loadAllLinks();
  }, []);

  async function handleToggleAbuseStatus(link: LinkType) {
    const nextStatus = link.abuseStatus === 'disabled' ? 'clean' : 'disabled';
    const nextActive = nextStatus === 'clean';
    try {
      const updated = await linksApi.updateLink(link.id, {
        abuseStatus: nextStatus,
        isActive: nextActive,
        abuseReason: nextStatus === 'disabled' ? 'Disabled by Admin' : undefined,
      });
      setLinks((prev) => prev.map((l) => (l.id === link.id ? updated : l)));
      success(`Link marked as ${nextStatus}`);
    } catch {
      toastError('Failed to update status');
    }
  }

  const filteredLinks = useMemo(() => {
    return links.filter((l) => {
      const matchSearch =
        !search.trim() ||
        l.shortCode.toLowerCase().includes(search.toLowerCase()) ||
        l.title.toLowerCase().includes(search.toLowerCase()) ||
        l.originalUrl.toLowerCase().includes(search.toLowerCase()) ||
        (l.userEmail && l.userEmail.toLowerCase().includes(search.toLowerCase()));

      const matchStatus = statusFilter === 'all' || l.abuseStatus === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [links, search, statusFilter]);



  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            System Links & Moderation
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Audit all user-generated short links, inspect safety flags, and quarantine malicious destinations
          </p>
        </div>
      </div>

      <Card className="p-4 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="sm:col-span-2">
            <Input
              placeholder="Search by code, destination URL, or user email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              leftIcon={<Search className="w-4 h-4" />}
            />
          </div>
          <div>
            <Select
              options={[
                { value: 'all', label: 'All Moderation States' },
                { value: 'clean', label: 'Clean' },
                { value: 'flagged', label: 'Flagged for Review' },
                { value: 'disabled', label: 'Disabled / Quarantined' },
              ]}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
            />
          </div>
        </div>
      </Card>

      <Card className="p-0 overflow-hidden">
        {isLoading ? (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {Array.from({ length: 6 }).map((_, i) => (
              <TableRowSkeleton key={i} />
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-3 px-4">Link & Code</th>
                  <th className="py-3 px-4">Owner</th>
                  <th className="py-3 px-4">Destination</th>
                  <th className="py-3 px-4 text-right">Clicks</th>
                  <th className="py-3 px-4">Abuse Status</th>
                  <th className="py-3 px-4 text-right">Moderation Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredLinks.map((link) => (
                  <tr key={link.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="py-3 px-4 font-mono font-medium">
                      <Link
                        to={`/app/links/${link.id}`}
                        className="text-neutral-900 dark:text-white font-semibold hover:underline"
                      >
                        /{link.shortCode}
                      </Link>
                      <p className="text-[11px] font-sans text-slate-500 truncate max-w-xs">
                        {link.title}
                      </p>
                    </td>

                    <td className="py-3 px-4 text-slate-600 dark:text-slate-400 font-mono text-[11px]">
                      {link.userEmail || link.userName || link.userId}
                    </td>

                    <td className="py-3 px-4 font-mono text-[11px] text-slate-500 max-w-xs truncate">
                      {link.originalUrl}
                    </td>

                    <td className="py-3 px-4 text-right font-mono font-bold tabular-nums">
                      {formatCompactNumber(link.clicksCount)}
                    </td>

                    <td className="py-3 px-4">
                      <Badge
                        variant={
                          link.abuseStatus === 'disabled'
                            ? 'danger'
                            : link.abuseStatus === 'flagged'
                            ? 'warning'
                            : 'success'
                        }
                        size="sm"
                      >
                        {link.abuseStatus}
                      </Badge>
                    </td>

                    <td className="py-3 px-4 text-right">
                      <Button
                        variant={link.abuseStatus === 'disabled' ? 'outline' : 'danger'}
                        size="sm"
                        onClick={() => handleToggleAbuseStatus(link)}
                        className="text-xs h-7.5 px-2.5"
                      >
                        <Power className="w-3.5 h-3.5 mr-1" />
                        <span>{link.abuseStatus === 'disabled' ? 'Re-enable' : 'Disable'}</span>
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
