'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useAuth } from '@/context/auth-context';
import { useSearchParams } from 'next/navigation';
import { Shield, Mail, Lock, Loader2, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { AuthService } from '@/services/auth-service';

import { validateEmail } from '@/utils/validation';

const verifiedTokens = new Set<string>();

function LoginContent() {
  const { login, verifyToken, loading: authLoading } = useAuth();
  const searchParams = useSearchParams();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const status = searchParams.get('status');
    if (status === 'denied') {
      setError('Access denied. Subscriber and Super Admins cannot access CardFlow WebApp.');
    }

    const token = searchParams.get('token');
    if (token) {
      if (verifiedTokens.has(token)) {
        return;
      }
      verifiedTokens.add(token);
      verifyToken(token)
        .then(() => {
          // Success! Redirect is handled by AuthProvider's useEffect!
        })
        .catch((err) => {
          verifiedTokens.delete(token);
          setError('This secure invitation link is invalid or has expired. Please request a new invitation or use the Forgot Password flow.');
        });
    } else {
      const prefillEmail = searchParams.get('email');
      const prefillTempPwd = searchParams.get('temp_pwd');
      if (prefillEmail) setEmail(prefillEmail);
      if (prefillTempPwd) setPassword(prefillTempPwd);
    }
  }, [searchParams, verifyToken]);

  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});

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
      // Focus first invalid field
      const firstInvalidField = newErrors.email ? 'email' : 'password';
      document.getElementById(firstInvalidField)?.focus();
      return;
    }

    try {
      await login({ email: email.trim().toLowerCase(), password });
    } catch (err: any) {
      console.error(err);
      const msg = err?.response?.data?.message || err?.response?.data?.detail || 'Invalid email or password.';
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
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex items-center justify-center gap-2 mb-2">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-sm">
            <Shield size={20} />
          </div>
          <span className="text-2xl font-extrabold text-slate-900 tracking-wider">CardFlow</span>
          <span className="text-[10px] font-bold text-blue-600 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full uppercase">
            Portal
          </span>
        </div>
        
        <h2 className="mt-6 text-center text-3xl font-extrabold text-slate-900" style={{ fontFamily: 'Sora, sans-serif' }}>
          Sign in to WebApp
        </h2>
        
        <p className="mt-2 text-center text-sm text-slate-600">
          Organization Admin and Staff management access
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 border border-slate-200 sm:rounded-2xl sm:px-10 shadow-sm">
          {error && (
            <div className="rounded-xl bg-rose-50 border border-rose-100 p-4 flex items-start gap-3 mb-6">
              <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
              <span className="text-xs font-semibold text-rose-700 leading-normal">
                {error}
              </span>
            </div>
          )}

          <form className="space-y-6" onSubmit={handleLoginSubmit} noValidate>
            <div>
              <label htmlFor="email" className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Email address
              </label>
              <div className="mt-2 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Mail size={16} />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => handleEmailChange(e.target.value)}
                  disabled={authLoading}
                  className={`appearance-none block w-full pl-10 pr-3 py-2.5 border rounded-xl shadow-xs placeholder-slate-400 focus:outline-hidden focus:ring-2 text-sm disabled:opacity-50 text-slate-900 bg-white transition-all ${
                    fieldErrors.email 
                      ? 'border-rose-500 focus:ring-rose-500/10 focus:border-rose-500'
                      : 'border-slate-300 focus:ring-blue-500 focus:border-blue-500'
                  }`}
                  placeholder="name@organization.com"
                />
              </div>
              {fieldErrors.email && (
                <p className="mt-1.5 text-xs font-semibold text-rose-500">{fieldErrors.email}</p>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Password
                </label>
                <div className="text-xs">
                  <a href="/auth/forgot-password" className="font-semibold text-blue-600 hover:text-blue-500">
                    Forgot password?
                  </a>
                </div>
              </div>
              <div className="mt-2 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock size={16} />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => handlePasswordChange(e.target.value)}
                  disabled={authLoading}
                  className={`appearance-none block w-full pl-10 pr-10 py-2.5 border rounded-xl shadow-xs placeholder-slate-400 focus:outline-hidden focus:ring-2 text-sm disabled:opacity-50 text-slate-900 bg-white transition-all ${
                    fieldErrors.password
                      ? 'border-rose-500 focus:ring-rose-500/10 focus:border-rose-500'
                      : 'border-slate-300 focus:ring-blue-500 focus:border-blue-500'
                  }`}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-655 transition-colors cursor-pointer"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {fieldErrors.password && (
                <p className="mt-1.5 text-xs font-semibold text-rose-500">{fieldErrors.password}</p>
              )}
            </div>

            <div>
              <button
                type="submit"
                disabled={authLoading}
                className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-xl shadow-xs text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 focus:outline-hidden focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors disabled:opacity-50 cursor-pointer"
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
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center font-sans">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500 mb-2" />
        <span className="text-sm font-semibold text-slate-550">Loading portal...</span>
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}
