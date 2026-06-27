'use client';

import React, { useState } from 'react';
import { AuthService } from '@/services/auth-service';
import { Shield, Mail, Loader2, AlertCircle, CheckCircle, ArrowLeft } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [emailError, setEmailError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setEmailError(null);
    setSuccess(false);

    if (!email) {
      setEmailError('Please enter your email address.');
      // Focus field
      document.getElementById('email')?.focus();
      return;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      setEmailError('Please enter a valid email address.');
      document.getElementById('email')?.focus();
      return;
    }

    setIsSubmitting(true);
    try {
      await AuthService.forgotPassword({ email });
      setSuccess(true);
    } catch (err: any) {
      console.error(err);
      setError(err?.response?.data?.message || err?.message || 'Failed to send password recovery email.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEmailChange = (val: string) => {
    setEmail(val);
    if (emailError) {
      setEmailError(null);
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
          Forgot Password
        </h2>
        
        <p className="mt-2 text-center text-sm text-slate-600">
          Enter your email to receive a password reset link
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 border border-slate-200 sm:rounded-2xl sm:px-10 shadow-sm">
          {error && (
            <div className="rounded-xl bg-rose-50 border border-rose-100 p-4 flex items-start gap-3 mb-6 animate-in fade-in duration-300">
              <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
              <span className="text-xs font-semibold text-rose-700 leading-normal">
                {error}
              </span>
            </div>
          )}

          {success ? (
            <div className="text-center py-4">
              <div className="w-12 h-12 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 mx-auto mb-4 animate-bounce">
                <CheckCircle size={24} />
              </div>
              <h3 className="text-sm font-bold text-slate-900 mb-2">Check your email</h3>
              <p className="text-xs text-slate-600 leading-relaxed mb-6">
                If an organization account exists for <strong>{email}</strong>, we have sent a secure password reset link. Please check your inbox and spam folders.
              </p>
              <a 
                href="/login" 
                className="w-full flex justify-center py-2.5 px-4 border border-slate-300 rounded-xl shadow-xs text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Back to Login
              </a>
            </div>
          ) : (
            <form className="space-y-6" onSubmit={handleSubmit} noValidate>
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
                    disabled={isSubmitting}
                    className={`appearance-none block w-full pl-10 pr-3 py-2.5 border rounded-xl shadow-xs placeholder-slate-400 focus:outline-hidden focus:ring-2 text-sm disabled:opacity-50 text-slate-900 bg-white transition-all ${
                      emailError 
                        ? 'border-rose-500 focus:ring-rose-500/10 focus:border-rose-500'
                        : 'border-slate-300 focus:ring-blue-500 focus:border-blue-500'
                    }`}
                    placeholder="name@organization.com"
                  />
                </div>
                {emailError && (
                  <p className="mt-1.5 text-xs font-semibold text-rose-500">{emailError}</p>
                )}
              </div>

              <div>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-xl shadow-xs text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 focus:outline-hidden focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin mr-2" />
                      Sending link...
                    </>
                  ) : (
                    'Send Reset Link'
                  )}
                </button>
              </div>

              <div className="flex items-center justify-center">
                <a href="/login" className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-500 transition-colors">
                  <ArrowLeft size={14} />
                  Back to login
                </a>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
