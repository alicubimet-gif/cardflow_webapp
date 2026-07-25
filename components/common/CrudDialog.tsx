import React, { useEffect, useState } from 'react';
import { XCircle, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/useToast';

export interface FieldConfig {
  name: string;
  label: string;
  type: 'text' | 'select' | 'email' | 'password' | 'textarea' | 'checkbox';
  placeholder?: string;
  options?: { value: string; label: string }[];
  required?: boolean;
}

interface CrudDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  mode: 'create' | 'edit' | 'view';
  fields: FieldConfig[];
  initialValues?: any;
  onSave: (data: any) => Promise<any> | void;
  isLoading?: boolean;
}

export function CrudDialog({
  open,
  onOpenChange,
  title,
  mode,
  fields,
  initialValues,
  onSave,
  isLoading = false,
}: CrudDialogProps) {
  const [formValues, setFormValues] = useState<any>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      const defaults: any = {};
      fields.forEach((f) => {
        defaults[f.name] = initialValues?.[f.name] ?? (f.type === 'checkbox' ? false : '');
      });
      setFormValues(defaults);
      setErrors({});
    }
  }, [open, fields, initialValues]);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === 'view') {
      onOpenChange(false);
      return;
    }

    const newErrors: Record<string, string> = {};
    fields.forEach((f) => {
      if (f.required && !formValues[f.name]) {
        newErrors[f.name] = `${f.label} is required.`;
      }
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      await onSave(formValues);
      onOpenChange(false);
    } catch (err: any) {
      const responseData = err?.response?.data;
      if (responseData && typeof responseData === 'object') {
        const serverErrors: Record<string, string> = {};
        Object.keys(responseData).forEach((key) => {
          serverErrors[key] = Array.isArray(responseData[key]) ? responseData[key][0] : responseData[key];
        });
        setErrors(serverErrors);
        
        const hasFieldErrors = Object.keys(serverErrors).some(k => fields.some(f => f.name === k));
        if (!hasFieldErrors) {
          toast(responseData.detail || responseData.message || 'Failed to save record.', 'error');
        }
      } else {
        toast('An unexpected error occurred.', 'error');
      }
    }
  };

  const handleFieldChange = (name: string, value: any) => {
    setFormValues((prev: any) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden">
        <div className="px-6 pt-6 pb-4 border-b border-[#DFE4EA] flex items-center justify-between">
          <h3 className="font-semibold text-base text-[#0B0F19]" style={{ fontFamily: 'Sora, sans-serif' }}>
            {title}
          </h3>
          <button type="button" onClick={() => onOpenChange(false)} className="p-2 rounded-xl text-[#64748B] hover:bg-slate-100 transition-colors cursor-pointer">
            <XCircle size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4" noValidate>
          <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
            {fields.map((f) => (
              <div key={f.name}>
                <label className="text-xs font-semibold text-[#64748B] uppercase tracking-wider block mb-2">
                  {f.label}
                </label>
                {f.type === 'select' ? (
                  <select
                    disabled={mode === 'view' || isLoading}
                    value={formValues[f.name] ?? ''}
                    onChange={(e) => handleFieldChange(f.name, e.target.value)}
                    className="w-full h-11 px-4 border border-[#D1D5DB] rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-100 text-sm font-medium text-[#0B0F19] bg-white cursor-pointer transition-all disabled:bg-slate-50 disabled:cursor-not-allowed"
                  >
                    <option value="">Select {f.label}</option>
                    {f.options?.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                ) : f.type === 'textarea' ? (
                  <textarea
                    disabled={mode === 'view' || isLoading}
                    value={formValues[f.name] ?? ''}
                    onChange={(e) => handleFieldChange(f.name, e.target.value)}
                    placeholder={f.placeholder}
                    rows={3}
                    className={`w-full p-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-100 text-sm font-medium text-[#0B0F19] transition-all disabled:bg-slate-50 ${
                      errors[f.name]
                        ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500/10'
                        : 'border-[#D1D5DB] focus:border-[#2563EB]'
                    }`}
                  />
                ) : f.type === 'checkbox' ? (
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      disabled={mode === 'view' || isLoading}
                      checked={Boolean(formValues[f.name])}
                      onChange={(e) => handleFieldChange(f.name, e.target.checked)}
                      className="h-5 w-5 rounded-md border-gray-355 text-blue-600 focus:ring-blue-500 disabled:opacity-50"
                    />
                  </div>
                ) : (
                  <input
                    disabled={mode === 'view' || isLoading}
                    type={f.type}
                    value={formValues[f.name] ?? ''}
                    onChange={(e) => handleFieldChange(f.name, e.target.value)}
                    placeholder={f.placeholder}
                    className={`w-full h-11 px-4 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-100 text-sm font-medium text-[#0B0F19] transition-all disabled:bg-slate-50 ${
                      errors[f.name]
                        ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500/10'
                        : 'border-[#D1D5DB] focus:border-[#2563EB]'
                    }`}
                  />
                )}
                {errors[f.name] && (
                  <p className="mt-1.5 text-xs font-semibold text-rose-500">{errors[f.name]}</p>
                )}
              </div>
            ))}
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="flex-1 h-11 border border-[#DFE4EA] rounded-xl text-sm font-semibold text-[#64748B] hover:bg-slate-50 transition-colors cursor-pointer"
            >
              {mode === 'view' ? 'Close' : 'Cancel'}
            </button>
            {mode !== 'view' && (
              <button
                type="submit"
                disabled={isLoading}
                className="flex-1 h-11 bg-[#2563EB] hover:bg-[#1D4ED8] text-white rounded-xl text-sm font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
              >
                {isLoading && <Loader2 size={16} className="animate-spin" />}
                Save
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
