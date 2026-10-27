import React, { useState, useEffect } from 'react';
import { AlertTriangle, Shield, CheckCircle2, Ban, ExternalLink, XCircle } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { useToastStore } from '../../store/useToastStore';
import { adminApi } from '../../lib/api';
import { AbuseReport } from '../../types';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { TableRowSkeleton } from '../../components/ui/Skeleton';

export function AdminAbusePage() {
  const { user } = useAuthStore();
  const { success, error: toastError } = useToastStore();

  const [reports, setReports] = useState<AbuseReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadReports() {
      setIsLoading(true);
      try {
        const data = await adminApi.getAbuseReports();
        setReports(data);
      } catch {
        toastError('Failed to load abuse reports');
      } finally {
        setIsLoading(false);
      }
    }
    loadReports();
  }, []);

  async function handleAction(reportId: string, status: 'resolved' | 'dismissed', action?: 'disable_link') {
    try {
      await adminApi.resolveAbuseReport(reportId, status, action);
      setReports((prev) =>
        prev.map((r) => (r.id === reportId ? { ...r, status } : r))
      );
      success(action === 'disable_link' ? 'Link disabled and quarantined' : 'Report dismissed');
    } catch {
      toastError('Failed to process report action');
    }
  }



  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          Abuse Monitoring Queue
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Triage community reports and automated anomaly detection flags for deceptive or malicious redirects
        </p>
      </div>

      <Card className="p-0 overflow-hidden">
        {isLoading ? (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {Array.from({ length: 4 }).map((_, i) => (
              <TableRowSkeleton key={i} />
            ))}
          </div>
        ) : reports.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400 space-y-2">
            <CheckCircle2 className="w-8 h-8 text-neutral-900 dark:text-neutral-100 mx-auto" />
            <p>Queue is empty! No open abuse reports or pending flags.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Short Code</th>
                  <th className="py-3 px-4">Destination Target</th>
                  <th className="py-3 px-4">Reported Rationale</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4 text-right">Moderator Decisions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {reports.map((report) => (
                  <tr key={report.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="py-3 px-4">
                      <Badge
                        variant={
                          report.status === 'pending'
                            ? 'warning'
                            : report.status === 'resolved'
                            ? 'danger'
                            : 'default'
                        }
                        size="sm"
                      >
                        {report.status}
                      </Badge>
                    </td>

                    <td className="py-3 px-4 font-mono font-bold text-neutral-900 dark:text-neutral-100">
                      /{report.shortCode}
                    </td>

                    <td className="py-3 px-4 font-mono text-[11px] text-slate-500 max-w-xs truncate">
                      {report.targetUrl}
                    </td>

                    <td className="py-3 px-4 text-slate-700 dark:text-slate-300 max-w-sm">
                      <p className="truncate">{report.reason}</p>
                      {report.reporterEmail && (
                        <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                          Reported by: {report.reporterEmail}
                        </p>
                      )}
                    </td>

                    <td className="py-3 px-4 font-mono text-[11px] text-slate-400 whitespace-nowrap">
                      {new Date(report.reportedAt).toLocaleDateString()}
                    </td>

                    <td className="py-3 px-4 text-right">
                      {report.status === 'pending' ? (
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => handleAction(report.id, 'resolved', 'disable_link')}
                            className="text-xs h-7 px-2"
                          >
                            <Ban className="w-3.5 h-3.5 mr-1" />
                            <span>Disable Link</span>
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleAction(report.id, 'dismissed')}
                            className="text-xs h-7 px-2"
                          >
                            <span>Dismiss</span>
                          </Button>
                        </div>
                      ) : (
                        <span className="text-slate-400 font-mono text-[11px]">Completed</span>
                      )}
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
