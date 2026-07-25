'use client';

import React from 'react';
import AuthLogo from './auth-logo';

interface AuthLayoutProps {
  title: string;
  description?: string;
  subtitle?: string;
  children: React.ReactNode;
}

export default function AuthLayout({ title, description, subtitle, children }: AuthLayoutProps) {
  const subText = description || subtitle;

  return (
    <div className="min-h-screen flex flex-col justify-center items-center p-4 sm:p-6 lg:p-8 bg-slate-50 font-sans overflow-x-hidden">
      <div className="w-full max-w-[460px]">
        {/* Logo and Header */}
        <div className="flex flex-col items-center text-center mb-6 sm:mb-8">
          <div className="mb-4 sm:mb-5 flex justify-center">
            <AuthLogo />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            {title}
          </h1>
          {subText && (
            <p className="mt-2 text-sm text-slate-600 leading-relaxed max-w-sm">
              {subText}
            </p>
          )}
        </div>

        {/* Auth Card */}
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-md shadow-slate-200/50">
          {children}
        </div>
      </div>
    </div>
  );
}
