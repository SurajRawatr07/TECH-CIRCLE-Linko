import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Link2,
  Eye,
  EyeOff,
  ArrowRight,
  AlertCircle,
  Shield,
  ServerOff,
  ExternalLink,
  Compass,
} from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { useToastStore } from '../store/useToastStore';
import { EmailSchema } from '../lib/validators';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card } from '../components/ui/Card';
import { API_CONFIG } from '../config/api';

export function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuthStore();
  const { success, error: toastError } = useToastStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [errors, setErrors] = useState<{
    email?: string;
    password?: string;
    general?: string;
  }>({});

  const [isLoading, setIsLoading] = useState(false);
  const isBackendConnected = API_CONFIG.isBackendConnected;

  function validateEmailOnBlur() {
    const res = EmailSchema.safeParse(email);
    if (!res.success) {
      setErrors((prev) => ({ ...prev, email: res.error.issues[0].message }));
    } else {
      setErrors((prev) => {
        const next = { ...prev };
        delete next.email;
        return next;
      });
    }
  }

  function validatePasswordOnBlur() {
    if (!password) {
      setErrors((prev) => ({ ...prev, password: 'Password is required' }));
    } else {
      setErrors((prev) => {
        const next = { ...prev };
        delete next.password;
        return next;
      });
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});

    const emailRes = EmailSchema.safeParse(email);
    const passOk = Boolean(password && password.length >= 1);

    const validationMap: typeof errors = {};
    if (!emailRes.success) validationMap.email = emailRes.error.issues[0].message;
    if (!passOk) validationMap.password = 'Password is required';

    if (Object.keys(validationMap).length > 0) {
      setErrors(validationMap);
      return;
    }

    // In local mode: do not invent successful authentication or fake credentials
    if (!isBackendConnected) {
      setErrors({
        general:
          'Authentication backend is offline. Real account authentication and role-based access control (RBAC) require connecting the Fastify + PostgreSQL backend service (via VITE_API_BASE_URL). You can explore Linko via the Local Workspace or Admin Preview.',
      });
      return;
    }

    setIsLoading(true);
    try {
      const user = await login(email.trim().toLowerCase(), password);
      success(`Welcome back, ${user.name}`);
      // Redirect based on verified role from server
      if (user.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/app');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Invalid credentials or authentication failure.';
      setErrors({ general: msg });
      toastError('Login Failed', msg);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 sm:p-6 lg:p-8 bg-neutral-50 dark:bg-neutral-950">
      <Card className="max-w-md w-full p-6 sm:p-8 space-y-6 border-neutral-300 dark:border-neutral-800 shadow-md">
        {/* Brand Header */}
        <div>
          <Link to="/" className="inline-flex items-center gap-2 mb-4 group" aria-label="Linko Home">
            <div className="w-8 h-8 rounded-xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 flex items-center justify-center shadow-xs">
              <Link2 className="w-4.5 h-4.5 stroke-[2.4]" />
            </div>
            <span className="font-display text-lg font-bold text-neutral-900 dark:text-white">
              Linko
            </span>
          </Link>
          <h1 className="font-display text-2xl sm:text-3xl font-normal tracking-tight text-neutral-900 dark:text-white">
            Platform Login
          </h1>
          <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 mt-1 font-body">
            Single authentication entry point for users and platform administrators.
          </p>
        </div>

        {/* Backend Not Configured Notice */}
        {!isBackendConnected ? (
          <div className="p-4 rounded-xl bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 space-y-2 text-xs">
            <div className="flex items-center gap-1.5 font-semibold text-neutral-900 dark:text-white">
              <ServerOff className="w-4 h-4 text-neutral-600 dark:text-neutral-400" />
              <span>Backend Authentication Offline</span>
            </div>
            <p className="text-[11px] text-neutral-600 dark:text-neutral-400 leading-relaxed font-body">
              Linko is running in local frontend mode. Real account authentication, password hashing, and role verification require connecting the Fastify + PostgreSQL API.
            </p>
            <div className="pt-2 border-t border-neutral-200 dark:border-neutral-800 flex flex-col gap-1.5">
              <span className="text-[10px] font-semibold text-neutral-500 uppercase tracking-wider">
                Direct Evaluation Options:
              </span>
              <div className="grid grid-cols-2 gap-2 pt-0.5">
                <Link
                  to="/app"
                  className="px-2.5 py-1.5 rounded-lg bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 text-center font-semibold text-[11px] hover:opacity-90"
                >
                  Local Workspace →
                </Link>
                <Link
                  to="/admin"
                  className="px-2.5 py-1.5 rounded-lg border border-neutral-300 dark:border-neutral-700 text-neutral-800 dark:text-neutral-200 text-center font-semibold text-[11px] hover:bg-neutral-100 dark:hover:bg-neutral-800"
                >
                  Admin Preview →
                </Link>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
            <Shield className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Connected to Backend API ({API_CONFIG.baseUrl})</span>
          </div>
        )}

        {errors.general && (
          <div className="p-3.5 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 rounded-xl text-xs text-rose-800 dark:text-rose-300 flex items-start gap-2 leading-relaxed">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
            <span>{errors.general}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Email Address"
            type="email"
            placeholder="user@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onBlur={validateEmailOnBlur}
            error={errors.email}
            helperText="Enter your registered account or administrator email"
            required
            autoComplete="email"
          />

          <Input
            label="Password"
            type={showPassword ? 'text' : 'password'}
            placeholder="••••••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onBlur={validatePasswordOnBlur}
            error={errors.password}
            helperText="Enter your account credentials"
            required
            autoComplete="current-password"
            rightIcon={
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="cursor-pointer text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 p-1"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            }
          />

          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="w-full mt-2 min-h-[44px] font-semibold"
            isLoading={isLoading}
          >
            <span>Sign In</span>
            <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </form>

        {/* Links to Signup and Guest */}
        <div className="pt-2 border-t border-neutral-100 dark:border-neutral-800 space-y-3">
          <div className="flex items-center justify-between text-xs text-neutral-600 dark:text-neutral-400">
            <span>Don't have an account yet?</span>
            <Link
              to="/auth/signup"
              className="text-neutral-900 dark:text-white font-semibold underline decoration-neutral-300 hover:decoration-neutral-900"
            >
              Sign up
            </Link>
          </div>

          <div className="text-center pt-1">
            <Link
              to="/shorten"
              className="text-xs text-neutral-500 hover:text-neutral-900 dark:hover:text-white transition-colors"
            >
              No account required? Use Guest Shorten →
            </Link>
          </div>
        </div>
      </Card>
    </div>
  );
}
