import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Link2, Eye, EyeOff, ArrowRight, AlertCircle, Shield, KeyRound } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { useToastStore } from '../store/useToastStore';
import { EmailSchema } from '../lib/validators';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card } from '../components/ui/Card';

export function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuthStore();
  const { success, error: toastError } = useToastStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  const [errors, setErrors] = useState<{
    email?: string;
    password?: string;
    general?: string;
  }>({});

  const [isLoading, setIsLoading] = useState(false);



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

    setIsLoading(true);
    try {
      const user = await login(email.trim().toLowerCase(), password);
      success(`Welcome back, ${user.name}`);
      if (user.role === 'admin') {
        navigate('/admin/overview');
      } else {
        navigate('/app/dashboard');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Invalid email or password.';
      setErrors({ general: msg });
      toastError('Login Failed', msg);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <Card className="max-w-md w-full p-6 sm:p-8 space-y-6">
        <div>
          <Link to="/" className="inline-flex items-center gap-2 mb-4 group">
            <div className="w-8 h-8 rounded-xl bg-neutral-900 text-white flex items-center justify-center shadow-xs group-hover:bg-black transition-colors">
              <Link2 className="w-4.5 h-4.5 stroke-[2.2]" />
            </div>
            <span className="font-display text-lg font-bold text-neutral-900 dark:text-white">
              LinkPulse
            </span>
          </Link>
          <h1 className="font-display text-2xl sm:text-3xl font-normal tracking-tight text-neutral-900 dark:text-white">
            User Workspace Login
          </h1>
          <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 mt-1 font-body">
            Manage your personal links, customize vanity aliases, monitor visit quotas, and view click analytics.
          </p>
        </div>

        {/* Honest Local Demo Authentication Box */}
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2 text-xs">
          <div className="flex items-center gap-1.5 font-semibold text-slate-900 dark:text-white">
            <Shield className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
            <span>Frontend Prototype Authentication</span>
          </div>
          <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
            In this frontend-only build, sign in with an account created via the application's{' '}
            <Link to="/signup" className="text-teal-700 dark:text-teal-300 font-semibold underline">
              Sign Up form
            </Link>
            . Passwords are salted and hashed locally in browser storage using the native Web Crypto API.
          </p>
          <div className="pt-1 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-[11px]">
            <span className="text-slate-500">Need immediate shortening?</span>
            <Link to="/guest" className="font-semibold text-teal-600 dark:text-teal-400 hover:underline">
              Try Guest Shortener →
            </Link>
          </div>
        </div>

        {errors.general && (
          <div className="p-3 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 rounded-lg text-xs text-rose-800 dark:text-rose-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{errors.general}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Email Address"
            type="email"
            placeholder="user@domain.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onBlur={validateEmailOnBlur}
            error={errors.email}
            helperText="Enter your registered account email"
            required
            autoComplete="email"
          />

          <Input
            label="Password"
            type={showPassword ? 'text' : 'password'}
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onBlur={validatePasswordOnBlur}
            error={errors.password}
            helperText="Enter your account password"
            required
            autoComplete="current-password"
            rightIcon={
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="cursor-pointer text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                aria-label="Toggle password visibility"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            }
          />

          <div className="flex items-center justify-between text-xs pt-1">
            <label className="flex items-center gap-2 text-slate-600 dark:text-slate-400 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 accent-neutral-900 rounded cursor-pointer"
              />
              <span>Remember me</span>
            </label>
          </div>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="w-full mt-2 min-h-[44px]"
            isLoading={isLoading}
          >
            <span>Sign In to Workspace</span>
            <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </form>

        <div className="pt-2 border-t border-neutral-100 dark:border-neutral-800 space-y-3">
          <div className="flex items-center justify-between text-xs text-neutral-600 dark:text-neutral-400">
            <span>Don't have an account yet?</span>
            <Link to="/register" className="text-neutral-900 dark:text-white font-semibold underline decoration-neutral-300 hover:decoration-neutral-900">
              Create an account
            </Link>
          </div>

          <div className="p-2.5 bg-neutral-100/70 dark:bg-neutral-800/60 rounded-xl text-center text-xs">
            <span className="text-neutral-500">Platform Administrator? </span>
            <Link to="/admin/login" className="text-neutral-900 dark:text-white font-semibold hover:underline">
              Go to Admin Login →
            </Link>
          </div>
        </div>
      </Card>
    </div>
  );
}
