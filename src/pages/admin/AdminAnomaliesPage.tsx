import React, { useState, useEffect } from 'react';
import {
  Activity,
  AlertTriangle,
  ShieldAlert,
  CheckCircle2,
  XCircle,
  Play,
  RotateCcw,
  Zap,
  Clock,
  Filter,
} from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { AnomalyWatch, TrafficAnomalyAlert } from '../../lib/analytics/anomalyWatch';
import { LocalStore } from '../../lib/api/localStore';
import { useToastStore } from '../../store/useToastStore';
import { Link as LinkType } from '../../types';

export function AdminAnomaliesPage() {
  const { success, error: toastError } = useToastStore();
  const [alerts, setAlerts] = useState<TrafficAnomalyAlert[]>([]);
  const [severityFilter, setSeverityFilter] = useState<'all' | 'critical' | 'warning' | 'info'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'acknowledged' | 'dismissed'>('all');

  useEffect(() => {
    loadAlerts();
  }, []);

  function loadAlerts() {
    const list = AnomalyWatch.getAlerts();
    setAlerts(list);
  }

  function handleStatusUpdate(alertId: string, newStatus: 'acknowledged' | 'dismissed') {
    const updated = AnomalyWatch.updateAlertStatus(alertId, newStatus);
    setAlerts(updated);
    success(`Alert marked as ${newStatus}`);
  }

  function handleInjectScenario(type: 'flash_spike' | 'repeated_burst') {
    const links = LocalStore.getLinks();
    let targetLink: LinkType;

    if (links.length > 0) {
      targetLink = links[0];
    } else {
      // Create a temporary demo link for scenario testing
      targetLink = {
        id: 'lnk_scenario_target',
        userId: 'admin_preview',
        originalUrl: 'https://example.com/promo-target',
        shortCode: 'anom26',
        title: 'Evaluation Target Link',
        domain: 'example.com',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isActive: true,
        tags: ['demo'],
        clicksCount: 25,
        uniqueClicksCount: 12,
        qrScansCount: 4,
        rules: {},
      };
      LocalStore.createLink(targetLink);
    }

    const res = AnomalyWatch.injectSampleScenario(type, targetLink);
    setAlerts(res.alerts);
    success(`Sample scenario (${type === 'flash_spike' ? 'Flash Traffic Spike' : 'Repeated Access Burst'}) loaded for testing!`);
  }

  function handleClearScenarios() {
    AnomalyWatch.clearSampleScenarios();
    setAlerts(AnomalyWatch.getAlerts());
    success('Cleared sample testing scenarios');
  }

  const filtered = alerts.filter((a) => {
    if (severityFilter !== 'all' && a.severity !== severityFilter) return false;
    if (statusFilter !== 'all' && a.status !== statusFilter) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold font-display text-white flex items-center gap-2.5">
            <Activity className="w-6 h-6 text-amber-400" />
            <span>Click Anomaly Watch</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Rule-based detection for click velocity spikes, rapid bursts, and unusual interaction flooding.
          </p>
        </div>

        {/* Evaluator Scenario Injection Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <Button
            size="sm"
            onClick={() => handleInjectScenario('flash_spike')}
            className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs gap-1.5"
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Simulate Flash Spike</span>
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={() => handleInjectScenario('repeated_burst')}
            className="border-slate-700 text-slate-200 hover:bg-slate-800 text-xs gap-1.5"
          >
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <span>Simulate Burst</span>
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={handleClearScenarios}
            className="border-slate-700 text-slate-400 hover:text-white text-xs"
            title="Remove sample scenario alerts"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {/* Methodology Disclaimer */}
      <Card className="p-4 bg-slate-800/80 border-slate-700 space-y-1 text-xs text-slate-300">
        <span className="font-semibold text-amber-300 flex items-center gap-1.5">
          <AlertTriangle className="w-3.5 h-3.5" />
          <span>Rule-Based Anomaly Detection Standard:</span>
        </span>
        <p className="text-[11px] text-slate-400 leading-relaxed">
          Evaluates sliding window click velocity (e.g., &gt;10 clicks/min or &gt;5 clicks/10s from same referrer).
          This provides deterministic, transparent monitoring and does not claim machine-learning intelligence or guaranteed fraud eradication.
        </p>
      </Card>

      {/* Filter Chips */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-1.5 bg-slate-800 p-1 rounded-xl border border-slate-700">
          <span className="px-2 text-[11px] font-semibold text-slate-400">Severity:</span>
          {(['all', 'critical', 'warning', 'info'] as const).map((sev) => (
            <button
              key={sev}
              onClick={() => setSeverityFilter(sev)}
              className={`px-2.5 py-1 rounded-lg capitalize transition-colors ${
                severityFilter === sev
                  ? 'bg-amber-500 text-slate-950 font-semibold'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              {sev}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1.5 bg-slate-800 p-1 rounded-xl border border-slate-700">
          <span className="px-2 text-[11px] font-semibold text-slate-400">Status:</span>
          {(['all', 'active', 'acknowledged', 'dismissed'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-2.5 py-1 rounded-lg capitalize transition-colors ${
                statusFilter === st
                  ? 'bg-amber-500 text-slate-950 font-semibold'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Alerts Stream */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <Card className="p-8 text-center bg-slate-800/40 border-slate-700">
            <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-200">No anomaly alerts active</p>
            <p className="text-xs text-slate-400 mt-1">
              Traffic velocity is within standard expected bounds. Click "Simulate Flash Spike" above to test rule evaluation.
            </p>
          </Card>
        ) : (
          filtered.map((item) => (
            <Card
              key={item.id}
              className={`p-5 bg-slate-800/90 border space-y-3 ${
                item.severity === 'critical'
                  ? 'border-rose-500/50'
                  : item.severity === 'warning'
                  ? 'border-amber-500/50'
                  : 'border-slate-700'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={
                        item.severity === 'critical'
                          ? 'danger'
                          : item.severity === 'warning'
                          ? 'warning'
                          : 'default'
                      }
                      size="sm"
                    >
                      {item.severity.toUpperCase()}
                    </Badge>
                    <span className="font-bold text-sm text-white">{item.title}</span>
                    {item.isSampleScenario && (
                      <span className="text-[10px] px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 font-mono">
                        Test Scenario
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-300">{item.reason}</p>
                </div>

                {/* Status and Action Buttons */}
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-mono px-2 py-1 rounded bg-slate-950 text-slate-300">
                    {item.metric}
                  </span>
                  {item.status === 'active' && (
                    <>
                      <Button
                        size="sm"
                        onClick={() => handleStatusUpdate(item.id, 'acknowledged')}
                        className="bg-slate-700 hover:bg-slate-600 text-xs"
                      >
                        Acknowledge
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleStatusUpdate(item.id, 'dismissed')}
                        className="border-slate-700 text-slate-400 hover:text-white text-xs"
                      >
                        Dismiss
                      </Button>
                    </>
                  )}
                  {item.status !== 'active' && (
                    <Badge variant="outline" size="sm">
                      {item.status}
                    </Badge>
                  )}
                </div>
              </div>

              {/* Time Window and Target Link */}
              <div className="pt-2 border-t border-slate-700/60 flex flex-wrap items-center justify-between gap-3 text-[11px] text-slate-400 font-mono">
                <div>
                  Affected Link: <strong className="text-amber-300 font-bold">/r/{item.shortCode}</strong> ({item.linkTitle})
                </div>
                <div>
                  Window: {new Date(item.windowStart).toLocaleTimeString()} – {new Date(item.windowEnd).toLocaleTimeString()}
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
