import React, { useState } from 'react';
import { XCircle, KeyRound } from 'lucide-react';

interface StaffResetPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (id: string, newPassword: string) => Promise<void>;
  staff: any;
  isSubmitting?: boolean;
}

export function StaffResetPasswordModal({
  isOpen,
  onClose,
  onSubmit,
  staff,
  isSubmitting = false
}: StaffResetPasswordModalProps) {
  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);

  if (!isOpen || !staff) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);

    if (!password.trim()) {
      setPasswordError('Please enter your password.');
      document.getElementById('newPassword')?.focus();
      return;
    }

    if (password.length < 8) {
      setPasswordError('Password must meet the minimum security requirements.');
      document.getElementById('newPassword')?.focus();
      return;
    }

    const anyUpper = /[A-Z]/.test(password);
    const anyLower = /[a-z]/.test(password);
    const anyDigit = /[0-9]/.test(password);
    if (!anyUpper || !anyLower || !anyDigit) {
      setPasswordError('Password must meet the minimum security requirements.');
      document.getElementById('newPassword')?.focus();
      return;
    }

    onSubmit(staff.id, password.trim()).then(() => {
      setPassword('');
    });
  };

  const handlePasswordChange = (val: string) => {
    setPassword(val);
    if (passwordError) {
      setPasswordError(null);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-55 flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-in fade-in duration-200">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2 text-slate-800">
            <KeyRound size={16} className="text-blue-500" />
            <h3 className="font-extrabold text-sm text-slate-900">
              Reset Staff Password
            </h3>
          </div>
          <button 
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-655 rounded-lg p-1 cursor-pointer"
          >
            <XCircle size={18} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4" noValidate>
          <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl text-blue-800 text-[10px] font-bold">
            Resetting password for: <span className="font-extrabold text-slate-900">{staff.name || staff.full_name}</span>
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              New Password
            </label>
            <input 
              id="newPassword"
              type="password" 
              value={password}
              onChange={(e) => handlePasswordChange(e.target.value)}
              placeholder="Min 8 characters, upper/lowercase/digit"
              className={`w-full px-3 py-2 border rounded-xl focus:outline-hidden focus:ring-1 focus:ring-blue-500 text-xs font-semibold text-slate-900 transition-all ${
                passwordError 
                  ? 'border-rose-500 focus:border-rose-500' 
                  : 'border-slate-200'
              }`}
            />
            {passwordError && (
              <p className="mt-1.5 text-xs font-semibold text-rose-500">{passwordError}</p>
            )}
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-50 rounded-xl border border-slate-200 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
            >
              {isSubmitting && <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></span>}
              <span>Save Password</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
export type StaffResetPasswordModalType = typeof StaffResetPasswordModal;
