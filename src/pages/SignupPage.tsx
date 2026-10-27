import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Link2, Eye, EyeOff, ArrowRight, Check, Shield } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { useToastStore } from '../store/useToastStore';
import { NameSchema, EmailSchema, PasswordSchema, checkPasswordRules } from '../lib/validators';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card } from '../components/ui/Card';

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

  // Field errors
  const [errors, setErrors] = useState<{
    name?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
  }>({});

  const [isLoading, setIsLoading] = useState(false);

  const passwordAnalysis = checkPasswordRules(password);

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

    setIsLoading(true);
    try {
      const user = await register(name.trim(), email.trim().toLowerCase(), password);
      success(`Account created! Welcome, ${user.name}`);
      const redirectUrl = searchParams.get('url');
      if (redirectUrl) {
        navigate(`/app/links/new?url=${encodeURIComponent(redirectUrl)}`);
      } else {
        navigate('/app/dashboard');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Registration failed';
      if (msg.toLowerCase().includes('already exists') || msg.toLowerCase().includes('already registered')) {
        setErrors((prev) => ({ ...prev, email: 'This email is already registered.' }));
      } else {
        toastError('Signup Error', msg);
      }
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
            Create Your Account
          </h1>
          <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 mt-1 font-body">
            Start shortening links and streaming live analytics with your dedicated workspace.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Full Name"
            placeholder="Sarah Chen"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={() => validateField('name')}
            error={errors.name}
            helperText="Letters and spaces only (2-50 characters)"
            required
            autoComplete="name"
          />

          <Input
            label="Email Address"
            type="email"
            placeholder="user@domain.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onBlur={() => validateField('email')}
            error={errors.email}
            helperText="Enter your active email address"
            required
            autoComplete="email"
          />

          {/* Password with live rules checklist and strength meter */}
          <div className="space-y-2">
            <Input
              label="Password"
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onBlur={() => validateField('password')}
              error={errors.password}
              helperText="8 to 64 characters with mixed case, number and symbol"
              required
              autoComplete="new-password"
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

            {/* Strength Meter */}
            {password.length > 0 && (
              <div className="space-y-1.5 pt-1">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-500">Password strength:</span>
                  <span
                    className={`font-semibold ${
                      passwordAnalysis.strength === 'Strong'
                        ? 'text-neutral-900 dark:text-neutral-100'
                        : passwordAnalysis.strength === 'Medium'
                        ? 'text-amber-600'
                        : 'text-rose-600'
                    }`}
                  >
                    {passwordAnalysis.strength}
                  </span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden flex gap-1">
                  <div
                    className={`h-full transition-all duration-200 ${
                      passwordAnalysis.score >= 2 ? 'bg-rose-500 w-1/3' : 'bg-transparent'
                    }`}
                  />
                  <div
                    className={`h-full transition-all duration-200 ${
                      passwordAnalysis.score >= 4 ? 'bg-amber-500 w-1/3' : 'bg-transparent'
                    }`}
                  />
                  <div
                    className={`h-full transition-all duration-200 ${
                      passwordAnalysis.score === 6 ? 'bg-neutral-900 dark:bg-white w-1/3' : 'bg-transparent'
                    }`}
                  />
                </div>

                {/* Live Rules Checklist */}
                <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-1.5 text-[11px]">
                  {passwordAnalysis.rules.map((rule) => (
                    <div
                      key={rule.id}
                      className={`flex items-center gap-1.5 ${
                        rule.valid ? 'text-neutral-900 dark:text-neutral-100 font-semibold' : 'text-slate-400'
                      }`}
                    >
                      {rule.valid ? (
                        <Check className="w-3.5 h-3.5 shrink-0 stroke-[2.5]" />
                      ) : (
                        <span className="w-3.5 h-3.5 rounded-full border border-slate-300 dark:border-slate-700 shrink-0 inline-block" />
                      )}
                      <span>{rule.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Confirm Password */}
          <Input
            label="Confirm Password"
            type={showConfirmPassword ? 'text' : 'password'}
            placeholder="••••••••"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            onBlur={() => validateField('confirmPassword')}
            error={errors.confirmPassword}
            helperText="Must match your password above"
            required
            autoComplete="new-password"
            rightIcon={
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="cursor-pointer text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                aria-label="Toggle confirm password visibility"
              >
                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            }
          />

          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="w-full mt-2 min-h-[44px]"
            isLoading={isLoading}
          >
            <span>Create Account</span>
            <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </form>

        <div className="p-3 bg-neutral-50 dark:bg-neutral-900/60 border border-neutral-200 dark:border-neutral-800 rounded-xl text-xs text-neutral-600 dark:text-neutral-400 flex items-center gap-2.5">
          <Shield className="w-4 h-4 text-neutral-800 dark:text-neutral-200 shrink-0" />
          <span>Accounts are secured with cryptographic salt hashing (Web Crypto SHA-256) and local session management.</span>
        </div>

        <p className="text-center text-xs text-neutral-600">
          Already have an account?{' '}
          <Link to="/login" className="text-neutral-900 dark:text-white font-semibold underline decoration-neutral-300 hover:decoration-neutral-900">
            Log in
          </Link>
        </p>
      </Card>
    </div>
  );
}
