'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Mail, Loader2, CheckCircle, ArrowLeft, AlertCircle } from 'lucide-react';
import { apiClient } from '@/api/client';
import { validateEmail } from '@/utils/validation';
import { getApiErrorMessage } from '@/utils/error';

export default function ForgotPasswordForm() {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailError(null);
    setErrorMessage(null);
    setSuccessMessage(null);

    const trimmed = email.trim();
    if (!trimmed) {
      setEmailError('Email address is required.');
      document.getElementById('email')?.focus();
      return;
    }

    const emailErr = validateEmail(trimmed);
    if (emailErr) {
      setEmailError('Enter a valid email address.');
      document.getElementById('email')?.focus();
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await apiClient.post('/api/auth/forgot-password/', { email: trimmed });
      const msg = response?.data?.detail || response?.data?.message || 'If an account exists for this email, password reset instructions have been sent.';
      setSuccessMessage(msg);
    } catch (err: any) {
      setErrorMessage(getApiErrorMessage(err, 'Unable to send the password reset email.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEmailChange = (val: string) => {
    setEmail(val);
    if (emailError) setEmailError(null);
    if (errorMessage) setErrorMessage(null);
    if (successMessage) setSuccessMessage(null);
  };

  if (successMessage) {
    return (
      <div className="text-center py-4 space-y-4 animate-in fade-in duration-300">
        <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
          <CheckCircle size={24} />
        </div>
        <h3 className="text-sm font-bold text-slate-900">Check Your Email</h3>
        <p className="text-xs text-slate-600 leading-relaxed">
          {successMessage}
        </p>
        <Link
          href="/login"
          className="w-full h-[44px] flex justify-center items-center bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl shadow-xs border border-slate-200 transition-colors"
        >
          Back to Sign In
        </Link>
      </div>
    );
  }

  return (
    <form className="space-y-5" onSubmit={handleSubmit} noValidate>
      {errorMessage && (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 p-4 flex items-start gap-3 animate-in fade-in duration-200 text-xs font-semibold text-red-700 leading-relaxed"
        >
          <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}

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
            disabled={isSubmitting}
            className={`appearance-none block w-full h-[44px] pl-11 pr-3.5 py-3 border rounded-xl shadow-xs placeholder-slate-400 focus:outline-hidden focus:ring-4 text-sm disabled:opacity-50 text-slate-900 bg-white transition-all ${
              emailError 
                ? 'border-rose-500 focus:ring-rose-500/15 focus:border-rose-500'
                : 'border-slate-300 focus:ring-blue-500/15 focus:border-blue-600'
            }`}
            placeholder="name@organization.com"
          />
        </div>
        {emailError && (
          <p className="mt-1.5 text-xs font-semibold text-rose-500">{emailError}</p>
        )}
      </div>

      <div className="pt-2">
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full h-[44px] flex justify-center items-center py-3 px-4 border border-transparent rounded-xl shadow-md text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 active:scale-[0.99] focus:outline-hidden focus:ring-4 focus:ring-blue-500/20 transition-all disabled:opacity-50 cursor-pointer"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin mr-2" />
              Sending...
            </>
          ) : (
            'Send Reset Link'
          )}
        </button>
      </div>

      <div className="flex items-center justify-center pt-2">
        <Link href="/login" className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-blue-600 transition-colors">
          <ArrowLeft size={14} />
          Back to Sign In
        </Link>
      </div>
    </form>
  );
}
