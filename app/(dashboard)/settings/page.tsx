'use client';

import React from 'react';
import { useAuth } from '@/context/auth-context';
import { useDashboard } from '@/context/dashboard-context';
import { Settings as SettingsIcon, Shield, CreditCard, Building2, Bell } from 'lucide-react';
import { APP_BRAND } from '@/lib/branding';
import { InstallAppButton } from '@/components/pwa/install-app-button';

export default function SettingsPage() {
  const user = useAuth()?.user;
  const { orgName } = useDashboard();

  return (
    <div className="space-y-6">
      <div className="space-y-5">
        
        {/* Header */}
        <div className="bg-white border border-slate-200/60 rounded-2xl p-5 shadow-xs flex justify-between items-center flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-2 flex-wrap mb-2">
              <span className="text-[10px] font-bold text-blue-600 bg-blue-50 border border-blue-100 px-2.5 py-1 rounded-full uppercase tracking-wider">
                Administration
              </span>
            </div>
            <h1 className="text-xl font-bold text-slate-800 leading-tight" style={{ fontFamily: 'Sora' }}>
              Organization Settings
            </h1>
            <p className="text-sm text-slate-500 mt-1 flex items-center gap-1.5">
              <SettingsIcon size={13} />
              <span className="font-semibold text-slate-800">{orgName || user?.organization_name || `${APP_BRAND.name}`}</span>
              <span>•</span>
              <span className="capitalize">Manage application preferences and configurations</span>
            </p>
          </div>
          <div>
            <InstallAppButton />
          </div>
        </div>

        {/* Setting Sections */}
        <div>
          <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3">General Settings</h2>
          <div className="bg-white border border-slate-200/60 rounded-2xl px-4 py-3 flex items-center justify-between shadow-xs hover:border-slate-300 transition-colors">
            <div>
              <p className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                <Building2 size={16} className="text-slate-400" />
                General Preferences
              </p>
              <p className="text-xs text-slate-500 mt-0.5 ml-6">Configure timezone, localization, and branding.</p>
            </div>
            <button className="text-xs font-semibold text-blue-600 hover:underline bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-100 shrink-0 cursor-pointer">
              Configure
            </button>
          </div>
        </div>

        <div>
          <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3">Security</h2>
          <div className="bg-white border border-slate-200/60 rounded-2xl px-4 py-3 flex items-center justify-between shadow-xs hover:border-slate-300 transition-colors">
            <div>
              <p className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                <Shield size={16} className="text-slate-400" />
                Access Policies
              </p>
              <p className="text-xs text-slate-500 mt-0.5 ml-6">Manage 2FA, session policies, and API keys.</p>
            </div>
            <button className="text-xs font-semibold text-blue-600 hover:underline bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-100 shrink-0 cursor-pointer">
              Manage
            </button>
          </div>
        </div>

        <div>
          <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3">Billing & Plans</h2>
          <div className="bg-white border border-slate-200/60 rounded-2xl px-4 py-3 flex items-center justify-between shadow-xs hover:border-slate-300 transition-colors">
            <div>
              <p className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                <CreditCard size={16} className="text-slate-400" />
                Subscription
              </p>
              <p className="text-xs text-slate-500 mt-0.5 ml-6">View billing history and manage your current plan.</p>
            </div>
            <button className="text-xs font-semibold text-blue-600 hover:underline bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-100 shrink-0 cursor-pointer">
              View Plan
            </button>
          </div>
        </div>

        <div>
          <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3">Notifications</h2>
          <div className="bg-white border border-slate-200/60 rounded-2xl px-4 py-3 flex items-center justify-between shadow-xs hover:border-slate-300 transition-colors">
            <div>
              <p className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                <Bell size={16} className="text-slate-400" />
                Alerts & Emails
              </p>
              <p className="text-xs text-slate-500 mt-0.5 ml-6">Set up your preferences for receiving emails and notifications.</p>
            </div>
            <button className="text-xs font-semibold text-blue-600 hover:underline bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-100 shrink-0 cursor-pointer">
              Edit
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
