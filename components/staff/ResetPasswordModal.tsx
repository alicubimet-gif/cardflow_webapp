import React, { useState, useEffect } from 'react';
import { XCircle, KeyRound, Loader2 } from 'lucide-react';

interface ResetPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (id: string, newPassword: string) => Promise<void>;
  staff: any;
  isSubmitting?: boolean;
}

export function ResetPasswordModal({
  isOpen,
  onClose,
  onSubmit,
  staff,
  isSubmitting = false
}: ResetPasswordModalProps) {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setPassword('');
      setConfirmPassword('');
      setError(null);
    }
  }, [isOpen]);

  if (!isOpen || !staff) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!password.trim() || !confirmPassword.trim()) {
      setError('Password fields are required.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    // Complexity validation
    if (!/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/[0-9]/.test(password)) {
      setError('Password must contain at least one uppercase letter, one lowercase letter, and one number.');
      return;
    }

    try {
      await onSubmit(staff.id, password.trim());
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.detail || err?.response?.data?.message || err?.message || 'Failed to reset password.');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        <div className="px-6 pt-6 pb-4 border-b border-[#DFE4EA] flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2 text-[#0B0F19]">
            <KeyRound size={18} className="text-blue-500" />
            <h3 className="font-bold text-base text-[#0B0F19]" style={{ fontFamily: 'Sora, sans-serif' }}>
              Reset Staff Password
            </h3>
          </div>
          <button 
            type="button" 
            onClick={onClose} 
            className="p-1.5 rounded-lg text-[#64748B] hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <XCircle size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs font-semibold">
              {error}
            </div>
          )}

          <div className="p-3.5 bg-blue-50 border border-blue-100 rounded-2xl text-blue-900 text-xs font-bold leading-normal">
            Resetting password for: <span className="text-slate-900 font-extrabold">{staff.name || staff.full_name}</span>
          </div>

          <div>
            <label className="text-xs font-semibold text-[#64748B] uppercase tracking-wider block mb-2">
              New Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Min 8 characters, upper, lower, digit"
              className="w-full h-11 px-4 border border-[#D1D5DB] rounded-xl focus:outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-blue-100 text-sm font-medium text-[#0B0F19]"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-[#64748B] uppercase tracking-wider block mb-2">
              Confirm New Password
            </label>
            <input
              type="password"
              required
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              placeholder="Re-enter new password"
              className="w-full h-11 px-4 border border-[#D1D5DB] rounded-xl focus:outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-blue-100 text-sm font-medium text-[#0B0F19]"
            />
          </div>

          <div className="flex gap-3 pt-4 border-t border-[#DFE4EA]">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 h-11 border border-[#DFE4EA] rounded-xl text-sm font-semibold text-[#64748B] hover:bg-slate-50 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 h-11 bg-[#2563EB] hover:bg-[#1D4ED8] text-white rounded-xl text-sm font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
            >
              {isSubmitting && <Loader2 size={16} className="animate-spin" />}
              Save Password
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
