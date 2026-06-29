'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { Loader2, ShieldAlert } from 'lucide-react';
import { AuthService } from '@/services/auth-service';

export default function InviteLandingPage() {
  const params = useParams();
  const router = useRouter();
  const { login } = useAuth();
  const token = params?.token as string;
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
  const hasCalled = useRef(false);

  useEffect(() => {
    if (!token) {
      setError('Invitation link expired. Please contact your administrator for a new invitation.');
      setStatus('error');
      return;
    }

    if (hasCalled.current) return;
    hasCalled.current = true;

    async function verifyAndAutoLogin() {
      try {
        // 1. Call verification endpoint
        const data = await AuthService.verifyMagicToken(token);
        
        // The endpoint returns temp_password and email
        const email = data?.user?.email || data?.email;
        const tempPassword = data?.user?.temp_password || data?.temp_password;

        if (!email || !tempPassword) {
          throw new Error('Invalid token details returned.');
        }

        // 2. Perform auto-login using the credentials
        await login({ email, password: tempPassword });
        setStatus('success');
      } catch (err: any) {
        console.warn('[Invite] Magic token verification failed:', err.message || err);
        const code = err?.response?.data?.code;
        const msg = err?.response?.data?.message || err?.message || '';
        
        if (code === 'TOKEN_EXPIRED' || code === 'INVALID_OR_EXPIRED_TOKEN' || msg.toLowerCase().includes('expire') || msg.toLowerCase().includes('invalid')) {
          setError('Invitation link expired. Please contact your administrator for a new invitation.');
        } else {
          setError(msg || 'Invitation link expired. Please contact your administrator for a new invitation.');
        }
        setStatus('error');
      }
    }

    verifyAndAutoLogin();
  }, [token, login]);

  return (
    <div className="min-h-screen bg-[#090D1A] flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background gradients */}
      <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-blue-900/20 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] rounded-full bg-indigo-900/20 blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md bg-white/[0.03] border border-white/[0.08] backdrop-blur-xl rounded-3xl p-8 shadow-2xl relative z-10 text-center animate-in fade-in zoom-in-95 duration-500">
        {/* Brand Header */}
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-xs font-semibold text-blue-400 mb-3 tracking-wide uppercase">
            CardFlow WebApp
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight" style={{ fontFamily: 'Outfit, sans-serif' }}>
            Invitation Setup
          </h2>
          <p className="text-slate-400 text-xs mt-2">
            Verifying your invitation and setting up your session
          </p>
        </div>

        {status === 'verifying' && (
          <div className="py-10 flex flex-col items-center justify-center space-y-4">
            <div className="relative">
              <div className="w-16 h-16 rounded-full border-2 border-blue-500/20 flex items-center justify-center">
                <Loader2 size={32} className="text-blue-500 animate-spin" />
              </div>
              <div className="absolute inset-0 w-16 h-16 rounded-full border-t-2 border-transparent border-r-2 border-blue-500 animate-ping opacity-30" />
            </div>
            <p className="text-sm font-medium text-slate-300">
              Validating secure invite token...
            </p>
            <p className="text-xs text-slate-500">
              Please do not close this window
            </p>
          </div>
        )}

        {status === 'success' && (
          <div className="py-8 flex flex-col items-center justify-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <svg className="w-8 h-8 animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-sm font-semibold text-slate-200">
              Auto-login successful!
            </p>
            <p className="text-xs text-slate-400">
              Redirecting you to Password Setup...
            </p>
          </div>
        )}

        {status === 'error' && (
          <div className="py-6 flex flex-col items-center justify-center space-y-5">
            <div className="w-16 h-16 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-500">
              <ShieldAlert size={32} />
            </div>
            <div className="p-4 bg-rose-500/5 border border-rose-500/10 rounded-2xl text-rose-200 text-xs font-semibold leading-relaxed">
              {error}
            </div>
            <a 
              href="/login" 
              className="inline-flex items-center justify-center px-6 h-11 bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.1] text-white rounded-xl text-xs font-semibold tracking-wide transition-all duration-200 cursor-pointer"
            >
              Return to Login
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
