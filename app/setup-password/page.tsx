'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { Lock, Loader2, AlertCircle, CheckCircle, Eye, EyeOff } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '@/context/auth-context';
import AuthLayout from '@/components/auth/auth-layout';

function SetupPasswordInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token') || '';
  const uid = searchParams.get('uid') || '';
  const { checkSession } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [fieldErrors, setFieldErrors] = useState<{ password?: string; confirmPassword?: string }>({});

  // 1. Validate parameters on load
  useEffect(() => {
    if (!token || !uid) {
      setError('Invalid password setup link. Please request a new password reset email.');
      return;
    }

    const validateToken = async () => {
      try {
        const response = await axios.get(
          `/server/auth/setup-password/validate/?token=${encodeURIComponent(token)}&uid=${encodeURIComponent(uid)}`
        );
        if (response.data.status === 'valid') {
          setEmail(response.data.email || '');
        }
      } catch (err: any) {
        setError('Invalid password setup link. Please request a new password reset email.');
      }
    };

    validateToken();
  }, [token, uid]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    const newErrors: { password?: string; confirmPassword?: string } = {};

    if (!token || !uid) {
      setError('Invalid password setup link. Please request a new password reset email.');
      return;
    }

    if (!password) {
      newErrors.password = 'Please enter your password.';
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password.';
    }

    if (password && password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters.';
    } else if (password) {
      const anyUpper = /[A-Z]/.test(password);
      const anyLower = /[a-z]/.test(password);
      const anyDigit = /[0-9]/.test(password);
      if (!anyUpper || !anyLower || !anyDigit) {
        newErrors.password = 'Password must meet all security requirements.';
      }
    }

    if (password && confirmPassword && password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match.';
    }

    if (Object.keys(newErrors).length > 0) {
      setFieldErrors(newErrors);
      const firstInvalidField = newErrors.password ? 'password' : 'confirmPassword';
      document.getElementById(firstInvalidField)?.focus();
      return;
    }

    setIsSubmitting(true);
    try {
      await axios.post('/server/auth/setup-password/', {
        uid,
        token,
        password,
        confirm_password: confirmPassword,
        password_confirm: confirmPassword
      });
      
      setSuccess(true);

      // Clear the setup-password query tokens from browser history
      if (typeof window !== 'undefined') {
        const url = new URL(window.location.href);
        url.searchParams.delete('token');
        url.searchParams.delete('uid');
        window.history.replaceState({}, '', url.pathname + url.search);
      }
      
      await checkSession().catch(() => {});
    } catch (err: any) {
      setError(
        err?.response?.data?.detail ||
        err?.response?.data?.message ||
        'Unable to set your password. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
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

  const handleConfirmPasswordChange = (val: string) => {
    setConfirmPassword(val);
    if (fieldErrors.confirmPassword) {
      setFieldErrors(prev => {
        const next = { ...prev };
        delete next.confirmPassword;
        return next;
      });
    }
  };

  return (
    <AuthLayout
      title="Setup Password"
      subtitle="Create password for your account"
    >
      {success ? (
        <div className="text-center py-6 space-y-4 animate-in fade-in duration-300">
          <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
            <CheckCircle size={24} />
          </div>
          <h3 className="text-lg font-bold text-slate-900">Password updated successfully.</h3>
          <Link
            href="/login"
            className="w-full h-[44px] flex justify-center items-center bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md transition-all cursor-pointer"
          >
            Go to Sign In
          </Link>
        </div>
      ) : (
        <form className="space-y-5" onSubmit={handleSubmit} noValidate>
          {error && (
            <div className="rounded-xl bg-rose-50 border border-rose-100 p-4 flex items-start gap-3 animate-in fade-in duration-200">
              <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
              <span className="text-xs font-semibold text-rose-700 leading-relaxed">
                {error}
              </span>
            </div>
          )}

          {email && (
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs text-slate-600 mb-2">
              Setting up account for: <strong className="text-slate-800">{email}</strong>
            </div>
          )}

          <div>
            <label htmlFor="password" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              New Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Lock size={18} />
              </div>
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                value={password}
                onChange={(e) => handlePasswordChange(e.target.value)}
                disabled={isSubmitting || !token || !uid}
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
            {fieldErrors.password ? (
              <p className="mt-1.5 text-xs font-semibold text-rose-500">{fieldErrors.password}</p>
            ) : (
              <div className="text-[11px] text-slate-500 mt-2 space-y-1">
                <p>Password requirements:</p>
                <ul className="list-disc pl-4 space-y-0.5">
                  <li className={password.length >= 8 ? "text-emerald-600 font-semibold" : ""}>Minimum 8 characters</li>
                  <li className={/[A-Z]/.test(password) ? "text-emerald-600 font-semibold" : ""}>At least one uppercase letter</li>
                  <li className={/[a-z]/.test(password) ? "text-emerald-600 font-semibold" : ""}>At least one lowercase letter</li>
                  <li className={/[0-9]/.test(password) ? "text-emerald-600 font-semibold" : ""}>At least one number</li>
                </ul>
              </div>
            )}
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Confirm Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Lock size={18} />
              </div>
              <input
                id="confirmPassword"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => handleConfirmPasswordChange(e.target.value)}
                disabled={isSubmitting || !token || !uid}
                className={`appearance-none block w-full h-[44px] pl-11 pr-3.5 py-3 border rounded-xl shadow-xs placeholder-slate-400 focus:outline-hidden focus:ring-4 text-sm disabled:opacity-50 text-slate-900 bg-white transition-all ${
                  fieldErrors.confirmPassword 
                    ? 'border-rose-500 focus:ring-rose-500/15 focus:border-rose-500'
                    : 'border-slate-300 focus:ring-blue-500/15 focus:border-blue-600'
                }`}
                placeholder="••••••••"
              />
            </div>
            {fieldErrors.confirmPassword && (
              <p className="mt-1.5 text-xs font-semibold text-rose-500">{fieldErrors.confirmPassword}</p>
            )}
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting || !token || !uid}
              className="w-full h-[44px] flex justify-center items-center py-3 px-4 border border-transparent rounded-xl shadow-md text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 active:scale-[0.99] focus:outline-hidden focus:ring-4 focus:ring-blue-500/20 transition-all disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  Setting Password...
                </>
              ) : (
                'Set Password'
              )}
            </button>
          </div>
        </form>
      )}
    </AuthLayout>
  );
}

export default function SetupPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center font-sans">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500 mb-2" />
        <span className="text-sm font-semibold text-slate-600">Loading setup...</span>
      </div>
    }>
      <SetupPasswordInner />
    </Suspense>
  );
}
