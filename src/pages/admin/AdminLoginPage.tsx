import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Shield,
  Lock,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  KeyRound,
  Info,
  ServerOff,
  Eye,
  EyeOff,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card } from '../../components/ui/Card';

export function AdminLoginPage() {
  const navigate = useNavigate();

  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [attemptMessage, setAttemptMessage] = useState<string | null>(null);

  function handleAttemptSubmit(e: React.FormEvent) {
    e.preventDefault();
    setAttemptMessage(
      'Notice: Server-side administrator authentication is offline in this frontend-only build. ' +
      'No credentials can be authorized as a genuine production administrator until the backend is integrated.'
    );
  }

  function handleEnterPreview() {
    navigate('/admin/overview');
  }

  return (
    <div className="min-h-[85vh] flex items-center justify-center p-4">
      <Card className="max-w-lg w-full p-6 sm:p-8 space-y-6 border-slate-700 bg-slate-900 text-slate-100 shadow-xl">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto shadow-inner">
            <Shield className="w-6 h-6 stroke-[2.2]" />
          </div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-400/10 text-amber-300 border border-amber-400/20">
            Administrative Portal
          </div>
          <h1 className="text-xl sm:text-2xl font-bold font-display text-white">
            Linko Governance & Safety
          </h1>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Administrative monitoring, blocklist management, destination guardian, and policy configuration.
          </p>
        </div>

        {/* Clear Non-Production Disclosure Box */}
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs space-y-2 leading-relaxed">
          <div className="flex items-center gap-2 font-bold text-amber-300">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>Frontend-Only Architecture Notice</span>
          </div>
          <p>
            Secure administrator authentication and role enforcement are <strong>NOT configured</strong> in this frontend-only phase.
            In compliance with strict security requirements:
          </p>
          <ul className="list-disc list-inside space-y-1 text-[11px] text-amber-200/90 pl-1">
            <li>No default or preloaded administrator credentials exist.</li>
            <li>No public admin account registration is provided.</li>
            <li>Client-side checks are not represented as genuine production authorization.</li>
            <li>The future backend will provide verified server-side authentication and role-based access control (RBAC).</li>
          </ul>
        </div>

        {/* Attempt Form with Informative Disabled Response */}
        <form onSubmit={handleAttemptSubmit} className="space-y-4 pt-1">
          <Input
            label="Administrative Email"
            type="email"
            value={emailInput}
            onChange={(e) => setEmailInput(e.target.value)}
            placeholder="admin@enterprise-domain.com"
            autoComplete="email"
            helperText="Server-side credential verification is offline"
            className="bg-slate-950 border-slate-700 text-white"
          />

          <Input
            label="Security Passkey / Password"
            type={showPassword ? 'text' : 'password'}
            value={passwordInput}
            onChange={(e) => setPasswordInput(e.target.value)}
            placeholder="••••••••••••"
            autoComplete="current-password"
            className="bg-slate-950 border-slate-700 text-white"
            rightIcon={
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-slate-400 hover:text-white cursor-pointer"
                aria-label="Toggle password visibility"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            }
          />

          {attemptMessage && (
            <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2">
              <ServerOff className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
              <span>{attemptMessage}</span>
            </div>
          )}

          <Button
            type="submit"
            variant="outline"
            className="w-full text-xs font-semibold border-slate-700 text-slate-300 hover:bg-slate-800"
          >
            Attempt Sign In (Authenticates with Server)
          </Button>
        </form>

        {/* Explicit Non-Production UI Preview Button */}
        <div className="pt-2 border-t border-slate-800 space-y-3">
          <div className="space-y-1">
            <span className="text-[11px] font-semibold text-slate-300 block">
              Demonstration & Evaluation Access:
            </span>
            <p className="text-[11px] text-slate-400">
              To inspect the administrative safety UI, blocklist manager, and audit logs during frontend testing, launch the designated UI preview:
            </p>
          </div>

          <button
            type="button"
            onClick={handleEnterPreview}
            className="w-full py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-sm"
          >
            <Shield className="w-4 h-4" />
            <span>Explore Admin UI Preview (Non-production UI Demonstration)</span>
            <ArrowRight className="w-4 h-4 ml-1" />
          </button>

          <div className="text-center pt-2">
            <Link
              to="/login"
              className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Return to Standard User Sign In</span>
            </Link>
          </div>
        </div>
      </Card>
    </div>
  );
}
