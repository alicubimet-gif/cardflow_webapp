'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/auth-context';
import { useSearchParams, useRouter } from 'next/navigation';
import { Mail, Lock, Loader2, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { validateEmail } from '@/utils/validation';
import AuthLayout from '@/components/auth/auth-layout';

function LoginContent() {
  const { login, loading: authLoading, user } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});

  useEffect(() => {
    if (user) {
      router.push('/');
    }
  }, [user, router]);

  useEffect(() => {
    const status = searchParams.get('status');
    if (status === 'denied') {
      setError('Access denied. Subscriber and Super Admins cannot access CardFlow WebApp.');
    }

    const prefillEmail = searchParams.get('email');
    const prefillTempPwd = searchParams.get('temp_pwd');
    if (prefillEmail) setEmail(prefillEmail);
    if (prefillTempPwd) setPassword(prefillTempPwd);
  }, [searchParams]);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const newErrors: { email?: string; password?: string } = {};

    const emailErr = validateEmail(email);
    if (emailErr) {
      newErrors.email = emailErr;
    }

    if (!password) {
      newErrors.password = 'Please enter your password.';
    }

    if (Object.keys(newErrors).length > 0) {
      setFieldErrors(newErrors);
      const firstInvalidField = newErrors.email ? 'email' : 'password';
      document.getElementById(firstInvalidField)?.focus();
      return;
    }

    const trimmedInput = email.trim();
    const isEmail = /\S+@\S+\.\S+/.test(trimmedInput);
    const credentials: any = {
      email: isEmail ? trimmedInput.toLowerCase() : trimmedInput,
      password
    };

    try {
      await login(credentials);
    } catch (err: any) {
      const resData = err?.response?.data;
      let msg = 'Invalid email or password.';
      if (resData) {
        if (typeof resData === 'string') {
          msg = resData;
        } else if (resData.message) {
          msg = resData.message;
        } else if (resData.detail) {
          msg = resData.detail;
        }
      }
      setError(msg);
    }
  };

  const handleEmailChange = (val: string) => {
    const normalized = val.toLowerCase().replace(/\s/g, '');
    setEmail(normalized);
    const err = validateEmail(normalized);
    setFieldErrors(prev => ({
      ...prev,
      email: err || undefined
    }));
  };

  const handlePasswordChange = (val: string) => {
    setPassword(val);
    if (fieldErrors.password) {
      setFieldErrors(prev => {
        const next = { ...prev };
        delete next.password;
        return next;
      });
    }
  };

  return (
    <AuthLayout
      title="Sign in to WebApp"
      subtitle="Organization Admin & Staff Management Portal"
    >
      <div className="space-y-6">
        {error && (
          <div className="rounded-xl bg-rose-50 border border-rose-100 p-4 flex items-start gap-3 animate-in fade-in duration-200">
            <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
            <span className="text-xs font-semibold text-rose-700 leading-relaxed">
              {error}
            </span>
          </div>
        )}

        <form className="space-y-5" onSubmit={handleLoginSubmit} noValidate>
          <div>
            <label htmlFor="email" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Email Address
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Mail size={18} />
              </div>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => handleEmailChange(e.target.value)}
                disabled={authLoading}
                className={`appearance-none block w-full h-[44px] pl-11 pr-3.5 py-3 border rounded-xl shadow-xs placeholder-slate-400 focus:outline-hidden focus:ring-4 text-sm disabled:opacity-50 text-slate-900 bg-white transition-all ${
                  fieldErrors.email 
                    ? 'border-rose-500 focus:ring-rose-500/15 focus:border-rose-500'
                    : 'border-slate-300 focus:ring-blue-500/15 focus:border-blue-600'
                }`}
                placeholder="name@organization.com"
              />
            </div>
            {fieldErrors.email && (
              <p className="mt-1.5 text-xs font-semibold text-rose-500">{fieldErrors.email}</p>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label htmlFor="password" className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Password
              </label>
              <Link href="/forgot-password" className="text-xs font-bold text-blue-600 hover:text-blue-700 transition-colors">
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Lock size={18} />
              </div>
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                value={password}
                onChange={(e) => handlePasswordChange(e.target.value)}
                disabled={authLoading}
                className={`appearance-none block w-full h-[44px] pl-11 pr-11 py-3 border rounded-xl shadow-xs placeholder-slate-400 focus:outline-hidden focus:ring-4 text-sm disabled:opacity-50 text-slate-900 bg-white transition-all ${
                  fieldErrors.password
                    ? 'border-rose-500 focus:ring-rose-500/15 focus:border-rose-500'
                    : 'border-slate-300 focus:ring-blue-500/15 focus:border-blue-600'
                }`}
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-655 transition-colors cursor-pointer rounded-md focus:outline-hidden"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {fieldErrors.password && (
              <p className="mt-1.5 text-xs font-semibold text-rose-500">{fieldErrors.password}</p>
            )}
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={authLoading}
              className="w-full h-[44px] flex justify-center items-center py-3 px-4 border border-transparent rounded-xl shadow-md text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 active:scale-[0.99] focus:outline-hidden focus:ring-4 focus:ring-blue-500/20 transition-all disabled:opacity-50 cursor-pointer"
            >
              {authLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </div>
        </form>
      </div>
    </AuthLayout>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center font-sans">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500 mb-2" />
        <span className="text-sm font-semibold text-slate-600">Loading portal...</span>
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}
