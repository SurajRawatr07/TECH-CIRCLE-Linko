import React, { useEffect, useState, useRef } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import {
  Link2,
  Ban,
  ShieldAlert,
  Clock,
  AlertTriangle,
  Lock,
  ExternalLink,
  CheckCircle2,
  ArrowRight,
  Shield,
  Smartphone,
  Eye,
  EyeOff,
  RotateCcw,
} from 'lucide-react';
import { linksApi, clicksApi, adminApi } from '../lib/api';
import { evaluateRedirectRules, RedirectEvaluationResult } from '../lib/utils';
import { analyzeUrlRisk, RiskReport } from '../lib/security/riskRadar';
import { Link as LinkType } from '../types';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { useToastStore } from '../store/useToastStore';

export function RedirectPage() {
  const { code } = useParams<{ code: string }>();
  const [searchParams] = useSearchParams();
  const { success, error: toastError } = useToastStore();

  const [evalResult, setEvalResult] = useState<RedirectEvaluationResult | null>(null);
  const [linkObj, setLinkObj] = useState<LinkType | null>(null);
  const [riskReport, setRiskReport] = useState<RiskReport | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Password verification
  const [passwordInput, setPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // Countdown & navigation state
  const [countdown, setCountdown] = useState(3);
  const [autoRedirectPaused, setAutoRedirectPaused] = useState(false);
  const clickLoggedRef = useRef(false);

  useEffect(() => {
    async function resolveRedirect() {
      if (!code) {
        setEvalResult({ status: 'not_found', message: 'No link code provided.' });
        setIsLoading(false);
        return;
      }

      try {
        const link = await linksApi.getLinkByCode(code);
        if (!link) {
          setEvalResult({ status: 'not_found', message: `Short code "/r/${code}" was not found in local browser storage.` });
          setIsLoading(false);
          return;
        }

        setLinkObj(link);

        // Analyze destination risk locally
        const risk = analyzeUrlRisk(link.originalUrl);
        setRiskReport(risk);

        // Fetch local blocklist
        const blocklistEntries = await adminApi.getBlocklist();
        const blocklistDomains = blocklistEntries.map((b) => b.domain);

        const passwordFromQuery = searchParams.get('p') || searchParams.get('password') || undefined;

        const result = evaluateRedirectRules(link, {
          passwordEntered: passwordFromQuery,
          blocklist: blocklistDomains,
        });

        setEvalResult(result);

        // Log click event locally if successful
        if (result.status === 'success' && !clickLoggedRef.current) {
          clickLoggedRef.current = true;
          try {
            await clicksApi.recordClick({
              linkId: link.id,
              referrer: document.referrer || 'Direct Simulation',
              source: 'direct',
            });
          } catch (e) {
            console.warn('Failed to record click event locally', e);
          }
        }
      } catch (err: any) {
        setEvalResult({ status: 'not_found', message: 'Error evaluating local link resolution.' });
      } finally {
        setIsLoading(false);
      }
    }

    resolveRedirect();
  }, [code, searchParams]);

  // Countdown timer for simulator
  useEffect(() => {
    if (evalResult?.status !== 'success' || autoRedirectPaused) return;

    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown, evalResult, autoRedirectPaused]);

  function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!linkObj) return;

    if (!passwordInput.trim()) {
      setPasswordError('Please enter a password');
      return;
    }

    if (passwordInput === linkObj.rules.password) {
      setPasswordError(null);
      setEvalResult({ status: 'success', destinationUrl: linkObj.originalUrl });

      if (!clickLoggedRef.current) {
        clickLoggedRef.current = true;
        clicksApi.recordClick({
          linkId: linkObj.id,
          referrer: 'Password Gate',
          source: 'direct',
        });
      }
    } else {
      setPasswordError('Incorrect password. Please try again.');
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white p-4">
        <div className="text-center space-y-3">
          <div className="w-9 h-9 border-2 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-mono text-slate-400">Evaluating local redirect policies for /{code}...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-slate-950 text-slate-100 font-sans">
      {/* Simulation Header Notice */}
      <div className="max-w-md w-full mb-4 p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-400 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-teal-400 shrink-0" />
          <span>In-App Redirect Simulator</span>
        </div>
        <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
          Frontend Prototype
        </span>
      </div>

      {/* Case 1: Code Not Found */}
      {evalResult?.status === 'not_found' && (
        <Card className="max-w-md w-full p-8 text-center space-y-5 bg-slate-900 border-slate-800">
          <div className="w-12 h-12 rounded-2xl bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
            <Link2 className="w-6 h-6 stroke-[1.8]" />
          </div>
          <div className="space-y-1">
            <h1 className="text-xl font-bold text-white">Link Not Found</h1>
            <p className="text-xs text-slate-400 font-mono">
              The short code "/r/{code}" does not exist in local browser storage.
            </p>
          </div>
          <div className="p-3 bg-slate-950 rounded-xl text-xs text-slate-400 text-left space-y-1 leading-relaxed">
            <span className="font-semibold text-slate-200 block">Why did this happen?</span>
            <p>
              In frontend-only mode, short links are stored in this browser session. If this link was created in a different browser,
              window, or cleared session, it must be created again.
            </p>
          </div>
          <div className="pt-2 flex flex-col sm:flex-row gap-2">
            <Link to="/guest" className="flex-1">
              <Button variant="outline" size="sm" className="w-full text-xs">
                Create Guest Link
              </Button>
            </Link>
            <Link to="/" className="flex-1">
              <Button size="sm" className="w-full text-xs bg-amber-500 text-slate-950 font-bold hover:bg-amber-400">
                Return Home
              </Button>
            </Link>
          </div>
        </Card>
      )}

      {/* Case 2: Link Disabled */}
      {evalResult?.status === 'disabled' && (
        <Card className="max-w-md w-full p-8 text-center space-y-4 bg-slate-900 border-amber-500/30">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center mx-auto">
            <Ban className="w-6 h-6 stroke-[2]" />
          </div>
          <h1 className="text-xl font-bold text-white">Link Temporarily Disabled</h1>
          <p className="text-xs text-slate-400">{evalResult.message}</p>
          <div className="pt-2">
            <Link to="/">
              <Button variant="outline" size="sm" className="w-full text-xs">
                Back to Home
              </Button>
            </Link>
          </div>
        </Card>
      )}

      {/* Case 3: Blocklisted Domain */}
      {evalResult?.status === 'blocklisted' && (
        <Card className="max-w-md w-full p-8 text-center space-y-4 bg-slate-900 border-rose-500/40">
          <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-400 flex items-center justify-center mx-auto">
            <ShieldAlert className="w-6 h-6 stroke-[2]" />
          </div>
          <h1 className="text-xl font-bold text-white">Blocked for Safety</h1>
          <div className="p-3 bg-rose-950/30 border border-rose-900/50 rounded-xl text-xs text-rose-200 text-left space-y-1">
            <span className="font-semibold block">Destination Quarantined:</span>
            <p className="font-mono text-[11px] text-rose-300 truncate">{evalResult.domain}</p>
            <p className="text-[11px] text-rose-400 mt-1">
              This domain is listed on the security blocklist. Redirection was halted to protect visitors from potential threats.
            </p>
          </div>
          <Link to="/">
            <Button variant="outline" size="sm" className="w-full text-xs border-slate-700">
              Leave Simulation
            </Button>
          </Link>
        </Card>
      )}

      {/* Case 4: Expired Link */}
      {evalResult?.status === 'expired' && (
        <Card className="max-w-md w-full p-8 text-center space-y-4 bg-slate-900 border-slate-800">
          <div className="w-12 h-12 rounded-2xl bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
            <Clock className="w-6 h-6 stroke-[2]" />
          </div>
          <h1 className="text-xl font-bold text-white">Link Expired</h1>
          <p className="text-xs text-slate-400">
            This short link has reached its configured expiration date and is no longer active.
          </p>
          <Link to="/">
            <Button variant="outline" size="sm" className="w-full text-xs">
              Return Home
            </Button>
          </Link>
        </Card>
      )}

      {/* Case 5: Click Limit Reached */}
      {evalResult?.status === 'limit_reached' && (
        <Card className="max-w-md w-full p-8 text-center space-y-4 bg-slate-900 border-slate-800">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center mx-auto">
            <AlertTriangle className="w-6 h-6 stroke-[2]" />
          </div>
          <h1 className="text-xl font-bold text-white">Visit Limit Reached</h1>
          <p className="text-xs text-slate-400">
            This short link has reached its allocated click quota.
          </p>
          <Link to="/">
            <Button variant="outline" size="sm" className="w-full text-xs">
              Return Home
            </Button>
          </Link>
        </Card>
      )}

      {/* Case 6: Password Challenge */}
      {(evalResult?.status === 'password_required' || evalResult?.status === 'password_invalid') && (
        <Card className="max-w-md w-full p-8 space-y-6 bg-slate-900 border-slate-800">
          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center mx-auto">
              <Lock className="w-6 h-6 stroke-[2]" />
            </div>
            <h1 className="text-xl font-bold text-white">Password Protected Link</h1>
            <p className="text-xs text-slate-400">
              The link creator has restricted access. Enter the access password to unlock destination.
            </p>
          </div>

          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <Input
              type={showPassword ? 'text' : 'password'}
              placeholder="Enter access password..."
              value={passwordInput}
              onChange={(e) => {
                setPasswordInput(e.target.value);
                setPasswordError(null);
              }}
              error={passwordError || undefined}
              autoFocus
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
            <Button type="submit" size="md" className="w-full text-xs font-bold bg-amber-500 text-slate-950 hover:bg-amber-400">
              Verify & Proceed
            </Button>
          </form>
        </Card>
      )}

      {/* Case 7: Success - Simulator Outcome Display */}
      {evalResult?.status === 'success' && evalResult.destinationUrl && (
        <Card className="max-w-lg w-full p-6 sm:p-8 space-y-6 bg-slate-900 border-slate-800 shadow-xl">
          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6 stroke-[2]" />
            </div>
            <h1 className="text-lg sm:text-xl font-bold text-white">
              Redirect Policy Evaluated Successfully
            </h1>
            <p className="text-xs text-slate-400 font-mono">
              Short code "/r/{code}" resolves to destination:
            </p>
          </div>

          {/* Destination Details Card */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
            <div className="space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-500">Destination URL</span>
              <a
                href={evalResult.destinationUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-mono text-amber-300 hover:underline break-all block"
              >
                {evalResult.destinationUrl}
              </a>
            </div>

            {/* Risk Radar Summary */}
            {riskReport && (
              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
                <span className="text-slate-400">Link Risk Radar:</span>
                <Badge
                  variant={
                    riskReport.level === 'high'
                      ? 'danger'
                      : riskReport.level === 'caution'
                      ? 'warning'
                      : 'success'
                  }
                  size="sm"
                >
                  {riskReport.level.toUpperCase()} RISK (Score: {100 - riskReport.score}/100)
                </Badge>
              </div>
            )}
          </div>

          {/* Simulator Countdown & Controls */}
          <div className="space-y-3 pt-1">
            <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
              <span>Simulation countdown:</span>
              <span className="font-bold text-white">
                {autoRedirectPaused ? 'Paused' : `${countdown}s remaining`}
              </span>
            </div>

            <div className="flex flex-col sm:flex-row gap-2.5">
              <a
                href={evalResult.destinationUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition-colors"
              >
                <span>Proceed to Destination</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setAutoRedirectPaused(!autoRedirectPaused)}
                className="border-slate-700 text-slate-300 hover:bg-slate-800 text-xs"
              >
                {autoRedirectPaused ? 'Resume Countdown' : 'Pause Simulation'}
              </Button>
            </div>
          </div>

          {/* Architecture Disclaimer */}
          <p className="text-[11px] text-slate-500 text-center leading-relaxed">
            Notice: LinkPulse is running in local demonstration mode. Short links resolve inside this browser session.
            Click events and analytics are recorded to local browser storage.
          </p>
        </Card>
      )}
    </div>
  );
}
