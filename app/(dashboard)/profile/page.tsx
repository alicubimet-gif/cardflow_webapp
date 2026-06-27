'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/auth-context';
import { useDashboard } from '@/context/dashboard-context';
import { AuthService } from '@/services/auth-service';
import { Loader2 } from 'lucide-react';

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const { orgName } = useDashboard();

  // Change Password state
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [changePasswordError, setChangePasswordError] = useState<string | null>(null);
  const [changePasswordSuccess, setChangePasswordSuccess] = useState(false);
  const [isChangingPasswordSubmitting, setIsChangingPasswordSubmitting] = useState(false);

  if (!user) return null;

  const handleChangePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setChangePasswordError(null);
    setChangePasswordSuccess(false);

    if (!currentPassword || !newPassword || !confirmNewPassword) {
      setChangePasswordError('All password fields are required.');
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setChangePasswordError('New passwords do not match.');
      return;
    }

    if (newPassword.length < 8) {
      setChangePasswordError('New password must be at least 8 characters long.');
      return;
    }

    // Password complexity check
    const anyUpper = /[A-Z]/.test(newPassword);
    const anyLower = /[a-z]/.test(newPassword);
    const anyDigit = /[0-9]/.test(newPassword);
    if (!anyUpper || !anyLower || !anyDigit) {
      setChangePasswordError('New password must contain at least one uppercase letter, one lowercase letter, and one number.');
      return;
    }

    setIsChangingPasswordSubmitting(true);
    try {
      await AuthService.changePassword({
        current_password: currentPassword,
        new_password: newPassword,
      });
      setChangePasswordSuccess(true);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
      setIsChangingPassword(false);
    } catch (err: any) {
      console.error(err);
      setChangePasswordError(err?.response?.data?.message || err?.response?.data?.detail || err?.message || 'Failed to update password.');
    } finally {
      setIsChangingPasswordSubmitting(false);
    }
  };

  return (
    <div className="space-y-4 max-w-2xl mx-auto">
      <h2 className="text-base font-bold text-[#0B0F19]" style={{ fontFamily: 'Sora' }}>Profile</h2>

      {changePasswordSuccess && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-emerald-800 text-sm font-medium animate-in fade-in duration-300 relative flex flex-col items-center text-center gap-2">
          <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <span>Password updated successfully.</span>
          <button
            onClick={() => setChangePasswordSuccess(false)}
            className="text-xs text-emerald-600 hover:text-emerald-700 underline mt-1 cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {!isChangingPassword ? (
        <>
          <div className="bg-white border border-[#DFE4EA] rounded-2xl p-6 text-center shadow-sm">
            <div className="w-20 h-20 mx-auto rounded-2xl bg-[#2563EB]/10 flex items-center justify-center text-[#2563EB] font-bold text-2xl mb-3" style={{ fontFamily: 'Sora' }}>
              {user.name?.slice(0, 2)?.toUpperCase()}
            </div>
            <h2 className="text-lg font-bold text-[#0B0F19]" style={{ fontFamily: 'Sora' }}>{user.name}</h2>
            <p className="text-sm text-[#64748B] mt-0.5">{user.email}</p>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-500 border border-slate-200 mt-2">
              {user.role?.replace('_', ' ')}
            </span>
          </div>

          <div className="bg-white border border-[#DFE4EA] rounded-2xl divide-y divide-[#DFE4EA] shadow-sm">
            {[
              { label: 'Organization', value: orgName || user.organization_name || '—' },
              { label: 'Type', value: user.organization_type || '—' },
              { label: 'Role', value: user.role?.replace(/_/g, ' ') || '—' },
            ].map(row => (
              <div key={row.label} className="flex justify-between items-center px-5 py-3.5">
                <span className="text-sm text-[#64748B] font-medium">{row.label}</span>
                <span className="text-sm font-semibold text-[#0B0F19] capitalize">{row.value}</span>
              </div>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => {
                setIsChangingPassword(true);
                setChangePasswordError(null);
                setChangePasswordSuccess(false);
              }}
              className="flex-1 h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-sm font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              Change Password
            </button>
            <button
              onClick={logout}
              className="flex-1 h-12 bg-red-600 hover:bg-red-700 text-white rounded-2xl text-sm font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              Sign Out
            </button>
          </div>
        </>
      ) : (
        <form onSubmit={handleChangePasswordSubmit} className="bg-white border border-[#DFE4EA] rounded-2xl p-6 shadow-sm space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <h3 className="text-sm font-bold text-[#0B0F19]" style={{ fontFamily: 'Sora' }}>Update Password</h3>

          {changePasswordError && (
            <div className="p-3.5 bg-rose-50 border border-rose-100 rounded-xl text-rose-700 text-xs font-semibold leading-relaxed">
              {changePasswordError}
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider block">
              Current Password
            </label>
            <input
              type="password"
              autoComplete="current-password"
              required
              value={currentPassword}
              onChange={e => setCurrentPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full h-11 px-4 border border-[#DFE4EA] rounded-xl focus:outline-none focus:border-blue-500 text-sm font-semibold text-[#0B0F19] bg-white"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider block">
              New Password
            </label>
            <input
              type="password"
              autoComplete="new-password"
              required
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full h-11 px-4 border border-[#DFE4EA] rounded-xl focus:outline-none focus:border-blue-500 text-sm font-semibold text-[#0B0F19] bg-white"
            />
            <p className="text-[9px] text-[#64748B]">
              Must be at least 8 characters, with 1 uppercase, 1 lowercase, and 1 number.
            </p>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider block">
              Confirm New Password
            </label>
            <input
              type="password"
              autoComplete="new-password"
              required
              value={confirmNewPassword}
              onChange={e => setConfirmNewPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full h-11 px-4 border border-[#DFE4EA] rounded-xl focus:outline-none focus:border-blue-500 text-sm font-semibold text-[#0B0F19] bg-white"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => {
                setIsChangingPassword(false);
                setCurrentPassword('');
                setNewPassword('');
                setConfirmNewPassword('');
                setChangePasswordError(null);
              }}
              className="flex-1 h-11 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isChangingPasswordSubmitting}
              className="flex-1 h-11 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              {isChangingPasswordSubmitting ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  Updating...
                </>
              ) : (
                'Update Password'
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
