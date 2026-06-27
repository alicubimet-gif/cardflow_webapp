import React, { useState, useEffect } from 'react';
import { XCircle, Loader2 } from 'lucide-react';
import { cleanText, restrictText, restrictNumber, validateEmail, validateMobile } from '@/utils/validation';
import { PhoneInput } from '@/components/ui/PhoneInput';

interface EditStaffModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (id: string, payload: any) => Promise<void>;
  staff: any;
  isSubmitting?: boolean;
}

export function EditStaffModal({
  isOpen,
  onClose,
  onSubmit,
  staff,
  isSubmitting = false
}: EditStaffModalProps) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [status, setStatus] = useState('active');
  const [error, setError] = useState<string | null>(null);

  const [fieldErrors, setFieldErrors] = useState<{ fullName?: string; email?: string; phone?: string }>({});

  useEffect(() => {
    if (isOpen && staff) {
      setFullName(staff.name || staff.full_name || '');
      setEmail(staff.email || staff.email_address || '');
      setPhone(staff.phone || '');
      setStatus(staff.status === 'active' || staff.is_active ? 'active' : 'inactive');
      setError(null);
      setFieldErrors({});
    }
  }, [isOpen, staff]);

  if (!isOpen || !staff) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const newErrors: { fullName?: string; email?: string; phone?: string } = {};

    const cleanedName = cleanText(fullName);
    if (!cleanedName) {
      newErrors.fullName = 'This field is required.';
    } else if (cleanedName.length < 2) {
      newErrors.fullName = 'Full name must be at least 2 characters.';
    }

    const emailErr = validateEmail(email);
    if (emailErr) {
      newErrors.email = emailErr;
    }

    const phoneErr = validateMobile(phone);
    if (phoneErr) {
      newErrors.phone = phoneErr;
    }

    if (Object.keys(newErrors).length > 0) {
      setFieldErrors(newErrors);
      const firstInvalidField = newErrors.fullName ? 'fullName' : (newErrors.email ? 'email' : 'phone');
      document.getElementById(firstInvalidField)?.focus();
      return;
    }

    try {
      await onSubmit(staff.id, {
        full_name: cleanedName,
        name: cleanedName,
        email: email.trim().toLowerCase(),
        email_address: email.trim().toLowerCase(),
        phone: phone.trim(),
        mobile_number: phone.trim(),
        status,
        is_active: status === 'active'
      });
      onClose();
    } catch (err: any) {
      if (err?.response?.data) {
        const errData = err.response.data;
        const backendErrors: any = {};
        const errorSource = errData.errors || errData;
        if (errorSource.email) backendErrors.email = Array.isArray(errorSource.email) ? errorSource.email[0] : errorSource.email;
        if (errorSource.phone || errorSource.mobile_number) backendErrors.phone = Array.isArray(errorSource.phone || errorSource.mobile_number) ? (errorSource.phone || errorSource.mobile_number)[0] : (errorSource.phone || errorSource.mobile_number);
        if (errorSource.name || errorSource.full_name) backendErrors.fullName = Array.isArray(errorSource.name || errorSource.full_name) ? (errorSource.name || errorSource.full_name)[0] : (errorSource.name || errorSource.full_name);
        
        if (Object.keys(backendErrors).length > 0) {
          setFieldErrors(backendErrors);
          const firstField = backendErrors.fullName ? 'fullName' : (backendErrors.email ? 'email' : 'phone');
          document.getElementById(firstField)?.focus();
        } else {
          setError(errData.detail || errData.message || 'Failed to update staff profile.');
        }
      } else {
        setError(err?.message || 'Failed to update staff profile.');
      }
    }
  };

  const handleFullNameChange = (val: string) => {
    const restricted = restrictText(val);
    setFullName(restricted);
    if (fieldErrors.fullName) {
      setFieldErrors(prev => {
        const next = { ...prev };
        delete next.fullName;
        return next;
      });
    }
  };

  const handleEmailChange = (val: string) => {
    const normalized = val.toLowerCase().replace(/\s/g, '');
    setEmail(normalized);
    
    // Validate email layout in real-time
    const emailErr = validateEmail(normalized);
    setFieldErrors(prev => ({
      ...prev,
      email: emailErr || undefined
    }));
  };

  const handlePhoneChange = (val: string) => {
    setPhone(val);
    
    // Validate mobile format in real-time
    const phoneErr = validateMobile(val);
    setFieldErrors(prev => ({
      ...prev,
      phone: phoneErr || undefined
    }));
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="px-6 pt-6 pb-4 border-b border-[#DFE4EA] flex items-center justify-between bg-slate-50/50">
          <h3 className="font-bold text-base text-[#0B0F19]" style={{ fontFamily: 'Sora, sans-serif' }}>
            Update Staff Profile
          </h3>
          <button 
            type="button" 
            onClick={onClose} 
            className="p-1.5 rounded-lg text-[#64748B] hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <XCircle size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1" noValidate>
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs font-semibold">
              {error}
            </div>
          )}

          <div>
            <label className="text-xs font-semibold text-[#64748B] uppercase tracking-wider block mb-2">
              Full Name
            </label>
            <input
              id="fullName"
              type="text"
              value={fullName}
              onChange={e => handleFullNameChange(e.target.value)}
              placeholder="e.g. Alexander Pierce"
              className={`w-full h-11 px-4 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-100 text-sm font-medium text-[#0B0F19] transition-all ${
                fieldErrors.fullName 
                  ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500/10'
                  : 'border-[#D1D5DB] focus:border-[#2563EB]'
              }`}
            />
            {fieldErrors.fullName && (
              <p className="mt-1.5 text-xs font-semibold text-rose-500">{fieldErrors.fullName}</p>
            )}
          </div>

          <div>
            <label className="text-xs font-semibold text-[#64748B] uppercase tracking-wider block mb-2">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={e => handleEmailChange(e.target.value)}
              placeholder="e.g. alexander@cardflow.com"
              className={`w-full h-11 px-4 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-100 text-sm font-medium text-[#0B0F19] transition-all ${
                fieldErrors.email 
                  ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500/10'
                  : 'border-[#D1D5DB] focus:border-[#2563EB]'
              }`}
            />
            {fieldErrors.email && (
              <p className="mt-1.5 text-xs font-semibold text-rose-500">{fieldErrors.email}</p>
            )}
          </div>

          <div>
            <label className="text-xs font-semibold text-[#64748B] uppercase tracking-wider block mb-2">
              Phone Number
            </label>
            <input
              id="phone"
              type="tel"
              inputMode="numeric"
              value={phone}
              onChange={e => handlePhoneChange(e.target.value)}
              placeholder="e.g. 9876543210"
              className={`w-full h-11 px-4 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-100 text-sm font-medium text-[#0B0F19] transition-all ${
                fieldErrors.phone 
                  ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500/10'
                  : 'border-[#D1D5DB] focus:border-[#2563EB]'
              }`}
            />
            {fieldErrors.phone && (
              <p className="mt-1.5 text-xs font-semibold text-rose-500">{fieldErrors.phone}</p>
            )}
          </div>

          <div>
            <label className="text-xs font-semibold text-[#64748B] uppercase tracking-wider block mb-2">
              Status
            </label>
            <select
              value={status}
              onChange={e => setStatus(e.target.value)}
              className="w-full h-11 px-4 border border-[#D1D5DB] rounded-xl bg-white focus:outline-none focus:border-[#2563EB] text-sm font-medium text-[#0B0F19] cursor-pointer"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
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
              Update Profile
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

