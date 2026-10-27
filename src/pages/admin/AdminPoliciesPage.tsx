import React, { useState, useEffect } from 'react';
import {
  Sliders,
  Shield,
  Clock,
  Ban,
  CheckCircle2,
  Save,
  RotateCcw,
  AlertTriangle,
} from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { useToastStore } from '../../store/useToastStore';

interface SystemPolicies {
  defaultExpiryDays: number;
  maxClickLimit: number;
  blocklistEnforcement: 'strict_block' | 'warning_interstitial';
  guestHourlyLimit: number;
  riskRadarSensitivity: 'strict' | 'standard' | 'relaxed';
  requireHttpsOnly: boolean;
}

const STORAGE_KEY = 'lp_system_policies';

const DEFAULT_POLICIES: SystemPolicies = {
  defaultExpiryDays: 90,
  maxClickLimit: 10000,
  blocklistEnforcement: 'strict_block',
  guestHourlyLimit: 3,
  riskRadarSensitivity: 'standard',
  requireHttpsOnly: false,
};

export function AdminPoliciesPage() {
  const { success } = useToastStore();
  const [policies, setPolicies] = useState<SystemPolicies>(DEFAULT_POLICIES);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        setPolicies(JSON.parse(raw));
      }
    } catch {}
  }, []);

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(policies));
      success('Platform governance policies saved to local configuration.');
    } catch {
      console.warn('Failed to save policies to storage');
    }
  }

  function handleReset() {
    setPolicies(DEFAULT_POLICIES);
    localStorage.removeItem(STORAGE_KEY);
    success('Reset policies to factory defaults');
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold font-display text-white flex items-center gap-2.5">
          <Sliders className="w-6 h-6 text-amber-400" />
          <span>Policy Configuration Interface</span>
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Configure platform redirect limits, domain safety rules, and heuristic sensitivity parameters.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Policy Section 1: Link Lifecycle & Limits */}
        <Card className="p-6 bg-slate-800/80 border-slate-700 space-y-4">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-400" />
            <span>Link Lifecycle & Quota Standards</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="space-y-1.5">
              <label className="font-semibold text-slate-300">Default Expiry Duration</label>
              <select
                value={policies.defaultExpiryDays}
                onChange={(e) =>
                  setPolicies({ ...policies, defaultExpiryDays: parseInt(e.target.value) })
                }
                className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:ring-1 focus:ring-amber-400"
              >
                <option value={30}>30 Days</option>
                <option value={60}>60 Days</option>
                <option value={90}>90 Days (Recommended)</option>
                <option value={180}>180 Days</option>
                <option value={365}>1 Year</option>
              </select>
              <span className="text-[11px] text-slate-400">
                Suggested expiration window when users schedule automated link deprecation.
              </span>
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-slate-300">Maximum Click Quota Limit</label>
              <select
                value={policies.maxClickLimit}
                onChange={(e) =>
                  setPolicies({ ...policies, maxClickLimit: parseInt(e.target.value) })
                }
                className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:ring-1 focus:ring-amber-400"
              >
                <option value={1000}>1,000 clicks</option>
                <option value={5000}>5,000 clicks</option>
                <option value={10000}>10,000 clicks</option>
                <option value={50000}>50,000 clicks</option>
                <option value={100000}>100,000 clicks</option>
              </select>
              <span className="text-[11px] text-slate-400">
                Upper bound for single-link click limits.
              </span>
            </div>
          </div>
        </Card>

        {/* Policy Section 2: Security & Blocklist Enforcement */}
        <Card className="p-6 bg-slate-800/80 border-slate-700 space-y-4">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <Shield className="w-4 h-4 text-amber-400" />
            <span>Safety & Blocklist Enforcement Mode</span>
          </h2>

          <div className="space-y-4 text-xs">
            <div className="space-y-1.5">
              <label className="font-semibold text-slate-300">Blocklist Intercept Behavior</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <label
                  className={`p-3.5 rounded-xl border flex items-start gap-3 cursor-pointer transition-colors ${
                    policies.blocklistEnforcement === 'strict_block'
                      ? 'bg-amber-500/10 border-amber-500 text-white'
                      : 'bg-slate-900 border-slate-700 text-slate-300 hover:border-slate-600'
                  }`}
                >
                  <input
                    type="radio"
                    name="blocklistEnforcement"
                    value="strict_block"
                    checked={policies.blocklistEnforcement === 'strict_block'}
                    onChange={() =>
                      setPolicies({ ...policies, blocklistEnforcement: 'strict_block' })
                    }
                    className="mt-0.5 accent-amber-500"
                  />
                  <div>
                    <span className="font-bold text-sm block">Strict Intercept & Block</span>
                    <span className="text-[11px] text-slate-400 leading-tight block mt-0.5">
                      Completely halts redirect execution and displays an active security block alert screen.
                    </span>
                  </div>
                </label>

                <label
                  className={`p-3.5 rounded-xl border flex items-start gap-3 cursor-pointer transition-colors ${
                    policies.blocklistEnforcement === 'warning_interstitial'
                      ? 'bg-amber-500/10 border-amber-500 text-white'
                      : 'bg-slate-900 border-slate-700 text-slate-300 hover:border-slate-600'
                  }`}
                >
                  <input
                    type="radio"
                    name="blocklistEnforcement"
                    value="warning_interstitial"
                    checked={policies.blocklistEnforcement === 'warning_interstitial'}
                    onChange={() =>
                      setPolicies({ ...policies, blocklistEnforcement: 'warning_interstitial' })
                    }
                    className="mt-0.5 accent-amber-500"
                  />
                  <div>
                    <span className="font-bold text-sm block">Warning Interstitial</span>
                    <span className="text-[11px] text-slate-400 leading-tight block mt-0.5">
                      Warns the visitor of threat signals but offers an explicit bypass link to continue.
                    </span>
                  </div>
                </label>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-700">
              <label className="flex items-center gap-3 cursor-pointer text-slate-200">
                <input
                  type="checkbox"
                  checked={policies.requireHttpsOnly}
                  onChange={(e) =>
                    setPolicies({ ...policies, requireHttpsOnly: e.target.checked })
                  }
                  className="w-4 h-4 accent-amber-500 rounded"
                />
                <div>
                  <span className="font-semibold text-xs block">Enforce Strict HTTPS Protocol Only</span>
                  <span className="text-[11px] text-slate-400 block">
                    Reject creation of links pointing to insecure unencrypted http:// destinations.
                  </span>
                </div>
              </label>
            </div>
          </div>
        </Card>

        {/* Action Controls */}
        <div className="flex items-center justify-between pt-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleReset}
            className="border-slate-700 text-slate-400 hover:text-white text-xs gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset to Factory Defaults</span>
          </Button>

          <Button
            type="submit"
            size="sm"
            className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs gap-1.5"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save Governance Policies</span>
          </Button>
        </div>
      </form>
    </div>
  );
}
