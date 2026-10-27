import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Link2, Eye, EyeOff, ArrowRight, ServerOff, AlertCircle, Shield } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { useToastStore } from '../store/useToastStore';
import { NameSchema, EmailSchema, PasswordSchema } from '../lib/validators';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card } from '../components/ui/Card';
import { API_CONFIG } from '../config/api';

export function SignupPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { register } = useAuthStore();
  const { success, error: toastError } = useToastStore();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [errors, setErrors] = useState<{
    name?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
    general?: string;
  }>({});

  const [isLoading, setIsLoading] = useState(false);
  const isBackendConnected = API_CONFIG.isBackendConnected;

  function validateField(fieldName: 'name' | 'email' | 'password' | 'confirmPassword') {
    const newErrors = { ...errors };

    if (fieldName === 'name') {
      const res = NameSchema.safeParse(name);
      if (!res.success) {
        newErrors.name = res.error.issues[0].message;
      } else {
        delete newErrors.name;
      }
    }

    if (fieldName === 'email') {
      const res = EmailSchema.safeParse(email);
      if (!res.success) {
        newErrors.email = res.error.issues[0].message;
      } else {
        delete newErrors.email;
      }
    }

    if (fieldName === 'password') {
      const res = PasswordSchema.safeParse(password);
      if (!res.success) {
        newErrors.password = res.error.issues[0].message;
      } else {
        delete newErrors.password;
      }
    }

    if (fieldName === 'confirmPassword') {
      if (confirmPassword !== password) {
        newErrors.confirmPassword = 'Passwords do not match';
      } else {
        delete newErrors.confirmPassword;
      }
    }

    setErrors(newErrors);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});

    const nameRes = NameSchema.safeParse(name);
    const emailRes = EmailSchema.safeParse(email);
    const passRes = PasswordSchema.safeParse(password);
    const confirmMatch = confirmPassword === password;

    const validationMap: typeof errors = {};
    if (!nameRes.success) validationMap.name = nameRes.error.issues[0].message;
    if (!emailRes.success) validationMap.email = emailRes.error.issues[0].message;
    if (!passRes.success) validationMap.password = passRes.error.issues[0].message;
    if (!confirmMatch) validationMap.confirmPassword = 'Passwords do not match';

    if (Object.keys(validationMap).length > 0) {
      setErrors(validationMap);
      return;
    }

    // In local mode: do not invent server account registration
    if (!isBackendConnected) {
      setErrors({
        general:
          'Backend account registration is offline. Real user sign up requires connecting the Fastify + PostgreSQL backend service (via VITE_API_BASE_URL). You can evaluate Linko directly in the Local Workspace or use Guest Shorten without creating an account.',
      });
      return;
    }

    setIsLoading(true);
    try {
      const user = await register(name.trim(), email.trim().toLowerCase(), password);
      success(`Account created! Welcome, ${user.name}`);
      const redirectUrl = searchParams.get('url');
      if (redirectUrl) {
        navigate(`/app/links/new?url=${encodeURIComponent(redirectUrl)}`);
      } else {
        navigate('/app');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Registration failed';
      setErrors({ general: msg });
      toastError('Signup Error', msg);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 sm:p-6 lg:p-8 bg-neutral-50 dark:bg-neutral-950">
      <Card className="max-w-md w-full p-6 sm:p-8 space-y-6 border-neutral-300 dark:border-neutral-800 shadow-md">
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
            Create an Account
          </h1>
          <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 mt-1 font-body">
            Register for a dedicated link management and traffic intelligence workspace.
          </p>
        </div>

        {/* Backend Not Configured Notice */}
        {!isBackendConnected ? (
          <div className="p-4 rounded-xl bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 space-y-2 text-xs">
            <div className="flex items-center gap-1.5 font-semibold text-neutral-900 dark:text-white">
              <ServerOff className="w-4 h-4 text-neutral-600 dark:text-neutral-400" />
              <span>Backend Registration Offline</span>
            </div>
            <p className="text-[11px] text-neutral-600 dark:text-neutral-400 leading-relaxed font-body">
              Linko is operating in frontend-only local mode. Creating persistent accounts and authenticating credentials requires connecting the backend database and API.
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
                  to="/shorten"
                  className="px-2.5 py-1.5 rounded-lg border border-neutral-300 dark:border-neutral-700 text-neutral-800 dark:text-neutral-200 text-center font-semibold text-[11px] hover:bg-neutral-100 dark:hover:bg-neutral-800"
                >
                  Guest Shorten →
                </Link>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
            <Shield className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Connected to Backend API</span>
          </div>
        )}

        {errors.general && (
          <div className="p-3.5 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 rounded-xl text-xs text-rose-800 dark:text-rose-300 flex items-start gap-2 leading-relaxed">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
            <span>{errors.general}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Full Name"
            type="text"
            placeholder="Jane Doe"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={() => validateField('name')}
            error={errors.name}
            required
            autoComplete="name"
          />

          <Input
            label="Email Address"
            type="email"
            placeholder="jane@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onBlur={() => validateField('email')}
            error={errors.email}
            required
            autoComplete="email"
          />

          <Input
            label="Password"
            type={showPassword ? 'text' : 'password'}
            placeholder="••••••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onBlur={() => validateField('password')}
            error={errors.password}
            helperText="Minimum 8 characters with numbers or special symbols"
            required
            autoComplete="new-password"
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

          <Input
            label="Confirm Password"
            type={showConfirmPassword ? 'text' : 'password'}
            placeholder="••••••••••••"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            onBlur={() => validateField('confirmPassword')}
            error={errors.confirmPassword}
            required
            autoComplete="new-password"
            rightIcon={
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="cursor-pointer text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 p-1"
                aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
              >
                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
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
            <span>Create Account</span>
            <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </form>

        <div className="pt-2 border-t border-neutral-100 dark:border-neutral-800 text-center text-xs text-neutral-600 dark:text-neutral-400">
          <span>Already have an account? </span>
          <Link
            to="/auth/login"
            className="text-neutral-900 dark:text-white font-semibold underline decoration-neutral-300 hover:decoration-neutral-900"
          >
            Sign in
          </Link>
        </div>
      </Card>
    </div>
  );
}
