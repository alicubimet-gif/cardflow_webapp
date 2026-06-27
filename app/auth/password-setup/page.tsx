'use client';

import React, { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { Loader2, KeyRound, Lock, Eye, EyeOff, Mail } from 'lucide-react';
import Image from 'next/image';

function PasswordSetupInner() {
  const { user, completePassword } = useAuth();
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [fieldErrors, setFieldErrors] = useState<{ password?: string; confirmPassword?: string }>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const newErrors: { password?: string; confirmPassword?: string } = {};

    if (!token) {
      setError('Setup token is missing. Please use the link provided in your welcome email.');
      return;
    }

    if (!password) {
      newErrors.password = 'Please enter your password.';
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = 'Please enter your password.';
    }

    if (password && password.length < 8) {
      newErrors.password = 'Password must meet the minimum security requirements.';
    } else if (password) {
      const anyUpper = /[A-Z]/.test(password);
      const anyLower = /[a-z]/.test(password);
      const anyDigit = /[0-9]/.test(password);
      if (!anyUpper || !anyLower || !anyDigit) {
        newErrors.password = 'Password must meet the minimum security requirements.';
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
      await completePassword(password, token, confirmPassword);
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Failed to complete password setup.');
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
    <div className="min-h-screen bg-[#090D1A] flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background gradients */}
      <div className="absolute top-[-25%] right-[-15%] w-[70%] h-[70%] rounded-full bg-blue-900/15 blur-[150px] pointer-events-none" />
      <div className="absolute bottom-[-25%] left-[-15%] w-[70%] h-[70%] rounded-full bg-indigo-900/15 blur-[150px] pointer-events-none" />

      <div className="w-full max-w-md bg-white/[0.03] border border-white/[0.08] backdrop-blur-xl rounded-3xl p-8 shadow-2xl relative z-10 animate-in fade-in zoom-in-95 duration-500">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-6">
            <Image
              src="/branding/logo-dark.png"
              alt="CardFlow"
              width={220}
              height={70}
              priority
              className="w-full h-auto object-contain select-none pointer-events-none max-w-[150px] sm:max-w-[180px] md:max-w-[220px]"
            />
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight" style={{ fontFamily: 'Outfit, sans-serif' }}>
            Welcome Back
          </h2>
          <p className="text-slate-400 text-xs mt-2">
            Create password to continue
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-200 text-xs font-semibold leading-relaxed">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5" noValidate>
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">
              Email Address
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
                <Mail size={16} />
              </span>
              <input
                type="text"
                readOnly
                value={user?.email || ''}
                className="w-full h-12 pl-11 pr-4 bg-white/[0.01] border border-white/[0.08] rounded-xl text-sm font-semibold text-slate-400 focus:outline-none cursor-not-allowed"
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">
              New Password
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
                <Lock size={16} />
              </span>
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => handlePasswordChange(e.target.value)}
                placeholder="••••••••"
                className={`w-full h-12 pl-11 pr-11 bg-[#101426] border rounded-xl focus:outline-none focus:ring-2 text-sm font-semibold text-white transition-all duration-200 ${
                  fieldErrors.password 
                    ? 'border-rose-500 focus:ring-rose-500/10 focus:border-rose-500' 
                    : 'border-white/[0.08] focus:border-blue-500/50 focus:ring-blue-500/10'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {fieldErrors.password ? (
              <p className="mt-1.5 text-xs font-semibold text-rose-500">{fieldErrors.password}</p>
            ) : (
              <p className="text-[10px] text-slate-500 mt-2">
                Must be at least 8 characters, with 1 uppercase, 1 lowercase, and 1 number.
              </p>
            )}
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">
              Confirm Password
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
                <Lock size={16} />
              </span>
              <input
                id="confirmPassword"
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={e => handleConfirmPasswordChange(e.target.value)}
                placeholder="••••••••"
                className={`w-full h-12 pl-11 pr-11 bg-[#101426] border rounded-xl focus:outline-none focus:ring-2 text-sm font-semibold text-white transition-all duration-200 ${
                  fieldErrors.confirmPassword 
                    ? 'border-rose-500 focus:ring-rose-500/10 focus:border-rose-500' 
                    : 'border-white/[0.08] focus:border-blue-500/50 focus:ring-blue-500/10'
                }`}
              />
            </div>
            {fieldErrors.confirmPassword && (
              <p className="mt-1.5 text-xs font-semibold text-rose-500">{fieldErrors.confirmPassword}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full h-12 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold tracking-wider uppercase transition-all duration-250 flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-blue-600/10"
          >
            {isSubmitting ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              'Save Password'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function PasswordSetupPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#090D1A] flex flex-col items-center justify-center p-4">
        <Loader2 size={32} className="text-blue-500 animate-spin" />
      </div>
    }>
      <PasswordSetupInner />
    </Suspense>
  );
}
